import React, { useEffect, useState } from 'react';

import img1 from '../../../assets/Floating Animations/img-1.svg';
import img2 from '../../../assets/Floating Animations/img-2.svg';
import img3 from '../../../assets/Floating Animations/img-3.svg';
import img4 from '../../../assets/Floating Animations/img-4.svg';
import img5 from '../../../assets/Floating Animations/img-5.svg';
import img6 from '../../../assets/Floating Animations/img-6.svg';
import img7 from '../../../assets/Floating Animations/img-7.svg';
import img8 from '../../../assets/Floating Animations/img-8.svg';
import img9 from '../../../assets/Floating Animations/img-9.svg';
import img10 from '../../../assets/Floating Animations/img-10.svg';
import img11 from '../../../assets/Floating Animations/img-11.svg';
import img12 from '../../../assets/Floating Animations/img-12.svg';
import img13 from '../../../assets/Floating Animations/img-13.svg';
import img14 from '../../../assets/Floating Animations/img-14.svg';
import img15 from '../../../assets/Floating Animations/img-15.svg';
import img16 from '../../../assets/Floating Animations/img-16.svg';
import img17 from '../../../assets/Floating Animations/img-17.svg';
import img18 from '../../../assets/Floating Animations/img-18.svg';
import img19 from '../../../assets/Floating Animations/img-19.svg';
import img20 from '../../../assets/Floating Animations/img-20.svg';

const floatingImages = [
  img1, img2, img3, img4, img5, img6, img7, img8, img9, img10,
  img11, img12, img13, img14, img15, img16, img17, img18, img19, img20,
];

const MIN_DISTANCE = 65;

function isValid(placed, x, y) {
  return placed.every(p => {
    const dx = p.x - x;
    const dy = p.y - y;
    return Math.sqrt(dx * dx + dy * dy) > MIN_DISTANCE;
  });
}

const FloatingContainer = ({ count = 20 }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const placed = [];
    const generated = Array.from({ length: count }).map((_, i) => {
      let x, y, tries = 0;
      do {
        x = Math.random() * 90 + 5; // Keep away from edges slightly
        y = Math.random() * 90 + 5;
        tries++;
      } while (!isValid(placed, x, y) && tries < 50);

      placed.push({ x, y });

      return {
        id: i,
        src: floatingImages[i % floatingImages.length],
        left: x,
        top: y,
        size: Math.random() * 20 + 35,
        duration: 7 + Math.random() * 5,
        delay: Math.random() * -10,
        opacity: 0.7 + Math.random() * 0.3, // Maximum 1.0
      };
    });

    setItems(generated);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map(item => (
        <img
          key={item.id}
          src={item.src}
          alt=""
          style={{
            position: 'absolute',
            left: `${item.left}%`,
            top: `${item.top}%`,
            width: `${item.size}px`,
            height: `${item.size}px`,
            opacity: item.opacity,
            animation: `float-drift ${item.duration}s ease-in-out ${item.delay}s infinite`,
            pointerEvents: 'none',
            userSelect: 'none',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            willChange: 'transform',
          }}
          decoding="async"
          loading="lazy"
        />
      ))}
      <style>{`
        @keyframes float-drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25%  { transform: translate(10px, -15px) rotate(5deg); }
          50%  { transform: translate(-5px, -25px) rotate(-3deg); }
          75%  { transform: translate(-15px, -10px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
};

export default FloatingContainer;
