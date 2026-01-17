import React, { useRef, useState } from 'react';
import Clock from './Clock';
import PhotoBox from './PhotoBox';
import ScreenBurnProtection from './ScreenBurnProtection';
import ReviewSlider from './ReviewSlider';

const DispatchDashboard = ({ config }) => {
  const burnRef = useRef();
  const [isSaverActive, setIsSaverActive] = useState(false);

  return (
    <div className="dashboard-root dispatch">
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
          {/* Left Lane: Retail & Comms */}
          <div className="lane left-lane">
            <div className="stats-row">
              <OrderGroup
                name="Retail Orders"
                today={config.shopifyData.retail.today}
                fulfill={config.shopifyData.retail.unfulfilled}
                color="#7c3aed"
                delay="0.1s"
              />
              <OrderGroup
                name="Trade Orders"
                today={config.shopifyData.trade.today}
                fulfill={config.shopifyData.trade.unfulfilled}
                color="#10b981"
                delay="0.3s"
              />
            </div>

            <div className="glass-card welcome-card animate-in" style={{ animationDelay: '0.2s' }}>
              <p className="big-text">{config.dispatchWelcome}</p>
            </div>

            <div className="glass-card message-card animate-in" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-dim">Dispatch Notes</h2>
              <p className="mid-text">{config.dispatchMessage}</p>
            </div>
          </div>

          {/* Right Lane: Trade & Gallery */}
          <div className="lane right-lane">
            <div className="photo-container animate-in" style={{ animationDelay: '0.4s' }}>
              <PhotoBox images={config.gallery} />
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .dashboard-root {
          height: 100vh;
          width: 100vw;
          padding: 3rem 4rem; /* Increased padding */
          display: flex;
          flex-direction: column;
          background: radial-gradient(circle at top left, #1a1b26, #0c0d12);
          overflow: hidden;
        }
        
        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 2rem; /* Increased gap under header */
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
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          min-height: 0;
        }
        
        .lane {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-height: 0;
        }

        .stats-row {
            display: flex;
            gap: 1.5rem;
            height: 160px;
            flex-shrink: 0;
        }

        .welcome-card { flex: 0.3; display: flex; align-items: center; padding: 2rem; }
        .message-card { flex: 0.7; padding: 2rem; }
        
        .photo-container {
           flex: 1;
           min-height: 0;
           border-radius: 24px;
           overflow: hidden;
        }

        .text-dim { color: var(--text-dim); text-transform: uppercase; letter-spacing: 2px; font-size: 0.8rem; margin-bottom: 1rem; }
        .big-text { font-size: 2.2rem; font-weight: 800; line-height: 1.1; }
        .mid-text { font-size: 1.3rem; line-height: 1.5; white-space: pre-wrap; color: rgba(255,255,255,0.9); }
      `}</style>
    </div>
  );
};

const OrderGroup = ({ name, today, fulfill, color, delay }) => (
  <div className="order-group glass-card animate-in" style={{ animationDelay: delay, borderColor: color + '44', borderWidth: '1px' }}>
    <h2 className="group-title" style={{ color: color }}>{name}</h2>
    <div className="stat-grid">
      <div className="stat-item">
        <span className="stat-label">Orders Today</span>
        <span className="stat-value">{today}</span>
      </div>
      <div className="stat-divider"></div>
      <div className="stat-item">
        <span className="stat-label">To Fulfill</span>
        <span className="stat-value highlight" style={{ color: '#ef4444' }}>{fulfill}</span>
      </div>
    </div>
    <style>{`
            .order-group {
                padding: 1.5rem;
                display: flex;
                flex-direction: column;
                justify-content: center;
                height: 160px; /* Fixed visually pleasing height */
                flex-shrink: 0;
            }
            .group-title {
                font-size: 1rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 2px;
                text-align: center;
                margin: 0 0 1rem 0;
                opacity: 0.9;
            }
            .stat-grid {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                align-items: center;
                gap: 1rem;
            }
            .stat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .stat-label {
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: rgba(255,255,255,0.5);
                margin-bottom: 0.25rem;
            }
            .stat-value {
                font-size: 3.5rem;
                font-weight: 800;
                line-height: 1;
                font-variant-numeric: tabular-nums;
            }
            .stat-divider {
                width: 1px;
                height: 40px;
                background: rgba(255,255,255,0.1);
            }
        `}</style>
  </div>
);

export default DispatchDashboard;
