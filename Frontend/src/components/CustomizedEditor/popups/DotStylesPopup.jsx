import React from 'react';
import { X } from 'lucide-react';
import { Icon } from '@iconify/react';

export const dotStyles = [
  { id: 1, name: 'Classic Circle', type: 'circle' },
  { id: 2, name: 'Active Pill', type: 'pill' },
  { id: 3, name: 'Square', type: 'square' },
  { id: 4, name: 'Outline Circle', type: 'outline-circle' },
  { id: 5, name: 'Line / Dash', type: 'dash' },
  { id: 6, name: 'Diamond', type: 'diamond' },
  { id: 7, name: 'Ring Target', type: 'ring' },
  { id: 8, name: 'Rounded Bar', type: 'bar' },
  { id: 9, name: 'Minimal Dots', type: 'minimal' },
  { id: 10, name: 'Star Dots', type: 'star' },
  { id: 11, name: 'Heart Dots', type: 'heart' },
  { id: 12, name: 'Numbered Dots', type: 'number' },
];

export const DotRenderer = ({ styleId = 1, size = "0.5vw", color = "currentColor", activeIndex = 0, count = 3, onDotClick }) => {
  const style = dotStyles.find(s => s.id === styleId) || dotStyles[0];
  const isGrad = color && typeof color === 'string' && color.toUpperCase().includes('GRADIENT');

  return (
    <div className="flex items-center justify-center gap-[0.35vw]">
      {Array.from({ length: count }).map((_, idx) => {
        const isActive = idx === activeIndex;
        const opacity = isActive ? 1 : 0.4;
        const bgStyle = isGrad ? { background: color } : { backgroundColor: color };

        const renderItem = () => {
          switch (style.type) {
            case 'pill':
              return (
                <div
                  className="editor-ss-dot transition-all duration-200"
                  data-active-scale="scale(1)"
                  data-inactive-scale="scale(1)"
                  style={{
                    width: isActive ? `calc(${size} * 2.4)` : size,
                    height: size,
                    borderRadius: '9999px',
                    ...bgStyle,
                    opacity,
                  }}
                />
              );

            case 'square':
              return (
                <div
                  className="editor-ss-dot transition-all duration-200"
                  data-active-scale="scale(1.25)"
                  data-inactive-scale="scale(1)"
                  style={{
                    width: size,
                    height: size,
                    borderRadius: '0.1vw',
                    ...bgStyle,
                    opacity,
                    transform: isActive ? 'scale(1.25)' : 'scale(1)',
                  }}
                />
              );

            case 'outline-circle':
              return (
                <div
                  className="editor-ss-dot transition-all duration-200"
                  data-active-scale="scale(1.25)"
                  data-inactive-scale="scale(1)"
                  style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    border: isGrad ? 'none' : `1.5px solid ${color}`,
                    ...(isActive ? bgStyle : (isGrad ? { background: color, opacity: 0.4 } : { backgroundColor: 'transparent' })),
                    opacity: isActive ? 1 : 0.6,
                    transform: isActive ? 'scale(1.25)' : 'scale(1)',
                  }}
                />
              );

            case 'dash':
              return (
                <div
                  className="editor-ss-dot transition-all duration-200"
                  data-active-scale="scale(1)"
                  data-inactive-scale="scale(1)"
                  style={{
                    width: isActive ? `calc(${size} * 2.2)` : `calc(${size} * 1.4)`,
                    height: `calc(${size} * 0.45)`,
                    borderRadius: '0.1vw',
                    ...bgStyle,
                    opacity,
                  }}
                />
              );

            case 'diamond':
              return (
                <div
                  className="editor-ss-dot transition-all duration-200"
                  data-active-scale="rotate(45deg) scale(1.25)"
                  data-inactive-scale="rotate(45deg) scale(1)"
                  style={{
                    width: size,
                    height: size,
                    ...bgStyle,
                    opacity,
                    transform: `rotate(45deg) ${isActive ? 'scale(1.25)' : 'scale(1)'}`,
                    borderRadius: '0.05vw',
                  }}
                />
              );

            case 'ring':
              return (
                <div
                  className="editor-ss-dot transition-all duration-200 flex items-center justify-center"
                  data-active-scale="scale(1.3)"
                  data-inactive-scale="scale(1)"
                  style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    border: isGrad ? 'none' : `1.5px solid ${color}`,
                    ...(isGrad && !isActive ? { background: color, opacity: 0.4 } : {}),
                    opacity,
                    transform: isActive ? 'scale(1.3)' : 'scale(1)',
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        width: `calc(${size} * 0.45)`,
                        height: `calc(${size} * 0.45)`,
                        borderRadius: '50%',
                        ...bgStyle,
                      }}
                    />
                  )}
                </div>
              );

            case 'bar':
              return (
                <div
                  className="editor-ss-dot transition-all duration-200"
                  data-active-scale="scale(1.15)"
                  data-inactive-scale="scale(1)"
                  style={{
                    width: `calc(${size} * 1.8)`,
                    height: `calc(${size} * 0.6)`,
                    borderRadius: '0.2vw',
                    ...bgStyle,
                    opacity: isActive ? 1 : 0.35,
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              );

            case 'minimal':
              return (
                <div
                  className="editor-ss-dot transition-all duration-200"
                  data-active-scale="scale(1.4)"
                  data-inactive-scale="scale(1)"
                  style={{
                    width: `calc(${size} * 0.7)`,
                    height: `calc(${size} * 0.7)`,
                    borderRadius: '50%',
                    ...bgStyle,
                    opacity: isActive ? 1 : 0.3,
                    transform: isActive ? 'scale(1.4)' : 'scale(1)',
                  }}
                />
              );

            case 'star':
              return (
                <div
                  className="editor-ss-dot transition-all duration-200"
                  data-active-scale="scale(1.25)"
                  data-inactive-scale="scale(1)"
                  style={{
                    opacity,
                    transform: isActive ? 'scale(1.25)' : 'scale(1)',
                  }}
                >
                  <Icon
                    icon={isActive ? "ph:star-fill" : "ph:star-bold"}
                    width={size}
                    height={size}
                    style={{
                      color: isGrad ? 'transparent' : color,
                      ...(isGrad ? { background: color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {})
                    }}
                  />
                </div>
              );

            case 'heart':
              return (
                <div
                  className="editor-ss-dot transition-all duration-200"
                  data-active-scale="scale(1.25)"
                  data-inactive-scale="scale(1)"
                  style={{
                    opacity,
                    transform: isActive ? 'scale(1.25)' : 'scale(1)',
                  }}
                >
                  <Icon
                    icon={isActive ? "ph:heart-fill" : "ph:heart-bold"}
                    width={size}
                    height={size}
                    style={{
                      color: isGrad ? 'transparent' : color,
                      ...(isGrad ? { background: color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {})
                    }}
                  />
                </div>
              );

            case 'number':
              return (
                <div
                  className="editor-ss-dot transition-all duration-200 flex items-center justify-center font-bold"
                  data-active-scale="scale(1)"
                  data-inactive-scale="scale(1)"
                  style={{
                    width: `calc(${size} * 1.5)`,
                    height: `calc(${size} * 1.5)`,
                    fontSize: typeof size === 'number' ? `${size * 0.75}px` : `calc(${size} * 0.75)`,
                    borderRadius: '50%',
                    ...(isActive ? bgStyle : {}),
                    color: isActive ? '#ffffff' : (isGrad ? '#000000' : color),
                    border: isGrad ? 'none' : `1px solid ${color}`,
                    opacity: isActive ? 1 : 0.5,
                  }}
                >
                  {idx + 1}
                </div>
              );

            case 'circle':
            default:
              return (
                <div
                  className="editor-ss-dot transition-all duration-200"
                  data-active-scale="scale(1.35)"
                  data-inactive-scale="scale(1)"
                  style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    ...bgStyle,
                    opacity,
                    transform: isActive ? 'scale(1.35)' : 'scale(1)',
                  }}
                />
              );
          }
        };

        return (
          <div
            key={idx}
            className={onDotClick ? "cursor-pointer" : ""}
            onClick={(e) => onDotClick && onDotClick(e, idx)}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {renderItem()}
          </div>
        );
      })}
    </div>
  );
};

