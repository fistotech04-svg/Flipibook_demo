import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Link2, 
  Link2Off, 
  Check 
} from 'lucide-react';
import ColorPicker from '../ColorPicker';
import Effect from '../Effect';
import { handleScrubHelper } from '../Color';

const ShapeAppearanceControls = ({
  backgroundColor,
  setBackgroundColor,
  activeColorPicker,
  setActiveColorPicker,
  colorsOnPage = [],
  radius,
  setRadius,
  isRadiusLinked,
  setIsRadiusLinked,
  hideCornerRadius = false,
  activeEffects = [],
  setActiveEffects,
  effectSettings = {},
  setEffectSettings,
  openSubSection,
  setOpenSubSection,
  showDetailedPicker,
  setShowDetailedPicker,
  isShape = true
}) => {
  // Local input states for text typing
  const [localFillHex, setLocalFillHex] = useState(null);
  const [localStrokeHex, setLocalStrokeHex] = useState(null);
  const [isAlignDropdownOpen, setIsAlignDropdownOpen] = useState(false);
  const [isCornerDropdownOpen, setIsCornerDropdownOpen] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [colorFormat, setColorFormat] = useState('HEX');

  const currentFillHex = localFillHex !== null ? localFillHex : (backgroundColor?.fill && backgroundColor.fill !== 'inherit' ? backgroundColor.fill : '#3194FC');
  const currentStrokeHex = localStrokeHex !== null ? localStrokeHex : (backgroundColor?.stroke && backgroundColor.stroke !== 'none' && backgroundColor.stroke !== 'inherit' ? backgroundColor.stroke : '#000000');

  // Hex input commit helpers
  const handleHexSubmit = (type, val) => {
    let clean = (val || '').trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (/^#[0-9A-Fa-f]{3,8}$/.test(clean)) {
      if (type === 'fill') {
        setLocalFillHex(null);
        setBackgroundColor(prev => ({ ...prev, fill: clean, fillType: 'solid' }));
      } else {
        setLocalStrokeHex(null);
        setBackgroundColor(prev => ({
          ...prev,
          stroke: clean,
          strokeType: 'solid',
          strokeWeight: (parseFloat(prev.strokeWeight) || 0) === 0 ? 2 : prev.strokeWeight
        }));
      }
    } else {
      if (type === 'fill') setLocalFillHex(null);
      else setLocalStrokeHex(null);
    }
  };

  // Corner radius update helper
  const handleCornerChange = (corner, delta) => {
    const currentVal = parseInt(radius?.[corner] || 0);
    const nextVal = Math.max(0, currentVal + delta);
    if (isRadiusLinked) {
      setRadius({ tl: nextVal, tr: nextVal, bl: nextVal, br: nextVal });
    } else {
      setRadius(prev => ({ ...prev, [corner]: nextVal }));
    }
  };

  const handleCornerInput = (corner, val) => {
    const parsed = Math.max(0, parseInt(val) || 0);
    if (isRadiusLinked) {
      setRadius({ tl: parsed, tr: parsed, bl: parsed, br: parsed });
    } else {
      setRadius(prev => ({ ...prev, [corner]: parsed }));
    }
  };

  return (
    <div className="flex flex-col gap-[1vw] font-sans select-none text-gray-800">
      
      {/* ===================== 1. FILL COLOR ===================== */}
      <div className="flex flex-col gap-[0.5vw]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.82vw] font-bold text-gray-800 whitespace-nowrap tracking-tight">Fill Color</span>
          <div className="h-[1px] flex-1 bg-gray-200"></div>
        </div>

        <div className="flex items-center gap-[0.5vw]">
          {/* Swatch */}
          <button
            type="button"
            onClick={() => setActiveColorPicker(activeColorPicker === 'fill' ? null : 'fill')}
            className="w-[2.2vw] h-[2.2vw] rounded-[0.45vw] border border-gray-200 shadow-sm cursor-pointer hover:border-gray-400 transition-all flex-shrink-0 relative overflow-hidden"
            style={{ backgroundColor: backgroundColor?.fill && backgroundColor.fill !== 'inherit' ? backgroundColor.fill : '#3194FC' }}
            title="Choose Fill Color"
          />

          {/* Hex & Opacity Input */}
          <div className="flex-1 h-[2.2vw] bg-white border border-gray-200 rounded-[0.45vw] flex items-center justify-between px-[0.6vw] shadow-sm focus-within:border-indigo-500 transition-all">
            <input
              type="text"
              value={currentFillHex.toUpperCase()}
              onChange={(e) => setLocalFillHex(e.target.value)}
              onBlur={() => handleHexSubmit('fill', currentFillHex)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleHexSubmit('fill', currentFillHex); }}
              className="text-[0.76vw] font-semibold text-gray-700 w-[5vw] outline-none uppercase bg-transparent"
            />
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                max="100"
                value={Math.round(backgroundColor?.fillOpacity !== undefined ? backgroundColor.fillOpacity : 100)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    setBackgroundColor(prev => ({ ...prev, fillOpacity: Math.min(100, Math.max(0, val)) }));
                  }
                }}
                className="w-[2vw] text-right text-[0.74vw] text-gray-500 font-semibold outline-none bg-transparent no-spin"
              />
              <span className="text-[0.74vw] text-gray-500 font-semibold ml-[0.1vw]">%</span>
            </div>
          </div>

          {/* Format Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFormatDropdownOpen(prev => !prev)}
              className="h-[2.2vw] px-[0.6vw] bg-white border border-gray-200 rounded-[0.45vw] flex items-center gap-[0.3vw] text-[0.74vw] font-semibold text-gray-700 shadow-sm hover:border-gray-300 cursor-pointer transition-all"
            >
              <span>{colorFormat}</span>
              <ChevronDown size="0.75vw" className="text-gray-400" />
            </button>

            {isFormatDropdownOpen && (
              <div className="absolute top-[2.4vw] right-0 w-[5.5vw] bg-white border border-gray-200 rounded-[0.45vw] shadow-lg z-50 py-[0.2vw]">
                {['HEX', 'RGB', 'HSL'].map(fmt => (
                  <div
                    key={fmt}
                    onClick={() => {
                      setColorFormat(fmt);
                      setIsFormatDropdownOpen(false);
                    }}
                    className={`px-[0.6vw] py-[0.3vw] text-[0.72vw] cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                      colorFormat === fmt ? 'font-bold text-indigo-600' : 'text-gray-700'
                    }`}
                  >
                    <span>{fmt}</span>
                    {colorFormat === fmt && <Check size="0.7vw" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================== 2. STOKE COLOR ===================== */}
      <div className="flex flex-col gap-[0.5vw]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.82vw] font-bold text-gray-800 whitespace-nowrap tracking-tight">Stoke Color</span>
          <div className="h-[1px] flex-1 bg-gray-200"></div>
        </div>

        {/* Row 1: Swatch + Hex/Opacity + Format */}
        <div className="flex items-center gap-[0.5vw]">
          <button
            type="button"
            onClick={() => setActiveColorPicker(activeColorPicker === 'stroke' ? null : 'stroke')}
            className="w-[2.2vw] h-[2.2vw] rounded-[0.45vw] border border-gray-200 shadow-sm cursor-pointer hover:border-gray-400 transition-all flex-shrink-0 relative overflow-hidden"
            style={{ backgroundColor: backgroundColor?.stroke && backgroundColor.stroke !== 'none' && backgroundColor.stroke !== 'inherit' ? backgroundColor.stroke : '#000000' }}
            title="Choose Stroke Color"
          />

          <div className="flex-1 h-[2.2vw] bg-white border border-gray-200 rounded-[0.45vw] flex items-center justify-between px-[0.6vw] shadow-sm focus-within:border-indigo-500 transition-all">
            <input
              type="text"
              value={currentStrokeHex.toUpperCase()}
              onChange={(e) => setLocalStrokeHex(e.target.value)}
              onBlur={() => handleHexSubmit('stroke', currentStrokeHex)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleHexSubmit('stroke', currentStrokeHex); }}
              className="text-[0.76vw] font-semibold text-gray-700 w-[5vw] outline-none uppercase bg-transparent"
            />
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                max="100"
                value={Math.round(backgroundColor?.strokeOpacity !== undefined ? backgroundColor.strokeOpacity : 100)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    setBackgroundColor(prev => ({ ...prev, strokeOpacity: Math.min(100, Math.max(0, val)) }));
                  }
                }}
                className="w-[2vw] text-right text-[0.74vw] text-gray-500 font-semibold outline-none bg-transparent no-spin"
              />
              <span className="text-[0.74vw] text-gray-500 font-semibold ml-[0.1vw]">%</span>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              className="h-[2.2vw] px-[0.6vw] bg-white border border-gray-200 rounded-[0.45vw] flex items-center gap-[0.3vw] text-[0.74vw] font-semibold text-gray-700 shadow-sm cursor-default"
            >
              <span>{colorFormat}</span>
              <ChevronDown size="0.75vw" className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Row 2: Alignment & Stoke Width */}
        <div className="grid grid-cols-2 gap-[0.75vw] mt-[0.2vw]">
          {/* Alignment */}
          <div className="flex flex-col gap-[0.25vw] relative">
            <span className="text-[0.7vw] text-gray-400 font-medium">Alignment</span>
            <button
              type="button"
              onClick={() => setIsAlignDropdownOpen(prev => !prev)}
              className="w-full h-[2.1vw] bg-white border border-gray-200 rounded-[0.45vw] px-[0.6vw] flex items-center justify-between text-[0.75vw] text-gray-700 font-semibold shadow-sm hover:border-gray-300 transition-all cursor-pointer"
            >
              <span>{backgroundColor?.strokePosition || 'Center'}</span>
              <ChevronDown size="0.75vw" className="text-gray-400" />
            </button>

            {isAlignDropdownOpen && (
              <div className="absolute top-[3.3vw] left-0 w-full bg-white border border-gray-200 rounded-[0.45vw] shadow-lg z-50 py-[0.2vw] animate-in fade-in duration-150">
                {['Center', 'Inside', 'Outside'].map(pos => (
                  <div
                    key={pos}
                    onClick={() => {
                      setBackgroundColor(prev => ({ ...prev, strokePosition: pos }));
                      setIsAlignDropdownOpen(false);
                    }}
                    className={`px-[0.6vw] py-[0.3vw] text-[0.72vw] cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                      (backgroundColor?.strokePosition || 'Center') === pos ? 'font-bold text-indigo-600 bg-indigo-50/40' : 'text-gray-700'
                    }`}
                  >
                    <span>{pos}</span>
                    {(backgroundColor?.strokePosition || 'Center') === pos && <Check size="0.7vw" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stoke Width Stepper */}
          <div className="flex flex-col gap-[0.25vw]">
            <span className="text-[0.7vw] text-gray-400 font-medium">Stoke Width</span>
            <div className="flex items-center gap-[0.25vw] h-[2.1vw]">
              <button
                type="button"
                onClick={() => setBackgroundColor(prev => ({
                  ...prev,
                  strokeWeight: Math.max(0, (parseFloat(prev.strokeWeight) || 0) - 1)
                }))}
                className="w-[1.9vw] h-full bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-[0.4vw] flex items-center justify-center text-gray-600 font-bold text-[0.85vw] transition-all cursor-pointer"
              >
                −
              </button>
              <input
                type="number"
                min="0"
                max="100"
                value={Math.round(parseFloat(backgroundColor?.strokeWeight) || 0)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    setBackgroundColor(prev => ({ ...prev, strokeWeight: Math.max(0, val) }));
                  }
                }}
                className="flex-1 h-full bg-white border border-gray-200 rounded-[0.4vw] text-center text-[0.78vw] font-semibold text-gray-800 outline-none shadow-sm no-spin focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setBackgroundColor(prev => ({
                  ...prev,
                  strokeWeight: (parseFloat(prev.strokeWeight) || 0) + 1
                }))}
                className="w-[1.9vw] h-full bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-[0.4vw] flex items-center justify-center text-gray-600 font-bold text-[0.85vw] transition-all cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Line Style & Dash Property */}
        <div className="grid grid-cols-2 gap-[0.75vw] mt-[0.2vw]">
          {/* Line style buttons */}
          <div className="flex flex-col gap-[0.25vw]">
            <span className="text-[0.7vw] text-gray-400 font-medium">Line style</span>
            <div className="flex items-center gap-[0.25vw] h-[2.1vw]">
              {/* Solid */}
              <button
                type="button"
                onClick={() => setBackgroundColor(prev => ({ ...prev, strokeDashStyle: 'Solid', strokeDasharrayValue: 'none' }))}
                className={`flex-1 h-full rounded-[0.4vw] border flex items-center justify-center transition-all cursor-pointer ${
                  (backgroundColor?.strokeDashStyle || 'Solid') === 'Solid'
                    ? 'border-gray-400 bg-gray-100 shadow-inner'
                    : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                }`}
                title="Solid Line"
              >
                <div className="w-[1.2vw] h-[2px] bg-gray-600 rounded"></div>
              </button>

              {/* Dotted */}
              <button
                type="button"
                onClick={() => setBackgroundColor(prev => ({ ...prev, strokeDashStyle: 'Dotted', strokeDasharrayValue: '2,6' }))}
                className={`flex-1 h-full rounded-[0.4vw] border flex items-center justify-center transition-all cursor-pointer ${
                  backgroundColor?.strokeDashStyle === 'Dotted'
                    ? 'border-gray-400 bg-gray-100 shadow-inner'
                    : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                }`}
                title="Dotted Line"
              >
                <div className="flex items-center gap-[0.15vw]">
                  <div className="w-[2.5px] h-[2.5px] rounded-full bg-gray-600"></div>
                  <div className="w-[2.5px] h-[2.5px] rounded-full bg-gray-600"></div>
                  <div className="w-[2.5px] h-[2.5px] rounded-full bg-gray-600"></div>
                  <div className="w-[2.5px] h-[2.5px] rounded-full bg-gray-600"></div>
                </div>
              </button>

              {/* Dashed */}
              <button
                type="button"
                onClick={() => setBackgroundColor(prev => ({
                  ...prev,
                  strokeDashStyle: 'Dashed',
                  strokeDasharrayValue: `${prev.strokeDashLength || 8},${prev.strokeDashGap || 4}`
                }))}
                className={`flex-1 h-full rounded-[0.4vw] border flex items-center justify-center transition-all cursor-pointer ${
                  backgroundColor?.strokeDashStyle === 'Dashed'
                    ? 'border-gray-400 bg-gray-100 shadow-inner'
                    : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                }`}
                title="Dashed Line"
              >
                <div className="flex items-center gap-[0.2vw]">
                  <div className="w-[0.5vw] h-[2px] bg-gray-600 rounded"></div>
                  <div className="w-[0.5vw] h-[2px] bg-gray-600 rounded"></div>
                </div>
              </button>
            </div>
          </div>

          {/* Dash Property */}
          <div className="flex flex-col gap-[0.25vw]">
            <span className="text-[0.7vw] text-gray-400 font-medium">Dash Property</span>
            <div className="h-[2.1vw] bg-white border border-gray-200 rounded-[0.45vw] flex items-center justify-center px-[0.4vw] text-[0.75vw] text-gray-500 shadow-sm gap-[0.2vw] focus-within:border-indigo-500">
              <span className="font-semibold text-gray-400 text-[0.7vw]">L</span>
              <input
                type="number"
                min="1"
                value={backgroundColor?.strokeDashLength || 8}
                onChange={(e) => {
                  const len = parseInt(e.target.value) || 1;
                  const gap = backgroundColor?.strokeDashGap || 4;
                  setBackgroundColor(prev => ({
                    ...prev,
                    strokeDashLength: len,
                    strokeDasharrayValue: `${len},${gap}`
                  }));
                }}
                className="w-[1.6vw] text-center font-semibold text-gray-800 outline-none bg-transparent no-spin"
              />
              <span className="text-gray-300 font-bold">:</span>
              <span className="font-semibold text-gray-400 text-[0.7vw]">G</span>
              <input
                type="number"
                min="1"
                value={backgroundColor?.strokeDashGap || 4}
                onChange={(e) => {
                  const gap = parseInt(e.target.value) || 1;
                  const len = backgroundColor?.strokeDashLength || 8;
                  setBackgroundColor(prev => ({
                    ...prev,
                    strokeDashGap: gap,
                    strokeDasharrayValue: `${len},${gap}`
                  }));
                }}
                className="w-[1.6vw] text-center font-semibold text-gray-800 outline-none bg-transparent no-spin"
              />
            </div>
          </div>
        </div>

        {/* Row 4: Line Corner */}
        <div className="grid grid-cols-2 gap-[0.75vw] mt-[0.2vw]">
          <div className="flex flex-col gap-[0.25vw] relative">
            <span className="text-[0.7vw] text-gray-400 font-medium">Line Corner</span>
            <button
              type="button"
              onClick={() => setIsCornerDropdownOpen(prev => !prev)}
              className="w-full h-[2.1vw] bg-white border border-gray-200 rounded-[0.45vw] px-[0.6vw] flex items-center justify-between text-[0.75vw] text-gray-700 font-semibold shadow-sm hover:border-gray-300 transition-all cursor-pointer"
            >
              <span>
                {backgroundColor?.strokeLinecap === 'round' 
                  ? 'Rounded' 
                  : (backgroundColor?.strokeLinecap === 'square' ? 'Miter' : 'Bevel')}
              </span>
              <ChevronDown size="0.75vw" className="text-gray-400" />
            </button>

            {isCornerDropdownOpen && (
              <div className="absolute top-[3.3vw] left-0 w-full bg-white border border-gray-200 rounded-[0.45vw] shadow-lg z-50 py-[0.2vw] animate-in fade-in duration-150">
                {[
                  { label: 'Rounded', value: 'round' },
                  { label: 'Miter', value: 'square' },
                  { label: 'Bevel', value: 'butt' }
                ].map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      setBackgroundColor(prev => ({ ...prev, strokeLinecap: opt.value }));
                      setIsCornerDropdownOpen(false);
                    }}
                    className={`px-[0.6vw] py-[0.3vw] text-[0.72vw] cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                      (backgroundColor?.strokeLinecap || 'round') === opt.value ? 'font-bold text-indigo-600 bg-indigo-50/40' : 'text-gray-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {(backgroundColor?.strokeLinecap || 'round') === opt.value && <Check size="0.7vw" />}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div></div>
        </div>
      </div>

      {/* ===================== 3. CORNER RADIUS ===================== */}
      {!hideCornerRadius && (
        <div className="flex flex-col gap-[0.5vw]">
          <div className="flex items-center gap-[0.5vw]">
            <span className="text-[0.82vw] font-bold text-gray-800 whitespace-nowrap tracking-tight">Corner Radius</span>
            <div className="h-[1px] flex-1 bg-gray-200"></div>
          </div>

          <div className="relative flex items-center justify-center my-[0.4vw]">
            <div className="grid grid-cols-2 gap-x-[3.2vw] gap-y-[1.2vw] w-full max-w-[15.5vw]">
              
              {/* Top-Left */}
              <div
                onPointerDown={(e) => {
                  if (e.target.tagName === 'INPUT') return;
                  handleScrubHelper(e, radius?.tl ?? 0, (newVal) => handleCornerInput('tl', parseInt(newVal)));
                }}
                className="h-[2.2vw] bg-white border border-gray-200 rounded-tl-[0.9vw] rounded-tr-[0.25vw] rounded-bl-[0.25vw] rounded-br-[0.25vw] flex items-center justify-between px-[0.4vw] shadow-sm hover:border-gray-300 focus-within:border-indigo-500 transition-all cursor-ew-resize select-none"
              >
                <button
                  type="button"
                  onClick={() => handleCornerChange('tl', -1)}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-[0.1vw] cursor-pointer"
                >
                  <ChevronLeft size="0.8vw" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={radius?.tl ?? 0}
                  onChange={(e) => handleCornerInput('tl', e.target.value)}
                  className="w-[2vw] text-center text-[0.78vw] font-semibold text-gray-800 outline-none bg-transparent no-spin cursor-text"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={() => handleCornerChange('tl', 1)}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-[0.1vw] cursor-pointer"
                >
                  <ChevronRight size="0.8vw" />
                </button>
              </div>

              {/* Top-Right */}
              <div
                onPointerDown={(e) => {
                  if (e.target.tagName === 'INPUT') return;
                  handleScrubHelper(e, radius?.tr ?? 0, (newVal) => handleCornerInput('tr', parseInt(newVal)));
                }}
                className="h-[2.2vw] bg-white border border-gray-200 rounded-tr-[0.9vw] rounded-tl-[0.25vw] rounded-bl-[0.25vw] rounded-br-[0.25vw] flex items-center justify-between px-[0.4vw] shadow-sm hover:border-gray-300 focus-within:border-indigo-500 transition-all cursor-ew-resize select-none"
              >
                <button
                  type="button"
                  onClick={() => handleCornerChange('tr', -1)}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-[0.1vw] cursor-pointer"
                >
                  <ChevronLeft size="0.8vw" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={radius?.tr ?? 0}
                  onChange={(e) => handleCornerInput('tr', e.target.value)}
                  className="w-[2vw] text-center text-[0.78vw] font-semibold text-gray-800 outline-none bg-transparent no-spin cursor-text"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={() => handleCornerChange('tr', 1)}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-[0.1vw] cursor-pointer"
                >
                  <ChevronRight size="0.8vw" />
                </button>
              </div>

              {/* Bottom-Left */}
              <div
                onPointerDown={(e) => {
                  if (e.target.tagName === 'INPUT') return;
                  handleScrubHelper(e, radius?.bl ?? 0, (newVal) => handleCornerInput('bl', parseInt(newVal)));
                }}
                className="h-[2.2vw] bg-white border border-gray-200 rounded-bl-[0.9vw] rounded-tl-[0.25vw] rounded-tr-[0.25vw] rounded-br-[0.25vw] flex items-center justify-between px-[0.4vw] shadow-sm hover:border-gray-300 focus-within:border-indigo-500 transition-all cursor-ew-resize select-none"
              >
                <button
                  type="button"
                  onClick={() => handleCornerChange('bl', -1)}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-[0.1vw] cursor-pointer"
                >
                  <ChevronLeft size="0.8vw" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={radius?.bl ?? 0}
                  onChange={(e) => handleCornerInput('bl', e.target.value)}
                  className="w-[2vw] text-center text-[0.78vw] font-semibold text-gray-800 outline-none bg-transparent no-spin cursor-text"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={() => handleCornerChange('bl', 1)}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-[0.1vw] cursor-pointer"
                >
                  <ChevronRight size="0.8vw" />
                </button>
              </div>

              {/* Bottom-Right */}
              <div
                onPointerDown={(e) => {
                  if (e.target.tagName === 'INPUT') return;
                  handleScrubHelper(e, radius?.br ?? 0, (newVal) => handleCornerInput('br', parseInt(newVal)));
                }}
                className="h-[2.2vw] bg-white border border-gray-200 rounded-br-[0.9vw] rounded-tl-[0.25vw] rounded-tr-[0.25vw] rounded-bl-[0.25vw] flex items-center justify-between px-[0.4vw] shadow-sm hover:border-gray-300 focus-within:border-indigo-500 transition-all cursor-ew-resize select-none"
              >
                <button
                  type="button"
                  onClick={() => handleCornerChange('br', -1)}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-[0.1vw] cursor-pointer"
                >
                  <ChevronLeft size="0.8vw" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={radius?.br ?? 0}
                  onChange={(e) => handleCornerInput('br', e.target.value)}
                  className="w-[2vw] text-center text-[0.78vw] font-semibold text-gray-800 outline-none bg-transparent no-spin cursor-text"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={() => handleCornerChange('br', 1)}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-[0.1vw] cursor-pointer"
                >
                  <ChevronRight size="0.8vw" />
                </button>
              </div>

            </div>

            {/* Center Link Icon Button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsRadiusLinked(!isRadiusLinked)}
                className={`p-[0.35vw] rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 cursor-pointer bg-white ${
                  isRadiusLinked ? 'border-gray-800 text-gray-900' : 'border-gray-200 text-gray-400'
                }`}
                title={isRadiusLinked ? "Unlink Corners" : "Link All Corners"}
              >
                {isRadiusLinked ? (
                  <Link2 size="1.1vw" className="text-gray-900" />
                ) : (
                  <Link2Off size="1.1vw" className="text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 4. EFFECTS ===================== */}
      <div className="flex flex-col gap-[0.5vw]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.82vw] font-bold text-gray-800 whitespace-nowrap tracking-tight">Effects</span>
          <div className="h-[1px] flex-1 bg-gray-200"></div>
        </div>

        {/* Use original Effect component with hideHeader={true} to preserve exact popup UI & alignment */}
        <Effect
          hideHeader={true}
          isShape={isShape}
          openSubSection={openSubSection}
          setOpenSubSection={setOpenSubSection}
          activeEffects={activeEffects}
          setActiveEffects={setActiveEffects}
          effectSettings={effectSettings}
          setEffectSettings={setEffectSettings}
          activeColorPicker={activeColorPicker}
          setActiveColorPicker={setActiveColorPicker}
          showDetailedPicker={showDetailedPicker}
          setShowDetailedPicker={setShowDetailedPicker}
        />
      </div>

      {/* ===================== COLOR PICKER PORTAL ===================== */}
      {activeColorPicker && !activeColorPicker.startsWith('effect-') && !activeColorPicker.startsWith('data-effect-') && createPortal(
        <div
          className="fixed z-[5000]"
          style={{
            top: '50%',
            right: '19.5vw',
            transform: 'translateY(-50%)'
          }}
        >
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <ColorPicker
              key={activeColorPicker}
              color={activeColorPicker === 'fill' ? (backgroundColor?.fill || '#3194FC') : (backgroundColor?.stroke || '#000000')}
              opacity={activeColorPicker === 'fill' ? (backgroundColor?.fillOpacity ?? 100) : (backgroundColor?.strokeOpacity ?? 100)}
              onChange={(newColor) => {
                if (activeColorPicker === 'fill') {
                  setLocalFillHex(null);
                  setBackgroundColor(prev => ({ ...prev, fill: newColor, fillType: 'solid' }));
                } else {
                  setLocalStrokeHex(null);
                  setBackgroundColor(prev => ({
                    ...prev,
                    stroke: newColor,
                    strokeType: 'solid',
                    strokeWeight: (parseFloat(prev.strokeWeight) || 0) === 0 ? 2 : prev.strokeWeight
                  }));
                }
              }}
              onOpacityChange={(newOpacity) => {
                const num = parseFloat(newOpacity);
                if (!isNaN(num)) {
                  if (activeColorPicker === 'fill') {
                    setBackgroundColor(prev => ({ ...prev, fillOpacity: num }));
                  } else {
                    setBackgroundColor(prev => ({ ...prev, strokeOpacity: num }));
                  }
                }
              }}
              onClose={() => setActiveColorPicker(null)}
              colorsOnPage={colorsOnPage}
              disableGradient={activeColorPicker === 'stroke'}
            />
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default ShapeAppearanceControls;
