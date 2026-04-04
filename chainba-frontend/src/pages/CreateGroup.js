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

// ─── Step indicator ───────────────────────────────────────────────────────
function StepBar({ current, total }) {
  return (
    <div className="cg-stepbar">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`cg-step-seg${i < current ? " cg-step-done" : i === current - 1 ? " cg-step-active" : ""}`} />
      ))}
    </div>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="cg-field">
      <label className="cg-label">{label}</label>
      {hint && <p className="cg-hint">{hint}</p>}
      {children}
    </div>
  );
}

// ─── Summary row ─────────────────────────────────────────────────────────
function SummaryRow({ label, value, highlight }) {
  return (
    <div className="cg-summary-row">
      <span className="cg-summary-label">{label}</span>
      <span className={`cg-summary-value${highlight ? " cg-summary-highlight" : ""}`}>{value}</span>
    </div>
  );
}

export default function CreateGroup({ account, onNavigate }) {
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({
    groupName: "", groupType: "Cash",
    contributionAmount: "", stakeAmount: "",
    memberLimit: "4", gracePeriodDays: "3",
    penaltyAmount: "", ejectionThreshold: "2"
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
      toast.success("✅ Circle created on blockchain!");
      onNavigate("dashboard");
    } catch (e) {
      toast.error("Error: " + (e.reason || e.message));
    }
    setLoading(false);
  };

  const stepLabels = ["Basic details", "Amounts", "Rules & deploy"];

  return (
    <div className="cg-page">

      {/* Navbar */}
      <nav className="cg-nav">
        <div style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer" }} onClick={() => onNavigate("landingV2")}>
          <LogoMark />
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#0F172A", marginLeft:6 }}>ChainBa</span>
        </div>
        <button className="cg-btn-back" onClick={() => onNavigate("dashboard")}>
          ← Dashboard
        </button>
      </nav>

      <main className="cg-main">

        {/* Header */}
        <div className="cg-header">
          <h1 className="cg-title">Create a circle</h1>
          <p className="cg-subtitle">Step {step} of 3 — {stepLabels[step - 1]}</p>
          <StepBar current={step} total={3} />
        </div>

        {/* Card */}
        <div className="cg-card">

          {/* ── Step 1: Basic details ── */}
          {step === 1 && (
            <div>
              <h2 className="cg-step-heading">Basic details</h2>
              <Field label="Circle name" hint="Give your Chilimba group a memorable name">
                <input className="cg-input" type="text"
                  placeholder="e.g. Lusaka Sisters 2026"
                  value={form.groupName}
                  onChange={e => update("groupName", e.target.value)} />
              </Field>
              <Field label="Number of members" hint="How many people will join this circle?">
                <input className="cg-input" type="number" min="2" max="20"
                  placeholder="4"
                  value={form.memberLimit}
                  onChange={e => update("memberLimit", e.target.value)} />
              </Field>
              <Field label="Circle type">
                <select className="cg-input" value={form.groupType}
                  onChange={e => update("groupType", e.target.value)}>
                  <option>Cash</option>
                  <option>Goods</option>
                  <option>Mixed</option>
                </select>
              </Field>
            </div>
          )}

           {/* ── Step 2: Amounts ── */}
           {step === 2 && (
             <div>
               <h2 className="cg-step-heading">Amounts</h2>
               <div className="cg-info-pill">1 ETH = K27,000 ZMW / $3,200 USD (demo rates)</div>
               <Field label="Contribution per cycle" hint="Amount each member pays every round">
                 <CurrencyInput
                   value={form.contributionAmount}
                   onChange={v => update("contributionAmount", v)}
                   placeholder="e.g. 1.0" />
               </Field>
               <Field label="Security stake per member" hint="Held as collateral, returned on completion">
                 <CurrencyInput
                   value={form.stakeAmount}
                   onChange={v => update("stakeAmount", v)}
                   placeholder="e.g. 0.2" />
               </Field>
               <Field label="Late penalty amount" hint="Deducted from stake on late payment">
                 <CurrencyInput
                   value={form.penaltyAmount}
                   onChange={v => update("penaltyAmount", v)}
                   placeholder="e.g. 0.1" />
               </Field>
             </div>
           )}

          {/* ── Step 3: Rules + Summary ── */}
          {step === 3 && (
            <div>
              <h2 className="cg-step-heading">Rules</h2>
              <Field label="Grace period (days)" hint="Days allowed after cycle start to make contribution">
                <input className="cg-input" type="number" min="1"
                  value={form.gracePeriodDays}
                  onChange={e => update("gracePeriodDays", e.target.value)} />
              </Field>
              <Field label="Eject after how many defaults?">
                <select className="cg-input" value={form.ejectionThreshold}
                  onChange={e => update("ejectionThreshold", e.target.value)}>
                  <option value="1">1 default</option>
                  <option value="2">2 defaults</option>
                  <option value="3">3 defaults</option>
                </select>
              </Field>

               {/* Contract summary */}
               <div className="cg-summary">
                 <div className="cg-summary-header">Contract summary</div>
                 <SummaryRow label="Circle name"    value={form.groupName || "—"} />
                 <SummaryRow label="Type"           value={form.groupType} />
                 <SummaryRow label="Members"        value={form.memberLimit} />
                 <SummaryRow label="Contribution"   value={`${form.contributionAmount} ETH · K${(parseFloat(form.contributionAmount) * 27000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`} highlight />
                 <SummaryRow label="Stake"          value={`${form.stakeAmount} ETH · K${(parseFloat(form.stakeAmount) * 27000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`} highlight />
                 <SummaryRow label="Penalty"        value={`${form.penaltyAmount} ETH · K${(parseFloat(form.penaltyAmount) * 27000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`} />
                 <SummaryRow label="Grace period"   value={`${form.gracePeriodDays} days`} />
                 <SummaryRow label="Ejection after" value={`${form.ejectionThreshold} defaults`} />
                 <div className="cg-summary-warning">
                   ⚠ Once deployed these rules cannot be changed. You'll need to pay the stake amount when you join.
                 </div>
               </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="cg-nav-btns">
            {step > 1 && (
              <button className="cg-btn-secondary" onClick={() => setStep(s => s - 1)}>
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button className="cg-btn-primary" onClick={() => setStep(s => s + 1)}>
                Next →
              </button>
            ) : (
              <button className="cg-btn-deploy" onClick={deploy} disabled={loading}>
                {loading ? "Deploying..." : "Deploy circle →"}
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
