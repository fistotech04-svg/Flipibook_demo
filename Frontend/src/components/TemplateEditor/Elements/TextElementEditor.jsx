import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ColorPicker from '../ColorPicker';

const PropertySlider = ({ label, value, onChange, min = 0, max = 100, disabled = false }) => {
  const [localVal, setLocalVal] = useState(value);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocalVal(value);
    }
  }, [value]);

  const handleManualInput = (val) => {
    if (disabled) return;
    setLocalVal(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange(val);
    }
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (disabled) return;
    let num = parseFloat(localVal);
    if (isNaN(num)) num = min;

    const corrected = Math.min(Math.max(num, min), max);
    setLocalVal(corrected);
    onChange(corrected.toString());
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  // Convert value for gradient filling (handles negative min correctly)
  const numericVal = parseFloat(value) || 0;
  const percentage = ((numericVal - min) / (max - min)) * 100;

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
          step="1"
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
        <div className="w-[3.5vw] flex-shrink-0 h-[1.8vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.4vw] shadow-sm overflow-hidden">
          <input
            type="number"
            min={min}
            max={max}
            value={localVal === undefined ? '' : localVal}
            onChange={(e) => handleManualInput(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className="w-full min-w-0 text-center text-[0.8vw] text-gray-700 font-semibold outline-none bg-transparent no-spin disabled:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
};

const fontFamilies = [
  'Bangers', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather',
  'Designer_Signature', 'Public Sans', 'Lora', 'Cabin',
  'Allura', 'Parisienne', 'Satisfy'
];

const fontWeights = [
  { name: 'Thin', value: '50' },
  { name: 'Extra Light', value: '100' },
  { name: 'Light', value: '200' },
  { name: 'Regular', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi Bold', value: '600' },
  { name: 'Bold', value: '800' }
];

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 50, 64, 70, 72, 96];

const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.75vw] mb-[0.5vw]">
    <h2 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">{title}</h2>
    <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
  </div>
);

