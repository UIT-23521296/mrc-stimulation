const { ethers } = require("hardhat");

// ⚙️ Adaptive Calculation Parameters
const ADAPTIVE_CONFIG = {
  // Security thresholds
  SECURITY_THRESHOLDS: {
    HIGH_FAILURE_RATE: 0.05,    // 5% failure rate = High security
    MEDIUM_FAILURE_RATE: 0.15,  // 15% failure rate = Medium security
    LOW_FAILURE_RATE: 0.30,     // 30% failure rate = Low security
    CONSECUTIVE_FAILURE_LIMIT: 3
  },
  
  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    FAST_LATENCY: 200,          // < 200ms = Fast
    NORMAL_LATENCY: 500,        // < 500ms = Normal
    SLOW_LATENCY: 1000,         // > 1000ms = Slow
    HIGH_THROUGHPUT: 100,       // > 100 tx/min = High throughput
    LOW_THROUGHPUT: 10          // < 10 tx/min = Low throughput
  },
  
  // Cost thresholds
  COST_THRESHOLDS: {
    PREMIUM_GAS_PRICE: 2000000000,    // > 2 gwei = Premium
    STANDARD_GAS_PRICE: 1500000000,   // 1.5-2 gwei = Standard
    ECONOMY_GAS_PRICE: 1000000000,    // < 1 gwei = Economy
    GAS_PRICE_HISTORY_SIZE: 20
  },
  
  // Capacity thresholds
  CAPACITY_THRESHOLDS: {
    HIGH_UTILIZATION: 0.8,      // > 80% = High utilization
    MEDIUM_UTILIZATION: 0.5,    // 50-80% = Medium utilization
    LOW_UTILIZATION: 0.3,       // < 30% = Low utilization
    SAFETY_MARGIN: 0.2          // 20% safety margin
  },
  
  // Learning parameters
  LEARNING: {
    HISTORY_SIZE: 50,
    DECAY_FACTOR: 0.95,         // Weight decay for old data
    MIN_SAMPLES: 5              // Minimum samples before calculating
  }
};

// 🏆 Security Level Ranking
const SECURITY_LEVELS = {
  'High': 3,
  'Medium': 2,
  'Low': 1
};

// ⚡ Processing Speed Ranking
const PROCESSING_SPEEDS = {
  'Fast': 3,
  'Normal': 2,
  'Slow': 1
};

// �� Cost Tier Ranking
const COST_TIERS = {
  'Premium': 3,
  'Standard': 2,
  'Economy': 1
};

// 1. Hàm tính toán Security Level adaptive
function calculateAdaptiveSecurityLevel(relay) {
  const metrics = relay.adaptiveMetrics;
  
  // Tính failure rate
  const totalAttempts = metrics.successHistory.length + metrics.failureHistory.length;
  if (totalAttempts < ADAPTIVE_CONFIG.LEARNING.MIN_SAMPLES) {
    return 'Medium'; // Default khi chưa đủ data
  }
  
  metrics.failureRate = metrics.failureHistory.length / totalAttempts;
  
  // Tính security score dựa trên nhiều yếu tố
  let securityScore = 1.0;
  
  // Factor 1: Failure rate
  if (metrics.failureRate <= ADAPTIVE_CONFIG.SECURITY_THRESHOLDS.HIGH_FAILURE_RATE) {
    securityScore *= 1.0;
  } else if (metrics.failureRate <= ADAPTIVE_CONFIG.SECURITY_THRESHOLDS.MEDIUM_FAILURE_RATE) {
    securityScore *= 0.8;
  } else {
    securityScore *= 0.5;
  }
  
  // Factor 2: Consecutive failures
  if (metrics.consecutiveFailures >= ADAPTIVE_CONFIG.SECURITY_THRESHOLDS.CONSECUTIVE_FAILURE_LIMIT) {
    securityScore *= 0.3;
  }
  
  // Factor 3: Recent failures (failures trong 1 giờ qua)
  const oneHourAgo = Date.now() - 3600000;
  const recentFailures = metrics.failureHistory.filter(time => time > oneHourAgo).length;
  if (recentFailures > 0) {
    securityScore *= (1 - recentFailures * 0.1);
  }
  
  metrics.securityScore = Math.max(0.1, Math.min(1.0, securityScore));
  
  // Map score to security level
  if (metrics.securityScore >= 0.8) return 'High';
  if (metrics.securityScore >= 0.5) return 'Medium';
  return 'Low';
}

