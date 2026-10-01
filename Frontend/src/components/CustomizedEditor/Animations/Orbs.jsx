import React, { useEffect, useState } from 'react';

const Orbs = ({ count = 10 }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const initialItems = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 100 + 50,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * -20,
      color: ['#6366f1', '#ec4899', '#8b5cf6', '#10b981'][Math.floor(Math.random() * 4)],
    }));
    setItems(initialItems);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden blur-[60px] opacity-30">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute rounded-full"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            width: `${item.size}px`,
            height: `${item.size}px`,
            backgroundColor: item.color,
            animation: `orb-move ${item.duration}s linear ${item.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes orb-move {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(100px, 100px) scale(1.5); }
        }
      `}</style>
    </div>
  );
};

export default Orbs;
