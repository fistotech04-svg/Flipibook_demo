import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, ArrowLeftRight, AlertCircle, Loader2, X, Copy, Check } from 'lucide-react';
import { Icon } from '@iconify/react';
import ColorPicker from '../ColorPicker';
import { DEFAULT_MAP_DATA, MAP_TEMPLATES, MapTemplateThumbnail, generateOverlayHtml, escapeXml } from './MapStyle';

// Section header matching editor design standards
const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.4vw] mt-[0.2vw]">
    <span className="text-[0.88vw] font-medium text-black whitespace-nowrap">{title}</span>
    <div className="h-[0.06vw] bg-gray-200 flex-1 ml-[0.3vw]" />
  </div>
);

// RadioButton component with signature accent
const RadioButton = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-[0.35vw] cursor-pointer select-none">
    <div
      onClick={onChange}
      className={`w-[1.05vw] h-[1.05vw] rounded-full border-2 flex items-center justify-center transition-all ${
        checked ? 'border-[#E05638]' : 'border-gray-700 hover:border-black'
      }`}
    >
      {checked && <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#E05638]" />}
    </div>
    <span className="text-[0.78vw] text-gray-600 font-medium">{label}</span>
  </label>
);

// Toggle Switch matching QRCodeProperties.jsx exact structure & style
const Toggle = ({ checked, onChange, title = '' }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    title={title}
    className={`w-[1.9vw] h-[1.1vw] flex items-center rounded-full p-[0.1vw] cursor-pointer transition-colors ${
      checked ? 'bg-[#E05638]' : 'bg-gray-300'
    }`}
  >
    <div
      className={`bg-white w-[0.9vw] h-[0.9vw] rounded-full shadow-md transform transition-transform ${
        checked ? 'translate-x-[0.8vw]' : 'translate-x-0'
      }`}
    />
  </button>
);

