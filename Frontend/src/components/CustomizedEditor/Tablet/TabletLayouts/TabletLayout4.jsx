import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import TabletTableOfContentsPopup from './TabletTableOfContentsPopup';
import TabletProfilePopup from './TabletProfilePopup';
import ShareModal from '../../../ShareModal';

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
                    body { 
                        margin: 0; 
                        padding: 0; 
                        overflow: hidden; 
                        background: white; 
                        width: 400px; 
                        height: 566px; 
                        position: relative;
                    }
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

const hexToRgb = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '255, 255, 255';
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `${r}, ${g}, ${b}`;
};

const getLayoutColor = (id, defaultColor) =>
    `rgba(var(--${id}-rgb, ${hexToRgb(defaultColor)}), var(--${id}-opacity, 1))`;

const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
};

const SidebarButton = ({ icon, label, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className="flex flex-col items-center justify-center p-[0.5cqw] rounded-[0.5cqw] transition-colors hover:opacity-80 group relative w-full"
            title={label}
        >
            <Icon icon={icon} className="w-[2cqw] h-[2cqw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }} />
        </button>
    );
};

const TabletLayout4 = ({
    children,
    settings,
    bookName,
    searchQuery,
    setSearchQuery,
    handleQuickSearch,
    setShowThumbnailBarMemo,
    setShowTOCMemo,
    setShowProfilePopup,
    showProfilePopup,
    logoSettings,
    currentPage,
    pagesCount,
    pages,
    bookRef,
    showThumbnailBar,
    currentZoom,
    setCurrentZoom,
    onPageClick,
    handleDownload,
    handleFullScreen,
    isFullscreen,
    isMuted,
    showSoundPopup,
    setShowSoundPopupMemo,
    profileSettings,
    setShowGalleryPopupMemo,
    showGalleryPopup,
    showTOC,
    backgroundStyle,
    showExportPopup,
    setShowExportPopupMemo,
    offset = 0,
    currentBook,
    activeLayout
}) => {
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
    const [isShareOpen, setIsShareOpen] = useState(false);

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

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            setSearchQuery(localSearchQuery);
            handleQuickSearch(localSearchQuery);
        }
    };

    const handleContactClick = (e, contact) => {
        e.stopPropagation();
        const value = contact.value?.trim();
        if (!value) return;

        const isEmail = contact.type === 'email' || value.includes('@');
        const isPhone = contact.type === 'phone' || /^[+\d\s-]+$/.test(value);

        if (isEmail) {
            if (value.startsWith('mailto:')) {
                window.location.href = value;
            } else {
                window.location.href = `mailto:${value}`;
            }
        }
        else if (isPhone) {
            window.location.href = `tel:${value}`;
        }
        else {
            const url = value.startsWith('http') ? value : `https://${value}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="flex flex-col w-full h-full min-h-0 overflow-hidden font-sans relative" style={{ ...backgroundStyle, backgroundColor: 'transparent', containerType: 'size' }}>
            
            {/* Top Navigation Bar */}
            <div 
                className="flex items-center justify-between px-[2cqw] py-[0.5cqh] shrink-0 w-full z-50 shadow-md h-[7cqh]" 
                style={{ backgroundColor: getLayoutColor('toolbar-bg', '#555555') }}
            >
                <div className="flex items-center w-[25cqw]">
                    {settings?.brandingProfile?.logo && logoSettings?.src && (
                        <img
                            src={logoSettings.src}
                            alt="Logo"
                            className="h-[3.5cqh] w-auto object-contain"
                            style={{ opacity: (logoSettings.opacity ?? 100) / 100 }}
                        />
                    )}
                </div>

                <div className="flex-1 text-center truncate px-[2cqw]">
                    <span className="text-[2cqw] font-medium truncate" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                        {/* bookName hidden */}
                    </span>
                </div>

                <div className="flex items-center justify-end w-[20cqw]">
                    {(settings?.interaction?.search ?? true) && (
                        <div className="flex items-center px-[1cqw] py-[0.4cqh] rounded-[0.5cqw] shadow-inner w-full" style={{ backgroundColor: getLayoutColor('search-bg-v2', '#E0E3F5') }}>
                            <Icon icon="lucide:search" className="w-[1.6cqw] h-[1.6cqw]" style={{ color: getLayoutColor('search-text-v1', '#555555') }} />
                            <input
                                type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
                                value={localSearchQuery}
                                onChange={(e) => setLocalSearchQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Quick Search..."
                                className="bg-transparent border-0 outline-none ml-[0.8cqw] w-full text-[1.5cqw] font-medium"
                                style={{ color: getLayoutColor('search-text-v1', '#555555') }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-row min-h-0 relative overflow-hidden">
                
                {/* Left Sidebar */}
                <div 
                    className="w-[6cqw] flex flex-col items-center pt-[4cqh] pb-[2cqh] gap-[4cqh] shrink-0 shadow-lg z-40"
                    style={{ backgroundColor: getLayoutColor('toolbar-bg', '#555555') }}
                >
                    {(settings?.navigation?.tableOfContents ?? true) && (
                        <SidebarButton 
                            icon="fluent:text-bullet-list-24-filled" 
                            label="Table of Contents" 
                            onClick={() => setShowTOCMemo(!showTOC)} 
                        />
                    )}
                    
                    {(settings?.navigation?.pageThumbnails ?? true) && (
                        <SidebarButton 
                            icon="ph:squares-four-fill" 
                            label="Thumbnails" 
                            onClick={() => setShowThumbnailBarMemo(true)} 
                        />
                    )}
                    
                    {(settings?.interaction?.gallery ?? true) && (
                        <SidebarButton 
                            icon="clarity:image-gallery-solid" 
                            label="Gallery" 
                            onClick={() => setShowGalleryPopupMemo(true)} 
                        />
                    )}
                    
                    {(settings?.media?.backgroundAudio ?? true) && (
                        <SidebarButton 
                            icon={isMuted ? "solar:music-notes-bold-duotone" : "solar:music-notes-bold"} 
                            label="Sound" 
                            onClick={(e) => { e.stopPropagation(); setShowSoundPopupMemo?.(!showSoundPopup); }} 
                        />
                    )}
                    
                    {(settings?.brandingProfile?.profile ?? true) && (
                        <SidebarButton 
                            icon="fluent:person-24-filled" 
                            label="Profile" 
                            onClick={() => setShowProfilePopup(!showProfilePopup)} 
                        />
                    )}
                    
                    {(settings?.shareExport?.share ?? true) && (
                        <SidebarButton 
                            icon="mage:share-fill" 
                            label="Share" 
                            onClick={() => {
                                setShowTOCMemo?.(false);
                                setShowThumbnailBarMemo?.(false);
                                setShowGalleryPopupMemo?.(false);
                                setShowSoundPopupMemo?.(false);
                                setShowProfilePopup?.(false);
                                setShowExportPopupMemo?.(false);
                                setIsShareOpen(true);
                            }} 
                        />
                    )}
                    
                    {(settings?.shareExport?.download ?? true) && (
                        <SidebarButton 
                            icon="meteor-icons:download" 
                            label="Download" 
                            onClick={() => setShowExportPopupMemo?.(true)} 
                        />
                    )}
                    
                    {(settings?.viewing?.fullScreen ?? true) && (
                        <SidebarButton 
                            icon={isFullscreen ? "mingcute:fullscreen-exit-fill" : "lucide:fullscreen"} 
                            label="Fullscreen" 
                            onClick={handleFullScreen} 
                        />
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex items-center justify-center relative p-[4cqw]">
                    {showTOC && (
                        <TabletTableOfContentsPopup
                            onClose={() => setShowTOCMemo(false)}
                            onNavigate={onPageClick}
                            settings={settings}
                            variant="layout4"
                        />
                    )}
                    
                    {/* Thumbnail Popup Drawer */}
                    {showThumbnailBar && (
                        <div 
                            className="absolute left-0 top-0 bottom-0 w-[25cqw] shadow-[4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-40"
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-[2cqw] pb-[1cqw]">
                                <h2 className="text-[1.8cqw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Thumbnail</h2>
                                <button onClick={() => setShowThumbnailBarMemo(false)} className="transition-colors hover:opacity-70" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>
                                    <Icon icon="lucide:x" className="w-[2cqw] h-[2cqw]" />
                                </button>
                            </div>
                            <div className="h-[1px] w-full mb-[1cqw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555'), opacity: 0.1 }}></div>

                            <div className="flex-1 overflow-y-auto px-[2cqw] pb-[2cqw]" style={{ scrollbarWidth: 'thin', scrollbarColor: 'darkgray transparent' }}>
                                <div className="flex flex-col gap-[2cqw]">
                                    {spreads.map((spread, idx) => {
                                        const isActive = spread.indices.includes(currentPage - 1);
                                        return (
                                            <div 
                                                key={idx}
                                                className={`flex flex-col items-center cursor-pointer transition-transform hover:scale-105`}
                                                onClick={() => {
                                                    setShowThumbnailBarMemo(false);
                                                    if (bookRef?.current?.pageFlip) {
                                                        bookRef.current.pageFlip().turnToPage(spread.indices[0]);
                                                    } else if (onPageClick) {
                                                        onPageClick(spread.indices[0]);
                                                    }
                                                }}
                                            >
                                                <div className={`relative overflow-hidden w-[20cqw] h-[14cqw] border ${isActive ? 'shadow-lg' : 'shadow-md'}`} style={{ backgroundColor: getLayoutColor('thumbnail-outer-v2', '#FFFFFF'), borderColor: isActive ? getLayoutColor('dropdown-text', '#555555') : 'rgba(0,0,0,0.1)' }}>
                                                    <div className="flex w-full h-full gap-[1px] justify-center" style={{ backgroundColor: getLayoutColor('thumbnail-inner-v2', '#F3F4F6') }}>
                                                        {spread.pages.map((page, pIdx) => (
                                                            <div key={pIdx} className="flex-1 max-w-[50%] h-full relative border-r last:border-r-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: getLayoutColor('thumbnail-outer-v2', '#FFFFFF'), borderColor: getLayoutColorAlpha('dropdown-text', '85,85,85', 0.1) }}>
                                                                <PageThumbnail html={page.html || page.content} index={spread.indices[pIdx]} scale={0.14} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className={`mt-[1cqw] text-[1.4cqw] ${isActive ? 'font-bold' : 'font-medium'}`} style={{ color: getLayoutColor('dropdown-text', '#555555') }}>
                                                    {spread.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profile Popup Drawer */}
                    {showProfilePopup && (
                        <TabletProfilePopup 
                            activeLayout={4}
                            profileSettings={profileSettings}
                            layoutColors={settings?.layoutColors}
                            handleContactClick={handleContactClick}
                            fallbackText="#555555"
                            onClose={() => setShowProfilePopup(false)}
                        />
                    )}

                    {/* The Page Preview Area (Simplified for Layout) */}
                    <button 
                        onClick={() => bookRef?.current?.pageFlip()?.flipPrev()}
                        className={`absolute left-[4cqw] w-[4cqw] h-[4cqw] rounded-full flex items-center justify-center transition-all z-10 shadow-lg ${currentPage === 0 ? 'opacity-40 cursor-not-allowed' : 'opacity-100 hover:scale-105 cursor-pointer'}`}
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', '#555555') }}
                        disabled={currentPage === 0}
                    >
                        <Icon icon="mdi:chevron-left" className="w-[2.5cqw] h-[2.5cqw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }} />
                    </button>
                    
                    {/* The Actual Book Content */}
                    <div 
                        className="w-full h-full flex items-center justify-center max-w-[80cqw] mx-auto z-0"
                        style={{ transform: `translateX(${offset}px)`, transition: 'transform 0.5s ease-out' }}
                    >
                         {children}
                    </div>

                    {/* Right Navigation Arrow */}
                    <button 
                        onClick={() => bookRef?.current?.pageFlip()?.flipNext()}
                        className={`absolute right-[4cqw] w-[4cqw] h-[4cqw] rounded-full flex items-center justify-center transition-all z-10 shadow-lg ${currentPage >= pagesCount - 1 ? 'opacity-40 cursor-not-allowed' : 'opacity-100 hover:scale-105 cursor-pointer'}`}
                        style={{ backgroundColor: getLayoutColor('toolbar-bg', '#555555') }}
                        disabled={currentPage >= pagesCount - 1}
                    >
                        <Icon icon="mdi:chevron-right" className="w-[2.5cqw] h-[2.5cqw]" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }} />
                    </button>
                </div>
            </div>

            {/* Bottom Toolbar */}
            <div 
                className="flex items-center justify-between px-[2cqw] py-[0.5cqh] shrink-0 w-full z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] h-[7cqh]"
                style={{ backgroundColor: getLayoutColor('toolbar-bg', '#555555') }}
            >
                <div className="flex items-center gap-[2cqw] w-[15cqw] ml-[4cqw]">
                    <button onClick={() => onPageClick(0)} className="transition-colors hover:opacity-80" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                        <Icon icon="mdi:skip-previous-outline" className="w-[3cqw] h-[3cqw]" />
                    </button>
                    <button className="transition-colors hover:opacity-80" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                        <Icon icon="mdi:play" className="w-[3cqw] h-[3cqw]" />
                    </button>
                    <button onClick={() => onPageClick(pagesCount - 1)} className="transition-colors hover:opacity-80" style={{ color: getLayoutColor('toolbar-icon', '#FFFFFF') }}>
                        <Icon icon="mdi:skip-next-outline" className="w-[3cqw] h-[3cqw]" />
                    </button>
                </div>
                
                <div className="flex-1 flex items-center justify-start ml-[2cqw]">
                    <div className="w-full max-w-[50cqw] h-[2px] relative rounded-full" style={{ backgroundColor: getLayoutColorAlpha('toolbar-icon', '255,255,255', 0.3) }}>
                        <div 
                            className="absolute left-0 top-0 h-full rounded-full" 
                            style={{ width: `${pagesCount > 1 ? (currentPage / (pagesCount - 1)) * 100 : 0}%`, backgroundColor: getLayoutColor('toolbar-icon', '#FFFFFF') }}
                        ></div>
                    </div>
                </div>

                <div className="flex items-center justify-end w-[25cqw]">
                    <div className="flex items-center rounded-[0.8cqw] overflow-hidden" style={{ backgroundColor: getLayoutColor('reset-bg', '#E5E7EB'), color: getLayoutColor('reset-text', '#555555') }}>
                        <button 
                            onClick={() => setCurrentZoom?.(Math.max(0.5, (currentZoom || 1) - 0.1))} 
                            className="p-[0.5cqw] transition-colors hover:opacity-80"
                        >
                            <Icon icon="lucide:zoom-out" className="w-[2cqw] h-[2cqw]" />
                        </button>
                        <span className="text-[1.8cqw] font-medium px-[1cqw]">
                            {Math.round((currentZoom || 1) * 100)}%
                        </span>
                        <button 
                            onClick={() => setCurrentZoom?.(Math.min(3, (currentZoom || 1) + 0.1))}
                            className="p-[0.5cqw] transition-colors hover:opacity-80"
                        >
                            <Icon icon="lucide:zoom-in" className="w-[2cqw] h-[2cqw]" />
                        </button>
                        <button 
                            onClick={() => setCurrentZoom?.(1)}
                            className="px-[1cqw] py-[0.5cqh] text-[1.6cqw] transition-colors font-medium"
                            style={{ borderLeft: `1px solid ${getLayoutColorAlpha('reset-text', '85,85,85', 0.2)}` }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Page Number absolute positioned on canvas as shown in screenshot */}
            <div className="absolute left-[10cqw] bottom-[10cqh] z-20 pointer-events-none">
                <div className="px-[2cqw] py-[1cqh] rounded-[1cqw] text-[1.8cqw] font-semibold" style={{ backgroundColor: getLayoutColorAlpha('page-number-bg', '0,0,0', 0.1), color: getLayoutColor('page-number-text', '#555555'), backdropFilter: 'blur(8px)' }}>
                    Page {currentPage + 1} / {pagesCount}
                </div>
            </div>
            
            
            <div id="tablet-sound-portal" className="absolute inset-0 z-50 pointer-events-none"></div>
            <div id="tablet-download-portal" className="absolute inset-0 z-50 pointer-events-none"></div>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                isTabletLayout={true}
                currentBook={currentBook || settings}
                activeLayout={activeLayout || '4'}
            />
        </div>
    );
};

export default TabletLayout4;
