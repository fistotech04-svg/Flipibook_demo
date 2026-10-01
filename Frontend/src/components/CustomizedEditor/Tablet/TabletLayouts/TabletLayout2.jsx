import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

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
import TabletTableOfContentsPopup from './TabletTableOfContentsPopup';
import TabletLayoutSound from './TabletLayoutSound';
import ShareModal from '../../../ShareModal';

const TabletLayout2 = ({ children, bookRef, currentPage, pages, offset = 0, onPageClick, settings, bookName = "Name of the Book", showSoundPopup, setShowSoundPopupMemo, showProfilePopup, setShowProfilePopupMemo, handleDownload, currentBook, activeLayout, searchQuery, setSearchQuery, handleQuickSearch }) => {
  const [inputPage, setInputPage] = useState(currentPage === 0 ? 1 : (currentPage || 1));
  const [showTOC, setShowTOC] = useState(false);

  useEffect(() => {
      if (settings?.navigation?.tableOfContents === false) {
          setShowTOC(false);
      }
  }, [settings?.navigation?.tableOfContents]);

  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
  const [recommendations, setRecommendations] = useState([]);

  const [activePopup, setActivePopup] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [radialScroll, setRadialScroll] = useState(0);

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

    const activeSpreadIdx = useMemo(() => {
        return spreads.findIndex(s => s.indices.includes(currentPage));
    }, [spreads, currentPage]);

    const radialConfig = useMemo(() => {
        if (!spreads || spreads.length === 0) return { displaySpreads: [], angleStep: 26 };
        const displaySpreads = [...spreads];
        const compactStep = 26;
        const angleStep = Math.min(compactStep, 360 / displaySpreads.length);
        return { displaySpreads, angleStep };
    }, [spreads]);
    
    const { displaySpreads, angleStep } = radialConfig;

    useEffect(() => {
        if (activePopup === 'thumbnails') {
            setRadialScroll(0); 
        }
    }, [activePopup]);

    const handleRadialWheel = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        setRadialScroll(prev => {
            const shift = e.deltaY > 0 ? 1 : -1;
            if (spreads.length <= 7) {
                const nextFocus = activeSpreadIdx + prev + shift;
                if (nextFocus < 0) return -activeSpreadIdx;
                if (nextFocus > spreads.length - 1) return spreads.length - 1 - activeSpreadIdx;
            }
            return prev + shift;
        });
    };

  useEffect(() => {
    setInputPage(currentPage === 0 ? 1 : (currentPage || 1));
  }, [currentPage]);

  useEffect(() => {
      setLocalSearchQuery(searchQuery || '');
  }, [searchQuery]);

  const layoutColors = settings?.Layouts?.layoutColors || settings?.layoutColors;
  const layoutColorsArray = Array.isArray(layoutColors) ? layoutColors : (layoutColors?.[activeLayout] || []);

  const getLayoutColor = (id, defaultColor) => {
    if (layoutColorsArray && layoutColorsArray.length > 0) {
        const colorObj = layoutColorsArray.find(c => c && c.id === id);
        if (colorObj && colorObj.hex) {
            return colorObj.hex;
        }
    }
    return `var(--${id}, ${defaultColor})`;
  };

  const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
    if (layoutColorsArray && layoutColorsArray.length > 0) {
        const colorObj = layoutColorsArray.find(c => c && c.id === id);
        if (colorObj && colorObj.hex) {
            const hex = colorObj.hex.replace('#', '');
            const r = parseInt(hex.length === 3 ? hex.charAt(0) + hex.charAt(0) : hex.substring(0, 2), 16);
            const g = parseInt(hex.length === 3 ? hex.charAt(1) + hex.charAt(1) : hex.substring(2, 4), 16);
            const b = parseInt(hex.length === 3 ? hex.charAt(2) + hex.charAt(2) : hex.substring(4, 6), 16);
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }
        }
    }
    return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
  };

  const handlePageInputSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
       let targetPage = parseInt(inputPage);
       const totalPages = Array.isArray(pages) ? pages.length : pages || 12;
       
       if (isNaN(targetPage)) {
           setInputPage(currentPage === 0 ? 1 : (currentPage || 1));
           return;
       }
       if (targetPage < 1) targetPage = 1;
       if (targetPage > totalPages) targetPage = totalPages;
       
       setInputPage(targetPage);
       
       if (bookRef?.current?.pageFlip) {
           bookRef.current.pageFlip().turnToPage(targetPage - 1);
       }
    }
  };

  const totalPages = Array.isArray(pages) ? pages.length : pages || 12;

  // Derive active dot index for pagination (assuming 6 dots total)
  const dotCount = 6;
  const activeDotIndex = Math.min(
    Math.floor(((currentPage || 0) / Math.max(1, totalPages - 1)) * (dotCount - 1)),
    dotCount - 1
  );

  return (
    <div
      className="relative w-full h-full flex flex-col font-sans overflow-hidden "
      style={{ containerType: 'inline-size' }}
    >
      <div id="tablet-download-portal" className="absolute inset-0 z-[60] pointer-events-none"></div>
      {/* Top Bar */}
      <div className="w-full h-[7.5%] flex items-center px-[2cqw] flex-shrink-0 z-20 shadow-sm relative" style={{ backgroundColor: getLayoutColor('toolbar-bg', '#625FA2') }}>
        
        {/* Left: Search Bar */}
        <div className="flex-1 flex justify-start h-full items-center relative">
          <div className="relative w-[22cqw] h-[55%] rounded-[1.5cqw] flex items-center px-[1cqw] group border border-transparent transition-all duration-300 z-20" style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
            <style>{`
                #quick-search-tablet-${activeLayout}::placeholder {
                    color: ${getLayoutColor('toolbar-bg', '#555555')} !important;
                    opacity: 0.8;
                }
            `}</style>
            <Icon icon="lucide:search" className="w-[1.4cqw] h-[1.4cqw]" style={{ color: getLayoutColor('toolbar-bg', '#555555'), opacity: 0.8 }} />
            <input
              type="text" autoComplete="off" spellCheck="false" autoCorrect="off"
              id={`quick-search-tablet-${activeLayout}`}
              placeholder="Quick Search..."
              value={localSearchQuery}
              onChange={(e) => {
                  const val = e.target.value;
                  setLocalSearchQuery(val);

                  if (val.length >= 1) {
                      const results = [];
                      const lowerQuery = val.toLowerCase();
                      const uniqueMatches = new Set();
                      const isPdfProject = settings?.isPdfProject || false;

                      if (!isPdfProject && Array.isArray(pages)) {
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
                      }
                  } else {
                      setRecommendations([]);
                  }
              }}
              onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                      setSearchQuery(localSearchQuery);
                      if (handleQuickSearch) handleQuickSearch(localSearchQuery);
                      setRecommendations([]);
                  }
              }}
              className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 w-full h-full text-[1.2cqw] ml-[0.8cqw] font-medium"
              style={{ color: getLayoutColor('toolbar-bg', '#555555') }}
            />
          </div>

          {/* Detached Recommendations Dropdown with extended top height behind search bar */}
          {recommendations.length > 0 && (
              <div
                  className="absolute top-[50%] left-0 w-[22cqw] animate-in fade-in slide-in-from-top-1 duration-200 transition-all z-10"
                  onClick={(e) => e.stopPropagation()}
              >
                  <div
                      className="rounded-b-[1.5cqw] px-[1cqw] pb-[0.5cqw] pt-[3cqw] border border-transparent relative overflow-hidden"
                      style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }}
                  >
                      <div className="relative z-10 rounded-[1cqw] overflow-hidden">
                          <div className="rounded-[1cqw] overflow-hidden" style={{ backgroundColor: getLayoutColor('dropdown-bg', '#555555') }}>
                              <div className="flex flex-col py-[0.5cqw]">
                                  {recommendations.map((rec, idx) => (
                                      <button
                                          key={`${rec.word}-${rec.pageNumber}-${idx}`}
                                          className="flex items-center justify-between px-[1cqw] py-[0.8cqw] hover:opacity-70 transition-opacity group"
                                          onClick={() => {
                                              onPageClick(rec.pageNumber - 1);
                                              const fullQuery = rec.word + (rec.context ? ' ' + rec.context : '');
                                              setLocalSearchQuery(fullQuery);
                                              setSearchQuery(fullQuery);
                                              setRecommendations([]);
                                          }}
                                      >
                                          <div className="flex flex-col items-start overflow-hidden flex-1 mr-[1cqw]">
                                              <span className="text-[1cqw] opacity-90 group-hover:opacity-100 truncate w-full text-left">
                                                  <span className="font-bold mr-[0.5cqw]" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF'), fontWeight: 800 }}>{rec.word}</span>
                                                  {rec.context && <span className="font-normal opacity-70" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>{rec.context}</span>}
                                              </span>
                                          </div>
                                          <span
                                              className="text-[0.9cqw] font-bold opacity-60 tabular-nums shrink-0"
                                              style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                                          >{rec.pageNumber < 10 ? `0${rec.pageNumber}` : rec.pageNumber}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}
        </div>

        {/* Center: Icons */}
        <div className="flex-none flex items-center gap-[2cqw] absolute left-1/2 -translate-x-1/2" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
            <button 
              className="hover:text-gray-200 transition-colors"
              onClick={() => {
                setShowSoundPopupMemo?.(false);
                setShowProfilePopupMemo?.(false);
                setShowTOC(!showTOC);
              }}
            >
              <Icon icon="fluent:text-bullet-list-24-filled" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
            <button 
              className="hover:text-gray-200 transition-colors"
              onClick={(e) => {
                  e.stopPropagation();
                  setActivePopup(activePopup === 'thumbnails' ? null : 'thumbnails');
                  setShowTOC(false);
                  setShowSoundPopupMemo?.(false);
                  setShowProfilePopupMemo?.(false);
              }}
            >
              <Icon icon="ph:squares-four-fill" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
            <button className="hover:text-gray-200 transition-colors">
              <Icon icon="clarity:image-gallery-solid" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
            {(settings?.media?.backgroundAudio ?? true) && (
              <button 
                className="hover:text-gray-200 transition-colors relative"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTOC(false);
                  setShowProfilePopupMemo?.(false);
                  setShowSoundPopupMemo?.(!showSoundPopup);
                }}
                style={{ opacity: showSoundPopup ? 0.7 : 1 }}
              >
                <Icon icon="solar:music-notes-bold" className="w-[1.6cqw] h-[1.6cqw]" />
              </button>
            )}
            <button className="hover:text-gray-200 transition-colors">
              <Icon icon="ph:play-fill" className="w-[1.8cqw] h-[1.8cqw]" />
            </button>
            <button 
              className="hover:text-gray-200 transition-colors relative"
              onClick={(e) => {
                e.stopPropagation();
                setShowTOC(false);
                setShowSoundPopupMemo?.(false);
                setShowProfilePopupMemo?.(!showProfilePopup);
              }}
              style={{ opacity: showProfilePopup ? 0.7 : 1 }}
            >
              <Icon icon="fluent:person-24-filled" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
            <button 
              className="hover:text-gray-200 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowTOC(false);
                setShowSoundPopupMemo?.(false);
                setShowProfilePopupMemo?.(false);
                setIsShareOpen(true);
              }}
            >
              <Icon icon="mage:share-fill" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
            <button className="hover:text-gray-200 transition-colors" onClick={() => {
              if (handleDownload) {
                setShowTOC(false);
                setShowSoundPopupMemo?.(false);
                setShowProfilePopupMemo?.(false);
                handleDownload();
              }
            }}>
              <Icon icon="meteor-icons:download" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
            <button className="hover:text-gray-200 transition-colors">
              <Icon icon="lucide:fullscreen" className="w-[1.6cqw] h-[1.6cqw]" />
            </button>
        </div>

        {/* Right: Empty spacer */}
        <div className="flex-1"></div>
      </div>

      {showTOC && (
        <TabletTableOfContentsPopup 
            variant="layout2" 
            onClose={() => setShowTOC(false)} 
            onNavigate={onPageClick} 
            settings={settings} 
        />
      )}

      {/* The React Portal targets for popups */}
      <div id="tablet-sound-portal" className="absolute inset-0 z-50 pointer-events-none"></div>
      <div id="tablet-profile-portal" className="absolute inset-0 z-50 pointer-events-none"></div>

      {/* Middle Content Area */}
      <div className="flex-1 min-h-0 w-full relative flex items-center justify-center overflow-hidden">
        
        {/* Left Chevron */}
        <button 
          onClick={() => bookRef?.current?.pageFlip()?.flipPrev()}
          className={`absolute left-[3cqw] flex items-center justify-center transition-colors z-10 ${
            (!currentPage || currentPage === 0) 
              ? 'opacity-30' 
              : 'hover:opacity-80'
          }`}
          style={{ color: getLayoutColor('toolbar-bg', '#625FA2') }}
        >
          <Icon icon="lucide:chevron-left" className="w-[4cqw] h-[4cqw]" strokeWidth={1.5} />
        </button>

        {/* The Book */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center z-0">
           <div 
              style={{ transform: `translateX(${offset}px)`, transition: 'transform 0.5s ease-out' }} 
              className="flex items-center justify-center w-full h-full"
           >
             {children ? (
               children
             ) : (
               <div className="h-[90%] aspect-[1.4/1] bg-white shadow-[0_1cqw_4cqw_rgba(0,0,0,0.1)] flex flex-col items-center relative overflow-hidden">
                  <div className="w-full h-full absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] pointer-events-none"></div>
                  <div className="w-px h-full bg-black/10 absolute left-1/2 -translate-x-1/2 shadow-[-5px_0_15px_rgba(0,0,0,0.1)]"></div>
               </div>
             )}
           </div>
        </div>

        {/* Right Chevron */}
        <button 
          onClick={() => bookRef?.current?.pageFlip()?.flipNext()}
          className={`absolute right-[3cqw] flex items-center justify-center transition-colors z-10 ${
            (currentPage >= totalPages - 1)
              ? 'opacity-30'
              : 'hover:opacity-80'
          }`}
          style={{ color: getLayoutColor('toolbar-bg', '#625FA2') }}
        >
          <Icon icon="lucide:chevron-right" className="w-[4cqw] h-[4cqw]" strokeWidth={1.5} />
        </button>

        {/* Page Indicator Pill (Bottom Right) */}
        <div className="absolute bottom-[3cqw] right-[3cqw] px-[2cqw] py-[0.8cqw] rounded-[0.8cqw] shadow-sm font-bold text-[1.2cqw] flex items-center justify-center z-10" style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF'), color: getLayoutColor('toolbar-bg', '#625FA2') }}>
          Page 
          <input 
            type="text" 
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyDown={handlePageInputSubmit}
            onBlur={handlePageInputSubmit}
            className="w-[2.5cqw] text-center bg-transparent outline-none mx-[0.2cqw]"
          /> 
          / {totalPages}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="w-full h-[6%] flex items-center justify-between px-[2cqw] flex-shrink-0 z-20" style={{ backgroundColor: getLayoutColor('bottom-toolbar-bg', getLayoutColor('toolbar-bg', '#625FA2')) }}>
        
        {/* Left Text */}
        <div className="text-[1.2cqw] font-semibold tracking-wide" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>{/* {bookName} */}</div>

        {/* Center Dots */}
        <div className="flex items-center gap-[0.8cqw] absolute left-1/2 -translate-x-1/2">
          {Array.from({ length: dotCount }).map((_, i) => (
             <div 
                key={i} 
                className={`h-[0.6cqw] rounded-full transition-all duration-300 ${
                  i === activeDotIndex ? 'w-[2cqw]' : 'w-[0.6cqw]'
                }`}
                style={{ backgroundColor: i === activeDotIndex ? getLayoutColor('toolbar-text-main', '#FFFFFF') : getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.4) }}
             ></div>
          ))}
        </div>

        {/* Right Zoom Controls */}
        <div className="flex items-center gap-[1cqw]">
            <div className="flex items-center gap-[1.2cqw] px-[1.2cqw] py-[0.5cqw] rounded-[0.5cqw]" style={{ backgroundColor: getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.1) }}>
                <button className="transition-colors hover:opacity-80" style={{ color: getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.8) }}>
                    <Icon icon="ph:magnifying-glass-minus-bold" className="w-[1.2cqw] h-[1.2cqw]" />
                </button>
                <span className="text-[1.1cqw] font-bold" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>100%</span>
                <button className="transition-colors hover:opacity-80" style={{ color: getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.8) }}>
                    <Icon icon="ph:magnifying-glass-plus-bold" className="w-[1.2cqw] h-[1.2cqw]" />
                </button>
            </div>
            <button className="transition-colors hover:opacity-80 px-[1.5cqw] py-[0.5cqw] rounded-[0.5cqw] text-[1.1cqw] font-bold" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF'), backgroundColor: getLayoutColorAlpha('toolbar-text-main', '255, 255, 255', 0.2) }}>
                Reset
            </button>
        </div>

      </div>

      <AnimatePresence>
          {activePopup === 'thumbnails' && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[5000] flex items-center justify-end bg-transparent"
                  onClick={() => setActivePopup(null)}
                  onWheel={handleRadialWheel}
              >
                  <svg className="absolute w-0 h-0 invisible">
                      <defs>
                          <filter id="clean-shadow-tablet" x="-50%" y="-50%" width="200%" height="200%">
                              <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                              <feOffset dx="0" dy="4" />
                              <feComponentTransfer><feFuncA type="linear" slope="0.25" /></feComponentTransfer>
                              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                          </filter>
                      </defs>
                  </svg>

                  <div
                      className="relative w-[52cqw] h-[52cqw] flex items-center justify-center pointer-events-auto"
                      style={{ transform: 'translateX(40%) translateY(0%)' }}
                      onClick={(e) => e.stopPropagation()}
                  >
                      <div className="absolute inset-0 flex items-center justify-center">
                          <div style={{
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              border: `10.8cqw solid ${getLayoutColorAlpha('dropdown-bg', '87, 92, 156', 0.05)}`,
                              boxSizing: 'border-box',
                              filter: 'blur(4px)',
                              pointerEvents: 'none',
                          }} />
                          <svg viewBox="0 0 888 888" className="w-full h-full pointer-events-none" style={{ position: 'absolute' }}>
                              <defs>
                                  <radialGradient id="ringFillGradientTablet" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
                                      <stop offset="0%" stopColor="white" stopOpacity="0" />
                                      <stop offset="56%" stopColor="white" stopOpacity="0" />
                                      <stop offset="60%" stopColor={getLayoutColor('dropdown-bg', '#555555')} stopOpacity="0.05" />
                                      <stop offset="70%" stopColor={getLayoutColor('dropdown-bg', '#555555')} stopOpacity="0.02" />
                                      <stop offset="94%" stopColor={getLayoutColor('dropdown-bg', '#555555')} stopOpacity="0.02" />
                                      <stop offset="98%" stopColor={getLayoutColor('dropdown-bg', '#555555')} stopOpacity="0.05" />
                                      <stop offset="100%" stopColor={getLayoutColor('dropdown-bg', '#555555')} stopOpacity="0.05" />
                                  </radialGradient>
                              </defs>
                              <path
                                  d="M444 0C689.214 0 888 198.786 888 444C888 689.214 689.214 888 444 888C198.786 888 0 689.214 0 444C0 198.786 198.786 0 444 0ZM444 184C300.4 184 184 300.4 184 444C184 587.6 300.4 704 444 704C587.6 704 704 587.6 704 444C704 300.4 587.6 184 444 184Z"
                                  fill="url(#ringFillGradientTablet)"
                                  filter="url(#clean-shadow-tablet)"
                              />
                          </svg>
                      </div>

                      {(() => {
                          const baseAngle = 180;
                          const orbitRadius = 39.6;
                          const focusIndex = activeSpreadIdx + radialScroll;
                          const parentRotation = -focusIndex * angleStep;

                          return (
                              <motion.div
                                  className="absolute inset-0 z-10 pointer-events-none"
                                  animate={{ rotate: parentRotation }}
                                  transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
                              >
                                  {displaySpreads.map((spread, i) => {
                                      const fixedAngleDeg = baseAngle + i * angleStep;
                                      const fixedAngleRad = fixedAngleDeg * (Math.PI / 180);
                                      const x = 50 + orbitRadius * Math.cos(fixedAngleRad);
                                      const y = 50 + orbitRadius * Math.sin(fixedAngleRad);

                                      const rawFocusedIdx = Math.round(focusIndex);
                                      const mappedFocusedIdx = ((rawFocusedIdx % displaySpreads.length) + displaySpreads.length) % displaySpreads.length;
                                      const isActive = (hoveredIdx !== null ? (hoveredIdx === i) : (mappedFocusedIdx === i));

                                      return (
                                          <motion.div
                                              key={i}
                                              className="absolute pointer-events-auto cursor-pointer flex items-center justify-center p-0"
                                              style={{
                                                  left: `${x}%`,
                                                  top: `${y}%`,
                                                  width: '10.5cqw',
                                                  height: '8.25cqw',
                                                  marginLeft: '-5.25cqw',
                                                  marginTop: '-4.125cqw',
                                                  zIndex: isActive ? 50 : 10,
                                              }}
                                              animate={{ rotate: fixedAngleDeg + 90, scale: isActive ? 1.05 : 1 }}
                                              transition={{ duration: 0 }}
                                              onMouseEnter={() => setHoveredIdx(i)}
                                              onMouseLeave={() => setHoveredIdx(null)}
                                              onClick={() => { 
                                                  if (onPageClick) onPageClick(spread.indices[0]);
                                                  if (bookRef?.current?.pageFlip) {
                                                      bookRef.current.pageFlip().turnToPage(spread.indices[0]);
                                                  }
                                              }}
                                          >
                                              <svg viewBox="0 0 170 173" className="w-full h-full overflow-visible">
                                                  <g transform="rotate(90, 85, 86.5)">
                                                      <path
                                                          d="M9.29472 11.4862C11.1722 3.10828 19.7989 -1.79399 28.0408 0.611489L161.222 39.4818C168.942 41.7352 173.506 49.6146 172.035 57.5216C167.9 79.7315 167.621 96.4086 170.486 118.929C171.485 126.787 166.576 134.264 158.88 136.14L24.4315 168.911C16.05 170.953 7.62316 165.607 6.15266 157.106C-2.91853 104.667 -2.03183 62.0294 9.29472 11.4862Z"
                                                          fill={getLayoutColor('dropdown-bg', '#3E4491')}
                                                          className="transition-colors duration-300"
                                                      />
                                                  </g>
                                                  <text
                                                      x="50%"
                                                      y="50%"
                                                      fill={getLayoutColor('dropdown-text', '#FFFFFF')}
                                                      fontSize="20"
                                                      fontWeight="bolder"
                                                      textAnchor="middle"
                                                      alignmentBaseline="middle"
                                                      style={{ letterSpacing: '0.04em' }}
                                                      className="select-none opacity-90"
                                                      transform="rotate(90, 85, 86.5)"
                                                  >
                                                      {spread.label}
                                                  </text>
                                              </svg>
                                          </motion.div>
                                      );
                                  })}
                              </motion.div>
                          );
                      })()}

                      <motion.div className="absolute w-[31cqw] h-[31cqw] z-[100] flex items-center justify-center pointer-events-none">
                          <div className="relative w-full h-full flex items-center justify-center">
                              <div className="absolute z-[150] flex items-center" style={{ transform: 'translateX(-3.75cqw)' }}>
                                  <div className="w-[1cqw] h-[1cqw] bg-white rotate-45 -mr-[0.5cqw] rounded-[0.1cqw]" />
                                  <div className="w-[12cqw] h-[8.4cqw] bg-white rounded-[0.5cqw] p-[0.4cqw] flex items-center justify-center border border-gray-100/80">
                                      <div className="w-full h-full bg-gray-50 flex items-center justify-center relative overflow-hidden rounded-[0.3cqw]">
                                          {(() => {
                                              if (!displaySpreads || displaySpreads.length === 0) return null;
                                              const rawFocusIdx = Math.round(activeSpreadIdx + radialScroll);
                                              const mappedFocusIdx = ((rawFocusIdx % displaySpreads.length) + displaySpreads.length) % displaySpreads.length;
                                              const hubSpreadIdx = hoveredIdx !== null ? (hoveredIdx % spreads.length) : (displaySpreads[mappedFocusIdx] ? (mappedFocusIdx % spreads.length) : 0);
                                              const hubSpread = spreads[hubSpreadIdx] || spreads[0];
                                              if (!hubSpread || !hubSpread.pages) return null;
                                              return (
                                                  <div className="flex w-full h-full gap-[0.2cqw] items-center justify-center bg-gray-50">
                                                      {hubSpread.pages.map((p, pIdx) => (
                                                          <div key={pIdx} className="flex-1 max-w-[50%] h-full bg-white rounded-[0.2cqw] overflow-hidden relative border border-gray-200">
                                                              <PageThumbnail html={p?.html || p?.content || ''} index={hubSpread.indices[pIdx]} scale={0.15} />
                                                          </div>
                                                      ))}
                                                  </div>
                                              );
                                          })()}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </motion.div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          isTabletLayout={true}
          currentBook={currentBook || settings}
          activeLayout={activeLayout || '2'}
      />
    </div>
  );
};

export default TabletLayout2;
