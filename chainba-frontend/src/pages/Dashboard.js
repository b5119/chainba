import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { FACTORY_ADDRESS, FACTORY_ABI, GROUP_ABI, 
         REPUTATION_ABI, REPUTATION_ADDRESS } from "../contracts/config";
import { toast } from "react-toastify";
import { formatShortDualCurrency } from "../utils/currency";
import "./Dashboard.css";

export default function Dashboard({ account, backendUser, onNavigate, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [reputation, setReputation] = useState(null);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [joinAddress, setJoinAddress] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [payoutsReceived, setPayoutsReceived] = useState([]); // {groupName, cycle, amount, date}

  useEffect(() => { 
    if (account) loadData(); 
  // eslint-disable-next-line
  }, [account]);

  const loadData = async () => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Use the account prop directly (passed from App.js)
      console.log("Loading dashboard for account:", account);
      
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
      const userPayouts = []; // Track payouts received by user
      
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
          const currentCycle = await g.currentCycle();
          
          // Check if active account is leader
          const isLeader = leader.toLowerCase() === account.toLowerCase();
          
          // Check if active account is in member list using getMembers()
          let isMember = false;
          try {
            const memberAddresses = await g.getMembers();
            isMember = memberAddresses.some(
              m => m.toLowerCase() === account.toLowerCase()
            );
          } catch (e) {
            console.log("Could not get members for", addr, e.message);
          }
          
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
            
            // Check for completed cycles where user was beneficiary
            const totalCycles = Number(currentCycle);
            for (let i = 1; i <= totalCycles; i++) {
              try {
                const cycleInfo = await g.getCycleInfo(i);
                if (cycleInfo.completed && 
                    cycleInfo.beneficiary.toLowerCase() === account.toLowerCase()) {
                  const payoutAmount = contribution.mul(memberCount);
                  userPayouts.push({
                    groupName: name,
                    cycle: i,
                    amount: ethers.utils.formatEther(payoutAmount),
                    date: new Date(Number(cycleInfo.deadline) * 1000),
                  });
                }
              } catch (e) {
                console.log(`Could not get cycle ${i} info:`, e.message);
              }
            }
          }
        } catch(e) { console.log("Group error:", e); }
      }
      setGroups(groupData);
      setPayoutsReceived(userPayouts);

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

  const walletShort = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "—";

  const repScore = reputation ? parseInt(reputation.score, 10) : null;
  const repTone =
    repScore == null ? "neutral" : repScore > 80 ? "good" : repScore >= 60 ? "warn" : "bad";

  const activeCircles = groups.filter((g) => g.status === "Active").length;
  const totalContributed = groups
    .reduce((sum, g) => sum + (Number.parseFloat(g.contribution) || 0), 0)
    .toFixed(4);

  const canSeeAdmin = backendUser?.phone === "0000000000";

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Get user's first name from backendUser or use default
  const firstName = backendUser?.fullName?.split(' ')[0] || "Member";

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="dashboard-page">
      {/* Top Navigation */}
      <header className="dashboard-nav">
        <div className="dashboard-nav-left">
          <h1 className="dashboard-brand" onClick={() => onNavigate("landingV2")}>ChainBa</h1>
          <nav className="dashboard-nav-links">
            <button className="dashboard-nav-link active" onClick={() => onNavigate("dashboard")}>Dashboard</button>
            <button className="dashboard-nav-link" onClick={() => onNavigate("explore")}>Explore</button>
            <button className="dashboard-nav-link" onClick={() => onNavigate("create")}>Create</button>
            <button className="dashboard-nav-link" onClick={() => onNavigate("profile")}>Profile</button>
            {canSeeAdmin && (
              <button className="dashboard-nav-link" onClick={() => onNavigate("admin")}>Governance</button>
            )}
          </nav>
        </div>
        <div className="dashboard-nav-right">
          <div className="dashboard-user-info">
            <span className="dashboard-wallet-address">{walletShort}</span>
            <span className="dashboard-verified-badge">Verified Member</span>
          </div>
          <button className="dashboard-wallet-btn" onClick={() => (onLogout ? onLogout() : onNavigate("landingV2"))}>
            {account ? "Disconnect" : "Connect Wallet"}
          </button>
          <div className="dashboard-avatar">
            <div className="dashboard-avatar-placeholder"></div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Hero Greeting */}
        <section className="dashboard-greeting">
          <h2 className="dashboard-greeting-title">
            {getGreeting()}, <span className="dashboard-greeting-name">{firstName}</span>.
          </h2>
          <p className="dashboard-greeting-text">
            Your digital assets are currently participating in {activeCircles} community {activeCircles === 1 ? 'cycle' : 'cycles'}. 
            {reputation && repScore > 80 ? ' Your reputation is growing steadily.' : ' Keep contributing to build your reputation.'}
          </p>
        </section>

        {/* Kente Divider */}
        <div className="kente-shimmer"></div>

        {/* Stats Grid */}
        <section className="dashboard-stats">
          {/* ETH Balance */}
          <div className="dashboard-stat-card stat-card-primary">
            <div className="stat-card-decoration"></div>
            <div className="stat-card-header">
              <span className="material-symbols-outlined stat-card-icon">account_balance_wallet</span>
              <span className="stat-card-label">ETH Balance</span>
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{balance} ETH</span>
              <span className="stat-card-subtitle">Available Balance</span>
            </div>
          </div>

          {/* Reputation Score */}
          <div className="dashboard-stat-card">
            <div className="stat-card-header">
              <span className="material-symbols-outlined stat-card-icon stat-card-icon-secondary">verified</span>
              <span className="stat-card-label">Reputation</span>
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{reputation?.score ?? "—"}</span>
              <span className={`stat-card-subtitle stat-subtitle-${repTone}`}>
                {repScore > 80 ? 'Top 5% Globally' : repScore >= 60 ? 'Growing Steady' : 'Keep Building'}
              </span>
            </div>
          </div>

          {/* Active Circles */}
          <div className="dashboard-stat-card">
            <div className="stat-card-header">
              <span className="material-symbols-outlined stat-card-icon stat-card-icon-tertiary">group</span>
              <span className="stat-card-label">Active Circles</span>
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{String(activeCircles).padStart(2, '0')}</span>
              <span className="stat-card-subtitle stat-subtitle-tertiary">
                {activeCircles > 0 ? 'Contributing Actively' : 'Join a Circle'}
              </span>
            </div>
          </div>

          {/* Total Contributed */}
          <div className="dashboard-stat-card stat-card-dark">
            <div className="stat-card-header">
              <span className="material-symbols-outlined stat-card-icon">savings</span>
              <span className="stat-card-label">Total Contributed</span>
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{formatShortDualCurrency(totalContributed)}</span>
              <span className="stat-card-subtitle stat-subtitle-emerald">Cumulative Volume</span>
            </div>
          </div>
        </section>

        {/* Payouts Received Section */}
        {payoutsReceived.length > 0 && (
          <section className="dashboard-payouts">
            <h3 className="dashboard-section-subtitle">Recent Payouts</h3>
            <div className="dashboard-payouts-table">
              <table>
                <thead>
                  <tr>
                    <th>Circle Name</th>
                    <th>Round</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutsReceived.map((payout, idx) => (
                    <tr key={idx}>
                      <td className="payout-name">{payout.groupName}</td>
                      <td className="payout-cycle">Cycle {payout.cycle}</td>
                      <td className="payout-amount">{formatShortDualCurrency(payout.amount)}</td>
                      <td className="payout-date">
                        {payout.date.toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Circles Section */}
        <section className="dashboard-circles">
          <div className="dashboard-circles-header">
            <div>
              <h3 className="dashboard-section-title">Your Circles</h3>
              <p className="dashboard-section-description">Manage your community contributions and cycle payouts.</p>
            </div>
            <button className="dashboard-create-btn" onClick={() => onNavigate("create")}>
              <span className="material-symbols-outlined">add_circle</span>
              Create Circle
            </button>
          </div>

          {/* Quick Join Input */}
          <div className="dashboard-quick-join">
            <input
              className="dashboard-quick-join-input"
              value={joinAddress}
              onChange={(e) => setJoinAddress(e.target.value)}
              placeholder="Paste circle address (0x...) to view"
            />
            <button
              className="dashboard-view-btn"
              onClick={() => joinAddress && onNavigate("group", joinAddress)}
              disabled={!joinAddress}
            >
              View
            </button>
          </div>

          {loading ? (
            <div className="dashboard-loading">Loading your circles...</div>
          ) : groups.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">
                <span className="material-symbols-outlined">potted_plant</span>
              </div>
              <h3 className="dashboard-empty-title">Ready to expand your reach?</h3>
              <p className="dashboard-empty-text">
                Join new circles to diversify your community trust and increase your reputation score.
              </p>
              <button className="dashboard-empty-btn" onClick={() => onNavigate("create")}>
                Create Your First Circle
              </button>
            </div>
          ) : (
            <div className="dashboard-circles-grid">
              {groups.map((g) => (
                <div key={g.address} className="dashboard-circle-card">
                  <div className="circle-card-image">
                    <div className="circle-card-image-placeholder"></div>
                  </div>
                  <div className="circle-card-content">
                    <div className="circle-card-header">
                      <h4 className="circle-card-title">{g.name}</h4>
                      <span className={`circle-card-badge badge-${g.status.toLowerCase()}`}>
                        {g.status}
                      </span>
                    </div>
                    <p className="circle-card-description">
                      {g.type === "Rotating" ? "Rotating savings circle" : "Fixed contribution circle"} 
                      {" "}with {g.memberCount} active {g.memberCount === 1 ? 'member' : 'members'}.
                    </p>
                    <div className="circle-card-meta">
                      <div className="circle-meta-item">
                        <span className="circle-meta-label">Members</span>
                        <div className="circle-meta-avatars">
                          {[...Array(Math.min(3, g.memberCount))].map((_, i) => (
                            <div key={i} className="circle-avatar"></div>
                          ))}
                          {g.memberCount > 3 && (
                            <div className="circle-avatar-count">+{g.memberCount - 3}</div>
                          )}
                        </div>
                      </div>
                      <div className="circle-meta-item">
                        <span className="circle-meta-label">Contribution</span>
                        <span className="circle-meta-value">{formatShortDualCurrency(g.contribution)} / Cycle</span>
                      </div>
                    </div>
                    <div className="circle-card-actions">
                      <button
                        className="circle-action-btn circle-action-primary"
                        onClick={() => onNavigate("group", g.address)}
                      >
                        View Details
                      </button>
                      <button
                        className="circle-action-btn circle-action-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAddress(g.address);
                        }}
                      >
                        {copiedAddress === g.address ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                    {g.isLeader && <div className="circle-leader-badge">Circle Leader</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Empty State / Footer Illustration */}
        {groups.length > 0 && (
          <div className="dashboard-footer-cta">
            <div className="footer-cta-icon">
              <span className="material-symbols-outlined">potted_plant</span>
            </div>
            <h3 className="footer-cta-title">Ready to expand your reach?</h3>
            <p className="footer-cta-text">
              Join new circles to diversify your community trust and increase your reputation score.
            </p>
            <button className="footer-cta-link" onClick={() => onNavigate("explore")}>
              Explore Public Circles →
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="dashboard-footer-content">
          <div className="footer-branding">
            <h5 className="footer-brand">ChainBa</h5>
            <p className="footer-copyright">© 2024 ChainBa Decentralized Finance. The Modern Custodian.</p>
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">Community Discord</a>
            <a href="#" className="footer-link">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
