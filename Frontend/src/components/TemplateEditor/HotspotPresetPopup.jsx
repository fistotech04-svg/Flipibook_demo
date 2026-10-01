import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';

// Import all 18 SVGs from assets
import openLinkSvg from '../../assets/hotspot preset icon/icons/openlink.svg';
import whatsappSvg from '../../assets/hotspot preset icon/icons/whatsapp.svg';
import navigationSvg from '../../assets/hotspot preset icon/icons/Navigation.svg';
import threeDSvg from '../../assets/hotspot preset icon/icons/3D.svg';
import callSvg from '../../assets/hotspot preset icon/icons/call.svg';
import emailSvg from '../../assets/hotspot preset icon/icons/email.svg';
import locationSvg from '../../assets/hotspot preset icon/icons/location.svg';
import youtubeSvg from '../../assets/hotspot preset icon/icons/yotube.svg';
import instagramSvg from '../../assets/hotspot preset icon/icons/instagram.svg';
import xSvg from '../../assets/hotspot preset icon/icons/X.svg';
import facebookSvg from '../../assets/hotspot preset icon/icons/facebook.svg';
import linkedinSvg from '../../assets/hotspot preset icon/icons/linkedin.svg';
import videoSvg from '../../assets/hotspot preset icon/icons/vedio.svg';
import popupSvg from '../../assets/hotspot preset icon/icons/popup.svg';
import slideshowSvg from '../../assets/hotspot preset icon/icons/slideshow.svg';
import zoomSvg from '../../assets/hotspot preset icon/icons/zoom.svg';
import downloadSvg from '../../assets/hotspot preset icon/icons/download.svg';
import infoSvg from '../../assets/hotspot preset icon/icons/info.svg';
import audioSvg from '../../assets/hotspot preset icon/icons/audio.svg';

export const presets = [
  { id: 'open-link', label: 'Open Link', src: openLinkSvg },
  { id: 'email', label: 'Email', src: emailSvg },
  { id: 'location', label: 'Location', src: locationSvg },
  { id: 'call', label: 'Call', src: callSvg },
  { id: '3d-viewer', label: '3D Viewer', src: threeDSvg },
  { id: 'navigate-to', label: 'Navigate Page', src: navigationSvg },
  { id: 'video', label: 'Video', src: videoSvg },
  { id: 'popup', label: 'Popup', src: popupSvg },
  { id: 'slideshow', label: 'Slideshow', src: slideshowSvg },
  { id: 'zoom', label: 'Zoom', src: zoomSvg },
  { id: 'download', label: 'Download', src: downloadSvg },
  { id: 'audio', label: 'Audio', src: audioSvg },
  { id: 'info-box', label: 'Info Popup', src: infoSvg },
  { id: 'whatsapp', label: 'WhatsApp', src: whatsappSvg },
  { id: 'youtube', label: 'You tube', src: youtubeSvg },
  { id: 'instagram', label: 'Instagram', src: instagramSvg },
  { id: 'x', label: 'X', src: xSvg },
  { id: 'facebook', label: 'Facebook', src: facebookSvg },
  { id: 'linkedin', label: 'Linked in', src: linkedinSvg }
];

