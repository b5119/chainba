import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CreateGroup from "./pages/CreateGroup";
import GroupView from "./pages/GroupView";

export default function App() {
  const [account, setAccount] = useState(null);
  const [page, setPage] = useState("landing");
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0] || null);
      });
    }
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) setAccount(accounts[0]);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast.error("Please install MetaMask!");
        return;
      }
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      setAccount(accounts[0]);
      toast.success("Wallet connected!");
      setPage("dashboard");
    } catch (err) {
      toast.error("Connection failed");
    }
  };

  const navigate = (p, group = null) => {
    setSelectedGroup(group);
    setPage(p);
  };

  return (
    <div>
      <ToastContainer position="top-right" theme="dark" />
      {page === "landing" && (
        <Landing account={account} onConnect={connectWallet} onNavigate={navigate} />
      )}
      {page === "dashboard" && (
        <Dashboard account={account} onNavigate={navigate} />
      )}
      {page === "create" && (
        <CreateGroup account={account} onNavigate={navigate} />
      )}
      {page === "group" && (
        <GroupView account={account} groupAddress={selectedGroup} onNavigate={navigate} />
      )}
    </div>
  );
}
