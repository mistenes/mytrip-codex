import React, { useState } from "react";
import { User } from "../types";
import { API_BASE } from "../api";
import "../styles/account-settings.css";

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
      setError("A jelszavak nem egyeznek.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Hiba történt" }));
        setError(data.message || "Hiba történt");
      } else {
        setSuccess("Jelszó frissítve.");
        setCurrentPassword("");
        setNewPassword("");
        setVerifyPassword("");
      }
    } catch {
      setError("Hiba történt");
    }
  };

  return (
    <div className="account-settings">
      <h2>Beállítások</h2>
      <form onSubmit={handleSubmit} className="change-password-form">
        <div className="form-group">
          <label htmlFor="currentPassword">Jelenlegi jelszó</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">Új jelszó</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="verifyPassword">Új jelszó ismét</label>
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
          Mentés
        </button>
      </form>
    </div>
  );
};

export default AccountSettings;

