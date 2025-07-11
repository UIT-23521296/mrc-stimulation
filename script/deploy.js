const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const relayRegistry = await hre.ethers.deployContract("RelayRegistry");
  await relayRegistry.waitForDeployment();

  console.log(`RelayRegistry deployed to: ${relayRegistry.target}`);

  const fs = require('fs');
  fs.writeFileSync('./registry-address.json', JSON.stringify({ address: relayRegistry.target }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
