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

  // eslint-disable-next-line no-unused-vars
        const statusColor = (s) =>
    s === "Active" ? "#4ade80" : s === "Open" ? "#f59e0b" : "#64748b";

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

  return (
    <div className="dashPage">
      <header className="dashNav">
        <div className="dashNavInner">
          <button className="dashBrand" type="button" onClick={() => onNavigate("landingV2")}>
            <span className="dashLogo" aria-hidden="true">
              <span className="dashDiamond dashDiamondA" />
              <span className="dashDiamond dashDiamondB" />
            </span>
            <span className="dashBrandName">ChainBa</span>
          </button>

          <div className="dashNavRight">
            <div className="dashWallet" title={account || ""}>
              {walletShort}
            </div>
            {canSeeAdmin && (
              <button className="dashNavLink" type="button" onClick={() => onNavigate("admin")}>
                Admin panel
              </button>
            )}
            <button className="dashBtn dashBtnGhost" type="button" onClick={() => onNavigate("profile")}>
              Profile
            </button>
            <button
              className="dashBtn dashBtnOutline"
              type="button"
              onClick={() => (onLogout ? onLogout() : onNavigate("landingV2"))}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashMain">
        <section className="dashStats" aria-label="Account stats">
          <div className="dashStatCard">
            <div className="dashStatLabel">ETH Balance</div>
            <div className="dashStatValue dashStatValueMono dashStatValueEmerald">{balance} ETH</div>
          </div>

          <div className="dashStatCard">
            <div className="dashStatLabel">Reputation Score</div>
            <div className={`dashStatValue dashStatValueMono dashRep ${repTone}`}>
              {reputation?.score ?? "—"}
              <span className="dashRepOutOf">/ 100</span>
            </div>
          </div>

          <div className="dashStatCard">
            <div className="dashStatLabel">Active Circles</div>
            <div className="dashStatValue dashStatValueMono">{activeCircles}</div>
          </div>

          <div className="dashStatCard">
            <div className="dashStatLabel">Total Contributed</div>
            <div className="dashStatValue dashStatValueMono">{totalContributed} ETH</div>
          </div>
        </section>

        {/* Payouts Received */}
        {payoutsReceived.length > 0 && (
          <section className="dashPayouts" style={{ marginBottom: "32px" }}>
            <div className="dashSectionHeader">
              <h2 className="dashSectionTitle">💰 Payouts Received</h2>
            </div>
            <div style={{ 
              background: "white", 
              borderRadius: "12px", 
              border: "1px solid #E5E7EB",
              overflow: "hidden"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#F9FAFB" }}>
                  <tr>
                    <th style={{ 
                      padding: "12px 16px", 
                      textAlign: "left", 
                      fontSize: "12px", 
                      fontWeight: "600", 
                      color: "#6B7280",
                      borderBottom: "1px solid #E5E7EB"
                    }}>
                      Circle Name
                    </th>
                    <th style={{ 
                      padding: "12px 16px", 
                      textAlign: "left", 
                      fontSize: "12px", 
                      fontWeight: "600", 
                      color: "#6B7280",
                      borderBottom: "1px solid #E5E7EB"
                    }}>
                      Round
                    </th>
                    <th style={{ 
                      padding: "12px 16px", 
                      textAlign: "left", 
                      fontSize: "12px", 
                      fontWeight: "600", 
                      color: "#6B7280",
                      borderBottom: "1px solid #E5E7EB"
                    }}>
                      Amount
                    </th>
                    <th style={{ 
                      padding: "12px 16px", 
                      textAlign: "left", 
                      fontSize: "12px", 
                      fontWeight: "600", 
                      color: "#6B7280",
                      borderBottom: "1px solid #E5E7EB"
                    }}>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payoutsReceived.map((payout, idx) => (
                    <tr key={idx} style={{ 
                      borderBottom: idx < payoutsReceived.length - 1 ? "1px solid #E5E7EB" : "none",
                      background: "white"
                    }}>
                      <td style={{ padding: "12px 16px", fontSize: "14px", color: "#0F172A", fontWeight: "600" }}>
                        {payout.groupName}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "14px", color: "#64748B" }}>
                        Cycle {payout.cycle}
                      </td>
                      <td style={{ 
                        padding: "12px 16px", 
                        fontSize: "14px", 
                        color: "#10B981", 
                        fontWeight: "700",
                        fontFamily: "monospace"
                      }}>
                        {formatShortDualCurrency(payout.amount)}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748B" }}>
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

        <section className="dashCircles">
          <div className="dashSectionHeader">
            <h2 className="dashSectionTitle">Your circles</h2>
            <div className="dashSectionActions">
              <div className="dashQuickJoin" aria-label="View circle by address">
                <input
                  className="dashQuickJoinInput"
                  value={joinAddress}
                  onChange={(e) => setJoinAddress(e.target.value)}
                  placeholder="Paste circle address (0x...)"
                />
                <button
                  className="dashBtn dashBtnOutline"
                  type="button"
                  onClick={() => joinAddress && onNavigate("group", joinAddress)}
                >
                  View
                </button>
              </div>
              <button className="dashBtn dashBtnPrimary" type="button" onClick={() => onNavigate("create")}>
                Create circle
              </button>
            </div>
          </div>

          {loading ? (
            <div className="dashLoading">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="dashEmpty">
              <div className="dashEmptyArt" aria-hidden="true" />
              <div className="dashEmptyTitle">No circles yet</div>
              <div className="dashEmptySub">
                Create a circle to start community savings on-chain.
              </div>
              <button className="dashBtn dashBtnPrimary dashBtnLarge" type="button" onClick={() => onNavigate("create")}>
                Create your first circle
              </button>
            </div>
          ) : (
            <div className="dashGrid">
              {groups.map((g) => (
                <div key={g.address} className="dashCircleCard">
                  <div className="dashCircleTop">
                    <div className="dashCircleName">{g.name}</div>
                    <span className={`dashBadge dashBadge-${g.status.toLowerCase()}`}>
                      {g.status}
                    </span>
                  </div>

                  <div className="dashCircleMeta">
                    <div className="dashMetaItem">
                      <div className="dashMetaLabel">Members</div>
                      <div className="dashMetaValue">{g.memberCount}/{g.limit}</div>
                    </div>
                    <div className="dashMetaItem">
                       <div className="dashMetaLabel">Contribution</div>
                       <div className="dashMetaValue">{formatShortDualCurrency(g.contribution)} / cycle</div>
                     </div>
                  </div>

                  <div className="dashCircleActions">
                     <button
                       className="dashBtn dashBtnOutline dashBtnEmerald"
                       type="button"
                       onClick={() => onNavigate("group", g.address)}
                     >
                       View circle
                     </button>
                     <button
                       className="dashBtn dashBtnGhost"
                       type="button"
                       title="Copy circle address"
                       onClick={(e) => {
                         e.stopPropagation();
                         handleCopyAddress(g.address);
                       }}
                     >
                       {copiedAddress === g.address ? "✓ Copied" : "Copy address"}
                     </button>
                     {g.isLeader && <span className="dashLeader">Leader</span>}
                   </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
