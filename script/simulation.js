const { ethers } = require("hardhat");
const registryAddress = require('../registry-address.json').address;

const RELAY_CHAINS = [
  { name: 'RelayChain1', url: 'http://127.0.0.1:8545', load: 0 },
  { name: 'RelayChain2', url: 'http://127.0.0.1:8546', load: 0 },
  { name: 'RelayChain3', url: 'http://127.0.0.1:8547', load: 0 },
];

let currentRelayIndex = 0;
function selectRelay_RoundRobin() {
  const selected = RELAY_CHAINS[currentRelayIndex];
  currentRelayIndex = (currentRelayIndex + 1) % RELAY_CHAINS.length;
  return selected;
}

function selectRelay_LeastLoad() {
  return RELAY_CHAINS.reduce((prev, curr) => (prev.load < curr.load ? prev : curr));
}

async function main() {
  console.log("🚀 Starting MRC Simulation...");

  for (const chain of RELAY_CHAINS) {
    try {
      chain.provider = new ethers.JsonRpcProvider(chain.url);
      await chain.provider.getNetwork();
      console.log(`✅ Connected to ${chain.name}`);
    } catch (e) {
      console.error(`❌ Failed to connect to ${chain.name}. Is the node running?`);
      RELAY_CHAINS.splice(RELAY_CHAINS.indexOf(chain), 1);
    }
  }

  if (RELAY_CHAINS.length === 0) {
    console.error("No relay chains available. Exiting.");
    return;
  }

  const mainProvider = RELAY_CHAINS[0].provider;
  const registry = await ethers.getContractAt("RelayRegistry", registryAddress, await mainProvider.getSigner());
  console.log(`\n🔗 Connected to RelayRegistry at ${registryAddress}`);

  const SOURCE_CHAIN_ID = "SourceChain-A";
  const NUM_TRANSACTIONS = 20;
  console.log(`\n🔄 Simulating ${NUM_TRANSACTIONS} cross-chain transactions from ${SOURCE_CHAIN_ID}...\n`);

  for (let i = 1; i <= NUM_TRANSACTIONS; i++) {
    console.log(`--- Transaction #${i} ---`);

    const selectedRelay = selectRelay_LeastLoad(); // hoặc selectRelay_RoundRobin();

    console.log(`⚖️  Load Balancer selected: ${selectedRelay.name} (current load: ${selectedRelay.load})`);

    try {
      const signer = await selectedRelay.provider.getSigner();
      const tx = await signer.sendTransaction({
        to: signer.address,
        value: ethers.parseEther("0.001")
      });
      await tx.wait();
      console.log(`📬 Proof for tx #${i} submitted to ${selectedRelay.name}. Tx hash: ${tx.hash}`);
      selectedRelay.load++;
    } catch (e) {
      console.error(`🔥 Error submitting proof to ${selectedRelay.name}: ${e.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n--- SIMULATION COMPLETE ---");
  console.log("📊 Final Load Distribution:");
  RELAY_CHAINS.forEach(chain => {
    console.log(`  - ${chain.name}: ${chain.load} transactions`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
