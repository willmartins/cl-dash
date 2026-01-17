import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';

const Clock = ({ size = 'large', variant = 'default' }) => {
  const [time, setTime] = useState(DateTime.now().setZone('Europe/London'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(DateTime.now().setZone('Europe/London'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isAnalogue = variant === 'analogue-braun';

  if (isAnalogue) {
    const hours = time.hour;
    const minutes = time.minute;
    const seconds = time.second;

    const hourDeg = (hours % 12) * 30 + minutes * 0.5;
    const minDeg = minutes * 6;
    const secDeg = seconds * 6;

    return (
      <div className={`clock-container analogue-${size}`}>
        <div className="braun-clock">
          <div className="face">
            {/* Hour Numbers */}
            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, i) => {
              // Calculate position for numbers
              const angle = (i * 30) - 90; // Start at 12 o'clock
              // This logic places 12 at index 0, 1 at 1... wait, logic check
              // array: [12, 1, 2...]
              // i=0 -> 12. angle = 0 - 90 = -90 (top?) No.
              // 12 is at top (270 or -90 deg).
              // Let's use simpler transform logic from center.
              const rotation = i * 30; // 0 for 12, 30 for 1
              return (
                <div key={num} className="hour-number" style={{
                  transform: `rotate(${rotation}deg) translate(0, -${size === 'large' ? '195px' : '85px'}) rotate(-${rotation}deg)`
                }}>
                  {num}
                </div>
              );
            })}

            {/* Ticks */}
            {[...Array(60)].map((_, i) => {
              const isHour = i % 5 === 0;
              return (
                <div key={`tick-${i}`} className={`tick ${isHour ? 'hour-tick' : 'min-tick'}`} style={{ transform: `rotate(${i * 6}deg)` }} />
              );
            })}

            {/* Branding Removed */}

            <div className="hand hour" style={{ transform: `rotate(${hourDeg}deg)` }} />
            <div className="hand minute" style={{ transform: `rotate(${minDeg}deg)` }} />
            <div className="hand second" style={{ transform: `rotate(${secDeg}deg)` }} />
            <div className="center-dot" />
          </div>
        </div>
        <div className="date-display">{time.toFormat('cccc, d MMMM')}</div>
        <style>{`
          .clock-container.analogue-large { display: flex; flex-direction: column; align-items: center; gap: 2rem; }
          .clock-container.analogue-medium { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
          
          .braun-clock {
            width: ${size === 'large' ? '550px' : '240px'};
            height: ${size === 'large' ? '550px' : '240px'};
            background: #111;
            border-radius: 50%;
            border: 4px solid #333; /* Inner rim */
            box-shadow: 
                0 0 0 10px #e0e0e0, /* Metallic outer rim */
                0 20px 50px rgba(0,0,0,0.8);
            position: relative;
            overflow: hidden; /* Fixes markings spilling out */
          }
          .face {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
          }
          
          .hour-number {
             position: absolute;
             top: 50%;
             left: 50%;
             width: 40px;
             height: 40px;
             margin-left: -20px;
             margin-top: -20px;
             text-align: center;
             line-height: 40px;
             color: #fff;
             font-family: 'Inter', sans-serif;
             font-weight: 500;
             font-size: ${size === 'large' ? '32px' : '14px'};
          }

          .tick {
            position: absolute;
            left: 50%;
            background: rgba(255,255,255,0.3);
            margin-left: -1px;
            backface-visibility: hidden;
          }
          /* Top and Transform Origin logic */
          ${size === 'large' ? `
            .tick { 
                top: 10px; 
                transform-origin: 50% 265px; /* 275px center - 10px top */
                height: 35px; width: 6px; margin-left: -3px; 
            }
          ` : `
            .tick { 
                top: 4px; 
                transform-origin: 50% 116px; /* 120px center - 4px top */
                height: 15px; width: 2px; margin-left: -1px; 
            }
          `}

          .min-tick {
             width: 2px;
             height: ${size === 'large' ? '10px' : '4px'};
          }
          .hour-tick {
             width: 4px;
             height: ${size === 'large' ? '25px' : '10px'};
             background: #fff;
             margin-left: -2px;
          }

          .hand {
            position: absolute;
            bottom: 50%;
            left: 50%;
            transform-origin: bottom center;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          }
          .hour {
            width: ${size === 'large' ? '16px' : '6px'};
            height: 30%;
            background: #fff;
            z-index: 3;
            margin-left: ${size === 'large' ? '-8px' : '-3px'};
          }
          .minute {
            width: ${size === 'large' ? '12px' : '4px'};
            height: 45%;
            background: #e0e0e0;
            z-index: 2;
            margin-left: ${size === 'large' ? '-6px' : '-2px'};
          }
          .second {
            width: ${size === 'large' ? '4px' : '2px'};
            height: 50%;
            background: #fdbb2d; /* Braun Yellow */
            z-index: 4;
            margin-left: ${size === 'large' ? '-2px' : '-1px'};
            border-radius: 2px;
          }
          .center-dot {
            position: absolute;
            top: 50%;
            left: 50%;
            width: ${size === 'large' ? '24px' : '10px'};
            height: ${size === 'large' ? '24px' : '10px'};
            background: #fdbb2d; /* Yellow Center */
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
          }
          
          .date-display {
            font-size: 2.5rem;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 4px;
            font-weight: 300;
            margin-top: 40px;
            opacity: 0.8;
          }
        `}</style>
      </div>
    );
  }

  const isBraun = variant === 'braun-outline';

  return (
    <div className={`clock-container ${size} variant-${variant}`}>
      <div className={`time ${!isBraun ? 'glow-text' : ''}`}>{time.toFormat('HH:mm:ss')}</div>
      <div className="date">{time.toFormat('cccc, d MMMM yyyy')}</div>
      <style>{`
        .clock-container {
          text-align: center;
          color: white;
        }
        .clock-container.large .time {
          font-size: 10rem;
          font-weight: 800;
          letter-spacing: -2px;
          line-height:1;
        }
        .clock-container.large .date {
          font-size: 2rem;
          margin-top: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .variant-braun-outline .time {
          color: transparent;
          -webkit-text-stroke: 1px white;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          letter-spacing: -4px;
        }
        
        .variant-braun-outline .date {
           color: white;
           opacity: 1;
        }

        .variant-default .date {
           color: rgba(255,255,255,0.6);
        }

        .clock-container.medium .time {
          font-size: 4rem;
          font-weight: 700;
        }
        .clock-container.medium .date {
          font-size: 1.2rem;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default Clock;
