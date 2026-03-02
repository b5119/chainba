// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MemberReputation.sol";

contract ChilimbaGroup {

    enum GroupStatus { OPEN, ACTIVE, COMPLETED }
    enum MemberStatus { PAID, PENDING, LATE, DEFAULTED }

    struct Member {
        address wallet;
        bytes32 identityHash;
        MemberStatus status;
        uint256 stakeDeposited;
        bool exists;
        bool ejected;
    }

    struct Cycle {
        uint256 cycleNumber;
        address beneficiary;
        uint256 totalCollected;
        bool completed;
        uint256 deadline;
    }

    string public groupName;
    string public groupType;
    uint256 public contributionAmount;
    uint256 public stakeAmount;
    uint256 public memberLimit;
    uint256 public gracePeriodDays;
    uint256 public penaltyAmount;
    uint256 public ejectionThreshold;
    address public leader;
    GroupStatus public status;

    mapping(address => Member) public members;
    address[] public memberList;
    address[] public rotationOrder;
    Cycle[] public cycles;
    uint256 public currentCycle;
    mapping(address => uint256) public defaultCount;

    MemberReputation public reputationContract;

    event MemberJoined(address member, bytes32 identityHash);
    event GroupActivated(address[] rotationOrder);
    event ContributionPaid(address member, uint256 amount, uint256 cycle);
    event PayoutReleased(address beneficiary, uint256 amount, uint256 cycle);
    event MemberDefaulted(address member, uint256 cycle);
    event MemberEjected(address member);
    event StakeReturned(address member, uint256 amount);

    modifier onlyLeader() {
        require(msg.sender == leader, "Only leader");
        _;
    }

    modifier onlyMember() {
        require(members[msg.sender].exists, "Not a member");
        require(!members[msg.sender].ejected, "You are ejected");
        _;
    }

    modifier onlyActive() {
        require(status == GroupStatus.ACTIVE, "Group not active");
        _;
    }

    constructor(
        address _leader,
        string memory _groupName,
        string memory _groupType,
        uint256 _contributionAmount,
        uint256 _stakeAmount,
        uint256 _memberLimit,
        uint256 _gracePeriodDays,
        uint256 _penaltyAmount,
        uint256 _ejectionThreshold,
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
        reputationContract = MemberReputation(_reputationContract);
        status = GroupStatus.OPEN;
    }

    function joinGroup(
        string memory _fullName,
        string memory _nationalId,
        string memory _phone
    ) external payable {
        require(status == GroupStatus.OPEN, "Group not open");
        require(!members[msg.sender].exists, "Already a member");
        require(memberList.length < memberLimit, "Group is full");
        require(msg.value == stakeAmount, "Wrong stake amount");

        bytes32 identityHash = keccak256(
            abi.encodePacked(_fullName, _nationalId, _phone)
        );

        members[msg.sender] = Member({
            wallet: msg.sender,
            identityHash: identityHash,
            status: MemberStatus.PENDING,
            stakeDeposited: msg.value,
            exists: true,
            ejected: false
        });

        memberList.push(msg.sender);
        reputationContract.registerMember(msg.sender);
        emit MemberJoined(msg.sender, identityHash);

        if (memberList.length == memberLimit) {
            _activateGroup();
        }
    }

    function _activateGroup() internal {
        status = GroupStatus.ACTIVE;
        rotationOrder = memberList;

        for (uint i = rotationOrder.length - 1; i > 0; i--) {
            uint j = uint(keccak256(
                abi.encodePacked(block.timestamp, i)
            )) % (i + 1);
            address temp = rotationOrder[i];
            rotationOrder[i] = rotationOrder[j];
            rotationOrder[j] = temp;
        }

        currentCycle = 0;
        _startNewCycle();
        emit GroupActivated(rotationOrder);
    }

    function _startNewCycle() internal {
        cycles.push(Cycle({
            cycleNumber: currentCycle,
            beneficiary: rotationOrder[currentCycle],
            totalCollected: 0,
            completed: false,
            deadline: block.timestamp + (gracePeriodDays * 1 days) + 30 days
        }));

        for (uint i = 0; i < memberList.length; i++) {
            if (!members[memberList[i]].ejected) {
                members[memberList[i]].status = MemberStatus.PENDING;
            }
        }
    }

    function payContribution() external payable onlyMember onlyActive {
        Cycle storage cycle = cycles[currentCycle];
        require(!cycle.completed, "Cycle already complete");
        require(
            members[msg.sender].status == MemberStatus.PENDING ||
            members[msg.sender].status == MemberStatus.LATE,
            "Already paid"
        );

        uint256 required = contributionAmount;
        if (block.timestamp > cycle.deadline - (30 days)) {
            required += penaltyAmount;
            members[msg.sender].status = MemberStatus.LATE;
            reputationContract.recordLatePayment(msg.sender);
        } else {
            members[msg.sender].status = MemberStatus.PAID;
            reputationContract.recordOnTimePayment(msg.sender);
        }

        require(msg.value == required, "Wrong amount");
        cycle.totalCollected += msg.value;
        emit ContributionPaid(msg.sender, msg.value, currentCycle);

        if (_allMembersPaid()) {
            _releasePayout();
        }
    }

    function _allMembersPaid() internal view returns (bool) {
        for (uint i = 0; i < memberList.length; i++) {
            address m = memberList[i];
            if (!members[m].ejected) {
                if (
                    members[m].status != MemberStatus.PAID &&
                    members[m].status != MemberStatus.LATE
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    function _releasePayout() internal {
        Cycle storage cycle = cycles[currentCycle];
        cycle.completed = true;
        address beneficiary = cycle.beneficiary;
        uint256 payout = cycle.totalCollected;

        emit PayoutReleased(beneficiary, payout, currentCycle);
        (bool sent, ) = beneficiary.call{value: payout}("");
        require(sent, "Payout failed");

        if (currentCycle + 1 < rotationOrder.length) {
            currentCycle++;
            _startNewCycle();
        } else {
            _closeGroup();
        }
    }

    function flagDefault(address _member) external onlyLeader onlyActive {
        require(members[_member].exists, "Not a member");
        require(members[_member].status == MemberStatus.PENDING, "Not pending");

        Cycle storage cycle = cycles[currentCycle];
        require(block.timestamp > cycle.deadline, "Grace period not over");

        members[_member].status = MemberStatus.DEFAULTED;
        defaultCount[_member]++;
        reputationContract.recordDefault(_member);

        uint256 penalty = members[_member].stakeDeposited >= penaltyAmount
            ? penaltyAmount : members[_member].stakeDeposited;

        members[_member].stakeDeposited -= penalty;
        cycle.totalCollected += penalty;
        emit MemberDefaulted(_member, currentCycle);

        if (defaultCount[_member] >= ejectionThreshold) {
            _ejectMember(_member);
        }

        if (_allMembersPaid()) {
            _releasePayout();
        }
    }

    function _ejectMember(address _member) internal {
        members[_member].ejected = true;
        reputationContract.recordEjection(_member);

        uint256 remaining = members[_member].stakeDeposited;
        if (remaining > 0) {
            members[_member].stakeDeposited = 0;
            uint256 share = remaining / memberList.length;
            for (uint i = 0; i < memberList.length; i++) {
                if (memberList[i] != _member && !members[memberList[i]].ejected) {
                    (bool sent, ) = memberList[i].call{value: share}("");
                    require(sent, "Share failed");
                }
            }
        }
        emit MemberEjected(_member);
    }

    function _closeGroup() internal {
        status = GroupStatus.COMPLETED;
        for (uint i = 0; i < memberList.length; i++) {
            address m = memberList[i];
            uint256 stake = members[m].stakeDeposited;
            if (stake > 0 && !members[m].ejected) {
                members[m].stakeDeposited = 0;
                (bool sent, ) = m.call{value: stake}("");
                require(sent, "Stake return failed");
                emit StakeReturned(m, stake);
            }
        }
    }

    function getMemberCount() external view returns (uint256) {
        return memberList.length;
    }

    function getCurrentBeneficiary() external view returns (address) {
        return rotationOrder[currentCycle];
    }

    function getCycleInfo(uint256 _cycle) external view returns (
        address beneficiary,
        uint256 totalCollected,
        bool completed,
        uint256 deadline
    ) {
        Cycle memory c = cycles[_cycle];
        return (c.beneficiary, c.totalCollected, c.completed, c.deadline);
    }

    receive() external payable {}
}
