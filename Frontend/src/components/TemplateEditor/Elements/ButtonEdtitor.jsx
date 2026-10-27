import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Link2,
  Link2Off,
  Pencil,
  ArrowLeftRight,
  Check,
  Trash2,
  Plus
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import ColorPicker, { parseGradient, generateGradientString } from '../ColorPicker';
import IconGallery from '../icons';
import Effect from '../Effect';

const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.4vw] mt-[0.3vw] mb-[0.1vw]">
    <span className="text-[0.9vw] font-medium text-black whitespace-nowrap">{title}</span>
    <div className="h-[0.06vw] bg-gray-200 flex-1 ml-[0.3vw]" />
  </div>
);

// Helper row with fixed-width label ensuring all colons align vertically like QRCodeProperties.jsx
const PropertyRow = ({ label, children, className = '' }) => (
  <div className={`flex items-center gap-[0.5vw] ${className}`}>
    <div className="w-[5.6vw] shrink-0 flex items-center pl-[0.5vw] justify-between text-[0.8vw] text-gray-700 font-medium">
      <span className="whitespace-nowrap">{label}</span>
      <span className="text-gray-500 font-medium">:</span>
    </div>
    <div className="flex-1 min-w-0">
      {children}
    </div>
  </div>
);

// Color swatch + hex & opacity box with ColorPicker connectivity like QRCodeProperties.jsx
const ColorInput = ({ color, onChange, opacity = 100, onOpenPicker, isActive = false }) => {
  const displayColor = (color && color.startsWith('#')) ? color.toUpperCase() : (color || '#000000');

  return (
    <div className="flex items-center gap-[0.4vw] w-full">
      <div
        onClick={onOpenPicker}
        className={`color-box color-box-trigger w-[2vw] h-[2vw] rounded-[0.5vw] border flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 transition-all ${
          isActive ? 'border-[#E05638] ring-2 ring-[#E05638]/40 scale-105 shadow-xs' : 'border-gray-200 hover:border-gray-300'
        }`}
        style={{ backgroundColor: color === 'none' || color === 'transparent' ? '#ffffff' : color }}
        title="Click to open color palette"
      >
        {(color === 'none' || color === 'transparent') && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
        )}
      </div>
      <div className="flex-1 h-[2.5vw] flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white px-[0.6vw] text-[0.8vw] text-gray-800 focus-within:border-[#E05638] shadow-2xs">
        <input
          type="text"
          value={displayColor}
          onChange={(e) => {
            let val = e.target.value;
            if (!val.startsWith('#') && val.length > 0 && !val.includes('gradient')) val = '#' + val;
            onChange(val);
          }}
          className="w-[5.2vw] font-mono text-[0.8vw] text-gray-800 bg-transparent focus:outline-none uppercase"
          maxLength={7}
        />
        <span className="text-gray-400 text-[0.75vw] font-medium">{opacity}%</span>
      </div>
    </div>
  );
};

const ColorInputWithFormat = ({ color, onChange, opacity = 100, onOpenPicker, isActive = false }) => (
  <div className="flex items-center gap-[0.4vw] w-full">
    <div
      onClick={onOpenPicker}
      className={`color-box color-box-trigger w-[2vw] h-[2vw] rounded-[0.5vw] border flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 transition-all ${
        isActive ? 'border-[#E05638] ring-2 ring-[#E05638]/40 scale-105 shadow-xs' : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{ backgroundColor: color === 'none' || color === 'transparent' ? '#ffffff' : color }}
      title="Click to open color palette"
    >
      {(color === 'none' || color === 'transparent') && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
      )}
    </div>
    <div className="flex-1 h-[2.5vw] flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white px-[0.6vw] text-[0.8vw] text-gray-800 focus-within:border-[#E05638] shadow-2xs">
      <input
        type="text"
        value={color && color.includes('gradient') ? 'GRADIENT' : (color?.toUpperCase() || '#000000')}
        onChange={(e) => {
          let val = e.target.value;
          if (!val.startsWith('#') && val.length > 0 && !val.includes('gradient')) val = '#' + val;
          onChange(val);
        }}
        className="w-[5.2vw] font-mono text-[0.8vw] text-gray-800 bg-transparent focus:outline-none uppercase"
        maxLength={7}
      />
      <span className="text-gray-400 text-[0.75vw] font-medium">{opacity}%</span>
    </div>
    <div className="h-[2.5vw] flex items-center justify-between px-[0.6vw] border border-gray-200 rounded-[0.5vw] bg-white cursor-pointer hover:border-gray-300 min-w-[4vw] shadow-2xs">
      <span className="text-[0.75vw] text-gray-600 font-medium">HEX</span>
      <ChevronDown size="0.8vw" className="text-gray-400 ml-[0.3vw]" />
    </div>
  </div>
);

const fontFamilies = [
  'Poppins', 'Arial', 'Bangers', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather',
  'Public Sans', 'Lora', 'Cabin', 'Satisfy'
];

const fontWeights = [
  { name: 'Thin', value: '100' },
  { name: 'Extra Light', value: '200' },
  { name: 'Light', value: '300' },
  { name: 'Regular', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi Bold', value: '600' },
  { name: 'Bold', value: '700' },
  { name: 'Extra Bold', value: '800' }
];

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 50, 64, 72];

// Helper to extract color or reconstruct gradient string from SVG defs if needed
const extractColorOrGradient = (element, attrName, defaultColor) => {
  if (!element) return defaultColor;
  const dataColor = element.getAttribute(`data-${attrName}-color`);
  if (dataColor) return dataColor;

  const rawVal = element.getAttribute(attrName) || element.style?.[attrName] || defaultColor;
  if (rawVal && rawVal.startsWith('url(#')) {
    const gradId = rawVal.match(/url\(#([^)]+)\)/)?.[1];
    const svgRoot = element.closest('svg');
    const gradEl = gradId && svgRoot ? svgRoot.querySelector(`#${gradId}`) : null;
    if (gradEl) {
      const isRadial = gradEl.tagName.toLowerCase().includes('radial');
      const stops = Array.from(gradEl.querySelectorAll('stop')).map(stop => ({
        color: stop.getAttribute('stop-color') || '#ffffff',
        offset: parseFloat(stop.getAttribute('offset') || 0),
        opacity: Math.round(parseFloat(stop.getAttribute('stop-opacity') || 1) * 100)
      }));
      if (stops.length > 0) {
        if (isRadial) {
          const r = parseFloat(gradEl.getAttribute('r') || 50);
          return generateGradientString('Radial', stops, 0, r);
        } else {
          const x1 = parseFloat(gradEl.getAttribute('x1') || 50);
          const y1 = parseFloat(gradEl.getAttribute('y1') || 0);
          const x2 = parseFloat(gradEl.getAttribute('x2') || 50);
          const y2 = parseFloat(gradEl.getAttribute('y2') || 100);
          const angle = Math.round((Math.atan2(x2 - x1, -(y2 - y1)) * 180) / Math.PI + 360) % 360;
          return generateGradientString('Linear', stops, angle, 100);
        }
      }
    }
  }
  return rawVal;
};

