import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import TabletTableOfContentsPopup from './TabletTableOfContentsPopup';
import ShareModal from '../../../ShareModal';

const PageThumbnail = React.memo(({ html, index, scale = 0.15 }) => {
    const cleanHtml = (html || '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<video\b[^<]*(?:(?!<\/video>)<[^<]*)*<\/video>/gi, '<div style="width:100%;height:100%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:20px;color:#9ca3af">Video</div>')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '<div style="width:100%;height:100%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:20px;color:#9ca3af">Frame</div>')
        .replace(/<img\b([^>]*src=['"]https:\/\/codia-f2c\.s3\.us-west-1\.amazonaws\.com\/[^'"]*['"])([^>]*)>/gi, '<img $1 crossOrigin="anonymous" $2>');

    const srcDoc = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        overflow: hidden; 
                        background: white; 
                        width: 400px; 
                        height: 566px; 
                        position: relative;
                    }
                    * { box-sizing: border-box; }
                    ::-webkit-scrollbar { width: 0px; background: transparent; }
                    img { max-width: 100%; height: auto; display: block; }
                </style>
            </head>
            <body>
                 <div style="width: 400px; height: 566px; overflow: hidden; position: relative; background: white;">
                    ${cleanHtml}
                </div>
            </body>
        </html>
    `;

    return (
        <div className="w-full h-full relative overflow-hidden bg-white flex items-center justify-center">
            <iframe
                className="border-none pointer-events-none"
                srcDoc={srcDoc}
                title={`Thumb ${index}`}
                loading="lazy"
                style={{
                    width: '400px',
                    height: '566px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    backgroundColor: 'white'
                }}
            />
        </div>
    );
});

const TabletLayout1 = ({ children, bookRef, currentPage, pages, offset = 0, settings, showTOC, setShowTOCMemo, showThumbnailBar, setShowThumbnailBarMemo, onPageClick, showSoundPopup, setShowSoundPopupMemo, showProfilePopup, setShowProfilePopupMemo, showGalleryPopup, setShowGalleryPopupMemo, currentBook, activeLayout, handleFullScreen, currentZoom = 1, setCurrentZoom, handleZoomIn, handleZoomOut, handleDownload, searchQuery, setSearchQuery, handleQuickSearch, bookName }) => {
    const scrollRef = useRef(null);
    const sliderRef = useRef(null);

    const handleZoomDrag = (e) => {
        if (!sliderRef.current || !setCurrentZoom) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = x / rect.width;
        setCurrentZoom(0.2 + percentage * 1.6);
    };
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [visibleIndices, setVisibleIndices] = useState([]);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);

    const progressRef = useRef(null);
    const handleProgressClick = (e) => {
        if (!progressRef.current || !pages || pages.length <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pages.length - 1));

        setShowTOCMemo?.(false);
        setShowThumbnailBarMemo?.(false);
        if (onPageClick) onPageClick(targetIdx);
    };
    let progressPercentage = 0;
    if (pages && pages.length > 1) {
        if (currentPage >= pages.length - 1) {
            progressPercentage = 100;
        } else if (pages.length % 2 !== 0 && currentPage >= pages.length - 2) {
            progressPercentage = 100;
        } else {
            progressPercentage = (currentPage / (pages.length - 1)) * 100;
        }
    }

    const layoutColors = settings?.Layouts?.layoutColors || settings?.layoutColors;
    const layoutColorsArray = Array.isArray(layoutColors) ? layoutColors : (layoutColors?.[activeLayout] || []);

    const getLayoutColor = (id, defaultColor) => {
        if (layoutColorsArray && layoutColorsArray.length > 0) {
            const colorObj = layoutColorsArray.find(c => c && c.id === id);
            if (colorObj && colorObj.hex) {
                return colorObj.hex;
            }
        }
        return `var(--${id}, ${defaultColor})`;
    };

    const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
        if (layoutColorsArray && layoutColorsArray.length > 0) {
            const colorObj = layoutColorsArray.find(c => c && c.id === id);
            if (colorObj && colorObj.hex) {
                const hex = colorObj.hex.replace('#', '');
                const r = parseInt(hex.length === 3 ? hex.charAt(0) + hex.charAt(0) : hex.substring(0, 2), 16);
                const g = parseInt(hex.length === 3 ? hex.charAt(1) + hex.charAt(1) : hex.substring(2, 4), 16);
                const b = parseInt(hex.length === 3 ? hex.charAt(2) + hex.charAt(2) : hex.substring(4, 6), 16);
                if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                }
            }
        }
        return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
    };

    const spreads = useMemo(() => {
        const result = [];
        if (pages && pages.length > 0) {
            result.push({ pages: [pages[0]], indices: [0], label: "Page 1" });
            for (let i = 1; i < pages.length; i += 2) {
                const spreadIndices = [i];
                const spreadPages = [pages[i]];
                if (i + 1 < pages.length) {
                    spreadIndices.push(i + 1);
                    spreadPages.push(pages[i + 1]);
                }
                result.push({
                    pages: spreadPages,
                    indices: spreadIndices,
                    label: spreadIndices.length === 1 ? `Page ${spreadIndices[0] + 1}` : `Page ${spreadIndices[0] + 1}-${spreadIndices[1] + 1}`
                });
            }
        }
        return result;
    }, [pages]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = window.innerWidth * 0.2;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const checkScroll = useCallback(() => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const overflowing = scrollWidth > clientWidth + 5;
            setIsOverflowing(overflowing);
            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

            const containerRect = scrollRef.current.getBoundingClientRect();
            const items = scrollRef.current.querySelectorAll('.thumbnail-item');
            const visible = [];

            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                const index = parseInt(item.getAttribute('data-index'));
                if (rect.right > containerRect.left + 1 && rect.left < containerRect.right - 1) {
                    visible.push(index);
                }
            });

            if (visible.length > 0) {
                setVisibleIndices(visible.sort((a, b) => a - b));
            }
        }
    }, [spreads.length]);

    useEffect(() => {
        if (!scrollRef.current || !showThumbnailBar) return;
        const interval = setInterval(checkScroll, 100);
        const resizeObserver = new ResizeObserver(() => { checkScroll(); });
        resizeObserver.observe(scrollRef.current);
        checkScroll();
        return () => { clearInterval(interval); resizeObserver.disconnect(); };
    }, [showThumbnailBar, checkScroll]);

    useEffect(() => {
        if (showThumbnailBar && scrollRef.current) {
            const activeElem = scrollRef.current.querySelector('.active-thumbnail');
            if (activeElem) {
                activeElem.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
            }
            setTimeout(checkScroll, 50);
        }
    }, [currentPage, showThumbnailBar, checkScroll]);


    const {
        addSearch = true,
        addPageNumber = true,
        addSerialNumberHeading = true,
        addSerialNumberSubheading = true,
        content: propContent,
        items: propItems,
        toc: propToc
    } = settings?.tocSettings || settings?.toc || {};

    const [inputPage, setInputPage] = useState(currentPage === 0 ? 1 : (currentPage || 1));

    useEffect(() => {
        setInputPage(currentPage === 0 ? 1 : (currentPage || 1));
    }, [currentPage]);

    const handlePageInputSubmit = (e) => {
        if (e.key === 'Enter' || e.type === 'blur') {
            let targetPage = parseInt(inputPage);
            const totalPages = Array.isArray(pages) ? pages.length : pages || 12;

            if (isNaN(targetPage)) {
                setInputPage(currentPage === 0 ? 1 : (currentPage || 1));
                return;
            }
            if (targetPage < 1) targetPage = 1;
            if (targetPage > totalPages) targetPage = totalPages;

            setInputPage(targetPage);

            if (bookRef?.current?.pageFlip) {
                bookRef.current.pageFlip().turnToPage(targetPage - 1);
            }
        }
    };

    // Keyboard and Mouse Wheel Actions
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (settings?.navigation?.keyboard ?? true) {
                if (e.key === 'ArrowRight') {
                    bookRef.current?.pageFlip()?.flipNext();
                } else if (e.key === 'ArrowLeft') {
                    bookRef.current?.pageFlip()?.flipPrev();
                }
            }
        };

        let lastWheelTime = 0;
        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0 && handleZoomIn) handleZoomIn();
                else if (e.deltaY > 0 && handleZoomOut) handleZoomOut();
            } else if (settings?.navigation?.mouseWheel ?? true) {
                // Prevent flipping if scrolling inside a naturally scrollable element
                if (e.target.closest('.overflow-y-auto') || e.target.closest('.overflow-x-auto') || e.target.closest('.thumbnail-bar') || e.target.closest('input') || e.target.closest('.no-scrollbar')) {
                    return;
                }
                
                const now = Date.now();
                if (now - lastWheelTime < 600) return; // Debounce to prevent rapid flipping
                
                if (e.deltaY > 0) {
                    bookRef.current?.pageFlip()?.flipNext();
                    lastWheelTime = now;
                } else if (e.deltaY < 0) {
                    bookRef.current?.pageFlip()?.flipPrev();
                    lastWheelTime = now;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        
        const container = document.getElementById('tablet-layout-container') || window;
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            container.removeEventListener('wheel', handleWheel);
        };
    }, [settings?.navigation?.keyboard, settings?.navigation?.mouseWheel]);


    return (
        <div
            className="relative w-full h-full flex flex-col font-sans overflow-hidden "
            style={{ containerType: 'inline-size' }}
        >
            <div id="tablet-download-portal" className="absolute inset-0 z-[60] pointer-events-none"></div>
            {/* Top Bar */}
            <div className="w-full h-[8%] flex items-center justify-between px-[2cqw] flex-shrink-0 z-10 shadow-md" style={{ backgroundColor: getLayoutColor('toolbar-bg', '#5C5898'), color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                {/* Search Bar */}
                <div className="relative z-50 w-[25cqw] h-full flex items-center">
                    <div className="relative w-full h-[60%] rounded-full flex items-center px-[1cqw] border" style={{ backgroundColor: getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.08), borderColor: getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.4) }}>
                        <Icon icon="lucide:search" className="opacity-70 w-[1.8cqw] h-[1.8cqw]" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }} />
                        <input
                            type="text"
                            value={localSearchQuery}
                            onChange={(e) => {
                                const val = e.target.value;
                                setLocalSearchQuery(val);

                                if (val.length >= 1) {
                                    const results = [];
                                    const lowerQuery = val.toLowerCase();
                                    const uniqueMatches = new Set();

                                    pages.forEach((page, index) => {
                                        const text = (page.html || page.content || '').replace(/<[^>]*>/g, ' ');
                                        const words = text.split(/\s+/).filter(w => w.trim().length > 0);

                                        for (let i = 0; i < words.length; i++) {
                                            const word = words[i];
                                            const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
                                            if (cleanWord.length > 2 && cleanWord.toLowerCase().startsWith(lowerQuery)) {
                                                const contextWords = words.slice(i + 1, i + 3).join(' ');
                                                const matchKey = `${cleanWord.toLowerCase()}|${contextWords.toLowerCase()}`;

                                                if (!uniqueMatches.has(matchKey)) {
                                                    results.push({
                                                        word: word,
                                                        context: contextWords,
                                                        pageNumber: index + 1
                                                    });
                                                    uniqueMatches.add(matchKey);
                                                }
                                            }
                                            if (results.length > 15) break;
                                        }
                                        if (results.length > 15) return;
                                    });
                                    setRecommendations(results.slice(0, 6));
                                } else {
                                    setRecommendations([]);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setSearchQuery?.(localSearchQuery);
                                    handleQuickSearch?.(localSearchQuery);
                                    setRecommendations([]);
                                }
                            }}
                            placeholder="Quick Search..."
                            autoComplete="off"
                            spellCheck="false"
                            autoCorrect="off"
                            className="bg-transparent border-none outline-none w-full h-full text-[1.4cqw] ml-[0.5cqw] placeholder-[currentColor] placeholder-opacity-70"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        />
                    </div>
                    {/* Recommendations Dropdown */}
                    {recommendations.length > 0 && (
                        <div
                            className="absolute top-[100%] mt-[1cqw] w-[25cqw] left-0 rounded-[1cqw] shadow-2xl z-[100] overflow-hidden border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200"
                            onClick={(e) => e.stopPropagation()}
                            style={{ backgroundColor: getLayoutColorAlpha('toc-bg', '87, 92, 156', 0.8), backdropFilter: 'blur(8px)' }}
                        >
                            <div className="flex flex-col py-[0.5cqw]">
                                {recommendations.map((rec, idx) => (
                                    <button
                                        key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                        className="flex items-center justify-between px-[1.5cqw] py-[0.8cqw] hover:bg-white/10 transition-colors group"
                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}
                                        onClick={() => {
                                            onPageClick(rec.pageNumber - 1);
                                            const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                            setLocalSearchQuery(fullQuery);
                                            setSearchQuery?.(fullQuery);
                                            setRecommendations([]);
                                        }}
                                    >
                                        <div className="flex flex-col items-start overflow-hidden flex-1 mr-[1cqw]">
                                            <span className="text-[1.3cqw] opacity-90 group-hover:opacity-100 truncate w-full text-left">
                                                <span className="font-semibold mr-[0.5cqw]">{rec.word}</span>
                                                {rec.context && <span className="font-normal opacity-70">{rec.context}</span>}
                                            </span>
                                        </div>
                                        <span className="text-[1.1cqw] font-bold opacity-60 tabular-nums shrink-0">
                                            {rec.pageNumber < 10 ? `0${rec.pageNumber}` : rec.pageNumber}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Title */}
                <div className="absolute left-1/2 -translate-x-1/2  font-medium text-[1.8cqw] tracking-wide">
                    {/* bookName hidden */}
                </div>

                {/* Empty space for balance */}
                <div className="w-[25cqw]"></div>
            </div>

            {/* Middle Content Area */}
            <div className="flex-1 min-h-0 w-full relative flex items-center justify-center overflow-hidden">

                <div className="absolute inset-0 w-full h-full flex items-center justify-center z-0 gap-[4cqw] px-[4cqw]">
                    {/* Left Chevron */}
                    <button
                        onClick={() => bookRef?.current?.pageFlip()?.flipPrev()}
                        className={`shrink-0 w-[3cqw] h-[4cqw] rounded-[0.3cqw] flex items-center justify-center transition-all duration-300 z-10 ${(!currentPage || currentPage === 0)
                            ? 'opacity-30 cursor-not-allowed'
                            : 'shadow-md hover:brightness-90 cursor-pointer'
                            }`}
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', '#5C5898') }}
                    >
                        <Icon icon="lucide:chevron-left" className="w-[2cqw] h-[2cqw]" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }} />
                    </button>

                    {/* The Book (Placeholder or Children) */}
                    <div
                        style={{ transform: `translateX(${offset}px) scale(${currentZoom})`, transition: 'transform 0.5s ease-out', transformOrigin: 'center center' }}
                        className="flex items-center justify-center shrink-0 max-w-[calc(100%-14cqw)]"
                    >
                        {children ? (
                            children
                        ) : (
                            <div className="h-[90%] aspect-[1/1.4] bg-white shadow-[0_1cqw_3cqw_rgba(0,0,0,0.15)] flex flex-col items-center pt-[5cqw] relative overflow-hidden">
                                <div className="w-full px-[3cqw]">
                                    <div className="w-[10cqw] h-[3cqw] bg-gray-200 mb-[2cqw]"></div>
                                    <div className="w-full h-[8cqw] bg-teal-800 mb-[1cqw]"></div>
                                    <div className="w-2/3 h-[2cqw] bg-gray-300 mb-[4cqw]"></div>

                                    <div className="flex gap-[2cqw] mb-[4cqw]">
                                        <div className="w-1/3 h-[15cqw] bg-gray-100"></div>
                                        <div className="w-2/3 h-[15cqw] bg-gray-200"></div>
                                    </div>

                                    <div className="w-1/2 h-[2cqw] bg-gray-300 mb-[2cqw]"></div>
                                    <div className="w-full h-[10cqw] bg-gray-100"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Chevron */}
                    <button
                        onClick={() => bookRef?.current?.pageFlip()?.flipNext()}
                        className={`shrink-0 w-[3cqw] h-[4cqw] rounded-[0.3cqw] flex items-center justify-center transition-all duration-300 z-10 ${(pages && currentPage >= (Array.isArray(pages) ? pages.length - 1 : pages - 1))
                            ? 'opacity-30 cursor-not-allowed'
                            : 'shadow-md hover:brightness-90 cursor-pointer'
                            }`}
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', '#5C5898') }}
                    >
                        <Icon icon="lucide:chevron-right" className="w-[2cqw] h-[2cqw]" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }} />
                    </button>
                </div>

                {/* Page Indicator Pill */}
                <div className="absolute bottom-[2cqw] left-[2cqw] px-[2cqw] py-[0.8cqw] rounded-[1.5cqw] shadow-[0_4px_15px_rgba(0,0,0,0.1)] flex items-center justify-center z-[900] transition-all duration-300 backdrop-blur-sm" 
                    style={{ 
                        backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), 
                        opacity: 'var(--toolbar-text-main-opacity, 1)' 
                    }}
                >
                    <span
                        className="text-[1.4cqw] font-bold transition-colors"
                        style={{ color: getLayoutColor('toolbar-bg', '#5C5898') }}
                    >Page </span>
                    <input
                        type="text"
                        value={inputPage}
                        onChange={(e) => setInputPage(e.target.value)}
                        onKeyDown={handlePageInputSubmit}
                        onBlur={handlePageInputSubmit}
                        className="text-[1.4cqw] font-bold rounded-[0.4cqw] outline-none text-center transition-colors shadow-inner mx-[0.6cqw] px-[0.4cqw] py-[0.1cqw]"
                        style={{
                            color: getLayoutColor('toolbar-bg', '#5C5898'),
                            backgroundColor: getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.1),
                            border: `1px solid ${getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.2)}`,
                            width: `${String(Array.isArray(pages) ? pages.length : pages || 12).length + 1.2}ch`
                        }}
                        onFocus={(e) => {
                            e.target.style.backgroundColor = getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.15);
                            e.target.style.borderColor = getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.4);
                        }}
                        onMouseOver={(e) => {
                            if(document.activeElement !== e.target) {
                                e.target.style.backgroundColor = getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.15);
                            }
                        }}
                        onMouseOut={(e) => {
                            if(document.activeElement !== e.target) {
                                e.target.style.backgroundColor = getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.1);
                            }
                        }}
                    />
                    <span
                        className="text-[1.4cqw] font-bold transition-colors"
                        style={{ color: getLayoutColor('toolbar-bg', '#5C5898') }}
                    > / {Array.isArray(pages) ? pages.length : pages || 12}</span>
                </div>
            </div>


            {showThumbnailBar && (
                <div className="absolute inset-0 z-[150] pointer-events-none flex items-end justify-center pb-[10cqw]">
                    <div
                        className="relative flex items-center group/bar fisto-menu-content thumbnail-bar pointer-events-auto transition-all shadow-[0_1cqw_4cqw_rgba(0,0,0,0.3)] backdrop-blur-md overflow-hidden"
                        style={{
                            width: 'fit-content',
                            minWidth: '40cqw',
                            maxWidth: '88cqw',
                            height: '14cqw',
                            backgroundColor: getLayoutColorAlpha('thumbnail-outer-v2', '87, 92, 156', 0.8),
                            backdropFilter: 'blur(8px)',
                            borderRadius: '1.5cqw',
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Always Visible Left Arrow */}
                        <div className="flex-shrink-0 flex items-center justify-center pl-[1cqw] pr-[0.5cqw] z-50 h-full">
                            <button
                                className={`w-[3cqw] h-[5cqw] rounded-[0.5cqw] flex items-center justify-center transition-all shadow-xl transition-colors border border-white/20 ${canScrollLeft ? 'opacity-100 active:scale-95 hover:bg-white/10 cursor-pointer' : 'opacity-30 cursor-default'}`}
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    color: '#FFFFFF'
                                }}
                                onClick={(e) => { e.stopPropagation(); if (canScrollLeft) scroll('left'); }}
                            >
                                <Icon icon="lucide:chevron-left" className="w-[2cqw] h-[2cqw]" />
                            </button>
                        </div>
                        <div
                            ref={scrollRef}
                            className="flex-1 flex items-center h-full overflow-x-auto no-scrollbar scroll-smooth relative"
                            style={{
                                paddingLeft: '1cqw',
                                paddingRight: '1cqw',
                                gap: '2cqw'
                            }}
                            onScroll={checkScroll}
                        >
                            {spreads.map((spread, idx) => {
                                const isActive = spread.indices.includes(currentPage - 1);
                                return (
                                    <div
                                        key={idx}
                                        data-index={idx}
                                        className={`thumbnail-item flex flex-col items-center shrink-0 cursor-pointer rounded-[0.5cqw] ${isActive ? 'active-thumbnail' : ''}`}
                                        style={{
                                            padding: '0.6cqw 1cqw',
                                            gap: '0.4cqw',
                                            backgroundColor: isActive ? getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.6) : getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2),
                                            border: 'none',
                                            opacity: 1,
                                            transition: 'all 0.3s ease'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (bookRef?.current?.pageFlip) {
                                                bookRef.current.pageFlip().turnToPage(spread.indices[0]);
                                            }
                                        }}
                                    >
                                        <div
                                            className={`relative overflow-hidden transition-all bg-white border-[2px] shadow-xl rounded-none ${isActive ? 'border-white' : 'border-transparent hover:border-white/20'}`}
                                            style={{
                                                width: '9cqw',
                                                height: '6.75cqw'
                                            }}
                                        >
                                            {/* Inner Flex Container for Spread */}
                                            <div className="flex w-full h-full gap-[1px] bg-gray-200 justify-center">
                                                {spread.pages.map((page, pIdx) => (
                                                    <div key={pIdx} className="flex-1 max-w-[50%] h-full relative border-r border-black/10 last:border-r-0 bg-white overflow-hidden flex items-center justify-center">
                                                        {(isActive || visibleIndices.includes(idx) ||
                                                            (visibleIndices.length > 0 && Math.abs(idx - visibleIndices[0]) <= 5) ||
                                                            (visibleIndices.length > 0 && Math.abs(idx - visibleIndices[visibleIndices.length - 1]) <= 5)
                                                        ) ? (
                                                            <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={0.10} />
                                                        ) : (
                                                            <div className="w-full h-full bg-white flex items-center justify-center">
                                                                <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <span
                                            className={`text-[1.2cqw] transition-colors ${isActive ? 'font-bold' : 'font-medium'} px-[0.6cqw] py-[0.2cqw] rounded bg-black/20`}
                                            style={{ color: '#FFFFFF', textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}
                                        >
                                            {spread.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Always Visible Right Arrow */}
                        <div className="flex-shrink-0 flex items-center justify-center pr-[1cqw] pl-[0.5cqw] z-50 h-full">
                            <button
                                className={`w-[3cqw] h-[5cqw] rounded-[0.5cqw] flex items-center justify-center transition-all shadow-xl transition-colors border border-white/20 ${canScrollRight ? 'opacity-100 active:scale-95 hover:bg-white/10 cursor-pointer' : 'opacity-30 cursor-default'}`}
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    color: '#FFFFFF'
                                }}
                                onClick={(e) => { e.stopPropagation(); if (canScrollRight) scroll('right'); }}
                            >
                                <Icon icon="lucide:chevron-right" className="w-[2cqw] h-[2cqw]" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showTOC && (
                <TabletTableOfContentsPopup
                    onClose={() => setShowTOCMemo?.(false)}
                    onNavigate={(pageIndex) => bookRef?.current?.pageFlip()?.turnToPage(pageIndex)}
                    settings={settings}
                />
            )}

            {/* The React Portal targets for popups */}
            <div id="tablet-sound-portal" className="absolute inset-0 z-50 pointer-events-none"></div>
            <div id="tablet-profile-portal" className="absolute inset-0 z-50 pointer-events-none"></div>

            {/* Bottom Bar */}
            <div className="w-full h-[8%] flex items-center justify-between px-[2cqw] flex-shrink-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]" style={{ backgroundColor: getLayoutColor('bottom-toolbar-bg', 'var(--toolbar-bg, #5C5898)'), color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>

                {/* Left Icons */}
                <div className="flex items-center gap-[1.5cqw]">
                    <button
                        className={`flex flex-col items-center justify-center relative hover:text-gray-200 transition-colors group ${!settings?.toolbar?.addTextBelowIcons ? 'translate-y-[0.8vh]' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setShowTOCMemo?.(!showTOC); }}
                        style={{ opacity: showTOC ? 0.7 : 1 }}
                    >
                        <Icon icon="fluent:text-bullet-list-24-filled" className="w-[1.8cqw] h-[1.8cqw]" />
                        <span className={`mt-[0.3cqw] text-[1cqw] font-medium whitespace-nowrap transition-opacity duration-200 ${settings?.toolbar?.addTextBelowIcons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Contents</span>
                    </button>
                    <button
                        className={`flex flex-col items-center justify-center relative hover:text-gray-200 transition-colors group ${!settings?.toolbar?.addTextBelowIcons ? 'translate-y-[0.8vh]' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (showThumbnailBar) {
                                setShowThumbnailBarMemo?.(false);
                            } else {
                                setShowTOCMemo?.(false);
                                setShowThumbnailBarMemo?.(true);
                            }
                        }}
                        style={{ opacity: showThumbnailBar ? 0.7 : 1 }}
                    >
                        <Icon icon="ph:squares-four-fill" className="w-[1.8cqw] h-[1.8cqw]" />
                        <span className={`mt-[0.3cqw] text-[1cqw] font-medium whitespace-nowrap transition-opacity duration-200 ${settings?.toolbar?.addTextBelowIcons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Thumbnails</span>
                    </button>
                </div>

                {/* Middle Playback & Scrubber */}
                <div className="flex items-center gap-[1.5cqw] flex-1 max-w-[40cqw] mx-[2cqw]">
                    <button
                        className={`flex flex-col items-center justify-center relative hover:text-gray-200 transition-colors group ${!settings?.toolbar?.addTextBelowIcons ? 'translate-y-[0.8vh]' : ''}`}
                        onClick={() => {
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            if (onPageClick) onPageClick(0);
                        }}
                    >
                        <Icon icon="ph:skip-back" className="w-[1.8cqw] h-[1.8cqw]" />
                        <span className={`mt-[0.3cqw] text-[1cqw] font-medium whitespace-nowrap transition-opacity duration-200 ${settings?.toolbar?.addTextBelowIcons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>First</span>
                    </button>
                    <button className={`flex flex-col items-center justify-center relative hover:text-gray-200 transition-colors group ${!settings?.toolbar?.addTextBelowIcons ? 'translate-y-[0.8vh]' : ''}`}>
                        <Icon icon="ph:play-fill" className="w-[1.8cqw] h-[1.8cqw] " />
                        <span className={`mt-[0.3cqw] text-[1cqw] font-medium whitespace-nowrap transition-opacity duration-200 ${settings?.toolbar?.addTextBelowIcons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Play</span>
                    </button>
                    <button
                        className={`flex flex-col items-center justify-center relative hover:text-gray-200 transition-colors group ${!settings?.toolbar?.addTextBelowIcons ? 'translate-y-[0.8vh]' : ''}`}
                        onClick={() => {
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            if (onPageClick && pages && Array.isArray(pages)) {
                                onPageClick(pages.length - 1);
                            } else if (onPageClick && pages) {
                                onPageClick(pages - 1);
                            }
                        }}
                    >
                        <Icon icon="ph:skip-forward" className="w-[1.8cqw] h-[1.8cqw]" />
                        <span className={`mt-[0.3cqw] text-[1cqw] font-medium whitespace-nowrap transition-opacity duration-200 ${settings?.toolbar?.addTextBelowIcons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Last</span>
                    </button>

                    <div
                        ref={progressRef}
                        onClick={handleProgressClick}
                        className="flex-1 h-[0.3cqw] rounded-full relative cursor-pointer ml-[1cqw]"
                        style={{ backgroundColor: getLayoutColorAlpha('toolbar-icon', '255,255,255', 0.3) }}
                    >
                        <div
                            className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${progressPercentage}%`,
                                backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF')
                            }}
                        ></div>
                    </div>
                </div>

                {/* Right Icons */}
                <div className="flex items-center gap-[1.2cqw]">
                    {(settings?.media?.backgroundAudio ?? true) && (
                        <div className="relative">
                            <button
                                className={`flex flex-col items-center justify-center relative hover:text-gray-200 transition-colors group ${!settings?.toolbar?.addTextBelowIcons ? 'translate-y-[0.8vh]' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTOCMemo?.(false);
                                    setShowThumbnailBarMemo?.(false);
                                    setShowProfilePopupMemo?.(false);
                                    setShowGalleryPopupMemo?.(false);
                                    setShowSoundPopupMemo?.(!showSoundPopup);
                                }}
                                style={{ opacity: showSoundPopup ? 0.7 : 1 }}
                            >
                                <Icon icon="solar:music-notes-bold" className="w-[1.6cqw] h-[1.6cqw]" />
                                <span className={`mt-[0.3cqw] text-[1cqw] font-medium whitespace-nowrap transition-opacity duration-200 ${settings?.toolbar?.addTextBelowIcons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Sound</span>
                            </button>
                        </div>
                    )}
                    <button
                        className={`flex flex-col items-center justify-center relative hover:text-gray-200 transition-colors group ${!settings?.toolbar?.addTextBelowIcons ? 'translate-y-[0.8vh]' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            setShowSoundPopupMemo?.(false);
                            setShowProfilePopupMemo?.(false);
                            setShowGalleryPopupMemo?.(!showGalleryPopup);
                        }}
                        style={{ opacity: showGalleryPopup ? 0.7 : 1 }}
                    >
                        <Icon icon="clarity:image-gallery-solid" className="w-[1.6cqw] h-[1.6cqw]" />
                        <span className={`mt-[0.3cqw] text-[1cqw] font-medium whitespace-nowrap transition-opacity duration-200 ${settings?.toolbar?.addTextBelowIcons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Gallery</span>
                    </button>
                    <button
                        className={`flex flex-col items-center justify-center relative hover:text-gray-200 transition-colors group ${!settings?.toolbar?.addTextBelowIcons ? 'translate-y-[0.8vh]' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            setShowSoundPopupMemo?.(false);
                            setShowProfilePopupMemo?.(!showProfilePopup);
                        }}
                        style={{ opacity: showProfilePopup ? 0.7 : 1 }}
                    >
                        <Icon icon="fluent:person-24-filled" className="w-[1.6cqw] h-[1.6cqw]" />
                        <span className={`mt-[0.3cqw] text-[1cqw] font-medium whitespace-nowrap transition-opacity duration-200 ${settings?.toolbar?.addTextBelowIcons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Profile</span>
                    </button>

                    {/* Zoom Section */}
                    <div className="flex items-center gap-[0.5cqw] ml-[1cqw]">
                        <button
                            className="hover:text-gray-200 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleZoomOut?.(); }}
                        >
                            <Icon icon="ph:magnifying-glass-minus" className="w-[1.6cqw] h-[1.6cqw]" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }} />
                        </button>

                        <div
                            ref={sliderRef}
                            className="w-[6cqw] h-[1cqw] flex items-center relative cursor-pointer"
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                e.currentTarget.setPointerCapture(e.pointerId);
                                handleZoomDrag(e);
                            }}
                            onPointerMove={(e) => {
                                e.stopPropagation();
                                if (e.buttons === 1) handleZoomDrag(e);
                            }}
                        >
                            {/* Track Underlay */}
                            <div className="w-full h-[0.3cqw] rounded-full absolute transition-colors duration-300" style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.3 }} />
                            {/* Progress Fill */}
                            <div
                                className="absolute left-0 h-[0.3cqw] rounded-full transition-all duration-75 z-10"
                                style={{
                                    backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                    width: `${Math.max(0, Math.min(100, ((currentZoom - 0.2) / 1.6) * 100))}%`
                                }}
                            />
                            {/* Thumb (Pointer) */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-[1cqw] h-[1cqw] rounded-full shadow-md transition-all duration-75 z-20"
                                style={{
                                    backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                    left: `calc(${Math.max(0, Math.min(100, ((currentZoom - 0.2) / 1.6) * 100))}% - 0.5cqw)`
                                }}
                            />
                        </div>

                        <button
                            className="hover:text-gray-200 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleZoomIn?.(); }}
                        >
                            <Icon icon="ph:magnifying-glass-plus" className="w-[1.6cqw] h-[1.6cqw]" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }} />
                        </button>
                    </div>

                    <button
                        className={`flex flex-col items-center justify-center relative hover:text-gray-200 transition-colors ml-[1cqw] group ${!settings?.toolbar?.addTextBelowIcons ? 'translate-y-[0.8vh]' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTOCMemo?.(false);
                            setShowThumbnailBarMemo?.(false);
                            setShowSoundPopupMemo?.(false);
                            setShowProfilePopupMemo?.(false);
                            setShowGalleryPopupMemo?.(false);
                            setIsShareOpen(true);
                        }}
                    >
                        <Icon icon="mage:share-fill" className="w-[1.6cqw] h-[1.6cqw]" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }} />
                        <span className={`mt-[0.3cqw] text-[1cqw] font-medium whitespace-nowrap transition-opacity duration-200 ${settings?.toolbar?.addTextBelowIcons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Share</span>
                    </button>
                    <button
                        className={`flex flex-col items-center justify-center relative hover:text-gray-200 transition-colors group ${!settings?.toolbar?.addTextBelowIcons ? 'translate-y-[0.8vh]' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleDownload?.(); }}
                    >
                        <Icon icon="meteor-icons:download" className="w-[1.6cqw] h-[1.6cqw]" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }} />
                        <span className={`mt-[0.3cqw] text-[1cqw] font-medium whitespace-nowrap transition-opacity duration-200 ${settings?.toolbar?.addTextBelowIcons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Download</span>
                    </button>
                    <button
                        className={`flex flex-col items-center justify-center relative hover:text-gray-200 transition-colors group ${!settings?.toolbar?.addTextBelowIcons ? 'translate-y-[0.8vh]' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleFullScreen?.(); }}
                    >
                        <Icon icon="lucide:fullscreen" className="w-[1.6cqw] h-[1.6cqw]" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }} />
                        <span className={`mt-[0.3cqw] text-[1cqw] font-medium whitespace-nowrap transition-opacity duration-200 ${settings?.toolbar?.addTextBelowIcons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Fullscreen</span>
                    </button>
                </div>

            </div>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                isTabletLayout={true}
                currentBook={currentBook || settings}
                activeLayout={activeLayout || '1'}
            />
        </div>
    );
};

export default TabletLayout1;
