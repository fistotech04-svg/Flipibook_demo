import React, { useEffect, useState } from 'react';

const Balloons = ({ count = 50 }) => {
  const [items, setItems] = useState([]);
  const colors = ['#ff5f6d', '#6366f1', '#2dd4bf', '#94ed0faf', '#fddf47ce', '#f31684be'];

  useEffect(() => {
    const initialItems = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 30 + 30,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 6 + 10,
      delay: Math.random() * 10,
    }));
    setItems(initialItems);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute flex flex-col items-center"
          style={{
            left: `${item.left}%`,
            animation: `balloon-up ${item.duration}s linear ${item.delay}s infinite`,
            bottom: '-150px',
          }}
        >
          <div 
            className="rounded-full shadow-lg relative"
            style={{ 
              width: `${item.size}px`, 
              height: `${item.size * 1.0}px`, 
              backgroundColor: item.color,
              opacity: 0.8
            }}
          >
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px]" style={{ borderTopColor: item.color }}></div>
          </div>
          <div className="w-[1px] h-20 bg-gray-300/40"></div>
        </div>
      ))}
      <style>{`
        @keyframes balloon-up {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-60vh) rotate(5deg); }
          100% { transform: translateY(-130vh) rotate(-5deg); }
        }
      `}</style>
    </div>
  );
};

export default Balloons;
