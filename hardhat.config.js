require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {},
    relayChain1: {
      url: "http://127.0.0.1:8545",
      accounts: ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80']
    },
    relayChain2: {
      url: "http://127.0.0.1:8546",
      accounts: ['0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d']
    },
    relayChain3: {
      url: "http://127.0.0.1:8547",
      accounts: ['0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a']
    },
    sourceChain: {
      url: "http://127.0.0.1:8548",
      accounts: ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80']
    },
    destinationChain: {
      url: "http://127.0.0.1:8549",
      accounts: ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80']
    }

  }
};
