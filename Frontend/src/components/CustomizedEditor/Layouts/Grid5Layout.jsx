import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';


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

const Grid5Layout = ({
    children,
    settings,
    bookName,
    layoutColors,
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
    onDeleteBookmark,
    onUpdateBookmark,
    notes,
    onAddNote,
    profileSettings,
    isSidebarOpen,
    showViewBookmarkPopup,
    backgroundSettings,
    backgroundStyle,
    isMuted,
    onToggleAudio,
    setShowGalleryPopupMemo,
    showGalleryPopup,
    showSharePopup,
    showExportPopup,
    otherSetupSettings,
    setIsMuted,
    isFlipMuted,
    setIsFlipMuted,
    showSoundPopup,
    setShowSoundPopupMemo,
    isTablet,
    showTOC,
    isMobileLandscape,
    isFullscreen: isFullscreenProp
,
    offset = 0,
}) => {
    // ... rest of the setup logic
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
        if (bgSoundMasterEnabled && setIsMuted) {
            setIsMuted(!isMuted);
        }
    };

    const initialWidth = (children && children.props && children.props.WIDTH) ? children.props.WIDTH : 400;
    const initialHeight = (children && children.props && children.props.HEIGHT) ? children.props.HEIGHT : 566;

    const [dimWidth, setDimWidth] = useState(isMobileLandscape ? initialWidth * 0.95 : isTablet ? initialWidth * 0.7 : initialWidth);
    const [dimHeight, setDimHeight] = useState(isMobileLandscape ? initialHeight * 0.9 : isTablet ? initialHeight * 0.7 : initialHeight);
    const aspectRatio = initialHeight / initialWidth;

    React.useEffect(() => {
        setDimWidth(isMobileLandscape ? initialWidth * 0.95 : isTablet ? initialWidth * 0.7 : initialWidth);
        setDimHeight(isMobileLandscape ? initialHeight * 0.9 : isTablet ? initialHeight * 0.7 : initialHeight);
    }, [isTablet, isMobileLandscape, initialWidth, initialHeight]);

    const zoomIn = React.useCallback(() => {
        setDimWidth(prev => {
            const nextWidth = Math.min(prev + (initialWidth * 0.01), initialWidth * 1.5);
            setDimHeight(nextWidth * aspectRatio);
            return nextWidth;
        });
    }, [aspectRatio, initialWidth]);

    const zoomOut = React.useCallback(() => {
        setDimWidth(prev => {
            const nextWidth = Math.max(prev - (initialWidth * 0.01), initialWidth * 0.5);
            setDimHeight(nextWidth * aspectRatio);
            return nextWidth;
        });
    }, [aspectRatio, initialWidth]);

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

    // Keyboard and Mouse Wheel Actions
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Prevent interference with search input or other text fields
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

        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) zoomIn();
                else zoomOut();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('wheel', handleWheel);
        };
    }, [zoomIn, zoomOut, bookRef]);

    const getLayoutColor = (tokenId, defaultColor) => {
        return layoutColors?.[5]?.[tokenId] || `var(--${tokenId}, ${defaultColor})`;
    };

    const getLayoutOpacity = (tokenId, defaultOpacity) => {
        return layoutColors?.[5]?.[`${tokenId}-opacity`] || 1;
    };

    const getLayoutColorRgba = (tokenId, defaultRgb, defaultOpacity) => {
        const color = getLayoutColor(tokenId, null);
        const opacity = getLayoutOpacity(tokenId, defaultOpacity);
        if (color && typeof color === 'string' && color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16) || 0;
            const g = parseInt(color.slice(3, 5), 16) || 0;
            const b = parseInt(color.slice(5, 7), 16) || 0;
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return `rgba(var(--${tokenId}-rgb, ${defaultRgb}), var(--${tokenId}-opacity, ${defaultOpacity}))`;
    };

    const getLayoutColorAlpha = (tokenId, defaultRgb, alpha) => {
        const color = getLayoutColor(tokenId, null);
        if (color && typeof color === 'string' && color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16) || 0;
            const g = parseInt(color.slice(3, 5), 16) || 0;
            const b = parseInt(color.slice(5, 7), 16) || 0;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgba(var(--${tokenId}-rgb, ${defaultRgb}), ${alpha})`;
    };

    const isPdfProject = pages?.some(p => p.html && p.html.includes('data-name="PDF Background"'));
    const totalPages = pagesCount;
    const progressPercentage = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0;

    const previewAreaRef = useRef(null);
    const [responsiveScale, setResponsiveScale] = useState(1);

    // Responsive scaling logic for Mobile Landscape
    React.useEffect(() => {
        if (!isMobileLandscape) {
            setResponsiveScale(1);
            return;
        }

        const updateScale = () => {
            if (previewAreaRef.current) {
                const cw = previewAreaRef.current.clientWidth;
                const ch = previewAreaRef.current.clientHeight;
                const availableW = cw * 0.95;
                const availableH = ch * 0.95;
                const baseSpreadW = (initialWidth * 0.95) * 2;
                const baseSpreadH = initialHeight * 0.9;
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

    const [showThumbnails, setShowThumbnails] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const isFullscreen = isFullscreenProp || false;
    const isCanvasHovered = false; const setIsCanvasHovered = () => {};
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    // using showProfilePopup from props instead of local state
    const [showBookmarkLocal, setShowBookmarkLocal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [tocSearchQuery, setTocSearchQuery] = useState('');

    // Automatically close popups if their corresponding setting is disabled
    useEffect(() => {
        if (showThumbnails && !(settings?.navigation?.pageThumbnails ?? true)) {
            setShowThumbnails(false);
        }
        if (showTOC && !(settings?.navigation?.tableOfContents ?? true)) {
            setShowTOCMemo?.(false);
        }
        if (showProfilePopup && !(settings?.brandingProfile?.profile ?? true)) {
            setShowProfilePopup?.(false);
        }
        if (showGalleryPopup && !(settings?.interaction?.gallery ?? true)) {
            setShowGalleryPopupMemo?.(false);
        }
        if (showSoundPopup && !(settings?.media?.backgroundAudio ?? true)) {
            setShowSoundPopupMemo?.(false);
        }
    }, [
        settings?.navigation, 
        settings?.brandingProfile, 
        settings?.interaction, 
        settings?.media, 
        showThumbnails, 
        showTOC, 
        showProfilePopup, 
        showGalleryPopup, 
        showSoundPopup,
        setShowTOCMemo,
        setShowProfilePopup,
        setShowGalleryPopupMemo,
        setShowSoundPopupMemo
    ]);

    const hasProfileData = profileSettings && (
        (profileSettings.name && profileSettings.name !== 'Name' && profileSettings.name.trim() !== '') ||
        (profileSettings.about && profileSettings.about.trim() !== '') ||
        profileSettings.twitter ||
        profileSettings.facebook ||
        profileSettings.email ||
        profileSettings.instagram ||
        profileSettings.phone
    );

    const scrollRef = useRef(null);
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
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));

    // Toolbar display settings
    const addTextBelowIcons = settings?.toolbar?.addTextBelowIcons ?? false;
    const textFont = settings?.toolbar?.textProperties?.font || 'inherit';

    // Helper: renders an icon button with optional text label below and tooltip on hover
    const renderToolbarBtn = (iconEl, label, onClick, extraStyle = {}, extraClassName = '', isActive = false) => (
        <div className="relative group flex flex-col items-center justify-center">
            <button
                className={`flex flex-col items-center justify-center ${extraClassName}`}
                style={{ ...extraStyle, fontFamily: textFont, opacity: isActive ? 0.7 : (extraStyle.opacity ?? 1) }}
                onClick={onClick}
            >
                <div className="transition-all transform group-hover:scale-110 flex items-center justify-center">
                    {iconEl}
                </div>
                {addTextBelowIcons && (
                    <span
                        className={`${isTablet ? 'text-[0.4vw]' : 'text-[0.65vw]'} font-medium mt-[0.1vw] leading-none whitespace-nowrap`}
                        style={{
                            color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1),
                            fontFamily: textFont,
                            opacity: getLayoutOpacity('toolbar-text-main', 1)
                        }}
                    >
                        {label}
                    </span>
                )}
            </button>
            {/* Tooltip â€” only shown when labels are not already displayed below icons */}
            {!addTextBelowIcons && (
                <div
                    className="absolute bottom-full mb-[1.2vw] left-1/2 -translate-x-1/2 whitespace-nowrap hidden group-hover:block pointer-events-none z-[9999]"
                    style={{
                        background: 'rgba(10, 10, 12, 0.55)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        padding: isTablet ? '0.2vw 0.4vw' : '0.25vw 0.5vw',
                        borderRadius: '0.3vw',
                        fontSize: isTablet ? '0.5vw' : '0.62vw',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                    }}
                >
                    {label}
                    {/* Arrow pointing down */}
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                        style={{
                            borderLeft: '0.35vw solid transparent',
                            borderRight: '0.35vw solid transparent',
                            borderTop: '0.45vw solid rgba(10, 10, 12, 0.55)',
                        }}
                    />
                </div>
            )}
        </div>
    );

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

    const spreads = useMemo(() => {
        const result = [];
        if (pages && pages.length > 0) {
            result.push({ pages: [pages[0]], indices: [0], label: 'Page 1' });
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

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [spreads, showThumbnails]);

    useEffect(() => {
        if (showThumbnails && scrollRef.current) {
            const activeElem = scrollRef.current.querySelector('.active-thumbnail');
            if (activeElem) {
                activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [currentPage, showThumbnails]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = window.innerWidth * 0.3;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative font-sans" style={backgroundStyle} onClick={() => {
            setRecommendations([]);
            setShowThumbnails(false);
            setShowTOCMemo?.(false);
            setShowBookmarkLocal(false);
            setShowProfilePopup(false);
            setShowSoundPopupMemo(false);
        }}>
            {/* â”€â”€ TOP BAR â”€â”€ White with search | title | logo */}
            {!isTablet && (
            <div
                className={`magazine-toolbar ${isMobileLandscape ? 'h-[14%]' : isTablet ? 'h-[5.2vh]' : 'h-[7.5vh]'} flex items-center justify-between px-[1.5vw] shrink-0 w-full z-50 transition-all duration-500 ease-in-out ${isFullscreen ? `absolute top-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`}
            >

                {/* Left: Search Pill */}
                <div className="flex items-center">
                    {settings?.interaction?.search !== false && !isPdfProject && (
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <div
                                className={`flex items-center rounded-[0.5vw] ${isTablet ? 'px-[0.8vw] py-[0.35vw]' : 'px-[1vw] py-[0.45vw]'} shadow-sm border border-black/10 group transition-all duration-300 ${isSidebarOpen ? (isTablet ? 'w-[9.5vw]' : 'w-[11.5vw]') : (isTablet ? 'w-[11.5vw]' : 'w-[15vw]')}`}
                                style={{ backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) }}
                            >
                                <Icon
                                    icon="ph:magnifying-glass-bold"
                                    className={`${isMobileLandscape ? 'w-[0.6vw] h-[0.6vw]' : isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[1vw] h-[1vw]'}`}
                                    style={{ color: getLayoutColor('toolbar-bg', '#555555') }}
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
                                    placeholder="Quick Search..."
                                    className={`bg-transparent border-0 outline-none focus:outline-none focus:ring-0 ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} ml-[0.6vw] w-full font-medium`}
                                    style={{ color: getLayoutColor('toolbar-bg', '#555555') }}
                                />
                            </div>

                            {/* Recommendations Dropdown */}
                            {recommendations.length > 0 && (
                                <div className={`absolute ${isTablet ? 'top-[2.5vw]' : 'top-[3.2vw]'} left-0 rounded-[0.8vw] shadow-2xl z-[100] overflow-hidden border transition-all ${isSidebarOpen ? (isTablet ? 'w-[9.5vw]' : 'w-[11.5vw]') : (isTablet ? 'w-[11.5vw]' : 'w-[15vw]')}`}
                                    style={{
                                        backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1'),
                                        borderColor: getLayoutColorRgba('dropdown-text', '87, 92, 156', 1)
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="px-[1.2vw] py-[0.6vw]">
                                        <span
                                            className="text-[0.8vw] font-bold"
                                            style={{ color: getLayoutColorRgba('dropdown-text', '87, 92, 156', 1) }}
                                        >Suggestion</span>
                                    </div>
                                    <div className="flex flex-col py-[0.4vw]">
                                        {recommendations.map((rec, idx) => (
                                            <button
                                                key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                className="flex items-center justify-between px-[1.2vw] py-[0.7vw] hover:bg-black/5 transition-colors group"
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
                                                        <span className="font-bold mr-[0.3vw]" style={{ color: getLayoutColorRgba('dropdown-text', '87, 92, 156', 1), fontWeight: 800 }}>{rec.word}</span>
                                                        {rec.context && <span className="font-normal opacity-70" style={{ color: getLayoutColorRgba('dropdown-text', '87, 92, 156', 1) }}>{rec.context}</span>}
                                                    </span>
                                                </div>
                                                <span
                                                    className="text-[0.8vw] font-bold tabular-nums shrink-0"
                                                    style={{ color: getLayoutColorRgba('dropdown-text', '87, 92, 156', 1), opacity: 'var(--dropdown-text-opacity, 0.5)' }}
                                                >Pg {rec.pageNumber}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Center: Book Title */}
                <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
                    <span
                        className={`${isTablet ? 'text-[0.9vw]' : 'text-[1.1vw]'} font-semibold tracking-tight`}
                        style={{ color: getLayoutColor('search-text-v1', '#9BA0C9') }}
                    >{/* {bookName} */}</span>
                </div>

                {/* Right: Brand Logo */}
                <div className="flex items-center">
                    {settings.brandingProfile.logo && logoSettings?.src && (
                        <img
                            src={logoSettings.src}
                            alt="Brand Logo"
                            className={`${isTablet ? 'h-[1.6vw]' : 'h-[2.2vw]'} w-auto transition-all`}
                            style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                        />
                    )}
                </div>
            </div>
            )}

            {/* â”€â”€ MAIN CONTENT AREA â”€â”€ */}
            {/* Book Viewer Container */}
            <div ref={previewAreaRef} className={`flex-1 flex items-center justify-center ${isFullscreen ? 'p-0' : 'px-[4vw]'} magazine-canvas relative min-h-0`}
                onMouseMove={(e) => {
                    if (!isFullscreen) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const EDGE_ZONE = 72;
                    const nearEdge = x < EDGE_ZONE || y < EDGE_ZONE || y > rect.height - EDGE_ZONE;
                    setIsCanvasHovered(!nearEdge);
                }}
                onMouseLeave={() => isFullscreen && setIsCanvasHovered(false)}
            >

                {/* Flipbook Container */}
                <div
                    className="relative transition-all duration-600 ease-in-out magazine-content-area"
                    style={{
                        transform: `translateX(${localOffset}px) scale(${isMobileLandscape ? responsiveScale : 1})`,
                        transformOrigin: 'center center',
                        width: dimWidth * 2,
                        height: dimHeight,
                        filter: 'drop-shadow(0 2vw 5vw rgba(0,0,0,0.15))'
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
                            <Icon icon="ph:caret-left" className={`${isMobileLandscape ? 'w-[1vw] h-[1vw]' : isTablet ? 'w-[1.5vw] h-[1.5vw]' : 'w-[2vw] h-[2vw]'} hover:-translate-x-1 transition-transform`} />
                        </button>
                    )}

                    {/* Right Navigate Button â€” hugs the visible page's right edge */}
                    {(settings?.navigation?.nextPrevButtons ?? true) && (
                        <button
                            className="absolute top-1/2 -translate-y-1/2 translate-x-full transition-all z-20 pointer-events-auto opacity-60 hover:opacity-100"
                            style={{ right: localOffset > 0 ? `calc(${dimWidth}px - 0.8vw)` : '-0.8vw', color: getLayoutColor('toolbar-bg', '#555555') }}
                            onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                        >
                            <Icon icon="ph:caret-right" className={`${isMobileLandscape ? 'w-[1vw] h-[1vw]' : isTablet ? 'w-[1.5vw] h-[1.5vw]' : 'w-[2vw] h-[2vw]'} hover:translate-x-1 transition-transform`} />
                        </button>
                    )}
                </div>
            </div>

            {/* â”€â”€ BOTTOM BAR â”€â”€ UI Match to Screenshot */}
            {!isTablet && (
            <div className={`magazine-toolbar ${isMobileLandscape ? 'h-[11%]' : isTablet ? 'h-[5.5vh]' : 'h-[8vh]'} flex items-center px-[1.5vw] justify-between shrink-0 w-full z-40 bg-transparent overflow-visible transition-all duration-500 ease-in-out ${isFullscreen ? `absolute bottom-0 left-0 ${!isCanvasHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` : 'relative'}`}>
                {(settings?.navigation?.pageQuickAccess ?? true) && (
                    <div className={`rounded-full flex items-center p-[0.3vw] shadow-[0_0.2vw_1vw_rgba(0,0,0,0.06)] border border-gray-100 shrink-0 ${isMobileLandscape ? 'h-[65%] gap-[0.5vw] px-[0.8vw]' : isTablet ? 'h-[4vh] gap-[0.2vw] px-[0.2vw]' : 'h-[6vh] gap-[0.3vw] px-[0.5vw]'}`}
                        style={{
                            backgroundColor: currentPage === 0
                                ? getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '1')
                                : getLayoutColorRgba('toolbar-bg', '87, 92, 156', '1')
                        }}
                    >
                        <span
                            className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.78vw]'} font-bold select-none whitespace-nowrap`}
                            style={{ color: currentPage === 0 ? getLayoutColor('toolbar-bg', '#555555') : getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) }}
                        >Page: </span>
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
                            className={`${isTablet ? 'text-[0.65vw] mx-[0.3vw] px-[0.15vw] py-[0.1vw]' : 'text-[0.78vw] mx-[0.4vw] px-[0.2vw] py-[0.15vw]'} font-bold rounded-[0.25vw] outline-none text-center transition-colors shadow-inner`}
                            style={{
                                width: `${String(pages.length).length + 1.2}ch`,
                                color: currentPage === 0 ? getLayoutColor('toolbar-bg', '#555555') : getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1),
                                backgroundColor: currentPage === 0 ? getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.1) : getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.2),
                                border: `1px solid ${currentPage === 0 ? getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.2) : getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.3)}`
                            }}
                            onFocus={(e) => {
                                e.target.style.backgroundColor = currentPage === 0 ? getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.15) : getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.3);
                                e.target.style.borderColor = currentPage === 0 ? getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.4) : getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.5);
                            }}
                            onMouseOver={(e) => {
                                if(document.activeElement !== e.target) {
                                    e.target.style.backgroundColor = currentPage === 0 ? getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.15) : getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.3);
                                }
                            }}
                            onMouseOut={(e) => {
                                if(document.activeElement !== e.target) {
                                    e.target.style.backgroundColor = currentPage === 0 ? getLayoutColorAlpha('toolbar-bg', '87, 92, 156', 0.1) : getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.2);
                                }
                            }}
                        />
                        <span
                            className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.78vw]'} font-bold select-none whitespace-nowrap`}
                            style={{ color: currentPage === 0 ? getLayoutColor('toolbar-bg', '#555555') : getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) }}
                        > / {totalPages}</span>
                    </div>
                )}

                {/* Center: Long Tool Strip */}
                <div
                    className={`flex-1 ${isMobileLandscape ? 'max-w-[80vw] mx-[1vw] h-[65%]' : isTablet ? (isSidebarOpen ? 'max-w-[68vw]' : 'max-w-[75vw]') + ' mx-[0.5vw] h-[4vh]' : (isSidebarOpen ? 'max-w-[68vw]' : 'max-w-[78vw]') + ' mx-[0.8vw] h-[6vh]'} rounded-full flex items-center ${isTablet ? 'px-[1vw]' : 'px-[1.5vw]'} shadow-[0_0.5vw_2.5vw_rgba(0,0,0,0.15)] border border-white/10 relative`}
                    style={{ backgroundColor: getLayoutColorRgba('bottom-toolbar-bg', '87, 92, 156', '1') }}
                >
                    {/* Functional Icons Group */}
                    <div className={`flex items-center ${isTablet ? 'gap-[0.5vw] mr-[0.2vw]' : 'gap-[0.8vw] mr-[1.5vw]'} shrink-0`}>
                        {(settings?.navigation?.startEndNav ?? true) && renderToolbarBtn(
                            <Icon icon="ph:skip-back" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.25vw] h-[1.25vw]')}`} />,
                            'First',
                            () => onPageClick(0),
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) }
                        )}
                        {(settings?.media?.autoFlip ?? true) && renderToolbarBtn(
                            <Icon icon={isAutoFlipping ? 'ph:pause-fill' : 'ph:play-fill'} className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.15vw] h-[1.15vw]' : 'w-[1.3vw] h-[1.3vw]')}`} />,
                            isAutoFlipping ? 'Pause' : 'Play',
                            () => setIsPlaying(!isAutoFlipping),
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) }
                        )}
                        {(settings?.navigation?.startEndNav ?? true) && renderToolbarBtn(
                            <Icon icon="ph:skip-forward" className={`${isMobileLandscape ? 'w-[0.7vw] h-[0.7vw]' : isTablet ? 'w-[1vw] h-[1vw]' : (isSidebarOpen ? 'w-[1.1vw] h-[1.1vw]' : 'w-[1.25vw] h-[1.25vw]')}`} />,
                            'Last',
                            () => onPageClick(pagesCount - 1),
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) }
                        )}
                    </div>

                    {/* Progress Bar (With Expanded Hover Area) */}
                    <div
                        ref={progressRef}
                        className={`flex-1 ${isTablet ? 'h-[3vh] mr-[0.5vw] w-[2vw]' : 'h-[3vh] mr-[2.5vw]'} flex items-center relative group cursor-pointer`}
                        onClick={handleProgressClick}
                        onMouseMove={handleProgressMouseMove}
                        onMouseLeave={() => {
                            if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                            setProgressHover(prev => ({ ...prev, visible: false }));
                        }}
                    >
                        <div className={`w-full ${isTablet ? 'h-[0.25vh]' : 'h-[0.35vh]'} rounded-full relative overflow-hidden`}>
                            {/* Track Underlay */}
                            <div className="absolute inset-0 transition-colors duration-300" style={{ backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1), opacity: isTablet ? 0.4 : 0.3 }} />
                            {/* Progress Fill */}
                            <div
                                className="absolute top-0 left-0 h-full transition-all duration-300 ease-out z-10"
                                style={{
                                    width: `${progressPercentage}%`,
                                    backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1),
                                    opacity: 1
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
                                    className={`absolute z-[100] bottom-[calc(100%+0.5vw)] pointer-events-none`}
                                    style={{ left: `${progressHover.x}px` }}
                                >
                                    <div
                                        className={`absolute bottom-0 flex flex-col items-center ${isTablet ? `p-[0.6vw] ${progressHover.spread.pages.length === 1 ? 'rounded-[0.3vw]' : 'rounded-[0.6vw]'}` : `p-[0.5vw] ${progressHover.spread.pages.length === 1 ? 'rounded-[0.3vw]' : 'rounded-[0.8vw]'}`} shadow-[0_10px_40px_rgba(0,0,0,0.3)]`}
                                        style={{
                                            backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', 1),
                                            transform: progressHover.pageIndex === 0 ? 'translateX(-25%)' : 'translateX(-50%)',
                                            minWidth: isTablet ? '7vw' : '9vw'
                                        }}
                                    >
                                        <div className="w-full flex flex-col items-center px-[0.3vw]">
                                            <span
                                                className="font-bold whitespace-nowrap"
                                                style={{
                                                    fontSize: isTablet ? '0.7vw' : '0.85vw',
                                                    color: getLayoutColorRgba('dropdown-text', '87, 92, 156', 1)
                                                }}
                                            >
                                                {progressHover.spread.label}
                                            </span>

                                            <div
                                                className="w-full rounded-full"
                                                style={{
                                                    height: isTablet ? '2px' : '2.5px',
                                                    backgroundColor: getLayoutColorRgba('dropdown-text', '87, 92, 156', 1),
                                                    margin: isTablet ? '0.4vw 0' : '0.5vw 0'
                                                }}
                                            />

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

                                        {/* Arrow with border (inlet) effect */}
                                        <div
                                            className="absolute top-full left-1/2 -translate-x-1/2 pointer-events-none"
                                            style={{
                                                width: isTablet ? '1vw' : '1.3vw',
                                                height: isTablet ? '1.2vw' : '1.5vw',
                                                filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15))'
                                            }}
                                        >
                                            <svg width="100%" height="100%" viewBox="0 0 20 15" preserveAspectRatio="none">
                                                <path
                                                    d="M0 0 L10 15 L20 0"
                                                    fill={getLayoutColorRgba('dropdown-bg', '255, 255, 255', 1)}
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Functional Icons Group */}
                    <div className={`flex items-center ${isTablet ? 'gap-[0.9vw]' : 'gap-[1.15vw]'} shrink-0`}>
                        {/* TOC */}
                        <div className="relative">
                            {(settings?.navigation?.tableOfContents ?? true) && renderToolbarBtn(
                                <Icon icon="fluent:text-bullet-list-24-filled" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : (isSidebarOpen ? 'w-[1.15vw] h-[1.15vw]' : 'w-[1.3vw] h-[1.3vw]')}`} />,
                                'TOC',
                                (e) => {
                                    e.stopPropagation();
                                    setShowTOCMemo(!showTOC);
                                    setShowThumbnails(false);
                                    setShowBookmarkLocal(false);
                                    setShowProfilePopup(false);

                                    setShowSoundPopupMemo(false);
                                },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1), opacity: showTOC ? 0.7 : 1 }
                            )}

                            {showTOC && (
                                <>
                                    <div
                                        className={`magazine-popup absolute left-1/2 ${isTablet ? 'bottom-[2.8vw] -translate-x-[20%]' : 'bottom-[3.2vw] -translate-x-[15%]'} z-[160] mb-[0.2vw] animate-in fade-in slide-in-from-bottom-2 duration-200`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="relative">
                                            {/* Needle Pointer */}
                                            <div
                                                className={`absolute -bottom-[1.3vw] ${isTablet ? 'left-[20%]' : 'left-[15%]'} -translate-x-1/2 z-10 pointer-events-none`}
                                                style={{ width: '0.9vw', height: '1.4vw' }}
                                            >
                                                <svg width="100%" height="100%" viewBox="0 0 10 20" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M0 0L5 20L10 0" fill={getLayoutColorRgba('toc-bg', '255, 255, 255', 1)} />
                                                </svg>
                                            </div>
                                            {/* Popup Content */}
                                            <div
                                                className={`rounded-[1.2vw] shadow-[0_1vw_3vw_rgba(0,0,0,0.1)] ${isTablet ? 'w-[10vw]' : 'w-[15.5vw]'} flex flex-col relative z-20 overflow-hidden`}
                                                style={{
                                                    backgroundColor: 'transparent',
                                                }}
                                            >
                                                <div
                                                    className="absolute inset-0 z-0"
                                                    style={{ backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', 1) }}
                                                />
                                                <div className="relative z-10 p-[1.1vw] flex flex-col">
                                                    <h2
                                                        className={`${isTablet ? 'text-[0.8vw]' : 'text-[0.9vw]'} font-bold mb-[0.8vw] tracking-tight`}
                                                        style={{ color: getLayoutColorRgba('toc-text', '87, 92, 156', 1) }}
                                                    >Table of Contents</h2>

                                                    {/* Search Bar */}
                                                    {settings.tocSettings?.addSearch !== false && (
                                                        <div className="mb-[1vw]">
                                                            <div
                                                                className="flex items-center rounded-[0.4vw] px-[0.6vw] py-[0.4vw] border transition-all relative overflow-hidden"
                                                                style={{
                                                                    borderColor: 'transparent',
                                                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                                                                }}
                                                            >
                                                                <div
                                                                    className="absolute inset-0 z-0"
                                                                    style={{
                                                                        backgroundColor: '#FFFFFF',
                                                                        opacity: 0.15
                                                                    }}
                                                                />
                                                                <div className="relative z-10 flex items-center w-full">
                                                                    <Icon icon="lucide:search" className="w-[0.9vw] h-[0.9vw]" style={{ color: getLayoutColorRgba('toc-text', '255, 255, 255', 1), opacity: 0.7 }} />
                                                                    <input
                                                                        type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                                                                        value={tocSearchQuery}
                                                                        onChange={(e) => setTocSearchQuery(e.target.value)}
                                                                        placeholder="Search..."
                                                                        className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.65vw]' : 'text-[0.75vw]'} ml-[0.4vw] w-full placeholder:opacity-60`}
                                                                        style={{ color: getLayoutColorRgba('toc-text', '255, 255, 255', 1) }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                    {tocSearchQuery && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setTocSearchQuery(''); }}
                                                                            className="transition-colors"
                                                                            style={{ color: getLayoutColorRgba('toc-text', '255, 255, 255', 1), opacity: 0.5 }}
                                                                        >
                                                                            <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col gap-[0.6vw] max-h-[30vh] overflow-y-auto pr-[0.4vw] no-scrollbar">
                                                        {(() => {
                                                            const propContent = settings?.tocSettings?.content;
                                                            const propItems = settings?.tocSettings?.items;
                                                            const propToc = settings?.tocSettings?.toc;
                                                            const content = (Array.isArray(propContent) && propContent.length > 0)
                                                                ? propContent
                                                                : (Array.isArray(propItems) && propItems.length > 0)
                                                                    ? propItems
                                                                    : (Array.isArray(propToc?.items) && propToc.items.length > 0)
                                                                        ? propToc.items
                                                                        : (propContent || propItems || propToc?.items || []);

                                                            return content?.length > 0 ? (
                                                                content
                                                                    .filter(item => {
                                                                        if (!tocSearchQuery) return true;
                                                                        const matchMain = item.title.toLowerCase().includes(tocSearchQuery.toLowerCase());
                                                                        const matchSub = item.subheadings?.some(sub => sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase()));
                                                                        return matchMain || matchSub;
                                                                    })
                                                                    .map((item, idx) => {
                                                                        const filteredSubheadings = item.subheadings?.filter(sub =>
                                                                            !tocSearchQuery || sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase())
                                                                        ) || [];

                                                                        return (
                                                                            <React.Fragment key={item.id || idx}>
                                                                                {/* Main Heading */}
                                                                                <div
                                                                                    className="flex items-center justify-between group cursor-pointer py-[0.1vw]"
                                                                                    onClick={() => { onPageClick(item.page - 1); setShowTOCMemo?.(false); setTocSearchQuery(''); }}
                                                                                >
                                                                                    <div className="flex items-center gap-[0.3vw] truncate pr-[0.4vw]">
                                                                                        {settings.tocSettings?.addSerialNumberToHeading !== false && (
                                                                                            <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-bold opacity-50 tabular-nums shrink-0`} style={{ color: getLayoutColorRgba('toc-text', '55, 65, 81', 1) }}>{idx + 1}.</span>
                                                                                        )}
                                                                                        <span
                                                                                            className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-semibold transition-colors truncate`}
                                                                                            style={{ color: getLayoutColorRgba('toc-text', '55, 65, 81', 1) }}
                                                                                        >
                                                                                            {item.title}
                                                                                        </span>
                                                                                    </div>
                                                                                    {settings.tocSettings?.addPageNumber !== false && (
                                                                                        <span
                                                                                            className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-semibold transition-colors tabular-nums shrink-0`}
                                                                                            style={{ color: getLayoutColorRgba('toc-text', '55, 65, 81', 1) }}
                                                                                        >
                                                                                            {String(item.page).padStart(2, '0')}
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Child Subheadings */}
                                                                                {filteredSubheadings.map((sub, sIdx) => (
                                                                                    <div
                                                                                        key={sub.id || sIdx}
                                                                                        className="flex items-center justify-between group cursor-pointer py-[0.1vw]"
                                                                                        onClick={() => { onPageClick(sub.page - 1); setShowTOCMemo?.(false); setTocSearchQuery(''); }}
                                                                                    >
                                                                                        <div className="flex items-center gap-[0.3vw] truncate pr-[0.4vw] ml-[0.6vw]">
                                                                                            {settings.tocSettings?.addSerialNumberToSubheading !== false && (
                                                                                                <span className="text-[0.75vw] font-bold opacity-30 tabular-nums shrink-0" style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '1') }}>{idx + 1}.{sIdx + 1}</span>
                                                                                            )}
                                                                                            <span
                                                                                                className="text-[0.75vw] font-medium transition-colors truncate"
                                                                                                style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '0.7') }}
                                                                                            >
                                                                                                {sub.title}
                                                                                            </span>
                                                                                        </div>
                                                                                        {settings.tocSettings?.addPageNumber !== false && (
                                                                                            <span
                                                                                                className="text-[0.75vw] font-medium transition-colors tabular-nums shrink-0"
                                                                                                style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '0.7') }}
                                                                                            >
                                                                                                {String(sub.page).padStart(2, '0')}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                            </React.Fragment>
                                                                        );
                                                                    })
                                                            ) : (
                                                                <div className="text-center py-[1.5vw] text-[0.7vw] opacity-70 font-medium" style={{ color: getLayoutColorRgba('toc-text', '87, 92, 156', 1) }}>No Table of Content found</div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {(settings?.navigation?.pageThumbnails ?? true) && renderToolbarBtn(
                            <Icon icon="ph:squares-four-fill" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : (isSidebarOpen ? 'w-[1.15vw] h-[1.15vw]' : 'w-[1.3vw] h-[1.3vw]')}`} />,
                            'Thumbnails',
                            (e) => {
                                e.stopPropagation();
                                setShowThumbnails(!showThumbnails);
                                setShowTOCMemo?.(false);
                                setShowBookmarkLocal(false);
                                setShowProfilePopup(false);
                                setShowBottomNotesOptions(false);
                                setShowBookmarkOptions(false);
                                setShowSoundPopupMemo(false);
                            },
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1), opacity: showThumbnails ? 0.7 : 1 }
                        )}
                        
                        {/* Gallery */}
                        {(settings?.interaction?.gallery ?? true) && renderToolbarBtn(
                            <Icon icon="clarity:image-gallery-solid" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : (isSidebarOpen ? 'w-[1.15vw] h-[1.15vw]' : 'w-[1.3vw] h-[1.3vw]')}`} />,
                            'Gallery',
                            () => {
                                setShowGalleryPopupMemo(true);
                                setShowTOCMemo?.(false);
                                setShowThumbnails(false);
                                setShowBookmarkLocal(false);
                                setShowProfilePopup(false);
                                setShowBottomNotesOptions(false);
                                setShowBookmarkOptions(false);
                            },
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) }
                            ,
                            '',
                            showGalleryPopup
                        )}
                        {/* Music */}
                        <div className="relative" id="layout5-sound-anchor">
                            {(settings?.media?.backgroundAudio ?? true) && renderToolbarBtn(
                                <Icon icon="solar:music-notes-bold" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : (isSidebarOpen ? 'w-[1.15vw] h-[1.15vw]' : 'w-[1.3vw] h-[1.3vw]')}`} />,
                                'Music',
                                (e) => {
                                    e.stopPropagation();
                                    setShowSoundPopupMemo(!showSoundPopup);
                                    setShowTOCMemo?.(false);
                                    setShowThumbnails(false);
                                    setShowBookmarkLocal(false);
                                    setShowProfilePopup(false);

                                },
                                { color: (showSoundPopup || !isMuted) ? getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) : getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.3') }
                            )}


                        </div>
                        {/* Profile */}
                        <div className="relative">
                            {(settings?.brandingProfile?.profile ?? true) && renderToolbarBtn(
                                <Icon icon="fluent:person-24-filled" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : (isSidebarOpen ? 'w-[1.15vw] h-[1.15vw]' : 'w-[1.3vw] h-[1.3vw]')}`} />,
                                'Profile',
                                (e) => {
                                    e.stopPropagation();
                                    setShowProfilePopup(!showProfilePopup);
                                    setShowTOCMemo?.(false);
                                    setShowThumbnails(false);
                                    setShowBookmarkLocal(false);

                                    setShowSoundPopupMemo(false);
                                },
                                { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1), opacity: showProfilePopup ? 0.7 : 1 }
                            )}

                            {/* Profile Popup */}
                            {showProfilePopup && (
                                <>
                                    <div
                                        className={`absolute left-1/2 ${isTablet ? 'bottom-[2.8vw] -translate-x-[75%]' : 'bottom-[3.2vw] -translate-x-[80%]'} z-[160] mb-[0.2vw] animate-in fade-in slide-in-from-bottom-2 duration-200`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="relative">
                                            {/* Triangle pointer */}
                                            <div
                                                className={`absolute -bottom-[1.3vw] ${isTablet ? 'left-[75%]' : 'left-[80%]'} -translate-x-1/2 z-10 pointer-events-none`}
                                                style={{ width: '0.9vw', height: '1.4vw' }}
                                            >
                                                <svg width="100%" height="100%" viewBox="0 0 10 20" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M0 0L5 20L10 0" fill="#FFFFFF" />
                                                    <path d="M0 0L5 20L10 0" fill={getLayoutColorRgba('toc-bg', '255, 255, 255', '1')} />
                                                    <path d="M0 0L5 20L10 0" stroke={getLayoutColorRgba('toc-bg', '87, 92, 156', '0.3')} strokeWidth="1" />
                                                </svg>
                                            </div>
                                            {/* Card */}
                                            <div
                                                className={`rounded-[1.2vw] shadow-[0_1vw_3vw_rgba(0,0,0,0.15)] ${isTablet ? 'w-[10.5vw]' : 'w-[16vw]'} flex flex-col border relative z-20 overflow-hidden`}
                                                style={{
                                                    backgroundColor: '#FFFFFF',
                                                    borderColor: getLayoutColorRgba('toc-bg', '87, 92, 156', '0.2')
                                                }}
                                            >
                                                <div
                                                    className="w-full flex flex-col p-[1.2vw] gap-[0.8vw]"
                                                    style={{ backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1') }}
                                                >
                                                    {/* Title */}
                                                    <h2
                                                        className={`${isTablet ? 'text-[0.8vw]' : 'text-[1vw]'} font-bold tracking-tight`}
                                                        style={{ color: getLayoutColorRgba('toc-text', '0, 0, 0', 1) }}
                                                    >Profile</h2>

                                                    {!hasProfileData ? (
                                                        <div className="text-gray-400 text-[0.8vw] text-center py-[2vw] italic font-medium">
                                                            No profile found
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Name */}
                                                            <div className="flex gap-[0.3vw]">
                                                                <span
                                                                    className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.8vw]'} font-bold whitespace-nowrap`}
                                                                    style={{ color: getLayoutColorRgba('toc-text', '0, 0, 0', 1) }}
                                                                >Name :</span>
                                                                <span
                                                                    className="text-[0.8vw]"
                                                                    style={{ color: getLayoutColorRgba('toc-text', '55, 65, 81', '0.8') }}
                                                                >{profileSettings?.name || 'Name'}</span>
                                                            </div>

                                                            {/* About */}
                                                            <div className="flex gap-[0.3vw]">
                                                                <span
                                                                    className="text-[0.8vw] font-bold whitespace-nowrap"
                                                                    style={{ color: getLayoutColorRgba('toc-text', '0, 0, 0', 1) }}
                                                                >About :</span>
                                                                <span
                                                                    className="text-[0.78vw] leading-[1.5] text-justify"
                                                                    style={{ color: getLayoutColorRgba('toc-text', '75, 85, 99', '0.8') }}
                                                                >{profileSettings?.about || ''}</span>
                                                            </div>

                                                            {/* Divider */}
                                                            <div
                                                                className="h-[1px] opacity-10"
                                                                style={{ backgroundColor: getLayoutColorRgba('toc-text', '0, 0, 0', 1) }}
                                                            />

                                                            {/* Contact */}
                                                            <div className="flex flex-col gap-[0.5vw]">
                                                                <span
                                                                    className="text-[0.85vw] font-bold"
                                                                    style={{ color: getLayoutColorRgba('toc-text', '0, 0, 0', 1) }}
                                                                >Contact</span>
                                                                <div className="flex items-center gap-[0.5vw]">
                                                                    {profileSettings?.twitter && (
                                                                        <a href={profileSettings.twitter} target="_blank" rel="noreferrer"
                                                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-black flex items-center justify-center hover:opacity-80 transition-opacity"
                                                                        >
                                                                            <Icon icon="ri:twitter-x-fill" className="w-[1.1vw] h-[1.1vw] text-white" />
                                                                        </a>
                                                                    )}
                                                                    {profileSettings?.facebook && (
                                                                        <a href={profileSettings.facebook} target="_blank" rel="noreferrer"
                                                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-[#1877F2] flex items-center justify-center hover:opacity-80 transition-opacity"
                                                                        >
                                                                            <Icon icon="logos:facebook" className="w-[1.2vw] h-[1.2vw]" />
                                                                        </a>
                                                                    )}
                                                                    {profileSettings?.email && (
                                                                        <a href={`mailto:${profileSettings.email}`}
                                                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-white border border-gray-200 flex items-center justify-center hover:opacity-80 transition-opacity"
                                                                        >
                                                                            <Icon icon="logos:google-gmail" className="w-[1.2vw] h-[1.2vw]" />
                                                                        </a>
                                                                    )}
                                                                    {profileSettings?.instagram && (
                                                                        <a href={profileSettings.instagram} target="_blank" rel="noreferrer"
                                                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] flex items-center justify-center hover:opacity-80 transition-opacity"
                                                                            style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%,#d6249f 60%,#285AEB 90%)' }}
                                                                        >
                                                                            <Icon icon="skill-icons:instagram" className="w-[1.2vw] h-[1.2vw]" />
                                                                        </a>
                                                                    )}
                                                                    {profileSettings?.phone && (
                                                                        <a href={`tel:${profileSettings.phone}`}
                                                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-[#25D366] flex items-center justify-center hover:opacity-80 transition-opacity"
                                                                        >
                                                                            <Icon icon="fluent:call-24-filled" className="w-[1.1vw] h-[1.1vw] text-white" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* Share */}
                        {(settings?.shareExport?.share ?? true) && renderToolbarBtn(
                            <Icon icon="mage:share-fill" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : (isSidebarOpen ? 'w-[1.15vw] h-[1.15vw]' : 'w-[1.3vw] h-[1.3vw]')}`} />,
                            'Share',
                            handleShare,
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) },
                            '',
                            showSharePopup
                        )}
                        {(settings?.shareExport?.download ?? true) && renderToolbarBtn(
                            <Icon icon="meteor-icons:download" className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : (isSidebarOpen ? 'w-[1.15vw] h-[1.15vw]' : 'w-[1.3vw] h-[1.3vw]')}`} />,
                            'Download',
                            handleDownload,
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) },
                            '',
                            showExportPopup
                        )}
                        {/* Fullscreen */}
                        {(settings?.viewing?.fullScreen ?? true) && renderToolbarBtn(
                            <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} className={`${isMobileLandscape ? 'w-[0.75vw] h-[0.75vw]' : isTablet ? 'w-[1.1vw] h-[1.1vw]' : (isSidebarOpen ? 'w-[1.15vw] h-[1.15vw]' : 'w-[1.3vw] h-[1.3vw]')}`} />,
                            'Fullscreen',
                            handleFullScreen,
                            { color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) }
                        )}
                    </div>
                </div>

                {/* Right: Standardized Zoom Box Matched to Screenshot */}
                {(settings?.viewing?.zoom ?? true) && (
                    <div className={`rounded-full flex items-center shadow-[0_0.2vw_1vw_rgba(0,0,0,0.15)] border border-white/10 shrink-0 ${isTablet ? 'h-[4vh] gap-[0.3vw] px-[0.4vw]' : 'h-[6vh] gap-[0.4vw] px-[0.8vw]'}`}
                        style={{
                            backgroundColor: getLayoutColorRgba('bottom-toolbar-bg', '87, 92, 156', '1')
                        }}
                    >
                        {/* Zoom Out Button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                            className="hover:scale-110 active:scale-95 transition-transform shrink-0"
                            title="Zoom Out"
                        >
                            <Icon
                                icon="ph:magnifying-glass-minus-bold"
                                className={`${isTablet ? 'w-[0.75vw] h-[0.75vw]' : 'w-[1.25vw] h-[1.25vw]'}`}
                                style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) }}
                            />
                        </button>

                        <span
                            className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.85vw]'} font-semibold select-none shrink-0 min-w-[2.2vw] text-center`}
                            style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) }}
                        >
                            {Math.round((dimWidth / initialWidth) * 100)}%
                        </span>

                        {/* Zoom In Button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                            className="hover:scale-110 active:scale-95 transition-transform shrink-0"
                            title="Zoom In"
                        >
                            <Icon
                                icon="ph:magnifying-glass-plus-bold"
                                className={`${isTablet ? 'w-[0.75vw] h-[0.75vw]' : 'w-[1.25vw] h-[1.25vw]'}`}
                                style={{ color: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1) }}
                            />
                        </button>

                        <button
                            onClick={() => {
                                setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                            }}
                            className={`${isTablet ? 'text-[0.55vw] px-[0.5vw] py-[0.25vw]' : 'text-[0.8vw] px-[1vw] py-[0.4vw]'} font-bold rounded-[0.8vw] hover:brightness-90 transition-all shadow-sm`}
                            style={{
                                backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', 1),
                                color: getLayoutColor('bottom-toolbar-bg', '#555555')
                            }}
                        >
                            Reset
                        </button>
                    </div>
                )}
            </div>
            )}

            {/* â”€â”€ THUMBNAIL BAR â”€â”€ Exact Match to Screenshot */}
            {(settings?.navigation?.pageThumbnails ?? true) && showThumbnails && !isTablet && (
                <>
                    {/* Main Container - Rounded Capsule */}
                    <div
                        className={`absolute z-[150] ${isTablet ? 'bottom-[6.5vh] h-[5vw]' : 'bottom-[8.5vh] h-[5.8vw]'} left-1/2 -translate-x-1/2 w-fit ${spreads.length === 1 ? 'rounded-[0.8vw]' : 'rounded-full'} shadow-[0_0.5vw_2vw_rgba(0,0,0,0.08)] flex items-center border overflow-hidden`}
                        style={{
                            backgroundColor: '#FFFFFF',
                            borderColor: getLayoutColorRgba('dropdown-text', '87, 92, 156', 1),
                            maxWidth: typeof window !== 'undefined' ? `calc(${48 * ((dimWidth || 400) / (dimHeight || 566))}vw + ${2.9 + (canScrollLeft ? 3.5 : 1.5) + (canScrollRight ? 3.5 : 1.5)}vw)` : '47.3vw'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={`w-full h-full flex items-center ${canScrollLeft ? 'pl-[0.5vw]' : 'pl-[1.5vw]'} ${canScrollRight ? 'pr-[0.5vw]' : 'pr-[1.5vw]'}`}
                            style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '255, 255, 255', '1') }}
                        >
                            {/* Left Navigation */}
                            {canScrollLeft && (
                                <button
                                    className="w-[3vw] h-full flex items-center justify-center hover:scale-110 transition-all shrink-0"
                                    onClick={(e) => { e.stopPropagation(); scroll('left'); }}
                                    style={{ color: getLayoutColorRgba('dropdown-text', '87, 92, 156', 1) }}
                                >
                                    <Icon icon="ph:caret-left" className="w-[1.2vw] h-[1.2vw]" />
                                </button>
                            )}

                            {/* Thumbnails Container */}
                            <div
                                ref={scrollRef}
                                onScroll={checkScroll}
                                className="shrink flex overflow-x-hidden no-scrollbar scroll-smooth items-center h-full gap-[0.5vw] px-[0.2vw]"
                            >
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);

                                    const vw = typeof window !== 'undefined' ? window.innerWidth / 100 : 19.2;
                                    const pageWidth = dimWidth || 400;
                                    const pageHeight = dimHeight || 566;
                                    const availableHeightVw = 4;
                                    const availableHeightPx = availableHeightVw * vw;
                                    const thumbScale = availableHeightPx / pageHeight;
                                    const scaledWidthPx = pageWidth * thumbScale;
                                    const totalWidthPx = scaledWidthPx * 2;

                                    return (
                                        <div
                                            key={idx}
                                            className="thumbnail-item relative flex flex-col items-center shrink-0 cursor-pointer transition-all duration-300 group"
                                            style={{ width: `${totalWidthPx}px` }}
                                            onClick={() => onPageClick(spread.indices[0])}
                                        >
                                            {/* Thumbnail Container with Theme-based Border */}
                                            <div
                                                className="w-full bg-white border-[1.2px] transition-all rounded-[0.1vw] overflow-hidden relative"
                                                style={{
                                                    height: `${availableHeightVw}vw`,
                                                    borderColor: getLayoutColorRgba('dropdown-text', '87, 92, 156', 1)
                                                }}
                                            >
                                                <div className="flex w-full h-full gap-0 bg-white justify-center relative">
                                                    {spread.pages.map((page, pIdx) => {
                                                        return (
                                                            <div key={`${idx}-${pIdx}`} className="bg-white overflow-hidden relative flex items-center justify-center" style={{ width: `${scaledWidthPx}px` }}>
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

                                                {/* Selected Overlay - Fixed Dark Shade with White Text */}
                                                {isSelected && (
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-[0.5px]"
                                                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                                                    >
                                                        <span className="text-white text-[0.65vw] font-semibold whitespace-nowrap">
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
                                    className="w-[3vw] h-full flex items-center justify-center hover:scale-110 transition-all shrink-0"
                                    onClick={(e) => { e.stopPropagation(); scroll('right'); }}
                                    style={{ color: getLayoutColorRgba('dropdown-text', '87, 92, 156', 1) }}
                                >
                                    <Icon icon="ph:caret-right" className="w-[1.2vw] h-[1.2vw]" />
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}



        </div>
    );
};

export default Grid5Layout;
