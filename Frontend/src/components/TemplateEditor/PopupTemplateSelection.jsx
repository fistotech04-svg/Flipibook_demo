import React, { useState } from 'react';
import { getPopupTemplateUrl } from '../../utils/templateAssets';

export const TEMPLATES = [
  { id: 'template1', image: getPopupTemplateUrl(1), category: 'Image Based' },
  { id: 'template2', image: getPopupTemplateUrl(2), category: 'Image Based' },
  { id: 'template3', image: getPopupTemplateUrl(3), category: 'Image Based' },
  { id: 'template4', image: getPopupTemplateUrl(4), category: 'Image Based' },
  { id: 'template5', image: getPopupTemplateUrl(5), category: 'Image Based' },
  { id: 'template6', image: getPopupTemplateUrl(6), category: 'Image Based' },
  { id: 'template7', image: getPopupTemplateUrl(7), category: 'Image Based' },
  { id: 'template8', image: getPopupTemplateUrl(8), category: 'Image Based' },
  { id: 'template9', image: getPopupTemplateUrl(9), category: 'Image Based' }
];

const CATEGORIES = [
  "Image Based",
  "Video Focused",
  "Image & Text",
  "Tables",
  "Animated Popups",
  "Image & Text "
];

const PopupTemplateSelection = ({ isOpen, onClose, onSelect, onCustomize, selectedTemplateId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Image Based');
  const [localSelectedId, setLocalSelectedId] = useState(selectedTemplateId || null);

  React.useEffect(() => {
    if (isOpen) {
      setLocalSelectedId(selectedTemplateId || null);
    }
  }, [isOpen, selectedTemplateId]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/30 flex items-center justify-center p-[2vw] backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[0.8vw] w-[70vw] h-[72vh] flex flex-col shadow-2xl relative overflow-hidden pb-[2.5vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between pt-[2.2vh] pb-[1.6vh] px-[2vw] border-b border-gray-100/80">
          <div className="flex flex-col gap-[0.3vh]">
            <h2 className="text-[1.2vw] font-semibold text-[#111827]">Popup Templets</h2>
            <p className="text-[0.75vw] text-[#6B7280]">Select a professional popup design to get start</p>
          </div>

          <div className="flex items-center gap-[0.8vw]">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute left-[1vw] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search.."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[16vw] h-[4vh] pl-[2.6vw] pr-[1.2vw] rounded-full border border-[#E5E7EB] outline-none text-[0.85vw] text-[#4B5563] placeholder-gray-400 focus:border-[#5145F6] transition-colors"
              />
            </div>

            {/* Filter Button */}
            <button className="flex items-center justify-center gap-[0.4vw] h-[4vh] px-[1.2vw] rounded-full border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-gray-100 text-[#4B5563] text-[0.85vw] font-medium transition-colors">
              <svg width="0.95vw" height="0.95vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Filter
            </button>

            {/* Highlighted Red Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-full bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 hover:border-red-500 transition-all cursor-pointer shadow-sm active:scale-95 ml-[0.3vw] flex-shrink-0 group"
              title="Close modal"
            >
              <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Categories Row */}
        <div className="flex items-center gap-[0.8vw] px-[2vw] py-[1.4vh] overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(cat.trim())}
              className={`px-[1vw] py-[0.5vh] rounded-[0.5vw] text-[0.80vw] transition-all active:scale-95 whitespace-nowrap ${activeCategory === cat.trim()
                  ? 'text-black bg-white shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)] border-gray-500/20 border font-semibold'
                  : 'text-gray-400 bg-white shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)] border border-transparent font-medium'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto px-[2vw] pt-[0.5vh] pb-[2vh] popup-template-scrollbar">
          <div className="grid grid-cols-3 gap-[1.2vw] pb-[2vh]">
            {TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  setLocalSelectedId(tpl.id);
                }}
                className={`relative cursor-pointer group transition-all duration-300 ${localSelectedId === tpl.id
                    ? 'bg-white p-[0.4vw] rounded-[0.8vw] shadow-[0_12px_40px_rgba(0,0,0,0.2)] scale-[1.02] border-[2px] border-[#615fff]'
                    : 'bg-transparent p-0 rounded-[0.5vw] border-[2px] border-transparent hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1'
                  }`}
              >
                <div className="relative w-full h-full bg-[#F9FAFB] rounded-[0.4vw] overflow-hidden flex items-center justify-center">
                  <img
                    src={tpl.image}
                    alt={`Template ${tpl.id}`}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                  />
                  {/* Inner Shadow Overlay for Selected State */}
                  {localSelectedId === tpl.id && (
                    <div className="absolute inset-0 shadow-[inset_0_4px_20px_rgba(0,0,0,0.15)] pointer-events-none rounded-[0.4vw]"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons Overlay / Footer */}
        {localSelectedId && (
          <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm border-t border-gray-100 py-[1.2vh] px-[2vw] flex justify-end gap-[0.8vw] z-10 shadow-lg rounded-b-[0.8vw]">
            <div className="absolute inset-x-0 top-[-2vh] h-[2vh] pointer-events-none"></div>
            <button
              className="flex items-center gap-[0.4vw] px-[1.2vw] py-[1vh] rounded-[0.6vw] bg-white border border-[#EF4444] text-[#EF4444] font-semibold text-[0.85vw] hover:bg-red-50 transition-all"
              onClick={() => {
                setLocalSelectedId(null);
                if (onClose) onClose();
              }}
            >
              <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Cancel
            </button>
            <button
              className="flex items-center gap-[0.4vw] px-[1.2vw] py-[1vh] rounded-[0.6vw] bg-white border border-[#111827] text-[#111827] font-semibold text-[0.85vw] hover:bg-gray-50 transition-all"
              onClick={async () => {
                if (localSelectedId !== selectedTemplateId) {
                  if (onSelect) await onSelect(localSelectedId);
                }
                if (onCustomize) onCustomize(localSelectedId);
              }}
            >
              <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              {localSelectedId === selectedTemplateId ? 'Customize the Popup' : 'Apply & Customize'}
            </button>
            <button
              className="flex items-center gap-[0.4vw] px-[1.2vw] py-[1vh] rounded-[0.6vw] bg-[#111827] text-white font-semibold text-[0.85vw] hover:bg-[#1F2937] transition-all"
              onClick={() => {
                if (onSelect) onSelect(localSelectedId);
                if (onClose) onClose();
              }}
            >
              <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Apply Popup
            </button>
          </div>
        )}

        {/* Animations Styles */}
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.25s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
};

export default PopupTemplateSelection;