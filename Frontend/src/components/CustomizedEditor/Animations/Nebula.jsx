import React from 'react';

const Nebula = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40 blur-[100px]">
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-600 rounded-full animate-pulse opacity-50"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-600 rounded-full animate-pulse opacity-50 animation-delay-2000"></div>
            <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-500 rounded-full animate-bounce opacity-40"></div>
            <style>{`
                .animation-delay-2000 { animation-delay: 2s; }
            `}</style>
        </div>
    );
};

export default Nebula;
