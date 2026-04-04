import { useState, useEffect } from "react";
import LandingV2 from "./pages/LandingV2";
import Dashboard from "./pages/Dashboard";
import CreateGroup from "./pages/CreateGroup";
import GroupView from "./pages/GroupView";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

export default function App() {
  const [account, setAccount] = useState(null);
  const [page, setPage] = useState("loading");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const ADMIN_PHONE = "0000000000";

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem("chainba_user");
      const token = localStorage.getItem("chainba_token");
      if (saved && token) {
        const user = JSON.parse(saved);
        setBackendUser(user);
        // Don't override MetaMask account with backend wallet
        // setAccount(user.walletAddress);
        setPage("dashboard");
        return;
      }

      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) setAccount(accounts[0]);
        } catch (err) { console.error(err); }

        window.ethereum.on("accountsChanged", (accounts) => {
          if (accounts.length === 0) {
            setAccount(null);
            setBackendUser(null);
            localStorage.removeItem("chainba_token");
            localStorage.removeItem("chainba_user");
            setPage("landingV2");
          } else {
            setAccount(accounts[0]);
          }
        });
      }

      // ── Default to new landing. Change to "landing" to restore original.
      setPage("landingV2");
    };
    init();
  }, []);

  const getMetaMaskAccount = async () => {
    if (!window.ethereum) return null;
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      return accounts[0] || null;
    } catch { return null; }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask to use ChainBa");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      setPage("dashboard");
    } catch (err) { console.error(err); }
  };

  const handleLogin = (user, redirect) => {
    if (redirect === "login") { setPage("login"); return; }
    if (redirect === "register") { setPage("register"); return; }
    if (user) {
      setBackendUser(user);
      // Don't override MetaMask account with backend wallet
        // setAccount(user.walletAddress);
      if (user.phone === ADMIN_PHONE) setPage("admin");
      else setPage("dashboard");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chainba_token");
    localStorage.removeItem("chainba_user");
    setBackendUser(null);
    setAccount(null);
    setPage("landingV2");
  };

  const navigate = (p, groupAddress) => {
    if (p === "admin") {
      if (backendUser?.phone === ADMIN_PHONE) {
        setPage("admin");
      } else {
        setPage("dashboard");
      }
      return;
    }
    setPage(p);
    if (groupAddress) setSelectedGroup(groupAddress);
  };

  const activeAccount = account || (() => {
    try {
      return window.ethereum?.selectedAddress || backendUser?.walletAddress;
    } catch {
      return backendUser?.walletAddress;
    }
  })();
  // MetaMask account always takes priority over backend wallet

  // ── Loading screen ────────────────────────────────────────────────────────
  if (page === "loading") return (
    <div style={{ minHeight:"100vh", background:"#0A0A08", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{
          width:"14px", height:"14px", background:"#BA7517",
          transform:"rotate(45deg)", borderRadius:"2px",
          margin:"0 auto 16px", animation:"spin .8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(225deg); } }`}</style>
        <p style={{ color:"#BA7517", fontSize:"20px", fontFamily:"Georgia,serif", letterSpacing:"-0.5px" }}>ChainBa</p>
        <p style={{ color:"#4A4845", fontSize:"13px", marginTop:"6px" }}>Loading...</p>
      </div>
    </div>
  );

  // ── Pages ─────────────────────────────────────────────────────────────────
  if (page === "register")   return <Register onLogin={handleLogin} />;
  if (page === "login")      return <Login onLogin={handleLogin} />;
  if (page === "profile")    return <Profile account={activeAccount} backendUser={backendUser} onNavigate={navigate} onLogout={handleLogout} />;
  if (page === "admin") {
    if (!backendUser || backendUser.phone !== ADMIN_PHONE) {
      return <Dashboard account={activeAccount} backendUser={backendUser} onNavigate={navigate} onLogout={handleLogout} />;
    }
    return <Admin onNavigate={navigate} onLogout={handleLogout} />;
  }

  // ── New landing v2 ────────────────────────────────────────────────────────
  if (page === "landingV2") return (
    // eslint-disable-next-line react/jsx-pascal-case
    <LandingV2
      onConnect={connectWallet}
      onRegister={() => setPage("register")}
      onLogin={() => setPage("login")}
    />
  );

  if (page === "dashboard") return (
    <Dashboard account={activeAccount} backendUser={backendUser} onNavigate={navigate} onLogout={handleLogout} />
  );

  if (page === "create") return (
    <CreateGroup account={activeAccount} onNavigate={navigate} />
  );

  if (page === "group") return (
    <GroupView account={activeAccount} groupAddress={selectedGroup} onNavigate={navigate} />
  );
}