import { useState } from "react";
import "./Login.css";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError("");
    if (!form.phone || !form.password)
      return setError("All fields are required");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, password: form.password })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Login failed");
      localStorage.setItem("chainba_token", data.token);
      localStorage.setItem("chainba_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="loginPage">
      <div className="loginCard" role="region" aria-label="Sign in">
        <div className="loginTop">
          <div className="loginBrand" aria-label="ChainBa">
            <span className="loginLogo" aria-hidden="true">
              <span className="loginDiamond loginDiamondA" />
              <span className="loginDiamond loginDiamondB" />
            </span>
            <span className="loginBrandName">ChainBa</span>
          </div>

          <h1 className="loginHeadline">Welcome back.</h1>
          <p className="loginSubtext">Sign in to your circles.</p>
        </div>

        {error && (
          <div className="loginError" role="alert">
            {error}
          </div>
        )}

        <div className="loginForm">
          <div className="loginField">
            <label className="loginLabel" htmlFor="login-phone">Phone Number</label>
            <input
              id="login-phone"
              className="loginInput"
              name="phone"
              type="text"
              placeholder="0971234567"
              value={form.phone}
              onChange={handle}
              onKeyDown={handleKey}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div className="loginField">
            <label className="loginLabel" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="loginInput"
              name="password"
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={handle}
              onKeyDown={handleKey}
              autoComplete="current-password"
            />
          </div>

          <button className="loginSubmit" onClick={submit} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="loginBottom">
            <div className="loginAlt">
              <span>Don't have an account? </span>
              <button type="button" className="loginLink" onClick={() => onLogin(null, "register")}>
                Register
              </button>
            </div>
            <button type="button" className="loginLink loginLinkSecondary" onClick={() => onLogin(null, "connect")}>
              Connect wallet instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}