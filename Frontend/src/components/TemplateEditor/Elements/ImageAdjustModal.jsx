import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ChevronDown } from 'lucide-react';
import Adjustment from '../Adjustment';

export const computeFilterString = (f) => {
  if (!f) return '';
  const exposure = f.exposure || 0;
  const contrast = f.contrast || 0;
  const saturation = f.saturation || 0;
  const temperature = f.temperature || 0;
  const tint = f.tint || 0;
  const h = f.highlights || 0;
  const s = f.shadows || 0;

  let str = '';
  str += `brightness(${100 + exposure + (h / 5)}%) `;
  str += `contrast(${100 + contrast + (s / 5)}%) `;
  str += `saturate(${100 + saturation}%) `;
  if (tint !== 0) str += `hue-rotate(${tint}deg) `;
  if (temperature > 0) str += `sepia(${temperature / 2}%) `;
  else if (temperature < 0) str += `hue-rotate(180deg) sepia(${Math.abs(temperature) / 2}%) hue-rotate(-180deg) `;
  return str.trim();
};

const defaultFilters = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0
};

/**
 * ImageAdjustModal
 * Modal strictly for image crop, fit type, opacity, and Adjustment filter settings.
 * Text properties and slide headings have been separated into a dedicated popup.
 */
const ImageAdjustModal = ({
  isOpen,
  onClose,
  imageSrc,
  initialFixType = 'Fit',
  initialOpacity = 100,
  initialFilters = null,
  initialCrop = null,
  frameAspectRatio = 130 / 140,
  onSave
}) => {
  const [fixType, setFixType] = useState(initialFixType || 'Fit');
  const [opacity, setOpacity] = useState(initialOpacity !== undefined ? initialOpacity : 100);
  const [filters, setFilters] = useState(initialFilters || defaultFilters);
  const [openSubSection, setOpenSubSection] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [aspectRatioMode, setAspectRatioMode] = useState('frame');

  // Crop state in percentages (0 to 100)
  const [crop, setCrop] = useState(
    initialCrop && initialCrop.width && initialCrop.height
      ? initialCrop
      : { top: 10, left: 10, width: 80, height: 80 }
  );

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'move', 'tl', 'tr', 'bl', 'br', 'top', 'bottom', 'left', 'right'
  const [startPos, setStartPos] = useState({ x: 0, y: 0, crop: {} });

  const applyAspectRatio = useCallback((ratio, naturalW, naturalH) => {
    const w = naturalW || naturalSize.width || 1000;
    const h = naturalH || naturalSize.height || 1000;
    const imgRatio = w / h;

    let cropW = 85;
    let cropH = 85;

    if (ratio) {
      if (imgRatio > ratio) {
        cropH = 85;
        const cropH_px = (cropH / 100) * h;
        const cropW_px = cropH_px * ratio;
        cropW = Math.min(95, (cropW_px / w) * 100);
      } else {
        cropW = 85;
        const cropW_px = (cropW / 100) * w;
        const cropH_px = cropW_px / ratio;
        cropH = Math.min(95, (cropH_px / h) * 100);
      }
    } else {
      cropW = 90;
      cropH = 90;
    }

    setCrop({
      left: Math.max(0, parseFloat(((100 - cropW) / 2).toFixed(2))),
      top: Math.max(0, parseFloat(((100 - cropH) / 2).toFixed(2))),
      width: Math.min(100, parseFloat(cropW.toFixed(2))),
      height: Math.min(100, parseFloat(cropH.toFixed(2)))
    });
  }, [naturalSize]);

  useEffect(() => {
    if (isOpen) {
      setFixType(initialFixType || 'Fit');
      setOpacity(initialOpacity !== undefined ? initialOpacity : 100);
      setFilters(initialFilters || defaultFilters);

      if (initialCrop && initialCrop.width && initialCrop.height) {
        setCrop(initialCrop);
        setAspectRatioMode('free');
      } else {
        setAspectRatioMode('frame');
      }
    }
  }, [isOpen, initialFixType, initialOpacity, initialFilters, initialCrop]);

  const updateDisplayMetrics = useCallback(() => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      setDisplaySize({ width: rect.width, height: rect.height });
    }
  }, []);

  const handleImageLoad = (e) => {
    const nw = e.target.naturalWidth || e.target.width;
    const nh = e.target.naturalHeight || e.target.height;
    setNaturalSize({ width: nw, height: nh });

    if (!initialCrop || !initialCrop.width) {
      applyAspectRatio(frameAspectRatio, nw, nh);
    }
    setTimeout(updateDisplayMetrics, 50);
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(updateDisplayMetrics, 100);
      window.addEventListener('resize', updateDisplayMetrics);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateDisplayMetrics);
      };
    }
  }, [isOpen, updateDisplayMetrics]);

  // Crop Drag & Resize Logic
  const handleMouseDown = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setStartPos({
      x: e.clientX,
      y: e.clientY,
      crop: { ...crop }
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !displaySize.width || !displaySize.height) return;

    const dx = ((e.clientX - startPos.x) / displaySize.width) * 100;
    const dy = ((e.clientY - startPos.y) / displaySize.height) * 100;
    const init = startPos.crop;

    let next = { ...init };
    const minSize = 10;

    switch (dragType) {
      case 'move': {
        const maxL = 100 - init.width;
        const maxT = 100 - init.height;
        next.left = Math.max(0, Math.min(maxL, init.left + dx));
        next.top = Math.max(0, Math.min(maxT, init.top + dy));
        break;
      }
      case 'tl': {
        const maxL = init.left + init.width - minSize;
        const maxT = init.top + init.height - minSize;
        next.left = Math.max(0, Math.min(maxL, init.left + dx));
        next.top = Math.max(0, Math.min(maxT, init.top + dy));
        next.width = init.width - (next.left - init.left);
        next.height = init.height - (next.top - init.top);
        break;
      }
      case 'tr': {
        const maxT = init.top + init.height - minSize;
        next.top = Math.max(0, Math.min(maxT, init.top + dy));
        next.height = init.height - (next.top - init.top);
        next.width = Math.max(minSize, Math.min(100 - init.left, init.width + dx));
        break;
      }
      case 'bl': {
        const maxL = init.left + init.width - minSize;
        next.left = Math.max(0, Math.min(maxL, init.left + dx));
        next.width = init.width - (next.left - init.left);
        next.height = Math.max(minSize, Math.min(100 - init.top, init.height + dy));
        break;
      }
      case 'br': {
        next.width = Math.max(minSize, Math.min(100 - init.left, init.width + dx));
        next.height = Math.max(minSize, Math.min(100 - init.top, init.height + dy));
        break;
      }
      case 'top': {
        const maxT = init.top + init.height - minSize;
        next.top = Math.max(0, Math.min(maxT, init.top + dy));
        next.height = init.height - (next.top - init.top);
        break;
      }
      case 'bottom': {
        next.height = Math.max(minSize, Math.min(100 - init.top, init.height + dy));
        break;
      }
      case 'left': {
        const maxL = init.left + init.width - minSize;
        next.left = Math.max(0, Math.min(maxL, init.left + dx));
        next.width = init.width - (next.left - init.left);
        break;
      }
      case 'right': {
        next.width = Math.max(minSize, Math.min(100 - init.left, init.width + dx));
        break;
      }
      default:
        break;
    }

    setCrop({
      left: parseFloat(next.left.toFixed(2)),
      top: parseFloat(next.top.toFixed(2)),
      width: parseFloat(next.width.toFixed(2)),
      height: parseFloat(next.height.toFixed(2))
    });
  }, [isDragging, displaySize, startPos, dragType]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDone = () => {
    if (!imageSrc) {
      onClose();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        const sx = Math.max(0, (crop.left / 100) * naturalW);
        const sy = Math.max(0, (crop.top / 100) * naturalH);
        const sw = Math.min(naturalW - sx, (crop.width / 100) * naturalW);
        const sh = Math.min(naturalH - sy, (crop.height / 100) * naturalH);

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(sw));
        canvas.height = Math.max(1, Math.round(sh));
        const ctx = canvas.getContext('2d');

        const filterStr = computeFilterString(filters);
        if (filterStr) {
          ctx.filter = filterStr;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

        const croppedUrl = canvas.toDataURL('image/png');
        onSave?.({
          croppedUrl,
          originalUrl: imageSrc,
          cropData: crop,
          fixType,
          opacity,
          filters
        });
        onClose();
      } catch (err) {
        console.warn('Canvas export tainted or failed, falling back:', err);
        onSave?.({
          croppedUrl: imageSrc,
          originalUrl: imageSrc,
          cropData: crop,
          fixType,
          opacity,
          filters
        });
        onClose();
      }
    };

    img.onerror = () => {
      onSave?.({
        croppedUrl: imageSrc,
        originalUrl: imageSrc,
        cropData: crop,
        fixType,
        opacity,
        filters
      });
      onClose();
    };

    img.src = imageSrc;
  };

  if (!isOpen) return null;

  const activeFilterString = computeFilterString(filters);

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] bg-black/60 p-[2vw] backdrop-blur-xs flex items-center justify-center p-[2vw] select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        .custom-image-adjust-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-image-adjust-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-image-adjust-scroll::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 9999px;
        }
        .custom-image-adjust-scroll::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>

      {/* Modal Dialog Card (Two-column layout - Compact & Balanced) */}
      <div
        className="bg-white rounded-[0.9vw] shadow-2xl flex flex-row overflow-hidden w-[58vw] max-w-[860px] min-w-[580px] h-[72vh] max-h-[600px] min-h-[460px] relative animate-in zoom-in-95 duration-200 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── LEFT COLUMN: Image Preview & Interactive Crop Viewport ── */}
        <div className="flex-1 min-w-0 bg-[#888888]/15 flex flex-col p-[1vw] overflow-hidden select-none">
          {/* Top Aspect Ratio & Frame Fit Controls */}
          <div className="flex items-center justify-between pb-[0.6vw]">
            <div className="flex items-center gap-[0.4vw]">
              <span className="text-[0.82vw] font-semibold text-gray-700">Crop Mode:</span>
              <div className="flex items-center bg-white/90 backdrop-blur-xs rounded-[0.4vw] p-[0.15vw] border border-gray-200 shadow-2xs">
                {[
                  { id: 'frame', label: 'Fit Frame (13:14)', ratio: frameAspectRatio },
                  { id: '1:1', label: '1:1 Square', ratio: 1 },
                  { id: 'free', label: 'Free Crop', ratio: null }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setAspectRatioMode(item.id);
                      if (item.ratio) {
                        applyAspectRatio(item.ratio);
                      }
                    }}
                    className={`px-[0.55vw] py-[0.25vw] rounded-[0.3vw] text-[0.78vw] font-medium transition-all cursor-pointer ${
                      aspectRatioMode === item.id
                        ? 'bg-[#ec5137] text-white shadow-xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAspectRatioMode('frame');
                applyAspectRatio(frameAspectRatio);
                setFixType('Fit');
              }}
              className="flex items-center gap-[0.3vw] px-[0.65vw] py-[0.25vw] bg-white hover:bg-gray-50 text-[0.78vw] font-semibold text-[#ec5137] rounded-[0.4vw] border border-[#ec5137]/30 shadow-2xs transition-colors cursor-pointer"
              title="Automatically fit and center image to slideshow frame"
            >
              <span>Fit Image on Frame</span>
            </button>
          </div>

          {/* Upper Section: Image Crop Viewport */}
          <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden">
            <div ref={containerRef} className="relative inline-block overflow-hidden shadow-sm rounded-[0.4vw]">
              <img
                ref={imageRef}
                src={imageSrc}
                onLoad={handleImageLoad}
                alt="Adjustment Target"
                className="max-h-[54vh] max-w-full block select-none pointer-events-none"
                style={{
                  opacity: opacity / 100,
                  filter: activeFilterString || 'none',
                  objectFit: 'contain'
                }}
                draggable={false}
              />

              {/* Crop Boundary & Dimming Overlay */}
              {displaySize.width > 0 && displaySize.height > 0 && (
                <div
                  className="absolute cursor-move select-none"
                  style={{
                    top: `${crop.top}%`,
                    left: `${crop.left}%`,
                    width: `${crop.width}%`,
                    height: `${crop.height}%`,
                    border: '2px dashed #ffffff',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'move')}
                >
                  {/* 3x3 Grid (Rule of Thirds) */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 bottom-0 left-[33.333%] w-0 border-r border-dashed border-white/70" />
                    <div className="absolute top-0 bottom-0 left-[66.666%] w-0 border-r border-dashed border-white/70" />
                    <div className="absolute left-0 right-0 top-[33.333%] h-0 border-b border-dashed border-white/70" />
                    <div className="absolute left-0 right-0 top-[66.666%] h-0 border-b border-dashed border-white/70" />
                  </div>

                  {/* 4 Corner Resize Handles */}
                  <div
                    className="absolute -top-[0.35vw] -left-[0.35vw] w-[0.7vw] h-[0.7vw] bg-white border border-gray-400 shadow-sm cursor-nwse-resize rounded-[1px] hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleMouseDown(e, 'tl')}
                  />
                  <div
                    className="absolute -top-[0.35vw] -right-[0.35vw] w-[0.7vw] h-[0.7vw] bg-white border border-gray-400 shadow-sm cursor-nesw-resize rounded-[1px] hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleMouseDown(e, 'tr')}
                  />
                  <div
                    className="absolute -bottom-[0.35vw] -left-[0.35vw] w-[0.7vw] h-[0.7vw] bg-white border border-gray-400 shadow-sm cursor-nesw-resize rounded-[1px] hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleMouseDown(e, 'bl')}
                  />
                  <div
                    className="absolute -bottom-[0.35vw] -right-[0.35vw] w-[0.7vw] h-[0.7vw] bg-white border border-gray-400 shadow-sm cursor-nwse-resize rounded-[1px] hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleMouseDown(e, 'br')}
                  />

                  {/* 4 Midpoint Edge Handles */}
                  <div
                    className="absolute -top-[0.35vw] left-1/2 -translate-x-1/2 w-[0.7vw] h-[0.7vw] bg-white border border-gray-400 shadow-sm cursor-ns-resize rounded-[1px] hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleMouseDown(e, 'top')}
                  />
                  <div
                    className="absolute -bottom-[0.35vw] left-1/2 -translate-x-1/2 w-[0.7vw] h-[0.7vw] bg-white border border-gray-400 shadow-sm cursor-ns-resize rounded-[1px] hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                  />
                  <div
                    className="absolute -left-[0.35vw] top-1/2 -translate-y-1/2 w-[0.7vw] h-[0.7vw] bg-white border border-gray-400 shadow-sm cursor-ew-resize rounded-[1px] hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleMouseDown(e, 'left')}
                  />
                  <div
                    className="absolute -right-[0.35vw] top-1/2 -translate-y-1/2 w-[0.7vw] h-[0.7vw] bg-white border border-gray-400 shadow-sm cursor-ew-resize rounded-[1px] hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleMouseDown(e, 'right')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Tools & Adjustments Panel (Compact) ── */}
        <div className="w-[20.5vw] min-w-[260px] max-w-[320px] bg-white border-l border-gray-100 flex flex-col justify-between p-[1.1vw] overflow-hidden relative">
          {/* Scrollable controls section */}
          <div className="flex-1 overflow-y-auto custom-image-adjust-scroll pr-[0.3vw] space-y-[1vw] pb-[0.6vw]">
            {/* Header with integrated Close Button */}
            <div className="flex items-start justify-between pb-[0.7vw] border-b border-gray-100">
              <div>
                <h3 className="text-[1.05vw] font-bold text-gray-900 leading-tight">Image Adjustment</h3>
                <p className="text-[0.74vw] text-gray-400 mt-[0.1vw]">Fine-tune crop, opacity & filters</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 transition-colors p-[0.25vw] rounded-full hover:bg-gray-100 cursor-pointer shrink-0 -mr-[0.1vw] -mt-[0.1vw]"
                title="Close"
              >
                <X size="1.1vw" />
              </button>
            </div>

            {/* 1. Image Fix Type */}
            <div className="space-y-[0.35vw]">
              <label className="text-[0.85vw] font-semibold text-gray-800">Image fix type</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between gap-[0.4vw] px-[0.75vw] py-[0.45vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-2xs hover:border-gray-300 transition-colors text-[0.82vw] font-medium text-gray-800 cursor-pointer"
                >
                  <span>{fixType}</span>
                  <ChevronDown size="0.95vw" className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute left-0 top-full mt-[0.25vw] w-full bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-50 py-[0.2vw] overflow-hidden animate-in fade-in duration-100">
                      {[
                        { val: 'Fit', label: 'Fit', desc: 'Fit entire image' },
                        { val: 'Fill', label: 'Fill', desc: 'Fill frame, slice overflow' },
                        { val: 'Fill All', label: 'Fill All', desc: 'Fill all frames' },
                        { val: 'Fit All', label: 'Fit All', desc: 'Fit all frames' }
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            setFixType(opt.val);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-[0.75vw] py-[0.45vw] text-[0.8vw] transition-colors cursor-pointer flex items-center justify-between ${
                            fixType === opt.val ? 'bg-orange-50 text-[#ec5137] font-semibold' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-[0.68vw] text-gray-400">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2. Opacity */}
            <div className="space-y-[0.35vw]">
              <div className="flex items-center justify-between">
                <span className="text-[0.85vw] font-semibold text-gray-800">Opacity</span>
                <span className="text-[0.78vw] font-semibold text-gray-600 bg-gray-100 px-[0.45vw] py-[0.1vw] rounded-[0.3vw]">
                  {opacity}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full h-[0.32vw] rounded-full appearance-none cursor-pointer accent-[#ec5137]"
                style={{
                  background: `linear-gradient(to right, #ec5137 0%, #ec5137 ${opacity}%, #e5e7eb ${opacity}%, #e5e7eb 100%)`
                }}
              />
            </div>
            
            {/* 3. Adjustment Component from Adjustment.jsx */}
            <div className="pt-[0.2vw]">
              <Adjustment
                openSubSection={openSubSection}
                setOpenSubSection={setOpenSubSection}
                filters={filters}
                setFilters={setFilters}
              />
            </div>
          </div>

          {/* Action Buttons (Sticky at bottom of Right Sidebar) */}
          <div className="sticky bottom-0 bg-white pt-[0.7vw] border-t border-gray-100 flex items-center gap-[0.7vw] z-20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-[0.5vw] rounded-[0.45vw] border border-gray-300 text-[0.82vw] font-medium text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-[0.35vw] cursor-pointer shadow-2xs"
            >
              <X size="0.95vw" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="flex-1 py-[0.5vw] rounded-[0.45vw] bg-[#ec5137] hover:bg-[#d8442c] active:scale-95 text-white text-[0.82vw] font-semibold transition-all flex items-center justify-center gap-[0.35vw] shadow-sm cursor-pointer"
            >
              <Check size="1.05vw" strokeWidth={2.5} />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ImageAdjustModal;
