import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ColorPicker, { parseGradient } from '../ColorPicker';

const fontFamilies = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
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

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 64, 72];

const AccordionItem = ({ title, isOpen, onToggle, children }) => (
  <div className="mb-[0.5vw] w-full bg-white border border-gray-200 rounded-[0.75vw] overflow-hidden focus-within:border-indigo-500 transition-colors shadow-sm">
    <div
      onClick={onToggle}
      className={`w-full h-[2.8vw] px-[0.85vw] flex items-center justify-between cursor-pointer bg-white transition-colors ${isOpen ? 'border-b border-gray-100' : ''}`}
    >
      <span className="text-[0.85vw] font-semibold text-gray-600 truncate">{title}</span>
      <ChevronDown size="1vw" className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </div>

    <div className={`grid transition-all duration-300 ease-in-out bg-white ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden">
        <div className="p-[0.75vw] flex items-center justify-between gap-[0.5vw]">
          {children}
        </div>
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.75vw] mb-[0.5vw]">
    <h2 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">{title}</h2>
    <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
  </div>
);

const ColorInputUI = ({ color, onChange, onOpenPicker }) => {
  const isNone = color === 'transparent' || color === 'none' || !color;
  
  return (
    <>
      {/* Swatch */}
      <div
        className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#5d5efc] transition-colors bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3hF8Mv5nZGBiYMAphGoaNAySAUODoWqgMEYNDQ90OAwMAwA1+x4XyU24LAAAAABJRU5ErkJggg==')]"
        onClick={onOpenPicker}
      >
        <div
          className="w-full h-full border border-gray-200"
          style={{ background: isNone ? 'transparent' : color }}
        />
        {isNone && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
        )}
      </div>

      {/* Input box */}
      <div className="flex-grow flex items-center border border-gray-300 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white hover:border-[#5d5efc] focus-within:border-[#5d5efc] transition-colors px-[0.5vw]">
        <input
          type="text"
          value={isNone ? '#' : (color.startsWith('#') ? color.toUpperCase() : color)}
          onChange={onChange}
          className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw] tracking-tight uppercase"
          maxLength={7}
        />
        <div className="flex items-center gap-[0.1vw] ml-[0.5vw] cursor-ew-resize select-none px-[0.2vw] hover:bg-gray-50 rounded border-l border-gray-200 pl-[0.4vw]">
          <span className="text-[0.75vw] font-medium text-gray-600">100%</span>
        </div>
      </div>

      {/* HEX Dropdown */}
      <div className="h-[2vw] flex items-center justify-between px-[0.5vw] border border-gray-300 rounded-[0.5vw] bg-white cursor-pointer hover:bg-gray-50 min-w-[3.5vw] transition-colors">
        <span className="text-[0.7vw] text-gray-600 font-medium">HEX</span>
        <ChevronDown size="0.8vw" className="text-gray-400 ml-[0.2vw]" />
      </div>
    </>
  );
};

const ButtonEditor = ({ selectedElement, onUpdate }) => {
  const [fillColor, setFillColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#333333');
  const [textStroke, setTextStroke] = useState('transparent');
  const [fontFamily, setFontFamily] = useState('Poppins');
  const [fontWeight, setFontWeight] = useState('400');
  const [fontSize, setFontSize] = useState('14');
  const [buttonText, setButtonText] = useState('');
  
  const [hoverFillColor, setHoverFillColor] = useState('#1c2536');
  const [hoverTextColor, setHoverTextColor] = useState('#ffffff');
  const [hoverStrokeColor, setHoverStrokeColor] = useState('#1c2536');
  
  const [editorHoverPreview, setEditorHoverPreview] = useState(false);

  const [openSection, setOpenSection] = useState(null);
  const [activeColorPicker, setActiveColorPicker] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Sync state with DOM on selection change
  useEffect(() => {
    if (selectedElement) {
      const rects = Array.from(selectedElement.querySelectorAll('rect'));
      const rect = rects.find(r => !r.closest('clipPath') && !r.closest('defs')) || rects[0];
      const text = selectedElement.querySelector('text') || selectedElement.querySelector('foreignobject');

      if (rect) {
        const fetchColor = (val) => {
          if (!val || !val.startsWith('url(')) return val;
          const match = val.match(/url\(#([^)]+)\)/);
          if (match && match[1]) {
            const gradEl = selectedElement.querySelector(`#${match[1]}`);
            if (gradEl) {
              const stops = Array.from(gradEl.querySelectorAll('stop')).map(stop => 
                `${stop.getAttribute('stop-color')} ${stop.getAttribute('offset') || '0%'}`
              ).join(', ');
              return `linear-gradient(90deg, ${stops})`;
            }
          }
          return val;
        };
        setFillColor(fetchColor(rect.getAttribute('fill')) || '#ffffff');
        setStrokeColor(fetchColor(rect.getAttribute('stroke')) || 'transparent');
      }
      if (text) {
        const div = text.tagName.toLowerCase() === 'foreignobject' ? text.querySelector('div') : null;
        
        setTextColor(div?.style?.color || text.getAttribute('fill') || text.style?.color || '#333333');
        setTextStroke(div?.style?.webkitTextStrokeColor || text.getAttribute('stroke') || text.style?.webkitTextStrokeColor || 'transparent');
        
        const ff = div?.style?.fontFamily || text.getAttribute('font-family') || text.style?.fontFamily || 'Poppins';
        setFontFamily(ff.replace(/['"]/g, ''));
        
        const fw = div?.style?.fontWeight || text.getAttribute('font-weight') || text.style?.fontWeight || '400';
        setFontWeight(fw);
        
        const fs = div?.style?.fontSize || text.getAttribute('font-size') || text.style?.fontSize || '14';
        setFontSize(parseInt(fs) || 14);

        setButtonText(div ? (div.textContent || div.innerText || '') : (text.textContent || text.innerHTML || ''));
      }
      
      setHoverFillColor(selectedElement.style.getPropertyValue('--hover-fill') || '#1c2536');
      setHoverTextColor(selectedElement.style.getPropertyValue('--hover-text') || '#ffffff');
      setHoverStrokeColor(selectedElement.style.getPropertyValue('--hover-stroke') || '#1c2536');
      
      setEditorHoverPreview(selectedElement.getAttribute('data-editor-hover') !== 'off');
    }
  }, [selectedElement]);

  useEffect(() => {
    if (selectedElement) {
      if (activeColorPicker && activeColorPicker.startsWith('hover')) {
        selectedElement.setAttribute('data-force-hover', 'true');
      } else {
        selectedElement.removeAttribute('data-force-hover');
      }
    }
  }, [activeColorPicker, selectedElement]);

  const pushUpdate = () => {
    if (onUpdate && selectedElement) {
      const svgRoot = selectedElement.closest('svg');
      
      const hadForceHover = selectedElement.hasAttribute('data-force-hover');
      if (hadForceHover) selectedElement.removeAttribute('data-force-hover');

      if (svgRoot) {
        const serializer = new XMLSerializer();
        onUpdate(serializer.serializeToString(svgRoot));
      } else {
        onUpdate(selectedElement.outerHTML);
      }
      
      if (hadForceHover) selectedElement.setAttribute('data-force-hover', 'true');
    }
  };

  const applyColor = (val) => {
    if (!val || !val.includes('gradient')) return val;
    const parsed = parseGradient(val);
    if (!parsed || !parsed.stops) return val;
    let defs = selectedElement.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      selectedElement.insertBefore(defs, selectedElement.firstChild);
    }
    const gradId = `btn-grad-${Date.now()}`;
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', gradId);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '0%');
    parsed.stops.forEach(s => {
      const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop.setAttribute('offset', `${s.offset}%`);
      stop.setAttribute('stop-color', s.color);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);
    return `url(#${gradId})`;
  };

  const handleFillChange = (val) => {
    setFillColor(val);
    if (selectedElement) {
      // If there is an existing linearGradient inside this button, update its stops directly.
      // This is critical for buttons like the Linear Gradient button whose CSS references the
      // original gradient ID. If we create a new gradient element, the CSS rule wins and the
      // new gradient is never shown.
      // Find the specific fill gradient (prevent accidentally selecting stroke gradients)
      const allGrads = Array.from(selectedElement.querySelectorAll('linearGradient'));
      const existingGrad = allGrads.find(g => g.id.startsWith('grad-') && !g.id.startsWith('hover-grad-') && !g.id.startsWith('stroke-grad-')) || allGrads[0];
      if (existingGrad && val && val.includes('gradient')) {
        const parsed = parseGradient(val);
        if (parsed && parsed.stops) {
          const existingStops = Array.from(existingGrad.querySelectorAll('stop'));
          parsed.stops.forEach((s, i) => {
            if (existingStops[i]) {
              existingStops[i].setAttribute('stop-color', s.color);
              existingStops[i].setAttribute('offset', `${s.offset}%`);
            } else {
              // Add a new stop if there are more stops than before
              const newStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              newStop.setAttribute('offset', `${s.offset}%`);
              newStop.setAttribute('stop-color', s.color);
              existingGrad.appendChild(newStop);
            }
          });
          // Remove extra stops if new gradient has fewer stops
          while (existingStops.length > parsed.stops.length) {
            existingGrad.removeChild(existingStops[existingStops.length - 1]);
            existingStops.pop();
          }
          // Update gradient direction angle if linear
          if (parsed.angle !== undefined) {
            const rad = (parsed.angle - 90) * Math.PI / 180;
            const x2 = Math.round((0.5 + Math.cos(rad) * 0.5) * 100);
            const y2 = Math.round((0.5 + Math.sin(rad) * 0.5) * 100);
            const x1 = 100 - x2;
            const y1 = 100 - y2;
            existingGrad.setAttribute('x1', `${x1}%`);
            existingGrad.setAttribute('y1', `${y1}%`);
            existingGrad.setAttribute('x2', `${x2}%`);
            existingGrad.setAttribute('y2', `${y2}%`);
          }
          // Make sure the rect's fill attribute also points to this gradient (for serialisation)
          const rects = Array.from(selectedElement.querySelectorAll('rect'));
          const rect = rects.find(r => !r.closest('clipPath') && !r.closest('defs')) || rects[0];
          if (rect) rect.setAttribute('fill', `url(#${existingGrad.getAttribute('id')})`);
          pushUpdate();
          return;
        }
      }

      // Fallback: regular solid color or gradient on buttons without an existing gradient element
      const rects = Array.from(selectedElement.querySelectorAll('rect'));
      const rect = rects.find(r => !r.closest('clipPath') && !r.closest('defs')) || rects[0];
      const finalVal = applyColor(val);
      if (rect) rect.setAttribute('fill', finalVal);
      selectedElement.style.setProperty('--base-fill', finalVal);
      pushUpdate();
    }
  };

  const handleStrokeChange = (val) => {
    setStrokeColor(val);
    if (selectedElement) {
      const allGrads = Array.from(selectedElement.querySelectorAll('linearGradient'));
      const existingGrad = allGrads.find(g => g.id.startsWith('stroke-grad-'));
      if (existingGrad && val && val.includes('gradient')) {
        const parsed = parseGradient(val);
        if (parsed && parsed.stops) {
          const existingStops = Array.from(existingGrad.querySelectorAll('stop'));
          parsed.stops.forEach((s, i) => {
            if (existingStops[i]) {
              existingStops[i].setAttribute('stop-color', s.color);
              existingStops[i].setAttribute('offset', `${s.offset}%`);
            } else {
              const newStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              newStop.setAttribute('offset', `${s.offset}%`);
              newStop.setAttribute('stop-color', s.color);
              existingGrad.appendChild(newStop);
            }
          });
          while (existingStops.length > parsed.stops.length) {
            existingGrad.removeChild(existingStops[existingStops.length - 1]);
            existingStops.pop();
          }
          if (parsed.angle !== undefined) {
            const rad = (parsed.angle - 90) * Math.PI / 180;
            const x2 = Math.round((0.5 + Math.cos(rad) * 0.5) * 100);
            const y2 = Math.round((0.5 + Math.sin(rad) * 0.5) * 100);
            existingGrad.setAttribute('x1', `${100 - x2}%`);
            existingGrad.setAttribute('y1', `${100 - y2}%`);
            existingGrad.setAttribute('x2', `${x2}%`);
            existingGrad.setAttribute('y2', `${y2}%`);
          }
          const rects = Array.from(selectedElement.querySelectorAll('rect'));
          const rect = rects.find(r => !r.closest('clipPath') && !r.closest('defs')) || rects[0];
          if (rect) rect.setAttribute('stroke', `url(#${existingGrad.getAttribute('id')})`);
          pushUpdate();
          return;
        }
      }

      const rects = Array.from(selectedElement.querySelectorAll('rect'));
      const rect = rects.find(r => !r.closest('clipPath') && !r.closest('defs')) || rects[0];
      const finalVal = applyColor(val);
      if (rect) rect.setAttribute('stroke', finalVal);
      selectedElement.style.setProperty('--base-stroke', finalVal);
      pushUpdate();
    }
  };

  const handleTextColorChange = (val) => {
    setTextColor(val);
    if (selectedElement) {
      const text = selectedElement.querySelector('text') || selectedElement.querySelector('foreignobject');
      if (text) {
        if (text.tagName.toLowerCase() === 'foreignobject') {
          text.style.color = val;
          const div = text.querySelector('div');
          if (div) div.style.color = val;
        } else {
          text.setAttribute('fill', val);
        }
      }
      selectedElement.style.setProperty('--base-text', val);
      pushUpdate();
    }
  };

  const handleTextStrokeChange = (val) => {
    setTextStroke(val);
    if (selectedElement) {
      const text = selectedElement.querySelector('text') || selectedElement.querySelector('foreignobject');
      if (text) {
        if (text.tagName.toLowerCase() === 'foreignobject') {
          text.style.webkitTextStrokeColor = val;
          const div = text.querySelector('div');
          if (div) div.style.webkitTextStrokeColor = val;
        } else {
          text.setAttribute('stroke', val);
        }
      }
      pushUpdate();
    }
  };

  const handleHoverFillChange = (val) => {
    setHoverFillColor(val);
    if (selectedElement) {
      // If the button has two linearGradients (base + hover), update the hover gradient stops directly
      const allGrads = Array.from(selectedElement.querySelectorAll('linearGradient'));
      const hoverGrad = allGrads.find(g => g.id.startsWith('hover-grad'));
      if (hoverGrad && val && val.includes('gradient')) {
        const parsed = parseGradient(val);
        if (parsed && parsed.stops) {
          const existingStops = Array.from(hoverGrad.querySelectorAll('stop'));
          parsed.stops.forEach((s, i) => {
            if (existingStops[i]) {
              existingStops[i].setAttribute('stop-color', s.color);
              existingStops[i].setAttribute('offset', `${s.offset}%`);
            } else {
              const newStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              newStop.setAttribute('offset', `${s.offset}%`);
              newStop.setAttribute('stop-color', s.color);
              hoverGrad.appendChild(newStop);
            }
          });
          // Remove extra stops
          while (existingStops.length > parsed.stops.length) {
            hoverGrad.removeChild(existingStops[existingStops.length - 1]);
            existingStops.pop();
          }
          // Update angle
          if (parsed.angle !== undefined) {
            const rad = (parsed.angle - 90) * Math.PI / 180;
            const x2 = Math.round((0.5 + Math.cos(rad) * 0.5) * 100);
            const y2 = Math.round((0.5 + Math.sin(rad) * 0.5) * 100);
            hoverGrad.setAttribute('x1', `${100 - x2}%`);
            hoverGrad.setAttribute('y1', `${100 - y2}%`);
            hoverGrad.setAttribute('x2', `${x2}%`);
            hoverGrad.setAttribute('y2', `${y2}%`);
          }
          selectedElement.style.setProperty('--hover-fill', val);
          pushUpdate();
          return;
        }
      }
      // Fallback: solid color hover
      selectedElement.style.setProperty('--hover-fill', val);
      pushUpdate();
    }
  };

  const handleHoverTextColorChange = (val) => {
    setHoverTextColor(val);
    if (selectedElement) {
      selectedElement.style.setProperty('--hover-text', val);
      pushUpdate();
    }
  };

  const handleHoverStrokeChange = (val) => {
    setHoverStrokeColor(val);
    if (selectedElement) {
      const allGrads = Array.from(selectedElement.querySelectorAll('linearGradient'));
      const hoverStrokeGrad = allGrads.find(g => g.id.startsWith('hover-stroke-grad'));
      if (hoverStrokeGrad && val && val.includes('gradient')) {
        const parsed = parseGradient(val);
        if (parsed && parsed.stops) {
          const existingStops = Array.from(hoverStrokeGrad.querySelectorAll('stop'));
          parsed.stops.forEach((s, i) => {
            if (existingStops[i]) {
              existingStops[i].setAttribute('stop-color', s.color);
              existingStops[i].setAttribute('offset', `${s.offset}%`);
            } else {
              const newStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              newStop.setAttribute('offset', `${s.offset}%`);
              newStop.setAttribute('stop-color', s.color);
              hoverStrokeGrad.appendChild(newStop);
            }
          });
          while (existingStops.length > parsed.stops.length) {
            hoverStrokeGrad.removeChild(existingStops[existingStops.length - 1]);
            existingStops.pop();
          }
          if (parsed.angle !== undefined) {
            const rad = (parsed.angle - 90) * Math.PI / 180;
            const x2 = Math.round((0.5 + Math.cos(rad) * 0.5) * 100);
            const y2 = Math.round((0.5 + Math.sin(rad) * 0.5) * 100);
            hoverStrokeGrad.setAttribute('x1', `${100 - x2}%`);
            hoverStrokeGrad.setAttribute('y1', `${100 - y2}%`);
            hoverStrokeGrad.setAttribute('x2', `${x2}%`);
            hoverStrokeGrad.setAttribute('y2', `${y2}%`);
          }
          selectedElement.style.setProperty('--hover-stroke', val);
          pushUpdate();
          return;
        }
      }
      
      selectedElement.style.setProperty('--hover-stroke', val);
      pushUpdate();
    }
  };

  const handleEditorHoverToggle = () => {
    const newVal = !editorHoverPreview;
    setEditorHoverPreview(newVal);
    if (selectedElement) {
      if (!newVal) {
        selectedElement.setAttribute('data-editor-hover', 'off');
      } else {
        selectedElement.removeAttribute('data-editor-hover');
      }
      pushUpdate();
    }
  };

  const handleFontFamilyChange = (e) => {
    const val = e.target.value;
    setFontFamily(val);
    if (selectedElement) {
      const text = selectedElement.querySelector('text') || selectedElement.querySelector('foreignobject');
      if (text) {
        if (text.tagName.toLowerCase() === 'foreignobject') {
          text.style.fontFamily = val;
          const div = text.querySelector('div');
          if (div) div.style.fontFamily = val;
        } else {
          text.setAttribute('font-family', val);
        }
      }
      pushUpdate();
    }
  };

  const handleFontWeightChange = (e) => {
    const val = e.target.value;
    setFontWeight(val);
    if (selectedElement) {
      const text = selectedElement.querySelector('text') || selectedElement.querySelector('foreignobject');
      if (text) {
        if (text.tagName.toLowerCase() === 'foreignobject') {
          text.style.fontWeight = val;
          const div = text.querySelector('div');
          if (div) div.style.fontWeight = val;
        } else {
          text.setAttribute('font-weight', val);
        }
      }
      pushUpdate();
    }
  };

  const handleFontSizeChange = (e) => {
    const val = e.target.value;
    setFontSize(val);
    if (selectedElement) {
      const text = selectedElement.querySelector('text') || selectedElement.querySelector('foreignobject');
      if (text) {
        if (text.tagName.toLowerCase() === 'foreignobject') {
          text.style.fontSize = `${val}px`;
          const div = text.querySelector('div');
          if (div) div.style.fontSize = `${val}px`;
        } else {
          text.setAttribute('font-size', val);
        }
      }
      pushUpdate();
    }
  };

  const handleTextContentChange = (e) => {
    const val = e.target.value;
    setButtonText(val);
    if (selectedElement) {
      const text = selectedElement.querySelector('text') || selectedElement.querySelector('foreignobject');
      if (text) {
        if (text.tagName.toLowerCase() === 'foreignobject') {
          const div = text.querySelector('div');
          if (div) div.textContent = val;
          else text.textContent = val;
        } else {
          text.textContent = val;
        }
      }

      // Auto-width adjustment
      const currentFontSize = parseInt(fontSize) || 14;
      const estTextWidth = val.length * (currentFontSize * 0.6); // slightly larger multiplier for safety
      const neededW = Math.max(120, Math.ceil(estTextWidth + 40));
      
      // Force selection overlay redraw for interact.js
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);

      // Find rects that span the full width (anything > 50px is a main/background rect)
      const rects = selectedElement.querySelectorAll('rect');
      rects.forEach(r => {
        const className = r.getAttribute('class') || '';
        const oldW = parseFloat(r.getAttribute('data-orig-w') || r.getAttribute('width'));
        if (!r.hasAttribute('data-orig-w')) r.setAttribute('data-orig-w', oldW);
        
        if (className.includes('rect-ribbon-center')) {
          r.setAttribute('width', neededW - 50);
        } else if (oldW >= 50) {
          r.setAttribute('width', neededW);
        }
      });

      // Find clipPath rects
      const clipRects = selectedElement.querySelectorAll('clipPath rect');
      clipRects.forEach(r => {
        const oldW = parseFloat(r.getAttribute('data-orig-w') || r.getAttribute('width'));
        if (!r.hasAttribute('data-orig-w')) r.setAttribute('data-orig-w', oldW);
        
        if (oldW >= 50) {
          r.setAttribute('width', neededW);
        }
      });

      // Find lines (for button 14)
      const lines = selectedElement.querySelectorAll('line');
      lines.forEach(l => {
        const oldX2 = parseFloat(l.getAttribute('data-orig-x2') || l.getAttribute('x2'));
        if (!l.hasAttribute('data-orig-x2')) l.setAttribute('data-orig-x2', oldX2);
        
        if (oldX2 >= 50) {
          l.setAttribute('x2', neededW);
        }
      });

      // Find polygons
      const polygons = selectedElement.querySelectorAll('polygon');
      polygons.forEach(p => {
        const className = p.getAttribute('class') || '';
        if (className.includes('poly-back')) {
          p.setAttribute('points', `0,0 ${neededW - 20},0 ${neededW},32 20,32`);
        } else if (className.includes('poly-front')) {
          p.setAttribute('points', `20,0 ${neededW},0 ${neededW - 20},32 0,32`);
        } else if (className.includes('poly-diamond')) {
          p.setAttribute('points', `0,17 17,0 ${neededW - 17},0 ${neededW},17 ${neededW - 17},34 17,34`);
        } else if (className.includes('poly-arrow')) {
          p.setAttribute('points', `17,0 ${neededW - 17},0 ${neededW},17 ${neededW - 17},34 17,34 0,17`);
        } else if (className.includes('poly-sheer')) {
          p.setAttribute('points', `10,0 ${neededW},0 ${neededW - 10},34 0,34`);
        } else if (className.includes('poly-ribbon-right')) {
          p.setAttribute('points', `${neededW - 25},5 ${neededW},5 ${neededW - 8},22 ${neededW},39 ${neededW - 25},39`);
        } else if (className.includes('poly-trapezoid')) {
          p.setAttribute('points', `10,0 ${neededW - 10},0 ${neededW},34 0,34`);
        } else if (className.includes('poly-notching')) {
          p.setAttribute('points', `10,0 ${neededW - 10},0 ${neededW},10 ${neededW},24 ${neededW - 10},34 10,34 0,24 0,10`);
        } else if (className.includes('poly-flat-arrow')) {
          p.setAttribute('points', `0,0 ${neededW - 17},0 ${neededW},17 ${neededW - 17},34 0,34`);
        }
      });

      // Find paths
      const paths = selectedElement.querySelectorAll('path');
      paths.forEach(p => {
        const className = p.getAttribute('class') || '';
        if (className.includes('path-inset-circle')) {
          p.setAttribute('d', `M 10,0 L ${neededW - 10},0 A 10,10 0 0,0 ${neededW},10 L ${neededW},24 A 10,10 0 0,0 ${neededW - 10},34 L 10,34 A 10,10 0 0,0 0,24 L 0,10 A 10,10 0 0,0 10,0 Z`);
        } else if (className.includes('path-tab')) {
          p.setAttribute('d', `M -10,34 A 10,10 0 0,0 0,24 L 0,10 A 10,10 0 0,1 10,0 L ${neededW - 10},0 A 10,10 0 0,1 ${neededW},10 L ${neededW},24 A 10,10 0 0,0 ${neededW + 10},34 Z`);
        }
      });

      // Update text position to stay centered
      if (text && text.tagName.toLowerCase() === 'text' && text.getAttribute('text-anchor') === 'middle') {
        text.setAttribute('x', neededW / 2);
      }

      // Update CSS strings for hover effects (e.g. slide-bg, dashes)
      const styleTag = selectedElement.querySelector('style');
      if (styleTag) {
        const origCss = styleTag.getAttribute('data-orig-css') || styleTag.innerHTML;
        if (!styleTag.hasAttribute('data-orig-css')) styleTag.setAttribute('data-orig-css', origCss);
        
        let newCss = origCss;
        // The original CSS has hardcoded 120px and 118px. We replace them with the new neededW.
        newCss = newCss.replace(/120px/g, neededW + 'px');
        newCss = newCss.replace(/118px/g, (neededW - 2) + 'px');
        newCss = newCss.replace(/stroke-dasharray:\s*120/g, 'stroke-dasharray: ' + neededW);
        newCss = newCss.replace(/stroke-dashoffset:\s*120/g, 'stroke-dashoffset: ' + neededW);
        
        styleTag.innerHTML = newCss;
      }

      pushUpdate();
    }
  };

  return (
    <div className="w-full flex flex-col gap-[0.8vw] font-sans text-gray-800">
      
      {/* Missing heading is back! */}
      <h2 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider mt-[0.5vw] mb-[0.5vw]">Button Properties</h2>

      {/* Color Picker Portal */}
      {activeColorPicker && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[5000] pointer-events-auto">
          <div className="absolute inset-0 bg-transparent" onClick={() => setActiveColorPicker(null)} />
          <div 
            className="absolute animate-in fade-in zoom-in-95 duration-200"
            style={{ top: '50%', right: '19.5vw', transform: 'translateY(-50%)' }}
          >
            <ColorPicker
              color={
                activeColorPicker === 'textColor' ? textColor :
                activeColorPicker === 'textStroke' ? textStroke :
                activeColorPicker === 'fillColor' ? fillColor :
                activeColorPicker === 'strokeColor' ? strokeColor :
                activeColorPicker === 'hoverFillColor' ? hoverFillColor :
                activeColorPicker === 'hoverTextColor' ? hoverTextColor :
                activeColorPicker === 'hoverStrokeColor' ? hoverStrokeColor : '#000000'
              }
              onChange={(c) => {
                if (activeColorPicker === 'textColor') handleTextColorChange(c);
                else if (activeColorPicker === 'textStroke') handleTextStrokeChange(c);
                else if (activeColorPicker === 'fillColor') handleFillChange(c);
                else if (activeColorPicker === 'strokeColor') handleStrokeChange(c);
                else if (activeColorPicker === 'hoverFillColor') handleHoverFillChange(c);
                else if (activeColorPicker === 'hoverTextColor') handleHoverTextColorChange(c);
                else if (activeColorPicker === 'hoverStrokeColor') handleHoverStrokeChange(c);
              }}
              onClose={() => setActiveColorPicker(null)}
              hidePalette={false}
              disableGradient={false}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Text Property Section */}
      <div className="flex flex-col mt-[0.5vw]">
        <SectionHeader title="Text Property" />
        
        <div className="flex flex-col">
          {/* Text Content Input */}
          <div className="border border-gray-400 rounded-[0.75vw] bg-white overflow-hidden mb-[0.5vw] h-[2.5vw] flex items-center px-[0.75vw] hover:border-indigo-500 focus-within:border-indigo-500 transition-colors">
            <input
              type="text"
              value={buttonText}
              maxLength={30}
              onChange={handleTextContentChange}
              placeholder="Button Text"
              className="flex-1 h-full text-[0.85vw] font-medium text-gray-700 bg-transparent outline-none min-w-0"
            />
            <span className="text-[0.65vw] text-gray-400 select-none ml-[0.5vw]">{buttonText.length}/30</span>
          </div>

          {/* Font Family Dropdown */}
          <div className="border border-gray-400 rounded-[0.75vw] bg-white overflow-hidden mb-[0.5vw] h-[2.5vw] flex items-center hover:border-indigo-500 focus-within:border-indigo-500 transition-colors">
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
          <div className="flex gap-[0.65vw] mb-[0.5vw]">
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

          <AccordionItem 
            title="Fill Color" 
            isOpen={openSection === 'textFill'} 
            onToggle={() => toggleSection('textFill')}
          >
            <ColorInputUI 
              color={textColor} 
              onChange={(e) => handleTextColorChange(e.target.value)}
              onOpenPicker={() => setActiveColorPicker('textColor')}
            />
          </AccordionItem>

          <AccordionItem 
            title="Stroke Color" 
            isOpen={openSection === 'textStroke'} 
            onToggle={() => toggleSection('textStroke')}
          >
            <ColorInputUI 
              color={textStroke} 
              onChange={(e) => handleTextStrokeChange(e.target.value)}
              onOpenPicker={() => setActiveColorPicker('textStroke')}
            />
          </AccordionItem>
        </div>
      </div>

      {/* Shape Properties Section */}
      <div className="flex flex-col">
        <SectionHeader title="Shape Properties" />
        
        <div className="flex flex-col">
          <AccordionItem 
            title="Fill Color" 
            isOpen={openSection === 'shapeFill'} 
            onToggle={() => toggleSection('shapeFill')}
          >
            <ColorInputUI 
              color={fillColor} 
              onChange={(e) => handleFillChange(e.target.value)}
              onOpenPicker={() => setActiveColorPicker('fillColor')}
            />
          </AccordionItem>

          <AccordionItem 
            title="Stroke Color" 
            isOpen={openSection === 'shapeStroke'} 
            onToggle={() => toggleSection('shapeStroke')}
          >
            <ColorInputUI 
              color={strokeColor} 
              onChange={(e) => handleStrokeChange(e.target.value)}
              onOpenPicker={() => setActiveColorPicker('strokeColor')}
            />
          </AccordionItem>
        </div>
      </div>

      {/* Hover Properties Section */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-[0.5vw]">
          <SectionHeader title="Hover Properties" />
          <div className="flex items-center gap-[0.5vw] mb-[0.5vw]">
            <span className="text-[0.75vw] text-gray-500 font-medium">Preview in Editor</span>
            <button 
              onClick={handleEditorHoverToggle}
              className={`w-[2vw] h-[1.1vw] rounded-full relative transition-colors duration-200 focus:outline-none ${editorHoverPreview ? 'bg-indigo-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-[0.1vw] left-[0.1vw] w-[0.9vw] h-[0.9vw] bg-white rounded-full shadow-sm transition-transform duration-200 ${editorHoverPreview ? 'translate-x-[0.9vw]' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col">
          <AccordionItem 
            title="Hover Fill Color" 
            isOpen={openSection === 'hoverFill'} 
            onToggle={() => toggleSection('hoverFill')}
          >
            <ColorInputUI 
              color={hoverFillColor} 
              onChange={(e) => handleHoverFillChange(e.target.value)}
              onOpenPicker={() => setActiveColorPicker('hoverFillColor')}
            />
          </AccordionItem>

          <AccordionItem 
            title="Hover Text Color" 
            isOpen={openSection === 'hoverText'} 
            onToggle={() => toggleSection('hoverText')}
          >
            <ColorInputUI 
              color={hoverTextColor} 
              onChange={(e) => handleHoverTextColorChange(e.target.value)}
              onOpenPicker={() => setActiveColorPicker('hoverTextColor')}
            />
          </AccordionItem>

          <AccordionItem 
            title="Hover Stroke Color" 
            isOpen={openSection === 'hoverStroke'} 
            onToggle={() => toggleSection('hoverStroke')}
          >
            <ColorInputUI 
              color={hoverStrokeColor} 
              onChange={(e) => handleHoverStrokeChange(e.target.value)}
              onOpenPicker={() => setActiveColorPicker('hoverStrokeColor')}
            />
          </AccordionItem>
        </div>
      </div>

    </div>
  );
};

export default ButtonEditor;