// 2. Hàm tính toán Processing Speed adaptive
function calculateAdaptiveProcessingSpeed(relay) {
  const metrics = relay.adaptiveMetrics;
  
  if (metrics.latencyHistory.length < ADAPTIVE_CONFIG.LEARNING.MIN_SAMPLES) {
    return 'Normal'; // Default
  }
  
  // Tính average latency
  metrics.avgLatency = metrics.latencyHistory.reduce((a, b) => a + b, 0) / metrics.latencyHistory.length;
  
  // Tính latency variance
  const variance = metrics.latencyHistory.reduce((sum, latency) => {
    return sum + Math.pow(latency - metrics.avgLatency, 2);
  }, 0) / metrics.latencyHistory.length;
  metrics.latencyVariance = Math.sqrt(variance);
  
  // Tính throughput (transactions per minute)
  const recentSuccesses = metrics.successHistory.filter(time => 
    time > Date.now() - 60000 // 1 phút qua
  ).length;
  metrics.throughput = recentSuccesses;
  
  // Tính performance score
  let performanceScore = 1.0;
  
  // Factor 1: Average latency
  if (metrics.avgLatency <= ADAPTIVE_CONFIG.PERFORMANCE_THRESHOLDS.FAST_LATENCY) {
    performanceScore *= 1.0;
  } else if (metrics.avgLatency <= ADAPTIVE_CONFIG.PERFORMANCE_THRESHOLDS.NORMAL_LATENCY) {
    performanceScore *= 0.8;
  } else {
    performanceScore *= 0.5;
  }
  
  // Factor 2: Latency consistency (variance thấp = tốt)
  const normalizedVariance = Math.min(metrics.latencyVariance / metrics.avgLatency, 1.0);
  performanceScore *= (1 - normalizedVariance * 0.3);
  
  // Factor 3: Throughput
  if (metrics.throughput >= ADAPTIVE_CONFIG.PERFORMANCE_THRESHOLDS.HIGH_THROUGHPUT) {
    performanceScore *= 1.2;
  } else if (metrics.throughput <= ADAPTIVE_CONFIG.PERFORMANCE_THRESHOLDS.LOW_THROUGHPUT) {
    performanceScore *= 0.7;
  }
  
  metrics.performanceScore = Math.max(0.1, Math.min(1.0, performanceScore));
  
  // Map score to processing speed
  if (metrics.performanceScore >= 0.8) return 'Fast';
  if (metrics.performanceScore >= 0.5) return 'Normal';
  return 'Slow';
}

// 3. Hàm tính toán Cost Tier adaptive
function calculateAdaptiveCostTier(relay) {
  const metrics = relay.adaptiveMetrics;
  
  if (metrics.gasPriceHistory.length < ADAPTIVE_CONFIG.LEARNING.MIN_SAMPLES) {
    return 'Standard'; // Default
  }
  
  // Tính average gas price
  metrics.avgGasPrice = metrics.gasPriceHistory.reduce((a, b) => a + b, 0) / metrics.gasPriceHistory.length;
  
  // Tính gas price trend (tăng/giảm)
  if (metrics.gasPriceHistory.length >= 2) {
    const recent = metrics.gasPriceHistory.slice(-5);
    const older = metrics.gasPriceHistory.slice(-10, -5);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    metrics.gasPriceTrend = (recentAvg - olderAvg) / olderAvg;
  }
  
  // Tính cost efficiency
  const normalizedGasPrice = Math.min(metrics.avgGasPrice / ADAPTIVE_CONFIG.COST_THRESHOLDS.PREMIUM_GAS_PRICE, 1.0);
  metrics.costEfficiency = 1 - normalizedGasPrice;
  
  // Tính cost score
  let costScore = 1.0;
  
  // Factor 1: Average gas price
  if (metrics.avgGasPrice <= ADAPTIVE_CONFIG.COST_THRESHOLDS.ECONOMY_GAS_PRICE) {
    costScore *= 1.0;
  } else if (metrics.avgGasPrice <= ADAPTIVE_CONFIG.COST_THRESHOLDS.STANDARD_GAS_PRICE) {
    costScore *= 0.8;
  } else {
    costScore *= 0.5;
  }
  
  // Factor 2: Gas price trend (giảm = tốt)
  if (metrics.gasPriceTrend < -0.1) { // Giảm > 10%
    costScore *= 1.1;
  } else if (metrics.gasPriceTrend > 0.1) { // Tăng > 10%
    costScore *= 0.9;
  }
  
  metrics.costScore = Math.max(0.1, Math.min(1.0, costScore));
  
  // Map score to cost tier
  if (metrics.costScore >= 0.8) return 'Economy';
  if (metrics.costScore >= 0.5) return 'Standard';
  return 'Premium';
}

