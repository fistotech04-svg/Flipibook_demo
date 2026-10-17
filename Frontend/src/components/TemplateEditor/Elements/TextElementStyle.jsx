import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { createKineticSvg } from './kineticTypographyUtils';

const KINETIC_PRESETS = [
  {
    id: 'kinetic-slide-up',
    name: 'Kinetic Slide Up',
    category: 'kinetic',
    tag: 'Promo',
    bg: '#0F172A',
    textColor: '#FFFFFF',
    fontFamily: 'Inter',
    words: ['CODING', 'KINETIC', 'TYPE'],
    animType: 'slide-up',
    duration: 3800,
    stagger: 50,
    fontSize: 34
  },
  {
    id: 'kinetic-neon-pulse',
    name: 'Cyber Neon Pulse',
    category: 'kinetic',
    tag: 'Neon',
    bg: '#090D16',
    textColor: '#00F0FF',
    fontFamily: 'Inter',
    words: ['CYBER', 'NEON', 'PULSE'],
    animType: 'pulse-glow',
    duration: 2600,
    stagger: 60,
    fontSize: 34
  },
  {
    id: 'kinetic-pop-bounce',
    name: 'Motion Pop Bounce',
    category: 'kinetic',
    tag: 'Bouncy',
    bg: '#18181B',
    textColor: '#FBBF24',
    fontFamily: 'Poppins',
    words: ['MOTION', 'BOUNCE', 'POP'],
    animType: 'pop-bounce',
    duration: 3200,
    stagger: 45,
    fontSize: 34
  },
  {
    id: 'kinetic-wave-flow',
    name: 'Harmonic Wave',
    category: 'kinetic',
    tag: 'Wave',
    bg: '#064E3B',
    textColor: '#34D399',
    fontFamily: 'Inter',
    words: ['SMOOTH', 'RHYTHMIC', 'FLOW'],
    animType: 'wave-float',
    duration: 2400,
    stagger: 70,
    fontSize: 34
  },
  {
    id: 'kinetic-flip-3d',
    name: '3D Flip Reveal',
    category: 'kinetic',
    tag: '3D Tilt',
    bg: '#31104B',
    textColor: '#E879F9',
    fontFamily: 'Inter',
    words: ['FUTURE', 'DIMENSION', '3D'],
    animType: 'flip-3d',
    duration: 3600,
    stagger: 55,
    fontSize: 34
  },
  {
    id: 'kinetic-slide-down',
    name: 'Kinetic Top Drop',
    category: 'kinetic',
    tag: 'Drop',
    bg: '#1E1B4B',
    textColor: '#818CF8',
    fontFamily: 'Inter',
    words: ['CREATIVE', 'DESIGN', 'STUDIO'],
    animType: 'slide-down',
    duration: 3600,
    stagger: 50,
    fontSize: 34
  }
];

