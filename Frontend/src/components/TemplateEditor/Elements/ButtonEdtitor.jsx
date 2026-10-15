import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Icon } from '@iconify/react';
import ColorPicker, { parseGradient, generateGradientString } from '../ColorPicker';
import Effect from '../Effect';

const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.75vw] my-[0.5vw]">
    <h2 className="text-[0.95vw] font-bold text-[#1e2538] whitespace-nowrap tracking-tight">{title}</h2>
    <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
  </div>
);

const fontFamilies = [
  'Bangers', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather',
  'Public Sans', 'Lora', 'Cabin', 'Satisfy'
];

const fontWeights = [
  { name: 'Thin', value: '100' },
  { name: 'Extra Light', value: '200' },
  { name: 'Light', value: '300' },
  { name: 'Regular', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi Bold', value: '600' },
  { name: 'Bold', value: '700' },
  { name: 'Extra Bold', value: '800' }
];

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 50, 64, 72];

const hoverAnimationDirections = [
  { id: 'none', label: 'None' },
  { id: 'left-to-right', label: 'Left to Right' },
  { id: 'right-to-left', label: 'Right to Left' },
  { id: 'top-to-bottom', label: 'Top to Bottom' },
  { id: 'bottom-to-top', label: 'Bottom to Top' }
];

