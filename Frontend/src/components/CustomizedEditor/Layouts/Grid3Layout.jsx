import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';



const PageThumbnail = React.memo(({ html, index, scale = 0.15, baseWidth = 400, baseHeight = 566 }) => {
    // Optimization: Strip malicious/heavy scripts
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

const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;
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






const MagneticDockBtnTop = ({ iconEl, label, onClick, extraStyle = {}, extraClassName = '', mousePos, addTextBelowIcons, isMobileLandscape, isTablet, textFont, hideTooltip = false, tooltipPosition = 'bottom' }) => {
    const btnRef = React.useRef(null);
    const [showTooltip, setShowTooltip] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
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
        const isInside = mousePos.x >= rect.left && mousePos.x <= rect.right &&
            mousePos.y >= rect.top && mousePos.y <= rect.bottom;
        setShowTooltip(isInside);
    }, [mousePos]);

    return (
        <button
            ref={btnRef}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            onMouseEnter={() => { setShowTooltip(true); setIsHovered(true); }}
            onMouseLeave={() => { setShowTooltip(false); setIsHovered(false); }}
            className={`flex flex-col items-center justify-center relative z-[20] ${extraClassName || ''}`}
            style={{ ...extraStyle, fontFamily: textFont, border: 'none', outline: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }}
            onClick={(e) => { setShowTooltip(false); if (onClick) onClick(e); }}
        >
            <motion.div
                style={{ scale, transformOrigin: 'center 80%', willChange: 'transform' }}
                className="flex flex-col items-center justify-center"
                whileTap={{ scale: 0.91 }}
            >
                <motion.span style={{ display: 'inline-flex', position: 'relative', alignItems: 'center', justifyContent: 'center', borderRadius: '0.3vw', padding: '0.18vw', background: 'transparent' }}>
                    <div className={`absolute inset-0 rounded-[0.3vw] transition-colors duration-200 ${isHovered ? 'bg-white/10' : 'bg-transparent'}`} />
                    <div className="relative z-10 flex items-center justify-center">
                        {React.cloneElement(iconEl, { className: `${iconEl.props.className || ''} ${isMobileLandscape ? '!w-[0.7vw] !h-[0.7vw]' : ''}` })}
                    </div>
                </motion.span>
            </motion.div>
            {addTextBelowIcons && (
                <span
                    className={`${isMobileLandscape ? 'text-[0.35vw]' : isTablet ? 'text-[0.35vw]' : 'text-[0.55vw]'} font-medium mt-[0.15vw] leading-none whitespace-nowrap`}
                    style={{ color: extraStyle?.color || '#FFFFFF', fontFamily: textFont, opacity: extraStyle?.opacity || 1 }}
                >{label}</span>
            )}

            {showTooltip && !hideTooltip && !addTextBelowIcons && (
                <div
                    className={`absolute ${tooltipPosition === 'top' ? 'bottom-full mb-[1.5vh]' : 'top-full mt-[1.5vh]'} left-1/2 -translate-x-1/2 whitespace-nowrap`}
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
                        fontSize: isTablet ? '0.55vw' : '0.65vw',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                        pointerEvents: 'none',
                        zIndex: 9999,
                    }}
                >
                    {label}
                    <div
                        className={`absolute ${tooltipPosition === 'top' ? 'top-full border-t-[0.45vw]' : 'bottom-full border-b-[0.45vw]'} left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-l-[0.35vw] border-r-[0.35vw]`}
                        style={{ [tooltipPosition === 'top' ? 'borderTopColor' : 'borderBottomColor']: 'rgba(10, 10, 12, 0.55)' }}
                    />
                </div>
            )}
        </button>
    );
};

