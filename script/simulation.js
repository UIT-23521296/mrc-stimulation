const { ethers } = require("hardhat");
const registryAddress = require('../registry-address.json').address;
const {
  selectRelay_WeightedRoundRobin,
  selectRelay_WLC,
  selectRelay_ResourceBased,
  selectRelay_HybridAdaptive,
  updateLatencies,
  calculateSuccessRate,
  updateResourceInfo,
  updatePerformanceMetrics,
  updateAdaptiveProperties, 
  trackTransactionResult,
  computeWeight
} = require('../relay-algorithms');



// const RELAY_CHAINS = [
//   { name: 'RelayChain1', url: 'http://127.0.0.1:8545', load: 0, latency: 0, healthy: true, provider: null, successCount: 0 },
//   { name: 'RelayChain2', url: 'http://127.0.0.1:8546', load: 0, latency: 0, healthy: true, provider: null, successCount: 0 },
//   { name: 'RelayChain3', url: 'http://127.0.0.1:8547', load: 0, latency: 0, healthy: true, provider: null, successCount: 0 },
// ];

const RELAY_CHAINS = [
  { 
    name: 'RelayChain1', 
    url: 'http://127.0.0.1:8545', 
    load: 0, 
    latency: 0, 
    healthy: true, 
    provider: null, 
    successCount: 0,
    totalRequests: 0,
    gasPrice: 0,
    blockTime: 0,
    networkCongestion: 0,
    historicalLatency: [],
    maxLatency: 0,
    minLatency: Infinity,
    
    // Adaptive capabilities - sẽ được tính toán động
    capabilities: {
      transactionTypes: ['DeFi', 'NFT', 'Gaming', 'General'],
      chainTypes: ['EVM', 'Layer2'],
      supportedTokens: ['ETH', 'USDC', 'USDT', 'DAI'],
      // Các thuộc tính adaptive - sẽ được tính toán
      securityLevel: 'Medium', // Sẽ được tính toán
      processingSpeed: 'Normal', // Sẽ được tính toán
      costTier: 'Standard', // Sẽ được tính toán
      maxGasLimit: 20000000, // Sẽ được tính toán
    },
    
    // Metrics để tính toán adaptive properties
    adaptiveMetrics: {
      // Security metrics
      failureRate: 0,
      consecutiveFailures: 0,
      lastFailureTime: 0,
      securityScore: 1.0,
      
      // Performance metrics
      avgLatency: 0,
      latencyVariance: 0,
      throughput: 0,
      performanceScore: 1.0,
      
      // Cost metrics
      avgGasPrice: 0,
      gasPriceTrend: 0,
      costEfficiency: 1.0,
      costScore: 1.0,
      
      // Capacity metrics
      currentGasUsage: 0,
      maxObservedGas: 0,
      capacityUtilization: 0,
      capacityScore: 1.0,
      
      // Historical data
      latencyHistory: [],
      gasPriceHistory: [],
      failureHistory: [],
      successHistory: []
    },
    
    performance: {
      avgProcessingTime: 0,
      reliabilityScore: 1.0,
      costEfficiency: 1.0
    }
  },
  { 
    name: 'RelayChain2', 
    url: 'http://127.0.0.1:8546', 
    load: 0, 
    latency: 0, 
    healthy: true, 
    provider: null, 
    successCount: 0,
    totalRequests: 0,
    gasPrice: 0,
    blockTime: 0,
    networkCongestion: 0,
    historicalLatency: [],
    maxLatency: 0,
    minLatency: Infinity,
    
    // Adaptive capabilities - sẽ được tính toán động
    capabilities: {
      transactionTypes: ['DeFi', 'NFT', 'Gaming', 'General'],
      chainTypes: ['EVM', 'Layer2'],
      supportedTokens: ['ETH', 'USDC', 'USDT', 'DAI'],
      // Các thuộc tính adaptive - sẽ được tính toán
      securityLevel: 'Medium', // Sẽ được tính toán
      processingSpeed: 'Normal', // Sẽ được tính toán
      costTier: 'Standard', // Sẽ được tính toán
      maxGasLimit: 20000000, // Sẽ được tính toán
    },
    
    // Metrics để tính toán adaptive properties
    adaptiveMetrics: {
      // Security metrics
      failureRate: 0,
      consecutiveFailures: 0,
      lastFailureTime: 0,
      securityScore: 1.0,
      
      // Performance metrics
      avgLatency: 0,
      latencyVariance: 0,
      throughput: 0,
      performanceScore: 1.0,
      
      // Cost metrics
      avgGasPrice: 0,
      gasPriceTrend: 0,
      costEfficiency: 1.0,
      costScore: 1.0,
      
      // Capacity metrics
      currentGasUsage: 0,
      maxObservedGas: 0,
      capacityUtilization: 0,
      capacityScore: 1.0,
      
      // Historical data
      latencyHistory: [],
      gasPriceHistory: [],
      failureHistory: [],
      successHistory: []
    },
    
    performance: {
      avgProcessingTime: 0,
      reliabilityScore: 1.0,
      costEfficiency: 1.0
    }
  },
  { 
    name: 'RelayChain3', 
    url: 'http://127.0.0.1:8547', 
    load: 0, 
    latency: 0, 
    healthy: true, 
    provider: null, 
    successCount: 0,
    totalRequests: 0,
    gasPrice: 0,
    blockTime: 0,
    networkCongestion: 0,
    historicalLatency: [],
    maxLatency: 0,
    minLatency: Infinity,
    
    // Adaptive capabilities - sẽ được tính toán động
    capabilities: {
      transactionTypes: ['DeFi', 'NFT', 'Gaming', 'General'],
      chainTypes: ['EVM', 'Layer2'],
      supportedTokens: ['ETH', 'USDC', 'USDT', 'DAI'],
      // Các thuộc tính adaptive - sẽ được tính toán
      securityLevel: 'Medium', // Sẽ được tính toán
      processingSpeed: 'Normal', // Sẽ được tính toán
      costTier: 'Standard', // Sẽ được tính toán
      maxGasLimit: 20000000, // Sẽ được tính toán
    },
    
    // Metrics để tính toán adaptive properties
    adaptiveMetrics: {
      // Security metrics
      failureRate: 0,
      consecutiveFailures: 0,
      lastFailureTime: 0,
      securityScore: 1.0,
      
      // Performance metrics
      avgLatency: 0,
      latencyVariance: 0,
      throughput: 0,
      performanceScore: 1.0,
      
      // Cost metrics
      avgGasPrice: 0,
      gasPriceTrend: 0,
      costEfficiency: 1.0,
      costScore: 1.0,
      
      // Capacity metrics
      currentGasUsage: 0,
      maxObservedGas: 0,
      capacityUtilization: 0,
      capacityScore: 1.0,
      
      // Historical data
      latencyHistory: [],
      gasPriceHistory: [],
      failureHistory: [],
      successHistory: []
    },
    
    performance: {
      avgProcessingTime: 0,
      reliabilityScore: 1.0,
      costEfficiency: 1.0
    }
  }
];


