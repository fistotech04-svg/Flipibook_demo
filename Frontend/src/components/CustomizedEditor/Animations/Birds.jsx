import React, { useEffect, useState } from 'react';

const Birds = ({ count = 30 }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const initialItems = Array.from({ length: count }).map((_, i) => ({
      id: i,
      top: Math.random() * 40 + 10,
      duration: Math.random() * 10 + 20,
      delay: Math.random() * -20,
    }));
    setItems(initialItems);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute text-slate-900/40"
          style={{
            top: `${item.top}%`,
            width: '30px',
            height: '20px',
            animation: `bird-fly ${item.duration}s linear ${item.delay}s infinite`,
            left: '-50px',
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
             <div className="w-1/2 h-full border-t-2 border-slate-950/40 rounded-full animate-wing-flap origin-right"></div>
             <div className="w-1/2 h-full border-t-2 border-slate-950/40 rounded-full animate-wing-flap-reverse origin-left"></div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes bird-fly {
          0% { transform: translateX(0) scale(1); }
          100% { transform: translateX(110vw) scale(0.8); }
        }
        @keyframes wing-flap {
          0%, 100% { transform: rotate(-20deg); }
          50% { transform: rotate(20deg); }
        }
        @keyframes wing-flap-reverse {
          0%, 100% { transform: rotate(20deg); }
          50% { transform: rotate(-20deg); }
        }
        .animate-wing-flap { animation: wing-flap 0.5s ease-in-out infinite; }
        .animate-wing-flap-reverse { animation: wing-flap-reverse 0.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Birds;
