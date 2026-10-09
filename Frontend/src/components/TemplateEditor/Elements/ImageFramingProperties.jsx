import React, { useState, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { checkIsAnimatedWebp } from '../editorUtils';
import Color from '../Color';
import Effect from '../Effect';

const PropertySlider = ({ label, value, onChange, onPointerUp, min = 0, max = 100 }) => {
  return (
    <div className="flex items-center gap-[0.5vw] py-[0.4vw]">
      <span className="text-[0.8vw] font-semibold text-gray-600 whitespace-nowrap min-w-[5.5vw]">{label} :</span>
      <div className="flex-grow flex items-center gap-[1vw]">
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={value || 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          onPointerUp={onPointerUp}
          className="flex-grow h-[0.25vw] appearance-none cursor-pointer bg-gray-200 rounded-full outline-none"
        />
        <div className="w-[2.8vw] h-[1.8vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.4vw] shadow-sm flex-shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            value={value || 0}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            onBlur={onPointerUp}
            onKeyDown={(e) => { if (e.key === 'Enter') onPointerUp(); }}
            className="w-full text-center text-[0.8vw] text-gray-700 font-semibold outline-none bg-transparent"
          />
        </div>
      </div>
    </div>
  );
};

const ImageFramingProperties = ({ selectedElement, selectedLayerId, activePageIndex, updateElementAttribute, selectedElementProps }) => {
  const [slots, setSlots] = useState([]);
  const [gap, setGap] = useState(0);
  const [radius, setRadius] = useState(0);
  const [framePadding, setFramePadding] = useState(0);
  const [activeSlotId, setActiveSlotId] = useState(null);
  const [slotRadii, setSlotRadii] = useState({});
  const [slotRotations, setSlotRotations] = useState({});
  const fileInputRefs = useRef({});
  const activeSlotRef = useRef(null);
  const adjustStateRef = useRef({ isAdjusting: false, slotId: null, isPanning: false, startX: 0, startY: 0, matrix: null, rotateStr: '', imgNode: null, bbox: null, startMatrix: null, path: null });

  const [openSubSection, setOpenSubSection] = useState('slots');
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);

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
  }, [selectedElementProps, activePageIndex]);

  const backgroundColor = {
    fill: selectedElementProps?.['data-frame-bg-fill'] || 'none',
    fillOpacity: selectedElementProps?.['data-frame-bg-opacity'] ? parseFloat(selectedElementProps['data-frame-bg-opacity']) * 100 : 100,
    stroke: selectedElementProps?.['data-frame-stroke'] || 'none',
    strokeOpacity: selectedElementProps?.['data-frame-stroke-opacity'] ? parseFloat(selectedElementProps['data-frame-stroke-opacity']) * 100 : 100,
    fillType: 'solid',
    fillGradientType: 'linear',
    fillStops: [],
    fillAngle: 0,
    fillRadius: 100,
    strokeType: 'solid',
    strokeGradientType: 'linear',
    strokeStops: [],
    strokeAngle: 0,
    strokeRadius: 100,
    strokeWeight: parseFloat(selectedElementProps?.['data-frame-stroke-width'] || 0),
    strokeDashStyle: ((selectedElementProps?.['data-frame-stroke-dasharray']) && selectedElementProps['data-frame-stroke-dasharray'] !== 'none') ? 'Dashed' : 'Solid',
    strokeDasharrayValue: selectedElementProps?.['data-frame-stroke-dasharray'] || 'none',
    strokeDashLength: parseInt((selectedElementProps?.['data-frame-stroke-dasharray'] === 'none' ? '10,10' : (selectedElementProps?.['data-frame-stroke-dasharray'] || '10,10')).split(',')[0]) || 10,
    strokeDashGap: parseInt((selectedElementProps?.['data-frame-stroke-dasharray'] === 'none' ? '10,10' : (selectedElementProps?.['data-frame-stroke-dasharray'] || '10,10')).split(',')[1]) || 10,
    strokeLinecap: 'butt',
    strokePosition: 'Center',
  };

  const handleSetBackgroundColor = (updater) => {
    const next = typeof updater === 'function' ? updater(backgroundColor) : updater;
    const updates = {};
    if (backgroundColor.fill !== next.fill) updates['data-frame-bg-fill'] = next.fill;
    if (backgroundColor.fillOpacity !== next.fillOpacity) updates['data-frame-bg-opacity'] = (next.fillOpacity / 100).toString();
    if (backgroundColor.stroke !== next.stroke) updates['data-frame-stroke'] = next.stroke;
    if (backgroundColor.strokeOpacity !== next.strokeOpacity) updates['data-frame-stroke-opacity'] = (next.strokeOpacity / 100).toString();
    if (backgroundColor.strokeWeight !== next.strokeWeight) updates['data-frame-stroke-width'] = next.strokeWeight.toString();
    if (backgroundColor.strokeDashStyle !== next.strokeDashStyle || backgroundColor.strokeDashLength !== next.strokeDashLength || backgroundColor.strokeDashGap !== next.strokeDashGap || backgroundColor.strokeDasharrayValue !== next.strokeDasharrayValue) {
      const dashValue = (next.strokeDashStyle === 'none' || next.strokeDashStyle === 'Solid') 
        ? 'none' 
        : (next.strokeDasharrayValue || `${next.strokeDashLength || 10},${next.strokeDashGap || 10}`);
      updates['data-frame-stroke-dasharray'] = dashValue;
    }

    if (Object.keys(updates).length > 0) {
      Object.entries(updates).forEach(([k, v]) => selectedElement.setAttribute(k, v));
      
      let bgRect = selectedElement.querySelector('.frame-bg-rect');
      if (!bgRect) {
        updateFramePadding(framePadding, true);
        bgRect = selectedElement.querySelector('.frame-bg-rect');
      }
      
      if (bgRect) {
        bgRect.setAttribute('fill', next.fill !== 'none' && next.fill !== '#' ? next.fill : 'none');
        if (next.fillOpacity !== undefined) bgRect.setAttribute('fill-opacity', next.fillOpacity / 100);
        bgRect.setAttribute('stroke', next.stroke !== 'none' && next.stroke !== '#' ? next.stroke : 'none');
        if (next.strokeOpacity !== undefined) bgRect.setAttribute('stroke-opacity', next.strokeOpacity / 100);
        if (next.strokeWeight !== undefined) bgRect.setAttribute('stroke-width', next.strokeWeight);
        const dashValue = (next.strokeDashStyle === 'none' || next.strokeDashStyle === 'Solid') 
          ? 'none' 
          : (next.strokeDasharrayValue || `${next.strokeDashLength || 10},${next.strokeDashGap || 10}`);
        bgRect.setAttribute('stroke-dasharray', dashValue);
      }

      // Gap color is now handled perfectly by the frame-bg-rect showing through the SVG mask holes.
      // We no longer apply strokes to the paths to fake gaps!
      const paths = Array.from(selectedElement.querySelectorAll('path, polygon, rect, circle, ellipse'))
        .filter(p => p.hasAttribute('fill') && p.getAttribute('fill').startsWith('url(#pattern'));
      paths.forEach(path => {
        path.removeAttribute('stroke');
        path.removeAttribute('stroke-opacity');
        path.removeAttribute('stroke-width');
      });

      syncDomChanges();
    }
  };

  const activeEffects = [];
  if (selectedElementProps?.['data-effect-drop-shadow'] === 'true') activeEffects.push('Drop Shadow');
  if (selectedElementProps?.['data-effect-inner-shadow'] === 'true') activeEffects.push('Inner Shadow');
  if (selectedElementProps?.['data-effect-blur'] === 'true') activeEffects.push('Blur');

  const handleSetActiveEffects = (updater) => {
    const currentActive = [];
    if (selectedElementProps?.['data-effect-drop-shadow'] === 'true') currentActive.push('Drop Shadow');
    if (selectedElementProps?.['data-effect-inner-shadow'] === 'true') currentActive.push('Inner Shadow');
    if (selectedElementProps?.['data-effect-blur'] === 'true') currentActive.push('Blur');

    const next = typeof updater === 'function' ? updater(currentActive) : updater;
    const updates = {};
    const hasDropShadow = next.includes('Drop Shadow');
    const hasInnerShadow = next.includes('Inner Shadow');
    const hasBlur = next.includes('Blur');

    if ((selectedElementProps?.['data-effect-drop-shadow'] === 'true') !== hasDropShadow) updates['data-effect-drop-shadow'] = hasDropShadow ? 'true' : 'false';
    if ((selectedElementProps?.['data-effect-inner-shadow'] === 'true') !== hasInnerShadow) updates['data-effect-inner-shadow'] = hasInnerShadow ? 'true' : 'false';
    if ((selectedElementProps?.['data-effect-blur'] === 'true') !== hasBlur) updates['data-effect-blur'] = hasBlur ? 'true' : 'false';

    if (Object.keys(updates).length > 0) updateElementAttribute(activePageIndex, selectedLayerId, updates);
  };

  const effectSettings = {
    'Drop Shadow': {
      x: parseInt(selectedElementProps?.['data-effect-drop-shadow-x'] || 2),
      y: parseInt(selectedElementProps?.['data-effect-drop-shadow-y'] || 2),
      blur: parseInt(selectedElementProps?.['data-effect-drop-shadow-blur'] || 4),
      spread: parseInt(selectedElementProps?.['data-effect-drop-shadow-spread'] || 0),
      color: selectedElementProps?.['data-effect-drop-shadow-color'] || '#000000',
      opacity: parseInt(selectedElementProps?.['data-effect-drop-shadow-opacity'] || 35),
    },
    'Inner Shadow': {
      x: parseInt(selectedElementProps?.['data-effect-inner-shadow-x'] || 2),
      y: parseInt(selectedElementProps?.['data-effect-inner-shadow-y'] || 2),
      blur: parseInt(selectedElementProps?.['data-effect-inner-shadow-blur'] || 0),
      spread: parseInt(selectedElementProps?.['data-effect-inner-shadow-spread'] || 0),
      color: selectedElementProps?.['data-effect-inner-shadow-color'] || '#000000',
      opacity: parseInt(selectedElementProps?.['data-effect-inner-shadow-opacity'] || 35),
    },
    'Blur': {
      blur: parseFloat(selectedElementProps?.['data-effect-blur-value'] !== undefined ? selectedElementProps?.['data-effect-blur-value'] : (selectedElementProps?.['data-effect-blur-blur'] || 0.3)),
      spread: parseInt(selectedElementProps?.['data-effect-blur-spread'] || 0),
      clipContent: selectedElementProps?.['data-effect-blur-clip'] === 'true'
    }
  };

  const handleSetEffectSettings = (updater) => {
    const next = typeof updater === 'function' ? updater(effectSettings) : updater;
    const updates = {};
    ['Drop Shadow', 'Inner Shadow'].forEach(type => {
      const prefix = type === 'Drop Shadow' ? 'drop-shadow' : 'inner-shadow';
      if (effectSettings[type].x !== next[type].x) updates[`data-effect-${prefix}-x`] = next[type].x.toString();
      if (effectSettings[type].y !== next[type].y) updates[`data-effect-${prefix}-y`] = next[type].y.toString();
      if (effectSettings[type].blur !== next[type].blur) updates[`data-effect-${prefix}-blur`] = next[type].blur.toString();
      if (effectSettings[type].spread !== next[type].spread) updates[`data-effect-${prefix}-spread`] = next[type].spread.toString();
      if (effectSettings[type].color !== next[type].color) updates[`data-effect-${prefix}-color`] = next[type].color;
      if (effectSettings[type].opacity !== next[type].opacity) updates[`data-effect-${prefix}-opacity`] = next[type].opacity.toString();
    });

    if (effectSettings['Blur'].blur !== next['Blur'].blur) updates[`data-effect-blur-value`] = next['Blur'].blur.toString();
    if (effectSettings['Blur'].spread !== next['Blur'].spread) updates[`data-effect-blur-spread`] = next['Blur'].spread.toString();
    if (effectSettings['Blur'].clipContent !== next['Blur'].clipContent) updates[`data-effect-blur-clip`] = next['Blur'].clipContent ? 'true' : 'false';

    if (Object.keys(updates).length > 0) updateElementAttribute(activePageIndex, selectedLayerId, updates);
  };

  useEffect(() => {
    if (!selectedElement) return;

    // Find all paths that use a pattern for fill
    const paths = Array.from(selectedElement.querySelectorAll('path, polygon, rect, circle, ellipse'));
    const imageSlots = [];
    const listeners = [];

    const updateAdjustTransform = () => {
        if (!adjustStateRef.current.matrix) return;
        const m = adjustStateRef.current.matrix;
        const transformStr = `${adjustStateRef.current.rotateStr || ''}matrix(${m[0]} ${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]})`;
        if (adjustStateRef.current.imgNode) {
            adjustStateRef.current.imgNode.setAttribute('transform', transformStr);
        }
        const ghost = selectedElement.querySelector('#ghost-layer');
        if (ghost) {
            const ghostImg = ghost.querySelector('image, img');
            const outline = ghost.querySelector('rect');
            if (ghostImg) ghostImg.setAttribute('transform', transformStr);
            if (outline) outline.setAttribute('transform', transformStr);
        }
    };

    const enterAdjustMode = (patternId, path) => {
        const pattern = selectedElement.querySelector(`pattern[id="${patternId}"]`);
        if (!pattern) return;
        const imgNode = pattern.querySelector('image, img');
        if (!imgNode) return; // Cannot adjust empty slot

        adjustStateRef.current.isAdjusting = true;
        adjustStateRef.current.slotId = patternId;
        adjustStateRef.current.imgNode = imgNode;
        adjustStateRef.current.path = path;
        adjustStateRef.current.bbox = path.getBBox();
        
        const transformStr = imgNode.getAttribute('transform');
        let matrix = [1, 0, 0, 1, 0, 0];
        let rotateStr = '';
        if (transformStr) {
            const rMatch = transformStr.match(/rotate\([^)]+\)/);
            if (rMatch) rotateStr = rMatch[0] + ' ';
            
            const match = transformStr.match(/matrix\(([^)]+)\)/);
            if (match) {
                matrix = match[1].split(/[ ,]+/).map(parseFloat);
            }
        }
        adjustStateRef.current.matrix = matrix;
        adjustStateRef.current.rotateStr = rotateStr;

        let ghost = selectedElement.querySelector('#ghost-layer');
        if (ghost) ghost.remove();
        
        ghost = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        ghost.id = 'ghost-layer';
        ghost.style.pointerEvents = 'none';
        
        // Inherit path's transform to match local coordinate space
        let combinedTransform = path.getAttribute('transform') || '';
        const pt = pattern.getAttribute('patternTransform');
        if (pt) {
            combinedTransform = `${combinedTransform} ${pt}`.trim();
        }
        if (combinedTransform) {
            ghost.setAttribute('transform', combinedTransform);
        }
        
        const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const bbox = adjustStateRef.current.bbox;
        
        const pcu = pattern.getAttribute('patternContentUnits');
        if (!pcu || pcu === 'objectBoundingBox') {
            wrapper.setAttribute('transform', `translate(${bbox.x}, ${bbox.y}) scale(${bbox.width}, ${bbox.height})`);
        } else {
            wrapper.setAttribute('transform', `translate(0, 0)`);
        }
        
        const ghostImg = imgNode.cloneNode(true);
        ghostImg.setAttribute('opacity', '0.4');
        
        const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        outline.setAttribute('fill', 'none');
        outline.setAttribute('stroke', '#f59e0b');
        outline.setAttribute('vector-effect', 'non-scaling-stroke');
        outline.setAttribute('stroke-dasharray', '5,5');
        
        let iw = imgNode.getAttribute('width');
        let ih = imgNode.getAttribute('height');
        if (!iw || iw.includes('%')) iw = (!pcu || pcu === 'objectBoundingBox') ? '1' : bbox.width.toString();
        if (!ih || ih.includes('%')) ih = (!pcu || pcu === 'objectBoundingBox') ? '1' : bbox.height.toString();
        
        outline.setAttribute('width', iw);
        outline.setAttribute('height', ih);
        
        const imgTransform = ghostImg.getAttribute('transform');
        if (imgTransform) outline.setAttribute('transform', imgTransform);
        
        wrapper.appendChild(ghostImg);
        wrapper.appendChild(outline);
        ghost.appendChild(wrapper);

        // Insert sibling to inherit group transforms
        if (path.parentNode) {
            path.parentNode.insertBefore(ghost, path.nextSibling);
        } else {
            selectedElement.appendChild(ghost);
        }

        const highlightId = `highlight-${patternId}`;
        let highlight = selectedElement.querySelector(`[data-highlight-id="${highlightId}"]`);
        if (highlight) {
            highlight.setAttribute('stroke', '#f59e0b');
            highlight.setAttribute('stroke-dasharray', '8,4');
        }
    };

    const exitAdjustMode = () => {
        adjustStateRef.current.isAdjusting = false;
        const ghost = selectedElement.querySelector('#ghost-layer');
        if (ghost) ghost.remove();
        
        if (adjustStateRef.current.slotId) {
            const highlightId = `highlight-${adjustStateRef.current.slotId}`;
            const highlight = selectedElement.querySelector(`[data-highlight-id="${highlightId}"]`);
            if (highlight) {
                highlight.setAttribute('stroke', '#2563eb');
                highlight.setAttribute('stroke-dasharray', '4,5');
            }
        }
        adjustStateRef.current.slotId = null;
        syncDomChanges();
    };

    const handlePointerMove = (e) => {
        if (!adjustStateRef.current.isPanning) return;
        e.preventDefault();
        e.stopPropagation();
        
        let dx = e.clientX - adjustStateRef.current.startX;
        let dy = e.clientY - adjustStateRef.current.startY;
        
        let pcu = 'objectBoundingBox';
        if (adjustStateRef.current.slotId && adjustStateRef.current.path) {
            const pattern = adjustStateRef.current.path.ownerSVGElement?.querySelector(`pattern[id="${adjustStateRef.current.slotId}"]`);
            if (pattern) {
                pcu = pattern.getAttribute('patternContentUnits') || 'objectBoundingBox';
                
                // Read rotation from patternTransform (old) OR from image transform (new)
                let rot = 0;
                const pt = pattern.getAttribute('patternTransform');
                if (pt) {
                    const match = pt.match(/rotate\(([-0-9.]+)/);
                    if (match) rot = parseFloat(match[1]);
                } else if (adjustStateRef.current.rotateStr) {
                    const match = adjustStateRef.current.rotateStr.match(/rotate\(([-0-9.]+)/);
                    if (match) rot = parseFloat(match[1]);
                }
                
                if (rot !== 0) {
                    const rad = -rot * Math.PI / 180;
                    const dxRot = dx * Math.cos(rad) - dy * Math.sin(rad);
                    const dyRot = dx * Math.sin(rad) + dy * Math.cos(rad);
                    dx = dxRot;
                    dy = dyRot;
                }
            }
        }

        let scaleX = 1;
        let scaleY = 1;
        if (adjustStateRef.current.path) {
            const ctm = adjustStateRef.current.path.getScreenCTM();
            if (ctm) {
                scaleX = ctm.a || 1;
                scaleY = ctm.d || 1;
            }
        }
        
        const bbox = adjustStateRef.current.bbox;
        let tx_delta, ty_delta;
        
        if (pcu === 'userSpaceOnUse') {
            tx_delta = dx / scaleX;
            ty_delta = dy / scaleY;
        } else {
            tx_delta = (dx / scaleX) / bbox.width;
            ty_delta = (dy / scaleY) / bbox.height;
        }
        
        const m = adjustStateRef.current.startMatrix;
        if (!m || !adjustStateRef.current.matrix) return;
        const newTx = m[4] + tx_delta;
        const newTy = m[5] + ty_delta;
        
        adjustStateRef.current.matrix[4] = newTx;
        adjustStateRef.current.matrix[5] = newTy;
        
        updateAdjustTransform();
    };

    const handlePointerUp = (e) => {
        if (adjustStateRef.current.isPanning) {
            adjustStateRef.current.isPanning = false;
        }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    paths.forEach((path, idx) => {
      const fill = path.getAttribute('fill');
      if (fill && fill.startsWith('url(#pattern')) {
        // Extract pattern ID
        const match = fill.match(/url\(#([^)]+)\)/);
        if (match && match[1]) {
          const patternId = match[1];
          // We'll update currentImage later via a function that runs initially and on mutations
          imageSlots.push({
            id: patternId,
            path: path,
            index: idx,
            currentImage: null
          });

          // Highlight overlay logic
          const highlightId = `highlight-${patternId}`;

          const addHighlight = () => {
            let highlight = selectedElement.querySelector(`[data-highlight-id="${highlightId}"]`);
            if (!highlight) {
              highlight = path.cloneNode();
              highlight.setAttribute('data-highlight-id', highlightId);
              highlight.setAttribute('pointer-events', 'none');
              highlight.setAttribute('fill', 'none');
              highlight.setAttribute('stroke', '#2563eb');
              highlight.setAttribute('stroke-width', '2');
              highlight.setAttribute('vector-effect', 'non-scaling-stroke');
              highlight.setAttribute('stroke-dasharray', '4,5');
              selectedElement.appendChild(highlight);
            }
          };

          const removeHighlight = () => {
            const highlight = selectedElement.querySelector(`[data-highlight-id="${highlightId}"]`);
            if (highlight) highlight.remove();
          };

          path.setAttribute('data-pattern-id', patternId);
          path.dataset.patternId = patternId;

          // Setup canvas interaction for this slot
          const handleMouseEnter = () => {
            if (paths.length === 1) return;
            addHighlight();
            path.style.cursor = 'pointer';
          };

          const handleMouseLeave = () => {
            if (paths.length === 1) return;
            if (activeSlotRef.current === patternId) return; // Keep highlight if active
            removeHighlight();
            path.style.cursor = '';
          };

          const handleSingleClick = (e) => {
            if (paths.length === 1) return;
            e.stopPropagation();
            e.preventDefault();
            
            if (activeSlotRef.current === patternId) {
              // Deselect
              activeSlotRef.current = null;
              setActiveSlotId(null);
              removeHighlight();
            } else {
              // Deselect previous
              if (activeSlotRef.current) {
                const prevHighlightId = `highlight-${activeSlotRef.current}`;
                const prevHighlight = selectedElement.querySelector(`[data-highlight-id="${prevHighlightId}"]`);
                if (prevHighlight) prevHighlight.remove();
              }
              activeSlotRef.current = patternId;
              setActiveSlotId(patternId);
              addHighlight(); // Ensure it gets highlighted
            }
          };

          const handleDoubleClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (adjustStateRef.current.isAdjusting && adjustStateRef.current.slotId === patternId) {
              exitAdjustMode();
            } else {
              if (adjustStateRef.current.isAdjusting) {
                  exitAdjustMode();
              }
              enterAdjustMode(patternId, path);
            }
          };

          const handlePointerDown = (e) => {
            if (adjustStateRef.current.isAdjusting && adjustStateRef.current.slotId === patternId) {
                e.preventDefault();
                e.stopPropagation();
                adjustStateRef.current.isPanning = true;
                adjustStateRef.current.startX = e.clientX;
                adjustStateRef.current.startY = e.clientY;
                adjustStateRef.current.startMatrix = [...adjustStateRef.current.matrix];
            }
          };

          const handleWheel = (e) => {
            if (adjustStateRef.current.isAdjusting && adjustStateRef.current.slotId === patternId) {
                e.preventDefault();
                e.stopPropagation();
                
                const zoomDelta = e.deltaY < 0 ? 1.05 : 0.95;
                const m = adjustStateRef.current.matrix;
                
                let pcu = 'objectBoundingBox';
                const pattern = selectedElement?.querySelector(`pattern[id="${patternId}"]`);
                if (pattern) pcu = pattern.getAttribute('patternContentUnits') || 'objectBoundingBox';
                
                let cx = 0.5;
                let cy = 0.5;
                if (pcu === 'userSpaceOnUse' && adjustStateRef.current.bbox) {
                    cx = adjustStateRef.current.bbox.x + adjustStateRef.current.bbox.width / 2;
                    cy = adjustStateRef.current.bbox.y + adjustStateRef.current.bbox.height / 2;
                }

                m[0] *= zoomDelta;
                m[3] *= zoomDelta;
                m[4] = cx + (m[4] - cx) * zoomDelta;
                m[5] = cy + (m[5] - cy) * zoomDelta;
                
                updateAdjustTransform();
            }
          };

          path.addEventListener('mouseenter', handleMouseEnter);
          path.addEventListener('mouseleave', handleMouseLeave);
          path.addEventListener('click', handleSingleClick);
          path.addEventListener('dblclick', handleDoubleClick);
          path.addEventListener('pointerdown', handlePointerDown);
          path.addEventListener('wheel', handleWheel, { passive: false });

          listeners.push({ path, handleMouseEnter, handleMouseLeave, handleSingleClick, handleDoubleClick, handlePointerDown, handleWheel, removeHighlight });
        }
      }
    });

    setSlots(imageSlots);

    let svgRoot = selectedElement;
    while (svgRoot && svgRoot.tagName?.toLowerCase() !== 'svg') {
      svgRoot = svgRoot.parentElement;
    }

    const updateSlotsImages = () => {
      if (!svgRoot) return;
      setSlots(prevSlots => {
        let changed = false;
        const newSlots = prevSlots.map(slot => {
          const pattern = svgRoot.querySelector(`pattern[id="${slot.id}"]`);
          let currentImage = null;
          if (pattern) {
            const imgNode = pattern.querySelector('image, img');
            if (imgNode) {
              currentImage = imgNode.getAttribute('href') || imgNode.getAttribute('xlink:href');
            }
          }
          if (slot.currentImage !== currentImage) {
            changed = true;
            return { ...slot, currentImage };
          }
          return slot;
        });
        return changed ? newSlots : prevSlots;
      });
    };

    updateSlotsImages();

    let observer = null;
    if (svgRoot) {
      observer = new MutationObserver(() => {
        updateSlotsImages();
      });
      observer.observe(svgRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'xlink:href'] });
    }

    // Load initial gap and radius from the first valid path
    if (paths.length > 0) {
      const firstPath = paths[0];
      setGap(parseFloat(firstPath.getAttribute('stroke-width')) || 0);
      setRadius(parseFloat(firstPath.getAttribute('rx')) || parseFloat(firstPath.getAttribute('data-rx')) || 0);
    }
    
    // Load per-slot radii
    const initialRadii = {};
    const initialRotations = {};
    paths.forEach(p => {
       const pId = p.dataset.patternId;
       if (pId) {
           initialRadii[pId] = parseFloat(p.getAttribute('rx')) || parseFloat(p.getAttribute('data-rx')) || 0;
           const pattern = selectedElement.querySelector(`pattern[id="${pId}"]`);
           if (pattern) {
               // Check patternTransform (old method) or image rotate (new method)
               const pt = pattern.getAttribute('patternTransform');
               let foundRot = false;
               if (pt) {
                   const match = pt.match(/rotate\(([-0-9.]+)/);
                   if (match) {
                       initialRotations[pId] = parseFloat(match[1]);
                       foundRot = true;
                   }
               }
               if (!foundRot) {
                   const imgNode = pattern.querySelector('image, img');
                   if (imgNode) {
                       const tf = imgNode.getAttribute('transform');
                       if (tf) {
                           const match = tf.match(/rotate\(([-0-9.]+)/);
                           if (match) initialRotations[pId] = parseFloat(match[1]);
                       }
                   }
               }
           }
       }
    });
    setSlotRadii(initialRadii);
    setSlotRotations(initialRotations);
    
    setFramePadding(parseFloat(selectedElement.getAttribute('data-frame-padding')) || 0);

    return () => {
      listeners.forEach(({ path, handleMouseEnter, handleMouseLeave, handleSingleClick, handleDoubleClick, handlePointerDown, handleWheel, removeHighlight }) => {
        path.removeEventListener('mouseenter', handleMouseEnter);
        path.removeEventListener('mouseleave', handleMouseLeave);
        path.removeEventListener('click', handleSingleClick);
        path.removeEventListener('dblclick', handleDoubleClick);
        if (handlePointerDown) path.removeEventListener('pointerdown', handlePointerDown);
        if (handleWheel) path.removeEventListener('wheel', handleWheel);
        removeHighlight();
      });
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (observer) observer.disconnect();
      activeSlotRef.current = null;
      setActiveSlotId(null);
      
      const ghost = selectedElement?.querySelector('#ghost-layer');
      if (ghost) ghost.remove();
    };
  }, [selectedElement, selectedLayerId]);

  const handleImageDrop = async (e, slotId) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange({ target: { files: files } }, slotId);
    }
  };

  const handleFileChange = async (e, slotId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');

    if (!file.type.startsWith('image/') && !isVideo) {
      alert('Only Image formats are allowed for slots.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      updateSlotImage(slotId, dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const syncDomChanges = () => {
    if (!selectedElement) return;
    window.__skipCanvasUpdateForPage = activePageIndex;
    let svgRoot = selectedElement;
    while (svgRoot && svgRoot.tagName?.toLowerCase() !== 'svg') {
      svgRoot = svgRoot.parentElement;
    }
    if (svgRoot) {
      const cloneSvg = svgRoot.cloneNode(true);
      cloneSvg.querySelectorAll('[data-highlight-id], #ghost-layer').forEach(el => el.remove());
      const serializer = new XMLSerializer();
      const html = serializer.serializeToString(cloneSvg);
      updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
    }
  };

  const updateGapAndRadius = (newGap, newRadius, skipSync = false) => {
    if (!selectedElement) return;

    const paths = Array.from(selectedElement.querySelectorAll('path, polygon, rect, circle, ellipse'))
      .filter(p => p.hasAttribute('fill') && p.getAttribute('fill').startsWith('url(#pattern'));

    let defs = selectedElement.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      selectedElement.insertBefore(defs, selectedElement.firstChild);
    }

    paths.forEach((path, i) => {
      let maskId = `gap-mask-${selectedElement.id || 'frame'}-${i}`;
      let mask = defs.querySelector(`mask[id="${maskId}"]`);
      if (!mask) {
        mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.id = maskId;
        defs.appendChild(mask);
      }
      
      if (newGap > 0) {
        mask.innerHTML = ''; // clear old mask shapes
        mask.setAttribute('maskUnits', 'userSpaceOnUse');
        
        const whiteRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        // Cover everything so the image is visible
        whiteRect.setAttribute('x', '-5000');
        whiteRect.setAttribute('y', '-5000');
        whiteRect.setAttribute('width', '10000');
        whiteRect.setAttribute('height', '10000');
        whiteRect.setAttribute('fill', 'white');
        mask.appendChild(whiteRect);

        const clone = path.cloneNode(true);
        clone.setAttribute('fill', 'none'); // MUST be none, otherwise it defaults to black and hides the whole shape!
        clone.removeAttribute('mask'); 
        clone.removeAttribute('id');
        clone.removeAttribute('data-pattern-id');
        clone.removeAttribute('transform'); // Remove transform so it evaluates in path's local coordinate system
        clone.setAttribute('stroke', 'black');
        clone.setAttribute('stroke-width', newGap);
        clone.setAttribute('stroke-linejoin', 'round');
        mask.appendChild(clone);
        
        path.removeAttribute('stroke');
        path.removeAttribute('stroke-opacity');
        path.removeAttribute('stroke-width');
        path.setAttribute('mask', `url(#${maskId})`);
      } else {
        path.removeAttribute('stroke');
        path.removeAttribute('stroke-opacity');
        path.removeAttribute('stroke-width');
        path.removeAttribute('mask');
        mask.remove();
      }
    });

    paths.forEach(path => {
      // Radius translates to rx/ry for rect, or data-rx for shapes
      if (newRadius > 0) {
        if (path.tagName.toLowerCase() === 'rect') {
          path.setAttribute('rx', newRadius);
          path.setAttribute('ry', newRadius);
        } else {
          path.setAttribute('stroke-linejoin', 'round');
          path.setAttribute('data-rx', newRadius); // Keep track of it
        }
      } else {
        if (path.tagName.toLowerCase() === 'rect') {
          path.removeAttribute('rx');
          path.removeAttribute('ry');
        } else {
          path.removeAttribute('stroke-linejoin');
          path.removeAttribute('data-rx');
        }
      }
    });

    setGap(newGap);
    setRadius(newRadius);
    
    // Also update all slot radii state to match the global one
    const newSlotRadii = {};
    paths.forEach(p => {
       const pId = p.dataset.patternId;
       if (pId) newSlotRadii[pId] = newRadius;
    });
    setSlotRadii(newSlotRadii);
    
    const bgRect = selectedElement.querySelector('.frame-bg-rect');
    if (bgRect) {
      if (newRadius > 0) {
        bgRect.setAttribute('rx', newRadius);
        bgRect.setAttribute('ry', newRadius);
      } else {
        bgRect.removeAttribute('rx');
        bgRect.removeAttribute('ry');
      }
    }
    
    if (!skipSync) {
      syncDomChanges();
    }
  };

  const updateSlotRadius = (patternId, newRadius, skipSync = false) => {
    if (!selectedElement) return;
    
    setSlotRadii(prev => ({...prev, [patternId]: newRadius}));
    
    const paths = Array.from(selectedElement.querySelectorAll('path, polygon, rect, circle, ellipse'));
    const path = paths.find(p => p.dataset.patternId === patternId);
    if (path) {
        if (newRadius > 0) {
          if (path.tagName.toLowerCase() === 'rect') {
            path.setAttribute('rx', newRadius);
            path.setAttribute('ry', newRadius);
          } else {
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('data-rx', newRadius);
          }
        } else {
          if (path.tagName.toLowerCase() === 'rect') {
            path.removeAttribute('rx');
            path.removeAttribute('ry');
          } else {
            path.removeAttribute('stroke-linejoin');
            path.removeAttribute('data-rx');
          }
        }
        
        // Also update highlight clone if it exists
        const highlightId = `highlight-${patternId}`;
        const highlight = selectedElement.querySelector(`[data-highlight-id="${highlightId}"]`);
        if (highlight) {
            if (newRadius > 0 && highlight.tagName.toLowerCase() === 'rect') {
                highlight.setAttribute('rx', newRadius);
                highlight.setAttribute('ry', newRadius);
            } else if (highlight.tagName.toLowerCase() === 'rect') {
                highlight.removeAttribute('rx');
                highlight.removeAttribute('ry');
            }
        }
    }
    
    if (!skipSync) syncDomChanges();
  };

  const updateFramePadding = (newPadding, skipSync = false) => {
    if (!selectedElement) return;
    
    setFramePadding(newPadding);
    selectedElement.setAttribute('data-frame-padding', newPadding);
    
    const scaleVal = (100 - newPadding) / 100;
    
    const paths = Array.from(selectedElement.querySelectorAll('path, polygon, rect, circle, ellipse'))
      .filter(p => p.hasAttribute('fill') && p.getAttribute('fill').startsWith('url(#pattern'));
      
    paths.forEach(p => {
      if (!p.hasAttribute('data-orig-tf')) {
        p.setAttribute('data-orig-tf', p.getAttribute('transform') || '');
      }
    });

    // Find or create boundary rect
    let boundary = selectedElement.querySelector('.frame-bg-rect');
    if (!boundary) {
      // Restore ONLY original transforms to get true full layout bbox
      paths.forEach(p => {
        const origTf = p.getAttribute('data-orig-tf');
        if (origTf) p.setAttribute('transform', origTf);
        else p.removeAttribute('transform');
      });
      
      const bbox = selectedElement.getBBox();
      boundary = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      boundary.setAttribute('class', 'frame-bg-rect');
      
      const fillVal = selectedElement.getAttribute('data-frame-bg-fill') || 'none';
      boundary.setAttribute('fill', fillVal !== '#' ? fillVal : 'none');
      const bgOp = selectedElement.getAttribute('data-frame-bg-opacity');
      if (bgOp) boundary.setAttribute('fill-opacity', bgOp);
      
      const strokeVal = selectedElement.getAttribute('data-frame-stroke') || 'none';
      boundary.setAttribute('stroke', strokeVal !== '#' ? strokeVal : 'none');
      const strOp = selectedElement.getAttribute('data-frame-stroke-opacity');
      if (strOp) boundary.setAttribute('stroke-opacity', strOp);
      const strW = selectedElement.getAttribute('data-frame-stroke-width');
      if (strW) boundary.setAttribute('stroke-width', strW);
      const strDash = selectedElement.getAttribute('data-frame-stroke-dasharray');
      if (strDash) boundary.setAttribute('stroke-dasharray', strDash);
      if (radius > 0) {
        boundary.setAttribute('rx', radius);
        boundary.setAttribute('ry', radius);
      }
      
      boundary.setAttribute('pointer-events', 'none');
      boundary.setAttribute('x', bbox.x);
      boundary.setAttribute('y', bbox.y);
      boundary.setAttribute('width', bbox.width);
      boundary.setAttribute('height', bbox.height);
      selectedElement.insertBefore(boundary, selectedElement.firstChild);
    }

    const frameCx = parseFloat(boundary.getAttribute('x')) + parseFloat(boundary.getAttribute('width')) / 2;
    const frameCy = parseFloat(boundary.getAttribute('y')) + parseFloat(boundary.getAttribute('height')) / 2;
    
    const paddingTransform = `translate(${frameCx}, ${frameCy}) scale(${scaleVal}) translate(${-frameCx}, ${-frameCy})`;
    
    paths.forEach(path => {
      const origTf = path.getAttribute('data-orig-tf');
      const finalTransform = origTf ? `${paddingTransform} ${origTf}` : paddingTransform;
      path.setAttribute('transform', finalTransform);
      
      const patternId = path.dataset.patternId;
      if (patternId) {
        const highlightId = `highlight-${patternId}`;
        const highlight = selectedElement.querySelector(`[data-highlight-id="${highlightId}"]`);
        if (highlight) {
          highlight.setAttribute('transform', finalTransform);
        }
      }
    });

    if (!skipSync) {
      syncDomChanges();
    }
  };

  const updateRotation = (angle, skipSync = false) => {
    if (!selectedElement) return;

    const paths = Array.from(selectedElement.querySelectorAll('path, polygon, rect, circle, ellipse'))
      .filter(p => p.hasAttribute('fill') && p.getAttribute('fill').startsWith('url(#pattern'));

    const slotsToUpdate = activeSlotId ? [activeSlotId] : paths.map(p => p.dataset.patternId).filter(Boolean);
    
    setSlotRotations(prev => {
      const next = { ...prev };
      slotsToUpdate.forEach(id => { next[id] = angle; });
      return next;
    });

    slotsToUpdate.forEach(patternId => {
      const pattern = selectedElement.querySelector(`pattern[id="${patternId}"]`);
      const path = paths.find(p => p.getAttribute('data-pattern-id') === patternId || p.dataset?.patternId === patternId);
      if (pattern && path) {
        let bbox = { x: 0, y: 0, width: 100, height: 100 };
        try { bbox = path.getBBox(); } catch(e) {}
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        
        const pcu = pattern.getAttribute('patternContentUnits');
        let matrixStr = '';
        const imgNode = pattern.querySelector('image, img');
        
        if (imgNode) {
            let tf = imgNode.getAttribute('transform') || '';
            let m = [1, 0, 0, 1, 0, 0];
            const mMatch = tf.match(/matrix\(([^)]+)\)/);
            if (mMatch) {
                m = mMatch[1].split(/[ ,]+/).map(parseFloat);
            }
            
            if (pcu !== 'userSpaceOnUse') {
                // Upgrade from objectBoundingBox to userSpaceOnUse on the fly!
                m[0] = m[0] * bbox.width;
                m[2] = m[2] * bbox.width;
                m[1] = m[1] * bbox.height;
                m[3] = m[3] * bbox.height;
                m[4] = bbox.x + m[4] * bbox.width;
                m[5] = bbox.y + m[5] * bbox.height;
                pattern.setAttribute('patternContentUnits', 'userSpaceOnUse');
                pattern.removeAttribute('patternTransform');
            }
            
            matrixStr = `matrix(${m.join(' ')})`;
            
            if (angle !== 0) {
                imgNode.setAttribute('transform', `rotate(${angle}, ${cx}, ${cy}) ${matrixStr}`.trim());
            } else {
                imgNode.setAttribute('transform', matrixStr);
            }
        }
      }
    });

    if (!skipSync) syncDomChanges();
  };

  const updateSlotImage = (patternId, dataUrl, skipSync = false) => {
    if (!selectedElement) return;

    const pattern = selectedElement.querySelector(`pattern[id="${patternId}"]`);
    if (!pattern) return;

    // Find the shape that uses this pattern to get its aspect ratio
    const shapeEl = selectedElement.querySelector(`[fill="url(#${patternId})"]`);
    if (!shapeEl) return;

    // Load the image to get its width and height
    const img = new window.Image();
    img.onload = () => {
      const imgW = img.width;
      const imgH = img.height;

      // Compute the correct matrix to cover the slot (object-fit: cover equivalent in objectBoundingBox space)
      let bbox = { width: 100, height: 100 };
      try {
        bbox = shapeEl.getBBox();
      } catch(e) {}
      if (bbox.width === 0 || bbox.height === 0) bbox = { width: 100, height: 100 };

      const slotW = bbox.width;
      const slotH = bbox.height;

      const scale = Math.max(slotW / imgW, slotH / imgH);
      const finalW = imgW * scale;
      const finalH = imgH * scale;

      const scaleX_obb = scale / slotW;
      const scaleY_obb = scale / slotH;

      const tx_user = (slotW - finalW) / 2;
      const ty_user = (slotH - finalH) / 2;

      let imageNode = pattern.querySelector('image, img');
      const useNode = pattern.querySelector('use');
      
      if (!imageNode && useNode) {
        imageNode = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        pattern.removeChild(useNode);
        pattern.appendChild(imageNode);
      } else if (!imageNode) {
        imageNode = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        pattern.appendChild(imageNode);
      }

      imageNode.setAttribute('width', imgW);
      imageNode.setAttribute('height', imgH);
      imageNode.removeAttribute('preserveAspectRatio');
      
      pattern.setAttribute('patternContentUnits', 'userSpaceOnUse');
      pattern.removeAttribute('patternTransform'); // Clear old pt when upgrading
      
      const existingTf = imageNode.getAttribute('transform') || '';
      let rotateStr = '';
      const rMatch = existingTf.match(/rotate\([^)]+\)/);
      if (rMatch) rotateStr = rMatch[0] + ' ';
      
      imageNode.setAttribute('transform', `${rotateStr}matrix(${scale} 0 0 ${scale} ${bbox.x + tx_user} ${bbox.y + ty_user})`);

      imageNode.setAttribute('href', dataUrl);
      imageNode.setAttribute('xlink:href', dataUrl);

      // Save changes
      if (!skipSync) {
        syncDomChanges();
      }
    };
    img.src = dataUrl;
  };

  return (
    <div className="flex flex-col gap-[1vw] p-[1vw]">
      {/* Title Header */}
      <div className="flex items-center gap-[0.75vw] mb-[0.5vw]">
        <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">
          Image Framing Properties
        </span>
        <div className="h-[0.1vw] flex-1 bg-gray-200 mr-[-3vw]"></div>
      </div>
      <div className="text-[0.8vw] font-semibold text-gray-800">Image Slots </div>
      <div className="grid grid-cols-2 gap-[1vw]">
        {slots.map((slot, i) => (
          <div key={slot.id} className="flex flex-col gap-[0.5vw]">
            <span className="text-[0.8vw] text-gray-600 font-medium flex items-center justify-between">
              {slots.length > 1 ? `Slot ${i + 1}` : 'Image'}
              {slot.currentImage && (
                <span className="text-[0.6vw] text-green-600 bg-green-50 px-[0.3vw] py-[0.1vw] rounded">Filled</span>
              )}
            </span>
            <div
              className={`border border-dashed rounded-[0.5vw] flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden group ${
                activeSlotId === slot.id ? 'ring-1 ring-offset-1 ring-blue-500 border-blue-500 ' : ''
              } ${
                slot.currentImage 
                  ? (activeSlotId === slot.id ? 'bg-blue-50 h-[5vw]' : 'border-gray-300 hover:border-[#4c5add] bg-gray-50 h-[5vw]')
                  : (activeSlotId === slot.id ? 'bg-blue-100 p-[1vw]' : 'border-[#4c5add] bg-blue-50/30 hover:bg-blue-50 p-[1vw]')
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => handleImageDrop(e, slot.id)}
              onClick={() => {
                if (fileInputRefs.current[slot.id]) {
                  fileInputRefs.current[slot.id].click();
                }
              }}
            >
              {slot.currentImage ? (
                <>
                  <img src={slot.currentImage} alt={`Slot ${i+1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size="1.2vw" className="text-white mb-[0.2vw]" />
                    <span className="text-[0.65vw] text-white font-medium">Replace</span>
                  </div>
                </>
              ) : (
                <>
                  <Upload size="1vw" className="text-[#4c5add] mb-[0.2vw]" />
                  <span className="text-[0.6vw] text-[#4c5add] font-semibold text-center leading-tight">Drop on Slot<br/>or Click</span>
                </>
              )}
              <input
                type="file"
                ref={(el) => fileInputRefs.current[slot.id] = el}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, slot.id)}
              />
            </div>
          </div>
        ))}
      </div>
      {slots.length === 0 && (
        <div className="text-[0.8vw] text-gray-500 text-center py-[2vw]">
          No image slots found in this frame.
        </div>
      )}
      
      <div className="flex flex-col gap-[0.5vw] mt-[1vw]">
        {slots.length > 1 && (
          <PropertySlider 
            label="Partition Gap" 
            value={gap} 
            onChange={(val) => updateGapAndRadius(val, radius, true)} 
            onPointerUp={syncDomChanges}
            min={0} 
            max={50} 
          />
        )}
        <PropertySlider 
          label="Padding" 
          value={framePadding} 
          onChange={(val) => updateFramePadding(val, true)} 
          onPointerUp={syncDomChanges}
          min={0} 
          max={50} 
        />
        {slots.some(s => s.path.tagName.toLowerCase() === 'rect') && (
          <PropertySlider 
            label="Corner Radius" 
            value={activeSlotId ? (slotRadii[activeSlotId] || 0) : radius} 
            onChange={(val) => {
              if (activeSlotId) {
                updateSlotRadius(activeSlotId, val, true);
              } else {
                updateGapAndRadius(gap, val, true);
              }
            }} 
            onPointerUp={syncDomChanges}
            min={0} 
            max={100} 
          />
        )}
        <PropertySlider 
          label="Rotation" 
          value={activeSlotId ? (slotRotations[activeSlotId] || 0) : (Object.values(slotRotations)[0] || 0)} 
          onChange={(val) => updateRotation(val, true)} 
          onPointerUp={syncDomChanges}
          min={-180} 
          max={180} 
        />
      </div>

      <Color
        openSubSection={openSubSection}
        setOpenSubSection={setOpenSubSection}
        backgroundColor={backgroundColor}
        setBackgroundColor={handleSetBackgroundColor}
        activeColorPicker={activeColorPicker}
        setActiveColorPicker={setActiveColorPicker}
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
        showDetailedPicker={showDetailedPicker}
        setShowDetailedPicker={setShowDetailedPicker}
      />

      <Effect
        isShape={false}
        openSubSection={openSubSection}
        setOpenSubSection={setOpenSubSection}
        activeEffects={activeEffects}
        setActiveEffects={handleSetActiveEffects}
        effectSettings={effectSettings}
        setEffectSettings={handleSetEffectSettings}
        activeColorPicker={activeColorPicker}
        setActiveColorPicker={setActiveColorPicker}
        showDetailedPicker={showDetailedPicker}
        setShowDetailedPicker={setShowDetailedPicker}
      />
    </div>
  );
};

export default ImageFramingProperties;
