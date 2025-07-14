// sendCtx.js
require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const SourceApp = await ethers.getContractFactory("SourceApp");

  // Đọc địa chỉ contract từ deploy
  const deployed = require("./deployments/sourceChain/SourceApp.json");
  const sourceApp = await SourceApp.attach(deployed.address);

  const dummyTarget = require("./deployments/destinationChain/TargetReceiver.json").address;


  const payload = ethers.encodeBytes32String("cross-chain-ping");

  const tx = await sourceApp.sendContext(dummyTarget, payload);
  console.log("⏳ Sending ctx...");
  await tx.wait();
  console.log("✅ ctx sent: ", tx.hash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
