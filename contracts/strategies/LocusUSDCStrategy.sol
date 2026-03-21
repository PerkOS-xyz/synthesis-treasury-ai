// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IYieldStrategy.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title LocusUSDCStrategy
 * @dev Yield strategy for Locus USDC on Base
 * Implements automated USDC yield farming on Base L2
 */
contract LocusUSDCStrategy is IYieldStrategy, ERC20, ReentrancyGuard, Ownable, Pausable {
    // =============================================================
    //                            CONSTANTS
    // =============================================================
    
    // USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    IERC20 public constant USDC = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    
    // Locus Finance contract address on Base (placeholder - replace with actual)
    address public constant LOCUS_VAULT = 0x1234567890123456789012345678901234567890;
    
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant TARGET_APY = 800; // 8% target APY
    uint256 public constant RISK_SCORE = 45; // Medium risk
    
    // =============================================================
    //                            STORAGE
    // =============================================================
    
    uint256 public totalDeposited;      // Total USDC deposited
    uint256 public lastHarvestTime;     // Last yield harvest timestamp
    uint256 public accumulatedYield;    // Total yield accumulated
    uint256 public performanceFee = 200; // 2% performance fee
    address public feeRecipient;        // Fee recipient address
    
    // Strategy state
    bool public strategyActive = true;
    uint256 public emergencyExitTime;   // Emergency exit timestamp
    
    // =============================================================
    //                            EVENTS
    // =============================================================
    
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event EmergencyExitInitiated(uint256 exitTime);
    
    // =============================================================
    //                            CONSTRUCTOR
    // =============================================================
    
    constructor(address _feeRecipient) 
        ERC20("Locus USDC Strategy Shares", "lsUSDC") 
        Ownable(msg.sender) 
    {
        feeRecipient = _feeRecipient;
        lastHarvestTime = block.timestamp;
    }
    
    // =============================================================
    //                        CORE FUNCTIONS
    // =============================================================
    
    /**
     * @dev Deposit USDC into the strategy
     */
    function deposit(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 shares) 
    {
        require(amount > 0, "Amount must be > 0");
        require(strategyActive, "Strategy not active");
        
        // Calculate shares to mint
        shares = calculateShares(amount);
        
        // Transfer USDC from user
        USDC.transferFrom(msg.sender, address(this), amount);
        
        // Mint strategy shares to user
        _mint(msg.sender, shares);
        
        // Update total deposited
        totalDeposited += amount;
        
        // Deploy to Locus vault
        _deployToLocus(amount);
        
        emit Deposited(msg.sender, amount, shares);
    }
    
    /**
     * @dev Withdraw USDC from the strategy
     */
    function withdraw(uint256 shares) 
        external 
        nonReentrant 
        returns (uint256 amount) 
    {
        require(shares > 0, "Shares must be > 0");
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        
        // Calculate USDC amount to withdraw
        amount = calculateAssets(shares);
        
        // Withdraw from Locus if needed
        _withdrawFromLocus(amount);
        
        // Burn user's shares
        _burn(msg.sender, shares);
        
        // Transfer USDC to user
        USDC.transfer(msg.sender, amount);
        
        // Update total deposited
        totalDeposited -= amount;
        
        emit Withdrawn(msg.sender, amount, shares);
    }
    
    /**
     * @dev Harvest yield from Locus vault
     */
    function harvestYield() 
        external 
        nonReentrant 
        returns (uint256 yieldAmount) 
    {
        require(block.timestamp >= lastHarvestTime + 1 hours, "Too soon to harvest");
        
        // Get current balance in Locus
        uint256 currentBalance = _getLocusBalance();
        
        // Calculate yield earned
        if (currentBalance > totalDeposited) {
            yieldAmount = currentBalance - totalDeposited;
            
            // Take performance fee
            uint256 fee = yieldAmount * performanceFee / BASIS_POINTS;
            if (fee > 0 && feeRecipient != address(0)) {
                _withdrawFromLocus(fee);
                USDC.transfer(feeRecipient, fee);
                yieldAmount -= fee;
            }
            
            // Update accumulated yield
            accumulatedYield += yieldAmount;
            lastHarvestTime = block.timestamp;
            
            emit YieldHarvested(yieldAmount);
        }
    }
    
    /**
     * @dev Emergency withdraw all funds
     */
    function emergencyWithdraw() 
        external 
        onlyOwner 
        returns (uint256 amount) 
    {
        require(!strategyActive || emergencyExitTime > 0, "Emergency not declared");
        
        // Withdraw all from Locus
        amount = _withdrawAllFromLocus();
        
        // Mark strategy as inactive
        strategyActive = false;
        
        emit EmergencyExitInitiated(block.timestamp);
    }
    
    // =============================================================
    //                        VIEW FUNCTIONS
    // =============================================================
    
    /**
     * @dev Get strategy information
     */
    function getStrategyInfo() external view returns (StrategyInfo memory) {
        return StrategyInfo({
            name: "Locus USDC Strategy",
            asset: address(USDC),
            currentAPY: getCurrentAPY(),
            totalDeposits: totalDeposited,
            availableLiquidity: availableLiquidity(),
            riskScore: RISK_SCORE,
            active: strategyActive
        });
    }
    
    /**
     * @dev Get current APY
     */
    function getCurrentAPY() public view returns (uint256 apy) {
        // Calculate APY based on recent performance
        if (accumulatedYield > 0 && totalDeposited > 0) {
            uint256 timeElapsed = block.timestamp - lastHarvestTime;
            if (timeElapsed > 0) {
                // Annualized APY calculation
                apy = (accumulatedYield * 365 days * BASIS_POINTS) / 
                      (totalDeposited * timeElapsed);
            }
        }
        
        // Fallback to target APY if no yield data
        if (apy == 0) {
            apy = TARGET_APY;
        }
    }
    
    /**
     * @dev Calculate shares for given amount
     */
    function calculateShares(uint256 amount) public view returns (uint256 shares) {
        if (totalSupply() == 0) {
            // First deposit: 1:1 ratio
            return amount;
        } else {
            // Proportional to total assets
            return (amount * totalSupply()) / totalAssets();
        }
    }
    
    /**
     * @dev Calculate assets for given shares
     */
    function calculateAssets(uint256 shares) public view returns (uint256 amount) {
        if (totalSupply() == 0) {
            return 0;
        } else {
            return (shares * totalAssets()) / totalSupply();
        }
    }
    
    /**
     * @dev Get total assets under management
     */
    function totalAssets() public view returns (uint256) {
        return totalDeposited + accumulatedYield;
    }
    
    /**
     * @dev Get available liquidity
     */
    function availableLiquidity() public view returns (uint256) {
        // Available USDC in this contract + withdrawable from Locus
        return USDC.balanceOf(address(this)) + _getWithdrawableFromLocus();
    }
    
    /**
     * @dev Check if strategy is healthy
     */
    function isHealthy() public view returns (bool) {
        return strategyActive && 
               getCurrentAPY() > TARGET_APY / 2 && // APY above 50% of target
               availableLiquidity() > totalDeposited / 10; // 10% liquidity buffer
    }
    
    // =============================================================
    //                    INTERNAL FUNCTIONS
    // =============================================================
    
    /**
     * @dev Deploy USDC to Locus vault
     */
    function _deployToLocus(uint256 amount) internal {
        // TODO: Implement actual Locus vault interaction
        // This is a placeholder for the real Locus Finance integration
        
        // Example pattern:
        // USDC.approve(LOCUS_VAULT, amount);
        // ILocusVault(LOCUS_VAULT).deposit(amount);
    }
    
    /**
     * @dev Withdraw from Locus vault
     */
    function _withdrawFromLocus(uint256 amount) internal {
        // TODO: Implement actual Locus vault withdrawal
        // This is a placeholder for the real Locus Finance integration
        
        // Example pattern:
        // ILocusVault(LOCUS_VAULT).withdraw(amount);
    }
    
    /**
     * @dev Withdraw all from Locus vault
     */
    function _withdrawAllFromLocus() internal returns (uint256 amount) {
        // TODO: Implement withdrawal of all funds from Locus
        amount = _getLocusBalance();
        if (amount > 0) {
            _withdrawFromLocus(amount);
        }
    }
    
    /**
     * @dev Get current balance in Locus vault
     */
    function _getLocusBalance() internal view returns (uint256) {
        // TODO: Implement actual Locus vault balance query
        // This is a placeholder
        return totalDeposited; // Simplified for now
    }
    
    /**
     * @dev Get withdrawable amount from Locus
     */
    function _getWithdrawableFromLocus() internal view returns (uint256) {
        // TODO: Implement actual Locus vault withdrawable query
        // This should check vault liquidity constraints
        return _getLocusBalance();
    }
    
    // =============================================================
    //                        ADMIN FUNCTIONS
    // =============================================================
    
    /**
     * @dev Update performance fee
     */
    function setPerformanceFee(uint256 _performanceFee) external onlyOwner {
        require(_performanceFee <= 1000, "Fee too high"); // Max 10%
        emit PerformanceFeeUpdated(performanceFee, _performanceFee);
        performanceFee = _performanceFee;
    }
    
    /**
     * @dev Update fee recipient
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid recipient");
        emit FeeRecipientUpdated(feeRecipient, _feeRecipient);
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Initiate emergency exit
     */
    function initiateEmergencyExit() external onlyOwner {
        emergencyExitTime = block.timestamp;
        strategyActive = false;
        emit EmergencyExitInitiated(emergencyExitTime);
    }
    
    /**
     * @dev Pause strategy
     */
    function pauseStrategy() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause strategy
     */
    function unpauseStrategy() external onlyOwner {
        _unpause();
    }
}