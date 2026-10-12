import React from 'react';
import { Table2 } from 'lucide-react';

const Table = ({ isFullView }) => {
  // Placeholder array
  const placeholders = Array(isFullView ? 12 : 4).fill(0);

  const getTableSvg = (isClick) => {
    const transform = isClick ? ' transform="translate(50, 50)"' : '';
    return `<g data-type="table-frame"${transform} data-rows="3" data-cols="3" data-fill-color="#ffffff" data-fill-opacity="1">
      <rect class="table-fill-layer" width="300" height="200" fill="#ffffff" stroke="#d1d5db" stroke-width="2" pointer-events="none" />
      <line x1="100" y1="0" x2="100" y2="200" stroke="#d1d5db" stroke-width="1" pointer-events="none" />
      <line x1="200" y1="0" x2="200" y2="200" stroke="#d1d5db" stroke-width="1" pointer-events="none" />
      <line x1="0" y1="66.6" x2="300" y2="66.6" stroke="#d1d5db" stroke-width="1" pointer-events="none" />
      <line x1="0" y1="133.3" x2="300" y2="133.3" stroke="#d1d5db" stroke-width="1" pointer-events="none" />
      <rect class="svg-image-stroke-overlay" width="300" height="200" fill="transparent" pointer-events="all" />
    </g>`;
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'icon',
      icon: {
        html: getTableSvg(false),
        name: 'Table',
        fill: '#ffffff',
        stroke: 'none',
        strokeWidth: '0',
        isShape: true
      }
    }));
  };

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('add-icon-to-editor', {
      detail: {
        icon: {
          html: getTableSvg(true),
          name: 'Table',
          fill: '#ffffff',
          stroke: 'none',
          strokeWidth: '0',
          isShape: true
        },
        isShape: true
      }
    }));
  };

  return (
    <div className="grid grid-cols-4 gap-[0.5vw]">
      {placeholders.map((_, idx) => (
        <div 
          key={idx} 
          draggable="true"
          onDragStart={handleDragStart}
          onClick={handleClick}
          className="aspect-square bg-gray-50 rounded-[0.4vw] border border-gray-100 flex items-center justify-center p-[0.5vw] cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all group"
        >
          <Table2 size="1.5vw" className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
        </div>
      ))}
    </div>
  );
};

export default Table;
