import React, { useEffect, useState } from 'react';

const Plankton = ({ count = 700 }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const initialItems = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * -20,
    }));
    setItems(initialItems);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute bg-blue-200 rounded-full blur-[1px] opacity-40"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            width: `${item.size}px`,
            height: `${item.size}px`,
            animation: `plankton-drift ${item.duration}s linear ${item.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes plankton-drift {
          0% { transform: translate(0, 0) scale(1); opacity: 0.1; }
          100% { transform: translate(50px, -50px) scale(1.5); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Plankton;
