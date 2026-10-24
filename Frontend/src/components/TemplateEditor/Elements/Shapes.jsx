import React from 'react';
import { SHAPES_DATA } from './shapesData';

const shapes = SHAPES_DATA;

const Shapes = ({ isFullView }) => {
  const displayShapes = isFullView ? shapes : shapes.slice(0, 8); // 2 rows, 4 columns = 8

  const handleDragStart = (e, shape) => {
    const editorHtml = shape.svgContent
      .replace(/fill="(?!(?:none|inherit))[^"]*"/gi, 'fill="inherit"')
      .replace(/stroke="(?!(?:none|inherit))[^"]*"/gi, 'stroke="inherit"');

    e.dataTransfer.setData('application/json', JSON.stringify({ 
      type: 'shape', 
      icon: { 
        html: editorHtml, 
        name: shape.name, 
        fill: shape.fill,
        stroke: shape.stroke, 
        strokeWidth: shape.strokeWidth 
      } 
    }));
  };

  const handleClick = (shape) => {
    const editorHtml = shape.svgContent
      .replace(/fill="(?!(?:none|inherit))[^"]*"/gi, 'fill="inherit"')
      .replace(/stroke="(?!(?:none|inherit))[^"]*"/gi, 'stroke="inherit"');

    window.dispatchEvent(new CustomEvent('add-icon-to-editor', {
      detail: {
        icon: { 
          html: editorHtml, 
          name: shape.name, 
          fill: shape.fill,
          stroke: shape.stroke, 
          strokeWidth: shape.strokeWidth 
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
          className="aspect-square bg-gray-50 rounded-[0.4vw] border border-gray-100 flex items-center justify-center p-[0.5vw] cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group"
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
