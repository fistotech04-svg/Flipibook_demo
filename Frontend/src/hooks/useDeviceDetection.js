// useDeviceDetection.js - Custom hook for device type detection
import { useState, useEffect } from 'react';

const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    breakpoint: 'desktop' // mobile, tablet, desktop
  });

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Breakpoints
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1280;
      const isDesktop = width >= 1280;
      
      let breakpoint = 'desktop';
      if (isMobile) breakpoint = 'mobile';
      else if (isTablet) breakpoint = 'tablet';

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        width,
        height,
        breakpoint
      });
    };

    // Initial detection
    detectDevice();

    // Listen to resize events
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return deviceInfo;
};

export default useDeviceDetection;
