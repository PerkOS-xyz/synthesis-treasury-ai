const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TreasuryAI DeFi Integration", function () {
  let treasury, lido, uniswap;
  let owner, agent, user;

  beforeEach(async function () {
    [owner, agent, user] = await ethers.getSigners();
    
    // Deploy mock contracts for testing
    const MockLido = await ethers.getContractFactory("MockLido");
    lido = await MockLido.deploy();
    
    const MockUniswap = await ethers.getContractFactory("MockUniswap");
    uniswap = await MockUniswap.deploy();
    
    const TreasuryManager = await ethers.getContractFactory("TreasuryManager");
    treasury = await TreasuryManager.deploy(lido.address, uniswap.address);
  });

  describe("Lido Integration", function () {
    it("Should stake ETH for stETH", async function () {
      const stakeAmount = ethers.parseEther("2.0");
      
      await expect(treasury.connect(agent).stakeWithLido(stakeAmount, {
        value: stakeAmount
      })).to.emit(treasury, "LidoStaking");
      
      const stEthBalance = await treasury.stEthBalance();
      expect(stEthBalance).to.equal(stakeAmount);
    });

    it("Should track staking yield over time", async function () {
      await treasury.connect(agent).stakeWithLido(ethers.parseEther("1.0"), {
        value: ethers.parseEther("1.0")
      });
      
      // Simulate time passage and yield accrual
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await treasury.connect(agent).updateStakingRewards();
      
      const yield = await treasury.getStakingYield();
      expect(yield).to.be.gt(0);
    });

    it("Should handle unstaking with withdrawal queue", async function () {
      // Stake first
      await treasury.connect(agent).stakeWithLido(ethers.parseEther("1.0"), {
        value: ethers.parseEther("1.0")
      });
      
      // Request unstaking
      await treasury.connect(agent).requestUnstaking(ethers.parseEther("0.5"));
      
      const pendingUnstake = await treasury.pendingUnstakeAmount();
      expect(pendingUnstake).to.equal(ethers.parseEther("0.5"));
    });
  });

  describe("Uniswap Integration", function () {
    it("Should execute automated swaps", async function () {
      await treasury.connect(agent).executeSwap(
        "0xA0b86a33E6C44d28fc6748e9F5FB5A67b68e1d48", // WETH
        "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
        ethers.parseEther("1.0"),
        ethers.parseUnits("3000", 6), // min 3000 USDC
        3000 // 0.3% fee tier
      );
      
      const swapHistory = await treasury.getSwapHistory();
      expect(swapHistory.length).to.equal(1);
    });

    it("Should provide liquidity to pools", async function () {
      await treasury.connect(agent).provideLiquidity(
        "0xA0b86a33E6C44d28fc6748e9F5FB5A67b68e1d48", // WETH
        "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
        ethers.parseEther("1.0"),
        ethers.parseUnits("3000", 6),
        3000
      );
      
      const liquidityTokens = await treasury.liquidityTokenBalance();
      expect(liquidityTokens).to.be.gt(0);
    });

    it("Should rebalance portfolio automatically", async function () {
      // Set target allocation: 50% ETH, 30% stETH, 20% USDC
      await treasury.connect(agent).setTargetAllocation([50, 30, 20]);
      
      // Trigger rebalancing
      await treasury.connect(agent).rebalancePortfolio();
      
      const allocation = await treasury.getCurrentAllocation();
      expect(allocation[0]).to.be.closeTo(50, 5); // Within 5% of target
    });
  });

  describe("Celo Integration", function () {
    it("Should handle USDC operations on Celo", async function () {
      await treasury.connect(agent).bridgeToCelo(
        ethers.parseUnits("1000", 6) // 1000 USDC
      );
      
      const celoBalance = await treasury.celoUsdcBalance();
      expect(celoBalance).to.equal(ethers.parseUnits("1000", 6));
    });

    it("Should execute cUSD stablecoin operations", async function () {
      await treasury.connect(agent).swapForCUSD(ethers.parseUnits("500", 6));
      
      const cUsdBalance = await treasury.cUsdBalance();
      expect(cUsdBalance).to.be.gt(0);
    });
  });

  describe("Risk Management", function () {
    it("Should enforce position size limits", async function () {
      await treasury.connect(agent).setPositionLimit(ethers.parseEther("10.0"));
      
      await expect(treasury.connect(agent).stakeWithLido(ethers.parseEther("15.0"), {
        value: ethers.parseEther("15.0")
      })).to.be.revertedWith("Exceeds position limit");
    });

    it("Should monitor impermanent loss", async function () {
      await treasury.connect(agent).provideLiquidity(
        "0xA0b86a33E6C44d28fc6748e9F5FB5A67b68e1d48",
        "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        ethers.parseEther("1.0"),
        ethers.parseUnits("3000", 6),
        3000
      );
      
      // Simulate price change
      await ethers.provider.send("evm_increaseTime", [3600]);
      
      const impermanentLoss = await treasury.calculateImpermanentLoss();
      expect(impermanentLoss).to.be.gte(0);
    });
  });

  describe("Performance Analytics", function () {
    it("Should track portfolio performance", async function () {
      // Make several operations
      await treasury.connect(agent).stakeWithLido(ethers.parseEther("1.0"), {
        value: ethers.parseEther("1.0")
      });
      
      await treasury.connect(agent).executeSwap(
        "0xA0b86a33E6C44d28fc6748e9F5FB5A67b68e1d48",
        "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 
        ethers.parseEther("0.5"),
        ethers.parseUnits("1500", 6),
        3000
      );
      
      const performance = await treasury.getPortfolioPerformance();
      expect(performance.totalValue).to.be.gt(0);
      expect(performance.yieldGenerated).to.be.gte(0);
    });
  });
});
