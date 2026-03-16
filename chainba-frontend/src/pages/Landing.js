export default function Landing({ account, onConnect, onRegister, onLogin, onNavigate }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e3a6e 100%)" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #1e3a6e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "32px" }}>🪙</span>
          <div>
            <h1 style={{ color: "#f59e0b", margin: 0, fontSize: "22px", fontWeight: "bold" }}>ChainBa</h1>
            <p style={{ color: "#475569", margin: 0, fontSize: "11px" }}>Decentralised Savings Platform</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => onNavigate && onNavigate("admin")}
            style={{ background: "transparent", border: "1px solid #334155", color: "#64748b", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontSize: "13px" }}>
            🛡️ Admin
          </button>
          <button onClick={onLogin}
            style={{ background: "transparent", border: "1px solid #f59e0b", color: "#f59e0b", borderRadius: "8px", padding: "8px 20px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>
            Login
          </button>
          <button onClick={onRegister}
            style={{ background: "#f59e0b", border: "none", color: "#0f172a", borderRadius: "8px", padding: "8px 20px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>
            Register
          </button>
        </div>
      </nav>

      <div style={{ textAlign: "center", padding: "80px 20px 60px" }}>
        <h2 style={{ color: "#f1f5f9", fontSize: "52px", fontWeight: "bold", margin: "0 0 20px", lineHeight: 1.2 }}>Secure Your Chilimba</h2>
        <p style={{ color: "#94a3b8", fontSize: "18px", maxWidth: "560px", margin: "0 auto 48px", lineHeight: 1.7 }}>
          Your money is held by code, not by people. Contributions, penalties and payouts are 100% automated by Ethereum smart contracts.
        </p>

        {account ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ background: "#1e293b", border: "2px solid #22c55e", borderRadius: "12px", padding: "16px 32px" }}>
              <p style={{ color: "#22c55e", margin: "0 0 4px", fontWeight: "bold" }}>✅ Wallet Connected</p>
              <p style={{ color: "#94a3b8", margin: 0, fontSize: "13px" }}>{account.slice(0,12)}...{account.slice(-6)}</p>
            </div>
            <button onClick={() => onNavigate && onNavigate("dashboard")}
              style={{ background: "#f59e0b", border: "none", color: "#0f172a", borderRadius: "12px", padding: "16px 48px", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}>
              Open Dashboard →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onRegister}
              style={{ background: "#f59e0b", border: "none", color: "#0f172a", borderRadius: "12px", padding: "16px 40px", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}>
              🚀 Get Started
            </button>
            <button onClick={onConnect}
              style={{ background: "transparent", border: "2px solid #f59e0b", color: "#f59e0b", borderRadius: "12px", padding: "16px 40px", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}>
              🦊 Connect MetaMask
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", padding: "0 40px 80px", maxWidth: "1100px", margin: "0 auto" }}>
        {[
          { icon: "🔒", title: "Tamper-Proof", desc: "All records permanently stored on blockchain — nobody can alter history" },
          { icon: "⚡", title: "Automated", desc: "Smart contracts handle collections, penalties and payouts automatically" },
          { icon: "⭐", title: "Reputation", desc: "Every member builds a permanent on-chain payment history score" },
          { icon: "🔍", title: "Transparent", desc: "Every member sees who paid and who defaulted in real time" }
        ].map(f => (
          <div key={f.title} style={{ background: "#1e293b", borderRadius: "12px", padding: "28px", textAlign: "center", border: "1px solid #334155" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>{f.icon}</div>
            <h3 style={{ color: "#f59e0b", margin: "0 0 8px", fontSize: "16px" }}>{f.title}</h3>
            <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px", lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "20px", borderTop: "1px solid #1e293b" }}>
        <p style={{ color: "#334155", fontSize: "12px", margin: 0 }}>© 2026 ChainBa — Chain Keepers. All rights reserved.</p>
      </div>
    </div>
  );
}