const DotStylesPopup = ({ currentStyle = 1, onClose, onSelect, positionStyle }) => {
  const [selected, setSelected] = React.useState(currentStyle);

  return (
    <div
      className="fixed z-[1000] bg-white border border-gray-100 rounded-[0.5vw] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 px-[1vw] pt-[1vw] pb-[0.6vw] shadow-2xl"
      style={{ width: '20vw', ...(positionStyle || { top: '70%', right: '-10vw', transform: 'translateY(-50%)' }) }}
    >
      <div className="w-full flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-[0.5vw] mb-[1.2vw]">
          <h3 className="text-[0.9vw] font-bold text-gray-800 whitespace-nowrap">Pagination Style Gallery</h3>
          <div className="flex-grow h-[0.1px] bg-[#E2E8F0]"></div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 gap-[0.5vw] mb-[0.5vw] max-h-[50vh] pr-[0.4vw]">
          {dotStyles.map((style) => (
            <div
              key={style.id}
              onClick={() => setSelected(style.id)}
              className={`cursor-pointer transition-all duration-300 p-[0.6vw] aspect-square rounded-[0.5vw] flex items-center justify-center border-[1px] ${selected === style.id
                  ? 'shadow-[0_8px_20px_rgba(0,0,0,0.12)] border-[2px] border-gray-300 scale-[1.05]'
                  : 'hover:bg-gray-50 border-gray-100 bg-white'
                }`}
            >
              <div className="flex items-center justify-center text-gray-800">
                <DotRenderer styleId={style.id} size="0.45vw" color="#000000" activeIndex={0} count={3} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-end justify-end gap-[0.8vw] pt-[0.5vw] border-t border-[#F1F5F9]">
          <button
            onClick={onClose}
            className="flex items-end gap-[0.4vw] px-[1vw] py-[0.4vw] rounded-[0.4vw] border-[1px] border-gray-300 bg-white text-gray-700 font-semibold text-[0.8vw] hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
          >
            <X size="1vw" className="mb-[0.1vw]" /> Cancel
          </button>
          <button
            onClick={() => {
              onSelect(selected);
              onClose();
            }}
            className="flex items-end gap-[0.4vw] px-[1.2vw] py-[0.4vw] bg-black text-white rounded-[0.4vw] text-[0.8vw] font-semibold hover:bg-zinc-500 transition-all active:scale-95 shadow-lg"
          >
            <Icon icon="qlementine-icons:replace-16" className="w-[1vw] h-[1vw] mb-[0.1vw]" />
            Replace
          </button>
        </div>
      </div>
    </div>
  );
};

export default DotStylesPopup;