const HotspotPresetPopup = ({ onClose, onSelectPreset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // If clicking inside the popup, do nothing
      if (popupRef.current && popupRef.current.contains(event.target)) {
        return;
      }
      
      // We also need to avoid closing if the click was on the trigger button itself.
      // The trigger button in MainEditor.jsx has id="hotspot-trigger-container" or is part of it.
      const trigger = document.getElementById('hotspot-trigger-container');
      if (trigger && trigger.contains(event.target)) {
        return;
      }
      
      onClose();
    };

    // Use mousedown to catch it before other elements handle click
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const filteredPresets = presets.filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return createPortal(
    <div 
      ref={popupRef}
      className="fixed right-[12vw] top-[10vh] bg-white rounded-[0.8vw] shadow-[0_4px_20px_rgba(0,0,0,0.15)] w-[18vw] border border-gray-100 flex flex-col z-[99999] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header: Search and Style Dropdown */}
      <div className="p-[1vw] border-b border-gray-100 flex items-center justify-between gap-[0.5vw]">
        <div className="relative flex-1">
          <Icon icon="lucide:search" className="absolute left-[0.5vw] top-1/2 -translate-y-1/2 text-gray-400 text-[0.9vw]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-[2vw] pr-[0.5vw] py-[0.4vh] bg-gray-50 border border-gray-200 rounded-[0.4vw] text-[0.8vw] focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
        </div>
        <div className="w-[5vw] border border-gray-200 rounded-[0.4vw] px-[0.5vw] py-[0.4vh] flex items-center justify-between cursor-pointer bg-white">
          <span className="text-[0.75vw] text-gray-600">Style 1</span>
          <Icon icon="lucide:chevron-down" className="text-gray-400 text-[0.8vw]" />
        </div>
      </div>

      <div className="flex-1 p-[1vw]">
        {/* Interactive Hotspot Section */}
        <div className="flex items-center gap-[0.5vw] mb-[1vh]">
          <h3 className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Interactive Hotspot</h3>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <div className="grid grid-cols-4 gap-y-[0.5vh] gap-x-[0.5vw] mb-[2vh]">
          {filteredPresets.filter(p => !['whatsapp', 'youtube', 'instagram', 'x', 'facebook', 'linkedin'].includes(p.id)).map((preset) => (
            <div 
              key={preset.id}
              className="group flex flex-col items-center cursor-grab active:cursor-grabbing hover:bg-gray-50 rounded-[0.5vw] p-[0.4vw] transition-colors"
              draggable="true"
              onDragStart={(e) => {
                const data = {
                  type: 'hotspot',
                  icon: { presetId: preset.id, src: preset.src }
                };
                e.dataTransfer.setData('application/json', JSON.stringify(data));
                e.dataTransfer.effectAllowed = 'copy';
              }}

            >
              <div className="w-[2.8vw] h-[2.8vw] flex items-center justify-center rounded-full pointer-events-none">
                <img src={preset.src} alt={preset.label} className="w-full h-full object-contain pointer-events-none" />
              </div>
              <span className="text-[0.6vw] text-gray-600 font-medium text-center leading-tight mt-[0.3vh]">
                {preset.label}
              </span>
            </div>
          ))}
        </div>

        {/* Social Media Icons Section */}
        <div className="flex items-center gap-[0.5vw] mb-[1vh]">
          <h3 className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Social Media Icons</h3>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <div className="grid grid-cols-4 gap-y-[0.5vh] gap-x-[0.5vw] mb-[2vh]">
          {filteredPresets.filter(p => ['whatsapp', 'youtube', 'instagram', 'x', 'facebook', 'linkedin'].includes(p.id)).map((preset) => (
            <div 
              key={preset.id}
              className="group flex flex-col items-center cursor-grab active:cursor-grabbing hover:bg-gray-50 rounded-[0.5vw] p-[0.4vw] transition-colors"
              draggable="true"
              onDragStart={(e) => {
                const data = {
                  type: 'hotspot',
                  icon: { presetId: preset.id, src: preset.src }
                };
                e.dataTransfer.setData('application/json', JSON.stringify(data));
                e.dataTransfer.effectAllowed = 'copy';
              }}

            >
              <div className="w-[2.8vw] h-[2.8vw] flex items-center justify-center rounded-full pointer-events-none">
                <img src={preset.src} alt={preset.label} className="w-full h-full object-contain pointer-events-none" />
              </div>
              <span className="text-[0.6vw] text-gray-600 font-medium text-center leading-tight mt-[0.3vh]">
                {preset.label}
              </span>
            </div>
          ))}
        </div>

        {/* Interactive Buttons Section */}
        <div className="flex items-center gap-[0.5vw] mb-[1vh]">
          <h3 className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Interactive Buttons</h3>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <div className="flex flex-wrap gap-[0.5vw] mb-[1vh]">
          {[
            { id: 'btn-blue', color: '#2D8CFF', text: 'Button', rounded: 4, w: 80, h: 32 },
            { id: 'btn-orange', color: '#FF7A00', text: 'Button', rounded: 4, w: 80, h: 32 },
            { id: 'btn-purple-icon', color: '#7B42F6', text: 'Icon', rounded: 4, w: 80, h: 32, icon: true },
            { id: 'btn-yellow-round', color: '#FFD600', text: 'Round Button', rounded: 16, w: 100, h: 32 },
            { id: 'btn-purple-round', color: '#7B42F6', text: 'Button', rounded: 16, w: 80, h: 32 }
          ].map((btn) => {
          
            const handleDragStart = (e) => {
              let html = `<rect x="0" y="0" width="${btn.w}" height="${btn.h}" rx="${btn.rounded}" fill="${btn.color}" />`;
              if (btn.icon) {
                const textWidth = btn.text.length * (14 * 0.55);
                const contentWidth = 15 + 5 + textWidth;
                const startX = (btn.w - contentWidth) / 2;
                const textX = startX + 20 + (textWidth / 2);
              
                html += `<g transform="translate(${startX - 20}, 0)">`;
                html += `<path d="M20 16 L25 21 L35 11" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
                html += `</g>`;
                html += `<text x="${textX}" y="21" fill="#ffffff" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle" data-type="text">${btn.text}</text>`;
              } else {
                html += `<text x="${btn.w / 2}" y="21" fill="#ffffff" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle" data-type="text">${btn.text}</text>`;
              }
              const data = {
                type: 'hotspot',
                icon: { 
                  presetId: 'interactive-button', 
                  html: html,
                  bgColor: btn.color,
                  iconColor: '#ffffff'
                }
              };
              if (e) {
                e.dataTransfer.setData('application/json', JSON.stringify(data));
                e.dataTransfer.effectAllowed = 'copy';
              }
              return data;
            };

            const handleClick = () => {
              const data = handleDragStart();
              window.dispatchEvent(new CustomEvent('add-hotspot-to-editor', {
                detail: { icon: data.icon }
              }));
            };

            return (
              <div 
                key={btn.id}
                className={`bg-[${btn.color}] flex items-center justify-center cursor-grab active:cursor-grabbing hover:opacity-90 transition-opacity`}
                style={{ 
                  backgroundColor: btn.color, 
                  borderRadius: btn.rounded === 4 ? '0.4vw' : '9999px',
                  padding: btn.icon ? '0.5vh 0.8vw' : '0.5vh 1vw'
                }}
                draggable="true"
                onDragStart={handleDragStart}
              >
                {btn.icon && <Icon icon="lucide:check" className="text-white text-[0.7vw] mr-[0.3vw]" />}
                <span className="text-white text-[0.7vw] font-semibold">{btn.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HotspotPresetPopup;
