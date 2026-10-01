import React, { useEffect, useState } from 'react';

const Lightning = () => {
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        const triggerFlash = () => {
            if (Math.random() > 0.95) {
                setFlash(true);
                setTimeout(() => setFlash(false), 100 + Math.random() * 200);
            }
        };

        const interval = setInterval(triggerFlash, 200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div 
            className={`absolute inset-0 transition-opacity duration-75 pointer-events-none ${flash ? 'opacity-20 bg-white' : 'opacity-0'}`}
            style={{ zIndex: 1 }}
        />
    );
};

export default Lightning;
