import { useState } from "react";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError("");
    if (!form.phone || !form.password)
      return setError("All fields are required");
    setLoading(true);
    try {
      const res = await fetch("http://192.168.110.1:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, password: form.password })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Login failed");
      localStorage.setItem("chainba_token", data.token);
      localStorage.setItem("chainba_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e3a6e 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#1e293b", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🪙</div>
          <h1 style={{ color: "#f59e0b", fontSize: "28px", fontWeight: "bold", margin: 0 }}>ChainBa</h1>
          <p style={{ color: "#94a3b8", marginTop: "8px" }}>Welcome back</p>
        </div>

        {error && (
          <div style={{ background: "#7f1d1d", color: "#fca5a5", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "6px" }}>Phone Number</label>
          <input
            name="phone" type="text" placeholder="0971234567"
            value={form.phone} onChange={handle} onKeyDown={handleKey}
            style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", padding: "12px", color: "#f1f5f9", fontSize: "15px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "6px" }}>Password</label>
          <input
            name="password" type="password" placeholder="Your password"
            value={form.password} onChange={handle} onKeyDown={handleKey}
            style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", padding: "12px", color: "#f1f5f9", fontSize: "15px", boxSizing: "border-box" }}
          />
        </div>

        <button onClick={submit} disabled={loading}
          style={{ width: "100%", background: loading ? "#64748b" : "#f59e0b", color: "#0f172a", border: "none", borderRadius: "8px", padding: "14px", fontSize: "16px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <span style={{ color: "#94a3b8", fontSize: "14px" }}>New to ChainBa? </span>
          <button onClick={() => onLogin(null, "register")} style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>Create Account</button>
        </div>

        <div style={{ marginTop: "24px", padding: "12px", background: "#0f172a", borderRadius: "8px" }}>
          <p style={{ color: "#475569", fontSize: "12px", margin: "0 0 4px 0", textAlign: "center" }}>🔗 Connecting to Hardhat Local Network</p>
          <p style={{ color: "#475569", fontSize: "11px", margin: 0, textAlign: "center" }}>Your wallet is managed securely by ChainBa</p>
        </div>
      </div>
    </div>
  );
}