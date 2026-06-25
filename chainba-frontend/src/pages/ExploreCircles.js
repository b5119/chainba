import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { FACTORY_ADDRESS, FACTORY_ABI, GROUP_ABI } from "../contracts/config";
import { toast } from "react-toastify";
import { formatShortDualCurrency } from "../utils/currency";
import "./ExploreCircles.css";

export default function ExploreCircles({ account, backendUser, onNavigate }) {
  const [circles, setCircles] = useState([]);
  const [filteredCircles, setFilteredCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Circles");

  const filters = ["All Circles", "Open", "Cash", "Goods", "Starting Soon"];

  useEffect(() => {
    loadCircles();
    // eslint-disable-next-line
  }, [account]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [searchQuery, activeFilter, circles]);

  const loadCircles = async () => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

      let allGroups = [];
      try {
        allGroups = await factory.getAllGroups();
      } catch (e) {
        console.error("Factory error:", e.message);
        toast.error("Could not load circles from blockchain");
        setLoading(false);
        return;
      }

      const circleData = [];
      
      for (let addr of allGroups) {
        try {
          const g = new ethers.Contract(addr, GROUP_ABI, signer);
          const name = await g.groupName();
          const type = await g.groupType();
          const contribution = await g.contributionAmount();
          const stake = await g.stakeAmount();
          const limit = await g.memberLimit();
          const leader = await g.leader();
          const status = await g.status();
          const memberCount = await g.getMemberCount();
          const currentCycle = await g.currentCycle();

          // Get members for avatar display
          let members = [];
          try {
            members = await g.getMembers();
          } catch (e) {
            console.log("Could not get members for", addr);
          }

          // Map status code to string
          const statusLabels = ["Open", "Active", "Completed"];
          const circleStatus = statusLabels[status] || "Unknown";

          // Check if user is already a member
          const isMember = members.some(
            m => m.toLowerCase() === account?.toLowerCase()
          );

          // Determine if circle is starting soon (Open with some members)
          const startingSoon = circleStatus === "Open" && memberCount.toNumber() > 0;

          circleData.push({
            address: addr,
            name,
            type,
            contribution: ethers.utils.formatEther(contribution),
            stake: ethers.utils.formatEther(stake),
            limit: limit.toNumber(),
            memberCount: memberCount.toNumber(),
            status: circleStatus,
            currentCycle: currentCycle.toNumber(),
            members,
            isMember,
            startingSoon,
            leader
          });
        } catch (e) {
          console.error("Error loading circle:", addr, e.message);
        }
      }

      setCircles(circleData);
    } catch (e) {
      console.error("Load circles error:", e);
      toast.error("Error loading circles: " + e.message);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...circles];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.type.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case "Open":
        filtered = filtered.filter(c => c.status === "Open");
        break;
      case "Cash":
        filtered = filtered.filter(c => c.type === "Cash");
        break;
      case "Goods":
        filtered = filtered.filter(c => c.type === "Goods");
        break;
      case "Starting Soon":
        filtered = filtered.filter(c => c.startingSoon);
        break;
      default:
        // "All Circles" - no additional filter
        break;
    }

    setFilteredCircles(filtered);
  };

  const handleJoinCircle = (address) => {
    onNavigate("group", address);
  };

  const handleCreateCircle = () => {
    onNavigate("create");
  };

  const getCircleIcon = (type) => {
    switch (type) {
      case "Cash":
        return "savings";
      case "Goods":
        return "inventory_2";
      case "Mixed":
        return "emergency";
      default:
        return "account_balance";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Open":
        return "status-open";
      case "Active":
        return "status-active";
      case "Completed":
        return "status-completed";
      default:
        return "";
    }
  };

  const walletShort = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "—";

  return (
    <div className="explore-circles-page">
      {/* Fixed Navigation Bar */}
      <header className="explore-nav">
        <div className="explore-nav-left">
          <h1 className="explore-brand" onClick={() => onNavigate("landingV2")}>
            ChainBa
          </h1>
          <nav className="explore-nav-links">
            <button className="explore-nav-link" onClick={() => onNavigate("dashboard")}>
              Dashboard
            </button>
            <button className="explore-nav-link active">Circles</button>
            <button className="explore-nav-link" onClick={() => onNavigate("profile")}>
              Profile
            </button>
          </nav>
        </div>
        <div className="explore-nav-right">
          <div className="explore-user-info">
            <span className="explore-wallet-address">{walletShort}</span>
            {backendUser && (
              <span className="explore-verified-badge">Verified Member</span>
            )}
          </div>
          <button className="explore-wallet-btn">
            {account ? "Connected" : "Connect Wallet"}
          </button>
          <div className="explore-avatar">
            <div className="explore-avatar-placeholder"></div>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="explore-hero mesh-gradient">
        <div className="explore-hero-content">
          <h1 className="explore-hero-title">Explore Circles</h1>
          <p className="explore-hero-description">
            Discover community savings circles powered by smart contracts. Join trusted groups, build reputation, and grow wealth together.
          </p>
          
          {/* Search Bar */}
          <div className="explore-search-bar">
            <span className="material-symbols-outlined explore-search-icon">search</span>
            <input
              type="text"
              className="explore-search-input"
              placeholder="Search by circle name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* CTA Buttons */}
          <div className="explore-hero-buttons">
            <button className="explore-btn-primary" onClick={handleCreateCircle}>
              <span className="material-symbols-outlined">add_circle</span>
              Start a New Circle
            </button>
            <button className="explore-btn-secondary" onClick={() => onNavigate("dashboard")}>
              View My Circles
            </button>
          </div>
        </div>
      </section>

      {/* Kente Divider */}
      <div className="kente-divider"></div>

      <main className="explore-main">
        {/* Filter Controls */}
        <div className="explore-filters">
          <div className="explore-filters-left">
            <h2 className="explore-filters-title">
              {filteredCircles.length} {filteredCircles.length === 1 ? 'Circle' : 'Circles'} Available
            </h2>
          </div>
          <div className="explore-filters-right">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`explore-filter-pill ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Circles Grid */}
        {loading ? (
          <div className="explore-loading">
            <div className="explore-loading-spinner"></div>
            <p className="explore-loading-text">Loading circles from blockchain...</p>
          </div>
        ) : filteredCircles.length === 0 ? (
          <div className="explore-empty">
            <div className="explore-empty-icon">
              <span className="material-symbols-outlined">search_off</span>
            </div>
            <h3 className="explore-empty-title">No circles found</h3>
            <p className="explore-empty-text">
              {searchQuery || activeFilter !== "All Circles"
                ? "Try adjusting your search or filters to find more circles."
                : "Be the first to create a circle and invite others to join!"}
            </p>
            <button className="explore-empty-btn" onClick={handleCreateCircle}>
              <span className="material-symbols-outlined">add_circle</span>
              Create First Circle
            </button>
          </div>
        ) : (
          <div className="explore-circles-grid">
            {filteredCircles.map((circle) => (
              <div key={circle.address} className="explore-circle-card">
                {/* Card Header */}
                <div className="circle-card-header">
                  <div className="circle-card-icon">
                    <span className="material-symbols-outlined">
                      {getCircleIcon(circle.type)}
                    </span>
                  </div>
                  <span className={`circle-card-status ${getStatusBadgeClass(circle.status)}`}>
                    {circle.status}
                  </span>
                </div>

                {/* Card Content */}
                <div className="circle-card-body">
                  <h3 className="circle-card-title">{circle.name}</h3>
                  <p className="circle-card-description">
                    {circle.type === "Cash" && "Standard rotating savings circle with cash contributions"}
                    {circle.type === "Goods" && "Dynamic rotation with flexible contribution schedules"}
                    {circle.type === "Mixed" && "Emergency fund circle with mixed contributions"}
                  </p>

                  {/* Circle Stats */}
                  <div className="circle-card-stats">
                    <div className="circle-stat-item">
                      <span className="material-symbols-outlined circle-stat-icon">group</span>
                      <div className="circle-stat-text">
                        <span className="circle-stat-label">Members</span>
                        <span className="circle-stat-value">
                          {circle.memberCount} / {circle.limit}
                        </span>
                      </div>
                    </div>

                    <div className="circle-stat-item">
                      <span className="material-symbols-outlined circle-stat-icon">payments</span>
                      <div className="circle-stat-text">
                        <span className="circle-stat-label">Contribution</span>
                        <span className="circle-stat-value">
                          {formatShortDualCurrency(circle.contribution)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Member Avatars */}
                  <div className="circle-card-members">
                    <div className="circle-avatars">
                      {[...Array(Math.min(4, circle.memberCount))].map((_, i) => (
                        <div key={i} className="circle-member-avatar"></div>
                      ))}
                      {circle.memberCount > 4 && (
                        <div className="circle-avatar-count">
                          +{circle.memberCount - 4}
                        </div>
                      )}
                      {circle.memberCount === 0 && (
                        <span className="circle-no-members">Be the first to join</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="circle-card-footer">
                  {circle.isMember ? (
                    <button 
                      className="circle-btn-joined"
                      onClick={() => handleJoinCircle(circle.address)}
                    >
                      <span className="material-symbols-outlined">check_circle</span>
                      View Circle
                    </button>
                  ) : circle.memberCount >= circle.limit ? (
                    <button className="circle-btn-full" disabled>
                      Circle Full
                    </button>
                  ) : (
                    <button
                      className="circle-btn-join"
                      onClick={() => handleJoinCircle(circle.address)}
                    >
                      <span className="material-symbols-outlined">person_add</span>
                      Join Circle
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && filteredCircles.length > 0 && (
          <div className="explore-bottom-cta">
            <div className="explore-cta-content">
              <h3 className="explore-cta-title">Can't find the right circle?</h3>
              <p className="explore-cta-text">
                Create your own circle with custom rules, invite trusted members, and start building wealth together.
              </p>
              <button className="explore-cta-btn" onClick={handleCreateCircle}>
                <span className="material-symbols-outlined">add_circle</span>
                Start Your Own Circle
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="explore-footer">
        <div className="explore-footer-content">
          <div className="footer-branding">
            <h5 className="footer-brand">ChainBa</h5>
            <p className="footer-copyright">
              © 2024 ChainBa Decentralized Finance. The Modern Custodian.
            </p>
          </div>
          <div className="footer-links">
            <button className="footer-link" onClick={() => onNavigate("landingV2")}>
              Home
            </button>
            <button className="footer-link" onClick={() => onNavigate("dashboard")}>
              Dashboard
            </button>
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">Community</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
