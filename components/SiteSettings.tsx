import React, { useState, useEffect } from "react";
import { API_BASE } from "../api";
import { SiteSettings, User } from "../types";
import "../styles/dashboard.css";
import "../styles/account-settings.css";

interface Props {
  settings: SiteSettings | null;
  onChange: (s: SiteSettings) => void;
  user: User;
}

const SiteSettingsView: React.FC<Props> = ({ settings, onChange, user }) => {
  const [local, setLocal] = useState<SiteSettings>(settings || {});
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setLocal(settings || {});
  }, [settings]);

  useEffect(() => {
    if (!document.getElementById("cloudinary-script")) {
      const script = document.createElement("script");
      script.src = "https://media-library.cloudinary.com/global/all.js";
      script.id = "cloudinary-script";
      document.body.appendChild(script);
    }
  }, []);

  const openWidget = async (field: "logoLight" | "logoDark" | "loginBackground") => {
    const sigRes = await fetch(`${API_BASE}/api/cloudinary-signature`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    if (!sigRes.ok) return;
    const sig = await sigRes.json();
    // @ts-ignore
    const ml = window.cloudinary.createMediaLibrary(
      {
        cloud_name: sig.cloudName,
        api_key: sig.apiKey,
        timestamp: sig.timestamp,
        signature: sig.signature,
        multiple: false,
      },
      {
        insertHandler: (data: any) => {
          if (data.assets && data.assets.length > 0) {
            const url = data.assets[0].secure_url;
            setLocal((prev) => ({ ...prev, [field]: url }));
          }
        },
      }
    );
    ml.show();
  };

  const save = async () => {
    const res = await fetch(`${API_BASE}/api/settings/logo`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(local),
    });
    if (res.ok) {
      const data = await res.json();
      onChange(data);
      setSaveMessage("Brand settings saved.");
    } else {
      setSaveMessage("Save failed. Please try again.");
    }
  };

  return (
    <div className="settings-shell site-settings">
      <section className="settings-hero">
        <div>
          <span className="settings-kicker">Brand system</span>
          <h2>Site settings</h2>
          <p>Control the brand assets used across the workspace, including theme logos and the sign-in background.</p>
        </div>
        <div className="settings-hero-card">
          <span>Visual consistency</span>
          <strong>Light, dark, and auth surfaces stay aligned across the product.</strong>
        </div>
      </section>

      <section className="settings-panel">
        <div className="settings-panel-head">
          <div>
            <span className="settings-panel-kicker">Assets</span>
            <h3>Brand media</h3>
          </div>
          {saveMessage && <p className={saveMessage.includes("failed") ? "error-message" : "success-message"}>{saveMessage}</p>}
        </div>

        <div className="brand-grid">
          <div className="brand-card">
            <label>Light mode logo</label>
            {local.logoLight ? <img src={local.logoLight} className="logo-preview" alt="light logo" /> : <div className="brand-placeholder">No asset selected</div>}
            <button className="btn btn-secondary" onClick={() => openWidget("logoLight")}>Choose asset</button>
          </div>
          <div className="brand-card">
            <label>Dark mode logo</label>
            {local.logoDark ? <img src={local.logoDark} className="logo-preview" alt="dark logo" /> : <div className="brand-placeholder">No asset selected</div>}
            <button className="btn btn-secondary" onClick={() => openWidget("logoDark")}>Choose asset</button>
          </div>
          <div className="brand-card brand-card-wide">
            <label>Login background</label>
            {local.loginBackground ? <img src={local.loginBackground} className="logo-preview" alt="background" /> : <div className="brand-placeholder">No asset selected</div>}
            <button className="btn btn-secondary" onClick={() => openWidget("loginBackground")}>Choose asset</button>
          </div>
        </div>

        <button className="btn btn-primary" onClick={save}>Save brand settings</button>
      </section>
    </div>
  );
};

export default SiteSettingsView;
