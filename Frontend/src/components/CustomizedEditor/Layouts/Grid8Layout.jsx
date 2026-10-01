import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';

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


const ToolbarBtn = ({ icon, label, onClick, isActive, className = '', id, toolbarProps }) => {
    const { primaryColor, getLayoutColor, isSidebarOpen, isTablet, addTextBelowIcons, textFont } = toolbarProps;
    const bgColor = isActive ? getLayoutColor('toolbar-text-main', '#FFFFFF') : getLayoutColor('toolbar-bg', primaryColor);
    const iconColor = isActive ? getLayoutColor('toolbar-bg', primaryColor) : getLayoutColor('toolbar-text-main', '#FFFFFF');

    return (
        <div className="flex flex-col items-center gap-[0.2vh] group relative">
            <button
                id={id}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onClick) onClick(e);
                }}
                className={`rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-[101]' : 'z-10'} ${isSidebarOpen ? (isTablet ? 'w-[1.7vw] h-[1.7vw]' : 'w-[1.85vw] h-[1.85vw]') : (isTablet ? 'w-[2.1vw] h-[2.1vw]' : 'w-[2.3vw] h-[2.3vw]')} ${className}`}
                style={{ backgroundColor: bgColor }}
            >
                <Icon icon={icon} color={iconColor} style={{ width: isSidebarOpen ? (isTablet ? '0.9vw' : '0.95vw') : (isTablet ? '1.0vw' : '1.1vw'), height: isSidebarOpen ? (isTablet ? '0.9vw' : '0.95vw') : (isTablet ? '1.0vw' : '1.1vw') }} />
            </button>
            {addTextBelowIcons && label && (
                <span
                    className={`${isTablet ? 'text-[0.45vw]' : 'text-[0.5vw]'} font-semibold leading-tight text-center whitespace-nowrap transition-opacity opacity-100`}
                    style={{ color: getLayoutColor('toolbar-bg', primaryColor), fontFamily: textFont }}
                >{label}</span>
            )}
            {!addTextBelowIcons && label && (
                <div className="absolute top-[calc(100%+0.5vw)] left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap pointer-events-none z-[9999]"
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
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
                    }}>
                    {label}
                    <div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-b-[0.35vw] border-l-[0.35vw] border-r-[0.35vw]" style={{ borderBottomColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                </div>
            )}
        </div>
    );
};


