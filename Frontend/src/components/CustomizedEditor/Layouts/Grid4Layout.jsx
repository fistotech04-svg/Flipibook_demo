import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import MobileLayout1 from '../Mobile/MobileLayouts/MobileLayout1';

const PageThumbnail = React.memo(({ html, index, scale = 0.15, baseWidth = 400, baseHeight = 566 }) => {
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
                        width: ${baseWidth}px; 
                        height: ${baseHeight}px; 
                        position: relative;
                    }
                    * { box-sizing: border-box; }
                    ::-webkit-scrollbar { width: 0px; background: transparent; }
                    img { max-width: 100%; height: auto; display: block; }
                </style>
            </head>
            <body>
                 <div style="width: ${baseWidth}px; height: ${baseHeight}px; overflow: hidden; position: relative; background: white;">
                    ${cleanHtml}
                </div>
            </body>
        </html>
    `;

    return (
        <div className="w-full h-full relative overflow-hidden bg-white">
            <div className="absolute left-1/2 top-1/2" style={{ transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center center' }}>
                <iframe
                    className="border-none pointer-events-none"
                    srcDoc={srcDoc}
                    title={`Thumb ${index}`}
                    loading="lazy"
                    style={{
                        width: `${baseWidth}px`,
                        height: `${baseHeight}px`,
                        backgroundColor: 'white'
                    }}
                />
            </div>
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

const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
    `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
};

const getShade = (hex, weight = 0.6) => {
    if (!hex || hex === 'transparent' || !hex.startsWith('#')) return hex;
    let c = hex.substring(1).toUpperCase();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return hex;
    let r = parseInt(c.slice(0, 2), 16);
    let g = parseInt(c.slice(2, 4), 16);
    let b = parseInt(c.slice(4, 6), 16);
    r = Math.round(r * (1 - weight));
    g = Math.round(g * (1 - weight));
    b = Math.round(b * (1 - weight));
    const toHex = x => x.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const MagneticSidebarBtn = ({ iconEl, label, displayLabel, onClick, extraStyle = {}, extraClassName = '', mousePos, isTablet, hideTooltip = false, addTextBelowIcons = false, textFont }) => {
    const btnRef = React.useRef(null);
    const [showTooltip, setShowTooltip] = React.useState(false);
    const rawScale = useMotionValue(1);
    const scale = useSpring(rawScale, { stiffness: 380, damping: 26, mass: 0.5 });
    const rawGlow = useMotionValue(0);
    const glowOp = useSpring(rawGlow, { stiffness: 380, damping: 26, mass: 0.5 });
    const glowBg = useTransform(glowOp, v => `rgba(255,255,255,${v * 0.07})`);

    React.useEffect(() => {
        if (!mousePos || !btnRef.current) {
            rawScale.set(1);
            rawGlow.set(0);
            setShowTooltip(false);
            return;
        }
        const rect = btnRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(mousePos.x - cx, mousePos.y - cy);

        const isInside = mousePos.x >= rect.left && mousePos.x <= rect.right &&
            mousePos.y >= rect.top && mousePos.y <= rect.bottom;
        setShowTooltip(isInside);

        const maxDist = 52;
        const t = Math.max(0, 1 - dist / maxDist);
        const eased = t * t * (3 - 2 * t);
        const focused = eased * eased;
        rawScale.set(1 + 0.32 * focused);
        rawGlow.set(focused);
    }, [mousePos]);

    return (
        <button
            ref={btnRef}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`flex flex-col items-center justify-center relative z-[20] ${extraClassName || ''}`}
            style={{ ...extraStyle, fontFamily: textFont, border: 'none', outline: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }}
            onClick={(e) => { setShowTooltip(false); if (onClick) onClick(e); }}
        >
            <motion.div
                style={{ scale, transformOrigin: 'center center', willChange: 'transform' }}
                className="flex flex-col items-center justify-center"
                whileTap={{ scale: 0.91 }}
            >
                <motion.span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.15vw', padding: '0.15vw', background: glowBg }}>
                    {iconEl}
                </motion.span>
            </motion.div>
            {addTextBelowIcons && (
                <span
                    className={`${'text-[0.55vw]'} font-medium mt-[0.15vw] leading-snug text-center`}
                    style={{ color: extraStyle?.color || '#FFFFFF', fontFamily: textFont, opacity: extraStyle?.opacity || 1 }}
                >{displayLabel ?? label}</span>
            )}

            {/* Custom tooltip for side bar (appears right of button) â€” hidden when label text is shown */}
            {showTooltip && !hideTooltip && !addTextBelowIcons && (
                <div
                    className="absolute left-full ml-[1.2vw] top-1/2 -translate-y-1/2 whitespace-nowrap"
                    style={{
                        background: 'rgba(10, 10, 12, 0.55)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        transform: 'translateZ(0)',
                        isolation: 'isolate',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        padding: '0.25vw 0.5vw',
                        borderRadius: '0.3vw',
                        fontSize: '0.65vw',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                        pointerEvents: 'none',
                        zIndex: 9999,
                    }}
                >
                    {label}
                    {/* CSS Triangle Arrow pointing left */}
                    <div
                        className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-solid border-t-transparent border-b-transparent border-r-[0.45vw] border-t-[0.35vw] border-b-[0.35vw]"
                        style={{ borderRightColor: 'rgba(10, 10, 12, 0.55)' }}
                    />
                </div>
            )}
        </button>
    );
};

