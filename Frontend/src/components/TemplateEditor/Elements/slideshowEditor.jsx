import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveUploadsPath } from '../../../utils/supabaseUtils';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  LayoutGrid,
  Maximize,
  MoveHorizontal,
  Settings,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Replace,
  Upload,
  X
  } from 'lucide-react';
import ReplaceMediaModal from '../ReplaceMediaModal';
import { Icon } from '@iconify/react';
import { getVisualBBox } from '../MainEditor';

// Clean up any lingering debuggers from Vite HMR
['my-slideshow-debug', 'my-slideshow-debug2', 'my-slideshow-debug3'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.remove();
});
import PremiumDropdown from '../../CustomizedEditor/PremiumDropdown';
import NavIconStylesPopup, { NavIconRenderer } from '../../CustomizedEditor/popups/NavIconStylesPopup';
import DotStylesPopup, { DotRenderer } from '../../CustomizedEditor/popups/DotStylesPopup';
import axios from 'axios';
import ColorPicker from '../ColorPicker';

const DraggableSpan = ({ label, value, onChange, min = 0, max = 100, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
      onChange(newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = Number(value);
  };

  return (
    <span className={`${className} cursor-ew-resize select-none`} onMouseDown={onMouseDown}>{label}</span>
  );
};

const Toggle = ({ active, onClick }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`relative block w-[1.8vw] h-[1vw] rounded-[1vw] transition-all duration-200 ease-in-out shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.3)] outline-none shrink-0 cursor-pointer ${active ? 'bg-[#4A3AFF]' : 'bg-[#bbbbbb]'}`}
  >
    <div
      className={`absolute top-[0.1vw] w-[0.8vw] h-[0.8vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.4)] ${active ? 'left-[0.9vw]' : 'left-[0.1vw]'}`}
    />
  </button>
);

const Switch = ({ enabled, onChange }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onChange(!enabled);
    }}
    className={`relative block w-[1.8vw] h-[1vw] rounded-[1vw] transition-all duration-200 ease-in-out shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.3)] outline-none shrink-0 cursor-pointer ${enabled ? 'bg-[#4A3AFF]' : 'bg-[#bbbbbb]'}`}
  >
    <div
      className={`absolute top-[0.1vw] w-[0.8vw] h-[0.8vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.4)] ${enabled ? 'left-[0.9vw]' : 'left-[0.1vw]'}`}
    />
  </button>
);

const RadioGroup = ({ options, value, onChange }) => (
  <div className="space-y-[0.75vw]">
    {options.map((opt) => (
      <label key={opt.id} className="text-[0.75vw] font-semibold text-gray-700">
        <div className="relative flex items-center justify-center">
          <input
            type="radio"
            name="radio-group"
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
            className="peer appearance-none w-[1vw] h-[1vw] border-2 border-gray-300 rounded-full checked:border-[#4A3AFF] transition-all bg-white"
          />
          <div className="absolute w-[0.3vw] h-[0.3vw] bg-[#4A3AFF] rounded-full scale-0 peer-checked:scale-100 transition-transform" />
        </div>
        <span className={`text-[0.85vw] font-medium ${value === opt.id ? 'text-gray-900' : 'text-gray-500'}`}>{opt.label}</span>
      </label>
    ))}
  </div>
);

const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.5vw] py-[0.25vw] mt-[0.25vw]">
    <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">{title}</span>
    <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-2vw' }}> </div>
  </div>
);

