import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from '@iconify/react';
import { X, Pipette, Trash2, Plus, ChevronDown, RefreshCw, RotateCcw } from 'lucide-react';
import PremiumDropdown from './PremiumDropdown';

// Helper Functions
export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

export const hexToRgb = (hex) => {
  if (!hex) return { r: 255, g: 255, b: 255, a: 1 };
  let normalized = hex.replace('#', '');
  if (normalized.length === 3 || normalized.length === 4) {
    normalized = normalized.split('').map(char => char + char).join('');
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(normalized);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: result[4] ? parseInt(result[4], 16) / 255 : 1
  } : { r: 255, g: 255, b: 255, a: 1 };
};

export const rgbToHsv = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

export const hsvToRgb = (h, s, v) => {
  h /= 360; s /= 100; v /= 100;
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  // Ensure we cover all cases or use default
  // The original code handled 0-5. 'h * 6' logic usually produces 0-6 range?
  // Original code:
  // switch (i % 6) {
  //   case 0: r = v; g = t; b = p; break;
  //   case 1: r = q; g = v; b = p; break;
  //   case 2: r = p; g = v; b = t; break;
  //   case 3: r = p; g = q; b = v; break;
  //   case 4: r = t; g = p; b = v; break;
  //   case 5: r = v; g = p; b = q; break;
  // }
  // I will stick to original logic.
  if (i % 6 === 0) { r = v; g = t; b = p; }
  else if (i % 6 === 1) { r = q; g = v; b = p; }
  else if (i % 6 === 2) { r = p; g = v; b = t; }
  else if (i % 6 === 3) { r = p; g = q; b = v; }
  else if (i % 6 === 4) { r = t; g = p; b = v; }
  else if (i % 6 === 5) { r = v; g = p; b = q; }
  
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

export const getColorAtOffset = (offset, stops) => {
    if (!stops || stops.length === 0) return '#FFFFFF';
    const sorted = [...stops].sort((a, b) => a.offset - b.offset);
    if (offset <= sorted[0].offset) return sorted[0].color;
    if (offset >= sorted[sorted.length - 1].offset) return sorted[sorted.length - 1].color;
    for (let i = 0; i < sorted.length - 1; i++) {
        const s1 = sorted[i]; const s2 = sorted[i + 1];
        if (offset >= s1.offset && offset <= s2.offset) {
            const ratio = (offset - s1.offset) / (s2.offset - s1.offset);
            const c1 = hexToRgb(s1.color); const c2 = hexToRgb(s2.color);
            const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
            const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
            const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
            return rgbToHex(r, g, b);
        }
    }
    return '#FFFFFF';
};

export const generateGradientString = (type, stops, angle = 0, radius = 100) => {
    if (!stops || stops.length < 2) return '';
    const sortedStops = [...stops].sort((a, b) => a.offset - b.offset);

    const stopsStr = (scale = 100) => sortedStops.map(s => {
        const rgb = hexToRgb(s.color);
        const opacity = ((s.opacity || 100) / 100) * (rgb.a ?? 1);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity}) ${s.offset * (scale / 100)}%`;
    }).join(', ');

    switch (type) {
        case 'Radial': 
            return `radial-gradient(circle at center, ${stopsStr(radius)})`;
        case 'Angular': 
            return `conic-gradient(from ${angle}deg at center, ${stopsStr(100)})`;
        case 'Diamond': {
            // A realistic Diamond gradient using 4 quadrants of mirrored linear gradients
            // This creates the midpoint-vertex diamond shown in the user's reference.
            const sStr = stopsStr(radius);
            return `
                linear-gradient(to top left, ${sStr}) 0 0/51% 51% no-repeat,
                linear-gradient(to top right, ${sStr}) 100% 0/51% 51% no-repeat,
                linear-gradient(to bottom left, ${sStr}) 0 100%/51% 51% no-repeat,
                linear-gradient(to bottom right, ${sStr}) 100% 100%/51% 51% no-repeat
            `.replace(/\s+/g, ' ').trim();
        }
        default: 
            return `linear-gradient(${angle}deg, ${stopsStr(100)})`;
    }
};

import ColorPicker from './ColorPallet';

export const CustomColorPicker = React.memo(({ color, onChange, onClose, position, opacity, onOpacityChange }) => {
  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(
    <ColorPicker
      color={color}
      onChange={onChange}
      onClose={onClose}
      opacity={opacity}
      onOpacityChange={onOpacityChange}
      style={{ top: position?.y, left: position?.x, position: 'fixed', zIndex: 100000 }}
    />,
    document.body
  );
});

export const SectionLabel = ({ label }) => (
  <div className="flex items-center gap-[0.3vw] mb-[0.15vw] ">
    <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">{label}</span>
    <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
  </div>
);

export const AdjustmentSlider = ({ label, value, onChange, onReset, min = -100, max = 100, unit = "", color = "#5551FF" }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col pt-[0.2vw] py-[0.1vw] px-[0.5vw]">
      {label && (
        <div className="flex items-center justify-between px-[0.1vw] mb-[0.2vw]">
          <div className="flex items-center gap-[0.5vw]">
            <span className="text-[0.75vw] font-semibold text-gray-700 ">{label}</span>
            <button 
              onClick={onReset || (() => onChange(0))}
              className="text-gray-400 hover:text-indigo-600 transition-colors"
              title="Reset"
            >
              <Icon icon="ix:reset" className="w-[1.1vw] h-[1.1vw]" />
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-[0.25vw] h-[1.5vw]">
        <div className="relative flex-1 flex items-center">
          <style>{`
            .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
            .custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
            .custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
            .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.55vw; cursor: pointer; transition: box-shadow 0.15s ease; position: relative; z-index: 2; }
            .custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
          `}</style>
          <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full cursor-pointer custom-range-slider"
            style={{ 
              backgroundImage: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #f1f5f9 ${percentage}%, #f1f5f9 100%)` 
            }}
          />
        </div>
        <span className="text-[0.75vw] font-semibold text-gray-500 min-w-[2.5vw] text-right">
          {value}{unit}
        </span>
      </div>
    </div>
  );
};

