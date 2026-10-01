import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';





import Sound from '../../popups/Sound';
import Export from '../../popups/Export';
import FlipbookSharePopup from '../../popups/FlipbookSharePopup';
import TableOfContentsPopup from '../../popups/TableOfContentsPopup';

const getLayoutColor = (id, defaultColor) => {
    return `var(--${id}, ${defaultColor})`;
};

const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
};

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

const MenuBtn = ({ icon, label, onClick }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(e); }}
        className="flex items-center gap-2 px-2.5 py-1 hover:bg-white/10 active:bg-white/20 transition-colors text-left"
    >
        <Icon icon={icon} className="w-[14px] h-[14px] text-white/90" />
        <span className="text-white text-[11px] font-medium">{label}</span>
    </button>
);

const MobileLayout8 = ({
    children,
    settings,
    bookName,
    activeLayout,
    searchQuery,
    setSearchQuery,
    handleQuickSearch,
    logoSettings,
    onPageClick,
    currentPage,
    pages = [],
    bookRef,
    showBookmarkMenu,
    setShowBookmarkMenu,
    showMoreMenu,
    setShowMoreMenu,
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
    isLandscape,
    offset = 0,
    showNotesMenu,
    setShowNotesMenu,
    layoutColors
}) => {
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const scrollRef = useRef(null);
    const progressRef = useRef(null);

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [visibleIndices, setVisibleIndices] = useState([]);
    const [showLocalNotesMenu, setShowLocalNotesMenu] = useState(false);

    const isPhysicalMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const [showLocalBookmarkMenu, setShowLocalBookmarkMenu] = useState(false);
    const [showDotMenu, setShowDotMenu] = useState(false);
    const [showTopNotesOptions, setShowTopNotesOptions] = useState(false);
    const dotBtnRef = useRef(null);



    const spreads = useMemo(() => {
        const result = [];
        if (pages && pages.length > 0) {
            result.push({ pages: [pages[0]], indices: [0], label: "Page 1" });
            let spreadNum = 2;
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
                    label: `Page ${spreadNum++}`
                });
            }
        }
        return result;
    }, [pages]);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 5);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
            setIsOverflowing(scrollWidth > clientWidth);

            const containerRect = scrollRef.current.getBoundingClientRect();
            const items = scrollRef.current.querySelectorAll('.thumbnail-item');
            const visible = [];
            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                const index = parseInt(item.getAttribute('data-index'));
                if (rect.right > containerRect.left + 1 && rect.left < containerRect.right - 1) {
                    visible.push(index);
                }
            });
            setVisibleIndices(visible.sort((a, b) => a - b));
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

    const progressPercentage = pages.length > 1 ? (currentPage / (pages.length - 1)) * 100 : 0;

    const handleProgressClick = (e) => {
        if (!progressRef.current || pages.length <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pages.length - 1));
        onPageClick(targetIdx);
    };

    const layoutVariables = useMemo(() => {
        return {
            '--toolbar-bg-rgb': activeLayout?.toolbarBgRgb || '87, 92, 156',
            '--toolbar-bg-opacity': activeLayout?.toolbarBgOpacity || '1',
            '--toolbar-text': activeLayout?.toolbarText || '#FFFFFF',
            '--toolbar-icon': activeLayout?.toolbarIcon || '#FFFFFF',
            '--toolbar-icon-hover': activeLayout?.toolbarIconHover || '#E0E0E0',
            '--toolbar-search-bg': activeLayout?.toolbarSearchBg || '#D7D8E8',
            '--toolbar-search-text': activeLayout?.toolbarSearchText || '#575C9C',
            '--toolbar-search-placeholder': activeLayout?.toolbarSearchPlaceholder || '#575C9C',
            '--toolbar-search-icon': activeLayout?.toolbarSearchIcon || '#575C9C',
            '--page-bg': activeLayout?.pageBg || '#BDC3D9',
            '--progress-bar-bg': activeLayout?.progressBarBg || '#FFFFFF',
            '--progress-bar-fill': activeLayout?.progressBarFill || '#575C9C',
            '--play-button-bg': activeLayout?.playButtonBg || '#FFFFFF',
            '--play-button-icon': activeLayout?.playButtonIcon || '#575C9C',
            '--play-button-border': activeLayout?.playButtonBorder || '#FFFFFF',
        };
    }, [activeLayout]);

    const renderPopups = () => (
        <div className="absolute inset-0 pointer-events-none z-[2000]">
            <AnimatePresence>
                {showThumbnailBar && isLandscape && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/5" onClick={() => setShowThumbnailBar(false)} />
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="absolute bottom-10 left-0 right-0 z-[110] px-1 pointer-events-auto">
                            <div
                                className="rounded-xl overflow-hidden flex items-center h-[55px] relative px-0.5 shadow-[0_8px_20px_rgba(0,0,0,0.3)] border backdrop-blur-md"
                                style={{
                                    backgroundColor: getLayoutColorRgba('thumbnail-outer-v2', '87, 92, 156', '0.8'),
                                    borderColor: 'rgba(255,255,255,0.2)'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button className={`shrink-0 w-6 h-full flex items-center justify-center text-white transition-opacity ${!canScrollLeft ? 'opacity-20 cursor-default' : 'opacity-100'}`} onClick={() => scroll('left')}><Icon icon="lucide:chevron-left" className="w-4 h-4" /></button>
                                <div ref={scrollRef} onScroll={checkScroll} className="flex-1 flex overflow-x-auto no-scrollbar gap-1.5 px-1 items-center h-full scroll-smooth">
                                    {spreads.map((spread, idx) => {
                                        const isSelected = spread.indices.includes(currentPage);
                                        let boxWidth = 48;
                                        let boxHeight = 36;

                                        if (isOverflowing) {
                                            const visiblePos = visibleIndices.indexOf(idx);
                                            if (visiblePos !== -1) {
                                                if (visiblePos === 0 || visiblePos === visibleIndices.length - 1) {
                                                    boxWidth = 32;
                                                    boxHeight = 24;
                                                } else if (visiblePos === 1 || (visiblePos === visibleIndices.length - 2 && visibleIndices.length > 2)) {
                                                    boxWidth = 40;
                                                    boxHeight = 30;
                                                }
                                            } else {
                                                if (idx === 0 || idx === spreads.length - 1) {
                                                    boxWidth = 32;
                                                    boxHeight = 24;
                                                } else if (idx === 1 || (idx === spreads.length - 2 && spreads.length > 2)) {
                                                    boxWidth = 40;
                                                    boxHeight = 30;
                                                }
                                            }
                                        }

                                        return (
                                            <div
                                                key={idx}
                                                data-index={idx}
                                                className={`thumbnail-item shrink-0 flex flex-col items-center gap-1 p-1 rounded-md transition-all duration-300 ${isSelected ? 'active-thumbnail ring-1 ring-white/30' : ''}`}
                                                style={{
                                                    backgroundColor: isSelected ? getLayoutColor('thumbnail-inner-v2', '#BCBEE1') : getLayoutColor('thumbnail-outer-v2', '#575C9C')
                                                }}
                                                onClick={() => onPageClick(spread.indices[0])}
                                            >
                                                <div className="bg-white rounded-[2px] overflow-hidden shadow-sm flex gap-[0.5px] transition-all duration-300" style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}>
                                                    {spread.pages.map((page, pIdx) => (<div key={pIdx} className="flex-1 h-full overflow-hidden transition-all duration-300"><PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={isSelected ? 0.09 : 0.07} /></div>))}
                                                </div>
                                                <span className="text-[7.5px] font-bold text-white/90 truncate w-10 text-center transition-all duration-300">{spread.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button className={`shrink-0 w-6 h-full flex items-center justify-center text-white transition-opacity ${!canScrollRight ? 'opacity-20 cursor-default' : 'opacity-100'}`} onClick={() => scroll('right')}><Icon icon="lucide:chevron-right" className="w-4 h-4" /></button>
                            </div>
                        </motion.div>
                    </>
                )}
                {showMoreMenu && !isLandscape && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[150] bg-transparent pointer-events-auto"
                            onClick={() => { setShowMoreMenu(false); setShowLocalNotesMenu(false); setShowLocalBookmarkMenu(false); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="absolute top-[4.5rem] right-6 w-[170px] rounded-xl shadow-2xl z-[160] overflow-hidden border border-white/10 bg-[#575c9c]/90 backdrop-blur-md pointer-events-auto"
                        >
                            <div className="flex flex-col p-1.5 gap-1">
                                <MenuBtn icon="mdi:table-of-contents" label="Table of Contents" onClick={() => { setShowTOC(true); setShowMoreMenu(false); }} />
                                <MenuBtn icon="ep:menu" label="Thumbnails" onClick={() => { setShowThumbnailBar(prev => !prev); setShowMoreMenu(false); }} />
                                <MenuBtn icon="material-symbols-light:add-notes" label="Add Notes" onClick={() => { setShowLocalNotesMenu(prev => !prev); setShowLocalBookmarkMenu(false); setShowMoreMenu(false); }} />
                                <MenuBtn icon="mingcute:bookmark-fill" label="Bookmarks" onClick={() => { setShowLocalBookmarkMenu(prev => !prev); setShowLocalNotesMenu(false); setShowMoreMenu(false); }} />
                                <MenuBtn icon="solar:user-bold" label="Profile" onClick={() => { setShowProfilePopup(true); setShowMoreMenu(false); setShowLocalNotesMenu(false); setShowLocalBookmarkMenu(false); }} />
                                {(settings?.media?.backgroundAudio ?? true) && (
                                    <MenuBtn icon="solar:music-notes-bold" label="BG Music" onClick={() => { setShowSoundPopup(true); setShowMoreMenu(false); }} />
                                )}
                                <div className="h-[1px] bg-white/10 my-1 mx-2" />
                                <MenuBtn icon="mage:share-fill" label="Share" onClick={() => { handleShare(); setShowMoreMenu(false); }} />
                                <MenuBtn icon="meteor-icons:download" label="Download" onClick={() => { handleDownload(); setShowMoreMenu(false); }} />
                                <MenuBtn icon="lucide:fullscreen" label="Fullscreen View" onClick={() => { handleFullScreen(); setShowMoreMenu(false); }} />
                            </div>
                        </motion.div>
                    </>
                )}
                {showDotMenu && isLandscape && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[150] bg-transparent pointer-events-auto"
                            onClick={() => setShowDotMenu(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 6 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute z-[160] pointer-events-auto"
                            style={{
                                bottom: '34px',
                                right: '78px',
                            }}
                        >
                            <div
                                className="rounded-xl overflow-hidden border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md"
                                style={{ backgroundColor: 'rgba(87, 92, 156, 0.95)' }}
                            >
                                <div className="flex flex-col py-1.5 px-0.5">
                                    <MenuBtn
                                        icon="material-symbols:photo-library-rounded"
                                        label="Gallery"
                                        onClick={() => { setShowThumbnailBar(prev => !prev); setShowDotMenu(false); }}
                                    />
                                    <MenuBtn
                                        icon="lucide:user"
                                        label="Profile"
                                        onClick={() => { setShowProfilePopup(true); setShowDotMenu(false); }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {showLocalNotesMenu && (
                <>
                    <div className="absolute inset-0 z-[165] bg-transparent pointer-events-auto" onClick={() => setShowLocalNotesMenu(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute z-[170] flex flex-col overflow-hidden rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-auto"
                        style={{
                            ...(isLandscape ? { bottom: '30px', right: '108px' } : { top: '6.5rem', right: '8.5rem' }),
                            width: '130px',
                            backgroundColor: 'rgba(87, 92, 156, 0.95)',
                            backdropFilter: 'blur(12px)'
                        }}
                    >
                        <div className="flex flex-col p-1.5 gap-1">
                            <MenuBtn icon="material-symbols-light:add-notes" label="Add Notes" onClick={() => { setShowAddNotesPopup(true); setShowLocalNotesMenu(false); setShowMoreMenu(false); }} />
                            <MenuBtn icon="lucide:eye" label="View Notes" onClick={() => { setShowNotesViewer(true); setShowLocalNotesMenu(false); setShowMoreMenu(false); }} />
                        </div>
                    </motion.div>
                </>
            )}
            {showLocalBookmarkMenu && isLandscape && (
                <>
                    <div className="absolute inset-0 z-[165] bg-transparent pointer-events-auto" onClick={() => setShowLocalBookmarkMenu(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute z-[170] flex flex-col overflow-hidden rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-auto"
                        style={{
                            ...(isLandscape ? { bottom: '30px', right: '108px' } : { top: '8rem', right: '8.5rem' }),
                            width: '130px',
                            backgroundColor: 'rgba(87, 92, 156, 0.95)',
                            backdropFilter: 'blur(12px)'
                        }}
                    >
                        <div className="flex flex-col p-1.5 gap-1">
                            <MenuBtn icon="mingcute:bookmark-fill" label="Add Bookmark" onClick={() => { setShowAddBookmarkPopup(true); setShowLocalBookmarkMenu(false); setShowMoreMenu(false); }} />
                            <MenuBtn icon="mdi:eye-outline" label="View Bookmark" onClick={() => { setShowViewBookmarkPopup(true); setShowLocalBookmarkMenu(false); setShowMoreMenu(false); }} />
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );

    if (isLandscape) {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden select-none relative bg-[#DADBE8]">
                {/* Background Overlay */}
                <div className="absolute inset-0 z-0" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', 1), opacity: 0.15 }} />

                {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[15] bg-transparent pointer-events-auto" onClick={() => setShowSuggestions(false)} />}
                
                {/* Floating Header */}
                <header className="absolute top-2 left-14 right-14 z-50 h-8 flex items-center justify-between shadow-lg rounded-full px-4 pointer-events-auto border border-white/20 backdrop-blur-md" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '11, 15, 78', 0.9) }}>
                    <div className={`flex-1 max-w-[150px] relative ${showSuggestions && recommendations.length > 0 ? 'z-20' : ''}`}>
                        <div className="bg-white/10 rounded-full px-2 py-1 flex items-center gap-1 backdrop-blur-sm border border-white/10">
                            <Icon icon="lucide:search" className="text-white/60 w-3 h-3" />
                            <input
                                type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                                placeholder="Quick Search..."
                                className="bg-transparent text-white placeholder-white/40 text-[9px] outline-none w-full font-medium"
                                value={localSearchQuery}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLocalSearchQuery(val);
                                    setShowSuggestions(true);
                                    if (val.length >= 1) {
                                        const results = [];
                                        const lowerQuery = val.toLowerCase();
                                        pages.forEach((page, index) => {
                                            const text = (page.html || page.content || '').replace(/<[^>]*>/g, ' ');
                                            const words = text.split(/\s+/);
                                            const pageMatches = new Set();
                                            words.forEach(word => {
                                                const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
                                                if (cleanWord.length > 2 && cleanWord.toLowerCase().startsWith(lowerQuery)) {
                                                    pageMatches.add(cleanWord);
                                                }
                                            });
                                            pageMatches.forEach(word => {
                                                results.push({ word, pageNumber: index + 1 });
                                            });
                                        });
                                        setRecommendations(results.slice(0, 6));
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
                            />
                        </div>

                        {/* Recommendations Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-full left-0 mt-2 w-[180px] bg-[#575C9C]/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 z-[100] overflow-hidden"
                                >
                                    <div className="flex flex-col py-1.5">
                                        {recommendations.map((rec, idx) => (
                                            <button
                                                key={idx}
                                                className="flex items-center justify-between px-3 py-1.5 hover:bg-white/20 transition-colors text-white"
                                                onClick={() => {
                                                    onPageClick(rec.pageNumber - 1);
                                                    setRecommendations([]);
                                                    setShowSuggestions(false);
                                                    setLocalSearchQuery(rec.word);
                                                }}
                                            >
                                                <span className="text-[10px] font-medium">{rec.word}</span>
                                                <span className="text-[9px] opacity-60 font-bold">{rec.pageNumber.toString().padStart(2, '0')}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-full max-w-[30%]">
                        <span className="text-white text-[10px] font-bold opacity-90 truncate block">{/* {bookName} */}</span>
                    </div>
                    <div className="flex-1 flex justify-end" />
                </header>

                {/* Main Content Area */}
                <div className="flex-1 flex items-center justify-center relative px-14 py-10 overflow-hidden pointer-events-auto" onClick={() => setShowThumbnailBar(false)}>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40">
                        <button onClick={(e) => { e.stopPropagation(); if (bookRef?.current?.pageFlip()) bookRef.current.pageFlip().flipPrev(); }} className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2 text-white active:scale-90 transition-all border border-white/10 shadow-lg"><Icon icon="lucide:chevron-left" className="w-5 h-5" /></button>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40">
                        <button onClick={(e) => { e.stopPropagation(); if (bookRef?.current?.pageFlip()) bookRef.current.pageFlip().flipNext(); }} className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2 text-white active:scale-90 transition-all border border-white/10 shadow-lg"><Icon icon="lucide:chevron-right" className="w-5 h-5" /></button>
                    </div>
                    <div className="flex items-center justify-center w-full h-full shadow-2xl">
                        <div className="relative flex items-center justify-center w-full h-full" style={{ transformOrigin: 'center center' }}>{children}</div>
                    </div>
                </div>

                {/* Floating Footer */}
                <footer className="absolute bottom-2 left-14 right-14 h-9 px-6 flex items-center justify-between shadow-2xl rounded-full z-[60] font-sans border border-white/20 pointer-events-auto backdrop-blur-md" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', 0.9) }}>
                    {/* Left Group */}
                    <div className="flex items-center gap-3 min-w-max">
                        <button onClick={() => { setShowTOC(true); setShowThumbnailBar(false); }} className="text-white hover:scale-110 active:scale-90 transition-transform"><Icon icon="ph:list-bold" className="w-4 h-4" /></button>
                        <button onClick={() => setShowThumbnailBar(prev => !prev)} className="text-white hover:scale-110 active:scale-90 transition-transform"><Icon icon="ph:squares-four-fill" className="w-4 h-4" /></button>
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center gap-4 ml-4">
                        <button onClick={() => onPageClick(0)} className="text-white hover:scale-110 active:scale-90 transition-transform"><Icon icon="ph:skip-back" className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setIsPlaying(!isAutoFlipping)} className="text-white hover:scale-110 active:scale-90 transition-transform"><Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-5 h-5" /></button>
                        <button onClick={() => onPageClick(pages.length - 1)} className="text-white hover:scale-110 active:scale-90 transition-transform"><Icon icon="ph:skip-forward" className="w-3.5 h-3.5" /></button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 mx-6 flex items-center max-w-[20vw]">
                        <div ref={progressRef} className="h-1.5 w-full bg-white/20 rounded-full cursor-pointer relative shadow-inner" onClick={handleProgressClick}>
                            <div className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
                        </div>
                    </div>

                    {/* Tools Group */}
                    <div className="flex items-center gap-4">
                        <button onClick={(e) => { e.stopPropagation(); setShowLocalNotesMenu(prev => !prev); }} className="text-white/90 hover:text-white active:scale-90 transition-all"><Icon icon="material-symbols-light:add-notes" className="w-5 h-5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setShowLocalBookmarkMenu(prev => !prev); }} className="text-white/90 hover:text-white active:scale-90 transition-all"><Icon icon="ph:bookmark-simple-fill" className="w-4 h-4" /></button>
                        <button onClick={() => setShowSoundPopup(true)} className="text-white/90 hover:text-white active:scale-90 transition-all"><Icon icon="solar:music-notes-bold" className="w-4 h-4" /></button>
                        <button ref={dotBtnRef} onClick={(e) => { e.stopPropagation(); setShowDotMenu(prev => !prev); }} className="text-white/90 hover:text-white active:scale-90 transition-all"><Icon icon="ph:dots-three-bold" className="w-5 h-5" /></button>
                    </div>
                </footer>


                {renderPopups()}

                
                
                
                

                {showExportPopup && (
                    <Export
                        isOpen={true}
                        hideButton={true}
                        onClose={() => setShowExportPopup(false)}
                        pages={pages}
                        bookName={bookName}
                        currentPage={currentPage}
                        isMobile={true}
                        isLandscape={isLandscape}
                    />
                )}
                {showSharePopup && (
                    <FlipbookSharePopup
                    onClose={() => setShowSharePopup(false)}
                    bookName={props.currentBook?.flipbookName || bookName}
                    url={props.currentBook?.shareUrl || window.location.href}
                    isPublished={props.currentBook?.status === 'Published'}
                    isMobile={true}
                    isLandscape={isLandscape}
                />
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden select-none relative" style={{ backgroundColor: 'var(--page-bg, #BDC3D9)' }}>
            {/* Notch Area */}
            {!isPhysicalMobile && <div className="shrink-0 h-10 z-50 bg-[#0B0F4E]" />}

            {/* Header: Search and Logo */}
            <header className="px-5 pt-4 pb-2 flex items-center justify-between gap-3 relative" style={{ zIndex: showSuggestions && recommendations.length > 0 ? 3000 : 50 }}>
                {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[15] bg-transparent" onClick={() => setShowSuggestions(false)} />}

                <div className="relative" style={{ zIndex: showSuggestions && recommendations.length > 0 ? 20 : 'auto', width: '60%' }}>
                    {/* Colored Dropdown Background */}
                    <AnimatePresence>
                        {showSuggestions && recommendations.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute left-0 z-0 shadow-xl flex flex-col w-full top-[16px]"
                                style={{
                                    backgroundColor: layoutColors?.primary || '#575C9C',
                                    borderBottomLeftRadius: '12px',
                                    borderBottomRightRadius: '12px',
                                    paddingBottom: '5px'
                                }}
                            >
                                {/* Spacer to push suggestions below the input */}
                                <div className="h-[16px] shrink-0" />

                                {/* Suggestions White Box */}
                                <div className="mx-1.5 mt-1.5 bg-white flex flex-col py-0.5 overflow-hidden" style={{ borderRadius: '8px' }}>
                                    {recommendations.map((rec, idx) => (
                                        <button
                                            key={idx}
                                            className="flex items-center justify-between px-3 py-1 hover:bg-gray-50 transition-colors"
                                            style={{ color: layoutColors?.primary || '#575C9C' }}
                                            onClick={() => {
                                                onPageClick(rec.pageNumber - 1);
                                                setRecommendations([]);
                                                setShowSuggestions(false);
                                                setLocalSearchQuery(rec.word);
                                            }}
                                        >
                                            <span className="text-[11px] font-semibold">{rec.word}</span>
                                            <span className="text-[9px] opacity-60 font-bold">{rec.pageNumber.toString().padStart(2, '0')}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Search Input */}
                    <div
                        className="relative z-10 bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-sm"
                        style={{ border: showSuggestions && recommendations.length > 0 ? 'none' : '1px solid #C0C5E0' }}
                    >
                        <Icon icon="ph:magnifying-glass-bold" className="w-4 h-4 opacity-70" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }} />
                        <input
                            type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                            placeholder="Quick Search..."
                            className="bg-transparent text-[12px] outline-none w-full font-semibold"
                            style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                            value={localSearchQuery}
                            onChange={(e) => {
                                const val = e.target.value;
                                setLocalSearchQuery(val);
                                setShowSuggestions(true);
                                if (val.length >= 1) {
                                    const results = [];
                                    const lowerQuery = val.toLowerCase();
                                    pages.forEach((page, index) => {
                                        const text = (page.html || page.content || '').replace(/<[^>]*>/g, ' ');
                                        const words = text.split(/\s+/);
                                        const pageMatches = new Set();
                                        words.forEach(word => {
                                            const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
                                            if (cleanWord.length > 2 && cleanWord.toLowerCase().startsWith(lowerQuery)) {
                                                pageMatches.add(cleanWord);
                                            }
                                        });
                                        pageMatches.forEach(word => {
                                            results.push({ word, pageNumber: index + 1 });
                                        });
                                    });
                                    setRecommendations(results.slice(0, 6));
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
                        />
                    </div>
                </div>

            </header>

            {/* Toolbar: 8 Circular Icons */}
            <div className="px-5 py-2 flex justify-between items-center relative z-[2200] bg-transparent">
                {[
                    { id: 'toc', icon: 'mdi:table-of-contents', action: (e) => { e.stopPropagation(); setShowTOC(!showTOC); } },
                    { id: 'grid', icon: 'ep:menu', action: (e) => { e.stopPropagation(); setShowThumbnailBar(!showThumbnailBar); } },
                    { id: 'image', icon: 'clarity:image-gallery-solid', action: (e) => { e.stopPropagation(); } },
                    { id: 'music', icon: 'solar:music-notes-bold', action: (e) => { e.stopPropagation(); setShowSoundPopup(!showSoundPopup); } },
                    { id: 'profile', icon: 'solar:user-bold', action: (e) => { e.stopPropagation(); setShowProfilePopup(!showProfilePopup); } },
                    { id: 'share', icon: 'mage:share-fill', action: (e) => { e.stopPropagation(); handleShare(); } },
                    { id: 'download', icon: 'meteor-icons:download', action: (e) => { e.stopPropagation(); handleDownload(); } },
                ].map((btn, i) => {
                    const isActive = (btn.id === 'grid' && showThumbnailBar) || (btn.id === 'toc' && showTOC) || (btn.id === 'search' && showTopNotesOptions) || (btn.id === 'music' && showSoundPopup) || (btn.id === 'profile' && showProfilePopup);
                    return (
                        <button
                            key={i}
                            onClick={btn.action}
                            className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-md`}
                            style={{
                                backgroundColor: isActive ? getLayoutColor('toolbar-text-main', '#FFFFFF') : getLayoutColor('toolbar-bg', '#575C9C'),
                                color: isActive ? getLayoutColor('toolbar-bg', '#575C9C') : getLayoutColor('toolbar-text-main', '#FFFFFF')
                            }}
                        >
                            <Icon icon={btn.icon} className="w-[1.1rem] h-[1.1rem]" />
                        </button>
                    );
                })}
            </div>

            {/* Subheader: Book Name and Zoom */}
            <div className="px-5 py-2 flex items-center justify-between">
                <span className="text-[13px] font-bold opacity-80 truncate max-w-[60%]" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>
                    {/* bookName hidden */}
                </span>
                <div className="flex items-center gap-1.5 bg-white/60 rounded-full px-2 py-0.5 border border-[#C0C5E0]" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>
                    <Icon icon="ph:magnifying-glass-plus-bold" className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">50%</span>
                    <button className="text-[9px] font-bold border rounded-full px-1.5 leading-tight py-0.5 ml-0.5 hover:opacity-80 transition-opacity" style={{ borderColor: getLayoutColor('toolbar-bg', '#575C9C'), color: getLayoutColor('toolbar-bg', '#575C9C') }}>Reset</button>
                </div>
            </div>

            {/* Main Area: Flipbook */}
            <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center px-4">
                <div className="relative">
                    <div className="transition-transform duration-300" style={{ transformOrigin: 'center center' }}>
                        {children}
                    </div>
                </div>
            </div>

            {/* Footer: Navigation Controls */}
            <footer className="px-5 pt-4 pb-8 flex items-center justify-between relative z-[2001]">
                <div className="w-8 h-8" />

                <button
                    onClick={() => onPageClick(0)}
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'), color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                >
                    <Icon icon="ph:skip-back-bold" className="w-[1.1rem] h-[1.1rem]" />
                </button>

                <button
                    onClick={() => onPageClick(Math.max(0, currentPage - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'), color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                >
                    <Icon icon="ph:caret-left-bold" className="w-[1.1rem] h-[1.1rem]" />
                </button>

                {/* Page Number Pill */}
                <div className="bg-white rounded-full px-4 py-1.5 border border-[#C0C5E0] shadow-md flex items-center justify-center min-w-[100px]">
                    <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}>
                        Page - {currentPage + 1} / {pages.length}
                    </span>
                </div>

                <button
                    onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'), color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                >
                    <Icon icon="ph:caret-right-bold" className="w-[1.1rem] h-[1.1rem]" />
                </button>

                <button
                    onClick={() => onPageClick(pages.length - 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'), color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                >
                    <Icon icon="ph:skip-forward-bold" className="w-[1.1rem] h-[1.1rem]" />
                </button>

                <button
                    onClick={handleFullScreen}
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C'), color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                >
                    <Icon icon="lucide:fullscreen" className="w-[1.1rem] h-[1.1rem]" />
                </button>
            </footer>

            {/* Popups and Overlays */}
            <AnimatePresence>
                {showTOC && (
                    <TableOfContentsPopup
                        onClose={() => setShowTOC(false)}
                        settings={settings?.tocSettings}
                        activeLayout={9}
                        isMobile={true}
                        onNavigate={(pageIndex) => {
                            onPageClick(pageIndex);
                            setShowTOC(false);
                        }}
                    />
                )}

                {showSoundPopup && (
                    <div key="portrait-sound-container" className="absolute inset-0 z-[2000] pointer-events-none">
                        <motion.div
                            key="sound-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[100] bg-black/10 pointer-events-auto"
                            onClick={() => setShowSoundPopup(false)}
                        />
                        <motion.div
                            key="sound-panel"
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="absolute top-[105px] left-[100px] z-[110] pointer-events-auto"
                            style={{ width: '130px' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative w-full" style={{ aspectRatio: '250/270' }}>
                                {/* Unified SVG Background */}
                                <div className="absolute inset-0 z-0 pointer-events-none">
                                    <svg width="100%" height="100%" viewBox="0 0 260 270" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                        <path
                                            d="M0 115 C0 90.16 20.16 70 45 70 H145 C160 70 165 60 165 40 V30 C165 10 188.75 0 212.5 0 C236.25 0 260 10 260 30 V225 C260 249.84 240 270 215 270 H45 C20.16 270 0 249.84 0 225 V115 Z"
                                            fill="rgba(87, 92, 156, 0.6)"
                                            stroke="rgba(255,255,255,0.1)"
                                            strokeWidth="1.5"
                                        />
                                    </svg>
                                </div>

                                {/* Popup Body Content */}
                                <div className="w-full h-full relative z-10 flex flex-col gap-3 justify-center pt-10 px-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-[11px] font-bold whitespace-nowrap text-white">Sound</h2>
                                        <div className="h-[1px] flex-1 mt-0.5 bg-white/20" />
                                    </div>
                                    {/* Flip */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            className={`flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-300 rounded-full ${otherSetupSettings?.sound?.flipSoundEnabled !== false ? (!isFlipMuted ? 'bg-[#575C9C] shadow-inner' : 'bg-white/20 cursor-pointer border border-white/20 hover:bg-white/30') : 'bg-white/10 cursor-not-allowed opacity-50'}`}
                                            onClick={(e) => { e.stopPropagation(); if (otherSetupSettings?.sound?.flipSoundEnabled !== false) setIsFlipMuted(!isFlipMuted); }}
                                        >
                                            <Icon icon="mingcute:volume-line" className="w-4 h-4" style={{ color: '#FFFFFF', opacity: !isFlipMuted ? 1 : 0.5 }} />
                                        </button>
                                        <div className="flex-1 h-1 rounded-full relative overflow-hidden bg-white/20">
                                            <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: otherSetupSettings?.sound?.flipSoundEnabled !== false ? (!isFlipMuted ? '60%' : '15%') : '0%' }} />
                                        </div>
                                    </div>

                                    {/* BG */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            className={`flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-300 rounded-full ${otherSetupSettings?.sound?.bgSoundEnabled !== false ? (!isMuted ? 'bg-[#575C9C] shadow-inner' : 'bg-white/20 cursor-pointer border border-white/20 hover:bg-white/30') : 'bg-white/10 cursor-not-allowed opacity-50'}`}
                                            onClick={(e) => { e.stopPropagation(); if (otherSetupSettings?.sound?.bgSoundEnabled !== false) setIsMuted(!isMuted); }}
                                        >
                                            <svg
                                                width="100%"
                                                height="100%"
                                                viewBox="0 0 21 23"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-3.5 h-3.5"
                                                style={{ color: '#FFFFFF', opacity: !isMuted ? 1 : 0.5 }}
                                            >
                                                <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                                            </svg>
                                        </button>
                                        <div className="flex-1 h-1 rounded-full relative overflow-hidden bg-white/20">
                                            <div className="absolute inset-0 transition-all duration-500 rounded-full bg-white" style={{ width: otherSetupSettings?.sound?.bgSoundEnabled !== false ? (!isMuted ? '80%' : '15%') : '0%' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {showThumbnailBar && (
                    <div key="portrait-thumb-container" className="absolute inset-0 z-[2000] pointer-events-none">
                        <motion.div
                            key="thumb-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[100] bg-black/10 pointer-events-auto"
                            onClick={() => setShowThumbnailBar(false)}
                        />
                        <motion.div
                            key="thumb-panel"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-[138px] left-3 right-3 z-[110] pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Connector Tab for Thumbnail Icon */}
                            <div className="absolute top-[-38px] left-[9%] w-[82px] h-[42px] z-10 flex items-center justify-center">
                                <svg width="100%" height="100%" viewBox="0 0 113 67" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M24.8182 33.0909C24.8182 14.8153 39.6335 0 57.9091 0C76.1847 0 91 14.8153 91 33.0909V41.7377C91.0109 60.2573 94.967 66.6391 113 67H0C18.7515 67 24.8182 52.7213 24.8182 41.7377V33.0909Z"
                                        fill="rgba(87, 92, 156, 0.6)"
                                    />
                                </svg>
                            </div>

                            <div
                                className="w-full h-[100px] rounded-[20px] flex items-center relative px-1 shadow-xl backdrop-blur-xl border border-white/30"
                                style={{ backgroundColor: 'rgba(87, 92, 156, 0.6)' }}
                            >
                                {/* Left Arrow */}
                                <button
                                    onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                                    className="p-1.5 text-[#575C9C] hover:scale-110 transition-transform"
                                >
                                    <Icon icon="lucide:chevron-left" className="w-6 h-6 stroke-[3px]" />
                                </button>

                                {/* Scrollable thumbnail row */}
                                <div
                                    ref={scrollRef}
                                    onScroll={checkScroll}
                                    className="flex-1 flex gap-3 px-1 items-center overflow-x-auto no-scrollbar h-full py-2 scroll-smooth"
                                >
                                    {spreads.map((spread, idx) => {
                                        const isSelected = spread.indices.includes(currentPage);
                                        return (
                                            <div
                                                key={idx}
                                                data-index={idx}
                                                className={`thumbnail-item shrink-0 flex flex-col items-center gap-1.5 p-1 rounded-xl transition-all duration-300 ${isSelected ? 'bg-[#575C9C]/20 ring-1 ring-[#575C9C]/30 scale-105' : 'hover:bg-white/10'}`}
                                                onClick={() => onPageClick(spread.indices[0])}
                                            >
                                                <div className="bg-white rounded-lg overflow-hidden shadow-md flex gap-[1px]" style={{ width: '64px', height: '46px' }}>
                                                    {spread.pages.map((page, pIdx) => (
                                                        <div key={pIdx} className="flex-1 h-full overflow-hidden">
                                                            <PageThumbnail
                                                                html={page.html || page.content}
                                                                index={spread.indices[pIdx]}
                                                                scale={0.08}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-bold text-[#575C9C] whitespace-nowrap opacity-90">
                                                    Page {spread.indices[0] + 1}{spread.indices.length > 1 ? `-${spread.indices[1] + 1}` : ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right Arrow */}
                                <button
                                    onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                                    className="p-1.5 text-[#575C9C] hover:scale-110 transition-transform"
                                >
                                    <Icon icon="lucide:chevron-right" className="w-6 h-6 stroke-[3px]" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {showProfilePopup && (
                    <div key="profile-popup" className="absolute inset-0 z-[2000] pointer-events-none">
                        <motion.div
                            key="profile-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[100] bg-transparent pointer-events-auto"
                            onClick={() => setShowProfilePopup(false)}
                        />
                        <motion.div
                            key="profile-panel"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-[105px] right-[105px] z-[110] pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative w-[150px] min-h-[120px] flex flex-col group">
                                {/* SVG Badge Background */}
                                <div className="absolute inset-0 z-0 pointer-events-none">
                                    <svg width="100%" height="100%" viewBox="0 0 250 630" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                        <path d="M0 140C0 128.95 8.95 120 20 120H170C185 120 190 100 190 70V35C190 15 205 0 220 0C235 0 250 15 250 35V120V610C250 621.05 241.05 630 230 630H20C8.95 630 0 621.05 0 610V140Z" fill="rgba(87, 92, 156, 0.95)" />
                                    </svg>
                                </div>
                                {/* Content Layer - No clip path needed since it's just floating inside */}
                                <div className="relative z-10 flex flex-col flex-1 pt-[45px] px-2 pb-2">
                                    <div className="bg-white rounded-lg flex flex-col w-full h-full p-2.5 shadow-sm overflow-hidden min-h-[100px]">
                                        {!(profileSettings?.name || profileSettings?.about || profileSettings?.contacts?.length > 0) ? (
                                            <div className="text-[10px] text-center py-4 italic font-medium text-[#575C9C] opacity-50">
                                                No profile found
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {/* Name Row */}
                                                {profileSettings?.name && (
                                                    <div className="flex items-start gap-1">
                                                        <span className="text-[10px] font-medium tracking-tight text-[#575C9C]">Name :</span>
                                                        <span className="text-[10px] font-semibold text-[#575C9C] truncate">{profileSettings.name}</span>
                                                    </div>
                                                )}
                                                {/* About Row */}
                                                {profileSettings?.about && (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[10px] font-medium tracking-tight text-[#575C9C]">About :</span>
                                                        <p className="text-[9px] leading-relaxed font-semibold opacity-90 text-justify tracking-tight text-[#575C9C] line-clamp-3">{profileSettings.about}</p>
                                                    </div>
                                                )}
                                                {/* Contact Section */}
                                                {profileSettings?.contacts?.length > 0 && (
                                                    <div className="flex flex-col gap-1.5 mt-0.5">
                                                        <span className="text-[10px] font-medium tracking-tight text-[#575C9C]">Contact :</span>
                                                        <div className="flex items-center flex-wrap gap-1">
                                                            {profileSettings.contacts.map((contact, idx) => {
                                                                if (!contact.value) return null;
                                                                let bg = 'bg-[#575C9C]', icon = 'lucide:link', color = 'text-white';
                                                                switch (contact.type) {
                                                                    case 'email': icon = 'lucide:mail'; break;
                                                                    case 'phone': icon = 'lucide:phone'; break;
                                                                    case 'whatsapp': icon = 'lucide:message-circle'; break;
                                                                    case 'x': icon = 'ri:twitter-x-line'; bg = 'bg-black'; break;
                                                                    case 'facebook': icon = 'lucide:facebook'; bg = 'bg-[#1877F2]'; break;
                                                                    case 'instagram': icon = 'lucide:instagram'; bg = 'bg-gradient-to-tr from-[#fd5949] to-[#d6249f]'; break;
                                                                    case 'linkedin': icon = 'lucide:linkedin'; bg = 'bg-[#0077b5]'; break;
                                                                    case 'youtube': icon = 'lucide:youtube'; bg = 'bg-[#FF0000]'; break;
                                                                    case 'website': icon = 'lucide:globe'; break;
                                                                }
                                                                return (
                                                                    <button
                                                                        key={contact.id || idx}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (contact.type === 'phone') window.open(`tel:${contact.value}`, '_self');
                                                                            else if (contact.type === 'email') window.open(`mailto:${contact.value}`, '_self');
                                                                            else if (contact.type === 'whatsapp') window.open(`https://wa.me/${contact.value}`, '_blank');
                                                                            else window.open(contact.value.startsWith('http') ? contact.value : `https://${contact.value}`, '_blank');
                                                                        }}
                                                                        className={`w-6 h-6 ${bg} rounded-[4px] flex items-center justify-center shadow-md active:scale-95`}
                                                                    >
                                                                        {contact.type === 'x' ? (
                                                                            <span className="text-white font-bold text-[12px] leading-none" style={{ fontFamily: 'serif' }}>𝕏</span>
                                                                        ) : (
                                                                            <Icon icon={icon} className={`w-3.5 h-3.5 ${color}`} />
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {renderPopups()}
        </div>
    );
};

export default MobileLayout8; 
