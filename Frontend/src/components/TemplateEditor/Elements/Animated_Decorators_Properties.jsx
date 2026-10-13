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

const SectionHeader = ({ title, icon: IconComponent }) => (
  <div className="flex items-center gap-[0.4vw] my-[0.3vw]">
    <h2 className="text-[0.8vw] font-bold text-[#1e2538] whitespace-nowrap tracking-tight">{title}</h2>
    <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
  </div>
);

const PropertySlider = ({ label, value, onChange, min = 0, max = 360, step = 1, unit = '' }) => (
  <div className="flex items-center justify-between py-[0.1vw]">
    <span className="text-[0.7vw] font-medium text-gray-700 w-[5.5vw]">{label} :</span>
    <div className="flex-grow flex items-center gap-[0.5vw]">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value !== undefined ? value : min}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="flex-grow h-[0.25vw] appearance-none cursor-pointer bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[0.8vw] [&::-webkit-slider-thumb]:h-[0.8vw] [&::-webkit-slider-thumb]:bg-[#544af4] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_5px_rgba(84,74,244,0.5)]"
        style={{
          background: `linear-gradient(to right, #544af4 0%, #544af4 ${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%, #e5e7eb ${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%, #e5e7eb 100%)`,
        }}
      />
      <div className="w-[3.2vw] h-[1.4vw] flex items-center justify-center bg-white border border-gray-200 rounded-[0.3vw] shadow-sm">
        <input
          type="text"
          value={`${value !== undefined ? value : min}${unit}`}
          readOnly
          className="w-full text-center text-[0.7vw] text-gray-700 font-medium outline-none bg-transparent cursor-default"
        />
      </div>
    </div>
  </div>
);

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
    <div className="flex flex-col gap-[0.7vw] p-[0.6vw] font-sans text-[#1e2538]">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-[0.3vw] border-b border-gray-100">
        <div className="flex items-center gap-[0.4vw]">
          <Sparkles className="w-[1vw] h-[1vw] text-indigo-600" />
          <span className="text-[0.88vw] font-bold text-gray-900 truncate max-w-[12vw]">
            {presetTitle}
          </span>
        </div>
        <span className="text-[0.6vw] font-bold text-indigo-600 uppercase bg-indigo-50 border border-indigo-200/50 px-[0.4vw] py-[0.1vw] rounded">
          {categoryName}
        </span>
      </div>

      {/* =====================================================================
          MODE A: COMBINED PROPERTIES FOR ANIMATED SHAPES & LINES
          ===================================================================== */}
      {!isStarburst ? (
        <>
          {/* Card 1: Combined Motion Engine */}
          <div className="flex flex-col gap-[0.45vw] bg-gray-50/70 p-[0.6vw] rounded-[0.5vw] border border-gray-200/70">
            <SectionHeader title="Motion Engine" icon={Clapperboard} />

            {/* Motion Effect */}
            <div>
              <label className="block text-[0.68vw] font-semibold text-gray-600 mb-[0.15vw]">
                Motion Effect
              </label>
              <select
                value={animPreset}
                onChange={(e) => {
                  const val = e.target.value;
                  setAnimPreset(val);
                  applyUpdates({ animPreset: val });
                }}
                className="w-full text-[0.75vw] p-[0.35vw] border border-gray-200 rounded-[0.35vw] bg-white outline-none cursor-pointer focus:border-indigo-500 font-medium"
              >
                {MOTION_EFFECTS.map((eff) => (
                  <option key={eff.id} value={eff.id}>
                    {eff.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed / Duration */}
            <div className="flex flex-col gap-[0.2vw]">
              <div className="flex items-center justify-between">
                <span className="text-[0.68vw] font-semibold text-gray-600">Speed</span>
                <div className="flex items-center gap-[0.2vw]">
                  {[
                    { label: 'Fast', val: 1.0 },
                    { label: 'Normal', val: 2.0 },
                    { label: 'Smooth', val: 3.5 }
                  ].map((pill) => (
                    <button
                      key={pill.label}
                      onClick={() => {
                        setDuration(pill.val);
                        applyUpdates({ duration: pill.val });
                      }}
                      className={`text-[0.6vw] px-[0.35vw] py-[0.1vw] rounded font-medium transition-colors ${
                        duration === pill.val
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-400'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>
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
            </div>

            {/* Playback Mode Pills */}
            <div>
              <span className="text-[0.68vw] font-semibold text-gray-600 block mb-[0.2vw]">Playback Mode</span>
              <div className="grid grid-cols-3 gap-[0.3vw]">
                {[
                  { id: 'infinite', label: 'Loop' },
                  { id: 'alternate', label: 'Bounce' },
                  { id: 'once', label: 'Play Once' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setLoopMode(m.id);
                      applyUpdates({ loopMode: m.id });
                    }}
                    className={`text-[0.68vw] py-[0.25vw] rounded-[0.3vw] font-medium text-center border transition-all ${
                      loopMode === m.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Combined Color & Styling */}
          <div className="flex flex-col gap-[0.45vw] bg-gray-50/70 p-[0.6vw] rounded-[0.5vw] border border-gray-200/70">
            <SectionHeader title="Color & Styling" icon={Palette} />

            {/* Curated Duo Themes */}
            <div>
              <span className="text-[0.68vw] font-semibold text-gray-600 block mb-[0.2vw]">Preset Themes</span>
              <div className="grid grid-cols-4 gap-[0.25vw]">
                {COLOR_COMBINATIONS.map((combo) => (
                  <button
                    key={combo.name}
                    onClick={() => applyDuoTheme(combo)}
                    title={combo.name}
                    className="p-[0.2vw] rounded-[0.3vw] bg-white border border-gray-200 hover:border-indigo-400 flex items-center justify-center gap-[0.2vw] transition-all shadow-sm"
                  >
                    <span className="w-[0.65vw] h-[0.65vw] rounded-full" style={{ background: combo.fill }} />
                    <span className="w-[0.65vw] h-[0.65vw] rounded-full" style={{ background: combo.stroke }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Color Swatches */}
            <div className="grid grid-cols-2 gap-[0.4vw] mt-[0.1vw]">
              <div className="flex flex-col gap-[0.15vw]">
                <span className="text-[0.68vw] font-semibold text-gray-600">Primary Color</span>
                <div
                  ref={triggerRefs.primary}
                  onClick={() => setActivePicker(activePicker === 'primary' ? null : 'primary')}
                  className="flex items-center gap-[0.35vw] p-[0.3vw] border border-gray-200 rounded-[0.3vw] cursor-pointer hover:border-indigo-500 bg-white shadow-sm"
                >
                  <div
                    className="w-[1.2vw] h-[1.2vw] rounded-[0.2vw] border border-gray-200 shadow-inner"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="text-[0.7vw] font-mono text-gray-700">{primaryColor}</span>
                </div>
              </div>

              <div className="flex flex-col gap-[0.15vw]">
                <span className="text-[0.68vw] font-semibold text-gray-600">Accent Color</span>
                <div
                  ref={triggerRefs.accent}
                  onClick={() => setActivePicker(activePicker === 'accent' ? null : 'accent')}
                  className="flex items-center gap-[0.35vw] p-[0.3vw] border border-gray-200 rounded-[0.3vw] cursor-pointer hover:border-indigo-500 bg-white shadow-sm"
                >
                  <div
                    className="w-[1.2vw] h-[1.2vw] rounded-[0.2vw] border border-gray-200 shadow-inner"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="text-[0.7vw] font-mono text-gray-700">{accentColor}</span>
                </div>
              </div>
            </div>

            {/* Stroke Width & Dash Style */}
            <div className="flex flex-col gap-[0.35vw] pt-[0.2vw] border-t border-gray-200/60 mt-[0.1vw]">
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

              <div className="flex items-center justify-between py-[0.1vw]">
                <span className="text-[0.7vw] font-medium text-gray-700 w-[5.5vw]">Dash Style :</span>
                <select
                  value={dashStyle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDashStyle(val);
                    applyUpdates({ dashStyle: val });
                  }}
                  className="flex-grow text-[0.7vw] p-[0.25vw] border border-gray-200 rounded-[0.3vw] bg-white outline-none cursor-pointer"
                >
                  <option value="preserve">Keep Preset Flow</option>
                  <option value="none">Solid Line</option>
                  <option value="6,6">Dashed Flow</option>
                  <option value="3,6">Dotted Flow</option>
                </select>
              </div>

              {/* Glow Aura Toggle */}
              <div className="flex items-center justify-between py-[0.1vw]">
                <div className="flex items-center gap-[0.3vw]">
                  <button
                    onClick={() => {
                      const next = !glowEnabled;
                      setGlowEnabled(next);
                      applyUpdates({ glowEnabled: next });
                    }}
                    className={`w-[1.6vw] h-[0.9vw] rounded-full p-[0.1vw] transition-colors relative ${
                      glowEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-[0.7vw] h-[0.7vw] rounded-full bg-white transition-transform ${
                        glowEnabled ? 'translate-x-[0.7vw]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-[0.7vw] font-medium text-gray-700">Glow Aura</span>
                </div>
              </div>

              {glowEnabled && (
                <PropertySlider
                  label="Intensity"
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
            </div>
          </div>
        </>
      ) : (
        /* =====================================================================
           MODE B: UNCOMBINED STARBURST BADGES (Original Full Individual Properties)
           ===================================================================== */
        <>
          {/* Badge Text */}
          <div className="flex flex-col gap-[0.5vw]">
            <SectionHeader title="Badge Text" icon={Type} />
            <div className="flex flex-col gap-[0.2vw]">
              <span className="text-[0.72vw] font-semibold text-gray-600">Text Lines:</span>
              <textarea
                value={starburstText}
                onChange={(e) => {
                  const val = e.target.value;
                  setStarburstText(val);
                  applyUpdates({ text: val });
                }}
                rows={3}
                className="w-full text-[0.78vw] p-[0.5vw] border border-gray-200 rounded-[0.4vw] outline-none focus:border-indigo-500 font-sans resize-none"
                placeholder="Enter Starburst text..."
              />
            </div>

            {/* Typography Controls */}
            <div className="grid grid-cols-3 gap-[0.4vw]">
              <div>
                <span className="text-[0.68vw] font-semibold text-gray-600">Font</span>
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFontFamily(val);
                    applyUpdates({ fontFamily: val });
                  }}
                  className="w-full text-[0.72vw] p-[0.35vw] border border-gray-200 rounded-[0.3vw] bg-white outline-none cursor-pointer"
                >
                  {fontFamilies.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[0.68vw] font-semibold text-gray-600">Weight</span>
                <select
                  value={fontWeight}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFontWeight(val);
                    applyUpdates({ fontWeight: val });
                  }}
                  className="w-full text-[0.72vw] p-[0.35vw] border border-gray-200 rounded-[0.3vw] bg-white outline-none cursor-pointer"
                >
                  {fontWeights.map((w) => (
                    <option key={w.value} value={w.value}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[0.68vw] font-semibold text-gray-600">Size</span>
                <select
                  value={fontSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setFontSize(val);
                    applyUpdates({ fontSize: val });
                  }}
                  className="w-full text-[0.72vw] p-[0.35vw] border border-gray-200 rounded-[0.3vw] bg-white outline-none cursor-pointer"
                >
                  {fontSizes.map((s) => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Starburst Individual Colors */}
          <div className="flex flex-col gap-[0.5vw]">
            <SectionHeader title="Color & Styling" icon={Palette} />
            <div className="grid grid-cols-2 gap-[0.5vw]">
              <div className="flex flex-col gap-[0.2vw]">
                <span className="text-[0.68vw] font-semibold text-gray-600">Idle Starburst</span>
                <div
                  ref={triggerRefs.burst}
                  onClick={() => setActivePicker(activePicker === 'burst' ? null : 'burst')}
                  className="flex items-center gap-[0.35vw] p-[0.35vw] border border-gray-200 rounded-[0.35vw] cursor-pointer hover:border-indigo-500 bg-white shadow-sm"
                >
                  <div className="w-[1.2vw] h-[1.2vw] rounded-[0.2vw] border border-gray-200" style={{ backgroundColor: burstColor }} />
                  <span className="text-[0.7vw] font-mono text-gray-700">{burstColor}</span>
                </div>
              </div>

              <div className="flex flex-col gap-[0.2vw]">
                <span className="text-[0.68vw] font-semibold text-gray-600">Hover Starburst</span>
                <div
                  ref={triggerRefs.hoverBurst}
                  onClick={() => setActivePicker(activePicker === 'hoverBurst' ? null : 'hoverBurst')}
                  className="flex items-center gap-[0.35vw] p-[0.35vw] border border-gray-200 rounded-[0.35vw] cursor-pointer hover:border-indigo-500 bg-white shadow-sm"
                >
                  <div className="w-[1.2vw] h-[1.2vw] rounded-[0.2vw] border border-gray-200" style={{ backgroundColor: hoverBurstColor }} />
                  <span className="text-[0.7vw] font-mono text-gray-700">{hoverBurstColor}</span>
                </div>
              </div>

              <div className="flex flex-col gap-[0.2vw]">
                <span className="text-[0.68vw] font-semibold text-gray-600">Idle Text</span>
                <div
                  ref={triggerRefs.text}
                  onClick={() => setActivePicker(activePicker === 'text' ? null : 'text')}
                  className="flex items-center gap-[0.35vw] p-[0.35vw] border border-gray-200 rounded-[0.35vw] cursor-pointer hover:border-indigo-500 bg-white shadow-sm"
                >
                  <div className="w-[1.2vw] h-[1.2vw] rounded-[0.2vw] border border-gray-200" style={{ backgroundColor: textColor }} />
                  <span className="text-[0.7vw] font-mono text-gray-700">{textColor}</span>
                </div>
              </div>

              <div className="flex flex-col gap-[0.2vw]">
                <span className="text-[0.68vw] font-semibold text-gray-600">Hover Text</span>
                <div
                  ref={triggerRefs.hoverText}
                  onClick={() => setActivePicker(activePicker === 'hoverText' ? null : 'hoverText')}
                  className="flex items-center gap-[0.35vw] p-[0.35vw] border border-gray-200 rounded-[0.35vw] cursor-pointer hover:border-indigo-500 bg-white shadow-sm"
                >
                  <div className="w-[1.2vw] h-[1.2vw] rounded-[0.2vw] border border-gray-200" style={{ backgroundColor: hoverTextColor }} />
                  <span className="text-[0.7vw] font-mono text-gray-700">{hoverTextColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Starburst Individual Rotations & Radius */}
          <div className="flex flex-col gap-[0.5vw]">
            <SectionHeader title="Rotation & Animation" icon={Sliders} />
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
          </div>
        </>
      )}

      {/* Floating Color Picker Portal */}
      {activePicker &&
        createPortal(
          <div
            ref={colorPickerRef}
            className="fixed z-[99999] bg-white rounded-xl shadow-2xl border border-gray-200 p-[0.8vw]"
            style={getPortalPosition(triggerRefs[activePicker])}
          >
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
          </div>,
          document.body
        )}
    </div>
  );
};

export default AnimatedDecoratorsProperties;
