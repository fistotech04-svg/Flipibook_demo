import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { createPortal } from 'react-dom';
import ColorPicker, { parseGradient } from './ColorPicker';
import { generateGradientString } from "../CustomizedEditor/AppearanceShared";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, X, Pipette } from 'lucide-react';

const DashInput = ({ label, initialValue, onChange }) => {
  const [localVal, setLocalVal] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  const displayVal = isFocused ? localVal : initialValue;

  const handleManualInput = (val) => {
    setLocalVal(val);
    const num = parseInt(val);
    if (!isNaN(num)) {
      onChange(Math.max(1, num));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let num = parseInt(localVal);
    if (isNaN(num) || num < 1) num = 1;
    onChange(num);
  };

  const handleFocus = () => {
    setLocalVal(initialValue);
    setIsFocused(true);
  };

  const safeNumericVal = parseInt(initialValue) || 1;

  return (
    <div className="flex items-center justify-between">
      <span
        className="text-[0.75vw] font-semibold text-gray-600 cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
        onPointerDown={(e) => handleScrubHelper(e, safeNumericVal, (v) => onChange(Math.max(1, parseInt(v))))}
      >{label} :</span>
      <div
        className="flex items-center gap-[0.4vw] h-[2vw] cursor-ew-resize select-none"
        onPointerDown={(e) => {
          if (e.target.tagName === 'INPUT' || e.target.closest('button')) return;
          handleScrubHelper(e, safeNumericVal, (newVal) => onChange(Math.max(1, parseInt(newVal))));
        }}
      >
        <button onPointerDown={(e) => { e.stopPropagation(); onChange(Math.max(1, safeNumericVal - 1)); }} className="text-gray-400 hover:text-indigo-600 pointer-events-auto"><ChevronLeft size="0.9vw" /></button>
        <div className="w-[3.5vw] h-full border border-gray-200 rounded-[0.3vw] flex items-center justify-center bg-white shadow-sm pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
          <input
            type="number"
            value={displayVal === '' ? '' : displayVal}
            onChange={(e) => handleManualInput(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-center text-[0.75vw] font-semibold text-gray-700 outline-none no-spin bg-transparent cursor-text"
          />
        </div>
        <button onPointerDown={(e) => { e.stopPropagation(); onChange(Math.max(1, safeNumericVal + 1)); }} className="text-gray-400 hover:text-indigo-600 pointer-events-auto"><ChevronRight size="0.9vw" /></button>
      </div>
    </div>
  );
};

export const handleScrubHelper = (e, initialVal, updateFn, sensitivity = 5) => {
  const sValue = parseFloat(initialVal) || 0;
  let accumulatedDelta = 0;
  let virtualX = e.clientX;
  let virtualY = e.clientY;

  document.body.classList.add('is-scrubbing');

  if (e.pointerId !== undefined) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) { }
  }

  const vCursor = document.createElement('div');
  vCursor.className = 'virtual-scrub-cursor';
  vCursor.style.left = `${virtualX}px`;
  vCursor.style.top = `${virtualY}px`;
  vCursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 15L21 12L18 9" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 9L3 12L6 15" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 12H20" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 15L21 12L18 9" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 9L3 12L6 15" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 12H20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  document.body.appendChild(vCursor);

  const onMouseMove = (moveEvent) => {
    const dx = moveEvent.movementX || 0;
    accumulatedDelta += dx;

    virtualX += dx;
    if (virtualX < 0) virtualX = window.innerWidth;
    if (virtualX > window.innerWidth) virtualX = 0;
    vCursor.style.left = `${virtualX}px`;

    const newVal = sValue + Math.round(accumulatedDelta / sensitivity);
    updateFn(newVal.toString());
  };

  const onMouseUp = (moveEvent) => {
    if (moveEvent.pointerId !== undefined) {
      try { moveEvent.target.releasePointerCapture(moveEvent.pointerId); } catch (e) { }
    }
    if (vCursor.parentNode) vCursor.parentNode.removeChild(vCursor);
    document.body.classList.remove('is-scrubbing');
    window.removeEventListener('pointermove', onMouseMove);
    window.removeEventListener('pointerup', onMouseUp);
  };

  window.addEventListener('pointermove', onMouseMove);
  window.addEventListener('pointerup', onMouseUp);
};

export const ColorField = ({ label, color, opacity, onColorChange, onOpacityChange, onPickerToggle, baseAttr, selectedElementProps }) => (
  <div className="flex items-center gap-[0.4vw] py-[0.4vw]">
    <span className="text-[0.85vw] font-semibold text-gray-700 min-w-[3vw] whitespace-nowrap">{label} :</span>
    <div
      className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center"
    >
      <div
        onClick={onPickerToggle}
        className="w-full h-full border border-gray-200 cursor-pointer color-field-trigger transition-transform flex-shrink-0"
        style={{
          background: (color === 'none' || color === 'transparent' || color === '#' || !color)
            ? 'white'
            : (color.toString().toLowerCase().includes('url(#')
              ? (selectedElementProps && selectedElementProps[`${baseAttr}-stops`]
                ? `linear-gradient(to right, ${JSON.parse(selectedElementProps[`${baseAttr}-stops`]).map(s => s.color).join(', ')})`
                : '#ccc')
              : color)
        }}
      />
      {(color === 'none' || color === 'transparent' || color === '#' || !color) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
      )}
    </div>

    <div className="flex-grow flex items-center border border-gray-200 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white hover:border-indigo-400 transition-colors px-[0.5vw]">
      <input
        type="text"
        value={(color === 'none' || color === 'transparent' || !color) ? '#' : color?.toUpperCase()}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '' || val === '#') {
            onColorChange('none');
          } else {
            const finalVal = val.startsWith('#') ? val : '#' + val;
            onColorChange(finalVal);
          }
        }}
        className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw] font-mono tracking-tight"
        maxLength={7}
      />
      <div
        className="flex items-center gap-[0.1vw] ml-[0.5vw] cursor-ew-resize select-none px-[0.2vw] hover:bg-gray-50 rounded"
        onPointerDown={(e) => {
          const currentPct = Math.round(parseFloat(opacity !== undefined ? opacity : 1) * 100);
          handleScrubHelper(e, currentPct, (val) => {
            const num = parseInt(val);
            const clamped = Math.min(Math.max(num, 0), 100);
            onOpacityChange(clamped / 100);
          });
        }}
      >
        <span className="text-[0.75vw] font-semibold text-gray-700">
          {Math.round(parseFloat(opacity !== undefined ? opacity : 1) * 100)}
        </span>
        <span className="text-[0.75vw] font-medium text-gray-500">%</span>
      </div>
    </div>
  </div>
);

