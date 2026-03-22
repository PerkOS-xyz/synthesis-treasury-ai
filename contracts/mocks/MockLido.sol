// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockLido is ERC20 {
    mapping(address => uint256) public stakes;
    
    constructor() ERC20("Staked Ether", "stETH") {}
    
    function stake(uint256 amount) external payable {
        require(msg.value == amount, "Value mismatch");
        stakes[msg.sender] += amount;
        _mint(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external {
        require(stakes[msg.sender] >= amount, "Insufficient stake");
        stakes[msg.sender] -= amount;
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }
}
