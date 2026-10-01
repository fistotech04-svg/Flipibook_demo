import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, Trash2, Plus, X, Pipette, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '@iconify/react';
import { handleScrubHelper } from './Color';
import ColorPicker from './ColorPicker';

const Effect = ({
  openSubSection, setOpenSubSection,
  activeEffects, setActiveEffects,
  effectSettings, setEffectSettings,
  activeColorPicker, setActiveColorPicker,
  showDetailedPicker, setShowDetailedPicker,
  ...props
}) => {
  const [activeEffectPopupId, setActiveEffectPopupId] = useState(null);
  const [effectPopupPos, setEffectPopupPos] = useState({ top: 0, right: '16.5vw' });
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });

  const pseudoProps = {
    'data-effect-drop-shadow': activeEffects?.includes('Drop Shadow') ? 'true' : 'false',
    'data-effect-inner-shadow': activeEffects?.includes('Inner Shadow') ? 'true' : 'false',
    'data-effect-blur': activeEffects?.includes('Blur') ? 'true' : 'false',
    'data-effect-drop-shadow-color': effectSettings?.['Drop Shadow']?.color ?? '#000000',
    'data-effect-drop-shadow-opacity': effectSettings?.['Drop Shadow']?.opacity ?? 35,
    'data-effect-drop-shadow-x': effectSettings?.['Drop Shadow']?.x ?? 2,
    'data-effect-drop-shadow-y': effectSettings?.['Drop Shadow']?.y ?? 2,
    'data-effect-drop-shadow-blur': effectSettings?.['Drop Shadow']?.blur ?? (props.isShape ? 0 : 1),
    'data-effect-inner-shadow-color': effectSettings?.['Inner Shadow']?.color ?? '#000000',
    'data-effect-inner-shadow-opacity': effectSettings?.['Inner Shadow']?.opacity ?? 35,
    'data-effect-inner-shadow-x': effectSettings?.['Inner Shadow']?.x ?? 2,
    'data-effect-inner-shadow-y': effectSettings?.['Inner Shadow']?.y ?? 2,
    'data-effect-inner-shadow-blur': effectSettings?.['Inner Shadow']?.blur ?? (props.isShape ? 0 : 1),
    'data-effect-blur-value': effectSettings?.['Blur']?.blur ?? 0.3,
    'data-effect-blur-clip': effectSettings?.['Blur']?.clipContent ? 'true' : 'false',
  };

  const handleUpdate = (page, layer, attr, value) => {
    if (attr.startsWith('data-effect-')) {
      if (attr === 'data-effect-drop-shadow') {
        if (setActiveEffects) setActiveEffects(p => value === 'true' ? [...new Set([...p, 'Drop Shadow'])] : p.filter(e => e !== 'Drop Shadow'));
        if (value === 'true' && setEffectSettings) {
          setEffectSettings(p => ({
            ...p,
            'Drop Shadow': {
              color: '#000000',
              opacity: 35,
              x: 2,
              y: 2,
              blur: props.isShape ? 0 : 1
            }
          }));
        }
      } else if (attr === 'data-effect-inner-shadow') {
        if (setActiveEffects) setActiveEffects(p => value === 'true' ? [...new Set([...p, 'Inner Shadow'])] : p.filter(e => e !== 'Inner Shadow'));
        if (value === 'true' && setEffectSettings) {
          setEffectSettings(p => ({
            ...p,
            'Inner Shadow': {
              color: '#000000',
              opacity: 35,
              x: 2,
              y: 2,
              blur: props.isShape ? 0 : 1
            }
          }));
        }
      } else if (attr === 'data-effect-blur') {
        if (setActiveEffects) setActiveEffects(p => value === 'true' ? [...new Set([...p, 'Blur'])] : p.filter(e => e !== 'Blur'));
        if (value === 'true' && setEffectSettings) {
          setEffectSettings(p => ({
            ...p,
            'Blur': {
              blur: 0.3,
              clipContent: false
            }
          }));
        }
      } else {
        let effectName = '';
        let setting = '';
        if (attr.startsWith('data-effect-drop-shadow-')) {
          effectName = 'Drop Shadow';
          setting = attr.replace('data-effect-drop-shadow-', '');
        } else if (attr.startsWith('data-effect-inner-shadow-')) {
          effectName = 'Inner Shadow';
          setting = attr.replace('data-effect-inner-shadow-', '');
        } else if (attr.startsWith('data-effect-blur-')) {
          effectName = 'Blur';
          setting = attr.replace('data-effect-blur-', '');
        }
        if (effectName && setEffectSettings) {
          if (setting === 'value') setting = 'blur';
          let finalValue;
          if (setting === 'clip') {
            setting = 'clipContent';
            finalValue = value === 'true';
          } else {
            finalValue = setting === 'color' ? value : (value === '' ? '' : parseFloat(value));
          }
          if (setting === 'blur' && typeof finalValue === 'number' && finalValue < 0) {
            finalValue = 0;
          }
          setEffectSettings(p => ({
            ...p,
            [effectName]: { ...p[effectName], [setting]: finalValue }
          }));
        }
      }
    }
  };

  const updateAttr = (attribute, value) => {
    handleUpdate(undefined, undefined, attribute, value);
    if (value === 'false' && attribute.startsWith('data-effect-')) {
      const effectId = attribute.replace('data-effect-', '');
      if (activeEffectPopupId === effectId) {
        setActiveEffectPopupId(null);
      }
    }
  };

  const handleScrub = (e, initialVal, updateFn, sensitivity = 5) => {
    handleScrubHelper(e, initialVal, updateFn, sensitivity);
  };

  const handleEffectRowClick = (target, effectId) => {
    const rowTarget = target.closest('.effect-row') || target;
    const rect = rowTarget.getBoundingClientRect();
    const popupHeight = effectId.includes('shadow') ? 350 : 220;
    const centerY = rect.top + (rect.height / 2) - (popupHeight / 2);
    const finalTop = Math.max(90, Math.min(centerY, window.innerHeight - popupHeight - 20));

    setEffectPopupPos({
      top: finalTop,
      right: `calc(100vw - ${rect.left}px + 0.1vw)`
    });
    setActiveEffectPopupId(effectId);
  };

  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (openSubSection === 'effect') {
      // Small timeout to wait for the accordion to expand
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 250);
    }
  }, [openSubSection]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeEffectPopupId) {
          setActiveEffectPopupId(null);
        }
      }
    };

    const handleClickOutside = (e) => {
      if (activeEffectPopupId) {
        // If the element that was clicked is no longer in the document (e.g. an icon replaced during render), ignore the click
        if (e.target && !document.contains(e.target)) {
          return;
        }

        const isEffectPopup = e.target.closest('.effect-popup-container');
        const isEffectRow = e.target.closest('.effect-row');
        const isPicker = e.target.closest('#deep-color-picker');
        if (!isEffectPopup && !isEffectRow && !isPicker) {
          setActiveEffectPopupId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeEffectPopupId]);


  const [shouldOpenPopupId, setShouldOpenPopupId] = React.useState(null);

  React.useEffect(() => {
    if (shouldOpenPopupId) {
      const isActive = pseudoProps[`data-effect-${shouldOpenPopupId}`] === 'true';
      if (isActive) {
        const rowTarget = document.getElementById(`effect-row-${shouldOpenPopupId}`);
        if (rowTarget) {
          handleEffectRowClick(rowTarget, shouldOpenPopupId);
        }
        setShouldOpenPopupId(null);
      }
    }
  }, [pseudoProps, shouldOpenPopupId]);

  return (
    <div ref={containerRef} className="flex flex-col space-y-[0.60vw] font-sans">
      <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm">
        <div
          onClick={() => setOpenSubSection(openSubSection === 'effect' ? null : 'effect')}
          className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openSubSection === 'effect' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
        >
          <div className="flex items-center gap-[0.5vw]">
            <span className={`font-semibold text-[0.85vw] ${openSubSection === 'effect' ? 'text-gray-900' : 'text-gray-500'}`}>Effect</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            {openSubSection === 'effect' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveEffectPopupId(null);
                  if (setActiveEffects) setActiveEffects([]);
                  updateAttr('data-effect-drop-shadow', 'false');
                  updateAttr('data-effect-inner-shadow', 'false');
                  updateAttr('data-effect-blur', 'false');
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors p-[0.1vw] cursor-pointer flex items-center justify-center"
                title="Reset Effects"
              >
                <Icon icon="ix:reset" width="1.1vw" height="1.1vw" style={{ strokeWidth: 2.5 }} />
              </button>
            )}
            <ChevronUp size="1vw" className={`transition-transform duration-200 ${openSubSection === 'effect' ? 'text-gray-900' : 'rotate-180 text-gray-500'}`} />
          </div>
        </div>

        <div className={`grid transition-all duration-150 ease-in-out ${openSubSection === 'effect' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-[1vw] space-y-[0.6vw]">
              {[
                { id: 'drop-shadow', label: 'Drop Shadow' },
                { id: 'inner-shadow', label: 'Inner Shadow' },
                { id: 'blur', label: 'Blur' }
              ].map(effect => {
                const isActive = pseudoProps[`data-effect-${effect.id}`] === 'true';
                return (
                  <div
                    key={effect.id}
                    id={`effect-row-${effect.id}`}
                    onClick={(e) => {
                      const target = e.currentTarget;
                      if (!isActive) {
                        setShouldOpenPopupId(effect.id);
                        updateAttr(`data-effect-${effect.id}`, 'true');
                      } else {
                        handleEffectRowClick(target, effect.id);
                      }
                    }}
                    className={`effect-row flex items-center justify-between px-[1vw] py-[0.8vw] bg-gray-50/50 rounded-[0.8vw] border transition-all group cursor-pointer ${activeEffectPopupId === effect.id ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <span className={`text-[0.85vw] font-semibold transition-colors ${activeEffectPopupId === effect.id ? 'text-indigo-600' : 'text-gray-800'}`}>{effect.label}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const target = e.currentTarget;
                        if (!isActive) {
                          setShouldOpenPopupId(effect.id);
                          updateAttr(`data-effect-${effect.id}`, 'true');
                        } else {
                          updateAttr(`data-effect-${effect.id}`, 'false');
                        }
                      }}
                      className={`transition-colors ${isActive ? 'text-red-500 hover:text-red-700' : 'text-gray-500 hover:text-indigo-600'}`}
                    >
                      {isActive ? <Trash2 size="1vw" /> : <Plus size="1vw" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {activeEffectPopupId && createPortal(
        <div
          className="effect-popup-container fixed z-[4000] w-[19vw] bg-white rounded-[1vw] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-gray-100 p-[1.2vw] animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: effectPopupPos.top,
            right: effectPopupPos.right
          }}
        >
          <div className="flex flex-col space-y-[1vw]">
            <div className="flex items-center gap-[0.5vw]">
              <span className="text-[0.9vw] font-semibold text-gray-800 whitespace-nowrap">
                {{
                  'drop-shadow': 'Drop Shadow',
                  'inner-shadow': 'Inner Shadow',
                  'blur': 'Blur'
                }[activeEffectPopupId]}
              </span>
              <div className="h-px flex-grow bg-gray-200"></div>
              <button
                onClick={() => {
                  setActiveEffectPopupId(null);
                  if (activeColorPicker?.includes('effect-')) {
                    if (setActiveColorPicker) setActiveColorPicker(null);
                    if (setShowDetailedPicker) setShowDetailedPicker(false);
                  }
                }}
                className="p-[0.3vw] hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
              >
                <X size="1.1vw" className="text-gray-400" />
              </button>
            </div>

            {activeEffectPopupId.includes('shadow') && (
              <>
                <div className="flex items-center">
                  <div
                    className={`w-[3.5vw] h-[3.5vw] mt-[0.5vw] rounded-[0.5vw] cursor-pointer shadow-sm border border-gray-100 flex-shrink-0 transition-all active:scale-95 ${activeColorPicker === `data-effect-${activeEffectPopupId}-color` ? 'border-gray-800 ' : 'hover:border-gray-300'}`}
                    style={{
                      backgroundColor: pseudoProps[`data-effect-${activeEffectPopupId}-color`] || '#000000'
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPickerPosition({ top: rect.top, right: window.innerWidth - rect.left + 15 });
                      if (setActiveColorPicker) setActiveColorPicker(`data-effect-${activeEffectPopupId}-color`);
                      if (setShowDetailedPicker) setShowDetailedPicker(true);
                    }}
                  />

                  <div className="flex-grow min-w-0 flex flex-col justify-center space-y-[0.4vw] w-full ml-[0.6vw]">
                    <div className="flex items-center gap-[0.3vw] w-full">
                      <span className="text-[0.8vw] font-semibold text-gray-800 w-[3vw] flex-shrink-0 text-left whitespace-nowrap">Code :</span>
                      <div className={`flex-grow flex items-center h-[2.2vw] bg-white border rounded-[0.5vw] px-[0.4vw] transition-all overflow-hidden ${activeColorPicker === `data-effect-${activeEffectPopupId}-color` ? 'border-indigo-500' : 'border-gray-200 hover:border-indigo-300'}`}>
                        <input
                          type="text"
                          value={(pseudoProps[`data-effect-${activeEffectPopupId}-color`] || '#000000').toUpperCase()}
                          onChange={(e) => updateAttr(`data-effect-${activeEffectPopupId}-color`, e.target.value)}
                          className="w-full bg-transparent outline-none text-[0.75vw] font-mono font-semibold text-gray-700 min-w-0"
                        />
                        <Pipette
                          size="0.9vw"
                          className="text-gray-400 flex-shrink-0 cursor-pointer hover:text-gray-600 transition-colors"
                          onClick={async () => {
                            if (!window.EyeDropper) return;
                            try {
                              const eyeDropper = new window.EyeDropper();
                              const result = await eyeDropper.open();
                              updateAttr(`data-effect-${activeEffectPopupId}-color`, result.sRGBHex);
                            } catch (e) {
                              console.log(e);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-[0.4vw] w-full">
                      <span
                        className="text-[0.8vw] font-medium text-gray-800 w-[3vw] flex-shrink-0 text-left whitespace-nowrap cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
                        onPointerDown={(e) => {
                          const currentVal = pseudoProps[`data-effect-${activeEffectPopupId}-opacity`] ?? 35;
                          handleScrub(e, currentVal, (val) => {
                            const clamped = Math.max(0, Math.min(100, parseInt(val)));
                            updateAttr(`data-effect-${activeEffectPopupId}-opacity`, clamped.toString());
                          });
                        }}
                      >Opacity :</span>
                      <div className="flex-grow flex items-center gap-[0.4vw] min-w-0">
                        <div className="flex-1 flex items-center h-[1.5vw] rounded-full outline-none">
                          <input
                            type="range"
                            min="0" max="100"
                            value={pseudoProps[`data-effect-${activeEffectPopupId}-opacity`] ?? 35}
                            onChange={(e) => updateAttr(`data-effect-${activeEffectPopupId}-opacity`, e.target.value)}
                            className="w-full cursor-pointer custom-range-slider"
                            style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${pseudoProps[`data-effect-${activeEffectPopupId}-opacity`] ?? 35}%, #E2E8F0 ${pseudoProps[`data-effect-${activeEffectPopupId}-opacity`] ?? 35}%, #E2E8F0 100%)` }}
                          />
                        </div>
                        <span className="text-[0.75vw] font-semibold text-gray-800 min-w-[2vw] text-left whitespace-nowrap flex-shrink-0 select-none">
                          {pseudoProps[`data-effect-${activeEffectPopupId}-opacity`] ?? 35}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-[0.5vw] pt-[0.5vw]">
                  <div className="grid grid-cols-2 gap-x-[0.3vw] gap-y-[1vw]">
                    {[
                      { id: 'top', label: 'Top', baseId: 'y', factor: -1, default: 0 },
                      { id: 'right', label: 'Right', baseId: 'x', factor: 1, default: 2 },
                      { id: 'left', label: 'Left', baseId: 'x', factor: -1, default: 0 },
                      { id: 'bottom', label: 'Bottom', baseId: 'y', factor: 1, default: 2 }
                    ].map((row) => {
                      let currentVal = pseudoProps[`data-effect-${activeEffectPopupId}-${row.baseId}`] ?? row.default;
                      let displayVal = currentVal;

                      if (row.id === 'top' || row.id === 'left') {
                        displayVal = Math.max(0, -currentVal);
                      } else if (row.id === 'bottom' || row.id === 'right') {
                        displayVal = Math.max(0, currentVal);
                      }

                      const updateVal = (val) => {
                        let numVal = parseInt(val);
                        if (isNaN(numVal)) numVal = 0;
                        numVal = Math.max(0, numVal);
                        updateAttr(`data-effect-${activeEffectPopupId}-${row.baseId}`, (numVal * row.factor).toString());
                      };

                      return (
                        <div key={row.id} className="flex items-center">
                          <span
                            className={`text-[0.8vw] font-medium text-gray-800 ${row.id === 'top' || row.id === 'left' ? 'w-[1.8vw]' : 'w-[2.8vw]'} flex-shrink-0 cursor-ew-resize select-none hover:text-indigo-600 transition-colors`}
                            onPointerDown={(e) => {
                              handleScrub(e, displayVal, updateVal);
                            }}
                          >{row.label}</span>
                          <div className="flex items-center justify-center gap-[0.3vw]">
                            <ChevronLeft
                              size="1vw"
                              className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors flex-shrink-0"
                              onClick={() => updateVal(displayVal - 1)}
                            />
                            <div
                              className="w-[3.5vw] h-[2vw] min-w-[3vw] border border-gray-100 rounded-[0.4vw] flex items-center justify-center bg-gray-50/50 shadow-sm hover:border-indigo-200 transition-all cursor-ew-resize select-none"
                              onPointerDown={(e) => {
                                if (e.target.tagName === 'INPUT') return;
                                handleScrubHelper(e, displayVal, updateVal);
                              }}
                            >
                              <input
                                type="number"
                                value={displayVal}
                                onChange={(e) => updateVal(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-center text-[0.8vw] font-semibold text-gray-800 outline-none no-spin bg-transparent cursor-text"
                              />
                            </div>
                            <ChevronRight
                              size="1vw"
                              className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors flex-shrink-0"
                              onClick={() => updateVal(displayVal + 1)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {[
                    { id: 'blur', label: 'Blur % :', baseId: 'blur', factor: 1, default: 1 }
                  ].map((row) => {
                    let currentVal = pseudoProps[`data-effect-${activeEffectPopupId}-${row.baseId}`] ?? row.default;
                    let displayVal = currentVal;

                    const updateVal = (val) => {
                      let numVal = parseInt(val);
                      if (isNaN(numVal)) numVal = 0;
                      updateAttr(`data-effect-${activeEffectPopupId}-${row.baseId}`, (numVal * row.factor).toString());
                    };

                    return (
                      <div key={row.id} className="flex items-center pt-[0.4vw]">
                        <span
                          className="text-[0.8vw] font-medium text-gray-800 w-[5.5vw] cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
                          onPointerDown={(e) => {
                            handleScrub(e, displayVal, updateVal);
                          }}
                        >{row.label}</span>
                        <div className="flex items-center justify-center gap-[0.8vw] flex-grow">
                          <ChevronLeft
                            size="1vw"
                            className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                            onClick={() => updateVal(displayVal - 1)}
                          />
                          <div
                            className="w-[4.5vw] h-[2.2vw] border border-gray-100 rounded-[0.4vw] flex items-center justify-center bg-gray-50/50 shadow-sm hover:border-indigo-200 transition-all cursor-ew-resize select-none"
                            onPointerDown={(e) => {
                              if (e.target.tagName === 'INPUT') return;
                              handleScrubHelper(e, displayVal, updateVal);
                            }}
                          >
                            <input
                              type="number"
                              value={displayVal}
                              onChange={(e) => updateVal(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-center text-[0.85vw] font-semibold text-gray-800 outline-none no-spin bg-transparent cursor-text"
                            />
                          </div>
                          <ChevronRight
                            size="1vw"
                            className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                            onClick={() => updateVal(displayVal + 1)}
                          />
                        </div>
                        <div className="w-[0.5vw]"></div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {activeEffectPopupId === 'blur' && (
              <div className="space-y-[0.8vw] pt-[0.2vw]">
                {[
                  { id: 'value', label: 'Blur % :', default: 0.3, step: 0.1, displayMultiplier: 10 }
                ].map((row) => {
                  const rawVal = parseFloat(pseudoProps[`data-effect-${activeEffectPopupId}-${row.id}`] ?? row.default);
                  const displayVal = row.displayMultiplier ? Math.round(rawVal * row.displayMultiplier) : rawVal;

                  return (
                    <div key={row.id} className="flex items-center">
                      <span
                        className="text-[0.8vw] font-medium text-gray-800 w-[5.5vw] cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
                        onPointerDown={(e) => {
                          handleScrub(e, displayVal, (val) => {
                            const finalVal = row.displayMultiplier ? val / row.displayMultiplier : val;
                            updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, finalVal);
                          });
                        }}
                      >{row.label}</span>
                      <div className="flex items-center justify-center gap-[0.8vw] flex-grow">
                        <ChevronLeft
                          size="1vw"
                          className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                          onClick={() => {
                            const val = parseFloat(pseudoProps[`data-effect-${activeEffectPopupId}-${row.id}`] ?? row.default);
                            const step = row.step || 1;
                            const newVal = Math.max(0, val - step);
                            updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, newVal.toFixed(1).replace(/\.0$/, ''));
                          }}
                        />
                        <div
                          className="w-[4.5vw] h-[2.2vw] border border-gray-100 rounded-[0.4vw] flex items-center justify-center bg-gray-50/50 shadow-sm hover:border-indigo-200 transition-all cursor-ew-resize select-none"
                          onPointerDown={(e) => {
                            if (e.target.tagName === 'INPUT') return;
                            handleScrubHelper(e, displayVal, (val) => {
                              const finalVal = row.displayMultiplier ? val / row.displayMultiplier : val;
                              updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, finalVal);
                            });
                          }}
                        >
                          <input
                            type="number"
                            step={row.displayMultiplier ? 1 : (row.step || 1)}
                            value={displayVal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (isNaN(val)) return;
                              const finalVal = row.displayMultiplier ? val / row.displayMultiplier : val;
                              updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, finalVal);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-center text-[0.85vw] font-semibold text-gray-800 outline-none no-spin bg-transparent cursor-text"
                          />
                        </div>
                        <ChevronRight
                          size="1vw"
                          className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                          onClick={() => {
                            const val = parseFloat(pseudoProps[`data-effect-${activeEffectPopupId}-${row.id}`] ?? row.default);
                            const step = row.step || 1;
                            const newVal = val + step;
                            updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, newVal.toFixed(1).replace(/\.0$/, ''));
                          }}
                        />
                      </div>
                      <div className="w-[0.5vw]"></div>
                    </div>
                  )
                })}

                <div className="h-px bg-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ml-[-1.2vw] mr-[-1.2vw] mt-[2vw] mb-[0.5vw]"></div>
                <div className={`flex items-center justify-between pt-[0.4vw] transition-opacity ${parseFloat(pseudoProps['data-effect-blur-value'] || 0) === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span className="text-[0.8vw] font-medium text-gray-800">Clip Content</span>
                  <button
                    onClick={() => {
                      if (parseFloat(pseudoProps['data-effect-blur-value'] || 0) === 0) return;
                      const currentVal = pseudoProps['data-effect-blur-clip'] === 'true';
                      updateAttr('data-effect-blur-clip', (!currentVal).toString());
                    }}
                    className={`relative block w-[2.2vw] h-[1.2vw] rounded-full transition-colors duration-200 ease-in-out outline-none shrink-0 cursor-pointer ${pseudoProps['data-effect-blur-clip'] === 'true' ? 'bg-[#4D47FF]' : 'bg-gray-300'
                      }`}
                  >
                    <div className={`absolute top-[0.1vw] w-[1vw] h-[1vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_1px_3px_rgba(0,0,0,0.2)] ${pseudoProps['data-effect-blur-clip'] === 'true' ? 'left-[1.1vw]' : 'left-[0.1vw]'
                      }`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {activeColorPicker && activeColorPicker.includes('effect-') && createPortal(
        <div
          className="fixed z-[5000]"
          style={{
            top: '50%',
            right: '10vw',
            transform: 'translateY(-50%)'
          }}
        >
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <ColorPicker
              color={pseudoProps[activeColorPicker] || '#000000'}
              onChange={(newVal) => updateAttr(activeColorPicker, newVal)}
              onClose={() => {
                if (setActiveColorPicker) setActiveColorPicker(null);
                if (setShowDetailedPicker) setShowDetailedPicker(false);
              }}
            />
          </div>
        </div>,
        document.body
      )}

      <style>{`
        input[type="range"].custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
        input[type="range"].custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
        input[type="range"].custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        input[type="range"].custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none !important; height: 1vw !important; width: 1vw !important; border-radius: 50% !important; background: #4D47FF !important; border: 0.02vw solid #ffffff !important; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4) !important; margin-top: -0.4vw !important; cursor: pointer !important; transition: box-shadow 0.15s ease !important; position: relative; z-index: 2; }
        input[type="range"].custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6) !important; }
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

export default Effect;