const { ethers } = require("hardhat");
const { selectRelay_WLC } = require('./wlc'); 

// 🏆 Ranking mappings
const SECURITY_LEVELS = { High: 3, Medium: 2, Low: 1 };
const PROCESSING_SPEEDS = { Fast: 3, Normal: 2, Slow: 1 };
const COST_TIERS = { Premium: 3, Standard: 2, Economy: 1 };

// ⚙️ Trọng số Hybrid Adaptive
const HYBRID_WEIGHTS = {
    LOAD: 0.25,
    LATENCY: 0.20,
    SUCCESS_RATE: 0.25,
    GAS_PRICE: 0.15,
    CONGESTION: 0.15,
    RELIABILITY: 0.10
};

// 🎯 Bộ lọc theo chủ đề giao dịch
function filterRelaysByTopic(transactionType, requirements, relays) {
    const req = requirements[transactionType];
    if (!req) throw new Error(`❌ Unknown transaction type: ${transactionType}`);

    const eligibleRelays = relays.filter(relay => {
        if (!relay.healthy) return false;

        const cap = relay.capabilities;
        const securityOK = SECURITY_LEVELS[cap.securityLevel] >= SECURITY_LEVELS[req.minSecurityLevel];
        const speedOK = PROCESSING_SPEEDS[cap.processingSpeed] >= PROCESSING_SPEEDS[req.minProcessingSpeed];
        const costOK = COST_TIERS[cap.costTier] <= COST_TIERS[req.maxCostTier];
        const tokenOK = req.requiredTokens.some(t => cap.supportedTokens.includes(t));
        const typeOK = req.requiredTypes.some(t => cap.transactionTypes.includes(t));
        const gasOK = cap.maxGasLimit >= req.minGasLimit;

        return securityOK && speedOK && costOK && tokenOK && typeOK && gasOK;
    });

    console.log(`🔍 Topic-based filtering for ${transactionType}: ${eligibleRelays.length}/${relays.length} eligible`);
    return eligibleRelays;
}

// 🧠 Tính điểm với normalize động
function computeAdvancedResourceScore(relay, allRelays, transactionType, requirements, calculateSuccessRate) {
    const req = requirements[transactionType];

    // Normalize động
    const maxLoad = Math.max(...allRelays.map(r => r.load), 1);
    const maxLatency = Math.max(...allRelays.map(r => r.latency), 1);
    const maxGas = Math.max(...allRelays.map(r => r.gasPrice), 1);
    const maxCongestion = Math.max(...allRelays.map(r => r.networkCongestion), 1);

    const normalizedLoad = relay.load / maxLoad;
    const normalizedLatency = relay.latency / maxLatency;
    const normalizedGasPrice = relay.gasPrice / maxGas;
    const normalizedCongestion = relay.networkCongestion / maxCongestion;
    const successRate = calculateSuccessRate(relay);
    const reliability = relay.performance.reliabilityScore || 1.0;

    // Ưu tiên theo priority
    const priorityMultiplier = {
        High: 1.5,
        Medium: 1.2,
        Low: 1.0
    }[req.priority] || 1.0;

    const score =
        HYBRID_WEIGHTS.LOAD * (1 - normalizedLoad) +
        HYBRID_WEIGHTS.LATENCY * (1 - normalizedLatency) +
        HYBRID_WEIGHTS.SUCCESS_RATE * successRate +
        HYBRID_WEIGHTS.GAS_PRICE * (1 - normalizedGasPrice) +
        HYBRID_WEIGHTS.CONGESTION * (1 - normalizedCongestion) +
        HYBRID_WEIGHTS.RELIABILITY * reliability;

    return score * priorityMultiplier;
}

// 🏆 Hàm chọn relay chính
function selectRelay_HybridAdaptive(relays, transactionType, requirements, calculateSuccessRate) {
    console.log(`\n🎯 Hybrid Adaptive Selection for ${transactionType}`);

    const eligible = filterRelaysByTopic(transactionType, requirements, relays);
    if (eligible.length === 0) 
      return null;

    let bestRelay = null;
    let bestScore = -Infinity;

    console.log(`⚖️  Scoring ${eligible.length} eligible relays:`);

    for (const relay of eligible) {
        const score = computeAdvancedResourceScore(relay, eligible, transactionType, requirements, calculateSuccessRate);
        const successRate = calculateSuccessRate(relay);

        console.log(`   - ${relay.name}:`);
        console.log(`     Load=${relay.load}, Latency=${relay.latency}ms, Success=${(successRate * 100).toFixed(1)}%`);
        console.log(`     Gas=${ethers.formatUnits(relay.gasPrice, 'gwei')} gwei, Congestion=${(relay.networkCongestion * 100).toFixed(1)}%`);
        console.log(`     Score=${score.toFixed(3)}`);

        if (score > bestScore) {
            bestScore = score;
            bestRelay = relay;
        }
    }

    console.log(`🏆 Selected: ${bestRelay.name} (score=${bestScore.toFixed(3)})`);
    return bestRelay;
}

// 📈 Cập nhật hiệu suất
async function updatePerformanceMetrics(relays, calculateSuccessRate) {
    for (const r of relays) {
        if (!r.healthy) continue;

        try {
            if (r.historicalLatency.length > 0) {
                const avg = r.historicalLatency.reduce((a, b) => a + b, 0) / r.historicalLatency.length;
                r.performance.avgProcessingTime = avg;
            }

            const successRate = calculateSuccessRate(r);
            r.performance.reliabilityScore = successRate;

            const normalizedGas = Math.min(r.gasPrice / 50000000000, 1.0);
            r.performance.costEfficiency = 1 - normalizedGas;
        } catch (e) {
            console.error(`⚠️ Error updating performance for ${r.name}: ${e.message}`);
        }
    }
}

module.exports = {
    selectRelay_HybridAdaptive,
    filterRelaysByTopic,
    computeAdvancedResourceScore,
    updatePerformanceMetrics
};
