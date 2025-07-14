@echo off
setlocal

echo 🚀 Starting local blockchain nodes...

start "sourceChain" cmd /k "npx hardhat node --port 8548"
start "relayChain1" cmd /k "npx hardhat node --port 8545"
start "relayChain2" cmd /k "npx hardhat node --port 8546"
start "relayChain3" cmd /k "npx hardhat node --port 8547"
start "destinationChain" cmd /k "npx hardhat node --port 8549"

timeout /t 5 >nul

echo 📦 Deploying contracts...
call npx hardhat run deploy.js --network relayChain1
call npx hardhat run deploy.js --network relayChain2
call npx hardhat run deploy.js --network relayChain3

call npx hardhat run deploy-source.js --network sourceChain
call npx hardhat run deploy-dc.js --network destinationChain

echo 🔐 Starting provers...
start "Prover-SC2RC" cmd /k "node prover-sc2rc.js"
start "Prover-RC2DC" cmd /k "node prover-rc2dc.js"

echo 📨 Sending initial context...
call npx hardhat run sendCtx.js --network sourceChain

echo ✅ MRC system launched successfully.