import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Icon } from '@iconify/react';
import ColorPicker from './ThreedEditor/ColorPicker';

const TypographyPanel = ({ 
    isT1, 
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    fontWeight, setFontWeight,
    letterSpacing, setLetterSpacing,
    lineHeight, setLineHeight,
    align, setAlign,
    italic, setItalic,
    underline, setUnderline,
    linethrough, setLinethrough,
    color, setColor,
    opacity, setOpacity,
    onClose 
}) => {
    const [showFontFamilyDropdown, setShowFontFamilyDropdown] = useState(false);
    const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
    const [showFontWeightDropdown, setShowFontWeightDropdown] = useState(false);
    const [showLetterSpacingSlider, setShowLetterSpacingSlider] = useState(false);
    const [showLineHeightSlider, setShowLineHeightSlider] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const fontFamilies = ['Poppins', 'Inter', 'Roboto', 'Outfit', 'Montserrat', 'Playfair Display'];
    const fontSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64];
    const fontWeights = ['Regular', 'Medium', 'Semi Bold', 'Bold', 'Black'];

    return createPortal(
        <>
            <div className="fixed inset-0 z-[999990]" onClick={onClose} />
            <div className="fixed top-1/2 -translate-y-1/2 left-[calc(50%+16.5vw)] z-[999999] w-[21vw] bg-white border border-gray-200 rounded-[1.2vw] shadow-2xl p-[1.2vw] animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-[1vw] text-left">
                <style dangerouslySetInnerHTML={{ __html: `
                    .typography-color-picker > div:first-child > div:first-child > *:first-child {
                        display: none !important;
                    }
                    .typography-color-picker > div:first-child > div:first-child::before {
                        content: "Text Color";
                        font-size: 0.85vw;
                        font-weight: 600;
                        color: #111827;
                        font-family: inherit;
                    }
                ` }} />
                {/* Typography Header */}
                <div className="flex items-center justify-between gap-[0.5vw]">
                    <span className="font-bold text-[0.85vw] text-gray-900 shrink-0">Typography</span>
                    <div className="flex-1 h-[1px] bg-gray-200" />
                    <button 
                        onClick={() => {
                            onClose();
                            setShowFontFamilyDropdown(false);
                            setShowFontSizeDropdown(false);
                            setShowFontWeightDropdown(false);
                            setShowLetterSpacingSlider(false);
                            setShowLineHeightSlider(false);
                        }}
                        className="p-[0.2vw] rounded-full hover:bg-gray-100 transition-colors text-red-500 cursor-pointer"
                    >
                        <X size="0.9vw" />
                    </button>
                </div>

                {/* Row 1: Font Family & Size */}
                <div className="flex items-center gap-[0.6vw] relative">
                    <div className="relative flex-1">
                        <button 
                            onClick={() => {
                                setShowFontFamilyDropdown(!showFontFamilyDropdown);
                                setShowFontSizeDropdown(false);
                                setShowFontWeightDropdown(false);
                                setShowLetterSpacingSlider(false);
                                setShowLineHeightSlider(false);
                            }}
                            className="w-full h-[2.2vw] flex items-center justify-between px-[0.8vw] bg-white border border-gray-300 rounded-[0.6vw] text-[0.75vw] font-medium text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                        >
                            <span className="truncate" style={{ fontFamily: fontFamily }}>{fontFamily}</span>
                            <Icon icon="lucide:chevron-down" className="text-gray-400 shrink-0 w-[0.8vw] h-[0.8vw]" />
                        </button>
                        {showFontFamilyDropdown && (
                            <div className="absolute left-0 right-0 top-[2.4vw] z-[280] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl max-h-[10vw] overflow-y-auto custom-scrollbar">
                                {fontFamilies.map((font) => (
                                    <button
                                        key={font}
                                        type="button"
                                        onClick={() => {
                                            setFontFamily(font);
                                            setShowFontFamilyDropdown(false);
                                        }}
                                        className="w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                        style={{ fontFamily: font }}
                                    >
                                        {font}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative w-[5.5vw]">
                        <button 
                            onClick={() => {
                                setShowFontSizeDropdown(!showFontSizeDropdown);
                                setShowFontFamilyDropdown(false);
                                setShowFontWeightDropdown(false);
                                setShowLetterSpacingSlider(false);
                                setShowLineHeightSlider(false);
                            }}
                            className="w-full h-[2.2vw] flex items-center justify-between px-[0.8vw] bg-white border border-gray-300 rounded-[0.6vw] text-[0.75vw] font-medium text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                        >
                            <span>{fontSize}</span>
                            <Icon icon="lucide:chevron-down" className="text-gray-400 shrink-0 w-[0.8vw] h-[0.8vw]" />
                        </button>
                        {showFontSizeDropdown && (
                            <div className="absolute left-0 right-0 top-[2.4vw] z-[280] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl max-h-[10vw] overflow-y-auto custom-scrollbar">
                                {fontSizes.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => {
                                            setFontSize(size);
                                            setShowFontSizeDropdown(false);
                                        }}
                                        className="w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 2: Weight, Character Spacing, Line Height */}
                <div className="flex items-center gap-[0.6vw] relative">
                    <div className="relative flex-1">
                        <button 
                            onClick={() => {
                                setShowFontWeightDropdown(!showFontWeightDropdown);
                                setShowFontFamilyDropdown(false);
                                setShowFontSizeDropdown(false);
                                setShowLetterSpacingSlider(false);
                                setShowLineHeightSlider(false);
                            }}
                            className="w-full h-[2.2vw] flex items-center justify-between px-[0.8vw] bg-white border border-gray-300 rounded-[0.6vw] text-[0.75vw] font-medium text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                        >
                            <span>{fontWeight}</span>
                            <Icon icon="lucide:chevron-down" className="text-gray-400 shrink-0 w-[0.8vw] h-[0.8vw]" />
                        </button>
                        {showFontWeightDropdown && (
                            <div className="absolute left-0 right-0 top-[2.4vw] z-[280] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl max-h-[10vw] overflow-y-auto custom-scrollbar">
                                {fontWeights.map((w) => (
                                    <button
                                        key={w}
                                        type="button"
                                        onClick={() => {
                                            setFontWeight(w);
                                            setShowFontWeightDropdown(false);
                                        }}
                                        className="w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        {w}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative w-[5.5vw]">
                        <div className="relative w-full h-[2.2vw] border border-gray-300 rounded-[0.6vw] bg-white flex items-center px-[0.6vw] hover:border-gray-400 transition-all group">
                            <input 
                                type="text" 
                                value={letterSpacing === 'Auto' ? (isT1 ? 0 : 2) : letterSpacing}
                                onChange={(e) => setLetterSpacing(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                onBlur={() => {
                                    if (letterSpacing === 'Auto' || letterSpacing === '') {
                                        setLetterSpacing('Auto');
                                    } else {
                                        const parsed = parseInt(letterSpacing);
                                        setLetterSpacing(isNaN(parsed) ? 'Auto' : parsed);
                                    }
                                }}
                                className="w-full text-center text-[0.7vw] font-semibold text-gray-700 outline-none bg-transparent"
                            />
                            <div
                                onMouseDown={(e) => {
                                    if (e.button !== 0) return;
                                    document.body.style.cursor = 'ew-resize';
                                    document.body.style.userSelect = 'none';
                                    const startX = e.clientX;
                                    const startVal = letterSpacing === 'Auto' ? (isT1 ? 0 : 2) : parseFloat(letterSpacing);
                                    const handleMouseMove = (moveEvent) => {
                                        const deltaX = moveEvent.clientX - startX;
                                        const change = Math.round(deltaX / 8);
                                        const newVal = Math.min(40, Math.max(isT1 ? -5 : 0, startVal + change));
                                        setLetterSpacing(newVal);
                                    };
                                    const handleMouseUp = () => {
                                        window.removeEventListener('mousemove', handleMouseMove);
                                        window.removeEventListener('mouseup', handleMouseUp);
                                        document.body.style.cursor = '';
                                        document.body.style.userSelect = '';
                                    };
                                    window.addEventListener('mousemove', handleMouseMove);
                                    window.addEventListener('mouseup', handleMouseUp);
                                }}
                                className="cursor-ew-resize p-[0.1vw] hover:bg-gray-100 rounded-[0.2vw] flex items-center justify-center shrink-0"
                                title="Drag to adjust character spacing"
                            >
                                <Icon icon="solar:paragraph-spacing-linear" width="1.2vw" height="1.2vw" rotate={1} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="relative w-[5.5vw]">
                        <div className="relative w-full h-[2.2vw] border border-gray-300 rounded-[0.6vw] bg-white flex items-center px-[0.6vw] hover:border-gray-400 transition-all group">
                            <input 
                                type="text" 
                                value={lineHeight === 'Auto' ? (isT1 ? 1.1 : 1.2) : lineHeight}
                                onChange={(e) => setLineHeight(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                onBlur={() => {
                                    if (lineHeight === 'Auto' || lineHeight === '') {
                                        setLineHeight('Auto');
                                    } else {
                                        const parsed = parseFloat(lineHeight);
                                        setLineHeight(isNaN(parsed) ? 'Auto' : parseFloat(parsed.toFixed(1)));
                                    }
                                }}
                                className="w-full text-center text-[0.7vw] font-semibold text-gray-700 outline-none bg-transparent"
                            />
                            <div
                                onMouseDown={(e) => {
                                    if (e.button !== 0) return;
                                    document.body.style.cursor = 'ew-resize';
                                    document.body.style.userSelect = 'none';
                                    const startX = e.clientX;
                                    const startVal = lineHeight === 'Auto' ? (isT1 ? 1.1 : 1.2) : parseFloat(lineHeight);
                                    const handleMouseMove = (moveEvent) => {
                                        const deltaX = moveEvent.clientX - startX;
                                        const change = deltaX / 100;
                                        const newVal = parseFloat(Math.min(3.0, Math.max(0.5, startVal + change)).toFixed(1));
                                        setLineHeight(newVal);
                                    };
                                    const handleMouseUp = () => {
                                        window.removeEventListener('mousemove', handleMouseMove);
                                        window.removeEventListener('mouseup', handleMouseUp);
                                        document.body.style.cursor = '';
                                        document.body.style.userSelect = '';
                                    };
                                    window.addEventListener('mousemove', handleMouseMove);
                                    window.addEventListener('mouseup', handleMouseUp);
                                }}
                                className="cursor-ew-resize p-[0.1vw] hover:bg-gray-100 rounded-[0.2vw] flex items-center justify-center shrink-0"
                                title="Drag to adjust line height"
                            >
                                <Icon icon="solar:paragraph-spacing-linear" width="1.2vw" height="1.2vw" className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 3: Align, Underline/Italic */}
                <div className="flex items-center gap-[0.5vw]">
                    <button 
                        type="button"
                        onClick={() => setAlign('left')}
                        className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${align === 'left' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <Icon icon="lucide:align-left" className="w-[1vw] h-[1vw]" />
                    </button>
                    <button 
                        type="button"
                        onClick={() => setAlign('center')}
                        className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${align === 'center' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <Icon icon="lucide:align-center" className="w-[1vw] h-[1vw]" />
                    </button>
                    <button 
                        type="button"
                        onClick={() => setAlign('right')}
                        className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${align === 'right' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <Icon icon="lucide:align-right" className="w-[1vw] h-[1vw]" />
                    </button>
                    <button 
                        type="button"
                        onClick={() => setAlign('justify')}
                        className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${align === 'justify' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <Icon icon="lucide:align-justify" className="w-[1vw] h-[1vw]" />
                    </button>
                    <div className="w-[1px] h-[1.2vw] bg-gray-200 mx-[0.2vw]" />
                    <button 
                        type="button"
                        onClick={() => setUnderline(!underline)}
                        className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${underline ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        title="Underline"
                    >
                        <span className="font-semibold underline text-[0.85vw] leading-none">U</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setItalic(!italic)}
                        className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${italic ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        title="Italic"
                    >
                        <span className="font-semibold italic text-[0.85vw] leading-none">I</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setLinethrough(!linethrough)}
                        className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${linethrough ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        title="Strikethrough"
                    >
                        <span className="font-semibold line-through text-[0.85vw] leading-none">S</span>
                    </button>
                </div>

                {/* Text Color Section */}
                <div className="flex flex-col gap-[0.8vw]">
                    <div className="flex items-center gap-[0.5vw]">
                        <span className="font-bold text-[0.8vw] text-gray-900 shrink-0">Text Color</span>
                        <div className="flex-1 h-[1px] bg-gray-200" />
                    </div>
                    <div className="flex items-center gap-[0.6vw]">
                        <span className="text-[0.75vw] font-bold text-gray-600 min-w-[2vw]">Fill :</span>
                        <div className="relative">
                            <div 
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-300 shadow-sm cursor-pointer hover:scale-105 transition-all"
                                style={{ backgroundColor: color }}
                            />
                            {showColorPicker && (
                                <>
                                    <div className="fixed inset-0 z-[280]" onClick={() => setShowColorPicker(false)} />
                                    <ColorPicker 
                                        color={color}
                                        onChange={(newCol) => setColor(newCol)}
                                        opacity={opacity}
                                        onOpacityChange={(newOp) => setOpacity(newOp)}
                                        onClose={() => setShowColorPicker(false)}
                                        className="absolute right-[calc(100%+0.8vw)] top-1/2 -translate-y-1/2 z-[290] typography-color-picker"
                                    />
                                </>
                            )}
                        </div>
                        <div className="w-[10.5vw] flex items-center border border-gray-300 rounded-[0.6vw] bg-white overflow-hidden shadow-sm h-[2.2vw] px-[0.6vw]">
                            <input 
                                type="text" 
                                value={color} 
                                onChange={(e) => setColor(e.target.value)}
                                className="w-[4vw] text-[0.75vw] font-bold text-gray-700 uppercase outline-none bg-transparent"
                                maxLength={7}
                            />
                            <div className="flex-1 flex items-center justify-end gap-[0.1vw] border-l border-gray-200 pl-[0.5vw] ml-[0.5vw] shrink-0">
                                <input 
                                    type="number" 
                                    value={opacity} 
                                    onChange={(e) => setOpacity(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="w-[1.8vw] text-center text-[0.75vw] font-bold text-gray-700 outline-none bg-transparent no-spin"
                                />
                                <span className="text-[0.75vw] font-bold text-gray-400 shrink-0 select-none">%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>, document.body
    );
};

export default TypographyPanel;
