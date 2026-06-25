const hre = require("hardhat");

async function main() {
  const addresses = require("../chainba-frontend/src/contracts/addresses.json");
  const Reputation = await hre.ethers.getContractAt("MemberReputation", addresses.reputation);
  
  const Factory = await hre.ethers.getContractAt("ChilimbaFactory", addresses.factory);
  const groups = await Factory.getAllGroups();
  const Group = await hre.ethers.getContractAt("ChilimbaGroup", groups[0]);
  
  const members = await Group.getMembers();
  
  console.log("Reputation Scores:\n");
  for (const member of members) {
    const score = await Reputation.getScore(member);
    const memberData = await Reputation.getMember(member);
    console.log(`${member}:`);
    console.log(`  Score: ${memberData[0]}`);
    console.log(`  Total cycles: ${memberData[1]}`);
    console.log(`  On-time payments: ${memberData[2]}`);
    console.log(`  Late payments: ${memberData[3]}`);
    console.log(`  Defaults: ${memberData[4]}`);
    console.log(`  Ejections: ${memberData[5]}`);
    console.log();
  }
}

main().catch(console.error);
