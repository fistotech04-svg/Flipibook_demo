import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  Trash2,
  Plus,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  WrapText,
  Upload,
  Download,
  Copy,
  ClipboardPaste,
  MousePointer
} from 'lucide-react';
import ExcelJS from 'exceljs';
import ColorPicker from '../ColorPicker';

const FONT_FAMILIES = [
  'Poppins',
  'Inter',
  'Roboto',
  'Arial',
  'Montserrat',
  'Lato',
  'Open Sans',
  'Playfair Display'
];

const FONT_SIZES = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48];

const FONT_WEIGHTS = ['Regular', 'Medium', 'Semi Bold', 'Bold', 'Extra Bold'];

const BORDER_STYLES = [
  { id: 'solid', label: 'Solid', icon: '—' },
  { id: 'dashed', label: 'Dashed', icon: '- -' },
  { id: 'dotted', label: 'Dotted', icon: '···' },
  { id: 'double', label: 'Double', icon: '==' },
  { id: 'none', label: 'None', icon: '✕' }
];

const hexToRgba = (hex, opacity = 100) => {
  if (!hex) return 'transparent';
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  const a = Math.max(0, Math.min(1, (Number(opacity) || 100) / 100));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const getColLetter = (colIdx) => {
  let temp, letter = '';
  let col = Number(colIdx) + 1;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    col = Math.floor((col - temp) / 26);
  }
  return letter || 'A';
};

const parseRgbaColor = (colorStr, defaultHex = '#ffffff') => {
  if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit') {
    return { hex: defaultHex, opacity: 100 };
  }
  if (colorStr.startsWith('#')) {
    let clean = colorStr.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    return { hex: `#${clean}`, opacity: 100 };
  }
  const match = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (match) {
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    const a = match[4] !== undefined ? Math.round(parseFloat(match[4]) * 100) : 100;
    return { hex: `#${r}${g}${b}`, opacity: a };
  }
  return { hex: defaultHex, opacity: 100 };
};

// Section Header matching AudioProperties exact styling
const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.4vw] mt-[0.3vw]">
    <span className="text-[0.9vw] font-medium text-black whitespace-nowrap">{title}</span>
    <div className="h-[0.06vw] bg-gray-200 flex-1 ml-[0.3vw]" />
  </div>
);

// PropertyRow matching AudioProperties exact alignment (w-[5.6vw] pl-[0.5vw])
const PropertyRow = ({ label, children, className = '' }) => (
  <div className={`flex items-center gap-[0.5vw] ${className}`}>
    <div className="w-[5.6vw] shrink-0 flex items-center pl-[0.5vw] justify-between text-gray-700 font-medium">
      <span className={`${label.length > 12 ? 'text-[0.68vw]' : 'text-[0.78vw]'} tracking-tight whitespace-nowrap`}>
        {label}
      </span>
      <span className="text-gray-500 font-medium text-[0.8vw]">:</span>
    </div>
    <div className="flex-1 min-w-0">
      {children}
    </div>
  </div>
);

