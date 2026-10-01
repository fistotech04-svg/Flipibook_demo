import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import PremiumDropdown from './PremiumDropdown';
import { Trash2 } from 'lucide-react';

export const getBookmarkSVGPath = (s) => {
    switch (s) {
        case 2: return 'M0 0H28C34.6274 0 40 5.37258 40 12V86C40 92.6274 34.6274 98 28 98H0V0Z';
        case 3: return 'M0 0H40L33.8298 49L40 98H0V0Z';
        case 4: return 'M0 0C22.0914 0 40 17.9086 40 40V58C40 80.0914 22.0914 98 0 98V0Z';
        case 5: return 'M0 0H34.0691C34.6219 0 35.0849 0.418537 35.1405 0.968522L40 49L35.0426 98H0V0Z';
        case 6: return 'M40 0H0V98H38L40.0002 95.1L37.8726 91.7L40.0002 88.3L37.8726 84.9L40.0002 81.5L37.8726 78.1L40.0002 74.7L37.8726 71.3L40.0002 67.9L37.8726 64.5L40.0002 61.1L37.8726 57.7L40.0002 54.3L37.8726 50.9L40 47.6L37.8723 44.2L40 40.8L37.8723 37.4L40 34L37.8723 30.6L40 27.2L37.8723 23.8L40 20.4L37.8723 17L40 13.6L37.8723 10.2L40 6.8L37.8723 3.4L40 0Z';
        case 1:
        default: return 'M0 0H40V98H0V0Z';
    }
};

export const getBookmarkClipPath = (s) => {
    switch (s) {
        case 3:
            return 'polygon(0% 0%, 100% 0%, 75% 50%, 100% 100%, 0% 100%)';
        case 5:
            return 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%)';
        case 6:
            return 'polygon(0% 0%, 100% 0%, 96% 5%, 100% 10%, 96% 15%, 100% 20%, 96% 25%, 100% 30%, 96% 35%, 100% 40%, 96% 45%, 100% 50%, 96% 55%, 100% 60%, 96% 65%, 100% 70%, 96% 75%, 100% 80%, 96% 85%, 100% 90%, 96% 95%, 100% 100%, 0% 100%)';
        default:
            return 'none';
    }
};

export const getBookmarkBorderRadius = (s) => {
    switch (s) {
        case 2:
            return '0 1vw 1vw 0';
        case 4:
            return '0 2vw 2vw 0';
        default:
            return '0';
    }
};

const BookmarkShape = ({ styleId, color, width, height, textClass, vertical = false }) => (
    <div className="relative flex items-center justify-center" style={{ width, height }}>
        {vertical ? (
            <svg viewBox="0 0 40 98" preserveAspectRatio="none" className="absolute inset-0 w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                <path d={getBookmarkSVGPath(styleId)} fill={color || '#C45A5A'} />
            </svg>
        ) : (
            <div 
                className="absolute top-1/2 left-1/2"
                style={{
                    width: height,
                    height: width,
                    transform: 'translate(-50%, -50%) rotate(-90deg)'
                }}
            >
                <svg viewBox="0 0 40 98" preserveAspectRatio="none" className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                    <path d={getBookmarkSVGPath(styleId)} fill={color || '#C45A5A'} />
                </svg>
            </div>
        )}
        <span 
            className={`relative z-10 text-white font-semibold whitespace-nowrap ${textClass || ''}`}
            style={vertical ? { transform: 'rotate(-90deg)' } : {}}
        >
            Bookmark
        </span>
    </div>
);