const TextElementEditor = ({ selectedElement, updateElementAttribute, selectedLayerId, selectedTextId }) => {
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#ffffff');
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [shadowX, setShadowX] = useState(0);
  const [shadowY, setShadowY] = useState(0);
  const [skewAngle, setSkewAngle] = useState(0);
  
  const [fontFamily, setFontFamily] = useState('Bangers');
  const [fontWeight, setFontWeight] = useState('400');
  const [fontSize, setFontSize] = useState(50);

  useEffect(() => {
    if (selectedElement) {
      const style = selectedElement.getAttribute('style') || '';
      
      const strokeMatch = style.match(/--stroke-width:\s*([^;]+)/);
      if (strokeMatch) setStrokeWidth(parseFloat(strokeMatch[1]));

      const shadowXMatch = style.match(/--shadow-x:\s*([^px;]+)/);
      if (shadowXMatch) setShadowX(parseFloat(shadowXMatch[1]));

      const shadowYMatch = style.match(/--shadow-y:\s*([^px;]+)/);
      if (shadowYMatch) setShadowY(parseFloat(shadowYMatch[1]));

      const skewMatch = style.match(/--skew-angle:\s*([^deg;]+)/);
      if (skewMatch) setSkewAngle(parseFloat(skewMatch[1]));

      let targetText = null;
      if (selectedTextId) {
        const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
        targetText = editorDoc.getElementById(selectedTextId);
      }
      if (!targetText) targetText = selectedElement.querySelector('text, foreignobject');

      if (targetText) {
        const innerDiv = targetText.querySelector('div');
        const styleSource = innerDiv || targetText;
        const ff = styleSource.style.fontFamily || targetText.getAttribute('font-family') || 'Bangers';
        setFontFamily(ff.replace(/['"]/g, '').split(',')[0].trim());
        
        const fw = styleSource.style.fontWeight || targetText.getAttribute('font-weight') || '400';
        setFontWeight(fw);
        
        const fs = styleSource.style.fontSize || targetText.getAttribute('font-size') || '50';
        setFontSize(parseInt(fs) || 50);

        const tc = targetText.getAttribute('fill') || targetText.style.fill || '#ffffff';
        setTextColor(tc);

        const sc = targetText.getAttribute('stroke') || '#000000';
        setStrokeColor(sc);
      }
    }
  }, [selectedElement, selectedTextId]);

  const handleUpdate = (attr, val) => {
    if (!selectedElement) return;
    
    const currentStyle = selectedElement.getAttribute('style') || '';
    let newStyle = currentStyle;
    
    const regex = new RegExp(`--${attr}:\\s*[^;]+;?`, 'g');
    
    let cssVal = val;
    if (attr === 'shadow-x' || attr === 'shadow-y') cssVal = `${val}px`;
    else if (attr === 'skew-angle') cssVal = `${val}deg`;

    if (regex.test(newStyle)) {
      newStyle = newStyle.replace(regex, `--${attr}: ${cssVal};`);
    } else {
      newStyle += ` --${attr}: ${cssVal};`;
    }

    if (updateElementAttribute && selectedLayerId) {
      updateElementAttribute(selectedLayerId, 'style', newStyle);
    } else {
      selectedElement.setAttribute('style', newStyle);
    }
  };

  const syncDOM = () => {
    if (updateElementAttribute && selectedLayerId) {
      updateElementAttribute(selectedLayerId, 'innerHTML', selectedElement.innerHTML);
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

    const texts = getTargetTexts();
    texts.forEach(text => {
      text.style.fontFamily = `'${val}', cursive`;
      text.setAttribute('font-family', val);
      const div = text.querySelector('div');
      if (div) {
        div.style.fontFamily = `'${val}', cursive`;
      }
    });

    const styleTag = selectedElement.querySelector('style');
    if (styleTag) {
      const currentCss = styleTag.innerHTML;
      if (!currentCss.includes(`family=${val.replace(/ /g, '+')}&`)) {
        styleTag.innerHTML = `@import url('https://fonts.googleapis.com/css2?family=${val.replace(/ /g, '+')}&display=swap');\n` + currentCss;
      }
    }
    syncDOM();
  };

  const handleFontWeightChange = (e) => {
    const val = e.target.value;
    setFontWeight(val);
    if (!selectedElement) return;

    const texts = getTargetTexts();
    texts.forEach(text => {
      text.setAttribute('font-weight', val);
      text.style.fontWeight = val;
      const div = text.querySelector('div');
      if (div) div.style.fontWeight = val;
    });
    syncDOM();
  };

  const handleFontSizeChange = (e) => {
    const val = e.target.value;
    setFontSize(val);
    if (!selectedElement) return;

    const texts = getTargetTexts();
    texts.forEach(text => {
      text.setAttribute('font-size', val);
      text.style.fontSize = `${val}px`;
      const div = text.querySelector('div');
      if (div) div.style.fontSize = `${val}px`;
    });
    syncDOM();
  };

  const handleTextColorChange = (val) => {
    setTextColor(val);
    if (!selectedElement) return;

    const texts = getTargetTexts();
    texts.forEach(text => {
      text.setAttribute('fill', val);
      text.style.fill = val;
      const div = text.querySelector('div');
      if (div) {
        div.style.color = val;
      }
    });
    syncDOM();
  };

  const handleOutlineColorChange = (val) => {
    setStrokeColor(val);
    if (!selectedElement) return;

    const texts = getTargetTexts();
    texts.forEach(text => {
      text.setAttribute('stroke', val);
      const div = text.querySelector('div');
      if (div) {
        div.style.webkitTextStrokeColor = val;
      }
    });
    syncDOM();
  };

  return (
    <div className="w-full flex flex-col gap-[0.5vw] font-sans text-gray-800">
      
      {/* Text Property Section */}
      <div className="flex flex-col mt-[0.5vw] p-[1vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-sm mb-[0.5vw]">
        <SectionHeader title="Text Property" />
        
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
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-[0.5vw] p-[1vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-sm mb-[0.5vw]">
        <SectionHeader title="Typography Settings" />
        
        <div className="flex items-center gap-[1vw] py-[0.4vw]">
          <span className="text-[0.8vw] font-semibold text-gray-600 w-[7vw] flex-shrink-0 select-none">
            Text Color :
          </span>
          <div className="flex-grow flex items-center gap-[1vw]">
            <div
              className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
              style={{ background: textColor || 'transparent' }}
              onClick={() => setActiveColorPicker('text')}
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

        <div className="flex items-center gap-[1vw] py-[0.4vw]">
          <span className="text-[0.8vw] font-semibold text-gray-600 w-[7vw] flex-shrink-0 select-none">
            Outline Color :
          </span>
          <div className="flex-grow flex items-center gap-[1vw]">
            <div
              className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
              style={{ background: strokeColor || 'transparent' }}
              onClick={() => setActiveColorPicker('outline')}
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

        <PropertySlider 
          label="Outline Thickness" 
          value={strokeWidth} 
          onChange={(val) => {
            setStrokeWidth(val);
            handleUpdate('stroke-width', val);
          }} 
          min={0} 
          max={10} 
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
        />
      </div>
    </div>
  );
};

export default TextElementEditor;