const Color = ({
  openSubSection, setOpenSubSection,
  backgroundColor: externalBackgroundColor, setBackgroundColor: setExternalBackgroundColor,
  activeColorPicker: externalActiveColorPicker, setActiveColorPicker: setExternalActiveColorPicker,
  showStrokeSettings, setShowStrokeSettings,
  isStrokeStyleOpen, setIsStrokeStyleOpen,
  dropdownPos, setDropdownPos,
  strokeSettingsPos, setStrokeSettingsPos,
  isDashPosOpen, setIsDashPosOpen,
  colorsOnPage,
  showDetailedPicker, setShowDetailedPicker,
  hideFill = false,
  standaloneMode = false,
  selectedElement = null,
  onUpdate = null,
  isText = false,
  sizingMode = 'auto-width',
  isScrollable = false,
  selectedElementProps = null,
  ...props
}) => {
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // --- Standalone Mode State ---
  const [internalBackgroundColor, setInternalBackgroundColor] = useState({
    fill: 'transparent',
    fillOpacity: 100,
    stroke: 'transparent',
    strokeOpacity: 100,
    strokeWeight: 0,
    strokeDashStyle: 'Solid',
    strokePosition: 'Center',
    strokeLinecap: 'butt'
  });
  const [internalActiveColorPicker, setInternalActiveColorPicker] = useState(null);

  const backgroundColor = standaloneMode ? internalBackgroundColor : externalBackgroundColor;
  const setBackgroundColor = standaloneMode ? setInternalBackgroundColor : setExternalBackgroundColor;

  const activeColorPicker = standaloneMode ? internalActiveColorPicker : externalActiveColorPicker;
  const setActiveColorPicker = standaloneMode ? setInternalActiveColorPicker : setExternalActiveColorPicker;

  // Sync state synchronously during render when selectedElement changes in standalone mode
  const prevElementRef = useRef(null);
  const isSelectedElementChanged = standaloneMode && selectedElement && selectedElement !== prevElementRef.current;

  if (isSelectedElementChanged) {
    prevElementRef.current = selectedElement;
    const el = selectedElement;

    // Parse Fill
    let fill = el.getAttribute('data-fill-color') || el.getAttribute('fill') || 'transparent';
    const fillOpacity = parseFloat(el.getAttribute('data-fill-opacity') || el.getAttribute('fill-opacity') || '1') * 100;

    // Parse Stroke
    const stroke = el.getAttribute('data-stroke-color') || el.getAttribute('stroke') || 'transparent';
    const strokeOpacity = parseFloat(el.getAttribute('data-stroke-opacity') || el.getAttribute('stroke-opacity') || '1') * 100;
    const strokeWeight = parseFloat(el.getAttribute('data-stroke-width') || el.getAttribute('stroke-width') || '0');

    const strokeArray = el.getAttribute('data-stroke-dasharray') || el.getAttribute('stroke-dasharray') || 'none';
    const dashStyle = strokeArray === 'none' ? 'Solid' : 'Dashed';

    let dashLen = 10, dashGap = 10;
    if (strokeArray !== 'none' && strokeArray !== '') {
      const parts = strokeArray.split(',');
      const parsedLen = parseInt(parts[0]);
      dashLen = isNaN(parsedLen) ? 10 : parsedLen;
      const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
      dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
    }

    const syncedBg = {
      fill,
      fillOpacity,
      stroke,
      strokeOpacity,
      strokeWeight,
      strokeDashStyle: dashStyle,
      strokeDasharrayValue: strokeArray !== 'none' ? strokeArray : undefined,
      strokeDashLength: dashLen,
      strokeDashGap: dashGap,
      strokePosition: el.getAttribute('data-stroke-position') || 'Center',
      strokeLinecap: el.getAttribute('stroke-linecap') || 'butt'
    };

    setInternalBackgroundColor(syncedBg);
  }

  // Backup sync for DOM mutation updates on the same element
  useEffect(() => {
    if (!standaloneMode || !selectedElement) return;
    const el = selectedElement;

    let fill = el.getAttribute('data-fill-color') || el.getAttribute('fill') || 'transparent';
    const fillOpacity = parseFloat(el.getAttribute('data-fill-opacity') || el.getAttribute('fill-opacity') || '1') * 100;
    const stroke = el.getAttribute('data-stroke-color') || el.getAttribute('stroke') || 'transparent';
    const strokeOpacity = parseFloat(el.getAttribute('data-stroke-opacity') || el.getAttribute('stroke-opacity') || '1') * 100;
    const strokeWeight = parseFloat(el.getAttribute('data-stroke-width') || el.getAttribute('stroke-width') || '0');

    const strokeArray = el.getAttribute('data-stroke-dasharray') || el.getAttribute('stroke-dasharray') || 'none';
    const dashStyle = strokeArray === 'none' ? 'Solid' : 'Dashed';

    let dashLen = 10, dashGap = 10;
    if (strokeArray !== 'none' && strokeArray !== '') {
      const parts = strokeArray.split(',');
      const parsedLen = parseInt(parts[0]);
      dashLen = isNaN(parsedLen) ? 10 : parsedLen;
      const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
      dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
    }

    setInternalBackgroundColor(prev => {
      if (
        prev.fill === fill &&
        prev.fillOpacity === fillOpacity &&
        prev.stroke === stroke &&
        prev.strokeOpacity === strokeOpacity &&
        prev.strokeWeight === strokeWeight &&
        prev.strokeDashStyle === dashStyle &&
        prev.strokeDasharrayValue === strokeArray
      ) {
        return prev;
      }
      return {
        fill,
        fillOpacity,
        stroke,
        strokeOpacity,
        strokeWeight,
        strokeDashStyle: dashStyle,
        strokeDasharrayValue: strokeArray !== 'none' ? strokeArray : undefined,
        strokeDashLength: dashLen,
        strokeDashGap: dashGap,
        strokePosition: el.getAttribute('data-stroke-position') || 'Center',
        strokeLinecap: el.getAttribute('stroke-linecap') || 'butt',
        bgStrokeDasharray: strokeArray !== 'none' ? strokeArray : undefined,
      };
    });
  }, [selectedElement, standaloneMode]);


  // Apply visual updates directly to DOM in standalone mode
  useEffect(() => {
    if (!standaloneMode || !selectedElement) return;
    // Skip writing to DOM if selectedElement just changed in this render pass
    if (isSelectedElementChanged) return;

    const applyColorsToDOM = () => {
      const el = selectedElement;
      const isSvgEl = el.namespaceURI === "http://www.w3.org/2000/svg";
      const isImage = el.tagName?.toLowerCase() === 'image' || el.tagName?.toLowerCase() === 'g';

      // Apply Fill
      if (backgroundColor.fill !== 'transparent' && backgroundColor.fill !== 'none') {
        el.setAttribute('data-fill-color', backgroundColor.fill);
        el.setAttribute('data-fill-opacity', (backgroundColor.fillOpacity / 100).toString());

        const isGradient = backgroundColor.fill.includes('gradient');

        if (!isImage) {
          if (!isGradient) el.setAttribute('fill', backgroundColor.fill);
          el.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());
          el.setAttribute('opacity', (backgroundColor.fillOpacity / 100).toString());
          el.style.setProperty('opacity', (backgroundColor.fillOpacity / 100).toString(), 'important');
          if (el.tagName?.toLowerCase() === 'foreignobject' && el.firstElementChild) {
            el.firstElementChild.style.setProperty('opacity', (backgroundColor.fillOpacity / 100).toString(), 'important');
          }
        } else {
          // --- Fast path: directly patch existing SVG gradient stops ---
          // If a gradient fill layer already exists with a url(#...) fill, we update
          // the <stop> elements directly in the SVG defs. This completely bypasses the
          // MutationObserver -> React re-render cycle for real-time color drag updates.
          let fillFastPathDone = false;
          let fillLayer = el.querySelector('.image-fill-layer') || el.querySelector('.video-fill-layer') || el.querySelector('.gif-fill-layer');
          if (isGradient && fillLayer) {
            const existingFill = fillLayer.getAttribute('fill') || '';
            if (existingFill.startsWith('url(#')) {
              const gradId = existingFill.match(/url\(#([^)]+)\)/)?.[1];
              const svgRoot = el.closest('svg');
              const gradEl = gradId && svgRoot ? svgRoot.querySelector(`#${gradId}`) : null;
              if (gradEl) {
                const parsed = parseGradient(backgroundColor.fill);
                const existingStops = Array.from(gradEl.querySelectorAll('stop'));

                const isTargetLinear = parsed?.type?.toLowerCase() === 'linear';
                const isCurrentLinear = gradEl.tagName.toLowerCase() === 'lineargradient';

                if (parsed && isTargetLinear === isCurrentLinear && parsed.stops.length > 0 && parsed.stops.length === existingStops.length) {
                  // Same stop count and same type — just update colors and angle/radius in-place (fastest path, no React cycle)
                  parsed.stops.forEach((ns, i) => {
                    existingStops[i].setAttribute('stop-color', ns.color);
                    existingStops[i].setAttribute('stop-opacity', (ns.opacity !== undefined ? ns.opacity / 100 : 1).toString());
                  });

                  // Update angle/radius
                  if (parsed.type.toLowerCase() === 'linear') {
                    const angleRad = ((parsed.angle || 0) * Math.PI) / 180;
                    const dx = Math.sin(angleRad) * 50;
                    const dy = -Math.cos(angleRad) * 50;
                    gradEl.setAttribute('x1', Math.round(50 - dx) + '%');
                    gradEl.setAttribute('y1', Math.round(50 - dy) + '%');
                    gradEl.setAttribute('x2', Math.round(50 + dx) + '%');
                    gradEl.setAttribute('y2', Math.round(50 + dy) + '%');
                  } else {
                    const radius = parsed.radius || 50;
                    gradEl.setAttribute('r', radius + '%');
                    gradEl.setAttribute('cx', '50%');
                    gradEl.setAttribute('cy', '50%');
                  }

                  fillLayer.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());

                  // Only skip onUpdate and data-fill-color during active drag to prevent lag.
                  // If it's a preset click or drag has finished, we must sync state!
                  if (!isDraggingRef.current) {
                    el.setAttribute('data-fill-color', backgroundColor.fill);
                  }

                  fillFastPathDone = true;
                }
              }
            }
          }
          // Fallback / slow path: non-gradient fill or first-time gradient application
          if (!fillFastPathDone) {
            if (fillLayer) {
              if (!isGradient) fillLayer.setAttribute('fill', backgroundColor.fill);
              fillLayer.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());
            } else if (isImage) {
              // Basic fallback if layer missing
              fillLayer = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              fillLayer.classList.add('image-fill-layer');
              fillLayer.style.pointerEvents = 'none';
              if (!isGradient) fillLayer.setAttribute('fill', backgroundColor.fill);
              fillLayer.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());
              // Insert at beginning
              el.insertBefore(fillLayer, el.firstChild);
            }
          }
        }
      } else {
        el.removeAttribute('data-fill-color');
        el.removeAttribute('data-fill-opacity');
        if (!isImage) {
          el.removeAttribute('fill');
          el.removeAttribute('fill-opacity');
        }
      }

      // Apply Stroke
      if (backgroundColor.stroke === 'transparent' || backgroundColor.stroke === 'none') {
        el.removeAttribute('data-stroke-color');
        el.removeAttribute('data-stroke-width');
        if (!isImage) {
          el.removeAttribute('stroke');
          el.removeAttribute('stroke-width');
        }
      } else {
        el.setAttribute('data-stroke-color', backgroundColor.stroke);
        el.setAttribute('data-stroke-width', backgroundColor.strokeWeight.toString());
        el.setAttribute('data-stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());
        el.setAttribute('stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());

        const isStrokeGradient = backgroundColor.stroke.includes('gradient');

        const dashArray = backgroundColor.strokeDashStyle === 'Dashed'
          ? (backgroundColor.strokeDasharrayValue || `${backgroundColor.strokeDashLength ?? 10},${backgroundColor.strokeDashGap ?? 10}`)
          : 'none';

        el.setAttribute('data-stroke-dasharray', dashArray);
        el.setAttribute('data-stroke-position', backgroundColor.strokePosition || 'Center');
        el.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
        el.setAttribute('data-stroke-type', backgroundColor.strokeType || 'solid');

        if (backgroundColor.strokeType === 'gradient' && backgroundColor.strokeStops) {
          el.setAttribute('data-stroke-gradient-type', backgroundColor.strokeGradientType || 'linear');
          el.setAttribute('data-stroke-stops', backgroundColor.strokeStops);
          el.setAttribute('data-stroke-angle', (backgroundColor.strokeAngle || 0).toString());
          el.setAttribute('data-stroke-radius', (backgroundColor.strokeRadius || 100).toString());
        } else {
          el.removeAttribute('data-stroke-gradient-type');
          el.removeAttribute('data-stroke-stops');
          el.removeAttribute('data-stroke-angle');
          el.removeAttribute('data-stroke-radius');
        }

        if (!isImage) {
          const pos = backgroundColor.strokePosition || 'Center';
          const sw = backgroundColor.strokeWeight || 0;
          const isEligibleShape = ['rect', 'ellipse', 'path', 'circle', 'polygon'].includes(el.tagName?.toLowerCase());

          if (isEligibleShape && pos !== 'Center' && sw > 0) {
            el.setAttribute('stroke', 'none');
            el.removeAttribute('stroke-width');
            el.removeAttribute('stroke-dasharray');

            let overlay = el.parentNode?.querySelector(`.svg-shape-stroke-overlay[data-target="${el.id}"]`);
            if (!overlay) {
              overlay = document.createElementNS('http://www.w3.org/2000/svg', el.tagName);
              overlay.classList.add('svg-shape-stroke-overlay');
              overlay.setAttribute('data-target', el.id);
              overlay.style.pointerEvents = 'none';

              if (pos === 'Inside') {
                el.parentNode.insertBefore(overlay, el.nextSibling);
              } else {
                el.parentNode.insertBefore(overlay, el);
              }
            } else {
              if (pos === 'Inside' && overlay.previousSibling !== el) {
                el.parentNode.insertBefore(overlay, el.nextSibling);
              } else if (pos === 'Outside' && overlay.nextSibling !== el) {
                el.parentNode.insertBefore(overlay, el);
              }
            }

            const svg = el.ownerSVGElement || el.parentNode;
            let defs = svg.querySelector('defs');
            if (!defs) {
              defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
              svg.insertBefore(defs, svg.firstChild);
            }

            if (pos === 'Inside') {
              let clip = defs.querySelector(`clipPath[id="clip-shape-${el.id}"]`);
              if (!clip) {
                clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                clip.id = `clip-shape-${el.id}`;
                const clipShape = document.createElementNS('http://www.w3.org/2000/svg', el.tagName);
                clip.appendChild(clipShape);
                defs.appendChild(clip);
              }
              overlay.setAttribute('clip-path', `url(#clip-shape-${el.id})`);
              overlay.removeAttribute('mask');
            } else {
              let mask = defs.querySelector(`mask[id="mask-shape-${el.id}"]`);
              if (!mask) {
                mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
                mask.id = `mask-shape-${el.id}`;
                const maskBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                maskBg.setAttribute('x', '-500%');
                maskBg.setAttribute('y', '-500%');
                maskBg.setAttribute('width', '1000%');
                maskBg.setAttribute('height', '1000%');
                maskBg.setAttribute('fill', 'white');
                const maskShape = document.createElementNS('http://www.w3.org/2000/svg', el.tagName);
                maskShape.setAttribute('fill', 'black');
                mask.appendChild(maskBg);
                mask.appendChild(maskShape);
                defs.appendChild(mask);
              }
              overlay.setAttribute('mask', `url(#mask-shape-${el.id})`);
              overlay.removeAttribute('clip-path');
            }

            overlay.setAttribute('stroke', backgroundColor.stroke);
            overlay.setAttribute('stroke-width', (sw * 2).toString());
            overlay.setAttribute('fill', 'none');
            overlay.setAttribute('stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());
            if (dashArray !== 'none') overlay.setAttribute('stroke-dasharray', dashArray);
            else overlay.removeAttribute('stroke-dasharray');
            overlay.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
            overlay.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');
            overlay.setAttribute('data-stroke-type', backgroundColor.strokeType || 'solid');

            const syncGeometry = () => {
              if (!overlay.isConnected) return;
              const attrsToSync = ['x', 'y', 'width', 'height', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'transform', 'points'];
              const refShape = pos === 'Inside' ? defs.querySelector(`clipPath[id="clip-shape-${el.id}"]`)?.firstChild : defs.querySelector(`mask[id="mask-shape-${el.id}"]`)?.lastChild;

              attrsToSync.forEach(attr => {
                const val = el.getAttribute(attr);
                if (val !== null) {
                  overlay.setAttribute(attr, val);
                  if (refShape && attr !== 'transform') refShape.setAttribute(attr, val);
                } else {
                  overlay.removeAttribute(attr);
                  if (refShape) refShape.removeAttribute(attr);
                }
              });
              overlay.style.transform = el.style.transform;
              overlay.style.translate = el.style.translate;
              overlay.style.scale = el.style.scale;
              overlay.style.rotate = el.style.rotate;
            };

            syncGeometry();

            if (!el._shapeStrokeObserver) {
              el._shapeStrokeObserver = new MutationObserver(syncGeometry);
              el._shapeStrokeObserver.observe(el, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'transform', 'style'] });
            }

          } else {
            if (!isStrokeGradient) {
              el.setAttribute('stroke', backgroundColor.stroke);
            }
            el.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());
            if (dashArray !== 'none') {
              el.setAttribute('stroke-dasharray', dashArray);
            } else {
              el.setAttribute('stroke-dasharray', 'none');
            }

            const overlay = el.parentNode?.querySelector(`.svg-shape-stroke-overlay[data-target="${el.id}"]`);
            if (overlay) overlay.remove();
            const defs = el.ownerSVGElement?.querySelector('defs');
            if (defs) {
              defs.querySelector(`clipPath[id="clip-shape-${el.id}"]`)?.remove();
              defs.querySelector(`mask[id="mask-shape-${el.id}"]`)?.remove();
            }
          }
        } else {
          let strokeLayer = el.querySelector('.svg-image-stroke-overlay') || el.querySelector('.video-stroke-overlay') || el.querySelector('.svg-gif-stroke-overlay');
          if (strokeLayer) {
            if (!isStrokeGradient) {
              strokeLayer.setAttribute('stroke', backgroundColor.stroke);
            }
            strokeLayer.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());
            if (dashArray !== 'none') {
              strokeLayer.setAttribute('stroke-dasharray', dashArray);
            } else {
              strokeLayer.removeAttribute('stroke-dasharray');
            }
          }
        }
      }

      if (onUpdate) onUpdate({ shouldRefresh: true });
    };

    // For gradient fills, apply immediately (no debounce) so dragging the color picker
    // feels instant. For solid color / stroke-only changes, a rAF is enough to batch
    // multiple rapid fire events within the same frame without visible lag.
    const isGradientFill = backgroundColor.fill && backgroundColor.fill.includes('gradient');
    if (isGradientFill) {
      applyColorsToDOM();
      return;
    }

    let rafId;
    const raf = () => { rafId = requestAnimationFrame(applyColorsToDOM); };
    raf();
    return () => cancelAnimationFrame(rafId);
  }, [backgroundColor, standaloneMode, selectedElement]);


  useEffect(() => {
    if (openSubSection === 'color' && containerRef.current) {
      setTimeout(() => {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 350);
    }
  }, [openSubSection]);
  const pseudoProps = {
    fill: backgroundColor?.fill || '#000000',
    opacity: (backgroundColor?.fillOpacity !== undefined && backgroundColor?.fillOpacity !== null ? backgroundColor.fillOpacity : 100) / 100,
    stroke: backgroundColor?.stroke || 'none',
    'stroke-opacity': (backgroundColor?.strokeOpacity !== undefined && backgroundColor?.strokeOpacity !== null ? backgroundColor.strokeOpacity : 100) / 100,
    'fill-type': backgroundColor?.fillType || 'solid',
    'fill-gradient-type': backgroundColor?.fillGradientType || 'linear',
    'fill-stops': backgroundColor?.fillStops,
    'fill-angle': backgroundColor?.fillAngle || 0,
    'fill-radius': backgroundColor?.fillRadius || 100,
    'stroke-type': backgroundColor?.strokeType || 'solid',
    'stroke-gradient-type': backgroundColor?.strokeGradientType || 'linear',
    'stroke-stops': backgroundColor?.strokeStops,
    'stroke-angle': backgroundColor?.strokeAngle || 0,
    'stroke-radius': backgroundColor?.strokeRadius || 100,
    'stroke-width': backgroundColor?.strokeWeight || 0,
    strokeWidth: backgroundColor?.strokeWeight || 0,
    'stroke-dasharray': backgroundColor?.strokeDashStyle === 'Dashed' ? (backgroundColor?.strokeDasharrayValue || `${backgroundColor?.strokeDashLength ?? 10},${backgroundColor?.strokeDashGap ?? 10}`) : 'none',
    strokeDasharray: backgroundColor?.strokeDashStyle === 'Dashed' ? (backgroundColor?.strokeDasharrayValue || `${backgroundColor?.strokeDashLength ?? 10},${backgroundColor?.strokeDashGap ?? 10}`) : 'none',
    'stroke-linecap': backgroundColor?.strokeLinecap || 'butt',
    'data-stroke-position': backgroundColor?.strokePosition || 'Center',
  };

  const handleUpdate = (page, layer, attr, value) => {
    if (attr === 'fill' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fill: value }));
    if (attr === 'fill-type' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillType: value }));
    if (attr === 'fill-gradient-type' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillGradientType: value }));
    if (attr === 'fill-stops' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillStops: value }));
    if (attr === 'fill-angle' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillAngle: parseFloat(value) }));
    if (attr === 'fill-radius' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillRadius: parseFloat(value) }));
    if (attr === 'opacity' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillOpacity: parseFloat(value) * 100 }));
    if (attr === 'stroke' && setBackgroundColor) setBackgroundColor(p => ({ ...p, stroke: value, strokeWeight: (p.strokeWeight === 0 && value !== 'transparent' && value !== 'none') ? 1 : p.strokeWeight }));
    if (attr === 'stroke-type' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeType: value }));
    if (attr === 'stroke-gradient-type' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeGradientType: value }));
    if (attr === 'stroke-stops' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeStops: value }));
    if (attr === 'stroke-angle' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeAngle: parseFloat(value) }));
    if (attr === 'stroke-radius' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeRadius: parseFloat(value) }));
    if (attr === 'stroke-opacity' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeOpacity: parseFloat(value) * 100 }));
    if (attr === 'stroke-width' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeWeight: parseFloat(value) }));
    if (attr === 'stroke-dasharray' && setBackgroundColor) {
      if (value === 'none') {
        setBackgroundColor(p => ({ ...p, strokeDashStyle: 'Solid' }));
      } else {
        const parts = value.split(',');
        const parsedLen = parseInt(parts[0]);
        const dashLen = isNaN(parsedLen) ? 10 : parsedLen;
        const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
        const dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
        setBackgroundColor(p => ({
          ...p,
          strokeDashStyle: 'Dashed',
          strokeDasharrayValue: value,
          strokeDashLength: dashLen,
          strokeDashGap: dashGap
        }));
      }
    }
    if (attr === 'data-stroke-position' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokePosition: value }));
    if (attr === 'stroke-linecap' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeLinecap: value }));
    if (attr === 'data-scrollbar-color' && setBackgroundColor) setBackgroundColor(p => ({ ...p, scrollBarColor: value }));
    if (attr === 'data-bg-fill' && setBackgroundColor) setBackgroundColor(p => ({ ...p, bgFill: value }));
    if (attr === 'data-bg-fill-opacity' && setBackgroundColor) setBackgroundColor(p => ({ ...p, bgFillOpacity: parseFloat(value) * 100 }));
    if (attr === 'data-bg-stroke' && setBackgroundColor) {
      setBackgroundColor(p => ({
        ...p,
        bgStroke: value,
        bgStrokeWidth: (p.bgStrokeWidth === 0 && value !== 'transparent' && value !== 'none' && value !== '#') ? 1 : p.bgStrokeWidth
      }));
    }
    if (attr === 'data-bg-stroke-opacity' && setBackgroundColor) setBackgroundColor(p => ({ ...p, bgStrokeOpacity: parseFloat(value) * 100 }));
    if (attr === 'data-bg-stroke-width' && setBackgroundColor) setBackgroundColor(p => ({ ...p, bgStrokeWidth: parseFloat(value) }));
    if (attr === 'data-bg-stroke-position' && setBackgroundColor) setBackgroundColor(p => ({ ...p, bgStrokePosition: value }));
    if (attr === 'data-bg-stroke-dasharray' && setBackgroundColor) {
      if (value === 'none') {
        setBackgroundColor(p => ({ ...p, bgStrokeDashStyle: 'Solid', bgStrokeDasharray: value, strokeDashStyle: 'Solid', strokeDasharrayValue: value }));
      } else {
        const parts = value.split(',');
        const parsedLen = parseInt(parts[0]);
        const dashLen = isNaN(parsedLen) ? 10 : parsedLen;
        const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
        const dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
        setBackgroundColor(p => ({
          ...p,
          bgStrokeDashStyle: 'Dashed',
          bgStrokeDasharray: value,
          bgStrokeDashLength: dashLen,
          bgStrokeDashGap: dashGap,
          strokeDashStyle: 'Dashed',
          strokeDasharrayValue: value,
          strokeDashLength: dashLen,
          strokeDashGap: dashGap
        }));
      }
    }
  };

  const updateAttr = (attribute, value) => {
    handleUpdate(undefined, undefined, attribute, value);
  };

  const handleScrub = (e, initialVal, updateFn, sensitivity = 5) => {
    handleScrubHelper(e, initialVal, updateFn, sensitivity);
  };

  const defaultStops = [
    { color: '#63D0CD', offset: 0, opacity: 1 },
    { color: '#4B3EFE', offset: 100, opacity: 1 }
  ];

  return (
    <div ref={containerRef} className="flex flex-col gap-[0.4vw] font-sans">
      {isText && (isScrollable === true || selectedElementProps?.['data-scrollable'] === 'true') && (sizingMode === 'fixed' || selectedElementProps?.['data-sizing-mode'] === 'fixed') && (
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
          <div
            onClick={() => setOpenSubSection(openSubSection === 'color' || openSubSection === 'bgColor' ? null : 'bgColor')}
            className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${(openSubSection === 'color' || openSubSection === 'bgColor') ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
          >
            <div className="flex items-center gap-[0.5vw]">
              <span className={`font-semibold text-[0.85vw] ${(openSubSection === 'color' || openSubSection === 'bgColor') ? 'text-gray-900' : 'text-gray-500'}`}>BG Color</span>
            </div>
            <ChevronUp size="1vw" className={`transition-transform duration-200 ${(openSubSection === 'color' || openSubSection === 'bgColor') ? 'text-gray-900' : 'rotate-180 text-gray-500'}`} />
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${(openSubSection === 'color' || openSubSection === 'bgColor') ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="p-[1vw] pt-[0.75vw] flex flex-col gap-[0.75vw]">
                <ColorField
                  label="Scroll Bar"
                  color={backgroundColor?.scrollBarColor || '#000000'}
                  opacity={(backgroundColor?.scrollBarOpacity !== undefined ? backgroundColor.scrollBarOpacity : 100) / 100}
                  onColorChange={(val) => {
                    if (setBackgroundColor) setBackgroundColor(p => ({ ...p, scrollBarColor: val }));
                    if (onUpdate) onUpdate({ shouldRefresh: true });
                  }}
                  onOpacityChange={(val) => {
                    if (setBackgroundColor) setBackgroundColor(p => ({ ...p, scrollBarOpacity: parseFloat(val) * 100 }));
                    if (onUpdate) onUpdate({ shouldRefresh: true });
                  }}
                  onPickerToggle={() => setActiveColorPicker(activeColorPicker === 'scrollbar' ? null : 'scrollbar')}
                  baseAttr="data-scrollbar-color"
                  selectedElementProps={selectedElementProps}
                />

                <div className="flex items-center gap-[0.5vw] mt-[1vw] mb-[0.5vw]">
                  <span className="font-semibold text-[0.75vw] text-gray-900">Background Fill Color</span>
                </div>
                <div className="flex items-center justify-between gap-[0.5vw]">
                  {/* Swatch */}
                  <div
                    className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer"
                    onClick={() => setActiveColorPicker(activeColorPicker === 'bg-fill' ? null : 'bg-fill')}
                  >
                    <div
                      className="w-full h-full border border-gray-200"
                      style={{
                        background: (backgroundColor?.bgFill === 'none' || backgroundColor?.bgFill === 'transparent' || backgroundColor?.bgFill === '#' || !backgroundColor?.bgFill)
                          ? 'white'
                          : (backgroundColor?.bgFill.toString().toLowerCase().includes('url(#')
                            ? (selectedElementProps && selectedElementProps[`data-bg-fill-stops`]
                              ? `linear-gradient(to right, ${JSON.parse(selectedElementProps[`data-bg-fill-stops`]).map(s => s.color).join(', ')})`
                              : '#ccc')
                            : backgroundColor?.bgFill)
                      }}
                    />
                    {(backgroundColor?.bgFill === 'none' || backgroundColor?.bgFill === 'transparent' || backgroundColor?.bgFill === '#' || !backgroundColor?.bgFill) && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
                    )}
                  </div>

                  {/* Input box */}
                  <div className="flex-grow flex items-center border-[0.1vw] border-gray-200 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white hover:border-indigo-400 transition-colors px-[0.5vw]">
                    <input
                      type="text"
                      value={(backgroundColor?.bgFill === 'none' || backgroundColor?.bgFill === 'transparent' || !backgroundColor?.bgFill) ? '#' : backgroundColor?.bgFill?.toUpperCase()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || val === '#') {
                          updateAttr('data-bg-fill', 'none');
                        } else {
                          const finalVal = val.startsWith('#') ? val : '#' + val;
                          updateAttr('data-bg-fill', finalVal);
                        }
                      }}
                      className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw] tracking-tight"
                      maxLength={7}
                    />
                    <div
                      className="flex items-center gap-[0.1vw] ml-[0.5vw] cursor-ew-resize select-none px-[0.2vw] hover:bg-gray-50 rounded"
                      onPointerDown={(e) => {
                        const currentPct = Math.round(parseFloat(selectedElementProps?.['data-bg-fill-opacity'] !== undefined ? selectedElementProps?.['data-bg-fill-opacity'] : 1) * 100);
                        handleScrubHelper(e, currentPct, (val) => {
                          const num = parseInt(val);
                          const clamped = Math.min(Math.max(num, 0), 100);
                          updateAttr('data-bg-fill-opacity', (clamped / 100).toString());
                        });
                      }}
                    >
                      <span className="text-[0.75vw] font-medium text-gray-600">
                        {Math.round(parseFloat(selectedElementProps?.['data-bg-fill-opacity'] !== undefined ? selectedElementProps?.['data-bg-fill-opacity'] : 1) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* HEX Dropdown */}
                  <div className="h-[2vw] flex items-center justify-between px-[0.5vw] border border-gray-200 rounded-[0.5vw] bg-white cursor-pointer hover:bg-gray-50 min-w-[3.5vw]">
                    <span className="text-[0.7vw] text-gray-600 font-medium">HEX</span>
                    <ChevronDown size="0.8vw" className="text-gray-400 ml-[0.2vw]" />
                  </div>
                </div>

                <div className="w-full h-[1px] bg-gray-200 my-[1vw]"></div>
                <div className="flex items-center gap-[0.5vw] mb-[0.5vw]">
                  <span className="font-semibold text-[0.75vw] text-gray-900">Background Stroke Color</span>
                </div>
                <div className="flex items-center justify-between gap-[0.5vw]">
                  {/* Swatch */}
                  <div
                    className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer"
                    onClick={() => setActiveColorPicker(activeColorPicker === 'bg-stroke' ? null : 'bg-stroke')}
                  >
                    <div
                      className="w-full h-full border border-gray-200"
                      style={{
                        background: (backgroundColor?.bgStroke === 'none' || backgroundColor?.bgStroke === 'transparent' || backgroundColor?.bgStroke === '#' || !backgroundColor?.bgStroke)
                          ? 'white'
                          : (backgroundColor?.bgStroke.toString().toLowerCase().includes('url(#')
                            ? (selectedElementProps && selectedElementProps[`data-bg-stroke-stops`]
                              ? `linear-gradient(to right, ${JSON.parse(selectedElementProps[`data-bg-stroke-stops`]).map(s => s.color).join(', ')})`
                              : '#ccc')
                            : backgroundColor?.bgStroke)
                      }}
                    />
                    {(backgroundColor?.bgStroke === 'none' || backgroundColor?.bgStroke === 'transparent' || backgroundColor?.bgStroke === '#' || !backgroundColor?.bgStroke) && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
                    )}
                  </div>

                  {/* Input box */}
                  <div className="flex-grow flex items-center border-[0.1vw] border-gray-200 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white hover:border-indigo-400 transition-colors px-[0.5vw]">
                    <input
                      type="text"
                      value={(backgroundColor?.bgStroke === 'none' || backgroundColor?.bgStroke === 'transparent' || !backgroundColor?.bgStroke) ? '#' : backgroundColor?.bgStroke?.toUpperCase()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || val === '#') {
                          updateAttr('data-bg-stroke', 'none');
                        } else {
                          const finalVal = val.startsWith('#') ? val : '#' + val;
                          updateAttr('data-bg-stroke', finalVal);
                        }
                      }}
                      className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw] tracking-tight"
                      maxLength={7}
                    />
                    <div
                      className="flex items-center gap-[0.1vw] ml-[0.5vw] cursor-ew-resize select-none px-[0.2vw] hover:bg-gray-50 rounded"
                      onPointerDown={(e) => {
                        const currentPct = Math.round(parseFloat(selectedElementProps?.['data-bg-stroke-opacity'] !== undefined ? selectedElementProps?.['data-bg-stroke-opacity'] : 1) * 100);
                        handleScrubHelper(e, currentPct, (val) => {
                          const num = parseInt(val);
                          const clamped = Math.min(Math.max(num, 0), 100);
                          updateAttr('data-bg-stroke-opacity', (clamped / 100).toString());
                        });
                      }}
                    >
                      <span className="text-[0.75vw] font-medium text-gray-600">
                        {Math.round(parseFloat(selectedElementProps?.['data-bg-stroke-opacity'] !== undefined ? selectedElementProps?.['data-bg-stroke-opacity'] : 1) * 100)}%
                      </span>
                    </div>
                  </div>

                </div>                {/* Stroke Properties */}
                <div className={`flex flex-col gap-[0.75vw] mt-[0.75vw] ${(!backgroundColor?.bgStroke || backgroundColor?.bgStroke === 'none' || backgroundColor?.bgStroke === '#' || backgroundColor?.bgStroke === 'transparent') ? 'opacity-50' : ''}`}>
                  {/* Row 2: Alignment and Stroke Width */}
                  <div className="flex items-center gap-[1vw]">
                    {/* Alignment */}
                    <div className="flex-1 flex flex-col gap-[0.3vw]">
                      <span className="text-[0.7vw] text-gray-500 font-medium">Alignment</span>
                      <div className="relative">
                        <div
                          className={`h-[2vw] px-[0.5vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-between bg-white ${isText ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
                          onClick={() => !isText && setIsDashPosOpen(!isDashPosOpen)}
                        >
                          <span className="text-[0.75vw] font-medium text-gray-700 capitalize">{backgroundColor?.bgStrokePosition || 'Center'}</span>
                          <ChevronDown size="0.8vw" className="text-gray-400" />
                        </div>
                        {isDashPosOpen && (
                          <>
                            <div className="fixed inset-0 z-[40]" onClick={(e) => { e.stopPropagation(); setIsDashPosOpen(false); }} />
                            <div className="absolute top-[110%] left-0 right-0 bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-50 py-1 overflow-hidden">
                              {['Inside', 'Center', 'Outside'].map(pos => (
                                <div
                                  key={pos}
                                  onClick={() => {
                                    if (setBackgroundColor) setBackgroundColor(p => ({ ...p, bgStrokePosition: pos }));
                                    setIsDashPosOpen(false);
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
                            const current = parseFloat(backgroundColor?.bgStrokeWidth !== undefined ? backgroundColor.bgStrokeWidth : 1);
                            if (setBackgroundColor) setBackgroundColor(p => ({ ...p, bgStrokeWidth: Math.max(0, current - 1) }));
                          }}
                        >
                          <span className="text-[1vw] leading-none mb-[0.1vw]">-</span>
                        </button>
                        <div
                          className="flex-grow h-full bg-white border border-gray-200 rounded-[0.5vw] flex items-center cursor-ew-resize"
                          onPointerDown={(e) => {
                            const current = parseFloat(backgroundColor?.bgStrokeWidth !== undefined ? backgroundColor.bgStrokeWidth : 1);
                            handleScrubHelper(e, current, (val) => {
                              const num = parseInt(val);
                              const clamped = Math.max(0, num);
                              if (setBackgroundColor) setBackgroundColor(p => ({ ...p, bgStrokeWidth: clamped }));
                            });
                          }}
                        >
                          <input
                            type="text"
                            value={backgroundColor?.bgStrokeWidth !== undefined ? backgroundColor.bgStrokeWidth : 1}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (setBackgroundColor) setBackgroundColor(p => ({ ...p, bgStrokeWidth: Math.max(0, val) }));
                            }}
                            className="w-full text-center text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent"
                          />
                        </div>
                        <button
                          className="w-[2vw] h-full flex items-center justify-center bg-gray-100 rounded-[0.3vw] text-gray-600 hover:bg-gray-200 transition-colors"
                          onClick={() => {
                            const current = parseFloat(backgroundColor?.bgStrokeWidth !== undefined ? backgroundColor.bgStrokeWidth : 1);
                            if (setBackgroundColor) setBackgroundColor(p => ({ ...p, bgStrokeWidth: current + 1 }));
                          }}
                        >
                          <span className="text-[1vw] leading-none mb-[0.1vw]">+</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Line style and Dash Property */}
                  {!isText && (
                  <div className="flex items-center gap-[1vw]">
                    {/* Line style */}
                    <div className="flex-1 flex flex-col gap-[0.3vw]">
                      <span className="text-[0.7vw] text-gray-500 font-medium">Line style</span>
                      <div className="flex items-center justify-between gap-[0.3vw] h-[2vw]">
                        {/* Solid */}
                        <button
                          onClick={() => updateAttr('data-bg-stroke-dasharray', 'none')}
                          className={`flex-1 h-full flex items-center justify-center rounded-[0.5vw] border transition-colors ${(!selectedElementProps?.['data-bg-stroke-dasharray'] || selectedElementProps?.['data-bg-stroke-dasharray'] === 'none') ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200/60 hover:bg-gray-100'}`}
                        >
                          <div className={`w-[1.2vw] h-[0.1vw] rounded-full ${(!selectedElementProps?.['data-bg-stroke-dasharray'] || selectedElementProps?.['data-bg-stroke-dasharray'] === 'none') ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                        </button>
                        {/* Dashed (Short) */}
                        <button
                          onClick={() => updateAttr('data-bg-stroke-dasharray', '4,4')}
                          className={`flex-1 h-full flex items-center justify-center rounded-[0.5vw] border transition-colors ${(selectedElementProps?.['data-bg-stroke-dasharray'] && selectedElementProps?.['data-bg-stroke-dasharray'] !== 'none' && selectedElementProps?.['data-bg-stroke-dasharray'].split(',').length <= 2) ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200/60 hover:bg-gray-100'}`}
                        >
                          <div className="flex gap-[0.15vw]">
                            <div className={`w-[0.2vw] h-[0.1vw] rounded-full ${(selectedElementProps?.['data-bg-stroke-dasharray'] && selectedElementProps?.['data-bg-stroke-dasharray'] !== 'none' && selectedElementProps?.['data-bg-stroke-dasharray'].split(',').length <= 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                            <div className={`w-[0.2vw] h-[0.1vw] rounded-full ${(selectedElementProps?.['data-bg-stroke-dasharray'] && selectedElementProps?.['data-bg-stroke-dasharray'] !== 'none' && selectedElementProps?.['data-bg-stroke-dasharray'].split(',').length <= 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                            <div className={`w-[0.2vw] h-[0.1vw] rounded-full ${(selectedElementProps?.['data-bg-stroke-dasharray'] && selectedElementProps?.['data-bg-stroke-dasharray'] !== 'none' && selectedElementProps?.['data-bg-stroke-dasharray'].split(',').length <= 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                            <div className={`w-[0.2vw] h-[0.1vw] rounded-full ${(selectedElementProps?.['data-bg-stroke-dasharray'] && selectedElementProps?.['data-bg-stroke-dasharray'] !== 'none' && selectedElementProps?.['data-bg-stroke-dasharray'].split(',').length <= 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                          </div>
                        </button>
                        {/* Dashed (Long) */}
                        <button
                          onClick={() => updateAttr('data-bg-stroke-dasharray', '6, 12, 18, 12')}
                          className={`flex-1 h-full flex items-center justify-center rounded-[0.5vw] border transition-colors ${(selectedElementProps?.['data-bg-stroke-dasharray'] && selectedElementProps?.['data-bg-stroke-dasharray'] !== 'none' && selectedElementProps?.['data-bg-stroke-dasharray'].split(',').length > 2) ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200/60 hover:bg-gray-100'}`}
                        >
                          <div className="flex gap-[0.1vw] items-center">
                            <div className={`w-[0.4vw] h-[0.1vw] rounded-full ${(selectedElementProps?.['data-bg-stroke-dasharray'] && selectedElementProps?.['data-bg-stroke-dasharray'] !== 'none' && selectedElementProps?.['data-bg-stroke-dasharray'].split(',').length > 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                            <div className={`w-[0.1vw] h-[0.1vw] rounded-full ${(selectedElementProps?.['data-bg-stroke-dasharray'] && selectedElementProps?.['data-bg-stroke-dasharray'] !== 'none' && selectedElementProps?.['data-bg-stroke-dasharray'].split(',').length > 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                            <div className={`w-[0.4vw] h-[0.1vw] rounded-full ${(selectedElementProps?.['data-bg-stroke-dasharray'] && selectedElementProps?.['data-bg-stroke-dasharray'] !== 'none' && selectedElementProps?.['data-bg-stroke-dasharray'].split(',').length > 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                            <div className={`w-[0.1vw] h-[0.1vw] rounded-full ${(selectedElementProps?.['data-bg-stroke-dasharray'] && selectedElementProps?.['data-bg-stroke-dasharray'] !== 'none' && selectedElementProps?.['data-bg-stroke-dasharray'].split(',').length > 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Dash Property */}
                    <div className={`flex-1 flex flex-col gap-[0.3vw] ${(!selectedElementProps?.['data-bg-stroke-dasharray'] || selectedElementProps?.['data-bg-stroke-dasharray'] === 'none') ? 'opacity-40 pointer-events-none' : ''}`}>
                      <span className="text-[0.7vw] text-gray-500 font-medium">Dash Property</span>
                      <div className="flex items-center gap-[0.3vw] h-[2vw]">
                        {(() => {
                          const dashArrayStr = selectedElementProps?.['data-bg-stroke-dasharray'];
                          const isCustom = dashArrayStr && dashArrayStr !== 'none' && dashArrayStr.split(',').length > 2;
                          const dashArray = (dashArrayStr || '4,4').split(',');
                          const lVal = isNaN(parseInt(dashArray[0])) ? 4 : parseInt(dashArray[0]);
                          const gVal = isNaN(parseInt(dashArray[1] || dashArray[0])) ? 4 : parseInt(dashArray[1] || dashArray[0]);

                          if (isCustom) {
                            return (
                              <div className="flex-1 flex items-center border border-gray-200 rounded-[0.5vw] bg-white h-full px-[0.5vw]">
                                <span className="text-[0.65vw] text-gray-400 font-medium whitespace-nowrap mr-[0.3vw]">Custom</span>
                                <input
                                  type="text"
                                  value={dashArrayStr || '6, 12, 18, 12'}
                                  onChange={(e) => updateAttr('data-bg-stroke-dasharray', e.target.value)}
                                  className="w-full bg-transparent outline-none text-[0.65vw] text-gray-700 font-medium text-right cursor-text"
                                  onPointerDown={(e) => e.stopPropagation()}
                                />
                              </div>
                            );
                          }

                          return (
                            <>
                              <div className="flex-1 flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white h-full px-[0.5vw] cursor-ew-resize" onPointerDown={(e) => handleScrubHelper(e, lVal, (v) => updateAttr('data-bg-stroke-dasharray', `${Math.max(1, parseInt(v))},${gVal}`))}>
                                <span className="text-[0.7vw] text-gray-400 font-medium">L</span>
                                <input
                                  type="number"
                                  value={lVal}
                                  onChange={(e) => updateAttr('data-bg-stroke-dasharray', `${Math.max(1, parseInt(e.target.value || 1))},${gVal}`)}
                                  className="w-[1.5vw] bg-transparent outline-none text-[0.75vw] text-gray-700 font-medium no-spin text-center cursor-text"
                                  onPointerDown={(e) => e.stopPropagation()}
                                />
                              </div>
                              <span className="text-[0.7vw] text-gray-400 font-bold">:</span>
                              <div className="flex-1 flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white h-full px-[0.5vw] cursor-ew-resize" onPointerDown={(e) => handleScrubHelper(e, gVal, (v) => updateAttr('data-bg-stroke-dasharray', `${lVal},${Math.max(1, parseInt(v))}`))}>
                                <span className="text-[0.7vw] text-gray-400 font-medium">G</span>
                                <input
                                  type="number"
                                  value={gVal}
                                  onChange={(e) => updateAttr('data-bg-stroke-dasharray', `${lVal},${Math.max(1, parseInt(e.target.value || 1))}`)}
                                  className="w-[1.5vw] bg-transparent outline-none text-[0.75vw] text-gray-700 font-medium no-spin text-center cursor-text"
                                  onPointerDown={(e) => e.stopPropagation()}
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Row 4: Line Corner */}
                  {!isText && (
                  <div className="flex items-center gap-[1vw]">
                    <div className="flex-1 flex flex-col gap-[0.3vw]">
                      <span className="text-[0.7vw] text-gray-500 font-medium">Line Corner</span>
                      <div className="relative">
                        <div
                          className={`h-[2vw] px-[0.5vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-between bg-white ${isText ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
                          onClick={() => !isText && setIsStrokeStyleOpen(!isStrokeStyleOpen)}
                        >
                          <span className="text-[0.75vw] font-medium text-gray-700 capitalize">{(selectedElementProps?.['data-bg-stroke-linecap'] === 'round') ? 'Rounded' : 'Square'}</span>
                          <ChevronDown size="0.8vw" className="text-gray-400" />
                        </div>
                        {isStrokeStyleOpen && (
                          <>
                            <div className="fixed inset-0 z-[40]" onClick={(e) => { e.stopPropagation(); setIsStrokeStyleOpen(false); }} />
                            <div className="absolute bottom-[110%] left-0 right-0 bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-50 py-1 overflow-hidden">
                              {['Square', 'Rounded'].map(corner => (
                                <div
                                  key={corner}
                                  onClick={() => {
                                    const isRound = corner === 'Rounded';
                                    updateAttr('data-bg-stroke-linecap', isRound ? 'round' : 'butt');
                                    updateAttr('data-bg-stroke-linejoin', isRound ? 'round' : 'miter');
                                    setIsStrokeStyleOpen(false);
                                  }}
                                  className="px-[1vw] py-[0.4vw] text-[0.7vw] font-semibold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                                >
                                  {corner}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-1"></div>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {!hideFill && (
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
          <div
            onClick={() => setOpenSubSection(openSubSection === 'color' || openSubSection === 'fillColor' ? null : 'fillColor')}
            className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${(openSubSection === 'color' || openSubSection === 'fillColor') ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
          >
            <div className="flex items-center gap-[0.5vw]">
              <span className={`font-semibold text-[0.85vw] ${(openSubSection === 'color' || openSubSection === 'fillColor') ? 'text-gray-900' : 'text-gray-500'}`}>Fill Color</span>
            </div>
            <ChevronUp size="1vw" className={`transition-transform duration-200 ${(openSubSection === 'color' || openSubSection === 'fillColor') ? 'text-gray-900' : 'rotate-180 text-gray-500'}`} />
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${(openSubSection === 'color' || openSubSection === 'fillColor') ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="p-[1vw] pt-[0.75vw] flex items-center justify-between gap-[0.5vw]">
                {/* Swatch */}
                <div
                  className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => setActiveColorPicker(activeColorPicker === 'fill' ? null : 'fill')}
                >
                  <div
                    className="w-full h-full border border-gray-200"
                    style={{
                      background: (pseudoProps.fill === 'none' || pseudoProps.fill === 'transparent' || pseudoProps.fill === '#' || !pseudoProps.fill)
                        ? 'white'
                        : (pseudoProps.fill.toString().toLowerCase().includes('url(#')
                          ? (pseudoProps && pseudoProps[`fill-stops`]
                            ? `linear-gradient(to right, ${JSON.parse(pseudoProps[`fill-stops`]).map(s => s.color).join(', ')})`
                            : '#ccc')
                          : pseudoProps.fill)
                    }}
                  />
                  {(pseudoProps.fill === 'none' || pseudoProps.fill === 'transparent' || pseudoProps.fill === '#' || !pseudoProps.fill) && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
                  )}
                </div>

                {/* Input box */}
                <div className="flex-grow flex items-center border-[0.1vw] border-gray-200 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white hover:border-indigo-400 transition-colors px-[0.5vw]">
                  <input
                    type="text"
                    value={(pseudoProps.fill === 'none' || pseudoProps.fill === 'transparent' || !pseudoProps.fill) ? '#' : pseudoProps.fill?.toUpperCase()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || val === '#') {
                        updateAttr('fill', 'none');
                      } else {
                        const finalVal = val.startsWith('#') ? val : '#' + val;
                        updateAttr('fill', finalVal);
                      }
                    }}
                    className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw] tracking-tight"
                    maxLength={7}
                  />
                  <div
                    className="flex items-center gap-[0.1vw] ml-[0.5vw] cursor-ew-resize select-none px-[0.2vw] hover:bg-gray-50 rounded"
                    onPointerDown={(e) => {
                      const currentPct = Math.round(parseFloat(pseudoProps.opacity !== undefined ? pseudoProps.opacity : 1) * 100);
                      handleScrubHelper(e, currentPct, (val) => {
                        const num = parseInt(val);
                        const clamped = Math.min(Math.max(num, 0), 100);
                        updateAttr('opacity', (clamped / 100).toString());
                      });
                    }}
                  >
                    <span className="text-[0.75vw] font-medium text-gray-600">
                      {Math.round(parseFloat(pseudoProps.opacity !== undefined ? pseudoProps.opacity : 1) * 100)}%
                    </span>
                  </div>
                </div>

                {/* HEX Dropdown */}
                <div className="h-[2vw] flex items-center justify-between px-[0.5vw] border border-gray-200 rounded-[0.5vw] bg-white cursor-pointer hover:bg-gray-50 min-w-[3.5vw]">
                  <span className="text-[0.7vw] text-gray-600 font-medium">HEX</span>
                  <ChevronDown size="0.8vw" className="text-gray-400 ml-[0.2vw]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
        <div
          onClick={() => setOpenSubSection(openSubSection === 'color' || openSubSection === 'strokeColor' ? null : 'strokeColor')}
          className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${(openSubSection === 'color' || openSubSection === 'strokeColor') ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
        >
          <div className="flex items-center gap-[0.5vw]">
            <span className={`font-semibold text-[0.85vw] ${(openSubSection === 'color' || openSubSection === 'strokeColor') ? 'text-gray-900' : 'text-gray-500'}`}>Stroke Color</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            {(openSubSection === 'color' || openSubSection === 'strokeColor') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateAttr('stroke', 'none');
                  updateAttr('stroke-width', '0');
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors p-[0.1vw] cursor-pointer flex items-center justify-center"
                title="Reset Stroke"
              >
                <Icon icon="ix:reset" width="1.1vw" height="1.1vw" style={{ strokeWidth: 2.5 }} />
              </button>
            )}
            <ChevronUp size="1vw" className={`transition-transform duration-200 ${(openSubSection === 'color' || openSubSection === 'strokeColor') ? 'text-gray-900' : 'rotate-180 text-gray-500'}`} />
          </div>
        </div>

        <div className={`grid transition-all duration-300 ease-in-out ${(openSubSection === 'color' || openSubSection === 'strokeColor') ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-[1vw] pt-[0.75vw] flex flex-col gap-[0.75vw]">

              {/* Row 1: Color Picker */}
              <div className="flex items-center justify-between gap-[0.5vw]">
                {/* Swatch */}
                <div
                  className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => setActiveColorPicker(activeColorPicker === 'stroke' ? null : 'stroke')}
                >
                  <div
                    className="w-full h-full border border-gray-200"
                    style={{
                      background: (pseudoProps.stroke === 'none' || pseudoProps.stroke === 'transparent' || pseudoProps.stroke === '#' || !pseudoProps.stroke)
                        ? 'white'
                        : (pseudoProps.stroke.toString().toLowerCase().includes('url(#')
                          ? (pseudoProps && pseudoProps[`stroke-stops`]
                            ? `linear-gradient(to right, ${JSON.parse(pseudoProps[`stroke-stops`]).map(s => s.color).join(', ')})`
                            : '#ccc')
                          : pseudoProps.stroke)
                    }}
                  />
                  {(pseudoProps.stroke === 'none' || pseudoProps.stroke === 'transparent' || pseudoProps.stroke === '#' || !pseudoProps.stroke) && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
                  )}
                </div>

                {/* Input box */}
                <div className="flex-grow flex items-center border-[0.1vw] border-gray-200 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white hover:border-indigo-400 transition-colors px-[0.5vw]">
                  <input
                    type="text"
                    value={(pseudoProps.stroke === 'none' || pseudoProps.stroke === 'transparent' || !pseudoProps.stroke) ? '#' : pseudoProps.stroke?.toUpperCase()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || val === '#') {
                        updateAttr('stroke', 'none');
                      } else {
                        const finalVal = val.startsWith('#') ? val : '#' + val;
                        updateAttr('stroke', finalVal);
                      }
                    }}
                    className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw] tracking-tight"
                    maxLength={7}
                  />
                  <div
                    className="flex items-center gap-[0.1vw] ml-[0.5vw] cursor-ew-resize select-none px-[0.2vw] hover:bg-gray-50 rounded"
                    onPointerDown={(e) => {
                      const currentPct = Math.round(parseFloat(pseudoProps['stroke-opacity'] !== undefined ? pseudoProps['stroke-opacity'] : 1) * 100);
                      handleScrubHelper(e, currentPct, (val) => {
                        const num = parseInt(val);
                        const clamped = Math.min(Math.max(num, 0), 100);
                        updateAttr('stroke-opacity', (clamped / 100).toString());
                      });
                    }}
                  >
                    <span className="text-[0.75vw] font-medium text-gray-600">
                      {Math.round(parseFloat(pseudoProps['stroke-opacity'] !== undefined ? pseudoProps['stroke-opacity'] : 1) * 100)}%
                    </span>
                  </div>
                </div>

                {/* HEX Dropdown */}
                <div className="h-[2vw] flex items-center justify-between px-[0.5vw] border border-gray-200 rounded-[0.5vw] bg-white cursor-pointer hover:bg-gray-50 min-w-[3.5vw]">
                  <span className="text-[0.7vw] text-gray-600 font-medium">HEX</span>
                  <ChevronDown size="0.8vw" className="text-gray-400 ml-[0.2vw]" />
                </div>
              </div>

              {/* Stroke Properties */}
              <div className={`flex flex-col gap-[0.75vw] ${(!pseudoProps.stroke || pseudoProps.stroke === 'none' || pseudoProps.stroke === '#' || pseudoProps.stroke === 'transparent') ? 'opacity-50' : ''}`}>
                {/* Row 2: Alignment and Stroke Width */}
                <div className="flex items-center gap-[1vw]">
                  {/* Alignment */}
                  <div className="flex-1 flex flex-col gap-[0.3vw]">
                    <span className="text-[0.7vw] text-gray-500 font-medium">Alignment</span>
                    <div className="relative">
                      <div
                        className={`h-[2vw] px-[0.5vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-between bg-white ${isText ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
                        onClick={() => !isText && setIsDashPosOpen(!isDashPosOpen)}
                      >
                        <span className="text-[0.75vw] font-medium text-gray-700 capitalize">{pseudoProps['data-stroke-position'] || 'Center'}</span>
                        <ChevronDown size="0.8vw" className="text-gray-400" />
                      </div>
                      {isDashPosOpen && (
                        <>
                          <div className="fixed inset-0 z-[40]" onClick={(e) => { e.stopPropagation(); setIsDashPosOpen(false); }} />
                          <div className="absolute top-[110%] left-0 right-0 bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-50 py-1 overflow-hidden">
                            {['Inside', 'Center', 'Outside'].map(pos => (
                              <div
                                key={pos}
                                onClick={() => {
                                  updateAttr('data-stroke-position', pos);
                                  setIsDashPosOpen(false);
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
                          const current = parseFloat(pseudoProps.strokeWidth !== undefined ? pseudoProps.strokeWidth : 0);
                          updateAttr('stroke-width', Math.max(0, current - 1).toString());
                        }}
                      >
                        <span className="text-[1vw] leading-none mb-[0.1vw]">-</span>
                      </button>
                      <div
                        className="flex-grow h-full bg-white border border-gray-200 rounded-[0.5vw] flex items-center cursor-ew-resize"
                        onPointerDown={(e) => {
                          const current = parseFloat(pseudoProps.strokeWidth !== undefined && !isNaN(parseFloat(pseudoProps.strokeWidth)) ? pseudoProps.strokeWidth : 0);
                          handleScrubHelper(e, current, (v) => updateAttr('stroke-width', Math.max(0, parseInt(v)).toString()));
                        }}
                      >
                        <input
                          type="number"
                          value={pseudoProps.strokeWidth !== undefined && !isNaN(parseFloat(pseudoProps.strokeWidth)) ? parseFloat(pseudoProps.strokeWidth) : 0}
                          onChange={(e) => updateAttr('stroke-width', e.target.value)}
                          className="w-full h-full text-[0.75vw] font-medium outline-none text-center bg-transparent text-gray-700 no-spin cursor-ew-resize"
                        />
                      </div>
                      <button
                        className="w-[2vw] h-full flex items-center justify-center bg-gray-100 rounded-[0.3vw] text-gray-600 hover:bg-gray-200 transition-colors"
                        onClick={() => {
                          const current = parseFloat(pseudoProps.strokeWidth !== undefined ? pseudoProps.strokeWidth : 0);
                          updateAttr('stroke-width', (current + 1).toString());
                        }}
                      >
                        <span className="text-[1vw] leading-none mb-[0.1vw]">+</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 3: Line style and Dash Property */}
                {!isText && (
                <div className="flex items-center gap-[1vw]">
                  {/* Line style */}
                  <div className="flex-1 flex flex-col gap-[0.3vw]">
                    <span className="text-[0.7vw] text-gray-500 font-medium">Line style</span>
                    <div className="flex items-center justify-between gap-[0.3vw] h-[2vw]">
                      {/* Solid */}
                      <button
                        onClick={() => updateAttr('stroke-dasharray', 'none')}
                        className={`flex-1 h-full flex items-center justify-center rounded-[0.5vw] border transition-colors ${(!pseudoProps.strokeDasharray || pseudoProps.strokeDasharray === 'none') ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200/60 hover:bg-gray-100'}`}
                      >
                        <div className={`w-[1.2vw] h-[0.1vw] rounded-full ${(!pseudoProps.strokeDasharray || pseudoProps.strokeDasharray === 'none') ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                      </button>
                      {/* Dashed (Short) */}
                      <button
                        onClick={() => updateAttr('stroke-dasharray', '4,4')}
                        className={`flex-1 h-full flex items-center justify-center rounded-[0.5vw] border transition-colors ${(pseudoProps.strokeDasharray && pseudoProps.strokeDasharray !== 'none' && pseudoProps.strokeDasharray.split(',').length <= 2) ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200/60 hover:bg-gray-100'}`}
                      >
                        <div className="flex gap-[0.15vw]">
                          <div className={`w-[0.2vw] h-[0.1vw] rounded-full ${(pseudoProps.strokeDasharray && pseudoProps.strokeDasharray !== 'none' && pseudoProps.strokeDasharray.split(',').length <= 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                          <div className={`w-[0.2vw] h-[0.1vw] rounded-full ${(pseudoProps.strokeDasharray && pseudoProps.strokeDasharray !== 'none' && pseudoProps.strokeDasharray.split(',').length <= 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                          <div className={`w-[0.2vw] h-[0.1vw] rounded-full ${(pseudoProps.strokeDasharray && pseudoProps.strokeDasharray !== 'none' && pseudoProps.strokeDasharray.split(',').length <= 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                          <div className={`w-[0.2vw] h-[0.1vw] rounded-full ${(pseudoProps.strokeDasharray && pseudoProps.strokeDasharray !== 'none' && pseudoProps.strokeDasharray.split(',').length <= 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                        </div>
                      </button>
                      {/* Dashed (Long) */}
                      <button
                        onClick={() => updateAttr('stroke-dasharray', '6, 12, 18, 12')}
                        className={`flex-1 h-full flex items-center justify-center rounded-[0.5vw] border transition-colors ${(pseudoProps.strokeDasharray && pseudoProps.strokeDasharray !== 'none' && pseudoProps.strokeDasharray.split(',').length > 2) ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200/60 hover:bg-gray-100'}`}
                      >
                        <div className="flex gap-[0.1vw] items-center">
                          <div className={`w-[0.4vw] h-[0.1vw] rounded-full ${(pseudoProps.strokeDasharray && pseudoProps.strokeDasharray !== 'none' && pseudoProps.strokeDasharray.split(',').length > 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                          <div className={`w-[0.1vw] h-[0.1vw] rounded-full ${(pseudoProps.strokeDasharray && pseudoProps.strokeDasharray !== 'none' && pseudoProps.strokeDasharray.split(',').length > 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                          <div className={`w-[0.4vw] h-[0.1vw] rounded-full ${(pseudoProps.strokeDasharray && pseudoProps.strokeDasharray !== 'none' && pseudoProps.strokeDasharray.split(',').length > 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                          <div className={`w-[0.1vw] h-[0.1vw] rounded-full ${(pseudoProps.strokeDasharray && pseudoProps.strokeDasharray !== 'none' && pseudoProps.strokeDasharray.split(',').length > 2) ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Dash Property */}
                  <div className={`flex-1 flex flex-col gap-[0.3vw] ${(!pseudoProps.strokeDasharray || pseudoProps.strokeDasharray === 'none') ? 'opacity-40 pointer-events-none' : ''}`}>
                    <span className="text-[0.7vw] text-gray-500 font-medium">Dash Property</span>
                    <div className="flex items-center gap-[0.3vw] h-[2vw]">
                      {(() => {
                        const dashArrayStr = pseudoProps.strokeDasharray;
                        const isCustom = dashArrayStr && dashArrayStr !== 'none' && dashArrayStr.split(',').length > 2;
                        const dashArray = (dashArrayStr || '4,4').split(',');
                        const lVal = isNaN(parseInt(dashArray[0])) ? 4 : parseInt(dashArray[0]);
                        const gVal = isNaN(parseInt(dashArray[1] || dashArray[0])) ? 4 : parseInt(dashArray[1] || dashArray[0]);

                        if (isCustom) {
                          return (
                            <div className="flex-1 flex items-center border border-gray-200 rounded-[0.5vw] bg-white h-full px-[0.5vw]">
                              <span className="text-[0.65vw] text-gray-400 font-medium whitespace-nowrap mr-[0.3vw]">Custom</span>
                              <input
                                type="text"
                                value={dashArrayStr || '6, 12, 18, 12'}
                                onChange={(e) => updateAttr('stroke-dasharray', e.target.value)}
                                className="w-full bg-transparent outline-none text-[0.65vw] text-gray-700 font-medium text-right cursor-text"
                                onPointerDown={(e) => e.stopPropagation()}
                              />
                            </div>
                          );
                        }

                        return (
                          <>
                            <div className="flex-1 flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white h-full px-[0.5vw] cursor-ew-resize" onPointerDown={(e) => handleScrubHelper(e, lVal, (v) => updateAttr('stroke-dasharray', `${Math.max(1, parseInt(v))},${gVal}`))}>
                              <span className="text-[0.7vw] text-gray-400 font-medium">L</span>
                              <input
                                type="number"
                                value={lVal}
                                onChange={(e) => updateAttr('stroke-dasharray', `${Math.max(1, parseInt(e.target.value || 1))},${gVal}`)}
                                className="w-[1.5vw] bg-transparent outline-none text-[0.75vw] text-gray-700 font-medium no-spin text-center cursor-text"
                                onPointerDown={(e) => e.stopPropagation()}
                              />
                            </div>
                            <span className="text-[0.7vw] text-gray-400 font-bold">:</span>
                            <div className="flex-1 flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white h-full px-[0.5vw] cursor-ew-resize" onPointerDown={(e) => handleScrubHelper(e, gVal, (v) => updateAttr('stroke-dasharray', `${lVal},${Math.max(1, parseInt(v))}`))}>
                              <span className="text-[0.7vw] text-gray-400 font-medium">G</span>
                              <input
                                type="number"
                                value={gVal}
                                onChange={(e) => updateAttr('stroke-dasharray', `${lVal},${Math.max(1, parseInt(e.target.value || 1))}`)}
                                className="w-[1.5vw] bg-transparent outline-none text-[0.75vw] text-gray-700 font-medium no-spin text-center cursor-text"
                                onPointerDown={(e) => e.stopPropagation()}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                )}

                {/* Row 4: Line Corner */}
                {!isText && (
                <div className="flex items-center gap-[1vw]">
                  <div className="flex-1 flex flex-col gap-[0.3vw]">
                    <span className="text-[0.7vw] text-gray-500 font-medium">Line Corner</span>
                    <div className="relative">
                      <div
                        className={`h-[2vw] px-[0.5vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-between bg-white ${isText ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
                        onClick={() => !isText && setIsStrokeStyleOpen(!isStrokeStyleOpen)}
                      >
                        <span className="text-[0.75vw] font-medium text-gray-700 capitalize">{(pseudoProps.strokeLinecap === 'round' || pseudoProps['stroke-linecap'] === 'round') ? 'Rounded' : 'Square'}</span>
                        <ChevronDown size="0.8vw" className="text-gray-400" />
                      </div>
                      {isStrokeStyleOpen && (
                        <>
                          <div className="fixed inset-0 z-[40]" onClick={(e) => { e.stopPropagation(); setIsStrokeStyleOpen(false); }} />
                          <div className="absolute bottom-[110%] left-0 right-0 bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-50 py-1 overflow-hidden">
                            {['Square', 'Rounded'].map(corner => (
                              <div
                                key={corner}
                                onClick={() => {
                                  const isRound = corner === 'Rounded';
                                  updateAttr('stroke-linecap', isRound ? 'round' : 'butt');
                                  updateAttr('stroke-linejoin', isRound ? 'round' : 'miter');
                                  setIsStrokeStyleOpen(false);
                                }}
                                className="px-[1vw] py-[0.4vw] text-[0.7vw] font-semibold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                              >
                                {corner}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Empty div for right side to maintain grid alignment */}
                  <div className="flex-1"></div>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeColorPicker && !activeColorPicker.includes('effect-') && createPortal(
        <div
          className="fixed z-[5000]"
          style={{
            top: '50%',
            right: '19.5vw',
            transform: 'translateY(-50%)'
          }}
        >
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <ColorPicker
              key={activeColorPicker}
              color={(() => {
                if (activeColorPicker === 'scrollbar') {
                  return backgroundColor?.scrollBarColor || '#000000';
                }
                if (activeColorPicker === 'bg-fill') {
                  return backgroundColor?.bgFill || 'transparent';
                }
                if (activeColorPicker === 'bg-stroke') {
                  return backgroundColor?.bgStroke || 'transparent';
                }
                const type = pseudoProps[`${activeColorPicker}-type`] || 'solid';
                const currentVal = pseudoProps[activeColorPicker] || '#000000';
                const stopsJson = pseudoProps[`${activeColorPicker}-stops`];
                if (type === 'gradient' || currentVal.toLowerCase().includes('url(#')) {
                  const stops = stopsJson ? JSON.parse(stopsJson) : defaultStops;
                  const gType = pseudoProps[`${activeColorPicker}-gradient-type`] || 'linear';
                  return generateGradientString(
                    gType.charAt(0).toUpperCase() + gType.slice(1),
                    stops.map(s => ({ ...s, opacity: (s.opacity !== undefined ? s.opacity : 1) * 100 })),
                    parseInt(pseudoProps[`${activeColorPicker}-angle`] || '0'),
                    parseInt(pseudoProps[`${activeColorPicker}-radius`] || '100')
                  );
                }
                return pseudoProps[activeColorPicker] || '#000000';
              })()}
              disableGradient={activeColorPicker === 'stroke' || activeColorPicker === 'bg-stroke' || activeColorPicker === 'scrollbar'}
              onChange={(newVal, isDragging = false) => {
                isDraggingRef.current = isDragging;
                if (activeColorPicker === 'scrollbar') {
                  if (setBackgroundColor) setBackgroundColor(p => ({ ...p, scrollBarColor: newVal }));
                  return;
                }
                if (activeColorPicker === 'bg-fill') {
                  if (setBackgroundColor) setBackgroundColor(p => ({ ...p, bgFill: newVal }));
                  return;
                }
                if (activeColorPicker === 'bg-stroke') {
                  if (setBackgroundColor) setBackgroundColor(p => ({ ...p, bgStroke: newVal }));
                  return;
                }
                if (newVal.includes('gradient')) {
                  const parsed = parseGradient(newVal);
                  if (parsed) {
                    updateAttr(`${activeColorPicker}-type`, 'gradient');
                    updateAttr(`${activeColorPicker}-gradient-type`, parsed.type.toLowerCase());
                    updateAttr(`${activeColorPicker}-stops`, JSON.stringify(parsed.stops.map(s => ({
                      color: s.color,
                      offset: s.offset,
                      opacity: s.opacity / 100
                    }))));
                    updateAttr(`${activeColorPicker}-angle`, (parsed.angle || 0).toString());
                    updateAttr(`${activeColorPicker}-radius`, (parsed.radius || 100).toString());
                    updateAttr(activeColorPicker, newVal);
                  }
                } else {
                  if (setBackgroundColor) {
                    setBackgroundColor(p => {
                      if (activeColorPicker === 'fill') {
                        return { ...p, fill: newVal, fillType: 'solid' };
                      } else if (activeColorPicker === 'stroke') {
                        return {
                          ...p,
                          stroke: newVal,
                          strokeType: 'solid',
                          strokeWeight: (p.strokeWeight === 0 && newVal !== 'transparent' && newVal !== 'none') ? 1 : p.strokeWeight
                        };
                      }
                      return p;
                    });
                  }
                }
              }}
              opacity={(() => {
                if (activeColorPicker === 'scrollbar') {
                  const op = backgroundColor?.scrollBarOpacity !== undefined ? backgroundColor.scrollBarOpacity : 100;
                  return parseFloat(op);
                } else if (activeColorPicker === 'bg-fill') {
                  const op = backgroundColor?.bgFillOpacity !== undefined ? backgroundColor.bgFillOpacity / 100 : 1;
                  return parseFloat(op) * 100;
                } else if (activeColorPicker === 'bg-stroke') {
                  const op = backgroundColor?.bgStrokeOpacity !== undefined ? backgroundColor.bgStrokeOpacity / 100 : 1;
                  return parseFloat(op) * 100;
                } else if (activeColorPicker === 'fill') {
                  const op = pseudoProps.opacity !== undefined && pseudoProps.opacity !== '' && pseudoProps.opacity !== null ? pseudoProps.opacity : 1;
                  return parseFloat(op) * 100;
                } else if (activeColorPicker === 'stroke') {
                  const op = pseudoProps['stroke-opacity'] !== undefined && pseudoProps['stroke-opacity'] !== '' && pseudoProps['stroke-opacity'] !== null ? pseudoProps['stroke-opacity'] : 1;
                  return parseFloat(op) * 100;
                }
                return 100;
              })()}
              onOpacityChange={(newOpacity) => {
                if (activeColorPicker === 'scrollbar') {
                  if (setBackgroundColor) setBackgroundColor(p => ({ ...p, scrollBarOpacity: parseFloat(newOpacity) }));
                } else if (activeColorPicker === 'bg-fill') {
                  if (setBackgroundColor) setBackgroundColor(p => ({ ...p, bgFillOpacity: parseFloat(newOpacity) }));
                  updateAttr('data-bg-fill-opacity', (newOpacity / 100).toString());
                } else if (activeColorPicker === 'bg-stroke') {
                  if (setBackgroundColor) setBackgroundColor(p => ({ ...p, bgStrokeOpacity: parseFloat(newOpacity) }));
                  updateAttr('data-bg-stroke-opacity', (newOpacity / 100).toString());
                } else if (activeColorPicker === 'fill') {
                  updateAttr('opacity', (newOpacity / 100).toString());
                } else if (activeColorPicker === 'stroke') {
                  updateAttr('stroke-opacity', (newOpacity / 100).toString());
                }
                if (onUpdate) onUpdate({ shouldRefresh: true });
              }}
              onClose={() => setActiveColorPicker(null)}
              colorsOnPage={colorsOnPage}
            />
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .hide-opacity-bar .space-y-\\[1vw\\] > div:nth-child(2) {
          display: none !important;
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
export default Color;
