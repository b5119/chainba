import { useState } from "react";
import { ethers } from "ethers";
import { FACTORY_ADDRESS, FACTORY_ABI } from "../contracts/config";
import { toast } from "react-toastify";
import CurrencyInput from "../components/CurrencyInput";

export default function CreateGroup({ account, onNavigate }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [form, setForm] = useState({
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
      const signer = provider.getSigner();
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

      const tx = await factory.createGroup(
        form.groupName, form.groupType,
        ethers.utils.parseEther(form.contributionAmount),
        ethers.utils.parseEther(form.stakeAmount),
        parseInt(form.memberLimit),
        parseInt(form.gracePeriodDays),
        ethers.utils.parseEther(form.penaltyAmount),
        parseInt(form.ejectionThreshold)
      );

      toast.info("Deploying contract...");
      const receipt = await tx.wait();
      
      // Extract the deployed group address from the event
      const event = receipt.events?.find(e => e.event === "GroupCreated");
      const groupAddress = event?.args?.groupAddress;
      
      toast.success("Group created on blockchain!");
      setDeployedAddress(groupAddress);
    } catch (e) {
      toast.error("Error: " + e.message);
    }
    setLoading(false);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(deployedAddress);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const inputStyle = {
    width: "100%", padding: "12px", backgroundColor: "#0f172a",
    border: "1px solid #334155", borderRadius: "8px",
    color: "#fff", fontSize: "16px", marginTop: "6px"
  };

  const labelStyle = { color: "#94a3b8", fontSize: "14px", display: "block", marginBottom: "12px" };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}>
      <div style={{ backgroundColor: "#1e3a6e", padding: "16px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "3px solid #f59e0b" }}>
        <h1 style={{ color: "#fff" }}>🪙 ChainBa</h1>
        <button onClick={() => onNavigate("dashboard")}
          style={{ backgroundColor: "transparent", color: "#94a3b8",
            border: "1px solid #334155", padding: "10px 20px", borderRadius: "8px" }}>
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 20px" }}>
        
        {/* SUCCESS SCREEN */}
        {deployedAddress ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
              padding: "40px", border: "1px solid #334155" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
              <h2 style={{ color: "#4ade80", fontSize: "28px", marginBottom: "16px" }}>
                Circle deployed!
              </h2>
              <p style={{ color: "#94a3b8", marginBottom: "8px" }}>
                Your smart contract is live on the blockchain.
              </p>
              <p style={{ color: "#f59e0b", marginBottom: "24px", fontWeight: "bold" }}>
                Next: Join as the first member by paying your {form.stakeAmount} ETH stake
              </p>
              
              <div style={{ backgroundColor: "#0f172a", borderRadius: "8px",
                padding: "16px", marginBottom: "20px", border: "1px solid #334155" }}>
                <p style={{ color: "#f59e0b", fontSize: "13px", wordBreak: "break-all",
                  fontFamily: "'DM Mono', monospace" }}>
                  {deployedAddress}
                </p>
              </div>

              <button onClick={handleCopyAddress}
                style={{ width: "100%", padding: "14px", marginBottom: "12px",
                  backgroundColor: copiedSuccess ? "#4ade80" : "transparent",
                  border: "1px solid #334155", borderRadius: "8px",
                  color: copiedSuccess ? "#0f172a" : "#10b981",
                  fontSize: "16px", fontWeight: "bold", fontFamily: "'DM Mono', monospace" }}>
                {copiedSuccess ? "✓ Copied!" : "Copy address"}
              </button>

              <button onClick={() => onNavigate("group", deployedAddress)}
                style={{ width: "100%", padding: "14px", backgroundColor: "#0EA572",
                  border: "none", borderRadius: "8px", color: "#fff",
                  fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}>
                Join circle & pay stake →
              </button>

              <button onClick={() => onNavigate("dashboard")}
                style={{ width: "100%", padding: "14px", backgroundColor: "transparent",
                  border: "1px solid #334155", borderRadius: "8px", color: "#94a3b8",
                  fontSize: "16px", fontWeight: "bold" }}>
                View dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 style={{ color: "#fff", marginBottom: "8px" }}>Create New Chilimba Group</h2>
            <p style={{ color: "#64748b", marginBottom: "30px" }}>
              Step {step} of 3 — Configure your group contract
            </p>

        {/* PROGRESS */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "30px" }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: "4px", borderRadius: "4px",
              backgroundColor: s <= step ? "#f59e0b" : "#334155" }} />
          ))}
        </div>

        <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
          padding: "30px", border: "1px solid #334155" }}>

          {step === 1 && (
            <div>
              <h3 style={{ color: "#f59e0b", marginBottom: "20px" }}>📋 Basic Details</h3>
              <label style={labelStyle}>
                Group Name
                <input style={inputStyle} value={form.groupName}
                  onChange={e => update("groupName", e.target.value)}
                  placeholder="e.g. Lusaka Sisters 2026" />
              </label>
              <label style={labelStyle}>
                Group Type
                <select style={inputStyle} value={form.groupType}
                  onChange={e => update("groupType", e.target.value)}>
                  <option>Cash</option>
                  <option>Goods</option>
                  <option>Mixed</option>
                </select>
              </label>
              <label style={labelStyle}>
                Number of Members
                <input style={inputStyle} type="number" min="2" max="20"
                  value={form.memberLimit}
                  onChange={e => update("memberLimit", e.target.value)} />
              </label>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ color: "#f59e0b", marginBottom: "20px" }}>💰 Financial Settings</h3>
              
              <CurrencyInput
                label="Contribution Amount per Cycle"
                value={form.contributionAmount}
                onChange={(ethValue) => update("contributionAmount", ethValue)}
                placeholder="Enter amount"
                hint="Amount each member contributes every cycle"
              />
              
              <CurrencyInput
                label="Security Stake per Member"
                value={form.stakeAmount}
                onChange={(ethValue) => update("stakeAmount", ethValue)}
                placeholder="Enter amount"
                hint="One-time deposit held as commitment (refunded on completion)"
              />
              
              <CurrencyInput
                label="Late Penalty Amount"
                value={form.penaltyAmount}
                onChange={(ethValue) => update("penaltyAmount", ethValue)}
                placeholder="Enter amount"
                hint="Penalty charged for late payments after grace period"
              />

              <p style={{ color: "#64748b", fontSize: "11px", fontStyle: "italic", marginTop: "16px" }}>
                Exchange rates are approximate and for display only. All transactions are settled in ETH on-chain.
              </p>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ color: "#f59e0b", marginBottom: "20px" }}>⚖️ Rules & Penalties</h3>
              <label style={labelStyle}>
                Grace Period (days before penalty kicks in)
                <input style={inputStyle} type="number" min="1" max="14"
                  value={form.gracePeriodDays}
                  onChange={e => update("gracePeriodDays", e.target.value)} />
              </label>
              <label style={labelStyle}>
                Eject member after how many defaults?
                <select style={inputStyle} value={form.ejectionThreshold}
                  onChange={e => update("ejectionThreshold", e.target.value)}>
                  <option value="1">1 default</option>
                  <option value="2">2 defaults</option>
                  <option value="3">3 defaults</option>
                </select>
              </label>

              {/* SUMMARY */}
              <div style={{ backgroundColor: "#0f172a", borderRadius: "8px",
                padding: "16px", marginTop: "16px", border: "1px solid #334155" }}>
                <p style={{ color: "#f59e0b", fontWeight: "bold", marginBottom: "8px" }}>
                  Contract Summary
                </p>
                {[
                  ["Group", form.groupName],
                  ["Type", form.groupType],
                  ["Members", form.memberLimit],
                  ["Contribution", `${form.contributionAmount} ETH`],
                  ["Stake", `${form.stakeAmount} ETH`],
                  ["Penalty", `${form.penaltyAmount} ETH`],
                  ["Grace Period", `${form.gracePeriodDays} days`],
                  ["Ejection After", `${form.ejectionThreshold} defaults`]
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between",
                    padding: "4px 0", borderBottom: "1px solid #1e293b" }}>
                    <span style={{ color: "#64748b" }}>{k}</span>
                    <span style={{ color: "#fff" }}>{v}</span>
                  </div>
                ))}
                <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "8px" }}>
                  ⚠ Once deployed these rules CANNOT be changed
                </p>
              </div>

              {/* PAYMENT INFO BOX */}
              <div style={{ backgroundColor: "#ECFDF5", border: "1px solid #0EA572",
                borderRadius: "11px", padding: "14px 16px", marginTop: "16px" }}>
                <p style={{ color: "#065F46", fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>
                  💡 Deployment is free
                </p>
                <p style={{ color: "#047857", fontSize: "13px", marginBottom: "4px" }}>
                  Creating the contract costs only gas fees (minimal on test networks).
                </p>
                <p style={{ color: "#047857", fontSize: "13px", marginBottom: "4px" }}>
                  After deployment, you'll need to join as the first member by paying your stake: <strong>{form.stakeAmount} ETH</strong>
                </p>
                <p style={{ color: "#065F46", fontSize: "11px", marginTop: "8px", fontStyle: "italic" }}>
                  MetaMask will show the stake amount when you join the circle
                </p>
              </div>
            </div>
          )}

          {/* BUTTONS */}
          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ flex: 1, padding: "14px", backgroundColor: "transparent",
                  border: "1px solid #334155", borderRadius: "8px", color: "#94a3b8",
                  fontSize: "16px" }}>
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)}
                style={{ flex: 1, padding: "14px", backgroundColor: "#f59e0b",
                  border: "none", borderRadius: "8px", color: "#0f172a",
                  fontSize: "16px", fontWeight: "bold" }}>
                Next →
              </button>
            ) : (
              <button onClick={deploy} disabled={loading}
                style={{ flex: 1, padding: "14px", backgroundColor: loading ? "#64748b" : "#4ade80",
                  border: "none", borderRadius: "8px", color: "#0f172a",
                  fontSize: "16px", fontWeight: "bold" }}>
                {loading ? "Deploying..." : "🚀 Deploy Contract"}
              </button>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
