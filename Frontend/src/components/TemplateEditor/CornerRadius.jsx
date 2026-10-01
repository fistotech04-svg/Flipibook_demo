import React, { useRef, useEffect } from 'react';
import { ChevronUp, ChevronLeft, ChevronRight, Link2, Link2Off } from 'lucide-react';
import { Icon } from '@iconify/react';
import { handleScrubHelper } from './Color';

const CornerRadius = ({
  openSubSection, setOpenSubSection,
  radius, setRadius,
  isRadiusLinked, setIsRadiusLinked,
  tagName = 'rect',
  ...props
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (openSubSection === 'corner' && containerRef.current) {
      setTimeout(() => {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 350);
    }
  }, [openSubSection]);
  const pseudoProps = {
    'data-tl': radius?.tl || 0,
    'data-tr': radius?.tr || 0,
    'data-bl': radius?.bl || 0,
    'data-br': radius?.br || 0,
    'data-corner-linked': isRadiusLinked ? 'true' : 'false',
    rx: Math.max(radius?.tl || 0, radius?.tr || 0, radius?.bl || 0, radius?.br || 0),
    ry: Math.max(radius?.tl || 0, radius?.tr || 0, radius?.bl || 0, radius?.br || 0),
    tagName: tagName
  };

  const handleUpdate = (page, layer, attr, value) => {
    if (attr === 'data-tl' && setRadius) setRadius(p => ({ ...p, tl: parseFloat(value) }));
    if (attr === 'data-tr' && setRadius) setRadius(p => ({ ...p, tr: parseFloat(value) }));
    if (attr === 'data-bl' && setRadius) setRadius(p => ({ ...p, bl: parseFloat(value) }));
    if (attr === 'data-br' && setRadius) setRadius(p => ({ ...p, br: parseFloat(value) }));
    if ((attr === 'rx' || attr === 'ry') && setRadius) {
      setRadius(p => ({ ...p, tl: parseFloat(value), tr: parseFloat(value), bl: parseFloat(value), br: parseFloat(value) }));
    }
    if (attr === 'data-corner-linked' && setIsRadiusLinked) {
      setIsRadiusLinked(value === 'true');
      if (value === 'true' && setRadius) {
        // Equalize all corners to the max radius when linking
        setRadius(p => {
          const maxR = Math.max(p.tl || 0, p.tr || 0, p.bl || 0, p.br || 0);
          return { tl: maxR, tr: maxR, bl: maxR, br: maxR };
        });
      }
    }
  };

  const updateAttr = (attribute, value) => {
    handleUpdate(undefined, undefined, attribute, value);
  };



  return (
    <div ref={containerRef} className="flex flex-col font-sans">
      <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
        <div
          onClick={() => setOpenSubSection(openSubSection === 'corner' ? null : 'corner')}
          className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openSubSection === 'corner' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
        >
          <div className="flex items-center gap-[0.5vw]">
            <span className={`font-semibold text-[0.85vw] ${openSubSection === 'corner' ? 'text-gray-900' : 'text-gray-500'}`}>Corner Radius</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            {openSubSection === 'corner' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateAttr('rx', '0');
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors p-[0.1vw] cursor-pointer flex items-center justify-center"
                title="Reset Corner Radius"
              >
                <Icon icon="ix:reset" width="1.1vw" height="1.1vw" style={{ strokeWidth: 2.5 }} />
              </button>
            )}
            <ChevronUp size="1vw" className={`transition-transform duration-200 ${openSubSection === 'corner' ? 'text-gray-900' : 'rotate-180 text-gray-500'}`} />
          </div>
        </div>

        <div className={`grid transition-all duration-300 ease-in-out ${openSubSection === 'corner' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-[1.5vw] relative flex flex-col items-center justify-center min-h-[9vw] bg-white">
              <div className="grid grid-cols-2 gap-x-[2.5vw] gap-y-[1.5vw] relative">
                {[
                  { key: 'data-tl', roundedClass: 'rounded-tl-[1vw] rounded-tr-0 rounded-bl-0 rounded-br-0' },
                  { key: 'data-tr', roundedClass: 'rounded-tr-[1vw] rounded-tl-0 rounded-bl-0 rounded-br-0' },
                  { key: 'data-bl', roundedClass: 'rounded-bl-[1vw] rounded-tl-0 rounded-tr-0 rounded-br-0' },
                  { key: 'data-br', roundedClass: 'rounded-br-[1vw] rounded-tl-0 rounded-tr-0 rounded-bl-0' }
                ].map((corner, idx) => {
                  const val = parseInt(pseudoProps[corner.key] !== undefined ? pseudoProps[corner.key] : (pseudoProps.rx || 0));
                  const updateVal = (newVal) => {
                    const clamped = Math.max(0, newVal);
                    if (pseudoProps['data-corner-linked'] !== 'false') {
                      updateAttr('rx', clamped);
                      updateAttr('ry', clamped);
                      updateAttr('data-tl', clamped);
                      updateAttr('data-tr', clamped);
                      updateAttr('data-bl', clamped);
                      updateAttr('data-br', clamped);
                    } else {
                      updateAttr(corner.key, clamped);
                    }
                  };

                  return (
                    <div key={corner.key} className="flex flex-col items-center">
                      <div
                        onPointerDown={(e) => {
                          if (e.target.tagName === 'INPUT') return;
                          handleScrubHelper(e, val, (newVal) => updateVal(parseInt(newVal)));
                        }}
                        className={`w-[5.2vw] h-[2.8vw] border border-gray-400 ${corner.roundedClass} flex items-center justify-between px-[0.4vw] bg-white relative transition-colors hover:border-gray-600 cursor-ew-resize select-none`}
                      >
                        <button
                          onClick={() => updateVal(val - 1)}
                          className="text-gray-300 hover:text-gray-600 transition-colors pointer-events-auto"
                        >
                          <ChevronLeft size="0.9vw" />
                        </button>

                        <input
                          type="number"
                          min={0}
                          value={val}
                          onChange={(e) => updateVal(parseInt(e.target.value) || 0)}
                          className="w-full text-center text-[1vw] font-semibold text-gray-700 outline-none no-spin bg-transparent cursor-text"
                          onClick={(e) => e.stopPropagation()}
                        />

                        <button
                          onClick={() => updateVal(val + 1)}
                          className="text-gray-300 hover:text-gray-600 transition-colors pointer-events-auto"
                        >
                          <ChevronRight size="0.9vw" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <button
                    onClick={() => updateAttr('data-corner-linked', pseudoProps['data-corner-linked'] === 'false' ? 'true' : 'false')}
                    className="bg-white p-[0.3vw] transition-all hover:scale-110 active:scale-95 rounded-full shadow-sm border border-gray-50 pointer-events-auto"
                  >
                    {pseudoProps['data-corner-linked'] !== 'false' ? (
                      <Link2 size="1.4vw" className="text-black" />
                    ) : (
                      <Link2Off size="1.4vw" className="text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CornerRadius;
