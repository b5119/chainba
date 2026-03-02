// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MemberReputation {

    struct Member {
        uint256 score;
        uint256 totalCycles;
        uint256 onTimePayments;
        uint256 latePayments;
        uint256 defaults;
        uint256 ejections;
        bool exists;
    }

    mapping(address => Member) public members;

    event ScoreUpdated(address member, uint256 newScore);
    event MemberRegistered(address member);

    function registerMember(address _member) external {
        if (!members[_member].exists) {
            members[_member] = Member(100, 0, 0, 0, 0, 0, true);
            emit MemberRegistered(_member);
        }
    }

    function recordOnTimePayment(address _member) external {
        require(members[_member].exists, "Member not found");
        members[_member].onTimePayments++;
        members[_member].totalCycles++;
        if (members[_member].score < 100) {
            members[_member].score += 10;
            if (members[_member].score > 100) {
                members[_member].score = 100;
            }
        }
        emit ScoreUpdated(_member, members[_member].score);
    }

    function recordLatePayment(address _member) external {
        require(members[_member].exists, "Member not found");
        members[_member].latePayments++;
        members[_member].totalCycles++;
        if (members[_member].score >= 3) {
            members[_member].score -= 3;
        }
        emit ScoreUpdated(_member, members[_member].score);
    }

    function recordDefault(address _member) external {
        require(members[_member].exists, "Member not found");
        members[_member].defaults++;
        members[_member].totalCycles++;
        if (members[_member].score >= 15) {
            members[_member].score -= 15;
        } else {
            members[_member].score = 0;
        }
        emit ScoreUpdated(_member, members[_member].score);
    }

    function recordEjection(address _member) external {
        require(members[_member].exists, "Member not found");
        members[_member].ejections++;
        if (members[_member].score >= 50) {
            members[_member].score -= 50;
        } else {
            members[_member].score = 0;
        }
        emit ScoreUpdated(_member, members[_member].score);
    }

    function getScore(address _member) external view returns (uint256) {
        return members[_member].score;
    }

    function getMember(address _member) external view returns (
        uint256 score,
        uint256 totalCycles,
        uint256 onTimePayments,
        uint256 latePayments,
        uint256 defaults,
        uint256 ejections
    ) {
        Member memory m = members[_member];
        return (
            m.score,
            m.totalCycles,
            m.onTimePayments,
            m.latePayments,
            m.defaults,
            m.ejections
        );
    }
}
