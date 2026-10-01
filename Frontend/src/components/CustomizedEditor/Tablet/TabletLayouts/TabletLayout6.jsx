import React, { useRef, useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import ShareModal from '../../../ShareModal';
import TabletTableOfContentsPopup from './TabletTableOfContentsPopup';

const PageThumbnail = React.memo(({ html, index, scale = 0.15 }) => {
    if (!html) return <div className="w-full h-full bg-white flex items-center justify-center text-gray-300">Empty</div>;
    
    let processedHtml = html;
    processedHtml = processedHtml.replace(/<img\b([^>]*src=['"]https:\/\/codia-f2c\.s3\.us-west-1\.amazonaws\.com\/[^'"]*['"])([^>]*)>/gi, '<img $1 crossOrigin="anonymous" $2>');

    const srcDoc = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { margin: 0; padding: 0; overflow: hidden; background: white; width: 400px; height: 566px; position: relative; }
                    * { box-sizing: border-box; }
                    img { max-width: 100%; object-fit: contain; }
                </style>
            </head>
            <body>
                <div style="transform: scale(${scale}); transform-origin: top left; width: ${100 / scale}%; height: ${100 / scale}%;">
                    ${processedHtml}
                </div>
            </body>
        </html>
    `;

    return (
        <iframe
            srcDoc={srcDoc}
            title={`Thumbnail ${index + 1}`}
            className="w-full h-full border-none select-none pointer-events-none bg-white"
            scrolling="no"
            sandbox="allow-same-origin"
        />
    );
});

const TabletLayout6 = ({ 
    children, 
    bookRef, 
    currentPage = 0, 
    pages, 
    offset = 0, 
    bookName,
    onPageClick,
    zoom = 1,
    currentBook,
    activeLayout,
    settings,
    showTOC,
    setShowTOCMemo,
    showThumbnailBar,
    setShowThumbnailBarMemo,
    showSoundPopup,
    setShowSoundPopupMemo,
    showProfilePopup,
    setShowProfilePopup
}) => {
    const [isShareOpen, setIsShareOpen] = useState(false);
    const progressRef = useRef(null);

    const spreads = useMemo(() => {
        if (!pages || !pages.length) return [];
        const result = [];
        result.push({ pages: [pages[0]], indices: [0] });
        for (let i = 1; i < pages.length; i += 2) {
            const spreadPages = [pages[i]];
            const indices = [i];
            if (i + 1 < pages.length) {
                spreadPages.push(pages[i + 1]);
                indices.push(i + 1);
            }
            result.push({ pages: spreadPages, indices });
        }
        return result;
    }, [pages]);
    
    const pagesCount = pages ? (Array.isArray(pages) ? pages.length : pages) : 12;
    let progressPercentage = 0;
    if (pagesCount > 1) {
        if (currentPage >= pagesCount - 1) {
            progressPercentage = 100;
        } else {
            progressPercentage = (currentPage / (pagesCount - 1)) * 100;
        }
    }

    const handleProgressClick = (e) => {
        if (!progressRef.current || pagesCount <= 1) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const targetIdx = Math.round(percentage * (pagesCount - 1));
        if (onPageClick) onPageClick(targetIdx);
    };

    return (
        <div className="relative w-full h-full flex flex-col font-sans overflow-hidden " style={{ containerType: 'inline-size' }}>
      <div id="tablet-download-portal" className="absolute inset-0 z-[60] pointer-events-none"></div>
            
            {/* Thumbnails Popup */}
            {showThumbnailBar && (
                <div className="absolute left-[6.8cqw] bottom-[7.5%] top-[10cqw] w-[26cqw] bg-[#F5F6F8] rounded-t-[1.5cqw] shadow-[-4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-[100]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-[2cqw] pb-[1cqw]">
                        <h2 className="text-[1.8cqw] font-bold text-[#575C9C]">
                            Thumbnails
                        </h2>
                        <button onClick={() => setShowThumbnailBarMemo?.(false)} className="text-[#575C9C] hover:opacity-70 transition-colors">
                            <Icon icon="lucide:x" className="w-[2cqw] h-[2cqw]" />
                        </button>
                    </div>
                    
                    <div className="h-[1px] w-full bg-[#575C9C]/10 mb-[1.5cqw]"></div>

                    {/* Thumbnail Items List */}
                    <div className="flex-1 overflow-y-auto px-[1.5cqw] pb-[2cqw] flex flex-col items-center gap-[2cqw]" style={{ scrollbarWidth: 'none' }}>
                        {spreads.map((spread, idx) => {
                            const isSelected = spread.indices.includes(currentPage);
                            
                            return (
                                <div 
                                    key={idx} 
                                    className="flex flex-col items-center cursor-pointer group w-[22cqw]"
                                    onClick={() => {
                                        if (bookRef?.current?.pageFlip) {
                                            bookRef.current.pageFlip().turnToPage(spread.indices[0]);
                                        } else if (onPageClick) {
                                            onPageClick(spread.indices[0]);
                                        }
                                        setShowThumbnailBarMemo?.(false);
                                    }}
                                >
                                    <div className={`p-[0.5cqw] rounded-[0.8cqw] bg-white transition-colors shadow-sm w-full ${isSelected ? 'border-[2px] border-[#575C9C]' : 'border-[2px] border-transparent hover:shadow-md'}`}>
                                        <div className="w-full aspect-[4/3] flex bg-white border border-[#E5E7EB] rounded-[0.4cqw] overflow-hidden">
                                            {spread.pages.map((page, pIdx) => (
                                                <div key={pIdx} className="flex-1 relative border-r border-[#E5E7EB] last:border-r-0 h-full flex items-center justify-center">
                                                    <PageThumbnail
                                                        html={page.html || page.content}
                                                        index={spread.indices[pIdx]}
                                                        scale={0.12}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-[1.2cqw] text-[#575C9C] font-bold mt-[1cqw] px-[1.5cqw] py-[0.5cqw] bg-white rounded-full shadow-sm">
                                        Page {spread.indices.length === 1 ? spread.indices[0] + 1 : `${spread.indices[0] + 1}-${spread.indices[1] + 1}`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TOC Popup */}
            {showTOC && (
                <TabletTableOfContentsPopup 
                    onClose={() => setShowTOCMemo?.(false)} 
                    onNavigate={onPageClick} 
                    settings={settings} 
                    variant="layout6" 
                />
            )}
            
            {/* Top Bar - Floating/Transparent */}
            <div className="absolute top-[2cqw] left-[2cqw] right-[2cqw] flex items-center justify-between z-20 pointer-events-none">
                {/* Search Bar */}
                <div className="pointer-events-auto flex items-center /40 border border-[#CBD5E1] rounded-[0.5cqw] px-[1cqw] py-[0.6cqw] w-[20cqw] backdrop-blur-sm shadow-sm">
                    <Icon icon="lucide:search" className="text-[#8492A6] w-[1.5cqw] h-[1.5cqw]" />
                    <input type="text" placeholder="Quick Search..." className="bg-transparent outline-none border-none text-[1.2cqw] ml-[0.5cqw] text-gray-700 w-full placeholder-[#8492A6]" />
                </div>
                {/* Title */}
                <div className="text-white font-bold text-[1.8cqw] tracking-wide filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                    {/* bookName hidden */}
                </div>
                {/* Spacer to keep title centered */}
                <div className="w-[20cqw]"></div>
            </div>

            {/* Middle Content Area */}
            <div className="flex-1 min-h-0 w-full relative flex items-center justify-center overflow-hidden pt-[6cqw]">
                {/* Left Chevron */}
                <button 
                    onClick={() => bookRef?.current?.pageFlip()?.flipPrev()}
                    className="absolute left-[3cqw] z-10 p-[1cqw] text-[#A3A1C6] hover:text-[#5C5898] transition-colors"
                >
                    <Icon icon="lucide:chevron-left" className="w-[3cqw] h-[4cqw]" />
                </button>

                {/* Flipbook Container */}
                <div className="relative z-0 shadow-[0_15px_30px_rgba(0,0,0,0.15)] flex items-center justify-center transition-transform duration-500" style={{ transform: `translateX(${offset}px) scale(${zoom})` }}>
                    {children}
                </div>

                {/* Right Chevron */}
                <button 
                    onClick={() => bookRef?.current?.pageFlip()?.flipNext()}
                    className="absolute right-[8cqw] z-10 p-[1cqw] text-[#A3A1C6] hover:text-[#5C5898] transition-colors"
                >
                    <Icon icon="lucide:chevron-right" className="w-[3cqw] h-[4cqw]" />
                </button>

                {/* Left Vertical Toolbar */}
                <div className="absolute left-[1.5cqw] top-1/2 -translate-y-1/2 bg-[#5C5898] rounded-[1.2cqw] flex flex-col items-center py-[1.8cqw] gap-[1.8cqw] z-20 shadow-lg px-[1.2cqw]">
                    <button onClick={() => { setShowTOCMemo?.(!showTOC); setShowThumbnailBarMemo?.(false); setShowSoundPopupMemo?.(false); }} className={`text-white hover:text-gray-300 active:scale-95 transition-transform ${showTOC ? 'text-gray-300 opacity-70' : ''}`}><Icon icon="fluent:text-bullet-list-24-filled" className="w-[2.4cqw] h-[2.4cqw]" /></button>
                    <button onClick={() => { setShowThumbnailBarMemo?.(!showThumbnailBar); setShowTOCMemo?.(false); setShowSoundPopupMemo?.(false); }} className={`text-white hover:text-gray-300 active:scale-95 transition-transform ${showThumbnailBar ? 'text-gray-300 opacity-70' : ''}`}><Icon icon="ph:squares-four-fill" className="w-[2.4cqw] h-[2.4cqw]" /></button>
                    <button className="text-white hover:text-gray-300 active:scale-95 transition-transform"><Icon icon="clarity:image-gallery-solid" className="w-[2.4cqw] h-[2.4cqw]" /></button>
                    {(settings?.media?.backgroundAudio ?? true) && (
                        <button onClick={() => { setShowSoundPopupMemo?.(!showSoundPopup); setShowTOCMemo?.(false); setShowThumbnailBarMemo?.(false); }} className={`text-white hover:text-gray-300 active:scale-95 transition-transform ${showSoundPopup ? 'text-gray-300 opacity-70' : ''}`}><Icon icon="solar:music-notes-bold" className="w-[2.4cqw] h-[2.4cqw]" /></button>
                    )}
                    <button onClick={() => {
                        setShowProfilePopup(true);
                        setShowTOCMemo?.(false);
                        setShowThumbnailBarMemo?.(false);
                        setShowSoundPopupMemo?.(false);
                    }} className="text-white hover:text-gray-300 active:scale-95 transition-transform">
                        <Icon icon="fluent:person-24-filled" className="w-[2.4cqw] h-[2.4cqw]" />
                    </button>
                    <button className="text-white hover:text-gray-300 active:scale-95 transition-transform" onClick={() => setIsShareOpen(true)}><Icon icon="mage:share-fill" className="w-[2.4cqw] h-[2.4cqw]" /></button>
                    <button className="text-white hover:text-gray-300 active:scale-95 transition-transform"><Icon icon="meteor-icons:download" className="w-[2.4cqw] h-[2.4cqw]" /></button>
                    <button className="text-white hover:text-gray-300 active:scale-95 transition-transform"><Icon icon="lucide:fullscreen" className="w-[2.4cqw] h-[2.4cqw]" /></button>
                </div>

                {/* Bottom Right Badge */}
                <div className="absolute right-[2cqw] bottom-[2cqw] bg-white rounded-[0.4cqw] px-[1cqw] py-[0.5cqw] shadow-md z-20">
                    <span className="text-[#5C5898] font-bold text-[1cqw] tabular-nums">Page {currentPage + 1} / {pagesCount}</span>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="w-full h-[7.5%] bg-[#5C5898] flex items-center justify-between px-[2cqw] flex-shrink-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
                {/* Playback Controls */}
                <div className="flex items-center gap-[1.5cqw]">
                    <button onClick={() => onPageClick && onPageClick(0)} className="text-white/80 hover:text-white active:scale-95 transition-all"><Icon icon="ph:skip-back" className="w-[1.4cqw] h-[1.4cqw]" /></button>
                    <button className="text-white hover:text-gray-200 active:scale-95 transition-all"><Icon icon="ph:play-fill" className="w-[1.6cqw] h-[1.6cqw]" /></button>
                    <button onClick={() => onPageClick && onPageClick(pagesCount - 1)} className="text-white/80 hover:text-white active:scale-95 transition-all"><Icon icon="ph:skip-forward" className="w-[1.4cqw] h-[1.4cqw]" /></button>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 mx-[4cqw] relative flex items-center cursor-pointer h-[2cqw] group" ref={progressRef} onClick={handleProgressClick}>
                    <div className="w-full h-[0.2cqw] bg-white/30 rounded-full overflow-hidden relative">
                        <div className="absolute left-0 top-0 h-full bg-white transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center bg-[#494582] rounded-[0.4cqw] border border-white/40 pl-[0.8cqw] pr-[0.4cqw] py-[0.4cqw] gap-[0.8cqw]">
                    <button className="text-white/80 hover:text-white"><Icon icon="ph:magnifying-glass-minus" className="w-[1.2cqw] h-[1.2cqw]" /></button>
                    <span className="text-white font-bold text-[1cqw]">100%</span>
                    <button className="text-white/80 hover:text-white"><Icon icon="ph:magnifying-glass-plus" className="w-[1.2cqw] h-[1.2cqw]" /></button>
                    <button className="bg-white text-[#5C5898] font-bold text-[0.9cqw] px-[0.8cqw] py-[0.3cqw] rounded-[0.2cqw] ml-[0.3cqw] hover:bg-gray-100 transition-colors">Reset</button>
                </div>
            </div>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                isTabletLayout={true}
                currentBook={currentBook || settings}
                activeLayout={activeLayout || '7'}
            />
        </div>
    );
};

export default TabletLayout6;
