import React from 'react';

const Audio = () => {
  const audioOptions = [
    {
      id: 'audio-icon',
      name: 'Audio Icon',
      svg: `<g data-type="audio-frame" data-fill-color="#ffffff" data-fill-opacity="1">
  <rect class="audio-fill-layer" width="48" height="48" rx="12" fill="#ffffff" stroke="#737373" stroke-width="2" opacity="1" pointer-events="none"></rect>
  <rect class="svg-image-stroke-overlay" width="48" height="48" rx="12" fill="transparent" pointer-events="all" />
  <g class="audio-content-group" pointer-events="none">
    <g class="prev-icon" display="none">
      <polygon points="12 24 18 18 18 30" fill="#737373"></polygon>
      <rect x="9" y="18" width="2" height="12" fill="#737373"></rect>
    </g>
    <g class="play-pause-icon">
      <polygon points="20 16 32 24 20 32" fill="#737373" stroke="#737373" stroke-width="2" stroke-linejoin="round"></polygon>
    </g>
    <g class="next-icon" display="none">
      <polygon points="36 24 30 18 30 30" fill="#737373"></polygon>
      <rect x="37" y="18" width="2" height="12" fill="#737373"></rect>
    </g>
  </g>
</g>`
    },
    {
      id: 'audio-player',
      name: 'Audio Player',
      svg: `<g data-type="audio-frame" data-fill-color="#f0f2f5" data-fill-opacity="1">
  <rect class="audio-fill-layer" width="300" height="54" rx="27" fill="#f0f2f5"></rect>
  <g class="audio-content-group" pointer-events="none">
    <g class="prev-icon" display="none" transform="translate(12, 17)">
      <polygon points="10 12 19 3 19 21" fill="#333"></polygon>
      <rect x="5" y="3" width="3" height="18" fill="#333"></rect>
    </g>
    <g class="play-pause-icon" transform="translate(34, 17)">
      <polygon points="5 3 19 12 5 21 5 3" fill="#333"></polygon>
    </g>
    <g class="next-icon" display="none" transform="translate(56, 17)">
      <polygon points="14 12 5 3 5 21" fill="#333"></polygon>
      <rect x="16" y="3" width="3" height="18" fill="#333"></rect>
    </g>
    <text class="audio-time-text" x="85" y="32" font-family="sans-serif" font-size="14" fill="#444" font-weight="500">Audio Player</text>
    <rect x="165" y="25" width="65" height="4" rx="2" fill="#ccc"></rect>
    <g transform="translate(245, 17)" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#333"></polygon>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </g>
    <g transform="translate(275, 27)">
      <circle cx="0" cy="-6" r="2" fill="#333"></circle>
      <circle cx="0" cy="0" r="2" fill="#333"></circle>
      <circle cx="0" cy="6" r="2" fill="#333"></circle>
    </g>
  </g>
</g>`
    }
  ];

  const handleDragStart = (e, option) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      type: 'icon', 
      icon: { 
        html: option.svg, 
        name: option.name, 
        fill: '#ffffff',
        stroke: 'none', 
        strokeWidth: '0',
        isShape: true
      } 
    }));
  };

  const handleClick = (option) => {
    window.dispatchEvent(new CustomEvent('add-icon-to-editor', {
      detail: {
        icon: { 
          html: option.svg, 
          name: option.name, 
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
    <div className="grid grid-cols-2 gap-[0.5vw]">
      {audioOptions.map((option) => (
        <div 
          key={option.id} 
          draggable
          onDragStart={(e) => handleDragStart(e, option)}
          onClick={() => handleClick(option)}
          className="h-[4vw] bg-white rounded-[0.4vw] border border-gray-100 flex items-center justify-center p-[0.5vw] cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all group relative"
        >
          {option.id === 'audio-icon' ? (
            <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" className="transition-colors">
              <rect x="2" y="2" width="20" height="20" rx="6" stroke="#8c8c8c" strokeWidth="1.5" fill="none" className="group-hover:stroke-indigo-500 transition-colors" />
              <polygon points="10 8 16 12 10 16 10 8" fill="#8c8c8c" stroke="none" className="group-hover:fill-indigo-500 transition-colors" />
            </svg>
          ) : (
            <div className="w-[85%] h-[1.8vw] bg-[#f0f2f5] rounded-full flex items-center px-[0.6vw] gap-[0.4vw]">
              <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="black" stroke="black">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span className="text-[0.55vw] text-[#444] font-medium whitespace-nowrap">0:00 / 7:28</span>
              <div className="flex-1 h-[2px] bg-[#ccc] mx-[0.1vw]"></div>
              <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="black"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              <div className="flex flex-col gap-[2px] ml-[0.1vw]">
                <div className="w-[3px] h-[3px] bg-black rounded-full"></div>
                <div className="w-[3px] h-[3px] bg-black rounded-full"></div>
                <div className="w-[3px] h-[3px] bg-black rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Audio;
