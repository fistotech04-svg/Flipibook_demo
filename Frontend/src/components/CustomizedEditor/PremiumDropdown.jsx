import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ChevronDown } from 'lucide-react';

const PremiumDropdown = ({ 
  options, 
  value, 
  onChange, 
  width = '9vw', 
  menuWidth = 'w-full',
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  isFont = false,
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative dropdown-container ${className} ${isOpen ? 'z-[1001]' : ''}`} ref={dropdownRef} style={{ width }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[1.9vw] bg-white rounded-[0.5vw] px-[0.5vw] py-[0.45vw] flex items-center justify-between shadow-sm hover:shadow-md transition-all active:scale-95 border border-gray-100 group ${buttonClassName}`}
      >
        <span 
          className="text-[0.78vw] font-semibold text-gray-700 align-center text-left flex-1"
          style={isFont ? { fontFamily: value } : {}}
        >
          {value || placeholder}
        </span>
        <Icon icon="ph:caret-down-bold" className={`w-[0.9vw] h-[0.9vw] text-gray-700 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#5551FF]' : 'group-hover:text-gray-600'}`} />
      </button>
      
      {isOpen && (
        <div 
          className={`absolute top-full mt-[0.5vw] ${align === 'right' ? 'right-0' : 'left-0'} ${menuWidth === 'w-full' ? 'w-full' : ''} bg-white rounded-[0.6vw] shadow-[0_1.25vw_3.125vw_rgba(0,0,0,0.15)] border border-gray-50 z-[100] overflow-hidden py-[0.5vw] animate-in fade-in slide-in-from-top-2`}
          style={menuWidth !== 'w-full' ? { width: menuWidth, zIndex: 9999 } : { zIndex: 9999 }}
        >
          <div className="max-h-[12vw] overflow-y-auto custom-scrollbar">
            {options.map((opt) => {
              const optionValue = typeof opt === 'string' ? opt : opt.value;
              const optionLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = value === optionValue;
              
              return (
                <button
                  key={optionValue}
                  disabled={opt.disabled}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(optionValue);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full text-center px-[1.1vw] py-[0.5vw] text-[0.75vw] items-center font-semibold transition-colors ${
                    opt.disabled 
                      ? 'opacity-40 cursor-not-allowed' 
                      : isSelected 
                        ? 'text-[#3E4491] bg-gray-50' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#3E4491]'
                  }`}
                  style={isFont ? { fontFamily: optionValue } : {}}
                >
                  {optionLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumDropdown;
