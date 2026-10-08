import React from 'react';

const ButtonStyle = () => {
  return (
    <div className="w-full grid grid-cols-2 gap-4 p-4">
      {/* Linear Gradient Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn-linear" style="--base-text: #ffffff; --hover-text: #ffffff; --hover-fill: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); --hover-stroke: transparent;">
                <defs>
                  <linearGradient id="grad-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#a855f7" />
                    <stop offset="100%" stop-color="#ec4899" />
                  </linearGradient>
                  <linearGradient id="hover-grad-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ec4899" />
                    <stop offset="100%" stop-color="#a855f7" />
                  </linearGradient>
                </defs>
                <style>
                  #${uniqueId} rect {
                    fill: url(#grad-${uniqueId});
                    filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.4));
                    transition: filter 0.3s ease, transform 0.3s ease;
                    transform-origin: center;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                  }
                  #${uniqueId}:hover rect, #${uniqueId}[data-force-hover="true"] rect {
                    fill: url(#hover-grad-${uniqueId}) !important;
                    filter: drop-shadow(0 4px 15px rgba(168, 85, 247, 0.6)) !important;
                    transform: translateY(-2px) !important;
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover rect {
                    filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.4)) !important;
                    transform: none !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect width="120" height="36" rx="18" fill="url(#grad-${uniqueId})" pointer-events="all" />
                <text x="60" y="18" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">LINEAR</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
              type: 'button',
              svgContent: svgCode
            }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg 
            width="120" 
            height="40" 
            viewBox="0 -2 120 44"
          >
            <defs>
              <linearGradient id="grad-prev" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <style>{`
              .btn-linear-preview rect {
                fill: url(#grad-prev);
                filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.4));
                transition: filter 0.3s ease, transform 0.3s ease;
                transform-origin: center;
              }
              .btn-linear-preview:hover rect {
                filter: drop-shadow(0 4px 12px rgba(168, 85, 247, 0.6));
                transform: translateY(-2px);
              }
            `}</style>
            <g className="btn-linear-preview cursor-pointer">
              <rect width="120" height="36" rx="18" />
              <text x="60" y="18" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="600" fontFamily="sans-serif" letterSpacing="0.05em">
                LINEAR
              </text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Linear Button</span>
      </div>

      {/* Gradient Border Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn-border-grad" style="--base-fill: #141414; --hover-fill: #141414; --base-text: #f2f2f2; --hover-text: #ec4899; --hover-stroke: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);">
                <defs>
                  <linearGradient id="stroke-grad-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#a855f7" />
                    <stop offset="100%" stop-color="#ec4899" />
                  </linearGradient>
                  <linearGradient id="hover-stroke-grad-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#a855f7" />
                    <stop offset="100%" stop-color="#ec4899" />
                  </linearGradient>
                </defs>
                <style>
                  #${uniqueId} rect {
                    fill: var(--base-fill);
                    stroke: url(#stroke-grad-${uniqueId});
                    stroke-width: 2;
                    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
                    transition: filter 0.15s ease-out, transform 0.15s ease-out, fill 0.15s ease-out;
                    transform-origin: center;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.15s ease-out;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                  }
                  #${uniqueId}:hover rect, #${uniqueId}[data-force-hover="true"] rect {
                    fill: var(--hover-fill) !important;
                    stroke: url(#hover-stroke-grad-${uniqueId}) !important;
                    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5)) !important;
                    transform: translateY(-2px) !important;
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover rect {
                    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)) !important;
                    transform: none !important;
                    fill: var(--base-fill) !important;
                    stroke: url(#stroke-grad-${uniqueId}) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect width="120" height="44" rx="22" fill="#141414" stroke="url(#stroke-grad-${uniqueId})" pointer-events="all" />
                <text x="60" y="22" dominant-baseline="middle" text-anchor="middle" fill="#f2f2f2" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">GRADIENT</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
              type: 'button',
              svgContent: svgCode
            }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg 
            width="120" 
            height="50" 
            viewBox="0 -3 120 50"
          >
            <defs>
              <linearGradient id="stroke-grad-prev" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <style>{`
              .btn-border-preview rect {
                fill: #141414;
                stroke: url(#stroke-grad-prev);
                stroke-width: 2;
                filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
                transition: filter 0.15s ease-out, transform 0.15s ease-out;
                transform-origin: center;
              }
              .btn-border-preview text {
                fill: #f2f2f2;
                transition: fill 0.15s ease-out;
              }
              .btn-border-preview:hover rect {
                filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5));
                transform: translateY(-2px);
              }
              .btn-border-preview:hover text {
                fill: #ec4899;
              }
            `}</style>
            <g className="btn-border-preview cursor-pointer">
              <rect width="120" height="44" rx="22" />
              <text x="60" y="22" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="sans-serif" letterSpacing="0.03em">
                GRADIENT
              </text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Gradient Border</span>
      </div>

      {/* First Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const svgCode = `
              <g id="button-${Date.now()}" data-type="button" cursor="pointer" class="btn1-group" style="--base-fill: #ffffff; --base-text: #1c2536; --base-stroke: #1c2536; --hover-fill: #1c2536; --hover-text: #ffffff; --hover-stroke: #1c2536;">
                <style>
                  .btn1-group rect { transition: fill 0.3s ease, stroke 0.3s ease; }
                  .btn1-group text { transition: fill 0.3s ease; }
                  .btn1-group:hover rect, .btn1-group[data-force-hover="true"] rect { fill: var(--hover-fill) !important; stroke: var(--hover-stroke) !important; }
                  .btn1-group:hover text, .btn1-group[data-force-hover="true"] text { fill: var(--hover-text) !important; }
                  .page-svg-container .btn1-group[data-editor-hover="off"]:not([data-force-hover="true"]):hover rect { fill: var(--base-fill) !important; stroke: var(--base-stroke) !important; }
                  .page-svg-container .btn1-group[data-editor-hover="off"]:not([data-force-hover="true"]):hover text { fill: var(--base-text) !important; }
                </style>
                <rect width="120" height="32" rx="6" fill="#ffffff" stroke="#1c2536" stroke-width="1.5" />
                <text x="60" y="16" dominant-baseline="middle" text-anchor="middle" fill="#1c2536" font-size="14" font-family="sans-serif" style="pointer-events: none;">First Button</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
              type: 'button',
              svgContent: svgCode
            }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg 
            width="120" 
            height="36" 
            viewBox="0 0 198 48"
          >
            <style>{`
              .btn1-preview rect { transition: fill 0.3s ease; }
              .btn1-preview text { transition: fill 0.3s ease; }
              .btn1-preview:hover rect { fill: #1c2536; }
              .btn1-preview:hover text { fill: #ffffff; }
            `}</style>
            <g className="btn1-preview cursor-pointer">
              <rect width="198" height="48" rx="8" fill="#ffffff" stroke="#1c2536" strokeWidth="2" />
              <text x="99" y="24" dominantBaseline="middle" textAnchor="middle" fill="#1c2536" fontSize="20" fontFamily="sans-serif">
                First Button
              </text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">First Button</span>
      </div>

      {/* Third Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn3-group" style="--base-fill: #7e22ce; --hover-fill: #a855f7; --base-text: #ffffff; --hover-text: #ffffff;">
                <style>
                  #${uniqueId} .poly-back {
                    fill: var(--base-fill);
                    fill-opacity: 0.6;
                    transition: fill 0.3s ease, fill-opacity 0.3s ease;
                  }
                  #${uniqueId} .poly-front {
                    fill: var(--base-fill);
                    fill-opacity: 1;
                    transition: fill 0.3s ease;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.3s ease;
                  }
                  #${uniqueId}:hover .poly-back, #${uniqueId}[data-force-hover="true"] .poly-back {
                    fill: var(--hover-fill) !important;
                    fill-opacity: 0.6 !important;
                  }
                  #${uniqueId}:hover .poly-front, #${uniqueId}[data-force-hover="true"] .poly-front {
                    fill: var(--hover-fill) !important;
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover .poly-back {
                    fill: var(--base-fill) !important;
                    fill-opacity: 0.6 !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover .poly-front {
                    fill: var(--base-fill) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect x="0" y="0" width="120" height="32" fill="#7e22ce" fill-opacity="0" pointer-events="all" />
                <polygon class="poly-back" points="0,0 100,0 120,32 20,32" fill="#7e22ce" pointer-events="none" />
                <polygon class="poly-front" points="20,0 120,0 100,32 0,32" fill="#7e22ce" pointer-events="none" />
                <text x="60" y="16" dominant-baseline="middle" text-anchor="middle" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Third Button</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
              type: 'button',
              svgContent: svgCode
            }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg 
            width="120" 
            height="36" 
            viewBox="0 0 198 48"
          >
            <style>{`
              .btn3-preview .poly-back-prev {
                fill: #a855f7;
                fill-opacity: 0.6;
                transition: fill 0.3s ease;
              }
              .btn3-preview .poly-front-prev {
                fill: #7e22ce;
                transition: fill 0.3s ease;
              }
              .btn3-preview:hover .poly-back-prev {
                fill: #9333ea;
              }
              .btn3-preview:hover .poly-front-prev {
                fill: #a855f7;
              }
            `}</style>
            <g className="btn3-preview cursor-pointer">
              <polygon className="poly-back-prev" points="0,0 165,0 198,48 33,48" />
              <polygon className="poly-front-prev" points="33,0 198,0 165,48 0,48" />
              <text x="99" y="24" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="600" fontFamily="sans-serif">
                Third Button
              </text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Third Button</span>
      </div>

      {/* Fourth Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const svgCode = `
              <g id="button-${Date.now()}" data-type="button" cursor="pointer" class="btn4-group" style="--base-text: #4f46e5; --hover-fill: #4f46e5; --hover-text: #ffffff; --hover-stroke: #4f46e5;">
                <style>
                  .btn4-group rect.slide-bg { transition: width 0.3s ease-out; fill: var(--hover-fill) !important; }
                  .btn4-group text { transition: fill 0.3s ease-out; }
                  .btn4-group:hover rect.slide-bg, .btn4-group[data-force-hover="true"] rect.slide-bg { width: 118px !important; }
                  .btn4-group:hover text, .btn4-group[data-force-hover="true"] text { fill: var(--hover-text) !important; }
                  .page-svg-container .btn4-group[data-editor-hover="off"]:not([data-force-hover="true"]):hover rect.slide-bg { width: 0 !important; }
                  .page-svg-container .btn4-group[data-editor-hover="off"]:not([data-force-hover="true"]):hover text { fill: var(--base-text) !important; }
                </style>
                <rect width="118" height="30" x="1" y="1" rx="5" fill="#ffffff" stroke="#4f46e5" stroke-width="1.5" />
                <rect class="slide-bg" x="1" y="1" width="0" height="30" rx="4" />
                <text x="60" y="16" dominant-baseline="middle" text-anchor="middle" fill="#4f46e5" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Fourth Button</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
              type: 'button',
              svgContent: svgCode
            }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg 
            width="120" 
            height="36" 
            viewBox="0 0 198 48"
          >
            <style>{`
              .btn4-preview rect.slide-bg { transition: width 0.3s ease-out; }
              .btn4-preview text { transition: fill 0.3s ease-out; }
              .btn4-preview:hover rect.slide-bg { width: 196px; }
              .btn4-preview:hover text { fill: #ffffff; }
            `}</style>
            <g className="btn4-preview cursor-pointer">
              <rect width="196" height="46" x="1" y="1" rx="6" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
              <rect className="slide-bg" x="1" y="1" width="0" height="46" rx="5" fill="#4f46e5" />
              <text x="99" y="24" dominantBaseline="middle" textAnchor="middle" fill="#4f46e5" fontSize="20" fontWeight="600" fontFamily="sans-serif">
                Fourth Button
              </text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Fourth Button</span>
      </div>

      {/* Fifth Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const svgCode = `
              <g id="button-${Date.now()}" data-type="button" cursor="pointer" class="btn5-group">
                <style>
                  .btn5-shine {
                    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    transform: translateX(-50px) skewX(-20deg);
                  }
                  .btn5-group:hover .btn5-shine {
                    transform: translateX(150px) skewX(-20deg) !important;
                  }
                  .page-svg-container .btn5-group:hover .btn5-shine {
                    transform: translateX(-50px) skewX(-20deg) !important;
                  }
                </style>
                <defs>
                  <linearGradient id="grad-fifth" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#4F7CFF" />
                    <stop offset="100%" stop-color="#9747FF" />
                  </linearGradient>
                  <filter id="shadow-fifth" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#9747FF" flood-opacity="0.3" />
                  </filter>
                  <clipPath id="clip-btn5-placed">
                    <rect width="120" height="32" rx="5" />
                  </clipPath>
                </defs>
                <rect width="120" height="32" rx="5" fill="url(#grad-fifth)" filter="url(#shadow-fifth)" />
                <g clip-path="url(#clip-btn5-placed)">
                  <rect class="btn5-shine" x="0" y="0" width="30" height="32" fill="rgba(255,255,255,0.4)" />
                </g>
                <text x="60" y="16" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Fifth Button</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
              type: 'button',
              svgContent: svgCode
            }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg 
            width="120" 
            height="42" 
            viewBox="-10 -5 218 68"
          >
            <style>{`
              .btn5-shine {
                transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                transform: translateX(-100px) skewX(-20deg);
              }
              .btn5-preview-group:hover .btn5-shine {
                transform: translateX(250px) skewX(-20deg);
              }
            `}</style>
            <defs>
              <linearGradient id="grad-fifth-preview" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4F7CFF" />
                <stop offset="100%" stopColor="#9747FF" />
              </linearGradient>
              <filter id="shadow-fifth-preview" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#9747FF" floodOpacity="0.3" />
              </filter>
              <clipPath id="clip-btn5">
                <rect width="198" height="48" rx="6" />
              </clipPath>
            </defs>
            <g className="btn5-preview-group cursor-pointer">
              <rect width="198" height="48" rx="6" fill="url(#grad-fifth-preview)" filter="url(#shadow-fifth-preview)" />
              <g clipPath="url(#clip-btn5)">
                <rect className="btn5-shine" x="0" y="0" width="50" height="48" fill="rgba(255,255,255,0.4)" />
              </g>
              <text x="99" y="24" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="600" fontFamily="sans-serif">
                Fifth Button
              </text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Fifth Button</span>
      </div>
      {/* 13 Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const svgCode = `
              <g id="button-${Date.now()}" data-type="button" cursor="pointer" class="btn13-group">
                <style>
                  .btn13-preview-inner { transition: transform 0.2s ease; transform-origin: center; }
                  .btn13-group:hover .btn13-preview-inner { transform: scale(1.02) !important; }
                  .page-svg-container .btn13-group:hover .btn13-preview-inner { transform: scale(1) !important; }
                </style>
                <g class="btn13-preview-inner">
                  <clipPath id="clip-btn13-placed">
                    <rect width="120" height="32" rx="6" />
                  </clipPath>
                  <rect width="120" height="32" rx="6" fill="#4ADE80" />
                  <g clip-path="url(#clip-btn13-placed)">
                    <path d="M0,0 Q36,0 24,32 L0,32 Z" fill="rgba(255,255,255,0.2)" />
                    <path d="M120,32 Q85,32 97,0 L120,0 Z" fill="rgba(0,0,0,0.05)" />
                  </g>
                  <text x="60" y="16" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700" font-family="sans-serif" style="pointer-events: none;">13 Button</text>
                </g>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
              type: 'button',
              svgContent: svgCode
            }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg width="120" height="36" viewBox="0 0 198 48">
            <style>{`
              .btn13-preview { transition: transform 0.2s ease; }
              .btn13-preview-group:hover .btn13-preview { transform: scale(1.02); }
            `}</style>
            <defs>
              <clipPath id="clip-btn13-preview">
                <rect width="198" height="48" rx="8" />
              </clipPath>
            </defs>
            <g className="btn13-preview-group cursor-pointer">
              <g className="btn13-preview" transformOrigin="center">
                <rect width="198" height="48" rx="8" fill="#4ADE80" />
                <g clipPath="url(#clip-btn13-preview)">
                  <path d="M0,0 Q60,0 40,48 L0,48 Z" fill="rgba(255,255,255,0.2)" />
                  <path d="M198,48 Q140,48 160,0 L198,0 Z" fill="rgba(0,0,0,0.05)" />
                </g>
                <text x="99" y="24" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="700" fontFamily="sans-serif">
                  13 Button
                </text>
              </g>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">13 Button</span>
      </div>

      {/* 14 Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = Date.now();
            const svgCode = `
              <g id="button-${uniqueId}" data-type="button" cursor="pointer" class="btn14-group" style="--base-fill: #ffffff; --hover-fill: #4b5563; --text-color: #4b5563; --hover-text: #ffffff;">
                <defs>
                  <clipPath id="clip-btn14-${uniqueId}">
                    <rect width="120" height="32" rx="6" />
                  </clipPath>
                  <filter id="shadow-btn14-${uniqueId}" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.08" />
                  </filter>
                </defs>
                <style>
                  .btn14-group rect.btn14-bg { fill: var(--base-fill); }
                  
                  .btn14-group line.btn14-line-top, .btn14-group line.btn14-line-bot { stroke: var(--hover-fill); stroke-width: 4; stroke-dasharray: 120; stroke-dashoffset: 120; transition: stroke-dashoffset 0.2s ease; }
                  
                  .btn14-group rect.btn14-fill-top { fill: var(--hover-fill); transition: height 0.3s ease 0.2s; }
                  .btn14-group rect.btn14-fill-bot { fill: var(--hover-fill); transition: height 0.3s ease 0.2s, y 0.3s ease 0.2s; }
                  .btn14-group rect.btn14-overlay { fill: #000000; opacity: 0; transition: opacity 0.3s ease 0.3s; pointer-events: none; }
                  
                  .btn14-group text { fill: var(--text-color); transition: fill 0.3s ease 0.2s; }
                  
                  .btn14-group:hover line.btn14-line-top, .btn14-group[data-force-hover="true"] line.btn14-line-top { stroke-dashoffset: 0; }
                  .btn14-group:hover line.btn14-line-bot, .btn14-group[data-force-hover="true"] line.btn14-line-bot { stroke-dashoffset: 0; }
                  
                  .btn14-group:hover rect.btn14-fill-top, .btn14-group[data-force-hover="true"] rect.btn14-fill-top { height: 32px; }
                  .btn14-group:hover rect.btn14-fill-bot, .btn14-group[data-force-hover="true"] rect.btn14-fill-bot { height: 32px; y: 0; }
                  
                  .btn14-group:hover rect.btn14-overlay, .btn14-group[data-force-hover="true"] rect.btn14-overlay { opacity: 0.3; }
                  
                  .btn14-group:hover text, .btn14-group[data-force-hover="true"] text { fill: var(--hover-text); }
                  
                  .page-svg-container .btn14-group[data-editor-hover="off"]:not([data-force-hover="true"]):hover line.btn14-line-top,
                  .page-svg-container .btn14-group[data-editor-hover="off"]:not([data-force-hover="true"]):hover line.btn14-line-bot { stroke-dashoffset: 120 !important; }
                  
                  .page-svg-container .btn14-group[data-editor-hover="off"]:not([data-force-hover="true"]):hover rect.btn14-fill-top { height: 0 !important; }
                  .page-svg-container .btn14-group[data-editor-hover="off"]:not([data-force-hover="true"]):hover rect.btn14-fill-bot { height: 0 !important; y: 32px !important; }
                  
                  .page-svg-container .btn14-group[data-editor-hover="off"]:not([data-force-hover="true"]):hover rect.btn14-overlay { opacity: 0 !important; }
                  .page-svg-container .btn14-group[data-editor-hover="off"]:not([data-force-hover="true"]):hover text { fill: var(--text-color) !important; }
                </style>
                
                <rect width="120" height="32" rx="6" class="btn14-bg" filter="url(#shadow-btn14-${uniqueId})" />
                
                <g clip-path="url(#clip-btn14-${uniqueId})">
                  <line x1="0" y1="0" x2="120" y2="0" class="btn14-line-top" />
                  <line x1="120" y1="32" x2="0" y2="32" class="btn14-line-bot" />
                  <rect x="0" y="0" width="120" height="0" class="btn14-fill-top" />
                  <rect x="0" y="32" width="120" height="0" class="btn14-fill-bot" />
                  <rect x="0" y="0" width="120" height="32" class="btn14-overlay" />
                </g>
                
                <text x="60" y="16" dominant-baseline="middle" text-anchor="middle" font-size="14" font-weight="700" font-family="sans-serif" style="pointer-events: none;">14 Button</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
              type: 'button',
              svgContent: svgCode
            }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg width="120" height="42" viewBox="-10 -10 218 68">
            <style>{`
              .btn14-preview-group rect.btn14-bg-prev { fill: #ffffff; }
              
              .btn14-preview-group line.btn14-line-top-prev, .btn14-preview-group line.btn14-line-bot-prev { stroke: #4b5563; stroke-width: 6; stroke-dasharray: 198; stroke-dashoffset: 198; transition: stroke-dashoffset 0.2s ease; }
              
              .btn14-preview-group rect.btn14-fill-top-prev { fill: #4b5563; transition: height 0.3s ease 0.2s; }
              .btn14-preview-group rect.btn14-fill-bot-prev { fill: #4b5563; transition: height 0.3s ease 0.2s, y 0.3s ease 0.2s; }
              .btn14-preview-group rect.btn14-overlay-prev { fill: #000000; opacity: 0; transition: opacity 0.3s ease 0.3s; pointer-events: none; }
              
              .btn14-preview-group text { fill: #4b5563; transition: fill 0.3s ease 0.2s; }
              
              .btn14-preview-group:hover line.btn14-line-top-prev, .btn14-preview-group:hover line.btn14-line-bot-prev { stroke-dashoffset: 0; }
              
              .btn14-preview-group:hover rect.btn14-fill-top-prev { height: 48px; }
              .btn14-preview-group:hover rect.btn14-fill-bot-prev { height: 48px; y: 0; }
              
              .btn14-preview-group:hover rect.btn14-overlay-prev { opacity: 0.3; }
              
              .btn14-preview-group:hover text { fill: #ffffff; }
            `}</style>
            <defs>
              <clipPath id="clip-btn14-preview">
                <rect width="198" height="48" rx="8" />
              </clipPath>
              <filter id="shadow-btn14-preview" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.08" />
              </filter>
            </defs>
            <g className="btn14-preview-group cursor-pointer">
              <rect width="198" height="48" rx="8" className="btn14-bg-prev" filter="url(#shadow-btn14-preview)" />
              <g clipPath="url(#clip-btn14-preview)">
                <line x1="0" y1="0" x2="198" y2="0" className="btn14-line-top-prev" />
                <line x1="198" y1="48" x2="0" y2="48" className="btn14-line-bot-prev" />
                <rect x="0" y="0" width="198" height="0" className="btn14-fill-top-prev" />
                <rect x="0" y="48" width="198" height="0" className="btn14-fill-bot-prev" />
                <rect x="0" y="0" width="198" height="48" className="btn14-overlay-prev" />
              </g>
              <text x="99" y="24" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight="700" fontFamily="sans-serif">
                14 Button
              </text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">14 Button</span>
      </div>

      {/* Diamond Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn-diamond" style="--base-fill: #C6ED8D; --hover-fill: #b3d77e; --base-text: #333333; --hover-text: #333333;">
                <style>
                  #${uniqueId} polygon {
                    fill: var(--base-fill);
                    transition: fill 0.2s ease, transform 0.2s ease;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.2s ease;
                  }
                  #${uniqueId}:hover polygon, #${uniqueId}[data-force-hover="true"] polygon {
                    fill: var(--hover-fill) !important;
                    transform: translateY(-1px);
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover polygon {
                    fill: var(--base-fill) !important;
                    transform: none !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect width="120" height="34" fill="transparent" pointer-events="all" />
                <polygon class="poly-diamond" points="0,17 17,0 103,0 120,17 103,34 17,34" pointer-events="none" />
                <text x="60" y="17" dominant-baseline="middle" text-anchor="middle" fill="#333333" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Diamond</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({ type: 'button', svgContent: svgCode }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg width="120" height="40" viewBox="0 -3 120 40">
            <style>{`
              .btn-dia-prev polygon { fill: #C6ED8D; transition: fill 0.2s ease, transform 0.2s ease; }
              .btn-dia-prev text { fill: #333333; transition: fill 0.2s ease; }
              .btn-dia-prev:hover polygon { fill: #b3d77e; transform: translateY(-1px); }
            `}</style>
            <g className="btn-dia-prev cursor-pointer">
              <polygon points="0,17 17,0 103,0 120,17 103,34 17,34" />
              <text x="60" y="17" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="sans-serif">Diamond</text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Diamond</span>
      </div>

      {/* Ribbon Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn-ribbon" style="--base-fill: #7DE3C8; --hover-fill: #6bc2aa; --base-text: #333333; --hover-text: #333333;">
                <style>
                  #${uniqueId} rect.rect-ribbon-center {
                    fill: var(--base-fill);
                    transition: fill 0.2s ease, transform 0.2s ease;
                  }
                  #${uniqueId} polygon {
                    transition: transform 0.2s ease;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.2s ease;
                  }
                  #${uniqueId}:hover rect.rect-ribbon-center, #${uniqueId}[data-force-hover="true"] rect.rect-ribbon-center {
                    fill: var(--hover-fill) !important;
                    transform: translateY(-1px);
                  }
                  #${uniqueId}:hover polygon, #${uniqueId}[data-force-hover="true"] polygon {
                    transform: translateY(-1px);
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover rect.rect-ribbon-center {
                    fill: var(--base-fill) !important;
                    transform: none !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover polygon {
                    transform: none !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect width="120" height="40" fill="transparent" pointer-events="all" />
                <polygon class="poly-ribbon-left" points="0,5 8,22 0,39 25,39 25,5" fill="#4dbfa0" pointer-events="none" />
                <polygon class="poly-ribbon-right" points="95,5 120,5 112,22 120,39 95,39" fill="#4dbfa0" pointer-events="none" />
                <rect class="rect-ribbon-center" x="25" y="0" width="70" height="34" fill="#7DE3C8" pointer-events="none" />
                <text x="60" y="17" dominant-baseline="middle" text-anchor="middle" fill="#333333" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Ribbon</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({ type: 'button', svgContent: svgCode }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg width="120" height="45" viewBox="0 -3 120 45">
            <style>{`
              .btn-rib-prev rect.rect-ribbon-center { fill: #7DE3C8; transition: fill 0.2s ease, transform 0.2s ease; }
              .btn-rib-prev polygon { transition: transform 0.2s ease; }
              .btn-rib-prev text { fill: #333333; transition: fill 0.2s ease; }
              .btn-rib-prev:hover rect.rect-ribbon-center { fill: #6bc2aa; transform: translateY(-1px); }
              .btn-rib-prev:hover polygon { transform: translateY(-1px); }
            `}</style>
            <g className="btn-rib-prev cursor-pointer">
              <polygon points="0,5 8,22 0,39 25,39 25,5" fill="#4dbfa0" />
              <polygon points="95,5 120,5 112,22 120,39 95,39" fill="#4dbfa0" />
              <rect className="rect-ribbon-center" x="25" y="0" width="70" height="34" />
              <text x="60" y="17" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="sans-serif">Ribbon</text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Ribbon</span>
      </div>

      {/* Arrow Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn-arrow" style="--base-fill: #8D96ED; --hover-fill: #7781d4; --base-text: #ffffff; --hover-text: #ffffff;">
                <style>
                  #${uniqueId} polygon {
                    fill: var(--base-fill);
                    transition: fill 0.2s ease, transform 0.2s ease;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.2s ease;
                  }
                  #${uniqueId}:hover polygon, #${uniqueId}[data-force-hover="true"] polygon {
                    fill: var(--hover-fill) !important;
                    transform: translateY(-1px);
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover polygon {
                    fill: var(--base-fill) !important;
                    transform: none !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect width="120" height="34" fill="transparent" pointer-events="all" />
                <polygon class="poly-arrow" points="17,0 103,0 120,17 103,34 17,34 0,17" pointer-events="none" />
                <text x="60" y="17" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Arrow</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({ type: 'button', svgContent: svgCode }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg width="120" height="40" viewBox="0 -3 120 40">
            <style>{`
              .btn-arr-prev polygon { fill: #8D96ED; transition: fill 0.2s ease, transform 0.2s ease; }
              .btn-arr-prev text { fill: #ffffff; transition: fill 0.2s ease; }
              .btn-arr-prev:hover polygon { fill: #7781d4; transform: translateY(-1px); }
            `}</style>
            <g className="btn-arr-prev cursor-pointer">
              <polygon points="17,0 103,0 120,17 103,34 17,34 0,17" />
              <text x="60" y="17" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="sans-serif">Arrow</text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Arrow</span>
      </div>

      {/* Rounded Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn-rounded" style="--base-fill: #FC9E86; --hover-fill: #e88c74; --base-text: #ffffff; --hover-text: #ffffff;">
                <style>
                  #${uniqueId} rect {
                    fill: var(--base-fill);
                    transition: fill 0.2s ease, transform 0.2s ease;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.2s ease;
                  }
                  #${uniqueId}:hover rect, #${uniqueId}[data-force-hover="true"] rect {
                    fill: var(--hover-fill) !important;
                    transform: translateY(-1px);
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover rect {
                    fill: var(--base-fill) !important;
                    transform: none !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect width="120" height="34" rx="17" fill="#FC9E86" pointer-events="all" />
                <text x="60" y="17" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Rounded</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({ type: 'button', svgContent: svgCode }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg width="120" height="40" viewBox="0 -3 120 40">
            <style>{`
              .btn-rnd-prev rect { fill: #FC9E86; transition: fill 0.2s ease, transform 0.2s ease; }
              .btn-rnd-prev text { fill: #ffffff; transition: fill 0.2s ease; }
              .btn-rnd-prev:hover rect { fill: #e88c74; transform: translateY(-1px); }
            `}</style>
            <g className="btn-rnd-prev cursor-pointer">
              <rect width="120" height="34" rx="17" />
              <text x="60" y="17" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="sans-serif">Rounded</text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Rounded</span>
      </div>

      {/* Sheer Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn-sheer" style="--base-fill: #85C9ED; --hover-fill: #6eb7dd; --base-text: #ffffff; --hover-text: #ffffff;">
                <style>
                  #${uniqueId} polygon {
                    fill: var(--base-fill);
                    transition: fill 0.2s ease, transform 0.2s ease;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.2s ease;
                  }
                  #${uniqueId}:hover polygon, #${uniqueId}[data-force-hover="true"] polygon {
                    fill: var(--hover-fill) !important;
                    transform: translateY(-1px);
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover polygon {
                    fill: var(--base-fill) !important;
                    transform: none !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect width="120" height="34" fill="transparent" pointer-events="all" />
                <polygon class="poly-sheer" points="10,0 120,0 110,34 0,34" pointer-events="none" />
                <text x="60" y="17" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Sheer</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({ type: 'button', svgContent: svgCode }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg width="120" height="40" viewBox="0 -3 120 40">
            <style>{`
              .btn-sheer-prev polygon { fill: #85C9ED; transition: fill 0.2s ease, transform 0.2s ease; }
              .btn-sheer-prev text { fill: #ffffff; transition: fill 0.2s ease; }
              .btn-sheer-prev:hover polygon { fill: #6eb7dd; transform: translateY(-1px); }
            `}</style>
            <g className="btn-sheer-prev cursor-pointer">
              <polygon points="10,0 120,0 110,34 0,34" />
              <text x="60" y="17" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="sans-serif">Sheer</text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Sheer</span>
      </div>

      {/* Trapezoid Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn-trapezoid" style="--base-fill: #ff9800; --hover-fill: #e68900; --base-text: #ffffff; --hover-text: #ffffff;">
                <style>
                  #${uniqueId} polygon {
                    fill: var(--base-fill);
                    transition: fill 0.2s ease, transform 0.2s ease;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.2s ease;
                  }
                  #${uniqueId}:hover polygon, #${uniqueId}[data-force-hover="true"] polygon {
                    fill: var(--hover-fill) !important;
                    transform: translateY(-1px);
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover polygon {
                    fill: var(--base-fill) !important;
                    transform: none !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect width="120" height="34" fill="transparent" pointer-events="all" />
                <polygon class="poly-trapezoid" points="10,0 110,0 120,34 0,34" pointer-events="none" />
                <text x="60" y="17" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Trapezoid</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({ type: 'button', svgContent: svgCode }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg width="120" height="40" viewBox="0 -3 120 40">
            <style>{`
              .btn-trap-prev polygon { fill: #ff9800; transition: fill 0.2s ease, transform 0.2s ease; }
              .btn-trap-prev text { fill: #ffffff; transition: fill 0.2s ease; }
              .btn-trap-prev:hover polygon { fill: #e68900; transform: translateY(-1px); }
            `}</style>
            <g className="btn-trap-prev cursor-pointer">
              <polygon points="10,0 110,0 120,34 0,34" />
              <text x="60" y="17" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="sans-serif">Trapezoid</text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Trapezoid</span>
      </div>

      {/* Notching Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn-notching" style="--base-fill: #ff1493; --hover-fill: #e61284; --base-text: #ffffff; --hover-text: #ffffff;">
                <style>
                  #${uniqueId} polygon {
                    fill: var(--base-fill);
                    transition: fill 0.2s ease, transform 0.2s ease;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.2s ease;
                  }
                  #${uniqueId}:hover polygon, #${uniqueId}[data-force-hover="true"] polygon {
                    fill: var(--hover-fill) !important;
                    transform: translateY(-1px);
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover polygon {
                    fill: var(--base-fill) !important;
                    transform: none !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect width="120" height="34" fill="transparent" pointer-events="all" />
                <polygon class="poly-notching" points="10,0 110,0 120,10 120,24 110,34 10,34 0,24 0,10" pointer-events="none" />
                <text x="60" y="17" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Notching</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({ type: 'button', svgContent: svgCode }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg width="120" height="40" viewBox="0 -3 120 40">
            <style>{`
              .btn-notch-prev polygon { fill: #ff1493; transition: fill 0.2s ease, transform 0.2s ease; }
              .btn-notch-prev text { fill: #ffffff; transition: fill 0.2s ease; }
              .btn-notch-prev:hover polygon { fill: #e61284; transform: translateY(-1px); }
            `}</style>
            <g className="btn-notch-prev cursor-pointer">
              <polygon points="10,0 110,0 120,10 120,24 110,34 10,34 0,24 0,10" />
              <text x="60" y="17" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="sans-serif">Notching</text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Notching</span>
      </div>

      {/* Flat Arrow Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn-flat-arrow" style="--base-fill: #9006fb; --hover-fill: #7d05db; --base-text: #ffffff; --hover-text: #ffffff;">
                <style>
                  #${uniqueId} polygon {
                    fill: var(--base-fill);
                    transition: fill 0.2s ease, transform 0.2s ease;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.2s ease;
                  }
                  #${uniqueId}:hover polygon, #${uniqueId}[data-force-hover="true"] polygon {
                    fill: var(--hover-fill) !important;
                    transform: translateY(-1px);
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover polygon {
                    fill: var(--base-fill) !important;
                    transform: none !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect width="120" height="34" fill="transparent" pointer-events="all" />
                <polygon class="poly-flat-arrow" points="0,0 103,0 120,17 103,34 0,34" pointer-events="none" />
                <text x="50" y="17" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Arrow 2</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({ type: 'button', svgContent: svgCode }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg width="120" height="40" viewBox="0 -3 120 40">
            <style>{`
              .btn-flat-arr-prev polygon { fill: #9006fb; transition: fill 0.2s ease, transform 0.2s ease; }
              .btn-flat-arr-prev text { fill: #ffffff; transition: fill 0.2s ease; }
              .btn-flat-arr-prev:hover polygon { fill: #7d05db; transform: translateY(-1px); }
            `}</style>
            <g className="btn-flat-arr-prev cursor-pointer">
              <polygon points="0,0 103,0 120,17 103,34 0,34" />
              <text x="50" y="17" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="sans-serif">Arrow 2</text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Flat Arrow</span>
      </div>

      {/* Inset Circle Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn-inset-circle" style="--base-fill: #2179f5; --hover-fill: #1c68d4; --base-text: #ffffff; --hover-text: #ffffff;">
                <style>
                  #${uniqueId} path {
                    fill: var(--base-fill);
                    transition: fill 0.2s ease, transform 0.2s ease;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.2s ease;
                  }
                  #${uniqueId}:hover path, #${uniqueId}[data-force-hover="true"] path {
                    fill: var(--hover-fill) !important;
                    transform: translateY(-1px);
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover path {
                    fill: var(--base-fill) !important;
                    transform: none !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect width="120" height="34" fill="transparent" pointer-events="all" />
                <path class="path-inset-circle" d="M 10,0 L 110,0 A 10,10 0 0,0 120,10 L 120,24 A 10,10 0 0,0 110,34 L 10,34 A 10,10 0 0,0 0,24 L 0,10 A 10,10 0 0,0 10,0 Z" pointer-events="none" />
                <text x="60" y="17" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Inset</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({ type: 'button', svgContent: svgCode }));
          }}
          className="cursor-pointer inline-block mb-4"
        >
          <svg width="120" height="40" viewBox="0 -3 120 40">
            <style>{`
              .btn-inset-prev path { fill: #2179f5; transition: fill 0.2s ease, transform 0.2s ease; }
              .btn-inset-prev text { fill: #ffffff; transition: fill 0.2s ease; }
              .btn-inset-prev:hover path { fill: #1c68d4; transform: translateY(-1px); }
            `}</style>
            <g className="btn-inset-prev cursor-pointer">
              <path d="M 10,0 L 110,0 A 10,10 0 0,0 120,10 L 120,24 A 10,10 0 0,0 110,34 L 10,34 A 10,10 0 0,0 0,24 L 0,10 A 10,10 0 0,0 10,0 Z" />
              <text x="60" y="17" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="sans-serif">Inset</text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Inset Circle</span>
      </div>

      {/* Tab Button */}
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl hover:shadow-md bg-white transition-all">
        <div
          draggable="true"
          onDragStart={(e) => {
            const uniqueId = `button-${Date.now()}`;
            const svgCode = `
              <g id="${uniqueId}" data-type="button" cursor="pointer" class="btn-tab" style="--base-fill: #e91e63; --hover-fill: #cc1a56; --base-text: #ffffff; --hover-text: #ffffff;">
                <style>
                  #${uniqueId} path {
                    fill: var(--base-fill);
                    transition: fill 0.2s ease, transform 0.2s ease;
                  }
                  #${uniqueId} text {
                    fill: var(--base-text);
                    transition: fill 0.2s ease;
                  }
                  #${uniqueId}:hover path, #${uniqueId}[data-force-hover="true"] path {
                    fill: var(--hover-fill) !important;
                    transform: translateY(-1px);
                  }
                  #${uniqueId}:hover text, #${uniqueId}[data-force-hover="true"] text {
                    fill: var(--hover-text) !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover path {
                    fill: var(--base-fill) !important;
                    transform: none !important;
                  }
                  .page-svg-container #${uniqueId}[data-editor-hover="off"]:not([data-force-hover="true"]):hover text {
                    fill: var(--base-text) !important;
                  }
                </style>
                <rect width="120" height="34" fill="transparent" pointer-events="all" />
                <path class="path-tab" d="M -10,34 A 10,10 0 0,0 0,24 L 0,10 A 10,10 0 0,1 10,0 L 110,0 A 10,10 0 0,1 120,10 L 120,24 A 10,10 0 0,0 130,34 Z" pointer-events="none" />
                <text x="60" y="17" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif" style="pointer-events: none;">Tab</text>
              </g>
            `;
            e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({ type: 'button', svgContent: svgCode }));
          }}
          className="cursor-pointer inline-block mb-4 overflow-visible"
        >
          <svg width="120" height="40" viewBox="-10 -3 140 40" className="overflow-visible">
            <style>{`
              .btn-tab-prev path { fill: #e91e63; transition: fill 0.2s ease, transform 0.2s ease; }
              .btn-tab-prev text { fill: #ffffff; transition: fill 0.2s ease; }
              .btn-tab-prev:hover path { fill: #cc1a56; transform: translateY(-1px); }
            `}</style>
            <g className="btn-tab-prev cursor-pointer">
              <path d="M -10,34 A 10,10 0 0,0 0,24 L 0,10 A 10,10 0 0,1 10,0 L 110,0 A 10,10 0 0,1 120,10 L 120,24 A 10,10 0 0,0 130,34 Z" />
              <text x="60" y="17" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="sans-serif">Tab</text>
            </g>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-600">Tab</span>
      </div>
    </div>
  );
};

export default ButtonStyle;
