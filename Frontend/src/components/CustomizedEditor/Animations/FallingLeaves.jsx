import React, { useEffect, useState } from 'react';

const FallingLeaves = ({ count = 20 }) => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const initialLeaves = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 20 + 10,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 5,
      rotation: Math.random() * 360,
      swing: Math.random() * 20 + 10,
    }));
    setLeaves(initialLeaves);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute"
          style={{
            left: `${leaf.left}%`,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            animation: `fall ${leaf.duration}s linear ${leaf.delay}s infinite`,
            top: '-50px',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="#e23636"
            style={{
              width: '100%',
              height: '100%',
              transform: `rotate(${leaf.rotation}deg)`,
              opacity: 0.6,
            }}
          >
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% {
            transform: translateY(25vh) translateX(15px) rotate(90deg);
          }
          50% {
            transform: translateY(50vh) translateX(-15px) rotate(180deg);
          }
          75% {
            transform: translateY(75vh) translateX(15px) rotate(270deg);
          }
          100% {
            transform: translateY(110vh) translateX(0) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default FallingLeaves;
