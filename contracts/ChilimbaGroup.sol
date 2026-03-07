// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IReputation {
    function registerMember(address) external;
    function recordOnTimePayment(address) external;
    function recordLatePayment(address) external;
    function recordDefault(address) external;
    function recordEjection(address) external;
    function getScore(address) external view returns (uint256);
}

contract ChilimbaGroup is ReentrancyGuard, Pausable {
    enum Status { Open, Active, Completed, Cancelled }

    struct Member {
        string fullName;
        bytes32 identityHash;
        bool joined;
        bool ejected;
        bool stakeReturned;
        uint256 joinedAt;
    }

    struct Cycle {
        address beneficiary;
        uint256 totalCollected;
        uint256 deadline;
        bool completed;
        mapping(address => bool) paid;
    }

    address public leader;
    string public groupName;
    string public groupType;
    uint256 public contributionAmount;
    uint256 public stakeAmount;
    uint256 public memberLimit;
    uint256 public gracePeriodDays;
    uint256 public penaltyAmount;
    uint256 public ejectionThreshold;
    Status public status;
    IReputation public reputationContract;

    address[] public memberList;
    mapping(address => Member) public members;
    mapping(uint256 => Cycle) public cycles;
    uint256 public currentCycle;
    address[] public rotationOrder;

    event MemberJoined(address indexed member, string fullName);
    event ContributionPaid(address indexed member, uint256 cycle, bool onTime);
    event PayoutReleased(address indexed beneficiary, uint256 amount, uint256 cycle);
    event MemberDefaulted(address indexed member, uint256 cycle);
    event MemberEjected(address indexed member);
    event GroupActivated();
    event GroupCompleted();

    modifier onlyLeader() { require(msg.sender == leader, "Only leader"); _; }
    modifier onlyMember() { require(members[msg.sender].joined && !members[msg.sender].ejected, "Not active member"); _; }
    modifier onlyActive() { require(status == Status.Active, "Group not active"); _; }
    modifier onlyOpen() { require(status == Status.Open, "Group not open"); _; }

    constructor(
        address _leader, string memory _groupName, string memory _groupType,
        uint256 _contributionAmount, uint256 _stakeAmount, uint256 _memberLimit,
        uint256 _gracePeriodDays, uint256 _penaltyAmount, uint256 _ejectionThreshold,
        address _reputationContract
    ) {
        leader = _leader;
        groupName = _groupName;
        groupType = _groupType;
        contributionAmount = _contributionAmount;
        stakeAmount = _stakeAmount;
        memberLimit = _memberLimit;
        gracePeriodDays = _gracePeriodDays;
        penaltyAmount = _penaltyAmount;
        ejectionThreshold = _ejectionThreshold;
        reputationContract = IReputation(_reputationContract);
        status = Status.Open;
    }

    function joinGroup(string memory fullName, string memory nationalId, string memory phone)
        external payable onlyOpen whenNotPaused nonReentrant {
        require(!members[msg.sender].joined, "Already joined");
        require(memberList.length < memberLimit, "Group is full");
        require(msg.value == stakeAmount, "Incorrect stake amount");

        bytes32 idHash = keccak256(abi.encodePacked(fullName, nationalId, phone));
        members[msg.sender] = Member(fullName, idHash, true, false, false, block.timestamp);
        memberList.push(msg.sender);

        try reputationContract.registerMember(msg.sender) {} catch {}

        emit MemberJoined(msg.sender, fullName);

        if (memberList.length == memberLimit) {
            _activateGroup();
        }
    }

    function _activateGroup() internal {
        status = Status.Active;
        rotationOrder = memberList;

        // Shuffle rotation using block data
        for (uint256 i = rotationOrder.length - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, i))) % (i + 1);
            address temp = rotationOrder[i];
            rotationOrder[i] = rotationOrder[j];
            rotationOrder[j] = temp;
        }

        currentCycle = 1;
        _startCycle(currentCycle);
        emit GroupActivated();
    }

    function _startCycle(uint256 cycleNum) internal {
        Cycle storage c = cycles[cycleNum];
        c.beneficiary = rotationOrder[cycleNum - 1];
        c.deadline = block.timestamp + (gracePeriodDays * 1 days) + 30 days;
        c.totalCollected = 0;
        c.completed = false;
    }

    function payContribution() external payable onlyMember onlyActive whenNotPaused nonReentrant {
        Cycle storage c = cycles[currentCycle];
        require(!c.paid[msg.sender], "Already paid this cycle");
        require(msg.value == contributionAmount, "Incorrect contribution amount");

        c.paid[msg.sender] = true;

        bool isLate = block.timestamp > c.deadline - (30 days);
        if (isLate) {
            try reputationContract.recordLatePayment(msg.sender) {} catch {}
            emit ContributionPaid(msg.sender, currentCycle, false);
        } else {
            try reputationContract.recordOnTimePayment(msg.sender) {} catch {}
            emit ContributionPaid(msg.sender, currentCycle, true);
        }

        c.totalCollected += msg.value;

        // Check if all active members paid
        bool allPaid = true;
        for (uint256 i = 0; i < memberList.length; i++) {
            if (!members[memberList[i]].ejected && !c.paid[memberList[i]]) {
                allPaid = false;
                break;
            }
        }

        if (allPaid) _releasePayout();
    }

    function _releasePayout() internal {
        Cycle storage c = cycles[currentCycle];
        c.completed = true;
        address beneficiary = c.beneficiary;
        uint256 amount = c.totalCollected;

        // Update state BEFORE transfer (reentrancy protection)
        c.totalCollected = 0;

        emit PayoutReleased(beneficiary, amount, currentCycle);

        if (currentCycle == memberLimit) {
            status = Status.Completed;
            _returnStakes();
            emit GroupCompleted();
        } else {
            currentCycle++;
            _startCycle(currentCycle);
        }

        // Transfer AFTER state update
        (bool success, ) = payable(beneficiary).call{value: amount}("");
        require(success, "Payout transfer failed");
    }

    function _returnStakes() internal {
        for (uint256 i = 0; i < memberList.length; i++) {
            address member = memberList[i];
            if (!members[member].ejected && !members[member].stakeReturned) {
                members[member].stakeReturned = true;
                (bool success, ) = payable(member).call{value: stakeAmount}("");
                if (!success) members[member].stakeReturned = false;
            }
        }
    }

    function flagDefault(address member) external onlyLeader onlyActive whenNotPaused {
        Cycle storage c = cycles[currentCycle];
        require(!c.paid[member], "Member already paid");
        require(block.timestamp > c.deadline, "Deadline not passed");
        require(members[member].joined && !members[member].ejected, "Not active member");

        try reputationContract.recordDefault(member) {} catch {}
        emit MemberDefaulted(member, currentCycle);

        uint256 score = reputationContract.getScore(member);
        if (score <= ejectionThreshold) {
            members[member].ejected = true;
            try reputationContract.recordEjection(member) {} catch {}
            emit MemberEjected(member);
        }
    }

    function hasPaid(address member, uint256 cycleNum) external view returns (bool) {
        return cycles[cycleNum].paid[member];
    }

    function getCycleInfo(uint256 cycleNum) external view returns (
        address beneficiary, uint256 totalCollected, uint256 deadline, bool completed
    ) {
        Cycle storage c = cycles[cycleNum];
        return (c.beneficiary, c.totalCollected, c.deadline, c.completed);
    }

    function getMembers() external view returns (address[] memory) { return memberList; }
    function getMemberCount() external view returns (uint256) { return memberList.length; }
    function getCurrentBeneficiary() external view returns (address) { return cycles[currentCycle].beneficiary; }

    function pause() external onlyLeader { _pause(); }
    function unpause() external onlyLeader { _unpause(); }
}