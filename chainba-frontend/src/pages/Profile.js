import { useState, useEffect } from "react";
import BASE_URL from "../api";

export default function Profile({ account, backendUser, onNavigate, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("chainba_token");
        if (!token) { setLoading(false); return; }
        const res = await fetch(BASE_URL + "/api/profile/me", {
          headers: { Authorization: "Bearer " + token }
        });
        if (res.ok) setProfile(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const displayName = profile?.fullName || backendUser?.fullName || "User";
  const displayPhone = profile?.phone || backendUser?.phone || "N/A";
  const displayAddress = account || "N/A";

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "#1e293b", borderBottom: "1px solid #334155" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🪙</span>
          <span style={{ color: "#f59e0b", fontWeight: "bold", fontSize: "18px" }}>ChainBa</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => onNavigate("dashboard")}
            style={{ background: "transparent", border: "1px solid #334155", color: "#94a3b8", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "14px" }}>
            ← Dashboard
          </button>
          <button onClick={onLogout}
            style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "14px" }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 20px" }}>
        {loading ? (
          <div style={{ textAlign: "center", paddingTop: "80px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
            <p style={{ color: "#64748b" }}>Loading profile...</p>
          </div>
        ) : (
          <>
            <div style={{ background: "#1e293b", borderRadius: "16px", padding: "32px", marginBottom: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>👤</div>
              <h2 style={{ color: "#f1f5f9", margin: "0 0 8px", fontSize: "24px" }}>{displayName}</h2>
              <p style={{ color: "#64748b", margin: "0 0 8px", fontSize: "14px" }}>📞 {displayPhone}</p>
              <p style={{ color: "#475569", margin: 0, fontSize: "11px", wordBreak: "break-all" }}>🔗 {displayAddress}</p>
            </div>

            <div style={{ background: "#1e293b", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
              <h3 style={{ color: "#f59e0b", margin: "0 0 16px", fontSize: "16px" }}>💰 Wallet Balance</h3>
              <div style={{ background: "#0f172a", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                <p style={{ color: "#f59e0b", fontSize: "28px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {profile?.ethBalance ? parseFloat(profile.ethBalance).toFixed(4) : "—"} ETH
                </p>
                <p style={{ color: "#475569", fontSize: "12px", margin: 0 }}>Hardhat Local Network</p>
              </div>
            </div>

            <div style={{ background: "#1e293b", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
              <h3 style={{ color: "#f59e0b", margin: "0 0 16px", fontSize: "16px" }}>🔐 Identity Verification</h3>
              <div style={{ background: "#0f172a", borderRadius: "8px", padding: "12px" }}>
                <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 6px" }}>SHA-256 Identity Hash</p>
                <p style={{ color: "#475569", fontSize: "11px", margin: 0, wordBreak: "break-all" }}>
                  {profile?.identityHash || backendUser?.identityHash || "Not available"}
                </p>
              </div>
              <p style={{ color: "#475569", fontSize: "12px", margin: "12px 0 0", lineHeight: 1.5 }}>
                🔒 Your identity is cryptographically hashed. No raw personal data is stored on the blockchain.
              </p>
            </div>

            <button onClick={onLogout}
              style={{ width: "100%", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "8px", padding: "14px", fontSize: "15px", fontWeight: "bold", cursor: "pointer" }}>
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}