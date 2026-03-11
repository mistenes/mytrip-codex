import React, { useState } from "react";
import { API_BASE } from "../api";
import "../styles/login.css";

const ResetPasswordPage = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("A jelszavak nem egyeznek");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      if (!res.ok) {
        setError("Érvénytelen vagy lejárt token");
      } else {
        window.location.href = "/reset-password/confirm";
      }
    } catch {
      setError("Kérés sikertelen");
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Érvénytelen link</h1>
          <button className="btn btn-primary" onClick={() => (window.location.href = "/")}>Vissza a bejelentkezéshez</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Új jelszó</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Új jelszó</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Jelszó megerősítése</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary">Mentés</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
