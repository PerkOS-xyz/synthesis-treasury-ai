// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title TreasuryManagerSimple
 * @dev Simplified autonomous corporate treasury management
 */
contract TreasuryManagerSimple is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant CFO_ROLE = keccak256("CFO_ROLE");
    bytes32 public constant TREASURY_AGENT_ROLE = keccak256("TREASURY_AGENT_ROLE");
    
    struct Treasury {
        uint256 totalAssets;
        uint256 totalYield;
        uint256 lastUpdate;
        bool active;
    }
    
    mapping(bytes32 => Treasury) public treasuries;
    uint256 public treasuryCount;
    
    event TreasuryCreated(bytes32 indexed treasuryId, address indexed owner);
    event FundsDeposited(bytes32 indexed treasuryId, uint256 amount);
    event YieldGenerated(bytes32 indexed treasuryId, uint256 amount);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CFO_ROLE, msg.sender);
    }
    
    function createTreasury(bytes32 treasuryId) external onlyRole(CFO_ROLE) {
        require(!treasuries[treasuryId].active, "Treasury exists");
        
        treasuries[treasuryId] = Treasury({
            totalAssets: 0,
            totalYield: 0,
            lastUpdate: block.timestamp,
            active: true
        });
        
        treasuryCount++;
        emit TreasuryCreated(treasuryId, msg.sender);
    }
    
    function deposit(bytes32 treasuryId) external payable nonReentrant {
        require(treasuries[treasuryId].active, "Treasury not active");
        require(msg.value > 0, "Amount must be > 0");
        
        treasuries[treasuryId].totalAssets += msg.value;
        treasuries[treasuryId].lastUpdate = block.timestamp;
        
        emit FundsDeposited(treasuryId, msg.value);
    }
    
    function generateYield(bytes32 treasuryId, uint256 yieldAmount) 
        external onlyRole(TREASURY_AGENT_ROLE) {
        require(treasuries[treasuryId].active, "Treasury not active");
        
        treasuries[treasuryId].totalYield += yieldAmount;
        treasuries[treasuryId].lastUpdate = block.timestamp;
        
        emit YieldGenerated(treasuryId, yieldAmount);
    }
}