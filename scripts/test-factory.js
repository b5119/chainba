const hre = require("hardhat");

async function main() {
  const addresses = require("../chainba-frontend/src/contracts/addresses.json");
  console.log("Factory address:", addresses.factory);
  
  const Factory = await hre.ethers.getContractAt("ChilimbaFactory", addresses.factory);
  console.log("Factory contract loaded");
  
  try {
    const groups = await Factory.getAllGroups();
    console.log("Number of groups:", groups.length);
    console.log("Groups:", groups);
  } catch (e) {
    console.error("Error calling getAllGroups:", e.message);
  }
}

main().catch(console.error);
