import { useState } from "react";
import { ethers } from "ethers";
import { FACTORY_ADDRESS, FACTORY_ABI } from "../contracts/config";
import { toast } from "react-toastify";

export default function CreateGroup({ account, onNavigate }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
      toast.info("Deploying group contract...");
      await tx.wait();
      toast.success("✅ Group created on blockchain!");
      onNavigate("dashboard");
    } catch(e) {
      toast.error("Error: " + (e.reason || e.message));
    }
    setLoading(false);
  };

  const inp = {
    width: "100%", padding: "12px", backgroundColor: "#0f172a",
    border: "1px solid #334155", borderRadius: "8px",
    color: "#fff", fontSize: "15px", marginTop: "6px"
  };

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

      <div style={{ maxWidth: "580px", margin: "40px auto", padding: "0 20px" }}>
        <h2 style={{ color: "#fff", marginBottom: "6px" }}>Create Chilimba Group</h2>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>Step {step} of 3</p>

        <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex: 1, height: "4px", borderRadius: "4px",
              backgroundColor: s <= step ? "#f59e0b" : "#334155" }} />
          ))}
        </div>

        <div style={{ backgroundColor: "#1e293b", borderRadius: "12px",
          padding: "28px", border: "1px solid #334155" }}>

          {step === 1 && (
            <div>
              <h3 style={{ color: "#f59e0b", marginBottom: "20px" }}>📋 Basic Details</h3>
              {[
                ["Group Name", "groupName", "text", "e.g. Lusaka Sisters 2026"],
                ["Number of Members", "memberLimit", "number", "4"]
              ].map(([label, key, type, ph]) => (
                <div key={key} style={{ marginBottom: "16px" }}>
                  <label style={{ color: "#94a3b8", fontSize: "14px" }}>{label}</label>
                  <input type={type} style={inp} placeholder={ph}
                    value={form[key]} onChange={e => update(key, e.target.value)} />
                </div>
              ))}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: "#94a3b8", fontSize: "14px" }}>Group Type</label>
                <select style={inp} value={form.groupType}
                  onChange={e => update("groupType", e.target.value)}>
                  <option>Cash</option>
                  <option>Goods</option>
                  <option>Mixed</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ color: "#f59e0b", marginBottom: "20px" }}>💰 Amounts (ETH)</h3>
              <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>
                1 ETH = K1,000 for demo purposes
              </p>
              {[
                ["Contribution per Cycle (ETH)", "contributionAmount", "e.g. 1.0"],
                ["Security Stake per Member (ETH)", "stakeAmount", "e.g. 0.2"],
                ["Late Penalty Amount (ETH)", "penaltyAmount", "e.g. 0.1"]
              ].map(([label, key, ph]) => (
                <div key={key} style={{ marginBottom: "16px" }}>
                  <label style={{ color: "#94a3b8", fontSize: "14px" }}>{label}</label>
                  <input type="number" step="0.01" style={inp}
                    placeholder={ph} value={form[key]}
                    onChange={e => update(key, e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ color: "#f59e0b", marginBottom: "20px" }}>⚖️ Rules</h3>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: "#94a3b8", fontSize: "14px" }}>
                  Grace Period (days)
                </label>
                <input type="number" style={inp} value={form.gracePeriodDays}
                  onChange={e => update("gracePeriodDays", e.target.value)} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#94a3b8", fontSize: "14px" }}>
                  Eject after how many defaults?
                </label>
                <select style={inp} value={form.ejectionThreshold}
                  onChange={e => update("ejectionThreshold", e.target.value)}>
                  <option value="1">1 default</option>
                  <option value="2">2 defaults</option>
                  <option value="3">3 defaults</option>
                </select>
              </div>

              <div style={{ backgroundColor: "#0f172a", borderRadius: "8px",
                padding: "16px", border: "1px solid #334155" }}>
                <p style={{ color: "#f59e0b", fontWeight: "bold", marginBottom: "10px" }}>
                  📋 Contract Summary
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
                    padding: "5px 0", borderBottom: "1px solid #1e293b" }}>
                    <span style={{ color: "#64748b" }}>{k}</span>
                    <span style={{ color: "#fff" }}>{v}</span>
                  </div>
                ))}
                <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "10px" }}>
                  ⚠ Once deployed these rules CANNOT be changed
                </p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ flex: 1, padding: "14px", backgroundColor: "transparent",
                  border: "1px solid #334155", borderRadius: "8px",
                  color: "#94a3b8", fontSize: "15px" }}>
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)}
                style={{ flex: 1, padding: "14px", backgroundColor: "#f59e0b",
                  border: "none", borderRadius: "8px", color: "#0f172a",
                  fontSize: "15px", fontWeight: "bold" }}>
                Next →
              </button>
            ) : (
              <button onClick={deploy} disabled={loading}
                style={{ flex: 1, padding: "14px",
                  backgroundColor: loading ? "#64748b" : "#4ade80",
                  border: "none", borderRadius: "8px", color: "#0f172a",
                  fontSize: "15px", fontWeight: "bold" }}>
                {loading ? "Deploying..." : "🚀 Deploy Contract"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
