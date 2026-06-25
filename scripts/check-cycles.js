const hre = require("hardhat");

async function main() {
  const addresses = require("../chainba-frontend/src/contracts/addresses.json");
  const Factory = await hre.ethers.getContractAt("ChilimbaFactory", addresses.factory);

  const groups = await Factory.getAllGroups();
  const groupAddr = groups[0];
  const Group = await hre.ethers.getContractAt("ChilimbaGroup", groupAddr);
  
  const currentCycle = await Group.currentCycle();
  console.log(`Current cycle: ${currentCycle}`);
  
  for (let i = 1; i <= currentCycle; i++) {
    const cycleInfo = await Group.getCycleInfo(i);
    console.log(`\nCycle ${i}:`);
    console.log(`  Beneficiary: ${cycleInfo.beneficiary}`);
    console.log(`  Total Collected: ${hre.ethers.formatEther(cycleInfo.totalCollected)} ETH`);
    console.log(`  Deadline (timestamp): ${cycleInfo.deadline.toString()}`);
    console.log(`  Deadline (date): ${new Date(Number(cycleInfo.deadline) * 1000).toISOString()}`);
    console.log(`  Completed: ${cycleInfo.completed}`);
  }
}

main().catch(console.error);
