import React, { useState, useEffect } from 'react';
import {
  X, ChevronDown, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Palette, Type
} from 'lucide-react';
import { Icon } from '@iconify/react';

const FONT_FAMILIES = [
  'Arial', 'Inter', 'Poppins', 'Roboto', 'Montserrat', 'Open Sans',
  'Lato', 'Playfair Display', 'Merriweather', 'Oswald', 'Lora',
  'Georgia', 'Times New Roman', 'Bangers', 'Satisfy'
];

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#EC5137', '#4D47FF', '#10B981', '#F59E0B',
  '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'
];

/**
 * SlideTextPopup
 * Dedicated pop-up for editing slide typography styling directly on canvas.
 * Styled in the exact layout, header, footer, and theme of Navigation Icon Gallery popup.
 */
const SlideTextPopup = ({
  isOpen = true,
  onClose,
  initialFontFamily = 'Arial',
  initialFontSize = 14,
  initialTextColor = '#ffffff',
  initialFontWeight = 'bold',
  initialFontStyle = 'normal',
  initialTextAlign = 'center',
  initialTextDecoration = 'none',
  initialTextShadow = 'medium',
  onChange,
  onCancel,
  onSave,
  positionStyle
}) => {
  const [fontFamily, setFontFamily] = useState(initialFontFamily || 'Arial');
  const [fontSize, setFontSize] = useState(initialFontSize || 14);
  const [textColor, setTextColor] = useState(initialTextColor || '#ffffff');
  const [isBold, setIsBold] = useState(
    initialFontWeight === 'bold' || initialFontWeight === '700' || initialFontWeight === '800'
  );
  const [isItalic, setIsItalic] = useState(initialFontStyle === 'italic');
  const [isUnderline, setIsUnderline] = useState(initialTextDecoration === 'underline');
  const [textAlign, setTextAlign] = useState(initialTextAlign || 'center');
  const [textShadow, setTextShadow] = useState(initialTextShadow || 'medium');
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);

  useEffect(() => {
    setFontFamily(initialFontFamily || 'Arial');
    setFontSize(initialFontSize || 14);
    setTextColor(initialTextColor || '#ffffff');
    setIsBold(initialFontWeight === 'bold' || initialFontWeight === '700' || initialFontWeight === '800');
    setIsItalic(initialFontStyle === 'italic');
    setIsUnderline(initialTextDecoration === 'underline');
    setTextAlign(initialTextAlign || 'center');
    setTextShadow(initialTextShadow || 'medium');
  }, [
    initialFontFamily,
    initialFontSize,
    initialTextColor,
    initialFontWeight,
    initialFontStyle,
    initialTextAlign,
    initialTextDecoration,
    initialTextShadow
  ]);

  if (!isOpen) return null;

  const notifyChange = (override = {}) => {
    onChange?.({
      fontFamily: override.fontFamily !== undefined ? override.fontFamily : fontFamily,
      fontSize: override.fontSize !== undefined ? override.fontSize : (Number(fontSize) || 14),
      textColor: override.textColor !== undefined ? override.textColor : textColor,
      fontWeight: override.fontWeight !== undefined ? override.fontWeight : (isBold ? 'bold' : 'normal'),
      fontStyle: override.fontStyle !== undefined ? override.fontStyle : (isItalic ? 'italic' : 'normal'),
      textDecoration: override.textDecoration !== undefined ? override.textDecoration : (isUnderline ? 'underline' : 'none'),
      textAlign: override.textAlign !== undefined ? override.textAlign : textAlign,
      textShadow: override.textShadow !== undefined ? override.textShadow : textShadow
    });
  };

  const handleFontSelect = (font) => {
    setFontFamily(font);
    setIsFontDropdownOpen(false);
    notifyChange({ fontFamily: font });
  };

  const handleSizeChange = (val) => {
    const num = Number(val) || 14;
    setFontSize(num);
    notifyChange({ fontSize: num });
  };

  const handleBoldToggle = () => {
    const next = !isBold;
    setIsBold(next);
    notifyChange({ fontWeight: next ? 'bold' : 'normal' });
  };

  const handleItalicToggle = () => {
    const next = !isItalic;
    setIsItalic(next);
    notifyChange({ fontStyle: next ? 'italic' : 'normal' });
  };

  const handleUnderlineToggle = () => {
    const next = !isUnderline;
    setIsUnderline(next);
    notifyChange({ textDecoration: next ? 'underline' : 'none' });
  };

  const handleAlignSelect = (align) => {
    setTextAlign(align);
    notifyChange({ textAlign: align });
  };

  const handleColorChange = (color) => {
    setTextColor(color);
    notifyChange({ textColor: color });
  };

  const handleShadowSelect = (val) => {
    setTextShadow(val);
    notifyChange({ textShadow: val });
  };

  const handleApply = () => {
    onSave?.({
      fontFamily,
      fontSize: Number(fontSize) || 14,
      textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      textDecoration: isUnderline ? 'underline' : 'none',
      textAlign,
      textShadow
    });
    onClose?.();
  };

  const handleCancelClick = () => {
    onCancel?.();
    onClose?.();
  };

  return (
    <>
      <style>{`
        .custom-slide-text-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-slide-text-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-slide-text-scroll::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 9999px;
        }
        .custom-slide-text-scroll::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>

      {/* Invisible backdrop for click-outside dismissal (preserves bright canvas view) */}
      <div
        className="fixed inset-0 z-[999]"
        onClick={handleApply}
      />

      {/* Popup Container (Exact styling as Navigation Icon Gallery) */}
      <div
        className="fixed z-[1000] bg-white border border-gray-100 rounded-[0.5vw] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 px-[1vw] pt-[1vw] pb-[0.6vw] shadow-2xl select-none"
        style={{
          width: '21vw',
          minWidth: '310px',
          maxHeight: '85vh',
          ...(positionStyle || {
            top: '70%',
            right: '15vw',
            transform: 'translateY(-50%)'
          })
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex flex-col h-full min-h-0">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-[0.5vw] mb-[0.8vw] pb-[0.4vw] border-b border-gray-100">
            <div className="flex items-center gap-[0.4vw]">
              <Type size="0.9vw" className="text-gray-700" />
              <h3 className="text-[0.85vw] font-bold text-gray-800">Slide Typography</h3>
            </div>
            <button
              type="button"
              onClick={handleCancelClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-[0.1vw] cursor-pointer"
              title="Close"
            >
              <X size="0.9vw" />
            </button>
          </div>

          <div className="flex flex-col gap-[0.7vw]">
            {/* 1. Font Family Selector */}
            <div className="space-y-[0.25vw]">
              <span className="text-[0.72vw] font-semibold text-gray-700">Font Family</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                  className="w-full flex items-center justify-between px-[0.65vw] py-[0.4vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-2xs hover:border-gray-300 transition-colors text-[0.76vw] text-gray-800 cursor-pointer"
                >
                  <span style={{ fontFamily: `'${fontFamily}', sans-serif` }}>{fontFamily}</span>
                  <ChevronDown size="0.85vw" className={`text-gray-400 transition-transform ${isFontDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isFontDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsFontDropdownOpen(false)} />
                    <div className="absolute left-0 top-full mt-[0.2vw] w-full max-h-[9vw] overflow-y-auto bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-40 py-[0.2vw] custom-slide-text-scroll">
                      {FONT_FAMILIES.map((font) => (
                        <button
                          key={font}
                          type="button"
                          onClick={() => handleFontSelect(font)}
                          style={{ fontFamily: `'${font}', sans-serif` }}
                          className={`w-full text-left px-[0.7vw] py-[0.35vw] text-[0.75vw] transition-colors cursor-pointer ${
                            fontFamily === font ? 'bg-gray-100 text-gray-950 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {font}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2. Font Size Slider */}
            <div className="space-y-[0.25vw]">
              <div className="flex items-center justify-between">
                <span className="text-[0.72vw] font-semibold text-gray-700">Font Size</span>
                <span className="text-[0.7vw] font-semibold text-gray-600 bg-gray-100 px-[0.4vw] py-[0.1vw] rounded-[0.25vw]">
                  {fontSize}px
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={fontSize}
                onChange={(e) => handleSizeChange(e.target.value)}
                className="w-full h-[0.3vw] rounded-full appearance-none cursor-pointer accent-black"
                style={{
                  background: `linear-gradient(to right, #000000 0%, #000000 ${((fontSize - 10) / 40) * 100}%, #e5e7eb ${((fontSize - 10) / 40) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>

            {/* 3. Text Styling & Alignment */}
            <div className="grid grid-cols-2 gap-[0.5vw]">
              {/* Format: Bold, Italic, Underline */}
              <div className="space-y-[0.2vw]">
                <span className="text-[0.68vw] font-semibold text-gray-600">Style</span>
                <div className="flex items-center gap-[0.2vw] bg-gray-50 p-[0.2vw] rounded-[0.35vw] border border-gray-200">
                  <button
                    type="button"
                    onClick={handleBoldToggle}
                    className={`flex-1 py-[0.3vw] flex items-center justify-center rounded-[0.25vw] transition-colors cursor-pointer ${
                      isBold ? 'bg-white shadow-xs text-gray-950 font-bold' : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title="Bold"
                  >
                    <Bold size="0.8vw" />
                  </button>
                  <button
                    type="button"
                    onClick={handleItalicToggle}
                    className={`flex-1 py-[0.3vw] flex items-center justify-center rounded-[0.25vw] transition-colors cursor-pointer ${
                      isItalic ? 'bg-white shadow-xs text-gray-950 font-bold' : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title="Italic"
                  >
                    <Italic size="0.8vw" />
                  </button>
                  <button
                    type="button"
                    onClick={handleUnderlineToggle}
                    className={`flex-1 py-[0.3vw] flex items-center justify-center rounded-[0.25vw] transition-colors cursor-pointer ${
                      isUnderline ? 'bg-white shadow-xs text-gray-950 font-bold' : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title="Underline"
                  >
                    <Underline size="0.8vw" />
                  </button>
                </div>
              </div>

              {/* Alignment: Left, Center, Right */}
              <div className="space-y-[0.2vw]">
                <span className="text-[0.68vw] font-semibold text-gray-600">Alignment</span>
                <div className="flex items-center gap-[0.2vw] bg-gray-50 p-[0.2vw] rounded-[0.35vw] border border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleAlignSelect('left')}
                    className={`flex-1 py-[0.3vw] flex items-center justify-center rounded-[0.25vw] transition-colors cursor-pointer ${
                      textAlign === 'left' ? 'bg-white shadow-xs text-gray-950 font-bold' : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title="Align Left"
                  >
                    <AlignLeft size="0.8vw" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAlignSelect('center')}
                    className={`flex-1 py-[0.3vw] flex items-center justify-center rounded-[0.25vw] transition-colors cursor-pointer ${
                      textAlign === 'center' ? 'bg-white shadow-xs text-gray-950 font-bold' : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title="Align Center"
                  >
                    <AlignCenter size="0.8vw" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAlignSelect('right')}
                    className={`flex-1 py-[0.3vw] flex items-center justify-center rounded-[0.25vw] transition-colors cursor-pointer ${
                      textAlign === 'right' ? 'bg-white shadow-xs text-gray-950 font-bold' : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title="Align Right"
                  >
                    <AlignRight size="0.8vw" />
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Text Shadow: None, Lite, Medium, Dark */}
            <div className="space-y-[0.25vw]">
              <div className="flex items-center justify-between">
                <span className="text-[0.72vw] font-semibold text-gray-700">Text Shadow</span>
                <span className="text-[0.68vw] text-gray-500 font-medium capitalize">{textShadow}</span>
              </div>
              <div className="grid grid-cols-4 gap-[0.3vw] bg-gray-50 p-[0.2vw] rounded-[0.35vw] border border-gray-200">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'lite', label: 'Lite' },
                  { id: 'medium', label: 'Medium' },
                  { id: 'dark', label: 'Dark' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleShadowSelect(opt.id)}
                    className={`py-[0.3vw] text-[0.72vw] font-semibold rounded-[0.25vw] transition-all cursor-pointer text-center ${
                      textShadow === opt.id
                        ? 'bg-white shadow-xs text-gray-950 border border-gray-200/80 font-bold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Text Color Selector */}
            <div className="space-y-[0.25vw]">
              <div className="flex items-center justify-between">
                <span className="text-[0.72vw] font-semibold text-gray-700">Text Color</span>
                <div className="flex items-center gap-[0.3vw]">
                  <div
                    className="w-[1vw] h-[1vw] rounded-[0.2vw] border border-gray-300 shadow-2xs"
                    style={{ backgroundColor: textColor }}
                  />
                  <span className="text-[0.68vw] text-gray-500 font-mono uppercase">{textColor}</span>
                </div>
              </div>

              {/* Presets + Custom Color Picker */}
              <div className="flex items-center gap-[0.35vw] flex-wrap pt-[0.1vw]">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleColorChange(c)}
                    className={`w-[1.2vw] h-[1.2vw] rounded-full border transition-all cursor-pointer ${
                      textColor.toLowerCase() === c.toLowerCase()
                        ? 'border-gray-900 scale-110 shadow-sm ring-2 ring-gray-400'
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
                <label
                  className="w-[1.2vw] h-[1.2vw] rounded-full border border-dashed border-gray-300 hover:border-gray-500 flex items-center justify-center cursor-pointer transition-colors relative"
                  title="Custom Color"
                >
                  <Palette size="0.7vw" className="text-gray-500" />
                  <input
                    type="color"
                    value={textColor.startsWith('#') && textColor.length === 7 ? textColor : '#ffffff'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer (Cancel & Replace buttons exact like Navigation Icon Gallery) */}
          <div className="flex items-end justify-end gap-[0.8vw] pt-[0.5vw] mt-[0.6vw] border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={handleCancelClick}
              className="flex items-end gap-[0.4vw] px-[1vw] py-[0.4vw] rounded-[0.4vw] border-[1px] border-gray-300 bg-white text-gray-700 font-semibold text-[0.8vw] hover:bg-gray-50 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <X size="1vw" className="mb-[0.1vw]" /> Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-end gap-[0.4vw] px-[1.2vw] py-[0.4vw] bg-black text-white rounded-[0.4vw] text-[0.8vw] font-semibold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg cursor-pointer"
            >
              <Icon icon="qlementine-icons:replace-16" className="w-[1vw] h-[1vw] mb-[0.1vw]" />
              Replace
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SlideTextPopup;
