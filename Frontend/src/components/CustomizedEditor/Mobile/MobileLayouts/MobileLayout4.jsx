import React, { useState, useMemo, useRef, useEffect } from 'react';
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
                    height: '566px',
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

const MobileLayout4 = (props) => {
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
        offset = 0,
        layoutColors = [],
    } = props;
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [recommendations, setRecommendations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const progressRef = useRef(null);
    const scrollRef = useRef(null);

    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);
    const [tocSearchQuery, setTocSearchQuery] = useState('');
    const [showLocalThumbnails, setShowLocalThumbnails] = useState(false);
    const [showLocalTOC, setShowLocalTOC] = useState(false);
    const [showLocalProfile, setShowLocalProfile] = useState(false);
    const [showLocalSound, setShowLocalSound] = useState(false);

    const initialWidth = (children && children.props && children.props.WIDTH) ? children.props.WIDTH : 400;
    const initialHeight = (children && children.props && children.props.HEIGHT) ? children.props.HEIGHT : 566;

    const isPhysicalMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
        };
    }, [activeLayout]);

    const renderPopups = () => (
        <div className="absolute inset-0 pointer-events-none z-[2000]">
            <AnimatePresence>
                {showTOC && (
                    <TableOfContentsPopup
                        onClose={() => setShowTOC(false)}
                        contents={settings?.tocSettings?.content || settings?.toc?.content || []}
                        settings={settings?.tocSettings || settings?.toc}
                        activeLayout={activeLayout}
                        isMobile={true}
                        onNavigate={(pageIndex) => {
                            onPageClick(pageIndex);
                            setShowTOC(false);
                        }}
                    />
                )}
            </AnimatePresence>






            <Sound
                isOpen={showLocalSound}
                onClose={() => setShowLocalSound(false)}
                activeLayout={activeLayout}
                otherSetupSettings={otherSetupSettings}
                onUpdateOtherSetup={onUpdateOtherSetup}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                isFlipMuted={isFlipMuted}
                setIsFlipMuted={setIsFlipMuted}
                flipTrigger={flipTrigger}
                settings={settings}
                isMobile={true}
            />

            {showExportPopup && (
                <Export
                    isOpen={true}
                    hideButton={true}
                    onClose={() => setShowExportPopup(false)}
                    pages={pages}
                    bookName={bookName}
                    isMobile={true}
                    currentPage={currentPage}
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

    return (
        <div className="flex flex-col h-full w-full overflow-hidden select-none relative bg-[#BDC3D9]">
            {/* Notch Spacer - fills the area near the hardware notch with a dark status bar color */}
            {!isPhysicalMobile && <div className="shrink-0 h-10 z-50 bg-[#0B0F4E]" />}

            {/* Header */}
            <header className="z-50 px-4 pt-0 pb-3 flex flex-col gap-3 shadow-sm relative shrink-0" style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}>
                {showSuggestions && recommendations.length > 0 && <div className="fixed inset-0 z-[15] bg-transparent" onClick={() => setShowSuggestions(false)} />}

                {/* Top Row: Book Title & Logo */}
                <div className="flex items-center justify-between">
                    <span className="text-white text-[13px] font-medium opacity-90 truncate flex-1">{/* {bookName} */}</span>
                    <div className="flex items-center">
                        {settings?.brandingProfile?.logo && logoSettings?.src && (
                            <img
                                src={logoSettings.src}
                                alt="Logo"
                                className="h-5 w-auto transition-all mix-blend-screen"
                                style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                            />
                        )}
                    </div>
                </div>

                {/* Bottom Row: Search & Hamburger Container */}
                <div className="flex items-center gap-3">
                    <div className={`flex-1 bg-[#EAEAF3] rounded-[2px] px-2.5 py-1.5 flex items-center gap-2 shadow-inner relative ${showSuggestions && recommendations.length > 0 ? 'z-20' : ''}`}
                        style={{ backgroundColor: getLayoutColor('toolbar-search-bg', '#EAEAF3') }}
                    >
                        <Icon icon="lucide:search" className="text-[#575C9C] w-4 h-4 opacity-70" style={{ color: getLayoutColor('search-text-v1', '#575C9C') }} />
                        <input
                            type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                            placeholder="Quick Search..."
                            className="bg-transparent text-[#575C9C] placeholder-[#575C9C]/70 text-[12px] outline-none w-full font-medium"
                            value={localSearchQuery}
                            style={{ color: getLayoutColor('search-text-v1', '#575C9C') }}
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

                        {/* Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-md rounded-md shadow-2xl border border-gray-100 z-[100] overflow-hidden"
                                >
                                    <div className="flex flex-col py-1.5">
                                        {recommendations.map((rec, idx) => (
                                            <button
                                                key={idx}
                                                className="flex items-center justify-between px-4 py-2 hover:bg-[#575C9C]/5 transition-colors text-[#575C9C]"
                                                onClick={() => {
                                                    onPageClick(rec.pageNumber - 1);
                                                    setRecommendations([]);
                                                    setShowSuggestions(false);
                                                    setLocalSearchQuery(rec.word);
                                                }}
                                            >
                                                <span className="text-[13px] font-semibold">{rec.word}</span>
                                                <span className="text-[11px] opacity-60 font-bold">{rec.pageNumber.toString().padStart(2, '0')}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button onClick={(e) => { 
                        e.stopPropagation(); 
                        if (showLocalThumbnails) {
                            setShowLocalThumbnails(false);
                            setShowMoreMenu(true);
                        } else if (showLocalTOC) {
                            setShowLocalTOC(false);
                            setShowMoreMenu(true);
                        } else if (showLocalProfile) {
                            setShowLocalProfile(false);
                            setShowMoreMenu(true);
                        } else if (props.showGalleryPopup && props.setShowGalleryPopup) {
                            props.setShowGalleryPopup(false);
                            setShowMoreMenu(true);
                        } else if (showSharePopup) {
                            setShowSharePopup(false);
                            setShowMoreMenu(true);
                        } else if (showExportPopup) {
                            setShowExportPopup(false);
                            setShowMoreMenu(true);
                        } else {
                            setShowMoreMenu(!showMoreMenu); 
                        }
                    }}
                        className={`flex items-center justify-center shrink-0 transition-all ${(showMoreMenu || showLocalThumbnails || showLocalTOC || showLocalProfile || props.showGalleryPopup || showSharePopup || showExportPopup) ? 'w-8 h-8 rounded-none border-[1.5px] shadow-sm' : 'p-1.5 border border-white/50 rounded'}`}
                        style={(showMoreMenu || showLocalThumbnails || showLocalTOC || showLocalProfile || props.showGalleryPopup || showSharePopup || showExportPopup) ? {
                            backgroundColor: "transparent",
                            color: getLayoutColor('search-text-v1', '#575C9C'),
                            borderColor: getLayoutColor('search-text-v1', '#575C9C')
                        } : {
                            color: getLayoutColor('toolbar-icon', '#FFFFFF'),
                            borderColor: getLayoutColor('toolbar-icon', '#FFFFFF')
                        }}
                    >
                        {showMoreMenu ? (
                            <div className="flex items-center justify-center w-full h-full p-1">
                                <div className="w-full h-full flex items-center justify-center border border-current opacity-80">
                                    <Icon icon="lucide:x" strokeWidth="2" className="w-[16px] h-[16px]" />
                                </div>
                            </div>
                        ) : showLocalThumbnails ? (
                            <Icon icon="ph:squares-four-fill" className="w-[18px] h-[18px]" />
                        ) : showLocalTOC ? (
                            <Icon icon="fluent:text-bullet-list-24-filled" className="w-[18px] h-[18px]" />
                        ) : showLocalProfile ? (
                            <Icon icon="fluent:person-24-filled" className="w-[18px] h-[18px]" />
                        ) : props.showGalleryPopup ? (
                            <Icon icon="clarity:image-gallery-solid" className="w-[18px] h-[18px]" />
                        ) : showSharePopup ? (
                            <Icon icon="mage:share-fill" className="w-[18px] h-[18px]" />
                        ) : showExportPopup ? (
                            <Icon icon="meteor-icons:download" className="w-[18px] h-[18px]" />
                        ) : (
                            <Icon icon="lucide:menu" className="w-[18px] h-[18px]" />
                        )}
                    </button>
                </div>
            </header>

            {/* Wrapper for main content and footer */}
            <div className="flex-1 relative flex flex-col overflow-hidden">

                {/* Main Content Area */}
                <div className="flex-1 relative overflow-hidden flex flex-col" style={{ backgroundColor: "transparent" }}>

                    {/* Menu Strip Overlay - Positioned between header and footer */}
                    <AnimatePresence>
                        {showMoreMenu && (
                            <>
                                {/* Click-away overlay - fixed to cover entire viewport */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-transparent z-[150]"
                                    onClick={() => {
                                        setShowBookmarkOptions(false);
                                        setShowNotesOptions(false);
                                        setTocSearchQuery('');
                                    }}
                                />
                                {/* Vertical Icon Strip - Attached to right of content area */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-[160] w-[10%] max-w-[40px] flex flex-col items-center justify-center gap-7 py-7 shadow-2xl rounded-lg"
                                    style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}
                                >
                                    {/* Thumbnail Button with Popup (Grid Icon) */}
                                    <div className="relative flex items-center justify-center w-full">
                                        <button onClick={() => { setShowLocalThumbnails(true); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); setTocSearchQuery(''); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                            <Icon icon="ph:squares-four-fill" className="w-[18px] h-[18px]" />
                                        </button>
                                    </div>
                                    <button onClick={() => { setShowLocalTOC(true); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); setTocSearchQuery(''); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="fluent:text-bullet-list-24-filled" className="w-[17px] h-[17px]" />
                                    </button>



                                    {/* Gallery Button */}
                                    <button onClick={() => { if (props.setShowGalleryPopup) props.setShowGalleryPopup(true); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="clarity:image-gallery-solid" className="w-[18px] h-[18px]" />
                                    </button>
                                    {(settings?.media?.backgroundAudio ?? true) && (
                                        <button onClick={() => { setShowSoundPopup(true); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                            <Icon icon="solar:music-notes-bold" className="w-[18px] h-[18px]" />
                                        </button>
                                    )}
                                    <button onClick={() => { setShowLocalProfile(true); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="fluent:person-24-filled" className="w-[18px] h-[18px]" />
                                    </button>
                                    <button onClick={() => { handleShare(); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="mage:share-fill" className="w-[17px] h-[17px]" />
                                    </button>
                                    <button onClick={() => { handleDownload(); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="meteor-icons:download" className="w-[17px] h-[17px]" />
                                    </button>
                                    <button onClick={() => { handleFullScreen(); setShowMoreMenu(false); setShowBookmarkOptions(false); setShowNotesOptions(false); }} className="hover:scale-110 active:scale-95 transition-transform p-1" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                        <Icon icon="lucide:fullscreen" className="w-[17px] h-[17px]" />
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Profile Sidebar — Desktop Layout 4 style */}
                    <AnimatePresence>
                        {showLocalProfile && (
                            <motion.div
                                key="profile-panel-ml4"
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.25 }}
                                className="absolute right-0 top-0 bottom-0 z-[170] w-[58%] flex flex-col shadow-2xl border-l border-gray-200"
                                style={{ backgroundColor: '#FFFFFF' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-[#575C9C]/20 shrink-0">
                                    <span className="text-[13px] font-semibold text-[#3E4491]">Profile</span>
                                    <button
                                        onClick={() => setShowLocalProfile(false)}
                                        className="opacity-60 hover:opacity-100 transition-opacity text-[#3E4491]"
                                    >
                                        <Icon icon="lucide:x" className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#BABEE4 transparent' }}>
                                    {profileSettings?.name || profileSettings?.about ? (
                                        <>
                                            {profileSettings?.name && (
                                                <div className="flex items-start gap-2">
                                                    <span className="text-[11px] font-bold whitespace-nowrap text-[#3E4491]">Name :</span>
                                                    <span className="text-[11px] font-medium opacity-80 text-[#575C9C]">{profileSettings.name}</span>
                                                </div>
                                            )}
                                            {profileSettings?.about && (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-[11px] font-bold whitespace-nowrap text-[#3E4491]">About :</span>
                                                        <div className="text-[11px] font-medium leading-relaxed text-justify opacity-80 text-[#575C9C]">
                                                            {profileSettings.about}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {profileSettings?.contacts?.filter(c => c.value).length > 0 && (
                                                <div className="mt-2">
                                                    <h3 className="text-[12px] font-bold mb-3 text-[#3E4491]">Contact</h3>
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        {profileSettings.contacts.filter(c => c.value).map((contact) => (
                                                            <button
                                                                key={contact.id}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${contact.type === 'x' ? 'bg-black' :
                                                                    contact.type === 'facebook' ? 'bg-[#3138A9]' :
                                                                        contact.type === 'instagram' ? 'bg-gradient-to-tr from-[#FFD600] via-[#FF0100] to-[#D800FF]' :
                                                                            'bg-white border border-gray-300'
                                                                    }`}
                                                                onClick={() => {
                                                                    if (contact.type === 'email' || contact.type === 'gmail') window.open(`mailto:${contact.value}`);
                                                                    else if (contact.type === 'phone' || contact.type === 'contact') window.open(`tel:${contact.value}`);
                                                                    else window.open(contact.value, '_blank');
                                                                }}
                                                            >
                                                                {contact.type === 'x' && <Icon icon="ri:twitter-x-fill" className="text-white w-4 h-4" />}
                                                                {contact.type === 'facebook' && <Icon icon="ri:facebook-fill" className="text-white w-4 h-4" />}
                                                                {(contact.type === 'email' || contact.type === 'gmail') && <Icon icon="logos:google-gmail" className="w-4 h-4" />}
                                                                {contact.type === 'instagram' && <Icon icon="ri:instagram-line" className="text-white w-4 h-4" />}
                                                                {(contact.type === 'phone' || contact.type === 'contact') && <Icon icon="ph:phone-fill" className="text-[#4B4EFC] w-4 h-4 -rotate-90" />}
                                                                {contact.type === 'linkedin' && <Icon icon="logos:linkedin-icon" className="w-4 h-4" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-[11px] text-center pt-10 opacity-60 font-medium text-[#575C9C]">
                                            No profile found
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* TOC Sidebar — Desktop Layout 4 style */}
                    <AnimatePresence>
                        {showLocalTOC && (
                            <motion.div
                                key="toc-panel-ml4"
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.25 }}
                                className="absolute right-0 top-0 bottom-0 z-[170] w-[58%] flex flex-col shadow-2xl border-l border-gray-200 bg-white"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                                    <span className="text-[13px] font-semibold text-[#575C9C]">Table of Contents</span>
                                    <button
                                        onClick={() => setShowLocalTOC(false)}
                                        className="opacity-70 hover:opacity-100 transition-opacity text-[#575C9C]"
                                    >
                                        <Icon icon="lucide:x" className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Search Bar */}
                                {settings?.tocSettings?.addSearch !== false && (
                                    <div className="px-3 py-2 border-b border-gray-50">
                                        <div className="relative">
                                            <Icon
                                                icon="lucide:search"
                                                className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#575C9C]/50"
                                            />
                                            <input
                                                type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                                                placeholder="Search..."
                                                value={tocSearchQuery}
                                                onChange={(e) => setTocSearchQuery(e.target.value)}
                                                className="w-full rounded-[3px] pl-6 pr-3 py-1.5 text-[11px] outline-none border border-[#575C9C]/20 text-[#575C9C] placeholder-[#575C9C]/40 bg-transparent focus:ring-1 focus:ring-[#575C9C]/20"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* List Area */}
                                <div
                                    className="flex-1 overflow-y-auto p-3 flex flex-col"
                                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#BABEE4 transparent' }}
                                >
                                    {(() => {
                                        const safeContent = Array.isArray(settings?.tocSettings?.content) ? settings.tocSettings.content : [];
                                        const filteredContent = safeContent.map(heading => {
                                            const matchesHeading = (heading?.title || '').toLowerCase().includes((tocSearchQuery || '').toLowerCase());
                                            const filteredSubs = heading?.subheadings?.filter(sub =>
                                                (sub?.title || '').toLowerCase().includes((tocSearchQuery || '').toLowerCase())
                                            ) || [];
                                            if (matchesHeading || filteredSubs.length > 0) {
                                                return { ...heading, subheadings: matchesHeading ? heading.subheadings : filteredSubs };
                                            }
                                            return null;
                                        }).filter(Boolean);

                                        return filteredContent.length > 0 ? (
                                            filteredContent.map((heading, hIdx) => (
                                                <div key={heading.id || hIdx} className={hIdx > 0 ? 'mt-3' : ''}>
                                                    <div
                                                        className="flex items-center justify-between py-1.5 rounded-[3px] cursor-pointer hover:bg-[#575C9C]/5 px-1 transition-colors"
                                                        style={{ color: '#575C9C' }}
                                                        onClick={() => { onPageClick(heading.page - 1); setShowLocalTOC(false); setTocSearchQuery(''); }}
                                                    >
                                                        <span className="text-[11px] font-medium truncate pr-2 flex items-center gap-1">
                                                            {settings?.tocSettings?.addSerialNumberHeading !== false && <span className="opacity-50">{hIdx + 1}.</span>}
                                                            {heading.title}
                                                        </span>
                                                        {settings?.tocSettings?.addPageNumber !== false && (
                                                            <span className="text-[10px] font-medium tabular-nums opacity-60 shrink-0">
                                                                {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col pl-3 border-l border-gray-100 ml-1">
                                                        {heading.subheadings?.map((sub, sIdx) => (
                                                            <div
                                                                key={sub.id || sIdx}
                                                                className="flex items-center justify-between py-1 rounded-[3px] cursor-pointer hover:bg-[#575C9C]/5 px-1 transition-colors"
                                                                style={{ color: '#575C9C' }}
                                                                onClick={() => { onPageClick(sub.page - 1); setShowLocalTOC(false); setTocSearchQuery(''); }}
                                                            >
                                                                <span className="text-[10px] font-normal truncate pr-2 flex items-center gap-1 opacity-80">
                                                                    {settings?.tocSettings?.addSerialNumberSubheading !== false && <span className="opacity-50">{hIdx + 1}.{sIdx + 1}</span>}
                                                                    {sub.title}
                                                                </span>
                                                                {settings?.tocSettings?.addPageNumber !== false && (
                                                                    <span className="text-[9px] font-normal tabular-nums opacity-50 shrink-0">
                                                                        {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-[11px] text-center pt-10 opacity-50 font-medium text-[#575C9C]">
                                                No Table Of Content Found
                                            </div>
                                        );
                                    })()}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Thumbnail Sidebar — Desktop Layout 4 style */}
                    <AnimatePresence>
                        {showLocalThumbnails && (
                            <motion.div
                                key="thumbnail-panel"
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.25 }}
                                className="absolute right-0 top-0 bottom-0 z-[170] w-[58%] flex flex-col shadow-2xl border-l border-gray-200"
                                style={{ backgroundColor: '#FFFFFF' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                                    <span className="text-[13px] font-bold text-[#3E4491]">Thumbnail</span>
                                    <button
                                        onClick={() => setShowLocalThumbnails(false)}
                                        className="opacity-60 hover:opacity-100 transition-opacity"
                                        style={{ color: '#3E4491' }}
                                    >
                                        <Icon icon="lucide:x" className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Vertically Scrollable Spread List */}
                                <div
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto p-3 flex flex-col gap-4"
                                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#BABEE4 transparent' }}
                                >
                                    {spreads.map((spread, idx) => {
                                        const isSelected = spread.indices.includes(currentPage);
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex flex-col items-center cursor-pointer group transition-all ${isSelected ? 'scale-[1.03] active-thumbnail' : 'hover:scale-[1.01]'}`}
                                                onClick={() => {
                                                    onPageClick(spread.indices[0]);
                                                    setShowLocalThumbnails(false);
                                                }}
                                            >
                                                <div
                                                    className={`relative bg-white shadow-md rounded-[3px] overflow-hidden border-[1.5px] transition-all p-1 ${isSelected
                                                        ? 'border-[#575C9C] shadow-lg'
                                                        : 'border-gray-200 group-hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="flex bg-gray-50/30">
                                                        {spread.pages.map((page, pIdx) => (
                                                            <div
                                                                key={pIdx}
                                                                className={`w-[52px] h-[74px] bg-white overflow-hidden relative ${pIdx === 0 && spread.pages.length > 1 ? 'border-r border-gray-100' : ''
                                                                    }`}
                                                            >
                                                                <PageThumbnail
                                                                    html={page.html || page.content}
                                                                    index={spread.indices[pIdx]}
                                                                    scale={0.13}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <span
                                                    className={`text-[10px] font-bold mt-1.5 transition-colors ${isSelected ? 'text-[#575C9C]' : 'text-[#575C9C]/60 group-hover:text-[#575C9C]'
                                                        }`}
                                                >
                                                    {spread.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>



                    {/* View Bookmarks Sidebar */}
                    <AnimatePresence>
                        {showViewBookmarkPopup && (
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.3 }}
                                className="absolute right-0 top-0 bottom-0 z-[170] w-[60%] flex flex-col shadow-2xl border-l border-white/10"
                                style={{ backgroundColor: "transparent" }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 shrink-0">
                                    <span className="text-[14px] font-bold" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>Bookmarks</span>
                                    <button onClick={() => setShowViewBookmarkPopup(false)} className="opacity-60 hover:opacity-100">
                                        <Icon icon="lucide:x" className="w-[18px] h-[18px]" style={{ color: getLayoutColor('toc-text', '#575C9C') }} />
                                    </button>
                                </div>

                                {/* Bookmark List */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
                                    {bookmarks && bookmarks.length > 0 ? (
                                        bookmarks.map((bm, bIdx) => (
                                            <div
                                                key={bm.id || bIdx}
                                                className="flex items-center justify-between py-2 px-2 hover:bg-black/5 rounded-lg transition-colors"
                                            >
                                                <div
                                                    className="flex-1 min-w-0 cursor-pointer"
                                                    onClick={() => {
                                                        if (onPageClick) onPageClick(bm.pageIndex);
                                                        setShowViewBookmarkPopup(false);
                                                    }}
                                                >
                                                    <span className="text-[13px] font-medium truncate block" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                                        {bm.label || `Page ${bm.pageIndex + 1}`}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onUpdateBookmark) onUpdateBookmark(bm);
                                                        }}
                                                        className="p-1.5 rounded-md hover:bg-black/10 transition-colors"
                                                        style={{ color: getLayoutColor('toc-text', '#575C9C') }}
                                                    >
                                                        <Icon icon="lucide:edit-3" className="w-[15px] h-[15px] opacity-70" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onDeleteBookmark) onDeleteBookmark(bm.id);
                                                        }}
                                                        className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                                                    >
                                                        <Icon icon="lucide:trash-2" className="w-[15px] h-[15px] opacity-70" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 opacity-50 text-[12px] font-medium" style={{ color: getLayoutColor('toc-text', '#575C9C') }}>
                                            No Bookmarks Found
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Arrows inside the main container */}
                    <button
                        className="absolute left-[2%] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 active:scale-90 transition-transform"
                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                    >
                        <Icon icon="ph:caret-left-light" strokeWidth="4" className="w-8 h-8 opacity-70" />
                    </button>

                    <button
                        className="absolute right-[2%] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 active:scale-90 transition-transform"
                        style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                        onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                    >
                        <Icon icon="ph:caret-right-light" strokeWidth="4" className="w-8 h-8 opacity-70" />
                    </button>

                    {/* Flipbook Canvas */}
                    <div className="flex-1 flex items-center justify-center px-10 relative overflow-hidden">
                        <div className="relative transition-transform duration-300" style={{ transform: 'scale(1.2)', transformOrigin: 'center center' }}>
                            {children}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="z-50 shrink-0 flex flex-col pt-2 pb-8 relative" style={{ backgroundColor: getLayoutColor('toolbar-bg', '#575C9C') }}>

                    {/* Top row: Page indicator pills (right-aligned) */}
                    <div className="flex items-center justify-end px-4 mb-2 gap-1.5">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-white/15 backdrop-blur-sm">
                            <span className="text-white/80 text-[9px] font-bold tabular-nums">
                                {Math.round(progressPercentage)}%
                            </span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-white/15 backdrop-blur-sm">
                            <span className="text-white/80 text-[9px] font-bold tabular-nums">
                                {currentPage + 1}&nbsp;/&nbsp;{pages.length}
                            </span>
                        </div>
                    </div>

                    {/* Bottom row: Playback & Scrub Bar */}
                    <div className="flex items-center px-6 gap-4 w-full">
                        {/* Media Controls */}
                        <div className="flex items-center gap-4">
                            <button onClick={() => onPageClick(0)} className="active:scale-90 transition-transform" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                <Icon icon="lucide:skip-back" strokeWidth="2" className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsPlaying(!isAutoFlipping)} className="active:scale-90 transition-transform" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                <Icon icon={isAutoFlipping ? "ph:pause-fill" : "ph:play-fill"} className="w-5 h-5" />
                            </button>
                            <button onClick={() => onPageClick(pages.length - 1)} className="active:scale-90 transition-transform" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                <Icon icon="lucide:skip-forward" strokeWidth="2" className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Scrub Bar */}
                        <div className="flex-1 flex items-center shrink-0">
                            <div ref={progressRef} className="h-1.5 w-full rounded-full cursor-pointer relative overflow-hidden"
                                style={{ backgroundColor: getLayoutColorRgba('toolbar-text-main', '255, 255, 255', '0.2') }}
                                onClick={handleProgressClick}>
                                <div
                                    className="absolute left-0 top-0 h-full transition-all duration-300 rounded-full"
                                    style={{ width: `${Math.max(1, progressPercentage)}%`, backgroundColor: "transparent" }}
                                />
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
            {renderPopups()}
        </div>
    );
};

export default MobileLayout4;
