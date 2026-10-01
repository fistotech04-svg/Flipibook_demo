import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import { ArrowLeftRight, Minus, X, Check } from "lucide-react";
import PremiumDropdown from "../CustomizedEditor/PremiumDropdown";
// Helper functions for color conversion
const rgbToHex = (r, g, b) => {
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

export const solidPalette = [
  '#FFFFFF', '#000000', '#FF0000', '#FF4500', '#FFA500',
  '#FFFF00', '#008000', '#0000FF', '#8A2BE2', '#800080', '#C71585'
];

export const parseGradient = (gradientStr) => {
  if (!gradientStr || typeof gradientStr !== 'string' || !gradientStr.includes('gradient')) {
    return null;
  }

  const type = gradientStr.includes('radial') ? 'Radial' :
    gradientStr.includes('conic') ? 'Angular' :
      gradientStr.includes('linear-gradient(to top left') ? 'Diamond' : 'Linear';

  // For Diamond, we only want to parse the first gradient's stops
  const parseStr = type === 'Diamond' ? gradientStr.split('no-repeat,')[0] : gradientStr;

  // Extract stops
  const stops = [];
  // Match rgba? or hex colors
  const stopRegex = /(rgba?\([\d\s,.]+\)|#[0-9a-fA-F]{3,8})\s+([\d.]+)%/g;
  let match;
  while ((match = stopRegex.exec(parseStr)) !== null) {
    let colorStr = match[1];
    let opacity = 100;
    let hexColor = '#FFFFFF';

    if (colorStr.startsWith('#')) {
      hexColor = colorStr.substring(0, 7).toUpperCase(); // Extract base hex (ignore alpha if 8 chars)
      if (colorStr.length === 9) { // 8-char hex
        opacity = Math.round((parseInt(colorStr.substring(7, 9), 16) / 255) * 100);
      } else if (colorStr.length === 5) { // 4-char hex
        opacity = Math.round((parseInt(colorStr.substring(4, 5) + colorStr.substring(4, 5), 16) / 255) * 100);
      }
    } else {
      const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (rgbMatch) {
        hexColor = rgbToHex(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]));
        if (rgbMatch[4]) {
          opacity = Math.round(parseFloat(rgbMatch[4]) * 100);
        }
      }
    }

    stops.push({
      color: hexColor,
      offset: parseFloat(match[2]),
      opacity: opacity
    });
  }

  // Extract angle/radius
  let angle = 0;
  let radius = 100;

  if (type === 'Linear' || type === 'Angular') {
    const angleMatch = gradientStr.match(/(\d+)deg/);
    if (angleMatch) {
      angle = parseInt(angleMatch[1]);
    } else if (gradientStr.includes('to top')) {
      angle = 0;
    } else if (gradientStr.includes('to right')) {
      angle = 90;
    } else if (gradientStr.includes('to bottom')) {
      angle = 180;
    } else if (gradientStr.includes('to left')) {
      angle = 270;
    }
  } else if (type === 'Radial' || type === 'Diamond') {
    const maxPctMatch = [...gradientStr.matchAll(/([\d.]+)%/g)].map(m => parseFloat(m[1]));
    if (maxPctMatch.length > 0) {
      radius = Math.max(...maxPctMatch);
    }
    // Only unscale if we actually found a valid radius and stops exist
    if (radius > 0 && stops.length > 0) {
      const scale = radius / 100;
      stops.forEach(s => {
        s.offset = Math.min(100, Math.round(s.offset / scale));
      });
    }
  }

  return { type, stops: stops.length > 0 ? stops : null, angle, radius };
};


