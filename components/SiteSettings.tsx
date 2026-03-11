import React, { useState, useEffect } from "react";
import { API_BASE } from "../api";
import { SiteSettings, User } from "../types";
import "../styles/dashboard.css";

interface Props {
  settings: SiteSettings | null;
  onChange: (s: SiteSettings) => void;
  user: User;
}

const SiteSettingsView: React.FC<Props> = ({ settings, onChange, user }) => {
  const [local, setLocal] = useState<SiteSettings>(settings || {});

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
      alert("Mentve");
    }
  };

  return (
    <div className="site-settings">
      <h2>Oldal beállítások</h2>
      <div className="form-group">
        <label>Világos mód logó</label>
        {local.logoLight && <img src={local.logoLight} className="logo-preview" alt="light logo" />}
        <button className="btn btn-secondary" onClick={() => openWidget("logoLight")}>Kiválasztás</button>
      </div>
      <div className="form-group">
        <label>Sötét mód logó</label>
        {local.logoDark && <img src={local.logoDark} className="logo-preview" alt="dark logo" />}
        <button className="btn btn-secondary" onClick={() => openWidget("logoDark")}>Kiválasztás</button>
      </div>
      <div className="form-group">
        <label>Bejelentkező háttér</label>
        {local.loginBackground && <img src={local.loginBackground} className="logo-preview" alt="background" />}
        <button className="btn btn-secondary" onClick={() => openWidget("loginBackground")}>Kiválasztás</button>
      </div>
      <button className="btn btn-primary" onClick={save}>Mentés</button>
    </div>
  );
};

export default SiteSettingsView;
