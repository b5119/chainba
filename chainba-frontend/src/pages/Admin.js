import { useState, useEffect } from "react";
import BASE_URL from "../api";
import "./Admin.css";

// Admin access is authorized server-side from the logged-in user's JWT
// (requires an account with isAdmin=true). No shared secret in the client.

// ─── Logo mark ────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:3 }}>
      <div style={{ width:13, height:13, background:"#10B981", borderRadius:3, transform:"rotate(45deg)", flexShrink:0 }} />
      <div style={{ width:8, height:8, background:"#6366F1", borderRadius:2, transform:"rotate(45deg)", marginLeft:-3, marginTop:5, flexShrink:0 }} />
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-value" style={{ color }}>{value}</div>
      <div className="adm-stat-label">{label}</div>
    </div>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────
function UserRow({ user, index, onSelect }) {
  const initials = user.fullName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "??";
  const isAdmin  = user.phone === "0000000000";
  return (
    <tr className="adm-tr" onClick={() => onSelect(user)}>
      <td className="adm-td" style={{ color:"#94A3B8", width:40 }}>{index + 1}</td>
      <td className="adm-td">
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background: isAdmin ? "#EEF2FF" : "#ECFDF5", color: isAdmin ? "#6366F1" : "#10B981", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, flexShrink:0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:500, color:"#0F172A" }}>{user.fullName}</div>
            {isAdmin && <div style={{ fontSize:10, color:"#6366F1", fontWeight:500 }}>Admin</div>}
          </div>
        </div>
      </td>
      <td className="adm-td" style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:"#334155" }}>{user.phone}</td>
      <td className="adm-td" style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#64748B" }}>
        {user.walletAddress?.slice(0,8)}...{user.walletAddress?.slice(-6)}
      </td>
      <td className="adm-td" style={{ fontSize:12, color:"#94A3B8" }}>
        {new Date(user.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}
      </td>
      <td className="adm-td">
        <span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:100, background: isAdmin ? "#EEF2FF" : "#ECFDF5", color: isAdmin ? "#6366F1" : "#10B981" }}>
          {isAdmin ? "Admin" : "Member"}
        </span>
      </td>
    </tr>
  );
}

// ─── User detail modal ────────────────────────────────────────────────────
function UserModal({ user, onClose }) {
  if (!user) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.7)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
      onClick={onClose}>
      <div style={{ background:"#FFFFFF", borderRadius:20, padding:"2rem", maxWidth:480, width:"100%", boxShadow:"0 24px 60px rgba(15,23,42,0.2)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"#0F172A", margin:0 }}>User detail</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#64748B", lineHeight:1 }}>×</button>
        </div>
        {[
          { label:"Full name",       value: user.fullName },
          { label:"Phone",           value: user.phone },
          { label:"Wallet address",  value: user.walletAddress },
          { label:"Identity hash",   value: user.identityHash?.slice(0,32) + "..." },
          { label:"Registered",      value: new Date(user.createdAt).toLocaleString() },
          { label:"Role",            value: user.phone === "0000000000" ? "Administrator" : "Member" },
        ].map(r => (
          <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
            <span style={{ fontSize:13, color:"#64748B" }}>{r.label}</span>
            <span style={{ fontSize:13, color:"#0F172A", fontWeight:500, textAlign:"right", maxWidth:"60%", wordBreak:"break-all" }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Admin ───────────────────────────────────────────────────────────
export default function Admin({ onNavigate, onLogout }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState("");
  const [selected,setSelected]= useState(null);
  const [tab,     setTab]     = useState("users"); // "users" | "system"
  const [accessError, setAccessError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setAccessError("");
    try {
      const token = localStorage.getItem("chainba_token");
      const res = await fetch(BASE_URL + "/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else if (res.status === 401 || res.status === 403) {
        setAccessError("You do not have admin access.");
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.walletAddress?.toLowerCase().includes(search.toLowerCase())
  );

  const memberCount = users.filter(u => u.phone !== "0000000000").length;

  return (
    <div className="adm-page">
      <UserModal user={selected} onClose={() => setSelected(null)} />

      {/* Navbar */}
      <nav className="adm-nav">
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <LogoMark />
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#0F172A", marginLeft:6 }}>ChainBa</span>
          <span style={{ fontSize:11, fontWeight:600, background:"#EEF2FF", color:"#6366F1", padding:"2px 10px", borderRadius:100, marginLeft:6 }}>Admin</span>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button className="adm-btn-ghost" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <main className="adm-main">

        {/* Stats */}
        <div className="adm-stats-row">
          <StatCard label="Total users"   value={users.length}  color="#10B981" />
          <StatCard label="Members"       value={memberCount}   color="#6366F1" />
          <StatCard label="Network"       value="Hardhat Local" color="#F59E0B" />
          <StatCard label="Status"        value="Live"          color="#10B981" />
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:"1.5rem" }}>
          {[
            { id:"users",  label:"Registered users" },
            { id:"system", label:"System info" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`adm-tab${tab === t.id ? " adm-tab-on" : ""}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <div className="adm-card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap", gap:10 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"#0F172A", margin:0 }}>
                Users
                <span style={{ fontSize:14, fontWeight:400, color:"#64748B", marginLeft:8 }}>({filtered.length})</span>
              </h2>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <input
                  className="adm-search"
                  placeholder="Search name, phone, wallet..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button className="adm-btn-primary" onClick={loadUsers}>
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {accessError ? (
              <div style={{ textAlign:"center", padding:"3rem", color:"#DC2626" }}>{accessError}</div>
            ) : loading ? (
              <div style={{ textAlign:"center", padding:"3rem", color:"#64748B" }}>Loading users...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem", color:"#64748B" }}>
                {search ? "No users match your search." : "No users registered yet."}
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table className="adm-table">
                  <thead>
                    <tr>
                      {["#","Name","Phone","Wallet","Registered","Role"].map(h => (
                        <th key={h} className="adm-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <UserRow key={i} user={u} index={i} onSelect={setSelected} />
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize:12, color:"#94A3B8", marginTop:"1rem" }}>
                  Click any row to view full user details.
                </p>
              </div>
            )}
          </div>
        )}

        {/* System tab */}
        {tab === "system" && (
          <div className="adm-card">
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"#0F172A", marginBottom:"1.5rem" }}>System information</h2>
            {[
              { label:"Platform",         value:"ChainBa v1.0" },
              { label:"Network",          value:"Hardhat Local (Chain ID 31337)" },
              { label:"RPC endpoint",     value:"http://127.0.0.1:8545" },
              { label:"Backend",          value:"Express + MongoDB port 5000" },
              { label:"Smart contracts",  value:"ChilimbaFactory + MemberReputation" },
              { label:"Auth method",      value:"JWT + bcrypt" },
              { label:"Assignment",       value:"CCS4711 · ZCAS University 2026" },
              { label:"Group",            value:"Chain Keepers" },
            ].map(r => (
              <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #F1F5F9" }}>
                <span style={{ fontSize:13, color:"#64748B" }}>{r.label}</span>
                <span style={{ fontSize:13, fontWeight:500, color:"#0F172A", fontFamily:"'DM Mono',monospace" }}>{r.value}</span>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
