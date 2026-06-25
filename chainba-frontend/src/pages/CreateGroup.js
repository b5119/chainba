import { useState } from "react";
import { ethers } from "ethers";
import { FACTORY_ADDRESS, FACTORY_ABI } from "../contracts/config";
import { toast } from "react-toastify";
import CurrencyInput from "../components/CurrencyInput";
import "./CreateGroup.css";

function LogoMark() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:3 }}>
      <div style={{ width:13, height:13, background:"#10B981", borderRadius:3, transform:"rotate(45deg)", flexShrink:0 }} />
      <div style={{ width:8, height:8, background:"#6366F1", borderRadius:2, transform:"rotate(45deg)", marginLeft:-3, marginTop:5, flexShrink:0 }} />
    </div>
  );
}

export default function CreateGroup({ account, backendUser, onNavigate }) {
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({
    groupName: "", groupType: "Cash",
    contributionAmount: "", stakeAmount: "",
    memberLimit: "4", gracePeriodDays: "3",
    penaltyAmount: "", ejectionThreshold: "2",
    paymentDeadline: "",
    transparencyLevel: "full"
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const deploy = async () => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer   = provider.getSigner();
      const factory  = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const tx = await factory.createGroup(
        form.groupName, form.groupType,
        ethers.utils.parseEther(form.contributionAmount),
        ethers.utils.parseEther(form.stakeAmount),
        parseInt(form.memberLimit),
        parseInt(form.gracePeriodDays),
        ethers.utils.parseEther(form.penaltyAmount),
        parseInt(form.ejectionThreshold)
      );
      toast.info("Deploying circle contract...");
      await tx.wait();
      const stakeAmount = form.stakeAmount;
      const stakeZMW = (parseFloat(stakeAmount) * 27000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      toast.success(`✅ Circle created! Now go back to join and pay stake of ${stakeAmount} ETH · K${stakeZMW}`);
      onNavigate("dashboard");
    } catch (e) {
      toast.error("Error: " + (e.reason || e.message));
    }
    setLoading(false);
  };

  const stepLabels = ["Identity", "Economics", "Governance"];

  return (
    <div className="creategroup-wizard">
      {/* Top Navigation */}
      <nav className="creategroup-nav">
        <div style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer" }} onClick={() => onNavigate("landingV2")}>
          <LogoMark />
          <span className="creategroup-logo-text">ChainBa</span>
        </div>
        <div className="creategroup-nav-actions">
          <button className="creategroup-wallet-btn">Connect Wallet</button>
        </div>
      </nav>

      <main className="creategroup-main">
        {/* Header Section */}
        <header className="creategroup-header">
          <h1 className="creategroup-title">Initialize Your Circle</h1>
          <p className="creategroup-subtitle">Architect a transparent decentralized community pot. Your rules, secured by code, governed by members.</p>
        </header>

        {/* Step Progress Bar */}
        <div className="creategroup-progress-section">
          <div className="creategroup-progress-labels">
            {stepLabels.map((label, idx) => (
              <span 
                key={idx}
                className={`creategroup-progress-label ${idx + 1 === step ? 'active' : ''}`}
              >
                Step {idx + 1}: {label}
              </span>
            ))}
          </div>
          <div className="creategroup-progress-bar">
            <div 
              className="creategroup-progress-fill" 
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Kente Divider */}
        <div className="creategroup-kente-divider" />

        <div className="creategroup-content-grid">
          {/* Main Form Area */}
          <section className="creategroup-form-area">
            {/* Step 1: Identity */}
            {step === 1 && (
              <div className="creategroup-step-card">
                <h2 className="creategroup-step-heading">Basic Information</h2>
                <div className="creategroup-form-fields">
                  {/* Circle Name */}
                  <div className="creategroup-field">
                    <label className="creategroup-field-label">Circle Name</label>
                    <input 
                      className="creategroup-input" 
                      type="text"
                      placeholder="e.g. Lagos Tech Founders Pot"
                      value={form.groupName}
                      onChange={e => update("groupName", e.target.value)} 
                    />
                  </div>

                  {/* Member Count & Type Grid */}
                  <div className="creategroup-field-grid">
                    <div className="creategroup-field">
                      <label className="creategroup-field-label">Maximum Members</label>
                      <div className="creategroup-input-icon-wrapper">
                        <input 
                          className="creategroup-input" 
                          type="number" 
                          min="2" 
                          max="20"
                          value={form.memberLimit}
                          onChange={e => update("memberLimit", e.target.value)} 
                        />
                        <span className="creategroup-input-icon material-symbols-outlined">group</span>
                      </div>
                    </div>

                    <div className="creategroup-field">
                      <label className="creategroup-field-label">Circle Type</label>
                      <select 
                        className="creategroup-input" 
                        value={form.groupType}
                        onChange={e => update("groupType", e.target.value)}
                      >
                        <option value="Cash">Standard Chilimba</option>
                        <option value="Goods">Dynamic Rotation</option>
                        <option value="Mixed">Emergency Fund</option>
                      </select>
                    </div>
                  </div>

                  {/* Transparency Level */}
                  <div className="creategroup-field">
                    <label className="creategroup-field-label">Member Information Visibility</label>
                    <select 
                      className="creategroup-input" 
                      value={form.transparencyLevel}
                      onChange={e => update("transparencyLevel", e.target.value)}
                    >
                      <option value="full">Full transparency - Members see names, phones, reputation</option>
                      <option value="basic">Basic - Members see names and reputation only</option>
                      <option value="private">Private - Only leader sees full member details</option>
                    </select>
                    <div className={`creategroup-transparency-info ${form.transparencyLevel === 'full' ? 'recommended' : 'warning'}`}>
                      {form.transparencyLevel === "full" && (
                        <>
                          <strong>✓ Recommended:</strong> Full transparency builds trust. All members will see each other's verified names, phone numbers (last 4 digits), and reputation scores.
                        </>
                      )}
                      {form.transparencyLevel === "basic" && (
                        <>
                          <strong>⚠ Moderate privacy:</strong> Members see names and reputation but not phone numbers. Leader has full access.
                        </>
                      )}
                      {form.transparencyLevel === "private" && (
                        <>
                          <strong>🔒 Maximum privacy:</strong> Members only see wallet addresses. Only the leader can view full member details for verification purposes.
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Economics */}
            {step === 2 && (
              <div className="creategroup-step-card">
                <h2 className="creategroup-step-heading">Economic Parameters</h2>
                <div className="creategroup-rate-pill">1 ETH = K27,000 ZMW / $3,200 USD (demo rates)</div>
                <div className="creategroup-form-fields">
                  <div className="creategroup-field">
                    <label className="creategroup-field-label">Contribution per cycle</label>
                    <p className="creategroup-field-hint">Amount each member pays every round</p>
                    <CurrencyInput
                      value={form.contributionAmount}
                      onChange={v => update("contributionAmount", v)}
                      placeholder="e.g. 1.0" 
                    />
                  </div>

                  <div className="creategroup-field">
                    <label className="creategroup-field-label">Security stake per member</label>
                    <p className="creategroup-field-hint">Held as collateral, returned on completion</p>
                    <CurrencyInput
                      value={form.stakeAmount}
                      onChange={v => update("stakeAmount", v)}
                      placeholder="e.g. 0.2" 
                    />
                  </div>

                  <div className="creategroup-field">
                    <label className="creategroup-field-label">Late penalty amount</label>
                    <p className="creategroup-field-hint">Deducted from stake on late payment</p>
                    <CurrencyInput
                      value={form.penaltyAmount}
                      onChange={v => update("penaltyAmount", v)}
                      placeholder="e.g. 0.1" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Governance */}
            {step === 3 && (
              <div className="creategroup-step-card">
                <h2 className="creategroup-step-heading">Governance Rules</h2>
                <div className="creategroup-form-fields">
                  <div className="creategroup-field">
                    <label className="creategroup-field-label">Grace period (days)</label>
                    <p className="creategroup-field-hint">Days allowed after cycle start to make contribution</p>
                    <input 
                      className="creategroup-input" 
                      type="number" 
                      min="1"
                      value={form.gracePeriodDays}
                      onChange={e => update("gracePeriodDays", e.target.value)} 
                    />
                  </div>

                  <div className="creategroup-field">
                    <label className="creategroup-field-label">First payment deadline (optional)</label>
                    <p className="creategroup-field-hint">Select a specific date for the first cycle deadline. Each cycle will be 30 days with your grace period.</p>
                    <input 
                      className="creategroup-input" 
                      type="date"
                      min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      value={form.paymentDeadline}
                      onChange={e => update("paymentDeadline", e.target.value)}
                    />
                    {form.paymentDeadline && (
                      <div className="creategroup-deadline-info success">
                        ✓ First payment due: {new Date(form.paymentDeadline).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    )}
                    {!form.paymentDeadline && (
                      <div className="creategroup-deadline-info default">
                        Default: Members must pay within {30 + parseInt(form.gracePeriodDays || 0)} days after group fills
                      </div>
                    )}
                  </div>

                  <div className="creategroup-field">
                    <label className="creategroup-field-label">Eject after how many defaults?</label>
                    <select 
                      className="creategroup-input" 
                      value={form.ejectionThreshold}
                      onChange={e => update("ejectionThreshold", e.target.value)}
                    >
                      <option value="1">1 default</option>
                      <option value="2">2 defaults</option>
                      <option value="3">3 defaults</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Locked Step Preview (only show on steps 1-2) */}
            {step < 3 && (
              <div className="creategroup-step-locked">
                <div className="creategroup-step-locked-content">
                  <div className="creategroup-step-locked-info">
                    <span className="creategroup-step-locked-number">{step + 1}</span>
                    <span className="creategroup-step-locked-title">{stepLabels[step]}</span>
                  </div>
                  <span className="creategroup-step-locked-icon material-symbols-outlined">lock</span>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="creategroup-nav-buttons">
              <button 
                className="creategroup-btn-back" 
                onClick={() => step > 1 ? setStep(s => s - 1) : onNavigate("dashboard")}
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span>{step > 1 ? 'Previous Step' : 'Back to Dashboard'}</span>
              </button>
              {step < 3 ? (
                <button 
                  className="creategroup-btn-next" 
                  onClick={() => setStep(s => s + 1)}
                >
                  <span>Next Step</span>
                  <span className="material-symbols-outlined">trending_flat</span>
                </button>
              ) : (
                <button 
                  className="creategroup-btn-deploy" 
                  onClick={deploy} 
                  disabled={loading}
                >
                  <span>{loading ? "Deploying..." : "Deploy Circle"}</span>
                  <span className="material-symbols-outlined">trending_flat</span>
                </button>
              )}
            </div>
          </section>

          {/* Sidebar Summary */}
          <aside className="creategroup-sidebar">
            <div className="creategroup-summary-card">
              <div className="creategroup-summary-bg-icon">
                <span className="material-symbols-outlined">account_balance</span>
              </div>
              <div className="creategroup-summary-content">
                <div className="creategroup-summary-header">
                  <div className="creategroup-summary-icon">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <h3 className="creategroup-summary-title">Circle Summary</h3>
                </div>

                <div className="creategroup-summary-params">
                  <div className="creategroup-summary-row">
                    <span className="creategroup-summary-label">Name</span>
                    <span className="creategroup-summary-value">{form.groupName || '---'}</span>
                  </div>
                  <div className="creategroup-summary-row">
                    <span className="creategroup-summary-label">Contribution</span>
                    <span className="creategroup-summary-value highlight">
                      {form.contributionAmount || '0.00'} ETH
                    </span>
                  </div>
                  <div className="creategroup-summary-row">
                    <span className="creategroup-summary-label">Members</span>
                    <span className="creategroup-summary-value">0 / {form.memberLimit || '12'}</span>
                  </div>
                  <div className="creategroup-summary-row">
                    <span className="creategroup-summary-label">Type</span>
                    <span className="creategroup-summary-value">{form.groupType}</span>
                  </div>
                  {form.stakeAmount && (
                    <div className="creategroup-summary-row">
                      <span className="creategroup-summary-label">Stake</span>
                      <span className="creategroup-summary-value highlight">{form.stakeAmount} ETH</span>
                    </div>
                  )}
                </div>

                <div className="creategroup-summary-footer">
                  <p className="creategroup-summary-quote">
                    "The modern custodian ensures that trust is not just a feeling, but a mathematical certainty."
                  </p>
                  <div className="creategroup-summary-status">
                    <span className="creategroup-status-dot" />
                    <span className="creategroup-status-text">Awaiting Parameters</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Widget */}
            <div className="creategroup-info-widget">
              <h4 className="creategroup-info-widget-title">Did you know?</h4>
              <p className="creategroup-info-widget-text">
                Chilimba circles on ChainBa use the <span className="creategroup-info-widget-highlight">ERC-721C</span> standard, allowing your group membership to act as a tradable reputation asset.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
