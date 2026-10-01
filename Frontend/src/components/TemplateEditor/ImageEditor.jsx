import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { resolveUploadsPath } from '../../utils/supabaseUtils';
import { getVisualBBox } from './MainEditor';
import { getSvgImageEl, syncGradient } from './editorUtils';
import {
  Image as ImageIcon,
  Upload,
  Replace,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  Link2Off,
  Edit3,
  X,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pipette,
  MousePointerClick,
  Sparkles,
  Repeat,
  ArrowLeft,
  ArrowRight,
  Filter,
  Pencil,
  Search,
  Maximize2,
  Check,
  RotateCcw,
  Minus,
  MoreVertical,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import ColorPicker, { parseGradient } from './ColorPicker';
import SlideshowProperties from './SlideshowProperties';
import Color from './Color';
import CornerRadius from './CornerRadius';
import Adjustment from './Adjustment';
import Effect from './Effect';
import ReplaceMediaModal from './ReplaceMediaModal';

const ImageEditor = ({
  selectedElement,
  selectedLayerId,
  activePageIndex,
  onUpdate,
  onPopupPreviewUpdate,
  activePopupElement,
  onPopupUpdate,
  pages,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  showInteraction = true,
  // Metadata for uploads
  folderName,
  flipbookName,
  flipbookVId,
  currentPageVId,
  onDeleteLayer
}) => {
  const fileInputRef = useRef(null);


  const stateRef = useRef({
    imageType: 'Fit',
    opacity: 100,
    radius: { tl: 0, tr: 0, br: 0, bl: 0 },
    previewSrc: selectedElement?.src || (selectedElement instanceof SVGElement ? (selectedElement.getAttribute('href') || selectedElement.getAttribute('xlink:href')) : ''),
    filters: { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 },
    activeEffects: ['effect']
  });
  const isUpdatingDOM = useRef(false);
  const isUpdatingDOMTimeoutRef = useRef(null);
  const observerRef = useRef(null);
  const isHydrating = useRef(true);
  const onUpdateTimerRef = useRef(null);
  const lastAppliedIdRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);
  const applyVisualsRef = useRef(null);

  // Sync the ref on every render
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  const [activeSection, setActiveSection] = useState('main');
  const isMainPanelOpen = activeSection === 'main';
  const [showImageTypeDropdown, setShowImageTypeDropdown] = useState(false);

  const [openSubSection, setOpenSubSection] = useState(null);
  const [isRadiusLinked, setIsRadiusLinked] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(() => {
    if (!selectedElement) return '';
    const imgEl = getSvgImageEl(selectedElement);
    return imgEl?.getAttribute?.('href') || imgEl?.getAttribute?.('xlink:href') || imgEl?.src || '';
  });

  const displayImageName = useMemo(() => {
    let nameFromLayer = null;
    if (pages && pages[activePageIndex] && selectedLayerId) {
      const findName = (layers) => {
        for (const layer of layers) {
          if (layer.id === selectedLayerId) return layer.name;
          if (layer.children) {
            const found = findName(layer.children);
            if (found !== null) return found;
          }
        }
        return null;
      };
      nameFromLayer = findName(pages[activePageIndex].layers);
    }

    if (nameFromLayer) return nameFromLayer;

    const dataName = selectedElement?.getAttribute('data-name');
    if (dataName) return dataName;

    return 'Image';
  }, [pages, activePageIndex, selectedLayerId, selectedElement]);

  const [imageResolution, setImageResolution] = useState('');
  const [imageFileSize, setImageFileSize] = useState('');

  useEffect(() => {
    if (!previewSrc) {
      setImageResolution('');
      setImageFileSize('');
      return;
    }

    const img = new Image();
    img.src = previewSrc;
    img.onload = () => {
      setImageResolution(`${img.naturalWidth} x ${img.naturalHeight}`);
    };

    const formatBytes = (bytes, decimals = 2) => {
      if (!+bytes) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    if (previewSrc.startsWith('data:')) {
      const base64str = previewSrc.split(',')[1];
      if (base64str) {
        const bytes = Math.round(base64str.length * (3 / 4));
        setImageFileSize(formatBytes(bytes, 1));
      }
    } else if (previewSrc.startsWith('blob:')) {
      fetch(previewSrc)
        .then(res => res.blob())
        .then(blob => {
          setImageFileSize(formatBytes(blob.size, 1));
        })
        .catch(() => {
          setImageFileSize('Unknown Size');
        });
    } else {
      fetch(previewSrc, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            const contentLength = res.headers.get('content-length');
            if (contentLength) {
              setImageFileSize(formatBytes(parseInt(contentLength, 10), 1));
            } else {
              setImageFileSize('Unknown Size');
            }
          } else {
            setImageFileSize('Unknown Size');
          }
        })
        .catch(() => {
          setImageFileSize('Unknown Size');
        });
    }
  }, [previewSrc]);

  const [showReplaceModal, setShowReplaceModal] = useState(false);

  const [imageType, setImageType] = useState('Fit');
  const [opacity, setOpacity] = useState(100);
  const [activePopup, setActivePopup] = useState(null);
  const [filters, setFilters] = useState({ exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 });
  const [radius, setRadius] = useState({ tl: 0, tr: 0, br: 0, bl: 0 });
  const [activeEffects, setActiveEffects] = useState(['effect']);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': { color: '#000000', opacity: 35, x: 2, y: 2, blur: 1, spread: 0 },
    'Inner Shadow': { color: '#000000', opacity: 35, x: 2, y: 2, blur: 1, spread: 0 },
    'Blur': { blur: 0.3, spread: 0, clipContent: false }
  });

  // Color state removed to use standalone Color.jsx
  const [backgroundColor, setBackgroundColor] = useState({ fill: 'transparent', stroke: 'transparent', strokeWeight: 0 }); // Dummy fallback just in case
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);

  const [isSlideshow, setIsSlideshow] = useState(false);
  const lastElementIdRef = useRef(null);
  const [showTransitionDropdown, setShowTransitionDropdown] = useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);
  const [colorsOnPage, setColorsOnPage] = useState([]);

  // Memoize static gallery previews
  const galleryPreviews = useMemo(
    () => [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206",
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda",
      "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3",
      "https://images.unsplash.com/photo-1533827432537-70133748f5c8",
      "https://images.unsplash.com/photo-1558981806-ec527fa84f3d",
    ],
    [],
  );

  // Ref to prevent persistence for one cycle during hydration
  const shouldSkipPersistence = useRef(false);

  const lastHydratedElementRef = useRef(null);

  // Resolve actual slideshow element if clicked on an inner child
  const actualSlideshowEl = useMemo(() => {
    if (!selectedElement) return null;
    if (selectedElement.hasAttribute('data-is-slideshow') ||
      selectedElement.getAttribute('data-is-slideshow') === 'true') {
      return selectedElement;
    }
    const parent = selectedElement.closest && selectedElement.closest('[data-is-slideshow="true"]');
    if (parent) return parent;
    return selectedElement;
  }, [selectedElement]);

  // Hydrate Slideshow State from DOM
  useEffect(() => {
    if (actualSlideshowEl) {
      if (actualSlideshowEl !== lastHydratedElementRef.current) {
        const hasSlideshow = actualSlideshowEl.hasAttribute('data-is-slideshow') ||
          actualSlideshowEl.getAttribute('data-is-slideshow') === 'true';
        setIsSlideshow(!!hasSlideshow);
        lastHydratedElementRef.current = actualSlideshowEl;
      }
    } else {
      lastHydratedElementRef.current = null;
    }
  }, [actualSlideshowEl]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openContextMenu !== null && !e.target.closest('.context-menu-container')) {
        setOpenContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openContextMenu]);



  useEffect(() => {
    if (!stateRef.current) stateRef.current = {};
    stateRef.current = { ...stateRef.current, imageType, opacity, radius, previewSrc, filters, activeEffects };
  });




  // Safety net to fix corrupted NaN/null attributes in the DOM
  useEffect(() => {
    const brokenEls = document.querySelectorAll('.page-svg-container [x="NaN"], .page-svg-container [y="NaN"], .page-svg-container [width="NaN"], .page-svg-container [height="NaN"], .page-svg-container [data-crop-orig-w="NaN"], .page-svg-container [data-crop-orig-h="NaN"], .page-svg-container [x="null"], .page-svg-container [y="null"], .page-svg-container [width="null"], .page-svg-container [height="null"]');
    brokenEls.forEach(el => {
      if (el.getAttribute('x') === 'NaN' || el.getAttribute('x') === 'null') el.setAttribute('x', '0');
      if (el.getAttribute('y') === 'NaN' || el.getAttribute('y') === 'null') el.setAttribute('y', '0');
      if (el.getAttribute('width') === 'NaN' || el.getAttribute('width') === 'null') el.setAttribute('width', '100');
      if (el.getAttribute('height') === 'NaN' || el.getAttribute('height') === 'null') el.setAttribute('height', '100');
      if (el.getAttribute('data-crop-orig-x') === 'NaN' || el.getAttribute('data-crop-orig-x') === 'null') el.setAttribute('data-crop-orig-x', '0');
      if (el.getAttribute('data-crop-orig-y') === 'NaN' || el.getAttribute('data-crop-orig-y') === 'null') el.setAttribute('data-crop-orig-y', '0');
      if (el.getAttribute('data-crop-orig-w') === 'NaN' || el.getAttribute('data-crop-orig-w') === 'null') el.setAttribute('data-crop-orig-w', '100');
      if (el.getAttribute('data-crop-orig-h') === 'NaN' || el.getAttribute('data-crop-orig-h') === 'null') el.setAttribute('data-crop-orig-h', '100');
    });
  });

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedLayerId) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      e.target.value = '';
      return;
    }

    // Resolve the live element from the DOM
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;

    if (!liveElement) {
      console.error("Could not resolve live element for upload");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const targetImg = getSvgImageEl(liveElement) || liveElement;

    if (targetImg) {
      const isSvgImage = targetImg.tagName?.toLowerCase() === 'image';

      const processUpload = async (nw, nh) => {
        // Retain the current element's dimension size and don't recalculate based on new aspect ratio.
        // This ensures replacing an image keeps the exact same size and bounding box.

        if (isSvgImage) {
          targetImg.setAttribute('href', imageUrl);
          try { targetImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageUrl); } catch (e) { }

          const patImg = liveElement.querySelector('.internal-crop-image');
          if (patImg) {
            patImg.setAttribute('href', imageUrl);
            try { patImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageUrl); } catch (e) { }
          }

          const origFill = liveElement.getAttribute('data-original-fill');
          if (origFill) {
            const match = origFill.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
            if (match) {
              const origPat = document.getElementById(match[1].trim()) || liveElement.closest('svg')?.querySelector(`pattern[id="${match[1].trim()}"]`);
              if (origPat) {
                const origImg = origPat.querySelector('image');
                if (origImg) {
                  origImg.setAttribute('href', imageUrl);
                  try { origImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageUrl); } catch (e) { }
                }
              }
            }
          }
        } else {
          targetImg.src = imageUrl;
          targetImg.setAttribute('src', imageUrl);
        }

        setPreviewSrc(imageUrl);
        // Do not reset crop data and imageType to 'Original' to maintain the current visual state
        // (like Fill or Crop), dimensions, effects, etc. on the new replaced image.
        liveElement.removeAttribute('data-original-src');
        liveElement.removeAttribute('data-cropped-src');
        liveElement.removeAttribute('data-effect-crop-inset');
        liveElement.removeAttribute('data-crop-data');
        setImageType('Fit');
        stateRef.current.imageType = 'Fit';

        if (onUpdate) onUpdate({ shouldRefresh: true });

        // Upload to Backend
        const storedUser = localStorage.getItem('user');
        if (storedUser && (flipbookVId || (folderName && flipbookName))) {
          const user = JSON.parse(storedUser);
          const formData = new FormData();
          formData.append('emailId', user.emailId);
          if (flipbookVId) formData.append('v_id', flipbookVId);
          if (folderName) formData.append('folderName', folderName);
          if (flipbookName) formData.append('flipbookName', flipbookName);
          formData.append('type', 'image');
          formData.append('assetType', 'Image');
          formData.append('page_v_id', currentPageVId || 'global');

          const existingFileVid = selectedElement.dataset.fileVid;
          if (existingFileVid) {
            formData.append('replacing_file_v_id', existingFileVid);
          }
          formData.append('file', file);

          try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
            if (res.data.url) {
              const serverUrl = resolveUploadsPath(res.data.url);
              const svgImgSrv = getSvgImageEl(selectedElement);
              if (svgImgSrv) {
                svgImgSrv.setAttribute('href', serverUrl);
                try { svgImgSrv.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', serverUrl); } catch (e) { }
              } else {
                selectedElement.src = serverUrl;
              }
              selectedElement.dataset.fileVid = res.data.file_v_id;
              setPreviewSrc(serverUrl);
              if (onUpdate) onUpdate({ shouldRefresh: true });
            }
          } catch (err) {
            console.error("Image upload failed detail:", err.response?.data || err);
          }
        }
      };

      const imgObj = new window.Image();
      imgObj.onload = () => {
        processUpload(imgObj.naturalWidth, imgObj.naturalHeight);
      };
      imgObj.src = imageUrl;
    }
    e.target.value = '';
  };

  const syncStateFromDOM = useCallback((force = false) => {
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    const activeEl = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || selectedElement;
    if (!activeEl) return;

    // Skip syncing if we are currently pushing changes to the DOM, UNLESS forced (e.g. on new element mount)
    if (isUpdatingDOM.current && !force) return;

    if (force) isHydrating.current = true;

    // Detect SVG image element (direct <image>, <g> group, or shape with pattern fill)
    const tagLower = selectedElement.tagName?.toLowerCase();
    const svgImageEl = getSvgImageEl(selectedElement);
    const isSvgEl = !!svgImageEl || (selectedElement instanceof SVGElement && tagLower !== 'svg');

    const currentState = stateRef.current; // Use ref for comparisons to avoid dep circle

    // 1. Sync Opacity
    const rawOpacity = isSvgEl
      ? (selectedElement.getAttribute('data-effect-opacity') ? (parseFloat(selectedElement.getAttribute('data-effect-opacity')) / 100).toString() : (selectedElement.getAttribute('opacity') || selectedElement.style.opacity || '1'))
      : (selectedElement.style.opacity || '1');
    const newOpacity = Math.round(parseFloat(rawOpacity) * 100);
    if (Math.abs(newOpacity - currentState.opacity) > 1) {
      currentState.opacity = newOpacity;
      setOpacity(newOpacity);
    }

    // 2. Sync Radius
    if (isSvgEl) {
      // Prioritize data attributes for radius
      if (selectedElement.hasAttribute('data-effect-radius-tl')) {
        setRadius({
          tl: parseFloat(selectedElement.getAttribute('data-effect-radius-tl') || '0'),
          tr: parseFloat(selectedElement.getAttribute('data-effect-radius-tr') || '0'),
          br: parseFloat(selectedElement.getAttribute('data-effect-radius-br') || '0'),
          bl: parseFloat(selectedElement.getAttribute('data-effect-radius-bl') || '0')
        });
        const linkedStr = selectedElement.getAttribute('data-corner-linked');
        if (linkedStr !== null) {
          setIsRadiusLinked(linkedStr === 'true');
        } else {
          setIsRadiusLinked(true); // Default to linked for new images
        }
      } else {
        const clipStyle = selectedElement.style.clipPath || svgImageEl?.style.clipPath || '';
        const parts = (clipStyle.match(/round\s+([.\d\s]+)px/) || ['', '0'])[1].trim().split(/\s+/).map(p => parseFloat(p) || 0);
        let tl = 0, tr = 0, br = 0, bl = 0;
        if (parts.length === 1) { tl = tr = br = bl = parts[0]; }
        else if (parts.length === 2) { tl = br = parts[0]; tr = bl = parts[1]; }
        else if (parts.length === 3) { tl = parts[0]; tr = bl = parts[1]; br = parts[2]; }
        else if (parts.length >= 4) { tl = parts[0]; tr = parts[1]; br = parts[2]; bl = parts[3]; }
        if (currentState.radius.tl !== tl || currentState.radius.tr !== tr || currentState.radius.br !== br || currentState.radius.bl !== bl) {
          setRadius({ tl, tr, br, bl });
        }
      }
    } else {
      const domRadius = selectedElement.style.borderRadius || '0px';
      const parts = domRadius.split(' ').map(p => parseFloat(p) || 0);
      let tl = 0, tr = 0, br = 0, bl = 0;
      if (parts.length === 1) { tl = tr = br = bl = parts[0]; }
      else if (parts.length === 2) { tl = br = parts[0]; tr = bl = parts[1]; }
      else if (parts.length === 3) { tl = parts[0]; tr = bl = parts[1]; br = parts[2]; }
      else if (parts.length >= 4) { tl = parts[0]; tr = parts[1]; br = parts[2]; bl = parts[3]; }
      if (currentState.radius.tl !== tl || currentState.radius.tr !== tr || currentState.radius.br !== br || currentState.radius.bl !== bl) {
        setRadius({ tl, tr, br, bl });
      }
    }

    // 3. Sync Image Type
    const currentHref = svgImageEl
      ? (svgImageEl.getAttribute('href') || svgImageEl.getAttribute('xlink:href') || '')
      : '';
    const currentImgSrc = !isSvgEl ? (selectedElement.getAttribute('src') || '') : '';
    const isCroppedSrc = !!(selectedElement.getAttribute('data-cropped-src') &&
      (currentHref || currentImgSrc) &&
      selectedElement.getAttribute('data-cropped-src') === (currentHref || currentImgSrc));

    let newType;
    if (isSvgEl) {
      const explicitFit = selectedElement.getAttribute('data-object-fit');
      const par = svgImageEl?.getAttribute('preserveAspectRatio') || 'xMidYMid meet';
      if (explicitFit) {
        newType = explicitFit;
      } else if (isCroppedSrc || selectedElement.hasAttribute('data-effect-crop-inset')) {
        newType = 'Crop';
      } else if (par.includes('slice')) {
        newType = 'Fill';
      } else if (par === 'none') {
        newType = 'Stretch';
      } else {
        newType = 'Fit';
      }
    } else {
      const inlineFit = selectedElement.style.objectFit;
      const cp = selectedElement.style.clipPath || selectedElement.style.webkitClipPath || '';
      const fitMapRev = { 'contain': 'Fit', 'cover': 'Fill', 'fill': 'Fit' };
      const currentFit = inlineFit || window.getComputedStyle(selectedElement).objectFit || 'contain';
      const hasCrop = cp.includes('inset') || isCroppedSrc || selectedElement.hasAttribute('data-effect-crop-inset');
      newType = hasCrop ? 'Crop' : (fitMapRev[currentFit] || 'Fit');
    }
    if (newType !== currentState.imageType) {
      setImageType(newType);
      currentState.imageType = newType;
    }

    // 4. Sync Src
    const currentSrc = isSvgEl
      ? (svgImageEl?.getAttribute('href') || svgImageEl?.getAttribute('xlink:href') || '')
      : (selectedElement.src || '');
    if (currentSrc !== currentState.previewSrc) {
      currentState.previewSrc = currentSrc;
      setPreviewSrc(currentSrc);
    }

    // 5. Sync Active Effects & Settings
    let newEffects = [];
    if (selectedElement.hasAttribute('data-active-effects')) {
      const attrVal = selectedElement.getAttribute('data-active-effects');
      newEffects = attrVal ? attrVal.split(',').filter(Boolean) : [];
    } else {
      // Fallback to CSS parsing if no data attribute exists (e.g. initial load of legacy templates)
      const filterStr = selectedElement.style.filter || '';
      const backdropStr = selectedElement.style.backdropFilter || selectedElement.style.webkitBackdropFilter || '';
      const overlay = selectedElement.parentElement?.querySelector('.inner-shadow-overlay') || selectedElement.parentElement?.querySelector('.svg-inner-shadow-overlay');
      const shadowStr = selectedElement.style.boxShadow || (overlay ? overlay.style.boxShadow : '') || '';

      if (/blur\(\d+px\)/.test(filterStr)) newEffects.push('Blur');
      if (shadowStr.includes('inset') || shadowStr.includes('drop-shadow')) newEffects.push('Inner Shadow');
    }

    // Update active effects state
    const currentRealEffects = currentState.activeEffects.filter(e => e !== 'effect');
    const isSameEffects = newEffects.length === currentRealEffects.length && newEffects.every(e => currentRealEffects.includes(e));
    if (!isSameEffects) {
      const nextEffects = currentState.activeEffects.includes('effect') ? ['effect', ...newEffects] : newEffects;
      setActiveEffects(nextEffects);
      currentState.activeEffects = nextEffects;
    }

    // 6. Sync Settings for each effect
    const newSettings = { ...effectSettings };
    let hasSettingsChange = false;
    Object.keys(newSettings).forEach(name => {
      const prefix = `data-effect-${name.toLowerCase().replace(/ /g, '-')}`;
      Object.keys(newSettings[name]).forEach(key => {
        let attr = `${prefix}-${key}`;
        if (name === 'Blur' && key === 'blur') attr = 'data-effect-blur-value';
        if (name === 'Blur' && key === 'clipContent') attr = 'data-effect-blur-clip';
        if (selectedElement.hasAttribute(attr)) {
          const val = selectedElement.getAttribute(attr);
          let finalVal = val;
          if (key === 'clipContent') finalVal = (val === 'true');
          else if (key !== 'color') finalVal = parseFloat(val);
          if (newSettings[name][key] !== finalVal) {
            newSettings[name][key] = finalVal;
            hasSettingsChange = true;
          }
        }
      });
    });
    if (hasSettingsChange) {
      setEffectSettings(newSettings);
    }

    // 7. Sync Adjustments (Filters) - Prioritize Data Attributes for Precision
    const newFilters = { ...currentState.filters };

    if (selectedElement.hasAttribute('data-effect-exposure')) {
      newFilters.exposure = parseFloat(selectedElement.getAttribute('data-effect-exposure') || '0');
      newFilters.contrast = parseFloat(selectedElement.getAttribute('data-effect-contrast') || '0');
      newFilters.saturation = parseFloat(selectedElement.getAttribute('data-effect-saturation') || '0');
      newFilters.temperature = parseFloat(selectedElement.getAttribute('data-effect-temperature') || '0');
      newFilters.tint = parseFloat(selectedElement.getAttribute('data-effect-tint') || '0');
      newFilters.highlights = parseFloat(selectedElement.getAttribute('data-effect-highlights') || '0');
      newFilters.shadows = parseFloat(selectedElement.getAttribute('data-effect-shadows') || '0');
    } else {
      const filterStr = selectedElement.style.filter || '';
      const getVal = (reg, def = 100) => {
        const m = filterStr.match(reg);
        return m ? Math.round(parseFloat(m[1])) : def;
      };
      newFilters.exposure = getVal(/brightness\((\d+)%\)/) - 100;
      newFilters.contrast = getVal(/contrast\((\d+)%\)/) - 100;
      newFilters.saturation = getVal(/saturate\((\d+)%\)/) - 100;
      newFilters.tint = getVal(/hue-rotate\((-?\d+)deg\)/, 0);
      if (filterStr.includes('sepia')) {
        newFilters.temperature = getVal(/sepia\((\d+)%\)/, 0) * 2;
      }
    }

    const hasFilterChange = Object.keys(newFilters).some(k => newFilters[k] !== currentState.filters[k]);
    if (hasFilterChange) {
      currentState.filters = newFilters;
      setFilters(newFilters);
    }

    setActiveEffects(prev => {
      const currentRealEffects = prev.filter(e => e !== 'effect');
      const isSame = newEffects.length === currentRealEffects.length && newEffects.every(e => currentRealEffects.includes(e));
      if (isSame) return prev;
      return prev.includes('effect') ? ['effect', ...newEffects] : newEffects;
    });

    // 8. Sync Background Color
    let fill = activeEl.getAttribute('data-fill-color');
    if (!fill) {
      fill = activeEl.getAttribute('fill');
      if (fill && fill.startsWith('url(')) {
        fill = 'transparent';
      }
    }
    fill = fill || 'transparent';
    const stroke = activeEl.getAttribute('stroke') || activeEl.getAttribute('data-stroke-color') || 'transparent';
    const fillOp = activeEl.getAttribute('data-fill-opacity') || activeEl.getAttribute('fill-opacity') || '1';
    const strokeOp = activeEl.getAttribute('data-stroke-opacity') || activeEl.getAttribute('stroke-opacity') || '1';
    const strokeW = activeEl.getAttribute('data-stroke-width') || activeEl.getAttribute('stroke-width') || '0';
    const strokeArray = activeEl.getAttribute('data-stroke-dasharray') || activeEl.getAttribute('stroke-dasharray') || 'none';

    let dashLen = 10, dashGap = 10;
    if (strokeArray !== 'none' && strokeArray !== '') {
      const parts = strokeArray.split(',');
      const parsedLen = parseInt(parts[0]);
      dashLen = isNaN(parsedLen) ? 10 : parsedLen;
      const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
      dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
    }
    const dashPos = activeEl.getAttribute('data-stroke-position') || 'Center';
    const dashCap = activeEl.getAttribute('stroke-linecap') || 'butt';

    const existingStrokeType = activeEl.getAttribute('data-stroke-type') || 'solid';
    const actualStrokeDashStyle = strokeArray === 'none' ? 'Solid' : 'Dashed';

    const newBg = {
      fill: fill === 'none' ? 'transparent' : fill,
      fillOpacity: Math.round(parseFloat(fillOp) * 100),
      stroke: stroke === 'none' ? 'transparent' : stroke,
      strokeOpacity: Math.round(parseFloat(strokeOp) * 100),
      strokeType: existingStrokeType,
      strokeDashStyle: actualStrokeDashStyle,
      strokeGradientType: activeEl.getAttribute('data-stroke-gradient-type') || 'linear',
      strokeStops: activeEl.getAttribute('data-stroke-stops'),
      strokeAngle: parseFloat(activeEl.getAttribute('data-stroke-angle') || '0'),
      strokeRadius: parseFloat(activeEl.getAttribute('data-stroke-radius') || '100'),
      strokeWeight: parseFloat(strokeW),
      strokeDasharrayValue: strokeArray,
      strokeDashLength: dashLen,
      strokeDashGap: dashGap,
      strokePosition: dashPos,
      strokeLinecap: dashCap
    };

    if (JSON.stringify(newBg) !== JSON.stringify(currentState.backgroundColor)) {
      currentState.backgroundColor = newBg;
      setBackgroundColor(newBg);
    }

    if (force) {
      setTimeout(() => {
        isHydrating.current = false;
      }, 50);
    }
  }, [selectedElement, activePageIndex, selectedLayerId]);

  useEffect(() => {
    if (!selectedElement) return;
    // Strip data-type and id from inner image immediately on selection to fix interact.js targeting
    const svgImageEl = getSvgImageEl(selectedElement);
    if (svgImageEl && svgImageEl !== selectedElement) {
      svgImageEl.removeAttribute('data-type');
      svgImageEl.removeAttribute('id');
    }

    const observer = new MutationObserver((mutations) => {
      const isObjectFitMutation = mutations.some(m => m.type === 'attributes' && (
        m.attributeName === 'data-object-fit'
      ));

      if (isObjectFitMutation) {
        // Directly update state without setting isHydrating (which would block applyVisuals)
        const newFit = selectedElement.getAttribute('data-object-fit');
        if (newFit && newFit !== stateRef.current.imageType) {
          setImageType(newFit);
          stateRef.current.imageType = newFit;
        }
        return;
      }

      if (isUpdatingDOM.current) return;
      const relevantMutation = mutations.some(m => m.type === 'attributes' && (
        m.attributeName === 'src' || m.attributeName === 'href' ||
        m.attributeName === 'opacity' || m.attributeName === 'style' ||
        m.attributeName === 'data-slideshow' ||
        m.attributeName === 'data-fill-color' || m.attributeName === 'data-stroke-color' || m.attributeName === 'data-stroke-width' || m.attributeName === 'data-stroke-dasharray' || m.attributeName === 'stroke-dasharray' ||
        m.attributeName === 'width' || m.attributeName === 'height' ||
        m.attributeName === 'x' || m.attributeName === 'y'
      ));
      if (relevantMutation) {
        syncStateFromDOM();
        if (applyVisualsRef.current) applyVisualsRef.current();
      }
    });
    observerRef.current = observer;
    observer.observe(selectedElement, { attributes: true, subtree: true, attributeFilter: ['style', 'src', 'href', 'opacity', 'preserveAspectRatio', 'xlink:href', 'data-fill-color', 'data-stroke-color', 'data-stroke-width', 'data-stroke-dasharray', 'stroke-dasharray', 'data-object-fit', 'width', 'height', 'x', 'y'] });
    syncStateFromDOM(true); // Force sync on mount/element change
    return () => {
      observer.disconnect();
      isUpdatingDOM.current = false;
      if (isUpdatingDOMTimeoutRef.current) {
        clearTimeout(isUpdatingDOMTimeoutRef.current);
        isUpdatingDOMTimeoutRef.current = null;
      }
    };
  }, [selectedElement, syncStateFromDOM]);

  const applyVisuals = useCallback(() => {
    // 0. Skip only during initial mount hydration from DOM, not during user interactions
    // isHydrating is set to true by syncStateFromDOM(true) during initial mount,
    // and we skip applyVisuals to avoid overwriting synced DOM values with stale defaults.
    // However, direct user interactions (like clicking Fit/Fill) clear isHydrating first.
    if (isHydrating.current) return;

    // 1. Re-resolve the live element from the active page container to ensure we are 
    // mutating the node that is actually visible in the DOM, skipping stale references.
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    let liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || (selectedElement?.isConnected ? selectedElement : null);

    if (!liveElement) return;

    // Use stateRef for the most up-to-date value during manual calls from onSave
    const effectiveImageType = stateRef.current.imageType || imageType;

    // Detect SVG image element (direct <image>, <g> group, or shape with pattern fill)
    let tagLower = liveElement.tagName?.toLowerCase();
    let svgImageEl = getSvgImageEl(liveElement);
    let isSvgEl = !!svgImageEl || (liveElement instanceof SVGElement && tagLower !== 'svg');

    // Ensure inner image does not have data-type so interact.js ignores it
    if (svgImageEl && svgImageEl !== liveElement) {
      svgImageEl.removeAttribute('data-type');
    }

    // --- FORCE IMAGE GROUP STRUCTURE FOR IMAGES ---
    const isUserGroup = liveElement.getAttribute('data-type') === 'group' || 
                        (liveElement.getAttribute('data-name') || '').toLowerCase() === 'group' || 
                        (liveElement.id || '').startsWith('group-');

    if (!isUserGroup && isSvgEl && svgImageEl && liveElement.getAttribute('data-is-image-group') !== 'true') {
      if (tagLower === 'image') {
        const parent = liveElement.parentNode;
        const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        newGroup.id = liveElement.id; // Keep selection intact
        newGroup.setAttribute('data-type', liveElement.getAttribute('data-type') || 'image');
        newGroup.setAttribute('data-name', 'Image Group');
        newGroup.setAttribute('data-is-image-group', 'true');

        liveElement.removeAttribute('id');
        liveElement.setAttribute('data-name', 'Image');
        liveElement.removeAttribute('data-type');

        if (liveElement.hasAttribute('transform')) {
          newGroup.setAttribute('transform', liveElement.getAttribute('transform'));
          liveElement.removeAttribute('transform');
        }

        if (parent) parent.insertBefore(newGroup, liveElement);
        newGroup.appendChild(liveElement);

        liveElement = newGroup;
        tagLower = 'g';
      } else {
        liveElement.setAttribute('data-is-image-group', 'true');
      }
    }

    // Helper: get current src
    const getSrc = (el) => {
      if (!el) return '';
      const t = el.tagName?.toLowerCase();
      if (t === 'image') return el.getAttribute('href') || el.getAttribute('xlink:href') || '';
      return el.getAttribute('src') || el.src || '';
    };
    // Helper: set src
    const setSrc = (el, src) => {
      if (!el) return;
      const t = el.tagName?.toLowerCase();
      if (t === 'image') {
        el.setAttribute('href', src);
        try { el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', src); } catch (e) { }
      } else {
        el.src = src;
        el.setAttribute('src', src);
      }
    };

    let dashLen = 10, dashGap = 10;
    const strokeArray = liveElement.getAttribute('data-stroke-dasharray') || liveElement.getAttribute('stroke-dasharray') || 'none';
    if (strokeArray !== 'none' && strokeArray !== '') {
      const parts = strokeArray.split(',');
      const parsedLen = parseInt(parts[0]);
      dashLen = isNaN(parsedLen) ? 10 : parsedLen;
      const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
      dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
    }

    // Reconstruct backgroundColor from live DOM so the rest of applyVisuals works smoothly
    const backgroundColor = {
      fill: liveElement.getAttribute('data-fill-color') || 'transparent',
      fillOpacity: parseFloat(liveElement.getAttribute('data-fill-opacity') || '1') * 100,
      stroke: liveElement.getAttribute('data-stroke-color') || 'transparent',
      strokeOpacity: parseFloat(liveElement.getAttribute('data-stroke-opacity') || '1') * 100,
      strokeWeight: parseFloat(liveElement.getAttribute('data-stroke-width') || '0'),
      strokeDashStyle: (strokeArray !== 'none') ? 'Dashed' : 'Solid',
      strokeDashLength: dashLen,
      strokeDashGap: dashGap,
      strokeDasharrayValue: strokeArray,
      strokePosition: liveElement.getAttribute('data-stroke-position') || 'Center',
      strokeLinecap: liveElement.getAttribute('stroke-linecap') || 'butt',
      strokeType: liveElement.getAttribute('data-stroke-type') || 'solid'
    };

    isUpdatingDOM.current = true;
    try {
      const getPathD = (x, y, w, h, tlv, trv, brv, blv) => {
        tlv = Math.max(0, tlv);
        trv = Math.max(0, trv);
        brv = Math.max(0, brv);
        blv = Math.max(0, blv);
        const scale = Math.min(
          1,
          w / (tlv + trv || 1),
          h / (trv + brv || 1),
          w / (brv + blv || 1),
          h / (blv + tlv || 1)
        );
        const tl = tlv * scale;
        const tr = trv * scale;
        const br = brv * scale;
        const bl = blv * scale;

        return `M ${x + tl},${y} ` +
          `L ${x + w - tr},${y} ` +
          (tr > 0 ? `A ${tr} ${tr} 0 0 1 ${x + w},${y + tr} ` : '') +
          `L ${x + w},${y + h - br} ` +
          (br > 0 ? `A ${br} ${br} 0 0 1 ${x + w - br},${y + h} ` : '') +
          `L ${x + bl},${y + h} ` +
          (bl > 0 ? `A ${bl} ${bl} 0 0 1 ${x},${y + h - bl} ` : '') +
          `L ${x},${y + tl} ` +
          (tl > 0 ? `A ${tl} ${tl} 0 0 1 ${x + tl},${y} ` : '') +
          `Z`;
      };
      // Safe access to filters
      const f = filters || { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 };

      // Adjustments: Exposure, Contrast, Saturation, Temperature, Tint, Highlights, Shadows
      const exposure = f.exposure || 0;
      const contrast = f.contrast || 0;
      const saturation = f.saturation || 0;
      const temperature = f.temperature || 0;
      const tint = f.tint || 0;
      const h = f.highlights || 0;
      const s = f.shadows || 0;

      let adjustmentFilters = "";
      adjustmentFilters += `brightness(${100 + exposure + (h / 5)}%) `;
      adjustmentFilters += `contrast(${100 + contrast + (s / 5)}%) `;
      adjustmentFilters += `saturate(${100 + saturation}%) `;
      if (tint !== 0) adjustmentFilters += `hue-rotate(${tint}deg) `;
      if (temperature > 0) adjustmentFilters += `sepia(${temperature / 2}%) `;
      else if (temperature < 0) adjustmentFilters += `hue-rotate(180deg) sepia(${Math.abs(temperature) / 2}%) hue-rotate(-180deg) `;

      // Apply adjustments
      if (isSvgEl) {
        liveElement.style.setProperty('filter', adjustmentFilters, 'important');
        liveElement.setAttribute('filter', adjustmentFilters);
        liveElement.setAttribute('data-effect-exposure', exposure.toString());
        liveElement.setAttribute('data-effect-contrast', contrast.toString());
        liveElement.setAttribute('data-effect-saturation', saturation.toString());
        liveElement.setAttribute('data-effect-temperature', temperature.toString());
        liveElement.setAttribute('data-effect-tint', tint.toString());
      } else {
        liveElement.style.setProperty('filter', adjustmentFilters, 'important');
      }

      let effectFilters = "";
      if (activeEffects.includes('Blur')) {
        effectFilters += `blur(${effectSettings['Blur'].blur}px) `;
      }

      let shadowFilter = "";
      if (activeEffects.includes('Drop Shadow')) {
        const ds = effectSettings['Drop Shadow'];
        const alpha = Math.round((ds.opacity / 100) * 255).toString(16).padStart(2, '0');
        const colorWithAlpha = ds.color + (ds.color.length === 7 ? alpha : '');
        // drop-shadow(x y blur color)
        shadowFilter = `drop-shadow(${ds.x}px ${ds.y}px ${ds.blur}px ${colorWithAlpha}) `;
      }

      const totalFilter = (adjustmentFilters + effectFilters + shadowFilter).trim() || 'none';
      const adjustOnlyFilter = adjustmentFilters.trim() || 'none';
      const shadowOnlyFilter = shadowFilter.trim() || 'none';
      const blurOnlyFilter = effectFilters.trim() || 'none';

      // Apply filters to DOM
      if (isSvgEl) {

        // 1. Apply Adjustments to the actual image content (leaf)
        // We defer applying to svgImageEl if we need to apply blur to it later for forceClip
        if (svgImageEl && !activeEffects.includes('Blur')) {
          svgImageEl.style.setProperty('filter', adjustOnlyFilter, 'important');
        }

        // 2. Restore shadowCaster for images with clip-paths (Crop/Radius) to prevent shadow clipping
        const isImageElement = liveElement.tagName?.toLowerCase() === 'image';
        const targetContainer = isImageElement ? (liveElement.parentElement || liveElement) : liveElement;

        if (isImageElement) {
          const buggyCaster = liveElement.querySelector('.svg-drop-shadow-caster');
          if (buggyCaster) buggyCaster.remove();
        }

        let shadowCaster = targetContainer.querySelector('.svg-drop-shadow-caster');
        const effImgType = liveElement.getAttribute('data-object-fit') || imageType;
        // Only images use CSS clip-path which clips shadows. Shapes use native rx/ry.
        const forceClip = activeEffects.includes('Blur') && effectSettings['Blur']?.clipContent;
        const hasClip = forceClip || (isImageElement && ((effImgType === 'Crop') || (radius.tl || radius.tr || radius.br || radius.bl)));
        const useShadowCaster = true;

        if (shadowOnlyFilter !== 'none' && useShadowCaster) {
          if (!shadowCaster || shadowCaster.tagName.toLowerCase() !== 'path') {
            if (shadowCaster) shadowCaster.remove();
            shadowCaster = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            shadowCaster.classList.add('svg-drop-shadow-caster');
            shadowCaster.style.pointerEvents = 'none';
          }

          if (shadowCaster) {
            const targetInsertNode = (effImgType === 'Crop' && liveElement.parentElement?.classList.contains('svg-crop-wrapper'))
              ? liveElement.parentElement
              : liveElement;

            if (liveElement.getAttribute('data-is-image-group') === 'true') {
              liveElement.appendChild(shadowCaster);
            } else if (shadowCaster.nextSibling !== targetInsertNode && targetInsertNode.parentElement) {
              targetInsertNode.parentElement.insertBefore(shadowCaster, targetInsertNode);
            }

            let targetElForShadow = svgImageEl || liveElement;
            if (effImgType === 'Crop' && svgImageEl && svgImageEl.parentNode?.classList.contains('svg-crop-wrapper')) {
              targetElForShadow = svgImageEl.parentNode;
            }

            let bb = { x: 0, y: 0, width: 100, height: 100 };
            try { bb = (svgImageEl || targetElForShadow).getBBox(); } catch (e) { }

            let cxStr = liveElement.getAttribute('data-crop-orig-x') || svgImageEl?.getAttribute('x') || targetElForShadow.getAttribute('x') || '0';
            let cyStr = liveElement.getAttribute('data-crop-orig-y') || svgImageEl?.getAttribute('y') || targetElForShadow.getAttribute('y') || '0';
            let cwStr = liveElement.getAttribute('data-crop-orig-w') || svgImageEl?.getAttribute('width') || targetElForShadow.getAttribute('width') || '100%';
            let chStr = liveElement.getAttribute('data-crop-orig-h') || svgImageEl?.getAttribute('height') || targetElForShadow.getAttribute('height') || '100%';

            let cx = cxStr.toString().includes('%') ? bb.x : parseFloat(cxStr) || 0;
            let cy = cyStr.toString().includes('%') ? bb.y : parseFloat(cyStr) || 0;
            let cw = cwStr.toString().includes('%') ? bb.width : parseFloat(cwStr) || 100;
            let ch = chStr.toString().includes('%') ? bb.height : parseFloat(chStr) || 100;

            const cropStrShadow = targetElForShadow.getAttribute('data-crop-data') || liveElement.getAttribute('data-crop-data');
            if (effImgType === 'Crop' && cropStrShadow && cropStrShadow !== 'null') {
              try {
                const crop = JSON.parse(cropStrShadow);
                cx = cx + (parseFloat(crop.left) / 100) * cw;
                cy = cy + (parseFloat(crop.top) / 100) * ch;
                cw = cw * (parseFloat(crop.width) / 100);
                ch = ch * (parseFloat(crop.height) / 100);
              } catch (e) { }
            }

            const trans = targetElForShadow.getAttribute('transform') || '';
            let d = getPathD(cx, cy, Math.max(0, cw), Math.max(0, ch), radius.tl || 0, radius.tr || 0, radius.br || 0, radius.bl || 0);

            shadowCaster.setAttribute('d', d);
            if (liveElement.getAttribute('data-is-image-group') !== 'true') {
              shadowCaster.setAttribute('transform', trans);
            } else {
              shadowCaster.removeAttribute('transform');
            }

            shadowCaster.setAttribute('fill', 'black');
            shadowCaster.setAttribute('fill-opacity', (opacity / 100).toString());
            shadowCaster.style.removeProperty('clip-path');

            const effSet = effectSettings['Drop Shadow'] || { x: 0, y: 0, blur: 0, color: '#000', opacity: 0 };
            const totalBlur = effSet.blur / 2;

            let shadowFilterId = `ds-only-${liveElement.id || 'img'}`;
            let defs = liveElement.ownerSVGElement?.querySelector('defs');
            if (!defs && liveElement.ownerSVGElement) {
              defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
              liveElement.ownerSVGElement.prepend(defs);
            }
            if (defs) {
              let svgFilt = defs.querySelector(`#${shadowFilterId}`);
              if (!svgFilt) {
                svgFilt = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
                svgFilt.id = shadowFilterId;
                svgFilt.setAttribute('x', '-50%');
                svgFilt.setAttribute('y', '-50%');
                svgFilt.setAttribute('width', '200%');
                svgFilt.setAttribute('height', '200%');
                defs.appendChild(svgFilt);
              }
              // Safely set innerHTML to generate only the shadow (hollowed out by SourceAlpha)
              let blurStep = "";
              if (!forceClip && activeEffects.includes('Blur')) {
                const extraBlur = effectSettings['Blur'].blur;
                blurStep = `<feGaussianBlur in="shadow" stdDeviation="${extraBlur}" result="shadow"/>`;
              }
              svgFilt.innerHTML = `
                <feGaussianBlur in="SourceAlpha" stdDeviation="${totalBlur}" result="blur"/>
                <feOffset dx="${effSet.x}" dy="${effSet.y}" result="offsetBlur"/>
                <feFlood flood-color="${effSet.color}" flood-opacity="${effSet.opacity / 100}"/>
                <feComposite in2="offsetBlur" operator="in" result="shadow"/>
                ${blurStep}
                <feComposite in="shadow" in2="SourceAlpha" operator="out"/>
              `;
              shadowCaster.style.setProperty('filter', `url(#${shadowFilterId})`, 'important');
            } else {
              shadowCaster.style.setProperty('filter', shadowOnlyFilter + (!forceClip ? ' ' + effectFilters : ''), 'important');
            }

            shadowCaster.style.setProperty('display', 'block', 'important');
          }
        } else if (shadowCaster) {
          shadowCaster.style.setProperty('display', 'none', 'important');
        }

        // 3. Apply layer-level filters
        const hasCropWrapper = liveElement.parentElement?.classList.contains('svg-crop-wrapper');
        const activeShadowFilter = ''; // We always use shadowCaster for drop-shadows now
        const innerFilter = adjustmentFilters.trim() || 'none';

        if (!hasCropWrapper) {
          const applyToLeaf = svgImageEl && svgImageEl !== liveElement;

          if (applyToLeaf) {
            if (forceClip) {
              // Blur only content, tight bounds for intrinsic clipping matching VideoEditor
              liveElement.style.removeProperty('filter');
              const leafFilter = (adjustmentFilters + effectFilters).trim() || 'none';
              svgImageEl.style.setProperty('filter', leafFilter, 'important');
            } else {
              // Blur everything (stroke, fill) via parent, adjustments only on content
              const outerFilter = effectFilters.trim() || 'none';
              liveElement.style.setProperty('filter', outerFilter, 'important');
              svgImageEl.style.setProperty('filter', innerFilter, 'important');
            }
          } else {
            if (forceClip) {
              const appliedTotalFilter = (adjustmentFilters + effectFilters).trim() || 'none';
              liveElement.style.setProperty('filter', appliedTotalFilter, 'important');
            } else {
              const appliedTotalFilter = (adjustmentFilters + effectFilters).trim() || 'none';
              liveElement.style.setProperty('filter', appliedTotalFilter, 'important');
            }
            if (svgImageEl) {
              svgImageEl.style.setProperty('filter', adjustOnlyFilter, 'important');
            }
          }

          if (forceClip && !applyToLeaf) {
            let targetElForShadow = liveElement;
            let bb = { x: 0, y: 0, width: 100, height: 100 };
            try { bb = targetElForShadow.getBBox(); } catch (e) { }
            let cxStr = targetElForShadow.getAttribute('x') || '0';
            let cyStr = targetElForShadow.getAttribute('y') || '0';
            let cwStr = targetElForShadow.getAttribute('width') || '100%';
            let chStr = targetElForShadow.getAttribute('height') || '100%';
            let cx = cxStr.includes('%') ? bb.x : parseFloat(cxStr) || 0;
            let cy = cyStr.includes('%') ? bb.y : parseFloat(cyStr) || 0;
            let cw = cwStr.includes('%') ? bb.width : parseFloat(cwStr) || 100;
            let ch = chStr.includes('%') ? bb.height : parseFloat(chStr) || 100;

            let clipId = `clip-content-${liveElement.id || 'image'}`;
            let defs = liveElement.ownerSVGElement?.querySelector('defs');
            if (!defs && liveElement.ownerSVGElement) {
              defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
              liveElement.ownerSVGElement.prepend(defs);
            }
            if (defs) {
              let clipNode = defs.querySelector(`#${clipId}`);
              if (!clipNode) {
                clipNode = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                clipNode.id = clipId;
                defs.appendChild(clipNode);
              }
              let rect = clipNode.firstChild;
              if (!rect || rect.tagName.toLowerCase() !== 'path') {
                if (rect) rect.remove();
                rect = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                clipNode.appendChild(rect);
              }
              const d = getPathD(cx, cy, Math.max(0, cw), Math.max(0, ch), radius.tl || 0, radius.tr || 0, radius.br || 0, radius.bl || 0);
              rect.setAttribute('d', d);
              rect.setAttribute('transform', targetElForShadow.getAttribute('transform') || '');

              if (applyToLeaf && svgImageEl) {
                // Wrap the image in a <g> to apply the clip-path, otherwise the blur bleeds past the clip-path due to a browser bug with SVG elements
                let clipperGroup = svgImageEl.parentNode;
                if (!clipperGroup.classList.contains('svg-image-clipper')) {
                  clipperGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                  clipperGroup.classList.add('svg-image-clipper');
                  svgImageEl.parentNode.insertBefore(clipperGroup, svgImageEl);
                  clipperGroup.appendChild(svgImageEl);
                }
                clipperGroup.style.setProperty('clip-path', `url(#${clipId})`, 'important');
                clipperGroup.style.setProperty('-webkit-clip-path', `url(#${clipId})`, 'important');

                svgImageEl.style.removeProperty('clip-path');
                svgImageEl.style.removeProperty('-webkit-clip-path');
                liveElement.style.removeProperty('clip-path');
                liveElement.style.removeProperty('-webkit-clip-path');
              } else {
                liveElement.style.setProperty('clip-path', `url(#${clipId})`, 'important');
                liveElement.style.setProperty('-webkit-clip-path', `url(#${clipId})`, 'important');
              }
            }
          } else {
            liveElement.style.removeProperty('clip-path');
            liveElement.style.removeProperty('-webkit-clip-path');
            if (svgImageEl) {
              svgImageEl.style.removeProperty('clip-path');
              svgImageEl.style.removeProperty('-webkit-clip-path');
              if (svgImageEl.parentNode && svgImageEl.parentNode.classList.contains('svg-image-clipper')) {
                svgImageEl.parentNode.style.removeProperty('clip-path');
                svgImageEl.parentNode.style.removeProperty('-webkit-clip-path');
              }
            }
          }

          if (liveElement.parentElement) {
            liveElement.parentElement.style.removeProperty('clip-path');
            liveElement.parentElement.style.removeProperty('-webkit-clip-path');
          }
        } else {
          if (forceClip) {
            // Apply blur only to the image, not the wrapper
            const combinedInner = (adjustmentFilters + effectFilters).trim() || 'none';
            liveElement.style.setProperty('filter', combinedInner, 'important');
            liveElement.parentElement.style.removeProperty('filter');
          } else {
            if (innerFilter !== 'none') {
              liveElement.style.setProperty('filter', innerFilter, 'important');
            } else {
              liveElement.style.removeProperty('filter');
            }
            if (blurOnlyFilter !== 'none') {
              liveElement.parentElement.style.setProperty('filter', blurOnlyFilter, 'important');
            } else {
              liveElement.parentElement.style.removeProperty('filter');
            }
          }
          if (forceClip) {
            let targetElForShadow = svgImageEl || liveElement;
            if (effImgType === 'Crop' && svgImageEl && svgImageEl.parentNode?.classList.contains('svg-crop-wrapper')) {
              targetElForShadow = svgImageEl.parentNode;
            }

            let bb = { x: 0, y: 0, width: 100, height: 100 };
            try { bb = (svgImageEl || targetElForShadow).getBBox(); } catch (e) { }
            let cxStr = liveElement.getAttribute('data-crop-orig-x') || svgImageEl?.getAttribute('x') || targetElForShadow.getAttribute('x') || '0';
            let cyStr = liveElement.getAttribute('data-crop-orig-y') || svgImageEl?.getAttribute('y') || targetElForShadow.getAttribute('y') || '0';
            let cwStr = liveElement.getAttribute('data-crop-orig-w') || svgImageEl?.getAttribute('width') || targetElForShadow.getAttribute('width') || '100%';
            let chStr = liveElement.getAttribute('data-crop-orig-h') || svgImageEl?.getAttribute('height') || targetElForShadow.getAttribute('height') || '100%';
            let cx = cxStr.toString().includes('%') ? bb.x : parseFloat(cxStr) || 0;
            let cy = cyStr.toString().includes('%') ? bb.y : parseFloat(cyStr) || 0;
            let cw = cwStr.toString().includes('%') ? bb.width : parseFloat(cwStr) || 100;
            let ch = chStr.toString().includes('%') ? bb.height : parseFloat(chStr) || 100;
            const cropStrShadow = targetElForShadow.getAttribute('data-crop-data') || liveElement.getAttribute('data-crop-data');
            if (effImgType === 'Crop' && cropStrShadow && cropStrShadow !== 'null') {
              try {
                const crop = JSON.parse(cropStrShadow);
                cx = cx + (parseFloat(crop.left) / 100) * cw;
                cy = cy + (parseFloat(crop.top) / 100) * ch;
                cw = cw * (parseFloat(crop.width) / 100);
                ch = ch * (parseFloat(crop.height) / 100);
              } catch (e) { }
            }

            let clipId = `clip-content-${liveElement.id || 'image'}`;
            let defs = liveElement.ownerSVGElement?.querySelector('defs');
            if (!defs && liveElement.ownerSVGElement) {
              defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
              liveElement.ownerSVGElement.prepend(defs);
            }
            if (defs) {
              let clipNode = defs.querySelector(`#${clipId}`);
              if (!clipNode) {
                clipNode = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                clipNode.id = clipId;
                defs.appendChild(clipNode);
              }
              let rect = clipNode.firstChild;
              if (!rect || rect.tagName.toLowerCase() !== 'path') {
                if (rect) rect.remove();
                rect = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                clipNode.appendChild(rect);
              }
              const d = getPathD(cx, cy, Math.max(0, cw), Math.max(0, ch), radius.tl || 0, radius.tr || 0, radius.br || 0, radius.bl || 0);
              rect.setAttribute('d', d);
              rect.setAttribute('transform', targetElForShadow.getAttribute('transform') || '');

              liveElement.parentElement.style.setProperty('clip-path', `url(#${clipId})`, 'important');
              liveElement.parentElement.style.setProperty('-webkit-clip-path', `url(#${clipId})`, 'important');
            }
          } else {
            liveElement.parentElement.style.removeProperty('clip-path');
            liveElement.parentElement.style.removeProperty('-webkit-clip-path');
          }
        }
        if (liveElement.parentElement) {
          if (!hasCropWrapper && !forceClip && blurOnlyFilter === 'none') {
            liveElement.parentElement.style.setProperty('overflow', 'visible', 'important');
          }
        }
      } else {
        // FOR HTML: Use the full filter on the element
        liveElement.style.setProperty('filter', (adjustmentFilters + effectFilters + shadowFilter).trim() || 'none', 'important');
        if (liveElement.parentElement) liveElement.parentElement.style.removeProperty('filter');
      }

      // 2. SVG Attributes (to ensure persistence and high-quality rendering via SVG filters)
      if (isSvgEl) {
        // Remove the native filter attribute during live editing to ensure CSS filter precedence
        liveElement.removeAttribute('filter');
        if (svgImageEl) svgImageEl.removeAttribute('filter');

        // Apply persistent data attributes to the primary selection element (source of truth for sync)
        liveElement.setAttribute('data-effect-exposure', exposure.toString());
        liveElement.setAttribute('data-effect-contrast', contrast.toString());
        liveElement.setAttribute('data-effect-saturation', saturation.toString());
        liveElement.setAttribute('data-effect-temperature', temperature.toString());
        liveElement.setAttribute('data-effect-tint', tint.toString());
        liveElement.setAttribute('data-effect-highlights', h.toString());
        liveElement.setAttribute('data-effect-shadows', s.toString());

        // Sync active effects list for the SVG filter generator
        const effectsAttr = activeEffects.filter(e => e !== 'effect').join(',');
        liveElement.setAttribute('data-active-effects', effectsAttr);

        // Sync individual effect settings
        Object.entries(effectSettings).forEach(([name, settings]) => {
          const prefix = `data-effect-${name.toLowerCase().replace(/ /g, '-')}`;
          Object.entries(settings).forEach(([key, val]) => {
            let attr = `${prefix}-${key}`;
            if (name === 'Blur' && key === 'blur') attr = 'data-effect-blur-value';
            if (name === 'Blur' && key === 'clipContent') attr = 'data-effect-blur-clip';
            liveElement.setAttribute(attr, val.toString());
          });
        });
      }

      // --- Persist isSlideshow mode so hydration survives onUpdate re-renders ---
      if (isSlideshow) {
        liveElement.setAttribute('data-is-slideshow', 'true');
      } else {
        liveElement.removeAttribute('data-is-slideshow');
      }

      // --- Opacity (works for both; also persist via SVG attribute) ---
      const opacityVal = (opacity / 100).toString();

      if (isSvgEl && svgImageEl && svgImageEl !== liveElement) {
        liveElement.style.removeProperty('opacity');
        liveElement.removeAttribute('opacity');
        liveElement.setAttribute('data-effect-opacity', opacity.toString());
        svgImageEl.style.setProperty('opacity', opacityVal, 'important');
        svgImageEl.setAttribute('opacity', opacityVal);
      } else {
        liveElement.style.setProperty('opacity', opacityVal, 'important');
        if (isSvgEl) {
          liveElement.setAttribute('opacity', opacityVal);
          liveElement.setAttribute('data-effect-opacity', opacity.toString());
          if (svgImageEl && svgImageEl !== liveElement) svgImageEl.setAttribute('opacity', opacityVal);
        }
      }

      if (isSvgEl) {
        // --- SVG: Image fit via preserveAspectRatio ---
        const parMap = { 'Fit': 'meet', 'Fill': 'slice', 'Crop': 'slice', 'Stretch': 'none' };
        const fitCssMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover', 'Stretch': 'fill' };
        let meetOrSlice = parMap[effectiveImageType] || 'meet';
        let fitCss = fitCssMap[effectiveImageType] || 'contain';

        if (effectiveImageType === 'Crop' || liveElement.getAttribute('data-object-fit') === 'Crop') {
          meetOrSlice = 'slice';
          fitCss = 'cover';
        }
        let parAlign = liveElement.getAttribute('data-crop-align') || 'xMidYMid';
        if (meetOrSlice === 'meet') parAlign = 'xMidYMid'; // Standard center for Fit
        if (svgImageEl) {
          if (meetOrSlice === 'none') svgImageEl.setAttribute('preserveAspectRatio', 'none');
          else svgImageEl.setAttribute('preserveAspectRatio', `${parAlign} ${meetOrSlice}`);
          svgImageEl.style.setProperty('object-fit', fitCss, 'important');
        }
        liveElement.style.setProperty('object-fit', fitCss, 'important');

        // --- SVG: Corner radius OR Crop via CSS clip-path inset() ---
        const cropData = {
          inset: liveElement.getAttribute('data-effect-crop-inset'),
          scale: liveElement.getAttribute('data-effect-crop-scale'),
          offX: liveElement.getAttribute('data-effect-crop-offx'),
          offY: liveElement.getAttribute('data-effect-crop-offy')
        };

        const anyR = radius.tl || radius.tr || radius.br || radius.bl;
        const forceClip = activeEffects.includes('Blur') && effectSettings['Blur']?.clipContent;
        const maxR = Math.min(Math.max(...Object.values(radius)), 50);
        const radiusStr = (anyR || forceClip) ? ` round ${radius.tl || 0}px ${radius.tr || 0}px ${radius.br || 0}px ${radius.bl || 0}px` : '';

        if (effectiveImageType === 'Crop' || liveElement.getAttribute('data-object-fit') === 'Crop' || (cropData.inset || liveElement.getAttribute('data-effect-crop-inset') || liveElement.getAttribute('data-saved-crop-data'))) {
          const cropStr = liveElement.getAttribute('data-crop-data') || liveElement.getAttribute('data-saved-crop-data') || '{"left":0,"top":0,"width":100,"height":100}';
          const crop = JSON.parse(cropStr);
          if (liveElement.hasAttribute('data-saved-crop-data')) {
            liveElement.setAttribute('data-crop-data', cropStr);
            liveElement.removeAttribute('data-saved-crop-data');
          }

          // Find the actual SVG <image> tag
          let svgImageEl = liveElement.tagName?.toLowerCase() === 'image' ? liveElement : liveElement.querySelector('image');
          let patternEl = null;

          if (!svgImageEl && liveElement.hasAttribute('fill')) {
            const fillUrl = liveElement.getAttribute('fill');
            const match = fillUrl?.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
            if (match) {
              const patternId = match[1].trim();
              const rootSvg = liveElement.closest('svg') || document;
              // Try querySelector first, fallback to getElementById for tricky characters
              try {
                patternEl = rootSvg.querySelector(`pattern[id="${patternId}"]`);
              } catch (e) {
                patternEl = null;
              }
              if (!patternEl) {
                patternEl = document.getElementById(patternId);
              }
              if (patternEl) {
                svgImageEl = patternEl.querySelector('image');
              }
            }
          }

          if (patternEl && svgImageEl) {
            // --- PATTERN CROP ---
            svgImageEl.setAttribute('width', '100%');
            svgImageEl.setAttribute('height', '100%');
            const underlyingFitPattern = liveElement.getAttribute('data-crop-underlying-fit') || 'none';
            const meetOrSlicePattern = underlyingFitPattern === 'Fill' ? 'xMidYMid slice' : underlyingFitPattern === 'Stretch' ? 'none' : 'xMidYMid meet';
            svgImageEl.setAttribute('preserveAspectRatio', meetOrSlicePattern);

            patternEl.removeAttribute('viewBox');
            patternEl.setAttribute('width', '100%');
            patternEl.setAttribute('height', '100%');

            const insetTop = crop.top;
            const insetRight = 100 - (parseFloat(crop.left) + parseFloat(crop.width));
            const insetBottom = 100 - (parseFloat(crop.top) + parseFloat(crop.height));
            const insetLeft = crop.left;
            const svgClipVal = `inset(${insetTop}% ${insetRight}% ${insetBottom}% ${insetLeft}%${radiusStr})`;
            liveElement.style.setProperty('clip-path', svgClipVal, 'important');

          } else if (svgImageEl) {
            // --- SVG PATH (Container with inner image) ---
            let targetEl = liveElement;
            let imgEl = svgImageEl;

            // We physically shrink the wrapper and offset the image to fix bounding box issues
            // Clean up old wrapper entirely
            let wrapper = null;
            if (liveElement.tagName?.toLowerCase() === 'svg' && liveElement.classList.contains('svg-crop-wrapper')) {
              wrapper = liveElement;
            } else if (liveElement.parentNode?.tagName?.toLowerCase() === 'svg' && liveElement.parentNode.classList.contains('svg-crop-wrapper')) {
              wrapper = liveElement.parentNode;
            } else {
              wrapper = liveElement.querySelector('.svg-crop-wrapper');
            }
            if (wrapper) {
              const innerImg = wrapper.querySelector('image');
              if (innerImg) {
                wrapper.parentNode.insertBefore(innerImg, wrapper);
                imgEl = innerImg;
                targetEl = liveElement;
              }
              wrapper.remove();
            }


            const origW = liveElement.getAttribute('data-crop-orig-w') || imgEl.getAttribute('data-crop-orig-w') || imgEl.getAttribute('width') || '100';
            const origH = liveElement.getAttribute('data-crop-orig-h') || imgEl.getAttribute('data-crop-orig-h') || imgEl.getAttribute('height') || '100';
            const origX = liveElement.getAttribute('data-crop-orig-x') || imgEl.getAttribute('data-crop-orig-x') || imgEl.getAttribute('x') || '0';
            const origY = liveElement.getAttribute('data-crop-orig-y') || imgEl.getAttribute('data-crop-orig-y') || imgEl.getAttribute('y') || '0';
            // Ensure orig dims are always stored on the group so CropOverlay can find full bounds on re-open
            liveElement.setAttribute('data-crop-orig-w', origW);
            liveElement.setAttribute('data-crop-orig-h', origH);
            liveElement.setAttribute('data-crop-orig-x', origX);
            liveElement.setAttribute('data-crop-orig-y', origY);

            const isXPercent = origX.toString().includes('%') || origW.toString().includes('%');
            const isYPercent = origY.toString().includes('%') || origH.toString().includes('%');

            imgEl.style.removeProperty('display');
            // Temporarily clear any existing transform so getBBox reads the raw layout
            imgEl.removeAttribute('transform');

            // Persist the radius link state to DOM so it is retained across clicks
            liveElement.setAttribute('data-corner-linked', isRadiusLinked ? 'true' : 'false');
            imgEl.setAttribute('width', origW);
            imgEl.setAttribute('height', origH);
            imgEl.setAttribute('x', origX.toString() + (isXPercent ? '%' : ''));
            imgEl.setAttribute('y', origY.toString() + (isYPercent ? '%' : ''));
            const underlyingFit = liveElement.getAttribute('data-crop-underlying-fit') || 'Fit';
            const meetOrSliceCrop = underlyingFit === 'Stretch' ? 'none' : underlyingFit === 'Fit' ? 'xMidYMid meet' : 'xMidYMid slice';
            imgEl.setAttribute('preserveAspectRatio', meetOrSliceCrop);

            // Resolve actual rendered SVG dimensions. If origW/H are percentages (e.g. "100%"),
            // parseFloat gives a wrong number. Use getBBox() to get the true SVG user-unit size.
            let wNum = parseFloat(origW);
            let hNum = parseFloat(origH);
            let xNum = parseFloat(origX) || 0;
            let yNum = parseFloat(origY) || 0;
            const isPercent = isXPercent || isYPercent || origW.toString().includes('%') || origH.toString().includes('%');
            if (isPercent || isNaN(wNum) || isNaN(hNum) || wNum <= 0 || hNum <= 0) {
              try {
                const bb = imgEl.getBBox();
                if (bb && bb.width > 0 && bb.height > 0) {
                  wNum = bb.width;
                  hNum = bb.height;
                  xNum = bb.x;
                  yNum = bb.y;
                }
              } catch (e) {
                wNum = wNum || 100;
                hNum = hNum || 100;
              }
            }

            const centerX = xNum + (wNum / 2);
            const centerY = yNum + (hNum / 2);
            const panX = (wNum * (crop.offX || 0)) / 100;
            const panY = (hNum * (crop.offY || 0)) / 100;
            const finalScale = parseFloat(crop.scale) || 1;

            imgEl.setAttribute('transform', `translate(${centerX + panX} ${centerY + panY}) scale(${finalScale}) translate(${-centerX} ${-centerY})`);

            imgEl.style.removeProperty('transform');
            imgEl.style.removeProperty('transform-origin');
            imgEl.style.removeProperty('transform-box');
            imgEl.style.removeProperty('clip-path');
            imgEl.removeAttribute('clip-path');

            const scale = parseFloat(crop.scale) || 1;
            const offX = parseFloat(crop.offX) || 0;
            const offY = parseFloat(crop.offY) || 0;
            const cLeft = parseFloat(crop.left) || 0;
            const cTop = parseFloat(crop.top) || 0;
            const cWidth = parseFloat(crop.width) || 100;
            const cHeight = parseFloat(crop.height) || 100;

            const clipX = xNum + (wNum * cLeft) / 100;
            const clipY = yNum + (hNum * cTop) / 100;
            const clipW = (wNum * cWidth) / 100;
            const clipH = (hNum * cHeight) / 100;

            const svgRoot = liveElement.ownerSVGElement || imgEl.ownerSVGElement;
            if (svgRoot) {
              let defs = svgRoot.querySelector('defs');
              if (!defs) {
                defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                svgRoot.insertBefore(defs, svgRoot.firstChild);
              }
              const clipId = `crop-clip-${liveElement.id || Math.random().toString(36).substr(2, 9)}`;
              let clipPath = defs.querySelector(`[id="${clipId}"]`);
              if (!clipPath) {
                clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                clipPath.id = clipId;
                clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
                defs.appendChild(clipPath);
              }
              let rect = clipPath.firstChild;
              if (!rect || rect.tagName.toLowerCase() !== 'path') {
                if (rect) rect.remove();
                rect = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                clipPath.appendChild(rect);
              }
              const d = getPathD(clipX, clipY, Math.max(0, clipW), Math.max(0, clipH), radius.tl || 0, radius.tr || 0, radius.br || 0, radius.bl || 0);
              rect.setAttribute('d', d);

              // DO NOT apply clip to the inner imgEl because its local space is transformed (panned/scaled).
              // The parent group clip is sufficient and operates in the correct stable local coordinate space.

              // Create crop clip for the parent group so the outer image is completely hidden.
              const groupClipId = `crop-group-clip-${liveElement.id || clipId}`;
              let groupClipPath = defs.querySelector(`[id="${groupClipId}"]`);
              if (!groupClipPath) {
                groupClipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                groupClipPath.id = groupClipId;
                groupClipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
                defs.appendChild(groupClipPath);
              }
              let groupClipRect = groupClipPath.firstChild;
              if (!groupClipRect || groupClipRect.tagName.toLowerCase() !== 'path') {
                if (groupClipRect) groupClipRect.remove();
                groupClipRect = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                groupClipPath.appendChild(groupClipRect);
              }

              // Apply crop bounds directly in liveElement's local coordinate space.
              // No parent CTM conversion is needed because the clip-path is evaluated 
              // in the local space of the element it's applied to.
              const groupD = getPathD(clipX, clipY, Math.max(0, clipW), Math.max(0, clipH), radius.tl || 0, radius.tr || 0, radius.br || 0, radius.bl || 0);
              groupClipRect.setAttribute('d', groupD);
              liveElement.setAttribute('clip-path', `url(#${groupClipId})`);
              liveElement.style.removeProperty('clip-path');
            }
            if (anyR) {
              liveElement.style.setProperty('border-radius', `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`, 'important');
            } else {
              liveElement.style.removeProperty('border-radius');
            }
          } else if (liveElement.hasAttribute('fill') && liveElement.getAttribute('fill')?.toString().includes('url(#')) {
            // --- Pattern Fill Crop Logic ---
            let imgEl = getSvgImageEl(liveElement);
            if (imgEl) {
              if (!liveElement.id) liveElement.id = `el-${Math.random().toString(36).substr(2, 9)}`;

              if (!liveElement.hasAttribute('data-crop-orig-w')) {
                liveElement.setAttribute('data-crop-orig-w', liveElement.getAttribute('width') || liveElement.getBoundingClientRect().width || '100');
                liveElement.setAttribute('data-crop-orig-h', liveElement.getAttribute('height') || liveElement.getBoundingClientRect().height || '100');
                liveElement.setAttribute('data-crop-orig-x', liveElement.getAttribute('x') || '0');
                liveElement.setAttribute('data-crop-orig-y', liveElement.getAttribute('y') || '0');
              }

              const origW = parseFloat(liveElement.getAttribute('data-crop-orig-w'));
              const origH = parseFloat(liveElement.getAttribute('data-crop-orig-h'));
              const origX = parseFloat(liveElement.getAttribute('data-crop-orig-x'));
              const origY = parseFloat(liveElement.getAttribute('data-crop-orig-y'));

              if (!liveElement.hasAttribute('data-original-fill')) {
                liveElement.setAttribute('data-original-fill', liveElement.getAttribute('fill'));
              }

              const rootSvg = liveElement.closest('svg');
              let cropPat = rootSvg?.querySelector(`.internal-crop-pattern[data-for="${liveElement.id}"]`);
              if (!cropPat) {
                cropPat = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
                cropPat.classList.add('internal-crop-pattern');
                cropPat.id = `crop-pat-${Math.random().toString(36).substr(2, 9)}`;
                cropPat.setAttribute('patternUnits', 'userSpaceOnUse');
                cropPat.setAttribute('data-for', liveElement.id);

                let defs = rootSvg?.querySelector('defs');
                if (rootSvg && !defs) {
                  defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                  rootSvg.insertBefore(defs, rootSvg.firstChild);
                }
                if (defs) {
                  defs.appendChild(cropPat);
                } else {
                  liveElement.parentNode.insertBefore(cropPat, liveElement);
                }

                const patImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                patImg.classList.add('internal-crop-image');
                cropPat.appendChild(patImg);
              }

              const panOffX = (parseFloat(origW) * (crop.offX || 0)) / 100;
              const panOffY = (parseFloat(origH) * (crop.offY || 0)) / 100;

              const insetTop = crop.top;
              const insetRight = 100 - (parseFloat(crop.left) + parseFloat(crop.width));
              const insetBottom = 100 - (parseFloat(crop.top) + parseFloat(crop.height));
              const insetLeft = crop.left;
              const svgClipVal = `inset(${insetTop}% ${insetRight}% ${insetBottom}% ${insetLeft}%${radiusStr})`;
              liveElement.style.setProperty('clip-path', svgClipVal, 'important');

              liveElement.setAttribute('width', origW.toString());
              liveElement.setAttribute('height', origH.toString());
              liveElement.setAttribute('x', origX.toString());
              liveElement.setAttribute('y', origY.toString());

              cropPat.setAttribute('width', origW.toString());
              cropPat.setAttribute('height', origH.toString());
              cropPat.setAttribute('x', origX.toString());
              cropPat.setAttribute('y', origY.toString());
              cropPat.removeAttribute('viewBox');

              const patImg = cropPat.querySelector('.internal-crop-image');
              if (patImg) {
                const updatedHref = imgEl.getAttribute('href') || imgEl.getAttribute('xlink:href') || imgEl.src || '';
                patImg.setAttribute('href', updatedHref);
                try { patImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', updatedHref); } catch (e) { }
                patImg.setAttribute('width', origW.toString());
                patImg.setAttribute('height', origH.toString());
                const isWPercent = origW.toString().includes('%');
                const isHPercent = origH.toString().includes('%');
                patImg.setAttribute('x', panOffX.toString() + (isWPercent ? '%' : ''));
                patImg.setAttribute('y', panOffY.toString() + (isHPercent ? '%' : ''));

                // Synchronize original pattern image to prevent reverting on un-crop
                const origFill = liveElement.getAttribute('data-original-fill');
                if (origFill) {
                  const origMatch = origFill.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
                  if (origMatch) {
                    const origPat = liveElement.closest('svg')?.querySelector(`pattern[id="${origMatch[1].trim()}"]`) || document.getElementById(origMatch[1].trim());
                    if (origPat) {
                      const origImg = origPat.querySelector('image');
                      if (origImg) {
                        origImg.setAttribute('href', updatedHref);
                        try { origImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', updatedHref); } catch (e) { }
                      }
                    }
                  }
                }
              }

              liveElement.setAttribute('fill', `url(#${cropPat.id})`);
              const anyR = radius.tl || radius.tr || radius.br || radius.bl;
              if (anyR && (liveElement.tagName?.toLowerCase() === 'rect' || liveElement.tagName?.toLowerCase() === 'image')) {
                liveElement.setAttribute('rx', Math.max(radius.tl, radius.tr, radius.br, radius.bl).toString());
              } else if (liveElement.tagName?.toLowerCase() === 'rect' || liveElement.tagName?.toLowerCase() === 'image') {
                liveElement.removeAttribute('rx');
              }
            }
          } else {
            // --- Unified Element (HTML or direct SVG <image>) ---
            const innerScaleX = 100 / Math.max(0.1, crop.width);
            const innerScaleY = 100 / Math.max(0.1, crop.height);

            if (!(liveElement instanceof SVGElement) && liveElement.tagName?.toLowerCase() === 'img') {
              // --- HTML <img> Element ---
              const bgPosX = (innerScaleX === 1) ? 0 : (crop.left * innerScaleX) / (innerScaleX - 1);
              const bgPosY = (innerScaleY === 1) ? 0 : (crop.top * innerScaleY) / (innerScaleY - 1);

              const origSrc = liveElement.getAttribute('data-original-src') || liveElement.src;
              if (origSrc && !origSrc.startsWith('data:image/gif')) {
                if (!liveElement.hasAttribute('data-original-src')) {
                  liveElement.setAttribute('data-original-src', origSrc);
                }
                liveElement.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // 1x1 transparent
                liveElement.style.setProperty('background-image', `url("${origSrc}")`, 'important');
                liveElement.style.setProperty('background-size', `${innerScaleX * 100}% ${innerScaleY * 100}%`, 'important');
                liveElement.style.setProperty('background-position', `${bgPosX}% ${bgPosY}%`, 'important');
                liveElement.style.setProperty('background-repeat', 'no-repeat', 'important');
              }

              liveElement.style.removeProperty('transform');
              liveElement.style.removeProperty('transform-origin');
              liveElement.style.removeProperty('clip-path');
            } else {
              // --- SVG <image> Element (Native CSS Clip-Path) ---
              const svgClipVal = `inset(${crop.top}% ${100 - crop.left - crop.width}% ${100 - crop.top - crop.height}% ${crop.left}%${radiusStr})`;
              let innerGroupForClip = liveElement.querySelector('.image-inner-content');
              if (innerGroupForClip) {
                innerGroupForClip.style.setProperty('clip-path', svgClipVal, 'important');
                innerGroupForClip.style.setProperty('-webkit-clip-path', svgClipVal, 'important');
                liveElement.style.removeProperty('clip-path');
                liveElement.style.removeProperty('-webkit-clip-path');
              } else {
                liveElement.style.setProperty('clip-path', svgClipVal, 'important');
                liveElement.style.setProperty('-webkit-clip-path', svgClipVal, 'important');
              }
            }

            // Shared Fallback Cleanup
            liveElement.style.removeProperty('object-view-box');
            liveElement.style.removeProperty('translate');
            liveElement.style.removeProperty('scale');
            if (anyR) {
              liveElement.style.setProperty('border-radius', `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`, 'important');
            }
          }

          // Persistence attributes
          if (anyR) {
            liveElement.setAttribute('data-effect-radius-tl', radius.tl.toString());
            liveElement.setAttribute('data-effect-radius-tr', radius.tr.toString());
            liveElement.setAttribute('data-effect-radius-br', radius.br.toString());
            liveElement.setAttribute('data-effect-radius-bl', radius.bl.toString());
          }
        } else {
          // FALLBACK: When not cropping, clear crop transforms and check for Radius
          liveElement.style.removeProperty('transform');
          liveElement.style.removeProperty('transform-origin');
          liveElement.style.removeProperty('transform-box');

          // Clear pattern viewBox
          if (liveElement.hasAttribute('fill')) {
            const fillUrl = liveElement.getAttribute('fill');
            const match = fillUrl?.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
            if (match) {
              const patternId = match[1].trim();
              const rootSvg = liveElement.closest('svg') || document;
              let pEl = null;
              try {
                pEl = rootSvg.querySelector(`pattern[id="${patternId}"]`);
              } catch (e) { }
              if (!pEl) pEl = document.getElementById(patternId);

              if (pEl) {
                if (pEl.classList.contains('internal-crop-pattern')) {
                  const origFill = liveElement.getAttribute('data-original-fill');
                  if (origFill) {
                    liveElement.setAttribute('fill', origFill);
                    pEl.remove();

                    const origMatch = origFill.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
                    if (origMatch) {
                      const origPat = rootSvg.querySelector(`pattern[id="${origMatch[1].trim()}"]`) || document.getElementById(origMatch[1].trim());
                      if (origPat) {
                        const pImg = origPat.querySelector('image');
                        if (pImg) {
                          const parMap = { 'Fit': 'meet', 'Fill': 'slice', 'Crop': 'slice', 'Stretch': 'none' };
                          let meetOrSlice = parMap[effectiveImageType] || 'meet';
                          let parAlign = liveElement.getAttribute('data-crop-align') || 'xMidYMid';
                          if (meetOrSlice === 'meet') parAlign = 'xMidYMid';
                          if (meetOrSlice === 'none') pImg.setAttribute('preserveAspectRatio', 'none');
                          else pImg.setAttribute('preserveAspectRatio', `${parAlign} ${meetOrSlice}`);
                        }
                      }
                    }
                  }
                } else {
                  pEl.removeAttribute('viewBox');
                  pEl.removeAttribute('preserveAspectRatio'); // Useless without viewBox

                  const pImg = pEl.querySelector('image');
                  if (pImg) {
                    const parMap = { 'Fit': 'meet', 'Fill': 'slice', 'Crop': 'slice', 'Stretch': 'none' };
                    let meetOrSlice = parMap[effectiveImageType] || 'meet';
                    let parAlign = liveElement.getAttribute('data-crop-align') || 'xMidYMid';
                    if (meetOrSlice === 'meet') parAlign = 'xMidYMid';
                    if (meetOrSlice === 'none') pImg.setAttribute('preserveAspectRatio', 'none');
                    else pImg.setAttribute('preserveAspectRatio', `${parAlign} ${meetOrSlice}`);
                  }
                }
              }
            }
          }

          let wrapper = null;
          if (liveElement.tagName?.toLowerCase() === 'svg' && liveElement.classList.contains('svg-crop-wrapper')) {
            wrapper = liveElement;
          } else if (liveElement.parentNode?.tagName?.toLowerCase() === 'svg' && liveElement.parentNode.classList.contains('svg-crop-wrapper')) {
            wrapper = liveElement.parentNode;
          } else {
            wrapper = liveElement.querySelector('.svg-crop-wrapper');
          }

          let targetImgForFrame = null;

          if (wrapper) {
            const innerImg = wrapper.querySelector('image');
            if (innerImg) {
              targetImgForFrame = innerImg;
              wrapper.parentNode.insertBefore(innerImg, wrapper);
              if (svgImageEl === wrapper) svgImageEl = innerImg;
            }
            wrapper.remove();
          } else if (svgImageEl) {
            targetImgForFrame = svgImageEl;
          }

          if (targetImgForFrame) {
            let targetW, targetH, targetX, targetY;
            let isWPercent = false, isHPercent = false, isXPercent = false, isYPercent = false;

            if (effectiveImageType !== 'Crop') {
              const origWStr = liveElement.getAttribute('data-crop-orig-w') || targetImgForFrame.getAttribute('width') || '100';
              const origHStr = liveElement.getAttribute('data-crop-orig-h') || targetImgForFrame.getAttribute('height') || '100';
              const origXStr = liveElement.getAttribute('data-crop-orig-x') || targetImgForFrame.getAttribute('x') || '0';
              const origYStr = liveElement.getAttribute('data-crop-orig-y') || targetImgForFrame.getAttribute('y') || '0';

              liveElement.removeAttribute('data-crop-orig-w');
              liveElement.removeAttribute('data-crop-orig-h');
              liveElement.removeAttribute('data-crop-orig-x');
              liveElement.removeAttribute('data-crop-orig-y');
              liveElement.removeAttribute('data-crop-data');
              liveElement.removeAttribute('data-saved-crop-data');

              const wAttr = origWStr;
              const hAttr = origHStr;
              const xAttr = origXStr;
              const yAttr = origYStr;

              isWPercent = wAttr.toString().includes('%');
              isHPercent = hAttr.toString().includes('%');
              isXPercent = xAttr.toString().includes('%');
              isYPercent = yAttr.toString().includes('%');

              targetW = parseFloat(wAttr);
              targetH = parseFloat(hAttr);
              targetX = parseFloat(xAttr);
              targetY = parseFloat(yAttr);
            } else {
              const origWStr = liveElement.getAttribute('data-crop-orig-w') || targetImgForFrame.getAttribute('data-crop-orig-w') || targetImgForFrame.getAttribute('width') || '100';
              const origHStr = liveElement.getAttribute('data-crop-orig-h') || targetImgForFrame.getAttribute('data-crop-orig-h') || targetImgForFrame.getAttribute('height') || '100';
              const origXStr = liveElement.getAttribute('data-crop-orig-x') || targetImgForFrame.getAttribute('data-crop-orig-x') || targetImgForFrame.getAttribute('x') || '0';
              const origYStr = liveElement.getAttribute('data-crop-orig-y') || targetImgForFrame.getAttribute('data-crop-orig-y') || targetImgForFrame.getAttribute('y') || '0';

              const origW = parseFloat(origWStr);
              const origH = parseFloat(origHStr);
              const origX = parseFloat(origXStr);
              const origY = parseFloat(origYStr);
              isWPercent = origWStr.toString().includes('%');
              isHPercent = origHStr.toString().includes('%');
              isXPercent = origXStr.toString().includes('%');
              isYPercent = origYStr.toString().includes('%');

              targetW = origW;
              targetH = origH;
              targetX = origX;
              targetY = origY;

              const cropStr = liveElement.getAttribute('data-crop-data') || liveElement.getAttribute('data-saved-crop-data');
              if (cropStr && cropStr !== 'null') {
                try {
                  const crop = JSON.parse(cropStr);
                  const cropX = origX + (origW * parseFloat(crop.left) / 100);
                  const cropY = origY + (origH * parseFloat(crop.top) / 100);
                  const cropW = origW * (parseFloat(crop.width) / 100);
                  const cropH = origH * (parseFloat(crop.height) / 100);

                  targetX = cropX;
                  targetY = cropY;
                  targetW = cropW;
                  targetH = cropH;

                  liveElement.setAttribute('data-saved-crop-data', cropStr);
                  liveElement.removeAttribute('data-crop-data');
                } catch (e) { }
              }
            }

            targetImgForFrame.style.removeProperty('display');
            targetImgForFrame.setAttribute('width', targetW.toString() + (isWPercent ? '%' : ''));
            targetImgForFrame.setAttribute('height', targetH.toString() + (isHPercent ? '%' : ''));
            targetImgForFrame.setAttribute('x', targetX.toString() + (isXPercent ? '%' : ''));
            targetImgForFrame.setAttribute('y', targetY.toString() + (isYPercent ? '%' : ''));

            targetImgForFrame.style.removeProperty('clip-path');
            targetImgForFrame.removeAttribute('clip-path');

            const parMap = { 'Fit': 'meet', 'Fill': 'slice', 'Crop': 'slice', 'Stretch': 'none' };
            let meetOrSlice = parMap[effectiveImageType] || 'meet';
            let parAlign = liveElement.getAttribute('data-crop-align') || 'xMidYMid';
            if (meetOrSlice === 'meet') parAlign = 'xMidYMid';
            if (meetOrSlice === 'none') targetImgForFrame.setAttribute('preserveAspectRatio', 'none');
            else targetImgForFrame.setAttribute('preserveAspectRatio', `${parAlign} ${meetOrSlice}`);

            if (svgImageEl) {
              svgImageEl.style.removeProperty('transform');
              svgImageEl.style.removeProperty('transform-origin');
              svgImageEl.style.removeProperty('transform-box');
            }
          }

          liveElement.style.removeProperty('background-image');
          liveElement.style.removeProperty('background-size');
          liveElement.style.removeProperty('background-position');
          liveElement.style.removeProperty('background-repeat');
          if (liveElement.hasAttribute('data-original-src') && liveElement.tagName?.toLowerCase() === 'img') {
            liveElement.src = liveElement.getAttribute('data-original-src');
          }

          const isCropped = imageType === 'Crop' && (liveElement.getAttribute('data-crop-data') || (selectedElement && selectedElement.getAttribute('data-crop-data')));

          if (isCropped) {
            if (anyR) {
              liveElement.setAttribute('data-effect-radius-tl', radius.tl.toString());
              liveElement.setAttribute('data-effect-radius-tr', radius.tr.toString());
              liveElement.setAttribute('data-effect-radius-br', radius.br.toString());
              liveElement.setAttribute('data-effect-radius-bl', radius.bl.toString());
            } else {
              liveElement.removeAttribute('data-effect-radius-tl');
              liveElement.removeAttribute('data-effect-radius-tr');
              liveElement.removeAttribute('data-effect-radius-br');
              liveElement.removeAttribute('data-effect-radius-bl');
            }
          } else if (anyR) {
            // Radius logic for uncropped images
            const clipVal = `inset(0% 0% 0% 0% round ${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px)`;

            if (liveElement.tagName?.toLowerCase() === 'rect') {
              liveElement.setAttribute('rx', maxR.toString());
              liveElement.style.removeProperty('clip-path');
              liveElement.style.removeProperty('border-radius');
            } else if (svgImageEl && svgImageEl !== liveElement) {
              svgImageEl.style.setProperty('clip-path', clipVal, 'important');
              svgImageEl.style.setProperty('transform-box', 'fill-box', 'important');
              svgImageEl.style.setProperty('border-radius', `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`, 'important');
              liveElement.style.removeProperty('clip-path');
              liveElement.style.removeProperty('border-radius');
            } else {
              liveElement.style.setProperty('clip-path', clipVal, 'important');
              if (liveElement instanceof SVGElement) {
                liveElement.style.setProperty('transform-box', 'fill-box', 'important');
              }
              liveElement.style.setProperty('border-radius', `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`, 'important');
            }

            liveElement.setAttribute('data-effect-radius-tl', radius.tl.toString());
            liveElement.setAttribute('data-effect-radius-tr', radius.tr.toString());
            liveElement.setAttribute('data-effect-radius-br', radius.br.toString());
            liveElement.setAttribute('data-effect-radius-bl', radius.bl.toString());
          } else {
            liveElement.style.removeProperty('clip-path');
            liveElement.style.removeProperty('border-radius');
            liveElement.removeAttribute('clip-path');
            liveElement.removeAttribute('data-effect-radius-tl');
            liveElement.removeAttribute('data-effect-radius-tr');
            liveElement.removeAttribute('data-effect-radius-br');
            liveElement.removeAttribute('data-effect-radius-bl');
            if (liveElement.tagName?.toLowerCase() === 'rect') {
              liveElement.removeAttribute('rx');
              liveElement.removeAttribute('ry');
            }
            if (svgImageEl) {
              svgImageEl.style.removeProperty('clip-path');
              svgImageEl.style.removeProperty('border-radius');
              svgImageEl.removeAttribute('clip-path');
              if (svgImageEl.tagName?.toLowerCase() === 'rect') {
                svgImageEl.removeAttribute('rx');
                svgImageEl.removeAttribute('ry');
              }
            }
          }
        }
      } else {
        // --- HTML: Background Blur Removed ---
        // (Cleaned up from removal)
        liveElement.style.setProperty('backdrop-filter', 'none', 'important');
        liveElement.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        liveElement.style.setProperty('mask-image', 'none', 'important');
        liveElement.style.setProperty('-webkit-mask-image', 'none', 'important');

        // (We removed the duplicate crop block that was conflicting with the actual crop logic above)
        const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover', 'Stretch': 'fill' };
        if (effectiveImageType !== 'Crop') {
          liveElement.style.setProperty('object-fit', fitMap[effectiveImageType] || 'fill', 'important');
        }

        if (anyR) {
          const radiusStr = `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`;
          const clipVal = `inset(0% 0% 0% 0% round ${radiusStr})`;
          if (!isSvgEl) {
            liveElement.style.removeProperty('clip-path');
            liveElement.style.setProperty('border-radius', radiusStr, 'important');
            liveElement.style.setProperty('overflow', 'hidden', 'important');
          } else {
            if (svgImageEl && svgImageEl !== liveElement) {
              svgImageEl.style.setProperty('clip-path', clipVal, 'important');
              svgImageEl.style.setProperty('-webkit-clip-path', clipVal, 'important');
              liveElement.style.removeProperty('clip-path');
              liveElement.style.removeProperty('-webkit-clip-path');
            } else {
              liveElement.style.setProperty('clip-path', clipVal, 'important');
              liveElement.style.setProperty('-webkit-clip-path', clipVal, 'important');
            }
            liveElement.style.setProperty('transform-box', 'fill-box', 'important');
            if (liveElement.tagName && liveElement.tagName.toLowerCase() === 'rect') {
              const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
              liveElement.setAttribute('rx', maxR.toString());
            }
          }
        } else {
          if (!isSvgEl) {
            liveElement.style.removeProperty('clip-path');
            liveElement.style.removeProperty('border-radius');
            liveElement.style.removeProperty('overflow');
          } else {
            liveElement.style.removeProperty('clip-path');
            liveElement.style.removeProperty('-webkit-clip-path');
            if (svgImageEl && svgImageEl !== liveElement) {
              svgImageEl.style.removeProperty('clip-path');
              svgImageEl.style.removeProperty('-webkit-clip-path');
            }
            if (liveElement.tagName && liveElement.tagName.toLowerCase() === 'rect') {
              liveElement.removeAttribute('rx');
              liveElement.removeAttribute('ry');
            }
          }
        }
        liveElement.style.removeProperty('transform');
        liveElement.style.removeProperty('translate');
        liveElement.style.removeProperty('scale');
      }

      // --- Source Management (restore original / apply cropped) ---
      const srcEl = isSvgEl ? svgImageEl : liveElement;
      const originalSrc = liveElement.getAttribute('data-original-src');
      const croppedSrc = liveElement.getAttribute('data-cropped-src');

      if (imageType === 'Crop' && croppedSrc) {
        const currentSrc = getSrc(srcEl);
        if (currentSrc !== croppedSrc && !currentSrc?.startsWith('data:image/gif')) {
          setSrc(srcEl, croppedSrc);
          setPreviewSrc(croppedSrc);
        }
      } else if (originalSrc) {
        // Do NOT overwrite the transparent pixel trick used for cropping HTML images
        const currentSrc = getSrc(srcEl);
        if (currentSrc !== originalSrc && !currentSrc?.startsWith('data:image/gif')) {
          setSrc(srcEl, originalSrc);
          setPreviewSrc(originalSrc);
        }
        // Clean up CSS crop artifacts when not in Crop mode
        if (!isSvgEl) {
          liveElement.style.removeProperty('clip-path');
          liveElement.style.removeProperty('-webkit-clip-path');
          liveElement.style.removeProperty('transform');
          liveElement.style.removeProperty('translate');
          liveElement.style.removeProperty('scale');
        }
      } else if (imageType !== 'Crop') {
        if (!isSvgEl) {
          liveElement.style.removeProperty('clip-path');
          liveElement.style.removeProperty('-webkit-clip-path');
          liveElement.style.removeProperty('transform');
          liveElement.style.removeProperty('translate');
          liveElement.style.removeProperty('scale');
        }
      }

      // --- Inner Shadow & Slideshow (HTML: overlays; SVG: sibling rect) ---
      let shadowString = '';
      if (activeEffects.includes('Inner Shadow')) {
        const ds = effectSettings['Inner Shadow'];
        const alpha = (ds.opacity !== undefined ? ds.opacity : 35) / 100;
        const color = ds.color || '#000000';
        let r = 0, g = 0, b = 0;
        if (color.startsWith('#')) {
          const hex = color.replace('#', '');
          if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16); g = parseInt(hex[1] + hex[1], 16); b = parseInt(hex[2] + hex[2], 16);
          } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16); g = parseInt(hex.substring(2, 4), 16); b = parseInt(hex.substring(4, 6), 16);
          }
        }
        const rgbaStr = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        shadowString = `inset ${ds.x || 0}px ${ds.y || 0}px ${ds.blur || 0}px ${ds.spread || 0}px ${rgbaStr}`;
      }

      if (isSvgEl) {
        const isContainer = ['g', 'svg'].includes(liveElement.tagName?.toLowerCase());
        const targetContainer = isContainer ? liveElement : (liveElement.parentElement || liveElement);
        const ownerId = liveElement.id || selectedLayerId;

        if (!isContainer) {
          const buggyOverlay = liveElement.querySelector('.svg-inner-shadow-rect');
          if (buggyOverlay) buggyOverlay.remove();
        }

        // Use data-owner to find the overlay belonging to THIS specific element
        let overlay = targetContainer.querySelector(`.svg-inner-shadow-rect[data-owner="${ownerId}"]`);
        if (!overlay) {
          // Fallback: find any unowned overlay in container (for backwards compat)
          overlay = isContainer ? targetContainer.querySelector('.svg-inner-shadow-rect') : null;
        }
        let oldOverlay = targetContainer.querySelector('.svg-inner-shadow-overlay');
        if (oldOverlay) oldOverlay.remove(); // Clean up old foreignObject approach

        let filterId = liveElement.getAttribute('data-inner-shadow-filter-id');

        if (activeEffects.includes('Inner Shadow')) {
          const ds = effectSettings['Inner Shadow'];
          const alpha = (ds.opacity !== undefined ? ds.opacity : 35) / 100;
          const color = ds.color || '#000000';

          if (!filterId) {
            filterId = 'inner-shadow-' + Math.random().toString(36).substr(2, 9);
            liveElement.setAttribute('data-inner-shadow-filter-id', filterId);
          }

          let svgDefs = liveElement.ownerSVGElement?.querySelector('defs');
          if (!svgDefs && liveElement.ownerSVGElement) {
            svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            liveElement.ownerSVGElement.prepend(svgDefs);
          }

          if (svgDefs) {
            let filterEl = svgDefs.querySelector(`#${filterId}`);
            if (!filterEl) {
              filterEl = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
              filterEl.id = filterId;
              filterEl.setAttribute('x', '-50%');
              filterEl.setAttribute('y', '-50%');
              filterEl.setAttribute('width', '200%');
              filterEl.setAttribute('height', '200%');
              svgDefs.appendChild(filterEl);
            }

            while (filterEl.firstChild) filterEl.removeChild(filterEl.firstChild);

            const feOffset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset');
            feOffset.setAttribute('dx', ds.x || 0);
            feOffset.setAttribute('dy', ds.y || 0);

            const feBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
            feBlur.setAttribute('stdDeviation', (ds.blur || 0) / 2);
            feBlur.setAttribute('result', 'offset-blur');

            const feComp1 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
            feComp1.setAttribute('operator', 'out');
            feComp1.setAttribute('in', 'SourceAlpha');
            feComp1.setAttribute('in2', 'offset-blur');
            feComp1.setAttribute('result', 'inverse');

            const feFlood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
            feFlood.setAttribute('flood-color', color);
            feFlood.setAttribute('flood-opacity', alpha);
            feFlood.setAttribute('result', 'color');

            const feComp2 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
            feComp2.setAttribute('operator', 'in');
            feComp2.setAttribute('in', 'color');
            feComp2.setAttribute('in2', 'inverse');
            feComp2.setAttribute('result', 'shadow');

            filterEl.appendChild(feOffset);
            filterEl.appendChild(feBlur);
            filterEl.appendChild(feComp1);
            filterEl.appendChild(feFlood);
            filterEl.appendChild(feComp2);
          }

          if (!overlay || overlay.tagName.toLowerCase() !== 'path') {
            if (overlay) overlay.remove();
            overlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            overlay.classList.add('svg-inner-shadow-rect');
            overlay.setAttribute('data-owner', ownerId);
            overlay.style.pointerEvents = 'none';
            overlay.setAttribute('fill', 'white'); // Must have solid fill to generate SourceAlpha
            if (!isContainer && liveElement.parentElement) {
              liveElement.parentElement.insertBefore(overlay, liveElement.nextSibling);
            } else {
              targetContainer.appendChild(overlay);
            }
          }

          let targetEl = isContainer ? (svgImageEl || liveElement) : liveElement;
          if (svgImageEl && svgImageEl.parentNode?.classList.contains('svg-crop-wrapper')) {
            targetEl = svgImageEl.parentNode;
          }
          let box = { x: 0, y: 0, width: 100, height: 100 };
          try { box = (svgImageEl || targetEl).getBBox(); } catch (e) { }

          let ixStr = liveElement.getAttribute('data-crop-orig-x') || svgImageEl?.getAttribute('x') || targetEl.getAttribute('x') || '0';
          let iyStr = liveElement.getAttribute('data-crop-orig-y') || svgImageEl?.getAttribute('y') || targetEl.getAttribute('y') || '0';
          let iwStr = liveElement.getAttribute('data-crop-orig-w') || svgImageEl?.getAttribute('width') || targetEl.getAttribute('width') || '100%';
          let ihStr = liveElement.getAttribute('data-crop-orig-h') || svgImageEl?.getAttribute('height') || targetEl.getAttribute('height') || '100%';

          let ix = ixStr.toString().includes('%') ? box.x : parseFloat(ixStr) || 0;
          let iy = iyStr.toString().includes('%') ? box.y : parseFloat(iyStr) || 0;
          let iw = iwStr.toString().includes('%') ? box.width : parseFloat(iwStr) || 100;
          let ih = ihStr.toString().includes('%') ? box.height : parseFloat(ihStr) || 100;

          // Apply crop mathematically to inner shadow dimensions
          const effImgTypeInner = liveElement.getAttribute('data-object-fit') || imageType;
          const cropStr = targetEl.getAttribute('data-crop-data') || liveElement.getAttribute('data-crop-data');
          if (effImgTypeInner === 'Crop' && cropStr && cropStr !== 'null') {
            try {
              const crop = JSON.parse(cropStr);
              ix = ix + (parseFloat(crop.left) / 100) * iw;
              iy = iy + (parseFloat(crop.top) / 100) * ih;
              iw = iw * (parseFloat(crop.width) / 100);
              ih = ih * (parseFloat(crop.height) / 100);
            } catch (e) { }
          }

          if (isContainer) {
            overlay.removeAttribute('transform');
          } else {
            overlay.setAttribute('transform', targetEl.getAttribute('transform') || '');
          }

          const maxIR = Math.min(iw, ih) / 2;
          const i_tl = Math.max(0, Math.min(radius.tl || 0, maxIR));
          const i_tr = Math.max(0, Math.min(radius.tr || 0, maxIR));
          const i_br = Math.max(0, Math.min(radius.br || 0, maxIR));
          const i_bl = Math.max(0, Math.min(radius.bl || 0, maxIR));

          overlay.setAttribute('d', getPathD(ix, iy, Math.max(0, iw), Math.max(0, ih), i_tl, i_tr, i_br, i_bl));
          overlay.setAttribute('filter', `url(#${filterId})`);
        } else {
          if (overlay) overlay.remove();
          if (filterId && liveElement.ownerSVGElement) {
            const f = liveElement.ownerSVGElement.querySelector(`#${filterId}`);
            if (f) f.remove();
          }
        }
      } else {
        let overlay = liveElement.querySelector('.inner-shadow-overlay') || liveElement.parentElement?.querySelector('.inner-shadow-overlay');
        if (shadowString) {
          const targetParent = (['IMG', 'VIDEO', 'IFRAME'].includes(liveElement.tagName)) ? liveElement.parentElement : liveElement;
          if (!overlay && targetParent) {
            overlay = document.createElement('div');
            overlay.className = 'inner-shadow-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '99999';
            overlay.style.boxSizing = 'border-box';
            if (window.getComputedStyle(targetParent).position === 'static') {
              targetParent.style.position = 'relative';
            }
            targetParent.appendChild(overlay);
          }
          if (overlay) {
            overlay.style.boxShadow = shadowString;
            const anyR = radius.tl > 0 || radius.tr > 0 || radius.br > 0 || radius.bl > 0;
            overlay.style.borderRadius = anyR ? `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px` : '0px';
          }
        } else if (overlay) {
          overlay.remove();
        }
      }
      // Deck Effect for Slideshow (Only for HTML containers, skip for SVG)
      const isSvgParent = selectedElement.parentElement && selectedElement.parentElement instanceof SVGElement;
      if (isSlideshow && selectedElement.parentElement && !isSvgParent) {
        let stack1 = selectedElement.parentElement.querySelector('.slideshow-stack-1');
        let stack2 = selectedElement.parentElement.querySelector('.slideshow-stack-2');
        if (!stack1) {
          stack1 = document.createElement('div');
          stack1.className = 'slideshow-stack-1';
          stack1.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:-1;background:white;border:1px solid rgba(0,0,0,0.05);box-shadow:0 4px 12px rgba(0,0,0,0.08)';
          selectedElement.parentElement.insertBefore(stack1, selectedElement);
        }
        if (!stack2) {
          stack2 = document.createElement('div');
          stack2.className = 'slideshow-stack-2';
          stack2.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:-2;background:white;border:1px solid rgba(0,0,0,0.05);box-shadow:0 4px 12px rgba(0,0,0,0.08)';
          selectedElement.parentElement.insertBefore(stack2, selectedElement);
        }
        const commonRadius = selectedElement.style.borderRadius || '12px';
        stack1.style.borderRadius = commonRadius;
        stack1.style.transform = 'translate(6px, 6px) rotate(1.5deg)';
        stack1.style.display = 'block';
        stack2.style.borderRadius = commonRadius;
        stack2.style.transform = 'translate(12px, 12px) rotate(3deg)';
        stack2.style.display = 'block';
        selectedElement.style.setProperty('border', '4px solid white', 'important');
        selectedElement.style.setProperty('box-shadow', '0 8px 25px rgba(0,0,0,0.12)', 'important');
        selectedElement.style.setProperty('z-index', '1', 'important');
        if (window.getComputedStyle(selectedElement.parentElement).position === 'static') {
          selectedElement.parentElement.style.position = 'relative';
        }
        selectedElement.parentElement.style.setProperty('overflow', 'visible', 'important');
      } else if (!isSvgParent) {
        selectedElement.parentElement?.querySelector('.slideshow-stack-1')?.remove();
        selectedElement.parentElement?.querySelector('.slideshow-stack-2')?.remove();
        selectedElement.style.removeProperty('border');
        selectedElement.style.removeProperty('z-index');
        if (!activeEffects.includes('Drop Shadow')) selectedElement.style.removeProperty('box-shadow');
      }
      if (activeEffects.includes('Drop Shadow') || activeEffects.includes('Blur')) {
        if (liveElement.parentElement) liveElement.parentElement.style.setProperty('overflow', 'visible', 'important');
      }
      // --- Background Color ---
      let fillLayerParent = liveElement;
      let isPatternShape = false;
      let patternEl = null;

      if (tagLower !== 'g' && liveElement.hasAttribute('fill') && liveElement.getAttribute('fill')?.toString().includes('url(#')) {
        isPatternShape = true;
        const fillUrl = liveElement.getAttribute('fill');
        const match = fillUrl.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
        if (match) {
          patternEl = liveElement.closest('svg')?.querySelector(`pattern[id="${match[1].trim()}"]`) || document.getElementById(match[1].trim());
          if (patternEl) fillLayerParent = patternEl;
        }
      }

      const tagLowerForFill = liveElement.tagName?.toLowerCase();
      const isShapeNodeForFill = ['rect', 'circle', 'ellipse', 'polygon', 'polyline', 'path'].includes(tagLowerForFill);

      if (!isShapeNodeForFill || isPatternShape) {
        let fillLayer = fillLayerParent.querySelector('.image-fill-layer');
        if (backgroundColor.fill !== 'transparent' && backgroundColor.fill !== 'none') {
          if (!fillLayer || fillLayer.tagName.toLowerCase() !== (!isPatternShape ? 'path' : 'rect')) {
            if (fillLayer) fillLayer.remove();
            fillLayer = document.createElementNS('http://www.w3.org/2000/svg', !isPatternShape ? 'path' : 'rect');
            fillLayer.classList.add('image-fill-layer');
            fillLayer.setAttribute('data-name', 'Fill Color');
            fillLayer.style.pointerEvents = 'none';
          }
          if (fillLayerParent.firstChild !== fillLayer) {
            fillLayerParent.insertBefore(fillLayer, fillLayerParent.firstChild);
          }
          let targetElForFill = svgImageEl || liveElement;
          if (svgImageEl && svgImageEl.parentNode?.classList.contains('svg-crop-wrapper')) {
            targetElForFill = svgImageEl.parentNode;
          }

          let bBox = { x: 0, y: 0, width: 100, height: 100 };
          try { bBox = (svgImageEl || targetElForFill).getBBox(); } catch (e) { }

          let bxStr = liveElement.getAttribute('data-crop-orig-x') || svgImageEl?.getAttribute('x') || targetElForFill.getAttribute('x') || '0';
          let byStr = liveElement.getAttribute('data-crop-orig-y') || svgImageEl?.getAttribute('y') || targetElForFill.getAttribute('y') || '0';
          let bwStr = liveElement.getAttribute('data-crop-orig-w') || svgImageEl?.getAttribute('width') || targetElForFill.getAttribute('width') || '100%';
          let bhStr = liveElement.getAttribute('data-crop-orig-h') || svgImageEl?.getAttribute('height') || targetElForFill.getAttribute('height') || '100%';

          let bx = bxStr.toString().includes('%') ? bBox.x : parseFloat(bxStr) || 0;
          let by = byStr.toString().includes('%') ? bBox.y : parseFloat(byStr) || 0;
          let bw = bwStr.toString().includes('%') ? bBox.width : parseFloat(bwStr) || 100;
          let bh = bhStr.toString().includes('%') ? bBox.height : parseFloat(bhStr) || 100;

          const effImgTypeFill = liveElement.getAttribute('data-object-fit') || imageType;
          const cropStrFill = targetElForFill.getAttribute('data-crop-data') || liveElement.getAttribute('data-crop-data');
          if (effImgTypeFill === 'Crop' && cropStrFill && cropStrFill !== 'null') {
            try {
              const crop = JSON.parse(cropStrFill);
              bx = bx + (parseFloat(crop.left) / 100) * bw;
              by = by + (parseFloat(crop.top) / 100) * bh;
              bw = bw * (parseFloat(crop.width) / 100);
              bh = bh * (parseFloat(crop.height) / 100);
            } catch (e) { }
          }

          if (isPatternShape && patternEl) {
            fillLayer.setAttribute('x', '0');
            fillLayer.setAttribute('y', '0');
            fillLayer.setAttribute('width', patternEl.getAttribute('width') || '100%');
            fillLayer.setAttribute('height', patternEl.getAttribute('height') || '100%');
            fillLayer.removeAttribute('d');
          } else {
            const maxR = Math.min(bw, bh) / 2;
            const tl = Math.max(0, Math.min(radius.tl || 0, maxR));
            const tr = Math.max(0, Math.min(radius.tr || 0, maxR));
            const br = Math.max(0, Math.min(radius.br || 0, maxR));
            const bl = Math.max(0, Math.min(radius.bl || 0, maxR));

            let d = `M ${bx + tl} ${by}`;
            d += ` L ${bx + bw - tr} ${by}`;
            if (tr > 0) d += ` A ${tr} ${tr} 0 0 1 ${bx + bw} ${by + tr}`;
            d += ` L ${bx + bw} ${by + bh - br}`;
            if (br > 0) d += ` A ${br} ${br} 0 0 1 ${bx + bw - br} ${by + bh}`;
            d += ` L ${bx + bl} ${by + bh}`;
            if (bl > 0) d += ` A ${bl} ${bl} 0 0 1 ${bx} ${by + bh - bl}`;
            d += ` L ${bx} ${by + tl}`;
            if (tl > 0) d += ` A ${tl} ${tl} 0 0 1 ${bx + tl} ${by}`;
            d += ` Z`;

            fillLayer.setAttribute('d', d);
            fillLayer.removeAttribute('x');
            fillLayer.removeAttribute('y');
            fillLayer.removeAttribute('width');
            fillLayer.removeAttribute('height');
          }

          let parsedFill = null;
          if (backgroundColor.fill && backgroundColor.fill.toLowerCase().includes('gradient')) {
            parsedFill = parseGradient(backgroundColor.fill);
          }

          if (parsedFill && parsedFill.stops) {
            const fillAngleVal = (parsedFill.angle !== undefined && parsedFill.angle !== null) ? parsedFill.angle : 0;
            const fillRadiusVal = (parsedFill.radius !== undefined && parsedFill.radius !== null) ? parsedFill.radius : 100;
            fillLayer.setAttribute('data-fill-type', 'gradient');
            fillLayer.setAttribute('data-fill-stops', JSON.stringify(parsedFill.stops));
            fillLayer.setAttribute('data-fill-gradient-type', parsedFill.type.toLowerCase() || 'linear');
            fillLayer.setAttribute('data-fill-angle', fillAngleVal);
            fillLayer.setAttribute('data-fill-radius', fillRadiusVal);
            // syncGradient reads non-data-prefixed attributes
            fillLayer.setAttribute('fill-type', 'gradient');
            fillLayer.setAttribute('fill-stops', JSON.stringify(parsedFill.stops));
            fillLayer.setAttribute('fill-gradient-type', parsedFill.type.toLowerCase() || 'linear');
            fillLayer.setAttribute('fill-angle', fillAngleVal);
            fillLayer.setAttribute('fill-radius', fillRadiusVal);
            syncGradient(liveElement.ownerDocument || document, fillLayer, 'fill');

            liveElement.setAttribute('data-fill-type', 'gradient');
            liveElement.setAttribute('data-fill-stops', JSON.stringify(parsedFill.stops));
            liveElement.setAttribute('data-fill-gradient-type', parsedFill.type.toLowerCase() || 'linear');
            liveElement.setAttribute('data-fill-angle', fillAngleVal);
            liveElement.setAttribute('data-fill-radius', fillRadiusVal);
          } else {
            fillLayer.setAttribute('fill', backgroundColor.fill);
            if (fillLayer.style) fillLayer.style.removeProperty('fill');
            fillLayer.removeAttribute('data-fill-type');
            fillLayer.removeAttribute('data-fill-stops');
            fillLayer.removeAttribute('fill-type');
            fillLayer.removeAttribute('fill-stops');
            fillLayer.removeAttribute('fill-gradient-type');
            fillLayer.removeAttribute('fill-angle');
            fillLayer.removeAttribute('fill-radius');
            liveElement.removeAttribute('data-fill-type');
            liveElement.removeAttribute('data-fill-stops');
            liveElement.removeAttribute('data-fill-gradient-type');
            liveElement.removeAttribute('data-fill-angle');
            liveElement.removeAttribute('data-fill-radius');
          }

          fillLayer.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());

          if (!isPatternShape) {
            fillLayer.removeAttribute('rx');
            if (fillLayerParent === liveElement && liveElement.tagName?.toLowerCase() === 'g') {
              fillLayer.removeAttribute('transform');
            } else if (targetElForFill.getAttribute('transform')) {
              fillLayer.setAttribute('transform', targetElForFill.getAttribute('transform'));
            } else {
              fillLayer.removeAttribute('transform');
            }
          }

          liveElement.setAttribute('data-fill-color', backgroundColor.fill);
          liveElement.setAttribute('data-fill-opacity', (backgroundColor.fillOpacity / 100).toString());
        } else {
          if (fillLayer) fillLayer.remove();
          liveElement.removeAttribute('data-fill-color');
          liveElement.removeAttribute('data-fill-opacity');
        }
      } else if (backgroundColor.fill !== 'transparent' && backgroundColor.fill !== 'none' && !backgroundColor.fill.startsWith('url(')) {
        if (isShapeNodeForFill) liveElement.setAttribute('fill', backgroundColor.fill);
        liveElement.setAttribute('data-fill-color', backgroundColor.fill);
        liveElement.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());
        liveElement.setAttribute('data-fill-opacity', (backgroundColor.fillOpacity / 100).toString());
      } else if (backgroundColor.fill === 'transparent' || backgroundColor.fill === 'none') {
        // Only remove fill if we aren't currently using a pattern!
        const currentFill = liveElement.getAttribute('fill') || '';
        if (!currentFill.startsWith('url(')) {
          if (isShapeNodeForFill) liveElement.removeAttribute('fill');
          liveElement.removeAttribute('data-fill-color');
        }
      }

      if (backgroundColor.stroke === 'transparent' || backgroundColor.stroke === 'none') {
        liveElement.removeAttribute('stroke');
        liveElement.removeAttribute('data-stroke-color');

        if (tagLower === 'image' && liveElement.parentElement) {
          const strokeOverlay = liveElement.parentElement.querySelector('.svg-image-stroke-overlay');
          if (strokeOverlay) strokeOverlay.remove();
        } else if (typeof liveElement.querySelector === 'function') {
          const strokeOverlay = liveElement.querySelector('.svg-image-stroke-overlay');
          if (strokeOverlay) strokeOverlay.remove();
        }

        if (!isSvgEl) {
          liveElement.style.borderColor = 'transparent';
          liveElement.style.borderWidth = '0px';
        }
      } else {
        const isShapeNode = ['rect', 'circle', 'ellipse', 'polygon', 'polyline', 'path'].includes(liveElement.tagName?.toLowerCase());
        const isImageNode = !isShapeNode && svgImageEl && (svgImageEl.tagName?.toLowerCase() === 'image' || svgImageEl.tagName?.toLowerCase() === 'foreignobject');

        liveElement.setAttribute('data-stroke-color', backgroundColor.stroke);
        liveElement.setAttribute('data-stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());
        liveElement.setAttribute('data-stroke-position', backgroundColor.strokePosition || 'Center');
        liveElement.setAttribute('data-stroke-width', backgroundColor.strokeWeight.toString());

        if (backgroundColor.strokeDashStyle === 'Dashed') {
          const dashArray = (backgroundColor.strokeDasharrayValue && backgroundColor.strokeDasharrayValue !== 'none') ? backgroundColor.strokeDasharrayValue : `${backgroundColor.strokeDashLength || 10},${backgroundColor.strokeDashGap || 10}`;
          liveElement.setAttribute('data-stroke-dasharray', dashArray);
        } else {
          liveElement.setAttribute('data-stroke-dasharray', 'none');
        }

        if (!isImageNode) {
          let strokeStopsNonImg = backgroundColor.strokeStops;
          let strokeGradTypeNonImg = backgroundColor.strokeGradientType || 'linear';
          let strokeAngleNonImg = backgroundColor.strokeAngle || '0';
          let strokeRadiusNonImg = backgroundColor.strokeRadius || '100';

          if (backgroundColor.strokeType === 'gradient' && !strokeStopsNonImg && backgroundColor.stroke && backgroundColor.stroke.includes('gradient')) {
            const parsed = parseGradient(backgroundColor.stroke);
            if (parsed && parsed.stops) {
              strokeStopsNonImg = JSON.stringify(parsed.stops.map(s => ({
                color: s.color,
                offset: s.offset,
                opacity: s.opacity / 100
              })));
              strokeGradTypeNonImg = parsed.type.toLowerCase();
              strokeAngleNonImg = (parsed.angle || 0).toString();
              strokeRadiusNonImg = (parsed.radius || 100).toString();
            }
          }

          if (backgroundColor.strokeType === 'gradient' && strokeStopsNonImg) {
            liveElement.setAttribute('stroke-type', 'gradient');
            liveElement.setAttribute('stroke-gradient-type', strokeGradTypeNonImg);
            liveElement.setAttribute('stroke-stops', strokeStopsNonImg);
            liveElement.setAttribute('stroke-angle', strokeAngleNonImg);
            liveElement.setAttribute('stroke-radius', strokeRadiusNonImg);
            syncGradient(liveElement.ownerDocument || document, liveElement, 'stroke');
          } else {
            liveElement.removeAttribute('stroke-type');
            liveElement.removeAttribute('stroke-gradient-type');
            liveElement.removeAttribute('stroke-stops');
            liveElement.removeAttribute('stroke-angle');
            liveElement.removeAttribute('stroke-radius');
            liveElement.setAttribute('stroke', backgroundColor.stroke);
            if (liveElement.style) liveElement.style.removeProperty('stroke');
          }

          liveElement.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());
          liveElement.setAttribute('stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());
          if (backgroundColor.strokeDashStyle === 'Dashed') {
            const dashArray = backgroundColor.strokeDasharrayValue || `${backgroundColor.strokeDashLength || 10},${backgroundColor.strokeDashGap || 10}`;
            liveElement.setAttribute('stroke-dasharray', dashArray);
          } else {
            liveElement.setAttribute('stroke-dasharray', 'none');
          }
        } else {
          liveElement.removeAttribute('stroke');
          liveElement.removeAttribute('stroke-width');
          liveElement.removeAttribute('stroke-dasharray');
        }
        liveElement.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
        liveElement.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

        // Dynamic Stroke Overlay for SVG images and foreignObjects (Slideshows)
        if (svgImageEl && (svgImageEl.tagName?.toLowerCase() === 'image' || svgImageEl.tagName?.toLowerCase() === 'foreignobject')) {
          const isImageElement = liveElement.tagName?.toLowerCase() === 'image';
          const targetContainer = isImageElement ? (liveElement.parentElement || liveElement) : liveElement;

          if (isImageElement) {
            const buggyOverlay = liveElement.querySelector('.svg-image-stroke-overlay');
            if (buggyOverlay) buggyOverlay.remove();
          }

          let strokeOverlay = targetContainer.querySelector('.svg-image-stroke-overlay');
          if (!strokeOverlay || strokeOverlay.tagName.toLowerCase() !== 'path') {
            if (strokeOverlay) strokeOverlay.remove();
            strokeOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            strokeOverlay.classList.add('svg-image-stroke-overlay');
            strokeOverlay.style.pointerEvents = 'none';
            if (isImageElement && liveElement.parentElement) {
              liveElement.parentElement.insertBefore(strokeOverlay, liveElement.nextSibling);
            } else {
              targetContainer.appendChild(strokeOverlay);
            }
          }

          if (strokeOverlay._obs) {
            strokeOverlay._obs.disconnect();
          }

          const syncOverlay = () => {
            if (!strokeOverlay.isConnected) return;
            const targetEl = svgImageEl || liveElement;
            if (liveElement.getAttribute('data-is-image-group') !== 'true' && targetContainer !== liveElement) {
              strokeOverlay.setAttribute('transform', targetEl.getAttribute('transform') || '');
              strokeOverlay.style.transform = targetEl.style.transform;
              strokeOverlay.style.translate = targetEl.style.translate;
              strokeOverlay.style.scale = targetEl.style.scale;
              strokeOverlay.style.rotate = targetEl.style.rotate;
              strokeOverlay.style.transformOrigin = targetEl.style.transformOrigin;
            } else {
              strokeOverlay.removeAttribute('transform');
              strokeOverlay.style.removeProperty('transform');
              strokeOverlay.style.removeProperty('translate');
              strokeOverlay.style.removeProperty('scale');
              strokeOverlay.style.removeProperty('rotate');
              strokeOverlay.style.removeProperty('transform-origin');
            }

            let targetElForStrokeSync = svgImageEl || liveElement;
            if (svgImageEl && svgImageEl.parentNode?.tagName?.toLowerCase() === 'svg' && svgImageEl.parentNode.classList.contains('svg-crop-wrapper')) {
              targetElForStrokeSync = svgImageEl.parentNode;
            }

            let bBox = { x: 0, y: 0, width: 100, height: 100 };
            try { bBox = (svgImageEl || targetElForStrokeSync).getBBox(); } catch (e) { }

            let bxStr = liveElement.getAttribute('data-crop-orig-x') || svgImageEl?.getAttribute('x') || targetElForStrokeSync.getAttribute('x') || '0';
            let byStr = liveElement.getAttribute('data-crop-orig-y') || svgImageEl?.getAttribute('y') || targetElForStrokeSync.getAttribute('y') || '0';
            let bwStr = liveElement.getAttribute('data-crop-orig-w') || svgImageEl?.getAttribute('width') || targetElForStrokeSync.getAttribute('width') || '100%';
            let bhStr = liveElement.getAttribute('data-crop-orig-h') || svgImageEl?.getAttribute('height') || targetElForStrokeSync.getAttribute('height') || '100%';

            let bx = bxStr.toString().includes('%') ? bBox.x : parseFloat(bxStr) || 0;
            let by = byStr.toString().includes('%') ? bBox.y : parseFloat(byStr) || 0;
            let bw = bwStr.toString().includes('%') ? bBox.width : parseFloat(bwStr) || 100;
            let bh = bhStr.toString().includes('%') ? bBox.height : parseFloat(bhStr) || 100;

            const effImgTypeStrokeSync = liveElement.getAttribute('data-object-fit') || imageType;
            const cropStrStroke = targetElForStrokeSync.getAttribute('data-crop-data') || liveElement.getAttribute('data-crop-data');
            if (effImgTypeStrokeSync === 'Crop' && cropStrStroke && cropStrStroke !== 'null') {
              try {
                const crop = JSON.parse(cropStrStroke);
                bx = bx + (parseFloat(crop.left) / 100) * bw;
                by = by + (parseFloat(crop.top) / 100) * bh;
                bw = bw * (parseFloat(crop.width) / 100);
                bh = bh * (parseFloat(crop.height) / 100);
              } catch (e) { }
            }

            let scaleX = 1;
            let scaleY = 1;
            try {
              const ctm = targetElForStrokeSync.getScreenCTM();
              if (ctm) {
                scaleX = Math.abs(ctm.a) || 1;
                scaleY = Math.abs(ctm.d) || 1;
              }
            } catch (e) { }

            const swSync = backgroundColor.strokeWeight || 0;
            const posSync = backgroundColor.strokePosition || 'Center';
            const offsetX = (swSync / 2) / scaleX;
            const offsetY = (swSync / 2) / scaleY;

            let ox = bx, oy = by, ow = bw, oh = bh;
            if (posSync === 'Inside') {
              ox += offsetX; oy += offsetY; ow -= offsetX * 2; oh -= offsetY * 2;
            } else if (posSync === 'Outside') {
              ox -= offsetX; oy -= offsetY; ow += offsetX * 2; oh += offsetY * 2;
            }

            const getPathDLocal = (x, y, w, h, tlv, trv, brv, blv) => {
              return `M ${x + tlv} ${y}
                H ${x + w - trv}
                A ${trv} ${trv} 0 0 1 ${x + w} ${y + trv}
                V ${y + h - brv}
                A ${brv} ${brv} 0 0 1 ${x + w - brv} ${y + h}
                H ${x + blv}
                A ${blv} ${blv} 0 0 1 ${x} ${y + h - blv}
                V ${y + tlv}
                A ${tlv} ${tlv} 0 0 1 ${x + tlv} ${y} Z`;
            };

            const tl_val = radius.tl || 0;
            const tr_val = radius.tr || 0;
            const br_val = radius.br || 0;
            const bl_val = radius.bl || 0;

            let c_tl = tl_val;
            let c_tr = tr_val;
            let c_br = br_val;
            let c_bl = bl_val;

            if (posSync === 'Inside') {
              c_tl = Math.max(0, tl_val - offsetX);
              c_tr = Math.max(0, tr_val - offsetX);
              c_br = Math.max(0, br_val - offsetX);
              c_bl = Math.max(0, bl_val - offsetX);
            } else if (posSync === 'Outside') {
              c_tl = tl_val > 0 ? tl_val + offsetX : 0;
              c_tr = tr_val > 0 ? tr_val + offsetX : 0;
              c_br = br_val > 0 ? br_val + offsetX : 0;
              c_bl = bl_val > 0 ? bl_val + offsetX : 0;
            }

            const maxR = Math.min(ow, oh) / 2;
            c_tl = Math.max(0, Math.min(c_tl, maxR));
            c_tr = Math.max(0, Math.min(c_tr, maxR));
            c_br = Math.max(0, Math.min(c_br, maxR));
            c_bl = Math.max(0, Math.min(c_bl, maxR));

            strokeOverlay.setAttribute('d', getPathDLocal(ox, oy, Math.max(0, ow), Math.max(0, oh), c_tl, c_tr, c_br, c_bl));

            // Ensure the strokeOverlay actually gets the dashed properties
            if (backgroundColor.strokeDashStyle === 'Dashed') {
              const dashArray = (backgroundColor.strokeDasharrayValue && backgroundColor.strokeDasharrayValue !== 'none') ? backgroundColor.strokeDasharrayValue : `${backgroundColor.strokeDashLength || 10},${backgroundColor.strokeDashGap || 10}`;
              strokeOverlay.setAttribute('stroke-dasharray', dashArray);
            } else {
              strokeOverlay.removeAttribute('stroke-dasharray');
            }
          };

          strokeOverlay._obs = new MutationObserver(syncOverlay);
          strokeOverlay._obs.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style', 'data-stroke-dasharray', 'stroke-dasharray'] });
          if (svgImageEl && svgImageEl !== liveElement) {
            strokeOverlay._obs.observe(svgImageEl, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
          }

          let targetElForStroke = svgImageEl || liveElement;
          if (svgImageEl && svgImageEl.parentNode?.tagName?.toLowerCase() === 'svg' && svgImageEl.parentNode.classList.contains('svg-crop-wrapper')) {
            targetElForStroke = svgImageEl.parentNode;
          }

          let bBox = { x: 0, y: 0, width: 100, height: 100 };
          try { bBox = (svgImageEl || targetElForStroke).getBBox(); } catch (e) { }

          let bxStr = liveElement.getAttribute('data-crop-orig-x') || svgImageEl?.getAttribute('x') || targetElForStroke.getAttribute('x') || '0';
          let byStr = liveElement.getAttribute('data-crop-orig-y') || svgImageEl?.getAttribute('y') || targetElForStroke.getAttribute('y') || '0';
          let bwStr = liveElement.getAttribute('data-crop-orig-w') || svgImageEl?.getAttribute('width') || targetElForStroke.getAttribute('width') || '100%';
          let bhStr = liveElement.getAttribute('data-crop-orig-h') || svgImageEl?.getAttribute('height') || targetElForStroke.getAttribute('height') || '100%';

          let bx = bxStr.toString().includes('%') ? bBox.x : parseFloat(bxStr) || 0;
          let by = byStr.toString().includes('%') ? bBox.y : parseFloat(byStr) || 0;
          let bw = bwStr.toString().includes('%') ? bBox.width : parseFloat(bwStr) || 100;
          let bh = bhStr.toString().includes('%') ? bBox.height : parseFloat(bhStr) || 100;

          const effImgTypeStroke = liveElement.getAttribute('data-object-fit') || imageType;
          const cropStrStroke = targetElForStroke.getAttribute('data-crop-data') || liveElement.getAttribute('data-crop-data');
          if (effImgTypeStroke === 'Crop' && cropStrStroke && cropStrStroke !== 'null') {
            try {
              const crop = JSON.parse(cropStrStroke);
              bx = bx + (parseFloat(crop.left) / 100) * bw;
              by = by + (parseFloat(crop.top) / 100) * bh;
              bw = bw * (parseFloat(crop.width) / 100);
              bh = bh * (parseFloat(crop.height) / 100);
            } catch (e) { }
          }

          const pos = backgroundColor.strokePosition || 'Center';
          const sw = backgroundColor.strokeWeight || 0;

          // Calculate exact local offset needed by querying the current screen transform matrix.
          // Since the global CSS enforces vector-effect: non-scaling-stroke, the stroke width
          // is fixed on screen. We must inversely scale our coordinate offset so it exactly
          // matches half the stroke width on screen.
          let scaleX = 1;
          let scaleY = 1;
          try {
            const ctm = targetElForStroke.getScreenCTM();
            if (ctm) {
              scaleX = Math.abs(ctm.a) || 1;
              scaleY = Math.abs(ctm.d) || 1;
            }
          } catch (e) { }

          const offsetX = (sw / 2) / scaleX;
          const offsetY = (sw / 2) / scaleY;

          let ox = bx, oy = by, ow = bw, oh = bh;
          if (pos === 'Inside') {
            ox += offsetX; oy += offsetY; ow -= offsetX * 2; oh -= offsetY * 2;
          } else if (pos === 'Outside') {
            ox -= offsetX; oy -= offsetY; ow += offsetX * 2; oh += offsetY * 2;
          }

          let tl = radius.tl || 0;
          let tr = radius.tr || 0;
          let br = radius.br || 0;
          let bl = radius.bl || 0;

          if (pos === 'Inside') {
            tl = Math.max(0, tl - offsetX);
            tr = Math.max(0, tr - offsetX);
            br = Math.max(0, br - offsetX);
            bl = Math.max(0, bl - offsetX);
          } else if (pos === 'Outside') {
            tl = tl > 0 ? tl + offsetX : 0;
            tr = tr > 0 ? tr + offsetX : 0;
            br = br > 0 ? br + offsetX : 0;
            bl = bl > 0 ? bl + offsetX : 0;
          }

          const maxR = Math.min(ow, oh) / 2;
          const c_tl = Math.max(0, Math.min(tl, maxR));
          const c_tr = Math.max(0, Math.min(tr, maxR));
          const c_br = Math.max(0, Math.min(br, maxR));
          const c_bl = Math.max(0, Math.min(bl, maxR));

          strokeOverlay.setAttribute('d', getPathD(ox, oy, Math.max(0, ow), Math.max(0, oh), c_tl, c_tr, c_br, c_bl));

          strokeOverlay.setAttribute('d', getPathD(ox, oy, Math.max(0, ow), Math.max(0, oh), c_tl, c_tr, c_br, c_bl));

          if (liveElement.getAttribute('data-is-image-group') !== 'true' && targetContainer !== liveElement) {
            strokeOverlay.setAttribute('transform', targetElForStroke.getAttribute('transform') || '');
            strokeOverlay.style.transform = targetElForStroke.style.transform;
            strokeOverlay.style.translate = targetElForStroke.style.translate;
            strokeOverlay.style.scale = targetElForStroke.style.scale;
            strokeOverlay.style.rotate = targetElForStroke.style.rotate;
            strokeOverlay.style.transformOrigin = targetElForStroke.style.transformOrigin;
          } else {
            strokeOverlay.removeAttribute('transform');
            strokeOverlay.style.removeProperty('transform');
            strokeOverlay.style.removeProperty('translate');
            strokeOverlay.style.removeProperty('scale');
            strokeOverlay.style.removeProperty('rotate');
            strokeOverlay.style.removeProperty('transform-origin');
          }

          strokeOverlay.setAttribute('fill', 'none');

          liveElement.setAttribute('data-stroke-color', backgroundColor.stroke);
          liveElement.setAttribute('data-stroke-type', backgroundColor.strokeType);

          let strokeStops = backgroundColor.strokeStops;
          let strokeGradType = backgroundColor.strokeGradientType || 'linear';
          let strokeAngle = backgroundColor.strokeAngle || '0';
          let strokeRadius = backgroundColor.strokeRadius || '100';

          if (backgroundColor.strokeType === 'gradient' && !strokeStops && backgroundColor.stroke && backgroundColor.stroke.includes('gradient')) {
            const parsed = parseGradient(backgroundColor.stroke);
            if (parsed && parsed.stops) {
              strokeStops = JSON.stringify(parsed.stops.map(s => ({
                color: s.color,
                offset: s.offset,
                opacity: s.opacity / 100
              })));
              strokeGradType = parsed.type.toLowerCase();
              strokeAngle = (parsed.angle || 0).toString();
              strokeRadius = (parsed.radius || 100).toString();
            }
          }

          if (backgroundColor.strokeType === 'gradient' && strokeStops) {
            liveElement.setAttribute('data-stroke-gradient-type', strokeGradType);
            liveElement.setAttribute('data-stroke-stops', strokeStops);
            liveElement.setAttribute('data-stroke-angle', strokeAngle);
            liveElement.setAttribute('data-stroke-radius', strokeRadius);

            strokeOverlay.setAttribute('stroke-type', 'gradient');
            strokeOverlay.setAttribute('stroke-gradient-type', strokeGradType);
            strokeOverlay.setAttribute('stroke-stops', strokeStops);
            strokeOverlay.setAttribute('stroke-angle', strokeAngle);
            strokeOverlay.setAttribute('stroke-radius', strokeRadius);
            syncGradient(liveElement.ownerDocument || document, strokeOverlay, 'stroke');
          } else {
            liveElement.removeAttribute('data-stroke-gradient-type');
            liveElement.removeAttribute('data-stroke-stops');
            liveElement.removeAttribute('data-stroke-angle');
            liveElement.removeAttribute('data-stroke-radius');

            strokeOverlay.removeAttribute('stroke-type');
            strokeOverlay.removeAttribute('stroke-gradient-type');
            strokeOverlay.removeAttribute('stroke-stops');
            strokeOverlay.removeAttribute('stroke-angle');
            strokeOverlay.removeAttribute('stroke-radius');

            strokeOverlay.setAttribute('stroke', backgroundColor.stroke);
            if (strokeOverlay.style) strokeOverlay.style.removeProperty('stroke');
          }

          strokeOverlay.setAttribute('d', getPathD(ox, oy, Math.max(0, ow), Math.max(0, oh), c_tl, c_tr, c_br, c_bl));

          strokeOverlay.setAttribute('stroke-width', sw.toString());
          strokeOverlay.setAttribute('stroke-opacity', ((backgroundColor.strokeOpacity / 100) * (opacity / 100)).toString());

          if (backgroundColor.strokeDashStyle === 'Dashed') {
            const dashArray = backgroundColor.strokeDasharrayValue || `${backgroundColor.strokeDashLength || 10},${backgroundColor.strokeDashGap || 10}`;
            strokeOverlay.setAttribute('stroke-dasharray', dashArray);
          } else {
            strokeOverlay.removeAttribute('stroke-dasharray');
          }

          strokeOverlay.removeAttribute('clip-path');
          strokeOverlay.removeAttribute('mask');

          strokeOverlay.setAttribute('data-img-stroke-position', pos); // Renamed to avoid MainEditor syncOverlays
          strokeOverlay.removeAttribute('data-stroke-position');

          // Forcefully cleanup any orphaned MainEditor overlays that might have been applied previously
          if (liveElement.parentElement) {
            const orphans = liveElement.parentElement.querySelectorAll(`.svg-shape-stroke-overlay[data-target="${liveElement.id}"], .svg-shape-stroke-overlay[data-target=""]`);
            orphans.forEach(o => o.remove());
          }

          strokeOverlay.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
          strokeOverlay.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

          // Removed the drop shadow filter from stroke overlay to prevent hollow double-shadows over the image

          // Add clipPath to clip the image to prevent sharp corners from bleeding
          const defsOwner = isImageElement ? (liveElement.ownerSVGElement || liveElement.parentElement || liveElement) : liveElement;

          let defs = defsOwner.querySelector('defs');
          if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defsOwner.insertBefore(defs, defsOwner.firstChild);
          }
          const clipId = `clip-${liveElement.id || Date.now()}`;
          let clip = defs.querySelector(`clipPath[id="${clipId}"]`);
          if (!clip) {
            clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
            clip.id = clipId;
            const clipPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            clipPathEl.classList.add('svg-image-clip-path');
            clip.appendChild(clipPathEl);
            defs.appendChild(clip);
          }

          const clipPathEl = clip.querySelector('path');
          if (clipPathEl) {
            const innerMaxR = Math.min(bw, bh) / 2;
            const inner_tl = Math.max(0, Math.min(tl, innerMaxR));
            const inner_tr = Math.max(0, Math.min(tr, innerMaxR));
            const inner_br = Math.max(0, Math.min(br, innerMaxR));
            const inner_bl = Math.max(0, Math.min(bl, innerMaxR));

            let clipBx = bx;
            let clipBy = by;
            if (targetElForStroke && targetElForStroke.tagName?.toLowerCase() === 'svg') {
              clipBx = 0;
              clipBy = 0;
            }
            clipPathEl.setAttribute('d', getPathD(clipBx, clipBy, Math.max(0, bw), Math.max(0, bh), inner_tl, inner_tr, inner_br, inner_bl));
          }

          const isStrokeCropped = imageType === 'Crop' && (liveElement.getAttribute('data-crop-data') || (selectedElement && selectedElement.getAttribute('data-crop-data')));

          if (targetElForStroke) {
            let innerGroupForClip = liveElement.querySelector('.image-inner-content');
            if (innerGroupForClip && targetElForStroke === liveElement) {
              innerGroupForClip.setAttribute('clip-path', `url(#${clip.id})`);
              innerGroupForClip.style.setProperty('clip-path', `url(#${clip.id})`, 'important');
              innerGroupForClip.style.removeProperty('-webkit-clip-path');
              targetElForStroke.removeAttribute('clip-path');
              targetElForStroke.style.removeProperty('clip-path');
            } else {
              targetElForStroke.setAttribute('clip-path', `url(#${clip.id})`);
              targetElForStroke.style.setProperty('clip-path', `url(#${clip.id})`, 'important');
              targetElForStroke.style.removeProperty('-webkit-clip-path');
            }
          }
        }

        if (!isSvgEl) {
          const hexToRgba = (hex, alpha) => {
            if (!hex || hex === 'transparent' || hex === 'none') return 'transparent';
            if (hex.startsWith('rgba')) return hex;
            if (hex.startsWith('#')) {
              let c = hex.substring(1).split('');
              if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
              c = '0x' + c.join('');
              return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
            }
            return hex;
          };
          const pos = backgroundColor.strokePosition || 'Center';
          const color = hexToRgba(backgroundColor.stroke, backgroundColor.strokeOpacity / 100);
          const weight = backgroundColor.strokeWeight;
          const style = backgroundColor.strokeDashStyle === 'Dashed' ? 'dashed' : 'solid';

          if (pos === 'Inside') {
            liveElement.style.borderWidth = `${weight}px`;
            liveElement.style.borderStyle = style;
            liveElement.style.borderColor = color;
            liveElement.style.outline = 'none';
          } else if (pos === 'Outside') {
            liveElement.style.borderWidth = `0px`;
            liveElement.style.outline = `${weight}px ${style} ${color}`;
            liveElement.style.outlineOffset = `0px`;
          } else {
            liveElement.style.borderWidth = `0px`;
            liveElement.style.outline = `${weight}px ${style} ${color}`;
            liveElement.style.outlineOffset = `-${weight / 2}px`;
          }
        }
      }

      // Enforce proper Z-indexing for SVG overlays to prevent the stroke from covering the inner shadow
      const isImgNode = liveElement.tagName?.toLowerCase() === 'image';
      if (isImgNode && liveElement.parentElement) {
        const strokeOl = liveElement.parentElement.querySelector('.svg-image-stroke-overlay');
        const innerShadowOl = liveElement.parentElement.querySelector('.svg-inner-shadow-rect');
        // Ensure inner shadow is drawn on top of the stroke overlay
        if (strokeOl && innerShadowOl) {
          // If inner shadow is physically before the stroke overlay, move it after
          if (innerShadowOl.compareDocumentPosition(strokeOl) & Node.DOCUMENT_POSITION_FOLLOWING) {
            liveElement.parentElement.insertBefore(innerShadowOl, strokeOl.nextSibling);
          }
        }
      }

      // --- STRICT LAYER REORDERING FOR IMAGE GROUPS ---
      if (liveElement.getAttribute('data-is-image-group') === 'true') {
        const dropShadow = liveElement.querySelector('.svg-drop-shadow-caster');
        const fillLayer = liveElement.querySelector('.image-fill-layer');
        const innerShadow = liveElement.querySelector('.svg-inner-shadow-rect') || liveElement.querySelector('.svg-inner-shadow-overlay');
        const stroke = liveElement.querySelector('.svg-image-stroke-overlay');

        let innerGroup = liveElement.querySelector('.image-inner-content');
        if (!innerGroup) {
          innerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          innerGroup.classList.add('image-inner-content');
          innerGroup.setAttribute('data-name', 'Image Content');
          liveElement.appendChild(innerGroup);
        }

        // Apply clip paths that might be stuck on liveElement to innerGroup
        const currentClip = liveElement.style.getPropertyValue('clip-path') || liveElement.getAttribute('clip-path');
        if (currentClip && currentClip !== 'none') {
          innerGroup.style.setProperty('clip-path', currentClip, 'important');
          innerGroup.setAttribute('clip-path', liveElement.getAttribute('clip-path') || '');
          liveElement.style.removeProperty('clip-path');
          liveElement.removeAttribute('clip-path');
        }

        if (dropShadow) { dropShadow.setAttribute('data-name', 'Drop Shadow'); liveElement.appendChild(dropShadow); }

        liveElement.appendChild(innerGroup);

        if (fillLayer) { fillLayer.setAttribute('data-name', 'Fill Color'); innerGroup.appendChild(fillLayer); }

        // Find the main image content (it could be an <svg> crop wrapper or raw <image> or pattern rect)
        // If there's an image that isn't a child of crop wrapper, append it
        if (svgImageEl) {
          const imageNode = svgImageEl.closest('svg.svg-crop-wrapper') ||
            svgImageEl.closest('rect') ||
            svgImageEl;
          if (imageNode && (imageNode.parentNode === liveElement || imageNode.parentNode === innerGroup)) {
            innerGroup.appendChild(imageNode);
          }
        }

        if (innerShadow) { innerShadow.setAttribute('data-name', 'Inner Shadow'); innerGroup.appendChild(innerShadow); }
        if (stroke) { stroke.setAttribute('data-name', 'Stroke'); liveElement.appendChild(stroke); }
      }

      // Debounce onUpdate
      // but we only serialize + commit to page state after the user pauses.
      // This prevents rapid slider drags from causing constant SVG re-renders
      // which would repeatedly destroy/recreate the selected DOM element.
      if (onUpdateRef.current) {
        clearTimeout(onUpdateTimerRef.current);
        onUpdateTimerRef.current = setTimeout(() => {
          onUpdateRef.current();
        }, 400);
      }
    } finally {
      // Clear any existing reset timer to extend the guard period
      if (isUpdatingDOMTimeoutRef.current) clearTimeout(isUpdatingDOMTimeoutRef.current);

      if (observerRef.current) observerRef.current.takeRecords();

      // Keep isUpdatingDOM true for long enough to cover the onUpdate debounce (500ms) 
      // plus the subsequent React re-render cycle.
      const resetDelay = 0; // Set to 0 to enable 60fps drag syncing
      isUpdatingDOMTimeoutRef.current = setTimeout(() => {
        isUpdatingDOM.current = false;
        isUpdatingDOMTimeoutRef.current = null;
      }, resetDelay);
    }
  }, [
    selectedElement,
    filters,
    activeEffects,
    effectSettings,
    opacity,
    imageType,
    radius,
    isSlideshow,
    backgroundColor,
    backgroundColor.fill,
    backgroundColor.fillOpacity,
    backgroundColor.stroke,
    backgroundColor.strokeOpacity,
    backgroundColor.strokeWeight,
    backgroundColor.strokeDashStyle,
    backgroundColor.strokeDashLength,
    backgroundColor.strokeDashGap,
    backgroundColor.strokePosition,
    backgroundColor.strokeLinecap,
    backgroundColor.strokeDasharrayValue
  ]);

  useEffect(() => {
    applyVisualsRef.current = applyVisuals;
    applyVisuals();
  }, [applyVisuals]);

  const updateRadius = (corner, value) => {
    const val = Math.max(0, Number(value) || 0);
    const next = isRadiusLinked ? { tl: val, tr: val, br: val, bl: val } : { ...radius, [corner]: val };
    setRadius(next);
    // applyVisuals handles DOM via dependency array
  };

  const updateEffectSetting = (effect, key, value) => {
    setEffectSettings(prev => ({ ...prev, [effect]: { ...prev[effect], [key]: value } }));
  };

  const handleColorPick = async (effectName) => {
    if (!window.EyeDropper) return;
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      updateEffectSetting(effectName, 'color', result.sRGBHex);
    } catch (e) {
      console.error('Color selection cancelled or failed', e);
    }
  };



  if (!selectedElement) return null;

  return (
    <div className="relative flex flex-col gap-[1vw] w-full max-w-[25vw] font-sans">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0.25vw; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 0.5vw; }
        .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
        .custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
        .custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.55vw; cursor: pointer; transition: box-shadow 0.15s ease; position: relative; z-index: 2; }
        .custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
        
        .image-editor-toggle {
          appearance: none;
          width: 2.75vw;
          height: 1.35vw;
          border-radius: 1vw;
          position: relative;
          cursor: pointer;
          transition: 0.3s;
          background: #E5E7EB;
        }
        .image-editor-toggle:checked {
          background: #4D47FF;
        }
        .image-editor-toggle::before {
          content: "";
          position: absolute;
          width: 1.1vw;
          height: 1.1vw;
          border-radius: 50%;
          top: 50%;
          left: 0.125vw;
          transform: translateY(-50%);
          background: white;
          transition: 0.3s;
          box-shadow: 0 0.1vw 0.2vw rgba(0,0,0,0.2);
        }
        .image-editor-toggle:checked::before {
          left: 1.5vw;
        }
      `}</style>
      <input
        id="image-editor-upload-input"
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".jpg, .jpeg, .png"
        multiple={isSlideshow}
        className="hidden"
      />



      {isMainPanelOpen && (
        <div className="flex flex-col gap-[0.4vw]">

          {isSlideshow ? (
            /* ── SLIDESHOW MODE: show only SlideshowProperties ── */
            <SlideshowProperties
              selectedElement={actualSlideshowEl}
              activePageIndex={activePageIndex}
              isOpen={openSubSection === 'slideshow'}
              onToggle={() => setOpenSubSection(openSubSection === 'slideshow' ? null : 'slideshow')}
              onUpdate={onUpdate}
              opacity={opacity}
              onUpdateOpacity={(v) => setOpacity(v)}
              setPreviewSrc={setPreviewSrc}
              setIsUpdatingDOM={(val) => { isUpdatingDOM.current = val; }}
              currentPageVId={currentPageVId}
              flipbookVId={flipbookVId}
              folderName={folderName}
              flipbookName={flipbookName}
              onDisableSlideshow={() => {
                setIsSlideshow(false);
                if (actualSlideshowEl) {
                  const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                  const liveEl = pageContainer?.querySelector(`[id="${actualSlideshowEl.id}"]`) || actualSlideshowEl;

                  let firstImageSrc = null;
                  const rawSlideshow = liveEl.getAttribute('data-slideshow') || actualSlideshowEl.getAttribute('data-slideshow');
                  if (rawSlideshow) {
                    try {
                      const parsed = JSON.parse(rawSlideshow);
                      if (parsed.images && parsed.images.length > 0) {
                        firstImageSrc = parsed.images[0].url || parsed.images[0].src;
                      }
                    } catch (e) { }
                  }

                  // Remove from both to ensure sync
                  const targets = [actualSlideshowEl, liveEl];
                  targets.forEach(el => {
                    el.removeAttribute('data-is-slideshow');
                    el.removeAttribute('data-slideshow');
                    el.removeAttribute('data-active-index');
                    el._slideshowManual = false;
                    delete el._lastSlideTime;
                    if (el.dataset) {
                      delete el.dataset.slideshowInitialized;
                    }

                    if (firstImageSrc) {
                      const imgEl = el.tagName?.toLowerCase() === 'image' || el.tagName?.toLowerCase() === 'img' ? el : el.querySelector('image, img');
                      if (imgEl) {
                        imgEl.setAttribute('href', firstImageSrc);
                        if (imgEl.hasAttribute('data-src')) {
                          imgEl.setAttribute('data-src', firstImageSrc);
                        }
                      }
                    }

                    if (el.dataset) {
                      delete el.dataset.isSlideshow;
                    }
                  });

                  if (actualSlideshowEl?.id) {
                    const localKey = `slideshow_${flipbookVId || 'local'}_${actualSlideshowEl.id}`;
                    try { localStorage.removeItem(localKey); } catch (e) { }
                  }

                  // Cleanup DOM artifacts and clones
                  const container = liveEl.parentElement || liveEl;
                  if (container) {
                    const dots = container.querySelectorAll('.ss-dots-container, .editor-ss-dots-wrap');
                    dots.forEach(d => d.remove());
                    const btns = container.querySelectorAll('.ss-nav-btn, .editor-ss-nav');
                    btns.forEach(b => b.remove());
                  }

                  // Aggressively remove any leftover clones that might have been mid-animation
                  const svgRoot = liveEl.closest('svg');
                  if (svgRoot) {
                    svgRoot.querySelectorAll('[data-is-slideshow="true"]').forEach(ghost => {
                      if (ghost !== actualSlideshowEl && ghost !== liveEl) ghost.remove();
                    });
                  }

                  if (pageContainer) {
                    pageContainer.querySelectorAll('.editor-ss-overlay').forEach(el => el.remove());
                  }

                  if (onUpdate) onUpdate({ shouldRefresh: true });
                }
              }}
            />
          ) : (
            /* ── IMAGE MODE: full image panel ── */
            <>
              {/* Header */}
              <div className="flex items-center gap-[0.5vw]">
                <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Image Properties</span>
                <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
              </div>

              <div className="flex items-center justify-between py-[0.25vw]">
                <span className="text-[0.75vw] text-gray-800">Turn on Slideshow to add more images</span>
                <button
                  onClick={() => {
                    const next = !isSlideshow;
                    setIsSlideshow(next);
                    if (actualSlideshowEl) {
                      const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                      const liveEl = pageContainer?.querySelector(`[id="${actualSlideshowEl.id}"]`) || actualSlideshowEl;

                      if (next) {
                        let dataStr = liveEl.getAttribute('data-slideshow') || actualSlideshowEl.getAttribute('data-slideshow');

                        if (!dataStr) {
                          const initialData = {
                            settings: {
                              imageFitType: 'Fill All',
                              transitionEffect: 'Linear',
                              showDots: true,
                              showArrows: true,
                              showNav: true,
                              navStyle: 1,
                              navIconColor: '#000000',
                              dotColor: '#000000',
                              dotOpacity: 100,
                              autoSlide: true,
                              autoPlay: true,
                              speed: 3,
                              infiniteLoop: true,
                              dragToSlide: false
                            },
                            images: [{
                              id: Date.now(),
                              url: previewSrc,
                              name: 'Slide 1',
                              isUploading: false
                            }]
                          };
                          dataStr = JSON.stringify(initialData);
                        }

                        // Apply to both to ensure sync
                        [actualSlideshowEl, liveEl].forEach(el => {
                          // Removed broken crop-baking logic. Slideshow handles patterns correctly.
                          el.setAttribute('data-is-slideshow', 'true');
                          el.setAttribute('data-slideshow', dataStr);
                          el.setAttribute('data-active-index', '0');
                        });
                      } else {
                        let firstImageSrc = null;
                        const rawSlideshow = liveEl.getAttribute('data-slideshow') || actualSlideshowEl.getAttribute('data-slideshow');
                        if (rawSlideshow) {
                          try {
                            const parsed = JSON.parse(rawSlideshow);
                            if (parsed.images && parsed.images.length > 0) {
                              firstImageSrc = parsed.images[0].url || parsed.images[0].src;
                            }
                          } catch (e) { }
                        }

                        // Remove from both
                        [actualSlideshowEl, liveEl].forEach(el => {
                          el.removeAttribute('data-is-slideshow');
                          el.removeAttribute('data-slideshow');
                          el.removeAttribute('data-active-index');
                          el._slideshowManual = false;
                          delete el._lastSlideTime;
                          if (el.dataset) {
                            delete el.dataset.slideshowInitialized;
                          }

                          if (firstImageSrc) {
                            const imgEl = el.tagName?.toLowerCase() === 'image' || el.tagName?.toLowerCase() === 'img' ? el : el.querySelector('image, img');
                            if (imgEl) {
                              imgEl.setAttribute('href', firstImageSrc);
                              if (imgEl.hasAttribute('data-src')) {
                                imgEl.setAttribute('data-src', firstImageSrc);
                              }
                            }
                          }

                          if (el.dataset) {
                            delete el.dataset.slideshow;
                            delete el.dataset.isSlideshow;
                          }
                        });

                        if (actualSlideshowEl?.id) {
                          const localKey = `slideshow_${flipbookVId || 'local'}_${actualSlideshowEl.id}`;
                          try { localStorage.removeItem(localKey); } catch (e) { }
                        }

                        // Cleanup DOM artifacts and clones
                        const container = liveEl.parentElement || liveEl;
                        if (container) {
                          const dots = container.querySelectorAll('.ss-dots-container, .editor-ss-dots-wrap');
                          dots.forEach(d => d.remove());
                          const btns = container.querySelectorAll('.ss-nav-btn, .editor-ss-nav');
                          btns.forEach(b => b.remove());
                        }

                        // Aggressively remove any leftover clones
                        const svgRoot = liveEl.closest('svg');
                        if (svgRoot) {
                          svgRoot.querySelectorAll('[data-is-slideshow="true"]').forEach(ghost => {
                            if (ghost !== actualSlideshowEl && ghost !== liveEl) ghost.remove();
                          });
                        }

                        const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                        if (pageContainer) {
                          pageContainer.querySelectorAll('.editor-ss-overlay').forEach(el => el.remove());
                        }
                      }
                      if (onUpdate) onUpdate({ shouldRefresh: true });
                    }
                  }}
                  className={`relative block w-[2.2vw] h-[1.2vw] rounded-[1vw] transition-all duration-200 ease-in-out shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.3)] outline-none shrink-0 cursor-pointer ${isSlideshow ? 'bg-[#4A3AFF]' : 'bg-[#bbbbbb]'}`}
                >
                  <div className={`absolute top-[0.1vw] w-[1vw] h-[1vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.4)] ${isSlideshow ? 'left-[1.1vw]' : 'left-[0.1vw]'}`} />
                </button>
              </div>

              {/* Image fix type + single image + upload */}
              <div className="flex items-center justify-between relative z-20">
                <div className="flex items-center gap-[0.5vw] flex-1">
                  <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Image fix type</span>
                  <div className="h-[0px] flex-1 border-t border-dashed border-gray-300 mx-[0.25vw]" />
                </div>
                <div className="relative">
                  <div className="flex gap-[0.25vw] items-center">
                    <button
                      onClick={() => setShowImageTypeDropdown(!showImageTypeDropdown)}
                      className="flex items-center justify-between w-[6.5vw] py-[0.35vw] px-[0.75vw] bg-white border border-gray-200 rounded-[0.45vw] shadow-xs hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                    >
                      <span className="text-[0.85vw] font-normal text-gray-700">{imageType}</span>
                      <ChevronDown size="0.9vw" className={`text-gray-400 transition-transform ${showImageTypeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {showImageTypeDropdown && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setShowImageTypeDropdown(false)} />
                      <div className="absolute right-0 top-full mt-[0.5vw] w-[6.5vw] bg-white border border-gray-100 rounded-[0.5vw] shadow-2xl overflow-hidden z-[100] flex flex-col py-[0.25vw] animate-in fade-in zoom-in-95 duration-150">
                        {['Fit', 'Fill', 'Stretch', 'Crop'].map((type) => (
                          <button
                            key={type}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowImageTypeDropdown(false);

                              // Clear isHydrating immediately so applyVisuals won't be blocked
                              isHydrating.current = false;

                              if (type === 'Crop') {
                                const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                                const liveEl = (selectedLayerId && pageContainer)
                                  ? pageContainer.querySelector(`[id="${selectedLayerId}"]`)
                                  : selectedElement;
                                if (liveEl) {
                                  const previousFit = (liveEl.getAttribute('data-object-fit') && liveEl.getAttribute('data-object-fit') !== 'Crop')
                                    ? liveEl.getAttribute('data-object-fit')
                                    : (imageType !== 'Crop' ? imageType : (liveEl.getAttribute('data-crop-underlying-fit') || 'Fit'));

                                  liveEl.setAttribute('data-object-fit', 'Crop');
                                  liveEl.setAttribute('data-crop-underlying-fit', previousFit);

                                  const imgEl = getSvgImageEl(liveEl) || liveEl.querySelector('image, video');
                                  if (imgEl) {
                                    const origW = liveEl.getAttribute('data-crop-orig-w') || imgEl.getAttribute('width') || '100';
                                    const origH = liveEl.getAttribute('data-crop-orig-h') || imgEl.getAttribute('height') || '100';
                                    const origX = liveEl.getAttribute('data-crop-orig-x') || imgEl.getAttribute('x') || '0';
                                    const origY = liveEl.getAttribute('data-crop-orig-y') || imgEl.getAttribute('y') || '0';
                                    liveEl.setAttribute('data-crop-orig-w', origW);
                                    liveEl.setAttribute('data-crop-orig-h', origH);
                                    liveEl.setAttribute('data-crop-orig-x', origX);
                                    liveEl.setAttribute('data-crop-orig-y', origY);

                                    if (previousFit === 'Fill' && (!liveEl.hasAttribute('data-crop-data') || liveEl.getAttribute('data-crop-data') === 'null')) {
                                      const url = imgEl.getAttribute('href') || imgEl.getAttribute('src');
                                      if (url) {
                                        const tempImg = new window.Image();
                                        tempImg.onload = () => {
                                          const nw = tempImg.naturalWidth;
                                          const nh = tempImg.naturalHeight;
                                          if (nw > 0 && nh > 0) {
                                            const boxW = parseFloat(origW);
                                            const boxH = parseFloat(origH);
                                            const boxAspect = boxW / boxH;
                                            const imgAspect = nw / nh;

                                            let scaledW = boxW;
                                            let scaledH = boxH;
                                            if (imgAspect > boxAspect) {
                                              scaledH = boxH;
                                              scaledW = boxH * imgAspect;
                                            } else {
                                              scaledW = boxW;
                                              scaledH = boxW / imgAspect;
                                            }

                                            const offX = (scaledW - boxW) / 2;
                                            const offY = (scaledH - boxH) / 2;

                                            liveEl.setAttribute('data-crop-orig-w', scaledW);
                                            liveEl.setAttribute('data-crop-orig-h', scaledH);
                                            liveEl.setAttribute('data-crop-orig-x', parseFloat(origX) - offX);
                                            liveEl.setAttribute('data-crop-orig-y', parseFloat(origY) - offY);

                                            imgEl.setAttribute('width', scaledW);
                                            imgEl.setAttribute('height', scaledH);
                                            imgEl.setAttribute('x', parseFloat(origX) - offX);
                                            imgEl.setAttribute('y', parseFloat(origY) - offY);

                                            const leftPct = (offX / scaledW) * 100;
                                            const topPct = (offY / scaledH) * 100;
                                            const widthPct = (boxW / scaledW) * 100;
                                            const heightPct = (boxH / scaledH) * 100;

                                            imgEl.setAttribute('preserveAspectRatio', 'none');
                                            imgEl.style.setProperty('object-fit', 'fill', 'important');

                                            liveEl.setAttribute('data-crop-data', JSON.stringify({
                                              left: leftPct, top: topPct, width: widthPct, height: heightPct, offX: 0, offY: 0, scale: 1
                                            }));

                                            window.dispatchEvent(new CustomEvent('force-crop-update', { detail: { id: liveEl.id } }));
                                          }
                                        };
                                        tempImg.src = url;
                                      }

                                      imgEl.setAttribute('preserveAspectRatio', 'xMidYMid slice');
                                      imgEl.style.setProperty('object-fit', 'cover', 'important');
                                      liveEl.setAttribute('data-crop-data', JSON.stringify({ left: 0, top: 0, width: 100, height: 100, offX: 0, offY: 0, scale: 1 }));
                                    } else {
                                      const parMap = { 'Fit': 'xMidYMid meet', 'Fill': 'xMidYMid slice', 'Stretch': 'none' };
                                      const fitCssMap = { 'Fit': 'contain', 'Fill': 'cover', 'Stretch': 'fill' };
                                      const parVal = parMap[previousFit] || 'xMidYMid meet';
                                      const cssVal = fitCssMap[previousFit] || 'contain';
                                      imgEl.setAttribute('preserveAspectRatio', parVal);
                                      imgEl.style.setProperty('object-fit', cssVal, 'important');
                                      if (!liveEl.hasAttribute('data-crop-data') || liveEl.getAttribute('data-crop-data') === 'null') {
                                        liveEl.setAttribute('data-crop-data', JSON.stringify({ left: 0, top: 0, width: 100, height: 100, offX: 0, offY: 0, scale: 1 }));
                                      }
                                    }
                                  }
                                }
                                setImageType('Crop');
                                stateRef.current.imageType = 'Crop';
                                applyVisuals();
                                return;
                              }

                              // If switching AWAY from Crop, keep current cropped bounding box size and clear crop attributes
                              if (imageType === 'Crop') {
                                const pageContainerTmp = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                                const liveElTmp = (selectedLayerId && pageContainerTmp)
                                  ? pageContainerTmp.querySelector(`[id="${selectedLayerId}"]`)
                                  : selectedElement;
                                if (liveElTmp) {
                                  const svgRoot = liveElTmp.ownerSVGElement;
                                  const clipEl = svgRoot?.querySelector(`[id="crop-group-clip-${liveElTmp.id}"], [id="crop-clip-${liveElTmp.id}"]`);
                                  let croppedX = null, croppedY = null, croppedW = null, croppedH = null;

                                  if (clipEl && clipEl.firstElementChild) {
                                    const r = clipEl.firstElementChild;
                                    croppedX = parseFloat(r.getAttribute('x'));
                                    croppedY = parseFloat(r.getAttribute('y'));
                                    croppedW = parseFloat(r.getAttribute('width'));
                                    croppedH = parseFloat(r.getAttribute('height'));
                                  }

                                  if (!croppedW || !croppedH || isNaN(croppedW) || isNaN(croppedH)) {
                                    const origW = parseFloat(liveElTmp.getAttribute('data-crop-orig-w') || '100');
                                    const origH = parseFloat(liveElTmp.getAttribute('data-crop-orig-h') || '100');
                                    const origX = parseFloat(liveElTmp.getAttribute('data-crop-orig-x') || '0');
                                    const origY = parseFloat(liveElTmp.getAttribute('data-crop-orig-y') || '0');
                                    const cropStr = liveElTmp.getAttribute('data-crop-data');
                                    if (cropStr) {
                                      try {
                                        const cd = JSON.parse(cropStr);
                                        croppedX = origX + (origW * (cd.left || 0)) / 100;
                                        croppedY = origY + (origH * (cd.top || 0)) / 100;
                                        croppedW = origW * (cd.width || 100) / 100;
                                        croppedH = origH * (cd.height || 100) / 100;
                                      } catch (e) { }
                                    }
                                  }

                                  const imgEl = getSvgImageEl(liveElTmp) || liveElTmp.querySelector('image, video');
                                  if (croppedW > 0 && croppedH > 0) {
                                    if (imgEl) {
                                      imgEl.removeAttribute('transform');
                                      imgEl.style.removeProperty('transform');
                                      imgEl.style.removeProperty('transform-origin');
                                      imgEl.style.removeProperty('transform-box');
                                      imgEl.setAttribute('x', croppedX);
                                      imgEl.setAttribute('y', croppedY);
                                      imgEl.setAttribute('width', croppedW);
                                      imgEl.setAttribute('height', croppedH);
                                    }
                                    if (typeof liveElTmp.setAttribute === 'function' && liveElTmp.tagName?.toLowerCase() !== 'g') {
                                      liveElTmp.setAttribute('x', croppedX);
                                      liveElTmp.setAttribute('y', croppedY);
                                      liveElTmp.setAttribute('width', croppedW);
                                      liveElTmp.setAttribute('height', croppedH);
                                    }

                                    const innerGroup = liveElTmp.querySelector('.image-inner-content, .svg-crop-wrapper');
                                    if (innerGroup) {
                                      innerGroup.removeAttribute('transform');
                                      innerGroup.style.removeProperty('transform');
                                    }

                                    liveElTmp.setAttribute('data-crop-orig-x', croppedX);
                                    liveElTmp.setAttribute('data-crop-orig-y', croppedY);
                                    liveElTmp.setAttribute('data-crop-orig-w', croppedW);
                                    liveElTmp.setAttribute('data-crop-orig-h', croppedH);
                                  }

                                  liveElTmp.style.removeProperty('clip-path');
                                  liveElTmp.style.removeProperty('-webkit-clip-path');
                                  liveElTmp.removeAttribute('clip-path');
                                  liveElTmp.removeAttribute('data-crop-data');
                                  liveElTmp.removeAttribute('data-effect-crop-inset');
                                  liveElTmp.removeAttribute('data-directional-crop');
                                  if (svgRoot) {
                                    const clip1 = svgRoot.querySelector(`[id="crop-clip-${liveElTmp.id}"]`);
                                    if (clip1) clip1.remove();
                                    const clip2 = svgRoot.querySelector(`[id="crop-group-clip-${liveElTmp.id}"]`);
                                    if (clip2) clip2.remove();
                                  }
                                }
                              }

                              const parMap = { 'Fit': 'xMidYMid meet', 'Fill': 'xMidYMid slice', 'Stretch': 'none' };
                              const fitCssMap = { 'Fit': 'contain', 'Fill': 'cover', 'Stretch': 'fill' };
                              const parVal = parMap[type] || 'xMidYMid meet';
                              const cssVal = fitCssMap[type] || 'contain';

                              const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                              const liveEl = (selectedLayerId && pageContainer)
                                ? pageContainer.querySelector(`[id="${selectedLayerId}"]`)
                                : selectedElement;

                              // Directly apply to DOM - bypass applyVisuals/isHydrating
                              const applyFitToNode = (node) => {
                                if (!node) return;
                                node.setAttribute('data-object-fit', type);
                                node.style.setProperty('object-fit', cssVal, 'important');

                                // Clear any stale transform on image-inner-content wrapper
                                // (old resize path applied transforms to wrapper instead of image attrs)
                                const innerContentGroup = node.querySelector('.image-inner-content');
                                if (innerContentGroup) {
                                  const existingTransform = innerContentGroup.getAttribute('transform');
                                  if (existingTransform && existingTransform !== 'matrix(1 0 0 1 0 0)') {
                                    // Apply the transform to the inner image directly, then clear it from the group
                                    const innerImg = innerContentGroup.querySelector('image, video');
                                    if (innerImg) {
                                      // Get the actual rendered bounding box of the inner image (in local space)
                                      try {
                                        const imgBbox = innerImg.getBBox();
                                        const groupCTM = innerContentGroup.getScreenCTM();
                                        const nodeInv = node.getScreenCTM()?.inverse();
                                        if (groupCTM && nodeInv) {
                                          // Convert image corners from screen to <g> local space
                                          const tl = new DOMPoint(imgBbox.x, imgBbox.y).matrixTransform(innerImg.getScreenCTM()).matrixTransform(nodeInv);
                                          const br = new DOMPoint(imgBbox.x + imgBbox.width, imgBbox.y + imgBbox.height).matrixTransform(innerImg.getScreenCTM()).matrixTransform(nodeInv);
                                          innerContentGroup.removeAttribute('transform');
                                          innerImg.setAttribute('x', Math.min(tl.x, br.x));
                                          innerImg.setAttribute('y', Math.min(tl.y, br.y));
                                          innerImg.setAttribute('width', Math.abs(br.x - tl.x));
                                          innerImg.setAttribute('height', Math.abs(br.y - tl.y));
                                        }
                                      } catch (e) {
                                        // Fallback: just remove the transform
                                        innerContentGroup.removeAttribute('transform');
                                      }
                                    }
                                  }
                                }

                                // For Fit mode: remove clip-path on the group so letterbox space is visible
                                // For Fill/Stretch: clip-path is fine (image fills the box)
                                if (type === 'Fit') {
                                  node.style.removeProperty('clip-path');
                                  node.style.removeProperty('overflow');
                                  node.removeAttribute('clip-path');
                                }

                                const svgImg = getSvgImageEl(node);
                                if (svgImg) {
                                  svgImg.setAttribute('preserveAspectRatio', parVal);
                                  svgImg.style.setProperty('object-fit', cssVal, 'important');
                                  // For Fit: image may not fill the full box - ensure overflow visible
                                  if (type === 'Fit') {
                                    svgImg.style.removeProperty('clip-path');
                                    svgImg.style.removeProperty('overflow');
                                  }
                                }
                              };

                              applyFitToNode(liveEl);
                              if (selectedElement && selectedElement !== liveEl) {
                                applyFitToNode(selectedElement);
                              }

                              // Update React state directly, no applyVisuals needed
                              setImageType(type);
                              stateRef.current.imageType = type;
                            }}
                            className="px-[1vw] py-[0.5vw] text-[0.8vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-[#4D47FF] transition-colors text-left"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div
                className="flex items-center gap-[1vw] pt-[0.5vw]"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    if (file.type.startsWith('image/') && file.type !== 'image/gif') {
                      handleFileUpload({ target: { files: e.dataTransfer.files } });
                    }
                  }
                }}
              >
                {/* Thumbnail */}
                <div className="relative w-[8.5vw] h-[6vw] rounded-[0.4vw] mt-[-1vw] overflow-hidden bg-gray-100 flex-shrink-0">
                  {previewSrc ? (
                    <img
                      src={previewSrc}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>

                {/* Info & Actions */}
                <div className="flex flex-col flex-1 gap-[0.4vw] py-[0.2vw] mb-[1.1vw]">
                  <div className="flex flex-col gap-[0.1vw] mt-[0.6vw]">
                    <span className="text-[0.9vw] font-medium text-gray-700 truncate w-[10vw] mt-[0.8vw]" title={displayImageName}>
                      {displayImageName}
                    </span>
                    <span className="text-[0.75vw] text-gray-400 mt-[0.3vw]">
                      {imageResolution ? `${imageResolution} • ` : ''}{imageFileSize || 'Unknown Size'}
                    </span>
                  </div>

                  <div className="flex items-center gap-[0.5vw] mt-[0.3vw]">
                    <button
                      onClick={() => setShowReplaceModal(true)}
                      className="px-[0.65vw] py-[0.35vw] bg-gray-100 hover:bg-gray-200 text-gray-600 text-[0.75vw] font-medium rounded-[0.3vw] cursor-pointer transition-colors border border-gray-200"
                    >
                      Replace image
                    </button>
                    <button
                      onClick={() => onDeleteLayer && onDeleteLayer()}
                      className="p-[0.4vw] bg-gray-100 text-gray-500 rounded-[0.3vw] border border-gray-200 cursor-pointer transition-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[0.9vw] h-[0.9vw]">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Opacity */}
              <div className="flex items-center gap-[1vw] py-[0.5vw] mt-[-1vw]">
                <span className="text-[0.85vw] font-semibold text-black whitespace-nowrap">Opacity :</span>
                <div className="flex-1 flex items-center h-[1.5vw] rounded-full outline-none">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full cursor-pointer custom-range-slider"
                    style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${opacity}%, #E2E8F0 ${opacity}%, #E2E8F0 100%)` }}
                  />
                </div>
                <div className="min-w-[3.5vw] h-[2vw] border-[0.1vw] border-gray-200 rounded-[0.3vw] flex items-center justify-center text-[0.8vw] font-medium text-black bg-white shadow-sm px-[0.5vw]">
                  {opacity} %
                </div>
              </div>


            </>
          )}

          {/* ── Color / Adjustments / Corner Radius / Effect ── always shown in both modes ── */}
          <Color
            standaloneMode={true}
            selectedElement={document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`)?.querySelector(`[id="${selectedLayerId}"]`) || selectedElement}
            onUpdate={(info) => {
              syncStateFromDOM();
              if (onUpdateRef.current) onUpdateRef.current(info);
            }}
            openSubSection={openSubSection}
            setOpenSubSection={setOpenSubSection}
            showStrokeSettings={showStrokeSettings}
            setShowStrokeSettings={setShowStrokeSettings}
            isStrokeStyleOpen={isStrokeStyleOpen}
            setIsStrokeStyleOpen={setIsStrokeStyleOpen}
            dropdownPos={dropdownPos}
            setDropdownPos={setDropdownPos}
            strokeSettingsPos={strokeSettingsPos}
            setStrokeSettingsPos={setStrokeSettingsPos}
            isDashPosOpen={isDashPosOpen}
            setIsDashPosOpen={setIsDashPosOpen}
            activePopup={activePopup}
            setActivePopup={setActivePopup}
            colorsOnPage={colorsOnPage}
          />
          <CornerRadius
            openSubSection={openSubSection}
            setOpenSubSection={setOpenSubSection}
            radius={radius}
            setRadius={setRadius}
            isRadiusLinked={isRadiusLinked}
            setIsRadiusLinked={setIsRadiusLinked}
            tagName={selectedElement?.tagName?.toLowerCase() || 'image'}
          />
          <Adjustment
            openSubSection={openSubSection}
            setOpenSubSection={setOpenSubSection}
            filters={filters}
            setFilters={setFilters}
            tagName={selectedElement?.tagName?.toLowerCase() || 'image'}
          />
          <Effect
            openSubSection={openSubSection}
            setOpenSubSection={setOpenSubSection}
            activeEffects={activeEffects}
            setActiveEffects={setActiveEffects}
            effectSettings={effectSettings}
            setEffectSettings={setEffectSettings}
            activeColorPicker={activeColorPicker}
            setActiveColorPicker={setActiveColorPicker}
            showDetailedPicker={showDetailedPicker}
            setShowDetailedPicker={setShowDetailedPicker}
          />




        </div>
      )}

      {/* Replace Media Modal Popup */}
      <ReplaceMediaModal
        show={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
        onReplace={(file) => handleFileUpload({ target: { files: [file] } })}
      />

    </div>
  );
};

export default ImageEditor;