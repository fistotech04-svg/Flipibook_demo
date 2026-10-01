import React, { useEffect, useState } from 'react';

const Mist = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
      <div 
        className="absolute bottom-0 left-[-50%] w-[200%] h-[40%] bg-gradient-to-t from-gray-300 via-gray-100 to-transparent blur-[60px] animate-mist-drift"
      />
      <div 
        className="absolute bottom-0 left-[-20%] w-[150%] h-[30%] bg-gradient-to-t from-gray-200 via-gray-50 to-transparent blur-[40px] animate-mist-drift-reverse"
      />
      <style>{`
        @keyframes mist-drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(200px); }
        }
        @keyframes mist-drift-reverse {
          0% { transform: translateX(0); }
          100% { transform: translateX(-150px); }
        }
        .animate-mist-drift { animation: mist-drift 20s linear infinite alternate; }
        .animate-mist-drift-reverse { animation: mist-drift-reverse 25s linear infinite alternate; }
      `}</style>
    </div>
  );
};

export default Mist;
