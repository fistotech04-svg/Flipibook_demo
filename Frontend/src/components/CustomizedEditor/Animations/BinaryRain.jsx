import React, { useEffect, useState } from 'react';

const BinaryRain = ({ count = 40 }) => {
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    const initialColumns = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      content: Array.from({ length: 15 }).map(() => (Math.random() > 0.5 ? '1' : '0')).join('\n')
    }));
    setColumns(initialColumns);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden font-mono text-[15px] text-green-500/30 whitespace-pre">
      {columns.map((col) => (
        <div
          key={col.id}
          className="absolute"
          style={{
            left: `${col.left}%`,
            animation: `binary-fall ${col.duration}s linear ${col.delay}s infinite`,
            top: '-200px',
          }}
        >
          {col.content}
        </div>
      ))}
      <style>{`
        @keyframes binary-fall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(120vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default BinaryRain;
