import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';


const PageThumbnail = React.memo(({ html, index, scale = 0.2, baseWidth = 400, baseHeight = 566 }) => {
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
            <div style={{ width: `${baseWidth * scale}px`, height: `${baseHeight * scale}px`, position: 'relative', overflow: 'hidden' }}>
                <iframe
                    className="border-none pointer-events-none"
                    srcDoc={srcDoc}
                    title={`Thumb ${index}`}
                    loading="lazy"
                    style={{
                        width: `${baseWidth}px`,
                        height: `${baseHeight}px`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        backgroundColor: 'white',
                        position: 'absolute',
                        top: 0,
                        left: 0
                    }}
                />
            </div>
        </div>
    );
});

const Grid6Layout = ({
    children,
    layoutColors,
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
    handleDownload,
    handleShare,
    handleFullScreen,
    setShowViewBookmarkPopup,
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
    setShowNotesViewerMemo,
    setShowProfilePopup,
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
    showSoundPopup,
    setShowSoundPopupMemo,
    showTOC,
    isTablet,
    isFullscreen: isFullscreenProp
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

    const localOffset = React.useMemo(() => {
        if (offset === 0) return 0; // Use offset prop to respect single page mode
        // Shift left to center the front cover, shift right to center the back cover
        const length = pages?.length || pagesCount || 0;
        if (currentPage === 0) {
            return -(dimWidth / 2);
        } else if (currentPage >= length - 1) {
            return (currentPage % 2 === 0) ? -(dimWidth / 2) : (dimWidth / 2);
        }
        return 0;
    }, [currentPage, pages?.length, pagesCount, dimWidth, offset]);

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

    const getLayoutColor = (id, defaultColor) => {
        if (!layoutColors) return `var(--${id}, ${defaultColor})`;

        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorObj = layoutColors.find(c => c.id === id);
            return colorObj ? colorObj.hex : `var(--${id}, ${defaultColor})`;
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[7] && Array.isArray(layoutColors[7])) {
            const colorObj = layoutColors[7].find(c => c.id === id);
            return colorObj ? colorObj.hex : `var(--${id}, ${defaultColor})`;
        }

        return `var(--${id}, ${defaultColor})`;
    };

    const getLayoutOpacity = (id, defaultOpacity) => {
        if (!layoutColors) return defaultOpacity;

        // If layoutColors is an array directly for this layout
        if (Array.isArray(layoutColors)) {
            const colorObj = layoutColors.find(c => c.id === id);
            return colorObj ? colorObj.opacity / 100 : defaultOpacity;
        }

        // If layoutColors is the global container (indexed by layout ID)
        if (layoutColors[7] && Array.isArray(layoutColors[7])) {
            const colorObj = layoutColors[7].find(c => c.id === id);
            return colorObj ? colorObj.opacity / 100 : defaultOpacity;
        }

        return defaultOpacity;
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

    const [showThumbnails, setShowThumbnails] = useState(false);
    const [showLocalProfile, setShowLocalProfile] = useState(false);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [editingBookmarkId, setEditingBookmarkId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [tocSearchQuery, setTocSearchQuery] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const isFullscreen = isFullscreenProp || false;
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [showNoteOptions, setShowNoteOptions] = useState(false);
    const isCanvasHovered = false; const setIsCanvasHovered = () => {};

    const closeAll = () => {
        setShowThumbnails(false);
        setShowTOCMemo?.(false);
        setShowLocalProfile(false);
        setShowBookmarks(false);
        setEditingBookmarkId(null);
        setShowAddNotesPopupMemo?.(false);
        setShowAddBookmarkPopupMemo?.(false);
        setShowViewBookmarkPopup?.(false);
        setShowNotesViewerMemo?.(false);
        setShowProfilePopup?.(false);
        setShowThumbnailBarMemo?.(false);
        setShowTOCMemo?.(false);
        setShowBookmarkOptions(false);
        setShowNoteOptions(false);
        setShowSoundPopupMemo?.(false);
        setRecommendations([]);
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

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');

    useEffect(() => {
        setLocalSearchQuery(searchQuery || '');
    }, [searchQuery]);

    const [pageInputValue, setPageInputValue] = useState(String(currentPage + 1));

    useEffect(() => {
        setPageInputValue(String(currentPage + 1));
    }, [currentPage]);

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
        if (!progressRef.current || pagesCount <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pagesCount - 1));
        onPageClick(targetIdx);
    };

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
                percentage,
                pageIndex: targetIdx,
                spread: activeSpread,
                rectWidth: rect.width
            });
        });
    };

    const isPdfProject = pages?.some(p => p.html && p.html.includes('data-name="PDF Background"'));
    const progressPercentage = pagesCount > 1 ? (currentPage / (pagesCount - 1)) * 100 : 0;

    if (isTablet) {
        return <div className="w-full h-full bg-transparent flex items-center justify-center"></div>;
    }

    return (
        <div
            className="flex flex-col h-full w-full overflow-hidden font-sans select-none relative"
            style={backgroundStyle}
            onClick={() => closeAll()}
        >
            {/* Main Background Overlay to support opacity without affecting children */}
            <div
                className="absolute inset-0 -z-10"
                style={{
                    backgroundColor: getLayoutColor('toolbar-bg', '#D7D8E8'),
                    opacity: getLayoutOpacity('toolbar-bg', 1) * 0.15
                }}
            />
            {/* Top Header - Light themed as in screenshot */}
            <div
                className={`${isTablet ? 'h-[7vh]' : 'h-[8vh]'} flex items-center justify-between pl-[1.5vw] ${isTablet ? 'pr-[4vw]' : (isFullscreen ? 'pr-[5.5vw]' : 'pr-[5.5vw]')} shrink-0 w-full z-[100] transition-all duration-500 ease-in-out ${isFullscreen ? `absolute top-0 left-0 ${!isCanvasHovered ? 'pointer-events-auto' : 'pointer-events-none'}` : 'relative'}`}
                style={{
                    opacity: isFullscreen && isCanvasHovered ? 0 : 1
                }}
            >
                {/* Search Bar */}
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    {settings?.interaction?.search !== false && !isPdfProject && (
                        <div className="relative">
                            <div
                                className={`flex items-center rounded-[0.4vw] ${isTablet ? 'px-[0.6vw] py-[0.4vh] w-[11vw]' : 'px-[0.8vw] py-[0.5vw] shadow-sm w-[15vw]'} border relative overflow-hidden`}
                                style={{
                                    borderColor: 'rgba(0,0,0,0.08)'
                                }}
                            >
                                <div className="absolute inset-0 -z-10" style={{
                                    backgroundColor: getLayoutColor('search-bg-v2', '#FFFFFF'),
                                    opacity: getLayoutOpacity('search-bg-v2', 1)
                                }} />
                                <Icon
                                    icon="lucide:search"
                                    className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.1vw] h-[1.1vw]'}`}
                                    style={{
                                        color: getLayoutColor('search-text-v2', '#555555'),
                                        opacity: getLayoutOpacity('search-text-v2', 1) * 0.6
                                    }}
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
                                    onFocus={() => closeAll()}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setSearchQuery(localSearchQuery);
                                            handleQuickSearch(localSearchQuery);
                                            setRecommendations([]);
                                        }
                                    }}
                                    placeholder="Quick Search..."
                                    className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} ml-[0.6vw] w-full font-medium`}
                                    style={{
                                        color: getLayoutColor('search-text-v2', '#2D2D2D'),
                                        opacity: getLayoutOpacity('search-text-v2', 1)
                                    }}
                                />
                            </div>

                            {/* Search Suggestions Dropdown */}
                            {recommendations.length > 0 && (
                                <div
                                    className="absolute top-full left-0 w-full rounded-b-[0.8vw] shadow-2xl z-[100] border backdrop-blur-md overflow-hidden"
                                    style={{
                                        backgroundColor: getLayoutColor('dropdown-bg', 'rgba(255,255,255,0.4)'),
                                        opacity: getLayoutOpacity('dropdown-bg', 1),
                                        borderColor: 'rgba(255,255,255,0.2)'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex flex-col py-[0.3vw]">
                                        {recommendations.map((rec, idx) => (
                                            <button
                                                key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                                className="flex items-center justify-between px-[1vw] py-[0.6vw] hover:bg-white/20 transition-colors group"
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
                                                    <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.85vw]'} opacity-90 group-hover:opacity-100 truncate w-full text-left`}>
                                                        <span className="font-bold mr-[0.3vw]" style={{ fontWeight: 800 }}>{rec.word}</span>
                                                        {rec.context && <span className="font-normal opacity-70">{rec.context}</span>}
                                                    </span>
                                                </div>
                                                <span className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-bold opacity-60 tabular-nums shrink-0`}>Pg {rec.pageNumber}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Center: Book Name - Screenshot style */}
                <div
                    className={`absolute left-1/2 -translate-x-1/2 ${isTablet ? 'text-[1.1vw]' : 'text-[1.2vw]'} font-semibold tracking-wide`}
                    style={{ color: getLayoutColor('toolbar-text-main', '#555555') }}
                >
                    {/* bookName hidden */}
                </div>

                {/* Right: Logo */}
                <div className="flex items-center">
                    {(settings?.brandingProfile?.logo !== false) && logoSettings?.src && (
                        (() => {
                            const adj = logoSettings.adjustments || {};
                            const filterStr = `brightness(${100 + (adj.exposure || 0)}%) contrast(${100 + (adj.contrast || 0)}%) saturate(${100 + (adj.saturation || 0)}%) hue-rotate(${adj.tint || 0}deg) sepia(${adj.temperature > 0 ? adj.temperature : 0}%) brightness(${100 + ((adj.highlights || 0) / 5)}%) contrast(${100 + ((adj.shadows || 0) / 5)}%)`;
                            
                            const innerImg = (
                                <img
                                    src={logoSettings.src}
                                    alt="Logo"
                                    className={`${isTablet ? 'h-[1.8vw]' : 'h-[2.2vw]'} w-auto`}
                                    style={{ opacity: (logoSettings.opacity ?? 100) / 100, filter: filterStr }}
                                />
                            );
                            
                            return logoSettings.url ? (
                                <a 
                                    href={logoSettings.url.startsWith('http') ? logoSettings.url : `https://${logoSettings.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-transparent p-[0.4vw] transition-opacity hover:opacity-80 block"
                                >
                                    {innerImg}
                                </a>
                            ) : (
                                <div className="bg-transparent p-[0.4vw] transition-opacity hover:opacity-80 block">
                                    {innerImg}
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 relative min-h-0">
                {/* TOC Panel */}
                <AnimatePresence>
                    {showTOC && (
                        <motion.div
                            className={`absolute ${isTablet ? 'left-[4vw] top-[5vh] w-[16vw]' : 'left-[5.5vw] top-[6vh] w-[18vw]'} bottom-0 rounded-t-[1.5vw] z-[60] flex flex-col shadow-[-10px_0px_40px_rgba(0,0,0,0.15)] overflow-hidden border-t-[0.1vw] border-l-[0.1vw] border-r-[0.1vw] backdrop-blur-xl`}
                            style={{
                                backgroundColor: `rgba(var(--toc-bg-rgb, 255, 255, 255), var(--toc-bg-opacity, 0.6))`,
                                opacity: 1,
                                borderColor: getLayoutColorAlpha('toc-text', '85, 85, 85', 0.3) // 30% opacity of theme text color
                            }}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                        >
                            <div className={`${isTablet ? 'h-[7vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] border-b shrink-0`} style={{ borderColor: getLayoutColorAlpha('toc-text', '85, 85, 85', 0.2) }}> {/* 20% opacity underline */}
                                <span className={`${isTablet ? 'text-[0.85vw]' : 'text-[1.1vw]'} font-bold`} style={{ color: getLayoutColor('toc-text', '#555555') }}>Table of Contents</span>
                                <button onClick={() => { setShowTOCMemo?.(false); setTocSearchQuery(''); }} className="transition-colors" style={{ color: getLayoutColor('toc-icon', '#555555'), opacity: 0.6 }}>
                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                                </button>
                            </div>

                            {/* Search Box */}
                            {settings.tocSettings?.addSearch !== false && (
                                <div className="px-[1vw] py-[1.2vh] border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                    <div
                                        className="flex items-center rounded-[0.5vw] px-[0.8vw] py-[0.5vw] border group transition-all"
                                        style={{
                                            backgroundColor: 'rgba(0,0,0,0.05)',
                                            borderColor: 'rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <Icon icon="lucide:search" className="w-[1vw] h-[1vw]" style={{ color: getLayoutColor('toc-icon', '#555555'), opacity: 0.4 }} />
                                        <input
                                            type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                                            value={tocSearchQuery}
                                            onChange={(e) => setTocSearchQuery(e.target.value)}
                                            placeholder="Search in TOC..."
                                            className={`bg-transparent border-0 outline-none focus:ring-0 ${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} ml-[0.5vw] w-full font-sans`}
                                            style={{ color: getLayoutColor('toc-text', '#555555') }}
                                        />
                                        {tocSearchQuery && (
                                            <button onClick={() => setTocSearchQuery('')} style={{ color: getLayoutColor('toc-icon', '#555555'), opacity: 0.4 }}>
                                                <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="p-[1vw] flex flex-col pt-[1vh]">
                                    {settings.tocSettings?.content?.length > 0 ? (
                                        <div className="flex flex-col gap-[0.5vh]">
                                            {settings.tocSettings.content
                                                .filter(item => {
                                                    if (!tocSearchQuery) return true;
                                                    const matchMain = item.title.toLowerCase().includes(tocSearchQuery.toLowerCase());
                                                    const matchSub = item.subheadings?.some(sub => sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase()));
                                                    return matchMain || matchSub;
                                                })
                                                .map((item, idx) => (
                                                    <div key={idx} className="flex flex-col mb-[0.8vh]">
                                                        <div
                                                            className={`flex items-center justify-between ${isTablet ? 'py-[0.5vh] px-[0.6vw]' : 'py-[0.8vh] px-[0.8vw]'} hover:bg-white/10 rounded-[0.5vw] cursor-pointer transition-all group`}
                                                            style={{ color: getLayoutColor('toc-text', '#555555') }}
                                                            onClick={() => { onPageClick(item.page - 1); setShowTOCMemo?.(false); setTocSearchQuery(''); }}
                                                        >
                                                            <div className="flex items-center gap-[0.4vw] truncate pr-[0.5vw]">
                                                                {settings.tocSettings?.addSerialNumberToHeading !== false && (
                                                                    <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-bold opacity-40 shrink-0`}>{idx + 1}.</span>
                                                                )}
                                                                <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-semibold group-hover:opacity-100 truncate opacity-90`}>
                                                                    {item.title}
                                                                </span>
                                                            </div>
                                                            {settings.tocSettings?.addPageNumber !== false && (
                                                                <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-bold opacity-40 group-hover:opacity-80 tabular-nums`}>
                                                                    {item.page < 10 ? `0${item.page}` : item.page}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.subheadings && item.subheadings.length > 0 && (
                                                            <div className="flex flex-col mt-[0.1vh]">
                                                                {item.subheadings
                                                                    .filter(sub => !tocSearchQuery || sub.title.toLowerCase().includes(tocSearchQuery.toLowerCase()))
                                                                    .map((sub, sIdx) => (
                                                                        <div
                                                                            key={sIdx}
                                                                            className="flex items-center justify-between py-[0.6vh] px-[0.8vw] hover:bg-white/10 rounded-[0.5vw] cursor-pointer transition-all group"
                                                                            style={{ color: getLayoutColor('toc-text', '#555555') }}
                                                                            onClick={() => { onPageClick(sub.page - 1); setShowTOCMemo?.(false); setTocSearchQuery(''); }}
                                                                        >
                                                                            <div className="flex items-center gap-[0.4vw] truncate pr-[0.5vw] pl-[0.5vw]">
                                                                                {settings.tocSettings?.addSerialNumberToSubheading !== false && (
                                                                                    <span className="text-[0.8vw] font-bold opacity-30 shrink-0">{idx + 1}.{sIdx + 1}</span>
                                                                                )}
                                                                                <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} font-medium opacity-70 group-hover:opacity-100 truncate`}>
                                                                                    {sub.title}
                                                                                </span>
                                                                            </div>
                                                                            {settings.tocSettings?.addPageNumber !== false && (
                                                                                <span className={`${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} font-semibold opacity-30 group-hover:opacity-60 tabular-nums`}>
                                                                                    {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-[10vh] opacity-30 select-none">
                                            <Icon icon="ph:list-bullets-bold" className="w-[3vw] h-[3vw] mb-[1.5vh]" style={{ color: getLayoutColor('toc-icon', '#555555') }} />
                                            <span className="text-[0.9vw] font-bold" style={{ color: getLayoutColor('toc-text', '#555555') }}>No Table of Contents</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Thumbnails Panel */}
                <AnimatePresence>
                    {(settings?.navigation?.pageThumbnails ?? true) && showThumbnails && (
                        <motion.div
                            className={`absolute ${isTablet ? 'left-[4vw] top-[5vh] w-[17vw]' : 'left-[5.5vw] top-[6vh] w-[19vw]'} bottom-0 rounded-t-[1.5vw] z-[60] flex flex-col shadow-[-10px_0px_40px_rgba(0,0,0,0.15)] overflow-hidden border-t-[0.1vw] border-l-[0.1vw] border-r-[0.1vw] backdrop-blur-xl`}
                            style={{
                                backgroundColor: `rgba(var(--toc-bg-rgb, 255, 255, 255), var(--toc-bg-opacity, 0.6))`,
                                opacity: 1,
                                borderColor: getLayoutColorAlpha('toc-text', '85, 85, 85', 0.3) // 30% opacity of theme text color
                            }}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                        >
                            <div className={`${isTablet ? 'h-[6vh]' : 'h-[6.5vh]'} flex items-center justify-between px-[1.5vw] border-b-[0.1vw] shrink-0`} style={{ borderColor: getLayoutColorAlpha('toc-text', '85, 85, 85', 0.2) }}>
                                <span className={`${isTablet ? 'text-[1vw]' : 'text-[1.2vw]'} font-bold`} style={{ color: getLayoutColor('toc-text', '#555555') }}>Thumbnails</span>
                                <button onClick={() => setShowThumbnails(false)} className="transition-colors" style={{ color: getLayoutColor('toc-icon', '#555555'), opacity: 0.8 }}>
                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-[1.2vw] py-[1.5vh] custom-scrollbar">
                                {(() => {
                                    const pageW = dimWidth || 400;
                                    const pageH = dimHeight || 566;
                                    const pageAspectRatio = pageW / pageH;
                                    const isLandscape = pageAspectRatio > 1;

                                    if (isLandscape) {
                                        return (
                                            <div className="flex flex-col gap-[0.8vw]">
                                                {spreads.map((spread, idx) => {
                                                    const isSelected = spread.indices.includes(currentPage);
                                                    const vw = typeof window !== 'undefined' ? window.innerWidth / 100 : 19.2;
                                                    const availableWidthPx = 16 * vw; // Full width of thumbnail panel
                                                    const thumbScale = (availableWidthPx / 2) / pageW;
                                                    return (
                                                        <div
                                                            key={`s-${idx}`}
                                                            className={`w-full bg-white rounded-[0.6vw] flex flex-col cursor-pointer transition-all p-[0.3vw] shadow-[0_0.2vw_0.6vw_rgba(0,0,0,0.08)] hover:shadow-[0_0.4vw_1vw_rgba(0,0,0,0.15)] ${isSelected ? 'ring-[0.15vw] ring-white' : 'ring-[0.1vw] ring-transparent'}`}
                                                            onClick={() => { onPageClick(spread.indices[0]); setShowThumbnails(false); }}
                                                        >
                                                            <div
                                                                className="rounded-[0.4vw] overflow-hidden bg-gray-50/50 mb-[0.2vw] ring-1 ring-gray-100/50"
                                                                style={{ aspectRatio: `${pageAspectRatio * 2} / 1` }}
                                                            >
                                                                <div className="flex gap-0 w-full h-full justify-center">
                                                                    {spread.pages.map((page, pIdx) => (
                                                                        <div key={pIdx} className="flex-1 max-w-[50%] flex min-w-0">
                                                                            <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={thumbScale} baseWidth={pageW} baseHeight={pageH} />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-center pb-[0.2vh]">
                                                                <span className="text-[0.65vw] font-medium text-[#555555]">
                                                                    {spread.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="flex gap-[0.8vw]">
                                            {/* Left Column */}
                                            <div className="flex-1 flex flex-col gap-[0.8vw] min-w-0">
                                                {spreads.filter((_, i) => i % 2 === 0).map((spread, idx) => {
                                                    const isSelected = spread.indices.includes(currentPage);
                                                    const vw = typeof window !== 'undefined' ? window.innerWidth / 100 : 19.2;
                                                    const availableWidthPx = 10 * vw; // Approximate width of one column content
                                                    const thumbScale = (availableWidthPx / 2) / pageW;
                                                    return (
                                                        <div
                                                            key={`l-${idx}`}
                                                            className={`w-full bg-white rounded-[0.6vw] flex flex-col cursor-pointer transition-all p-[0.3vw] shadow-[0_0.2vw_0.6vw_rgba(0,0,0,0.08)] hover:shadow-[0_0.4vw_1vw_rgba(0,0,0,0.15)] ${isSelected ? 'ring-[0.15vw] ring-white' : 'ring-[0.1vw] ring-transparent'}`}
                                                            onClick={() => { onPageClick(spread.indices[0]); setShowThumbnails(false); }}
                                                        >
                                                            <div
                                                                className="rounded-[0.4vw] overflow-hidden bg-gray-50/50 mb-[0.2vw] ring-1 ring-gray-100/50"
                                                                style={{ aspectRatio: `${pageAspectRatio * 2} / 1` }}
                                                            >
                                                                <div className="flex gap-0 w-full h-full justify-center">
                                                                    {spread.pages.map((page, pIdx) => (
                                                                        <div key={pIdx} className="flex-1 max-w-[50%] flex min-w-0">
                                                                            <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={thumbScale} baseWidth={pageW} baseHeight={pageH} />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-center pb-[0.2vh]">
                                                                <span className="text-[0.65vw] font-medium text-[#555555]">
                                                                    {spread.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {/* Right Column */}
                                            <div className="flex-1 flex flex-col gap-[0.8vw] min-w-0 pt-[3.5vh]">
                                                {spreads.filter((_, i) => i % 2 !== 0).map((spread, idx) => {
                                                    const isSelected = spread.indices.includes(currentPage);
                                                    const vw = typeof window !== 'undefined' ? window.innerWidth / 100 : 19.2;
                                                    const availableWidthPx = 10 * vw; // Approximate width of one column content
                                                    const thumbScale = (availableWidthPx / 2) / pageW;
                                                    return (
                                                        <div
                                                            key={`r-${idx}`}
                                                            className={`w-full bg-white rounded-[0.6vw] flex flex-col cursor-pointer transition-all p-[0.3vw] shadow-[0_0.2vw_0.6vw_rgba(0,0,0,0.08)] hover:shadow-[0_0.4vw_1vw_rgba(0,0,0,0.15)] ${isSelected ? 'ring-[0.15vw] ring-white' : 'ring-[0.1vw] ring-transparent'}`}
                                                            onClick={() => { onPageClick(spread.indices[0]); setShowThumbnails(false); }}
                                                        >
                                                            <div
                                                                className="rounded-[0.4vw] overflow-hidden bg-gray-50/50 mb-[0.2vw] ring-1 ring-gray-100/50"
                                                                style={{ aspectRatio: `${pageAspectRatio * 2} / 1` }}
                                                            >
                                                                <div className="flex gap-0 w-full h-full justify-center">
                                                                    {spread.pages.map((page, pIdx) => (
                                                                        <div key={pIdx} className="flex-1 max-w-[50%] flex min-w-0">
                                                                            <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={thumbScale} baseWidth={pageW} baseHeight={pageH} />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-center pb-[0.2vh]">
                                                                <span className="text-[0.65vw] font-medium text-[#555555]">
                                                                    {spread.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bookmark Panel */}
                <AnimatePresence>
                    {showBookmarks && (
                        <motion.div
                            className={`absolute ${isTablet ? 'left-[3.1vw] top-[5vh] w-[16vw]' : 'left-[4.5vw] top-[6vh] w-[18vw]'} bottom-0 rounded-t-[1.5vw] z-[60] flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.15)] overflow-hidden border-t-[0.1vw] border-l-[0.1vw] border-r-[0.1vw]`}
                            style={{
                                backgroundColor: getLayoutColor('toc-bg', 'rgba(255,255,255,0.4)'),
                                opacity: getLayoutOpacity('toc-bg', 1),
                                borderColor: 'rgba(255,255,255,0.2)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                        >
                            <div className={`${isTablet ? 'h-[7vh]' : 'h-[8vh]'} flex items-center justify-between px-[1.5vw] border-b shrink-0`} style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <span className={`${isTablet ? 'text-[1vw]' : 'text-[1.4vw]'} font-bold`} style={{ color: getLayoutColor('toc-text', '#555555') }}>Bookmarks</span>
                                <button onClick={() => setShowBookmarks(false)} className="transition-colors" style={{ color: getLayoutColor('toc-icon', '#555555'), opacity: 0.6 }}>
                                    <Icon icon="lucide:x" className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]'}`} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-[1vw]">
                                {bookmarks && bookmarks.length > 0 ? (
                                    <div className="flex flex-col gap-[0.5vh]">
                                        {bookmarks.map((bookmark, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between py-[1vh] px-[1vw] group"
                                            >
                                                {editingBookmarkId === (bookmark.id || idx) ? (
                                                    <input
                                                        autoFocus
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                onUpdateBookmark?.(bookmark.id || idx, editValue);
                                                                setEditingBookmarkId(null);
                                                            }
                                                            if (e.key === 'Escape') setEditingBookmarkId(null);
                                                        }}
                                                        onBlur={() => {
                                                            onUpdateBookmark?.(bookmark.id || idx, editValue);
                                                            setEditingBookmarkId(null);
                                                        }}
                                                        className="flex-1 rounded-[0.3vw] px-[0.4vw] py-[0.1vh] text-[0.9vw] font-semibold outline-none border"
                                                        style={{
                                                            backgroundColor: 'rgba(0,0,0,0.05)',
                                                            borderColor: 'rgba(0,0,0,0.05)',
                                                            color: getLayoutColor('toc-text', '#555555')
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <span
                                                        className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]'} font-semibold cursor-pointer truncate flex-1`}
                                                        style={{ color: getLayoutColor('toc-text', '#555555') }}
                                                        onClick={() => {
                                                            const pageNum = parseInt(bookmark.pageIndex);
                                                            if (!isNaN(pageNum)) {
                                                                onPageClick(pageNum);
                                                                setShowBookmarks(false);
                                                            }
                                                        }}
                                                    >
                                                        {bookmark.label || `Page ${(parseInt(bookmark.pageIndex) || 0) + 1}`}
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-[0.8vw] shrink-0">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingBookmarkId(bookmark.id || idx);
                                                            setEditValue(bookmark.label || `Page ${(parseInt(bookmark.pageIndex) || 0) + 1}`);
                                                        }}
                                                        className="transition-colors"
                                                        style={{ color: getLayoutColor('toc-icon', '#555555'), opacity: 0.6 }}
                                                    >
                                                        <Icon icon="mdi:rename" className="w-[1.1vw] h-[1.1vw]" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteBookmark?.(bookmark.id || idx);
                                                        }}
                                                        className="text-red-300/60 hover:text-red-400 transition-colors"
                                                    >
                                                        <Icon icon="material-symbols-light:delete-outline-rounded" className="w-[1.2vw] h-[1.2vw]" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-[10vh] opacity-30 select-none">
                                        <Icon icon="ph:bookmark-bold" className="w-[3vw] h-[3vw] mb-[1.5vh]" style={{ color: getLayoutColor('toc-icon', '#555555') }} />
                                        <span className="text-[0.9vw] font-bold" style={{ color: getLayoutColor('toc-text', '#555555') }}>No Bookmarks</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {(() => {
                    const scaledPage = dimWidth;
                    const shift = localOffset;

                    let leftBound, rightBound;

                    const isSinglePage = typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false;

                    if (isSinglePage) {
                        leftBound = shift - scaledPage / 2;
                        rightBound = shift + scaledPage / 2;
                    } else if (currentPage === 0) {
                        leftBound = shift;
                        rightBound = shift + scaledPage;
                    } else if (currentPage >= (pages?.length || pagesCount || 0) - 1 && currentPage % 2 !== 0) {
                        leftBound = shift - scaledPage;
                        rightBound = shift;
                    } else {
                        leftBound = shift - scaledPage;
                        rightBound = shift + scaledPage;
                    }

                    // Adjust for the container's p-[2vw] pr-[5vw] which shifts the mathematical center left by 1.5vw
                    // We'll calculate relative to the visual center of the book viewer container
                    return (
                        <div className="absolute inset-0 pointer-events-none z-30" style={{ right: isFullscreen ? '0vw' : '3vw' }}>
                            {/* Left Navigation Arrow â€” hugs left edge of book */}
                            {(settings?.navigation?.nextPrevButtons ?? true) && (
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-full flex items-center transition-all duration-500 ease-out pointer-events-auto"
                                    style={{ left: `calc(50% + ${leftBound}px - ${isTablet ? '2.5vw' : '3.5vw'})` }}
                                >
                                    <button
                                        className="flex items-center justify-center transition-all hover:scale-110 p-[0.5vw]"
                                        style={{
                                            color: getLayoutColor('toolbar-bg', '#555555'),
                                            opacity: getLayoutOpacity('toolbar-bg', 1) * 0.5
                                        }}
                                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                                    >
                                        <Icon icon="ph:caret-left" className={`${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[2.5vw] h-[2.5vw]'}`} />
                                    </button>
                                </div>
                            )}

                            {/* Right Navigation Arrow â€” hugs right edge of book */}
                            {(settings?.navigation?.nextPrevButtons ?? true) && (
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 flex items-center transition-all duration-500 ease-out pointer-events-auto"
                                    style={{ left: `calc(50% + ${rightBound}px + ${isTablet ? '1vw' : '1.5vw'})` }}
                                >
                                    <button
                                        className="flex items-center justify-center transition-all hover:scale-110 p-[0.5vw]"
                                        style={{
                                            color: getLayoutColor('toolbar-bg', '#555555'),
                                            opacity: getLayoutOpacity('toolbar-bg', 1) * 0.5
                                        }}
                                        onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                                    >
                                        <Icon icon="ph:caret-right" className={`${isTablet ? 'w-[2vw] h-[2vw]' : 'w-[2.5vw] h-[2.5vw]'}`} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })()}

                <div
                    className={`absolute ${isTablet ? `left-[1.5vw] ${settings?.toolbar?.addTextBelowIcons ? 'w-[3.2vw]' : 'w-[2.4vw]'} py-[1.2vh] gap-[1.8vh] rounded-[0.5vw]` : `left-[2vw] ${settings?.toolbar?.addTextBelowIcons ? 'w-[3.3vw]' : 'w-[2.8vw]'} py-[1.8vh] gap-[2.1vh] rounded-[0.7vw]`} top-[38%] -translate-y-1/2 flex flex-col z-[100] shadow-2xl items-center overflow-visible transition-all duration-500 ease-in-out ${isFullscreen ? (!isCanvasHovered ? 'pointer-events-auto' : 'pointer-events-none') : 'pointer-events-auto'}`}
                    style={{
                        opacity: isFullscreen && isCanvasHovered ? 0 : 1
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute inset-0 -z-10" style={{
                        backgroundColor: getLayoutColor('toolbar-bg', '#555555'),
                        opacity: getLayoutOpacity('toolbar-bg', 1),
                        borderRadius: isTablet ? '0.5vw' : '0.7vw'
                    }} />
                    {(settings?.navigation?.tableOfContents ?? true) && (
                        <button
                            onClick={() => {
                                const wasOpen = showTOC;
                                closeAll();
                                if (!wasOpen) setShowTOCMemo?.(true);
                            }}
                            className={`group relative flex flex-col items-center gap-[0.2vh] transition-all ${showTOC ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
                            style={{
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                opacity: getLayoutOpacity('toolbar-text-main', 1)
                            }}
                        >
                            <Icon icon="fluent:text-bullet-list-24-filled" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} className="transition-transform group-hover:scale-110" />
                            {settings?.toolbar?.addTextBelowIcons && <span className={`${isTablet ? 'text-[0.35vw]' : 'text-[0.45vw]'} font-semibold leading-tight text-center`} style={{ fontFamily: settings?.toolbar?.textProperties?.font || 'inherit' }}>Table of<br />Contents</span>}
                            <div className={`absolute left-[calc(100%+1vw)] top-1/2 -translate-y-1/2 hidden ${!settings?.toolbar?.addTextBelowIcons ? 'group-hover:block' : ''} whitespace-nowrap pointer-events-none z-[9999]`}
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
                                Table of Contents
                                <div className="absolute top-1/2 -translate-y-1/2 -left-[0.3vw] w-0 h-0 border-solid border-t-transparent border-b-transparent border-r-[0.35vw] border-t-[0.35vw] border-b-[0.35vw]" style={{ borderRightColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                            </div>
                        </button>
                    )}
                    {(settings?.navigation?.pageThumbnails ?? true) && (
                        <button
                            onClick={() => {
                                const wasOpen = showThumbnails;
                                closeAll();
                                if (!wasOpen) setShowThumbnails(true);
                            }}
                            className={`group relative flex flex-col items-center gap-[0.2vh] transition-all ${showThumbnails ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
                            style={{
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                opacity: getLayoutOpacity('toolbar-text-main', 1)
                            }}
                        >
                            <Icon icon="ph:squares-four-fill" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} className="transition-transform group-hover:scale-110" />
                            {settings?.toolbar?.addTextBelowIcons && <span className={`${isTablet ? 'text-[0.35vw]' : 'text-[0.45vw]'} font-semibold leading-tight text-center mt-[0.2vh]`} style={{ fontFamily: settings?.toolbar?.textProperties?.font || 'inherit' }}>Thumbnails</span>}
                            <div className={`absolute left-[calc(100%+1vw)] top-1/2 -translate-y-1/2 hidden ${!settings?.toolbar?.addTextBelowIcons ? 'group-hover:block' : ''} whitespace-nowrap pointer-events-none z-[9999]`}
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
                                Thumbnails
                                <div className="absolute top-1/2 -translate-y-1/2 -left-[0.3vw] w-0 h-0 border-solid border-t-transparent border-b-transparent border-r-[0.35vw] border-t-[0.35vw] border-b-[0.35vw]" style={{ borderRightColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                            </div>
                        </button>
                    )}
                    {(settings?.interaction?.gallery ?? true) && (
                        <button
                            onClick={() => {
                                closeAll();
                                setShowGalleryPopupMemo(true);
                            }}
                            className="group relative flex flex-col items-center gap-[0.2vh] transition-all opacity-90 hover:opacity-100"
                            style={{
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                opacity: getLayoutOpacity('toolbar-text-main', 1)
                            }}
                        >
                            <Icon icon="clarity:image-gallery-solid" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} className="transition-transform group-hover:scale-110" />
                            {settings?.toolbar?.addTextBelowIcons && <span className={`${isTablet ? 'text-[0.35vw]' : 'text-[0.45vw]'} font-semibold leading-tight text-center mt-[0.2vh]`} style={{ fontFamily: settings?.toolbar?.textProperties?.font || 'inherit' }}>Gallery</span>}
                            <div className={`absolute left-[calc(100%+1vw)] top-1/2 -translate-y-1/2 hidden ${!settings?.toolbar?.addTextBelowIcons ? 'group-hover:block' : ''} whitespace-nowrap pointer-events-none z-[9999]`}
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
                                Gallery
                                <div className="absolute top-1/2 -translate-y-1/2 -left-[0.3vw] w-0 h-0 border-solid border-t-transparent border-b-transparent border-r-[0.35vw] border-t-[0.35vw] border-b-[0.35vw]" style={{ borderRightColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                            </div>
                        </button>
                    )}
                    {(settings?.media?.backgroundAudio ?? true) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const wasOpen = showSoundPopup;
                                closeAll();
                                if (!wasOpen) setShowSoundPopupMemo?.(true);
                            }}
                            className={`group relative flex flex-col items-center gap-[0.2vh] transition-all ${showSoundPopup ? 'opacity-100' : 'opacity-90 hover:opacity-100'} ${isMuted ? 'opacity-30' : ''}`}
                            style={{
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                opacity: getLayoutOpacity('toolbar-text-main', 1)
                            }}
                        >
                            <Icon icon="solar:music-notes-bold" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} className="transition-transform group-hover:scale-110" />
                            {settings?.toolbar?.addTextBelowIcons && <span className={`${isTablet ? 'text-[0.35vw]' : 'text-[0.45vw]'} font-semibold leading-tight text-center mt-[0.2vh]`} style={{ fontFamily: settings?.toolbar?.textProperties?.font || 'inherit' }}>Sound</span>}
                            <div className={`absolute left-[calc(100%+1vw)] top-1/2 -translate-y-1/2 hidden ${!settings?.toolbar?.addTextBelowIcons ? 'group-hover:block' : ''} whitespace-nowrap pointer-events-none z-[9999]`}
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
                                Sound
                                <div className="absolute top-1/2 -translate-y-1/2 -left-[0.3vw] w-0 h-0 border-solid border-t-transparent border-b-transparent border-r-[0.35vw] border-t-[0.35vw] border-b-[0.35vw]" style={{ borderRightColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                            </div>
                        </button>
                    )}
                    {(settings?.brandingProfile?.profile ?? true) && (
                        <button
                            onClick={() => {
                                closeAll();
                                setShowProfilePopup?.(true);
                            }}
                            className={`group relative flex flex-col items-center gap-[0.2vh] transition-all opacity-90 hover:opacity-100`}
                            style={{
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                opacity: getLayoutOpacity('toolbar-text-main', 1)
                            }}
                        >
                            <Icon icon="fluent:person-24-filled" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} className="transition-transform group-hover:scale-110" />
                            {settings?.toolbar?.addTextBelowIcons && <span className={`${isTablet ? 'text-[0.35vw]' : 'text-[0.45vw]'} font-semibold leading-tight text-center mt-[0.2vh]`} style={{ fontFamily: settings?.toolbar?.textProperties?.font || 'inherit' }}>Profile</span>}
                            <div className={`absolute left-[calc(100%+1vw)] top-1/2 -translate-y-1/2 hidden ${!settings?.toolbar?.addTextBelowIcons ? 'group-hover:block' : ''} whitespace-nowrap pointer-events-none z-[9999]`}
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
                                Profile
                                <div className="absolute top-1/2 -translate-y-1/2 -left-[0.3vw] w-0 h-0 border-solid border-t-transparent border-b-transparent border-r-[0.35vw] border-t-[0.35vw] border-b-[0.35vw]" style={{ borderRightColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                            </div>
                        </button>
                    )}
                    {(settings?.shareExport?.share ?? true) && (
                        <button
                            onClick={handleShare}
                            className="group relative flex flex-col items-center gap-[0.2vh] transition-all opacity-90 hover:opacity-100"
                            style={{
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                opacity: getLayoutOpacity('toolbar-text-main', 1)
                            }}
                        >
                            <Icon icon="mage:share-fill" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} className="transition-transform group-hover:scale-110" />
                            {settings?.toolbar?.addTextBelowIcons && <span className={`${isTablet ? 'text-[0.35vw]' : 'text-[0.45vw]'} font-semibold leading-tight text-center mt-[0.2vh]`} style={{ fontFamily: settings?.toolbar?.textProperties?.font || 'inherit' }}>Share</span>}
                            <div className={`absolute left-[calc(100%+1vw)] top-1/2 -translate-y-1/2 hidden ${!settings?.toolbar?.addTextBelowIcons ? 'group-hover:block' : ''} whitespace-nowrap pointer-events-none z-[9999]`}
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
                                Share
                                <div className="absolute top-1/2 -translate-y-1/2 -left-[0.3vw] w-0 h-0 border-solid border-t-transparent border-b-transparent border-r-[0.35vw] border-t-[0.35vw] border-b-[0.35vw]" style={{ borderRightColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                            </div>
                        </button>
                    )}
                    {(settings?.shareExport?.download ?? true) && (
                        <button
                            onClick={handleDownload}
                            className="group relative flex flex-col items-center gap-[0.2vh] transition-all opacity-90 hover:opacity-100"
                            style={{
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                opacity: getLayoutOpacity('toolbar-text-main', 1)
                            }}
                        >
                            <Icon icon="meteor-icons:download" width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} className="transition-transform group-hover:scale-110" />
                            {settings?.toolbar?.addTextBelowIcons && <span className={`${isTablet ? 'text-[0.35vw]' : 'text-[0.45vw]'} font-semibold leading-tight text-center mt-[0.2vh]`} style={{ fontFamily: settings?.toolbar?.textProperties?.font || 'inherit' }}>Download</span>}
                            <div className={`absolute left-[calc(100%+1vw)] top-1/2 -translate-y-1/2 hidden ${!settings?.toolbar?.addTextBelowIcons ? 'group-hover:block' : ''} whitespace-nowrap pointer-events-none z-[9999]`}
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
                                Download
                                <div className="absolute top-1/2 -translate-y-1/2 -left-[0.3vw] w-0 h-0 border-solid border-t-transparent border-b-transparent border-r-[0.35vw] border-t-[0.35vw] border-b-[0.35vw]" style={{ borderRightColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                            </div>
                        </button>
                    )}
                    {(settings?.viewing?.fullScreen ?? true) && <button
                        onClick={handleFullScreen}
                        className="group relative flex flex-col items-center gap-[0.2vh] transition-all border-t pt-[1vh] mt-[0.5vh] w-full justify-center hover:opacity-100"
                        style={{
                            color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1) * 0.9,
                            borderColor: 'rgba(255,255,255,0.2)'
                        }}
                    >
                        <Icon icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} width={isTablet ? '1.1vw' : '1.3vw'} height={isTablet ? '1.1vw' : '1.3vw'} className="transition-transform group-hover:scale-110" />
                        {settings?.toolbar?.addTextBelowIcons && <span className={`${isTablet ? 'text-[0.35vw]' : 'text-[0.45vw]'} font-semibold leading-tight text-center mt-[0.2vh]`} style={{ fontFamily: settings?.toolbar?.textProperties?.font || 'inherit' }}>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>}
                        <div className={`absolute left-[calc(100%+1vw)] top-1/2 -translate-y-1/2 hidden ${!settings?.toolbar?.addTextBelowIcons ? 'group-hover:block' : ''} whitespace-nowrap pointer-events-none z-[9999]`}
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
                            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                            <div className="absolute top-1/2 -translate-y-1/2 -right-[0.3vw] w-0 h-0 border-solid border-t-transparent border-b-transparent border-l-[0.35vw] border-t-[0.35vw] border-b-[0.35vw]" style={{ borderLeftColor: 'rgba(10, 10, 12, 0.55)' }}></div>
                        </div>
                    </button>}
                </div>



                {/* Page Counter Badge - Floating above footer */}
                {(settings?.navigation?.pageQuickAccess ?? true) && (
                    <div
                        className={`absolute right-[0.8vw] ${isTablet ? 'bottom-[4vh] rounded-[0.3vw]' : 'bottom-[2.5vh] rounded-[0.4vw]'} px-[0.8vw] py-[0.4vh] shadow-lg z-[70] border min-w-[5vw] flex items-center justify-center transition-all duration-300`}
                        style={{
                            backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                            opacity: getLayoutOpacity('toolbar-text-main', 1),
                            borderColor: 'rgba(0,0,0,0.05)'
                        }}
                    >
                        <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.8vw]'} font-bold`} style={{ color: getLayoutColor('bottom-toolbar-bg', '#555555') }}>Page </span>
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
                            className={`${isTablet ? 'text-[0.65vw] mx-[0.3vw] px-[0.15vw] py-[0.1vw]' : 'text-[0.8vw] mx-[0.4vw] px-[0.2vw] py-[0.15vw]'} font-bold rounded-[0.25vw] outline-none text-center transition-colors shadow-inner`}
                            style={{
                                width: `${String(pages.length).length + 1.2}ch`,
                                color: getLayoutColor('bottom-toolbar-bg', '#555555'),
                                backgroundColor: getLayoutColorAlpha('bottom-toolbar-bg', '87, 92, 156', 0.2),
                                border: `1px solid ${getLayoutColorAlpha('bottom-toolbar-bg', '87, 92, 156', 0.35)}`
                            }}
                            onFocus={(e) => {
                                e.target.style.backgroundColor = getLayoutColorAlpha('bottom-toolbar-bg', '87, 92, 156', 0.3);
                                e.target.style.borderColor = getLayoutColorAlpha('bottom-toolbar-bg', '87, 92, 156', 0.6);
                            }}
                            onMouseOver={(e) => {
                                if(document.activeElement !== e.target) {
                                    e.target.style.backgroundColor = getLayoutColorAlpha('bottom-toolbar-bg', '87, 92, 156', 0.25);
                                }
                            }}
                            onMouseOut={(e) => {
                                if(document.activeElement !== e.target) {
                                    e.target.style.backgroundColor = getLayoutColorAlpha('bottom-toolbar-bg', '87, 92, 156', 0.2);
                                }
                            }}
                        />
                        <span className={`${isTablet ? 'text-[0.65vw]' : 'text-[0.8vw]'} font-bold`} style={{ color: getLayoutColor('bottom-toolbar-bg', '#555555') }}> / {pagesCount}</span>
                    </div>
                )}

                {/* Book Viewer Container */}
                <div className={`flex-1 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-[2vw] pr-[5vw]'} select-none`}
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
                        className="relative transition-all duration-600 ease-in-out"
                        style={{
                            transform: `translateX(${localOffset}px) scale(1)`,
                            transformOrigin: 'center center',
                            filter: 'drop-shadow(0 2vw 4vw rgba(0,0,0,0.1))'
                        }}
                    >
                        {modifiedChildren}
                    </div>
                </div>


            </div>

            <div
                className={`${isTablet ? 'h-[6vh]' : 'h-[7vh]'} flex items-center px-[2vw] shrink-0 w-full z-[100] transition-all duration-500 ease-in-out overflow-visible ${isFullscreen ? `absolute bottom-0 left-0 ${!isCanvasHovered ? 'pointer-events-auto' : 'pointer-events-none'}` : 'relative'}`}
                style={{
                    opacity: isFullscreen && isCanvasHovered ? 0 : 1
                }}
            >
                <div className="absolute inset-0 -z-10" style={{
                    backgroundColor: getLayoutColor('toolbar-bg', '#555555'),
                    opacity: getLayoutOpacity('toolbar-bg', 1)
                }} />
                {/* Playback Controls */}
                <div className="flex items-center gap-[1.2vw] mr-[2vw]">
                    {(settings?.navigation?.startEndNav ?? true) && (
                        <button
                            onClick={() => onPageClick && onPageClick(0)}
                            className="transition-all transform active:scale-95"
                            style={{
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                opacity: getLayoutOpacity('toolbar-text-main', 1) * 0.8
                            }}
                        >
                            <Icon icon="ph:skip-back" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                        </button>
                    )}
                    {(settings?.media?.autoFlip ?? true) && (
                        <button
                            onClick={() => setIsPlaying(!isAutoFlipping)}
                            className="transition-all transform active:scale-90"
                            style={{
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                opacity: getLayoutOpacity('toolbar-text-main', 1)
                            }}
                        >
                            <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className={`${isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.5vw] h-[1.5vw]'}`} />
                        </button>
                    )}
                    {(settings?.navigation?.startEndNav ?? true) && (
                        <button
                            onClick={() => onPageClick && onPageClick(pagesCount - 1)}
                            className="transition-all transform active:scale-95"
                            style={{
                                color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                opacity: getLayoutOpacity('toolbar-text-main', 1) * 0.8
                            }}
                        >
                            <Icon icon="ph:skip-forward" className={`${isTablet ? 'w-[1vw] h-[1vw]' : 'w-[1.2vw] h-[1.2vw]'}`} />
                        </button>
                    )}
                </div>

                {/* Progress Bar Container */}
                <div
                    ref={progressRef}
                    className="flex-1 flex items-center relative group h-[2vw] cursor-pointer"
                    onClick={handleProgressClick}
                    onMouseMove={handleProgressMouseMove}
                    onMouseLeave={() => {
                        if (progressHoverRef.current) cancelAnimationFrame(progressHoverRef.current);
                        setProgressHover(prev => ({ ...prev, visible: false }));
                    }}
                >
                    <div
                        className={`w-full ${isTablet ? 'h-[0.2vw]' : 'h-[0.22vw]'} rounded-full relative overflow-hidden`}
                    >
                        {/* Track Underlay */}
                        <div className="absolute inset-0 transition-colors duration-300" style={{ backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'), opacity: isTablet ? 0.4 : 0.3 }} />
                        {/* Progress Fill */}
                        <div
                            className="absolute top-0 left-0 h-full transition-all duration-300 ease-out z-10"
                            style={{ backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF'), width: `${progressPercentage}%`, opacity: isTablet ? 1 : 'var(--toolbar-icon-opacity, 1)' }}
                        />
                    </div>

                    {/* Hover Popup - Matching Grid6Layout style */}
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
                                    className={`absolute bottom-0 flex flex-col items-center ${isTablet ? 'p-[0.6vw] rounded-[0.6vw]' : 'p-[0.5vw] rounded-[0.8vw]'} shadow-[0_10px_40px_rgba(0,0,0,0.3)]`}
                                    style={{
                                        backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'),
                                        transform: progressHover.pageIndex === 0 ? 'translateX(-25%)' : 'translateX(-50%)',
                                        minWidth: isTablet ? '7vw' : '9vw'
                                    }}
                                >
                                    <div className="w-full flex flex-col items-center px-[0.3vw]">
                                        <span
                                            className="font-bold whitespace-nowrap"
                                            style={{
                                                fontSize: isTablet ? '0.7vw' : '0.85vw',
                                                color: getLayoutColor('dropdown-text', '#555555')
                                            }}
                                        >
                                            {progressHover.spread.label}
                                        </span>

                                        <div
                                            className="w-full rounded-full"
                                            style={{
                                                height: isTablet ? '2px' : '2.5px',
                                                backgroundColor: getLayoutColor('dropdown-text', '#555555'),
                                                margin: isTablet ? '0.4vw 0' : '0.5vw 0'
                                            }}
                                        />

                                        <div
                                            className="flex justify-center overflow-hidden rounded-[0.3vw] shadow-inner"
                                            style={{
                                                width: `${(400 * (isTablet ? 50 : 70) / 566) * 2 + 1}px`,
                                                backgroundColor: '#f3f4f6'
                                            }}
                                        >
                                            <div className="flex gap-[1px] bg-gray-100 p-[1px]">
                                                {progressHover.spread.pages.map((page, pIdx) => {
                                                    const boxHeight = isTablet ? 50 : 70;
                                                    const scale = boxHeight / 566;
                                                    const boxWidth = 400 * scale;
                                                    return (
                                                        <div
                                                            key={`${progressHover.spread.indices[0]}-${pIdx}`}
                                                            className="bg-white overflow-hidden relative flex items-center justify-center border border-gray-100"
                                                            style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
                                                        >
                                                            <PageThumbnail
                                                                html={page.html || page.content}
                                                                index={progressHover.spread.indices[pIdx]}
                                                                scale={scale}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow with SVG shape from Layout 5/6 */}
                                    <div
                                        className="absolute top-full left-[38%] -translate-x-1/2 pointer-events-none"
                                        style={{
                                            width: isTablet ? '1vw' : '1.3vw',
                                            height: isTablet ? '1.2vw' : '1.5vw',
                                            filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15))'
                                        }}
                                    >
                                        <svg width="100%" height="100%" viewBox="0 0 20 15" preserveAspectRatio="none">
                                            <path
                                                d="M0 0 L10 15 L20 0"
                                                fill={getLayoutColor('dropdown-bg', '#FFFFFF')}
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Zoom & Reset Cluster */}
                {(settings?.viewing?.zoom ?? true) && (
                    <div className="flex items-center ml-[2vw]">
                        <div
                            className="flex items-center rounded-[0.5vw] p-[0.3vw] pl-[0.8vw] gap-[1vw] border border-white/40"
                            style={{
                                backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') + '1A', // 10% opacity
                            }}
                        >
                            <div className="flex items-center gap-[0.8vw]">
                                <button
                                    onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                                    className="hover:scale-110 transition-transform"
                                    style={{
                                        color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                        opacity: getLayoutOpacity('toolbar-text-main', 1)
                                    }}
                                >
                                    <Icon icon="lucide:zoom-out" className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[0.9vw] h-[0.9vw]'}`} />
                                </button>
                                <span
                                    className={`font-bold ${isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]'} tabular-nums min-w-[2.5vw] text-center`}
                                    style={{
                                        color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                        opacity: getLayoutOpacity('toolbar-text-main', 1)
                                    }}
                                >
                                    {Math.round((dimWidth / initialWidth) * 100)}%
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                                    className="hover:scale-110 transition-transform"
                                    style={{
                                        color: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                        opacity: getLayoutOpacity('toolbar-text-main', 1)
                                    }}
                                >
                                    <Icon icon="lucide:zoom-in" className={`${isTablet ? 'w-[0.8vw] h-[0.8vw]' : 'w-[0.9vw] h-[0.9vw]'}`} />
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setDimWidth(isTablet ? initialWidth * 0.7 : initialWidth);
                                    setDimHeight(isTablet ? initialHeight * 0.7 : initialHeight);
                                }}
                                className={`${isTablet ? 'text-[0.6vw]' : 'text-[0.75vw]'} font-bold px-[0.8vw] py-[0.35vw] rounded-[0.4vw] hover:opacity-90 active:scale-95 transition-all`}
                                style={{
                                    backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'),
                                    color: getLayoutColor('bottom-toolbar-bg', '#555555')
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${getLayoutColor('toolbar-bg', '#555555')}20;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${getLayoutColor('toolbar-bg', '#555555')}40;
                }
            `}</style>
        </div>
    );
};

export default Grid6Layout;
