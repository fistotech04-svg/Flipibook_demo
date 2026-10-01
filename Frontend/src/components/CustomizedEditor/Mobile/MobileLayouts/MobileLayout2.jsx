import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const Grid2Layout = lazy(() => import('../../Layouts/Grid2Layout'));






import Sound from '../../popups/Sound';
import Export from '../../popups/Export';
import FlipbookSharePopup from '../../popups/FlipbookSharePopup';
import TableOfContentsPopup from '../../popups/TableOfContentsPopup';

// Color helper utilities
const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;
const getLayoutColorAlpha = (id, defaultRgb, defaultOpacity) => `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

// Page Thumbnail component for the dial and bar
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
                    body { margin: 0; padding: 0; overflow: hidden; background: white; width: 400px; height: 566px; position: relative; }
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

// Menu Button for dropdowns
const MenuBtn = ({ icon, label, onClick }) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onClick(e);
        }}
        className="flex items-center gap-2 w-full px-2.5 py-1.5 hover:bg-white/10 active:bg-white/20 transition-all rounded-lg group whitespace-nowrap"
    >
        <Icon icon={icon} className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform" />
        <span className="text-white text-[11.5px] font-semibold">{label}</span>
    </button>
);

// Toolbar Icon Button
const ToolbarIcon = ({ icon, onClick, active = false, className = "", title }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    return (
        <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onTouchStart={() => setShowTooltip(true)}
            onTouchEnd={() => setShowTooltip(false)}
            onClick={(e) => {
                setShowTooltip(false);
                e.stopPropagation();
                onClick(e);
            }}
            className={`relative p-1.5 rounded-lg transition-all active:scale-90 ${active ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white'} ${className}`}
        >
            <Icon icon={icon} className="w-4.5 h-4.5" />
            <AnimatePresence>
                {showTooltip && title && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap"
                        style={{
                            background: 'rgba(10, 10, 12, 0.55)',
                            backdropFilter: 'blur(30px)',
                            WebkitBackdropFilter: 'blur(30px)',
                            transform: 'translateZ(0)',
                            isolation: 'isolate',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#ffffff',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                            pointerEvents: 'none',
                            zIndex: 9999,
                        }}
                    >
                        {title}
                        <div
                            className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-l-[5px] border-r-[5px] border-b-[6px]"
                            style={{ borderBottomColor: 'rgba(10, 10, 12, 0.55)' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
};

const BottomControlBtn = ({ icon, onClick, title, iconClass }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    return (
        <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onTouchStart={() => setShowTooltip(true)}
            onTouchEnd={() => setShowTooltip(false)}
            onClick={(e) => {
                setShowTooltip(false);
                if (onClick) onClick(e);
            }}
            className="relative active:scale-90 transition-transform"
        >
            <Icon icon={icon} className={iconClass || "w-4.5 h-4.5"} />
            <AnimatePresence>
                {showTooltip && title && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap"
                        style={{
                            background: 'rgba(10, 10, 12, 0.55)',
                            backdropFilter: 'blur(30px)',
                            WebkitBackdropFilter: 'blur(30px)',
                            transform: 'translateZ(0)',
                            isolation: 'isolate',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#ffffff',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                            pointerEvents: 'none',
                            zIndex: 9999,
                        }}
                    >
                        {title}
                        <div
                            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-l-[5px] border-r-[5px] border-t-[6px]"
                            style={{ borderTopColor: 'rgba(10, 10, 12, 0.55)' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
};

const MobileLayout2 = (props) => {
    const {
        children,
        settings,
        bookName,
        activeLayout,
        searchQuery,
        setSearchQuery,
        handleQuickSearch,
        onPageClick,
        currentPage,
        pages = [],
        bookRef,
        showBookmarkMenu,
        setShowBookmarkMenu,
        showThumbnailBar,
        setShowThumbnailBar,
        showTOC,
        setShowTOC,
        setShowAddNotesPopup,
        showAddNotesPopup,
        onAddNote,
        setShowAddBookmarkPopup,
        showAddBookmarkPopup,
        onAddBookmark,
        bookmarkSettings,
        setShowNotesViewer,
        showNotesViewer,
        notes,
        setShowViewBookmarkPopup,
        showViewBookmarkPopup,
        bookmarks,
        onDeleteBookmark,
        onUpdateBookmark,
        setShowProfilePopup,
        showProfilePopup,
        profileSettings,
        isAutoFlipping,
        setIsPlaying,
        handleFullScreen,
        handleShare,
        handleDownload,
        showSoundPopup,
        setShowSoundPopup,
        otherSetupSettings,
        onUpdateOtherSetup,
        isMuted,
        setIsMuted,
        isFlipMuted,
        setIsFlipMuted,
        flipTrigger,
        showExportPopup,
        setShowExportPopup,
        showSharePopup,
        setShowSharePopup,
        showNotesMenu,
        setShowNotesMenu,
        isLandscape,
        layoutColors = [],
        tocSettings
    } = props;
    // Local State
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showRadialThumbnails, setShowRadialThumbnails] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [radialScroll, setRadialScroll] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Local-only menu state — isolated from shared PreviewArea state to prevent
    // MobileLayout1's hamburger from triggering this layout's menu simultaneously.
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const scrollRef = useRef(null);

    // Memoized Spreads for thumbnails
    const spreads = useMemo(() => {
        const result = [];
        if (pages && pages.length > 0) {
            result.push({ pages: [pages[0]], indices: [0], label: "Page 1" });
            for (let i = 1; i < pages.length; i += 2) {
                const indices = [i];
                const spreadPages = [pages[i]];
                if (i + 1 < pages.length) {
                    indices.push(i + 1);
                    spreadPages.push(pages[i + 1]);
                }
                result.push({
                    pages: spreadPages,
                    indices,
                    label: indices.length > 1 ? `Page ${indices[0] + 1}-${indices[1] + 1}` : `Page ${indices[0] + 1}`
                });
            }
        }
        return result;
    }, [pages]);

    const activeSpreadIdx = useMemo(() => {
        return spreads.findIndex(s => s.indices.includes(currentPage));
    }, [spreads, currentPage]);

    // Handle Radial Dial Auto-rotation
    useEffect(() => {
        if (activeSpreadIdx !== -1 && showRadialThumbnails) {
            const spacing = spreads.length > 1 ? Math.min(22, 160 / (spreads.length - 1)) : 22;
            const totalSpan = (spreads.length - 1) * spacing;
            const targetAngle = (activeSpreadIdx * spacing) - (totalSpan / 2);
            setRadialScroll(-targetAngle);
        }
    }, [activeSpreadIdx, spreads.length, showRadialThumbnails]);

    const handleRadialWheel = (e) => {
        e.stopPropagation();
        setRadialScroll(prev => prev + (e.deltaY * -0.12));
    };

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 5);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
        }
    };

    useEffect(() => {
        if (showThumbnailBar) {
            const timer = setTimeout(checkScroll, 100);
            return () => clearTimeout(timer);
        }
    }, [showThumbnailBar, spreads]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const amount = 200;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -amount : amount,
                behavior: 'smooth'
            });
        }
    };

    // Shared Search Logic
    const handleSearchChange = (val) => {
        setLocalSearchQuery(val);
        setShowSuggestions(true);
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
    };

    const handleSearchSubmit = () => {
        setSearchQuery(localSearchQuery);
        handleQuickSearch(localSearchQuery);
        setRecommendations([]);
        setShowSuggestions(false);
    };

    // Shared Popups Layer
    const renderPopups = () => (
        <div className="fixed inset-0 pointer-events-none z-[5000]">
            <AnimatePresence>
                {/* TOC Popup */}
                {showTOC && !isLandscape && (
                    <TableOfContentsPopup
                        onClose={() => setShowTOC(false)}
                        onNavigate={(pageIdx) => {
                            onPageClick(pageIdx);
                            setShowTOC(false);
                        }}
                        contents={tocSettings?.content || settings?.tocSettings?.content || []}
                        settings={tocSettings || settings?.tocSettings}
                        isMobile={true}
                        isLandscape={false}
                        activeLayout={2}
                        layoutColors={layoutColors}
                    />
                )}

                {/* More Menu Dropdown */}
                {showMoreMenu && (
                    <>
                        <div className="fixed inset-0 bg-transparent z-[150] pointer-events-auto" onClick={() => setShowMoreMenu(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: isLandscape ? 20 : -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: isLandscape ? 20 : -20 }}
                            className={`fixed ${isLandscape ? 'bottom-14 right-8' : 'top-16 right-4'} w-[220px] rounded-2xl shadow-2xl z-[160] overflow-hidden border border-white/20 bg-[#575C9C]/95 backdrop-blur-xl pointer-events-auto`}
                        >
                            <div className="flex flex-col p-2 gap-1">
                                <MenuBtn icon="ph:list-bold" label="Table of Contents" onClick={() => setShowTOC(true)} />
                                {settings?.interaction?.gallery !== false && (
                                    <MenuBtn icon="clarity:image-gallery-solid" label="Gallery" onClick={() => { setShowMoreMenu(false); props.setShowGalleryPopup?.(true); }} />
                                )}
                                <MenuBtn icon="ph:squares-four-fill" label="Thumbnails" onClick={() => setShowThumbnailBar(true)} />
                                <MenuBtn icon="ph:file-plus-fill" label="Add Notes" onClick={() => setShowAddNotesPopup(true)} />
                                <MenuBtn icon="ph:eye-fill" label="View Notes" onClick={() => setShowNotesViewer(true)} />
                                <MenuBtn icon="ph:bookmark-simple-bold" label="Add Bookmark" onClick={() => setShowAddBookmarkPopup(true)} />
                                <MenuBtn icon="ph:bookmark-simple-fill" label="View Bookmarks" onClick={() => setShowViewBookmarkPopup(true)} />
                                <MenuBtn icon="ph:user-fill" label="Profile" onClick={() => setShowProfilePopup(true)} />
                                 {(settings?.media?.backgroundAudio ?? true) && (
                                     <MenuBtn icon="ph:music-notes-simple-bold" label="Background Music" onClick={() => setShowSoundPopup(true)} />
                                 )}
                                <div className="h-[1px] bg-white/20 my-1.5 mx-2" />
                                <MenuBtn icon="ph:share-network-fill" label="Share Flipbook" onClick={() => handleShare()} />
                                <MenuBtn icon="ph:download-fill" label="Download PDF" onClick={() => handleDownload()} />
                                <MenuBtn icon="ph:corners-out-bold" label="Fullscreen View" onClick={() => handleFullScreen()} />
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Thumbnail Bar (Bottom Slide) */}
                {showThumbnailBar && (
                    <>
                        <div className="fixed inset-0 bg-black/40 z-[100] pointer-events-auto backdrop-blur-sm" onClick={() => setShowThumbnailBar(false)} />
                        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed bottom-0 left-0 right-0 z-[110] px-2 pb-2 pointer-events-auto">
                            <div className="rounded-2xl overflow-hidden flex items-center h-[80px] relative px-1 shadow-2xl border border-white/20 bg-[#575C9C]/95 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
                                <button className={`shrink-0 w-8 h-full flex items-center justify-center text-white transition-opacity ${!canScrollLeft ? 'opacity-20 cursor-default' : 'opacity-100'}`} onClick={() => scroll('left')}><Icon icon="lucide:chevron-left" className="w-5 h-5" /></button>
                                <div ref={scrollRef} onScroll={checkScroll} className="flex-1 flex overflow-x-auto no-scrollbar gap-2 px-1 items-center h-full scroll-smooth">
                                    {spreads.map((spread, idx) => {
                                        const isSelected = spread.indices.includes(currentPage);
                                        return (
                                            <div key={idx} className={`shrink-0 flex flex-col items-center gap-1 p-1 rounded-lg transition-all ${isSelected ? 'bg-white/20 ring-1 ring-white/50' : 'hover:bg-white/5'}`} onClick={() => onPageClick(spread.indices[0])}>
                                                <div className="bg-white rounded-sm overflow-hidden shadow-sm flex gap-[1px]" style={{ width: '60px', height: '45px' }}>
                                                    {spread.pages.map((page, pIdx) => (<div key={pIdx} className="flex-1 h-full overflow-hidden"><PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={isSelected ? 0.12 : 0.1} /></div>))}
                                                </div>
                                                <span className="text-[8px] font-bold text-white/90 truncate w-14 text-center">{spread.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button className={`shrink-0 w-8 h-full flex items-center justify-center text-white transition-opacity ${!canScrollRight ? 'opacity-20 cursor-default' : 'opacity-100'}`} onClick={() => scroll('right')}><Icon icon="lucide:chevron-right" className="w-5 h-5" /></button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Global Popups (Modals) */}
            {showAddBookmarkPopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    
                </div>
            )}
            {showAddNotesPopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    
                </div>
            )}
            {showNotesViewer && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    
                </div>
            )}
            {showViewBookmarkPopup && (
                <div className="absolute inset-0 z-[3000] pointer-events-auto">
                    
                </div>
            )}


            {showExportPopup && (
                <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 pointer-events-auto">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowExportPopup(false)} />
                    <div className="relative z-[4001] w-full max-w-[300px]">
                        <Export isOpen={true} hideButton={true} onClose={() => setShowExportPopup(false)} pages={pages} bookName={bookName} isMobile={true} isLandscape={isLandscape} currentPage={currentPage} />
                    </div>
                </div>
            )}
            {showSharePopup && (
                <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 pointer-events-auto">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSharePopup(false)} />
                    <div className="relative z-[4001] w-full max-w-[300px]">
                        <FlipbookSharePopup
                    onClose={() => setShowSharePopup(false)}
                    bookName={props.currentBook?.flipbookName || bookName}
                    url={props.currentBook?.shareUrl || window.location.href}
                    isPublished={props.currentBook?.status === 'Published'}
                    isMobile={true}
                    isLandscape={isLandscape}
                />
                    </div>
                </div>
            )}
        </div>
    );

    // LANDSCAPE VIEW (Desktop-like Scaling)
    if (isLandscape) {
        return (
            <div className="w-full h-full overflow-hidden bg-[#DADBE8]">
                <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center bg-[#DADBE8]">
                        <div className="flex flex-col items-center gap-3">
                            <Icon icon="lucide:loader-2" className="w-8 h-8 text-[#575C9C] animate-spin" />
                            <span className="text-[#575C9C] text-sm font-bold">Scaling Layout...</span>
                        </div>
                    </div>
                }>
                    <Grid2Layout
                        {...props}
                        isMobile={false}
                        isMobileLandscape={true}
                        pagesCount={pages?.length || 0}
                        setShowAddNotesPopupMemo={props.setShowAddNotesPopup || setShowAddNotesPopup}
                        setShowAddBookmarkPopupMemo={props.setShowAddBookmarkPopup || setShowAddBookmarkPopup}
                        setShowNotesViewerMemo={props.setShowNotesViewer || setShowNotesViewer}
                        setShowThumbnailBarMemo={props.setShowThumbnailBar || setShowThumbnailBar}
                        setShowTOCMemo={props.setShowTOC || setShowTOC}
                        showSoundPopup={props.showSoundPopup || showSoundPopup}
                        setShowSoundPopupMemo={props.setShowSoundPopup || setShowSoundPopup}
                        setShowProfilePopup={props.setShowProfilePopup || setShowProfilePopup}
                        setShowExportPopup={props.setShowExportPopup || setShowExportPopup}
                        setShowSharePopup={props.setShowSharePopup || setShowSharePopup}
                    />
                </Suspense>
            </div>
        );
    }

    // PORTRAIT VIEW (Mobile-centric)
    const isPhysicalMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden select-none relative" style={{ backgroundColor: props.backgroundSettings?.color || '#BDC3D9' }}>
            <div className="absolute inset-0 z-0" style={props.backgroundStyle} />
            <div className="flex flex-col h-full w-full z-10 relative pointer-events-none">
                <div className="pointer-events-auto flex flex-col h-full w-full">
            {/* Notch Spacer - fills the area near the hardware notch with a dark status bar color */}
            {!isPhysicalMobile && <div className="h-10 w-full shrink-0 z-50 bg-[#0B0F4E]" />}
            <header className="z-40 bg-[#4B528C] shadow-md border-b border-white/10">
                <div className="px-5 pt-3 pb-2 flex items-center justify-start">
                    <div className="w-[70%] max-w-[240px] h-7.5 bg-white/80 rounded-full flex items-center px-3 gap-1.5 relative">
                        <Icon icon="ph:magnifying-glass-bold" className="text-[#575C9C] w-3 h-3" />
                        <input
                            type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                            placeholder="Quick Search..."
                            className="bg-transparent text-[#575C9C] placeholder-[#575C9C]/70 text-[11px] outline-none w-full font-semibold"
                            value={localSearchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                        />
                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                                    {recommendations.map((rec, idx) => (
                                        <button
                                            key={idx}
                                            className="flex items-center justify-between w-full px-3 py-1.8 hover:bg-gray-50 text-[#575C9C] border-b border-gray-50 last:border-0 transition-colors"
                                            onClick={() => {
                                                onPageClick(rec.pageNumber - 1);
                                                const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                setLocalSearchQuery(fullQuery);
                                                setSearchQuery(fullQuery);
                                                setRecommendations([]);
                                                setShowSuggestions(false);
                                            }}
                                        >
                                            <div className="flex flex-col items-start overflow-hidden flex-1 mr-2">
                                                <div className="truncate w-full text-left">
                                                    <span className="text-[10.5px] font-bold mr-1.5">{rec.word}</span>
                                                    {rec.context && <span className="text-[9.5px] font-medium opacity-60 italic">{rec.context}</span>}
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-bold opacity-40 tabular-nums">P.{rec.pageNumber < 10 ? `0${rec.pageNumber}` : rec.pageNumber}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Secondary Icon Toolbar */}
                <div className="px-4 py-2 flex items-center justify-between text-white/80 border-t border-white/5">
                    <ToolbarIcon
                        icon="mdi:table-of-contents"
                        title="TOC"
                        onClick={() => {
                            const next = !showTOC;
                            if (setShowTOC) setShowTOC(next);
                            if (next) {
                                setShowRadialThumbnails(false);
                                setShowNotesMenu(false);
                                setShowBookmarkMenu(false);
                                if (setShowThumbnailBar) setShowThumbnailBar(false);
                            }
                        }}
                        active={showTOC}
                        className="!p-1.5"
                    />
                    <ToolbarIcon
                        icon="ep:menu"
                        title="Thumbnails"
                        onClick={() => {
                            const next = !showRadialThumbnails;
                            setShowRadialThumbnails(next);
                            if (next) {
                                if (setShowTOC) setShowTOC(false);
                                setShowNotesMenu(false);
                                setShowBookmarkMenu(false);
                                if (setShowThumbnailBar) setShowThumbnailBar(false);
                            }
                        }}
                        active={showRadialThumbnails}
                        className="!p-1.5"
                    />

                    <ToolbarIcon
                        icon="clarity:image-gallery-solid"
                        title="Gallery"
                        onClick={() => {
                            props.setShowGalleryPopup?.(true);
                        }}
                        active={false}
                        className="!p-1.5"
                    />

                    <ToolbarIcon
                        icon="solar:user-bold"
                        title="Profile"
                        onClick={() => {
                            setShowProfilePopup(true);
                            if (setShowTOC) setShowTOC(false);
                            setShowRadialThumbnails(false);
                            setShowNotesMenu(false);
                            setShowBookmarkMenu(false);
                            if (setShowThumbnailBar) setShowThumbnailBar(false);
                        }}
                        active={showProfilePopup}
                        className="!p-1.5"
                    />
                    <ToolbarIcon icon="mage:share-fill" title="Share" onClick={() => handleShare()} className="!p-1.5" />
                    <ToolbarIcon icon="meteor-icons:download" title="Download" onClick={() => handleDownload()} className="!p-1.5" />
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {/* Navigation Arrows */}
                <button onClick={() => onPageClick(Math.max(0, currentPage - 1))} className="absolute left-2 p-3 z-30 text-[#4B528C]/40 active:scale-75 transition-all"><Icon icon="ph:caret-left-bold" className="w-8 h-8" /></button>
                <button onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))} className="absolute right-2 p-3 z-30 text-[#4B528C]/40 active:scale-75 transition-all"><Icon icon="ph:caret-right-bold" className="w-8 h-8" /></button>

                {/* Page Content - Scaled down to look better on mobile */}
                <div className="flex items-center justify-center w-full px-10">
                    <div className="relative transition-transform duration-300" style={{ transform: 'scale(1.2)', transformOrigin: 'center center' }}>
                        {children}
                    </div>
                </div>



                {/* Radial Navigation Dial overlay */}
                <div className="absolute top-0 left-0 right-0 z-20 h-0 overflow-visible pointer-events-none">
                    <AnimatePresence>
                        {showRadialThumbnails && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="relative w-full h-[220px] flex justify-center pointer-events-auto touch-none cursor-grab active:cursor-grabbing"
                                onWheel={handleRadialWheel}
                                onPan={(e, info) => {
                                    setRadialScroll(prev => prev + (info.delta.x * 0.4));
                                }}
                            >
                                <div className="absolute top-[10px] left-0 right-0 flex justify-center pointer-events-none">
                                    <div className="relative w-[380px] pointer-events-auto">
                                        <svg viewBox="0 0 379 220" className="overflow-visible">
                                            <circle cx="189.5" cy="0" r="175" fill="none" stroke="#575C9C" strokeWidth="75" strokeOpacity="0.08" />
                                            <g style={{ transformOrigin: '189.5px 0px', transform: `rotate(${radialScroll}deg)`, transition: 'transform 0.7s cubic-bezier(0.15, 0.85, 0.35, 1)' }}>
                                                {spreads.map((spread, idx) => {
                                                    const isActive = spread.indices.includes(currentPage) || hoveredIdx === idx;
                                                    const spacing = spreads.length > 1 ? Math.min(22, 160 / (spreads.length - 1)) : 22;
                                                    const totalSpan = (spreads.length - 1) * spacing;
                                                    const angle = (idx * spacing) - (totalSpan / 2);
                                                    return (
                                                        <g key={idx} style={{ transformOrigin: '189.5px 0.5px', transform: `rotate(${angle}deg) translateY(8px) scale(${hoveredIdx === idx ? 1.4 : 1.35}, ${hoveredIdx === idx ? 1.05 : 1})`, transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)} onClick={() => onPageClick(spread.indices[0])}>
                                                            <path d="M162.5 181.3C158.7 180.7 156.3 177 157.3 173.3L163.5 149C164.3 145.9 167.2 143.9 170.4 144.1C180.2 144.8 187.4 144.9 197.2 144.4C200.5 144.3 203.5 146.6 204 149.8L208.3 175C209 178.7 206.3 182.2 202.6 182.5C188.3 183.8 178.4 183.6 162.5 181.3Z" fill={isActive ? getLayoutColor('dropdown-bg', '#575C9C') : getLayoutColorAlpha('dropdown-bg', '87, 92, 156', 0.8)} style={{ transform: 'scaleY(1.4)', transformOrigin: '183.5px 164px' }} />
                                                            <text
                                                                x="183.5"
                                                                y="164"
                                                                fill={getLayoutColor('dropdown-text', 'white')}
                                                                fontSize="7.5"
                                                                fontWeight="700"
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                                style={{ transition: 'transform 0.7s cubic-bezier(0.15, 0.85, 0.35, 1)' }}
                                                            >
                                                                {spread.label}
                                                            </text>
                                                        </g>
                                                    );
                                                })}
                                            </g>
                                        </svg>
                                        {/* Center Preview */}
                                        {(() => {
                                            const preview = hoveredIdx !== null ? spreads[hoveredIdx] : spreads[activeSpreadIdx];
                                            if (!preview) return null;
                                            return (
                                                <div className="absolute top-[0px] left-0 right-0 flex flex-col items-center">
                                                    <div className="w-28 h-20 bg-white rounded-lg p-1.5 flex gap-1 border border-gray-200 shadow-lg">
                                                        {preview.pages.map((p, i) => <div key={i} className="flex-1 h-full bg-gray-50 overflow-hidden"><PageThumbnail html={p?.html || p?.content} index={preview.indices[i]} scale={0.15} /></div>)}
                                                    </div>
                                                    <div className="w-3 h-3 bg-white rotate-45 -translate-y-1.5 border-b border-r border-gray-200" />
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer: Progress and Playback Controls */}
            <footer className="z-40 bg-[#4B528C] px-6 pt-3 pb-6 flex flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]">
                {/* Slider-style Progress Bar */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-center items-center text-[9px] text-white/60 font-black tracking-widest tabular-nums">
                        <div className="flex gap-1.5 flex-wrap justify-center px-4">
                            {[...Array(pages.length)].map((_, i) => (
                                <div
                                    key={i}
                                    onClick={() => onPageClick(i)}
                                    className={`w-1 h-1 rounded-full cursor-pointer transition-all ${currentPage >= i ? 'bg-white scale-110' : 'bg-white/20 hover:bg-white/40'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Control Row */}
                <div className="flex items-center justify-between text-white">
                    {/* Music Icon on Left */}
                    {(settings?.media?.backgroundAudio ?? true) && (
                        <BottomControlBtn title="Music" onClick={(e) => { e.stopPropagation(); setShowSoundPopup(true); }} icon="solar:music-notes-bold" iconClass="w-4.5 h-4.5" />
                    )}

                    {/* Centered Playback */}
                    <div className="flex items-center gap-10">
                        <BottomControlBtn title="First Page" onClick={() => onPageClick(Math.max(0, currentPage - 1))} icon="ph:skip-back-fill" iconClass="w-4.5 h-4.5" />
                        <BottomControlBtn title={isAutoFlipping ? "Pause" : "Play"} onClick={() => setIsPlaying(!isAutoFlipping)} icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} iconClass="w-5.5 h-5.5" />
                        <BottomControlBtn title="Last Page" onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))} icon="ph:skip-forward-fill" iconClass="w-4.5 h-4.5" />
                    </div>

                    {/* Fullscreen Icon on Right */}
                    <BottomControlBtn title="Full Screen" onClick={handleFullScreen} icon="lucide:fullscreen" iconClass="w-4.5 h-4.5" />
                </div>
            </footer>

            {/* Popups Layer */}
            {renderPopups()}
                </div>
            </div>
        </div>
    );
};

export default MobileLayout2;
