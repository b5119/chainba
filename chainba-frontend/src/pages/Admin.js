import { useState, useEffect } from "react";
import BASE_URL from "../api";

const ADMIN_KEY = "chainba2026";

export default function Admin({ onNavigate, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL + "/api/admin/users", {
        headers: { "x-admin-key": ADMIN_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "#1e293b", borderBottom: "1px solid #334155" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🛡️</span>
          <span style={{ color: "#f59e0b", fontWeight: "bold", fontSize: "18px" }}>Admin Panel</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => onNavigate("dashboard")}
            style={{ background: "transparent", border: "1px solid #334155", color: "#94a3b8", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "14px" }}>
            Dashboard
          </button>
          <button onClick={onLogout}
            style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "14px" }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "1000px", margin: "32px auto", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          {[
            { label: "Total Users", value: users.length, icon: "👥", color: "#f59e0b" },
            { label: "Network", value: "Hardhat Local", icon: "⛓️", color: "#22c55e" },
            { label: "Status", value: "Live", icon: "🟢", color: "#22c55e" },
            { label: "Platform", value: "ChainBa", icon: "📚", color: "#94a3b8" }
          ].map(s => (
            <div key={s.label} style={{ background: "#1e293b", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{s.icon}</div>
              <p style={{ color: s.color, fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>{s.value}</p>
              <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "#1e293b", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ color: "#f59e0b", margin: 0 }}>👥 Registered Users ({users.length})</h3>
            <button onClick={loadUsers}
              style={{ background: "#334155", border: "none", color: "#94a3b8", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
              🔄 Refresh
            </button>
          </div>
          {loading ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>Loading users...</p>
          ) : users.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>No users registered yet</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>{["#", "Full Name", "Phone", "Wallet Address", "Registered"].map(h => (
                    <th key={h} style={{ color: "#64748b", fontSize: "12px", textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #334155" }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #0f172a" }}>
                      <td style={{ padding: "12px", color: "#475569", fontSize: "13px" }}>{i + 1}</td>
                      <td style={{ padding: "12px", color: "#f1f5f9", fontSize: "14px" }}>{u.fullName}</td>
                      <td style={{ padding: "12px", color: "#94a3b8", fontSize: "14px" }}>{u.phone}</td>
                      <td style={{ padding: "12px", color: "#475569", fontSize: "12px" }}>{u.walletAddress?.slice(0, 18)}...</td>
                      <td style={{ padding: "12px", color: "#475569", fontSize: "12px" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}