const Grid4Layout = ({
    children,
    settings,
    bookName,
    searchQuery,
    setSearchQuery,
    handleQuickSearch,
    setShowThumbnailBarMemo,
    setShowTOCMemo,
    setShowAddNotesPopupMemo,
    setShowAddBookmarkPopupMemo,
    setShowViewBookmarkPopup,
    setShowNotesViewerMemo,
    bookRef,
    pages,
    setIsPlaying,
    isAutoFlipping,
    handleShare,
    handleDownload,
    handleFullScreen,
    setShowProfilePopup,
    showProfilePopup,
    logoSettings,
    currentPage,
    pagesCount,
    currentZoom,
    setCurrentZoom,
    onPageClick,
    bookmarks,
    notes,
    onUpdateBookmark,
    onDeleteBookmark,
    onNavigate,
    profileSettings,
    isSidebarOpen,
    showViewBookmarkPopup,
    backgroundSettings,
    backgroundStyle,
    isMuted,
    onToggleAudio,
    showSoundPopup,
    setShowSoundPopupMemo,
    setShowGalleryPopupMemo,
    activeLayout,
    isTablet,
    isMobile,
    isMobileLandscape = false,
    showTOC,
    isEditor = false,
    isFullscreen: isFullscreenProp
,
    offset = 0,
}) => {
    // If mobile view is active, delegate entirely to MobileLayout1 (as fallback)
    if (isMobile && !isMobileLandscape) {
        return (
            <MobileLayout1
                settings={settings}
                bookName={bookName}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleQuickSearch={handleQuickSearch}
                setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                setShowTOCMemo={setShowTOCMemo}
                setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                setShowNotesViewerMemo={setShowNotesViewerMemo}
                bookRef={bookRef}
                pages={pages}
                setIsPlaying={setIsPlaying}
                isAutoFlipping={isAutoFlipping}
                handleShare={handleShare}
                handleDownload={handleDownload}
                handleFullScreen={handleFullScreen}
                setShowProfilePopup={setShowProfilePopup}
                logoSettings={logoSettings}
                currentPage={currentPage}
                pagesCount={pages?.length || 0}
                currentZoom={currentZoom}
                onPageClick={onPageClick}
                bookmarks={bookmarks}
                onDeleteBookmark={onDeleteBookmark}
                onUpdateBookmark={onUpdateBookmark}
                notes={notes}
                onAddNote={onAddNote}
                profileSettings={profileSettings}
                activeLayout={activeLayout}
            />
        );
    }
    const initialWidth = (children && children.props && children.props.WIDTH) ? children.props.WIDTH : 400;
    const initialHeight = (children && children.props && children.props.HEIGHT) ? children.props.HEIGHT : 566;

    const [dimWidth, setDimWidth] = useState(initialWidth);
    const [dimHeight, setDimHeight] = useState(initialHeight);
    const aspectRatio = initialHeight / initialWidth;
    const containerRef = React.useRef(null);

    // Reset dimensions to default when tablet mode changes or initial props change
    React.useEffect(() => {
        setDimWidth(initialWidth);
        setDimHeight(initialHeight);
    }, [isTablet, initialWidth, initialHeight]);



    const zoomIn = () => {
        setDimWidth(prev => {
            const nextWidth = Math.min(prev + (initialWidth * 0.01), initialWidth * 1.3);
            setDimHeight(nextWidth * aspectRatio);
            return nextWidth;
        });
    };

    const zoomOut = () => {
        setDimWidth(prev => {
            const nextWidth = Math.max(prev - (initialWidth * 0.01), initialWidth * 0.5);
            setDimHeight(nextWidth * aspectRatio);
            return nextWidth;
        });
    };

    // Keyboard and Mouse Wheel Actions
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
            switch (e.key) {
                case 'ArrowRight':
                    bookRef.current?.pageFlip()?.flipNext();
                    break;
                case 'ArrowLeft':
                    bookRef.current?.pageFlip()?.flipPrev();
                    break;
                case 'ArrowUp':
                case '+':
                    zoomIn();
                    break;
                case 'ArrowDown':
                case '-':
                    zoomOut();
                    break;
                default:
                    break;
            }
        };

        let lastWheelTime = 0;
        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) zoomIn();
                else zoomOut();
            } else if (settings?.navigation?.mouseWheel) {
                if (e.target.closest('.overflow-y-auto') || e.target.closest('.overflow-x-auto') || e.target.closest('.thumbnail-bar-container') || e.target.closest('input')) {
                    return;
                }

                if (!e.target.closest('.turn-book, #turn-book, [data-turn-book], .flipbook-magazine-wrapper, .fbe-book, .fbe-wrapper, [data-fbe]')) {
                    return;
                }
                const now = Date.now();
                if (now - lastWheelTime < 600) return;
                
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
        const container = containerRef?.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        } else {
            window.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            } else {
                window.removeEventListener('wheel', handleWheel);
            }
        };
    }, [zoomIn, zoomOut, bookRef, settings?.navigation?.mouseWheel]);

    const localOffset = React.useMemo(() => {
        if (offset === 0) return 0; // Use offset prop to respect single page mode
        if (currentPage === 0) {
            return -(dimWidth / 2);
        } else if (currentPage >= pages.length - 1) {
            return (currentPage % 2 === 0) ? -(dimWidth / 2) : (dimWidth / 2);
        }
        return 0;
    }, [currentPage, pages.length, dimWidth, offset]);

    const originalBuildPageDoc = children && children.props && children.props.buildPageDoc;
    const localBuildPageDoc = React.useCallback((html, pageNum) => {
        const content = originalBuildPageDoc ? originalBuildPageDoc(html, pageNum) : html;
        const zoomFactor = dimWidth / initialWidth;
        // Inject zoom into the body style to ensure fixed-pixel templates scale with the container resolution
        if (typeof content === 'string' && content.includes('<body')) {
            return content.replace('<body', `<body style="zoom: ${zoomFactor};"`);
        }
        return content;
    }, [dimWidth, initialWidth, originalBuildPageDoc]);

    const modifiedChildren = React.useMemo(() => {
        if (!children) return null;
        return React.cloneElement(children, {
            WIDTH: dimWidth,
            HEIGHT: dimHeight,
            buildPageDoc: localBuildPageDoc
        });
    }, [children, dimWidth, dimHeight, localBuildPageDoc]);

    const isPdfProject = pages?.some(p => p.html && p.html.includes('data-name="PDF Background"'));
    const totalPages = pagesCount;
    const progressPercentage = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0;

    const [showThumbnails, setShowThumbnails] = useState(false);
    // using showProfilePopup instead of showProfilePopup local state
    const [recommendations, setRecommendations] = useState([]);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
    const [tocSearchQuery, setTocSearchQuery] = useState('');
    const isFullscreen = isFullscreenProp || false;
    const isCanvasHovered = false; const setIsCanvasHovered = () => {};
    const [sidebarMousePos, setSidebarMousePos] = useState(null);
    const isBigBars = !isEditor || (isFullscreen && typeof document !== 'undefined' && !!document.fullscreenElement);
    const scrollRef = useRef(null);
    const buttonsRef = useRef(null);
    const sidebarContentRef = useRef(null);
    const previewAreaRef = useRef(null);
    const progressRef = useRef(null);
    const progressHoverRef = useRef(null);

    const [progressHover, setProgressHover] = useState({
        visible: false,
        x: 0,
        percentage: 0,
        pageIndex: 0,
        spread: null,
        rectWidth: 0
    });

    const handleProgressClick = (e) => {
        if (!progressRef.current || totalPages <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (totalPages - 1));
        onPageClick(targetIdx);
    };

    const handleProgressMouseMove = (e) => {
        if (!progressRef.current || totalPages <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
        progressHoverRef.current = requestAnimationFrame(() => {
            const boundedX = Math.max(0, Math.min(x, rect.width));
            const percentage = boundedX / rect.width;
            let targetIdx = Math.round(percentage * (totalPages - 1));

            const activeSpread = spreads.find(s => s.indices.includes(targetIdx)) || spreads[0];

            setProgressHover({
                visible: true,
                x: boundedX,
                percentage,
                pageIndex: targetIdx,
                spread: activeSpread,
                rectWidth: rect.width
            });
        });
    };

    useEffect(() => {
        setLocalSearchQuery(searchQuery);
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            // isFullscreen is derived from the prop, no local setter needed
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

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



    useEffect(() => {
        if (showThumbnails && scrollRef.current) {
            const activeElem = scrollRef.current.querySelector('.active-thumbnail');
            if (activeElem) {
                activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [currentPage, showThumbnails]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showThumbnails || showTOC || showProfilePopup || showSoundPopup) {
                const isClickOnPreview = previewAreaRef.current?.contains(event.target);

                if (isClickOnPreview) {
                    setShowThumbnails(false);
                    setShowTOCMemo?.(false);
                    setShowProfilePopup(false);
                    setShowSoundPopupMemo?.(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showThumbnails, showTOC, showProfilePopup, showSoundPopup, setShowSoundPopupMemo]);

    // Toolbar display settings
    const addTextBelowIcons = settings?.toolbar?.addTextBelowIcons ?? false;
    const textFont = settings?.toolbar?.textProperties?.font || 'inherit';

    const renderSidebarBtn = (iconEl, label, onClick, extraStyle = {}, displayLabel = undefined) => (
        <MagneticSidebarBtn
            iconEl={iconEl}
            label={label}
            displayLabel={displayLabel}
            onClick={onClick}
            extraStyle={extraStyle}
            mousePos={sidebarMousePos}
            isTablet={isTablet}
            addTextBelowIcons={addTextBelowIcons}
            textFont={textFont}
        />
    );


    if (isTablet) {
        return (
            <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative font-sans" style={backgroundStyle}>
                <div className="flex-1 flex items-center justify-center relative">
                    <div
                        className="transition-transform duration-600 ease-in-out"
                        style={{
                            transform: `translateX(${localOffset}px) scale(1)`,
                            transformOrigin: 'center center'
                        }}
                    >
                        {modifiedChildren}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative font-sans" style={backgroundStyle} onClick={() => setRecommendations([])}>
            {/* Top Bar: Brand - Title - Search */}
            <div className={`${isMobileLandscape ? 'h-[12%]' : isFullscreen ? 'h-[6vh]' : (!isBigBars ? 'h-[6.5vh]' : 'h-[7.5vh]')} flex items-center justify-between px-[1.5vw] shrink-0 w-full z-[1010] border-b border-white/5 shadow-lg transition-all duration-500 ${isFullscreen ? `absolute top-0 left-0 ${(!isCanvasHovered || showThumbnails || showTOC || showProfilePopup || showSoundPopup) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`} style={{ backgroundColor: getLayoutColor('toolbar-bg', '#555555') }}>
                <div className="flex items-center">
                    {settings.brandingProfile.logo && logoSettings?.src && (
                        <img
                            src={logoSettings.src}
                            alt="Logo"
                            className={`${'h-[2vw]'} w-auto transition-all`}
                            style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                        />
                    )}
                </div>

                <div className={`absolute left-1/2 -translate-x-1/2 text-center pointer-events-none ${isMobileLandscape ? 'mt-[1.5vh]' : ''}`}>
                    <span className={`${isMobileLandscape ? 'text-[2.2vw]' : 'text-[1.25vw]'} font-medium tracking-tight whitespace-nowrap`} style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>{/* {bookName} */}</span>
                </div>

                {/* Search Wrapper */}
                {(settings?.interaction?.search ?? true) && !isPdfProject && (
                    <div className={`relative ${isMobileLandscape ? 'mr-[5vw]' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center ${isMobileLandscape ? 'px-[1.5vw] py-[1vh] w-[22vw]' : 'px-[1vw] py-[0.5vh] w-[16vw]'} shadow-sm border border-black/10 transition-all relative z-[101]`}
                            style={{ backgroundColor: getLayoutColor('search-bg-v2', '#E0E3F5') }}>
                            <Icon icon="lucide:search" className={`${'w-[1.2vw] h-[1.2vw]'}`} style={{ color: getLayoutColor('search-text-v1', '#555555') }} />
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
                                        setSearchQuery(localSearchQuery);
                                        handleQuickSearch(localSearchQuery);
                                        setRecommendations([]);
                                    }
                                }}
                                placeholder="Quick Search..."
                                className={`bg-transparent border-0 outline-none focus:ring-0 ${'text-[0.9vw]'} ml-[0.8vw] w-full font-medium`}
                                style={{
                                    color: getLayoutColor('search-text-v1', '#555555'),
                                    '--placeholder-color': getLayoutColorRgba('search-text-v1', '87, 92, 156', '0.7')
                                }}
                            />
                        </div>

                        {/* Recommendations Dropdown */}
                        {recommendations.length > 0 && (
                            <div className={`absolute top-full left-0 ${'w-[16vw]'} shadow-2xl z-[100] overflow-hidden -mt-[1px] bg-white animate-in fade-in slide-in-from-top-1 duration-200`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="w-full h-full border-x border-b border-gray-100"
                                    style={{ backgroundColor: `rgba(var(--toc-bg-rgb, 255, 255, 255), calc(0.4 + var(--toc-bg-opacity, 1) * 0.6))` }}
                                >
                                    <div className="px-[1.2vw] py-[1.2vh]">
                                        <span className={`${'text-[1vw]'} font-bold`} style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Suggestion</span>
                                    </div>
                                    <div className="flex flex-col pb-[1vh]">
                                        {recommendations.map((rec, idx) => (
                                            <div key={`${rec.word}-${rec.pageNumber}-${idx}`}>
                                                <button
                                                    className="flex items-center justify-between px-[1.2vw] py-[0.8vh] hover:bg-black/5 transition-colors group w-full text-left"
                                                    style={{ color: getLayoutColor('dropdown-text', '#555555') }}
                                                    onClick={() => {
                                                        onPageClick(rec.pageNumber - 1);
                                                        const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                        setLocalSearchQuery(fullQuery);
                                                        setSearchQuery(fullQuery);
                                                        setRecommendations([]);
                                                    }}
                                                >
                                                    <div className="flex flex-col items-start overflow-hidden flex-1 mr-[0.5vw]">
                                                        <span className={`${'text-[0.9vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                            <span className="font-bold mr-[0.3vw]" style={{ fontWeight: 800 }}>{rec.word}</span>
                                                            {rec.context && <span className="font-normal opacity-70">{rec.context}</span>}
                                                        </span>
                                                    </div>
                                                    <span className={`${'text-[0.85vw]'} font-medium opacity-80 tabular-nums shrink-0`}>Pg {rec.pageNumber}</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Middle Container */}
            <div className="flex-1 flex flex-row min-h-0 relative overflow-hidden">
                {/* Left Sidebar */}
                <div
                    ref={buttonsRef}
                    onMouseMove={(e) => setSidebarMousePos({ x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setSidebarMousePos(null)}
                    className={`${isMobileLandscape ? 'w-[10vw] items-end pr-[1.5vw]' : isFullscreen ? 'w-[3.6vw] items-center' : (!isBigBars ? 'w-[3.5vw] items-center' : 'w-[4.2vw] items-center')} flex flex-col ${isFullscreen ? 'justify-center pb-[18vh]' : 'pt-[8vh] pb-[2vh]'} gap-[${isMobileLandscape ? '3.5vh' : '3vh'}] border-r border-white/5 shadow-xl z-[1000] shrink-0 transition-all duration-500 ${isFullscreen ? `absolute left-0 top-0 bottom-0 ${(!isCanvasHovered || showThumbnails || showTOC || showProfilePopup || showSoundPopup) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`} style={{ backgroundColor: getLayoutColor('toolbar-bg', '#555555') }}>

                    {(settings?.navigation?.tableOfContents ?? true) && renderSidebarBtn(
                        <Icon icon="fluent:text-bullet-list-24-filled" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : (isFullscreen && typeof document !== 'undefined' && !!document.fullscreenElement) ? ('w-[1.35vw] h-[1.35vw]') : ('w-[1.2vw] h-[1.2vw]')}`} />,
                        "Table of Contents",
                        () => {
                            setShowTOCMemo(!showTOC);
                            setShowThumbnails(false);
                            setShowProfilePopup(false);
                            setShowSoundPopupMemo?.(false);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF') },
                        <><span style={{ display: 'block' }}>Table of</span><span style={{ display: 'block' }}>Contents</span></>
                    )}

                    {(settings?.navigation?.pageThumbnails ?? true) && renderSidebarBtn(
                        <Icon icon="ph:squares-four-fill" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : (isFullscreen && typeof document !== 'undefined' && !!document.fullscreenElement) ? ('w-[1.35vw] h-[1.35vw]') : ('w-[1.2vw] h-[1.2vw]')}`} />,
                        "Thumbnails",
                        () => {
                            setShowThumbnails(!showThumbnails);
                            setShowTOCMemo?.(false);
                            setShowProfilePopup(false);
                            setShowSoundPopupMemo?.(false);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF') }
                    )}

                    {(settings?.interaction?.gallery ?? true) && renderSidebarBtn(
                        <Icon icon="clarity:image-gallery-solid" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : (isFullscreen && typeof document !== 'undefined' && !!document.fullscreenElement) ? ('w-[1.35vw] h-[1.35vw]') : ('w-[1.2vw] h-[1.2vw]')}`} />,
                        "Gallery",
                        () => {
                            setShowGalleryPopupMemo(true);
                            setShowThumbnails(false);
                            setShowTOCMemo?.(false);
                            setShowProfilePopup(false);
                            setShowSoundPopupMemo?.(false);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF') }
                    )}

                    {(settings?.media?.backgroundAudio ?? true) && renderSidebarBtn(
                        <Icon icon="solar:music-notes-bold" className={`${isMobileLandscape ? 'w-[2.2vw] h-[2.2vw]' : (isFullscreen && typeof document !== 'undefined' && !!document.fullscreenElement) ? ('w-[1.35vw] h-[1.35vw]') : ('w-[1.2vw] h-[1.2vw]')}`} />,
                        "Sound",
                        (e) => {
                            e.stopPropagation();
                            setShowSoundPopupMemo?.(!showSoundPopup);
                            setShowTOCMemo?.(false);
                            setShowThumbnails(false);
                            setShowProfilePopup(false);
                        },
                        { color: isMuted ? getLayoutColorRgba('toolbar-icon', '255, 255, 255', '0.3') : getLayoutColor('toolbar-icon', '#FFFFFF') }
                    )}

                    {(settings?.brandingProfile?.profile ?? true) && renderSidebarBtn(
                        <Icon icon="fluent:person-24-filled" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : (isFullscreen && typeof document !== 'undefined' && !!document.fullscreenElement) ? ('w-[1.35vw] h-[1.35vw]') : ('w-[1.2vw] h-[1.2vw]')}`} />,
                        "Profile",
                        () => {
                            setShowProfilePopup(!showProfilePopup);
                            setShowTOCMemo?.(false);
                            setShowThumbnails(false);
                            setShowSoundPopupMemo?.(false);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF') }
                    )}

                    {(settings?.shareExport?.share ?? true) && renderSidebarBtn(
                        <Icon icon="mage:share-fill" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : (isFullscreen && typeof document !== 'undefined' && !!document.fullscreenElement) ? ('w-[1.35vw] h-[1.35vw]') : ('w-[1.2vw] h-[1.2vw]')}`} />,
                        "Share",
                        () => {
                            handleShare();
                            setShowThumbnails(false);
                            setShowTOC(false);
                            setShowProfilePopup(false);
                            setShowTOCMemo?.(false);
                            setShowProfilePopup(false);
                            setShowSoundPopupMemo?.(false);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF') }
                    )}

                    {(settings?.shareExport?.download ?? true) && renderSidebarBtn(
                        <Icon icon="meteor-icons:download" className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : (isFullscreen && typeof document !== 'undefined' && !!document.fullscreenElement) ? ('w-[1.35vw] h-[1.35vw]') : ('w-[1.2vw] h-[1.2vw]')}`} />,
                        "Download",
                        () => {
                            handleDownload();
                            setShowThumbnails(false);
                            setShowTOCMemo?.(false);
                            setShowProfilePopup(false);
                            setShowSoundPopupMemo?.(false);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF') }
                    )}

                    {(settings?.viewing?.fullScreen ?? true) && renderSidebarBtn(
                        <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isMobileLandscape ? 'w-[2.4vw] h-[2.4vw]' : (isFullscreen && typeof document !== 'undefined' && !!document.fullscreenElement) ? ('w-[1.35vw] h-[1.35vw]') : ('w-[1.2vw] h-[1.2vw]')}`} />,
                        isFullscreen ? "Exit Fullscreen" : "Fullscreen",
                        () => {
                            handleFullScreen();
                            setShowThumbnails(false);
                            setShowTOC(false);
                            setShowProfilePopup(false);
                            setShowSoundPopupMemo?.(false);
                        },
                        { color: getLayoutColor('toolbar-icon', '#FFFFFF') }
                    )}
                </div>

                {/* Vertical Thumbnail Sidebar Integration */}
                {(settings?.navigation?.pageThumbnails ?? true) && showThumbnails && (
                    <div className={`absolute ${isMobileLandscape ? 'left-[7.5vw] w-[14vw]' : !isBigBars ? 'left-[3.5vw] w-[14vw]' : 'left-[4.2vw] w-[11vw]'} ${isFullscreen ? (isBigBars ? 'top-[7.5vh] bottom-[7.5vh]' : 'top-[6.5vh] bottom-[6.5vh]') : 'top-0 h-full'} bg-white z-30 border-r border-gray-200`}>
                        <div ref={sidebarContentRef} className="flex flex-col h-full animate-in slide-in-from-left duration-300"
                            style={{ backgroundColor: `rgba(var(--dropdown-bg-rgb, 255, 255, 255), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))` }}
                        >
                            {/* Header */}
                            <div className="flex flex-col pt-[1.5vh] pb-0">
                                <div className="flex items-center justify-between px-[1vw]">
                                    <span
                                        className={`${'text-[1.1vw]'} font-bold`}
                                        style={{ color: getLayoutColor('dropdown-text', '#3E4491'), fontFamily: "'Poppins', sans-serif" }}
                                    >Thumbnail</span>
                                    <button
                                        onClick={() => setShowThumbnails(false)}
                                        className="transition-colors opacity-60 hover:opacity-100"
                                        style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                    >
                                        <Icon icon="lucide:x" className={`${'w-[1.2vw] h-[1.2vw]'}`} />
                                    </button>
                                </div>
                                <div className="mt-[0.6vh] mb-[1vh] rounded-full" style={{ height: '2px', backgroundColor: getLayoutColor('dropdown-text', '#3E4491'), opacity: 0.5, margin: '0' }} />
                            </div>

                            {/* Vertically Scrollable List */}
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto custom-scrollbar p-[1vw] flex flex-col gap-[2vh]"
                            >
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);
                                    const vw = typeof window !== 'undefined' ? window.innerWidth / 100 : 19.2;
                                    const pageWidth = dimWidth || 400;
                                    const pageHeight = dimHeight || 566;
                                    const availableWidthPx = 8.4 * vw;
                                    // Compute max height based on actual page aspect ratio so portrait/landscape/square all render correctly
                                    const pageAspectRatio = pageWidth / pageHeight; // >1 for landscape, <1 for portrait, =1 for square
                                    // Each single page fits half the available width; height = singlePageWidth / pageAspectRatio
                                    const singlePageMaxWidth = availableWidthPx / 2;
                                    const availableHeightPx = singlePageMaxWidth / pageAspectRatio;
                                    // Always size the box for 2 pages so 1st/last single pages have the same box size and are centered
                                    const scaleX = (availableWidthPx / 2) / pageWidth;
                                    const scaleY = availableHeightPx / pageHeight;
                                    const thumbScale = Math.min(scaleX, scaleY);
                                    
                                    const totalScaledWidthPx = pageWidth * thumbScale * 2;
                                    const totalScaledHeightPx = pageHeight * thumbScale;
                                    const paddingPx = 0.6 * vw;

                                    return (
                                        <div
                                            key={idx}
                                            className={`flex flex-col items-center cursor-pointer group transition-all ${isSelected ? 'scale-105 active-thumbnail' : 'hover:scale-102'}`}
                                            onClick={() => onPageClick(spread.indices[0])}
                                        >
                                            <div
                                                className={`relative bg-white shadow-md rounded-[0.2vw] overflow-hidden border-[0.15vw] transition-all p-[0.3vw] flex justify-center items-center ${isSelected ? 'shadow-lg active-thumbnail' : 'border-gray-200 group-hover:border-gray-300'}`}
                                                style={{
                                                    width: `${totalScaledWidthPx + paddingPx}px`,
                                                    height: `${totalScaledHeightPx + paddingPx}px`,
                                                    borderColor: isSelected ? getLayoutColor('thumbnail-inner-v2', '#3E4491') : 'transparent'
                                                }}
                                            >
                                                <div className="flex w-full h-full gap-0 bg-gray-100 justify-center">
                                                    {spread.pages.map((page, pIdx) => {
                                                        const scaledWidth = pageWidth * thumbScale;

                                                        return (
                                                            <div key={`${idx}-${pIdx}`} className="bg-white overflow-hidden relative flex items-center justify-center h-full" style={{ width: `${scaledWidth}px` }}>
                                                                <PageThumbnail
                                                                    html={page.html || page.content}
                                                                    index={spread.indices[pIdx]}
                                                                    scale={thumbScale}
                                                                    baseWidth={pageWidth}
                                                                    baseHeight={pageHeight}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <span className={`mt-[0.5vh] ${'text-[0.75vw]'} font-bold transition-all`}
                                                style={{ color: isSelected ? getLayoutColor('thumbnail-inner-v2', '#3E4491') : getLayoutColor('dropdown-text', '#666666') }}
                                            >
                                                {spread.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Vertical Table of Contents Sidebar */}
                {showTOC && (
                    <div className={`absolute ${isMobileLandscape ? 'left-[7.5vw] w-[14vw]' : !isBigBars ? 'left-[3.5vw] w-[14vw]' : 'left-[4.2vw] w-[11vw]'} ${isFullscreen ? (isBigBars ? 'top-[7.5vh] bottom-[7.5vh]' : 'top-[6.5vh] bottom-[6.5vh]') : 'top-0 h-full'} bg-white z-30 border-r border-gray-200`}>
                        <div ref={sidebarContentRef} className="flex flex-col h-full animate-in slide-in-from-left duration-300"
                            style={{ backgroundColor: `rgba(var(--toc-bg-rgb, 255, 255, 255), calc(0.4 + var(--toc-bg-opacity, 1) * 0.6))` }}
                        >
                            {/* Header */}
                            <div className="flex flex-col pt-[1.5vh] pb-0">
                                <div className="flex items-center justify-between px-[1vw]">
                                    <span
                                        className={`${'text-[1.1vw]'} font-bold`}
                                        style={{ color: getLayoutColor('toc-text', '#555555'), fontFamily: "'Poppins', sans-serif" }}
                                    >Table of Contents</span>
                                    <button
                                        onClick={() => setShowTOCMemo(false)}
                                        className="transition-colors opacity-70 hover:opacity-100"
                                        style={{ color: getLayoutColor('toc-text', '#555555') }}
                                    >
                                        <Icon icon="lucide:x" className={`${'w-[1.2vw] h-[1.2vw]'}`} />
                                    </button>
                                </div>
                                <div className="mt-[0.6vh] mb-[1vh] rounded-full" style={{ height: '2px', backgroundColor: getLayoutColor('toc-text', '#555555'), opacity: 0.5, margin: '0' }} />
                            </div>

                            {/* Search Bar */}
                            {(settings.tocSettings?.addSearch !== false) && (
                                <div className="px-[1vw] pt-[2vh] pb-[1.5vh]">
                                    <div className="relative">
                                        <Icon
                                            icon="lucide:search"
                                            className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 w-[0.85vw] h-[0.85vw]"
                                            style={{ color: getLayoutColor('toc-text', '#555555'), opacity: 0.6 }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={tocSearchQuery}
                                            onChange={(e) => setTocSearchQuery(e.target.value)}
                                            className="w-full rounded-[0.3vw] pl-[2vw] pr-[0.8vw] py-[0.4vw] text-[0.8vw] outline-none transition-colors border shadow-sm focus:ring-1"
                                            style={{
                                                backgroundColor: 'transparent',
                                                color: getLayoutColor('toc-text', '#555555'),
                                                borderColor: getLayoutColorRgba('toc-text', '87, 92, 156', '0.2')
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* List Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-[1vw] flex flex-col">
                                {(() => {
                                    const safeContent = Array.isArray(settings.tocSettings?.content) ? settings.tocSettings.content : [];
                                    const filteredContent = safeContent.map(heading => {
                                        const matchesHeading = (heading?.title || '').toLowerCase().includes((tocSearchQuery || '').toLowerCase());
                                        const filteredSubheadings = heading?.subheadings?.filter(sub =>
                                            (sub?.title || '').toLowerCase().includes((tocSearchQuery || '').toLowerCase())
                                        ) || [];

                                        if (matchesHeading || filteredSubheadings.length > 0) {
                                            return {
                                                ...heading,
                                                subheadings: matchesHeading ? heading.subheadings : filteredSubheadings
                                            };
                                        }
                                        return null;
                                    }).filter(Boolean);

                                    return filteredContent.length > 0 ? (
                                        filteredContent.map((heading, hIdx) => (
                                            <div key={heading.id} className={`${hIdx > 0 ? 'mt-[1.5vh]' : ''}`}>
                                                <div
                                                    className="flex items-center justify-between py-[0.6vh] rounded-[0.3vw] cursor-pointer transition-colors"
                                                    style={{ color: getLayoutColor('toc-text', '#555555') }}
                                                    onClick={() => onPageClick && onPageClick(heading.page - 1)}
                                                >
                                                    <span className={`${'text-[0.85vw]'} font-medium truncate pr-[0.5vw] flex items-center`}>
                                                        {(settings.tocSettings?.addSerialNumberHeading !== false) && <span className="mr-1">{hIdx + 1}.</span>}
                                                        {heading.title}
                                                    </span>
                                                    {settings.tocSettings?.addPageNumber !== false && (
                                                        <span className={`${'text-[0.85vw]'} font-medium tabular-nums ml-[0.3vw]`}>
                                                            {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-col">
                                                    {heading.subheadings?.map((sub, sIdx) => (
                                                        <div
                                                            key={sub.id}
                                                            className="flex items-center justify-between py-[0.6vh] rounded-[0.3vw] cursor-pointer transition-colors pl-[1vw]"
                                                            style={{ color: getLayoutColor('toc-text', '#555555') }}
                                                            onClick={() => onPageClick && onPageClick(sub.page - 1)}
                                                        >
                                                            <span className={`${'text-[0.85vw]'} font-normal truncate pr-[0.5vw] flex items-center`}>
                                                                {(settings.tocSettings?.addSerialNumberSubheading !== false) && <span className="mr-1">{hIdx + 1}.{sIdx + 1}</span>}
                                                                {sub.title}
                                                            </span>
                                                            {settings.tocSettings?.addPageNumber !== false && (
                                                                <span className={`${'text-[0.85vw]'} font-normal tabular-nums ml-[0.2vw]`}>
                                                                    {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-[0.8vw] text-center pt-[10vw] opacity-60 font-medium" style={{ color: getLayoutColor('toc-text', '#555555') }}>
                                            No Table Of Content Found
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Vertical Profile Sidebar */}
                {showProfilePopup && (
                    <div className={`absolute ${isMobileLandscape ? 'left-[7.5vw] w-[16vw]' : !isBigBars ? 'left-[3.5vw] w-[13vw]' : 'left-[4.2vw] w-[11.5vw]'} ${isFullscreen ? (isBigBars ? 'top-[7.5vh] bottom-[7.5vh]' : 'top-[6.5vh] bottom-[6.5vh]') : 'top-0 h-full'} bg-white z-30 border-r border-gray-200`}>
                        <div ref={sidebarContentRef} className="flex flex-col h-full animate-in slide-in-from-left duration-300"
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-[1vw] py-[1.5vh] border-b" style={{ borderColor: getLayoutColorRgba('dropdown-text', '62, 68, 145', '0.2') }}>
                                <span className={`${'text-[1.1vw]'} font-semibold`} style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Profile</span>
                                <button
                                    onClick={() => setShowProfilePopup(false)}
                                    className="transition-colors opacity-60 hover:opacity-100"
                                    style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}
                                >
                                    <Icon icon="lucide:x" className={`${'w-[1.2vw] h-[1.2vw]'}`} />
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 p-[1vw] flex flex-col gap-[1.5vh] overflow-y-auto custom-scrollbar">
                                {profileSettings?.name || profileSettings?.about ? (
                                    <>
                                        <div className="flex items-start gap-[0.5vw]">
                                            <span className={`${'text-[0.85vw]'} font-bold whitespace-nowrap`} style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Name :</span>
                                            <span className={`${'text-[0.85vw]'} font-medium opacity-80`} style={{ color: getLayoutColor('dropdown-text', '#555555') }}>{profileSettings?.name}</span>
                                        </div>

                                        <div className="flex flex-col gap-[0.5vh]">
                                            <div className="flex items-start gap-[0.5vw]">
                                                <span className={`${'text-[0.85vw]'} font-bold whitespace-nowrap`} style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>About :</span>
                                                <div className={`${'text-[0.85vw]'} font-medium leading-relaxed text-justify opacity-80`} style={{ color: getLayoutColor('dropdown-text', '#555555') }}>
                                                    {profileSettings?.about}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-[1vh]">
                                            <h3 className={`${'text-[1vw]'} font-bold mb-[1vh]`} style={{ color: getLayoutColor('dropdown-text', '#3E4491') }}>Contact</h3>
                                            <div className="flex items-center gap-[0.75vw] flex-wrap">
                                                {profileSettings?.contacts?.filter(c => c.value).map((contact) => (
                                                    <button
                                                        key={contact.id}
                                                        className={`${'w-[2.2vw] h-[2.2vw]'} rounded-[0.5vw] flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${contact.type === 'x' ? 'bg-black' :
                                                            contact.type === 'facebook' ? 'bg-[#3138A9]' :
                                                                contact.type === 'instagram' ? 'bg-gradient-to-tr from-[#FFD600] via-[#FF0100] to-[#D800FF]' :
                                                                    'bg-white border border-gray-300'
                                                            }`}
                                                    >
                                                        {contact.type === 'x' && <Icon icon="ri:twitter-x-fill" className={`text-white ${'w-[1.3vw] h-[1.3vw]'}`} />}
                                                        {contact.type === 'facebook' && <Icon icon="ri:facebook-fill" className={`text-white ${'w-[1.5vw] h-[1.5vw]'}`} />}
                                                        {(contact.type === 'email' || contact.type === 'gmail') && <Icon icon="logos:google-gmail" className={`${'w-[1.3vw] h-[1.3vw]'}`} />}
                                                        {contact.type === 'instagram' && <Icon icon="ri:instagram-line" className={`text-white ${'w-[1.4vw] h-[1.4vw]'}`} />}
                                                        {(contact.type === 'phone' || contact.type === 'contact') && <Icon icon="ph:phone-fill" className={`text-[#4B4EFC] ${'w-[1.3vw] h-[1.3vw]'} -rotate-90`} />}
                                                        {contact.type === 'linkedin' && <Icon icon="logos:linkedin-icon" width={'1.3vw'} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-[0.85vw] text-center pt-[10vw] opacity-60 font-medium" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>
                                        No profile found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Canvas Area */}
                <div ref={previewAreaRef} className="flex-1 flex flex-col min-w-0 relative bg-[#D9D9D9]/20"
                    onClick={() => {
                        setRecommendations([]);
                    }}
                    onMouseMove={(e) => {
                        if (!isFullscreen) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const EDGE_ZONE = 72;
                        // Near edge: left edge, top edge, bottom edge
                        const nearEdge = x < EDGE_ZONE || y < EDGE_ZONE || y > rect.height - EDGE_ZONE;
                        setIsCanvasHovered(!nearEdge);
                    }}
                    onMouseLeave={() => isFullscreen && setIsCanvasHovered(false)}
                >
                    {/* Navigation Arrows */}
                    {(settings?.navigation?.nextPrevButtons ?? true) && (
                        <button
                            className={`absolute top-1/2 -translate-y-1/2 hover:scale-110 transition-all z-20 flex items-center justify-center ${'w-[2.4vw] h-[2.4vw]'} rounded-full`}
                            style={{
                                color: getLayoutColor('toolbar-icon', '#FFFFFF'),
                                backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.15'),
                                left: `max(2vw, calc(50% + ${localOffset}px ${currentPage === 0 ? '' : `- ${dimWidth}px`} - 3vw))`
                            }}
                            onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                        >
                            <Icon icon="lucide:chevron-left" className={`${'w-[1.5vw] h-[1.5vw]'}`} />
                        </button>
                    )}
                    {(settings?.navigation?.nextPrevButtons ?? true) && (
                        <button
                            className={`absolute top-1/2 -translate-y-1/2 hover:scale-110 transition-all z-20 flex items-center justify-center ${'w-[2.4vw] h-[2.4vw]'} rounded-full`}
                            style={{
                                color: getLayoutColor('toolbar-icon', '#FFFFFF'),
                                backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '0.15'),
                                right: `max(2vw, calc(50% - ${localOffset}px - ${(currentPage >= pages.length - 1 && pages.length % 2 === 0) ? 0 : dimWidth}px - 3vw))`
                            }}
                            onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                        >
                            <Icon icon="lucide:chevron-right" className={`${'w-[1.5vw] h-[1.5vw]'}`} />
                        </button>
                    )}

                    {/* Page Indicator Badge */}
                    {(settings?.navigation?.pageQuickAccess ?? true) && (
                        <div className={`absolute ${isFullscreen ? 'left-[4.5vw]' : 'left-[1.5vw]'} rounded-[0.4vw] ${!isBigBars ? 'p-[0.25vw]' : 'p-[0.3vw]'} shadow-md z-20 flex items-center justify-center`}
                            style={{
                                backgroundColor: getLayoutColor('search-bg-v2', '#FFFFFF'),
                                bottom: isFullscreen ? '9vh' : '3vh'
                            }}
                        >
                            <span className={`${!isBigBars ? 'text-[0.55vw]' : 'text-[0.65vw]'} font-medium`} style={{ color: getLayoutColor('search-text-v1', '#555555') }}>Page </span>
                            <input
                                type="text"
                                value={pageInputValue}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d+$/.test(val)) {
                                        setPageInputValue(val);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const pageNum = parseInt(pageInputValue, 10);
                                        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pages.length) {
                                            onPageClick(pageNum - 1);
                                        } else {
                                            setPageInputValue(String(currentPage + 1));
                                        }
                                        e.target.blur();
                                    }
                                }}
                                onBlur={() => {
                                    const pageNum = parseInt(pageInputValue, 10);
                                    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pages.length) {
                                        onPageClick(pageNum - 1);
                                    } else {
                                        setPageInputValue(String(currentPage + 1));
                                    }
                                }}
                                className={`${!isBigBars ? 'text-[0.55vw] mx-[0.2vw] px-[0.1vw] py-[0.05vw]' : 'text-[0.65vw] mx-[0.3vw] px-[0.15vw] py-[0.05vw]'} font-medium rounded-[0.25vw] outline-none text-center transition-colors shadow-inner`}
                                style={{
                                    width: `${String(pages.length).length + 1.2}ch`,
                                    color: getLayoutColor('search-text-v1', '#555555'),
                                    backgroundColor: getLayoutColorAlpha('search-text-v1', '87, 92, 156', 0.1),
                                    border: `1px solid ${getLayoutColorAlpha('search-text-v1', '87, 92, 156', 0.2)}`
                                }}
                                onFocus={(e) => {
                                    e.target.style.backgroundColor = getLayoutColorAlpha('search-text-v1', '87, 92, 156', 0.15);
                                    e.target.style.borderColor = getLayoutColorAlpha('search-text-v1', '87, 92, 156', 0.4);
                                }}
                                onMouseOver={(e) => {
                                    if(document.activeElement !== e.target) {
                                        e.target.style.backgroundColor = getLayoutColorAlpha('search-text-v1', '87, 92, 156', 0.15);
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if(document.activeElement !== e.target) {
                                        e.target.style.backgroundColor = getLayoutColorAlpha('search-text-v1', '87, 92, 156', 0.1);
                                    }
                                }}
                            />
                            <span className={`${!isBigBars ? 'text-[0.55vw]' : 'text-[0.65vw]'} font-medium`} style={{ color: getLayoutColor('search-text-v1', '#555555') }}> / {totalPages}</span>
                        </div>
                    )}


                    {/* Book Flip Content */}
                    <div className="flex-1 flex items-center justify-center relative">
                        <div
                            className="transition-transform duration-600 ease-in-out"
                            style={{
                                transform: `translateX(${localOffset}px) scale(1)`,
                                transformOrigin: 'center center'
                            }}
                        >
                            {modifiedChildren}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar: Multi-Region Integration */}
            <div className={`${isMobileLandscape ? 'h-[12%]' : isFullscreen ? 'h-[6vh]' : (!isBigBars ? 'h-[6.5vh]' : 'h-[7.5vh]')} flex items-center justify-between px-[2.5vw] shrink-0 w-full z-[1010] border-t border-white/5 transition-all duration-500 ${isFullscreen ? `absolute bottom-0 left-0 ${(!isCanvasHovered || showThumbnails || showTOC || showProfilePopup || showSoundPopup) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`} style={{ backgroundColor: getLayoutColor('bottom-toolbar-bg', '#555555') }}>
                {/* Left: Playback Icons */}
                <div className="flex items-center gap-[1.5vw] ml-[1.5vw]">
                    {(settings?.navigation?.startEndNav ?? true) && (
                        <button onClick={() => onPageClick && onPageClick(0)} className="hover:scale-110 transition-all p-[0.2vw] flex flex-col items-center justify-center gap-[0.2vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                            <Icon icon="lucide:skip-back" className={`${isMobileLandscape ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />
                            {addTextBelowIcons && <span className="text-[0.55vw] font-medium mt-[0.15vw]" style={{ fontFamily: textFont }}>First</span>}
                        </button>
                    )}
                    {(settings?.media?.autoFlip ?? true) && (
                        <button onClick={() => setIsPlaying(!isAutoFlipping)} className="hover:scale-110 transition-all p-[0.2vw] flex flex-col items-center justify-center gap-[0.2vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                            <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isMobileLandscape ? 'w-[1.4vw] h-[1.4vw]' : 'w-[1.3vw] h-[1.3vw]'}`} />
                            {addTextBelowIcons && <span className="text-[0.55vw] font-medium mt-[0.15vw]" style={{ fontFamily: textFont }}>{isAutoFlipping ? 'Pause' : 'Play'}</span>}
                        </button>
                    )}
                    {(settings?.navigation?.startEndNav ?? true) && (
                        <button onClick={() => onPageClick && onPageClick(totalPages - 1)} className="hover:scale-110 transition-all p-[0.2vw] flex flex-col items-center justify-center gap-[0.2vw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                            <Icon icon="lucide:skip-forward" className={`${isMobileLandscape ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />
                            {addTextBelowIcons && <span className="text-[0.55vw] font-medium mt-[0.15vw]" style={{ fontFamily: textFont }}>Last</span>}
                        </button>
                    )}
                </div>

                {/* Center: Progress Bar Area */}
                <div
                    ref={progressRef}
                    className="flex-1 mx-[5vw] py-[1.5vh] relative group cursor-pointer"
                    onClick={handleProgressClick}
                    onMouseMove={handleProgressMouseMove}
                    onMouseLeave={() => {
                        if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                        setProgressHover(prev => ({ ...prev, visible: false }));
                    }}
                >
                    <div className="h-[0.4vh] rounded-full relative overflow-hidden">
                        {/* Track Underlay (before fill) */}
                        <div
                            className="absolute inset-0 transition-colors duration-300"
                            style={{ backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 0.3 }}
                        />
                        {/* Progress Fill (after fill) */}
                        <div
                            className="h-full transition-all duration-300 ease-out relative z-10"
                            style={{
                                width: `${progressPercentage}%`,
                                backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'),
                                opacity: 'var(--toolbar-icon-opacity, 1)'
                            }}
                        />
                    </div>

                    {/* Hover Popup */}
                    <AnimatePresence>
                        {progressHover.visible && progressHover.spread && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className={`absolute z-[100] bottom-[calc(100%+1.5vw)] pointer-events-none`}
                                style={{ left: `${progressHover.x}px` }}
                            >
                                <div
                                    className={`absolute bottom-0 flex flex-col items-center ${'p-[0.5vw] rounded-[0.8vw]'} shadow-[0_10px_40px_rgba(0,0,0,0.3)]`}
                                    style={{
                                        backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'),
                                        transform: 'translateX(-50%)',
                                        minWidth: '9vw'
                                    }}
                                >
                                    <div className="w-full flex flex-col items-center px-[0.3vw]">
                                        <span
                                            className="font-bold whitespace-nowrap"
                                            style={{
                                                fontSize: isMobileLandscape ? '1.2vw' : '0.85vw',
                                                color: getLayoutColor('dropdown-text', '#555555')
                                            }}
                                        >
                                            {progressHover.spread.label}
                                        </span>

                                        <div
                                            className="w-full rounded-full"
                                            style={{
                                                height: '2.5px',
                                                backgroundColor: getLayoutColor('dropdown-text', '#555555'),
                                                margin: '0.5vw 0'
                                            }}
                                        />

                                        <div
                                            className="flex justify-center overflow-hidden rounded-[0.3vw] shadow-inner"
                                            style={{
                                                width: `${((dimWidth || 400) * 70 / (dimHeight || 566)) * progressHover.spread.pages.length}px`,
                                                backgroundColor: '#f3f4f6'
                                            }}
                                        >
                                            <div className="flex gap-0 bg-gray-100 justify-center w-full h-full">
                                                {progressHover.spread.pages.map((page, pIdx) => {
                                                    const pageWidth = dimWidth || 400;
                                                    const pageHeight = dimHeight || 566;
                                                    const boxHeight = 70;
                                                    const scale = boxHeight / pageHeight;
                                                    const boxWidth = pageWidth * scale;
                                                    return (
                                                        <div
                                                            key={`${progressHover.spread.indices[0]}-${pIdx}`}
                                                            className="bg-white overflow-hidden relative flex items-center justify-center border-0"
                                                            style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
                                                        >
                                                            <PageThumbnail
                                                                html={page.html || page.content}
                                                                index={progressHover.spread.indices[pIdx]}
                                                                scale={scale}
                                                                baseWidth={pageWidth}
                                                                baseHeight={pageHeight}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow fixed at center of popup */}
                                    <div
                                        className="absolute top-full w-0 h-0 border-solid border-l-transparent border-r-transparent shadow-xl"
                                        style={{
                                            borderTopWidth: '0.8vw',
                                            borderLeftWidth: '0.6vw',
                                            borderRightWidth: '0.6vw',
                                            borderTopColor: getLayoutColor('dropdown-bg', '#FFFFFF'),
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            filter: 'drop-shadow(0px 8px 10px rgba(0, 0, 0, 0.2))'
                                        }}
                                    ></div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Zoom Pill */}
                {(settings?.viewing?.zoom ?? true) && (
                    <div className="flex items-center">
                        <div className={`flex items-center rounded-[0.5vw] ${!isBigBars ? 'p-[0.1vw] pl-[0.4vw] gap-[0.5vw]' : 'p-[0.3vw] pl-[0.8vw] gap-[1vw]'} border shadow-sm`}
                            style={{
                                backgroundColor: getLayoutColor('search-bg-v2', '#FFFFFF'),
                                borderColor: getLayoutColorRgba('search-text-v1', '87, 92, 156', '0.1')
                            }}
                        >
                            <div className={`flex items-center ${!isBigBars ? 'gap-[0.3vw]' : 'gap-[0.8vw]'}`}>
                                <button onClick={(e) => { e.stopPropagation(); zoomOut(); }} className="hover:scale-110" style={{ color: getLayoutColor('search-text-v1', '#3E4491') }}>
                                    <Icon icon="lucide:zoom-out" className={`${'w-[0.9vw]'} ${'h-[0.9vw]'}`} />
                                </button>
                                <span className={`font-bold ${isMobileLandscape ? 'text-[1.2vw]' : 'text-[0.85vw]'} tabular-nums min-w-[2.5vw] text-center`} style={{ color: getLayoutColor('search-text-v1', '#3E4491') }}>
                                    {Math.round((dimWidth / initialWidth) * 100)}%
                                </span>
                                <button onClick={(e) => { e.stopPropagation(); zoomIn(); }} className="hover:scale-110" style={{ color: getLayoutColor('search-text-v1', '#3E4491') }}>
                                    <Icon icon="lucide:zoom-in" className={`${'w-[0.9vw]'} ${'h-[0.9vw]'}`} />
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setDimWidth(initialWidth);
                                    setDimHeight(initialHeight);
                                }}
                                className={`${!isBigBars ? 'text-[0.6vw] px-[0.4vw] py-[0.15vw] rounded-[0.3vw]' : isMobileLandscape ? 'text-[1.2vw]' : 'text-[0.8vw] px-[0.8vw] py-[0.35vw] rounded-[0.4vw]'} font-bold active:scale-95 transition-all shadow-sm`}
                                style={{ backgroundColor: getLayoutColor('search-bg-v2', '#FFFFFF'), color: getLayoutColor('search-text-v1', '#3E4491') }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Grid4Layout;
