import React, { useEffect, useState } from 'react';

const Hearts = ({ count = 30 }) => {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    const initialHearts = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 20 + 10,
      duration: Math.random() * 4 + 4,
      delay: Math.random() * 4,
    }));
    setHearts(initialHearts);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute text-red-400 opacity-60"
          style={{
            left: `${heart.left}%`,
            width: `${heart.size}px`,
            height: `${heart.size}px`,
            animation: `heart-up ${heart.duration}s ease-in ${heart.delay}s infinite`,
            bottom: '-50px',
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes heart-up {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-110vh) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Hearts;
