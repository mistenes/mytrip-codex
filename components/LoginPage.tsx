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
        const data = await res.json().catch(() => ({ message: 'Invalid username or password.' }));
        setError(data.message || 'Invalid username or password.');
      } else {
        const data = await res.json();
        onLogin(data);
      }
    } catch {
      setError('Login failed. Please try again.');
    }
  };
    
  return (
    <div className="login-container login-container-v2" style={siteSettings?.loginBackground ? { backgroundImage: `url(${siteSettings.loginBackground})` } : undefined}>
      <div className="login-stage-v2">
        <div className="login-hero login-hero-v2">
          <span className="login-kicker">Travel operations, refined</span>
          <h2>Run trips, files, and payments from one clear workspace.</h2>
          <p>Built for organizers and travelers who need structure, not clutter.</p>
          <div className="login-hero-band login-hero-band-v2">
            <div className="login-stat-card">
              <strong>1</strong>
              <span>shared workspace</span>
            </div>
            <div className="login-stat-card">
              <strong>3</strong>
              <span>roles supported</span>
            </div>
            <div className="login-stat-card">
              <strong>0</strong>
              <span>lost trip updates</span>
            </div>
          </div>
        </div>
        <div className="login-box login-box-v2">
          {(() => {
            const src = theme === 'dark' ? (siteSettings?.logoDark || siteSettings?.logoLight) : (siteSettings?.logoLight || siteSettings?.logoDark);
            return src ? <img src={src} alt="myTrip logo" className="login-logo" /> : null;
          })()}
          <div className="login-box-header">
            <span className="auth-kicker">Access workspace</span>
            <h1>myTrip</h1>
            <p>Sign in to your travel operations control center.</p>
          </div>
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
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
              <label htmlFor="password">Password</label>
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
            <button type="submit" className="btn btn-primary">Sign in</button>
            <button
              type="button"
              className="link-button"
              onClick={() => (window.location.href = '/forgot-password')}
            >
              Forgot password?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


export default LoginPage;