const compressImage = (file) => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File) || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    // Fast path: skip canvas overhead for small files (<= 1.5MB)
    if (file.size <= 1.5 * 1024 * 1024) {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 1920;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      } else if (file.size <= 2.5 * 1024 * 1024) {
        resolve(file);
        return;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        if (blob && blob.size < file.size) {
          const compressedFile = new File([blob], file.name, {
            type: outputType,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, outputType, 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
};

const MAX_GALLERY_IMAGES = 4;

const fontFamilies = [
  'Bangers', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather',
];

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 50, 64, 70, 72, 96];

const SlideshowEditor = ({ selectedElement, activePageIndex, onUpdate, isOpen, onToggle, opacity, onUpdateOpacity, setPreviewSrc, setIsUpdatingDOM, currentPageVId, flipbookVId, folderName, flipbookName, onDisableSlideshow }) => {
  const location = useLocation();
  const accordionRef = useRef(null);

  useEffect(() => {
    if (isOpen && accordionRef.current) {
      setTimeout(() => {
        accordionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 350);
    }
  }, [isOpen]);
  // Slideshow specific states
  const [slideshowSettings, setSlideshowSettings] = useState({
    autoPlay: true,
    speed: 3,
    infiniteLoop: true,
    showArrows: true,
    showDots: true,
    imageFitType: 'Fill All',
    transitionEffect: 'Linear',
    dragToSlide: false,
    dotColor: '#000000',
    dotOpacity: 100,
    dotStyle: 1,
    navIconColor: '#000000',
    navStyle: 1,
    autoSlide: true
  });
  const [slideshowImages, setSlideshowImages] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [localOpacity, setLocalOpacity] = useState(opacity ?? 100);
  const [localContrast, setLocalContrast] = useState(100);
  const [localBrightness, setLocalBrightness] = useState(100);
  const [localBlur, setLocalBlur] = useState(0);
  const [localHeading, setLocalHeading] = useState('');
  const [localSubtext, setLocalSubtext] = useState('');
  const [localFontFamily, setLocalFontFamily] = useState('Arial');
  const [localFontSize, setLocalFontSize] = useState(16);

  useEffect(() => {
    setLocalOpacity(opacity ?? 100);
  }, [opacity]);

  useEffect(() => {
    const activeImage = slideshowImages[activeSlideIndex];
    if (activeImage) {
      setLocalContrast(activeImage.contrast !== undefined ? activeImage.contrast : 100);
      setLocalBrightness(activeImage.brightness !== undefined ? activeImage.brightness : 100);
      setLocalBlur(activeImage.blur !== undefined ? activeImage.blur : 0);
      setLocalHeading(activeImage.heading || '');
      setLocalSubtext(activeImage.subtext || '');
      setLocalFontFamily(activeImage.fontFamily || 'Arial');
      setLocalFontSize(activeImage.fontSize || 16);
    }
  }, [activeSlideIndex, slideshowImages]);

  const updateImageSetting = useCallback((key, value) => {
    setSlideshowImages(current => {
      const updated = [...current];
      if (updated[activeSlideIndex]) {
        updated[activeSlideIndex] = { ...updated[activeSlideIndex], [key]: value };
      }
      return updated;
    });
    // Trigger background save
    if (onUpdateRef.current) {
      if (onUpdateTimerRef.current) clearTimeout(onUpdateTimerRef.current);
      onUpdateTimerRef.current = setTimeout(() => {
        if (onUpdateRef.current) onUpdateRef.current({});
      }, 500);
    }
  }, [activeSlideIndex]);

  // Automatically persist images to localStorage to prevent loss on unsaved refresh
  useEffect(() => {
    if (selectedElement?.id) {
      const key = `slideshow_${flipbookVId || 'local'}_${selectedElement.id}`;
      const toSave = slideshowImages.filter(img => {
        if (img.isUploading) return false;
        if (img.url && img.url.startsWith('data:') && img.url.length > 5000) return false;
        return true;
      });
      try {
        if (toSave.length > 0) {
          localStorage.setItem(key, JSON.stringify(toSave));
        } else if (slideshowImages.length === 0) {
          localStorage.removeItem(key); // Clear if emptied
        }
      } catch (e) {
        console.warn("Slideshow local storage quota exceeded or failed:", e);
      }
    }
  }, [selectedElement?.id, slideshowImages, flipbookVId]);
  const isHoveringRef = useRef(false);
  const sidebarRef = useRef(null);

  const transitionEffectRef = useRef(slideshowSettings.transitionEffect || 'Linear');
  useEffect(() => {
    transitionEffectRef.current = slideshowSettings.transitionEffect || 'Linear';
  }, [slideshowSettings.transitionEffect]);

  const [showEffectDropdown, setShowEffectDropdown] = useState(false);
  const [showFitDropdown, setShowFitDropdown] = useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [libraryTargetIndex, setLibraryTargetIndex] = useState(null);
  const [showDotColorPicker, setShowDotColorPicker] = useState(false);
  const [showDotStylesPopup, setShowDotStylesPopup] = useState(false);
  const [showNavColorPicker, setShowNavColorPicker] = useState(false);
  const [showNavStylesPopup, setShowNavStylesPopup] = useState(false);
  const fileInputRef = useRef(null);

  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState(null);
  const [newReplaceImg, setNewReplaceImg] = useState(null);
  const replaceInputRef = useRef(null);

  const [isDisabling, setIsDisabling] = useState(false);
  const isSlideshowPropOpen = isOpen;
  const setIsSlideshowPropOpen = () => onToggle();
  const [isSyncing, setIsSyncing] = useState(false);
  const isUpdatingDOM = useRef(false);
  const isUpdatingDOMTimeoutRef = useRef(null);
  const isHydrating = useRef(true);
  const isSyncingRef = useRef(false);
  const lastSyncedDataRef = useRef("");

  const onUpdateTimerRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  const onUpdateRef = useRef(onUpdate);
  const onUpdateOpacityRef = useRef(onUpdateOpacity);
  const setPreviewSrcRef = useRef(setPreviewSrc);
  const isAnimatingRef = useRef(false);
  const resetAutoTimerRef = useRef(null);

  const truncateLogData = (data) => {
    if (!data) return data;
    try {
      const obj = typeof data === 'string' ? JSON.parse(data) : JSON.parse(JSON.stringify(data));
      if (obj && obj.images) {
        obj.images = obj.images.map(img => ({
          ...img,
          url: (img.url && img.url.length > 100) ? (img.url.substring(0, 40) + "..." + img.url.substring(img.url.length - 20)) : img.url
        }));
      }
      return obj;
    } catch (e) { return data; }
  };

  const getSvgImageEl = (el) => {
    if (!el) return null;
    const tag = el.tagName?.toLowerCase();
    if (tag === 'image' || tag === 'img') return el;

    const findInPattern = (node) => {
      const fill = node.getAttribute?.('fill') || '';
      if (fill?.startsWith('url(#')) {
        const patternId = fill.match(/url\(#([^)]+)\)/)?.[1];
        if (patternId) {
          const doc = node.ownerDocument;
          const ownerSvg = node.closest('svg');
          const pattern = ownerSvg?.querySelector(`[id="${patternId}"]`) || doc?.getElementById(patternId);
          if (pattern) {
            const img = pattern.querySelector('image');
            if (img) return img;
            const useEl = pattern.querySelector('use');
            if (useEl) {
              const refId = (useEl.getAttribute('href') || useEl.getAttribute('xlink:href'))?.replace('#', '');
              if (refId) return doc?.getElementById(refId) || ownerSvg?.querySelector(`[id="${refId}"]`);
            }
          }
        }
      }
      return null;
    };

    const patternTarget = findInPattern(el);
    if (patternTarget) return patternTarget;
    const childImg = el.querySelector('image, img');
    if (childImg) return childImg;
    const childrenWithPatterns = el.querySelectorAll('[fill^="url(#"]');
    for (const child of Array.from(childrenWithPatterns)) {
      const target = findInPattern(child);
      if (target) return target;
    }
    return null;
  };

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onUpdateOpacityRef.current = onUpdateOpacity;
    setPreviewSrcRef.current = setPreviewSrc;
  });

  const syncStateFromDOM = useCallback((force = false) => {
    if (!selectedElement || isSyncingRef.current) return;

    isHydrating.current = true;
    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      const targetElement = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;


      const savedDataRaw = targetElement.getAttribute('data-slideshow');
      console.log("[SlideshowProperties] Syncing from DOM. SavedData:", truncateLogData(savedDataRaw));

      if (savedDataRaw) {
        const savedData = JSON.parse(savedDataRaw);
        if (savedData) {
          setSlideshowSettings(prev => ({ ...prev, ...savedData.settings }));
          setSlideshowImages(prev => {
            // NEVER overwrite if we are uploading or have optimistic blob URLs, even if forced
            const hasOptimistic = prev.some(img => img.isUploading || (img.url && img.url.startsWith('blob:')));
            if (hasOptimistic) return prev;

            let newImages = (savedData.images || []).slice(0, MAX_GALLERY_IMAGES);

            // Check localStorage fallback ONLY if DOM savedData has no images
            const localKey = `slideshow_${flipbookVId || 'local'}_${targetElement.id}`;
            if (!newImages || newImages.length === 0) {
              const localRaw = localStorage.getItem(localKey);
              if (localRaw) {
                try {
                  const localImages = JSON.parse(localRaw);
                  if (Array.isArray(localImages) && localImages.length > 0) {
                    newImages = localImages.slice(0, MAX_GALLERY_IMAGES);
                  }
                } catch (e) { }
              }
            }

            // If forced (e.g. element selection), we sync. 
            // Otherwise, we only sync if the DOM has more or different information.
            // Crucially, we don't let the DOM "shrink" our image list unless forced.
            if (!force && prev.length > 0 && newImages.length < prev.length) {
              return prev;
            }

            if (!force && prev.length > 0) return prev;

            return newImages.map((img, idx) => {
              if (idx === 0 && img.isOriginalCrop === undefined) {
                 return { ...img, isOriginalCrop: true }; // Retroactive fix for old saves
              }
              return img;
            });
          });
        }
      } else {
        // Default init
        setSlideshowSettings({
          autoPlay: true,
          speed: 3,
          infiniteLoop: true,
          showArrows: true,
          showDots: true,
          imageFitType: 'Fill All',
          transitionEffect: 'Linear',
          dragToSlide: false,
          dotColor: '#000000',
          dotOpacity: 100,
          navIconColor: '#000000',
          navStyle: 1,
          autoSlide: true
        });
        const imgEl = getSvgImageEl(targetElement);
        const currentSrc = (imgEl?.getAttribute('href') || imgEl?.getAttribute('xlink:href') || imgEl?.getAttribute('src') || imgEl?.src || targetElement.getAttribute('href') || targetElement.getAttribute('xlink:href'));
        setSlideshowImages(prev => {
          const hasOptimistic = prev.some(img => img.isUploading || (img.url && img.url.startsWith('blob:')));
          if (hasOptimistic) return prev;
          if (prev.length > 0 && !force) return prev;
          if (currentSrc && !currentSrc.includes('placehold.co')) {
            return [{ id: Date.now(), url: currentSrc, name: 'Main Image', isOriginalCrop: true }];
          }
          return [];
        });
      }

      const activeIdx = parseInt(targetElement.getAttribute('data-active-index')) || 0;
      setActiveSlideIndex(activeIdx);

    } catch (e) {
      console.error("Failed to sync slideshow from DOM", e);
    }

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      isHydrating.current = false;
      isSyncingRef.current = false;
      setIsSyncing(false);
      syncTimeoutRef.current = null;
    }, 50);
  }, [selectedElement]);

  const applyDesign = useCallback(() => {
    if (!selectedElement?.id || isDisabling) return;

    const apply = () => {
      const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      const targetElement = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;

      isUpdatingDOM.current = true;
      try {
        const dataToSave = {
          settings: slideshowSettings,
          images: slideshowImages.slice(0, MAX_GALLERY_IMAGES)
        };

        const newDataStr = JSON.stringify(dataToSave);
        const oldDataStr = targetElement.getAttribute('data-slideshow');

        // Use a unique signature for the "core" visual state (excluding current index and runtime interactive settings)
        const visualStateSignature = JSON.stringify({
          id: selectedElement.id,
          images: slideshowImages.map(img => ({ url: img.url, isOriginalCrop: img.isOriginalCrop, cropData: img.cropData })),
          imageFitType: slideshowSettings.imageFitType,
          opacity: opacity
        });

        if (newDataStr !== oldDataStr) {
          targetElement.setAttribute('data-slideshow', newDataStr);
          targetElement.setAttribute('data-is-slideshow', 'true');
          targetElement.dataset.slideshow = newDataStr;
          targetElement.dataset.isSlideshow = 'true';
          targetElement._slideshowManual = true;

          // Trigger a silent background save to the parent appData
          // We debounce this specifically to avoid massive lag when dragging sliders.
          if (onUpdateRef.current) {
            if (onUpdateTimerRef.current) clearTimeout(onUpdateTimerRef.current);
            onUpdateTimerRef.current = setTimeout(() => {
              if (onUpdateRef.current) onUpdateRef.current({});
            }, 500);
          }
        }

        targetElement.setAttribute('data-active-index', activeSlideIndex.toString());

        // Dynamic 3-Frame Carousel Layout Logic
        if (targetElement.getAttribute('data-type') === 'slideshow') {
          const uniqueId = targetElement.id.replace('slideshow-', '') || Date.now();
          const newImages = slideshowImages.map(i => i.url);
          
          let defs = targetElement.querySelector('defs');
          if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            targetElement.insertBefore(defs, targetElement.firstChild);
          }

          const len = newImages.length;
          let leftIndex = -1, centerIndex = -1, rightIndex = -1;
          
          if (len > 0) {
            centerIndex = activeSlideIndex % len;
            if (len >= 2) rightIndex = (activeSlideIndex + 1) % len;
            if (len >= 3) leftIndex = (activeSlideIndex - 1 + len) % len;
          }

          const rects = targetElement.querySelectorAll('rect:not([fill="transparent"]):not(.bbox-anchor)');
          const leftRect = rects[0];
          const rightRect = rects[1];
          const centerRect = rects[2];
          const paths = targetElement.querySelectorAll('path');

          if (leftRect) leftRect.removeAttribute('display');
          if (rightRect) rightRect.removeAttribute('display');

          const slideStyle = targetElement.getAttribute('data-style');

          if (slideStyle === 'flat') {
            if (centerRect) {
              centerRect.setAttribute('x', '50');
              centerRect.setAttribute('y', '0');
              centerRect.setAttribute('width', '110');
              centerRect.setAttribute('height', '140');
              centerRect.setAttribute('style', 'transition: all 0.3s ease; box-shadow: 0 0 10px rgba(0,0,0,0.5);');
            }
            if (leftRect) {
              leftRect.setAttribute('x', '0');
              leftRect.setAttribute('y', '0');
              leftRect.setAttribute('width', '46');
              leftRect.setAttribute('height', '140');
              leftRect.setAttribute('stroke-width', '1');
              leftRect.setAttribute('style', 'opacity: 0.5; transition: all 0.3s ease;');
            }
            if (rightRect) {
              rightRect.setAttribute('x', '164');
              rightRect.setAttribute('y', '0');
              rightRect.setAttribute('width', '46');
              rightRect.setAttribute('height', '140');
              rightRect.setAttribute('stroke-width', '1');
              rightRect.setAttribute('style', 'opacity: 0.5; transition: all 0.3s ease;');
            }
          } else {
            // Default 3D Coverflow
            if (centerRect) {
              centerRect.setAttribute('x', '40');
              centerRect.setAttribute('y', '0');
              centerRect.setAttribute('width', '130');
              centerRect.setAttribute('height', '140');
              centerRect.setAttribute('style', 'transform: perspective(400px) rotateY(0deg); transform-origin: 50% 50%; transform-box: fill-box; transition: all 0.3s ease;');
            }
            if (leftRect) {
              leftRect.setAttribute('x', '0');
              leftRect.setAttribute('y', '8');
              leftRect.setAttribute('width', '80');
              leftRect.setAttribute('height', '124');
              leftRect.setAttribute('stroke-width', '1');
              leftRect.setAttribute('style', 'transform: perspective(400px) rotateY(25deg); transform-origin: 100% 50%; transform-box: fill-box; transition: all 0.3s ease;');
            }
            if (rightRect) {
              rightRect.setAttribute('x', '120');
              rightRect.setAttribute('y', '8');
              rightRect.setAttribute('width', '110');
              rightRect.setAttribute('height', '124');
              rightRect.setAttribute('stroke-width', '1');
              rightRect.setAttribute('style', 'transform: perspective(400px) rotateY(-22deg); transform-origin: 0% 50%; transform-box: fill-box; transition: all 0.3s ease;');
            }
          }
          
          // Forcefully hide any legacy static SVG arrows
          paths.forEach(p => p.setAttribute('display', 'none'));

          const applyImageToRect = (rectIndex, imageIndex, patternPrefix) => {
            const rect = rects[rectIndex];
            if (!rect) return;

            if (imageIndex === -1 || !newImages[imageIndex]) {
              if ((rectIndex === 2 || rectIndex === 5) && len === 0) {
                // If newly dropped with no images, preserve the placeholder pattern!
                rect.setAttribute('fill', `url(#slideshow-pattern-${uniqueId})`);
              } else {
                rect.setAttribute('fill', (rectIndex === 2 || rectIndex === 5) ? '#ffffff' : '#f3f4f6');
              }
              return;
            }

            const patternId = `slideshow-pattern-${patternPrefix}-${uniqueId}`;
            let pattern = defs.querySelector(`#${patternId}`);
            if (!pattern) {
              pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
              pattern.setAttribute('id', patternId);
              pattern.setAttribute('patternUnits', 'userSpaceOnUse');
              pattern.setAttribute('width', rect.getAttribute('width'));
              pattern.setAttribute('height', rect.getAttribute('height'));
              const imgNode = document.createElementNS('http://www.w3.org/2000/svg', 'image');
              imgNode.setAttribute('preserveAspectRatio', 'xMidYMid slice');
              imgNode.setAttribute('x', '0');
              imgNode.setAttribute('y', '0');
              imgNode.setAttribute('width', rect.getAttribute('width'));
              imgNode.setAttribute('height', rect.getAttribute('height'));
              pattern.appendChild(imgNode);
              const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              textGroup.setAttribute('class', 'overlay-text-group');
              pattern.appendChild(textGroup);
              
              defs.appendChild(pattern);
            }
            
            const pWidth = rect.getAttribute('width');
            const pHeight = rect.getAttribute('height');
            pattern.setAttribute('width', pWidth);
            pattern.setAttribute('height', pHeight);
            
            const imgNode = pattern.querySelector('image');
            if (imgNode) {
              imgNode.setAttribute('href', newImages[imageIndex]);
              imgNode.setAttribute('width', pWidth);
              imgNode.setAttribute('height', pHeight);
            }

            const textGroup = pattern.querySelector('.overlay-text-group');
            if (textGroup) {
              textGroup.innerHTML = '';
              const imgObj = slideshowImages[imageIndex];
              if (imgObj) {
                const fFam = imgObj.fontFamily || 'Arial';
                const fSize = imgObj.fontSize || 16;
                if (imgObj.heading) {
                  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  t.setAttribute('x', '50%');
                  t.setAttribute('y', '35%');
                  t.setAttribute('text-anchor', 'middle');
                  t.setAttribute('fill', 'white');
                  t.setAttribute('font-size', `${fSize}px`);
                  t.setAttribute('font-family', `'${fFam}', sans-serif`);
                  t.setAttribute('font-weight', 'bold');
                  t.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(0,0,0,0.8); pointer-events: none;');
                  t.textContent = imgObj.heading;
                  textGroup.appendChild(t);
                }
                if (imgObj.subtext) {
                  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  t.setAttribute('x', '50%');
                  t.setAttribute('y', '50%');
                  t.setAttribute('text-anchor', 'middle');
                  t.setAttribute('fill', 'white');
                  t.setAttribute('font-size', `${Math.max(8, fSize * 0.6)}px`);
                  t.setAttribute('font-family', `'${fFam}', sans-serif`);
                  t.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(0,0,0,0.8); pointer-events: none;');
                  t.textContent = imgObj.subtext;
                  textGroup.appendChild(t);
                }
              }
            }


            const imgObj = slideshowImages[imageIndex];
            if (imgObj) {
              const blurVal = imgObj.blur || 0;
              const brightnessVal = imgObj.brightness !== undefined ? imgObj.brightness : 100;
              const contrastVal = imgObj.contrast !== undefined ? imgObj.contrast : 100;
              
              let filterString = '';
              if (blurVal > 0) filterString += `blur(${blurVal}px) `;
              if (brightnessVal !== 100) filterString += `brightness(${brightnessVal}%) `;
              if (contrastVal !== 100) filterString += `contrast(${contrastVal}%)`;
              filterString = filterString.trim();

              if (filterString) {
                rect.style.filter = filterString;
              } else {
                rect.style.removeProperty('filter');
              }
            } else {
              rect.style.removeProperty('filter');
            }
            
            // Adjust pattern translation to match rect position so image doesn't tile weirdly
            pattern.setAttribute('patternTransform', `translate(${rect.getAttribute('x')}, ${rect.getAttribute('y')})`);
            rect.setAttribute('fill', `url(#${patternId})`);
          };

          applyImageToRect(0, leftIndex, 'left');
          applyImageToRect(1, rightIndex, 'right');
          applyImageToRect(2, centerIndex, 'center');
          
          if (slideStyle === 'flat') {
            for (let i = 0; i < 5; i++) {
              let tIdx = -1;
              if (len > 0) {
                 tIdx = (activeSlideIndex - 2 + i + len * 5) % len;
              }
              applyImageToRect(3 + i, tIdx, `thumb${i}`);
              
              const tRect = rects[3 + i];
              if (tRect) {
                if (i === 2) {
                   tRect.setAttribute('stroke', '#0ea5e9');
                   tRect.setAttribute('stroke-width', '2');
                } else {
                   tRect.setAttribute('stroke', '#9ca3af');
                   tRect.setAttribute('stroke-width', '1');
                }
              }
            }
          }
          
          // Apply opacity to the entire group (global opacity)
          const opacityVal = (opacity / 100).toString();
          targetElement.setAttribute('opacity', opacityVal);
          targetElement.style.opacity = opacityVal;
          
        } else {
          // Standard Single-Image Logic
          const targetImg = getSvgImageEl(targetElement) || targetElement;
          
          // ONLY touch the visual image properties (href, crop, opacity) if an animation isn't currently running.
          // The timer (performTransition) has exclusive control over these during active transitions.
        if (!isAnimatingRef.current) {
          if (slideshowImages[activeSlideIndex]) {
            const imgObj = slideshowImages[activeSlideIndex];
            const url = imgObj.url;
            if (targetImg.getAttribute('href') !== url || targetImg.src !== url) {
              targetImg.setAttribute('href', url);
              try { targetImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch (e) { }
              if (targetImg.tagName?.toLowerCase() === 'img') targetImg.src = url;
              if (setPreviewSrcRef.current) setPreviewSrcRef.current(url);
            }

            // Ensure the crop viewport correctly frames the image for transitions
            const cropStr = targetElement.getAttribute('data-crop-data');
            if (cropStr && cropStr !== 'null') {
              try {
                const crop = JSON.parse(cropStr);
                const origX = parseFloat(targetElement.getAttribute('data-crop-orig-x') || targetImg.getAttribute('data-crop-orig-x') || '0');
                const origY = parseFloat(targetElement.getAttribute('data-crop-orig-y') || targetImg.getAttribute('data-crop-orig-y') || '0');
                const origW = parseFloat(targetElement.getAttribute('data-crop-orig-w') || targetImg.getAttribute('data-crop-orig-w') || targetImg.getAttribute('width') || '100');
                const origH = parseFloat(targetElement.getAttribute('data-crop-orig-h') || targetImg.getAttribute('data-crop-orig-h') || targetImg.getAttribute('height') || '100');

                // Ensure bounding box anchor exists to prevent CSS clip-path percentage shifts
                const wrapper = targetImg.parentNode;
                if (wrapper && wrapper.tagName.toLowerCase() === 'g') {
                  let anchor = wrapper.querySelector('.bbox-anchor');
                  if (!anchor) {
                    anchor = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    anchor.setAttribute('class', 'bbox-anchor');
                    anchor.setAttribute('fill', 'none');
                    anchor.style.pointerEvents = 'none';
                    wrapper.insertBefore(anchor, wrapper.firstChild);
                  }
                  anchor.setAttribute('x', origX);
                  anchor.setAttribute('y', origY);
                  anchor.setAttribute('width', origW);
                  anchor.setAttribute('height', origH);
                }

                if (imgObj?.isOriginalCrop) {
                  targetImg.setAttribute('x', origX);
                  targetImg.setAttribute('y', origY);
                  targetImg.setAttribute('width', origW);
                  targetImg.setAttribute('height', origH);
                  targetImg.style.removeProperty('transform');
                } else {
                  const cropX = origX + (origW * (parseFloat(crop.left) / 100));
                  const cropY = origY + (origH * (parseFloat(crop.top) / 100));
                  const cropW = origW * (parseFloat(crop.width) / 100);
                  const cropH = origH * (parseFloat(crop.height) / 100);

                  targetImg.setAttribute('x', cropX);
                  targetImg.setAttribute('y', cropY);
                  targetImg.setAttribute('width', cropW);
                  targetImg.setAttribute('height', cropH);
                  targetImg.style.removeProperty('transform');
                }
              } catch (e) { console.error("Error applying crop to gallery image", e); }
            }
          }

          // Fit mode
          if (targetImg.tagName?.toLowerCase() === 'image') {
            const val = slideshowSettings.imageFitType === 'Fill All' ? 'xMidYMid slice' : 'xMidYMid meet';
            targetImg.setAttribute('preserveAspectRatio', val);
          } else if (targetImg.tagName?.toLowerCase() === 'img') {
            const val = slideshowSettings.imageFitType === 'Fill All' ? 'cover' : 'contain';
            targetImg.style.objectFit = val;
            targetImg.style.width = '100%';
            targetImg.style.height = '100%';
          }

          // Ensure container doesn't bleed
          if (targetElement !== targetImg) {
            if (targetElement.tagName?.toLowerCase() === 'svg') {
              targetElement.style.setProperty('overflow', 'hidden', 'important');
              targetElement.setAttribute('overflow', 'hidden');
            }
          } else if (targetElement.tagName?.toLowerCase() !== 'image' && targetElement.tagName?.toLowerCase() !== 'svg') {
            targetElement.style.setProperty('overflow', 'hidden', 'important');
          }

          // Apply Opacity
          const opacityVal = (opacity / 100).toString();
          
          let filterString = '';
          if (slideshowImages[activeSlideIndex]) {
            const imgObj = slideshowImages[activeSlideIndex];
            const blurVal = imgObj.blur || 0;
            const brightnessVal = imgObj.brightness !== undefined ? imgObj.brightness : 100;
            const contrastVal = imgObj.contrast !== undefined ? imgObj.contrast : 100;
            if (blurVal > 0) filterString += `blur(${blurVal}px) `;
            if (brightnessVal !== 100) filterString += `brightness(${brightnessVal}%) `;
            if (contrastVal !== 100) filterString += `contrast(${contrastVal}%)`;
            filterString = filterString.trim();

            if (targetElement.tagName?.toLowerCase() === 'svg' || targetElement.tagName?.toLowerCase() === 'g') {
              let textGroup = targetElement.querySelector('.single-overlay-text-group');
              if (!textGroup) {
                textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                textGroup.setAttribute('class', 'single-overlay-text-group');
                targetElement.appendChild(textGroup);
              }
              textGroup.innerHTML = '';
              const fFam = imgObj.fontFamily || 'Arial';
              const fSize = imgObj.fontSize || 16;
              if (imgObj.heading) {
                const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                t.setAttribute('x', '50%');
                t.setAttribute('y', '35%');
                t.setAttribute('text-anchor', 'middle');
                t.setAttribute('fill', 'white');
                t.setAttribute('font-size', `${fSize}px`);
                t.setAttribute('font-family', `'${fFam}', sans-serif`);
                t.setAttribute('font-weight', 'bold');
                t.setAttribute('style', 'text-shadow: 1px 1px 3px rgba(0,0,0,0.8); pointer-events: none;');
                t.textContent = imgObj.heading;
                textGroup.appendChild(t);
              }
              if (imgObj.subtext) {
                const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                t.setAttribute('x', '50%');
                t.setAttribute('y', '50%');
                t.setAttribute('text-anchor', 'middle');
                t.setAttribute('fill', 'white');
                t.setAttribute('font-size', `${Math.max(8, fSize * 0.6)}px`);
                t.setAttribute('font-family', `'${fFam}', sans-serif`);
                t.setAttribute('style', 'text-shadow: 1px 1px 3px rgba(0,0,0,0.8); pointer-events: none;');
                t.textContent = imgObj.subtext;
                textGroup.appendChild(t);
              }
            }
          }

          if (targetImg && targetImg !== targetElement) {
            targetElement.style.removeProperty('opacity');
            targetElement.removeAttribute('opacity');
            
            targetImg.setAttribute('opacity', opacityVal);
            targetImg.style.opacity = opacityVal; // Do NOT use !important as it breaks Fade transitions
            
            if (filterString) {
                targetImg.style.filter = filterString;
            } else {
                targetImg.style.removeProperty('filter');
            }
          } else {
            targetElement.setAttribute('opacity', opacityVal);
            targetElement.style.opacity = opacityVal;
            if (filterString) {
                targetElement.style.filter = filterString;
            } else {
                targetElement.style.removeProperty('filter');
            }
          }
        }
        } // End of Standard Single-Image Logic

        // No need to trigger a full React re-render of the SVG (shouldRefresh: true)
        // because the necessary attributes (data-slideshow, href, opacity) are directly mutated on the DOM node above.
        // Forcing a refresh here causes the DOM to be wiped and rebuilt from the parent's stale state,
        // which ruins any active CSS transitions and resets the slideshow to Image 1.
      } finally {
        if (isUpdatingDOMTimeoutRef.current) clearTimeout(isUpdatingDOMTimeoutRef.current);
        isUpdatingDOMTimeoutRef.current = setTimeout(() => {
          isUpdatingDOM.current = false;
          isUpdatingDOMTimeoutRef.current = null;
        }, 500);
      }
    };

    apply();
  }, [selectedElement?.id, JSON.stringify(slideshowSettings), JSON.stringify(slideshowImages.map(img => img.url)), activeSlideIndex, opacity, activePageIndex]);


  useEffect(() => {
    if (!selectedElement) return;
    const observer = new MutationObserver((mutations) => {
      if (isUpdatingDOM.current) return;
      const ignoredAttributes = ['data-is-hovering', 'data-hovered', 'data-child-hovered'];
      const relevantMutations = mutations.filter(m => m.type === 'attributes' && !ignoredAttributes.includes(m.attributeName));
      if (relevantMutations.length > 0) {
        syncStateFromDOM();
      }
    });
    observer.observe(selectedElement, { attributes: true });
    syncStateFromDOM(true);
    return () => {
      observer.disconnect();
      isUpdatingDOM.current = false;
    };
  }, [selectedElement, syncStateFromDOM]);

  // Master Update Effect
  useEffect(() => {
    if (!isSyncingRef.current && !isSyncing && selectedElement?.id && !isDisabling) {
      applyDesign();
    }
  }, [selectedElement?.id, JSON.stringify(slideshowSettings), JSON.stringify(slideshowImages.map(img => img.url)), activeSlideIndex, opacity, isSyncing, applyDesign]);

  // ── Live Editor Runner ──
  // IMPORTANT: SVG elements can't host HTML children, so we inject
  // an absolutely-positioned overlay div into the HTML page container
  // and position it over the target element using getBoundingClientRect.
  const liveRunnerIndexRef = useRef(activeSlideIndex);
  const liveRunnerImagesRef = useRef(slideshowImages);
  const liveRunnerAutoTimer = useRef(null);
  const liveRunnerOverlayRef = useRef(null);

  useEffect(() => { liveRunnerIndexRef.current = activeSlideIndex; }, [activeSlideIndex]);
  useEffect(() => { liveRunnerImagesRef.current = slideshowImages; }, [slideshowImages]);

  const performTransition = useCallback((newIdx, dir = 'next') => {
    if (isAnimatingRef.current) return;

    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    const targetElement = pageContainer?.querySelector(`[id="${selectedElement?.id}"]`) || selectedElement;
    if (!targetElement) return;

    // Dynamic 3-Frame Layout Bypasses CSS Transitions
    if (targetElement.getAttribute('data-type') === 'slideshow') {
      liveRunnerIndexRef.current = newIdx;
      setActiveSlideIndex(newIdx);
      
      const overlay = liveRunnerOverlayRef.current;
      if (overlay && overlay._updateDots) overlay._updateDots(newIdx);
      
      // Let applyDesign handle the DOM update directly
      isUpdatingDOM.current = true;
      setTimeout(() => {
        applyDesign();
      }, 50);
      return;
    }

    const imgEl = getSvgImageEl(targetElement) || targetElement;
    const images = liveRunnerImagesRef.current;
    const nextUrl = images[newIdx]?.url;
    if (!nextUrl || !imgEl) return;

    const effect = (transitionEffectRef.current || 'Linear').toLowerCase();
    const duration = 400;

    isAnimatingRef.current = true;
    setIsUpdatingDOM(true);
    liveRunnerIndexRef.current = newIdx; // Update early to prevent interval double-trigger

    const overlay = liveRunnerOverlayRef.current;
    if (overlay && overlay._updateDots) {
      overlay._updateDots(newIdx);
    }

    const finalize = () => {
      targetElement.setAttribute('data-active-index', newIdx.toString());
      liveRunnerIndexRef.current = newIdx; // Crucial for auto-slide interval
      setActiveSlideIndex(newIdx);

      // Sync overlay if exists
      const currentOverlay = liveRunnerOverlayRef.current;
      if (currentOverlay) {
        if (currentOverlay._updateDots) {
          currentOverlay._updateDots(newIdx);
        }
        currentOverlay.querySelectorAll('.editor-ss-dot').forEach((d, i) => {
          d.style.opacity = i === newIdx ? '1' : '0.4';
          const activeScale = d.getAttribute('data-active-scale') || 'scale(1.4)';
          const inactiveScale = d.getAttribute('data-inactive-scale') || 'scale(1)';
          d.style.transform = i === newIdx ? activeScale : inactiveScale;
        });
      }

      setTimeout(() => {
        isAnimatingRef.current = false;
        setIsUpdatingDOM(false);
      }, 50);
    };

    const setElSrc = (url, imgObj) => {
      imgEl.setAttribute('href', url);
      try { imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch (e) { }
      if (imgEl.tagName?.toLowerCase() === 'img') imgEl.src = url;
      if (setPreviewSrcRef.current) setPreviewSrcRef.current(url);

      const cropStr = targetElement.getAttribute('data-crop-data');
      if (cropStr && cropStr !== 'null') {
        try {
          const crop = JSON.parse(cropStr);
          const origX = parseFloat(targetElement.getAttribute('data-crop-orig-x') || imgEl.getAttribute('data-crop-orig-x') || '0');
          const origY = parseFloat(targetElement.getAttribute('data-crop-orig-y') || imgEl.getAttribute('data-crop-orig-y') || '0');
          const origW = parseFloat(targetElement.getAttribute('data-crop-orig-w') || imgEl.getAttribute('data-crop-orig-w') || imgEl.getAttribute('width') || '100');
          const origH = parseFloat(targetElement.getAttribute('data-crop-orig-h') || imgEl.getAttribute('data-crop-orig-h') || imgEl.getAttribute('height') || '100');

          // Ensure bounding box anchor exists to prevent CSS clip-path percentage shifts
          const wrapper = imgEl.parentNode;
          if (wrapper && wrapper.tagName.toLowerCase() === 'g') {
            let anchor = wrapper.querySelector('.bbox-anchor');
            if (!anchor) {
              anchor = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              anchor.setAttribute('class', 'bbox-anchor');
              anchor.setAttribute('fill', 'none');
              anchor.style.pointerEvents = 'none';
              wrapper.insertBefore(anchor, wrapper.firstChild);
            }
            anchor.setAttribute('x', origX);
            anchor.setAttribute('y', origY);
            anchor.setAttribute('width', origW);
            anchor.setAttribute('height', origH);
          }

          if (imgObj?.isOriginalCrop) {
            imgEl.setAttribute('x', origX);
            imgEl.setAttribute('y', origY);
            imgEl.setAttribute('width', origW);
            imgEl.setAttribute('height', origH);
            imgEl.style.setProperty('transform', `translate(${crop.offX || 0}%, ${crop.offY || 0}%) scale(${crop.scale || 1})`, 'important');
          } else {
            const cropX = origX + (origW * (parseFloat(crop.left) / 100));
            const cropY = origY + (origH * (parseFloat(crop.top) / 100));
            const cropW = origW * (parseFloat(crop.width) / 100);
            const cropH = origH * (parseFloat(crop.height) / 100);

            imgEl.setAttribute('x', cropX);
            imgEl.setAttribute('y', cropY);
            imgEl.setAttribute('width', cropW);
            imgEl.setAttribute('height', cropH);
            imgEl.style.setProperty('transform', 'none', 'important');
          }
        } catch (e) { console.error("Error applying crop to gallery image", e); }
      }
    };

    const animEl = targetElement;
    const baseOpacity = (opacity / 100).toString();

    // Use independent CSS properties
    animEl.style.transformBox = 'fill-box';
    animEl.style.transformOrigin = 'center';

    // Create a temporary clone for seamless simultaneous transitions
    const clone = animEl.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.add('slideshow-transition-clone');
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    clone.style.pointerEvents = 'none';

    // Handle pattern duplication for simultaneous animation if the image is inside a pattern
    let newPattern = null;
    if (imgEl && imgEl.closest && imgEl.closest('pattern')) {
      const originalPattern = imgEl.closest('pattern');
      if (originalPattern && originalPattern.parentNode) {
        newPattern = originalPattern.cloneNode(true);
        const clonedPatternId = 'pattern-clone-' + Date.now() + Math.random().toString(36).substring(2, 7);
        newPattern.setAttribute('id', clonedPatternId);
        originalPattern.parentNode.appendChild(newPattern);

        const origId = originalPattern.getAttribute('id');
        const updateFillStroke = (el) => {
          ['fill', 'stroke'].forEach(attr => {
            const val = el.getAttribute(attr) || el.style?.[attr];
            if (val && val.includes(`#${origId}`)) {
              const newVal = val.replace(`#${origId}`, `#${clonedPatternId}`);
              if (el.hasAttribute(attr)) el.setAttribute(attr, newVal);
              if (el.style?.[attr]) el.style[attr] = newVal;
            }
          });
        };
        updateFillStroke(clone);
        clone.querySelectorAll('*').forEach(updateFillStroke);
      }
    }

    animEl.parentNode.insertBefore(clone, animEl);

    // Swap src on the original element immediately (it will act as the incoming element)
    setElSrc(nextUrl, images[newIdx]);

    // Calculate dimensions for translations using visual width
    let w = 100;
    try {
      const cropStr = animEl.getAttribute('data-crop-data');
      if (cropStr && cropStr !== 'null') {
        const origW = parseFloat(animEl.getAttribute('data-crop-orig-w') || animEl.getAttribute('width') || 100);
        const crop = JSON.parse(cropStr);
        w = origW * (parseFloat(crop.width) / 100);
      } else {
        w = animEl.getBBox().width;
      }
    } catch (e) {
      w = animEl.clientWidth || 100;
    }

    let cloneAnim, realAnim;

    if (effect === 'fade') {
      cloneAnim = clone.animate([{ opacity: baseOpacity }, { opacity: 0 }], { duration, fill: 'forwards' });
      realAnim = animEl.animate([{ opacity: 0 }, { opacity: baseOpacity }], { duration, easing: 'ease-in-out', fill: 'forwards' });
    } else if (effect === 'push') {
      const dx = dir === 'next' ? -w : w;
      cloneAnim = clone.animate([{ translate: '0px 0px' }, { translate: `${dx}px 0px` }], { duration, easing: 'ease-in-out', fill: 'forwards' });
      realAnim = animEl.animate([{ translate: `${-dx}px 0px` }, { translate: '0px 0px' }], { duration, easing: 'ease-in-out', fill: 'forwards' });
    } else if (effect === 'linear') {
      cloneAnim = clone.animate([{ opacity: baseOpacity }, { opacity: 0 }], { duration: 0, fill: 'forwards' });
      realAnim = animEl.animate([{ opacity: baseOpacity }, { opacity: baseOpacity }], { duration: 0, fill: 'forwards' });
    } else if (effect === 'slide') {
      const dx = dir === 'next' ? -w : w;
      cloneAnim = clone.animate([{ translate: '0px 0px' }, { translate: `${dx}px 0px` }], { duration, easing: 'ease-in-out', fill: 'forwards' });
      realAnim = animEl.animate([{ translate: `${-dx}px 0px` }, { translate: '0px 0px' }], { duration, easing: 'ease-in-out', fill: 'forwards' });
    } else if (effect === 'flip') {
      animEl.style.transformBox = 'fill-box';
      animEl.style.transformOrigin = 'center';
      cloneAnim = clone.animate([{ opacity: 0 }, { opacity: 0 }], { duration, fill: 'forwards' });
      realAnim = animEl.animate([
        { rotate: 'y 90deg', opacity: 0 },
        { rotate: 'y 0deg', opacity: baseOpacity }
      ], { duration, easing: 'ease-out', fill: 'forwards' });
    } else if (effect === 'reveal') {
      const startClip = dir === 'next' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
      cloneAnim = clone.animate([{ opacity: baseOpacity }, { opacity: 0 }], { duration, fill: 'forwards' });
      realAnim = animEl.animate([{ clipPath: startClip }, { clipPath: 'inset(0 0 0 0)' }], { duration, easing: 'ease-in-out', fill: 'forwards' });
    } else {
      cloneAnim = clone.animate([{ opacity: baseOpacity }, { opacity: 0 }], { duration: 0, fill: 'forwards' });
      realAnim = animEl.animate([{ opacity: baseOpacity }, { opacity: baseOpacity }], { duration: 0, fill: 'forwards' });
    }

    // Cleanup and finalize when animation finishes
    const cleanupAnim = () => {
      if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
      if (newPattern && newPattern.parentNode) newPattern.parentNode.removeChild(newPattern);

      // Additional failsafe for SVG filters in Safari
      if (animEl.style.filter === 'none') {
        animEl.style.removeProperty('filter');
      }
    };

    realAnim.onfinish = () => {
      cleanupAnim();
      realAnim.cancel();
      animEl.style.transformBox = '';
      animEl.style.transformOrigin = '';
      finalize();
    };

    // Fallback in case onfinish doesn't fire (especially for 0 duration)
    setTimeout(() => {
      cleanupAnim();
      animEl.style.transformBox = '';
      animEl.style.transformOrigin = '';
      finalize();
    }, duration + 20);

  }, [activePageIndex, selectedElement, opacity, setIsUpdatingDOM]);

  const runnerSettingsStr = JSON.stringify({
    navIconColor: slideshowSettings.navIconColor,
    navStyle: slideshowSettings.navStyle,
    showDots: slideshowSettings.showDots,
    dotStyle: slideshowSettings.dotStyle,
    showArrows: slideshowSettings.showArrows,
    showNav: slideshowSettings.showNav,
    dotColor: slideshowSettings.dotColor,
    autoSlide: slideshowSettings.autoSlide,
    autoPlay: slideshowSettings.autoPlay,
    speed: slideshowSettings.speed,
    infiniteLoop: slideshowSettings.infiniteLoop
  });

  useEffect(() => {
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    const getFreshTarget = () => {
      if (!pageContainer) return selectedElement;
      return pageContainer.querySelector(`[id="${selectedElement?.id}"]`) || selectedElement;
    };

    if (!pageContainer) return;

    // Aggressively clean up any baked-in artifacts from previous bugs
    const artifacts = pageContainer.querySelectorAll('.editor-ss-overlay, .ss-dots-container, .ss-nav-btn, .editor-ss-dots-wrap, .editor-ss-nav');
    if (artifacts.length > 0) {
      artifacts.forEach(el => el.remove());
      // Force an immediate save of the cleaned HTML so React doesn't restore the artifacts on next render
      if (onUpdateRef.current) {
        onUpdateRef.current({ shouldRefresh: true });
      }
    }

    const roots = [];
    const cleanup = () => {
      // Clear manual flag when overlay is removed
      const freshTarget = getFreshTarget();
      if (freshTarget) freshTarget._slideshowManual = false;

      roots.forEach(r => {
        setTimeout(() => {
          try { r.unmount(); } catch (e) { }
        }, 0);
      });
      roots.length = 0;
      if (liveRunnerAutoTimer.current) { clearInterval(liveRunnerAutoTimer.current); liveRunnerAutoTimer.current = null; }
      if (liveRunnerOverlayRef.current) { liveRunnerOverlayRef.current.remove(); liveRunnerOverlayRef.current = null; }
    };

    if (!selectedElement || slideshowImages.length < 2) {
      cleanup();
      return;
    }

    // Set manual flag so global runner skips this element while it has an active interactive overlay
    const initialTarget = getFreshTarget();
    if (initialTarget) initialTarget._slideshowManual = true;

    // Position overlay to match target element bounds.
    // The page container may have CSS scale transforms (zoom), so we must
    // divide by the scale to convert from screen pixels → local layout pixels.
    const positionOverlay = () => {
      const overlay = liveRunnerOverlayRef.current;
      const freshTarget = getFreshTarget();
      if (!overlay || !freshTarget || !pageContainer.parentElement) return;

      // Re-enforce manual flag in case the element was replaced/cloned during a stroke update
      // This prevents the global runner from spawning a duplicate overlay.
      if (!freshTarget._slideshowManual) {
        freshTarget._slideshowManual = true;

        // If the global runner already spawned an overlay in the split-second before we caught it, remove it
        if (freshTarget._globalSsOverlay) {
          if (freshTarget._globalSsOverlay._cleanupHover) freshTarget._globalSsOverlay._cleanupHover();
          freshTarget._globalSsOverlay.remove();
          delete freshTarget._globalSsOverlay;
        }
      }

      const containerRect = pageContainer.parentElement.getBoundingClientRect();
      
      // Use getVisualBBox to correctly size the overlay to the CROP box, not the original bounds
      let elRect = freshTarget.getBoundingClientRect();
      try {
        const visualBBox = getVisualBBox(freshTarget);
        if (visualBBox && visualBBox.width > 0) {
          const svg = freshTarget.ownerSVGElement;
          const matrix = freshTarget.getScreenCTM();
          if (matrix && svg) {
            const pt1 = svg.createSVGPoint();
            pt1.x = visualBBox.x; pt1.y = visualBBox.y;
            const pt2 = svg.createSVGPoint();
            pt2.x = visualBBox.x + visualBBox.width; pt2.y = visualBBox.y + visualBBox.height;
            const screenPt1 = pt1.matrixTransform(matrix);
            const screenPt2 = pt2.matrixTransform(matrix);
            elRect = {
              left: Math.min(screenPt1.x, screenPt2.x),
              top: Math.min(screenPt1.y, screenPt2.y),
              width: Math.abs(screenPt2.x - screenPt1.x),
              height: Math.abs(screenPt2.y - screenPt1.y)
            };
          }
        }
      } catch(e) {}

      // Compute actual CSS scale of the container
      const scaleX = containerRect.width / (pageContainer.offsetWidth || 1);
      const scaleY = containerRect.height / (pageContainer.offsetHeight || 1);

      // Offset in screen pixels → divide by scale → local layout pixels
      const localLeft = (elRect.left - containerRect.left) / scaleX;
      const localTop = (elRect.top - containerRect.top) / scaleY;
      const localWidth = elRect.width / scaleX;
      const localHeight = elRect.height / scaleY;

      overlay.style.left = localLeft + 'px';
      overlay.style.top = localTop + 'px';
      overlay.style.width = localWidth + 'px';
      overlay.style.height = localHeight + 'px';

      // Dynamic Scaling for Controls
      const baseWidth = 300; // Reference width for 1:1 scale
      const scaleFactor = Math.max(0.4, Math.min(1.8, localWidth / baseWidth));

      // Update Arrows
      overlay.querySelectorAll('.editor-ss-nav').forEach(btn => {
        const size = 48 * scaleFactor; // Significantly increased size
        btn.style.width = size + 'px';
        btn.style.height = size + 'px';
        const offset = 12 * scaleFactor; // Increased offset for breathing room
        if (btn.style.left) btn.style.left = offset + 'px';
        if (btn.style.right) btn.style.right = offset + 'px';

        const svg = btn.querySelector('svg');
        if (svg) {
          svg.style.width = (32 * scaleFactor) + 'px';
          svg.style.height = (32 * scaleFactor) + 'px';
          svg.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.2)) drop-shadow(0 2px 2px rgba(255,255,255,0.2))';
          svg.style.overflow = 'visible';
        }
      });

      // Update Dots
      const dotsWrap = overlay.querySelector('.editor-ss-dots-wrap');
      if (dotsWrap) {
        dotsWrap.style.bottom = (8 * scaleFactor) + 'px';
        dotsWrap.style.gap = (5 * scaleFactor) + 'px';
        dotsWrap.style.transform = `translateX(-50%) scale(${Math.max(0.6, scaleFactor)})`;
        dotsWrap.style.transformOrigin = 'bottom center';
      }
    };

    cleanup(); // remove any previous overlay

    // Create overlay div outside the SVG to avoid baking HTML into the SVG string
    const overlay = document.createElement('div');
    overlay.className = 'editor-ss-overlay';
    Object.assign(overlay.style, {
      position: 'absolute',
      pointerEvents: 'none', // children opt-in with pointerEvents: 'auto'
      zIndex: '9999',
      overflow: 'visible',
      transition: 'none', // Prevent lag during drag
    });
    const prevOverflow = pageContainer.style.overflow;
    pageContainer.style.overflow = 'visible';
    if (pageContainer.parentElement) {
      pageContainer.parentElement.appendChild(overlay);
    } else {
      pageContainer.appendChild(overlay);
    }
    liveRunnerOverlayRef.current = overlay;
    positionOverlay();

    // Use requestAnimationFrame for perfectly synchronous tracking during drag, scroll, and stroke updates
    // This eliminates 1-frame ghosting and desynchronization without relying on discrete events.
    let trackingRafId;
    const trackPosition = () => {
      positionOverlay();
      trackingRafId = requestAnimationFrame(trackPosition);
    };
    trackPosition();

    const { navIconColor = '#000000', navStyle: styleId = 1, showDots = true,
      showArrows = true, showNav = true, dotColor = '#000000',
      autoSlide = true, autoPlay = true, speed = 3, infiniteLoop = true } = slideshowSettings;
    const showNavArrows = showArrows !== false && showNav !== false;

    // Helper: switch to a slide index
    const switchTo = (newIdx, dir = 'next') => {
      performTransition(newIdx, dir);
    };

    const resetAutoTimer = () => {
      if (liveRunnerAutoTimer.current) clearInterval(liveRunnerAutoTimer.current);
      if (isHoveringRef.current) return;
      const { autoSlide = true, autoPlay = true, speed = 3 } = slideshowSettings;
      if (!autoSlide && !autoPlay) return;

      const intervalMs = (parseFloat(speed) || 3) * 1000;
      liveRunnerAutoTimer.current = setInterval(() => {
        if (isAnimatingRef.current) return;
        // Only skip if mouse is actively over a control button
        const isHoveringControls = liveRunnerOverlayRef.current?.querySelector('button:hover');
        if (isHoveringControls) return;

        const images = liveRunnerImagesRef.current;
        if (!images || images.length < 2) return;

        let next = liveRunnerIndexRef.current + 1;
        if (next >= images.length) { if (!slideshowSettings.infiniteLoop) return; next = 0; }
        switchTo(next, 'next');
      }, intervalMs);
    };
    resetAutoTimerRef.current = resetAutoTimer;

    const navButtons = [];

    // ── Nav Arrows ──
    if (showNavArrows) {
      ['prev', 'next'].forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'editor-ss-nav';
        Object.assign(btn.style, {
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          [type === 'prev' ? 'left' : 'right']: '6px',
          zIndex: '10',
          background: 'transparent',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 'none',
          padding: '0',
          pointerEvents: 'none',
          opacity: '0',
          transition: 'transform 0.15s, opacity 0.2s',
        });
        const iconKey = type === 'prev' ? 'left' : 'right';
        const root = createRoot(btn);

        const isGrad = navIconColor && navIconColor.toUpperCase().includes('GRADIENT');
        let stops = [];
        if (isGrad) {
          const regex = /(rgba?\([^)]+\)|#[a-fA-F0-9]+|[a-zA-Z]+)\s+(\d+%)/gi;
          let match;
          while ((match = regex.exec(navIconColor)) !== null) {
            stops.push({ color: match[1], offset: match[2] });
          }
        }
        const gradId = `nav-grad-${type}-${Math.random().toString(36).substring(2, 7)}`;

        root.render(
          <>
            {isGrad && stops.length > 0 && (
              <svg width="0" height="0" style={{ position: 'absolute' }}>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  {stops.map((s, i) => <stop key={i} offset={s.offset} stopColor={s.color} />)}
                </linearGradient>
                <style>{`.grad-icon-${gradId} svg path, .grad-icon-${gradId} svg circle, .grad-icon-${gradId} svg rect { fill: url(#${gradId}) !important; color: transparent !important; }`}</style>
              </svg>
            )}
            <div
              className={`${isGrad && stops.length > 0 ? `grad-icon-${gradId}` : ''} transition-all`}
            >
              {NavIconRenderer({ styleId, size: '36px', color: isGrad ? 'currentColor' : navIconColor })[iconKey]}
            </div>
          </>
        );
        roots.push(root);
        btn.addEventListener('mouseenter', () => {
          if (leaveTimeout) clearTimeout(leaveTimeout);
          isHoveringRef.current = true;
          if (liveRunnerAutoTimer.current) clearInterval(liveRunnerAutoTimer.current);
        });
        btn.addEventListener('mouseleave', () => {
          handleContainerLeave();
        });
        btn.addEventListener('mousedown', e => { e.stopPropagation(); e.preventDefault(); });
        btn.addEventListener('click', (e) => {
          e.stopPropagation(); e.preventDefault();
          const images = liveRunnerImagesRef.current;
          const cur = liveRunnerIndexRef.current;
          let newIdx = type === 'prev' ? cur - 1 : cur + 1;
          if (newIdx < 0) newIdx = infiniteLoop ? images.length - 1 : 0;
          if (newIdx >= images.length) newIdx = infiniteLoop ? 0 : images.length - 1;
          switchTo(newIdx, type === 'prev' ? 'prev' : 'next');
          resetAutoTimer();
        });
        navButtons.push(btn);
        overlay.appendChild(btn);
      });
    }

    let leaveTimeout = null;
    const handleContainerEnter = () => {
      if (leaveTimeout) clearTimeout(leaveTimeout);
      isHoveringRef.current = true;
      if (liveRunnerAutoTimer.current) {
        clearInterval(liveRunnerAutoTimer.current);
        liveRunnerAutoTimer.current = null;
      }
      navButtons.forEach(btn => {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      });
    };

    const handleContainerLeave = () => {
      leaveTimeout = setTimeout(() => {
        isHoveringRef.current = false;
        resetAutoTimer();
        navButtons.forEach(btn => {
          btn.style.opacity = '0';
          btn.style.pointerEvents = 'none';
        });
      }, 50);
    };

    const handleMouseMove = (e) => {
      const target = getFreshTarget();
      if (!target) return;
      const rect = target.getBoundingClientRect();

      // Add a small padding (e.g., 20px) to the bounding box to make it easier to hover
      // and to cover buttons that might be slightly outside the exact element rect
      const isInside = e.clientX >= (rect.left - 20) && e.clientX <= (rect.right + 20) &&
        e.clientY >= (rect.top - 20) && e.clientY <= (rect.bottom + 20);

      if (isInside && !isHoveringRef.current) {
        handleContainerEnter();
      } else if (!isInside && isHoveringRef.current) {
        // Don't leave if mouse is directly over the overlay controls
        const overlay = liveRunnerOverlayRef.current;
        if (overlay && overlay.contains(e.target)) return;
        handleContainerLeave();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const containerTarget = getFreshTarget();

    overlay.style.pointerEvents = 'none'; // Allow clicking through to the SVG for dragging
    let dragStartX = 0, dragStartY = 0;

    const handleTargetMouseDown = (e) => {
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    };

    const handleTargetClick = (e) => {
      // Only advance if it was a click, not a drag
      const dx = Math.abs(e.clientX - dragStartX);
      const dy = Math.abs(e.clientY - dragStartY);
      if (dx > 5 || dy > 5) return;

      e.stopPropagation();
      const images = liveRunnerImagesRef.current;
      const cur = liveRunnerIndexRef.current;
      let next = cur + 1;
      if (next >= images.length) next = 0;
      switchTo(next, 'next');
    };

    if (containerTarget) {
      containerTarget.addEventListener('mousedown', handleTargetMouseDown);
      containerTarget.addEventListener('click', handleTargetClick);
    }

    // ── Pagination Dots ──
    if (showDots) {
      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'editor-ss-dots-wrap';
      Object.assign(dotsWrap.style, {
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '5px',
        alignItems: 'center',
        pointerEvents: 'auto',
      });
      dotsWrap.addEventListener('mouseenter', () => {
        if (leaveTimeout) clearTimeout(leaveTimeout);
        isHoveringRef.current = true;
        if (liveRunnerAutoTimer.current) clearInterval(liveRunnerAutoTimer.current);
      });
      dotsWrap.addEventListener('mouseleave', handleContainerLeave);

      const dotsRoot = createRoot(dotsWrap);
      roots.push(dotsRoot);

      const RenderCanvasDots = ({ currentIdx = liveRunnerIndexRef.current }) => {
        return (
          <DotRenderer
            styleId={slideshowSettings.dotStyle || 1}
            size="8px"
            color={dotColor || '#000000'}
            activeIndex={currentIdx}
            count={slideshowImages.length}
            onDotClick={(e, i) => {
              e.stopPropagation(); e.preventDefault();
              if (i === liveRunnerIndexRef.current) return;
              switchTo(i, i > liveRunnerIndexRef.current ? 'next' : 'prev');
              resetAutoTimer();
            }}
          />
        );
      };

      const updateDots = (newIdx = liveRunnerIndexRef.current) => {
        dotsRoot.render(<RenderCanvasDots currentIdx={newIdx} />);
      };

      overlay._updateDots = updateDots;
      updateDots(liveRunnerIndexRef.current);
      overlay.appendChild(dotsWrap);
    }

    // Keep overlay in sync if canvas resizes or element moves
    const resizeObserver = new ResizeObserver(positionOverlay);
    resizeObserver.observe(pageContainer);

    const mutationObserver = new MutationObserver(positionOverlay);
    if (pageContainer) {
      mutationObserver.observe(pageContainer, {
        attributes: true,
        subtree: true,
        attributeFilter: ['transform', 'x', 'y', 'width', 'height', 'style']
      });
    }

    window.addEventListener('resize', positionOverlay);

    if (containerTarget && containerTarget.matches(':hover')) {
      handleContainerEnter();
    } else {
      resetAutoTimer();
    }

    return () => {
      if (trackingRafId) cancelAnimationFrame(trackingRafId);
      cleanup();
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', positionOverlay);
      if (containerTarget) {
        containerTarget.removeEventListener('mousedown', handleTargetMouseDown);
        containerTarget.removeEventListener('click', handleTargetClick);
      }
      // Restore original overflow
      pageContainer.style.overflow = prevOverflow;
    };
  }, [selectedElement?.id, slideshowImages.length, runnerSettingsStr, activePageIndex]);


  const uploadFile = useCallback(async (file, replacingVideoId = null) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    const user = JSON.parse(storedUser);
    const formData = new FormData();
    formData.append('emailId', user.emailId);
    
    const effectiveVId = flipbookVId || location.state?.v_id || location.state?.flipbook_v_id;
    if (effectiveVId) formData.append('v_id', effectiveVId);

    const effectiveFolder = folderName || location.state?.folderName || 'My_Flipbooks';
    const effectiveBook = flipbookName || location.state?.flipbookName || 'Untitled Flipbook';

    formData.append('folderName', effectiveFolder);
    formData.append('flipbookName', effectiveBook);

    formData.append('type', 'image');
    formData.append('assetType', 'Image');
    formData.append('page_v_id', currentPageVId || 'global');

    if (replacingVideoId) {
      formData.append('replacing_file_v_id', replacingVideoId);
    }
    formData.append('file', file);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
      if (res.data.url) {
        return {
          url: resolveUploadsPath(res.data.url),
          file_v_id: res.data.file_v_id,
          name: res.data.filename
        };
      }
    } catch (err) {
      console.error("Slideshow image upload failed:", err);
    }
    return null;
  }, [flipbookVId, folderName, flipbookName, currentPageVId, location.state]);

  const handleFileUpload = useCallback(async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_GALLERY_IMAGES - slideshowImages.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    // 1. Create Optimistic State with Blob URLs
    const optimisticImages = filesToUpload.filter(file => file.type.startsWith('image/')).map((file, idx) => ({
      id: Date.now() + idx,
      url: URL.createObjectURL(file),
      name: file.name,
      isUploading: true,
      file_orig: file // Keep reference for upload
    }));

    if (optimisticImages.length === 0) return;

    setSlideshowImages(prev => [...prev, ...optimisticImages]);
    e.target.value = '';

    // 2. Upload in Background Concurrently and Update State
    await Promise.all(optimisticImages.map(async (img) => {
      const compressedFile = await compressImage(img.file_orig);
      const uploadedData = await uploadFile(compressedFile);

      setSlideshowImages(prev => prev.map(item => {
        if (item.id === img.id) {
          if (uploadedData) {
            return { ...item, url: uploadedData.url, file_v_id: uploadedData.file_v_id, name: uploadedData.name, isUploading: false };
          } else {
            return { ...item, isUploading: false };
          }
        }
        return item;
      }));
    }));
  }, [slideshowImages, uploadFile]);

  const handleReplaceFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || replaceTargetIndex === null) return;

    const targetImg = slideshowImages[replaceTargetIndex];
    if (!targetImg) return;

    // Optimistic update
    const optimisticUrl = URL.createObjectURL(file);
    setSlideshowImages(current => {
      const updated = [...current];
      if (updated[replaceTargetIndex]) {
        updated[replaceTargetIndex] = { ...updated[replaceTargetIndex], url: optimisticUrl, isUploading: true };
      }
      return updated;
    });

    e.target.value = '';

    // Upload
    const compressedFile = await compressImage(file);
    const uploadedData = await uploadFile(compressedFile, targetImg.file_v_id);

    // Final update
    setSlideshowImages(current =>
      current.map((img, idx) => {
        if (idx === replaceTargetIndex) {
          return uploadedData
            ? { ...img, url: uploadedData.url, file_v_id: uploadedData.file_v_id, name: uploadedData.name, isUploading: false }
            : { ...img, isUploading: false };
        }
        return img;
      })
    );
    setReplaceTargetIndex(null);
  }, [replaceTargetIndex, slideshowImages, uploadFile]);



  const handleModalReplace = async (file) => {
    if (!file || replaceTargetIndex === null) return;
    const targetImg = slideshowImages[replaceTargetIndex];
    if (!targetImg) return;

    const optimisticUrl = file.url || URL.createObjectURL(file);
    setSlideshowImages(current => {
      const updated = [...current];
      if (updated[replaceTargetIndex]) {
        updated[replaceTargetIndex] = { ...updated[replaceTargetIndex], url: optimisticUrl, isUploading: true };
      }
      return updated;
    });

    setShowReplaceModal(false);

    const compressedFile = await compressImage(file);
    const uploadedData = await uploadFile(compressedFile, targetImg.file_v_id);

    setSlideshowImages(current =>
      current.map((img, idx) => {
        if (idx === replaceTargetIndex) {
          return uploadedData
            ? { ...img, url: uploadedData.url, file_v_id: uploadedData.file_v_id, name: uploadedData.name, isUploading: false }
            : { ...img, isUploading: false };
        }
        return img;
      })
    );
    setReplaceTargetIndex(null);
  };


  const deleteImage = useCallback(async (index) => {
    const img = slideshowImages[index];
    if (!img) return;

    // Optimistic remove
    const updatedImages = slideshowImages.filter((_, idx) => idx !== index);
    setSlideshowImages(updatedImages);
    setOpenContextMenu(null);

    // Sync localStorage immediately
    if (selectedElement?.id) {
      const key = `slideshow_${flipbookVId || 'local'}_${selectedElement.id}`;
      try {
        if (updatedImages.length > 0) {
          localStorage.setItem(key, JSON.stringify(updatedImages));
        } else {
          localStorage.removeItem(key);
        }
      } catch (e) {}
    }

    // Backend delete
    if (img.file_v_id) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const effectiveFolder = folderName || location.state?.folderName || 'My_Flipbooks';
          const effectiveBook = flipbookName || location.state?.flipbookName || 'Untitled Flipbook';
          await axios.post(`${backendUrl}/api/flipbook/delete-asset`, {
            emailId: user.emailId,
            file_v_id: img.file_v_id,
            assetType: 'Image',
            folderName: effectiveFolder,
            bookName: effectiveBook
          });
        }
      } catch (error) {
        console.error("Failed to delete asset from backend:", error);
      }
    }
  }, [slideshowImages, folderName, flipbookName, location.state]);

  const handleGallerySelect = useCallback((img) => {
    if (!img) return;

    // Choose target index: priority to libraryTargetIndex if user clicked a specific slot
    const targetIdx = libraryTargetIndex !== null ? libraryTargetIndex : activeSlideIndex;

    setSlideshowImages(prev => {
      const updated = [...prev];
      const newImgObj = {
        id: Date.now(),
        url: img.url,
        name: img.name,
        file_v_id: img.file_v_id,
        isUploading: false
      };

      if (targetIdx < updated.length) {
        updated[targetIdx] = newImgObj;
      } else if (updated.length < MAX_GALLERY_IMAGES) {
        updated.push(newImgObj);
      }
      return updated;
    });

    if (targetIdx < MAX_GALLERY_IMAGES) {
      setActiveSlideIndex(targetIdx);
    }

    setLibraryTargetIndex(null);
    setOpenContextMenu(null);
    setShowGallery(false);

    // Immediate canvas update
    if (onUpdateRef.current) onUpdateRef.current({ shouldRefresh: true });
  }, [libraryTargetIndex, activeSlideIndex]);

  const updateSetting = (key, value) => {
    setSlideshowSettings(prev => ({ ...prev, [key]: value }));
  };
  const effects = ['Linear', 'Fade', 'Flip', 'Reveal'];

  const colorsOnPage = React.useMemo(() => {
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const elements = doc.querySelectorAll('[data-fill-color], [data-stroke-color]');
    const colors = new Set();
    elements.forEach(el => {
      const fill = el.getAttribute('data-fill-color');
      const stroke = el.getAttribute('data-stroke-color');
      if (fill && fill !== 'none' && fill !== '#' && !fill.includes('gradient')) colors.add(fill.toUpperCase());
      if (stroke && stroke !== 'none' && stroke !== '#' && !stroke.includes('gradient')) colors.add(stroke.toUpperCase());
    });
    colors.add('#FFFFFF');
    colors.add('#000000');
    return Array.from(colors).slice(0, 12);
  }, [activePageIndex]);

  return (
    <div className="space-y-[1vw]">
      <style>{`
        .ss-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
        .ss-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
        .ss-slider::-webkit-slider-runnable-track { height: 0.5vw; border-radius: 9999px; background: inherit; }
        .ss-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1.6vw; width: 1.6vw; border-radius: 50%; background: #4D47FF; border: 0.2vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.55vw; cursor: pointer; transition: box-shadow 0.15s ease; position: relative; z-index: 2; }
        .ss-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }

        .image-editor-toggle {
          appearance: none;
          width: 2.75vw;
          height: 1.35vw;
          border-radius: 1vw;
          position: relative;
          cursor: pointer;
          transition: 0.3s;
          background: #4D47FF;
        }
        .image-editor-toggle::before {
          content: "";
          position: absolute;
          width: 1.1vw;
          height: 1.1vw;
          border-radius: 50%;
          top: 50%;
          left: 1.5vw;
          transform: translateY(-50%);
          background: white;
          transition: 0.3s;
          box-shadow: 0 0.1vw 0.2vw rgba(0,0,0,0.2);
        }
      `}</style>
      {/* ── Slideshow header ── */}
      <div className="flex items-center gap-[0.5vw]">
        <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Slideshow Properties</span>
        <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.6vw' }}> </div>
      </div>

      {/* ── Slideshow Mode Toggle ── */}
      <div className="flex items-center justify-between py-[0.25vw]">
        <span className="text-[0.75vw] text-gray-800">Turn on to Image</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDisabling(true);
            onDisableSlideshow?.();
          }}
          className={`relative block w-[2.2vw] h-[1.2vw] rounded-[1vw] transition-all duration-200 ease-in-out shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.3)] outline-none shrink-0 cursor-pointer ${isDisabling ? 'bg-[#bbbbbb]' : 'bg-[#4A3AFF]'}`}
        >
          <div className={`absolute top-[0.1vw] w-[1vw] h-[1vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.4)] ${isDisabling ? 'left-[0.1vw]' : 'left-[1.1vw]'}`} />
        </button>
      </div>

      {/* ── Image Fix Type (Top Level) ── */}
      <div className="flex items-center justify-between relative z-20">
        <div className="flex items-center gap-[0.5vw] flex-1">
          <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Image fix type</span>
          <div className="h-[0px] flex-1 border-t border-dashed border-gray-300 mx-[0.25vw]" />
        </div>
        <div className="relative z-50">
          <button onClick={() => setShowFitDropdown(!showFitDropdown)} className="flex items-center justify-between gap-[0.5vw] w-[6.5vw] px-[0.75vw] py-[0.55vw] bg-white border border-gray-100 rounded-[0.4vw] hover:border-gray-200 shadow-sm transition-all text-[0.8vw] font-semibold text-gray-500 min-w-[5vw]">
            <span>{slideshowSettings.imageFitType === 'Fill All' ? 'Fill All' : 'Fit All'}</span>
            <ChevronDown size="0.9vw" className={`text-gray-500 transition-transform ${showFitDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showFitDropdown && (
            <>
              <div className="fixed inset-0 z-[90]" onClick={() => setShowFitDropdown(false)} />
              <div className="absolute right-0 top-full mt-[0.25vw] w-full min-w-[5vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-xl z-[100] py-[0.25vw] overflow-hidden">
                {[{ label: 'Fit All', val: 'Fit All' }, { label: 'Fill All', val: 'Fill All' }].map(type => (
                  <button key={type.val} onClick={() => { updateSetting('imageFitType', type.val); setShowFitDropdown(false); }} className="w-full text-left px-[0.75vw] py-[0.5vw] text-[0.7vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600">{type.label}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-7">

       

        {/* 1. Images Grid */}
        <div className="grid grid-cols-4 gap-[0.75vw] px-[0.05vw]">
          {Array.from({ length: Math.min(MAX_GALLERY_IMAGES, slideshowImages.length + 1) }).map((_, i) => (
            <div key={i} className="relative group/slot">
              <div
                className={`aspect-[1/1] w-full rounded-[0.4vw] cursor-pointer border-[0.1vw] transition-all duration-300 relative flex items-center justify-center group/card hover:scale-[0.2vw] hover:-translate-y-[0.2vw] hover:z-20 ${activeSlideIndex === i
                  ? 'border-gray-500 bg-gray-100 shadow-[0_0.65vw_1.25vw_-0.4vw_rgba(99,102,241,0.3)]'
                  : (slideshowImages[i] ? 'border-gray-200 hover:border-gray-400 hover:shadow-[0_0.75vw_1.5vw_-0.5vw_rgba(0,0,0,0.15)]' : 'border-gray-400 hover:border-indigo-400 shadow-sm')
                  } ${!slideshowImages[i] ? 'bg-gray-50/50 border-dashed' : 'bg-white shadow-sm'}`}
                onClick={() => {
                  if (activeSlideIndex === i) {
                    // Toggle fit mode when clicking already selected slide (exact OtherSetup.jsx effect)
                    const current = slideshowSettings.imageFitType || 'Fill All';
                    updateSetting('imageFitType', current === 'Fit All' ? 'Fill All' : 'Fit All');
                  } else {
                    performTransition(i, i > activeSlideIndex ? 'next' : 'prev');
                  }
                }}
              >
                {slideshowImages[i] ? (
                  <>
                    <img
                      src={slideshowImages[i].url}
                      className="w-full h-full rounded-[0.3vw] transition-all duration-300"
                      style={{
                        objectFit: (slideshowSettings.imageFitType || 'Fill All') === 'Fill All' ? 'cover' : 'contain',
                        opacity: localOpacity / 100
                      }}
                      alt=""
                    />
                    {slideshowImages[i].isUploading && (
                      <div className="absolute inset-0 bg-black/30 rounded-[0.3vw] flex items-center justify-center z-10">
                        <div className="w-[1.2vw] h-[1.2vw] border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                      const targetElement = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;
                      setActiveSlideIndex(i);
                      targetElement.setAttribute('data-active-index', i.toString());
                      fileInputRef.current?.click();
                    }}
                    className="flex flex-col items-center justify-center gap-[0.375vw] opacity-30 group-hover/card:opacity-70 transition-all duration-300 w-full h-full"
                  >
                    <Upload size="0.95vw" strokeWidth={1.5} className="text-gray-900" />
                    <span className="text-[0.6vw] font-semibold text-gray-900">Upload</span>
                  </div>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); setOpenContextMenu(openContextMenu === i ? null : i); }}
                  className={`absolute -top-[0.375vw] -right-[0.375vw] w-[1.75vw] h-[1.75vw] rounded-full bg-white shadow-[0_0.1vw_0.5vw_rgba(0,0,0,0.15)] border-[0.1vw] border-gray-200 flex items-center justify-center transition-all duration-200 z-30 ${openContextMenu === i ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover/card:opacity-100 group-hover/card:scale-100'
                    } hover:bg-gray-50 active:scale-125`}
                >
                  <MoreVertical size="0.7vw" className="text-gray-600" strokeWidth={2.5} />
                </button>
              </div>

              {openContextMenu === i && (
                <>
                  <div className="fixed inset-0 z-[105]" onClick={() => setOpenContextMenu(null)} />
                  <div className={`absolute top-[1.5vw] w-[9.5vw] z-[110] animate-in fade-in zoom-in-95 duration-150 ${(i % 4) >= 2 ? '-right-[0.375vw] origin-top-right' : 'left-[calc(100%-1.375vw)] origin-top-left'}`}>
                    <div className="bg-white rounded-[0.5vw] shadow-[0_0.3vw_1vw_rgba(0,0,0,0.15)] border border-gray-100 p-[0.75vw]">
                      <h3 className="text-[0.85vw] font-medium text-gray-700 truncate mb-[0.2vw]">Slide {i + 1}.jpg</h3>
                      <p className="text-[0.7vw] text-gray-400 mb-[0.75vw]">1920 X 1080 • 1256KB</p>
                      <div className="flex items-center gap-[0.4vw]">
                        <button 
                          onClick={() => { 
                            if (slideshowImages[i]) { 
                              setReplaceTargetIndex(i); 
                              setShowReplaceModal(true); 
                              setOpenContextMenu(null); 
                            } else { 
                              setActiveSlideIndex(i); 
                              fileInputRef.current?.click(); 
                              setOpenContextMenu(null); 
                            } 
                          }}
                          className="flex-1 px-[0.3vw] py-[0.35vw] text-[0.7vw] font-medium text-gray-600 bg-[#f9fafb] border border-gray-200 rounded-[0.3vw] hover:bg-gray-100 transition-colors"
                        >
                          {slideshowImages[i] ? 'Replace Image' : 'Add Image'}
                        </button>
                        <button 
                          onClick={() => deleteImage(i)}
                          className="w-[1.9vw] h-[1.9vw] flex items-center justify-center bg-[#f9fafb] border border-gray-200 rounded-[0.3vw] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors text-gray-400 shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*" className="hidden" />
        <input type="file" ref={replaceInputRef} onChange={handleReplaceFileChange} accept="image/*" className="hidden" />

         {/* 2. Info Row */}
        <div className="flex items-center gap-[0.4vw] px-[0.25vw]">
          <div className="relative">
            <button
              className="w-[1vw] h-[1vw] rounded-full border border-gray-400 flex items-center justify-center text-gray-500 text-[0.6vw] font-semibold hover:bg-gray-100 transition-colors"
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              i
            </button>
            {showInfoTooltip && (
              <div className="absolute left-[1.5vw] top-0 bg-gray-800 text-white text-[0.65vw] px-[0.75vw] py-[0.4vw] rounded-[0.4vw] whitespace-nowrap z-50 shadow-lg">
                You can add up to 4 images in Gallery
              </div>
            )}
          </div>
          <span className="text-[0.6vw] text-gray-400 italic">You can add up to 4 images in Gallery</span><span className="text-[0.95vw] text-red-500 "> *</span>
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-[1vw] py-[0.5vw] mt-[0.5vw]">
          <span className="text-[0.85vw] font-semibold text-black whitespace-nowrap">Opacity :</span>
          <div className="flex-1 flex items-center h-[1.5vw] rounded-full outline-none">
            <input
              type="range"
              min="0"
              max="100"
              value={localOpacity}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLocalOpacity(val);
                if (selectedElement) {
                  const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                  const targetElement = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;
                  if (targetElement) {
                    targetElement.setAttribute('opacity', (val / 100).toString());
                    targetElement.style.opacity = (val / 100).toString();

                    const imgEl = getSvgImageEl(targetElement);
                    if (imgEl && imgEl !== targetElement) {
                      imgEl.setAttribute('opacity', (val / 100).toString());
                      imgEl.style.setProperty('opacity', (val / 100).toString(), 'important');
                    }
                  }
                }
              }}
              onMouseUp={(e) => onUpdateOpacity(Number(e.target.value))}
              onTouchEnd={(e) => onUpdateOpacity(Number(e.target.value))}
              className="w-full cursor-pointer custom-range-slider"
              style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${localOpacity}%, #E2E8F0 ${localOpacity}%, #E2E8F0 100%)` }}
            />
          </div>
          <div className="min-w-[3.5vw] h-[2vw] border-[0.1vw] border-gray-200 rounded-[0.3vw] flex items-center justify-center text-[0.8vw] font-medium text-black bg-white shadow-sm px-[0.5vw]">
            {localOpacity} %
          </div>
        </div>

        {/* Contrast */}
        <div className="flex items-center gap-[1vw] py-[0.5vw] mt-[0.5vw]">
          <span className="text-[0.85vw] font-semibold text-black whitespace-nowrap w-[3.5vw]">Contrast :</span>
          <div className="flex-1 flex items-center h-[1.5vw] rounded-full outline-none">
            <input
              type="range"
              min="0"
              max="200"
              value={localContrast}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLocalContrast(val);
                if (selectedElement) {
                  const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                  const targetElement = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;
                  if (targetElement) {
                    const blurVal = localBlur;
                    const brightnessVal = localBrightness;
                    let filterString = '';
                    if (blurVal > 0) filterString += `blur(${blurVal}px) `;
                    if (brightnessVal !== 100) filterString += `brightness(${brightnessVal}%) `;
                    if (val !== 100) filterString += `contrast(${val}%)`;
                    filterString = filterString.trim();

                    if (targetElement.getAttribute('data-type') === 'slideshow') {
                       const rects = targetElement.querySelectorAll('rect:not([fill="transparent"]):not(.bbox-anchor)');
                       const centerRect = rects[2]; // active frame
                       if (centerRect) {
                           if (filterString) centerRect.style.filter = filterString;
                           else centerRect.style.removeProperty('filter');
                       }
                    } else {
                       const imgEl = getSvgImageEl(targetElement);
                       const elToFilter = (imgEl && imgEl !== targetElement) ? imgEl : targetElement;
                       if (filterString) {
                           elToFilter.style.filter = filterString;
                       } else {
                           elToFilter.style.removeProperty('filter');
                       }
                    }
                  }
                }
              }}
              onMouseUp={(e) => updateImageSetting('contrast', Number(e.target.value))}
              onTouchEnd={(e) => updateImageSetting('contrast', Number(e.target.value))}
              className="w-full cursor-pointer custom-range-slider"
              style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${(localContrast / 2)}%, #E2E8F0 ${(localContrast / 2)}%, #E2E8F0 100%)` }}
            />
          </div>
          <div className="min-w-[3.5vw] h-[2vw] border-[0.1vw] border-gray-200 rounded-[0.3vw] flex items-center justify-center text-[0.8vw] font-medium text-black bg-white shadow-sm px-[0.5vw]">
            {localContrast} %
          </div>
        </div>

        {/* Brightness */}
        <div className="flex items-center gap-[1vw] py-[0.5vw] mt-[0.5vw]">
          <span className="text-[0.85vw] font-semibold text-black whitespace-nowrap w-[4vw]">Brightness :</span>
          <div className="flex-1 flex items-center h-[1.5vw] rounded-full outline-none">
            <input
              type="range"
              min="0"
              max="200"
              value={localBrightness}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLocalBrightness(val);
                if (selectedElement) {
                  const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                  const targetElement = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;
                  if (targetElement) {
                    const blurVal = localBlur;
                    const contrastVal = localContrast; 
                    let filterString = '';
                    if (blurVal > 0) filterString += `blur(${blurVal}px) `;
                    if (val !== 100) filterString += `brightness(${val}%) `;
                    if (contrastVal !== 100) filterString += `contrast(${contrastVal}%)`;
                    filterString = filterString.trim();

                    if (targetElement.getAttribute('data-type') === 'slideshow') {
                       const rects = targetElement.querySelectorAll('rect:not([fill="transparent"]):not(.bbox-anchor)');
                       const centerRect = rects[2]; // active frame
                       if (centerRect) {
                           if (filterString) centerRect.style.filter = filterString;
                           else centerRect.style.removeProperty('filter');
                       }
                    } else {
                       const imgEl = getSvgImageEl(targetElement);
                       const elToFilter = (imgEl && imgEl !== targetElement) ? imgEl : targetElement;
                       if (filterString) {
                           elToFilter.style.filter = filterString;
                       } else {
                           elToFilter.style.removeProperty('filter');
                       }
                    }
                  }
                }
              }}
              onMouseUp={(e) => updateImageSetting('brightness', Number(e.target.value))}
              onTouchEnd={(e) => updateImageSetting('brightness', Number(e.target.value))}
              className="w-full cursor-pointer custom-range-slider"
              style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${(localBrightness / 2)}%, #E2E8F0 ${(localBrightness / 2)}%, #E2E8F0 100%)` }}
            />
          </div>
          <div className="min-w-[3.5vw] h-[2vw] border-[0.1vw] border-gray-200 rounded-[0.3vw] flex items-center justify-center text-[0.8vw] font-medium text-black bg-white shadow-sm px-[0.5vw]">
            {localBrightness} %
          </div>
        </div>

        {/* Blur */}
        <div className="flex items-center gap-[1vw] py-[0.5vw] mt-[0.5vw]">
          <span className="text-[0.85vw] font-semibold text-black whitespace-nowrap w-[3.5vw]">Blur :</span>
          <div className="flex-1 flex items-center h-[1.5vw] rounded-full outline-none">
            <input
              type="range"
              min="0"
              max="20"
              value={localBlur}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLocalBlur(val);
                if (selectedElement) {
                  const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                  const targetElement = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;
                  if (targetElement) {
                    const brightnessVal = localBrightness;
                    const contrastVal = localContrast;
                    let filterString = '';
                    if (val > 0) filterString += `blur(${val}px) `;
                    if (brightnessVal !== 100) filterString += `brightness(${brightnessVal}%) `;
                    if (contrastVal !== 100) filterString += `contrast(${contrastVal}%)`;
                    filterString = filterString.trim();

                    if (targetElement.getAttribute('data-type') === 'slideshow') {
                       const rects = targetElement.querySelectorAll('rect:not([fill="transparent"]):not(.bbox-anchor)');
                       const centerRect = rects[2]; // active frame
                       if (centerRect) {
                           if (filterString) centerRect.style.filter = filterString;
                           else centerRect.style.removeProperty('filter');
                       }
                    } else {
                       const imgEl = getSvgImageEl(targetElement);
                       const elToFilter = (imgEl && imgEl !== targetElement) ? imgEl : targetElement;
                       if (filterString) {
                           elToFilter.style.filter = filterString;
                       } else {
                           elToFilter.style.removeProperty('filter');
                       }
                    }
                  }
                }
              }}
              onMouseUp={(e) => updateImageSetting('blur', Number(e.target.value))}
              onTouchEnd={(e) => updateImageSetting('blur', Number(e.target.value))}
              className="w-full cursor-pointer custom-range-slider"
              style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${(localBlur / 20) * 100}%, #E2E8F0 ${(localBlur / 20) * 100}%, #E2E8F0 100%)` }}
            />
          </div>
          <div className="min-w-[3.5vw] h-[2vw] border-[0.1vw] border-gray-200 rounded-[0.3vw] flex items-center justify-center text-[0.8vw] font-medium text-black bg-white shadow-sm px-[0.5vw]">
            {localBlur} px
          </div>
        </div>

        {/* Text Overlay Settings */}
        {slideshowImages[activeSlideIndex] && (
          <div className="flex flex-col gap-[0.5vw] py-[0.5vw] mt-[1vw] border-t border-gray-200 pt-[1vw]">
            <span className="text-[0.85vw] font-semibold text-black">Image Text Overlay</span>
            <div className="flex flex-col gap-[0.3vw]">
              <span className="text-[0.7vw] text-gray-500">Heading</span>
              <input
                type="text"
                value={localHeading}
                onChange={(e) => {
                  setLocalHeading(e.target.value);
                  updateImageSetting('heading', e.target.value);
                }}
                className="w-full h-[2vw] rounded-[0.3vw] border border-gray-300 px-[0.5vw] text-[0.8vw] outline-none focus:border-blue-500"
                placeholder="Enter heading..."
              />
            </div>
            <div className="flex flex-col gap-[0.3vw]">
              <span className="text-[0.7vw] text-gray-500">Subtext</span>
              <input
                type="text"
                value={localSubtext}
                onChange={(e) => {
                  setLocalSubtext(e.target.value);
                  updateImageSetting('subtext', e.target.value);
                }}
                className="w-full h-[2vw] rounded-[0.3vw] border border-gray-300 px-[0.5vw] text-[0.8vw] outline-none focus:border-blue-500"
                placeholder="Enter subtext..."
              />
            </div>
            
            <div className="flex gap-[0.5vw] mt-[0.3vw]">
              <div className="flex-1 flex flex-col gap-[0.3vw]">
                <span className="text-[0.7vw] text-gray-500">Font</span>
                <div className="border border-gray-300 rounded-[0.3vw] bg-white overflow-hidden h-[2vw] flex items-center hover:border-blue-500 focus-within:border-blue-500 transition-colors">
                  <select 
                    value={localFontFamily} 
                    onChange={(e) => {
                      setLocalFontFamily(e.target.value);
                      updateImageSetting('fontFamily', e.target.value);
                      
                      const styleTag = document.getElementById('template-styles');
                      if (styleTag) {
                        const currentCss = styleTag.innerHTML;
                        if (!currentCss.includes(`family=${e.target.value.replace(/ /g, '+')}&`)) {
                          styleTag.innerHTML = `@import url('https://fonts.googleapis.com/css2?family=${e.target.value.replace(/ /g, '+')}&display=swap');\n` + currentCss;
                        }
                      }
                    }}
                    className="w-full h-full px-[0.5vw] text-[0.75vw] text-gray-700 bg-transparent outline-none cursor-pointer appearance-none truncate"
                    style={{ background: 'url("data:image/svg+xml;utf8,<svg fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\' width=\'12\' height=\'12\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'></path></svg>") no-repeat right 0.5vw center' }}
                  >
                    {fontFamilies.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-[0.5] flex flex-col gap-[0.3vw]">
                <span className="text-[0.7vw] text-gray-500">Size</span>
                <div className="border border-gray-300 rounded-[0.3vw] bg-white overflow-hidden h-[2vw] flex items-center hover:border-blue-500 focus-within:border-blue-500 transition-colors">
                  <select 
                    value={localFontSize} 
                    onChange={(e) => {
                      setLocalFontSize(Number(e.target.value));
                      updateImageSetting('fontSize', Number(e.target.value));
                    }}
                    className="w-full h-full px-[0.5vw] text-[0.75vw] text-gray-700 bg-transparent outline-none cursor-pointer appearance-none"
                    style={{ background: 'url("data:image/svg+xml;utf8,<svg fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\' width=\'12\' height=\'12\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'></path></svg>") no-repeat right 0.5vw center' }}
                  >
                    {fontSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>


      {/* Popups & Pickers */}
      {showDotColorPicker && createPortal(
        <div id="slideshow-color-picker" className="fixed z-[9999]" style={{ top: '160px', right: '10.5vw' }}>
          <div className="relative">
            <div className="fixed inset-0" onClick={() => setShowDotColorPicker(false)} />
            <ColorPicker
              color={slideshowSettings.dotColor || '#000000'}
              onChange={(val) => updateSetting('dotColor', val)}
              opacity={slideshowSettings.dotOpacity ?? 100}
              onOpacityChange={(val) => updateSetting('dotOpacity', val)}
              onClose={() => setShowDotColorPicker(false)}
              className="relative z-[10000]"
              colorsOnPage={colorsOnPage}
            />
          </div>
        </div>,
        document.body
      )}

      {showNavColorPicker && createPortal(
        <div id="slideshow-nav-color-picker" className="fixed z-[9999]" style={{ top: '160px', right: '10.5vw' }}>
          <div className="relative">
            <div className="fixed inset-0" onClick={() => setShowNavColorPicker(false)} />
            <ColorPicker
              color={slideshowSettings.navIconColor || '#000000'}
              onChange={(val) => updateSetting('navIconColor', val)}
              opacity={slideshowSettings.navIconOpacity ?? 100}
              onOpacityChange={(val) => updateSetting('navIconOpacity', val)}
              onClose={() => setShowNavColorPicker(false)}
              className="relative z-[10000]"
              colorsOnPage={colorsOnPage}
            />
          </div>
        </div>,
        document.body
      )}

      {showNavStylesPopup && (
        <NavIconStylesPopup
          isOpen={true}
          onClose={() => setShowNavStylesPopup(false)}
          onSelect={(styleId) => {
            updateSetting('navStyle', styleId);
            setShowNavStylesPopup(false);
          }}
          currentStyle={slideshowSettings.navStyle}
          color={slideshowSettings.navIconColor}
          positionStyle={{ top: '70%', right: '15vw', transform: 'translateY(-50%)' }}
        />
      )}

      {showDotStylesPopup && (
        <DotStylesPopup
          isOpen={true}
          onClose={() => setShowDotStylesPopup(false)}
          onSelect={(styleId) => {
            updateSetting('dotStyle', styleId);
            setShowDotStylesPopup(false);
          }}
          currentStyle={slideshowSettings.dotStyle}
          positionStyle={{ top: '70%', right: '15vw', transform: 'translateY(-50%)' }}
        />
      )}


      {/* Media Modal for Gallery and Replace */}
      <ReplaceMediaModal
        show={showGallery || showReplaceModal}
        mediaType="image"
        onClose={() => {
          setShowGallery(false);
          setShowReplaceModal(false);
          setReplaceTargetIndex(null);
        }}
        onReplace={(file) => {
          if (showReplaceModal) {
            handleModalReplace(file);
          } else {
            handleGallerySelect({ url: URL.createObjectURL(file), file });
          }
        }}
      />
    </div>
  );
};

export default SlideshowEditor;
