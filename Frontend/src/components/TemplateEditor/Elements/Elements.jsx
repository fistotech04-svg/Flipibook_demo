import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Shapes from './Shapes';
import ImageFraming from './ImageFraming';
import QRCode from './QRCode';
import Table from './Table';
import Audio from './Audio';
import ThirdPartyEmbed from './3rdPartyEmbed';

const sectionData = [
  { id: 'shapes', title: 'Shapes', component: Shapes },
  { id: 'image-framing', title: 'Image Framing', component: ImageFraming },
  { id: 'qr-code', title: 'QR Code', component: QRCode },
  { id: 'table', title: 'Table', component: Table },
  { id: 'audio', title: 'Audio', component: Audio },
  { id: 'embed', title: '3rd Party Embed', component: ThirdPartyEmbed },
];

const Elements = () => {
  const [activeCategory, setActiveCategory] = useState(null);

  if (activeCategory) {
    const ActiveComponent = sectionData.find(s => s.id === activeCategory)?.component;
    const categoryTitle = sectionData.find(s => s.id === activeCategory)?.title;
    
    return (
      <div className="flex flex-col h-full">
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
    <div className="flex flex-col gap-[2vw]">
      <div className="flex items-center gap-[0.75vw]">
        <span className="text-[1.1vw] font-semibold text-gray-900 whitespace-nowrap ">Elements</span>
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