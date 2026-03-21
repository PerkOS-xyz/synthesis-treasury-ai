// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IYieldStrategy
 * @dev Interface for yield generation strategies in TreasuryAI
 */
interface IYieldStrategy {
    // =============================================================
    //                            STRUCTS
    // =============================================================
    
    struct StrategyInfo {
        string name;                // Strategy name
        address asset;              // Underlying asset
        uint256 currentAPY;         // Current APY in basis points
        uint256 totalDeposits;      // Total amount deposited
        uint256 availableLiquidity; // Available liquidity for withdrawal
        uint256 riskScore;          // Risk score 1-100
        bool active;                // Is strategy active
    }
    
    // =============================================================
    //                            EVENTS
    // =============================================================
    
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event YieldHarvested(uint256 amount);
    event StrategyPaused();
    event StrategyUnpaused();
    
    // =============================================================
    //                        CORE FUNCTIONS
    // =============================================================
    
    /**
     * @dev Deposit assets into the strategy
     * @param amount Amount of underlying asset to deposit
     * @return shares Number of strategy shares minted
     */
    function deposit(uint256 amount) external returns (uint256 shares);
    
    /**
     * @dev Withdraw assets from the strategy
     * @param shares Number of strategy shares to burn
     * @return amount Amount of underlying asset withdrawn
     */
    function withdraw(uint256 shares) external returns (uint256 amount);
    
    /**
     * @dev Harvest accumulated yield
     * @return yieldAmount Amount of yield harvested
     */
    function harvestYield() external returns (uint256 yieldAmount);
    
    /**
     * @dev Emergency withdraw all funds
     * @return amount Total amount withdrawn
     */
    function emergencyWithdraw() external returns (uint256 amount);
    
    // =============================================================
    //                        VIEW FUNCTIONS
    // =============================================================
    
    /**
     * @dev Get strategy information
     */
    function getStrategyInfo() external view returns (StrategyInfo memory);
    
    /**
     * @dev Get current APY
     * @return apy Current annual percentage yield in basis points
     */
    function getCurrentAPY() external view returns (uint256 apy);
    
    /**
     * @dev Calculate shares for given amount
     * @param amount Amount of underlying asset
     * @return shares Number of shares that would be minted
     */
    function calculateShares(uint256 amount) external view returns (uint256 shares);
    
    /**
     * @dev Calculate assets for given shares
     * @param shares Number of shares
     * @return amount Amount of underlying asset that would be withdrawn
     */
    function calculateAssets(uint256 shares) external view returns (uint256 amount);
    
    /**
     * @dev Get total assets under management
     * @return totalAssets Total value of assets in the strategy
     */
    function totalAssets() external view returns (uint256 totalAssets);
    
    /**
     * @dev Get available liquidity for immediate withdrawal
     * @return liquidity Available liquidity amount
     */
    function availableLiquidity() external view returns (uint256 liquidity);
    
    /**
     * @dev Check if strategy is healthy and operating normally
     * @return healthy True if strategy is healthy
     */
    function isHealthy() external view returns (bool healthy);
}