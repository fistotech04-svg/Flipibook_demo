import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import ColorPicker from "./ColorPicker";
import { createPortal } from "react-dom";
import { textureData } from "../../data/textureData";
import { useRef } from "react";
import { useEffect } from "react";
import { resolveUploadsPath } from "../../utils/supabaseUtils";

// --- Reusable UI Components (Matched to PreDefined.jsx) ---

const Accordion = ({ title, icon: iconName, children, isOpen, onToggle, iconSize = "1.04vw", onReset }) => {
  return (
    <div className="bg-white rounded-[0.75vw] shadow-sm border border-gray-100 overflow-hidden mb-[0.75vw] transition-all duration-200 hover:shadow-md">
      <div
        className={`flex items-center justify-between px-[1vw] py-[0.85vw] bg-white cursor-pointer select-none transition-colors duration-200 ${
          isOpen ? "border-b border-gray-100" : ""
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-[0.75vw] text-gray-800 font-semibold text-[0.85vw]">
          {iconName && <Icon icon={iconName} width={iconSize} height={iconSize} className="text-gray-500" />}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-[0.75vw] text-gray-400">
          <button
            className="hover:text-[#5d5efc] hover:bg-indigo-50 p-[0.25vw] rounded-[0.35vw] transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              if (onReset) onReset();
            }}
          >
           <Icon icon="ix:reset" width="0.85vw" height="0.85vw" />
          </button>
          <Icon
            icon="heroicons:chevron-down"
            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            width="0.85vw"
            height="0.85vw"
          />
        </div>
      </div>

      <div
        className={`bg-white transition-[max-height] duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-[0.65vw] pt-[0.5vw]">{children}</div>
      </div>
    </div>
  );
};

const SectionHeader = ({ label, showLine = true }) => (
  <div className="flex items-center gap-[0.75vw] mb-[1vw] mt-[0.5vw]">
    <span className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap">
      {label}
    </span>
    {showLine && <div className="h-[0.05vw] bg-gray-100 w-full flex-1"></div>}
  </div>
);
const backendUrlGlobal = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
// Returns:
//   null          → no texture at all
//   '__EXISTING__'→ texture exists in Three.js material but no preview URL could be extracted
//   <string URL>  → valid image URL / data URL / blob URL
const resolveMapUrl = (url) => {
    if (!url) return null;
    if (url === 'existing') return '__EXISTING__';
    if (typeof url !== 'string') return null;
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    if (url.startsWith('/')) return `${backendUrlGlobal}${url}`;
    return url;
};
// Returns true if resolveMapUrl result means a real previewable URL is available
const hasPreviewUrl = (resolved) => resolved && resolved !== '__EXISTING__';

const MapUploadControl = ({ mapType, currentMap, onUpload, overlay = false, disabled = false }) => {
  const fileInputRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFileChange = (e) => {
    if (disabled) return;
    const file = e.target.files[0];
    if (file && onUpload) {
      onUpload(mapType, file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file && onUpload) {
      onUpload(mapType, file);
    }
  };

  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target) && 
            buttonRef.current && !buttonRef.current.contains(event.target)) {
            setShowMenu(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (overlay) {
    return (
        <div 
            className={`absolute inset-0 group/upload ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            onClick={() => !disabled && fileInputRef.current.click()}
            onDragOver={disabled ? null : handleDragOver}
            onDragLeave={disabled ? null : handleDragLeave}
            onDrop={disabled ? null : handleDrop}
        >
            <input type="file" ref={fileInputRef} hidden accept=".hdr,.exr,image/*" onChange={handleFileChange} disabled={disabled} />
            
            {/* Menu Button */}
                <div 
                    ref={buttonRef}
                    className={`absolute top-[0.4vw] right-[0.4vw] w-[1.5vw] h-[1.5vw] bg-white/95 backdrop-blur-sm rounded-[0.4vw] border border-gray-300 flex items-center justify-center text-gray-500 shadow-sm hover:text-[#5d5efc] hover:bg-white transition-all z-20 ${showMenu ? 'opacity-100' : 'opacity-0 group-hover/upload:opacity-100'} ${disabled ? 'pointer-events-none' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (disabled) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPos({ top: rect.bottom + 5, left: rect.left - 40 });
                        setShowMenu(!showMenu);
                    }}
                >
                    <Icon icon="heroicons:ellipsis-vertical-20-solid" width="1vw" />
                </div>

            {/* Dropdown Menu Portaled */}
            {showMenu && createPortal(
                <div 
                    ref={menuRef}
                    className="fixed w-[6vw] bg-white rounded-[0.65vw] shadow-2xl border border-gray-500 py-[0.4vw] z-[9999] animate-in fade-in zoom-in duration-200"
                    style={{ top: menuPos.top, left: menuPos.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        className="w-full flex items-center cursor-pointer gap-[0.5vw] px-[0.75vw] py-[0.5vw] hover:bg-gray-50 text-gray-700 transition-colors"
                        onClick={() => {
                            fileInputRef.current.click();
                            setShowMenu(false);
                        }}
                    >
                        <Icon icon="ix:replace" className="w-[1vw] h-[1vw]" />
                        <span className="text-[0.7vw] font-semibold">Replace</span>
                    </button>
                    <button 
                        className="w-full flex items-center cursor-pointer gap-[0.5vw] px-[0.75vw] py-[0.5vw] hover:bg-red-50 text-red-500 transition-colors"
                        onClick={() => {
                            if (onUpload) onUpload(mapType, null);
                            setShowMenu(false);
                        }}
                    >
                        <Icon icon="solar:trash-bin-trash-linear" className="w-[1vw] h-[1vw]" />
                        <span className="text-[0.7vw] font-semibold">Delete</span>
                    </button>
                </div>,
                document.body
            )}

            {/* Hover state overlay */}
            <div className="absolute inset-0 bg-[#5d5efc]/5 opacity-0 group-hover/upload:opacity-100 transition-opacity rounded-[0.5vw]" />
        </div>
    );
  }

  return (
    <div 
      className={`w-[2.25vw] h-[2.25vw] rounded-[0.25vw] border overflow-hidden shrink-0 transition-all flex items-center justify-center relative group
        ${disabled ? "border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed opacity-60" : isDragging ? "border-[#5d5efc] bg-indigo-50 scale-110 shadow-sm" : "border-gray-200 bg-gray-50 text-gray-400 hover:border-[#5d5efc] cursor-pointer"}
      `}
      onClick={() => !disabled && fileInputRef.current.click()}
      onDragOver={disabled ? null : handleDragOver}
      onDragLeave={disabled ? null : handleDragLeave}
      onDrop={disabled ? null : handleDrop}
    >
      <input type="file" ref={fileInputRef} hidden accept=".hdr,.exr,image/*" onChange={handleFileChange} disabled={disabled} />
      {currentMap ? (
        <div className="w-full h-full relative group/thumb">
           {(() => {
               const resolved = resolveMapUrl(currentMap);
               if (hasPreviewUrl(resolved)) {
                   return (
                       <img 
                          src={resolved}
                          alt="Texture Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.classList.remove('hidden');
                              if (e.target.nextSibling) e.target.nextSibling.classList.add('flex');
                          }}
                       />
                   );
               }
               return null;
           })()}
           {/* Shown when texture exists but no preview URL is available, or after img error */}
           <div className={`${hasPreviewUrl(resolveMapUrl(currentMap)) ? 'hidden' : 'flex'} absolute inset-0 bg-indigo-50 items-center justify-center text-[#5d5efc]`}>
               <Icon icon="heroicons:check-circle" width="1.25vw" />
           </div>

           {/* Upload-new hint on hover (main area) */}
           <div className="absolute inset-0 bg-[#5d5efc]/60 text-white opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity z-10 pointer-events-none">
             <Icon icon="heroicons:arrow-up-tray" width="1vw" />
           </div>

           {/* Small X remove button — corner only, doesn't block main click */}
           <div 
             onClick={(e) => {
               e.stopPropagation();
               if (onUpload) onUpload(mapType, null);
             }}
             className="absolute top-0 right-0 w-[0.85vw] h-[0.85vw] bg-red-500 text-white opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity z-20 rounded-bl-[0.2vw] cursor-pointer"
             title="Remove"
           >
              <Icon icon="heroicons:x-mark" width="0.65vw" />
           </div>
        </div>
      ) : (
        <Icon 
          icon={isDragging ? "heroicons:arrow-down-tray" : "heroicons:arrow-up-tray"} 
          width="0.85vw" 
          height="0.85vw" 
          className={isDragging ? "text-[#5d5efc]" : ""}
        />
      )}
    </div>
  );
};

const MapAccordion = ({ title, value, onChange, mapType, currentMap, onUpload, description, isOpen, onToggle, isIntensityDisabled = false, extra, disabled = false }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/') && onUpload) {
            onUpload(mapType, file);
        }
    };

    return (
      <div 
        className={`border rounded-[0.5vw] mb-[0.65vw] bg-white transition-all duration-200 relative
            ${isDragging ? 'border-[#5d5efc] bg-indigo-50/30 scale-[1.02] z-10 shadow-lg' : 'border-gray-300'}
            ${isOpen ? 'shadow-sm' : 'hover:bg-gray-50/50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
            <div className="absolute inset-0 border-[0.15vw] border-dashed border-[#5d5efc] rounded-[0.5vw] pointer-events-none flex items-center justify-center bg-indigo-50/50 backdrop-blur-[1px] z-20">
                <div className="flex flex-col items-center gap-[0.5vw] animate-bounce">
                    <Icon icon="heroicons:arrow-up-tray" className="text-[#5d5efc] w-[1.5vw] h-[1.5vw]" />
                    <span className="text-[0.7vw] font-bold text-[#5d5efc] uppercase tracking-wider">Drop to upload {title}</span>
                </div>
            </div>
        )}

        <div 
          className={`flex items-center justify-between px-[0.65vw] py-[0.75vw] cursor-pointer group select-none ${isOpen ? 'border-b border-gray-200' : ''}`}
          onClick={onToggle}
        >
          <div className="flex items-center gap-[0.5vw]">
            <span className={`text-[0.75vw] font-semibold transition-colors ${isOpen ? 'text-[#5d5efc]' : 'text-gray-700 group-hover:text-gray-950'}`}>{title}</span>
          </div>
          <Icon 
             icon="heroicons:chevron-down" 
             className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
             width="0.85vw" 
          />
        </div>
        
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[30vw] opacity-100 p-[0.65vw]' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-[1.25vw]">
                {!isIntensityDisabled && (
                    <CustomSlider
                        label=""
                        value={value}
                        onChange={onChange}
                    />
                )}
                
                <div className="flex gap-[0.65vw] items-start">
                    <div className={`w-[7vw] h-[7vw] rounded-[0.5vw] shrink-0 overflow-hidden relative group border border-gray-300 shadow-inner transition-colors ${disabled ? 'bg-black cursor-not-allowed' : 'bg-white cursor-pointer hover:border-[#5d5efc]'}`}>
                        {(() => {
                            const resolved = currentMap ? resolveMapUrl(currentMap) : null;
                            if (!currentMap) {
                                // No texture: show placeholder
                                return (
                                    <div className={`w-full h-full flex flex-col items-center justify-center gap-[0.4vw] ${disabled ? 'text-white/40' : 'text-gray-300'}`}>
                                        <Icon icon={disabled ? "mdi:block" : "glyphs:image-duo"} width={disabled ? "2.5vw" : "5.5vw"} />
                                        {!disabled && <span className="text-[0.7vw] text-gray-400 font-semibold -mt-[0.5vw]">No Image Found</span>}
                                    </div>
                                );
                            }
                            if (hasPreviewUrl(resolved)) {
                                // Valid preview URL available: show the image
                                return (
                                    <img 
                                        src={resolved}
                                        className="w-full h-full object-cover" 
                                        alt={title} 
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            // Show the next sibling fallback overlay
                                            const next = e.target.nextElementSibling;
                                            if (next) { next.style.display = 'flex'; }
                                        }}
                                    />
                                );
                            }
                            // Texture exists in material but no preview URL (e.g. CORS-tainted ImageBitmap)
                            return null;
                        })()}
                        {currentMap && (
                            <div className={`${hasPreviewUrl(resolveMapUrl(currentMap)) ? 'hidden' : 'flex'} absolute inset-0 flex-col items-center justify-center bg-indigo-50/80 text-[#5d5efc] p-2 text-center pointer-events-none`}>
                                <Icon icon="heroicons:check-circle" className="w-[1.8vw] h-[1.8vw] mb-1" />
                                <span className="text-[0.65vw] font-bold uppercase tracking-tight">Active Texture</span>
                            </div>
                        )}
                        <MapUploadControl 
                            mapType={mapType} 
                            currentMap={currentMap} 
                            onUpload={onUpload} 
                            overlay={true}
                            disabled={disabled}
                        />
                    </div>
                    <div className="flex-1 space-y-[1vw]">
                        {extra}
                        <div className="space-y-[1vw]">
                            {description.split('\n\n').map((paragraph, pIdx) => (
                                <p key={pIdx} className="text-[0.68vw] text-gray-500 leading-relaxed font-medium whitespace-pre-line">
                                    {paragraph.split(/(metal|main color|surface appearance|surface details|bumps and grooves|rough or smooth|shiny surface|ridges or dots|soft shadows|crevices|visibility|emits light|glow effect|additional surface depth|Enhances shadows|crevices and corners|depth and realism|glowing areas)/g).map((part, i) => {
                                        const highlight = ["metal", "main color", "surface appearance", "surface details", "bumps and grooves", "rough or smooth", "shiny surface", "ridges or dots", "soft shadows", "crevices", "visibility", "emits light", "glow effect", "additional surface depth", "Enhances shadows", "crevices and corners", "depth and realism", "glowing areas"].includes(part);
                                        return (
                                            <span key={i} className={highlight ? "text-[#5d5efc]" : ""}>
                                                {part}
                                            </span>
                                        );
                                    })}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
};

const CustomSlider = ({ label, value, onChange, unit = "%", min = 0, max = 100, step = 1 }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputText, setInputText] = useState("");

  const numericValue = typeof value === 'number' && !isNaN(value) ? value : (min > 0 ? min : 0);

  // Clean formatted representation when not typing
  const formatDisplay = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return "0";
    const rounded = Math.round(val * 100) / 100;
    return String(rounded);
  };

  useEffect(() => {
    if (!isFocused) {
      setInputText(formatDisplay(numericValue));
    }
  }, [numericValue, isFocused]);

  const handleInputChange = (e) => {
    const raw = e.target.value;
    const allowNegative = min < 0;
    const regex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;

    if (raw === "" || regex.test(raw)) {
      setInputText(raw);

      // Live update if valid number within bounds
      if (raw !== "" && raw !== "-" && raw !== ".") {
        const parsed = parseFloat(raw);
        if (!isNaN(parsed) && parsed >= min && parsed <= max) {
          onChange?.(Math.round(parsed * 100) / 100);
        }
      }
    }
  };

  const commitValue = () => {
    setIsFocused(false);
    if (inputText === "" || inputText === "-" || inputText === ".") {
      setInputText(formatDisplay(numericValue));
      return;
    }
    const parsed = parseFloat(inputText);
    if (isNaN(parsed)) {
      setInputText(formatDisplay(numericValue));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    const rounded = Math.round(clamped * 100) / 100;
    setInputText(String(rounded));
    onChange?.(rounded);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      commitValue();
      e.target.blur();
    } else if (e.key === "Escape") {
      setIsFocused(false);
      setInputText(formatDisplay(numericValue));
      e.target.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = parseFloat(inputText) || numericValue;
      const inc = e.shiftKey ? 1 : (step < 1 ? step : 0.1);
      const next = Math.min(max, Math.round((current + inc) * 100) / 100);
      setInputText(String(next));
      onChange?.(next);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = parseFloat(inputText) || numericValue;
      const dec = e.shiftKey ? 1 : (step < 1 ? step : 0.1);
      const next = Math.max(min, Math.round((current - dec) * 100) / 100);
      setInputText(String(next));
      onChange?.(next);
    }
  };

  const percentage = Math.max(0, Math.min(100, ((numericValue - min) / (max - min)) * 100));
  const sliderStep = step < 1 ? step : 0.1;

  const parsedTemp = parseFloat(inputText);
  const isOutOfRange = isFocused && inputText !== "" && inputText !== "-" && inputText !== "." && !isNaN(parsedTemp) && (parsedTemp < min || parsedTemp > max);

  return (
    <div className="flex items-center justify-between mb-[1.1vw] last:mb-0 px-[0.5vw] h-[1.75vw]">
      {label ? (
        <div className="w-[5.8vw] text-[0.72vw] font-medium text-gray-600 shrink-0 flex items-center justify-between pr-[0.4vw]">
          <span className="truncate">{label}</span> <span>:</span>
        </div>
      ) : null}
      
      {/* Slider Track */}
      <div className="relative flex-1 h-[0.38vw] bg-gray-100 rounded-full cursor-pointer group touch-none mx-[0.4vw]">
        {/* Fill */}
        <div
          className="absolute top-0 left-0 h-full bg-[#5d5efc] rounded-full pointer-events-none"
          style={{ width: `${percentage}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[0.85vw] h-[0.85vw] bg-[#5d5efc] border-[0.15vw] border-white rounded-full shadow-md group-hover:scale-110 pointer-events-none transition-transform"
          style={{ left: `${percentage}%`, marginLeft: "-0.425vw" }}
        />
        {/* Input Range Overlay */}
        <input
          type="range"
          min={min}
          max={max}
          step={sliderStep}
          value={numericValue}
          onChange={(e) => {
            const val = Math.round(Number(e.target.value) * 100) / 100;
            onChange?.(val);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
      </div>

      {/* Editable Number Input & Range Limit Display (strictly centered with slider bar) */}
      <div className="relative flex items-center shrink-0 ml-[0.35vw] w-[2.2vw]">
        <div 
          className={`flex items-center justify-end bg-white border ${
            isOutOfRange 
              ? 'border-amber-400 ring-1 ring-amber-400/30' 
              : isFocused 
              ? 'border-[#5d5efc] ring-1 ring-[#5d5efc]/25' 
              : 'border-gray-200 hover:border-gray-300'
          } rounded-[0.25vw] px-[0.15vw] py-[0.06vw] h-[1.22vw] w-full transition-all`}
          title={`Click to type value (${min} to ${max}${unit ? ' ' + unit : ''})`}
        >
          <input
            type="text"
            inputMode="decimal"
            value={isFocused ? inputText : formatDisplay(numericValue)}
            onFocus={(e) => {
              setIsFocused(true);
              setInputText(formatDisplay(numericValue));
              e.target.select();
            }}
            onChange={handleInputChange}
            onBlur={commitValue}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-right text-[0.66vw] font-semibold text-gray-800 outline-none tabular-nums p-0 select-text leading-none"
            placeholder={String(min)}
          />
          {unit && (
            <span className="text-[0.6vw] font-medium text-gray-400 ml-[0.08vw] select-none shrink-0 leading-none">
              {unit}
            </span>
          )}
        </div>

        {/* Limit to enter value - positioned below without offsetting input vertical center */}
        <div 
          className={`absolute top-full right-0 text-[0.45vw] font-medium tabular-nums leading-none mt-[0.14vw] select-none tracking-tight text-right pointer-events-none ${
            isOutOfRange ? 'text-amber-500 font-semibold' : 'text-gray-400'
          }`}
          title={`Allowed range: ${min} to ${max}`}
        >
          {min}–{max}
        </div>
      </div>
    </div>
  );
};

const StackedSliderBox = ({ label, val, onChange, children, min = 0, max = 100, step = 1 }) => {
  const percentage = ((val - min) / (max - min)) * 100;
  return (
    <div className="mb-[1.5vw]">
      <div className="text-[0.68vw] font-medium text-gray-600 mb-[0.75vw] flex items-center justify-between">
        {label} :
      </div>
      <div className="flex items-center gap-[1vw]">
        {/* Reusing CustomSlider logic but horizontal layout inside flex */}
        <div className="relative flex-1 h-[0.4vw] bg-gray-100 rounded-full cursor-pointer group touch-none">
          <div
            className="absolute top-0 left-0 h-full bg-[#5d5efc] rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          ></div>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[0.9vw] h-[0.9vw] bg-[#5d5efc] border-[0.15vw] border-white rounded-full shadow-md hover:scale-110"
            style={{ left: `${Math.max(0, Math.min(100, percentage))}%`, marginLeft: "-0.45vw" }}
          ></div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={val ?? 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
          />
        </div>
        {/* Value Display */}
        <div className="w-[2.5vw] text-right text-[0.62vw] font-medium text-gray-500 tabular-nums">
          {typeof val === 'number' ? val.toFixed(step < 1 ? 1 : 0) : val} <span className="text-[0.52vw] ml-[0.15vw] text-gray-400">%</span>
        </div>
        {/* Extra Child (Box/Image) */}
        {children}
      </div>
    </div>
  );
};

const NumberStepper = ({ label, value, axisLabel, compact, onChange, step = 1, min, max }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    startVal: 0,
    hasMoved: false,
    currentVal: 0,
  });

  const numericVal = parseFloat(value);
  const currentNum = isNaN(numericVal) ? 0 : numericVal;

  // Determine decimal precision from step
  const stepDecimals = useMemo(() => {
    const s = String(step);
    if (s.includes(".")) return s.split(".")[1].length;
    return 0;
  }, [step]);

  // Focus and select input text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const clamp = (val) => {
    let v = val;
    if (min !== undefined && v < min) v = min;
    if (max !== undefined && v > max) v = max;
    return v;
  };

  const roundToPrecision = (val, extraPrecision = 0) => {
    const decimals = Math.max(0, stepDecimals + extraPrecision);
    return Number(val.toFixed(decimals));
  };

  const handleIncrement = (e) => {
    e?.stopPropagation();
    if (onChange) {
      const next = clamp(roundToPrecision(currentNum + step));
      onChange(next, false);
    }
  };

  const handleDecrement = (e) => {
    e?.stopPropagation();
    if (onChange) {
      const next = clamp(roundToPrecision(currentNum - step));
      onChange(next, false);
    }
  };

  const startEdit = () => {
    setIsEditing(true);
    setEditValue(String(value ?? "0"));
  };

  const commitEdit = () => {
    setIsEditing(false);
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && onChange) {
      const clamped = clamp(roundToPrecision(parsed));
      onChange(clamped, false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const parsed = parseFloat(editValue);
      const base = isNaN(parsed) ? currentNum : parsed;
      const next = clamp(roundToPrecision(base + (e.shiftKey ? step * 0.1 : step)));
      setEditValue(String(next));
      if (onChange) onChange(next, false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const parsed = parseFloat(editValue);
      const base = isNaN(parsed) ? currentNum : parsed;
      const next = clamp(roundToPrecision(base - (e.shiftKey ? step * 0.1 : step)));
      setEditValue(String(next));
      if (onChange) onChange(next, false);
    }
  };

  const handleMouseDown = (e) => {
    if (isEditing) return;
    if (e.button !== 0) return; // Only primary left click
    e.preventDefault();

    dragRef.current = {
      isDown: true,
      startX: e.clientX,
      startVal: currentNum,
      hasMoved: false,
      currentVal: currentNum,
    };

    const handleMouseMove = (moveEvent) => {
      if (!dragRef.current.isDown) return;
      const diffX = moveEvent.clientX - dragRef.current.startX;

      if (!dragRef.current.hasMoved && Math.abs(diffX) > 2) {
        dragRef.current.hasMoved = true;
        setIsDragging(true);
        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";
      }

      if (dragRef.current.hasMoved) {
        let multiplier = 1;
        if (moveEvent.shiftKey) multiplier = 0.1; // Shift for fine precision
        if (moveEvent.altKey || moveEvent.ctrlKey) multiplier = 5; // Alt/Ctrl for coarse speed

        // 1 step per 12 pixels dragged
        const deltaUnits = (diffX / 12) * step * multiplier;
        const rawNext = dragRef.current.startVal + deltaUnits;
        const extraDecimals = moveEvent.shiftKey ? 1 : 0;
        const nextVal = clamp(roundToPrecision(rawNext, extraDecimals));
        dragRef.current.currentVal = nextVal;

        if (onChange) {
          onChange(nextVal, true);
        }
      }
    };

    const handleMouseUp = (upEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      if (dragRef.current.hasMoved) {
        if (onChange) {
          onChange(dragRef.current.currentVal, false);
        }
        setIsDragging(false);
      } else {
        startEdit();
      }

      dragRef.current.isDown = false;
      dragRef.current.hasMoved = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Touch device support for scrubbing and tapping
  const handleTouchStart = (e) => {
    if (isEditing) return;
    const touch = e.touches[0];
    dragRef.current = {
      isDown: true,
      startX: touch.clientX,
      startVal: currentNum,
      hasMoved: false,
      currentVal: currentNum,
    };

    const handleTouchMove = (moveEvent) => {
      if (!dragRef.current.isDown) return;
      const t = moveEvent.touches[0];
      const diffX = t.clientX - dragRef.current.startX;

      if (!dragRef.current.hasMoved && Math.abs(diffX) > 4) {
        dragRef.current.hasMoved = true;
        setIsDragging(true);
      }

      if (dragRef.current.hasMoved) {
        const deltaUnits = (diffX / 12) * step;
        const nextVal = clamp(roundToPrecision(dragRef.current.startVal + deltaUnits));
        dragRef.current.currentVal = nextVal;
        if (onChange) onChange(nextVal, true);
      }
    };

    const handleTouchEnd = () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);

      if (dragRef.current.hasMoved) {
        if (onChange) onChange(dragRef.current.currentVal, false);
        setIsDragging(false);
      } else {
        startEdit();
      }
      dragRef.current.isDown = false;
      dragRef.current.hasMoved = false;
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <div
      className={`flex ${axisLabel ? "flex-col items-center gap-[0.25vw]" : "items-center"} ${
        label ? "justify-between" : "justify-center"
      } ${compact ? "gap-[0.25vw]" : "gap-[0.5vw] mb-[0.75vw]"}`}
    >
      {axisLabel && (
        <span className="text-[0.6vw] font-semibold text-gray-400 uppercase text-center tracking-wider">
          {axisLabel}
        </span>
      )}

      {label && (
        <div className={`font-medium text-gray-600 ${compact ? "text-[0.65vw] w-[4vw]" : "text-[0.68vw] w-[6vw]"}`}>
           {label} :
        </div>
      )}

      <div className={`flex items-center ${compact ? "gap-[0.2vw]" : "gap-[0.5vw]"}`}>
        <button 
          type="button"
          onClick={handleDecrement}
          className={`text-gray-400 hover:text-[#5d5efc] transition-colors ${compact ? "p-[0.1vw] hover:bg-indigo-50 rounded" : "p-[0.15vw] hover:bg-indigo-50 rounded"}`}
          title="Decrease"
        >
          <Icon
            icon="heroicons:chevron-left"
            width={compact ? "0.65vw" : "0.85vw"}
            height={compact ? "0.65vw" : "0.85vw"}
          />
        </button>

        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          title={isEditing ? "Press Enter to save, Esc to cancel" : "Click to type, drag left/right to adjust (Shift for precision)"}
          className={`relative ${
            compact ? "w-[3.1vw] py-[0.15vw] text-[0.62vw] rounded-[0.25vw]" : "w-[3.8vw] py-[0.4vw] text-[0.68vw] rounded-[0.35vw]"
          } border text-center font-bold transition-all tabular-nums select-none ${
            isEditing
              ? "border-[#5d5efc] ring-2 ring-[#5d5efc]/20 bg-white"
              : isDragging
              ? "border-[#5d5efc] ring-2 ring-[#5d5efc]/30 bg-indigo-50/50 cursor-ew-resize text-[#5d5efc]"
              : "border-gray-200 text-gray-700 bg-white shadow-xs hover:border-[#5d5efc] hover:bg-indigo-50/10 cursor-ew-resize"
          }`}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="w-full h-full text-center bg-transparent border-none outline-none font-bold text-gray-800 p-0 m-0"
            />
          ) : (
            <span className="pointer-events-none block truncate px-[0.1vw]">
              {value}
            </span>
          )}
        </div>

        <button 
          type="button"
          onClick={handleIncrement}
          className={`text-gray-400 hover:text-[#5d5efc] transition-colors ${compact ? "p-[0.1vw] hover:bg-indigo-50 rounded" : "p-[0.15vw] hover:bg-indigo-50 rounded"}`}
          title="Increase"
        >
          <Icon
            icon="heroicons:chevron-right"
            width={compact ? "0.65vw" : "0.85vw"}
            height={compact ? "0.65vw" : "0.85vw"}
          />
        </button>
      </div>
    </div>
  );
};

const CustomDropdown = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  const dropdownRef = React.useRef(null);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const toggleDropdown = () => {
      if (!isOpen && dropdownRef.current) {
          const rect = dropdownRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceNeeded = 200; 
          
          if (spaceBelow < spaceNeeded) {
              setDropdownPosition('top');
          } else {
              setDropdownPosition('bottom');
          }
      }
      setIsOpen(!isOpen);
  };

  return (
    <div className="relative mb-[1.25vw]" ref={dropdownRef}>
      {label && (
         <div className="text-[0.68vw] font-medium text-gray-600 mb-[0.5vw] flex items-center justify-between">
            {label} <span>:</span>
         </div>
      )}
      
      <div 
        className={`w-full px-[0.75vw] py-[0.5vw] flex items-center justify-between bg-white border ${isOpen ? 'border-[#5d5efc] ring-1 ring-[#5d5efc]/20' : 'border-gray-200'} rounded-[0.5vw] shadow-sm cursor-pointer transition-all hover:border-gray-300`}
        onClick={toggleDropdown}
      >
         <span className="text-[0.65vw] font-medium text-gray-700 capitalize">
            {selectedOption?.label || value}
         </span>
         <Icon 
            icon="heroicons:chevron-down" 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            width="0.75vw" 
            height="0.75vw" 
         />
      </div>

      {isOpen && (
        <div className={`absolute left-0 right-0 bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-50 max-h-[12vw] overflow-y-auto custom-scrollbar ${
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
            {options.map((opt) => (
                <div 
                    key={opt.value}
                    className={`px-[0.75vw] py-[0.5vw] text-[0.65vw] cursor-pointer transition-colors ${value === opt.value ? 'bg-indigo-50 text-[#5d5efc] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                    }}
                >
                    {opt.label}
                </div>
            ))}
        </div>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)}></div>
      )}
    </div>
  );
};

