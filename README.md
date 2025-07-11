# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

# Multi-Relay Chain (MRC) Simulation

This is a simulation of the Multi-Relay Chain architecture using Hardhat. It demonstrates dynamic relay selection and load balancing using smart contracts.

## Features
- Smart contract `RelayRegistry.sol` to manage relay assignments
- Two relay selection strategies: Round Robin and Least Load
- Simulation script for sending cross-chain proofs
- Compatible with local Hardhat nodes

## How to Run

```bash
npx hardhat node --port 8545
npx hardhat node --port 8546
npx hardhat node --port 8547

npx hardhat run script/deploy.js --network relay_chain_1
npx hardhat run script/simulation.js
