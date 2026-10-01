import React from 'react';
import { Icon } from '@iconify/react';
// --- Shared Helper for RGBA Colors ---
const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
    `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;

const getLayoutColorAlpha = (id, defaultRgb, alpha) => {
    return `rgba(var(--${id}-rgb, ${defaultRgb}), ${alpha})`;
};

const TabletLayoutSound = ({
    flipSoundMasterEnabled, isFlipActive, handleFlipClick, flipWidth,
    bgSoundMasterEnabled, isBgActive, handleBgClick, bgWidth, handleVolumeDrag, activeLayout
}) => {
    const isLayout2 = activeLayout == 2;
    const isLayout3 = activeLayout == 3;
    const isLayout4 = activeLayout == 4;
    const isLayout6 = activeLayout == 7;
    const isLayout8 = activeLayout == 9;
    if (activeLayout != 1 && activeLayout != 2 && activeLayout != 3 && activeLayout != 4 && activeLayout != 5 && activeLayout != 7 && activeLayout != 8 && activeLayout != 9) return null;

    if (isLayout8) {
        const getLayout8Color = (id, defaultColor) => {
            const value = localStorage.getItem('Layout8Style');
            if (value) {
                try {
                    const parsed = JSON.parse(value);
                    if (parsed[id]) {
                        if (parsed[id].startsWith('rgba')) return parsed[id];
                        let hex = parsed[id].replace('#', '');
                        if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        let a = 1;
                        if (hex.length === 8) a = parseInt(hex.substring(6, 8), 16) / 255;
                        return `rgba(${r},${g},${b},${a})`;
                    }
                } catch (e) { }
            }
            return `var(--${id}, ${defaultColor})`;
        };
        const bgColor = getLayout8Color('dropdown-bg', '#555555');
        const textColor = getLayout8Color('dropdown-text', '#FFFFFF');

        return (
            <div
                className="absolute w-[18cqw] h-[16cqw] z-[150] pointer-events-auto origin-top"
                style={{
                    top: '1cqw',
                    left: '43%',
                    transform: 'translateX(-82%)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative w-full h-full flex flex-col group">
                    <div className="absolute inset-0 z-0 pointer-events-none drop-shadow-2xl">
                        <svg width="100%" height="100%" viewBox="0 0 257 227" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                            <rect x="162" y="66" width="95" height="2" fill={bgColor} />
                            <path d="M0 86.9997C0 75.9541 8.95431 66.9998 20 66.9998H162.5C177.964 66.9998 190.5 54.4637 190.5 38.9998V33.0008C190.5 33.0008 190.5 0.000317665 223.75 2.29337e-09C257 -0.000317661 257 33 257 33V66.9998V207C257 218.046 248.046 227 237 227H20C8.95431 227 0 218.046 0 207V86.9997Z" fill={bgColor} />
                        </svg>
                    </div>
                    <div className="relative z-10 flex flex-col h-full w-full pt-[5cqw] pb-[1cqw] px-[1.5cqw] min-w-0">
                        <div className="flex items-center gap-[1cqw] mb-[1.5cqw] px-[0.5cqw]">
                            <h2 className="text-[1.3cqw] font-bold" style={{ color: textColor }}>Sound</h2>
                            <div className="flex-1 h-[1px]" style={{ backgroundColor: textColor, opacity: 0.2 }}></div>
                        </div>

                        {/* Flip Sound */}
                        <div className="flex items-center gap-[1.5cqw] mb-[1.5cqw] px-[0.5cqw]">
                            <button
                                className={`flex-shrink-0 w-[2.5cqw] h-[2.5cqw] bg-white flex items-center justify-center transition-all rounded-full shadow-sm ${!flipSoundMasterEnabled && 'opacity-40 cursor-not-allowed'}`}
                                onClick={handleFlipClick}
                                disabled={!flipSoundMasterEnabled}
                            >
                                <Icon icon="mingcute:volume-line" className="w-[1.4cqw] h-[1.4cqw]" style={{ color: bgColor }} />
                            </button>
                            <div className="flex-1 h-[0.3cqw] bg-white/20 rounded-full relative cursor-pointer" onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                                <div className="absolute top-0 left-0 bottom-0 bg-white transition-all duration-75 rounded-full" style={{ width: flipWidth }}>
                                    <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[0.8cqw] h-[0.8cqw] bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                        </div>

                        {/* BG Sound */}
                        <div className="flex items-center gap-[1.5cqw] px-[0.5cqw]">
                            <button
                                className={`flex-shrink-0 w-[2.5cqw] h-[2.5cqw] bg-white flex items-center justify-center transition-all rounded-full shadow-sm ${!bgSoundMasterEnabled && 'opacity-40 cursor-not-allowed'}`}
                                onClick={handleBgClick}
                                disabled={!bgSoundMasterEnabled}
                            >
                                <svg width="1.4cqw" height="1.4cqw" viewBox="0 0 21 23" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: bgColor }}>
                                    <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                                </svg>
                            </button>
                            <div className="flex-1 h-[0.3cqw] bg-white/20 rounded-full relative cursor-pointer" onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                                <div className="absolute top-0 left-0 bottom-0 bg-white transition-all duration-75 rounded-full" style={{ width: bgWidth }}>
                                    <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[0.8cqw] h-[0.8cqw] bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLayout4) {
        return (
            <div
                className="absolute top-[35cqh] left-[7.5cqw] rounded-[0.5cqw] shadow-md flex flex-col pointer-events-auto p-[1cqw] z-50 border border-gray-200"
                style={{ width: '14cqw', backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-[1cqw] mb-[1.2cqw]">
                    <h2 className="text-[1.3cqw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Sound</h2>
                    <div className="flex-1 h-[1px]" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '85,85,85', 0.3) }}></div>
                </div>

                {/* Flip Sound Controls */}
                <div className="flex items-center gap-[1.2cqw] mb-[1cqw]">
                    <button
                        className={`flex-shrink-0 w-[2.2cqw] h-[2.2cqw] flex items-center justify-center transition-all hover:opacity-80 rounded-sm ${!flipSoundMasterEnabled && 'opacity-40 cursor-not-allowed'}`}
                        onClick={handleFlipClick}
                        disabled={!flipSoundMasterEnabled}
                        style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '85,85,85', 0.1) }}
                    >
                        <Icon icon="mingcute:volume-line" className="w-[1.4cqw] h-[1.4cqw]" style={{ color: getLayoutColor('dropdown-text', '#555555') }} />
                    </button>
                    <div className="flex-1 h-[0.3cqw] rounded-full relative cursor-pointer" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '85,85,85', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                        <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#555555') }}>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[0.8cqw] h-[0.8cqw] rounded-full shadow-sm" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555') }} />
                        </div>
                    </div>
                </div>

                {/* BG Sound Controls */}
                <div className="flex items-center gap-[1.2cqw]">
                    <button
                        className={`flex-shrink-0 w-[2.2cqw] h-[2.2cqw] flex items-center justify-center transition-all hover:opacity-80 rounded-sm ${!bgSoundMasterEnabled && 'opacity-40 cursor-not-allowed'}`}
                        onClick={handleBgClick}
                        disabled={!bgSoundMasterEnabled}
                        style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '85,85,85', 0.1) }}
                    >
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 21 23"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-[1.4cqw] h-[1.4cqw]"
                            style={{ color: getLayoutColor('dropdown-text', '#555555') }}
                        >
                            <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                        </svg>
                    </button>
                    <div className="flex-1 h-[0.3cqw] rounded-full relative cursor-pointer" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '85,85,85', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                        <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#555555') }}>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[0.8cqw] h-[0.8cqw] rounded-full shadow-sm" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555') }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLayout3) {
        return (
            <div
                className="absolute top-[6cqw] left-[40cqw] rounded-[1cqw] shadow-[0_1cqw_3cqw_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto p-[1.5cqw] z-50 border-[1px] border-gray-100"
                style={{ width: '18cqw', backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-[1.5cqw] font-bold mb-[1.5cqw]" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Sound</h2>

                {/* Flip Sound Controls */}
                <div className="flex items-center gap-[1.2cqw] mb-[1.5cqw]">
                    <button
                        className={`flex-shrink-0 w-[1.8cqw] h-[1.8cqw] flex items-center justify-center transition-all ${!flipSoundMasterEnabled && 'opacity-40'}`}
                        onClick={handleFlipClick}
                        disabled={!flipSoundMasterEnabled}
                    >
                        <Icon icon="mingcute:volume-line" className="w-[1.6cqw] h-[1.6cqw]" style={{ color: getLayoutColor('dropdown-text', '#555555') }} />
                    </button>
                    <div className="flex-1 h-[0.4cqw] rounded-full relative cursor-pointer" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '87, 92, 156', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                        <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#555555') }}>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[1cqw] h-[1cqw] rounded-full shadow-sm" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555') }} />
                        </div>
                    </div>
                </div>

                {/* BG Sound Controls */}
                <div className="flex items-center gap-[1.2cqw]">
                    <button
                        className={`flex-shrink-0 w-[1.8cqw] h-[1.8cqw] flex items-center justify-center transition-all ${!bgSoundMasterEnabled && 'opacity-40'}`}
                        onClick={handleBgClick}
                        disabled={!bgSoundMasterEnabled}
                    >
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 21 23"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-[1.6cqw] h-[1.6cqw]"
                            style={{ color: getLayoutColor('dropdown-text', '#555555') }}
                        >
                            <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                        </svg>
                    </button>
                    <div className="flex-1 h-[0.4cqw] rounded-full relative cursor-pointer" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '87, 92, 156', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                        <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#555555') }}>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[1cqw] h-[1cqw] rounded-full shadow-sm" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555') }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeLayout == 1 || activeLayout == 2 || activeLayout == 3) {
        return (
            <div
                className={isLayout2
                    ? "absolute top-[9%] left-[41cqw] w-[18cqw] rounded-[1cqw] shadow-[0_2cqw_5cqw_rgba(0,0,0,0.3)] overflow-hidden flex flex-col pointer-events-auto p-[1.5cqw] border-[4px] border-white/80 z-50"
                    : "animate-in fade-in slide-in-from-bottom-4 duration-300 relative"
                }
                onClick={(e) => e.stopPropagation()}
                style={isLayout2
                    ? { backgroundColor: 'rgba(var(--dropdown-bg-rgb, 98, 95, 162), 0.95)', backdropFilter: 'blur(12px)' }
                    : {
                        backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
                        width: '18cqw',
                        borderRadius: '1cqw',
                        boxShadow: '0 0.8cqw 3cqw rgba(0,0,0,0.15)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        overflow: 'hidden',
                        backdropFilter: 'blur(12px)',
                        padding: '0.8cqw 1.6cqw 1.6cqw',
                    }}
            >
                <div className={isLayout2 ? "flex flex-col gap-[2cqw]" : "flex flex-col gap-[1.3cqw]"}>
                    <div className={isLayout2 ? "flex items-center mb-[1cqw]" : "text-center mb-[0.8cqw] px-[0.8cqw]"}>
                        <h2 className={isLayout2 ? "text-[1.4cqw] font-bold text-white mr-[1cqw]" : "text-[1.5cqw] font-semibold mb-[0.5cqw]"}
                            style={isLayout2 ? {} : { color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                        >
                            Sound
                        </h2>
                        {isLayout2 ? (
                            <div className="flex-1 h-[1px] bg-white/40"></div>
                        ) : (
                            <div className="h-[0.5px] w-[calc(100%+3.2cqw)] ml-[-1.6cqw]"
                                style={{ backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), opacity: 0.2 }}
                            />
                        )}
                    </div>

                    {/* Flip Sound Controls */}
                    <div className="flex items-center gap-[1.6cqw]">
                        <button
                            className={`flex-shrink-0 w-[2.8cqw] h-[2.8cqw] flex items-center justify-center transition-all duration-300 rounded-full ${flipSoundMasterEnabled ? (isFlipActive ? 'shadow-inner' : 'bg-transparent hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                            style={isLayout2
                                ? (isFlipActive ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: 'rgba(255,255,255,0.1)' })
                                : (isFlipActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {})
                            }
                            onClick={handleFlipClick}
                            disabled={!flipSoundMasterEnabled}
                        >
                            <Icon icon="mingcute:volume-line" className="w-[1.6cqw] h-[1.6cqw]" style={{ color: '#FFFFFF' }} />
                        </button>
                        <div className="flex-1 h-[0.3cqw] rounded-full relative" style={isLayout2 ? { cursor: "pointer", backgroundColor: 'rgba(255, 255, 255, 0.2)' } : { cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                            <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={isLayout2 ? { width: flipWidth, backgroundColor: '#FFFFFF' } : { width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={isLayout2 ? { width: '1cqw', height: '1cqw', backgroundColor: '#FFFFFF' } : { width: '1cqw', height: '1cqw', backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), border: '1px solid rgba(0,0,0,0.1)' }} />
                            </div>
                        </div>
                    </div>

                    {/* BG Sound Controls */}
                    <div className="flex items-center gap-[1.6cqw]">
                        <button
                            className={`flex-shrink-0 w-[2.8cqw] h-[2.8cqw] flex items-center justify-center transition-all duration-300 rounded-full ${bgSoundMasterEnabled ? (isBgActive ? 'shadow-inner' : 'bg-transparent hover:bg-black/5') : 'bg-transparent cursor-not-allowed opacity-40'}`}
                            style={isLayout2
                                ? (isBgActive ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: 'rgba(255,255,255,0.1)' })
                                : (isBgActive ? { backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.15) } : {})
                            }
                            onClick={handleBgClick}
                            disabled={!bgSoundMasterEnabled}
                        >
                            <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 21 23"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-[1.4cqw] h-[1.4cqw]"
                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                            >
                                <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                            </svg>
                        </button>
                        <div className="flex-1 h-[0.3cqw] rounded-full relative" style={isLayout2 ? { cursor: "pointer", backgroundColor: 'rgba(255, 255, 255, 0.2)' } : { cursor: "pointer", backgroundColor: getLayoutColorAlpha('dropdown-text', '255, 255, 255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                            <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={isLayout2 ? { width: bgWidth, backgroundColor: '#FFFFFF' } : { width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF') }}>
                                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-full shadow-sm" style={isLayout2 ? { width: '1cqw', height: '1cqw', backgroundColor: '#FFFFFF' } : { width: '1cqw', height: '1cqw', backgroundColor: getLayoutColor('dropdown-text', '#FFFFFF'), border: '1px solid rgba(0,0,0,0.1)' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeLayout == 5) {
        return (
            <div
                className="absolute bottom-[11cqh] left-[41cqw] w-[20cqw] rounded-[1.2cqw] shadow-[0_1cqw_3cqw_rgba(0,0,0,0.1)] flex flex-col pointer-events-auto p-[2cqw] z-50"
                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute -bottom-[1.8cqw] right-[4cqw] w-[2.5cqw] h-[2cqw]" style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'), clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>

                <div className="flex items-center gap-[1cqw] mb-[1.5cqw]">
                    <h2 className="text-[1.5cqw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Sound</h2>
                    <div className="flex-1 h-[1.5px]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555') }}></div>
                </div>

                {/* Flip Sound Controls */}
                <div className="flex items-center gap-[1.5cqw] mb-[1.5cqw]">
                    <button
                        className={`flex-shrink-0 w-[3cqw] h-[3cqw] flex items-center justify-center transition-all hover:bg-black/5 rounded-full ${!flipSoundMasterEnabled && 'opacity-40 cursor-not-allowed'}`}
                        style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '85,85,85', 0.1) }}
                        onClick={handleFlipClick}
                        disabled={!flipSoundMasterEnabled}
                    >
                        <Icon icon="mingcute:volume-line" className="w-[1.6cqw] h-[1.6cqw]" style={{ color: getLayoutColor('dropdown-text', '#555555') }} />
                    </button>
                    <div className="flex-1 h-[0.3cqw] rounded-full relative cursor-pointer" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '85,85,85', 0.3) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                        <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-text', '#555555') }}>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[1cqw] h-[1cqw] rounded-full shadow-sm" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555') }} />
                        </div>
                    </div>
                </div>

                {/* BG Sound Controls */}
                <div className="flex items-center gap-[1.5cqw]">
                    <button
                        className={`flex-shrink-0 w-[3cqw] h-[3cqw] flex items-center justify-center transition-all hover:bg-black/5 rounded-full ${!bgSoundMasterEnabled && 'opacity-40 cursor-not-allowed'}`}
                        style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '85,85,85', 0.1) }}
                        onClick={handleBgClick}
                        disabled={!bgSoundMasterEnabled}
                    >
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 21 23"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-[1.6cqw] h-[1.6cqw]"
                            style={{ color: getLayoutColor('dropdown-text', '#555555') }}
                        >
                            <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                        </svg>
                    </button>
                    <div className="flex-1 h-[0.3cqw] rounded-full relative cursor-pointer" style={{ backgroundColor: getLayoutColorAlpha('dropdown-text', '85,85,85', 0.3) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                        <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-text', '#555555') }}>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[1cqw] h-[1cqw] rounded-full shadow-sm" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555') }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeLayout == 7) {
        return (
            <div
                className="absolute right-[6.8cqw] bottom-[30%] w-[18cqw] rounded-[1cqw] shadow-[-4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto p-[1.5cqw] z-50"
                style={{ backgroundColor: getLayoutColor('toolbar-bg', '#5C5898') }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-[1cqw] mb-[1.5cqw]">
                    <h2 className="text-[1.5cqw] font-bold" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>Sound</h2>
                    <div className="flex-1 h-[1.5px]" style={{ backgroundColor: getLayoutColorAlpha('toolbar-text-main', '255,255,255', 0.2) }}></div>
                </div>

                {/* Flip Sound Controls */}
                <div className="flex items-center gap-[1.5cqw] mb-[1.5cqw]">
                    <button
                        className={`flex-shrink-0 w-[2.5cqw] h-[2.5cqw] flex items-center justify-center transition-all hover:bg-white/10 rounded-full ${!flipSoundMasterEnabled && 'opacity-40 cursor-not-allowed'}`}
                        onClick={handleFlipClick}
                        disabled={!flipSoundMasterEnabled}
                    >
                        <Icon icon="mingcute:volume-line" className="w-[1.6cqw] h-[1.6cqw]" style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }} />
                    </button>
                    <div className="flex-1 h-[0.3cqw] rounded-full relative cursor-pointer" style={{ backgroundColor: getLayoutColorAlpha('toolbar-text-main', '255,255,255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                        <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[1cqw] h-[1cqw] rounded-full shadow-sm" style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') }} />
                        </div>
                    </div>
                </div>

                {/* BG Sound Controls */}
                <div className="flex items-center gap-[1.5cqw]">
                    <button
                        className={`flex-shrink-0 w-[2.5cqw] h-[2.5cqw] flex items-center justify-center transition-all hover:bg-white/10 rounded-full ${!bgSoundMasterEnabled && 'opacity-40 cursor-not-allowed'}`}
                        onClick={handleBgClick}
                        disabled={!bgSoundMasterEnabled}
                    >
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 21 23"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-[1.6cqw] h-[1.6cqw]"
                            style={{ color: getLayoutColor('toolbar-text-main', '#FFFFFF') }}
                        >
                            <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                        </svg>
                    </button>
                    <div className="flex-1 h-[0.3cqw] rounded-full relative cursor-pointer" style={{ backgroundColor: getLayoutColorAlpha('toolbar-text-main', '255,255,255', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                        <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') }}>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[1cqw] h-[1cqw] rounded-full shadow-sm" style={{ backgroundColor: getLayoutColor('toolbar-text-main', '#FFFFFF') }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeLayout == 8) {
        return (
            <div
                className="absolute right-[15cqw] bottom-[14%] w-[18cqw] rounded-[1cqw] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-50 bg-white"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-[1.5cqw] py-[1cqw]" style={{ backgroundColor: getLayoutColor('dropdown-bg', '#555555') }}>
                    <h2 className="text-[1.2cqw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}>Sound</h2>
                </div>

                <div className="p-[1.5cqw] flex flex-col gap-[1.5cqw]">
                    {/* Flip Sound Controls */}
                    <div className="flex items-center gap-[1.5cqw]">
                        <button
                            className={`flex-shrink-0 w-[2.5cqw] h-[2.5cqw] flex items-center justify-center transition-all hover:opacity-90 rounded-full ${!flipSoundMasterEnabled && 'opacity-40 cursor-not-allowed'}`}
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#555555') }}
                            onClick={handleFlipClick}
                            disabled={!flipSoundMasterEnabled}
                        >
                            <Icon icon="mingcute:volume-line" className="w-[1.4cqw] h-[1.4cqw]" style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }} />
                        </button>
                        <div className="flex-1 h-[0.3cqw] rounded-full relative cursor-pointer" style={{ backgroundColor: getLayoutColorAlpha('dropdown-bg', '85,85,85', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "flip")}>
                            <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: flipWidth, backgroundColor: getLayoutColor('dropdown-bg', '#555555') }}></div>
                        </div>
                    </div>

                    {/* BG Sound Controls */}
                    <div className="flex items-center gap-[1.5cqw]">
                        <button
                            className={`flex-shrink-0 w-[2.5cqw] h-[2.5cqw] flex items-center justify-center transition-all hover:opacity-90 rounded-full ${!bgSoundMasterEnabled && 'opacity-40 cursor-not-allowed'}`}
                            style={{ backgroundColor: getLayoutColor('dropdown-bg', '#555555') }}
                            onClick={handleBgClick}
                            disabled={!bgSoundMasterEnabled}
                        >
                            <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 21 23"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-[1.2cqw] h-[1.2cqw]"
                                style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                            >
                                <path d="M9.42375 1.0422C9.48521 1.31201 9.43634 1.59503 9.28788 1.82905C9.13942 2.06306 8.90352 2.22891 8.63205 2.29014C6.88603 2.68576 5.31295 3.62554 4.14236 4.97234C2.97178 6.31914 2.26497 8.00246 2.12508 9.77664C1.98519 11.5508 2.41954 13.323 3.36475 14.8345C4.30996 16.3461 5.71655 17.5179 7.37925 18.1789C9.04195 18.84 10.8737 18.9556 12.6072 18.5091C14.3408 18.0625 15.8853 17.0771 17.0155 15.6966C18.1456 14.3161 18.8022 12.6128 18.8894 10.8353C18.9767 9.0578 18.49 7.29911 17.5003 5.81589C17.424 5.70175 17.3711 5.57379 17.3445 5.43931C17.318 5.30483 17.3183 5.16647 17.3456 5.03213C17.4006 4.76082 17.5618 4.52235 17.7938 4.36917C18.0258 4.216 18.3095 4.16068 18.5825 4.21537C18.7177 4.24245 18.8462 4.29573 18.9607 4.37216C19.0751 4.44858 19.1733 4.54667 19.2496 4.66081C20.3938 6.37018 21.0029 8.37801 21 10.431C21 16.1938 16.2991 20.8653 10.5 20.8653C4.70085 20.8653 0 16.1938 0 10.431C0 5.46425 3.49125 1.30931 8.16795 0.255449C8.43946 0.194368 8.72426 0.242931 8.95975 0.390462C9.19524 0.537994 9.36213 0.772418 9.42375 1.0422ZM11.55 1.05472C11.5499 0.898191 11.5848 0.743603 11.6523 0.602183C11.7198 0.460763 11.8182 0.336062 11.9403 0.237141C12.0623 0.138219 12.2051 0.06756 12.358 0.0302978C12.511 -0.00696441 12.6704 -0.00989448 12.8247 0.0217206L12.9454 0.0540671L16.0818 1.09332C16.3366 1.177 16.5495 1.35445 16.6767 1.58923C16.804 1.82401 16.836 2.0983 16.7661 2.35577C16.6962 2.61324 16.5298 2.83435 16.301 2.9737C16.0722 3.11304 15.7984 3.16005 15.5358 3.10506L15.4182 3.07375L13.65 2.48735V10.431C13.6497 11.0865 13.4423 11.7254 13.057 12.2576C12.6718 12.7897 12.1282 13.1882 11.5028 13.3969C10.8775 13.6056 10.202 13.614 9.57161 13.4208C8.94125 13.2275 8.38782 12.8426 7.98941 12.3201C7.59099 11.7976 7.36769 11.164 7.351 10.5087C7.33432 9.85337 7.52508 9.20936 7.89639 8.66753C8.2677 8.1257 8.80082 7.71339 9.42055 7.48875C10.0403 7.2641 10.7153 7.23847 11.3505 7.41547L11.55 7.47807V1.05576V1.05472Z" fill="currentColor" />
                            </svg>
                        </button>
                        <div className="flex-1 h-[0.3cqw] rounded-full relative cursor-pointer" style={{ backgroundColor: getLayoutColorAlpha('dropdown-bg', '85,85,85', 0.2) }} onPointerDown={(e) => handleVolumeDrag(e, "bg")}>
                            <div className="absolute top-0 left-0 bottom-0 transition-all duration-75 rounded-full" style={{ width: bgWidth, backgroundColor: getLayoutColor('dropdown-bg', '#555555') }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default TabletLayoutSound;
