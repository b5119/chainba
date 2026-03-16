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

      const [name, type, contribution, stake, limit, leader,
        statusNum, memberCount, currentCycle] = await Promise.all([
        g.groupName(), g.groupType(), g.contributionAmount(),
        g.stakeAmount(), g.memberLimit(), g.leader(),
        g.status(), g.getMemberCount(), g.currentCycle()
      ]);

      const memberInfo = await g.members(account);
      const isMember = memberInfo[4];
      const isEjected = memberInfo[5];
      const memberStatus = ["Paid","Pending","Late","Defaulted"][memberInfo[2]];
      const status = ["Open","Active","Completed"][statusNum];

      let cycleInfo = null;
      if (statusNum === 1) {
        const ci = await g.getCycleInfo(currentCycle);
        cycleInfo = {
          beneficiary: ci[0],
          totalCollected: ethers.utils.formatEther(ci[1]),
          completed: ci[2],
          deadline: new Date(ci[3].toNumber() * 1000).toLocaleDateString()
        };
      }

      setGroup({
        name, type, status,
        contribution: ethers.utils.formatEther(contribution),
        contributionWei: contribution,
        stake: ethers.utils.formatEther(stake),
        stakeWei: stake,
        limit: limit.toNumber(),
        memberCount: memberCount.toNumber(),
        leader,
        currentCycle: currentCycle.toNumber(),
        isMember, isEjected, memberStatus,
        isLeader: leader.toLowerCase() === account.toLowerCase(),
        cycleInfo
      });
    } catch(e) {
      toast.error("Error loading group: " + e.message);
    }
    setLoading(false);
  };

  const joinGroup = async () => {
    if (!joinForm.name || !joinForm.nationalId || !joinForm.phone) {
      toast.error("Please fill all fields"); return;
    }
    setJoining(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const g = new ethers.Contract(groupAddress, GROUP_ABI, signer);
      const tx = await g.joinGroup(
        joinForm.name, joinForm.nationalId, joinForm.phone,
        { value: group.stakeWei }
      );
      toast.info("Joining group — please wait...");
      await tx.wait();
      toast.success("✅ Successfully joined!");
      loadGroup();
    } catch(e) {
      toast.error("Error: " + (e.reason || e.message));
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
      toast.success("✅ Contribution paid!");
      loadGroup();
    } catch(e) {
      toast.error("Error: " + (e.reason || e.message));
    }
    setPaying(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a",
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#f59e0b", fontSize: "20px" }}>⏳ Loading group...</p>
    </div>
  );

  if (!group) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a",
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#ef4444", fontSize: "18px" }}>Group not found</p>
        <button onClick={() => onNavigate("dashboard")}
          style={{ marginTop: "16px", padding: "10px 24px",
            backgroundColor: "#f59e0b", border: "none", borderRadius: "8px",
            color: "#0f172a", fontWeight: "bold" }}>
          ← Dashboard
        </button>
      </div>
    </div>
  );

  const statusColor = { Open:"#f59e0b", Active:"#4ade80", Completed:"#64748b" };
  const mColor = { Paid:"#4ade80", Pending:"#f59e0b", Late:"#fb923c", Defaulted:"#ef4444" };
  const inp = { width:"100%", padding:"10px", marginTop:"4px",
    backgroundColor:"#0f172a", border:"1px solid #334155",
    borderRadius:"6px", color:"#fff", fontSize:"14px" };

  return (
    <div style={{ minHeight:"100vh", backgroundColor:"#0f172a" }}>
      <div style={{ backgroundColor:"#1e3a6e", padding:"16px 40px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        borderBottom:"3px solid #f59e0b" }}>
        <h1 style={{ color:"#fff" }}>🪙 ChainBa</h1>
        <button onClick={() => onNavigate("dashboard")}
          style={{ backgroundColor:"transparent", color:"#94a3b8",
            border:"1px solid #334155", padding:"10px 20px", borderRadius:"8px" }}>
          ← Dashboard
        </button>
      </div>

      <div style={{ padding:"30px 40px", maxWidth:"760px", margin:"0 auto" }}>

        {/* GROUP CARD */}
        <div style={{ backgroundColor:"#1e293b", borderRadius:"12px",
          padding:"24px", border:"1px solid #334155", marginBottom:"20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"flex-start", marginBottom:"16px" }}>
            <div>
              <h2 style={{ color:"#fff", fontSize:"22px" }}>📦 {group.name}</h2>
              <p style={{ color:"#64748b", fontSize:"13px" }}>Type: {group.type}</p>
              <p style={{ color:"#475569", fontSize:"11px", marginTop:"4px" }}>
                {groupAddress}
              </p>
            </div>
            <span style={{ backgroundColor: statusColor[group.status]+"22",
              color: statusColor[group.status], padding:"5px 14px",
              borderRadius:"20px", fontWeight:"bold", fontSize:"13px" }}>
              {group.status}
            </span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
            {[
              ["Contribution", `${group.contribution} ETH`],
              ["Stake", `${group.stake} ETH`],
              ["Members", `${group.memberCount}/${group.limit}`]
            ].map(([label, val]) => (
              <div key={label} style={{ backgroundColor:"#0f172a", borderRadius:"8px",
                padding:"12px", textAlign:"center" }}>
                <p style={{ color:"#f59e0b", fontSize:"18px", fontWeight:"bold" }}>{val}</p>
                <p style={{ color:"#64748b", fontSize:"12px" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVE CYCLE */}
        {group.status === "Active" && group.cycleInfo && (
          <div style={{ backgroundColor:"#1e293b", borderRadius:"12px",
            padding:"24px", border:"1px solid #334155", marginBottom:"20px" }}>
            <h3 style={{ color:"#f59e0b", marginBottom:"14px" }}>
              🔄 Cycle {group.currentCycle + 1} — In Progress
            </h3>
            <p style={{ color:"#94a3b8", marginBottom:"6px" }}>
              Beneficiary:{" "}
              <span style={{ color:"#fff" }}>
                {group.cycleInfo.beneficiary.slice(0,8)}...
                {group.cycleInfo.beneficiary.slice(-6)}
                {group.cycleInfo.beneficiary.toLowerCase() === account.toLowerCase()
                  && " 🎉 YOU!"}
              </span>
            </p>
            <p style={{ color:"#94a3b8", marginBottom:"6px" }}>
              Collected:{" "}
              <span style={{ color:"#4ade80", fontWeight:"bold" }}>
                {group.cycleInfo.totalCollected} ETH
              </span>
            </p>
            <p style={{ color:"#94a3b8", marginBottom:"16px" }}>
              Deadline: <span style={{ color:"#fff" }}>{group.cycleInfo.deadline}</span>
            </p>

            {group.isMember && !group.isEjected && (
              <div style={{ backgroundColor:"#0f172a", borderRadius:"8px", padding:"16px" }}>
                <p style={{ color:"#94a3b8", marginBottom:"10px" }}>
                  Your Status:{" "}
                  <strong style={{ color: mColor[group.memberStatus] }}>
                    {group.memberStatus}
                  </strong>
                </p>
                {(group.memberStatus === "Pending" || group.memberStatus === "Late") && (
                  <button onClick={payContribution} disabled={paying}
                    style={{ width:"100%", padding:"14px",
                      backgroundColor: paying ? "#64748b" : "#4ade80",
                      border:"none", borderRadius:"8px", color:"#0f172a",
                      fontSize:"16px", fontWeight:"bold" }}>
                    {paying ? "Processing..." : `💸 Pay ${group.contribution} ETH Now`}
                  </button>
                )}
                {group.memberStatus === "Paid" && (
                  <p style={{ color:"#4ade80", textAlign:"center",
                    fontWeight:"bold", fontSize:"16px" }}>
                    ✅ You have paid this cycle!
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* JOIN FORM */}
        {group.status === "Open" && !group.isMember && (
          <div style={{ backgroundColor:"#1e293b", borderRadius:"12px",
            padding:"24px", border:"1px solid #f59e0b", marginBottom:"20px" }}>
            <h3 style={{ color:"#f59e0b", marginBottom:"6px" }}>Join This Group</h3>
            <p style={{ color:"#64748b", fontSize:"13px", marginBottom:"16px" }}>
              Stake required: <strong style={{ color:"#fff" }}>{group.stake} ETH</strong>
              {" "}— locked until group completes
            </p>
            {[
              ["Full Name", "name", "Your full name"],
              ["National ID (NRC)", "nationalId", "e.g. 123456/78/9"],
              ["Phone Number", "phone", "e.g. 0971234567"]
            ].map(([label, key, ph]) => (
              <div key={key} style={{ marginBottom:"12px" }}>
                <label style={{ color:"#94a3b8", fontSize:"13px" }}>{label}</label>
                <input style={inp} placeholder={ph}
                  value={joinForm[key]}
                  onChange={e => setJoinForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <button onClick={joinGroup} disabled={joining}
              style={{ width:"100%", padding:"14px", marginTop:"8px",
                backgroundColor: joining ? "#64748b" : "#f59e0b",
                border:"none", borderRadius:"8px", color:"#0f172a",
                fontSize:"15px", fontWeight:"bold" }}>
              {joining ? "Joining..." : `🤝 Join & Pay ${group.stake} ETH Stake`}
            </button>
            <p style={{ color:"#475569", fontSize:"11px",
              marginTop:"8px", textAlign:"center" }}>
              🔒 Your identity is hashed with keccak256 before storing on blockchain
            </p>
          </div>
        )}

        {/* SHARE */}
        <div style={{ backgroundColor:"#1e293b", borderRadius:"12px",
          padding:"18px", border:"1px solid #334155" }}>
          <p style={{ color:"#64748b", fontSize:"13px", marginBottom:"8px" }}>
            📤 Share this address with members to join:
          </p>
          <p style={{ color:"#f59e0b", fontSize:"12px", wordBreak:"break-all",
            backgroundColor:"#0f172a", padding:"10px", borderRadius:"6px" }}>
            {groupAddress}
          </p>
          <button onClick={() => {
  try {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(groupAddress);
    } else {
      const el = document.createElement("textarea");
      el.value = groupAddress;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    toast.success("Address copied!");
  } catch(e) {
    toast.info("Copy manually: " + groupAddress);
  }
}} style={{ marginTop:"8px", padding:"8px 16px",
            backgroundColor:"transparent", border:"1px solid #334155",
            borderRadius:"6px", color:"#94a3b8", fontSize:"13px" }}>
            📋 Copy Address
          </button>
        </div>
      </div>
    </div>
  );
}
