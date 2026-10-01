import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ColorPicker from './ColorPicker';
import { ChevronLeft, ChevronRight, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, List, ListOrdered, Minus, ChevronDown, PencilLine } from 'lucide-react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';


const TooltipCustomization = ({
  selectedElementProps,
  activePageIndex,
  selectedLayerId,
  updateElementAttribute
}) => {
  const defaultSettings = {
    text: '',
    w: 100,
    h: 60,
    animation: 'Default',
    speed: 'Medium',
    fontFamily: 'Poppins',
    fontWeight: 'Regular',
    fontSize: 14,
    isWidthAuto: true,
    isHeightAuto: true,
    align: 'center',
    bold: false,
    italic: false,
    underline: false,
    lineThrough: false,
    textTransform: 'none',
    listStyleType: 'none',
    textColor: '#ffffff',
    bgColor: '#1a1a1a',
    shape: 'bottom-center'
  };

  const [settings, setSettings] = useState(defaultSettings);
  const [localText, setLocalText] = useState(defaultSettings.text);
  const [activePanel, setActivePanel] = useState(null);
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'textColor' | 'bgColor' | null
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });
  const [shapePopupPosition, setShapePopupPosition] = useState({ top: 0, left: 0 });
  const [animTrigger, setAnimTrigger] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Re-open when layer changes
  useEffect(() => {
    setIsVisible(true);
  }, [selectedLayerId]);

  // Re-open when the tooltip interaction shape is clicked on the right panel
  useEffect(() => {
    const handleSelectLayer = (e) => {
      if (e.detail?.layerId === selectedLayerId) {
        setIsVisible(true);
      }
    };
    window.addEventListener('select-layer', handleSelectLayer);
    return () => window.removeEventListener('select-layer', handleSelectLayer);
  }, [selectedLayerId]);

  // Hide when the interaction card collapses
  useEffect(() => {
    const handleHide = () => setIsVisible(false);
    window.addEventListener('hide-tooltip-customization', handleHide);
    return () => window.removeEventListener('hide-tooltip-customization', handleHide);
  }, []);

  useEffect(() => {
    setAnimTrigger(prev => prev + 1);
  }, [
    settings.animation,
    settings.speed,
    settings.shape,
    settings.textColor,
    settings.bgColor,
    settings.text,
    settings.bold,
    settings.italic,
    settings.underline,
    settings.lineThrough,
    settings.fontSize,
    settings.fontFamily,
    settings.align
  ]);

  const alignmentRef = useRef(null);
  const styleRef = useRef(null);
  const caseRef = useRef(null);
  const listRef = useRef(null);
  const shapePopupRef = useRef(null);

  const togglePanel = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  const handleShapePopupToggle = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = {
      top: Math.max(20, Math.min(rect.top - 10, window.innerHeight - 200)),
      left: rect.right + 12
    };
    setShapePopupPosition(pos);
    setActivePanel(activePanel === 'shape' ? null : 'shape');
  };

  const debounceTimerRef = useRef(null);

  // Close panels when clicking outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActivePanel(null);
        setActiveColorPicker(null);
      }
    };

    const handleClickOutside = (event) => {
      if (
        activePanel &&
        !event.target.closest('.alignment-trigger') &&
        !event.target.closest('.style-trigger') &&
        !event.target.closest('.case-trigger') &&
        !event.target.closest('.list-trigger') &&
        !event.target.closest('.shape-trigger') &&
        !alignmentRef.current?.contains(event.target) &&
        !styleRef.current?.contains(event.target) &&
        !caseRef.current?.contains(event.target) &&
        !listRef.current?.contains(event.target) &&
        !shapePopupRef.current?.contains(event.target)
      ) {
        setActivePanel(null);
      }

      if (activeColorPicker) {
        const isTrigger = event.target.closest('.color-box-trigger');
        const isPicker = event.target.closest('.color-picker-container');
        if (!isTrigger && !isPicker) {
          setActiveColorPicker(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePanel, activeColorPicker]);

  // Sync settings ONLY when the selected element changes (not on every parent re-render)
  // selectedElementProps is a new object literal every render, so using it as a dep
  // caused the shape to reset after every TemplateEditor re-render.
  useEffect(() => {
    if (selectedElementProps?.['data-tooltip-settings']) {
      try {
        const parsed = JSON.parse(selectedElementProps['data-tooltip-settings']);
        const merged = { ...defaultSettings, ...parsed };
        setSettings(merged);
        setLocalText(merged.text || '');
      } catch (e) {
        console.error("Failed to parse data-tooltip-settings:", e);
      }
    } else {
      setSettings(defaultSettings);
      setLocalText(defaultSettings.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayerId]); // Only sync when the element itself changes

  const updateSetting = (key, value, immediate = false) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (key === 'text') {
      setLocalText(value);
    }

    if (immediate) {
      // Cancel any pending debounced save and save immediately
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (updateElementAttribute && selectedLayerId) {
        updateElementAttribute(activePageIndex, selectedLayerId, {
          'data-tooltip-settings': JSON.stringify(newSettings)
        });
      }
      return;
    }

    // Debounce for text/number inputs to avoid excessive SVG writes
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (updateElementAttribute && selectedLayerId) {
        updateElementAttribute(activePageIndex, selectedLayerId, {
          'data-tooltip-settings': JSON.stringify(newSettings)
        });
      }
    }, 800);
  };

  const handleDragStart = (e, settingKey, inputEl = null) => {
    e.preventDefault();
    const startX = e.clientX;
    const startVal = settings[settingKey] || 0;
    const startSettings = settings;
    let hasMoved = false;

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      if (Math.abs(deltaX) > 3) {
        hasMoved = true;
      }

      const newVal = Math.max(10, startVal + deltaX);
      const nextSettings = { ...startSettings, [settingKey]: newVal };

      // Update local state smoothly during drag
      setSettings(nextSettings);
    };

    const handleMouseUp = (moveEvent) => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (!hasMoved && inputEl) {
        inputEl.focus();
        inputEl.select();
        return;
      }

      const deltaX = moveEvent.clientX - startX;
      const finalVal = Math.max(10, startVal + deltaX);
      const nextSettings = { ...startSettings, [settingKey]: finalVal };

      setSettings(nextSettings);

      // Update canvas only when drag ends, delay slightly to let cursor repaint
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (updateElementAttribute && selectedLayerId) {
          updateElementAttribute(activePageIndex, selectedLayerId, {
            'data-tooltip-settings': JSON.stringify(nextSettings)
          });
        }
      }, 50);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const applyListFormatting = (text, listType) => {
    if (!text) return text;
    const lines = text.split('\n');
    const cleanedLines = lines.map(line => {
      return line.replace(/^[\u2022\-\*]\s*/, '').replace(/^\d+\.\s*/, '');
    });

    if (listType === 'disc') {
      return cleanedLines.map(line => `• ${line}`).join('\n');
    } else if (listType === 'square') {
      return cleanedLines.map(line => `- ${line}`).join('\n');
    } else if (listType === 'decimal') {
      return cleanedLines.map((line, idx) => `${idx + 1}. ${line}`).join('\n');
    } else {
      return cleanedLines.join('\n');
    }
  };

  const handleListStyleChange = (type) => {
    const isCurrentlyActive = settings.listStyleType === type;
    const targetType = isCurrentlyActive ? 'none' : type;
    const formattedText = applyListFormatting(settings.text, targetType);

    const newSettings = {
      ...settings,
      listStyleType: targetType,
      text: formattedText
    };
    setSettings(newSettings);
    setLocalText(formattedText);

    if (updateElementAttribute && selectedLayerId) {
      updateElementAttribute(activePageIndex, selectedLayerId, {
        'data-tooltip-settings': JSON.stringify(newSettings)
      });
    }
    setActivePanel(null);
  };

  const colorsOnPage = React.useMemo(() => {
    let doc = document.getElementById('main-flipbook-editor')?.contentDocument;
    if (!doc) {
      doc = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`) || document;
    }
    const elements = doc.querySelectorAll('[data-fill-color], [data-stroke-color], [data-tooltip-settings]');
    const colors = new Set();
    elements.forEach(el => {
      const fill = el.getAttribute('data-fill-color');
      const stroke = el.getAttribute('data-stroke-color');
      if (fill && fill !== 'none' && fill !== '#' && !fill.includes('gradient')) colors.add(fill.toUpperCase());
      if (stroke && stroke !== 'none' && stroke !== '#' && !stroke.includes('gradient')) colors.add(stroke.toUpperCase());

      const ttSettings = el.getAttribute('data-tooltip-settings');
      if (ttSettings) {
        try {
          const parsed = JSON.parse(ttSettings);
          if (parsed.textColor) colors.add(parsed.textColor.toUpperCase());
          if (parsed.bgColor) colors.add(parsed.bgColor.toUpperCase());
        } catch (e) { }
      }
    });
    colors.add('#FFFFFF');
    colors.add('#000000');
    return Array.from(colors).slice(0, 12);
  }, [activePageIndex, selectedLayerId]);

  const handleColorPickerToggle = (e, pickerType) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const popupHeight = 280;

    const pos = {
      top: Math.max(90, Math.min(rect.top - 90, window.innerHeight - popupHeight - 20)),
      right: `calc(100vw - ${rect.left}px + 0.5vw)`
    };

    setPickerPosition(pos);
    setActiveColorPicker(activeColorPicker === pickerType ? null : pickerType);
  };

  if (!isVisible) return null;

  return (
    <div
      className="bg-white border-r border-[#EEEEEE] flex flex-col select-none flex-shrink-0 h-[92vh] overflow-y-auto no-scrollbar"
      style={{ width: '18vw' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-[1.2vw] py-[1.8vh] border-b border-gray-150 bg-white">
        <span className="text-[1vw] font-bold text-gray-900 tracking-tight">Tooltip Customization</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors p-[0.3vw] rounded-full hover:bg-gray-100 cursor-pointer flex items-center justify-center"
          title="Go Back"
        >
          <ChevronLeft size="1.2vw" />
        </button>
      </div>

      <div className="flex flex-col gap-[2.2vh] p-[1.2vw]">
        {/* Visual Box Tooltip Preview */}
        <div
          onMouseEnter={() => setAnimTrigger(prev => prev + 1)}
          className="w-full h-[14.5vh] border border-gray-200 rounded-[0.8vw] bg-white flex items-center justify-center shadow-sm relative group"
        >
          {/* Swap/Flip shape icon top-right */}
          <button
            onClick={handleShapePopupToggle}
            className="shape-trigger absolute top-[0.6vw] right-[0.6vw] text-gray-800 hover:text-[#5145F6] hover:bg-gray-100 p-[0.35vw] rounded-full transition-colors cursor-pointer flex items-center justify-center"
            title="Tooltip Shape Direction"
          >
            <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M16 3l4 4-4 4M20 17H4M8 13l-4 4 4 4" />
            </svg>
          </button>

          {/* Floating Shape Selection Popup */}
          {activePanel === 'shape' && createPortal(
            <div
              ref={shapePopupRef}
              className="p-[0.8vw] bg-white/80 backdrop-blur-md rounded-[0.8vw] shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-gray-200 w-[19vw] flex flex-col gap-[0.8vh]"
              style={{
                position: 'fixed',
                top: shapePopupPosition.top + 'px',
                left: shapePopupPosition.left + 'px',
                zIndex: 5000
              }}
            >
              <div className="text-gray-800 text-[0.8vw] font-bold tracking-tight px-[0.2vw] mb-[0.2vh]">
                Tooltip Shape
              </div>
              <div className="grid grid-cols-3 gap-[0.5vw]">
                {[
                  // Row 1: Bottom Tail
                  { id: 'bottom-left', label: 'Bottom Left', type: 'bottom', align: 'left' },
                  { id: 'bottom-center', label: 'Bottom Centered', type: 'bottom', align: 'center' },
                  { id: 'bottom-right', label: 'Bottom Right', type: 'bottom', align: 'right' },
                  // Row 2: Top Tail
                  { id: 'top-left', label: 'Top Left', type: 'top', align: 'left' },
                  { id: 'top-center', label: 'Top Centered', type: 'top', align: 'center' },
                  { id: 'top-right', label: 'Top Right', type: 'top', align: 'right' },
                  // Row 3: Right Tail
                  { id: 'right-top', label: 'Right Top', type: 'right', align: 'top' },
                  { id: 'right-center', label: 'Right Centered', type: 'right', align: 'center' },
                  { id: 'right-bottom', label: 'Right Bottom', type: 'right', align: 'bottom' },
                  // Row 4: Left Tail
                  { id: 'left-top', label: 'Left Top', type: 'left', align: 'top' },
                  { id: 'left-center', label: 'Left Centered', type: 'left', align: 'center' },
                  { id: 'left-bottom', label: 'Left Bottom', type: 'left', align: 'bottom' }
                ].map(sh => {
                  const isActive = (settings.shape || 'bottom-center') === sh.id;
                  const isCol = sh.type === 'bottom' || sh.type === 'top';
                  let tailAlign = {};
                  if (isCol) {
                    if (sh.align === 'left') tailAlign = { alignSelf: 'flex-start', marginLeft: '10px' };
                    if (sh.align === 'center') tailAlign = { alignSelf: 'center' };
                    if (sh.align === 'right') tailAlign = { alignSelf: 'flex-end', marginRight: '10px' };
                  } else {
                    if (sh.align === 'top') tailAlign = { alignSelf: 'flex-start', marginTop: '6px' };
                    if (sh.align === 'center') tailAlign = { alignSelf: 'center' };
                    if (sh.align === 'bottom') tailAlign = { alignSelf: 'flex-end', marginBottom: '6px' };
                  }

                  const shapeColor = '#1A1A1A';

                  return (
                    <button
                      key={sh.id}
                      onClick={() => {
                        updateSetting('shape', sh.id, true);
                        setActivePanel(null);
                      }}
                      className={`flex flex-col items-center justify-center h-[9.0vh] rounded-[0.6vw] border cursor-pointer transition-all ${isActive
                        ? 'border-[#5145F6] bg-[#5145F6]/5 text-[#5145F6] font-semibold shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {/* Mini visual representation */}
                      <div className="flex-grow flex items-center min-h-[6vh] w-full px-[0.4vw]">
                        <div className={`flex items-center ${isCol ? 'flex-col' : 'flex-row'}`}>
                          {/* Top/Left mini tail */}
                          {(sh.type === 'top' || sh.type === 'left') && (
                            <div
                              style={{
                                width: 0,
                                height: 0,
                                borderLeft: sh.type === 'top' ? '9px solid transparent' : 'none',
                                borderRight: sh.type === 'top' ? '9px solid transparent' : `11px solid ${shapeColor}`,
                                borderTop: sh.type === 'top' ? 'none' : '9px solid transparent',
                                borderBottom: sh.type === 'top' ? `11px solid ${shapeColor}` : '9px solid transparent',
                                marginRight: sh.type === 'left' ? '-2px' : '0',
                                marginBottom: sh.type === 'top' ? '-2px' : '0',
                                ...tailAlign
                              }}
                            />
                          )}

                          {/* Mini bubble - black tooltip shape */}
                          <div
                            className="w-[4.8vw] h-[5vh] rounded-[0.35vw] transition-all flex items-center justify-center"
                            style={{
                              backgroundColor: shapeColor
                            }}
                          >
                            <div className="w-[2.6vw] h-[3px] bg-white/40 rounded-full" />
                          </div>

                          {/* Bottom/Right mini tail */}
                          {(sh.type === 'bottom' || sh.type === 'right') && (
                            <div
                              style={{
                                width: 0,
                                height: 0,
                                borderLeft: sh.type === 'right' ? `11px solid ${shapeColor}` : '9px solid transparent',
                                borderRight: sh.type === 'right' ? 'none' : '9px solid transparent',
                                borderTop: sh.type === 'right' ? '9px solid transparent' : `11px solid ${shapeColor}`,
                                borderBottom: sh.type === 'right' ? '9px solid transparent' : 'none',
                                marginLeft: sh.id === 'right' || sh.type === 'right' ? '-2px' : '0',
                                marginTop: sh.type === 'bottom' ? '-2px' : '0',
                                ...tailAlign
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )}

          {/* Centered Oriented Tooltip Visual */}
          {(() => {
            const shapeStr = settings.shape || 'bottom-center';
            const parts = shapeStr.split('-');
            const shapeDir = parts[0] || 'bottom';
            const shapeAlign = parts[1] || 'center';

            const isTopOrLeft = shapeDir === 'top' || shapeDir === 'left';
            const isBottomOrRight = shapeDir === 'bottom' || shapeDir === 'right';

            let alignSelfVal = 'center';
            if (shapeDir === 'top' || shapeDir === 'bottom') {
              if (shapeAlign === 'left') alignSelfVal = 'flex-start';
              if (shapeAlign === 'right') alignSelfVal = 'flex-end';
            } else {
              if (shapeAlign === 'top') alignSelfVal = 'flex-start';
              if (shapeAlign === 'bottom') alignSelfVal = 'flex-end';
            }

            const durationMap = {
              'Slow': 0.8,
              'Medium': 0.5,
              'Fast': 0.25
            };
            const speedStr = (settings.speed || 'Medium').toLowerCase();
            const duration = durationMap[settings.speed || 'Medium'] || 0.5;

            let animVariants = {
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { duration, ease: [0.16, 1, 0.3, 1] } }
            };

            if (settings.animation === 'Default') {
              animVariants = {
                initial: { opacity: 1 },
                animate: { opacity: 1, transition: { duration: 0 } }
              };
            } else if (settings.animation === 'Slide Up') {
              animVariants = {
                initial: { opacity: 0, y: 24 },
                animate: { opacity: 1, y: 0, transition: { duration, ease: [0.16, 1, 0.3, 1] } }
              };
            } else if (settings.animation === 'Zoom In') {
              animVariants = {
                initial: { opacity: 0, scale: 0.7 },
                animate: { opacity: 1, scale: 1, transition: { duration, ease: [0.16, 1, 0.3, 1] } }
              };
            } else if (settings.animation === 'Bounce In') {
              const getBounceTransition = (s) => {
                if (s === 'slow') return { type: 'spring', stiffness: 60, damping: 10, mass: 1.2 };
                if (s === 'fast') return { type: 'spring', stiffness: 180, damping: 15, mass: 0.8 };
                return { type: 'spring', stiffness: 100, damping: 12, mass: 1.0 };
              };
              animVariants = {
                initial: { opacity: 0, scale: 0.4 },
                animate: {
                  opacity: 1,
                  scale: 1,
                  transition: getBounceTransition(speedStr)
                }
              };
            }

            const translucentBgColor = (settings.bgColor && settings.bgColor.startsWith('#') && settings.bgColor.length === 7) 
              ? `${settings.bgColor}CC` 
              : settings.bgColor;

            return (
              <div
                className={`flex select-none transition-all duration-200 ${shapeDir === 'top' ? 'flex-col items-center' :
                  shapeDir === 'left' ? 'flex-row items-center' :
                    shapeDir === 'right' ? 'flex-row items-center' :
                      'flex-col items-center'
                  }`}
                style={{ maxWidth: '85%' }}
              >
                {/* Left/Top Tail */}
                {isTopOrLeft && (
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: shapeDir === 'top' ? '0.4vw solid transparent' : 'none',
                      borderRight: shapeDir === 'top' ? '0.4vw solid transparent' : `0.5vw solid ${translucentBgColor}`,
                      borderTop: shapeDir === 'top' ? 'none' : '0.4vw solid transparent',
                      borderBottom: shapeDir === 'top' ? `0.5vw solid ${translucentBgColor}` : '0.4vw solid transparent',
                      alignSelf: alignSelfVal,
                      marginLeft: shapeDir === 'top' && shapeAlign === 'left' ? '0.8vw' : '0',
                      marginRight: shapeDir === 'top' && shapeAlign === 'right' ? '0.8vw' : (shapeDir === 'left' ? '-1px' : '0'),
                      marginTop: shapeDir === 'left' && shapeAlign === 'top' ? '0.4vh' : '0',
                      marginBottom: shapeDir === 'left' && shapeAlign === 'bottom' ? '0.4vh' : (shapeDir === 'top' ? '-1px' : '0'),
                      order: 0
                    }}
                  />
                )}

                {/* Tooltip Bubble */}
                <div
                  className="rounded-[0.5vw] py-[0.6vh] px-[1.2vw] shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-200 flex items-center justify-center backdrop-blur-md"
                  style={{
                    backgroundColor: translucentBgColor,
                    color: settings.textColor,
                    fontFamily: settings.fontFamily,
                    fontWeight: settings.bold ? 'bold' : (settings.fontWeight === 'Medium' ? '500' : settings.fontWeight === 'SemiBold' ? '600' : settings.fontWeight === 'Bold' ? '700' : 'normal'),
                    fontStyle: settings.italic ? 'italic' : 'normal',
                    fontSize: `${Math.max(9, settings.fontSize - 3)}px`,
                    textAlign: settings.align,
                    textDecoration: `${settings.underline ? 'underline ' : ''}${settings.lineThrough ? 'line-through' : ''}`.trim() || 'none',
                    textTransform: settings.textTransform || 'none',
                    width: settings.isWidthAuto ? 'auto' : `${settings.w}px`,
                    minWidth: settings.isWidthAuto ? 'max-content' : undefined,
                    height: settings.isHeightAuto ? 'auto' : `${settings.h}px`,
                    minHeight: 'auto',
                    wordBreak: settings.isWidthAuto ? 'normal' : 'break-word',
                    whiteSpace: settings.isWidthAuto ? 'nowrap' : 'pre-wrap',
                    order: 1
                  }}
                >
                  <div
                    style={{
                      width: settings.isWidthAuto ? 'auto' : '100%',
                      height: settings.isHeightAuto ? 'auto' : '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: settings.align === 'left' ? 'flex-start' : settings.align === 'right' ? 'flex-end' : 'center',
                      textAlign: settings.align,
                      wordBreak: settings.isWidthAuto ? 'normal' : 'break-word',
                      whiteSpace: settings.isWidthAuto ? 'nowrap' : 'pre-wrap'
                    }}
                  >
                    {localText || 'Tooltip'}
                  </div>
                </div>

                {/* Right/Bottom Tail */}
                {isBottomOrRight && (
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: shapeDir === 'right' ? `0.5vw solid ${translucentBgColor}` : '0.4vw solid transparent',
                      borderRight: shapeDir === 'right' ? 'none' : '0.4vw solid transparent',
                      borderTop: shapeDir === 'right' ? '0.4vw solid transparent' : `0.5vw solid ${translucentBgColor}`,
                      borderBottom: shapeDir === 'right' ? '0.4vw solid transparent' : 'none',
                      alignSelf: alignSelfVal,
                      marginLeft: shapeDir === 'bottom' && shapeAlign === 'left' ? '0.8vw' : (shapeDir === 'right' ? '-1px' : '0'),
                      marginRight: shapeDir === 'bottom' && shapeAlign === 'right' ? '0.8vw' : '0',
                      marginTop: shapeDir === 'right' && shapeAlign === 'top' ? '0.4vh' : '0',
                      marginBottom: shapeDir === 'right' && shapeAlign === 'bottom' ? '0.4vh' : '0',
                      order: 2
                    }}
                  />
                )}
              </div>
            );
          })()}
        </div>

        {/* W & H Controls */}
        <div className="flex items-center justify-between gap-[0.5vw] px-[0.2vw] select-none">
          {/* Width */}
          <div className="flex items-center gap-[0.4vw]">
            <span
              onMouseDown={(e) => handleDragStart(e, 'w')}
              className="text-[0.8vw] font-bold text-gray-500 cursor-ew-resize select-none hover:text-[#5145F6] transition-colors p-[0.2vw]"
              title="Drag horizontally to adjust Width"
            >
              W
            </span>
            <div className="flex items-center gap-[0.1vw]">
              <button
                onClick={() => updateSetting('w', Math.max(10, settings.w - 5), true)}
                className="text-gray-400 hover:text-[#5145F6] transition-colors p-[0.1vw]"
              >
                <ChevronLeft size="1vw" />
              </button>
              <div
                onMouseDown={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  if (document.activeElement === input) return;
                  handleDragStart(e, 'w', input);
                }}
                className="w-[3.5vw] h-[3.2vh] border border-gray-200 rounded-[0.4vw] bg-white flex items-center justify-between px-[0.4vw] shadow-sm cursor-ew-resize"
              >
                <input
                  type="number"
                  className="w-full text-center bg-transparent outline-none text-[#111827] text-[0.75vw] font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-ew-resize"
                  value={settings.w}
                  onChange={(e) => updateSetting('w', parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                />
                <span className="text-gray-400 text-[0.7vw] font-bold select-none pointer-events-none">↔</span>
              </div>
              <button
                onClick={() => updateSetting('w', settings.w + 5, true)}
                className="text-gray-400 hover:text-[#5145F6] transition-colors p-[0.1vw]"
              >
                <ChevronRight size="1vw" />
              </button>
            </div>
          </div>

          {/* Height */}
          <div className="flex items-center gap-[0.4vw]">
            <span
              onMouseDown={(e) => handleDragStart(e, 'h')}
              className="text-[0.8vw] font-bold text-gray-500 cursor-ew-resize select-none hover:text-[#5145F6] transition-colors p-[0.2vw]"
              title="Drag horizontally to adjust Height"
            >
              H
            </span>
            <div className="flex items-center gap-[0.1vw]">
              <button
                onClick={() => updateSetting('h', Math.max(10, settings.h - 5), true)}
                className="text-gray-400 hover:text-[#5145F6] transition-colors p-[0.1vw]"
              >
                <ChevronLeft size="1vw" />
              </button>
              <div
                onMouseDown={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  if (document.activeElement === input) return;
                  handleDragStart(e, 'h', input);
                }}
                className="w-[3.5vw] h-[3.2vh] border border-gray-200 rounded-[0.4vw] bg-white flex items-center justify-between px-[0.4vw] shadow-sm cursor-ew-resize"
              >
                <input
                  type="number"
                  className="w-full text-center bg-transparent outline-none text-[#111827] text-[0.75vw] font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-ew-resize"
                  value={settings.h}
                  onChange={(e) => updateSetting('h', parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                />
                <span className="text-gray-400 text-[0.7vw] font-bold select-none pointer-events-none">↕</span>
              </div>
              <button
                onClick={() => updateSetting('h', settings.h + 5, true)}
                className="text-gray-400 hover:text-[#5145F6] transition-colors p-[0.1vw]"
              >
                <ChevronRight size="1vw" />
              </button>
            </div>
          </div>
        </div>



        {/* Typography Section */}
        <div className="space-y-[1.2vh]">
          <div className="flex items-center gap-[0.4vw]">
            <span className="text-[0.9vw] font-bold text-gray-900 whitespace-nowrap">Typography</span>
            <div className="h-[1px] flex-grow bg-gray-200"></div>
          </div>

          {/* Text Input/TextArea */}
          <div className="relative border border-gray-300 rounded-[0.8vw] p-[0.8vw] bg-white hover:border-gray-400 focus-within:border-gray-500 transition-colors">
            <textarea
              className="w-full text-[0.85vw] placeholder-gray-400 bg-transparent outline-none resize-none no-scrollbar h-[5.5vh] text-[#1f2937] whitespace-pre-wrap"
              value={localText}
              placeholder="Enter tooltip"
              onChange={(e) => {
                setLocalText(e.target.value);
                updateSetting('text', e.target.value);
              }}
            />
            <div className="absolute bottom-[0.6vw] right-[0.6vw] text-gray-700 pointer-events-none">
              <PencilLine size="0.95vw" />
            </div>
          </div>

          {/* Font Family Dropdown */}
          <div className="relative">
            <select
              className="w-full appearance-none h-[4vh] px-[0.9vw] text-[0.85vw] text-gray-800 border border-gray-300 rounded-[0.8vw] bg-white outline-none hover:border-gray-400 cursor-pointer font-medium"
              value={settings.fontFamily}
              onChange={(e) => updateSetting('fontFamily', e.target.value, true)}
            >
              <option value="Poppins">Poppins</option>
              <option value="Inter">Inter</option>
              <option value="Outfit">Outfit</option>
              <option value="Roboto">Roboto</option>
              <option value="Georgia">Georgia</option>
            </select>
            <ChevronDown size="1vw" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          {/* Font Weight & Size dropdowns */}
          <div className="flex gap-[0.6vw]">
            <div className="relative flex-[1.6]">
              <select
                className="w-full appearance-none h-[4vh] px-[0.9vw] text-[0.85vw] text-gray-800 border border-gray-300 rounded-[0.8vw] bg-white outline-none hover:border-gray-400 cursor-pointer font-medium"
                value={settings.fontWeight}
                onChange={(e) => updateSetting('fontWeight', e.target.value, true)}
              >
                <option value="Regular">Regular</option>
                <option value="Medium">Medium</option>
                <option value="SemiBold">SemiBold</option>
                <option value="Bold">Bold</option>
              </select>
              <ChevronDown size="1vw" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>

            <div className="relative flex-1">
              <select
                className="w-full appearance-none h-[4vh] px-[0.9vw] text-[0.85vw] text-gray-800 border border-gray-300 rounded-[0.8vw] bg-white outline-none hover:border-gray-400 cursor-pointer font-medium text-center"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value) || 14, true)}
              >
                {[10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32].map(sz => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
              <ChevronDown size="1vw" className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>


          {/* Alignment and Styles Toolbar */}
          <div className="flex items-center gap-[0.5vw] relative">
            {/* Alignment Button */}
            <div className="relative" ref={alignmentRef}>
              <button
                onClick={() => togglePanel('alignment')}
                className="alignment-trigger w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.6vw] bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800"
              >
                {settings.align === 'center' ? <AlignCenter size="1vw" /> :
                  settings.align === 'right' ? <AlignRight size="1vw" /> :
                    settings.align === 'justify' ? <AlignJustify size="1vw" /> :
                      <AlignLeft size="1vw" />}
              </button>
              {activePanel === 'alignment' && (
                <div className="absolute bottom-[2.5vw] left-0 z-[300] p-[0.35vw] bg-[#1A1A1A] rounded-[0.6vw] flex gap-[0.35vw] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D2D2D] whitespace-nowrap">
                  <button onClick={() => { updateSetting('align', 'left', true); setActivePanel(null); }} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center text-black transition-all ${settings.align === 'left' ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}><AlignLeft size="0.9vw" /></button>
                  <button onClick={() => { updateSetting('align', 'center', true); setActivePanel(null); }} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center text-black transition-all ${settings.align === 'center' ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}><AlignCenter size="0.9vw" /></button>
                  <button onClick={() => { updateSetting('align', 'right', true); setActivePanel(null); }} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center text-black transition-all ${settings.align === 'right' ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}><AlignRight size="0.9vw" /></button>
                  <button onClick={() => { updateSetting('align', 'justify', true); setActivePanel(null); }} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center text-black transition-all ${settings.align === 'justify' ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}><AlignJustify size="0.9vw" /></button>
                </div>
              )}
            </div>

            {/* Style Button */}
            <div className="relative" ref={styleRef}>
              <button
                onClick={() => togglePanel('style')}
                className="style-trigger w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.6vw] bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <span className="text-[1.1vw] font-black text-black leading-none">B</span>
              </button>
              {activePanel === 'style' && (
                <div className="absolute bottom-[2.5vw] left-0 z-[300] p-[0.35vw] bg-[#1A1A1A] rounded-[0.6vw] flex gap-[0.35vw] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D2D2D] whitespace-nowrap">
                  <button onClick={() => updateSetting('bold', !settings.bold, true)} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center transition-all ${settings.bold ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}><span className="text-[1vw] font-normal text-black leading-none">B</span></button>
                  <button onClick={() => updateSetting('italic', !settings.italic, true)} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center transition-all ${settings.italic ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}><span className="text-[1vw] font-normal italic text-black leading-none">I</span></button>
                  <button onClick={() => updateSetting('underline', !settings.underline, true)} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center transition-all ${settings.underline ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}><span className="text-[1vw] font-normal underline text-black leading-none">U</span></button>
                  <button onClick={() => updateSetting('lineThrough', !settings.lineThrough, true)} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center transition-all ${settings.lineThrough ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}><span className="text-[1vw] font-normal line-through text-black leading-none">S</span></button>
                </div>
              )}
            </div>

            {/* Case Button */}
            <div className="relative" ref={caseRef}>
              <button
                onClick={() => togglePanel('case')}
                className="case-trigger w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.6vw] bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800"
              >
                <Minus size="1vw" />
              </button>
              {activePanel === 'case' && (
                <div className="absolute bottom-[2.5vw] left-0 z-[300] p-[0.35vw] bg-[#1A1A1A] rounded-[0.6vw] flex gap-[0.35vw] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D2D2D] whitespace-nowrap">
                  <button onClick={() => { updateSetting('textTransform', 'none', true); setActivePanel(null); }} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center text-black transition-all ${settings.textTransform === 'none' || !settings.textTransform ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}><Minus size="0.9vw" /></button>
                  <button onClick={() => { updateSetting('textTransform', 'capitalize', true); setActivePanel(null); }} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center transition-all ${settings.textTransform === 'capitalize' ? 'bg-gray-200 text-black' : 'bg-white text-black hover:bg-gray-100'}`}><span className="text-[0.9vw] font-normal leading-none">Aa</span></button>
                  <button onClick={() => { updateSetting('textTransform', 'uppercase', true); setActivePanel(null); }} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center transition-all ${settings.textTransform === 'uppercase' ? 'bg-gray-200 text-black' : 'bg-white text-black hover:bg-gray-100'}`}><span className="text-[0.9vw] font-normal leading-none">AB</span></button>
                  <button onClick={() => { updateSetting('textTransform', 'lowercase', true); setActivePanel(null); }} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center transition-all ${settings.textTransform === 'lowercase' ? 'bg-gray-200 text-black' : 'bg-white text-black hover:bg-gray-100'}`}><span className="text-[0.9vw] font-normal leading-none">ab</span></button>
                </div>
              )}
            </div>

            {/* List Button */}
            <div className="relative" ref={listRef}>
              <button
                onClick={() => togglePanel('list')}
                className="list-trigger w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.6vw] bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800"
              >
                <List size="1vw" />
              </button>
              {activePanel === 'list' && (
                <div className="absolute bottom-[2.5vw] left-0 z-[300] p-[0.35vw] bg-[#1A1A1A] rounded-[0.6vw] flex gap-[0.35vw] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D2D2D] whitespace-nowrap">
                  <button type="button" onClick={() => handleListStyleChange('disc')} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center text-black transition-all ${settings.listStyleType === 'disc' ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}><List size="0.9vw" /></button>
                  <button type="button" onClick={() => handleListStyleChange('square')} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center text-black transition-all ${settings.listStyleType === 'square' ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}><List size="0.9vw" /></button>
                  <button type="button" onClick={() => handleListStyleChange('decimal')} className={`w-[1.8vw] h-[1.8vw] rounded-[0.4vw] flex items-center justify-center text-black transition-all ${settings.listStyleType === 'decimal' ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}><ListOrdered size="0.9vw" /></button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Colors Section */}
        <div className="space-y-[1.4vh] pb-[1vh]">
          <div className="flex items-center gap-[0.4vw]">
            <span className="text-[0.8vw] font-bold text-gray-800 whitespace-nowrap">Edit Colors</span>
            <div className="h-[1px] flex-grow bg-gray-150"></div>
          </div>

          {/* Text Color picker */}
          <div className="space-y-[0.4vh]">
            <span className="text-[0.75vw] text-gray-500 font-semibold">Text Color</span>
            <div className="flex items-center gap-[0.6vw]">
              {/* Color Square Preview with Custom ColorPicker Popup trigger */}
              <div
                onClick={(e) => handleColorPickerToggle(e, 'textColor')}
                className="color-box-trigger w-[2.2vw] h-[2.2vw] rounded-[0.4vw] border border-gray-300 shadow-sm relative cursor-pointer hover:border-indigo-400 transition-colors"
                style={{ backgroundColor: settings.textColor }}
              />

              {/* Hex and Opacity input */}
              <div className="flex-1 h-[3.8vh] border border-gray-200 rounded-[0.4vw] bg-white flex items-center justify-between px-[0.8vw] shadow-sm">
                <input
                  type="text"
                  className="w-[5vw] text-[0.8vw] font-mono text-gray-700 outline-none uppercase bg-transparent"
                  value={settings.textColor}
                  onChange={(e) => updateSetting('textColor', e.target.value)}
                />
                <span className="text-gray-400 text-[0.75vw] font-medium select-none">100%</span>
              </div>
            </div>
          </div>

          {/* Background Color picker */}
          <div className="space-y-[0.4vh] mt-[1.2vh]">
            <span className="text-[0.75vw] text-gray-500 font-semibold">Background Color</span>
            <div className="flex items-center gap-[0.6vw]">
              {/* Color Square Preview with Custom ColorPicker Popup trigger */}
              <div
                onClick={(e) => handleColorPickerToggle(e, 'bgColor')}
                className="color-box-trigger w-[2.2vw] h-[2.2vw] rounded-[0.4vw] border border-gray-300 shadow-sm relative cursor-pointer hover:border-indigo-400 transition-colors"
                style={{ backgroundColor: settings.bgColor }}
              />

              {/* Hex and Opacity input */}
              <div className="flex-1 h-[3.8vh] border border-gray-200 rounded-[0.4vw] bg-white flex items-center justify-between px-[0.8vw] shadow-sm">
                <input
                  type="text"
                  className="w-[5vw] text-[0.8vw] font-mono text-gray-700 outline-none uppercase bg-transparent"
                  value={settings.bgColor}
                  onChange={(e) => updateSetting('bgColor', e.target.value)}
                />
                <span className="text-gray-400 text-[0.75vw] font-medium select-none">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeColorPicker && createPortal(
        <>
          <div
            className="fixed inset-0 z-[4999]"
            onMouseDown={(e) => {
              e.stopPropagation();
              if (activeColorPicker) {
                updateSetting(activeColorPicker, activeColorPicker === 'textColor' ? settings.textColor : settings.bgColor, true);
              }
              setActiveColorPicker(null);
            }}
          />
          <ColorPicker
            color={activeColorPicker === 'textColor' ? settings.textColor : settings.bgColor}
            onChange={(val) => updateSetting(activeColorPicker, val)}
            opacity={100}
            onOpacityChange={() => { }}
            colorsOnPage={colorsOnPage}
            onClose={() => {
              if (activeColorPicker) {
                updateSetting(activeColorPicker, activeColorPicker === 'textColor' ? settings.textColor : settings.bgColor, true);
              }
              setActiveColorPicker(null);
            }}
            hidePalette={true}
            style={{
              position: 'fixed',
              top: pickerPosition.top,
              right: pickerPosition.right,
              zIndex: 5000
            }}
          />
        </>,
        document.body
      )}
    </div>
  );
};

export default TooltipCustomization;
