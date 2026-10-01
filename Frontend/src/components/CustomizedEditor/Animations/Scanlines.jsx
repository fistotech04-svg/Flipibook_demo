import React from 'react';

const Scanlines = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_2px,3px_100%]" />
            <div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-white/5 to-transparent h-1/4 w-full" />
            <style>{`
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(400%); }
                }
                .animate-scanline {
                    animation: scanline 8s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Scanlines;
