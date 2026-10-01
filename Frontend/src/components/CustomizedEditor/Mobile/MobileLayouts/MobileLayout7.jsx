import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import FlipbookSharePopup from '../../popups/FlipbookSharePopup';
import TableOfContentsPopup from '../../popups/TableOfContentsPopup';





import Sound from '../../popups/Sound';
import Export from '../../popups/Export';

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

const MobileLayout7 = (props) => {
    const {
        children,
        pages,
        currentPage,
        onPageClick,
        bookName,
        settings,
        logoSettings,
        notes,
        onAddNote,
        onDeleteNote,
        bookmarks,
        onAddBookmark,
        onDeleteBookmark,
        onUpdateBookmark,
        bookmarkSettings,
        isMuted,
        setIsMuted,
        isFlipMuted,
        setIsFlipMuted,
        flipTrigger,
        otherSetupSettings,
        onUpdateOtherSetup,

        activeLayout,
        showTOC,
        setShowTOC,
        showAddNotesPopup,
        setShowAddNotesPopup,
        showNotesViewer,
        setShowNotesViewer,
        showAddBookmarkPopup,
        setShowAddBookmarkPopup,
        showViewBookmarkPopup,
        setShowViewBookmarkPopup,
        showProfilePopup,
        setShowProfilePopup,
        showSoundPopup,
        setShowSoundPopup,
        showExportPopup,
        setShowExportPopup,
        showSharePopup,
        setShowSharePopup,
        setSearchQuery,
        handleQuickSearch,
        isAutoFlipping,
        setIsPlaying,
    } = props;

    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [showThumbnails, setShowThumbnails] = useState(false);
    const [localShowTOC, setLocalShowTOC] = useState(false);
    const [localShowProfile, setLocalShowProfile] = useState(false);
    const [showNotesOptions, setShowNotesOptions] = useState(false);
    const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);

    const isPhysicalMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const scrollRef = useRef(null);
    const bookRef = useRef(null);

    const spreads = useMemo(() => {
        const result = [];
        for (let i = 0; i < pages.length; i += 2) {
            if (i === 0) {
                result.push({
                    pages: [pages[0]],
                    indices: [0],
                    label: 'Page 01'
                });
            } else {
                const p1 = pages[i - 1];
                const p2 = pages[i];
                if (p1 && p2) {
                    result.push({
                        pages: [p1, p2],
                        indices: [i - 1, i],
                        label: `Page ${String(i).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
                    });
                } else if (p1) {
                    result.push({
                        pages: [p1],
                        indices: [i - 1],
                        label: `Page ${String(i).padStart(2, '0')}`
                    });
                }
            }
        }
        return result;
    }, [pages]);

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
                {localShowTOC && (
                    <TableOfContentsPopup
                        onClose={() => setLocalShowTOC(false)}
                        settings={settings?.tocSettings}
                        activeLayout={8}
                        isMobile={true}
                        onNavigate={(pageIndex) => {
                            onPageClick(pageIndex);
                            setLocalShowTOC(false);
                        }}
                    />
                )}
            </AnimatePresence>

            
            
            
            

            <Sound
                isOpen={showSoundPopup}
                onClose={() => setShowSoundPopup(false)}
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
        <div className="flex flex-col h-full w-full overflow-hidden select-none relative" style={{ backgroundColor: getLayoutColor('page-bg', '#BDC3D9') }}>
            {renderPopups()}

            {/* Background Overlay */}
            <div className="absolute inset-0 z-0" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', 1), opacity: 0.15 }} />

            {/* Notch Spacer */}
            {!isPhysicalMobile && <div className="absolute top-0 left-0 right-0 h-10 z-[60] bg-[#0B0F4E] pointer-events-none" />}

            {/* Header (Floating) */}
            <header className={`absolute ${!isPhysicalMobile ? 'top-12' : 'top-4'} left-4 right-4 z-50 flex items-center justify-center pointer-events-none`}>
                <div className="flex w-full items-center justify-between absolute left-0 right-0 top-0">
                    <span className="text-[15px] font-bold truncate flex-1 pointer-events-auto shadow-sm" style={{ color: getLayoutColor('toolbar-text', '#333333') }}></span>
                    <div className="flex items-center pointer-events-auto shadow-sm">
                        {(settings?.brandingProfile?.logo !== false) && logoSettings?.src && (
                            <img
                                src={logoSettings.src}
                                alt="Logo"
                                className="h-5 w-auto mix-blend-screen"
                                style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                            />
                        )}
                    </div>
                </div>

                <div className="w-full max-w-[80%] mt-8 pointer-events-auto">
                    {/* Search Bar */}
                    <div className="rounded-full px-4 py-2 flex items-center gap-3 shadow-lg relative border border-white/20 backdrop-blur-md" style={{ backgroundColor: getLayoutColorRgba('toolbar-search-bg', '255, 255, 255', 0.9) }}>
                        <Icon icon="lucide:search" className="w-5 h-5" style={{ color: getLayoutColor('toolbar-search-icon', '#9ca3af') }} />
                        <input
                            type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                            placeholder="Quick Search..."
                            className="bg-transparent text-[13px] outline-none w-full font-medium"
                            style={{ color: getLayoutColor('toolbar-search-text', '#374151') }}
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
                        />
                        <AnimatePresence>
                            {showSuggestions && recommendations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 z-[100] overflow-hidden"
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
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative flex flex-col overflow-hidden pointer-events-auto">
                {/* Navigation Arrows */}
                <button
                    className="absolute left-[2%] top-1/2 -translate-y-1/2 z-20 active:scale-90 transition-transform"
                    style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                    onClick={() => onPageClick(Math.max(0, currentPage - 1))}
                >
                    <Icon icon="ph:caret-left-light" className="w-10 h-10 opacity-60" strokeWidth="4" />
                </button>
                <button
                    className="absolute right-[2%] top-1/2 -translate-y-1/2 z-20 active:scale-90 transition-transform"
                    style={{ color: getLayoutColor('toolbar-bg', '#575C9C') }}
                    onClick={() => onPageClick(Math.min(pages.length - 1, currentPage + 1))}
                >
                    <Icon icon="ph:caret-right-light" className="w-10 h-10 opacity-60" strokeWidth="4" />
                </button>

                {/* Flipbook Area */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-transparent pt-10 pb-20">
                    <div className="relative shadow-2xl">
                        <div className="transition-transform duration-300" style={{ transformOrigin: 'center center' }}>
                            {children}
                        </div>
                    </div>
                </div>

            </main>

            {/* Footer (Floating) */}
            <footer className="absolute bottom-6 left-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
                <div className="flex flex-col gap-3 shadow-2xl rounded-2xl p-4 backdrop-blur-xl border border-white/20 pointer-events-auto" style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', 0.95) }}>
                    {/* Icon Row */}
                    <div className="flex items-center justify-between px-1">
                        <button onClick={() => {
                            const willShow = !localShowTOC;
                            setLocalShowTOC(willShow);
                            if (willShow) { setShowThumbnails(false); setLocalShowProfile(false); setShowSharePopup(false); setShowExportPopup(false); }
                        }} className="text-white/80 hover:text-white transition-colors active:scale-90">
                            <Icon icon="fluent:text-bullet-list-24-filled" className="w-6 h-6" />
                        </button>
                        <button onClick={() => {
                            const willShow = !showThumbnails;
                            setShowThumbnails(willShow);
                            if (willShow) { setLocalShowTOC(false); setLocalShowProfile(false); setShowSharePopup(false); setShowExportPopup(false); }
                        }} className="text-white/80 hover:text-white transition-colors active:scale-90">
                            <Icon icon="ph:squares-four-fill" className="w-6 h-6" />
                        </button>

                        <button onClick={() => {
                            if (props.setShowGalleryPopup) props.setShowGalleryPopup(true);
                            setLocalShowTOC(false); setShowThumbnails(false); setLocalShowProfile(false); setShowSharePopup(false); setShowExportPopup(false);
                        }} className="text-white/80 hover:text-white transition-colors active:scale-90">
                            <Icon icon="clarity:image-gallery-solid" className="w-6 h-6" />
                        </button>
                        <button onClick={() => {
                            setShowProfilePopup(true);
                            setLocalShowTOC(false); setShowThumbnails(false); setShowSharePopup(false); setShowExportPopup(false);
                        }} className="text-white/80 hover:text-white transition-colors active:scale-90">
                            <Icon icon="ph:user-fill" className="w-6 h-6" />
                        </button>
                        <button onClick={() => {
                            setShowSharePopup(true);
                            setLocalShowTOC(false); setShowThumbnails(false); setLocalShowProfile(false); setShowExportPopup(false);
                        }} className="text-white/80 hover:text-white transition-colors active:scale-90">
                            <Icon icon="mage:share-fill" className="w-6 h-6" />
                        </button>
                        <button onClick={() => {
                            setShowExportPopup(true);
                            setLocalShowTOC(false); setShowThumbnails(false); setLocalShowProfile(false); setShowSharePopup(false);
                        }} className="text-white/80 hover:text-white transition-colors active:scale-90">
                            <Icon icon="meteor-icons:download" className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Progress Row */}
                    <div className="px-1 mt-1">
                        <div className="relative w-full h-1.5 rounded-full overflow-hidden shadow-inner border border-white/10" style={{ backgroundColor: getLayoutColor('progress-bar-bg', 'rgba(255,255,255,0.2)') }}>
                            <div
                                className="absolute left-0 top-0 h-full transition-all duration-300 rounded-full"
                                style={{ width: `${((currentPage + 1) / pages?.length || 1) * 100}%`, backgroundColor: getLayoutColor('progress-bar-fill', '#FFFFFF') }}
                            />
                        </div>
                    </div>

                    {/* Control Row */}
                    <div className="flex items-center justify-between px-1 mt-1">
                        {(settings?.media?.backgroundAudio ?? true) && (
                            <button onClick={() => {
                                const willShow = !showSoundPopup;
                                setShowSoundPopup(willShow);
                                if (willShow) { setLocalShowTOC(false); setShowThumbnails(false); setLocalShowProfile(false); setShowSharePopup(false); setShowExportPopup(false); }
                            }} className="text-white/80 hover:text-white transition-colors active:scale-90">
                                <Icon icon="solar:music-notes-bold" className="w-7 h-7" />
                            </button>
                        )}

                        <div className="flex items-center gap-8">
                            <button onClick={() => onPageClick(0)} className="hover:scale-110 active:scale-95 transition-all" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                <Icon icon="fluent:previous-24-filled" className="w-6 h-6" />
                            </button>
                            <button 
                                onClick={() => setIsPlaying(!isAutoFlipping)}
                                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                                style={{ backgroundColor: getLayoutColor('play-button-bg', '#FFFFFF'), color: getLayoutColor('play-button-icon', '#575C9C') }}
                            >
                                <Icon icon={isAutoFlipping ? "fluent:pause-24-filled" : "fluent:play-24-filled"} className="w-6 h-6" />
                            </button>
                            <button onClick={() => onPageClick(pages.length - 1)} className="hover:scale-110 active:scale-95 transition-all" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                                <Icon icon="fluent:next-24-filled" className="w-6 h-6" />
                            </button>
                        </div>

                        <button className="text-white/80 hover:text-white transition-colors active:scale-90">
                            <Icon icon="lucide:scan" className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </footer>

            {/* Thumbnail Sidebar */}
            <AnimatePresence>
                {(settings?.navigation?.pageThumbnails ?? true) && showThumbnails && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-3 right-3 bottom-[188px] z-[170] flex flex-col shadow-2xl rounded-t-xl overflow-hidden bg-white border border-gray-200/50 border-b-0 max-h-[350px]"
                    >
                        <div
                            className="flex items-center justify-between px-4 py-2.5 shrink-0 relative"
                            style={{ backgroundColor: getLayoutColorRgba('toolbar-bg', '87, 92, 156', 1) }}
                        >
                            <span className="text-[12px] font-bold text-white tracking-wide">Thumbnails</span>
                            {/* Drag handle line in center */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-white/50 rounded-full" />

                            <button onClick={() => setShowThumbnails(false)} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                                <Icon icon="lucide:x" className="w-4 h-4 text-white" />
                            </button>
                        </div>
                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 bg-white">
                            <div className="grid grid-cols-4 gap-3">
                                {spreads.map((spread, idx) => {
                                    const isSelected = spread.indices.includes(currentPage);
                                    return (
                                        <div
                                            key={idx}
                                            className={`bg-white rounded-md flex flex-col cursor-pointer transition-all p-1 border ${isSelected ? 'border-[#575C9C] shadow-sm bg-[#575C9C]/5' : 'border-gray-100 hover:border-gray-200'}`}
                                            onClick={() => { onPageClick(spread.indices[0]); setShowThumbnails(false); }}
                                        >
                                            <div className="aspect-[1.4/1] rounded-[3px] overflow-hidden bg-gray-50 flex gap-[1px]">
                                                {spread.pages.map((page, pIdx) => (
                                                    <div key={pIdx} className="flex-1 h-full relative">
                                                        <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={0.1} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-center mt-1.5">
                                                <span className="text-[8px] font-bold text-[#575C9C]">
                                                    {spread.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileLayout7;
