import { ethers } from "ethers";
import addresses from "./addresses.json";

export const FACTORY_ADDRESS = addresses.factory;
export const REPUTATION_ADDRESS = addresses.reputation;

export const FACTORY_ABI = [
  "function createGroup(string,string,uint256,uint256,uint256,uint256,uint256,uint256) returns (address)",
  "function getAllGroups() view returns (address[])",
  "function getLeaderGroups(address) view returns (address[])",
  "function getTotalGroups() view returns (uint256)",
  "event GroupCreated(address,address,string)"
];

export const GROUP_ABI = [
  "function groupName() view returns (string)",
  "function groupType() view returns (string)",
  "function contributionAmount() view returns (uint256)",
  "function stakeAmount() view returns (uint256)",
  "function memberLimit() view returns (uint256)",
  "function leader() view returns (address)",
  "function status() view returns (uint8)",
  "function currentCycle() view returns (uint256)",
  "function getMemberCount() view returns (uint256)",
  "function getCurrentBeneficiary() view returns (address)",
  "function getCycleInfo(uint256) view returns (address,uint256,bool,uint256)",
  "function members(address) view returns (address,bytes32,uint8,uint256,bool,bool)",
  "function joinGroup(string,string,string) payable",
  "function payContribution() payable",
  "function flagDefault(address)",
  "event MemberJoined(address,bytes32)",
  "event ContributionPaid(address,uint256,uint256)",
  "event PayoutReleased(address,uint256,uint256)"
];

export const REPUTATION_ABI = [
  "function getMember(address) view returns (uint256,uint256,uint256,uint256,uint256,uint256)",
  "function getScore(address) view returns (uint256)"
];

export async function getProvider() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  await window.ethereum.request({ method: "eth_requestAccounts" });
  return new ethers.providers.Web3Provider(window.ethereum);
}

export async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}
