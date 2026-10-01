import React, { useRef } from 'react';
import { Icon } from '@iconify/react';

const BottomToolbar = ({
    settings,
    toolbarSettings,
    showBookmarkMenu,
    setShowBookmarkMenu,
    showMoreMenu,
    setShowMoreMenu,
    showThumbnailBar,
    setShowThumbnailBar,
    showTOC,
    setShowTOC,
    setShowAddNotesPopup,
    setShowNotesViewer,
    setShowAddBookmarkPopup,
    setShowProfilePopup,
    activePage,
    totalPages,
    isPlaying,
    setIsPlaying,
    onPageClick,
    zoomValue,
    onZoomIn,
    onZoomOut,
    maxZoom = 4,
    onFullScreen,
    onShare,
    onDownload
}) => {
    const progressRef = useRef(null);

    const handleProgressClick = (e) => {
        if (!progressRef.current || totalPages <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (totalPages - 1));
        onPageClick(targetIdx);
    };

    const progressPercentage = totalPages > 1 ? (activePage / (totalPages - 1)) * 100 : 0;

    const toolbarStyle = {
        backgroundColor: toolbarSettings?.toolbarColor?.fill || '#3E4491',
        borderTop: toolbarSettings?.toolbarColor?.stroke && toolbarSettings.toolbarColor.stroke !== '#' ? `1px solid ${toolbarSettings.toolbarColor.stroke}` : 'none',
        fontFamily: toolbarSettings?.textProperties?.font || 'Poppins'
    };

    const iconStyle = {
        color: toolbarSettings?.iconsColor?.fill || '#ffffff',
        filter: toolbarSettings?.iconsColor?.stroke && toolbarSettings.iconsColor.stroke !== '#' 
            ? `drop-shadow(1px 0 0 ${toolbarSettings.iconsColor.stroke}) drop-shadow(-1px 0 0 ${toolbarSettings.iconsColor.stroke}) drop-shadow(0 1px 0 ${toolbarSettings.iconsColor.stroke}) drop-shadow(0 -1px 0 ${toolbarSettings.iconsColor.stroke})` 
            : 'none'
    };

    const textStyle = {
        color: toolbarSettings?.textProperties?.fill || '#ffffff',
        fontFamily: toolbarSettings?.textProperties?.font || 'Poppins'
    };

    const progressStyle = {
        backgroundColor: toolbarSettings?.processBar?.fill || '#4C51F3',
        border: toolbarSettings?.processBar?.stroke && toolbarSettings.processBar.stroke !== '#' 
            ? `1px solid ${toolbarSettings.processBar.stroke}` 
            : 'none'
    };

    const isIconText = toolbarSettings?.addTextBelowIcons;

    const renderIconWithLabel = (icon, label, onClick, isActive = false) => (
        <button
            className={`flex flex-col items-center justify-center transition-all ${isActive ? 'scale-110' : 'hover:scale-110'}`}
            onClick={onClick}
            style={{ ...iconStyle, opacity: isActive ? 1 : 0.7 }}
        >
            <Icon icon={icon} className="w-[1.25vw] h-[1.25vw]" />
            {isIconText && (
                <span className="text-[0.6vw] font-medium mt-[0.1vw]" style={textStyle}>{label}</span>
            )}
        </button>
    );

    return (
        <div 
            className="h-[3.8vw] flex items-center justify-between px-[2vw] w-full z-10 shadow-[0_-0.5vw_2vw_rgba(0,0,0,0.2)]"
            style={toolbarStyle}
        >
            {/* Left Controls */}
            <div className="flex items-center gap-[1.5vw]">
                {settings.navigation.tableOfContents && 
                    renderIconWithLabel(
                        "ph:list-bullets-bold", 
                        "TOC", 
                        (e) => {
                            e.stopPropagation();
                            setShowTOC(!showTOC);
                            setShowThumbnailBar(false);
                            setShowBookmarkMenu(false);
                            setShowMoreMenu(false);
                        },
                        showTOC
                    )
                }
                {settings.navigation.pageThumbnails && 
                    renderIconWithLabel(
                        "ph:squares-four-fill", 
                        "Thumbnails", 
                        (e) => {
                            e.stopPropagation();
                            setShowThumbnailBar(!showThumbnailBar);
                            setShowTOC(false);
                            setShowBookmarkMenu(false);
                            setShowMoreMenu(false);
                        },
                        showThumbnailBar
                    )
                }
            </div>

            {/* Center - Playback & Progress */}
            <div className="flex-1 max-w-[35vw] flex items-center gap-[1.2vw] px-[2vw]">
                {settings.media.autoFlip && (
                    <div className="flex items-center gap-[0.6vw]">
                        
                        <button
                            className="hover:scale-110 transition-transform flex-shrink-0"
                            onClick={() => setIsPlaying(!isPlaying)}
                            style={iconStyle}
                        >
                            <Icon icon={isPlaying ? "ph:pause-fill" : "ph:play-fill"} className="w-[1.4vw] h-[1.4vw]" />
                        </button>
                        
                    </div>
                )}
                <div
                    ref={progressRef}
                    className="flex-1 h-[0.25vw] relative group cursor-pointer"
                    onClick={handleProgressClick}
                >
                    {/* Background Track */}
                    <div className="w-full h-full bg-white/20 rounded-full relative overflow-hidden">
                        {/* Active Progress Filling */}
                        <div
                            className="absolute top-0 left-0 h-full transition-all duration-300 ease-out"
                            style={{ ...progressStyle, width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Right - Tools & Zoom */}
            <div className="flex items-center gap-[1.8vw]">
                <div className="flex items-center gap-[1.2vw]">
                    {settings.interaction.notes && 
                        renderIconWithLabel(
                            "solar:notes-bold", 
                            "Notes", 
                            (e) => { e.stopPropagation(); setShowNotesViewer(true); }
                        )
                    }
                    {settings.navigation.bookmark && 
                        renderIconWithLabel(
                            "material-symbols:bookmark-rounded", 
                            "Bookmark", 
                            (e) => { 
                                e.stopPropagation(); 
                                setShowBookmarkMenu(!showBookmarkMenu); 
                                setShowMoreMenu(false); 
                                setShowTOC(false); 
                                setShowThumbnailBar(false); 
                            },
                            showBookmarkMenu
                        )
                    }
                    {(settings?.media?.backgroundAudio ?? true) && 
                        renderIconWithLabel(
                            "solar:music-notes-bold", 
                            "Music", 
                            () => {}
                        )
                    }
                    {renderIconWithLabel(
                        "ph:dots-three-bold", 
                        "More", 
                        (e) => { 
                            e.stopPropagation(); 
                            setShowMoreMenu(!showMoreMenu); 
                            setShowBookmarkMenu(false); 
                            setShowTOC(false); 
                            setShowThumbnailBar(false); 
                        },
                        showMoreMenu
                    )}
                </div>

                <div className="w-[1px] h-[1.5vw] bg-white/10" />

                {settings.viewing.zoom && (
                    <div className="flex items-center gap-[0.8vw]">
                        <button
                            className="transition-all transform hover:scale-110 opacity-70 hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); onZoomOut(); }}
                            style={iconStyle}
                        >
                            <Icon icon="ph:magnifying-glass-minus" className="w-[1.2vw] h-[1.2vw]" />
                        </button>
                        <div className="w-[6vw] h-[0.25vw] bg-white/20 rounded-full relative overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full transition-all duration-300"
                                style={{ ...progressStyle, width: `${((zoomValue - 0.5) / (maxZoom - 0.5)) * 100}%` }}
                            />
                        </div>
                        <button
                            className="transition-all transform hover:scale-110 opacity-70 hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); onZoomIn(); }}
                            style={iconStyle}
                        >
                            <Icon icon="ph:magnifying-glass-plus" className="w-[1.2vw] h-[1.2vw]" />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-[1.2vw] ml-[0.5vw]">
                    {settings.shareExport.share && 
                        renderIconWithLabel(
                            "ph:share-network", 
                            "Share", 
                            (e) => { e.stopPropagation(); onShare(); }
                        )
                    }
                    {settings.shareExport.download && 
                        renderIconWithLabel(
                            "ph:download-simple", 
                            "Download", 
                            (e) => { e.stopPropagation(); onDownload(); }
                        )
                    }
                    {settings.viewing.fullScreen && 
                        renderIconWithLabel(
                            "ph:corners-out", 
                            "Full Screen", 
                            (e) => { e.stopPropagation(); onFullScreen(); }
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default BottomToolbar;
