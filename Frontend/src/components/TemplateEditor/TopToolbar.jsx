import React, { useState, useEffect, useRef } from 'react';
import { Undo2, Redo2, Plus, Minus } from 'lucide-react';
import { Icon } from '@iconify/react';
import { MaskIcon, FlattenIcon } from './Elements/EditorIcons';

const TopToolbar = ({ 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo,
  rotation = 0,
  onRotate,
  onFlipH,
  onFlipV,
  onAlign,
  hasSelection,
  hideTools = false,
  selectedLayerId = null
}) => {
  const [showRotationOptions, setShowRotationOptions] = useState(false);
  const rotationRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartValue = useRef(0);
  const [localRotation, setLocalRotation] = useState(rotation);

  useEffect(() => {
    setLocalRotation(rotation);
  }, [rotation]);

  const handleRotationChange = (e) => {
    const val = parseInt(e.target.value);
    setLocalRotation(isNaN(val) ? '' : val);
  };

  const handleRotationBlur = () => {
    let val = parseInt(localRotation);
    if (isNaN(val)) val = 0;
    const wrappedVal = ((val % 360) + 360) % 360;
    setLocalRotation(wrappedVal);
    if (onRotate) onRotate(wrappedVal);
  };

  const handleRotationKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRotationBlur();
      e.target.blur();
    }
  };

  const hasMoved = useRef(false);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    hasMoved.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartValue.current = localRotation || 0;
    document.body.style.cursor = 'ew-resize';
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      if (Math.abs(deltaX) > 2) {
        hasMoved.current = true;
      }
      
      let newValue = Math.round(dragStartValue.current + deltaX);
      newValue = ((newValue % 360) + 360) % 360;
      
      setLocalRotation(newValue);
      if (onRotate) onRotate(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onRotate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rotationRef.current && !rotationRef.current.contains(event.target)) {
        setShowRotationOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      className="bg-[#FFFFFF] border-b border-[#EEEEEE] flex items-center justify-between px-[1.5vw] flex-shrink-0 select-none"
      style={{ height: '7vh', width: '100%' }}
    >
      {/* Left Section: History */}
      <div className="flex items-center gap-[1.5vw]">
        <div className="relative group/tt flex flex-col items-center">
          <div 
            onClick={canUndo ? onUndo : undefined}
            className={`flex flex-col items-center group ${canUndo ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'}`}
          >
            <Undo2 size="1.2vw" className={`text-[#374151] ${canUndo ? 'group-hover:text-black' : ''} transition-colors`} />
          </div>
          {canUndo && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
              <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
              <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                Undo
              </div>
            </div>
          )}
        </div>

        <div className="relative group/tt flex flex-col items-center">
          <div 
            onClick={canRedo ? onRedo : undefined}
            className={`flex flex-col items-center group ${canRedo ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'}`}
          >
            <Redo2 size="1.2vw" className={`text-[#374151] ${canRedo ? 'group-hover:text-black' : ''} transition-colors`} />
          </div>
          {canRedo && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
              <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
              <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                Redo
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Section: Alignment Groups & Mask / Flatten */}
      {!hideTools && (
        <div className={`flex items-center gap-[0.8vw] ${!hasSelection ? 'opacity-30 pointer-events-none' : ''}`}>
          {/* Pill 1: Horizontal Alignment */}
          <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw]">
            <div className="relative group/tt flex items-center justify-center">
              <div onClick={() => onAlign && onAlign('left')} className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
                <Icon icon="line-md:arrow-align-left" width="1.1vw" className="text-[#374151]" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                  Align Left
                </div>
              </div>
            </div>

            <div className="relative group/tt flex items-center justify-center">
              <div onClick={() => onAlign && onAlign('center')} className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
                <Icon icon="line-md:arrow-align-center" width="1.1vw" className="text-[#374151]" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                  Align Center
                </div>
              </div>
            </div>

            <div className="relative group/tt flex items-center justify-center">
              <div onClick={() => onAlign && onAlign('right')} className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
                <Icon icon="line-md:arrow-align-right" width="1.1vw" className="text-[#374151]" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                  Align Right
                </div>
              </div>
            </div>
          </div>

          {/* Pill 2: Vertical Alignment */}
          <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw]">
            <div className="relative group/tt flex items-center justify-center">
              <div onClick={() => onAlign && onAlign('top')} className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
                <Icon icon="mdi:format-align-top" width="1.1vw" className="text-[#374151]" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                  Align Top
                </div>
              </div>
            </div>

            <div className="relative group/tt flex items-center justify-center">
              <div onClick={() => onAlign && onAlign('middle')} className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
                <Icon icon="mdi:format-align-middle" width="1.1vw" className="text-[#374151]" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                  Align Middle
                </div>
              </div>
            </div>

            <div className="relative group/tt flex items-center justify-center">
              <div onClick={() => onAlign && onAlign('bottom')} className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
                <Icon icon="mdi:format-align-bottom" width="1.1vw" className="text-[#374151]" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                  Align Bottom
                </div>
              </div>
            </div>
          </div>

          {/* Pill 3: Distribution */}
          <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw]">
            <div className="relative group/tt flex items-center justify-center">
              <div onClick={() => onAlign && onAlign('distribute-h')} className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
                <Icon icon="icon-park-outline:distribute-horizontally" width="1.1vw" className="text-[#374151]" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                  Distribute Horizontally
                </div>
              </div>
            </div>

            <div className="relative group/tt flex items-center justify-center">
              <div onClick={() => onAlign && onAlign('distribute-v')} className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
                <Icon icon="icon-park-outline:distribute-vertically" width="1.1vw" className="text-[#374151]" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                  Distribute Vertically
                </div>
              </div>
            </div>
          </div>

          {/* Thin Vertical Divider (as shown in image) */}
          <div className="w-[1px] h-[1.8vw] bg-gray-200 mx-[0.2vw]" />

          {/* Mask Option */}
          {(() => {
            const doc = typeof document !== 'undefined' ? (document.getElementById('main-flipbook-editor')?.contentDocument || document) : null;
            const el = doc && selectedLayerId ? doc.getElementById(selectedLayerId) : null;
            const isMaskActive = el && (
              el.getAttribute('data-type') === 'mask-group' ||
              el.closest('[data-type="mask-group"]') !== null ||
              el.getAttribute('data-mask-enabled') === 'true' ||
              (el.getAttribute('fill') && el.getAttribute('fill').includes('url(#pattern-')) ||
              el.querySelector('[data-mask-enabled="true"]') !== null ||
              el.querySelector('[fill*="url(#pattern-"]') !== null
            );
            return (
              <div className="relative group/tt flex items-center justify-center">
                <button
                  onClick={() => {
                    if (hasSelection) {
                      window.dispatchEvent(new CustomEvent('trigger-mask'));
                    }
                  }}
                  className={`flex flex-col items-center justify-center px-[0.5vw] py-[0.2vw] ${
                    isMaskActive ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'hover:bg-[#F3F4F6] text-[#374151] hover:text-black'
                  } rounded-[0.4vw] cursor-pointer transition-colors group select-none`}
                >
                  <MaskIcon size="1.15vw" className={`${isMaskActive ? 'text-[#4F46E5]' : 'text-[#374151] group-hover:text-black'} transition-colors`} />
                  <span className={`text-[0.6vw] ${isMaskActive ? 'text-[#4F46E5] font-semibold' : 'text-[#4B5563] group-hover:text-black font-medium'} leading-tight mt-[0.15vw] transition-colors`}>
                    Mask
                  </span>
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                  <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                  <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                    {isMaskActive ? 'Unmask' : 'Use as Mask'}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Flatten Option */}
          <div className="relative group/tt flex items-center justify-center">
            <button
              onClick={() => {
                if (hasSelection) {
                  window.dispatchEvent(new CustomEvent('trigger-flatten'));
                }
              }}
              className="flex flex-col items-center justify-center px-[0.5vw] py-[0.2vw] hover:bg-[#F3F4F6] rounded-[0.4vw] cursor-pointer transition-colors group select-none"
            >
              <FlattenIcon size="1.15vw" className="text-[#374151] group-hover:text-black transition-colors" />
              <span className="text-[0.6vw] text-[#4B5563] font-medium leading-tight mt-[0.15vw] group-hover:text-black transition-colors">
                Flatten
              </span>
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
              <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
              <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                Flatten Selection
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right Section: Zoom Controls */}
      <div className="flex items-center gap-[1vw]">
        <div className="flex items-center bg-[#F3F4F6] p-[0.3vw] rounded-full gap-[0.2vw]">
          {/* Zoom Out */}
          <div className="relative group/tt flex items-center justify-center">
            <button 
              onClick={onZoomOut}
              tabIndex={-1}
              className="w-[1.9vw] h-[1.9vw] flex items-center justify-center hover:bg-white rounded-full cursor-pointer transition-all hover:shadow-sm text-[#374151] hover:text-black group"
            >
              <Minus size="0.9vw" strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
              <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
              <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                Zoom Out
              </div>
            </div>
          </div>
          
          {/* Zoom Label (e.g. 1x / 1.5x / 100%) */}
          <div className="px-[0.4vw] flex items-center justify-center min-w-[2.2vw]">
            <span className="text-[0.7vw] font-bold text-[#111827]">
              {zoom ? `${Math.round(zoom)}%` : '100%'}
            </span>
          </div>
          
          {/* Zoom In */}
          <div className="relative group/tt flex items-center justify-center">
            <button 
              onClick={onZoomIn}
              tabIndex={-1}
              className="w-[1.9vw] h-[1.9vw] flex items-center justify-center hover:bg-white rounded-full cursor-pointer transition-all hover:shadow-sm text-[#374151] hover:text-black group"
            >
              <Plus size="0.9vw" strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
              <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
              <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                Zoom In
              </div>
            </div>
          </div>
          
          {/* Reset Action Button with text "Reset" */}
          <div className="relative group/tt flex items-center justify-center ml-[0.2vw]">
            <button 
              onClick={onReset}
              tabIndex={-1}
              className="px-[0.6vw] h-[1.8vw] flex items-center justify-center bg-white hover:bg-gray-50 rounded-full cursor-pointer transition-all shadow-xs text-[#374151] hover:text-black font-medium text-[0.65vw]"
            >
              Reset
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.35vw] hidden group-hover/tt:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
              <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
              <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                Reset Zoom
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopToolbar;
