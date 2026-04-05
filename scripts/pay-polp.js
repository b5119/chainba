const hre = require("hardhat");

async function main() {
  const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();
  const polpAddr = "0xCafac3dD18aC6c6e92c921884f9E4176737C052c";
  
  const Group = await hre.ethers.getContractAt("ChilimbaGroup", polpAddr);
  
  const contributionAmount = await Group.contributionAmount();
  const members = await Group.getMembers();
  const cycle = await Group.currentCycle();
  
  console.log(`Making payments to "polp" group`);
  console.log(`Contribution: ${hre.ethers.formatEther(contributionAmount)} ETH`);
  console.log(`Members: ${members.length}`);
  console.log();
  
  const signers = [owner, addr1, addr2, addr3];
  
  for (const member of members) {
    const signer = signers.find(s => s.address.toLowerCase() === member.toLowerCase());
    if (signer) {
      console.log(`Paying from ${signer.address.slice(0, 10)}...`);
      const groupWithSigner = Group.connect(signer);
      const tx = await groupWithSigner.payContribution({ value: contributionAmount });
      await tx.wait();
      console.log(`  ✓ Paid ${hre.ethers.formatEther(contributionAmount)} ETH\n`);
    }
  }
  
  const newCycle = await Group.currentCycle();
  console.log(`\n✅ All paid! Current cycle: ${newCycle}`);
  
  if (newCycle > cycle) {
    console.log(`🎉 Cycle ${cycle} completed! Payout released.`);
  }
}

main().catch(console.error);
