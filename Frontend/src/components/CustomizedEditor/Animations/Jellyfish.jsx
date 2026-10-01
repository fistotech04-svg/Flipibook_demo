import React, { useEffect, useState } from 'react';

const Jellyfish = ({ count = 14 }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const initialItems = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 80 + 10,
      size: Math.random() * 30 + 20,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * -20,
      color: ['#818cf8', '#f472b6', '#a78bfa', '#2dd4bf'][Math.floor(Math.random() * 4)],
    }));
    setItems(initialItems);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((j) => (
        <div
          key={j.id}
          className="absolute opacity-40"
          style={{
            left: `${j.left}%`,
            width: `${j.size}px`,
            height: `${j.size}px`,
            animation: `jelly-float ${j.duration}s ease-in-out ${j.delay}s infinite`,
            bottom: '-100px',
          }}
        >
          {/* Jellyfish head */}
          <div className="w-full h-1/2 rounded-t-full relative" style={{ backgroundColor: j.color }}>
             {/* Tentacles */}
             {Array.from({ length: 5 }).map((_, i) => (
                 <div 
                    key={i} 
                    className="absolute top-full w-1 bg-gradient-to-b from-current to-transparent animate-pulse" 
                    style={{ 
                        left: `${20 * i + 10}%`, 
                        height: `${j.size * 1.5}px`, 
                        color: j.color,
                        animationDelay: `${i * 0.2}s`
                    }} 
                 />
             ))}
          </div>
        </div>
      ))}
      <style>{`
        @keyframes jelly-float {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.4; }
          80% { opacity: 0.4; }
          100% { transform: translateY(-120vh) rotate(5deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Jellyfish;
