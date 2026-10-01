import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import ReactDOM from 'react-dom';
import axios from "axios";
import { useParams } from "react-router-dom";
import useDeviceDetection from '../../hooks/useDeviceDetection';
import { resolveUploadsPath } from "../../utils/supabaseUtils";
import {
  Image as ImageIcon,
  Upload,
  Replace,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  Link2Off,
  Edit3,
  ImagePlay,
  Grid,
  Search,
  X,
  Trash2,
  Repeat,
  Sliders,
  Type,
  Maximize,
  Layout,
  Palette,
  Layers,
  Settings2,
  AlignCenterVertical,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pipette,
  Sparkles,
  RotateCcw,
  Minus,
  Plus,
  Check,
  MousePointerClick,
  Pencil
} from "lucide-react";
import ColorPicker, { parseGradient } from './ColorPicker';
import { Icon } from '@iconify/react';

import CornerRadius from './CornerRadius';
import Adjustment from './Adjustment';
import Effect from './Effect';
import ReplaceMediaModal from './ReplaceMediaModal';
import Color from './Color';

const galleryPreviewImages = [
  "https://media.giphy.com/media/3o7aD2saalEvTe2v0c/giphy.gif",
  "https://media.giphy.com/media/l41YtZOb9EUABnuqA/giphy.gif",
  "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif"
];

