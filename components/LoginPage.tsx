import React, { useState, useEffect } from "react";
import { User, SiteSettings } from "../types";
import { API_BASE } from "../api";
import "../styles/login.css";

const LoginPage = ({ onLogin, theme }: { onLogin: (user: User) => void; theme: 'light' | 'dark' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/logo`)
      .then(res => res.json())
      .then(setSiteSettings)
      .catch(() => {});
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Érvénytelen felhasználónév vagy jelszó.' }));
        setError(data.message || 'Érvénytelen felhasználónév vagy jelszó.');
      } else {
        const data = await res.json();
        onLogin(data);
      }
    } catch {
      setError('Bejelentkezés sikertelen.');
    }
  };
    
  return (
    <div className="login-container" style={siteSettings?.loginBackground ? { backgroundImage: `url(${siteSettings.loginBackground})` } : undefined}>
      <div className="login-hero">
        <span className="login-kicker">Travel operations, refined</span>
        <h2>Minden ut, dokumentum es befizetes egy letisztult munkafeluleten.</h2>
        <p>Modern utasszervezes adminoknak, szervezoknek es utazoknak ugyanabban a rendszerben.</p>
      </div>
      <div className="login-box">
        {(() => {
          const src = theme === 'dark' ? (siteSettings?.logoDark || siteSettings?.logoLight) : (siteSettings?.logoLight || siteSettings?.logoDark);
          return src ? <img src={src} alt="myTrip logo" className="login-logo" /> : null;
        })()}
        <h1>myTrip</h1>
        <p>Kérjük, jelentkezzen be a folytatáshoz</p>
        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label htmlFor="username">Felhasználónév</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Jelszó</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary">Bejelentkezés</button>
          <button
            type="button"
            className="link-button"
            onClick={() => (window.location.href = '/forgot-password')}
          >
            Elfelejtett jelszó?
          </button>
        </form>

      </div>
    </div>
  );
};


export default LoginPage;
