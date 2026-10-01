import React, { useRef, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { Icon } from '@iconify/react';

export const AdjustmentSlider = ({ label, value, onChange, onReset, min = -100, max = 100 }) => {
  const num = parseFloat(value) || 0;
  const percentage = ((num - min) / (max - min)) * 100;

  const isNegative = num < 0;
  const activeLeft = isNegative ? percentage : 50;
  const activeWidth = Math.abs(percentage - 50);

  return (
    <div className="flex flex-col gap-[0.2vw] mb-[0.1vw]">
      <style>{`
        .invisible-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          background: transparent;
          position: relative;
        }
        .invisible-range::before {
          content: "";
          position: absolute;
          top: -0.2vw;
          bottom: -0.2vw;
          left: 0;
          right: 0;
          cursor: pointer;
          z-index: 1;
        }
        .invisible-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 0;
          height: 0;
        }
      `}</style>
      <div className="flex items-center justify-between gap-[0.1vw]">
        <div className="flex items-center">
          <span className="text-[0.85vw] text-gray-600 font-medium">{label}</span>
          <button
            onClick={onReset}
            className="text-gray-600 hover:text-gray-900 transition-colors p-[0.1vw] pt-[0.4vw] cursor-pointer"
            title="Reset"
          >
            <Icon icon="ix:reset" width="0.9vw" height="0.9vw" style={{ strokeWidth: 2.5 }} />
          </button>
        </div>
        <span className="text-[0.76vw] font-medium text-gray-500">{num}</span>
      </div>

      <div className="relative flex items-center h-[1.5vw] w-full group">
        {/* Inactive thin gray track */}
        <div className="absolute w-full h-[0.25vw] bg-[#E2E8F0] rounded-full" />

        {/* Active thick blue track */}
        {num !== 0 && (
          <div
            className="absolute h-[0.25vw] bg-[#4D47FF] rounded-full pointer-events-none"
            style={{
              left: `${activeLeft}%`,
              width: `${activeWidth}%`,
              borderTopLeftRadius: isNegative ? '999px' : '0',
              borderBottomLeftRadius: isNegative ? '999px' : '0',
              borderTopRightRadius: isNegative ? '0' : '999px',
              borderBottomRightRadius: isNegative ? '0' : '999px',
            }}
          />
        )}

        {/* Thumb */}
        <div
          className="absolute w-[1vw] h-[1vw] bg-[#4D47FF] rounded-full pointer-events-none shadow-[0_0.15vw_0.5vw_rgba(77,71,255,0.4)] group-hover:shadow-[0_0.15vw_0.75vw_rgba(77,71,255,0.6)] transition-shadow duration-150"
          style={{ 
            left: `calc(${percentage}% - 0.5vw)`,
            border: '0.02vw solid #ffffff'
          }}
        />

        {/* Invisible range input for interaction */}
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={num}
          onChange={(e) => onChange(e.target.value)}
          className="invisible-range absolute w-full h-full opacity-0 cursor-pointer m-0"
        />
      </div>
    </div>
  );
};

const Adjustment = ({
  openSubSection, setOpenSubSection,
  filters, setFilters,
  tagName = 'rect',
  ...props
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (openSubSection === 'adjustment' && containerRef.current) {
      setTimeout(() => {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 350);
    }
  }, [openSubSection]);
  const pseudoProps = {
    'data-filter-exposure': filters?.exposure || 0,
    'data-filter-contrast': filters?.contrast || 0,
    'data-filter-saturation': filters?.saturation || 0,
    'data-filter-temperature': filters?.temperature || 0,
    'data-filter-tint': filters?.tint || 0,
    'data-filter-highlights': filters?.highlights || 0,
    'data-filter-shadows': filters?.shadows || 0,
    tagName: tagName
  };

  const handleUpdate = (page, layer, attr, value) => {
    if (attr.startsWith('data-filter-') && setFilters) {
      const filterName = attr.replace('data-filter-', '');
      setFilters(p => ({ ...p, [filterName]: parseFloat(value) }));
    }
  };

  const updateElementAttribute = (page, layer, attr, val) => {
    handleUpdate(page, layer, attr, val);
  };

  const handleResetAll = (e) => {
    e.stopPropagation();
    if (setFilters) {
      setFilters(p => ({
        ...p,
        exposure: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        tint: 0,
        highlights: 0,
        shadows: 0
      }));
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col font-sans">
      <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
        <div
          onClick={() => setOpenSubSection(openSubSection === 'adjustment' ? null : 'adjustment')}
          className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openSubSection === 'adjustment' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
        >
          <div className="flex items-center gap-[0.5vw]">
            <span className={`font-semibold text-[0.85vw] ${openSubSection === 'adjustment' ? 'text-gray-900' : 'text-gray-500'}`}>Adjustment</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            {openSubSection === 'adjustment' && (
              <button
                onClick={handleResetAll}
                className="text-gray-600 hover:text-gray-900 transition-colors p-[0.1vw] cursor-pointer flex items-center justify-center"
                title="Reset All"
              >
                <Icon icon="ix:reset" width="1.1vw" height="1.1vw" style={{ strokeWidth: 2.5 }} />
              </button>
            )}
            <ChevronUp size="1vw" className={`transition-transform duration-200 ${openSubSection === 'adjustment' ? 'text-gray-900' : 'rotate-180 text-gray-500'}`} />
          </div>
        </div>

        <div className={`grid transition-all duration-300 ease-in-out ${openSubSection === 'adjustment' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-[1.5vw] space-y-[0.8vw]">
              {['exposure', 'contrast', 'saturation', 'temperature', 'tint', 'highlights', 'shadows'].map((filter) => (
                <AdjustmentSlider
                  key={filter}
                  label={filter.charAt(0).toUpperCase() + filter.slice(1)}
                  value={pseudoProps[`data-filter-${filter}`] || 0}
                  onChange={(val) => updateElementAttribute(undefined, undefined, `data-filter-${filter}`, val)}
                  onReset={() => updateElementAttribute(undefined, undefined, `data-filter-${filter}`, 0)}
                  min={-100}
                  max={100}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Adjustment;
