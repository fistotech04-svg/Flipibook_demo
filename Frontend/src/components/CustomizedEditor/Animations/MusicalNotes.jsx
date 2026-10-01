import React, { useEffect, useState } from 'react';

const MusicalNotes = ({ count = 12 }) => {
  const [items, setItems] = useState([]);
  const notes = ['♪', '♫', '♬', '♩'];

  useEffect(() => {
    const initialItems = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 20 + 10,
      note: notes[Math.floor(Math.random() * notes.length)],
      duration: Math.random() * 5 + 5,
      delay: Math.random() * -10,
    }));
    setItems(initialItems);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden font-serif text-white/30">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left: `${item.left}%`,
            fontSize: `${item.size}px`,
            animation: `note-rise ${item.duration}s ease-in ${item.delay}s infinite`,
            bottom: '-50px',
          }}
        >
          {item.note}
        </div>
      ))}
      <style>{`
        @keyframes note-rise {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-110vh) rotate(45deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default MusicalNotes;
