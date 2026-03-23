// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title TreasuryManager
 * @dev Autonomous corporate treasury management with DeFi yield optimization
 * Core component of PerkOS TreasuryAI system
 */
contract TreasuryManager is AccessControl, ReentrancyGuard, Pausable {
    // =============================================================
    //                            CONSTANTS
    // =============================================================
    
    bytes32 public constant CFO_ROLE = keccak256("CFO_ROLE");
    bytes32 public constant TREASURY_AGENT_ROLE = keccak256("TREASURY_AGENT_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    // Risk tiers for asset allocation
    uint256 public constant TIER_1_MAX = 7000; // 70% - Conservative (Lido stETH)
    uint256 public constant TIER_2_MAX = 2500; // 25% - Moderate (Locus USDC)
    uint256 public constant TIER_3_MAX = 500;  // 5% - Active (Uniswap V3)
    uint256 public constant BASIS_POINTS = 10000;

    // =============================================================
    //                            STORAGE
    // =============================================================
    
    struct AssetAllocation {
        uint256 tier1Allocation; // Conservative allocation %
        uint256 tier2Allocation; // Moderate allocation %
        uint256 tier3Allocation; // Active allocation %
        uint256 lastRebalance;   // Timestamp of last rebalance
    }
    
    struct YieldStrategy {
        address protocol;         // Protocol address
        uint256 allocatedAmount; // Amount currently allocated
        uint256 targetAPY;       // Target APY in basis points
        uint256 riskScore;       // Risk score 1-100
        bool active;             // Is strategy active
    }
    
    struct TreasuryMetrics {
        uint256 totalAssets;     // Total assets under management
        uint256 totalYield;      // Total yield generated
        uint256 avgAPY;          // Average APY across strategies
        uint256 lastUpdate;     // Last metrics update
    }
    
    // Asset allocation per treasury
    mapping(bytes32 => AssetAllocation) public allocations;
    
    // Yield strategies by treasury ID and strategy index
    mapping(bytes32 => mapping(uint256 => YieldStrategy)) public strategies;
    mapping(bytes32 => uint256) public strategyCount;
    
    // Treasury metrics
    mapping(bytes32 => TreasuryMetrics) public metrics;
    
    // Supported assets
    mapping(address => bool) public supportedAssets;
    
    // Oracle feeds for price data
    mapping(address => AggregatorV3Interface) public priceFeeds;
    
    // Emergency limits
    uint256 public maxSlippage = 300; // 3% max slippage
    uint256 public emergencyWithdrawLimit = 1000; // 10% max emergency withdraw
    
    // =============================================================
    //                            EVENTS
    // =============================================================
    
    event TreasuryCreated(bytes32 indexed treasuryId, address indexed owner);
    event FundsDeposited(bytes32 indexed treasuryId, address indexed asset, uint256 amount);
    event FundsWithdrawn(bytes32 indexed treasuryId, address indexed asset, uint256 amount);
    event StrategyAdded(bytes32 indexed treasuryId, uint256 indexed strategyIndex, address protocol);
    event Rebalanced(bytes32 indexed treasuryId, uint256 newTier1, uint256 newTier2, uint256 newTier3);
    event YieldClaimed(bytes32 indexed treasuryId, address indexed asset, uint256 amount);
    event EmergencyWithdraw(bytes32 indexed treasuryId, address indexed asset, uint256 amount);
    
    // =============================================================
    //                            CONSTRUCTOR
    // =============================================================
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CFO_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        // Add supported assets (Base mainnet)
        // USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
        supportedAssets[0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913] = true;
        
        // cbETH on Base: 0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22  
        supportedAssets[0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22] = true;
    }
    
    // =============================================================
    //                        CORE FUNCTIONS
    // =============================================================
    
    /**
     * @dev Create a new treasury with initial allocation
     */
    function createTreasury(
        bytes32 treasuryId,
        uint256 tier1Alloc,
        uint256 tier2Alloc,
        uint256 tier3Alloc
    ) external onlyRole(CFO_ROLE) {
        require(allocations[treasuryId].lastRebalance == 0, "Treasury already exists");
        require(tier1Alloc + tier2Alloc + tier3Alloc == BASIS_POINTS, "Invalid allocation");
        require(tier1Alloc <= TIER_1_MAX, "Tier 1 exceeds limit");
        require(tier2Alloc <= TIER_2_MAX, "Tier 2 exceeds limit");
        require(tier3Alloc <= TIER_3_MAX, "Tier 3 exceeds limit");
        
        allocations[treasuryId] = AssetAllocation({
            tier1Allocation: tier1Alloc,
            tier2Allocation: tier2Alloc,
            tier3Allocation: tier3Alloc,
            lastRebalance: block.timestamp
        });
        
        emit TreasuryCreated(treasuryId, msg.sender);
    }
    
    /**
     * @dev Deposit assets into treasury
     */
    function deposit(
        bytes32 treasuryId,
        address asset,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(supportedAssets[asset], "Asset not supported");
        require(amount > 0, "Amount must be > 0");
        require(allocations[treasuryId].lastRebalance > 0, "Treasury doesn't exist");
        
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        
        // Update metrics
        metrics[treasuryId].totalAssets += amount;
        metrics[treasuryId].lastUpdate = block.timestamp;
        
        emit FundsDeposited(treasuryId, asset, amount);
        
        // Auto-trigger rebalancing if needed
        if (shouldRebalance(treasuryId)) {
            _executeRebalance(treasuryId);
        }
    }
    
    /**
     * @dev Add a new yield strategy
     */
    function addStrategy(
        bytes32 treasuryId,
        address protocol,
        uint256 targetAPY,
        uint256 riskScore
    ) external onlyRole(CFO_ROLE) {
        require(allocations[treasuryId].lastRebalance > 0, "Treasury doesn't exist");
        require(riskScore <= 100, "Invalid risk score");
        
        uint256 strategyIndex = strategyCount[treasuryId];
        
        strategies[treasuryId][strategyIndex] = YieldStrategy({
            protocol: protocol,
            allocatedAmount: 0,
            targetAPY: targetAPY,
            riskScore: riskScore,
            active: true
        });
        
        strategyCount[treasuryId]++;
        
        emit StrategyAdded(treasuryId, strategyIndex, protocol);
    }
    
    /**
     * @dev Execute rebalancing based on current allocation targets
     */
    function rebalance(bytes32 treasuryId) external onlyRole(TREASURY_AGENT_ROLE) {
        require(shouldRebalance(treasuryId), "Rebalancing not needed");
        _executeRebalance(treasuryId);
    }
    
    /**
     * @dev Check if treasury needs rebalancing
     */
    function shouldRebalance(bytes32 treasuryId) public view returns (bool) {
        AssetAllocation memory allocation = allocations[treasuryId];
        
        // Rebalance if more than 24 hours since last rebalance
        if (block.timestamp - allocation.lastRebalance > 24 hours) {
            return true;
        }
        
        // TODO: Add logic to check if current allocation deviates from target
        // This would require calculating current position values across strategies
        
        return false;
    }
    
    /**
     * @dev Get treasury performance metrics
     */
    function getTreasuryMetrics(bytes32 treasuryId) external view returns (TreasuryMetrics memory) {
        return metrics[treasuryId];
    }
    
    /**
     * @dev Get strategy details
     */
    function getStrategy(bytes32 treasuryId, uint256 strategyIndex) 
        external view returns (YieldStrategy memory) {
        return strategies[treasuryId][strategyIndex];
    }
    
    // =============================================================
    //                        INTERNAL FUNCTIONS
    // =============================================================
    
    /**
     * @dev Internal rebalancing execution
     */
    function _executeRebalance(bytes32 treasuryId) internal {
        AssetAllocation storage allocation = allocations[treasuryId];
        
        // Update last rebalance timestamp
        allocation.lastRebalance = block.timestamp;
        
        // TODO: Implement actual rebalancing logic
        // 1. Calculate current positions
        // 2. Determine required moves
        // 3. Execute swaps/deposits/withdrawals
        // 4. Update strategy allocations
        
        emit Rebalanced(
            treasuryId, 
            allocation.tier1Allocation,
            allocation.tier2Allocation, 
            allocation.tier3Allocation
        );
    }
    
    // =============================================================
    //                        ADMIN FUNCTIONS
    // =============================================================
    
    /**
     * @dev Add supported asset
     */
    function addSupportedAsset(address asset, address priceFeed) 
        external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedAssets[asset] = true;
        if (priceFeed != address(0)) {
            priceFeeds[asset] = AggregatorV3Interface(priceFeed);
        }
    }
    
    /**
     * @dev Emergency withdraw
     */
    function emergencyWithdraw(
        bytes32 treasuryId,
        address asset,
        uint256 amount
    ) external onlyRole(EMERGENCY_ROLE) {
        require(amount <= emergencyWithdrawLimit * metrics[treasuryId].totalAssets / BASIS_POINTS, 
                "Exceeds emergency limit");
        
        IERC20(asset).transfer(msg.sender, amount);
        
        metrics[treasuryId].totalAssets -= amount;
        
        emit EmergencyWithdraw(treasuryId, asset, amount);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}