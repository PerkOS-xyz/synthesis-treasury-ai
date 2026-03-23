const { ethers } = require('ethers');
require('dotenv').config();

/**
 * Script to test Treasury AI deposit function with 0.00001 ETH
 * Contract: 0x95BbaD1daa5f2a17BF225084c075E4e128226CFC (Base Mainnet)
 */

async function testDeposit() {
    console.log('🚀 Testing Treasury AI Deposit Function...');
    
    // Base Mainnet configuration
    const baseRpcUrl = 'https://mainnet.base.org';
    const contractAddress = '0x95BbaD1daa5f2a17BF225084c075E4e128226CFC';
    
    // Connect to Base Mainnet
    const provider = new ethers.JsonRpcProvider(baseRpcUrl);
    
    // Contract ABI (minimal for deposit function)
    const contractABI = [
        "function deposit() external payable",
        "function totalDeposited() external view returns (uint256)",
        "event Deposit(address indexed from, uint256 amount)"
    ];
    
    try {
        // Check if private key is available
        if (!process.env.PRIVATE_KEY) {
            console.log('⚠️  No PRIVATE_KEY in .env - using read-only mode');
            
            // Read current contract state
            const contract = new ethers.Contract(contractAddress, contractABI, provider);
            const totalDeposited = await contract.totalDeposited();
            
            console.log('📊 Current Contract State:');
            console.log(`   Total Deposited: ${ethers.formatEther(totalDeposited)} ETH`);
            console.log(`   Contract Address: ${contractAddress}`);
            console.log(`   Network: Base Mainnet`);
            
            return;
        }
        
        // Setup wallet for transaction
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const contract = new ethers.Contract(contractAddress, contractABI, wallet);
        
        // Check wallet balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`💰 Wallet Balance: ${ethers.formatEther(balance)} ETH`);
        
        if (balance < ethers.parseEther('0.0001')) {
            console.log('❌ Insufficient balance for transaction + gas');
            return;
        }
        
        // Prepare deposit transaction
        const depositAmount = ethers.parseEther('0.00001'); // 0.00001 ETH
        
        console.log('📤 Sending deposit transaction...');
        console.log(`   Amount: ${ethers.formatEther(depositAmount)} ETH`);
        console.log(`   From: ${wallet.address}`);
        console.log(`   To: ${contractAddress}`);
        
        // Send transaction
        const tx = await contract.deposit({ 
            value: depositAmount,
            gasLimit: 100000 // Conservative gas limit
        });
        
        console.log(`⏳ Transaction sent: ${tx.hash}`);
        console.log('   Waiting for confirmation...');
        
        // Wait for confirmation
        const receipt = await tx.wait();
        
        console.log('✅ Transaction confirmed!');
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`   Transaction hash: ${tx.hash}`);
        
        // Check updated state
        const newTotalDeposited = await contract.totalDeposited();
        console.log(`📊 Updated total deposited: ${ethers.formatEther(newTotalDeposited)} ETH`);
        
        // Generate URLs for verification
        console.log('\n🔗 Verification Links:');
        console.log(`   Basescan: https://basescan.org/tx/${tx.hash}`);
        console.log(`   Base Explorer: https://base.blockscout.com/tx/${tx.hash}`);
        
        return tx.hash;
        
    } catch (error) {
        console.error('❌ Transaction failed:', error.message);
        
        // Provide helpful error context
        if (error.code === 'INSUFFICIENT_FUNDS') {
            console.log('💡 Need more ETH for gas fees');
        } else if (error.code === 'NETWORK_ERROR') {
            console.log('💡 Check network connection to Base Mainnet');
        }
        
        throw error;
    }
}

// Execute if run directly
if (require.main === module) {
    testDeposit()
        .then((txHash) => {
            if (txHash) {
                console.log(`\n🎉 Success! Transaction hash: ${txHash}`);
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = { testDeposit };