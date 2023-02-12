import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan"
import "dotenv/config"
import "hardhat-abi-exporter"
import "hardhat-deploy"
import "hardhat-gas-reporter"
import "hardhat-spdx-license-identifier"
import { HardhatUserConfig } from 'hardhat/types';
const accounts = {
  mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
}


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  etherscan: {
    apiKey: {
      bscTestnet:process.env.API_KEY,
      ftmTestnet:process.env.API_KEY,
      // fuji:process.env.API_KEY,
    },        
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts,
      tags: ["local"],
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-2-s3.binance.org:8545",
      accounts,
      chainId: 97,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
      gasMultiplier: 2,
    },
    ftmTestnet: {
      url: "https://rpc.testnet.fantom.network",
      accounts,
      chainId: 4002,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
      gasMultiplier: 2,
    },
  },
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "cache",
    artifacts: "artifacts",
  },

};
export default config