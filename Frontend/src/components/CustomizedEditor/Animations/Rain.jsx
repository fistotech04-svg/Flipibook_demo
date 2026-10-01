import React, { useEffect, useState } from 'react';

const Rain = ({ count = 90 }) => {
  const [drops, setDrops] = useState([]);

  useEffect(() => {
    const initialDrops = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      width: Math.random() * 1 + 1,
      height: Math.random() * 20 + 20,
      duration: Math.random() * 0.5 + 0.5,
      delay: Math.random() * 2,
      opacity: Math.random() * 0.3 + 0.2,
    }));
    setDrops(initialDrops);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {drops.map((drop) => (
        <div
          key={drop.id}
          className="absolute bg-blue-400"
          style={{
            left: `${drop.left}%`,
            width: `${drop.width}px`,
            height: `${drop.height}px`,
            opacity: drop.opacity,
            animation: `rain-fall ${drop.duration}s linear ${drop.delay}s infinite`,
            top: '-50px',
          }}
        />
      ))}
      <style>{`
        @keyframes rain-fall {
          0% {
            transform: translateY(0) rotate(15deg);
          }
          100% {
            transform: translateY(110vh) rotate(15deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Rain;
