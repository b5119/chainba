import { useState, useEffect } from "react";
import { ethers } from "ethers";

import { GROUP_ABI } from "../contracts/config";
import { formatDualCurrency } from "../utils/currency";
import "./GroupView.css";

// ─── Logo mark (matches Dashboard + Login) ────────────────────────────────
function LogoMark() {
  return (
    <div className="gv-nav-logo-diamonds">
      <div className="gv-diamond" style={{ width:13, height:13, background:"#10B981" }} />
      <div className="gv-diamond" style={{ width:8, height:8, background:"#6366F1", marginLeft:"-3px", marginTop:"5px" }} />
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = { 0:"open", 1:"active", 2:"completed" };
  const label = map[status] ?? "unknown";
  const cls = `gv-status-badge gv-status-${label}`;
  return <span className={cls}>{label}</span>;
}

// ─── Member row — own component so future hooks are safe ──────────────────
function MemberRow({ address, account, hasPaid, name, reputation, index }) {
  const isYou = account && address.toLowerCase() === account.toLowerCase();
  const initials = name && name.length >= 2
    ? name.slice(0, 2).toUpperCase()
    : address ? address.slice(2, 4).toUpperCase() : "??";
  
  const displayName = name || `${address.slice(0,6)}...${address.slice(-4)}`;
  const truncated = address
    ? `${address.slice(0,6)}...${address.slice(-4)}`
    : "Unknown";

  return (
    <div className="gv-member-row">
      <div className="gv-avatar">{initials}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="gv-member-address" style={{ fontWeight: name ? "600" : "400" }}>
            {displayName}
            {isYou && <span className="gv-member-you">you</span>}
          </span>
        </div>
        {name && (
          <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px", fontFamily: "monospace" }}>
            {truncated} · Score: {reputation || 0}
          </div>
        )}
      </div>
      <span className={`gv-paid-badge ${hasPaid ? "gv-paid-yes" : "gv-paid-no"}`}>
        {hasPaid ? "✓ Paid" : "⏳ Pending"}
      </span>
    </div>
  );
}

// ─── Main GroupView ───────────────────────────────────────────────────────
export default function GroupView({ account, backendUser, groupAddress, onNavigate }) {
  const [groupData,    setGroupData]    = useState(null);
  const [members,      setMembers]      = useState([]);
  const [memberDetails, setMemberDetails] = useState([]); // {address, name, hasPaid, reputation}
  const [memberCount,  setMemberCount]  = useState(0);
  const [paidStatus,   setPaidStatus]   = useState([]);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [beneficiary,  setBeneficiary]  = useState(null);
  const [isMember,     setIsMember]     = useState(false);
  const [isLeader,     setIsLeader]     = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  // TX states
  const [contributing, setContributing] = useState(false);
  const [flagging,     setFlagging]     = useState(false);
  const [txStatus,     setTxStatus]     = useState(""); // "pending"|"confirmed"|"error"
  const [txMessage,    setTxMessage]    = useState("");
  const [txHash,       setTxHash]       = useState("");
  
  // JOIN states
  const [joining,      setJoining]      = useState(false);
  
  // Payout history states
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [upcomingDeadline, setUpcomingDeadline] = useState(null);
  
  // Flag defaulter modal states
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedDefaulter, setSelectedDefaulter] = useState("");
  const [complaintText, setComplaintText] = useState("");

  // ── Load group data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!groupAddress) return;
    loadGroup();
    // eslint-disable-next-line
  }, [groupAddress, account]);

  async function loadGroup() {
    setLoading(true);
    setError("");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(groupAddress, GROUP_ABI, provider);

      // Use the account prop directly (passed from App.js)
      console.log("Loading group for account:", account);

      const [
        name, type, status, contribAmount, stakeAmt, penaltyAmt,
        limit, gracePeriod, ejectionThresh, cycle, leader,
      ] = await Promise.all([
        contract.groupName(),
        contract.groupType(),
        contract.status(),
        contract.contributionAmount(),
        contract.stakeAmount(),
        contract.penaltyAmount(),
        contract.memberLimit(),
        contract.gracePeriodDays(),
        contract.ejectionThreshold(),
        contract.currentCycle(),
        contract.leader(),
      ]);

      setGroupData({
        name,
        type,
        status: Number(status),
        contributionAmount: contribAmount,
        stakeAmount: stakeAmt,
        penaltyAmount: penaltyAmt,
        memberLimit: Number(limit),
        gracePeriod: Number(gracePeriod),
        ejectionThreshold: Number(ejectionThresh),
      });
      setCurrentCycle(Number(cycle));

      if (leader && account) {
        setIsLeader(leader.toLowerCase() === account.toLowerCase());
      }

      // Member count
      const count = await contract.getMemberCount();
      setMemberCount(Number(count));

      // Member list using getMembers()
      let memberList = [];
      let memberDetails = []; // Store {address, name, hasPaid, reputation}
      const paid = [];
      let userIsMember = false;

      try {
        memberList = await contract.getMembers();
        console.log("Members:", memberList);
        
        // Get reputation contract
        const reputationAddr = await contract.reputationContract();
        const ReputationContract = new ethers.Contract(
          reputationAddr,
          [
            "function getScore(address) view returns (uint256)",
            "function getMember(address) view returns (uint256,uint256,uint256,uint256,uint256,uint256)"
          ],
          provider
        );
        
        // Check payment status and fetch details for each member
        for (let i = 0; i < memberList.length; i++) {
          const addr = memberList[i];
          const hasPaid = await contract.hasPaid(addr, Number(cycle));
          console.log(`Member ${addr} paid in cycle ${cycle}:`, hasPaid);
          paid.push(hasPaid);
          
          // Get member details from contract
          let memberName = "";
          let reputationScore = 0;
          try {
            const memberData = await contract.members(addr);
            memberName = memberData[0]; // fullName is first in tuple
            
            // Get reputation score
            try {
              reputationScore = Number(await ReputationContract.getScore(addr));
            } catch (e) {
              console.log("Error getting reputation for", addr, e);
            }
          } catch (e) {
            console.log("Error getting member details for", addr, e);
          }
          
          memberDetails.push({
            address: addr,
            name: memberName || "Unknown",
            hasPaid: hasPaid,
            reputation: reputationScore,
          });
          
          if (account && addr.toLowerCase() === account.toLowerCase()) {
            userIsMember = true;
          }
        }
      } catch (e) {
        console.log("Error loading members:", e);
      }

      setMembers(memberList);
      setMemberDetails(memberDetails);
      setPaidStatus(paid);
      setIsMember(userIsMember);

      // Beneficiary for active groups
      if (Number(status) === 1) {
        try {
          const ben = await contract.getCurrentBeneficiary();
          setBeneficiary(ben);
        } catch {
          setBeneficiary(null);
        }
      }
      
      // Load payout history for all completed cycles
      const history = [];
      const totalCycles = Number(cycle);
      console.log("Loading cycle history, total cycles:", totalCycles);
      
      for (let i = 1; i <= totalCycles; i++) {
        try {
          const cycleInfo = await contract.getCycleInfo(i);
          console.log(`Cycle ${i} info:`, {
            beneficiary: cycleInfo.beneficiary,
            deadline: cycleInfo.deadline.toString(),
            deadlineDate: new Date(Number(cycleInfo.deadline) * 1000).toISOString(),
            completed: cycleInfo.completed
          });
          
          if (cycleInfo.completed) {
            // Note: totalCollected is reset to 0 after payout, so calculate from contribution * members
            const payoutAmount = contribAmount.mul(memberList.length);
            history.push({
              cycle: i,
              beneficiary: cycleInfo.beneficiary,
              amount: payoutAmount,
              deadline: new Date(Number(cycleInfo.deadline) * 1000),
              completed: true,
            });
          } else if (i === totalCycles) {
            // Current cycle deadline
            const deadlineDate = new Date(Number(cycleInfo.deadline) * 1000);
            console.log("Setting upcoming deadline:", deadlineDate);
            setUpcomingDeadline(deadlineDate);
          }
        } catch (e) {
          console.log(`Error loading cycle ${i}:`, e);
        }
      }
      console.log("Payout history:", history);
      setPayoutHistory(history);
    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message || err.reason || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Pay contribution ─────────────────────────────────────────────────────
  async function handleContribute() {
    setContributing(true);
    setTxStatus("pending");
    setTxMessage("Waiting for wallet approval...");
    setTxHash("");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(groupAddress, GROUP_ABI, signer);

      console.log("Sending contribution:", {
        contributionAmount: groupData.contributionAmount.toString(),
        formatted: ethers.utils.formatEther(groupData.contributionAmount)
      });

      const tx = await contract.payContribution({
        value: groupData.contributionAmount,
      });
      setTxHash(tx.hash);
      setTxMessage("Transaction submitted — confirming...");
      await tx.wait(1);

      setTxStatus("confirmed");
      setTxMessage("✓ Contribution confirmed!");
      await loadGroup();
    } catch (err) {
      console.error("Contribution error:", err);
      setTxStatus("error");
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setTxMessage("Transaction rejected.");
      } else if (err.reason) {
        setTxMessage(`Contract error: ${err.reason}`);
      } else if (err.message) {
        setTxMessage(`Error: ${err.message}`);
      } else {
        setTxMessage("Transaction failed. Please try again.");
      }
    } finally {
      setContributing(false);
    }
  }

  // ── Join circle (pay stake) ──────────────────────────────────────────────
  async function handleJoin() {
    const fullName = backendUser?.fullName || "";
    const nationalId = backendUser?.identityHash || "";
    const phone = backendUser?.phone || "";
    
    if (!fullName || !nationalId || !phone) {
      setTxStatus("error");
      setTxMessage("User account information not found. Please sign in again.");
      return;
    }
    
    setJoining(true);
    setTxStatus("pending");
    setTxMessage("Waiting for wallet approval to pay stake...");
    setTxHash("");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(groupAddress, GROUP_ABI, signer);

      console.log("Joining group:", {
        fullName,
        stakeAmount: groupData.stakeAmount.toString(),
        formatted: ethers.utils.formatEther(groupData.stakeAmount)
      });

      const tx = await contract.joinGroup(
        fullName,
        nationalId,
        phone,
        {
          value: groupData.stakeAmount,
        }
      );
      setTxHash(tx.hash);
      setTxMessage("Transaction submitted — confirming...");
      await tx.wait(1);

      setTxStatus("confirmed");
      setTxMessage(`✓ Joined! Stake of ${formatDualCurrency(ethers.utils.formatEther(groupData.stakeAmount))} paid.`);
      
      // Wait a moment for blockchain state to update, then reload
      setTimeout(async () => {
        await loadGroup();
      }, 1500);
    } catch (err) {
      console.error("Join error:", err);
      setTxStatus("error");
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setTxMessage("Transaction rejected.");
      } else if (err.reason) {
        setTxMessage(`Contract error: ${err.reason}`);
      } else if (err.message) {
        setTxMessage(`Error: ${err.message}`);
      } else {
        setTxMessage("Transaction failed. Please try again.");
      }
    } finally {
      setJoining(false);
    }
  }


  // ── Flag default ─────────────────────────────────────────────────────────
  async function handleFlagDefault() {
    if (!selectedDefaulter) {
      setTxMessage("Please select a member to flag");
      return;
    }
    if (!complaintText.trim()) {
      setTxMessage("Please provide complaint details");
      return;
    }
    
    setFlagging(true);
    setTxStatus("pending");
    setTxMessage("Flagging default on-chain and submitting complaint...");
    
    try {
      // 1. Flag on blockchain
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(groupAddress, GROUP_ABI, signer);
      const tx = await contract.flagDefault(selectedDefaulter);
      await tx.wait(1);
      
      // 2. Submit complaint to backend
      const token = localStorage.getItem("chainba_token");
      const defaulterDetails = memberDetails.find(
        m => m.address.toLowerCase() === selectedDefaulter.toLowerCase()
      );
      
      const response = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          groupAddress,
          groupName: groupData?.name || "Unknown",
          reporterAddress: account,
          reporterName: backendUser?.fullName || "Unknown",
          defaulterAddress: selectedDefaulter,
          defaulterName: defaulterDetails?.name || "Unknown",
          complaintText: complaintText.trim(),
          cycle: currentCycle
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit complaint to backend");
      }
      
      setTxStatus("confirmed");
      setTxMessage("✓ Default flagged on-chain and complaint submitted.");
      setShowFlagModal(false);
      setSelectedDefaulter("");
      setComplaintText("");
      await loadGroup();
    } catch (err) {
      setTxStatus("error");
      setTxMessage(err.reason || err.message || "Failed to flag default.");
    } finally {
      setFlagging(false);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const paidCount  = paidStatus.filter(Boolean).length;
  const totalCount = members.length;
  const progress   = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
  const alreadyPaid = account && members.some(
    (m, i) => m.toLowerCase() === account.toLowerCase() && paidStatus[i]
  );

  const contribETH = groupData
    ? ethers.utils.formatEther(groupData.contributionAmount)
    : "0";

  const stakeETH = groupData
    ? ethers.utils.formatEther(groupData.stakeAmount)
    : "0";

  // ── Render states ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="gv-page">
      <div className="gv-state">
        <div className="gv-spinner" />
        <p className="gv-state-text">Loading circle...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="gv-page">
      <div className="gv-state">
        <p style={{ color:"#EF4444", fontSize:14, textAlign:"center", maxWidth:400 }}>{error}</p>
        <button className="gv-back-btn" onClick={() => onNavigate("dashboard")}>
          ← Back to dashboard
        </button>
      </div>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="gv-page">

      {/* Navbar */}
      <nav className="gv-nav">
        <div className="gv-nav-logo" onClick={() => onNavigate("landingV2")}>
          <LogoMark />
          <span className="gv-nav-wordmark" style={{ marginLeft:8 }}>ChainBa</span>
        </div>
        <button className="gv-back-btn" onClick={() => onNavigate("dashboard")}>
          ← Dashboard
        </button>
      </nav>

      <main className="gv-main">

        {/* Hero card */}
        <div className="gv-hero">
          <div className="gv-hero-top">
            <div>
              <h1 className="gv-group-name">{groupData?.name || "Circle"}</h1>
              <p className="gv-leader">
                Contract: {groupAddress?.slice(0,8)}...{groupAddress?.slice(-6)}
                {isLeader && " · 👑 Leader"}
                {!isMember && !isLeader && " · Join to participate"}
              </p>
            </div>
            <StatusBadge status={groupData?.status} />
          </div>

           {/* Stats row */}
           <div className="gv-stats-row">
             <div className="gv-stat">
               <div className="gv-stat-label">Contribution</div>
               <div className="gv-stat-value">{formatDualCurrency(contribETH)}</div>
             </div>
             <div className="gv-stat">
               <div className="gv-stat-label">Members</div>
               <div className="gv-stat-value">{memberCount} / {groupData?.memberLimit}</div>
             </div>

             <div className="gv-stat">
               <div className="gv-stat-label">Current round</div>
               <div className="gv-stat-value">{currentCycle}</div>
             </div>
           </div>
         </div>

         {/* Beneficiary payout notification — show if user is current beneficiary and all paid */}
         {beneficiary && account && beneficiary.toLowerCase() === account.toLowerCase() && progress === 100 && (
           <div style={{
             padding: "16px 20px",
             background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
             color: "white",
             borderRadius: "12px",
             marginBottom: "24px",
             boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
           }}>
             <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
               <span style={{ fontSize: "24px" }}>💰</span>
               <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                 You're receiving payout this round!
               </h3>
             </div>
             <p style={{ margin: "4px 0 0 36px", fontSize: "14px", opacity: 0.95 }}>
               All members have contributed. You will receive{" "}
               <strong>{formatDualCurrency(ethers.utils.formatEther(groupData?.contributionAmount.mul(memberCount) || "0"))}</strong>
               {" "}once the cycle is completed.
             </p>
           </div>
         )}

         {/* Round progress */}
        <div className="gv-section">
          <h2 className="gv-section-heading">Round progress</h2>
          <div className="gv-progress-bar-wrap">
            <div className="gv-progress-bar-fill" style={{ width:`${progress}%` }} />
          </div>
          <p className="gv-progress-text">
            {paidCount} of {totalCount} members have contributed this round
          </p>
          {beneficiary && groupData?.status === 1 && (
            <div className="gv-payout-info">
              Next payout → {beneficiary.slice(0,6)}...{beneficiary.slice(-4)}
              {account && beneficiary.toLowerCase() === account.toLowerCase() && " (you!)"}
            </div>
          )}
        </div>

         {/* Members */}
         <div className="gv-section">
           <h2 className="gv-section-heading">
             Members
             <span style={{ fontSize:13, fontWeight:400, color:"#64748B", marginLeft:8 }}>
               {memberCount} / {groupData?.memberLimit}
             </span>
           </h2>
            <div className="gv-members-list">
              {members.length === 0 ? (
                <p style={{ fontSize:13, color:"#64748B" }}>No members yet.</p>
              ) : (
                memberDetails.length > 0 ? (
                  memberDetails.map((member, i) => (
                    <MemberRow
                      key={member.address}
                      address={member.address}
                      account={account}
                      hasPaid={member.hasPaid}
                      name={member.name}
                      reputation={member.reputation}
                      index={i}
                    />
                  ))
                ) : (
                  members.map((addr, i) => (
                    <MemberRow
                      key={addr}
                      address={addr}
                      account={account}
                      hasPaid={paidStatus[i]}
                      index={i}
                    />
                  ))
                )
              )}
            </div>
          </div>

         {/* Payout History & Payment Schedule */}
         {(isMember || isLeader) && (
           <div className="gv-section">
             <h2 className="gv-section-heading">Payout History & Schedule</h2>
             
             {/* Upcoming Payment Deadline */}
             {upcomingDeadline && groupData?.status === 1 && (
               <div style={{
                 padding: "16px",
                 background: "#FEF3C7",
                 border: "1px solid #FDE68A",
                 borderRadius: "8px",
                 marginBottom: "16px"
               }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                   <span style={{ fontSize: "18px" }}>📅</span>
                   <strong style={{ fontSize: "14px", color: "#92400E" }}>Next Payment Deadline</strong>
                 </div>
                 <p style={{ margin: "4px 0 0 26px", fontSize: "13px", color: "#78350F" }}>
                   {upcomingDeadline.toLocaleDateString('en-GB', { 
                     weekday: 'long', 
                     year: 'numeric', 
                     month: 'long', 
                     day: 'numeric' 
                   })}
                   {" at "}
                   {upcomingDeadline.toLocaleTimeString('en-GB', { 
                     hour: '2-digit', 
                     minute: '2-digit' 
                   })}
                 </p>
               </div>
             )}
             
             {/* Payout History Table */}
             {payoutHistory.length > 0 ? (
               <div style={{
                 border: "1px solid #E5E7EB",
                 borderRadius: "8px",
                 overflow: "hidden"
               }}>
                 <table style={{ width: "100%", borderCollapse: "collapse" }}>
                   <thead style={{ background: "#F9FAFB" }}>
                     <tr>
                       <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>
                         Round
                       </th>
                       <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>
                         Beneficiary
                       </th>
                       <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>
                         Amount Paid
                       </th>
                       <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>
                         Completed On
                       </th>
                       <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>
                         Status
                       </th>
                     </tr>
                   </thead>
                   <tbody>
                     {payoutHistory.map((payout, idx) => {
                       const isUserBeneficiary = account && payout.beneficiary.toLowerCase() === account.toLowerCase();
                       return (
                         <tr key={idx} style={{
                           background: isUserBeneficiary ? "#F0FDF4" : "white",
                           borderBottom: idx < payoutHistory.length - 1 ? "1px solid #E5E7EB" : "none"
                         }}>
                           <td style={{ padding: "12px 16px", fontSize: "14px", color: "#0F172A" }}>
                             Cycle {payout.cycle}
                           </td>
                           <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748B", fontFamily: "monospace" }}>
                             {payout.beneficiary.slice(0, 6)}...{payout.beneficiary.slice(-4)}
                             {isUserBeneficiary && (
                               <span style={{ marginLeft: "8px", fontSize: "12px", color: "#10B981", fontWeight: "600" }}>
                                 (You!)
                               </span>
                             )}
                           </td>
                           <td style={{ padding: "12px 16px", fontSize: "14px", color: "#0F172A", fontWeight: "600" }}>
                             {formatDualCurrency(ethers.utils.formatEther(payout.amount))}
                           </td>
                           <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748B" }}>
                             {payout.deadline.toLocaleDateString('en-GB', { 
                               day: '2-digit', 
                               month: 'short', 
                               year: 'numeric' 
                             })}
                           </td>
                           <td style={{ padding: "12px 16px", textAlign: "center" }}>
                             <span style={{
                               padding: "4px 12px",
                               background: "#DCFCE7",
                               color: "#166534",
                               fontSize: "12px",
                               fontWeight: "600",
                               borderRadius: "12px"
                             }}>
                               ✓ Paid
                             </span>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             ) : (
               <p style={{ fontSize: "13px", color: "#64748B", textAlign: "center", padding: "20px" }}>
                 No completed payouts yet. History will appear here once rounds are completed.
               </p>
             )}
           </div>
         )}

          {/* Contract Transparency */}
         <div className="gv-section">
           <details className="gv-contract-details">
             <summary className="gv-contract-summary">
               📋 Contract Transparency
             </summary>
             <div className="gv-contract-content">
               <div className="gv-contract-row">
                 <span>Contract Address</span>
                 <code>{groupAddress}</code>
               </div>
               <div className="gv-contract-row">
                 <span>Group Type</span>
                 <code>{groupData?.type || "—"}</code>
               </div>
               <div className="gv-contract-row">
                 <span>Contribution Amount</span>
                 <code>{formatDualCurrency(ethers.utils.formatEther(groupData?.contributionAmount || "0"))}</code>
               </div>
               <div className="gv-contract-row">
                 <span>Stake Amount</span>
                 <code>{formatDualCurrency(ethers.utils.formatEther(groupData?.stakeAmount || "0"))}</code>
               </div>
               <div className="gv-contract-row">
                 <span>Penalty Amount</span>
                 <code>{formatDualCurrency(ethers.utils.formatEther(groupData?.penaltyAmount || "0"))}</code>
               </div>
               <div className="gv-contract-row">
                 <span>Grace Period</span>
                 <code>{groupData?.gracePeriod || "—"} days</code>
               </div>
               <div className="gv-contract-row">
                 <span>Ejection Threshold</span>
                 <code>{groupData?.ejectionThreshold || "—"} defaults</code>
               </div>
             </div>
           </details>
         </div>

         {/* TX status */}
         {txStatus && (
           <div className={`gv-tx-banner gv-tx-${txStatus}`}>
             {txMessage}
             {txHash && (
               <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.9 }}>
                 <span>Transaction: </span>
                 <a
                   href={`https://etherscan.io/tx/${txHash}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   style={{ 
                     color: "inherit", 
                     textDecoration: "underline",
                     fontFamily: "monospace"
                   }}
                 >
                   {txHash.slice(0, 10)}...{txHash.slice(-8)}
                 </a>
                 <span style={{ marginLeft: "8px" }}>↗</span>
               </div>
             )}
           </div>
         )}

          {/* JOIN FORM — for non-members */}
          {!isMember && !backendUser && txStatus !== "confirmed" && (
            <div className="gv-join-section">
              <h3 style={{ marginBottom: "12px", color: "#0F172A" }}>Join this Circle</h3>
              <p style={{ fontSize: "13px", color: "#64748B" }}>
                Please sign in to join this circle.
              </p>
              <button
                className="gv-btn-contribute"
                onClick={() => onNavigate("login")}
                style={{ marginTop: "12px" }}
              >
                Sign In
              </button>
            </div>
          )}

          {/* JOIN CONFIRMATION — for authenticated non-members */}
          {!isMember && backendUser && txStatus !== "confirmed" && (
            <div className="gv-join-section">
              <h3 style={{ marginBottom: "16px", color: "#0F172A" }}>
                {isLeader ? "Pay Stake to Join Your Circle" : "Join this Circle"}
              </h3>
              
              {/* Confirmation card */}
              <div style={{ 
                padding: "16px", 
                background: "#F0FDF4", 
                border: "1px solid #DCFCE7",
                borderRadius: "8px", 
                marginBottom: "16px"
              }}>
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>Joining as</p>
                  <p style={{ fontSize: "16px", fontWeight: "600", color: "#0F172A" }}>
                    {backendUser.fullName}
                  </p>
                </div>
                
                <div>
                  <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>Stake required</p>
                  <p style={{ fontSize: "16px", fontWeight: "600", color: "#0F172A" }}>
                    {formatDualCurrency(stakeETH)}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="gv-btn-join"
                  onClick={handleJoin}
                  disabled={joining}
                  style={{ flex: 1, background: "#10B981", color: "white" }}
                >
                  {joining ? "Processing..." : "Confirm & Join"}
                </button>
                <button
                  className="gv-btn-contribute"
                  onClick={() => onNavigate("dashboard")}
                  disabled={joining}
                  style={{ flex: 1, background: "transparent", color: "#0F172A", border: "1px solid #E5E7EB" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

         {/* Actions */}
        <div className="gv-actions">
          {/* Contribute button */}
          {isMember && groupData?.status === 1 && (
            <button
              className="gv-btn-contribute"
              onClick={handleContribute}
              disabled={contributing || alreadyPaid}
            >
              {alreadyPaid
                ? "✓ Already contributed this round"
                : contributing
                  ? "Confirming..."
                  : `Pay ${contribETH} ETH`}
            </button>
          )}

          {/* Flag default — leader only */}
          {isLeader && groupData?.status === 1 && (
            <button
              className="gv-btn-flag"
              onClick={() => setShowFlagModal(true)}
              disabled={flagging}
            >
              {flagging ? "Flagging..." : "Flag Defaulter"}
            </button>
          )}
        </div>

      </main>
      
      {/* Flag Defaulter Modal */}
      {showFlagModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <h3 style={{ marginBottom: "16px", color: "#0F172A" }}>Flag Defaulter</h3>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ 
                display: "block", 
                fontSize: "13px", 
                fontWeight: "600",
                color: "#0F172A",
                marginBottom: "8px" 
              }}>
                Select Member
              </label>
              <select
                value={selectedDefaulter}
                onChange={(e) => setSelectedDefaulter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              >
                <option value="">-- Select a member --</option>
                {memberDetails
                  .filter(m => m.address.toLowerCase() !== account?.toLowerCase())
                  .map(m => (
                    <option key={m.address} value={m.address}>
                      {m.name} ({m.address.slice(0,6)}...{m.address.slice(-4)})
                    </option>
                  ))
                }
              </select>
            </div>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ 
                display: "block", 
                fontSize: "13px", 
                fontWeight: "600",
                color: "#0F172A",
                marginBottom: "8px" 
              }}>
                Complaint Details
              </label>
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Describe the reason for flagging this member (e.g., failed to pay for 2 cycles, unresponsive to reminders, etc.)"
                rows={5}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical"
                }}
              />
            </div>
            
            {txMessage && (
              <div style={{
                padding: "12px",
                background: txStatus === "error" ? "#FEE2E2" : "#F0FDF4",
                border: `1px solid ${txStatus === "error" ? "#FECACA" : "#DCFCE7"}`,
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "13px",
                color: txStatus === "error" ? "#991B1B" : "#166534"
              }}>
                {txMessage}
              </div>
            )}
            
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleFlagDefault}
                disabled={flagging || !selectedDefaulter || !complaintText.trim()}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: flagging || !selectedDefaulter || !complaintText.trim() ? "#E5E7EB" : "#EF4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: flagging || !selectedDefaulter || !complaintText.trim() ? "not-allowed" : "pointer"
                }}
              >
                {flagging ? "Processing..." : "Submit Complaint"}
              </button>
              <button
                onClick={() => {
                  setShowFlagModal(false);
                  setSelectedDefaulter("");
                  setComplaintText("");
                  setTxMessage("");
                }}
                disabled={flagging}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "transparent",
                  color: "#0F172A",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: flagging ? "not-allowed" : "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}