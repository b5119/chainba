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

  console.log("✅ Addresses saved!");
  console.log(addresses);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