// Toggle Switch matching AudioProperties exact structure & style
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-[1.9vw] h-[1.1vw] flex items-center rounded-full p-[0.1vw] cursor-pointer transition-colors ${
      checked ? 'bg-[#E05638]' : 'bg-gray-300'
    }`}
  >
    <div
      className={`bg-white w-[0.9vw] h-[0.9vw] rounded-full shadow-md transform transition-transform ${
        checked ? 'translate-x-[0.8vw]' : 'translate-x-0'
      }`}
    />
  </button>
);

// Color Swatch + Hex Input Box matching AudioProperties exact structure
const ColorInput = ({ color, onChange, opacity = 100, onOpenPicker, isActive = false }) => {
  const displayColor = color && color.startsWith('#') ? color.toUpperCase() : color || '#000000';

  return (
    <div className="flex items-center gap-[0.4vw] w-full">
      <div
        onClick={onOpenPicker}
        className={`color-box color-box-trigger w-[2vw] h-[2vw] rounded-[0.5vw] border flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 transition-all ${
          isActive ? 'border-[#E05638] ring-2 ring-[#E05638]/40 scale-105 shadow-xs' : 'border-gray-200 hover:border-gray-300'
        }`}
        style={{ backgroundColor: color || '#000000' }}
        title="Click to open color palette"
      />
      <div className="flex-1 h-[2.5vw] flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white px-[0.6vw] text-[0.8vw] text-gray-800 focus-within:border-[#E05638] shadow-2xs">
        <input
          type="text"
          value={displayColor}
          onChange={(e) => {
            let val = e.target.value;
            if (!val.startsWith('#') && val.length > 0) val = '#' + val;
            onChange(val);
          }}
          className="w-[5.2vw] font-mono text-[0.8vw] text-gray-800 bg-transparent focus:outline-none uppercase font-medium"
          maxLength={7}
        />
        <span className="text-gray-400 text-[0.75vw] font-medium">{opacity}%</span>
      </div>
    </div>
  );
};

const TableProperties = ({
  /* eslint-disable-next-line no-unused-vars */
  selectedElementProps,
  activePageIndex,
  selectedLayerId,
  updateElementAttribute,
  selectedElement,
  onUpdate
}) => {
  // Table Property states
  const [borderStyle, setBorderStyle] = useState('solid');
  const [themeColor, setThemeColor] = useState('#ffffff');
  const [themeOpacity, setThemeOpacity] = useState(100);
  const [borderColor, setBorderColor] = useState('#d1d5db');
  const [borderOpacity, setBorderOpacity] = useState(100);
  const [borderWidth, setBorderWidth] = useState(2);
  const [borderRadius, setBorderRadius] = useState(4);

  // Structure states
  const [rowsCount, setRowsCount] = useState(3);
  const [colsCount, setColsCount] = useState(3);
  const [isScrollable, setIsScrollable] = useState(true);

  // Text & Cell Property states
  const [cellColor, setCellColor] = useState('#000000');
  const [cellOpacity, setCellOpacity] = useState(100);
  const [cellBgColor, setCellBgColor] = useState('#ffffff');
  const [cellBgOpacity, setCellBgOpacity] = useState(100);
  const [fontFamily, setFontFamily] = useState('Poppins');
  const [fontSize, setFontSize] = useState(14);
  const [fontWeight, setFontWeight] = useState('Regular');
  const [autoWidth, setAutoWidth] = useState(true);
  const [autoHeight, setAutoHeight] = useState(true);
  const [textAlign, setTextAlign] = useState('left');
  const [isBold, setIsBold] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isList, setIsList] = useState(false);
  const [verticalAlign, setVerticalAlign] = useState('middle');
  const [textWrapping, setTextWrapping] = useState(true);
  const [paddingX, setPaddingX] = useState(8);
  const [paddingY, setPaddingY] = useState(6);

  // Effects states
  const [hasDropShadow, setHasDropShadow] = useState(false);

  // Dropdown open states
  const [isBorderStyleOpen, setIsBorderStyleOpen] = useState(false);
  const [isFontFamilyOpen, setIsFontFamilyOpen] = useState(false);
  const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
  const [isFontWeightOpen, setIsFontWeightOpen] = useState(false);

  // Active color picker popup ('theme' | 'border' | 'cell' | 'cellBg' | null)
  const [activeColorPicker, setActiveColorPicker] = useState(null);

  // Multi-cell selection & clipboard states
  const [selectedCellKeys, setSelectedCellKeys] = useState(new Set()); // Set of "r_c"
  const selectedCellKeysRef = useRef(new Set());
  const [selectedCellText, setSelectedCellText] = useState('');
  const isMouseDownRef = useRef(false);
  const dragStartRef = useRef(null);
  const lastAnchorRef = useRef(null);
  const fileInputRef = useRef(null);

  // Ref to track live element
  const elementRef = useRef(null);

  // Helper to get actual DOM element inside canvas
  const getTargetElement = () => {
    let el = selectedElement;
    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    if (!el && selectedLayerId) {
      el = editorDoc.getElementById(selectedLayerId) || 
           editorDoc.querySelector(`[id="${selectedLayerId}"]`) || 
           document.getElementById(selectedLayerId) || 
           document.querySelector(`[id="${selectedLayerId}"]`);
    }
    if (el) {
      if (typeof el.closest === 'function') {
        const parentTable = el.closest('[data-type="table"], [data-type="table-frame"], [id^="table-"], [id*="table"]');
        if (parentTable) return parentTable;
      }
      if (typeof el.querySelector === 'function') {
        const childTable = el.querySelector('[data-type="table"], [data-type="table-frame"], [id^="table-"], [id*="table"], .table-fill-layer, .table-card-wrapper, table');
        if (childTable) {
          return childTable.closest('[data-type="table"], [data-type="table-frame"], [id^="table-"]') || childTable;
        }
      }
    }
    return el;
  };

  // Sync DOM changes back to canvas via full serialized SVG safely (clears temp selection highlights)
  const syncChanges = (updatedEl) => {
    const el = updatedEl || getTargetElement();
    if (!el) return;

    window.__skipCanvasUpdateForPage = activePageIndex;
    const svgRoot = (() => {
      const container = el.closest ? el.closest('.page-svg-container') : null;
      if (container) {
        const canvasContent = container.querySelector('[id^="canvas-content-"]');
        return canvasContent ? canvasContent.querySelector('svg') : container.querySelector('svg');
      }
      let node = el;
      let lastSvg = null;
      while (node) {
        if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
        node = node.parentElement;
      }
      return lastSvg;
    })();

    if (svgRoot) {
      const clone = svgRoot.cloneNode(true);
      clone.querySelectorAll('[data-highlight-id], .frame-boundary, #ghost-layer').forEach(n => n.remove());
      // Strip temporary cell selection outlines and shadows so saved SVG is always clean
      clone.querySelectorAll('td[data-cell-selected]').forEach(td => {
        td.removeAttribute('data-cell-selected');
        td.style.removeProperty('outline');
        td.style.removeProperty('outline-offset');
        td.style.removeProperty('box-shadow');
      });
      const serializer = new XMLSerializer();
      const html = serializer.serializeToString(clone);
      if (typeof updateElementAttribute === 'function') {
        updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
      }
      if (typeof onUpdate === 'function') {
        onUpdate(html);
      }
    }
  };

  // Cell Selection helpers
  const markCellSelected = (td, r, c, isSelected) => {
    if (!td) return;
    if (isSelected) {
      td.setAttribute('data-cell-selected', 'true');
      td.style.setProperty('outline', '1px dashed #2563eb', 'important');
      td.style.setProperty('outline-offset', '-1px', 'important');
      td.style.setProperty('box-shadow', 'inset 0 0 0 1000px rgba(37, 99, 235, 0.12)', 'important');
    } else {
      td.removeAttribute('data-cell-selected');
      td.style.removeProperty('outline');
      td.style.removeProperty('outline-offset');
      td.style.removeProperty('box-shadow');
    }
  };

  const syncInspectorWithCell = (td, el) => {
    if (!td) return;
    const table = el?.querySelector('table');

    // 1. Text Content
    setSelectedCellText(td.textContent || '');

    // 2. Text Color & Opacity
    const rawColor = td.style.color || table?.style.color || el?.getAttribute('data-cell-color') || '#000000';
    const parsedColor = parseRgbaColor(rawColor, '#000000');
    setCellColor(parsedColor.hex);
    setCellOpacity(parsedColor.opacity);

    // 3. Cell Background Color & Opacity
    const rawBg = td.style.backgroundColor || table?.style.backgroundColor || el?.getAttribute('data-theme-color') || '#ffffff';
    const parsedBg = parseRgbaColor(rawBg, '#ffffff');
    setCellBgColor(parsedBg.hex);
    setCellBgOpacity(parsedBg.opacity);

    // 4. Font Family
    const rawFam = td.style.fontFamily?.replace(/['"]/g, '').split(',')[0].trim() ||
                   table?.style.fontFamily?.replace(/['"]/g, '').split(',')[0].trim() ||
                   el?.getAttribute('data-font-family') || 'Poppins';
    const matchedFam = FONT_FAMILIES.find(f => f.toLowerCase() === rawFam.toLowerCase()) || rawFam || 'Poppins';
    setFontFamily(matchedFam);

    // 5. Font Size
    const rawSize = parseFloat(td.style.fontSize || table?.style.fontSize || el?.getAttribute('data-font-size') || '13');
    if (!isNaN(rawSize) && rawSize > 0) {
      setFontSize(Math.round(rawSize));
    }

    // 6. Font Weight & Bold
    const rawWeight = td.style.fontWeight || table?.style.fontWeight || el?.getAttribute('data-font-weight') || 'Regular';
    const isBoldVal = rawWeight === '700' || rawWeight === 'bold' || rawWeight.toLowerCase().includes('bold') || el?.getAttribute('data-bold') === 'true';
    setIsBold(isBoldVal);
    if (rawWeight === '700' || rawWeight === 'bold') setFontWeight('Bold');
    else if (rawWeight === '600' || rawWeight === 'Semi Bold') setFontWeight('Semi Bold');
    else if (rawWeight === '500' || rawWeight === 'Medium') setFontWeight('Medium');
    else if (rawWeight === '800' || rawWeight === 'Extra Bold') setFontWeight('Extra Bold');
    else setFontWeight('Regular');

    // 7. Strikethrough
    const isStrike = td.style.textDecoration?.includes('line-through') || false;
    setIsStrikethrough(isStrike);

    // 8. Text Alignment
    const rawAlign = td.style.textAlign || table?.style.textAlign || el?.getAttribute('data-text-align') || 'left';
    setTextAlign(rawAlign);

    // 9. Vertical Alignment
    const rawVAlign = td.style.verticalAlign || table?.style.verticalAlign || el?.getAttribute('data-vertical-align') || 'middle';
    setVerticalAlign(rawVAlign);

    // 10. Text Wrapping
    const rawWrap = td.style.whiteSpace !== 'nowrap';
    setTextWrapping(rawWrap);

    // 11. Padding
    if (td.style.padding) {
      const padParts = td.style.padding.trim().split(/\s+/).map(p => parseFloat(p) || 0);
      if (padParts.length === 1) {
        setPaddingY(padParts[0]);
        setPaddingX(padParts[0]);
      } else if (padParts.length >= 2) {
        setPaddingY(padParts[0]);
        setPaddingX(padParts[1]);
      }
    }
  };

  const syncInspectorWithTable = (targetEl) => {
    const el = targetEl || getTargetElement();
    if (!el) return;

    const bStyle = el.getAttribute('data-border-style') || 'solid';
    const tColor = el.getAttribute('data-theme-color') || '#ffffff';
    const tOpacity = parseInt(el.getAttribute('data-theme-opacity') || '100', 10);
    const bColor = el.getAttribute('data-border-color') || '#cbd5e1';
    const bOpacity = parseInt(el.getAttribute('data-border-opacity') || '100', 10);
    const bWidth = parseFloat(el.getAttribute('data-border-width') || '1.5');
    const bRadius = parseInt(el.getAttribute('data-border-radius') || '0', 10);
    const cColor = el.getAttribute('data-cell-color') || '#000000';
    const cOpacity = parseInt(el.getAttribute('data-cell-opacity') || '100', 10);
    const fFam = el.getAttribute('data-font-family') || 'Poppins';
    const fSize = parseInt(el.getAttribute('data-font-size') || '13', 10);
    const fWeight = el.getAttribute('data-font-weight') || 'Regular';
    const tAlign = el.getAttribute('data-text-align') || 'left';
    const vAlign = el.getAttribute('data-vertical-align') || 'middle';
    const pX = parseInt(el.getAttribute('data-padding-x') || '8', 10);
    const pY = parseInt(el.getAttribute('data-padding-y') || '6', 10);
    const shadow = el.getAttribute('data-drop-shadow') === 'true';
    const wrap = el.getAttribute('data-text-wrapping') !== 'false';
    const bold = el.getAttribute('data-bold') === 'true';
    const strike = el.getAttribute('data-strikethrough') === 'true';
    const list = el.getAttribute('data-list') === 'true';
    const aWidth = el.getAttribute('data-auto-width') === 'true';
    const aHeight = el.getAttribute('data-auto-height') === 'true';

    setBorderStyle(bStyle);
    setThemeColor(tColor);
    setThemeOpacity(tOpacity);
    setBorderColor(bColor);
    setBorderOpacity(bOpacity);
    setBorderWidth(bWidth);
    setBorderRadius(bRadius);
    setCellColor(cColor);
    setCellOpacity(cOpacity);
    setCellBgColor(tColor);
    setCellBgOpacity(tOpacity);
    setFontFamily(fFam);
    setFontSize(fSize);
    setFontWeight(fWeight);
    setTextAlign(tAlign);
    setVerticalAlign(vAlign);
    setPaddingX(pX);
    setPaddingY(pY);
    setHasDropShadow(shadow);
    setTextWrapping(wrap);
    setIsBold(bold);
    setIsStrikethrough(strike);
    setIsList(list);
    setAutoWidth(aWidth);
    setAutoHeight(aHeight);
    setSelectedCellText('');
  };

  // Helper to reliably retrieve currently selected cell DOM elements
  const getSelectedCells = (targetEl) => {
    const el = targetEl || getTargetElement();
    if (!el) return [];

    // 1. Direct check on DOM for elements marked as selected
    const domSelected = Array.from(el.querySelectorAll('td[data-cell-selected="true"], th[data-cell-selected="true"]'));
    if (domSelected.length > 0) {
      return domSelected;
    }

    // 2. Fallback to keys in state or ref
    const activeKeys = (selectedCellKeys && selectedCellKeys.size > 0)
      ? selectedCellKeys
      : (selectedCellKeysRef.current && selectedCellKeysRef.current.size > 0 ? selectedCellKeysRef.current : null);

    if (activeKeys && activeKeys.size > 0) {
      const all = el.querySelectorAll('td, th');
      const matched = Array.from(all).filter(td => {
        const r = td.getAttribute('data-row');
        const c = td.getAttribute('data-col');
        return activeKeys.has(`${r}_${c}`);
      });
      if (matched.length > 0) return matched;
    }

    return [];
  };

  const clearCellSelection = (targetEl) => {
    const el = targetEl || getTargetElement();
    if (el) {
      el.querySelectorAll('td[data-cell-selected], th[data-cell-selected]').forEach(td => {
        markCellSelected(td, 0, 0, false);
      });
      syncInspectorWithTable(el);
    }
    setSelectedCellKeys(new Set());
    selectedCellKeysRef.current = new Set();
    setSelectedCellText('');
  };

  const selectCellRange = (el, r1, c1, r2, c2, keepExisting = false) => {
    const top = Math.min(r1, r2);
    const bottom = Math.max(r1, r2);
    const left = Math.min(c1, c2);
    const right = Math.max(c1, c2);

    const newKeys = keepExisting ? new Set(selectedCellKeys) : new Set();
    const table = el.querySelector('table');
    if (!table) return;

    if (!keepExisting) {
      table.querySelectorAll('td[data-cell-selected], th[data-cell-selected]').forEach(td => {
        markCellSelected(td, 0, 0, false);
      });
    }

    const trs = table.querySelectorAll('tr');
    for (let r = top; r <= bottom; r++) {
      if (!trs[r]) continue;
      const tds = trs[r].querySelectorAll('td, th');
      for (let c = left; c <= right; c++) {
        if (!tds[c]) continue;
        tds[c].setAttribute('data-row', r.toString());
        tds[c].setAttribute('data-col', c.toString());
        const key = `${r}_${c}`;
        newKeys.add(key);
        markCellSelected(tds[c], r, c, true);
      }
    }

    setSelectedCellKeys(newKeys);
    selectedCellKeysRef.current = newKeys;
    if (newKeys.size >= 1) {
      const singleTd = table.querySelector(`td[data-row="${top}"][data-col="${left}"], th[data-row="${top}"][data-col="${left}"]`);
      if (singleTd) {
        syncInspectorWithCell(singleTd, el);
      }
    } else {
      setSelectedCellText('');
    }
  };

  const handleCellMouseDown = (e, td, r, c) => {
    if (e.button !== 0) return;
    const el = getTargetElement();
    if (!el) return;

    isMouseDownRef.current = true;
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    if (isShift && lastAnchorRef.current) {
      selectCellRange(el, lastAnchorRef.current.r, lastAnchorRef.current.c, r, c, isCtrl);
    } else if (isCtrl) {
      const key = `${r}_${c}`;
      const updated = new Set(selectedCellKeys);
      if (updated.has(key)) {
        updated.delete(key);
        markCellSelected(td, r, c, false);
      } else {
        updated.add(key);
        markCellSelected(td, r, c, true);
        syncInspectorWithCell(td, el);
      }
      setSelectedCellKeys(updated);
      selectedCellKeysRef.current = updated;
      lastAnchorRef.current = { r, c };
      if (updated.size === 1) {
        setSelectedCellText(td.textContent || '');
      } else {
        setSelectedCellText('');
      }
    } else {
      clearCellSelection(el);
      dragStartRef.current = { r, c };
      lastAnchorRef.current = { r, c };
      markCellSelected(td, r, c, true);
      const single = new Set([`${r}_${c}`]);
      setSelectedCellKeys(single);
      selectedCellKeysRef.current = single;
      syncInspectorWithCell(td, el);
    }
  };

  const handleCellMouseEnter = (r, c) => {
    if (!isMouseDownRef.current || !dragStartRef.current) return;
    const el = getTargetElement();
    if (!el) return;
    selectCellRange(el, dragStartRef.current.r, dragStartRef.current.c, r, c, false);
  };

  // Get active cell coordinate string (e.g. "Cell B2", "Range A1:C3")
  const getSelectionCoordinateLabel = () => {
    if (selectedCellKeys.size === 0) return 'All Cells Active';
    const entries = Array.from(selectedCellKeys).map(k => {
      const [r, c] = k.split('_').map(Number);
      return { r, c };
    });
    if (entries.length === 1) {
      const { r, c } = entries[0];
      return `Cell ${getColLetter(c)}${r + 1} (Row ${r + 1}, Col ${getColLetter(c)})`;
    }
    const minR = Math.min(...entries.map(e => e.r));
    const maxR = Math.max(...entries.map(e => e.r));
    const minC = Math.min(...entries.map(e => e.c));
    const maxC = Math.max(...entries.map(e => e.c));
    return `Range ${getColLetter(minC)}${minR + 1}:${getColLetter(maxC)}${maxR + 1} (${entries.length} Cells)`;
  };

  const handleCellKeyDown = (e, td) => {
    const el = getTargetElement();
    if (!el) return;
    const table = el.querySelector('table');
    if (!table) return;

    const r = parseInt(td.getAttribute('data-row') || '0', 10);
    const c = parseInt(td.getAttribute('data-col') || '0', 10);
    const trs = table.querySelectorAll('tr');
    const totalRows = trs.length;
    const totalCols = trs[0]?.querySelectorAll('td, th').length || 1;

    if (e.key === 'Tab') {
      e.preventDefault();
      let nextR = r;
      let nextC = c;
      if (e.shiftKey) {
        nextC--;
        if (nextC < 0) {
          nextR--;
          nextC = totalCols - 1;
        }
      } else {
        nextC++;
        if (nextC >= totalCols) {
          nextR++;
          nextC = 0;
        }
      }
      if (nextR >= 0 && nextR < totalRows && nextC >= 0 && nextC < totalCols) {
        const nextTd = table.querySelector(`td[data-row="${nextR}"][data-col="${nextC}"]`);
        if (nextTd) {
          selectCellRange(el, nextR, nextC, nextR, nextC, false);
          nextTd.focus();
        }
      }
    } else if (e.key === 'Enter' && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const nextR = e.shiftKey ? r - 1 : r + 1;
      if (nextR >= 0 && nextR < totalRows) {
        const nextTd = table.querySelector(`td[data-row="${nextR}"][data-col="${c}"]`);
        if (nextTd) {
          selectCellRange(el, nextR, c, nextR, c, false);
          nextTd.focus();
        }
      }
    }
  };

  const attachCellListeners = (el) => {
    if (!el) return;
    const table = el.querySelector('table');
    if (!table) return;

    const trs = table.querySelectorAll('tr');
    trs.forEach((tr, r) => {
      const tds = tr.querySelectorAll('td, th');
      tds.forEach((td, c) => {
        td.setAttribute('data-row', r.toString());
        td.setAttribute('data-col', c.toString());

        if (td.__hasCellListeners) return;
        td.__hasCellListeners = true;

        td.addEventListener('mousedown', (e) => {
          const curR = parseInt(td.getAttribute('data-row') || '0', 10);
          const curC = parseInt(td.getAttribute('data-col') || '0', 10);
          handleCellMouseDown(e, td, curR, curC);
        });
        td.addEventListener('mouseenter', () => {
          const curR = parseInt(td.getAttribute('data-row') || '0', 10);
          const curC = parseInt(td.getAttribute('data-col') || '0', 10);
          handleCellMouseEnter(curR, curC);
        });
        td.addEventListener('keydown', (e) => handleCellKeyDown(e, td));
      });
    });
  };

  // Fit table to page dimensions
  const fitTableToPage = (targetEl) => {
    const el = targetEl || getTargetElement();
    if (!el) return;

    const svgRoot = (() => {
      const container = el.closest ? el.closest('.page-svg-container') : null;
      if (container) {
        const canvasContent = container.querySelector('[id^="canvas-content-"]');
        return canvasContent ? canvasContent.querySelector('svg') : container.querySelector('svg');
      }
      let node = el;
      let lastSvg = null;
      while (node) {
        if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
        node = node.parentElement;
      }
      return lastSvg;
    })();

    let pw = 210, ph = 297;
    if (svgRoot) {
      const vbStr = svgRoot.getAttribute('viewBox');
      if (vbStr) {
        const parts = vbStr.trim().split(/[\s,]+/).map(parseFloat);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          pw = parts[2];
          ph = parts[3];
        }
      }
    }

    const fo = el.querySelector('foreignObject');
    const overlay = el.querySelector('.svg-table-overlay, .svg-image-stroke-overlay');
    if (!fo) return;

    const rows = el.querySelectorAll('tr').length || parseInt(el.getAttribute('data-rows') || '3', 10);
    const marginX = pw <= 400 ? (pw > 150 ? 20 : 10) : Math.round(pw * 0.08);
    const targetW = Math.round(Math.min(pw - marginX * 2, pw * 0.82));
    const maxH = Math.round(ph * 0.55);
    const targetH = Math.round(Math.min(maxH, Math.max(rows * 22, Math.round(targetW * 0.41))));

    const posX = Math.round(Math.max(marginX, (pw - targetW) / 2));
    const posY = Math.round(Math.max(15, Math.min(ph - targetH - 15, (ph - targetH) / 2)));

    fo.setAttribute('width', targetW.toString());
    fo.setAttribute('height', targetH.toString());
    if (overlay) {
      overlay.setAttribute('width', targetW.toString());
      overlay.setAttribute('height', targetH.toString());
    }
    el.setAttribute('transform', `translate(${posX}, ${posY})`);

    // Clean any empty whitespace text nodes inside foreignObject
    Array.from(fo.childNodes).forEach(n => {
      if (n.nodeType === 3 && !n.textContent.trim()) n.remove();
    });
    const wr = fo.querySelector('.table-card-wrapper');
    if (wr) {
      wr.style.whiteSpace = 'normal';
      wr.style.lineHeight = 'normal';
      wr.style.display = 'flex';
      wr.style.flexDirection = 'column';
      Array.from(wr.childNodes).forEach(n => {
        if (n.nodeType === 3 && !n.textContent.trim()) n.remove();
      });
    }

    syncChanges(el);
    if (typeof window.drawOverlayHighlight === 'function') {
      window.drawOverlayHighlight(el, 'selected');
    }
  };

  // Automatically check if table overflows the page bounds and fit it
  // If table was stretched by an outer scale matrix, bake the scale into foreignObject width & height and reset scale to 1
  const normalizeTableTransform = (el) => {
    if (!el) return;
    const tr = el.getAttribute('transform') || '';
    if (!tr || !tr.includes('matrix')) return;
    try {
      const m = new DOMMatrix(tr);
      const scaleX = Math.hypot(m.a, m.b) || 1;
      const scaleY = Math.hypot(m.c, m.d) || 1;
      if (Math.abs(scaleX - 1) > 0.005 || Math.abs(scaleY - 1) > 0.005) {
        const fo = el.querySelector('foreignObject');
        const overlay = el.querySelector('.svg-table-overlay, .svg-image-stroke-overlay') || el.querySelector('rect');
        if (fo) {
          const curW = parseFloat(fo.getAttribute('width') || '170');
          const curH = parseFloat(fo.getAttribute('height') || '70');
          const newW = Math.round(curW * scaleX * 100) / 100;
          const newH = Math.round(curH * scaleY * 100) / 100;
          fo.setAttribute('width', newW.toString());
          fo.setAttribute('height', newH.toString());
          if (overlay) {
            overlay.setAttribute('width', newW.toString());
            overlay.setAttribute('height', newH.toString());
          }
        }
        const normA = m.a / scaleX;
        const normB = m.b / scaleX;
        const normC = m.c / scaleY;
        const normD = m.d / scaleY;
        el.setAttribute('transform', `matrix(${normA} ${normB} ${normC} ${normD} ${m.e} ${m.f})`);
        syncChanges(el);
      }
    } catch {
      // Ignore matrix normalization error
    }
  };

  const checkAndFitTable = (el) => {
    if (!el) return;
    normalizeTableTransform(el);
    const svgRoot = (() => {
      const container = el.closest ? el.closest('.page-svg-container') : null;
      if (container) {
        const canvasContent = container.querySelector('[id^="canvas-content-"]');
        return canvasContent ? canvasContent.querySelector('svg') : container.querySelector('svg');
      }
      let node = el;
      let lastSvg = null;
      while (node) {
        if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
        node = node.parentElement;
      }
      return lastSvg;
    })();

    if (!svgRoot) return;

    let pw = 210, ph = 297;
    const vbStr = svgRoot.getAttribute('viewBox');
    if (vbStr) {
      const parts = vbStr.trim().split(/[\s,]+/).map(parseFloat);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        pw = parts[2];
        ph = parts[3];
      }
    }

    const fo = el.querySelector('foreignObject');
    const overlay = el.querySelector('.svg-table-overlay, .svg-image-stroke-overlay');
    if (!fo) return;

    let curW = parseFloat(fo.getAttribute('width') || '170');
    let curH = parseFloat(fo.getAttribute('height') || '60');
    let posX = 0, posY = 0;
    const transform = el.getAttribute('transform') || '';
    const match = transform.match(/translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/);
    if (match) {
      posX = parseFloat(match[1]);
      posY = parseFloat(match[2]);
    }

    const marginX = pw <= 400 ? (pw > 150 ? 20 : 10) : Math.round(pw * 0.08);
    const maxAllowedW = pw - marginX * 2;
    let needsUpdate = false;

    if (curW > maxAllowedW || (posX + curW) > pw || posX < 0) {
      curW = Math.min(curW, maxAllowedW);
      posX = Math.round(Math.max(marginX, (pw - curW) / 2));
      needsUpdate = true;
    }

    const maxAllowedH = Math.round(ph * 0.7);
    if (curH > maxAllowedH || (posY + curH) > ph || posY < 0) {
      const rows = el.querySelectorAll('tr').length || 3;
      curH = Math.round(Math.min(maxAllowedH, Math.max(rows * (pw <= 400 ? 16 : 45), ph * 0.22)));
      posY = Math.round(Math.max(15, Math.min(ph - curH - 15, (ph - curH) / 2)));
      needsUpdate = true;
    }

    if (needsUpdate) {
      fo.setAttribute('width', curW.toString());
      fo.setAttribute('height', curH.toString());
      if (overlay) {
        overlay.setAttribute('width', curW.toString());
        overlay.setAttribute('height', curH.toString());
      }
      el.setAttribute('transform', `translate(${posX}, ${posY})`);
      syncChanges(el);
      if (typeof window.drawOverlayHighlight === 'function') {
        window.drawOverlayHighlight(el, 'selected');
      }
    }
  };

  // Ensure table contains interactive HTML table with editable cells (upgrades legacy rect/lines table)
  const ensureTableStructure = (el) => {
    if (!el) return;
    const existingTable = el.querySelector('table');
    if (existingTable) {
      attachCellListeners(el);
      return;
    }

    const rect = el.querySelector('rect.table-fill-layer') || el.querySelector('rect');
    const w = parseFloat(rect?.getAttribute('width') || el.getAttribute('width') || '170');
    const h = parseFloat(rect?.getAttribute('height') || el.getAttribute('height') || '60');
    const rows = parseInt(el.getAttribute('data-rows') || '3', 10);
    const cols = parseInt(el.getAttribute('data-cols') || '3', 10);
    const bColor = el.getAttribute('data-border-color') || rect?.getAttribute('stroke') || '#d1d5db';
    const tColor = el.getAttribute('data-theme-color') || el.getAttribute('data-fill-color') || rect?.getAttribute('fill') || '#ffffff';
    const bWidth = parseInt(el.getAttribute('data-border-width') || rect?.getAttribute('stroke-width') || '2', 10);
    const bRadius = parseInt(el.getAttribute('data-border-radius') || rect?.getAttribute('rx') || '4', 10);

    // Remove legacy SVG lines and old fill rect
    el.querySelectorAll('line, rect.table-fill-layer, rect.svg-image-stroke-overlay').forEach(n => n.remove());

    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.setAttribute('x', '0');
    fo.setAttribute('y', '0');
    fo.setAttribute('width', w.toString());
    fo.setAttribute('height', h.toString());
    fo.style.overflow = 'visible';

    let rowsHtml = '';
    const rowHeightPct = (100 / Math.max(1, rows)).toFixed(3);
    const colWidthPct = (100 / Math.max(1, cols)).toFixed(3);
    for (let r = 0; r < rows; r++) {
      rowsHtml += `<tr style="height: ${rowHeightPct}%; box-sizing: border-box;">`;
      for (let c = 0; c < cols; c++) {
        rowsHtml += `<td contenteditable="true" data-row="${r}" data-col="${c}" style="width: ${colWidthPct}%; height: 100%; border: ${Math.max(1, Math.round(bWidth / 2))}px solid ${bColor}; padding: 6px 8px; color: #000000; text-align: left; vertical-align: middle; box-sizing: border-box; word-break: break-word; outline: none; background-color: #ffffff;"></td>`;
      }
      rowsHtml += '</tr>';
    }

    fo.innerHTML = `<div class="table-card-wrapper table-container" xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;box-sizing:border-box;border-radius:${bRadius}px;overflow:hidden;display:block;margin:0;padding:0;white-space:normal;line-height:normal;pointer-events:auto;"><table style="width:100%;height:100%;border-collapse:collapse;border:${bWidth}px solid ${bColor};background-color:${tColor};font-family:'Poppins',sans-serif;font-size:13px;table-layout:fixed;margin:0;padding:0;white-space:normal;box-sizing:border-box;"><tbody>${rowsHtml}</tbody></table></div>`;

    el.appendChild(fo);

    const overlayRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    overlayRect.setAttribute('class', 'svg-table-overlay svg-image-stroke-overlay');
    overlayRect.setAttribute('width', w.toString());
    overlayRect.setAttribute('height', h.toString());
    overlayRect.setAttribute('fill', 'transparent');
    overlayRect.setAttribute('pointer-events', 'none');
    el.appendChild(overlayRect);

    el.setAttribute('data-type', 'table-frame');
    el.setAttribute('data-rows', rows.toString());
    el.setAttribute('data-cols', cols.toString());
    el.setAttribute('data-theme-color', tColor);
    el.setAttribute('data-border-color', bColor);
    el.setAttribute('data-border-width', bWidth.toString());
    el.setAttribute('data-border-radius', bRadius.toString());

    attachCellListeners(el);
    syncChanges(el);
  };

  // Sync state from element attributes when selection changes
  useEffect(() => {
    const el = getTargetElement();
    if (!el) return;
    elementRef.current = el;

    // Normalize any previous scale transform
    normalizeTableTransform(el);
    // Upgrade legacy table if necessary
    ensureTableStructure(el);
    // Ensure table fits inside the page
    checkAndFitTable(el);
    attachCellListeners(el);

    const bStyle = el.getAttribute('data-border-style') || 'solid';
    const tColor = el.getAttribute('data-theme-color') || el.getAttribute('data-fill-color') || '#ffffff';
    const tOpacity = parseInt(el.getAttribute('data-theme-opacity') || el.getAttribute('data-fill-opacity') || '100', 10);
    const bColor = el.getAttribute('data-border-color') || '#d1d5db';
    const bOpacity = parseInt(el.getAttribute('data-border-opacity') || '100', 10);
    const bWidth = parseInt(el.getAttribute('data-border-width') || '2', 10);
    const bRadius = parseInt(el.getAttribute('data-border-radius') || '4', 10);

    setBorderStyle(bStyle);
    setThemeColor(tColor);
    setThemeOpacity(tOpacity);
    setBorderColor(bColor);
    setBorderOpacity(bOpacity);
    setBorderWidth(bWidth);
    setBorderRadius(bRadius);

    const rows = el.querySelectorAll('tr').length || parseInt(el.getAttribute('data-rows') || '3', 10);
    const firstRowCols = el.querySelector('tr')?.querySelectorAll('td, th')?.length;
    const cols = firstRowCols || parseInt(el.getAttribute('data-cols') || '3', 10);
    setRowsCount(rows);
    setColsCount(cols);

    const cColor = el.getAttribute('data-cell-color') || '#000000';
    const cOpacity = parseInt(el.getAttribute('data-cell-opacity') || '100', 10);
    const fFam = el.getAttribute('data-font-family') || 'Poppins';
    const fSize = parseInt(el.getAttribute('data-font-size') || '14', 10);
    const fWeight = el.getAttribute('data-font-weight') || 'Regular';
    const tAlign = el.getAttribute('data-text-align') || 'left';
    const vAlign = el.getAttribute('data-vertical-align') || 'middle';
    const pX = parseInt(el.getAttribute('data-padding-x') || '8', 10);
    const pY = parseInt(el.getAttribute('data-padding-y') || '6', 10);
    const shadow = el.getAttribute('data-drop-shadow') === 'true';
    const wrap = el.getAttribute('data-text-wrapping') !== 'false';
    const bold = el.getAttribute('data-bold') === 'true' || fWeight.toLowerCase().includes('bold');
    const strike = el.getAttribute('data-strikethrough') === 'true';
    const list = el.getAttribute('data-list') === 'true';
    const aWidth = el.getAttribute('data-auto-width') !== 'false';
    const aHeight = el.getAttribute('data-auto-height') !== 'false';
    const scrollAttr = el.getAttribute('data-scrollable');
    setIsScrollable(scrollAttr !== 'false');

    setCellColor(cColor);
    setCellOpacity(cOpacity);
    setFontFamily(fFam);
    setFontSize(fSize);
    setFontWeight(fWeight);
    setTextAlign(tAlign);
    setVerticalAlign(vAlign);
    setPaddingX(pX);
    setPaddingY(pY);
    setHasDropShadow(shadow);
    setTextWrapping(wrap);
    setIsBold(bold);
    setIsStrikethrough(strike);
    setIsList(list);
    setAutoWidth(aWidth);
    setAutoHeight(aHeight);

    // Event listener for user typing into table cells to auto-persist
    const handleCellInput = (e) => {
      if (e.target && e.target.getAttribute('contenteditable') === 'true') {
        const r = e.target.getAttribute('data-row');
        const c = e.target.getAttribute('data-col');
        if (selectedCellKeys.has(`${r}_${c}`)) {
          setSelectedCellText(e.target.textContent || '');
        }
        syncChanges(el);
      }
    };
    el.addEventListener('input', handleCellInput);
    el.addEventListener('blur', handleCellInput, true);

    const handleWindowMouseUp = () => {
      isMouseDownRef.current = false;
    };
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      el.removeEventListener('input', handleCellInput);
      el.removeEventListener('blur', handleCellInput, true);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      // Clean up temporary selection outlines on unmount
      clearCellSelection(el);
    };
  }, [selectedLayerId]);

  // Global Keyboard Shortcuts (Copy & Paste for table cells, and Escape to clear selection)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const el = getTargetElement();
      if (!el) return;

      if (e.key === 'Escape') {
        clearCellSelection(el);
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'c' || e.key === 'C') {
        handleCopyCells();
      } else if (e.key === 'v' || e.key === 'V') {
        handlePasteCells();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, selectedCellKeys]);

  // Apply styling to table DOM nodes (supports target selection or whole table)
  const applyTableStyles = (overrides = {}) => {
    const el = getTargetElement();
    if (!el) return;

    const selectedCells = getSelectedCells(el);
    const isTargetingSelected = selectedCells.length > 0;

    const bStyle = overrides.borderStyle !== undefined ? overrides.borderStyle : borderStyle;
    const tColor = overrides.themeColor !== undefined ? overrides.themeColor : themeColor;
    const tOpacity = overrides.themeOpacity !== undefined ? overrides.themeOpacity : themeOpacity;
    const bColor = overrides.borderColor !== undefined ? overrides.borderColor : borderColor;
    const bOpacity = overrides.borderOpacity !== undefined ? overrides.borderOpacity : borderOpacity;
    const bWidth = overrides.borderWidth !== undefined ? overrides.borderWidth : borderWidth;
    const bRadius = overrides.borderRadius !== undefined ? overrides.borderRadius : borderRadius;
    const cColor = overrides.cellColor !== undefined ? overrides.cellColor : cellColor;
    const cOpacity = overrides.cellOpacity !== undefined ? overrides.cellOpacity : cellOpacity;
    const fFam = overrides.fontFamily !== undefined ? overrides.fontFamily : fontFamily;
    const fSize = overrides.fontSize !== undefined ? overrides.fontSize : fontSize;
    const fWeight = overrides.fontWeight !== undefined ? overrides.fontWeight : fontWeight;
    const tAlign = overrides.textAlign !== undefined ? overrides.textAlign : textAlign;
    const vAlign = overrides.verticalAlign !== undefined ? overrides.verticalAlign : verticalAlign;
    const padX = overrides.paddingX !== undefined ? overrides.paddingX : paddingX;
    const padY = overrides.paddingY !== undefined ? overrides.paddingY : paddingY;
    const shadow = overrides.hasDropShadow !== undefined ? overrides.hasDropShadow : hasDropShadow;
    const wrap = overrides.textWrapping !== undefined ? overrides.textWrapping : textWrapping;
    const boldVal = overrides.isBold !== undefined ? overrides.isBold : isBold;
    const strikeVal = overrides.isStrikethrough !== undefined ? overrides.isStrikethrough : isStrikethrough;
    const listVal = overrides.isList !== undefined ? overrides.isList : isList;
    const aWidth = overrides.autoWidth !== undefined ? overrides.autoWidth : autoWidth;

    const bColorRgba = hexToRgba(bColor, bOpacity);
    const tColorRgba = hexToRgba(tColor, tOpacity);
    const cColorRgba = hexToRgba(cColor, cOpacity);
    const cellBorderWidth = bStyle === 'none' || bWidth === 0 ? 0 : Math.max(1, Math.round(bWidth / 2));

    const table = el.querySelector('table');

    if (isTargetingSelected) {
      // ── INDIVIDUAL CELL TARGETING (Applies ONLY to selected cells) ──
      selectedCells.forEach((cell) => {
        if (overrides.textAlign !== undefined) cell.style.textAlign = tAlign;
        if (overrides.verticalAlign !== undefined) cell.style.verticalAlign = vAlign;
        if (overrides.cellColor !== undefined || overrides.cellOpacity !== undefined) cell.style.color = cColorRgba;
        if (overrides.fontFamily !== undefined) cell.style.fontFamily = `'${fFam}', sans-serif`;
        if (overrides.fontSize !== undefined) cell.style.fontSize = `${fSize}px`;
        if (overrides.fontWeight !== undefined || overrides.isBold !== undefined) {
          cell.style.fontWeight = boldVal ? '700' : (fWeight === 'Semi Bold' ? '600' : (fWeight === 'Bold' ? '700' : '400'));
        }
        if (overrides.isStrikethrough !== undefined) cell.style.textDecoration = strikeVal ? 'line-through' : 'none';
        if (overrides.textWrapping !== undefined) cell.style.whiteSpace = wrap ? 'normal' : 'nowrap';
        if (overrides.paddingX !== undefined) {
          cell.style.paddingLeft = `${padX}px`;
          cell.style.paddingRight = `${padX}px`;
        }
        if (overrides.paddingY !== undefined) {
          cell.style.paddingTop = `${padY}px`;
          cell.style.paddingBottom = `${padY}px`;
        }
        if (overrides.themeColor !== undefined || overrides.themeOpacity !== undefined) {
          cell.style.backgroundColor = tColorRgba;
        }
        if (overrides.borderStyle !== undefined || overrides.borderColor !== undefined || overrides.borderWidth !== undefined || overrides.borderOpacity !== undefined) {
          cell.style.border = cellBorderWidth === 0 ? 'none' : `${cellBorderWidth}px ${bStyle} ${bColorRgba}`;
        }
      });
    } else {
      // ── WHOLE TABLE TARGETING (No cells selected) ──
      // Update attributes on root group
      el.setAttribute('data-border-style', bStyle);
      el.setAttribute('data-theme-color', tColor);
      el.setAttribute('data-theme-opacity', tOpacity.toString());
      el.setAttribute('data-border-color', bColor);
      el.setAttribute('data-border-opacity', bOpacity.toString());
      el.setAttribute('data-border-width', bWidth.toString());
      el.setAttribute('data-border-radius', bRadius.toString());
      el.setAttribute('data-cell-color', cColor);
      el.setAttribute('data-cell-opacity', cOpacity.toString());
      el.setAttribute('data-font-family', fFam);
      el.setAttribute('data-font-size', fSize.toString());
      el.setAttribute('data-font-weight', fWeight);
      el.setAttribute('data-text-align', tAlign);
      el.setAttribute('data-vertical-align', vAlign);
      el.setAttribute('data-padding-x', padX.toString());
      el.setAttribute('data-padding-y', padY.toString());
      el.setAttribute('data-drop-shadow', shadow ? 'true' : 'false');
      el.setAttribute('data-text-wrapping', wrap ? 'true' : 'false');
      el.setAttribute('data-bold', boldVal ? 'true' : 'false');
      el.setAttribute('data-strikethrough', strikeVal ? 'true' : 'false');
      el.setAttribute('data-list', listVal ? 'true' : 'false');
      el.setAttribute('data-auto-width', aWidth ? 'true' : 'false');

      const scrollVal = overrides.isScrollable !== undefined ? overrides.isScrollable : isScrollable;
      el.setAttribute('data-scrollable', scrollVal ? 'true' : 'false');
      const fo = el.querySelector('foreignObject');
      if (fo) {
        fo.setAttribute('data-scrollable', scrollVal ? 'true' : 'false');
      }

      // Outer wrapper
      const wrapper = el.querySelector('.table-card-wrapper, [class*="table-container"]');
      if (wrapper) {
        wrapper.setAttribute('data-scrollable', scrollVal ? 'true' : 'false');
        wrapper.classList.toggle('table-scrollable', scrollVal);
        wrapper.style.borderRadius = `${bRadius}px`;
        wrapper.style.filter = shadow ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : 'none';
        wrapper.style.display = 'block';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.boxSizing = 'border-box';
        wrapper.style.margin = '0';
        wrapper.style.padding = '0';
        wrapper.style.whiteSpace = 'normal';
        wrapper.style.lineHeight = 'normal';
        wrapper.style.overflow = scrollVal ? 'auto' : 'hidden';
        wrapper.style.overflowX = scrollVal ? 'auto' : 'hidden';
        wrapper.style.overflowY = scrollVal ? 'auto' : 'hidden';
        wrapper.style.pointerEvents = 'auto';
      }

      // Table node
      if (table) {
        table.style.border = bStyle === 'none' || bWidth === 0 ? 'none' : `${bWidth}px ${bStyle} ${bColorRgba}`;
        table.style.borderRadius = `${bRadius}px`;
        table.style.backgroundColor = tColorRgba;
        table.style.fontFamily = `'${fFam}', sans-serif`;
        table.style.fontSize = `${fSize}px`;
        table.style.fontWeight = boldVal ? '700' : (fWeight === 'Semi Bold' ? '600' : (fWeight === 'Bold' ? '700' : '400'));
        table.style.color = cColorRgba;
        table.style.margin = '0';
        table.style.padding = '0';
        table.style.transform = 'none';
        table.style.whiteSpace = 'normal';
        table.style.width = '100%';
        table.style.height = '100%';
        table.style.tableLayout = 'fixed';
        table.style.borderCollapse = 'collapse';
        table.style.boxSizing = 'border-box';
        const trs = table.querySelectorAll('tr');
        const rLen = trs.length || 1;
        trs.forEach(tr => {
          tr.style.height = `${(100 / rLen).toFixed(3)}%`;
          tr.style.boxSizing = 'border-box';
        });
      }

      // Target all cells
      const hasOverrides = Object.keys(overrides).length > 0;
      const allCells = el.querySelectorAll('td, th');
      allCells.forEach((cell) => {
        if (!hasOverrides || overrides.borderStyle !== undefined || overrides.borderColor !== undefined || overrides.borderWidth !== undefined || overrides.borderOpacity !== undefined) {
          cell.style.border = cellBorderWidth === 0 ? 'none' : `${cellBorderWidth}px ${bStyle} ${bColorRgba}`;
        }
        if (!hasOverrides || overrides.paddingX !== undefined) {
          cell.style.paddingLeft = `${padX}px`;
          cell.style.paddingRight = `${padX}px`;
        }
        if (!hasOverrides || overrides.paddingY !== undefined) {
          cell.style.paddingTop = `${padY}px`;
          cell.style.paddingBottom = `${padY}px`;
        }
        if (!hasOverrides || overrides.textAlign !== undefined) cell.style.textAlign = tAlign;
        if (!hasOverrides || overrides.verticalAlign !== undefined) cell.style.verticalAlign = vAlign;
        if (!hasOverrides || overrides.cellColor !== undefined || overrides.cellOpacity !== undefined) cell.style.color = cColorRgba;
        if (!hasOverrides || overrides.textWrapping !== undefined) cell.style.whiteSpace = wrap ? 'normal' : 'nowrap';
        if (!hasOverrides || overrides.isStrikethrough !== undefined) cell.style.textDecoration = strikeVal ? 'line-through' : 'none';
        if (!hasOverrides || overrides.fontWeight !== undefined || overrides.isBold !== undefined) {
          cell.style.fontWeight = boldVal ? '700' : (fWeight === 'Semi Bold' ? '600' : (fWeight === 'Bold' ? '700' : '400'));
        }
        if (!hasOverrides || overrides.fontSize !== undefined) cell.style.fontSize = `${fSize}px`;
        if (!hasOverrides || overrides.fontFamily !== undefined) cell.style.fontFamily = `'${fFam}', sans-serif`;
        if (!hasOverrides || overrides.themeColor !== undefined || overrides.themeOpacity !== undefined) cell.style.backgroundColor = tColorRgba;
      });

      // Overlay rect
      const overlay = el.querySelector('.svg-table-overlay, .svg-image-stroke-overlay');
      if (overlay) {
        overlay.setAttribute('rx', bRadius.toString());
      }
    }

    syncChanges(el);
    if (typeof window.drawOverlayHighlight === 'function') {
      window.drawOverlayHighlight(el, 'selected');
    }
  };

  // Apply cell background to selected cells (or all cells)
  const applyCellBackground = (color, opacity = 100) => {
    const el = getTargetElement();
    if (!el) return;
    const colorRgba = hexToRgba(color, opacity);
    const table = el.querySelector('table');
    if (!table) return;

    const selectedCells = getSelectedCells(el);
    const isTargetingSelected = selectedCells.length > 0;

    if (isTargetingSelected) {
      selectedCells.forEach(cell => {
        cell.style.backgroundColor = colorRgba;
      });
    } else {
      table.style.backgroundColor = colorRgba;
      const allCells = table.querySelectorAll('td, th');
      allCells.forEach(cell => {
        cell.style.backgroundColor = colorRgba;
      });
      el.setAttribute('data-theme-color', color);
      el.setAttribute('data-theme-opacity', opacity.toString());
      setThemeColor(color);
      setThemeOpacity(opacity);
    }
    syncChanges(el);
  };

  // Border Presets (All, Outer, None, Bottom, Top, Left, Right, Clear)
  const applyBorderPreset = (presetType) => {
    const el = getTargetElement();
    if (!el) return;
    const table = el.querySelector('table');
    if (!table) return;

    const bStyle = borderStyle === 'none' ? 'solid' : borderStyle;
    const bColor = hexToRgba(borderColor, borderOpacity);
    const widthCss = `${borderWidth}px ${bStyle} ${bColor}`;

    const trs = table.querySelectorAll('tr');
    const totalRows = trs.length;
    const totalCols = trs[0]?.children.length || 0;

    let targetCells = [];
    if (selectedCellKeys.size > 0) {
      let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
      selectedCellKeys.forEach(key => {
        const [r, c] = key.split('_').map(Number);
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      });

      selectedCellKeys.forEach(key => {
        const [r, c] = key.split('_').map(Number);
        const td = trs[r]?.children[c];
        if (td) targetCells.push({ td, r, c, minR, maxR, minC, maxC });
      });
    } else {
      for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < totalCols; c++) {
          const td = trs[r]?.children[c];
          if (td) targetCells.push({ td, r, c, minR: 0, maxR: totalRows - 1, minC: 0, maxC: totalCols - 1 });
        }
      }
    }

    targetCells.forEach(({ td, r, c, minR, maxR, minC, maxC }) => {
      if (presetType === 'all') {
        td.style.border = widthCss;
      } else if (presetType === 'none' || presetType === 'clear') {
        td.style.border = 'none';
      } else if (presetType === 'outer') {
        if (r === minR) td.style.borderTop = widthCss;
        if (r === maxR) td.style.borderBottom = widthCss;
        if (c === minC) td.style.borderLeft = widthCss;
        if (c === maxC) td.style.borderRight = widthCss;
      } else if (presetType === 'bottom') {
        td.style.borderBottom = widthCss;
      } else if (presetType === 'top') {
        td.style.borderTop = widthCss;
      } else if (presetType === 'left') {
        td.style.borderLeft = widthCss;
      } else if (presetType === 'right') {
        td.style.borderRight = widthCss;
      }
    });

    syncChanges(el);
  };

  // --- Excel Import & Export ---
  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);
      const sheet = wb.worksheets[0];
      if (!sheet) return;

      const el = getTargetElement();
      if (!el) return;
      ensureTableStructure(el);

      const table = el.querySelector('table');
      const tbody = table?.querySelector('tbody') || table;
      if (!tbody) return;

      let minR = Infinity, maxR = 1, minC = Infinity, maxC = 1;
      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          if (cell.value !== null && cell.value !== undefined && String(cell.value).trim() !== '') {
            if (colNumber < minC) minC = colNumber;
            if (colNumber > maxC) maxC = colNumber;
            if (rowNumber < minR) minR = rowNumber;
            if (rowNumber > maxR) maxR = rowNumber;
          }
        });
      });

      if (minR === Infinity) { minR = 1; maxR = Math.min(sheet.rowCount || 5, 20); }
      if (minC === Infinity) { minC = 1; maxC = Math.min(sheet.columnCount || 5, 10); }

      // Cap at reasonable limits to prevent foreignObject overflow
      maxR = Math.min(maxR, minR + 49); // max 50 rows
      maxC = Math.min(maxC, minC + 14); // max 15 cols

      tbody.innerHTML = '';
      const bColorRgba = hexToRgba(borderColor, borderOpacity);
      const cellBorderWidth = borderStyle === 'none' || borderWidth === 0 ? 0 : Math.max(1, Math.round(borderWidth / 2));
      const borderCss = cellBorderWidth === 0 ? 'none' : `${cellBorderWidth}px ${borderStyle} ${bColorRgba}`;

      for (let r = minR; r <= maxR; r++) {
        const row = sheet.getRow(r);
        const tr = document.createElement('tr');

        for (let c = minC; c <= maxC; c++) {
          const cell = row.getCell(c);
          const td = document.createElement('td');
          td.setAttribute('contenteditable', 'true');
          td.setAttribute('data-row', (r - minR).toString());
          td.setAttribute('data-col', (c - minC).toString());
          td.style.border = borderCss;
          td.style.padding = `${paddingY}px ${paddingX}px`;
          td.style.boxSizing = 'border-box';
          td.style.wordBreak = 'break-word';
          td.style.outline = 'none';

          // Extract value
          let val = cell.value;
          if (val instanceof Date) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            td.textContent = `${val.getDate()}-${months[val.getMonth()]}-${String(val.getFullYear()).slice(-2)}`;
          } else if (val && typeof val === 'object') {
            td.textContent = (val.result instanceof Date ? val.result.toDateString() : (val.result || val.text || ''));
          } else {
            td.textContent = (val !== null && val !== undefined) ? String(val) : '';
          }

          // Extract alignment
          if (cell.alignment?.horizontal) td.style.textAlign = cell.alignment.horizontal;
          else td.style.textAlign = textAlign;

          if (cell.alignment?.vertical) td.style.verticalAlign = cell.alignment.vertical === 'center' ? 'middle' : cell.alignment.vertical;
          else td.style.verticalAlign = verticalAlign;

          // Extract font
          if (cell.font) {
            if (cell.font.bold) td.style.fontWeight = '700';
            if (cell.font.italic) td.style.fontStyle = 'italic';
            if (cell.font.size) td.style.fontSize = `${cell.font.size}px`;
          }

          // Extract fill
          if (cell.fill && cell.fill.fgColor) {
            const fg = cell.fill.fgColor;
            let hex = fg.argb || fg.rgb;
            if (hex && hex.length === 8 && (hex.startsWith('FF') || hex.startsWith('ff'))) {
              td.style.backgroundColor = '#' + hex.substring(2);
            } else if (hex) {
              td.style.backgroundColor = '#' + hex;
            }
          }

          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }

      const totalNewRows = maxR - minR + 1;
      const totalNewCols = maxC - minC + 1;
      setRowsCount(totalNewRows);
      setColsCount(totalNewCols);
      el.setAttribute('data-rows', totalNewRows.toString());
      el.setAttribute('data-cols', totalNewCols.toString());

      setIsScrollable(true);
      applyTableStyles({ isScrollable: true });
      fitTableToPage(el);
      attachCellListeners(el);
      syncChanges(el);
    } catch (err) {
      console.error('Failed to import Excel:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleExcelExport = async () => {
    const el = getTargetElement();
    if (!el) return;
    const table = el.querySelector('table');
    if (!table) return;

    try {
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('Sheet1');
      const trs = table.querySelectorAll('tr');

      trs.forEach((tr, rIdx) => {
        const row = sheet.getRow(rIdx + 1);
        const tds = tr.querySelectorAll('td, th');
        tds.forEach((td, cIdx) => {
          const cell = row.getCell(cIdx + 1);
          cell.value = td.textContent || '';

          const isB = td.style.fontWeight === 'bold' || parseInt(td.style.fontWeight) >= 600;
          const isI = td.style.fontStyle === 'italic';
          const fSize = parseInt(td.style.fontSize) || 12;
          cell.font = { bold: isB, italic: isI, size: fSize };

          const tAlign = td.style.textAlign || 'left';
          const vAlign = td.style.verticalAlign || 'middle';
          cell.alignment = {
            horizontal: tAlign,
            vertical: vAlign === 'middle' ? 'center' : vAlign
          };

          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
          };
        });
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `table_export_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Excel:', err);
    }
  };

  // --- Copy & Paste Support ---
  const handleCopyCells = async () => {
    const el = getTargetElement();
    if (!el) return;
    const table = el.querySelector('table');
    if (!table) return;

    const trs = table.querySelectorAll('tr');
    let tsvRows = [];

    if (selectedCellKeys.size > 0) {
      let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
      selectedCellKeys.forEach(k => {
        const [r, c] = k.split('_').map(Number);
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      });

      for (let r = minR; r <= maxR; r++) {
        let rowCols = [];
        for (let c = minC; c <= maxC; c++) {
          const td = trs[r]?.children[c];
          rowCols.push(td ? td.textContent.replace(/[\t\r\n]/g, ' ') : '');
        }
        tsvRows.push(rowCols.join('\t'));
      }
    } else {
      trs.forEach(tr => {
        let rowCols = [];
        tr.querySelectorAll('td, th').forEach(td => {
          rowCols.push(td.textContent.replace(/[\t\r\n]/g, ' '));
        });
        tsvRows.push(rowCols.join('\t'));
      });
    }

    if (tsvRows.length > 0) {
      const text = tsvRows.join('\n');
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        console.warn('Clipboard write failed:', e);
      }
    }
  };

  const handlePasteCells = async (pastedText) => {
    let text = pastedText;
    if (!text) {
      try {
        text = await navigator.clipboard.readText();
      } catch {
        text = '';
      }
    }
    if (!text || !text.trim()) return;

    const el = getTargetElement();
    if (!el) return;
    const table = el.querySelector('table');
    if (!table) return;

    const rowsData = text.trim().split(/\r?\n/).map(row => row.split('\t'));
    if (!rowsData.length) return;

    let startR = 0, startC = 0;
    if (selectedCellKeys.size > 0) {
      const firstKey = Array.from(selectedCellKeys)[0];
      const [r, c] = firstKey.split('_').map(Number);
      startR = r;
      startC = c;
    }

    const tbody = table.querySelector('tbody') || table;
    const requiredRows = startR + rowsData.length;
    const requiredCols = startC + Math.max(...rowsData.map(r => r.length));

    // Ensure enough rows
    let currentTrs = Array.from(tbody.querySelectorAll('tr'));
    while (currentTrs.length < requiredRows) {
      handleInsertRow('below');
      currentTrs = Array.from(tbody.querySelectorAll('tr'));
    }

    // Ensure enough columns
    let currentColCount = currentTrs[0]?.children.length || 0;
    while (currentColCount < requiredCols) {
      handleInsertColumn('right');
      currentColCount = currentTrs[0]?.children.length || 0;
    }

    // Populate data
    currentTrs = Array.from(tbody.querySelectorAll('tr'));
    rowsData.forEach((rowVals, rOffset) => {
      const targetR = startR + rOffset;
      const tr = currentTrs[targetR];
      if (!tr) return;
      rowVals.forEach((val, cOffset) => {
        const targetC = startC + cOffset;
        const td = tr.children[targetC];
        if (td) {
          td.textContent = val;
        }
      });
    });

    attachCellListeners(el);
    checkAndFitTable(el);
    syncChanges(el);
  };

  // --- Structure Operations (Excel-like Selection-Aware) ---
  const handleInsertColumn = (direction = 'right') => {
    const el = getTargetElement();
    if (!el) return;
    ensureTableStructure(el);

    const trs = el.querySelectorAll('tr');
    if (!trs.length) return;
    const currentCols = trs[0].children.length;

    // Excel: insert column relative to active selection if any
    let targetC = null;
    if (selectedCellKeys.size > 0) {
      const colIndices = Array.from(selectedCellKeys).map(k => parseInt(k.split('_')[1], 10));
      targetC = direction === 'left' ? Math.min(...colIndices) : Math.max(...colIndices);
    }

    let insertColIdx;
    if (targetC !== null && targetC >= 0 && targetC < currentCols) {
      insertColIdx = direction === 'left' ? targetC : targetC + 1;
    } else {
      insertColIdx = direction === 'left' ? 0 : currentCols;
    }

    const bColorRgba = hexToRgba(borderColor, borderOpacity);
    const cColorRgba = hexToRgba(cellColor, cellOpacity);
    const bW = Math.max(1, Math.round(borderWidth / 2));

    trs.forEach((tr) => {
      const newTd = document.createElement('td');
      newTd.setAttribute('contenteditable', 'true');
      newTd.style.border = `${bW}px ${borderStyle} ${bColorRgba}`;
      newTd.style.padding = `${paddingY}px ${paddingX}px`;
      newTd.style.color = cColorRgba;
      newTd.style.textAlign = textAlign;
      newTd.style.verticalAlign = verticalAlign;
      newTd.style.boxSizing = 'border-box';
      newTd.style.wordBreak = 'break-word';
      newTd.style.outline = 'none';
      newTd.style.backgroundColor = '#ffffff';

      const refChild = tr.children[insertColIdx];
      if (refChild) {
        tr.insertBefore(newTd, refChild);
      } else {
        tr.appendChild(newTd);
      }
    });

    const newColCount = currentCols + 1;
    setColsCount(newColCount);
    el.setAttribute('data-cols', newColCount.toString());

    // Update widths proportionally across all cells
    const colWidthPct = (100 / newColCount).toFixed(3);
    trs.forEach(tr => {
      Array.from(tr.children).forEach(td => {
        td.style.width = `${colWidthPct}%`;
      });
    });

    // Expand width safely but cap at page limit
    const fo = el.querySelector('foreignObject');
    const overlay = el.querySelector('.svg-table-overlay, .svg-image-stroke-overlay');
    if (fo) {
      const curW = parseFloat(fo.getAttribute('width') || '170');
      const svgRoot = el.closest('svg') || document.querySelector('.page-svg-container svg');
      let pw = 210;
      if (svgRoot) {
        const vb = svgRoot.getAttribute('viewBox');
        if (vb) {
          const parts = vb.trim().split(/[\s,]+/).map(parseFloat);
          if (parts.length === 4 && parts[2] > 0) pw = parts[2];
        }
      }
      const marginX = pw <= 400 ? (pw > 150 ? 20 : 10) : Math.round(pw * 0.08);
      const maxW = pw - marginX * 2;
      const addW = Math.max(15, Math.round(curW / Math.max(1, currentCols)));
      const newW = Math.min(curW + addW, maxW);
      fo.setAttribute('width', newW.toString());
      if (overlay) overlay.setAttribute('width', newW.toString());

      let posX = 0;
      const tr = el.getAttribute('transform') || '';
      const m = tr.match(/translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/);
      if (m) {
        posX = parseFloat(m[1]);
        if (posX + newW > pw) {
          posX = Math.max(marginX, pw - newW - marginX);
          el.setAttribute('transform', `translate(${posX}, ${m[2]})`);
        }
      }
    }

    attachCellListeners(el);
    const activeR = selectedCellKeys.size > 0 ? parseInt(Array.from(selectedCellKeys)[0].split('_')[0], 10) : 0;
    selectCellRange(el, activeR, insertColIdx, activeR, insertColIdx, false);
    applyTableStyles();
    syncChanges(el);
  };

  const handleDeleteColumn = () => {
    const el = getTargetElement();
    if (!el) return;
    ensureTableStructure(el);
    const trs = el.querySelectorAll('tr');
    if (!trs.length) return;
    const firstRowCols = trs[0].children.length;
    if (firstRowCols <= 1) return; // Must keep at least 1 column

    // Excel: delete selected columns, or delete last column if none selected
    let colsToDelete = [];
    if (selectedCellKeys.size > 0) {
      colsToDelete = Array.from(new Set(Array.from(selectedCellKeys).map(k => parseInt(k.split('_')[1], 10))))
        .filter(c => c >= 0 && c < firstRowCols)
        .sort((a, b) => b - a);
    }

    if (colsToDelete.length === 0 || colsToDelete.length >= firstRowCols) {
      colsToDelete = [firstRowCols - 1];
    }

    trs.forEach(tr => {
      colsToDelete.forEach(colIdx => {
        if (tr.children[colIdx]) {
          tr.children[colIdx].remove();
        }
      });
    });

    const newColCount = trs[0].children.length;
    setColsCount(newColCount);
    el.setAttribute('data-cols', newColCount.toString());

    // Proportionally redistribute widths
    const colWidthPct = (100 / Math.max(1, newColCount)).toFixed(3);
    trs.forEach(tr => {
      Array.from(tr.children).forEach(td => {
        td.style.width = `${colWidthPct}%`;
      });
    });

    attachCellListeners(el);
    clearCellSelection(el);
    applyTableStyles();
    syncChanges(el);
  };

  const handleInsertRow = (direction = 'below') => {
    const el = getTargetElement();
    if (!el) return;
    ensureTableStructure(el);

    const tbody = el.querySelector('tbody') || el.querySelector('table');
    if (!tbody) return;

    const trs = tbody.querySelectorAll('tr');
    const currentRows = trs.length;
    const currentCols = trs[0]?.children.length || colsCount || 3;

    // Excel: insert row relative to active selection if any
    let targetR = null;
    if (selectedCellKeys.size > 0) {
      const rowIndices = Array.from(selectedCellKeys).map(k => parseInt(k.split('_')[0], 10));
      targetR = direction === 'above' ? Math.min(...rowIndices) : Math.max(...rowIndices);
    }

    let insertRowIdx;
    if (targetR !== null && targetR >= 0 && targetR < currentRows) {
      insertRowIdx = direction === 'above' ? targetR : targetR + 1;
    } else {
      insertRowIdx = direction === 'above' ? 0 : currentRows;
    }

    const bColorRgba = hexToRgba(borderColor, borderOpacity);
    const cColorRgba = hexToRgba(cellColor, cellOpacity);
    const bW = Math.max(1, Math.round(borderWidth / 2));

    const newTr = document.createElement('tr');
    newTr.style.boxSizing = 'border-box';

    const colWidthPct = (100 / Math.max(1, currentCols)).toFixed(3);
    for (let c = 0; c < currentCols; c++) {
      const newTd = document.createElement('td');
      newTd.setAttribute('contenteditable', 'true');
      newTd.style.width = `${colWidthPct}%`;
      newTd.style.height = '100%';
      newTd.style.border = `${bW}px ${borderStyle} ${bColorRgba}`;
      newTd.style.padding = `${paddingY}px ${paddingX}px`;
      newTd.style.color = cColorRgba;
      newTd.style.textAlign = textAlign;
      newTd.style.verticalAlign = verticalAlign;
      newTd.style.boxSizing = 'border-box';
      newTd.style.wordBreak = 'break-word';
      newTd.style.outline = 'none';
      newTd.style.backgroundColor = '#ffffff';
      newTr.appendChild(newTd);
    }

    const refTr = tbody.children[insertRowIdx];
    if (refTr) {
      tbody.insertBefore(newTr, refTr);
    } else {
      tbody.appendChild(newTr);
    }

    const newRowCount = currentRows + 1;
    setRowsCount(newRowCount);
    el.setAttribute('data-rows', newRowCount.toString());

    // Update row heights proportionally
    const rowHeightPct = (100 / newRowCount).toFixed(3);
    tbody.querySelectorAll('tr').forEach(tr => {
      tr.style.height = `${rowHeightPct}%`;
      tr.style.boxSizing = 'border-box';
    });

    // Expand height proportionally but cap at page limit
    const fo = el.querySelector('foreignObject');
    const overlay = el.querySelector('.svg-table-overlay, .svg-image-stroke-overlay');
    if (fo) {
      const curH = parseFloat(fo.getAttribute('height') || '60');
      const addH = Math.max(15, Math.round(curH / Math.max(1, currentRows)));
      const svgRoot = el.closest('svg') || document.querySelector('.page-svg-container svg');
      let ph = 297;
      if (svgRoot) {
        const vb = svgRoot.getAttribute('viewBox');
        if (vb) {
          const parts = vb.trim().split(/[\s,]+/).map(parseFloat);
          if (parts.length === 4 && parts[3] > 0) ph = parts[3];
        }
      }
      const maxH = Math.round(ph * 0.7);
      const newH = Math.min(curH + addH, maxH);
      fo.setAttribute('height', newH.toString());
      if (overlay) overlay.setAttribute('height', newH.toString());
    }

    attachCellListeners(el);
    const activeC = selectedCellKeys.size > 0 ? parseInt(Array.from(selectedCellKeys)[0].split('_')[1], 10) : 0;
    selectCellRange(el, insertRowIdx, activeC, insertRowIdx, activeC, false);
    applyTableStyles();
    syncChanges(el);
  };

  const handleDeleteRow = () => {
    const el = getTargetElement();
    if (!el) return;
    ensureTableStructure(el);
    const tbody = el.querySelector('tbody') || el.querySelector('table');
    if (!tbody) return;
    const trs = tbody.querySelectorAll('tr');
    if (trs.length <= 1) return; // Keep at least 1 row

    // Excel: delete selected rows, or delete last row if none selected
    let rowsToDelete = [];
    if (selectedCellKeys.size > 0) {
      rowsToDelete = Array.from(new Set(Array.from(selectedCellKeys).map(k => parseInt(k.split('_')[0], 10))))
        .filter(r => r >= 0 && r < trs.length)
        .sort((a, b) => b - a);
    }

    if (rowsToDelete.length === 0 || rowsToDelete.length >= trs.length) {
      rowsToDelete = [trs.length - 1];
    }

    rowsToDelete.forEach(rIdx => {
      if (trs[rIdx]) {
        trs[rIdx].remove();
      }
    });

    const remainingTrs = tbody.querySelectorAll('tr');
    const newRowCount = remainingTrs.length;
    setRowsCount(newRowCount);
    el.setAttribute('data-rows', newRowCount.toString());

    // Update row heights proportionally
    const rowHeightPct = (100 / Math.max(1, newRowCount)).toFixed(3);
    remainingTrs.forEach(tr => {
      tr.style.height = `${rowHeightPct}%`;
      tr.style.boxSizing = 'border-box';
    });

    const fo = el.querySelector('foreignObject');
    const overlay = el.querySelector('.svg-table-overlay, .svg-image-stroke-overlay');
    if (fo) {
      const curH = parseFloat(fo.getAttribute('height') || '60');
      const subH = Math.max(12, Math.round(curH / (rowsCount || 3)));
      const newH = Math.max(30, curH - subH);
      fo.setAttribute('height', newH.toString());
      if (overlay) overlay.setAttribute('height', newH.toString());
    }

    attachCellListeners(el);
    clearCellSelection(el);
    applyTableStyles();
    syncChanges(el);
  };

  const handleSelectEntireRow = () => {
    const el = getTargetElement();
    if (!el) return;
    const trs = el.querySelectorAll('tr');
    if (!trs.length) return;
    const totalCols = trs[0].children.length;
    let targetR = 0;
    if (selectedCellKeys.size > 0) {
      targetR = parseInt(Array.from(selectedCellKeys)[0].split('_')[0], 10);
    }
    if (targetR < 0 || targetR >= trs.length) targetR = 0;
    selectCellRange(el, targetR, 0, targetR, totalCols - 1, false);
  };

  const handleSelectEntireCol = () => {
    const el = getTargetElement();
    if (!el) return;
    const trs = el.querySelectorAll('tr');
    if (!trs.length) return;
    const totalRows = trs.length;
    const totalCols = trs[0].children.length;
    let targetC = 0;
    if (selectedCellKeys.size > 0) {
      targetC = parseInt(Array.from(selectedCellKeys)[0].split('_')[1], 10);
    }
    if (targetC < 0 || targetC >= totalCols) targetC = 0;
    selectCellRange(el, 0, targetC, totalRows - 1, targetC, false);
  };

  const handleMergeCells = () => {
    const el = getTargetElement();
    if (!el) return;
    const activeCell = document.activeElement?.closest('td, th');
    if (activeCell && activeCell.nextElementSibling) {
      const curSpan = parseInt(activeCell.getAttribute('colspan') || '1', 10);
      activeCell.setAttribute('colspan', (curSpan + 1).toString());
      activeCell.nextElementSibling.remove();
      syncChanges(el);
      return;
    }

    const firstRow = el.querySelector('tr');
    if (firstRow && firstRow.children.length > 1) {
      const firstCell = firstRow.children[0];
      const secondCell = firstRow.children[1];
      const curSpan = parseInt(firstCell.getAttribute('colspan') || '1', 10);
      firstCell.setAttribute('colspan', (curSpan + 1).toString());
      secondCell.remove();
      syncChanges(el);
    }
  };

  const handleUnmergeCells = () => {
    const el = getTargetElement();
    if (!el) return;
    const mergedCells = el.querySelectorAll('td[colspan], td[rowspan]');
    mergedCells.forEach(cell => {
      const span = parseInt(cell.getAttribute('colspan') || '1', 10);
      cell.removeAttribute('colspan');
      cell.removeAttribute('rowspan');
      const parentRow = cell.parentElement;
      if (parentRow && span > 1) {
        for (let i = 1; i < span; i++) {
          const newTd = document.createElement('td');
          newTd.setAttribute('contenteditable', 'true');
          newTd.style.border = `${Math.max(1, Math.round(borderWidth / 2))}px ${borderStyle} ${hexToRgba(borderColor, borderOpacity)}`;
          newTd.style.padding = `${paddingY}px ${paddingX}px`;
          newTd.style.color = hexToRgba(cellColor, cellOpacity);
          newTd.style.textAlign = textAlign;
          newTd.style.verticalAlign = verticalAlign;
          newTd.style.boxSizing = 'border-box';
          newTd.style.wordBreak = 'break-word';
          newTd.style.outline = 'none';
          newTd.style.backgroundColor = 'transparent';
          parentRow.appendChild(newTd);
        }
      }
    });
    attachCellListeners(el);
    syncChanges(el);
  };

  const handleAddCell = () => {
    const el = getTargetElement();
    if (!el) return;
    const lastRow = el.querySelector('tr:last-child');
    if (lastRow) {
      const newTd = document.createElement('td');
      newTd.setAttribute('contenteditable', 'true');
      newTd.style.border = `${Math.max(1, Math.round(borderWidth / 2))}px ${borderStyle} ${hexToRgba(borderColor, borderOpacity)}`;
      newTd.style.padding = `${paddingY}px ${paddingX}px`;
      newTd.style.color = hexToRgba(cellColor, cellOpacity);
      newTd.style.textAlign = textAlign;
      newTd.style.verticalAlign = verticalAlign;
      newTd.style.boxSizing = 'border-box';
      newTd.style.wordBreak = 'break-word';
      newTd.style.outline = 'none';
      newTd.style.backgroundColor = 'transparent';
      lastRow.appendChild(newTd);
      attachCellListeners(el);
      syncChanges(el);
    }
  };

  const handleDeleteCell = () => {
    const el = getTargetElement();
    if (!el) return;
    const lastRow = el.querySelector('tr:last-child');
    if (!lastRow) return;
    const lastCell = lastRow.querySelector('td:last-child');
    if (lastCell) {
      lastCell.remove();
      if (lastRow.children.length === 0) {
        lastRow.remove();
        setRowsCount(Math.max(1, rowsCount - 1));
      }
      attachCellListeners(el);
      syncChanges(el);
    }
  };

  return (
    <div className="w-full flex flex-col gap-[0.6vw] font-sans text-gray-800 pt-[0.2vw] pr-[0.2vw] select-none pb-[3vw]">
      {/* ── SECTION 1: Excel Data & Clipboard ─────────────────────────── */}
      <div className="flex flex-col gap-[0.5vw]">
        <SectionHeader title="Excel Data & Clipboard" />

        <div className="grid grid-cols-2 gap-[0.5vw] pl-[0.5vw] pr-[0.2vw]">
          <label className="flex items-center justify-center gap-[0.4vw] border border-gray-200 rounded-[0.4vw] h-[2.2vw] bg-white hover:bg-gray-50 hover:border-[#E05638] hover:text-[#E05638] active:scale-98 transition-all text-gray-700 shadow-2xs cursor-pointer font-semibold text-[0.74vw]">
            <Upload size="0.9vw" />
            <span>Import .xlsx</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelImport}
              className="hidden"
            />
          </label>

          <button
            onClick={handleExcelExport}
            className="flex items-center justify-center gap-[0.4vw] border border-gray-200 rounded-[0.4vw] h-[2.2vw] bg-white hover:bg-gray-50 hover:border-[#E05638] hover:text-[#E05638] active:scale-98 transition-all text-gray-700 shadow-2xs font-semibold text-[0.74vw]"
            title="Download table as Excel (.xlsx)"
          >
            <Download size="0.9vw" />
            <span>Export .xlsx</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-[0.5vw] pl-[0.5vw] pr-[0.2vw]">
          <button
            onClick={handleCopyCells}
            className="flex items-center justify-center gap-[0.4vw] border border-gray-200 rounded-[0.4vw] h-[2vw] bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-98 transition-all text-gray-700 shadow-2xs text-[0.72vw] font-medium"
            title="Copy selected cells or table to clipboard (TSV)"
          >
            <Copy size="0.85vw" />
            <span>Copy (Ctrl+C)</span>
          </button>

          <button
            onClick={() => handlePasteCells()}
            className="flex items-center justify-center gap-[0.4vw] border border-gray-200 rounded-[0.4vw] h-[2vw] bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-98 transition-all text-gray-700 shadow-2xs text-[0.72vw] font-medium"
            title="Paste tabular text into table"
          >
            <ClipboardPaste size="0.85vw" />
            <span>Paste (Ctrl+V)</span>
          </button>
        </div>

        {/* Cell Selection Status & Inline Editor */}
        <div className="flex flex-col gap-[0.4vw] bg-gray-50/70 p-[0.6vw] rounded-[0.5vw] border border-gray-200 ml-[0.5vw] mr-[0.2vw]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[0.4vw]">
              <MousePointer size="0.85vw" className="text-[#E05638]" />
              <span className="text-[0.75vw] font-bold text-gray-700">
                {getSelectionCoordinateLabel()}
              </span>
            </div>
            {selectedCellKeys.size > 0 ? (
              <button
                onClick={() => clearCellSelection()}
                className="text-[0.7vw] text-[#E05638] hover:underline font-semibold cursor-pointer"
              >
                Clear Selection
              </button>
            ) : (
              <button
                onClick={() => {
                  const el = getTargetElement();
                  if (el) {
                    const trs = el.querySelectorAll('tr');
                    if (trs.length && trs[0].children.length) {
                      selectCellRange(el, 0, 0, trs.length - 1, trs[0].children.length - 1, false);
                    }
                  }
                }}
                className="text-[0.7vw] text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
              >
                Select All
              </button>
            )}
          </div>

          {selectedCellKeys.size > 0 && (
            <div className="flex flex-col gap-[0.2vw] mt-[0.2vw]">
              <span className="text-[0.7vw] text-gray-500 font-medium">Edit Selected Content:</span>
              <textarea
                value={selectedCellText}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCellText(val);
                  const el = getTargetElement();
                  if (!el) return;
                  const trs = el.querySelectorAll('tr');
                  selectedCellKeys.forEach(k => {
                    const [r, c] = k.split('_').map(Number);
                    const td = trs[r]?.children[c];
                    if (td) td.textContent = val;
                  });
                  syncChanges(el);
                }}
                placeholder={selectedCellKeys.size === 1 ? "Enter cell text..." : `Editing ${selectedCellKeys.size} cells together...`}
                className="w-full h-[3.2vw] p-[0.4vw] text-[0.75vw] border border-gray-200 rounded-[0.35vw] bg-white resize-none outline-none focus:border-[#E05638]"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 2: Table Property & Borders ─────────────────────────── */}
      <div className="flex flex-col gap-[0.5vw]">
        <SectionHeader title="Table Property" />

        {/* Border Style */}
        <PropertyRow label="Border Style">
          <div className="relative">
            <button
              onClick={() => setIsBorderStyleOpen(!isBorderStyleOpen)}
              className="w-full flex items-center justify-between border border-gray-200 rounded-[0.5vw] h-[2.5vw] px-[0.7vw] bg-white hover:border-[#E05638] transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-[0.6vw]">
                <span className="font-bold text-[0.85vw] text-gray-700">
                  {BORDER_STYLES.find(s => s.id === borderStyle)?.icon || '—'}
                </span>
                <span className="text-[0.78vw] font-medium text-gray-700 capitalize">
                  {BORDER_STYLES.find(s => s.id === borderStyle)?.label || 'Solid'}
                </span>
              </div>
              <ChevronDown size="0.9vw" className="text-gray-500" />
            </button>

            {isBorderStyleOpen && (
              <div className="absolute top-[2.7vw] left-0 right-0 bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-50 py-[0.3vw] overflow-hidden">
                {BORDER_STYLES.map(style => (
                  <div
                    key={style.id}
                    onClick={() => {
                      setBorderStyle(style.id);
                      setIsBorderStyleOpen(false);
                      applyTableStyles({ borderStyle: style.id });
                    }}
                    className={`flex items-center gap-[0.6vw] px-[0.7vw] py-[0.4vw] hover:bg-gray-50 cursor-pointer text-[0.75vw] transition-colors ${
                      borderStyle === style.id ? 'bg-[#E05638]/10 font-semibold text-[#E05638]' : 'text-gray-700'
                    }`}
                  >
                    <span className="w-[1.5vw] font-bold text-gray-600">{style.icon}</span>
                    <span>{style.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PropertyRow>

        {/* Border Presets Grid */}
        <div className="flex flex-col gap-[0.3vw] pl-[0.5vw] pr-[0.2vw]">
          <div className="flex items-center justify-between">
            <span className="text-[0.74vw] text-gray-700 font-medium">Border Presets</span>
            <span className="text-[0.68vw] text-gray-400 font-medium">
              {selectedCellKeys.size > 0 ? `${selectedCellKeys.size} cells` : 'Whole table'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-[0.35vw]">
            <button
              onClick={() => applyBorderPreset('all')}
              className="border border-gray-200 rounded-[0.4vw] h-[1.9vw] bg-white hover:bg-gray-50 hover:border-[#E05638] text-[0.72vw] font-medium text-gray-700 active:scale-98 transition-all shadow-2xs"
              title="All Borders"
            >
              All
            </button>
            <button
              onClick={() => applyBorderPreset('outer')}
              className="border border-gray-200 rounded-[0.4vw] h-[1.9vw] bg-white hover:bg-gray-50 hover:border-[#E05638] text-[0.72vw] font-medium text-gray-700 active:scale-98 transition-all shadow-2xs"
              title="Outer Box Border"
            >
              Outer
            </button>
            <button
              onClick={() => applyBorderPreset('none')}
              className="border border-gray-200 rounded-[0.4vw] h-[1.9vw] bg-white hover:bg-gray-50 hover:border-[#E05638] text-[0.72vw] font-medium text-gray-700 active:scale-98 transition-all shadow-2xs"
              title="No Border"
            >
              None
            </button>
            <button
              onClick={() => applyBorderPreset('bottom')}
              className="border border-gray-200 rounded-[0.4vw] h-[1.9vw] bg-white hover:bg-gray-50 hover:border-[#E05638] text-[0.72vw] font-medium text-gray-700 active:scale-98 transition-all shadow-2xs"
              title="Bottom Border"
            >
              Bottom
            </button>
            <button
              onClick={() => applyBorderPreset('top')}
              className="border border-gray-200 rounded-[0.4vw] h-[1.9vw] bg-white hover:bg-gray-50 hover:border-[#E05638] text-[0.72vw] font-medium text-gray-700 active:scale-98 transition-all shadow-2xs"
              title="Top Border"
            >
              Top
            </button>
            <button
              onClick={() => applyBorderPreset('left')}
              className="border border-gray-200 rounded-[0.4vw] h-[1.9vw] bg-white hover:bg-gray-50 hover:border-[#E05638] text-[0.72vw] font-medium text-gray-700 active:scale-98 transition-all shadow-2xs"
              title="Left Border"
            >
              Left
            </button>
            <button
              onClick={() => applyBorderPreset('right')}
              className="border border-gray-200 rounded-[0.4vw] h-[1.9vw] bg-white hover:bg-gray-50 hover:border-[#E05638] text-[0.72vw] font-medium text-gray-700 active:scale-98 transition-all shadow-2xs"
              title="Right Border"
            >
              Right
            </button>
            <button
              onClick={() => applyBorderPreset('clear')}
              className="border border-gray-200 rounded-[0.4vw] h-[1.9vw] bg-white hover:bg-red-50 hover:border-red-300 text-red-600 text-[0.72vw] font-medium active:scale-98 transition-all shadow-2xs"
              title="Clear All Borders"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Theme / Table Color */}
        <PropertyRow label="Theme Color">
          <ColorInput
            color={themeColor}
            onChange={(val) => {
              setThemeColor(val);
              applyTableStyles({ themeColor: val });
            }}
            opacity={themeOpacity}
            onOpenPicker={() => setActiveColorPicker(activeColorPicker === 'theme' ? null : 'theme')}
            isActive={activeColorPicker === 'theme'}
          />
        </PropertyRow>

        {/* Border Color */}
        <PropertyRow label="Border Color">
          <ColorInput
            color={borderColor}
            onChange={(val) => {
              setBorderColor(val);
              applyTableStyles({ borderColor: val });
            }}
            opacity={borderOpacity}
            onOpenPicker={() => setActiveColorPicker(activeColorPicker === 'border' ? null : 'border')}
            isActive={activeColorPicker === 'border'}
          />
        </PropertyRow>

        {/* Border Width */}
        <PropertyRow label="Border Width">
          <div className="flex items-center gap-[0.5vw]">
            <input
              type="range"
              min={0}
              max={20}
              value={borderWidth}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBorderWidth(val);
                applyTableStyles({ borderWidth: val });
              }}
              className="flex-1 h-[0.25vw] appearance-none cursor-pointer bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[0.85vw] [&::-webkit-slider-thumb]:h-[0.85vw] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[0.16vw] [&::-webkit-slider-thumb]:border-[#E05638] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-xs"
              style={{
                background: `linear-gradient(to right, #E05638 0%, #E05638 ${(borderWidth / 20) * 100}%, #e5e7eb ${(borderWidth / 20) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="w-[3.2vw] h-[1.8vw] flex items-center justify-center bg-white border border-gray-200 rounded-[0.4vw] shadow-2xs">
              <span className="text-[0.75vw] text-gray-700 font-medium">{borderWidth}px</span>
            </div>
          </div>
        </PropertyRow>

        {/* Border Radius */}
        <PropertyRow label="Border Radius">
          <div className="flex items-center gap-[0.5vw]">
            <input
              type="range"
              min={0}
              max={30}
              value={borderRadius}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBorderRadius(val);
                applyTableStyles({ borderRadius: val });
              }}
              className="flex-1 h-[0.25vw] appearance-none cursor-pointer bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[0.85vw] [&::-webkit-slider-thumb]:h-[0.85vw] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[0.16vw] [&::-webkit-slider-thumb]:border-[#E05638] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-xs"
              style={{
                background: `linear-gradient(to right, #E05638 0%, #E05638 ${(borderRadius / 30) * 100}%, #e5e7eb ${(borderRadius / 30) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="w-[3.2vw] h-[1.8vw] flex items-center justify-center bg-white border border-gray-200 rounded-[0.4vw] shadow-2xs">
              <span className="text-[0.75vw] text-gray-700 font-medium">{borderRadius}px</span>
            </div>
          </div>
        </PropertyRow>
      </div>

      {/* ── SECTION 3: Structure ───────────────────────────────────────── */}
      <div className="flex flex-col gap-[0.5vw]">
        <SectionHeader title="Structure" />

        {/* Scroll Option Toggle */}
        <div className="flex items-center justify-between pl-[0.5vw] pr-[0.2vw] h-[2.2vw]">
          <div className="flex items-center gap-[0.4vw]">
            <span className="text-[0.78vw] font-medium text-gray-700">Scroll Option</span>
            <span className={`text-[0.6vw] px-[0.35vw] py-[0.08vw] rounded font-semibold ${
              isScrollable ? 'bg-[#E05638]/10 text-[#E05638]' : 'bg-gray-100 text-gray-500'
            }`}>
              {isScrollable ? 'Scrollable' : 'Fixed'}
            </span>
          </div>
          <Toggle
            checked={isScrollable}
            onChange={(nextVal) => {
              setIsScrollable(nextVal);
              applyTableStyles({ isScrollable: nextVal });
            }}
          />
        </div>

        {/* Fit Table to Page */}
        <div className="pl-[0.5vw] pr-[0.2vw]">
          <button
            onClick={() => fitTableToPage()}
            className="w-full flex items-center justify-center gap-[0.5vw] border border-gray-200 rounded-[0.4vw] h-[2.2vw] bg-white hover:bg-gray-50 hover:border-[#E05638] hover:text-[#E05638] active:scale-98 transition-all text-gray-700 shadow-2xs font-semibold text-[0.76vw]"
            title="Fit table cleanly inside page boundaries"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            <span>Fit Table to Page</span>
          </button>
        </div>

        {/* Column */}
        <PropertyRow label={`Column (${colsCount})`}>
          <div className="grid grid-cols-4 gap-[0.35vw]">
            <button
              onClick={() => handleInsertColumn('left')}
              className="flex items-center justify-center gap-[0.2vw] border border-gray-200 rounded-[0.4vw] h-[2vw] bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-98 transition-all text-gray-700 shadow-2xs"
              title={selectedCellKeys.size > 0 ? "Insert Column left of active selection" : "Insert Column at left"}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
                <line x1="5" y1="5" x2="5" y2="19" />
              </svg>
              <span className="text-[0.68vw] font-medium">+ Left</span>
            </button>
            <button
              onClick={() => handleInsertColumn('right')}
              className="flex items-center justify-center gap-[0.2vw] border border-gray-200 rounded-[0.4vw] h-[2vw] bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-98 transition-all text-gray-700 shadow-2xs"
              title={selectedCellKeys.size > 0 ? "Insert Column right of active selection" : "Insert Column at right"}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
              <span className="text-[0.68vw] font-medium">+ Right</span>
            </button>
            <button
              onClick={handleSelectEntireCol}
              className="flex items-center justify-center gap-[0.2vw] border border-gray-200 rounded-[0.4vw] h-[2vw] bg-white hover:bg-gray-50 hover:border-[#E05638] hover:text-[#E05638] active:scale-98 transition-all text-gray-700 shadow-2xs font-semibold text-[0.66vw]"
              title="Select entire column (Excel Column Header)"
            >
              <span>Select</span>
            </button>
            <button
              onClick={handleDeleteColumn}
              className="flex items-center justify-center gap-[0.2vw] border border-red-200 rounded-[0.4vw] h-[2vw] bg-red-50 hover:bg-red-100 active:scale-98 transition-all text-red-600 shadow-2xs"
              title={selectedCellKeys.size > 0 ? "Delete selected column(s)" : "Delete last column"}
            >
              <Trash2 size="0.75vw" />
              <span className="text-[0.68vw] font-medium">Delete</span>
            </button>
          </div>
        </PropertyRow>

        {/* Row */}
        <PropertyRow label={`Row (${rowsCount})`}>
          <div className="grid grid-cols-4 gap-[0.35vw]">
            <button
              onClick={() => handleInsertRow('above')}
              className="flex items-center justify-center gap-[0.2vw] border border-gray-200 rounded-[0.4vw] h-[2vw] bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-98 transition-all text-gray-700 shadow-2xs"
              title={selectedCellKeys.size > 0 ? "Insert Row above active selection" : "Insert Row at top"}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
                <line x1="5" y1="5" x2="19" y2="5" />
              </svg>
              <span className="text-[0.68vw] font-medium">+ Above</span>
            </button>
            <button
              onClick={() => handleInsertRow('below')}
              className="flex items-center justify-center gap-[0.2vw] border border-gray-200 rounded-[0.4vw] h-[2vw] bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-98 transition-all text-gray-700 shadow-2xs"
              title={selectedCellKeys.size > 0 ? "Insert Row below active selection" : "Insert Row at bottom"}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
                <line x1="5" y1="19" x2="19" y2="19" />
              </svg>
              <span className="text-[0.68vw] font-medium">+ Below</span>
            </button>
            <button
              onClick={handleSelectEntireRow}
              className="flex items-center justify-center gap-[0.2vw] border border-gray-200 rounded-[0.4vw] h-[2vw] bg-white hover:bg-gray-50 hover:border-[#E05638] hover:text-[#E05638] active:scale-98 transition-all text-gray-700 shadow-2xs font-semibold text-[0.66vw]"
              title="Select entire row (Excel Row Header)"
            >
              <span>Select</span>
            </button>
            <button
              onClick={handleDeleteRow}
              className="flex items-center justify-center gap-[0.2vw] border border-red-200 rounded-[0.4vw] h-[2vw] bg-red-50 hover:bg-red-100 active:scale-98 transition-all text-red-600 shadow-2xs"
              title={selectedCellKeys.size > 0 ? "Delete selected row(s)" : "Delete last row"}
            >
              <Trash2 size="0.75vw" />
              <span className="text-[0.68vw] font-medium">Delete</span>
            </button>
          </div>
        </PropertyRow>

        {/* Cell Operation */}
        <div className="flex flex-col gap-[0.4vw] mt-[0.2vw] pl-[0.5vw] pr-[0.2vw]">
          <span className="text-[0.78vw] text-gray-700 font-medium">Cell Operation</span>
          <div className="grid grid-cols-2 gap-[0.5vw]">
            <button
              onClick={handleMergeCells}
              className="flex items-center justify-center gap-[0.4vw] border border-gray-200 rounded-[0.4vw] h-[2vw] bg-white hover:bg-gray-50 hover:border-[#E05638] active:scale-98 transition-all text-gray-700 shadow-2xs"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <path d="M8 9l-4 3 4 3" />
                <path d="M16 9l4 3-4 3" />
                <line x1="12" y1="5" x2="12" y2="19" />
              </svg>
              <span className="text-[0.72vw] font-medium">Merge Cells</span>
            </button>
            <button
              onClick={handleUnmergeCells}
              className="flex items-center justify-center gap-[0.4vw] border border-gray-200 rounded-[0.4vw] h-[2vw] bg-white hover:bg-gray-50 hover:border-[#E05638] active:scale-98 transition-all text-gray-700 shadow-2xs"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <path d="M14 12h7" />
                <path d="M10 12H3" />
                <polyline points="7 9 4 12 7 15" />
                <polyline points="17 9 20 12 17 15" />
              </svg>
              <span className="text-[0.72vw] font-medium">Unmerge Cells</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-[0.5vw]">
            <button
              onClick={handleAddCell}
              className="flex items-center justify-center gap-[0.4vw] border border-[#22c55e]/30 rounded-[0.4vw] h-[2.1vw] bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#16a34a] active:scale-98 transition-all shadow-2xs"
            >
              <Plus size="0.95vw" strokeWidth={2.5} />
              <span className="text-[0.75vw] font-semibold">Add Cell</span>
            </button>
            <button
              onClick={handleDeleteCell}
              className="flex items-center justify-center gap-[0.4vw] border border-[#fca5a5]/30 rounded-[0.4vw] h-[2.1vw] bg-[#fef2f2] hover:bg-[#fee2e2] text-[#ef4444] active:scale-98 transition-all shadow-2xs"
            >
              <Minus size="0.95vw" strokeWidth={2.5} />
              <span className="text-[0.75vw] font-semibold">Delete Cell</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: Text & Cell Property ────────────────────────────── */}
      <div className="flex flex-col gap-[0.5vw]">
        <SectionHeader title="Text & Cell Property" />

        {/* Text / Cell Color */}
        <PropertyRow label="Text Color">
          <ColorInput
            color={cellColor}
            onChange={(val) => {
              setCellColor(val);
              applyTableStyles({ cellColor: val });
            }}
            opacity={cellOpacity}
            onOpenPicker={() => setActiveColorPicker(activeColorPicker === 'cell' ? null : 'cell')}
            isActive={activeColorPicker === 'cell'}
          />
        </PropertyRow>

        {/* Cell Background Color */}
        <PropertyRow label="Cell BG">
          <ColorInput
            color={cellBgColor}
            onChange={(val) => {
              setCellBgColor(val);
              applyCellBackground(val, cellBgOpacity);
            }}
            opacity={cellBgOpacity}
            onOpenPicker={() => setActiveColorPicker(activeColorPicker === 'cellBg' ? null : 'cellBg')}
            isActive={activeColorPicker === 'cellBg'}
          />
        </PropertyRow>

        {/* Font Family & Font Size */}
        <div className="grid grid-cols-[1.6fr_1fr] gap-[0.5vw] pl-[0.5vw] pr-[0.2vw]">
          {/* Font Family */}
          <div className="relative">
            <button
              onClick={() => setIsFontFamilyOpen(!isFontFamilyOpen)}
              className="w-full flex items-center justify-between border border-gray-200 rounded-[0.5vw] h-[2.5vw] px-[0.7vw] bg-white hover:border-[#E05638] transition-colors shadow-2xs"
            >
              <span className="text-[0.78vw] font-medium text-gray-700 truncate">{fontFamily}</span>
              <ChevronDown size="0.85vw" className="text-gray-500 flex-shrink-0 ml-[0.3vw]" />
            </button>
            {isFontFamilyOpen && (
              <div className="absolute top-[2.7vw] left-0 right-0 bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-50 py-[0.3vw] max-h-[12vw] overflow-y-auto">
                {FONT_FAMILIES.map(fam => (
                  <div
                    key={fam}
                    onClick={() => {
                      setFontFamily(fam);
                      setIsFontFamilyOpen(false);
                      applyTableStyles({ fontFamily: fam });
                    }}
                    className={`px-[0.7vw] py-[0.35vw] text-[0.75vw] cursor-pointer hover:bg-gray-50 transition-colors ${
                      fontFamily === fam ? 'bg-[#E05638]/10 font-semibold text-[#E05638]' : 'text-gray-700'
                    }`}
                    style={{ fontFamily: fam }}
                  >
                    {fam}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div className="relative">
            <button
              onClick={() => setIsFontSizeOpen(!isFontSizeOpen)}
              className="w-full flex items-center justify-between border border-gray-200 rounded-[0.5vw] h-[2.5vw] px-[0.7vw] bg-white hover:border-[#E05638] transition-colors shadow-2xs"
            >
              <span className="text-[0.78vw] font-medium text-gray-700">{fontSize}</span>
              <ChevronDown size="0.85vw" className="text-gray-500 flex-shrink-0" />
            </button>
            {isFontSizeOpen && (
              <div className="absolute top-[2.7vw] left-0 right-0 bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-50 py-[0.3vw] max-h-[10vw] overflow-y-auto">
                {FONT_SIZES.map(sz => (
                  <div
                    key={sz}
                    onClick={() => {
                      setFontSize(sz);
                      setIsFontSizeOpen(false);
                      applyTableStyles({ fontSize: sz });
                    }}
                    className={`px-[0.7vw] py-[0.35vw] text-[0.75vw] cursor-pointer hover:bg-gray-50 transition-colors ${
                      fontSize === sz ? 'bg-[#E05638]/10 font-semibold text-[#E05638]' : 'text-gray-700'
                    }`}
                  >
                    {sz}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Font Weight & Auto buttons */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-[0.5vw] pl-[0.5vw] pr-[0.2vw]">
          {/* Font Weight */}
          <div className="relative">
            <button
              onClick={() => setIsFontWeightOpen(!isFontWeightOpen)}
              className="w-full flex items-center justify-between border border-gray-200 rounded-[0.5vw] h-[2.5vw] px-[0.7vw] bg-white hover:border-[#E05638] transition-colors shadow-2xs"
            >
              <span className="text-[0.78vw] font-medium text-gray-700 truncate">{fontWeight}</span>
              <ChevronDown size="0.85vw" className="text-gray-500 flex-shrink-0" />
            </button>
            {isFontWeightOpen && (
              <div className="absolute top-[2.7vw] left-0 right-0 bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-50 py-[0.3vw]">
                {FONT_WEIGHTS.map(w => (
                  <div
                    key={w}
                    onClick={() => {
                      setFontWeight(w);
                      setIsFontWeightOpen(false);
                      setIsBold(w.toLowerCase().includes('bold'));
                      applyTableStyles({ fontWeight: w, isBold: w.toLowerCase().includes('bold') });
                    }}
                    className={`px-[0.7vw] py-[0.35vw] text-[0.75vw] cursor-pointer hover:bg-gray-50 transition-colors ${
                      fontWeight === w ? 'bg-[#E05638]/10 font-semibold text-[#E05638]' : 'text-gray-700'
                    }`}
                  >
                    {w}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto Width */}
          <button
            onClick={() => {
              const nextAuto = !autoWidth;
              setAutoWidth(nextAuto);
              applyTableStyles({ autoWidth: nextAuto });
            }}
            className={`flex items-center justify-center gap-[0.3vw] border rounded-[0.5vw] h-[2.5vw] px-[0.4vw] transition-colors shadow-2xs ${
              autoWidth ? 'border-[#E05638] bg-[#E05638]/5 text-[#E05638]' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
            title="Auto Table Width"
          >
            <span className="text-[0.72vw] font-medium">Auto</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16" />
              <polyline points="7 9 4 12 7 15" />
              <polyline points="17 9 20 12 17 15" />
              <line x1="3" y1="4" x2="3" y2="20" />
              <line x1="21" y1="4" x2="21" y2="20" />
            </svg>
          </button>

          {/* Auto Height */}
          <button
            onClick={() => {
              const nextAutoH = !autoHeight;
              setAutoHeight(nextAutoH);
              applyTableStyles({ autoHeight: nextAutoH });
            }}
            className={`flex items-center justify-center gap-[0.3vw] border rounded-[0.5vw] h-[2.5vw] px-[0.4vw] transition-colors shadow-2xs ${
              autoHeight ? 'border-[#E05638] bg-[#E05638]/5 text-[#E05638]' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
            title="Auto Row Height"
          >
            <span className="text-[0.72vw] font-medium">Auto</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v16" />
              <polyline points="9 7 12 4 15 7" />
              <polyline points="9 17 12 20 15 17" />
              <line x1="4" y1="3" x2="20" y2="3" />
              <line x1="4" y1="21" x2="20" y2="21" />
            </svg>
          </button>
        </div>

        {/* Alignment & Format row */}
        <div className="grid grid-cols-4 gap-[0.5vw] pl-[0.5vw] pr-[0.2vw]">
          {/* Align */}
          <button
            onClick={() => {
              const nextAlign = textAlign === 'left' ? 'center' : textAlign === 'center' ? 'right' : 'left';
              setTextAlign(nextAlign);
              applyTableStyles({ textAlign: nextAlign });
            }}
            className="flex items-center justify-center border border-gray-200 rounded-[0.5vw] h-[2.5vw] bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 shadow-2xs transition-colors"
            title="Alignment"
          >
            {textAlign === 'center' ? (
              <AlignCenter size="1vw" strokeWidth={2.2} />
            ) : textAlign === 'right' ? (
              <AlignRight size="1vw" strokeWidth={2.2} />
            ) : (
              <AlignLeft size="1vw" strokeWidth={2.2} />
            )}
          </button>

          {/* Bold */}
          <button
            onClick={() => {
              const next = !isBold;
              setIsBold(next);
              applyTableStyles({ isBold: next });
            }}
            className={`flex items-center justify-center border rounded-[0.5vw] h-[2.5vw] shadow-2xs transition-colors ${
              isBold ? 'border-[#E05638] bg-[#E05638]/5 text-[#E05638] font-bold' : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700'
            }`}
            title="Bold"
          >
            <span className="font-extrabold text-[0.9vw]">B</span>
          </button>

          {/* Strikethrough / Dash */}
          <button
            onClick={() => {
              const next = !isStrikethrough;
              setIsStrikethrough(next);
              applyTableStyles({ isStrikethrough: next });
            }}
            className={`flex items-center justify-center border rounded-[0.5vw] h-[2.5vw] shadow-2xs transition-colors ${
              isStrikethrough ? 'border-[#E05638] bg-[#E05638]/5 text-[#E05638]' : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700'
            }`}
            title="Strikethrough"
          >
            <span className="font-bold text-[1vw] leading-none">—</span>
          </button>

          {/* List */}
          <button
            onClick={() => {
              const next = !isList;
              setIsList(next);
              applyTableStyles({ isList: next });
            }}
            className={`flex items-center justify-center border rounded-[0.5vw] h-[2.5vw] shadow-2xs transition-colors ${
              isList ? 'border-[#E05638] bg-[#E05638]/5 text-[#E05638]' : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700'
            }`}
            title="List"
          >
            <List size="1vw" strokeWidth={2.2} />
          </button>
        </div>

        {/* Vertical Align & Text Wrapping */}
        <div className="grid grid-cols-2 gap-[0.5vw] pl-[0.5vw] pr-[0.2vw]">
          <button
            onClick={() => {
              const nextV = verticalAlign === 'top' ? 'middle' : verticalAlign === 'middle' ? 'bottom' : 'top';
              setVerticalAlign(nextV);
              applyTableStyles({ verticalAlign: nextV });
            }}
            className="flex items-center justify-center gap-[0.4vw] border border-gray-200 rounded-[0.5vw] h-[2.5vw] bg-white hover:bg-gray-50 hover:border-[#E05638] active:scale-98 transition-all text-[#E05638] shadow-2xs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v14" />
              <polyline points="7 12 12 17 17 12" />
              <line x1="4" y1="21" x2="20" y2="21" />
            </svg>
            <span className="text-[0.74vw] font-medium text-[#E05638] capitalize">
              {verticalAlign} Align
            </span>
          </button>

          <button
            onClick={() => {
              const nextW = !textWrapping;
              setTextWrapping(nextW);
              applyTableStyles({ textWrapping: nextW });
            }}
            className={`flex items-center justify-center gap-[0.4vw] border rounded-[0.5vw] h-[2.5vw] active:scale-98 transition-all shadow-2xs ${
              textWrapping ? 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300' : 'border-gray-200 bg-gray-50 text-gray-400'
            }`}
          >
            <WrapText size="1vw" strokeWidth={2.2} className="text-gray-600" />
            <span className="text-[0.74vw] font-medium">Text Wrapping</span>
          </button>
        </div>

        {/* Left & Right Padding */}
        <PropertyRow label="Padding X">
          <div className="flex items-center gap-[0.5vw]">
            <input
              type="range"
              min={0}
              max={30}
              value={paddingX}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPaddingX(val);
                applyTableStyles({ paddingX: val });
              }}
              className="flex-1 h-[0.25vw] appearance-none cursor-pointer bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[0.85vw] [&::-webkit-slider-thumb]:h-[0.85vw] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[0.16vw] [&::-webkit-slider-thumb]:border-[#E05638] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-xs"
              style={{
                background: `linear-gradient(to right, #E05638 0%, #E05638 ${(paddingX / 30) * 100}%, #e5e7eb ${(paddingX / 30) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="w-[3.2vw] h-[1.8vw] flex items-center justify-center bg-white border border-gray-200 rounded-[0.4vw] shadow-2xs">
              <span className="text-[0.75vw] text-gray-700 font-medium">{paddingX}px</span>
            </div>
          </div>
        </PropertyRow>

        {/* Top & Bottom Padding */}
        <PropertyRow label="Padding Y">
          <div className="flex items-center gap-[0.5vw]">
            <input
              type="range"
              min={0}
              max={30}
              value={paddingY}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPaddingY(val);
                applyTableStyles({ paddingY: val });
              }}
              className="flex-1 h-[0.25vw] appearance-none cursor-pointer bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[0.85vw] [&::-webkit-slider-thumb]:h-[0.85vw] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[0.16vw] [&::-webkit-slider-thumb]:border-[#E05638] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-xs"
              style={{
                background: `linear-gradient(to right, #E05638 0%, #E05638 ${(paddingY / 30) * 100}%, #e5e7eb ${(paddingY / 30) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="w-[3.2vw] h-[1.8vw] flex items-center justify-center bg-white border border-gray-200 rounded-[0.4vw] shadow-2xs">
              <span className="text-[0.75vw] text-gray-700 font-medium">{paddingY}px</span>
            </div>
          </div>
        </PropertyRow>
      </div>

      {/* ── SECTION 5: Effects ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-[0.5vw]">
        <SectionHeader title="Effects" />

        {/* Drop Shadow toggle */}
        <div className="flex items-center justify-between pl-[0.5vw] pr-[0.2vw] h-[2.2vw]">
          <span className="text-[0.78vw] font-medium text-gray-700">Drop Shadow</span>
          <Toggle
            checked={hasDropShadow}
            onChange={(next) => {
              setHasDropShadow(next);
              applyTableStyles({ hasDropShadow: next });
            }}
          />
        </div>
      </div>

      {/* Color Picker Portal */}
      {activeColorPicker && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setActiveColorPicker(null)}
          />
          <div
            className="fixed z-[9999]"
            style={{
              top: '50%',
              right: '21vw',
              transform: 'translateY(-50%)'
            }}
          >
            <div className="animate-in fade-in zoom-in-95 duration-200 bg-white rounded-xl shadow-2xl p-2 border border-gray-200">
              <ColorPicker
                color={
                  activeColorPicker === 'theme' ? themeColor :
                  activeColorPicker === 'border' ? borderColor :
                  activeColorPicker === 'cellBg' ? cellBgColor :
                  cellColor
                }
                onChange={(newColor) => {
                  if (activeColorPicker === 'theme') {
                    setThemeColor(newColor);
                    applyTableStyles({ themeColor: newColor });
                  } else if (activeColorPicker === 'border') {
                    setBorderColor(newColor);
                    applyTableStyles({ borderColor: newColor });
                  } else if (activeColorPicker === 'cellBg') {
                    setCellBgColor(newColor);
                    applyCellBackground(newColor, cellBgOpacity);
                  } else {
                    setCellColor(newColor);
                    applyTableStyles({ cellColor: newColor });
                  }
                }}
                opacity={
                  activeColorPicker === 'theme' ? themeOpacity :
                  activeColorPicker === 'border' ? borderOpacity :
                  activeColorPicker === 'cellBg' ? cellBgOpacity :
                  cellOpacity
                }
                onOpacityChange={(newOpacity) => {
                  if (activeColorPicker === 'theme') {
                    setThemeOpacity(newOpacity);
                    applyTableStyles({ themeOpacity: newOpacity });
                  } else if (activeColorPicker === 'border') {
                    setBorderOpacity(newOpacity);
                    applyTableStyles({ borderOpacity: newOpacity });
                  } else if (activeColorPicker === 'cellBg') {
                    setCellBgOpacity(newOpacity);
                    applyCellBackground(cellBgColor, newOpacity);
                  } else {
                    setCellOpacity(newOpacity);
                    applyTableStyles({ cellOpacity: newOpacity });
                  }
                }}
                onClose={() => setActiveColorPicker(null)}
                disableGradient={true}
              />
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default TableProperties;
