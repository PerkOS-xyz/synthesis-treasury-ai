const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 REAL DEPLOYMENT: TreasuryAI to Base Sepolia...");
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for deployment");
  }

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  const latestBlock = await ethers.provider.getBlockNumber();
  console.log("Latest block:", latestBlock);

  try {
    // Deploy TreasuryVault first
    console.log("\n💰 Deploying TreasuryVault...");
    const TreasuryVaultFactory = await ethers.getContractFactory("TreasuryVault");
    const treasuryVault = await TreasuryVaultFactory.deploy();
    await treasuryVault.waitForDeployment();
    const vaultAddress = await treasuryVault.getAddress();
    console.log("✅ TreasuryVault deployed to:", vaultAddress);
    
    // Get deployment transaction
    const vaultTx = treasuryVault.deploymentTransaction();
    console.log("📝 Deployment tx:", vaultTx.hash);

    // Deploy TreasuryManager
    console.log("\n🏦 Deploying TreasuryManager...");
    const TreasuryManagerFactory = await ethers.getContractFactory("TreasuryManager");
    const treasuryManager = await TreasuryManagerFactory.deploy(vaultAddress);
    await treasuryManager.waitForDeployment();
    const managerAddress = await treasuryManager.getAddress();
    console.log("✅ TreasuryManager deployed to:", managerAddress);
    
    // Get deployment transaction
    const managerTx = treasuryManager.deploymentTransaction();
    console.log("📝 Deployment tx:", managerTx.hash);

    // Deploy MultiSigGovernance (if exists)
    let governanceAddress = null;
    let governanceTx = null;
    try {
      console.log("\n🏛️  Deploying MultiSigGovernance...");
      const MultiSigFactory = await ethers.getContractFactory("MultiSigGovernance");
      const multiSig = await MultiSigFactory.deploy([deployer.address], 1); // Single sig for testing
      await multiSig.waitForDeployment();
      governanceAddress = await multiSig.getAddress();
      governanceTx = multiSig.deploymentTransaction();
      console.log("✅ MultiSigGovernance deployed to:", governanceAddress);
    } catch (error) {
      console.log("ℹ️  MultiSigGovernance deployment skipped (contract may not exist)");
    }

    // Wait for confirmations
    console.log("\n⏳ Waiting for confirmations...");
    await vaultTx.wait(2);
    await managerTx.wait(2);
    if (governanceTx) await governanceTx.wait(2);

    // Save deployment info with real data
    const contracts = {
      TreasuryVault: {
        address: vaultAddress,
        deploymentTx: vaultTx.hash,
        blockNumber: vaultTx.blockNumber
      },
      TreasuryManager: {
        address: managerAddress,
        deploymentTx: managerTx.hash,
        blockNumber: managerTx.blockNumber
      }
    };

    if (governanceAddress) {
      contracts.MultiSigGovernance = {
        address: governanceAddress,
        deploymentTx: governanceTx.hash,
        blockNumber: governanceTx.blockNumber
      };
    }

    const deploymentInfo = {
      network: "baseSepolia",
      chainId: Number(network.chainId),
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      latestBlock: latestBlock,
      contracts: contracts,
      verification: {
        basescanVault: `https://sepolia.basescan.org/address/${vaultAddress}`,
        basescanManager: `https://sepolia.basescan.org/address/${managerAddress}`,
        vaultTxLink: `https://sepolia.basescan.org/tx/${vaultTx.hash}`,
        managerTxLink: `https://sepolia.basescan.org/tx/${managerTx.hash}`
      },
      bankrIntegration: {
        enabled: true,
        multiModelAI: ["claude-opus-4.6", "gpt-5.2", "gemini-pro"],
        selfSustaining: true
      },
      testTransactions: [],
      status: "deployed",
      agent: "treasuryai.perkos.eth",
      targetBounties: "$27,500" // Includes Bankr
    };

    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to deployment-info.json");
    
    console.log("\n🎯 TreasuryAI contracts deployed successfully!");
    console.log("📋 Summary:");
    console.log("   TreasuryVault:", vaultAddress);
    console.log("   TreasuryManager:", managerAddress);
    if (governanceAddress) console.log("   MultiSigGovernance:", governanceAddress);
    console.log("   Verify at: https://sepolia.basescan.org");
    
    return deploymentInfo;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Export for test scripts
module.exports = { main };

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment error:", error);
      process.exit(1);
    });
}