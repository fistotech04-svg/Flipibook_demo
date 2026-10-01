import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Replace } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

export const lucideList = Object.keys(LucideIcons)
  .filter(key => key !== 'createLucideIcon' && key !== 'default' && key !== 'icons' && key !== 'Icon' && /^[A-Z]/.test(key))
  .map(key => ({ name: key, Component: LucideIcons[key] }));

const IconGallery = ({
  isOpen,
  onClose,
  onSelect,
  className = "fixed z-[10000] bg-white border border-gray-100 rounded-[0.75vw] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200",
  style = {
    width: '20vw',
    height: '34vw',
    top: '55%',
    left: '80%',
    transform: 'translate(-50%, -50%)'
  }
}) => {
  const [tempSelectedIcon, setTempSelectedIcon] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, isOpen]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setVisibleCount(prev => prev + 50);
    }
  };

  const filteredIcons = useMemo(() => {
    if (!searchQuery) return lucideList;
    const lower = searchQuery.toLowerCase();
    return lucideList.filter(icon => icon.name.toLowerCase().includes(lower));
  }, [searchQuery]);

  const handleSelectIcon = () => {
    if (!tempSelectedIcon) return;

    let iconData = { ...tempSelectedIcon };

    // If it's a lucide component, extract its inner SVG content
    if (tempSelectedIcon.Component) {
      const markup = renderToStaticMarkup(<tempSelectedIcon.Component />);
      const parser = new DOMParser();
      const doc = parser.parseFromString(markup, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (svg) {
        iconData.html = svg.innerHTML;
        iconData.viewBox = svg.getAttribute('viewBox') || '0 0 24 24';
      }
    }

    onSelect(iconData);
  };

  if (!isOpen) return null;

  return (
    <div
      className={className}
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex px-[1.5vw] pt-[1.5vw] pb-[0.5vw] bg-white items-center justify-between">
        <div className="flex items-center gap-[1vw] flex-1 mr-[1vw]">
          <span className="text-[1vw] font-medium text-[#003366]">Icon Gallery</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X size="1.2vw" />
        </button>
      </div>

      <div className="px-[1.5vw] py-[1vw] border-b bg-white">
        <div className="relative">
          <Search size="1vw" className="absolute left-[0.75vw] top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[2.25vw] pl-[2.25vw] pr-[2vw] text-[0.75vw] bg-gray-50 border border-gray-200 rounded-full outline-none focus:border-black transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-[0.75vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size="0.9vw" />
            </button>
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-[1.5vw] py-[1.5vw] custom-scrollbar"
        onScroll={handleScroll}
      >
        <div className="grid grid-cols-5 gap-[0.75vw]">
          {filteredIcons.slice(0, visibleCount).map((icon, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => {
                let iconData = { ...icon };
                if (icon.Component) {
                  const markup = renderToStaticMarkup(<icon.Component />);
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(markup, 'image/svg+xml');
                  const svg = doc.querySelector('svg');
                  if (svg) {
                    iconData.html = svg.innerHTML;
                    iconData.viewBox = svg.getAttribute('viewBox') || '0 0 24 24';
                  }
                }
                // Exclude Component from serialization to avoid errors
                const { Component, ...safeIconData } = iconData;
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'icon', icon: safeIconData }));
                // Optional: set drag image or effect
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => setTempSelectedIcon(icon)}
              className={`aspect-square rounded-[0.4vw] flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 ${tempSelectedIcon === icon ? 'bg-gray-200 ring-2 ring-gray-300' : 'bg-transparent'}`}
            >
              {icon.Component ? (
                <icon.Component className="w-[2.25vw] h-[2.25vw] text-black pointer-events-none" strokeWidth={1.5} />
              ) : (
                <svg viewBox={icon.viewBox} className="w-[2.25vw] h-[2.25vw] fill-black pointer-events-none">
                  {icon.html ? (
                    <g dangerouslySetInnerHTML={{ __html: icon.html }} />
                  ) : (
                    <path d={icon.d} />
                  )}
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-[0.75vw] border-t flex justify-end gap-[0.5vw] bg-white">
        <button
          disabled={!tempSelectedIcon}
          onClick={handleSelectIcon}
          className="flex-1 h-[2vw] bg-black text-white rounded-[0.5vw] text-[0.7vw] font-semibold flex items-center justify-center hover:bg-zinc-800 disabled:opacity-50"
        >
          Place on Page
        </button>
      </div>
    </div>
  );
};

export default IconGallery;