const GifEditor = ({
  selectedElement,
  selectedLayerId: propSelectedLayerId,
  onUpdate,
  onPopupPreviewUpdate,
  currentPageVId,
  flipbookVId,
  folderName,
  flipbookName,
  activePopupElement,
  onPopupUpdate,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  showInteraction = true,
  pages,
  activePageIndex,
  onDeleteLayer
}) => {
  const { v_id: paramVId } = useParams();
  const activeVId = flipbookVId || paramVId;

  // Use prop if available, fallback to selectedElement.id
  const selectedLayerId = propSelectedLayerId || selectedElement?.id;

  const fileInputRef = useRef(null);
  const [activeSection, setActiveSection] = useState('main');
  const [isUrlAdded, setIsUrlAdded] = useState(false);

  const [gifResolution, setGifResolution] = useState('');
  const [gifFileSize, setGifFileSize] = useState('');

  const [showGallery, setShowGallery] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [imageType, setImageType] = useState('Fit');
  const [showImageTypeDropdown, setShowImageTypeDropdown] = useState(false);
  const [loopCount, setLoopCount] = useState("Infinite");
  const [customLoopCount, setCustomLoopCount] = useState("");
  const [showLoopDropdown, setShowLoopDropdown] = useState(false);
  const [openSubSection, setOpenSubSection] = useState(null);
  const [activePopup, setActivePopup] = useState(null);

  const [filters, setFilters] = useState({ exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 });
  const [radius, setRadius] = useState({ tl: 0, tr: 0, br: 0, bl: 0 });
  const [isRadiusLinked, setIsRadiusLinked] = useState(true);
  const [activeEffects, setActiveEffects] = useState([]);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': { color: '#000000', opacity: 35, x: 2, y: 2, blur: 1, spread: 0 },
    'Inner Shadow': { color: '#000000', opacity: 35, x: 2, y: 2, blur: 1, spread: 0 },
    'Blur': { blur: 0.5, spread: 0, clipContent: false }
  });

  const [backgroundColor, setBackgroundColor] = useState({
    fill: 'transparent',
    fillOpacity: 100,
    stroke: 'transparent',
    strokeOpacity: 100,
    strokeType: 'Solid',
    strokeWeight: 0
  });

  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);
  const [colorsOnPage, setColorsOnPage] = useState([]);
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);

  const isUpdatingDOM = useRef(false);
  const isUpdatingDOMTimeoutRef = useRef(null);
  const isHydrating = useRef(false);
  const onUpdateTimerRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const getSvgImageEl = useCallback((el) => {
    if (!el) return null;
    const tag = el.tagName?.toLowerCase();

    // 1. Direct hit
    if (tag === 'image' || tag === 'img') return el;

    // 2. Child search
    const childImg = el.querySelector('image, img');
    if (childImg) return childImg;

    // 3. Pattern search
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

    return null;
  }, []);

  const syncStateFromDOM = useCallback((force = false) => {
    if (!selectedElement) return;
    if (isUpdatingDOM.current && !force) return;

    // isHydrating is only true briefly during selection change
    const tagLower = selectedElement.tagName?.toLowerCase();
    const svgImageEl = getSvgImageEl(selectedElement);
    const isSvgEl = !!svgImageEl || (selectedElement instanceof SVGElement && tagLower !== 'svg');

    // Opacity
    const rawOpacity = isSvgEl
      ? (selectedElement.getAttribute('data-effect-opacity') ? (parseFloat(selectedElement.getAttribute('data-effect-opacity')) / 100).toString() : (selectedElement.getAttribute('opacity') || selectedElement.style.opacity || '1'))
      : (selectedElement.style.opacity || '1');
    setOpacity(Math.round(parseFloat(rawOpacity) * 100));

    // Radius
    if (selectedElement.hasAttribute('data-effect-radius-tl')) {
      setRadius({
        tl: parseFloat(selectedElement.getAttribute('data-effect-radius-tl') || '0'),
        tr: parseFloat(selectedElement.getAttribute('data-effect-radius-tr') || '0'),
        br: parseFloat(selectedElement.getAttribute('data-effect-radius-br') || '0'),
        bl: parseFloat(selectedElement.getAttribute('data-effect-radius-bl') || '0')
      });
    } else {
      const domRadius = selectedElement.style.borderRadius || '0px';
      const parts = domRadius.split(' ').map(p => parseFloat(p) || 0);
      let tl = 0, tr = 0, br = 0, bl = 0;
      if (parts.length === 1) { tl = tr = br = bl = parts[0]; }
      else if (parts.length === 2) { tl = br = parts[0]; tr = bl = parts[1]; }
      else if (parts.length === 3) { tl = parts[0]; tr = bl = parts[1]; br = parts[2]; }
      else if (parts.length >= 4) { tl = parts[0]; tr = parts[1]; br = parts[2]; bl = parts[3]; }

      if (tl === 0 && tr === 0 && br === 0 && bl === 0 && tagLower === 'rect') {
        const rx = parseFloat(selectedElement.getAttribute('rx') || '0');
        tl = tr = br = bl = rx;
      }
      setRadius({ tl, tr, br, bl });
    }

    if (selectedElement.hasAttribute('data-corner-linked')) {
      setIsRadiusLinked(selectedElement.getAttribute('data-corner-linked') !== 'false');
    } else {
      setIsRadiusLinked(true);
    }

    // Image Type
    const target = (svgImageEl || selectedElement);
    const fitMapRev = { 'contain': 'Fit', 'cover': 'Fill', 'none': 'Crop', 'fill': 'Stretch' };
    const rawFit = target.getAttribute('data-object-fit') || target.style.objectFit || 'contain';
    setImageType(fitMapRev[rawFit] || (rawFit.charAt(0).toUpperCase() + rawFit.slice(1)) || 'Fit');

    setLoopCount(target.getAttribute('data-loop-count') || selectedElement.getAttribute('data-loop-count') || 'Infinite');
    setCustomLoopCount(target.getAttribute('data-custom-loop-count') || selectedElement.getAttribute('data-custom-loop-count') || '');

    // Filters & Effects
    if (selectedElement.hasAttribute('data-active-effects')) {
      const attrVal = selectedElement.getAttribute('data-active-effects');
      setActiveEffects(attrVal ? attrVal.split(',').filter(Boolean) : []);
    }

    if (selectedElement.hasAttribute('data-effect-exposure')) {
      setFilters({
        exposure: parseFloat(selectedElement.getAttribute('data-effect-exposure') || '0'),
        contrast: parseFloat(selectedElement.getAttribute('data-effect-contrast') || '0'),
        saturation: parseFloat(selectedElement.getAttribute('data-effect-saturation') || '0'),
        temperature: parseFloat(selectedElement.getAttribute('data-effect-temperature') || '0'),
        tint: parseFloat(selectedElement.getAttribute('data-effect-tint') || '0'),
        highlights: parseFloat(selectedElement.getAttribute('data-effect-highlights') || '0'),
        shadows: parseFloat(selectedElement.getAttribute('data-effect-shadows') || '0'),
      });
    }

    const effectSettingsUpdates = {};

    if (selectedElement.hasAttribute('data-effect-drop-shadow-color')) {
      effectSettingsUpdates['Drop Shadow'] = {
        color: selectedElement.getAttribute('data-effect-drop-shadow-color') || '#000000',
        opacity: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-opacity') || '35'),
        x: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-x') || '2'),
        y: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-y') || '2'),
        blur: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-blur') || '1'),
        spread: 0
      };
    }

    if (selectedElement.hasAttribute('data-effect-inner-shadow-color')) {
      effectSettingsUpdates['Inner Shadow'] = {
        color: selectedElement.getAttribute('data-effect-inner-shadow-color') || '#000000',
        opacity: parseFloat(selectedElement.getAttribute('data-effect-inner-shadow-opacity') || '35'),
        x: parseFloat(selectedElement.getAttribute('data-effect-inner-shadow-x') || '2'),
        y: parseFloat(selectedElement.getAttribute('data-effect-inner-shadow-y') || '2'),
        blur: parseFloat(selectedElement.getAttribute('data-effect-inner-shadow-blur') || '1'),
        spread: 0
      };
    }

    if (selectedElement.hasAttribute('data-effect-blur-value')) {
      effectSettingsUpdates['Blur'] = {
        blur: parseFloat(selectedElement.getAttribute('data-effect-blur-value') || '0.5'),
        clipContent: selectedElement.getAttribute('data-effect-blur-clip') === 'true',
        spread: 0
      };
    }

    if (Object.keys(effectSettingsUpdates).length > 0) {
      setEffectSettings(prev => ({ ...prev, ...effectSettingsUpdates }));
    }


    // Background & Stroke
    let fill = selectedElement.getAttribute('data-fill-color');
    if (!fill) {
      fill = selectedElement.getAttribute('fill');
      if (fill && fill.startsWith('url(')) {
        fill = 'transparent';
      }
    }
    fill = fill || selectedElement.style.backgroundColor || 'transparent';

    const stroke = selectedElement.style.borderColor || selectedElement.getAttribute('data-stroke-color') || selectedElement.getAttribute('stroke') || 'transparent';
    const strokeW = parseInt(selectedElement.style.borderWidth) || parseInt(selectedElement.getAttribute('data-stroke-width')) || parseInt(selectedElement.getAttribute('stroke-width')) || 0;

    const strokeArray = selectedElement.getAttribute('stroke-dasharray') || 'none';
    const isDashed = (selectedElement.style.borderStyle === 'dashed' || strokeArray.includes(','));
    let dashLen = 10, dashGap = 10;
    if (strokeArray !== 'none' && strokeArray !== '') {
      const parts = strokeArray.split(',');
      const parsedLen = parseInt(parts[0]);
      dashLen = isNaN(parsedLen) ? 10 : parsedLen;
      const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
      dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
    }
    const dashPos = selectedElement.getAttribute('data-stroke-position') || 'Center';
    const dashCap = selectedElement.getAttribute('stroke-linecap') || 'butt';

    const existingStrokeType = selectedElement.getAttribute('data-stroke-type');
    const actualStrokeType = existingStrokeType ? existingStrokeType : (isDashed ? 'Dashed' : 'Solid');

    setBackgroundColor({
      fill: fill === 'none' ? 'transparent' : fill,
      fillOpacity: 100,
      stroke: stroke === 'none' ? 'transparent' : stroke,
      strokeOpacity: 100,
      strokeType: actualStrokeType,
      strokeDashStyle: isDashed ? 'Dashed' : 'Solid',
      strokeGradientType: selectedElement.getAttribute('data-stroke-gradient-type') || 'linear',
      strokeStops: selectedElement.getAttribute('data-stroke-stops'),
      strokeAngle: parseFloat(selectedElement.getAttribute('data-stroke-angle') || '0'),
      strokeRadius: parseFloat(selectedElement.getAttribute('data-stroke-radius') || '100'),
      strokeWeight: strokeW,
      strokeDashLength: dashLen,
      strokeDashGap: dashGap,
      strokePosition: dashPos,
      strokeLinecap: dashCap
    });
  }, [selectedElement, getSvgImageEl]);

  // Handle selection change
  useEffect(() => {
    if (!selectedElement) return;
    isHydrating.current = true;
    syncStateFromDOM(true);
    // Use a small timeout to let the state settle before allowing applyVisuals to write back to DOM
    setTimeout(() => { isHydrating.current = false; }, 50);
  }, [selectedElement, syncStateFromDOM]);

  // Handle external mutations
  useEffect(() => {
    if (!selectedElement) return;
    const observer = new MutationObserver((mutations) => {
      if (isUpdatingDOM.current) return;
      const relevant = mutations.some(m => m.type === 'attributes' && (
        m.attributeName === 'src' || m.attributeName === 'href' ||
        m.attributeName === 'opacity' || m.attributeName === 'style' ||
        m.attributeName === 'rx' || m.attributeName === 'ry'
      ));
      if (relevant) syncStateFromDOM();
    });
    observer.observe(selectedElement, { attributes: true });
    return () => observer.disconnect();
  }, [selectedElement, syncStateFromDOM]);

  const applyVisuals = useCallback(() => {
    if (isHydrating.current) return;

    // Use selectedLayerId if available to find the live element in the DOM
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    let liveElement = (selectedLayerId && pageContainer)
      ? pageContainer.querySelector(`[id="${selectedLayerId}"]`)
      : (selectedElement?.isConnected ? selectedElement : null);

    if (!liveElement) return;

    isUpdatingDOM.current = true;
    try {
      let svgImageEl = getSvgImageEl(liveElement);
      // Correct SVG detection: only true if it's actually an SVG element
      let isSvgEl = liveElement.namespaceURI === "http://www.w3.org/2000/svg";
      let tagLower = liveElement.tagName.toLowerCase();

      // --- FORCE GIF GROUP STRUCTURE FOR GIFS ---
      if (isSvgEl && liveElement.getAttribute('data-is-gif-group') !== 'true') {
        if (tagLower === 'image' || tagLower === 'foreignobject' || tagLower === 'img') {
          const parent = liveElement.parentNode;
          const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          newGroup.id = liveElement.id; // Keep selection intact
          newGroup.setAttribute('data-type', liveElement.getAttribute('data-type') || 'image');
          newGroup.setAttribute('data-name', 'GIF Group');
          newGroup.setAttribute('data-is-gif-group', 'true');

          liveElement.removeAttribute('id');
          liveElement.setAttribute('data-name', 'GIF');
          liveElement.classList.add('gif-inner-content');

          if (liveElement.hasAttribute('transform')) {
            newGroup.setAttribute('transform', liveElement.getAttribute('transform'));
            liveElement.removeAttribute('transform');
          }

          if (parent) parent.insertBefore(newGroup, liveElement);
          newGroup.appendChild(liveElement);

          liveElement = newGroup;
          tagLower = 'g';
        } else {
          liveElement.setAttribute('data-is-gif-group', 'true');
          liveElement.setAttribute('data-name', 'GIF Group');
          const innerImg = getSvgImageEl(liveElement);
          if (innerImg) {
            innerImg.setAttribute('data-name', 'GIF');
            innerImg.classList.add('gif-inner-content');
          }
        }
      }

      const getPathD = (x, y, w, h, tlv, trv, brv, blv) => {
        return `M ${x + tlv},${y} ` +
          `L ${x + w - trv},${y} ` +
          (trv > 0 ? `A ${trv} ${trv} 0 0 1 ${x + w},${y + trv} ` : '') +
          `L ${x + w},${y + h - brv} ` +
          (brv > 0 ? `A ${brv} ${brv} 0 0 1 ${x + w - brv},${y + h} ` : '') +
          `L ${x + blv},${y + h} ` +
          (blv > 0 ? `A ${blv} ${blv} 0 0 1 ${x},${y + h - blv} ` : '') +
          `L ${x},${y + tlv} ` +
          (tlv > 0 ? `A ${tlv} ${tlv} 0 0 1 ${x + tlv},${y} ` : '') +
          `Z`;
      };

      const f = filters;
      const exposure = f.exposure || 0;
      const contrast = f.contrast || 0;
      const saturation = f.saturation || 0;
      const temperature = f.temperature || 0;
      const tint = f.tint || 0;
      const h = f.highlights || 0;
      const s = f.shadows || 0;

      let adjustOnlyStr = "";
      adjustOnlyStr += `brightness(${100 + exposure + (h / 5)}%) `;
      adjustOnlyStr += `contrast(${100 + contrast + (s / 5)}%) `;
      adjustOnlyStr += `saturate(${100 + saturation}%) `;
      if (tint !== 0) adjustOnlyStr += `hue-rotate(${tint}deg) `;
      if (temperature > 0) adjustOnlyStr += `sepia(${temperature / 2}%) `;
      else if (temperature < 0) adjustOnlyStr += `hue-rotate(180deg) sepia(${Math.abs(temperature) / 2}%) hue-rotate(-180deg) `;

      let blurStr = "";
      if (activeEffects.includes('Blur')) {
        blurStr = `blur(${effectSettings['Blur'].blur}px) `;
      }

      let dsCssString = "";
      if (activeEffects.includes('Drop Shadow')) {
        const ds = effectSettings['Drop Shadow'];
        const alpha = Math.round((ds.opacity / 100) * 255).toString(16).padStart(2, '0');
        const colorWithAlpha = ds.color + (ds.color.length === 7 ? alpha : '');
        // drop-shadow filter is more robust for images and follows transparency
        dsCssString = `drop-shadow(${ds.x}px ${ds.y}px ${ds.blur}px ${colorWithAlpha})`;
      }

      // --- Loop Count ---
      if (isSvgEl && svgImageEl) {
        svgImageEl.setAttribute('data-loop-count', loopCount);
        if (customLoopCount) svgImageEl.setAttribute('data-custom-loop-count', customLoopCount);
        else svgImageEl.removeAttribute('data-custom-loop-count');
      }
      liveElement.setAttribute('data-loop-count', loopCount);
      if (customLoopCount) liveElement.setAttribute('data-custom-loop-count', customLoopCount);
      else liveElement.removeAttribute('data-custom-loop-count');

      // --- Opacity ---
      const opacityVal = (opacity / 100).toString();
      if (isSvgEl && svgImageEl) {
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

      // --- SVG: Gif/Image fit via preserveAspectRatio ---
      if (isSvgEl) {
        const parMap = { 'Fit': 'meet', 'Fill': 'slice', 'Crop': 'slice', 'Stretch': 'none' };
        const fitCssMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover', 'Stretch': 'fill' };
        let meetOrSlice = parMap[imageType] || 'meet';
        let fitCss = fitCssMap[imageType] || 'contain';

        if (imageType === 'Crop' || liveElement.getAttribute('data-object-fit') === 'Crop') {
          const underlyingFit = liveElement.getAttribute('data-crop-underlying-fit') || 'Fit';
          meetOrSlice = parMap[underlyingFit] || 'meet';
          fitCss = fitCssMap[underlyingFit] || 'contain';
        }
        let parAlign = liveElement.getAttribute('data-crop-align') || 'xMidYMid';
        if (meetOrSlice === 'meet') parAlign = 'xMidYMid';
        if (svgImageEl) {
          if (meetOrSlice === 'none') svgImageEl.setAttribute('preserveAspectRatio', 'none');
          else svgImageEl.setAttribute('preserveAspectRatio', `${parAlign} ${meetOrSlice}`);
          svgImageEl.style.setProperty('object-fit', fitCss, 'important');
          svgImageEl.setAttribute('data-object-fit', imageType);

          // Fix for GIFs inside SVG Patterns (e.g., dropped on shapes)
          let patternEl = null;
          if (liveElement.hasAttribute('fill')) {
            const fillUrl = liveElement.getAttribute('fill');
            const match = fillUrl?.match(/url\s*\(\s*['"]?#([^'"()]+)['"]?\s*\)/i);
            if (match) {
              const patternId = match[1].trim();
              const rootSvg = liveElement.closest('svg') || document;
              try {
                patternEl = rootSvg.querySelector(`pattern[id="${patternId}"]`);
              } catch (e) {
                patternEl = null;
              }
              if (!patternEl) {
                patternEl = document.getElementById(patternId);
              }
            }
          }
          if (patternEl) {
            svgImageEl.setAttribute('width', '100%');
            svgImageEl.setAttribute('height', '100%');
            patternEl.removeAttribute('viewBox');
            patternEl.setAttribute('width', '100%');
            patternEl.setAttribute('height', '100%');
          }
        }
        liveElement.style.setProperty('object-fit', fitCss, 'important');
        liveElement.setAttribute('data-object-fit', imageType);
      } else {
        const fitCssMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover', 'Stretch': 'fill' };
        liveElement.style.setProperty('object-fit', fitCssMap[imageType] || 'contain', 'important');
        liveElement.setAttribute('data-object-fit', imageType);
      }

      // --- Radius & Clip-path ---
      const anyR = radius.tl || radius.tr || radius.br || radius.bl;
      const forceClip = activeEffects.includes('Blur') && effectSettings['Blur']?.clipContent;

      let exactPathD = '';
      let targetElForPath = svgImageEl || liveElement;
      if (isSvgEl) {
        let bBox = { x: 0, y: 0, width: 100, height: 100 };
        try { bBox = targetElForPath.getBBox(); } catch (e) { }
        let bxStr = liveElement.getAttribute('data-crop-orig-x') || targetElForPath.getAttribute('x') || '0';
        let byStr = liveElement.getAttribute('data-crop-orig-y') || targetElForPath.getAttribute('y') || '0';
        let bwStr = liveElement.getAttribute('data-crop-orig-w') || targetElForPath.getAttribute('width') || '100%';
        let bhStr = liveElement.getAttribute('data-crop-orig-h') || targetElForPath.getAttribute('height') || '100%';
        let bx = bxStr.includes('%') ? bBox.x : parseFloat(bxStr) || 0;
        let by = byStr.includes('%') ? bBox.y : parseFloat(byStr) || 0;
        let bw = bwStr.includes('%') ? bBox.width : parseFloat(bwStr) || 100;
        let bh = bhStr.includes('%') ? bBox.height : parseFloat(bhStr) || 100;
        const tl = radius.tl || 0, tr = radius.tr || 0, br = radius.br || 0, bl = radius.bl || 0;
        const maxR = Math.min(bw, bh) / 2;
        const c_tl = Math.max(0, Math.min(tl, maxR)), c_tr = Math.max(0, Math.min(tr, maxR));
        const c_br = Math.max(0, Math.min(br, maxR)), c_bl = Math.max(0, Math.min(bl, maxR));
        exactPathD = getPathD(bx, by, Math.max(0, bw), Math.max(0, bh), c_tl, c_tr, c_br, c_bl);
      }

      const radiusStr = `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`;

      targetElForPath.style.borderRadius = radiusStr;
      targetElForPath.setAttribute('data-radius', JSON.stringify(radius));
      targetElForPath.style.overflow = 'hidden';

      if (isSvgEl) {
        const hasClip = anyR || forceClip || imageType === 'Crop';

        if (hasClip) {
          if (imageType === 'Crop') {
            let cropStr = liveElement.getAttribute('data-crop-data') || liveElement.getAttribute('data-saved-crop-data') || '{"left":0,"top":0,"width":100,"height":100,"offX":0,"offY":0,"scale":1}';
            try {
              const crop = JSON.parse(cropStr);
              const origW = liveElement.getAttribute('data-crop-orig-w') || (svgImageEl ? svgImageEl.getAttribute('data-crop-orig-w') : null) || liveElement.getAttribute('width') || (svgImageEl ? svgImageEl.getAttribute('width') : null) || '100';
              const origH = liveElement.getAttribute('data-crop-orig-h') || (svgImageEl ? svgImageEl.getAttribute('data-crop-orig-h') : null) || liveElement.getAttribute('height') || (svgImageEl ? svgImageEl.getAttribute('height') : null) || '100';
              const origX = liveElement.getAttribute('data-crop-orig-x') || (svgImageEl ? svgImageEl.getAttribute('data-crop-orig-x') : null) || liveElement.getAttribute('x') || (svgImageEl ? svgImageEl.getAttribute('x') : null) || '0';
              const origY = liveElement.getAttribute('data-crop-orig-y') || (svgImageEl ? svgImageEl.getAttribute('data-crop-orig-y') : null) || liveElement.getAttribute('y') || (svgImageEl ? svgImageEl.getAttribute('y') : null) || '0';

              const wNum = parseFloat(origW) || 100;
              const hNum = parseFloat(origH) || 100;
              const xNum = parseFloat(origX) || 0;
              const yNum = parseFloat(origY) || 0;

              if (!liveElement.hasAttribute('data-crop-orig-w')) {
                liveElement.setAttribute('data-crop-orig-w', wNum.toString());
                liveElement.setAttribute('data-crop-orig-h', hNum.toString());
                liveElement.setAttribute('data-crop-orig-x', xNum.toString());
                liveElement.setAttribute('data-crop-orig-y', yNum.toString());
              }

              const panX = (wNum * (crop.offX || 0)) / 100;
              const panY = (hNum * (crop.offY || 0)) / 100;
              const finalScale = parseFloat(crop.scale) || 1;

              if (svgImageEl) {
                const isXPercent = origX.toString().includes('%') || origW.toString().includes('%');
                const isYPercent = origY.toString().includes('%') || origH.toString().includes('%');
                svgImageEl.setAttribute('width', origW);
                svgImageEl.setAttribute('height', origH);
                svgImageEl.setAttribute('x', origX.toString() + (isXPercent ? '%' : ''));
                svgImageEl.setAttribute('y', origY.toString() + (isYPercent ? '%' : ''));

                if (svgImageEl.tagName?.toLowerCase() === 'img') {
                  svgImageEl.style.transform = `translate(${panX}px, ${panY}px) scale(${finalScale})`;
                  svgImageEl.style.transformOrigin = 'center';
                } else {
                  svgImageEl.setAttribute('transform', `translate(${xNum + wNum / 2 + panX} ${yNum + hNum / 2 + panY}) scale(${finalScale}) translate(${-xNum - wNum / 2} ${-yNum - hNum / 2})`);
                }
                const underlyingFit = liveElement.getAttribute('data-crop-underlying-fit') || imageType || 'Fit';
                const fitCssMap = { 'Fit': 'contain', 'Fill': 'cover', 'Stretch': 'fill' };
                const parMap = { 'Fit': 'meet', 'Fill': 'slice', 'Stretch': 'none' };
                let meetOrSlice = parMap[underlyingFit] || 'meet';
                let fitCss = fitCssMap[underlyingFit] || 'contain';
                let parAlign = liveElement.getAttribute('data-crop-align') || 'xMidYMid';
                if (meetOrSlice === 'meet') parAlign = 'xMidYMid';

                if (meetOrSlice === 'none') svgImageEl.setAttribute('preserveAspectRatio', 'none');
                else svgImageEl.setAttribute('preserveAspectRatio', `${parAlign} ${meetOrSlice}`);
                svgImageEl.style.setProperty('object-fit', fitCss, 'important');
              }

              const cLeft = parseFloat(crop.left) || 0;
              const cTop = parseFloat(crop.top) || 0;
              const cWidth = parseFloat(crop.width) || 100;
              const cHeight = parseFloat(crop.height) || 100;

              const clipX = xNum + (wNum * cLeft) / 100;
              const clipY = yNum + (hNum * cTop) / 100;
              const clipW = (wNum * cWidth) / 100;
              const clipH = (hNum * cHeight) / 100;

              let clipId = `clip-content-${liveElement.id || 'gif'}`;
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
                  const clipPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  clipNode.appendChild(clipPathEl);
                  defs.appendChild(clipNode);
                }
                const groupClipRect = clipNode.firstChild;
                const groupD = getPathD(clipX, clipY, Math.max(0, clipW), Math.max(0, clipH), radius.tl || 0, radius.tr || 0, radius.br || 0, radius.bl || 0);
                groupClipRect.setAttribute('d', groupD);

                let targetToWrap = svgImageEl;
                if (svgImageEl && svgImageEl.tagName?.toLowerCase() === 'img') {
                  targetToWrap = svgImageEl.closest('foreignObject') || svgImageEl;
                }

                if (targetToWrap) {
                  targetToWrap.style.setProperty('clip-path', `url(#${clipId})`, 'important');
                  targetToWrap.style.setProperty('-webkit-clip-path', `url(#${clipId})`, 'important');
                  let fl = liveElement.querySelector('.gif-fill-layer') || liveElement.querySelector('.image-fill-layer');
                  if (fl) {
                    fl.style.setProperty('clip-path', `url(#${clipId})`, 'important');
                    fl.style.setProperty('-webkit-clip-path', `url(#${clipId})`, 'important');
                  }
                  liveElement.style.removeProperty('clip-path');
                  liveElement.style.removeProperty('-webkit-clip-path');
                  if (targetToWrap.parentNode && targetToWrap.parentNode.classList.contains('svg-image-clipper')) {
                    const parent = targetToWrap.parentNode;
                    parent.parentNode.insertBefore(targetToWrap, parent);
                    parent.remove();
                  }
                } else {
                  liveElement.style.setProperty('clip-path', `url(#${clipId})`, 'important');
                  liveElement.style.setProperty('-webkit-clip-path', `url(#${clipId})`, 'important');
                }
              }
            } catch (e) {
              console.warn("Failed to parse crop data on gif element:", e);
            }
          } else {
            // Restore default fitting if not crop but has forceClip or radius
            if (svgImageEl) {
              const origW = liveElement.getAttribute('data-crop-orig-w') || (svgImageEl ? svgImageEl.getAttribute('data-crop-orig-w') : null) || liveElement.getAttribute('width') || (svgImageEl ? svgImageEl.getAttribute('width') : null) || '100';
              const origH = liveElement.getAttribute('data-crop-orig-h') || (svgImageEl ? svgImageEl.getAttribute('data-crop-orig-h') : null) || liveElement.getAttribute('height') || (svgImageEl ? svgImageEl.getAttribute('height') : null) || '100';
              const wNum = parseFloat(origW) || 100;
              const hNum = parseFloat(origH) || 100;

              svgImageEl.setAttribute('width', wNum);
              svgImageEl.setAttribute('height', hNum);
              svgImageEl.style.removeProperty('transform');
              svgImageEl.style.removeProperty('transform-origin');
              svgImageEl.removeAttribute('transform');
            }
            liveElement.removeAttribute('data-crop-orig-w');
            liveElement.removeAttribute('data-crop-orig-h');
            liveElement.removeAttribute('data-crop-data');
            liveElement.removeAttribute('data-saved-crop-data');
            liveElement.removeAttribute('data-crop-orig-x');
            liveElement.removeAttribute('data-crop-orig-y');

            let clipId = `clip-content-${liveElement.id || 'gif'}`;
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
                const clipPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                clipNode.appendChild(clipPathEl);
                defs.appendChild(clipNode);
              }
              let targetToWrap = svgImageEl;
              if (svgImageEl && svgImageEl.tagName?.toLowerCase() === 'img') {
                targetToWrap = svgImageEl.closest('foreignObject') || svgImageEl;
              }

              const measureEl = targetToWrap || liveElement;
              let bb = { x: 0, y: 0, width: 100, height: 100 };
              try { bb = measureEl.getBBox(); } catch (e) { }

              let cxStr = measureEl.getAttribute('x') || '0';
              let cyStr = measureEl.getAttribute('y') || '0';
              let cwStr = measureEl.getAttribute('width') || '100%';
              let chStr = measureEl.getAttribute('height') || '100%';

              let cx = cxStr.includes('%') ? bb.x : parseFloat(cxStr) || 0;
              let cy = cyStr.includes('%') ? bb.y : parseFloat(cyStr) || 0;
              let cw = cwStr.includes('%') ? bb.width : parseFloat(cwStr) || 100;
              let ch = chStr.includes('%') ? bb.height : parseFloat(chStr) || 100;

              let clipPathEl = clipNode.firstChild;
              if (clipPathEl.tagName.toLowerCase() !== 'path') {
                clipPathEl.remove();
                clipPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                clipNode.appendChild(clipPathEl);
              }
              const maxR = Math.min(cw, ch) / 2;
              const c_tl = Math.max(0, Math.min(radius.tl || 0, maxR));
              const c_tr = Math.max(0, Math.min(radius.tr || 0, maxR));
              const c_br = Math.max(0, Math.min(radius.br || 0, maxR));
              const c_bl = Math.max(0, Math.min(radius.bl || 0, maxR));
              clipPathEl.setAttribute('d', getPathD(cx, cy, Math.max(0, cw), Math.max(0, ch), c_tl, c_tr, c_br, c_bl));
              clipPathEl.setAttribute('transform', measureEl.getAttribute('transform') || '');

              if (!liveElement.hasAttribute('data-clip-obs')) {
                liveElement.setAttribute('data-clip-obs', 'true');
                const syncClipRect = () => {
                  if (!clipNode.isConnected) return;
                  let measureEl = svgImageEl || liveElement;
                  if (svgImageEl && svgImageEl.tagName?.toLowerCase() === 'img') {
                    measureEl = svgImageEl.closest('foreignObject') || svgImageEl;
                  } else if (svgImageEl && svgImageEl.parentNode?.classList.contains('svg-crop-wrapper')) {
                    measureEl = svgImageEl.parentNode;
                  }
                  let bb = { x: 0, y: 0, width: 100, height: 100 };
                  try { bb = measureEl.getBBox(); } catch (e) { }
                  let cxStr = measureEl.getAttribute('x') || '0';
                  let cyStr = measureEl.getAttribute('y') || '0';
                  let cwStr = measureEl.getAttribute('width') || '100%';
                  let chStr = measureEl.getAttribute('height') || '100%';
                  let ncx = cxStr.includes('%') ? bb.x : parseFloat(cxStr) || 0;
                  let ncy = cyStr.includes('%') ? bb.y : parseFloat(cyStr) || 0;
                  let ncw = cwStr.includes('%') ? bb.width : parseFloat(cwStr) || 100;
                  let nch = chStr.includes('%') ? bb.height : parseFloat(chStr) || 100;
                  let clipPathEl = clipNode.firstChild;
                  let currentRadius = radius;
                  try {
                    const saved = (svgImageEl || liveElement).getAttribute('data-radius') || liveElement.getAttribute('data-radius');
                    if (saved) currentRadius = JSON.parse(saved);
                  } catch (e) { }
                  const mxR = Math.min(ncw, nch) / 2;
                  const c_tl = Math.max(0, Math.min(currentRadius.tl || 0, mxR));
                  const c_tr = Math.max(0, Math.min(currentRadius.tr || 0, mxR));
                  const c_br = Math.max(0, Math.min(currentRadius.br || 0, mxR));
                  const c_bl = Math.max(0, Math.min(currentRadius.bl || 0, mxR));
                  
                  clipPathEl.setAttribute('d', getPathD(ncx, ncy, Math.max(0, ncw), Math.max(0, nch), c_tl, c_tr, c_br, c_bl));
                  clipPathEl.setAttribute('transform', measureEl.getAttribute('transform') || '');
                };
                const clipObs = new MutationObserver(syncClipRect);
                clipObs.observe(measureEl, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform'] });
                if (measureEl !== liveElement) {
                  clipObs.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform'] });
                }
              }

              if (targetToWrap) {
                targetToWrap.style.setProperty('clip-path', `url(#${clipId})`, 'important');
                targetToWrap.style.setProperty('-webkit-clip-path', `url(#${clipId})`, 'important');
                let fl = liveElement.querySelector('.gif-fill-layer') || liveElement.querySelector('.image-fill-layer');
                if (fl) {
                  fl.style.setProperty('clip-path', `url(#${clipId})`, 'important');
                  fl.style.setProperty('-webkit-clip-path', `url(#${clipId})`, 'important');
                }

                liveElement.style.removeProperty('clip-path');
                liveElement.style.removeProperty('-webkit-clip-path');

                if (targetToWrap.parentNode && targetToWrap.parentNode.classList.contains('svg-image-clipper')) {
                  const parent = targetToWrap.parentNode;
                  parent.parentNode.insertBefore(targetToWrap, parent);
                  parent.remove();
                }
              } else {
                liveElement.style.setProperty('clip-path', `url(#${clipId})`, 'important');
                liveElement.style.setProperty('-webkit-clip-path', `url(#${clipId})`, 'important');
              }
            }
          }
        } else {
          liveElement.style.removeProperty('clip-path');
          liveElement.style.removeProperty('-webkit-clip-path');
          let fl = liveElement.querySelector('.gif-fill-layer') || liveElement.querySelector('.image-fill-layer');
          if (fl) {
            fl.style.removeProperty('clip-path');
            fl.style.removeProperty('-webkit-clip-path');
          }
          if (svgImageEl && svgImageEl !== liveElement) {
            svgImageEl.style.removeProperty('clip-path');
            svgImageEl.style.removeProperty('-webkit-clip-path');
            if (svgImageEl.parentNode && svgImageEl.parentNode.classList.contains('svg-image-clipper')) {
              svgImageEl.parentNode.style.removeProperty('clip-path');
              svgImageEl.parentNode.style.removeProperty('-webkit-clip-path');
            }
          }
          if (svgImageEl) {
            svgImageEl.style.removeProperty('transform');
            svgImageEl.style.removeProperty('transform-origin');
            svgImageEl.removeAttribute('transform');
          }
          liveElement.removeAttribute('data-crop-orig-w');
          liveElement.removeAttribute('data-crop-orig-h');
          liveElement.removeAttribute('data-crop-orig-x');
          liveElement.removeAttribute('data-crop-orig-y');
        }
      } else {
        targetElForPath.style.removeProperty('clip-path');
        targetElForPath.style.removeProperty('-webkit-clip-path');
        liveElement.style.removeProperty('clip-path');
        liveElement.style.removeProperty('-webkit-clip-path');
      }

      // --- Filter Application ---
      const adjustOnlyFilter = adjustOnlyStr.trim() || 'none';
      const shadowOnlyFilter = dsCssString.trim() || 'none';
      const blurOnlyFilter = blurStr.trim() || 'none';
      const totalHtmlFilter = `${adjustOnlyStr} ${blurStr} ${dsCssString}`.trim() || 'none';

      if (isSvgEl) {
        const hasClip = anyR || forceClip;

        // 1. Apply Adjustments to the actual image content (leaf)
        if (svgImageEl) {
          let leafFilter = adjustOnlyFilter;
          if (forceClip && blurOnlyFilter !== 'none') {
            leafFilter = `${adjustOnlyFilter} ${blurStr}`.trim();
          }
          svgImageEl.style.setProperty('filter', leafFilter, 'important');
        }

        // 2. Apply Drop Shadow to a sibling caster (best for SVG to decouple from blur and clips)
        let shadowCaster = liveElement.querySelector('.svg-drop-shadow-caster');
        if (shadowOnlyFilter !== 'none') {
          if (!shadowCaster || shadowCaster.tagName.toLowerCase() !== 'path') {
            if (shadowCaster) shadowCaster.remove();
            shadowCaster = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            shadowCaster.classList.add('svg-drop-shadow-caster');
            shadowCaster.style.pointerEvents = 'none';
            liveElement.insertBefore(shadowCaster, liveElement.firstChild);
          }

          if (!liveElement.hasAttribute('data-shadow-obs')) {
            liveElement.setAttribute('data-shadow-obs', 'true');
            const syncShadowCaster = () => {
              let sCaster = liveElement.querySelector('.svg-drop-shadow-caster');
              if (!sCaster) return;

              let tEl = svgImageEl || liveElement;
              if (svgImageEl && svgImageEl.tagName?.toLowerCase() === 'img') {
                tEl = svgImageEl.closest('foreignObject') || svgImageEl;
              } else if (svgImageEl && svgImageEl.parentNode?.classList.contains('svg-crop-wrapper')) {
                tEl = svgImageEl.parentNode;
              }
              let bb = { x: 0, y: 0, width: 100, height: 100 };
              try { bb = tEl.getBBox(); } catch (e) { }

              let cxStr = tEl.getAttribute('x') || '0';
              let cyStr = tEl.getAttribute('y') || '0';
              let cwStr = tEl.getAttribute('width') || '100%';
              let chStr = tEl.getAttribute('height') || '100%';

              let ncx = cxStr.includes('%') ? bb.x : parseFloat(cxStr) || 0;
              let ncy = cyStr.includes('%') ? bb.y : parseFloat(cyStr) || 0;
              let ncw = cwStr.includes('%') ? bb.width : parseFloat(cwStr) || 100;
              let nch = chStr.includes('%') ? bb.height : parseFloat(chStr) || 100;

              let currentRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
              try {
                const saved = (svgImageEl || liveElement).getAttribute('data-radius') || liveElement.getAttribute('data-radius');
                if (saved) currentRadius = JSON.parse(saved);
              } catch (e) { }

              const d = getPathD(ncx, ncy, Math.max(0, ncw), Math.max(0, nch), currentRadius.tl || 0, currentRadius.tr || 0, currentRadius.br || 0, currentRadius.bl || 0);
              sCaster.setAttribute('d', d);
              sCaster.setAttribute('transform', targetElForPath.getAttribute('transform') || '');
            };
            const sObs = new MutationObserver(syncShadowCaster);
            let obsTarget = svgImageEl || liveElement;
            if (svgImageEl && svgImageEl.tagName?.toLowerCase() === 'img') {
              obsTarget = svgImageEl.closest('foreignObject') || svgImageEl;
            } else if (svgImageEl && svgImageEl.parentNode?.classList.contains('svg-crop-wrapper')) {
              obsTarget = svgImageEl.parentNode;
            }
            sObs.observe(obsTarget, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform'] });
            if (obsTarget !== liveElement) {
              sObs.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform'] });
            }
          }
          if (shadowCaster) {
            if (shadowCaster !== liveElement.firstChild) {
              liveElement.insertBefore(shadowCaster, liveElement.firstChild);
            }
            shadowCaster.setAttribute('d', exactPathD);
            shadowCaster.setAttribute('transform', targetElForPath.getAttribute('transform') || '');

            shadowCaster.setAttribute('fill', 'black');
            shadowCaster.setAttribute('fill-opacity', opacityVal);

            shadowCaster.style.removeProperty('clip-path');

            const effSet = effectSettings['Drop Shadow'] || { x: 0, y: 0, blur: 0, color: '#000', opacity: 0 };
            const totalBlur = effSet.blur / 2;

            let shadowFilterId = `ds-only-${liveElement.id || 'gif'}`;
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
              // Safely set innerHTML to generate only the shadow, hollowed out by SourceAlpha
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
              shadowCaster.style.setProperty('filter', shadowOnlyFilter, 'important');
            }

            shadowCaster.style.setProperty('display', 'block', 'important');
          }
        } else if (shadowCaster) {
          shadowCaster.style.setProperty('display', 'none', 'important');
        }

        // 3. Apply layer-level Blur to the selection element itself
        if (blurOnlyFilter !== 'none' && !forceClip) {
          liveElement.style.setProperty('filter', blurOnlyFilter, 'important');
        } else {
          liveElement.style.removeProperty('filter');
        }
        if (liveElement.parentElement) {
          liveElement.parentElement.style.removeProperty('filter');
          liveElement.parentElement.style.setProperty('overflow', 'visible', 'important');
        }
      } else {
        // FOR HTML
        liveElement.style.setProperty('filter', totalHtmlFilter, 'important');
        if (liveElement.parentElement) liveElement.parentElement.style.removeProperty('filter');

        if (activeEffects.includes('Drop Shadow') || activeEffects.includes('Blur')) {
          if (liveElement.parentElement) liveElement.parentElement.style.setProperty('overflow', 'visible', 'important');
        }
      }

      // Always clear box-shadow to ensure we only use the drop-shadow filter
      liveElement.style.boxShadow = 'none';

      // --- Background & Stroke ---
      if (isSvgEl) {
        let fillLayer = liveElement.querySelector('.gif-fill-layer') || liveElement.querySelector('.image-fill-layer');
        if (fillLayer && fillLayer.classList.contains('image-fill-layer')) {
          fillLayer.classList.remove('image-fill-layer');
          fillLayer.classList.add('gif-fill-layer');
        }

        if (backgroundColor.fill !== 'transparent' && backgroundColor.fill !== 'none') {
          if (!fillLayer) {
            fillLayer = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            fillLayer.classList.add('gif-fill-layer');
            fillLayer.setAttribute('data-name', 'Fill Color');
            fillLayer.style.pointerEvents = 'none';
            // Insert it as the first child so it acts as a background
            liveElement.insertBefore(fillLayer, liveElement.firstChild);
          }

          let visualTarget = svgImageEl || liveElement;

          if (!liveElement.hasAttribute('data-fill-obs')) {
            liveElement.setAttribute('data-fill-obs', 'true');
            const syncFillLayer = () => {
              if (!fillLayer.isConnected) return;
              fillLayer.setAttribute('x', visualTarget.getAttribute('x') || '0');
              fillLayer.setAttribute('y', visualTarget.getAttribute('y') || '0');
              fillLayer.setAttribute('width', visualTarget.getAttribute('width') || '100%');
              fillLayer.setAttribute('height', visualTarget.getAttribute('height') || '100%');
              fillLayer.setAttribute('transform', visualTarget.getAttribute('transform') || '');
              fillLayer.style.transform = visualTarget.style.transform;
              fillLayer.style.translate = visualTarget.style.translate;
              fillLayer.style.scale = visualTarget.style.scale;
              fillLayer.style.rotate = visualTarget.style.rotate;
              fillLayer.style.transformOrigin = visualTarget.style.transformOrigin;


            };
            const fObs = new MutationObserver(syncFillLayer);
            fObs.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style', 'data-radius'] });
            if (visualTarget !== liveElement) {
              fObs.observe(visualTarget, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style', 'data-radius'] });
            }
          }

          fillLayer.setAttribute('x', visualTarget.getAttribute('x') || '0');
          fillLayer.setAttribute('y', visualTarget.getAttribute('y') || '0');
          fillLayer.setAttribute('width', visualTarget.getAttribute('width') || '100%');
          fillLayer.setAttribute('height', visualTarget.getAttribute('height') || '100%');
          fillLayer.setAttribute('transform', visualTarget.getAttribute('transform') || '');
          fillLayer.style.transform = visualTarget.style.transform;
          fillLayer.style.translate = visualTarget.style.translate;
          fillLayer.style.scale = visualTarget.style.scale;
          fillLayer.style.rotate = visualTarget.style.rotate;
          fillLayer.style.transformOrigin = visualTarget.style.transformOrigin;



          fillLayer.removeAttribute('d');

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
            fillLayer.removeAttribute('data-fill-gradient-type');
            fillLayer.removeAttribute('data-fill-angle');
            fillLayer.removeAttribute('data-fill-radius');

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

          fillLayer.removeAttribute('rx'); // We use 'd' instead of 'rx' now

          liveElement.setAttribute('data-fill-color', backgroundColor.fill);
          if (liveElement.style) {
            liveElement.style.removeProperty('background-color');
            liveElement.style.removeProperty('background');
          }
        } else {
          if (fillLayer) fillLayer.remove();
          liveElement.removeAttribute('data-fill-color');
          liveElement.removeAttribute('data-fill-type');
        }
        liveElement.setAttribute('data-fill-opacity', (backgroundColor.fillOpacity / 100).toString());

        // To support stroke on <image> elements (which ignore stroke attributes natively), we create a <rect> overlay
        if (backgroundColor.stroke !== 'transparent' && backgroundColor.stroke !== 'none') {
          if (liveElement.getAttribute('data-is-gif-group') === 'true') {
            liveElement.removeAttribute('stroke');
            if (liveElement.style) liveElement.style.removeProperty('stroke');
          } else {
            liveElement.setAttribute('stroke', backgroundColor.stroke);
          }
          liveElement.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());

          if (backgroundColor.strokeDashStyle === 'Dashed' || backgroundColor.strokeType === 'Dashed') {
            const dashArray = backgroundColor.strokeDasharrayValue || `${backgroundColor.strokeDashLength || 10},${backgroundColor.strokeDashGap || 10}`;
            liveElement.setAttribute('stroke-dasharray', dashArray);
          } else {
            liveElement.removeAttribute('stroke-dasharray');
          }

          liveElement.setAttribute('data-stroke-position', backgroundColor.strokePosition || 'Center');
          liveElement.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
          liveElement.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

          // Dynamic Stroke Overlay for SVG images and GIFs
          const isTargetRenderable = svgImageEl && (svgImageEl.tagName?.toLowerCase() === 'image' || svgImageEl.tagName?.toLowerCase() === 'foreignobject' || svgImageEl.tagName?.toLowerCase() === 'g' || svgImageEl.tagName?.toLowerCase() === 'svg');
          if (isTargetRenderable) {
            let strokeOverlay = liveElement.querySelector('.svg-gif-stroke-overlay') || liveElement.querySelector('.svg-image-stroke-overlay');
            if (!strokeOverlay || strokeOverlay.tagName.toLowerCase() !== 'path') {
              if (strokeOverlay) strokeOverlay.remove();
              strokeOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              strokeOverlay.classList.add('svg-gif-stroke-overlay');
              strokeOverlay.style.pointerEvents = 'none';
              liveElement.appendChild(strokeOverlay);

              // Attach a mutation observer to keep the overlay perfectly synced with the image's layout
              const targetForStroke = svgImageEl && svgImageEl.parentNode?.tagName?.toLowerCase() === 'svg' && svgImageEl.parentNode.classList.contains('svg-crop-wrapper') ? svgImageEl.parentNode : svgImageEl;
              const syncOverlay = () => {
                if (!strokeOverlay.isConnected) return;
                const weight = parseFloat(strokeOverlay.getAttribute('stroke-width')) || 0;
                const pos = strokeOverlay.getAttribute('data-img-stroke-position') || 'Center';
                let targetEl = svgImageEl || liveElement;
                if (svgImageEl && svgImageEl.tagName?.toLowerCase() === 'img') {
                  targetEl = svgImageEl.closest('foreignObject') || svgImageEl;
                } else if (svgImageEl && svgImageEl.parentNode?.tagName?.toLowerCase() === 'svg' && svgImageEl.parentNode.classList.contains('svg-crop-wrapper')) {
                  targetEl = svgImageEl.parentNode;
                }
                let bBox = { x: 0, y: 0, width: 100, height: 100 };
                try { bBox = targetEl.getBBox(); } catch (e) { }
                let bxStr = liveElement.getAttribute('data-crop-orig-x') || targetEl.getAttribute('x') || '0';
                let byStr = liveElement.getAttribute('data-crop-orig-y') || targetEl.getAttribute('y') || '0';
                let bwStr = liveElement.getAttribute('data-crop-orig-w') || targetEl.getAttribute('width') || '100%';
                let bhStr = liveElement.getAttribute('data-crop-orig-h') || targetEl.getAttribute('height') || '100%';

                let bx = bxStr.includes('%') ? bBox.x : parseFloat(bxStr) || 0;
                let by = byStr.includes('%') ? bBox.y : parseFloat(byStr) || 0;
                let bw = bwStr.includes('%') ? bBox.width : parseFloat(bwStr) || 100;
                let bh = bhStr.includes('%') ? bBox.height : parseFloat(bhStr) || 100;

                const effImgTypeStroke = liveElement.getAttribute('data-object-fit') || imageType;
                const cropStrStroke = targetEl.getAttribute('data-crop-data') || liveElement.getAttribute('data-crop-data') || targetEl.getAttribute('data-saved-crop-data') || liveElement.getAttribute('data-saved-crop-data');
                if (effImgTypeStroke === 'Crop' && cropStrStroke && cropStrStroke !== 'null') {
                  try {
                    const crop = JSON.parse(cropStrStroke);
                    bx = bx + (parseFloat(crop.left) / 100) * bw;
                    by = by + (parseFloat(crop.top) / 100) * bh;
                    bw = bw * (parseFloat(crop.width) / 100);
                    bh = bh * (parseFloat(crop.height) / 100);
                  } catch (e) { }
                }

                let scaleX = 1; let scaleY = 1;
                try {
                  const ctm = targetEl.getScreenCTM();
                  if (ctm) { scaleX = Math.abs(ctm.a) || 1; scaleY = Math.abs(ctm.d) || 1; }
                } catch (e) { }

                const offsetX = (weight / 2) / scaleX;
                const offsetY = (weight / 2) / scaleY;

                let ox = bx, oy = by, ow = bw, oh = bh;
                if (pos === 'Inside') {
                  ox += offsetX; oy += offsetY; ow -= offsetX * 2; oh -= offsetY * 2;
                } else if (pos === 'Outside') {
                  ox -= offsetX; oy -= offsetY; ow += offsetX * 2; oh += offsetY * 2;
                }

                let currentRadius = radius;
                try {
                  const saved = targetEl.getAttribute('data-radius') || liveElement.getAttribute('data-radius');
                  if (saved) currentRadius = JSON.parse(saved);
                } catch (e) { }
                let tl = currentRadius.tl || 0; let tr = currentRadius.tr || 0; let br = currentRadius.br || 0; let bl = currentRadius.bl || 0;
                if (pos === 'Inside') {
                  tl = Math.max(0, tl - offsetX); tr = Math.max(0, tr - offsetX); br = Math.max(0, br - offsetX); bl = Math.max(0, bl - offsetX);
                } else if (pos === 'Outside') {
                  tl = tl > 0 ? tl + offsetX : 0; tr = tr > 0 ? tr + offsetX : 0; br = br > 0 ? br + offsetX : 0; bl = bl > 0 ? bl + offsetX : 0;
                }

                const maxR = Math.min(ow, oh) / 2;
                const c_tl = Math.max(0, Math.min(tl, maxR)); const c_tr = Math.max(0, Math.min(tr, maxR)); const c_br = Math.max(0, Math.min(br, maxR)); const c_bl = Math.max(0, Math.min(bl, maxR));

                if (strokeOverlay) {
                  strokeOverlay.setAttribute('d', getPathD(ox, oy, Math.max(0, ow), Math.max(0, oh), c_tl, c_tr, c_br, c_bl));
                  strokeOverlay.removeAttribute('transform');
                  strokeOverlay.style.removeProperty('transform');
                  strokeOverlay.style.removeProperty('translate');
                  strokeOverlay.style.removeProperty('scale');
                  strokeOverlay.style.removeProperty('rotate');
                  strokeOverlay.style.transformOrigin = targetEl.style.transformOrigin;
                }

                const clip = (liveElement.ownerDocument || document).getElementById(`clip-${liveElement.id || 'gif'}`);
                if (clip) {
                  const clipPathEl = clip.querySelector('path');
                  if (clipPathEl) {
                    const innerMaxR = Math.min(bw, bh) / 2;
                    const inner_tl = Math.max(0, Math.min(tl, innerMaxR));
                    const inner_tr = Math.max(0, Math.min(tr, innerMaxR));
                    const inner_br = Math.max(0, Math.min(br, innerMaxR));
                    const inner_bl = Math.max(0, Math.min(bl, innerMaxR));
                    clipPathEl.setAttribute('d', getPathD(bx, by, Math.max(0, bw), Math.max(0, bh), inner_tl, inner_tr, inner_br, inner_bl));
                  }
                }
              };
              const obs = new MutationObserver(syncOverlay);
              obs.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style', 'data-crop-data', 'data-crop-orig-w', 'data-crop-orig-h', 'data-crop-orig-x', 'data-crop-orig-y'] });
              let targetForObs = svgImageEl || liveElement;
              if (svgImageEl && svgImageEl.tagName?.toLowerCase() === 'img') {
                targetForObs = svgImageEl.closest('foreignObject') || svgImageEl;
              } else if (svgImageEl && svgImageEl.parentNode?.tagName?.toLowerCase() === 'svg' && svgImageEl.parentNode.classList.contains('svg-crop-wrapper')) {
                targetForObs = svgImageEl.parentNode;
              }
              if (targetForObs && targetForObs !== liveElement) {
                obs.observe(targetForObs, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style', 'data-crop-data', 'data-crop-orig-w', 'data-crop-orig-h', 'data-crop-orig-x', 'data-crop-orig-y'] });
              }
            }

            // Initial sync
            let targetEl = svgImageEl || liveElement;
            if (svgImageEl && svgImageEl.tagName?.toLowerCase() === 'img') {
              targetEl = svgImageEl.closest('foreignObject') || svgImageEl;
            } else if (svgImageEl && svgImageEl.parentNode?.tagName?.toLowerCase() === 'svg' && svgImageEl.parentNode.classList.contains('svg-crop-wrapper')) {
              targetEl = svgImageEl.parentNode;
            }
            let bBox = { x: 0, y: 0, width: 100, height: 100 };
            try { bBox = targetEl.getBBox(); } catch (e) { }

            let bxStr = liveElement.getAttribute('data-crop-orig-x') || targetEl.getAttribute('x') || '0';
            let byStr = liveElement.getAttribute('data-crop-orig-y') || targetEl.getAttribute('y') || '0';
            let bwStr = liveElement.getAttribute('data-crop-orig-w') || targetEl.getAttribute('width') || '100%';
            let bhStr = liveElement.getAttribute('data-crop-orig-h') || targetEl.getAttribute('height') || '100%';

            let bx = bxStr.includes('%') ? bBox.x : parseFloat(bxStr) || 0;
            let by = byStr.includes('%') ? bBox.y : parseFloat(byStr) || 0;
            let bw = bwStr.includes('%') ? bBox.width : parseFloat(bwStr) || 100;
            let bh = bhStr.includes('%') ? bBox.height : parseFloat(bhStr) || 100;

            const effImgTypeStrokeInit = liveElement.getAttribute('data-object-fit') || imageType;
            const cropStrStroke = targetEl.getAttribute('data-crop-data') || liveElement.getAttribute('data-crop-data') || targetEl.getAttribute('data-saved-crop-data') || liveElement.getAttribute('data-saved-crop-data');
            if (effImgTypeStrokeInit === 'Crop' && cropStrStroke && cropStrStroke !== 'null') {
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

            let scaleX = 1;
            let scaleY = 1;
            try {
              const ctm = targetEl.getScreenCTM();
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
            strokeOverlay.removeAttribute('transform');
            strokeOverlay.style.removeProperty('transform');
            strokeOverlay.style.removeProperty('translate');
            strokeOverlay.style.removeProperty('scale');
            strokeOverlay.style.removeProperty('rotate');
            strokeOverlay.style.transformOrigin = targetEl.style.transformOrigin;

            strokeOverlay.setAttribute('fill', 'none');

            liveElement.setAttribute('data-stroke-type', backgroundColor.strokeType);

            if (backgroundColor.strokeType === 'gradient' && backgroundColor.strokeStops) {
              liveElement.setAttribute('data-stroke-gradient-type', backgroundColor.strokeGradientType || 'linear');
              liveElement.setAttribute('data-stroke-stops', backgroundColor.strokeStops || '');
              liveElement.setAttribute('data-stroke-angle', backgroundColor.strokeAngle || '0');
              liveElement.setAttribute('data-stroke-radius', backgroundColor.strokeRadius || '100');

              strokeOverlay.setAttribute('stroke-type', 'gradient');
              strokeOverlay.setAttribute('stroke-gradient-type', backgroundColor.strokeGradientType || 'linear');
              strokeOverlay.setAttribute('stroke-stops', backgroundColor.strokeStops || '');
              strokeOverlay.setAttribute('stroke-angle', backgroundColor.strokeAngle || '0');
              strokeOverlay.setAttribute('stroke-radius', backgroundColor.strokeRadius || '100');
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
            strokeOverlay.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());
            strokeOverlay.setAttribute('stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());

            if (backgroundColor.strokeDashStyle === 'Dashed' || backgroundColor.strokeType === 'Dashed') {
              const dashArray = backgroundColor.strokeDasharrayValue || `${backgroundColor.strokeDashLength || 10},${backgroundColor.strokeDashGap || 10}`;
              strokeOverlay.setAttribute('stroke-dasharray', dashArray);
            } else {
              strokeOverlay.removeAttribute('stroke-dasharray');
            }

            strokeOverlay.setAttribute('data-img-stroke-position', backgroundColor.strokePosition || 'Center');
            strokeOverlay.removeAttribute('data-stroke-position');
            strokeOverlay.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
            strokeOverlay.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

            // Forcefully cleanup any orphaned MainEditor overlays that might have been applied previously
            if (liveElement.parentElement) {
              const orphans = liveElement.parentElement.querySelectorAll(`.svg-shape-stroke-overlay[data-target="${liveElement.id}"], .svg-shape-stroke-overlay[data-target=""]`);
              orphans.forEach(o => o.remove());
            }

            // Add clipPath to clip the image to prevent sharp corners from bleeding
            const isImageElement = liveElement.tagName?.toLowerCase() === 'image';
            const defsOwner = isImageElement ? (liveElement.ownerSVGElement || liveElement.parentElement || liveElement) : liveElement;

            if (isImageElement) {
              const buggyDefs = liveElement.querySelector('defs');
              if (buggyDefs) buggyDefs.remove();
            }

            let defs = defsOwner.querySelector('defs');
            if (!defs) {
              defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
              defsOwner.insertBefore(defs, defsOwner.firstChild);
            }
            const clipId = `clip-${liveElement.id || 'gif'}`;
            let clip = defs.querySelector(`clipPath[id="${clipId}"]`);
            if (!clip) {
              clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
              clip.id = clipId;
              const clipPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              clipPathEl.classList.add('svg-gif-clip-path');
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
              clipPathEl.setAttribute('d', getPathD(bx, by, Math.max(0, bw), Math.max(0, bh), inner_tl, inner_tr, inner_br, inner_bl));
            }

            if (targetEl) {
              targetEl.setAttribute('clip-path', `url(#${clip.id})`);
              targetEl.style.setProperty('clip-path', `url(#${clip.id})`, 'important');
              targetEl.style.removeProperty('-webkit-clip-path');
            }
          }
        } else {
          liveElement.removeAttribute('stroke');
          liveElement.removeAttribute('stroke-width');
          liveElement.querySelector('.svg-gif-stroke-overlay')?.remove();
        }
      } else {
        // HTML Background & Border
        liveElement.style.backgroundColor = backgroundColor.fill;

        // Helper to convert hex to rgba for CSS border
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

        let style = (backgroundColor.strokeDashStyle === 'Dashed' || backgroundColor.strokeType === 'Dashed') ? 'dashed' : backgroundColor.strokeType.toLowerCase();
        if (backgroundColor.stroke !== 'transparent' && backgroundColor.stroke !== 'none' && (!backgroundColor.strokeType || backgroundColor.strokeType === 'none')) {
          style = (backgroundColor.strokeDashStyle === 'Dashed') ? 'dashed' : 'solid';
        }

        const pos = backgroundColor.strokePosition || 'Center';
        const color = hexToRgba(backgroundColor.stroke, backgroundColor.strokeOpacity / 100);
        const weight = backgroundColor.strokeWeight;

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

      // Inner Shadow
      let innerShadowString = '';
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
        innerShadowString = `inset ${ds.x || 0}px ${ds.y || 0}px ${ds.blur || 0}px ${ds.spread || 0}px ${rgbaStr}`;
      }

      if (isSvgEl) {
        let overlay = liveElement.querySelector('.svg-gif-inner-shadow-rect');
        let oldOverlay = liveElement.querySelector('.svg-gif-inner-shadow');
        if (oldOverlay) oldOverlay.remove();

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
            overlay.classList.add('svg-gif-inner-shadow-rect');
            overlay.style.pointerEvents = 'none';
            overlay.setAttribute('fill', 'white');
            liveElement.appendChild(overlay);

            // MutationObserver to keep inner shadow perfectly synced when dragged or resized
            const syncInnerShadow = () => {
              if (!overlay.isConnected) return;
              let tEl = svgImageEl || liveElement;
              if (svgImageEl && svgImageEl.parentNode?.tagName?.toLowerCase() === 'svg' && svgImageEl.parentNode.classList.contains('svg-crop-wrapper')) {
                tEl = svgImageEl.parentNode;
              }
              let bBox = { x: 0, y: 0, width: 100, height: 100 };
              try { bBox = tEl.getBBox(); } catch (e) { }

              let xStr = tEl.getAttribute('x') || '0';
              let yStr = tEl.getAttribute('y') || '0';
              let wStr = tEl.getAttribute('width') || '100%';
              let hStr = tEl.getAttribute('height') || '100%';

              let obx = xStr.includes('%') ? bBox.x : parseFloat(xStr) || 0;
              let oby = yStr.includes('%') ? bBox.y : parseFloat(yStr) || 0;
              let obw = wStr.includes('%') ? bBox.width : parseFloat(wStr) || 100;
              let obh = hStr.includes('%') ? bBox.height : parseFloat(hStr) || 100;

              let currentRadius = radius;
              try {
                const saved = tEl.getAttribute('data-radius') || liveElement.getAttribute('data-radius');
                if (saved) currentRadius = JSON.parse(saved);
              } catch (e) { }
              const mxR = Math.min(obw, obh) / 2;
              const ctl = Math.max(0, Math.min(currentRadius.tl || 0, mxR));
              const ctr = Math.max(0, Math.min(currentRadius.tr || 0, mxR));
              const cbr = Math.max(0, Math.min(currentRadius.br || 0, mxR));
              const cbl = Math.max(0, Math.min(currentRadius.bl || 0, mxR));

              overlay.setAttribute('d', getPathD(obx, oby, Math.max(0, obw), Math.max(0, obh), ctl, ctr, cbr, cbl));
              overlay.removeAttribute('transform');
              overlay.style.removeProperty('transform');
              overlay.style.removeProperty('translate');
              overlay.style.removeProperty('scale');
              overlay.style.removeProperty('rotate');
              overlay.style.transformOrigin = tEl.style.transformOrigin;
            };
            const obs = new MutationObserver(syncInnerShadow);
            obs.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
            let tObs = svgImageEl || liveElement;
            if (svgImageEl && svgImageEl.parentNode?.tagName?.toLowerCase() === 'svg' && svgImageEl.parentNode.classList.contains('svg-crop-wrapper')) {
              tObs = svgImageEl.parentNode;
            }
            if (tObs && tObs !== liveElement) {
              obs.observe(tObs, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
            }
          }

          let targetEl = svgImageEl || liveElement;
          if (svgImageEl && svgImageEl.parentNode?.tagName?.toLowerCase() === 'svg' && svgImageEl.parentNode.classList.contains('svg-crop-wrapper')) {
            targetEl = svgImageEl.parentNode;
          }

          let box = { x: 0, y: 0, width: 100, height: 100 };
          try { box = targetEl.getBBox(); } catch (e) { }

          let bxStr = targetEl.getAttribute('x') || '0';
          let byStr = targetEl.getAttribute('y') || '0';
          let bwStr = targetEl.getAttribute('width') || '100%';
          let bhStr = targetEl.getAttribute('height') || '100%';

          let bx = bxStr.includes('%') ? box.x : parseFloat(bxStr) || 0;
          let by = byStr.includes('%') ? box.y : parseFloat(byStr) || 0;
          let bw = bwStr.includes('%') ? box.width : parseFloat(bwStr) || 100;
          let bh = bhStr.includes('%') ? box.height : parseFloat(bhStr) || 100;

          const tl = radius.tl || 0;
          const tr = radius.tr || 0;
          const br = radius.br || 0;
          const bl = radius.bl || 0;

          const maxR = Math.min(bw, bh) / 2;
          const c_tl = Math.max(0, Math.min(tl, maxR));
          const c_tr = Math.max(0, Math.min(tr, maxR));
          const c_br = Math.max(0, Math.min(br, maxR));
          const c_bl = Math.max(0, Math.min(bl, maxR));

          overlay.setAttribute('d', getPathD(bx, by, Math.max(0, bw), Math.max(0, bh), c_tl, c_tr, c_br, c_bl));
          overlay.removeAttribute('transform');
          overlay.style.removeProperty('transform');
          overlay.style.removeProperty('translate');
          overlay.style.removeProperty('scale');
          overlay.style.removeProperty('rotate');
          overlay.style.transformOrigin = targetEl.style.transformOrigin;

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
        if (innerShadowString) {
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
            overlay.style.boxShadow = innerShadowString;
            const anyR = radius.tl > 0 || radius.tr > 0 || radius.br > 0 || radius.bl > 0;
            overlay.style.borderRadius = anyR ? `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px` : '0px';
          }
        } else if (overlay) {
          overlay.remove();
        }
      }

      // Persistence Data Attributes
      liveElement.setAttribute('data-effect-exposure', exposure.toString());
      liveElement.setAttribute('data-effect-contrast', contrast.toString());
      liveElement.setAttribute('data-effect-saturation', saturation.toString());
      liveElement.setAttribute('data-effect-temperature', temperature.toString());
      liveElement.setAttribute('data-effect-tint', tint.toString());
      liveElement.setAttribute('data-effect-highlights', h.toString());
      liveElement.setAttribute('data-effect-shadows', s.toString());
      liveElement.setAttribute('data-effect-opacity', opacity.toString());
      liveElement.setAttribute('data-active-effects', activeEffects.join(','));
      liveElement.setAttribute('data-loop-count', loopCount);
      liveElement.setAttribute('data-custom-loop-count', customLoopCount);

      liveElement.setAttribute('data-effect-radius-tl', (radius.tl || 0).toString());
      liveElement.setAttribute('data-effect-radius-tr', (radius.tr || 0).toString());
      liveElement.setAttribute('data-effect-radius-br', (radius.br || 0).toString());
      liveElement.setAttribute('data-effect-radius-bl', (radius.bl || 0).toString());
      liveElement.setAttribute('data-corner-linked', isRadiusLinked ? 'true' : 'false');

      liveElement.setAttribute('data-effect-blur', activeEffects.includes('Blur') ? 'true' : 'false');
      if (effectSettings['Blur']) {
        liveElement.setAttribute('data-effect-blur-value', effectSettings['Blur'].blur.toString());
        liveElement.setAttribute('data-effect-blur-clip', effectSettings['Blur'].clipContent ? 'true' : 'false');
      }

      liveElement.setAttribute('data-effect-drop-shadow', activeEffects.includes('Drop Shadow') ? 'true' : 'false');
      if (effectSettings['Drop Shadow']) {
        liveElement.setAttribute('data-effect-drop-shadow-color', effectSettings['Drop Shadow'].color);
        liveElement.setAttribute('data-effect-drop-shadow-opacity', effectSettings['Drop Shadow'].opacity.toString());
        liveElement.setAttribute('data-effect-drop-shadow-x', effectSettings['Drop Shadow'].x.toString());
        liveElement.setAttribute('data-effect-drop-shadow-y', effectSettings['Drop Shadow'].y.toString());
        liveElement.setAttribute('data-effect-drop-shadow-blur', effectSettings['Drop Shadow'].blur.toString());
      }

      liveElement.setAttribute('data-effect-inner-shadow', activeEffects.includes('Inner Shadow') ? 'true' : 'false');
      if (effectSettings['Inner Shadow']) {
        liveElement.setAttribute('data-effect-inner-shadow-color', effectSettings['Inner Shadow'].color);
        liveElement.setAttribute('data-effect-inner-shadow-opacity', effectSettings['Inner Shadow'].opacity.toString());
        liveElement.setAttribute('data-effect-inner-shadow-x', effectSettings['Inner Shadow'].x.toString());
        liveElement.setAttribute('data-effect-inner-shadow-y', effectSettings['Inner Shadow'].y.toString());
        liveElement.setAttribute('data-effect-inner-shadow-blur', effectSettings['Inner Shadow'].blur.toString());
      }

      // --- STRICT LAYER REORDERING FOR GIF GROUPS ---
      if (liveElement.getAttribute('data-is-gif-group') === 'true') {
        const dropShadow = liveElement.querySelector('.svg-drop-shadow-caster');
        const fillLayer = liveElement.querySelector('.gif-fill-layer') || liveElement.querySelector('.image-fill-layer');
        const innerShadow = liveElement.querySelector('.svg-gif-inner-shadow-rect') || liveElement.querySelector('.svg-inner-shadow-rect') || liveElement.querySelector('.svg-inner-shadow-overlay');
        const stroke = liveElement.querySelector('.svg-gif-stroke-overlay') || liveElement.querySelector('.svg-image-stroke-overlay');

        let innerGroup = liveElement.querySelector('.gif-inner-content');
        if (!innerGroup) {
          innerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          innerGroup.classList.add('gif-inner-content');
          innerGroup.setAttribute('data-name', 'Gif Content');
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

        if (fillLayer) { fillLayer.setAttribute('data-name', 'Fill Color'); liveElement.insertBefore(fillLayer, innerGroup); }

        if (svgImageEl) {
          const imageNode = svgImageEl.closest('svg.svg-crop-wrapper') ||
            svgImageEl.closest('rect') ||
            svgImageEl;
          if (imageNode && (imageNode.parentNode === liveElement || imageNode.parentNode === innerGroup)) {
            if (imageNode !== innerGroup && !imageNode.contains(innerGroup)) {
              innerGroup.appendChild(imageNode);
            }
          }
        }

        if (innerShadow) { innerShadow.setAttribute('data-name', 'Inner Shadow'); liveElement.appendChild(innerShadow); }
        if (stroke) { stroke.setAttribute('data-name', 'Stroke'); liveElement.appendChild(stroke); }
      }

      if (onUpdateRef.current) {
        clearTimeout(onUpdateTimerRef.current);
        onUpdateTimerRef.current = setTimeout(() => {
          const serializer = new XMLSerializer();
          const svgRoot = pageContainer?.querySelector('svg');
          if (svgRoot) {
            onUpdateRef.current(serializer.serializeToString(svgRoot));
          } else {
            onUpdateRef.current();
          }
        }, 400);
      }
    } finally {
      if (isUpdatingDOMTimeoutRef.current) clearTimeout(isUpdatingDOMTimeoutRef.current);
      isUpdatingDOMTimeoutRef.current = setTimeout(() => {
        isUpdatingDOM.current = false;
      }, 50);
    }
  }, [selectedElement, selectedLayerId, activePageIndex, filters, activeEffects, effectSettings, opacity, imageType, radius, isRadiusLinked, backgroundColor, getSvgImageEl, loopCount, customLoopCount]);

  // Trigger applyVisuals when state changes
  useEffect(() => {
    applyVisuals();
  }, [applyVisuals]);

  const updateRadius = (corner, value) => {
    const val = Math.max(0, Number(value) || 0);
    const next = isRadiusLinked ? { tl: val, tr: val, br: val, bl: val } : { ...radius, [corner]: val };
    setRadius(next);
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

  const getSrc = useCallback((el) => {
    if (!el) return "";
    return el.src || el.getAttribute("href") || el.getAttribute("xlink:href") || "";
  }, []);

  useEffect(() => {
    const currentSrc = getSrc(getSvgImageEl(selectedElement) || selectedElement);
    if (!currentSrc) {
      setGifResolution('');
      setGifFileSize('');
      return;
    }

    const formatBytes = (bytes, decimals = 2) => {
      if (!+bytes) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const img = new Image();
    img.src = currentSrc;
    img.onload = () => {
      setGifResolution(`${img.naturalWidth} x ${img.naturalHeight}`);
    };

    if (currentSrc.startsWith('data:')) {
      const base64str = currentSrc.split(',')[1];
      if (base64str) {
        const bytes = Math.round(base64str.length * (3 / 4));
        setGifFileSize(formatBytes(bytes, 1));
      }
    } else {
      fetch(currentSrc, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            const contentLength = res.headers.get('content-length');
            if (contentLength) {
              setGifFileSize(formatBytes(parseInt(contentLength, 10), 1));
            } else {
              setGifFileSize('Unknown Size');
            }
          } else {
            setGifFileSize('Unknown Size');
          }
        })
        .catch(() => {
          setGifFileSize('Unknown Size');
        });
    }
  }, [selectedElement, getSvgImageEl, getSrc]);

  const setSrc = (el, url) => {
    if (!el) return;
    if (el.tagName?.toLowerCase() === "image") {
      el.setAttribute("href", url);
      try { el.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", url); } catch (e) { }
    } else {
      el.src = url;
    }
  };

  const handleGifUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/gif" && file.type !== "image/webp") return;

    const url = URL.createObjectURL(file);
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    const liveElement = (selectedLayerId && pageContainer) ? pageContainer.querySelector(`[id="${selectedLayerId}"]`) : selectedElement;
    const targetImg = getSvgImageEl(liveElement) || liveElement;

    const processUpload = async (nw, nh) => {
      setSrc(targetImg, url);
      liveElement.dataset.mediaType = "gif";
      onUpdateRef.current?.({ shouldRefresh: true });

      const storedUser = localStorage.getItem('user');
      if (storedUser && (activeVId || (folderName && flipbookName))) {
        const user = JSON.parse(storedUser);
        const formData = new FormData();
        formData.append('emailId', user.emailId);
        if (activeVId) formData.append('v_id', activeVId);
        formData.append('type', 'gif');
        formData.append('assetType', 'gif');
        formData.append('page_v_id', currentPageVId || 'global');
        formData.append('file', file);
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
          if (res.data.url) {
            const serverUrl = resolveUploadsPath(res.data.url);
            setSrc(targetImg, serverUrl);
            liveElement.dataset.fileVid = res.data.file_v_id;
            onUpdateRef.current?.();
          }
        } catch (err) { console.error("GIF upload failed:", err); }
      }
    };

    const imgObj = new window.Image();
    imgObj.onload = () => {
      processUpload(imgObj.naturalWidth, imgObj.naturalHeight);
    };
    imgObj.src = url;
  };

  if (!selectedElement) return null;

  return (
    <div className="relative flex flex-col gap-[0.4vw] w-full font-sans h-full overflow-y-auto no-scrollbar">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
        .custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
        .custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.55vw; cursor: pointer; transition: box-shadow 0.15s ease; position: relative; z-index: 2; }
        .custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
        .no-spin::-webkit-inner-spin-button, .no-spin::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      <div className="flex items-center gap-[0.5vw]">
        <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Gif Property</span>
        <div className="h-[0.0925vw] bg-gray-200 flex-1" > </div>
      </div>

      {/* Image/Gif fix type */}
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
                {['Fit', 'Fill', 'Stretch'].map((type) => (
                  <button
                    key={type}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowImageTypeDropdown(false);

                      isHydrating.current = false;



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

                          const imgEl = getSvgImageEl(liveElTmp) || liveElTmp.querySelector('image');
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

                            const innerGroup = liveElTmp.querySelector('.gif-inner-content, .svg-crop-wrapper');
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

                      const applyFitToNode = (node) => {
                        if (!node) return;
                        node.setAttribute('data-object-fit', type);
                        node.style.setProperty('object-fit', cssVal, 'important');

                        if (type === 'Fit') {
                          node.style.removeProperty('clip-path');
                          node.style.removeProperty('overflow');
                          node.removeAttribute('clip-path');
                        }

                        const svgImg = getSvgImageEl(node);
                        if (svgImg) {
                          svgImg.setAttribute('preserveAspectRatio', parVal);
                          svgImg.style.setProperty('object-fit', cssVal, 'important');
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

                      setImageType(type);
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

      {/* Upload/Replace Row */}
      <div className="flex items-center gap-[1vw] pt-[0.5vw]">
        {/* Current Preview */}
        <div className="relative w-[8.5vw] h-[6vw] rounded-[0.4vw] overflow-hidden bg-gray-100 flex-shrink-0">
          {getSrc(getSvgImageEl(selectedElement) || selectedElement) ? (
            <img src={getSrc(getSvgImageEl(selectedElement) || selectedElement)} className="w-full h-full object-fill" alt="Current GIF" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <ImageIcon size="1.2vw" className="text-gray-300" />
            </div>
          )}
        </div>

        {/* Info & Actions */}
        <div className="flex flex-col flex-1 gap-[0.4vw] py-[0.2vw] mb-[1.1vw]">
          <div className="flex flex-col gap-[0.1vw] mt-[-0.5vw]">
            <span className="text-[0.9vw] font-medium text-gray-700 truncate w-[10vw] mt-[0.8vw]" title={selectedElement?.getAttribute('data-filename') || selectedElement?.getAttribute('data-name') || 'Gif'}>
              {selectedElement?.getAttribute('data-filename') || selectedElement?.getAttribute('data-name') || 'Gif'}
            </span>
            <div className="text-[0.75vw] text-gray-400 flex items-center gap-[0.3vw] flex-nowrap whitespace-nowrap mt-[0.3vw]">
              <span>
                {gifResolution ? `${gifResolution} • ` : ''}{gifFileSize || 'Unknown Size'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-[0.5vw] mt-[0.3vw]">
            <button
              onClick={() => setShowReplaceModal(true)}
              className="px-[0.65vw] py-[0.35vw] bg-gray-100 hover:bg-gray-200 text-gray-600 text-[0.75vw] font-medium rounded-[0.3vw] cursor-pointer transition-colors border border-gray-200"
            >
              Replace gif
            </button>
            <button
              onClick={() => onDeleteLayer && onDeleteLayer()}
              className="p-[0.4vw] bg-gray-100 text-gray-500 rounded-[0.3vw] border border-gray-200 cursor-pointer transition-none"
              title="Delete"
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

      <input ref={fileInputRef} type="file" accept="image/gif, image/webp" onChange={handleGifUpload} className="hidden" />

      <div className="flex flex-col gap-[0.4vw]">


        <div className="flex items-center gap-[1vw] py-[0.5vw] mt-[-0.5vw]">
          <span className="text-[0.85vw] font-semibold text-black whitespace-nowrap">Opacity :</span>
          <div className="flex-1 flex items-center h-[1.5vw] rounded-full outline-none">
            <input type="range" min="0" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full cursor-pointer custom-range-slider" style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${opacity}%, #E2E8F0 ${opacity}%, #E2E8F0 100%)` }} />
          </div>
          <div className="min-w-[3.5vw] h-[2vw] border-[0.1vw] border-gray-200 rounded-[0.3vw] flex items-center justify-center text-[0.8vw] font-medium text-black bg-white shadow-sm px-[0.5vw]">
            {opacity} %
          </div>
        </div>

        <div className="space-y-[0.5vw]">
          <div className="flex items-center gap-[0.5vw]">
            <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Gif Playback Settings</span>
            <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
          </div>
          <div className="flex flex-col gap-[0.5vw] pb-[0.5vw]">


            <div className="flex items-center justify-between">
              <div className="flex items-center justify-between w-[9.5vw]">
                <span className="text-[0.8vw] font-medium text-gray-800 truncate" title="Repeat ( Loop Count )">Repeat ( Loop Count )</span>
                <span className="text-[0.8vw] font-medium text-gray-800">:</span>
              </div>
              <div className="relative">
                <div
                  className="flex items-center justify-between w-[10.5vw] h-[2vw] px-[0.6vw] border border-gray-200 rounded-[0.4vw] cursor-pointer bg-white"
                  onClick={() => { setShowLoopDropdown(!showLoopDropdown); }}
                >
                  <span className="text-[0.75vw] text-gray-600 truncate">{loopCount === "Custom" ? customLoopCount || "Custom" : loopCount}</span>
                  <Icon icon="lucide:chevron-down" className="w-[0.9vw] h-[0.9vw] text-gray-500 flex-shrink-0" />
                </div>
                {showLoopDropdown && (
                  <div className="absolute top-full left-0 mt-[0.2vw] w-full bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-50 py-[0.3vw] flex flex-col items-center">
                    {["Once", "Twice", "Thrice", "Infinite"].map((opt) => (
                      <div
                        key={opt}
                        className="px-[0.6vw] py-[0.4vw] text-[0.75vw] text-gray-700 hover:bg-gray-100 cursor-pointer w-full text-center"
                        onClick={() => { setLoopCount(opt); setShowLoopDropdown(false); }}
                      >
                        {opt}
                      </div>
                    ))}
                    <div className="w-[90%] h-[1px] bg-gray-100 my-[0.3vw]"></div>
                    <div className="flex items-center gap-[0.3vw] px-[0.6vw] py-[0.2vw] w-full justify-center">
                      <input
                        type="number"
                        placeholder="Custom"
                        value={customLoopCount}
                        onChange={(e) => {
                          setCustomLoopCount(e.target.value);
                          setLoopCount("Custom");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setShowLoopDropdown(false);
                          }
                        }}
                        className="w-[3.5vw] h-[1.6vw] text-[0.7vw] border border-gray-200 rounded-[0.2vw] px-[0.3vw] outline-none text-center"
                      />
                      <span className="text-[0.75vw] text-gray-600">times</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        <Color
          openSubSection={openSubSection}
          setOpenSubSection={setOpenSubSection}
          backgroundColor={backgroundColor}
          setBackgroundColor={setBackgroundColor}
          activeColorPicker={activeColorPicker}
          setActiveColorPicker={setActiveColorPicker}
          showStrokeSettings={showStrokeSettings}
          setShowStrokeSettings={setShowStrokeSettings}
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

      {/* Replace Media Modal Popup */}
      <ReplaceMediaModal
        show={showReplaceModal}
        mediaType="gif"
        onClose={() => setShowReplaceModal(false)}
        onReplace={(file) => {
          handleGifUpload({ target: { files: [file] } });
        }}
      />
    </div>
  );
};

function syncGradient(doc, element, baseAttr) {
  const type = element.getAttribute(`${baseAttr}-type`);
  const currentValue = element.getAttribute(baseAttr);
  const isUrl = currentValue && currentValue.toLowerCase().startsWith('url(#');
  const gradType = element.getAttribute(`${baseAttr}-gradient-type`) || 'linear';
  const stopsJson = element.getAttribute(`${baseAttr}-stops`);

  if (type === 'solid' || type === 'none') return;

  if (isUrl && !stopsJson) {
    if (element.tagName.toLowerCase() === 'g' || element.tagName.toLowerCase() === 'text') {
      Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
        child.setAttribute(baseAttr, currentValue);
        if (child.style) child.style.setProperty(baseAttr, currentValue, 'important');
      });
    }
    return;
  }

  if (!type && !isUrl) return;
  if (!stopsJson) return;

  let stops = [];
  try { stops = JSON.parse(stopsJson); } catch (e) { return; }
  if (!stops || !Array.isArray(stops)) return;

  const svgRoot = element.closest('svg') || doc.querySelector('svg') || (doc.tagName?.toLowerCase() === 'svg' ? doc : null);
  if (!svgRoot) return;

  const ownerDoc = doc.ownerDocument || doc;

  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  if (!element.id) {
    element.id = `${element.tagName}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const gradIdPrefix = `grad-${element.id}-${baseAttr}`;
  Array.from(defs.querySelectorAll(`[id^="${gradIdPrefix}"]`)).forEach(oldGrad => oldGrad.remove());

  const gradId = `${gradIdPrefix}-${Math.random().toString(36).substr(2, 4)}`;
  let gradEl = null;

  const svgGradType = (gradType === 'angular' || gradType === 'diamond') ? (gradType === 'angular' ? 'linear' : 'radial') : gradType;

  if (!gradEl) {
    gradEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", `${svgGradType}Gradient`);
    gradEl.id = gradId;
    if (svgGradType === 'linear') {
      const angle = parseFloat(element.getAttribute(`${baseAttr}-angle`) || '0');
      const angleRad = (angle * Math.PI) / 180;
      const dx = Math.sin(angleRad) * 50;
      const dy = -Math.cos(angleRad) * 50;
      gradEl.setAttribute('x1', Math.round(50 - dx) + '%');
      gradEl.setAttribute('y1', Math.round(50 - dy) + '%');
      gradEl.setAttribute('x2', Math.round(50 + dx) + '%');
      gradEl.setAttribute('y2', Math.round(50 + dy) + '%');
    } else {
      const radius = parseFloat(element.getAttribute(`${baseAttr}-radius`) || '50');
      gradEl.setAttribute('cx', '50%');
      gradEl.setAttribute('cy', '50%');
      gradEl.setAttribute('r', radius + '%');
    }
    defs.appendChild(gradEl);
  }

  while (gradEl.firstChild) gradEl.removeChild(gradEl.firstChild);
  stops.forEach(s => {
    const stop = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute('offset', `${s.offset}%`);
    stop.setAttribute('stop-color', s.color);
    stop.setAttribute('stop-opacity', (s.opacity !== undefined && s.opacity !== null) ? s.opacity : 1);
    gradEl.appendChild(stop);
  });

  const finalUrl = `url(#${gradId})`;
  element.setAttribute(baseAttr, finalUrl);
  if (element.style) {
    element.style.setProperty(baseAttr, finalUrl, 'important');
  }

  if (element.tagName.toLowerCase() === 'g' || element.tagName.toLowerCase() === 'text') {
    Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
      child.setAttribute(baseAttr, finalUrl);
      if (child.style) child.style.setProperty(baseAttr, finalUrl, 'important');
    });
  }
};

export default GifEditor;