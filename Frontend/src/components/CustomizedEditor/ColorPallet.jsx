import React, { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";

// Helper functions for color conversion
const hexToHsv = (hex) => {
  let color = hex.substring(1);
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
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToHex = ({ h, s, v }) => {
  s /= 100;
  v /= 100;
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

  const toHex = (n) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export default function ColorPicker({ color, onChange, opacity, onOpacityChange, onClose, className, style, inline, smallMode, referenceMin = 0, referenceMax = 100, minLimit = 0, ...props }) {
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const pickerRef = useRef(null);
  const hexInputRef = useRef(null);
  const nativeColorRef = useRef(null);

  useEffect(() => {
    setHsv(hexToHsv(color));
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        if (!event.target.closest('.color-picker-trigger')) {
          if (onClose) onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSaturationChange = useCallback((e, container) => {
    const { width, height, left, top } = container.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - left) / width, 0), 1);
    const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);

    const newHsv = { ...hsv, s: x * 100, v: (1 - y) * 100 };
    setHsv(newHsv);
    onChange(hsvToHex(newHsv));
  }, [hsv, onChange]);

  const handleHueChange = useCallback((e, container) => {
    const { height, top } = container.getBoundingClientRect();
    const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);

    const newHsv = { ...hsv, h: y * 360 };
    setHsv(newHsv);
    onChange(hsvToHex(newHsv));
  }, [hsv, onChange]);

  const useDrag = (handler) => {
    const isDragging = useRef(false);
    const containerRef = useRef(null);

    const onMouseDown = (e) => {
      isDragging.current = true;
      handler(e, containerRef.current);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
      if (isDragging.current) {
        e.preventDefault();
        handler(e, containerRef.current);
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    return { onMouseDown, ref: containerRef };
  };

  const satDrag = useDrag(handleSaturationChange);
  const hueDrag = useDrag(handleHueChange);

  const hueColor = hsvToHex({ h: hsv.h, s: 100, v: 100 });

  const range = referenceMax - referenceMin;
  const displayOpacity = range !== 0
    ? Math.min(Math.max(((opacity - referenceMin) / range) * 100, 0), 100)
    : 100;

  return (
    <div
      ref={pickerRef}
      onClick={(e) => e.stopPropagation()}
      className={`${inline ? 'relative' : 'fixed'} z-[10005] ${inline ? 'w-full' : (smallMode ? 'w-[12vw]' : 'w-[15vw]')} bg-white rounded-[1vw] shadow-[0_1vw_3vw_rgba(0,0,0,0.15)] border border-gray-100 ${smallMode ? 'p-[0.6vw]' : 'p-[1vw]'} animate-in fade-in zoom-in-95 duration-200 select-none font-sans ${className || ""}`}
      style={inline ? { ...style } : {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        ...style
      }}
      {...props}
    >
      {/* Header */}
      <div className={`flex items-center justify-between ${smallMode ? 'mb-[0.5vw]' : 'mb-[1vw]'}`}>
        <div className="flex items-center gap-[0.5vw] flex-grow">
          <span className={`${smallMode ? 'text-[0.7vw]' : 'text-[0.85vw]'} font-bold text-gray-900 whitespace-nowrap`}>Colors Pallet</span>
          <div className="h-[1px] w-full bg-gray-100"></div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${smallMode ? 'p-[0.1vw]' : 'p-[0.35vw]'} rounded-[0.4vw] cursor-pointer text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all`}
          >
            <Icon icon="heroicons:x-mark" width={smallMode ? "0.7vw" : "1vw"} />
          </button>
        )}
      </div>

      {/* Main Area */}
      <div className={`flex gap-[0.5vw] ${smallMode ? 'h-[7vw] mb-[0.8vw]' : 'h-[9.375vw] mb-[1.25vw]'}`}>
        {/* Saturation/Value Box */}
        <div
          ref={satDrag.ref}
          onMouseDown={satDrag.onMouseDown}
          className="flex-1 rounded-[0.6vw] relative cursor-crosshair overflow-hidden"
          style={{ backgroundColor: hueColor }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>

          {/* Circular Thumb */}
          <div
            className={`absolute ${smallMode ? 'w-[0.6vw] h-[0.6vw]' : 'w-[0.85vw] h-[0.85vw]'} border-2 border-white rounded-full shadow-lg ${smallMode ? '-ml-[0.3vw] -mt-[0.3vw]' : '-ml-[0.425vw] -mt-[0.425vw]'} pointer-events-none`}
            style={{
              left: `${hsv.s}%`,
              top: `${100 - hsv.v}%`,
            }}
          />
        </div>

        {/* Vertical Hue Slider */}
        <div
          ref={hueDrag.ref}
          onMouseDown={hueDrag.onMouseDown}
          className={`${smallMode ? 'w-[0.8vw]' : 'w-[1.25vw]'} rounded-full relative cursor-pointer`}
          style={{
            background: "linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
          }}
        >
          {/* Thumb with lines */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 ${smallMode ? 'w-[1vw] h-[1vw]' : 'w-[1.5vw] h-[1.5vw]'} pointer-events-none`}
            style={{ top: `${(hsv.h / 360) * 100}%`, marginTop: smallMode ? '-0.5vw' : '-0.75vw' }}
          >
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white"></div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${smallMode ? 'w-[0.5vw] h-[0.5vw]' : 'w-[0.75vw] h-[0.75vw]'} bg-white border-2 border-white rounded-full shadow-md`}>
              <div
                className="w-full h-full rounded-full border border-gray-100"
                style={{ backgroundColor: hsvToHex(hsv) }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`${smallMode ? 'space-y-[0.5vw]' : 'space-y-[1vw]'}`}>
        {/* Hex Input */}
        <div className="flex items-center justify-between">
          <span className={`${smallMode ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-bold text-gray-700`}>Color Code :</span>
          <div className={`flex items-center gap-[0.4vw] border border-gray-200 rounded-[0.4vw] ${smallMode ? 'px-[0.3vw] py-[0.2vw] w-[5.5vw]' : 'px-[0.5vw] py-[0.35vw] w-[7vw]'} focus-within:border-[#5d5efc] transition-all relative bg-white`}>
            <span className="text-gray-400 text-[0.55vw] font-bold">#</span>
            <input
              type="text"
              ref={hexInputRef}
              value={color.replace("#", "").toLowerCase()}
              onChange={(e) => onChange(`#${e.target.value}`)}
              className={`w-full ${smallMode ? 'text-[0.6vw]' : 'text-[0.7vw]'} font-bold text-gray-600 outline-none lowercase font-mono bg-transparent`}
              maxLength={6}
            />
            <button
              onClick={async () => {
                if ('EyeDropper' in window) {
                  const eyeDropper = new window.EyeDropper();
                  try {
                    const result = await eyeDropper.open();
                    onChange(result.sRGBHex.toUpperCase());
                  } catch (e) { }
                } else {
                  nativeColorRef.current?.click();
                }
              }}
              className="flex items-center justify-center p-[0.1vw] hover:bg-gray-50 rounded-[0.2vw] transition-colors group/btn"
            >
              <Icon icon="lucide:pipette"
                className={`${smallMode ? 'w-[0.6vw] h-[0.6vw]' : 'w-[0.8vw] h-[0.8vw]'} text-gray-400 group-hover/btn:text-gray-700`}
              />
            </button>
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="flex items-center justify-between">
          <span className={`${smallMode ? 'text-[0.65vw]' : 'text-[0.85vw]'} font-bold text-gray-700`}>Opacity :</span>
          <div className={`flex items-center gap-[0.5vw] ${smallMode ? 'w-[5.5vw]' : 'w-[7vw]'}`}>
            <div className="relative flex-1 h-[0.25vw] bg-gray-100 rounded-full">
              <div
                className="absolute top-0 left-0 h-full bg-[#7c5dff] rounded-full"
                style={{ width: `${displayOpacity}%` }}
              ></div>
              <input
                type="range"
                min={minLimit}
                max="100"
                value={displayOpacity}
                onChange={(e) => {
                  const newVal = parseInt(e.target.value);
                  const range = referenceMax - referenceMin;
                  const actualValue = Math.round(referenceMin + (newVal / 100) * range);
                  onOpacityChange && onOpacityChange(actualValue);
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
              <div
                className={`absolute top-1/2 -translate-y-1/2 ${smallMode ? 'w-[0.6vw] h-[0.6vw]' : 'w-[0.85vw] h-[0.85vw]'} bg-[#7c5dff] border-2 border-white rounded-full shadow-md pointer-events-none`}
                style={{ left: `${displayOpacity}%`, marginLeft: smallMode ? "-0.3vw" : "-0.425vw" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
