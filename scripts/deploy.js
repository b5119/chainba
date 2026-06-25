const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Reputation = await hre.ethers.getContractFactory("MemberReputation");
  const reputation = await Reputation.deploy();
  await reputation.waitForDeployment();
  console.log("MemberReputation deployed to:", await reputation.getAddress());

  const Factory = await hre.ethers.getContractFactory("ChilimbaFactory");
  const factory = await Factory.deploy(await reputation.getAddress());
  await factory.waitForDeployment();
  console.log("ChilimbaFactory deployed to:", await factory.getAddress());
  
  // Authorize the factory to call reputation (so it can authorize groups it creates)
  console.log("\n🔑 Authorizing factory to manage reputation...");
  const authTx = await reputation.authorizeCaller(await factory.getAddress());
  await authTx.wait();
  console.log("✓ Factory authorized - it will auto-authorize all groups it creates");

  const addresses = {
    reputation: await reputation.getAddress(),
    factory: await factory.getAddress(),
    network: hre.network.name,
    deployer: deployer.address
  };

  fs.writeFileSync(
    "./chainba-frontend/src/contracts/addresses.json",
    JSON.stringify(addresses, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log(addresses);
  console.log("\n📝 Next steps:");
  console.log("1. Groups created by this factory will automatically be authorized");
  console.log("2. Run scripts/authorize-groups.js if you need to authorize existing groups");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
