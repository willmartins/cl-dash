import React, { useState, useEffect } from 'react';

const ReviewSlider = ({ reviews }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            if (reviews.length > 0) {
                setIsVisible(true);
                setCurrentIndex(0);
                setTimeout(() => setIsVisible(false), 30000); // Show for 30s
            }
        }, 1200000); // 20 mins = 1200000ms

        return () => clearInterval(interval);
    }, [reviews]);

    useEffect(() => {
        if (isVisible && reviews.length > 1) {
            const rot = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % reviews.length);
            }, 6000); // Rotate review every 6s while visible
            return () => clearInterval(rot);
        }
    }, [isVisible, reviews]);

    if (reviews.length === 0) return null;

    return (
        <div className={`review-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="review-content">
                <h2 className="glow-text">What Our Customers Say</h2>
                <div className="review-card glass-card animate-in">
                    <p className="review-text">"{reviews[currentIndex]?.review}"</p>
                    <div className="review-meta">
                        <span className="reviewer">{reviews[currentIndex]?.name}</span>
                        <span className="product">{reviews[currentIndex]?.product}</span>
                    </div>
                </div>
            </div>
            <style>{`
        .review-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(12, 13, 18, 0.95);
          backdrop-filter: blur(20px);
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.8s ease;
        }
        .review-overlay.visible {
          opacity: 1;
          pointer-events: all;
        }
        .review-content {
          max-width: 800px;
          text-align: center;
        }
        .review-content h2 {
          font-size: 3rem;
          margin-bottom: 2rem;
        }
        .review-text {
          font-size: 2rem;
          line-height: 1.4;
          font-style: italic;
          margin-bottom: 2rem;
        }
        .review-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .reviewer {
          font-weight: 700;
          font-size: 1.5rem;
        }
        .product {
          color: var(--accent-color);
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 1rem;
        }
      `}</style>
        </div>
    );
};

export default ReviewSlider;