const Grid3Layout = ({
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
    isFullscreen = false,
    setShowProfilePopup,
    logoSettings,
    currentPage,
    pagesCount,
    currentZoom,
    setCurrentZoom,
    onPageClick,
    bookmarks,
    onDeleteBookmark,
    onUpdateBookmark,
    notes,
    onAddNote,
    profileSettings,
    isSidebarOpen,
    showViewBookmarkPopup,
    showProfilePopup,
    showAddBookmarkPopup,
    showAddNotesPopup,
    showNotesViewer,
    showSoundPopup,
    showGalleryPopup,
    activeLayout,
    layoutColors,
    backgroundSettings,
    backgroundStyle,
    isMuted,
    onToggleAudio,
    setShowGalleryPopupMemo,
    setShowSoundPopupMemo,
    isTablet,
    showTOC,
    isMobileLandscape = false,
    isEditor = false,
    showSharePopup,
    showExportPopup,
    offset = 0,
}) => {
    const isPdfProject = pages?.some(p => p.html && p.html.includes('data-name="PDF Background"'));
    const totalPages = pagesCount;
    const isBigBars = !isEditor;
    const progressPercentage = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0;

    const [showThumbnails, setShowThumbnails] = useState(false);
    const [dockMousePos, setDockMousePos] = useState(null);
    const [showBookmarkMenu, setShowBookmarkMenu] = useState(false);
    const [showNotesMenu, setShowNotesMenu] = useState(false);
    const containerRef = useRef(null);
    const [responsiveScale, setResponsiveScale] = useState(1);

    const initialWidth = (children && children.props && children.props.WIDTH) ? children.props.WIDTH : 400;
    const initialHeight = (children && children.props && children.props.HEIGHT) ? children.props.HEIGHT : 566;

    const [dimWidth, setDimWidth] = useState(isMobileLandscape ? initialWidth * 0.95 : isTablet ? initialWidth * 0.7 : initialWidth);
    const [dimHeight, setDimHeight] = useState(isMobileLandscape ? initialHeight * 0.9 : isTablet ? initialHeight * 0.7 : initialHeight);
    const aspectRatio = initialHeight / initialWidth;

    // --- Fullscreen toolbar hide/show (mirrors Grid1Layout) ---
    const isCanvasHovered = false; const setIsCanvasHovered = () => {};
    const savedZoomRef = useRef(null);
    const zoomTimerRef = useRef(null);
    const dimWidthRef = useRef(dimWidth);
    useEffect(() => { dimWidthRef.current = dimWidth; }, [dimWidth, offset]);

    // Sync isCanvasHovered to true as soon as we enter fullscreen
    const [prevFS, setPrevFS] = useState(isFullscreen);
    if (isFullscreen !== prevFS) {
        setPrevFS(isFullscreen);
        if (isFullscreen) setIsCanvasHovered(true);
    }

    // Auto-zoom when toolbar hides in fullscreen, restore when toolbar shows
    useEffect(() => {
        if (zoomTimerRef.current) {
            clearTimeout(zoomTimerRef.current);
            zoomTimerRef.current = null;
        }
        const toolbarHidden = isFullscreen && isCanvasHovered;
        if (toolbarHidden) {
            if (savedZoomRef.current === null) {
                zoomTimerRef.current = setTimeout(() => {
                    zoomTimerRef.current = null;
                    const current = dimWidthRef.current;
                    savedZoomRef.current = current;
                    const zoomed = Math.min(current + 40, initialWidth * 1.3);
                    setDimWidth(zoomed);
                    setDimHeight(zoomed * aspectRatio);
                }, 600);
            }
        } else {
            if (savedZoomRef.current !== null) {
                const restored = savedZoomRef.current;
                zoomTimerRef.current = setTimeout(() => {
                    zoomTimerRef.current = null;
                    savedZoomRef.current = null;
                    setDimWidth(restored);
                    setDimHeight(restored * aspectRatio);
                }, 600);
            }
        }
        return () => { if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current); };
    }, [isFullscreen, isCanvasHovered]);

    // Reset dimensions to default when tablet mode changes or initial props change
    useEffect(() => {
        setDimWidth(isMobileLandscape ? initialWidth * 0.95 : isTablet ? initialWidth * 0.7 : initialWidth);
        setDimHeight(isMobileLandscape ? initialHeight * 0.9 : isTablet ? initialHeight * 0.7 : initialHeight);
    }, [isTablet, isMobileLandscape, initialWidth, initialHeight]);

    const scrollRef = useRef(null);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);
    const [progressHover, setProgressHover] = useState({
        visible: false,
        x: 0,
        percentage: 0,
        pageIndex: 0,
        spread: null,
        rectWidth: 0
    });
    const progressHoverRef = useRef(null);
    const progressRef = useRef(null);

    const closeAllPopups = () => {
        setShowTOCMemo?.(false);
        setShowNotesMenu(false);
        setShowBookmarkMenu(false);
        setShowThumbnails(false);
        setShowSoundPopupMemo?.(false);
        setShowGalleryPopupMemo?.(false);
        setShowProfilePopup?.(false);
        setShowSuggestions(false);
        setShowViewBookmarkPopup?.(false);
        setRecommendations([]);
    };

    const handleProgressClick = (e) => {
        if (!progressRef.current || pages.length <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pages.length - 1));

        // Close other menus when navigating via progress bar
        closeAllPopups();

        onPageClick(targetIdx);
    };

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = window.innerWidth * 0.3;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
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

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
        }
    };

    useEffect(() => {
        const timer = setTimeout(checkScroll, 50);
        window.addEventListener('resize', checkScroll);
        return () => {
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timer);
        };
    }, [spreads, showThumbnails]);


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

    const localOffset = useMemo(() => {
        if (offset === 0) return 0; // Use offset prop to respect single page mode
        // Shift left to center the front cover, shift right to center the back cover
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

    const modifiedChildren = useMemo(() => {
        if (!children) return null;
        return React.cloneElement(children, {
            WIDTH: dimWidth,
            HEIGHT: dimHeight,
            buildPageDoc: localBuildPageDoc
        });
    }, [children, dimWidth, dimHeight, localBuildPageDoc]);

    // Keyboard and Mouse Wheel Actions
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            switch (e.key) {
                case 'ArrowRight':
                    setShowSoundPopupMemo?.(false);
                    setShowThumbnails(false);
                    setShowBookmarkMenu(false);
                    setShowNotesMenu(false);
                    setShowTOCMemo?.(false);
                    bookRef.current?.pageFlip()?.flipNext();
                    break;
                case 'ArrowLeft':
                    setShowSoundPopupMemo?.(false);
                    setShowThumbnails(false);
                    setShowBookmarkMenu(false);
                    setShowNotesMenu(false);
                    setShowTOCMemo?.(false);
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
                // Allow wheel events in the whole canvas container to make scrolling on single pages work
if (e.target.closest('.overflow-y-auto') || e.target.closest('.overflow-x-auto') || e.target.closest('.thumbnail-bar-container') || e.target.closest('input')) {
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
        
        const container = containerRef.current;
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
    }, [zoomIn, zoomOut, bookRef]);

    // Responsive scaling logic for Mobile Landscape
    useEffect(() => {
        if (!isMobileLandscape) {
            setResponsiveScale(1);
            return;
        }

        const updateScale = () => {
            if (containerRef.current) {
                const cw = containerRef.current.clientWidth;
                const ch = containerRef.current.clientHeight;
                const availableW = cw * 0.96;
                const availableH = ch * 0.96;
                const baseSpreadW = initialWidth * 2;
                const baseSpreadH = initialHeight;
                const scaleX = availableW / baseSpreadW;
                const scaleY = availableH / baseSpreadH;
                setResponsiveScale(Math.min(scaleX, scaleY));
            }
        };

        const timer = setTimeout(updateScale, 300);
        window.addEventListener('resize', updateScale);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateScale);
        };
    }, [isMobileLandscape, initialWidth, initialHeight]);

    useEffect(() => {
        if (showThumbnails && scrollRef.current) {
            const activeElem = scrollRef.current.querySelector('.active-thumbnail');
            if (activeElem) {
                activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
        checkScroll();
    }, [currentPage, showThumbnails]);

    // Toolbar display settings
    const addTextBelowIcons = settings?.toolbar?.addTextBelowIcons ?? false;
    const textFont = settings?.toolbar?.textProperties?.font || 'inherit';

    const renderToolbarBtn = (iconEl, label, onClick, extraStyle = {}, extraClassName = '', hideTooltip = false, forceNoText = false, tooltipPosition = 'bottom') => (
        <MagneticDockBtnTop
            iconEl={iconEl}
            label={label}
            onClick={onClick}
            extraStyle={extraStyle}
            extraClassName={extraClassName}
            mousePos={dockMousePos}
            addTextBelowIcons={forceNoText ? false : addTextBelowIcons}
            isMobileLandscape={isMobileLandscape}
            isTablet={isTablet}
            textFont={textFont}
            hideTooltip={hideTooltip}
            tooltipPosition={tooltipPosition}
        />
    );

    return (
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative font-sans" style={{ backgroundColor: backgroundSettings?.color || '#D9D9D9' }}>
            <div
                className="absolute inset-0 z-0"
                style={backgroundStyle}
            />

            <div
                className="flex-1 flex flex-col h-full w-full transition-transform duration-500 ease-in-out relative z-10"
                style={{
                    transform: 'scale(1)',
                    transformOrigin: 'center center'
                }}
            >
                {/* Layout 3 Top Bar - High Fidelity Match */}
                <div className={isFullscreen ? 'absolute top-0 left-0 w-full z-[1000] bg-transparent' : 'shrink-0'}>
                    <div className={`${!isBigBars ? (isMobileLandscape ? 'h-[5vh] pt-[0.5vh]' : isTablet ? 'h-[5.5vh]' : 'h-[6.5vh]') : (isMobileLandscape ? 'h-[5.5vh] pt-[0.5vh]' : isTablet ? 'h-[5.5vh]' : 'h-[6.5vh]')} flex items-center justify-between px-[1.5vw] w-full z-[1001] border-b border-white/5 shadow-lg transition-all duration-500 ease-in-out ${isFullscreen ? `absolute top-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}
                        onMouseMove={(e) => setDockMousePos({ x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setDockMousePos(null)}>
                        {/* Left: Rounded Search Pill */}
                        <div className="flex items-center">
                            {settings?.interaction?.search && !isPdfProject && (
                                <div className={`relative ${showSuggestions && recommendations.length > 0 ? 'z-[90]' : ''}`}>
                                    {showSuggestions && recommendations.length > 0 && (
                                        <div className="absolute inset-0 z-[-1]" onClick={(e) => { e.stopPropagation(); setShowSuggestions(false); }} />
                                    )}
                                    <div className={`flex items-center rounded-[0.8vw] px-[1vw] py-[0.4vw] group transition-all duration-300 ${isMobileLandscape ? 'w-[9vw] h-[2.8vh]' : isTablet ? 'w-[10vw] h-[3.2vh] px-[0.8vw] py-[0.25vw]' : isSidebarOpen ? 'w-[12vw]' : 'w-[15vw]'}`}
                                        style={{ backgroundColor: '#FFFFFF' }}
                                    >
                                        <style>{`
                                    #quick-search-v3::placeholder {
                                        color: ${getLayoutColor('search-text-v1', '#555555')} !important;
                                        opacity: var(--search-text-v1-opacity, 1);
                                    }
                                `}</style>
                                        <Icon icon="lucide:search" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1.2vw] h-[1.2vw]'}`} style={{ color: getLayoutColor('search-text-v1', '#555555'), opacity: 'var(--search-text-v1-opacity, 1)' }} />
                                        <input
                                            type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                                            id="quick-search-v3"
                                            placeholder={isMobileLandscape ? "Search..." : "Quick Search..."}
                                            value={localSearchQuery}
                                            onChange={(e) => {
                                                const val = e.target.value;
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
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    setSearchQuery(localSearchQuery);
                                                    handleQuickSearch(localSearchQuery);
                                                    setRecommendations([]);
                                                    setShowSuggestions(false);
                                                }
                                            }}
                                            onFocus={() => { if (recommendations.length > 0) setShowSuggestions(true); }}
                                            className={`bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ${isMobileLandscape ? 'text-[0.75vw]' : isTablet ? 'text-[0.55vw]' : 'text-[0.85vw]'} ml-[0.6vw] w-full font-normal`}
                                            style={{
                                                color: getLayoutColor('search-text-v1', '#555555'),
                                                opacity: 'var(--search-text-v1-opacity, 1)'
                                            }}
                                        />
                                    </div>

                                    {/* Search Recommendations Dropdown */}
                                    {showSuggestions && recommendations.length > 0 && (
                                        <div
                                            className={`absolute ${isMobileLandscape ? 'top-[1.8vw]' : isTablet ? 'top-[2vw]' : 'top-[2.4vw]'} left-0 rounded-[1vw] shadow-[0_1vw_3vw_rgba(0,0,0,0.15)] z-[100] overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 transition-all duration-300 ${isMobileLandscape ? 'w-[9vw] max-h-[25vh] overflow-y-auto' : isTablet ? 'w-[10vw]' : isSidebarOpen ? 'w-[12vw]' : 'w-[15vw]'}`}
                                            style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}
                                        >
                                            <div className={`${isMobileLandscape ? 'px-[0.8vw] py-[0.4vw]' : 'px-[1.2vw] py-[0.8vw]'} bg-gray-50/10`}>
                                                <span className={`${isMobileLandscape ? 'text-[0.65vw]' : 'text-[0.9vw]'} font-bold`} style={{ color: getLayoutColor('dropdown-text', '#555555'), opacity: 'var(--dropdown-text-opacity, 1)' }}>Suggestion</span>
                                            </div>
                                            <div className="flex flex-col py-[0.4vw]">
                                                {recommendations.map((rec, idx) => (
                                                    <button
                                                        key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                        className={`flex items-center justify-between ${isMobileLandscape ? 'px-[0.8vw] py-[0.4vw]' : 'px-[1.2vw] py-[0.7vw]'} transition-colors group hover:bg-black/5`}
                                                        style={{ color: getLayoutColor('dropdown-text', '#555555'), opacity: 'var(--dropdown-text-opacity, 1)' }}
                                                        onClick={() => {
                                                            onPageClick(rec.pageNumber - 1);
                                                            const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                            setLocalSearchQuery(fullQuery);
                                                            setSearchQuery(fullQuery);
                                                            setRecommendations([]);
                                                        }}
                                                    >
                                                        <div className="flex flex-col items-start overflow-hidden flex-1 mr-[0.5vw]">
                                                            <span className={`${isMobileLandscape ? 'text-[0.65vw]' : 'text-[0.85vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                                <span className="font-bold mr-[0.3vw]" style={{ fontWeight: 800 }}>{rec.word}</span>
                                                                {rec.context && <span className="font-normal opacity-70">{rec.context}</span>}
                                                            </span>
                                                        </div>
                                                        <span className={`${isMobileLandscape ? 'text-[0.6vw]' : 'text-[0.8vw]'} font-bold opacity-60 tabular-nums shrink-0`}>Pg {rec.pageNumber}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Center: Top Row Icons */}
                        <div
                            className="absolute left-1/2 flex items-center gap-[0.8vw]"
                            style={{
                                transform: isMobileLandscape
                                    ? 'translateX(calc(-50% + 4vw))'
                                    : 'translateX(-50%)',
                                columnGap: isMobileLandscape ? '0.4vw' : isTablet ? '0.3vw' : '0.8vw'
                            }}
                        >
                            {/* List/TOC */}
                            {(settings?.navigation?.tableOfContents ?? true) && renderToolbarBtn(
                                <Icon icon="fluent:text-bullet-list-24-filled" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                                'TOC',
                                () => {
                                    if (showTOC) {
                                        setShowTOCMemo?.(false);
                                    } else {
                                        closeAllPopups();
                                        setTimeout(() => setShowTOCMemo?.(true), 0);
                                    }
                                },
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' },
                                'p-[0.3vw]',
                                !!showTOC
                            )}
                            {/* Squares/Thumbnails */}
                            {(settings?.navigation?.pageThumbnails ?? true) && renderToolbarBtn(
                                <Icon icon="ph:squares-four-fill" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                                'Thumbnails',
                                () => {
                                    if (showThumbnails) {
                                        setShowThumbnails(false);
                                    } else {
                                        closeAllPopups();
                                        setTimeout(() => setShowThumbnails(true), 0);
                                    }
                                },
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' },
                                'p-[0.3vw]',
                                !!showThumbnails
                            )}

                            {(settings?.interaction?.gallery ?? true) && renderToolbarBtn(
                                <Icon icon="clarity:image-gallery-solid" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                                'Gallery',
                                () => {
                                    if (showGalleryPopup) {
                                        setShowGalleryPopupMemo?.(false);
                                    } else {
                                        closeAllPopups();
                                        setTimeout(() => setShowGalleryPopupMemo?.(true), 0);
                                    }
                                },
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' },
                                'p-[0.3vw]',
                                !!showGalleryPopup
                            )}
                            {/* Music */}
                            {(settings?.media?.backgroundAudio ?? true) && renderToolbarBtn(
                                <Icon icon="solar:music-notes-bold" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                                'Music',
                                () => {
                                    if (showSoundPopup) {
                                        setShowSoundPopupMemo?.(false);
                                    } else {
                                        closeAllPopups();
                                        setTimeout(() => setShowSoundPopupMemo?.(true), 0);
                                    }
                                },
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' },
                                'p-[0.3vw]',
                                !!showSoundPopup
                            )}
                            {/* Profile */}
                            {(settings?.brandingProfile?.profile ?? true) && renderToolbarBtn(
                                <Icon icon="fluent:person-24-filled" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                                'Profile',
                                () => {
                                    if (showProfilePopup) {
                                        setShowProfilePopup?.(false);
                                    } else {
                                        closeAllPopups();
                                        setTimeout(() => setShowProfilePopup?.(true), 0);
                                    }
                                },
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' },
                                'p-[0.3vw]',
                                !!showProfilePopup
                            )}
                            {/* Share */}
                            {(settings?.shareExport?.share ?? true) && renderToolbarBtn(
                                <Icon icon="mage:share-fill" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                                'Share',
                                handleShare,
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' },
                                'p-[0.3vw]',
                                !!showSharePopup
                            )}
                            {/* Download */}
                            {(settings?.shareExport?.download ?? true) && renderToolbarBtn(
                                <Icon icon="meteor-icons:download" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                                'Download',
                                handleDownload,
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' },
                                'p-[0.3vw]',
                                !!showExportPopup
                            )}
                            {/* Full Screen */}
                            {(settings?.viewing?.fullScreen ?? true) && renderToolbarBtn(
                                <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                                'Full Screen',
                                handleFullScreen,
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' },
                                'p-[0.3vw]'
                            )}
                        </div>

                        {/* Right: Brand Logo Container */}
                        <div className="flex items-center gap-[1vw]">
                            {bookName && (
                                <span className={`${!isBigBars ? (isTablet ? 'text-[0.9vw]' : 'text-[1.1vw]') : (isTablet ? 'text-[1.1vw]' : 'text-[1.2vw]')} font-semibold truncate max-w-[20vw] select-none`}
                                    style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.9 }}>{/* {bookName} */}</span>
                            )}
                            <div className="flex items-center">
                                {settings.brandingProfile.logo && logoSettings?.src && (
                                    <img
                                        src={logoSettings.src}
                                        alt="Brand Logo"
                                        className={`${isMobileLandscape ? 'h-[1.8vw]' : 'h-[1.5vw]'} w-auto transition-all cursor-pointer hover:scale-105 active:scale-95`}
                                        style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                                        onClick={() => setShowProfilePopup(true)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    ref={containerRef}
                    className="flex-1 min-h-0 w-full relative flex flex-col items-center justify-center overflow-hidden bg-transparent"
                    onClick={() => {
                        setShowBookmarkMenu(false);
                        setShowNotesMenu(false);
                        setShowSuggestions(false);
                    }}
                    onMouseMove={(e) => {
                        if (!isFullscreen) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const EDGE_ZONE = 72;
                        const nearEdge = y < EDGE_ZONE || y > rect.height - EDGE_ZONE;
                        setIsCanvasHovered(!nearEdge);
                    }}
                    onMouseLeave={() => isFullscreen && setIsCanvasHovered(false)}
                >


                    <div className="flex-1 w-full flex items-center justify-center relative min-h-0">

                        {/* Side Navigation Arrows */}
                        <style>{`
                            #v3-prev-arrow, #v3-next-arrow {
                                background-color: ${getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1')} !important;
                            }
                            #v3-prev-arrow:hover, #v3-next-arrow:hover {
                                filter: brightness(115%);
                            }
                        `}</style>

                        {(() => {
                            const isPortraitLayout = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
                            const isCover = currentPage === 0;
                            const isBackCover = currentPage === pages.length - 1 && pages.length % 2 === 0;

                            const currentScale = isMobileLandscape ? responsiveScale : 1;
                            const leftDistance = isPortraitLayout
                                ? (dimWidth * currentScale) / 2
                                : (isCover ? 0 : dimWidth * currentScale);

                            const rightDistance = isPortraitLayout
                                ? (dimWidth * currentScale) / 2
                                : (isBackCover ? 0 : dimWidth * currentScale);

                            const isSinglePage = isPortraitLayout || isCover || isBackCover;
                            const gap = (isTablet ? 4 : 5) + (isSinglePage ? 2 : 0);

                            const leftPos = `calc(50% - ${leftDistance}px - ${gap}vw + ${localOffset}px)`;
                            const rightPos = `calc(50% - ${rightDistance}px - ${gap}vw - ${localOffset}px)`;

                            return (
                                <>
                                    {(settings?.navigation?.nextPrevButtons ?? true) && (
                                        <button
                                            id="v3-prev-arrow"
                                            className={`absolute top-1/2 -translate-y-1/2 ${isTablet ? 'w-[1.8vw] h-[1.8vw]' : 'w-[2.4vw] h-[2.4vw]'} flex items-center justify-center transition-all rounded-full z-20`}
                                            style={{ left: leftPos, color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                                            onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                                        >
                                            <Icon icon="lucide:chevron-left" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                                        </button>
                                    )}
                                    {(settings?.navigation?.nextPrevButtons ?? true) && (
                                        <button
                                            id="v3-next-arrow"
                                            className={`absolute top-1/2 -translate-y-1/2 ${isTablet ? 'w-[1.8vw] h-[1.8vw]' : 'w-[2.4vw] h-[2.4vw]'} flex items-center justify-center transition-all rounded-full z-20`}
                                            style={{ right: rightPos, color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' }}
                                            onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                                        >
                                            <Icon icon="lucide:chevron-right" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                                        </button>
                                    )}
                                </>
                            );
                        })()}

                        {/* Flipbook Magazine Container */}
                        <div
                            className="relative flex items-center justify-center magazine-content-area"
                            style={{
                                transform: `translateX(${localOffset}px) scale(${isMobileLandscape ? responsiveScale : 1})`,
                                transformOrigin: 'center center',
                                transition: 'transform 0.5s ease-out',
                                top: isMobileLandscape ? '0.5vw' : '0'
                            }}
                        >
                            {modifiedChildren}
                        </div>
                    </div>
                </div>

                {/* Layout 3 Bottom Bar - Integrated Progress UI */}
                <div className={isFullscreen ? 'absolute bottom-0 left-0 w-full z-[1000] bg-transparent' : 'shrink-0'}>
                    <div className={`${!isBigBars ? (isMobileLandscape ? 'h-[4vh] pt-[0.5vh]' : isTablet ? 'h-[5vh]' : 'h-[6.5vh] pt-[1vh]') : (isMobileLandscape ? 'h-[4.5vh] pt-[0.5vh]' : isTablet ? 'h-[5.5vh]' : 'h-[6.5vh] pt-[1vh]')} flex items-start justify-between px-[2vw] w-full z-[1001] transition-all duration-500 ease-in-out ${isFullscreen ? `absolute bottom-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ backgroundColor: getLayoutColorRgba('bottom-toolbar-bg', '62, 68, 145', '1') }}>

                        {/* Left: Page Counter Rounded Box */}
                        {(settings?.navigation?.pageQuickAccess ?? true) && (
                            <div className="flex items-center translate-y-[0.3vh]">
                                <div className={`rounded-[0.3vw] flex items-center justify-center ${!isBigBars ? (isMobileLandscape ? 'px-[0.6vw] h-[1.8vh] min-w-[4vw]' : isTablet ? 'px-[0.3vw] h-[2vh] min-w-[3.5vw]' : 'px-[0.7vw] pb-[0.3vh] h-[3.5vh] min-w-[5.5vw]') : (isMobileLandscape ? 'px-[1.2vw] h-[3.5vh] min-w-[7vw]' : isTablet ? 'px-[0.6vw] h-[2.8vh] min-w-[5vw]' : 'px-[0.6vw] pb-[0.1vw] pt-0 h-[3.5vh] min-w-[5.8vw]')} text-center shadow-sm`} style={{ backgroundColor: getLayoutColorRgba('search-bg-v2', '255, 255, 255', '1') }}>
                                    <span className={`${!isBigBars ? (isMobileLandscape ? 'text-[0.6vw]' : isTablet ? 'text-[0.5vw]' : 'text-[0.8vw]') : (isMobileLandscape ? 'text-[0.75vw]' : isTablet ? 'text-[0.6vw]' : 'text-[0.65vw]')} font-bold select-none whitespace-nowrap leading-none`} style={{ color: getLayoutColor('search-text-v1', '#555555') }}>Page </span>
                                    <input
                                        type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
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
                                        className={`${!isBigBars ? (isTablet ? 'text-[0.5vw] mx-[0.2vw] px-[0.1vw] py-[0.05vw]' : 'text-[0.8vw] mx-[0.4vw] px-[0.2vw] py-[0.1vw]') : (isTablet ? 'text-[0.6vw] mx-[0.3vw] px-[0.15vw] py-[0.05vw]' : 'text-[0.65vw] mx-[0.4vw] px-[0.2vw] py-[0.1vw]')} font-bold rounded-[0.2vw] outline-none text-center transition-colors shadow-inner leading-none`}
                                        style={{
                                            width: `${String(pages.length).length + 1.2}ch`,
                                            color: getLayoutColor('search-text-v1', '#555555'),
                                            opacity: 'var(--search-text-v1-opacity, 1)',
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
                                    <span className={`${!isBigBars ? (isMobileLandscape ? 'text-[0.6vw]' : isTablet ? 'text-[0.5vw]' : 'text-[0.8vw]') : (isMobileLandscape ? 'text-[0.75vw]' : isTablet ? 'text-[0.6vw]' : 'text-[0.65vw]')} font-bold select-none whitespace-nowrap leading-none`} style={{ color: getLayoutColor('search-text-v1', '#555555'), opacity: 'var(--search-text-v1-opacity, 1)' }}> / {totalPages}</span>
                                </div>
                            </div>
                        )}

                        {/* Center: Playback Control Group */}
                        <div className={`flex items-center ${isTablet ? 'gap-[0.8vw]' : 'gap-[1.5vw]'} transition-transform ${addTextBelowIcons ? '-translate-y-[0.7vh]' : ''} ${isBigBars ? 'translate-x-[4vw]' : 'translate-x-[1.5vw]'}`}>
                            {/* Previous Spread */}
                            {(settings?.navigation?.startEndNav ?? true) && renderToolbarBtn(
                                <Icon icon="lucide:skip-back" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />,
                                'First',
                                () => onPageClick(0),
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' },
                                'p-[0.3vw]',
                                false,
                                false,
                                'top'
                            )}
                            {/* Play/Pause */}
                            {(settings?.media?.autoFlip ?? true) && renderToolbarBtn(
                                <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isMobileLandscape ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />,
                                isAutoFlipping ? 'Pause' : 'Play',
                                () => setIsPlaying(!isAutoFlipping),
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' },
                                'p-[0.3vw]',
                                false,
                                false,
                                'top'
                            )}
                            {/* Next Spread */}
                            {(settings?.navigation?.startEndNav ?? true) && renderToolbarBtn(
                                <Icon icon="lucide:skip-forward" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />,
                                'Last',
                                () => onPageClick(totalPages - 1),
                                { color: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: 'var(--toolbar-icon-opacity, 1)' },
                                'p-[0.3vw]',
                                false,
                                false,
                                'top'
                            )}
                        </div>

                        {/* Right: Zoom Pill with Reset Button */}
                        <div className="flex items-center" style={{ visibility: (settings?.viewing?.zoom ?? true) ? 'visible' : 'hidden' }}>
                                <div className={`flex items-center ${!isBigBars ? 'px-[0.35vw] py-[0.15vw] pl-[0.45vw] rounded-[0.45vw]' : 'px-[0.3vw] py-[0.2vw] pl-[0.5vw] rounded-[0.4vw]'} border shadow-sm ${(settings?.viewing?.zoom ?? true) ? 'transition-all duration-300' : ''} ${!isBigBars ? 'gap-[0.2vw]' : (isSidebarOpen ? 'gap-[0.4vw]' : isTablet ? 'gap-[0.4vw]' : 'gap-[0.6vw]')}`}
                                    style={{
                                        backgroundColor: getLayoutColorRgba('search-bg-v2', '255, 255, 255', '1'),
                                        borderColor: getLayoutColorRgba('search-bg-v2', '255, 255, 255', '1')
                                    }}
                                >
                                    <div className={`flex items-center ${(settings?.viewing?.zoom ?? true) ? 'transition-all duration-300' : ''} ${!isBigBars ? 'gap-[0.2vw]' : (isSidebarOpen ? 'gap-[0.4vw]' : isTablet ? 'gap-[0.5vw]' : 'gap-[0.8vw]')}`}>
                                        {renderToolbarBtn(
                                            <Icon icon="lucide:zoom-out" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[0.7vw] h-[0.7vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />,
                                            'Zoom Out',
                                            () => zoomOut(),
                                            { color: getLayoutColor('search-text-v1', '#555555'), opacity: 'var(--search-text-v1-opacity, 1)' },
                                            '',
                                            false,
                                            true,
                                            'top'
                                        )}
                                        <span className={`font-bold ${!isBigBars ? (isTablet ? 'text-[0.55vw]' : 'text-[0.75vw]') : (isTablet ? 'text-[0.65vw]' : 'text-[0.7vw]')} tracking-tight tabular-nums select-none min-w-[2.0vw]`}
                                            style={{ color: getLayoutColor('search-text-v1', '#555555'), opacity: 'var(--search-text-v1-opacity, 1)' }}
                                        >
                                            {Math.round((dimWidth / initialWidth) * 100)}%
                                        </span>
                                        {renderToolbarBtn(
                                            <Icon icon="lucide:zoom-in" className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[0.7vw] h-[0.7vw]' : 'w-[1.1vw] h-[1.1vw]'}`} />,
                                            'Zoom In',
                                            () => zoomIn(),
                                            { color: getLayoutColor('search-text-v1', '#555555'), opacity: 'var(--search-text-v1-opacity, 1)' },
                                            '',
                                            false,
                                            true,
                                            'top'
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setDimWidth(isMobileLandscape ? initialWidth * 0.95 : isTablet ? initialWidth * 0.7 : initialWidth);
                                            setDimHeight(isMobileLandscape ? initialHeight * 0.9 : isTablet ? initialHeight * 0.7 : initialHeight);
                                        }}
                                        className={`${!isBigBars ? (isMobileLandscape ? 'text-[0.65vw] px-[0.4vw] py-[0.1vw]' : isTablet ? 'text-[0.45vw] px-[0.3vw] py-[0.1vw]' : 'text-[0.65vw] px-[0.5vw] py-[0.2vw]') : (isMobileLandscape ? 'text-[0.85vw] px-[0.8vw] py-[0.2vw]' : isTablet ? 'text-[0.55vw] px-[0.5vw] py-[0.2vw]' : 'text-[0.65vw] px-[0.5vw] py-[0.2vw]')} font-bold rounded-[0.25vw] transition-all shadow-sm active:scale-95`}
                                        style={{
                                            backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1'),
                                            color: getLayoutColor('toolbar-icon', '#FFFFFF'),
                                            opacity: 'var(--toolbar-icon-opacity, 1)'
                                        }}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>

                        <div
                            ref={progressRef}
                            className="absolute -bottom-[0.4vh] left-[15vw] right-[15vw] pt-[1.1vh] pb-[1.1vh] cursor-pointer group pointer-events-auto"
                            onClick={handleProgressClick}
                            onMouseMove={(e) => {
                                if (!progressRef.current || pages.length <= 1) return;
                                const rect = progressRef.current.getBoundingClientRect();
                                const x = e.clientX - rect.left;

                                if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                                progressHoverRef.current = requestAnimationFrame(() => {
                                    const boundedX = Math.max(0, Math.min(x, rect.width));
                                    const percentage = boundedX / rect.width;
                                    let targetIdx = Math.round(percentage * (pages.length - 1));

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
                            }}
                            onMouseLeave={() => {
                                if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                                setProgressHover(prev => ({ ...prev, visible: false }));
                            }}
                        >
                            <div className="h-[0.35vh] overflow-hidden rounded-full relative">
                                {/* Track Underlay (before fill) */}
                                <div
                                    className="absolute inset-0 transition-colors duration-300"
                                    style={{ backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: isTablet ? 0.4 : 0.3 }}
                                />
                                {/* Progress Fill (after fill) */}
                                <div
                                    className="h-full transition-all duration-300 ease-out relative z-10"
                                    style={{
                                        width: `${progressPercentage}%`,
                                        backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'),
                                        opacity: isTablet ? 1 : 'var(--toolbar-icon-opacity, 1)'
                                    }}
                                />
                            </div>

                            {/* Hover Popup - Matching Screenshot 1 UI */}
                            <AnimatePresence>
                                {progressHover.visible && progressHover.spread && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute z-[100] bottom-[calc(100%+1vw)] pointer-events-none"
                                        style={{ left: `${progressHover.x}px` }}
                                    >
                                        <div
                                            className={`relative flex flex-col items-center ${isTablet ? 'p-[0.5vw] rounded-[0.3vw]' : 'p-[0.7vw] rounded-[0.5vw]'} shadow-[0_1vw_3vw_rgba(0,0,0,0.2)] border border-white/10`}
                                            style={{
                                                transform: `translateX(${(progressHover.x / progressHover.rectWidth) < 0.1
                                                    ? -(progressHover.x / (progressHover.rectWidth * 0.1)) * 50
                                                    : (progressHover.x / progressHover.rectWidth) > 0.9
                                                        ? -50 - (((progressHover.x / progressHover.rectWidth) - 0.9) / 0.1) * 50
                                                        : -50}%)`,
                                                minWidth: isTablet ? '6vw' : '9vw',
                                                backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1'),
                                                fontFamily: "'Poppins', sans-serif"
                                            }}
                                        >
                                            {/* Label at Top (Screenshot 1 Style) */}
                                            <div className={`w-full ${isTablet ? 'mb-[0.35vw]' : 'mb-[0.5vw]'} text-center`}>
                                                <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.9vw]'} font-medium`} style={{ color: getLayoutColor('dropdown-text', '#555555'), opacity: 'var(--dropdown-text-opacity, 1)', fontFamily: "'Poppins', sans-serif" }}>
                                                    {progressHover.spread.label}
                                                </span>
                                            </div>

                                            {/* Preview Spread */}
                                            <div className={`relative overflow-hidden ${isTablet ? 'rounded-[0.15vw]' : 'rounded-[0.3vw]'} shadow-inner border border-gray-100`}>
                                                <div className="flex gap-0 bg-gray-200">
                                                    {progressHover.spread.pages.map((page, pIdx) => {
                                                        const boxHeight = isTablet ? 45 : 85;
                                                        const scale = boxHeight / dimHeight;
                                                        const boxWidth = dimWidth * scale;
                                                        return (
                                                            <div
                                                                key={`${progressHover.spread.indices[0]}-${pIdx}`}
                                                                className="bg-white overflow-hidden relative flex items-center justify-center shadow-sm"
                                                                style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
                                                            >
                                                                <PageThumbnail
                                                                    html={page.html || page.content}
                                                                    index={progressHover.spread.indices[pIdx]}
                                                                    scale={scale}
                                                                    baseWidth={dimWidth}
                                                                    baseHeight={dimHeight}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* In-Layout Thumbnails Bar overlay matching the exact Layout 3 spec */}
                {(settings?.navigation?.pageThumbnails ?? true) && showThumbnails && (() => {
                    let maxItems = 6;
                    let actualMaxItems = Math.min(maxItems, spreads.length);
                    let availableHeightVw = isTablet ? 2.5 : 4;
                    let pageRatio = dimWidth / dimHeight;
                    let singlePageWidthVw = availableHeightVw * pageRatio;
                    let onePixelVw = typeof window !== 'undefined' ? 100 / window.innerWidth : 0.05;
                    let doublePageInnerWidthVw = singlePageWidthVw * 2;
                    let thumbnailPaddingVw = isTablet ? 0.3 : 0.6; // p-[0.15vw] is 0.15*2, p-[0.3vw] is 0.3*2
                    let thumbnailOuterWidthVw = doublePageInnerWidthVw + thumbnailPaddingVw;
                    
                    let totalItemsWidthVw = actualMaxItems * thumbnailOuterWidthVw;
                    let gapWidthVw = isTablet ? 0.5 : 0.8;
                    let totalGapsVw = actualMaxItems > 1 ? (actualMaxItems - 1) * gapWidthVw : 0;
                    let scrollPaddingVw = isTablet ? 1.4 : 2.0; // px-[0.7vw] or px-[1vw]
                    let buttonsVw = spreads.length > maxItems ? (isTablet ? 2.6 : 3.2) : 0; // left and right buttons
                    
                    let dynamicMaxWidthVw = totalItemsWidthVw + totalGapsVw + scrollPaddingVw + buttonsVw + 1.5; // 1.5vw buffer for borders/rounding
                    
                    return (
                        <>
                            <div className="absolute inset-0 z-[100] bg-transparent" onClick={() => setShowThumbnails(false)} />
                            <div
                                className={`absolute z-[150] flex items-center pointer-events-auto transition-all ${isTablet ? 'top-[calc(6.5vh+0.4vw)] h-[4.5vw]' : 'top-[calc(7.5vh+0.4vw)] h-[6.5vw]'} left-1/2 -translate-x-1/2 rounded-[0.5vw] shadow-[0_0.2vw_1vw_rgba(0,0,0,0.15)] px-[0.4vw]`}
                                style={{
                                    width: 'fit-content',
                                    maxWidth: `${dynamicMaxWidthVw}vw`,
                                    backgroundColor: getLayoutColor('dropdown-bg', '#555555')
                                }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {spreads.length > maxItems && (
                                <button
                                    className={`${isTablet ? 'w-[1.3vw] h-[2.6vw]' : 'w-[1.6vw] h-[3.2vw]'} rounded-[0.3vw] ${canScrollLeft ? 'hover:opacity-80 cursor-pointer' : 'opacity-30 cursor-default'} flex items-center justify-center transition-all shrink-0 z-20`}
                                    style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                    onClick={(e) => { e.stopPropagation(); if (canScrollLeft) scroll('left'); }}
                                >
                                    <Icon icon="lucide:chevron-left" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                                </button>
                            )}

                            <div
                                ref={scrollRef}
                                onScroll={checkScroll}
                                className={`flex w-full ${spreads.length > maxItems ? 'overflow-x-auto justify-start' : 'overflow-x-hidden justify-center'} no-scrollbar scroll-smooth items-center h-full ${isTablet ? 'gap-[0.5vw] px-[0.7vw]' : 'gap-[0.8vw] px-[1vw]'}`}
                            >
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);
                                    const vwToPx = typeof window !== 'undefined' ? window.innerWidth / 100 : 19.2;
                                    const availableHeight = (isTablet ? 2.5 : 4) * vwToPx;
                                    const singlePageWidth = availableHeight * (dimWidth / dimHeight);
                                    const doublePageInnerWidth = singlePageWidth * 2;
                                    const thumbScale = availableHeight / dimHeight;

                                    return (
                                        <div key={idx} className={`thumbnail-item relative flex flex-col items-center shrink-0 cursor-pointer rounded-[0.3vw] ${isTablet ? 'p-[0.15vw]' : 'p-[0.3vw]'} border-[0.12vw] transition-all gap-[0.1vw]`}
                                            style={{
                                                width: 'fit-content',
                                                borderColor: isSelected ? getLayoutColor('dropdown-text', '#FFFFFF') : 'transparent',
                                                backgroundColor: isSelected ? getLayoutColor('dropdown-text', '#FFFFFF') : 'transparent'
                                            }}
                                            onClick={() => {
                                                onPageClick(spread.indices[0]);
                                            }}
                                        >
                                            <div className={`flex gap-0 ${isTablet ? 'h-[2.5vw]' : 'h-[4vw]'} overflow-hidden rounded-[0.15vw] justify-center shadow-sm`}
                                                style={{ width: `${doublePageInnerWidth}px`, backgroundColor: 'transparent' }}
                                            >
                                                {spread.pages.map((page, pIdx) => {
                                                    return (
                                                        <div key={`${idx}-${pIdx}`} className="bg-white overflow-hidden relative flex items-center justify-center" style={{ width: `${singlePageWidth}px`, flexShrink: 0 }}>
                                                            <PageThumbnail
                                                                html={page.html || page.content}
                                                                index={spread.indices[pIdx]}
                                                                scale={thumbScale}
                                                                baseWidth={dimWidth}
                                                                baseHeight={dimHeight}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <span className={`${isTablet ? 'text-[0.42vw]' : 'text-[0.55vw]'} font-bold tracking-tight relative z-10 pt-[0.2vw]`}
                                                style={{ color: isSelected ? getLayoutColor('dropdown-bg', '#555555') : getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                                {spread.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            {spreads.length > maxItems && (
                                <button
                                    className={`${isTablet ? 'w-[1.3vw] h-[2.6vw]' : 'w-[1.6vw] h-[3.2vw]'} rounded-[0.3vw] ${canScrollRight ? 'hover:opacity-80 cursor-pointer' : 'opacity-30 cursor-default'} flex items-center justify-center transition-all shrink-0 z-20`}
                                    style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                    onClick={(e) => { e.stopPropagation(); if (canScrollRight) scroll('right'); }}
                                >
                                    <Icon icon="lucide:chevron-right" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                                </button>
                            )}
                        </div>
                    </>
                ); })()}




            </div>
        </div>
    );
};

export default Grid3Layout;
