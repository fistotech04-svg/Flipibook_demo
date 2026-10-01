import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { createPortal } from 'react-dom';
import { handleScrubHelper } from './Color';
import Color from './Color';
import CornerRadius from './CornerRadius';
import Adjustment from './Adjustment';
import Effect from './Effect';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

const ShapeProperties = ({
  selectedElementProps,
  activePageIndex,
  selectedLayerId,
  updateElementAttribute,
  activeMainTool
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

  const shapeType = selectedElementProps['data-shape-type'] || selectedElementProps.tagName?.toLowerCase();

  if (!selectedElementProps) return null;

  const updateAttr = (attribute, value) => {
    updateElementAttribute(activePageIndex, selectedLayerId, attribute, value);
  };

  // --- DERIVED STATE ---
  const backgroundColor = {
    fill: selectedElementProps['data-masked-image-url'] 
      ? (selectedElementProps['data-original-fill'] || '#d0ccff') 
      : (selectedElementProps.fill || '#000000'),
    fillOpacity: selectedElementProps.opacity ? parseFloat(selectedElementProps.opacity) * 100 : 100,
    stroke: selectedElementProps.stroke || 'none',
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
      if (selectedElementProps['data-masked-image-url']) {
        updates['data-original-fill'] = next.fill;
      } else {
        updates['fill'] = next.fill;
      }
    }
    if (backgroundColor.fillOpacity !== next.fillOpacity) updates['opacity'] = (next.fillOpacity / 100).toString();
    if (backgroundColor.stroke !== next.stroke) updates['stroke'] = next.stroke;
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

    updateElementAttribute(activePageIndex, selectedLayerId, updates);
  };

  const handleSetIsRadiusLinked = (val) => {
    updateElementAttribute(activePageIndex, selectedLayerId, 'data-corner-linked', val ? 'true' : 'false');
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

  const [isNodeEditActive, setIsNodeEditActive] = useState(false);

  useEffect(() => {
    const handleNodeEditChange = (e) => {
      setIsNodeEditActive(Boolean(e.detail?.active));
    };
    window.addEventListener('node-edit-mode-changed', handleNodeEditChange);
    return () => window.removeEventListener('node-edit-mode-changed', handleNodeEditChange);
  }, []);

  const isVectorPath = (
    shapeType === 'path' ||
    shapeType === 'vector-path' ||
    shapeType === 'shape' ||
    selectedElementProps['data-type'] === 'vector-path' ||
    selectedElementProps['data-type'] === 'shape' ||
    selectedElementProps.tagName?.toLowerCase() === 'path' ||
    Boolean(selectedElementProps.d) ||
    isNodeEditActive ||
    Boolean(selectedLayerId)
  );

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
        setActiveNodeType(null); // Reset stale type; enterNodeEditMode will dispatch node-selected with the real type
      }
    };
    window.addEventListener('node-selected', handleNodeSelected);
    window.addEventListener('node-edit-mode-changed', handleNodeEditChange);
    return () => {
      window.removeEventListener('node-selected', handleNodeSelected);
      window.removeEventListener('node-edit-mode-changed', handleNodeEditChange);
    };
  }, []);

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
        <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Shape Properties</span>
        <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
      </div>

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

      {selectedElementProps['data-masked-image-url'] && (
        <div className="px-[0.2vw] py-[0.5vw]">
          <button
            onClick={() => {
              updateElementAttribute(activePageIndex, selectedLayerId, {
                'data-masked-image-url': null,
                'data-masked-image-type': null,
                'fill': selectedElementProps['data-original-fill'] || '#d0ccff'
              });
              try {
                const safeShapeId = (selectedLayerId || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
                const imageId = `masked-img-${safeShapeId}`;
                const clipId = `clip-shape-${safeShapeId}`;
                
                const svg = document.getElementById('main-flipbook-editor')?.contentDocument?.querySelector('svg') || document.querySelector('.flipbook-page-container svg');
                if (svg) {
                  const imgEl = svg.querySelector(`image[id="${imageId}"]`);
                  if (imgEl) imgEl.remove();
                  
                  const clipEl = svg.querySelector(`clipPath[id="${clipId}"]`);
                  if (clipEl) clipEl.remove();
                }
              } catch (e) {
                console.error('Error removing masked image elements:', e);
              }
            }}
            className="w-full flex items-center justify-center gap-[0.5vw] py-[0.4vw] text-[0.85vw] font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
          >
            <Icon icon="lucide:image-minus" width="1.1vw" height="1.1vw" />
            Remove Image Mask
          </button>
        </div>
      )}

      <div>
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
          hideFill={shapeType === 'line'}
        />
      </div>

      {(shapeType === 'rect' || shapeType === 'rectangle') && (
        <CornerRadius
          openSubSection={openSubSection}
          setOpenSubSection={setOpenSubSection}
          radius={radius}
          setRadius={handleSetRadius}
          isRadiusLinked={isRadiusLinked}
          setIsRadiusLinked={handleSetIsRadiusLinked}
          tagName={selectedElementProps.tagName || 'rect'}
        />
      )}

      <Effect
        isShape={true}
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

export default ShapeProperties;
