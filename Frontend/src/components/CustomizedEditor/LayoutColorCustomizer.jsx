import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ColorPicker from './ColorPallet';
import { LAYOUT_DEFAULT_COLORS } from './Layout';

const LayoutColorCustomizer = ({ colorPopup, setColorPopup, colors, setColors, onUpdateLayoutColors }) => {
    const [pickerColorIdx, setPickerColorIdx] = useState(null);
    const [selectedComp, setSelectedComp] = useState('Toolbar');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [hexDrafts, setHexDrafts] = useState({});
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper to format layout colors payload matching backend schema
    const formatLayoutColorsPayload = (updated) => {
        if (!updated) return updated;
        const layout1 = updated[1] || updated['1'] || [];
        const primaryToolbarHex = (Array.isArray(layout1) ? layout1.find(c => c && c.id === 'toolbar-bg')?.hex : null) || updated.toolbarColor?.primary || '';
        const secondaryToolbarHex = (Array.isArray(layout1) ? layout1.find(c => c && c.id === 'toolbar-text-main')?.hex : null) || updated.toolbarColor?.secondary || '';
        let primaryPopupHex = (Array.isArray(layout1) ? layout1.find(c => c && ['toc-bg', 'dropdown-bg'].includes(c.id))?.hex : null) || updated.popupColor?.primary || '';
        let secondaryPopupHex = (Array.isArray(layout1) ? layout1.find(c => c && ['toc-text', 'dropdown-text'].includes(c.id))?.hex : null) || updated.popupColor?.secondary || '';

        const checkIsLight = (hex) => {
            if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
            let c = hex.substring(1).toUpperCase();
            if (c.length === 3) c = c.split('').map(x => x + x).join('');
            if (c.length !== 6) return false;
            const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
            return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) > 0.7;
        };

        if (primaryPopupHex && secondaryPopupHex && checkIsLight(primaryPopupHex) && !checkIsLight(secondaryPopupHex)) {
            const temp = primaryPopupHex;
            primaryPopupHex = secondaryPopupHex;
            secondaryPopupHex = temp;
        }

        return {
            ...updated,
            toolbarColor: {
                primary: primaryToolbarHex,
                secondary: secondaryToolbarHex
            },
            popupColor: {
                primary: primaryPopupHex,
                secondary: secondaryPopupHex
            }
        };
    };

    // Helper to create a light shade of a color for backgrounds
    const getTint = (hex, weight = 0.8) => {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.round(r + (255 - r) * weight);
        g = Math.round(g + (255 - g) * weight);
        b = Math.round(b + (255 - b) * weight);
        const toHex = x => x.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    };

    // Helper to create a darker shade of a color for text
    const getShade = (hex, weight = 0.6) => {
        if (!hex || hex === 'transparent') return hex;
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

    // Helper to determine if a color is light (high luminance)
    const isLightColor = (hex) => {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
        let c = hex.substring(1).toUpperCase();
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        if (c.length !== 6) return false;
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.7; // Threshold for light bar logic
    };

    // Helper to ensure text on a light surface is readable (darkens colors like yellow)
    const ensureDarkText = (hex) => {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
        let c = hex.substring(1).toUpperCase();
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        if (c.length !== 6) return hex;
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (luminance > 0.45) { // Catch mid-high brightness colors like yellow
            return getShade(hex, 0.5);
        }
        return hex;
    };

    const handleColorChange = (layoutIdx, colorIdx, newHex) => {
        setColors(prev => {
            const updated = { ...prev };

            // Ensure all 9 layouts are initialized
            for (let i = 1; i <= 9; i++) {
                const defaults = LAYOUT_DEFAULT_COLORS[i] || [];
                const current = updated[i] || [];
                updated[i] = defaults.map(d => {
                    const s = current.find(c => c.id === d.id);
                    return s ? { ...s } : { ...d };
                });
            }

            const currentItem = updated[layoutIdx][colorIdx];
            if (!currentItem) return prev;

            const masterPrimaryId = 'toolbar-bg';
            const masterSecondaryId = 'toolbar-text-main';
            const isToolbarAction = currentItem.id === masterPrimaryId || currentItem.id === masterSecondaryId;
            const popupPrimaryIds = ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'];
            const popupSecondaryIds = ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'];
            const isPopupAction = popupPrimaryIds.includes(currentItem.id) || popupSecondaryIds.includes(currentItem.id);

            // Apply globally if it's a structural Toolbar or Popup change
            if ((isToolbarAction || isPopupAction) && (layoutIdx >= 1 && layoutIdx <= 9)) {
                for (let i = 1; i <= 9; i++) {
                    if (isToolbarAction) {
                        const primaryHex = currentItem.id === masterPrimaryId ? newHex : (updated[i].find(c => c.id === masterPrimaryId)?.hex || newHex);
                        const secondaryHex = currentItem.id === masterSecondaryId ? newHex : (updated[i].find(c => c.id === masterSecondaryId)?.hex || newHex);

                        const primaryIds = ['toolbar-bg', 'bottom-toolbar-bg', 'page-number-bg'];
                        const shadeIds = ['search-bg-v1', 'search-bg-v2', 'reset-bg'];
                        const contrastIds = ['toolbar-text-main', 'toolbar-icon', 'search-text-v1', 'reset-text', 'page-number-text'];

                        updated[i] = updated[i].map(c => {
                            if (primaryIds.includes(c.id)) return { ...c, hex: primaryHex };
                            if (shadeIds.includes(c.id)) return { ...c, hex: getTint(primaryHex, 0.75) };
                            if (contrastIds.includes(c.id)) {
                                let targetHex = secondaryHex;
                                let targetOpacity = c.opacity;

                                if (c.id === 'search-text-v1') {
                                    const isLightBar = isLightColor(primaryHex);
                                    targetHex = ensureDarkText(isLightBar ? secondaryHex : primaryHex);
                                    targetOpacity = 100;
                                } else {
                                    // Force 100% opacity for other contrast elements if using standard colors on light bg
                                    const isLightBg = isLightColor(primaryHex);
                                    const isStandardPurple = secondaryHex.toUpperCase() === '#555555';
                                    if (isLightBg && isStandardPurple) targetOpacity = 100;
                                }

                                return { ...c, hex: targetHex, opacity: targetOpacity };
                            }
                            return c;
                        });
                    } else if (isPopupAction) {
                        const isPrimary = popupPrimaryIds.includes(currentItem.id);
                        const primaryHex = isPrimary ? newHex : (updated[i].find(c => popupPrimaryIds.includes(c.id))?.hex || newHex);
                        const secondaryHex = !isPrimary ? newHex : (updated[i].find(c => popupSecondaryIds.includes(c.id))?.hex || newHex);

                        updated[i] = updated[i].map(c => {
                            if (popupPrimaryIds.includes(c.id)) return { ...c, hex: primaryHex };
                            if (popupSecondaryIds.includes(c.id)) return { ...c, hex: isLightColor(primaryHex) ? ensureDarkText(secondaryHex) : secondaryHex };
                            return c;
                        });
                    }
                }
            } else {
                // Local single-color fallback
                updated[layoutIdx] = updated[layoutIdx].map((c, i) => i === colorIdx ? { ...c, hex: newHex } : c);
            }

            const formatted = formatLayoutColorsPayload(updated);
            if (onUpdateLayoutColors) {
                setTimeout(() => onUpdateLayoutColors(formatted), 0);
            }
            return formatted;
        });
    };

    const handleOpacityChange = (layoutIdx, colorIdx, newOpacity) => {
        setColors(prev => {
            const updated = { ...prev };

            for (let i = 1; i <= 9; i++) {
                const defaults = LAYOUT_DEFAULT_COLORS[i] || [];
                const current = updated[i] || [];
                updated[i] = defaults.map(d => {
                    const s = current.find(c => c.id === d.id);
                    return s ? { ...s } : { ...d };
                });
            }

            const currentItem = updated[layoutIdx][colorIdx];
            const newOp = newOpacity;

            const isToolbarPrimary = currentItem?.id === 'toolbar-bg';
            const isToolbarSecondary = currentItem?.id === 'toolbar-text-main';
            const isPopupPrimary = ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'].includes(currentItem?.id);
            const isPopupSecondary = ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'].includes(currentItem?.id);

            // Clamp opacity to 40-100 for popup primary backgrounds
            const clampedOpacity = newOpacity; // Removed the 40% minimum clamp for popups

            if ((isToolbarPrimary || isToolbarSecondary || isPopupPrimary || isPopupSecondary) && (layoutIdx >= 1 && layoutIdx <= 9)) {
                for (let i = 1; i <= 9; i++) {
                    if (isToolbarPrimary) {
                        const idsToSync = ['toolbar-bg', 'bottom-toolbar-bg', 'search-bg-v1', 'search-bg-v2', 'page-number-bg', 'reset-bg'];
                        updated[i] = updated[i].map(c => idsToSync.includes(c.id) ? { ...c, opacity: clampedOpacity } : c);
                    } else if (isToolbarSecondary) {
                        const idsToSync = ['toolbar-text-main', 'toolbar-icon', 'search-text-v1', 'reset-text', 'page-number-text'];
                        updated[i] = updated[i].map(c => idsToSync.includes(c.id) ? { ...c, opacity: clampedOpacity } : c);
                    } else if (isPopupPrimary) {
                        const idsToSync = ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'];
                        updated[i] = updated[i].map(c => idsToSync.includes(c.id) ? { ...c, opacity: clampedOpacity } : c);
                    } else if (isPopupSecondary) {
                        const idsToSync = ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'];
                        updated[i] = updated[i].map(c => idsToSync.includes(c.id) ? { ...c, opacity: clampedOpacity } : c);
                    }
                }
            } else {
                updated[layoutIdx] = updated[layoutIdx].map((c, i) => i === colorIdx ? { ...c, opacity: clampedOpacity } : c);
            }

            const formatted = formatLayoutColorsPayload(updated);
            if (onUpdateLayoutColors) {
                setTimeout(() => onUpdateLayoutColors(formatted), 0);
            }
            return formatted;
        });
    };

    const handleReset = (layoutIdx) => {
        setColors(prev => {
            const updated = { ...prev };
            // Reset ALL layouts for global synchronization
            for (let i = 1; i <= 9; i++) {
                updated[i] = LAYOUT_DEFAULT_COLORS[i].map(c => ({ ...c }));
            }
            const formatted = formatLayoutColorsPayload(updated);
            if (onUpdateLayoutColors) {
                setTimeout(() => onUpdateLayoutColors(formatted), 0);
            }
            return formatted;
        });
        setPickerColorIdx(null);
    };

    const handleFlip = (layoutIdx) => {
        setColors(prev => {
            const updated = { ...prev };

            for (let i = 1; i <= 9; i++) {
                const defaults = LAYOUT_DEFAULT_COLORS[i] || [];
                const current = updated[i] || [];
                updated[i] = defaults.map(d => {
                    const s = current.find(c => c.id === d.id);
                    return s ? { ...s } : { ...d };
                });
            }

            const items = updated[layoutIdx];
            const isPopupsTab = selectedComp === 'Table Of Content';

            if (isPopupsTab) {
                const popupPrimaryIds = ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2'];
                const popupSecondaryIds = ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'];

                const currentP = items.find(i => popupPrimaryIds.includes(i.id))?.hex.toUpperCase();
                const currentS = items.find(i => popupSecondaryIds.includes(i.id))?.hex.toUpperCase();

                if (!currentP || !currentS) return prev;

                for (let i = 1; i <= 9; i++) {
                    updated[i] = updated[i].map(c => {
                        let item = { ...c };
                        if (popupPrimaryIds.includes(c.id)) {
                            item.hex = currentS;
                        } else if (popupSecondaryIds.includes(c.id)) {
                            item.hex = currentP;
                        }
                        return item;
                    });
                }
            } else {
                const currentPrimary = items.find(i => i.id === 'toolbar-bg')?.hex.toUpperCase();
                const currentSecondary = items.find(i => i.id === 'toolbar-text-main')?.hex.toUpperCase();

                if (!currentPrimary || !currentSecondary) return prev;

                const toolbarPrimaryIds = ['toolbar-bg', 'bottom-toolbar-bg', 'page-number-bg'];
                const toolbarSecondaryIds = ['toolbar-text-main', 'toolbar-icon', 'search-bg-v2', 'search-text-v1', 'reset-text', 'page-number-text'];

                for (let i = 1; i <= 9; i++) {
                    updated[i] = updated[i].map(c => {
                        let item = { ...c };
                        if (toolbarPrimaryIds.includes(c.id)) {
                            item.hex = currentSecondary;
                        } else if (toolbarSecondaryIds.includes(c.id)) {
                            item.hex = currentPrimary;
                            if (c.id === 'search-bg-v2') {
                                item.hex = getTint(currentPrimary, 0.75);
                            } else if (c.id === 'search-text-v1') {
                                const isLightBar = isLightColor(currentSecondary);
                                item.hex = ensureDarkText(isLightBar ? currentPrimary : currentSecondary);
                            }
                        }
                        if (['search-bg-v1', 'reset-bg'].includes(c.id)) {
                            item.hex = getTint(currentSecondary, 0.75);
                        }
                        return item;
                    });
                }
            }

            const formatted = formatLayoutColorsPayload(updated);
            if (onUpdateLayoutColors) {
                setTimeout(() => onUpdateLayoutColors(formatted), 0);
            }
            return formatted;
        });
    };

    const applyTheme = (layoutIdx, theme) => {
        setColors(prev => {
            const updated = { ...prev };
            const basePrimary = LAYOUT_DEFAULT_COLORS[1][0].hex.toUpperCase();
            const isPopupsTab = selectedComp === 'Table Of Content';

            // Apply theme presets instantly to ALL layouts based on global color rules
            for (let i = 1; i <= 9; i++) {
                const defaults = LAYOUT_DEFAULT_COLORS[i] || [];

                updated[i] = defaults.map(def => {
                    let newHex = def.hex;
                    const isFirstPreset = theme.primary.toUpperCase() === basePrimary;

                    let isTarget = false;
                    let isPrimary = false;
                    let isShade = false;
                    let isContrast = false;
                    let isSearchText = false;

                    if (isPopupsTab) {
                        const popupPrimaryIds = ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'toc-overlay'];
                        const popupShadeIds = ['thumbnail-inner-v2'];
                        const popupContrastIds = ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'];

                        if (popupPrimaryIds.includes(def.id)) { isTarget = true; isPrimary = true; }
                        else if (popupShadeIds.includes(def.id)) { isTarget = true; isShade = true; }
                        else if (popupContrastIds.includes(def.id)) { isTarget = true; isContrast = true; }
                    } else {
                        const toolbarPrimaryIds = ['toolbar-bg', 'bottom-toolbar-bg', 'page-number-bg'];
                        const toolbarShadeIds = ['search-bg-v1', 'search-bg-v2', 'reset-bg'];
                        const toolbarContrastIds = ['toolbar-text-main', 'toolbar-icon', 'reset-text', 'page-number-text'];

                        if (toolbarPrimaryIds.includes(def.id)) { isTarget = true; isPrimary = true; }
                        else if (toolbarShadeIds.includes(def.id)) { isTarget = true; isShade = true; }
                        else if (toolbarContrastIds.includes(def.id)) { isTarget = true; isContrast = true; }
                        else if (def.id === 'search-text-v1') { isTarget = true; isSearchText = true; }
                    }

                    if (isTarget) {
                        if (isFirstPreset) {
                            newHex = def.hex;
                        } else {
                            const styleBLayouts = [3, 4, 5, 6, 7, 9];
                            const isStyleB = styleBLayouts.includes(i);
                            const isPopupElement = isPopupsTab;

                            if (isPrimary) {
                                newHex = (isStyleB && isPopupElement) ? (theme.secondary || '#FFFFFF') : theme.primary;
                            } else if (isShade) {
                                newHex = getTint((isStyleB && isPopupElement) ? (theme.secondary || '#FFFFFF') : theme.primary, 0.75);
                            } else if (isContrast) {
                                newHex = (isStyleB && isPopupElement) ? theme.primary : (theme.secondary || '#FFFFFF');
                            } else if (isSearchText) {
                                const isLightBar = isLightColor(theme.primary);
                                newHex = ensureDarkText(isLightBar ? (theme.secondary || '#FFFFFF') : theme.primary);
                            }
                        }
                    } else {
                        const existingItem = (prev[i] || []).find(c => c.id === def.id);
                        if (existingItem) newHex = existingItem.hex;
                    }

                    // Preserve existing opacity
                    const existingItemOpacity = (prev[i] || []).find(c => c.id === def.id);
                    return { ...def, hex: newHex, opacity: existingItemOpacity ? existingItemOpacity.opacity : def.opacity };
                });
            }

            const formatted = formatLayoutColorsPayload(updated);
            if (onUpdateLayoutColors) {
                setTimeout(() => onUpdateLayoutColors(formatted), 0);
            }
            return formatted;
        });
    };

    const handleSwatchClick = (colorIdx) => {
        setPickerColorIdx(prev => (prev === colorIdx ? null : colorIdx));
    };

    const closePopup = () => {
        setColorPopup(null);
        setPickerColorIdx(null);
        setDropdownOpen(false);
    };

    if (!colorPopup) return null;
    const currentLayoutIdx = Number(colorPopup.layoutIndex);
    const currentColors = (LAYOUT_DEFAULT_COLORS[currentLayoutIdx] || []).map(d => {
        const saved = (colors[currentLayoutIdx] || []).find(s => s.id === d.id);
        return saved ? { ...saved } : { ...d };
    });
    const isAdvancedLayoutPopup = [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(currentLayoutIdx);

    const visibleColors = isAdvancedLayoutPopup
        ? currentColors
            .map((c, i) => ({ ...c, originalIdx: i }))
            .filter(c => c.component === selectedComp)
            .filter(c => {
                // Hide master toolbar and popup colors from the flowing list to avoid duplication
                const hiddenIds = [
                    'toolbar-bg', 'bottom-toolbar-bg', 'toolbar-text-main', 'toolbar-icon', 'search-bg-v1', 'search-text-v1', 'search-bg-v2',
                    'toc-bg', 'toc-text', 'toc-overlay', 'toc-icon', 'dropdown-bg', 'dropdown-text', 'dropdown-icon', 'thumbnail-outer-v2', 'thumbnail-inner-v2'
                ];
                return !hiddenIds.includes(c.id);
            })
        : currentColors.map((c, i) => ({ ...c, originalIdx: i }));

    return (
        <>
            <div
                className="fixed inset-0 z-[300] bg-white/40 transition-all"
                onClick={closePopup}
            />
            <div
                className="absolute top-[10vw] left-[1.25vw] right-[1.25vw] z-[320] bg-white rounded-[1vw] border border-gray-200 overflow-visible"
                onClick={(e) => e.stopPropagation()}
                ref={dropdownRef}
            >

                {/* ── Panel Header (Tabs) ── */}
                <div className="flex gap-[0.8vw] p-[0.9vw] pb-[0.6vw] border-b border-gray-100">
                    {['Toolbar', 'Popups'].map(tab => {
                        const isActive = (tab === 'Toolbar' ? (selectedComp !== 'Table Of Content') : (selectedComp === 'Table Of Content'));
                        return (
                            <button
                                key={tab}
                                onClick={() => setSelectedComp(tab === 'Toolbar' ? 'Toolbar' : 'Table Of Content')}
                                className={`flex-1 py-[0.5vw] rounded-[0.7vw] text-[0.85vw] transition-all ${isActive
                                    ? 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-gray-100 text-gray-900 font-bold'
                                    : 'bg-gray-50 text-gray-400 font-normal'
                                    }`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>

                {/* ── Theme Presets Grid ── */}
                {isAdvancedLayoutPopup && (
                    <div className="px-[0.9vw] pt-[0.8vw] grid grid-cols-6 gap-[0.5vw] mb-[0.8vw]">
                        {[
                            { primary: LAYOUT_DEFAULT_COLORS[1][0].hex, secondary: LAYOUT_DEFAULT_COLORS[1][2].hex },
                            { primary: '#E0E2FB', secondary: '#8084B9' },
                            { primary: '#E7F6FF', secondary: '#6991AB' },
                            { primary: '#FEFFEB', secondary: '#B7C214' },
                            { primary: '#E7F3DE', secondary: '#84AD36' },
                            { primary: '#FFD9E8', secondary: '#AD6983' },
                            { primary: '#ffdff8', secondary: '#B272A3' },
                            { primary: '#FAE2FF', secondary: '#8A699D' },
                            { primary: '#FFE6CB', secondary: '#B57B6C' },
                            { primary: '#94A3B8', secondary: '#FFFFFF' },
                            { primary: '#B9887A', secondary: '#FFFFFF' },
                            { primary: '#575C9C', secondary: '#FFFFFF' },
                        ].map((preset, i) => (
                            <button
                                key={i}
                                className="aspect-square rounded-[0.4vw] relative overflow-hidden shadow-sm hover:scale-125 transition-transform border border-[#888888]"
                                onClick={() => applyTheme(colorPopup.layoutIndex, preset)}
                            >
                                <div className="absolute inset-0" style={{ backgroundColor: preset.primary }} />
                                <svg
                                    viewBox="0 0 26 26"
                                    className="absolute bottom-0 right-0 w-full h-full"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M5.8807 5.8807L9.59912 2.16228C14.2178 -2.45636 22.1149 0.814742 22.1149 7.34648V14.7833C22.1149 18.8324 18.8324 22.1149 14.7833 22.1149H7.34647C0.814732 22.1149 -2.45637 14.2178 2.16227 9.59912L5.8807 5.8807Z"
                                        fill={preset.secondary}
                                        transform="translate(1, 1)"
                                    />
                                </svg>
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Customize Section Header ── */}
                <div className="px-[0.9vw] flex items-center justify-between mb-[0.6vw]">
                    <h3 className="text-[0.9vw] font-bold text-gray-900">Customize Colors</h3>
                    <div className="flex items-center gap-[0.4vw]">
                        <button
                            onClick={() => handleReset(colorPopup.layoutIndex)}
                            className="p-[0.4vw] rounded-[0.5vw] bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            title="Reset colors"
                        >
                            <Icon icon="system-uicons:reset" className="w-[1vw] h-[1vw]" />
                        </button>
                        <button
                            onClick={() => handleFlip(colorPopup.layoutIndex)}
                            className="p-[0.4vw] rounded-[0.5vw] bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            title="Flip colors"
                        >
                            <Icon icon="mi:switch" className="w-[1vw] h-[1vw]" />
                        </button>
                    </div>
                </div>

                {/* ── Custom Color Fields with Sync ── */}
                <div className="px-[1.2vw] pb-[1vw] flex flex-col gap-[0.8vw]">
                    {(() => {
                        const findColorIdx = (id) => currentColors.findIndex(c => c.id === id);
                        const isToc = selectedComp === 'Table Of Content';
                        const primaryId = isToc ? 'toc-bg' : 'toolbar-bg';
                        const secondaryId = isToc ? 'toc-text' : 'toolbar-text-main';

                        const primaryIdx = findColorIdx(primaryId);
                        const secondaryIdx = findColorIdx(secondaryId);

                        const renderField = (idx, label) => {
                            if (idx === -1) return null;
                            const colorItem = currentColors[idx];
                            const defaultItem = LAYOUT_DEFAULT_COLORS[colorPopup.layoutIndex][idx];
                            const popupPrimaryIds = ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'];
                            const isPopupPrimary = popupPrimaryIds.includes(colorItem.id);
                            const referenceMax = (defaultItem.opacity || 100);
                            const referenceMin = 0; // Treatment of minimum as 0% per user request
                            const percentage = Math.round(((colorItem.opacity - referenceMin) / (referenceMax - referenceMin)) * 100);

                            return (
                                <div className="flex gap-[0.8vw] items-center relative">
                                    <span className="text-[0.85vw] font-semibold text-gray-500 w-[3.5vw] flex-shrink-0">{label}</span>
                                    <button
                                        className="w-[1.7vw] h-[1.7vw] flex-shrink-0 rounded-[0.3vw] border border-gray-400 shadow-sm overflow-hidden"
                                        style={{ backgroundColor: colorItem.hex, opacity: colorItem.opacity / 100 }}
                                        onClick={() => setPickerColorIdx(prev => (prev === idx ? null : idx))}
                                    />
                                    <div className="flex-1 flex items-center justify-between px-[0.5vw] py-[0.3vw] border border-gray-300 rounded-[0.5vw] bg-white">
                                        <input
                                            type="text"
                                            value={hexDrafts[`m_${idx}`] !== undefined ? hexDrafts[`m_${idx}`] : colorItem.hex}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setHexDrafts(prev => ({ ...prev, [`m_${idx}`]: val }));
                                                if (!val.startsWith('#')) return;
                                                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                                    handleColorChange(colorPopup.layoutIndex, idx, val.toUpperCase());
                                                }
                                            }}
                                            onBlur={() => setHexDrafts(prev => { const n = { ...prev }; delete n[`m_${idx}`]; return n; })}
                                            className="text-[0.7vw] font-mono text-gray-600 uppercase bg-transparent outline-none w-full"
                                            maxLength={7}
                                            spellCheck={false}
                                        />
                                        <span className="text-[0.7vw] text-gray-400 flex-shrink-0">
                                            {Math.max(0, Math.min(100, percentage))}%
                                        </span>
                                    </div>

                                    {pickerColorIdx === idx && (
                                        <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none">
                                            <div className="pointer-events-auto">
                                                <ColorPicker
                                                    color={colorItem.hex}
                                                    opacity={colorItem.opacity}
                                                    referenceMin={referenceMin}
                                                    referenceMax={referenceMax}
                                                    onChange={(newHex) => handleColorChange(colorPopup.layoutIndex, idx, newHex)}
                                                    onOpacityChange={(newOp) => handleOpacityChange(colorPopup.layoutIndex, idx, newOp)}
                                                    onClose={() => setPickerColorIdx(null)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        };

                        return (
                            <div className="flex flex-col gap-[0.8vw]">
                                {renderField(primaryIdx, 'Color 1 :')}
                                {renderField(secondaryIdx, 'Color 2 :')}
                            </div>
                        );
                    })()}
                </div>

                {/* ── Footer text ── */}
                <div className="px-[1.2vw] pb-[1.5vw] pt-[0.5vw]">
                    <p className="text-[0.85vw] text-gray-400 leading-tight">
                        Pick your custom colors. Combining light and dark shades helps create a better visual balance.<span className="text-red-400">*</span>
                    </p>
                </div>
            </div>
        </>
    );
};

export default LayoutColorCustomizer;
