require("@nomicfoundation/hardhat-toolbox")
require("@chainlink/env-enc").config()
require("./tasks")
require('hardhat-deploy')

const SEPOLIA_URL = process.env.SEPOLIA_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  mocha: {
    timeout: 500000
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_URL,
      accounts: [PRIVATE_KEY, PRIVATE_KEY_1],
      chainId: 11155111,
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  namedAccounts: {
    firstAccount: {
      default: 0
    },
    secoundAccount: {
      default: 1
    }
  },
  gasReporter: {
    enabled: false
  }
};
