const hre = require("hardhat");

async function main() {
  const [owner, addr1, addr2] = await hre.ethers.getSigners();
  const groupAddr = "0x9f1ac54BEF0DD2f6f3462EA0fa94fC62300d3a8e";
  
  const Group = await hre.ethers.getContractAt("ChilimbaGroup", groupAddr);
  
  const contributionAmount = await Group.contributionAmount();
  const cycle = await Group.currentCycle();
  const members = await Group.getMembers();
  
  console.log(`Making payments to "2022" group`);
  console.log(`Contribution: ${hre.ethers.formatEther(contributionAmount)} ETH`);
  console.log(`Cycle: ${cycle}`);
  console.log(`Members: ${members.length}\n`);
  
  const signers = [owner, addr1, addr2];
  
  for (const member of members) {
    const signer = signers.find(s => s.address.toLowerCase() === member.toLowerCase());
    if (signer) {
      const hasPaid = await Group.hasPaid(member, cycle);
      if (!hasPaid) {
        console.log(`Paying from ${signer.address.slice(0, 10)}...`);
        const groupWithSigner = Group.connect(signer);
        const tx = await groupWithSigner.payContribution({ value: contributionAmount });
        await tx.wait();
        console.log(`  ✓ Paid\n`);
      } else {
        console.log(`${signer.address.slice(0, 10)}... already paid`);
      }
    }
  }
  
  const newCycle = await Group.currentCycle();
  console.log(`\n✅ All paid! Current cycle: ${newCycle}`);
}

main().catch(console.error);