export default function Customized({ 
    controls, 
    updateControl, 
    activePanel, 
    setActivePanel, 
    transformValues, 
    onManualTransformChange, 
    onResetFactor, 
    onResetTransform,
    onUvUnwrap,
    onMapUpload,
    selectedTextureId,
    onSelectTexture,
    savedHdrs = [],
    onDeleteHdr,
    hasAnimations,
    isAnimationPlaying,
    onToggleAnimation
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorType, setActiveColorType] = useState('color');
  const [pickerPos, setPickerPos] = useState({ top: 0, right: 0 });
  const lightPadRef = useRef(null);
  const [isDraggingLight, setIsDraggingLight] = useState(false);
  const controlsRef = useRef(controls);
  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  const currentGalleryTexture = useMemo(() => {
    if (!selectedTextureId) return null;
    const predefined = textureData.find((t) => t.id === selectedTextureId);
    if (predefined) return predefined;

    // Support Uploaded Textures: Fallback to current selection if ID matches
    const applied = controls.appliedTexture;
    if (applied && (applied.id === selectedTextureId || applied._id === selectedTextureId)) {
      return {
        ...applied,
        preview: resolveUploadsPath(applied.thumb || applied.preview),
      };
    }
    return null;
  }, [selectedTextureId, controls.appliedTexture]);

  const handleColorClick = (e, type = 'color') => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const topPos = Math.max(10, rect.top - 80);
      setPickerPos({ 
          top: topPos, 
          right: window.innerWidth - rect.left + 16 
      });
      setActiveColorType(type);
      setShowColorPicker(!showColorPicker);
  };

  const [openInnerAccordion, setOpenInnerAccordion] = useState("base");

  const handlePanelToggle = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  const toggleInnerAccordion = (name) => {
    setOpenInnerAccordion(openInnerAccordion === name ? null : name);
  };

  const handleLightPadInteraction = (e) => {
      if (!lightPadRef.current) return;
      
      const rect = lightPadRef.current.getBoundingClientRect();
      const isTouch = e.type && e.type.startsWith('touch');
      const clientX = isTouch && e.touches && e.touches.length > 0 ? e.touches[0].clientX : (e.clientX ?? 0);
      const clientY = isTouch && e.touches && e.touches.length > 0 ? e.touches[0].clientY : (e.clientY ?? 0);
      
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const radius = rect.width / 2;
      
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Visual orbit radius matches maxVisualPercent (38% of dome width = radius * 0.76)
      const maxVisualRadius = radius * 0.76;
      let clampedDx = dx;
      let clampedDy = dy;
      
      if (dist > maxVisualRadius && dist > 0) {
          clampedDx = (dx / dist) * maxVisualRadius;
          clampedDy = (dy / dist) * maxVisualRadius;
      }
      
      // Map normalized circular displacement to [-20, 20] coordinate range
      const MAX_COORD = 20;
      const normX = clampedDx / maxVisualRadius;
      const normY = clampedDy / maxVisualRadius;
      
      const newX = normX * MAX_COORD;
      const newY = -normY * MAX_COORD; // Screen up is positive Y (North)
      
      const currentPos = controlsRef.current?.lightPosition || controls.lightPosition || { x: 10, y: 10, z: 10 };
      updateControl('lightPosition', { 
          ...currentPos, 
          x: Math.round(newX * 10) / 10, 
          y: Math.round(newY * 10) / 10 
      });
  };

  const handleLightWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      const currentPos = controlsRef.current?.lightPosition || controls.lightPosition || { x: 10, y: 10, z: 10 };
      const currentZ = currentPos.z ?? 10;
      const newZ = Math.max(1, Math.min(50, Math.round(currentZ + delta)));
      updateControl('lightPosition', {
          ...currentPos,
          z: newZ
      });
  };

  // Drag listener
  useEffect(() => {
      if (!isDraggingLight) return;
      
      const handleMove = (e) => {
          handleLightPadInteraction(e);
      };
      
      const handleUp = () => {
          setIsDraggingLight(false);
      };
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
      
      return () => {
          window.removeEventListener('mousemove', handleMove);
          window.removeEventListener('mouseup', handleUp);
          window.removeEventListener('touchmove', handleMove);
          window.removeEventListener('touchend', handleUp);
      };
  }, [isDraggingLight]);

  // Helper to format values safely
  const fmt = (val) => (val !== undefined && val !== null) ? Number(val).toFixed(2) : "0.00";
  const fmtDeg = (rad) => (rad !== undefined && rad !== null) ? Math.round(rad * (180 / Math.PI)) : "0";
  const isNoneSelected = selectedTextureId === 'none';

  return (
    <div className={`flex flex-col gap-[0.25vw] pb-[2.5vw] ${isDraggingLight ? 'select-none' : ''}`}>
      <Accordion
        title="Material Properties"
        icon="icon-park-outline:texture-two"
        isOpen={activePanel === "factor"}
        onToggle={() => handlePanelToggle("factor")}
        onReset={onResetFactor}
      >
        <div className="space-y-[1.2vw]">
            {/* Texture Maps Section */}
            <div>
                <div className="flex items-center justify-between mb-[1vw]">
                   <div className="flex items-center gap-[0.75vw] flex-1">
                      <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">
                        Textures : <span className="text-gray-600 ml-[0.25vw]">{currentGalleryTexture?.name || "Default"}</span>
                      </span>
                      <div className="h-[0.05vw] bg-gray-100 flex-1"></div>
                   </div>
                   <button 
                    onClick={() => onSelectTexture({ id: null, maps: {} })}
                    className="flex items-center gap-[0.4vw] ml-[0.5vw] px-[0.65vw] py-[0.35vw] bg-gray-100 rounded-[0.4vw] text-gray-700 hover:bg-gray-200 transition-colors shrink-0 group"
                   >
                      <span className="text-[0.75vw] font-semibold">Reset</span>
                      <Icon icon="solar:restart-bold" className="text-gray-500 group-hover:rotate-[-90deg] transition-transform duration-300 w-[1vw] h-[1vw]" />
                   </button>
                </div>

                <div className="flex flex-col">
                    <MapAccordion 
                        title="Base Map"
                        isOpen={openInnerAccordion === "base"}
                        onToggle={() => toggleInnerAccordion("base")}
                        value={controls.colorIntensity ?? 100}
                        onChange={(v) => updateControl("colorIntensity", v)}
                        mapType="map"
                        currentMap={controls.maps?.map || currentGalleryTexture?.maps?.map || currentGalleryTexture?.preview}
                        onUpload={onMapUpload}
                        description="Defines the main color and surface appearance of the material."
                        disabled={isNoneSelected}
                        extra={
                            <div className="flex items-center gap-[0.5vw]">
                                <div 
                                    className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-300 shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0"
                                    style={{ backgroundColor: controls.color || '#000000' }}
                                    onClick={(e) => handleColorClick(e, 'color')}
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                                <div 
                                    className="flex-1 flex items-center justify-between border border-gray-300 rounded-[0.4vw] px-[0.5vw] py-[0.4vw] bg-white cursor-pointer hover:border-[#5d5efc] transition-colors shadow-xs"
                                    onClick={(e) => handleColorClick(e, 'color')}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <input 
                                        type="text"
                                        className="text-[0.68vw] text-gray-700 font-bold uppercase tracking-tight bg-transparent border-none outline-none w-[3.2vw] p-0 cursor-text"
                                        value={controls?.color || '#ffffff'}
                                        onChange={(e) => updateControl('color', e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        spellCheck="false"
                                    />
                                    <span className="text-[0.68vw] text-gray-400 font-bold ml-[0.25vw] shrink-0">{controls.colorIntensity ?? 100}%</span>
                                </div>
                            </div>
                        }
                    />
                    <MapAccordion 
                        title="Normal Map"
                        isOpen={openInnerAccordion === "normal"}
                        onToggle={() => toggleInnerAccordion("normal")}
                        value={controls.normal ?? 100}
                        onChange={(v) => updateControl("normal", v)}
                        mapType="normalMap"
                        currentMap={controls.maps?.normalMap || controls.maps?.normal}
                        onUpload={onMapUpload}
                        description="Adds surface details like bumps and grooves without changing the model geometry."
                        disabled={isNoneSelected}
                    />
                    <MapAccordion 
                        title="Metallic Map"
                        isOpen={openInnerAccordion === "metallic"}
                        onToggle={() => toggleInnerAccordion("metallic")}
                        value={controls.metallic ?? 0}
                        onChange={(v) => updateControl("metallic", v)}
                        mapType="metalnessMap"
                        currentMap={controls.maps?.metalnessMap || controls.maps?.metallic || controls.maps?.metalness}
                        onUpload={onMapUpload}
                        description={"Determines which parts of the material behave like metal.\nWhite areas appear metallic, black areas remain non-metal."}
                        disabled={isNoneSelected}
                    />
                    <MapAccordion 
                        title="Roughness Map"
                        isOpen={openInnerAccordion === "roughness"}
                        onToggle={() => toggleInnerAccordion("roughness")}
                        value={controls.roughness ?? 50}
                        onChange={(v) => updateControl("roughness", v)}
                        mapType="roughnessMap"
                        currentMap={controls.maps?.roughnessMap || controls.maps?.roughness}
                        onUpload={onMapUpload}
                        description={"Controls how rough or smooth the material surface appears.\n\nLower values create a shiny surface."}
                        disabled={isNoneSelected}
                    />
                    <MapAccordion 
                        title="Displacement Map"
                        isOpen={openInnerAccordion === "bump"}
                        onToggle={() => toggleInnerAccordion("bump")}
                        value={controls.bump ?? 50}
                        onChange={(v) => updateControl("bump", v)}
                        mapType="displacementMap"
                        currentMap={controls.maps?.displacementMap || controls.maps?.bumpMap || controls.maps?.bump || controls.maps?.displacement}
                        onUpload={onMapUpload}
                        description="Physically displaces the vertices of the model to create real surface depth and topology."
                        disabled={isNoneSelected}
                    />
                    <MapAccordion 
                        title="A/O Map"
                        isOpen={openInnerAccordion === "ao"}
                        onToggle={() => toggleInnerAccordion("ao")}
                        value={controls.ao ?? 100}
                        onChange={(v) => updateControl("ao", v)}
                        mapType="aoMap"
                        currentMap={controls.maps?.aoMap || controls.maps?.ao}
                        onUpload={onMapUpload}
                        description="Enhances shadows in small crevices and corners to add depth and realism to the material."
                        disabled={isNoneSelected}
                    />
                    <MapAccordion 
                        title="Emissive Map"
                        isOpen={openInnerAccordion === "emissive"}
                        onToggle={() => toggleInnerAccordion("emissive")}
                        value={controls.emissiveIntensity ?? 0}
                        onChange={(v) => updateControl("emissiveIntensity", v)}
                        mapType="emissiveMap"
                        currentMap={controls.maps?.emissiveMap || controls.maps?.emissive}
                        onUpload={onMapUpload}
                        description="Adds glowing areas to the material."
                        disabled={isNoneSelected}
                        extra={
                            <div className="flex items-center gap-[0.5vw]">
                                <div 
                                    className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-300 shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0"
                                    style={{ backgroundColor: controls.emissiveColor || '#ffffff' }}
                                    onClick={(e) => handleColorClick(e, 'emissiveColor')}
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                                <div 
                                    className="flex-1 flex items-center justify-between border border-gray-300 rounded-[0.4vw] px-[0.5vw] py-[0.4vw] bg-white cursor-pointer hover:border-[#5d5efc] transition-colors shadow-xs"
                                    onClick={(e) => handleColorClick(e, 'emissiveColor')}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <input 
                                        type="text"
                                        className="text-[0.68vw] text-gray-700 font-bold uppercase tracking-tight bg-transparent border-none outline-none w-[3.2vw] p-0 cursor-text"
                                        value={controls?.emissiveColor || '#ffffff'}
                                        onChange={(e) => updateControl('emissiveColor', e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        spellCheck="false"
                                    />
                                    <span className="text-[0.68vw] text-gray-400 font-bold ml-[0.25vw] shrink-0">{controls.emissiveIntensity ?? 0}%</span>
                                </div>
                            </div>
                        }
                    />
                    <MapAccordion 
                        title="Opacity Map"
                        isOpen={openInnerAccordion === "opacity"}
                        onToggle={() => toggleInnerAccordion("opacity")}
                        value={controls.alpha ?? 100}
                        onChange={(v) => updateControl("alpha", v)}
                        mapType="alphaMap"
                        currentMap={controls.maps?.alphaMap || controls.maps?.opacity}
                        onUpload={onMapUpload}
                        description={"Controls the visibility of the material using a texture.\nWhite areas are opaque, black areas are fully transparent."}
                        disabled={isNoneSelected}
                    />
                </div>
            </div>

            {/* Opacity Section */}
            <div>
                <SectionHeader label="Opacity" />
                <p className="text-[0.7vw] text-gray-500 mb-[1vw] -mt-[0.5vw]">
                    Controls the <span className="text-[#5d5efc]">transparency</span> of the material.
                </p>
                <CustomSlider
                    label=""
                    value={controls.alpha ?? 100}
                    onChange={(v) => updateControl("alpha", v)}
                />

                {/* Animation On / Off Toggle (Only visible if model has animations) */}
                {hasAnimations && (
                    <div className="mt-[1vw] p-[0.75vw] bg-gray-50/80 rounded-[0.6vw] border border-gray-100 flex items-center justify-between transition-all duration-200">
                        <div className="flex items-center gap-[0.5vw]">
                            <div className={`w-[1.6vw] h-[1.6vw] rounded-[0.4vw] flex items-center justify-center transition-colors ${
                                isAnimationPlaying ? "bg-[#5d5efc]/10 text-[#5d5efc]" : "bg-gray-200 text-gray-400"
                            }`}>
                                <Icon 
                                    icon={isAnimationPlaying ? "solar:play-circle-bold" : "solar:pause-circle-bold"} 
                                    width="1.05vw" 
                                    height="1.05vw" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[0.75vw] font-semibold text-gray-800 leading-tight">Animation</span>
                                <span className="text-[0.55vw] text-gray-400 leading-tight">Play or pause 3D model motion</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-[0.5vw]">
                            <span className={`text-[0.65vw] font-bold uppercase tracking-wider select-none ${
                                isAnimationPlaying ? "text-[#5d5efc]" : "text-gray-400"
                            }`}>
                                {isAnimationPlaying ? "On" : "Off"}
                            </span>
                            <div
                                onClick={() => onToggleAnimation?.(!isAnimationPlaying)}
                                className={`w-[2.75vw] h-[1.5vw] rounded-full flex items-center px-[0.25vw] cursor-pointer transition-all duration-300 ${
                                    isAnimationPlaying ? "bg-[#5d5efc]" : "bg-gray-200"
                                }`}
                                title={isAnimationPlaying ? "Turn Animation Off" : "Turn Animation On"}
                            >
                                <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transition-transform duration-300 ${
                                    isAnimationPlaying ? "translate-x-[1.25vw]" : "translate-x-0"
                                }`} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Texture Placement Section */}
            <div className="pt-[0.5vw]">
                <SectionHeader label="Texture Placement" />
                
                <div className="space-y-[0.5vw] mt-[0.5vw]">
                    <CustomSlider
                        label="Scale"
                        value={controls.scale ?? 50}
                        onChange={(v) => updateControl("scale", v)}
                        min={1}
                        max={200}
                        unit="%"
                    />
                    <CustomSlider
                        label="Rotation"
                        value={controls.rotation ?? 0}
                        min={-180}
                        max={180}
                        onChange={(v) => updateControl("rotation", v)}
                        unit="°"
                    />
                    <CustomSlider
                        label="Offset (X)"
                        value={controls.offset?.x ?? 0}
                        onChange={(val) => updateControl('offset', { ...(controls.offset || {x:0,y:0}), x: val })}
                        min={-100}
                        max={100}
                        step={0.1}
                        unit="%"
                    />
                    <CustomSlider
                        label="Offset (Y)"
                        value={controls.offset?.y ?? 0}
                        onChange={(val) => updateControl('offset', { ...(controls.offset || {x:0,y:0}), y: val })}
                        min={-100}
                        max={100}
                        step={0.1}
                        unit="%"
                    />
                </div>

            </div>
        </div>
      </Accordion>

      {/* 2. Position Section (Updated) */}
      <Accordion
        title="Model Position"
        icon="hugeicons:3d-move"
        iconSize="1.25vw"
        isOpen={activePanel === "position"}
        onToggle={() => handlePanelToggle("position")}
        onReset={() => onResetTransform('all')}
      >
        <div className="flex flex-col gap-[0.25vw] pb-[0.5vw]">
           {/* Move Row */}
           <div className="flex items-end justify-between py-[0.5vw] px-[0.25vw]">
              <div className="flex items-center gap-[0.25vw] w-[3.5vw] mb-[0.25vw]">
                <span className="text-[0.75vw] font-medium text-gray-600">Move:</span>
                <button onClick={() => onResetTransform('position')} className="text-gray-400 hover:text-[#5d5efc] transition-colors p-[0.1vw] rounded hover:bg-gray-100">
                   <Icon icon="ix:reset" width="0.75vw" height="0.75vw" />
                </button>
              </div>
              <div className="flex gap-[0.5vw]">
                  <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">X</span>
                    <NumberStepper value={fmt(transformValues?.position?.x)} compact onChange={(val, isDragging) => onManualTransformChange('position', 'x', val, isDragging)} step={0.5} />
                  </div>
                  <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">Y</span>
                    <NumberStepper value={fmt(transformValues?.position?.y)} compact onChange={(val, isDragging) => onManualTransformChange('position', 'y', val, isDragging)} step={0.5} />
                  </div>
                  <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">Z</span>
                    <NumberStepper value={fmt(transformValues?.position?.z)} compact onChange={(val, isDragging) => onManualTransformChange('position', 'z', val, isDragging)} step={0.5} />
                  </div>
              </div>
           </div>

           {/* Rotate Row - with subtle background */}
           <div className="flex items-end justify-between py-[0.5vw] px-[0.25vw] bg-gray-50 rounded-[0.5vw]">
              <div className="flex items-center gap-[0.25vw] w-[3.5vw] mb-[0.25vw]">
                <span className="text-[0.75vw] font-medium text-gray-600">Rotate:</span>
                <button onClick={() => onResetTransform('rotation')} className="text-gray-400 hover:text-[#5d5efc] transition-colors p-[0.1vw] rounded hover:bg-white">
                   <Icon icon="ix:reset" width="0.75vw" height="0.75vw" />
                </button>
              </div>
              <div className="flex gap-[0.5vw]">
                  <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">X</span>
                    <NumberStepper value={fmtDeg(transformValues?.rotation?.x)} compact onChange={(val, isDragging) => onManualTransformChange('rotation', 'x', val, isDragging)} step={5} />
                  </div>
                  <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">Y</span>
                    <NumberStepper value={fmtDeg(transformValues?.rotation?.y)} compact onChange={(val, isDragging) => onManualTransformChange('rotation', 'y', val, isDragging)} step={5} />
                  </div>
                  <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">Z</span>
                    <NumberStepper value={fmtDeg(transformValues?.rotation?.z)} compact onChange={(val, isDragging) => onManualTransformChange('rotation', 'z', val, isDragging)} step={5} />
                  </div>
              </div>
           </div>

           {/* Scale Row */}
           <div className="flex items-end justify-between py-[0.5vw] px-[0.25vw]">
              <div className="flex items-center gap-[0.25vw] w-[3.5vw] mb-[0.25vw]">
                <span className="text-[0.75vw] font-medium text-gray-600">Scale:</span>
                <button onClick={() => onResetTransform('scale')} className="text-gray-400 hover:text-[#5d5efc] transition-colors p-[0.1vw] rounded hover:bg-gray-100">
                   <Icon icon="ix:reset" width="0.75vw" height="0.75vw" />
                </button>
              </div>
              <div className="flex gap-[0.5vw]">
                  <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">X</span>
                    <NumberStepper value={fmt(transformValues?.scale?.x)} compact min={0.01} onChange={(val, isDragging) => onManualTransformChange('scale', 'x', val, isDragging)} step={0.1} />
                  </div>
                  <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">Y</span>
                    <NumberStepper value={fmt(transformValues?.scale?.y)} compact min={0.01} onChange={(val, isDragging) => onManualTransformChange('scale', 'y', val, isDragging)} step={0.1} />
                  </div>
                  <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">Z</span>
                    <NumberStepper value={fmt(transformValues?.scale?.z)} compact min={0.01} onChange={(val, isDragging) => onManualTransformChange('scale', 'z', val, isDragging)} step={0.1} />
                  </div>
              </div>
           </div>
        </div>
      </Accordion>

      {/* --- LIGHTING CONTROLS --- */}
      <Accordion
        title="Lighting Controls"
        icon="ix:light-dark"
        isOpen={activePanel === "lighting"}
        onToggle={() => handlePanelToggle("lighting")}
      >
        {(() => {
          const lightPos = controls.lightPosition || { x: 10, y: 10, z: 10 };
          const rawPosX = lightPos.x ?? 10;
          const rawPosY = lightPos.y ?? 10;
          const MAX_LIGHT_COORD = 20;
          const coordDist = Math.sqrt(rawPosX * rawPosX + rawPosY * rawPosY);
          const visualScale = coordDist > MAX_LIGHT_COORD && coordDist > 0 ? MAX_LIGHT_COORD / coordDist : 1;
          const clampedCoordX = rawPosX * visualScale;
          const clampedCoordY = rawPosY * visualScale;
          
          // Visual boundary radius in percent inside the circular dome
          // Center is 50%. Max reach is 38% from center (leaves 12% margin so the 1.25vw sun icon stays completely inside)
          const maxVisualPercent = 38;
          const sunPercentX = 50 + (clampedCoordX / MAX_LIGHT_COORD) * maxVisualPercent;
          const sunPercentY = 50 - (clampedCoordY / MAX_LIGHT_COORD) * maxVisualPercent;

          return (
            <>
              {/* Rounded Circular Lighting Structure Container */}
              <div 
                  className="relative bg-[#f8fafc] rounded-[0.75vw] border border-gray-100/90 py-[0.85vw] px-[0.75vw] mb-[1.5vw] flex flex-col items-center justify-center shadow-inner overflow-hidden"
                  onMouseDown={(e) => {
                      setIsDraggingLight(true);
                      handleLightPadInteraction(e);
                  }}
                  onTouchStart={(e) => {
                      setIsDraggingLight(true);
                      handleLightPadInteraction(e);
                  }}
                  onWheel={handleLightWheel}
              >
                  {/* Circular Dome Structure (Strictly locks sun movement inside) */}
                  <div 
                      ref={lightPadRef}
                      className={`relative w-[9.2vw] h-[9.2vw] rounded-full bg-linear-to-b from-white via-[#fcfdff] to-[#f1f5f9] border-2 border-slate-200/90 shadow-[inset_0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center overflow-hidden select-none transition-shadow ${isDraggingLight ? 'cursor-grabbing shadow-[inset_0_2px_12px_rgba(245,158,11,0.15),0_0_0_2px_rgba(245,158,11,0.35)]' : 'cursor-crosshair hover:border-slate-300'}`}
                  >
                      {/* Subtle Crosshair Axes */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-full h-[1px] bg-slate-200/50"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="h-full w-[1px] bg-slate-200/50"></div>
                      </div>

                      {/* Outer Orbit Guide Track (defines the boundary where the sun travels) */}
                      <div 
                          className="absolute rounded-full border border-dashed border-amber-300/40 pointer-events-none"
                          style={{ width: `${maxVisualPercent * 2}%`, height: `${maxVisualPercent * 2}%` }}
                      ></div>

                      {/* Inner Orbit Guide Track */}
                      <div 
                          className="absolute rounded-full border border-slate-200/60 pointer-events-none"
                          style={{ width: '42%', height: '42%' }}
                      ></div>

                      {/* Cardinal Tick Marks */}
                      <span className="absolute top-[0.25vw] text-[0.45vw] font-bold text-slate-300 tracking-wider pointer-events-none">N</span>
                      <span className="absolute bottom-[0.25vw] text-[0.45vw] font-bold text-slate-300 tracking-wider pointer-events-none">S</span>
                      <span className="absolute left-[0.35vw] text-[0.45vw] font-bold text-slate-300 tracking-wider pointer-events-none">W</span>
                      <span className="absolute right-[0.35vw] text-[0.45vw] font-bold text-slate-300 tracking-wider pointer-events-none">E</span>

                      {/* Visual Sun Ray Line from Center (Model) to Sun */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-1">
                          <line 
                              x1="50%" 
                              y1="50%" 
                              x2={`${sunPercentX}%`} 
                              y2={`${sunPercentY}%`} 
                              stroke="#f59e0b" 
                              strokeWidth="1.5" 
                              strokeDasharray="4 3"
                              strokeLinecap="round"
                              className="opacity-75"
                          />
                      </svg>

                      {/* Dynamic Sun Position based on lightPosition (strictly kept inside rounded structure) */}
                      <div 
                          className={`absolute text-amber-500 drop-shadow-[0_1px_4px_rgba(245,158,11,0.45)] pointer-events-none z-2 ${isDraggingLight ? '' : 'transition-all duration-200 ease-out'}`}
                          style={{
                            left: `${sunPercentX}%`,
                            top: `${sunPercentY}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                      >
                          <div className="relative flex items-center justify-center">
                              <div className="absolute w-[1.5vw] h-[1.5vw] rounded-full bg-amber-400/20 animate-pulse pointer-events-none"></div>
                              <Icon icon="heroicons:sun" width="1.25vw" height="1.25vw" className="relative z-1" />
                          </div>
                      </div>

                      {/* Center Pivot: Model Preview */}
                      <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-gray-500 transition-colors z-2 pointer-events-none">
                          <Icon icon="heroicons:cube" width="1.6vw" height="1.6vw" className="stroke-1 text-slate-400" />
                          <span className="text-[0.48vw] mt-[0.2vw] font-semibold tracking-wider text-slate-400 uppercase">MODEL</span>
                      </div>
                  </div>

                  {/* Hint below dome */}
                  <div className="mt-[0.5vw] flex items-center gap-[0.35vw] text-[0.55vw] text-slate-400 font-medium select-none pointer-events-none">
                      <Icon icon="heroicons:cursor-arrow-rays" width="0.7vw" height="0.7vw" className="text-amber-500/70" />
                      <span>Drag inside circle &bull; Scroll for Z height</span>
                  </div>
              </div>

              <div className="flex justify-center gap-[0.5vw] mb-[2vw]">
                  <NumberStepper 
                      value={Math.round(controls.lightPosition?.x || 10)} 
                      axisLabel="X" 
                      compact 
                      min={-20}
                      max={20}
                      onChange={(val) => updateControl('lightPosition', { ...controls.lightPosition, x: val })}
                      step={1}
                  />
                  <NumberStepper 
                      value={Math.round(controls.lightPosition?.y || 10)} 
                      axisLabel="Y" 
                      compact 
                      min={-20}
                      max={20}
                      onChange={(val) => updateControl('lightPosition', { ...controls.lightPosition, y: val })}
                      step={1}
                  />
                  <NumberStepper 
                      value={Math.round(controls.lightPosition?.z || 10)} 
                      axisLabel="Z" 
                      compact 
                      min={1}
                      max={50}
                      onChange={(val) => updateControl('lightPosition', { ...controls.lightPosition, z: Math.max(1, val) })}
                      step={1}
                  />
              </div>
            </>
          );
        })()}

        <div className="space-y-[1.5vw]">
            <div>
                <SectionHeader label="Environment" />
                <div className="flex items-center gap-[0.75vw] mb-[0.5vw]">
                    <div className="flex-1">
                        <CustomDropdown 
                            value={controls.environment || 'studio'}
                            onChange={(val) => updateControl('environment', val)}
                            options={[
                                ...(savedHdrs || []).map(hdr => ({
                                    label: `HDR: ${hdr.name.replace(/\.[^/.]+$/, "")}`,
                                    value: hdr.id.startsWith('custom_') ? hdr.id : `custom_${hdr.id}`
                                })),
                                { label: 'City', value: 'city' },
                                { label: 'Apartment', value: 'apartment' },
                                { label: 'Dawn', value: 'dawn' },
                                { label: 'Forest', value: 'forest' },
                                { label: 'Lobby', value: 'lobby' },
                                { label: 'Night', value: 'night' },
                                { label: 'Park', value: 'park' },
                                { label: 'Studio', value: 'studio' },
                                { label: 'Sunset', value: 'sunset' },
                                { label: 'Warehouse', value: 'warehouse' },
                            ]}
                        />
                    </div>
                    <div className="mb-[1.25vw]">
                        <MapUploadControl 
                            mapType="envMap" 
                            currentMap={controls.customEnvMap || controls.maps?.envMap} 
                            onUpload={onMapUpload} 
                        />
                    </div>
                </div>

                {savedHdrs && savedHdrs.length > 0 && (
                    <div className="mb-[0.75vw]">
                        <div className="text-[0.62vw] text-gray-400 font-medium mb-[0.3vw] flex items-center justify-between">
                            <span>Saved Custom HDRs</span>
                            <span className="text-[0.55vw] text-gray-400">{savedHdrs.length} saved locally</span>
                        </div>
                        <div className="grid grid-cols-2 gap-[0.35vw] max-h-[6vw] overflow-y-auto custom-scrollbar p-[0.1vw]">
                            {savedHdrs.map(hdr => {
                                const hdrVal = hdr.id.startsWith('custom_') ? hdr.id : `custom_${hdr.id}`;
                                const isActive = controls.environment === hdrVal || controls.customEnvMap === hdr.url;
                                return (
                                    <div 
                                        key={hdr.id}
                                        onClick={() => updateControl('environment', hdrVal)}
                                        className={`group flex items-center gap-[0.3vw] px-[0.5vw] py-[0.25vw] rounded-[0.35vw] border text-[0.62vw] cursor-pointer transition-all min-w-0 w-full ${
                                            isActive 
                                                ? 'bg-[#5d5efc]/10 border-[#5d5efc] text-[#5d5efc] font-semibold shadow-xs' 
                                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                                        }`}
                                        title={hdr.name}
                                    >
                                        <Icon icon="solar:sun-fog-bold" className="w-[0.75vw] h-[0.75vw] shrink-0" />
                                        <span className="truncate flex-1 min-w-0">{hdr.name.replace(/\.[^/.]+$/, "")}</span>
                                        {onDeleteHdr && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteHdr(hdr.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-[0.1vw] hover:text-red-500 rounded transition-opacity ml-auto shrink-0"
                                                title="Delete saved HDR"
                                            >
                                                <Icon icon="solar:trash-bin-trash-linear" className="w-[0.65vw] h-[0.65vw]" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                <div className="mt-[0.5vw]">
                    <CustomSlider
                        label="Env Rotation"
                        value={controls.envRotation ?? 0}
                        min={0}
                        max={360}
                        onChange={(v) => updateControl("envRotation", v)}
                        unit="°"
                    />
                </div>

                <div className="mt-[1.5vw]">
                    <SectionHeader label="Lighting & Reflection" />
                    <div className="space-y-[0.25vw]">
                        <CustomSlider
                            label="Specular"
                            value={controls.specular ?? 50}
                            onChange={(v) => updateControl("specular", v)}
                        />
                        <CustomSlider
                            label="Reflection"
                            value={controls.reflection ?? 50}
                            onChange={(v) => updateControl("reflection", v)}
                        />
                        <CustomSlider
                            label="World Opacity"
                            value={controls.worldOpacity ?? 0}
                            onChange={(v) => updateControl("worldOpacity", v)}
                        />
                        <CustomSlider
                            label="World Blur"
                            value={controls.worldBlur ?? 0}
                            onChange={(v) => updateControl("worldBlur", v)}
                        />
                    </div>
                </div>
            </div>

            <div>
                <SectionHeader label="Adjust Shadow" />
                <div className="space-y-[0.25vw]">
                    <CustomSlider
                        label="Shadow"
                        value={controls.shadow ?? 50}
                        onChange={(v) => updateControl("shadow", v)}
                    />
                    <CustomSlider
                        label="Softness"
                        value={controls.softness ?? 50}
                        onChange={(v) => updateControl("softness", v)}
                    />
                </div>
            </div>
        </div>
      </Accordion>

       {showColorPicker && createPortal(
            <ColorPicker
                color={controls[activeColorType] || (activeColorType === 'emissiveColor' ? '#ffffff' : '#000000')}
                onChange={(color) => updateControl(activeColorType, color)}
                opacity={activeColorType === 'color' ? (controls.colorIntensity ?? 100) : (controls.emissiveIntensity ?? 0)}
                onOpacityChange={(v) => updateControl(activeColorType === 'color' ? "colorIntensity" : "emissiveIntensity", v)}
                onClose={() => setShowColorPicker(false)}
                style={{ 
                    position: 'fixed', 
                    top: pickerPos.top, 
                    right: pickerPos.right, 
                    zIndex: 9999 
                }}
            />,
            document.body
        )}
    </div>
  );
}
