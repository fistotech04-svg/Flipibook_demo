import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';


import TableOfContentsPopup from '../popups/TableOfContentsPopup';

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
                    body { margin: 0; padding: 0; overflow: hidden; background: white; width: ${baseWidth}px; height: ${baseHeight}px; position: relative; }
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
        <div className="w-full h-full relative overflow-hidden bg-white flex items-center justify-center">
            <iframe
                className="border-none pointer-events-none"
                srcDoc={srcDoc}
                title={`Thumb ${index}`}
                loading="lazy"
                style={{
                    width: `${baseWidth}px`,
                    height: `${baseHeight}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    backgroundColor: 'white'
                }}
            />
        </div>
    );
});

const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;
const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), calc(var(--${id}-opacity, 1) * ${defaultOpacity}))`;
};

const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
};


const getLayoutOpacity = (id, defaultOpacity) => `calc(var(--${id}-opacity, 1) * ${defaultOpacity})`;

const TopMagneticDockBtn = ({ iconEl, label, onClick, extraStyle = {}, extraClassName = '', mousePos, addTextBelowIcons, isMobileLandscape, isTablet, textFont, hideTooltip = false }) => {
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
                style={{ scale, transformOrigin: 'center 20%', willChange: 'transform' }}
                className="flex flex-col items-center justify-center"
                whileTap={{ scale: 0.91 }}
            >
                <motion.span style={{ display: 'inline-flex', alignItems: 'center', justifycontent: 'center', borderRadius: '0.3vw', padding: '0.18vw', background: glowBg }}>
                    {React.cloneElement(iconEl, { className: `${iconEl.props.className || ''} ${isMobileLandscape ? '!w-[0.7vw] !h-[0.7vw]' : ''}` })}
                </motion.span>
            </motion.div>
            {addTextBelowIcons && (
                <span
                    className={`${isMobileLandscape ? 'text-[0.35vw]' : isTablet ? 'text-[0.35vw]' : 'text-[0.55vw]'} font-medium mt-[0.15vw] leading-none whitespace-nowrap`}
                    style={{ color: extraStyle?.color || '#FFFFFF', fontFamily: textFont, opacity: extraStyle?.opacity || 1 }}
                >{label}</span>
            )}

            {/* Custom tooltip for top bar (appears below button, unaffected by scale transform) */}
            {showTooltip && !hideTooltip && !addTextBelowIcons && (
                <div
                    className="absolute top-full mt-[2.8vh] left-1/2 -translate-x-1/2 whitespace-nowrap"
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
                    {/* CSS Triangle Arrow pointing upwards at bottom-full */}
                    <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-l-[0.35vw] border-r-[0.35vw] border-b-[0.45vw]"
                        style={{ borderBottomColor: 'rgba(10, 10, 12, 0.55)' }}
                    />
                </div>
            )}
        </button>
    );
};