const TextElementStyle = ({ isFullView }) => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className={`w-full flex flex-col gap-[0.8vw] ${isFullView ? 'p-[1vw]' : ''}`}>
      {/* Category Tabs */}
      {isFullView && (
        <div className="flex items-center gap-[0.4vw] p-[0.2vw] bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-[0.4vw] text-[0.75vw] font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('kinetic')}
            className={`flex-1 py-[0.4vw] text-[0.75vw] font-bold rounded-md transition-all flex items-center justify-center gap-[0.25vw] cursor-pointer ${
              activeTab === 'kinetic'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles size="0.75vw" className="text-amber-500" />
            Kinetic Animated
          </button>
          <button
            onClick={() => setActiveTab('poster')}
            className={`flex-1 py-[0.4vw] text-[0.75vw] font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'poster'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Poster Styles
          </button>
        </div>
      )}

      {/* Embedded Live CSS for sidebar previews */}
      <style>{`
        @keyframes preview-slide-up {
          0%, 100% { transform: translateY(115%); opacity: 0; }
          25%, 75% { transform: translateY(0%); opacity: 1; }
        }
        @keyframes preview-slide-down {
          0%, 100% { transform: translateY(-115%); opacity: 0; }
          25%, 75% { transform: translateY(0%); opacity: 1; }
        }
        @keyframes preview-pop-bounce {
          0%, 100% { transform: scale(0.2) translateY(14px); opacity: 0; }
          30% { transform: scale(1.15) translateY(-2px); opacity: 1; }
          45%, 75% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes preview-wave-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes preview-pulse-glow {
          0%, 100% { transform: scale(0.96); opacity: 0.7; }
          50% { transform: scale(1.06); filter: drop-shadow(0 0 8px currentColor); opacity: 1; }
        }
        @keyframes preview-flip-3d {
          0%, 100% { transform: perspective(250px) rotateX(-90deg); opacity: 0; }
          25%, 75% { transform: perspective(250px) rotateX(0deg); opacity: 1; }
        }
      `}</style>

      {/* Grid of presets */}
      <div className="w-full grid grid-cols-2 gap-[1vw]">
        {/* Kinetic Presets */}
        {(isFullView ? (activeTab === 'all' || activeTab === 'kinetic') : true) &&
          (isFullView ? KINETIC_PRESETS : KINETIC_PRESETS.slice(0, 2)).map((preset) => (
            <button
              key={preset.id}
              draggable="true"
              onDragStart={(e) => {
                const uniqueId = Date.now();
                const svgCode = createKineticSvg({
                  uniqueId,
                  words: preset.words,
                  animType: preset.animType,
                  duration: preset.duration,
                  stagger: preset.stagger,
                  fontFamily: preset.fontFamily,
                  textColor: preset.textColor,
                  bgColor: preset.bg,
                  fontSize: preset.fontSize,
                  isTranslate: false
                });
                e.dataTransfer.setData(
                  'application/x-flipbook-element',
                  JSON.stringify({
                    type: 'text',
                    svgContent: svgCode
                  })
                );
              }}
              onClick={() => {
                const uniqueId = Date.now();
                const svgCode = createKineticSvg({
                  uniqueId,
                  words: preset.words,
                  animType: preset.animType,
                  duration: preset.duration,
                  stagger: preset.stagger,
                  fontFamily: preset.fontFamily,
                  textColor: preset.textColor,
                  bgColor: preset.bg,
                  fontSize: preset.fontSize,
                  isTranslate: false
                });
                window.dispatchEvent(
                  new CustomEvent('add-element-to-editor', {
                    detail: { svgContent: svgCode }
                  })
                );
              }}
              className="flex flex-col items-center justify-between p-[0.6vw] border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer w-full group relative overflow-hidden bg-white"
            >
              {/* Badge */}
              <div className="absolute top-[0.4vw] right-[0.4vw] px-[0.4vw] py-[0.1vw] rounded-full text-[0.6vw] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-[0.2vw] z-10">
                <Sparkles size="0.6vw" />
                {preset.tag}
              </div>

              {/* Live Preview Container */}
              <div
                className="w-full h-[6.5vw] rounded-lg flex flex-col justify-center items-center overflow-hidden p-[0.5vw] transition-transform group-hover:scale-[1.02]"
                style={{ backgroundColor: preset.bg }}
              >
                <div className="flex flex-col items-center gap-[0.15vw] select-none">
                  {preset.words.map((word, wIdx) => (
                    <div key={wIdx} className="overflow-hidden flex leading-none">
                      {word.split('').map((char, cIdx) => {
                        const delayMs = 80 + (wIdx * word.length + cIdx) * preset.stagger;
                        return (
                          <span
                            key={cIdx}
                            className="inline-block text-[0.9vw] font-black uppercase tracking-wider"
                            style={{
                              color: preset.textColor,
                              animation: `preview-${preset.animType} ${preset.duration}ms infinite cubic-bezier(0.77, 0, 0.175, 1)`,
                              animationDelay: `${delayMs}ms`
                            }}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Title label */}
              <div className="w-full flex items-center justify-between mt-[0.5vw] px-[0.2vw]">
                <span className="text-[0.75vw] font-bold text-gray-800 truncate">
                  {preset.name}
                </span>
                <span className="text-[0.65vw] text-indigo-500 font-semibold uppercase">
                  Animated
                </span>
              </div>
            </button>
          ))}

        {/* Poster Style Presets */}
        {(isFullView ? (activeTab === 'all' || activeTab === 'poster') : true) && (
          <>
            {/* Comic Poster */}
            <button
              draggable="true"
              onDragStart={(e) => {
                const uniqueId = Date.now();
                const svgCode = `
                  <g id="typography-${uniqueId}" data-type="text" cursor="pointer" style="--stroke-width: 2; --shadow-x: 4px; --shadow-y: 4px; --skew-angle: 0deg;">
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Bangers&amp;display=swap');
                      #typography-${uniqueId} text, #typography-${uniqueId} div {
                        font-family: 'Bangers', cursive;
                        letter-spacing: 0.05em;
                        stroke-width: var(--stroke-width);
                        -webkit-text-stroke-width: var(--stroke-width);
                        filter: drop-shadow(var(--shadow-x) var(--shadow-y) 0px #000000);
                        transform: skewX(var(--skew-angle));
                        color: inherit;
                      }
                    </style>
                    <text x="20" y="45" font-size="40" font-family="Bangers" fill="#D32F2F" stroke="#000000">GOOD THINGS</text>
                    <text x="10" y="95" font-size="55" font-family="Bangers" fill="#FBC02D" stroke="#000000">FEARLESS</text>
                  </g>
                `;
                e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
                  type: 'text',
                  svgContent: svgCode
                }));
              }}
              onClick={() => {
                const uniqueId = Date.now();
                const svgCode = `
                  <g id="typography-${uniqueId}" data-type="text" cursor="pointer" transform="translate(50, 50)" style="--stroke-width: 2; --shadow-x: 4px; --shadow-y: 4px; --skew-angle: 0deg;">
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Bangers&amp;display=swap');
                      #typography-${uniqueId} text, #typography-${uniqueId} div {
                        font-family: 'Bangers', cursive;
                        letter-spacing: 0.05em;
                        stroke-width: var(--stroke-width);
                        -webkit-text-stroke-width: var(--stroke-width);
                        filter: drop-shadow(var(--shadow-x) var(--shadow-y) 0px #000000);
                        transform: skewX(var(--skew-angle));
                        color: inherit;
                      }
                    </style>
                    <text x="20" y="45" font-size="40" font-family="Bangers" fill="#D32F2F" stroke="#000000">GOOD THINGS</text>
                    <text x="10" y="95" font-size="55" font-family="Bangers" fill="#FBC02D" stroke="#000000">FEARLESS</text>
                  </g>
                `;
                window.dispatchEvent(new CustomEvent('add-element-to-editor', {
                  detail: { svgContent: svgCode }
                }));
              }}
              className="flex flex-col items-center justify-between p-[0.6vw] border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer w-full bg-white group"
            >
              <div className="w-full h-[6.5vw] rounded-lg bg-gray-50 flex items-center justify-center p-[0.5vw]">
                <svg width="100%" height="100%" viewBox="0 0 250 120" style={{ pointerEvents: 'none' }}>
                  <text x="20" y="45" fontFamily="'Bangers', cursive" fontSize="40" fill="#D32F2F" stroke="#000" strokeWidth="2" filter="drop-shadow(3px 3px 0px #000)">GOOD THINGS</text>
                  <text x="5" y="95" fontFamily="'Bangers', cursive" fontSize="60" fill="#FBC02D" stroke="#000" strokeWidth="2" filter="drop-shadow(4px 4px 0px #000)">FEARLESS</text>
                </svg>
              </div>
              <div className="w-full flex items-center justify-between mt-[0.5vw] px-[0.2vw]">
                <span className="text-[0.75vw] font-bold text-gray-800">Comic Poster</span>
                <span className="text-[0.65vw] text-gray-400 font-semibold uppercase">Classic</span>
              </div>
            </button>

            {/* We're Hiring */}
            <button
              draggable="true"
              onDragStart={(e) => {
                const uniqueId = Date.now();
                const svgCode = `
                  <g id="typography-${uniqueId}" data-type="text" cursor="pointer" style="--stroke-width: 0; --shadow-x: 2px; --shadow-y: 2px; --skew-angle: 0deg;">
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Satisfy&amp;display=swap');
                      #typography-${uniqueId} text, #typography-${uniqueId} div {
                        font-family: 'Satisfy', cursive;
                        stroke-width: var(--stroke-width);
                        -webkit-text-stroke-width: var(--stroke-width);
                        filter: drop-shadow(var(--shadow-x) var(--shadow-y) 0px rgba(0,0,0,0.15));
                        transform: skewX(var(--skew-angle));
                        color: inherit;
                      }
                    </style>
                    <text x="10" y="30" font-size="30" font-family="Satisfy" fill="#025EE8" stroke="#000000">We're</text>
                    <text x="30" y="60" font-size="30" font-family="Satisfy" fill="#025EE8" stroke="#000000">Hiring!</text>
                  </g>
                `;
                e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
                  type: 'text',
                  svgContent: svgCode
                }));
              }}
              onClick={() => {
                const uniqueId = Date.now();
                const svgCode = `
                  <g id="typography-${uniqueId}" data-type="text" cursor="pointer" transform="translate(50, 50)" style="--stroke-width: 0; --shadow-x: 2px; --shadow-y: 2px; --skew-angle: 0deg;">
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Satisfy&amp;display=swap');
                      #typography-${uniqueId} text, #typography-${uniqueId} div {
                        font-family: 'Satisfy', cursive;
                        stroke-width: var(--stroke-width);
                        -webkit-text-stroke-width: var(--stroke-width);
                        filter: drop-shadow(var(--shadow-x) var(--shadow-y) 0px rgba(0,0,0,0.15));
                        transform: skewX(var(--skew-angle));
                        color: inherit;
                      }
                    </style>
                    <text x="10" y="30" font-size="30" fill="#025EE8" stroke="#000000">We're</text>
                    <text x="30" y="60" font-size="30" fill="#025EE8" stroke="#000000">Hiring!</text>
                  </g>
                `;
                window.dispatchEvent(new CustomEvent('add-element-to-editor', {
                  detail: { svgContent: svgCode }
                }));
              }}
              className="flex flex-col items-center justify-between p-[0.6vw] border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer w-full bg-white group"
            >
              <div className="w-full h-[6.5vw] rounded-lg bg-gray-50 flex items-center justify-center p-[0.5vw]">
                <svg width="100%" height="100%" viewBox="0 0 250 120" style={{ pointerEvents: 'none' }}>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Satisfy&amp;display=swap');
                  </style>
                  <text x="30" y="50" fontFamily="'Satisfy', cursive" fontSize="60" fill="#025EE8" filter="drop-shadow(2px 2px 0px rgba(0,0,0,0.15))">We're</text>
                  <text x="70" y="105" fontFamily="'Satisfy', cursive" fontSize="70" fill="#025EE8" filter="drop-shadow(2px 2px 0px rgba(0,0,0,0.15))">Hiring!</text>
                </svg>
              </div>
              <div className="w-full flex items-center justify-between mt-[0.5vw] px-[0.2vw]">
                <span className="text-[0.75vw] font-bold text-gray-800">We're Hiring</span>
                <span className="text-[0.65vw] text-gray-400 font-semibold uppercase">Script</span>
              </div>
            </button>

            {/* Additional Poster Presets in Full View */}
            {isFullView && (
              <>
                {/* Free Shipping */}
                <button
              draggable="true"
              onDragStart={(e) => {
                const uniqueId = Date.now();
                const svgCode = `
                  <g id="typography-${uniqueId}" data-type="text" cursor="pointer" style="--stroke-width: 3; --shadow-x: 0px; --shadow-y: 0px; --skew-angle: 0deg;">
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&amp;display=swap');
                      #typography-${uniqueId} text, #typography-${uniqueId} div {
                        font-family: 'Oswald', sans-serif;
                        font-weight: 700;
                        stroke-width: var(--stroke-width);
                        -webkit-text-stroke-width: var(--stroke-width);
                        stroke-linejoin: round;
                        paint-order: stroke fill;
                        filter: drop-shadow(var(--shadow-x) var(--shadow-y) 0px rgba(0,0,0,0.15));
                        transform: skewX(var(--skew-angle));
                        color: inherit;
                      }
                    </style>
                    <text x="10" y="40" font-size="36" font-family="Oswald" fill="#E60012" stroke="#FFD700">FREE</text>
                    <text x="10" y="85" font-size="36" font-family="Oswald" fill="#FFD700" stroke="#FFD700">SHIPPING</text>
                  </g>
                `;
                e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
                  type: 'text',
                  svgContent: svgCode
                }));
              }}
              onClick={() => {
                const uniqueId = Date.now();
                const svgCode = `
                  <g id="typography-${uniqueId}" data-type="text" cursor="pointer" transform="translate(50, 50)" style="--stroke-width: 3; --shadow-x: 0px; --shadow-y: 0px; --skew-angle: 0deg;">
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&amp;display=swap');
                      #typography-${uniqueId} text, #typography-${uniqueId} div {
                        font-family: 'Oswald', sans-serif;
                        font-weight: 700;
                        stroke-width: var(--stroke-width);
                        -webkit-text-stroke-width: var(--stroke-width);
                        stroke-linejoin: round;
                        paint-order: stroke fill;
                        filter: drop-shadow(var(--shadow-x) var(--shadow-y) 0px rgba(0,0,0,0.15));
                        transform: skewX(var(--skew-angle));
                        color: inherit;
                      }
                    </style>
                    <text x="10" y="40" font-size="36" font-family="Oswald" fill="#E60012" stroke="#FFD700">FREE</text>
                    <text x="10" y="85" font-size="36" font-family="Oswald" fill="#FFD700" stroke="#FFD700">SHIPPING</text>
                  </g>
                `;
                window.dispatchEvent(new CustomEvent('add-element-to-editor', {
                  detail: { svgContent: svgCode }
                }));
              }}
              className="flex flex-col items-center justify-between p-[0.6vw] border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer w-full bg-white group"
            >
              <div className="w-full h-[6.5vw] rounded-lg bg-gray-50 flex items-center justify-center p-[0.5vw]">
                <svg width="100%" height="100%" viewBox="0 0 250 120" style={{ pointerEvents: 'none' }}>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&amp;display=swap');
                  </style>
                  <text x="10" y="55" fontFamily="'Oswald', sans-serif" fontWeight="700" fontSize="55" fill="#E60012" stroke="#FFD700" strokeWidth="4" style={{ paintOrder: 'stroke fill', strokeLinejoin: 'round' }}>FREE</text>
                  <text x="10" y="115" fontFamily="'Oswald', sans-serif" fontWeight="700" fontSize="55" fill="#FFD700" stroke="#FFD700" strokeWidth="4" style={{ paintOrder: 'stroke fill', strokeLinejoin: 'round' }}>SHIPPING</text>
                </svg>
              </div>
              <div className="w-full flex items-center justify-between mt-[0.5vw] px-[0.2vw]">
                <span className="text-[0.75vw] font-bold text-gray-800">Free Shipping</span>
                <span className="text-[0.65vw] text-gray-400 font-semibold uppercase">Badge</span>
              </div>
            </button>

            {/* Golden Hour */}
            <button
              draggable="true"
              onDragStart={(e) => {
                const uniqueId = Date.now();
                const svgCode = `
                  <g id="typography-${uniqueId}" data-type="text" cursor="pointer" style="--stroke-width: 0; --shadow-x: 2px; --shadow-y: 2px; --skew-angle: 0deg;">
                    <style>
                      #typography-${uniqueId} text, #typography-${uniqueId} div {
                        font-family: 'Courier New', Courier, monospace;
                        stroke-width: var(--stroke-width);
                        -webkit-text-stroke-width: var(--stroke-width);
                        stroke-linejoin: round;
                        paint-order: stroke fill;
                        filter: drop-shadow(var(--shadow-x) var(--shadow-y) 0px rgba(0,0,0,0.25));
                        transform: skewX(var(--skew-angle));
                        color: inherit;
                      }
                    </style>
                    <text x="10" y="35" font-size="36" font-family="Courier New" fill="#DAA520" stroke="#000000">GOLDEN</text>
                    <text x="35" y="75" font-size="36" font-family="Courier New" fill="#DAA520" stroke="#000000">HOUR</text>
                  </g>
                `;
                e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
                  type: 'text',
                  svgContent: svgCode
                }));
              }}
              onClick={() => {
                const uniqueId = Date.now();
                const svgCode = `
                  <g id="typography-${uniqueId}" data-type="text" cursor="pointer" transform="translate(50, 50)" style="--stroke-width: 0; --shadow-x: 2px; --shadow-y: 2px; --skew-angle: 0deg;">
                    <style>
                      #typography-${uniqueId} text, #typography-${uniqueId} div {
                        font-family: 'Courier New', Courier, monospace;
                        stroke-width: var(--stroke-width);
                        -webkit-text-stroke-width: var(--stroke-width);
                        stroke-linejoin: round;
                        paint-order: stroke fill;
                        filter: drop-shadow(var(--shadow-x) var(--shadow-y) 0px rgba(0,0,0,0.25));
                        transform: skewX(var(--skew-angle));
                        color: inherit;
                      }
                    </style>
                    <text x="10" y="35" font-size="36" font-family="Courier New" fill="#DAA520" stroke="#000000">GOLDEN</text>
                    <text x="35" y="75" font-size="36" font-family="Courier New" fill="#DAA520" stroke="#000000">HOUR</text>
                  </g>
                `;
                window.dispatchEvent(new CustomEvent('add-element-to-editor', {
                  detail: { svgContent: svgCode }
                }));
              }}
              className="flex flex-col items-center justify-between p-[0.6vw] border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer w-full bg-white group"
            >
              <div className="w-full h-[6.5vw] rounded-lg bg-gray-50 flex items-center justify-center p-[0.5vw]">
                <svg width="100%" height="100%" viewBox="0 0 250 120" style={{ pointerEvents: 'none' }}>
                  <text x="25" y="55" fontFamily="'Courier New', Courier, monospace" fontSize="55" fill="#DAA520" filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.25))">GOLDEN</text>
                  <text x="65" y="115" fontFamily="'Courier New', Courier, monospace" fontSize="55" fill="#DAA520" filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.25))">HOUR</text>
                </svg>
              </div>
              <div className="w-full flex items-center justify-between mt-[0.5vw] px-[0.2vw]">
                <span className="text-[0.75vw] font-bold text-gray-800">Golden Hour</span>
                <span className="text-[0.65vw] text-gray-400 font-semibold uppercase">Serif</span>
              </div>
            </button>

            {/* Holiday */}
            <button
              draggable="true"
              onDragStart={(e) => {
                const uniqueId = Date.now();
                const svgCode = `
                  <g id="typography-${uniqueId}" data-type="text" cursor="pointer" style="--stroke-width: 3; --shadow-x: 2px; --shadow-y: 2px; --skew-angle: 0deg;">
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&amp;display=swap');
                      #typography-${uniqueId} text, #typography-${uniqueId} div {
                        font-family: 'Playfair Display', serif;
                        font-weight: 700;
                        stroke-width: var(--stroke-width);
                        -webkit-text-stroke-width: var(--stroke-width);
                        stroke-linejoin: round;
                        paint-order: stroke fill;
                        filter: drop-shadow(var(--shadow-x) var(--shadow-y) 0px rgba(0,0,0,0.25));
                        transform: skewX(var(--skew-angle));
                        color: inherit;
                      }
                    </style>
                    <text x="10" y="40" font-size="30" font-family="Playfair Display" font-weight="700" fill="#FFFFFF" stroke="#38BDF8">Holiday</text>
                  </g>
                `;
                e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
                  type: 'text',
                  svgContent: svgCode
                }));
              }}
              onClick={() => {
                const uniqueId = Date.now();
                const svgCode = `
                  <g id="typography-${uniqueId}" data-type="text" cursor="pointer" transform="translate(50, 50)" style="--stroke-width: 3; --shadow-x: 2px; --shadow-y: 2px; --skew-angle: 0deg;">
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&amp;display=swap');
                      #typography-${uniqueId} text, #typography-${uniqueId} div {
                        font-family: 'Playfair Display', serif;
                        font-weight: 700;
                        stroke-width: var(--stroke-width);
                        -webkit-text-stroke-width: var(--stroke-width);
                        stroke-linejoin: round;
                        paint-order: stroke fill;
                        filter: drop-shadow(var(--shadow-x) var(--shadow-y) 0px rgba(0,0,0,0.25));
                        transform: skewX(var(--skew-angle));
                        color: inherit;
                      }
                    </style>
                    <text x="10" y="40" font-size="30" font-family="Playfair Display" font-weight="700" fill="#FFFFFF" stroke="#38BDF8">Holiday</text>
                  </g>
                `;
                window.dispatchEvent(new CustomEvent('add-element-to-editor', {
                  detail: { svgContent: svgCode }
                }));
              }}
              className="flex flex-col items-center justify-between p-[0.6vw] border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer w-full bg-white group"
            >
              <div className="w-full h-[6.5vw] rounded-lg bg-gray-50 flex items-center justify-center p-[0.5vw]">
                <svg width="100%" height="100%" viewBox="0 0 250 120" style={{ pointerEvents: 'none' }}>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&amp;display=swap');
                  </style>
                  <text x="35" y="75" fontFamily="'Playfair Display', serif" fontWeight="700" fontSize="55" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="4" style={{ paintOrder: 'stroke fill', strokeLinejoin: 'round' }} filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.25))">Holiday</text>
                </svg>
              </div>
              <div className="w-full flex items-center justify-between mt-[0.5vw] px-[0.2vw]">
                <span className="text-[0.75vw] font-bold text-gray-800">Holiday</span>
                <span className="text-[0.65vw] text-gray-400 font-semibold uppercase">Luxury</span>
              </div>
            </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TextElementStyle;