export const EffectControlRow = ({ label, value, onChange, min = -100, max = 100 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
      onChange(newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = Number(value);
  };

  return (
    <div className="flex items-center justify-between gap-[1.5vw]">
      <span className="text-[0.75vw] font-semibold text-gray-700 cursor-ew-resize select-none " onMouseDown={onMouseDown}>{label} </span>
      <div className="flex items-center">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="text-[#858585] hover:text-[#858585] p-[0.2vw]"><Icon icon="lucide:chevron-left" className="w-[1.3vw] h-[1.3vw]" /></button>
        <div 
           onMouseDown={onMouseDown} 
           className="w-[3.5vw] h-[2vw] border-[0.15vw] border-[#D9D9D9] rounded-[0.25vw] flex items-center justify-center bg-white cursor-ew-resize select-none text-[0.6875vw] text-gray-600 font-medium"
        >
           {value}
        </div>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="text-[#858585]  hover:text-[#858585] p-[0.2vw]"><Icon icon="lucide:chevron-right" className="w-[1.3vw] h-[1.3vw]" /></button>
      </div>
    </div>
  );
};

export const DraggableSpan = ({ label, value, onChange, min = 0, max = 100, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
      onChange(newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = Number(value);
  };

  return (
    <span className={`${className} cursor-ew-resize select-none`} onMouseDown={onMouseDown}>{label}</span>
  );
};

export const solidPalette = [
    '#D9D9D9','#ffe0ffff','#FFD1DC',  '#F8C8DC','#FFB7C5','#FFFACD', '#FFF4B5',
    '#FFE5B4', '#FFD8B1', '#FFCBA4',
      '#e0ffd0ff','#c9fcceff','#C1F0C1',
      '#dceaf8ff', '#B3E5FC',
    '#F3E5F5','#d3d2fdff','#dfd1ffff',  '#E0BBE4', 
    '#FFFFFF', '#E0E0E0', '#9E9E9E', '#424242', '#000000',
];



export const ImageCropOverlay = ({ imageSrc, onSave, onCancel, element }) => {
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  
  const [crop, setCrop] = useState({ top: 15, left: 15, width: 70, height: 70 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); 
  const [startPos, setStartPos] = useState({ x: 0, y: 0, crop: {} });

  useEffect(() => {
    if (element) {
        const cp = element.style.clipPath || element.style.webkitClipPath || '';
        if (cp.includes('inset')) {
            const m = cp.match(/inset\(([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\)/);
            if (m) {
                const t = parseFloat(m[1]), r = parseFloat(m[2]), b = parseFloat(m[3]), l = parseFloat(m[4]);
                setCrop({ top: t, left: l, width: Math.max(1, 100 - l - r), height: Math.max(1, 100 - t - b) });
            }
        }
    }
  }, [element]);

  const updateDisplaySize = useCallback(() => {
    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0) {
            setDisplaySize({ width: rect.width, height: rect.height });
        }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(updateDisplaySize, 150);
    window.addEventListener('resize', updateDisplaySize);
    return () => { window.removeEventListener('resize', updateDisplaySize); clearTimeout(timer); };
  }, [updateDisplaySize]);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
    
    // Check if there's already a saved crop from styles
    const cp = element?.style.clipPath || element?.style.webkitClipPath || '';
    if (!cp.includes('inset')) {
      // Set default 213x213 crop
      // We calculate percentage based on natural dimension
      const wPercent = Math.min(90, (250 / naturalWidth) * 100);
      const hPercent = Math.min(90, (250 / naturalHeight) * 100);
      
      setCrop({
        top: (100 - hPercent) / 2,
        left: (100 - wPercent) / 2,
        width: wPercent,
        height: hPercent
      });
    }

    updateDisplaySize();
  };

  const handleMouseDown = (e, type) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true); setDragType(type);
    setStartPos({ x: e.clientX, y: e.clientY, crop: { ...crop } });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !displaySize.width) return;
    const dx = ((e.clientX - startPos.x) / displaySize.width) * 100;
    const dy = ((e.clientY - startPos.y) / displaySize.height) * 100;
    
    // Image aspect ratio (Width / Height)
    const imgAspect = displaySize.width / displaySize.height;  

    setCrop(prev => {
      let next = { ...prev };
      const MIN_SIZE = 5;

      if (dragType === 'move') {
        next.left = Math.max(0, Math.min(100 - prev.width, startPos.crop.left + dx));
        next.top = Math.max(0, Math.min(100 - prev.height, startPos.crop.top + dy));
      } else {
         const MIN_SIZE = 5;
         let newW = startPos.crop.width;
         let newH = startPos.crop.height;
  
         if (dragType === 'br') {
            newW = Math.max(MIN_SIZE, Math.min(100 - startPos.crop.left, startPos.crop.width + dx));
            newH = Math.max(MIN_SIZE, Math.min(100 - startPos.crop.top, startPos.crop.height + dy));
            next.width = newW;
            next.height = newH;
         } 
         else if (dragType === 'bl') {
             let proposedLeft = Math.max(0, Math.min(startPos.crop.left + startPos.crop.width - MIN_SIZE, startPos.crop.left + dx));
             newW = startPos.crop.width + (startPos.crop.left - proposedLeft);
             newH = Math.max(MIN_SIZE, Math.min(100 - startPos.crop.top, startPos.crop.height + dy));
             next.left = proposedLeft;
             next.width = newW;
             next.height = newH;
         }
         else if (dragType === 'tr') {
             newW = Math.max(MIN_SIZE, Math.min(100 - startPos.crop.left, startPos.crop.width + dx));
             let proposedTop = Math.max(0, Math.min(startPos.crop.top + startPos.crop.height - MIN_SIZE, startPos.crop.top + dy));
             newH = startPos.crop.height + (startPos.crop.top - proposedTop);
             next.top = proposedTop;
             next.width = newW;
             next.height = newH;
         }
         else if (dragType === 'tl') {
             let proposedLeft = Math.max(0, Math.min(startPos.crop.left + startPos.crop.width - MIN_SIZE, startPos.crop.left + dx));
             newW = startPos.crop.width + (startPos.crop.left - proposedLeft);
             let proposedTop = Math.max(0, Math.min(startPos.crop.top + startPos.crop.height - MIN_SIZE, startPos.crop.top + dy));
             newH = startPos.crop.height + (startPos.crop.top - proposedTop);
             next.left = proposedLeft;
             next.top = proposedTop;
             next.width = newW;
             next.height = newH;
         }
      }
      return next;
    });
  }, [isDragging, dragType, startPos, displaySize]);

  useEffect(() => {
    const handleMouseUp = () => { setIsDragging(false); setDragType(null); };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, handleMouseMove]);

  const handleApply = useCallback(() => {
    // 1. Inset for clip-path
    const inset = `inset(${crop.top.toFixed(2)}% ${(100 - crop.left - crop.width).toFixed(2)}% ${(100 - crop.top - crop.height).toFixed(2)}% ${crop.left.toFixed(2)}%)`;
    
    // 2. Zoom logic: How much do we need to scale to make the crop area fill the box?
    const scaleX = 100 / Math.max(1, crop.width);
    const scaleY = 100 / Math.max(1, crop.height);
    
    // 3. Offset to center the crop area
    const offX = 50 - (crop.left + (crop.width / 2));
    const offY = 50 - (crop.top + (crop.height / 2));

    onSave({ inset, scale: `${scaleX}, ${scaleY}`, offX, offY, crop });
  }, [crop, onSave]);

  const currentPixelSize = {
    w: Math.round((crop.width / 100) * naturalSize.width) || 0,
    h: Math.round((crop.height / 100) * naturalSize.height) || 0
  };

  return ReactDOM.createPortal(
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[999999] bg-black/95 flex flex-col items-center justify-center p-6 md:p-12 font-sans select-none animate-in fade-in duration-300 backdrop-blur-sm"
      onMouseDown={(e) => e.target === overlayRef.current && onCancel()}
    >
      <style>{`
        .checkerboard {
            background-image: linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            background-color: #111;
        }
      `}</style>

      <div className="w-full max-w-5xl flex items-center justify-end mb-8 text-white px-4">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="px-6 py-2 rounded-lg bg-[#333] hover:bg-[#444] transition-all font-semibold text-white/90">Cancel</button>
          <button onClick={handleApply} className="px-6 py-2 rounded-lg bg-[#444] hover:bg-[#555] transition-all font-semibold text-white/90">
             Done
          </button>
        </div>
      </div>

      <div className="relative w-full flex-1 flex items-center justify-center min-h-0">
        <div 
            ref={containerRef} 
            className="relative inline-block shadow-2xl rounded-lg border border-white/20 bg-black/20"
        >
          <img 
            ref={imageRef} 
            src={imageSrc} 
            onLoad={handleImageLoad} 
            className="max-w-full max-h-[65vh] block opacity-90 transition-opacity duration-500" 
            alt="To crop" 
            draggable={false} 
          />
          
          <div 
            className="absolute z-10 cursor-move border-[2px] border-[#0095FF] border-dashed"
            style={{ 
              top: `${crop.top}%`, 
              left: `${crop.left}%`, 
              width: `${crop.width}%`, 
              height: `${crop.height}%`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)' 
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          >
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-[#0095FF] text-white text-[12px] font-bold px-4 py-1.5 rounded-full shadow-2xl whitespace-nowrap z-20 transform hover:scale-110 transition-transform">
              {currentPixelSize.w} × {currentPixelSize.h}
            </div>

            {[
              { id: 'tl', pos: '-top-2.5 -left-2.5 cursor-nwse-resize' },
              { id: 'tr', pos: '-top-2.5 -right-2.5 cursor-nesw-resize' },
              { id: 'bl', pos: '-bottom-2.5 -left-2.5 cursor-nesw-resize' },
              { id: 'br', pos: '-bottom-2.5 -right-2.5 cursor-nwse-resize' }
            ].map(h => (
              <div 
                key={h.id} 
                className={`absolute bg-[#0095FF] w-5 h-5 z-20 border-2 border-white shadow-lg active:scale-125 transition-transform rounded-sm ${h.pos}`} 
                onMouseDown={(e) => handleMouseDown(e, h.id)} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
