import React, { useEffect, useState } from 'react';

const Disco = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(red,orange,yellow,green,blue,indigo,violet,red)] animate-spin-slow" />
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[100px]" />
            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 10s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Disco;
