import { useState } from "react";
import BASE_URL from "../api";

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ fullName: "", phone: "", nrcNumber: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    setError("");
  };

  const validate = () => {
    const errs = {};
    const phoneRegex = new RegExp("^0[679][0-9]{8}$");
    const nrcRegex = new RegExp("^[0-9]{6}/[0-9]{2}/[0-9]$");
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    else if (!phoneRegex.test(form.phone)) errs.phone = "Enter valid Zambian number e.g. 0971234567";
    if (!form.nrcNumber.trim()) errs.nrcNumber = "NRC number is required";
    else if (!nrcRegex.test(form.nrcNumber)) errs.nrcNumber = "NRC format must be 123456/78/1";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (!form.confirm) errs.confirm = "Please confirm your password";
    else if (form.password !== form.confirm) errs.confirm = "Passwords do not match";
    return errs;
  };

  const submit = async () => {
    setError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch(BASE_URL + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: form.fullName.trim(), phone: form.phone.trim(), nrcNumber: form.nrcNumber.trim(), password: form.password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      localStorage.setItem("chainba_token", data.token);
      localStorage.setItem("chainba_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "Full Name", name: "fullName", type: "text", hint: "Enter your full name as on NRC" },
    { label: "Phone Number", name: "phone", type: "text", hint: "Zambian number e.g. 0971234567" },
    { label: "NRC Number", name: "nrcNumber", type: "text", hint: "Format: 123456/78/1" },
    { label: "Password", name: "password", type: "password", hint: "At least 6 characters" },
    { label: "Confirm Password", name: "confirm", type: "password", hint: "Repeat your password" }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e3a6e 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#1e293b", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "440px", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🪙</div>
          <h1 style={{ color: "#f59e0b", fontSize: "28px", fontWeight: "bold", margin: 0 }}>ChainBa</h1>
          <p style={{ color: "#94a3b8", marginTop: "8px", margin: "8px 0 0" }}>Create your account</p>
        </div>

        {error && (
          <div style={{ background: "#7f1d1d", color: "#fca5a5", padding: "14px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", textAlign: "center", lineHeight: 1.5 }}>
            ⚠ {error}
          </div>
        )}

        {fields.map(f => (
          <div key={f.name} style={{ marginBottom: "14px" }}>
            <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "6px" }}>{f.label}</label>
            <input
              name={f.name} type={f.type} value={form[f.name]} onChange={handle}
              style={{ width: "100%", background: "#0f172a", border: fieldErrors[f.name] ? "1px solid #ef4444" : "1px solid #334155", borderRadius: "8px", padding: "12px", color: "#f1f5f9", fontSize: "15px", boxSizing: "border-box", outline: "none" }}
            />
            {fieldErrors[f.name]
              ? <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0" }}>⚠ {fieldErrors[f.name]}</p>
              : <p style={{ color: "#475569", fontSize: "11px", margin: "4px 0 0" }}>{f.hint}</p>
            }
          </div>
        ))}

        <button onClick={submit} disabled={loading}
          style={{ width: "100%", background: loading ? "#64748b" : "#f59e0b", color: "#0f172a", border: "none", borderRadius: "8px", padding: "14px", fontSize: "16px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", marginTop: "8px" }}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <span style={{ color: "#94a3b8", fontSize: "14px" }}>Already have an account? </span>
          <button onClick={() => onLogin(null, "login")} style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>Login</button>
        </div>

        <div style={{ marginTop: "20px", padding: "12px", background: "#0f172a", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ color: "#475569", fontSize: "12px", margin: 0 }}>🔒 A blockchain wallet is automatically created for you</p>
        </div>
      </div>
    </div>
  );
}