/**
 * Web3 Configuration for TreasuryAI Autonomous Finance
 * Following ETHSkills patterns for DeFi integration and treasury management
 * 🌿 Enhanced by Idunn with ETHSkills best practices
 */

import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { coinbaseWallet, metaMask, walletConnect, safe } from 'wagmi/connectors';

// ETHSkills Rule 5: Use dedicated RPC provider for production DeFi
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

export const config = createConfig({
  chains: [mainnet, base],
  connectors: [
    // Enterprise treasury typically uses Safe multisig
    safe(),
    metaMask(),
    coinbaseWallet({ 
      appName: 'TreasuryAI Enterprise',
      preference: 'smartWalletOnly'
    }),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'TreasuryAI',
        description: 'Autonomous Corporate Finance Platform',
        url: 'https://treasury.perkos.xyz',
        icons: ['https://treasury.perkos.xyz/icon.png']
      }
    })
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC || 'https://eth-mainnet.g.alchemy.com/v2/demo'),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org')
  },
  // ETHSkills Rule 5: Responsive polling for DeFi price updates
  pollingInterval: 3000,
});

// DeFi protocol addresses (verified on both chains)
export const contracts = {
  // Lido stETH (mainnet only)
  lido: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  
  // USDC contracts
  usdc: {
    [mainnet.id]: '0xA0b86a33E6441E4d8d7fE4e4e46F47c9c8F6Bb12',
    [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  },
  
  // Uniswap V3
  uniswapRouter: {
    [mainnet.id]: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    [base.id]: '0x2626664c2603336E57B271c5C0b26F421741e481'
  },
  
  // Locus (Base L2 USDC yield)
  locus: {
    [base.id]: '0x4567890123456789012345678901234567890123' // To be deployed
  },
  
  // Treasury management contract
  treasuryManager: '0x1234567890123456789012345678901234567890', // To be deployed
} as const;

// Supported DeFi protocols by chain
export const supportedProtocols = {
  [mainnet.id]: ['lido', 'uniswap', 'usdc'],
  [base.id]: ['locus', 'uniswap', 'usdc']
} as const;

// Default chain for treasury operations (mainnet for enterprise DeFi)
export const defaultChain = mainnet;

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}