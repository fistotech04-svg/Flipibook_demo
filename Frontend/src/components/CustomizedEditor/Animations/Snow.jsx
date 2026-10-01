import React, { useEffect, useState } from 'react';

const Snow = ({ count = 50 }) => {
  const [flakes, setFlakes] = useState([]);

  useEffect(() => {
    const initialFlakes = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 4,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.7 + 0.3,
    }));
    setFlakes(initialFlakes);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {flakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `snow-fall ${flake.duration}s linear ${flake.delay}s infinite`,
            top: '-10px',
            filter: 'blur(1px)',
          }}
        />
      ))}
      <style>{`
        @keyframes snow-fall {
          0% {
            transform: translateY(0) translateX(0);
          }
          33% {
            transform: translateY(33vh) translateX(10px);
          }
          66% {
            transform: translateY(66vh) translateX(-10px);
          }
          100% {
            transform: translateY(110vh) translateX(5px);
          }
        }
      `}</style>
    </div>
  );
};

export default Snow;
