async function main() {
  const TargetReceiver = await ethers.getContractFactory("TargetReceiver");
  const receiver = await TargetReceiver.deploy();
  await receiver.waitForDeployment();

    const fs = require("fs");
    const path = "./deployments/destinationChain";
    fs.mkdirSync(path, { recursive: true });
    fs.writeFileSync(
    `${path}/TargetReceiver.json`,
    JSON.stringify({ address: await receiver.getAddress() }, null, 2)
    );

  console.log("✅ TargetReceiver deployed at:", await receiver.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
