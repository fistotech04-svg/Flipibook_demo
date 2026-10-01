import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import TabletTableOfContentsPopup from './TabletTableOfContentsPopup';
import TabletProfilePopup from './TabletProfilePopup';
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

const hexToRgb = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '255, 255, 255';
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `${r}, ${g}, ${b}`;
};

const getLayoutColor = (id, defaultColor) =>
    `rgba(var(--${id}-rgb, ${hexToRgb(defaultColor)}), var(--${id}-opacity, 1))`;

const getLayoutColorRgba = (tokenId, defaultRgb, defaultOpacity) => {
    return `rgba(var(--${tokenId}-rgb, ${defaultRgb}), var(--${tokenId}-opacity, ${defaultOpacity}))`;
};

const ToolbarBtn = ({ icon, label, onClick, bg, color }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 shadow-sm"
        title={label}
        style={{ backgroundColor: bg || '#555555', color: color || 'white', width: '3cqw', height: '3cqw' }}
    >
        <Icon icon={icon} className="w-[1.6cqw] h-[1.6cqw]" />
    </button>
);

const TabletLayout8 = ({
    children,
    settings,
    bookName,
    searchQuery,
    setSearchQuery,
    handleQuickSearch,
    setShowThumbnailBarMemo,
    setShowTOCMemo,
    setShowProfilePopup,
    showProfilePopup,
    logoSettings,
    currentPage,
    pagesCount,
    pages,
    bookRef,
    showThumbnailBar,
    currentZoom,
    setCurrentZoom,
    onPageClick,
    handleDownload,
    handleFullScreen,
    isFullscreen,
    isMuted,
    setIsMuted,
    showSoundPopup,
    setShowSoundPopupMemo,
    profileSettings,
    setShowGalleryPopupMemo,
    showGalleryPopup,
    showTOC,
    backgroundStyle,
    showExportPopup,
    setShowExportPopupMemo,
    setIsPlaying,
    isAutoFlipping,
    offset = 0,
    currentBook,
    activeLayout
}) => {
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [inputPage, setInputPage] = useState(currentPage + 1);

    useEffect(() => {
        setInputPage(currentPage + 1);
    }, [currentPage]);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const scrollRef = useRef(null);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [pages]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            setTimeout(checkScroll, 350);
        }
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

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            setSearchQuery(localSearchQuery);
            handleQuickSearch(localSearchQuery);
        }
    };

    const handleContactClick = (e, contact) => {
        e.stopPropagation();
        const value = contact.value?.trim();
        if (!value) return;

        const isEmail = contact.type === 'email' || value.includes('@');
        const isPhone = contact.type === 'phone' || /^[+\d\s-]+$/.test(value);

        if (isEmail) {
            if (value.startsWith('mailto:')) {
                window.location.href = value;
            } else {
                window.location.href = `mailto:${value}`;
            }
        }
        else if (isPhone) {
            window.location.href = `tel:${value}`;
        }
        else {
            const url = value.startsWith('http') ? value : `https://${value}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const totalPages = pagesCount;
    const primaryColor = getLayoutColor('toolbar-bg', '#555555');
    const secondaryColor = '#FFFFFF';

    return (
        <div className="flex flex-col w-full h-full min-h-0 overflow-hidden font-sans relative" style={{ ...backgroundStyle, backgroundColor: 'transparent', containerType: 'size' }}>

            {/* Click-away Overlay for Search Suggestions */}
            {showSuggestions && recommendations.length > 0 && (
                <div 
                    className="absolute inset-0 z-[45] pointer-events-auto" 
                    onClick={() => setShowSuggestions(false)} 
                />
            )}

            {/* Top Bar (Floating) */}
            <div className="absolute top-[2cqh] left-[2cqw] right-[2cqw] flex items-center justify-between z-[200] pointer-events-none">

                {/* Left: Search Bar */}
                <div className="w-[22cqw] pointer-events-auto">
                    {(settings?.interaction?.search ?? true) && (
                        <div
                            className="flex items-center px-[1.5cqw] py-[0.8cqh] rounded-full shadow-md transition-all relative"
                            style={{ backgroundColor: secondaryColor }}
                        >
                            <Icon
                                icon="ph:magnifying-glass-regular"
                                className="w-[1.6cqw] h-[1.6cqw]"
                                style={{ color: getLayoutColor('search-text-v1', '#555555') }}
                            />
                            <input
                                type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                                value={localSearchQuery}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLocalSearchQuery(val);
                                    setShowSuggestions(true);
                                    if (val.trim().length >= 1) {
                                        const results = [];
                                        const lowerQuery = val.trim().toLowerCase();
                                        pages.forEach((page, index) => {
                                            const text = (page.html || page.content || '').replace(/<[^>]*>/g, ' ');
                                            const words = text.split(/\s+/).filter(Boolean);
                                            for (let i = 0; i < words.length; i++) {
                                                const cleanWord = words[i].replace(/[^a-zA-Z0-9-]/g, '');
                                                if (cleanWord.length >= val.trim().length && cleanWord.toLowerCase().startsWith(lowerQuery)) {
                                                    const nextWords = words.slice(i + 1, i + 3).join(' ').replace(/[^a-zA-Z0-9- ]/g, '');
                                                    const greyPart = nextWords.length > 12 ? nextWords.substring(0, 12) + '...' : nextWords + '...';
                                                    results.push({
                                                        boldPart: cleanWord,
                                                        greyPart: ' ' + greyPart,
                                                        pageNumber: index + 1
                                                    });
                                                }
                                            }
                                        });
                                        const uniqueResults = [];
                                        const seen = new Set();
                                        for (const r of results) {
                                            const key = r.boldPart + r.greyPart;
                                            if (!seen.has(key)) {
                                                seen.add(key);
                                                uniqueResults.push(r);
                                            }
                                        }
                                        setRecommendations(uniqueResults.slice(0, 4));
                                    } else {
                                        setRecommendations([]);
                                    }
                                }}
                                onFocus={() => { if (recommendations.length > 0) setShowSuggestions(true); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setSearchQuery(localSearchQuery);
                                        handleQuickSearch(localSearchQuery);
                                        setRecommendations([]);
                                        setShowSuggestions(false);
                                    }
                                }}
                                placeholder="Quick Search..."
                                className="bg-transparent border-0 outline-none w-full ml-[0.8cqw] font-medium text-[1.4cqw]"
                                style={{ color: getLayoutColor('search-text-v1', '#9BA0C9') }}
                            />
                            <AnimatePresence>
                                {showSuggestions && recommendations.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -5 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -5 }} 
                                        className="absolute top-full mt-[1cqw] left-0 w-full bg-white rounded-[1cqw] shadow-lg border border-black/10 z-[100] overflow-hidden pointer-events-auto"
                                    >
                                        <div className="flex flex-col py-[1cqw]">
                                            <div className="px-[1.5cqw] mb-[0.5cqw]">
                                                <span className="text-black/60 font-medium text-[1.2cqw]">Suggestions</span>
                                            </div>
                                            {recommendations.map((rec, idx) => (
                                                <button 
                                                    key={idx} 
                                                    className="flex items-center justify-between px-[1.5cqw] py-[0.8cqw] hover:bg-black/5 transition-colors text-left" 
                                                    onClick={(e) => { 
                                                        e.stopPropagation();
                                                        onPageClick(rec.pageNumber - 1); 
                                                        setRecommendations([]); 
                                                        setShowSuggestions(false); 
                                                        setLocalSearchQuery(rec.boldPart); 
                                                    }}
                                                >
                                                    <div className="flex-1 truncate mr-[1cqw]">
                                                        <span className="text-black font-medium text-[1.3cqw]">{rec.boldPart}</span>
                                                        <span className="text-black/50 text-[1.3cqw]">{rec.greyPart}</span>
                                                    </div>
                                                    <span className="text-black/50 font-medium text-[1.2cqw] whitespace-nowrap">Pg {rec.pageNumber}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Center: Tools Container */}
                <div className="absolute left-[58%] -translate-x-1/2 flex items-center gap-[1.5cqw] pointer-events-auto">
                    
                    {/* Block 1: Navigation & Media */}
                    <div className="flex items-center gap-[1.5cqw]">
                        {(settings?.navigation?.tableOfContents ?? true) && (
                            <ToolbarBtn 
                                icon="fluent:text-bullet-list-24-filled" 
                                onClick={() => setShowTOCMemo(!showTOC)} 
                                bg={showTOC ? secondaryColor : primaryColor}
                                color={showTOC ? primaryColor : secondaryColor}
                            />
                        )}
                        {(settings?.navigation?.pageThumbnails ?? true) && (
                            <ToolbarBtn 
                                icon="ph:squares-four-fill" 
                                onClick={() => setShowThumbnailBarMemo(!showThumbnailBar)} 
                                bg={showThumbnailBar ? secondaryColor : primaryColor}
                                color={showThumbnailBar ? primaryColor : secondaryColor}
                            />
                        )}
                        <ToolbarBtn icon={isAutoFlipping ? 'ph:pause-fill' : 'ph:play-fill'} onClick={() => setIsPlaying?.(!isAutoFlipping)} bg={primaryColor} />
                        {(settings?.interaction?.gallery ?? true) && (
                            <ToolbarBtn icon="clarity:image-gallery-solid" onClick={() => setShowGalleryPopupMemo(!showGalleryPopup)} bg={primaryColor} />
                        )}
                        {(settings?.media?.backgroundAudio ?? true) && (
                            <ToolbarBtn 
                                icon={isMuted ? "solar:music-notes-bold-duotone" : "solar:music-notes-bold"} 
                                onClick={(e) => { e.stopPropagation(); setShowSoundPopupMemo?.(!showSoundPopup); }} 
                                bg={showSoundPopup ? secondaryColor : primaryColor}
                                color={showSoundPopup ? primaryColor : secondaryColor}
                            />
                        )}
                    </div>

                    {/* Divider */}
                    <div className="w-[1.5px] h-[2cqw] rounded-full mx-[0.5cqw]" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}></div>

                    {/* Block 2: Zoom */}
                    {(settings?.viewing?.zoom ?? true) && (
                        <div className="flex items-center gap-[1.5cqw]">
                            <ToolbarBtn 
                                icon="ph:magnifying-glass-minus-bold" 
                                onClick={() => setCurrentZoom?.(Math.max(0.5, (currentZoom || 1) - 0.1))} 
                                bg={primaryColor} 
                            />
                            <span className="text-[1.4cqw] font-bold min-w-[3.5cqw] text-center whitespace-nowrap" style={{ color: secondaryColor, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                                {Math.round((currentZoom || 1) * 100)}%
                            </span>
                            <ToolbarBtn 
                                icon="ph:magnifying-glass-plus-bold" 
                                onClick={() => setCurrentZoom?.(Math.min(3, (currentZoom || 1) + 0.1))} 
                                bg={primaryColor} 
                            />
                            <button
                                onClick={() => setCurrentZoom?.(1)}
                                className="px-[1.2cqw] py-[0.6cqh] rounded-full shadow-sm text-[1.3cqw] font-bold transition-transform hover:scale-105 active:scale-95"
                                style={{ backgroundColor: secondaryColor, color: primaryColor }}
                            >
                                Reset
                            </button>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="w-[1.5px] h-[2cqw] rounded-full mx-[0.5cqw]" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}></div>

                    {/* Block 3: Actions */}
                    <div className="flex items-center gap-[1.5cqw]">
                        {(settings?.brandingProfile?.profile ?? true) && (
                            <ToolbarBtn icon="fluent:person-24-filled" onClick={() => setShowProfilePopup(!showProfilePopup)} bg={primaryColor} />
                        )}
                        {(settings?.shareExport?.share ?? true) && (
                            <ToolbarBtn icon="mage:share-fill" onClick={() => {
                                setShowTOCMemo?.(false);
                                setShowThumbnailBarMemo?.(false);
                                setShowGalleryPopupMemo?.(false);
                                setShowSoundPopupMemo?.(false);
                                setShowProfilePopup?.(false);
                                setShowExportPopupMemo?.(false);
                                setIsShareOpen(true);
                            }} bg={primaryColor} />
                        )}
                        {(settings?.shareExport?.download ?? true) && (
                            <ToolbarBtn icon="meteor-icons:download" onClick={() => setShowExportPopupMemo?.(true)} bg={primaryColor} />
                        )}
                        {(settings?.viewing?.fullScreen ?? true) && (
                            <ToolbarBtn icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} onClick={handleFullScreen} bg={primaryColor} />
                        )}
                    </div>

                </div>

                {/* Right spacer for balance (optional, or just logo area if needed) */}
                <div className="flex-1 pointer-events-none"></div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center relative p-[4cqw] pt-[8cqh] pb-[10cqh]">

                {/* Popups */}
                {showTOC && (
                    <TabletTableOfContentsPopup
                        variant="layout8"
                        onClose={() => setShowTOCMemo?.(false)} 
                        onNavigate={onPageClick} 
                        settings={settings}
                        layoutColors={settings?.layoutColors}
                    />
                )}

                {showProfilePopup && (
                    <TabletProfilePopup
                        activeLayout={5}
                        profileSettings={profileSettings}
                        layoutColors={settings?.layoutColors}
                        handleContactClick={handleContactClick}
                        fallbackText="#555555"
                        onClose={() => setShowProfilePopup(false)}
                    />
                )}

                {/* The Actual Book Content */}
                <div 
                    className="w-full h-full flex items-center justify-center z-0 relative"
                    style={{ transform: `translateX(${offset}px)`, transition: 'transform 0.5s ease-out' }}
                >
                    {children}
                </div>
            </div>

            {/* Bottom Bar: Page Controls & Book Name */}
            <div className="absolute bottom-[3cqh] left-[2cqw] right-[2cqw] flex items-center justify-between z-50 pointer-events-none">
                
                {/* Left: Book Name */}
                <div className="flex-1 flex justify-start pointer-events-auto">
                    <span className="text-[1.5cqw] font-bold tracking-wide" style={{ color: primaryColor }}>
                        {/* bookName hidden */}
                    </span>
                </div>

                {/* Center: Page Controls */}
                <div className="flex items-center justify-center gap-[1.5cqw] pointer-events-auto shrink-0">
                    
                    {/* First Page */}
                    <ToolbarBtn 
                        icon="ph:skip-back-fill" 
                        onClick={() => onPageClick(0)} 
                        bg={primaryColor} 
                    />
                    
                    {/* Previous Page */}
                    <ToolbarBtn 
                        icon="ph:caret-left-fill" 
                        onClick={() => bookRef?.current?.pageFlip()?.flipPrev()} 
                        bg={primaryColor} 
                    />
                    
                    {/* Page Indicator Pill */}
                    {(settings?.navigation?.pageQuickAccess ?? true) && (
                        <div 
                            className="px-[2cqw] py-[0.8cqh] rounded-full shadow-md flex items-center justify-center min-w-[12cqw]"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <span className="text-[1.4cqw] font-semibold flex items-center text-white">
                                Page - 
                                <input 
                                    type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                                    value={inputPage}
                                    onChange={(e) => setInputPage(e.target.value)}
                                    onBlur={() => {
                                        let p = parseInt(inputPage);
                                        if (isNaN(p) || p < 1) p = 1;
                                        if (p > totalPages) p = totalPages;
                                        setInputPage(p);
                                        if (p - 1 !== currentPage) {
                                            onPageClick(p - 1);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.target.blur();
                                        }
                                    }}
                                    className="mx-[0.5cqw] w-[3cqw] text-center bg-transparent outline-none border-none text-white placeholder-white/70"
                                /> 
                                / {totalPages}
                            </span>
                        </div>
                    )}
                    
                    {/* Next Page */}
                    <ToolbarBtn 
                        icon="ph:caret-right-fill" 
                        onClick={() => bookRef?.current?.pageFlip()?.flipNext()} 
                        bg={primaryColor} 
                    />
                    
                    {/* Last Page */}
                    <ToolbarBtn 
                        icon="ph:skip-forward-fill" 
                        onClick={() => onPageClick(pagesCount - 1)} 
                        bg={primaryColor} 
                    />
                    
                </div>

                {/* Right Spacer for balance */}
                <div className="flex-1 pointer-events-none"></div>
            </div>

            {/* Thumbnail Bar */}
            {showThumbnailBar && (
                <>
                    {/* Invisible click-to-close overlay */}
                    <div
                        className="fixed inset-0 z-[149] cursor-default"
                        onClick={() => setShowThumbnailBarMemo(false)}
                    />
                    <div
                        id="layout8-thumb-panel"
                        className="absolute w-max max-w-[70cqw] z-[150] pointer-events-auto"
                        style={{
                            top: '5cqw',
                            left: '53%',
                            transform: 'translateX(-50%)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Connector Tab for Thumbnail Icon */}
                        <div className="absolute bottom-[98%] w-[5cqw] h-[3.4cqw] z-0" style={{ left: '25%', transform: 'translateX(-50%)' }}>
                            <svg width="100%" height="100%" viewBox="0 0 113 67" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M24.8182 33.0909C24.8182 14.8153 39.6335 0 57.9091 0C76.1847 0 91 14.8153 91 33.0909V41.7377C91.0109 60.2573 94.967 66.6391 113 67H0C18.7515 67 24.8182 52.7213 24.8182 41.7377V33.0909Z"
                                    fill={getLayoutColor('dropdown-bg', '#5C5898')}
                                    fillOpacity="1"
                                />
                            </svg>
                        </div>

                        <div
                            className="w-full h-[12cqw] rounded-[1.2cqw] flex items-center relative px-[1cqw] shadow-2xl backdrop-blur-md"
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#5C5898') }}
                        >
                            {canScrollLeft && (
                                <button
                                    className="w-[4cqw] h-[8cqw] flex items-center justify-center hover:scale-110 transition-all shrink-0 z-10"
                                    onClick={(e) => { e.stopPropagation(); scroll('left'); }}
                                    style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                >
                                    <Icon icon="lucide:arrow-left" className="w-[2cqw] h-[2cqw]" />
                                </button>
                            )}

                            <div
                                ref={scrollRef}
                                onScroll={checkScroll}
                                className="flex-1 flex gap-[1.5cqw] px-[1cqw] items-center overflow-x-auto custom-scrollbar h-full py-[0.5cqw]"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);

                                    return (
                                        <div
                                            key={idx}
                                            className="flex-shrink-0 flex flex-col items-center cursor-pointer group py-[0.5cqw]"
                                            onClick={() => {
                                                if (bookRef?.current?.pageFlip) {
                                                    bookRef.current.pageFlip().turnToPage(spread.indices[0]);
                                                } else if (onPageClick) {
                                                    onPageClick(spread.indices[0]);
                                                }
                                                setShowThumbnailBarMemo(false);
                                            }}
                                        >
                                            <div
                                                className="rounded-[0.5cqw] overflow-hidden transition-all duration-300 bg-white shadow-lg flex flex-col items-center px-[0.3cqw] pt-[0.3cqw] pb-[0.2cqw]"
                                                style={{
                                                    width: '9cqw',
                                                    height: '7cqw',
                                                    border: isSelected ? `0.2cqw solid ${getLayoutColor('dropdown-bg', '#5C5898')}` : 'none',
                                                    transform: isSelected ? 'scale(1.04)' : 'scale(1)'
                                                }}
                                            >
                                                <div className="flex w-full flex-1 gap-[0.1cqw] items-center justify-center overflow-hidden">
                                                    {spread.pages.map((page, pIdx) => (
                                                        <div key={`${idx}-${pIdx}`} className="w-[48%] h-[85%] overflow-hidden bg-white shadow-sm flex items-center justify-center rounded-[0.1cqw]">
                                                            <PageThumbnail
                                                                html={page.html || page.content}
                                                                index={spread.indices[pIdx]}
                                                                scale={0.06}
                                                            />
                                                        </div>
                                                    ))}
                                                    {spread.pages.length === 1 && idx === spreads.length - 1 && (
                                                        <div className="w-[48%] h-[85%] bg-gray-50 rounded-[0.1cqw]" />
                                                    )}
                                                </div>

                                                <div className="w-full text-center mt-auto pb-[0.1cqw]">
                                                    <span 
                                                        className="text-[0.9cqw] font-medium"
                                                        style={{ color: isSelected ? getLayoutColor('dropdown-bg', '#5C5898') : '#666666' }}
                                                    >
                                                        Page {spread.indices[0] + 1}{spread.indices.length > 1 ? `-${spread.indices[1] + 1}` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {canScrollRight && (
                                <button
                                    className="w-[4cqw] h-[8cqw] flex items-center justify-center hover:scale-110 transition-all shrink-0 z-10"
                                    onClick={(e) => { e.stopPropagation(); scroll('right'); }}
                                    style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                >
                                    <Icon icon="lucide:arrow-right" className="w-[2cqw] h-[2cqw]" />
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            <div id="tablet-sound-portal" className="absolute inset-0 z-50 pointer-events-none"></div>
            <div id="tablet-download-portal" className="absolute inset-0 z-50 pointer-events-none"></div>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                isTabletLayout={true}
                currentBook={currentBook || settings}
                activeLayout={activeLayout || '9'}
            />
        </div>
    );
};

export default TabletLayout8;
