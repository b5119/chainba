const hre = require("hardhat");

async function main() {
  const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();
  
  const addresses = require("../chainba-frontend/src/contracts/addresses.json");
  const Factory = await hre.ethers.getContractAt("ChilimbaFactory", addresses.factory);

  // Create a demo circle
  const tx = await Factory.createGroup(
    "Demo Circle",
    "savings",
    hre.ethers.parseEther("0.1"),
    hre.ethers.parseEther("0.05"),
    4,
    30,
    hre.ethers.parseEther("0.05"),
    4
  );
  await tx.wait();
  console.log("✅ Demo circle created");

  const groups = await Factory.getAllGroups();
  console.log("Circle address:", groups[0]);
}

main().catch(console.error);
