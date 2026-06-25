const hre = require("hardhat");

async function main() {
  const addresses = require("../chainba-frontend/src/contracts/addresses.json");
  const Reputation = await hre.ethers.getContractAt("MemberReputation", addresses.reputation);
  
  const Factory = await hre.ethers.getContractAt("ChilimbaFactory", addresses.factory);
  const groups = await Factory.getAllGroups();
  const Group = await hre.ethers.getContractAt("ChilimbaGroup", groups[0]);
  
  const members = await Group.getMembers();
  
  console.log("Registering members and setting initial scores...\n");
  
  for (const member of members) {
    // Register member with initial score of 100
    const tx = await Reputation.registerMember(member);
    await tx.wait();
    console.log(`✓ Registered ${member}`);
    
    // Record on-time payment for Cycle 1 (they all paid on time)
    const tx2 = await Reputation.recordOnTimePayment(member);
    await tx2.wait();
    console.log(`  ✓ Recorded on-time payment`);
    
    const score = await Reputation.getScore(member);
    console.log(`  Final score: ${score}\n`);
  }
  
  console.log("✅ All members updated!");
}

main().catch(console.error);
