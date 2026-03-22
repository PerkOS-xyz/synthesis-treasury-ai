const ethers = require('ethers');
const fs = require('fs');

async function main() {
    console.log('🚀 Deploying TreasuryAI to Base Sepolia...');
    
    // Setup
    const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
    const privateKey = 'PRIVATE_KEY_REDACTED';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('Deployer:', wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'ETH');
    
    // Read contract ABI and bytecode
    const TreasuryManager = JSON.parse(fs.readFileSync('contracts/TreasuryManager.sol'));
    
    console.log('✅ Deployment script ready');
}

main().catch(console.error);
