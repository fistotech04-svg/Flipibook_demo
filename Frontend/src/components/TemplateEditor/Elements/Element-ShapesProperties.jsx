import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { createPortal } from 'react-dom';
import { handleScrubHelper } from '../Color';
import Color from '../Color';
import CornerRadius from '../CornerRadius';
import Adjustment from '../Adjustment';
import Effect from '../Effect';
import ShapeAppearanceControls from './ShapeAppearanceControls';
import ImageAdjustModal from './ImageAdjustModal';
import { ChevronLeft, ChevronRight, Upload, Plus, GripVertical, SquarePen, Trash2, ArrowRightLeft } from 'lucide-react';
const PropertySlider = ({ label, value, onChange, min = 0, max = 100, disabled = false }) => {
  const [localVal, setLocalVal] = useState(value);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocalVal(value);
    }
  }, [value]);

  const handleManualInput = (val) => {
    if (disabled) return;
    setLocalVal(val);
    const num = parseInt(val);
    if (!isNaN(num)) {
      onChange(val);
    }
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (disabled) return;
    let num = parseInt(localVal);
    if (isNaN(num)) num = min;

    const corrected = Math.min(Math.max(num, min), max);
    setLocalVal(corrected);
    onChange(corrected.toString());
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  return (
    <div className={`flex items-center gap-[1vw] py-[0.4vw] transition-opacity duration-200 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <span
        className="text-[0.8vw] font-semibold text-gray-600 w-[4vw] flex-shrink-0 cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
        onPointerDown={(e) => {
          handleScrubHelper(e, value, (v) => {
            const num = parseFloat(v);
            const corrected = Math.min(Math.max(num, min), max);
            onChange(corrected.toString());
          });
        }}
      >{label} :</span>
      <div className="flex-grow flex items-center gap-[1vw]">
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={value || 0}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="flex-grow h-[0.25vw] appearance-none cursor-pointer bg-gray-200 rounded-full outline-none disabled:cursor-not-allowed"
          style={{
            background: disabled
              ? '#e5e7eb'
              : `linear-gradient(to right, #6366f1 0%, #6366f1 ${((value || 0) - min) / (max - min) * 100}%, #e5e7eb ${((value || 0) - min) / (max - min) * 100}%, #e5e7eb 100%)`,
          }}
        />
        <div className="w-[2.8vw] h-[1.8vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.4vw] shadow-sm overflow-hidden">
          <input
            type="number"
            min={min}
            max={max}
            value={localVal === undefined ? '' : localVal}
            onChange={(e) => handleManualInput(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className="w-full text-center text-[0.8vw] text-gray-700 font-semibold outline-none bg-transparent no-spin disabled:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
};

const ElementShapesProperties = ({
  selectedElementProps,
  activePageIndex,
  selectedLayerId,
  updateElementAttribute,
  activeMainTool,
  hideCornerRadius = false
}) => {
  const [openSubSection, setOpenSubSection] = useState('color');

  // UI states for Color
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);

  // --- IMAGE MASKING STATE ---
  const [slotImage, setSlotImage] = useState(null);
  const [slotOriginalImage, setSlotOriginalImage] = useState(null);
  const [slotImageName, setSlotImageName] = useState('Image Name .jpg');
  const [slotImageMeta, setSlotImageMeta] = useState('1920 X 1080 • 24MB');
  const [framePadding, setFramePadding] = useState(0);
  const [isMaskEnabled, setIsMaskEnabled] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [slotCropData, setSlotCropData] = useState(null);
  const [slotFixType, setSlotFixType] = useState('Fill All');
  const [slotOpacity, setSlotOpacity] = useState(100);
  const [slotFilters, setSlotFilters] = useState(null);
  const [shapeAspectRatio, setShapeAspectRatio] = useState(1);
  const fileInputRef = useRef(null);
  const adjustStateRef = useRef({ isAdjusting: false, slotId: null, isPanning: false, startX: 0, startY: 0, matrix: null, rotateStr: '', imgNode: null, bbox: null, startMatrix: null, path: null });

  const [isNodeEditActive, setIsNodeEditActive] = useState(false);
  const [activeNodeType, setActiveNodeType] = useState(null);
  const [selectedNodeCount, setSelectedNodeCount] = useState(1);
  const [canJoinNodes, setCanJoinNodes] = useState(false);
  const [isLineSelected, setIsLineSelected] = useState(false);

  useEffect(() => {
    const handleNodeSelected = (e) => {
      if (e.detail?.nodeType) {
        setActiveNodeType(e.detail.nodeType);
      }
      const count = e.detail?.selectedCount !== undefined ? e.detail.selectedCount : e.detail?.count;
      if (count !== undefined) {
        setSelectedNodeCount(count);
      }
      if (e.detail?.canJoin !== undefined) {
        setCanJoinNodes(Boolean(e.detail.canJoin) && count === 2);
      } else {
        setCanJoinNodes(count === 2);
      }
      if (e.detail?.isLineSelected !== undefined) {
        setIsLineSelected(Boolean(e.detail.isLineSelected));
      } else {
        setIsLineSelected(false);
      }
    };
    const handleNodeEditChange = (e) => {
      setIsNodeEditActive(Boolean(e.detail?.active));
      if (e.detail?.active) {
        setSelectedNodeCount(1);
        setCanJoinNodes(false);
        setIsLineSelected(false);
        setActiveNodeType(null);
      }
    };
    window.addEventListener('node-selected', handleNodeSelected);
    window.addEventListener('node-edit-mode-changed', handleNodeEditChange);
    return () => {
      window.removeEventListener('node-selected', handleNodeSelected);
      window.removeEventListener('node-edit-mode-changed', handleNodeEditChange);
    };
  }, []);

  // Listen for mask toggle events dispatched from TopToolbar, Context Menu, or shortcuts
  useEffect(() => {
    const handleShapeMaskToggled = (e) => {
      if (!e.detail || e.detail.layerId === selectedLayerId) {
        const enabled = Boolean(e.detail?.enabled);
        setIsMaskEnabled(enabled);
        if (!enabled) {
          setSlotImage(null);
          setSlotOriginalImage(null);
          setSlotCropData(null);
          setSlotFilters(null);
        }
      }
    };
    window.addEventListener('shape-mask-toggled', handleShapeMaskToggled);
    return () => window.removeEventListener('shape-mask-toggled', handleShapeMaskToggled);
  }, [selectedLayerId]);

  useEffect(() => {
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const selectedElement = doc.getElementById(selectedLayerId);
    if (!selectedElement) return;

    setFramePadding(parseFloat(selectedElement.getAttribute('data-frame-padding')) || 0);

    const hasMaskEnabledAttr = selectedElement.getAttribute('data-mask-enabled') === 'true' ||
      selectedElement.querySelector('[data-mask-enabled="true"]') !== null;
    setIsMaskEnabled(hasMaskEnabledAttr);

    let svgRoot = selectedElement;
    while (svgRoot && svgRoot.tagName?.toLowerCase() !== 'svg') {
      svgRoot = svgRoot.parentElement;
    }

    const listeners = [];

    const syncDomChanges = () => {
      window.__skipCanvasUpdateForPage = activePageIndex;
      let root = selectedElement;
      while (root && root.tagName?.toLowerCase() !== 'svg') root = root.parentElement;
      if (root) {
        const cloneSvg = root.cloneNode(true);
        cloneSvg.querySelectorAll('[data-highlight-id], #ghost-layer').forEach(el => el.remove());
        const serializer = new XMLSerializer();
        const html = serializer.serializeToString(cloneSvg);
        updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
      }
    };

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
        const pattern = (svgRoot || selectedElement).querySelector(`pattern[id="${patternId}"]`) || doc.getElementById(patternId);
        if (!pattern) return;
        const imgNode = pattern.querySelector('image, img');
        if (!imgNode) return;

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
            if (match) matrix = match[1].split(/[ ,]+/).map(parseFloat);
        }
        adjustStateRef.current.matrix = matrix;
        adjustStateRef.current.rotateStr = rotateStr;

        let ghost = selectedElement.querySelector('#ghost-layer');
        if (ghost) ghost.remove();
        
        ghost = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        ghost.id = 'ghost-layer';
        ghost.style.pointerEvents = 'none';
        
        let combinedTransform = path.getAttribute('transform') || '';
        const pt = pattern.getAttribute('patternTransform');
        if (pt) combinedTransform = `${combinedTransform} ${pt}`.trim();
        if (combinedTransform) ghost.setAttribute('transform', combinedTransform);
        
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
            const pattern = (svgRoot || selectedElement).querySelector(`pattern[id="${adjustStateRef.current.slotId}"]`) || doc.getElementById(adjustStateRef.current.slotId);
            if (pattern) {
                pcu = pattern.getAttribute('patternContentUnits') || 'objectBoundingBox';
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
        adjustStateRef.current.matrix[4] = m[4] + tx_delta;
        adjustStateRef.current.matrix[5] = m[5] + ty_delta;
        
        updateAdjustTransform();
    };

    const handlePointerUp = (e) => {
        if (adjustStateRef.current.isPanning) {
            adjustStateRef.current.isPanning = false;
        }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    const updateImageFromDOM = () => {
      let shapes = Array.from(selectedElement.querySelectorAll('path, polygon, rect, circle, ellipse'));
      if (['path', 'polygon', 'rect', 'circle', 'ellipse'].includes(selectedElement.tagName?.toLowerCase())) {
          shapes.unshift(selectedElement);
      }
      
      let foundImage = false;
      
      listeners.forEach(({ shapeEl, handleDoubleClick, handlePointerDown, handleWheel }) => {
        shapeEl.removeEventListener('dblclick', handleDoubleClick);
        shapeEl.removeEventListener('pointerdown', handlePointerDown);
        shapeEl.removeEventListener('wheel', handleWheel);
      });
      listeners.length = 0;
      
      for (const shapeEl of shapes) {
        if (shapeEl.getAttribute('data-mask-enabled') === 'true') {
          setIsMaskEnabled(true);
        }
        const fill = shapeEl.getAttribute('fill');
        if (fill && fill.includes('url(')) {
          const match = fill.match(/url\(['"]?#([^)'"]+)['"]?\)/);
          if (match && match[1]) {
            const patternId = match[1];
            const pattern = (svgRoot || selectedElement).querySelector(`pattern[id="${patternId}"]`) || doc.getElementById(patternId);
            if (pattern) {
              const imgNode = pattern.querySelector('image, img');
              if (imgNode) {
                const newHref = imgNode.getAttribute('href') || imgNode.getAttribute('xlink:href');
                setSlotImage(prev => prev !== newHref ? newHref : prev);
                setIsMaskEnabled(true);

                const savedName = shapeEl.getAttribute('data-slot-image-name') || selectedElement.getAttribute('data-slot-image-name');
                if (savedName) setSlotImageName(savedName);

                const savedMeta = shapeEl.getAttribute('data-slot-image-meta') || selectedElement.getAttribute('data-slot-image-meta');
                if (savedMeta) setSlotImageMeta(savedMeta);

                const savedOrig = shapeEl.getAttribute('data-slot-original-url') || selectedElement.getAttribute('data-slot-original-url');
                if (savedOrig) setSlotOriginalImage(savedOrig);
                else setSlotOriginalImage(newHref);

                const savedCrop = shapeEl.getAttribute('data-slot-crop-data') || selectedElement.getAttribute('data-slot-crop-data');
                if (savedCrop) {
                  try { setSlotCropData(JSON.parse(savedCrop)); } catch (e) {}
                }

                const savedFix = shapeEl.getAttribute('data-slot-fix-type') || selectedElement.getAttribute('data-slot-fix-type');
                if (savedFix) setSlotFixType(savedFix);

                const savedOp = shapeEl.getAttribute('data-slot-opacity') || selectedElement.getAttribute('data-slot-opacity');
                if (savedOp !== null && savedOp !== undefined) setSlotOpacity(parseFloat(savedOp));

                const savedFilters = shapeEl.getAttribute('data-slot-filters') || selectedElement.getAttribute('data-slot-filters');
                if (savedFilters) {
                  try { setSlotFilters(JSON.parse(savedFilters)); } catch (e) {}
                }

                try {
                  const b = shapeEl.getBBox();
                  if (b.width && b.height) {
                    setShapeAspectRatio(b.width / b.height);
                  }
                } catch (e) {}
                
                foundImage = true;

                const handleDoubleClick = (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (adjustStateRef.current.isAdjusting && adjustStateRef.current.slotId === patternId) {
                    exitAdjustMode();
                  } else {
                    if (adjustStateRef.current.isAdjusting) exitAdjustMode();
                    enterAdjustMode(patternId, shapeEl);
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
                      const pat = (svgRoot || selectedElement).querySelector(`pattern[id="${patternId}"]`) || doc.getElementById(patternId);
                      if (pat) pcu = pat.getAttribute('patternContentUnits') || 'objectBoundingBox';
                      
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

                shapeEl.addEventListener('dblclick', handleDoubleClick);
                shapeEl.addEventListener('pointerdown', handlePointerDown);
                shapeEl.addEventListener('wheel', handleWheel, { passive: false });
                listeners.push({ shapeEl, handleDoubleClick, handlePointerDown, handleWheel });

                break;
              }
            }
          }
        }
      }
      
      if (!foundImage) {
        setSlotImage(null);
        const hasMaskAttr = selectedElement.getAttribute('data-mask-enabled') === 'true' ||
          selectedElement.querySelector('[data-mask-enabled="true"]') !== null;
        setIsMaskEnabled(hasMaskAttr);
      }
    };

    updateImageFromDOM();

    let observer = null;
    if (svgRoot) {
      observer = new MutationObserver(() => {
        updateImageFromDOM();
      });
      observer.observe(svgRoot, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ['fill', 'href', 'xlink:href', 'transform', 'patternTransform', 'data-mask-enabled'] 
      });
    }

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      listeners.forEach(({ shapeEl, handleDoubleClick, handlePointerDown, handleWheel }) => {
        shapeEl.removeEventListener('dblclick', handleDoubleClick);
        shapeEl.removeEventListener('pointerdown', handlePointerDown);
        shapeEl.removeEventListener('wheel', handleWheel);
      });
      const ghost = selectedElement?.querySelector('#ghost-layer');
      if (ghost) ghost.remove();
    };
  }, [selectedLayerId, activePageIndex, selectedElementProps?.fill]);

  const handleRemoveMask = () => {
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const selectedElement = doc.getElementById(selectedLayerId);
    if (!selectedElement) return;

    let shapeEl = selectedElement.querySelector('path, polygon, rect, circle, ellipse');
    if (!shapeEl && ['path', 'polygon', 'rect', 'circle', 'ellipse'].includes(selectedElement.tagName?.toLowerCase())) {
      shapeEl = selectedElement;
    }

    let svgRoot = selectedElement;
    while (svgRoot && svgRoot.tagName?.toLowerCase() !== 'svg') {
      svgRoot = svgRoot.parentElement;
    }

    if (shapeEl) {
      shapeEl.removeAttribute('data-mask-enabled');
      const patternMatch = (shapeEl.getAttribute('fill') || '').match(/url\(['"]?#([^)'"]+)['"]?\)/);
      if (patternMatch && patternMatch[1]) {
        const pat = (svgRoot || selectedElement).querySelector(`pattern[id="${patternMatch[1]}"]`);
        if (pat) pat.remove();
      }
      const origFill = shapeEl.getAttribute('data-original-fill') || '#3194FC';
      shapeEl.setAttribute('fill', origFill);
      shapeEl.removeAttribute('data-pattern-id');
      shapeEl.removeAttribute('data-masked-image-url');
      shapeEl.removeAttribute('data-slot-image-name');
      shapeEl.removeAttribute('data-slot-image-meta');
      shapeEl.removeAttribute('data-slot-original-url');
      shapeEl.removeAttribute('data-slot-crop-data');
      shapeEl.removeAttribute('data-slot-fix-type');
      shapeEl.removeAttribute('data-slot-opacity');
      shapeEl.removeAttribute('data-slot-filters');
    }

    selectedElement.removeAttribute('data-mask-enabled');
    selectedElement.removeAttribute('data-slot-image-name');
    selectedElement.removeAttribute('data-slot-image-meta');
    selectedElement.removeAttribute('data-slot-original-url');
    selectedElement.removeAttribute('data-slot-crop-data');
    selectedElement.removeAttribute('data-slot-fix-type');
    selectedElement.removeAttribute('data-slot-opacity');
    selectedElement.removeAttribute('data-slot-filters');
    setSlotImage(null);
    setSlotOriginalImage(null);
    setSlotCropData(null);
    setSlotFixType('Fill All');
    setSlotOpacity(100);
    setSlotFilters(null);
    setShowAdjustModal(false);
    setIsMaskEnabled(false);

    window.__skipCanvasUpdateForPage = activePageIndex;
    if (svgRoot) {
      const cloneSvg = svgRoot.cloneNode(true);
      cloneSvg.querySelectorAll('[data-highlight-id], #ghost-layer').forEach(el => el.remove());
      const serializer = new XMLSerializer();
      const html = serializer.serializeToString(cloneSvg);
      updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
    }
    window.dispatchEvent(new CustomEvent('shape-mask-toggled', { detail: { layerId: selectedLayerId, enabled: false } }));
  };

  const handleDeleteImage = () => {
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const selectedElement = doc.getElementById(selectedLayerId);
    if (!selectedElement) return;

    let shapeEl = selectedElement.querySelector('path, polygon, rect, circle, ellipse');
    if (!shapeEl && ['path', 'polygon', 'rect', 'circle', 'ellipse'].includes(selectedElement.tagName?.toLowerCase())) {
      shapeEl = selectedElement;
    }

    let svgRoot = selectedElement;
    while (svgRoot && svgRoot.tagName?.toLowerCase() !== 'svg') {
      svgRoot = svgRoot.parentElement;
    }

    if (shapeEl) {
      const patternMatch = (shapeEl.getAttribute('fill') || '').match(/url\(['"]?#([^)'"]+)['"]?\)/);
      if (patternMatch && patternMatch[1]) {
        const pat = (svgRoot || selectedElement).querySelector(`pattern[id="${patternMatch[1]}"]`);
        if (pat) pat.remove();
      }
      const origFill = shapeEl.getAttribute('data-original-fill') || '#3194FC';
      shapeEl.setAttribute('fill', origFill);
      shapeEl.removeAttribute('data-pattern-id');
      shapeEl.removeAttribute('data-masked-image-url');
      shapeEl.removeAttribute('data-slot-image-name');
      shapeEl.removeAttribute('data-slot-image-meta');
      shapeEl.removeAttribute('data-slot-original-url');
      shapeEl.removeAttribute('data-slot-crop-data');
      shapeEl.removeAttribute('data-slot-fix-type');
      shapeEl.removeAttribute('data-slot-opacity');
      shapeEl.removeAttribute('data-slot-filters');
    }

    selectedElement.removeAttribute('data-slot-image-name');
    selectedElement.removeAttribute('data-slot-image-meta');
    selectedElement.removeAttribute('data-slot-original-url');
    selectedElement.removeAttribute('data-slot-crop-data');
    selectedElement.removeAttribute('data-slot-fix-type');
    selectedElement.removeAttribute('data-slot-opacity');
    selectedElement.removeAttribute('data-slot-filters');
    setSlotImage(null);
    setSlotOriginalImage(null);
    setSlotCropData(null);
    setSlotFixType('Fill All');
    setSlotOpacity(100);
    setSlotFilters(null);
    setShowAdjustModal(false);
    // Keep isMaskEnabled = true so the "+ Add Images" before-upload box is displayed!

    window.__skipCanvasUpdateForPage = activePageIndex;
    if (svgRoot) {
      const cloneSvg = svgRoot.cloneNode(true);
      cloneSvg.querySelectorAll('[data-highlight-id], #ghost-layer').forEach(el => el.remove());
      const serializer = new XMLSerializer();
      const html = serializer.serializeToString(cloneSvg);
      updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
    }
  };

  const applyImageMask = useCallback((
    dataUrl,
    name = null,
    sizeStr = null,
    originalDataUrl = null,
    cropData = null,
    fixType = 'Fill All',
    opacity = 100,
    filters = null
  ) => {
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const selectedElement = doc.getElementById(selectedLayerId);
    if (!selectedElement) return;

    let shapeEl = selectedElement.querySelector('path, polygon, rect, circle, ellipse');
    if (!shapeEl && ['path', 'polygon', 'rect', 'circle', 'ellipse'].includes(selectedElement.tagName?.toLowerCase())) {
        shapeEl = selectedElement;
    }
    if (!shapeEl) return;

    shapeEl.setAttribute('data-mask-enabled', 'true');
    selectedElement.setAttribute('data-mask-enabled', 'true');
    if (!shapeEl.hasAttribute('data-original-fill')) {
      shapeEl.setAttribute('data-original-fill', shapeEl.getAttribute('fill') || '#3194FC');
    }
    setIsMaskEnabled(true);

    let defs = selectedElement.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      selectedElement.insertBefore(defs, selectedElement.firstChild);
    }

    const patternId = `pattern-${selectedLayerId}`;
    let pattern = defs.querySelector(`pattern[id="${patternId}"]`);
    if (!pattern) {
      pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.setAttribute('id', patternId);
      pattern.setAttribute('patternContentUnits', 'userSpaceOnUse');
      pattern.setAttribute('width', '1');
      pattern.setAttribute('height', '1');
      defs.appendChild(pattern);
    }

    shapeEl.setAttribute('fill', `url(#${patternId})`);

    const img = new window.Image();
    img.onload = () => {
      const imgW = img.width;
      const imgH = img.height;

      const dims = `${img.naturalWidth || imgW} X ${img.naturalHeight || imgH}`;
      const meta = `${dims} • ${sizeStr || '24MB'}`;
      if (name) setSlotImageName(name);
      setSlotImageMeta(meta);

      const origToSave = originalDataUrl || dataUrl;
      setSlotOriginalImage(origToSave);

      if (shapeEl) {
        if (name) shapeEl.setAttribute('data-slot-image-name', name);
        shapeEl.setAttribute('data-slot-image-meta', meta);
        shapeEl.setAttribute('data-slot-original-url', origToSave);
        if (cropData) shapeEl.setAttribute('data-slot-crop-data', JSON.stringify(cropData));
        if (fixType) shapeEl.setAttribute('data-slot-fix-type', fixType);
        if (opacity !== undefined) shapeEl.setAttribute('data-slot-opacity', opacity.toString());
        if (filters) shapeEl.setAttribute('data-slot-filters', JSON.stringify(filters));
      }
      if (selectedElement) {
        if (name) selectedElement.setAttribute('data-slot-image-name', name);
        selectedElement.setAttribute('data-slot-image-meta', meta);
        selectedElement.setAttribute('data-slot-original-url', origToSave);
        if (cropData) selectedElement.setAttribute('data-slot-crop-data', JSON.stringify(cropData));
        if (fixType) selectedElement.setAttribute('data-slot-fix-type', fixType);
        if (opacity !== undefined) selectedElement.setAttribute('data-slot-opacity', opacity.toString());
        if (filters) selectedElement.setAttribute('data-slot-filters', JSON.stringify(filters));
      }

      let bbox = { width: 100, height: 100, x: 0, y: 0 };
      try {
        bbox = shapeEl.getBBox();
      } catch(e) {}
      if (bbox.width === 0 || bbox.height === 0) bbox = { width: 100, height: 100, x: 0, y: 0 };

      const slotW = bbox.width;
      const slotH = bbox.height;

      if (slotW && slotH) {
        setShapeAspectRatio(slotW / slotH);
      }

      let scaleX, scaleY;
      if (fixType === 'Fit') {
        const fitScale = Math.min(slotW / imgW, slotH / imgH);
        scaleX = fitScale;
        scaleY = fitScale;
      } else if (fixType === 'Stretch') {
        scaleX = slotW / imgW;
        scaleY = slotH / imgH;
      } else {
        // 'Fill All' (cover)
        const coverScale = Math.max(slotW / imgW, slotH / imgH);
        scaleX = coverScale;
        scaleY = coverScale;
      }

      const finalW = imgW * scaleX;
      const finalH = imgH * scaleY;

      const tx_user = (slotW - finalW) / 2;
      const ty_user = (slotH - finalH) / 2;

      let imageNode = pattern.querySelector('image, img');
      if (!imageNode) {
        imageNode = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        pattern.appendChild(imageNode);
      }

      imageNode.setAttribute('width', imgW);
      imageNode.setAttribute('height', imgH);
      imageNode.removeAttribute('preserveAspectRatio');
      
      pattern.setAttribute('patternContentUnits', 'userSpaceOnUse');
      
      const existingTf = imageNode.getAttribute('transform') || '';
      let rotateStr = '';
      const rMatch = existingTf.match(/rotate\([^)]+\)/);
      if (rMatch) rotateStr = rMatch[0] + ' ';
      
      imageNode.setAttribute('transform', `${rotateStr}matrix(${scaleX} 0 0 ${scaleY} ${bbox.x + tx_user} ${bbox.y + ty_user})`);
      imageNode.setAttribute('opacity', ((opacity !== undefined ? opacity : 100) / 100).toString());

      imageNode.setAttribute('href', dataUrl);
      imageNode.setAttribute('xlink:href', dataUrl);

      setSlotImage(dataUrl);

      // Force update
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
        // Also update the 'fill' attribute if needed
        updateElementAttribute(activePageIndex, selectedLayerId, {
            '__dom_sync__': html,
            'fill': `url(#${patternId})`
        });
      }
    };
    img.src = dataUrl;
  }, [selectedLayerId, activePageIndex, updateElementAttribute]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Only Image formats are allowed for shapes.');
      e.target.value = '';
      return;
    }

    const name = file.name || 'Image Name .jpg';
    setSlotImageName(name);

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)}MB`
      : `${Math.round(file.size / 1024)}KB`;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setSlotOriginalImage(dataUrl);
      setSlotCropData(null);
      setSlotFilters(null);
      setSlotOpacity(100);
      setSlotFixType('Fill All');
      applyImageMask(dataUrl, name, sizeStr, dataUrl, null, 'Fill All', 100, null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAdjustedImage = useCallback(({
    croppedUrl,
    originalUrl,
    cropData,
    fixType,
    opacity: adjustedOpacity,
    filters
  }) => {
    setSlotCropData(cropData);
    setSlotFixType(fixType || 'Fill All');
    setSlotOpacity(adjustedOpacity !== undefined ? adjustedOpacity : 100);
    setSlotFilters(filters);
    const orig = originalUrl || slotOriginalImage || slotImage;
    if (orig) setSlotOriginalImage(orig);

    applyImageMask(
      croppedUrl,
      slotImageName,
      slotImageMeta,
      orig,
      cropData,
      fixType || 'Fill All',
      adjustedOpacity !== undefined ? adjustedOpacity : 100,
      filters
    );
    setShowAdjustModal(false);
  }, [slotImageName, slotImageMeta, slotOriginalImage, slotImage, applyImageMask]);

  const updateFramePadding = (newPadding) => {
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const selectedElement = doc.getElementById(selectedLayerId);
    if (!selectedElement) return;
    
    setFramePadding(newPadding);
    selectedElement.setAttribute('data-frame-padding', newPadding);
    
    const scaleVal = (100 - newPadding) / 100;
    
    let shapes = Array.from(selectedElement.querySelectorAll('path, polygon, rect, circle, ellipse'));
    if (['path', 'polygon', 'rect', 'circle', 'ellipse'].includes(selectedElement.tagName?.toLowerCase())) {
        shapes.unshift(selectedElement);
    }
    
    const paths = shapes.filter(p => p.hasAttribute('fill') && p.getAttribute('fill').includes('url('));
      
    paths.forEach(p => {
      if (!p.hasAttribute('data-orig-tf')) {
        p.setAttribute('data-orig-tf', p.getAttribute('transform') || '');
      }
    });

    let boundary = selectedElement.querySelector('.frame-bg-rect');
    if (!boundary) {
      paths.forEach(p => {
        const origTf = p.getAttribute('data-orig-tf');
        if (origTf) p.setAttribute('transform', origTf);
        else p.removeAttribute('transform');
      });
      
      let bbox = { x: 0, y: 0, width: 100, height: 100 };
      try { bbox = selectedElement.getBBox(); } catch(e) {}

      boundary = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      boundary.setAttribute('class', 'frame-bg-rect');
      
      const fillVal = selectedElement.getAttribute('fill') || selectedElement.getAttribute('data-fill-color') || 'none';
      boundary.setAttribute('fill', fillVal !== '#' ? fillVal : 'none');
      const bgOp = selectedElement.getAttribute('opacity');
      if (bgOp) boundary.setAttribute('fill-opacity', bgOp);
      
      const strokeVal = selectedElement.getAttribute('stroke') || selectedElement.getAttribute('data-stroke-color') || 'none';
      boundary.setAttribute('stroke', strokeVal !== '#' ? strokeVal : 'none');
      const strOp = selectedElement.getAttribute('stroke-opacity');
      if (strOp) boundary.setAttribute('stroke-opacity', strOp);
      const strW = selectedElement.getAttribute('stroke-width');
      if (strW) boundary.setAttribute('stroke-width', strW);
      const strDash = selectedElement.getAttribute('stroke-dasharray');
      if (strDash) boundary.setAttribute('stroke-dasharray', strDash);
      
      let rx = selectedElement.getAttribute('rx');
      if (!rx && selectedElement.tagName === 'rect') rx = selectedElementProps?.rx;
      if (rx) {
        boundary.setAttribute('rx', rx);
        boundary.setAttribute('ry', rx);
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
    });

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

  const shapeType = selectedElementProps['data-shape-type'] || selectedElementProps.innerTagName || selectedElementProps.tagName?.toLowerCase();

  const isDiamond = shapeType === 'diamond' ||
    selectedElementProps['data-shape-id'] === 'rounded-diamond' ||
    (selectedElementProps.d && (selectedElementProps.d.includes('50 12') || selectedElementProps.d.includes('50 88') || selectedElementProps.d.includes('85 43') || selectedElementProps.d.includes('15 57')));

  const isRectangularShape = Boolean(
    !['polygon', 'star', 'circle', 'ellipse', 'line'].includes(shapeType) &&
    (
      shapeType === 'rect' ||
      shapeType === 'rectangle' ||
      shapeType === 'square' ||
      shapeType === 'shape' ||
      shapeType === 'diamond' ||
      isDiamond ||
      selectedElementProps?.['data-type'] === 'shape' ||
      selectedElementProps?.isElementShape ||
      selectedElementProps?.innerTagName === 'rect' ||
      selectedElementProps?.tagName?.toLowerCase() === 'rect' ||
      (() => {
        try {
          const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
          const el = doc.getElementById(selectedLayerId);
          if (!el) return false;
          const inner = el.querySelector('rect, [data-shape-type="rectangle"], [data-shape-type="diamond"], [data-shape-type="shape"]') || (['rect', 'g'].includes(el.tagName?.toLowerCase()) ? el : null);
          return Boolean(inner);
        } catch (e) {
          return false;
        }
      })()
    )
  );

  const shouldHideCornerRadius = hideCornerRadius || !isRectangularShape;

  if (!selectedElementProps) return null;

  const updateAttr = (attribute, value) => {
    updateElementAttribute(activePageIndex, selectedLayerId, attribute, value);
  };

  // --- DERIVED STATE ---
  const backgroundColor = {
    fill: (selectedElementProps.fill && selectedElementProps.fill !== 'inherit') ? selectedElementProps.fill : (selectedElementProps['data-fill-color'] || '#000000'),
    fillOpacity: selectedElementProps['fill-opacity'] ? parseFloat(selectedElementProps['fill-opacity']) * 100 : (selectedElementProps.opacity ? parseFloat(selectedElementProps.opacity) * 100 : 100),
    stroke: (selectedElementProps.stroke && selectedElementProps.stroke !== 'inherit') ? selectedElementProps.stroke : (selectedElementProps['data-stroke-color'] || 'none'),
    strokeOpacity: selectedElementProps['stroke-opacity'] ? parseFloat(selectedElementProps['stroke-opacity']) * 100 : 100,
    fillType: selectedElementProps['fill-type'] || 'solid',
    fillGradientType: selectedElementProps['fill-gradient-type'] || 'linear',
    fillStops: selectedElementProps['fill-stops'],
    fillAngle: parseFloat(selectedElementProps['fill-angle'] || 0),
    fillRadius: parseFloat(selectedElementProps['fill-radius'] || 100),
    strokeType: selectedElementProps['stroke-type'] || 'solid',
    strokeGradientType: selectedElementProps['stroke-gradient-type'] || 'linear',
    strokeStops: selectedElementProps['stroke-stops'],
    strokeAngle: parseFloat(selectedElementProps['stroke-angle'] || 0),
    strokeRadius: parseFloat(selectedElementProps['stroke-radius'] || 100),
    strokeWeight: parseFloat(selectedElementProps['stroke-width'] || 0),
    strokeDashStyle: ((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) && (selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) !== 'none') ? 'Dashed' : 'Solid',
    strokeDasharrayValue: selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray,
    strokeDashLength: parseInt(((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) === 'none' ? '10,10' : ((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) || '10,10')).split(',')[0]) || 10,
    strokeDashGap: parseInt((((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) === 'none' ? '10,10' : ((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) || '10,10')).split(',')[1] || ((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) === 'none' ? '10,10' : ((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) || '10,10')).split(',')[0])) || 10,
    strokeLinecap: selectedElementProps['stroke-linecap'] || 'butt',
    strokePosition: selectedElementProps['data-stroke-position'] || 'Center',
  };

  const handleSetBackgroundColor = (updater) => {
    const next = typeof updater === 'function' ? updater(backgroundColor) : updater;

    const updates = {};
    if (backgroundColor.fill !== next.fill) {
      if (slotImage) {
        updates['data-fill-color'] = next.fill;
      } else {
        updates['fill'] = next.fill;
        updates['data-fill-color'] = next.fill;
      }
    }
    if (backgroundColor.fillOpacity !== next.fillOpacity) {
      updates['fill-opacity'] = (next.fillOpacity / 100).toString();
      updates['opacity'] = '1'; // Reset overall opacity so it doesn't affect stroke
    }
    if (backgroundColor.stroke !== next.stroke) {
      updates['stroke'] = next.stroke;
      updates['data-stroke-color'] = next.stroke;
    }
    if (backgroundColor.strokeOpacity !== next.strokeOpacity) updates['stroke-opacity'] = (next.strokeOpacity / 100).toString();
    if (backgroundColor.strokeWeight !== next.strokeWeight) {
      updates['stroke-width'] = next.strokeWeight.toString();
      updates['strokeWidth'] = next.strokeWeight.toString();
      updates['data-stroke-width'] = next.strokeWeight.toString();
    }
    if (backgroundColor.strokeDashStyle !== next.strokeDashStyle || backgroundColor.strokeDashLength !== next.strokeDashLength || backgroundColor.strokeDashGap !== next.strokeDashGap || backgroundColor.strokeDasharrayValue !== next.strokeDasharrayValue) {
      if (next.strokeDashStyle === 'none' || next.strokeDashStyle === 'Solid') {
        updates['stroke-dasharray'] = 'none';
      } else {
        updates['stroke-dasharray'] = next.strokeDasharrayValue || `${next.strokeDashLength || 10},${next.strokeDashGap || 10}`;
      }
    }
    if (backgroundColor.strokePosition !== next.strokePosition) updates['data-stroke-position'] = next.strokePosition;
    if (backgroundColor.strokeLinecap !== next.strokeLinecap) {
      updates['stroke-linecap'] = next.strokeLinecap;
      updates['stroke-linejoin'] = next.strokeLinecap === 'round' ? 'round' : 'miter';
    }
    if (backgroundColor.fillType !== next.fillType) updates['fill-type'] = next.fillType;
    if (backgroundColor.fillGradientType !== next.fillGradientType) updates['fill-gradient-type'] = next.fillGradientType;
    if (backgroundColor.fillStops !== next.fillStops) updates['fill-stops'] = next.fillStops;
    if (backgroundColor.fillAngle !== next.fillAngle) updates['fill-angle'] = next.fillAngle;
    if (backgroundColor.fillRadius !== next.fillRadius) updates['fill-radius'] = next.fillRadius;

    if (backgroundColor.strokeType !== next.strokeType) updates['stroke-type'] = next.strokeType;
    if (backgroundColor.strokeGradientType !== next.strokeGradientType) updates['stroke-gradient-type'] = next.strokeGradientType;
    if (backgroundColor.strokeStops !== next.strokeStops) updates['stroke-stops'] = next.strokeStops;
    if (backgroundColor.strokeAngle !== next.strokeAngle) updates['stroke-angle'] = next.strokeAngle;
    if (backgroundColor.strokeRadius !== next.strokeRadius) updates['stroke-radius'] = next.strokeRadius;

    if (Object.keys(updates).length > 0) {
      const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
      const selectedElement = doc.getElementById(selectedLayerId);
      if (selectedElement) {
        const bgRect = selectedElement.querySelector('.frame-bg-rect');
        if (bgRect) {
          if (next.fill !== undefined) bgRect.setAttribute('fill', next.fill !== '#' ? next.fill : 'none');
          if (next.fillOpacity !== undefined) bgRect.setAttribute('fill-opacity', next.fillOpacity / 100);
          if (next.stroke !== undefined) bgRect.setAttribute('stroke', next.stroke !== '#' ? next.stroke : 'none');
          if (next.strokeOpacity !== undefined) bgRect.setAttribute('stroke-opacity', next.strokeOpacity / 100);
          if (next.strokeWeight !== undefined) bgRect.setAttribute('stroke-width', next.strokeWeight);
          if (next.strokeDashStyle !== undefined) {
            const dashValue = (next.strokeDashStyle === 'none' || next.strokeDashStyle === 'Solid') 
              ? 'none' 
              : (next.strokeDasharrayValue || `${next.strokeDashLength || 10},${next.strokeDashGap || 10}`);
            bgRect.setAttribute('stroke-dasharray', dashValue);
          }
          Object.entries(updates).forEach(([k, v]) => {
            if (k === 'fill' || k === 'stroke') return; // Handled by bgRect
            selectedElement.setAttribute(k, v);
          });
          
          window.__skipCanvasUpdateForPage = activePageIndex;
          let svgRoot = selectedElement;
          while (svgRoot && svgRoot.tagName?.toLowerCase() !== 'svg') svgRoot = svgRoot.parentElement;
          if (svgRoot) {
            const cloneSvg = svgRoot.cloneNode(true);
            cloneSvg.querySelectorAll('[data-highlight-id], #ghost-layer').forEach(el => el.remove());
            const serializer = new XMLSerializer();
            const html = serializer.serializeToString(cloneSvg);
            updateElementAttribute(activePageIndex, selectedLayerId, { ...updates, '__dom_sync__': html });
            return;
          }
        }
      }
      updateElementAttribute(activePageIndex, selectedLayerId, updates);
    }
  };

  const radius = {
    tl: parseInt(selectedElementProps['data-tl'] !== undefined ? selectedElementProps['data-tl'] : (selectedElementProps.rx || 0)),
    tr: parseInt(selectedElementProps['data-tr'] !== undefined ? selectedElementProps['data-tr'] : (selectedElementProps.rx || 0)),
    bl: parseInt(selectedElementProps['data-bl'] !== undefined ? selectedElementProps['data-bl'] : (selectedElementProps.rx || 0)),
    br: parseInt(selectedElementProps['data-br'] !== undefined ? selectedElementProps['data-br'] : (selectedElementProps.rx || 0))
  };
  const isRadiusLinked = selectedElementProps['data-corner-linked'] !== 'false';

  const handleSetRadius = (updater) => {
    const next = typeof updater === 'function' ? updater(radius) : updater;
    const updates = {};
    updates['data-tl'] = (next.tl || 0).toString();
    updates['data-tr'] = (next.tr || 0).toString();
    updates['data-bl'] = (next.bl || 0).toString();
    updates['data-br'] = (next.br || 0).toString();

    const maxR = Math.max(next.tl || 0, next.tr || 0, next.bl || 0, next.br || 0);
    updates['rx'] = maxR.toString();
    updates['ry'] = maxR.toString();

    try {
      const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
      const el = doc.getElementById(selectedLayerId);
      if (el) {
        let target = el;
        if (el.tagName.toLowerCase() === 'g') {
          const inner = el.querySelector('path, polygon, rect, circle, ellipse, line');
          if (inner) target = inner;
        }
        const sType = target.getAttribute('data-shape-type') || (target.tagName.toLowerCase() === 'rect' ? 'rectangle' : null);
        const pD = target.getAttribute('d') || '';
        const isDia = sType === 'diamond' || target.getAttribute('data-shape-id') === 'rounded-diamond' || (pD && (pD.includes('50 12') || pD.includes('50 88') || pD.includes('85 43') || pD.includes('15 57')));

        if (isDia) {
          target.setAttribute('data-shape-type', 'diamond');
          let x = parseFloat(target.getAttribute('x') || 0);
          let y = parseFloat(target.getAttribute('y') || 0);
          let w = parseFloat(target.getAttribute('width') || 0);
          let h = parseFloat(target.getAttribute('height') || 0);
          if (!w || !h) {
            try {
              const bbox = target.getBBox();
              if (bbox && bbox.width > 0 && bbox.height > 0) {
                x = bbox.x; y = bbox.y; w = bbox.width; h = bbox.height;
              }
            } catch (e) {}
          }
          if (!w || !h) { x = 10; y = 10; w = 80; h = 80; }
          const cx = x + w / 2;
          const cy = y + h / 2;
          const pts = [
            { x: cx, y, r: next.tl || 0 },
            { x: x + w, y: cy, r: next.tr || 0 },
            { x: cx, y: y + h, r: next.br || 0 },
            { x, y: cy, r: next.bl || 0 }
          ];
          const cornerPoints = pts.map((curr, i) => {
            const prev = pts[(i + pts.length - 1) % pts.length];
            const nextPt = pts[(i + 1) % pts.length];
            const d1 = { x: curr.x - prev.x, y: curr.y - prev.y };
            const d2 = { x: nextPt.x - curr.x, y: nextPt.y - curr.y };
            const l1 = Math.hypot(d1.x, d1.y) || 1;
            const l2 = Math.hypot(d2.x, d2.y) || 1;
            const limit = Math.max(0, Math.min(curr.r, l1 / 2, l2 / 2));
            return {
              limit,
              q: { x: curr.x, y: curr.y },
              p1: { x: curr.x - (d1.x / l1) * limit, y: curr.y - (d1.y / l1) * limit },
              p2: { x: curr.x + (d2.x / l2) * limit, y: curr.y + (d2.y / l2) * limit }
            };
          });
          let pathData = '';
          cornerPoints.forEach((cp, i) => {
            if (i === 0) pathData += `M ${cp.p1.x.toFixed(2)} ${cp.p1.y.toFixed(2)}`;
            else pathData += ` L ${cp.p1.x.toFixed(2)} ${cp.p1.y.toFixed(2)}`;
            if (cp.limit > 0) pathData += ` Q ${cp.q.x.toFixed(2)} ${cp.q.y.toFixed(2)}, ${cp.p2.x.toFixed(2)} ${cp.p2.y.toFixed(2)}`;
          });
          pathData += ' Z';
          target.setAttribute('d', pathData);
        }
      }
    } catch (e) {}

    updateElementAttribute(activePageIndex, selectedLayerId, updates);
  };

  const handleSetIsRadiusLinked = (val) => {
    if (val) {
      const maxR = Math.max(radius.tl || 0, radius.tr || 0, radius.bl || 0, radius.br || 0);
      updateElementAttribute(activePageIndex, selectedLayerId, {
        'data-corner-linked': 'true',
        'data-tl': maxR.toString(),
        'data-tr': maxR.toString(),
        'data-bl': maxR.toString(),
        'data-br': maxR.toString(),
        'rx': maxR.toString(),
        'ry': maxR.toString()
      });
    } else {
      updateElementAttribute(activePageIndex, selectedLayerId, 'data-corner-linked', 'false');
    }
  };

  const activeEffects = [];
  if (selectedElementProps['data-effect-drop-shadow'] === 'true') activeEffects.push('Drop Shadow');
  if (selectedElementProps['data-effect-inner-shadow'] === 'true') activeEffects.push('Inner Shadow');
  if (selectedElementProps['data-effect-blur'] === 'true') activeEffects.push('Blur');

  const handleSetActiveEffects = (updater) => {
    const currentActive = [];
    if (selectedElementProps['data-effect-drop-shadow'] === 'true') currentActive.push('Drop Shadow');
    if (selectedElementProps['data-effect-inner-shadow'] === 'true') currentActive.push('Inner Shadow');
    if (selectedElementProps['data-effect-blur'] === 'true') currentActive.push('Blur');

    const next = typeof updater === 'function' ? updater(currentActive) : updater;
    const updates = {};
    const hasDropShadow = next.includes('Drop Shadow');
    const hasInnerShadow = next.includes('Inner Shadow');
    const hasBlur = next.includes('Blur');

    if ((selectedElementProps['data-effect-drop-shadow'] === 'true') !== hasDropShadow) updates['data-effect-drop-shadow'] = hasDropShadow ? 'true' : 'false';
    if ((selectedElementProps['data-effect-inner-shadow'] === 'true') !== hasInnerShadow) updates['data-effect-inner-shadow'] = hasInnerShadow ? 'true' : 'false';
    if ((selectedElementProps['data-effect-blur'] === 'true') !== hasBlur) updates['data-effect-blur'] = hasBlur ? 'true' : 'false';

    if (Object.keys(updates).length > 0) updateElementAttribute(activePageIndex, selectedLayerId, updates);
  };

  const effectSettings = {
    'Drop Shadow': {
      x: parseInt(selectedElementProps['data-effect-drop-shadow-x'] || 2),
      y: parseInt(selectedElementProps['data-effect-drop-shadow-y'] || 2),
      blur: parseInt(selectedElementProps['data-effect-drop-shadow-blur'] || 0),
      spread: parseInt(selectedElementProps['data-effect-drop-shadow-spread'] || 0),
      color: selectedElementProps['data-effect-drop-shadow-color'] || '#000000',
      opacity: parseInt(selectedElementProps['data-effect-drop-shadow-opacity'] || 35),
    },
    'Inner Shadow': {
      x: parseInt(selectedElementProps['data-effect-inner-shadow-x'] || 2),
      y: parseInt(selectedElementProps['data-effect-inner-shadow-y'] || 2),
      blur: parseInt(selectedElementProps['data-effect-inner-shadow-blur'] || 0),
      spread: parseInt(selectedElementProps['data-effect-inner-shadow-spread'] || 0),
      color: selectedElementProps['data-effect-inner-shadow-color'] || '#000000',
      opacity: parseInt(selectedElementProps['data-effect-inner-shadow-opacity'] || 35),
    },
    'Blur': {
      blur: parseFloat(selectedElementProps['data-effect-blur-value'] !== undefined ? selectedElementProps['data-effect-blur-value'] : (selectedElementProps['data-effect-blur-blur'] || 0.3)),
      spread: parseInt(selectedElementProps['data-effect-blur-spread'] || 0),
      clipContent: selectedElementProps['data-effect-blur-clip'] === 'true'
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

  const isVectorPath = (
    shapeType === 'path' ||
    shapeType === 'vector-path' ||
    shapeType === 'shape' ||
    selectedElementProps?.['data-type'] === 'vector-path' ||
    selectedElementProps?.['data-type'] === 'shape' ||
    selectedElementProps?.tagName?.toLowerCase() === 'path' ||
    Boolean(selectedElementProps?.d) ||
    isNodeEditActive ||
    Boolean(selectedLayerId)
  );

  const triggerPathAction = (action) => {
    if (['sharp', 'smooth', 'balanced', 'custom'].includes(action)) {
      setActiveNodeType(action);
    }
    window.dispatchEvent(new CustomEvent('vector-path-action', { detail: { action } }));
  };

  const isPenChosen = activeMainTool === 'pen';

  return (
    <div className="flex flex-col gap-[0.4vw] font-sans">

      <div className="flex items-center gap-[0.75vw] mb-[0.2vw]">
        <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Element Shape Properties</span>
        <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
      </div>

      {/* Image Masking Section (Shown at the top of the properties when Mask option is clicked or image is present) */}
      {(isMaskEnabled || slotImage) && (
        <div className="px-[0.2vw] space-y-[0.35vw] py-[0.4vw]">
          <div className="flex items-center justify-between mb-[0.4vw]">
            <span className="text-[0.8vw] font-semibold text-gray-800">Mask Image</span>
            <button
              type="button"
              onClick={handleRemoveMask}
              className="text-[0.65vw] text-red-500 hover:text-red-700 font-medium cursor-pointer transition-colors"
            >
              Remove
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />

          {!slotImage ? (
            /* BEFORE UPLOAD: Dashed Add Images Box */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                  handleFileChange({ target: { files: files } });
                }
              }}
              className="w-full h-[4.2vw] border-[1.5px] border-dashed border-[#9CA3AF] rounded-[0.8vw] bg-[#F4F5F7] hover:bg-[#ECEEF2] hover:border-gray-500 flex items-center justify-center gap-[0.5vw] text-[#6B7280] hover:text-[#374151] cursor-pointer transition-all select-none shadow-2xs group"
            >
              <Plus size="1.15vw" strokeWidth={1.8} className="text-[#6B7280] group-hover:text-[#374151] transition-colors" />
              <span className="text-[0.85vw] font-normal text-[#6B7280] group-hover:text-[#374151] transition-colors">
                Add Images
              </span>
            </div>
          ) : (
            /* AFTER UPLOAD: Card with Drag Grip, Thumbnail, Name, Resolution/Size, Edit Pen, and Trash */
            <div className="w-full bg-[#F3F4F6] rounded-[0.6vw] p-[0.5vw] flex items-center justify-between select-none border border-transparent hover:border-gray-200 transition-all shadow-2xs">
              <div className="flex items-center gap-[0.8vw] min-w-0 flex-1">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group/thumb w-[4vw] h-[3vw] rounded-[0.35vw] overflow-hidden bg-black shrink-0 border border-gray-200/60 shadow-2xs cursor-pointer"
                  title="Click to replace image"
                >
                  <img src={slotImage} alt={slotImageName || 'Mask'} className="w-full h-full object-cover transition-transform duration-200 group-hover/thumb:scale-105" />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center text-white transition-all duration-200">
                    <ArrowRightLeft size="0.85vw" strokeWidth={1.8} className="text-white mb-[0.1vw]" />
                    <span className="text-[0.52vw] font-medium text-white tracking-wide">Replace</span>
                  </div>
                </div>
                <div className="flex flex-col min-w-0 flex-1 justify-center ml-[0.2vw]">
                  <span className="text-[0.78vw] font-medium text-gray-800 truncate" title={slotImageName}>
                    {slotImageName || 'Image Name .jpg'}
                  </span>
                  <span className="text-[0.65vw] text-gray-400 font-normal mt-[0.1vw]">
                    {slotImageMeta || '1920 X 1080 • 24MB'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-[0.5vw] shrink-0 ml-[0.5vw]">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                      const el = doc.getElementById(selectedLayerId);
                      const s = el?.querySelector('path, polygon, rect, circle, ellipse') || el;
                      if (s) {
                        const b = s.getBBox();
                        if (b.width && b.height) {
                          setShapeAspectRatio(b.width / b.height);
                        }
                      }
                    } catch (e) {}
                    setShowAdjustModal(true);
                  }}
                  className="text-gray-500 hover:text-gray-800 transition-colors p-[0.2vw] cursor-pointer"
                  title="Adjust Image"
                >
                  <SquarePen size="1vw" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="text-[#EF4444] hover:text-[#DC2626] transition-colors p-[0.2vw] cursor-pointer"
                  title="Delete Image"
                >
                  <Trash2 size="1vw" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(shapeType === 'polygon' || shapeType === 'star') && (
        <div className="px-[0.2vw] space-y-[0.3vw] py-[0.5vw]">
          <PropertySlider
            label={shapeType === 'polygon' ? "Sides" : "Points"}
            value={parseInt(selectedElementProps['data-count'] || (shapeType === 'polygon' ? 3 : 5))}
            onChange={(val) => updateAttr('data-count', val.toString())}
            min={3}
            max={shapeType === 'polygon' ? 50 : 24}
          />
          <PropertySlider
            label="Ratio"
            value={
              shapeType === 'star'
                ? Math.round(parseFloat(selectedElementProps['data-ratio'] || 40))
                : 0
            }
            onChange={(val) => updateAttr('data-ratio', val)}
            disabled={shapeType === 'polygon'}
          />
          <PropertySlider
            label="Corner"
            value={Math.round(parseFloat(
              selectedElementProps['data-radius'] || 0
            ))}
            onChange={(val) => updateAttr('data-radius', val)}
            max={50}
          />
        </div>
      )}

      {/* Image Adjust / Crop Modal (Strictly for Image Adjustment like slideshow) */}
      {showAdjustModal && (slotOriginalImage || slotImage) && (
        <ImageAdjustModal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          imageSrc={slotOriginalImage || slotImage}
          initialFixType={slotFixType || 'Fill All'}
          initialOpacity={slotOpacity !== undefined ? slotOpacity : 100}
          initialFilters={slotFilters || null}
          initialCrop={slotCropData || null}
          frameAspectRatio={shapeAspectRatio || 1}
          onSave={handleSaveAdjustedImage}
        />
      )}

      <ShapeAppearanceControls
        backgroundColor={backgroundColor}
        setBackgroundColor={handleSetBackgroundColor}
        activeColorPicker={activeColorPicker}
        setActiveColorPicker={setActiveColorPicker}
        colorsOnPage={colorsOnPage}
        radius={radius}
        setRadius={handleSetRadius}
        isRadiusLinked={isRadiusLinked}
        setIsRadiusLinked={handleSetIsRadiusLinked}
        hideCornerRadius={shouldHideCornerRadius}
        activeEffects={activeEffects}
        setActiveEffects={handleSetActiveEffects}
        effectSettings={effectSettings}
        setEffectSettings={handleSetEffectSettings}
        openSubSection={openSubSection}
        setOpenSubSection={setOpenSubSection}
        showDetailedPicker={showDetailedPicker}
        setShowDetailedPicker={setShowDetailedPicker}
      />

      {/* CUSTOM CSS */}
      <style>{`
        .hide-opacity-bar .space-y-\\[1vw\\] > div:nth-child(2) {
          display: none !important;
        }
        input[type='range'] {
          position: relative;
        }
        input[type='range']::before {
          content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 1.1vw;
          width: 1.1vw;
          border-radius: 50%;
          background: #ffffff;
          border: 0.1vw solid #e5e7eb;
          box-shadow: 0 0.1vw 0.3vw rgba(0,0,0,0.1);
          cursor: pointer;
          position: relative;
          z-index: 2;
        }
        input[type='range'].blue-thumb::-webkit-slider-thumb {
          background: #6366f1;
          border-color: #6366f1;
          height: 0.8vw;
          width: 0.8vw;
        }
        .no-spin::-webkit-inner-spin-button, .no-spin::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        body.is-scrubbing, body.is-scrubbing * {
          cursor: none !important;
          user-select: none !important;
        }
        .hide-cursor, .hide-cursor * {
          cursor: none !important;
        }
        .virtual-scrub-cursor {
          position: fixed;
          pointer-events: none;
          z-index: 100000;
          width: 2vw;
          height: 2vw;
          margin-left: -1vw;
          margin-top: -1vw;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0.1vw 0.2vw rgba(0,0,0,0.3));
        }
      `}</style>
    </div>
  );
};

export default ElementShapesProperties;
