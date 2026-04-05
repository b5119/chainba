const hre = require("hardhat");

async function main() {
  const [,,addr2] = await hre.ethers.getSigners();
  const addresses = require("../chainba-frontend/src/contracts/addresses.json");
  const Reputation = await hre.ethers.getContractAt("MemberReputation", addresses.reputation);
  
  console.log(`Registering ${addr2.address}...`);
  
  const tx = await Reputation.registerMember(addr2.address);
  await tx.wait();
  console.log("✓ Registered");
  
  const tx2 = await Reputation.recordOnTimePayment(addr2.address);
  await tx2.wait();
  console.log("✓ Recorded on-time payment");
  
  const score = await Reputation.getScore(addr2.address);
  console.log(`Final score: ${score}`);
}

main().catch(console.error);
