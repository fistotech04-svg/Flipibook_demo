import React, { useEffect, useState } from 'react';

const Clouds = ({ count = 20 }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const initialItems = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 40,
      size: Math.random() * 100 + 100,
      duration: Math.random() * 40 + 60,
      delay: Math.random() * -100,
      opacity: Math.random() * 0.3 + 0.2,
    }));
    setItems(initialItems);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((cloud) => (
        <div
          key={cloud.id}
          className="absolute bg-white rounded-full blur-[40px]"
          style={{
            left: `${cloud.left}%`,
            top: `${cloud.top}%`,
            width: `${cloud.size}px`,
            height: `${cloud.size * 0.6}px`,
            opacity: cloud.opacity,
            animation: `cloud-drift ${cloud.duration}s linear ${cloud.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes cloud-drift {
          0% { transform: translateX(-200px); }
          100% { transform: translateX(120vw); }
        }
      `}</style>
    </div>
  );
};

export default Clouds;
