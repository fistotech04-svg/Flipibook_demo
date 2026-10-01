import React, { useEffect, useState } from 'react';

const TwinklingStars = ({ count = 50 }) => {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const initialStars = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }));
    setStars(initialStars);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            boxShadow: '0 0 5px #fff',
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TwinklingStars;
