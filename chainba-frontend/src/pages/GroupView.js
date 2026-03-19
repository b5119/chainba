import { useState, useEffect } from "react";
import { ethers } from "ethers";

import { GROUP_ABI } from "../contracts/config";
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
function MemberRow({ address, account, hasPaid, index }) {
  const isYou = account && address.toLowerCase() === account.toLowerCase();
  const initials = address ? address.slice(2,4).toUpperCase() : "??";
  const truncated = address
    ? `${address.slice(0,6)}...${address.slice(-4)}`
    : "Unknown";

  return (
    <div className="gv-member-row">
      <div className="gv-avatar">{initials}</div>
      <span className="gv-member-address">
        {truncated}
        {isYou && <span className="gv-member-you">you</span>}
      </span>
      <span className={`gv-paid-badge ${hasPaid ? "gv-paid-yes" : "gv-paid-no"}`}>
        {hasPaid ? "✓ Paid" : "⏳ Pending"}
      </span>
    </div>
  );
}

// ─── Main GroupView ───────────────────────────────────────────────────────
export default function GroupView({ account, groupAddress, onNavigate }) {
  const [groupData,    setGroupData]    = useState(null);
  const [members,      setMembers]      = useState([]);
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

      const [
        name, status, contribAmount, stakeAmt,
        limit, cycleDays, cycle, leader,
      ] = await Promise.all([
        contract.groupName(),
        contract.status(),
        contract.contributionAmount(),
        contract.stakeAmount(),
        contract.memberLimit(),
        contract.cycleDurationDays(),
        contract.currentCycle(),
        contract.leader ? contract.leader() : Promise.resolve(null),
      ]);

      setGroupData({
        name,
        status: Number(status),
        contributionAmount: contribAmount,
        stakeAmount: stakeAmt,
        memberLimit: Number(limit),
        cycleDurationDays: Number(cycleDays),
      });
      setCurrentCycle(Number(cycle));

      if (leader && account) {
        setIsLeader(leader.toLowerCase() === account.toLowerCase());
      }

      // Member count
      const count = await contract.getMemberCount();
      setMemberCount(Number(count));

      // Member list — iterate up to memberLimit
      const memberList = [];
      const paid = [];
      let userIsMember = false;

      for (let i = 0; i < Number(limit); i++) {
        try {
          const addr = await contract.memberList(i);
          if (!addr || addr === ethers.constants.AddressZero) break;
          memberList.push(addr);
          const hasPaid = await contract.hasPaid(addr, Number(cycle));
          paid.push(hasPaid);
          if (account && addr.toLowerCase() === account.toLowerCase()) {
            userIsMember = true;
          }
        } catch {
          break;
        }
      }

      setMembers(memberList);
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
    } catch (err) {
      console.error(err);
      setError("Failed to load group. Make sure Hardhat node is running.");
    } finally {
      setLoading(false);
    }
  }

  // ── Pay contribution ─────────────────────────────────────────────────────
  async function handleContribute() {
    setContributing(true);
    setTxStatus("pending");
    setTxMessage("Waiting for wallet approval...");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(groupAddress, GROUP_ABI, signer);

      const tx = await contract.payContribution({
        value: groupData.contributionAmount,
      });
      setTxMessage("Transaction submitted — confirming...");
      await tx.wait(1);

      setTxStatus("confirmed");
      setTxMessage("✓ Contribution confirmed!");
      await loadGroup();
    } catch (err) {
      setTxStatus("error");
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setTxMessage("Transaction rejected.");
      } else if (err.reason) {
        setTxMessage(`Contract error: ${err.reason}`);
      } else {
        setTxMessage("Transaction failed. Please try again.");
      }
    } finally {
      setContributing(false);
    }
  }

  // ── Flag default ─────────────────────────────────────────────────────────
  async function handleFlagDefault() {
    const target = window.prompt("Enter member address to flag:");
    if (!target) return;
    setFlagging(true);
    setTxStatus("pending");
    setTxMessage("Flagging default on-chain...");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(groupAddress, GROUP_ABI, signer);
      const tx = await contract.flagDefault(target);
      await tx.wait(1);
      setTxStatus("confirmed");
      setTxMessage("✓ Default flagged on-chain.");
      await loadGroup();
    } catch (err) {
      setTxStatus("error");
      setTxMessage(err.reason || "Failed to flag default.");
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
              </p>
            </div>
            <StatusBadge status={groupData?.status} />
          </div>

          {/* Stats row */}
          <div className="gv-stats-row">
            <div className="gv-stat">
              <div className="gv-stat-label">Contribution</div>
              <div className="gv-stat-value">{contribETH} ETH</div>
            </div>
            <div className="gv-stat">
              <div className="gv-stat-label">Members</div>
              <div className="gv-stat-value">{memberCount} / {groupData?.memberLimit}</div>
            </div>
            <div className="gv-stat">
              <div className="gv-stat-label">Cycle days</div>
              <div className="gv-stat-value">{groupData?.cycleDurationDays}d</div>
            </div>
            <div className="gv-stat">
              <div className="gv-stat-label">Current round</div>
              <div className="gv-stat-value">{currentCycle}</div>
            </div>
          </div>
        </div>

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
              members.map((addr, i) => (
                <MemberRow
                  key={addr}
                  address={addr}
                  account={account}
                  hasPaid={paidStatus[i]}
                  index={i}
                />
              ))
            )}
          </div>
        </div>

        {/* TX status */}
        {txStatus && (
          <div className={`gv-tx-banner gv-tx-${txStatus}`}>
            {txMessage}
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
              onClick={handleFlagDefault}
              disabled={flagging}
            >
              {flagging ? "Flagging..." : "Flag default"}
            </button>
          )}
        </div>

      </main>
    </div>
  );
}