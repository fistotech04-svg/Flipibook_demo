
import React, { useEffect, useRef, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { resolveUploadsPath } from '../../../utils/supabaseUtils';

import classicBookFlipSound from '../../../assets/Audios/Classic book flip.mp3';
import hardCoverPageSound from '../../../assets/Audios/Hard cover page.mp3';
import softCoverPageSound from '../../../assets/Audios/Soft cover page.mp3';
import bgSound1 from '../../../assets/Audios/bg music1.mp3';
import bgSound2 from '../../../assets/Audios/bg music2.mp3';
import bgSound3 from '../../../assets/Audios/bg music3.mp3';
import bgSound4 from '../../../assets/Audios/bg music4.mp3';
import TabletLayoutSound from '../Tablet/TabletLayouts/TabletLayoutSound';

// --- Shared Helper for RGBA Colors ---
const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
    `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;

const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
};

const isLightColor = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
    let c = hex.substring(1).toUpperCase();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return false;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.7;
};

const getShade = (hex, weight = 0.6) => {
    if (!hex || hex === 'transparent' || !hex.startsWith('#')) return hex;
    let c = hex.substring(1).toUpperCase();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return hex;
    let r = parseInt(c.slice(0, 2), 16);
    let g = parseInt(c.slice(2, 4), 16);
    let b = parseInt(c.slice(4, 6), 16);
    r = Math.round(r * (1 - weight));
    g = Math.round(g * (1 - weight));
    b = Math.round(b * (1 - weight));
    const toHex = x => x.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

// --- Layout Components ---

const MobileLayout = ({
    activeLayout, isLandscape, flipSoundMasterEnabled, isFlipActive,
    handleFlipClick, flipWidth, bgSoundMasterEnabled, isBgActive,
    handleBgClick, bgWidth, handleVolumeDrag }) => {
    const isLayout2 = activeLayout == 2;
    const isLayout3 = activeLayout == 3;

    if (isLayout3) {
        return (
            <div
                className="animate-in fade-in zoom-in-95 duration-200 pointer-events-auto outline-none"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#FFFFFF',
                    width: '135px',
                    borderRadius: '8px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    border: 'none',
                    overflow: 'hidden',
                    backdropFilter: 'blur(12px)',
                    padding: '0',
                }}
            >
                <div
                    className="w-full h-full rounded-[inherit] overflow-hidden"
                    style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '1') }}
                >
                    <div className="flex flex-col gap-2.5 p-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <h2 className="text-[12px]" style={{ color: getLayoutColorRgba('dropdown-text', '0, 0, 0', 1), opacity: 'var(--dropdown-text-opacity, 1)', fontWeight: 'bold' }}>Sound</h2>
                        </div>
                        {/* Flip */}
                        <div className="flex items-center gap-2.5">
                            <button
                                className={`flex-shrink-0 w-[20px] h-[20px] flex items-center justify-center transition-all duration-300 rounded-full bg-transparent ${flipSoundMasterEnabled ? 'hover:bg-white/10 active:scale-95' : 'cursor-not-allowed opacity-40'}`}
                                onClick={handleFlipClick}
                                onTouchEnd={(e) => {
                                    // prevent double fire
                                    if (e.cancelable) e.preventDefault();
                                    handleFlipClick(e);
                                }}
                                disabled={!flipSoundMasterEnabled}
                            >
                                <Icon
                                    icon="mingcute:volume-line"
                                    className="w-[18px] h-[18px]"
                                    style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: isFlipActive ? 1 : 0.4 }}
                                />
                            </button>
                            <div className="flex-1 h-[2px] rounded-full relative" style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                                <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                                    <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: '10px', height: '10px', backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                                </div>
                            </div>
                        </div>
                        {/* BG */}
                        <div className="flex items-center gap-2.5">
                            <button
                                className={`flex-shrink-0 w-[20px] h-[20px] flex items-center justify-center transition-all duration-300 rounded-full bg-transparent ${bgSoundMasterEnabled ? 'hover:bg-white/10 active:scale-95' : 'cursor-not-allowed opacity-40'}`}
                                onClick={handleBgClick}
                                onTouchEnd={(e) => {
                                    if (e.cancelable) e.preventDefault();
                                    handleBgClick(e);
                                }}
                                disabled={!bgSoundMasterEnabled}
                            >
                                <svg
                                    width="100%"
                                    height="100%"
                                    viewBox="0 0 21 23"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-[16px] h-[16px]"
                                    style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: isBgActive ? 1 : 0.4 }}
                                >
                                    <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                                </svg>
                            </button>
                            <div className="flex-1 h-[2px] rounded-full relative" style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                                <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                                    <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: '10px', height: '10px', backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`fisto-menu-content shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 outline-none ${isLayout2
                ? 'p-1 rounded-[1.2rem] bg-white w-[180px]'
                : (isLayout3
                    ? 'w-[140px] rounded-[1rem] bg-white border border-gray-100 p-3 shadow-2xl relative'
                    : 'w-[180px] rounded-xl border border-white/10 flex flex-col gap-4 p-4'
                )
                }`}
            onClick={(e) => e.stopPropagation()}
            style={(!isLayout2 && !isLayout3) ? {
                backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
                backdropFilter: 'blur(12px)'
            } : {}}
        >
            <div className={isLayout2 ? "bg-white rounded-[1rem] overflow-hidden w-full h-full" : ""}>
                <div className={isLayout2 ? "bg-[#575C9C] rounded-[1rem] p-4 flex flex-col gap-4" : (isLayout3 ? "flex flex-col gap-3" : "flex flex-col gap-4")} style={isLayout2 ? { backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.2 + var(--dropdown-bg-opacity, 1) * 0.8))" } : {}}>
                    {/* Title Header */}
                    <div className="flex flex-col items-center mb-0.5">
                        <h2 className="text-[13px] font-bold tracking-wide" style={{ color: isLayout3 ? '#3E4491' : getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>Sound</h2>
                        <div className={`h-[1px] w-full mt-1.5 ${isLayout3 ? 'bg-[#3E4491]/10' : ''}`} style={!isLayout3 ? { backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: 0.1 } : {}} />
                    </div>

                    {/* Flip Sound Control */}
                    <div className="flex items-center gap-3">
                        <button
                            className={`flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled
                                ? (isFlipActive
                                    ? (isLayout3 ? 'bg-[#3E4491]' : 'shadow-inner')
                                    : (isLayout3 ? 'bg-[#3E4491]/10 border border-[#3E4491]/20' : 'bg-transparent hover:bg-black/5'))
                                : (isLayout3 ? 'bg-gray-50 opacity-40' : 'bg-transparent cursor-not-allowed opacity-40')
                                }`}
                            style={(!isLayout3 && isFlipActive) ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                            onClick={handleFlipClick}
                            onTouchEnd={(e) => {
                                if (e.cancelable) e.preventDefault();
                                handleFlipClick(e);
                            }}
                            disabled={!flipSoundMasterEnabled}
                        >
                            <Icon
                                icon={activeLayout == 2 ? "mingcute:volume-line" : "iconoir:sound-low-solid"}
                                className="w-3.5 h-3.5"
                                style={{ color: isLayout3 && !isFlipActive ? '#3E4491' : getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                            />
                        </button>
                        <div className={`flex-1 h-1 rounded-full relative ${isLayout3 ? 'bg-gray-100' : ''}`} style={{ ...(!isLayout3 ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) } : {}), cursor: "pointer", touchAction: "none" }} onPointerDown={(e) => handleVolumeDrag(e, "flip")} onTouchStart={(e) => handleVolumeDrag(e, "flip")}>
                            <div
                                className={`absolute inset-y-0 left-0 transition-all duration-75 rounded-full ${isLayout3 ? 'bg-[#3E4491]' : ''}`}
                                style={{ width: flipWidth, backgroundColor: !isLayout3 ? getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) : undefined }}
                            >
                                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: '12px', height: '12px', backgroundColor: isLayout3 ? '#3E4491' : getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                            </div>
                        </div>
                    </div>

                    {/* Background Sound Control */}
                    <div className="flex items-center gap-3">
                        <button
                            className={`flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled
                                ? (isBgActive
                                    ? (isLayout3 ? 'bg-[#3E4491]' : 'shadow-inner')
                                    : (isLayout3 ? 'bg-[#3E4491]/10 border border-[#3E4491]/20' : 'bg-transparent hover:bg-black/5'))
                                : (isLayout3 ? 'bg-gray-50 opacity-40' : 'bg-transparent cursor-not-allowed opacity-40')
                                }`}
                            style={(!isLayout3 && isBgActive) ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                            onClick={handleBgClick}
                            onTouchEnd={(e) => {
                                if (e.cancelable) e.preventDefault();
                                handleBgClick(e);
                            }}
                            disabled={!bgSoundMasterEnabled}
                        >
                            {activeLayout == 2 ? (
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 21 23"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                                >
                                    <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                                </svg>
                            ) : (
                                <Icon
                                    icon="solar:music-notes-bold"
                                    className="w-3.5 h-3.5"
                                    style={{ color: isLayout3 && !isBgActive ? '#3E4491' : getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                                />
                            )}
                        </button>
                        <div className={`flex-1 h-1 rounded-full relative ${isLayout3 ? 'bg-gray-100' : ''}`} style={{ ...(!isLayout3 ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) } : {}), cursor: "pointer", touchAction: "none" }} onPointerDown={(e) => handleVolumeDrag(e, "bg")} onTouchStart={(e) => handleVolumeDrag(e, "bg")}>
                            <div
                                className={`absolute inset-y-0 left-0 transition-all duration-75 rounded-full ${isLayout3 ? 'bg-[#3E4491]' : ''}`}
                                style={{ width: bgWidth, backgroundColor: !isLayout3 ? getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) : undefined }}
                            >
                                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: '12px', height: '12px', backgroundColor: isLayout3 ? '#3E4491' : getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Layout1 = ({
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, handleVolumeDrag, isTablet, activeLayout
}) => (
    <div
        className="fisto-menu-content animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: `rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(var(--dropdown-bg-opacity, 1) * 0.8))`,
            width: isTablet ? '144px' : '11vw',
            borderRadius: '0.7vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            padding: isTablet ? '6px 13px 13px' : '0.5vw 1vw 1vw',
        }}
    >
        <div className={isTablet ? "flex flex-col gap-[13px]" : "flex flex-col gap-[0.8vw]"}>
            <div className="text-center mb-[0.5vw] px-[0.5vw]">
                <h2 className={isTablet ? "text-[11px] font-semibold mb-[3px]" : "text-[0.95vw] font-semibold mb-[0.3vw]"}
                    style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                >
                    Sound
                </h2>
                <div className="h-[0.5px] w-[calc(100%+2vw)] ml-[-1vw]"
                    style={{ backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: 0.2 }}
                />
            </div>
            <div className={isTablet ? "flex items-center gap-[10px]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[19px] h-[19px]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'shadow-inner' : 'bg-transparent hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                    style={isFlipActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="mingcute:volume-line" className={isTablet ? "w-[13px] h-[13px]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                </button>
                <div className={isTablet ? "flex-1 h-[2px] rounded-full relative" : "flex-1 h-[0.15vw] rounded-full relative"} style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                    <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isTablet ? '7px' : '0.6vw', height: isTablet ? '7px' : '0.6vw', backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                    </div>
                </div>
            </div>
            <div className={isTablet ? "flex items-center gap-[10px]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[19px] h-[19px]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'shadow-inner' : 'bg-transparent hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                    style={isBgActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 21 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={isTablet ? "w-[10px] h-[10px]" : "w-[0.9vw] h-[0.9vw]"}
                        style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                    >
                        <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                    </svg>
                </button>
                <div className={isTablet ? "flex-1 h-[2px] rounded-full relative" : "flex-1 h-[0.15vw] rounded-full relative"} style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                    <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isTablet ? '7px' : '0.6vw', height: isTablet ? '7px' : '0.6vw', backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                    </div>
                </div>
            </div>
        </div>
    </div>
);



const Layout2 = ({
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, handleVolumeDrag, isTablet
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-1 top-[60px] duration-300 bg-white/60 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        style={{
            width: isTablet ? '112px' : '11vw',
            borderRadius: '0.5vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.5)',
            overflow: 'hidden',
            padding: isTablet ? '2px' : '0.2vw',
        }}
    >
        <div className="rounded-[0.5vw] bg-white overflow-hidden">
            <div className={`rounded-[0.5vw] ${isTablet ? 'p-[10px] gap-[10px]' : 'p-[1vw] gap-[1vw]'} relative flex flex-col`} style={{ backgroundColor: "rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.2 + var(--dropdown-bg-opacity, 1) * 0.8))", width: isTablet ? '112px' : '11vw' }}>
                <div className={isTablet ? "flex items-center gap-[5px] mb-[3px]" : "flex items-center gap-[0.5vw] mb-[0.4vw]"}>
                    <h2 className={isTablet ? "text-[8px] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 1)" }}>Sound</h2>
                    <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: "var(--dropdown-text, #FFFFFF)", opacity: "var(--dropdown-text-opacity, 0.3)" }} />
                </div>
                {/* Flip */}
                <div className={isTablet ? "flex items-center gap-[10px]" : "flex items-center gap-[1vw]"}>
                    <button
                        className={`flex-shrink-0 ${isTablet ? 'w-[19px] h-[19px]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'shadow-inner' : 'bg-transparent hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                        style={isFlipActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                        onClick={handleFlipClick}
                        disabled={!flipSoundMasterEnabled}
                    >
                        <Icon icon="mingcute:volume-line" className={isTablet ? "w-[13px] h-[13px]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                    </button>
                    <div className={isTablet ? "flex-1 h-[2px] rounded-full relative" : "flex-1 h-[0.15vw] rounded-full relative"} style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                        <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isTablet ? '7px' : '0.6vw', height: isTablet ? '7px' : '0.6vw', backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                        </div>
                    </div>
                </div>
                {/* BG */}
                <div className={isTablet ? "flex items-center gap-[10px]" : "flex items-center gap-[1vw]"}>
                    <button
                        className={`flex-shrink-0 ${isTablet ? 'w-[19px] h-[19px]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'shadow-inner' : 'bg-transparent hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                        style={isBgActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                        onClick={handleBgClick}
                        disabled={!bgSoundMasterEnabled}
                    >
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 21 23"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={isTablet ? "w-[10px] h-[10px]" : "w-[0.9vw] h-[0.9vw]"}
                            style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                        >
                            <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                        </svg>
                    </button>
                    <div className={isTablet ? "flex-1 h-[2px] rounded-full relative" : "flex-1 h-[0.15vw] rounded-full relative"} style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                        <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isTablet ? '7px' : '0.6vw', height: isTablet ? '7px' : '0.6vw', backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const Layout3 = ({
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, handleVolumeDrag, isTablet
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: '#FFFFFF',
            width: isTablet ? '128px' : '10vw',
            borderRadius: '0.5vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: 'none',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            padding: '0',
        }}
    >
        <div
            className="w-full h-full rounded-[inherit] overflow-hidden"
            style={{ backgroundColor: `rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(0.2 + var(--dropdown-bg-opacity, 1) * 0.8))` }}
        >
            <div className={isTablet ? "flex flex-col gap-[8px] p-[8px]" : "flex flex-col gap-[0.7vw] p-[0.7vw]"}>
                <div className={isTablet ? "flex items-center gap-[5px] mb-[3px]" : "flex items-center gap-[0.5vw] mb-[0.3vw]"}>
                    <h2 className={isTablet ? "text-[11px]" : "text-[0.9vw]"} style={{ color: getLayoutColorRgba('dropdown-text', '0, 0, 0', 1), opacity: 'var(--dropdown-text-opacity, 1)', fontWeight: 'bold' }}>Sound</h2>
                </div>
                {/* Flip */}
                <div className={isTablet ? "flex items-center gap-[10px]" : "flex items-center gap-[1vw]"}>
                    <button
                        className={`flex-shrink-0 ${isTablet ? 'w-[13px] h-[13px]' : 'w-[1.2vw] h-[1.2vw]'} flex items-center justify-center transition-all duration-300 rounded-full bg-transparent ${flipSoundMasterEnabled ? 'hover:bg-white/10' : 'cursor-not-allowed opacity-40'}`}
                        onClick={handleFlipClick}
                        disabled={!flipSoundMasterEnabled}
                    >
                        <Icon
                            icon="mingcute:volume-line"
                            className={isTablet ? "w-[10px] h-[10px]" : "w-[0.9vw] h-[0.9vw]"}
                            style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: isFlipActive ? 1 : 0.4 }}
                        />
                    </button>
                    <div className={isTablet ? "flex-1 h-[2px] rounded-full relative" : "flex-1 h-[0.15vw] rounded-full relative"} style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                        <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isTablet ? '7px' : '0.6vw', height: isTablet ? '7px' : '0.6vw', backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                        </div>
                    </div>
                </div>
                {/* BG */}
                <div className={isTablet ? "flex items-center gap-[10px]" : "flex items-center gap-[1vw]"}>
                    <button
                        className={`flex-shrink-0 ${isTablet ? 'w-[13px] h-[13px]' : 'w-[1.2vw] h-[1.2vw]'} flex items-center justify-center transition-all duration-300 rounded-full bg-transparent ${bgSoundMasterEnabled ? 'hover:bg-white/10' : 'cursor-not-allowed opacity-40'}`}
                        onClick={handleBgClick}
                        disabled={!bgSoundMasterEnabled}
                    >
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 21 23"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={isTablet ? "w-[10px] h-[10px]" : "w-[0.9vw] h-[0.9vw]"}
                            style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: isBgActive ? 1 : 0.4 }}
                        >
                            <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                        </svg>
                    </button>
                    <div className={isTablet ? "flex-1 h-[2px] rounded-full relative" : "flex-1 h-[0.15vw] rounded-full relative"} style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                        <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isTablet ? '7px' : '0.6vw', height: isTablet ? '7px' : '0.6vw', backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const Layout4 = ({
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, handleVolumeDrag, isTablet, isMobile
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            width: isMobile ? '150px' : (isTablet ? '128px' : '10vw'),
            borderRadius: '0',
            boxShadow: isMobile ? '0 8px 30px rgba(0,0,0,0.15)' : '0 0.5vw 2vw rgba(0,0,0,0.15)',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
        }}
    >
        <div
            className={isMobile ? "flex flex-col gap-[10px]" : (isTablet ? "flex flex-col gap-[6px]" : "flex flex-col gap-[0.6vw]")}
            style={{
                backgroundColor: `rgba(var(--dropdown-bg-rgb, 255, 255, 255), calc(0.4 + var(--dropdown-bg-opacity, 1) * 0.6))`,
                backdropFilter: 'blur(10px)',
                padding: isMobile ? '12px 16px' : (isTablet ? '8px 11px' : '0.7vw 1vw'),
            }}
        >
            <div className={isMobile ? "flex items-center gap-[8px]" : (isTablet ? "flex items-center gap-[5px]" : "flex items-center gap-[0.5vw]")}>
                <h2 className={isMobile ? "text-[12px] font-bold whitespace-nowrap" : (isTablet ? "text-[8px] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap")} style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>Sound</h2>
                <div className={isMobile ? "h-[1px] flex-1 mt-[2px]" : "h-[1px] flex-1 mt-[0.1vw]"} style={{ backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: 0.3 }} />
            </div>
            <div className={isMobile ? "flex items-center gap-[12px]" : (isTablet ? "flex items-center gap-[10px]" : "flex items-center gap-[1vw]")}>
                <button
                    className={`flex-shrink-0 ${isMobile ? 'w-[20px] h-[20px]' : (isTablet ? 'w-[19px] h-[19px]' : 'w-[1.8vw] h-[1.8vw]')} flex items-center justify-center transition-all duration-300 rounded-none ${flipSoundMasterEnabled ? (isFlipActive ? 'shadow-inner' : 'bg-transparent hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                    style={isFlipActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="iconoir:sound-low-solid" className={isMobile ? "w-[16px] h-[16px]" : (isTablet ? "w-[13px] h-[13px]" : "w-[1.2vw] h-[1.2vw]")} style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                </button>
                <div className={isMobile ? "flex-1 h-[2px] rounded-none relative" : (isTablet ? "flex-1 h-[2px] rounded-none relative" : "flex-1 h-[0.15vw] rounded-none relative")} style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                    <div className="absolute inset-0 transition-all duration-75 rounded-none" style={{ width: flipWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isMobile ? '8px' : (isTablet ? '7px' : '0.6vw'), height: isMobile ? '8px' : (isTablet ? '7px' : '0.6vw'), backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                    </div>
                </div>
            </div>
            <div className={isMobile ? "flex items-center gap-[12px]" : (isTablet ? "flex items-center gap-[10px]" : "flex items-center gap-[1vw]")}>
                <button
                    className={`flex-shrink-0 ${isMobile ? 'w-[20px] h-[20px]' : (isTablet ? 'w-[19px] h-[19px]' : 'w-[1.8vw] h-[1.8vw]')} flex items-center justify-center transition-all duration-300 rounded-none ${bgSoundMasterEnabled ? (isBgActive ? 'shadow-inner' : 'bg-transparent hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                    style={isBgActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="solar:music-notes-bold" className={isMobile ? "w-[14px] h-[14px]" : (isTablet ? "w-[10px] h-[10px]" : "w-[0.9vw] h-[0.9vw]")} style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                </button>
                <div className={isMobile ? "flex-1 h-[2px] rounded-none relative" : (isTablet ? "flex-1 h-[2px] rounded-none relative" : "flex-1 h-[0.15vw] rounded-none relative")} style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                    <div className="absolute inset-0 transition-all duration-75 rounded-none" style={{ width: bgWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isMobile ? '8px' : (isTablet ? '7px' : '0.6vw'), height: isMobile ? '8px' : (isTablet ? '7px' : '0.6vw'), backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const Layout5 = ({
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, handleVolumeDrag, isTablet, isMobile
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-2 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', 1),
            width: isMobile ? '160px' : (isTablet ? '160px' : '11.5vw'),
            borderRadius: isMobile ? '8px' : (isTablet ? '13px' : '0.5vw'),
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            overflow: 'visible',
            border: 'none',
            padding: isMobile ? '14px' : (isTablet ? '13px' : '1vw'),
        }}
    >
        <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-[0.6vw]'}`}>
            <div className={`flex items-center ${isMobile ? 'gap-2' : (isTablet ? 'gap-[8px]' : 'gap-[0.8vw]')}`}>
                <h2 className={isMobile ? 'text-[14px]' : (isTablet ? "text-[11px]" : "text-[0.9vw]")} style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), fontWeight: 'bold' }}>Sound</h2>
                <div className="flex-1 h-[2px] rounded-full" style={{ backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
            </div>
            {/* Volume / Flip Sound */}
            <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-[1vw]'}`}>
                <button
                    className={`flex-shrink-0 transition-all duration-300 rounded-full flex items-center justify-center ${isMobile ? 'w-[28px] h-[28px]' : (isTablet ? 'w-[29px] h-[29px]' : 'w-[2.2vw] h-[2.2vw]')} ${!flipSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                    style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1) }}
                >
                    <Icon
                        icon="mingcute:volume-line"
                        className={`${isMobile ? 'w-[16px] h-[16px]' : (isTablet ? 'w-[16px] h-[16px]' : 'w-[1.2vw] h-[1.2vw]')}`}
                        style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                    />
                </button>
                <div className="flex-1 h-[2px] rounded-full relative" style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                    <div
                        className="absolute inset-y-0 left-0 transition-all duration-75 rounded-full"
                        style={{ width: flipWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                    >
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isMobile ? '10px' : (isTablet ? '7px' : '0.6vw'), height: isMobile ? '10px' : (isTablet ? '7px' : '0.6vw'), backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                    </div>
                </div>
            </div>

            {/* Music / BG Sound */}
            <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-[1vw]'}`}>
                <button
                    className={`flex-shrink-0 transition-all duration-300 rounded-full flex items-center justify-center ${isMobile ? 'w-[28px] h-[28px]' : (isTablet ? 'w-[29px] h-[29px]' : 'w-[2.2vw] h-[2.2vw]')} ${!bgSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                    style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1) }}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 21 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={`${isMobile ? 'w-[14px] h-[14px]' : (isTablet ? 'w-[16px] h-[16px]' : 'w-[1.2vw] h-[1.2vw]')}`}
                        style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                    >
                        <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                    </svg>
                </button>
                <div className="flex-1 h-[2px] rounded-full relative" style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                    <div
                        className="absolute inset-y-0 left-0 transition-all duration-75 rounded-full"
                        style={{ width: bgWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                    >
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isMobile ? '10px' : (isTablet ? '7px' : '0.6vw'), height: isMobile ? '10px' : (isTablet ? '7px' : '0.6vw'), backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                    </div>
                </div>
            </div>
        </div>
        <div
            className={`absolute ${isMobile ? '-bottom-[11px] right-[25%] translate-x-1/2' : '-bottom-[1.3vw] left-1/2 -translate-x-1/2'} z-10 pointer-events-none`}
            style={isMobile ? { width: '12px', height: '12px' } : { width: '0.9vw', height: '1.4vw' }}
        >
            <svg width="100%" height="100%" viewBox="0 0 10 20" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0L5 20L10 0" fill={getLayoutColorRgba('dropdown-bg', '87, 92, 156', 1)} />
            </svg>
        </div>
    </div>
);

const Layout6_OLD = ({
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, handleVolumeDrag, isTablet, isMobile
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: '#FFFFFF',
            width: isMobile ? '160px' : (isTablet ? '144px' : '12vw'),
            borderRadius: '0',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: 'none',
            overflow: 'hidden',
            padding: isMobile ? '14px' : (isTablet ? '13px' : '1vw'),
        }}
    >
        <div className="flex flex-col">
            {/* Header */}
            <div className={isMobile ? "flex items-center gap-[8px] mb-[12px]" : (isTablet ? "flex items-center gap-[8px] mb-[10px]" : "flex items-center gap-[0.8vw] mb-[1vw]")}>
                <h2 className={isMobile ? "text-[14px] font-bold" : (isTablet ? "text-[11px] font-bold" : "text-[1vw] font-bold")} style={{ color: '#3E4491' }}>Sound</h2>
                <div className={isMobile ? "h-[2px] flex-1 mt-[2px]" : "h-[2px] flex-1 mt-[0.1vw]"} style={{ backgroundColor: '#3E4491', opacity: 0.2 }} />
            </div>

            <div className={isMobile ? "flex flex-col gap-[12px]" : "flex flex-col gap-[0.8vw]"}>
                {/* Flip Sound Control */}
                <div className={isMobile ? "flex items-center gap-[12px]" : "flex items-center gap-[0.8vw]"}>
                    <button
                        className={`flex-shrink-0 transition-all duration-300 ${!flipSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-80'}`}
                        onClick={handleFlipClick}
                        disabled={!flipSoundMasterEnabled}
                        style={{
                            backgroundColor: '#E6E8F4',
                            width: isMobile ? '28px' : (isTablet ? '22px' : '1.8vw'),
                            height: isMobile ? '28px' : (isTablet ? '22px' : '1.8vw'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: isMobile ? '4px' : '0.2vw'
                        }}
                    >
                        <Icon
                            icon="mingcute:volume-line"
                            className={isMobile ? "w-[16px] h-[16px]" : (isTablet ? "w-[14px] h-[14px]" : "w-[1.1vw] h-[1.1vw]")}
                            style={{ color: '#3E4491', opacity: isFlipActive ? 1 : 0.4 }}
                        />
                    </button>
                    <div className={isMobile ? "flex-1 h-[3px] rounded-none relative" : "flex-1 h-[3px] rounded-none relative"} style={{ cursor: "pointer", backgroundColor: '#E6E8F4' }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                        <div
                            className="absolute inset-y-0 left-0 transition-all duration-75 rounded-none"
                            style={{ width: flipWidth, backgroundColor: '#3E4491' }}
                        >
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isMobile ? '10px' : (isTablet ? '7px' : '0.6vw'), height: isMobile ? '10px' : (isTablet ? '7px' : '0.6vw'), backgroundColor: '#3E4491' }} />
                        </div>
                    </div>
                </div>

                {/* Background Sound Control */}
                <div className={isMobile ? "flex items-center gap-[12px]" : "flex items-center gap-[0.8vw]"}>
                    <button
                        className={`flex-shrink-0 transition-all duration-300 ${!bgSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-80'}`}
                        onClick={handleBgClick}
                        disabled={!bgSoundMasterEnabled}
                        style={{
                            backgroundColor: '#E6E8F4',
                            width: isMobile ? '28px' : (isTablet ? '22px' : '1.8vw'),
                            height: isMobile ? '28px' : (isTablet ? '22px' : '1.8vw'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: isMobile ? '4px' : '0.2vw'
                        }}
                    >
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 21 23"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={isMobile ? "w-[14px] h-[14px]" : (isTablet ? "w-[14px] h-[14px]" : "w-[1.1vw] h-[1.1vw]")}
                            style={{ color: '#3E4491', opacity: isBgActive ? 1 : 0.4 }}
                        >
                            <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.2016 13.614 9.57022 13.4208C8.93883 13.2275 8.38466 12.8426 7.986 12.3201C7.58735 11.7976 7.36398 11.164 7.34731 10.5087C7.33063 9.85337 7.52187 9.20936 7.89389 8.66753C8.2659 8.1257 8.80007 7.71339 9.42145 7.48875C10.0428 7.2641 10.7196 7.23847 11.3558 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                        </svg>
                    </button>
                    <div className={isMobile ? "flex-1 h-[3px] rounded-none relative" : "flex-1 h-[3px] rounded-none relative"} style={{ cursor: "pointer", backgroundColor: '#E6E8F4' }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                        <div
                            className="absolute inset-y-0 left-0 transition-all duration-75 rounded-none"
                            style={{ width: bgWidth, backgroundColor: '#3E4491' }}
                        >
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isMobile ? '10px' : (isTablet ? '7px' : '0.6vw'), height: isMobile ? '10px' : (isTablet ? '7px' : '0.6vw'), backgroundColor: '#3E4491' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const Layout6 = ({
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, handleVolumeDrag, isTablet, activeLayout, isMobile
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
            backdropFilter: 'blur(12px)',
            width: isMobile ? '160px' : (isTablet ? '152px' : '11.5vw'),
            borderRadius: isMobile ? '12px' : (isTablet ? '8px' : '0.6vw'),
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
        }}
    >
        <div
            className={`flex flex-col ${isMobile ? 'gap-[12px]' : 'gap-[1vw]'}`}
            style={{
                backgroundColor: 'transparent',
                padding: isMobile ? '16px' : (isTablet ? '14px 12px' : '1.1vw 0.9vw'),
            }}
        >
            {/* Header */}
            <div className={isMobile ? "flex items-center gap-[6px]" : (isTablet ? "flex items-center gap-[8px]" : "flex items-center gap-[0.8vw]")}>
                <h2 className={isMobile ? "text-[12px] font-bold tracking-wide" : (isTablet ? "text-[14px] font-bold tracking-wide" : "text-[1.05vw] font-bold tracking-wide")} style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>Sound</h2>
                <div className={isMobile ? "h-[1px] flex-1 mt-[2px]" : "h-[1px] flex-1 mt-[0.1vw]"} style={{ backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: 0.2 }} />
            </div>

            {/* Volume / Flip Sound */}
            <div className={isMobile ? "flex items-center gap-[12px]" : "flex items-center gap-[1.2vw]"}>
                <button
                    className={`flex-shrink-0 transition-all duration-300 ${!flipSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon
                        icon="mingcute:volume-line"
                        className={`${isMobile ? 'w-[16px] h-[16px]' : (isTablet ? 'w-[16px] h-[16px]' : 'w-[1.4vw] h-[1.4vw]')}`}
                        style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: isFlipActive ? 1 : 0.4 }}
                    />
                </button>
                <div className="flex-1 h-[2px] rounded-full relative" style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', '0.1'), opacity: isFlipActive ? 1 : 0.4 }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                    <div
                        className="absolute inset-y-0 left-0 transition-all duration-75 rounded-full"
                        style={{ width: flipWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                    >
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isMobile ? '10px' : (isTablet ? '7px' : '0.6vw'), height: isMobile ? '10px' : (isTablet ? '7px' : '0.6vw'), backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                    </div>
                </div>
            </div>

            {/* Music / BG Sound */}
            <div className={isMobile ? "flex items-center gap-[12px]" : "flex items-center gap-[1.2vw]"}>
                <button
                    className={`flex-shrink-0 transition-all duration-300 ${!bgSoundMasterEnabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 21 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={`${isMobile ? 'w-[16px] h-[16px]' : (isTablet ? 'w-[16px] h-[16px]' : 'w-[1.4vw] h-[1.4vw]')}`}
                        style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: isBgActive ? 1 : 0.4 }}
                    >
                        <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                    </svg>
                </button>
                <div className="flex-1 h-[2px] rounded-full relative" style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', '0.1'), opacity: isBgActive ? 1 : 0.4 }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                    <div
                        className="absolute inset-y-0 left-0 transition-all duration-75 rounded-full"
                        style={{ width: bgWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                    >
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: isMobile ? '10px' : (isTablet ? '7px' : '0.6vw'), height: isMobile ? '10px' : (isTablet ? '7px' : '0.6vw'), backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const Layout7 = ({
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, handleVolumeDrag, isTablet, isMobile
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: '#FFFFFF',
            width: isMobile ? '180px' : (isTablet ? '112px' : '11vw'),
            borderRadius: isMobile ? '8px' : '0.8vw',
            boxShadow: isMobile ? '0 4px 20px rgba(0,0,0,0.18)' : '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            padding: '0',
        }}
    >
        <div className={isMobile ? "w-full px-3 py-2" : (isTablet ? "w-full px-[8px] py-[5px] mb-[10px]" : "w-full px-[0.8vw] py-[0.4vw] mb-[0.8vw]")} style={{ backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', 1) }}>
            <h2 className={isMobile ? "text-[12px] font-bold tracking-wide" : (isTablet ? "text-[8px] font-bold tracking-wide" : "text-[0.75vw] font-bold tracking-wide")} style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>Sound</h2>
        </div>
        <div className={isMobile ? "flex flex-col gap-3 px-3 pb-4 pt-2" : (isTablet ? "flex flex-col gap-[10px] px-[10px] pb-[13px]" : "flex flex-col gap-[0.8vw] px-[0.8vw] pb-[1vw]")}>
            {/* Flip */}
            <div className={isMobile ? "flex items-center gap-2" : (isTablet ? "flex items-center gap-[8px]" : "flex items-center gap-[0.8vw]")}>
                <button
                    className={isMobile ? "flex-shrink-0 w-5 h-5 flex items-center justify-center transition-all duration-300 rounded-full" : (isTablet ? "flex-shrink-0 w-[16px] h-[16px] flex items-center justify-center transition-all duration-300 rounded-full" : "flex-shrink-0 w-[1.5vw] h-[1.5vw] flex items-center justify-center transition-all duration-300 rounded-full")}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                    style={isFlipActive ? { backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', 1) } : { backgroundColor: '#f3f4f6' }}
                >
                    <Icon icon="mingcute:volume-line" className={isMobile ? "w-3.5 h-3.5" : (isTablet ? "w-[11px] h-[11px]" : "w-[1vw] h-[1vw]")} style={{ color: isFlipActive ? '#FFFFFF' : getLayoutColorRgba('dropdown-bg', '87, 92, 156', 1), opacity: !isFlipActive ? 0.4 : 1 }} />
                </button>
                <div className={isMobile ? "flex-1 h-1 rounded-full relative overflow-hidden" : (isTablet ? "flex-1 h-[2px] rounded-full relative overflow-hidden" : "flex-1 h-[0.12vw] rounded-full relative overflow-hidden")} style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-bg', '85,85,85', 0.15) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                    <div className="absolute inset-0 transition-all duration-75 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', 1) }} />
                </div>
            </div>
            {/* BG */}
            <div className={isMobile ? "flex items-center gap-2" : (isTablet ? "flex items-center gap-[8px]" : "flex items-center gap-[0.8vw]")}>
                <button
                    className={isMobile ? "flex-shrink-0 w-5 h-5 flex items-center justify-center transition-all duration-300 rounded-full" : (isTablet ? "flex-shrink-0 w-[16px] h-[16px] flex items-center justify-center transition-all duration-300 rounded-full" : "flex-shrink-0 w-[1.5vw] h-[1.5vw] flex items-center justify-center transition-all duration-300 rounded-full")}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                    style={isBgActive ? { backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', 1) } : { backgroundColor: '#f3f4f6' }}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 21 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={isMobile ? "w-3.5 h-3.5" : (isTablet ? "w-[8px] h-[8px]" : "w-[0.8vw] h-[0.8vw]")}
                        style={{ color: isBgActive ? '#FFFFFF' : getLayoutColorRgba('dropdown-bg', '87, 92, 156', 1), opacity: !isBgActive ? 0.4 : 1 }}
                    >
                        <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                    </svg>
                </button>
                <div className={isMobile ? "flex-1 h-1 rounded-full relative overflow-hidden" : (isTablet ? "flex-1 h-[2px] rounded-full relative overflow-hidden" : "flex-1 h-[0.12vw] rounded-full relative overflow-hidden")} style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-bg', '85,85,85', 0.15) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                    <div className="absolute inset-0 transition-all duration-75 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', 1) }} />
                </div>
            </div>
        </div>
    </div>
);

const Layout8 = ({
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, handleVolumeDrag, isTablet
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300 relative group"
        onClick={(e) => e.stopPropagation()}
        style={{
            width: isTablet ? '144px' : '10vw',
            aspectRatio: '250/270',
            filter: 'drop-shadow(0 1vw 3vw rgba(0,0,0,0.3))'
        }}
    >
        {/* Unified SVG Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 250 270" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <defs>
                    <clipPath id="sound-shape-clip" clipPathUnits="objectBoundingBox">
                        <path
                            transform="scale(0.004, 0.0037037)"
                            d="M0 82 C0 75.37 5.37 70 12 70 H155 C170 70 175 60 175 40 V30 C175 10 192.5 0 212.5 0 C232.5 0 250 10 250 30 V258 C250 264.63 243.37 270 238 270 H12 C5.37 270 0 263.37 0 258 V82 Z"
                        />
                    </clipPath>
                </defs>
                <path
                    d="M0 82 C0 75.37 5.37 70 12 70 H155 C170 70 175 60 175 40 V30 C175 10 192.5 0 212.5 0 C232.5 0 250 10 250 30 V258 C250 264.63 243.37 270 238 270 H12 C5.37 270 0 263.37 0 258 V82 Z"
                    fill={getLayoutColorRgba('dropdown-bg', '87, 92, 156', 1)}
                    fillOpacity="0.6"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1.5"
                />
            </svg>
        </div>

        <div
            className="w-full h-full relative z-10 backdrop-blur-md flex flex-col justify-center gap-[0.5vw] pt-[3.6vw] px-[0.8vw]"
            style={{ clipPath: 'url(#sound-shape-clip)', WebkitClipPath: 'url(#sound-shape-clip)' }}
        >
            <div className={isTablet ? "flex items-center gap-[5px] mb-[3px]" : "flex items-center gap-[0.5vw] mb-[0.3vw]"}>
                <h2 className={isTablet ? "text-[10px] font-bold whitespace-nowrap" : "text-[0.8vw] font-bold whitespace-nowrap"} style={{ color: getLayoutColor('dropdown-icon', '#000000') }}>Sound</h2>
                <div className="h-[1px] flex-1 mt-[0.1vw]" style={{ backgroundColor: getLayoutColor('dropdown-icon', '#000000'), opacity: 0.15 }} />
            </div>
            {/* Flip */}
            <div className={isTablet ? "flex items-center gap-[10px]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[19px] h-[19px]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full`}
                    style={flipSoundMasterEnabled ? (isFlipActive ? { backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) } : { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }) : { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1), cursor: 'not-allowed' }}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="mingcute:volume-line" className={isTablet ? "w-[13px] h-[13px]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: isFlipActive ? getLayoutColorRgba('dropdown-bg', '0, 0, 0', 1) : getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: !isFlipActive ? 0.7 : 1 }} />
                </button>
                <div className="flex-1 h-[14px] relative flex items-center" style={{ cursor: "pointer" }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                    {/* Background line */}
                    <div className="absolute left-0 right-0 h-[3px] rounded-full top-1/2 -translate-y-1/2" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2), pointerEvents: 'none' }} />
                    {/* Active line */}
                    <div className="absolute left-0 h-[3px] transition-all duration-75 rounded-full top-1/2 -translate-y-1/2" style={{ width: flipWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), pointerEvents: 'none' }} />
                    {/* Thumb */}
                    <div className="absolute top-1/2 -translate-y-1/2 rounded-full shadow-md bg-white z-50 transition-all duration-75" style={{ left: `calc(${flipWidth} - 6px)`, width: '12px', height: '12px', border: '1px solid rgba(0,0,0,0.1)', pointerEvents: 'none' }} />
                </div>
            </div>
            {/* BG */}
            <div className={isTablet ? "flex items-center gap-[10px]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[19px] h-[19px]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full`}
                    style={bgSoundMasterEnabled ? (isBgActive ? { backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) } : { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }) : { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.1), cursor: 'not-allowed' }}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 21 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={isTablet ? "w-[10px] h-[10px]" : "w-[0.9vw] h-[0.9vw]"}
                        style={{ color: isBgActive ? getLayoutColorRgba('dropdown-bg', '0, 0, 0', 1) : getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: !isBgActive ? 0.7 : 1 }}
                    >
                        <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                    </svg>
                </button>
                <div className="flex-1 h-[14px] relative flex items-center" style={{ cursor: "pointer" }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                    {/* Background line */}
                    <div className="absolute left-0 right-0 h-[3px] rounded-full top-1/2 -translate-y-1/2" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2), pointerEvents: 'none' }} />
                    {/* Active line */}
                    <div className="absolute left-0 h-[3px] transition-all duration-75 rounded-full top-1/2 -translate-y-1/2" style={{ width: bgWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), pointerEvents: 'none' }} />
                    {/* Thumb */}
                    <div className="absolute top-1/2 -translate-y-1/2 rounded-full shadow-md bg-white z-50 transition-all duration-75" style={{ left: `calc(${bgWidth} - 6px)`, width: '12px', height: '12px', border: '1px solid rgba(0,0,0,0.1)', pointerEvents: 'none' }} />
                </div>
            </div>
        </div>
    </div>
);

const LayoutDefault = ({
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, handleVolumeDrag, isTablet
}) => (
    <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
            width: isTablet ? '112px' : '18vw',
            borderRadius: '1vw',
            boxShadow: '0 0.5vw 2vw rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            padding: isTablet ? '13px' : '1.2vw',
        }}
    >
        <div className={isTablet ? "flex flex-col gap-[13px]" : "flex flex-col gap-[1.2vw]"}>
            <div className={isTablet ? "flex items-center gap-[10px]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[19px] h-[19px]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'bg-[#4A3AFF]' : 'bg-white/20 border border-white/20') : 'bg-white/15 cursor-not-allowed opacity-75'}`}
                    onClick={handleFlipClick}
                    disabled={!flipSoundMasterEnabled}
                >
                    <Icon icon="iconoir:sound-low-solid" className={isTablet ? "w-[13px] h-[13px]" : "w-[1.2vw] h-[1.2vw]"} style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                </button>
                <div className={isTablet ? "flex-1 h-[2px] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                    <div className="absolute inset-0 transition-all duration-75 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                </div>
            </div>
            <div className={isTablet ? "flex items-center gap-[10px]" : "flex items-center gap-[1vw]"}>
                <button
                    className={`flex-shrink-0 ${isTablet ? 'w-[19px] h-[19px]' : 'w-[1.8vw] h-[1.8vw]'} flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-white/10 border-white/20 hover:bg-white/20') : 'bg-white/15 border-white/10 cursor-not-allowed opacity-75'}`}
                    onClick={handleBgClick}
                    disabled={!bgSoundMasterEnabled}
                >
                    <Icon icon="solar:music-notes-bold" className={isTablet ? "w-[10px] h-[10px]" : "w-[0.9vw] h-[0.9vw]"} style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                </button>
                <div className={isTablet ? "flex-1 h-[2px] rounded-full relative overflow-hidden" : "flex-1 h-[0.15vw] rounded-full relative overflow-hidden"} style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                    <div className="absolute inset-0 transition-all duration-75 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                </div>
            </div>
        </div>
    </div>
);



// --- Main Sound Component ---

const Sound = ({
    isOpen,
    onClose,
    activeLayout,
    otherSetupSettings,
    onUpdateOtherSetup,
    isMuted,
    setIsMuted,
    isFlipMuted,
    setIsFlipMuted,
    flipTrigger,
    settings,
    isTablet,
    isMobile,
    isLandscape,
    isEditor,
    isFullscreen,
    isSidebarOpen,
    isLoading = false
}) => {
    const bgAudioRef = useRef(null);
    const flipAudioRef = useRef(null);
    const lastBgSoundUrlRef = useRef('');
    const lastFlipSoundUrlRef = useRef('');
    const [backendSoundSettings, setBackendSoundSettings] = useState(null);

    const [dynamicPos, setDynamicPos] = useState({ left: 0, bottom: 0, ready: false });
    const layout = settings?.toolbar?.sound?.layout || activeLayout || 1;
    const soundContainerRef = useRef(null);

    useEffect(() => {
        if (isOpen && isTablet && layout === 1) {
            const updatePos = () => {
                const anchor = document.querySelector('.tablet-layout-1-sound-icon-anchor');
                if (anchor && soundContainerRef.current) {
                    const rect = anchor.getBoundingClientRect();
                    const containerRect = soundContainerRef.current.getBoundingClientRect();
                    const left = rect.left - containerRect.left + (rect.width / 2);
                    const bottom = containerRect.bottom - rect.top + 15;
                    setDynamicPos({ left, bottom, ready: true });
                } else {
                    setDynamicPos({ ready: false });
                }
            };

            // Initial positioning
            setTimeout(updatePos, 50);

            // Re-calculate on resize to make it responsive
            window.addEventListener('resize', updatePos);
            return () => window.removeEventListener('resize', updatePos);
        } else {
            setDynamicPos({ ready: false });
        }
    }, [isOpen, isTablet, layout]);

    const targetVId = settings?.v_id || settings?.vId || settings?.FlipbookInfo?.v_id || (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('shareId') || new URLSearchParams(window.location.search).get('v_id')) : null) || '';

    useEffect(() => {
        if (!targetVId) return;

        const fetchBackendSound = async () => {
            try {
                const getBackendUrl = () => {
                    if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
                    const origin = window.location.origin;
                    if (origin.includes('devtunnels.ms')) return origin.replace('-5173', '-5000');
                    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                        const portMatch = origin.match(/:(\d+)/);
                        if (portMatch) return origin.replace(portMatch[0], ':5000');
                    }
                    return 'http://localhost:5000';
                };
                const backendUrl = getBackendUrl();
                const res = await axios.get(`${backendUrl}/api/flipbook/public/get/${targetVId}`);
                if (res.data) {
                    const fetchedOther = res.data?.Customized_Settings?.otherSetup || res.data?.settings?.otherSetup || res.data?.Customized_Settings?.othersetup || res.data?.settings?.othersetup;
                    if (fetchedOther) {
                        setBackendSoundSettings(fetchedOther);
                    }
                }
            } catch (err) {
                console.log("Direct backend sound fetch info:", err?.message || err);
            }
        };

        fetchBackendSound();
    }, [targetVId]);

    // Handle Background Sound Logic
    useEffect(() => {
        if (!bgAudioRef.current) return;

        const getEffectiveSoundValue = (key) => {
            const v1 = otherSetupSettings?.sound?.[key];
            if (v1 !== undefined && v1 !== null && v1 !== '') return v1;
            const v2 = otherSetupSettings?.[key];
            if (v2 !== undefined && v2 !== null && v2 !== '') return v2;
            const v3 = settings?.otherSetup?.sound?.[key];
            if (v3 !== undefined && v3 !== null && v3 !== '') return v3;
            const v4 = settings?.otherSetup?.[key];
            if (v4 !== undefined && v4 !== null && v4 !== '') return v4;
            const v5 = settings?.menuBar?.media?.audioSettings?.[key];
            if (v5 !== undefined && v5 !== null && v5 !== '') return v5;
            const v6 = settings?.media?.audioSettings?.[key];
            if (v6 !== undefined && v6 !== null && v6 !== '') return v6;
            const v7 = backendSoundSettings?.sound?.[key];
            if (v7 !== undefined && v7 !== null && v7 !== '') return v7;
            const v8 = backendSoundSettings?.[key];
            if (v8 !== undefined && v8 !== null && v8 !== '') return v8;
            return undefined;
        };

        const bgSound = getEffectiveSoundValue('bgSound') || 'BG Sound 1';
        const customBgSounds = getEffectiveSoundValue('customBgSounds') || otherSetupSettings?.sound?.customBgSounds || backendSoundSettings?.sound?.customBgSounds || [];
        const bgSoundEnabled = getEffectiveSoundValue('bgSoundEnabled') !== false;
        const isEnabled = (settings?.media?.backgroundAudio ?? settings?.media?.audio ?? true) && !isMuted && bgSoundEnabled !== false && !isLoading;

        const rawBgStr = String(bgSound || '').trim();
        const normBgStr = rawBgStr.toLowerCase().replace(/[^a-z0-9]/g, '');

        let soundUrl = '';
        if (normBgStr === 'none') {
            soundUrl = '';
        } else if (normBgStr.includes('bgsound2') || normBgStr.includes('bgmusic2') || normBgStr === '2') {
            soundUrl = bgSound2;
        } else if (normBgStr.includes('bgsound3') || normBgStr.includes('bgmusic3') || normBgStr === '3') {
            soundUrl = bgSound3;
        } else if (normBgStr.includes('bgsound4') || normBgStr.includes('bgmusic4') || normBgStr === '4') {
            soundUrl = bgSound4;
        } else if (normBgStr.includes('bgsound1') || normBgStr.includes('bgmusic1') || normBgStr === '1') {
            soundUrl = bgSound1;
        } else {
            const custom = customBgSounds?.find(s =>
                String(s.id || '').toLowerCase() === rawBgStr.toLowerCase() ||
                String(s.label || '').toLowerCase() === rawBgStr.toLowerCase() ||
                String(s.name || '').toLowerCase() === rawBgStr.toLowerCase()
            );
            if (custom && custom.url) {
                soundUrl = resolveUploadsPath(custom.url);
            } else if (getEffectiveSoundValue('bgSoundFile')) {
                soundUrl = resolveUploadsPath(getEffectiveSoundValue('bgSoundFile'));
            } else if (rawBgStr && (rawBgStr.includes('/') || rawBgStr.includes('http') || rawBgStr.includes('.'))) {
                soundUrl = resolveUploadsPath(rawBgStr);
            } else {
                soundUrl = bgSound1;
            }
        }

        if (soundUrl && lastBgSoundUrlRef.current !== soundUrl) {
            lastBgSoundUrlRef.current = soundUrl;
            bgAudioRef.current.src = soundUrl;
            bgAudioRef.current.loop = true;
            try { bgAudioRef.current.load(); } catch (e) { }
        }

        if (isEnabled && soundUrl) {
            const playAudio = () => {
                if (bgAudioRef.current) {
                    bgAudioRef.current.play().catch(e => console.log("BG Audio play blocked", e));
                }
            };
            playAudio();

            // Retry playing on first user interaction if blocked by autoplay policies
            const handleInteraction = () => {
                if (bgAudioRef.current && bgAudioRef.current.paused) {
                    playAudio();
                }
                document.removeEventListener('click', handleInteraction);
                document.removeEventListener('touchstart', handleInteraction);
                document.removeEventListener('pointerdown', handleInteraction);
            };
            document.addEventListener('click', handleInteraction);
            document.addEventListener('touchstart', handleInteraction);
            document.addEventListener('pointerdown', handleInteraction);
        } else {
            bgAudioRef.current.pause();
        }
    }, [otherSetupSettings, backendSoundSettings, settings, isMuted, isLoading]);

    // Handle Flip Sound Source management
    useEffect(() => {
        if (!flipAudioRef.current) return;

        const getEffectiveSoundValue = (key) => {
            const v1 = otherSetupSettings?.sound?.[key];
            if (v1 !== undefined && v1 !== null && v1 !== '') return v1;
            const v2 = otherSetupSettings?.[key];
            if (v2 !== undefined && v2 !== null && v2 !== '') return v2;
            const v3 = settings?.otherSetup?.sound?.[key];
            if (v3 !== undefined && v3 !== null && v3 !== '') return v3;
            const v4 = settings?.otherSetup?.[key];
            if (v4 !== undefined && v4 !== null && v4 !== '') return v4;
            const v5 = settings?.menuBar?.media?.audioSettings?.[key];
            if (v5 !== undefined && v5 !== null && v5 !== '') return v5;
            const v6 = settings?.media?.audioSettings?.[key];
            if (v6 !== undefined && v6 !== null && v6 !== '') return v6;
            const v7 = backendSoundSettings?.sound?.[key];
            if (v7 !== undefined && v7 !== null && v7 !== '') return v7;
            const v8 = backendSoundSettings?.[key];
            if (v8 !== undefined && v8 !== null && v8 !== '') return v8;
            return undefined;
        };

        const flipSound = getEffectiveSoundValue('flipSound') || 'Soft Paper Flip';

        const rawFlipStr = String(flipSound || '').trim();
        const normFlipStr = rawFlipStr.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (normFlipStr === 'none') {
            flipAudioRef.current.src = '';
            return;
        }

        let url = '';
        if (normFlipStr.includes('softpaper') || normFlipStr.includes('softcover') || normFlipStr.includes('soft')) {
            url = softCoverPageSound;
        } else if (normFlipStr.includes('hardcover') || normFlipStr.includes('classicbook') || normFlipStr.includes('hard')) {
            url = hardCoverPageSound;
        } else if (normFlipStr.includes('classic')) {
            url = classicBookFlipSound;
        } else if (rawFlipStr && (rawFlipStr.includes('/') || rawFlipStr.includes('http') || rawFlipStr.includes('.'))) {
            url = resolveUploadsPath(rawFlipStr);
        } else {
            url = classicBookFlipSound;
        }

        if (url && lastFlipSoundUrlRef.current !== url) {
            lastFlipSoundUrlRef.current = url;
            flipAudioRef.current.src = url;
            try { flipAudioRef.current.load(); } catch (e) { }
        }
    }, [otherSetupSettings, backendSoundSettings, settings, isMuted, isLoading]);

    const canPlayFlipRef = useRef(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            canPlayFlipRef.current = true;
        }, 100); // 100ms initialization threshold
        return () => clearTimeout(timer);
    }, []);

    // Handle Playback Flip trigger
    const playFlipSound = useCallback(() => {
        if (!canPlayFlipRef.current) return;

        const soundObj = otherSetupSettings?.sound || backendSoundSettings?.sound || (otherSetupSettings && typeof otherSetupSettings === 'object' && (otherSetupSettings.flipSound || otherSetupSettings.bgSound) ? otherSetupSettings : (backendSoundSettings || {}));
        const flipEnabled = soundObj.flipSoundEnabled !== false;
        const isNone = soundObj.flipSound === 'None';
        if (flipAudioRef.current && !isFlipMuted && flipEnabled && !isNone) {
            if (!flipAudioRef.current.src) {
                flipAudioRef.current.src = classicBookFlipSound;
            }
            flipAudioRef.current.currentTime = 0;
            flipAudioRef.current.play().catch(e => console.log("Flip sound play blocked", e));
        }
    }, [isFlipMuted, otherSetupSettings, backendSoundSettings]);

    const prevFlipTriggerRef = useRef(flipTrigger);
    useEffect(() => {
        if (flipTrigger > prevFlipTriggerRef.current) {
            playFlipSound();
        }
        prevFlipTriggerRef.current = flipTrigger;
    }, [flipTrigger, playFlipSound]);

    const isFlipNone = otherSetupSettings?.sound?.flipSound === 'None';
    const isBgNone = otherSetupSettings?.sound?.bgSound === 'None';
    const flipSoundMasterEnabled = otherSetupSettings?.sound?.flipSoundEnabled !== false && !isFlipNone;
    const bgSoundMasterEnabled = otherSetupSettings?.sound?.bgSoundEnabled !== false && !isBgNone;
    const isFlipActive = flipSoundMasterEnabled && !isFlipMuted;
    const isBgActive = bgSoundMasterEnabled && !isMuted;

    const handleFlipClick = (e) => {
        e.stopPropagation();
        if (flipSoundMasterEnabled && setIsFlipMuted) {
            const nextMuteState = !isFlipMuted;
            setIsFlipMuted(nextMuteState);
            if (!nextMuteState && playFlipSound) {
                playFlipSound();
            }
        }
    };

    const handleBgClick = (e) => {
        e.stopPropagation();
        if (bgSoundMasterEnabled && setIsMuted) {
            setIsMuted(!isMuted);
        }
    };

    const [flipVolume, setFlipVolume] = useState(0.6);
    const [bgVolume, setBgVolume] = useState(0.8);

    useEffect(() => {
        if (flipAudioRef.current) flipAudioRef.current.volume = isFlipMuted ? 0 : flipVolume;
    }, [flipVolume, isFlipMuted]);


    useEffect(() => {
        if (bgAudioRef.current) bgAudioRef.current.volume = isMuted ? 0 : bgVolume;
    }, [bgVolume, isMuted]);

    const handleVolumeDrag = useCallback((e, type) => {
        e.stopPropagation();
        if (e.pointerId !== undefined) {
            e.currentTarget.setPointerCapture(e.pointerId);
        }

        const rect = e.currentTarget.getBoundingClientRect();

        const updateVolume = (clientX) => {
            let newVol = (clientX - rect.left) / rect.width;
            newVol = Math.max(0, Math.min(1, newVol));

            if (type === 'flip') {
                if (flipSoundMasterEnabled) {
                    setFlipVolume(newVol);
                    if (isFlipMuted && newVol > 0 && setIsFlipMuted) setIsFlipMuted(false);
                    if (newVol === 0 && !isFlipMuted && setIsFlipMuted) setIsFlipMuted(true);
                }
            } else {
                if (bgSoundMasterEnabled) {
                    setBgVolume(newVol);
                    if (isMuted && newVol > 0 && setIsMuted) setIsMuted(false);
                    if (newVol === 0 && !isMuted && setIsMuted) setIsMuted(true);
                }
            }
        };

        const initialClientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches.length > 0 ? e.touches[0].clientX : null);
        if (initialClientX !== null) {
            updateVolume(initialClientX);
        }

        const onMove = (moveEvent) => {
            const clientX = moveEvent.clientX !== undefined ? moveEvent.clientX : (moveEvent.touches && moveEvent.touches.length > 0 ? moveEvent.touches[0].clientX : null);
            if (clientX !== null) {
                updateVolume(clientX);
            }
        };

        const onUp = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onUp);
    }, [flipSoundMasterEnabled, isFlipMuted, setIsFlipMuted, bgSoundMasterEnabled, isMuted, setIsMuted]);

    const flipWidth = flipSoundMasterEnabled ? (isFlipActive ? `${flipVolume * 100}%` : '0%') : '0%';
    const bgWidth = bgSoundMasterEnabled ? (isBgActive ? `${bgVolume * 100}%` : '0%') : '0%';

    // Using layout declared at the top of the component

    const [anchorPos, setAnchorPos] = useState(null);

    useEffect(() => {
        if (isOpen && layout === 8) {
            const updatePos = () => {
                const anchor = document.getElementById('layout8-sound-icon-anchor');
                if (anchor) {
                    const rect = anchor.getBoundingClientRect();
                    setAnchorPos({
                        left: rect.left + rect.width / 2, // Center of the button
                        top: rect.top
                    });
                }
            };

            // Small timeout to wait for the DOM anchor to be fully rendered
            setTimeout(updatePos, 10);
            window.addEventListener('resize', updatePos);
            return () => window.removeEventListener('resize', updatePos);
        }
    }, [isOpen, layout]);

    const getInlineStyle = () => {
        const addTextBelowIcons = settings?.toolbar?.addTextBelowIcons;
        if (layout === 8) {
            if (anchorPos) {
                return {
                    position: 'fixed',
                    left: `${anchorPos.left}px`,
                    top: `${anchorPos.top}px`,
                    transform: `translateX(calc(-100% + ${isTablet ? '22px' : '1.5vw'})) translateY(calc(-9% + ${addTextBelowIcons ? '0.8vw' : '0vw'}))`,
                    zIndex: 90
                };
            }
            return { visibility: 'hidden' }; // Hide until position is calculated
        }
        return {};
    };

    const getPosition = () => {
        if (isMobile) return 'top-[150px] right-[16px]';
        if (layout === 2) return isTablet ? 'top-[8.5vh] left-[calc(50%_-_48px)] -translate-x-1/2' : 'top-[8.5vh] left-[calc(50%_-_4.5vw)] -translate-x-1/2';
        if (layout === 3) return 'top-[7.5vh] left-[calc(50%_+_0.2vw)] -translate-x-1/2';
        if (layout === 4) return isTablet ? 'top-[34vh] left-[48px]' : 'top-[34vh] left-[4.2vw]';
        if (layout === 5) {
            if (isFullscreen && document.fullscreenElement) return `bottom-[4.2vw] left-[calc(50%_+_19.7vw)] -translate-x-1/2`;
            return isSidebarOpen ? `bottom-[4.2vw] left-[calc(50%_+_2.2vw)] -translate-x-1/2` : `bottom-[4.2vw] left-[calc(50%_+_12.2vw)] -translate-x-1/2`;
        }
        if (layout === 6) return 'top-[42%] left-[5.5vw] -translate-y-1/2';
        const addTextBelowIcons = settings?.toolbar?.addTextBelowIcons;
        if (layout === 7) return addTextBelowIcons ? 'bottom-[10vh] left-[calc(50%_+_7.5vw)] -translate-x-1/2' : 'bottom-[7.5vh] left-[calc(50%_+_7.5vw)] -translate-x-1/2';

        // Default (Layout 1)
        return isTablet ? 'bottom-[3vw] right-[17vw]' : (isSidebarOpen ? 'bottom-[3.8vw] right-[18vw]' : 'bottom-[3.8vw] right-[25vw]');
    };

    const commonProps = {
        flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
        bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, handleVolumeDrag, isTablet, activeLayout
    };

    const renderPopupUI = () => {
        if (!isOpen) return null;

        if (isMobile) {
            if (isLandscape && activeLayout == 1) {
                return (
                    <div className="absolute inset-0 z-[160] flex items-end justify-end pointer-events-auto" style={{ paddingBottom: '45px', paddingRight: '22%' }} onClick={onClose}>
                        <div className="scale-[0.8] origin-bottom-right shadow-4xl shadow-black/30 bg-transparent" onClick={(e) => e.stopPropagation()}>
                            <Layout1 {...commonProps} />
                        </div>
                    </div>
                );
            }
            if (!isLandscape && Number(activeLayout) === 1) {
                return (
                    <div className="absolute inset-0 z-[3000] flex justify-end items-start pt-[215px] pr-[12px] pointer-events-auto" onClick={onClose}>
                        <div className="pointer-events-auto animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div style={{
                                width: '160px',
                                borderRadius: '12px',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                overflow: 'hidden',
                                backdropFilter: 'blur(12px)',
                                backgroundColor: `rgba(var(--dropdown-bg-rgb, 87, 92, 156), calc(var(--dropdown-bg-opacity, 1) * 0.8))`,
                                padding: '10px 16px 16px'
                            }}>
                                <div className="flex flex-col gap-3">
                                    <div className="text-center mb-1 px-2">
                                        <h2 className="text-[14px] font-semibold mb-1" style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                                            Sound
                                        </h2>
                                        <div className="h-[0.5px] w-[calc(100%+32px)] -ml-4" style={{ backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), opacity: 0.2 }} />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            className={`flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'shadow-inner' : 'bg-transparent hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                                            style={isFlipActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                                            onClick={handleFlipClick}
                                            disabled={!flipSoundMasterEnabled}
                                        >
                                            <Icon icon="mingcute:volume-line" className="w-[18px] h-[18px]" style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }} />
                                        </button>
                                        <div className="flex-1 h-[2px] rounded-full relative" style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                                            <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                                                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: '10px', height: '10px', backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            className={`flex-shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'shadow-inner' : 'bg-transparent hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                                            style={isBgActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {}}
                                            onClick={handleBgClick}
                                            disabled={!bgSoundMasterEnabled}
                                        >
                                            <svg
                                                width="100%"
                                                height="100%"
                                                viewBox="0 0 21 23"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-[14px] h-[14px]"
                                                style={{ color: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}
                                            >
                                                <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                                            </svg>
                                        </button>
                                        <div className="flex-1 h-[2px] rounded-full relative" style={{ cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                                            <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1) }}>
                                                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={{ width: '10px', height: '10px', backgroundColor: getLayoutColorRgba('dropdown-text', '255, 255, 255', 1), border: '1px solid rgba(0,0,0,0.1)' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
            const isLayout2 = activeLayout == 2;
            const isLayout3 = activeLayout == 3;
            const isLayout4 = activeLayout == 4;

            if (isLayout4) {
                return (
                    <div
                        className="absolute inset-0 z-[3000] flex justify-end items-center pr-[65px] pointer-events-auto"
                        onClick={onClose}
                    >
                        <div
                            className="pointer-events-auto animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Layout4 {...commonProps} isMobile={true} />
                        </div>
                    </div>
                );
            }

            const isLayout5 = activeLayout == 5;

            if (isLayout5 && !isLandscape) {
                return (
                    <div
                        className="absolute inset-0 z-[3000] flex justify-center items-end pb-[105px] pr-[80px] pointer-events-auto"
                        onClick={onClose}
                    >
                        <div
                            className="pointer-events-auto animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Layout5 {...commonProps} isMobile={true} />
                        </div>
                    </div>
                );
            }

            if (isLandscape && isLayout3) {
                return (
                    <div
                        className="absolute inset-0 z-[3000] flex items-start justify-end pt-[7vh] pr-[8vw] pointer-events-auto"
                        onClick={onClose}
                    >
                        <div
                            className="pointer-events-auto animate-in zoom-in-95 duration-200"
                            style={{ transform: 'scale(0.7)', transformOrigin: 'top center' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Layout3 {...commonProps} />
                        </div>
                    </div>
                );
            }

            const isLayout6_OLD = activeLayout == 6;
            if (isLayout6_OLD) {
                return (
                    <div
                        className={`absolute inset-0 z-[3000] flex justify-start items-center ${isLandscape ? 'pl-[55px]' : 'pl-[55px]'} pointer-events-auto`}
                        onClick={onClose}
                    >
                        <div
                            className="pointer-events-auto animate-in slide-in-from-left-4 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Layout6_OLD {...commonProps} isMobile={true} />
                        </div>
                    </div>
                );
            }

            const isLayout6 = activeLayout == 6;
            if (isLayout6) {
                return (
                    <div
                        className={`absolute inset-0 z-[3000] flex justify-start items-center pl-[70px] pointer-events-auto`}
                        onClick={onClose}
                    >
                        <div
                            className="pointer-events-auto animate-in slide-in-from-left-4 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Layout6 {...commonProps} isMobile={true} />
                        </div>
                    </div>
                );
            }
            if (activeLayout == 7 && isMobile && !isLandscape) {
                return (
                    <div
                        className="absolute inset-0 z-[3000] pointer-events-auto"
                        onClick={onClose}
                    >
                        <div
                            className="absolute bottom-[95px] left-[30px] pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Layout7 {...commonProps} isMobile={true} />
                        </div>
                    </div>
                );
            }
            if (activeLayout == 3) {
                return <Layout3Popup anchorId="layout3-music-icon-class" onClose={onClose} commonProps={commonProps} isLandscape={isLandscape} isEditor={isEditor} />;
            }

            return (
                <div
                    className={`absolute inset-0 z-[3000] flex ${isLayout2 ? `justify-start items-end pb-[7.5rem] ${isLandscape ? 'pl-[42%]' : 'pl-4'}` : 'justify-end items-start pt-[150px] pr-[16px]'} pointer-events-auto`}
                    onClick={onClose}
                >
                    <div
                        style={isLayout2 && isLandscape ? { transform: 'scale(0.75)', transformOrigin: 'bottom left' } : {}}
                        className="pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MobileLayout {...commonProps} isLandscape={isLandscape} />
                    </div>
                </div>
            );
        }

        if (isTablet && [1, 2, 3, 4, 5, 7, 8, 9].includes(layout)) {
            const anchor = document.getElementById('tablet-sound-portal');
            if (anchor) {
                return ReactDOM.createPortal(
                    <div className="absolute inset-0 pointer-events-auto" onClick={onClose}>
                        {layout == 1 ? (
                            <div
                                className="absolute pointer-events-auto"
                                style={{ bottom: 'calc(8% + 1.5cqw)', right: '30.2cqw', transform: 'translateX(50%)' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <TabletLayoutSound {...commonProps} />
                            </div>
                        ) : (
                            <TabletLayoutSound {...commonProps} />
                        )}
                    </div>,
                    anchor
                );
            }
            return null; // Wait for portal target to be ready
        }



        const popupContent = (() => {
            switch (layout) {
                case 1: return <Layout1 {...commonProps} />;
                case 2: return <Layout2 {...commonProps} />;
                case 3: return <Layout3 {...commonProps} />;
                case 4: return <Layout4 {...commonProps} />;
                case 5: return <Layout5 {...commonProps} />;
                case 666: return <Layout6_OLD {...commonProps} />;
                case 6: return <Layout6 {...commonProps} />;
                case 7: return <Layout7 {...commonProps} />;
                case 8: return <Layout8 {...commonProps} />;
                default: return <LayoutDefault {...commonProps} />;
            }
        })();

        if (layout === 5) {
            const anchor = document.getElementById('layout5-sound-anchor');
            if (anchor) {
                return (
                    <div ref={soundContainerRef} className="absolute inset-0 z-[3000] overflow-hidden flex items-center justify-center pointer-events-none">
                        <div className="absolute inset-0 z-[3001] pointer-events-auto cursor-default" onClick={onClose} />
                        {ReactDOM.createPortal(
                            <div className="absolute pointer-events-auto z-[3002]" style={{
                                left: '50%',
                                bottom: 'calc(100% + 1.8vw)',
                                transform: 'translateX(-50%)'
                            }}>
                                {popupContent}
                            </div>,
                            anchor
                        )}
                    </div>
                );
            }
        }

        if (layout === 8) {
            const addTextBelowIcons = settings?.toolbar?.addTextBelowIcons;
            const anchor = document.getElementById('layout8-sound-icon-anchor');
            if (anchor) {
                const isTabletLocal = window.innerWidth >= 768 && window.innerWidth <= 1024;
                return ReactDOM.createPortal(
                    <div className="absolute pointer-events-auto z-[10]" style={{
                        left: '50%',
                        top: addTextBelowIcons ? 'calc(100% - 1.7vw)' : 'calc(100% - 1.2vw)',
                        transform: `translateX(calc(-85% + ${isTabletLocal ? '0.2vw' : '0.1vw'})) translateY(-15%)`
                    }}>
                        {popupContent}
                    </div>,
                    anchor
                );
            }
            return null; // Don't render until anchor is found
        }

        return (
            <div ref={soundContainerRef} className={`absolute inset-0 z-[3000] overflow-hidden flex items-center justify-center pointer-events-none`}>
                <div className="absolute inset-0 z-[3001] pointer-events-auto cursor-default" onClick={onClose} />
                <div
                    className={`fisto-menu-content absolute ${(!dynamicPos.ready && (!isTablet || layout !== 1)) ? getPosition() : ''} z-[3002] pointer-events-auto`}
                    style={(dynamicPos.ready && isTablet && layout === 1) ? {
                        bottom: `${dynamicPos.bottom}px`,
                        left: `${dynamicPos.left}px`,
                        transform: 'translateX(-50%)'
                    } : {}}
                >
                    {popupContent}
                </div>
            </div>
        );
    };

    return (
        <>
            <audio ref={bgAudioRef} />
            <audio ref={flipAudioRef} />
            {renderPopupUI()}
        </>
    );
};

const Layout3Popup = ({ anchorId, onClose, commonProps, isLandscape, isEditor }) => {
    const [pos, setPos] = useState({ left: 0, top: 0, ready: false });
    const containerRef = useRef(null);

    useEffect(() => {
        let attempts = 0;
        const findAnchor = () => {
            const anchor = document.querySelector('.layout3-music-icon-class');
            if (anchor && containerRef.current) {
                const anchorRect = anchor.getBoundingClientRect();
                const containerRect = containerRef.current.getBoundingClientRect();
                const isRealMobileView = window.innerWidth <= 768;
                setPos({
                    left: anchorRect.left - containerRect.left + (anchorRect.width / 2),
                    top: anchorRect.bottom - containerRect.top + (isLandscape ? 10 : (isRealMobileView ? 20 : 25)),
                    ready: true
                });
            } else if (attempts < 20) {
                attempts++;
                requestAnimationFrame(findAnchor);
            } else {
                const isRealMobileView = window.innerWidth <= 768;
                setPos({ left: '50%', top: isLandscape ? 60 : (isRealMobileView ? 125 : 165), ready: true });
            }
        };
        findAnchor();
    }, [isLandscape, isEditor]);

    if (!pos.ready) {
        return <div ref={containerRef} className="absolute inset-0 z-[3000] pointer-events-none opacity-0" />;
    }

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-[3000] pointer-events-auto"
            onClick={onClose}
        >
            <div
                className="absolute pointer-events-auto"
                style={{
                    left: pos.left,
                    top: pos.top,
                    transform: 'translateX(-50%)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <MobileLayout {...commonProps} isLandscape={isLandscape} />
            </div>
        </div>
    );
};

export default Sound;
