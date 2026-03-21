const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Deploying TreasuryAI to Base Sepolia...");
  
  try {
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name, "Chain ID:", network.chainId);
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("Connected to Base Sepolia, latest block:", blockNumber);
    
    console.log("\n✅ TreasuryAI deployment infrastructure ready");
    console.log("Agent: treasuryai.perkos.eth");
    console.log("Target bounties: Lido ($9.5K) + Uniswap ($5K) + Locus ($3K) + Celo ($5K)");
    console.log("Total target: $22.5K");
    
    const deploymentInfo = {
      network: network.name,
      chainId: Number(network.chainId),
      deployer: deployer.address,
      balance: ethers.formatEther(balance),
      blockNumber: blockNumber,
      agent: "treasuryai.perkos.eth",
      targetBounties: "$22,500",
      timestamp: new Date().toISOString()
    };
    
    const fs = require('fs');
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("📝 Deployment info saved");
    
  } catch (error) {
    console.error("Deployment error:", error.message);
    throw error;
  }
}

main().catch(console.error);
