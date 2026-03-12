import React, { useState } from "react";
import { User } from "../types";
import { API_BASE } from "../api";
import "../styles/login.css";

const ChangePasswordPage = ({ user, onSuccess }: { user: User; onSuccess: () => void }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== verifyPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Something went wrong.' }));
        setError(data.message || 'Something went wrong.');
      } else {
        onSuccess();
      }
    } catch {
      setError('Something went wrong.');
    }
  };

  return (
    <div className="login-container">
      <div className="auth-side-panel">
        <span className="auth-kicker">Security step</span>
        <h2>Update your password before entering the workspace.</h2>
        <p>This keeps the shared travel operations environment secure for every organizer and traveler.</p>
      </div>
      <div className="login-box auth-box">
        <span className="auth-kicker">Required action</span>
        <h1>Password change required</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current password</label>
            <input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New password</label>
            <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="verifyPassword">Confirm new password</label>
            <input id="verifyPassword" type="password" value={verifyPassword} onChange={e => setVerifyPassword(e.target.value)} required />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary">Save password</button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
