const hre = require("hardhat");

async function main() {
  const addresses = require("../chainba-frontend/src/contracts/addresses.json");
  const Reputation = await hre.ethers.getContractAt("MemberReputation", addresses.reputation);
  
  const Factory = await hre.ethers.getContractAt("ChilimbaFactory", addresses.factory);
  const groups = await Factory.getAllGroups();
  
  console.log("Authorizing group contracts to call reputation...\n");
  
  for (const groupAddr of groups) {
    const isAuthorized = await Reputation.authorizedCallers(groupAddr);
    console.log(`Group ${groupAddr}: ${isAuthorized ? "✓ Authorized" : "✗ Not authorized"}`);
    
    if (!isAuthorized) {
      const tx = await Reputation.authorizeCaller(groupAddr);
      await tx.wait();
      console.log(`  ✓ Authorized!`);
    }
  }
}

main().catch(console.error);
