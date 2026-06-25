const hre = require("hardhat");

async function main() {
  const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();
  const groupAddr = "0x9f1ac54BEF0DD2f6f3462EA0fa94fC62300d3a8e";
  
  const Group = await hre.ethers.getContractAt("ChilimbaGroup", groupAddr);
  
  const stakeAmount = await Group.stakeAmount();
  const members = await Group.getMembers();
  
  console.log(`"2022" group needs ${3 - members.length} more member(s)`);
  console.log(`Stake: ${hre.ethers.formatEther(stakeAmount)} ETH\n`);
  
  // Add addr2 as 3rd member
  if (members.length < 3) {
    console.log(`Adding ${addr2.address.slice(0, 10)}... as member`);
    const groupWithAddr2 = Group.connect(addr2);
    const tx = await groupWithAddr2.joinGroup(
      "Member Three",
      "ID003",
      "0971234567",
      { value: stakeAmount }
    );
    await tx.wait();
    console.log(`✓ Joined!\n`);
  }
  
  const status = await Group.status();
  console.log(`Group status: ${status} (0=Open, 1=Active)`);
  
  if (status === 1) {
    console.log(`\n✅ Group is now ACTIVE! Making first payments...`);
    
    const contributionAmount = await Group.contributionAmount();
    const cycle = await Group.currentCycle();
    const allMembers = await Group.getMembers();
    
    console.log(`Contribution: ${hre.ethers.formatEther(contributionAmount)} ETH`);
    console.log(`Cycle: ${cycle}\n`);
    
    const signers = [owner, addr1, addr2, addr3];
    
    for (const member of allMembers) {
      const signer = signers.find(s => s.address.toLowerCase() === member.toLowerCase());
      if (signer) {
        console.log(`Paying from ${signer.address.slice(0, 10)}...`);
        const groupWithSigner = Group.connect(signer);
        const tx = await groupWithSigner.payContribution({ value: contributionAmount });
        await tx.wait();
        console.log(`  ✓ Paid\n`);
      }
    }
    
    const newCycle = await Group.currentCycle();
    console.log(`\n✅ All paid! Current cycle: ${newCycle}`);
  }
}

main().catch(console.error);
