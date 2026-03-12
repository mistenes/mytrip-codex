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
      <span className="beta-banner-icon" role="img" aria-label="Warning">❗</span>
      <span className="beta-banner-text">This workspace is still in beta. If something breaks or feels rough, report it from the bottom-right corner.</span>
      <button className="beta-banner-close" onClick={handleClose} aria-label="Close">×</button>
    </div>
  );
};

export default BetaBanner;