// 🎯 Transaction Requirements - có thể thay đổi theo từng transaction
const TRANSACTION_REQUIREMENTS = {
  // Requirements cho DeFi transaction
  DeFi: {
    requiredTypes: ['DeFi'],
    minSecurityLevel: 'Medium',
    minProcessingSpeed: 'Normal',
    maxCostTier: 'Premium',
    requiredTokens: ['ETH', 'USDC', 'USDT'],
    minGasLimit: 500000,
    priority: 'High'
  },
  
  // Requirements cho NFT transaction
  NFT: {
    requiredTypes: ['NFT'],
    minSecurityLevel: 'Medium',
    minProcessingSpeed: 'Normal',
    maxCostTier: 'Standard',
    requiredTokens: ['ETH'],
    minGasLimit: 300000,
    priority: 'Medium'
  },
  
  // Requirements cho Gaming transaction
  Gaming: {
    requiredTypes: ['Gaming'],
    minSecurityLevel: 'Low',
    minProcessingSpeed: 'Normal',
    maxCostTier: 'Economy',
    requiredTokens: ['ETH'],
    minGasLimit: 200000,
    priority: 'Low'
  },
  
  // Requirements cho General transaction
  General: {
    requiredTypes: ['General'],
    minSecurityLevel: 'Low',
    minProcessingSpeed: 'Slow',
    maxCostTier: 'Economy',
    requiredTokens: ['ETH'],
    minGasLimit: 100000,
    priority: 'Low'
  }
};

