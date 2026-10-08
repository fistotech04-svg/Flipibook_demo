import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Icon } from '@iconify/react';
import Shapes from './Shapes';
import ImageFraming from './ImageFraming';
import QRCode from './QRCode';
import Table from './Table';
import Audio from './Audio';
import ThirdPartyEmbed from './3rdPartyEmbed';
import ButtonStyle from './ButtonStyle';

// Map element as inline component (your work)
const MapElement = ({ isFullView }) => {
  return (
    <div className={`grid grid-cols-2 gap-[0.5vw] ${isFullView ? 'p-[0.5vw]' : ''}`}>
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
  );
};

const sectionData = [
  { id: 'shapes',        title: 'Shapes',          component: Shapes },
  { id: 'image-framing', title: 'Image Framing',   component: ImageFraming },
  { id: 'qr-code',       title: 'QR Code',         component: QRCode },
  { id: 'table',         title: 'Table',            component: Table },
  { id: 'audio',         title: 'Audio',            component: Audio },
  { id: 'embed',         title: '3rd Party Embed',  component: ThirdPartyEmbed },
  { id: 'buttons',       title: 'Buttons',          component: ButtonStyle },
  { id: 'map',           title: 'Map',              component: MapElement },
];

const Elements = () => {
  const [activeCategory, setActiveCategory] = useState(null);

  if (activeCategory) {
    const ActiveComponent = sectionData.find(s => s.id === activeCategory)?.component;
    const categoryTitle = sectionData.find(s => s.id === activeCategory)?.title;

    return (
      <div className="flex-1 flex flex-col h-full p-[1.5vw]">
        <div
          className="flex items-center gap-[0.5vw] mb-[1vw] cursor-pointer hover:bg-gray-50 p-[0.5vw] rounded-[0.4vw] transition-colors -ml-[0.5vw]"
          onClick={() => setActiveCategory(null)}
        >
          <ChevronLeft size="1.2vw" className="text-gray-600" />
          <span className="text-[1vw] font-semibold text-gray-800">{categoryTitle}</span>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {ActiveComponent && <ActiveComponent isFullView={true} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-[2vw] h-full overflow-y-auto no-scrollbar pb-[2vw] p-[1.5vw]">
      <div className="flex items-center gap-[0.75vw]">
        <span className="text-[1.1vw] font-semibold text-gray-900 whitespace-nowrap">Elements</span>
        <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
      </div>

      {sectionData.map((section) => (
        <div key={section.id} className="flex flex-col gap-[1vw]">
          <div className="flex items-center justify-between">
            <span className="text-[1vw] font-medium text-gray-800">{section.title}</span>
            <div
              className="flex items-center gap-[0.2vw] cursor-pointer text-gray-500 hover:text-indigo-600 transition-colors group"
              onClick={() => setActiveCategory(section.id)}
            >
              <span className="text-[0.75vw] font-medium">More</span>
              <ChevronRight size="0.8vw" className="group-hover:translate-x-[0.1vw] transition-transform" />
            </div>
          </div>
          <div className="w-full">
            <section.component isFullView={false} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Elements;