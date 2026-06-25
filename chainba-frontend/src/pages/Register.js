import { useState } from "react";
import BASE_URL from "../api";
import "./Register.css";

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ fullName: "", phone: "", nrcNumber: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const submit = async (e) => {
    e.preventDefault();
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

  return (
    <main className="register-page">
      {/* Left Panel: Brand Identity (40%) */}
      <section className="register-left-panel">
        {/* Background Image with Overlay */}
        <div className="register-background">
          <img 
            className="register-background-image" 
            alt="Abstract deep emerald and navy architectural forms" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKhgcSi7T4pqAyjaYePEHvU1IcNvw4cIf8T7ObSEVHmKGE8dcun1wJbHr-7jO2-dMrLNZqcBrEAr8CVpyfWruju8j6WgxFgdomdpKCbUDM7UBXbrekZiNXDlc5sRFqOS-VE9WaURZxzt6w1wNjSQokmpvdDXHGCTRlFoyNmC38ECu0Dq8Ra2MpoVWDwozm08zLQV6Dl8FBHSdb6AiD9i1wwtkGzamyvxfGyHXzbxXr-CikWT0UlHKXrFJLNRVubAC1tstlI57udm7N"
          />
          <div className="register-background-overlay"></div>
        </div>

        {/* Content */}
        <div className="register-left-content">
          <div className="register-brand">
            <span className="material-symbols-outlined register-brand-icon">account_balance</span>
            <h1 className="register-brand-name font-headline">ChainBa</h1>
          </div>
          
          <div className="register-hero">
            <h2 className="register-headline font-headline">
              The Modern <br /><span className="register-headline-accent">Custodian.</span>
            </h2>
            <p className="register-subheadline font-body">
              Redefining the heritage of community finance through decentralized transparency and institutional-grade security.
            </p>
          </div>
        </div>

        {/* Trust Badge & Kente */}
        <div className="register-left-footer">
          <div className="register-trust-badge">
            <div className="register-trust-icon">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <div>
              <p className="register-trust-title">Regulated Security</p>
              <p className="register-trust-subtitle">Certified decentralized protocols</p>
            </div>
          </div>
          <div className="kente-divider"></div>
        </div>
      </section>

      {/* Right Panel: Form (60%) */}
      <section className="register-right-panel">
        <div className="register-form-container">
          {/* Header */}
          <div className="register-header">
            <h3 className="register-form-title font-headline">Create Account</h3>
            <p className="register-form-subtitle font-body">
              Begin your journey with the elite circle of decentralized wealth management.
            </p>
          </div>

          {/* Global Error */}
          {error && (
            <div className="register-global-error" role="alert">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form className="register-form" onSubmit={submit}>
            {/* Full Name */}
            <div className="register-field">
              <label className="register-label font-label" htmlFor="register-fullName">
                Full Name
              </label>
              <input
                id="register-fullName"
                className={`register-input font-body ${fieldErrors.fullName ? "register-input-error" : ""}`}
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handle}
                placeholder="Enter your full legal name"
                autoComplete="name"
              />
              {fieldErrors.fullName && (
                <p className="register-field-error font-body" role="alert">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            <div className="register-field-row">
              {/* Phone Number */}
              <div className="register-field">
                <label className="register-label font-label" htmlFor="register-phone">
                  Phone Number
                </label>
                <input
                  id="register-phone"
                  className={`register-input font-body ${fieldErrors.phone ? "register-input-error" : ""}`}
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handle}
                  placeholder="+260 9xx xxx xxx"
                  autoComplete="tel"
                  inputMode="tel"
                />
                {fieldErrors.phone && (
                  <p className="register-field-error font-body" role="alert">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              {/* NRC Number */}
              <div className="register-field">
                <label className="register-label font-label" htmlFor="register-nrcNumber">
                  NRC Number
                </label>
                <input
                  id="register-nrcNumber"
                  className={`register-input font-body ${fieldErrors.nrcNumber ? "register-input-error" : ""}`}
                  name="nrcNumber"
                  type="text"
                  value={form.nrcNumber}
                  onChange={handle}
                  placeholder="000000/00/1"
                />
                {fieldErrors.nrcNumber && (
                  <p className="register-field-error font-body" role="alert">
                    {fieldErrors.nrcNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="register-field">
              <label className="register-label font-label" htmlFor="register-password">
                Password
              </label>
              <div className="register-input-wrapper">
                <input
                  id="register-password"
                  className={`register-input font-body ${fieldErrors.password ? "register-input-error" : ""}`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handle}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                />
                <button
                  className="register-toggle-password"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="register-field-error font-body" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="register-field">
              <label className="register-label font-label" htmlFor="register-confirm">
                Confirm Password
              </label>
              <div className="register-input-wrapper">
                <input
                  id="register-confirm"
                  className={`register-input font-body ${fieldErrors.confirm ? "register-input-error" : ""}`}
                  name="confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirm}
                  onChange={handle}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                />
                <button
                  className="register-toggle-password"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined">
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {fieldErrors.confirm && (
                <p className="register-field-error font-body" role="alert">
                  {fieldErrors.confirm}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="register-submit-wrapper">
              <button
                className="register-submit font-label"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Register Account"}
                <span className="material-symbols-outlined register-submit-arrow">arrow_forward</span>
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="register-footer">
            <p className="register-footer-text font-body">
              Already have an account?
              <button
                type="button"
                className="register-login-link font-body"
                onClick={() => onLogin(null, "login")}
              >
                Log in
              </button>
            </p>
            <div className="register-footer-links">
              <a className="register-footer-link font-body" href="#help">Help Center</a>
              <a className="register-footer-link font-body" href="#privacy">Privacy Policy</a>
            </div>
          </div>

          {/* Decorative Element */}
          <div className="register-decorative">
            <div className="kente-divider register-decorative-divider"></div>
          </div>
        </div>
      </section>
    </main>
  );
}
