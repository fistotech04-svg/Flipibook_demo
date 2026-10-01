import React, { useEffect, useState } from 'react';

const Fireflies = ({ count = 100 }) => {
  const [flies, setFlies] = useState([]);

  useEffect(() => {
    const initialFlies = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }));
    setFlies(initialFlies);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {flies.map((fly) => (
        <div
          key={fly.id}
          className="absolute bg-yellow-200 rounded-full blur-[2px]"
          style={{
            left: `${fly.x}%`,
            top: `${fly.y}%`,
            width: `${fly.size}px`,
            height: `${fly.size}px`,
            boxShadow: '0 0 10px #fef08a, 0 0 20px #fef08a',
            animation: `firefly-blink ${fly.duration}s ease-in-out ${fly.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes firefly-blink {
          0%, 100% { opacity: 0; transform: scale(0.5) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(20px, -20px); }
        }
      `}</style>
    </div>
  );
};

export default Fireflies;
