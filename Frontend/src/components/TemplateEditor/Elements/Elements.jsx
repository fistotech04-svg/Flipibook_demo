import React from 'react';

import ButtonStyle from './ButtonStyle';
import { Icon } from '@iconify/react';
const Elements = () => {
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
      {/* Removed Elements header */}
      
      <div className="p-4 flex flex-col gap-4">
        {/* We can add more categories here later, for now we just show the ButtonStyle */}
        <div>
          <div className="flex items-center gap-[0.75vw] mb-[0.5vw]">
            <h3 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Buttons</h3>
            <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
          </div>
          <ButtonStyle />
        </div>
        
        <div>
          <div className="flex items-center gap-[0.75vw] mb-[0.5vw]">
            <h3 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Map</h3>
            <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
          </div>
          <div className="grid grid-cols-2 gap-[0.5vw]">
            <button 
              draggable="true"
              onDragStart={(e) => {
                const uniqueId = Date.now();
                const defaultUrl = `https://maps.google.com/maps?q=Coimbatore,%20Tamil%20Nadu&t=&z=13&ie=UTF8&iwloc=&output=embed`;
                const svgCode = `
                  <g id="map-${uniqueId}" data-type="map" cursor="pointer" data-url="${defaultUrl.replace(/&/g, '&amp;')}">
                    <foreignObject x="0" y="0" width="180" height="120">
                      <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; transform: translateZ(0); -webkit-transform: translateZ(0); will-change: transform;">
                        <iframe src="${defaultUrl.replace(/&/g, '&amp;')}" width="100%" height="100%" style="border:0; pointer-events: none; margin: 0; display: block;" allowfullscreen="" loading="lazy"></iframe>
                      </div>
                    </foreignObject>
                    <rect x="0" y="0" width="180" height="120" fill="transparent" />
                  </g>
                `;
                e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
                  type: 'map',
                  svgContent: svgCode
                }));
              }}
              onClick={() => {
                const uniqueId = Date.now();
                const defaultUrl = `https://maps.google.com/maps?q=Coimbatore,%20Tamil%20Nadu&t=&z=13&ie=UTF8&iwloc=&output=embed`;
                // Centered on a 210x297 A4 canvas: (210 - 180) / 2 = 15, (297 - 120) / 2 = 88.5
                const svgCode = `
                  <g id="map-${uniqueId}" data-type="map" cursor="pointer" data-url="${defaultUrl.replace(/&/g, '&amp;')}" transform="translate(15, 88.5)">
                    <foreignObject x="0" y="0" width="180" height="120">
                      <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; transform: translateZ(0); -webkit-transform: translateZ(0); will-change: transform;">
                        <iframe src="${defaultUrl.replace(/&/g, '&amp;')}" width="100%" height="100%" style="border:0; pointer-events: none; margin: 0; display: block;" allowfullscreen="" loading="lazy"></iframe>
                      </div>
                    </foreignObject>
                    <rect x="0" y="0" width="180" height="120" fill="transparent" />
                  </g>
                `;
                window.dispatchEvent(new CustomEvent('add-element-to-editor', {
                  detail: { svgContent: svgCode }
                }));
              }}
              className="flex flex-col items-center justify-center p-[1vw] bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
            >
              <Icon icon="grommet-icons:map-location" className="text-gray-500 group-hover:text-blue-500 transition-colors mb-[0.5vw]" style={{ fontSize: '1.5vw' }} />
              <span className="text-[0.7vw] font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Elements;
