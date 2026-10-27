import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Link2,
  Link2Off,
  Trash2,
  Plus,
  Copy,
  Check
} from 'lucide-react';
import ColorPicker from '../ColorPicker';
import Effect from '../Effect';

// Section header matching AudioProperties / QRCodeProperties
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

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[2.5vw] flex items-center justify-between bg-white border ${
          isOpen ? 'border-2 border-[#E05638] shadow-xs' : 'border border-gray-200 hover:border-gray-300'
        } rounded-[0.5vw] px-[0.6vw] text-[0.78vw] text-gray-800 font-medium transition-colors cursor-pointer shadow-2xs`}
      >
        <span className="font-medium truncate">{selectedOption?.label || value}</span>
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
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-[0.9vw] py-[0.45vw] text-[0.78vw] font-medium transition-colors text-left flex items-center justify-between cursor-pointer group ${
                    isSelected
                      ? 'text-[#E05638] bg-[#E05638]/10 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-[#E05638]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
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
          value={color && color.includes('gradient') ? 'GRADIENT' : displayColor}
          onChange={(e) => {
            let val = e.target.value;
            if (!val.startsWith('#') && val.length > 0 && !val.includes('gradient')) val = '#' + val;
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

// RadioButton component with signature accent
const RadioButton = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-[0.4vw] cursor-pointer select-none">
    <div
      onClick={onChange}
      className={`w-[1.05vw] h-[1.05vw] rounded-full border-2 flex items-center justify-center transition-all ${
        checked ? 'border-[#E05638]' : 'border-gray-400 hover:border-gray-600'
      }`}
    >
      {checked && <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#E05638]" />}
    </div>
    <span className="text-[0.78vw] text-gray-700 font-medium">{label}</span>
  </label>
);

// Toggle switch matching AudioProperties exact structure & style
const ToggleSwitch = ({ checked, onChange }) => (
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

const BEHAVIOR_OPTIONS = [
  { value: 'Open in - Current Tab', label: 'Open in - Current Tab' },
  { value: 'Open in - New Tab', label: 'Open in - New Tab' }
];

const LINE_CORNER_OPTIONS = [
  { value: 'Rounded', label: 'Rounded' },
  { value: 'Square', label: 'Square' }
];

const ThirdPartyEmbedProperties = ({
  selectedElementProps,
  activePageIndex,
  selectedLayerId,
  updateElementAttribute,
  selectedElement
}) => {
  // --- 1. Embed Via & Source ---
  const [embedVia, setEmbedVia] = useState('Embed Code');
  const [embedSrc, setEmbedSrc] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [url, setUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // --- 2. Embed Controls ---
  const [openWebsiteBtn, setOpenWebsiteBtn] = useState(true);
  const [allowFullscreen, setAllowFullscreen] = useState(true);
  const [behavior, setBehavior] = useState('Open in - Current Tab');

  // --- 3. Stoke Color & Width ---
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeOpacity, setStrokeOpacity] = useState(100);
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [lineCorner, setLineCorner] = useState('Rounded');
  const [activeColorPicker, setActiveColorPicker] = useState(null);

  // --- 4. Corner Radius ---
  const [radius, setRadius] = useState({
    tl: 12,
    tr: 12,
    bl: 12,
    br: 12
  });
  const [isRadiusLinked, setIsRadiusLinked] = useState(true);

  // --- Dimensions ---
  const [embedWidth, setEmbedWidth] = useState('650');
  const [embedHeight, setEmbedHeight] = useState('400');

  // --- 5. Effects ---
  const [openSection, setOpenSection] = useState(null);
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);

  // Colors on page list for ColorPicker
  const colorsOnPageList = useMemo(() => {
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const elements = doc.querySelectorAll('[data-fill-color], [data-stroke-color], [fill], [stroke]');
    const colors = new Set();
    elements.forEach(el => {
      const fill = el.getAttribute('data-fill-color') || el.getAttribute('fill');
      const stroke = el.getAttribute('data-stroke-color') || el.getAttribute('stroke');
      if (fill && fill !== 'none' && fill !== '#' && !fill.includes('gradient')) colors.add(fill.toUpperCase());
      if (stroke && stroke !== 'none' && stroke !== '#' && !stroke.includes('gradient')) colors.add(stroke.toUpperCase());
    });
    colors.add('#000000');
    colors.add('#FFFFFF');
    return Array.from(colors).slice(0, 12);
  }, [selectedElementProps, activePageIndex]);

  // Effects State derived from props
  const currentDropShadow = selectedElementProps?.['data-effect-drop-shadow'] === 'true' || selectedElementProps?.['data-effect-drop-shadow'] === undefined;

  const activeEffects = [];
  if (currentDropShadow) activeEffects.push('Drop Shadow');

  const effectSettings = selectedElementProps ? {
    'Drop Shadow': {
      x: parseInt(selectedElementProps['data-effect-drop-shadow-x'] || 2),
      y: parseInt(selectedElementProps['data-effect-drop-shadow-y'] || 2),
      blur: parseInt(selectedElementProps['data-effect-drop-shadow-blur'] || 0),
      spread: parseInt(selectedElementProps['data-effect-drop-shadow-spread'] || 0),
      color: selectedElementProps['data-effect-drop-shadow-color'] || '#000000',
      opacity: parseInt(selectedElementProps['data-effect-drop-shadow-opacity'] || 35),
    }
  } : {};

  const handleSetActiveEffects = (updater) => {
    const currentActive = [];
    if (selectedElementProps?.['data-effect-drop-shadow'] === 'true' || selectedElementProps?.['data-effect-drop-shadow'] === undefined) currentActive.push('Drop Shadow');

    const next = typeof updater === 'function' ? updater(currentActive) : updater;
    const updates = {};
    const hasDropShadow = next.includes('Drop Shadow');

    updates['data-effect-drop-shadow'] = hasDropShadow ? 'true' : 'false';

    if (Object.keys(updates).length > 0 && updateElementAttribute) {
      updateElementAttribute(activePageIndex, selectedLayerId, updates);
    }
  };

  const handleSetEffectSettings = (updater) => {
    const next = typeof updater === 'function' ? updater(effectSettings) : updater;
    const updates = {};
    if (effectSettings['Drop Shadow'] && next['Drop Shadow']) {
      const type = 'Drop Shadow';
      const prefix = 'drop-shadow';
      if (effectSettings[type].x !== next[type].x) updates[`data-effect-${prefix}-x`] = next[type].x.toString();
      if (effectSettings[type].y !== next[type].y) updates[`data-effect-${prefix}-y`] = next[type].y.toString();
      if (effectSettings[type].blur !== next[type].blur) updates[`data-effect-${prefix}-blur`] = next[type].blur.toString();
      if (effectSettings[type].spread !== next[type].spread) updates[`data-effect-${prefix}-spread`] = next[type].spread.toString();
      if (effectSettings[type].color !== next[type].color) updates[`data-effect-${prefix}-color`] = next[type].color;
      if (effectSettings[type].opacity !== next[type].opacity) updates[`data-effect-${prefix}-opacity`] = next[type].opacity.toString();
    }

    if (Object.keys(updates).length > 0 && updateElementAttribute) {
      updateElementAttribute(activePageIndex, selectedLayerId, updates);
    }
  };

  // Sync state from DOM on element selection
  useEffect(() => {
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (frameGroup) {
      const currentUrl = frameGroup.getAttribute('data-url') || '';
      const currentCode = frameGroup.getAttribute('data-custom-code') || '';
      setUrl(currentUrl);
      setCustomCode(currentCode);

      const savedVia = frameGroup.getAttribute('data-embed-via');
      if (savedVia) {
        setEmbedVia(savedVia);
      }

      // Check content of code to restore input value
      const srcMatch = currentCode.match(/src="([^"]*)"/);
      let parsedSrc = '';
      if (srcMatch && !currentCode.startsWith('<iframe srcdoc')) {
        parsedSrc = srcMatch[1];
      } else {
        parsedSrc = currentCode;
      }
      setEmbedSrc(currentUrl || parsedSrc || currentCode);

      // Width & height
      let currentW = '650';
      let currentH = '400';
      const rect = frameGroup.querySelector('.embed-fill-layer') || frameGroup.querySelector('.svg-image-stroke-overlay');
      if (rect) {
        currentW = Math.round(parseFloat(rect.getAttribute('width')) || 650).toString();
        currentH = Math.round(parseFloat(rect.getAttribute('height')) || 400).toString();
      }
      setEmbedWidth(currentW);
      setEmbedHeight(currentH);

      // Embed Controls
      const savedOpenBtn = frameGroup.getAttribute('data-open-website-btn');
      if (savedOpenBtn !== null) setOpenWebsiteBtn(savedOpenBtn === 'true');

      const savedAllowFs = frameGroup.getAttribute('data-allow-fullscreen');
      if (savedAllowFs !== null) setAllowFullscreen(savedAllowFs === 'true');

      const savedBehavior = frameGroup.getAttribute('data-behavior');
      if (savedBehavior) setBehavior(savedBehavior);

      // Stroke
      const sColor = frameGroup.getAttribute('data-stroke-color') || frameGroup.getAttribute('stroke') || '#000000';
      const sOp = frameGroup.getAttribute('data-stroke-opacity') || frameGroup.getAttribute('stroke-opacity');
      const sW = frameGroup.getAttribute('data-stroke-width') || frameGroup.getAttribute('stroke-width') || '1';
      const sCorner = frameGroup.getAttribute('data-line-corner') || (frameGroup.getAttribute('stroke-linecap') === 'round' ? 'Rounded' : 'Rounded');

      setStrokeColor(sColor === 'none' || sColor === 'transparent' ? '#000000' : sColor);
      setStrokeOpacity(sOp ? Math.round(parseFloat(sOp) * 100) : 100);
      setStrokeWidth(parseFloat(sW) || 1);
      setLineCorner(sCorner);

      // Corner Radius
      const tl = parseInt(frameGroup.getAttribute('data-tl') ?? frameGroup.getAttribute('rx') ?? 12, 10);
      const tr = parseInt(frameGroup.getAttribute('data-tr') ?? frameGroup.getAttribute('rx') ?? 12, 10);
      const bl = parseInt(frameGroup.getAttribute('data-bl') ?? frameGroup.getAttribute('rx') ?? 12, 10);
      const br = parseInt(frameGroup.getAttribute('data-br') ?? frameGroup.getAttribute('rx') ?? 12, 10);

      const rObj = {
        tl: isNaN(tl) ? 12 : tl,
        tr: isNaN(tr) ? 12 : tr,
        bl: isNaN(bl) ? 12 : bl,
        br: isNaN(br) ? 12 : br
      };
      setRadius(rObj);
      setIsRadiusLinked(rObj.tl === rObj.tr && rObj.tr === rObj.bl && rObj.bl === rObj.br);
    }
  }, [selectedElement]);

  // Convert embedSrc into customCode
  useEffect(() => {
    let finalSrc = embedSrc.trim();
    if (!finalSrc) {
      setCustomCode('');
      return;
    }

    if (embedVia === 'URL') {
      if (!finalSrc.startsWith('http://') && !finalSrc.startsWith('https://') && !finalSrc.startsWith('<')) {
        finalSrc = 'https://' + finalSrc;
      }
      const ytMatch = finalSrc.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (ytMatch && ytMatch[1]) {
        const srcWithFs = `https://www.youtube.com/embed/${ytMatch[1]}${allowFullscreen ? '?fs=1' : '?fs=0'}`;
        setCustomCode(`<iframe src="${srcWithFs}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ${allowFullscreen ? 'allowfullscreen' : ''}></iframe>`);
      } else {
        setCustomCode(`<iframe src="${finalSrc}" width="100%" height="100%" frameborder="0" ${allowFullscreen ? 'allowfullscreen' : ''}></iframe>`);
      }
    } else {
      // Embed Code mode
      if (finalSrc.startsWith('<')) {
        let code = finalSrc;
        if (!allowFullscreen) {
          code = code.replace(/\sallowfullscreen(="[^"]*")?/gi, '');
        } else if (!code.includes('allowfullscreen')) {
          code = code.replace(/<iframe/i, '<iframe allowfullscreen');
        }
        setCustomCode(code);
      } else {
        if (!finalSrc.startsWith('http://') && !finalSrc.startsWith('https://')) {
          finalSrc = 'https://' + finalSrc;
        }
        setCustomCode(`<iframe src="${finalSrc}" width="100%" height="100%" frameborder="0" ${allowFullscreen ? 'allowfullscreen' : ''}></iframe>`);
      }
    }
  }, [embedSrc, embedVia, allowFullscreen]);

  // Sync to DOM and Debounced History update
  useEffect(() => {
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (!frameGroup) return;

    let w = parseFloat(embedWidth) || 650;
    let h = parseFloat(embedHeight) || 400;

    const timeoutId = setTimeout(() => {
      frameGroup.setAttribute('data-url', url);
      frameGroup.setAttribute('data-custom-code', customCode);
      frameGroup.setAttribute('data-embed-type', 'embed-code');
      frameGroup.setAttribute('data-embed-via', embedVia);
      frameGroup.setAttribute('data-open-website-btn', openWebsiteBtn ? 'true' : 'false');
      frameGroup.setAttribute('data-allow-fullscreen', allowFullscreen ? 'true' : 'false');
      frameGroup.setAttribute('data-behavior', behavior);
      frameGroup.setAttribute('data-stroke-color', strokeColor);
      frameGroup.setAttribute('data-stroke-width', strokeWidth.toString());
      frameGroup.setAttribute('data-stroke-opacity', (strokeOpacity / 100).toString());
      frameGroup.setAttribute('data-line-corner', lineCorner);
      frameGroup.setAttribute('stroke-linecap', lineCorner === 'Rounded' ? 'round' : 'square');
      frameGroup.setAttribute('stroke-linejoin', lineCorner === 'Rounded' ? 'round' : 'miter');
      frameGroup.setAttribute('data-tl', radius.tl.toString());
      frameGroup.setAttribute('data-tr', radius.tr.toString());
      frameGroup.setAttribute('data-bl', radius.bl.toString());
      frameGroup.setAttribute('data-br', radius.br.toString());
      frameGroup.setAttribute('rx', radius.tl.toString());

      const strokeCol = strokeColor === 'none' ? 'transparent' : strokeColor;
      const strokeW = strokeWidth;
      const strokeOp = strokeOpacity / 100;
      const strokeCap = lineCorner === 'Rounded' ? 'round' : 'square';
      const strokeJoin = lineCorner === 'Rounded' ? 'round' : 'miter';
      const strokeAttrs = `stroke="${strokeCol}" stroke-width="${strokeW}" stroke-opacity="${strokeOp}" stroke-linecap="${strokeCap}" stroke-linejoin="${strokeJoin}"`;

      const fillColor = frameGroup.getAttribute('data-fill-color') || 'transparent';
      const fillOpacity = frameGroup.getAttribute('data-fill-opacity') || '1';
      const iframeOpacity = frameGroup.getAttribute('data-iframe-opacity') ?? frameGroup.getAttribute('opacity') ?? '1';

      const maxR = Math.min(w / 2, h / 2);
      const ctl = Math.min(Math.max(0, radius.tl), maxR);
      const ctr = Math.min(Math.max(0, radius.tr), maxR);
      const cbr = Math.min(Math.max(0, radius.br), maxR);
      const cbl = Math.min(Math.max(0, radius.bl), maxR);
      const isUniform = (ctl === ctr && ctr === cbr && cbr === cbl);
      const borderRadiusCss = `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`;
      const cornerPathD = `M ${ctl},0 L ${w - ctr},0 A ${ctr},${ctr} 0 0 1 ${w},${ctr} L ${w},${h - cbr} A ${cbr},${cbr} 0 0 1 ${w - cbr},${h} L ${cbl},${h} A ${cbl},${cbl} 0 0 1 0,${h - cbl} L 0,${ctl} A ${ctl},${ctl} 0 0 1 ${ctl},0 Z`;

      const fillLayerHtml = isUniform
        ? `<rect class="embed-fill-layer" x="0" y="0" width="${w}" height="${h}" rx="${ctl}" ry="${ctl}" fill="${fillColor}" opacity="${fillOpacity}" pointer-events="none" />`
        : `<path class="embed-fill-layer" d="${cornerPathD}" fill="${fillColor}" opacity="${fillOpacity}" pointer-events="none" />`;

      const strokeLayerHtml = isUniform
        ? `<rect class="svg-image-stroke-overlay" x="0" y="0" width="${w}" height="${h}" rx="${ctl}" ry="${ctl}" fill="transparent" pointer-events="all" ${strokeAttrs} />`
        : `<path class="svg-image-stroke-overlay" d="${cornerPathD}" fill="transparent" pointer-events="all" ${strokeAttrs} />`;

      if (customCode.trim() !== '') {
        const escapeHtml = (unsafe) => {
          return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        };
        const srcdocHtml = escapeHtml(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;width:100vw;height:100vh;overflow:hidden;border-radius:${borderRadiusCss};} video::-webkit-media-controls { zoom: 1.5; } video, iframe, img { width: 100%; height: 100%; border: none; display: block; border-radius:${borderRadiusCss}; }</style></head><body>${customCode}</body></html>`);

        frameGroup.innerHTML = `
          ${fillLayerHtml}
          <g class="embed-content-group" opacity="${iframeOpacity}" pointer-events="none">
            <foreignObject x="0" y="0" width="${w}" height="${h}" pointer-events="all" style="border-radius: ${borderRadiusCss}; overflow: hidden;">
              <iframe srcdoc="${srcdocHtml}" width="100%" height="100%" style="border:none; background:transparent; border-radius: ${borderRadiusCss};" scrolling="auto" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture${allowFullscreen ? '; fullscreen' : ''}" ${allowFullscreen ? 'allowfullscreen' : ''} allowtransparency="true"></iframe>
            </foreignObject>
          </g>
          ${strokeLayerHtml}
        `;
      } else {
        const cx = (w - 300) / 2;
        const cy = (h - 200) / 2;
        frameGroup.innerHTML = `
          ${fillLayerHtml}
          <g class="embed-content-group" opacity="${iframeOpacity}" pointer-events="none">
            <rect width="${w}" height="${h}" rx="${isUniform ? ctl : 8}" ry="${isUniform ? ctl : 8}" fill="transparent" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,6" />
            <g transform="translate(${cx}, ${cy})">
              <rect x="0" y="0" width="300" height="200" fill="#e5e7eb" rx="12" />
              <path d="M 0 12 Q 0 0 12 0 L 288 0 Q 300 0 300 12 L 300 30 L 0 30 Z" fill="#d1d5db" />
              <circle cx="20" cy="15" r="4" fill="#ffffff" opacity="0.8" />
              <circle cx="35" cy="15" r="4" fill="#ffffff" opacity="0.8" />
              <circle cx="50" cy="15" r="4" fill="#ffffff" opacity="0.8" />
              <g transform="translate(110, 60) scale(3.5)" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.7">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </g>
            </g>
          </g>
          ${strokeLayerHtml}
        `;
      }

      if (updateElementAttribute && selectedElement) {
        let node = selectedElement;
        let lastSvg = null;
        while (node) {
          if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
          node = node.parentElement;
        }
        if (lastSvg) {
          const cloneSvg = lastSvg.cloneNode(true);
          cloneSvg.querySelectorAll('[data-highlight-id], .frame-boundary').forEach(el => el.remove());
          const serializer = new XMLSerializer();
          const html = serializer.serializeToString(cloneSvg);
          updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
        }
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [
    customCode,
    embedWidth,
    embedHeight,
    strokeColor,
    strokeWidth,
    strokeOpacity,
    lineCorner,
    radius.tl,
    radius.tr,
    radius.bl,
    radius.br,
    openWebsiteBtn,
    allowFullscreen,
    behavior,
    embedVia,
    activePageIndex,
    selectedLayerId,
    updateElementAttribute
  ]);

  // Handlers for Embed Via & Textarea
  const handleEmbedViaChange = (val) => {
    setEmbedVia(val);
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (frameGroup) {
      frameGroup.setAttribute('data-embed-via', val);
    }
    if (updateElementAttribute) {
      updateElementAttribute(activePageIndex, selectedLayerId, {
        'data-embed-via': val
      });
    }
  };

  const handleSetEmbedSrc = (val) => {
    setEmbedSrc(val);
    setUrl(val);
  };

  // Handlers for Embed Controls
  const handleOpenWebsiteBtnChange = (val) => {
    setOpenWebsiteBtn(val);
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (frameGroup) {
      frameGroup.setAttribute('data-open-website-btn', val ? 'true' : 'false');
    }
    if (updateElementAttribute) {
      updateElementAttribute(activePageIndex, selectedLayerId, {
        'data-open-website-btn': val ? 'true' : 'false'
      });
    }
  };

  const handleAllowFullscreenChange = (val) => {
    setAllowFullscreen(val);
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (frameGroup) {
      frameGroup.setAttribute('data-allow-fullscreen', val ? 'true' : 'false');
      const iframe = frameGroup.querySelector('iframe');
      if (iframe) {
        if (val) {
          iframe.setAttribute('allowfullscreen', '');
        } else {
          iframe.removeAttribute('allowfullscreen');
        }
      }
    }
    if (updateElementAttribute) {
      updateElementAttribute(activePageIndex, selectedLayerId, {
        'data-allow-fullscreen': val ? 'true' : 'false'
      });
    }
  };

  const handleBehaviorChange = (val) => {
    setBehavior(val);
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (frameGroup) {
      frameGroup.setAttribute('data-behavior', val);
    }
    if (updateElementAttribute) {
      updateElementAttribute(activePageIndex, selectedLayerId, {
        'data-behavior': val
      });
    }
  };

  // Handlers for Stoke Color & Width
  const handleStrokeColorChange = (newColor) => {
    setStrokeColor(newColor);
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (frameGroup) {
      frameGroup.setAttribute('data-stroke-color', newColor);
      frameGroup.setAttribute('stroke', newColor);
      const strokeOverlay = frameGroup.querySelector('.svg-image-stroke-overlay');
      if (strokeOverlay) {
        strokeOverlay.setAttribute('stroke', newColor);
      }
    }
    if (updateElementAttribute) {
      updateElementAttribute(activePageIndex, selectedLayerId, {
        'stroke': newColor,
        'data-stroke-color': newColor
      });
    }
  };

  const handleStrokeOpacityChange = (newOpacity) => {
    setStrokeOpacity(newOpacity);
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (frameGroup) {
      frameGroup.setAttribute('data-stroke-opacity', (newOpacity / 100).toString());
      frameGroup.setAttribute('stroke-opacity', (newOpacity / 100).toString());
      const strokeOverlay = frameGroup.querySelector('.svg-image-stroke-overlay');
      if (strokeOverlay) {
        strokeOverlay.setAttribute('stroke-opacity', (newOpacity / 100).toString());
      }
    }
    if (updateElementAttribute) {
      updateElementAttribute(activePageIndex, selectedLayerId, {
        'stroke-opacity': (newOpacity / 100).toString(),
        'data-stroke-opacity': (newOpacity / 100).toString()
      });
    }
  };

  const handleStrokeWidthChange = (newWidth) => {
    const val = Math.max(0, newWidth);
    setStrokeWidth(val);
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (frameGroup) {
      frameGroup.setAttribute('data-stroke-width', val.toString());
      frameGroup.setAttribute('stroke-width', val.toString());
      const strokeOverlay = frameGroup.querySelector('.svg-image-stroke-overlay');
      if (strokeOverlay) {
        strokeOverlay.setAttribute('stroke-width', val.toString());
      }
    }
    if (updateElementAttribute) {
      updateElementAttribute(activePageIndex, selectedLayerId, {
        'stroke-width': val.toString(),
        'data-stroke-width': val.toString()
      });
    }
  };

  const handleLineCornerChange = (corner) => {
    setLineCorner(corner);
    const linecap = corner === 'Rounded' ? 'round' : 'square';
    const linejoin = corner === 'Rounded' ? 'round' : 'miter';
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (frameGroup) {
      frameGroup.setAttribute('data-line-corner', corner);
      frameGroup.setAttribute('stroke-linecap', linecap);
      frameGroup.setAttribute('stroke-linejoin', linejoin);
      const strokeOverlay = frameGroup.querySelector('.svg-image-stroke-overlay');
      if (strokeOverlay) {
        strokeOverlay.setAttribute('stroke-linecap', linecap);
        strokeOverlay.setAttribute('stroke-linejoin', linejoin);
      }
    }
    if (updateElementAttribute) {
      updateElementAttribute(activePageIndex, selectedLayerId, {
        'data-line-corner': corner,
        'stroke-linecap': linecap,
        'stroke-linejoin': linejoin
      });
    }
  };

  // Handlers for Corner Radius
  const applyCornerRadiusToDOM = (r) => {
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (!frameGroup) return;

    frameGroup.setAttribute('data-tl', r.tl.toString());
    frameGroup.setAttribute('data-tr', r.tr.toString());
    frameGroup.setAttribute('data-bl', r.bl.toString());
    frameGroup.setAttribute('data-br', r.br.toString());
    frameGroup.setAttribute('rx', r.tl.toString());

    let w = 650, h = 400;
    const rect = frameGroup.querySelector('.embed-fill-layer') || frameGroup.querySelector('.svg-image-stroke-overlay');
    if (rect) {
      if (rect.getAttribute('width')) w = parseFloat(rect.getAttribute('width')) || 650;
      if (rect.getAttribute('height')) h = parseFloat(rect.getAttribute('height')) || 400;
    }

    const maxR = Math.min(w / 2, h / 2);
    const ctl = Math.min(Math.max(0, r.tl), maxR);
    const ctr = Math.min(Math.max(0, r.tr), maxR);
    const cbr = Math.min(Math.max(0, r.br), maxR);
    const cbl = Math.min(Math.max(0, r.bl), maxR);
    const isUniform = (ctl === ctr && ctr === cbr && cbr === cbl);

    const foreignObj = frameGroup.querySelector('foreignObject');
    if (foreignObj) {
      foreignObj.style.borderRadius = `${r.tl}px ${r.tr}px ${r.br}px ${r.bl}px`;
      foreignObj.style.overflow = 'hidden';
      const iframe = foreignObj.querySelector('iframe');
      if (iframe) {
        iframe.style.borderRadius = `${r.tl}px ${r.tr}px ${r.br}px ${r.bl}px`;
      }
    }

    const cornerPathD = `M ${ctl},0 L ${w - ctr},0 A ${ctr},${ctr} 0 0 1 ${w},${ctr} L ${w},${h - cbr} A ${cbr},${cbr} 0 0 1 ${w - cbr},${h} L ${cbl},${h} A ${cbl},${cbl} 0 0 1 0,${h - cbl} L 0,${ctl} A ${ctl},${ctl} 0 0 1 ${ctl},0 Z`;

    const fillLayer = frameGroup.querySelector('.embed-fill-layer');
    if (fillLayer) {
      if (isUniform && fillLayer.tagName.toLowerCase() === 'rect') {
        fillLayer.setAttribute('rx', ctl.toString());
        fillLayer.setAttribute('ry', ctl.toString());
      } else {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        Array.from(fillLayer.attributes).forEach(a => path.setAttribute(a.name, a.value));
        path.setAttribute('d', cornerPathD);
        path.removeAttribute('rx');
        path.removeAttribute('ry');
        fillLayer.replaceWith(path);
      }
    }

    const strokeOverlay = frameGroup.querySelector('.svg-image-stroke-overlay');
    if (strokeOverlay) {
      if (isUniform && strokeOverlay.tagName.toLowerCase() === 'rect') {
        strokeOverlay.setAttribute('rx', ctl.toString());
        strokeOverlay.setAttribute('ry', ctl.toString());
      } else {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        Array.from(strokeOverlay.attributes).forEach(a => path.setAttribute(a.name, a.value));
        path.setAttribute('d', cornerPathD);
        path.removeAttribute('rx');
        path.removeAttribute('ry');
        strokeOverlay.replaceWith(path);
      }
    }

    if (updateElementAttribute) {
      updateElementAttribute(activePageIndex, selectedLayerId, {
        'data-tl': r.tl.toString(),
        'data-tr': r.tr.toString(),
        'data-bl': r.bl.toString(),
        'data-br': r.br.toString(),
        'rx': r.tl.toString()
      });
    }
  };

  const handleCornerChange = (corner, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    let newRadius;
    if (isRadiusLinked) {
      newRadius = { tl: num, tr: num, bl: num, br: num };
    } else {
      newRadius = { ...radius, [corner]: num };
    }
    setRadius(newRadius);
    applyCornerRadiusToDOM(newRadius);
  };

  const handleToggleRadiusLink = (linked) => {
    setIsRadiusLinked(linked);
    if (linked) {
      const uniform = radius.tl;
      const newRadius = { tl: uniform, tr: uniform, bl: uniform, br: uniform };
      setRadius(newRadius);
      applyCornerRadiusToDOM(newRadius);
    }
  };

  if (!selectedElementProps) return null;

  return (
    <div className="w-full flex flex-col gap-[0.6vw] font-sans text-gray-800 pt-[0.2vw] pr-[0.2vw] select-none">

      {/* ─── 1. 3RD PARTY EMBED PROPERTY ─── */}
      <SectionHeader title="3rd Party Embed Property" />

      {/* Embed Via row */}
      <PropertyRow label="Embed Via">
        <div className="flex items-center gap-[1.2vw]">
          <RadioButton
            label="URL"
            checked={embedVia === 'URL'}
            onChange={() => handleEmbedViaChange('URL')}
          />
          <RadioButton
            label="Embed Code"
            checked={embedVia === 'Embed Code'}
            onChange={() => handleEmbedViaChange('Embed Code')}
          />
        </div>
      </PropertyRow>

      <div className="flex flex-col gap-[0.25vw] pl-[0.5vw] pr-[0.2vw]">
        <span className="text-[0.7vw] text-gray-500 font-medium">
          {embedVia === 'Embed Code' ? 'Code' : 'Source URL'}
        </span>

        {embedVia === 'Embed Code' ? (
          <textarea
            placeholder="Paste HTML code here"
            value={embedSrc}
            onChange={(e) => handleSetEmbedSrc(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-[0.5vw] p-[0.6vw] text-[0.78vw] font-normal text-gray-800 placeholder-gray-400 outline-none focus:border-[#E05638] focus:ring-1 focus:ring-[#E05638] bg-white h-[5.5vw] resize-none shadow-2xs font-mono"
          />
        ) : (
          <div className="flex border border-gray-200 rounded-[0.5vw] overflow-hidden focus-within:border-[#E05638] focus-within:ring-1 focus-within:ring-[#E05638] transition-all bg-white shadow-2xs">
            <input
              type="text"
              placeholder="e.g. https://..."
              value={embedSrc}
              onChange={(e) => handleSetEmbedSrc(e.target.value)}
              className="flex-1 px-[0.6vw] py-[0.5vw] text-[0.78vw] font-normal outline-none text-gray-800 placeholder-gray-400 bg-transparent"
            />
            <button
              type="button"
              onClick={() => {
                if (embedSrc) {
                  navigator.clipboard.writeText(embedSrc.startsWith('http') ? embedSrc : 'https://' + embedSrc);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 1500);
                }
              }}
              className="px-[0.6vw] flex items-center justify-center text-gray-500 hover:text-[#E05638] transition-colors bg-gray-50 border-l border-gray-200 cursor-pointer"
              title={copiedUrl ? 'Copied!' : 'Copy Link'}
            >
              {copiedUrl ? (
                <Check className="w-[0.85vw] h-[0.85vw] text-green-600" />
              ) : (
                <Copy className="w-[0.85vw] h-[0.85vw]" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* ─── 2. EMBED CONTROLS ─── */}
      <SectionHeader title="Embed Controls" />

      {/* Open website button */}
      <div className="flex items-center justify-between pl-[0.5vw] pr-[0.2vw] h-[2.2vw]">
        <span className="text-[0.78vw] text-gray-700 font-medium whitespace-nowrap">Open website button</span>
        <ToggleSwitch
          checked={openWebsiteBtn}
          onChange={handleOpenWebsiteBtnChange}
        />
      </div>

      {/* Allow Fullscreen */}
      <div className="flex items-center justify-between pl-[0.5vw] pr-[0.2vw] h-[2.2vw]">
        <div className="flex items-center gap-[0.25vw]">
          <span className="text-[0.78vw] text-gray-700 font-medium">Allow Fullscreen</span>
          <span className="text-gray-400 text-[0.68vw] font-normal">(if available)</span>
        </div>
        <ToggleSwitch
          checked={allowFullscreen}
          onChange={handleAllowFullscreenChange}
        />
      </div>

      {/* Behavior */}
      <PropertyRow label="Behavior">
        <CustomSelect
          value={behavior}
          onChange={handleBehaviorChange}
          options={BEHAVIOR_OPTIONS}
        />
      </PropertyRow>

      {/* ─── 3. STROKE COLOR ─── */}
      <SectionHeader title="Stroke Color" />

      {/* Color row */}
      <PropertyRow label="Color">
        <ColorInput
          color={strokeColor}
          onChange={handleStrokeColorChange}
          opacity={strokeOpacity}
          onOpenPicker={() => setActiveColorPicker(activeColorPicker === 'strokeColor' ? null : 'strokeColor')}
          isActive={activeColorPicker === 'strokeColor'}
        />
      </PropertyRow>

      {/* Stroke Width */}
      <PropertyRow label="Stroke Width">
        <div className="flex items-center gap-[0.3vw] h-[2.5vw] w-full">
          <button
            type="button"
            onClick={() => handleStrokeWidthChange(Math.max(0, strokeWidth - 1))}
            className="w-[2vw] h-full flex items-center justify-center bg-gray-100 rounded-[0.4vw] text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer text-[1vw]"
          >
            -
          </button>
          <div className="flex-1 h-full bg-white border border-gray-200 rounded-[0.5vw] flex items-center justify-center shadow-2xs focus-within:border-[#E05638]">
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
            className="w-[2vw] h-full flex items-center justify-center bg-gray-100 rounded-[0.4vw] text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer text-[1vw]"
          >
            +
          </button>
        </div>
      </PropertyRow>

      {/* Line Corner */}
      <PropertyRow label="Line Corner">
        <CustomSelect
          value={lineCorner}
          onChange={handleLineCornerChange}
          options={LINE_CORNER_OPTIONS}
        />
      </PropertyRow>

      {/* ─── 4. CORNER RADIUS ─── */}
      <SectionHeader title="Corner Radius" />

      <div className="flex flex-col items-center justify-center py-[0.4vw]">
        <div className="grid grid-cols-2 gap-x-[2.2vw] gap-y-[1vw] relative">
          {/* Top Left */}
          <div className="w-[5.2vw] h-[2.5vw] border border-gray-200 rounded-tl-[1vw] rounded-tr-[0.2vw] rounded-bl-[0.2vw] rounded-br-[0.2vw] flex items-center justify-between px-[0.4vw] bg-white hover:border-gray-300 transition-colors shadow-2xs">
            <button
              type="button"
              onClick={() => handleCornerChange('tl', Math.max(0, radius.tl - 1))}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size="0.85vw" />
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
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronRight size="0.85vw" />
            </button>
          </div>

          {/* Top Right */}
          <div className="w-[5.2vw] h-[2.5vw] border border-gray-200 rounded-tr-[1vw] rounded-tl-[0.2vw] rounded-bl-[0.2vw] rounded-br-[0.2vw] flex items-center justify-between px-[0.4vw] bg-white hover:border-gray-300 transition-colors shadow-2xs">
            <button
              type="button"
              onClick={() => handleCornerChange('tr', Math.max(0, radius.tr - 1))}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size="0.85vw" />
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
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronRight size="0.85vw" />
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
          <div className="w-[5.2vw] h-[2.5vw] border border-gray-200 rounded-bl-[1vw] rounded-tl-[0.2vw] rounded-tr-[0.2vw] rounded-br-[0.2vw] flex items-center justify-between px-[0.4vw] bg-white hover:border-gray-300 transition-colors shadow-2xs">
            <button
              type="button"
              onClick={() => handleCornerChange('bl', Math.max(0, radius.bl - 1))}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size="0.85vw" />
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
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronRight size="0.85vw" />
            </button>
          </div>

          {/* Bottom Right */}
          <div className="w-[5.2vw] h-[2.5vw] border border-gray-200 rounded-br-[1vw] rounded-tl-[0.2vw] rounded-tr-[0.2vw] rounded-bl-[0.2vw] flex items-center justify-between px-[0.4vw] bg-white hover:border-gray-300 transition-colors shadow-2xs">
            <button
              type="button"
              onClick={() => handleCornerChange('br', Math.max(0, radius.br - 1))}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size="0.85vw" />
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
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ChevronRight size="0.85vw" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 5. EFFECTS ─── */}
      <SectionHeader title="Effects" />

      <div>
        <Effect
          isShape={false}
          openSubSection={openSection}
          setOpenSubSection={setOpenSection}
          activeEffects={activeEffects}
          setActiveEffects={handleSetActiveEffects}
          effectSettings={effectSettings}
          setEffectSettings={handleSetEffectSettings}
          activeColorPicker={activeColorPicker}
          setActiveColorPicker={setActiveColorPicker}
          showDetailedPicker={showDetailedPicker}
          setShowDetailedPicker={setShowDetailedPicker}
          hideBlur={true}
          hideInnerShadow={true}
          hideHeader={true}
        />
      </div>

      {/* ─── PORTALS ─── */}
      {/* Official ColorPicker Portal Popup (Positioned alongside RightSidebar) */}
      {activeColorPicker === 'strokeColor' && createPortal(
        <div
          className="fixed z-[5000]"
          style={{
            top: '50%',
            right: '19.5vw',
            transform: 'translateY(-50%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <ColorPicker
              color={strokeColor}
              opacity={strokeOpacity}
              onOpacityChange={handleStrokeOpacityChange}
              onChange={handleStrokeColorChange}
              onClose={() => setActiveColorPicker(null)}
              disableGradient={false}
              colorsOnPage={colorsOnPageList}
            />
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default ThirdPartyEmbedProperties;
