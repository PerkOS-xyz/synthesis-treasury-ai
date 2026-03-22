const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TreasuryVault", function () {
  let vault;
  let owner, treasury, user;

  beforeEach(async function () {
    [owner, treasury, user] = await ethers.getSigners();
    
    const TreasuryVault = await ethers.getContractFactory("TreasuryVault");
    vault = await TreasuryVault.deploy(treasury.address);
  });

  describe("Deposit & Withdrawal", function () {
    it("Should accept ETH deposits", async function () {
      const depositAmount = ethers.parseEther("1.0");
      
      await expect(vault.connect(user).deposit({ value: depositAmount }))
        .to.emit(vault, "Deposit")
        .withArgs(user.address, depositAmount);
        
      expect(await vault.totalDeposits()).to.equal(depositAmount);
    });

    it("Should allow authorized withdrawals", async function () {
      // Deposit first
      await vault.connect(user).deposit({ value: ethers.parseEther("1.0") });
      
      // Treasury can withdraw
      await expect(vault.connect(treasury).withdraw(ethers.parseEther("0.5")))
        .to.emit(vault, "Withdrawal");
    });
  });

  describe("Yield Generation", function () {
    it("Should track yield from external sources", async function () {
      await vault.connect(treasury).recordYield(ethers.parseEther("0.1"), "Lido staking");
      
      const totalYield = await vault.totalYieldGenerated();
      expect(totalYield).to.equal(ethers.parseEther("0.1"));
    });

    it("Should distribute yield to depositors", async function () {
      // Multiple users deposit
      await vault.connect(user).deposit({ value: ethers.parseEther("1.0") });
      await vault.connect(owner).deposit({ value: ethers.parseEther("2.0") });
      
      // Generate yield
      await vault.connect(treasury).recordYield(ethers.parseEther("0.3"), "DeFi yield");
      await vault.connect(treasury).distributeYield();
      
      // Check yield distribution
      const userBalance = await vault.balances(user.address);
      expect(userBalance).to.be.gt(ethers.parseEther("1.0"));
    });
  });

  describe("Risk Management", function () {
    it("Should enforce deposit limits", async function () {
      await vault.connect(treasury).setDepositLimit(ethers.parseEther("5.0"));
      
      await expect(vault.connect(user).deposit({ value: ethers.parseEther("6.0") }))
        .to.be.revertedWith("Exceeds deposit limit");
    });

    it("Should pause operations in emergency", async function () {
      await vault.connect(treasury).pause();
      
      await expect(vault.connect(user).deposit({ value: ethers.parseEther("1.0") }))
        .to.be.revertedWith("Pausable: paused");
    });
  });
});
