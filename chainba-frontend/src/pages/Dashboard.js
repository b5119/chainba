import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { FACTORY_ADDRESS, FACTORY_ABI, GROUP_ABI, 
         REPUTATION_ABI, REPUTATION_ADDRESS } from "../contracts/config";
import { toast } from "react-toastify";

export default function Dashboard({ account, onNavigate }) {
  const [groups, setGroups] = useState([]);
  const [reputation, setReputation] = useState(null);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [joinAddress, setJoinAddress] = useState("");

  useEffect(() => { 
    if (account) loadData(); 
  // eslint-disable-next-line
  }, [account]);

  const loadData = async () => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Get balance
      const bal = await provider.getBalance(account);
      setBalance(parseFloat(ethers.utils.formatEther(bal)).toFixed(4));

      // Get groups
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      let allGroups = [];
      try {
        allGroups = await factory.getAllGroups();
      } catch(e) {
        console.log("Factory error:", e.message);
        toast.error("Could not load groups — check Hardhat node is running");
        setLoading(false);
        return;
      }

      const groupData = [];
      for (let addr of allGroups) {
        try {
          const g = new ethers.Contract(addr, GROUP_ABI, signer);
          const name = await g.groupName();
          const type = await g.groupType();
          const contribution = await g.contributionAmount();
          const stake = await g.stakeAmount();
          const limit = await g.memberLimit();
          const leader = await g.leader();
          const status = await g.status();
          const memberCount = await g.getMemberCount();
          const memberInfo = await g.members(account);
          const isMember = memberInfo[4];
          const isLeader = leader.toLowerCase() === account.toLowerCase();
          
          if (isMember || isLeader) {
            groupData.push({
              address: addr, name, type,
              contribution: ethers.utils.formatEther(contribution),
              stake: ethers.utils.formatEther(stake),
              limit: limit.toNumber(),
              memberCount: memberCount.toNumber(),
              status: ["Open","Active","Completed"][status],
              isLeader
            });
          }
        } catch(e) { console.log("Group error:", e); }
      }
      setGroups(groupData);

      // Get reputation
      try {
        const rep = new ethers.Contract(REPUTATION_ADDRESS, REPUTATION_ABI, signer);
        const r = await rep.getMember(account);
        setReputation({
          score: r[0].toString(),
          totalCycles: r[1].toString(),
          onTime: r[2].toString(),
          late: r[3].toString(),
          defaults: r[4].toString(),
          ejections: r[5].toString()
        });
      } catch(e) { 
        console.log("Reputation not loaded:", e.message);
        setReputation({ score:"100", totalCycles:"0", onTime:"0", late:"0", defaults:"0", ejections:"0" });
      }

    } catch(e) { 
      console.error("Load error:", e);
      toast.error("Error: " + e.message);
    }
    setLoading(false);
  };

  const statusColor = (s) =>
    s === "Active" ? "#4ade80" : s === "Open" ? "#f59e0b" : "#64748b";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}>
      <div style={{ backgroundColor: "#1e3a6e", padding: "16px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "3px solid #f59e0b" }}>
        <h1 style={{ color: "#fff" }}>🪙 ChainBa</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => onNavigate("create")}
            style={{ backgroundColor: "#f59e0b", color: "#0f172a",
              border: "none", padding: "10px 20px", borderRadius: "8px",
              fontWeight: "bold" }}>
            + Create Group
          </button>
          <button onClick={() => onNavigate("landing")}
            style={{ backgroundColor: "transparent", color: "#94a3b8",
              border: "1px solid #334155", padding: "10px 20px", borderRadius: "8px" }}>
            ← Home
          </button>
        </div>
      </div>

      <div style={{ padding: "30px 40px" }}>

        {/* WALLET + REPUTATION */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr",
          gap: "20px", marginBottom: "24px" }}>
          <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
            padding: "24px", border: "1px solid #334155" }}>
            <p style={{ color: "#64748b", fontSize: "13px" }}>Connected Wallet</p>
            <p style={{ color: "#fff", margin: "6px 0", fontSize: "14px" }}>
              {account?.slice(0,10)}...{account?.slice(-8)}
            </p>
            <p style={{ color: "#f59e0b", fontSize: "32px", fontWeight: "bold" }}>
              {balance} ETH
            </p>
            <p style={{ color: "#64748b", fontSize: "12px" }}>Hardhat Local Network</p>
          </div>
          <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
            padding: "24px", border: "1px solid #334155", textAlign: "center" }}>
            <p style={{ color: "#64748b", fontSize: "13px" }}>Reputation Score</p>
            <p style={{ color: "#f59e0b", fontSize: "52px", fontWeight: "bold" }}>
              {reputation?.score ?? "—"}
            </p>
            <p style={{ color: "#64748b", fontSize: "12px" }}>/ 100</p>
            {reputation && (
              <p style={{ color: parseInt(reputation.score) >= 80 ? "#4ade80" :
                parseInt(reputation.score) >= 50 ? "#f59e0b" : "#ef4444",
                fontSize: "13px", fontWeight: "bold", marginTop: "4px" }}>
                {parseInt(reputation.score) >= 80 ? "⭐ EXCELLENT" :
                  parseInt(reputation.score) >= 50 ? "⚠ FAIR" : "❌ POOR"}
              </p>
            )}
          </div>
        </div>

        {/* STATS */}
        {reputation && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)",
            gap: "12px", marginBottom: "24px" }}>
            {[
              ["Total Cycles", reputation.totalCycles, "#60a5fa"],
              ["On-Time", reputation.onTime, "#4ade80"],
              ["Late", reputation.late, "#f59e0b"],
              ["Defaults", reputation.defaults, "#ef4444"]
            ].map(([label, val, color]) => (
              <div key={label} style={{ backgroundColor: "#1e293b", borderRadius: "10px",
                padding: "14px", textAlign: "center", border: "1px solid #334155" }}>
                <p style={{ color, fontSize: "26px", fontWeight: "bold" }}>{val}</p>
                <p style={{ color: "#64748b", fontSize: "12px" }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* JOIN BY ADDRESS */}
        <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
          padding: "20px", border: "1px solid #334155", marginBottom: "24px" }}>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "10px" }}>
            Join a group by pasting its contract address:
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <input value={joinAddress} 
              onChange={e => setJoinAddress(e.target.value)}
              placeholder="0x..."
              style={{ flex: 1, padding: "10px", backgroundColor: "#0f172a",
                border: "1px solid #334155", borderRadius: "8px",
                color: "#fff", fontSize: "14px" }} />
            <button 
              onClick={() => joinAddress && onNavigate("group", joinAddress)}
              style={{ padding: "10px 20px", backgroundColor: "#f59e0b",
                border: "none", borderRadius: "8px", color: "#0f172a",
                fontWeight: "bold" }}>
              View →
            </button>
          </div>
        </div>

        {/* GROUPS */}
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ color: "#fff" }}>My Groups ({groups.length})</h2>
          <button onClick={loadData}
            style={{ backgroundColor: "transparent", color: "#64748b",
              border: "1px solid #334155", padding: "6px 14px", 
              borderRadius: "6px", fontSize: "13px" }}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#f59e0b", fontSize: "18px" }}>⏳ Loading...</p>
          </div>
        ) : groups.length === 0 ? (
          <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
            padding: "60px", textAlign: "center", border: "1px dashed #334155" }}>
            <p style={{ color: "#64748b", fontSize: "18px", marginBottom: "8px" }}>
              No groups yet
            </p>
            <p style={{ color: "#475569", marginBottom: "20px" }}>
              Create a group or paste a group address above to join
            </p>
            <button onClick={() => onNavigate("create")}
              style={{ backgroundColor: "#f59e0b", color: "#0f172a",
                border: "none", padding: "12px 28px", borderRadius: "8px",
                fontWeight: "bold" }}>
              + Create Your First Group
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", 
            gridTemplateColumns: "repeat(2,1fr)", gap: "16px" }}>
            {groups.map((g, i) => (
              <div key={i} 
                onClick={() => onNavigate("group", g.address)}
                style={{ backgroundColor: "#1e293b", borderRadius: "12px",
                  padding: "24px", border: "1px solid #334155", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#f59e0b"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#334155"}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", marginBottom: "12px" }}>
                  <h3 style={{ color: "#fff" }}>📦 {g.name}</h3>
                  <span style={{ 
                    backgroundColor: statusColor(g.status) + "22",
                    color: statusColor(g.status), padding: "3px 10px",
                    borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                    {g.status}
                  </span>
                </div>
                <p style={{ color: "#94a3b8", fontSize: "13px" }}>
                  Type: {g.type}
                </p>
                <p style={{ color: "#f59e0b", fontSize: "20px",
                  fontWeight: "bold", margin: "8px 0" }}>
                  {g.contribution} ETH / cycle
                </p>
                <div style={{ display: "flex", justifyContent: "space-between",
                  paddingTop: "12px", borderTop: "1px solid #334155" }}>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>
                    👥 {g.memberCount}/{g.limit} members
                  </span>
                  {g.isLeader && (
                    <span style={{ color: "#a78bfa", fontSize: "13px" }}>
                      👑 Leader
                    </span>
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
