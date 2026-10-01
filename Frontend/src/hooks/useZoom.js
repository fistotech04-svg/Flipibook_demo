// useZoom.js - Custom hook for zoom management with Ctrl+Scroll support
import { useState, useEffect, useCallback, useRef } from 'react';

const useZoom = (initialZoom = 100, containerRef = null, baseWidth = 210, baseHeight = 297) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [autoZoom, setAutoZoom] = useState(true);
  const wheelTimeoutRef = useRef(null);

  // Calculate optimal zoom to fit container
  const calculateOptimalZoom = useCallback(() => {
    if (!containerRef?.current) return 100;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Convert mm to pixels at 96 DPI for target dimensions
    const targetWidth = baseWidth * 96 / 25.4;
    const targetHeight = baseHeight * 96 / 25.4;
    const PADDING = 80;

    const availableWidth = containerWidth - PADDING;
    const availableHeight = containerHeight - PADDING;

    const scaleX = availableWidth / targetWidth;
    const scaleY = availableHeight / targetHeight;

    const optimalScale = Math.min(scaleX, scaleY, 1.25);
    return Math.round(Math.max(50, Math.min(125, optimalScale * 100)));
  }, [containerRef, baseWidth, baseHeight]);

  // Zoom in
  const zoomIn = useCallback((step = 10) => {
    setZoom(prev => Math.min(125, prev + step));
    setAutoZoom(false);
  }, []);

  // Zoom out
  const zoomOut = useCallback((step = 10) => {
    setZoom(prev => Math.max(50, prev - step));
    setAutoZoom(false);
  }, []);

  // Set specific zoom level
  const setZoomLevel = useCallback((level) => {
    setZoom(Math.max(50, Math.min(125, level)));
    setAutoZoom(false);
  }, []);

  // Reset to optimal zoom
  const fitToScreen = useCallback(() => {
    const optimal = calculateOptimalZoom();
    setZoom(optimal);
    setAutoZoom(true);
  }, [calculateOptimalZoom]);

  // Handle Ctrl+Scroll zoom
  useEffect(() => {
    const handleWheel = (e) => {
      // Check if Ctrl key is pressed
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        // Clear previous timeout
        if (wheelTimeoutRef.current) {
          clearTimeout(wheelTimeoutRef.current);
        }

        // Determine zoom direction
        const delta = e.deltaY > 0 ? -5 : 5;


        setZoom(prev => {
          const newZoom = Math.max(50, Math.min(125, prev + delta));
          return newZoom;
        });

        setAutoZoom(false);

        // Debounce the zoom update
        wheelTimeoutRef.current = setTimeout(() => {
          wheelTimeoutRef.current = null;
        }, 50);
      }
    };

    // Add event listener to specific container instead of document
    const container = containerRef?.current;

    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [containerRef]);

  // Auto-fit on container resize
  useEffect(() => {
    if (!autoZoom || !containerRef?.current) return;

    const resizeObserver = new ResizeObserver(() => {
      const optimal = calculateOptimalZoom();
      setZoom(optimal);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [autoZoom, containerRef, calculateOptimalZoom]);

  return {
    zoom,
    zoomIn,
    zoomOut,
    setZoomLevel,
    fitToScreen,
    autoZoom,
    calculateOptimalZoom
  };
};

export default useZoom;
