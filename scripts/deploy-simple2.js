const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying TreasuryAI contracts to Base Sepolia...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Get current nonce
  let nonce = await hre.ethers.provider.getTransactionCount(deployer.address);
  console.log("Starting nonce:", nonce);

  // Deploy TreasuryVault first
  console.log("\n💰 Deploying TreasuryVault...");
  const TreasuryVault = await hre.ethers.getContractFactory("TreasuryVault");
  const treasuryVault = await TreasuryVault.deploy(deployer.address, 1, {
    nonce: nonce++,
    gasPrice: await hre.ethers.provider.send("eth_gasPrice", [])
  });
  await treasuryVault.waitForDeployment();
  const vaultAddress = await treasuryVault.getAddress();
  console.log("✅ TreasuryVault deployed to:", vaultAddress);

  // Wait a bit and get fresh gas price
  await new Promise(resolve => setTimeout(resolve, 5000));
  const gasPrice = await hre.ethers.provider.send("eth_gasPrice", []);

  // Deploy TreasuryManagerSimple
  console.log("\n🏦 Deploying TreasuryManagerSimple...");
  const TreasuryManagerSimple = await hre.ethers.getContractFactory("TreasuryManagerSimple");
  const treasuryManager = await TreasuryManagerSimple.deploy({
    nonce: nonce++,
    gasPrice: BigInt(gasPrice) * 110n / 100n // 10% higher gas price
  });
  await treasuryManager.waitForDeployment();
  const managerAddress = await treasuryManager.getAddress();
  console.log("✅ TreasuryManagerSimple deployed to:", managerAddress);

  // Save deployment info
  const deploymentInfo = {
    network: "baseSepolia",
    chainId: 84532,
    deployer: deployer.address,
    contracts: {
      TreasuryVault: vaultAddress,
      TreasuryManager: managerAddress
    },
    timestamp: new Date().toISOString(),
    verification: {
      basescanVault: `https://sepolia.basescan.org/address/${vaultAddress}`,
      basescanManager: `https://sepolia.basescan.org/address/${managerAddress}`
    }
  };

  require('fs').writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployment-info.json");
  console.log("\n🎯 TreasuryAI deployment complete!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});