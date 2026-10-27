import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Clapperboard, Palette, Sliders, Type } from 'lucide-react';
import ColorPicker from '../ColorPicker';
import {
  STARBURST_PRESETS,
  MOTION_EFFECTS,
  COLOR_COMBINATIONS,
  ANIMATED_SHAPES_PRESETS
} from './Animated_Decorators';

// Section Header matching AudioProperties exact styling
const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.4vw] mt-[0.3vw]">
    <span className="text-[0.9vw] font-medium text-black whitespace-nowrap">{title}</span>
    <div className="h-[0.06vw] bg-gray-200 flex-1 ml-[0.3vw]" />
  </div>
);

// PropertyRow matching AudioProperties exact alignment (w-[5.6vw] pl-[0.5vw])
const PropertyRow = ({ label, children, className = '' }) => (
  <div className={`flex items-center gap-[0.5vw] ${className}`}>
    <div className="w-[5.6vw] shrink-0 flex items-center pl-[0.5vw] justify-between text-gray-700 font-medium">
      <span className={`${label.length > 12 ? 'text-[0.68vw]' : 'text-[0.78vw]'} tracking-tight whitespace-nowrap`}>
        {label}
      </span>
      <span className="text-gray-500 font-medium text-[0.8vw]">:</span>
    </div>
    <div className="flex-1 min-w-0">
      {children}
    </div>
  </div>
);

// Toggle Switch matching AudioProperties exact structure & style
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-[1.9vw] h-[1.1vw] flex items-center rounded-full p-[0.1vw] cursor-pointer transition-colors ${
      checked ? 'bg-[#E05638]' : 'bg-gray-300'
    }`}
  >
    <div
      className={`bg-white w-[0.9vw] h-[0.9vw] rounded-full shadow-md transform transition-transform ${
        checked ? 'translate-x-[0.8vw]' : 'translate-x-0'
      }`}
    />
  </button>
);

// PropertySlider using PropertyRow with signature #E05638 styling
const PropertySlider = ({ label, value, onChange, min = 0, max = 360, step = 1, unit = '' }) => {
  const numVal = value !== undefined ? value : min;
  const pct = Math.max(0, Math.min(100, ((numVal - min) / (max - min)) * 100));

  return (
    <PropertyRow label={label}>
      <div className="flex items-center gap-[0.5vw] w-full h-[2.5vw]">
        <div className="flex-1 flex items-center relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={numVal}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-full h-[0.25vw] appearance-none cursor-pointer bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[0.85vw] [&::-webkit-slider-thumb]:h-[0.85vw] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#E05638] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
            style={{
              background: `linear-gradient(to right, #E05638 0%, #E05638 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
            }}
          />
        </div>
        <span className="text-[0.8vw] text-gray-800 font-medium w-[2.8vw] text-right shrink-0">
          {numVal} {unit}
        </span>
      </div>
    </PropertyRow>
  );
};

// Color Swatch + Hex Input Box matching AudioProperties exact structure
const ColorInput = ({ color, onChange, opacity = 100, onOpenPicker, isActive = false }) => {
  const displayColor = color && color.startsWith('#') ? color.toUpperCase() : color || '#000000';

  return (
    <div className="flex items-center gap-[0.4vw] w-full">
      <div
        onClick={onOpenPicker}
        className={`color-box color-box-trigger w-[2vw] h-[2vw] rounded-[0.5vw] border flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 transition-all ${
          isActive ? 'border-[#E05638] ring-2 ring-[#E05638]/40 scale-105 shadow-xs' : 'border-gray-200 hover:border-gray-300'
        }`}
        style={{ backgroundColor: color || '#000000' }}
        title="Click to open color palette"
      />
      <div className="flex-1 h-[2.5vw] flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white px-[0.6vw] text-[0.8vw] text-gray-800 focus-within:border-[#E05638] shadow-2xs">
        <input
          type="text"
          value={displayColor}
          onChange={(e) => {
            let val = e.target.value;
            if (!val.startsWith('#') && val.length > 0) val = '#' + val;
            onChange(val);
          }}
          className="w-[5.2vw] font-mono text-[0.8vw] text-gray-800 bg-transparent focus:outline-none uppercase font-medium"
          maxLength={7}
        />
        <span className="text-gray-400 text-[0.75vw] font-medium">{opacity}%</span>
      </div>
    </div>
  );
};