const Grid2Layout = ({
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
    bookRef,
    pages,
    setIsPlaying,
    isAutoFlipping,
    handleShare,
    handleDownload,
    handleFullScreen,
    isFullscreen = false,
    logoSettings,
    currentPage,
    pagesCount,
    currentZoom,
    setCurrentZoom,
    onPageClick,
    offset,
    notes,
    onAddNote,
    bookmarks,
    onAddBookmark,
    onDeleteBookmark,
    onUpdateBookmark,
    profileSettings,
    showProfilePopup,
    setShowProfilePopup,
    setShowViewBookmarkPopup,
    setShowNotesViewerMemo,
    isSidebarOpen,
    isTablet,
    backgroundSettings,
    backgroundStyle,
    isMuted,
    onToggleAudio,
    showSoundPopup,
    setShowSoundPopupMemo,
    setShowGalleryPopupMemo,
    showGalleryPopup,
    showSharePopup,
    showExportPopup,
    activeLayout,
    isMobile,
    isMobileLandscape = false,
    showTOC,
    showThumbnailBar,
    ...restProps
}) => {
    // If mobile view is active, delegate entirely to MobileLayout2
    if (isMobile) {
        return (
            <MobileLayout2
                {...restProps}
                settings={settings}
                bookName={bookName}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleQuickSearch={handleQuickSearch}
                setShowThumbnailBar={setShowThumbnailBarMemo}
                setShowTOC={setShowTOCMemo}
                setShowAddNotesPopup={setShowAddNotesPopupMemo}
                setShowAddBookmarkPopup={setShowAddBookmarkPopupMemo}
                setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                setShowNotesViewer={setShowNotesViewerMemo}
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
                notes={notes}
                onAddNote={onAddNote}
                onDeleteBookmark={onDeleteBookmark}
                onUpdateBookmark={onUpdateBookmark}
                onAddBookmark={onAddBookmark}
                profileSettings={profileSettings}
                activeLayout={activeLayout}
                showSoundPopup={showSoundPopup}
                setShowSoundPopup={setShowSoundPopupMemo}
                isMuted={isMuted}
                onToggleAudio={onToggleAudio}
                setShowGalleryPopup={setShowGalleryPopupMemo}
            />
        );
    }
    const initialWidth = (children && children.props && children.props.WIDTH) ? children.props.WIDTH : 400;
    const initialHeight = (children && children.props && children.props.HEIGHT) ? children.props.HEIGHT : 566;

    const [dimWidth, setDimWidth] = useState(isTablet ? initialWidth * 0.7 : initialWidth);
    const [dimHeight, setDimHeight] = useState(isTablet ? initialHeight * 0.7 : initialHeight);
    const aspectRatio = initialHeight / initialWidth;

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

    const modifiedChildren = React.useMemo(() => {
        if (!children) return null;
        return React.cloneElement(children, {
            WIDTH: dimWidth,
            HEIGHT: dimHeight,
            buildPageDoc: localBuildPageDoc
        });
    }, [children, dimWidth, dimHeight, localBuildPageDoc]);

    const [activePopup, setActivePopup] = useState(null);
    
    // Automatically close popups if their corresponding setting is disabled
    useEffect(() => {
        if (activePopup === 'thumbnails' && !(settings?.navigation?.pageThumbnails ?? true)) {
            setActivePopup(null);
        }
        if (activePopup === 'toc' && !(settings?.navigation?.tableOfContents ?? true)) {
            setActivePopup(null);
        }
        if (activePopup === 'profile' && !(settings?.brandingProfile?.profile ?? true)) {
            setActivePopup(null);
        }
    }, [settings?.navigation, settings?.brandingProfile, activePopup]);

    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [radialScroll, setRadialScroll] = useState(0);
    const [recommendations, setRecommendations] = useState([]);
    const containerRef = React.useRef(null);
    const [responsiveScale, setResponsiveScale] = useState(1);

    // --- Fullscreen toolbar hide/show (mirrors Grid1Layout) ---
    const isCanvasHovered = false; const setIsCanvasHovered = () => { };
    const savedZoomRef = React.useRef(null);
    const zoomTimerRef = React.useRef(null);
    const dimWidthRef = React.useRef(dimWidth);
    React.useEffect(() => { dimWidthRef.current = dimWidth; }, [dimWidth, offset]);

    // Sync isCanvasHovered to true as soon as we enter fullscreen
    const [prevFS, setPrevFS] = useState(isFullscreen);
    if (isFullscreen !== prevFS) {
        setPrevFS(isFullscreen);
        if (isFullscreen) setIsCanvasHovered(true);
    }

    // Auto-zoom when toolbar hides in fullscreen, restore when toolbar shows
    React.useEffect(() => {
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

    // Responsive scaling for Mobile Landscape
    React.useEffect(() => {
        if (!isMobileLandscape) {
            setResponsiveScale(1);
            return;
        }

        const updateScale = () => {
            if (containerRef.current) {
                const cw = containerRef.current.clientWidth;
                const ch = containerRef.current.clientHeight;

                // Use a safety margin (95% of available space) to prevent clipping
                const availableW = cw * 0.95;
                const availableH = ch * 0.95;

                // Spread dimensions (assuming 2 pages)
                const baseSpreadW = (initialWidth * (isTablet ? 0.7 : 1)) * 2;
                const baseSpreadH = initialHeight * (isTablet ? 0.7 : 1);

                const scaleX = availableW / baseSpreadW;
                const scaleY = availableH / baseSpreadH;

                // Take the minimum scale to ensure it fits both width and height
                const fitScale = Math.min(scaleX, scaleY);
                setResponsiveScale(fitScale);
            }
        };

        // Initial update after a short delay to ensure DOM is settled
        const timer = setTimeout(updateScale, 300);

        window.addEventListener('resize', updateScale);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateScale);
        };
    }, [isMobileLandscape, isTablet, initialWidth, initialHeight]);

    // Prevent body scroll when radial dial is open
    React.useEffect(() => {
        if (activePopup === 'thumbnails') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [activePopup]);

    const handleRadialWheel = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        setRadialScroll(prev => {
            const shift = e.deltaY > 0 ? 1 : -1;
            if (spreads.length <= 7) {
                const nextFocus = activeSpreadIdx + prev + shift;
                if (nextFocus < 0) return -activeSpreadIdx;
                if (nextFocus > spreads.length - 1) return spreads.length - 1 - activeSpreadIdx;
            }
            return prev + shift;
        });
    };

    // Detect if the current book is a PDF project
    const isPdfProject = pages?.some(p => p.html && p.html.includes('data-name="PDF Background"'));

    // Grouping logic for spreads
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

    const closeAllPopups = React.useCallback(() => {
        setActivePopup(null);
        setShowTOCMemo?.(false);
        setShowSoundPopupMemo?.(false);
        setShowGalleryPopupMemo?.(false);
        setShowProfilePopup?.(false);
        setRecommendations([]);
    }, [setShowTOCMemo, setShowSoundPopupMemo, setShowGalleryPopupMemo, setShowProfilePopup]);

    const togglePopup = (popup, e) => {
        if (e) e.stopPropagation();
        const isOpening = activePopup !== popup;

        if (isOpening) {
            closeAllPopups();
            setActivePopup(popup);
        } else {
            setActivePopup(null);
        }
    };

    const [hoveredDotIdx, setHoveredDotIdx] = useState(null);
    const [dockMousePos, setDockMousePos] = useState(null);
    const [direction, setDirection] = useState('forward');
    const [prevPage, setPrevPage] = useState(currentPage);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    useEffect(() => {
        if (currentPage > prevPage) {
            setDirection('forward');
        } else if (currentPage < prevPage) {
            setDirection('backward');
        }
        setPrevPage(currentPage);
    }, [currentPage]);

    const activeSpreadIdx = useMemo(() => {
        return spreads.findIndex(s => s.indices.includes(currentPage));
    }, [spreads, currentPage]);

    // Toolbar display settings
    const addTextBelowIcons = settings?.toolbar?.addTextBelowIcons ?? false;
    const textFont = settings?.toolbar?.textProperties?.font || 'inherit';

    // Helper: renders an icon button with optional text label below
    const renderToolbarBtn = (iconEl, label, onClick, extraStyle = {}, extraClassName = '', hideTooltip = false) => (
        <TopMagneticDockBtn
            iconEl={iconEl}
            label={label}
            onClick={onClick}
            extraStyle={extraStyle}
            extraClassName={extraClassName}
            mousePos={dockMousePos}
            addTextBelowIcons={addTextBelowIcons}
            isMobileLandscape={isMobileLandscape}
            isTablet={isTablet}
            textFont={textFont}
            hideTooltip={hideTooltip}
        />
    );

    // Radial Dial Configuration (Shared between dial and preview)
    // Always use the exact set of spreads â€” no repetition.
    // Use a fixed compact angle step (26Â°) so segments stay near each other
    // regardless of how few pages the book has. For large books (many spreads),
    // scale the step down so segments don't overlap.
    const radialConfig = useMemo(() => {
        if (!spreads || spreads.length === 0) return { displaySpreads: [], angleStep: 26 };

        const displaySpreads = [...spreads];
        // Fixed compact step: ~26° keeps segments visually touching.
        // Always use fixed spacing so pages don't get crushed when there are many pages!
        const compactStep = 26;
        const angleStep = compactStep;

        return { displaySpreads, angleStep };
    }, [spreads]);

    const { displaySpreads, angleStep } = radialConfig;

    useEffect(() => {
        if (activePopup === 'thumbnails') {
            setRadialScroll(0); // Reset scroll offset when opening
        }
    }, [activePopup]);

    // Ensure the radial dial always stays in sync with the open page
    // If the user navigates the book via arrows or clicking, reset any independent dial scrolling
    useEffect(() => {
        setRadialScroll(0);
    }, [activeSpreadIdx]);

    return (
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative" style={backgroundStyle} onClick={() => closeAllPopups()}>
            {/* Layout 2 Header */}
            <div className={isFullscreen ? 'absolute top-0 left-0 w-full z-[1000] bg-transparent' : 'shrink-0'}>
                <div
                    className={`${isMobileLandscape ? 'h-[6vh] pt-[0.5vh]' : isTablet ? 'h-[6vh]' : (isFullscreen ? 'h-[7vh]' : 'h-[6.5vh]')} flex items-center justify-between px-[2vw] w-full z-[1001] border-b border-white/5 transition-all duration-500 ease-in-out ${isFullscreen ? `absolute top-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`}
                    style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1') }}
                    onMouseMove={(e) => setDockMousePos({ x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setDockMousePos(null)}
                >
                    {/* Left: Search Bar */}
                    <div className={`flex items-center transition-transform duration-300 ${isMobileLandscape ? 'ml-[1.5vw]' : ''} ${isSidebarOpen && !isMobileLandscape ? '-translate-x-[1vw]' : ''}`}>
                        {(settings?.interaction?.search ?? true) && !isPdfProject && (
                            <div className="relative">
                                <div
                                    className={`flex items-center transition-all duration-300 border border-transparent ${isMobileLandscape ? 'w-[8.8vw] h-[1.5vw] px-[0.5vw] mt-[0.5vw]' : isTablet ? 'w-[10vw] px-[0.6vw] py-[0.25vw]' : isSidebarOpen ? 'w-[11.5vw] px-[0.8vw] py-[0.3vw]' : 'w-[15vw] px-[1vw] py-[0.35vw]'} group ${isMobileLandscape ? 'rounded-full' : isTablet ? 'rounded-[0.5vw]' : 'rounded-[0.7vw]'} relative z-20`}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                                >
                                    <style>{`
                                    #quick-search-v1-${activeLayout}::placeholder {
                                        color: ${getLayoutColor('toolbar-bg', '#555555')} !important;
                                        opacity: 0.8;
                                    }
                                `}</style>
                                    <Icon
                                        icon="lucide:search"
                                        className={`${isMobileLandscape ? 'w-[0.6vw] h-[0.6vw] shrink-0' : isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1.1vw] h-[1.1vw]'}`}
                                        style={{ color: getLayoutColor('toolbar-bg', '#555555'), opacity: 0.8 }}
                                    />
                                    <input
                                        type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
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
                                        id={`quick-search-v1-${activeLayout}`}
                                        placeholder="Quick Search..."
                                        className={`bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ${isMobileLandscape ? 'text-[0.6vw] ml-[0.3vw] p-0' : isTablet ? 'text-[0.6vw] ml-[0.65vw]' : 'text-[0.85vw] ml-[0.65vw]'} w-full font-medium`}
                                        style={{ color: getLayoutColor('toolbar-bg', '#555555'), fontFamily: textFont }}
                                    />
                                </div>

                                {/* Detached Recommendations Dropdown with extended top height behind search bar */}
                                {recommendations.length > 0 && (
                                    <div
                                        className={`absolute top-[50%] left-0 w-full animate-in fade-in slide-in-from-top-1 duration-200 transition-all z-10`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div
                                            className={`${isMobileLandscape ? 'rounded-b-[0.8vw] px-[0.4vw] pb-[0.2vw] pt-[1.8vw]' : isTablet ? 'rounded-b-[0.8vw] px-[0.5vw] pb-[0.25vw] pt-[1.8vw]' : 'rounded-b-[1.3vw] px-[0.7vw] pb-[0.4vw] pt-[2.8vw]'} border border-transparent relative overflow-hidden`}
                                            style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                        >
                                            <div className={`relative z-10 ${isMobileLandscape ? 'rounded-[0.5vw]' : isTablet ? 'rounded-[0.6vw]' : 'rounded-[0.9vw]'} overflow-hidden`}>
                                                <div
                                                    className={`${isMobileLandscape ? 'rounded-[0.5vw]' : isTablet ? 'rounded-[0.6vw]' : 'rounded-[0.9vw]'} overflow-hidden`}
                                                    style={{ backgroundColor: getLayoutColor('dropdown-bg', '#555555') }}
                                                >
                                                    <div className={`flex flex-col ${isMobileLandscape ? 'py-[0.2vw]' : isTablet ? 'py-[0.25vw]' : 'py-[0.4vw]'}`}>
                                                        {recommendations.map((rec, idx) => (
                                                            <button
                                                                key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                                className={`flex items-center justify-between ${isMobileLandscape ? 'px-[0.6vw] py-[0.3vw]' : isTablet ? 'px-[0.6vw] py-[0.4vw]' : 'px-[1vw] py-[0.6vw]'} hover:opacity-70 transition-opacity group`}
                                                                onClick={() => {
                                                                    onPageClick(rec.pageNumber - 1);
                                                                    const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                                    setLocalSearchQuery(fullQuery);
                                                                    setSearchQuery(fullQuery);
                                                                    setRecommendations([]);
                                                                }}
                                                            >
                                                                <div className="flex flex-col items-start overflow-hidden flex-1 mr-[0.5vw]">
                                                                    <span className={`${isMobileLandscape ? 'text-[0.55vw]' : isTablet ? 'text-[0.55vw]' : 'text-[0.85vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                                        <span className="font-bold mr-[0.3vw]" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), fontWeight: 800 }}>{rec.word}</span>
                                                                        {rec.context && <span className="font-normal opacity-70" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{rec.context}</span>}
                                                                    </span>
                                                                </div>
                                                                <span
                                                                    className={`${isMobileLandscape ? 'text-[0.5vw]' : isTablet ? 'text-[0.5vw]' : 'text-[0.75vw]'} font-bold opacity-60 tabular-nums shrink-0`}
                                                                    style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                                                >{rec.pageNumber < 10 ? `0${rec.pageNumber}` : rec.pageNumber}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Center Area: One Long Cluster of Icons (Grouped) */}
                    <div className={`${isMobileLandscape ? 'flex flex-1 justify-end pr-[2vw]' : isTablet ? `flex flex-1 justify-center ${isPdfProject ? 'pr-0' : 'pr-[12vw]'}` : `flex flex-1 justify-center ${isPdfProject ? 'pr-0' : 'pr-[13vw]'}`} items-center ${isMobileLandscape ? 'gap-[1vw]' : isTablet ? 'gap-[0.8vw]' : 'gap-[1.2vw]'}`}>
                        {/* Tools Group - 5 Icons */}
                        <div className="contents">
                            {(settings?.navigation?.tableOfContents ?? true) && renderToolbarBtn(
                                <Icon icon="fluent:text-bullet-list-24-filled" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.25vw] h-[1.25vw]')}`} />,
                                'TOC',
                                (e) => {
                                    e.stopPropagation();
                                    const wasOpen = showTOC;
                                    closeAllPopups();
                                    if (!wasOpen) setShowTOCMemo(true);
                                },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') },
                                '',
                                !!showTOC
                            )}
                            {(settings?.navigation?.pageThumbnails ?? true) && renderToolbarBtn(
                                <Icon icon="ph:squares-four-fill" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.25vw] h-[1.25vw]')}`} />,
                                'Thumbnails',
                                (e) => {
                                    e.stopPropagation();
                                    const wasOpen = activePopup === 'thumbnails';
                                    togglePopup('thumbnails', e);
                                    setShowThumbnailBarMemo?.(!wasOpen);
                                },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') },
                                '',
                                activePopup === 'thumbnails'
                            )}


                            {(settings?.interaction?.gallery ?? true) && renderToolbarBtn(
                                <Icon icon="clarity:image-gallery-solid" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.25vw] h-[1.25vw]')}`} />,
                                'Gallery',
                                (e) => {
                                    e.stopPropagation();
                                    closeAllPopups();
                                    setShowGalleryPopupMemo(true);
                                },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') },
                                'gallery-button',
                                !!showGalleryPopup
                            )}

                        </div>

                        {/* Navigation Group - 4 Icons (Music, Prev, Play, Next) */}
                        <div className="contents">
                            {(settings?.media?.backgroundAudio ?? true) && renderToolbarBtn(
                                <Icon icon="solar:music-notes-bold" className={`translate-y-[0.05vw] ${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.25vw] h-[1.25vw]')}`} />,
                                'Music',
                                (e) => {
                                    e.stopPropagation();
                                    const wasOpen = showSoundPopup;
                                    closeAllPopups();
                                    if (!wasOpen) setShowSoundPopupMemo(true);
                                },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') },
                                '',
                                !!showSoundPopup
                            )}
                            {(settings?.navigation?.startEndNav ?? true) && renderToolbarBtn(
                                <Icon icon="ph:skip-back" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.25vw] h-[1.25vw]')}`} />,
                                'First Page',
                                (e) => { e?.stopPropagation(); closeAllPopups(); onPageClick(0); },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                            )}
                            {(settings?.media?.autoFlip ?? true) && renderToolbarBtn(
                                <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isMobileLandscape ? 'w-[0.9vw] h-[0.9vw]' : isTablet ? 'w-[1.2vw] h-[1.2vw]' : (isSidebarOpen ? 'w-[1.3vw] h-[1.3vw]' : 'w-[1.5vw] h-[1.5vw]')}`} />,
                                isAutoFlipping ? 'Pause' : 'Play',
                                (e) => { e?.stopPropagation(); closeAllPopups(); setIsPlaying(!isAutoFlipping); },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                            )}
                            {(settings?.navigation?.startEndNav ?? true) && renderToolbarBtn(
                                <Icon icon="ph:skip-forward" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.25vw] h-[1.25vw]')}`} />,
                                'Last Page',
                                (e) => { e?.stopPropagation(); closeAllPopups(); onPageClick(pagesCount - 1); },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                            )}
                        </div>

                        <div className="contents">
                            {(settings?.brandingProfile?.profile ?? true) && renderToolbarBtn(
                                <Icon icon="fluent:person-24-filled" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.25vw] h-[1.25vw]')}`} />,
                                'Profile',
                                (e) => {
                                    e.stopPropagation();
                                    const wasOpen = showProfilePopup;
                                    closeAllPopups();
                                    if (!wasOpen) setShowProfilePopup(true);
                                },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') },
                                '',
                                !!showProfilePopup
                            )}
                            {(settings?.shareExport?.share ?? true) && renderToolbarBtn(
                                <Icon icon="mage:share-fill" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.25vw] h-[1.25vw]')}`} />,
                                'Share',
                                (e) => { e.stopPropagation(); closeAllPopups(); handleShare(); },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') },
                                '',
                                !!showSharePopup
                            )}
                            {(settings?.shareExport?.download ?? true) && renderToolbarBtn(
                                <Icon icon="meteor-icons:download" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.25vw] h-[1.25vw]')}`} />,
                                'Download',
                                (e) => { e.stopPropagation(); closeAllPopups(); handleDownload(); },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') },
                                '',
                                !!showExportPopup
                            )}
                            {(settings?.viewing?.fullScreen ?? true) && renderToolbarBtn(
                                <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.25vw] h-[1.25vw]')}`} />,
                                'Full Screen',
                                (e) => { e.stopPropagation(); closeAllPopups(); handleFullScreen(); },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }
                            )}
                        </div>
                    </div>

                    {/* Right Section: Brand Logo Container */}
                    <div className="flex items-center">
                        {settings.brandingProfile.logo && logoSettings?.src && (
                            <img
                                src={logoSettings.src}
                                alt="Brand Logo"
                                className={`${isTablet ? 'h-[1.5vw]' : 'h-[2vw]'} w-auto transition-all duration-300`}
                                style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 min-h-0 flex flex-col relative z-[1]">
                {/* Centered Book Name */}

                <div
                    ref={containerRef}
                    className={`flex-1 w-full flex items-center justify-center relative overflow-hidden ${isFullscreen ? 'p-0' : isMobileLandscape ? 'p-0' : 'p-[2vw]'} min-h-0`}
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
                    {/* Vertical Centered Navigation Arrows */}
                    <>
                        {(settings?.navigation?.nextPrevButtons ?? true) && (
                            <button
                                className={`absolute top-1/2 -translate-y-1/2 ${isTablet ? 'w-[2vw] h-[2vw] ' : 'w-[3vw] h-[3vw]'} flex items-center justify-center transition-all group z-20`}
                                style={{
                                    color: getLayoutColor('toolbar-bg', '#555555'),
                                    left: `calc(50% - ${(currentPage === 0 || currentPage >= (pages?.length || 0) - 1 || (pages?.length || 0) <= 1 ? 0.5 : 1) * dimWidth * responsiveScale}px - ${isMobileLandscape ? 2.5 : isTablet ? 3 : 4}vw)`
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeAllPopups();
                                    bookRef.current?.pageFlip()?.flipPrev();
                                }}
                            >
                                <Icon icon="ph:caret-left" className={`${isMobileLandscape ? 'w-[1.2vw] h-[1.2vw]' : 'w-[2.5vw] h-[2.5vw]'} group-active:scale-90 transition-transform`} />
                            </button>
                        )}

                        {(settings?.navigation?.nextPrevButtons ?? true) && (
                            <button
                                className={`absolute top-1/2 -translate-y-1/2 ${isTablet ? 'w-[2vw] h-[2vw] ' : 'w-[3vw] h-[3vw]'} flex items-center justify-center transition-all group z-20`}
                                style={{
                                    color: getLayoutColor('toolbar-bg', '#555555'),
                                    right: `calc(50% - ${(currentPage === 0 || currentPage >= (pages?.length || 0) - 1 || (pages?.length || 0) <= 1 ? 0.5 : 1) * dimWidth * responsiveScale}px - ${isMobileLandscape ? 2.5 : isTablet ? 3 : 4}vw)`
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeAllPopups();
                                    bookRef.current?.pageFlip()?.flipNext();
                                }}
                            >
                                <Icon icon="ph:caret-right" className={`${isMobileLandscape ? 'w-[1.2vw] h-[1.2vw]' : 'w-[2.5vw] h-[2.5vw]'} group-active:scale-90 transition-transform`} />
                            </button>
                        )}
                    </>


                    {/* Page Counter Badge */}
                    {(settings?.navigation?.pageQuickAccess ?? true) && (
                        <div
                            className={`absolute right-[1.5vw] rounded-[0.5vw] ${isMobileLandscape ? 'p-[0.2vw]' : isTablet ? 'p-[0.25vw]' : 'p-[0.3vw]'} flex items-center justify-center border border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.1)] z-20`}
                            style={{
                                backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                bottom: isFullscreen ? (isMobileLandscape ? '7vh' : isTablet ? '8.5vh' : '10.5vh') : '2vh'
                            }}
                        >
                            <span
                                className={`${isMobileLandscape ? 'text-[0.45vw]' : isTablet ? 'text-[0.55vw]' : 'text-[0.65vw]'} font-bold`}
                                style={{ color: getLayoutColor('toolbar-bg', '#555555') }}
                            >Page </span>
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
                                className={`${isMobileLandscape ? 'text-[0.45vw] mx-[0.2vw] px-[0.1vw] py-[0.05vw]' : isTablet ? 'text-[0.55vw] mx-[0.3vw] px-[0.15vw] py-[0.05vw]' : 'text-[0.65vw] mx-[0.3vw] px-[0.2vw] py-[0.05vw]'} font-bold rounded-[0.2vw] outline-none text-center transition-colors shadow-inner`}
                                style={{
                                    color: getLayoutColor('toolbar-bg', '#555555'),
                                    backgroundColor: getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.1),
                                    border: `1px solid ${getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.2)}`,
                                    width: `${String(pages.length).length + 1.2}ch`
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
                                className={`${isMobileLandscape ? 'text-[0.45vw]' : isTablet ? 'text-[0.55vw]' : 'text-[0.65vw]'} font-bold`}
                                style={{ color: getLayoutColor('toolbar-bg', '#555555') }}
                            > / {pagesCount}</span>
                        </div>
                    )}

                    {/* Flipbook Container Wrapper with Scaling */}
                    <div
                        className="relative flex items-center justify-center magazine-content-area"
                        style={{
                            transform: `scale(${responsiveScale}) translateX(${localOffset}px)`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.6s ease-in-out'
                        }}
                    >
                        {modifiedChildren}
                    </div>
                </div>
            </div>

            {/* Layout 2 Footer */}
            <div className={isFullscreen ? 'absolute bottom-0 left-0 w-full z-[1000] bg-transparent' : 'shrink-0'}>
                <div
                    className={`${isMobileLandscape ? 'h-[4vh] mb-[1vh]' : isTablet ? 'h-[5vh]' : 'h-[6.5vh]'} flex items-center justify-between px-[2vw] w-full z-[1001] border-t border-white/10 transition-all duration-500 ease-in-out ${isFullscreen ? `absolute bottom-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`}
                    style={{ backgroundColor: getLayoutColorRgba('bottom-toolbar-bg', '87, 92, 156', '1') }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Left: Book Name */}
                    <div className="flex items-center">
                        <span
                            className={`${isMobileLandscape ? 'text-[0.65vw]' : isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-bold tracking-tight truncate max-w-[15vw]`}
                            style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }}
                            title={bookName}
                        >{/* {bookName} */}</span>
                    </div>
                    {/* Continuous Line of Pagination Dots */}
                    <div className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center ${isMobileLandscape ? 'gap-[0.3vw]' : 'gap-[0.5vw]'} ${isTablet ? 'h-[1.2vw]' : isMobileLandscape ? 'h-[1vw]' : 'h-[2vw]'}`}>
                        {spreads.map((spread, sIdx) => {
                            const isActive = sIdx === activeSpreadIdx;

                            return (
                                <div
                                    key={sIdx}
                                    className="relative flex items-center justify-center"
                                    onMouseEnter={() => setHoveredDotIdx(sIdx)}
                                    onMouseLeave={() => setHoveredDotIdx(null)}
                                >
                                    <motion.div
                                        onClick={() => onPageClick(spread.indices[0])}
                                        className={`relative flex-shrink-0 ${isTablet ? 'h-[0.35vw]' : isMobileLandscape ? 'h-[0.25vw]' : 'h-[0.5vw]'} rounded-full cursor-pointer overflow-hidden transition-colors duration-300`}
                                        style={{
                                            backgroundColor: isActive
                                                ? getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.2')
                                                : getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.3'),
                                        }}
                                        animate={{
                                            width: isActive ? (isTablet ? '1.2vw' : isMobileLandscape ? '0.8vw' : '1.8vw') : (isTablet ? '0.35vw' : isMobileLandscape ? '0.25vw' : '0.5vw'),
                                        }}
                                        transition={{ duration: 0 }}
                                    >
                                        {/* Fill Animation */}
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                width: isActive ? '100%' : '0%'
                                            }}
                                            transition={{ duration: 0 }}
                                            className={`absolute inset-y-0 ${direction === 'forward' ? 'left-0' : 'right-0'}`}
                                            style={{ backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }}
                                        />
                                    </motion.div>

                                    {/* Hover Tooltip - Screenshot Style */}
                                    <AnimatePresence>
                                        {hoveredDotIdx === sIdx && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
                                                animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                                                exit={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
                                                transition={{ duration: 0.2 }}
                                                className={`absolute ${isMobileLandscape ? 'bottom-[calc(100%+0.5vw)]' : 'bottom-[calc(100%+2.2vw)]'} left-1/2 ${isTablet ? 'w-[7.5vw] rounded-[0.8vw] p-[0.35vw] pb-[0.25vw]' : isMobileLandscape ? 'w-[5vw] rounded-[0.6vw] p-[0.2vw] pb-[0.1vw]' : 'w-[9vw] rounded-[1vw] p-[0.4vw] pb-[0.3vw]'} z-[100] pointer-events-none border-[1.5px]`}
                                                style={{
                                                    backgroundColor: getLayoutColor('dropdown-bg', '#555555'),
                                                    borderColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', '0.4')
                                                }}
                                            >
                                                <div
                                                    className={`flex ${isTablet ? 'rounded-[0.6vw] h-[4.5vw] mb-[0.25vw]' : isMobileLandscape ? 'rounded-[0.4vw] h-[3vw] mb-[0.15vw]' : 'rounded-[0.8vw] h-[5.5vw] mb-[0.35vw]'} overflow-hidden border border-gray-100 items-center justify-center p-[0.2vw] gap-[0.25vw]`}
                                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                                                >
                                                    {spread.pages.map((p, pIdx) => (
                                                        <div key={pIdx} className="flex-1 max-w-[50%] h-full bg-white rounded-[0.4vw] overflow-hidden relative border border-gray-200">
                                                            <PageThumbnail html={p?.html || p?.content || ''} index={spread.indices[pIdx]} scale={isMobileLandscape ? 0.12 : 0.22} />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div
                                                    className={`text-center ${isTablet ? 'text-[0.55vw]' : isMobileLandscape ? 'text-[0.5vw]' : 'text-[0.9vw]'} font-medium pb-[0.1vw] whitespace-nowrap`}
                                                    style={{ color: getLayoutColor('dropdown-text', '#555555') }}
                                                >
                                                    {spread.label}
                                                </div>
                                                {/* Tooltip Arrow */}
                                                <div className={`absolute top-[calc(100%-2.5px)] left-1/2 -translate-x-1/2 ${isTablet ? 'w-[2vw] h-[1vw]' : isMobileLandscape ? 'w-[1.2vw] h-[0.6vw]' : 'w-[2.5vw] h-[1.3vw]'} flex items-start justify-center`}>
                                                    <svg
                                                        viewBox="0 0 60 20"
                                                        className="w-full h-full"
                                                        style={{
                                                            fill: getLayoutColor('dropdown-bg', '#555555'),
                                                            stroke: getLayoutColorRgba('dropdown-text', '255, 255, 255', '0.4'),
                                                            strokeWidth: 3
                                                        }}
                                                        preserveAspectRatio="none"
                                                    >
                                                        <path d="M0,0 C15,0 25,2 30,20 C35,2 45,0 60,0 Z" />
                                                    </svg>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Zoom Mini-Pill Cluster - Refined Screenshot Style */}
                    {(settings?.viewing?.zoom ?? true) && (
                        <div className="flex items-center absolute right-[2vw]">
                            <div className={`flex items-center ${isMobileLandscape ? 'gap-[0.4vw] px-[0.2vw] py-[0.2vw] pl-[0.5vw] rounded-[0.3vw]' : isTablet ? 'gap-[0.5vw] px-[0.2vw] py-[0.2vw] pl-[0.6vw] rounded-[0.4vw]' : 'gap-[0.7vw] px-[0.25vw] py-[0.25vw] pl-[0.8vw] rounded-[0.45vw]'} bg-white/20 backdrop-blur-sm border border-white/10`}>
                                <div className={`flex items-center ${isMobileLandscape ? 'gap-[0.3vw]' : isTablet ? 'gap-[0.4vw]' : 'gap-[0.6vw]'}`}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                                        className="hover:scale-110 transition-transform active:scale-95 flex items-center"
                                        style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }}
                                    >
                                        <Icon icon="fad:zoomout" className={`${isMobileLandscape ? 'w-[0.6vw] h-[0.6vw]' : isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'}`} />
                                    </button>
                                    <span
                                        className={`font-bold ${isMobileLandscape ? 'text-[0.6vw] min-w-[1.5vw]' : isTablet ? 'text-[0.65vw] min-w-[2.5vw]' : 'text-[0.85vw] min-w-[2.5vw]'} tracking-tight tabular-nums select-none`}
                                        style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }}
                                    >
                                        {Math.round((dimWidth / initialWidth) * 100)}%
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                                        className="hover:scale-110 transition-transform active:scale-95 flex items-center"
                                        style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1') }}
                                    >
                                        <Icon icon="fad:zoomin" className={`${isMobileLandscape ? 'w-[0.6vw] h-[0.6vw]' : isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'}`} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                        setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                                    }}
                                    className={`${isMobileLandscape ? 'text-[0.55vw] px-[0.5vw] py-[0.2vw] rounded-[0.2vw]' : isTablet ? 'text-[0.55vw] px-[0.6vw] py-[0.2vw] rounded-[0.3vw]' : 'text-[0.78vw] px-[0.8vw] py-[0.3vw] rounded-[0.35vw]'} font-bold transition-all active:scale-95`}
                                    style={{
                                        backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.2'),
                                        color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1'),
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* High-Fidelity 360-degree Radial Preview System (SVG Matched - Indigo Theme) */}
            <AnimatePresence>
                {activePopup === 'thumbnails' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[5000] flex items-center justify-end bg-transparent"
                        onClick={() => setActivePopup(null)}
                        onWheel={handleRadialWheel}
                    >
                        {/* Master SVG Definitions */}
                        <svg className="absolute w-0 h-0 invisible">
                            <defs>
                                <filter id="clean-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                                    <feOffset dx="0" dy="4" />
                                    <feComponentTransfer><feFuncA type="linear" slope="0.25" /></feComponentTransfer>
                                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            </defs>
                        </svg>

                        {/* Compact Full-Circle System - Sized to fit between Top/Bottom Bars */}
                        <div
                            className="relative w-[70vh] h-[70vh] flex items-center justify-center pointer-events-auto"
                            style={{ transform: 'translateX(40%) translateY(0%)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Clipping/Masking container for the orbital track and pages */}
                            <div 
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    clipPath: 'polygon(-20% -20%, 50% -20%, 50% 120%, -20% 120%)',
                                    WebkitClipPath: 'polygon(-20% -20%, 50% -20%, 50% 120%, -20% 120%)'
                                }}
                            >
                                {/* 1. Transparent Orbit Track (Geometric Reference) */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        border: `14.5vh solid ${getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.05')}`,
                                        boxSizing: 'border-box',
                                        filter: 'blur(4px)',
                                        pointerEvents: 'none',
                                    }} />
                                    <svg viewBox="0 0 888 888" className="w-full h-full pointer-events-none" style={{ position: 'absolute' }}>
                                        <defs>
                                            <radialGradient id="ringFillGradient" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
                                                <stop offset="0%" stopColor="white" stopOpacity="0" />
                                                <stop offset="56%" stopColor="white" stopOpacity="0" />
                                                <stop offset="60%" stopColor={getLayoutColor('dropdown-bg', '#555555')} stopOpacity="0.05" />
                                                <stop offset="70%" stopColor={getLayoutColor('dropdown-bg', '#555555')} stopOpacity="0.02" />
                                                <stop offset="94%" stopColor={getLayoutColor('dropdown-bg', '#555555')} stopOpacity="0.02" />
                                                <stop offset="98%" stopColor={getLayoutColor('dropdown-bg', '#555555')} stopOpacity="0.05" />
                                                <stop offset="100%" stopColor={getLayoutColor('dropdown-bg', '#555555')} stopOpacity="0.05" />
                                            </radialGradient>
                                        </defs>
                                        <path
                                            d="M444 0C689.214 0 888 198.786 888 444C888 689.214 689.214 888 444 888C198.786 888 0 689.214 0 444C0 198.786 198.786 0 444 0ZM444 184C300.4 184 184 300.4 184 444C184 587.6 300.4 704 444 704C587.6 704 704 587.6 704 444C704 300.4 587.6 184 444 184Z"
                                            fill="url(#ringFillGradient)"
                                            filter="url(#clean-shadow)"
                                        />
                                    </svg>
                                </div>

                                {/* 2. Map All Pages to Circle */}
                                {(() => {
                                    const baseAngle = 180; // center of visibility at 9 o'clock
                                    const orbitRadius = 39.6; // Midpoint of ring
                                    const focusIndex = activeSpreadIdx + radialScroll;

                                    const parentRotation = -focusIndex * angleStep;

                                    return (
                                        <motion.div
                                            className="absolute inset-0 z-10 pointer-events-none"
                                            animate={{ rotate: parentRotation }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 120,
                                                damping: 20,
                                                mass: 0.8
                                            }}
                                        >
                                            {displaySpreads.map((spread, i) => {
                                                const total = displaySpreads.length;
                                                
                                                // Calculate virtual index to create a perfect continuous infinite carousel
                                                // This prevents spiral overlapping/interleaving by shifting the index by multiples of total
                                                let virtualIndex = i;
                                                const shouldWrap = total > 8;
                                                if (total > 0 && shouldWrap) {
                                                    while (virtualIndex - focusIndex > total / 2) {
                                                        virtualIndex -= total;
                                                    }
                                                    while (focusIndex - virtualIndex > total / 2) {
                                                        virtualIndex += total;
                                                    }
                                                }

                                                const fixedAngleDeg = baseAngle + virtualIndex * angleStep;
                                                const fixedAngleRad = fixedAngleDeg * (Math.PI / 180);
                                                const x = 50 + orbitRadius * Math.cos(fixedAngleRad);
                                                const y = 50 + orbitRadius * Math.sin(fixedAngleRad);

                                                // Handle active state with modulo for infinite rotation
                                                const rawFocusedIdx = Math.round(focusIndex);
                                                const mappedFocusedIdx = ((rawFocusedIdx % total) + total) % total;
                                                const isActive = (hoveredIdx !== null ? (hoveredIdx === i) : (mappedFocusedIdx === i));

                                                // Dynamic Visibility / Clipping Logic using Virtual Index
                                                const distance = Math.abs(virtualIndex - focusIndex);
                                                const shouldClip = total > 8;
                                                const isVisuallyVisible = !shouldClip || distance <= 7;

                                                return (
                                                    <motion.div
                                                        key={i}
                                                        className={`absolute cursor-pointer flex items-center justify-center p-0 transition-opacity duration-300 ${isVisuallyVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
                                                        style={{
                                                            left: `${x}%`,
                                                            top: `${y}%`,
                                                            width: '14vh',
                                                            height: '11vh',
                                                            marginLeft: '-7vh',
                                                            marginTop: '-5.5vh',
                                                            zIndex: isActive ? 50 : 10,
                                                        }}
                                                        animate={{
                                                            rotate: fixedAngleDeg + 90,
                                                            scale: isActive ? 1.05 : 1
                                                        }}
                                                        transition={{ duration: 0 }}
                                                        onMouseEnter={() => setHoveredIdx(i)}
                                                        onMouseLeave={() => setHoveredIdx(null)}
                                                        onClick={() => { onPageClick(spread.indices[0]); }}
                                                    >
                                                        <svg viewBox="0 0 170 173" className="w-full h-full overflow-visible">
                                                            <g transform="rotate(90, 85, 86.5)">
                                                                <path
                                                                    d="M9.29472 11.4862C11.1722 3.10828 19.7989 -1.79399 28.0408 0.611489L161.222 39.4818C168.942 41.7352 173.506 49.6146 172.035 57.5216C167.9 79.7315 167.621 96.4086 170.486 118.929C171.485 126.787 166.576 134.264 158.88 136.14L24.4315 168.911C16.05 170.953 7.62316 165.607 6.15266 157.106C-2.91853 104.667 -2.03183 62.0294 9.29472 11.4862Z"
                                                                    fill={getLayoutColor('dropdown-bg', '#3E4491')}
                                                                    className="transition-colors duration-300"
                                                                />
                                                            </g>
                                                            <text
                                                                x="50%"
                                                                y="50%"
                                                                fill={getLayoutColor('dropdown-text', '#FFFFFF')}
                                                                fontSize="20"
                                                                fontWeight="bolder"
                                                                textAnchor="middle"
                                                                alignmentBaseline="middle"
                                                                style={{ letterSpacing: '0.04em' }}
                                                                className="select-none opacity-90"
                                                                transform="rotate(90, 85, 86.5)"
                                                            >
                                                                {spread.label}
                                                            </text>
                                                        </svg>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    );
                                })()}
                            </div>

                            {/* 3. Center hub Preview Area */}
                            <motion.div
                                className="absolute w-[42vh] h-[42vh] z-[100] flex items-center justify-center pointer-events-none"
                            >
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="absolute z-[150] flex items-center" style={{ transform: 'translateX(-5vh)' }}>
                                        <div className="w-[1vw] h-[1vw] bg-white rotate-45 -mr-[0.5vw] rounded-[0.08vw]" />
                                        {(() => {
                                            if (!displaySpreads || displaySpreads.length === 0) return null;
                                            const rawFocusIdx = Math.round(activeSpreadIdx + radialScroll);
                                            const activeIdx = ((rawFocusIdx % displaySpreads.length) + displaySpreads.length) % displaySpreads.length;
                                            const spread = hoveredIdx !== null ? displaySpreads[hoveredIdx] : displaySpreads[activeIdx];
                                            
                                            // Dynamic size calculation
                                            const baseHeightVW = 4.5; 
                                            let spreadRatio = (dimWidth * spread.pages.length) / dimHeight;
                                            if (spread.pages.length > 1) spreadRatio = spreadRatio * 0.75;
                                            if (spreadRatio > 2.5) spreadRatio = 2.5;
                                            let boxWidthVW = baseHeightVW * spreadRatio;
                                            
                                            return (
                                                <div 
                                                    className="bg-white rounded-[0.4vw] p-[0.3vw] flex items-center justify-center border border-gray-100/80 shadow-lg"
                                                    style={{ width: `${boxWidthVW}vw`, height: `${baseHeightVW}vw` }}
                                                >
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center relative overflow-hidden rounded-[0.25vw] gap-[1px]">
                                                        {spread.pages.map((p, pIdx) => {
                                                            const availableWidthPx = (boxWidthVW * window.innerWidth / 100) / spread.pages.length;
                                                            const availableHeightPx = (baseHeightVW * window.innerWidth / 100);
                                                            const thumbScale = Math.min(availableWidthPx / dimWidth, availableHeightPx / dimHeight);
                                                            
                                                            return (
                                                                <div key={pIdx} className={`flex-1 ${spread.pages.length > 1 ? 'max-w-[50%]' : 'max-w-full'} h-full bg-white overflow-hidden relative flex items-center justify-center`}>
                                                                    <PageThumbnail 
                                                                        html={p?.html || p?.content || ''} 
                                                                        index={spread.indices[pIdx]} 
                                                                        scale={thumbScale} 
                                                                        baseWidth={dimWidth} 
                                                                        baseHeight={dimHeight} 
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </motion.div>
                        </div>



                    </motion.div>
                )}
            </AnimatePresence>

            {/* Popups handled by PreviewArea */}
        </div>
    );
};

export default Grid2Layout;
