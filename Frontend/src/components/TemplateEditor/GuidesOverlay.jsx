import React, { useEffect, useState, useRef } from 'react';

// GuidesOverlay listens to ruler events and renders draggable guidelines
const GuidesOverlay = ({ zoom, pan, baseCanvasWidth, baseCanvasHeight }) => {
  const containerRef = useRef(null);
  
  // Store guides as logical coordinates in the flipbook space (0 to baseWidth)
  const [guides, setGuides] = useState({ h: [], v: [] });
  
  // Track current pan and dimensions efficiently without React state if possible,
  // but for rendering the div lines we need them in React state or use Refs and direct DOM manipulation.
  // Direct DOM manipulation is much faster for 60fps panning.
  const guidesStateRef = useRef(guides);
  guidesStateRef.current = guides;
  
  const containerDimensionsRef = useRef({ width: 0, height: 0 });
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const animationFrameRef = useRef(null);
  
  useEffect(() => { panRef.current = pan; }, [pan]);

  // Keep dimensions up to date
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        containerDimensionsRef.current = {
          width: entry.contentRect.width,
          height: entry.contentRect.height
        };
        updateLinesDOM(zoomRef.current, panRef.current);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update DOM lines directly for 60fps panning
  const updateLinesDOM = (renderZoom, renderPan) => {
    if (!containerRef.current) return;
    
    const zoomContainer = document.getElementById('main-zoom-container');
    if (!zoomContainer) return;
    
    const pageContainers = Array.from(zoomContainer.querySelectorAll('.page-svg-container'));
    if (pageContainers.length === 0) return;

    let minLeft = Infinity;
    let minTop = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;

    pageContainers.forEach(el => {
       const rect = el.getBoundingClientRect();
       if (rect.left < minLeft) minLeft = rect.left;
       if (rect.top < minTop) minTop = rect.top;
       if (rect.right > maxRight) maxRight = rect.right;
       if (rect.bottom > maxBottom) maxBottom = rect.bottom;
    });

    const rulerRect = containerRef.current.getBoundingClientRect();
    
    const startX = minLeft - rulerRect.left;
    const startY = minTop - rulerRect.top;

    const scale = renderZoom / 100;

    // Update horizontal lines (which move vertically, so their Y changes)
    const hLines = containerRef.current.querySelectorAll('.guide-line-h');
    hLines.forEach(line => {
      const logicalY = parseFloat(line.dataset.logical);
      const screenY = startY + (logicalY * scale);
      line.style.transform = `translateY(${screenY}px)`;
    });

    // Update vertical lines (which move horizontally, so their X changes)
    const vLines = containerRef.current.querySelectorAll('.guide-line-v');
    vLines.forEach(line => {
      const logicalX = parseFloat(line.dataset.logical);
      const screenX = startX + (logicalX * scale);
      line.style.transform = `translateX(${screenX}px)`;
    });
  };

  // Listen to panning to update lines instantly
  useEffect(() => {
    const handlePanUpdate = (e) => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      panRef.current = e.detail;
      updateLinesDOM(zoomRef.current, panRef.current);
    };
    window.addEventListener('editor-pan-update', handlePanUpdate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('editor-pan-update', handlePanUpdate);
    };
  }, [baseCanvasWidth, baseCanvasHeight]);

  // Force update when zoom or layout changes
  useEffect(() => {
    const startZoom = zoomRef.current;
    const targetZoom = zoom;
    const startPan = panRef.current;
    const targetPan = pan;

    const zoomDiff = targetZoom - startZoom;
    const panDiffX = targetPan.x - startPan.x;
    const panDiffY = targetPan.y - startPan.y;

    if (Math.abs(zoomDiff) < 0.1 && Math.abs(panDiffX) < 1 && Math.abs(panDiffY) < 1) {
      zoomRef.current = targetZoom;
      panRef.current = targetPan;
      updateLinesDOM(targetZoom, targetPan);
    } else {
      const duration = 300;
      const startTime = performance.now();
      const ease = (t) => t * (2 - t);

      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

      const step = (time) => {
        let elapsed = time - startTime;
        if (elapsed > duration) elapsed = duration;

        const progress = elapsed / duration;
        const easedT = ease(progress);

        const nowZoom = startZoom + zoomDiff * easedT;
        const nowPan = {
          x: startPan.x + panDiffX * easedT,
          y: startPan.y + panDiffY * easedT
        };

        zoomRef.current = nowZoom;
        panRef.current = nowPan;
        updateLinesDOM(nowZoom, nowPan);

        if (elapsed < duration) {
          animationFrameRef.current = requestAnimationFrame(step);
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    }
  }, [zoom, pan, baseCanvasWidth, baseCanvasHeight, guides]);

  // Global drag handler
  useEffect(() => {
    let isDragging = false;
    let dragType = null; // 'h' or 'v'
    let dragIndex = -1; // -1 means new guide
    let dragElement = null; // Temporary visual line while dragging

    const getScreenCoord = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const getLogicalCoord = (screenPos) => {
      const zoomContainer = document.getElementById('main-zoom-container');
      if (!zoomContainer) return { x: 0, y: 0 };
      
      const pageContainers = Array.from(zoomContainer.querySelectorAll('.page-svg-container'));
      if (pageContainers.length === 0) return { x: 0, y: 0 };

      let minLeft = Infinity;
      let minTop = Infinity;

      pageContainers.forEach(el => {
         const rect = el.getBoundingClientRect();
         if (rect.left < minLeft) minLeft = rect.left;
         if (rect.top < minTop) minTop = rect.top;
      });

      const rulerRect = containerRef.current.getBoundingClientRect();
      const startX = minLeft - rulerRect.left;
      const startY = minTop - rulerRect.top;

      const scale = zoomRef.current / 100;
      return {
        x: (screenPos.x - startX) / scale,
        y: (screenPos.y - startY) / scale
      };
    };

    let dragOffset = { x: 0, y: 0 };

    const handleRulerDragStart = (e) => {
      const { type, clientX, clientY } = e.detail;
      isDragging = true;
      dragType = type;
      dragIndex = -1; // New guide
      dragOffset = { x: 0, y: 0 }; // No offset for new guides

      // Create a temporary line DOM element for dragging
      dragElement = document.createElement('div');
      dragElement.className = `absolute ${type === 'h' ? 'w-full h-[1px] border-t border-red-500 cursor-row-resize' : 'h-full w-[1px] border-l border-red-500 cursor-col-resize'} z-50`;
      
      // Match the hit area offsets of the real rendered elements so the visual line perfectly matches mathematical coordinate
      if (type === 'h') {
        dragElement.style.paddingBottom = '4px';
        dragElement.style.marginTop = '-2px';
      } else {
        dragElement.style.paddingRight = '4px';
        dragElement.style.marginLeft = '-2px';
      }

      dragElement.style.top = '0';
      dragElement.style.left = '0';
      containerRef.current.appendChild(dragElement);
      
      const pos = getScreenCoord({ clientX, clientY });
      if (type === 'h') dragElement.style.transform = `translateY(${pos.y}px)`;
      else dragElement.style.transform = `translateX(${pos.x}px)`;
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const pos = getScreenCoord(e);
      if (dragElement) {
        if (dragType === 'h') dragElement.style.transform = `translateY(${pos.y - dragOffset.y}px)`;
        else dragElement.style.transform = `translateX(${pos.x - dragOffset.x}px)`;
      }
    };

    const handleMouseUp = (e) => {
      if (!isDragging) return;
      const pos = getScreenCoord(e);
      const finalPos = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
      const logicalPos = getLogicalCoord(finalPos);

      setGuides(prev => {
        const newGuides = { ...prev };
        if (dragIndex === -1) {
          // Add new guide
          newGuides[dragType] = [...newGuides[dragType], dragType === 'h' ? logicalPos.y : logicalPos.x];
        } else {
          // Update existing guide
          newGuides[dragType][dragIndex] = dragType === 'h' ? logicalPos.y : logicalPos.x;
        }
        return newGuides;
      });

      if (dragElement && dragElement.parentNode) {
        dragElement.parentNode.removeChild(dragElement);
      }
      dragElement = null;
      isDragging = false;
      
      if (hiddenTarget) {
        hiddenTarget.style.opacity = '1';
        hiddenTarget = null;
      }
    };

    let lastClickTime = 0;
    let lastClickIndex = -1;
    let lastClickType = null;
    let hiddenTarget = null;

    // To handle dragging existing guides
    const handleGuideMouseDown = (e) => {
      const target = e.target;
      let clickedType = null;
      let clickedIndex = -1;
      
      if (target.classList.contains('guide-line-h')) {
        clickedType = 'h';
        clickedIndex = parseInt(target.dataset.index);
      } else if (target.classList.contains('guide-line-v')) {
        clickedType = 'v';
        clickedIndex = parseInt(target.dataset.index);
      } else {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      if (now - lastClickTime < 300 && lastClickIndex === clickedIndex && lastClickType === clickedType) {
        // Double click detected! Delete the guide.
        setGuides(prev => {
          const newGuides = { ...prev };
          newGuides[clickedType] = [...newGuides[clickedType]];
          newGuides[clickedType].splice(clickedIndex, 1);
          return newGuides;
        });
        lastClickTime = 0; // reset
        return;
      }

      lastClickTime = now;
      lastClickIndex = clickedIndex;
      lastClickType = clickedType;
      
      isDragging = true;
      dragType = clickedType;
      dragIndex = clickedIndex;

      // Create a temporary element and hide the original to prevent react re-renders during drag
      dragElement = document.createElement('div');
      dragElement.className = target.className;
      dragElement.style.cssText = target.style.cssText; // Copy all styles including margins for perfect hit matching
      dragElement.style.top = '0';
      dragElement.style.left = '0';
      
      const currentTransform = target.style.transform;
      const val = parseFloat(currentTransform.replace(/[^\d.-]/g, '')) || 0;
      
      const pos = getScreenCoord(e);
      if (clickedType === 'h') {
        dragOffset = { x: 0, y: pos.y - val };
      } else {
        dragOffset = { x: pos.x - val, y: 0 };
      }

      containerRef.current.appendChild(dragElement);
      
      hiddenTarget = target;
      hiddenTarget.style.opacity = '0';
    };

    window.addEventListener('ruler-drag-start', handleRulerDragStart);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // We attach mousedown to the container to catch existing guides
    const container = containerRef.current;
    if (container) container.addEventListener('mousedown', handleGuideMouseDown);

    return () => {
      window.removeEventListener('ruler-drag-start', handleRulerDragStart);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (container) container.removeEventListener('mousedown', handleGuideMouseDown);
    };
  }, [baseCanvasWidth, baseCanvasHeight]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {guides.h.map((val, idx) => (
        <div
          key={`h-${idx}`}
          className="guide-line-h absolute top-0 left-0 w-full h-[1px] border-t border-red-500 cursor-row-resize pointer-events-auto"
          style={{ paddingBottom: '4px', marginTop: '-2px' }} // Increase hit area
          data-index={idx}
          data-logical={val}
        />
      ))}
      {guides.v.map((val, idx) => (
        <div
          key={`v-${idx}`}
          className="guide-line-v absolute top-0 left-0 h-full w-[1px] border-l border-red-500 cursor-col-resize pointer-events-auto"
          style={{ paddingRight: '4px', marginLeft: '-2px' }} // Increase hit area
          data-index={idx}
          data-logical={val}
        />
      ))}
    </div>
  );
};

export default GuidesOverlay;
