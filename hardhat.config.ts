import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-verify';
import '@nomicfoundation/hardhat-chai-matchers';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  
  networks: {
    hardhat: {
      chainId: 1337,
      forking: process.env.MAINNET_RPC_URL ? {
        url: process.env.MAINNET_RPC_URL,
        blockNumber: undefined
      } : undefined
    },
    
    localhost: {
      chainId: 1337,
      url: 'http://127.0.0.1:8545'
    },

    // Testnets
    sepolia: {
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },

    'base-sepolia': {
      chainId: 84532,
      url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000 // 1 gwei
    },

    // Mainnets
    mainnet: {
      chainId: 1,
      url: process.env.MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 'auto'
    },

    base: {
      chainId: 8453,
      url: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 'auto',
      verify: {
        etherscan: {
          apiUrl: 'https://api.basescan.org',
          apiKey: process.env.BASESCAN_API_KEY || ''
        }
      }
    },

    arbitrum: {
      chainId: 42161,
      url: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },

    optimism: {
      chainId: 10,
      url: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },

  namedAccounts: {
    deployer: {
      default: 0
    },
    treasury: {
      default: 1
    },
    cfo: {
      default: 0
    }
  },

  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      base: process.env.BASESCAN_API_KEY || '',
      'base-sepolia': process.env.BASESCAN_API_KEY || '',
      arbitrumOne: process.env.ARBISCAN_API_KEY || '',
      optimisticEthereum: process.env.OPTIMISM_ETHERSCAN_API_KEY || ''
    },
    customChains: [
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org'
        }
      },
      {
        network: 'base-sepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org'
        }
      }
    ]
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
    outputFile: 'gas-report.txt',
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },

  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
    deploy: './deploy'
  },

  mocha: {
    timeout: 60000
  }
};

export default config;