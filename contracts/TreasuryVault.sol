// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TreasuryVault
 * @notice Autonomous corporate treasury management vault
 * @dev Core contract for TreasuryAI - manages DeFi strategy execution
 */
contract TreasuryVault {
    address public owner;
    address public strategist; // AI agent authorized to execute strategies
    
    struct Strategy {
        string name;
        address protocol;
        uint256 allocation; // basis points (10000 = 100%)
        bool active;
        uint256 lastExecuted;
    }
    
    mapping(uint256 => Strategy) public strategies;
    uint256 public strategyCount;
    uint256 public totalDeposited;
    
    // Multi-sig threshold for large operations
    uint256 public constant LARGE_OPERATION_THRESHOLD = 10000e6; // 10k USDC
    uint256 public requiredApprovals;
    mapping(address => bool) public governors;
    
    event StrategyCreated(uint256 indexed id, string name, address protocol);
    event StrategyExecuted(uint256 indexed id, uint256 amount, uint256 timestamp);
    event Deposit(address indexed from, uint256 amount);
    event Withdrawal(address indexed to, uint256 amount, uint256 approvals);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyStrategist() {
        require(msg.sender == strategist || msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor(address _strategist, uint256 _requiredApprovals) {
        owner = msg.sender;
        strategist = _strategist;
        requiredApprovals = _requiredApprovals;
    }
    
    function createStrategy(
        string memory name,
        address protocol,
        uint256 allocation
    ) external onlyOwner returns (uint256) {
        uint256 id = strategyCount++;
        strategies[id] = Strategy(name, protocol, allocation, true, 0);
        emit StrategyCreated(id, name, protocol);
        return id;
    }
    
    function executeStrategy(uint256 strategyId, uint256 amount) external onlyStrategist {
        Strategy storage s = strategies[strategyId];
        require(s.active, "Strategy inactive");
        require(amount <= LARGE_OPERATION_THRESHOLD, "Requires multi-sig");
        s.lastExecuted = block.timestamp;
        emit StrategyExecuted(strategyId, amount, block.timestamp);
    }
    
    function deposit() external payable {
        totalDeposited += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
}
