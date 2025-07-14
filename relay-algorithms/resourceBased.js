const { ethers } = require("hardhat");
const MAX_HISTORICAL_LATENCY = 10; // Số lượng latency history để lưu

// ⚙️ Tham số Resource-Based Selection
const RESOURCE_WEIGHTS = {
    LOAD: 0.25,           // Trọng số cho tải
    LATENCY: 0.20,        // Trọng số cho độ trễ
    SUCCESS_RATE: 0.25,   // Trọng số cho tỷ lệ thành công
    GAS_PRICE: 0.15,      // Trọng số cho giá gas
    CONGESTION: 0.15      // Trọng số cho tắc nghẽn mạng
};

// ================= Resource-Based Selection =================
function calculateSuccessRate(relay) {
    if (relay.totalRequests === 0) return 1.0;
    return relay.successCount / relay.totalRequests;
}

async function updateResourceInfo(relays, maxLatencyHistory = 10) {
    for (const chain of relays) {
        if (!chain.healthy) continue;
        
        try {
            // Cập nhật gas price
            const feeData = await chain.provider.getFeeData();
            console.log(`[${chain.name}] feeData =`, feeData);
            chain.gasPrice = Number(feeData.gasPrice);
            
            // Cập nhật block time
            const currentBlock = await chain.provider.getBlockNumber();
            const block = await chain.provider.getBlock(currentBlock);
            let blockTime = 0;
            if (currentBlock > 0) {
                const prevBlock = await chain.provider.getBlock(currentBlock - 1);
                blockTime = block.timestamp - prevBlock.timestamp;
            }
            chain.blockTime = blockTime;
            
            // Cập nhật network congestion (dựa trên gas price)
            chain.networkCongestion = Math.min(chain.gasPrice / 20000000000, 1.0); // Normalize
            
            // Cập nhật historical latency
            chain.historicalLatency.push(chain.latency);
            if (chain.historicalLatency.length > MAX_HISTORICAL_LATENCY) {
                chain.historicalLatency.shift();
            }
        
            // Cập nhật min/max latency
            chain.maxLatency = Math.max(chain.maxLatency, chain.latency);
            chain.minLatency = Math.min(chain.minLatency, chain.latency);
        
        } catch (error) {
            console.error(`Error updating resource info for ${chain.name}:`, error.message);
        }
    }
}
  
function computeResourceScore(relay, allRelays) {
    // Tìm giá trị max thực tế từ tất cả relay
    const maxLoad = Math.max(...allRelays.map(r => r.load), 1);
    const maxLatency = Math.max(...allRelays.map(r => r.latency), 1);
    const maxGasPrice = Math.max(...allRelays.map(r => r.gasPrice), 1);
    const maxCongestion = Math.max(...allRelays.map(r => r.networkCongestion), 1);

    // Normalize dựa trên max thực tế (tránh chia 0)
    const normalizedLoad = relay.load / maxLoad;
    const normalizedLatency = relay.latency / maxLatency;
    const normalizedGasPrice = relay.gasPrice / maxGasPrice;
    const normalizedCongestion = relay.networkCongestion / maxCongestion;
    const successRate = calculateSuccessRate(relay); // giữ nguyên

    // Tính điểm tổng hợp
    const score = 
        RESOURCE_WEIGHTS.LOAD * (1 - normalizedLoad) +
        RESOURCE_WEIGHTS.LATENCY * (1 - normalizedLatency) +
        RESOURCE_WEIGHTS.SUCCESS_RATE * successRate +
        RESOURCE_WEIGHTS.GAS_PRICE * (1 - normalizedGasPrice) +
        RESOURCE_WEIGHTS.CONGESTION * (1 - normalizedCongestion);

    return score;
}

  
function selectRelay_ResourceBased(relays) {
    const healthy = relays.filter(r => r.healthy);
    if (healthy.length === 0) throw new Error("❌ No healthy relay available.");

    let bestRelay = null;
    let bestScore = -1;

    console.log("🔍 Resource-Based Selection Analysis:");

    for (const relay of healthy) {
        const score = computeResourceScore(relay, healthy);
        const successRate = calculateSuccessRate(relay);
        
        console.log(`   - ${relay.name}:`);
        console.log(`     Load: ${relay.load} | Latency: ${relay.latency}ms | Success Rate: ${(successRate * 100).toFixed(1)}%`);
        console.log(`     Gas Price: ${ethers.formatUnits(relay.gasPrice, 'gwei')} gwei | Congestion: ${(relay.networkCongestion * 100).toFixed(1)}%`);
        console.log(`     Resource Score: ${score.toFixed(3)}`);
        
        if (score > bestScore) {
            bestScore = score;
            bestRelay = relay;
        }
    }

    return bestRelay;
}


module.exports = {
    selectRelay_ResourceBased,
    calculateSuccessRate,
    updateResourceInfo,
    computeResourceScore
};