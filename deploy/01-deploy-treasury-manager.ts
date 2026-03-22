import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployTreasuryManager: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, log, get } = deployments;
  const { deployer, treasury, cfo } = await getNamedAccounts();

  log('====================================================');
  log('🏦 Deploying TreasuryManager...');
  log('====================================================');

  // Deploy TreasuryManager
  const treasuryManager = await deploy('TreasuryManager', {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: hre.network.name === 'hardhat' ? 1 : 5,
  });

  // Setup initial configuration
  if (treasuryManager.newlyDeployed) {
    log('🔧 Setting up TreasuryManager configuration...');
    
    const treasuryContract = await ethers.getContractAt('TreasuryManager', treasuryManager.address);
    
    // Grant roles
    const CFO_ROLE = await treasuryContract.CFO_ROLE();
    const TREASURY_AGENT_ROLE = await treasuryContract.TREASURY_AGENT_ROLE();
    const EMERGENCY_ROLE = await treasuryContract.EMERGENCY_ROLE();

    // Grant CFO role to specified address
    if (cfo !== deployer) {
      log(`👨‍💼 Granting CFO role to ${cfo}`);
      await treasuryContract.grantRole(CFO_ROLE, cfo);
    }

    // Grant treasury agent role to treasury address
    if (treasury && treasury !== deployer) {
      log(`🤖 Granting Treasury Agent role to ${treasury}`);
      await treasuryContract.grantRole(TREASURY_AGENT_ROLE, treasury);
    }

    // Add supported assets based on network
    const networkName = hre.network.name;
    log(`🏗️ Adding supported assets for network: ${networkName}`);

    if (networkName === 'base' || networkName === 'base-sepolia') {
      // USDC on Base
      const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      // cbETH on Base  
      const cbETH_BASE = '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22';
      
      // Note: These are already added in constructor for Base
      log(`💰 USDC and cbETH already configured for Base network`);
      
    } else if (networkName === 'mainnet') {
      // ETH and major stablecoins on mainnet
      const USDC_MAINNET = '0xA0b86a33E6441495FCaD4F27f9F0f59CF92c2Ac2';
      const USDT_MAINNET = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
      
      await treasuryContract.addSupportedAsset(USDC_MAINNET, ethers.ZeroAddress);
      await treasuryContract.addSupportedAsset(USDT_MAINNET, ethers.ZeroAddress);
      
      log(`💰 Added USDC and USDT for mainnet`);
    }

    // Create default treasury
    const treasuryId = ethers.keccak256(ethers.toUtf8Bytes('main-treasury'));
    const tier1Alloc = 7000; // 70%
    const tier2Alloc = 2500; // 25%  
    const tier3Alloc = 500;  // 5%

    log(`🏛️ Creating default treasury with allocation: ${tier1Alloc/100}%/${tier2Alloc/100}%/${tier3Alloc/100}%`);
    
    await treasuryContract.createTreasury(
      treasuryId,
      tier1Alloc,
      tier2Alloc,
      tier3Alloc
    );

    log('✅ TreasuryManager setup completed!');
  }

  // Verification
  if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
    log('🔍 Verifying contract...');
    try {
      await hre.run('verify:verify', {
        address: treasuryManager.address,
        constructorArguments: [],
      });
      log('✅ Contract verified successfully!');
    } catch (error) {
      log('❌ Verification failed:', error);
    }
  }

  log('====================================================');
  log('🎉 TreasuryManager deployment completed!');
  log(`📍 Address: ${treasuryManager.address}`);
  log(`🌐 Network: ${hre.network.name}`);
  log(`⛽ Gas used: ${treasuryManager.receipt?.gasUsed || 'Unknown'}`);
  log('====================================================');
};

deployTreasuryManager.tags = ['TreasuryManager', 'treasury', 'core'];
deployTreasuryManager.dependencies = [];

export default deployTreasuryManager;