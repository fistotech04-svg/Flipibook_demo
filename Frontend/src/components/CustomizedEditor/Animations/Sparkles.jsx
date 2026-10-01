import React, { useEffect, useState } from 'react';

const Sparkles = ({ count = 50 }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const initialItems = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 10 + 5,
      duration: Math.random() * 1 + 1,
      delay: Math.random() * 5,
    }));
    setItems(initialItems);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute text-yellow-300 opacity-60"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            width: `${item.size}px`,
            height: `${item.size}px`,
            animation: `sparkle-blink ${item.duration}s ease-in-out ${item.delay}s infinite`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2L14.5,9.5L22,12L14.5,14.5L12,22L9.5,14.5L2,12L9.5,9.5L12,2Z" />
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes sparkle-blink {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.5); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Sparkles;
