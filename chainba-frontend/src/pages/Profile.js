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

export default function Profile({ account, backendUser, balance, onNavigate }) {
  // State management
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Profile data
  const [profile, setProfile] = useState(null);
  const [ethBalance, setEthBalance] = useState(balance || null);
  const [lockedValue, setLockedValue] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [reputationScore, setReputationScore] = useState(95);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    avatar: null,
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
  });
  
  const [copied, setCopied] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("chainba_token");
        
        if (token) {
          // Fetch backend profile
          const res = await fetch(BASE_URL + "/api/profile/me", {
            headers: { Authorization: "Bearer " + token }
          });
          
          if (res.ok) {
            const data = await res.json();
            setProfile(data);
            setFormData({
              fullName: data.fullName || "",
              phone: data.phone || "",
              email: data.email || "",
              avatar: null,
              twoFactorEnabled: data.twoFactorEnabled || false,
              emailNotifications: data.emailNotifications !== false,
              smsNotifications: data.smsNotifications || false,
            });
          }
        }

        // Fetch live ETH balance from MetaMask
        if (window.ethereum && account) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const bal = await provider.getBalance(account);
          setEthBalance(parseFloat(ethers.utils.formatEther(bal)).toFixed(4));
        }

        // Calculate total savings and locked value (mock data for now)
        // In a real app, this would come from user's group memberships
        setTotalSavings(2450.75);
        setLockedValue(1200.50);
        
      } catch (err) {
        console.error("Error loading profile:", err);
        showNotification("Failed to load profile data", "error");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [account]);

  // Show notification helper
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle avatar upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle 2FA toggle
  const handleTwoFactorToggle = () => {
    setFormData(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
  };

  // Copy wallet address to clipboard
  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Save profile changes
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("chainba_token");
      
      if (!token) {
        showNotification("Not authenticated", "error");
        return;
      }

      const res = await fetch(BASE_URL + "/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        showNotification("Profile updated successfully!", "success");
      } else {
        const error = await res.json();
        showNotification(error.error || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      showNotification("Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  };

  // Calculate circular progress offset for reputation score
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (reputationScore / 100) * circumference;

  // Get user initials for avatar
  const displayName = formData.fullName || backendUser?.fullName || "User";
  const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="profile-page">
        <nav className="profile-nav">
          <div style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer" }} onClick={() => onNavigate("landingV2")}>
            <LogoMark />
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#0F172A", marginLeft:6 }}>ChainBa</span>
          </div>
        </nav>
        <div className="profile-loading">
          <div className="profile-spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Fixed Navigation Bar */}
      <nav className="profile-nav">
        <div style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer" }} onClick={() => onNavigate("landingV2")}>
          <LogoMark />
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#0F172A", marginLeft:6 }}>ChainBa</span>
        </div>
        <div className="profile-nav-actions">
          <button className="profile-btn-ghost" onClick={() => onNavigate("dashboard")}>
            ← Dashboard
          </button>
          <div className="profile-wallet-badge">
            <span className="profile-wallet-dot" />
            <span className="profile-wallet-text">
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not Connected"}
            </span>
          </div>
        </div>
      </nav>

      {/* Notification Toast */}
      {notification && (
        <div className={`profile-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Main Content */}
      <div className="profile-container">
        {/* Sidebar Navigation */}
        <aside className="profile-sidebar">
          <div className="profile-sidebar-header">
            <h2>Settings</h2>
          </div>
          <nav className="profile-sidebar-nav">
            <button
              className={`profile-sidebar-item ${activeTab === "general" ? "active" : ""}`}
              onClick={() => setActiveTab("general")}
            >
              <span className="profile-sidebar-icon">👤</span>
              <span>General</span>
            </button>
            <button
              className={`profile-sidebar-item ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <span className="profile-sidebar-icon">🔒</span>
              <span>Security</span>
            </button>
            <button
              className={`profile-sidebar-item ${activeTab === "wallet" ? "active" : ""}`}
              onClick={() => setActiveTab("wallet")}
            >
              <span className="profile-sidebar-icon">💰</span>
              <span>Wallet</span>
            </button>
            <button
              className={`profile-sidebar-item ${activeTab === "notifications" ? "active" : ""}`}
              onClick={() => setActiveTab("notifications")}
            >
              <span className="profile-sidebar-icon">🔔</span>
              <span>Notifications</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="profile-content">
          {/* Reputation Score Card */}
          <div className="profile-reputation-card">
            <div className="profile-reputation-content">
              <div className="profile-reputation-info">
                <h3>Reputation Score</h3>
                <p>Your trust score based on savings activity</p>
                <div className="profile-reputation-details">
                  <div className="profile-reputation-stat">
                    <span className="profile-stat-label">Total Savings</span>
                    <span className="profile-stat-value">${totalSavings.toFixed(2)}</span>
                  </div>
                  <div className="profile-reputation-stat">
                    <span className="profile-stat-label">Active Groups</span>
                    <span className="profile-stat-value">3</span>
                  </div>
                </div>
              </div>
              <div className="profile-reputation-circle">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="8"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                    className="profile-reputation-progress"
                  />
                </svg>
                <div className="profile-reputation-score">
                  <span className="profile-score-number">{reputationScore}</span>
                  <span className="profile-score-total">/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* General Tab */}
          {activeTab === "general" && (
            <div className="profile-tab-content">
              <div className="profile-card">
                <div className="profile-card-header">
                  <h2>Profile Information</h2>
                  <p>Update your personal details</p>
                </div>

                {/* Avatar Section */}
                <div className="profile-avatar-section">
                  <div className="profile-avatar-upload">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar" className="profile-avatar-preview" />
                    ) : (
                      <div className="profile-avatar-placeholder">{initials}</div>
                    )}
                    <label className="profile-avatar-change">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        style={{ display: "none" }}
                      />
                      Change Photo
                    </label>
                  </div>
                  <div className="profile-avatar-info">
                    <h3>Profile Picture</h3>
                    <p>Upload a profile photo. Recommended size: 400x400px</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="profile-form-grid">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Full Name</label>
                    <input
                      type="text"
                      className="profile-form-input"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="profile-form-input"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+260 XXX XXX XXX"
                      disabled
                    />
                    <span className="profile-form-hint">Phone number cannot be changed</span>
                  </div>

                  <div className="profile-form-group profile-form-group-full">
                    <label className="profile-form-label">Email Address</label>
                    <input
                      type="email"
                      className="profile-form-input"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="profile-tab-content">
              <div className="profile-card">
                <div className="profile-card-header">
                  <h2>Security Settings</h2>
                  <p>Manage your account security</p>
                </div>

                {/* 2FA Toggle */}
                <div className="profile-security-item">
                  <div className="profile-security-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <div className="profile-toggle-wrapper">
                    <button
                      className={`profile-toggle ${formData.twoFactorEnabled ? "active" : ""}`}
                      onClick={handleTwoFactorToggle}
                    >
                      <span className="profile-toggle-slider" />
                    </button>
                  </div>
                </div>

                {/* Identity Hash */}
                <div className="profile-security-item">
                  <div className="profile-security-info">
                    <h3>NRC Identity Hash</h3>
                    <p>Your on-chain identity verification</p>
                  </div>
                </div>
                <div className="profile-hash-display">
                  <div className="profile-hash-label">keccak256 Hash</div>
                  <div className="profile-hash-value">
                    {profile?.identityHash || backendUser?.identityHash || "Not available"}
                  </div>
                  <p className="profile-hash-note">
                    Your NRC and phone number are hashed on-chain. No raw personal data is stored on the blockchain.
                  </p>
                </div>

                {/* Password Change Section */}
                <div className="profile-security-item" style={{ marginTop: "2rem" }}>
                  <div className="profile-security-info">
                    <h3>Password</h3>
                    <p>Change your account password</p>
                  </div>
                  <button className="profile-btn-secondary">
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Tab */}
          {activeTab === "wallet" && (
            <div className="profile-tab-content">
              <div className="profile-card">
                <div className="profile-card-header">
                  <h2>Wallet Information</h2>
                  <p>View your wallet details and balances</p>
                </div>

                {/* Primary Wallet */}
                <div className="profile-wallet-section">
                  <div className="profile-wallet-header">
                    <h3>Primary Wallet Address</h3>
                    <button className="profile-copy-btn" onClick={copyAddress}>
                      {copied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="profile-wallet-address">
                    {account || "No wallet connected"}
                  </div>
                </div>

                {/* Balance Cards */}
                <div className="profile-balance-grid">
                  <div className="profile-balance-card">
                    <div className="profile-balance-icon">💰</div>
                    <div className="profile-balance-info">
                      <span className="profile-balance-label">Available Balance</span>
                      <span className="profile-balance-amount">
                        {ethBalance || "0.0000"} <span className="profile-balance-unit">ETH</span>
                      </span>
                    </div>
                  </div>

                  <div className="profile-balance-card">
                    <div className="profile-balance-icon">🔒</div>
                    <div className="profile-balance-info">
                      <span className="profile-balance-label">Locked in Groups</span>
                      <span className="profile-balance-amount">
                        ${lockedValue.toFixed(2)} <span className="profile-balance-unit">USD</span>
                      </span>
                    </div>
                  </div>

                  <div className="profile-balance-card profile-balance-card-highlight">
                    <div className="profile-balance-icon">📈</div>
                    <div className="profile-balance-info">
                      <span className="profile-balance-label">Total Savings</span>
                      <span className="profile-balance-amount">
                        ${totalSavings.toFixed(2)} <span className="profile-balance-unit">USD</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Network Info */}
                <div className="profile-network-info">
                  <div className="profile-network-status">
                    <span className="profile-network-dot" />
                    <span>Connected to Hardhat Local Network (Chain ID: 31337)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="profile-tab-content">
              <div className="profile-card">
                <div className="profile-card-header">
                  <h2>Communication Preferences</h2>
                  <p>Manage how you receive notifications</p>
                </div>

                {/* Email Notifications */}
                <div className="profile-notification-section">
                  <div className="profile-notification-header">
                    <h3>Email Notifications</h3>
                  </div>
                  
                  <div className="profile-checkbox-group">
                    <label className="profile-checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.emailNotifications}
                        onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                      />
                      <span className="profile-checkbox-label">
                        <strong>Activity Updates</strong>
                        <small>Receive updates about your savings circles and contributions</small>
                      </span>
                    </label>

                    <label className="profile-checkbox-item">
                      <input
                        type="checkbox"
                        defaultChecked={true}
                      />
                      <span className="profile-checkbox-label">
                        <strong>Payment Reminders</strong>
                        <small>Get notified about upcoming contribution deadlines</small>
                      </span>
                    </label>

                    <label className="profile-checkbox-item">
                      <input
                        type="checkbox"
                        defaultChecked={false}
                      />
                      <span className="profile-checkbox-label">
                        <strong>Marketing Emails</strong>
                        <small>Receive tips, news, and updates from ChainBa</small>
                      </span>
                    </label>
                  </div>
                </div>

                {/* SMS Notifications */}
                <div className="profile-notification-section" style={{ marginTop: "2rem" }}>
                  <div className="profile-notification-header">
                    <h3>SMS Notifications</h3>
                  </div>
                  
                  <div className="profile-checkbox-group">
                    <label className="profile-checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.smsNotifications}
                        onChange={(e) => handleInputChange("smsNotifications", e.target.checked)}
                      />
                      <span className="profile-checkbox-label">
                        <strong>Critical Alerts</strong>
                        <small>Receive SMS for important account activities</small>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Email Input */}
                <div className="profile-form-group" style={{ marginTop: "2rem" }}>
                  <label className="profile-form-label">Email Address for Notifications</label>
                  <input
                    type="email"
                    className="profile-form-input"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your.email@example.com"
                  />
                  <span className="profile-form-hint">We'll send notifications to this address</span>
                </div>
              </div>
            </div>
          )}

          {/* Save Changes Button */}
          <div className="profile-actions">
            <button
              className="profile-btn-save"
              onClick={handleSaveChanges}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button className="profile-btn-cancel" onClick={() => onNavigate("dashboard")}>
              Cancel
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
