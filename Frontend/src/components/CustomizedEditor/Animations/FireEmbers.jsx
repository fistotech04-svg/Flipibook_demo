import React, { useEffect, useState } from 'react';

const FireEmbers = ({ count = 25 }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const initialItems = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * -5,
      color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
    }));
    setItems(initialItems);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute rounded-full blur-[1px]"
          style={{
            left: `${item.left}%`,
            width: `${item.size}px`,
            height: `${item.size}px`,
            backgroundColor: item.color,
            boxShadow: `0 0 10px ${item.color}`,
            animation: `ember-up ${item.duration}s ease-in ${item.delay}s infinite`,
            bottom: '-20px',
          }}
        />
      ))}
      <style>{`
        @keyframes ember-up {
          0% { transform: translateY(0) scale(1) translateX(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-110vh) scale(0.5) translateX(30px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default FireEmbers;
