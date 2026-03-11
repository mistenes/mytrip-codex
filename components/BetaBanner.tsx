import React, { useState, useEffect, useRef } from 'react';
import '../styles/beta-banner.css';

const BetaBanner = () => {
  const [visible, setVisible] = useState(() => !localStorage.getItem('betaBannerDismissed'));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (visible && ref.current) {
      const height = ref.current.offsetHeight;
      root.style.setProperty('--beta-banner-height', `${height}px`);
      document.body.classList.add('has-beta-banner');
    } else {
      root.style.removeProperty('--beta-banner-height');
      document.body.classList.remove('has-beta-banner');
    }
    return () => {
      root.style.removeProperty('--beta-banner-height');
      document.body.classList.remove('has-beta-banner');
    };
  }, [visible]);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem('betaBannerDismissed', 'true');
  };

  return (
    <div ref={ref} className="beta-banner">
      <span className="beta-banner-icon" role="img" aria-label="Figyelmeztetés">❗</span>
      <span className="beta-banner-text">Ez az oldal béta állapotban működik, előfordulhatnak hibák. Kérjük, jelezd őket a jobb alsó sarokban.</span>
      <button className="beta-banner-close" onClick={handleClose} aria-label="Bezárás">×</button>
    </div>
  );
};

export default BetaBanner;
