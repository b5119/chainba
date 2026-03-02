export default function Landing({ account, onConnect, onNavigate }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}>

      {/* HEADER */}
      <div style={{ backgroundColor: "#1e3a6e", padding: "16px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "3px solid #f59e0b" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "26px" }}>🪙 ChainBa</h1>
          <p style={{ color: "#f59e0b", fontSize: "12px" }}>Blockchain-Powered Chilimba</p>
        </div>
        {account && (
          <button onClick={() => onNavigate("dashboard")}
            style={{ backgroundColor: "#f59e0b", color: "#0f172a",
              border: "none", padding: "10px 24px", borderRadius: "8px",
              fontWeight: "bold", fontSize: "14px" }}>
            Go to Dashboard →
          </button>
        )}
      </div>

      {/* HERO */}
      <div style={{ textAlign: "center", padding: "100px 40px",
        backgroundColor: "#1b3a6b" }}>
        <h2 style={{ fontSize: "48px", color: "#fff", marginBottom: "20px" }}>
          Secure Your Chilimba
        </h2>
        <p style={{ fontSize: "18px", color: "#94a3b8", maxWidth: "600px",
          margin: "0 auto 20px", lineHeight: "1.8" }}>
          Your money is held by code, not by people.
          Contributions, penalties and payouts are 100% automated.
        </p>
        <p style={{ color: "#64748b", marginBottom: "40px" }}>
          Built on Ethereum Blockchain — Tamper-proof and Transparent
        </p>

        {!account ? (
          <button onClick={onConnect}
            style={{ backgroundColor: "#f59e0b", color: "#0f172a",
              border: "none", padding: "18px 48px", fontSize: "18px",
              borderRadius: "10px", fontWeight: "bold" }}>
            🦊 Connect MetaMask to Get Started
          </button>
        ) : (
          <div>
            <div style={{ backgroundColor: "#0f172a", border: "2px solid #f59e0b",
              borderRadius: "12px", padding: "20px 40px", display: "inline-block",
              marginBottom: "20px" }}>
              <p style={{ color: "#4ade80", fontWeight: "bold" }}>✅ Wallet Connected</p>
              <p style={{ color: "#fff", fontSize: "18px", margin: "8px 0" }}>
                {account.slice(0, 8)}...{account.slice(-6)}
              </p>
            </div>
            <br />
            <button onClick={() => onNavigate("dashboard")}
              style={{ backgroundColor: "#f59e0b", color: "#0f172a",
                border: "none", padding: "18px 48px", fontSize: "18px",
                borderRadius: "10px", fontWeight: "bold" }}>
              Open Dashboard →
            </button>
          </div>
        )}
      </div>

      {/* FEATURES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)",
        gap: "20px", padding: "60px 40px" }}>
        {[
          { icon: "🔒", title: "Tamper-Proof", text: "All records permanently stored on blockchain" },
          { icon: "⚡", title: "Automated", text: "Smart contracts handle everything automatically" },
          { icon: "⭐", title: "Reputation", text: "Members build permanent payment history" },
          { icon: "🗳️", title: "Transparent", text: "Everyone sees who paid and who defaulted" }
        ].map((f, i) => (
          <div key={i} style={{ backgroundColor: "#1e293b", borderRadius: "12px",
            padding: "30px 20px", textAlign: "center", border: "1px solid #334155" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>{f.icon}</div>
            <h3 style={{ color: "#f59e0b", marginBottom: "8px" }}>{f.title}</h3>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>{f.text}</p>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: "center", padding: "30px",
        borderTop: "1px solid #1e293b", color: "#475569" }}>
        ChainBa — Chain Keepers Group | CCS4711 Cryptography & Applications
      </div>
    </div>
  );
}
