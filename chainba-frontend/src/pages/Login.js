import { useState } from "react";
import "./Login.css";

export default function Login({ onNavigate }) {
  const [form, setForm] = useState({ phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
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
      onNavigate("dashboard");
    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") submit(e); };

  return (
    <div className="login-page">
      {/* Subtle Background Texture */}
      <div className="login-bg-texture"></div>
      
      {/* Main Auth Canvas */}
      <main className="login-main">
        {/* The Central Login Card */}
        <div className="login-card">
          {/* Kente Signature Strip */}
          <div className="kente-divider" style={{ width: '100%' }}></div>
          
          <div className="login-content">
            {/* Brand Header */}
            <div className="login-header">
              <h1 className="font-headline login-brand-title">ChainBa</h1>
              <p className="font-headline login-welcome">Welcome back.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="login-error" role="alert">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}

            {/* Login Form */}
            <form className="login-form" onSubmit={submit}>
              {/* Phone Input Group */}
              <div className="login-field-group">
                <label className="login-label font-label">Phone Number</label>
                <div className="login-input-wrapper">
                  <span className="material-symbols-outlined login-input-icon">call</span>
                  <input
                    className="login-input font-label"
                    placeholder="+260 9xx xxx xxx"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handle}
                    onKeyDown={handleKey}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Password Input Group */}
              <div className="login-field-group">
                <div className="login-label-row">
                  <label className="login-label font-label">Password</label>
                  <button 
                    type="button" 
                    className="login-forgot font-label"
                    onClick={() => alert('Forgot password functionality coming soon!')}
                  >
                    Forgot?
                  </button>
                </div>
                <div className="login-input-wrapper">
                  <span className="material-symbols-outlined login-input-icon">lock</span>
                  <input
                    className="login-input font-label"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handle}
                    onKeyDown={handleKey}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Primary Action */}
              <button 
                className="login-submit font-label" 
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Alternative Actions */}
            <div className="login-alternatives">
              <div className="login-divider">
                <div className="login-divider-line"></div>
                <span className="login-divider-text font-label">or continue with</span>
              </div>
              
              <button 
                className="login-wallet-btn font-label"
                onClick={() => alert('Wallet connection coming soon!')}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_balance_wallet
                </span>
                Connect wallet
              </button>
            </div>

            {/* Footer Links */}
            <div className="login-footer">
              <p className="login-footer-text font-label">
                New to the circle?{' '}
                <button 
                  type="button"
                  className="login-link"
                  onClick={() => onNavigate('register')}
                >
                  Register
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* System Narrative Info */}
        <div className="login-narrative">
          <div className="login-narrative-left">
            <p className="font-headline login-narrative-text">
              "Secure, transparent, and community-driven. The modern custodian of your digital assets."
            </p>
          </div>
          <div className="login-narrative-right">
            <span className="login-status-label font-label">Status</span>
            <div className="login-status">
              <div className="login-status-dot"></div>
              <span className="login-status-text font-label">Mainnet Active</span>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative Corner Elements */}
      <div className="login-decorative-corner"></div>
    </div>
  );
}
