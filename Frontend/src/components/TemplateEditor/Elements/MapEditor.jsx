import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Info, Maximize, X, Loader2, AlertCircle, MapPin, Building, Star, Phone, Tag, ChevronDown, ChevronUp, Layers, Check } from 'lucide-react';
import { DEFAULT_MAP_DATA, MAP_TEMPLATES, generateOverlayHtml, escapeXml } from './MapStyle';

const MapEditor = ({ selectedElement, onUpdate }) => {
  // Map source settings
  const [sourceType, setSourceType] = useState('Location'); // 'Location' | 'URL' | 'Embed Code'
  const [location, setLocation] = useState('Coimbatore, Tamil Nadu');
  const [urlInput, setUrlInput] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [iframeUrl, setIframeUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Map design & business details state
  const [layoutStyle, setLayoutStyle] = useState('actions'); // 'actions' | 'callout' | 'gallery' | 'carousel'
  const [businessName, setBusinessName] = useState(DEFAULT_MAP_DATA.name);
  const [businessAddress, setBusinessAddress] = useState(DEFAULT_MAP_DATA.address);
  const [businessRating, setBusinessRating] = useState(DEFAULT_MAP_DATA.rating);
  const [businessReviews, setBusinessReviews] = useState(DEFAULT_MAP_DATA.reviews);
  const [businessCategory, setBusinessCategory] = useState(DEFAULT_MAP_DATA.category);
  const [businessPhone, setBusinessPhone] = useState(DEFAULT_MAP_DATA.phone);
  const [businessImage, setBusinessImage] = useState(DEFAULT_MAP_DATA.image);

  // Place details editing state (collapsed/hidden by default to keep automatic workflow)
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);
  const iframeRef = useRef(null);

  // Helper: parse user-provided Map URL into an embeddable format
  const parseMapUrl = (raw) => {
    if (!raw || !raw.trim()) return '';
    const trimmed = raw.trim();

    // If an iframe tag was pasted into URL input by accident
    const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (iframeMatch && iframeMatch[1]) return iframeMatch[1];

    // Already a Google Maps embed URL
    if (trimmed.includes('output=embed') || trimmed.includes('/maps/embed')) {
      return trimmed;
    }

    // Google Maps place URL: /maps/place/PlaceName/...
    const placeMatch = trimmed.match(/\/maps\/place\/([^/@?]+)/i);
    if (placeMatch && placeMatch[1]) {
      const place = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&t=&z=13&ie=UTF8&iwloc=near&output=embed`;
    }

    // Google Maps search URL: /maps/search/Query/...
    const searchMatch = trimmed.match(/\/maps\/search\/([^/@?]+)/i);
    if (searchMatch && searchMatch[1]) {
      const query = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=13&ie=UTF8&iwloc=near&output=embed`;
    }

    // Google Maps query param: ?q=...
    try {
      const urlObj = new URL(trimmed);
      const q = urlObj.searchParams.get('q');
      if (q) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=13&ie=UTF8&iwloc=near&output=embed`;
      }
    } catch (e) {}

    // Generic http/https URL: append output=embed if google maps
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (trimmed.includes('maps.google.com')) {
        const sep = trimmed.includes('?') ? '&' : '?';
        return `${trimmed}${sep}output=embed`;
      }
      return trimmed;
    }

    // Fallback: search query
    return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&t=&z=13&ie=UTF8&iwloc=near&output=embed`;
  };

  // Helper: extract iframe src from embed code
  const parseEmbedCode = (code) => {
    if (!code || !code.trim()) return '';
    const trimmed = code.trim();
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1];
    }
    return parseMapUrl(trimmed);
  };

  // Universal updater that keeps canvas DOM & attributes in sync safely
  const updateMapData = (updatedFields = {}) => {
    const nextStyle = updatedFields.style !== undefined ? updatedFields.style : layoutStyle;
    const nextUrl = updatedFields.url !== undefined ? updatedFields.url : iframeUrl;
    const nextSourceType = updatedFields.sourceType !== undefined ? updatedFields.sourceType : sourceType;
    const nextLocation = updatedFields.location !== undefined ? updatedFields.location : location;
    const nextName = updatedFields.name !== undefined ? updatedFields.name : businessName;
    const nextAddress = updatedFields.address !== undefined ? updatedFields.address : businessAddress;
    const nextRating = updatedFields.rating !== undefined ? updatedFields.rating : businessRating;
    const nextReviews = updatedFields.reviews !== undefined ? updatedFields.reviews : businessReviews;
    const nextCategory = updatedFields.category !== undefined ? updatedFields.category : businessCategory;
    const nextPhone = updatedFields.phone !== undefined ? updatedFields.phone : businessPhone;
    const nextImage = updatedFields.image !== undefined ? updatedFields.image : businessImage;

    if (nextUrl) setIframeUrl(nextUrl);

    if (selectedElement && onUpdate) {
      selectedElement.setAttribute('data-map-style', nextStyle);
      selectedElement.setAttribute('data-url', nextUrl);
      selectedElement.setAttribute('data-source-type', nextSourceType);
      selectedElement.setAttribute('data-location', nextLocation);
      selectedElement.setAttribute('data-business-name', nextName);
      selectedElement.setAttribute('data-business-address', nextAddress);
      selectedElement.setAttribute('data-business-rating', nextRating);
      selectedElement.setAttribute('data-business-reviews', nextReviews);
      selectedElement.setAttribute('data-business-category', nextCategory);
      selectedElement.setAttribute('data-business-phone', nextPhone);
      selectedElement.setAttribute('data-business-image', nextImage);

      if (updatedFields.rawUrl !== undefined) selectedElement.setAttribute('data-raw-url', updatedFields.rawUrl);
      if (updatedFields.embedCode !== undefined) selectedElement.setAttribute('data-embed-code', updatedFields.embedCode);

      const fo = selectedElement.querySelector('foreignObject');
      const foW = parseFloat(fo?.getAttribute('width') || '240') || 240;
      const foH = parseFloat(fo?.getAttribute('height') || '230') || 230;

      // Rebuild inner foreignObject container with fresh overlay
      const overlayHtml = generateOverlayHtml(nextStyle, {
        name: nextName,
        address: nextAddress,
        rating: nextRating,
        reviews: nextReviews,
        category: nextCategory,
        phone: nextPhone,
        image: nextImage,
        location: nextLocation
      });

      if (fo) {
        const baseW = 320;
        const scale = foW < baseW ? (foW / baseW) : 1;
        const innerW = foW < baseW ? baseW : foW;
        const innerH = Math.round(foH / scale);

        fo.setAttribute('style', 'overflow: hidden; border-radius: 0px;');
        fo.innerHTML = `
          <div xmlns="http://www.w3.org/1999/xhtml" class="map-root-container" style="position: relative; width: 100%; height: 100%; overflow: hidden; margin: 0; padding: 0; border-radius: 0px; box-shadow: 0 4px 20px rgba(0,0,0,0.12);">
            <div class="map-stage" style="position: absolute; top: 0; left: 0; width: ${innerW}px; height: ${innerH}px; transform: scale(${scale}); transform-origin: 0 0; overflow: hidden;">
              <iframe src="${nextUrl.replace(/&/g, '&amp;')}" width="${innerW}" height="${innerH}" style="position: absolute; top: 0; left: 0; width: ${innerW}px; height: ${innerH}px; border: 0; pointer-events: none; margin: 0; padding: 0; display: block;" allowfullscreen="" loading="lazy"></iframe>
              <div class="map-overlay-wrapper" style="position: absolute; inset: 0; pointer-events: none;">
                ${overlayHtml}
              </div>
            </div>
          </div>
        `;
      }

      onUpdate(selectedElement.outerHTML);
    }
  };

  // Helper to apply fetched Google Maps details to state, live preview and canvas
  const applyFetchedDetails = (data, rawUrlVal = '', type = 'URL') => {
    const details = data.details || {};
    const newName = details.name || data.place || location || 'Location';
    const newAddress = details.address || (data.coords ? `Coordinates: ${data.coords}` : newName);
    const newRating = details.rating || '4.8';
    const newReviews = details.reviews || '500+';
    const newCategory = details.category || 'Location';
    const newPhone = details.phone || '';
    const newImage = details.image || businessImage;

    setBusinessName(newName);
    setBusinessAddress(newAddress);
    setBusinessRating(newRating);
    setBusinessReviews(newReviews);
    setBusinessCategory(newCategory);
    setBusinessPhone(newPhone);
    if (newImage) setBusinessImage(newImage);
    setLocation(newName);

    const updatePayload = {
      url: data.embedUrl || iframeUrl,
      sourceType: type,
      location: newName,
      name: newName,
      address: newAddress,
      rating: newRating,
      reviews: newReviews,
      category: newCategory,
      phone: newPhone,
      image: newImage
    };

    if (type === 'URL' && rawUrlVal) updatePayload.rawUrl = rawUrlVal;
    if (type === 'Embed Code' && rawUrlVal) updatePayload.embedCode = rawUrlVal;

    updateMapData(updatePayload);
  };

  // Helper to fetch place details from Google Maps via backend
  const fetchPlaceDetails = async (queryOrUrl, targetSourceType = 'URL') => {
    if (!queryOrUrl || !queryOrUrl.trim()) return null;
    setIsLoadingUrl(true);
    setErrorMessage('');
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/flipbook/resolve-map-url?url=${encodeURIComponent(queryOrUrl.trim())}`);
      const data = await res.json();
      if (data && data.success) {
        applyFetchedDetails(data, queryOrUrl.trim(), targetSourceType);
        return data;
      }
    } catch (e) {
      console.error("Error fetching map place details:", e);
    } finally {
      setIsLoadingUrl(false);
    }
    return null;
  };

  // Initial load & sync with selected element
  useEffect(() => {
    const defaultUrl = `https://maps.google.com/maps?q=${encodeURIComponent('Coimbatore, Tamil Nadu')}&t=&z=13&ie=UTF8&iwloc=near&output=embed`;
    
    if (selectedElement) {
      const url = selectedElement.getAttribute('data-url') || defaultUrl;
      const savedType = selectedElement.getAttribute('data-source-type');
      const savedLocation = selectedElement.getAttribute('data-location');
      const savedRawUrl = selectedElement.getAttribute('data-raw-url');
      const savedEmbed = selectedElement.getAttribute('data-embed-code');

      const savedStyle = selectedElement.getAttribute('data-map-style');
      const savedName = selectedElement.getAttribute('data-business-name');
      const savedAddress = selectedElement.getAttribute('data-business-address');
      const savedRating = selectedElement.getAttribute('data-business-rating');
      const savedReviews = selectedElement.getAttribute('data-business-reviews');
      const savedCategory = selectedElement.getAttribute('data-business-category');
      const savedPhone = selectedElement.getAttribute('data-business-phone');
      const savedImage = selectedElement.getAttribute('data-business-image');

      setIframeUrl(url);

      if (savedStyle) setLayoutStyle(savedStyle);
      if (savedName) setBusinessName(savedName);
      if (savedAddress) setBusinessAddress(savedAddress);
      if (savedRating) setBusinessRating(savedRating);
      if (savedReviews) setBusinessReviews(savedReviews);
      if (savedCategory) setBusinessCategory(savedCategory);
      if (savedPhone) setBusinessPhone(savedPhone);
      if (savedImage) setBusinessImage(savedImage);

      if (savedType) {
        setSourceType(savedType);
      }
      if (savedLocation) {
        setLocation(savedLocation);
      } else if (url.includes('maps.google.com') && url.includes('q=')) {
        try {
          const parsed = new URL(url);
          const q = parsed.searchParams.get('q');
          if (q) setLocation(decodeURIComponent(q));
        } catch (e) {}
      }

      if (savedRawUrl) {
        setUrlInput(savedRawUrl);
        // Automatically fetch real Google Maps details if currently showing default placeholder
        if (!savedName || savedName === 'Fisto Tech Private Limited' || savedName === 'Google Maps Location') {
          fetchPlaceDetails(savedRawUrl, 'URL');
        }
      } else if (url && !url.includes('Coimbatore')) {
        setUrlInput(url);
      }

      if (savedEmbed) {
        setEmbedCode(savedEmbed);
      }

      const fo = selectedElement.querySelector('foreignObject');
      const foW = parseFloat(fo?.getAttribute('width') || '240') || 240;
      const foH = parseFloat(fo?.getAttribute('height') || '150') || 150;
      const iframe = selectedElement.querySelector('iframe');
      const stage = fo?.querySelector('.map-stage');

      const baseW = 320;
      const scale = foW < baseW ? (foW / baseW) : 1;
      const innerW = foW < baseW ? baseW : foW;
      const innerH = Math.round(foH / scale);

      if (fo) {
        fo.style.setProperty('overflow', 'hidden', 'important');
        fo.style.setProperty('border-radius', '0px', 'important');
        const rootDiv = fo.querySelector('.map-root-container') || fo.querySelector('div');
        if (rootDiv) {
          rootDiv.style.setProperty('width', '100%', 'important');
          rootDiv.style.setProperty('height', '100%', 'important');
          rootDiv.style.setProperty('overflow', 'hidden', 'important');
          rootDiv.style.setProperty('white-space', 'normal', 'important');
          rootDiv.style.setProperty('line-height', 'normal', 'important');
          rootDiv.style.setProperty('border-radius', '0px', 'important');
        }

        const rect = selectedElement.querySelector('rect');
        if (rect) {
          rect.setAttribute('rx', '0');
          rect.setAttribute('ry', '0');
        }

        if (stage) {
          stage.style.setProperty('width', innerW + 'px', 'important');
          stage.style.setProperty('height', innerH + 'px', 'important');
          stage.style.setProperty('transform', `scale(${scale})`, 'important');
          stage.style.setProperty('transform-origin', '0 0', 'important');
          if (iframe) {
            iframe.style.removeProperty('transform');
            iframe.style.setProperty('width', innerW + 'px', 'important');
            iframe.style.setProperty('height', innerH + 'px', 'important');
            iframe.setAttribute('width', innerW.toString());
            iframe.setAttribute('height', innerH.toString());
            iframe.style.setProperty('border', 'none', 'important');
            iframe.style.setProperty('display', 'block', 'important');
            iframe.style.setProperty('pointer-events', 'none', 'important');
          }
        } else {
          // Auto-heal map overlays on canvas to mirror Live Preview with map-stage
          const effectiveStyle = savedStyle || layoutStyle || 'actions';
          const overlayHtml = generateOverlayHtml(effectiveStyle, {
            name: savedName || businessName || DEFAULT_MAP_DATA.name,
            address: savedAddress || businessAddress || DEFAULT_MAP_DATA.address,
            rating: savedRating || businessRating || DEFAULT_MAP_DATA.rating,
            reviews: savedReviews || businessReviews || DEFAULT_MAP_DATA.reviews,
            category: savedCategory || businessCategory || DEFAULT_MAP_DATA.category,
            phone: savedPhone || businessPhone || DEFAULT_MAP_DATA.phone,
            image: savedImage || businessImage || DEFAULT_MAP_DATA.image,
            location: savedLocation || location
          });

          fo.setAttribute('style', 'overflow: hidden; border-radius: 0px;');
          const cleanUrl = (url || defaultUrl).replace(/&amp;/g, '&').replace(/&/g, '&amp;');
          fo.innerHTML = `
            <div xmlns="http://www.w3.org/1999/xhtml" class="map-root-container" style="position: relative; width: 100%; height: 100%; overflow: hidden; margin: 0; padding: 0; border-radius: 0px; box-shadow: 0 4px 20px rgba(0,0,0,0.12);">
              <div class="map-stage" style="position: absolute; top: 0; left: 0; width: ${innerW}px; height: ${innerH}px; transform: scale(${scale}); transform-origin: 0 0; overflow: hidden;">
                <iframe src="${cleanUrl}" width="${innerW}" height="${innerH}" style="position: absolute; top: 0; left: 0; width: ${innerW}px; height: ${innerH}px; border: 0; pointer-events: none; margin: 0; padding: 0; display: block;" allowfullscreen="" loading="lazy"></iframe>
                <div class="map-overlay-wrapper" style="position: absolute; inset: 0; pointer-events: none;">
                  ${overlayHtml}
                </div>
              </div>
            </div>
          `;
          if (onUpdate) {
            onUpdate(selectedElement.outerHTML);
          }
        }
      }
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
    setErrorMessage('');

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
    const parts = placeName.split(',');
    const mainTitle = suggestion.isCoordinate ? suggestion.display_name : parts[0].trim();
    const secondaryAddress = parts.slice(1, 4).join(',').trim() || mainTitle;
    const categoryName = suggestion.type ? (suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1).replace(/_/g, ' ')) : 'Location';

    setLocation(mainTitle);
    setBusinessName(mainTitle);
    setBusinessAddress(secondaryAddress);
    setBusinessCategory(categoryName);
    setShowSuggestions(false);
    setErrorMessage('');
    
    const newUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mainTitle)}&t=&z=13&ie=UTF8&iwloc=near&output=embed`;
    updateMapData({
      url: newUrl,
      sourceType: 'Location',
      location: mainTitle,
      name: mainTitle,
      address: secondaryAddress,
      category: categoryName
    });

    // Automatically enrich with Google Maps details (ratings, photos, reviews, phone)
    fetchPlaceDetails(mainTitle, 'Location');
  };

  const handleSelectStyle = (styleId) => {
    setLayoutStyle(styleId);
    updateMapData({ style: styleId });
  };

  const handleSearchClick = () => {
    setShowSuggestions(false);
    setErrorMessage('');
    if (!location.trim()) return;
    const query = location.trim();
    const newUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=13&ie=UTF8&iwloc=near&output=embed`;
    setBusinessName(query);
    updateMapData({ url: newUrl, sourceType: 'Location', location: query, name: query });

    // Automatically fetch place details from Google Maps
    fetchPlaceDetails(query, 'Location');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const handleApplyUrl = async () => {
    if (!urlInput.trim()) return;
    setErrorMessage('');
    const trimmed = urlInput.trim();
    setIsLoadingUrl(true);

    try {
      const data = await fetchPlaceDetails(trimmed, 'URL');
      if (data && data.success) {
        setIsLoadingUrl(false);
        return;
      }
    } catch (e) {
      console.error("Error resolving map URL:", e);
    } finally {
      setIsLoadingUrl(false);
    }

    const processed = parseMapUrl(trimmed);
    if (processed) {
      updateMapData({ url: processed, sourceType: 'URL', rawUrl: trimmed });
    } else {
      setErrorMessage("Could not parse map URL. Please paste a valid Google Maps link.");
    }
  };

  const handleApplyEmbedCode = async () => {
    if (!embedCode.trim()) return;
    setErrorMessage('');
    const trimmed = embedCode.trim();

    const extracted = parseEmbedCode(trimmed);
    if (!extracted) {
      setErrorMessage("Could not extract map URL. Please paste a valid <iframe> embed code.");
      return;
    }

    setIsLoadingUrl(true);
    try {
      const data = await fetchPlaceDetails(extracted, 'Embed Code');
      if (data && data.success) {
        setIsLoadingUrl(false);
        return;
      }
    } catch (e) {
      console.error("Error resolving embed map URL:", e);
    } finally {
      setIsLoadingUrl(false);
    }

    updateMapData({ url: extracted, sourceType: 'Embed Code', embedCode: trimmed });
  };

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
    <div className="w-full flex flex-col gap-[1vw] font-sans text-gray-800 p-[0.75vw]">
      {/* 1. LOCATION SEARCH & SOURCE TYPE */}
      <div className="flex flex-col gap-[0.5vw]">
        <div className="flex items-center gap-[0.4vw]">
          <MapPin size="0.85vw" className="text-[#00828a]" />
          <h3 className="text-[0.85vw] font-semibold text-gray-900">Map Location</h3>
        </div>

        {/* Radio Buttons for Source Type */}
        <div className="flex items-center gap-[0.8vw] py-[0.1vw]">
          {['Location', 'URL', 'Embed Code'].map((type) => (
            <label key={type} className="flex items-center gap-[0.3vw] cursor-pointer group">
              <input
                type="radio"
                name="map-source-type"
                checked={sourceType === type}
                onChange={() => {
                  setSourceType(type);
                  setErrorMessage('');
                }}
                className="w-[0.8vw] h-[0.8vw] text-[#00828a] border-gray-300 focus:ring-[#00828a] cursor-pointer accent-[#00828a]"
              />
              <span className={`text-[0.72vw] font-medium transition-colors ${sourceType === type ? 'text-gray-900 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {type}
              </span>
            </label>
          ))}
        </div>

        {/* Location Search Input */}
        {sourceType === 'Location' && (
          <div className="relative" ref={wrapperRef}>
            <div className="border border-gray-300 rounded-lg bg-white overflow-hidden h-[2.5vw] flex items-center px-[0.6vw] hover:border-[#00828a] focus-within:border-[#00828a] transition-colors">
              <input
                type="text"
                value={location}
                onChange={handleLocationChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Enter city, place, or address..."
                className="flex-1 h-full text-[0.78vw] font-medium text-gray-800 bg-transparent outline-none min-w-0"
              />
              <button onClick={handleSearchClick} className="cursor-pointer focus:outline-none flex items-center justify-center p-[0.3vw]">
                <Search size="1.1vw" className="text-gray-500 hover:text-[#00828a] transition-colors" />
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[220px] overflow-y-auto">
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
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      <MapPin size="1vw" className="text-gray-400 flex-shrink-0" />
                      <div className="flex flex-row items-baseline truncate w-full overflow-hidden">
                        <div className="text-[0.78vw] whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0 max-w-[55%]">
                          {isCoord ? <span className="text-black font-semibold">{mainText}</span> : getHighlightedText(mainText, location)}
                        </div>
                        {secondaryText && (
                          <span className="text-[0.72vw] text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis ml-1">
                            {secondaryText}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* URL Input */}
        {sourceType === 'URL' && (
          <div className="flex flex-col gap-[0.3vw]">
            <div className="border border-gray-300 rounded-lg bg-white overflow-hidden h-[2.5vw] flex items-center px-[0.6vw] hover:border-[#00828a] focus-within:border-[#00828a] transition-colors">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setErrorMessage('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyUrl();
                }}
                placeholder="Paste Google Maps URL..."
                className="flex-1 h-full text-[0.75vw] font-medium text-gray-800 bg-transparent outline-none min-w-0"
                disabled={isLoadingUrl}
              />
              <button
                onClick={handleApplyUrl}
                disabled={isLoadingUrl}
                className="px-[0.6vw] py-[0.3vw] bg-[#00828a] hover:bg-[#006e75] disabled:bg-gray-400 text-white text-[0.7vw] font-medium rounded transition-colors ml-[0.3vw] whitespace-nowrap cursor-pointer flex items-center gap-[0.2vw]"
              >
                {isLoadingUrl ? <Loader2 size="0.75vw" className="animate-spin" /> : 'Apply'}
              </button>
            </div>
            {errorMessage && (
              <div className="p-[0.4vw] bg-amber-50 border border-amber-200 rounded text-[0.65vw] text-amber-900 flex items-start gap-[0.25vw]">
                <AlertCircle size="0.8vw" className="text-amber-600 flex-shrink-0 mt-[0.05vw]" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Embed Code Textarea */}
        {sourceType === 'Embed Code' && (
          <div className="flex flex-col gap-[0.3vw]">
            <textarea
              value={embedCode}
              onChange={(e) => {
                setEmbedCode(e.target.value);
                setErrorMessage('');
              }}
              placeholder="Paste <iframe> map embed code..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg bg-white p-[0.5vw] text-[0.72vw] text-gray-800 outline-none hover:border-[#00828a] focus:border-[#00828a] transition-colors resize-none font-mono"
              disabled={isLoadingUrl}
            />
            {errorMessage && (
              <div className="p-[0.4vw] bg-amber-50 border border-amber-200 rounded text-[0.65vw] text-amber-900 flex items-start gap-[0.25vw]">
                <AlertCircle size="0.8vw" className="text-amber-600 flex-shrink-0 mt-[0.05vw]" />
                <span>{errorMessage}</span>
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleApplyEmbedCode}
                disabled={isLoadingUrl}
                className="px-[0.6vw] py-[0.3vw] bg-[#00828a] hover:bg-[#006e75] disabled:bg-gray-400 text-white text-[0.7vw] font-medium rounded transition-colors cursor-pointer flex items-center gap-[0.2vw]"
              >
                {isLoadingUrl ? <Loader2 size="0.75vw" className="animate-spin" /> : 'Apply Code'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. LIVE MAP & OVERLAY PREVIEW */}
      <div className="flex flex-col gap-[0.35vw]">
        <div className="flex items-center justify-between">
          <span className="text-[0.75vw] font-semibold text-gray-800">Live Preview</span>
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-[0.2vw] text-[0.65vw] text-[#00828a] hover:underline cursor-pointer"
          >
            <Maximize size="0.65vw" />
            <span>Fullscreen</span>
          </button>
        </div>

        <div className="border border-gray-200 overflow-hidden bg-white shadow-sm relative aspect-[4/3.8] max-h-[220px]">
          {iframeUrl ? (
            <div className="relative w-full h-full overflow-hidden">
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
              {/* Overlay preview over the map */}
              <div 
                className="absolute inset-0 pointer-events-none"
                dangerouslySetInnerHTML={{
                  __html: generateOverlayHtml(layoutStyle, {
                    name: businessName,
                    address: businessAddress,
                    rating: businessRating,
                    reviews: businessReviews,
                    category: businessCategory,
                    phone: businessPhone,
                    image: businessImage,
                    location: location
                  })
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[0.75vw]">
              Enter location to view map
            </div>
          )}
        </div>
      </div>

      {/* 3. LAYOUT TEMPLATES SELECTOR */}
      <div className="flex flex-col gap-[0.5vw]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.4vw]">
            <Layers size="0.9vw" className="text-[#00828a]" />
            <h3 className="text-[0.85vw] font-semibold text-gray-900">Map Card Layout</h3>
          </div>
          <span className="text-[0.65vw] text-gray-500 font-medium">{MAP_TEMPLATES.length} Styles Available</span>
        </div>

        <div className="grid grid-cols-2 gap-[0.4vw]">
          {MAP_TEMPLATES.map((tmpl) => {
            const isSelected = layoutStyle === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => handleSelectStyle(tmpl.id)}
                className={`relative flex items-center gap-[0.4vw] p-[0.45vw] rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-[#00828a] bg-[#00828a]/10 shadow-sm ring-1 ring-[#00828a]'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-[1.2vw] h-[1.2vw] rounded-md flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-[#00828a] text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isSelected ? <Check size="0.7vw" /> : <MapPin size="0.7vw" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[0.72vw] font-semibold truncate ${isSelected ? 'text-[#00828a]' : 'text-gray-800'}`}>
                    {tmpl.name}
                  </div>
                  <div className="text-[0.6vw] text-gray-500 truncate leading-tight">
                    {tmpl.badge}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. FETCHED PLACE DETAILS */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
        <div className="p-[0.6vw] bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-[0.4vw]">
            <MapPin size="0.85vw" className="text-[#00828a]" />
            <span className="text-[0.8vw] font-semibold text-gray-900">Place Details</span>
            <span className="text-[0.58vw] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-[0.35vw] py-[0.08vw] rounded-full">
              Google Maps
            </span>
          </div>
          <button
            onClick={() => setIsEditingDetails(!isEditingDetails)}
            className="text-[0.65vw] text-[#00828a] hover:underline font-medium cursor-pointer"
          >
            {isEditingDetails ? 'Done' : 'Edit details'}
          </button>
        </div>

        {/* Read-only preview summary of fetched details */}
        {!isEditingDetails ? (
          <div className="p-[0.6vw] flex flex-col gap-[0.4vw]">
            <div className="flex items-start gap-[0.5vw]">
              {businessImage ? (
                <img src={businessImage} alt={businessName} className="w-[2.4vw] h-[2.4vw] rounded-md object-cover flex-shrink-0 border border-gray-200 shadow-xs" />
              ) : (
                <div className="w-[2.4vw] h-[2.4vw] rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00828a] flex-shrink-0">
                  <MapPin size="1.2vw" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 truncate text-[0.78vw]">{businessName || 'Google Maps Place'}</div>
                <div className="text-gray-500 truncate text-[0.68vw] mt-[0.05vw]">{businessAddress || 'Location Details'}</div>
                <div className="flex items-center gap-[0.35vw] mt-[0.2vw] text-[0.65vw] flex-wrap">
                  <span className="text-amber-600 font-bold flex items-center gap-[0.1vw]">★ {businessRating || '4.8'}</span>
                  <span className="text-gray-400">({businessReviews || '500+'} reviews)</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-600 font-medium truncate">{businessCategory || 'Location'}</span>
                </div>
              </div>
            </div>

            {businessPhone && (
              <div className="text-[0.68vw] text-gray-600 flex items-center gap-[0.3vw] pt-[0.3vw] border-t border-gray-100">
                <Phone size="0.65vw" className="text-gray-400" />
                <span>{businessPhone}</span>
              </div>
            )}

            {layoutStyle === 'none' ? (
              <div className="text-[0.62vw] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-[0.3vw] mt-[0.1vw]">
                ✓ <strong>Map Only</strong> selected: Card overlay is hidden on preview and canvas.
              </div>
            ) : (
              <div className="text-[0.6vw] text-gray-400 italic pt-[0.1vw]">
                Details automatically appear on your selected layout card on preview and canvas.
              </div>
            )}
          </div>
        ) : (
          <div className="p-[0.6vw] flex flex-col gap-[0.5vw] border-t border-gray-200">
            {/* Business / Place Name */}
            <div className="flex flex-col gap-[0.15vw]">
              <label className="text-[0.65vw] font-semibold text-gray-700">Place / Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  updateMapData({ name: e.target.value });
                }}
                placeholder="Place Name"
                className="w-full border border-gray-300 rounded px-[0.5vw] py-[0.3vw] text-[0.75vw] text-gray-800 outline-none focus:border-[#00828a]"
              />
            </div>

            {/* Address / Subtitle */}
            <div className="flex flex-col gap-[0.15vw]">
              <label className="text-[0.65vw] font-semibold text-gray-700">Address / City</label>
              <input
                type="text"
                value={businessAddress}
                onChange={(e) => {
                  setBusinessAddress(e.target.value);
                  updateMapData({ address: e.target.value });
                }}
                placeholder="Address"
                className="w-full border border-gray-300 rounded px-[0.5vw] py-[0.3vw] text-[0.75vw] text-gray-800 outline-none focus:border-[#00828a]"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-[0.15vw]">
              <label className="text-[0.65vw] font-semibold text-gray-700">Category</label>
              <input
                type="text"
                value={businessCategory}
                onChange={(e) => {
                  setBusinessCategory(e.target.value);
                  updateMapData({ category: e.target.value });
                }}
                placeholder="e.g. College, Restaurant, Studio"
                className="w-full border border-gray-300 rounded px-[0.5vw] py-[0.3vw] text-[0.75vw] text-gray-800 outline-none focus:border-[#00828a]"
              />
            </div>

            {/* Rating & Reviews row */}
            <div className="grid grid-cols-2 gap-[0.4vw]">
              <div className="flex flex-col gap-[0.15vw]">
                <label className="text-[0.65vw] font-semibold text-gray-700 flex items-center gap-[0.2vw]">
                  <Star size="0.65vw" className="text-amber-500 fill-amber-500" />
                  <span>Rating</span>
                </label>
                <input
                  type="text"
                  value={businessRating}
                  onChange={(e) => {
                    setBusinessRating(e.target.value);
                    updateMapData({ rating: e.target.value });
                  }}
                  placeholder="4.8"
                  className="w-full border border-gray-300 rounded px-[0.5vw] py-[0.3vw] text-[0.75vw] text-gray-800 outline-none focus:border-[#00828a]"
                />
              </div>

              <div className="flex flex-col gap-[0.15vw]">
                <label className="text-[0.65vw] font-semibold text-gray-700">Reviews Count</label>
                <input
                  type="text"
                  value={businessReviews}
                  onChange={(e) => {
                    setBusinessReviews(e.target.value);
                    updateMapData({ reviews: e.target.value });
                  }}
                  placeholder="500+"
                  className="w-full border border-gray-300 rounded px-[0.5vw] py-[0.3vw] text-[0.75vw] text-gray-800 outline-none focus:border-[#00828a]"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-[0.15vw]">
              <label className="text-[0.65vw] font-semibold text-gray-700 flex items-center gap-[0.2vw]">
                <Phone size="0.65vw" className="text-gray-500" />
                <span>Phone (for Call button)</span>
              </label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => {
                  setBusinessPhone(e.target.value);
                  updateMapData({ phone: e.target.value });
                }}
                placeholder="+91 ..."
                className="w-full border border-gray-300 rounded px-[0.5vw] py-[0.3vw] text-[0.75vw] text-gray-800 outline-none focus:border-[#00828a]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Portal */}
      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black">
          <div className="absolute top-4 right-4 z-20">
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
