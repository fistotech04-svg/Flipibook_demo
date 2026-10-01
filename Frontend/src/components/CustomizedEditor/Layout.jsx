import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import LayoutColorCustomizer from './LayoutColorCustomizer';
import ColorPicker from './ColorPallet';
import AlertModal from '../AlertModal';

import layout1 from '../../assets/layout/Layout1.webp';
import layout2 from '../../assets/layout/Layout2.webp';
import layout3 from '../../assets/layout/Layout3.webp';
import layout4 from '../../assets/layout/Layout4.webp';
import layout5 from '../../assets/layout/Layout5.webp';
import layout6 from '../../assets/layout/Layout6.webp';
import layout7 from '../../assets/layout/Layout7.webp'; // Assuming a Layout7.webp exists or this name works
import layout8 from '../../assets/layout/Layout8.webp';

const layoutImages = [layout1, layout2, layout3, layout4, layout5, layout6, layout7, layout8];


// ─────────────────────────────────────────────────────────────────────────────
// Default color definitions per layout (6 swatches each)
// ─────────────────────────────────────────────────────────────────────────────
export const LAYOUT_DEFAULT_COLORS = {
    1: [
        { id: 'toolbar-bg', label: 'Top bar background color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'bottom-toolbar-bg', label: 'Bottom bar background color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'toolbar-text-main', label: 'Toolbar text color', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'toolbar-icon', label: 'Icon color', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'search-bg-v1', label: 'Search bar background color', hex: '#D7D8E8', opacity: 100, component: 'Toolbar' },
        { id: 'search-text-v1', label: 'Search bar placeholder / text color with its opacity', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'dropdown-bg', label: 'Background color', hex: '#555555', opacity: 80, component: 'Dropdown' },
        { id: 'dropdown-text', label: 'Text color', hex: '#FFFFFF', opacity: 100, component: 'Dropdown' },
        { id: 'thumbnail-outer-v2', label: 'Outer container color', hex: '#555555', opacity: 80, component: 'Thumbnail' },
        { id: 'thumbnail-inner-v2', label: 'Inner container color', hex: '#BCBEE1', opacity: 100, component: 'Thumbnail' },
        { id: 'toc-bg', label: 'Background color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-text', label: 'Text color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-overlay', label: 'Overlay layer', hex: '#000000', opacity: 100, component: 'Table Of Content' },
    ],
    2: [
        { id: 'toolbar-bg', label: 'Topbar BG color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'bottom-toolbar-bg', label: 'Bottombar BG color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'toolbar-text-main', label: 'Icons color', hex: '#FFFFFF', opacity: 80, component: 'Toolbar' },
        { id: 'dropdown-bg', label: 'Background color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-text', label: 'Text color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-icon', label: 'Dropdown icon color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'search-bg-v2', label: 'Search bar BG color', hex: '#DDE0F4', opacity: 100, component: 'Toolbar' },
        { id: 'search-text-v1', label: 'Search bar text color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'thumbnail-outer-v2', label: 'Thumbnail BG color', hex: '#dcdef7', opacity: 100, component: 'Table Of Content' },
        { id: 'thumbnail-inner-v2', label: 'Inner container color', hex: '#BCBEE1', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-bg', label: 'TOC Background color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-text', label: 'TOC Text color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-icon', label: 'TOC Icon color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-overlay', label: 'TOC Overlay', hex: '#000000', opacity: 100, component: 'Table Of Content' },
    ],
    3: [
        { id: 'toolbar-bg', label: 'Top bar background color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'bottom-toolbar-bg', label: 'Bottom bar background color', hex: '#3E4491', opacity: 100, component: 'Toolbar' },
        { id: 'toolbar-text-main', label: 'Toolbar text color', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'toolbar-icon', label: 'Icon color', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'search-bg-v2', label: 'Search bar background color', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'search-text-v1', label: 'Search bar placeholder / text color with its opacity', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'dropdown-bg', label: 'Background color', hex: '#FFFFFF', opacity: 100, component: 'Dropdown' },
        { id: 'dropdown-text', label: 'Text color', hex: '#555555', opacity: 100, component: 'Dropdown' },
        { id: 'dropdown-icon', label: 'Dropdown icon color', hex: '#555555', opacity: 100, component: 'Dropdown' },
        { id: 'thumbnail-outer-v2', label: 'Outer container color', hex: '#FFFFFF', opacity: 100, component: 'Thumbnail' },
        { id: 'thumbnail-inner-v2', label: 'Inner container color', hex: '#E2E4F0', opacity: 100, component: 'Thumbnail' },
        { id: 'toc-bg', label: 'Background color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-text', label: 'Text color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-icon', label: 'Icon color', hex: '#555555', opacity: 100, component: 'Thumbnail' },
        { id: 'toc-overlay', label: 'Overlay layer', hex: '#000000', opacity: 100, component: 'Table Of Content' },
    ],
    4: [
        { id: 'toolbar-bg', label: 'Topbar BG color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'bottom-toolbar-bg', label: 'Bottombar BG color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'toolbar-text-main', label: 'Text color', hex: '#FFFFFF', opacity: 80, component: 'Toolbar' },
        { id: 'toolbar-icon', label: 'Icon color', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'search-bg-v2', label: 'Search bar BG color', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'search-text-v1', label: 'Search bar text color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'dropdown-bg', label: 'Dropdown BG color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-text', label: 'Dropdown text color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-icon', label: 'Dropdown icon color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'thumbnail-outer-v2', label: 'Thumbnail BG color', hex: '#EBEBEB', opacity: 100, component: 'Table Of Content' },
        { id: 'thumbnail-inner-v2', label: 'Thumbnail Accent color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-bg', label: 'TOC Background color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-text', label: 'TOC Text color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-icon', label: 'TOC Icon color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
    ],
    5: [
        { id: 'toolbar-bg', label: 'Topbar BG color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'bottom-toolbar-bg', label: 'Bottombar BG color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'toolbar-text-main', label: 'Icons color', hex: '#FFFFFF', opacity: 80, component: 'Toolbar' },
        { id: 'dropdown-bg', label: 'Background color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-text', label: 'Text color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-icon', label: 'Dropdown icon color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'search-bg-v2', label: 'Search bar BG color', hex: '#DDE0F4', opacity: 100, component: 'Toolbar' },
        { id: 'search-text-v1', label: 'Search bar text color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'thumbnail-outer-v2', label: 'Thumbnail BG color', hex: '#dcdef7', opacity: 100, component: 'Table Of Content' },
        { id: 'thumbnail-inner-v2', label: 'Inner container color', hex: '#BCBEE1', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-bg', label: 'TOC Background color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-text', label: 'TOC Text color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-icon', label: 'TOC Icon color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-overlay', label: 'TOC Overlay', hex: '#000000', opacity: 100, component: 'Table Of Content' },
    ],
    6: [
        { id: 'toolbar-bg', label: 'Sidebar BG color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'bottom-toolbar-bg', label: 'Bottom bar background color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'toolbar-text-main', label: 'Icons color', hex: '#FFFFFF', opacity: 90, component: 'Toolbar' },
        { id: 'toolbar-icon', label: 'Toolbar icon color', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'search-bg-v2', label: 'Search bar background color', hex: '#DDE0F4', opacity: 100, component: 'Toolbar' },
        { id: 'search-text-v1', label: 'Search bar text color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'dropdown-bg', label: 'Dropdown BG color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-text', label: 'Dropdown text color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-icon', label: 'Dropdown icon color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'thumbnail-outer-v2', label: 'Thumbnail BG color', hex: '#dcdef7', opacity: 100, component: 'Table Of Content' },
        { id: 'thumbnail-inner-v2', label: 'Inner container color', hex: '#BCBEE1', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-bg', label: 'TOC Background color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-text', label: 'TOC Text color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-icon', label: 'TOC Icon color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-overlay', label: 'TOC Overlay', hex: '#000000', opacity: 100, component: 'Table Of Content' },
    ],
    7: [
        { id: 'toolbar-bg', label: 'Toolbar BG color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'toolbar-text-main', label: 'Icon & Text color', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'toolbar-icon', label: 'Toolbar Icon', hex: '#FFFFFF', opacity: 70, component: 'Toolbar' },
        { id: 'bottom-toolbar-bg', label: 'Bottom Bar BG', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'search-bg-v2', label: 'Search BG color', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'search-text-v1', label: 'Search text color', hex: '#2D2D2D', opacity: 100, component: 'Toolbar' },
        { id: 'dropdown-bg', label: 'Dropdown BG color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-text', label: 'Dropdown text color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-icon', label: 'Dropdown icon color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-bg', label: 'TOC Background', hex: '#FFFFFF', opacity: 40, component: 'Table Of Content' },
        { id: 'toc-text', label: 'TOC Text', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-icon', label: 'TOC Icon', hex: '#555555', opacity: 60, component: 'Table Of Content' },
    ],
    8: [
        { id: 'toolbar-bg', label: 'Topbar BG color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'bottom-toolbar-bg', label: 'Bottombar BG color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'toolbar-text-main', label: 'Icons color', hex: '#FFFFFF', opacity: 80, component: 'Toolbar' },
        { id: 'dropdown-bg', label: 'Background color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-text', label: 'Text color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-icon', label: 'Dropdown icon color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'search-bg-v2', label: 'Search bar BG color', hex: '#DDE0F4', opacity: 100, component: 'Toolbar' },
        { id: 'search-text-v1', label: 'Search bar text color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'reset-bg', label: 'Reset box BG', hex: '#B8BBCE', opacity: 100, component: 'Toolbar' },
        { id: 'reset-text', label: 'Reset box text', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'page-number-bg', label: 'Page number BG', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'page-number-text', label: 'Page number text', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'thumbnail-outer-v2', label: 'Thumbnail BG color', hex: '#dcdef7', opacity: 100, component: 'Table Of Content' },
        { id: 'thumbnail-inner-v2', label: 'Inner container color', hex: '#BCBEE1', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-bg', label: 'TOC Background color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-text', label: 'TOC Text color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-icon', label: 'TOC Icon color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-overlay', label: 'TOC Overlay', hex: '#000000', opacity: 100, component: 'Table Of Content' },
    ],
    9: [
        { id: 'toolbar-bg', label: 'Icon BG color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'toolbar-text-main', label: 'Icons text color', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'bottom-toolbar-bg', label: 'Bottom bar BG color', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'search-bg-v2', label: 'Search bar BG', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'search-text-v1', label: 'Search bar text', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'reset-bg', label: 'Reset box BG', hex: '#B8BBCE', opacity: 100, component: 'Toolbar' },
        { id: 'reset-text', label: 'Reset box text', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'page-number-bg', label: 'Page number BG', hex: '#555555', opacity: 100, component: 'Toolbar' },
        { id: 'page-number-text', label: 'Page number text', hex: '#FFFFFF', opacity: 100, component: 'Toolbar' },
        { id: 'dropdown-bg', label: 'Dropdown BG color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-text', label: 'Dropdown text color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'dropdown-icon', label: 'Dropdown icon color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'thumbnail-outer-v2', label: 'Thumbnail BG color', hex: '#EBEBEB', opacity: 100, component: 'Table Of Content' },
        { id: 'thumbnail-inner-v2', label: 'Thumbnail Accent color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-bg', label: 'TOC Background color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-text', label: 'TOC Text color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-icon', label: 'TOC Icon color', hex: '#555555', opacity: 100, component: 'Table Of Content' },
        { id: 'toc-overlay', label: 'Overlay color', hex: '#FFFFFF', opacity: 100, component: 'Table Of Content' },
    ],
};



// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Layout = ({ activeLayout, onUpdateLayout, layoutColors, onUpdateLayoutColors, onTocSettingsClick }) => {
    const [colorPopup, setColorPopup] = useState(null);
    const [activeTab, setActiveTab] = useState('Layouts');
    const [inlinePickerOpen, setInlinePickerOpen] = useState(null); // { colorId: string }
    const [inlineHexDrafts, setInlineHexDrafts] = useState({});
    const dropdownRef = useRef(null);
    const [layoutChangeAlert, setLayoutChangeAlert] = useState({ isOpen: false, index: null });

    // ── Helper to format layout colors payload matching backend schema ────
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

    // ── Helper methods for inline edits ─────────────────────────────────────
    const getTint = (hex, weight = 0.8) => {
        let r = parseInt(hex.slice(1, 3), 16); let g = parseInt(hex.slice(3, 5), 16); let b = parseInt(hex.slice(5, 7), 16);
        r = Math.round(r + (255 - r) * weight); g = Math.round(g + (255 - g) * weight); b = Math.round(b + (255 - b) * weight);
        const toHex = x => x.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    };

    const getShade = (hex, weight = 0.6) => {
        if (!hex || hex === 'transparent') return hex;
        let c = hex.substring(1).toUpperCase();
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        if (c.length !== 6) return hex;
        let r = parseInt(c.slice(0, 2), 16); let g = parseInt(c.slice(2, 4), 16); let b = parseInt(c.slice(4, 6), 16);
        r = Math.round(r * (1 - weight)); g = Math.round(g * (1 - weight)); b = Math.round(b * (1 - weight));
        const toHex = x => x.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    };

    const isLightColor = (hex) => {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
        let c = hex.substring(1).toUpperCase();
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        if (c.length !== 6) return false;
        const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.7;
    };

    const ensureDarkText = (hex) => {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
        let c = hex.substring(1).toUpperCase();
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        if (c.length !== 6) return hex;
        const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (luminance > 0.45) return getShade(hex, 0.5);
        return hex;
    };

    const buildMergedColors = (savedSource) => {
        const saved = savedSource || {};
        const merged = {};
        const toolbarP = saved.toolbarColor?.primary;
        const toolbarS = saved.toolbarColor?.secondary;
        const popupP = saved.popupColor?.primary;
        const popupS = saved.popupColor?.secondary;

        for (const key of Object.keys(LAYOUT_DEFAULT_COLORS)) {
            const idx = parseInt(key);
            merged[idx] = LAYOUT_DEFAULT_COLORS[idx].map((c) => {
                const savedItem = saved[idx]?.find(s => s && s.id === c.id);
                let hexVal = c.hex;
                let opacityVal = c.opacity;

                if (savedItem && savedItem.hex) {
                    hexVal = savedItem.hex;
                    opacityVal = savedItem.opacity !== undefined ? savedItem.opacity : c.opacity;
                } else {
                    if (toolbarP && ['toolbar-bg', 'bottom-toolbar-bg', 'page-number-bg'].includes(c.id)) {
                        hexVal = toolbarP;
                    } else if (toolbarP && ['search-bg-v1', 'search-bg-v2', 'reset-bg'].includes(c.id)) {
                        hexVal = getTint(toolbarP, 0.75);
                    } else if (toolbarS && ['toolbar-text-main', 'toolbar-icon', 'search-text-v1', 'reset-text', 'page-number-text'].includes(c.id)) {
                        if (c.id === 'search-text-v1') {
                            const isLightBar = isLightColor(toolbarP || c.hex);
                            hexVal = ensureDarkText(isLightBar ? toolbarS : (toolbarP || c.hex));
                            opacityVal = 100;
                        } else {
                            hexVal = toolbarS;
                            const isLightBg = isLightColor(toolbarP || c.hex);
                            const isStandardPurple = toolbarS.toUpperCase() === '#555555';
                            if (isLightBg && isStandardPurple) opacityVal = 100;
                        }
                    } else if (popupP && ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'].includes(c.id)) {
                        hexVal = popupP;
                    } else if (popupS && ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'].includes(c.id)) {
                        hexVal = popupS;
                    }
                }

                return {
                    ...c,
                    ...(savedItem ? savedItem : {}),
                    hex: hexVal,
                    opacity: opacityVal
                };
            });
        }

        // Auto-correct legacy saved colors for Style B layouts (light background / vibrant text)
        const styleBLayouts = [3, 4, 5, 6, 7, 9];
        const popupPrimaryIds = ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'];
        const popupSecondaryIds = ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'];

        const masterPrimary = merged[1]?.find(c => popupPrimaryIds.includes(c.id))?.hex;
        const masterSecondary = merged[1]?.find(c => popupSecondaryIds.includes(c.id))?.hex;

        if (masterPrimary && masterSecondary) {
            styleBLayouts.forEach(layoutIdx => {
                if (merged[layoutIdx]) {
                    const currentPrimary = merged[layoutIdx].find(c => popupPrimaryIds.includes(c.id))?.hex;
                    const currentSecondary = merged[layoutIdx].find(c => popupSecondaryIds.includes(c.id))?.hex;

                    if (currentPrimary === masterPrimary && currentSecondary === masterSecondary) {
                        merged[layoutIdx] = merged[layoutIdx].map(c => {
                            if (popupPrimaryIds.includes(c.id)) return { ...c, hex: masterSecondary };
                            if (popupSecondaryIds.includes(c.id)) return { ...c, hex: masterPrimary };
                            return c;
                        });
                    }
                }
            });
        }

        return {
            ...merged,
            toolbarColor: savedSource?.toolbarColor || {},
            popupColor: savedSource?.popupColor || {}
        };
    };

    // ── Merge saved with defaults ──────────────────────────────────────────
    const [colors, setColors] = useState(() => buildMergedColors(layoutColors));

    useEffect(() => {
        setColors(buildMergedColors(layoutColors));
    }, [layoutColors]);

    // ── Inline color change handlers ───────────────────────────────────────
    const handleInlineColorChange = (layoutIdx, colorId, newHex) => {
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

            const masterPrimaryId = 'toolbar-bg';
            const masterSecondaryId = 'toolbar-text-main';
            const popupPrimaryIds = ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'];
            const popupSecondaryIds = ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'];

            const isToolbarAction = colorId === masterPrimaryId || colorId === masterSecondaryId;
            const isPopupAction = popupPrimaryIds.includes(colorId) || popupSecondaryIds.includes(colorId);

            if (isToolbarAction) {
                for (let i = 1; i <= 9; i++) {
                    const primaryHex = colorId === masterPrimaryId ? newHex : (updated[i].find(c => c.id === masterPrimaryId)?.hex || newHex);
                    const secondaryHex = colorId === masterSecondaryId ? newHex : (updated[i].find(c => c.id === masterSecondaryId)?.hex || newHex);

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
                                const isLightBg = isLightColor(primaryHex);
                                const isStandardPurple = secondaryHex.toUpperCase() === '#555555';
                                if (isLightBg && isStandardPurple) targetOpacity = 100;
                            }
                            return { ...c, hex: targetHex, opacity: targetOpacity };
                        }
                        return c;
                    });
                }
            } else if (isPopupAction) {
                const isPrimary = popupPrimaryIds.includes(colorId);
                const styleBLayouts = [3, 4, 5, 6, 7, 9];
                const sourceIsStyleB = styleBLayouts.includes(layoutIdx);

                const currentSourcePrimary = updated[layoutIdx].find(c => popupPrimaryIds.includes(c.id))?.hex || updated.popupColor?.primary || newHex;
                const currentSourceSecondary = updated[layoutIdx].find(c => popupSecondaryIds.includes(c.id))?.hex || updated.popupColor?.secondary || newHex;

                const sourcePrimaryHex = isPrimary ? newHex : currentSourcePrimary;
                const sourceSecondaryHex = !isPrimary ? newHex : currentSourceSecondary;

                for (let i = 1; i <= 9; i++) {
                    const targetIsStyleB = styleBLayouts.includes(i);
                    let targetPrimaryHex = sourcePrimaryHex;
                    let targetSecondaryHex = sourceSecondaryHex;

                    if (sourceIsStyleB !== targetIsStyleB) {
                        targetPrimaryHex = sourceSecondaryHex;
                        targetSecondaryHex = sourcePrimaryHex;
                    }

                    updated[i] = updated[i].map(c => {
                        if (popupPrimaryIds.includes(c.id)) return { ...c, hex: targetPrimaryHex };
                        if (popupSecondaryIds.includes(c.id)) return { ...c, hex: targetSecondaryHex };
                        return c;
                    });
                }
            } else {
                updated[layoutIdx] = updated[layoutIdx].map(c => c.id === colorId ? { ...c, hex: newHex } : c);
            }

            const formatted = formatLayoutColorsPayload(updated);
            if (onUpdateLayoutColors) {
                setTimeout(() => onUpdateLayoutColors(formatted), 0);
            }
            return formatted;
        });
    };

    const handleInlineOpacityChange = (layoutIdx, colorId, newOpacity) => {
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

            const isToolbarPrimary = colorId === 'toolbar-bg';
            const isToolbarSecondary = colorId === 'toolbar-text-main';
            const isPopupPrimary = ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'].includes(colorId);
            const isPopupSecondary = ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'].includes(colorId);

            if (isToolbarPrimary || isToolbarSecondary || isPopupPrimary || isPopupSecondary) {
                for (let i = 1; i <= 9; i++) {
                    if (isToolbarPrimary) {
                        const idsToSync = ['toolbar-bg', 'bottom-toolbar-bg', 'search-bg-v1', 'search-bg-v2', 'page-number-bg', 'reset-bg'];
                        updated[i] = updated[i].map(c => idsToSync.includes(c.id) ? { ...c, opacity: newOpacity } : c);
                    } else if (isToolbarSecondary) {
                        const idsToSync = ['toolbar-text-main', 'toolbar-icon', 'search-text-v1', 'reset-text', 'page-number-text'];
                        updated[i] = updated[i].map(c => idsToSync.includes(c.id) ? { ...c, opacity: newOpacity } : c);
                    } else if (isPopupPrimary) {
                        const idsToSync = ['toc-bg', 'dropdown-bg', 'thumbnail-outer-v2', 'thumbnail-inner-v2', 'toc-overlay'];
                        updated[i] = updated[i].map(c => idsToSync.includes(c.id) ? { ...c, opacity: newOpacity } : c);
                    } else if (isPopupSecondary) {
                        const idsToSync = ['toc-text', 'dropdown-text', 'dropdown-icon', 'toc-icon'];
                        updated[i] = updated[i].map(c => idsToSync.includes(c.id) ? { ...c, opacity: newOpacity } : c);
                    }
                }
            } else {
                updated[layoutIdx] = updated[layoutIdx].map(c => c.id === colorId ? { ...c, opacity: newOpacity } : c);
            }

            const formatted = formatLayoutColorsPayload(updated);
            if (onUpdateLayoutColors) {
                setTimeout(() => onUpdateLayoutColors(formatted), 0);
            }
            return formatted;
        });
    };

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleLayoutClick = (index) => {
        if (onUpdateLayout) {
            onUpdateLayout(index);
        }
    };

    const openPopup = (layoutIdx) => {
        setColorPopup({ layoutIndex: layoutIdx });
    };

    const layoutNames = { 1: 'Layout 1', 2: 'Layout 2', 3: 'Layout 3', 4: 'Layout 4', 5: 'Layout 5', 6: 'Layout 6', 7: 'Layout 7', 8: 'Layout 8' };

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="relative flex flex-col w-full min-h-full pb-[5vw]">
            {/* ── Top Tab Buttons ── */}
            <div className="sticky top-0 z-[50] grid grid-cols-2 gap-[0.8vw] py-[0.8vw] mb-[1vw] bg-white px-[1vw] border-b border-gray-100">
                {['Layouts', 'Layout Colors'].map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                if (tab === 'Layouts') {
                                    setColorPopup(null);
                                } else if (tab === 'Layout Colors' && onTocSettingsClick) {
                                    onTocSettingsClick();
                                }
                            }}
                            className={`flex-1 py-[0.50vw] text-[0.85vw] font-semibold rounded-[0.5vw] transition-all active:scale-95 border border-transparent ${activeTab === tab
                                ? 'text-black bg-white shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)] border-gray-500/20'
                                : 'text-gray-400 bg-white shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'
                                }`}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>



            {/* ── Layout Grid ── */}
            {activeTab === 'Layouts' && (
                <div className="px-[1vw] pb-[1vw] grid grid-cols-2 gap-[0.8vw] relative z-[10]">
                    {layoutImages.map((img, index) => {
                        const layoutIds = [1, 2, 3, 4, 5, 6, 7, 8];
                        const layoutNum = layoutIds[index];
                        const isActive = activeLayout === layoutNum;
                        const layoutColorsList = colors[layoutNum] || [];
                        const layoutName = layoutNames[layoutNum] || `Layout ${layoutNum}`;
                        const isSpotlighted = isActive && colorPopup;

                        return (
                            <div
                                key={index}
                                onClick={() => { if (!colorPopup) handleLayoutClick(layoutNum); }}
                                className={`flex flex-col gap-[0.4vw] p-[0.45vw] rounded-[0.8vw] transition-all duration-300 border-2 cursor-pointer ${isActive
                                    ? 'border-[#3E4491] bg-white shadow-[0_4px_12px_rgba(62,68,145,0.12)] scale-[1.02]'
                                    : 'border-transparent hover:bg-gray-50'
                                    } ${isSpotlighted ? 'relative z-[310] !bg-white' : ''}`}
                            >
                                <div className="relative group rounded-[0.6vw] overflow-hidden transition-all bg-[#F8F9FA] aspect-[1.4/1]">
                                    <img src={img} alt={layoutName} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex items-center justify-center px-[0vw] pt-[0.2vw]">
                                    <span className={` font-semibold ${isActive ? 'text-gray-800 text-[0.8vw]' : 'text-gray-800 text-[0.75vw]'}`}>
                                        {layoutName}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Inline Layout Colors View ── */}
            {activeTab === 'Layout Colors' && (() => {
                const currentLayoutColors = (LAYOUT_DEFAULT_COLORS[activeLayout] || []).map(d => {
                    const saved = (colors[activeLayout] || []).find(s => s.id === d.id);
                    return saved ? { ...saved } : { ...d };
                });

                const styleBLayouts = [3, 4, 5, 6, 7, 9];
                const isStyleB = styleBLayouts.includes(activeLayout);
                
                const fallbackPopupPrimary = isStyleB ? (colors.popupColor?.secondary || '#FFFFFF') : (colors.popupColor?.primary || '#555555');
                const fallbackPopupSecondary = isStyleB ? (colors.popupColor?.primary || '#555555') : (colors.popupColor?.secondary || '#FFFFFF');

                const toolbarPrimary = currentLayoutColors.find(c => c.id === 'toolbar-bg') || { id: 'toolbar-bg', hex: colors.toolbarColor?.primary || '#555555', opacity: 100 };
                const toolbarSecondary = currentLayoutColors.find(c => c.id === 'toolbar-text-main') || { id: 'toolbar-text-main', hex: colors.toolbarColor?.secondary || '#FFFFFF', opacity: 100 };
                const popupPrimary = currentLayoutColors.find(c => c.id === 'toc-bg') || currentLayoutColors.find(c => c.id === 'dropdown-bg') || { id: 'toc-bg', hex: fallbackPopupPrimary, opacity: 80 };
                const popupSecondary = currentLayoutColors.find(c => c.id === 'toc-text') || currentLayoutColors.find(c => c.id === 'dropdown-text') || { id: 'toc-text', hex: fallbackPopupSecondary, opacity: 100 };

                const colorPresets = [
                    { primary: LAYOUT_DEFAULT_COLORS[1][0].hex, secondary: LAYOUT_DEFAULT_COLORS[1][2].hex },
                    { primary: '#901B44', secondary: '#FFFFFF' },
                    { primary: '#90891B', secondary: '#FFFFFF' },
                    { primary: '#1B9031', secondary: '#FFFFFF' },
                    { primary: '#841B90', secondary: '#FFFFFF' },
                    { primary: '#000000', secondary: '#FFFFFF' },
                    { primary: '#7193B0', secondary: '#E2F2FC' },
                    { primary: '#B77BAC', secondary: '#FFEDFC' },
                    { primary: '#B9887A', secondary: '#FFFFFF' },
                    { primary: '#88BC75', secondary: '#E7F3DE' },
                    { primary: '#94A3B8', secondary: '#FFFFFF' },
                    { primary: '#575C9C', secondary: '#FFFFFF' },
                ];

                // Render a single color row with clickable swatch, editable hex input, opacity, and color picker
                const renderColorRow = (label, colorObj, draftKey) => {
                    const colorId = colorObj.id;
                    const defaultItem = (LAYOUT_DEFAULT_COLORS[activeLayout] || []).find(d => d.id === colorId) || colorObj;
                    const refMax = defaultItem.opacity || 100;
                    const isPickerOpen = inlinePickerOpen?.colorId === colorId;

                    return (
                        <div key={colorId} className="flex items-center relative gap-[0.5vw]">
                            <span className="text-[0.85vw] font-semiboldtext-gray-500 w-[3.5vw] flex-shrink-0">{label}</span>
                            {/* Clickable swatch → opens Colors Pallet */}
                            <button
                                className="w-[2vw] h-[2vw]  flex-shrink-0 rounded-[0.5vw] border border-gray-400 shadow-sm overflow-hidden cursor-pointer"
                                style={{ backgroundColor: colorObj.hex, opacity: colorObj.opacity / 100 }}
                                onClick={() => setInlinePickerOpen(isPickerOpen ? null : { colorId })}
                            />
                            {/* Hex + opacity field */}
                            <div className="flex-1 flex items-center justify-between px-[0.5vw] py-[0.5vw] border border-gray-300 rounded-[0.5vw] bg-white">
                                <input
                                    type="text"
                                    value={inlineHexDrafts[draftKey] !== undefined ? inlineHexDrafts[draftKey] : colorObj.hex.toUpperCase()}
                                    onChange={e => {
                                        const raw = e.target.value;
                                        setInlineHexDrafts(prev => ({ ...prev, [draftKey]: raw }));
                                        let val = raw.trim();
                                        if (!val.startsWith('#')) val = '#' + val;
                                        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                            handleInlineColorChange(activeLayout, colorId, val.toUpperCase());
                                        }
                                    }}
                                    onBlur={() => setInlineHexDrafts(prev => { const n = { ...prev }; delete n[draftKey]; return n; })}
                                    className="text-[0.7vw] font-mono text-gray-600 uppercase bg-transparent outline-none w-full"
                                    maxLength={7}
                                    spellCheck={false}
                                />
                                <span className="text-[0.7vw] text-gray-400 flex-shrink-0">{colorObj.opacity}%</span>
                            </div>
                            {/* Colors Pallet popup */}
                            {isPickerOpen && (
                                <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none">
                                    <div className="pointer-events-auto">
                                        <ColorPicker
                                            color={colorObj.hex}
                                            opacity={colorObj.opacity}
                                            referenceMin={0}
                                            referenceMax={refMax}
                                            onChange={newHex => handleInlineColorChange(activeLayout, colorId, newHex)}
                                            onOpacityChange={newOp => handleInlineOpacityChange(activeLayout, colorId, newOp)}
                                            onClose={() => setInlinePickerOpen(null)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                };

                const renderColorSection = (title, primaryColor, secondaryColor, primaryDraftKey, secondaryDraftKey) => (
                    <div>
                        {/* Section header */}
                        <div className="flex items-center gap-[0.5vw] pt-[0.5vw] mb-[0.8vw]">
                            <span className="text-[0.9vw] font-bold text-gray-800 whitespace-nowrap">{title}</span>
                            <div className="h-[1px] bg-gray-100 flex-1"></div>
                        </div>

                        {/* Preset swatches: 8-col × 2 rows — clicking applies theme */}
                        <div className="grid grid-cols-6 gap-[0.7vw] mb-[0.7vw]">
                            {colorPresets.map((preset, i) => {
                                const isActive = preset.primary.toUpperCase() === primaryColor.hex.toUpperCase() &&
                                    preset.secondary.toUpperCase() === secondaryColor.hex.toUpperCase();
                                return (
                                    <button
                                        key={i}
                                        className={`relative aspect-square rounded-[0.5vw] border shadow-sm transition-all hover:scale-110 overflow-hidden ${isActive
                                            ? 'border-[#3E4491] border-[0.125vw] ring-[0.125vw] ring-indigo-100 scale-110'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => {
                                            handleInlineColorChange(activeLayout, primaryColor.id, preset.primary);
                                            handleInlineColorChange(activeLayout, secondaryColor.id, preset.secondary);
                                        }}
                                    >
                                        <div className="absolute inset-0" style={{ backgroundColor: preset.primary }} />
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="absolute bottom-0 right-0 left-4 top-4 w-105% h-105%"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M5.8807 5.8807L9.59912 2.16228C14.2178 -2.45636 22.1149 0.814742 22.1149 7.34648V14.7833C22.1149 18.8324 18.8324 22.1149 14.7833 22.1149H7.34647C0.814732 22.1149 -2.45637 14.2178 2.16227 9.59912L5.8807 5.8807Z"
                                                fill={preset.secondary}
                                                transform="translate(2, 2)"
                                            />
                                        </svg>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Customize Colors + swap & reset buttons */}
                        <div className="flex items-center justify-between pt-[0.5vw] pb-[0.5vw] gap-[1vw] ">
                            <span className="text-[0.8vw] font-semibold text-gray-800">Customize Colors</span>
                            <div className="flex items-center gap-[0.5vw]">
                                <button
                                    className="p-[0.3vw] rounded-[0.4vw] bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    title="Reset colors"
                                    onClick={() => {
                                        const defaultPrimary = (LAYOUT_DEFAULT_COLORS[activeLayout] || []).find(d => d.id === primaryColor.id);
                                        const defaultSecondary = (LAYOUT_DEFAULT_COLORS[activeLayout] || []).find(d => d.id === secondaryColor.id);
                                        if (defaultPrimary) {
                                            handleInlineColorChange(activeLayout, primaryColor.id, defaultPrimary.hex);
                                            handleInlineOpacityChange(activeLayout, primaryColor.id, defaultPrimary.opacity || 100);
                                        }
                                        if (defaultSecondary) {
                                            handleInlineColorChange(activeLayout, secondaryColor.id, defaultSecondary.hex);
                                            handleInlineOpacityChange(activeLayout, secondaryColor.id, defaultSecondary.opacity || 100);
                                        }
                                    }}
                                >
                                    <Icon icon="lucide:rotate-ccw" className="w-[0.85vw] h-[0.85vw]" />
                                </button>
                                <button
                                    className="p-[0.3vw] rounded-[0.4vw] bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    title="Swap colors"
                                    onClick={() => {
                                        const ph = primaryColor.hex;
                                        const sh = secondaryColor.hex;
                                        handleInlineColorChange(activeLayout, primaryColor.id, sh);
                                        handleInlineColorChange(activeLayout, secondaryColor.id, ph);
                                    }}
                                >
                                    <Icon icon="mi:switch" className="w-[0.85vw] h-[0.85vw]" />
                                </button>
                            </div>
                        </div>

                        {/* Color rows */}
                        <div className="flex flex-col gap-[0.5vw] mb-[0.5vw]">
                            {renderColorRow('Color 1 :', primaryColor, primaryDraftKey)}
                            {renderColorRow('Color 2 :', secondaryColor, secondaryDraftKey)}
                        </div>

                        {/* Helper text */}
                        <p className="text-[0.66vw] text-gray-400 font-xs leading-tight">
                            Pick your custom colors. Combining light and dark shades helps create a better visual balance.<span className="text-red-400">*</span>
                        </p>
                    </div>
                );

                return (
                    <div
                        className="flex flex-col px-[1vw] pb-[1.5vw] gap-[1.2vw] overflow-y-auto"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {renderColorSection('Toolbar Color', toolbarPrimary, toolbarSecondary, 'tp', 'ts')}
                        {renderColorSection('Popups Color', popupPrimary, popupSecondary, 'pp', 'ps')}
                    </div>
                );
            })()}

            {/* ── Layout Color Customizer Popup ── */}
            <LayoutColorCustomizer
                colorPopup={colorPopup}
                setColorPopup={setColorPopup}
                colors={colors}
                setColors={setColors}
                onUpdateLayoutColors={onUpdateLayoutColors}
            />
        </div>
    );
};

export default Layout;
