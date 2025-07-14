const hre = require("hardhat");

async function main() {
  const SourceApp = await hre.ethers.getContractFactory("SourceApp");
  const app = await SourceApp.deploy();

  await app.waitForDeployment();
  console.log(`✅ SourceApp deployed at ${await app.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
