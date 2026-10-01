import React from 'react';
import { X } from 'lucide-react';
import { Icon } from '@iconify/react';

const navIconStyles = [
  { id: 1, left: 'lucide:chevron-left', right: 'lucide:chevron-right' },
  { id: 2, left: 'material-symbols:arrow-circle-left-rounded', right: 'material-symbols:arrow-circle-right-rounded' },
  { id: 3, left: 'material-symbols:arrow-left-rounded', right: 'material-symbols:arrow-right-rounded' },
  { id: 4, left: 'material-symbols:chevron-left-rounded', right: 'material-symbols:chevron-right-rounded' },
  { id: 5, left: 'ph:caret-left-bold', right: 'ph:caret-right-bold' },
  { id: 6, left: 'material-symbols:arrow-circle-left-outline-rounded', right: 'material-symbols:arrow-circle-right-outline-rounded' },
  { id: 7, left: 'fluent:arrow-left-20-regular', right: 'fluent:arrow-right-20-regular' },
  { id: 8, left: 'solar:round-arrow-left-bold', right: 'solar:round-arrow-right-bold' },
  { id: 9, left: 'ic:baseline-arrow-left', right: 'ic:baseline-arrow-right' },
  { id: 10, left: 'mdi:chevron-left-box', right: 'mdi:chevron-right-box' },
  { id: 11, left: 'mdi:arrow-left-box', right: 'mdi:arrow-right-box' },
  { id: 12, left: 'lucide:arrow-left', right: 'lucide:arrow-right' },
];

const NavIconStylesPopup = ({ currentStyle = 1, onClose, onSelect, positionStyle }) => {
  const [selected, setSelected] = React.useState(currentStyle);

  // Corrected icons for style 2 to be simple circle arrows
  const getDisplayIcons = (style) => {
    // Basic mapping to ensure we use circle versions for display if needed
    if (style.id === 2) return { left: 'ion:arrow-back-circle', right: 'ion:arrow-forward-circle' };
    return style;
  };

  return (
    <div
      className="fixed z-[1000] bg-white border border-gray-100 rounded-[0.5vw] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 px-[1vw] pt-[1vw] pb-[0.6vw] shadow-2xl"
      style={{ width: '20vw', ...(positionStyle || { top: '70%', right: '-10vw', transform: 'translateY(-50%)' }) }}
    >
      <div className="w-full flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-[0.5vw] mb-[1.2vw]">
          <h3 className="text-[0.9vw] font-bold text-gray-800 whitespace-nowrap">Navigation Icon Gallery</h3>
          <div className="flex-grow h-[0.1px] bg-[#E2E8F0]"></div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 gap-[0.5vw] mb-[0.5vw] max-h-[50vh] pr-[0.4vw]">
          {navIconStyles.map((style) => (
            <div
              key={style.id}
              onClick={() => setSelected(style.id)}
              className={`cursor-pointer transition-all duration-300 p-[0.6vw] aspect-square rounded-[0.5vw] flex items-center justify-center border-[1px] border-gray-200 ${selected === style.id
                  ? 'shadow-[0_8px_20px_rgba(0,0,0,0.12)] border-[2px] border-gray-300 scale-[1.05]'
                  : 'hover:bg-gray-50 border-gray-100 bg-white'
                }`}
            >
              <div className="flex items-center gap-[0.4vw] text-gray-800">
                <Icon icon={getDisplayIcons(style).left || style.left} width="1.2vw" height="1.2vw" />
                <Icon icon={getDisplayIcons(style).right || style.right} width="1.2vw" height="1.2vw" />
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

export const NavIconRenderer = ({ styleId, size = "1vw", color = "currentColor" }) => {
  const style = navIconStyles.find(s => s.id === styleId) || navIconStyles[0];
  return {
    left: <Icon icon={style.left} width={size} height={size} style={{ color }} />,
    right: <Icon icon={style.right} width={size} height={size} style={{ color }} />
  };
};

export default NavIconStylesPopup;
