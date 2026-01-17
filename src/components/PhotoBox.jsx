import React, { useState, useEffect } from 'react';

const PhotoBox = ({ images }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, 10000); // 10s rotation
        return () => clearInterval(interval);
    }, [images]);

    if (!images || images.length === 0) {
        return (
            <div className="glass-card photo-box empty">
                <p>No photos uploaded yet</p>
            </div>
        );
    }

    const nextImage = () => {
        setIndex((prev) => (prev + 1) % images.length);
    };

    return (
        <div className="glass-card photo-box" onClick={nextImage}>
            <img key={index} src={images[index]} alt="Team" className="team-photo swipe-in" />
            <style>{`
        .photo-box {
          padding: 0;
          overflow: hidden;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          cursor: pointer;
        }
        .team-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .swipe-in {
            animation: swipeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes swipeIn {
            from {
                opacity: 0;
                transform: translateX(20px) scale(1.05);
            }
            to {
                opacity: 1;
                transform: translateX(0) scale(1);
            }
        }
      `}</style>
        </div>
    );
};

export default PhotoBox;
