import React, { useState } from "react";
import { API_BASE } from "../api";
import "../styles/login.css";

const ForgotPasswordPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await fetch(`${API_BASE}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });
      setSent(true);
    } catch {
      setError("Request failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="auth-side-panel">
        <span className="auth-kicker">Password recovery</span>
        <h2>Recover access without losing momentum.</h2>
        <p>We will send a reset link if the account exists. You can use either the email address or the username tied to the account.</p>
      </div>
      <div className="login-box auth-box">
        {sent ? (
          <>
            <span className="auth-kicker">Email sent</span>
            <h1>Check your inbox</h1>
            <p>If the account exists, we sent a password reset link.</p>
            <button className="btn btn-primary" onClick={() => (window.location.href = "/")}>Back to sign in</button>
          </>
        ) : (
          <>
            <span className="auth-kicker">Reset access</span>
            <h1>Forgot password?</h1>
            <p>Enter your email address or username to receive a reset link.</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="identifier">Email or username</label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="btn btn-primary">Send reset link</button>
              <button type="button" className="link-button" onClick={() => (window.location.href = "/")}>Cancel</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
