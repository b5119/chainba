const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainBa — Full Test Suite", function () {

  let reputation, factory, group;
  let owner, leader, member1, member2, member3;
  const STAKE = ethers.parseEther("0.2");
  const CONTRIBUTION = ethers.parseEther("1.0");

  beforeEach(async function () {
    [owner, leader, member1, member2, member3] = await ethers.getSigners();
    const Reputation = await ethers.getContractFactory("MemberReputation");
    reputation = await Reputation.deploy();
    await reputation.waitForDeployment();
    const Factory = await ethers.getContractFactory("ChilimbaFactory");
    factory = await Factory.deploy(await reputation.getAddress());
    await factory.waitForDeployment();
  });

  async function deployGroup(name, limit) {
    await factory.connect(leader).createGroup(
      name || "Test Group", "Cash", CONTRIBUTION, STAKE, limit || 4, 30, STAKE, 2
    );
    const groups = await factory.getAllGroups();
    return ethers.getContractAt("ChilimbaGroup", groups[groups.length - 1]);
  }

  async function fillGroup(grp, count) {
    const signers = await ethers.getSigners();
    for (let i = 0; i < count; i++) {
      await grp.connect(signers[i]).joinGroup("Member" + i, "NRC" + i, "097000000" + i, { value: STAKE });
    }
  }

  // ─────────────────────────────────
  // REPUTATION
  // ─────────────────────────────────
  describe("MemberReputation", function () {

    it("Should register a member with score 100", async function () {
      await reputation.registerMember(member1.address);
      expect(await reputation.getScore(member1.address)).to.equal(100);
    });

    it("Should keep score at 100 max on on-time payment", async function () {
      await reputation.registerMember(member1.address);
      await reputation.recordOnTimePayment(member1.address);
      expect(Number(await reputation.getScore(member1.address))).to.be.at.most(110);
    });

    it("Should decrease score on late payment", async function () {
      await reputation.registerMember(member1.address);
      await reputation.recordLatePayment(member1.address);
      expect(Number(await reputation.getScore(member1.address))).to.be.below(100);
    });

    it("Should decrease score on default", async function () {
      await reputation.registerMember(member1.address);
      await reputation.recordDefault(member1.address);
      expect(Number(await reputation.getScore(member1.address))).to.be.below(90);
    });

    it("Should not allow score to go below zero", async function () {
      await reputation.registerMember(member1.address);
      for (let i = 0; i < 20; i++) await reputation.recordDefault(member1.address);
      expect(await reputation.getScore(member1.address)).to.equal(0);
    });

  });

  // ─────────────────────────────────
  // FACTORY
  // ─────────────────────────────────
  describe("ChilimbaFactory", function () {

    it("Should create a new group", async function () {
      await deployGroup("Group A", 4);
      expect((await factory.getAllGroups()).length).to.equal(1);
    });

    it("Should track leader groups separately", async function () {
      await deployGroup("Leader Group", 4);
      expect((await factory.getLeaderGroups(leader.address)).length).to.equal(1);
    });

    it("Should increment total groups count", async function () {
      await deployGroup("Group 1", 4);
      await deployGroup("Group 2", 4);
      expect(Number(await factory.getTotalGroups())).to.equal(2);
    });

  });

  // ─────────────────────────────────
  // JOINING
  // ─────────────────────────────────
  describe("ChilimbaGroup — Joining", function () {

    it("Should allow member to join with correct stake", async function () {
      group = await deployGroup("Join Test", 4);
      await group.connect(leader).joinGroup("Frank Bwalya", "123456/78/1", "0974831002", { value: STAKE });
      expect(Number(await group.getMemberCount())).to.equal(1);
    });

    it("Should reject joining with wrong stake", async function () {
      group = await deployGroup("Wrong Stake", 4);
      await expect(
        group.connect(leader).joinGroup("Frank", "123456/78/1", "0974831002", { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Incorrect stake amount");
    });

    it("Should reject duplicate member joining", async function () {
      group = await deployGroup("Dup Test", 4);
      await group.connect(leader).joinGroup("Frank", "123456/78/1", "0974831002", { value: STAKE });
      await expect(
        group.connect(leader).joinGroup("Frank", "123456/78/1", "0974831002", { value: STAKE })
      ).to.be.revertedWith("Already joined");
    });

    it("Should activate group when member limit reached", async function () {
      group = await deployGroup("Activate Test", 4);
      await fillGroup(group, 4);
      expect(Number(await group.status())).to.equal(1);
    });

    it("Should store member data correctly on joining", async function () {
      group = await deployGroup("Store Test", 4);
      await group.connect(leader).joinGroup("Frank Bwalya", "123456/78/1", "0974831002", { value: STAKE });
      expect(Number(await group.getMemberCount())).to.equal(1);
      expect(await group.groupName()).to.equal("Store Test");
    });

  });

  // ─────────────────────────────────
  // CONTRIBUTIONS
  // ─────────────────────────────────
  describe("ChilimbaGroup — Contributions", function () {

    beforeEach(async function () {
      group = await deployGroup("Contrib Test", 4);
      await fillGroup(group, 4);
    });

    it("Should allow active member to pay contribution", async function () {
      await group.connect(owner).payContribution({ value: CONTRIBUTION });
      const cycle = await group.currentCycle();
      expect(await group.hasPaid(owner.address, cycle)).to.equal(true);
    });

    it("Should reject double payment in same cycle", async function () {
      await group.connect(owner).payContribution({ value: CONTRIBUTION });
      await expect(
        group.connect(owner).payContribution({ value: CONTRIBUTION })
      ).to.be.revertedWith("Already paid this cycle");
    });

    it("Should reject wrong contribution amount", async function () {
      await expect(
        group.connect(owner).payContribution({ value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Incorrect contribution amount");
    });

    it("Should release payout when all members pay", async function () {
      const signers = await ethers.getSigners();
      const beneficiary = await group.getCurrentBeneficiary();
      const before = await ethers.provider.getBalance(beneficiary);
      for (let i = 0; i < 4; i++) {
        await group.connect(signers[i]).payContribution({ value: CONTRIBUTION });
      }
      expect(await ethers.provider.getBalance(beneficiary)).to.be.above(before);
    });

    it("Should advance to cycle 2 after cycle 1 completes", async function () {
      const signers = await ethers.getSigners();
      for (let i = 0; i < 4; i++) {
        await group.connect(signers[i]).payContribution({ value: CONTRIBUTION });
      }
      expect(Number(await group.currentCycle())).to.equal(2);
    });

  });

  // ─────────────────────────────────
  // SECURITY
  // ─────────────────────────────────
  describe("ChilimbaGroup — Security", function () {

    beforeEach(async function () {
      group = await deployGroup("Security Test", 4);
      await fillGroup(group, 4);
    });

    it("Should reject stranger trying to pay", async function () {
      const stranger = (await ethers.getSigners())[10];
      await expect(
        group.connect(stranger).payContribution({ value: CONTRIBUTION })
      ).to.be.reverted;
    });

    it("Should reject non-leader flagging default", async function () {
      await expect(
        group.connect(member1).flagDefault(member2.address)
      ).to.be.revertedWith("Only leader");
    });

    it("Should pause and reject contributions when paused", async function () {
      await group.connect(leader).pause();
      await expect(
        group.connect(owner).payContribution({ value: CONTRIBUTION })
      ).to.be.reverted;
    });

    it("Should resume contributions after unpause", async function () {
      await group.connect(leader).pause();
      await group.connect(leader).unpause();
      await group.connect(owner).payContribution({ value: CONTRIBUTION });
      const cycle = await group.currentCycle();
      expect(await group.hasPaid(owner.address, cycle)).to.equal(true);
    });

    it("Should reject joining when group is already active", async function () {
      const stranger = (await ethers.getSigners())[10];
      await expect(
        group.connect(stranger).joinGroup("Extra", "999999/99/9", "0999999999", { value: STAKE })
      ).to.be.reverted;
    });

  });

});