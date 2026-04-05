const hre = require("hardhat");

async function main() {
  const addresses = require("../chainba-frontend/src/contracts/addresses.json");
  const Factory = await hre.ethers.getContractAt("ChilimbaFactory", addresses.factory);

  const groups = await Factory.getAllGroups();
  console.log(`Total groups: ${groups.length}`);

  for (let i = 0; i < groups.length; i++) {
    const groupAddr = groups[i];
    const Group = await hre.ethers.getContractAt("ChilimbaGroup", groupAddr);
    
    const name = await Group.groupName();
    const status = await Group.status();
    const cycle = await Group.currentCycle();
    const memberCount = await Group.getMemberCount();
    
    console.log(`\nGroup ${i + 1}: ${name}`);
    console.log(`  Address: ${groupAddr}`);
    console.log(`  Status: ${status} (0=Open, 1=Active, 2=Completed)`);
    console.log(`  Current Cycle: ${cycle}`);
    console.log(`  Members: ${memberCount}`);
    
    // Check cycle info if active
    if (cycle > 0) {
      for (let c = 1; c <= cycle; c++) {
        try {
          const cycleInfo = await Group.getCycleInfo(c);
          console.log(`  Cycle ${c}:`, {
            beneficiary: cycleInfo.beneficiary.slice(0, 10) + "...",
            collected: hre.ethers.formatEther(cycleInfo.totalCollected),
            completed: cycleInfo.completed
          });
        } catch (e) {
          console.log(`  Cycle ${c}: Error - ${e.message}`);
        }
      }
    }
  }
}

main().catch(console.error);
