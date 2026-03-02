// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ChilimbaGroup.sol";
import "./MemberReputation.sol";

contract ChilimbaFactory {

    address[] public allGroups;
    address public reputationContract;
    mapping(address => address[]) public leaderGroups;

    event GroupCreated(address groupAddress, address leader, string groupName);

    constructor(address _reputationContract) {
        reputationContract = _reputationContract;
    }

    function createGroup(
        string memory _groupName,
        string memory _groupType,
        uint256 _contributionAmount,
        uint256 _stakeAmount,
        uint256 _memberLimit,
        uint256 _gracePeriodDays,
        uint256 _penaltyAmount,
        uint256 _ejectionThreshold
    ) external returns (address) {

        ChilimbaGroup newGroup = new ChilimbaGroup(
            msg.sender,
            _groupName,
            _groupType,
            _contributionAmount,
            _stakeAmount,
            _memberLimit,
            _gracePeriodDays,
            _penaltyAmount,
            _ejectionThreshold,
            reputationContract
        );

        allGroups.push(address(newGroup));
        leaderGroups[msg.sender].push(address(newGroup));
        emit GroupCreated(address(newGroup), msg.sender, _groupName);
        return address(newGroup);
    }

    function getAllGroups() external view returns (address[] memory) {
        return allGroups;
    }

    function getLeaderGroups(address _leader) external view returns (address[] memory) {
        return leaderGroups[_leader];
    }

    function getTotalGroups() external view returns (uint256) {
        return allGroups.length;
    }
}
