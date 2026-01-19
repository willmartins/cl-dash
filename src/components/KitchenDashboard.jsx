import React, { useRef, useEffect, useState } from 'react';
import Clock from './Clock';
import PhotoBox from './PhotoBox';
import ScreenBurnProtection from './ScreenBurnProtection';
import ReviewSlider from './ReviewSlider';

const KitchenDashboard = ({ config }) => {
  const burnRef = useRef();
  const [isSaverActive, setIsSaverActive] = useState(false);

  return (
    <div className="dashboard-root kitchen">
      <ScreenBurnProtection ref={burnRef} onActiveChange={setIsSaverActive} />

      <div className={`dashboard-content ${isSaverActive ? 'fade-out' : 'fade-in'}`}>
        <ReviewSlider reviews={config.reviews} />

        <header className="dash-header">
          {config.logoUrl && (
            <img
              src={config.logoUrl}
              alt="Logo"
              className="logo triggerable"
              onClick={() => burnRef.current?.trigger()}
            />
          )}
          <Clock size="medium" />
        </header>

        <main className="dash-grid">
          <div className="grid-left">
            <div className="photo-container animate-in">
              <PhotoBox images={config.gallery} />
            </div>
          </div>
          <div className="grid-right">
            <div className="glass-card welcome-card animate-in" style={{ animationDelay: '0.2s' }}>
              <p className="big-text">{config.kitchenWelcome}</p>
            </div>
            <div className="glass-card message-card animate-in" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-dim">Kitchen Notes</h2>
              <p className="mid-text">{config.kitchenMessage}</p>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .dashboard-root {
          height: 100vh;
          width: 100vw;
          padding: 3rem 4rem;
          display: flex;
          flex-direction: column;
          background: radial-gradient(circle at top left, #1a1b26, #0c0d12);
          overflow: hidden;
        }

        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease;
        }

        .fade-out {
            opacity: 0;
            transform: scale(0.95);
        }
        .fade-in {
            opacity: 1;
            transform: scale(1);
        }

        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
          flex-shrink: 0;
          margin-bottom: 1rem;
        }
        .logo {
          max-height: 60px;
        }
        .logo.triggerable {
            cursor: pointer;
            transition: transform 0.2s;
        }
        .logo.triggerable:hover {
            transform: scale(1.1);
        }

        .dash-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 2rem;
          min-height: 0;
        }

        .grid-left {
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        
        .photo-container {
           flex: 1;
           min-height: 0;
           border-radius: 24px;
           overflow: hidden;
        }

        .grid-right {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-height: 0;
        }
        
        .welcome-card { 
            height: 160px; /* Match Dispatch fixed height */
            flex-shrink: 0;
            display: flex; 
            align-items: center; 
            padding: 2rem; 
        }
        .message-card { 
            flex: 1; /* Take remaining space */
            padding: 2rem; 
        }

        .text-dim { color: var(--text-dim); text-transform: uppercase; letter-spacing: 2px; font-size: 0.8rem; margin-bottom: 1rem; }
        .big-text { font-size: 2.2rem; font-weight: 800; line-height: 1.1; }
        .mid-text { font-size: 1.3rem; line-height: 1.5; white-space: pre-wrap; color: rgba(255,255,255,0.9); }
      `}</style>
    </div>
  );
};

export default KitchenDashboard;
