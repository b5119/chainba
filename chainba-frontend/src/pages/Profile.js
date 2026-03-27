import { useState, useEffect } from "react";
import { ethers } from "ethers";
import BASE_URL from "../api";
import "./Profile.css";

function LogoMark() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:3 }}>
      <div style={{ width:13, height:13, background:"#10B981", borderRadius:3, transform:"rotate(45deg)", flexShrink:0 }} />
      <div style={{ width:8, height:8, background:"#6366F1", borderRadius:2, transform:"rotate(45deg)", marginLeft:-3, marginTop:5, flexShrink:0 }} />
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"13px 0", borderBottom:"1px solid #F1F5F9", gap:16 }}>
      <span style={{ fontSize:13, color:"#64748B", flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:500, color:"#0F172A", fontFamily: mono ? "'DM Mono',monospace" : "inherit", textAlign:"right", wordBreak:"break-all" }}>
        {value || "—"}
      </span>
    </div>
  );
}

export default function Profile({ account, backendUser, onNavigate, onLogout }) {
  const [profile,  setProfile]  = useState(null);
  const [balance,  setBalance]  = useState(null);
  const [repScore, setRepScore] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch backend profile
        const token = localStorage.getItem("chainba_token");
        if (token) {
          const res = await fetch(BASE_URL + "/api/profile/me", {
            headers: { Authorization: "Bearer " + token }
          });
          if (res.ok) setProfile(await res.json());
        }

        // Fetch live ETH balance from MetaMask
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accs = await window.ethereum.request({ method:"eth_accounts" });
          const addr = accs[0] || account;
          if (addr) {
            const bal = await provider.getBalance(addr);
            setBalance(parseFloat(ethers.utils.formatEther(bal)).toFixed(4));
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [account]);

  const displayName    = profile?.fullName    || backendUser?.fullName    || "User";
  const displayPhone   = profile?.phone       || backendUser?.phone       || "—";
  const displayAddress = account || "—";
  const identityHash   = profile?.identityHash || backendUser?.identityHash;
  const initials       = displayName.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

  const copyAddress = () => {
    if (displayAddress !== "—") {
      navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="pf-page">

      {/* Navbar */}
      <nav className="pf-nav">
        <div style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer" }} onClick={() => onNavigate("landingV2")}>
          <LogoMark />
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#0F172A", marginLeft:6 }}>ChainBa</span>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button className="pf-btn-ghost" onClick={() => onNavigate("dashboard")}>← Dashboard</button>
          <button className="pf-btn-danger" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <main className="pf-main">
        {loading ? (
          <div className="pf-loading">
            <div className="pf-spinner" />
            <p>Loading profile...</p>
          </div>
        ) : (
          <div className="pf-grid">

            {/* Left — identity card */}
            <div>
              {/* Avatar card */}
              <div className="pf-card" style={{ textAlign:"center", marginBottom:"1.25rem" }}>
                <div className="pf-avatar">{initials}</div>
                <h1 className="pf-name">{displayName}</h1>
                <p className="pf-phone">{displayPhone}</p>

                {/* Trust score pill */}
                <div className="pf-score-wrap">
                  <div className="pf-score-pill">
                    <span className="pf-score-num">{repScore ?? 100}</span>
                    <span className="pf-score-label">/ 100 Trust score</span>
                  </div>
                </div>

                {/* Wallet address */}
                <div className="pf-address-box" onClick={copyAddress} title="Click to copy">
                  <span className="pf-address-text">
                    {displayAddress !== "—"
                      ? `${displayAddress.slice(0,8)}...${displayAddress.slice(-6)}`
                      : "No wallet connected"}
                  </span>
                  <span className="pf-copy-hint">{copied ? "✓ Copied" : "Copy"}</span>
                </div>
              </div>

              {/* ETH Balance card */}
              <div className="pf-card pf-balance-card">
                <div className="pf-balance-label">ETH Balance</div>
                <div className="pf-balance-value">
                  {balance ?? "—"}
                  <span className="pf-balance-unit">ETH</span>
                </div>
                <div className="pf-balance-network">Hardhat Local Network</div>
              </div>
            </div>

            {/* Right — details */}
            <div>
              {/* Account info */}
              <div className="pf-card" style={{ marginBottom:"1.25rem" }}>
                <h2 className="pf-section-heading">Account details</h2>
                <InfoRow label="Full name"    value={displayName} />
                <InfoRow label="Phone"        value={displayPhone} mono />
                <InfoRow label="Wallet"       value={displayAddress !== "—" ? `${displayAddress.slice(0,10)}...${displayAddress.slice(-8)}` : "—"} mono />
                <InfoRow label="Role"         value={displayPhone === "0000000000" ? "Administrator" : "Member"} />
                <InfoRow label="Network"      value="Hardhat Local (Chain ID 31337)" />
              </div>

              {/* Identity verification */}
              <div className="pf-card" style={{ marginBottom:"1.25rem" }}>
                <h2 className="pf-section-heading">Identity verification</h2>
                <div className="pf-hash-box">
                  <div className="pf-hash-label">keccak256 identity hash</div>
                  <div className="pf-hash-value">
                    {identityHash
                      ? `${identityHash.slice(0,24)}...${identityHash.slice(-8)}`
                      : "Not available"}
                  </div>
                </div>
                <p className="pf-hash-note">
                  Your NRC and phone number are hashed on-chain. No raw personal data is stored on the blockchain — only a cryptographic proof of your identity.
                </p>
              </div>

              {/* Actions */}
              <div className="pf-card">
                <h2 className="pf-section-heading">Actions</h2>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <button className="pf-action-btn" onClick={() => onNavigate("dashboard")}>
                    View my circles →
                  </button>
                  <button className="pf-action-btn-danger" onClick={onLogout}>
                    Sign out
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
