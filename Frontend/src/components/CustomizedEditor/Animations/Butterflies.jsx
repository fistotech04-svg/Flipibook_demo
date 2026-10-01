import React, { useEffect, useState } from 'react';

const Butterflies = ({ count = 20 }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const initialItems = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 80 + 10,
      size: Math.random() * 20 + 10,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * -20,
      color: ['#ff9800', '#9c27b0', '#2196f3', '#4caf50'][Math.floor(Math.random() * 4)],
    }));
    setItems(initialItems);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((b) => (
        <div
          key={b.id}
          className="absolute"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animation: `butterfly-move ${b.duration}s linear ${b.delay}s infinite`,
          }}
        >
          <div className="relative w-full h-full animate-wing-flap">
             <div className="absolute left-0 w-1/2 h-full rounded-full opacity-60" style={{ backgroundColor: b.color, transform: 'rotate(-20deg)', transformOrigin: 'right center' }}></div>
             <div className="absolute right-0 w-1/2 h-full rounded-full opacity-60" style={{ backgroundColor: b.color, transform: 'rotate(20deg)', transformOrigin: 'left center' }}></div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes butterfly-move {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(100px, -50px) scale(1.1); }
          50% { transform: translate(200px, 0) scale(1); }
          75% { transform: translate(100px, 50px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes wing-flap {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.2); }
        }
        .animate-wing-flap {
          animation: wing-flap 0.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Butterflies;
