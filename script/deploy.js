const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const relayRegistry = await hre.ethers.deployContract("RelayRegistry");
  await relayRegistry.waitForDeployment();

  const address = await relayRegistry.getAddress();
  console.log(`RelayRegistry deployed to: ${address}`);

  // Ghi đúng vào thư mục theo tên mạng
  const networkName = hre.network.name;
  const path = `./deployments/${networkName}`;
  fs.mkdirSync(path, { recursive: true });
  fs.writeFileSync(`${path}/RelayRegistry.json`, JSON.stringify({ address }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
