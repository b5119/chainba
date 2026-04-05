// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ChilimbaGroup.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ChilimbaFactory is Ownable {
    address[] public allGroups;
    mapping(address => address[]) public leaderGroups;
    address public reputationContract;

    event GroupCreated(address indexed leader, address indexed groupAddress, string groupName);

    constructor(address _reputationContract)  {
        reputationContract = _reputationContract;
    }

    function createGroup(
        string memory groupName, string memory groupType,
        uint256 contributionAmount, uint256 stakeAmount,
        uint256 memberLimit, uint256 gracePeriodDays,
        uint256 penaltyAmount, uint256 ejectionThreshold
    ) external returns (address) {
        require(memberLimit >= 2 && memberLimit <= 20, "Member limit must be 2-20");
        require(contributionAmount > 0, "Contribution must be greater than 0");
        require(stakeAmount > 0, "Stake must be greater than 0");

        ChilimbaGroup group = new ChilimbaGroup(
            msg.sender, groupName, groupType,
            contributionAmount, stakeAmount, memberLimit,
            gracePeriodDays, penaltyAmount, ejectionThreshold,
            reputationContract
        );

        // Auto-authorize the newly created group to call reputation contract
        // The reputation contract must have this factory authorized first
        (bool success, ) = reputationContract.call(
            abi.encodeWithSignature("authorizeCaller(address)", address(group))
        );
        // Silently fail if authorization fails (reputation contract will handle it)
        if (!success) {
            // Authorization failed, group will still be created but reputation won't work
        }

        allGroups.push(address(group));
        leaderGroups[msg.sender].push(address(group));

        emit GroupCreated(msg.sender, address(group), groupName);
        return address(group);
    }

    function getAllGroups() external view returns (address[] memory) { return allGroups; }
    function getLeaderGroups(address leader) external view returns (address[] memory) { return leaderGroups[leader]; }
    function getTotalGroups() external view returns (uint256) { return allGroups.length; }
}