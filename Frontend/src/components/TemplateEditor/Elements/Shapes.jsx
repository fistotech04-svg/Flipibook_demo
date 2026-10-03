import React from 'react';

const shapeModules = import.meta.glob('../../../assets/Elements/Shapes/*.svg', { eager: true, query: '?raw', import: 'default' });
// Extract filename and svg content
const shapes = Object.keys(shapeModules).map(path => {
  const filename = path.split('/').pop().replace('.svg', '');
  let svgContent = shapeModules[path];
  
  // Remove fill="none" on the <svg> root so that it doesn't block inheritance from the <g> wrapper
  svgContent = svgContent.replace(/<svg[^>]*>/i, match => match.replace(/fill="none"/gi, 'fill="inherit"'));

  // Replace fill and stroke colors with #EA4724, except when they are "none"
  svgContent = svgContent.replace(/fill="(?!none|inherit)[^"]*"/gi, 'fill="#EA4724"');
  svgContent = svgContent.replace(/stroke="(?!none|inherit)[^"]*"/gi, 'stroke="#9f2d14ff"');
  
  // Extract dimensions for dynamic shapes
  let cx = 50, cy = 50, rx = 50;
  const viewBoxMatch = svgContent.match(/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/i);
  if (viewBoxMatch) {
    const w = parseFloat(viewBoxMatch[1]);
    const h = parseFloat(viewBoxMatch[2]);
    cx = w / 2;
    cy = h / 2;
    rx = Math.min(w, h) / 2;
  } else {
    const widthMatch = svgContent.match(/width="([0-9.]+)"/i);
    const heightMatch = svgContent.match(/height="([0-9.]+)"/i);
    if (widthMatch && heightMatch) {
      const w = parseFloat(widthMatch[1]);
      const h = parseFloat(heightMatch[2]);
      cx = w / 2;
      cy = h / 2;
      rx = Math.min(w, h) / 2;
    }
  }

  // Inject shape properties for specific elements to make them fully editable in ShapeProperties.jsx
  const lowerName = filename.toLowerCase();
  const isStar = lowerName === 'star';
  const isTriangle = lowerName === 'triangle';
  const isPentagon = lowerName === 'pentagon';
  const isHexagon = lowerName === 'hexagon';
  const isPolygon = isTriangle || isPentagon || isHexagon;
  const isRect = ['rectangle', 'square', 'rounded rectangle', 'pill', 'oval', 'minus'].includes(lowerName);
  
  if (isStar || isPolygon) {
    const shapeType = isStar ? 'star' : 'polygon';
    const count = isStar ? 5 : (isTriangle ? 3 : (isPentagon ? 5 : 6));
    const extraAttrs = ` data-shape-type="${shapeType}" data-count="${count}" data-radius="0" data-cx="${cx}" data-cy="${cy}" data-rx="${rx}"` + (isStar ? ' data-ratio="40"' : '');
    svgContent = svgContent.replace(/<(path|polygon)/i, `<$1${extraAttrs}`);
  } else if (isRect) {
    svgContent = svgContent.replace(/<rect/i, `<rect data-shape-type="rectangle"`);
  } else {
    const isCircle = lowerName === 'circle';
    const isLine = lowerName.includes('line');
    const shapeType = isCircle ? 'ellipse' : (isLine ? 'line' : 'vector-path');
    svgContent = svgContent.replace(/<(path|circle|ellipse|line|polygon|polyline|rect)/i, `<$1 data-shape-type="${shapeType}"`);
  }
  
  return {
    name: filename,
    svgContent
  };
});

const Shapes = ({ isFullView }) => {
  const displayShapes = isFullView ? shapes : shapes.slice(0, 8); // 2 rows, 4 columns = 8

  const handleDragStart = (e, shape) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      type: 'shape', 
      icon: { 
        html: shape.svgContent.replace(/fill="#EA4724"/gi, 'fill="inherit"').replace(/stroke="#EA4724"/gi, 'stroke="inherit"'), 
        name: shape.name, 
        fill: '#EA4724',
        stroke: 'none', 
        strokeWidth: '0' 
      } 
    }));
  };

  const handleClick = (shape) => {
    window.dispatchEvent(new CustomEvent('add-icon-to-editor', {
      detail: {
        icon: { 
          html: shape.svgContent.replace(/fill="#EA4724"/gi, 'fill="inherit"').replace(/stroke="#EA4724"/gi, 'stroke="inherit"'), 
          name: shape.name, 
          fill: '#EA4724',
          stroke: 'none', 
          strokeWidth: '0' 
        },
        isShape: true
      }
    }));
  };

  return (
    <div className="grid grid-cols-4 gap-[0.5vw]">
      {displayShapes.map((shape, idx) => (
        <div 
          key={idx} 
          className="aspect-square bg-gray-50 rounded-[0.4vw] border border-gray-100 flex items-center justify-center p-[0.5vw] cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all group"
          title={shape.name}
          draggable
          onDragStart={(e) => handleDragStart(e, shape)}
          onClick={() => handleClick(shape)}
        >
          <div 
            className="w-full h-full flex items-center justify-center transition-opacity [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
            dangerouslySetInnerHTML={{ __html: shape.svgContent }}
          />
        </div>
      ))}
    </div>
  );
};

export default Shapes;
