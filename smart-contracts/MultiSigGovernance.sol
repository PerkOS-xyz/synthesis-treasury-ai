// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MultiSigGovernance
 * @dev Multi-signature governance system for treasury operations
 */
contract MultiSigGovernance is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    struct Proposal {
        uint256 id;
        address proposer;
        bytes32 actionHash;
        string description;
        uint256 value;
        address target;
        bytes data;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 createdAt;
        uint256 executionTime;
        ProposalState state;
        mapping(address => bool) hasVoted;
        mapping(address => bool) voteChoice; // true = for, false = against
    }

    struct Signatory {
        address addr;
        uint256 weight;
        bool isActive;
        uint256 addedAt;
        string role;
    }

    enum ProposalState {
        Pending,
        Active,
        Executed,
        Cancelled,
        Expired
    }

    // State variables
    mapping(uint256 => Proposal) public proposals;
    mapping(address => Signatory) public signatories;
    mapping(bytes32 => bool) public executedActions;
    
    address[] public signatoryList;
    uint256 public proposalCount;
    uint256 public totalWeight;
    uint256 public requiredWeight;
    uint256 public votingPeriod = 7 days;
    uint256 public executionDelay = 1 days;
    uint256 public proposalThreshold = 1; // Minimum weight to propose

    // Events
    event SignatoryAdded(address indexed signatory, uint256 weight, string role);
    event SignatoryRemoved(address indexed signatory);
    event WeightUpdated(address indexed signatory, uint256 oldWeight, uint256 newWeight);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bytes returnData);
    event ProposalCancelled(uint256 indexed proposalId, string reason);
    event GovernanceParametersUpdated(uint256 requiredWeight, uint256 votingPeriod, uint256 executionDelay);

    modifier onlySignatory() {
        require(signatories[msg.sender].isActive, "Not an active signatory");
        _;
    }

    modifier onlyMultiSig() {
        require(msg.sender == address(this), "Only multisig can execute");
        _;
    }

    modifier validProposal(uint256 proposalId) {
        require(proposalId < proposalCount, "Invalid proposal ID");
        require(proposals[proposalId].state == ProposalState.Active, "Proposal not active");
        _;
    }

    constructor(
        address[] memory _signatories,
        uint256[] memory _weights,
        string[] memory _roles,
        uint256 _requiredWeight
    ) {
        require(_signatories.length == _weights.length, "Array length mismatch");
        require(_signatories.length == _roles.length, "Array length mismatch");
        require(_signatories.length > 0, "No signatories provided");
        require(_requiredWeight > 0, "Invalid required weight");

        uint256 _totalWeight = 0;

        for (uint256 i = 0; i < _signatories.length; i++) {
            require(_signatories[i] != address(0), "Invalid signatory address");
            require(_weights[i] > 0, "Invalid weight");

            signatories[_signatories[i]] = Signatory({
                addr: _signatories[i],
                weight: _weights[i],
                isActive: true,
                addedAt: block.timestamp,
                role: _roles[i]
            });

            signatoryList.push(_signatories[i]);
            _totalWeight += _weights[i];

            emit SignatoryAdded(_signatories[i], _weights[i], _roles[i]);
        }

        totalWeight = _totalWeight;
        requiredWeight = _requiredWeight;
    }

    /**
     * @dev Create a new governance proposal
     */
    function propose(
        address target,
        uint256 value,
        bytes calldata data,
        string calldata description
    ) external onlySignatory returns (uint256) {
        require(
            signatories[msg.sender].weight >= proposalThreshold,
            "Insufficient weight to propose"
        );

        uint256 proposalId = proposalCount++;
        bytes32 actionHash = keccak256(abi.encode(target, value, data));

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.actionHash = actionHash;
        proposal.description = description;
        proposal.value = value;
        proposal.target = target;
        proposal.data = data;
        proposal.createdAt = block.timestamp;
        proposal.state = ProposalState.Active;

        emit ProposalCreated(proposalId, msg.sender, description);
        return proposalId;
    }

    /**
     * @dev Cast a vote on an active proposal
     */
    function vote(
        uint256 proposalId,
        bool support
    ) external onlySignatory validProposal(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(block.timestamp <= proposal.createdAt + votingPeriod, "Voting period ended");

        uint256 voterWeight = signatories[msg.sender].weight;
        proposal.hasVoted[msg.sender] = true;
        proposal.voteChoice[msg.sender] = support;

        if (support) {
            proposal.votesFor += voterWeight;
        } else {
            proposal.votesAgainst += voterWeight;
        }

        emit VoteCast(proposalId, msg.sender, support, voterWeight);

        // Check if proposal can be queued for execution
        if (proposal.votesFor >= requiredWeight) {
            proposal.executionTime = block.timestamp + executionDelay;
        }
    }

    /**
     * @dev Execute a successful proposal
     */
    function execute(uint256 proposalId) external nonReentrant validProposal(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.votesFor >= requiredWeight, "Insufficient votes");
        require(
            block.timestamp >= proposal.executionTime && proposal.executionTime > 0,
            "Execution delay not met"
        );
        require(block.timestamp <= proposal.createdAt + votingPeriod + executionDelay, "Proposal expired");
        require(!executedActions[proposal.actionHash], "Action already executed");

        proposal.state = ProposalState.Executed;
        executedActions[proposal.actionHash] = true;

        // Execute the proposal
        (bool success, bytes memory returnData) = proposal.target.call{value: proposal.value}(
            proposal.data
        );
        
        require(success, "Execution failed");

        emit ProposalExecuted(proposalId, returnData);
    }

    /**
     * @dev Cancel an active proposal (emergency function)
     */
    function cancel(
        uint256 proposalId,
        string calldata reason
    ) external onlyOwner {
        Proposal storage proposal = proposals[proposalId];
        require(
            proposal.state == ProposalState.Active || proposal.state == ProposalState.Pending,
            "Cannot cancel proposal"
        );

        proposal.state = ProposalState.Cancelled;
        emit ProposalCancelled(proposalId, reason);
    }

    /**
     * @dev Add a new signatory
     */
    function addSignatory(
        address newSignatory,
        uint256 weight,
        string calldata role
    ) external onlyMultiSig {
        require(newSignatory != address(0), "Invalid address");
        require(weight > 0, "Invalid weight");
        require(!signatories[newSignatory].isActive, "Signatory already exists");

        signatories[newSignatory] = Signatory({
            addr: newSignatory,
            weight: weight,
            isActive: true,
            addedAt: block.timestamp,
            role: role
        });

        signatoryList.push(newSignatory);
        totalWeight += weight;

        emit SignatoryAdded(newSignatory, weight, role);
    }

    /**
     * @dev Remove a signatory
     */
    function removeSignatory(address signatoryToRemove) external onlyMultiSig {
        require(signatories[signatoryToRemove].isActive, "Signatory not active");
        require(signatoryList.length > 1, "Cannot remove last signatory");

        uint256 weight = signatories[signatoryToRemove].weight;
        signatories[signatoryToRemove].isActive = false;
        totalWeight -= weight;

        // Remove from array
        for (uint256 i = 0; i < signatoryList.length; i++) {
            if (signatoryList[i] == signatoryToRemove) {
                signatoryList[i] = signatoryList[signatoryList.length - 1];
                signatoryList.pop();
                break;
            }
        }

        emit SignatoryRemoved(signatoryToRemove);
    }

    /**
     * @dev Update signatory weight
     */
    function updateSignatoryWeight(
        address signatory,
        uint256 newWeight
    ) external onlyMultiSig {
        require(signatories[signatory].isActive, "Signatory not active");
        require(newWeight > 0, "Invalid weight");

        uint256 oldWeight = signatories[signatory].weight;
        signatories[signatory].weight = newWeight;
        
        totalWeight = totalWeight - oldWeight + newWeight;

        emit WeightUpdated(signatory, oldWeight, newWeight);
    }

    /**
     * @dev Update governance parameters
     */
    function updateGovernanceParameters(
        uint256 _requiredWeight,
        uint256 _votingPeriod,
        uint256 _executionDelay,
        uint256 _proposalThreshold
    ) external onlyMultiSig {
        require(_requiredWeight > 0 && _requiredWeight <= totalWeight, "Invalid required weight");
        require(_votingPeriod > 0, "Invalid voting period");
        require(_executionDelay > 0, "Invalid execution delay");
        require(_proposalThreshold > 0, "Invalid proposal threshold");

        requiredWeight = _requiredWeight;
        votingPeriod = _votingPeriod;
        executionDelay = _executionDelay;
        proposalThreshold = _proposalThreshold;

        emit GovernanceParametersUpdated(_requiredWeight, _votingPeriod, _executionDelay);
    }

    /**
     * @dev Check if an address is authorized
     */
    function isAuthorized(address addr) external view returns (bool) {
        return signatories[addr].isActive && signatories[addr].weight > 0;
    }

    /**
     * @dev Get proposal state
     */
    function getProposalState(uint256 proposalId) external view returns (ProposalState) {
        if (proposalId >= proposalCount) {
            return ProposalState.Pending; // Invalid proposal
        }

        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.state == ProposalState.Executed || proposal.state == ProposalState.Cancelled) {
            return proposal.state;
        }

        if (block.timestamp > proposal.createdAt + votingPeriod + executionDelay) {
            return ProposalState.Expired;
        }

        return proposal.state;
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory description,
        uint256 value,
        address target,
        bytes memory data,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 createdAt,
        uint256 executionTime,
        ProposalState state
    ) {
        require(proposalId < proposalCount, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.description,
            proposal.value,
            proposal.target,
            proposal.data,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.createdAt,
            proposal.executionTime,
            proposal.state
        );
    }

    /**
     * @dev Get voting status for a proposal
     */
    function getVotingStatus(
        uint256 proposalId,
        address voter
    ) external view returns (bool hasVoted, bool voteChoice) {
        require(proposalId < proposalCount, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        return (proposal.hasVoted[voter], proposal.voteChoice[voter]);
    }

    /**
     * @dev Get all signatories
     */
    function getSignatories() external view returns (address[] memory) {
        return signatoryList;
    }

    /**
     * @dev Get signatory details
     */
    function getSignatory(address addr) external view returns (
        uint256 weight,
        bool isActive,
        uint256 addedAt,
        string memory role
    ) {
        Signatory storage sig = signatories[addr];
        return (sig.weight, sig.isActive, sig.addedAt, sig.role);
    }

    /**
     * @dev Calculate voting power percentage
     */
    function getVotingPower(address addr) external view returns (uint256) {
        if (!signatories[addr].isActive || totalWeight == 0) {
            return 0;
        }
        return (signatories[addr].weight * 10000) / totalWeight; // Returns in basis points
    }

    /**
     * @dev Check if proposal is ready for execution
     */
    function canExecute(uint256 proposalId) external view returns (bool) {
        if (proposalId >= proposalCount) return false;
        
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.state == ProposalState.Active &&
            proposal.votesFor >= requiredWeight &&
            proposal.executionTime > 0 &&
            block.timestamp >= proposal.executionTime &&
            block.timestamp <= proposal.createdAt + votingPeriod + executionDelay &&
            !executedActions[proposal.actionHash]
        );
    }

    /**
     * @dev Emergency function to receive ETH
     */
    receive() external payable {}

    /**
     * @dev Withdraw ETH from contract
     */
    function withdrawETH(address payable recipient, uint256 amount) external onlyMultiSig {
        require(recipient != address(0), "Invalid recipient");
        require(address(this).balance >= amount, "Insufficient balance");
        
        recipient.transfer(amount);
    }
}