// Helper to extract color or reconstruct gradient string from SVG defs if needed
const extractColorOrGradient = (element, attrName, defaultColor) => {
  if (!element) return defaultColor;
  const dataColor = element.getAttribute(`data-${attrName}-color`);
  if (dataColor) return dataColor;

  const rawVal = element.getAttribute(attrName) || element.style?.[attrName] || defaultColor;
  if (rawVal && rawVal.startsWith('url(#')) {
    const gradId = rawVal.match(/url\(#([^)]+)\)/)?.[1];
    const svgRoot = element.closest('svg');
    const gradEl = gradId && svgRoot ? svgRoot.querySelector(`#${gradId}`) : null;
    if (gradEl) {
      const isRadial = gradEl.tagName.toLowerCase().includes('radial');
      const stops = Array.from(gradEl.querySelectorAll('stop')).map(stop => ({
        color: stop.getAttribute('stop-color') || '#ffffff',
        offset: parseFloat(stop.getAttribute('offset') || 0),
        opacity: Math.round(parseFloat(stop.getAttribute('stop-opacity') || 1) * 100)
      }));
      if (stops.length > 0) {
        if (isRadial) {
          const r = parseFloat(gradEl.getAttribute('r') || 50);
          return generateGradientString('Radial', stops, 0, r);
        } else {
          const x1 = parseFloat(gradEl.getAttribute('x1') || 50);
          const y1 = parseFloat(gradEl.getAttribute('y1') || 0);
          const x2 = parseFloat(gradEl.getAttribute('x2') || 50);
          const y2 = parseFloat(gradEl.getAttribute('y2') || 100);
          const angle = Math.round((Math.atan2(x2 - x1, -(y2 - y1)) * 180) / Math.PI + 360) % 360;
          return generateGradientString('Linear', stops, angle, 100);
        }
      }
    }
  }
  return rawVal;
};

// Compute matching lighter accent shade for corner flaps
const lightenColor = (col, amount = 0.3) => {
  if (!col) return col;
  let baseCol = col;
  if (typeof baseCol === 'string' && baseCol.includes('gradient')) {
    try {
      const parsed = parseGradient(baseCol);
      if (parsed && parsed.stops && parsed.stops.length > 0) {
        baseCol = parsed.stops[0].color;
      }
    } catch (_) {}
  }
  if (typeof baseCol !== 'string') return col;
  let r = 0, g = 0, b = 0;
  if (baseCol.startsWith('#')) {
    let hex = baseCol.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    r = parseInt(hex.substring(0, 2), 16) || 0;
    g = parseInt(hex.substring(2, 4), 16) || 0;
    b = parseInt(hex.substring(4, 6), 16) || 0;
  } else if (baseCol.startsWith('rgb')) {
    const parts = baseCol.match(/\d+/g);
    if (parts && parts.length >= 3) {
      r = parseInt(parts[0]) || 0;
      g = parseInt(parts[1]) || 0;
      b = parseInt(parts[2]) || 0;
    } else {
      return baseCol;
    }
  } else {
    return baseCol;
  }
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(lr)}${toHex(lg)}${toHex(lb)}`;
};

const ButtonEditor = ({
  selectedElement,
  selectedLayerId,
  updateElementAttribute,
  activePageIndex,
  onUpdate
}) => {
  // Text Properties
  const [buttonText, setButtonText] = useState('First Button');
  const [fontFamily, setFontFamily] = useState('-apple-system');
  const [fontWeight, setFontWeight] = useState('500');
  const [fontSize, setFontSize] = useState(15);
  const [textFillColor, setTextFillColor] = useState('#1e2538');

  // Shape Properties
  const [shapeFillColor, setShapeFillColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#1e2538');
  const [strokeWidth, setStrokeWidth] = useState(1.8);
  const [strokeOpacity, setStrokeOpacity] = useState(100);
  const [strokeAlignment, setStrokeAlignment] = useState('Center');
  const [isStrokeAlignOpen, setIsStrokeAlignOpen] = useState(false);

  // Hover Properties
  const [hoverTextFillColor, setHoverTextFillColor] = useState('#1e2538');
  const [hoverShapeFillColor, setHoverShapeFillColor] = useState('#ffffff');
  const [hoverStrokeColor, setHoverStrokeColor] = useState('#1e2538');
  const [hoverAnimationDirection, setHoverAnimationDirection] = useState('none');

  // Accordion state
  const [openSection, setOpenSection] = useState(null); // 'textFill', 'shapeFill', 'strokeColor', 'effect', 'hoverAnimation', 'hoverTextFill', 'hoverShapeFill', 'hoverStrokeColor'
  const [activeColorPicker, setActiveColorPicker] = useState(null);

  // Effect states
  const [activeEffects, setActiveEffects] = useState([]);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': {
      x: 2,
      y: 2,
      blur: 0,
      spread: 0,
      color: '#000000',
      opacity: 35
    },
    'Inner Shadow': {
      x: 2,
      y: 2,
      blur: 0,
      spread: 0,
      color: '#000000',
      opacity: 35
    },
    'Blur': {
      blur: 0.3,
      spread: 0,
      clipContent: false
    }
  });

  const lastElementIdRef = useRef(null);

  // Read current values from selectedElement on initial select or id change
  useEffect(() => {
    if (!selectedElement) return;

    // Only re-hydrate from DOM if switching to a different element
    const currentId = selectedElement.id;
    const isNewElement = currentId !== lastElementIdRef.current;
    lastElementIdRef.current = currentId;

    if (!isNewElement) return;

    // 1. Find text element
    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    if (textEl) {
      setButtonText(textEl.textContent || '');

      const ff = textEl.style.fontFamily || textEl.getAttribute('font-family') || '';
      if (ff) {
        const cleanFF = ff.replace(/['"]/g, '').split(',')[0].trim();
        setFontFamily(cleanFF);
      }

      const fw = textEl.style.fontWeight || textEl.getAttribute('font-weight') || '500';
      setFontWeight(fw);

      const fs = textEl.getAttribute('font-size') || textEl.style.fontSize || '15';
      setFontSize(parseInt(fs) || 15);

      const tfc = extractColorOrGradient(textEl, 'fill', '#1e2538');
      setTextFillColor(tfc);
    }

    // 2. Find rect or ribbon element for Shape Properties
    const isRibbon = selectedElement.getAttribute('data-button-shape') === 'ribbon';
    const isParallelogram = selectedElement.getAttribute('data-button-shape') === 'parallelogram';
    const isDiamond = selectedElement.getAttribute('data-button-shape') === 'diamond';
    const isArrow = selectedElement.getAttribute('data-button-shape') === 'arrow';
    const isSkew = selectedElement.getAttribute('data-button-shape') === 'skew';
    const isOutsideCircle = selectedElement.getAttribute('data-button-shape') === 'outside-circle';
    const isInsetCircle = selectedElement.getAttribute('data-button-shape') === 'inset-circle';
    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    const rectEl = selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);
    const shapeEl = mainPoly || rectEl;
    if (shapeEl) {
      const sfc = extractColorOrGradient(shapeEl, 'fill', isInsetCircle ? '#1877f2' : (isOutsideCircle ? '#e31a61' : (isSkew ? 'linear-gradient(90deg, #ff9800 0%, #ff2b00 100%)' : (isArrow ? 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)' : (isDiamond ? '#b7007e' : (isParallelogram ? '#00e676' : (mainPoly ? '#7e22ce' : '#ffffff')))))));
      setShapeFillColor(sfc);

      if (isRibbon) {
        setStrokeColor('none');
        setStrokeWidth(0);
        setStrokeOpacity(0);
      } else {
        const strokeTarget = (isParallelogram || isDiamond || isArrow || isSkew || isOutsideCircle || isInsetCircle) ? (mainPoly || shapeEl) : (rectEl || shapeEl);
        const sc = extractColorOrGradient(strokeTarget, 'stroke', 'none');
        setStrokeColor(sc || 'none');

        const sw = strokeTarget?.getAttribute('stroke-width') || strokeTarget?.style.strokeWidth || '0';
        setStrokeWidth(parseFloat(sw) || 0);

        const so = strokeTarget?.getAttribute('stroke-opacity') || strokeTarget?.style.strokeOpacity || '1';
        setStrokeOpacity(Math.round(parseFloat(so) * 100));

        const sa = selectedElement.getAttribute('data-stroke-alignment') || 'Center';
        setStrokeAlignment(sa);
      }
    }

    // 3. Hover Properties
    const hoverText = selectedElement.getAttribute('data-hover-text-fill') || (textEl ? extractColorOrGradient(textEl, 'fill', '#1e2538') : '#1e2538');
    setHoverTextFillColor(hoverText);

    const fallbackShapeFill = (mainPoly ? extractColorOrGradient(mainPoly, 'fill', '#7e22ce') : (rectEl ? extractColorOrGradient(rectEl, 'fill', '#ffffff') : '#ffffff'));
    const rawHoverShape = selectedElement.getAttribute('data-hover-shape-fill');
    const hoverShape = rawHoverShape && rawHoverShape !== 'none' ? rawHoverShape : fallbackShapeFill;
    setHoverShapeFillColor(hoverShape);

    const hoverStroke = selectedElement.getAttribute('data-hover-stroke-color') || (rectEl ? extractColorOrGradient(rectEl, 'stroke', '#1e2538') : '#1e2538');
    setHoverStrokeColor(hoverStroke);

    const hoverAnim = selectedElement.getAttribute('data-hover-animation') || 'none';
    setHoverAnimationDirection(hoverAnim);

    // 4. Effects from element attributes
    const effects = [];
    if (selectedElement.getAttribute('data-effect-drop-shadow') === 'true') {
      effects.push('Drop Shadow');
      setEffectSettings(prev => ({
        ...prev,
        'Drop Shadow': {
          color: selectedElement.getAttribute('data-effect-drop-shadow-color') || '#000000',
          opacity: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-opacity') || 35),
          x: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-x') || 2),
          y: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-y') || 2),
          blur: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-blur') || 0),
          spread: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-spread') || 0)
        }
      }));
    }
    setActiveEffects(effects);
  }, [selectedElement]);

  // Handle live canvas hover detection even when editor selection box or handles are over the button
  useEffect(() => {
    if (!selectedElement) return;

    // Run initial sync once element is selected to ensure styles and structure exist
    syncButtonToCanvas();

    const onEnter = () => {
      try {
        if (!selectedElement.classList.contains('is-hovered')) {
          selectedElement.classList.add('is-hovered');
        }
      } catch (_) {}
    };

    const onLeave = () => {
      try {
        if (selectedElement.classList.contains('is-hovered')) {
          selectedElement.classList.remove('is-hovered');
        }
      } catch (_) {}
    };

    selectedElement.addEventListener('mouseenter', onEnter);
    selectedElement.addEventListener('mouseleave', onLeave);

    const handlePointerMove = (e) => {
      try {
        const rect = selectedElement.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        const isInside = (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        );
        if (isInside) {
          onEnter();
        } else {
          onLeave();
        }
      } catch (_) {}
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument;
    if (editorDoc && editorDoc !== document) {
      editorDoc.addEventListener('mousemove', handlePointerMove, { passive: true });
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      if (editorDoc && editorDoc !== document) {
        editorDoc.removeEventListener('mousemove', handlePointerMove);
      }
      try {
        selectedElement.removeEventListener('mouseenter', onEnter);
        selectedElement.removeEventListener('mouseleave', onLeave);
        selectedElement.classList.remove('is-hovered');
      } catch (_) {}
    };
  }, [selectedElement, hoverAnimationDirection, hoverShapeFillColor, hoverTextFillColor, hoverStrokeColor]);

  // Apply or remove SVG filter for Drop Shadow directly on the SVG element and its canvas root
  const applyDropShadowFilter = (hasDropShadow, dsSettings = effectSettings['Drop Shadow']) => {
    if (!selectedElement) return;

    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const svgRoot = selectedElement.closest('svg') || editorDoc.querySelector('.page-svg-container svg') || editorDoc.querySelector('svg');
    if (!svgRoot) return;

    const ownerDoc = svgRoot.ownerDocument || document;
    let defs = svgRoot.querySelector('defs');
    if (!defs) {
      defs = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }

    const baseFilterId = `filter-${selectedElement.id || selectedLayerId}`;
    Array.from(defs.querySelectorAll(`[id^="${baseFilterId}"]`)).forEach(old => old.remove());

    if (!hasDropShadow) {
      selectedElement.removeAttribute('filter');
      return;
    }

    const filterId = `${baseFilterId}-${Math.random().toString(36).substr(2, 4)}`;
    const filterEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "filter");
    filterEl.setAttribute('id', filterId);
    filterEl.setAttribute('x', '-50%');
    filterEl.setAttribute('y', '-50%');
    filterEl.setAttribute('width', '200%');
    filterEl.setAttribute('height', '200%');

    const color = dsSettings?.color || '#000000';
    const opacity = (parseFloat(dsSettings?.opacity !== undefined ? dsSettings.opacity : 35)) / 100;
    const dx = dsSettings?.x !== undefined ? dsSettings.x.toString() : '2';
    const dy = dsSettings?.y !== undefined ? dsSettings.y.toString() : '2';
    const blur = parseFloat(dsSettings?.blur !== undefined ? dsSettings.blur : 2);
    const spread = parseFloat(dsSettings?.spread !== undefined ? dsSettings.spread : 0);

    let dsSource = 'SourceAlpha';
    if (spread !== 0) {
      const morph = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
      morph.setAttribute('operator', spread >= 0 ? 'dilate' : 'erode');
      morph.setAttribute('radius', Math.abs(spread).toString());
      morph.setAttribute('in', 'SourceAlpha');
      morph.setAttribute('result', 'ds_morph');
      filterEl.appendChild(morph);
      dsSource = 'ds_morph';
    }

    const gauss = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    gauss.setAttribute('stdDeviation', blur.toString());
    gauss.setAttribute('in', dsSource);
    gauss.setAttribute('result', 'ds_blur');
    filterEl.appendChild(gauss);

    const offset = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feOffset");
    offset.setAttribute('dx', dx);
    offset.setAttribute('dy', dy);
    offset.setAttribute('in', 'ds_blur');
    offset.setAttribute('result', 'ds_offset');
    filterEl.appendChild(offset);

    const flood = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feFlood");
    flood.setAttribute('flood-color', color);
    flood.setAttribute('flood-opacity', opacity.toString());
    flood.setAttribute('result', 'ds_flood');
    filterEl.appendChild(flood);

    const comp = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
    comp.setAttribute('in', 'ds_flood');
    comp.setAttribute('in2', 'ds_offset');
    comp.setAttribute('operator', 'in');
    comp.setAttribute('result', 'ds_final');
    filterEl.appendChild(comp);

    const merge = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const nodeShadow = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    nodeShadow.setAttribute('in', 'ds_final');
    const nodeGraphic = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    nodeGraphic.setAttribute('in', 'SourceGraphic');
    merge.appendChild(nodeShadow);
    merge.appendChild(nodeGraphic);
    filterEl.appendChild(merge);

    defs.appendChild(filterEl);
    selectedElement.setAttribute('filter', `url(#${filterId})`);
  };

  // Synchronize entire button SVG to MainEditor
  const syncButtonToCanvas = (withFilterSync = false, dsActive = null, dsSettings = null) => {
    if (!selectedElement) return;

    if (withFilterSync) {
      const isDs = dsActive !== null ? dsActive : activeEffects.includes('Drop Shadow');
      applyDropShadowFilter(isDs, dsSettings || effectSettings['Drop Shadow']);
    }

    const ownerDoc = selectedElement.ownerDocument || document;
    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const svgRoot = selectedElement.closest('svg') || editorDoc.querySelector('.page-svg-container svg') || editorDoc.querySelector('svg');
    if (!svgRoot) return;

    let defs = svgRoot.querySelector('defs');
    if (!defs) {
      defs = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }

    const btnId = selectedElement.id || selectedLayerId;
    const clipId = `clip-${btnId}`;
    let clipEl = defs.querySelector(`#${clipId}`);

    const isRibbon = selectedElement.getAttribute('data-button-shape') === 'ribbon';
    const isParallelogram = selectedElement.getAttribute('data-button-shape') === 'parallelogram';
    const isDiamond = selectedElement.getAttribute('data-button-shape') === 'diamond';
    const isArrow = selectedElement.getAttribute('data-button-shape') === 'arrow';
    const isSkew = selectedElement.getAttribute('data-button-shape') === 'skew';
    const isOutsideCircle = selectedElement.getAttribute('data-button-shape') === 'outside-circle';
    const isInsetCircle = selectedElement.getAttribute('data-button-shape') === 'inset-circle';
    const isPolygonShape = isRibbon || isParallelogram || isDiamond || isArrow;
    const isPathShape = isSkew || isOutsideCircle || isInsetCircle;
    const isCustomShape = isPolygonShape || isPathShape;
    const baseRect = selectedElement.querySelector('rect.btn-bg') || selectedElement.querySelector('rect:not(.button-hover-slide-rect):not(.btn-border)');
    if (baseRect && !baseRect.classList.contains('btn-bg')) {
      baseRect.classList.add('btn-bg');
    }

    const currentX = baseRect ? (baseRect.getAttribute('x') || '0') : '0';
    const currentY = baseRect ? (baseRect.getAttribute('y') || '0') : '0';
    const currentWidth = baseRect ? (baseRect.getAttribute('width') || '150') : '150';
    const currentHeight = baseRect ? (baseRect.getAttribute('height') || '42') : '42';
    const currentRx = isCustomShape ? '0' : (baseRect ? (baseRect.getAttribute('rx') || '10') : '10');
    const numX = parseFloat(currentX) || 0;
    const numY = parseFloat(currentY) || 0;
    const numWidth = parseFloat(currentWidth) || 150;
    const numHeight = parseFloat(currentHeight) || 42;
    const slantDx = Math.round(numHeight * 0.22);
    const ribbonPoints = `${numX},${numY} ${numX + numWidth},${numY} ${numX + numWidth - slantDx / 2},${numY + numHeight / 2} ${numX + numWidth},${numY + numHeight} ${numX},${numHeight + numY} ${numX + slantDx / 2},${numY + numHeight / 2}`;
    const pSlant = Math.round(numHeight * 0.35);
    const parallelogramPoints = `${numX + pSlant},${numY} ${numX + numWidth},${numY} ${numX + numWidth - pSlant},${numY + numHeight} ${numX},${numY + numHeight}`;
    const pointDx = Math.round(numHeight * 0.45);
    const diamondPoints = `${numX + pointDx},${numY} ${numX + numWidth - pointDx},${numY} ${numX + numWidth},${numY + numHeight / 2} ${numX + numWidth - pointDx},${numY + numHeight} ${numX + pointDx},${numY + numHeight} ${numX},${numY + numHeight / 2}`;
    const arrowDx = Math.round(numHeight * 0.45);
    const arrowPoints = `${numX},${numY} ${numX + numWidth - arrowDx},${numY} ${numX + numWidth},${numY + numHeight / 2} ${numX + numWidth - arrowDx},${numY + numHeight} ${numX},${numY + numHeight} ${numX + arrowDx},${numY + numHeight / 2}`;
    const polyShapePoints = isArrow ? arrowPoints : (isDiamond ? diamondPoints : (isParallelogram ? parallelogramPoints : ribbonPoints));

    const skewR = 12;
    const skewS = Math.round(numHeight * 0.25);
    const skewD = `M ${numX + skewR},${numY} L ${numX + numWidth - skewS - skewR},${numY} Q ${numX + numWidth - skewS},${numY} ${numX + numWidth - skewS + 3},${numY + skewR * 0.6} L ${numX + numWidth - 3},${numY + numHeight - skewR * 0.6} Q ${numX + numWidth},${numY + numHeight} ${numX + numWidth - skewR},${numY + numHeight} L ${numX + skewR},${numY + numHeight} A ${skewR},${skewR} 0 0 1 ${numX},${numY + numHeight - skewR} L ${numX},${numY + skewR} A ${skewR},${skewR} 0 0 1 ${numX + skewR},${numY} Z`;

    const ocRTop = 14;
    const ocRBot = 16;
    const outsideCircleD = `M ${numX},${numY + numHeight} Q ${numX + ocRBot * 0.7},${numY + numHeight} ${numX + ocRBot},${numY + numHeight - ocRBot} L ${numX + ocRBot},${numY + ocRTop} A ${ocRTop},${ocRTop} 0 0 1 ${numX + ocRBot + ocRTop},${numY} L ${numX + numWidth - ocRBot - ocRTop},${numY} A ${ocRTop},${ocRTop} 0 0 1 ${numX + numWidth - ocRBot},${numY + ocRTop} L ${numX + numWidth - ocRBot},${numY + numHeight - ocRBot} Q ${numX + numWidth - ocRBot * 0.7},${numY + numHeight} ${numX + numWidth},${numY + numHeight} Z`;

    const icR = 12;
    const insetCircleD = `M ${numX},${numY + icR} A ${icR},${icR} 0 0 0 ${numX + icR},${numY} L ${numX + numWidth - icR},${numY} A ${icR},${icR} 0 0 0 ${numX + numWidth},${numY + icR} L ${numX + numWidth},${numY + numHeight - icR} A ${icR},${icR} 0 0 0 ${numX + numWidth - icR},${numY + numHeight} L ${numX + icR},${numY + numHeight} A ${icR},${icR} 0 0 0 ${numX},${numY + numHeight - icR} Z`;

    const customPathD = isInsetCircle ? insetCircleD : (isOutsideCircle ? outsideCircleD : skewD);

    if (isRibbon) {
      const mainPoly = selectedElement.querySelector('.btn-main-poly');
      const currentFill = mainPoly?.getAttribute('data-fill-color') || mainPoly?.getAttribute('fill') || shapeFillColor;
      if (currentFill) {
        const accentCol = lightenColor(currentFill, 0.3);
        const accentLeft = selectedElement.querySelector('.btn-accent-left');
        const accentRight = selectedElement.querySelector('.btn-accent-right');
        if (accentLeft) {
          accentLeft.setAttribute('fill', accentCol);
          accentLeft.style.fill = accentCol;
        }
        if (accentRight) {
          accentRight.setAttribute('fill', accentCol);
          accentRight.style.fill = accentCol;
        }
      }
    }

    // 1. Ensure clipPath exists with exact dimensions
    if (!clipEl) {
      clipEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "clipPath");
      clipEl.setAttribute('id', clipId);
      if (isPathShape) {
        const clipPathEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "path");
        clipPathEl.setAttribute('d', customPathD);
        clipEl.appendChild(clipPathEl);
      } else if (isPolygonShape) {
        const clipPoly = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "polygon");
        clipPoly.setAttribute('points', polyShapePoints);
        clipEl.appendChild(clipPoly);
      } else {
        const clipRect = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "rect");
        clipRect.setAttribute('x', currentX);
        clipRect.setAttribute('y', currentY);
        clipRect.setAttribute('width', currentWidth);
        clipRect.setAttribute('height', currentHeight);
        clipRect.setAttribute('rx', currentRx);
        clipEl.appendChild(clipRect);
      }
      defs.appendChild(clipEl);
    } else {
      if (isPathShape) {
        let clipPathEl = clipEl.querySelector('path');
        if (!clipPathEl) {
          clipEl.innerHTML = '';
          clipPathEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "path");
          clipEl.appendChild(clipPathEl);
        }
        clipPathEl.setAttribute('d', customPathD);
      } else if (isPolygonShape) {
        let clipPoly = clipEl.querySelector('polygon');
        if (!clipPoly) {
          clipEl.innerHTML = '';
          clipPoly = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "polygon");
          clipEl.appendChild(clipPoly);
        }
        clipPoly.setAttribute('points', polyShapePoints);
      } else {
        let clipRect = clipEl.querySelector('rect');
        if (!clipRect) {
          clipEl.innerHTML = '';
          clipRect = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "rect");
          clipEl.appendChild(clipRect);
        }
        clipRect.setAttribute('x', currentX);
        clipRect.setAttribute('y', currentY);
        clipRect.setAttribute('width', currentWidth);
        clipRect.setAttribute('height', currentHeight);
        clipRect.setAttribute('rx', currentRx);
      }
    }

    // 2. Read hover attributes and calculate pixel-based directional offsets
    const hoverShapeFill = selectedElement.getAttribute('data-hover-shape-fill-val') || selectedElement.getAttribute('data-hover-shape-fill') || (hoverShapeFillColor && hoverShapeFillColor !== 'none' ? hoverShapeFillColor : shapeFillColor);
    const animDir = selectedElement.getAttribute('data-hover-animation') || hoverAnimationDirection || 'none';
    const hoverText = selectedElement.getAttribute('data-hover-text-fill-val') || selectedElement.getAttribute('data-hover-text-fill') || '';
    const hoverStroke = selectedElement.getAttribute('data-hover-stroke-color-val') || selectedElement.getAttribute('data-hover-stroke-color') || '';
    const hasAnimation = animDir && animDir !== 'none';

    let idleTransform = `translate(-${numWidth}px, 0px)`;
    let idleOpacity = '1';

    if (animDir === 'right-to-left') {
      idleTransform = `translate(${numWidth}px, 0px)`;
      idleOpacity = '1';
    } else if (animDir === 'top-to-bottom') {
      idleTransform = `translate(0px, -${numHeight}px)`;
      idleOpacity = '1';
    } else if (animDir === 'bottom-to-top') {
      idleTransform = `translate(0px, ${numHeight}px)`;
      idleOpacity = '1';
    } else if (animDir === 'left-to-right') {
      idleTransform = `translate(-${numWidth}px, 0px)`;
      idleOpacity = '1';
    } else {
      // none
      idleTransform = `translate(0px, 0px)`;
      idleOpacity = '0';
    }

    // 3. Ensure border rect sits on top so stroke is never covered by slide fill
    const textEl = selectedElement.querySelector('text');
    let borderRect = selectedElement.querySelector('rect.btn-border');
    if (isCustomShape) {
      if (borderRect) {
        borderRect.remove();
        borderRect = null;
      }
    } else {
      if (!borderRect && baseRect) {
        borderRect = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "rect");
        borderRect.setAttribute('class', 'btn-border');
        borderRect.setAttribute('x', currentX);
        borderRect.setAttribute('y', currentY);
        borderRect.setAttribute('width', currentWidth);
        borderRect.setAttribute('height', currentHeight);
        borderRect.setAttribute('rx', currentRx);
        borderRect.setAttribute('fill', 'none');
        borderRect.setAttribute('stroke', baseRect.getAttribute('stroke') || strokeColor);
        borderRect.setAttribute('stroke-width', baseRect.getAttribute('stroke-width') || strokeWidth.toString());
        borderRect.setAttribute('pointer-events', 'none');
        borderRect.style.pointerEvents = 'none';

        if (textEl) {
          selectedElement.insertBefore(borderRect, textEl);
        } else {
          selectedElement.appendChild(borderRect);
        }
      } else if (borderRect) {
        borderRect.setAttribute('x', currentX);
        borderRect.setAttribute('y', currentY);
        borderRect.setAttribute('width', currentWidth);
        borderRect.setAttribute('height', currentHeight);
        borderRect.setAttribute('rx', currentRx);
        borderRect.setAttribute('stroke', strokeColor);
        borderRect.setAttribute('stroke-width', strokeWidth.toString());
        borderRect.setAttribute('pointer-events', 'none');
        borderRect.style.pointerEvents = 'none';
        if (textEl && borderRect.nextSibling !== textEl) {
          selectedElement.insertBefore(borderRect, textEl);
        }
      }
    }

    // 4. Ensure sliding hover layer exists inside button <g> and placed ABOVE background shapes, BEFORE border/text
    let hoverGroup = selectedElement.querySelector('.button-hover-slide-group');
    let slideRect;
    const targetBefore = borderRect || textEl;

    if (!hoverGroup) {
      hoverGroup = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "g");
      hoverGroup.setAttribute('class', 'button-hover-slide-group');
      hoverGroup.setAttribute('clip-path', `url(#${clipId})`);
      hoverGroup.setAttribute('pointer-events', 'none');
      hoverGroup.style.pointerEvents = 'none';

      slideRect = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "rect");
      slideRect.setAttribute('class', 'button-hover-slide-rect');
      slideRect.setAttribute('x', currentX);
      slideRect.setAttribute('y', currentY);
      slideRect.setAttribute('width', currentWidth);
      slideRect.setAttribute('height', currentHeight);
      slideRect.setAttribute('rx', currentRx);
      slideRect.setAttribute('fill', hoverShapeFill);
      slideRect.setAttribute('stroke', 'none');
      slideRect.setAttribute('pointer-events', 'none');
      slideRect.style.pointerEvents = 'none';
      slideRect.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.35s ease';
      slideRect.style.transform = idleTransform;
      slideRect.style.opacity = idleOpacity;
      if (!hasAnimation) {
        slideRect.style.display = 'none';
      }

      hoverGroup.appendChild(slideRect);

      if (targetBefore) {
        selectedElement.insertBefore(hoverGroup, targetBefore);
      } else {
        selectedElement.appendChild(hoverGroup);
      }
    } else {
      hoverGroup.setAttribute('clip-path', `url(#${clipId})`);
      hoverGroup.setAttribute('pointer-events', 'none');
      hoverGroup.style.pointerEvents = 'none';

      if (targetBefore && hoverGroup.nextSibling !== targetBefore && hoverGroup !== targetBefore) {
        selectedElement.insertBefore(hoverGroup, targetBefore);
      }

      slideRect = hoverGroup.querySelector('.button-hover-slide-rect');
      if (slideRect) {
        slideRect.setAttribute('x', currentX);
        slideRect.setAttribute('y', currentY);
        slideRect.setAttribute('width', currentWidth);
        slideRect.setAttribute('height', currentHeight);
        slideRect.setAttribute('rx', currentRx);
        slideRect.setAttribute('fill', hoverShapeFill);
        slideRect.setAttribute('stroke', 'none');
        slideRect.setAttribute('pointer-events', 'none');
        slideRect.style.pointerEvents = 'none';
        slideRect.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.35s ease';
        slideRect.style.transform = idleTransform;
        slideRect.style.opacity = idleOpacity;
        slideRect.style.display = hasAnimation ? 'inline' : 'none';
      }
    }

    if (textEl) {
      textEl.setAttribute('pointer-events', 'none');
      textEl.style.pointerEvents = 'none';
    }

    // 5. Inject or update scoped CSS <style id="style-${btnId}"> in <defs>
    let styleEl = defs.querySelector(`#style-${btnId}`);
    if (!styleEl) {
      styleEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "style");
      styleEl.setAttribute('id', `style-${btnId}`);
      defs.appendChild(styleEl);
    }

    const hoverTextRule = hoverText ? `
      [id="${btnId}"]:hover text,
      [id="${btnId}"].is-hovered text {
        fill: ${hoverText} !important;
        transition: fill 0.35s ease !important;
      }
    ` : '';

    const hoverStrokeRule = hoverStroke ? `
      [id="${btnId}"]:hover .btn-border,
      [id="${btnId}"].is-hovered .btn-border,
      [id="${btnId}"]:hover .btn-main-poly,
      [id="${btnId}"].is-hovered .btn-main-poly,
      [id="${btnId}"]:hover rect[stroke]:not(.button-hover-slide-rect),
      [id="${btnId}"].is-hovered rect[stroke]:not(.button-hover-slide-rect) {
        stroke: ${hoverStroke} !important;
        transition: stroke 0.35s ease !important;
      }
    ` : '';

    const slideAnimationRule = hasAnimation ? `
      [id="${btnId}"] .button-hover-slide-rect {
        display: inline !important;
        transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.35s ease !important;
        pointer-events: none !important;
        transform: ${idleTransform} !important;
        opacity: ${idleOpacity} !important;
      }
      [id="${btnId}"]:hover .button-hover-slide-rect,
      [id="${btnId}"].is-hovered .button-hover-slide-rect {
        transform: translate(0px, 0px) !important;
        opacity: 1 !important;
      }
    ` : `
      [id="${btnId}"] .button-hover-slide-rect {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      ${hoverShapeFill ? `
      [id="${btnId}"]:hover .btn-main-poly,
      [id="${btnId}"].is-hovered .btn-main-poly${isCustomShape ? '' : `,
      [id="${btnId}"]:hover rect.btn-bg,
      [id="${btnId}"].is-hovered rect.btn-bg,
      [id="${btnId}"]:hover rect:not(.button-hover-slide-rect):not(.btn-border),
      [id="${btnId}"].is-hovered rect:not(.button-hover-slide-rect):not(.btn-border)`} {
        fill: ${hoverShapeFill} !important;
      }
      [id="${btnId}"]:hover .btn-accent-left,
      [id="${btnId}"].is-hovered .btn-accent-left,
      [id="${btnId}"]:hover .btn-accent-right,
      [id="${btnId}"].is-hovered .btn-accent-right {
        fill: ${lightenColor(hoverShapeFill, 0.3)} !important;
      }
      ` : ''}
    `;

    const cssRules = `
      [id="${btnId}"] {
        cursor: pointer;
      }
      [id="${btnId}"] text {
        text-anchor: middle !important;
        dominant-baseline: middle !important;
      }
      ${slideAnimationRule}
      ${hoverTextRule}
      ${hoverStrokeRule}
    `;

    styleEl.textContent = cssRules;

    if (onUpdate) {
      onUpdate();
    } else if (updateElementAttribute && selectedLayerId) {
      const serializer = new XMLSerializer();
      updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', serializer.serializeToString(svgRoot));
    }
  };

  // Dynamically update button width and center text with padding
  const updateButtonDimensions = (textVal, currentFontSize = fontSize, currentFontFamily = fontFamily) => {
    if (!selectedElement) return;

    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    const rectEl = selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);
    if (!textEl || !rectEl) return;

    // Estimate text width accurately using font size & character factor
    let measuredWidth = 0;
    try {
      if (typeof textEl.getComputedTextLength === 'function' && textEl.getComputedTextLength() > 0) {
        measuredWidth = textEl.getComputedTextLength();
      }
    } catch (_) {}

    if (!measuredWidth || measuredWidth < 10) {
      // Font metric multiplier based on font family
      const charRatio = currentFontFamily.toLowerCase().includes('banger') ? 0.6 : 0.58;
      measuredWidth = (textVal.length || 1) * (currentFontSize * charRatio);
    }

    // Horizontal padding on both sides (minimum 28px each side = 56px total)
    const horizontalPadding = 56;
    const minButtonWidth = 130;
    const currentW = parseFloat(rectEl.getAttribute('width') || 0);
    const neededWidth = Math.round(measuredWidth + horizontalPadding);
    const newButtonWidth = Math.max(minButtonWidth, currentW > 0 ? Math.max(currentW, neededWidth) : neededWidth);
    const rectX = parseFloat(rectEl.getAttribute('x') || 0);
    const rectY = parseFloat(rectEl.getAttribute('y') || 0);
    const currentH = parseFloat(rectEl.getAttribute('height') || 42);

    // Update rect width
    rectEl.setAttribute('width', newButtonWidth.toString());

    // Update clipPath rect width if present
    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const svgRoot = selectedElement.closest('svg') || editorDoc.querySelector('.page-svg-container svg') || editorDoc.querySelector('svg');
    const clipId = `clip-${selectedElement.id || selectedLayerId}`;
    const clipRect = svgRoot?.querySelector(`#${clipId} rect`);
    if (clipRect) {
      clipRect.setAttribute('x', rectX.toString());
      clipRect.setAttribute('y', rectY.toString());
      clipRect.setAttribute('width', newButtonWidth.toString());
      clipRect.setAttribute('height', currentH.toString());
    }

    // Update slide rect width if present
    const slideRect = selectedElement.querySelector('.button-hover-slide-rect');
    if (slideRect) {
      slideRect.setAttribute('x', rectX.toString());
      slideRect.setAttribute('y', rectY.toString());
      slideRect.setAttribute('width', newButtonWidth.toString());
      slideRect.setAttribute('height', currentH.toString());
    }

    // Update border rect width if present
    const borderRect = selectedElement.querySelector('rect.btn-border');
    if (borderRect) {
      borderRect.setAttribute('x', rectX.toString());
      borderRect.setAttribute('y', rectY.toString());
      borderRect.setAttribute('width', newButtonWidth.toString());
      borderRect.setAttribute('height', currentH.toString());
    }

    // Update ribbon, parallelogram, diamond, arrow, skew, outside-circle, or inset-circle shapes if present
    const isRibbon = selectedElement.getAttribute('data-button-shape') === 'ribbon';
    const isParallelogram = selectedElement.getAttribute('data-button-shape') === 'parallelogram';
    const isDiamond = selectedElement.getAttribute('data-button-shape') === 'diamond';
    const isArrow = selectedElement.getAttribute('data-button-shape') === 'arrow';
    const isSkew = selectedElement.getAttribute('data-button-shape') === 'skew';
    const isOutsideCircle = selectedElement.getAttribute('data-button-shape') === 'outside-circle';
    const isInsetCircle = selectedElement.getAttribute('data-button-shape') === 'inset-circle';
    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    const accentLeft = selectedElement.querySelector('.btn-accent-left');
    const accentRight = selectedElement.querySelector('.btn-accent-right');
    const slantDx = Math.round(currentH * 0.22);
    const pSlant = Math.round(currentH * 0.35);
    const pointDx = Math.round(currentH * 0.45);
    const arrowDx = Math.round(currentH * 0.45);
    const skewR = 12;
    const skewS = Math.round(currentH * 0.25);
    const skewD = `M ${rectX + skewR},${rectY} L ${rectX + newButtonWidth - skewS - skewR},${rectY} Q ${rectX + newButtonWidth - skewS},${rectY} ${rectX + newButtonWidth - skewS + 3},${rectY + skewR * 0.6} L ${rectX + newButtonWidth - 3},${rectY + currentH - skewR * 0.6} Q ${rectX + newButtonWidth},${rectY + currentH} ${rectX + newButtonWidth - skewR},${rectY + currentH} L ${rectX + skewR},${rectY + currentH} A ${skewR},${skewR} 0 0 1 ${rectX},${rectY + currentH - skewR} L ${rectX},${rectY + skewR} A ${skewR},${skewR} 0 0 1 ${rectX + skewR},${rectY} Z`;

    const ocRTop = 14;
    const ocRBot = 16;
    const outsideCircleD = `M ${rectX},${rectY + currentH} Q ${rectX + ocRBot * 0.7},${rectY + currentH} ${rectX + ocRBot},${rectY + currentH - ocRBot} L ${rectX + ocRBot},${rectY + ocRTop} A ${ocRTop},${ocRTop} 0 0 1 ${rectX + ocRBot + ocRTop},${rectY} L ${rectX + newButtonWidth - ocRBot - ocRTop},${rectY} A ${ocRTop},${ocRTop} 0 0 1 ${rectX + newButtonWidth - ocRBot},${rectY + ocRTop} L ${rectX + newButtonWidth - ocRBot},${rectY + currentH - ocRBot} Q ${rectX + newButtonWidth - ocRBot * 0.7},${rectY + currentH} ${rectX + newButtonWidth},${rectY + currentH} Z`;

    const icR = 12;
    const insetCircleD = `M ${rectX},${rectY + icR} A ${icR},${icR} 0 0 0 ${rectX + icR},${rectY} L ${rectX + newButtonWidth - icR},${rectY} A ${icR},${icR} 0 0 0 ${rectX + newButtonWidth},${rectY + icR} L ${rectX + newButtonWidth},${rectY + currentH - icR} A ${icR},${icR} 0 0 0 ${rectX + newButtonWidth - icR},${rectY + currentH} L ${rectX + icR},${rectY + currentH} A ${icR},${icR} 0 0 0 ${rectX},${rectY + currentH - icR} Z`;

    if (mainPoly) {
      mainPoly.removeAttribute('transform');
      if (isInsetCircle) {
        mainPoly.setAttribute('d', insetCircleD);
      } else if (isOutsideCircle) {
        mainPoly.setAttribute('d', outsideCircleD);
      } else if (isSkew) {
        mainPoly.setAttribute('d', skewD);
      } else if (isArrow) {
        mainPoly.setAttribute('points', `${rectX},${rectY} ${rectX + newButtonWidth - arrowDx},${rectY} ${rectX + newButtonWidth},${rectY + currentH / 2} ${rectX + newButtonWidth - arrowDx},${rectY + currentH} ${rectX},${rectY + currentH} ${rectX + arrowDx},${rectY + currentH / 2}`);
      } else if (isDiamond) {
        mainPoly.setAttribute('points', `${rectX + pointDx},${rectY} ${rectX + newButtonWidth - pointDx},${rectY} ${rectX + newButtonWidth},${rectY + currentH / 2} ${rectX + newButtonWidth - pointDx},${rectY + currentH} ${rectX + pointDx},${rectY + currentH} ${rectX},${rectY + currentH / 2}`);
      } else if (isParallelogram) {
        mainPoly.setAttribute('points', `${rectX + pSlant},${rectY} ${rectX + newButtonWidth},${rectY} ${rectX + newButtonWidth - pSlant},${rectY + currentH} ${rectX},${rectY + currentH}`);
      } else {
        mainPoly.setAttribute('points', `${rectX},${rectY} ${rectX + newButtonWidth - slantDx},${rectY} ${rectX + newButtonWidth},${rectY + currentH} ${rectX + slantDx},${rectY + currentH}`);
      }
    }
    if (accentLeft) {
      accentLeft.removeAttribute('transform');
      accentLeft.setAttribute('points', `${rectX},${rectY + currentH} ${rectX + slantDx},${rectY + currentH} ${rectX + slantDx / 2},${rectY + currentH / 2}`);
    }
    if (accentRight) {
      accentRight.removeAttribute('transform');
      accentRight.setAttribute('points', `${rectX + newButtonWidth - slantDx},${rectY} ${rectX + newButtonWidth},${rectY} ${rectX + newButtonWidth - slantDx / 2},${rectY + currentH / 2}`);
    }

    const clipPathEl = svgRoot?.querySelector(`#${clipId} path`);
    if (clipPathEl) {
      if (isInsetCircle) {
        clipPathEl.setAttribute('d', insetCircleD);
      } else if (isOutsideCircle) {
        clipPathEl.setAttribute('d', outsideCircleD);
      } else if (isSkew) {
        clipPathEl.setAttribute('d', skewD);
      }
    }

    const clipPoly = svgRoot?.querySelector(`#${clipId} polygon`);
    if (clipPoly) {
      if (isArrow) {
        clipPoly.setAttribute('points', `${rectX},${rectY} ${rectX + newButtonWidth - arrowDx},${rectY} ${rectX + newButtonWidth},${rectY + currentH / 2} ${rectX + newButtonWidth - arrowDx},${rectY + currentH} ${rectX},${rectY + currentH} ${rectX + arrowDx},${rectY + currentH / 2}`);
      } else if (isDiamond) {
        clipPoly.setAttribute('points', `${rectX + pointDx},${rectY} ${rectX + newButtonWidth - pointDx},${rectY} ${rectX + newButtonWidth},${rectY + currentH / 2} ${rectX + newButtonWidth - pointDx},${rectY + currentH} ${rectX + pointDx},${rectY + currentH} ${rectX},${rectY + currentH / 2}`);
      } else if (isParallelogram) {
        clipPoly.setAttribute('points', `${rectX + pSlant},${rectY} ${rectX + newButtonWidth},${rectY} ${rectX + newButtonWidth - pSlant},${rectY + currentH} ${rectX},${rectY + currentH}`);
      } else {
        clipPoly.setAttribute('points', `${rectX},${rectY} ${rectX + newButtonWidth},${rectY} ${rectX + newButtonWidth - slantDx / 2},${rectY + currentH / 2} ${rectX + newButtonWidth},${rectY + currentH} ${rectX},${rectY + currentH} ${rectX + slantDx / 2},${rectY + currentH / 2}`);
      }
    }

    // Center text at exact center of button
    const centerX = rectX + newButtonWidth / 2;
    const centerY = rectY + currentH / 2;
    textEl.setAttribute('x', centerX.toString());
    textEl.setAttribute('y', centerY.toString());
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('dominant-baseline', 'middle');
    textEl.style.textAnchor = 'middle';
    textEl.style.dominantBaseline = 'middle';
    textEl.removeAttribute('transform');
  };

  // Text Handlers
  const handleTextChange = (newVal) => {
    if (newVal.length > 30) return;
    setButtonText(newVal);
    if (!selectedElement) return;

    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    if (textEl) {
      textEl.textContent = newVal;
      updateButtonDimensions(newVal, fontSize, fontFamily);
      syncButtonToCanvas();
    }
  };

  const handleFontFamilyChange = (val) => {
    setFontFamily(val);
    if (!selectedElement) return;

    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    if (textEl) {
      textEl.setAttribute('font-family', val);
      textEl.style.fontFamily = val;
      updateButtonDimensions(buttonText, fontSize, val);
      syncButtonToCanvas();
    }
  };

  const handleFontWeightChange = (val) => {
    setFontWeight(val);
    if (!selectedElement) return;

    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    if (textEl) {
      textEl.setAttribute('font-weight', val);
      textEl.style.fontWeight = val;
      syncButtonToCanvas();
    }
  };

  const handleFontSizeChange = (val) => {
    setFontSize(val);
    if (!selectedElement) return;

    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    if (textEl) {
      textEl.setAttribute('font-size', val);
      textEl.style.fontSize = `${val}px`;
      updateButtonDimensions(buttonText, val, fontFamily);
      syncButtonToCanvas();
    }
  };

  // Helper to generate and inject SVG linear/radial gradient in <defs>
  const applySvgGradient = (colorVal, targetAttr, targetElName) => {
    if (!selectedElement) return colorVal;

    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const svgRoot = selectedElement.closest('svg') || editorDoc.querySelector('.page-svg-container svg') || editorDoc.querySelector('svg');
    if (!svgRoot) return colorVal;

    const ownerDoc = svgRoot.ownerDocument || document;
    let defs = svgRoot.querySelector('defs');
    if (!defs) {
      defs = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }

    const baseGradId = `grad-${selectedElement.id || selectedLayerId}-${targetElName}-${targetAttr}`;
    Array.from(defs.querySelectorAll(`[id^="${baseGradId}"]`)).forEach(old => old.remove());

    if (!colorVal || !colorVal.includes('gradient')) {
      return colorVal;
    }

    const parsed = parseGradient(colorVal);
    if (!parsed || !parsed.stops || parsed.stops.length === 0) {
      return colorVal;
    }

    const gradId = `${baseGradId}-${Math.random().toString(36).substr(2, 4)}`;
    let gradEl;

    if (parsed.type === 'Linear') {
      gradEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      const angleRad = ((parsed.angle || 0) * Math.PI) / 180;
      const dx = Math.sin(angleRad) * 50;
      const dy = -Math.cos(angleRad) * 50;
      gradEl.setAttribute('x1', `${Math.round(50 - dx)}%`);
      gradEl.setAttribute('y1', `${Math.round(50 - dy)}%`);
      gradEl.setAttribute('x2', `${Math.round(50 + dx)}%`);
      gradEl.setAttribute('y2', `${Math.round(50 + dy)}%`);
    } else {
      gradEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
      gradEl.setAttribute('cx', '50%');
      gradEl.setAttribute('cy', '50%');
      gradEl.setAttribute('r', `${parsed.radius || 50}%`);
    }

    gradEl.setAttribute('id', gradId);
    parsed.stops.forEach(stop => {
      const stopEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "stop");
      stopEl.setAttribute('offset', `${stop.offset}%`);
      stopEl.setAttribute('stop-color', stop.color);
      stopEl.setAttribute('stop-opacity', ((stop.opacity !== undefined ? stop.opacity : 100) / 100).toString());
      gradEl.appendChild(stopEl);
    });

    defs.appendChild(gradEl);
    return `url(#${gradId})`;
  };

  const handleTextFillColorChange = (color) => {
    setTextFillColor(color);
    if (!selectedElement) return;

    const textEl = selectedElement.querySelector('text') || (selectedElement.tagName?.toLowerCase() === 'text' ? selectedElement : null);
    if (textEl) {
      const fillVal = applySvgGradient(color, 'fill', 'text');
      textEl.setAttribute('fill', fillVal);
      textEl.style.fill = fillVal;
      textEl.setAttribute('data-fill-color', color);
      syncButtonToCanvas();
    }
  };

  // Shape Handlers
  const handleShapeFillColorChange = (color) => {
    setShapeFillColor(color);
    if (!selectedElement) return;

    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    if (mainPoly) {
      const fillVal = applySvgGradient(color, 'fill', 'poly');
      mainPoly.setAttribute('fill', fillVal);
      mainPoly.style.fill = fillVal;
      mainPoly.setAttribute('data-fill-color', color);

      // Automatically update both corner accent flaps with matching lighter shade
      const accentColor = lightenColor(color, 0.3);
      const accentLeft = selectedElement.querySelector('.btn-accent-left');
      const accentRight = selectedElement.querySelector('.btn-accent-right');
      if (accentLeft) {
        accentLeft.setAttribute('fill', accentColor);
        accentLeft.style.fill = accentColor;
        accentLeft.setAttribute('data-fill-color', accentColor);
      }
      if (accentRight) {
        accentRight.setAttribute('fill', accentColor);
        accentRight.style.fill = accentColor;
        accentRight.setAttribute('data-fill-color', accentColor);
      }
    }

    const rectEl = !mainPoly ? (selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null)) : null;
    if (rectEl) {
      const fillVal = applySvgGradient(color, 'fill', 'rect');
      rectEl.setAttribute('fill', fillVal);
      rectEl.setAttribute('data-fill-color', color);
    }

    if (!selectedElement.getAttribute('data-hover-shape-fill')) {
      setHoverShapeFillColor(color);
    }
    syncButtonToCanvas();
  };

  const handleStrokeColorChange = (color) => {
    setStrokeColor(color);
    if (!selectedElement) return;

    const isParallelogram = selectedElement.getAttribute('data-button-shape') === 'parallelogram';
    const isDiamond = selectedElement.getAttribute('data-button-shape') === 'diamond';
    const isArrow = selectedElement.getAttribute('data-button-shape') === 'arrow';
    const isSkew = selectedElement.getAttribute('data-button-shape') === 'skew';
    const isOutsideCircle = selectedElement.getAttribute('data-button-shape') === 'outside-circle';
    const isPolyButton = isParallelogram || isDiamond || isArrow || isSkew || isOutsideCircle;
    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    const rectEl = selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);

    if (isPolyButton && mainPoly) {
      const strokeVal = applySvgGradient(color, 'stroke', 'poly');
      mainPoly.setAttribute('stroke', strokeVal);
      mainPoly.style.stroke = strokeVal;
      mainPoly.setAttribute('data-stroke-color', color);
      if (strokeWidth === 0) {
        setStrokeWidth(1.8);
        mainPoly.setAttribute('stroke-width', '1.8');
        mainPoly.style.strokeWidth = '1.8';
      }
      syncButtonToCanvas();
    } else if (rectEl) {
      const strokeVal = applySvgGradient(color, 'stroke', 'rect');
      rectEl.setAttribute('stroke', strokeVal);
      rectEl.style.stroke = strokeVal;
      rectEl.setAttribute('data-stroke-color', color);
      syncButtonToCanvas();
    }
  };

  // Hover Handlers
  const handleHoverTextFillColorChange = (color) => {
    setHoverTextFillColor(color);
    if (!selectedElement) return;

    const hoverVal = color && color.includes('gradient') ? applySvgGradient(color, 'fill', 'hover-text') : color;
    selectedElement.setAttribute('data-hover-text-fill', color);
    selectedElement.setAttribute('data-hover-text-fill-val', hoverVal);
    syncButtonToCanvas();
  };

  const handleHoverShapeFillColorChange = (color) => {
    setHoverShapeFillColor(color);
    if (!selectedElement) return;

    const hoverVal = color && color.includes('gradient') ? applySvgGradient(color, 'fill', 'hover-rect') : color;
    selectedElement.setAttribute('data-hover-shape-fill', color);
    selectedElement.setAttribute('data-hover-shape-fill-val', hoverVal);
    syncButtonToCanvas();
  };

  const handleHoverStrokeColorChange = (color) => {
    setHoverStrokeColor(color);
    if (!selectedElement) return;

    const hoverVal = color && color.includes('gradient') ? applySvgGradient(color, 'stroke', 'hover-rect') : color;
    selectedElement.setAttribute('data-hover-stroke-color', color);
    selectedElement.setAttribute('data-hover-stroke-color-val', hoverVal);
    syncButtonToCanvas();
  };

  const handleHoverAnimationDirectionChange = (dir) => {
    setHoverAnimationDirection(dir);
    if (!selectedElement) return;

    selectedElement.setAttribute('data-hover-animation', dir);
    syncButtonToCanvas();
  };

  const handleStrokeWidthChange = (val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setStrokeWidth(num);
    if (!selectedElement) return;

    const isParallelogram = selectedElement.getAttribute('data-button-shape') === 'parallelogram';
    const isDiamond = selectedElement.getAttribute('data-button-shape') === 'diamond';
    const isArrow = selectedElement.getAttribute('data-button-shape') === 'arrow';
    const isSkew = selectedElement.getAttribute('data-button-shape') === 'skew';
    const isOutsideCircle = selectedElement.getAttribute('data-button-shape') === 'outside-circle';
    const isPolyButton = isParallelogram || isDiamond || isArrow || isSkew || isOutsideCircle;
    const mainPoly = selectedElement.querySelector('.btn-main-poly');
    const rectEl = selectedElement.querySelector('rect') || (selectedElement.tagName?.toLowerCase() === 'rect' ? selectedElement : null);

    if (isPolyButton && mainPoly) {
      mainPoly.setAttribute('stroke-width', num.toString());
      mainPoly.style.strokeWidth = num.toString();
      syncButtonToCanvas();
    } else if (rectEl) {
      rectEl.setAttribute('stroke-width', num.toString());
      rectEl.style.strokeWidth = num.toString();
      syncButtonToCanvas();
    }
  };

  const toggleSection = (sectionName) => {
    setOpenSection(prev => prev === sectionName ? null : sectionName);
  };

  return (
    <div className="w-full flex flex-col gap-[1vw] font-sans text-gray-800">
      {/* Title */}
      <h1 className="text-[1.1vw] font-bold text-[#111827]">Button Properties</h1>

      {/* ─── Text Property Section ────────────────────────────── */}
      <div className="flex flex-col gap-[0.75vw]">
        <SectionHeader title="Text Property" />

        {/* 1. Text input box with counter 6/30 */}
        <div className="relative border border-gray-300 rounded-[0.75vw] bg-white h-[2.5vw] flex items-center px-[0.85vw] hover:border-indigo-500 focus-within:border-indigo-500 transition-colors">
          <input
            type="text"
            value={buttonText}
            onChange={(e) => handleTextChange(e.target.value)}
            maxLength={30}
            placeholder="Button text"
            className="w-full h-full pr-[3vw] text-[0.85vw] font-semibold text-gray-800 outline-none bg-transparent"
          />
          <span className="absolute right-[0.85vw] text-[0.7vw] font-medium text-gray-400 select-none">
            {buttonText.length}/30
          </span>
        </div>

        {/* 2. Font Family dropdown */}
        <div className="border border-gray-300 rounded-[0.75vw] bg-white h-[2.5vw] flex items-center hover:border-indigo-500 focus-within:border-indigo-500 transition-colors">
          <select
            value={fontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="w-full h-full px-[0.85vw] text-[0.85vw] font-semibold text-gray-700 bg-transparent outline-none cursor-pointer appearance-none truncate"
            style={{
              background: 'url("data:image/svg+xml;utf8,<svg fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\' width=\'16\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'></path></svg>") no-repeat right 0.75vw center'
            }}
          >
            <option value="-apple-system">System Default</option>
            {fontFamilies.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* 3. Font Weight (left) and Font Size (right) */}
        <div className="flex gap-[0.65vw]">
          {/* Font Weight */}
          <div className="flex-[1.4] border border-gray-300 rounded-[0.75vw] bg-white h-[2.5vw] flex items-center hover:border-indigo-500 focus-within:border-indigo-500 transition-colors">
            <select
              value={fontWeight}
              onChange={(e) => handleFontWeightChange(e.target.value)}
              className="w-full h-full px-[0.85vw] text-[0.85vw] font-semibold text-gray-700 bg-transparent outline-none cursor-pointer appearance-none truncate"
              style={{
                background: 'url("data:image/svg+xml;utf8,<svg fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\' width=\'16\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'></path></svg>") no-repeat right 0.75vw center'
              }}
            >
              {fontWeights.map(w => (
                <option key={w.value} value={w.value}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="flex-[1] border border-gray-300 rounded-[0.75vw] bg-white h-[2.5vw] flex items-center hover:border-indigo-500 focus-within:border-indigo-500 transition-colors">
            <select
              value={fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
              className="w-full h-full px-[0.85vw] text-[0.85vw] font-semibold text-gray-700 bg-transparent outline-none cursor-pointer appearance-none"
              style={{
                background: 'url("data:image/svg+xml;utf8,<svg fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\' width=\'16\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'></path></svg>") no-repeat right 0.75vw center'
              }}
            >
              {fontSizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Text Fill Color Accordion */}
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
          <div
            onClick={() => toggleSection('textFill')}
            className={`flex items-center justify-between px-[1vw] py-[0.85vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openSection === 'textFill' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
          >
            <span className={`font-semibold text-[0.85vw] ${openSection === 'textFill' ? 'text-gray-900' : 'text-gray-600'}`}>
              Fill Color
            </span>
            <ChevronDown size="1vw" className={`transition-transform duration-200 text-gray-500 ${openSection === 'textFill' ? 'rotate-180 text-gray-900' : ''}`} />
          </div>

          {openSection === 'textFill' && (
            <div className="p-[1vw] flex items-center justify-between gap-[0.5vw]">
              <div
                className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
                style={{ background: textFillColor.includes('gradient') ? textFillColor : textFillColor }}
                onClick={() => setActiveColorPicker(activeColorPicker === 'textFill' ? null : 'textFill')}
              />
              <div className="flex-1 flex items-center border border-gray-300 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white px-[0.5vw]">
                <input
                  type="text"
                  value={textFillColor.includes('gradient') ? 'GRADIENT' : textFillColor}
                  onChange={(e) => handleTextFillColorChange(e.target.value)}
                  maxLength={textFillColor.includes('gradient') ? 20 : 7}
                  className="w-full text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent uppercase"
                />
              </div>
              {activeColorPicker === 'textFill' && createPortal(
                <div
                  className="fixed z-[5000]"
                  style={{ top: '50%', right: '19.5vw', transform: 'translateY(-50%)' }}
                >
                  <ColorPicker
                    color={textFillColor}
                    onChange={handleTextFillColorChange}
                    onClose={() => setActiveColorPicker(null)}
                    disableGradient={false}
                  />
                </div>,
                document.body
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Shape Properties Section ─────────────────────────── */}
      <div className="flex flex-col gap-[0.75vw]">
        <SectionHeader title="Shape Properties" />

        {/* 1. Shape Fill Color Accordion */}
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
          <div
            onClick={() => toggleSection('shapeFill')}
            className={`flex items-center justify-between px-[1vw] py-[0.85vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openSection === 'shapeFill' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
          >
            <span className={`font-semibold text-[0.85vw] ${openSection === 'shapeFill' ? 'text-gray-900' : 'text-gray-600'}`}>
              Fill Color
            </span>
            <ChevronDown size="1vw" className={`transition-transform duration-200 text-gray-500 ${openSection === 'shapeFill' ? 'rotate-180 text-gray-900' : ''}`} />
          </div>

          {openSection === 'shapeFill' && (
            <div className="p-[1vw] flex items-center justify-between gap-[0.5vw]">
              <div
                className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
                style={{ background: shapeFillColor.includes('gradient') ? shapeFillColor : shapeFillColor }}
                onClick={() => setActiveColorPicker(activeColorPicker === 'shapeFill' ? null : 'shapeFill')}
              />
              <div className="flex-1 flex items-center border border-gray-300 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white px-[0.5vw]">
                <input
                  type="text"
                  value={shapeFillColor.includes('gradient') ? 'GRADIENT' : shapeFillColor}
                  onChange={(e) => handleShapeFillColorChange(e.target.value)}
                  maxLength={shapeFillColor.includes('gradient') ? 20 : 7}
                  className="w-full text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent uppercase"
                />
              </div>
              {activeColorPicker === 'shapeFill' && createPortal(
                <div
                  className="fixed z-[5000]"
                  style={{ top: '50%', right: '19.5vw', transform: 'translateY(-50%)' }}
                >
                  <ColorPicker
                    color={shapeFillColor}
                    onChange={handleShapeFillColorChange}
                    onClose={() => setActiveColorPicker(null)}
                    disableGradient={false}
                  />
                </div>,
                document.body
              )}
            </div>
          )}
        </div>

        {/* 2. Stroke Color Accordion (Exact Text Property implementation from Color.jsx) */}
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
          <div
            onClick={() => toggleSection('strokeColor')}
            className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openSection === 'strokeColor' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
          >
            <div className="flex items-center gap-[0.5vw]">
              <span className={`font-semibold text-[0.85vw] ${openSection === 'strokeColor' ? 'text-gray-900' : 'text-gray-500'}`}>Stroke Color</span>
            </div>
            <div className="flex items-center gap-[0.5vw]">
              {openSection === 'strokeColor' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStrokeColorChange('none');
                    handleStrokeWidthChange(0);
                    setStrokeOpacity(100);
                    setStrokeAlignment('Center');
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors p-[0.1vw] cursor-pointer flex items-center justify-center"
                  title="Reset Stroke"
                >
                  <Icon icon="ix:reset" width="1.1vw" height="1.1vw" style={{ strokeWidth: 2.5 }} />
                </button>
              )}
              <ChevronUp size="1vw" className={`transition-transform duration-200 ${openSection === 'strokeColor' ? 'text-gray-900' : 'rotate-180 text-gray-500'}`} />
            </div>
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${openSection === 'strokeColor' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="p-[1vw] pt-[0.75vw] flex flex-col gap-[0.75vw]">

                {/* Row 1: Color Picker */}
                <div className="flex items-center justify-between gap-[0.5vw]">
                  {/* Swatch */}
                  <div
                    className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer"
                    onClick={() => setActiveColorPicker(activeColorPicker === 'strokeColor' ? null : 'strokeColor')}
                  >
                    <div
                      className="w-full h-full border border-gray-200"
                      style={{
                        background: (!strokeColor || strokeColor === 'none' || strokeColor === 'transparent' || strokeColor === '#')
                          ? 'white'
                          : strokeColor
                      }}
                    />
                    {(!strokeColor || strokeColor === 'none' || strokeColor === 'transparent' || strokeColor === '#') && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
                    )}
                  </div>

                  {/* Input box */}
                  <div className="flex-grow flex items-center border-[0.1vw] border-gray-200 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white hover:border-indigo-400 transition-colors px-[0.5vw]">
                    <input
                      type="text"
                      value={(!strokeColor || strokeColor === 'none' || strokeColor === 'transparent') ? '#' : (strokeColor.includes('gradient') ? 'GRADIENT' : strokeColor.toUpperCase())}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || val === '#') {
                          handleStrokeColorChange('none');
                        } else {
                          const finalVal = val.startsWith('#') ? val : '#' + val;
                          handleStrokeColorChange(finalVal);
                        }
                      }}
                      className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw] tracking-tight"
                      maxLength={7}
                    />
                    <div
                      className="flex items-center gap-[0.1vw] ml-[0.5vw] cursor-ew-resize select-none px-[0.2vw] hover:bg-gray-50 rounded"
                    >
                      <span className="text-[0.75vw] font-medium text-gray-600">
                        {strokeOpacity}%
                      </span>
                    </div>
                  </div>

                  {/* HEX Dropdown */}
                  <div className="h-[2vw] flex items-center justify-between px-[0.5vw] border border-gray-200 rounded-[0.5vw] bg-white cursor-pointer hover:bg-gray-50 min-w-[3.5vw]">
                    <span className="text-[0.7vw] text-gray-600 font-medium">HEX</span>
                    <ChevronDown size="0.8vw" className="text-gray-400 ml-[0.2vw]" />
                  </div>

                  {activeColorPicker === 'strokeColor' && createPortal(
                    <div
                      className="fixed z-[5000]"
                      style={{ top: '50%', right: '19.5vw', transform: 'translateY(-50%)' }}
                    >
                      <ColorPicker
                        color={(!strokeColor || strokeColor === 'none') ? '#c71585' : strokeColor}
                        onChange={handleStrokeColorChange}
                        onClose={() => setActiveColorPicker(null)}
                        disableGradient={false}
                      />
                    </div>,
                    document.body
                  )}
                </div>

                {/* Stroke Properties */}
                <div className={`flex flex-col gap-[0.75vw] ${(!strokeColor || strokeColor === 'none' || strokeColor === '#' || strokeColor === 'transparent') ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Row 2: Alignment and Stroke Width */}
                  <div className="flex items-center gap-[1vw]">
                    {/* Alignment */}
                    <div className="flex-1 flex flex-col gap-[0.3vw]">
                      <span className="text-[0.7vw] text-gray-500 font-medium">Alignment</span>
                      <div className="relative">
                        <div
                          className="h-[2vw] px-[0.5vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-between bg-white cursor-pointer hover:bg-gray-50"
                          onClick={() => setIsStrokeAlignOpen(!isStrokeAlignOpen)}
                        >
                          <span className="text-[0.75vw] font-medium text-gray-700 capitalize">{strokeAlignment || 'Center'}</span>
                          <ChevronDown size="0.8vw" className="text-gray-400" />
                        </div>
                        {isStrokeAlignOpen && (
                          <>
                            <div className="fixed inset-0 z-[40]" onClick={(e) => { e.stopPropagation(); setIsStrokeAlignOpen(false); }} />
                            <div className="absolute top-[110%] left-0 right-0 bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-50 py-1 overflow-hidden">
                              {['Inside', 'Center', 'Outside'].map(pos => (
                                <div
                                  key={pos}
                                  onClick={() => {
                                    setStrokeAlignment(pos);
                                    if (selectedElement) {
                                      selectedElement.setAttribute('data-stroke-alignment', pos);
                                      syncButtonToCanvas();
                                    }
                                    setIsStrokeAlignOpen(false);
                                  }}
                                  className="px-[1vw] py-[0.4vw] text-[0.7vw] font-semibold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                                >
                                  {pos}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stroke Width */}
                    <div className="flex-1 flex flex-col gap-[0.3vw]">
                      <span className="text-[0.7vw] text-gray-500 font-medium">Stoke Width</span>
                      <div className="flex items-center gap-[0.3vw] h-[2vw]">
                        <button
                          className="w-[2vw] h-full flex items-center justify-center bg-gray-100 rounded-[0.3vw] text-gray-600 hover:bg-gray-200 transition-colors"
                          onClick={() => {
                            handleStrokeWidthChange(Math.max(0, strokeWidth - 1));
                          }}
                        >
                          <span className="text-[1vw] leading-none mb-[0.1vw]">-</span>
                        </button>
                        <div className="flex-grow h-full bg-white border border-gray-200 rounded-[0.5vw] flex items-center">
                          <input
                            type="number"
                            value={strokeWidth}
                            onChange={(e) => handleStrokeWidthChange(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full h-full text-[0.75vw] font-medium outline-none text-center bg-transparent text-gray-700 no-spin"
                          />
                        </div>
                        <button
                          className="w-[2vw] h-full flex items-center justify-center bg-gray-100 rounded-[0.3vw] text-gray-600 hover:bg-gray-200 transition-colors"
                          onClick={() => {
                            handleStrokeWidthChange(strokeWidth + 1);
                          }}
                        >
                          <span className="text-[1vw] leading-none mb-[0.1vw]">+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* 3. Effect Accordion (reuses existing Effect component, Drop Shadow alone) */}
        <Effect
          isShape={true}
          hideBlur={true}
          hideInnerShadow={true}
          openSubSection={openSection === 'effect' ? 'effect' : null}
          setOpenSubSection={(s) => setOpenSection(s === 'effect' ? 'effect' : null)}
          activeEffects={activeEffects}
          setActiveEffects={(updater) => {
            const next = typeof updater === 'function' ? updater(activeEffects) : updater;
            setActiveEffects(next);
            if (!selectedElement) return;

            const hasDropShadow = next.includes('Drop Shadow');

            selectedElement.setAttribute('data-effect-drop-shadow', hasDropShadow ? 'true' : 'false');
            selectedElement.setAttribute('data-effect-inner-shadow', 'false');
            selectedElement.setAttribute('data-effect-blur', 'false');

            syncButtonToCanvas(true, hasDropShadow);
          }}
          effectSettings={effectSettings}
          setEffectSettings={(updater) => {
            const next = typeof updater === 'function' ? updater(effectSettings) : updater;
            setEffectSettings(next);
            if (!selectedElement) return;

            if (next['Drop Shadow']) {
              selectedElement.setAttribute('data-effect-drop-shadow-x', next['Drop Shadow'].x.toString());
              selectedElement.setAttribute('data-effect-drop-shadow-y', next['Drop Shadow'].y.toString());
              selectedElement.setAttribute('data-effect-drop-shadow-blur', next['Drop Shadow'].blur.toString());
              selectedElement.setAttribute('data-effect-drop-shadow-spread', next['Drop Shadow'].spread.toString());
              selectedElement.setAttribute('data-effect-drop-shadow-color', next['Drop Shadow'].color);
              selectedElement.setAttribute('data-effect-drop-shadow-opacity', next['Drop Shadow'].opacity.toString());
            }

            syncButtonToCanvas(true, activeEffects.includes('Drop Shadow'), next['Drop Shadow']);
          }}
          activeColorPicker={activeColorPicker}
          setActiveColorPicker={setActiveColorPicker}
          showDetailedPicker={false}
          setShowDetailedPicker={() => {}}
        />
      </div>

      {/* ─── Hover Properties Section ─────────────────────────── */}
      <div className="flex flex-col gap-[0.75vw]">
        <SectionHeader title="Hover Properties" />

        {/* Animation Direction Selector */}
        <div className="flex flex-col gap-[0.4vw]">
          <span className="text-[0.75vw] font-semibold text-gray-700">Animation Direction :</span>
          <div className="relative">
            <select
              value={hoverAnimationDirection}
              onChange={(e) => handleHoverAnimationDirectionChange(e.target.value)}
              className="w-full h-[2.2vw] px-[0.75vw] pr-[2vw] bg-white border border-gray-300 rounded-[0.5vw] text-[0.8vw] font-medium text-gray-800 outline-none hover:border-gray-400 focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              {hoverAnimationDirections.map((dir) => (
                <option key={dir.id} value={dir.id}>
                  {dir.label}
                </option>
              ))}
            </select>
            <ChevronDown size="1vw" className="absolute right-[0.75vw] top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* 1. Hover Text Fill Color Accordion */}
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
          <div
            onClick={() => toggleSection('hoverTextFill')}
            className={`flex items-center justify-between px-[1vw] py-[0.85vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openSection === 'hoverTextFill' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
          >
            <span className={`font-semibold text-[0.85vw] ${openSection === 'hoverTextFill' ? 'text-gray-900' : 'text-gray-600'}`}>
              Text Fill Color
            </span>
            <ChevronDown size="1vw" className={`transition-transform duration-200 text-gray-500 ${openSection === 'hoverTextFill' ? 'rotate-180 text-gray-900' : ''}`} />
          </div>

          {openSection === 'hoverTextFill' && (
            <div className="p-[1vw] flex items-center justify-between gap-[0.5vw]">
              <div
                className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
                style={{ background: hoverTextFillColor }}
                onClick={() => setActiveColorPicker(activeColorPicker === 'hoverTextFill' ? null : 'hoverTextFill')}
              />
              <div className="flex-1 flex items-center border border-gray-300 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white px-[0.5vw]">
                <input
                  type="text"
                  value={hoverTextFillColor.includes('gradient') ? 'GRADIENT' : hoverTextFillColor}
                  onChange={(e) => handleHoverTextFillColorChange(e.target.value)}
                  maxLength={hoverTextFillColor.includes('gradient') ? 20 : 7}
                  className="w-full text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent uppercase"
                />
              </div>
              {activeColorPicker === 'hoverTextFill' && createPortal(
                <div
                  className="fixed z-[5000]"
                  style={{ top: '50%', right: '19.5vw', transform: 'translateY(-50%)' }}
                >
                  <ColorPicker
                    color={hoverTextFillColor}
                    onChange={handleHoverTextFillColorChange}
                    onClose={() => setActiveColorPicker(null)}
                    disableGradient={false}
                  />
                </div>,
                document.body
              )}
            </div>
          )}
        </div>

        {/* 2. Hover Shape Fill Color Accordion */}
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
          <div
            onClick={() => toggleSection('hoverShapeFill')}
            className={`flex items-center justify-between px-[1vw] py-[0.85vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openSection === 'hoverShapeFill' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
          >
            <span className={`font-semibold text-[0.85vw] ${openSection === 'hoverShapeFill' ? 'text-gray-900' : 'text-gray-600'}`}>
              Shape Fill Color
            </span>
            <ChevronDown size="1vw" className={`transition-transform duration-200 text-gray-500 ${openSection === 'hoverShapeFill' ? 'rotate-180 text-gray-900' : ''}`} />
          </div>

          {openSection === 'hoverShapeFill' && (
            <div className="p-[1vw] flex items-center justify-between gap-[0.5vw]">
              <div
                className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
                style={{ background: hoverShapeFillColor }}
                onClick={() => setActiveColorPicker(activeColorPicker === 'hoverShapeFill' ? null : 'hoverShapeFill')}
              />
              <div className="flex-1 flex items-center border border-gray-300 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white px-[0.5vw]">
                <input
                  type="text"
                  value={hoverShapeFillColor.includes('gradient') ? 'GRADIENT' : hoverShapeFillColor}
                  onChange={(e) => handleHoverShapeFillColorChange(e.target.value)}
                  maxLength={hoverShapeFillColor.includes('gradient') ? 20 : 7}
                  className="w-full text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent uppercase"
                />
              </div>
              {activeColorPicker === 'hoverShapeFill' && createPortal(
                <div
                  className="fixed z-[5000]"
                  style={{ top: '50%', right: '19.5vw', transform: 'translateY(-50%)' }}
                >
                  <ColorPicker
                    color={hoverShapeFillColor}
                    onChange={handleHoverShapeFillColorChange}
                    onClose={() => setActiveColorPicker(null)}
                    disableGradient={false}
                  />
                </div>,
                document.body
              )}
            </div>
          )}
        </div>

        {/* 3. Hover Stroke Color Accordion */}
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
          <div
            onClick={() => toggleSection('hoverStrokeColor')}
            className={`flex items-center justify-between px-[1vw] py-[0.85vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openSection === 'hoverStrokeColor' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
          >
            <span className={`font-semibold text-[0.85vw] ${openSection === 'hoverStrokeColor' ? 'text-gray-900' : 'text-gray-600'}`}>
              Stroke Color
            </span>
            <ChevronDown size="1vw" className={`transition-transform duration-200 text-gray-500 ${openSection === 'hoverStrokeColor' ? 'rotate-180 text-gray-900' : ''}`} />
          </div>

          {openSection === 'hoverStrokeColor' && (
            <div className="p-[1vw] flex items-center justify-between gap-[0.5vw]">
              <div
                className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
                style={{ background: hoverStrokeColor }}
                onClick={() => setActiveColorPicker(activeColorPicker === 'hoverStrokeColor' ? null : 'hoverStrokeColor')}
              />
              <div className="flex-1 flex items-center border border-gray-300 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white px-[0.5vw]">
                <input
                  type="text"
                  value={hoverStrokeColor.includes('gradient') ? 'GRADIENT' : hoverStrokeColor}
                  onChange={(e) => handleHoverStrokeColorChange(e.target.value)}
                  maxLength={hoverStrokeColor.includes('gradient') ? 20 : 7}
                  className="w-full text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent uppercase"
                />
              </div>
              {activeColorPicker === 'hoverStrokeColor' && createPortal(
                <div
                  className="fixed z-[5000]"
                  style={{ top: '50%', right: '19.5vw', transform: 'translateY(-50%)' }}
                >
                  <ColorPicker
                    color={hoverStrokeColor}
                    onChange={handleHoverStrokeColorChange}
                    onClose={() => setActiveColorPicker(null)}
                    disableGradient={false}
                  />
                </div>,
                document.body
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ButtonEditor;
