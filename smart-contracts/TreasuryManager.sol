// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./MultiSigGovernance.sol";

/**
 * @title TreasuryManager
 * @dev Autonomous treasury management with DeFi yield optimization
 */
contract TreasuryManager is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURY_ADMIN_ROLE = keccak256("TREASURY_ADMIN_ROLE");
    bytes32 public constant STRATEGY_EXECUTOR_ROLE = keccak256("STRATEGY_EXECUTOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    struct Asset {
        address token;
        uint256 balance;
        uint256 allocatedBalance;
        uint256 yieldEarned;
        uint256 targetAllocation; // Percentage (basis points)
        bool isActive;
        uint256 riskLevel; // 1-10 scale
        uint256 lastRebalance;
    }

    struct Strategy {
        string name;
        address strategyContract;
        uint256 totalValueLocked;
        uint256 currentAPY;
        uint256 riskScore;
        uint256 maxAllocation;
        bool isActive;
        uint256 lastHarvest;
    }

    struct TreasuryMetrics {
        uint256 totalValue;
        uint256 totalYieldEarned;
        uint256 averageAPY;
        uint256 riskScore;
        uint256 diversificationIndex;
        uint256 lastUpdate;
    }

    // State variables
    mapping(address => Asset) public assets;
    mapping(bytes32 => Strategy) public strategies;
    mapping(address => uint256) public strategistRewards;
    
    address[] public assetList;
    bytes32[] public strategyList;
    
    TreasuryMetrics public metrics;
    MultiSigGovernance public governance;
    
    uint256 public constant REBALANCE_THRESHOLD = 500; // 5% in basis points
    uint256 public constant MAX_RISK_SCORE = 1000; // 10.00 max risk
    uint256 public constant STRATEGIST_FEE = 200; // 2% performance fee
    uint256 public emergencyWithdrawDelay = 24 hours;

    // Events
    event AssetAdded(address indexed token, uint256 targetAllocation, uint256 riskLevel);
    event StrategyAdded(bytes32 indexed strategyId, string name, address strategyContract);
    event Rebalanced(uint256 totalValue, uint256 timestamp);
    event YieldHarvested(bytes32 indexed strategyId, uint256 amount, uint256 fee);
    event EmergencyWithdraw(address indexed token, uint256 amount, string reason);
    event RiskParametersUpdated(uint256 maxRiskScore, uint256 rebalanceThreshold);

    modifier onlyGovernance() {
        require(address(governance) != address(0), "Governance not set");
        require(governance.isAuthorized(msg.sender), "Not authorized by governance");
        _;
    }

    modifier onlyStrategy() {
        require(hasRole(STRATEGY_EXECUTOR_ROLE, msg.sender), "Not strategy executor");
        _;
    }

    modifier validAsset(address token) {
        require(assets[token].isActive, "Asset not active");
        _;
    }

    constructor(address _governance) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURY_ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        governance = MultiSigGovernance(_governance);
        
        // Initialize metrics
        metrics.lastUpdate = block.timestamp;
    }

    /**
     * @dev Add a new asset to treasury management
     */
    function addAsset(
        address token,
        uint256 targetAllocation,
        uint256 riskLevel
    ) external onlyRole(TREASURY_ADMIN_ROLE) {
        require(token != address(0), "Invalid token address");
        require(targetAllocation <= 10000, "Invalid allocation"); // Max 100%
        require(riskLevel <= 10, "Invalid risk level");
        require(!assets[token].isActive, "Asset already exists");

        assets[token] = Asset({
            token: token,
            balance: 0,
            allocatedBalance: 0,
            yieldEarned: 0,
            targetAllocation: targetAllocation,
            isActive: true,
            riskLevel: riskLevel,
            lastRebalance: block.timestamp
        });

        assetList.push(token);
        emit AssetAdded(token, targetAllocation, riskLevel);
    }

    /**
     * @dev Add a new yield strategy
     */
    function addStrategy(
        string calldata name,
        address strategyContract,
        uint256 maxAllocation,
        uint256 riskScore
    ) external onlyRole(TREASURY_ADMIN_ROLE) {
        require(strategyContract != address(0), "Invalid strategy contract");
        require(maxAllocation <= 10000, "Invalid max allocation");
        require(riskScore <= MAX_RISK_SCORE, "Risk score too high");

        bytes32 strategyId = keccak256(abi.encodePacked(name, strategyContract));
        require(!strategies[strategyId].isActive, "Strategy already exists");

        strategies[strategyId] = Strategy({
            name: name,
            strategyContract: strategyContract,
            totalValueLocked: 0,
            currentAPY: 0,
            riskScore: riskScore,
            maxAllocation: maxAllocation,
            isActive: true,
            lastHarvest: block.timestamp
        });

        strategyList.push(strategyId);
        emit StrategyAdded(strategyId, name, strategyContract);
    }

    /**
     * @dev Deposit funds to treasury
     */
    function depositAsset(
        address token,
        uint256 amount
    ) external nonReentrant validAsset(token) {
        require(amount > 0, "Invalid amount");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        assets[token].balance += amount;
        
        // Update metrics
        updateTreasuryMetrics();
        
        // Check if rebalancing is needed
        if (shouldRebalance()) {
            _rebalancePortfolio();
        }
    }

    /**
     * @dev Execute yield strategy allocation
     */
    function executeStrategy(
        bytes32 strategyId,
        address token,
        uint256 amount
    ) external onlyStrategy nonReentrant {
        require(strategies[strategyId].isActive, "Strategy not active");
        require(assets[token].isActive, "Asset not active");
        require(amount <= assets[token].balance, "Insufficient balance");

        Strategy storage strategy = strategies[strategyId];
        Asset storage asset = assets[token];

        // Validate allocation limits
        uint256 newTVL = strategy.totalValueLocked + amount;
        require(
            newTVL <= (getTotalTreasuryValue() * strategy.maxAllocation) / 10000,
            "Exceeds strategy allocation limit"
        );

        // Transfer to strategy contract
        IERC20(token).safeTransfer(strategy.strategyContract, amount);
        
        // Update balances
        asset.balance -= amount;
        asset.allocatedBalance += amount;
        strategy.totalValueLocked += amount;

        updateTreasuryMetrics();
    }

    /**
     * @dev Harvest yield from strategies
     */
    function harvestStrategy(bytes32 strategyId) external onlyStrategy nonReentrant {
        Strategy storage strategy = strategies[strategyId];
        require(strategy.isActive, "Strategy not active");

        // Call strategy harvest function (simplified)
        uint256 harvestedAmount = _callStrategyHarvest(strategy.strategyContract);
        
        if (harvestedAmount > 0) {
            // Calculate strategist fee
            uint256 strategistFee = (harvestedAmount * STRATEGIST_FEE) / 10000;
            strategistRewards[msg.sender] += strategistFee;

            // Update strategy TVL and metrics
            strategy.lastHarvest = block.timestamp;
            
            // Distribute yield across assets proportionally
            _distributeYield(harvestedAmount - strategistFee);

            emit YieldHarvested(strategyId, harvestedAmount, strategistFee);
        }

        updateTreasuryMetrics();
    }

    /**
     * @dev Automatic portfolio rebalancing
     */
    function rebalancePortfolio() external onlyStrategy nonReentrant {
        require(shouldRebalance(), "Rebalancing not needed");
        _rebalancePortfolio();
    }

    /**
     * @dev Internal rebalancing logic
     */
    function _rebalancePortfolio() internal {
        uint256 totalValue = getTotalTreasuryValue();
        
        for (uint256 i = 0; i < assetList.length; i++) {
            address token = assetList[i];
            Asset storage asset = assets[token];
            
            if (!asset.isActive) continue;

            uint256 targetValue = (totalValue * asset.targetAllocation) / 10000;
            uint256 currentValue = asset.balance + asset.allocatedBalance;
            
            // Rebalance if deviation exceeds threshold
            if (currentValue > targetValue) {
                uint256 excess = currentValue - targetValue;
                if (excess > (targetValue * REBALANCE_THRESHOLD) / 10000) {
                    // Withdraw from lowest yielding strategy
                    _withdrawFromStrategy(token, excess);
                }
            } else if (currentValue < targetValue) {
                uint256 deficit = targetValue - currentValue;
                if (deficit > (targetValue * REBALANCE_THRESHOLD) / 10000) {
                    // Allocate to highest yielding strategy
                    _allocateToStrategy(token, deficit);
                }
            }
            
            asset.lastRebalance = block.timestamp;
        }

        emit Rebalanced(totalValue, block.timestamp);
    }

    /**
     * @dev Check if rebalancing is needed
     */
    function shouldRebalance() public view returns (bool) {
        uint256 totalValue = getTotalTreasuryValue();
        
        for (uint256 i = 0; i < assetList.length; i++) {
            Asset storage asset = assets[assetList[i]];
            if (!asset.isActive) continue;

            uint256 targetValue = (totalValue * asset.targetAllocation) / 10000;
            uint256 currentValue = asset.balance + asset.allocatedBalance;
            uint256 deviation = currentValue > targetValue ? 
                currentValue - targetValue : targetValue - currentValue;

            if (deviation > (targetValue * REBALANCE_THRESHOLD) / 10000) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        string calldata reason
    ) external onlyRole(EMERGENCY_ROLE) nonReentrant {
        require(assets[token].isActive, "Asset not active");
        require(amount <= assets[token].balance, "Insufficient balance");

        assets[token].balance -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);

        emit EmergencyWithdraw(token, amount, reason);
        updateTreasuryMetrics();
    }

    /**
     * @dev Update treasury metrics
     */
    function updateTreasuryMetrics() public {
        uint256 totalValue = 0;
        uint256 totalYield = 0;
        uint256 weightedAPY = 0;
        uint256 weightedRisk = 0;

        for (uint256 i = 0; i < assetList.length; i++) {
            Asset storage asset = assets[assetList[i]];
            if (!asset.isActive) continue;

            uint256 assetValue = asset.balance + asset.allocatedBalance;
            totalValue += assetValue;
            totalYield += asset.yieldEarned;
            
            weightedRisk += (assetValue * asset.riskLevel);
        }

        // Calculate diversification index (simplified Herfindahl index)
        uint256 diversificationIndex = calculateDiversificationIndex();

        metrics = TreasuryMetrics({
            totalValue: totalValue,
            totalYieldEarned: totalYield,
            averageAPY: weightedAPY,
            riskScore: totalValue > 0 ? weightedRisk / totalValue : 0,
            diversificationIndex: diversificationIndex,
            lastUpdate: block.timestamp
        });
    }

    /**
     * @dev Get total treasury value
     */
    function getTotalTreasuryValue() public view returns (uint256) {
        uint256 totalValue = 0;
        
        for (uint256 i = 0; i < assetList.length; i++) {
            Asset storage asset = assets[assetList[i]];
            if (asset.isActive) {
                totalValue += asset.balance + asset.allocatedBalance;
            }
        }
        
        return totalValue;
    }

    /**
     * @dev Calculate portfolio diversification index
     */
    function calculateDiversificationIndex() internal view returns (uint256) {
        uint256 totalValue = getTotalTreasuryValue();
        if (totalValue == 0) return 0;

        uint256 sumSquaredWeights = 0;
        
        for (uint256 i = 0; i < assetList.length; i++) {
            Asset storage asset = assets[assetList[i]];
            if (asset.isActive) {
                uint256 weight = ((asset.balance + asset.allocatedBalance) * 10000) / totalValue;
                sumSquaredWeights += (weight * weight) / 10000;
            }
        }

        // Return inverse of Herfindahl index (higher = more diversified)
        return sumSquaredWeights > 0 ? 10000 / sumSquaredWeights : 0;
    }

    // Internal helper functions
    function _callStrategyHarvest(address strategyContract) internal returns (uint256) {
        // Simplified strategy call - in production, use proper interface
        (bool success, bytes memory data) = strategyContract.call(
            abi.encodeWithSignature("harvest()")
        );
        
        if (success && data.length >= 32) {
            return abi.decode(data, (uint256));
        }
        
        return 0;
    }

    function _distributeYield(uint256 yieldAmount) internal {
        uint256 totalAllocated = 0;
        
        // Calculate total allocated value
        for (uint256 i = 0; i < assetList.length; i++) {
            if (assets[assetList[i]].isActive) {
                totalAllocated += assets[assetList[i]].allocatedBalance;
            }
        }

        if (totalAllocated == 0) return;

        // Distribute yield proportionally
        for (uint256 i = 0; i < assetList.length; i++) {
            Asset storage asset = assets[assetList[i]];
            if (asset.isActive && asset.allocatedBalance > 0) {
                uint256 assetYield = (yieldAmount * asset.allocatedBalance) / totalAllocated;
                asset.yieldEarned += assetYield;
                asset.balance += assetYield;
            }
        }
    }

    function _withdrawFromStrategy(address token, uint256 amount) internal {
        // Find strategy with lowest APY for this token and withdraw
        // Simplified implementation
    }

    function _allocateToStrategy(address token, uint256 amount) internal {
        // Find strategy with highest APY for this token and allocate
        // Simplified implementation
    }

    /**
     * @dev Pause contract operations
     */
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }

    /**
     * @dev Get asset information
     */
    function getAsset(address token) external view returns (Asset memory) {
        return assets[token];
    }

    /**
     * @dev Get strategy information
     */
    function getStrategy(bytes32 strategyId) external view returns (Strategy memory) {
        return strategies[strategyId];
    }

    /**
     * @dev Get all assets
     */
    function getAllAssets() external view returns (address[] memory) {
        return assetList;
    }

    /**
     * @dev Get all strategies
     */
    function getAllStrategies() external view returns (bytes32[] memory) {
        return strategyList;
    }
}