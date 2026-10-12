import React from 'react';

const SlideShowStyle = ({ isFullView }) => {
  return (
    <div className={`grid grid-cols-2 gap-[0.5vw] ${isFullView ? 'p-[0.5vw]' : ''}`}>
      <button
        draggable="true"
        onDragStart={(e) => {
          const uniqueId = Date.now();
            const svgCode = `
              <g id="slideshow-${uniqueId}" data-type="slideshow" cursor="pointer">
                <defs>
                  <pattern id="slideshow-pattern-${uniqueId}" patternUnits="userSpaceOnUse" width="105" height="126">
                    <image href="https://placehold.co/105x126/ffffff/9ca3af?text=Slideshow" x="0" y="0" width="105" height="126" preserveAspectRatio="none" />
                  </pattern>
                </defs>
                <!-- Left frame -->
                <rect x="0" y="8" width="80" height="124" rx="10" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" style="transform: perspective(400px) rotateY(25deg); transform-origin: 100% 50%; transform-box: fill-box; transition: all 0.3s ease;"/>
                <!-- Right frame -->
                <rect x="120" y="8" width="110" height="124" rx="10" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" style="transform: perspective(400px) rotateY(-22deg); transform-origin: 0% 50%; transform-box: fill-box; transition: all 0.3s ease;"/>
                <!-- Center frame -->
                <rect x="40" y="0" width="130" height="140" rx="12" stroke="#9ca3af" stroke-width="2" fill="url(#slideshow-pattern-${uniqueId})" style="transform: perspective(400px) rotateY(0deg); transform-origin: 50% 50%; transform-box: fill-box; transition: all 0.3s ease;"/>
                <!-- Invisible bounding box for selection/interaction -->
                <rect x="0" y="0" width="210" height="140" fill="transparent" />
              </g>
            `;
          e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
            type: 'slideshow',
            svgContent: svgCode
          }));
          e.dataTransfer.setData('text/plain', 'slideshow');
        }}
        onClick={() => {
          const uniqueId = Date.now();
            const svgCode = `
              <g id="slideshow-${uniqueId}" data-type="slideshow" cursor="pointer" transform="translate(15, 88.5)">
                <defs>
                  <pattern id="slideshow-pattern-${uniqueId}" patternUnits="userSpaceOnUse" width="105" height="126">
                    <image href="https://placehold.co/105x126/ffffff/9ca3af?text=Slideshow" x="0" y="0" width="105" height="126" preserveAspectRatio="none" />
                  </pattern>
                </defs>
                <!-- Left frame -->
                <rect x="0" y="8" width="80" height="124" rx="10" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" style="transform: perspective(400px) rotateY(25deg); transform-origin: 100% 50%; transform-box: fill-box; transition: all 0.3s ease;"/>
                <!-- Right frame -->
                <rect x="120" y="8" width="110" height="124" rx="10" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" style="transform: perspective(400px) rotateY(-22deg); transform-origin: 0% 50%; transform-box: fill-box; transition: all 0.3s ease;"/>
                <!-- Center frame -->
                <rect x="40" y="0" width="130" height="140" rx="12" stroke="#9ca3af" stroke-width="2" fill="url(#slideshow-pattern-${uniqueId})" style="transform: perspective(400px) rotateY(0deg); transform-origin: 50% 50%; transform-box: fill-box; transition: all 0.3s ease;"/>
                <!-- Invisible bounding box for selection/interaction -->
                <rect x="0" y="0" width="210" height="140" fill="transparent" />
              </g>
            `;
          window.dispatchEvent(new CustomEvent('add-element-to-editor', {
            detail: { svgContent: svgCode }
          }));
        }}
        className="flex flex-col items-center justify-center p-[1vw] bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
      >
        <svg width="40" height="30" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-[0.5vw] text-gray-400 group-hover:text-blue-500 transition-colors">
          <rect x="2" y="8" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="#f3f4f6"/>
          <rect x="38" y="8" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="#f3f4f6"/>
          <rect x="15" y="2" width="30" height="36" rx="3" stroke="currentColor" strokeWidth="2" fill="white" />
          <path d="M22 20L25 17V23L22 20Z" fill="currentColor"/>
          <path d="M38 20L35 17V23L38 20Z" fill="currentColor"/>
        </svg>
        <span className="text-[0.7vw] font-medium text-gray-700 group-hover:text-blue-600 transition-colors">3D Coverflow</span>
      </button>

      {/* Second Slideshow Style: Flat Gallery */}
      <button
        draggable="true"
        onDragStart={(e) => {
          const uniqueId = Date.now();
            const svgCode = `
              <g id="slideshow-${uniqueId}" data-type="slideshow" data-style="flat" cursor="pointer">
                <defs>
                  <pattern id="slideshow-pattern-${uniqueId}" patternUnits="userSpaceOnUse" width="110" height="140">
                    <image href="https://placehold.co/110x140/ffffff/9ca3af?text=Gallery" x="0" y="0" width="110" height="140" preserveAspectRatio="none" />
                  </pattern>
                </defs>
                <!-- Left frame -->
                <rect class="main-frame" x="0" y="0" width="46" height="140" rx="6" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" style="opacity: 0.5; transition: all 0.3s ease;"/>
                <!-- Right frame -->
                <rect class="main-frame" x="164" y="0" width="46" height="140" rx="6" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" style="opacity: 0.5; transition: all 0.3s ease;"/>
                <!-- Center frame -->
                <rect class="main-frame" x="50" y="0" width="110" height="140" rx="8" stroke="#9ca3af" stroke-width="2" fill="url(#slideshow-pattern-${uniqueId})" style="transition: all 0.3s ease; box-shadow: 0 0 10px rgba(0,0,0,0.5);"/>
                
                <!-- Thumbnails -->
                <rect class="thumb-frame" x="0" y="150" width="34" height="24" rx="2" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" />
                <rect class="thumb-frame" x="44" y="150" width="34" height="24" rx="2" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" />
                <rect class="thumb-frame" x="88" y="150" width="34" height="24" rx="2" stroke="#0ea5e9" stroke-width="2" fill="url(#slideshow-pattern-${uniqueId})" />
                <rect class="thumb-frame" x="132" y="150" width="34" height="24" rx="2" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" />
                <rect class="thumb-frame" x="176" y="150" width="34" height="24" rx="2" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" />
                
                <!-- Scrollbar -->
                <rect class="scrollbar-track" x="0" y="182" width="210" height="4" rx="2" fill="#334155" />
                <rect class="scrollbar-thumb" x="85" y="182" width="40" height="4" rx="2" fill="#0ea5e9" style="transition: all 0.3s ease;" />

                <!-- Invisible bounding box for selection/interaction -->
                <rect class="bbox-anchor" x="0" y="0" width="210" height="190" fill="transparent" />
              </g>
            `;
          e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
            type: 'slideshow',
            svgContent: svgCode
          }));
          e.dataTransfer.setData('text/plain', 'slideshow');
        }}
        onClick={() => {
          const uniqueId = Date.now();
            const svgCode = `
              <g id="slideshow-${uniqueId}" data-type="slideshow" data-style="flat" cursor="pointer" transform="translate(15, 88.5)">
                <defs>
                  <pattern id="slideshow-pattern-${uniqueId}" patternUnits="userSpaceOnUse" width="110" height="140">
                    <image href="https://placehold.co/110x140/ffffff/9ca3af?text=Gallery" x="0" y="0" width="110" height="140" preserveAspectRatio="none" />
                  </pattern>
                </defs>
                <!-- Left frame -->
                <rect class="main-frame" x="0" y="0" width="46" height="140" rx="6" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" style="opacity: 0.5; transition: all 0.3s ease;"/>
                <!-- Right frame -->
                <rect class="main-frame" x="164" y="0" width="46" height="140" rx="6" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" style="opacity: 0.5; transition: all 0.3s ease;"/>
                <!-- Center frame -->
                <rect class="main-frame" x="50" y="0" width="110" height="140" rx="8" stroke="#9ca3af" stroke-width="2" fill="url(#slideshow-pattern-${uniqueId})" style="transition: all 0.3s ease; box-shadow: 0 0 10px rgba(0,0,0,0.5);"/>
                
                <!-- Thumbnails -->
                <rect class="thumb-frame" x="0" y="150" width="34" height="24" rx="2" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" />
                <rect class="thumb-frame" x="44" y="150" width="34" height="24" rx="2" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" />
                <rect class="thumb-frame" x="88" y="150" width="34" height="24" rx="2" stroke="#0ea5e9" stroke-width="2" fill="url(#slideshow-pattern-${uniqueId})" />
                <rect class="thumb-frame" x="132" y="150" width="34" height="24" rx="2" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" />
                <rect class="thumb-frame" x="176" y="150" width="34" height="24" rx="2" stroke="#9ca3af" stroke-width="1" fill="#f3f4f6" />
                
                <!-- Scrollbar -->
                <rect class="scrollbar-track" x="0" y="182" width="210" height="4" rx="2" fill="#334155" />
                <rect class="scrollbar-thumb" x="85" y="182" width="40" height="4" rx="2" fill="#0ea5e9" style="transition: all 0.3s ease;" />

                <!-- Invisible bounding box for selection/interaction -->
                <rect class="bbox-anchor" x="0" y="0" width="210" height="190" fill="transparent" />
              </g>
            `;
          window.dispatchEvent(new CustomEvent('add-element-to-editor', {
            detail: { svgContent: svgCode }
          }));
        }}
        className="flex flex-col items-center justify-center p-[1vw] bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
      >
        <svg width="40" height="30" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-[0.5vw] text-gray-400 group-hover:text-blue-500 transition-colors">
          <rect x="2" y="2" width="14" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="#f3f4f6" opacity="0.5"/>
          <rect x="44" y="2" width="14" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="#f3f4f6" opacity="0.5"/>
          <rect x="20" y="2" width="20" height="36" rx="3" stroke="currentColor" strokeWidth="2" fill="white" />
        </svg>
        <span className="text-[0.7vw] font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Flat Gallery</span>
      </button>
    </div>
  );
};

export default SlideShowStyle;