// Custom Select Dropdown matching property panels
const CustomSelect = ({ value, onChange, options, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => 
    String(opt.value).toLowerCase() === String(value).toLowerCase() ||
    (opt.value === 'Light Theme' && String(value).toLowerCase() === 'light') ||
    (opt.value === 'Dark Theme' && String(value).toLowerCase() === 'dark')
  ) || options[0];

  return (
    <div className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[2.5vw] flex items-center justify-between bg-white border ${
          isOpen ? 'border-2 border-[#EC5137] shadow-xs' : 'border border-gray-200 hover:border-gray-300'
        } rounded-[0.5vw] px-[0.6vw] text-[0.75vw] text-gray-700 font-medium transition-colors cursor-pointer shadow-2xs`}
      >
        <span className="font-medium truncate">{selectedOption?.label || value}</span>
        <ChevronDown
          className={`w-[0.9vw] h-[0.9vw] text-gray-500 transition-transform duration-200 flex-shrink-0 ml-[0.3vw] ${
            isOpen ? 'rotate-180 text-[#EC5137]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-[0.35vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-2xl overflow-hidden z-[100] flex flex-col py-[0.3vw] max-h-[14vw] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {options.map((opt) => {
              const isSelected = String(opt.value).toLowerCase() === String(value).toLowerCase() ||
                                 (opt.value === 'Light Theme' && String(value).toLowerCase() === 'light') ||
                                 (opt.value === 'Dark Theme' && String(value).toLowerCase() === 'dark');
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-[0.9vw] py-[0.45vw] text-[0.78vw] font-medium transition-colors text-left flex items-center justify-between cursor-pointer group ${
                    isSelected
                      ? 'text-[#EC5137] bg-[#EC5137]/10 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-[#EC5137]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const THEME_OPTIONS = [
  { value: 'Light Theme', label: 'Light Theme' },
  { value: 'Dark Theme', label: 'Dark Theme' }
];

const MapEditor = ({ selectedElement, onUpdate }) => {
  // --- 1. Map Source Settings ---
  const [sourceType, setSourceType] = useState('Location'); // 'Location' | 'URL' | 'Embed Code'
  const [location, setLocation] = useState('Coimbatore, Tamil Nadu');
  const [locationInput, setLocationInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [iframeUrl, setIframeUrl] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // --- 2. Map Layout Template & Style Picker Modal ---
  const [layoutStyle, setLayoutStyle] = useState('carousel'); // default to 'carousel' matching mockup
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [tempStyle, setTempStyle] = useState('carousel');

  // --- 3. Button Color State & Open in Map Toggle ---
  const [buttonColor, setButtonColor] = useState('#000000');
  const [buttonOpacity, setButtonOpacity] = useState(100);
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [showOpenMapBtn, setShowOpenMapBtn] = useState(true);

  // --- 4. Theme State (Light and Dark) ---
  const [theme, setTheme] = useState('Light Theme'); // 'Light Theme' | 'Dark Theme'

  // --- 5. Place Details State ---
  const [businessName, setBusinessName] = useState(DEFAULT_MAP_DATA.name);
  const [businessAddress, setBusinessAddress] = useState(DEFAULT_MAP_DATA.address);
  const [businessRating, setBusinessRating] = useState(DEFAULT_MAP_DATA.rating);
  const [businessReviews, setBusinessReviews] = useState(DEFAULT_MAP_DATA.reviews);
  const [businessCategory, setBusinessCategory] = useState(DEFAULT_MAP_DATA.category);
  const [businessPhone, setBusinessPhone] = useState(DEFAULT_MAP_DATA.phone);
  const [businessImage, setBusinessImage] = useState(DEFAULT_MAP_DATA.image);

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);
  const iframeRef = useRef(null);

  const isDarkTheme = String(theme).toLowerCase().includes('dark');

  // Colors on page for ColorPicker
  const colorsOnPageList = useMemo(() => {
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const elements = doc.querySelectorAll('[data-fill-color], [data-stroke-color], [fill], [stroke]');
    const colors = new Set();
    elements.forEach(el => {
      const fill = el.getAttribute('data-fill-color') || el.getAttribute('fill');
      const stroke = el.getAttribute('data-stroke-color') || el.getAttribute('stroke');
      if (fill && fill !== 'none' && fill !== '#' && !fill.includes('gradient')) colors.add(fill.toUpperCase());
      if (stroke && stroke !== 'none' && stroke !== '#' && !stroke.includes('gradient')) colors.add(stroke.toUpperCase());
    });
    colors.add('#000000');
    colors.add('#FFFFFF');
    colors.add('#00828A');
    colors.add('#EC5137');
    return Array.from(colors).slice(0, 12);
  }, [selectedElement]);

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

  // Universal updater that keeps canvas DOM & attributes in sync
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
    const nextTheme = updatedFields.theme !== undefined ? updatedFields.theme : theme;
    const nextButtonColor = updatedFields.buttonColor !== undefined ? updatedFields.buttonColor : buttonColor;
    const nextShowOpenMapBtn = updatedFields.showOpenMapBtn !== undefined ? updatedFields.showOpenMapBtn : showOpenMapBtn;

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
      selectedElement.setAttribute('data-theme', nextTheme);
      selectedElement.setAttribute('data-button-color', nextButtonColor);
      selectedElement.setAttribute('data-show-open-map-btn', nextShowOpenMapBtn ? 'true' : 'false');

      if (updatedFields.rawUrl !== undefined) selectedElement.setAttribute('data-raw-url', updatedFields.rawUrl);
      if (updatedFields.embedCode !== undefined) selectedElement.setAttribute('data-embed-code', updatedFields.embedCode);

      const fo = selectedElement.querySelector('foreignObject');
      const foW = parseFloat(fo?.getAttribute('width') || '240') || 240;
      const foH = parseFloat(fo?.getAttribute('height') || '230') || 230;

      // Rebuild inner foreignObject container with fresh overlay & theme
      const overlayHtml = generateOverlayHtml(nextStyle, {
        name: nextName,
        address: nextAddress,
        rating: nextRating,
        reviews: nextReviews,
        category: nextCategory,
        phone: nextPhone,
        image: nextImage,
        location: nextLocation,
        theme: nextTheme,
        buttonColor: nextButtonColor,
        showOpenMapBtn: nextShowOpenMapBtn
      });

      if (fo) {
        const baseW = 320;
        const scale = foW < baseW ? (foW / baseW) : 1;
        const innerW = foW < baseW ? baseW : foW;
        const innerH = Math.round(foH / scale);

        const isDark = String(nextTheme).toLowerCase().includes('dark');
        const filterStyle = isDark ? 'filter: invert(90%) hue-rotate(180deg) contrast(95%);' : '';

        fo.setAttribute('style', 'overflow: hidden; border-radius: 0px;');
        fo.innerHTML = `
          <div xmlns="http://www.w3.org/1999/xhtml" class="map-root-container" style="position: relative; width: 100%; height: 100%; overflow: hidden; margin: 0; padding: 0; border-radius: 0px; box-shadow: 0 4px 20px rgba(0,0,0,0.12);">
            <div class="map-stage" style="position: absolute; top: 0; left: 0; width: ${innerW}px; height: ${innerH}px; transform: scale(${scale}); transform-origin: 0 0; overflow: hidden;">
              <iframe src="${nextUrl.replace(/&/g, '&amp;')}" width="${innerW}" height="${innerH + 56}" style="position: absolute; top: -56px; left: 0; width: ${innerW}px; height: ${innerH + 56}px; border: 0; pointer-events: none; margin: 0; padding: 0; display: block; ${filterStyle}" allowfullscreen="" loading="lazy"></iframe>
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

  // Helper to apply fetched Google Maps details to state & preview
  const applyFetchedDetails = (data, rawUrlVal = '', type = 'URL') => {
    const details = data.details || {};
    const isGeneric = !details.name || /^google\s*maps?(\s*location)?$/i.test(details.name.trim()) || details.name === 'Location';

    let newName = businessName;
    if (!isGeneric && details.name) {
      newName = details.name;
    } else if (type === 'Location' && locationInput.trim()) {
      newName = locationInput.trim();
    } else if (data.place && !/^google\s*maps?(\s*location)?$/i.test(data.place.trim()) && data.place !== 'Location') {
      newName = data.place;
    }

    let newAddress = businessAddress;
    if (!isGeneric && details.address) {
      newAddress = details.address;
    } else if (details.coords) {
      newAddress = `Coordinates: ${details.coords}`;
    } else if (newName && newName !== 'Location') {
      newAddress = newName;
    }

    const newRating = details.rating && details.rating !== '4.8' ? details.rating : (businessRating || '4.9');
    const newReviews = details.reviews && details.reviews !== '500+' ? details.reviews : (businessReviews || '1500');
    const newCategory = details.category && details.category !== 'Location' ? details.category : (businessCategory || 'Animation Studio');
    const newPhone = details.phone || businessPhone;
    const newImage = details.image || businessImage;

    setBusinessName(newName);
    setBusinessAddress(newAddress);
    setBusinessRating(newRating);
    setBusinessReviews(newReviews);
    setBusinessCategory(newCategory);
    setBusinessPhone(newPhone);
    if (newImage) setBusinessImage(newImage);
    setLocation(newName);

    // Pick the URL safely: never allow wrapping URLs into q=https...
    let finalEmbedUrl = iframeUrl;
    if (type === 'Embed Code') {
      finalEmbedUrl = parseEmbedCode(rawUrlVal || embedCode) || iframeUrl;
    } else if (data.embedUrl && !data.embedUrl.includes('q=https') && !data.embedUrl.includes('q=http')) {
      finalEmbedUrl = data.embedUrl;
    } else if (type === 'Location' && newName) {
      finalEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(newName)}&t=&z=14&ie=UTF8&iwloc=near&output=embed`;
    }

    setIframeUrl(finalEmbedUrl);

    const updatePayload = {
      url: finalEmbedUrl,
      sourceType: type,
      location: newName,
      name: newName,
      address: newAddress,
      rating: newRating,
      reviews: newReviews,
      category: newCategory,
      phone: newPhone,
      image: newImage,
      theme,
      buttonColor
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

  // Sync state with selected element on canvas
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
      const savedTheme = selectedElement.getAttribute('data-theme') || 'Light Theme';
      const savedButtonColor = selectedElement.getAttribute('data-button-color') || '#000000';
      const savedShowOpenMapBtn = selectedElement.getAttribute('data-show-open-map-btn');

      setIframeUrl(url);

      if (savedStyle) {
        setLayoutStyle(savedStyle);
        setTempStyle(savedStyle);
      }
      if (savedName) setBusinessName(savedName);
      if (savedAddress) setBusinessAddress(savedAddress);
      if (savedRating) setBusinessRating(savedRating);
      if (savedReviews) setBusinessReviews(savedReviews);
      if (savedCategory) setBusinessCategory(savedCategory);
      if (savedPhone) setBusinessPhone(savedPhone);
      if (savedImage) setBusinessImage(savedImage);
      if (savedTheme) setTheme(savedTheme);
      if (savedButtonColor) setButtonColor(savedButtonColor);
      if (savedShowOpenMapBtn !== null) setShowOpenMapBtn(savedShowOpenMapBtn !== 'false');

      if (savedType) {
        setSourceType(savedType);
      }
      if (savedLocation) {
        setLocation(savedLocation);
        setLocationInput(savedLocation);
      } else if (savedName) {
        setLocation(savedName);
        setLocationInput(savedName);
      } else if (url.includes('maps.google.com') && url.includes('q=')) {
        try {
          const parsed = new URL(url);
          const q = parsed.searchParams.get('q');
          if (q) {
            const dec = decodeURIComponent(q);
            setLocation(dec);
            setLocationInput(dec);
          }
        } catch (e) {}
      }

      if (savedRawUrl) {
        setUrlInput(savedRawUrl);
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

      const isDark = String(savedTheme).toLowerCase().includes('dark');

      if (fo) {
        fo.style.setProperty('overflow', 'hidden', 'important');
        fo.style.setProperty('border-radius', '0px', 'important');
        const rootDiv = fo.querySelector('.map-root-container') || fo.querySelector('div');
        if (rootDiv) {
          rootDiv.style.setProperty('width', '100%', 'important');
          rootDiv.style.setProperty('height', '100%', 'important');
          rootDiv.style.setProperty('overflow', 'hidden', 'important');
          rootDiv.style.setProperty('border-radius', '0px', 'important');
        }

        if (stage) {
          stage.style.setProperty('width', innerW + 'px', 'important');
          stage.style.setProperty('height', innerH + 'px', 'important');
          stage.style.setProperty('transform', `scale(${scale})`, 'important');
          stage.style.setProperty('transform-origin', '0 0', 'important');
          if (iframe) {
            iframe.style.removeProperty('transform');
            iframe.style.setProperty('position', 'absolute', 'important');
            iframe.style.setProperty('top', '-56px', 'important');
            iframe.style.setProperty('left', '0', 'important');
            iframe.style.setProperty('width', innerW + 'px', 'important');
            iframe.style.setProperty('height', (innerH + 56) + 'px', 'important');
            iframe.setAttribute('width', innerW.toString());
            iframe.setAttribute('height', (innerH + 56).toString());
            iframe.style.setProperty('border', 'none', 'important');
            iframe.style.setProperty('display', 'block', 'important');
            iframe.style.setProperty('pointer-events', 'none', 'important');
            if (isDark) {
              iframe.style.setProperty('filter', 'invert(90%) hue-rotate(180deg) contrast(95%)', 'important');
            } else {
              iframe.style.removeProperty('filter');
            }
          }
        } else {
          // Re-render map stage with theme & overlay
          const effectiveStyle = savedStyle || layoutStyle || 'carousel';
          const overlayHtml = generateOverlayHtml(effectiveStyle, {
            name: savedName || businessName || DEFAULT_MAP_DATA.name,
            address: savedAddress || businessAddress || DEFAULT_MAP_DATA.address,
            rating: savedRating || businessRating || DEFAULT_MAP_DATA.rating,
            reviews: savedReviews || businessReviews || DEFAULT_MAP_DATA.reviews,
            category: savedCategory || businessCategory || DEFAULT_MAP_DATA.category,
            phone: savedPhone || businessPhone || DEFAULT_MAP_DATA.phone,
            image: savedImage || businessImage || DEFAULT_MAP_DATA.image,
            location: savedLocation || location,
            theme: savedTheme,
            buttonColor: savedButtonColor,
            showOpenMapBtn: savedShowOpenMapBtn !== null ? savedShowOpenMapBtn !== 'false' : showOpenMapBtn
          });

          fo.setAttribute('style', 'overflow: hidden; border-radius: 0px;');
          const cleanUrl = (url || defaultUrl).replace(/&amp;/g, '&').replace(/&/g, '&amp;');
          const filterStyle = isDark ? 'filter: invert(90%) hue-rotate(180deg) contrast(95%);' : '';
          fo.innerHTML = `
            <div xmlns="http://www.w3.org/1999/xhtml" class="map-root-container" style="position: relative; width: 100%; height: 100%; overflow: hidden; margin: 0; padding: 0; border-radius: 0px; box-shadow: 0 4px 20px rgba(0,0,0,0.12);">
              <div class="map-stage" style="position: absolute; top: 0; left: 0; width: ${innerW}px; height: ${innerH}px; transform: scale(${scale}); transform-origin: 0 0; overflow: hidden;">
                <iframe src="${cleanUrl}" width="${innerW}" height="${innerH + 56}" style="position: absolute; top: -56px; left: 0; width: ${innerW}px; height: ${innerH + 56}px; border: 0; pointer-events: none; margin: 0; padding: 0; display: block; ${filterStyle}" allowfullscreen="" loading="lazy"></iframe>
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

  // Location search input handler
  const handleLocationInputChange = async (e) => {
    const value = e.target.value;
    setLocationInput(value);
    setErrorMessage('');

    // Check if coordinates
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
        const results = Array.isArray(data) ? [...data] : [];
        // Add direct query suggestion as an option so user can always pick their custom name
        results.push({
          display_name: value.trim(),
          isCustomQuery: true
        });
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setSuggestions([{ display_name: value.trim(), isCustomQuery: true }]);
        setShowSuggestions(true);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const placeName = suggestion.display_name;
    const isDirect = suggestion.isCoordinate || suggestion.isCustomQuery;
    const parts = placeName.split(',');
    const mainTitle = isDirect ? suggestion.display_name : parts[0].trim();
    const secondaryAddress = isDirect ? mainTitle : (parts.slice(1, 4).join(',').trim() || mainTitle);
    const categoryName = suggestion.type ? (suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1).replace(/_/g, ' ')) : 'Location';

    setLocationInput(mainTitle);
    setLocation(mainTitle);
    setBusinessName(mainTitle);
    setBusinessAddress(secondaryAddress);
    setBusinessCategory(categoryName);
    setShowSuggestions(false);
    setErrorMessage('');

    const newUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mainTitle)}&t=&z=14&ie=UTF8&iwloc=near&output=embed`;
    setIframeUrl(newUrl);
    updateMapData({
      url: newUrl,
      sourceType: 'Location',
      location: mainTitle,
      name: mainTitle,
      address: secondaryAddress,
      category: categoryName
    });

    fetchPlaceDetails(mainTitle, 'Location');
  };

  const handleSearchSubmit = () => {
    setShowSuggestions(false);
    setErrorMessage('');
    const query = locationInput.trim();
    if (!query) return;

    const newUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=14&ie=UTF8&iwloc=near&output=embed`;
    setBusinessName(query);
    setLocation(query);
    setBusinessAddress(query);
    setIframeUrl(newUrl);

    updateMapData({
      url: newUrl,
      sourceType: 'Location',
      location: query,
      name: query,
      address: query
    });

    fetchPlaceDetails(query, 'Location');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
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

    // Extract place name or coords from pb parameter if present (!2s... / !3d... / !2d...)
    let extractedName = '';
    const pbPlaceMatch = extracted.match(/!2s([^!&]+)/);
    if (pbPlaceMatch && pbPlaceMatch[1]) {
      extractedName = decodeURIComponent(pbPlaceMatch[1].replace(/\+/g, ' '));
    }
    const pbLat = extracted.match(/!3d(-?\d+\.\d+)/);
    const pbLng = extracted.match(/!2d(-?\d+\.\d+)/);
    const coords = (pbLat && pbLng) ? `${pbLat[1]}, ${pbLng[1]}` : '';

    const newName = extractedName || businessName || 'Location';
    const newAddress = coords ? `Coordinates: ${coords}` : (extractedName || businessAddress || 'Location Details');

    if (extractedName) {
      setBusinessName(extractedName);
      setLocation(extractedName);
      setBusinessAddress(newAddress);
    }
    setIframeUrl(extracted);

    updateMapData({
      url: extracted,
      sourceType: 'Embed Code',
      embedCode: trimmed,
      name: newName,
      address: newAddress,
      location: newName
    });

    setIsLoadingUrl(true);
    try {
      await fetchPlaceDetails(extracted, 'Embed Code');
    } catch (e) {
      console.error("Error resolving embed map URL:", e);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Toggle/cycle layout templates via the top-right button on the preview card
  const handleCycleLayout = () => {
    const templateIds = ['carousel', 'actions', 'callout', 'gallery', 'none'];
    const currentIndex = templateIds.indexOf(layoutStyle);
    const nextIndex = (currentIndex + 1) % templateIds.length;
    const nextStyle = templateIds[nextIndex];
    setLayoutStyle(nextStyle);
    updateMapData({ style: nextStyle });
  };

  // Handle Theme Change ('Light Theme' | 'Dark Theme')
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    updateMapData({ theme: newTheme });
  };

  // Handle Button Color Change
  const handleButtonColorChange = (newColor) => {
    setButtonColor(newColor);
    updateMapData({ buttonColor: newColor });
  };

  const handleButtonOpacityChange = (newOpacity) => {
    setButtonOpacity(newOpacity);
  };

  // Handle Open in Map Button Toggle
  const handleToggleOpenMapBtn = (newVal) => {
    setShowOpenMapBtn(newVal);
    updateMapData({ showOpenMapBtn: newVal });
  };

  return (
    <div className="w-full flex flex-col gap-[0.8vw] font-sans text-gray-800 p-[0.75vw]">
      {/* ─── 1. MAP SOURCE ─── */}
      <SectionHeader title="Map Source" />

      {/* Radio Buttons for Source Type */}
      <div className="flex items-center justify-between w-full px-[0.1vw] py-[0.1vw]">
        {['Location', 'URL', 'Embed Code'].map((type) => (
          <RadioButton
            key={type}
            label={type}
            checked={sourceType === type}
            onChange={() => {
              setSourceType(type);
              setErrorMessage('');
            }}
          />
        ))}
      </div>

      {/* 1.1 Location Search Input */}
      {sourceType === 'Location' && (
        <div className="relative w-full" ref={wrapperRef}>
          <div className="w-full h-[2.5vw] flex items-center border border-gray-200 rounded-[0.5vw] bg-white px-[0.6vw] shadow-2xs hover:border-gray-300 focus-within:border-[#E05638] transition-colors">
            <Search size="0.95vw" className="text-gray-400 flex-shrink-0 mr-[0.4vw]" />
            <input
              type="text"
              value={locationInput}
              onChange={handleLocationInputChange}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (locationInput.trim() && locationInput.trim() !== location) {
                  handleSearchSubmit();
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Search Location..."
              className="flex-1 h-full text-[0.78vw] font-normal text-gray-700 bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-[0.6vw] shadow-2xl max-h-[14vw] overflow-y-auto">
              {suggestions.map((suggestion, index) => {
                const isDirect = suggestion.isCoordinate || suggestion.isCustomQuery;
                const parts = suggestion.display_name.split(',');
                const mainText = isDirect ? suggestion.display_name : parts[0];
                const secondaryText = isDirect ? (suggestion.isCoordinate ? 'Coordinates' : 'Search on Google Maps') : parts.slice(1, 4).join(',').trim();

                return (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex flex-col px-3 py-1.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    <span className="text-[0.76vw] font-semibold text-gray-900 truncate">{mainText}</span>
                    {secondaryText && (
                      <span className="text-[0.68vw] text-gray-500 truncate">{secondaryText}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 1.2 URL Input */}
      {sourceType === 'URL' && (
        <div className="w-full flex flex-col gap-[0.25vw]">
          <span className="text-[0.7vw] text-gray-500 font-medium">Source URL</span>
          <div className={`flex border ${errorMessage ? 'border-red-500' : 'border-gray-200'} rounded-[0.5vw] overflow-hidden focus-within:border-[#E05638] focus-within:ring-1 focus-within:ring-[#E05638] transition-all bg-white shadow-2xs`}>
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
              onBlur={handleApplyUrl}
              placeholder="e.g. https://maps.app.goo.gl/"
              className="flex-1 px-[0.6vw] py-[0.5vw] text-[0.78vw] font-normal outline-none text-gray-800 placeholder-gray-400 bg-transparent"
              disabled={isLoadingUrl}
            />
            {isLoadingUrl && (
              <div className="flex items-center pr-[0.4vw]">
                <Loader2 size="0.85vw" className="animate-spin text-gray-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (urlInput) {
                  navigator.clipboard.writeText(urlInput.startsWith('http') ? urlInput : 'https://' + urlInput);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 1500);
                }
              }}
              className="px-[0.6vw] flex items-center justify-center text-gray-500 hover:text-[#E05638] transition-colors bg-gray-50 border-l border-gray-200 cursor-pointer"
              title={copiedUrl ? 'Copied!' : 'Copy Link'}
            >
              {copiedUrl ? (
                <Check className="w-[0.85vw] h-[0.85vw] text-green-600" />
              ) : (
                <Copy className="w-[0.85vw] h-[0.85vw]" />
              )}
            </button>
          </div>
          {errorMessage && (
            <div className="p-[0.35vw] bg-red-50 border border-red-200 rounded-[0.4vw] text-[0.68vw] text-red-600 flex items-start gap-[0.25vw] mt-[0.1vw]">
              <AlertCircle size="0.75vw" className="text-red-500 flex-shrink-0 mt-[0.05vw]" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* 1.3 Embed Code Textarea */}
      {sourceType === 'Embed Code' && (
        <div className="w-full flex flex-col gap-[0.25vw]">
          <span className="text-[0.7vw] text-gray-500 font-medium">Code</span>
          <textarea
            value={embedCode}
            onChange={(e) => {
              setEmbedCode(e.target.value);
              setErrorMessage('');
            }}
            onBlur={handleApplyEmbedCode}
            placeholder="Paste HTML code here"
            rows={3}
            className={`w-full border ${errorMessage ? 'border-red-500' : 'border-gray-200'} rounded-[0.5vw] p-[0.6vw] text-[0.78vw] font-normal text-gray-800 placeholder-gray-400 outline-none focus:border-[#E05638] focus:ring-1 focus:ring-[#E05638] bg-white h-[5.5vw] resize-none shadow-2xs font-mono`}
            disabled={isLoadingUrl}
          />
          {errorMessage && (
            <div className="p-[0.35vw] bg-red-50 border border-red-200 rounded-[0.4vw] text-[0.68vw] text-red-600 flex items-start gap-[0.25vw] mt-[0.1vw]">
              <AlertCircle size="0.75vw" className="text-red-500 flex-shrink-0 mt-[0.05vw]" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── 2. LIVE MAP & OVERLAY PREVIEW CARD ─── */}
      <div className="relative w-full aspect-[4/3.5] rounded-[0.8vw] border border-gray-200 overflow-hidden shadow-2xs bg-slate-100 select-none group">
        {/* Top-Right Replace / Swap Style Button (Opens Style Gallery Popup) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setTempStyle(layoutStyle);
            setShowStylePicker(true);
          }}
          className="absolute top-[0.4vw] right-[0.4vw] z-30 p-[0.3vw] bg-white/95 hover:bg-white backdrop-blur-sm rounded-[0.35vw] shadow-xs border border-gray-200 text-gray-500 hover:text-black hover:border-gray-400 transition-all cursor-pointer flex items-center justify-center"
          title="Click to replace map style"
        >
          <Icon icon="lucide:arrow-right-left" className="w-[0.9vw] h-[0.9vw] group-hover:scale-105 transition-transform" />
        </button>

        {iframeUrl ? (
          <div className="relative w-full h-full overflow-hidden">
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              style={{
                position: 'absolute',
                top: '-56px',
                left: 0,
                width: '100%',
                height: 'calc(100% + 56px)',
                border: 0,
                filter: isDarkTheme ? 'invert(90%) hue-rotate(180deg) contrast(95%)' : 'none'
              }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Map Preview"
            />
            {/* Card Overlay with Theme & Button Color */}
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
                  location: location,
                  theme: theme,
                  buttonColor: buttonColor,
                  showOpenMapBtn: showOpenMapBtn
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

       {/* "Open in Map" Redirect Button Toggle */}
          
      <div className="flex items-center justify-between py-[0.1vw] px-[0.1vw]">
        <div className="flex flex-col">
          <span className="text-[0.78vw] font-medium text-gray-800">Open in Maps</span>
          <span className="text-[0.65vw] text-gray-400">To add redirect button on map</span>
        </div>
        <Toggle
          checked={showOpenMapBtn}
          onChange={handleToggleOpenMapBtn}
          title={showOpenMapBtn ? 'Hide "Open in Map" button' : 'Show "Open in Map" button'}
        />
      </div>

      {/* ─── 3. BUTTON COLOR ─── */}
      <SectionHeader title="Button Color" />

      
      <div className="flex items-center gap-[0.4vw] w-full">
        {/* Color box trigger */}
        <div
          onClick={() => setActiveColorPicker(activeColorPicker === 'buttonColor' ? null : 'buttonColor')}
          className={`color-box color-box-trigger w-[2vw] h-[2vw] rounded-[0.5vw] border flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 transition-all ${
            activeColorPicker === 'buttonColor' ? 'border-[#E05638] ring-2 ring-[#E05638]/40 scale-105 shadow-xs' : 'border-gray-200 hover:border-gray-300'
          }`}
          style={{ backgroundColor: buttonColor === 'none' || buttonColor === 'transparent' ? '#ffffff' : buttonColor }}
          title="Click to open color palette"
        >
          {(buttonColor === 'none' || buttonColor === 'transparent') && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
          )}
        </div>

        {/* Input for hex and opacity */}
        <div className="flex-1 h-[2.5vw] flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white px-[0.6vw] text-[0.8vw] text-gray-800 focus-within:border-[#E05638] shadow-2xs">
          <input
            type="text"
            value={buttonColor && buttonColor.includes('gradient') ? 'GRADIENT' : (buttonColor?.toUpperCase() || '#000000')}
            onChange={(e) => {
              let val = e.target.value;
              if (!val.startsWith('#') && val.length > 0 && !val.includes('gradient')) val = '#' + val;
              handleButtonColorChange(val);
            }}
            className="w-[5.2vw] font-mono text-[0.8vw] text-gray-800 bg-transparent focus:outline-none uppercase"
            maxLength={7}
          />
          <span className="text-gray-400 text-[0.75vw] font-medium">{buttonOpacity}%</span>
        </div>

        {/* HEX dropdown indicator */}
        <div
          onClick={() => setActiveColorPicker(activeColorPicker === 'buttonColor' ? null : 'buttonColor')}
          className="h-[2.5vw] flex items-center justify-between px-[0.6vw] border border-gray-200 rounded-[0.5vw] bg-white cursor-pointer hover:border-gray-300 min-w-[4.2vw] shadow-2xs"
        >
          <span className="text-[0.75vw] text-gray-600 font-medium">HEX</span>
          <ChevronDown size="0.8vw" className="text-gray-400 ml-[0.3vw]" />
        </div>
      </div>

      {/* ─── 4. THEME ─── */}
      <SectionHeader title="Theme" />

      <CustomSelect
        value={theme}
        onChange={handleThemeChange}
        options={THEME_OPTIONS}
      />

      {/* ─── PORTALS ─── */}
      {/* ── Map Style Gallery Popup (Exact Match to QRCodeProperties Frame Style Gallery) ── */}
      {showStylePicker && createPortal(
        <>
          <div
            className="fixed inset-0 z-[4999]"
            onClick={() => setShowStylePicker(false)}
          />
          <div
            className="fixed z-[5000] bg-white border border-gray-100 rounded-[0.5vw] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 px-[1vw] pt-[1vw] pb-[0.6vw] shadow-2xl select-none"
            style={{
              width: '21vw',
              minWidth: '320px',
              top: '60%',
              right: '19.5vw',
              transform: 'translateY(-50%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-[0.5vw] mb-[1.2vw]">
                <h3 className="text-[0.9vw] font-medium text-gray-800 whitespace-nowrap">Map Style Gallery</h3>
                <div className="flex-grow h-[0.1px] bg-[#E2E8F0]" />
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 gap-[0.6vw] mb-[0.6vw] max-h-[55vh] overflow-y-auto pr-[0.3vw]">
                {MAP_TEMPLATES.map((tmpl) => {
                  const isSelected = tempStyle === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setTempStyle(tmpl.id)}
                      onDoubleClick={() => {
                        setLayoutStyle(tmpl.id);
                        updateMapData({ style: tmpl.id });
                        setShowStylePicker(false);
                      }}
                      className={`cursor-pointer transition-all duration-300 p-[0.45vw] rounded-[0.5vw] flex flex-col border-[1px] ${
                        isSelected
                          ? 'shadow-[0_8px_20px_rgba(0,0,0,0.12)] border-[2px] border-gray-300 scale-[1.03] bg-slate-50/40'
                          : 'hover:bg-gray-50 border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      title={tmpl.name}
                    >
                      <div className="w-full aspect-[4/3] rounded-[0.3vw] overflow-hidden pointer-events-none relative shadow-2xs border border-gray-100">
                        <MapTemplateThumbnail templateId={tmpl.id} theme={theme} buttonColor={buttonColor} />
                      </div>
                      <div className="flex items-center justify-between mt-[0.35vw] px-[0.1vw]">
                        <span className="text-[0.65vw] font-semibold text-gray-800 truncate">
                          {tmpl.name}
                        </span>
                        {tmpl.badge && (
                          <span className="text-[0.5vw] font-semibold px-[0.25vw] py-[0.05vw] rounded bg-teal-50 text-[#00828a] border border-teal-100 flex-shrink-0 ml-[0.2vw]">
                            {tmpl.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-end justify-end gap-[0.8vw] pt-[0.5vw] border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowStylePicker(false)}
                  className="flex items-end gap-[0.4vw] px-[1vw] py-[0.4vw] rounded-[0.4vw] border-[1px] border-gray-300 bg-white text-gray-700 font-semibold text-[0.8vw] hover:bg-gray-50 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  <X size="1vw" className="mb-[0.1vw]" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayoutStyle(tempStyle);
                    updateMapData({ style: tempStyle });
                    setShowStylePicker(false);
                  }}
                  className="flex items-end gap-[0.4vw] px-[1.2vw] py-[0.4vw] bg-black text-white rounded-[0.4vw] text-[0.8vw] font-semibold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg cursor-pointer"
                >
                  <Icon icon="qlementine-icons:replace-16" className="w-[1vw] h-[1vw] mb-[0.1vw]" />
                  Replace
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Official ColorPicker Portal Popup (Positioned alongside RightSidebar) */}
      {activeColorPicker === 'buttonColor' && createPortal(
        <div
          className="fixed z-[5000]"
          style={{
            top: '50%',
            right: '19.5vw',
            transform: 'translateY(-50%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <ColorPicker
              color={buttonColor}
              opacity={buttonOpacity}
              onOpacityChange={handleButtonOpacityChange}
              onChange={handleButtonColorChange}
              onClose={() => setActiveColorPicker(null)}
              disableGradient={true}
              colorsOnPage={colorsOnPageList}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MapEditor;
