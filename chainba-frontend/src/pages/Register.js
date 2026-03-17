import { useState } from "react";
import BASE_URL from "../api";
import "./Register.css";

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
    <div className="registerSplit">
      <aside className="registerLeft" aria-label="ChainBa introduction">
        <div className="registerLeftInner">
          <div className="registerBrand" aria-label="ChainBa">
            <span className="registerLogo" aria-hidden="true">
              <span className="registerDiamond registerDiamondA" />
              <span className="registerDiamond registerDiamondB" />
            </span>
            <span className="registerBrandName">ChainBa</span>
          </div>

          <h1 className="registerHeadline">Join your first circle.</h1>
          <p className="registerSubtext">
            Community savings on the blockchain. Automatic. Transparent. Trustless.
          </p>

          <div className="registerTrustBadge" role="note">
            <span className="registerCheck" aria-hidden="true">✓</span>
            <span>No wallet needed — we create one for you</span>
          </div>
        </div>
      </aside>

      <main className="registerRight" aria-label="Create account">
        <div className="registerFormWrap">
          <div className="registerFormHeader">
            <h2 className="registerFormTitle">Create your account</h2>
          </div>

          {error && (
            <div className="registerGlobalError" role="alert">
              {error}
            </div>
          )}

          <div className="registerForm">
            {fields.map((f) => {
              const hint =
                f.name === "nrcNumber" ? "Format: 123456/78/9" : f.hint;
              const hasError = Boolean(fieldErrors[f.name]);

              return (
                <div key={f.name} className="registerField">
                  <label className="registerLabel" htmlFor={`register-${f.name}`}>
                    {f.label}
                  </label>
                  <input
                    id={`register-${f.name}`}
                    className={`registerInput ${hasError ? "registerInputError" : ""}`}
                    name={f.name}
                    type={f.type}
                    value={form[f.name]}
                    onChange={handle}
                    autoComplete={
                      f.name === "password"
                        ? "new-password"
                        : f.name === "confirm"
                          ? "new-password"
                          : f.name === "phone"
                            ? "tel"
                            : "name"
                    }
                    inputMode={f.name === "phone" ? "tel" : undefined}
                  />

                  {hasError ? (
                    <p className="registerFieldError" role="alert">
                      {fieldErrors[f.name]}
                    </p>
                  ) : (
                    <p className="registerHint">{hint}</p>
                  )}
                </div>
              );
            })}

            <button
              className="registerSubmit"
              onClick={submit}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <div className="registerFooter">
              <span>Already have an account? </span>
              <button
                type="button"
                className="registerSignIn"
                onClick={() => onLogin(null, "login")}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}