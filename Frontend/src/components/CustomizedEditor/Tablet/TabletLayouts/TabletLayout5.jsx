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

const ToolbarBtn = ({ icon, label, onClick, color }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-center p-[0.5cqw] rounded-full transition-transform hover:scale-110 active:scale-95"
        title={label}
        style={{ color: color || 'white' }}
    >
        <Icon icon={icon} className="w-[2cqw] h-[2cqw]" />
    </button>
);

const TabletLayout5 = ({
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
    const progressPercentage = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0;
    const pillBgColor = currentPage === 0 ? getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') : getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1');
    const iconColor = currentPage === 0 ? getLayoutColor('toolbar-bg', '#555555') : getLayoutColor('toolbar-text-main', '#FFFFFF');

    return (
        <div className="flex flex-col w-full h-full min-h-0 overflow-hidden font-sans relative" style={{ ...backgroundStyle, backgroundColor: 'transparent', containerType: 'size' }}>

            {/* Click-away Overlay for Search Suggestions */}
            {showSuggestions && recommendations.length > 0 && (
                <div 
                    className="absolute inset-0 z-[45] pointer-events-auto" 
                    onClick={() => setShowSuggestions(false)} 
                />
            )}

            {/* Top Navigation Area (Floating) */}
            <div className="absolute top-[2cqh] left-0 right-0 px-[2cqw] flex items-center justify-between z-50 pointer-events-none">

                {/* Search Pill */}
                <div className="w-[25cqw] pointer-events-auto">
                    {(settings?.interaction?.search ?? true) && (
                        <div
                            className="flex items-center px-[1.5cqw] py-[1cqh] rounded-[1cqw] shadow-md transition-all relative"
                            style={{ backgroundColor: currentPage === 0 ? '#FFFFFF' : getLayoutColorRgba('search-bg-v2', '221, 224, 244', '1') }}
                        >
                            <Icon
                                icon="ph:magnifying-glass-bold"
                                className="w-[1.8cqw] h-[1.8cqw]"
                                style={{ color: getLayoutColor('search-text-v1', '#9BA0C9') }}
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
                                className="bg-transparent border-0 outline-none w-full ml-[1cqw] font-medium text-[1.6cqw]"
                                style={{ color: getLayoutColor('search-text-v1', '#555555') }}
                            />
                            <AnimatePresence>
                                {showSuggestions && recommendations.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -5 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -5 }} 
                                        className="absolute top-full mt-[1cqw] left-0 w-full rounded-[1.2cqw] shadow-[0_1cqw_3cqw_rgba(0,0,0,0.1)] border z-[100] overflow-hidden pointer-events-auto"
                                        style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1'), borderColor: getLayoutColor('dropdown-text', '#555555') }}
                                    >
                                        <div className="flex flex-col py-[1.5cqw]">
                                            <div className="px-[2cqw] mb-[1cqw]">
                                                <span className="font-bold text-[1.5cqw]" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Suggestion</span>
                                            </div>
                                            {recommendations.map((rec, idx) => (
                                                <button 
                                                    key={idx} 
                                                    className="flex items-center justify-between px-[2cqw] py-[1cqw] hover:bg-black/5 transition-colors text-left group" 
                                                    onClick={(e) => { 
                                                        e.stopPropagation();
                                                        onPageClick(rec.pageNumber - 1); 
                                                        setRecommendations([]); 
                                                        setShowSuggestions(false); 
                                                        setLocalSearchQuery(rec.boldPart); 
                                                    }}
                                                >
                                                    <div className="flex-1 truncate mr-[1cqw] opacity-90 group-hover:opacity-100">
                                                        <span className="font-bold text-[1.4cqw]" style={{ color: getLayoutColor('dropdown-text', '#555555'), fontWeight: 800 }}>{rec.boldPart}</span>
                                                        <span className="text-[1.4cqw] opacity-70" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>{rec.greyPart}</span>
                                                    </div>
                                                    <span className="font-bold text-[1.4cqw] whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#555555'), opacity: 0.5 }}>Pg {rec.pageNumber}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Center Title */}
                <div className="absolute left-1/2 -translate-x-1/2 text-center max-w-[40cqw]">
                    <span
                        className="text-[2.2cqw] font-bold truncate drop-shadow-sm"
                        style={{ color: getLayoutColor('toolbar-bg', '#555555') }}
                    >
                        {/* bookName hidden */}
                    </span>
                </div>

                {/* Logo (Optional) */}
                <div className="w-[30cqw] flex justify-end">
                    {/* Empty space for balance, logo could go here if needed */}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center relative p-[4cqw] pt-[8cqh] pb-[10cqh]">

                {/* Popups */}
                {showTOC && (
                    <TabletTableOfContentsPopup
                        onClose={() => setShowTOCMemo(false)}
                        onNavigate={onPageClick}
                        settings={settings}
                        variant="layout5"
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

                {/* Left Navigation Arrow */}
                <button
                    onClick={() => bookRef?.current?.pageFlip()?.flipPrev()}
                    className={`absolute left-[4cqw] w-[5cqw] h-[5cqw] flex items-center justify-center transition-all z-10 ${currentPage === 0 ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100 hover:scale-110 cursor-pointer'}`}
                    style={{ color: getLayoutColor('toolbar-bg', '#555555') }}
                    disabled={currentPage === 0}
                >
                    <Icon icon="ph:caret-left" className="w-[4cqw] h-[4cqw]" />
                </button>

                {/* The Actual Book Content */}
                <div 
                    className="w-full h-full flex items-center justify-center z-0 relative"
                    style={{ transform: `translateX(${offset}px)`, transition: 'transform 0.5s ease-out' }}
                >
                    {children}
                </div>

                {/* Right Navigation Arrow */}
                <button
                    onClick={() => bookRef?.current?.pageFlip()?.flipNext()}
                    className={`absolute right-[4cqw] w-[5cqw] h-[5cqw] flex items-center justify-center transition-all z-10 ${currentPage >= pagesCount - 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100 hover:scale-110 cursor-pointer'}`}
                    style={{ color: getLayoutColor('toolbar-bg', '#555555') }}
                    disabled={currentPage >= pagesCount - 1}
                >
                    <Icon icon="ph:caret-right" className="w-[4cqw] h-[4cqw]" />
                </button>
            </div>

            {/* Bottom Floating Pill Bar */}
            <div className="absolute bottom-[2cqh] left-0 right-0 px-[2cqw] flex items-center justify-between z-50 pointer-events-none">

                {/* Page Pill */}
                <div className="pointer-events-auto">
                    {(settings?.navigation?.pageQuickAccess ?? true) && (
                        <div
                            className="rounded-full flex items-center px-[1.5cqw] py-[0.8cqh] shadow-md border border-white/10"
                            style={{ backgroundColor: pillBgColor }}
                        >
                            <span className="text-[1.6cqw] font-bold whitespace-nowrap flex items-center" style={{ color: iconColor }}>
                                Page: 
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
                                    className="mx-[0.5cqw] w-[3cqw] text-center bg-transparent outline-none border-none"
                                    style={{ color: iconColor }}
                                /> 
                                / {totalPages}
                            </span>
                        </div>
                    )}
                </div>

                {/* Center Long Strip */}
                <div
                    className="flex-1 max-w-[65cqw] mx-[2cqw] rounded-full flex items-center px-[2cqw] py-[0.5cqh] shadow-lg border border-white/10 pointer-events-auto"
                    style={{ backgroundColor: getLayoutColorRgba('bottom-toolbar-bg', '87, 92, 156', '1') }}
                >
                    {/* Playback Controls */}
                    <div className="flex items-center gap-[1cqw] mr-[2cqw] shrink-0">
                        <ToolbarBtn icon="ph:skip-back" onClick={() => onPageClick(0)} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                        <ToolbarBtn icon={isAutoFlipping ? 'ph:pause-fill' : 'ph:play-fill'} onClick={() => setIsPlaying?.(!isAutoFlipping)} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                        <ToolbarBtn icon="ph:skip-forward" onClick={() => onPageClick(pagesCount - 1)} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 h-[0.5cqh] rounded-full bg-white/30 relative mr-[2cqw] cursor-pointer" onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                        const targetPage = Math.floor(percentage * (pagesCount - 1));
                        onPageClick(targetPage);
                    }}>
                        <div
                            className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 z-10"
                            style={{ width: `${progressPercentage}%`, backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        />
                    </div>

                    {/* Tools Icons */}
                    <div className="flex items-center gap-[1cqw] shrink-0">
                        {(settings?.navigation?.tableOfContents ?? true) && (
                            <ToolbarBtn icon="fluent:text-bullet-list-24-filled" onClick={() => setShowTOCMemo(!showTOC)} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                        )}
                        {(settings?.navigation?.pageThumbnails ?? true) && (
                            <ToolbarBtn icon="ph:squares-four-fill" onClick={() => setShowThumbnailBarMemo(!showThumbnailBar)} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                        )}
                        {(settings?.interaction?.gallery ?? true) && (
                            <ToolbarBtn icon="clarity:image-gallery-solid" onClick={() => setShowGalleryPopupMemo(!showGalleryPopup)} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                        )}
                        {(settings?.media?.backgroundAudio ?? true) && (
                            <ToolbarBtn icon={isMuted ? "solar:music-notes-bold-duotone" : "solar:music-notes-bold"} onClick={(e) => { e.stopPropagation(); setShowSoundPopupMemo?.(!showSoundPopup); }} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                        )}
                        {(settings?.brandingProfile?.profile ?? true) && (
                            <ToolbarBtn icon="fluent:person-24-filled" onClick={() => setShowProfilePopup(!showProfilePopup)} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
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
                            }} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                        )}
                        {(settings?.shareExport?.download ?? true) && (
                            <ToolbarBtn icon="meteor-icons:download" onClick={() => setShowExportPopupMemo?.(true)} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                        )}
                        {(settings?.viewing?.fullScreen ?? true) && (
                            <ToolbarBtn icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} onClick={handleFullScreen} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                        )}
                    </div>
                </div>

                {/* Zoom Box */}
                <div className="pointer-events-auto">
                    {(settings?.viewing?.zoom ?? true) && (
                        <div
                            className="rounded-full flex items-center gap-[1cqw] px-[1.5cqw] py-[0.8cqh] shadow-md border border-white/10"
                            style={{ backgroundColor: pillBgColor }}
                        >
                            <button onClick={() => setCurrentZoom?.(Math.max(0.5, (currentZoom || 1) - 0.1))} className="hover:scale-110 active:scale-95">
                                <Icon icon="ph:magnifying-glass-minus-bold" className="w-[1.6cqw] h-[1.6cqw]" style={{ color: iconColor }} />
                            </button>
                            <span className="text-[1.5cqw] font-bold select-none min-w-[4cqw] text-center" style={{ color: iconColor }}>
                                {Math.round((currentZoom || 1) * 100)}%
                            </span>
                            <button onClick={() => setCurrentZoom?.(Math.min(3, (currentZoom || 1) + 0.1))} className="hover:scale-110 active:scale-95">
                                <Icon icon="ph:magnifying-glass-plus-bold" className="w-[1.6cqw] h-[1.6cqw]" style={{ color: iconColor }} />
                            </button>
                            <button
                                onClick={() => setCurrentZoom?.(1)}
                                className="text-[1.4cqw] font-bold px-[1cqw] py-[0.5cqh] rounded-full shadow-sm"
                                style={{
                                    backgroundColor: getLayoutColor('toolbar-bg', '#555555'),
                                    color: '#FFFFFF'
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── THUMBNAIL BAR ── Exact Match to Screenshot */}
            {showThumbnailBar && (
                <>
                    {/* Main Container - Rounded Capsule */}
                    <div
                        className={`absolute z-[150] bottom-[11cqh] left-1/2 -translate-x-1/2 w-fit max-w-[75cqw] ${spreads.length === 1 ? 'rounded-[1.2cqw]' : 'rounded-full'} shadow-lg flex items-center border overflow-hidden`}
                        style={{
                            backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1'),
                            borderColor: getLayoutColor('dropdown-text', '#555555')
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={`w-full h-full flex items-center ${canScrollLeft ? 'pl-[1cqw]' : 'pl-[2cqw]'} ${canScrollRight ? 'pr-[1cqw]' : 'pr-[2cqw]'}`}
                            style={{ backgroundColor: 'transparent' }}
                        >
                            {/* Left Navigation */}
                            {canScrollLeft && (
                                <button
                                    className="w-[4cqw] h-[8cqw] flex items-center justify-center hover:scale-110 transition-all shrink-0"
                                    onClick={(e) => { e.stopPropagation(); scroll('left'); }}
                                    style={{ color: getLayoutColor('dropdown-text', '#555555') }}
                                >
                                    <Icon icon="ph:caret-left" className="w-[1.8cqw] h-[1.8cqw]" />
                                </button>
                            )}

                            {/* Thumbnails Container */}
                            <div
                                ref={scrollRef}
                                onScroll={checkScroll}
                                className="shrink flex overflow-x-hidden no-scrollbar scroll-smooth items-center h-[8cqw] max-w-[60cqw] gap-[1cqw] px-[0.5cqw] py-[0.5cqw]"
                            >
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);

                                    return (
                                        <div
                                            key={idx}
                                            className="thumbnail-item relative flex flex-col items-center shrink-0 cursor-pointer transition-all duration-300 group"
                                            style={{ width: '9cqw' }}
                                            onClick={() => {
                                                if (bookRef?.current?.pageFlip) {
                                                    bookRef.current.pageFlip().turnToPage(spread.indices[0]);
                                                } else if (onPageClick) {
                                                    onPageClick(spread.indices[0]);
                                                }
                                                setShowThumbnailBarMemo(false);
                                            }}
                                        >
                                            {/* Thumbnail Container with Theme-based Border */}
                                            <div
                                                className="w-full h-[6cqw] bg-white border-[1.2px] transition-all rounded-[0.2cqw] overflow-hidden relative"
                                                style={{
                                                    borderColor: getLayoutColor('dropdown-text', '#555555')
                                                }}
                                            >
                                                <div className="flex w-full h-full gap-0 bg-white justify-center relative">
                                                    {spread.pages.map((page, pIdx) => {
                                                        return (
                                                            <div key={`${idx}-${pIdx}`} className="flex-1 max-w-[50%] bg-white overflow-hidden relative flex items-center justify-center border-r border-black/10 last:border-r-0">
                                                                <PageThumbnail
                                                                    html={page.html || page.content}
                                                                    index={spread.indices[pIdx]}
                                                                    scale={0.08}
                                                                />
                                                                {/* Simple Page Fold/Curl Effect for Visual Match */}
                                                                {pIdx === 1 && (
                                                                    <div className="absolute top-0 right-0 w-[1cqw] h-[1cqw] bg-white shadow-[-1px_1px_2px_rgba(0,0,0,0.1)] z-10"
                                                                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)', transform: 'rotate(180deg)' }} />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Selected Overlay - Fixed Dark Shade with White Text */}
                                                {isSelected && (
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-[0.5px]"
                                                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                                                    >
                                                        <span className="text-white text-[1.2cqw] font-semibold whitespace-nowrap">
                                                            Page {spread.indices[0] + 1} / {totalPages}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right Navigation */}
                            {canScrollRight && (
                                <button
                                    className="w-[4cqw] h-[8cqw] flex items-center justify-center hover:scale-110 transition-all shrink-0"
                                    onClick={(e) => { e.stopPropagation(); scroll('right'); }}
                                    style={{ color: getLayoutColor('dropdown-text', '#555555') }}
                                >
                                    <Icon icon="ph:caret-right" className="w-[1.8cqw] h-[1.8cqw]" />
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
                activeLayout={activeLayout || '5'}
            />
        </div>
    );
};

export default TabletLayout5;
