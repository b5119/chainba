const hre = require("hardhat");

async function main() {
  const addresses = require("../chainba-frontend/src/contracts/addresses.json");
  const Factory = await hre.ethers.getContractAt("ChilimbaFactory", addresses.factory);
  const [owner] = await hre.ethers.getSigners();

  const groups = await Factory.getAllGroups();
  const groupAddr = groups[0];
  const Group = await hre.ethers.getContractAt("ChilimbaGroup", groupAddr);
  
  console.log("Verifying Cycle 1 payout...\n");
  
  // Get Cycle 1 info
  const cycleInfo = await Group.getCycleInfo(1);
  const beneficiary = cycleInfo.beneficiary;
  const completed = cycleInfo.completed;
  
  console.log(`Beneficiary: ${beneficiary}`);
  console.log(`Cycle completed: ${completed}`);
  console.log(`Owner address: ${owner.address}`);
  console.log(`Beneficiary matches owner: ${beneficiary.toLowerCase() === owner.address.toLowerCase()}`);
  
  // Get contribution details
  const contributionAmount = await Group.contributionAmount();
  const memberCount = await Group.getMemberCount();
  const expectedPayout = contributionAmount * memberCount;
  
  console.log(`\nExpected payout: ${hre.ethers.formatEther(expectedPayout)} ETH`);
  console.log(`  (${hre.ethers.formatEther(contributionAmount)} ETH × ${memberCount} members)`);
  
  // Check beneficiary balance (can't verify exact amount without tracking balance before/after)
  const provider = hre.ethers.provider;
  const beneficiaryBalance = await provider.getBalance(beneficiary);
  console.log(`\nBeneficiary current balance: ${hre.ethers.formatEther(beneficiaryBalance)} ETH`);
  
  // Check contract events
  console.log("\nChecking PayoutReleased events...");
  const filter = Group.filters.PayoutReleased();
  const events = await Group.queryFilter(filter);
  
  if (events.length > 0) {
    console.log(`\nFound ${events.length} payout event(s):`);
    for (const event of events) {
      console.log(`  Cycle ${event.args.cycle}: ${hre.ethers.formatEther(event.args.amount)} ETH → ${event.args.beneficiary}`);
      console.log(`  Block: ${event.blockNumber}`);
    }
  } else {
    console.log("No PayoutReleased events found");
  }
}

main().catch(console.error);
