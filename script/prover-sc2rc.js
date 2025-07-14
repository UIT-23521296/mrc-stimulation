// prover-sc2rc.js
require("dotenv").config();
console.log("PRIVATE_KEY loaded:", process.env.PRIVATE_KEY);

const { ethers } = require("ethers");
const { generateProof } = require("./prover");
const {
  selectRelay_HybridAdaptive,
  updateLatencies,
  updateResourceInfo,
  updatePerformanceMetrics,
  updateAdaptiveProperties,
  calculateSuccessRate,
  computeWeight
} = require("../relay-algorithms");

const SourceAppABI = require("../artifacts/contracts/SourceApp.sol/SourceApp.json").abi;
const RelayRegistryABI = require("../artifacts/contracts/RelayRegistry.sol/RelayRegistry.json").abi;
const registryAddresses = {
  RelayChain1: require("./deployments/relayChain1/RelayRegistry.json").address,
  RelayChain2: require("./deployments/relayChain2/RelayRegistry.json").address,
  RelayChain3: require("./deployments/relayChain3/RelayRegistry.json").address
};

const sourceAppAddress = require("./deployments/sourceChain/SourceApp.json").address;

const sourceProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8548"); // SC
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, sourceProvider);
const sourceApp = new ethers.Contract(sourceAppAddress, SourceAppABI, sourceProvider);

const RELAY_CHAINS = [
  {
    name: "RelayChain1",
    url: "http://127.0.0.1:8545",
    provider: new ethers.JsonRpcProvider("http://127.0.0.1:8545"),
    healthy: true,
    load: 0,
    latency: 0,
    successCount: 0,
    totalRequests: 0,
    gasPrice: 0,
    blockTime: 0,
    networkCongestion: 0,
    historicalLatency: [],
    maxLatency: 0,
    minLatency: Infinity,
    capabilities: {
      transactionTypes: ["DeFi", "NFT"],
      chainTypes: ["EVM"],
      supportedTokens: ["ETH", "USDC"],
      securityLevel: "High",
      processingSpeed: "Fast",
      costTier: "Premium",
      maxGasLimit: 30000000
    },
    adaptiveMetrics: defaultAdaptiveMetrics(),
    performance: defaultPerformance()
  },
  {
    name: "RelayChain2",
    url: "http://127.0.0.1:8546",
    provider: new ethers.JsonRpcProvider("http://127.0.0.1:8546"),
    healthy: true,
    load: 0,
    latency: 0,
    successCount: 0,
    totalRequests: 0,
    gasPrice: 0,
    blockTime: 0,
    networkCongestion: 0,
    historicalLatency: [],
    maxLatency: 0,
    minLatency: Infinity,
    capabilities: {
      transactionTypes: ["General", "Gaming"],
      chainTypes: ["EVM", "Layer2"],
      supportedTokens: ["ETH", "USDC", "DAI"],
      securityLevel: "Medium",
      processingSpeed: "Normal",
      costTier: "Standard",
      maxGasLimit: 20000000
    },
    adaptiveMetrics: defaultAdaptiveMetrics(),
    performance: defaultPerformance()
  },
  {
    name: "RelayChain3",
    url: "http://127.0.0.1:8547",
    provider: new ethers.JsonRpcProvider("http://127.0.0.1:8547"),
    healthy: true,
    load: 0,
    latency: 0,
    successCount: 0,
    totalRequests: 0,
    gasPrice: 0,
    blockTime: 0,
    networkCongestion: 0,
    historicalLatency: [],
    maxLatency: 0,
    minLatency: Infinity,
    capabilities: {
      transactionTypes: ["Gaming", "General"],
      chainTypes: ["EVM"],
      supportedTokens: ["ETH"],
      securityLevel: "Low",
      processingSpeed: "Slow",
      costTier: "Economy",
      maxGasLimit: 15000000
    },
    adaptiveMetrics: defaultAdaptiveMetrics(),
    performance: defaultPerformance()
  }
];

function defaultAdaptiveMetrics() {
  return {
    failureRate: 0,
    consecutiveFailures: 0,
    lastFailureTime: 0,
    securityScore: 1.0,
    avgLatency: 0,
    latencyVariance: 0,
    throughput: 0,
    performanceScore: 1.0,
    avgGasPrice: 0,
    gasPriceTrend: 0,
    costEfficiency: 1.0,
    costScore: 1.0,
    currentGasUsage: 0,
    maxObservedGas: 0,
    capacityUtilization: 0,
    capacityScore: 1.0,
    latencyHistory: [],
    gasPriceHistory: [],
    failureHistory: [],
    successHistory: []
  };
}

function defaultPerformance() {
  return {
    avgProcessingTime: 0,
    reliabilityScore: 1.0,
    costEfficiency: 1.0
  };
}

async function main() {
  console.log("🔍 Listening for ContextSent events from SourceApp...");

  sourceApp.on("ContextSent", async (to, data, nonce, event) => {
    console.log(`\n📦 New context from SC | nonce=${nonce}, to=${to}`);
    const { chainId } = await sourceProvider.getNetwork();

    const txObj = {
        source: await signer.getAddress(), // ✅ thêm dòng này
        to,
        data,
        nonce: Number(nonce),
        blockNumber: event.blockNumber,
        chainId
    };

    console.log("📬 Relaying to:", to);
    console.log("📬 Should match TargetReceiver:", require("./deployments/destinationChain/TargetReceiver.json").address);


    const proof = await generateProof(txObj, "SC2RC");

    await updateLatencies(RELAY_CHAINS);
    await updateResourceInfo(RELAY_CHAINS);
    await updatePerformanceMetrics(RELAY_CHAINS, calculateSuccessRate);
    await updateAdaptiveProperties(RELAY_CHAINS);

    RELAY_CHAINS.forEach(rc => rc.weight = computeWeight(rc));

    const selectedRC = selectRelay_HybridAdaptive(
      RELAY_CHAINS,
      "General",
      {
        General: {
          requiredTypes: ["General"],
          minSecurityLevel: "Low",
          minProcessingSpeed: "Slow",
          maxCostTier: "Standard",
          requiredTokens: ["ETH"],
          minGasLimit: 100000,
          priority: "Low"
        }
      },
      calculateSuccessRate
    );

    if (!selectedRC) {
      console.warn("❌ No suitable relay available");
      return;
    }

    const relaySigner = new ethers.Wallet(process.env.PRIVATE_KEY, selectedRC.provider);
    const selectedRegistryAddress = registryAddresses[selectedRC.name];
    const registry = new ethers.Contract(selectedRegistryAddress, RelayRegistryABI, relaySigner);

    try {
      const tx = await registry.relayFromSource(to, data, proof.proofHash);
      await tx.wait();
      console.log(`✅ Relayed ctx[${nonce}] to ${selectedRC.name}: tx=${tx.hash}`);
    } catch (e) {
      console.error(`🔥 Relay failed to ${selectedRC.name}:`, e.message);
    }
  });
}

main();
