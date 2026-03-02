import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { FACTORY_ADDRESS, FACTORY_ABI, GROUP_ABI, REPUTATION_ABI, REPUTATION_ADDRESS } from "../contracts/config";
import { toast } from "react-toastify";

export default function Dashboard({ account, onNavigate }) {
  const [groups, setGroups] = useState([]);
  const [reputation, setReputation] = useState(null);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account) loadData();
  }, [account]);

  const loadData = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const bal = await provider.getBalance(account);
      setBalance(parseFloat(ethers.utils.formatEther(bal)).toFixed(2));

      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const myGroups = await factory.getLeaderGroups(account);
      const allGroups = await factory.getAllGroups();

      const combined = [...new Set([...myGroups, ...allGroups])];
      const groupData = [];

      for (let addr of combined) {
        try {
          const g = new ethers.Contract(addr, GROUP_ABI, signer);
          const [name, type, contribution, stake, limit, leader, status, memberCount] =
            await Promise.all([
              g.groupName(), g.groupType(), g.contributionAmount(),
              g.stakeAmount(), g.memberLimit(), g.leader(),
              g.status(), g.getMemberCount()
            ]);

          const memberInfo = await g.members(account);
          const isMember = memberInfo[4];

          if (isMember || leader.toLowerCase() === account.toLowerCase()) {
            groupData.push({
              address: addr,
              name, type,
              contribution: ethers.utils.formatEther(contribution),
              stake: ethers.utils.formatEther(stake),
              limit: limit.toString(),
              memberCount: memberCount.toString(),
              status: ["Open", "Active", "Completed"][status],
              isLeader: leader.toLowerCase() === account.toLowerCase()
            });
          }
        } catch (e) {}
      }

      setGroups(groupData);

      const rep = new ethers.Contract(REPUTATION_ADDRESS, REPUTATION_ABI, signer);
      const repData = await rep.getMember(account);
      setReputation({
        score: repData[0].toString(),
        totalCycles: repData[1].toString(),
        onTime: repData[2].toString(),
        late: repData[3].toString(),
        defaults: repData[4].toString(),
        ejections: repData[5].toString()
      });

    } catch (e) {
      toast.error("Error loading data");
    }
    setLoading(false);
  };

  const statusColor = (s) => s === "Active" ? "#4ade80" : s === "Open" ? "#f59e0b" : "#64748b";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}>

      {/* HEADER */}
      <div style={{ backgroundColor: "#1e3a6e", padding: "16px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "3px solid #f59e0b" }}>
        <h1 style={{ color: "#fff" }}>🪙 ChainBa</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => onNavigate("create")}
            style={{ backgroundColor: "#f59e0b", color: "#0f172a",
              border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold" }}>
            + Create Group
          </button>
          <button onClick={() => onNavigate("landing")}
            style={{ backgroundColor: "transparent", color: "#94a3b8",
              border: "1px solid #334155", padding: "10px 20px", borderRadius: "8px" }}>
            Disconnect
          </button>
        </div>
      </div>

      <div style={{ padding: "40px" }}>

        {/* WALLET CARD */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "30px" }}>
          <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
            padding: "24px", border: "1px solid #334155" }}>
            <p style={{ color: "#64748b", fontSize: "14px" }}>Connected Wallet</p>
            <p style={{ color: "#fff", fontSize: "16px", margin: "8px 0" }}>
              {account?.slice(0, 10)}...{account?.slice(-8)}
            </p>
            <p style={{ color: "#f59e0b", fontSize: "28px", fontWeight: "bold" }}>
              {balance} ETH
            </p>
            <p style={{ color: "#64748b", fontSize: "12px" }}>Hardhat Local Network</p>
          </div>

          {reputation && (
            <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
              padding: "24px", border: "1px solid #334155", textAlign: "center" }}>
              <p style={{ color: "#64748b", fontSize: "14px" }}>Reputation Score</p>
              <p style={{ color: "#f59e0b", fontSize: "48px", fontWeight: "bold" }}>
                {reputation.score}
              </p>
              <p style={{ color: "#94a3b8", fontSize: "12px" }}>/ 100</p>
              <p style={{ color: reputation.score >= 80 ? "#4ade80" : reputation.score >= 50 ? "#f59e0b" : "#ef4444",
                fontSize: "14px", fontWeight: "bold" }}>
                {reputation.score >= 80 ? "⭐ EXCELLENT" : reputation.score >= 50 ? "⚠ FAIR" : "❌ POOR"}
              </p>
            </div>
          )}
        </div>

        {/* STATS */}
        {reputation && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)",
            gap: "16px", marginBottom: "30px" }}>
            {[
              { label: "Total Cycles", value: reputation.totalCycles, color: "#60a5fa" },
              { label: "On-Time Payments", value: reputation.onTime, color: "#4ade80" },
              { label: "Late Payments", value: reputation.late, color: "#f59e0b" },
              { label: "Defaults", value: reputation.defaults, color: "#ef4444" }
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: "#1e293b", borderRadius: "10px",
                padding: "16px", textAlign: "center", border: "1px solid #334155" }}>
                <p style={{ color: s.color, fontSize: "28px", fontWeight: "bold" }}>{s.value}</p>
                <p style={{ color: "#64748b", fontSize: "12px" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* GROUPS */}
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ color: "#fff" }}>My Groups ({groups.length})</h2>
        </div>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading groups...</p>
        ) : groups.length === 0 ? (
          <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
            padding: "60px", textAlign: "center", border: "1px dashed #334155" }}>
            <p style={{ color: "#64748b", fontSize: "18px" }}>No groups yet</p>
            <p style={{ color: "#475569", marginBottom: "20px" }}>
              Create a group or join one with a group address
            </p>
            <button onClick={() => onNavigate("create")}
              style={{ backgroundColor: "#f59e0b", color: "#0f172a",
                border: "none", padding: "12px 28px", borderRadius: "8px", fontWeight: "bold" }}>
              + Create Your First Group
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "16px" }}>
            {groups.map((g, i) => (
              <div key={i} onClick={() => onNavigate("group", g.address)}
                style={{ backgroundColor: "#1e293b", borderRadius: "12px",
                  padding: "24px", border: "1px solid #334155", cursor: "pointer",
                  transition: "border 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.border = "1px solid #f59e0b"}
                onMouseLeave={e => e.currentTarget.style.border = "1px solid #334155"}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", marginBottom: "12px" }}>
                  <h3 style={{ color: "#fff" }}>📦 {g.name}</h3>
                  <span style={{ backgroundColor: statusColor(g.status) + "22",
                    color: statusColor(g.status), padding: "4px 10px",
                    borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                    {g.status}
                  </span>
                </div>
                <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "4px" }}>
                  Type: {g.type}
                </p>
                <p style={{ color: "#f59e0b", fontSize: "18px", fontWeight: "bold" }}>
                  {g.contribution} ETH / cycle
                </p>
                <div style={{ display: "flex", justifyContent: "space-between",
                  marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #334155" }}>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>
                    👥 {g.memberCount}/{g.limit} members
                  </span>
                  {g.isLeader && (
                    <span style={{ color: "#a78bfa", fontSize: "13px" }}>👑 Leader</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
