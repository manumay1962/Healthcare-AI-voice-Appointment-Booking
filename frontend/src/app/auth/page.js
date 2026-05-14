"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

const API_BASE = "http://localhost:3001/api";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [loginId, setLoginId] = useState(""); // phone or email
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Determine if loginId is email or phone
    const isEmail = loginId.includes("@");
    const body = isEmail
      ? { email: loginId, password: loginPassword }
      : { phone: loginId, password: loginPassword };

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } catch (err) {
      setError("Connection failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (regPassword !== regConfirm) {
      setError("Passwords do not match");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          email: regEmail,
          password: regPassword,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } catch (err) {
      setError("Connection failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.authPage}>
      <div className={styles.authCard}>
        {/* ─── Left Side: Branding ─────────────── */}
        <div className={styles.authBranding}>
          <div className={styles.brandContent}>
            <span className={styles.brandIcon}>🏥</span>
            <h1>City Health Clinic</h1>
            <p>AI-Powered Appointment Scheduling</p>
            <div className={styles.features}>
              <div className={styles.feature}>
                <span>🤖</span>
                <span>Voice AI receptionist powered by Bolna</span>
              </div>
              <div className={styles.feature}>
                <span>📞</span>
                <span>Book appointments via phone call</span>
              </div>
              <div className={styles.feature}>
                <span>📊</span>
                <span>Real-time appointment dashboard</span>
              </div>
              <div className={styles.feature}>
                <span>👨‍⚕️</span>
                <span>3 specialist doctors available</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Side: Form ───────────────── */}
        <div className={styles.authForm}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${isLogin ? styles.tabActive : ""}`}
              onClick={() => { setIsLogin(true); setError(""); }}
            >
              Login
            </button>
            <button
              className={`${styles.tab} ${!isLogin ? styles.tabActive : ""}`}
              onClick={() => { setIsLogin(false); setError(""); }}
            >
              Register
            </button>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {isLogin ? (
            /* ─── Login Form ────────────────────── */
            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.formGroup}>
                <label>📱 Phone Number or Email</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210 or john@example.com"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>🔒 Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Signing in..." : "Sign In →"}
              </button>
              <p className={styles.switchText}>
                Don&apos;t have an account?{" "}
                <button type="button" className={styles.switchLink} onClick={() => { setIsLogin(false); setError(""); }}>
                  Register here
                </button>
              </p>
            </form>
          ) : (
            /* ─── Register Form ─────────────────── */
            <form onSubmit={handleRegister} className={styles.form}>
              <div className={styles.formGroup}>
                <label>👤 Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>📱 Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  required
                />
                <span className={styles.hint}>Used for AI agent calls — no OTP needed</span>
              </div>
              <div className={styles.formGroup}>
                <label>📧 Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>🔒 Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 chars"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>🔒 Confirm</label>
                  <input
                    type="password"
                    placeholder="Re-enter"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Creating account..." : "Create Account →"}
              </button>
              <p className={styles.switchText}>
                Already have an account?{" "}
                <button type="button" className={styles.switchLink} onClick={() => { setIsLogin(true); setError(""); }}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
