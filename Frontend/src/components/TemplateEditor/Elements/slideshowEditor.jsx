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
  X,
  Plus,
  Minus,
  GripVertical,
  Edit3,
  Trash2
} from 'lucide-react';
import ReplaceMediaModal from '../ReplaceMediaModal';
import { Icon } from '@iconify/react';
import { getVisualBBox } from '../MainEditor';
import PremiumDropdown from '../../CustomizedEditor/PremiumDropdown';
import NavIconStylesPopup, { NavIconRenderer } from '../../CustomizedEditor/popups/NavIconStylesPopup';
import DotStylesPopup, { DotRenderer } from '../../CustomizedEditor/popups/DotStylesPopup';
import { saveToDB, getFromDB } from '../../../utils/dbUtils';
import ColorPicker from '../ColorPicker';

// Clean up any lingering debuggers from Vite HMR
['my-slideshow-debug', 'my-slideshow-debug2', 'my-slideshow-debug3'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.remove();
});

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

const processLocalImageFile = (file) => {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    if (typeof file === 'string') {
      if (file.startsWith('blob:')) {
        fetch(file)
          .then(res => {
            if (!res.ok) throw new Error('Blob fetch failed');
            return res.blob();
          })
          .then(blob => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target.result;
              const img = new Image();
              img.onload = () => {
                resolve({
                  id: Date.now() + Math.random(),
                  url: dataUrl,
                  name: 'Image.jpg',
                  dimensions: `${img.width} X ${img.height}`,
                  size: `${Math.max(1, Math.round(blob.size / 1024))}KB`,
                  isUploading: false
                });
              };
              img.onerror = () => {
                resolve({
                  id: Date.now() + Math.random(),
                  url: dataUrl,
                  name: 'Image.jpg',
                  dimensions: '1920 X 1080',
                  size: `${Math.max(1, Math.round(blob.size / 1024))}KB`,
                  isUploading: false
                });
              };
              img.src = dataUrl;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          })
          .catch(() => {
            // Dead or expired blob URL from a previous session
            resolve(null);
          });
        return;
      }
      return resolve({
        id: Date.now() + Math.random(),
        url: file,
        name: file.split('/').pop()?.split('?')[0] || 'Image.jpg',
        dimensions: '1920 X 1080',
        size: '24MB',
        isUploading: false
      });
    }
    const fileName = file.name || `Image_${Date.now()}.jpg`;
    const fileSizeFormatted = file.size
      ? (file.size >= 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(0)}MB`
          : `${Math.max(1, Math.round(file.size / 1024))}KB`)
      : '24MB';

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        resolve({
          id: Date.now() + Math.random(),
          url: dataUrl,
          name: fileName,
          heading: '',
          subtext: '',
          dimensions: `${img.width} X ${img.height}`,
          size: fileSizeFormatted,
          isUploading: false
        });
      };
      img.onerror = () => {
        resolve({
          id: Date.now() + Math.random(),
          url: dataUrl,
          name: fileName,
          heading: '',
          subtext: '',
          dimensions: '1920 X 1080',
          size: fileSizeFormatted,
          isUploading: false
        });
      };
      img.src = dataUrl;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
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
    dotColor: '#EC5137',
    dotOpacity: 100,
    dotStyle: 1,
    dotButtonSize: 100,
    navIconColor: '#EC5137',
    navIconOpacity: 100,
    navStyle: 1,
    navButtonSize: 100,
    autoSlide: true,
    bgColor: '#000000',
    bgOpacity: 100,
    strokeColor: '#000000',
    strokeOpacity: 100,
    strokeAlignment: 'Center',
    strokeWidth: 1,
    strokeLineStyle: 'Solid',
    strokeDashLength: 8,
    strokeDashGap: 4,
    strokeLineCorner: 'Rounded',
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
  const [editingTextIndex, setEditingTextIndex] = useState(null);

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

  const updateImageAtIndex = useCallback((index, key, value) => {
    setSlideshowImages(current => {
      const updated = [...current];
      if (updated[index]) {
        updated[index] = { ...updated[index], [key]: value };
      }
      return updated;
    });
    if (onUpdateRef.current) {
      if (onUpdateTimerRef.current) clearTimeout(onUpdateTimerRef.current);
      onUpdateTimerRef.current = setTimeout(() => {
        if (onUpdateRef.current) onUpdateRef.current({});
      }, 500);
    }
  }, []);

  // Automatically persist images locally to IndexedDB to prevent loss on unsaved refresh
  useEffect(() => {
    if (selectedElement?.id && slideshowImages.length > 0) {
      const dbKey = `slideshow_${flipbookVId || 'local'}_${selectedElement.id}`;
      saveToDB(dbKey, slideshowImages).catch((err) => {
        console.warn("IndexedDB slideshow save failed:", err);
      });
      try {
        const lightweight = slideshowImages.map(img => ({
          ...img,
          url: (img.url && img.url.length < 150000) ? img.url : ''
        }));
        localStorage.setItem(dbKey, JSON.stringify(lightweight));
      } catch (e) {}
    } else if (selectedElement?.id && slideshowImages.length === 0) {
      const dbKey = `slideshow_${flipbookVId || 'local'}_${selectedElement.id}`;
      saveToDB(dbKey, []).catch(() => {});
      localStorage.removeItem(dbKey);
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
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showStrokeColorPicker, setShowStrokeColorPicker] = useState(false);
  const [isAlignOpen, setIsAlignOpen] = useState(false);
  const [isCornerOpen, setIsCornerOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState(null);
  const [newReplaceImg, setNewReplaceImg] = useState(null);
  const replaceInputRef = useRef(null);

  const [isDisabling, setIsDisabling] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isSlideshowPropOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setIsSlideshowPropOpen = (val) => {
    if (onToggle) onToggle();
    else setInternalIsOpen(prev => (typeof val === 'boolean' ? val : !prev));
  };
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
  const applyDesignRef = useRef(null);

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
            // NEVER overwrite if actively uploading
            const hasOptimistic = prev.some(img => img.isUploading);
            if (hasOptimistic) return prev;

            let newImages = (savedData.images || []).slice(0, MAX_GALLERY_IMAGES);

            // Clean up and sanitize any dead blob URLs from prior sessions to avoid ERR_FILE_NOT_FOUND
            newImages = newImages.map(img => {
              if (img?.url && img.url.startsWith('blob:')) {
                return {
                  ...img,
                  url: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22400%22%20height%3D%22300%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20dy%3D%2210.5%22%20font-weight%3D%22500%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ESlide%20Image%3C%2Ftext%3E%3C%2Fsvg%3E"
                };
              }
              return img;
            });

            // Check IndexedDB / localStorage fallback if DOM savedData has no images or has sanitized placeholders
            const localKey = `slideshow_${flipbookVId || 'local'}_${targetElement.id}`;
            const needsDbCheck = !newImages || newImages.length === 0 || newImages.some(img => img.url?.startsWith('data:image/svg+xml'));
            if (needsDbCheck) {
              getFromDB(localKey).then(dbImages => {
                if (Array.isArray(dbImages) && dbImages.length > 0) {
                  const validDbImages = dbImages.filter(img => img?.url && !img.url.startsWith('blob:') && !img.url.startsWith('data:image/svg+xml'));
                  if (validDbImages.length > 0) {
                    setSlideshowImages(validDbImages);
                  }
                }
              }).catch(() => {});
              const localRaw = localStorage.getItem(localKey);
              if (localRaw) {
                try {
                  const localImages = JSON.parse(localRaw);
                  if (Array.isArray(localImages) && localImages.length > 0) {
                    const validLocal = localImages.filter(img => img?.url && !img.url.startsWith('blob:') && !img.url.startsWith('data:image/svg+xml'));
                    if (validLocal.length > 0) {
                      newImages = validLocal.slice(0, MAX_GALLERY_IMAGES);
                    }
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
          const hasOptimistic = prev.some(img => img.isUploading);
          if (hasOptimistic) return prev;
          if (prev.length > 0 && !force) return prev;
          if (currentSrc && !currentSrc.includes('placehold.co') && !currentSrc.startsWith('blob:')) {
            return [{ id: Date.now(), url: currentSrc, name: 'Main Image', isOriginalCrop: true }];
          }
          const is3Frame = targetElement.getAttribute('data-type') === 'slideshow' ||
                           targetElement.getAttribute('data-is-slideshow') === 'true' ||
                           targetElement.querySelectorAll('rect:not([fill="transparent"]):not(.bbox-anchor)').length >= 3;
          if (is3Frame) {
            return [
              { id: 1, url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80', name: 'Slide 1', heading: '', subtext: '' },
              { id: 2, url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80', name: 'Slide 2', heading: '', subtext: '' },
              { id: 3, url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80', name: 'Slide 3', heading: '', subtext: '' }
            ];
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

  const applyDesign = useCallback((overrideIndex = null) => {
    if (!selectedElement?.id || isDisabling) return;

    const apply = () => {
      const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      const targetElement = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;
      if (!targetElement) return;

      const effectiveIndex = (overrideIndex !== null && overrideIndex !== undefined) ? overrideIndex : activeSlideIndex;

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

        targetElement.setAttribute('data-active-index', effectiveIndex.toString());

        const is3Frame = targetElement.getAttribute('data-type') === 'slideshow' || targetElement.querySelectorAll('rect:not([fill="transparent"]):not(.bbox-anchor)').length >= 3;

        // Dynamic 3-Frame Carousel Layout Logic
        if (is3Frame) {
          const uniqueId = targetElement.id.replace('slideshow-', '') || Date.now();
          const curImages = (slideshowImages && slideshowImages.length > 0)
            ? slideshowImages
            : (liveRunnerImagesRef.current || []);
          const newImages = curImages.map(i => (typeof i === 'string' ? i : i?.url)).filter(Boolean);
          
          let defs = targetElement.querySelector('defs');
          if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            targetElement.insertBefore(defs, targetElement.firstChild);
          }

          const len = newImages.length;
          let leftIndex = -1, centerIndex = -1, rightIndex = -1;
          
          if (len > 0) {
            centerIndex = effectiveIndex % len;
            if (len >= 2) rightIndex = (effectiveIndex + 1) % len;
            if (len >= 3) leftIndex = (effectiveIndex - 1 + len) % len;
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

          let bboxAnchor = targetElement.querySelector('.bbox-anchor');
          if (!bboxAnchor) {
            bboxAnchor = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bboxAnchor.setAttribute('class', 'bbox-anchor');
            bboxAnchor.setAttribute('fill', 'transparent');
            targetElement.appendChild(bboxAnchor);
          }
          bboxAnchor.setAttribute('x', '0');
          bboxAnchor.setAttribute('y', '0');
          bboxAnchor.setAttribute('width', slideStyle === 'flat' ? '210' : '215');
          bboxAnchor.setAttribute('height', slideStyle === 'flat' ? '190' : '140');

          // Apply Stroke & Background properties to frames
          const sColor = slideshowSettings.strokeColor || '#9ca3af';
          const sWidth = slideshowSettings.strokeWidth !== undefined ? slideshowSettings.strokeWidth : 1;
          const sOpacity = (slideshowSettings.strokeOpacity !== undefined ? slideshowSettings.strokeOpacity : 100) / 100;
          let sDash = 'none';
          if (slideshowSettings.strokeLineStyle === 'Dotted') {
            sDash = '2,3';
          } else if (slideshowSettings.strokeLineStyle === 'Dashed') {
            sDash = `${slideshowSettings.strokeDashLength || 8},${slideshowSettings.strokeDashGap || 4}`;
          }
          const sCap = slideshowSettings.strokeLineCorner === 'Rounded' ? 'round' : 'square';
          const sJoin = slideshowSettings.strokeLineCorner === 'Rounded' ? 'round' : 'miter';

          [centerRect, leftRect, rightRect].forEach(r => {
            if (r) {
              r.setAttribute('stroke', sColor);
              r.setAttribute('stroke-width', sWidth.toString());
              r.setAttribute('stroke-opacity', sOpacity.toString());
              if (sDash !== 'none') r.setAttribute('stroke-dasharray', sDash);
              else r.removeAttribute('stroke-dasharray');
              r.setAttribute('stroke-linecap', sCap);
              r.setAttribute('stroke-linejoin', sJoin);
            }
          });
          
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
            pattern.setAttribute('viewBox', `0 0 ${pWidth} ${pHeight}`);
            
            const imgNode = pattern.querySelector('image');
            if (imgNode) {
              const safeImgSrc = (newImages[imageIndex] && !newImages[imageIndex].startsWith('blob:'))
                ? newImages[imageIndex]
                : "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22400%22%20height%3D%22300%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20dy%3D%2210.5%22%20font-weight%3D%22500%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ESlide%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
              imgNode.setAttribute('href', safeImgSrc);
              try { imgNode.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', safeImgSrc); } catch (e) {}
              imgNode.setAttribute('width', pWidth);
              imgNode.setAttribute('height', pHeight);
            }

            const textGroup = pattern.querySelector('.overlay-text-group');
            if (textGroup) {
              textGroup.innerHTML = '';
              const imgObj = slideshowImages[imageIndex];
              if (imgObj && patternPrefix === 'center') {
                const fFam = imgObj.fontFamily || 'Arial';
                const fSize = imgObj.fontSize || 16;
                const pW = parseFloat(pWidth) || 130;
                const pH = parseFloat(pHeight) || 140;
                const centerX = pW / 2;
                const centerY = pH / 2;
                const hasHeading = Boolean(imgObj.heading);
                const hasSubtext = Boolean(imgObj.subtext);

                if (hasHeading) {
                  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  t.setAttribute('x', centerX.toString());
                  t.setAttribute('y', (hasSubtext ? centerY - 10 : centerY).toString());
                  t.setAttribute('text-anchor', 'middle');
                  t.setAttribute('dominant-baseline', 'central');
                  t.setAttribute('fill', 'white');
                  t.setAttribute('font-size', `${fSize}px`);
                  t.setAttribute('font-family', `'${fFam}', sans-serif`);
                  t.setAttribute('font-weight', 'bold');
                  t.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(0,0,0,0.8); pointer-events: none;');
                  t.textContent = imgObj.heading;
                  textGroup.appendChild(t);
                }
                if (hasSubtext) {
                  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  t.setAttribute('x', centerX.toString());
                  t.setAttribute('y', (hasHeading ? centerY + 14 : centerY).toString());
                  t.setAttribute('text-anchor', 'middle');
                  t.setAttribute('dominant-baseline', 'central');
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
            rect.style.fill = `url(#${patternId})`;
          };

          applyImageToRect(0, leftIndex, 'left');
          applyImageToRect(1, rightIndex, 'right');
          applyImageToRect(2, centerIndex, 'center');

          // If the original placeholder pattern exists, also point its image to current center image so it NEVER renders "Slideshow" text
          const placeholderPattern = defs.querySelector(`#slideshow-pattern-${uniqueId}`);
          if (placeholderPattern && centerIndex >= 0 && newImages[centerIndex]) {
            const phImg = placeholderPattern.querySelector('image');
            if (phImg) {
              phImg.setAttribute('href', newImages[centerIndex]);
              try { phImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', newImages[centerIndex]); } catch (e) {}
            }
            const phText = placeholderPattern.querySelector('.overlay-text-group');
            if (phText) {
              phText.innerHTML = '';
            }
          }
          
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
              const hasHeading = Boolean(imgObj.heading);
              const hasSubtext = Boolean(imgObj.subtext);
              if (imgObj.heading) {
                const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                t.setAttribute('x', '50%');
                t.setAttribute('y', hasSubtext ? '46%' : '50%');
                t.setAttribute('text-anchor', 'middle');
                t.setAttribute('dominant-baseline', 'central');
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
                t.setAttribute('y', hasHeading ? '56%' : '50%');
                t.setAttribute('text-anchor', 'middle');
                t.setAttribute('dominant-baseline', 'central');
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
  }, [
    selectedElement?.id,
    JSON.stringify(slideshowSettings),
    JSON.stringify(slideshowImages.map(img => ({ url: img.url, heading: img.heading, subtext: img.subtext }))),
    activeSlideIndex,
    opacity,
    activePageIndex
  ]);

  useEffect(() => {
    applyDesignRef.current = applyDesign;
  }, [applyDesign]);

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

  useEffect(() => {
    const handleIndexChanged = (e) => {
      if (e.detail?.id === selectedElement?.id && e.detail?.index !== undefined) {
        setActiveSlideIndex(e.detail.index);
        liveRunnerIndexRef.current = e.detail.index;
      }
    };
    window.addEventListener('slideshow-index-changed', handleIndexChanged);
    return () => window.removeEventListener('slideshow-index-changed', handleIndexChanged);
  }, [selectedElement?.id]);

  const performTransition = useCallback((newIdx, dir = 'next') => {
    if (isAnimatingRef.current) return;

    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    const targetElement = pageContainer?.querySelector(`[id="${selectedElement?.id}"]`) || selectedElement;
    if (!targetElement) return;

    // Dynamic 3-Frame Layout Bypasses CSS Transitions
    const is3Frame = targetElement.getAttribute('data-type') === 'slideshow' || targetElement.querySelectorAll('rect:not([fill="transparent"]):not(.bbox-anchor)').length >= 3;
    if (is3Frame) {
      liveRunnerIndexRef.current = newIdx;
      setActiveSlideIndex(newIdx);
      targetElement.setAttribute('data-active-index', newIdx.toString());
      
      const overlay = liveRunnerOverlayRef.current;
      if (overlay && overlay._updateDots) overlay._updateDots(newIdx);
      
      // Let applyDesign handle the DOM update directly
      isUpdatingDOM.current = true;
      (applyDesignRef.current || applyDesign)(newIdx);

      // Apply transition animation to 3-frame carousel frames based on selected effect
      const effect = (transitionEffectRef.current || slideshowSettings.transitionEffect || 'Linear').toLowerCase();
      const rects = targetElement.querySelectorAll('rect:not([fill="transparent"]):not(.bbox-anchor)');
      const centerRect = rects[2];
      if (centerRect && effect !== 'linear') {
        const duration = 380;
        if (effect === 'fade') {
          centerRect.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration, easing: 'ease-out' });
        } else if (effect === 'flip') {
          centerRect.style.transformBox = 'fill-box';
          centerRect.style.transformOrigin = '50% 50%';
          centerRect.animate([
            { transform: 'perspective(400px) rotateY(90deg)', opacity: 0.3 },
            { transform: 'perspective(400px) rotateY(0deg)', opacity: 1 }
          ], { duration, easing: 'ease-out' });
        } else if (effect === 'reveal') {
          const startClip = dir === 'next' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
          centerRect.animate([
            { clipPath: startClip },
            { clipPath: 'inset(0 0 0 0)' }
          ], { duration, easing: 'ease-in-out' });
        } else if (effect === 'slide' || effect === 'push') {
          const dx = dir === 'next' ? 40 : -40;
          centerRect.animate([
            { translate: `${dx}px 0px`, opacity: 0.4 },
            { translate: '0px 0px', opacity: 1 }
          ], { duration, easing: 'ease-out' });
        }
      }
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
    overlay._targetId = initialTarget?.id || selectedElement?.id;
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
      if (liveRunnerAutoTimer.current) {
        clearInterval(liveRunnerAutoTimer.current);
        liveRunnerAutoTimer.current = null;
      }
      // Auto Slide Mode does not run in Template Editor (only works in PreviewArea)
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
          const images = (liveRunnerImagesRef.current && liveRunnerImagesRef.current.length > 0)
            ? liveRunnerImagesRef.current
            : slideshowImages;
          if (!images || images.length === 0) return;
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
        const totalCount = (slideshowImages && slideshowImages.length > 0)
          ? slideshowImages.length
          : (liveRunnerImagesRef.current?.length || 0);
        return (
          <DotRenderer
            styleId={slideshowSettings.dotStyle || 1}
            size="8px"
            color={dotColor || '#000000'}
            activeIndex={currentIdx}
            count={totalCount}
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


  const uploadFile = useCallback(async (file) => {
    return await processLocalImageFile(file);
  }, []);

  const handleFileUpload = useCallback(async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_GALLERY_IMAGES - slideshowImages.length;
    const filesToUpload = Array.from(files).filter(file => file.type.startsWith('image/')).slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

    const processed = await Promise.all(filesToUpload.map(processLocalImageFile));
    const valid = processed.filter(Boolean);

    if (valid.length > 0) {
      setSlideshowImages(prev => {
        const next = [...prev, ...valid];
        if (selectedElement?.id) {
          saveToDB(`slideshow_${flipbookVId || 'local'}_${selectedElement.id}`, next).catch(() => {});
        }
        return next;
      });
      if (onUpdateRef.current) onUpdateRef.current({ shouldRefresh: true });
    }
    e.target.value = '';
  }, [slideshowImages.length, selectedElement?.id, flipbookVId]);

  const handleReplaceFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || replaceTargetIndex === null) return;

    const localImg = await processLocalImageFile(file);
    if (localImg) {
      setSlideshowImages(current => {
        const updated = [...current];
        if (updated[replaceTargetIndex]) {
          updated[replaceTargetIndex] = { ...updated[replaceTargetIndex], ...localImg };
        }
        if (selectedElement?.id) {
          saveToDB(`slideshow_${flipbookVId || 'local'}_${selectedElement.id}`, updated).catch(() => {});
        }
        return updated;
      });
      if (onUpdateRef.current) onUpdateRef.current({ shouldRefresh: true });
    }
    e.target.value = '';
    setReplaceTargetIndex(null);
  }, [replaceTargetIndex, selectedElement?.id, flipbookVId]);

  const handleModalReplace = async (file) => {
    if (!file || replaceTargetIndex === null) return;
    const localImg = await processLocalImageFile(file);
    if (localImg) {
      setSlideshowImages(current => {
        const updated = [...current];
        if (updated[replaceTargetIndex]) {
          updated[replaceTargetIndex] = { ...updated[replaceTargetIndex], ...localImg };
        }
        if (selectedElement?.id) {
          saveToDB(`slideshow_${flipbookVId || 'local'}_${selectedElement.id}`, updated).catch(() => {});
        }
        return updated;
      });
      if (onUpdateRef.current) onUpdateRef.current({ shouldRefresh: true });
    }
    setShowReplaceModal(false);
    setReplaceTargetIndex(null);
  };

  const deleteImage = useCallback((index) => {
    setSlideshowImages(current => {
      const updated = current.filter((_, idx) => idx !== index);
      if (selectedElement?.id) {
        saveToDB(`slideshow_${flipbookVId || 'local'}_${selectedElement.id}`, updated).catch(() => {});
      }
      return updated;
    });
    setOpenContextMenu(null);
    if (activeSlideIndex >= index && activeSlideIndex > 0) {
      setActiveSlideIndex(prev => prev - 1);
    }
    if (onUpdateRef.current) onUpdateRef.current({ shouldRefresh: true });
  }, [selectedElement?.id, flipbookVId, activeSlideIndex]);

  const handleGallerySelect = useCallback(async (img) => {
    if (!img) return;
    const targetFile = img.file || (img instanceof File ? img : img.url || img);
    const localImg = await processLocalImageFile(targetFile);
    if (!localImg) return;

    const targetIdx = libraryTargetIndex !== null ? libraryTargetIndex : activeSlideIndex;
    setSlideshowImages(prev => {
      const updated = [...prev];
      if (targetIdx < updated.length) {
        updated[targetIdx] = localImg;
      } else if (updated.length < MAX_GALLERY_IMAGES) {
        updated.push(localImg);
      }
      if (selectedElement?.id) {
        saveToDB(`slideshow_${flipbookVId || 'local'}_${selectedElement.id}`, updated).catch(() => {});
      }
      return updated;
    });

    if (targetIdx < MAX_GALLERY_IMAGES) {
      setActiveSlideIndex(targetIdx);
    }

    setLibraryTargetIndex(null);
    setOpenContextMenu(null);
    setShowGallery(false);
  }, [libraryTargetIndex, activeSlideIndex, selectedElement?.id, flipbookVId]);

  const updateSetting = (key, value) => {
    setSlideshowSettings(prev => ({ ...prev, [key]: value }));
  };
  const effects = ['Linear', 'Fade', 'Flip', 'Reveal', 'Slide'];

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
    <div className="space-y-[1vw] font-sans pb-[2vw]">
      {/* ── 1. Top Add Images Button ── */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-300 rounded-[0.75vw] bg-gray-50/50 py-[1.1vw] flex items-center justify-center gap-[0.5vw] text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-100/60 cursor-pointer transition-all shadow-2xs"
      >
        <Plus size="1vw" className="text-gray-500" />
        <span className="text-[0.8vw] font-medium text-gray-500">Add Images</span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* ── 2. Images List ── */}
      {slideshowImages.length > 0 && (
        <div className="space-y-[0.5vw]">
          {slideshowImages.map((img, i) => (
            <div
              key={img.id || i}
              onClick={() => {
                setActiveSlideIndex(i);
                performTransition(i, i > activeSlideIndex ? 'next' : 'prev');
              }}
              className={`flex flex-col p-[0.6vw] bg-white border rounded-[0.65vw] shadow-xs cursor-pointer transition-all ${
                activeSlideIndex === i
                  ? 'border-[#EC5137] ring-1 ring-[#EC5137]/30'
                  : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              {/* Top Row: Drag Handle, Thumbnail, File Name & Dimensions, Actions */}
              <div className="flex items-center justify-between">
                {/* Drag Handle */}
                <div className="text-gray-300 hover:text-gray-500 cursor-grab px-[0.1vw]">
                  <GripVertical size="0.95vw" />
                </div>

                {/* Thumbnail */}
                <img
                  src={img.url}
                  alt={img.name || `Slide ${i + 1}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%2280%22%20viewBox%3D%220%200%20100%2080%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22100%22%20height%3D%2280%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2210%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%223.5%22%3ENo%20Img%3C%2Ftext%3E%3C%2Fsvg%3E";
                  }}
                  className="w-[3.2vw] h-[2.2vw] rounded-[0.35vw] object-cover mx-[0.4vw] border border-gray-100 shrink-0"
                />

                <div className="flex-1" />

                {/* Actions: Replace & Delete */}
                <div className="flex items-center gap-[0.3vw] shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplaceTargetIndex(i);
                      replaceInputRef.current?.click();
                    }}
                    className="text-gray-400 hover:text-gray-700 transition-colors p-[0.2vw]"
                    title="Replace Image"
                  >
                    <Replace size="0.9vw" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteImage(i);
                    }}
                    className="text-red-500 hover:text-red-600 transition-colors p-[0.2vw]"
                    title="Delete Image"
                  >
                    <Trash2 size="0.9vw" />
                  </button>
                </div>
              </div>

              {/* Bottom Section: Heading and Subheading Input Boxes */}
              <div
                className="mt-[0.45vw] pt-[0.4vw] border-t border-gray-100 flex flex-col gap-[0.3vw]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-[0.4vw]">
                  <span className="text-[0.65vw] font-semibold text-gray-500 w-[4.5vw] shrink-0">Heading</span>
                  <input
                    type="text"
                    value={img.heading !== undefined ? img.heading : ''}
                    onChange={(e) => updateImageAtIndex(i, 'heading', e.target.value)}
                    placeholder="Enter slide heading..."
                    className="flex-1 h-[1.6vw] rounded-[0.3vw] border border-gray-200 px-[0.4vw] text-[0.7vw] font-medium text-gray-800 outline-none focus:border-blue-500 bg-gray-50/50 focus:bg-white shadow-2xs transition-all"
                  />
                </div>
                <div className="flex items-center gap-[0.4vw]">
                  <span className="text-[0.65vw] font-semibold text-gray-500 w-[4.5vw] shrink-0">Subheading</span>
                  <input
                    type="text"
                    value={img.subtext !== undefined ? img.subtext : ''}
                    onChange={(e) => updateImageAtIndex(i, 'subtext', e.target.value)}
                    placeholder="Enter slide subheading..."
                    className="flex-1 h-[1.6vw] rounded-[0.3vw] border border-gray-200 px-[0.4vw] text-[0.7vw] text-gray-700 outline-none focus:border-blue-500 bg-gray-50/50 focus:bg-white shadow-2xs transition-all"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 3. Slideshow Properties Header ── */}
      <div className="flex items-center gap-[0.5vw] pt-[0.4vw]">
        <span className="text-[0.85vw] font-bold text-gray-900 whitespace-nowrap">Slideshow Properties</span>
        <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}></div>
      </div>

      {/* Auto Slide Duration */}
      <div className="flex items-center justify-between">
        <span className="text-[0.75vw] font-semibold text-gray-800 whitespace-nowrap">Auto Slide Duration</span>
        <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.75vw]" />
        <div className="relative">
          <select
            value={slideshowSettings.speed || 3}
            onChange={(e) => updateSetting('speed', Number(e.target.value))}
            className="h-[2vw] px-[0.75vw] pr-[1.8vw] border border-gray-200 rounded-[0.4vw] text-[0.75vw] font-medium text-gray-700 bg-white outline-none cursor-pointer appearance-none hover:border-gray-300 shadow-2xs"
            style={{
              background: `url("data:image/svg+xml;utf8,<svg fill='%236B7280' viewBox='0 0 24 24' width='14' height='14' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>") no-repeat right 0.4vw center`
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((s) => (
              <option key={s} value={s}>{s} sec</option>
            ))}
          </select>
        </div>
      </div>

      {/* Infinity Loop Mode */}
      <div className="flex items-center justify-between">
        <span className="text-[0.75vw] font-semibold text-gray-800 whitespace-nowrap">Infinity Loop Mode</span>
        <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.75vw]" />
        <button
          type="button"
          onClick={() => updateSetting('infiniteLoop', !(slideshowSettings.infiniteLoop ?? true))}
          className={`relative block w-[2.2vw] h-[1.2vw] rounded-[1vw] transition-all duration-200 ease-in-out outline-none shrink-0 cursor-pointer ${
            (slideshowSettings.infiniteLoop ?? true) ? 'bg-[#EC5137]' : 'bg-[#e5e7eb]'
          }`}
        >
          <div
            className={`absolute top-[0.12vw] w-[0.96vw] h-[0.96vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.25)] ${
              (slideshowSettings.infiniteLoop ?? true) ? 'left-[1.1vw]' : 'left-[0.12vw]'
            }`}
          />
        </button>
      </div>

      {/* Slide Effect */}
      <div className="flex items-center justify-between">
        <span className="text-[0.75vw] font-semibold text-gray-800 whitespace-nowrap">Slide Effect</span>
        <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.75vw]" />
        <div className="relative">
          <PremiumDropdown
            options={['Linear', 'Fade', 'Flip', 'Reveal', 'Slide']}
            value={slideshowSettings.transitionEffect || 'Linear'}
            onChange={(val) => updateSetting('transitionEffect', val)}
            width="6.8vw"
            align="right"
            buttonClassName="!border-gray-200 !border !rounded-[0.4vw] !text-[0.75vw] !font-medium !h-[2vw] !bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* Manual Navigation Button */}
      <div className="space-y-[0.75vw]">
        <div className="flex items-center justify-between">
          <span className="text-[0.75vw] font-semibold text-gray-800 whitespace-nowrap">Manual Navigation Button</span>
          <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.75vw]" />
          <button
            type="button"
            onClick={() => {
              const next = !(slideshowSettings.showArrows ?? true);
              updateSetting('showArrows', next);
              updateSetting('showNav', next);
            }}
            className={`relative block w-[2.2vw] h-[1.2vw] rounded-[1vw] transition-all duration-200 ease-in-out outline-none shrink-0 cursor-pointer ${
              (slideshowSettings.showArrows ?? true) ? 'bg-[#EC5137]' : 'bg-[#e5e7eb]'
            }`}
          >
            <div
              className={`absolute top-[0.12vw] w-[0.96vw] h-[0.96vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.25)] ${
                (slideshowSettings.showArrows ?? true) ? 'left-[1.1vw]' : 'left-[0.12vw]'
              }`}
            />
          </button>
        </div>

        {(slideshowSettings.showArrows ?? true) && (
          <div className="flex items-center justify-between gap-[1vw] pt-[0.2vw]">
            {/* Left Column: Size & Color */}
            <div className="flex-1 flex flex-col gap-[0.55vw]">
              <div className="flex items-center gap-[0.5vw]">
                <span className="text-[0.7vw] font-medium text-gray-700">Button Size :</span>
                <span className="text-[0.65vw] px-[0.4vw] py-[0.05vw] bg-gray-100 rounded text-gray-600 font-medium">
                  {slideshowSettings.navButtonSize || 100}%
                </span>
              </div>
              {/* Range Slider */}
              <input
                type="range"
                min="50"
                max="200"
                value={slideshowSettings.navButtonSize || 100}
                onChange={(e) => updateSetting('navButtonSize', Number(e.target.value))}
                className="w-full cursor-pointer h-[0.25vw] rounded-full accent-[#EC5137]"
                style={{
                  backgroundImage: `linear-gradient(to right, #EC5137 0%, #EC5137 ${((slideshowSettings.navButtonSize || 100) - 50) / 1.5}%, #e5e7eb ${((slideshowSettings.navButtonSize || 100) - 50) / 1.5}%, #e5e7eb 100%)`
                }}
              />
              {/* Color Swatch & HEX box */}
              <div className="flex items-center gap-[0.4vw] mt-[0.1vw]">
                <div
                  className="w-[2vw] h-[2vw] rounded-[0.4vw] cursor-pointer shadow-2xs border border-gray-200 shrink-0"
                  style={{ background: slideshowSettings.navIconColor || '#EC5137' }}
                  onClick={() => setShowNavColorPicker(true)}
                />
                <div className="flex-1 h-[2vw] border border-gray-200 rounded-[0.4vw] px-[0.6vw] flex items-center justify-between bg-white shadow-2xs">
                  <span className="text-[0.75vw] text-gray-700 font-medium uppercase truncate">
                    {slideshowSettings.navIconColor || '#EC5137'}
                  </span>
                  <span className="text-[0.7vw] text-gray-400">100%</span>
                </div>
              </div>
            </div>

            {/* Right Column: Preview Card */}
            <div
              onClick={() => setShowNavStylesPopup(true)}
              className="w-[7.8vw] h-[4.8vw] bg-white border border-gray-200 rounded-[0.5vw] relative flex items-center justify-center cursor-pointer hover:border-gray-400 shadow-2xs shrink-0 group/nav"
            >
              <div className="absolute top-[0.35vw] right-[0.4vw] text-gray-400 group-hover/nav:text-gray-600 transition-colors">
                <Icon icon="lucide:arrow-right-left" className="w-[0.85vw] h-[0.85vw]" />
              </div>
              <div className="flex items-center justify-center gap-[0.9vw]">
                <div className="flex items-center justify-center">
                  {NavIconRenderer({ styleId: slideshowSettings.navStyle || 1, size: '1.4vw', color: slideshowSettings.navIconColor || '#EC5137' }).left}
                </div>
                <div className="flex items-center justify-center">
                  {NavIconRenderer({ styleId: slideshowSettings.navStyle || 1, size: '1.4vw', color: slideshowSettings.navIconColor || '#EC5137' }).right}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Dots */}
      <div className="space-y-[0.75vw]">
        <div className="flex items-center justify-between">
          <span className="text-[0.75vw] font-semibold text-gray-800 whitespace-nowrap">Pagination Dots</span>
          <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.75vw]" />
          <button
            type="button"
            onClick={() => updateSetting('showDots', !(slideshowSettings.showDots ?? true))}
            className={`relative block w-[2.2vw] h-[1.2vw] rounded-[1vw] transition-all duration-200 ease-in-out outline-none shrink-0 cursor-pointer ${
              (slideshowSettings.showDots ?? true) ? 'bg-[#EC5137]' : 'bg-[#e5e7eb]'
            }`}
          >
            <div
              className={`absolute top-[0.12vw] w-[0.96vw] h-[0.96vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.25)] ${
                (slideshowSettings.showDots ?? true) ? 'left-[1.1vw]' : 'left-[0.12vw]'
              }`}
            />
          </button>
        </div>

        {(slideshowSettings.showDots ?? true) && (
          <div className="flex items-center justify-between gap-[1vw] pt-[0.2vw]">
            {/* Left Column: Size & Color */}
            <div className="flex-1 flex flex-col gap-[0.55vw]">
              <div className="flex items-center gap-[0.5vw]">
                <span className="text-[0.7vw] font-medium text-gray-700">Button Size :</span>
                <span className="text-[0.65vw] px-[0.4vw] py-[0.05vw] bg-gray-100 rounded text-gray-600 font-medium">
                  {slideshowSettings.dotButtonSize || 100}%
                </span>
              </div>
              {/* Range Slider */}
              <input
                type="range"
                min="50"
                max="200"
                value={slideshowSettings.dotButtonSize || 100}
                onChange={(e) => updateSetting('dotButtonSize', Number(e.target.value))}
                className="w-full cursor-pointer h-[0.25vw] rounded-full accent-[#EC5137]"
                style={{
                  backgroundImage: `linear-gradient(to right, #EC5137 0%, #EC5137 ${((slideshowSettings.dotButtonSize || 100) - 50) / 1.5}%, #e5e7eb ${((slideshowSettings.dotButtonSize || 100) - 50) / 1.5}%, #e5e7eb 100%)`
                }}
              />
              {/* Color Swatch & HEX box */}
              <div className="flex items-center gap-[0.4vw] mt-[0.1vw]">
                <div
                  className="w-[2vw] h-[2vw] rounded-[0.4vw] cursor-pointer shadow-2xs border border-gray-200 shrink-0"
                  style={{ background: slideshowSettings.dotColor || '#EC5137' }}
                  onClick={() => setShowDotColorPicker(true)}
                />
                <div className="flex-1 h-[2vw] border border-gray-200 rounded-[0.4vw] px-[0.6vw] flex items-center justify-between bg-white shadow-2xs">
                  <span className="text-[0.75vw] text-gray-700 font-medium uppercase truncate">
                    {slideshowSettings.dotColor || '#EC5137'}
                  </span>
                  <span className="text-[0.7vw] text-gray-400">100%</span>
                </div>
              </div>
            </div>

            {/* Right Column: Preview Card */}
            <div
              onClick={() => setShowDotStylesPopup(true)}
              className="w-[7.8vw] h-[4.8vw] bg-white border border-gray-200 rounded-[0.5vw] relative flex items-center justify-center cursor-pointer hover:border-gray-400 shadow-2xs shrink-0 group/dots"
            >
              <div className="absolute top-[0.35vw] right-[0.4vw] text-gray-400 group-hover/dots:text-gray-600 transition-colors">
                <Icon icon="lucide:arrow-right-left" className="w-[0.85vw] h-[0.85vw]" />
              </div>
              <div className="flex items-center justify-center">
                <DotRenderer
                  styleId={slideshowSettings.dotStyle || 1}
                  size="0.6vw"
                  color={slideshowSettings.dotColor || '#EC5137'}
                  activeIndex={0}
                  count={3}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Background Color ── */}
      <div className="space-y-[0.6vw] pt-[0.4vw]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.85vw] font-bold text-gray-900 whitespace-nowrap">Background Color</span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}></div>
        </div>
        <div className="flex items-center justify-between gap-[0.5vw]">
          <div
            className="w-[2vw] h-[2vw] rounded-[0.4vw] cursor-pointer shadow-2xs border border-gray-200 shrink-0"
            style={{ background: slideshowSettings.bgColor || '#000000' }}
            onClick={() => setShowBgColorPicker(true)}
          />
          <div className="flex-1 h-[2vw] border border-gray-200 rounded-[0.4vw] px-[0.75vw] flex items-center justify-between bg-white shadow-2xs">
            <span className="text-[0.75vw] text-gray-700 font-medium uppercase">
              {slideshowSettings.bgColor || '#000000'}
            </span>
            <span className="text-[0.7vw] text-gray-400 font-medium">
              {slideshowSettings.bgOpacity ?? 100}%
            </span>
          </div>
          <div className="h-[2vw] px-[0.75vw] border border-gray-200 rounded-[0.4vw] flex items-center justify-between text-[0.75vw] font-medium text-gray-600 bg-white cursor-pointer hover:bg-gray-50 shadow-2xs">
            <span>HEX</span>
            <ChevronDown size="0.75vw" className="text-gray-400 ml-[0.3vw]" />
          </div>
        </div>
      </div>

      {/* ── 5. Stoke Color ── */}
      <div className="space-y-[0.75vw] pt-[0.4vw]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.85vw] font-bold text-gray-900 whitespace-nowrap">Stoke Color</span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}></div>
        </div>
        {/* Swatch & Hex input row */}
        <div className="flex items-center justify-between gap-[0.5vw]">
          <div
            className="w-[2vw] h-[2vw] rounded-[0.4vw] cursor-pointer shadow-2xs border border-gray-200 shrink-0"
            style={{ background: slideshowSettings.strokeColor || '#000000' }}
            onClick={() => setShowStrokeColorPicker(true)}
          />
          <div className="flex-1 h-[2vw] border border-gray-200 rounded-[0.4vw] px-[0.75vw] flex items-center justify-between bg-white shadow-2xs">
            <span className="text-[0.75vw] text-gray-700 font-medium uppercase">
              {slideshowSettings.strokeColor || '#000000'}
            </span>
            <span className="text-[0.7vw] text-gray-400 font-medium">
              {slideshowSettings.strokeOpacity ?? 100}%
            </span>
          </div>
          <div className="h-[2vw] px-[0.75vw] border border-gray-200 rounded-[0.4vw] flex items-center justify-between text-[0.75vw] font-medium text-gray-600 bg-white cursor-pointer hover:bg-gray-50 shadow-2xs">
            <span>HEX</span>
            <ChevronDown size="0.75vw" className="text-gray-400 ml-[0.3vw]" />
          </div>
        </div>

        {/* Row 1: Alignment & Stoke Width */}
        <div className="flex items-center gap-[1vw]">
          {/* Alignment */}
          <div className="flex-1 flex flex-col gap-[0.25vw]">
            <span className="text-[0.7vw] text-gray-500 font-medium">Alignment</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAlignOpen(!isAlignOpen)}
                className="w-full h-[2vw] px-[0.6vw] border border-gray-200 rounded-[0.4vw] flex items-center justify-between bg-white text-[0.75vw] text-gray-700 hover:bg-gray-50 shadow-2xs"
              >
                <span>{slideshowSettings.strokeAlignment || 'Center'}</span>
                <ChevronDown size="0.75vw" className="text-gray-400" />
              </button>
              {isAlignOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsAlignOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-[0.2vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-40 py-1">
                    {['Inside', 'Center', 'Outside'].map((pos) => (
                      <div
                        key={pos}
                        onClick={() => {
                          updateSetting('strokeAlignment', pos);
                          setIsAlignOpen(false);
                        }}
                        className="px-[0.75vw] py-[0.35vw] text-[0.7vw] text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                      >
                        {pos}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stoke Width */}
          <div className="flex-1 flex flex-col gap-[0.25vw]">
            <span className="text-[0.7vw] text-gray-500 font-medium">Stoke Width</span>
            <div className="flex items-center gap-[0.25vw] h-[2vw]">
              <button
                type="button"
                onClick={() => updateSetting('strokeWidth', Math.max(0, (slideshowSettings.strokeWidth || 1) - 1))}
                className="w-[2vw] h-full flex items-center justify-center bg-gray-100 rounded-[0.3vw] text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Minus size="0.75vw" />
              </button>
              <input
                type="number"
                value={slideshowSettings.strokeWidth ?? 1}
                onChange={(e) => updateSetting('strokeWidth', Math.max(0, Number(e.target.value)))}
                className="flex-1 h-full bg-white border border-gray-200 rounded-[0.4vw] text-center text-[0.75vw] font-medium text-gray-700 outline-none shadow-2xs no-spin"
              />
              <button
                type="button"
                onClick={() => updateSetting('strokeWidth', (slideshowSettings.strokeWidth || 1) + 1)}
                className="w-[2vw] h-full flex items-center justify-center bg-gray-100 rounded-[0.3vw] text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Plus size="0.75vw" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Line style & Dash Property */}
        <div className="flex items-center gap-[1vw]">
          {/* Line style */}
          <div className="flex-1 flex flex-col gap-[0.25vw]">
            <span className="text-[0.7vw] text-gray-500 font-medium">Line style</span>
            <div className="flex items-center justify-between gap-[0.3vw] h-[2vw]">
              {/* Solid */}
              <button
                type="button"
                onClick={() => updateSetting('strokeLineStyle', 'Solid')}
                className={`flex-1 h-full flex items-center justify-center rounded-[0.4vw] border transition-colors ${
                  (slideshowSettings.strokeLineStyle || 'Solid') === 'Solid'
                    ? 'bg-white border-gray-400 shadow-2xs'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="w-[1.2vw] h-[0.1vw] bg-gray-700 rounded-full" />
              </button>
              {/* Dotted */}
              <button
                type="button"
                onClick={() => updateSetting('strokeLineStyle', 'Dotted')}
                className={`flex-1 h-full flex items-center justify-center rounded-[0.4vw] border transition-colors ${
                  slideshowSettings.strokeLineStyle === 'Dotted'
                    ? 'bg-white border-gray-400 shadow-2xs'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex gap-[0.1vw]">
                  <div className="w-[0.2vw] h-[0.1vw] bg-gray-700 rounded-full" />
                  <div className="w-[0.2vw] h-[0.1vw] bg-gray-700 rounded-full" />
                  <div className="w-[0.2vw] h-[0.1vw] bg-gray-700 rounded-full" />
                </div>
              </button>
              {/* Dashed */}
              <button
                type="button"
                onClick={() => updateSetting('strokeLineStyle', 'Dashed')}
                className={`flex-1 h-full flex items-center justify-center rounded-[0.4vw] border transition-colors ${
                  slideshowSettings.strokeLineStyle === 'Dashed'
                    ? 'bg-white border-gray-400 shadow-2xs'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex gap-[0.12vw]">
                  <div className="w-[0.4vw] h-[0.1vw] bg-gray-700 rounded-full" />
                  <div className="w-[0.4vw] h-[0.1vw] bg-gray-700 rounded-full" />
                </div>
              </button>
            </div>
          </div>

          {/* Dash Property */}
          <div className="flex-1 flex flex-col gap-[0.25vw]">
            <span className="text-[0.7vw] text-gray-500 font-medium">Dash Property</span>
            <div className="flex items-center gap-[0.3vw] h-[2vw]">
              <div className="flex-1 flex items-center justify-between border border-gray-200 rounded-[0.4vw] bg-white h-full px-[0.5vw] shadow-2xs">
                <span className="text-[0.7vw] text-gray-400 font-medium">L</span>
                <input
                  type="number"
                  value={slideshowSettings.strokeDashLength ?? 8}
                  onChange={(e) => updateSetting('strokeDashLength', Math.max(1, Number(e.target.value)))}
                  className="w-[1.8vw] bg-transparent outline-none text-[0.75vw] text-gray-700 font-medium text-center no-spin"
                />
              </div>
              <span className="text-[0.7vw] text-gray-400 font-bold">:</span>
              <div className="flex-1 flex items-center justify-between border border-gray-200 rounded-[0.4vw] bg-white h-full px-[0.5vw] shadow-2xs">
                <span className="text-[0.7vw] text-gray-400 font-medium">G</span>
                <input
                  type="number"
                  value={slideshowSettings.strokeDashGap ?? 4}
                  onChange={(e) => updateSetting('strokeDashGap', Math.max(1, Number(e.target.value)))}
                  className="w-[1.8vw] bg-transparent outline-none text-[0.75vw] text-gray-700 font-medium text-center no-spin"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Line Corner */}
        <div className="flex items-center gap-[1vw]">
          <div className="flex-1 flex flex-col gap-[0.25vw]">
            <span className="text-[0.7vw] text-gray-500 font-medium">Line Corner</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCornerOpen(!isCornerOpen)}
                className="w-full h-[2vw] px-[0.6vw] border border-gray-200 rounded-[0.4vw] flex items-center justify-between bg-white text-[0.75vw] text-gray-700 hover:bg-gray-50 shadow-2xs"
              >
                <span>{slideshowSettings.strokeLineCorner || 'Rounded'}</span>
                <ChevronDown size="0.75vw" className="text-gray-400" />
              </button>
              {isCornerOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsCornerOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-[0.2vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-40 py-1">
                    {['Rounded', 'Square'].map((c) => (
                      <div
                        key={c}
                        onClick={() => {
                          updateSetting('strokeLineCorner', c);
                          setIsCornerOpen(false);
                        }}
                        className="px-[0.75vw] py-[0.35vw] text-[0.7vw] text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex-1" />
        </div>
      </div>




      {/* Popups & Pickers */}
      {showBgColorPicker && createPortal(
        <div id="slideshow-bg-color-picker" className="fixed z-[9999]" style={{ top: '160px', right: '10.5vw' }}>
          <div className="relative">
            <div className="fixed inset-0" onClick={() => setShowBgColorPicker(false)} />
            <ColorPicker
              color={slideshowSettings.bgColor || '#000000'}
              onChange={(val) => updateSetting('bgColor', val)}
              opacity={slideshowSettings.bgOpacity ?? 100}
              onOpacityChange={(val) => updateSetting('bgOpacity', val)}
              onClose={() => setShowBgColorPicker(false)}
              className="relative z-[10000]"
              colorsOnPage={colorsOnPage}
            />
          </div>
        </div>,
        document.body
      )}

      {showStrokeColorPicker && createPortal(
        <div id="slideshow-stroke-color-picker" className="fixed z-[9999]" style={{ top: '160px', right: '10.5vw' }}>
          <div className="relative">
            <div className="fixed inset-0" onClick={() => setShowStrokeColorPicker(false)} />
            <ColorPicker
              color={slideshowSettings.strokeColor || '#000000'}
              onChange={(val) => updateSetting('strokeColor', val)}
              opacity={slideshowSettings.strokeOpacity ?? 100}
              onOpacityChange={(val) => updateSetting('strokeOpacity', val)}
              onClose={() => setShowStrokeColorPicker(false)}
              className="relative z-[10000]"
              colorsOnPage={colorsOnPage}
            />
          </div>
        </div>,
        document.body
      )}

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
            handleGallerySelect(file);
          }
        }}
      />
    </div>
  );
};

export default SlideshowEditor;
