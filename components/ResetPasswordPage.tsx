import React, { useState } from "react";
import { API_BASE } from "../api";

const ResetPasswordPage = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      if (!res.ok) {
        setError("Invalid or expired reset link.");
      } else {
        window.location.href = "/reset-password/confirm";
      }
    } catch {
      setError("Request failed. Please try again.");
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="auth-side-panel">
          <span className="auth-kicker">Reset link</span>
          <h2>This link is no longer valid.</h2>
          <p>Request a new reset link from the sign-in screen if you still need access.</p>
        </div>
        <div className="login-box auth-box">
          <span className="auth-kicker">Link invalid</span>
          <h1>Invalid reset link</h1>
          <button className="btn btn-primary" onClick={() => (window.location.href = "/")}>Back to sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="auth-side-panel">
        <span className="auth-kicker">New password</span>
        <h2>Create a strong password for your workspace access.</h2>
        <p>Use a password you have not used elsewhere and keep it memorable enough for daily operations.</p>
      </div>
      <div className="login-box auth-box">
        <span className="auth-kicker">Complete reset</span>
        <h1>Set new password</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary">Save password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
