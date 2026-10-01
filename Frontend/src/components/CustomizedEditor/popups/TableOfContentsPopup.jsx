import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useTableOfContents } from './useTableOfContents';

const isLightColor = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
    let c = hex.substring(1).toUpperCase();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return false;
    const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
    return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) > 0.5;
};

const TableOfContentsPopup = ({ onClose, onNavigate, settings = {}, activeLayout, isTablet, isMobile, isLandscape, isSidebarOpen, isEditor, layoutColors, isMobileLandscape, isFullscreen, isMobilePortraitOverride, addTextBelowIcons = false }) => {
    const speakText = (text) => {
        if ('speechSynthesis' in window && text) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const useMaleVoice = settings?.useMaleVoice || settings?.tocSettings?.useMaleVoice;
            
            const playVoice = () => {
                const voices = window.speechSynthesis.getVoices();
                let preferredVoice;
                if (useMaleVoice) {
                    preferredVoice = voices.find(voice => 
                        voice.name.includes('David') || 
                        voice.name.includes('Daniel') || 
                        voice.name.includes('Alex') ||
                        voice.name.includes('Mark') ||
                        voice.name.includes('George') ||
                        voice.name.includes('Guy') ||
                        voice.name.includes('Male')
                    );
                    if (!preferredVoice) {
                        preferredVoice = voices.find(voice => 
                            !voice.name.toLowerCase().includes('zira') && 
                            !voice.name.toLowerCase().includes('samantha') && 
                            !voice.name.toLowerCase().includes('susan') &&
                            !voice.name.toLowerCase().includes('hazel') &&
                            !voice.name.toLowerCase().includes('female')
                        );
                    }
                } else {
                    preferredVoice = voices.find(voice => 
                        voice.name.includes('Google') || 
                        voice.name.includes('Samantha') || 
                        voice.name.includes('Zira') ||
                        voice.name.includes('Female')
                    );
                }

                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }

                utterance.rate = 0.85; 
                utterance.pitch = useMaleVoice ? 0.9 : 1.15; 

                window.speechSynthesis.speak(utterance);
            };

            if (window.speechSynthesis.getVoices().length === 0) {
                window.speechSynthesis.addEventListener('voiceschanged', playVoice, { once: true });
                setTimeout(playVoice, 200);
            } else {
                playVoice();
            }
        }
    };
    // Ensure settings is at least an empty object if it's null
    const safeSettings = settings || {};

    if (!onClose) return null;

    const hexToRgba = (hex, opacity = 100) => {
        if (!hex || !hex.startsWith('#')) return hex;
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        const a = 0.4 + (Math.max(0, Math.min(1, opacity / 100)) * 0.6);
        return a >= 1 ? hex : `rgba(${r},${g},${b},${a})`;
    };
    const layoutColorsArray = Array.isArray(layoutColors) ? layoutColors : (layoutColors?.[activeLayout] || []);

    const getLayoutColor = (id, defaultColor) => {
        if (layoutColorsArray && layoutColorsArray.length > 0) {
            const c = layoutColorsArray.find(x => x && x.id === id);
            if (c) return hexToRgba(c.hex, c.opacity ?? 100);
        }
        return `var(--${id}, ${defaultColor})`;
    };
    const getLayoutOpacity = (id, defaultOpacity) => `var(--${id}-opacity, ${defaultOpacity})`;
    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

    const tocBgHex = layoutColorsArray.length > 0 ? layoutColorsArray.find(c => c && c.id === 'toc-bg')?.hex || '#555555' : '#555555';
    const tocTextHex = layoutColorsArray.length > 0 ? layoutColorsArray.find(c => c && c.id === 'toc-text')?.hex || '#FFFFFF' : '#FFFFFF';
    let bodyTextColor = isLightColor(tocBgHex) ? tocTextHex : tocBgHex;
    if (isLightColor(bodyTextColor)) {
        bodyTextColor = '#333333';
    }
    const {
        searchQuery,
        setSearchQuery,
        addSearch,
        addPageNumber,
        addSerialNumberHeading,
        addSerialNumberSubheading,
        filteredContent
    } = useTableOfContents(settings);


    const isLayout2 = Number(activeLayout) === 2 || activeLayout === 'Layout2';
    const isLayout1 = Number(activeLayout) === 1 || activeLayout === 'Layout1';
    const isLayout3 = Number(activeLayout) === 3 || activeLayout === 'Layout3';
    const isLayout7 = Number(activeLayout) === 7 || activeLayout === 'Layout7';
    const isLayout8 = Number(activeLayout) === 8 || activeLayout === 'Layout8';
    const isLayout6 = Number(activeLayout) === 6 || activeLayout === 'Layout6';

    const scrollContainerRef = useRef(null);
    const [initialHeight, setInitialHeight] = useState('auto');
    const [tocLeft, setTocLeft] = useState(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            const height = scrollContainerRef.current.offsetHeight;
            if (height > 0 && initialHeight === 'auto') {
                setInitialHeight(height);
            }
        }
    }, [initialHeight]);

    useEffect(() => {
        if (!isLayout8) return;
        
        let animationFrameId;

        const syncPosition = () => {
            const btn = document.getElementById('layout8-toc-btn');
            const root = document.getElementById('preview-area-root');
            const popup = document.getElementById('layout8-toc-panel');
            
            if (btn && root && popup) {
                const btnRect = btn.getBoundingClientRect();
                const rootRect = root.getBoundingClientRect();
                const newLeft = btnRect.left - rootRect.left + (btnRect.width / 2);
                
                setTocLeft(prev => prev === null ? newLeft : prev);
                popup.style.left = `${newLeft}px`;
            }
            animationFrameId = requestAnimationFrame(syncPosition);
        };

        syncPosition();

        return () => cancelAnimationFrame(animationFrameId);
    }, [isLayout8]);

    const [expandedSections, setExpandedSections] = useState({});

    // Auto-expand matching sections when searching
    useEffect(() => {
        if (searchQuery.trim()) {
            const newExpanded = {};
            filteredContent.forEach(heading => {
                newExpanded[heading.id || heading.title] = true;
            });
            setExpandedSections(newExpanded);
        }
    }, [searchQuery, filteredContent]);

    const toggleSection = (id) => {
        setExpandedSections(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (isLayout8) {
        if (isMobile && !isLandscape) {
            return (
                <>
                    <div className="fixed inset-0 z-[2000] pointer-events-auto bg-transparent" onClick={onClose} />
                    <div
                        className={`absolute top-[105px] left-[15px] z-[2100] pointer-events-auto origin-top-left`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`relative w-[150px] min-h-[160px] h-fit max-h-[60vh] flex flex-col group`}>
                            {/* SVG Background (Knob on left for TOC) */}
                            <div className="absolute inset-0 z-0 pointer-events-none drop-shadow-xl">
                                <svg width="100%" height="100%" viewBox="0 0 250 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                    <path
                                        d="M0 35C0 15 15 0 35 0C55 0 70 15 70 35V100C70 120 75 135 90 135H230C241.05 135 250 143.95 250 155V580C250 591.05 241.05 600 230 600H20C8.95 600 0 591.05 0 580V35Z"
                                        fill={getLayoutColor('toc-bg', '#555555')}
                                        fillOpacity={getLayoutOpacity('toc-bg', '0.95')}
                                    />
                                </svg>
                            </div>

                            {/* Content Layer */}
                            <div className="relative z-10 flex flex-col flex-1 pt-[70px] px-[8px] pb-[12px]">
                                {/* Search Bar */}
                                {addSearch && (
                                    <div className="relative mb-[10px]">
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full rounded-full border border-white/10 pl-[10px] pr-[22px] py-[5px] text-[10px] placeholder:text-current placeholder:opacity-40 outline-none backdrop-blur-md italic font-medium shadow-inner transition-colors"
                                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: getLayoutColor('toc-text', '#FFFFFF'), opacity: getLayoutOpacity('toc-text', '1') }}
                                        />
                                        <Icon
                                            icon="lucide:search"
                                            className="absolute right-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] transition-colors"
                                            style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: `calc(${getLayoutOpacity('toc-text', '1')} * 0.5)` }}
                                        />
                                    </div>
                                )}

                                {/* TOC List */}
                                <div className="flex flex-col gap-[4px] overflow-y-auto custom-scrollbar pr-[2px]" style={{ scrollbarWidth: 'none' }}>
                                    {filteredContent.map((heading, hIdx) => {
                                        const sectionId = heading.id || heading.title;
                                        const hasSubItems = heading.subheadings && heading.subheadings.length > 0;
                                        return (
                                            <div key={sectionId} className="flex flex-col gap-[3px]">
                                                <div
                                                    onClick={() => { if (onNavigate) { speakText(heading.title); onNavigate(heading.page - 1); } }}
                                                    className="rounded-full px-[10px] py-[4px] flex items-center justify-between cursor-pointer hover:bg-white/30 active:scale-[0.98] transition-all shadow-sm group border border-white/10"
                                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                                                >
                                                    <span className="text-[10px] font-bold tracking-tight truncate transition-colors" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: getLayoutOpacity('toc-text', '1') }}>
                                                        {heading.title}
                                                    </span>
                                                    <span className="text-[9px] font-bold tabular-nums transition-colors ml-1 shrink-0" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: `calc(${getLayoutOpacity('toc-text', '1')} * 0.9)` }}>
                                                        {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                    </span>
                                                </div>

                                                {hasSubItems && (
                                                    <div className="flex flex-col gap-[2px] pl-[6px] animate-in slide-in-from-top-2 duration-300">
                                                        {heading.subheadings.map((sub, sIdx) => (
                                                            <div
                                                                key={sub.id || sIdx}
                                                                onClick={(e) => { e.stopPropagation(); if (onNavigate) { speakText(sub.title); onNavigate(sub.page - 1); } }}
                                                                className="rounded-full px-[8px] py-[3px] flex items-center justify-between cursor-pointer hover:bg-white/20 active:scale-[0.98] transition-all ml-auto w-[85%] border border-white/10"
                                                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                                                            >
                                                                <span className="text-[9px] font-semibold tracking-tight truncate transition-colors" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: `calc(${getLayoutOpacity('toc-text', '1')} * 0.9)` }}>
                                                                    {sub.title}
                                                                </span>
                                                                <span className="text-[8px] font-bold tabular-nums transition-colors ml-1 shrink-0" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: `calc(${getLayoutOpacity('toc-text', '1')} * 0.8)` }}>
                                                                    {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {filteredContent.length === 0 && (
                                        <div className="text-[10px] text-center py-4 font-medium" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 0.5 }}>
                                            No Table Of Content Found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        return (
            <>
                <div className="fixed inset-0 z-[40] pointer-events-auto bg-transparent" onClick={onClose} />
                <div
                    id={isLayout8 ? "layout8-toc-panel" : undefined}
                    className={`absolute z-[45] pointer-events-auto origin-top-right`}
                    style={{
                        top: addTextBelowIcons ? '0.7vh' : '1.2vh',
                        left: tocLeft !== null ? `${tocLeft}px` : (addTextBelowIcons ? `calc(50% - ${isSidebarOpen ? '24.8vw' : '29.4vw'})` : `calc(50% - ${isSidebarOpen ? '25vw' : '29.3vw'})`),
                        filter: 'drop-shadow(0 0.5vw 1.5vw rgba(0,0,0,0.15))',
                        transform: tocLeft !== null ? 'translateX(-85%) scale(0.85)' : 'scale(0.85)',
                        transformOrigin: tocLeft !== null ? '85% top' : 'top left'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`relative w-[13vw] h-[21.4vw] max-h-[80vh] flex flex-col group`}>
                        {/* New SVG Shape Background */}
                        <div className="absolute inset-0 z-0 pointer-events-none drop-shadow-sm">
                            <svg width="100%" height="100%" viewBox="0 0 213 350" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <defs>
                                    <clipPath id="toc-shape-clip-layout8" clipPathUnits="objectBoundingBox">
                                        <path
                                            transform="scale(0.00469483, 0.002857)"
                                            d="M0 87C0 75.9543 8.95431 67 20 67H213V330C213 341.046 204.046 350 193 350H20C8.9543 350 0 341.046 0 330V87Z"
                                        />
                                        <path
                                            transform="scale(0.00469483, 0.002857)"
                                            d="M146.818 33.0909C146.818 14.8153 161.633 0 179.909 0C198.185 0 213 14.8153 213 33.0909V67H122C140.752 67 146.818 52.7213 146.818 41.7377V33.0909Z"
                                        />
                                    </clipPath>
                                </defs>
                                <path d="M0 87C0 75.9543 8.95431 67 20 67H213V330C213 341.046 204.046 350 193 350H20C8.9543 350 0 341.046 0 330V87Z" fill={getLayoutColor('toc-bg', '#555555')} fillOpacity={getLayoutOpacity('toc-bg', '0.6')} />
                                <path d="M146.818 33.0909C146.818 14.8153 161.633 0 179.909 0C198.185 0 213 14.8153 213 33.0909V67H122C140.752 67 146.818 52.7213 146.818 41.7377V33.0909Z" fill={getLayoutColor('toc-bg', '#555555')} fillOpacity={getLayoutOpacity('toc-bg', '0.6')} />
                            </svg>
                        </div>

                        {/* Content Layer with Body Background and Styling */}
                        <div
                            className="relative z-10 flex flex-col flex-1 min-h-0 pt-[6vw] px-[1vw] pb-[2.5vw] backdrop-blur-md"
                            style={{ clipPath: 'url(#toc-shape-clip-layout8)', WebkitClipPath: 'url(#toc-shape-clip-layout8)' }}
                        >
                            {/* Search Bar - Compact */}
                            {addSearch && (
                                <div className="relative mb-[1.5vw] pr-[0.5vw]">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-full border border-white/10 pl-[1.2vw] pr-[2.5vw] py-[0.6vw] text-[0.85vw] placeholder:text-current placeholder:opacity-40 outline-none backdrop-blur-md italic font-medium shadow-inner transition-colors"
                                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: getLayoutColor('toc-text', '#FFFFFF'), opacity: getLayoutOpacity('toc-text', '1') }}
                                    />
                                    <Icon
                                        icon="lucide:search"
                                        className="absolute right-[1.5vw] top-1/2 -translate-y-1/2 w-[0.9vw] h-[0.9vw] transition-colors"
                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: `calc(${getLayoutOpacity('toc-text', '1')} * 0.5)` }}
                                    />
                                </div>
                            )}

                            {/* TOC List */}
                            <div
                                className="flex-1 min-h-0 flex flex-col gap-[0.6vw] overflow-y-auto custom-scrollbar pr-[0.4vw]"
                            >
                                {filteredContent.map((heading, hIdx) => {
                                    const sectionId = heading.id || heading.title;
                                    const isExpanded = expandedSections[sectionId] || false;
                                    const hasSubItems = heading.subheadings && heading.subheadings.length > 0;

                                    return (
                                        <div key={sectionId} className="flex flex-col gap-[0.35vw]">
                                            {/* Main Heading Pill */}
                                            <div
                                                onClick={() => {
                                                    if (onNavigate) { speakText(heading.title); onNavigate(heading.page - 1); }
                                                }}
                                                className="flex items-center justify-between px-[1vw] py-[0.5vw] bg-white rounded-full cursor-pointer group shadow-sm transition-transform active:scale-95"
                                            >
                                                <div className="flex items-center gap-[0.5vw] truncate">
                                                    <span className="text-[0.88vw] font-medium tracking-tight truncate transition-colors" style={{ color: getLayoutColor('toc-bg', '#555555') }}>
                                                        {heading.title}
                                                    </span>
                                                </div>
                                                <span className="text-[0.85vw] font-medium tabular-nums transition-colors whitespace-nowrap shrink-0" style={{ color: getLayoutColor('toc-bg', '#555555') }}>
                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                </span>
                                            </div>

                                            {/* Subheadings */}
                                            {hasSubItems && (
                                                <div className="flex flex-col gap-[0.35vw] animate-in slide-in-from-top-2 duration-300">
                                                    {heading.subheadings.map((sub, sIdx) => (
                                                        <div
                                                            key={sub.id || sIdx}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onNavigate) { speakText(sub.title); onNavigate(sub.page - 1); }
                                                            }}
                                                            className="flex items-center justify-between px-[1vw] py-[0.4vw] ml-auto w-[85%] bg-white rounded-full cursor-pointer group shadow-sm transition-transform active:scale-95"
                                                        >
                                                            <span className="text-[0.78vw] font-medium tracking-tight truncate transition-colors" style={{ color: getLayoutColor('toc-bg', '#555555') }}>
                                                                {sub.title}
                                                            </span>
                                                            <span className="text-[0.75vw] font-medium tabular-nums transition-colors whitespace-nowrap shrink-0" style={{ color: getLayoutColor('toc-bg', '#555555') }}>
                                                                {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {filteredContent.length === 0 && (
                                    <div className="text-[0.85vw] text-center py-[2vw] font-medium" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 0.5 }}>
                                        No Table Of Content Found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (isLayout6) {
        return (
            <>
                <div className="fixed inset-0 z-[1000] pointer-events-auto bg-transparent" onClick={onClose} />
                <motion.div
                    className={`${isMobile && !isLandscape ? 'absolute right-4 top-[10%] bottom-0 w-[280px] rounded-t-[20px] shadow-2xl' : 'absolute ' + (isTablet ? 'right-[3.1vw] top-[1.5vh] w-[16vw]' : 'right-[4.5vw] top-[2vh] w-[18vw]') + ' bottom-0 rounded-t-[1.5vw] shadow-[-10px_0px_40px_rgba(0,0,0,0.15)]'} z-[1001] flex flex-col overflow-hidden border backdrop-blur-xl pointer-events-auto`}
                    style={{
                        backgroundColor: `rgba(var(--toc-bg-rgb, 255, 255, 255), var(--toc-bg-opacity, 0.6))`,
                        borderColor: getLayoutColor('toc-text', '#555555') + '4D'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                >
                    <div className={`${isMobile && !isLandscape ? 'h-[48px]' : (isTablet ? 'h-[7vh]' : 'h-[8vh]')} flex items-center justify-between px-[1.5vw] border-b shrink-0`} style={{ borderColor: getLayoutColor('toc-text', '#555555') + '33' }}>
                        <span className={`${isMobile && !isLandscape ? 'text-[14px]' : (isTablet ? 'text-[0.85vw]' : 'text-[1.1vw]')} font-bold`} style={{ color: getLayoutColor('toc-text', '#555555') }}>Table of Contents</span>
                        <button onClick={onClose} className="transition-colors" style={{ color: getLayoutColor('toc-icon', '#555555'), opacity: 0.6 }}>
                            <Icon icon="lucide:x" className={`${isMobile && !isLandscape ? 'w-4 h-4' : (isTablet ? 'w-[1.2vw] h-[1.2vw]' : 'w-[1.4vw] h-[1.4vw]')}`} />
                        </button>
                    </div>

                    {addSearch && (
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
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search in TOC..."
                                    className={`bg-transparent border-0 outline-none focus:ring-0 ${isMobile && !isLandscape ? 'text-[11px]' : (isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]')} ml-[0.5vw] w-full font-sans`}
                                    style={{ color: getLayoutColor('toc-text', '#555555') }}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} style={{ color: getLayoutColor('toc-icon', '#555555'), opacity: 0.4 }}>
                                        <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-[1vw] flex flex-col pt-[1vh]">
                            {filteredContent.length > 0 ? (
                                <div className="flex flex-col gap-[0.5vh]">
                                    {filteredContent.map((item, idx) => (
                                        <div key={idx} className="flex flex-col mb-[0.8vh]">
                                            <div
                                                className={`flex items-center justify-between ${isMobile && !isLandscape ? 'py-1.5 px-2.5' : (isTablet ? 'py-[0.5vh] px-[0.6vw]' : 'py-[0.8vh] px-[0.8vw]')} hover:bg-white/10 rounded-[0.5vw] cursor-pointer transition-all group`}
                                                style={{ color: getLayoutColor('toc-text', '#555555') }}
                                                onClick={() => { speakText(item.title); onNavigate && onNavigate(item.page - 1); onClose(); }}
                                            >
                                                <div className="flex items-center gap-[0.4vw] truncate pr-[0.5vw]">
                                                    {addSerialNumberHeading && (
                                                        <span className={`${isMobile && !isLandscape ? 'text-[12px]' : (isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]')} font-bold opacity-40 shrink-0`}>{idx + 1}.</span>
                                                    )}
                                                    <span className={`${isMobile && !isLandscape ? 'text-[12px]' : (isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]')} font-semibold group-hover:opacity-100 truncate opacity-90`}>
                                                        {item.title}
                                                    </span>
                                                </div>
                                                {addPageNumber && (
                                                    <span className={`${isMobile && !isLandscape ? 'text-[10px]' : (isTablet ? 'text-[0.75vw]' : 'text-[0.9vw]')} font-bold opacity-40 group-hover:opacity-80 tabular-nums`}>
                                                        {item.page < 10 ? `0${item.page}` : item.page}
                                                    </span>
                                                )}
                                            </div>
                                            {item.subheadings && item.subheadings.length > 0 && (
                                                <div className="flex flex-col mt-[0.1vh]">
                                                    {item.subheadings.map((sub, sIdx) => (
                                                        <div
                                                            key={sIdx}
                                                            className={`flex items-center justify-between ${isMobile && !isLandscape ? 'py-1 px-2.5 pl-6' : 'py-[0.6vh] px-[0.8vw] pl-[1.5vw]'} hover:bg-white/10 rounded-[0.5vw] cursor-pointer transition-all group`}
                                                            style={{ color: getLayoutColor('toc-text', '#555555') }}
                                                            onClick={() => { speakText(sub.title); onNavigate && onNavigate(sub.page - 1); onClose(); }}
                                                        >
                                                            <div className="flex items-center gap-[0.4vw] truncate pr-[0.5vw]">
                                                                {addSerialNumberSubheading && (
                                                                    <span className="text-[0.8vw] font-bold opacity-30 shrink-0">{idx + 1}.{sIdx + 1}</span>
                                                                )}
                                                                <span className={`${isMobile && !isLandscape ? 'text-[11px]' : (isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]')} font-medium opacity-70 group-hover:opacity-100 truncate`}>
                                                                    {sub.title}
                                                                </span>
                                                            </div>
                                                            {addPageNumber && (
                                                                <span className={`${isMobile && !isLandscape ? 'text-[9px]' : (isTablet ? 'text-[0.7vw]' : 'text-[0.85vw]')} font-semibold opacity-30 group-hover:opacity-60 tabular-nums`}>
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
            </>
        );
    }

    if (isMobile && !isLandscape && isLayout7) {
        return (
            <>
                <div className="fixed inset-0 z-[1000] pointer-events-auto" onClick={onClose} />
                <div className="fixed bottom-[190px] left-[16px] z-[1001] pointer-events-auto w-[170px]">
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200 origin-bottom-left">
                        {/* Header */}
                        <div
                            className="w-full px-3 py-2 flex items-center justify-between"
                            style={{ backgroundColor: getLayoutColor('toc-bg', '#555555') }}
                        >
                            <h2 className="text-[12px] font-bold tracking-wide" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>Table of Contents</h2>
                            <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                                <Icon icon="lucide:x" className="w-4 h-4 text-white" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-3 w-full">
                            {addSearch && (
                                <div className="mb-3 relative">
                                    <Icon
                                        icon="lucide:search"
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                                        style={{ color: bodyTextColor, opacity: 0.6 }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-lg pl-8 pr-2.5 py-1.5 text-[11px] outline-none transition-colors border focus:border-opacity-50 shadow-sm"
                                        style={{
                                            backgroundColor: 'white',
                                            color: bodyTextColor,
                                            borderColor: `${bodyTextColor}40`
                                        }}
                                    />
                                </div>
                            )}

                            <div
                                ref={scrollContainerRef}
                                className="flex flex-col gap-0.5 overflow-y-auto max-h-[220px] pr-1"
                            >
                                {filteredContent.length === 0 ? (
                                    <div className="text-center py-6 text-[11px] italic" style={{ color: bodyTextColor, opacity: 0.6 }}>
                                        No items found
                                    </div>
                                ) : (
                                    filteredContent.map((heading, hIdx) => (
                                        <div
                                            key={heading.id}
                                            className="flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
                                            onClick={() => { if (onNavigate) { speakText(heading.title); onNavigate(heading.page - 1); } }}
                                        >
                                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                <span className="text-[11px] font-bold truncate"
                                                    style={{ color: bodyTextColor }}
                                                >
                                                    {addSerialNumberHeading ? `${hIdx + 1}. ` : ''}{heading.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 ml-2">
                                                <span className="text-[9px] font-extrabold opacity-40" style={{ color: bodyTextColor }}>
                                                    {String(heading.page).padStart(2, '0')}
                                                </span>
                                                <Icon
                                                    icon="lucide:chevron-right"
                                                    className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{ color: bodyTextColor }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (isLayout7) {
        return (
            <>
                <div className="fixed inset-0 z-[190] pointer-events-auto bg-transparent" onClick={onClose} />
                <div className={`fixed bottom-[10.5vh] ${isSidebarOpen ? 'left-[54vw]' : 'left-[44vw]'} -translate-x-1/2 z-[200] pointer-events-auto`}>
                    <div
                        className="bg-white rounded-[0.4vw] shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] w-[13vw] overflow-hidden border border-gray-100 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className="w-full px-[0.8vw] py-[0.5vw] flex items-center justify-between"
                            style={{ backgroundColor: getLayoutColor('toc-bg', '#555555') }}
                        >
                            <h2 className="text-[0.75vw] font-bold tracking-wide" style={{ color: getLayoutColor('toc-text', '#FFFFFF') }}>Table of Contents</h2>
                        </div>

                        {/* Body */}
                        <div className="p-[0.8vw] w-full">
                            {addSearch && (
                                <div className="mb-[0.8vw] relative">
                                    <Icon
                                        icon="lucide:search"
                                        className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 w-[0.7vw] h-[0.7vw]"
                                        style={{ color: bodyTextColor, opacity: 0.6 }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-[0.3vw] pl-[1.8vw] pr-[0.6vw] py-[0.3vw] text-[0.7vw] outline-none transition-colors border focus:border-opacity-50 shadow-sm"
                                        style={{
                                            backgroundColor: 'white',
                                            color: bodyTextColor,
                                            borderColor: `${bodyTextColor}40`
                                        }}
                                    />
                                </div>
                            )}

                            <div
                                ref={scrollContainerRef}
                                className="flex flex-col gap-[0.2vw] overflow-y-auto custom-scrollbar max-h-[25vh]"
                                style={initialHeight !== 'auto' ? { minHeight: initialHeight } : {}}
                            >
                                {filteredContent.map((heading, hIdx) => (
                                    <React.Fragment key={heading.id}>
                                        <div
                                            className="flex items-center justify-between px-[0.5vw] py-[0.4vw] hover:bg-gray-50 rounded-[0.3vw] transition-colors cursor-pointer group"
                                            onClick={() => { if (onNavigate) { speakText(heading.title); onNavigate(heading.page - 1); } }}
                                        >
                                            <div className="flex items-center gap-[0.4vw] truncate flex-1 min-w-0">
                                                <span className="text-[0.75vw] font-bold truncate"
                                                    style={{ color: bodyTextColor }}
                                                >
                                                    {addSerialNumberHeading ? `${hIdx + 1}. ` : ''}{heading.title}
                                                </span>
                                            </div>
                                            {addPageNumber && (
                                                <span className="text-[0.68vw] font-bold flex-shrink-0 ml-[0.4vw] tabular-nums"
                                                    style={{ color: bodyTextColor, opacity: 0.8 }}
                                                >
                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                </span>
                                            )}
                                        </div>

                                        {heading.subheadings?.map((sub, sIdx) => (
                                            <div
                                                key={sub.id}
                                                className="flex items-center justify-between px-[0.5vw] py-[0.3vw] hover:bg-gray-50 rounded-[0.3vw] transition-colors cursor-pointer group pl-[1.2vw]"
                                                onClick={() => { if (onNavigate) { speakText(sub.title); onNavigate(sub.page - 1); } }}
                                            >
                                                <div className="flex items-center gap-[0.4vw] truncate flex-1 min-w-0">
                                                    <span className="text-[0.68vw] font-medium truncate"
                                                        style={{ color: bodyTextColor, opacity: 0.9 }}
                                                    >
                                                        {sub.title}
                                                    </span>
                                                </div>
                                                {addPageNumber && (
                                                    <span className="text-[0.62vw] font-bold flex-shrink-0 ml-[0.4vw] tabular-nums"
                                                        style={{ color: bodyTextColor, opacity: 0.6 }}
                                                    >
                                                        {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                                {filteredContent.length === 0 && (
                                    <div className="text-[0.8vw] text-center py-[1vw] font-medium"
                                        style={{ color: bodyTextColor, opacity: 0.6 }}
                                    >
                                        No Table Of Content Found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const getPositionStyle = () => {
        if (isMobile) {
            if (isLandscape) {
                if (Number(activeLayout) === 1) return { bottom: '35px', left: '25px' };
                if (Number(activeLayout) === 3) return { top: '32px', right: '25%' };
                if (Number(activeLayout) === 2) return { top: '40px', left: '32%' };
                return { top: '6vh', left: '28%' };
            }
            if (Number(activeLayout) === 1) return { top: '16vh', right: '24px' };
            if (Number(activeLayout) === 2) return { top: '125px', left: '18px' };
            if (Number(activeLayout) === 3) {
                const isRealMobileView = window.innerWidth <= 768;
                return { top: isRealMobileView ? '125px' : '165px', left: '8px' };
            }
            if (Number(activeLayout) === 6) return { top: '120px', left: '52px' };
            return { top: '6.5rem', left: '50%', transform: 'translateX(-50%)' };
        }
        if (activeLayout === 1 || activeLayout === 'Layout1') return isTablet ? { bottom: '3.8vw', left: '2.2vw' } : { bottom: '8vh', left: '1vw' };
        if (activeLayout === 2 || activeLayout === 'Layout2') {
            const isNativeFullscreen = !!document.fullscreenElement;
            if (!isEditor || isNativeFullscreen) {
                return { top: '8.5vh', left: 'calc(50% - 11vw)', transform: 'translateX(-50%)' };
            }
            const leftPos = isSidebarOpen ? 'calc(50% + 8vw)' : 'calc(50% - 4.5vw)';
            return isTablet ? { top: '15.5vh', left: 'calc(50% - 9vw)', transform: 'translateX(-50%)' } : { top: '15.5vh', left: leftPos, transform: 'translateX(-50%)' };
        }
        if (activeLayout === 3 || activeLayout === 'Layout3') {
            if (isMobilePortraitOverride) {
                return { top: '23vh', left: 'calc(50% - 6.5vw)', transform: 'translateX(-50%) scale(0.85)', transformOrigin: 'top center' };
            }
            const isNativeFullscreen = !!document.fullscreenElement;
            if (!isEditor || isNativeFullscreen) {
                return { top: '7.5vh', left: 'calc(50% - 7vw)', transform: 'translateX(-50%)' };
            }
            const leftPos = isSidebarOpen ? 'calc(50% + 8.5vw)' : 'calc(50% - 1.5vw)';
            const topPos = isTablet ? '15vh' : '15.8vh';
            return { top: topPos, left: leftPos, transform: 'translateX(-50%)' };
        }
        if (activeLayout === 6 || activeLayout === 'Layout6') return { top: '8.5vh', left: '2.2vw' };
        if (activeLayout === 5) return { bottom: '11.5vh', left: 'calc(50% - 1vw)', transform: 'translateX(-50%)' };
        if (activeLayout === 4) return { top: '10.5vh', left: '4.5vw' };
        if (activeLayout === 8) return { top: '8.5vh', left: 'calc(50% - 10vw)', transform: 'translateX(-50%)' };
        return isTablet ? { bottom: '3.8vw', left: '2vw' } : { bottom: '8vh', left: '1vw' };
    };

    if (isMobile && isLandscape && isLayout3) {
        return (
            <div
                className="absolute inset-0 z-[3000] flex items-start justify-end pt-[18vh] pr-[15vw] pointer-events-auto"
                onClick={onClose}
            >
                <div
                    className="animate-in zoom-in-95 duration-200 pointer-events-auto"
                    style={{ transform: 'scale(0.6)', transformOrigin: 'top center' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white rounded-[1vw] shadow-2xl overflow-hidden w-[13vw]">
                        <div
                            className="rounded-[1vw] p-[0.8vw] w-full relative flex flex-col"
                            style={{ backgroundColor: `rgba(var(--toc-bg-rgb, 87, 92, 156), calc(0.2 + var(--toc-bg-opacity, 1) * 0.8))` }}
                        >
                            <div className="relative z-10">
                                {/* Header */}
                                <div className="flex items-center gap-[0.5vw] mb-[0.6vw]">
                                    <h2 className="text-[0.85vw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}>
                                        Table of Contents
                                    </h2>
                                    <div className="h-[1px] flex-1" style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.3)' }} />
                                </div>

                                {/* Search */}
                                {addSearch && (
                                    <div className="mb-[0.6vw] relative">
                                        <Icon
                                            icon="lucide:search"
                                            className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 w-[0.7vw] h-[0.7vw]"
                                            style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.7)' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full rounded-full pl-[1.8vw] pr-[0.5vw] py-[0.2vw] text-[0.75vw] outline-none border border-white/10 transition-colors placeholder:text-current placeholder:opacity-60"
                                            style={{
                                                color: getLayoutColor('toc-text', '#FFFFFF'),
                                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                            }}
                                        />
                                    </div>
                                )}

                                {/* TOC List */}
                                <div
                                    ref={scrollContainerRef}
                                    className="flex flex-col gap-0.5 overflow-y-auto custom-scrollbar pr-1 max-h-[25vh]"
                                    style={initialHeight !== 'auto' ? { minHeight: initialHeight } : {}}
                                >
                                    {filteredContent.map((heading, hIdx) => (
                                        <React.Fragment key={heading.id}>
                                            <div
                                                className="flex items-center justify-between px-[0.6vw] py-[0.4vw] hover:bg-white/10 rounded-md transition-colors cursor-pointer group"
                                                onClick={() => { speakText(heading.title); onNavigate && onNavigate(heading.page - 1); }}
                                            >
                                                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                    <span className="text-[0.85vw] font-bold truncate" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}>
                                                        {addSerialNumberHeading && <span className="mr-1">{hIdx + 1}.</span>}
                                                        {heading.title}
                                                    </span>
                                                </div>
                                                {addPageNumber && (
                                                    <span className="text-[0.78vw] font-bold flex-shrink-0 ml-2 tabular-nums" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.8)' }}>
                                                        {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                    </span>
                                                )}
                                            </div>
                                            {heading.subheadings?.map((sub, sIdx) => (
                                                <div
                                                    key={sub.id}
                                                    className="flex items-center justify-between px-[0.6vw] py-[0.3vw] ml-[1.2vw] hover:bg-white/10 rounded-md transition-colors cursor-pointer group"
                                                    onClick={() => { speakText(sub.title); onNavigate && onNavigate(sub.page - 1); }}
                                                >
                                                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                        <span className="text-[0.78vw] font-semibold truncate" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.9)' }}>
                                                            {addSerialNumberSubheading && <span className="mr-1">{hIdx + 1}.{sIdx + 1}.</span>}
                                                            {sub.title}
                                                        </span>
                                                    </div>
                                                    {addPageNumber && (
                                                        <span className="text-[0.72vw] font-bold flex-shrink-0 ml-2 tabular-nums" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.6)' }}>
                                                            {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    {filteredContent.length === 0 && (
                                        <div className="text-[0.8vw] text-center py-[1vw] font-medium" style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 0.5 }}>
                                            No Table Of Content Found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Layout 3 Unified Style: fully responsive for both Desktop and Mobile
    if (isLayout3) {
        return (
            <>
                <div className="fixed inset-0 z-[1000] pointer-events-auto bg-transparent" onClick={onClose} />
                <div
                    className="fixed z-[9999] pointer-events-auto"
                    style={getPositionStyle()}
                >
                    <div
                        className={`bg-white ${isMobile ? 'rounded-[12px] w-[180px]' : isTablet ? 'rounded-[0.3vw] w-[12vw]' : 'rounded-[0.5vw] w-[14vw]'} shadow-[0_0.5vw_2vw_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 ${isMobile ? '' : 'scale-90 origin-top'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={`${isMobile ? 'rounded-[12px] p-[8px]' : isTablet ? 'rounded-[0.3vw] p-[0.4vw]' : 'rounded-[0.5vw] p-[0.4vw]'} w-full flex flex-col`}
                            style={{ backgroundColor: `rgba(var(--toc-bg-rgb, 87, 92, 156), calc(0.2 + var(--toc-bg-opacity, 1) * 0.8))` }}
                        >
                            {/* Header */}
                            <div className={`flex items-center ${isMobile ? 'mb-[12px] px-[4px] pt-[4px]' : isTablet ? 'gap-[0.6vw] mb-[0.6vw] px-[0.4vw] pt-[0.2vw]' : 'gap-[0.8vw] mb-[0.8vw] px-[0.6vw] pt-[0.4vw]'}`}>
                                <h2 className={`${isMobile ? 'text-[11px]' : isTablet ? 'text-[0.9vw]' : 'text-[1vw]'} font-bold whitespace-nowrap tracking-tight`} style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}>
                                    Table of Contents
                                </h2>
                            </div>

                            {/* Search */}
                            {addSearch && (
                                <div className={`mb-[0.6vw] relative ${isMobile ? 'mb-[12px] px-[4px]' : isTablet ? 'px-[0.4vw]' : 'px-[0.6vw]'}`}>
                                    <Icon
                                        icon="lucide:search"
                                        className={`absolute ${isMobile ? 'left-[12px] w-[14px] h-[14px]' : isTablet ? 'left-[0.8vw] w-[0.8vw] h-[0.8vw]' : 'left-[1.2vw] w-[1vw] h-[1vw]'} top-1/2 -translate-y-1/2`}
                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.6)' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`w-full ${isMobile ? 'rounded-[12px] pl-[28px] pr-[8px] py-[4px] text-[10px]' : isTablet ? 'rounded-[0.4vw] pl-[1.6vw] pr-[0.6vw] py-[0.4vw] text-[0.7vw]' : 'rounded-[0.4vw] pl-[2vw] pr-[0.8vw] py-[0.5vw] text-[0.8vw]'} outline-none transition-colors placeholder:text-current placeholder:opacity-60`}
                                        style={{
                                            color: getLayoutColor('toc-text', '#FFFFFF'),
                                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                        }}
                                    />
                                </div>
                            )}

                            {/* TOC List */}
                            <div
                                ref={scrollContainerRef}
                                className={`flex flex-col ${isMobile ? 'gap-[4px] max-h-[160px]' : 'gap-[0.2vw] max-h-[25vh]'} overflow-y-auto custom-scrollbar`}
                                style={initialHeight !== 'auto' ? { minHeight: initialHeight } : {}}
                            >
                                {filteredContent.map((heading, hIdx) => (
                                    <React.Fragment key={heading.id}>
                                        <div
                                            className={`flex items-center justify-between ${isMobile ? 'px-[8px] py-[6px] rounded-[6px]' : isTablet ? 'px-[0.6vw] py-[0.5vw] rounded-[0.3vw]' : 'px-[0.8vw] py-[0.6vw] rounded-[0.4vw]'} hover:bg-white/10 transition-colors cursor-pointer group`}
                                            onClick={() => { if (onNavigate) { onNavigate(heading.page - 1); onClose(); } }}
                                        >
                                            <div className={`flex items-center ${isMobile ? 'gap-[6px]' : isTablet ? 'gap-[0.4vw]' : 'gap-[0.6vw]'} truncate flex-1 min-w-0`}>
                                                <span className={`${isMobile ? 'text-[10px]' : isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-normal truncate tracking-tight`} style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}>
                                                    {addSerialNumberHeading && <span className={`${isMobile ? 'mr-[4px]' : isTablet ? 'mr-[0.3vw]' : 'mr-[0.4vw]'}`}>{hIdx + 1}.</span>}
                                                    {heading.title}
                                                </span>
                                            </div>
                                            {addPageNumber && (
                                                <span className={`${isMobile ? 'text-[9px] ml-[8px]' : isTablet ? 'text-[0.7vw] ml-[0.6vw]' : 'text-[0.8vw] ml-[0.6vw]'} font-normal flex-shrink-0 tabular-nums`} style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.8)' }}>
                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                </span>
                                            )}
                                        </div>
                                        {heading.subheadings?.map((sub, sIdx) => (
                                            <div
                                                key={sub.id}
                                                className={`flex items-center justify-between ${isMobile ? 'px-[8px] py-[4px] ml-[12px] rounded-[6px]' : isTablet ? 'px-[0.6vw] py-[0.4vw] ml-[1vw] rounded-[0.3vw]' : 'px-[0.8vw] py-[0.5vw] ml-[1.2vw] rounded-[0.4vw]'} hover:bg-white/10 transition-colors cursor-pointer group`}
                                                onClick={() => { if (onNavigate) { onNavigate(sub.page - 1); onClose(); } }}
                                            >
                                                <div className={`flex items-center ${isMobile ? 'gap-[6px]' : isTablet ? 'gap-[0.4vw]' : 'gap-[0.6vw]'} truncate flex-1 min-w-0`}>
                                                    <span className={`${isMobile ? 'text-[9.5px]' : isTablet ? 'text-[0.65vw]' : 'text-[0.75vw]'} font-normal truncate tracking-tight`} style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.9)' }}>
                                                        {addSerialNumberSubheading && <span className={`${isMobile ? 'mr-[4px]' : isTablet ? 'mr-[0.3vw]' : 'mr-[0.4vw]'}`}>{hIdx + 1}.{sIdx + 1}.</span>}
                                                        {sub.title}
                                                    </span>
                                                </div>
                                                {addPageNumber && (
                                                    <span className={`${isMobile ? 'text-[8.5px] ml-[8px]' : isTablet ? 'text-[0.6vw] ml-[0.6vw]' : 'text-[0.7vw] ml-[0.6vw]'} font-normal flex-shrink-0 tabular-nums`} style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.6)' }}>
                                                        {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                                {filteredContent.length === 0 && (
                                    <div className={`${isMobile ? 'text-[11px] py-[16px]' : isTablet ? 'text-[0.7vw] py-[0.8vw]' : 'text-[0.8vw] py-[1vw]'} text-center font-medium`} style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 0.5 }}>
                                        No Table Of Content Found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Layout 1 Style: use absolute positioning (fixed breaks inside transformed containers)
    if (isLayout1) {
        return (
            <>
                <div className="absolute inset-0 z-[1005] pointer-events-auto" onClick={onClose} />
                <div
                    className={`absolute ${isMobile ? 'top-[175px] right-[15px]' : isTablet ? 'bottom-[60px] left-[15px]' : 'bottom-[8vh] left-[1vw]'} z-[1006] pointer-events-auto`}
                >
                    <div
                        className={`${isMobile ? 'rounded-2xl w-[235px]' : isTablet ? 'rounded-[8px] w-[170px]' : 'rounded-[0.7vw] w-[13vw]'} shadow-2xl overflow-hidden relative backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200`}
                        style={{
                            backgroundColor: `rgba(var(--toc-bg-rgb, 87, 92, 156), calc(var(--toc-bg-opacity, 1) * 0.8))`,
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`${isMobile ? 'p-3.5' : isTablet ? 'p-[10px]' : 'p-[1vw]'} w-full relative h-full`}>
                            {/* Header */}
                            <div className={`text-center ${isMobile ? 'mb-2.5' : isTablet ? 'mb-[8px]' : 'mb-[0.8vw]'} px-[0.5vw]`}>
                                <h2 className={`${isMobile ? 'text-[15px]' : isTablet ? 'text-[13px]' : 'text-[1vw]'} font-semibold ${isMobile ? 'mb-1.5' : isTablet ? 'mb-[6px]' : 'mb-[0.5vw]'}`}
                                    style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}
                                >
                                    Table of Contents
                                </h2>
                                <div className={`h-[0.5px] ${isMobile ? 'w-[calc(100%+28px)] ml-[-14px]' : isTablet ? 'w-[calc(100%+20px)] ml-[-10px]' : 'w-[calc(100%+2vw)] ml-[-1vw]'}`}
                                    style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 0.2 }}
                                />
                            </div>

                            {/* Search */}
                            {addSearch && (
                                <div className={`${isMobile ? 'mb-3' : 'mb-3'} relative px-[0.5vw]`}>
                                    <Icon
                                        icon="lucide:search"
                                        className={`absolute ${isMobile ? 'left-3.5' : isTablet ? 'left-[12px]' : 'left-[1.2vw]'} top-1/2 -translate-y-1/2 ${isMobile ? 'w-4 h-4' : isTablet ? 'w-[12px] h-[12px]' : 'w-[0.85vw] h-[0.85vw]'}`}
                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.7)' }}
                                    />
                                    <style>{`
                                        .toc-search-input::placeholder {
                                            color: ${getLayoutColor('toc-text', '#FFFFFF')};
                                            opacity: 0.5;
                                        }
                                    `}</style>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className={`toc-search-input w-full rounded-full ${isMobile ? 'pl-9 pr-3 py-1.5 text-[11px]' : isTablet ? 'pl-[28px] pr-[10px] py-[5px] text-[10px]' : 'pl-[2.2vw] pr-[0.8vw] py-[0.35vw] text-[0.75vw]'} outline-none border transition-colors`}
                                        style={{
                                            color: getLayoutColor('toc-text', '#FFFFFF'),
                                            backgroundColor: isLightColor(tocBgHex) ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.2)',
                                            borderColor: isLightColor(tocBgHex) ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.3)',
                                            opacity: 'var(--toc-text-opacity, 1)',
                                        }}
                                    />
                                </div>
                            )}

                            {/* TOC List */}
                            <div
                                ref={scrollContainerRef}
                                className={`flex flex-col gap-0.5 overflow-y-auto custom-scrollbar pr-1 ${isMobile ? 'max-h-[220px]' : 'max-h-[15vw]'}`}
                                style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: 'rgba(255,255,255,0.3) transparent',
                                    ...(initialHeight !== 'auto' ? { minHeight: initialHeight } : {})
                                }}
                            >
                                {filteredContent.map((heading, hIdx) => (
                                    <React.Fragment key={heading.id}>
                                        <div
                                            className={`flex items-center justify-between ${isMobile ? 'px-2 py-2' : isTablet ? 'px-[8px] py-[6px]' : 'px-[0.6vw] py-[0.4vw]'} hover:bg-white/10 rounded-md transition-colors cursor-pointer group`}
                                            onClick={() => { speakText(heading.title); onNavigate && onNavigate(heading.page - 1); }}
                                        >
                                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                <span className={`${isMobile ? 'text-[14px]' : isTablet ? 'text-[11px]' : 'text-[0.85vw]'} font-bold truncate`}
                                                    style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}
                                                >
                                                    {addSerialNumberHeading && <span className="mr-1">{hIdx + 1}.</span>}
                                                    {heading.title}
                                                </span>
                                            </div>
                                            {addPageNumber && (
                                                <span className={`${isMobile ? 'text-[12px]' : isTablet ? 'text-[10px]' : 'text-[10px]'} font-bold flex-shrink-0 ml-2 tabular-nums`}
                                                    style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.8)' }}
                                                >
                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                </span>
                                            )}
                                        </div>
                                        {heading.subheadings?.map((sub, sIdx) => (
                                            <div
                                                key={sub.id}
                                                className={`flex items-center justify-between ${isMobile ? 'px-2 py-1.5 ml-4' : isTablet ? 'px-[8px] py-[4px] ml-[14px]' : 'px-[0.6vw] py-[0.4vw] ml-[1.2vw]'} hover:bg-white/10 rounded-md transition-colors cursor-pointer group`}
                                                onClick={() => { speakText(sub.title); onNavigate && onNavigate(sub.page - 1); }}
                                            >
                                                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                    <span className={`${isMobile ? 'text-[12px]' : isTablet ? 'text-[10px]' : 'text-[10px]'} font-medium truncate`}
                                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.9)' }}
                                                    >
                                                        {addSerialNumberSubheading && <span className="mr-1">{hIdx + 1}.{sIdx + 1}</span>}
                                                        {sub.title}
                                                    </span>
                                                </div>
                                                {addPageNumber && (
                                                    <span className={`${isMobile ? 'text-[11px]' : 'text-[9px]'} font-bold flex-shrink-0 ml-2 tabular-nums`}
                                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.6)' }}
                                                    >
                                                        {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                                {filteredContent.length === 0 && (
                                    <div className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} text-center py-4 font-medium`}
                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.5)' }}
                                    >
                                        No Table Of Content Found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="fixed inset-0 z-[1000] pointer-events-auto" onClick={onClose} />
            <div
                className="fixed z-[9999] pointer-events-auto"
                style={getPositionStyle()}
            >
                <div
                    className={`
                        ${isLayout2 || (isMobile && isLandscape && !isLayout1)
                            ? 'backdrop-blur-xl border border-white/50 p-1 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
                            : isLayout1
                                ? `${isMobile ? `rounded-2xl ${isLandscape ? 'w-[150px]' : 'w-[190px]'}` : 'rounded-[1.2vw] w-[13vw]'} shadow-2xl overflow-hidden relative backdrop-blur-xl`
                                : `rounded-[1vw] shadow-2xl ${isMobile ? 'p-3 w-[280px]' : 'p-[0.8vw] ' + (Number(activeLayout) === 6 ? 'w-[17.5vw]' : Number(activeLayout) === 4 ? 'w-[18vw]' : 'w-[13vw]')}`
                        } 
                        animate-in fade-in slide-in-from-top-4 duration-200
                        ${(isMobile && !isLandscape && Number(activeLayout) === 5) ? 'w-[280px]' : ''}
                    `}
                    style={{
                        backgroundColor: (isLayout1) ? `rgba(var(--toc-bg-rgb, 87, 92, 156), calc(var(--toc-bg-opacity, 1) * 0.8))` : (isLayout2 || (isMobile && isLandscape) ? undefined : getLayoutColorRgba('toc-bg', '87, 92, 156', '0.8')),
                        border: isLayout1 ? '1px solid rgba(255, 255, 255, 0.2)' : undefined
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={(isLayout2 || (isMobile && isLandscape && !isLayout1)) ? 'rounded-lg bg-white overflow-hidden' : ''}>
                        <div
                            className={(isLayout2 || (isMobile && isLandscape && !isLayout1)) ? `rounded-lg ${isMobile ? ((isLandscape) ? 'p-[0.5vw] w-[10vw]' : 'p-2.5 w-[170px]') : 'p-3 w-[200px]'} relative flex flex-col` : (isLayout1 ? `${isMobile ? 'p-2' : 'p-[1vw]'} w-full relative h-full` : '')}
                            style={{ backgroundColor: (isLayout2 || (isMobile && isLandscape && !isLayout1)) ? `rgba(var(--toc-bg-rgb, 87, 92, 156), calc(0.2 + var(--toc-bg-opacity, 1) * 0.8))` : 'transparent' }}
                        >
                            <div>
                                {/* Header Section */}
                                {(isLayout2 || (isMobile && isLandscape && !isLayout1)) ? (
                                    <div className={`flex items-center gap-2 ${isMobile && isLandscape ? 'mb-[0.5vw]' : isMobile ? 'mb-2.5 mr-[-0.625rem]' : 'mb-3 mr-[-0.75rem]'}`}>
                                        <h2 className={`${isMobile && isLandscape ? 'text-[0.7vw]' : isMobile ? 'text-[14px]' : 'text-[1vw]'} font-semibold whitespace-nowrap`} style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}>
                                            Table of Contents
                                        </h2>
                                        <div className="h-[1px] flex-1" style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.3)' }} />
                                    </div>
                                ) : (
                                    <div className={`text-center ${isMobile ? 'mb-2 px-2' : 'mb-[0.8vw] px-[0.5vw]'}`}>
                                        <h2 className={`${isMobile ? 'text-[14px]' : 'text-[0.95vw]'} font-semibold ${isMobile ? 'mb-1' : 'mb-[0.5vw]'}`}
                                            style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}
                                        >
                                            Table of Contents
                                        </h2>
                                        <div className="h-[0.5px] w-[calc(100%+2vw)] ml-[-1vw]"
                                            style={{ backgroundColor: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 0.2)' }}
                                        ></div>
                                    </div>
                                )}

                                {addSearch && (
                                    <div className={`relative ${isMobile ? 'mb-3 px-0' : 'mb-3 px-[0.5vw]'}`}>
                                        <Icon
                                            icon="lucide:search"
                                            className={`absolute ${isMobile ? (isLandscape ? 'left-[1vw]' : 'left-3') : 'left-[1.2vw]'} top-1/2 -translate-y-1/2 ${isMobile ? (isLandscape ? 'w-[0.6vw] h-[0.6vw]' : 'w-3.5 h-3.5') : 'w-[0.85vw] h-[0.85vw]'}`}
                                            style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.9)' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            className={`w-full rounded-full ${isMobile ? (isLandscape ? 'pl-[1.8vw] pr-[0.5vw] py-[0.2vw] text-[0.65vw]' : 'pl-7 pr-3 py-1 text-[10px]') : 'pl-[2.2vw] pr-[0.8vw] py-[0.35vw] text-[0.75vw]'} outline-none border border-white/10 transition-colors placeholder:text-current placeholder:opacity-70`}
                                            style={{
                                                color: getLayoutColor('toc-text', '#FFFFFF'),
                                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                                opacity: 'var(--toc-text-opacity, 1)',
                                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                    </div>
                                )}

                                <div
                                    ref={scrollContainerRef}
                                    className={`flex flex-col gap-0.5 overflow-y-auto custom-scrollbar pr-1 ${isMobile ? (isLandscape ? 'max-h-[13vh]' : 'max-h-[155px]') : (isLayout2 ? 'max-h-[25vh]' : Number(activeLayout) === 6 ? 'h-[75vh] max-h-[75vh]' : 'max-h-[12vw]')}`}
                                    style={{
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: 'rgba(255,255,255,0.3) transparent',
                                        ...(initialHeight !== 'auto' ? { minHeight: initialHeight } : {})
                                    }}
                                >
                                    {(() => {
                                        const displayContent = filteredContent;

                                        return (
                                            <>
                                                {displayContent.map((heading, hIdx) => (
                                                    <React.Fragment key={heading.id}>
                                                        <div
                                                            className={`flex items-center justify-between ${isMobile && isLandscape ? 'px-[0.4vw] py-[0.3vw]' : isMobile ? 'px-2 py-1' : 'px-[0.6vw] py-[0.4vw]'} hover:bg-black/5 rounded-md transition-colors cursor-pointer group`}
                                                            onClick={() => { speakText(heading.title); onNavigate && onNavigate(heading.page - 1); }}
                                                        >
                                                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                                <span className={`${isMobile && isLandscape ? 'text-[0.7vw]' : isMobile ? 'text-[11px]' : 'text-[0.85vw]'} ${isLayout2 ? 'font-light' : 'font-bold'} truncate`}
                                                                    style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'var(--toc-text-opacity, 1)' }}
                                                                >
                                                                    {addSerialNumberHeading && (
                                                                        <span className="mr-1">{hIdx + 1}.</span>
                                                                    )}
                                                                    {heading.title}
                                                                </span>
                                                            </div>
                                                            {addPageNumber && (
                                                                <span className={`${isMobile && isLandscape ? 'text-[0.65vw]' : isMobile ? 'text-[10px]' : 'text-[10px]'} font-bold flex-shrink-0 ml-2 tabular-nums opacity-80`}
                                                                    style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.8)' }}
                                                                >
                                                                    {heading.page < 10 ? `0${heading.page}` : heading.page}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {heading.subheadings?.map((sub, sIdx) => (
                                                            <div
                                                                key={sub.id}
                                                                className={`flex items-center justify-between ${isMobile && isLandscape ? 'px-[0.4vw] py-[0.2vw] ml-[1vw]' : isMobile ? 'px-2 py-0.5 ml-4' : 'px-[0.6vw] py-[0.4vw] ml-[1.2vw]'} hover:bg-white/10 rounded-md transition-colors cursor-pointer group`}
                                                                onClick={() => { speakText(sub.title); onNavigate && onNavigate(sub.page - 1); }}
                                                            >
                                                                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                                    <span className={`${isMobile && isLandscape ? 'text-[0.65vw]' : isMobile ? 'text-[10px]' : 'text-[10px]'} ${isLayout2 ? 'font-light' : 'font-medium'} truncate flex items-center`}
                                                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.9)' }}
                                                                    >
                                                                        {addSerialNumberSubheading && (
                                                                            <span className="mr-1">{hIdx + 1}.{sIdx + 1}</span>
                                                                        )}
                                                                        {sub.title}
                                                                    </span>
                                                                </div>
                                                                {addPageNumber && (
                                                                    <span className={`${isMobile && isLandscape ? 'text-[0.6vw]' : isMobile ? 'text-[9px]' : 'text-[9px]'} font-bold flex-shrink-0 ml-2 tabular-nums opacity-60`}
                                                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.6)' }}
                                                                    >
                                                                        {sub.page < 10 ? `0${sub.page}` : sub.page}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                                {displayContent.length === 0 && (
                                                    <div className="text-[10px] text-center py-4 font-medium"
                                                        style={{ color: getLayoutColor('toc-text', '#FFFFFF'), opacity: 'calc(var(--toc-text-opacity, 1) * 0.5)' }}
                                                    >
                                                        No Table Of Content Found
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TableOfContentsPopup;



