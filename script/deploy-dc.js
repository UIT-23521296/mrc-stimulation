async function main() {
  const TargetReceiver = await ethers.getContractFactory("TargetReceiver");
  const receiver = await TargetReceiver.deploy();
  await receiver.waitForDeployment();

  console.log("✅ TargetReceiver deployed at:", await receiver.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
