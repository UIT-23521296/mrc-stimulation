const hre = require("hardhat");

async function main() {
  const SourceApp = await hre.ethers.getContractFactory("SourceApp");
  const app = await SourceApp.deploy();

  await app.waitForDeployment();
    const fs = require("fs");
    const path = "./deployments/sourceChain";
    fs.mkdirSync(path, { recursive: true });
    fs.writeFileSync(
      `${path}/SourceApp.json`,
      JSON.stringify({ address: await app.getAddress() }, null, 2)
  );
  console.log(`✅ SourceApp deployed at ${await app.getAddress()}`);
  

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
