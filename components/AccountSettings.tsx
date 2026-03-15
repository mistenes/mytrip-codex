import React, { useState } from "react";
import { User } from "../types";
import { API_BASE } from "../api";

const AccountSettings = ({ user }: { user: User }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== verifyPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Something went wrong." }));
        setError(data.message || "Something went wrong.");
      } else {
        setSuccess("Password updated.");
        setCurrentPassword("");
        setNewPassword("");
        setVerifyPassword("");
      }
    } catch {
      setError("Something went wrong.");
    }
  };

  return (
    <div className="settings-shell">
      <section className="settings-hero">
        <div>
          <span className="settings-kicker">Account</span>
          <h2>Security settings</h2>
          <p>Keep your workspace access secure with a password update flow that works cleanly on desktop and mobile.</p>
        </div>
        <div className="settings-hero-card">
          <span>Password hygiene</span>
          <strong>Use a unique password for trip operations.</strong>
        </div>
      </section>

      <section className="settings-panel account-settings">
        <div className="settings-panel-head">
          <div>
            <span className="settings-panel-kicker">Credentials</span>
            <h3>Change password</h3>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current password</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="verifyPassword">Confirm new password</label>
            <input
              id="verifyPassword"
              type="password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {success && !error && <p className="success-message">{success}</p>}
          <button type="submit" className="btn btn-primary">
            Save password
          </button>
        </form>
      </section>
    </div>
  );
};

export default AccountSettings;
