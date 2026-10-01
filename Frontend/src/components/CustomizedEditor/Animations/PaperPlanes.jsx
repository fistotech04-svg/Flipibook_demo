import React, { useEffect, useState } from 'react';

const PaperPlanes = ({ count = 30 }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const initialItems = Array.from({ length: count }).map((_, i) => ({
      id: i,
      top: Math.random() * 80 + 10,
      duration: Math.random() * 5 + 10,
      delay: Math.random() * -20,
      size: Math.random() * 10 + 10,
    }));
    setItems(initialItems);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((p) => (
        <div
          key={p.id}
          className="absolute text-white/40"
          style={{
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `plane-fly ${p.duration}s linear ${p.delay}s infinite`,
            left: '-50px',
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 16.5c0 .38-.21.71-.53.88l-7.97 4.19c-.32.17-.69.17-1 0l-7.97-4.19c-.32-.17-.53-.5-.53-.88V9.11l7.5 3.94c.32.17.68.25 1 .25s.68-.08 1-.25l7.5-3.94v7.39zM12 1.35c.32-.17.68-.25 1-.25s.68.08 1 .25l7.97 4.19c.32.17.53.5.53.88s-.21.71-.53.88L12 12.35l-7.97-4.19C3.21 7.99 3 7.66 3 7.28s.21-.71.53-.88L12 1.35z" />
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes plane-fly {
          0% { transform: translateX(0) translateY(0) rotate(15deg); }
          50% { transform: translateX(50vw) translateY(-50px) rotate(10deg); }
          100% { transform: translateX(110vw) translateY(0) rotate(20deg); }
        }
      `}</style>
    </div>
  );
};

export default PaperPlanes;