// Custom Dropdown matching AudioProperties exact design (h-[2.5vw] rounded-[0.5vw])
const CustomSelect = ({ value, onChange, options, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value ?? opt.id) === String(value)) || options[0];

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[2.5vw] flex items-center justify-between bg-white border ${
          isOpen ? 'border-2 border-[#E05638] shadow-xs' : 'border border-gray-200 hover:border-gray-300'
        } rounded-[0.5vw] px-[0.6vw] text-[0.78vw] text-gray-800 font-medium transition-colors cursor-pointer shadow-2xs`}
      >
        <span className="font-medium truncate">{selectedOption?.label || selectedOption?.name || value}</span>
        <ChevronDown
          className={`w-[0.9vw] h-[0.9vw] text-gray-500 transition-transform duration-200 flex-shrink-0 ml-[0.3vw] ${
            isOpen ? 'rotate-180 text-[#E05638]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-[0.35vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-2xl overflow-hidden z-[100] flex flex-col py-[0.3vw] max-h-[14vw] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {options.map((opt) => {
              const optVal = opt.value ?? opt.id ?? opt;
              const optLabel = opt.label ?? opt.name ?? opt;
              const isSelected = String(optVal) === String(value);
              return (
                <button
                  key={optVal}
                  type="button"
                  onClick={() => {
                    onChange(optVal);
                    setIsOpen(false);
                  }}
                  className={`px-[0.9vw] py-[0.45vw] text-[0.78vw] font-medium transition-colors text-left flex items-center justify-between cursor-pointer group ${
                    isSelected
                      ? 'text-[#E05638] bg-[#E05638]/10 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-[#E05638]'
                  }`}
                >
                  <span className="truncate">{optLabel}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const fontFamilies = [
  'Arial', 'Inter', 'Roboto', 'Bangers', 'Times New Roman', 'Courier New',
  'Georgia', 'Verdana', 'Helvetica', 'Poppins', 'Open Sans', 'Lato',
  'Montserrat', 'Playfair Display', 'Oswald'
];

const fontWeights = [
  { name: 'Regular', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi Bold', value: '600' },
  { name: 'Bold', value: '700' },
  { name: 'Extra Bold', value: '800' }
];

const fontSizes = [9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32];

const AnimatedDecoratorsProperties = ({
  selectedElement,
  selectedLayerId,
  activePageIndex,
  updateElementAttribute,
  onUpdate
}) => {
  const shapeType = selectedElement?.getAttribute('data-shape-type') || '';
  const isStarburst = shapeType.startsWith('starburst');
  const presetTitle = selectedElement?.getAttribute('data-title') || (isStarburst ? 'Starburst Badge' : 'Animated Shape');
  const categoryName = selectedElement?.getAttribute('data-category') || (isStarburst ? 'starburst' : 'shape');

  // =========================================================================
  // STATE: COMBINED ANIMATED SHAPES & LINES PROPERTIES
  // =========================================================================
  const [animPreset, setAnimPreset] = useState('none');
  const [duration, setDuration] = useState(2);
  const [loopMode, setLoopMode] = useState('infinite'); // 'infinite' | 'alternate' | 'once'
  const [primaryColor, setPrimaryColor] = useState('#00e5ff');
  const [accentColor, setAccentColor] = useState('#818cf8');
  const [glowEnabled, setGlowEnabled] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(8);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [dashStyle, setDashStyle] = useState('preserve');

  // =========================================================================
  // STATE: STARBURST BADGES (Uncombined, Individual Full Properties Preserved)
  // =========================================================================
  const [starburstText, setStarburstText] = useState('NEW\nCSS3\nStarbursts!');
  const [burstColor, setBurstColor] = useState('#ff47ab');
  const [hoverBurstColor, setHoverBurstColor] = useState('#ff0000');
  const [textColor, setTextColor] = useState('#ffffff');
  const [hoverTextColor, setHoverTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(13);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontWeight, setFontWeight] = useState('bold');
  const [rotation, setRotation] = useState(-22.5);
  const [hoverRotation, setHoverRotation] = useState(-45);
  const [borderRadius, setBorderRadius] = useState(0);
  const [hoverBorderRadius, setHoverBorderRadius] = useState(0);

  // Color picker portal state
  const [activePicker, setActivePicker] = useState(null);
  const colorPickerRef = useRef(null);
  const triggerRefs = {
    // Shapes & Lines
    primary: useRef(null),
    accent: useRef(null),
    // Starburst Individual
    burst: useRef(null),
    hoverBurst: useRef(null),
    text: useRef(null),
    hoverText: useRef(null),
  };

  // Close color picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(e.target) &&
        !Object.values(triggerRefs).some((ref) => ref.current?.contains(e.target))
      ) {
        setActivePicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hydrate state from DOM element
  useEffect(() => {
    if (!selectedElement) return;

    if (isStarburst) {
      const rawText = selectedElement.getAttribute('data-text');
      if (rawText) {
        try {
          setStarburstText(decodeURIComponent(rawText));
        } catch (_) {
          setStarburstText(rawText);
        }
      } else {
        const aTag = selectedElement.querySelector('a');
        if (aTag) setStarburstText(aTag.innerText || aTag.textContent || '');
      }

      setBurstColor(selectedElement.getAttribute('data-color') || '#ff47ab');
      setHoverBurstColor(selectedElement.getAttribute('data-hover-color') || '#ff0000');
      setTextColor(selectedElement.getAttribute('data-text-color') || '#ffffff');
      setHoverTextColor(selectedElement.getAttribute('data-hover-text-color') || '#ffffff');

      const fs = selectedElement.getAttribute('data-font-size');
      if (fs) setFontSize(parseInt(fs, 10));

      const ff = selectedElement.getAttribute('data-font-family');
      if (ff) setFontFamily(ff);

      const fw = selectedElement.getAttribute('data-font-weight');
      if (fw) setFontWeight(fw);

      const rot = selectedElement.getAttribute('data-rotation');
      if (rot !== null) setRotation(parseFloat(rot));

      const hRot = selectedElement.getAttribute('data-hover-rotation');
      if (hRot !== null) setHoverRotation(parseFloat(hRot));

      const rad = selectedElement.getAttribute('data-radius');
      if (rad !== null) setBorderRadius(parseFloat(rad));

      const hRad = selectedElement.getAttribute('data-hover-radius');
      if (hRad !== null) setHoverBorderRadius(parseFloat(hRad));
    } else {
      // Hydrate Combined Shapes & Lines
      const c1 = selectedElement.getAttribute('data-color1') || '#00e5ff';
      const c2 = selectedElement.getAttribute('data-color2') || '#818cf8';
      const blur = selectedElement.getAttribute('data-glow-blur');
      const sw = selectedElement.getAttribute('data-stroke-width');
      const dash = selectedElement.getAttribute('data-dash');
      const anim = selectedElement.getAttribute('data-anim') || 'none';
      const dur = selectedElement.getAttribute('data-duration');
      const dir = selectedElement.getAttribute('data-direction');
      const lp = selectedElement.getAttribute('data-loop');

      setPrimaryColor(c1);
      setAccentColor(c2);
      if (blur !== null) {
        const blurVal = parseFloat(blur);
        setGlowIntensity(blurVal);
        setGlowEnabled(blurVal > 0);
      }
      if (sw !== null) setStrokeWidth(parseFloat(sw));
      if (dash !== null) setDashStyle(dash);
      setAnimPreset(anim);
      if (dur !== null) setDuration(parseFloat(dur));

      if (dir === 'alternate') {
        setLoopMode('alternate');
      } else if (lp === '1') {
        setLoopMode('once');
      } else {
        setLoopMode('infinite');
      }
    }
  }, [selectedElement, selectedLayerId, isStarburst]);

  // Synchronize edits back into the DOM element
  const applyUpdates = (updates = {}) => {
    if (!selectedElement) return;

    if (isStarburst) {
      // Full Individual Starburst Properties Update
      const nextText = updates.text !== undefined ? updates.text : starburstText;
      const nextColor = updates.burstColor !== undefined ? updates.burstColor : burstColor;
      const nextHoverColor = updates.hoverBurstColor !== undefined ? updates.hoverBurstColor : hoverBurstColor;
      const nextTextColor = updates.textColor !== undefined ? updates.textColor : textColor;
      const nextHoverTextColor = updates.hoverTextColor !== undefined ? updates.hoverTextColor : hoverTextColor;
      const nextFontSize = updates.fontSize !== undefined ? updates.fontSize : fontSize;
      const nextFontFamily = updates.fontFamily !== undefined ? updates.fontFamily : fontFamily;
      const nextFontWeight = updates.fontWeight !== undefined ? updates.fontWeight : fontWeight;
      const nextRotation = updates.rotation !== undefined ? updates.rotation : rotation;
      const nextHoverRotation = updates.hoverRotation !== undefined ? updates.hoverRotation : hoverRotation;
      const nextBorderRadius = updates.borderRadius !== undefined ? updates.borderRadius : borderRadius;
      const nextHoverBorderRadius = updates.hoverBorderRadius !== undefined ? updates.hoverBorderRadius : hoverBorderRadius;

      selectedElement.setAttribute('data-text', encodeURIComponent(nextText));
      selectedElement.setAttribute('data-color', nextColor);
      selectedElement.setAttribute('data-hover-color', nextHoverColor);
      selectedElement.setAttribute('data-text-color', nextTextColor);
      selectedElement.setAttribute('data-hover-text-color', nextHoverTextColor);
      selectedElement.setAttribute('data-font-size', nextFontSize.toString());
      selectedElement.setAttribute('data-font-family', nextFontFamily);
      selectedElement.setAttribute('data-font-weight', nextFontWeight);
      selectedElement.setAttribute('data-rotation', nextRotation.toString());
      selectedElement.setAttribute('data-hover-rotation', nextHoverRotation.toString());
      selectedElement.setAttribute('data-radius', nextBorderRadius.toString());
      selectedElement.setAttribute('data-hover-radius', nextHoverBorderRadius.toString());

      const styleEl = selectedElement.querySelector('style');
      const elemId = selectedElement.id;
      const layers = parseInt(selectedElement.getAttribute('data-layers') || '2', 10);

      const aTag = selectedElement.querySelector(`a.${shapeType}`) || selectedElement.querySelector('a');
      if (aTag) {
        let inner = nextText.replace(/\n/g, '<br/>');
        for (let i = 0; i < layers; i++) {
          inner = `<span>${inner}</span>`;
        }
        aTag.innerHTML = inner;
      }

      if (styleEl) {
        const presetData = STARBURST_PRESETS.find(p => p.shapeType === shapeType) || STARBURST_PRESETS[0];
        const width = presetData.width;
        const height = presetData.height;
        const textShadow = presetData.textShadow || 'none';
        const hoverTextShadow = presetData.hoverTextShadow || textShadow;

        styleEl.textContent = `
          #${elemId} .sb-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            box-sizing: border-box;
          }
          #${elemId} a.${shapeType} {
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${width}px;
            height: ${height}px;
            background: ${nextColor};
            text-align: center;
            text-decoration: none;
            color: ${nextTextColor};
            font-weight: ${nextFontWeight};
            font-family: '${nextFontFamily}', Arial, sans-serif;
            font-size: ${nextFontSize}px;
            line-height: 1.2em;
            position: relative;
            cursor: pointer;
            box-sizing: border-box;
            text-shadow: ${textShadow};
            border-radius: ${nextBorderRadius}px;
            transition: all 0.4s ease;
            transform: rotate(${nextRotation}deg);
          }
          #${elemId} a.${shapeType} span {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background: ${nextColor};
            color: inherit;
            border-radius: ${nextBorderRadius}px;
            transition: all 0.4s ease;
            box-sizing: border-box;
          }
          ${shapeType === 'starburst1' ? `
            #${elemId} a.starburst1 span { transform: rotate(45deg); }
            #${elemId}:hover a.starburst1, #${elemId}.is-hovered a.starburst1 {
              background: ${nextHoverColor};
              color: ${nextHoverTextColor};
              transform: rotate(${nextHoverRotation}deg);
              border-radius: ${nextHoverBorderRadius}px;
              text-shadow: ${hoverTextShadow};
            }
            #${elemId}:hover a.starburst1 span, #${elemId}.is-hovered a.starburst1 span {
              background: ${nextHoverColor};
              color: ${nextHoverTextColor};
              border-radius: ${nextHoverBorderRadius}px;
              text-shadow: ${hoverTextShadow};
            }
          ` : ''}
          ${shapeType === 'starburst2' ? `
            #${elemId} a.starburst2 span { transform: rotate(22.5deg); }
            #${elemId}:hover a.starburst2, #${elemId}.is-hovered a.starburst2 {
              background: ${nextHoverColor};
              color: ${nextHoverTextColor};
              transform: rotate(${nextHoverRotation}deg);
              border-radius: ${nextHoverBorderRadius}px;
              text-shadow: ${hoverTextShadow};
            }
            #${elemId}:hover a.starburst2 span, #${elemId}.is-hovered a.starburst2 span {
              background: ${nextHoverColor};
              color: ${nextHoverTextColor};
              border-radius: ${nextHoverBorderRadius}px;
              text-shadow: ${hoverTextShadow};
            }
          ` : ''}
          ${shapeType === 'starburst3' ? `
            #${elemId} a.starburst3 span { transform: rotate(11.25deg); }
            #${elemId}:hover a.starburst3, #${elemId}.is-hovered a.starburst3 {
              background: ${nextHoverColor};
              color: ${nextHoverTextColor};
              transform: rotate(${nextHoverRotation}deg) scale(1.05);
              text-shadow: ${hoverTextShadow};
            }
            #${elemId}:hover a.starburst3 span, #${elemId}.is-hovered a.starburst3 span {
              background: ${nextHoverColor};
              color: ${nextHoverTextColor};
              text-shadow: ${hoverTextShadow};
            }
          ` : ''}
          ${shapeType === 'starburst4' ? `
            #${elemId} a.starburst4 span { transform: rotate(22.5deg); }
            #${elemId}:hover a.starburst4, #${elemId}.is-hovered a.starburst4 { background: transparent; }
            #${elemId}:hover a.starburst4 span, #${elemId}.is-hovered a.starburst4 span {
              background: ${nextHoverColor};
              color: ${nextHoverTextColor};
              border-radius: ${nextHoverBorderRadius}px;
              text-shadow: ${hoverTextShadow};
            }
          ` : ''}
          ${shapeType === 'starburst5' ? `
            #${elemId} a.starburst5 span { transform: rotate(-45deg); }
            #${elemId}:hover a.starburst5, #${elemId}.is-hovered a.starburst5 {
              background: ${nextHoverColor};
              color: ${nextHoverTextColor};
              text-shadow: ${hoverTextShadow};
            }
            #${elemId}:hover a.starburst5 span, #${elemId}.is-hovered a.starburst5 span {
              transform: rotate(${nextHoverRotation}deg);
              color: ${nextHoverTextColor};
              text-shadow: ${hoverTextShadow};
            }
          ` : ''}
        `;
      }
    } else {
      // Combined Animated Shapes & Lines updates
      const nextPrimary = updates.primaryColor !== undefined ? updates.primaryColor : primaryColor;
      const nextAccent = updates.accentColor !== undefined ? updates.accentColor : accentColor;
      const nextAnim = updates.animPreset !== undefined ? updates.animPreset : animPreset;
      const nextDuration = updates.duration !== undefined ? updates.duration : duration;
      const nextLoopMode = updates.loopMode !== undefined ? updates.loopMode : loopMode;
      const nextGlowEnabled = updates.glowEnabled !== undefined ? updates.glowEnabled : glowEnabled;
      const nextGlowIntensity = updates.glowIntensity !== undefined ? updates.glowIntensity : glowIntensity;
      const effectiveGlow = nextGlowEnabled ? nextGlowIntensity : 0;
      const nextStrokeWidth = updates.strokeWidth !== undefined ? updates.strokeWidth : strokeWidth;
      const nextDashStyle = updates.dashStyle !== undefined ? updates.dashStyle : dashStyle;

      const directionVal = nextLoopMode === 'alternate' ? 'alternate' : 'normal';
      const loopVal = nextLoopMode === 'once' ? '1' : 'infinite';

      selectedElement.setAttribute('data-color1', nextPrimary);
      selectedElement.setAttribute('data-color2', nextAccent);
      selectedElement.setAttribute('data-glow-color', nextPrimary);
      selectedElement.setAttribute('data-glow-blur', effectiveGlow.toString());
      selectedElement.setAttribute('data-stroke-width', nextStrokeWidth.toString());
      selectedElement.setAttribute('data-dash', nextDashStyle);
      selectedElement.setAttribute('data-anim', nextAnim);
      selectedElement.setAttribute('data-duration', nextDuration.toString());
      selectedElement.setAttribute('data-direction', directionVal);
      selectedElement.setAttribute('data-loop', loopVal);

      // Update motion container
      const motionGroup = selectedElement.querySelector('.motion-content') || selectedElement.querySelector('g:not([id])');
      if (motionGroup) {
        motionGroup.className.baseVal = `motion-content ${nextAnim !== 'none' ? nextAnim : ''}`;
        motionGroup.style.animationDuration = `${nextDuration}s`;
        motionGroup.style.animationDirection = directionVal;
        motionGroup.style.animationIterationCount = loopVal;
        motionGroup.style.setProperty('--glow-c', nextPrimary);
        motionGroup.style.filter = effectiveGlow > 0 ? `drop-shadow(0 0 ${effectiveGlow}px ${nextPrimary})` : 'none';
      }

      // Update inner SVG shapes
      const presetId = selectedElement.getAttribute('data-decorator-preset');
      const presetData = ANIMATED_SHAPES_PRESETS.find((p) => p.id === presetId);

      if (motionGroup && presetData && presetData.svg) {
        // Re-generate inner SVG using the pristine preset template with new primary and accent colors
        const newSvgHtml = presetData.svg
          .replace(/COLOR_1/g, nextPrimary)
          .replace(/COLOR_2/g, nextAccent);

        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${newSvgHtml}</svg>`, 'image/svg+xml');
        const newNodes = Array.from(parsedDoc.documentElement.childNodes);
        motionGroup.replaceChildren(...newNodes);

        // Apply custom stroke width or dash style overrides if adjusted
        motionGroup.querySelectorAll('line, path, circle, polygon, rect, ellipse').forEach((el) => {
          if (nextStrokeWidth !== undefined && nextStrokeWidth !== presetData.strokeWidth) {
            const curSW = el.getAttribute('stroke-width');
            if (curSW && curSW !== '0') el.setAttribute('stroke-width', nextStrokeWidth.toString());
          }

          if (nextDashStyle && nextDashStyle !== 'preserve') {
            if (nextDashStyle === 'none') {
              el.removeAttribute('stroke-dasharray');
              el.classList.remove('anim-dash-flow', 'anim-dash-flow-fast', 'anim-dash-flow-rev');
            } else {
              el.setAttribute('stroke-dasharray', nextDashStyle);
              if (!el.classList.contains('anim-dash-flow')) {
                el.classList.add('anim-dash-flow');
              }
            }
          }
        });
      } else {
        // Fallback for custom or unindexed shapes: map by previous colors
        const prevC1 = (selectedElement.getAttribute('data-color1') || primaryColor).toLowerCase();
        const prevC2 = (selectedElement.getAttribute('data-color2') || accentColor).toLowerCase();

        selectedElement.querySelectorAll('line, path, circle, polygon, rect, ellipse').forEach((el) => {
          if (el.tagName.toLowerCase() === 'rect' && el.getAttribute('fill') === 'transparent') return;

          const origStroke = el.getAttribute('stroke');
          const origFill = el.getAttribute('fill');

          if (origStroke && origStroke !== 'none') {
            const sLower = origStroke.toLowerCase();
            if (sLower === prevC2) {
              el.setAttribute('stroke', nextAccent);
            } else {
              el.setAttribute('stroke', nextPrimary);
            }
            if (nextStrokeWidth > 0) el.setAttribute('stroke-width', nextStrokeWidth.toString());
          }

          if (origFill && origFill !== 'none') {
            const fLower = origFill.toLowerCase();
            if (fLower === prevC2) {
              el.setAttribute('fill', nextAccent);
            } else {
              el.setAttribute('fill', nextPrimary);
            }
          }

          if (nextDashStyle !== 'preserve') {
            if (nextDashStyle === 'none') {
              el.removeAttribute('stroke-dasharray');
              el.classList.remove('anim-dash-flow', 'anim-dash-flow-fast', 'anim-dash-flow-rev');
            } else {
              el.setAttribute('stroke-dasharray', nextDashStyle);
              if (!el.classList.contains('anim-dash-flow')) {
                el.classList.add('anim-dash-flow');
              }
            }
          }
        });
      }
    }

    // Trigger Synchronous Editor DOM Persistence
    if (onUpdate) {
      onUpdate();
    } else if (updateElementAttribute && selectedLayerId) {
      const svgRoot = selectedElement.closest('svg');
      if (svgRoot) {
        const serializer = new XMLSerializer();
        updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', serializer.serializeToString(svgRoot));
      }
    }
  };

  const getPortalPosition = (triggerRef) => {
    if (!triggerRef?.current) return { top: 0, left: 0 };
    const rect = triggerRef.current.getBoundingClientRect();
    const pickerWidth = 280;
    const pickerHeight = 420;

    let left = rect.left - pickerWidth - 10;
    if (left < 10) left = rect.right + 10;

    let top = rect.top;
    if (top + pickerHeight > window.innerHeight) {
      top = window.innerHeight - pickerHeight - 20;
    }
    return { top: Math.max(10, top), left: Math.max(10, left) };
  };

  const applyDuoTheme = (combo) => {
    setPrimaryColor(combo.fill);
    setAccentColor(combo.stroke);
    applyUpdates({ primaryColor: combo.fill, accentColor: combo.stroke });
  };

  return (
    <div className="w-full flex flex-col gap-[0.6vw] font-sans text-gray-800 pt-[0.2vw] pr-[0.2vw] select-none">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-[0.3vw] pl-[0.5vw] pr-[0.2vw] border-b border-gray-100">
        <div className="flex items-center gap-[0.4vw]">
          <Sparkles className="w-[1vw] h-[1vw] text-[#E05638]" />
          <span className="text-[0.85vw] font-medium text-gray-800 truncate max-w-[12vw]">
            {presetTitle}
          </span>
        </div>
        <span className="text-[0.65vw] font-medium text-[#E05638] uppercase bg-[#E05638]/10 px-[0.4vw] py-[0.1vw] rounded-[0.3vw]">
          {categoryName}
        </span>
      </div>

      {/* =====================================================================
          MODE A: COMBINED PROPERTIES FOR ANIMATED SHAPES & LINES
          ===================================================================== */}
      {!isStarburst ? (
        <>
          {/* ─── 1. MOTION ENGINE ─── */}
          <SectionHeader title="Motion Engine" />

          {/* Motion Effect */}
          <PropertyRow label="Motion Effect">
            <CustomSelect
              value={animPreset}
              onChange={(val) => {
                setAnimPreset(val);
                applyUpdates({ animPreset: val });
              }}
              options={MOTION_EFFECTS}
            />
          </PropertyRow>

          {/* Speed / Duration */}
          <PropertySlider
            label="Duration"
            value={duration}
            min={0.3}
            max={6.0}
            step={0.1}
            unit="s"
            onChange={(val) => {
              setDuration(val);
              applyUpdates({ duration: val });
            }}
          />

          {/* Playback Mode */}
          <PropertyRow label="Playback">
            <div className="grid grid-cols-3 gap-[0.3vw] w-full">
              {[
                { id: 'infinite', label: 'Loop' },
                { id: 'alternate', label: 'Bounce' },
                { id: 'once', label: 'Play Once' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setLoopMode(m.id);
                    applyUpdates({ loopMode: m.id });
                  }}
                  className={`text-[0.72vw] py-[0.35vw] rounded-[0.4vw] font-medium text-center border transition-all cursor-pointer ${
                    loopMode === m.id
                      ? 'bg-[#E05638]/10 border-[#E05638] text-[#E05638] font-semibold'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </PropertyRow>

          {/* ─── 2. COLOR & STYLING ─── */}
          <SectionHeader title="Color & Styling" />

          {/* Curated Duo Themes */}
          <PropertyRow label="Presets">
            <div className="grid grid-cols-4 gap-[0.25vw] w-full">
              {COLOR_COMBINATIONS.map((combo) => (
                <button
                  key={combo.name}
                  type="button"
                  onClick={() => applyDuoTheme(combo)}
                  title={combo.name}
                  className="p-[0.25vw] rounded-[0.4vw] bg-white border border-gray-200 hover:border-[#E05638] flex items-center justify-center gap-[0.2vw] transition-all shadow-2xs cursor-pointer"
                >
                  <span className="w-[0.65vw] h-[0.65vw] rounded-full" style={{ background: combo.fill }} />
                  <span className="w-[0.65vw] h-[0.65vw] rounded-full" style={{ background: combo.stroke }} />
                </button>
              ))}
            </div>
          </PropertyRow>

          {/* Primary Color */}
          <PropertyRow label="Primary Color">
            <ColorInput
              color={primaryColor}
              onChange={(newCol) => {
                setPrimaryColor(newCol);
                applyUpdates({ primaryColor: newCol });
              }}
              onOpenPicker={() => setActivePicker((prev) => (prev === 'primary' ? null : 'primary'))}
              isActive={activePicker === 'primary'}
            />
          </PropertyRow>

          {/* Accent Color */}
          <PropertyRow label="Accent Color">
            <ColorInput
              color={accentColor}
              onChange={(newCol) => {
                setAccentColor(newCol);
                applyUpdates({ accentColor: newCol });
              }}
              onOpenPicker={() => setActivePicker((prev) => (prev === 'accent' ? null : 'accent'))}
              isActive={activePicker === 'accent'}
            />
          </PropertyRow>

          {/* Line Weight */}
          <PropertySlider
            label="Line Weight"
            value={strokeWidth}
            min={0}
            max={20}
            unit="px"
            onChange={(val) => {
              setStrokeWidth(val);
              applyUpdates({ strokeWidth: val });
            }}
          />

          {/* Dash Style */}
          <PropertyRow label="Dash Style">
            <CustomSelect
              value={dashStyle}
              onChange={(val) => {
                setDashStyle(val);
                applyUpdates({ dashStyle: val });
              }}
              options={[
                { value: 'preserve', label: 'Keep Preset Flow' },
                { value: 'none', label: 'Solid Line' },
                { value: '6,6', label: 'Dashed Flow' },
                { value: '3,6', label: 'Dotted Flow' }
              ]}
            />
          </PropertyRow>

          {/* Glow Aura Toggle */}
          <div className="flex items-center justify-between pl-[0.5vw] pr-[0.2vw] h-[2.2vw]">
            <span className="text-[0.78vw] text-gray-700 font-medium">Glow Aura</span>
            <Toggle
              checked={glowEnabled}
              onChange={() => {
                const next = !glowEnabled;
                setGlowEnabled(next);
                applyUpdates({ glowEnabled: next });
              }}
            />
          </div>

          {glowEnabled && (
            <PropertySlider
              label="Glow Size"
              value={glowIntensity}
              min={2}
              max={30}
              unit="px"
              onChange={(val) => {
                setGlowIntensity(val);
                applyUpdates({ glowIntensity: val });
              }}
            />
          )}
        </>
      ) : (
        /* =====================================================================
           MODE B: UNCOMBINED STARBURST BADGES (Original Full Individual Properties)
           ===================================================================== */
        <>
          {/* ─── 1. BADGE TEXT ─── */}
          <SectionHeader title="Badge Text" />

          <div className="flex flex-col gap-[0.25vw] pl-[0.5vw] pr-[0.2vw]">
            <span className="text-[0.7vw] font-medium text-gray-500">Text Lines</span>
            <textarea
              value={starburstText}
              onChange={(e) => {
                const val = e.target.value;
                setStarburstText(val);
                applyUpdates({ text: val });
              }}
              rows={3}
              className="w-full text-[0.78vw] p-[0.6vw] border border-gray-200 rounded-[0.5vw] outline-none focus:border-[#E05638] font-sans resize-none shadow-2xs bg-white text-gray-800"
              placeholder="Enter Starburst text..."
            />
          </div>

          <PropertyRow label="Font">
            <CustomSelect
              value={fontFamily}
              onChange={(val) => {
                setFontFamily(val);
                applyUpdates({ fontFamily: val });
              }}
              options={fontFamilies.map((f) => ({ value: f, label: f }))}
            />
          </PropertyRow>

          <PropertyRow label="Weight">
            <CustomSelect
              value={fontWeight}
              onChange={(val) => {
                setFontWeight(val);
                applyUpdates({ fontWeight: val });
              }}
              options={fontWeights.map((w) => ({ value: w.value, label: w.name }))}
            />
          </PropertyRow>

          <PropertyRow label="Size">
            <CustomSelect
              value={fontSize}
              onChange={(val) => {
                const v = parseInt(val, 10);
                setFontSize(v);
                applyUpdates({ fontSize: v });
              }}
              options={fontSizes.map((s) => ({ value: s, label: `${s}px` }))}
            />
          </PropertyRow>

          {/* ─── 2. COLOR & STYLING ─── */}
          <SectionHeader title="Color & Styling" />

          <PropertyRow label="Idle Color">
            <ColorInput
              color={burstColor}
              onChange={(newCol) => {
                setBurstColor(newCol);
                applyUpdates({ burstColor: newCol });
              }}
              onOpenPicker={() => setActivePicker((prev) => (prev === 'burst' ? null : 'burst'))}
              isActive={activePicker === 'burst'}
            />
          </PropertyRow>

          <PropertyRow label="Hover Color">
            <ColorInput
              color={hoverBurstColor}
              onChange={(newCol) => {
                setHoverBurstColor(newCol);
                applyUpdates({ hoverBurstColor: newCol });
              }}
              onOpenPicker={() => setActivePicker((prev) => (prev === 'hoverBurst' ? null : 'hoverBurst'))}
              isActive={activePicker === 'hoverBurst'}
            />
          </PropertyRow>

          <PropertyRow label="Idle Text">
            <ColorInput
              color={textColor}
              onChange={(newCol) => {
                setTextColor(newCol);
                applyUpdates({ textColor: newCol });
              }}
              onOpenPicker={() => setActivePicker((prev) => (prev === 'text' ? null : 'text'))}
              isActive={activePicker === 'text'}
            />
          </PropertyRow>

          <PropertyRow label="Hover Text">
            <ColorInput
              color={hoverTextColor}
              onChange={(newCol) => {
                setHoverTextColor(newCol);
                applyUpdates({ hoverTextColor: newCol });
              }}
              onOpenPicker={() => setActivePicker((prev) => (prev === 'hoverText' ? null : 'hoverText'))}
              isActive={activePicker === 'hoverText'}
            />
          </PropertyRow>

          {/* ─── 3. ROTATION & ANIMATION ─── */}
          <SectionHeader title="Rotation & Animation" />

          <PropertySlider
            label="Idle Rotation"
            value={rotation}
            min={-180}
            max={180}
            unit="°"
            onChange={(val) => {
              setRotation(val);
              applyUpdates({ rotation: val });
            }}
          />
          <PropertySlider
            label="Hover Spin"
            value={hoverRotation}
            min={-360}
            max={360}
            unit="°"
            onChange={(val) => {
              setHoverRotation(val);
              applyUpdates({ hoverRotation: val });
            }}
          />
          <PropertySlider
            label="Corner Radius"
            value={borderRadius}
            min={0}
            max={50}
            unit="px"
            onChange={(val) => {
              setBorderRadius(val);
              applyUpdates({ borderRadius: val });
            }}
          />
        </>
      )}

      {/* Floating Color Picker Portal */}
      {activePicker &&
        createPortal(
          <div
            className="fixed z-[5000]"
            style={{
              top: '50%',
              right: '19.5vw',
              transform: 'translateY(-50%)'
            }}
          >
            <div
              className="fixed inset-0 z-[-1]"
              onClick={() => setActivePicker(null)}
            />
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <ColorPicker
                color={
                  activePicker === 'primary'
                    ? primaryColor
                    : activePicker === 'accent'
                    ? accentColor
                    : activePicker === 'burst'
                    ? burstColor
                    : activePicker === 'hoverBurst'
                    ? hoverBurstColor
                    : activePicker === 'text'
                    ? textColor
                    : hoverTextColor
                }
                onChange={(newCol) => {
                  if (activePicker === 'primary') {
                    setPrimaryColor(newCol);
                    applyUpdates({ primaryColor: newCol });
                  } else if (activePicker === 'accent') {
                    setAccentColor(newCol);
                    applyUpdates({ accentColor: newCol });
                  } else if (activePicker === 'burst') {
                    setBurstColor(newCol);
                    applyUpdates({ burstColor: newCol });
                  } else if (activePicker === 'hoverBurst') {
                    setHoverBurstColor(newCol);
                    applyUpdates({ hoverBurstColor: newCol });
                  } else if (activePicker === 'text') {
                    setTextColor(newCol);
                    applyUpdates({ textColor: newCol });
                  } else if (activePicker === 'hoverText') {
                    setHoverTextColor(newCol);
                    applyUpdates({ hoverTextColor: newCol });
                  }
                }}
                onClose={() => setActivePicker(null)}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AnimatedDecoratorsProperties;
