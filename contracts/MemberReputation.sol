// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MemberReputation is Ownable, Pausable {
    struct Member {
        uint256 score;
        uint256 totalCycles;
        uint256 onTimePayments;
        uint256 latePayments;
        uint256 defaults;
        uint256 ejections;
        bool registered;
    }

    mapping(address => Member) private members;
    mapping(address => bool) public authorizedCallers;

    event MemberRegistered(address indexed member);
    event ScoreUpdated(address indexed member, uint256 newScore, string reason);

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() {}

    function authorizeCaller(address caller) external onlyOwner {
        authorizedCallers[caller] = true;
    }

    function registerMember(address member) external onlyAuthorized whenNotPaused {
        if (!members[member].registered) {
            members[member] = Member(100, 0, 0, 0, 0, 0, true);
            emit MemberRegistered(member);
        }
    }

    function recordOnTimePayment(address member) external onlyAuthorized whenNotPaused {
        require(members[member].registered, "Member not registered");
        members[member].onTimePayments++;
        members[member].totalCycles++;
        if (members[member].score + 10 <= 100) members[member].score += 10;
        else members[member].score = 100;
        emit ScoreUpdated(member, members[member].score, "OnTime");
    }

    function recordLatePayment(address member) external onlyAuthorized whenNotPaused {
        require(members[member].registered, "Member not registered");
        members[member].latePayments++;
        members[member].totalCycles++;
        if (members[member].score >= 3) members[member].score -= 3;
        else members[member].score = 0;
        emit ScoreUpdated(member, members[member].score, "Late");
    }

    function recordDefault(address member) external onlyAuthorized whenNotPaused {
        require(members[member].registered, "Member not registered");
        members[member].defaults++;
        if (members[member].score >= 15) members[member].score -= 15;
        else members[member].score = 0;
        emit ScoreUpdated(member, members[member].score, "Default");
    }

    function recordEjection(address member) external onlyAuthorized whenNotPaused {
        require(members[member].registered, "Member not registered");
        members[member].ejections++;
        if (members[member].score >= 50) members[member].score -= 50;
        else members[member].score = 0;
        emit ScoreUpdated(member, members[member].score, "Ejected");
    }

    function getScore(address member) external view returns (uint256) {
        return members[member].score;
    }

    function getMember(address member) external view returns (
        uint256 score, uint256 totalCycles, uint256 onTimePayments,
        uint256 latePayments, uint256 defaults, uint256 ejections, bool registered
    ) {
        Member memory m = members[member];
        return (m.score, m.totalCycles, m.onTimePayments, m.latePayments, m.defaults, m.ejections, m.registered);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}