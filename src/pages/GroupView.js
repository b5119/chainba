import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { GROUP_ABI } from "../contracts/config";
import { toast } from "react-toastify";

export default function GroupView({ account, groupAddress, onNavigate }) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinForm, setJoinForm] = useState({ name: "", nationalId: "", phone: "" });

  useEffect(() => { if (groupAddress) loadGroup(); }, [groupAddress]);

  const loadGroup = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const g = new ethers.Contract(groupAddress, GROUP_ABI, signer);

      const [name, type, contribution, stake, limit, leader, status,
        memberCount, currentCycle] = await Promise.all([
        g.groupName(), g.groupType(), g.contributionAmount(),
        g.stakeAmount(), g.memberLimit(), g.leader(),
        g.status(), g.getMemberCount(), g.currentCycle()
      ]);

      const memberInfo = await g.members(account);
      const isMember = memberInfo[4];
      const isEjected = memberInfo[5];
      const memberStatus = ["Paid", "Pending", "Late", "Defaulted"][memberInfo[2]];

      let beneficiary = null;
      let cycleInfo = null;
      if (status === 1) {
        beneficiary = await g.getCurrentBeneficiary();
        const ci = await g.getCycleInfo(currentCycle);
        cycleInfo = {
          beneficiary: ci[0],
          totalCollected: ethers.utils.formatEther(ci[1]),
          completed: ci[2],
          deadline: new Date(ci[3].toNumber() * 1000).toLocaleDateString()
        };
      }

      setGroup({
        name, type,
        contribution: ethers.utils.formatEther(contribution),
        stake: ethers.utils.formatEther(stake),
        limit: limit.toNumber(),
        memberCount: memberCount.toNumber(),
        leader,
        status: ["Open", "Active", "Completed"][status],
        currentCycle: currentCycle.toNumber(),
        isMember, isEjected, memberStatus,
        isLeader: leader.toLowerCase() === account.toLowerCase(),
        beneficiary, cycleInfo,
        contributionWei: contribution,
        stakeWei: stake
      });
    } catch (e) {
      toast.error("Error loading group");
    }
    setLoading(false);
  };

  const joinGroup = async () => {
    setJoining(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const g = new ethers.Contract(groupAddress, GROUP_ABI, signer);
      const tx = await g.joinGroup(joinForm.name, joinForm.nationalId, joinForm.phone,
        { value: group.stakeWei });
      toast.info("Joining group...");
      await tx.wait();
      toast.success("Successfully joined!");
      loadGroup();
    } catch (e) {
      toast.error("Error joining: " + e.message);
    }
    setJoining(false);
  };

  const payContribution = async () => {
    setPaying(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const g = new ethers.Contract(groupAddress, GROUP_ABI, signer);
      const tx = await g.payContribution({ value: group.contributionWei });
      toast.info("Processing payment...");
      await tx.wait();
      toast.success("Contribution paid!");
      loadGroup();
    } catch (e) {
      toast.error("Error: " + e.message);
    }
    setPaying(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a",
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#f59e0b", fontSize: "20px" }}>Loading group...</p>
    </div>
  );

  const statusColor = { Open: "#f59e0b", Active: "#4ade80", Completed: "#64748b" };
  const memberStatusColor = { Paid: "#4ade80", Pending: "#f59e0b", Late: "#fb923c", Defaulted: "#ef4444" };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}>
      <div style={{ backgroundColor: "#1e3a6e", padding: "16px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "3px solid #f59e0b" }}>
        <h1 style={{ color: "#fff" }}>🪙 ChainBa</h1>
        <button onClick={() => onNavigate("dashboard")}
          style={{ backgroundColor: "transparent", color: "#94a3b8",
            border: "1px solid #334155", padding: "10px 20px", borderRadius: "8px" }}>
          ← Dashboard
        </button>
      </div>

      <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>

        {/* GROUP HEADER */}
        <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
          padding: "24px", border: "1px solid #334155", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ color: "#fff", fontSize: "24px" }}>📦 {group.name}</h2>
              <p style={{ color: "#64748b" }}>Type: {group.type}</p>
              <p style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>
                {groupAddress.slice(0, 10)}...{groupAddress.slice(-8)}
              </p>
            </div>
            <span style={{ backgroundColor: statusColor[group.status] + "22",
              color: statusColor[group.status], padding: "6px 16px",
              borderRadius: "20px", fontWeight: "bold" }}>
              {group.status}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)",
            gap: "16px", marginTop: "20px" }}>
            {[
              { label: "Contribution", value: `${group.contribution} ETH` },
              { label: "Stake", value: `${group.stake} ETH` },
              { label: "Members", value: `${group.memberCount}/${group.limit}` }
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: "#0f172a", borderRadius: "8px",
                padding: "12px", textAlign: "center" }}>
                <p style={{ color: "#f59e0b", fontSize: "18px", fontWeight: "bold" }}>{s.value}</p>
                <p style={{ color: "#64748b", fontSize: "12px" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CYCLE INFO */}
        {group.status === "Active" && group.cycleInfo && (
          <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
            padding: "24px", border: "1px solid #334155", marginBottom: "20px" }}>
            <h3 style={{ color: "#f59e0b", marginBottom: "16px" }}>
              Cycle {group.currentCycle + 1} — Active
            </h3>
            <p style={{ color: "#94a3b8" }}>
              Beneficiary: <span style={{ color: "#fff" }}>
                {group.cycleInfo.beneficiary.slice(0, 8)}...
                {group.cycleInfo.beneficiary.slice(-6)}
                {group.cycleInfo.beneficiary.toLowerCase() === account.toLowerCase() && 
                  " 🎉 (You!)"}
              </span>
            </p>
            <p style={{ color: "#94a3b8", marginTop: "8px" }}>
              Collected: <span style={{ color: "#4ade80", fontWeight: "bold" }}>
                {group.cycleInfo.totalCollected} ETH
              </span>
            </p>
            <p style={{ color: "#94a3b8", marginTop: "8px" }}>
              Deadline: <span style={{ color: "#fff" }}>{group.cycleInfo.deadline}</span>
            </p>

            {group.isMember && !group.isEjected && (
              <div style={{ marginTop: "16px", padding: "16px",
                backgroundColor: "#0f172a", borderRadius: "8px" }}>
                <p style={{ color: "#94a3b8", marginBottom: "8px" }}>
                  Your Status: <span style={{
                    color: memberStatusColor[group.memberStatus],
                    fontWeight: "bold" }}>
                    {group.memberStatus}
                  </span>
                </p>
                {(group.memberStatus === "Pending" || group.memberStatus === "Late") && (
                  <button onClick={payContribution} disabled={paying}
                    style={{ width: "100%", padding: "14px",
                      backgroundColor: paying ? "#64748b" : "#4ade80",
                      border: "none", borderRadius: "8px", color: "#0f172a",
                      fontSize: "16px", fontWeight: "bold", marginTop: "8px" }}>
                    {paying ? "Processing..." : `💸 Pay ${group.contribution} ETH`}
                  </button>
                )}
                {group.memberStatus === "Paid" && (
                  <p style={{ color: "#4ade80", textAlign: "center", fontWeight: "bold" }}>
                    ✅ You have paid this cycle!
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* JOIN GROUP */}
        {group.status === "Open" && !group.isMember && (
          <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
            padding: "24px", border: "1px solid #f59e0b", marginBottom: "20px" }}>
            <h3 style={{ color: "#f59e0b", marginBottom: "16px" }}>Join This Group</h3>
            <p style={{ color: "#64748b", marginBottom: "16px" }}>
              Stake required: <strong style={{ color: "#fff" }}>{group.stake} ETH</strong>
            </p>

            {[["Full Name", "name", "Your full name"],
              ["National ID", "nationalId", "Your NRC number"],
              ["Phone Number", "phone", "Your phone number"]
            ].map(([label, key, placeholder]) => (
              <div key={key} style={{ marginBottom: "12px" }}>
                <label style={{ color: "#94a3b8", fontSize: "14px" }}>{label}</label>
                <input
                  style={{ width: "100%", padding: "10px", marginTop: "4px",
                    backgroundColor: "#0f172a", border: "1px solid #334155",
                    borderRadius: "6px", color: "#fff" }}
                  placeholder={placeholder}
                  value={joinForm[key]}
                  onChange={e => setJoinForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}

            <button onClick={joinGroup} disabled={joining}
              style={{ width: "100%", padding: "14px", marginTop: "8px",
                backgroundColor: joining ? "#64748b" : "#f59e0b",
                border: "none", borderRadius: "8px", color: "#0f172a",
                fontSize: "16px", fontWeight: "bold" }}>
              {joining ? "Joining..." : `🤝 Join & Pay ${group.stake} ETH Stake`}
            </button>
            <p style={{ color: "#64748b", fontSize: "12px", marginTop: "8px", textAlign: "center" }}>
              Your identity will be hashed and stored securely on blockchain
            </p>
          </div>
        )}

        {/* GROUP ADDRESS TO SHARE */}
        <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
          padding: "20px", border: "1px solid #334155" }}>
          <h3 style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "8px" }}>
            Share This Group Address With Members
          </h3>
          <p style={{ color: "#f59e0b", fontSize: "13px", wordBreak: "break-all",
            backgroundColor: "#0f172a", padding: "10px", borderRadius: "6px" }}>
            {groupAddress}
          </p>
          <button onClick={() => { navigator.clipboard.writeText(groupAddress);
            toast.success("Address copied!"); }}
            style={{ marginTop: "8px", padding: "8px 16px", backgroundColor: "transparent",
              border: "1px solid #334155", borderRadius: "6px", color: "#94a3b8",
              fontSize: "13px" }}>
            📋 Copy Address
          </button>
        </div>
      </div>
    </div>
  );
}
