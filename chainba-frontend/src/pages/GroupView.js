import { useState, useEffect } from "react";
import { ethers } from "ethers";

import { GROUP_ABI } from "../contracts/config";
import { formatDualCurrency } from "../utils/currency";
import "./GroupView.css";

// ─── Status badge component ───────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = { 0:"open", 1:"active", 2:"completed" };
  const label = map[status] ?? "unknown";
  
  let badgeClass = "groupview-status-badge";
  if (label === "active") badgeClass += " groupview-status-active";
  else if (label === "open") badgeClass += " groupview-status-open";
  else if (label === "completed") badgeClass += " groupview-status-completed";
  
  return (
    <span className={badgeClass}>
      {label === "active" ? "Active Cycle" : label}
    </span>
  );
}

// ─── Member row component ─────────────────────────────────────────────────
function MemberRow({ address, account, hasPaid, name, reputation, index, contributionAmount }) {
  const isYou = account && address.toLowerCase() === account.toLowerCase();
  const initials = name && name.length >= 2
    ? name.slice(0, 2).toUpperCase()
    : address ? address.slice(2, 4).toUpperCase() : "??";
  
  const displayName = name || `${address.slice(0,6)}...${address.slice(-4)}`;
  const truncated = address
    ? `${address.slice(0,6)}...${address.slice(-4)}`
    : "Unknown";

  // Avatar colors based on index
  const avatarColors = [
    { bg: "#E1E0FF", text: "#07006C" }, // secondary-fixed
    { bg: "#FFDDB8", text: "#2A1700" }, // tertiary-fixed
    { bg: "#E0E3E5", text: "#3C4A42" }, // surface-container
    { bg: "#6FFBBE", text: "#002113" }, // primary-fixed
  ];
  const colorSet = avatarColors[index % avatarColors.length];

  return (
    <div className="groupview-member-item">
      <div className="groupview-member-left">
        <div className="groupview-member-avatar" style={{ 
          backgroundColor: colorSet.bg, 
          color: colorSet.text 
        }}>
          {initials}
        </div>
        <div>
          <p className="groupview-member-name">
            {displayName}
            {isYou && <span className="groupview-member-you-tag">You</span>}
          </p>
          <p className="groupview-member-meta">
            Member • Score: {reputation || 0}
          </p>
        </div>
      </div>
      <div className="groupview-member-right">
        <div className="groupview-member-contribution">
          <p className="groupview-member-amount">
            {contributionAmount ? formatDualCurrency(ethers.utils.formatEther(contributionAmount)) : "$0.00"}
          </p>
          <p className="groupview-member-label">CONTRIBUTION</p>
        </div>
        <span className={`groupview-member-badge ${hasPaid ? "groupview-badge-paid" : "groupview-badge-pending"}`}>
          {hasPaid ? "Paid" : "Pending"}
        </span>
      </div>
    </div>
  );
}

