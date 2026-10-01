import React, { useEffect, useState } from 'react';

const Petals = ({ count = 50 }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const initialItems = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 15 + 10,
      duration: Math.random() * 6 + 4,
      delay: Math.random() * 10,
      rotation: Math.random() * 360,
    }));
    setItems(initialItems);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute text-pink-300 opacity-70"
          style={{
            left: `${item.left}%`,
            width: `${item.size}px`,
            height: `${item.size}px`,
            animation: `petal-fall ${item.duration}s linear ${item.delay}s infinite`,
            top: '-50px',
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ transform: `rotate(${item.rotation}deg)` }}>
            <path d="M12,2C12,2 10.5,5 12,8C13.5,11 16,12.5 16,12.5C16,12.5 13.5,14 12,17C10.5,20 12,22 12,22C12,22 8,20 8,12C8,4 12,2 12,2Z" />
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes petal-fall {
            0% { transform: translateY(0) translateX(0) rotate(0deg); }
            100% { transform: translateY(110vh) translateX(50px) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Petals;
