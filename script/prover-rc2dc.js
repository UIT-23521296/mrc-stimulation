// prover-rc2dc.js
require("dotenv").config();
console.log("PRIVATE_KEY loaded:", process.env.PRIVATE_KEY);

const { ethers } = require("ethers");
const { generateProof } = require("./prover");
const RelayRegistryABI = require("../artifacts/contracts/RelayRegistry.sol/RelayRegistry.json").abi;
const TargetReceiverABI = require("../artifacts/contracts/TargetReceiver.sol/TargetReceiver.json").abi;
const registryAddresses = {
  8545: require("./deployments/relayChain1/RelayRegistry.json").address,
  8546: require("./deployments/relayChain2/RelayRegistry.json").address,
  8547: require("./deployments/relayChain3/RelayRegistry.json").address,
};

const targetReceiverAddress = require("./deployments/destinationChain/TargetReceiver.json").address;

const RC_PORTS = [8545, 8546, 8547];
const dcProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8549");
const dcSigner = new ethers.Wallet(process.env.PRIVATE_KEY, dcProvider);
const receiver = new ethers.Contract(targetReceiverAddress, TargetReceiverABI, dcSigner);

async function main() {
  console.log("🔍 Listening for RelayedFromSource events from all RCs...");

  for (const port of RC_PORTS) {
    const rcProvider = new ethers.JsonRpcProvider(`http://127.0.0.1:${port}`);
    const registryAddr = registryAddresses[port];
    const relaySigner = new ethers.Wallet(process.env.PRIVATE_KEY, rcProvider);
    const registry = new ethers.Contract(registryAddr, RelayRegistryABI, relaySigner);


    registry.on("RelayedFromSource", async (from, target, data, proofHash, event) => {
      console.log(`\n📦 Event from RC[${port}] to DC: target=${target}`);

      const ctx = {
        source: from,
        target,
        data,  // ✅ bổ sung dòng này
        value: 0,
        nonce: event.logIndex + port
    };


      const proof = await generateProof(ctx, "RC2DC");

      try {
        const tx = await receiver.receiveRelay(from, data, proof.proofHash);
        await tx.wait();
        console.log(`✅ Relayed from RC[${port}] → DC: tx=${tx.hash}`);
      } catch (e) {
        console.error(`❌ Failed from RC[${port}]:`, e.message);
      }
    });
  }
}

main();