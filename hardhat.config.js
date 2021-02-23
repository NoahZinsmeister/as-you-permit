require('dotenv').config()

module.exports = {
  solidity: '0.7.3',
  networks: {
    hardhat: {
      chainId: 1,
      forking: {
        url: process.env.FORKING_URL,
      },
    },
  },
}
