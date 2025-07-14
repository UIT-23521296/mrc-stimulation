const { computeWeight } = require('./adaptiveProperties');

// ⚙️ Tham số điều chỉnh thuật toán
const BETA = 0.01; // Tầm ảnh hưởng của latency

// ✅ Hàm chọn relay theo Weighted Least Connections
function selectRelay_WLC(relays) {
    const healthy = relays.filter(r => r.healthy);
    if (healthy.length === 0) throw new Error("❌ No healthy relay available.");

    let bestRelay = null;
    let bestScore = Infinity;

    for (const relay of healthy) {
        const weight = computeWeight(relay) || 1; // tránh chia 0
        const score = (relay.load / weight) + BETA * relay.latency;

        if (score < bestScore) {
            bestScore = score;
            bestRelay = relay;
        }

        console.log(`   - ${relay.name}: Load=${relay.load}, Weight=${weight}, Latency=${relay.latency}ms, Score=${score.toFixed(3)}`);
    }

    if (!bestRelay) throw new Error("❌ No suitable relay selected by WLC.");

    return bestRelay;
}

// 🛰️ Hàm đo độ trễ thực tế giữa app và các relay
async function updateLatencies(relays) {
    for (const chain of relays) {
        const start = Date.now();
        try {
            await chain.provider.getBlockNumber();
            chain.latency = Date.now() - start;
            chain.healthy = true;
        } catch {
            chain.latency = Infinity;
            chain.healthy = false;
        }
    }
}

module.exports = { selectRelay_WLC, updateLatencies };