const Grid8Layout = ({
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
    setShowGalleryPopupMemo,
    showTOC,
    showProfilePopup,
    showGalleryPopup,
    showSoundPopup,
    showThumbnailBar,
    setShowSoundPopupMemo,
    layoutColors,
    isTablet,
    otherSetupSettings,
    isFlipMuted,
    setIsFlipMuted,
    isFullscreen: isFullscreenProp
    ,
    activeLayout,
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

    const isPdfProject = pages?.some(p => p.html && p.html.includes('data-name="PDF Background"'));
    const totalPages = pagesCount;
    const progressPercentage = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0;

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [popupPositions, setPopupPositions] = useState({});
    const isFullscreen = isFullscreenProp || false;
    const isCanvasHovered = false; const setIsCanvasHovered = () => {};
    const thumbScrollRef = useRef(null);
    const [canThumbScrollLeft, setCanThumbScrollLeft] = useState(false);
    const [canThumbScrollRight, setCanThumbScrollRight] = useState(true);

    const checkThumbScroll = React.useCallback(() => {
        if (thumbScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = thumbScrollRef.current;
            setCanThumbScrollLeft(scrollLeft > 0);
            setCanThumbScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
        }
    }, []);
    const layoutRef = useRef(null);
    const showThumbnails = showThumbnailBar;
    const setShowThumbnails = setShowThumbnailBarMemo;

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));
    const [showTopBookmarkOptions, setShowTopBookmarkOptions] = useState(false);
    const [showTopNotesOptions, setShowTopNotesOptions] = useState(false);

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    // Close popup options if user clicks outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (showTopBookmarkOptions) setShowTopBookmarkOptions(false);
            if (showTopNotesOptions) setShowTopNotesOptions(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showTopBookmarkOptions, showTopNotesOptions]);

    // Close localized popups if another main popup is opened
    useEffect(() => {
        if (showTOC || showThumbnails || showGalleryPopup || showProfilePopup || showViewBookmarkPopup || showSoundPopup) {
            setShowTopBookmarkOptions(false);
            setShowTopNotesOptions(false);
        }
    }, [showTOC, showThumbnails, showGalleryPopup, showProfilePopup, showViewBookmarkPopup, showSoundPopup]);

    const handleMenuClick = (setter, currentVal, e, popupName) => {
        if (e && e.currentTarget && popupName && layoutRef.current) {
            const btnRect = e.currentTarget.getBoundingClientRect();
            const layoutRect = layoutRef.current.getBoundingClientRect();
            const relativeLeft = btnRect.left - layoutRect.left + (btnRect.width / 2);
            setPopupPositions(prev => ({ ...prev, [popupName]: relativeLeft }));
        }

        const next = !currentVal;
        if (next) {
            // Close local dropdowns
            setShowTopNotesOptions(false);
            setShowTopBookmarkOptions(false);
            // Close main popups (using Memo handlers from parent which already call closeAllPopups)
            setShowTOCMemo(false);
            setShowThumbnailBarMemo(false);
            setShowGalleryPopupMemo(false);
            setShowSoundPopupMemo(false);
            setShowProfilePopup(false);
        }
        setter(next);
    };

    // Scroll active thumbnail into view when panel opens
    useEffect(() => {
        if (showThumbnails && thumbScrollRef.current) {
            const activeEl = thumbScrollRef.current.querySelector(`[data-thumb-index="${currentPage}"]`);
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                setTimeout(checkThumbScroll, 350);
            } else {
                checkThumbScroll();
            }
        }
    }, [showThumbnails, currentPage, checkThumbScroll]);

    // Ensure perfect alignment of thumbnails popup with its button during sidebar transitions
    useEffect(() => {
        if (!showThumbnails) return;

        let animationFrameId;

        const syncPosition = () => {
            const currentBtn = document.getElementById('layout8-thumbnails-btn');
            const currentPopup = document.getElementById('layout8-thumb-panel');
            const currentLayout = layoutRef.current;

            if (currentBtn && currentPopup && currentLayout) {
                const btnRect = currentBtn.getBoundingClientRect();
                const layoutRect = currentLayout.getBoundingClientRect();
                const relativeLeft = btnRect.left - layoutRect.left + (btnRect.width / 2);
                currentPopup.style.left = `${relativeLeft}px`;
            }
            animationFrameId = requestAnimationFrame(syncPosition);
        };

        syncPosition();

        return () => cancelAnimationFrame(animationFrameId);
    }, [showThumbnails]);



    const primaryColor = layoutColors?.primary || '#555555';
    const baseBgColor = layoutColors?.secondary || '#E3E4EF';

    const getLayoutColor = (id, defaultColor) => {
        if (!layoutColors) return defaultColor;

        const activeIdx = activeLayout || 8;
        const saved = Array.isArray(layoutColors[activeIdx]) ? layoutColors[activeIdx] : [];
        const toolbarP = layoutColors?.toolbarColor?.primary;
        const toolbarS = layoutColors?.toolbarColor?.secondary;
        const popupP = layoutColors?.popupColor?.primary;
        const popupS = layoutColors?.popupColor?.secondary;

        const savedItem = saved.find(c => c.id === id);
        if (savedItem && savedItem.hex) return savedItem.hex;

        if (toolbarP && ['toolbar-bg', 'bottom-toolbar-bg', 'page-number-bg'].includes(id)) return toolbarP;
        if (toolbarS && ['toolbar-text-main', 'toolbar-icon', 'reset-text', 'page-number-text'].includes(id)) return toolbarS;
        if (popupP && ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'].includes(id)) return popupP;
        if (popupS && ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'].includes(id)) return popupS;

        return defaultColor;
    };

    const getLayoutOpacity = (id, defaultOpacity) => {
        if (!layoutColors) return defaultOpacity;

        const activeIdx = activeLayout || 8;
        const saved = Array.isArray(layoutColors[activeIdx]) ? layoutColors[activeIdx] : [];
        const savedItem = saved.find(c => c.id === id);

        return savedItem && savedItem.opacity !== undefined ? savedItem.opacity / 100 : defaultOpacity;
    };

    const getLayoutColorRgba = (id, defaultHex, defaultOpacity) => {
        let hex = getLayoutColor(id, defaultHex);
        let opacity = getLayoutOpacity(id, defaultOpacity);

        // Convert to rgba string safely
        if (!hex || !hex.startsWith('#')) return `rgba(87, 92, 156, ${opacity})`;

        let c = hex.substring(1).split('');
        if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        if (c.length !== 6) return hex;

        const val = parseInt(c.join(''), 16);
        return `rgba(${(val >> 16) & 255}, ${(val >> 8) & 255}, ${val & 255}, ${opacity})`;
    };

    const isLightColor = (hex) => {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
        let c = hex.substring(1).toUpperCase();
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        if (c.length !== 6) return false;
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.7;
    };

    const bodyTextColor = (() => {
        const dropBgHex = getLayoutColor('dropdown-bg', primaryColor);
        const dropTextHex = getLayoutColor('dropdown-text', '#FFFFFF');
        return isLightColor(dropBgHex) ? (dropTextHex === '#FFFFFF' ? '#2D2D2D' : dropTextHex) : dropBgHex;
    })();

    // Sound Popup States
    const flipSoundMasterEnabled = otherSetupSettings?.sound?.flipSoundEnabled !== false;
    const bgSoundMasterEnabled = otherSetupSettings?.sound?.bgSoundEnabled !== false;
    const isFlipActive = flipSoundMasterEnabled && !isFlipMuted;
    const isBgActive = bgSoundMasterEnabled && !isMuted;
    const flipWidth = flipSoundMasterEnabled ? (isFlipActive ? '60%' : '15%') : '0%';
    const bgWidth = bgSoundMasterEnabled ? (isBgActive ? '80%' : '15%') : '0%';

    const handleFlipClick = (e) => {
        e.stopPropagation();
        if (flipSoundMasterEnabled && setIsFlipMuted) {
            setIsFlipMuted(!isFlipMuted);
        }
    };

    const handleBgClick = (e) => {
        e.stopPropagation();
        if (bgSoundMasterEnabled && onToggleAudio) {
            onToggleAudio();
        }
    };

    // Toolbar display settings
    const addTextBelowIcons = settings?.toolbar?.addTextBelowIcons ?? false;
    const textFont = settings?.toolbar?.textProperties?.font || 'inherit';

    const toolbarProps = { primaryColor, getLayoutColor, isSidebarOpen, isTablet, addTextBelowIcons, textFont };

    return (
        <div
            ref={layoutRef}
            className="flex flex-col h-full w-full font-sans overflow-hidden relative"
            style={{ backgroundColor: backgroundSettings?.color || baseBgColor, ...backgroundStyle }}
            onClick={() => setRecommendations([])}
        >
            {/* â•â•â•â•â•â•â•â•â•â•â• Global Click Overlay Dropdowns â•â•â•â•â•â•â•â•â•â•â• */}
            {/* Captures clicks reliably before they hit the flipbook which swallows propagation */}
            {!isTablet && (showTopBookmarkOptions || showTopNotesOptions) && (
                <div
                    className="absolute inset-0 z-[40]"
                    onClick={() => {
                        setShowTopBookmarkOptions(false);
                        setShowTopNotesOptions(false);
                    }}
                />
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â• Top Overlay Area â•â•â•â•â•â•â•â•â•â•â• */}
            {!isTablet && (
            <div
                className="absolute top-[2vh] left-[2vw] right-[2vw] flex items-center justify-between z-[100] pointer-events-none transition-all duration-500 ease-in-out"
                style={{ opacity: isFullscreen && isCanvasHovered ? 0 : 1 }}
            >

                {/* Left: Quick Search */}
                <div className="flex-1 flex justify-start pointer-events-auto">
                    {settings?.interaction?.search !== false && !isPdfProject && (
                        <div className={`relative z-50 transition-transform duration-300 ${isSidebarOpen ? '-translate-x-[0.8vw]' : ''}`} onClick={(e) => e.stopPropagation()}>
                            {/* Purple Background & Dropdown Container */}
                            <AnimatePresence>
                                {recommendations.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className={`absolute left-0 z-0 shadow-2xl flex flex-col w-full ${isTablet ? 'top-[1.8vh]' : 'top-[2.1vh]'}`}
                                        style={{
                                            backgroundColor: getLayoutColor('dropdown-bg', primaryColor),
                                            borderBottomLeftRadius: '1.2vw',
                                            borderBottomRightRadius: '1.2vw',
                                            paddingBottom: '0.6vw'
                                        }}
                                    >
                                        {/* Invisible spacer to push suggestions below the input */}
                                        <div className={`${isTablet ? 'h-[1.8vh]' : 'h-[2.1vh]'} shrink-0`} />

                                        {/* Suggestions White Box */}
                                        <div className="mx-[0.6vw] mt-[0.6vw] bg-white flex flex-col py-[0.5vh] overflow-hidden" style={{ borderRadius: '0.8vw' }}>
                                            {recommendations.map((rec, idx) => (
                                                <button
                                                    key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                    className="flex items-center justify-between px-[1.2vw] py-[0.8vh] hover:bg-gray-50 transition-colors group"
                                                    style={{ color: getLayoutColor('dropdown-bg', primaryColor) }}
                                                    onClick={() => {
                                                        onPageClick(rec.pageNumber - 1);
                                                        const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                                        setLocalSearchQuery(fullQuery);
                                                        setSearchQuery(fullQuery);
                                                        setRecommendations([]);
                                                    }}
                                                >
                                                    <div className="flex flex-col items-start overflow-hidden flex-1 mr-[0.5vw]">
                                                        <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                            <span className="font-bold mr-[0.3vw]" style={{ fontWeight: 600 }}>{rec.word}</span>
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

                            <div
                                className={`relative z-10 flex items-center rounded-full px-[1vw] py-[0.5vh] ${isTablet ? 'h-[3.6vh]' : 'h-[4.2vh]'} transition-all duration-300 ${isSidebarOpen ? (isTablet ? 'w-[10vw]' : 'w-[12vw]') : (isTablet ? 'w-[11vw]' : 'w-[14vw]')}`}
                                style={{
                                    backgroundColor: recommendations.length > 0 ? '#ffffff' : getLayoutColor('search-bg-v2', '#ffffff'),
                                    border: recommendations.length > 0 ? 'none' : `1px solid ${getLayoutColor('search-text-v1', primaryColor)}30`
                                }}
                            >
                                <Icon icon="lucide:search" style={{ width: isSidebarOpen ? (isTablet ? '0.9vw' : '1.0vw') : (isTablet ? '1.0vw' : '1.1vw'), height: isSidebarOpen ? (isTablet ? '0.9vw' : '1.0vw') : (isTablet ? '1.0vw' : '1.1vw') }} color={getLayoutColor('search-text-v1', primaryColor)} />
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
                                    placeholder="Quick Search..."
                                    className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} ml-[0.6vw] w-full font-medium`}
                                    style={{ color: getLayoutColor('search-text-v1', primaryColor) }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* â•â•â•â•â•â•â•â•â•â•â• Center: Top Toolbar â•â•â•â•â•â•â•â•â•â•â• */}
                <div className="flex-shrink-0 pointer-events-auto relative z-[4000]">
                    <div
                        className={`flex items-center ${isSidebarOpen ? 'gap-[0.8vw]' : (isTablet ? 'gap-[0.4vw]' : 'gap-[0.8vw]')} rounded-full px-[0.8vw] py-[0.5vh] ${isTablet ? 'h-[3.6vh]' : 'h-[4.2vh]'}`}
                    >
                        {/* TOC */}
                        {(settings?.navigation?.tableOfContents ?? true) && (
                            <ToolbarBtn toolbarProps={toolbarProps}
                                id="layout8-toc-btn"
                                icon="fluent:text-bullet-list-24-filled"
                                label="TOC"
                                onClick={(e) => { e.stopPropagation(); handleMenuClick(setShowTOCMemo, showTOC, e, 'toc'); }}
                                isActive={showTOC}
                            />
                        )}
                        {/* Thumbnails */}
                        {(settings?.navigation?.pageThumbnails ?? true) && (
                            <ToolbarBtn toolbarProps={toolbarProps}
                                id="layout8-thumbnails-btn"
                                icon="ph:squares-four-fill"
                                label="Thumbnails"
                                onClick={(e) => { e.stopPropagation(); handleMenuClick(setShowThumbnailBarMemo, showThumbnails, e, 'thumbnails'); }}
                                isActive={showThumbnails}
                            />
                        )}

                        {/* Play/Pause */}
                        {(settings?.media?.autoFlip ?? true) && (
                            <ToolbarBtn toolbarProps={toolbarProps}
                                icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"}
                                label={isAutoFlipping ? 'Pause' : 'Play'}
                                onClick={() => setIsPlaying(!isAutoFlipping)}
                                isActive={isAutoFlipping}
                            />
                        )}
                        {/* Gallery */}
                        {(settings?.interaction?.gallery ?? true) && (
                            <ToolbarBtn toolbarProps={toolbarProps}
                                icon="clarity:image-gallery-solid"
                                label="Gallery"
                                onClick={(e) => { e.stopPropagation(); handleMenuClick(setShowGalleryPopupMemo, showGalleryPopup, e, 'gallery'); }}
                                isActive={showGalleryPopup}
                            />
                        )}
                        <div className="relative" id="layout8-sound-icon-anchor">
                            {(settings?.media?.backgroundAudio ?? true) && (
                                <ToolbarBtn toolbarProps={toolbarProps}
                                    icon="solar:music-notes-bold"
                                    label="Sound"
                                    onClick={(e) => { e.stopPropagation(); handleMenuClick(setShowSoundPopupMemo, showSoundPopup, e, 'sound'); }}
                                    isActive={showSoundPopup}
                                    className="relative z-[999]"
                                />
                            )}
                        </div>

                        {/* Divider */}
                        <div className="w-[1px] h-[2vh] bg-white mx-[0.2vw] opacity-40" />

                        {/* Search / Zoom controls */}
                        {(settings?.viewing?.zoom ?? true) && (
                            <div className={`flex items-center rounded-full px-[0.2vw] ${isSidebarOpen ? 'gap-[0.1vw]' : 'gap-[0.2vw]'} ${isSidebarOpen ? (isTablet ? 'h-[1.7vw]' : 'h-[1.85vw]') : (isTablet ? 'h-[2.1vw]' : 'h-[2.3vw]')}`} style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), border: `1px solid ${getLayoutColor('toolbar-bg', primaryColor)}20` }}>
                                <div className="group relative flex items-center justify-center h-full">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                                        className={`${isSidebarOpen ? (isTablet ? 'w-[1.7vw] h-[1.7vw]' : 'w-[1.85vw] h-[1.85vw]') : (isTablet ? 'w-[2.1vw] h-[2.1vw]' : 'w-[2.3vw] h-[2.3vw]')} rounded-full flex items-center justify-center transition-all shadow-sm`}
                                        style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                                    >
                                        <Icon icon="lucide:zoom-out" style={{ width: isSidebarOpen ? '0.9vw' : '1.1vw', height: isSidebarOpen ? '0.9vw' : '1.1vw' }} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                                    </button>
                                    <div className="absolute top-[calc(100%+0.5vw)] left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap pointer-events-none z-[9999]"
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
                                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
                                        }}>
                                        Zoom Out
                                        <div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-b-[0.35vw] border-l-[0.35vw] border-r-[0.35vw]" style={{ borderBottomColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                                    </div>
                                </div>
                                <span className={`${isSidebarOpen ? 'text-[0.65vw]' : 'text-[0.8vw]'} font-bold ${isSidebarOpen ? 'min-w-[2vw]' : 'min-w-[2.5vw]'} text-center`} style={{ color: getLayoutColor('toolbar-bg', primaryColor) }}>
                                    {Math.round((dimWidth / initialWidth) * 100)}%
                                </span>
                                <div className="group relative flex items-center justify-center h-full">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                                        className={`${isSidebarOpen ? (isTablet ? 'w-[1.7vw] h-[1.7vw]' : 'w-[1.85vw] h-[1.85vw]') : (isTablet ? 'w-[2.1vw] h-[2.1vw]' : 'w-[2.3vw] h-[2.3vw]')} rounded-full flex items-center justify-center transition-all shadow-sm`}
                                        style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor), color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                                    >
                                        <Icon icon="lucide:zoom-in" style={{ width: isSidebarOpen ? '0.9vw' : '1.1vw', height: isSidebarOpen ? '0.9vw' : '1.1vw' }} />
                                    </button>
                                    <div className="absolute top-[calc(100%+0.5vw)] left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap pointer-events-none z-[9999]"
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
                                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
                                        }}>
                                        Zoom In
                                        <div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-b-[0.35vw] border-l-[0.35vw] border-r-[0.35vw]" style={{ borderBottomColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                                    </div>
                                </div>
                                <div className="group relative flex items-center justify-center h-full">
                                    <button
                                        onClick={() => {
                                            setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                            setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                                        }}
                                        className={`text-[0.7vw] font-bold px-[0.8vw] ${isSidebarOpen ? (isTablet ? 'h-[1.3vw]' : 'h-[1.45vw]') : (isTablet ? 'h-[1.7vw]' : 'h-[1.9vw]')} rounded-full flex items-center justify-center transition-all shadow-sm`}
                                        style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), color: getLayoutColor('toolbar-bg', primaryColor) }}
                                    >
                                        Reset
                                    </button>
                                    <div className="absolute top-[calc(100%+0.5vw)] left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap pointer-events-none z-[9999]"
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
                                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
                                        }}>
                                        Reset Zoom
                                        <div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-b-[0.35vw] border-l-[0.35vw] border-r-[0.35vw]" style={{ borderBottomColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="w-[1px] h-[2vh] bg-white mx-[0.2vw] opacity-40" />

                        {/* Profile */}
                        {(settings?.brandingProfile?.profile ?? true) && (
                            <ToolbarBtn toolbarProps={toolbarProps}
                                id="layout8-profile-btn"
                                icon="fluent:person-24-filled"
                                label="Profile"
                                onClick={(e) => { e.stopPropagation(); handleMenuClick(setShowProfilePopup, showProfilePopup, e, 'profile'); }}
                                isActive={showProfilePopup}
                            />
                        )}
                        {/* Share */}
                        {(settings?.shareExport?.share ?? true) && (
                            <ToolbarBtn toolbarProps={toolbarProps}
                                icon="mage:share-fill"
                                label="Share"
                                onClick={handleShare}
                            />
                        )}
                        {/* Download */}
                        {(settings?.shareExport?.download ?? true) && (
                            <ToolbarBtn toolbarProps={toolbarProps}
                                icon="meteor-icons:download"
                                label="Download"
                                onClick={handleDownload}
                            />
                        )}
                        {/* Fullscreen */}
                        {(settings?.viewing?.fullScreen ?? true) && <ToolbarBtn toolbarProps={toolbarProps}
                            icon={isFullscreen ? "lucide:minimize" : "lucide:fullscreen"}
                            label="Fullscreen"
                            onClick={handleFullScreen}
                            isActive={isFullscreen}
                        />}
                    </div>
                </div>

                {/* Right: Logo */}
                <div className="flex-1 flex justify-end items-center gap-[1vw] pointer-events-auto pr-[1vw]">
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
                                    className={`${isTablet ? 'h-[2vw]' : 'h-[2.8vw]'} w-auto transition-opacity`}
                                    style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                                />
                            </a>
                        ) : (
                            <button className="transition-opacity hover:opacity-80 cursor-default">
                                <img
                                    src={logoSettings.src}
                                    alt="Logo"
                                    className={`${isTablet ? 'h-[2vw]' : 'h-[2.8vw]'} w-auto transition-opacity`}
                                    style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                                />
                            </button>
                        )
                    )}
                </div>
            </div>
            )}


            {/* â•â•â•â•â•â•â•â•â•â•â• Main Book Canvas â•â•â•â•â•â•â•â•â•â•â• */}
            <div className="flex-1 flex justify-center items-center w-full z-10 pt-[8vh] pb-[12vh]"
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
                    className="transition-all duration-600 ease-in-out"
                    style={{
                        transform: `translateX(${localOffset}px) scale(1)`,
                        transformOrigin: 'center center'
                    }}
                >
                    {modifiedChildren}
                </div>
            </div>

            {/* â•â•â•â•â•â•â•â•â•â•â• Page Numbers Below Pages Removed â•â•â•â•â•â•â•â•â•â•â• */}

            {/* â•â•â•â•â•â•â•â•â•â•â• Floating Action Buttons Removed â•â•â•â•â•â•â•â•â•â•â• */}


            {/* â•â•â•â•â•â•â•â•â•â•â• Top Thumbnail Bar â•â•â•â•â•â•â•â•â•â•â• */}
            <>
                {!isTablet && (settings?.navigation?.pageThumbnails ?? true) && showThumbnails && (
                    <>
                        {/* Invisible click-to-close overlay */}
                        <div
                            className="fixed inset-0 z-[44] cursor-default"
                            onClick={() => setShowThumbnails(false)}
                        />
                        <div
                            key="thumb-panel"
                            id="layout8-thumb-panel"
                            className="absolute w-[44.8vw] h-[11vw] z-[45] pointer-events-auto flex flex-col"
                            style={{
                                top: addTextBelowIcons
                                    ? (isTablet ? 'calc(5.6vh + 0.5vw)' : 'calc(6.2vh + 0.5vw)')
                                    : (isTablet ? 'calc(5.6vh + 0.7vw)' : 'calc(6.2vh + 0.7vw)'),
                                marginTop: '-3.6vw',
                                left: popupPositions['thumbnails'] ? `${popupPositions['thumbnails']}px` : '50%',
                                transform: `translateX(-30%)`
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* SVG Background Layer */}
                            <div className="absolute inset-0 z-0 pointer-events-none">
                                <svg width="100%" height="100%" viewBox="0 0 780 195" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                    <defs>
                                        <clipPath id="thumb-shape-clip" clipPathUnits="objectBoundingBox">
                                            <path transform="scale(0.00128205, 0.005128205)" d="M0 87C0 75.9543 8.95431 67 20 67H760C771.046 67 780 75.9543 780 87V175C780 186.046 771.046 195 760 195H20C8.9543 195 0 186.046 0 175V87Z" />
                                            <path transform="scale(0.00128205, 0.005128205) translate(235.54, 67) scale(0.85, 0.9) translate(-361.9, -67)" d="M328.818 33.0909C328.818 14.8153 343.633 0 361.909 0C380.185 0 395 14.8153 395 33.0909V41.7377C395.011 60.2573 398.967 66.6391 417 67H304C322.752 67 328.818 52.7213 328.818 41.7377V33.0909Z" />
                                        </clipPath>
                                    </defs>
                                    <path d="M0 87C0 75.9543 8.95431 67 20 67H760C771.046 67 780 75.9543 780 87V175C780 186.046 771.046 195 760 195H20C8.9543 195 0 186.046 0 175V87Z" fill={getLayoutColor('dropdown-bg', primaryColor)} fillOpacity="0.8"/>
                                    <path transform="translate(235.54, 67) scale(0.85, 0.9) translate(-361.9, -67)" d="M328.818 33.0909C328.818 14.8153 343.633 0 361.909 0C380.185 0 395 14.8153 395 33.0909V41.7377C395.011 60.2573 398.967 66.6391 417 67H304C322.752 67 328.818 52.7213 328.818 41.7377V33.0909Z" fill={getLayoutColor('dropdown-bg', primaryColor)} fillOpacity="0.8"/>
                                </svg>
                            </div>

                            {/* Content Layer */}
                            <div
                                className="relative z-10 w-full h-full flex items-center pt-[4.2vw] pb-[0vw] px-[1vw] backdrop-blur-md"
                                style={{ 
                                    clipPath: 'url(#thumb-shape-clip)', 
                                    WebkitClipPath: 'url(#thumb-shape-clip)' 
                                }}
                            >
                                {/* Left Arrow */}
                                {spreads.length > 6 && (
                                    <button
                                        onClick={() => thumbScrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                                        className={`z-10 transition-opacity p-[0.5vw] ${canThumbScrollLeft ? 'opacity-100 hover:opacity-80 cursor-pointer' : 'opacity-30 cursor-default'}`}
                                        disabled={!canThumbScrollLeft}
                                        style={{ color: isLightColor(getLayoutColor('dropdown-bg', primaryColor)) ? bodyTextColor : getLayoutColor('dropdown-text', '#FFFFFF') }}
                                    >
                                        <Icon icon="lucide:arrow-left" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                                    </button>
                                )}

                                {/* Scrollable thumbnail row - Showing Double Spreads */}
                                <div
                                    ref={thumbScrollRef}
                                    onScroll={checkThumbScroll}
                                    className="flex-1 flex gap-[0.8vw] px-[0.5vw] items-center overflow-x-auto h-full py-[0.5vh]"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    {spreads.map((spread, spreadIdx) => {
                                        const isCurrent = spread.indices.includes(currentPage);
                                        const vw = typeof window !== 'undefined' ? window.innerWidth / 100 : 19.2;
                                        const pageWidth = dimWidth || 400;
                                        const pageHeight = dimHeight || 566;
                                        const availableHeightVw = pageHeight > pageWidth ? 4.2 : 3.3;
                                        const availableHeightPx = availableHeightVw * vw;
                                        const thumbScale = availableHeightPx / pageHeight;
                                        const scaledWidthPx = pageWidth * thumbScale;
                                        const totalWidthPx = scaledWidthPx * 2;

                                        return (
                                            <div
                                                key={spreadIdx}
                                                data-thumb-index={spread.indices[0]}
                                                onClick={() => { onPageClick(spread.indices[0]); }}
                                                className="flex-shrink-0 flex flex-col items-center cursor-pointer group py-[0.5vh]"
                                            >
                                                <div
                                                    className="rounded-[0.5vw] overflow-hidden transition-all duration-300 bg-white shadow-lg flex flex-col items-center justify-center px-[0.3vw] pt-[0.3vw] pb-[0.2vw]"
                                                    style={{
                                                        width: `${totalWidthPx + (0.6 * vw)}px`, // padding included
                                                        height: 'auto',
                                                        border: isCurrent ? `0.12vw solid ${getLayoutColor('dropdown-bg', primaryColor)}` : 'none',
                                                        transform: isCurrent ? 'scale(1.04)' : 'scale(1)'
                                                    }}
                                                >
                                                    {/* Pages Spread container */}
                                                    <div className="flex w-full gap-0 items-center justify-center overflow-hidden bg-gray-50 rounded-[0.1vw]" style={{ height: `${availableHeightVw}vw` }}>
                                                        {spread.pages.map((page, pIdx) => (
                                                            <div key={`${spreadIdx}-${pIdx}`} className="bg-white overflow-hidden relative flex items-center justify-center border-0" style={{ width: `${scaledWidthPx}px`, height: '100%' }}>
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

                                                    <div className="w-full flex justify-center py-[0.1vw] mt-[0.2vw]">
                                                        <span className="text-[0.6vw] font-bold tracking-tight text-[#555555]">
                                                            {spread.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right Arrow */}
                                {spreads.length > 6 && (
                                    <button
                                        onClick={() => thumbScrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                                        className={`z-10 transition-opacity p-[0.5vw] ${canThumbScrollRight ? 'opacity-100 hover:opacity-80 cursor-pointer' : 'opacity-30 cursor-default'}`}
                                        disabled={!canThumbScrollRight}
                                        style={{ color: isLightColor(getLayoutColor('dropdown-bg', primaryColor)) ? bodyTextColor : getLayoutColor('dropdown-text', '#FFFFFF') }}
                                    >
                                        <Icon icon="lucide:arrow-right" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </>

            {/* Bottom Navigation Bar*/}
            {!isTablet && (
            <div
                className={`absolute bottom-0 w-full ${isTablet ? 'h-[8.5vh]' : 'h-[10vh]'} flex items-center z-[100] transition-all duration-500 ease-in-out ${isFullscreen ? (!isCanvasHovered ? 'pointer-events-auto' : 'pointer-events-none') : 'pointer-events-auto'}`}
                style={{ opacity: isFullscreen && isCanvasHovered ? 0 : 1 }}
            >
                <div className="w-full flex items-center justify-between px-[2vw]">
                    {/* Left: Book Name */}
                    {/* Left: Book Name */}
                    <div className="flex-1 flex justify-start pointer-events-auto">
                        <span className="font-bold tracking-wide truncate max-w-[80%]" style={{ 
                            color: (() => {
                                const c1 = getLayoutColor('toolbar-bg', primaryColor);
                                const c2 = getLayoutColor('toolbar-text-main', '#555555');
                                const isWhite = (c) => typeof c === 'string' && (c.toLowerCase() === '#ffffff' || c.replace(/\s/g, '') === 'rgb(255,255,255)' || c.replace(/\s/g, '') === 'rgba(255,255,255,1)');
                                return isWhite(c1) ? c2 : c1;
                            })(), 
                            fontSize: isTablet ? '1vw' : '1.2vw' 
                        }}>
                            {/* bookName hidden */}
                        </span>
                    </div>

                    {/* Center: Controls */}
                    <div className="flex items-center gap-[1.2vw] shrink-0 pointer-events-auto">
                    {/* First Page */}
                    {(settings?.navigation?.startEndNav ?? true) && (
                        <div className="group relative">
                            <button
                                onClick={() => onPageClick(0)}
                                className={`${isSidebarOpen ? (isTablet ? 'w-[1.7vw] h-[1.7vw]' : 'w-[1.85vw] h-[1.85vw]') : 'w-[2.6vw] h-[2.6vw]'} rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all`}
                                style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                            >
                                <Icon icon="ph:skip-back-fill" style={{ width: isSidebarOpen ? (isTablet ? '0.9vw' : '0.95vw') : '1.1vw', height: isSidebarOpen ? (isTablet ? '0.9vw' : '0.95vw') : '1.1vw' }} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                            </button>
                            <div className="absolute bottom-[calc(100%+0.5vw)] left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap pointer-events-none z-[9999]"
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
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
                                }}>
                                First Page
                                <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-t-[0.35vw] border-l-[0.35vw] border-r-[0.35vw]" style={{ borderTopColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                            </div>
                        </div>
                    )}

                    {/* Prev Page */}
                    {(settings?.navigation?.nextPrevButtons ?? true) && (
                        <div className="group relative">
                            <button
                                onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                                className={`${isSidebarOpen ? (isTablet ? 'w-[1.7vw] h-[1.7vw]' : 'w-[1.85vw] h-[1.85vw]') : 'w-[2.6vw] h-[2.6vw]'} rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all`}
                                style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                            >
                                <Icon icon="lucide:chevron-left" style={{ width: isSidebarOpen ? (isTablet ? '0.9vw' : '0.95vw') : '1.2vw', height: isSidebarOpen ? (isTablet ? '0.9vw' : '0.95vw') : '1.2vw' }} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                            </button>
                            <div className="absolute bottom-[calc(100%+0.5vw)] left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap pointer-events-none z-[9999]"
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
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
                                }}>
                                Previous Page
                                <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-t-[0.35vw] border-l-[0.35vw] border-r-[0.35vw]" style={{ borderTopColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                            </div>
                        </div>
                    )}

                    {/* Page Info Pill */}
                    {(settings?.navigation?.pageQuickAccess ?? true) && (
                        <div
                            className="rounded-full px-[1.8vw] py-[0.6vh] flex items-center shadow-md"
                            style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                        >
                            <span className={`text-[0.75vw] lg:text-[0.85vw] font-medium tracking-wide`} style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                                Page
                            </span>
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
                                className={`${isTablet ? 'text-[0.75vw] mx-[0.3vw] px-[0.15vw] py-[0.1vw]' : 'text-[0.85vw] mx-[0.4vw] px-[0.2vw] py-[0.15vw]'} font-medium tracking-wide rounded-[0.25vw] outline-none text-center transition-colors shadow-inner`}
                                style={{
                                    color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                    width: `${String(pages.length).length + 1.2}ch`,
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    border: `1px solid rgba(255,255,255,0.35)`
                                }}
                                onFocus={(e) => {
                                    e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                                    e.target.style.borderColor = 'rgba(255,255,255,0.6)';
                                }}
                                onMouseOver={(e) => {
                                    if(document.activeElement !== e.target) {
                                        e.target.style.backgroundColor = 'rgba(255,255,255,0.25)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if(document.activeElement !== e.target) {
                                        e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                                    }
                                }}
                            />
                            <span className={`text-[0.75vw] lg:text-[0.85vw] font-medium tracking-wide`} style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                                / {totalPages}
                            </span>
                        </div>
                    )}

                    {/* Next Page */}
                    {(settings?.navigation?.nextPrevButtons ?? true) && (
                        <div className="group relative">
                            <button
                                onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                                className={`${isSidebarOpen ? (isTablet ? 'w-[1.7vw] h-[1.7vw]' : 'w-[1.85vw] h-[1.85vw]') : 'w-[2.6vw] h-[2.6vw]'} rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all`}
                                style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                            >
                                <Icon icon="lucide:chevron-right" style={{ width: isSidebarOpen ? (isTablet ? '0.9vw' : '0.95vw') : '1.2vw', height: isSidebarOpen ? (isTablet ? '0.9vw' : '0.95vw') : '1.2vw' }} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                            </button>
                            <div className="absolute bottom-[calc(100%+0.5vw)] left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap pointer-events-none z-[9999]"
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
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
                                }}>
                                Next Page
                                <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-t-[0.35vw] border-l-[0.35vw] border-r-[0.35vw]" style={{ borderTopColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                            </div>
                        </div>
                    )}

                    {/* Last Page */}
                    {(settings?.navigation?.startEndNav ?? true) && (
                        <div className="group relative">
                            <button
                                onClick={() => onPageClick(totalPages - 1)}
                                className={`${isSidebarOpen ? (isTablet ? 'w-[1.7vw] h-[1.7vw]' : 'w-[1.85vw] h-[1.85vw]') : 'w-[2.6vw] h-[2.6vw]'} rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all`}
                                style={{ backgroundColor: getLayoutColor('toolbar-bg', primaryColor) }}
                            >
                                <Icon icon="ph:skip-forward-fill" style={{ width: isSidebarOpen ? (isTablet ? '0.9vw' : '0.95vw') : '1.1vw', height: isSidebarOpen ? (isTablet ? '0.9vw' : '0.95vw') : '1.1vw' }} color={getLayoutColor('toolbar-text-main', '#FFFFFF')} />
                            </button>
                            <div className="absolute bottom-[calc(100%+0.5vw)] left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap pointer-events-none z-[9999]"
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
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
                                }}>
                                Last Page
                                <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-solid border-l-transparent border-r-transparent border-t-[0.35vw] border-l-[0.35vw] border-r-[0.35vw]" style={{ borderTopColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                            </div>
                        </div>
                    )}
                    </div>

                    {/* Right: Spacer for balance */}
                    <div className="flex-1 pointer-events-none"></div>
                </div>
            </div>
            )}

        </div>
    );
};

export default Grid8Layout;
