import React from 'react';

const TextElementStyle = ({ isFullView }) => {
  return (
    <div className={`w-full grid grid-cols-2 gap-[1vw] ${isFullView ? 'p-[1vw]' : ''}`}>
      {/* Comic Style Text Element */}
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
                  color: inherit; /* Ensure div inherits text fill color */
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
                  color: inherit; /* Ensure div inherits text fill color */
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
        className="flex flex-col items-center justify-center p-[1vw] border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md bg-gray-50 transition-all cursor-pointer w-full"
      >
        <svg width="150" height="100" viewBox="0 0 250 120" style={{ pointerEvents: 'none' }}>
          <text x="20" y="45" fontFamily="'Bangers', cursive" fontSize="40" fill="#D32F2F" stroke="#000" strokeWidth="2" filter="drop-shadow(3px 3px 0px #000)">GOOD THINGS</text>
          <text x="5" y="95" fontFamily="'Bangers', cursive" fontSize="60" fill="#FBC02D" stroke="#000" strokeWidth="2" filter="drop-shadow(4px 4px 0px #000)">FEARLESS</text>
        </svg>
        <span className="text-[0.8vw] font-bold text-gray-700 mt-[0.5vw]">Comic Poster</span>
      </button>
      {/* We're Hiring Text Element */}
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
        className="flex flex-col items-center justify-center p-[1vw] border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md bg-transparent transition-all cursor-pointer w-full"
      >
        <svg width="150" height="100" viewBox="0 0 250 120" style={{ pointerEvents: 'none' }}>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Satisfy&amp;display=swap');
          </style>
          <text x="30" y="50" fontFamily="'Satisfy', cursive" fontSize="60" fill="#025EE8" filter="drop-shadow(2px 2px 0px rgba(0,0,0,0.15))">We're</text>
          <text x="70" y="105" fontFamily="'Satisfy', cursive" fontSize="70" fill="#025EE8" filter="drop-shadow(2px 2px 0px rgba(0,0,0,0.15))">Hiring!</text>
        </svg>
        <span className="text-[0.8vw] font-bold text-gray-700 mt-[0.5vw]">We're Hiring</span>
      </button>
      {/* Free Shipping Text Element */}
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
        className="flex flex-col items-center justify-center p-[1vw] border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md bg-transparent transition-all cursor-pointer w-full"
      >
        <svg width="150" height="100" viewBox="0 0 250 120" style={{ pointerEvents: 'none' }}>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&amp;display=swap');
          </style>
          <text x="10" y="55" fontFamily="'Oswald', sans-serif" fontWeight="700" fontSize="55" fill="#E60012" stroke="#FFD700" strokeWidth="4" style={{ paintOrder: 'stroke fill', strokeLinejoin: 'round' }}>FREE</text>
          <text x="10" y="115" fontFamily="'Oswald', sans-serif" fontWeight="700" fontSize="55" fill="#FFD700" stroke="#FFD700" strokeWidth="4" style={{ paintOrder: 'stroke fill', strokeLinejoin: 'round' }}>SHIPPING</text>
        </svg>
        <span className="text-[0.8vw] font-bold text-gray-700 mt-[0.5vw]">Free Shipping</span>
      </button>
      {/* Golden Hour Text Element */}
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
        className="flex flex-col items-center justify-center p-[1vw] border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md bg-transparent transition-all cursor-pointer w-full"
      >
        <svg width="150" height="100" viewBox="0 0 250 120" style={{ pointerEvents: 'none' }}>
          <text x="25" y="55" fontFamily="'Courier New', Courier, monospace" fontSize="55" fill="#DAA520" filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.25))">GOLDEN</text>
          <text x="65" y="115" fontFamily="'Courier New', Courier, monospace" fontSize="55" fill="#DAA520" filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.25))">HOUR</text>
        </svg>
        <span className="text-[0.8vw] font-bold text-gray-700 mt-[0.5vw]">Golden Hour</span>
      </button>
      {/* Holiday Text Element */}
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
        className="flex flex-col items-center justify-center p-[1vw] border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md bg-transparent transition-all cursor-pointer w-full"
      >
        <svg width="150" height="100" viewBox="0 0 250 120" style={{ pointerEvents: 'none' }}>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&amp;display=swap');
          </style>
          <text x="35" y="75" fontFamily="'Playfair Display', serif" fontWeight="700" fontSize="55" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="4" style={{ paintOrder: 'stroke fill', strokeLinejoin: 'round' }} filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.25))">Holiday</text>
        </svg>
        <span className="text-[0.8vw] font-bold text-gray-700 mt-[0.5vw]">Holiday</span>
      </button>
    </div>
  );
};

export default TextElementStyle;
