const hre = require("hardhat");

async function main() {
  const addresses = require("../chainba-frontend/src/contracts/addresses.json");
  const Factory = await hre.ethers.getContractAt("ChilimbaFactory", addresses.factory);

  const groups = await Factory.getAllGroups();
  
  console.log("All groups in system:\n");
  for (let i = 0; i < groups.length; i++) {
    const groupAddr = groups[i];
    const Group = await hre.ethers.getContractAt("ChilimbaGroup", groupAddr);
    
    const name = await Group.groupName();
    const status = await Group.status();
    const cycle = await Group.currentCycle();
    const members = await Group.getMembers();
    
    console.log(`${i + 1}. ${name} (${groupAddr})`);
    console.log(`   Status: ${status} (0=Open, 1=Active, 2=Completed)`);
    console.log(`   Cycle: ${cycle}`);
    console.log(`   Members: ${members.length}`);
    
    if (cycle > 0) {
      console.log(`   Payment status for cycle ${cycle}:`);
      for (const member of members) {
        const paid = await Group.hasPaid(member, cycle);
        console.log(`     ${member.slice(0, 10)}... : ${paid ? "✓ PAID" : "✗ PENDING"}`);
      }
    }
    console.log();
  }
}

main().catch(console.error);
