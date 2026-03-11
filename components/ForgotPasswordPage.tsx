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
      setError("Kérés sikertelen.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {sent ? (
          <>
            <h1>E-mail elküldve</h1>
            <p>Ha létezik ilyen fiók, jelszó-visszaállító linket küldtünk.</p>
            <button className="btn btn-primary" onClick={() => (window.location.href = "/")}>Vissza a bejelentkezéshez</button>
          </>
        ) : (
          <>
            <h1>Elfelejtett jelszó</h1>
            <p>Adja meg e-mail címét vagy felhasználónevét.</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="identifier">Email vagy felhasználónév</label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="btn btn-primary">Küldés</button>
              <button type="button" className="link-button" onClick={() => (window.location.href = "/")}>Mégse</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
