import React from 'react';

const Audio = () => {
  const audioOptions = [
    {
      id: 'audio-icon',
      name: 'Audio Icon',
      svg: `<g data-type="audio-frame" data-fill-color="#ffffff" data-fill-opacity="1">
  <rect class="audio-fill-layer" width="96" height="48" rx="12" fill="#ffffff" stroke="#737373" stroke-width="2" opacity="1" pointer-events="none"></rect>
  <rect class="svg-image-stroke-overlay" width="96" height="48" rx="12" fill="transparent" pointer-events="all" />
  <g class="audio-content-group" pointer-events="none">
    <g class="prev-icon" transform="translate(11, 0)" style="opacity: 0.5; pointer-events: none;">
      <polygon points="15 24 21 18 21 30" fill="#737373"></polygon>
      <polygon points="9 24 15 18 15 30" fill="#737373"></polygon>
    </g>
    <g class="play-pause-icon" transform="translate(24, 0)">
      <polygon points="20 16 32 24 20 32" fill="#737373" stroke="#737373" stroke-width="2" stroke-linejoin="round"></polygon>
    </g>
    <g class="next-icon" transform="translate(37, 0)" style="opacity: 0.5; pointer-events: none;">
      <polygon points="33 24 27 18 27 30" fill="#737373"></polygon>
      <polygon points="39 24 33 18 33 30" fill="#737373"></polygon>
    </g>
  </g>
</g>`
    },
    {
      id: 'audio-player',
      name: 'Audio Player',
      svg: `<g data-type="audio-frame" data-fill-color="#ffffff" data-fill-opacity="1">
  <defs>
    <clipPath id="vol-clip">
      <rect class="vol-clip-rect" x="355" y="0" width="0" height="60" />
    </clipPath>
  </defs>
  <style>
    .vol-clip-rect { transition: width 0.3s ease-in-out; }
    g[data-type="audio-frame"]:hover .vol-clip-rect { width: 105px; }
    .volume-slider-part { opacity: 0; transition: opacity 0.3s ease-in-out; clip-path: url(#vol-clip); }
    g[data-type="audio-frame"]:hover .volume-slider-part { opacity: 1; }
    .loop-icon { transform: translate(375px, 22px) scale(0.75); transition: transform 0.3s ease-in-out; }
    g[data-type="audio-frame"]:hover .loop-icon { transform: translate(460px, 22px) scale(0.75); }
    .audio-fill-layer { width: 420px; transition: width 0.3s ease-in-out; }
    g[data-type="audio-frame"]:hover .audio-fill-layer { width: 500px; }
  </style>
  <rect class="audio-fill-layer" height="60" rx="30" fill="#ffffff" stroke="#e5e7eb" stroke-width="1.5"></rect>
  <g class="audio-content-group" pointer-events="none">
    <g class="prev-icon" transform="translate(25, 18)" style="opacity: 0.5; pointer-events: none; cursor: default;">
      <rect x="0" y="0" width="24" height="24" fill="transparent"></rect>
      <polygon points="11 12 20 5 20 19" fill="#222"></polygon>
      <polygon points="4 12 13 5 13 19" fill="#222"></polygon>
    </g>
    <g class="play-pause-btn" pointer-events="all" cursor="pointer">
      <circle class="play-pause-bg" cx="70" cy="30" r="20" fill="#222" />
      <g class="play-pause-icon" transform="translate(58, 19)">
        <polygon points="7 4 17 11 7 18 7 4" fill="#ffffff"></polygon>
      </g>
    </g>
    <g class="next-icon" transform="translate(91, 18)" style="opacity: 0.5; pointer-events: none; cursor: default;">
      <rect x="0" y="0" width="24" height="24" fill="transparent"></rect>
      <polygon points="4 5 13 12 4 19" fill="#222"></polygon>
      <polygon points="11 5 20 12 11 19" fill="#222"></polygon>
    </g>
    <text class="audio-current-time" x="125" y="34" font-family="sans-serif" font-size="13" fill="#222" font-weight="500">0:00</text>
    <g class="progress-group" pointer-events="all" cursor="pointer">
      <rect x="160" y="15" width="125" height="30" fill="transparent"></rect>
      <rect class="progress-bg" x="160" y="28" width="125" height="4" rx="2" fill="#e5e7eb" pointer-events="none"></rect>
      <rect class="progress-fill" x="160" y="28" width="0" height="4" rx="2" fill="#222" pointer-events="none"></rect>
      <circle class="progress-knob" cx="160" cy="30" r="6.5" fill="#222" stroke="#ffffff" stroke-width="2.5" pointer-events="none"></circle>
    </g>
    <text class="audio-total-time" x="295" y="34" font-family="sans-serif" font-size="13" fill="#222" font-weight="500">0:00</text>
    <g class="volume-group" pointer-events="all" cursor="pointer">
      <rect x="335" y="15" width="150" height="30" fill="transparent"></rect>
      <g class="volume-icon" transform="translate(340, 20)" pointer-events="none">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#222"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      </g>
      <g class="volume-slider-part" pointer-events="none">
        <rect class="volume-bg" x="370" y="28" width="75" height="4" rx="2" fill="#e5e7eb"></rect>
        <rect class="volume-fill" x="370" y="28" width="75" height="4" rx="2" fill="#222"></rect>
        <circle class="volume-knob" cx="445" cy="30" r="6.5" fill="#222" stroke="#ffffff" stroke-width="2.5"></circle>
      </g>
      <g class="loop-icon" pointer-events="all" cursor="pointer">
        <rect x="-5" y="-5" width="34" height="34" fill="transparent"></rect>
        <path d="M17 2l4 4-4 4" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 11v-1a4 4 0 0 1 4-4h14" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 22l-4-4 4-4" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 13v1a4 4 0 0 1-4 4H3" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
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
            <div className="w-[95%] h-[2vw] bg-white rounded-full border border-gray-200 flex items-center px-[0.4vw] gap-[0.3vw] shadow-sm">
              <div className="w-[1.2vw] h-[1.2vw] bg-[#222] rounded-full flex items-center justify-center shrink-0">
                <svg width="0.5vw" height="0.5vw" viewBox="0 0 24 24" fill="white">
                  <polygon points="7 4 17 11 7 18 7 4" />
                </svg>
              </div>
              <span className="text-[0.45vw] text-[#222] font-medium">0:00</span>
              <div className="flex-1 h-[2px] bg-gray-200 rounded-full relative">
                <div className="absolute left-0 top-0 h-full w-[0%] bg-[#222] rounded-full"></div>
                <div className="absolute left-[0%] top-1/2 -translate-y-1/2 w-[0.4vw] h-[0.4vw] bg-[#222] rounded-full border border-white"></div>
              </div>
              <span className="text-[0.45vw] text-[#222] font-medium">0:00</span>
              <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#222"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 2l4 4-4 4"/>
                <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
                <path d="M7 22l-4-4 4-4"/>
                <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Audio;
