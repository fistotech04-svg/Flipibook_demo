import React from 'react';

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

const ImageFraming = ({ isFullView }) => {
  const displayFrames = isFullView ? frames : frames.slice(0, 8); // 2 rows, 4 columns = 8

  return (
    <div className="grid grid-cols-4 gap-[0.5vw]">
      {displayFrames.map((frame, idx) => (
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
      ))}
    </div>
  );
};

export default ImageFraming;
