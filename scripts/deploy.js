const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  AgriChain — Deployment");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Balance  : ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const AgriChain = await ethers.getContractFactory("AgriChain");
  console.log("\n  Deploying AgriChain...");

  const agrichain = await AgriChain.deploy();
  await agrichain.waitForDeployment();

  const address = await agrichain.getAddress();

  console.log(`\n  ✔ AgriChain deployed to: ${address}`);
  console.log(`\n  Verifying on Etherscan (wait 30s for indexing)...`);

  // Auto-verify if not on local network
  if (network.name !== "hardhat" && network.name !== "localhost") {
    await new Promise((r) => setTimeout(r, 30000));
    try {
      await run("verify:verify", {
        address,
        constructorArguments: [],
      });
      console.log("  ✔ Contract verified on Etherscan");
    } catch (e) {
      console.log("  ⚠ Verification failed:", e.message);
    }
  }

  // Write deployed address to frontend config
  const fs = require("fs");
  const config = {
    contractAddress: address,
    network:         network.name,
    deployedAt:      new Date().toISOString(),
    deployer:        deployer.address,
  };

  fs.writeFileSync(
    "./frontend/src/config/deployment.json",
    JSON.stringify(config, null, 2)
  );
  console.log("\n  ✔ Deployment config saved to frontend/src/config/deployment.json");

  // Copy ABI to frontend
  const artifact = require("./artifacts/contracts/AgriChain.sol/AgriChain.json");
  fs.mkdirSync("./frontend/src/config", { recursive: true });
  fs.writeFileSync(
    "./frontend/src/config/AgriChain.abi.json",
    JSON.stringify(artifact.abi, null, 2)
  );
  console.log("  ✔ ABI copied to frontend/src/config/AgriChain.abi.json\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