// ─── Main GroupView component ─────────────────────────────────────────────
export default function GroupView({ account, backendUser, groupAddress, onNavigate }) {
  const [groupData,    setGroupData]    = useState(null);
  const [members,      setMembers]      = useState([]);
  const [memberDetails, setMemberDetails] = useState([]);
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
  const [txStatus,     setTxStatus]     = useState("");
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
      let memberDetails = [];
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
            memberName = memberData[0];
            
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

  const totalPool = groupData && memberCount > 0
    ? ethers.utils.formatEther(groupData.contributionAmount.mul(memberCount))
    : "0";

  // ── Render states ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="groupview-page">
      <div className="groupview-loading">
        <div className="groupview-spinner" />
        <p className="groupview-loading-text">Loading circle...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="groupview-page">
      <div className="groupview-loading">
        <p style={{ color:"#BA1A1A", fontSize:14, textAlign:"center", maxWidth:400 }}>{error}</p>
        <button className="groupview-back-btn" onClick={() => onNavigate("dashboard")}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back to dashboard
        </button>
      </div>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="groupview-page">
      {/* Fixed Navigation */}
      <nav className="groupview-nav">
        <div className="groupview-nav-container">
          <div className="groupview-nav-left">
            <button className="groupview-nav-back-btn" onClick={() => onNavigate("dashboard")}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="groupview-nav-logo" onClick={() => onNavigate("landingV2")}>ChainBa</span>
          </div>
          <div className="groupview-nav-links">
            <a href="#" onClick={() => onNavigate("dashboard")} className="groupview-nav-link">Dashboard</a>
            <a href="#" className="groupview-nav-link groupview-nav-link-active">Circles</a>
            <a href="#" className="groupview-nav-link">Markets</a>
            <a href="#" className="groupview-nav-link">Governance</a>
          </div>
          <div className="groupview-nav-right">
            <button className="groupview-connect-wallet-btn">
              {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Connect Wallet"}
            </button>
            <div className="groupview-avatar-circle">
              <span className="material-symbols-outlined">account_circle</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="groupview-main">
        {/* Hero Section */}
        <div className="groupview-hero">
          <div className="groupview-hero-header">
            <div>
              <div className="groupview-hero-badges">
                <StatusBadge status={groupData?.status} />
                <span className="groupview-group-id">Group ID: #{groupAddress?.slice(-6)}</span>
              </div>
              <h1 className="groupview-group-title">{groupData?.name || "Circle"}</h1>
            </div>
            <div className="groupview-hero-actions">
              <button className="groupview-icon-btn">
                <span className="material-symbols-outlined">share</span>
              </button>
              <button className="groupview-icon-btn">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="groupview-stats-grid">
            <div className="groupview-stat-item">
              <p className="groupview-stat-label">Total Pool</p>
              <p className="groupview-stat-value groupview-stat-value-primary">{formatDualCurrency(totalPool)}</p>
            </div>
            <div className="groupview-stat-item">
              <p className="groupview-stat-label">Next Payout</p>
              <p className="groupview-stat-value">
                {upcomingDeadline 
                  ? upcomingDeadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : "Not set"}
              </p>
            </div>
            <div className="groupview-stat-item">
              <p className="groupview-stat-label">Members</p>
              <p className="groupview-stat-value">{memberCount} / {groupData?.memberLimit}</p>
            </div>
            <div className="groupview-stat-item">
              <p className="groupview-stat-label">Cycle</p>
              <p className="groupview-stat-value">{currentCycle} of {groupData?.memberLimit}</p>
            </div>
          </div>

          {/* Progress Bar Section */}
          <div className="groupview-progress-section">
            <div className="groupview-progress-header">
              <span className="groupview-progress-title">Contribution Progress</span>
              <span className="groupview-progress-percent">{progress}% Completed</span>
            </div>
            <div className="groupview-progress-bar">
              <div className="groupview-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Animated Kente Divider */}
        <div className="groupview-kente-divider" />

        <div className="groupview-content-grid">
          {/* Left Column: Contribution Ledger */}
          <div className="groupview-ledger-column">
            <div className="groupview-ledger-header">
              <h2 className="groupview-ledger-title">Contribution Ledger</h2>
              <span className="groupview-ledger-subtitle">Round {currentCycle} Participants</span>
            </div>
            <div className="groupview-members-card">
              <div className="groupview-members-list">
                {memberDetails.length > 0 ? (
                  memberDetails.map((member, i) => (
                    <MemberRow
                      key={member.address}
                      address={member.address}
                      account={account}
                      hasPaid={member.hasPaid}
                      name={member.name}
                      reputation={member.reputation}
                      index={i}
                      contributionAmount={groupData?.contributionAmount}
                    />
                  ))
                ) : (
                  <p className="groupview-empty-message">No members yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Actions & Details */}
          <div className="groupview-sidebar-column">
            {/* Your Position Card */}
            {isMember && (
              <div className="groupview-position-card">
                <h3 className="groupview-card-title">Your Position</h3>
                <div className="groupview-position-details">
                  <div className="groupview-position-row">
                    <span className="groupview-position-label">Next Payment Due</span>
                    <span className="groupview-position-value">
                      {upcomingDeadline 
                        ? upcomingDeadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : "Not set"}
                    </span>
                  </div>
                  <div className="groupview-position-row">
                    <span className="groupview-position-label">Amount Due</span>
                    <span className="groupview-position-value">{formatDualCurrency(contribETH)}</span>
                  </div>
                  <div className="groupview-position-row">
                    <span className="groupview-position-label">Payout Position</span>
                    <span className="groupview-position-value">
                      {beneficiary && account && beneficiary.toLowerCase() === account.toLowerCase() 
                        ? `${currentCycle} of ${groupData?.memberLimit} (Current!)`
                        : `${currentCycle} of ${groupData?.memberLimit}`}
                    </span>
                  </div>
                </div>
                
                {/* Contribute Button */}
                {groupData?.status === 1 && (
                  <button
                    className="groupview-contribute-btn"
                    onClick={handleContribute}
                    disabled={contributing || alreadyPaid}
                  >
                    <span className="material-symbols-outlined">payments</span>
                    {alreadyPaid
                      ? "Already Contributed"
                      : contributing
                        ? "Processing..."
                        : "Contribute Now"}
                  </button>
                )}

                {/* Flag Default Button - Leader Only */}
                {isLeader && groupData?.status === 1 && (
                  <button
                    className="groupview-flag-btn"
                    onClick={() => setShowFlagModal(true)}
                    disabled={flagging}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
                    Default Member (Leader Only)
                  </button>
                )}
              </div>
            )}

            {/* Join Card - Non-members */}
            {!isMember && (
              <div className="groupview-position-card">
                <h3 className="groupview-card-title">Join this Circle</h3>
                {!backendUser ? (
                  <div>
                    <p className="groupview-join-text">Please sign in to join this circle.</p>
                    <button
                      className="groupview-contribute-btn"
                      onClick={() => onNavigate("login")}
                      style={{ marginTop: "16px" }}
                    >
                      Sign In
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="groupview-position-details" style={{ marginBottom: "16px" }}>
                      <div className="groupview-position-row">
                        <span className="groupview-position-label">Joining as</span>
                        <span className="groupview-position-value">{backendUser.fullName}</span>
                      </div>
                      <div className="groupview-position-row">
                        <span className="groupview-position-label">Stake Required</span>
                        <span className="groupview-position-value">{formatDualCurrency(stakeETH)}</span>
                      </div>
                    </div>
                    <button
                      className="groupview-contribute-btn"
                      onClick={handleJoin}
                      disabled={joining}
                    >
                      {joining ? "Processing..." : "Confirm & Join"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Trust Score Card */}
            {isMember && (
              <div className="groupview-trust-card">
                <div className="groupview-trust-header">
                  <div className="groupview-trust-icon">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <span className="groupview-trust-label">Trust Score</span>
                </div>
                <p className="groupview-trust-score">
                  {memberDetails.find(m => m.address.toLowerCase() === account?.toLowerCase())?.reputation || 0}
                </p>
                <p className="groupview-trust-text">Excellent community standing</p>
              </div>
            )}

            {/* The Modern Custodian Card */}
            <div className="groupview-custodian-card">
              <p className="groupview-custodian-title">The Modern Custodian</p>
              <p className="groupview-custodian-text">
                Your contributions are secured via decentralized smart contracts, ensuring peer-to-peer transparency.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Status */}
        {txStatus && (
          <div className={`groupview-tx-banner groupview-tx-${txStatus}`}>
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

        {/* Payout History - Collapsible Section */}
        {(isMember || isLeader) && payoutHistory.length > 0 && (
          <details className="groupview-history-details">
            <summary className="groupview-history-summary">
              📋 Payout History ({payoutHistory.length} completed rounds)
            </summary>
            <div className="groupview-history-content">
              <div className="groupview-history-table">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>Round</th>
                      <th>Beneficiary</th>
                      <th>Amount Paid</th>
                      <th>Completed On</th>
                      <th style={{ textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutHistory.map((payout, idx) => {
                      const isUserBeneficiary = account && payout.beneficiary.toLowerCase() === account.toLowerCase();
                      return (
                        <tr key={idx} className={isUserBeneficiary ? "groupview-history-row-highlight" : ""}>
                          <td>Cycle {payout.cycle}</td>
                          <td style={{ fontFamily: "monospace", fontSize: "13px" }}>
                            {payout.beneficiary.slice(0, 6)}...{payout.beneficiary.slice(-4)}
                            {isUserBeneficiary && (
                              <span style={{ marginLeft: "8px", color: "#10B981", fontWeight: "600" }}>
                                (You!)
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight: "600" }}>
                            {formatDualCurrency(ethers.utils.formatEther(payout.amount))}
                          </td>
                          <td>
                            {payout.deadline.toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="groupview-badge-paid">✓ Paid</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        )}

        {/* Contract Transparency */}
        <details className="groupview-contract-details">
          <summary className="groupview-contract-summary">
            📋 Contract Transparency
          </summary>
          <div className="groupview-contract-content">
            <div className="groupview-contract-row">
              <span>Contract Address</span>
              <code>{groupAddress}</code>
            </div>
            <div className="groupview-contract-row">
              <span>Group Type</span>
              <code>{groupData?.type || "—"}</code>
            </div>
            <div className="groupview-contract-row">
              <span>Contribution Amount</span>
              <code>{formatDualCurrency(contribETH)}</code>
            </div>
            <div className="groupview-contract-row">
              <span>Stake Amount</span>
              <code>{formatDualCurrency(stakeETH)}</code>
            </div>
            <div className="groupview-contract-row">
              <span>Penalty Amount</span>
              <code>{formatDualCurrency(ethers.utils.formatEther(groupData?.penaltyAmount || "0"))}</code>
            </div>
            <div className="groupview-contract-row">
              <span>Grace Period</span>
              <code>{groupData?.gracePeriod || "—"} days</code>
            </div>
            <div className="groupview-contract-row">
              <span>Ejection Threshold</span>
              <code>{groupData?.ejectionThreshold || "—"} defaults</code>
            </div>
          </div>
        </details>
      </main>

      {/* Flag Defaulter Modal */}
      {showFlagModal && (
        <div className="groupview-modal-overlay">
          <div className="groupview-modal">
            <h3 className="groupview-modal-title">Flag Defaulter</h3>
            
            <div className="groupview-modal-field">
              <label className="groupview-modal-label">Select Member</label>
              <select
                value={selectedDefaulter}
                onChange={(e) => setSelectedDefaulter(e.target.value)}
                className="groupview-modal-select"
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
            
            <div className="groupview-modal-field">
              <label className="groupview-modal-label">Complaint Details</label>
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Describe the reason for flagging this member..."
                rows={5}
                className="groupview-modal-textarea"
              />
            </div>
            
            {txMessage && (
              <div className={`groupview-modal-message ${txStatus === "error" ? "groupview-modal-error" : "groupview-modal-success"}`}>
                {txMessage}
              </div>
            )}
            
            <div className="groupview-modal-actions">
              <button
                onClick={handleFlagDefault}
                disabled={flagging || !selectedDefaulter || !complaintText.trim()}
                className="groupview-modal-btn groupview-modal-btn-danger"
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
                className="groupview-modal-btn groupview-modal-btn-cancel"
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