const hexToHsv = (hex) => {
  if (!hex || hex === "transparent" || hex.includes("gradient")) return { h: 0, s: 0, v: 100 };
  let color = hex.toString();
  if (!color.startsWith("#")) return { h: 0, s: 0, v: 100 };
  color = color.substring(1);
  if (color.length === 3)
    color = color.split("").map((c) => c + c).join("");
  const r = parseInt(color.substring(0, 2), 16) / 255;
  const g = parseInt(color.substring(2, 4), 16) / 255;
  const b = parseInt(color.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  let h = 0;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToHex = ({ h, s, v }) => {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const handleLocalScrub = (e, initialVal, updateFn, sensitivity = 5) => {
  const sValue = parseFloat(initialVal) || 0;
  let accumulatedDelta = 0;
  let virtualX = e.clientX;
  let virtualY = e.clientY;

  document.body.classList.add('is-scrubbing');

  if (e.pointerId !== undefined) {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { }
  }

  const vCursor = document.createElement('div');
  vCursor.className = 'virtual-scrub-cursor';
  vCursor.style.left = `${virtualX}px`;
  vCursor.style.top = `${virtualY}px`;
  vCursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 15L21 12L18 9" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 9L3 12L6 15" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 12H20" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 15L21 12L18 9" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 9L3 12L6 15" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 12H20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  document.body.appendChild(vCursor);

  const onMouseMove = (moveEvent) => {
    const dx = moveEvent.movementX || 0;
    accumulatedDelta += dx;

    virtualX += dx;
    if (virtualX < 0) virtualX = window.innerWidth;
    if (virtualX > window.innerWidth) virtualX = 0;
    vCursor.style.left = `${virtualX}px`;

    const newVal = sValue + Math.round(accumulatedDelta / sensitivity);
    updateFn(newVal.toString());
  };

  const onMouseUp = (moveEvent) => {
    if (moveEvent.pointerId !== undefined) {
      try { moveEvent.target.releasePointerCapture(moveEvent.pointerId); } catch (e) { }
    }
    if (vCursor.parentNode) vCursor.parentNode.removeChild(vCursor);
    document.body.classList.remove('is-scrubbing');
    window.removeEventListener('pointermove', onMouseMove);
    window.removeEventListener('pointerup', onMouseUp);
  };

  window.addEventListener('pointermove', onMouseMove);
  window.addEventListener('pointerup', onMouseUp);
};

export default function ColorPicker({ color, onChange, opacity, onOpacityChange, onClose, className, style, colorsOnPage = [], hidePalette = false, disableGradient = false, disableSolid = false, ...props }) {
  const [view, setView] = useState(hidePalette ? "custom" : "palette"); // "palette" or "custom"
  const [mode, setMode] = useState(disableSolid ? "gradient" : (color?.includes("gradient") && !disableGradient ? "gradient" : "solid"));
  const [hsv, setHsv] = useState(() => hexToHsv(color || "#ffffff"));

  // Gradient state
  const [gradientType, setGradientType] = useState("Linear");
  const [gradientStops, setGradientStops] = useState([
    { color: '#63D0CD', offset: 0, opacity: 100 },
    { color: '#4B3EFE', offset: 100, opacity: 100 }
  ]);
  const [gradientAngle, setGradientAngle] = useState(0);
  const [gradientRadius, setGradientRadius] = useState(100);
  const [editingStopIndex, setEditingStopIndex] = useState(null);
  const ignoreClickRef = useRef(false);
  const containerRef = useRef(null);
  const lastGeneratedColor = useRef(null);

  // Dragging state for popup
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const isDraggingPopup = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, scale: 1 });
  const [isPopupDragging, setIsPopupDragging] = useState(false);

  const handlePopupPointerDown = (e) => {
    // Avoid dragging if the user is interacting with controls
    const isInteractive = e.target.closest('button, input, [role="button"], .cursor-pointer, .cursor-text, .cursor-crosshair, .cursor-grab, .cursor-copy, .custom-range-slider-color, .cursor-ew-resize');
    if (isInteractive) return;

    let scale = 1;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const offsetWidth = containerRef.current.offsetWidth;
      if (offsetWidth > 0) scale = rect.width / offsetWidth;
    }

    isDraggingPopup.current = true;
    setIsPopupDragging(true);

    dragStartRef.current = {
      x: e.clientX - (dragPosition.x * scale),
      y: e.clientY - (dragPosition.y * scale),
      scale
    };

    const handlePointerMove = (moveEvent) => {
      if (!isDraggingPopup.current) return;
      const s = dragStartRef.current.scale;
      const newX = (moveEvent.clientX - dragStartRef.current.x) / s;
      const newY = (moveEvent.clientY - dragStartRef.current.y) / s;
      setDragPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      isDraggingPopup.current = false;
      setIsPopupDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const [customDragPosition, setCustomDragPosition] = useState({ x: 0, y: 0 });
  const isCustomDraggingPopup = useRef(false);
  const customDragStartRef = useRef({ x: 0, y: 0, scale: 1 });
  const [isCustomPopupDragging, setIsCustomPopupDragging] = useState(false);

  const handleCustomPopupPointerDown = (e) => {
    const isInteractive = e.target.closest('button, input, [role="button"], .cursor-pointer, .cursor-text, .cursor-crosshair, .cursor-grab, .cursor-copy, .custom-range-slider-color, .cursor-ew-resize');
    if (isInteractive) return;

    e.stopPropagation();

    let scale = 1;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const offsetWidth = containerRef.current.offsetWidth;
      if (offsetWidth > 0) scale = rect.width / offsetWidth;
    }

    isCustomDraggingPopup.current = true;
    setIsCustomPopupDragging(true);

    customDragStartRef.current = {
      x: e.clientX - (customDragPosition.x * scale),
      y: e.clientY - (customDragPosition.y * scale),
      scale
    };

    const handlePointerMove = (moveEvent) => {
      if (!isCustomDraggingPopup.current) return;
      const s = customDragStartRef.current.scale;
      const newX = (moveEvent.clientX - customDragStartRef.current.x) / s;
      const newY = (moveEvent.clientY - customDragStartRef.current.y) / s;
      setCustomDragPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      isCustomDraggingPopup.current = false;
      setIsCustomPopupDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      // If clicking inside the ColorPicker, do nothing
      if (containerRef.current && containerRef.current.contains(e.target)) return;
      // If clicking another trigger, allow it to open another picker
      if (e.target.closest('.color-box-trigger') || e.target.closest('.color-box') || e.target.closest('#stroke-settings-popup')) return;

      // If we just hid the custom palette, eat ALL trailing events (including compatibility mousedown)
      // so they don't reach the canvas or trigger another close action.
      if (ignoreClickRef.current) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      if (e.type === 'mousedown' || e.type === 'pointerdown') {
        if (onClose) {
          onClose();
        }
      }
    };

    // Use capture phase to intercept all related events before the parent components or canvas
    const events = ["mousedown", "pointerdown", "mouseup", "pointerup", "click"];
    events.forEach(evt => document.addEventListener(evt, handleOutsideClick, true));
    return () => {
      events.forEach(evt => document.removeEventListener(evt, handleOutsideClick, true));
    };
  }, [view, hidePalette, onClose]);

  const displayColors = useMemo(() => {
    const colors = new Set();

    // 1. Add any valid colors explicitly passed from parent
    if (colorsOnPage && Array.isArray(colorsOnPage)) {
      colorsOnPage.forEach(c => {
        if (typeof c === 'string' && c.startsWith('#')) colors.add(c.toUpperCase());
      });
    }

    // 2. Deep extract from the flipbook DOM to catch everything
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const elements = doc.querySelectorAll('*');


    const addColor = (c) => {
      if (!c || typeof c !== 'string' || c === 'none' || c === 'transparent' || c.includes('url(') || c.includes('gradient')) return;
      let hex = c.trim().toLowerCase();
      // Handle rgb/rgba
      if (hex.startsWith('rgb')) {
        const match = hex.match(/\d+/g);
        if (match && match.length >= 3) {
          hex = rgbToHex(parseInt(match[0]), parseInt(match[1]), parseInt(match[2])).toLowerCase();
        }
      }
      if (hex.startsWith('#')) {
        if (hex.length === 4) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        colors.add(hex.toUpperCase().substring(0, 7)); // strip alpha for palette display
      }
    };

    elements.forEach(el => {
      addColor(el.getAttribute('fill'));
      addColor(el.getAttribute('stroke'));
      addColor(el.getAttribute('color'));
      addColor(el.getAttribute('data-fill-color'));
      addColor(el.getAttribute('data-stroke-color'));
      if (el.style) {
        addColor(el.style.fill);
        addColor(el.style.stroke);
        addColor(el.style.color);
        addColor(el.style.backgroundColor);
      }
    });

    colors.add('#DADBE8');
    colors.add('#FFFFFF');
    colors.add('#000000');
    return Array.from(colors).slice(0, 12);
  }, [colorsOnPage]);

  useEffect(() => {
    if (color && color !== lastGeneratedColor.current) {
      if (color.includes("gradient") && !disableGradient) {
        setMode("gradient");
        const parsed = parseGradient(color);
        if (parsed) {
          setGradientType(parsed.type);
          if (parsed.stops) setGradientStops(parsed.stops);
          setGradientAngle(parsed.angle);
          setGradientRadius(parsed.radius);
        }
      } else if (color !== "transparent") {
        setMode("solid");
        setHsv(hexToHsv(color));
      }
    }
  }, [color]);

  const updateGradient = useCallback((type, stops, angle, radius, isDragging = false) => {
    const gradientStr = generateGradientString(type, stops, angle, radius);
    lastGeneratedColor.current = gradientStr;
    onChange(gradientStr, isDragging);
  }, [onChange]);

  const handleSaturationChange = useCallback((e, container, isDragging = false) => {
    const { width, height, left, top } = container.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - left) / width, 0), 1);
    const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);
    const newHsv = { ...hsv, s: x * 100, v: (1 - y) * 100 };
    setHsv(newHsv);
    const newColor = hsvToHex(newHsv);
    if (editingStopIndex !== null) {
      const newStops = [...gradientStops];
      newStops[editingStopIndex] = { ...newStops[editingStopIndex], color: newColor };
      setGradientStops(newStops);
      updateGradient(gradientType, newStops, gradientAngle, gradientRadius, isDragging);
    } else {
      lastGeneratedColor.current = newColor;
      onChange(newColor, isDragging);
    }
  }, [hsv, onChange, editingStopIndex, gradientStops, gradientType, gradientAngle, gradientRadius, updateGradient]);

  const handleHueChange = useCallback((e, container, isDragging = false) => {
    const { height, top } = container.getBoundingClientRect();
    const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);
    const newHsv = { ...hsv, h: y * 360 };
    setHsv(newHsv);
    const newColor = hsvToHex(newHsv);
    if (editingStopIndex !== null) {
      const newStops = [...gradientStops];
      newStops[editingStopIndex] = { ...newStops[editingStopIndex], color: newColor };
      setGradientStops(newStops);
      updateGradient(gradientType, newStops, gradientAngle, gradientRadius, isDragging);
    } else {
      lastGeneratedColor.current = newColor;
      onChange(newColor, isDragging);
    }
  }, [hsv, onChange, editingStopIndex, gradientStops, gradientType, gradientAngle, gradientRadius, updateGradient]);

  const useDrag = (handler) => {
    const isDragging = useRef(false);
    const containerRef = useRef(null);
    const onMouseDown = (e) => {
      e.preventDefault();
      isDragging.current = true;
      handler(e, containerRef.current, true);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };
    const onMouseMove = (e) => {
      if (isDragging.current) {
        e.preventDefault();
        handler(e, containerRef.current, true);
      }
    };
    const onMouseUp = (e) => {
      isDragging.current = false;
      handler(e, containerRef.current, false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    return { onMouseDown, ref: containerRef };
  };

  const satDrag = useDrag(handleSaturationChange);
  const hueDrag = useDrag(handleHueChange);
  const hexInputRef = useRef(null);
  const nativeColorRef = useRef(null);

  const displayOpacity = Math.round(opacity !== undefined && opacity !== null ? opacity : 100);
  const hueColor = hsvToHex({ h: hsv.h, s: 100, v: 100 });

  const resetGradient = () => {
    const newStops = [
      { color: '#63D0CD', offset: 0, opacity: 100 },
      { color: '#4B3EFE', offset: 100, opacity: 100 }
    ];
    setGradientStops(newStops);
    setGradientType('Linear');
    setGradientAngle(0);
    setGradientRadius(100);
    updateGradient('Linear', newStops, 0, 100);
  };

  const reverseGradient = () => {
    const newStops = [...gradientStops].map(s => ({ ...s, offset: 100 - s.offset })).sort((a, b) => a.offset - b.offset);
    setGradientStops(newStops);
    updateGradient(gradientType, newStops, gradientAngle, gradientRadius);
  };

  const addGradientStop = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const offset = Math.min(100, Math.max(0, Math.round((x / rect.width) * 100)));
    const color = getColorAtOffset(offset, gradientStops);
    const newStop = { color, offset, opacity: 100 };
    const newStops = [...gradientStops, newStop].sort((a, b) => a.offset - b.offset);
    setGradientStops(newStops);
    updateGradient(gradientType, newStops, gradientAngle, gradientRadius);
  };

  const removeGradientStop = (index) => {
    if (gradientStops.length <= 2) return;
    const newStops = gradientStops.filter((_, i) => i !== index);
    setGradientStops(newStops);
    updateGradient(gradientType, newStops, gradientAngle, gradientRadius);
  };

  const updateGradientStop = (index, updates, isDragging = false) => {
    const newStops = [...gradientStops];
    if (updates) {
      newStops[index] = { ...newStops[index], ...updates };
    }
    setGradientStops(newStops);
    updateGradient(gradientType, newStops, gradientAngle, gradientRadius, isDragging);
  };

  const combinedStyle = {
    ...style,
    transform: dragPosition.x !== 0 || dragPosition.y !== 0
      ? `${(style?.transform && style.transform !== 'none') ? style.transform : ''} translate(${dragPosition.x}px, ${dragPosition.y}px)`
      : style?.transform,
    ...(isPopupDragging ? { transition: 'none' } : {})
  };

  return (
    <div
      ref={containerRef}
      className={`${hidePalette ? 'w-[13.5vw] p-[0.9vw] rounded-[0.6vw]' : 'w-[19vw] p-[1.2vw] rounded-[0.8vw]'} bg-white shadow-[0_1vw_3vw_-0.5vw_rgba(0,0,0,0.2)] border border-gray-400 animate-in fade-in zoom-in-95 duration-200 select-none font-sans pointer-events-auto color-picker-container ${className || ""}`}
      style={combinedStyle}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={handlePopupPointerDown}
      {...props}
    >
      {hidePalette ? (
        <div className="flex flex-col gap-[0.9vw]">
          {/* Colors Pallet Title and Close Button */}
          <div className="flex items-center justify-between mb-[0.1vw]">
            <div className="flex items-center gap-[0.6vw] w-full">
              <span className="text-[0.75vw] font-bold text-gray-900 whitespace-nowrap">Colors Pallet</span>
              <div className="h-px flex-grow bg-gray-200" />
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-[1.4vw] h-[1.4vw] border border-red-500 rounded-[0.3vw] flex items-center justify-center text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                >
                  <X size="0.8vw" />
                </button>
              )}
            </div>
          </div>

          {/* Saturation Area and Hue Slider Side-by-Side */}
          <div className="flex gap-[0.6vw] h-[8.5vw] mb-[0.2vw]">
            {/* Saturation box */}
            <div
              ref={satDrag.ref}
              onMouseDown={satDrag.onMouseDown}
              className="flex-1 rounded-[0.3vw] relative cursor-crosshair overflow-hidden border border-gray-100"
              style={{ backgroundColor: hueColor }}
            >
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }}></div>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }}></div>
              <div
                className="absolute w-[0.6vw] h-[0.6vw] border-[1.5px] border-white rounded-full shadow-lg -ml-[0.3vw] -mt-[0.3vw] pointer-events-none"
                style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
              />
            </div>

            {/* Hue Slider (Vertical) */}
            <div
              ref={hueDrag.ref}
              onMouseDown={hueDrag.onMouseDown}
              className="w-[0.9vw] rounded-full relative cursor-pointer"
              style={{ background: "linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)" }}
            >
              <div
                className="absolute left-1/2 -translate-x-1/2 w-[1.1vw] h-[1.1vw] pointer-events-none"
                style={{ top: `${(hsv.h / 360) * 100}%`, marginTop: '-0.55vw' }}
              >
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[0.55vw] h-[0.55vw] bg-white border-2 border-white rounded-full shadow-md">
                  <div className="w-full h-full rounded-full border border-gray-200" style={{ backgroundColor: hsvToHex(hsv) }} />
                </div>
              </div>
            </div>
          </div>

          {/* Color Code Input Row */}
          <div className="flex items-center gap-[0.5vw] w-full mt-[0.2vw]">
            <span className="w-[4.8vw] text-[0.75vw] font-semibold text-gray-800 flex-shrink-0">Color Code :</span>
            <div className="flex-1 flex items-center gap-[0.4vw]">
              <div className="h-[1.9vw] border border-gray-300 rounded-[0.4vw] flex items-center px-[0.4vw] justify-between bg-white hover:border-[#5d5efc] focus-within:border-[#5d5efc] transition-colors flex-1 min-w-0">
                <div className="flex items-center gap-[0.1vw] min-w-0 flex-1">
                  <span className="text-gray-700 text-[0.75vw] font-medium">#</span>
                  <input
                    type="text"
                    value={(color || "#FFFFFF").replace("#", "").toUpperCase()}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('#')) val = '#' + val;
                      onChange(val);
                    }}
                    className="w-full text-[0.75vw] font-semibold text-gray-700 outline-none uppercase bg-transparent"
                    maxLength={7}
                  />
                </div>
                <div
                  className="flex items-center gap-[0.1vw] cursor-ew-resize select-none px-[0.15vw] hover:bg-gray-50 rounded flex-shrink-0"
                  onPointerDown={(e) => {
                    handleLocalScrub(e, displayOpacity, (val) => {
                      const num = parseInt(val);
                      const clamped = Math.min(Math.max(num, 0), 100);
                      if (onOpacityChange) onOpacityChange(clamped);
                    });
                  }}
                >
                  <span className="text-[0.7vw] font-semibold text-gray-500">{displayOpacity}%</span>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if ('EyeDropper' in window) {
                    const eyeDropper = new window.EyeDropper();
                    try {
                      const result = await eyeDropper.open();
                      onChange(result.sRGBHex);
                    } catch (e) { }
                  }
                }}
                className="w-[2vw] h-[2vw] border border-gray-300 rounded-[0.5vw] flex items-center justify-center bg-white shadow-sm hover:border-black transition-colors flex-shrink-0 group/btn"
                title="Pick Color"
              >
                <Icon icon="lucide:pipette" className="w-[0.8vw] h-[0.8vw] text-gray-500 group-hover/btn:text-black" />
              </button>
            </div>
          </div>


        </div>
      ) : (
        <div className="relative min-h-[28vw] flex flex-col justify-between">
          <div className="flex flex-col gap-[0.8vw] flex-1 justify-between">
            {/* Header Controls */}
            <div className="flex items-center justify-between w-full mb-[0.5vw]">
              {!disableGradient && !disableSolid ? (
                <PremiumDropdown
                  options={['Solid', 'Gradient']}
                  value={mode.charAt(0).toUpperCase() + mode.slice(1)}
                  onChange={(m) => {
                    const newMode = m.toLowerCase();
                    setMode(newMode);
                    if (newMode === 'solid') {
                      onChange(hsvToHex(hsv));
                    } else {
                      updateGradient(gradientType, gradientStops, gradientAngle, gradientRadius);
                    }
                  }}
                  width="5.5vw"
                  align="left"
                />
              ) : (
                <div className="text-[0.85vw] font-semibold text-gray-900 px-1 w-[5.5vw]">
                  {disableSolid ? 'Gradient' : 'Solid'}
                </div>
              )}

              {mode === 'gradient' && (
                <PremiumDropdown
                  options={['Linear', 'Radial']}
                  value={gradientType}
                  onChange={(type) => {
                    setGradientType(type);
                    updateGradient(type, gradientStops, gradientAngle, gradientRadius);
                  }}
                  width="6.5vw"
                  align="right"
                />
              )}

              {onClose && (
                <button 
                  onClick={() => {
                    onClose();
                  }} 
                  disabled={view === "custom"}
                  className={`p-[0.1vw] rounded-[0.5vw] transition-all ${view === "custom" ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  <X size="1.2vw" />
                </button>
              )}
            </div>

            {mode === 'solid' ? (
              <div className="flex flex-col gap-[1.5vw]">
                {/* Colors on this page */}
                {displayColors && displayColors.length > 0 && (
                  <div className="mb-[0.5vw]">
                    <div className="flex items-center gap-[1vw] mb-[1.25vw]">
                      <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Colors on this page</span>
                      <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                    </div>
                    <div className="grid grid-cols-6 gap-[0.6vw]">
                      {displayColors.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onChange(c)}
                          className={`aspect-square rounded-[0.5vw] border transition-all hover:scale-110 cursor-pointer ${color?.toLowerCase() === c.toLowerCase() ? 'border-[#5d5efc] border-2 shadow-sm scale-110' : 'border-gray-100'}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-[0.5vw]">
                  <div className="flex items-center gap-[1vw] mb-[1.25vw]">
                    <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Pick Colors From Pallet</span>
                    <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                  </div>

                  <div className="flex flex-col gap-[0.6vw]">
                    <div className="flex items-center justify-between gap-[1vw]">
                      <span className="text-[0.75vw] font-semibold text-gray-700 whitespace-nowrap flex-shrink-0">Fill :</span>
                      <div className="flex-1 flex gap-[0.5vw] items-center min-w-0">
                        <div
                          className="w-[2vw] h-[2vw] border border-gray-300 rounded-[0.5vw] shadow-sm cursor-pointer hover:border-[#5d5efc] transition-colors overflow-hidden relative flex-shrink-0"
                          onClick={() => setView("custom")}
                        >
                          {(!color || color === 'none' || color === 'transparent' || color === '#') ? (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45"></div>
                          ) : (
                            <div className="absolute inset-0" style={{ background: color, opacity: displayOpacity / 100 }} />
                          )}
                        </div>
                        <div className="flex-1 h-[2vw] border border-gray-300 rounded-[0.5vw] flex items-center px-[0.5vw] justify-between bg-white hover:border-black transition-colors min-w-0">
                          <input
                            type="text"
                            value={(!color || color === 'none' || color === 'transparent' || color === '#') ? 'NONE' : color.toUpperCase()}
                            onChange={(e) => onChange(e.target.value)}
                            className="flex-1 min-w-0 text-[0.75vw] font-medium text-gray-700 font-mono text-uppercase bg-transparent outline-none tracking-wide"
                          />
                          <div
                            className="flex items-center gap-[0.1vw] cursor-ew-resize select-none px-[0.15vw] hover:bg-gray-50 rounded flex-shrink-0"
                            onPointerDown={(e) => {
                              handleLocalScrub(e, displayOpacity, (val) => {
                                const num = parseInt(val);
                                const clamped = Math.min(Math.max(num, 0), 100);
                                if (onOpacityChange) onOpacityChange(clamped);
                              });
                            }}
                          >
                            <span className="text-[0.7vw] font-semibold text-gray-500">{displayOpacity}%</span>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if ('EyeDropper' in window) {
                              const eyeDropper = new window.EyeDropper();
                              try {
                                const result = await eyeDropper.open();
                                onChange(result.sRGBHex);
                              } catch (e) { }
                            } else {
                              const fallbackInput = document.getElementById('solid-mode-color-fallback');
                              if (fallbackInput) fallbackInput.click();
                            }
                          }}
                          className="w-[2vw] h-[2vw] border border-gray-300 rounded-[0.5vw] flex items-center justify-center bg-white shadow-sm hover:border-black transition-colors flex-shrink-0 group/btn"
                        >
                          <Icon icon="lucide:pipette" className="w-[0.9vw] h-[0.9vw] text-gray-500 group-hover/btn:text-black" />
                        </button>
                        <input
                          type="color"
                          id="solid-mode-color-fallback"
                          className="hidden"
                          onChange={(e) => {
                            onChange(e.target.value);
                          }}
                        />
                      </div>
                    </div>


                  </div>
                </div>

                <div className="mb-[0.5vw]">
                  <div className="flex items-center gap-[1vw] mb-[1.25vw]">
                    <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Solid Colors</span>
                    <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                  </div>

                  <div className="grid grid-cols-6 gap-[0.6vw]">
                    <button
                      type="button"
                      onClick={() => onChange('none')}
                      className={`aspect-square rounded-[0.5vw] border transition-all hover:scale-110 relative overflow-hidden cursor-pointer ${color === 'none' ? 'border-[#5d5efc] border-2 shadow-sm scale-110' : 'border-gray-100'}`}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45"></div>
                    </button>
                    {solidPalette.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onChange(c)}
                        className={`aspect-square rounded-[0.5vw] border transition-all hover:scale-110 cursor-pointer ${color?.toLowerCase() === c.toLowerCase() ? 'border-[#5d5efc] border-2 shadow-sm scale-110' : 'border-gray-100'}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-[0.2vw]">
                <div>
                  <div className="flex items-center gap-[0.75vw] mb-[1vw] mt-[-0.5vw]">
                    <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Customize your Color</span>
                    <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                    <div className="flex gap-[0.4vw]">
                      <button onClick={resetGradient} className="w-[2vw] h-[2vw] flex items-center justify-center bg-white border border-gray-200 rounded-[0.5vw] hover:bg-gray-50 transition-colors" title="Reset">
                        <Icon icon="ix:reset" width="1vw" height="1vw" className="text-gray-600" />
                      </button>
                      <button onClick={reverseGradient} className="w-[2vw] h-[2vw] flex items-center justify-center bg-white border border-gray-200 rounded-[0.5vw] hover:bg-gray-50 transition-colors" title="Reverse">
                        <ArrowLeftRight size="1vw" className="text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-[1vw] mb-[1vw]">
                    <div
                      className="relative w-[3vw] h-[3vw] shadow-md border border-gray-100 flex-shrink-0"
                      style={{
                        background: color,
                        borderRadius: gradientType === 'Radial' ? '50%' : '0.4vw'
                      }}
                    />
                    <div className="flex-1 flex flex-col gap-[0.5vw] justify-between">
                      <span className="text-[0.75vw] font-medium text-gray-700 uppercase tracking-wider">{gradientType} GRADIENT</span>
                      {(gradientType === 'Linear') && (
                        <div className="flex items-center gap-[0.5vw]">
                          <span className="text-[0.75vw] font-semibold text-gray-700 w-[2.5vw]">Angle</span>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={gradientAngle}
                            onChange={(e) => {
                              const a = parseInt(e.target.value);
                              setGradientAngle(a);
                              updateGradient(gradientType, gradientStops, a, gradientRadius, true);
                            }}
                            onPointerUp={(e) => {
                              updateGradient(gradientType, gradientStops, parseInt(e.target.value), gradientRadius, false);
                            }}
                            className="flex-1 cursor-pointer custom-range-slider-color"
                            style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${(gradientAngle / 360) * 100}%, #E2E8F0 ${(gradientAngle / 360) * 100}%, #E2E8F0 100%)` }}
                          />
                          <span className="text-[0.65vw] font-semibold text-gray-500 w-[1.5vw] text-right">{gradientAngle}°</span>
                        </div>
                      )}
                      {(gradientType === 'Radial') && (
                        <div className="flex items-center gap-[0.5vw]">
                          <span className="text-[0.75vw] font-semibold text-gray-700 w-[2.5vw]">Radius</span>
                          <input
                            type="range"
                            min="10"
                            max="200"
                            value={gradientRadius}
                            onChange={(e) => {
                              const r = parseInt(e.target.value);
                              setGradientRadius(r);
                              updateGradient(gradientType, gradientStops, gradientAngle, r, true);
                            }}
                            onPointerUp={(e) => {
                              updateGradient(gradientType, gradientStops, gradientAngle, parseInt(e.target.value), false);
                            }}
                            className="flex-1 cursor-pointer custom-range-slider-color"
                            style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${((gradientRadius - 10) / 190) * 100}%, #E2E8F0 ${((gradientRadius - 10) / 190) * 100}%, #E2E8F0 100%)` }}
                          />
                          <span className="text-[0.65vw] font-semibold text-gray-500 w-[1.5vw] text-right">{gradientRadius}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gradient Bar with Stops */}
                  <div className="relative pt-[1.2vw] pb-[0.2vw] mb-[0.4vw]">
                    <div className="absolute top-0 left-0 w-full h-[2vw] pointer-events-none">
                      {gradientStops.map((stop, idx) => (
                        <div
                          key={idx}
                          className="absolute -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing"
                          style={{ left: `${stop.offset}%`, bottom: '0.6vw' }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();

                            setEditingStopIndex(idx);
                            setHsv(hexToHsv(stop.color));

                            const startX = e.clientX;
                            const startOffset = stop.offset;
                            const rect = e.currentTarget.parentElement.parentElement.getBoundingClientRect();
                            if (e.pointerId !== undefined) {
                              try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { }
                            }

                            let finalOffset = startOffset;

                            const handlePointerMove = (moveEvent) => {
                              const dx = ((moveEvent.clientX - startX) / rect.width) * 100;
                              finalOffset = Math.min(100, Math.max(0, Math.round(startOffset + dx)));
                              updateGradientStop(idx, { offset: finalOffset }, true);
                            };

                            const handlePointerUp = (upEvent) => {
                              if (upEvent.pointerId !== undefined) {
                                try { upEvent.target.releasePointerCapture(upEvent.pointerId); } catch (err) { }
                              }
                              updateGradientStop(idx, { offset: finalOffset }, false);
                              window.removeEventListener('pointermove', handlePointerMove);
                              window.removeEventListener('pointerup', handlePointerUp);
                            };

                            window.addEventListener('pointermove', handlePointerMove);
                            window.addEventListener('pointerup', handlePointerUp);
                          }}
                        >
                          <div
                            className={`w-[1.2vw] h-[1.2vw] border-2 border-white shadow-md rounded-[0.3vw] transition-transform hover:scale-110 ${editingStopIndex === idx ? 'ring-2 ring-[#5d5efc]' : ''}`}
                            style={{ backgroundColor: stop.color }}
                            onClick={() => {
                              setEditingStopIndex(idx);
                              setHsv(hexToHsv(stop.color));
                              setTimeout(() => {
                                document.getElementById(`stop-list-item-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }, 50);
                            }}
                          />
                          <div className="w-0 h-0 border-l-[0.3vw] border-l-transparent border-r-[0.3vw] border-r-transparent border-t-[0.4vw] border-t-white"></div>
                        </div>
                      ))}
                    </div>
                    <div
                      className="w-full h-[1.2vw] rounded-[0.4vw] shadow-inner border border-gray-100 cursor-copy"
                      onClick={addGradientStop}
                      style={{ background: generateGradientString(gradientType, gradientStops, 90, 100) }}
                    />
                  </div>

                  {/* Stop List */}
                  <div className="space-y-[0.4vw] h-[6.5vw] pt-[0.2vw] overflow-y-auto custom-scrollbar pt-[0.8vw] pr-[0.4vw]">
                    {gradientStops.map((stop, idx) => (
                      <div key={idx} id={`stop-list-item-${idx}`} className="flex items-center gap-[0.4vw]">
                        <div
                          className={`w-[2vw] h-[2vw] rounded-[0.5vw] border cursor-pointer flex-shrink-0 relative overflow-hidden ${editingStopIndex === idx ? 'border-[#5d5efc] ring-1 ring-[#5d5efc]' : 'border-gray-200'}`}
                          onClick={() => {
                            setEditingStopIndex(idx);
                            setHsv(hexToHsv(stop.color));
                            setView("custom");
                          }}
                        >
                          <div className="absolute inset-0" style={{ background: stop.color, opacity: (stop.opacity ?? 100) / 100 }} />
                        </div>
                        <div
                          className={`flex-1 h-[2vw] border rounded-[0.5vw] flex items-center pl-[0.5vw] pr-[0.4vw] justify-between bg-white hover:border-black transition-colors min-w-0 ${editingStopIndex === idx ? 'border-[#5d5efc] ring-1 ring-[#5d5efc]' : 'border-gray-300'}`}
                        >
                          <input
                            type="text"
                            value={stop.color.toUpperCase()}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val && !val.startsWith('#')) val = '#' + val;
                              updateGradientStop(idx, { color: val });
                            }}
                            onClick={() => {
                              setEditingStopIndex(idx);
                              setHsv(hexToHsv(stop.color));
                              setView("custom");
                            }}
                            className="flex-1 min-w-0 text-[0.7vw] font-medium text-gray-700 font-mono bg-transparent outline-none cursor-pointer"
                          />
                          <div className="flex items-center gap-[0.1vw] flex-shrink-0">
                            <div
                              className="flex items-center gap-[0.1vw] cursor-ew-resize select-none px-[0.15vw] hover:bg-gray-50 rounded"
                              onPointerDown={(e) => {
                                handleLocalScrub(e, stop.opacity ?? 100, (val) => {
                                  const num = parseInt(val);
                                  const clamped = Math.min(Math.max(num, 0), 100);
                                  updateGradientStop(idx, { opacity: clamped });
                                });
                              }}
                            >
                              <span className="text-[0.7vw] font-medium text-gray-400">{stop.opacity ?? 100}%</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if ('EyeDropper' in window) {
                              const eyeDropper = new window.EyeDropper();
                              try {
                                const result = await eyeDropper.open();
                                updateGradientStop(idx, { color: result.sRGBHex });
                              } catch (e) { }
                            }
                          }}
                          className="w-[1.7vw] h-[1.7vw] border border-gray-300 rounded-[0.4vw] flex items-center justify-center bg-white shadow-sm hover:border-black transition-colors flex-shrink-0 group/btn"
                          title="Pick Color"
                        >
                          <Icon icon="lucide:pipette" className="w-[0.9vw] h-[0.9vw] text-gray-500 group-hover/btn:text-black" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGradientStop(idx)}
                          className="w-[1.7vw] h-[1.7vw] flex items-center justify-center border border-red-200 rounded-[0.4vw] text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                          title="Remove Stop"
                        >
                          <Minus size="0.9vw" />
                        </button>
                      </div>
                    ))}
                    <div className="h-[0.2vw] flex-shrink-0" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-[1vw] mb-[0.8vw] mt-[0.8vw]">
                    <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Gradient Colors</span>
                    <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                  </div>
                  <div className="grid grid-cols-6 gap-[0.6vw]">
                    {[
                      ['#FFE2BB', '#FFBBC1'], ['#4DBA55', '#A2D357'], ['#FF0581', '#FFB5DC'],
                      ['#7F073D', '#F967C8'], ['#ff3969', '#faccc5'], ['#FDBB2D', '#22C1C3'],
                      ['#FFB0DC', '#DFCBFF'], ['#82ABFF', '#43D3DA'], ['#A5B4FC', '#E0E7FF'],
                      ['#fa709a', '#D5A7FF'], ['#30cfd0', '#713EAE'], ['#a18cd1', '#fbc2eb'],
                    ].map((colors, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const newStops = colors.map((c, idx) => ({
                            color: c,
                            offset: idx === 0 ? 0 : 100,
                            opacity: 100
                          }));
                          setGradientStops(newStops);
                          updateGradient(gradientType, newStops, gradientAngle, gradientRadius);
                        }}
                        className="aspect-square rounded-[0.5vw] border border-gray-100 shadow-sm transition-all hover:scale-110"
                        style={{ background: `linear-gradient(to bottom right, ${colors.join(', ')})` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {view === "custom" && (
            <div
              className="absolute top-[3vw] left-[calc(100%-5vw)] w-[16vw] p-[0.8vw] bg-white border border-gray-400 rounded-[0.8vw] shadow-[0_1vw_3vw_-0.5vw_rgba(0,0,0,0.2)] animate-in fade-in slide-in-from-left-2 z-[9999]"
              style={{
                transform: `translate(${customDragPosition.x - dragPosition.x}px, ${customDragPosition.y - dragPosition.y}px)`,
                ...(isCustomPopupDragging || isPopupDragging ? { transition: 'none' } : {})
              }}
              onPointerDown={handleCustomPopupPointerDown}
            >
              <>
                {/* Custom Picker Header (Back Button) */}
                <div className="flex items-center justify-between mb-[1vw]">
                  <button
                    onClick={() => {
                      setView("palette");
                      setEditingStopIndex(null);
                    }}
                    className="flex items-center gap-[0.4vw] text-[0.85vw] font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Icon icon="heroicons:chevron-left" className="w-[1vw] h-[1vw]" />
                    {editingStopIndex !== null ? `Edit Stop ${editingStopIndex + 1}` : 'Back to Palette'}
                  </button>
                  {onClose && (
                    <button
                      onClick={() => {
                        setView("palette");
                        setEditingStopIndex(null);
                      }}
                      className="p-[0.4vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-100 transition-all"
                    >
                      <Icon icon="heroicons:x-mark" width="1.2vw" />
                    </button>
                  )}
                </div>

                {/* Main Area */}
                <div className="flex gap-[0.65vw] h-[8.2vw] mb-[1.1vw]">
                  <div
                    ref={satDrag.ref}
                    onMouseDown={satDrag.onMouseDown}
                    className="flex-1 rounded-[0.6vw] relative cursor-crosshair overflow-hidden"
                    style={{ backgroundColor: hueColor }}
                  >
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }}></div>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }}></div>
                    <div
                      className="absolute w-[0.75vw] h-[0.75vw] border-2 border-white rounded-full shadow-lg -ml-[0.375vw] -mt-[0.375vw] pointer-events-none"
                      style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
                    />
                  </div>

                  <div
                    ref={hueDrag.ref}
                    onMouseDown={hueDrag.onMouseDown}
                    className="w-[1.1vw] rounded-full relative cursor-pointer"
                    style={{ background: "linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)" }}
                  >
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-[1.35vw] h-[1.35vw] pointer-events-none"
                      style={{ top: `${(hsv.h / 360) * 100}%`, marginTop: '-0.675vw' }}
                    >
                      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[0.675vw] h-[0.675vw] bg-white border-2 border-white rounded-full shadow-md">
                        <div className="w-full h-full rounded-full border border-gray-200" style={{ backgroundColor: hsvToHex(hsv) }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-[0.5vw]">
                  <div className="flex items-center gap-[0.5vw] w-full">
                    <span className="w-[4.5vw] text-[0.75vw] font-semibold text-gray-800 flex-shrink-0">Color Code :</span>
                    <div className="flex-1 flex items-center gap-[0.4vw]">
                      <div className="h-[1.9vw] border border-gray-300 rounded-[0.4vw] flex items-center px-[0.4vw] justify-between bg-white hover:border-[#5d5efc] focus-within:border-[#5d5efc] transition-colors flex-1 min-w-0">
                        <div className="flex items-center gap-[0.1vw] min-w-0 flex-1">
                          <span className="text-gray-700 text-[0.75vw] font-mono font-medium">#</span>
                          <input
                            type="text"
                            ref={hexInputRef}
                            value={(editingStopIndex !== null ? gradientStops[editingStopIndex].color : color)?.replace("#", "").toUpperCase() || ""}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (!val.startsWith('#')) val = '#' + val;
                              if (editingStopIndex !== null) {
                                updateGradientStop(editingStopIndex, { color: val });
                              } else {
                                onChange(val);
                              }
                            }}
                            className="w-full text-[0.75vw] font-medium text-gray-700 outline-none uppercase font-mono bg-transparent tracking-wide"
                            maxLength={7}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if ('EyeDropper' in window) {
                            const eyeDropper = new window.EyeDropper();
                            try {
                              const result = await eyeDropper.open();
                              if (editingStopIndex !== null) {
                                updateGradientStop(editingStopIndex, { color: result.sRGBHex });
                              } else {
                                onChange(result.sRGBHex);
                              }
                            } catch (e) { }
                          } else {
                            nativeColorRef.current?.click();
                          }
                        }}
                        className="w-[2vw] h-[2vw] border border-gray-300 rounded-[0.5vw] flex items-center justify-center bg-white shadow-sm hover:border-black transition-colors flex-shrink-0 group/btn"
                        title="Pick Color"
                      >
                        <Icon icon="lucide:pipette" className="w-[1vw] h-[1vw] text-gray-500 group-hover/btn:text-black" />
                      </button>
                      <input
                        type="color"
                        ref={nativeColorRef}
                        className="hidden"
                        onChange={(e) => {
                          const newColor = e.target.value;
                          if (editingStopIndex !== null) {
                            updateGradientStop(editingStopIndex, { color: newColor });
                          } else {
                            onChange(newColor);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-[0.5vw] w-full">
                    <span className="w-[4.5vw] text-[0.75vw] font-semibold text-gray-800 flex-shrink-0">Opacity :</span>
                    <div className="flex-1 flex items-center gap-[0.4vw]">
                      <div className="flex-1 flex items-center h-[1.5vw]">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editingStopIndex !== null ? (gradientStops[editingStopIndex].opacity ?? 100) : displayOpacity}
                          onChange={(e) => {
                            const op = parseInt(e.target.value);
                            if (editingStopIndex !== null) {
                              updateGradientStop(editingStopIndex, { opacity: op });
                            } else if (onOpacityChange) {
                              onOpacityChange(op);
                            }
                          }}
                          className="w-full cursor-pointer custom-range-slider-color"
                          style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${editingStopIndex !== null ? (gradientStops[editingStopIndex].opacity ?? 100) : displayOpacity}%, #E2E8F0 ${editingStopIndex !== null ? (gradientStops[editingStopIndex].opacity ?? 100) : displayOpacity}%, #E2E8F0 100%)` }}
                        />
                      </div>
                      <div className="h-[1.5vw] w-[2.5vw] border border-gray-200 bg-white rounded-[0.3vw] shadow-sm flex items-center justify-center gap-[0.05vw] flex-shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingStopIndex !== null ? (gradientStops[editingStopIndex].opacity ?? 100) : displayOpacity}
                          onChange={(e) => {
                            let op = parseInt(e.target.value);
                            if (isNaN(op)) op = 0;
                            op = Math.min(Math.max(op, 0), 100);
                            if (editingStopIndex !== null) {
                              updateGradientStop(editingStopIndex, { opacity: op });
                            } else if (onOpacityChange) {
                              onOpacityChange(op);
                            }
                          }}
                          className="w-[1vw] text-center text-[0.65vw] font-semibold text-gray-800 outline-none no-spin bg-transparent"
                        />
                        <span className="text-[0.5vw] font-medium text-gray-600">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            </div>
          )}
        </div>
      )}
      <style>{`
        input[type="range"].custom-range-slider-color { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type="range"].custom-range-slider-color::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        input[type="range"].custom-range-slider-color::-webkit-slider-thumb { -webkit-appearance: none !important; height: 1vw !important; width: 1vw !important; border-radius: 50% !important; background: #4D47FF !important; border: 0.02vw solid #ffffff !important; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4) !important; margin-top: -0.4vw !important; cursor: pointer !important; transition: box-shadow 0.15s ease !important; }
        input[type="range"].custom-range-slider-color::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6) !important; }

        input[type="range"].custom-angle-slider { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type="range"].custom-angle-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: #E2E8F0; border: none; }
        input[type="range"].custom-angle-slider::-webkit-slider-thumb { -webkit-appearance: none !important; height: 0.9vw !important; width: 0.9vw !important; border-radius: 50% !important; background: #5d5efc !important; cursor: pointer !important; margin-top: -0.35vw !important; border: none !important; box-shadow: 0 0.1vw 0.3vw rgba(0,0,0,0.2); }
      `}</style>
    </div>
  );
}
