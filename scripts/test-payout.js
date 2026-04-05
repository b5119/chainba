const hre = require("hardhat");

async function main() {
  const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();
  const addresses = require("../chainba-frontend/src/contracts/addresses.json");
  const Factory = await hre.ethers.getContractAt("ChilimbaFactory", addresses.factory);

  const groups = await Factory.getAllGroups();
  const groupAddr = groups[0];
  console.log("Testing group:", groupAddr);
  
  const Group = await hre.ethers.getContractAt("ChilimbaGroup", groupAddr);
  
  const contribAmount = await Group.contributionAmount();
  const members = await Group.getMembers();
  const currentCycle = await Group.currentCycle();
  
  console.log(`\nCurrent cycle: ${currentCycle}`);
  console.log(`Members: ${members.length}`);
  console.log(`Contribution amount: ${hre.ethers.formatEther(contribAmount)} ETH`);
  
  // Check who has paid
  console.log("\nPayment status:");
  for (let i = 0; i < members.length; i++) {
    const hasPaid = await Group.hasPaid(members[i], currentCycle);
    console.log(`  ${members[i].slice(0, 10)}... : ${hasPaid ? "PAID" : "PENDING"}`);
  }
  
  // Get beneficiary
  const beneficiary = await Group.getCurrentBeneficiary();
  console.log(`\nCurrent beneficiary: ${beneficiary}`);
  
  // Pay contributions from all members who haven't paid
  console.log("\n--- Paying contributions ---");
  const signers = [owner, addr1, addr2, addr3];
  
  for (let i = 0; i < members.length; i++) {
    const hasPaid = await Group.hasPaid(members[i], currentCycle);
    if (!hasPaid) {
      const signer = signers.find(s => s.address.toLowerCase() === members[i].toLowerCase());
      if (signer) {
        console.log(`\nPaying from ${signer.address.slice(0, 10)}...`);
        const groupWithSigner = Group.connect(signer);
        const tx = await groupWithSigner.payContribution({ value: contribAmount });
        await tx.wait();
        console.log(`  ✓ Paid ${hre.ethers.formatEther(contribAmount)} ETH`);
      }
    }
  }
  
  // Check cycle info after all payments
  console.log("\n--- After all payments ---");
  const newCycle = await Group.currentCycle();
  console.log(`Current cycle: ${newCycle}`);
  
  // Get cycle 1 info
  const cycle1Info = await Group.getCycleInfo(1);
  console.log("\nCycle 1 Info:");
  console.log(`  Beneficiary: ${cycle1Info.beneficiary}`);
  console.log(`  Total Collected: ${hre.ethers.formatEther(cycle1Info.totalCollected)} ETH`);
  console.log(`  Completed: ${cycle1Info.completed}`);
  console.log(`  Deadline: ${new Date(Number(cycle1Info.deadline) * 1000).toISOString()}`);
  
  if (newCycle > 1) {
    console.log("\n✓ Cycle 1 completed! Payout released.");
    console.log(`  Now on cycle ${newCycle}`);
  }
}

main().catch(console.error);
