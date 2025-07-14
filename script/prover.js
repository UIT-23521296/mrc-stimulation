const { ethers } = require("ethers");

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
  await sleep(DEFAULT_DELAY_MS);

  // Kết hợp cả from + data để proof xác thực được
  const from = transaction.source || transaction.from; // tùy từng nơi gọi
  const data = transaction.data;

  const proofHash = ethers.keccak256(
    ethers.solidityPacked(['address', 'bytes'], [from, data])
  );
    console.log("From:", from);
    console.log("Data:", data);
    console.log("ProofHash:", proofHash);


  return {
    proofHash,
    createdAt: new Date().toISOString(),
    elapsedMs: Date.now() - start,
    proofType: type
  };
}

module.exports = {
  generateProof
};
