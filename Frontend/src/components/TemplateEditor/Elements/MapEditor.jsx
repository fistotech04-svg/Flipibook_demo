import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Info, Maximize, X } from 'lucide-react';

const MapEditor = ({ selectedElement, onUpdate }) => {
  const [location, setLocation] = useState('Coimbatore, Tamil Nadu');
  const [iframeUrl, setIframeUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);
  const iframeRef = useRef(null);

  // Initial load
  useEffect(() => {
    // Default URL for the preview so it matches the screenshot out of the box
    const defaultUrl = `https://maps.google.com/maps?q=${encodeURIComponent('Coimbatore, Tamil Nadu')}&t=&z=13&ie=UTF8&iwloc=near&output=embed`;
    
    if (selectedElement) {
      const url = selectedElement.getAttribute('data-url') || defaultUrl;
      setIframeUrl(url);
    } else {
      setIframeUrl(defaultUrl);
    }
  }, [selectedElement]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationChange = async (e) => {
    const value = e.target.value;
    setLocation(value);

    // Auto-detect if user entered Latitude, Longitude coordinates (e.g. 11.0168, 76.9558)
    const isCoordinateRegex = /^[-+]?\d{1,2}(\.\d+)?\s*,\s*[-+]?\d{1,3}(\.\d+)?$/;
    
    if (isCoordinateRegex.test(value.trim())) {
      setSuggestions([{
        display_name: value.trim(),
        isCoordinate: true
      }]);
      setShowSuggestions(true);
      return;
    }

    if (value.length > 1) {
      try {
        // Using OpenStreetMap's Nominatim API for free suggestions but styling it like Google
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`);
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const placeName = suggestion.display_name;
    setLocation(placeName);
    setShowSuggestions(false);
    
    // Automatically search when clicked
    updateMap(placeName);
  };

  const updateMap = (searchQuery) => {
    if (!searchQuery) return;
    const encoded = encodeURIComponent(searchQuery);
    const newUrl = `https://maps.google.com/maps?q=${encoded}&t=&z=13&ie=UTF8&iwloc=near&output=embed`;
    setIframeUrl(newUrl);

    if (selectedElement && onUpdate) {
      selectedElement.setAttribute('data-url', newUrl);
      
      const iframe = selectedElement.querySelector('iframe');
      if (iframe) {
        iframe.src = newUrl;
      }
      
      onUpdate(selectedElement.outerHTML);
    }
  };

  const handleSearchClick = () => {
    setShowSuggestions(false);
    updateMap(location);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      updateMap(location);
    }
  };

  // Helper to bold the matched text like Google does
  const getHighlightedText = (text, highlight) => {
    if (!highlight.trim()) return <span className="text-gray-600 font-normal">{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span className="truncate block">
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? 
          <span key={i} className="text-black font-semibold">{part}</span> : 
          <span key={i} className="text-gray-600 font-normal">{part}</span>
        )}
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col gap-[0.8vw] font-sans text-gray-800 p-[0.5vw]">
      {/* Location Header */}
      <div className="flex items-center gap-[0.4vw] mb-[0.2vw]">
        <h3 className="text-[0.9vw] font-semibold text-gray-900 tracking-wider">Location</h3>
        <div className="w-[1vw] h-[1vw] rounded-full bg-gray-300 flex items-center justify-center cursor-help">
          <Info size="0.6vw" className="text-white" />
        </div>
      </div>

      {/* Search Bar with Suggestions */}
      <div className="relative" ref={wrapperRef}>
        <div className="border border-gray-300 rounded-[0.5vw] bg-white overflow-hidden h-[2.8vw] flex items-center px-[0.75vw] hover:border-indigo-500 focus-within:border-indigo-500 transition-colors">
          <input
            type="text"
            value={location}
            onChange={handleLocationChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Enter the location"
            className="flex-1 h-full text-[0.85vw] font-medium text-gray-800 bg-transparent outline-none min-w-0"
          />
          <button onClick={handleSearchClick} className="cursor-pointer focus:outline-none flex items-center justify-center p-[0.3vw]">
            <Search size="1.2vw" className="text-gray-700 hover:text-indigo-600 transition-colors" />
          </button>
        </div>

        {/* Suggestions Dropdown - Styled Exactly Like Google Places */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-0 bg-white border border-gray-300 rounded-b shadow-md max-h-[250px] overflow-y-auto">
            {suggestions.map((suggestion, index) => {
              const isCoord = suggestion.isCoordinate;
              let mainText = '';
              let secondaryText = '';

              if (isCoord) {
                mainText = "Drop pin at: " + suggestion.display_name;
              } else {
                const parts = suggestion.display_name.split(',');
                mainText = parts[0];
                secondaryText = parts.slice(1).join(',').trim();
              }

              return (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <svg viewBox="0 0 24 24" className="w-[1.1vw] h-[1.1vw] text-gray-400 flex-shrink-0 fill-current">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <div className="flex flex-row items-baseline truncate w-full overflow-hidden">
                    <div className="text-[0.85vw] whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0 max-w-[50%]">
                       {isCoord ? <span className="text-black font-semibold">{mainText}</span> : getHighlightedText(mainText, location)}
                    </div>
                    {secondaryText && (
                      <span className="text-[0.8vw] text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis ml-1">
                        {secondaryText}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="px-2 py-1.5 flex justify-end bg-white sticky bottom-0">
              <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png" alt="Powered by Google" className="h-[12px] opacity-80" />
            </div>
          </div>
        )}
      </div>

      {/* Map Preview */}
      <div className="mt-[0.2vw] border border-gray-200 rounded-[0.5vw] p-[0.4vw] bg-white relative">
        <div className="w-full h-[14vw] bg-gray-100 rounded-[0.3vw] overflow-hidden relative">
          {iframeUrl ? (
            <iframe 
              ref={iframeRef}
              src={iframeUrl}
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Map Preview"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[0.8vw]">
              Search a location to view map
            </div>
          )}
          {/* Full screen button overlay */}
          {iframeUrl && (
            <div 
              className="absolute top-[0.5vw] right-[0.5vw] w-[2.2vw] h-[2.2vw] bg-white shadow-sm rounded-[0.2vw] flex items-center justify-center cursor-pointer hover:bg-gray-50 border border-gray-100"
              onClick={() => setIsFullscreen(true)}
              title="View fullscreen"
            >
              <Maximize size="1.1vw" className="text-gray-600" />
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Portal */}
      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black">
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white backdrop-blur-sm text-gray-800 rounded-lg shadow-lg font-medium transition-all"
            >
              <X size={20} />
              Close Fullscreen
            </button>
          </div>
          <iframe 
            src={iframeUrl}
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Map Fullscreen"
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default MapEditor;
