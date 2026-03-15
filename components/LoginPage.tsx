import React, { useState } from "react";
import { User } from "../types";
import { API_BASE } from "../api";
import "../styles/login.css";
import "../styles/ui-v4.css";

const LoginPage = ({
  onLogin,
  theme,
  onToggleTheme,
}: {
  onLogin: (user: User) => void;
  theme: 'light' | 'dark';
  onToggleTheme?: () => void;
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
    <div className="login-reference-shell">
      <div className="login-reference-orb login-reference-orb-left" aria-hidden="true"></div>
      <div className="login-reference-orb login-reference-orb-right" aria-hidden="true"></div>

      <header className="login-reference-topbar">
        <div className="login-reference-brand">myTrip</div>
        <button
          type="button"
          className="login-reference-theme-toggle"
          onClick={onToggleTheme}
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      </header>

      <main className="login-reference-main">
        <section className="login-reference-card">
          <div className="login-reference-copy">
            <h1>Welcome back</h1>
            <p>Sign in to access your travel workspace.</p>
            <div className="login-reference-note">
              Use the credentials provided for your organizer or traveler account.
            </div>
          </div>

          <form className="login-reference-form" onSubmit={handleLoginSubmit}>
            <div className="login-reference-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Enter your username"
              />
            </div>

            <div className="login-reference-field">
              <div className="login-reference-field-head">
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className="login-reference-forgot"
                  onClick={() => (window.location.href = '/forgot-password')}
                >
                  Forgot?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="btn btn-primary login-reference-submit">
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>

            <p className="login-reference-footnote">
              Use the credentials assigned to your account.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
};


export default LoginPage;
