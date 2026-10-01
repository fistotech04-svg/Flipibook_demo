import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
const Grid5Layout = lazy(() => import('../../Layouts/Grid5Layout'));
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';





import Sound from '../../popups/Sound';
import Export from '../../popups/Export';
import FlipbookSharePopup from '../../popups/FlipbookSharePopup';
import TableOfContentsPopup from '../../popups/TableOfContentsPopup';

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
                    height: '506px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    backgroundColor: 'white'
                }}
            />
        </div>
    );
});

const getLayoutColor = (id, defaultColor) => {
    return `var(--${id}, ${defaultColor})`;
};

const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;
};

const MobileLayout5 = (props) => {
    const {
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
    } = props;
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const progressRef = useRef(null);
    const scrollRef = useRef(null);
    const [currentZoom, setCurrentZoom] = useState(0.5);

    const isPhysicalMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const [showNotesSelection, setShowNotesSelection] = useState(false);
    const [tocSearchQuery, setTocSearchQuery] = useState('');

    const [isLandscapeReady, setIsLandscapeReady] = useState(false);
    useEffect(() => {
        if (isLandscape) {
            const timer = setTimeout(() => setIsLandscapeReady(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsLandscapeReady(false);
        }
    }, [isLandscape]);

    const effectiveIsLandscape = isLandscape && isLandscapeReady;

    const currentProfile = (profileSettings && profileSettings[activeLayout]) ? profileSettings[activeLayout] : profileSettings;
    const profileName = currentProfile?.name || '';
    const profileAbout = currentProfile?.about || '';
    const profileContacts = currentProfile?.contacts || [];

    const handleContactClick = (e, contact) => {
        e.preventDefault();
        e.stopPropagation();
        if (!contact?.value) return;

        const value = contact.value.trim();
        const type = contact.type;
        const lowerValue = value.toLowerCase();

        const isEmail = type === 'email' || (value.includes('@') && !lowerValue.startsWith('http'));
        const isPhone = type === 'phone';

        if (isEmail) {
            if (lowerValue.endsWith('@gmail.com')) {
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${value}`, '_blank');
            } else if (lowerValue.endsWith('@outlook.com') || lowerValue.endsWith('@hotmail.com')) {
                window.open(`https://outlook.office.com/mail/deeplink/compose?to=${value}`, '_blank');
            } else {
                window.location.href = `mailto:${value}`;
            }
        } else if (isPhone) {
            window.location.href = `tel:${value}`;
        } else {
            const url = value.startsWith('http') ? value : `https://${value}`;
            window.open(url, '_blank', 'noopener,noreferrer');
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
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
        }
    };

    useEffect(() => {
        if (showThumbnailBar) {
            // Small delay to ensure DOM is ready and layout is calculated
            setTimeout(checkScroll, 50);
        }
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [spreads, showThumbnailBar]);

    useEffect(() => {
        if (showThumbnailBar && scrollRef.current) {
            const activeElem = scrollRef.current.querySelector('.active-thumbnail');
            if (activeElem) {
                activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [currentPage, showThumbnailBar]);

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
            '--accent-color': '#575C9C',
            '--header-blue': '#0B0F4E',
        };
    }, [activeLayout]);

    const renderPopups = () => (
        <div className="absolute inset-0 pointer-events-none z-[2000]">
            <AnimatePresence>
                {/* Table of Contents - Unified for both orientations */}
                {showTOC && !effectiveIsLandscape && (
                    <>
                        <div className="fixed inset-0 z-[150] bg-transparent pointer-events-auto" onClick={() => setShowTOC(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute z-[160] pointer-events-auto bottom-[100px] left-[52px]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative">
                                <div
                                    className="absolute -bottom-[12px] left-[32px] -translate-x-1/2 z-10 pointer-events-none"
                                    style={{ width: '10px', height: '14px' }}
                                >
                                    <svg width="100%" height="100%" viewBox="0 0 10 20" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 0L5 20L10 0" fill="#FFFFFF" />
                                        <path d="M0 0L5 20L10 0" fill={getLayoutColor('toc-bg', '#FFFFFF')} />
                                    </svg>
                                </div>

                                {/* Popup Card */}
                                <div
                                    className="rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] w-[180px] flex flex-col relative z-20 overflow-hidden border border-gray-100"
                                    style={{ backgroundColor: '#FFFFFF' }}
                                >
                                    <div
                                        className="absolute inset-0 z-0"
                                        style={{ backgroundColor: getLayoutColorRgba('toc-bg', '255, 255, 255', '1') }}
                                    />
                                    <div className="relative z-10 p-3.5 flex flex-col">
                                        <div className="flex items-center justify-between mb-3 shrink-0">
                                            <h2
                                                className="text-[12px] font-bold tracking-tight"
                                                style={{ color: getLayoutColor('toc-text', '#000000') }}
                                            >Table of Contents</h2>
                                            <button onClick={() => setShowTOC(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                                <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Search Bar */}
                                        {settings.tocSettings?.addSearch !== false && (
                                            <div className="mb-3">
                                                <div
                                                    className="flex items-center rounded-lg px-2 py-1.5 border transition-all relative overflow-hidden"
                                                    style={{
                                                        borderColor: getLayoutColor('toc-bg', '#FFFFFF').toLowerCase() === getLayoutColor('toc-text', '#575C9C').toLowerCase()
                                                            ? 'rgba(255,255,255,0.2)'
                                                            : 'rgba(0,0,0,0.08)'
                                                    }}
                                                >
                                                    <div
                                                        className="absolute inset-0 z-0"
                                                        style={{
                                                            backgroundColor: "transparent".toLowerCase() === getLayoutColor('toc-text', '#575C9C').toLowerCase()
                                                                ? getLayoutColor('toc-bg', '#FFFFFF')
                                                                : getLayoutColor('toc-text', '#575C9C'),
                                                            opacity: getLayoutColor('toc-bg', '#FFFFFF').toLowerCase() === getLayoutColor('toc-text', '#575C9C').toLowerCase()
                                                                ? 0.15
                                                                : 0.05
                                                        }}
                                                    />
                                                    <div className="relative z-10 flex items-center w-full">
                                                        <Icon icon="lucide:search" className="w-3 h-3" style={{ color: getLayoutColor('toc-text', '#575C9C'), opacity: 0.4 }} />
                                                        <input
                                                            type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                                                            value={tocSearchQuery}
                                                            onChange={(e) => setTocSearchQuery(e.target.value)}
                                                            placeholder="Search..."
                                                            className="bg-transparent border-0 outline-none focus:ring-0 text-[10px] ml-1.5 w-full placeholder:text-gray-400"
                                                            style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1 no-scrollbar text-left">
                                            {(settings?.tocSettings?.content || settings?.toc?.content || []).length > 0 ? (
                                                (settings?.tocSettings?.content || settings?.toc?.content || [])
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
                                                                    className="flex items-center justify-between group cursor-pointer py-0.5"
                                                                    onClick={() => { onPageClick(item.page - 1); setShowTOC(false); setTocSearchQuery(''); }}
                                                                >
                                                                    <div className="flex items-center gap-1.5 truncate pr-2">
                                                                        {settings.tocSettings?.addSerialNumberToHeading !== false && (
                                                                            <span className="text-[10px] font-bold opacity-50 tabular-nums shrink-0" style={{ color: getLayoutColor('toc-text', '#374151') }}>{idx + 1}.</span>
                                                                        )}
                                                                        <span
                                                                            className="text-[11px] font-semibold transition-colors truncate"
                                                                            style={{ color: getLayoutColor('toc-text', '#374151') }}
                                                                        >
                                                                            {item.title}
                                                                        </span>
                                                                    </div>
                                                                    {settings.tocSettings?.addPageNumber !== false && (
                                                                        <span
                                                                            className="text-[10px] font-semibold transition-colors tabular-nums shrink-0"
                                                                            style={{ color: getLayoutColor('toc-text', '#374151') }}
                                                                        >
                                                                            {String(item.page).padStart(2, '0')}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Child Subheadings */}
                                                                {filteredSubheadings.map((sub, sIdx) => (
                                                                    <div
                                                                        key={sub.id || sIdx}
                                                                        className="flex items-center justify-between group cursor-pointer py-0.5"
                                                                        onClick={() => { onPageClick(sub.page - 1); setShowTOC(false); setTocSearchQuery(''); }}
                                                                    >
                                                                        <div className="flex items-center gap-1.5 truncate pr-2 ml-3">
                                                                            {settings.tocSettings?.addSerialNumberToSubheading !== false && (
                                                                                <span className="text-[9px] font-bold opacity-30 tabular-nums shrink-0" style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '1') }}>{idx + 1}.{sIdx + 1}</span>
                                                                            )}
                                                                            <span
                                                                                className="text-[10px] font-medium transition-colors truncate"
                                                                                style={{ color: getLayoutColorRgba('toc-text', '107, 114, 128', '0.7') }}
                                                                            >
                                                                                {sub.title}
                                                                            </span>
                                                                        </div>
                                                                        {settings.tocSettings?.addPageNumber !== false && (
                                                                            <span
                                                                                className="text-[9px] font-medium transition-colors tabular-nums shrink-0"
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
                                                <div className="text-center py-4 text-gray-400 text-[10px] italic">No content found</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}

                {/* View Bookmark Sidebar */}
                {showViewBookmarkPopup && (
                    <>
                        <div className="fixed inset-0 z-[150] bg-transparent pointer-events-auto" onClick={() => setShowViewBookmarkPopup(false)} />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }} className={`absolute right-0 z-[170] pointer-events-auto flex flex-col shadow-2xl border-l border-white/10 ${effectiveIsLandscape ? 'w-[22%] top-0 bottom-0' : 'w-[70%] top-0 bottom-0'}`} style={{ backgroundColor: '#FFFFFF' }}>
                            <div className="flex items-center justify-between px-5 py-6 border-b shrink-0" style={{ borderColor: 'rgba(87, 92, 156, 0.1)' }}>
                                <span className="text-[18px] font-bold text-[#575C9C]">Saved Bookmarks</span>
                                <button onClick={() => setShowViewBookmarkPopup(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                    <Icon icon="lucide:x" className="w-[20px] h-[20px] text-[#575C9C]" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-3">
                                {bookmarks?.length > 0 ? bookmarks.map((bm, idx) => (
                                    <div key={bm.id || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group hover:bg-[#575C9C]/5 transition-all">
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onPageClick(bm.pageIndex); setShowViewBookmarkPopup(false); }}>
                                            <span className="text-[14px] font-bold text-gray-700 block truncate group-hover:text-[#575C9C]">{bm.label || `Page ${bm.pageIndex + 1}`}</span>
                                            <span className="text-[11px] text-gray-400 font-medium">Page {bm.pageIndex + 1}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onUpdateBookmark?.(bm)} className="p-2 text-gray-400 hover:text-[#575C9C] transition-colors"><Icon icon="lucide:edit-3" className="w-4 h-4" /></button>
                                            <button onClick={() => onDeleteBookmark?.(bm.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Icon icon="lucide:trash-2" className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40 gap-3 mt-10">
                                        <Icon icon="lucide:bookmark" className="w-12 h-12" />
                                        <span className="text-[14px] font-medium">No bookmarks saved</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}

                
                
                


                <Export
                    isOpen={showExportPopup}
                    onClose={() => setShowExportPopup(false)}
                    isMobile={true}
                    hideButton={true}
                    pages={pages}
                    bookName={bookName}
                    currentPage={currentPage}
                    isLandscape={isLandscape}
                />
                {showSharePopup && <FlipbookSharePopup
                    onClose={() => setShowSharePopup(false)}
                    bookName={props.currentBook?.flipbookName || bookName}
                    url={props.currentBook?.shareUrl || window.location.href}
                    isPublished={props.currentBook?.status === 'Published'}
                    isMobile={true}
                    isLandscape={isLandscape}
                />}
            </AnimatePresence>
        </div>
    );

    if (effectiveIsLandscape) {
        return (
            <div className="w-full h-full overflow-hidden bg-[#DADBE8] relative">
                <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center bg-[#DADBE8]">
                        <div className="flex flex-col items-center gap-3">
                            <Icon icon="lucide:loader-2" className="w-8 h-8 text-[#575C9C] animate-spin" />
                            <span className="text-[#575C9C] text-sm font-bold">Scaling Layout...</span>
                        </div>
                    </div>
                }>
                    <Grid5Layout
                        {...({
                            ...props,
                            children,
                            settings,
                            bookName,
                            searchQuery,
                            setSearchQuery,
                            handleQuickSearch,
                            setShowThumbnailBarMemo: setShowThumbnailBar,
                            setShowTOCMemo: setShowTOC,
                            setShowAddNotesPopupMemo: setShowAddNotesPopup,
                            setShowAddBookmarkPopupMemo: setShowAddBookmarkPopup,
                            setShowViewBookmarkPopup,
                            setShowNotesViewerMemo: setShowNotesViewer,
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
                            pagesCount: pages?.length || 0,
                            currentZoom,
                            setCurrentZoom,
                            onPageClick,
                            bookmarks,
                            notes,
                            onUpdateBookmark,
                            onDeleteBookmark,
                            profileSettings,
                            isSidebarOpen: false,
                            showViewBookmarkPopup,
                            activeLayout,
                            isTablet: false,
                            isMobile: false,
                            isMobileLandscape: true
                        })}
                    />
                    {renderPopups()}
                </Suspense>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden select-none relative">
            {/* Portrait Mobile Layout 5 - Matching Screenshot */}
            <div className="flex flex-col h-full w-full overflow-hidden select-none relative bg-[#BDC3D9]">
                {/* Top dark blue bar */}
                {!isPhysicalMobile && <div className="h-12 w-full shrink-0" style={{ backgroundColor: '#0B0F4E' }} />}

                {/* Light Layout Header */}
                <header className="z-50 px-5 pt-4 pb-2 flex flex-col gap-3 relative shrink-0" style={{ backgroundColor: '#BDC3D9' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-[#575C9C] text-[15px] font-semibold truncate flex-1 opacity-80">{/* bookName hidden */}</span>
                        <div className="flex items-center">
                            {settings?.brandingProfile?.logo && logoSettings?.src ? (
                                <img src={logoSettings.src} alt="Logo" className="h-6 w-auto" style={{ opacity: (logoSettings.opacity ?? 100) / 100 }} />
                            ) : null}
                        </div>
                    </div>

                    {/* Search and Zoom Row */}
                    <div className="flex items-center gap-3">
                        {/* Search Bar */}
                        <div className={`flex-1 bg-white rounded-full px-4 py-1 flex items-center gap-3 shadow-sm relative ${showSuggestions && recommendations.length > 0 ? 'z-20' : ''}`}>
                            <Icon icon="lucide:search" className="text-[#575C9C] w-4 h-4 opacity-50" />
                            <input
                                type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                                placeholder="Quick Search..."
                                className="bg-transparent text-[#575C9C] placeholder-[#575C9C]/50 text-[13px] outline-none w-full font-medium"
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
                                        setRecommendations(results.slice(0, 5));
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
                            <AnimatePresence>
                                {showSuggestions && recommendations.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-[100] overflow-hidden">
                                        <div className="flex flex-col py-1">
                                            {recommendations.map((rec, idx) => (
                                                <button key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-[#575C9C]/5 transition-colors text-[#575C9C]" onClick={() => { onPageClick(rec.pageNumber - 1); setRecommendations([]); setShowSuggestions(false); setLocalSearchQuery(rec.word); }}>
                                                    <span className="text-[12px] font-semibold">{rec.word}</span>
                                                    <span className="text-[10px] opacity-60 font-bold">{rec.pageNumber.toString().padStart(2, '0')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Zoom Reset Control */}
                        <div className="flex items-center shrink-0 bg-[#DDE0F4] rounded-full p-[2px] shadow-sm pr-1">
                            <div className="flex items-center gap-1.5 px-1.5 py-1">
                                <button
                                    onClick={() => setCurrentZoom(prev => Math.max(0.1, prev - 0.05))}
                                    className="text-[#575C9C] active:scale-90 transition-transform"
                                >
                                    <Icon icon="lucide:minus" className="w-[12px] h-[12px]" />
                                </button>
                                <span className="text-[#575C9C] text-[9px] font-bold min-w-[22px] text-center">
                                    {Math.round((currentZoom / 0.5) * 100)}%
                                </span>
                                <button
                                    onClick={() => setCurrentZoom(prev => Math.min(1.5, prev + 0.05))}
                                    className="text-[#575C9C] active:scale-90 transition-transform"
                                >
                                    <Icon icon="lucide:plus" className="w-[12px] h-[12px]" />
                                </button>
                            </div>
                            <button
                                onClick={() => setCurrentZoom(0.5)}
                                className="bg-white text-[#575C9C] text-[9px] font-bold px-1.5 py-1 rounded-full shadow-sm active:scale-95 transition-all"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 relative flex flex-col px-4 overflow-hidden">
                    {/* Book Area - Centered in the available space above the toolbar */}
                    <div className="flex-1 relative flex items-center justify-center" style={{ marginBottom: '100px' }}>
                        <div className="relative mt-0">
                            {/* Book Render */}
                            <div className="transition-transform duration-500 ease-out" style={{ transform: `scale(${currentZoom / 0.5 * 1.2})`, transformOrigin: 'center center' }}>
                                <div className="relative">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Arrows - Left Side (Independent of book margin) */}
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 z-[90] flex flex-col gap-6 items-center -mt-10 pointer-events-auto">
                        <button
                            className="p-2 text-[#575C9C] active:scale-95 transition-transform"
                            onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                        >
                            <Icon icon="ph:caret-left-bold" className="w-5 h-5 opacity-60" />
                        </button>
                    </div>

                    {/* Navigation Arrows - Right Side (Independent of book margin) */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 z-[90] flex flex-col gap-6 items-center -mt-10 pointer-events-auto">
                        <button
                            className="p-2 text-[#575C9C] active:scale-95 transition-transform"
                            onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                        >
                            <Icon icon="ph:caret-right-bold" className="w-5 h-5 opacity-60" />
                        </button>
                    </div>

                    {/* Bottom Toolbar & Controls Area - Pinned to bottom */}
                    <div className="absolute bottom-0 left-6 right-6 z-50 flex flex-col gap-1.5 pb-4 pt-2">

                        {/* Portrait Thumbnail Bar - Matching Screenshot UI */}
                        <AnimatePresence>
                            {showThumbnailBar && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.98 }}
                                    className={`relative z-[150] w-full mx-auto ${spreads.length === 1 ? 'rounded-lg' : 'rounded-full'} shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex items-center border overflow-hidden mb-2`}
                                    style={{
                                        backgroundColor: '#FFFFFF',
                                        borderColor: '#575C9C',
                                        height: '60px'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div
                                        className="w-full h-full flex items-center px-2"
                                        style={{ backgroundColor: '#FFFFFF' }}
                                    >
                                        {/* Left Navigation */}
                                        {canScrollLeft ? (
                                            <button
                                                className="w-6 h-full flex items-center justify-center hover:scale-110 transition-all shrink-0"
                                                onClick={(e) => { e.stopPropagation(); if (scrollRef.current) scrollRef.current.scrollBy({ left: -150, behavior: 'smooth' }); }}
                                                style={{ color: '#575C9C' }}
                                            >
                                                <Icon icon="ph:caret-left" className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <div className="w-6 h-full shrink-0" />
                                        )}

                                        {/* Thumbnails Container */}
                                        <div
                                            ref={scrollRef}
                                            onScroll={checkScroll}
                                            className="flex-1 flex overflow-x-auto no-scrollbar scroll-smooth items-center h-full gap-2"
                                        >
                                            {spreads.map((spread, idx) => {
                                                const isSelected = spread.indices.includes(currentPage);

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="thumbnail-item relative flex flex-col items-center shrink-0 cursor-pointer transition-all duration-300 group"
                                                        style={{ width: 'calc((100% - 16px) / 3)' }}
                                                        onClick={(e) => { e.stopPropagation(); onPageClick(spread.indices[0]); }}
                                                    >
                                                        {/* Thumbnail Container with Theme-based Border */}
                                                        <div
                                                            className="w-full h-[46px] bg-white border transition-all rounded-[2px] overflow-hidden relative"
                                                            style={{
                                                                borderColor: '#575C9C',
                                                                borderWidth: '1px'
                                                            }}
                                                        >
                                                            <div className="flex w-full h-full gap-0 bg-white justify-center relative">
                                                                {spread.pages.map((page, pIdx) => {
                                                                    const pageWidth = 400;
                                                                    const pageHeight = 566;
                                                                    const availableWidth = 35;
                                                                    const availableHeight = 44;
                                                                    const thumbScale = Math.min(availableWidth / pageWidth, availableHeight / pageHeight) * 0.95;

                                                                    return (
                                                                        <div key={`${idx}-${pIdx}`} className="flex-1 max-w-[50%] bg-white overflow-hidden relative flex items-center justify-center">
                                                                            <PageThumbnail
                                                                                html={page.html || page.content}
                                                                                index={spread.indices[pIdx]}
                                                                                scale={thumbScale}
                                                                            />
                                                                            {/* Simple Page Fold/Curl Effect for Visual Match */}
                                                                            {pIdx === 1 && (
                                                                                <div className="absolute top-0 right-0 w-[8px] h-[8px] bg-white shadow-[-1px_1px_2px_rgba(0,0,0,0.1)] z-10"
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
                                                                    <span className="text-white text-[8px] font-semibold whitespace-nowrap">
                                                                        Page {spread.indices[0] + 1} / {pages.length}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Right Navigation */}
                                        {canScrollRight ? (
                                            <button
                                                className="w-6 h-full flex items-center justify-center hover:scale-110 transition-all shrink-0"
                                                onClick={(e) => { e.stopPropagation(); if (scrollRef.current) scrollRef.current.scrollBy({ left: 150, behavior: 'smooth' }); }}
                                                style={{ color: '#575C9C' }}
                                            >
                                                <Icon icon="ph:caret-right" className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <div className="w-6 h-full shrink-0" />
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Main Icon Toolbar - Capsule shape */}
                        <div className="bg-[#575C9C] rounded-full px-5 h-[34px] flex items-center justify-between shadow-xl">
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const nextState = !showThumbnailBar;
                                setShowThumbnailBar(nextState);
                                if (nextState) {
                                    setShowTOC(false);
                                    setShowProfilePopup(false);
                                    setShowSoundPopup(false);
                                }
                            }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                <Icon icon="ep:menu" className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const nextState = !showTOC;
                                setShowTOC(nextState);
                                if (nextState) {
                                    setShowThumbnailBar(false);
                                    setShowProfilePopup(false);
                                    setShowSoundPopup(false);
                                }
                            }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                <Icon icon="mdi:table-of-contents" className="w-4 h-4" />
                            </button>




                            <button onClick={() => {
                                setShowThumbnailBar(false);
                                setShowTOC(false);
                                setShowProfilePopup(false);
                                setShowSoundPopup(false);
                                props.setShowGalleryPopup?.(true);
                            }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                <Icon icon="clarity:image-gallery-solid" className="w-[18px] h-[18px]" />
                            </button>
                            {(settings?.media?.backgroundAudio ?? true) && (
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    const nextState = !showSoundPopup;
                                    setShowSoundPopup(nextState);
                                    if (nextState) {
                                        setShowThumbnailBar(false);
                                        setShowTOC(false);
                                        setShowProfilePopup(false);
                                    }
                                }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                    <Icon icon="solar:music-notes-bold" className="w-[18px] h-[18px]" />
                                </button>
                            )}
                            <div className="relative">
                                <button onClick={(e) => { e.stopPropagation(); setShowProfilePopup(!showProfilePopup); }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                    <Icon icon="solar:user-bold" className="w-[18px] h-[18px]" />
                                </button>
                                <AnimatePresence>
                                </AnimatePresence>
                            </div>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleShare();
                                setShowThumbnailBar(false);
                                setShowTOC(false);
                            }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                <Icon icon="mage:share-fill" className="w-[18px] h-[18px]" />
                            </button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleDownload();
                                setShowThumbnailBar(false);
                                setShowTOC(false);
                            }} className="text-white opacity-90 hover:opacity-100 hover:scale-110 active:scale-90 transition-all">
                                <Icon icon="meteor-icons:download" className="w-[18px] h-[18px]" />
                            </button>
                        </div>

                        {/* Play and Progress Bar Row - Matching Screenshot UI */}
                        <div className="flex items-center gap-2 px-1">
                            <div className="flex-1 bg-[#575C9C] h-[34px] rounded-full px-5 flex items-center gap-4 shadow-xl">
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={() => onPageClick(0)}
                                        className="text-white active:scale-90 transition-all"
                                    >
                                        <Icon icon="lucide:skip-back" strokeWidth="2" className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setIsPlaying(!isAutoFlipping)}
                                        className="text-white active:scale-90 transition-all"
                                    >
                                        <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onPageClick(pages.length - 1)}
                                        className="text-white active:scale-90 transition-all"
                                    >
                                        <Icon icon="lucide:skip-forward" strokeWidth="2" className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                <div
                                    ref={progressRef}
                                    className="flex-1 bg-white/20 h-[3px] rounded-full cursor-pointer relative overflow-hidden"
                                    onClick={handleProgressClick}
                                >
                                    <div
                                        className="absolute left-0 top-0 h-full transition-all duration-300 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                        style={{ width: `${Math.max(0, progressPercentage)}%` }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleFullScreen()}
                                className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 bg-[#575C9C] text-white active:scale-95 transition-all shadow-xl"
                            >
                                <Icon icon="lucide:fullscreen" className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SHARED Sidebars and Popups */}
            <AnimatePresence>
                {/* Global Popups Area handled by renderPopups */}

                {/* Global Popups */}
                {/* Global Popups Area */}
                {renderPopups()}
            </AnimatePresence>
        </div>
    );
};

export default MobileLayout5;
