import React from 'react';
import { Plus } from 'lucide-react';

const ThirdPartyEmbed = ({ isFullView }) => {
  const handleClick = () => {
    let pw = 297, ph = 210;
    try {
      const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
      const svgRoot = editorDoc.querySelector('.flipbook-page-container svg') || editorDoc.querySelector('.flipbook-page svg') || editorDoc.querySelector('svg');
      if (svgRoot && svgRoot.getAttribute('viewBox')) {
        const vb = svgRoot.getAttribute('viewBox').split(/[\s,]+/).map(Number);
        if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) {
          pw = vb[2];
          ph = vb[3];
        }
      }
    } catch (e) {}

    const cx = (pw - 200) / 2;
    const cy = (ph - 150) / 2;

    // Add a placeholder SVG frame for the embed
    window.dispatchEvent(new CustomEvent('add-icon-to-editor', {
      detail: {
        icon: {
          html: `<g data-type="embed-frame" transform="translate(${cx}, ${cy}) scale(0.5)" data-fill-color="#f3f4f6" data-fill-opacity="1">
                   <rect class="embed-fill-layer" x="0" y="0" width="400" height="300" fill="#f3f4f6" opacity="1" pointer-events="none" />
                   <g class="embed-content-group" pointer-events="none">
                     <rect width="400" height="300" fill="transparent" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,6" rx="8" />
                     <rect x="50" y="50" width="300" height="200" fill="#e5e7eb" rx="12" />
                     <path d="M 50 62 Q 50 50 62 50 L 338 50 Q 350 50 350 62 L 350 80 L 50 80 Z" fill="#d1d5db" />
                     <circle cx="70" cy="65" r="4" fill="#ffffff" opacity="0.8" />
                     <circle cx="85" cy="65" r="4" fill="#ffffff" opacity="0.8" />
                     <circle cx="100" cy="65" r="4" fill="#ffffff" opacity="0.8" />
                     <g transform="translate(160, 110) scale(3.5)" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.7">
                       <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                       <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                     </g>
                   </g>
                   <rect class="svg-image-stroke-overlay" x="0" y="0" width="400" height="300" fill="transparent" pointer-events="all" />
                 </g>`,
          name: 'Embed Frame',
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
    <div className="w-full px-[0.5vw]">
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-[0.5vw] bg-white border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-sm text-gray-700 font-medium py-[0.6vw] px-[1vw] rounded-[0.4vw] transition-all"
      >
        <Plus size="1.2vw" />
        <span className="text-[0.9vw]">Create frame</span>
      </button>
    </div>
  );
};

export default ThirdPartyEmbed;
