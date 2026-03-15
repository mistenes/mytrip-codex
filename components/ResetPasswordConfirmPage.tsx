import React, { useEffect } from "react";

const ResetPasswordConfirmPage = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="login-container">
      <div className="auth-side-panel">
        <span className="auth-kicker">Password updated</span>
        <h2>Your access has been secured again.</h2>
        <p>We are redirecting you to sign in so you can continue where you left off.</p>
      </div>
      <div className="login-box auth-box">
        <span className="auth-kicker">Success</span>
        <h1>Password updated</h1>
        <p>Redirecting to sign in...</p>
        <button className="btn btn-primary" onClick={() => (window.location.href = "/")}>Sign in</button>
      </div>
    </div>
  );
};

export default ResetPasswordConfirmPage;
