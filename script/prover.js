const { ethers } = require("ethers");

// Giả lập độ trễ tạo proof (ms)
const DEFAULT_DELAY_MS = 300;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sinh proof giả lập từ giao dịch
 * @param {Object} transaction - Giao dịch từ SC hoặc RC
 * @param {String} type - 'SC2RC' hoặc 'RC2DC'
 * @returns {Object} - Bằng chứng gồm hash, timestamp và thời gian xử lý
 */
async function generateProof(transaction, type = 'SC2RC') {
  const start = Date.now();

  // Giả lập độ trễ tạo proof
  await sleep(DEFAULT_DELAY_MS);

  const rawData = JSON.stringify({
    source: transaction.source || transaction.from || 'unknown',
    target: transaction.target || transaction.to || 'unknown',
    value: transaction.value || 0,
    nonce: transaction.nonce || 0,
    type,
    timestamp: Date.now()
  });

  const proofHash = ethers.keccak256(ethers.toUtf8Bytes(rawData));

  const proof = {
    proofHash,
    createdAt: new Date().toISOString(),
    elapsedMs: Date.now() - start,
    proofType: type,
    rawData
  };

  return proof;
}

module.exports = {
  generateProof
};