const BookmarkStylesPopup = ({ onClose, settings = {}, onUpdate, pages = [] }) => {
    const updateSectionField = (section, subSection, field, value) => {
        if (!onUpdate) return;
        onUpdate(prev => ({
            ...prev,
            [section]: {
                ...(prev?.[section] || {}),
                [subSection]: {
                    ...(prev?.[section]?.[subSection] || {}),
                    [field]: value
                }
            }
        }));
    };

    const bookmarkSettings = settings?.navigation?.bookmarkSettings || settings?.bookmarkSettings || {};
    const rawItems = bookmarkSettings.items || [
        { title: 'Home', page: 'Page-1' },
        { title: 'Features', page: 'Page-2' },
        { title: '3D View', page: 'Page-3' }
    ];

    const formatPageVal = (val) => {
        if (!val) return 'Page-1';
        if (String(val).startsWith('Page-')) return String(val);
        const num = String(val).replace(/\D/g, '');
        return num ? `Page-${num}` : 'Page-1';
    };

    const items = rawItems.map(item => ({
        ...item,
        page: formatPageVal(item.page)
    }));

    const fontFamilies = [
        'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
        'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
        'Inter', 'Playfair Display', 'Oswald', 'Merriweather'
    ];

    const [showStyleGrid, setShowStyleGrid] = useState(false);
    const [tempStyle, setTempStyle] = useState(bookmarkSettings.style || 1);
    const styles = [1, 2, 3, 4, 5, 6];
    const popupAnchorRef = useRef(null);
    const [popupStyle, setPopupStyle] = useState({});

    const handleOpenGrid = () => {
        setTempStyle(bookmarkSettings.style || 1);
        setShowStyleGrid(true);
    };

    useEffect(() => {
        if (showStyleGrid && popupAnchorRef.current) {
            const rect = popupAnchorRef.current.getBoundingClientRect();
            setPopupStyle({
                top: `${rect.top}px`,
                left: `${rect.left}px`,
                transform: 'translate(2vw, -1vw)',
            });
        }
    }, [showStyleGrid]);

    return (
        <div className="w-full space-y-[1.25vw] pt-[0.5vw]" onClick={(e) => e.stopPropagation()} ref={popupAnchorRef}>
            {showStyleGrid && typeof document !== 'undefined' && createPortal(
                <div 
                    className="fixed w-[26vw] z-[9999] bg-white rounded-[0.8vw] shadow-[0_4px_30px_rgba(0,0,0,0.2)] border border-gray-200 overflow-hidden"
                    style={popupStyle}
                >
                    <div className="p-[1vw] space-y-[1vw]">
                        <div className="flex items-center gap-[0.5vw]">
                            <h4 className="text-[1.1vw] font-semibold text-black whitespace-nowrap">Bookmark Styles</h4>
                            <div className="h-[1px] bg-gray-200 flex-1"></div>
                        </div>
                        <div className="flex justify-between items-center px-[0.5vw]">
                            {styles.map(s => (
                                <div 
                                    key={s}
                                    onClick={() => setTempStyle(s)}
                                    className={`cursor-pointer transition-all duration-300 rounded-[0.5vw] p-[0.3vw] flex items-center justify-center ${
                                        tempStyle === s 
                                        ? 'bg-gray-100/50 shadow-inner scale-105' 
                                        : 'hover:bg-gray-50 scale-100 hover:scale-105'
                                    }`}
                                >
                                    <BookmarkShape 
                                        styleId={s} 
                                        color={bookmarkSettings.color} 
                                        width="2vw" 
                                        height="4.5vw" 
                                        textClass="text-[0.55vw]" 
                                        vertical={true}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="h-[1px] bg-gray-200 w-full mt-[0.5vw]"></div>
                        <div className="flex items-center justify-end gap-[0.8vw] pt-[0.2vw]">
                            <button 
                                onClick={() => setShowStyleGrid(false)}
                                className="flex items-center gap-[0.4vw] px-[1.2vw] py-[0.5vw] border border-black rounded-[0.4vw] text-black text-[0.8vw] hover:bg-gray-50 transition-colors font-medium bg-white"
                            >
                                <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw]" />
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    updateSectionField('navigation', 'bookmarkSettings', 'style', tempStyle);
                                    setShowStyleGrid(false);
                                }}
                                className="flex items-center gap-[0.4vw] px-[1.2vw] py-[0.5vw] bg-black text-white rounded-[0.4vw] text-[0.8vw] hover:bg-gray-800 transition-colors font-medium border border-black"
                            >
                                <Icon icon="qlementine-icons:replace-16" className="w-[0.9vw] h-[0.9vw]" />
                                Change
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            
                    <>
                        {/* Styles Section */}
                        <div className="space-y-[0.75vw]">
                            <div className="flex items-center gap-[0.5vw] mb-[0.5vw]">
                                <h4 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.2vw]">Styles</h4>
                                <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
                            </div>

                            <div className="flex items-center gap-[2vw] px-[0.5vw]">
                                <div className="w-[4.5vw] h-[4.5vw] p-[0.5vw] flex flex-col items-center justify-center bg-white shadow-sm border border-gray-200 rounded-[0.5vw] relative group">
                                    <button 
                                        onClick={handleOpenGrid}
                                        className="absolute top-[0.2vw] right-[0.2vw] z-20 w-[1.2vw] h-[1.2vw] flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-all rounded-[0.2vw]"
                                    >
                                        <Icon icon="lucide:arrow-left-right" className="w-[0.8vw] h-[0.8vw] text-gray-800" />
                                    </button>
                                    <div className="flex items-center justify-center w-[4.5vw] h-[4.5vw]">
                                        <BookmarkShape 
                                            styleId={bookmarkSettings.style || 1} 
                                            color={bookmarkSettings.color} 
                                            width="1.8vw" 
                                            height="3.6vw" 
                                            textClass="text-[0.45vw]" 
                                            vertical={true}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-[0.5vw]">
                                    <span className="text-[0.75vw] font-semibold text-gray-800 pt-[0.1vw]">Select Text :</span>
                                    <PremiumDropdown 
                                        options={fontFamilies} 
                                        value={bookmarkSettings.font || 'Poppins'}
                                        onChange={(val) => updateSectionField('navigation', 'bookmarkSettings', 'font', val)}
                                        width="8vw"
                                        isFont={true}
                                        buttonClassName="!border-gray-300 !rounded-[0.4vw]"
                                        align="right"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Add Bookmark Section */}
                        <div className="space-y-[0.75vw] mt-[1.5vw]">
                            <div className="flex items-center gap-[0.5vw] mb-[0.5vw]">
                                <h4 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.2vw]">Add Bookmark</h4>
                                <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
                            </div>
                            
                            <div className="space-y-[0.5vw] pr-[0.5vw]">
                                {items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-[0.5vw]">
                                        <input 
                                            type="text" 
                                            value={item.title} 
                                            onChange={(e) => {
                                                const newItems = [...items];
                                                newItems[index].title = e.target.value;
                                                updateSectionField('navigation', 'bookmarkSettings', 'items', newItems);
                                            }}
                                            placeholder="Bookmark Title" 
                                            className="text-[0.75vw] h-[2.2vw] px-[0.5vw] border border-gray-300 rounded-[0.4vw] outline-none focus:border-gray-500 transition-colors bg-white text-gray-700" style={{width: '8vw'}}
                                        />
                                        <PremiumDropdown 
                                            options={Array.from({length: Math.max(1, pages?.length || 1)}, (_, i) => `Page-${i+1}`)}
                                            value={formatPageVal(item.page)}
                                            onChange={(val) => {
                                                const newItems = [...items];
                                                newItems[index].page = val;
                                                updateSectionField('navigation', 'bookmarkSettings', 'items', newItems);
                                            }}
                                            width="8.5vw"
                                            buttonClassName="!h-[2.2vw] !border-gray-300 !rounded-[0.4vw] text-[0.75vw] [&>span]:whitespace-nowrap"
                                        />
                                        <button 
                                            onClick={() => {
                                                const newItems = items.filter((_, i) => i !== index);
                                                updateSectionField('navigation', 'bookmarkSettings', 'items', newItems);
                                            }}
                                            className="text-red-400 hover:text-red-600 transition-colors p-[0.3vw] flex items-center justify-center"
                                        >
                                            <Trash2 size="1vw" strokeWidth={2} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="pr-[0.5vw] mt-[1vw]">
                                <button 
                                    onClick={() => {
                                        updateSectionField('navigation', 'bookmarkSettings', 'items', [...items, { title: '', page: 'Page-1' }]);
                                    }}
                                    className="w-full flex items-center justify-center gap-[0.4vw] h-[2.5vw] border border-gray-200 bg-white rounded-[0.4vw] text-[0.75vw] text-gray-600 font-medium hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    <Icon icon="lucide:plus" className="w-[0.9vw] h-[0.9vw]" strokeWidth={2} />
                                    Add Bookmark
                                </button>
                            </div>
                        </div>
                    </>
        </div>
    );
};

export default BookmarkStylesPopup;