// Compute matching lighter accent shade for corner flaps
const lightenColor = (col, amount = 0.3) => {
  if (!col) return col;
  let baseCol = col;
  if (typeof baseCol === 'string' && baseCol.includes('gradient')) {
    try {
      const parsed = parseGradient(baseCol);
      if (parsed && parsed.stops && parsed.stops.length > 0) {
        baseCol = parsed.stops[0].color;
      }
    } catch (_) {}
  }
  if (typeof baseCol !== 'string') return col;
  let r = 0, g = 0, b = 0;
  if (baseCol.startsWith('#')) {
    let hex = baseCol.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    r = parseInt(hex.substring(0, 2), 16) || 0;
    g = parseInt(hex.substring(2, 4), 16) || 0;
    b = parseInt(hex.substring(4, 6), 16) || 0;
  } else if (baseCol.startsWith('rgb')) {
    const parts = baseCol.match(/\d+/g);
    if (parts && parts.length >= 3) {
      r = parseInt(parts[0]) || 0;
      g = parseInt(parts[1]) || 0;
      b = parseInt(parts[2]) || 0;
    } else {
      return baseCol;
    }
  } else {
    return baseCol;
  }
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(lr)}${toHex(lg)}${toHex(lb)}`;
};

export const getRoundedPathD = (x, y, w, h, tl, tr, br, bl) => {
  const maxR = Math.max(0, Math.min(w / 2, h / 2));
  const clamp = (r) => Math.max(0, Math.min(Number(r) || 0, maxR));
  const ctl = clamp(tl);
  const ctr = clamp(tr);
  const cbr = clamp(br);
  const cbl = clamp(bl);

  let d = `M ${x + ctl},${y}`;
  d += ` L ${x + w - ctr},${y}`;
  if (ctr > 0) {
    d += ` A ${ctr},${ctr} 0 0 1 ${x + w},${y + ctr}`;
  } else {
    d += ` L ${x + w},${y}`;
  }
  d += ` L ${x + w},${y + h - cbr}`;
  if (cbr > 0) {
    d += ` A ${cbr},${cbr} 0 0 1 ${x + w - cbr},${y + h}`;
  } else {
    d += ` L ${x + w},${y + h}`;
  }
  d += ` L ${x + cbl},${y + h}`;
  if (cbl > 0) {
    d += ` A ${cbl},${cbl} 0 0 1 ${x},${y + h - cbl}`;
  } else {
    d += ` L ${x},${y + h}`;
  }
  d += ` L ${x},${y + ctl}`;
  if (ctl > 0) {
    d += ` A ${ctl},${ctl} 0 0 1 ${x + ctl},${y}`;
  } else {
    d += ` L ${x},${y}`;
  }
  d += ' Z';
  return d.replace(/\s+/g, ' ').trim();
};

const ButtonEditor = ({
  selectedElement,
  selectedLayerId,
  updateElementAttribute,
  activePageIndex,
  onUpdate
}) => {
  // ─── 1. Button Content States ───────────────────────────────────
  const [buttonText, setButtonText] = useState('Button');
  const [fontFamily, setFontFamily] = useState('Poppins');
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState('600'); // Semi Bold
  const [textFillColor, setTextFillColor] = useState('#000000');
  const [textOpacity, setTextOpacity] = useState(100);

  // Icon States
  const [hasIcon, setHasIcon] = useState(true);
  const [iconName, setIconName] = useState('Check');
  const [iconHtml, setIconHtml] = useState('');
  const [iconViewBox, setIconViewBox] = useState('0 0 24 24');
  const [iconPlacement, setIconPlacement] = useState('Left');
  const [iconColor, setIconColor] = useState('#000000');
  const [iconOpacity, setIconOpacity] = useState(100);
  const [iconBgColor, setIconBgColor] = useState('none');
  const [iconBgOpacity, setIconBgOpacity] = useState(100);
  const [isIconGalleryOpen, setIsIconGalleryOpen] = useState(false);

  // ─── 2. Size & Spacing States ───────────────────────────────────
  const [paddingW, setPaddingW] = useState(0);
  const [paddingH, setPaddingH] = useState(0);
  const [isPaddingLinked, setIsPaddingLinked] = useState(true);
  const [iconGap, setIconGap] = useState(4);

  // ─── 3. Button Color States ─────────────────────────────────────
  const [shapeFillColor, setShapeFillColor] = useState('#000000');
  const [shapeOpacity, setShapeOpacity] = useState(100);

  // ─── 4. Stoke Color States ──────────────────────────────────────
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeOpacity, setStrokeOpacity] = useState(100);
  const [strokeAlignment, setStrokeAlignment] = useState('Center');
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [lineStyle, setLineStyle] = useState('Solid'); // 'Solid', 'Dashed', 'Dotted'
  const [dashL, setDashL] = useState(8);
  const [dashG, setDashG] = useState(4);
  const [lineCorner, setLineCorner] = useState('Rounded'); // 'Rounded', 'Square'

  // ─── 5. Corner Radius States ────────────────────────────────────
  const [radius, setRadius] = useState({ tl: 12, tr: 12, bl: 12, br: 12 });
  const [isRadiusLinked, setIsRadiusLinked] = useState(true);

  // ─── 6. Effects States ──────────────────────────────────────────
  const [activeEffects, setActiveEffects] = useState(['Drop Shadow']);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': {
      x: 2,
      y: 2,
      blur: 0,
      spread: 0,
      color: '#000000',
      opacity: 35
    }
  });

  const [openSection, setOpenSection] = useState(null);
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'textColor', 'iconColor', 'buttonColor', 'strokeColor'

  const lastElementIdRef = useRef(null);

  // Read current values from selectedElement on initial select or id change
  useEffect(() => {
    if (!selectedElement) return;

    const currentId = selectedElement.id;
    const isNewElement = currentId !== lastElementIdRef.current;
    lastElementIdRef.current = currentId;

    if (!isNewElement) return;

    // 1. Text Properties
    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    let textWasHidden = false;
    let cleanFF = 'Poppins';
    if (textEl) {
      setButtonText(textEl.textContent || 'Button');

      const ff = textEl.style.fontFamily || textEl.getAttribute('font-family') || '';
      if (ff) {
        cleanFF = ff.replace(/['"]/g, '').split(',')[0].trim() || 'Poppins';
      }
      setFontFamily(cleanFF);

      const fw = textEl.style.fontWeight || textEl.getAttribute('font-weight') || '600';
      setFontWeight(fw);

      const fs = textEl.getAttribute('font-size') || textEl.style.fontSize || '24';
      let parsedFs = parseInt(fs) || 24;
      if (parsedFs <= 0) {
        parsedFs = 14;
        textWasHidden = true;
        textEl.setAttribute('font-size', '14');
        if (textEl.style) textEl.style.fontSize = '14px';
      }
      setFontSize(parsedFs);

      const tfc = extractColorOrGradient(textEl, 'fill', '#ffffff');
      setTextFillColor(tfc === 'none' ? '#ffffff' : tfc);

      const to = textEl.getAttribute('fill-opacity') || textEl.getAttribute('opacity') || '1';
      let parsedTo = Math.round(parseFloat(to) * 100);
      if (parsedTo <= 0) {
        parsedTo = 100;
        textWasHidden = true;
        textEl.setAttribute('opacity', '1');
        textEl.setAttribute('fill-opacity', '1');
      }
      setTextOpacity(parsedTo);

      // Ensure text is visibly shown
      if (textEl.getAttribute('display') === 'none' || textEl.style?.display === 'none') {
        textWasHidden = true;
        textEl.removeAttribute('display');
        if (textEl.style) textEl.style.display = '';
      }
    }

    // 2. Icon Properties
    const iconEl = selectedElement.querySelector('.btn-icon');
    const rawHasIcon = selectedElement.getAttribute('data-has-icon');
    const currentHasIcon = rawHasIcon !== null ? rawHasIcon === 'true' : (iconEl !== null ? true : true);
    setHasIcon(currentHasIcon);

    const savedIconName = selectedElement.getAttribute('data-icon-name') || iconEl?.getAttribute('data-icon-name') || 'Check';
    setIconName(savedIconName);

    const savedPlacement = selectedElement.getAttribute('data-icon-placement') || 'Left';
    setIconPlacement(savedPlacement);

    const savedIconColor = selectedElement.getAttribute('data-icon-color') || '#000000';
    setIconColor(savedIconColor);

    const savedIconOpacity = selectedElement.getAttribute('data-icon-opacity') || '100';
    setIconOpacity(parseInt(savedIconOpacity) || 100);

    // Read Icon BG Color & Opacity
    let savedIconBgColor = selectedElement.getAttribute('data-icon-bg-color');
    const badgeEl = selectedElement.querySelector('.btn-badge-circle, .btn-badge-block, .btn-icon-bg') ||
      selectedElement.querySelector('polygon:not(.btn-main-poly)');

    if (!savedIconBgColor && badgeEl) {
      savedIconBgColor = extractColorOrGradient(badgeEl, 'fill', null) || badgeEl.getAttribute('fill');
    }
    if (!savedIconBgColor) {
      const btnTemplate = selectedElement.getAttribute('data-button-template');
      if (btnTemplate === 'white-pill-badge' || btnTemplate === 'rect-badge') {
        savedIconBgColor = '#1e1b4b';
      } else if (btnTemplate === 'social-badge') {
        savedIconBgColor = '#ffffff';
      } else {
        savedIconBgColor = badgeEl ? '#1e1b4b' : 'none';
      }
    }
    setIconBgColor(savedIconBgColor || 'none');

    const savedIconBgOpacity = selectedElement.getAttribute('data-icon-bg-opacity') ||
      (badgeEl ? Math.round(parseFloat(badgeEl.getAttribute('fill-opacity') || badgeEl.getAttribute('opacity') || '1') * 100) : 100);
    setIconBgOpacity(parseInt(savedIconBgOpacity) || 100);

    const savedIconGap = selectedElement.getAttribute('data-icon-gap') || '4';
    setIconGap(parseInt(savedIconGap) || 4);

    // 3. Padding Properties
    const savedPaddingW = selectedElement.getAttribute('data-padding-w');
    const savedPaddingH = selectedElement.getAttribute('data-padding-h');
    setPaddingW(savedPaddingW !== null ? (parseInt(savedPaddingW, 10) || 0) : 0);
    setPaddingH(savedPaddingH !== null ? (parseInt(savedPaddingH, 10) || 0) : 0);
    const savedPadLinked = selectedElement.getAttribute('data-padding-linked');
    setIsPaddingLinked(savedPadLinked !== 'false');

    // 4. Shape Fill & Stroke Properties
    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    const rectEl = selectedElement.querySelector('rect.btn-bg') || selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);
    const shapeEl = mainPoly || rectEl;

    if (shapeEl) {
      const sfc = extractColorOrGradient(shapeEl, 'fill', '#000000');
      setShapeFillColor(sfc);

      const soFill = shapeEl.getAttribute('fill-opacity') || shapeEl.getAttribute('opacity') || '1';
      setShapeOpacity(Math.round(parseFloat(soFill) * 100));

      const sc = extractColorOrGradient(shapeEl, 'stroke', '#000000');
      setStrokeColor(sc || '#000000');

      const sw = shapeEl.getAttribute('stroke-width') || shapeEl.style?.strokeWidth || '1';
      setStrokeWidth(parseFloat(sw) || 1);

      const so = shapeEl.getAttribute('stroke-opacity') || shapeEl.style?.strokeOpacity || '1';
      setStrokeOpacity(Math.round(parseFloat(so) * 100));

      const sa = selectedElement.getAttribute('data-stroke-alignment') || 'Center';
      setStrokeAlignment(sa);

      const sda = shapeEl.getAttribute('stroke-dasharray');
      if (!sda || sda === 'none') {
        setLineStyle('Solid');
      } else if (sda.includes('2,') || sda.includes('1,')) {
        setLineStyle('Dotted');
      } else {
        setLineStyle('Dashed');
      }

      const slc = shapeEl.getAttribute('stroke-linecap') || 'round';
      setLineCorner(slc === 'round' ? 'Rounded' : 'Square');

      const savedDashL = selectedElement.getAttribute('data-dash-l') || '8';
      const savedDashG = selectedElement.getAttribute('data-dash-g') || '4';
      setDashL(parseInt(savedDashL) || 8);
      setDashG(parseInt(savedDashG) || 4);
    }

    // 5. Corner Radius
    const rawTl = selectedElement.getAttribute('data-tl') || rectEl?.getAttribute('rx') || '12';
    const rawTr = selectedElement.getAttribute('data-tr') || rectEl?.getAttribute('rx') || '12';
    const rawBl = selectedElement.getAttribute('data-bl') || rectEl?.getAttribute('rx') || '12';
    const rawBr = selectedElement.getAttribute('data-br') || rectEl?.getAttribute('rx') || '12';
    const loadedRadius = {
      tl: parseInt(rawTl) || 12,
      tr: parseInt(rawTr) || 12,
      bl: parseInt(rawBl) || 12,
      br: parseInt(rawBr) || 12
    };
    setRadius(loadedRadius);
    const savedCornerLinked = selectedElement.getAttribute('data-corner-linked');
    const isLinked = savedCornerLinked !== null
      ? savedCornerLinked !== 'false'
      : (loadedRadius.tl === loadedRadius.tr && loadedRadius.tl === loadedRadius.bl && loadedRadius.tl === loadedRadius.br);
    setIsRadiusLinked(isLinked);

    // If button has a path.btn-main-poly, immediately sync its path to current corner radius & dimensions
    const mainPolyPath = selectedElement.querySelector('path.btn-main-poly');
    if (mainPolyPath && rectEl) {
      const rw = parseFloat(rectEl.getAttribute('width') || 0);
      const rh = parseFloat(rectEl.getAttribute('height') || 0);
      const rx = parseFloat(rectEl.getAttribute('x') || 0);
      const ry = parseFloat(rectEl.getAttribute('y') || 0);
      if (rw > 0 && rh > 0) {
        mainPolyPath.setAttribute('d', getRoundedPathD(rx, ry, rw, rh, loadedRadius.tl, loadedRadius.tr, loadedRadius.br, loadedRadius.bl));
      }
    }

    // If button text was previously hidden, immediately recalculate button dimensions so text & icon fit
    if (textWasHidden && textEl) {
      updateButtonDimensions(
        textEl.textContent || 'Globe',
        parseInt(textEl.getAttribute('font-size')) || 14,
        cleanFF,
        currentHasIcon,
        savedIconName,
        iconHtml,
        iconViewBox,
        savedPaddingW !== null ? (parseInt(savedPaddingW, 10) || 0) : 0,
        savedPaddingH !== null ? (parseInt(savedPaddingH, 10) || 0) : 0,
        parseInt(savedIconGap) || 4,
        savedPlacement,
        loadedRadius,
        savedIconColor,
        savedIconBgColor
      );
      syncButtonToCanvas();
    }

    // 6. Effects
    const effects = [];
    if (selectedElement.getAttribute('data-effect-drop-shadow') === 'true' || selectedElement.getAttribute('data-effect-drop-shadow') === null) {
      effects.push('Drop Shadow');
    }
    setActiveEffects(effects);

    setEffectSettings(prev => ({
      ...prev,
      'Drop Shadow': {
        color: selectedElement.getAttribute('data-effect-drop-shadow-color') || '#000000',
        opacity: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-opacity') || 35),
        x: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-x') || 2),
        y: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-y') || 2),
        blur: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-blur') || 0),
        spread: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-spread') || 0)
      }
    }));
  }, [selectedElement]);

  // Apply or remove SVG filter for Drop Shadow
  const applyDropShadowFilter = (hasDropShadow, dsSettings = effectSettings['Drop Shadow']) => {
    if (!selectedElement) return;

    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const svgRoot = selectedElement.closest('svg') || editorDoc.querySelector('.page-svg-container svg') || editorDoc.querySelector('svg');
    if (!svgRoot) return;

    const ownerDoc = svgRoot.ownerDocument || document;
    let defs = svgRoot.querySelector('defs');
    if (!defs) {
      defs = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }

    const baseFilterId = `filter-${selectedElement.id || selectedLayerId}`;
    Array.from(defs.querySelectorAll(`[id^="${baseFilterId}"]`)).forEach(old => old.remove());

    if (!hasDropShadow) {
      selectedElement.removeAttribute('filter');
      return;
    }

    const filterId = `${baseFilterId}-${Math.random().toString(36).substr(2, 4)}`;
    const filterEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "filter");
    filterEl.setAttribute('id', filterId);
    filterEl.setAttribute('x', '-50%');
    filterEl.setAttribute('y', '-50%');
    filterEl.setAttribute('width', '200%');
    filterEl.setAttribute('height', '200%');

    const color = dsSettings?.color || '#000000';
    const opacity = (parseFloat(dsSettings?.opacity !== undefined ? dsSettings.opacity : 35)) / 100;
    const dx = dsSettings?.x !== undefined ? dsSettings.x.toString() : '2';
    const dy = dsSettings?.y !== undefined ? dsSettings.y.toString() : '2';
    const blur = parseFloat(dsSettings?.blur !== undefined ? dsSettings.blur : 2);
    const spread = parseFloat(dsSettings?.spread !== undefined ? dsSettings.spread : 0);

    let dsSource = 'SourceAlpha';
    if (spread !== 0) {
      const morph = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
      morph.setAttribute('operator', spread >= 0 ? 'dilate' : 'erode');
      morph.setAttribute('radius', Math.abs(spread).toString());
      morph.setAttribute('in', 'SourceAlpha');
      morph.setAttribute('result', 'ds_morph');
      filterEl.appendChild(morph);
      dsSource = 'ds_morph';
    }

    const gauss = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    gauss.setAttribute('stdDeviation', blur.toString());
    gauss.setAttribute('in', dsSource);
    gauss.setAttribute('result', 'ds_blur');
    filterEl.appendChild(gauss);

    const offset = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feOffset");
    offset.setAttribute('dx', dx);
    offset.setAttribute('dy', dy);
    offset.setAttribute('in', 'ds_blur');
    offset.setAttribute('result', 'ds_offset');
    filterEl.appendChild(offset);

    const flood = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feFlood");
    flood.setAttribute('flood-color', color);
    flood.setAttribute('flood-opacity', opacity.toString());
    flood.setAttribute('result', 'ds_flood');
    filterEl.appendChild(flood);

    const comp = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
    comp.setAttribute('in', 'ds_flood');
    comp.setAttribute('in2', 'ds_offset');
    comp.setAttribute('operator', 'in');
    comp.setAttribute('result', 'ds_final');
    filterEl.appendChild(comp);

    const merge = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const nodeShadow = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    nodeShadow.setAttribute('in', 'ds_final');
    const nodeGraphic = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    nodeGraphic.setAttribute('in', 'SourceGraphic');
    merge.appendChild(nodeShadow);
    merge.appendChild(nodeGraphic);
    filterEl.appendChild(merge);

    defs.appendChild(filterEl);
    selectedElement.setAttribute('filter', `url(#${filterId})`);
  };

  // Helper to generate and inject SVG linear/radial gradient in <defs>
  const applySvgGradient = (colorVal, targetAttr, targetElName) => {
    if (!selectedElement) return colorVal;

    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const svgRoot = selectedElement.closest('svg') || editorDoc.querySelector('.page-svg-container svg') || editorDoc.querySelector('svg');
    if (!svgRoot) return colorVal;

    const ownerDoc = svgRoot.ownerDocument || document;
    let defs = svgRoot.querySelector('defs');
    if (!defs) {
      defs = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }

    const baseGradId = `grad-${selectedElement.id || selectedLayerId}-${targetElName}-${targetAttr}`;
    Array.from(defs.querySelectorAll(`[id^="${baseGradId}"]`)).forEach(old => old.remove());

    if (!colorVal || !colorVal.includes('gradient')) {
      return colorVal;
    }

    const parsed = parseGradient(colorVal);
    if (!parsed || !parsed.stops || parsed.stops.length === 0) {
      return colorVal;
    }

    const gradId = `${baseGradId}-${Math.random().toString(36).substr(2, 4)}`;
    let gradEl;

    if (parsed.type === 'Linear') {
      gradEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      const angleRad = ((parsed.angle || 0) * Math.PI) / 180;
      const dx = Math.sin(angleRad) * 50;
      const dy = -Math.cos(angleRad) * 50;
      gradEl.setAttribute('x1', `${Math.round(50 - dx)}%`);
      gradEl.setAttribute('y1', `${Math.round(50 - dy)}%`);
      gradEl.setAttribute('x2', `${Math.round(50 + dx)}%`);
      gradEl.setAttribute('y2', `${Math.round(50 + dy)}%`);
    } else {
      gradEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
      gradEl.setAttribute('cx', '50%');
      gradEl.setAttribute('cy', '50%');
      gradEl.setAttribute('r', `${parsed.radius || 50}%`);
    }

    gradEl.setAttribute('id', gradId);
    parsed.stops.forEach(stop => {
      const stopEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "stop");
      stopEl.setAttribute('offset', `${stop.offset}%`);
      stopEl.setAttribute('stop-color', stop.color);
      stopEl.setAttribute('stop-opacity', ((stop.opacity !== undefined ? stop.opacity : 100) / 100).toString());
      gradEl.appendChild(stopEl);
    });

    defs.appendChild(gradEl);
    return `url(#${gradId})`;
  };

  // Synchronize entire button SVG to MainEditor
  const syncButtonToCanvas = (withFilterSync = false, dsActive = null, dsSettings = null) => {
    if (!selectedElement) return;

    if (withFilterSync) {
      const isDs = dsActive !== null ? dsActive : activeEffects.includes('Drop Shadow');
      applyDropShadowFilter(isDs, dsSettings || effectSettings['Drop Shadow']);
    }

    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const svgRoot = selectedElement.closest('svg') || editorDoc.querySelector('.page-svg-container svg') || editorDoc.querySelector('svg');
    if (!svgRoot) return;

    if (onUpdate) {
      onUpdate();
    } else if (updateElementAttribute) {
      const serializer = new XMLSerializer();
      updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', serializer.serializeToString(svgRoot));
    }
  };

  // Dynamically update button width, height, position text & icon with padding & gap
  const updateButtonDimensions = (
    textVal = buttonText,
    currentFontSize = fontSize,
    currentFontFamily = fontFamily,
    hasIconVal = hasIcon,
    currentIconName = iconName,
    currentIconHtml = iconHtml,
    currentIconViewBox = iconViewBox,
    currentPaddingW = paddingW,
    currentPaddingH = paddingH,
    currentIconGap = iconGap,
    currentPlacement = iconPlacement,
    currentRadius = radius,
    currentIconColor = iconColor,
    currentIconBgColor = iconBgColor
  ) => {
    if (!selectedElement) return;

    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    const rectEl = selectedElement.querySelector('rect.btn-bg') || selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);
    if (!textEl || !rectEl) return;

    // Estimate text width accurately
    let measuredWidth = 0;
    try {
      if (typeof textEl.getComputedTextLength === 'function' && textEl.getComputedTextLength() > 0) {
        measuredWidth = textEl.getComputedTextLength();
      }
    } catch (_) {}

    if (!measuredWidth || measuredWidth < 10) {
      const charRatio = currentFontFamily.toLowerCase().includes('banger') ? 0.6 : 0.58;
      measuredWidth = (textVal.length || 1) * (currentFontSize * charRatio);
    }

    const iconSize = Math.max(16, Math.round(currentFontSize * 0.9));

    // Check if icon has a badge circle or background
    let badgeEl = selectedElement.querySelector('.btn-badge-circle, .btn-badge-block, .btn-icon-bg') ||
      selectedElement.querySelector('polygon:not(.btn-main-poly)');

    const hasIconBg = Boolean(
      hasIconVal &&
      currentIconBgColor &&
      currentIconBgColor !== 'none' &&
      currentIconBgColor !== 'transparent'
    );

    const badgeRadius = Math.max(14, Math.round(iconSize * 0.85));
    const effectiveIconWidth = (hasIconBg || (badgeEl && badgeEl.getAttribute('display') !== 'none' && badgeEl.getAttribute('fill') !== 'none'))
      ? Math.max(iconSize, badgeRadius * 2)
      : iconSize;

    const totalContentWidth = hasIconVal
      ? measuredWidth + currentIconGap + effectiveIconWidth
      : measuredWidth;

    // Padding scaling
    const horizPad = Math.max(currentPaddingW * 4, 16);
    const vertPad = Math.max(currentPaddingH * 3, 10);
    const newButtonWidth = Math.max(100, Math.round(totalContentWidth + horizPad * 2));
    const newButtonHeight = Math.max(36, Math.round(Math.max(currentFontSize, hasIconVal ? Math.max(iconSize, (hasIconBg || badgeEl) ? badgeRadius * 2 : 0) : 0) + vertPad * 2));

    const rectX = parseFloat(rectEl.getAttribute('x') || 0);
    const rectY = parseFloat(rectEl.getAttribute('y') || 0);

    // Update rect width & height
    rectEl.setAttribute('width', newButtonWidth.toString());
    rectEl.setAttribute('height', newButtonHeight.toString());

    // Apply corner radius & shape geometry
    const radTl = Number(currentRadius?.tl !== undefined ? currentRadius.tl : 12);
    const radTr = Number(currentRadius?.tr !== undefined ? currentRadius.tr : 12);
    const radBl = Number(currentRadius?.bl !== undefined ? currentRadius.bl : 12);
    const radBr = Number(currentRadius?.br !== undefined ? currentRadius.br : 12);
    const maxR = Math.max(radTl, radTr, radBl, radBr);
    const areCornersEqual = radTl === radTr && radTl === radBl && radTl === radBr;

    rectEl.setAttribute('rx', maxR.toString());
    rectEl.setAttribute('ry', maxR.toString());

    let mainPoly = selectedElement.querySelector('.btn-main-poly');
    const btnTemplate = selectedElement.getAttribute('data-button-template');

    if (mainPoly) {
      if (mainPoly.tagName?.toLowerCase() === 'path') {
        const pathD = getRoundedPathD(rectX, rectY, newButtonWidth, newButtonHeight, radTl, radTr, radBr, radBl);
        mainPoly.setAttribute('d', pathD);
      } else if (mainPoly.tagName?.toLowerCase() === 'polygon') {
        if (btnTemplate === 'like-chevron') {
          mainPoly.setAttribute('points', `${rectX},${rectY} ${rectX + newButtonWidth - 12},${rectY} ${rectX + newButtonWidth},${rectY + newButtonHeight / 2} ${rectX + newButtonWidth - 12},${rectY + newButtonHeight} ${rectX},${rectY + newButtonHeight}`);
        }
      }
    } else if (!areCornersEqual) {
      // If user sets asymmetrical corner radii on a regular button, convert visual body to <path class="btn-main-poly">
      const ownerDoc = selectedElement.ownerDocument || document;
      mainPoly = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "path");
      mainPoly.setAttribute('class', 'btn-main-poly');

      ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'data-fill-color', 'data-stroke-color'].forEach(attr => {
        const val = rectEl.getAttribute(attr);
        if (val !== null) mainPoly.setAttribute(attr, val);
      });
      if (rectEl.style?.fill) mainPoly.style.fill = rectEl.style.fill;
      if (rectEl.style?.stroke) mainPoly.style.stroke = rectEl.style.stroke;

      const pathD = getRoundedPathD(rectX, rectY, newButtonWidth, newButtonHeight, radTl, radTr, radBr, radBl);
      mainPoly.setAttribute('d', pathD);

      rectEl.parentNode.insertBefore(mainPoly, rectEl.nextSibling);
      rectEl.setAttribute('fill', 'none');
      rectEl.setAttribute('stroke', 'none');
      rectEl.setAttribute('opacity', '0');
    }

    // Update secondary polygon in like-chevron if present
    const blockPoly = selectedElement.querySelector('polygon:not(.btn-main-poly)');
    if (blockPoly && btnTemplate === 'like-chevron') {
      blockPoly.setAttribute('points', `${rectX},${rectY} ${rectX + 36},${rectY} ${rectX + 36},${rectY + newButtonHeight} ${rectX},${rectY + newButtonHeight}`);
    }

    // Update ribbon polygon in upload-ribbon if present
    const ribbonPoly = selectedElement.querySelector('polygon');
    if (ribbonPoly && btnTemplate === 'upload-ribbon') {
      ribbonPoly.setAttribute('points', `${rectX},${rectY} ${rectX + 34},${rectY} ${rectX + 42},${rectY + newButtonHeight / 2} ${rectX + 34},${rectY + newButtonHeight} ${rectX},${rectY + newButtonHeight}`);
    }

    // Update slice polygon in angled-slice if present
    const slicePoly = selectedElement.querySelector('g[clip-path] polygon');
    if (slicePoly && btnTemplate === 'angled-slice') {
      slicePoly.setAttribute('points', `${rectX - 5},${rectY - 5} ${rectX + 42},${rectY - 5} ${rectX + 26},${rectY + newButtonHeight + 5} ${rectX - 5},${rectY + newButtonHeight + 5}`);
    }

    // Update badge block path in rect-badge if present
    const badgeBlock = selectedElement.querySelector('.btn-badge-block');
    if (badgeBlock && badgeBlock.tagName?.toLowerCase() === 'path') {
      const badgeRx = Math.min(radTl, radBl, 38 / 2, newButtonHeight / 2);
      badgeBlock.setAttribute('d', `M ${rectX},${rectY + badgeRx} A ${badgeRx},${badgeRx} 0 0 1 ${rectX + badgeRx},${rectY} L ${rectX + 38},${rectY} L ${rectX + 38},${rectY + newButtonHeight} L ${rectX + badgeRx},${rectY + newButtonHeight} A ${badgeRx},${badgeRx} 0 0 1 ${rectX},${rectY + newButtonHeight - badgeRx} Z`);
    }

    // Update clipPath & border rect if they exist
    const ownerDoc = selectedElement.ownerDocument || document;
    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const svgRoot = selectedElement.closest('svg') || editorDoc.querySelector('.page-svg-container svg') || editorDoc.querySelector('svg');
    const clipId = `clip-${selectedElement.id || selectedLayerId}`;
    const clipRect = svgRoot?.querySelector(`#${clipId} rect`);
    if (clipRect) {
      clipRect.setAttribute('x', rectX.toString());
      clipRect.setAttribute('y', rectY.toString());
      clipRect.setAttribute('width', newButtonWidth.toString());
      clipRect.setAttribute('height', newButtonHeight.toString());
      clipRect.setAttribute('rx', maxR.toString());
    }

    const borderRect = selectedElement.querySelector('rect.btn-border');
    if (borderRect) {
      borderRect.setAttribute('x', rectX.toString());
      borderRect.setAttribute('y', rectY.toString());
      borderRect.setAttribute('width', newButtonWidth.toString());
      borderRect.setAttribute('height', newButtonHeight.toString());
      borderRect.setAttribute('rx', maxR.toString());
    }

    // Handle icon element inside button
    let iconWrap = selectedElement.querySelector('.btn-icon');
    if (hasIconVal) {
      if (!iconWrap) {
        iconWrap = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "g");
        iconWrap.setAttribute('class', 'btn-icon');
        selectedElement.appendChild(iconWrap);
      }
      iconWrap.setAttribute('data-icon-name', currentIconName || 'Check');

      let svgMarkup = '';
      if (currentIconHtml) {
        svgMarkup = `<svg width="${iconSize}" height="${iconSize}" viewBox="${currentIconViewBox || '0 0 24 24'}" fill="none" stroke="${currentIconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${currentIconHtml}</svg>`;
      } else {
        svgMarkup = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${currentIconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      }
      iconWrap.innerHTML = svgMarkup;

      const startX = rectX + (newButtonWidth - totalContentWidth) / 2;
      const centerY = rectY + newButtonHeight / 2;
      let iconX, iconY, textX, textY, badgeCenterX;

      if (currentPlacement === 'Left') {
        const badgeStartX = startX;
        badgeCenterX = badgeStartX + effectiveIconWidth / 2;
        iconX = badgeCenterX - iconSize / 2;
        iconY = centerY - iconSize / 2;
        textX = startX + effectiveIconWidth + currentIconGap + measuredWidth / 2;
        textY = centerY;
      } else {
        textX = startX + measuredWidth / 2;
        textY = centerY;
        const badgeStartX = startX + measuredWidth + currentIconGap;
        badgeCenterX = badgeStartX + effectiveIconWidth / 2;
        iconX = badgeCenterX - iconSize / 2;
        iconY = centerY - iconSize / 2;
      }

      iconWrap.setAttribute('transform', `translate(${iconX}, ${iconY})`);
      textEl.setAttribute('x', textX.toString());
      textEl.setAttribute('y', textY.toString());
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('dominant-baseline', 'middle');
      textEl.style.textAnchor = 'middle';
      textEl.style.dominantBaseline = 'middle';

      // Update badge circle position if present
      if (badgeEl && badgeEl.tagName?.toLowerCase() === 'circle') {
        badgeEl.setAttribute('cx', badgeCenterX.toString());
        badgeEl.setAttribute('cy', centerY.toString());
        badgeEl.setAttribute('r', badgeRadius.toString());
        badgeEl.setAttribute('display', (hasIconBg || (currentIconBgColor !== 'none' && currentIconBgColor !== 'transparent')) ? '' : 'none');
      }
    } else {
      if (iconWrap) {
        iconWrap.remove();
      }
      if (badgeEl) {
        badgeEl.setAttribute('display', 'none');
      }
      const centerX = rectX + newButtonWidth / 2;
      const centerY = rectY + newButtonHeight / 2;
      textEl.setAttribute('x', centerX.toString());
      textEl.setAttribute('y', centerY.toString());
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('dominant-baseline', 'middle');
      textEl.style.textAnchor = 'middle';
      textEl.style.dominantBaseline = 'middle';
    }
  };

  // ─── Event Handlers ─────────────────────────────────────────────

  // Text Handlers
  const handleTextChange = (newVal) => {
    setButtonText(newVal);
    if (!selectedElement) return;

    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    if (textEl) {
      textEl.textContent = newVal;
      updateButtonDimensions(newVal, fontSize, fontFamily);
      syncButtonToCanvas();
    }
  };

  const handleFontFamilyChange = (val) => {
    setFontFamily(val);
    if (!selectedElement) return;

    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    if (textEl) {
      textEl.setAttribute('font-family', val);
      textEl.style.fontFamily = val;
      updateButtonDimensions(buttonText, fontSize, val);
      syncButtonToCanvas();
    }
  };

  const handleFontSizeChange = (val) => {
    setFontSize(val);
    if (!selectedElement) return;

    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    if (textEl) {
      textEl.setAttribute('font-size', val.toString());
      textEl.style.fontSize = `${val}px`;
      updateButtonDimensions(buttonText, val, fontFamily);
      syncButtonToCanvas();
    }
  };

  const handleFontWeightChange = (val) => {
    setFontWeight(val);
    if (!selectedElement) return;

    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    if (textEl) {
      textEl.setAttribute('font-weight', val);
      textEl.style.fontWeight = val;
      syncButtonToCanvas();
    }
  };

  const handleTextFillColorChange = (color) => {
    setTextFillColor(color);
    if (!selectedElement) return;

    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    if (textEl) {
      const fillVal = applySvgGradient(color, 'fill', 'text');
      textEl.setAttribute('fill', fillVal);
      textEl.style.fill = fillVal;
      textEl.setAttribute('data-fill-color', color);
      syncButtonToCanvas();
    }
  };

  // Icon Handlers
  const handleToggleIcon = (val) => {
    setHasIcon(val);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-has-icon', val ? 'true' : 'false');
    updateButtonDimensions(buttonText, fontSize, fontFamily, val);
    syncButtonToCanvas();
  };

  const handleIconPlacementChange = (val) => {
    setIconPlacement(val);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-icon-placement', val);
    updateButtonDimensions(buttonText, fontSize, fontFamily, hasIcon, iconName, iconHtml, iconViewBox, paddingW, paddingH, iconGap, val);
    syncButtonToCanvas();
  };

  const handleIconColorChange = (color) => {
    setIconColor(color);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-icon-color', color);
    updateButtonDimensions(buttonText, fontSize, fontFamily, hasIcon, iconName, iconHtml, iconViewBox, paddingW, paddingH, iconGap, iconPlacement, radius, color, iconBgColor);
    syncButtonToCanvas();
  };

  const handleIconBgColorChange = (color) => {
    setIconBgColor(color);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-icon-bg-color', color);

    let badgeEl = selectedElement.querySelector('.btn-badge-circle, .btn-badge-block, .btn-icon-bg') ||
      selectedElement.querySelector('polygon:not(.btn-main-poly)');

    const hasBg = Boolean(color && color !== 'none' && color !== 'transparent');

    if (hasBg) {
      if (!badgeEl) {
        const ownerDoc = selectedElement.ownerDocument || document;
        const iconWrap = selectedElement.querySelector('.btn-icon');
        badgeEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "circle");
        badgeEl.setAttribute('class', 'btn-badge-circle');
        badgeEl.setAttribute('stroke', 'none');
        if (iconWrap) {
          selectedElement.insertBefore(badgeEl, iconWrap);
        } else {
          selectedElement.appendChild(badgeEl);
        }
      }

      const fillVal = applySvgGradient(color, 'fill', 'icon-bg');
      badgeEl.setAttribute('fill', fillVal);
      badgeEl.setAttribute('data-fill-color', color);
      badgeEl.setAttribute('display', '');
      badgeEl.style.display = '';
    } else {
      if (badgeEl) {
        badgeEl.setAttribute('fill', 'none');
        badgeEl.setAttribute('data-fill-color', 'none');
        badgeEl.setAttribute('display', 'none');
      }
    }

    updateButtonDimensions(
      buttonText,
      fontSize,
      fontFamily,
      hasIcon,
      iconName,
      iconHtml,
      iconViewBox,
      paddingW,
      paddingH,
      iconGap,
      iconPlacement,
      radius,
      iconColor,
      color
    );
    syncButtonToCanvas();
  };

  const handleIconBgOpacityChange = (val) => {
    setIconBgOpacity(val);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-icon-bg-opacity', val.toString());
    const badgeEl = selectedElement.querySelector('.btn-badge-circle, .btn-badge-block, .btn-icon-bg') ||
      selectedElement.querySelector('polygon:not(.btn-main-poly)');
    if (badgeEl) {
      badgeEl.setAttribute('fill-opacity', (val / 100).toString());
    }
    syncButtonToCanvas();
  };

  const handleTextOpacityChange = (val) => {
    setTextOpacity(val);
    if (!selectedElement) return;
    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    if (textEl) {
      textEl.setAttribute('fill-opacity', (val / 100).toString());
      textEl.setAttribute('opacity', (val / 100).toString());
      syncButtonToCanvas();
    }
  };

  const handleIconOpacityChange = (val) => {
    setIconOpacity(val);
    if (!selectedElement) return;
    selectedElement.setAttribute('data-icon-opacity', val.toString());
    const iconWrap = selectedElement.querySelector('.btn-icon');
    if (iconWrap) {
      iconWrap.setAttribute('opacity', (val / 100).toString());
      syncButtonToCanvas();
    }
  };

  const handleShapeOpacityChange = (val) => {
    setShapeOpacity(val);
    if (!selectedElement) return;
    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    const rectEl = selectedElement.querySelector('rect.btn-bg') || selectedElement.querySelector('rect');
    const targetEl = mainPoly || rectEl;
    if (targetEl) {
      targetEl.setAttribute('fill-opacity', (val / 100).toString());
      syncButtonToCanvas();
    }
  };

  const handleStrokeOpacityChange = (val) => {
    setStrokeOpacity(val);
    if (!selectedElement) return;
    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    const rectEl = selectedElement.querySelector('rect.btn-bg') || selectedElement.querySelector('rect');
    const targetEl = mainPoly || rectEl;
    if (targetEl) {
      targetEl.setAttribute('stroke-opacity', (val / 100).toString());
      syncButtonToCanvas();
    }
  };

  const handleIconGapChange = (gap) => {
    setIconGap(gap);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-icon-gap', gap.toString());
    updateButtonDimensions(buttonText, fontSize, fontFamily, hasIcon, iconName, iconHtml, iconViewBox, paddingW, paddingH, gap);
    syncButtonToCanvas();
  };

  // Padding Handlers
  const handlePaddingChange = (type, val) => {
    const num = Math.max(0, val);
    if (type === 'w') {
      setPaddingW(num);
      if (isPaddingLinked) setPaddingH(num);
      if (selectedElement) {
        selectedElement.setAttribute('data-padding-w', num.toString());
        if (isPaddingLinked) selectedElement.setAttribute('data-padding-h', num.toString());
        updateButtonDimensions(buttonText, fontSize, fontFamily, hasIcon, iconName, iconHtml, iconViewBox, num, isPaddingLinked ? num : paddingH);
        syncButtonToCanvas();
      }
    } else {
      setPaddingH(num);
      if (isPaddingLinked) setPaddingW(num);
      if (selectedElement) {
        selectedElement.setAttribute('data-padding-h', num.toString());
        if (isPaddingLinked) selectedElement.setAttribute('data-padding-w', num.toString());
        updateButtonDimensions(buttonText, fontSize, fontFamily, hasIcon, iconName, iconHtml, iconViewBox, isPaddingLinked ? num : paddingW, num);
        syncButtonToCanvas();
      }
    }
  };

  const handleTogglePaddingLink = (linked) => {
    setIsPaddingLinked(linked);
    if (selectedElement) {
      selectedElement.setAttribute('data-padding-linked', linked ? 'true' : 'false');
      if (linked) {
        setPaddingH(paddingW);
        selectedElement.setAttribute('data-padding-h', paddingW.toString());
        updateButtonDimensions(buttonText, fontSize, fontFamily, hasIcon, iconName, iconHtml, iconViewBox, paddingW, paddingW);
        syncButtonToCanvas();
      }
    }
  };

  // Button Color Handler
  const handleShapeFillColorChange = (color) => {
    setShapeFillColor(color);
    if (!selectedElement) return;

    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    if (mainPoly) {
      const fillVal = applySvgGradient(color, 'fill', 'poly');
      mainPoly.setAttribute('fill', fillVal);
      mainPoly.style.fill = fillVal;
      mainPoly.setAttribute('data-fill-color', color);
    }

    const rectEl = selectedElement.querySelector('rect.btn-bg') || selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);
    if (rectEl) {
      const fillVal = applySvgGradient(color, 'fill', 'rect');
      rectEl.setAttribute('fill', fillVal);
      rectEl.setAttribute('data-fill-color', color);
    }

    syncButtonToCanvas();
  };

  // Stoke Color Handlers
  const handleStrokeColorChange = (color) => {
    setStrokeColor(color);
    if (!selectedElement) return;

    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    const rectEl = selectedElement.querySelector('rect.btn-bg') || selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);
    const targetEl = mainPoly || rectEl;

    if (targetEl) {
      const strokeVal = applySvgGradient(color, 'stroke', 'shape');
      targetEl.setAttribute('stroke', strokeVal);
      targetEl.style.stroke = strokeVal;
      targetEl.setAttribute('data-stroke-color', color);
    }

    const borderRect = selectedElement.querySelector('rect.btn-border');
    if (borderRect) {
      borderRect.setAttribute('stroke', color);
    }

    syncButtonToCanvas();
  };

  const handleStrokeWidthChange = (val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setStrokeWidth(num);
    if (!selectedElement) return;

    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    const rectEl = selectedElement.querySelector('rect.btn-bg') || selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);
    const targetEl = mainPoly || rectEl;

    if (targetEl) {
      targetEl.setAttribute('stroke-width', num.toString());
      targetEl.style.strokeWidth = num.toString();
    }

    const borderRect = selectedElement.querySelector('rect.btn-border');
    if (borderRect) {
      borderRect.setAttribute('stroke-width', num.toString());
    }

    syncButtonToCanvas();
  };

  const handleStrokeAlignmentChange = (val) => {
    setStrokeAlignment(val);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-stroke-alignment', val);
    syncButtonToCanvas();
  };

  const handleLineStyleChange = (style) => {
    setLineStyle(style);
    if (!selectedElement) return;

    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    const rectEl = selectedElement.querySelector('rect.btn-bg') || selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);
    const targetEl = mainPoly || rectEl;

    let dashArray = 'none';
    if (style === 'Dashed') {
      dashArray = `${dashL},${dashG}`;
    } else if (style === 'Dotted') {
      dashArray = '2,4';
    }

    if (targetEl) {
      targetEl.setAttribute('stroke-dasharray', dashArray);
    }
    const borderRect = selectedElement.querySelector('rect.btn-border');
    if (borderRect) {
      borderRect.setAttribute('stroke-dasharray', dashArray);
    }

    syncButtonToCanvas();
  };

  const handleDashChange = (type, val) => {
    const num = Math.max(1, parseInt(val) || 1);
    const newL = type === 'l' ? num : dashL;
    const newG = type === 'g' ? num : dashG;

    if (type === 'l') setDashL(num);
    if (type === 'g') setDashG(num);

    if (!selectedElement) return;

    selectedElement.setAttribute('data-dash-l', newL.toString());
    selectedElement.setAttribute('data-dash-g', newG.toString());

    if (lineStyle === 'Dashed') {
      const mainPoly = selectedElement.querySelector('.btn-main-poly');
      const rectEl = selectedElement.querySelector('rect.btn-bg') || selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);
      const targetEl = mainPoly || rectEl;
      if (targetEl) {
        targetEl.setAttribute('stroke-dasharray', `${newL},${newG}`);
      }
      const borderRect = selectedElement.querySelector('rect.btn-border');
      if (borderRect) {
        borderRect.setAttribute('stroke-dasharray', `${newL},${newG}`);
      }
    }

    syncButtonToCanvas();
  };

  const handleLineCornerChange = (val) => {
    setLineCorner(val);
    if (!selectedElement) return;

    const isRound = val === 'Rounded';
    const lineCap = isRound ? 'round' : 'butt';
    const lineJoin = isRound ? 'round' : 'miter';

    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    const rectEl = selectedElement.querySelector('rect.btn-bg') || selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);
    const targetEl = mainPoly || rectEl;

    if (targetEl) {
      targetEl.setAttribute('stroke-linecap', lineCap);
      targetEl.setAttribute('stroke-linejoin', lineJoin);
    }
    const borderRect = selectedElement.querySelector('rect.btn-border');
    if (borderRect) {
      borderRect.setAttribute('stroke-linecap', lineCap);
      borderRect.setAttribute('stroke-linejoin', lineJoin);
    }

    syncButtonToCanvas();
  };

  // Corner Radius Handlers
  const handleCornerChange = (corner, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    const newRadius = isRadiusLinked
      ? { tl: num, tr: num, bl: num, br: num }
      : { ...radius, [corner]: num };

    setRadius(newRadius);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-tl', newRadius.tl.toString());
    selectedElement.setAttribute('data-tr', newRadius.tr.toString());
    selectedElement.setAttribute('data-bl', newRadius.bl.toString());
    selectedElement.setAttribute('data-br', newRadius.br.toString());
    selectedElement.setAttribute('data-corner-linked', isRadiusLinked ? 'true' : 'false');

    const maxR = Math.max(newRadius.tl, newRadius.tr, newRadius.bl, newRadius.br);
    const rectEl = selectedElement.querySelector('rect.btn-bg') || selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);
    if (rectEl) {
      rectEl.setAttribute('rx', maxR.toString());
      rectEl.setAttribute('ry', maxR.toString());
    }
    const borderRect = selectedElement.querySelector('rect.btn-border');
    if (borderRect) {
      borderRect.setAttribute('rx', maxR.toString());
      borderRect.setAttribute('ry', maxR.toString());
    }

    updateButtonDimensions(buttonText, fontSize, fontFamily, hasIcon, iconName, iconHtml, iconViewBox, paddingW, paddingH, iconGap, iconPlacement, newRadius);
    syncButtonToCanvas();
  };

  const handleToggleRadiusLink = (linked) => {
    setIsRadiusLinked(linked);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-corner-linked', linked ? 'true' : 'false');
    if (linked) {
      const maxR = Math.max(radius.tl, radius.tr, radius.bl, radius.br);
      const unifiedRadius = { tl: maxR, tr: maxR, bl: maxR, br: maxR };
      setRadius(unifiedRadius);
      selectedElement.setAttribute('data-tl', maxR.toString());
      selectedElement.setAttribute('data-tr', maxR.toString());
      selectedElement.setAttribute('data-bl', maxR.toString());
      selectedElement.setAttribute('data-br', maxR.toString());
      updateButtonDimensions(buttonText, fontSize, fontFamily, hasIcon, iconName, iconHtml, iconViewBox, paddingW, paddingH, iconGap, iconPlacement, unifiedRadius);
      syncButtonToCanvas();
    }
  };

  // Effects Handlers
  const handleSetActiveEffects = (updater) => {
    const next = typeof updater === 'function' ? updater(activeEffects) : updater;
    setActiveEffects(next);
    if (!selectedElement) return;

    const hasDropShadow = next.includes('Drop Shadow');

    selectedElement.setAttribute('data-effect-drop-shadow', hasDropShadow ? 'true' : 'false');
    selectedElement.removeAttribute('data-effect-inner-shadow');
    selectedElement.removeAttribute('data-effect-blur');

    syncButtonToCanvas(true, hasDropShadow);
  };

  const handleSetEffectSettings = (updater) => {
    const next = typeof updater === 'function' ? updater(effectSettings) : updater;
    setEffectSettings(next);
    if (!selectedElement) return;

    if (next['Drop Shadow']) {
      selectedElement.setAttribute('data-effect-drop-shadow-x', next['Drop Shadow'].x.toString());
      selectedElement.setAttribute('data-effect-drop-shadow-y', next['Drop Shadow'].y.toString());
      selectedElement.setAttribute('data-effect-drop-shadow-blur', next['Drop Shadow'].blur.toString());
      selectedElement.setAttribute('data-effect-drop-shadow-spread', next['Drop Shadow'].spread.toString());
      selectedElement.setAttribute('data-effect-drop-shadow-color', next['Drop Shadow'].color);
      selectedElement.setAttribute('data-effect-drop-shadow-opacity', next['Drop Shadow'].opacity.toString());
    }

    syncButtonToCanvas(true, activeEffects.includes('Drop Shadow'), next['Drop Shadow']);
  };

  // Render Icon in Preview Card
  const renderIconPreview = () => {
    const IconCmp = LucideIcons[iconName] || LucideIcons.Check;
    const hasBg = Boolean(iconBgColor && iconBgColor !== 'none' && iconBgColor !== 'transparent');
    const iconElement = iconHtml ? (
      <svg
        viewBox={iconViewBox || "0 0 24 24"}
        className={hasBg ? "w-[1.8vw] h-[1.8vw]" : "w-[2.4vw] h-[2.4vw]"}
        stroke={iconColor || "#000000"}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: iconHtml }}
      />
    ) : (
      <IconCmp
        size={hasBg ? "1.8vw" : "2.4vw"}
        strokeWidth={2.5}
        style={{ color: iconColor || "#000000" }}
      />
    );

    if (hasBg) {
      return (
        <div
          className="w-[3.2vw] h-[3.2vw] rounded-full flex items-center justify-center shadow-xs"
          style={{
            backgroundColor: iconBgColor,
            opacity: (iconBgOpacity || 100) / 100
          }}
        >
          {iconElement}
        </div>
      );
    }

    return iconElement;
  };

  return (
    <div className="w-full flex flex-col gap-[0.6vw] font-sans text-gray-800 pt-[0.2vw] pr-[0.2vw] select-none pb-[2vw]">
      {/* Scoped CSS for Coral Orange Range Slider */}
      <style>{`
        .button-icon-gap-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 0.9vw;
          height: 0.9vw;
          border-radius: 50%;
          background: #ffffff;
          border: 0.15vw solid #E05638;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }
        .button-icon-gap-slider::-moz-range-thumb {
          width: 0.9vw;
          height: 0.9vw;
          border-radius: 50%;
          background: #ffffff;
          border: 0.15vw solid #E05638;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }
      `}</style>

      {/* ─── 1. BUTTON CONTENT SECTION ──────────────────────────── */}
      <SectionHeader title="Button Properties" />

      {/* Row 1: Button Text */}
      <PropertyRow label="Button Text">
        <div className="relative w-full">
          <input
            type="text"
            value={buttonText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Button"
            className="w-full h-[2.5vw] bg-white border border-gray-200 rounded-[0.5vw] px-[0.6vw] pr-[1.8vw] text-[0.8vw] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#E05638] shadow-2xs font-normal"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-[0.6vw] text-gray-400">
            <Pencil className="w-[0.85vw] h-[0.85vw]" />
          </div>
        </div>
      </PropertyRow>

      {/* Row 2: Font Family & Font Size */}
      <div className="flex items-center gap-[0.5vw]">
        <div className="w-[5.6vw] shrink-0" />
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-[0.4vw]">
          {/* Font Family Dropdown */}
          <div className="relative w-full">
            <select
              value={fontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="w-full h-[2.5vw] px-[0.6vw] pr-[1.8vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.78vw] text-gray-700 outline-none hover:border-gray-300 focus:border-[#E05638] transition-colors appearance-none cursor-pointer truncate shadow-2xs font-medium"
            >
              {fontFamilies.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <ChevronDown size="0.85vw" className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Font Size Dropdown */}
          <div className="relative w-full">
            <select
              value={fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
              className="w-full h-[2.5vw] px-[0.6vw] pr-[1.8vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.78vw] text-gray-700 outline-none hover:border-gray-300 focus:border-[#E05638] transition-colors appearance-none cursor-pointer text-center shadow-2xs font-medium"
            >
              {fontSizes.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size="0.85vw" className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Row 3: Font Weight Dropdown */}
      <div className="flex items-center gap-[0.5vw]">
        <div className="w-[5.6vw] shrink-0" />
        <div className="flex-1 min-w-0 relative">
          <select
            value={fontWeight}
            onChange={(e) => handleFontWeightChange(e.target.value)}
            className="w-full h-[2.5vw] px-[0.6vw] pr-[1.8vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.78vw] text-gray-700 outline-none hover:border-gray-300 focus:border-[#E05638] transition-colors appearance-none cursor-pointer shadow-2xs font-medium"
          >
            {fontWeights.map(w => (
              <option key={w.value} value={w.value}>{w.name}</option>
            ))}
          </select>
          <ChevronDown size="0.85vw" className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Row 4: Text Color */}
      <PropertyRow label="Text Color">
        <ColorInput
          color={textFillColor}
          onChange={handleTextFillColorChange}
          opacity={textOpacity}
          onOpenPicker={() => setActiveColorPicker('textColor')}
          isActive={activeColorPicker === 'textColor'}
        />
      </PropertyRow>

      {/* Row 5: Add Icon Toggle */}
      <div className="flex items-center justify-between pl-[0.5vw] pr-[0.1vw] py-[0.2vw]">
        <span className="text-[0.8vw] font-medium text-gray-900">Add Icon to the button</span>
        <button
          type="button"
          onClick={() => handleToggleIcon(!hasIcon)}
          className={`w-[1.9vw] h-[1.1vw] flex items-center rounded-full p-[0.1vw] cursor-pointer transition-colors ${
            hasIcon ? 'bg-[#E05638]' : 'bg-gray-300'
          }`}
        >
          <div
            className={`bg-white w-[0.9vw] h-[0.9vw] rounded-full shadow-md transform transition-transform ${
              hasIcon ? 'translate-x-[0.8vw]' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Rows when Icon is enabled */}
      {hasIcon && (
        <>
          {/* Icon Card */}
          <PropertyRow label="Icon">
            <div
              onClick={() => setIsIconGalleryOpen(true)}
              className="w-full h-[5vw] border border-gray-200 hover:border-gray-300 rounded-[0.5vw] bg-white p-[0.4vw] relative flex items-center justify-center cursor-pointer group transition-all shadow-2xs hover:shadow-sm"
              title="Click to change icon"
            >
              {/* Swap Icon button in top-right */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsIconGalleryOpen(true);
                }}
                className="absolute top-[0.35vw] right-[0.35vw] text-gray-400 group-hover:text-gray-700 transition-colors p-[0.2vw] rounded-[0.2vw] hover:bg-gray-50 cursor-pointer"
                title="Change icon"
              >
                <ArrowLeftRight className="w-[0.9vw] h-[0.9vw]" />
              </button>

              {/* Centered preview of icon */}
              <div className="w-[4.5vw] h-[4.5vw] flex items-center justify-center group-hover:scale-105 transition-transform">
                {renderIconPreview()}
              </div>
            </div>
          </PropertyRow>

          {/* Placement Dropdown */}
          <PropertyRow label="Placement">
            <div className="relative w-full">
              <select
                value={iconPlacement}
                onChange={(e) => handleIconPlacementChange(e.target.value)}
                className="w-full h-[2.5vw] px-[0.6vw] pr-[1.8vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.78vw] text-gray-700 outline-none hover:border-gray-300 focus:border-[#E05638] transition-colors appearance-none cursor-pointer shadow-2xs font-medium"
              >
                <option value="Left">Left</option>
                <option value="Right">Right</option>
              </select>
              <ChevronDown size="0.85vw" className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </PropertyRow>

          {/* Icon Color */}
          <PropertyRow label="Icon Color">
            <ColorInput
              color={iconColor}
              onChange={handleIconColorChange}
              opacity={iconOpacity}
              onOpenPicker={() => setActiveColorPicker('iconColor')}
              isActive={activeColorPicker === 'iconColor'}
            />
          </PropertyRow>

          {/* Icon BG Color */}
          <PropertyRow label="Icon BG Color">
            <ColorInput
              color={iconBgColor}
              onChange={handleIconBgColorChange}
              opacity={iconBgOpacity}
              onOpenPicker={() => setActiveColorPicker('iconBgColor')}
              isActive={activeColorPicker === 'iconBgColor'}
            />
          </PropertyRow>
        </>
      )}

      {/* ─── 2. SIZE & SPACING SECTION ──────────────────────────── */}
      <SectionHeader title="Size & Spacing" />

      {/* Padding */}
      <PropertyRow label="Padding">
        <div className="flex items-center gap-[0.4vw] w-full">
          {/* W input */}
          <div className="flex-1 h-[2.5vw] flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white px-[0.6vw] text-[0.8vw] text-gray-800 focus-within:border-[#E05638] shadow-2xs">
            <span className="text-[0.75vw] text-gray-400 font-medium">W</span>
            <input
              type="number"
              value={paddingW}
              onChange={(e) => handlePaddingChange('w', parseInt(e.target.value) || 0)}
              className="w-[2.5vw] text-right text-[0.8vw] text-gray-700 outline-none bg-transparent font-medium no-spin"
            />
          </div>

          {/* Link button */}
          <button
            type="button"
            onClick={() => handleTogglePaddingLink(!isPaddingLinked)}
            className="text-gray-400 hover:text-gray-600 p-[0.2vw] transition-colors cursor-pointer flex-shrink-0"
            title={isPaddingLinked ? "Unlink padding" : "Link padding"}
          >
            {isPaddingLinked ? <Link2 size="0.95vw" className="text-gray-700" /> : <Link2Off size="0.95vw" className="text-gray-400" />}
          </button>

          {/* H input */}
          <div className="flex-1 h-[2.5vw] flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white px-[0.6vw] text-[0.8vw] text-gray-800 focus-within:border-[#E05638] shadow-2xs">
            <span className="text-[0.75vw] text-gray-400 font-medium">H</span>
            <input
              type="number"
              value={paddingH}
              onChange={(e) => handlePaddingChange('h', parseInt(e.target.value) || 0)}
              className="w-[2.5vw] text-right text-[0.8vw] text-gray-700 outline-none bg-transparent font-medium no-spin"
            />
          </div>
        </div>
      </PropertyRow>

      {/* Icon Gap */}
      <PropertyRow label="Icon Gap">
        <div className="flex items-center gap-[0.6vw] w-full">
          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min={0}
              max={40}
              value={iconGap}
              onChange={(e) => handleIconGapChange(parseInt(e.target.value) || 0)}
              className="button-icon-gap-slider w-full h-[0.25vw] appearance-none cursor-pointer rounded-full outline-none"
              style={{
                background: `linear-gradient(to right, #E05638 0%, #E05638 ${(iconGap / 40) * 100}%, #e5e7eb ${(iconGap / 40) * 100}%, #e5e7eb 100%)`
              }}
            />
          </div>
          <div className="w-[3.4vw] h-[2.5vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center bg-white text-[0.75vw] text-gray-700 font-medium shadow-2xs flex-shrink-0">
            {iconGap}px
          </div>
        </div>
      </PropertyRow>

      {/* ─── 3. BUTTON COLOR SECTION ────────────────────────────── */}
      <SectionHeader title="Button Color" />

      <div className="pl-[0.5vw]">
        <ColorInputWithFormat
          color={shapeFillColor}
          onChange={handleShapeFillColorChange}
          opacity={shapeOpacity}
          onOpenPicker={() => setActiveColorPicker('buttonColor')}
          isActive={activeColorPicker === 'buttonColor'}
        />
      </div>

      {/* ─── 4. STOKE COLOR SECTION ─────────────────────────────── */}
      <SectionHeader title="Stoke Color" />

      {/* Row 1: Swatch, Hex, Format */}
      <div className="pl-[0.5vw]">
        <ColorInputWithFormat
          color={strokeColor}
          onChange={handleStrokeColorChange}
          opacity={strokeOpacity}
          onOpenPicker={() => setActiveColorPicker('strokeColor')}
          isActive={activeColorPicker === 'strokeColor'}
        />
      </div>

      {/* Row 2: Alignment & Stoke Width */}
      <div className="grid grid-cols-2 gap-[0.6vw] pl-[0.5vw]">
        {/* Alignment */}
        <div className="flex flex-col gap-[0.25vw]">
          <span className="text-[0.72vw] text-gray-500 font-medium">Alignment</span>
          <div className="relative">
            <select
              value={strokeAlignment}
              onChange={(e) => handleStrokeAlignmentChange(e.target.value)}
              className="w-full h-[2.5vw] px-[0.6vw] pr-[1.8vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.78vw] text-gray-700 outline-none hover:border-gray-300 focus:border-[#E05638] transition-colors appearance-none cursor-pointer shadow-2xs font-medium"
            >
              <option value="Center">Center</option>
              <option value="Inside">Inside</option>
              <option value="Outside">Outside</option>
            </select>
            <ChevronDown size="0.85vw" className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Stoke Width */}
        <div className="flex flex-col gap-[0.25vw]">
          <span className="text-[0.72vw] text-gray-500 font-medium">Stoke Width</span>
          <div className="flex items-center gap-[0.3vw] h-[2.5vw]">
            <button
              type="button"
              onClick={() => handleStrokeWidthChange(Math.max(0, strokeWidth - 1))}
              className="w-[2vw] h-full flex items-center justify-center bg-gray-100 rounded-[0.4vw] text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <span className="text-[1vw] leading-none mb-[0.1vw]">-</span>
            </button>
            <div className="flex-1 h-full bg-white border border-gray-200 rounded-[0.5vw] flex items-center justify-center shadow-2xs">
              <input
                type="number"
                value={strokeWidth}
                onChange={(e) => handleStrokeWidthChange(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-center text-[0.8vw] text-gray-700 outline-none bg-transparent font-medium no-spin"
              />
            </div>
            <button
              type="button"
              onClick={() => handleStrokeWidthChange(strokeWidth + 1)}
              className="w-[2vw] h-full flex items-center justify-center bg-gray-100 rounded-[0.4vw] text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <span className="text-[1vw] leading-none mb-[0.1vw]">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Line Style & Dash Property */}
      <div className="grid grid-cols-2 gap-[0.6vw] pl-[0.5vw]">
        {/* Line Style */}
        <div className="flex flex-col gap-[0.25vw]">
          <span className="text-[0.72vw] text-gray-500 font-medium">Line style</span>
          <div className="flex items-center justify-between gap-[0.3vw] h-[2.5vw]">
            {/* Solid */}
            <button
              type="button"
              onClick={() => handleLineStyleChange('Solid')}
              className={`flex-1 h-full flex items-center justify-center rounded-[0.5vw] border transition-colors cursor-pointer ${
                lineStyle === 'Solid' ? 'bg-white border-[#E05638] ring-1 ring-[#E05638]/30 shadow-2xs' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className={`w-[1.2vw] h-[0.12vw] rounded-full ${lineStyle === 'Solid' ? 'bg-[#E05638]' : 'bg-gray-400'}`} />
            </button>

            {/* Dashed */}
            <button
              type="button"
              onClick={() => handleLineStyleChange('Dashed')}
              className={`flex-1 h-full flex items-center justify-center rounded-[0.5vw] border transition-colors cursor-pointer ${
                lineStyle === 'Dashed' ? 'bg-white border-[#E05638] ring-1 ring-[#E05638]/30 shadow-2xs' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex gap-[0.15vw]">
                <div className={`w-[0.25vw] h-[0.12vw] rounded-full ${lineStyle === 'Dashed' ? 'bg-[#E05638]' : 'bg-gray-400'}`} />
                <div className={`w-[0.25vw] h-[0.12vw] rounded-full ${lineStyle === 'Dashed' ? 'bg-[#E05638]' : 'bg-gray-400'}`} />
                <div className={`w-[0.25vw] h-[0.12vw] rounded-full ${lineStyle === 'Dashed' ? 'bg-[#E05638]' : 'bg-gray-400'}`} />
              </div>
            </button>

            {/* Dotted */}
            <button
              type="button"
              onClick={() => handleLineStyleChange('Dotted')}
              className={`flex-1 h-full flex items-center justify-center rounded-[0.5vw] border transition-colors cursor-pointer ${
                lineStyle === 'Dotted' ? 'bg-white border-[#E05638] ring-1 ring-[#E05638]/30 shadow-2xs' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex gap-[0.1vw] items-center">
                <div className={`w-[0.35vw] h-[0.12vw] rounded-full ${lineStyle === 'Dotted' ? 'bg-[#E05638]' : 'bg-gray-400'}`} />
                <div className={`w-[0.12vw] h-[0.12vw] rounded-full ${lineStyle === 'Dotted' ? 'bg-[#E05638]' : 'bg-gray-400'}`} />
                <div className={`w-[0.35vw] h-[0.12vw] rounded-full ${lineStyle === 'Dotted' ? 'bg-[#E05638]' : 'bg-gray-400'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Dash Property */}
        <div className="flex flex-col gap-[0.25vw]">
          <span className="text-[0.72vw] text-gray-500 font-medium">Dash Property</span>
          <div className="flex items-center gap-[0.3vw] h-[2.5vw]">
            <div className="flex-1 flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white h-full px-[0.5vw] shadow-2xs">
              <span className="text-[0.72vw] text-gray-400 font-medium">L</span>
              <input
                type="number"
                value={dashL}
                onChange={(e) => handleDashChange('l', parseInt(e.target.value) || 1)}
                className="w-[1.8vw] bg-transparent outline-none text-[0.75vw] text-gray-700 font-medium no-spin text-right"
              />
            </div>
            <span className="text-[0.72vw] text-gray-400 font-medium">:</span>
            <div className="flex-1 flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white h-full px-[0.5vw] shadow-2xs">
              <span className="text-[0.72vw] text-gray-400 font-medium">G</span>
              <input
                type="number"
                value={dashG}
                onChange={(e) => handleDashChange('g', parseInt(e.target.value) || 1)}
                className="w-[1.8vw] bg-transparent outline-none text-[0.75vw] text-gray-700 font-medium no-spin text-right"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Line Corner */}
      <div className="grid grid-cols-2 gap-[0.6vw] pl-[0.5vw]">
        <div className="flex flex-col gap-[0.25vw]">
          <span className="text-[0.72vw] text-gray-500 font-medium">Line Corner</span>
          <div className="relative">
            <select
              value={lineCorner}
              onChange={(e) => handleLineCornerChange(e.target.value)}
              className="w-full h-[2.5vw] px-[0.6vw] pr-[1.8vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.78vw] text-gray-700 outline-none hover:border-gray-300 focus:border-[#E05638] transition-colors appearance-none cursor-pointer shadow-2xs font-medium"
            >
              <option value="Rounded">Rounded</option>
              <option value="Square">Square</option>
            </select>
            <ChevronDown size="0.85vw" className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ─── 5. CORNER RADIUS SECTION ───────────────────────────── */}
      <SectionHeader title="Corner Radius" />

      <div className="flex flex-col items-center justify-center py-[0.4vw] pl-[0.5vw]">
        <div className="grid grid-cols-2 gap-x-[2.5vw] gap-y-[1.2vw] relative">
          {/* Top Left */}
          <div className="w-[5.2vw] h-[2.6vw] border border-gray-300 rounded-tl-[1vw] rounded-tr-0 rounded-bl-0 rounded-br-0 flex items-center justify-between px-[0.4vw] bg-white hover:border-gray-400 transition-colors shadow-2xs">
            <button
              type="button"
              onClick={() => handleCornerChange('tl', Math.max(0, radius.tl - 1))}
              className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size="0.9vw" />
            </button>
            <input
              type="number"
              value={radius.tl}
              onChange={(e) => handleCornerChange('tl', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-center text-[0.85vw] font-medium text-gray-700 outline-none bg-transparent no-spin cursor-text"
            />
            <button
              type="button"
              onClick={() => handleCornerChange('tl', radius.tl + 1)}
              className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronRight size="0.9vw" />
            </button>
          </div>

          {/* Top Right */}
          <div className="w-[5.2vw] h-[2.6vw] border border-gray-300 rounded-tr-[1vw] rounded-tl-0 rounded-bl-0 rounded-br-0 flex items-center justify-between px-[0.4vw] bg-white hover:border-gray-400 transition-colors shadow-2xs">
            <button
              type="button"
              onClick={() => handleCornerChange('tr', Math.max(0, radius.tr - 1))}
              className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size="0.9vw" />
            </button>
            <input
              type="number"
              value={radius.tr}
              onChange={(e) => handleCornerChange('tr', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-center text-[0.85vw] font-medium text-gray-700 outline-none bg-transparent no-spin cursor-text"
            />
            <button
              type="button"
              onClick={() => handleCornerChange('tr', radius.tr + 1)}
              className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronRight size="0.9vw" />
            </button>
          </div>

          {/* Center Link Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto">
            <button
              type="button"
              onClick={() => handleToggleRadiusLink(!isRadiusLinked)}
              className="bg-white p-[0.35vw] rounded-full shadow-sm border border-gray-200 hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              title={isRadiusLinked ? "Unlink corners" : "Link corners"}
            >
              {isRadiusLinked ? <Link2 size="1.1vw" className="text-black" /> : <Link2Off size="1.1vw" className="text-gray-400" />}
            </button>
          </div>

          {/* Bottom Left */}
          <div className="w-[5.2vw] h-[2.6vw] border border-gray-300 rounded-bl-[1vw] rounded-tl-0 rounded-tr-0 rounded-br-0 flex items-center justify-between px-[0.4vw] bg-white hover:border-gray-400 transition-colors shadow-2xs">
            <button
              type="button"
              onClick={() => handleCornerChange('bl', Math.max(0, radius.bl - 1))}
              className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size="0.9vw" />
            </button>
            <input
              type="number"
              value={radius.bl}
              onChange={(e) => handleCornerChange('bl', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-center text-[0.85vw] font-medium text-gray-700 outline-none bg-transparent no-spin cursor-text"
            />
            <button
              type="button"
              onClick={() => handleCornerChange('bl', radius.bl + 1)}
              className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronRight size="0.9vw" />
            </button>
          </div>

          {/* Bottom Right */}
          <div className="w-[5.2vw] h-[2.6vw] border border-gray-300 rounded-br-[1vw] rounded-tl-0 rounded-tr-0 rounded-bl-0 flex items-center justify-between px-[0.4vw] bg-white hover:border-gray-400 transition-colors shadow-2xs">
            <button
              type="button"
              onClick={() => handleCornerChange('br', Math.max(0, radius.br - 1))}
              className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size="0.9vw" />
            </button>
            <input
              type="number"
              value={radius.br}
              onChange={(e) => handleCornerChange('br', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-center text-[0.85vw] font-medium text-gray-700 outline-none bg-transparent no-spin cursor-text"
            />
            <button
              type="button"
              onClick={() => handleCornerChange('br', radius.br + 1)}
              className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronRight size="0.9vw" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 6. EFFECTS SECTION ─────────────────────────────────── */}
      <SectionHeader title="Effects" />

      <div className="pl-[0.5vw]">
        <Effect
          isShape={true}
          hideBlur={true}
          hideInnerShadow={true}
          hideHeader={true}
          openSubSection={openSection === 'effect' ? 'effect' : null}
          setOpenSubSection={(s) => setOpenSection(s === 'effect' ? 'effect' : null)}
          activeEffects={activeEffects}
          setActiveEffects={handleSetActiveEffects}
          effectSettings={effectSettings}
          setEffectSettings={handleSetEffectSettings}
          activeColorPicker={activeColorPicker}
          setActiveColorPicker={setActiveColorPicker}
          showDetailedPicker={false}
          setShowDetailedPicker={() => {}}
        />
      </div>

      {/* ─── PORTALS ────────────────────────────────────────────── */}

      {/* Color Picker Portal */}
      {activeColorPicker && createPortal(
        <div
          className="fixed z-[5000]"
          style={{ top: '50%', right: '19.5vw', transform: 'translateY(-50%)' }}
        >
          <ColorPicker
            color={
              activeColorPicker === 'textColor' ? textFillColor :
              activeColorPicker === 'iconColor' ? iconColor :
              activeColorPicker === 'iconBgColor' ? iconBgColor :
              activeColorPicker === 'buttonColor' ? shapeFillColor :
              activeColorPicker === 'strokeColor' ? strokeColor : '#000000'
            }
            opacity={
              activeColorPicker === 'textColor' ? textOpacity :
              activeColorPicker === 'iconColor' ? iconOpacity :
              activeColorPicker === 'iconBgColor' ? iconBgOpacity :
              activeColorPicker === 'buttonColor' ? shapeOpacity :
              activeColorPicker === 'strokeColor' ? strokeOpacity : 100
            }
            onOpacityChange={(op) => {
              if (activeColorPicker === 'textColor') handleTextOpacityChange(op);
              else if (activeColorPicker === 'iconColor') handleIconOpacityChange(op);
              else if (activeColorPicker === 'iconBgColor') handleIconBgOpacityChange(op);
              else if (activeColorPicker === 'buttonColor') handleShapeOpacityChange(op);
              else if (activeColorPicker === 'strokeColor') handleStrokeOpacityChange(op);
            }}
            onChange={(c) => {
              if (activeColorPicker === 'textColor') handleTextFillColorChange(c);
              else if (activeColorPicker === 'iconColor') handleIconColorChange(c);
              else if (activeColorPicker === 'iconBgColor') handleIconBgColorChange(c);
              else if (activeColorPicker === 'buttonColor') handleShapeFillColorChange(c);
              else if (activeColorPicker === 'strokeColor') handleStrokeColorChange(c);
            }}
            onClose={() => setActiveColorPicker(null)}
            disableGradient={false}
          />
        </div>,
        document.body
      )}

      {/* Icon Gallery Portal */}
      {isIconGalleryOpen && (
        <IconGallery
          isOpen={isIconGalleryOpen}
          onClose={() => setIsIconGalleryOpen(false)}
          onSelect={(iconData) => {
            setIconName(iconData.name);
            setIconHtml(iconData.html || '');
            setIconViewBox(iconData.viewBox || '0 0 24 24');
            setIsIconGalleryOpen(false);

            if (selectedElement) {
              selectedElement.setAttribute('data-icon-name', iconData.name);
              selectedElement.setAttribute('data-icon-html', iconData.html || '');
              selectedElement.setAttribute('data-icon-viewbox', iconData.viewBox || '0 0 24 24');
              updateButtonDimensions(buttonText, fontSize, fontFamily, true, iconData.name, iconData.html, iconData.viewBox);
              syncButtonToCanvas();
            }
          }}
        />
      )}
    </div>
  );
};

export default ButtonEditor;
