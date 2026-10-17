import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { createKineticSvg } from './kineticTypographyUtils';
import { createMotionGraphicSvg } from './motionGraphicUtils';

const MOTION_GRAPHIC_PRESETS = [
  {
    id: 'lottie-neon-cyber-frame',
    template: 'cyber-frame',
    name: 'Cyber Trim Frame',
    category: 'motion-graphic',
    tag: 'After Effects',
    bg: '#05070e',
    text: 'ANIMATION',
    subText: '',
    primaryColor: '#FF0033', // Neon Red from animation.json
    secondaryColor: '#FFFFFF', // Crisp White Inner Stroke
    glowIntensity: 18,
    fontSize: 28,
    fontFamily: 'Roboto, sans-serif',
    duration: 4700
  },
  {
    id: 'lottie-flipi-slash-title',
    template: 'flipi-split',
    name: 'Flipi Slash Reveal',
    category: 'motion-graphic',
    tag: 'Flipi Accent',
    bg: '#0a0c14',
    text: 'FLIPIBOOK',
    subText: 'ANIMATION',
    primaryColor: '#F3F2F3',
    secondaryColor: '#FFC600', // Gold Slash Accent from flipi.json
    glowIntensity: 0,
    fontSize: 24,
    fontFamily: 'Impact, sans-serif',
    duration: 4500
  },
  {
    id: 'lottie-box-counter-slide',
    template: 'box-reveal',
    name: 'Dual Box Reveal',
    category: 'motion-graphic',
    tag: 'Trim Box',
    bg: '#08080c',
    text: 'FLIPIBOOK',
    subText: 'ANIMATION',
    primaryColor: '#FF1E27', // Red Accent from new animation.json
    secondaryColor: '#FFFFFF',
    glowIntensity: 0,
    fontSize: 20,
    fontFamily: '"Arial Black", Impact, sans-serif',
    duration: 4000
  },
  {
    id: 'lottie-youtube-channel-intro',
    template: 'youtube-channel',
    name: 'YouTube Channel Intro',
    category: 'motion-graphic',
    tag: 'Social Brand',
    bg: '#0b0c10',
    text: 'FLIPIBOOK',
    subText: '',
    primaryColor: '#FF0024', // YouTube Red Logo from youutbe.json
    secondaryColor: '#FFFFFF',
    glowIntensity: 0,
    fontSize: 21,
    fontFamily: '"Arial Black", Impact, sans-serif',
    duration: 3600
  }
];

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
            onClick={() => setActiveTab('motion-graphic')}
            className={`flex-1 py-[0.4vw] text-[0.75vw] font-bold rounded-md transition-all flex items-center justify-center gap-[0.25vw] cursor-pointer ${
              activeTab === 'motion-graphic'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles size="0.75vw" className="text-rose-500" />
            Motion Titles
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
        @keyframes preview-slash-draw {
          0% { stroke-dasharray: 0 60; stroke-dashoffset: 30; opacity: 0; }
          12% { opacity: 1; }
          28%, 70% { stroke-dasharray: 60 0; stroke-dashoffset: 0; opacity: 1; }
          86%, 100% { stroke-dasharray: 0 60; stroke-dashoffset: -30; opacity: 0; }
        }
        @keyframes preview-motion-trim {
          0% { stroke-dasharray: 0 400; stroke-dashoffset: 0; opacity: 0; }
          12% { opacity: 1; }
          28%, 68% { stroke-dasharray: 400 0; stroke-dashoffset: 0; opacity: 1; }
          82%, 100% { stroke-dasharray: 0 400; stroke-dashoffset: -400; opacity: 0; }
        }
        @keyframes preview-motion-text {
          0% { transform: translateY(14px); opacity: 0; }
          4% { opacity: 1; }
          22%, 68% { transform: translateY(0); opacity: 1; }
          82%, 100% { transform: translateY(14px); opacity: 0; }
        }
        @keyframes preview-box-trim {
          0% { stroke-dasharray: 0 380; stroke-dashoffset: 0; opacity: 0; }
          12% { opacity: 1; }
          30%, 70% { stroke-dasharray: 380 0; stroke-dashoffset: 0; opacity: 1; }
          88%, 100% { stroke-dasharray: 0 380; stroke-dashoffset: -380; opacity: 0; }
        }
        @keyframes preview-slide-up {
          0% { transform: translateY(22px); opacity: 0; }
          10% { opacity: 1; }
          28%, 72% { transform: translateY(0); opacity: 1; }
          86%, 100% { transform: translateY(22px); opacity: 0; }
        }
        @keyframes preview-slide-down {
          0% { transform: translateY(-22px); opacity: 0; }
          10% { opacity: 1; }
          28%, 72% { transform: translateY(0); opacity: 1; }
          86%, 100% { transform: translateY(-22px); opacity: 0; }
        }
        @keyframes preview-yt-logo-spring {
          0% { transform: translate(10px, 13px) scale(0) rotate(-29deg); opacity: 0; }
          14% { transform: translate(10px, 13px) scale(1.18) rotate(5deg); opacity: 1; }
          24% { transform: translate(10px, 13px) scale(0.96) rotate(-2deg); opacity: 1; }
          32%, 76% { transform: translate(10px, 13px) scale(1) rotate(0deg); opacity: 1; }
          88%, 100% { transform: translate(10px, 13px) scale(0) rotate(18deg); opacity: 0; }
        }
        @keyframes preview-yt-typing {
          0%, 18% { width: 0%; }
          48%, 78% { width: 100%; }
          88%, 100% { width: 0%; }
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
        {/* Motion Graphic Presets (From After Effects Lottie) */}
        {(isFullView ? (activeTab === 'all' || activeTab === 'motion-graphic') : true) &&
          (isFullView ? MOTION_GRAPHIC_PRESETS : MOTION_GRAPHIC_PRESETS.slice(0, 1)).map((preset) => (
            <button
              key={preset.id}
              draggable="true"
              onDragStart={(e) => {
                const uniqueId = Date.now();
                const svgCode = createMotionGraphicSvg({
                  uniqueId,
                  template: preset.template,
                  text: preset.text,
                  subText: preset.subText,
                  primaryColor: preset.primaryColor,
                  secondaryColor: preset.secondaryColor,
                  lineColor: preset.secondaryColor,
                  glowIntensity: preset.glowIntensity,
                  fontSize: preset.fontSize,
                  fontFamily: preset.fontFamily,
                  duration: preset.duration,
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
                const svgCode = createMotionGraphicSvg({
                  uniqueId,
                  template: preset.template,
                  text: preset.text,
                  subText: preset.subText,
                  primaryColor: preset.primaryColor,
                  secondaryColor: preset.secondaryColor,
                  lineColor: preset.secondaryColor,
                  glowIntensity: preset.glowIntensity,
                  fontSize: preset.fontSize,
                  fontFamily: preset.fontFamily,
                  duration: preset.duration,
                  isTranslate: false
                });
                window.dispatchEvent(
                  new CustomEvent('add-element-to-editor', {
                    detail: { svgContent: svgCode }
                  })
                );
              }}
              className="flex flex-col items-center justify-between p-[0.6vw] border border-gray-200 rounded-xl hover:border-rose-500 hover:shadow-lg transition-all cursor-pointer w-full group relative overflow-hidden bg-white"
            >
              {/* Badge */}
              <div className="absolute top-[0.4vw] right-[0.4vw] px-[0.4vw] py-[0.1vw] rounded-full text-[0.6vw] font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-[0.2vw] z-10">
                <Sparkles size="0.6vw" />
                {preset.tag}
              </div>

              {/* Live Preview Container */}
              <div
                className="w-full h-[6.5vw] rounded-lg flex flex-col justify-center items-center overflow-hidden p-[0.5vw] transition-transform group-hover:scale-[1.02] relative"
                style={{ backgroundColor: preset.bg }}
              >
                {preset.template === 'flipi-split' ? (
                  <svg viewBox="0 0 160 50" className="w-[85%] h-[85%] overflow-visible">
                    <line
                      x1="18"
                      y1="42"
                      x2="28"
                      y2="8"
                      stroke={preset.secondaryColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: 50,
                        animation: `preview-slash-draw ${preset.duration}ms infinite cubic-bezier(0.16, 1, 0.3, 1)`
                      }}
                    />
                    <g transform="translate(34, 0)">
                      <text
                        x="0"
                        y="20"
                        fill={preset.primaryColor}
                        fontSize="9"
                        fontWeight="400"
                        letterSpacing="0"
                        style={{
                          fontFamily: 'Arial, Helvetica, sans-serif',
                          animation: `preview-motion-text ${preset.duration}ms infinite cubic-bezier(0.16, 1, 0.3, 1)`
                        }}
                      >
                        {preset.text}
                      </text>
                      <text
                        x="0"
                        y="36"
                        fill={preset.primaryColor}
                        fontSize="14"
                        fontWeight="400"
                        letterSpacing="0"
                        style={{
                          fontFamily: 'Impact, "Arial Black", sans-serif',
                          animation: `preview-motion-text ${preset.duration}ms infinite cubic-bezier(0.16, 1, 0.3, 1)`
                        }}
                      >
                        {preset.subText}
                      </text>
                    </g>
                  </svg>
                ) : preset.template === 'box-reveal' ? (
                  <svg viewBox="0 0 160 50" className="w-[85%] h-[85%] overflow-visible">
                    <rect
                      x="6"
                      y="6"
                      width="148"
                      height="38"
                      rx="4"
                      ry="4"
                      fill="none"
                      stroke={preset.primaryColor}
                      strokeWidth="2"
                      style={{
                        animation: `preview-box-trim ${preset.duration}ms infinite cubic-bezier(0.833, 0.833, 0.167, 0.167)`
                      }}
                    />
                    <text
                      x="80"
                      y="23"
                      textAnchor="middle"
                      fill={preset.secondaryColor}
                      fontSize="12"
                      fontWeight="900"
                      letterSpacing="0"
                      style={{
                        fontFamily: '"Arial Black", Arial, Impact, sans-serif',
                        animation: `preview-slide-down ${preset.duration}ms infinite cubic-bezier(0.16, 1, 0.3, 1)`
                      }}
                    >
                      {preset.text}
                    </text>
                    <text
                      x="80"
                      y="37"
                      textAnchor="middle"
                      fill={preset.primaryColor}
                      fontSize="9"
                      fontWeight="400"
                      letterSpacing="0"
                      style={{
                        fontFamily: 'Arial, Helvetica, sans-serif',
                        animation: `preview-slide-up ${preset.duration}ms infinite cubic-bezier(0.16, 1, 0.3, 1)`
                      }}
                    >
                      {preset.subText}
                    </text>
                  </svg>
                ) : preset.template === 'youtube-channel' ? (
                  <svg viewBox="0 0 160 50" className="w-[85%] h-[85%] overflow-visible">
                    <g
                      style={{
                        transformOrigin: '22px 22px',
                        animation: `preview-yt-logo-spring ${preset.duration}ms infinite cubic-bezier(0.175, 0.885, 0.32, 1.275)`
                      }}
                    >
                      <rect
                        x="0"
                        y="0"
                        width="34"
                        height="24"
                        rx="6"
                        ry="6"
                        fill={preset.primaryColor}
                      />
                      <polygon points="14,6 23,12 14,18" fill="#FFFFFF" />
                    </g>
                    <foreignObject x="44" y="10" width="112" height="30" style={{ overflow: 'visible' }}>
                      <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            animation: `preview-yt-typing ${preset.duration}ms steps(9, end) infinite`
                          }}
                        >
                          <span
                            style={{
                              fontFamily: '"Arial Black", Arial, Impact, sans-serif',
                              fontSize: '11px',
                              fontWeight: 900,
                              color: preset.secondaryColor,
                              letterSpacing: '0.4px',
                              textTransform: 'uppercase',
                              lineHeight: 1
                            }}
                          >
                            {preset.text}
                          </span>
                        </div>
                      </div>
                    </foreignObject>
                  </svg>
                ) : (
                  /* Standard Cyber Frame (animation.json) */
                  <svg viewBox="0 0 160 50" className="w-[85%] h-[85%] overflow-visible">
                    <rect
                      x="5"
                      y="5"
                      width="150"
                      height="40"
                      rx="10"
                      ry="10"
                      fill="none"
                      stroke={preset.primaryColor}
                      strokeWidth="3.5"
                      style={{
                        filter: `drop-shadow(0 0 6px ${preset.primaryColor})`,
                        animation: `preview-motion-trim ${preset.duration}ms infinite cubic-bezier(0.833, 0.833, 0.167, 0.167)`
                      }}
                    />
                    <rect
                      x="5"
                      y="5"
                      width="150"
                      height="40"
                      rx="10"
                      ry="10"
                      fill="none"
                      stroke={preset.secondaryColor}
                      strokeWidth="1.2"
                      style={{
                        animation: `preview-motion-trim ${preset.duration}ms infinite cubic-bezier(0.833, 0.833, 0.167, 0.167)`
                      }}
                    />
                    <text
                      x="80"
                      y="29"
                      textAnchor="middle"
                      fill={preset.primaryColor}
                      fontSize="11"
                      fontWeight="700"
                      letterSpacing="0.9"
                      style={{
                        fontFamily: "'Roboto', sans-serif",
                        animation: `preview-motion-text ${preset.duration}ms infinite cubic-bezier(0.833, 0.833, 0.167, 0.167)`
                      }}
                    >
                      {preset.text}
                    </text>
                  </svg>
                )}
              </div>

              {/* Title label */}
              <div className="w-full mt-[0.5vw] flex items-center justify-between">
                <span className="text-[0.75vw] font-bold text-gray-800 group-hover:text-rose-600 transition-colors">
                  {preset.name}
                </span>
                <span className="text-[0.65vw] text-gray-400">Motion AE</span>
              </div>
            </button>
          ))}

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
