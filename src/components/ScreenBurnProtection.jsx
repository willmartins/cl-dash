import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Clock from './Clock';

const ScreenBurnProtection = forwardRef(({ onActiveChange }, ref) => {
  const [isVisible, setIsVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    trigger: () => {
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 30000); // Auto hide after 30s
    }
  }));

  useEffect(() => {
    if (onActiveChange) {
      onActiveChange(isVisible);
    }
  }, [isVisible, onActiveChange]);

  useEffect(() => {
    const cycle = () => {
      const interval = setInterval(() => {
        setIsVisible(true);
        setTimeout(() => setIsVisible(false), 30000);
      }, 120000);

      return () => clearInterval(interval);
    };
    return cycle();
  }, []);

  return (
    <div className={`burn-overlay ${isVisible ? 'visible' : ''}`} onClick={() => setIsVisible(false)}>
      <div className="aurora-mesh"></div>
      <div className="noise-overlay"></div>
      <div className="overlay-content">
        <Clock size="large" variant="analogue-braun" />
      </div>
      <style>{`
        .burn-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transform: translateY(100%);
          transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s ease;
          cursor: pointer;
          overflow: hidden;
        }
        .burn-overlay.visible {
          opacity: 1;
          pointer-events: all;
          transform: translateY(0);
        }
        
        .noise-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.12;
            pointer-events: none;
            z-index: 1;
            mix-blend-mode: overlay;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        .overlay-content {
          position: relative;
          z-index: 2;
          text-align: center;
        }
      `}</style>
    </div>
  );
});

export default ScreenBurnProtection;
