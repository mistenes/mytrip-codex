import React, { useEffect } from "react";
import "../styles/login.css";

const ResetPasswordConfirmPage = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Jelszó frissítve</h1>
        <p>Átirányítás a bejelentkezéshez...</p>
        <button className="btn btn-primary" onClick={() => (window.location.href = "/")}>Bejelentkezés</button>
      </div>
    </div>
  );
};

export default ResetPasswordConfirmPage;
