import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { GROUP_ABI } from "../contracts/config";
import { toast } from "react-toastify";
import "./GroupView.css";

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
    <div className="gvPage">
      <div className="gvCenter">
        <div className="gvLoading">Loading circle…</div>
      </div>
    </div>
  );

  if (!group) return (
    <div className="gvPage">
      <div className="gvCenter">
        <div className="gvEmptyCard">
          <div className="gvEmptyTitle">Circle not found</div>
          <button className="gvBtn gvBtnPrimary" onClick={() => onNavigate("dashboard")}>
            ← Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );

  const walletShort = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "—";
  const leaderShort = group.leader ? `${group.leader.slice(0, 6)}...${group.leader.slice(-4)}` : "—";
  const badgeTone = group.status === "Active" ? "active" : group.status === "Open" ? "open" : "completed";

  const contributedCount = (() => {
    if (!group.cycleInfo) return null;
    const total = Number.parseFloat(group.cycleInfo.totalCollected);
    const each = Number.parseFloat(group.contribution);
    if (!Number.isFinite(total) || !Number.isFinite(each) || each <= 0) return null;
    return Math.max(0, Math.min(group.memberCount, Math.floor(total / each)));
  })();

  const progressPct = contributedCount == null || group.memberCount === 0
    ? 0
    : Math.round((contributedCount / group.memberCount) * 100);

  return (
    <div className="gvPage">
      <header className="gvNav">
        <div className="gvNavInner">
          <div className="gvNavLeft">
            <button className="gvBack" type="button" onClick={() => onNavigate("dashboard")}>
              ← Back to dashboard
            </button>
            <button className="gvBrand" type="button" onClick={() => onNavigate("landingV2")}>
              <span className="gvLogo" aria-hidden="true">
                <span className="gvDiamond gvDiamondA" />
                <span className="gvDiamond gvDiamondB" />
              </span>
              <span className="gvBrandName">ChainBa</span>
            </button>
          </div>
          <div className="gvNavRight">
            <div className="gvWallet" title={account || ""}>{walletShort}</div>
            <button className="gvBtn gvBtnOutline" type="button" onClick={() => onNavigate("profile")}>
              Profile
            </button>
          </div>
        </div>
      </header>

      <main className="gvMain">
        <section className="gvCard gvHero">
          <div className="gvHeroTop">
            <div>
              <h1 className="gvTitle">{group.name}</h1>
              <div className="gvSubRow">
                <span className={`gvBadge gvBadge-${badgeTone}`}>{group.status}</span>
                <span className="gvSubText">Leader: <span className="gvMono">{leaderShort}</span></span>
                <span className="gvSubText">Address: <span className="gvMono">{groupAddress.slice(0, 8)}…{groupAddress.slice(-6)}</span></span>
              </div>
            </div>
          </div>

          <div className="gvHeroStats">
            {[
              ["Contribution", `${group.contribution} ETH`],
              ["Member limit", `${group.memberCount}/${group.limit}`],
              ["Cycle duration", "—"],
              ["Current cycle", `${group.currentCycle + 1}`]
            ].map(([k, v]) => (
              <div key={k} className="gvStat">
                <div className="gvStatLabel">{k}</div>
                <div className="gvStatValue">{v}</div>
              </div>
            ))}
          </div>
        </section>

        {group.status === "Active" && group.cycleInfo && (
          <section className="gvCard">
            <div className="gvSectionTop">
              <h2 className="gvSectionTitle">Round progress</h2>
              <div className="gvSectionMeta">
                Deadline: <span className="gvMono">{group.cycleInfo.deadline}</span>
              </div>
            </div>

            <div className="gvProgressBar" aria-hidden="true">
              <div className="gvProgressFill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="gvProgressText">
              {contributedCount == null
                ? "Contribution progress unavailable"
                : `${contributedCount} of ${group.memberCount} members contributed this round`}
            </div>

            <div className="gvPayout">
              <div className="gvPayoutLabel">Payout recipient</div>
              <div className="gvPayoutValue">
                <span className="gvMono">
                  {group.cycleInfo.beneficiary.slice(0, 8)}…{group.cycleInfo.beneficiary.slice(-6)}
                </span>
                {group.cycleInfo.beneficiary.toLowerCase() === account.toLowerCase() && (
                  <span className="gvPayoutYou">You</span>
                )}
              </div>
              <div className="gvPayoutSub">
                Collected: <span className="gvMono gvEmerald">{group.cycleInfo.totalCollected} ETH</span>
              </div>
            </div>

            {group.isMember && !group.isEjected && (
              <div className="gvContribute">
                <div className="gvContributeRow">
                  <div className="gvContributeLabel">Your status</div>
                  <div className={`gvStatus gvStatus-${group.memberStatus.toLowerCase()}`}>{group.memberStatus}</div>
                </div>

                {(group.memberStatus === "Pending" || group.memberStatus === "Late") && (
                  <button className="gvBtn gvBtnPrimary gvBtnFull" onClick={payContribution} disabled={paying}>
                    {paying ? "Confirming transaction..." : `Pay contribution (${group.contribution} ETH)`}
                  </button>
                )}

                {group.memberStatus === "Paid" && (
                  <div className="gvSuccess">✓ Contribution confirmed</div>
                )}
              </div>
            )}
          </section>
        )}

        <section className="gvCard gvMembers">
          <div className="gvSectionTop">
            <h2 className="gvSectionTitle">Members</h2>
            <div className="gvSectionMeta">{group.memberCount} total</div>
          </div>

          <div className="gvMemberRow">
            <div className="gvAvatar" aria-hidden="true">LD</div>
            <div className="gvMemberMain">
              <div className="gvMemberAddr gvMono">{leaderShort}</div>
              <div className="gvMemberSub">Leader</div>
            </div>
            <div className="gvMemberRight">
              <span className="gvMiniBadge">Rep —</span>
            </div>
          </div>

          <div className="gvDivider" />

          <div className="gvMemberRow">
            <div className="gvAvatar" aria-hidden="true">YO</div>
            <div className="gvMemberMain">
              <div className="gvMemberAddr gvMono">{walletShort}</div>
              <div className="gvMemberSub">You</div>
            </div>
            <div className="gvMemberRight">
              <span className={`gvPayState gvPayState-${group.memberStatus.toLowerCase()}`}>
                {group.memberStatus === "Paid" ? "✓" : group.memberStatus === "Pending" ? "⏳" : "⏳"} {group.memberStatus}
              </span>
              <span className="gvMiniBadge">Rep —</span>
            </div>
          </div>
        </section>

        {group.status === "Open" && !group.isMember && (
          <section className="gvCard gvJoin">
            <div className="gvSectionTop">
              <h2 className="gvSectionTitle">Join this circle</h2>
              <div className="gvSectionMeta">
                Stake required: <span className="gvMono">{group.stake} ETH</span>
              </div>
            </div>

            {[
              ["Full Name", "name", "Your full name"],
              ["National ID (NRC)", "nationalId", "e.g. 123456/78/9"],
              ["Phone Number", "phone", "e.g. 0971234567"]
            ].map(([label, key, ph]) => (
              <div key={key} className="gvField">
                <label className="gvLabel">{label}</label>
                <input
                  className="gvInput"
                  placeholder={ph}
                  value={joinForm[key]}
                  onChange={e => setJoinForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}

            <button className="gvBtn gvBtnPrimary gvBtnFull" onClick={joinGroup} disabled={joining}>
              {joining ? "Joining..." : `Join & pay ${group.stake} ETH stake`}
            </button>
            <div className="gvHint">
              Your identity is hashed with keccak256 before storing on-chain.
            </div>
          </section>
        )}

        <section className="gvCard">
          <div className="gvSectionTop">
            <h2 className="gvSectionTitle">Share</h2>
            <div className="gvSectionMeta">Invite members with the circle address</div>
          </div>

          <div className="gvShareBox gvMono">{groupAddress}</div>
          <button
            className="gvBtn gvBtnOutline"
            onClick={() => {
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
              } catch (e) {
                toast.info("Copy manually: " + groupAddress);
              }
            }}
          >
            Copy address
          </button>
        </section>
      </main>
    </div>
  );
}