async function main() {
  console.log("🚀 Starting MRC Simulation ...");
  let fallbackCount = 0

  for (const chain of RELAY_CHAINS) {
    try {
      chain.provider = new ethers.JsonRpcProvider(chain.url);
      await chain.provider.getNetwork();
      console.log(`✅ Connected to ${chain.name}`);
    } catch (e) {
      console.error(`❌ Could not connect to ${chain.name}: ${e.message}`);
      chain.healthy = false;
    }
  }

  const healthyRelays = RELAY_CHAINS.filter(r => r.healthy);
  if (healthyRelays.length === 0) {
    console.error("❌ No healthy relay chains available. Exiting.");
    return;
  }

  const mainProvider = healthyRelays[0].provider;
  const registry = await ethers.getContractAt("RelayRegistry", registryAddress, await mainProvider.getSigner());
  console.log(`\n🔗 Connected to RelayRegistry at ${registryAddress}`);

  const SOURCE_CHAIN_ID = "SourceChain-A";
  const NUM_TRANSACTIONS = 20;
  const useWLC = false; 
  const useResourceBased = false;
  const useHybridAdaptive = true;
  const transactionTypes = ['DeFi', 'NFT', 'Gaming', 'General'];

  console.log(`\n🔄 Simulating ${NUM_TRANSACTIONS} cross-chain transactions using ${useWLC ? 'WLC' : useResourceBased ? 'Resource-Based' : useHybridAdaptive ? 'Hybrid Adaptive' : 'Round Robin'}...\n`);

  for (let i = 1; i <= NUM_TRANSACTIONS; i++) {
    console.log(`--- Transaction #${i} ---`);

    // Chọn ngẫu nhiên transaction type
    const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    console.log(`📋 Transaction Type: ${transactionType}`);

    await updateLatencies(RELAY_CHAINS);
    await updateResourceInfo(RELAY_CHAINS);
    await updatePerformanceMetrics(RELAY_CHAINS, calculateSuccessRate);
    await updateAdaptiveProperties(RELAY_CHAINS); 

        
    for (const chain of RELAY_CHAINS) {
      const weight = computeWeight(chain);
      console.log(`⚖️  ${chain.name} - Computed Weight: ${weight}`);
    }

    let selectedRelay;
    try {
      if (useHybridAdaptive) {
        selectedRelay = selectRelay_HybridAdaptive(RELAY_CHAINS, transactionType, TRANSACTION_REQUIREMENTS, calculateSuccessRate);
  
        if (!selectedRelay) {
          console.warn(`⚠️ No eligible relays found for ${transactionType}, falling back to WLC...`);
          selectedRelay = selectRelay_WLC(RELAY_CHAINS);
          fallbackCount++;
        }
      } else if (useResourceBased) {
        selectedRelay = selectRelay_ResourceBased(RELAY_CHAINS);
      } else if (useWLC) {
        selectedRelay = selectRelay_WLC(RELAY_CHAINS);
      } else {
        selectedRelay = selectRelay_WeightedRoundRobin(RELAY_CHAINS);
      }      
    } catch (e) {
      console.error("❌ No suitable relay at this time.");
      continue;
    }

    console.log(`⚖️  Selected: ${selectedRelay.name} | Load: ${selectedRelay.load} | Latency: ${selectedRelay.latency}ms`);
    console.log(`   Adaptive Properties: ${selectedRelay.capabilities.securityLevel}/${selectedRelay.capabilities.processingSpeed}/${selectedRelay.capabilities.costTier}`);


    try {
      selectedRelay.load++; // tăng khi bắt đầu
      selectedRelay.totalRequests++; 

      const signer = await selectedRelay.provider.getSigner();
      const tx = await signer.sendTransaction({
        to: signer.address,
        value: ethers.parseEther("0.001")
      });

      await tx.wait();
      selectedRelay.successCount++;

      // Track successful transaction
      trackTransactionResult(selectedRelay, true, 21000); // Ước tính gas used

      console.log(`📬 Tx #${i} sent to ${selectedRelay.name}: ${tx.hash}`);
    } catch (e) {
      console.error(`🔥 Error with ${selectedRelay.name}: ${e.message}`);
      selectedRelay.healthy = false;
      // Track failed transaction
      trackTransactionResult(selectedRelay, false);
    } finally {
      selectedRelay.load--; // giảm khi hoàn tất
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n✅ SIMULATION COMPLETE");
  if (useHybridAdaptive)
    console.log(`🚨 Total Fallbacks to WLC: ${fallbackCount} / ${NUM_TRANSACTIONS}`);
  console.log("📊 Final Relay Stats:");
  RELAY_CHAINS.forEach(chain => {
    console.log(`  - ${chain.name}: Success=${chain.successCount} tx | Latency=${chain.latency}ms | Healthy=${chain.healthy}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
