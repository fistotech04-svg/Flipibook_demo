import { useEffect } from 'react';

const usePreventBrowserZoom = () => {
  useEffect(() => {
    const handleWheel = (e) => {
      // Prevent Ctrl + Wheel (Browser Zoom)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e) => {
      // Prevent Ctrl + (+ / - / 0)
      if (e.ctrlKey || e.metaKey) {
        if (
          e.key === '+' || 
          e.key === '-' || 
          e.key === '=' || 
          e.key === '0' ||
          e.code === 'NumpadAdd' ||
          e.code === 'NumpadSubtract' ||
          e.code === 'Equal' ||
          e.code === 'Minus' ||
          e.code === 'Digit0'
        ) {
          e.preventDefault();
        }
      }
    };

    // Prevent Safari/Touchpad Pinch Zoom
    const handleGestureStart = (e) => {
      e.preventDefault();
    };
    
    // Prevent Touch Pinch Zoom
    const handleTouchMove = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Add event listeners with passive: false to allow preventDefault
    // Use capture: true to intercept events before they reach the target
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    
    // WebKit specific (Safari/iOS) and some trackpads
    if ('ongesturestart' in window) {
        window.addEventListener('gesturestart', handleGestureStart, { capture: true });
        window.addEventListener('gesturechange', handleGestureStart, { capture: true });
        window.addEventListener('gestureend', handleGestureStart, { capture: true });
    }
    
    window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });

    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      
      if ('ongesturestart' in window) {
        window.removeEventListener('gesturestart', handleGestureStart, { capture: true });
        window.removeEventListener('gesturechange', handleGestureStart, { capture: true });
        window.removeEventListener('gestureend', handleGestureStart, { capture: true });
      }
      
      window.removeEventListener('touchmove', handleTouchMove, { capture: true });
    };
  }, []);
};

export default usePreventBrowserZoom;