// 4. Hàm tính toán Max Gas Limit adaptive
function calculateAdaptiveMaxGasLimit(relay) {
  const metrics = relay.adaptiveMetrics;
  
  // Base gas limit
  let baseGasLimit = 20000000;
  
  // Tính capacity utilization
  if (metrics.maxObservedGas > 0) {
    metrics.capacityUtilization = metrics.currentGasUsage / metrics.maxObservedGas;
  }
  
  // Tính capacity score
  let capacityScore = 1.0;
  
  // Factor 1: Current utilization
  if (metrics.capacityUtilization <= ADAPTIVE_CONFIG.CAPACITY_THRESHOLDS.LOW_UTILIZATION) {
    capacityScore *= 1.0; // Có thể tăng gas limit
  } else if (metrics.capacityUtilization <= ADAPTIVE_CONFIG.CAPACITY_THRESHOLDS.MEDIUM_UTILIZATION) {
    capacityScore *= 0.8; // Giữ nguyên
  } else {
    capacityScore *= 0.6; // Giảm gas limit
  }
  
  // Factor 2: Historical max gas usage
  if (metrics.maxObservedGas > 0) {
    const safetyMargin = 1 - ADAPTIVE_CONFIG.CAPACITY_THRESHOLDS.SAFETY_MARGIN;
    baseGasLimit = Math.max(baseGasLimit, metrics.maxObservedGas / safetyMargin);
  }
  
  // Factor 3: Performance impact
  if (metrics.performanceScore < 0.5) {
    baseGasLimit *= 0.8; // Giảm gas limit nếu performance kém
  }
  
  metrics.capacityScore = Math.max(0.1, Math.min(1.0, capacityScore));
  
  // Đảm bảo gas limit trong khoảng hợp lý
  return Math.max(1000000, Math.min(50000000, Math.floor(baseGasLimit)));
}

// 5. Hàm cập nhật adaptive properties
async function updateAdaptiveProperties(relays) {
  for (const chain of relays) {
    if (!chain.healthy) continue;
    
    try {
      // Cập nhật historical data
      updateHistoricalData(chain);
      
      // Tính toán adaptive properties
      chain.capabilities.securityLevel = calculateAdaptiveSecurityLevel(chain);
      chain.capabilities.processingSpeed = calculateAdaptiveProcessingSpeed(chain);
      chain.capabilities.costTier = calculateAdaptiveCostTier(chain);
      chain.capabilities.maxGasLimit = calculateAdaptiveMaxGasLimit(chain);
      
      console.log(`🔄 ${chain.name} Adaptive Properties:`);
      console.log(`   Security: ${chain.capabilities.securityLevel} (Score: ${chain.adaptiveMetrics.securityScore.toFixed(2)})`);
      console.log(`   Speed: ${chain.capabilities.processingSpeed} (Score: ${chain.adaptiveMetrics.performanceScore.toFixed(2)})`);
      console.log(`   Cost: ${chain.capabilities.costTier} (Score: ${chain.adaptiveMetrics.costScore.toFixed(2)})`);
      console.log(`   Max Gas: ${chain.capabilities.maxGasLimit.toLocaleString()}`);
      
    } catch (error) {
      console.error(`Error updating adaptive properties for ${chain.name}:`, error.message);
    }
  }
}

