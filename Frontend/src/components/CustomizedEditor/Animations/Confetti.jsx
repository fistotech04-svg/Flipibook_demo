import React, { useEffect, useState } from 'react';

const Confetti = ({ count = 40 }) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    const initialPieces = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
      rotation: Math.random() * 360,
    }));
    setPieces(initialPieces);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s infinite`,
            top: '-20px',
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(110vh) rotate(720deg);
                opacity: 0.7;
            }
        }
      `}</style>
    </div>
  );
};

export default Confetti;
