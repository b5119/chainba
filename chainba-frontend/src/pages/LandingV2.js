import React, { useEffect, useState } from "react";
import "./LandingV2.css";

export default function LandingV2({ onNavigate, onConnect, onRegister, onLogin }) {
  const [stickyNavVisible, setStickyNavVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setStickyNavVisible(scrollPercent > 70);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleConnectWallet = () => {
    if (onConnect) {
      onConnect();
    } else {
      console.log("Connect Wallet clicked");
    }
  };

  // Reserved for future login button implementation
  // eslint-disable-next-line no-unused-vars
  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else if (onNavigate) {
      onNavigate('login');
    } else {
      console.log("Login clicked");
    }
  };

  const handleRegister = () => {
    if (onRegister) {
      onRegister();
    } else if (onNavigate) {
      onNavigate('register');
    } else {
      console.log("Register clicked");
    }
  };

  return (
    <div className="landing-page">
      {/* Top Navigation Bar */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-nav-left">
            <span className="landing-logo">ChainBa</span>
            <div className="landing-nav-links">
              <a href="#dashboard" className="landing-nav-link active">Dashboard</a>
              <a href="#circles" className="landing-nav-link">Circles</a>
              <a href="#markets" className="landing-nav-link">Markets</a>
              <a href="#governance" className="landing-nav-link">Governance</a>
            </div>
          </div>
          <div className="landing-nav-right">
            <button className="landing-btn-connect" onClick={handleConnectWallet}>
              Connect Wallet
            </button>
            <div className="landing-avatar">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2xfzudLu0cOUrCY1PEMIp9P4b2nvC-l2k-QoW5kvbDtiZsk6AB3ANH4jqjXudE2clDgpAFdeGG19S2m2F0__fnX4oi6Zc-ucOG7pvaTuvawgX8Kej3nHVOYYcGBPcV7oeukJksboPtqGh46bZ1Owcs9_ZoCDPUJKflrKr-wC_a5m-2DgLMnEfyReELk_ZFq0DW3lLg3pnR-1MIEBK-Mv__lN5gXUTjv-ZYX7DMWGn9OlLtpaZzhgCJf_gOhMtfpSYUYrwKWgXSjl6" 
                alt="User Avatar"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          {/* Left Content */}
          <div className="landing-hero-left">
            <div className="landing-badge">
              <span className="landing-badge-dot"></span>
              <span className="landing-badge-text">Zambia's First Trustless Chilimba</span>
            </div>
            <h1 className="landing-hero-title">
              Wealth through <span className="landing-hero-highlight">Community</span> Trust.
            </h1>
            <p className="landing-hero-description">
              Decentralizing traditional Zambian savings circles. Secure, transparent, and entirely on-chain. 
              Experience the modern custodian of social capital.
            </p>
            <div className="landing-hero-buttons">
              <button className="landing-btn-primary" onClick={handleRegister}>
                Launch DApp
              </button>
              <button className="landing-btn-secondary" onClick={() => window.open('https://chainba.io/whitepaper', '_blank')}>
                Read Whitepaper
              </button>
            </div>
          </div>

          {/* Right Visual - Glass Dashboard Mockup */}
          <div className="landing-hero-right">
            <div className="landing-glass-card">
              <div className="landing-glass-header">
                <div>
                  <p className="landing-glass-label">Active Circle</p>
                  <h3 className="landing-glass-title">Lusaka Founders Group</h3>
                </div>
                <div className="landing-glass-payout">
                  <p className="landing-glass-amount">12,500 ZMW</p>
                  <p className="landing-glass-label">Next Payout</p>
                </div>
              </div>
              
              <div className="landing-glass-progress">
                <div className="landing-progress-bar">
                  <div className="landing-progress-fill" style={{ width: '70%' }}></div>
                </div>
              </div>

              <div className="landing-glass-stats">
                <div className="landing-stat-card">
                  <span className="material-symbols-outlined landing-stat-icon">payments</span>
                  <p className="landing-stat-value">4/12</p>
                  <p className="landing-stat-label">Cycles Done</p>
                </div>
                <div className="landing-stat-card">
                  <span className="material-symbols-outlined landing-stat-icon-secondary">group</span>
                  <p className="landing-stat-value">12 Members</p>
                  <p className="landing-stat-label">Verified 100%</p>
                </div>
              </div>

              <div className="landing-glass-security">
                <span className="material-symbols-outlined">shield_person</span>
                <div>
                  <p className="landing-security-title">Smart Contract Audited</p>
                  <p className="landing-security-desc">Zero critical vulnerabilities found</p>
                </div>
              </div>
            </div>

            {/* Decorative Blur Effects */}
            <div className="landing-blur-emerald"></div>
            <div className="landing-blur-secondary"></div>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <div className="landing-stats-band">
        <div className="landing-stats-container">
          <div className="landing-stat">
            <p className="landing-stat-number">100%</p>
            <p className="landing-stat-name">On-Chain</p>
          </div>
          <div className="landing-stat">
            <p className="landing-stat-number">23</p>
            <p className="landing-stat-name">Tests Passed</p>
          </div>
          <div className="landing-stat">
            <p className="landing-stat-number">0</p>
            <p className="landing-stat-name">Missed Payouts</p>
          </div>
          <div className="landing-stat">
            <p className="landing-stat-number">3</p>
            <p className="landing-stat-name">Live Contracts</p>
          </div>
        </div>
      </div>

      {/* Kente Divider */}
      <div className="kente-divider"></div>

      {/* How It Works Section */}
      <section className="landing-how-it-works">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">How ChainBa works</h2>
            <div className="landing-title-underline"></div>
          </div>

          <div className="landing-steps-grid">
            <div className="landing-step">
              <div className="landing-step-icon landing-step-icon-primary">
                <span className="material-symbols-outlined">hub</span>
              </div>
              <h3 className="landing-step-title">Form a Circle</h3>
              <p className="landing-step-description">
                Invite trusted members or join public pools. Set contribution amounts and payout 
                intervals that suit your group.
              </p>
            </div>

            <div className="landing-step">
              <div className="landing-step-icon landing-step-icon-secondary">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <h3 className="landing-step-title">Commit Funds</h3>
              <p className="landing-step-description">
                Contribute securely using USDC or local stablecoins. Funds are locked in a 
                non-custodial smart contract.
              </p>
            </div>

            <div className="landing-step">
              <div className="landing-step-icon landing-step-icon-tertiary">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <h3 className="landing-step-title">Automated Payouts</h3>
              <p className="landing-step-description">
                The protocol automatically rotates the total pool to a different member each 
                cycle based on the pre-set order.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section className="landing-bento-section">
        <div className="landing-container">
          <div className="landing-bento-grid">
            {/* Large Card - Security */}
            <div className="landing-bento-card landing-bento-large">
              <div>
                <span className="landing-feature-badge">Security First</span>
                <h3 className="landing-bento-title">Military-Grade Smart Contracts</h3>
                <p className="landing-bento-description">
                  Our architecture is built on OpenZeppelin standards, featuring time-locks and 
                  multi-sig governance for complete peace of mind.
                </p>
              </div>
              <div className="landing-bento-image">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9s8hgON5DaXZte2uf0bVISx6hS6_ev2A80tEy_5JkPTu1Q4nvb1qoc43LtaFe_bk47oQNCTH6oWej38e9YtWjl-RnWllKr28ul-DlUK4zKx7WWpvpO72-73aXKTjOtoO6WvwezDGGuuVNeIgBOuWBGlWYJ_8Jy3Ngve8e9JZzSV7HDB57PwyQ8jM6zNb_00IO0IyNakDhYYUMjkDhq_MWFJ4wrk2giT4sV4r3X2j1lqlkzbwxEZ2iqWPN6N0zd-rcuDVhOh1y4-0-" 
                  alt="Blockchain visualization"
                />
              </div>
            </div>

            {/* Vertical Card - Borderless */}
            <div className="landing-bento-card landing-bento-vertical">
              <div>
                <span className="material-symbols-outlined landing-bento-icon">public</span>
                <h3 className="landing-bento-title-white">Borderless Payouts</h3>
              </div>
              <p className="landing-bento-description-white">
                Send your Chilimba payout to any wallet, anywhere. No banks, no delays, no borders.
              </p>
            </div>

            {/* Small Card 1 - Verified Identity */}
            <div className="landing-bento-card landing-bento-small">
              <h4 className="landing-bento-subtitle">Verified Identity</h4>
              <p className="landing-bento-small-text">
                Zambian e-KYC integration ensures you're saving with real people you can trust.
              </p>
            </div>

            {/* Small Card 2 - Zero Fees (Spans 2) */}
            <div className="landing-bento-card landing-bento-wide">
              <div className="landing-bento-fees-content">
                <h4 className="landing-bento-fees-title">Zero Platform Fees</h4>
                <p className="landing-bento-fees-text">
                  We believe in public goods. ChainBa charges no fees on contributions. 
                  The protocol is sustained by governance.
                </p>
              </div>
              <span className="material-symbols-outlined landing-bento-fees-icon">savings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Section - Reputation */}
      <section className="landing-editorial">
        <div className="landing-container">
          <div className="landing-editorial-grid">
            {/* Left Content */}
            <div className="landing-editorial-content">
              <h2 className="landing-editorial-title">
                Reputation is the <br />
                <span className="landing-editorial-highlight">New Collateral.</span>
              </h2>
              <p className="landing-editorial-text">
                In traditional Chilimba, your word is your bond. ChainBa digitizes this bond. 
                Members earn "Reputation Points" for every successful contribution, unlocking 
                higher pool limits and lower insurance premiums.
              </p>

              <div className="landing-editorial-features">
                <div className="landing-editorial-feature">
                  <div className="landing-feature-check">
                    <span className="material-symbols-outlined">check</span>
                  </div>
                  <div>
                    <p className="landing-feature-title">Tiered Trust System</p>
                    <p className="landing-feature-desc">Progress from Bronze to Diamond status based on history.</p>
                  </div>
                </div>

                <div className="landing-editorial-feature">
                  <div className="landing-feature-check">
                    <span className="material-symbols-outlined">check</span>
                  </div>
                  <div>
                    <p className="landing-feature-title">Community Backing</p>
                    <p className="landing-feature-desc">Vouch for others to help them build their credit score.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Stacked Member Cards */}
            <div className="landing-editorial-cards">
              <div className="landing-member-card landing-member-card-1">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcvr1pTmPA5B52V41wUOB_8-Iq7hen7OXVoZydGEMsB-jKJxvWj-cdAGm3LNwH-XOAA0F2Z6bp9p1xerh6w3JwYTlHQ4ZAXd4YDK03iGVVJTiEztRRhgSY_UokbnnKFeJ-HyV9oDkq03IaapfeNKqvYmRC_PmMWk5CitcDO7eW_rDtUVCjgTW3AiR33mivHUpubPHckf-auce-69qWwkyKtrKUhCe5WDhyREnRR0EBiMZzPC4V68sGKJ8vvJ5Pzu2JRGVRzjGUO7IW" 
                  alt="Chanda Musonda" 
                  className="landing-member-avatar"
                />
                <div className="landing-member-info">
                  <div className="landing-member-header">
                    <p className="landing-member-name">Chanda Musonda</p>
                    <span className="landing-member-badge landing-badge-diamond">DIAMOND</span>
                  </div>
                  <p className="landing-member-stats">42 Contributions • 0 Delays</p>
                </div>
              </div>

              <div className="landing-member-card landing-member-card-2">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtcEINEeO1rQOWAtb0G5lt6-BWlOPEh3xrWGLUWXJMOr97zZy7R7JL0yROsTfPy9NI6tIvKGEtV-objlw_uiOD5l9_m7Pdk6vIP4O1ALV2EpGdliTlbq7BmQAL10F-Fd5fCmXk4B3vGWMU9KS1s4uCtpn2X4W91Ux6F_GXIekW7zb1Sxa2WylajGXYHSHlc2tW_n-ju6wfd_zEcbZ58JNd8LnYOuKHsYzD1lZGKKs_N4G-F_eVK970OiJqdVX1YeCnmrrHHut35oDU" 
                  alt="Mutale Kapinga" 
                  className="landing-member-avatar"
                />
                <div className="landing-member-info">
                  <div className="landing-member-header">
                    <p className="landing-member-name">Mutale Kapinga</p>
                    <span className="landing-member-badge landing-badge-gold">GOLD</span>
                  </div>
                  <p className="landing-member-stats">18 Contributions • 0 Delays</p>
                </div>
              </div>

              <div className="landing-member-card landing-member-card-3">
                <div className="landing-member-skeleton-avatar"></div>
                <div className="landing-member-skeleton-info">
                  <div className="landing-skeleton-line landing-skeleton-line-1"></div>
                  <div className="landing-skeleton-line landing-skeleton-line-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Path Section */}
      <section className="landing-two-path">
        <div className="landing-container">
          <h2 className="landing-path-title">Ready to start?</h2>
          
          <div className="landing-path-grid">
            {/* Beginner Path */}
            <div className="landing-path-card">
              <span className="landing-path-label landing-path-label-beginner">Beginner</span>
              <h3 className="landing-path-card-title">New to Crypto</h3>
              <p className="landing-path-description">
                Start your journey with our guided onboarding. We'll help you set up a secure 
                wallet and fund it using Zambian mobile money.
              </p>
              <a href="#" className="landing-path-link" onClick={(e) => { e.preventDefault(); handleRegister(); }}>
                Get Started Guide <span className="material-symbols-outlined">arrow_forward</span>
              </a>
            </div>

            {/* Pro Path */}
            <div className="landing-path-card">
              <span className="landing-path-label landing-path-label-pro">Pro</span>
              <h3 className="landing-path-card-title">Have MetaMask</h3>
              <p className="landing-path-description">
                Connect your wallet and immediately join active pools or create your own circles. 
                Built for the modern DeFi user.
              </p>
              <a href="#" className="landing-path-link" onClick={(e) => { e.preventDefault(); handleConnectWallet(); }}>
                Go to Dashboard <span className="material-symbols-outlined">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="landing-final-cta">
        <div className="landing-kente-background">
          <div className="kente-divider"></div>
        </div>
        <div className="landing-cta-content">
          <h2 className="landing-cta-title">
            Join the future of <br />social finance.
          </h2>
          <p className="landing-cta-description">
            Building a stronger, more connected financial future for every Zambian. One circle at a time.
          </p>
          <div className="landing-cta-buttons">
            <button className="landing-cta-btn-primary" onClick={handleRegister}>Create a Circle</button>
            <button className="landing-cta-btn-secondary" onClick={() => {
              if (onNavigate) onNavigate('explore');
              else handleRegister();
            }}>Explore Pools</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="landing-footer-left">
            <p className="landing-footer-brand">ChainBa</p>
            <p className="landing-footer-copyright">
              © 2024 ChainBa Decentralized Finance. The Modern Custodian.
            </p>
          </div>
          <div className="landing-footer-links">
            <a href="#" className="landing-footer-link">Privacy Policy</a>
            <a href="#" className="landing-footer-link">Terms of Service</a>
            <a href="#" className="landing-footer-link">Documentation</a>
            <a href="#" className="landing-footer-link">Community Discord</a>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Navigation Bar */}
      <div className={`landing-sticky-nav ${stickyNavVisible ? 'landing-sticky-nav-visible' : ''}`}>
        <div className="landing-sticky-nav-content">
          <button className="landing-sticky-link landing-sticky-link-active" onClick={() => {
            if (onNavigate) onNavigate('dashboard');
            else handleRegister();
          }}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className="landing-sticky-label">Dash</span>
          </button>
          <button className="landing-sticky-link" onClick={() => {
            if (onNavigate) onNavigate('explore');
            else handleRegister();
          }}>
            <span className="material-symbols-outlined">group_work</span>
            <span className="landing-sticky-label">Pools</span>
          </button>
          <button className="landing-sticky-fab" onClick={() => {
            if (onNavigate) onNavigate('create');
            else handleRegister();
          }}>
            <span className="material-symbols-outlined">add</span>
          </button>
          <button className="landing-sticky-link" onClick={() => {
            if (onNavigate) onNavigate('analytics');
            else handleRegister();
          }}>
            <span className="material-symbols-outlined">account_balance</span>
            <span className="landing-sticky-label">Vault</span>
          </button>
          <button className="landing-sticky-link" onClick={() => {
            if (onNavigate) onNavigate('profile');
            else handleRegister();
          }}>
            <span className="material-symbols-outlined">settings</span>
            <span className="landing-sticky-label">Set</span>
          </button>
        </div>
      </div>
    </div>
  );
}
