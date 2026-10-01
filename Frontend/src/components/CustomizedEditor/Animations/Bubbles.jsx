import React, { useEffect, useState } from 'react';

const Bubbles = ({ count = 15 }) => {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    const initialBubbles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 40 + 20,
      duration: Math.random() * 4 + 6,
      delay: Math.random() * 2,
    }));
    setBubbles(initialBubbles);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute border border-white/30 rounded-full bg-white/10 backdrop-blur-[1px]"
          style={{
            left: `${bubble.left}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            animation: `bubble-up ${bubble.duration}s ease-in ${bubble.delay}s infinite`,
            bottom: '-100px',
            boxShadow: 'inset 0 0 10px rgba(255,255,255,0.2)',
          }}
        >
            <div className="absolute top-[20%] left-[20%] w-[20%] h-[20%] bg-white/40 rounded-full"></div>
        </div>
      ))}
      <style>{`
        @keyframes bubble-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-120vh) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Bubbles;
