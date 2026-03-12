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
    <div className="login-container" style={siteSettings?.loginBackground ? { backgroundImage: `url(${siteSettings.loginBackground})` } : undefined}>
      <div className="login-hero">
        <span className="login-kicker">Travel operations, refined</span>
        <h2>Trips, documents, and payments finally live in one polished operating system.</h2>
        <p>Travelers, organizers, and admins work from the same calm control surface, with cleaner priorities and faster access to what matters next.</p>
        <div className="login-hero-band">
          <div className="login-stat-card">
            <strong>1</strong>
            <span>shared operations workspace</span>
          </div>
          <div className="login-stat-card">
            <strong>3</strong>
            <span>roles in one system</span>
          </div>
          <div className="login-stat-card">
            <strong>0</strong>
            <span>lost updates in inbox chaos</span>
          </div>
        </div>
        <div className="login-feature-list">
          <div className="login-feature-item">
            <strong>Document cockpit</strong>
            <span>Tickets, PDFs, traveler uploads, and personal data are organized in one place.</span>
          </div>
          <div className="login-feature-item">
            <strong>Payments credited automatically</strong>
            <span>After Stripe or PayPal payment, the credit lands directly in trip finance records.</span>
          </div>
          <div className="login-feature-item">
            <strong>Clearer travel operations</strong>
            <span>Less chaos, stronger hierarchy, and faster orientation across every role.</span>
          </div>
        </div>
      </div>
      <div className="login-box">
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
  );
};


export default LoginPage;
