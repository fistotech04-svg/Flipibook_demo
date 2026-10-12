import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const frameModules = import.meta.glob('../../../assets/Elements/ImageFraming/*.svg', { eager: true, import: 'default' });
const rawFrameModules = import.meta.glob('../../../assets/Elements/ImageFraming/*.svg', { eager: true, query: '?raw', import: 'default' });
// Extract filename and url
const frames = Object.keys(frameModules).map(path => {
  const filename = path.split('/').pop().replace('.svg', '');
  return {
    name: filename,
    url: frameModules[path],
    raw: rawFrameModules[path]
  };
});

// Categories logic
const categorizedFrames = {
  Shapes: [],
  Grid: [],
  Alphabet: [],
  Numbers: []
};

frames.forEach(frame => {
  const name = frame.name.trim();
  const numPatterns = (frame.raw.match(/<pattern/g) || []).length;

  if (/^[0-9]$/.test(name)) {
    categorizedFrames.Numbers.push(frame);
  } else if (/^[A-Za-z]$/.test(name) || name === 'U (1)') {
    categorizedFrames.Alphabet.push(frame);
  } else if (numPatterns > 1 || name.toLowerCase().includes('grid') || name.toLowerCase().includes('collage') || name.toLowerCase().includes('colums') || name === 'Big Left' || name === 'Left Right' || name === 'Off set' || name === 'Split' || name === 'Top Bottom') {
    categorizedFrames.Grid.push(frame);
  } else {
    categorizedFrames.Shapes.push(frame);
  }
});

// Sort Alphabet and Numbers
categorizedFrames.Alphabet.sort((a, b) => a.name.localeCompare(b.name));
categorizedFrames.Numbers.sort((a, b) => parseInt(a.name) - parseInt(b.name));

const ImageFraming = ({ isFullView }) => {
  const [openCategories, setOpenCategories] = useState({
    Shapes: true,
    Grid: true,
    Alphabet: true,
    Numbers: true
  });

  const toggleCategory = (cat) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const renderFrameItem = (frame, idx) => (
    <div 
      key={idx} 
      draggable="true"
      onDragStart={(e) => {
        const uniqueId = Date.now();
        let rawSvg = frame.raw;
        // Clean up xml tags
        rawSvg = rawSvg.replace(/<\?xml.*?\?>/g, '');
        // Wrap the contents of the SVG in a group
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
        const svgEl = doc.documentElement;
        const width = svgEl.getAttribute('width') || '100';
        const height = svgEl.getAttribute('height') || '100';
        const svgCode = `<g id="image-frame-${uniqueId}" data-type="image-frame" cursor="pointer" data-frame-type="${frame.name}" transform="translate(0, 0)">${svgEl.innerHTML}</g>`;
        e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
          type: 'image-frame',
          svgContent: svgCode
        }));
      }}
      onClick={() => {
        const uniqueId = Date.now();
        let rawSvg = frame.raw;
        rawSvg = rawSvg.replace(/<\?xml.*?\?>/g, '');
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
        const svgEl = doc.documentElement;
        const svgCode = `<g id="image-frame-${uniqueId}" data-type="image-frame" cursor="pointer" data-frame-type="${frame.name}" transform="translate(50, 50)">${svgEl.innerHTML}</g>`;
        window.dispatchEvent(new CustomEvent('add-element-to-editor', {
          detail: { svgContent: svgCode }
        }));
      }}
      className="aspect-square bg-gray-50 rounded-[0.4vw] border border-gray-100 flex items-center justify-center p-[0.5vw] cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all group"
      title={frame.name}
    >
      <img 
        src={frame.url} 
        alt={frame.name} 
        className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity" 
      />
    </div>
  );

  if (!isFullView) {
    const displayFrames = frames.slice(0, 8); // 2 rows, 4 columns = 8
    return (
      <div className="grid grid-cols-4 gap-[0.5vw]">
        {displayFrames.map(renderFrameItem)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[1vw]">
      {Object.entries(categorizedFrames).map(([category, catFrames]) => {
        if (catFrames.length === 0) return null;
        const isOpen = openCategories[category];
        return (
          <div key={category} className="flex flex-col">
            <div 
              className="flex items-center gap-[0.5vw] py-[0.5vw] cursor-pointer hover:bg-gray-50 transition-colors rounded-[0.4vw] px-[0.5vw] -mx-[0.5vw]"
              onClick={() => toggleCategory(category)}
            >
              {isOpen ? <ChevronDown size="1vw" className="text-gray-500" /> : <ChevronRight size="1vw" className="text-gray-500" />}
              <span className="text-[0.85vw] font-semibold text-gray-800">{category}</span>
              <span className="text-[0.7vw] text-gray-400 ml-auto">{catFrames.length}</span>
            </div>
            {isOpen && (
              <div className="grid grid-cols-4 gap-[0.5vw] mt-[0.5vw]">
                {catFrames.map(renderFrameItem)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ImageFraming;
