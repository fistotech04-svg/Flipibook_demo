import React, { useEffect, useRef } from 'react';

const SpaceWarp = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 200 }).map(() => ({
        x: (Math.random() - 0.5) * canvas.width,
        y: (Math.random() - 0.5) * canvas.height,
        z: Math.random() * canvas.width,
    }));

    const draw = () => {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        stars.forEach(s => {
            s.z -= 5;
            if (s.z <= 0) s.z = canvas.width;

            const x = cx + s.x * (canvas.width / s.z);
            const y = cy + s.y * (canvas.width / s.z);
            const size = (1 - s.z / canvas.width) * 3;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        });

        requestAnimationFrame(draw);
    };

    draw();
    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export default SpaceWarp;
