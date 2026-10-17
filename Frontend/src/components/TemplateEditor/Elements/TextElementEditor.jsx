import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Sliders, Type, AlignLeft } from 'lucide-react';
import ColorPicker from '../ColorPicker';
import { KINETIC_ANIMATION_KEYFRAMES, calculateKineticDimensions, cleanKeyframesFromCss } from './kineticTypographyUtils';

const PropertySlider = ({ label, value, onChange, min = 0, max = 100, step = 1, unit = '', disabled = false }) => {
  const [localVal, setLocalVal] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  if (value !== prevValue && !isFocused) {
    setPrevValue(value);
    setLocalVal(value);
  }

  const handleManualInput = (val) => {
    if (disabled) return;
    setLocalVal(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange(val);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (disabled) return;
    let num = parseFloat(localVal);
    if (isNaN(num)) num = min;

    const corrected = Math.min(Math.max(num, min), max);
    setLocalVal(corrected);
    setPrevValue(corrected.toString());
    onChange(corrected.toString());
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const numericVal = parseFloat(value) || 0;
  const percentage = Math.max(0, Math.min(100, ((numericVal - min) / (max - min)) * 100));

  return (
    <div className={`flex items-center gap-[1vw] py-[0.4vw] transition-opacity duration-200 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <span className="text-[0.8vw] font-semibold text-gray-600 w-[7vw] flex-shrink-0 select-none">
        {label} :
      </span>
      <div className="flex-1 min-w-0 flex items-center gap-[1vw]">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numericVal}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 h-[0.25vw] appearance-none cursor-pointer bg-gray-200 rounded-full outline-none disabled:cursor-not-allowed"
          style={{
            background: disabled
              ? '#e5e7eb'
              : `linear-gradient(to right, #6366f1 0%, #6366f1 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
          }}
        />
        <div className="w-[3.8vw] flex-shrink-0 h-[1.8vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.4vw] shadow-sm overflow-hidden px-[0.2vw]">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={localVal === undefined ? '' : localVal}
            onChange={(e) => handleManualInput(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className="w-full min-w-0 text-center text-[0.8vw] text-gray-700 font-semibold outline-none bg-transparent no-spin disabled:text-gray-400"
          />
          {unit && <span className="text-[0.65vw] text-gray-400 font-medium select-none">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

const fontFamilies = [
  'Inter', 'Poppins', 'Roboto', 'Bangers', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Open Sans', 'Lato', 'Montserrat',
  'Playfair Display', 'Oswald', 'Merriweather',
  'Public Sans', 'Lora', 'Cabin', 'Satisfy'
];

const fontWeights = [
  { name: 'Thin', value: '100' },
  { name: 'Light', value: '300' },
  { name: 'Regular', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi Bold', value: '600' },
  { name: 'Bold', value: '700' },
  { name: 'Extra Bold', value: '800' },
  { name: 'Black', value: '900' }
];

const fontSizes = [14, 16, 18, 20, 24, 28, 32, 34, 36, 40, 48, 50, 56, 64, 72, 84, 96];

const ANIMATION_PRESETS = [
  { id: 'none', name: 'None (Static)' },
  { id: 'slide-up', name: 'Kinetic Slide Up (Staggered)' },
  { id: 'slide-down', name: 'Kinetic Slide Down (Staggered)' },
  { id: 'pop-bounce', name: 'Kinetic Pop & Bounce' },
  { id: 'wave-float', name: 'Harmonic Wave Flow' },
  { id: 'pulse-glow', name: 'Cyber Neon Pulse' },
  { id: 'flip-3d', name: '3D Flip Perspective' }
];

const SectionHeader = ({ title, icon }) => (
  <div className="flex items-center gap-[0.75vw] mb-[0.5vw]">
    {icon && <span className="text-indigo-600">{icon}</span>}
    <h2 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">{title}</h2>
    <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
  </div>
);

const toHexColor = (colorStr, fallback = '#000000') => {
  if (!colorStr) return fallback;
  const str = colorStr.trim();
  if (str === 'transparent' || str === 'none') return 'transparent';
  if (str.startsWith('#')) {
    if (str.length === 4) {
      return `#${str[1]}${str[1]}${str[2]}${str[2]}${str[3]}${str[3]}`.toUpperCase();
    }
    return str.substring(0, 7).toUpperCase();
  }
  const rgbMatch = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)));
    return ("#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)).toUpperCase();
  }
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = str;
    const computed = ctx.fillStyle;
    if (computed && computed.startsWith('#')) return computed.toUpperCase();
  } catch {
    // Fallback if canvas context is unavailable or cannot parse color
  }
  return str.startsWith('#') ? str.toUpperCase() : fallback;
};

const extractElementProperties = (selectedElement, selectedTextId) => {
  if (!selectedElement) {
    return {
      strokeWidth: 0,
      strokeColor: '#000000',
      textColor: '#FFFFFF',
      bgColor: 'transparent',
      bgRadius: 8,
      bgPadding: 12,
      shadowX: 0,
      shadowY: 0,
      skewAngle: 0,
      fontFamily: 'Inter',
      fontWeight: '800',
      fontSize: 36,
      animationStyle: 'none',
      animationDuration: 3800,
      animationStagger: 50,
      isKinetic: false,
      kineticText: ''
    };
  }

  const style = selectedElement.getAttribute('style') || '';
  const strokeMatch = style.match(/--stroke-width:\s*([^;]+)/);
  const strokeWidth = strokeMatch ? parseFloat(strokeMatch[1]) : (parseFloat(selectedElement.getAttribute('data-stroke-width')) || 0);

  const shadowXMatch = style.match(/--shadow-x:\s*([^px;]+)/);
  const shadowX = shadowXMatch ? parseFloat(shadowXMatch[1]) : (parseFloat(selectedElement.getAttribute('data-shadow-x')) || 0);

  const shadowYMatch = style.match(/--shadow-y:\s*([^px;]+)/);
  const shadowY = shadowYMatch ? parseFloat(shadowYMatch[1]) : (parseFloat(selectedElement.getAttribute('data-shadow-y')) || 0);

  const skewMatch = style.match(/--skew-angle:\s*([^deg;]+)/);
  const skewAngle = skewMatch ? parseFloat(skewMatch[1]) : (parseFloat(selectedElement.getAttribute('data-skew-angle')) || 0);

  const animStyleAttr = selectedElement.getAttribute('data-animation-style');
  const hasKineticClass = selectedElement.getAttribute('data-typography-type') === 'kinetic' ||
    !!selectedElement.querySelector('.kinetic-container, .word, .slide');
  const isKinetic = hasKineticClass;
  const animationStyle = animStyleAttr || (hasKineticClass ? 'slide-up' : 'none');

  const durationAttr = selectedElement.getAttribute('data-animation-duration');
  const animationDuration = durationAttr ? (parseInt(durationAttr, 10) || 3800) : 3800;

  const staggerAttr = selectedElement.getAttribute('data-animation-stagger');
  const animationStagger = staggerAttr ? (parseInt(staggerAttr, 10) || 50) : 50;

  let rawBgColor = selectedElement.getAttribute('data-bg-color') || '';
  let bgRadius = parseInt(selectedElement.getAttribute('data-bg-radius'), 10) || 8;
  let bgPadding = parseInt(selectedElement.getAttribute('data-bg-padding'), 10) || 12;

  const kineticContainer = selectedElement.querySelector('.kinetic-container');
  if (kineticContainer) {
    if (kineticContainer.style.backgroundColor && kineticContainer.style.backgroundColor !== 'transparent') {
      rawBgColor = kineticContainer.style.backgroundColor;
    }
    if (kineticContainer.style.borderRadius) {
      bgRadius = parseInt(kineticContainer.style.borderRadius, 10) || 8;
    }
    if (kineticContainer.style.padding) {
      bgPadding = parseInt(kineticContainer.style.padding, 10) || 12;
    }
  } else {
    const bgRect = selectedElement.querySelector('rect.typography-bg');
    if (bgRect) {
      rawBgColor = bgRect.getAttribute('fill') || rawBgColor;
      bgRadius = parseInt(bgRect.getAttribute('rx'), 10) || 8;
    }
  }
  const bgColor = toHexColor(rawBgColor, 'transparent');

  let kineticText = selectedElement.getAttribute('data-kinetic-text') || '';
  if (!kineticText && hasKineticClass) {
    const wordEls = Array.from(selectedElement.querySelectorAll('.word'));
    if (wordEls.length > 0) {
      const lines = wordEls.map(w => {
        const charNodes = Array.from(w.querySelectorAll('.char, .slide'));
        if (charNodes.length > 0) {
          return charNodes.map(c => (c.textContent || '').replace(/\u00a0/g, ' ')).join('');
        }
        return (w.textContent || '').replace(/\u00a0/g, ' ').trim();
      }).filter(Boolean);
      kineticText = lines.join('\n');
    }
  }

  let targetText = null;
  if (selectedTextId) {
    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    targetText = editorDoc.getElementById(selectedTextId);
  }
  if (!targetText) targetText = selectedElement.querySelector('text, foreignobject');

  // Font Family extraction
  let fontFamily = selectedElement.getAttribute('data-font-family') || '';
  if (!fontFamily && kineticContainer && kineticContainer.style.fontFamily) {
    fontFamily = kineticContainer.style.fontFamily;
  }
  if (!fontFamily && targetText) {
    const innerDiv = targetText.querySelector('div');
    const styleSource = innerDiv || targetText;
    fontFamily = styleSource.style.fontFamily || targetText.getAttribute('font-family') || '';
  }
  if (!fontFamily) {
    const styleTag = selectedElement.querySelector('style');
    const ffMatch = styleTag?.textContent?.match(/font-family:\s*['"]?([^,'";}\n]+)/i);
    if (ffMatch) fontFamily = ffMatch[1];
  }
  fontFamily = (fontFamily || 'Inter').replace(/['"]/g, '').split(',')[0].trim();

  // Font Weight extraction
  let fontWeight = selectedElement.getAttribute('data-font-weight') || '';
  if (!fontWeight && kineticContainer && kineticContainer.style.fontWeight) {
    fontWeight = kineticContainer.style.fontWeight;
  }
  if (!fontWeight && targetText) {
    const innerDiv = targetText.querySelector('div');
    const styleSource = innerDiv || targetText;
    fontWeight = styleSource.style.fontWeight || targetText.getAttribute('font-weight') || '';
  }
  if (!fontWeight) {
    const styleTag = selectedElement.querySelector('style');
    const fwMatch = styleTag?.textContent?.match(/font-weight:\s*([^;}\s]+)/i);
    if (fwMatch) fontWeight = fwMatch[1];
  }
  fontWeight = fontWeight || '800';

  // Font Size extraction
  let fontSize = parseInt(selectedElement.getAttribute('data-font-size'), 10) || 0;
  if (!fontSize && kineticContainer && kineticContainer.style.fontSize) {
    fontSize = parseInt(kineticContainer.style.fontSize, 10) || 0;
  }
  if (!fontSize && targetText) {
    const innerDiv = targetText.querySelector('div');
    const styleSource = innerDiv || targetText;
    fontSize = parseInt(styleSource.style.fontSize || targetText.getAttribute('font-size'), 10) || 0;
  }
  if (!fontSize) {
    const styleTag = selectedElement.querySelector('style');
    const fsMatch = styleTag?.textContent?.match(/font-size:\s*(\d+)px/i);
    if (fsMatch) fontSize = parseInt(fsMatch[1], 10) || 0;
  }
  if (!fontSize) fontSize = 36;

  // Text Color extraction
  let rawTextColor = selectedElement.getAttribute('data-text-color') || '';
  const spanWithColor = selectedElement.querySelector('span.slide, span.char');
  if (!rawTextColor && spanWithColor) {
    rawTextColor = spanWithColor.style.color || spanWithColor.style.webkitTextFillColor || '';
  }
  if (!rawTextColor && kineticContainer && kineticContainer.style.color) {
    rawTextColor = kineticContainer.style.color;
  }
  if (!rawTextColor) {
    const styleTag = selectedElement.querySelector('style');
    const spanColorMatch = styleTag?.textContent?.match(/span\.(?:slide|char)[^{]*\{[^}]*color:\s*([^;}\s]+)/i) ||
      styleTag?.textContent?.match(/span\.(?:slide|char)[^{]*\{[^}]*-webkit-text-fill-color:\s*([^;}\s]+)/i) ||
      styleTag?.textContent?.match(/color:\s*([^;}\s]+)/i);
    if (spanColorMatch) {
      rawTextColor = spanColorMatch[1].trim();
    }
  }
  if (!rawTextColor && targetText) {
    const innerDiv = targetText.querySelector('div');
    const styleSource = innerDiv || targetText;
    rawTextColor = styleSource.style.color || targetText.getAttribute('fill') || targetText.style.fill || '';
  }
  if (!rawTextColor && spanWithColor && typeof window !== 'undefined' && window.getComputedStyle) {
    try {
      const compColor = window.getComputedStyle(spanWithColor).color;
      if (compColor) rawTextColor = compColor;
    } catch {
      // Fallback if computed style cannot be resolved
    }
  }
  const textColor = toHexColor(rawTextColor, '#FFFFFF');

  // Stroke Color extraction
  let rawStrokeColor = '';
  const strokeColorMatch = style.match(/--stroke-color:\s*([^;]+)/);
  if (strokeColorMatch) {
    rawStrokeColor = strokeColorMatch[1].trim();
  } else if (selectedElement.getAttribute('data-stroke-color')) {
    rawStrokeColor = selectedElement.getAttribute('data-stroke-color');
  } else if (spanWithColor && spanWithColor.style.webkitTextStrokeColor) {
    rawStrokeColor = spanWithColor.style.webkitTextStrokeColor;
  } else if (targetText) {
    rawStrokeColor = targetText.getAttribute('stroke') || '';
  }
  const strokeColor = toHexColor(rawStrokeColor, '#000000');

  return {
    strokeWidth,
    strokeColor,
    textColor,
    bgColor,
    bgRadius,
    bgPadding,
    shadowX,
    shadowY,
    skewAngle,
    fontFamily,
    fontWeight,
    fontSize,
    animationStyle,
    animationDuration,
    animationStagger,
    isKinetic,
    kineticText
  };
};

const TextElementEditor = ({ selectedElement, updateElementAttribute, selectedLayerId, selectedTextId }) => {
  const currentKey = `${selectedLayerId}-${selectedTextId}`;
  const [loadedSelectionKey, setLoadedSelectionKey] = useState(null);

  const [strokeWidth, setStrokeWidth] = useState(0);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('transparent');
  const [bgRadius, setBgRadius] = useState(8);
  const [bgPadding, setBgPadding] = useState(12);

  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [shadowX, setShadowX] = useState(0);
  const [shadowY, setShadowY] = useState(0);
  const [skewAngle, setSkewAngle] = useState(0);
  
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontWeight, setFontWeight] = useState('800');
  const [fontSize, setFontSize] = useState(36);

  // Kinetic & Animation States
  const [animationStyle, setAnimationStyle] = useState('none');
  const [animationDuration, setAnimationDuration] = useState(3800);
  const [animationStagger, setAnimationStagger] = useState(50);
  const [isKinetic, setIsKinetic] = useState(false);
  const [kineticText, setKineticText] = useState('');

  // Synchronize state during render when selected element changes
  if (selectedElement && loadedSelectionKey !== currentKey) {
    setLoadedSelectionKey(currentKey);
    const props = extractElementProperties(selectedElement, selectedTextId);
    setStrokeWidth(props.strokeWidth);
    setStrokeColor(props.strokeColor);
    setTextColor(props.textColor);
    setBgColor(props.bgColor);
    setBgRadius(props.bgRadius);
    setBgPadding(props.bgPadding);
    setShadowX(props.shadowX);
    setShadowY(props.shadowY);
    setSkewAngle(props.skewAngle);
    setFontFamily(props.fontFamily);
    setFontWeight(props.fontWeight);
    setFontSize(props.fontSize);
    setAnimationStyle(props.animationStyle);
    setAnimationDuration(props.animationDuration);
    setAnimationStagger(props.animationStagger);
    setIsKinetic(props.isKinetic);
    setKineticText(props.kineticText);

    // Auto-fit oversized/legacy kinetic elements and keep snug inside page
    if (props.isKinetic) {
      const fo = selectedElement.querySelector('foreignObject');
      if (fo) {
        const curW = parseFloat(fo.getAttribute('width') || '0');
        const lines = props.kineticText.split('\n').filter(Boolean);
        const snug = calculateKineticDimensions(lines, props.fontSize, props.bgPadding);
        let modified = false;
        if (curW >= 300 && snug.width < curW - 20) {
          fo.setAttribute('width', snug.width.toString());
          fo.setAttribute('height', snug.height.toString());
          modified = true;
        }

        // If placed outside page or at (0, 0), center inside page
        const tf = selectedElement.getAttribute('transform') || '';
        if (!tf || tf === 'translate(0, 0)' || tf === 'translate(0,0)') {
          const svgEl = selectedElement.ownerSVGElement || selectedElement.closest?.('svg');
          if (svgEl) {
            const vb = svgEl.getAttribute('viewBox');
            if (vb) {
              const parts = vb.trim().split(/[\s,]+/).map(parseFloat);
              if (parts.length === 4) {
                const pw = parts[2], ph = parts[3];
                const finalW = parseFloat(fo.getAttribute('width') || snug.width.toString());
                const finalH = parseFloat(fo.getAttribute('height') || snug.height.toString());
                const cx = Math.round(Math.max(10, Math.min(pw - finalW - 10, (pw - finalW) / 2)));
                const cy = Math.round(Math.max(10, Math.min(ph - finalH - 10, (ph - finalH) / 2)));
                selectedElement.setAttribute('transform', `translate(${cx}, ${cy})`);
                modified = true;
              }
            }
          }
        }
        if (modified) {
          setTimeout(() => {
            if (updateElementAttribute && selectedLayerId) {
              const attrs = {};
              Array.from(selectedElement.attributes).forEach(attr => {
                attrs[attr.name] = attr.value;
              });
              attrs['innerHTML'] = selectedElement.innerHTML;
              updateElementAttribute(selectedLayerId, attrs);
            }
          }, 0);
        }
      }
    }
  }

  const handleUpdate = (attr, val) => {
    if (!selectedElement) return;
    
    const currentStyle = selectedElement.getAttribute('style') || '';
    let newStyle = currentStyle;
    
    const regex = new RegExp(`--${attr}:\\s*[^;]+;?`, 'g');
    
    let cssVal = val;
    if (attr === 'shadow-x' || attr === 'shadow-y' || attr === 'stroke-width') {
      cssVal = `${val}px`;
    } else if (attr === 'skew-angle') {
      cssVal = `${val}deg`;
    }

    if (regex.test(newStyle)) {
      newStyle = newStyle.replace(regex, `--${attr}: ${cssVal};`);
    } else {
      newStyle += ` --${attr}: ${cssVal};`;
    }

    selectedElement.setAttribute('style', newStyle);
    if (selectedElement.style && typeof selectedElement.style.setProperty === 'function') {
      selectedElement.style.setProperty(`--${attr}`, cssVal);
    }

    if (attr === 'stroke-width') {
      const spans = Array.from(selectedElement.querySelectorAll('span.slide, span.char'));
      spans.forEach(s => {
        s.style.webkitTextStrokeWidth = `${val}px`;
      });
      const texts = selectedElement.querySelectorAll('text');
      texts.forEach(t => t.setAttribute('stroke-width', val));
    } else if (attr === 'stroke-color') {
      const spans = Array.from(selectedElement.querySelectorAll('span.slide, span.char'));
      spans.forEach(s => {
        s.style.webkitTextStrokeColor = val;
      });
      const texts = selectedElement.querySelectorAll('text');
      texts.forEach(t => t.setAttribute('stroke', val));
    } else if (attr === 'shadow-x' || attr === 'shadow-y') {
      const spans = Array.from(selectedElement.querySelectorAll('span.slide, span.char'));
      const sx = attr === 'shadow-x' ? `${val}px` : `${shadowX}px`;
      const sy = attr === 'shadow-y' ? `${val}px` : `${shadowY}px`;
      spans.forEach(s => {
        s.style.filter = `drop-shadow(${sx} ${sy} 0px rgba(0,0,0,0.5))`;
      });
    } else if (attr === 'skew-angle') {
      const spans = Array.from(selectedElement.querySelectorAll('span.slide, span.char'));
      spans.forEach(s => {
        s.style.setProperty('--skew-angle', `${val}deg`);
        s.style.transform = `skewX(${val}deg)`;
      });
    }

    syncDOM();
  };

  const syncDOM = () => {
    if (!selectedElement) return;
    if (updateElementAttribute && selectedLayerId) {
      const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
      const svgRoot = selectedElement.ownerSVGElement || selectedElement.closest?.('svg') || editorDoc.querySelector('svg');
      if (svgRoot) {
        const serializer = new XMLSerializer();
        const html = serializer.serializeToString(svgRoot);
        updateElementAttribute(selectedLayerId, '__dom_sync__', html);
      } else {
        const attrs = {};
        Array.from(selectedElement.attributes).forEach(attr => {
          attrs[attr.name] = attr.value;
        });
        updateElementAttribute(selectedLayerId, attrs);
      }
    }
  };

  const getTargetTexts = () => {
    if (selectedTextId) {
      const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
      const t = editorDoc.getElementById(selectedTextId);
      if (t) return [t];
    }
    return Array.from(selectedElement.querySelectorAll('text, foreignobject'));
  };

  const handleFontFamilyChange = (e) => {
    const val = e.target.value;
    setFontFamily(val);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-font-family', val);

    const texts = getTargetTexts();
    texts.forEach(text => {
      text.style.fontFamily = `'${val}', sans-serif`;
      text.setAttribute('font-family', val);
      const div = text.querySelector('div');
      if (div) {
        div.style.fontFamily = `'${val}', sans-serif`;
      }
    });

    const spans = Array.from(selectedElement.querySelectorAll('span.slide, span.char'));
    spans.forEach(span => {
      span.style.fontFamily = `'${val}', sans-serif`;
    });

    const kineticContainer = selectedElement.querySelector('.kinetic-container');
    if (kineticContainer) {
      kineticContainer.style.fontFamily = `'${val}', sans-serif`;
    }

    const styleTag = selectedElement.querySelector('style');
    if (styleTag) {
      const currentCss = styleTag.innerHTML;
      if (!currentCss.includes(`family=${val.replace(/ /g, '+')}`)) {
        styleTag.innerHTML = `@import url('https://fonts.googleapis.com/css2?family=${val.replace(/ /g, '+')}:wght@400;700;800;900&display=swap');\n` + currentCss;
      }
    }

    // Auto-resize foreignObject if needed
    const fo = selectedElement.querySelector('foreignObject');
    if (fo && isKinetic) {
      const lines = kineticText.split('\n').filter(Boolean);
      const dims = calculateKineticDimensions(lines, fontSize, bgPadding);
      fo.setAttribute('width', dims.width.toString());
      fo.setAttribute('height', dims.height.toString());
    }

    syncDOM();
  };

  const handleFontWeightChange = (e) => {
    const val = e.target.value;
    setFontWeight(val);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-font-weight', val);

    const texts = getTargetTexts();
    texts.forEach(text => {
      text.setAttribute('font-weight', val);
      text.style.fontWeight = val;
      const div = text.querySelector('div');
      if (div) div.style.fontWeight = val;
    });

    const spans = Array.from(selectedElement.querySelectorAll('span.slide, span.char'));
    spans.forEach(span => {
      span.style.fontWeight = val;
    });

    const kineticContainer = selectedElement.querySelector('.kinetic-container');
    if (kineticContainer) {
      kineticContainer.style.fontWeight = val;
    }

    syncDOM();
  };

  const handleFontSizeChange = (e) => {
    const val = parseInt(e.target.value, 10) || 36;
    setFontSize(val);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-font-size', val.toString());

    const texts = getTargetTexts();
    texts.forEach(text => {
      text.setAttribute('font-size', val);
      text.style.fontSize = `${val}px`;
      const div = text.querySelector('div');
      if (div) div.style.fontSize = `${val}px`;
    });

    const spans = Array.from(selectedElement.querySelectorAll('span.slide, span.char'));
    spans.forEach(span => {
      span.style.fontSize = `${val}px`;
    });

    const kineticContainer = selectedElement.querySelector('.kinetic-container');
    if (kineticContainer) {
      kineticContainer.style.fontSize = `${val}px`;
    }

    // Auto resize foreignObject wrapper to prevent overflow and keep snug
    const fo = selectedElement.querySelector('foreignObject');
    if (fo && isKinetic) {
      const lines = kineticText.split('\n').filter(Boolean);
      const dims = calculateKineticDimensions(lines, val, bgPadding);
      fo.setAttribute('width', dims.width.toString());
      fo.setAttribute('height', dims.height.toString());
    }

    syncDOM();
  };

  const handleTextColorChange = (val) => {
    const hex = toHexColor(val, '#FFFFFF');
    setTextColor(hex);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-text-color', hex);

    const texts = getTargetTexts();
    texts.forEach(text => {
      text.setAttribute('fill', hex);
      text.style.fill = hex;
      text.style.color = hex;
      const div = text.querySelector('div');
      if (div) {
        div.style.color = hex;
      }
    });

    const spans = Array.from(selectedElement.querySelectorAll('span.slide, span.char'));
    spans.forEach(span => {
      span.style.color = hex;
      span.style.webkitTextFillColor = hex;
    });

    const kineticContainer = selectedElement.querySelector('.kinetic-container');
    if (kineticContainer) {
      kineticContainer.style.color = hex;
    }

    const styleTag = selectedElement.querySelector('style');
    if (styleTag) {
      let css = styleTag.innerHTML;
      css = css.replace(/color:\s*[^;]+;/g, `color: ${hex};`);
      css = css.replace(/-webkit-text-fill-color:\s*[^;]+;/g, `-webkit-text-fill-color: ${hex};`);
      styleTag.innerHTML = css;
    }

    syncDOM();
  };

  const handleOutlineColorChange = (val) => {
    const hex = toHexColor(val, '#000000');
    setStrokeColor(hex);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-stroke-color', hex);
    handleUpdate('stroke-color', hex);

    const texts = getTargetTexts();
    texts.forEach(text => {
      text.setAttribute('stroke', hex);
      const div = text.querySelector('div');
      if (div) {
        div.style.webkitTextStrokeColor = hex;
      }
    });

    const spans = Array.from(selectedElement.querySelectorAll('span.slide, span.char'));
    spans.forEach(span => {
      span.style.webkitTextStrokeColor = hex;
    });

    syncDOM();
  };

  const handleBgColorChange = (val) => {
    const hex = toHexColor(val, 'transparent');
    setBgColor(hex);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-bg-color', hex);

    const kineticContainer = selectedElement.querySelector('.kinetic-container');
    if (kineticContainer) {
      kineticContainer.style.backgroundColor = hex;
      kineticContainer.style.borderRadius = `${bgRadius}px`;
      kineticContainer.style.padding = `${bgPadding}px`;
    } else {
      let bgRect = selectedElement.querySelector('rect.typography-bg');
      if (hex && hex !== 'transparent' && hex !== 'none') {
        if (!bgRect) {
          bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bgRect.setAttribute('class', 'typography-bg');
          selectedElement.insertBefore(bgRect, selectedElement.firstChild);
        }
        bgRect.setAttribute('fill', hex);
        bgRect.setAttribute('rx', bgRadius.toString());
        bgRect.setAttribute('ry', bgRadius.toString());

        const texts = Array.from(selectedElement.querySelectorAll('text'));
        if (texts.length > 0) {
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;
          texts.forEach(t => {
            const tx = parseFloat(t.getAttribute('x') || 0);
            const ty = parseFloat(t.getAttribute('y') || 0);
            const fs = parseFloat(t.getAttribute('font-size') || 40);
            const len = (t.textContent || '').length;
            const approxWidth = len * (fs * 0.62);
            minX = Math.min(minX, tx);
            minY = Math.min(minY, ty - fs);
            maxX = Math.max(maxX, tx + approxWidth);
            maxY = Math.max(maxY, ty + (fs * 0.25));
          });
          const pad = bgPadding;
          bgRect.setAttribute('x', Math.max(0, minX - pad).toString());
          bgRect.setAttribute('y', Math.max(0, minY - pad).toString());
          bgRect.setAttribute('width', (maxX - minX + (pad * 2)).toString());
          bgRect.setAttribute('height', (maxY - minY + (pad * 2)).toString());
        }
      } else if (bgRect) {
        bgRect.remove();
      }
    }

    syncDOM();
  };

  const handleBgRadiusChange = (val) => {
    const num = parseInt(val, 10) || 0;
    setBgRadius(num);
    if (!selectedElement) return;
    selectedElement.setAttribute('data-bg-radius', num.toString());

    const kineticContainer = selectedElement.querySelector('.kinetic-container');
    if (kineticContainer) {
      kineticContainer.style.borderRadius = `${num}px`;
    }
    const bgRect = selectedElement.querySelector('rect.typography-bg');
    if (bgRect) {
      bgRect.setAttribute('rx', num.toString());
      bgRect.setAttribute('ry', num.toString());
    }
    syncDOM();
  };

  const handleBgPaddingChange = (val) => {
    const num = parseInt(val, 10) || 0;
    setBgPadding(num);
    if (!selectedElement) return;
    selectedElement.setAttribute('data-bg-padding', num.toString());

    const kineticContainer = selectedElement.querySelector('.kinetic-container');
    if (kineticContainer) {
      kineticContainer.style.padding = `${num}px`;
    }
    const fo = selectedElement.querySelector('foreignObject');
    if (fo && isKinetic) {
      const lines = kineticText.split('\n').filter(Boolean);
      const dims = calculateKineticDimensions(lines, fontSize, num);
      fo.setAttribute('width', dims.width.toString());
      fo.setAttribute('height', dims.height.toString());
    }
    const bgRect = selectedElement.querySelector('rect.typography-bg');
    if (bgRect) {
      const texts = Array.from(selectedElement.querySelectorAll('text'));
      if (texts.length > 0) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        texts.forEach(t => {
          const tx = parseFloat(t.getAttribute('x') || 0);
          const ty = parseFloat(t.getAttribute('y') || 0);
          const fs = parseFloat(t.getAttribute('font-size') || 40);
          const len = (t.textContent || '').length;
          const approxWidth = len * (fs * 0.62);
          minX = Math.min(minX, tx);
          minY = Math.min(minY, ty - fs);
          maxX = Math.max(maxX, tx + approxWidth);
          maxY = Math.max(maxY, ty + (fs * 0.25));
        });
        bgRect.setAttribute('x', Math.max(0, minX - num).toString());
        bgRect.setAttribute('y', Math.max(0, minY - num).toString());
        bgRect.setAttribute('width', (maxX - minX + (num * 2)).toString());
        bgRect.setAttribute('height', (maxY - minY + (num * 2)).toString());
      }
    }
    syncDOM();
  };

  // Animation updates
  const handleAnimationChange = (newAnim) => {
    setAnimationStyle(newAnim);
    applyAnimationRules(newAnim, animationDuration, animationStagger);
  };

  const handleDurationChange = (newDurVal) => {
    const durNum = parseInt(newDurVal, 10) || 3800;
    setAnimationDuration(durNum);
    applyAnimationRules(animationStyle, durNum, animationStagger);
  };

  const handleStaggerChange = (newStaggerVal) => {
    const stagNum = parseInt(newStaggerVal, 10) || 50;
    setAnimationStagger(stagNum);
    applyAnimationRules(animationStyle, animationDuration, stagNum);
  };

  const applyAnimationRules = (animType, durMs, stagMs) => {
    if (!selectedElement) return;

    selectedElement.setAttribute('data-animation-style', animType);
    selectedElement.setAttribute('data-animation-duration', durMs.toString());
    selectedElement.setAttribute('data-animation-stagger', stagMs.toString());

    const uniqueId = selectedElement.id.replace('typography-', '') || Date.now();
    let styleTag = selectedElement.querySelector('style');
    if (!styleTag) {
      styleTag = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      selectedElement.insertBefore(styleTag, selectedElement.firstChild);
    }

    let css = cleanKeyframesFromCss(styleTag.innerHTML || '');

    const timingFn = (animType === 'wave-float') ? 'ease-in-out' : 'cubic-bezier(0.77, 0, 0.175, 1)';
    const newAnimValue = animType === 'none' ? 'none' : `kinetic-anim-${uniqueId} ${durMs}ms infinite ${timingFn}`;

    if (animType !== 'none') {
      const rawKeyframe = KINETIC_ANIMATION_KEYFRAMES[animType] || KINETIC_ANIMATION_KEYFRAMES['slide-up'];
      const scopedKeyframe = rawKeyframe.replace(/@keyframes kinetic-anim/g, `@keyframes kinetic-anim-${uniqueId}`);
      css += `\n${scopedKeyframe}\n`;
    }

    if (isKinetic) {
      if (/animation:\s*[^;]+;/i.test(css)) {
        css = css.replace(/animation:\s*[^;]+;/i, `animation: ${newAnimValue};`);
      } else {
        css = css.replace(/(span\.char[^{]*\{)/i, `$1\n          animation: ${newAnimValue};`);
      }
    } else {
      const textSelector = `#${selectedElement.id} text, #${selectedElement.id} div`;
      css = css.replace(new RegExp(`${textSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{[^}]*\\}`, 'g'), '');
      if (animType !== 'none') {
        css += `\n${textSelector} { animation: kinetic-anim-${uniqueId} ${durMs}ms infinite ease-in-out; transform-origin: center; transform-box: fill-box; }\n`;
      }
    }

    styleTag.innerHTML = css;

    // Direct DOM animation refresh: force browser to immediately play the new animation
    if (isKinetic) {
      const chars = Array.from(selectedElement.querySelectorAll('span.slide, span.char'));
      let curDelay = 100;
      chars.forEach((c) => {
        c.style.setProperty('--delay', `${curDelay}ms`);
        c.style.animationDelay = `${curDelay}ms`;
        c.style.animation = 'none';
        void c.offsetHeight; // Force DOM reflow
        if (animType !== 'none') {
          c.style.animation = `kinetic-anim-${uniqueId} ${durMs}ms infinite ${timingFn}`;
        }
        curDelay += stagMs;
      });
    } else {
      const texts = Array.from(selectedElement.querySelectorAll('text'));
      texts.forEach((t) => {
        t.style.animation = 'none';
        t.style.transformOrigin = 'center';
        t.style.transformBox = 'fill-box';
        void t.getBoundingClientRect(); // Force reflow
        if (animType !== 'none') {
          t.style.animation = `kinetic-anim-${uniqueId} ${durMs}ms infinite ease-in-out`;
        }
      });
    }

    syncDOM();
  };

  const handleKineticTextChange = (e) => {
    const val = e.target.value;
    setKineticText(val);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-kinetic-text', val);

    const lines = val.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const container = selectedElement.querySelector('.kinetic-container');
    if (!container) return;

    let curDelay = 100;
    const newWordsHtml = lines.map(line => {
      const charsHtml = line.split('').map(char => {
        const d = curDelay;
        curDelay += animationStagger;
        return `<span class="slide char" style="--delay: ${d}ms; color: ${textColor}; -webkit-text-fill-color: ${textColor};">${char === ' ' ? '&nbsp;' : char}</span>`;
      }).join('');
      return `<div class="word">${charsHtml}</div>`;
    }).join('');

    container.innerHTML = newWordsHtml;

    // Adjust foreignObject dimensions snugly to text content
    const fo = selectedElement.querySelector('foreignObject');
    if (fo) {
      const dims = calculateKineticDimensions(lines, fontSize, bgPadding);
      fo.setAttribute('width', dims.width.toString());
      fo.setAttribute('height', dims.height.toString());
    }

    syncDOM();
  };

  return (
    <div className="w-full flex flex-col gap-[0.5vw] font-sans text-gray-800">
      
      {/* 1. Kinetic Text & Word Customizer (Only for Kinetic Typography) */}
      {isKinetic && (
        <div className="flex flex-col mt-[0.5vw] p-[1vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-sm mb-[0.2vw]">
          <SectionHeader title="Kinetic Text Content" icon={<AlignLeft size="0.9vw" />} />
          <div className="flex flex-col gap-[0.4vw]">
            <span className="text-[0.75vw] font-medium text-gray-500">
              Enter words (each line forms an animated word row):
            </span>
            <textarea
              rows={3}
              value={kineticText}
              onChange={handleKineticTextChange}
              placeholder="CODING&#10;KINETIC&#10;TYPE"
              className="w-full p-[0.6vw] text-[0.85vw] font-bold text-gray-800 bg-gray-50 border border-gray-300 rounded-[0.5vw] outline-none focus:border-indigo-500 uppercase tracking-wider"
            />
          </div>
        </div>
      )}

      {/* 2. Motion & Predefined Animations Section */}
      <div className="flex flex-col p-[1vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-sm mb-[0.2vw]">
        <SectionHeader title="Predefined Animations" icon={<Sparkles size="0.9vw" />} />
        
        {/* Animation Preset Selector */}
        <div className="flex flex-col gap-[0.4vw] mb-[0.6vw]">
          <span className="text-[0.8vw] font-semibold text-gray-600">Animation Style :</span>
          <div className="border border-gray-400 rounded-[0.75vw] bg-white overflow-hidden h-[2.5vw] flex items-center hover:border-indigo-500 focus-within:border-indigo-500 transition-colors">
            <select
              value={animationStyle}
              onChange={(e) => handleAnimationChange(e.target.value)}
              className="w-full h-full px-[0.75vw] text-[0.85vw] font-semibold text-gray-700 bg-transparent outline-none cursor-pointer appearance-none truncate"
              style={{ background: 'url("data:image/svg+xml;utf8,<svg fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\' width=\'16\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'></path></svg>") no-repeat right 0.75vw center' }}
            >
              {ANIMATION_PRESETS.map((anim) => (
                <option key={anim.id} value={anim.id}>
                  {anim.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Animation Sliders */}
        {animationStyle !== 'none' && (
          <div className="flex flex-col gap-[0.2vw] pt-[0.2vw] border-t border-gray-100">
            <PropertySlider
              label="Cycle Speed"
              value={animationDuration}
              onChange={handleDurationChange}
              min={1000}
              max={8000}
              step={100}
              unit="ms"
            />
            {isKinetic && (
              <PropertySlider
                label="Stagger Delay"
                value={animationStagger}
                onChange={handleStaggerChange}
                min={20}
                max={200}
                step={5}
                unit="ms"
              />
            )}
          </div>
        )}
      </div>

      {/* 3. Text Property Section */}
      <div className="flex flex-col p-[1vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-sm mb-[0.2vw]">
        <SectionHeader title="Text Property" icon={<Type size="0.9vw" />} />
        
        <div className="flex flex-col gap-[0.5vw]">
          {/* Font Family Dropdown */}
          <div className="border border-gray-400 rounded-[0.75vw] bg-white overflow-hidden h-[2.5vw] flex items-center hover:border-indigo-500 focus-within:border-indigo-500 transition-colors">
            <select 
              value={fontFamily} 
              onChange={handleFontFamilyChange}
              className="w-full h-full px-[0.75vw] text-[0.85vw] font-semibold text-gray-700 bg-transparent outline-none cursor-pointer appearance-none truncate"
              style={{ background: 'url("data:image/svg+xml;utf8,<svg fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\' width=\'16\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'></path></svg>") no-repeat right 0.75vw center' }}
            >
              {fontFamilies.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          {/* Weight and Size Row */}
          <div className="flex gap-[0.65vw]">
            <div className="flex-[1.5] border border-gray-400 rounded-[0.75vw] bg-white overflow-hidden h-[2.5vw] flex items-center hover:border-indigo-500 focus-within:border-indigo-500 transition-colors">
              <select 
                value={fontWeight} 
                onChange={handleFontWeightChange}
                className="w-full h-full px-[0.75vw] text-[0.85vw] font-semibold text-gray-700 bg-transparent outline-none cursor-pointer appearance-none truncate"
                style={{ background: 'url("data:image/svg+xml;utf8,<svg fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\' width=\'16\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'></path></svg>") no-repeat right 0.75vw center' }}
              >
                {fontWeights.map(weight => (
                  <option key={weight.value} value={weight.value}>{weight.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-[1] border border-gray-400 rounded-[0.75vw] bg-white overflow-hidden h-[2.5vw] flex items-center hover:border-indigo-500 focus-within:border-indigo-500 transition-colors">
              <select 
                value={fontSize} 
                onChange={handleFontSizeChange}
                className="w-full h-full px-[0.75vw] text-[0.85vw] font-semibold text-gray-700 bg-transparent outline-none cursor-pointer appearance-none"
                style={{ background: 'url("data:image/svg+xml;utf8,<svg fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\' width=\'16\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'></path></svg>") no-repeat right 0.75vw center' }}
              >
                {fontSizes.map(size => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Typography Visual & Styling Settings */}
      <div className="w-full flex flex-col gap-[0.5vw] p-[1vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-sm mb-[0.5vw]">
        <SectionHeader title="Colors & Effects" icon={<Sliders size="0.9vw" />} />
        
        {/* Text Color */}
        <div className="flex items-center gap-[1vw] py-[0.4vw]">
          <span className="text-[0.8vw] font-semibold text-gray-600 w-[7vw] flex-shrink-0 select-none">
            Text Color :
          </span>
          <div className="flex-grow flex items-center gap-[1vw]">
            <div
              className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors shadow-sm"
              style={{ background: textColor || '#ffffff' }}
              onClick={() => setActiveColorPicker('text')}
              title="Pick text color"
            />
            {activeColorPicker === 'text' && createPortal(
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
                    color={textColor}
                    onChange={handleTextColorChange}
                    onClose={() => setActiveColorPicker(null)}
                    disableGradient={true}
                  />
                </div>
              </div>,
              document.body
            )}
            <div className="flex-1 min-w-0 flex items-center border border-gray-300 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white hover:border-indigo-500 focus-within:border-indigo-500 transition-colors px-[0.5vw]">
              <input
                type="text"
                value={textColor}
                onChange={(e) => handleTextColorChange(e.target.value)}
                className="w-full min-w-0 text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent uppercase"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Outline Color */}
        <div className="flex items-center gap-[1vw] py-[0.4vw]">
          <span className="text-[0.8vw] font-semibold text-gray-600 w-[7vw] flex-shrink-0 select-none">
            Outline Color :
          </span>
          <div className="flex-grow flex items-center gap-[1vw]">
            <div
              className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors shadow-sm"
              style={{ background: strokeColor || '#000000' }}
              onClick={() => setActiveColorPicker('outline')}
              title="Pick outline color"
            />
            {activeColorPicker === 'outline' && createPortal(
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
                    color={strokeColor}
                    onChange={handleOutlineColorChange}
                    onClose={() => setActiveColorPicker(null)}
                    disableGradient={true}
                  />
                </div>
              </div>,
              document.body
            )}
            <div className="flex-1 min-w-0 flex items-center border border-gray-300 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white hover:border-indigo-500 focus-within:border-indigo-500 transition-colors px-[0.5vw]">
              <input
                type="text"
                value={strokeColor}
                onChange={(e) => handleOutlineColorChange(e.target.value)}
                className="w-full min-w-0 text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent uppercase"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Background Color */}
        <div className="flex items-center gap-[1vw] py-[0.4vw]">
          <span className="text-[0.8vw] font-semibold text-gray-600 w-[7vw] flex-shrink-0 select-none">
            Background :
          </span>
          <div className="flex-grow flex items-center gap-[0.6vw]">
            <div
              className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors shadow-sm"
              style={{
                backgroundColor: bgColor && bgColor !== 'transparent' ? bgColor : '#ffffff',
                backgroundImage: bgColor === 'transparent' ? 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%) 50% / 8px 8px' : 'none'
              }}
              onClick={() => setActiveColorPicker('bg')}
              title="Pick background color"
            />
            {activeColorPicker === 'bg' && createPortal(
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
                    color={bgColor === 'transparent' ? '#000000' : bgColor}
                    onChange={handleBgColorChange}
                    onClose={() => setActiveColorPicker(null)}
                    disableGradient={true}
                  />
                </div>
              </div>,
              document.body
            )}
            <div className="flex-1 min-w-0 flex items-center border border-gray-300 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white hover:border-indigo-500 focus-within:border-indigo-500 transition-colors px-[0.5vw]">
              <input
                type="text"
                value={bgColor}
                onChange={(e) => handleBgColorChange(e.target.value)}
                className="w-full min-w-0 text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent uppercase"
                placeholder="transparent"
                maxLength={7}
              />
            </div>
            {bgColor !== 'transparent' && (
              <button
                type="button"
                onClick={() => handleBgColorChange('transparent')}
                className="px-[0.5vw] py-[0.25vw] text-[0.7vw] font-bold text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded border border-gray-200 transition-colors cursor-pointer"
                title="Remove background"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Corner Radius & Padding for Background */}
        {bgColor !== 'transparent' && (
          <div className="flex flex-col gap-[0.2vw] pt-[0.2vw] border-t border-gray-100">
            <PropertySlider
              label="Corner Radius"
              value={bgRadius}
              onChange={handleBgRadiusChange}
              min={0}
              max={40}
              unit="px"
            />
            <PropertySlider
              label="Padding"
              value={bgPadding}
              onChange={handleBgPaddingChange}
              min={0}
              max={40}
              unit="px"
            />
          </div>
        )}

        <PropertySlider 
          label="Outline Width" 
          value={strokeWidth} 
          onChange={(val) => {
            setStrokeWidth(val);
            handleUpdate('stroke-width', val);
          }} 
          min={0} 
          max={10} 
          unit="px"
        />
        <PropertySlider 
          label="Shadow Depth X" 
          value={shadowX} 
          onChange={(val) => {
            setShadowX(val);
            handleUpdate('shadow-x', val);
          }} 
          min={-20} 
          max={20} 
          unit="px"
        />
        <PropertySlider 
          label="Shadow Depth Y" 
          value={shadowY} 
          onChange={(val) => {
            setShadowY(val);
            handleUpdate('shadow-y', val);
          }} 
          min={-20} 
          max={20} 
          unit="px"
        />
        <PropertySlider 
          label="Skew / Angle" 
          value={skewAngle} 
          onChange={(val) => {
            setSkewAngle(val);
            handleUpdate('skew-angle', val);
          }} 
          min={-45} 
          max={45} 
          unit="°"
        />
      </div>
    </div>
  );
};

export default TextElementEditor;