// 6. Hàm cập nhật historical data
function updateHistoricalData(chain) {
  const metrics = chain.adaptiveMetrics;
  
  // Cập nhật latency history
  if (chain.latency > 0) {
    metrics.latencyHistory.push(chain.latency);
    if (metrics.latencyHistory.length > ADAPTIVE_CONFIG.LEARNING.HISTORY_SIZE) {
      metrics.latencyHistory.shift();
    }
  }
  
  // Cập nhật gas price history
  if (chain.gasPrice > 0) {
    metrics.gasPriceHistory.push(chain.gasPrice);
    if (metrics.gasPriceHistory.length > ADAPTIVE_CONFIG.COST_THRESHOLDS.GAS_PRICE_HISTORY_SIZE) {
      metrics.gasPriceHistory.shift();
    }
  }
  
  // Cập nhật max observed gas
  if (chain.load > 0) {
    const estimatedGasUsage = chain.load * 100000; // Ước tính gas usage
    metrics.maxObservedGas = Math.max(metrics.maxObservedGas, estimatedGasUsage);
    metrics.currentGasUsage = estimatedGasUsage;
  }
}

// 7. Hàm track transaction results
function trackTransactionResult(relay, success, gasUsed = 0) {
  const metrics = relay.adaptiveMetrics;
  const currentTime = Date.now();
  
  if (success) {
    metrics.successHistory.push(currentTime);
    metrics.consecutiveFailures = 0;
  } else {
    metrics.failureHistory.push(currentTime);
    metrics.consecutiveFailures++;
    metrics.lastFailureTime = currentTime;
  }
  
  // Clean old history (giữ 24 giờ)
  const oneDayAgo = currentTime - 86400000;
  metrics.successHistory = metrics.successHistory.filter(time => time > oneDayAgo);
  metrics.failureHistory = metrics.failureHistory.filter(time => time > oneDayAgo);
  
  // Cập nhật max observed gas
  if (gasUsed > 0) {
    metrics.maxObservedGas = Math.max(metrics.maxObservedGas, gasUsed);
  }
}

function computeWeight(relay) {
  const perf = relay.adaptiveMetrics.performanceScore || 0.8;
  const cost = relay.adaptiveMetrics.costEfficiency || 0.8;
  const reliab = 1.0 - Math.min(relay.adaptiveMetrics.failureRate || 0.1, 1.0);
  const latency = relay.adaptiveMetrics.avgLatency || 300;

  // ⚖️ Thang điểm latency: latency thấp → điểm cao (nhưng bóp giới hạn lại)
  const latencyScore = Math.max(0.1, Math.min(1.0, 150 / latency));

  // 🧠 Tổng điểm: bạn có thể điều chỉnh trọng số theo ý đồ
  const rawScore = (
    perf * 0.45 +        // hiệu năng: ưu tiên chính
    cost * 0.2 +         // chi phí
    reliab * 0.2 +       // độ tin cậy
    latencyScore * 0.15  // độ trễ
  );

  // 🎯 Scale về trọng số 1–5
  const scaled = Math.round(rawScore * 5);
  const weight = Math.min(5, Math.max(1, scaled));

  relay.weight = weight;

  // 🧪 Debug log nếu cần
  // console.log(`${relay.name}: perf=${perf.toFixed(2)}, cost=${cost.toFixed(2)}, reliab=${reliab.toFixed(2)}, latencyScore=${latencyScore.toFixed(2)} → weight=${weight}`);

  return weight;
}

module.exports = {
  updateAdaptiveProperties,
  trackTransactionResult,
  updateHistoricalData,
  calculateAdaptiveSecurityLevel,
  calculateAdaptiveProcessingSpeed,
  calculateAdaptiveCostTier,
  calculateAdaptiveMaxGasLimit,
  ADAPTIVE_CONFIG,
  computeWeight
};
