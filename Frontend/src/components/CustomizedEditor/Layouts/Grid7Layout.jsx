import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

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

// â”€â”€ Magnetic dock button (same as Layout1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MagneticDockBtn = ({ iconEl, label, onClick, extraStyle = {}, extraClassName = '', mousePos, isTablet, addTextBelowIcons, textFont }) => {
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
            className={`flex flex-col items-center justify-center relative z-[20] magnetic-dock-btn ${extraClassName || ''}`}
            style={{ ...extraStyle, border: 'none', outline: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }}
            onClick={(e) => { setShowTooltip(false); if (onClick) onClick(e); }}
        >
            <motion.div
                style={{ scale, transformOrigin: 'center 80%', willChange: 'transform' }}
                className="flex flex-col items-center justify-center"
                whileTap={{ scale: 0.91 }}
            >
                <motion.span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.3vw', padding: '0.18vw', background: glowBg }}>
                    {iconEl}
                </motion.span>
            </motion.div>
            {addTextBelowIcons && (
                <span
                    className={`${isTablet ? 'text-[0.45vw]' : 'text-[0.55vw]'} font-semibold mt-[0.15vw] leading-none whitespace-nowrap`}
                    style={{ color: extraStyle?.color || '#FFFFFF', fontFamily: textFont, opacity: extraStyle?.opacity || 1 }}
                >{label}</span>
            )}
            {showTooltip && !addTextBelowIcons && (
                <div
                    className="absolute bottom-full mb-[2.8vh] left-1/2 -translate-x-1/2 whitespace-nowrap"
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
                        zIndex: 150,
                    }}
                >
                    {label}
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-l-[0.35vw] border-r-[0.35vw] border-t-[0.45vw]"
                        style={{ borderTopColor: 'rgba(10, 10, 12, 0.55)' }}
                    />
                </div>
            )}
        </button>
    );
};
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Grid7Layout = ({
    children,
    settings,
    bookName,
    searchQuery,
    setSearchQuery,
    handleQuickSearch,
    setShowThumbnailBarMemo,
    showTOC,
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
    showProfilePopup,
    setShowProfilePopup,
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
    showGalleryPopup,
    setShowGalleryPopupMemo,
    showSoundPopup,
    setShowSoundPopupMemo,
    layoutColors,
    isTablet,
    isFullscreen: isFullscreenProp
,
    offset = 0,
}) => {
    const initialWidth = (children && children.props && children.props.WIDTH) ? children.props.WIDTH : 400;
    const initialHeight = (children && children.props && children.props.HEIGHT) ? children.props.HEIGHT : 566;

    const [dimWidth, setDimWidth] = useState(isTablet ? initialWidth * 0.9 : initialWidth);
    const [dimHeight, setDimHeight] = useState(isTablet ? initialHeight * 0.9 : initialHeight);

    const aspectRatio = initialHeight / initialWidth;
    const containerRef = React.useRef(null);

    // Reset dimensions to default when tablet mode changes or initial props change
    React.useEffect(() => {
        setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
        setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
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

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const isFullscreen = isFullscreenProp || false;
    const isCanvasHovered = false; const setIsCanvasHovered = () => {};

    // Track actual browser fullscreen (fires only when browser enters real fullscreen â€” 2nd click)
    const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
    useEffect(() => {
        const onFsChange = () => setIsBrowserFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const [dockMousePos, setDockMousePos] = useState(null);
    const [showThumbnails, setShowThumbnails] = useState(false);
    const thumbScrollRef = useRef(null);

    const closeAllPopups = () => {
        setShowTOCMemo?.(false);
        setShowThumbnails(false);
        setShowGalleryPopupMemo?.(false);
        setShowSoundPopupMemo?.(false);
        setShowProfilePopup?.(false);
    };

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);


    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    const spreads = useMemo(() => {
        const s = [];
        if (!pages || pages.length === 0) return s;

        // Page 1 (Front Cover)
        s.push({ label: 'Page 1', indices: [0], pages: [pages[0]] });

        // Middle spreads
        for (let i = 1; i < pages.length - 1; i += 2) {
            const indices = [i];
            const spreadPages = [pages[i]];
            if (i + 1 < pages.length) {
                indices.push(i + 1);
                spreadPages.push(pages[i + 1]);
            }
            s.push({
                label: indices.length > 1 ? `Page ${indices[0] + 1}-${indices[1] + 1}` : `Page ${indices[0] + 1}`,
                indices,
                pages: spreadPages
            });
        }

        // Last page (Back Cover) if not already included
        const lastIdx = pages.length - 1;
        if (lastIdx > 0 && !s.some(spread => spread.indices.includes(lastIdx))) {
            s.push({
                label: `Page ${lastIdx + 1}`,
                indices: [lastIdx],
                pages: [pages[lastIdx]]
            });
        }
        return s;
    }, [pages]);

    const progressHoverRef = useRef(null);
    const progressRef = useRef(null);
    const [progressHover, setProgressHover] = useState({
        visible: false,
        x: 0,
        pageIndex: 0,
        spread: null
    });

    const handleProgressMouseMove = (e) => {
        if (!progressRef.current || pagesCount <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
        progressHoverRef.current = requestAnimationFrame(() => {
            const boundedX = Math.max(0, Math.min(x, rect.width));
            const percentage = boundedX / rect.width;
            let targetIdx = Math.round(percentage * (pagesCount - 1));

            const activeSpread = spreads.find(s => s.indices.includes(targetIdx)) || spreads[0];

            setProgressHover({
                visible: true,
                x: boundedX,
                pageIndex: targetIdx,
                spread: activeSpread
            });
        });
    };

    const handleProgressClick = (e) => {
        if (!progressRef.current || pagesCount <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pagesCount - 1));
        onPageClick(targetIdx);
    };

    // Scroll active thumbnail into view when panel opens
    useEffect(() => {
        if (showThumbnails && thumbScrollRef.current) {
            const activeEl = thumbScrollRef.current.querySelector(`[data-thumb-index="${currentPage}"]`);
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [showThumbnails, currentPage]);

    const primaryColor = layoutColors?.primary || '#555555';
    const baseBgColor = layoutColors?.secondary || '#E3E4EF';

    const hexToRgba = (hex, opacity = 100) => {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        const a = 0.4 + (Math.max(0, Math.min(1, opacity / 100)) * 0.6);
        return a >= 1 ? hex : `rgba(${r},${g},${b},${a})`;
    };

    const getLayoutColor = (id, defaultColor) => {
        if (!layoutColors) return `var(--${id}, ${defaultColor})`;

        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorObj = layoutColors.find(c => c.id === id);
            if (!colorObj) return `var(--${id}, ${defaultColor})`;
            return hexToRgba(colorObj.hex, colorObj.opacity ?? 100);
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[8] && Array.isArray(layoutColors[8])) {
            const colorObj = layoutColors[8].find(c => c.id === id);
            if (!colorObj) return `var(--${id}, ${defaultColor})`;
            return hexToRgba(colorObj.hex, colorObj.opacity ?? 100);
        }

        return `var(--${id}, ${defaultColor})`;
    };

    const getLayoutOpacity = (id, defaultOpacity) => {
        if (!layoutColors) return defaultOpacity;

        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorObj = layoutColors.find(c => c.id === id);
            return colorObj ? Math.max(0.4, colorObj.opacity / 100) : defaultOpacity;
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[8] && Array.isArray(layoutColors[8])) {
            const colorObj = layoutColors[8].find(c => c.id === id);
            return colorObj ? Math.max(0.4, colorObj.opacity / 100) : defaultOpacity;
        }

        return defaultOpacity;
    };

    const getLayoutColorAlpha = (tokenId, defaultRgb, alpha) => {
        const color = getLayoutColor(tokenId, null) || getLayoutColor('toolbar-text-main', null);
        if (color && typeof color === 'string' && color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16) || 0;
            const g = parseInt(color.slice(3, 5), 16) || 0;
            const b = parseInt(color.slice(5, 7), 16) || 0;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgba(var(--${tokenId}-rgb, ${defaultRgb}), ${alpha})`;
    };

    // Toolbar display settings
    const addTextBelowIcons = settings?.toolbar?.addTextBelowIcons ?? false;
    const textFont = settings?.toolbar?.textProperties?.font || 'inherit';

    // Bottom bar sizes: keep consistent regardless of fullscreen mode
    const bbHeight = isTablet ? 'h-[5.5vh]' : 'h-[7vh]';
    const bbPt = 'pb-[1.5vh]';
    const bbGap = 'gap-[1.3vw]';
    const bbMb = addTextBelowIcons ? 'mb-[0vh] mt-[1.2vh]' : 'mb-[0vh] mt-[2.5vh]';
    const bbIconSm = isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]';
    const bbIconMid = isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.15vw] h-[1.15vw]';
    const bbIconLg = isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.25vw] h-[1.25vw]';
    const bbIconFul = isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.1vw] h-[1.1vw]';

    if (isTablet) {
        return <div className="w-full h-full bg-transparent flex items-center justify-center"></div>;
    }

    return (
        <div
            className="h-full w-full font-sans overflow-hidden relative"
            style={backgroundStyle}
            onClick={() => {
                setRecommendations([]);
                setShowSuggestions(false);
                setShowBookmarkOptions(false);
                setShowNotesOptions(false);
                closeAllPopups();
            }}
        >
            {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[80] bg-transparent" onClick={() => setShowSuggestions(false)} />}
            {/* Top Overlay Area */}
            <div
                className={`absolute ${isTablet ? 'top-[2vh]' : 'top-[3vh]'} left-[2vw] right-[2vw] flex items-center justify-between z-[100] pointer-events-none transition-all duration-500 ease-in-out`}
                style={{ opacity: isFullscreen && isCanvasHovered ? 0 : 1 }}
            >

                {/* Left: Search & Zoom */}
                <div className="flex-1 flex justify-start items-center gap-[1vw] pointer-events-auto">
                    {settings?.interaction?.search !== false && !isPdfProject && (
                        <div className={`relative ${showSuggestions && recommendations.length > 0 ? 'z-[90]' : 'z-50'}`} onClick={(e) => e.stopPropagation()}>
                            <div
                                className={`flex items-center rounded-full px-[1vw] py-[0.5vh] ${isTablet ? 'h-[3.2vh]' : 'h-[4vh]'} shadow-sm transition-all duration-300 ${isSidebarOpen ? (isTablet ? 'w-[7vw]' : 'w-[9vw]') : (isTablet ? 'w-[13vw]' : 'w-[16vw]')}`}
                                style={{ backgroundColor: '#FFFFFF' }}
                            >
                                <Icon icon="lucide:search" className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.1vw] h-[1.1vw]'}`} style={{ color: getLayoutColor('search-text-v1', primaryColor) }} />
                                <input
                                    type="text"
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
                                    placeholder="Quick Search..."
                                    className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} ml-[0.6vw] w-full font-medium`}
                                    style={{ color: getLayoutColor('search-text-v1', primaryColor) }}
                                />
                            </div>

                            <AnimatePresence>
                                {showSuggestions && recommendations.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute top-[5vh] left-0 bg-white rounded-[0.4vw] shadow-2xl w-[16vw] overflow-hidden border border-gray-100"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="px-[1vw] py-[0.8vh] border-b border-gray-100 bg-gray-50/50">
                                            <span className="text-[0.9vw] font-bold" style={{ color: primaryColor }}>Suggestion</span>
                                        </div>
                                        <div className="flex flex-col py-[0.5vh]">
                                            {recommendations.map((rec, idx) => (
                                                <button
                                                    key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                    className="flex items-center justify-between px-[1.2vw] py-[0.8vh] hover:bg-gray-50 transition-colors group"
                                                    style={{ color: primaryColor }}
                                                    onClick={() => {
                                                        onPageClick(rec.pageNumber - 1);
                                                        const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                        setLocalSearchQuery(fullQuery);
                                                        setSearchQuery(fullQuery);
                                                        setRecommendations([]);
                                                        setShowSuggestions(false);
                                                    }}
                                                >
                                                    <div className="flex flex-col items-start overflow-hidden flex-1 mr-[0.5vw]">
                                                        <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                            <span className="font-bold mr-[0.3vw]" style={{ fontWeight: 800 }}>{rec.word}</span>
                                                            {rec.context && <span className="font-normal opacity-70">{rec.context}</span>}
                                                        </span>
                                                    </div>
                                                    <span className="text-[0.8vw] font-medium opacity-50 tabular-nums shrink-0">Pg {rec.pageNumber}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Zoom Pill */}
                    {(settings?.viewing?.zoom ?? true) && (
                        <div
                            className={`flex items-center rounded-full px-[0.4vw] py-[0.5vh] ${isTablet ? 'h-[3.2vh]' : 'h-[4vh]'} shadow-sm pointer-events-auto`}
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                                className="hover:scale-110 ml-[0.5vw] transition-transform"
                                style={{ color: getLayoutColor('search-text-v1', primaryColor) }}
                            >
                                <Icon icon="lucide:zoom-out" className={`${isTablet ? 'w-[0.75vw] h-[0.75vw]' : 'w-[0.8vw] h-[0.8vw]'}`} />
                            </button>
                            <span className={`font-medium ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} min-w-[3vw] text-center pt-[0.1vh]`} style={{ color: getLayoutColor('search-text-v1', primaryColor) }}>
                                {Math.round((dimWidth / initialWidth) * 100)}%
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                                className="hover:scale-110 mr-[0.5vw] transition-transform"
                                style={{ color: getLayoutColor('search-text-v1', primaryColor) }}
                            >
                                <Icon icon="lucide:zoom-in" className={`${isTablet ? 'w-[0.75vw] h-[0.75vw]' : 'w-[0.8vw] h-[0.8vw]'}`} />
                            </button>
                            <button
                                onClick={() => {
                                    setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                    setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                                }}
                                className={`bg-white ${isTablet ? 'text-[0.65vw] px-[0.6vw]' : 'text-[0.8vw] px-[0.8vw]'} font-bold ${isTablet ? 'h-[2.4vh]' : 'h-[3vh]'} rounded-full flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm`}
                                style={{ color: getLayoutColor('search-text-v1', primaryColor) }}
                            >
                                Reset
                            </button>
                        </div>
                    )}
                </div>

                {/* Center Title */}
                <div className="flex-shrink-0 flex justify-center pointer-events-auto px-[1vw] max-w-[30vw]">
                    <h1 className={`${isTablet ? 'text-[0.9vw]' : 'text-[1.1vw]'} font-bold tracking-wide truncate`} style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        {/* bookName hidden */}
                    </h1>
                </div>

                {/* Right Logo */}
                <div className="flex-1 flex items-center justify-end pointer-events-auto shrink-0 min-w-[10vw]">
                    {(settings?.brandingProfile?.logo !== false) && logoSettings?.src && (
                        logoSettings.url ? (
                            <a 
                                href={logoSettings.url.startsWith('http') ? logoSettings.url : `https://${logoSettings.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-opacity hover:opacity-80"
                            >
                                <img
                                    src={logoSettings.src}
                                    alt="Logo"
                                    className={`${isTablet ? 'h-[2vw]' : 'h-[2.8vw]'} w-auto transition-opacity mr-[0.5vw]`}
                                    style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                                />
                            </a>
                        ) : (
                            <button className="transition-opacity hover:opacity-80 cursor-default">
                                <img
                                    src={logoSettings.src}
                                    alt="Logo"
                                    className={`${isTablet ? 'h-[2vw]' : 'h-[2.8vw]'} w-auto transition-opacity mr-[0.5vw]`}
                                    style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                                />
                            </button>
                        )
                    )}
                </div>
            </div>


            {/* Main Canvas */}
            <div className="absolute inset-0 flex justify-center items-center z-10 pt-[8vh] pb-[9vh]"
                onMouseMove={(e) => {
                    if (!isFullscreen) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const EDGE_ZONE = 72;
                    // Near edge: left edge, top edge, bottom edge, right edge
                    const nearEdge = x < EDGE_ZONE || y < EDGE_ZONE || y > rect.height - EDGE_ZONE || x > rect.width - EDGE_ZONE;
                    setIsCanvasHovered(!nearEdge);
                }}
                onMouseLeave={() => isFullscreen && setIsCanvasHovered(false)}
            >
                <div
                    className="transition-all duration-600 ease-in-out relative"
                    style={{
                        transform: `translateX(${localOffset}px) scale(1)`,
                        transformOrigin: 'center center'
                    }}
                >
                    {modifiedChildren}

                    {/* Left Navigate Button â€” hugs the visible page's left edge */}
                    {(settings?.navigation?.nextPrevButtons ?? true) && (
                        <button
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-full transition-all z-20 pointer-events-auto opacity-60 hover:opacity-100"
                            style={{ left: localOffset < 0 ? `calc(${dimWidth}px - 0.8vw)` : '-0.8vw', color: getLayoutColor('toolbar-bg', '#555555') }}
                            onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                        >
                            <Icon icon="lucide:chevron-left" strokeWidth={1} className={`${isTablet ? 'w-[1.8vw] h-[1.8vw]' : 'w-[2.5vw] h-[2.5vw]'} hover:-translate-x-1 transition-transform`} />
                        </button>
                    )}

                    {/* Right Navigate Button â€” hugs the visible page's right edge */}
                    {(settings?.navigation?.nextPrevButtons ?? true) && (
                        <button
                            className="absolute top-1/2 -translate-y-1/2 translate-x-full transition-all z-20 pointer-events-auto opacity-60 hover:opacity-100"
                            style={{ right: localOffset > 0 ? `calc(${dimWidth}px - 0.8vw)` : '-0.8vw', color: getLayoutColor('toolbar-bg', '#555555') }}
                            onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                        >
                            <Icon icon="lucide:chevron-right" strokeWidth={1} className={`${isTablet ? 'w-[1.8vw] h-[1.8vw]' : 'w-[2.5vw] h-[2.5vw]'} hover:translate-x-1 transition-transform`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Page Info Pill (Bottom Left) */}
            {(settings?.navigation?.pageQuickAccess ?? true) && (
                <div
                    className={`absolute left-[3vw] ${isTablet ? 'bottom-[9vh]' : 'bottom-[12vh]'} rounded-[0.4vw] ${isTablet ? 'px-[0.4vw] py-[0.15vw]' : 'px-[0.5vw] py-[0.2vw]'} shadow-sm z-[100] transition-all duration-500 ease-in-out ${isFullscreen ? (!isCanvasHovered ? 'pointer-events-auto' : 'pointer-events-none') : 'pointer-events-auto'}`}
                    style={{
                        backgroundColor: getLayoutColor('page-number-bg', getLayoutColor('toolbar-bg', '#555555')),
                        opacity: isFullscreen && isCanvasHovered ? 0 : 1
                    }}
                >
                    <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-medium`} style={{ color: getLayoutColor('page-number-text', getLayoutColor('toolbar-text-main', '#FFFFFF')) }}>Page </span>
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
                        className={`${isTablet ? 'text-[0.7vw] mx-[0.3vw] px-[0.15vw] py-[0.1vw]' : 'text-[0.8vw] mx-[0.4vw] px-[0.2vw] py-[0.15vw]'} font-medium rounded-[0.25vw] outline-none text-center transition-colors shadow-inner`}
                        style={{
                            color: getLayoutColor('page-number-text', getLayoutColor('toolbar-text-main', '#FFFFFF')), 
                            width: `${String(pages.length).length + 1.2}ch`,
                            backgroundColor: getLayoutColorAlpha('page-number-text', '255, 255, 255', 0.2),
                            border: `1px solid ${getLayoutColorAlpha('page-number-text', '255, 255, 255', 0.35)}`
                        }}
                        onFocus={(e) => {
                            e.target.style.backgroundColor = getLayoutColorAlpha('page-number-text', '255, 255, 255', 0.3);
                            e.target.style.borderColor = getLayoutColorAlpha('page-number-text', '255, 255, 255', 0.6);
                        }}
                        onMouseOver={(e) => {
                            if(document.activeElement !== e.target) {
                                e.target.style.backgroundColor = getLayoutColorAlpha('page-number-text', '255, 255, 255', 0.25);
                            }
                        }}
                        onMouseOut={(e) => {
                            if(document.activeElement !== e.target) {
                                e.target.style.backgroundColor = getLayoutColorAlpha('page-number-text', '255, 255, 255', 0.2);
                            }
                        }}
                    />
                    <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-medium`} style={{ color: getLayoutColor('page-number-text', getLayoutColor('toolbar-text-main', '#FFFFFF')) }}> / {totalPages}</span>
                </div>
            )}




            {/* Bottom Menu Bar â€” z-[105] so it sits on top of the thumbnail panel and tooltips work */}
            <div
                className={`absolute bottom-0 left-0 right-0 ${bbHeight} flex flex-col justify-center items-center ${bbPt} z-[105] transition-all duration-500 ease-in-out ${isFullscreen ? (!isCanvasHovered ? 'pointer-events-auto' : 'pointer-events-none') : 'pointer-events-auto'} shadow-[0_-5px_20px_rgba(0,0,0,0.05)]`}
                style={{
                    backgroundColor: getLayoutColor('toolbar-bg', '#555555'),
                    opacity: isFullscreen && isCanvasHovered ? 0 : 1
                }}
                onMouseMove={(e) => setDockMousePos({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setDockMousePos(null)}
            >
                <div className={`flex items-center ${bbGap} ${bbMb}`}>
                    {(settings?.navigation?.tableOfContents ?? true) && (
                        <MagneticDockBtn
                            iconEl={<Icon icon="fluent:text-bullet-list-24-filled" className={bbIconSm} />}
                            label="TOC"
                            onClick={(e) => {
                                e.stopPropagation();
                                const wasOpen = showTOC;
                                closeAllPopups();
                                if (!wasOpen) setShowTOCMemo?.(true);
                            }}
                            extraStyle={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            mousePos={dockMousePos}
                            isTablet={isTablet}
                            addTextBelowIcons={addTextBelowIcons}
                            textFont={textFont}
                        />
                    )}
                    {(settings?.navigation?.pageThumbnails ?? true) && (
                        <MagneticDockBtn
                            iconEl={<Icon icon="ph:squares-four-fill" className={bbIconSm} />}
                            label="Thumbnails"
                            onClick={(e) => {
                                e.stopPropagation();
                                const wasOpen = showThumbnails;
                                closeAllPopups();
                                if (!wasOpen) setShowThumbnails(true);
                            }}
                            extraStyle={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            mousePos={dockMousePos}
                            isTablet={isTablet}
                            addTextBelowIcons={addTextBelowIcons}
                            textFont={textFont}
                        />
                    )}
                    {(settings?.interaction?.gallery ?? true) && (
                        <MagneticDockBtn
                            iconEl={<Icon icon="clarity:image-gallery-solid" className={bbIconSm} />}
                            label="Gallery"
                            onClick={(e) => {
                                e.stopPropagation();
                                const wasOpen = showGalleryPopup;
                                closeAllPopups();
                                if (!wasOpen) setShowGalleryPopupMemo?.(true);
                            }}
                            extraStyle={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            mousePos={dockMousePos}
                            isTablet={isTablet}
                            addTextBelowIcons={addTextBelowIcons}
                            textFont={textFont}
                        />
                    )}

                    <div className="w-[0.5vw]" />

                    {(settings?.navigation?.startEndNav ?? true) && (
                        <MagneticDockBtn
                            iconEl={<Icon icon="ph:skip-back" className={bbIconMid} />}
                            label="First Page"
                            onClick={() => { closeAllPopups(); onPageClick(0); }}
                            extraStyle={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            mousePos={dockMousePos}
                            isTablet={isTablet}
                            addTextBelowIcons={addTextBelowIcons}
                            textFont={textFont}
                        />
                    )}
                    {(settings?.media?.autoFlip ?? true) && (
                        <MagneticDockBtn
                            iconEl={<Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={bbIconLg} />}
                            label={isAutoFlipping ? 'Pause' : 'Play'}
                            onClick={() => { closeAllPopups(); setIsPlaying(!isAutoFlipping); }}
                            extraStyle={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            mousePos={dockMousePos}
                            isTablet={isTablet}
                            addTextBelowIcons={addTextBelowIcons}
                            textFont={textFont}
                        />
                    )}
                    {(settings?.navigation?.startEndNav ?? true) && (
                        <MagneticDockBtn
                            iconEl={<Icon icon="ph:skip-forward" className={bbIconMid} />}
                            label="Last Page"
                            onClick={() => { closeAllPopups(); onPageClick(totalPages - 1); }}
                            extraStyle={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            mousePos={dockMousePos}
                            isTablet={isTablet}
                            addTextBelowIcons={addTextBelowIcons}
                            textFont={textFont}
                        />
                    )}

                    <div className="w-[0.5vw]" />

                    {(settings?.media?.backgroundAudio ?? true) && (
                        <MagneticDockBtn
                            iconEl={<Icon icon="solar:music-notes-bold" className={bbIconSm} />}
                            label="Sound"
                            onClick={(e) => {
                                e.stopPropagation();
                                const wasOpen = showSoundPopup;
                                closeAllPopups();
                                if (!wasOpen) setShowSoundPopupMemo?.(true);
                            }}
                            extraStyle={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            mousePos={dockMousePos}
                            isTablet={isTablet}
                            addTextBelowIcons={addTextBelowIcons}
                            textFont={textFont}
                        />
                    )}
                    {(settings?.brandingProfile?.profile ?? true) && (
                        <MagneticDockBtn
                            iconEl={<Icon icon="fluent:person-24-filled" className={bbIconSm} />}
                            label="Profile"
                            onClick={(e) => {
                                e.stopPropagation();
                                const wasOpen = showProfilePopup;
                                closeAllPopups();
                                if (!wasOpen) setShowProfilePopup?.(true);
                            }}
                            extraStyle={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            mousePos={dockMousePos}
                            isTablet={isTablet}
                            addTextBelowIcons={addTextBelowIcons}
                            textFont={textFont}
                        />
                    )}
                    {(settings?.shareExport?.share ?? true) && (
                        <MagneticDockBtn
                            iconEl={<Icon icon="mage:share-fill" className={bbIconSm} />}
                            label="Share"
                            onClick={(e) => { e.stopPropagation(); closeAllPopups(); handleShare(); }}
                            extraStyle={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            mousePos={dockMousePos}
                            isTablet={isTablet}
                            addTextBelowIcons={addTextBelowIcons}
                            textFont={textFont}
                        />
                    )}
                    {(settings?.shareExport?.download ?? true) && (
                        <MagneticDockBtn
                            iconEl={<Icon icon="meteor-icons:download" className={bbIconSm} />}
                            label="Download"
                            onClick={(e) => { e.stopPropagation(); closeAllPopups(); handleDownload(); }}
                            extraStyle={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                            mousePos={dockMousePos}
                            isTablet={isTablet}
                            addTextBelowIcons={addTextBelowIcons}
                            textFont={textFont}
                        />
                    )}
                    {(settings?.viewing?.fullScreen ?? true) && <MagneticDockBtn
                        iconEl={<Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={bbIconFul} />}
                        label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        onClick={(e) => { e.stopPropagation(); closeAllPopups(); handleFullScreen(); }}
                        extraStyle={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        mousePos={dockMousePos}
                        isTablet={isTablet}
                        addTextBelowIcons={addTextBelowIcons}
                        textFont={textFont}
                    />}
                </div>

                {/* Progress Bar */}
                <div
                    ref={progressRef}
                    className={`${isTablet ? 'w-[30vw]' : 'w-[40vw]'} ${addTextBelowIcons ? 'mt-[0.2vw]' : 'mt-0'} h-[2vw] flex items-center relative cursor-pointer`}
                    onMouseMove={handleProgressMouseMove}
                    onMouseLeave={() => {
                        if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                        setProgressHover(prev => ({ ...prev, visible: false }));
                    }}
                    onClick={handleProgressClick}
                >
                    <div className="w-full h-[0.5vh] rounded-full relative overflow-visible">
                        {/* Track Underlay (before fill) â€” matches Layout 1 shade */}
                        <div
                            className="absolute inset-0 rounded-full transition-colors duration-300"
                            style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), opacity: 0.3 }}
                        />
                        {/* Progress Fill (after fill) â€” matches Layout 1 */}
                        <div
                            className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 pointer-events-none z-10"
                            style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), width: `${progressPercentage}%` }}
                        />

                        {/* Hover Popup - Style matches attached screenshot 1 */}
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
                                        className={`absolute bottom-0 flex flex-col items-center shadow-[0_10px_40px_rgba(0,0,0,0.3)] overflow-hidden`}
                                        style={{
                                            borderRadius: isTablet ? '0.6vw' : '0.8vw',
                                            transform: progressHover.pageIndex === 0 ? 'translateX(-25%)' : 'translateX(-50%)',
                                            minWidth: isTablet ? '7vw' : '9vw',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        {/* Header Bar - Dark Blue as in screenshot 1 */}
                                        <div
                                            className="w-full flex justify-center items-center py-[0.5vh] px-[1vw]"
                                            style={{ backgroundColor: getLayoutColor('toolbar-bg', '#555555') }}
                                        >
                                            <span
                                                className="font-bold whitespace-nowrap text-white"
                                                style={{ fontSize: isTablet ? '0.7vw' : '0.85vw' }}
                                            >
                                                {progressHover.spread.label}
                                            </span>
                                        </div>

                                        {/* Body Area with Thumbnail */}
                                        <div className="p-[0.5vw] flex flex-col items-center">
                                            <div
                                                className="flex justify-center overflow-hidden rounded-[0.3vw] shadow-inner"
                                                style={{
                                                    width: `${((dimWidth || 400) * (isTablet ? 50 : 70) / (dimHeight || 566)) * progressHover.spread.pages.length}px`,
                                                    backgroundColor: '#f3f4f6'
                                                }}
                                            >
                                                <div className="flex gap-0 bg-gray-100 justify-center w-full h-full">
                                                    {progressHover.spread.pages.map((page, pIdx) => {
                                                        const pageWidth = dimWidth || 400;
                                                        const pageHeight = dimHeight || 566;
                                                        const boxHeight = isTablet ? 50 : 70;
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

                                        {/* Downward Arrow */}
                                        <div
                                            className="absolute top-[99%] left-1/2 -translateX-1/2 pointer-events-none"
                                            style={{
                                                width: isTablet ? '1vw' : '1.3vw',
                                                height: isTablet ? '0.7vw' : '0.9vw',
                                                filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15))'
                                            }}
                                        >
                                            <svg width="100%" height="100%" viewBox="0 0 20 15" preserveAspectRatio="none">
                                                <path
                                                    d="M0 0 L10 15 L20 0"
                                                    fill="white"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* â”€â”€ Thumbnail Panel â€” moved to end of DOM to prevent flex flow interference â”€â”€ */}
            <AnimatePresence>
                {(settings?.navigation?.pageThumbnails ?? true) && showThumbnails && (
                    <motion.div
                        key="thumb-panel"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="fixed z-[101] rounded-t-[0.8vw] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            left: isFullscreen ? '25vw' : (isSidebarOpen ? '43.5vw' : '34vw'),
                            right: isFullscreen ? '25vw' : (isSidebarOpen ? '6.5vw' : '16vw'),
                            bottom: isTablet ? '5.5vh' : '7vh',
                            backgroundColor: '#FFFFFF',
                            maxHeight: '45vh',
                            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
                            backdropFilter: 'none',
                            opacity: 1,
                            transition: 'left 0.3s ease, right 0.3s ease'
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-[1.5vw] py-[0.8vh] relative"
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#555555') }}
                        >
                            <span className="text-[0.9vw] font-semibold tracking-wide" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Thumbnails</span>

                            {/* Drag handle */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                                <div className="w-[3vw] h-[0.22vh] rounded-full" style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.3 }} />
                            </div>

                            <button
                                onClick={() => setShowThumbnails(false)}
                                className="hover:scale-110 transition-all"
                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.7 }}
                            >
                                <Icon icon="lucide:x" className="w-[1.1vw] h-[1.1vw]" />
                            </button>
                        </div>

                        {/* Scrollable thumbnail row */}
                        <div
                            ref={thumbScrollRef}
                            className="flex flex-wrap gap-[1vw] px-[1.2vw] py-[1.5vh] pb-[2vh] overflow-y-auto max-h-[35vh]"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }}
                        >
                            {spreads.map((spread, idx) => {
                                const isSelected = spread.indices.includes(currentPage);
                                const vw = typeof window !== 'undefined' ? window.innerWidth / 100 : 19.2;
                                const pageWidth = dimWidth || 400;
                                const pageHeight = dimHeight || 566;
                                const availableHeightVw = 4.5;
                                const availableHeightPx = availableHeightVw * vw;
                                const thumbScale = availableHeightPx / pageHeight;
                                const scaledWidthPx = pageWidth * thumbScale;
                                const totalWidthPx = scaledWidthPx * 2;
                                
                                return (
                                    <div
                                        key={idx}
                                        data-thumb-index={idx}
                                        onClick={() => { onPageClick(spread.indices[0]); setShowThumbnails(false); }}
                                        className="flex-shrink-0 flex flex-col items-center gap-[0.5vh] cursor-pointer group"
                                    >
                                        <div
                                            className="rounded-[0.3vw] overflow-hidden transition-all duration-200 flex justify-center"
                                            style={{
                                                width: `${totalWidthPx + (0.3 * vw)}px`, // padding included
                                                height: `${availableHeightVw + 0.3}vw`, // padding included
                                                border: isSelected ? `0.15vw solid ${getLayoutColor('dropdown-bg', '#555555')}` : '0.15vw solid transparent',
                                                boxShadow: isSelected ? `0 0 0 0.15vw ${getLayoutColor('dropdown-bg', '#555555')}` : '0 0.2vw 0.5vw rgba(0,0,0,0.15)',
                                                padding: '0.15vw',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <div className="w-full h-full overflow-hidden bg-gray-100 rounded-[0.15vw] relative flex items-center justify-center gap-0">
                                                {spread.pages.map((page, pIdx) => (
                                                    <div key={`${idx}-${pIdx}`} className="bg-white overflow-hidden relative flex items-center justify-center border-0" style={{ width: `${scaledWidthPx}px`, height: '100%' }}>
                                                        <PageThumbnail
                                                            html={page.html || page.content || ''}
                                                            index={spread.indices[pIdx]}
                                                            scale={thumbScale}
                                                            baseWidth={pageWidth}
                                                            baseHeight={pageHeight}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-[0.65vw] font-medium transition-colors" style={{ color: getLayoutColor('dropdown-bg', '#555555'), opacity: isSelected ? 1 : 0.6 }}>
                                            {spread.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Grid7Layout;

