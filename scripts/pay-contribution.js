const hre = require("hardhat");

async function main() {
  const [owner, addr1, addr2] = await hre.ethers.getSigners();
  const addresses = require("../chainba-frontend/src/contracts/addresses.json");
  const Factory = await hre.ethers.getContractAt("ChilimbaFactory", addresses.factory);

  const groups = await Factory.getAllGroups();
  const groupAddr = groups[0];
  console.log("Making payment to group:", groupAddr);
  
  const Group = await hre.ethers.getContractAt("ChilimbaGroup", groupAddr);
  
  const contribAmount = await Group.contributionAmount();
  const currentCycle = await Group.currentCycle();
  const members = await Group.getMembers();
  
  console.log(`\nCycle: ${currentCycle}`);
  console.log(`Contribution: ${hre.ethers.formatEther(contribAmount)} ETH`);
  console.log(`Making payment from first member: ${owner.address}`);
  
  // Pay from first member (owner)
  if (members.includes(owner.address)) {
    const groupWithOwner = Group.connect(owner);
    const tx = await groupWithOwner.payContribution({ value: contribAmount });
    await tx.wait();
    console.log("✓ Payment confirmed");
    
    // Check status
    const hasPaid = await Group.hasPaid(owner.address, currentCycle);
    console.log(`Payment status: ${hasPaid}`);
  } else {
    console.log("Owner is not a member of this group");
  }
}

main().catch(console.error);
