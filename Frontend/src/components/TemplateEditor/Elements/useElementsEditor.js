import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { NavIconRenderer } from '../../CustomizedEditor/popups/NavIconStylesPopup';
import { DotRenderer } from '../../CustomizedEditor/popups/DotStylesPopup';

/**
 * Inserts and positions a generic SVG element (Button, Map, Image Frame, QR Code, etc.) into the page canvas.
 */
export const handleAddElementToSvg = ({
  svgContent,
  pageIndex,
  dropPoint,
  pages,
  activePageIndex,
  updatePageHtml,
  setSelectedLayerId,
  selectedLayerIdRef,
  setMultiSelectedIds,
  multiSelectedIdsRef,
  setSingleSelection,
  setActiveMainTool,
  drawOverlayHighlight
}) => {
  const targetPageIndex = pageIndex !== undefined ? pageIndex : (activePageIndex !== undefined ? activePageIndex : 0);
  const page = pages?.[targetPageIndex];
  if (!page) {
    console.warn('handleAddElementToSvg: No page found at targetPageIndex', targetPageIndex);
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(page.html || '', 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) {
    console.warn('handleAddElementToSvg: No svg element in page.html');
    return null;
  }

  let elementDoc = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${svgContent}</svg>`, 'image/svg+xml');
  let parserError = elementDoc.querySelector('parsererror');
  let newElement = parserError ? null : (elementDoc.querySelector('g') || elementDoc.querySelector('svg')?.firstElementChild);

  if (!newElement) {
    // Robust fallback: parse via text/html to forgive entity/attribute issues
    try {
      const htmlDoc = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${svgContent}</svg>`, 'text/html');
      const tempSvg = htmlDoc.querySelector('svg');
      const candidate = tempSvg?.querySelector('g') || tempSvg?.firstElementChild;
      if (candidate) {
        newElement = candidate;
      }
    } catch (e) {
      console.error('Fallback SVG parsing error:', e);
    }
  }

  if (!newElement) {
    console.error('handleAddElementToSvg: Failed to parse element from svgContent', svgContent);
    return null;
  }

  // Ensure element is properly imported into target doc
  let importedElement;
  try {
    importedElement = doc.importNode(newElement, true);
  } catch (e) {
    importedElement = newElement;
  }

  // Positioning logic if dropped or added
  let pw = 297, ph = 210;
  const vbStr = svg.getAttribute('viewBox');
  if (vbStr) {
    const parts = vbStr.trim().split(/[\s,]+/).map(parseFloat);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      pw = parts[2];
      ph = parts[3];
    }
  }

  // If map element is added with small default size (<= 180), adapt to page canvas size
  const isMap = importedElement.getAttribute('data-type') === 'map' || importedElement.id?.startsWith('map-');
  const isTable = importedElement.getAttribute('data-type') === 'table-frame' ||
                  importedElement.getAttribute('data-type') === 'table' ||
                  importedElement.id?.startsWith('table-');
  let foChild = importedElement.querySelector('foreignObject, rect');
  let elW = foChild ? parseFloat(foChild.getAttribute('width') || '100') : 100;
  let elH = foChild ? parseFloat(foChild.getAttribute('height') || '100') : 100;

  if (isTable) {
    const rows = importedElement.querySelectorAll('tr').length || parseInt(importedElement.getAttribute('data-rows') || '3', 10);
    let targetW, targetH;

    if (pw <= 400) {
      // Millimeter canvas (e.g. A4 210x297, A5 148x210, DL 99x210, Square 210x210, Landscape 297x210)
      const marginX = pw > 150 ? 20 : (pw > 100 ? 15 : 10);
      targetW = Math.round(Math.min(pw - marginX * 2, pw * 0.82));
      const maxH = Math.round(ph * 0.45);
      targetH = Math.round(Math.min(maxH, Math.max(rows * 22, Math.round(targetW * 0.41))));
    } else {
      // Pixel canvas (e.g. 800x600, 1000x1400)
      const marginX = Math.round(pw * 0.08);
      targetW = Math.round(pw * 0.8);
      const maxH = Math.round(ph * 0.5);
      targetH = Math.round(Math.min(maxH, Math.max(rows * 55, Math.round(targetW * 0.35))));
    }

    elW = targetW;
    elH = targetH;

    const fo = importedElement.querySelector('foreignObject');
    if (fo) {
      fo.setAttribute('width', targetW.toString());
      fo.setAttribute('height', targetH.toString());
      // Strip whitespace text nodes inside foreignObject and wrapper
      Array.from(fo.childNodes).forEach(n => {
        if (n.nodeType === 3 && !n.textContent.trim()) n.remove();
      });
      const wrap = fo.querySelector('.table-card-wrapper, .table-container');
      if (wrap) {
        wrap.style.whiteSpace = 'normal';
        wrap.style.lineHeight = 'normal';
        wrap.style.display = 'block';
        wrap.style.width = '100%';
        wrap.style.height = '100%';
        wrap.style.boxSizing = 'border-box';
        wrap.style.overflow = 'hidden';
        Array.from(wrap.childNodes).forEach(n => {
          if (n.nodeType === 3 && !n.textContent.trim()) n.remove();
        });
      }
      const tbl = fo.querySelector('table');
      if (tbl) {
        tbl.style.width = '100%';
        tbl.style.height = '100%';
        tbl.style.tableLayout = 'fixed';
        tbl.style.borderCollapse = 'collapse';
        tbl.style.boxSizing = 'border-box';
        tbl.style.backgroundColor = '#ffffff';
        const trList = tbl.querySelectorAll('tr');
        const rLen = trList.length || 1;
        trList.forEach(tr => {
          tr.style.height = `${(100 / rLen).toFixed(3)}%`;
          tr.style.boxSizing = 'border-box';
          const tdList = tr.querySelectorAll('td, th');
          const cLen = tdList.length || 1;
          tdList.forEach(cell => {
            cell.style.width = `${(100 / cLen).toFixed(3)}%`;
            cell.style.height = '100%';
            cell.style.boxSizing = 'border-box';
            cell.style.backgroundColor = '#ffffff';
          });
        });
      }
    }
    const rect = importedElement.querySelector('rect.svg-table-overlay, rect.svg-image-stroke-overlay, rect');
    if (rect) {
      rect.setAttribute('width', targetW.toString());
      rect.setAttribute('height', targetH.toString());
    }
  }

  if (isMap && elW <= 180) {
    let targetW, targetH;
    if (pw > ph) {
      targetW = Math.round(pw * 0.65);
      targetH = Math.round(targetW * (190 / 240));
      if (targetH > ph * 0.82) {
        targetH = Math.round(ph * 0.80);
        targetW = Math.round(targetH * (240 / 190));
      }
    } else {
      targetW = Math.round(pw * 0.82);
      targetH = Math.round(targetW * (190 / 240));
      if (targetH > ph * 0.60) {
        targetH = Math.round(ph * 0.58);
        targetW = Math.round(targetH * (240 / 190));
      }
    }
    targetW = Math.min(targetW, pw - (pw > 400 ? 40 : 10));
    targetH = Math.min(targetH, ph - (ph > 400 ? 40 : 10));

    elW = targetW;
    elH = targetH;

    const fo = importedElement.querySelector('foreignObject');
    if (fo) {
      fo.setAttribute('width', targetW.toString());
      fo.setAttribute('height', targetH.toString());
    }
    const rect = importedElement.querySelector('rect');
    if (rect) {
      rect.setAttribute('width', targetW.toString());
      rect.setAttribute('height', targetH.toString());
    }
    const iframe = importedElement.querySelector('iframe');
    if (iframe) {
      iframe.setAttribute('width', targetW.toString());
      iframe.setAttribute('height', targetH.toString());
      iframe.setAttribute('data-original-width', targetW.toString());
      iframe.setAttribute('data-original-height', targetH.toString());
      iframe.style.setProperty('width', targetW + 'px', 'important');
      iframe.style.setProperty('height', targetH + 'px', 'important');
      iframe.style.setProperty('transform-origin', '0 0', 'important');
      iframe.style.setProperty('transform', 'scale(1, 1)', 'important');
      iframe.style.setProperty('border', 'none', 'important');
      iframe.style.setProperty('display', 'block', 'important');
      iframe.style.setProperty('pointer-events', 'none', 'important');
    }
  }

  // If kinetic typography element, adapt to page canvas size
  const isKinetic = importedElement.getAttribute('data-typography-type') === 'kinetic' ||
                    (importedElement.getAttribute('data-type') === 'text' && (importedElement.id?.startsWith('typography-') || !!importedElement.querySelector('.kinetic-container')));

  if (isKinetic) {
    const fo = importedElement.querySelector('foreignObject');
    if (fo) {
      const maxAllowedW = Math.round(pw * 0.9);
      if (elW > maxAllowedW) {
        elW = maxAllowedW;
        fo.setAttribute('width', elW.toString());
      }
    }
  }

  if (dropPoint) {
    if (isTable) {
      const marginX = pw <= 400 ? (pw > 150 ? 15 : 8) : 20;
      const marginY = ph <= 400 ? (ph > 150 ? 15 : 8) : 20;
      const minX = marginX;
      const maxX = Math.max(minX, pw - elW - marginX);
      const minY = marginY;
      const maxY = Math.max(minY, ph - elH - marginY);

      const posX = Math.round(Math.max(minX, Math.min(maxX, dropPoint.x - (elW / 2))));
      const posY = Math.round(Math.max(minY, Math.min(maxY, dropPoint.y - (elH / 2))));
      importedElement.setAttribute('transform', `translate(${posX}, ${posY})`);
    } else {
      const minX = 5;
      const maxX = Math.max(minX, pw - elW - 5);
      const minY = 5;
      const maxY = Math.max(minY, ph - elH - 5);
      const posX = Math.round(Math.max(minX, Math.min(maxX, dropPoint.x - (elW / 2))));
      const posY = Math.round(Math.max(minY, Math.min(maxY, dropPoint.y - (elH / 2))));
      importedElement.setAttribute('transform', `translate(${posX}, ${posY})`);
    }
  } else if (isTable || isKinetic || !importedElement.getAttribute('transform') || (isMap && importedElement.getAttribute('transform')?.includes('15'))) {
    const minX = 10;
    const minY = 10;
    const cx = Math.round(Math.max(minX, Math.min(pw - elW - minX, (pw - elW) / 2)));
    const cy = Math.round(Math.max(minY, Math.min(ph - elH - minY, (ph - elH) / 2)));
    importedElement.setAttribute('transform', `translate(${cx}, ${cy})`);
  }

  const targetContainer = svg.querySelector('[data-type="frame"]') || svg.querySelector('[data-name="Overlay"]') || svg;
  targetContainer.appendChild(importedElement);

  updatePageHtml(targetPageIndex, svg.outerHTML);

  // Auto-select the newly added element
  const newId = importedElement.getAttribute('id');
  if (newId) {
    if (typeof setSingleSelection === 'function') {
      setSingleSelection(newId);
    } else {
      if (setSelectedLayerId) setSelectedLayerId(newId);
      if (selectedLayerIdRef) selectedLayerIdRef.current = newId;
      if (setMultiSelectedIds) setMultiSelectedIds(new Set([newId]));
      if (multiSelectedIdsRef) multiSelectedIdsRef.current = new Set([newId]);
    }
    if (typeof setActiveMainTool === 'function') setActiveMainTool('select');

    if (typeof drawOverlayHighlight === 'function') {
      setTimeout(() => {
        const el = document.getElementById(newId);
        if (el) drawOverlayHighlight(el, 'selected');
      }, 50);
    }
  }
  return newId;
};

/**
 * Inserts and positions an icon or shape (from Shapes, Tables, Audio, Embeds, etc.) into the page canvas.
 */
export const handleAddIconToSvg = ({
  icon,
  pageIndex,
  dropPoint,
  isShape,
  pages,
  activePageIndex,
  updatePageHtml,
  setSelectedLayerId,
  selectedLayerIdRef,
  setMultiSelectedIds,
  multiSelectedIdsRef,
  setSingleSelection,
  setActiveMainTool,
  drawOverlayHighlight
}) => {
  const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;
  const page = pages?.[targetPageIndex];
  if (!page) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(page.html || '', 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return null;

  let svgW = 793;
  let svgH = 1121;
  const viewBox = svg.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.split(/[ ,]+/).map(parseFloat);
    if (parts.length === 4) {
      svgW = parts[2];
      svgH = parts[3];
    }
  } else {
    const wAttr = parseFloat(svg.getAttribute('width'));
    const hAttr = parseFloat(svg.getAttribute('height'));
    if (!isNaN(wAttr) && wAttr > 0) svgW = wAttr;
    if (!isNaN(hAttr) && hAttr > 0) svgH = hAttr;
  }
  const centerX = dropPoint ? dropPoint.x : (svgW / 2);
  const centerY = dropPoint ? dropPoint.y : (svgH / 2);

  const newId = isShape ? `shape-${Date.now()}` : `icon-${Date.now()}`;

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.id = newId;
  g.setAttribute('data-type', isShape ? 'shape' : 'icon');
  if (isShape) {
    g.setAttribute('data-shape-type', 'shape');
  }
  g.setAttribute('transform', `translate(${centerX - 6}, ${centerY - 6}) scale(0.5)`);
  g.setAttribute('fill', icon?.fill !== undefined ? icon.fill : 'none');
  g.setAttribute('stroke', icon?.stroke !== undefined ? icon.stroke : '#000000');
  g.setAttribute('stroke-width', icon?.strokeWidth !== undefined ? icon.strokeWidth : '1');

  if (icon?.html) {
    g.innerHTML = icon.html;
  } else if (icon?.d) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', icon.d);
    g.appendChild(path);
  }

  if (icon?.html) {
    const rects = g.querySelectorAll('rect');
    rects.forEach(rect => {
      if (!rect.hasAttribute('fill')) {
        rect.setAttribute('fill', 'none');
      }
    });
  }

  const targetContainer = svg.querySelector('[data-type="frame"]') || svg.querySelector('[data-name="Overlay"]') || svg;
  targetContainer.appendChild(g);

  updatePageHtml(targetPageIndex, svg.outerHTML);

  if (typeof setSingleSelection === 'function') {
    setSingleSelection(newId);
  } else {
    if (setSelectedLayerId) setSelectedLayerId(newId);
    if (selectedLayerIdRef) selectedLayerIdRef.current = newId;
    if (setMultiSelectedIds) setMultiSelectedIds(new Set([newId]));
    if (multiSelectedIdsRef) multiSelectedIdsRef.current = new Set([newId]);
  }
  if (typeof setActiveMainTool === 'function') setActiveMainTool('select');

  if (typeof drawOverlayHighlight === 'function') {
    setTimeout(() => {
      const el = document.getElementById(newId);
      if (el) drawOverlayHighlight(el, 'selected');
    }, 50);
  }
  return newId;
};

/**
 * Fills an Element Shape with an SVG Pattern image when dropped or assigned.
 */
export const fillElementShapeWithPattern = ({
  shapeEl,
  svg,
  targetShapeId,
  dataUrl,
  mediaUrl,
  imgWidth,
  imgHeight,
  pageIdx,
  updatePageHtml,
  saveModifiedPageHtml,
  setSingleSelection,
  setSelectedLayerId,
  setActiveMainTool,
  drawOverlayHighlight
}) => {
  const urlToUse = dataUrl || mediaUrl;
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }

  const patternId = `pattern-${targetShapeId}`;
  let pattern = defs.querySelector(`pattern[id="${patternId}"]`);
  if (!pattern) {
    pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', patternId);
    pattern.setAttribute('patternContentUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', '1');
    pattern.setAttribute('height', '1');
    defs.appendChild(pattern);
  }

  let imageNode = pattern.querySelector('image, img');
  if (!imageNode) {
    imageNode = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    pattern.appendChild(imageNode);
  }

  let bbox = { width: 100, height: 100, x: 0, y: 0 };
  try { bbox = shapeEl.getBBox(); } catch (e) { }
  if (bbox.width === 0 || bbox.height === 0) bbox = { width: 100, height: 100, x: 0, y: 0 };

  const imgW = imgWidth || 100;
  const imgH = imgHeight || 100;

  const scale = Math.max(bbox.width / imgW, bbox.height / imgH);
  const finalW = imgW * scale;
  const finalH = imgH * scale;

  const tx_user = (bbox.width - finalW) / 2;
  const ty_user = (bbox.height - finalH) / 2;

  imageNode.setAttribute('width', imgW);
  imageNode.setAttribute('height', imgH);
  imageNode.removeAttribute('preserveAspectRatio');

  const existingTf = imageNode.getAttribute('transform') || '';
  let rotateStr = '';
  const rMatch = existingTf.match(/rotate\([^)]+\)/);
  if (rMatch) rotateStr = rMatch[0] + ' ';

  imageNode.setAttribute('transform', `${rotateStr}matrix(${scale} 0 0 ${scale} ${bbox.x + tx_user} ${bbox.y + ty_user})`);
  imageNode.setAttribute('href', urlToUse);
  imageNode.setAttribute('xlink:href', urlToUse);

  shapeEl.setAttribute('fill', `url(#${patternId})`);
  shapeEl.setAttribute('data-pattern-id', patternId);

  // Cleanup old clipPath logic if it existed
  const safeShapeId = targetShapeId.replace(/[^a-zA-Z0-9-_]/g, '_');
  const oldClip = defs.querySelector(`clipPath[id="clip-shape-${safeShapeId}"]`);
  if (oldClip) oldClip.remove();
  const oldImg = svg.querySelector(`image[id="masked-img-${safeShapeId}"]`);
  if (oldImg) oldImg.remove();

  if (typeof saveModifiedPageHtml === 'function') {
    saveModifiedPageHtml(pageIdx, svg);
  } else if (typeof updatePageHtml === 'function') {
    updatePageHtml(pageIdx, svg.outerHTML);
  }

  if (typeof setSingleSelection === 'function') {
    setSingleSelection(targetShapeId);
  } else if (typeof setSelectedLayerId === 'function') {
    setSelectedLayerId(targetShapeId);
  }
  if (typeof setActiveMainTool === 'function') setActiveMainTool('select');
  if (typeof drawOverlayHighlight === 'function') {
    setTimeout(() => {
      const el = document.getElementById(targetShapeId);
      if (el) drawOverlayHighlight(el, 'selected');
    }, 50);
  }
};

/**
 * Handles element data transfer decoding and dispatches the corresponding custom event.
 */
export const handleElementsDropData = (data, displayIndex, dropPoint) => {
  if (!data) return false;
  if (['button', 'text', 'slideshow', 'image-frame', 'map', 'qrcode', 'decorator', 'table'].includes(data.type)) {
    console.log(`${data.type} Dropped:`, data);
    window.dispatchEvent(new CustomEvent('add-element-to-editor', {
      detail: {
        pageIndex: displayIndex,
        svgContent: data.svgContent,
        dropPoint
      }
    }));
    return true;
  }
  if (data.type === 'icon' || data.type === 'shape') {
    window.dispatchEvent(new CustomEvent('add-icon-to-editor', {
      detail: {
        pageIndex: displayIndex,
        icon: data.icon,
        dropPoint,
        isShape: data.type === 'shape'
      }
    }));
    return true;
  }
  return false;
};

/**
 * Identifies if an element is an Element Shape.
 */
export const isElementShape = (el) => {
  if (!el || typeof el.getAttribute !== 'function') return false;
  return el.getAttribute('data-is-element-shape') === 'true' || (el.closest && !!el.closest('[data-is-element-shape="true"]'));
};

/**
 * Identifies if an element is an interactive Button.
 */
export const isInteractiveButton = (el) => {
  if (!el || typeof el.getAttribute !== 'function') return false;
  const isBtn = el.getAttribute('data-type') === 'button' || el.getAttribute('data-type') === 'hotspot';
  return isBtn && el.querySelector && el.querySelector('rect') !== null && (el.querySelector('text') !== null || el.querySelector('[data-type="text"]') !== null);
};

/**
 * Identifies if an element is a Slideshow component group.
 */
export const isSlideshowGroup = (el) => {
  if (!el || typeof el.getAttribute !== 'function') return false;
  return el.getAttribute('data-type') === 'slideshow' ||
    el.getAttribute('data-is-slideshow') === 'true' ||
    (typeof el.id === 'string' && el.id.startsWith('slideshow-'));
};

/**
 * Returns the exact bounding box for Slideshow groups.
 */
export const getSlideshowBBox = (el) => {
  if (!isSlideshowGroup(el)) return null;
  const isFlat = el.getAttribute?.('data-style') === 'flat';
  const anchor = el.querySelector?.('.bbox-anchor');
  if (anchor) {
    const ax = parseFloat(anchor.getAttribute('x') || '0');
    const ay = parseFloat(anchor.getAttribute('y') || '0');
    let aw = parseFloat(anchor.getAttribute('width') || '0');
    const ah = parseFloat(anchor.getAttribute('height') || '0');
    if (aw > 0 && ah > 0) {
      return { x: ax, y: ay, width: aw, height: ah };
    }
  }
  const pad = 5;
  return { x: -pad, y: -pad, width: (isFlat ? 210 : 210) + pad * 2, height: (isFlat ? 190 : 140) + pad * 2 };
};

/**
 * Identifies if an element is an Audio element.
 */
export const isAudioGroup = (el) => {
  if (!el || typeof el.getAttribute !== 'function') return false;
  const dt = el.getAttribute('data-type');
  return dt === 'audio-frame' || dt === 'audio';
};

/**
 * Resolves compound Elements (Buttons, Slideshows, Embed frames, Image frames, Audio frames)
 * so clicking inside them drags or selects the compound parent unit.
 */
export const getElementCompoundTarget = (current) => {
  if (!current) return null;

  // Tables are single compound elements; clicking or typing inside them keeps the table element selected!
  let tableGroup = null;
  if (typeof current.closest === 'function') {
    tableGroup = current.closest('[data-type="table-frame"], [data-type="table"], [id^="table-"], g[id*="table"]');
  }
  if (!tableGroup) {
    let node = current;
    while (node && node.nodeType === 1 && node !== document.body) {
      const tag = node.tagName?.toLowerCase();
      const dt = node.getAttribute ? node.getAttribute('data-type') : null;
      const nid = node.id || '';
      if (dt === 'table-frame' || dt === 'table' || nid.startsWith('table-') || (tag === 'g' && nid.includes('table'))) {
        tableGroup = node;
        break;
      }
      node = node.parentElement || node.parentNode;
    }
  }
  if (tableGroup) {
    if (!tableGroup.id) {
      tableGroup.id = `table-${Date.now()}`;
    }
    return tableGroup;
  }

  if (typeof current.closest !== 'function') return null;

  // Slideshows are single compound elements; drag the whole slideshow!
  const slideshowGroup = current.closest('[data-type="slideshow"], [data-is-slideshow="true"], [id^="slideshow-"]');
  if (slideshowGroup) {
    if (!slideshowGroup.id) {
      slideshowGroup.id = `slideshow-${Date.now()}`;
    }
    return slideshowGroup;
  }

  // Buttons are single compound elements; drag the whole button!
  const buttonGroup = current.closest('[data-type="button"]');
  if (buttonGroup) {
    if (!buttonGroup.id) {
      buttonGroup.id = `button-${Date.now()}`;
    }
    return buttonGroup;
  }

  // Animated Decorators (Starbursts) are compound elements; drag the whole decorator!
  const decoratorGroup = current.closest('[data-type="decorator"], [id^="decorator-"]');
  if (decoratorGroup) {
    if (!decoratorGroup.id) {
      decoratorGroup.id = `decorator-${Date.now()}`;
    }
    return decoratorGroup;
  }

  // Maps are compound elements; drag/select the whole map!
  const mapGroup = current.closest('[data-type="map"], [id^="map-"]');
  if (mapGroup) {
    if (!mapGroup.id) {
      mapGroup.id = `map-${Date.now()}`;
    }
    return mapGroup;
  }

  // Embed frames are single compound elements; drag the whole wrapper!
  const embedFrame = current.closest('[data-type="embed-frame"]');
  if (embedFrame) {
    const parentG = embedFrame.parentElement;
    if (parentG && parentG.tagName?.toLowerCase() === 'g' && parentG.id) {
      return parentG;
    }
    if (!embedFrame.id) {
      embedFrame.id = `embed-frame-${Date.now()}`;
    }
    return embedFrame;
  }

  // Image frames are single compound elements; drag the whole wrapper!
  const imageFrame = current.closest('[data-type="image-frame"]');
  if (imageFrame && current.tagName?.toLowerCase() !== 'image' && current.tagName?.toLowerCase() !== 'img') {
    if (!imageFrame.id) {
      imageFrame.id = `image-frame-${Date.now()}`;
    }
    return imageFrame;
  }

  // Audio frames are single compound elements; drag the whole wrapper!
  const audioFrame = current.closest('[data-type="audio-frame"]');
  if (audioFrame) {
    const parentG = audioFrame.parentElement;
    if (parentG && parentG.tagName?.toLowerCase() === 'g' && parentG.id) {
      return parentG;
    }
    if (!audioFrame.id) {
      audioFrame.id = `audio-frame-${Date.now()}`;
    }
    return audioFrame;
  }

  return null;
};

/**
 * Detects whether a drop target is an Element Shape or Image Frame slot,
 * and extracts the target id for pattern or media replacement.
 */
export const getTargetElementShapeOrFrameId = (target) => {
  if (!target || typeof target.closest !== 'function') return undefined;

  const shapeLeaf = target.closest('[data-is-element-shape="true"]');
  const frameLeaf = target.closest('[data-type="image-frame"]');

  if (shapeLeaf) {
    const shapeGroup = shapeLeaf.closest('[data-type="shape"]');
    if (shapeGroup && shapeGroup.id) {
      return shapeGroup.id;
    } else if (shapeLeaf.id && !shapeLeaf.id.includes('mask') && !shapeLeaf.id.includes('clip')) {
      return shapeLeaf.id;
    }
  } else if (frameLeaf && frameLeaf.id) {
    let specificSlot = null;
    const highlight = frameLeaf.querySelector('[data-highlight-id]');
    if (highlight) {
      const patternId = highlight.getAttribute('data-highlight-id').replace('highlight-', '');
      specificSlot = frameLeaf.querySelector(`[data-pattern-id="${patternId}"]`);
    }

    if (!specificSlot && target && ['path', 'rect', 'circle', 'ellipse', 'polygon'].includes(target.tagName.toLowerCase())) {
      specificSlot = target;
    }

    if (specificSlot) {
      if (!specificSlot.id) specificSlot.id = `inner-slot-${Date.now()}`;
      return specificSlot.id;
    } else {
      return frameLeaf.id;
    }
  }

  return undefined;
};

/**
 * Handles proportional resizing and alignment of interactive Buttons
 * including text size, icon offset, hover slide rects, ribbon polygons, and clipPaths.
 */
export const resizeInteractiveButton = ({
  el,
  state
}) => {
  if (!el || !state?.childrenData) return;
  const rectData = state.childrenData.find(c => c.child.tagName.toLowerCase() === 'rect');
  const textData = state.childrenData.find(c => c.child.tagName.toLowerCase() === 'text' || c.child.getAttribute('data-type') === 'text');

  if (!rectData || !textData) return;

  const rectEl = rectData.child;
  const textEl = textData.child;

  const rectX = parseFloat(rectEl.getAttribute('x')) || 0;
  const rectY = parseFloat(rectEl.getAttribute('y')) || 0;
  const rectW = parseFloat(rectEl.getAttribute('width')) || 0;
  const rectH = parseFloat(rectEl.getAttribute('height')) || 0;

  const initRectW = rectData.initialRect?.width || rectData.bound?.width || 80;
  const initRectH = rectData.initialRect?.height || rectData.bound?.height || 32;

  // Scale factor based on button height change (proportional scaling)
  const scaleRatio = initRectH > 0 ? (rectH / initRectH) : 1;

  // Update rect border radius rx proportionally
  const baseRx = rectData.initialRect?.rx ?? parseFloat(rectEl.getAttribute('data-base-rx') || rectEl.getAttribute('rx') || '4');
  const newRx = Math.max(0, Math.min(rectW / 2, rectH / 2, Math.round(baseRx * scaleRatio * 10) / 10));
  rectEl.setAttribute('rx', newRx);

  // Update text font-size proportionally with button scale
  const baseFontSize = textData.initialFontSize || parseFloat(textEl.getAttribute('data-base-font-size') || textEl.getAttribute('font-size') || '14');
  let newFontSize = Math.max(6, Math.round(baseFontSize * scaleRatio * 10) / 10);

  // Check if button has an icon (only hotspots have icons in interactive buttons)
  const isHotspotBtn = el.getAttribute('data-is-hotspot') === 'true';
  const iconImg = isHotspotBtn ? el.querySelector('image') : null;
  const iconG = isHotspotBtn ? el.querySelector('g:not(defs g):not(.button-hover-slide-group)') : null;
  const iconPath = isHotspotBtn ? el.querySelector('path') : null;
  const hasIcon = isHotspotBtn && !!(iconImg || iconG || iconPath);

  const label = textEl.textContent || '';
  // Prevent font size from overflowing button width if narrowed
  if (label.length > 0 && rectW > 0) {
    const availableWidth = Math.max(8, rectW - (hasIcon ? 18 * scaleRatio : 12));
    const maxFontForWidth = availableWidth / (label.length * 0.55);
    if (maxFontForWidth > 0 && newFontSize > maxFontForWidth) {
      newFontSize = Math.max(5, Math.round(maxFontForWidth * 10) / 10);
    }
  }

  textEl.setAttribute('font-size', newFontSize);
  textEl.style.fontSize = `${newFontSize}px`;
  textEl.removeAttribute('transform');
  textEl.querySelectorAll('tspan').forEach(ts => {
    ts.removeAttribute('x');
    ts.removeAttribute('y');
    ts.removeAttribute('font-size');
    ts.style.removeProperty('font-size');
  });

  if (hasIcon) {
    const iconSize = Math.max(6, Math.round(14 * scaleRatio));
    const gap = Math.max(2, Math.round(5 * scaleRatio));

    let textWidth = 0;
    try {
      textWidth = textEl.getBBox().width;
    } catch (e) { }
    if (!textWidth || textWidth <= 0) {
      textWidth = label.length * (newFontSize * 0.55);
    }

    let isEndPlacement = false;
    if (iconImg) {
      const imgX = parseFloat(iconImg.getAttribute('x') || '0');
      const tX = parseFloat(textEl.getAttribute('x') || '0');
      if (imgX > tX) isEndPlacement = true;
    } else if (iconG) {
      const gT = iconG.getAttribute('transform') || '';
      const m = gT.match(/translate\(([-\d.]+)/);
      if (m && parseFloat(m[1]) > (initRectW / 2)) isEndPlacement = true;
    }

    const contentWidth = iconSize + gap + textWidth;
    const startX = rectX + (rectW - contentWidth) / 2;

    let iconX, textX;
    if (isEndPlacement) {
      textX = startX + textWidth / 2;
      iconX = startX + textWidth + gap;
    } else {
      iconX = startX;
      textX = startX + iconSize + gap + textWidth / 2;
    }

    if (iconImg) {
      iconImg.setAttribute('x', iconX);
      iconImg.setAttribute('y', rectY + (rectH - iconSize) / 2);
      iconImg.setAttribute('width', iconSize);
      iconImg.setAttribute('height', iconSize);
      iconImg.removeAttribute('transform');
    } else if (iconG) {
      iconG.setAttribute('transform', `translate(${iconX - 20 * scaleRatio}, ${rectY + (rectH - 32 * scaleRatio) / 2}) scale(${scaleRatio})`);
    }

    textEl.setAttribute('x', textX);
    textEl.setAttribute('y', rectY + rectH / 2);
    textEl.setAttribute('dominant-baseline', 'central');
    textEl.setAttribute('text-anchor', 'middle');
    textEl.style.textAnchor = 'middle';
    textEl.style.dominantBaseline = 'central';
  } else {
    // No icon: center text directly in rect
    textEl.setAttribute('x', rectX + rectW / 2);
    textEl.setAttribute('y', rectY + rectH / 2);
    textEl.setAttribute('dominant-baseline', 'middle');
    textEl.setAttribute('text-anchor', 'middle');
    textEl.style.textAnchor = 'middle';
    textEl.style.dominantBaseline = 'middle';
  }

  // Synchronize slide group, slide rect, border rect, clip path, and ribbon polygons
  const slideGroup = el.querySelector('.button-hover-slide-group');
  if (slideGroup) {
    slideGroup.removeAttribute('transform');
  }
  const slideRect = el.querySelector('.button-hover-slide-rect');
  if (slideRect) {
    slideRect.setAttribute('x', rectX);
    slideRect.setAttribute('y', rectY);
    slideRect.setAttribute('width', rectW);
    slideRect.setAttribute('height', rectH);
  }
  const borderRect = el.querySelector('rect.btn-border');
  if (borderRect) {
    borderRect.setAttribute('x', rectX);
    borderRect.setAttribute('y', rectY);
    borderRect.setAttribute('width', rectW);
    borderRect.setAttribute('height', rectH);
    borderRect.setAttribute('rx', newRx);
  }
  const mainPoly = el.querySelector('.btn-main-poly');
  const accentLeft = el.querySelector('.btn-accent-left');
  const accentRight = el.querySelector('.btn-accent-right');
  if (mainPoly || accentLeft || accentRight) {
    const slantDx = Math.round(rectH * 0.22);
    if (mainPoly) {
      mainPoly.removeAttribute('transform');
      mainPoly.setAttribute('points', `${rectX},${rectY} ${rectX + rectW - slantDx},${rectY} ${rectX + rectW},${rectY + rectH} ${rectX + slantDx},${rectY + rectH}`);
    }
    if (accentLeft) {
      accentLeft.removeAttribute('transform');
      accentLeft.setAttribute('points', `${rectX},${rectY + rectH} ${rectX + slantDx},${rectY + rectH} ${rectX + slantDx / 2},${rectY + rectH / 2}`);
    }
    if (accentRight) {
      accentRight.removeAttribute('transform');
      accentRight.setAttribute('points', `${rectX + rectW - slantDx},${rectY} ${rectX + rectW},${rectY} ${rectX + rectW - slantDx / 2},${rectY + rectH / 2}`);
    }
  }
  const svgRoot = el.closest('svg');
  const clipId = `clip-${el.id}`;
  if (svgRoot) {
    const clipRect = svgRoot.querySelector(`#${clipId} rect`);
    if (clipRect) {
      clipRect.setAttribute('x', rectX);
      clipRect.setAttribute('y', rectY);
      clipRect.setAttribute('width', rectW);
      clipRect.setAttribute('height', rectH);
    }
    const clipPoly = svgRoot.querySelector(`#${clipId} polygon`);
    if (clipPoly) {
      const slantDx = Math.round(rectH * 0.22);
      clipPoly.setAttribute('points', `${rectX},${rectY} ${rectX + rectW},${rectY} ${rectX + rectW - slantDx / 2},${rectY + rectH / 2} ${rectX + rectW},${rectY + rectH} ${rectX},${rectY + rectH} ${rectX + slantDx / 2},${rectY + rectH / 2}`);
    }
  }
};

/**
 * Handles outer transform scaling for Audio frames (audio-frame)
 * without distorting inner controls.
 */
export const resizeAudioGroup = ({
  el,
  state,
  matrix,
  finalX,
  finalY,
  finalWidth,
  finalHeight,
  drawOverlayHighlight,
  currentFrameIdRef
}) => {
  try {
    const ptOrigin = new DOMPoint(finalX, finalY).matrixTransform(matrix);
    const ptCorner = new DOMPoint(finalX + finalWidth, finalY + finalHeight).matrixTransform(matrix);
    const newTx = Math.min(ptOrigin.x, ptCorner.x);
    const newTy = Math.min(ptOrigin.y, ptCorner.y);
    const newW = Math.abs(ptCorner.x - ptOrigin.x);
    const newH = Math.abs(ptCorner.y - ptOrigin.y);
    const innerWidth = (state.bbox && state.bbox.width > 0) ? state.bbox.width : 48;
    const innerHeight = (state.bbox && state.bbox.height > 0) ? state.bbox.height : 48;
    const newSx = newW / innerWidth;
    const newSy = newH / innerHeight;
    el.setAttribute('transform', `translate(${newTx}, ${newTy}) scale(${newSx}, ${newSy})`);
  } catch (e) { }

  if (typeof drawOverlayHighlight === 'function') {
    const highlightType = (currentFrameIdRef?.current && el.id !== currentFrameIdRef.current) ? 'child-selected' : 'selected';
    drawOverlayHighlight(el, highlightType);
  }
};

/**
 * Handles proportional outer transform scaling for Slideshow component groups
 * so that all internal frames, 3D perspective transforms, and patterns scale cleanly.
 */
export const resizeSlideshowGroup = ({
  el,
  worldAnchor,
  scaleX,
  scaleY,
  matrix,
  matrixToTransform,
  drawOverlayHighlight,
  currentFrameIdRef
}) => {
  if (!el) return;
  try {
    const scaleMatrix = new DOMMatrix()
      .translate(worldAnchor.x, worldAnchor.y)
      .scale(scaleX, scaleY)
      .translate(-worldAnchor.x, -worldAnchor.y);
    const nextMatrix = scaleMatrix.multiply(matrix);
    const transformStr = typeof matrixToTransform === 'function'
      ? matrixToTransform(nextMatrix)
      : `matrix(${nextMatrix.a} ${nextMatrix.b} ${nextMatrix.c} ${nextMatrix.d} ${nextMatrix.e} ${nextMatrix.f})`;
    el.setAttribute('transform', transformStr);
  } catch (e) {
    console.error('resizeSlideshowGroup error:', e);
  }

  if (typeof drawOverlayHighlight === 'function') {
    const highlightType = (currentFrameIdRef?.current && el.id !== currentFrameIdRef.current) ? 'child-selected' : 'selected';
    drawOverlayHighlight(el, highlightType);
  }
};

/**
 * Helper to update a 3-frame Coverflow / Flat gallery SVG element
 */
export const update3FrameSlideshow = (el, images = [], activeIdx = 0, settings = {}) => {
  if (!el) return;
  const uniqueId = el.id.replace('slideshow-', '') || Date.now();
  let defs = el.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    el.insertBefore(defs, el.firstChild);
  }

  const len = images.length;
  let leftIndex = -1, centerIndex = -1, rightIndex = -1;
  if (len > 0) {
    centerIndex = activeIdx % len;
    if (len >= 2) rightIndex = (activeIdx + 1) % len;
    if (len >= 3) leftIndex = (activeIdx - 1 + len) % len;
  }

  const rects = el.querySelectorAll('rect:not([fill="transparent"]):not(.bbox-anchor):not(.slideshow-container-bg)');
  const leftRect = rects[0];
  const rightRect = rects[1];
  const centerRect = rects[2];

  const slideStyle = el.getAttribute('data-style');
  if (slideStyle === 'flat') {
    if (centerRect) {
      centerRect.setAttribute('x', '50');
      centerRect.setAttribute('y', '0');
      centerRect.setAttribute('width', '110');
      centerRect.setAttribute('height', '140');
      centerRect.setAttribute('style', 'transition: all 0.3s ease; box-shadow: 0 0 10px rgba(0,0,0,0.5);');
    }
    if (leftRect) {
      leftRect.setAttribute('x', '0');
      leftRect.setAttribute('y', '0');
      leftRect.setAttribute('width', '46');
      leftRect.setAttribute('height', '140');
      leftRect.setAttribute('style', 'opacity: 0.5; transition: all 0.3s ease;');
    }
    if (rightRect) {
      rightRect.setAttribute('x', '164');
      rightRect.setAttribute('y', '0');
      rightRect.setAttribute('width', '46');
      rightRect.setAttribute('height', '140');
      rightRect.setAttribute('style', 'opacity: 0.5; transition: all 0.3s ease;');
    }
  } else {
    // 3D Coverflow
    if (centerRect) {
      centerRect.setAttribute('x', '40');
      centerRect.setAttribute('y', '0');
      centerRect.setAttribute('width', '130');
      centerRect.setAttribute('height', '140');
      centerRect.setAttribute('style', 'transform: perspective(400px) rotateY(0deg); transform-origin: 50% 50%; transform-box: fill-box; transition: all 0.3s ease;');
    }
    if (leftRect) {
      leftRect.setAttribute('x', '0');
      leftRect.setAttribute('y', '8');
      leftRect.setAttribute('width', '80');
      leftRect.setAttribute('height', '124');
      leftRect.setAttribute('style', 'transform: perspective(400px) rotateY(25deg); transform-origin: 100% 50%; transform-box: fill-box; transition: all 0.3s ease;');
    }
    if (rightRect) {
      rightRect.setAttribute('x', '120');
      rightRect.setAttribute('y', '8');
      rightRect.setAttribute('width', '110');
      rightRect.setAttribute('height', '124');
      rightRect.setAttribute('style', 'transform: perspective(400px) rotateY(-22deg); transform-origin: 0% 50%; transform-box: fill-box; transition: all 0.3s ease;');
    }
  }

  let bboxAnchor = el.querySelector('.bbox-anchor');
  if (!bboxAnchor) {
    bboxAnchor = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bboxAnchor.setAttribute('class', 'bbox-anchor');
    bboxAnchor.setAttribute('fill', 'transparent');
    el.appendChild(bboxAnchor);
  }
  const pad = 5;
  const baseW = slideStyle === 'flat' ? 210 : 210;
  const baseH = slideStyle === 'flat' ? 190 : 140;

  bboxAnchor.setAttribute('x', (-pad).toString());
  bboxAnchor.setAttribute('y', (-pad).toString());
  bboxAnchor.setAttribute('width', (baseW + pad * 2).toString());
  bboxAnchor.setAttribute('height', (baseH + pad * 2).toString());

  // Apply Container Background behind all frames and controls
  let containerBg = el.querySelector('.slideshow-container-bg');
  if (!containerBg) {
    containerBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    containerBg.setAttribute('class', 'slideshow-container-bg');
    if (defs && defs.nextSibling) {
      el.insertBefore(containerBg, defs.nextSibling);
    } else {
      el.insertBefore(containerBg, el.firstChild);
    }
  } else {
    if (defs && defs.nextSibling && defs.nextSibling !== containerBg) {
      el.insertBefore(containerBg, defs.nextSibling);
    }
  }

  const sColor = settings.strokeColor || '#9ca3af';
  const sWidth = settings.strokeWidth !== undefined ? settings.strokeWidth : 1;
  const sOpacity = (settings.strokeOpacity !== undefined ? settings.strokeOpacity : 100) / 100;
  let sDash = 'none';
  if (settings.strokeLineStyle === 'Dotted') {
    sDash = '2,3';
  } else if (settings.strokeLineStyle === 'Dashed') {
    sDash = `${settings.strokeDashLength || 8},${settings.strokeDashGap || 4}`;
  }
  const sCap = settings.strokeLineCorner === 'Rounded' ? 'round' : 'square';
  const sJoin = settings.strokeLineCorner === 'Rounded' ? 'round' : 'miter';
  const sAlign = settings.strokeAlignment || 'Center';
  let alignOffset = 0;
  if (sAlign === 'Inside') alignOffset = sWidth / 2;
  else if (sAlign === 'Outside') alignOffset = -sWidth / 2;

  containerBg.setAttribute('x', (-pad + alignOffset).toString());
  containerBg.setAttribute('y', (-pad + alignOffset).toString());
  containerBg.setAttribute('width', (baseW + pad * 2 - alignOffset * 2).toString());
  containerBg.setAttribute('height', (baseH + pad * 2 - alignOffset * 2).toString());

  const bgCornerRadius = settings.strokeLineCorner === 'Square' ? 0 : 12;
  containerBg.setAttribute('rx', bgCornerRadius.toString());
  containerBg.setAttribute('ry', bgCornerRadius.toString());

  const bgColor = settings.bgColor || '#000000';
  const bgOpacity = (settings.bgOpacity !== undefined ? settings.bgOpacity : 100) / 100;

  if (bgColor === 'transparent' || bgColor === 'none' || bgOpacity === 0) {
    containerBg.setAttribute('fill', 'none');
    containerBg.setAttribute('fill-opacity', '0');
    containerBg.style.fill = 'none';
    containerBg.style.fillOpacity = '0';
  } else {
    containerBg.setAttribute('fill', bgColor);
    containerBg.setAttribute('fill-opacity', bgOpacity.toString());
    containerBg.style.fill = bgColor;
    containerBg.style.fillOpacity = bgOpacity.toString();
  }

  // Stroke / styling on container frame and cards
  [containerBg, centerRect, leftRect, rightRect].forEach(r => {
    if (r) {
      if (sColor === 'transparent' || sColor === 'none' || sWidth === 0 || sOpacity === 0) {
        r.setAttribute('stroke', 'none');
        r.setAttribute('stroke-width', '0');
      } else {
        r.setAttribute('stroke', sColor);
        r.setAttribute('stroke-width', sWidth.toString());
        r.setAttribute('stroke-opacity', sOpacity.toString());
        if (sDash !== 'none') r.setAttribute('stroke-dasharray', sDash);
        else r.removeAttribute('stroke-dasharray');
        r.setAttribute('stroke-linecap', sCap);
        r.setAttribute('stroke-linejoin', sJoin);
      }
    }
  });

  const applyFrameImage = (rect, imgIdx, prefix) => {
    if (!rect) return;
    const imgObj = imgIdx >= 0 ? images[imgIdx] : null;
    const url = imgObj?.url || (typeof imgObj === 'string' ? imgObj : null);

    if (!url) {
      if (prefix === 'center' && len === 0) {
        rect.setAttribute('fill', `url(#slideshow-pattern-${uniqueId})`);
      } else {
        rect.setAttribute('fill', prefix === 'center' ? '#ffffff' : '#f3f4f6');
      }
      return;
    }

    const patternId = `slideshow-pattern-${prefix}-${uniqueId}`;
    let pattern = defs.querySelector(`#${patternId}`);
    if (!pattern) {
      pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.setAttribute('id', patternId);
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');
      const imgNode = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      imgNode.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      imgNode.setAttribute('x', '0');
      imgNode.setAttribute('y', '0');
      pattern.appendChild(imgNode);
      const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      textGroup.setAttribute('class', 'overlay-text-group');
      pattern.appendChild(textGroup);
      defs.appendChild(pattern);
    }

    const pWidth = rect.getAttribute('width') || '130';
    const pHeight = rect.getAttribute('height') || '140';
    pattern.setAttribute('width', pWidth);
    pattern.setAttribute('height', pHeight);
    pattern.setAttribute('viewBox', `0 0 ${pWidth} ${pHeight}`);

    const imgNode = pattern.querySelector('image');
    if (imgNode) {
      imgNode.setAttribute('href', url);
      try { imgNode.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch (e) {}
      imgNode.setAttribute('width', pWidth);
      imgNode.setAttribute('height', pHeight);
    }

    // Text overlay if present
    const textGroup = pattern.querySelector('.overlay-text-group');
    if (textGroup) {
      textGroup.innerHTML = '';
      if (prefix === 'center' && imgObj) {
        const fFam = imgObj.fontFamily || 'Arial';
        const fSize = imgObj.fontSize || 16;
        const pW = parseFloat(pWidth) || 130;
        const pH = parseFloat(pHeight) || 140;
        const centerX = pW / 2;
        const centerY = pH / 2;
        const hasHeading = Boolean(imgObj.heading);
        const hasSubtext = Boolean(imgObj.subtext);

        if (hasHeading) {
          const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          t.setAttribute('x', centerX.toString());
          t.setAttribute('y', (hasSubtext ? centerY - 10 : centerY).toString());
          t.setAttribute('text-anchor', 'middle');
          t.setAttribute('dominant-baseline', 'central');
          t.setAttribute('fill', 'white');
          t.setAttribute('font-size', `${fSize}px`);
          t.setAttribute('font-family', `'${fFam}', sans-serif`);
          t.setAttribute('font-weight', 'bold');
          t.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(0,0,0,0.8); pointer-events: none;');
          t.textContent = imgObj.heading;
          textGroup.appendChild(t);
        }
        if (hasSubtext) {
          const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          t.setAttribute('x', centerX.toString());
          t.setAttribute('y', (hasHeading ? centerY + 14 : centerY).toString());
          t.setAttribute('text-anchor', 'middle');
          t.setAttribute('dominant-baseline', 'central');
          t.setAttribute('fill', 'white');
          t.setAttribute('font-size', `${Math.max(8, fSize * 0.6)}px`);
          t.setAttribute('font-family', `'${fFam}', sans-serif`);
          t.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(0,0,0,0.8); pointer-events: none;');
          t.textContent = imgObj.subtext;
          textGroup.appendChild(t);
        }
      }
    }

    pattern.setAttribute('patternTransform', `translate(${rect.getAttribute('x') || 0}, ${rect.getAttribute('y') || 0})`);
    rect.setAttribute('fill', `url(#${patternId})`);
    rect.style.fill = `url(#${patternId})`;
  };

  applyFrameImage(leftRect, leftIndex, 'left');
  applyFrameImage(rightRect, rightIndex, 'right');
  applyFrameImage(centerRect, centerIndex, 'center');

  // Also point placeholder pattern to current center image so it NEVER renders "Slideshow" placeholder
  const placeholderPattern = defs.querySelector(`#slideshow-pattern-${uniqueId}`);
  if (placeholderPattern && centerIndex >= 0) {
    const phImg = placeholderPattern.querySelector('image');
    const centerUrl = images[centerIndex]?.url || (typeof images[centerIndex] === 'string' ? images[centerIndex] : null);
    if (phImg && centerUrl) {
      phImg.setAttribute('href', centerUrl);
      try { phImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', centerUrl); } catch (e) {}
    }
    const phText = placeholderPattern.querySelector('.overlay-text-group');
    if (phText) {
      phText.innerHTML = '';
    }
  }

  el.setAttribute('data-active-index', activeIdx.toString());
};

/**
 * Global Slideshow UI, Runner, and Click Manager hooks.
 * Completely orchestrates slideshow lifecycle on canvas.
 */
export const useSlideshowManager = ({ getVisualBBox } = {}) => {
  // 1. UI Manager: Maintains pagination dots and hover navigation arrows
  useEffect(() => {
    const renderOverlays = () => {
      const slideshows = document.querySelectorAll('[data-is-slideshow="true"]');
      slideshows.forEach(el => {
        if (el._slideshowManual) {
          const existing = el._globalSsOverlay;
          if (existing) {
            existing.remove();
            delete el._globalSsOverlay;
          }
          return;
        }

        const dataStr = el.getAttribute('data-slideshow');
        if (!dataStr) return;
        let data;
        try { data = JSON.parse(dataStr); } catch (e) { return; }

        const settings = data.settings || {};
        const images = data.images || [];
        if (images.length < 2) return;

        const activeIndex = parseInt(el.getAttribute('data-active-index') || '0');
        const pageContainer = el.closest('.page-svg-container');
        if (!pageContainer) return;

        let overlay = el._globalSsOverlay;
        if (!overlay || !pageContainer.contains(overlay)) {
          overlay = document.createElement('div');
          overlay.className = 'global-ss-overlay';
          Object.assign(overlay.style, {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: '9998',
          });
          pageContainer.style.position = 'relative';
          if (pageContainer.style.overflow !== 'visible') {
            pageContainer.style.overflow = 'visible';
          }
          pageContainer.appendChild(overlay);
          el._globalSsOverlay = overlay;

          let leaveTimeout = null;
          const handleEnter = () => {
            if (leaveTimeout) clearTimeout(leaveTimeout);
            overlay.querySelectorAll('.editor-ss-nav').forEach(btn => {
              btn.style.opacity = '1';
              btn.style.pointerEvents = 'auto';
            });
            el._isHovering = true;
          };
          const handleLeave = () => {
            leaveTimeout = setTimeout(() => {
              overlay.querySelectorAll('.editor-ss-nav').forEach(btn => {
                btn.style.opacity = '0';
                btn.style.pointerEvents = 'none';
              });
              el._isHovering = false;
            }, 50);
          };

          overlay.addEventListener('mouseenter', handleEnter);
          overlay.addEventListener('mouseleave', handleLeave);
          el.addEventListener('mouseenter', handleEnter);
          el.addEventListener('mouseleave', handleLeave);

          overlay._cleanupHover = () => {
            if (leaveTimeout) clearTimeout(leaveTimeout);
            overlay.removeEventListener('mouseenter', handleEnter);
            overlay.removeEventListener('mouseleave', handleLeave);
            el.removeEventListener('mouseenter', handleEnter);
            el.removeEventListener('mouseleave', handleLeave);
          };
        }

        const containerRect = pageContainer.getBoundingClientRect();
        let elRect;
        try {
          const bbox = typeof getVisualBBox === 'function' ? getVisualBBox(el) : el.getBBox();
          const ctm = el.getScreenCTM();
          const pt = el.ownerSVGElement.createSVGPoint();
          const corners = [
            { x: bbox.x, y: bbox.y },
            { x: bbox.x + bbox.width, y: bbox.y },
            { x: bbox.x, y: bbox.y + bbox.height },
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height }
          ];
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (let c of corners) {
            pt.x = c.x; pt.y = c.y;
            const mapped = pt.matrixTransform(ctm);
            if (mapped.x < minX) minX = mapped.x;
            if (mapped.y < minY) minY = mapped.y;
            if (mapped.x > maxX) maxX = mapped.x;
            if (mapped.y > maxY) maxY = mapped.y;
          }
          elRect = { left: minX, top: minY, right: maxX, bottom: maxY, width: maxX - minX, height: maxY - minY };
        } catch (e) {
          elRect = el.getBoundingClientRect();
        }

        const scaleX = containerRect.width / (pageContainer.offsetWidth || 1);
        const scaleY = containerRect.height / (pageContainer.offsetHeight || 1);
        const localLeft = (elRect.left - containerRect.left) / scaleX;
        const localTop = (elRect.top - containerRect.top) / scaleY;
        const localWidth = elRect.width / scaleX;
        const localHeight = elRect.height / scaleY;

        overlay.style.left = localLeft + 'px';
        overlay.style.top = localTop + 'px';
        overlay.style.width = localWidth + 'px';
        overlay.style.height = localHeight + 'px';

        const scaleFactor = Math.max(0.4, Math.min(1.8, localWidth / 300));
        const { dotColor = '#000000', navIconColor = '#000000', showDots = true, showArrows = true, showNav = true } = settings;

        const signature = JSON.stringify({
          imagesCount: images.length,
          scaleFactor: scaleFactor.toFixed(2),
          dotColor, navIconColor, showDots, showArrows, showNav
        });

        if (overlay.dataset.signature !== signature) {
          overlay.dataset.signature = signature;
          overlay.innerHTML = '';

          const showNavArrows = showArrows !== false && showNav !== false;
          if (showNavArrows) {
            const navScale = (settings.navButtonSize || 100) / 100;
            ['prev', 'next'].forEach(type => {
              const btn = document.createElement('button');
              btn.className = 'editor-ss-nav editor-ss-nav-' + type;
              const size = 48 * scaleFactor * navScale;
              const offset = 12 * scaleFactor;
              Object.assign(btn.style, {
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                [type === 'prev' ? 'left' : 'right']: offset + 'px',
                zIndex: '10',
                background: 'transparent',
                border: 'none',
                borderRadius: '50%',
                width: size + 'px',
                height: size + 'px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'none',
                padding: '0',
                pointerEvents: 'none',
                opacity: '0',
                transition: 'transform 0.15s, opacity 0.2s',
              });
              const svgSize = 32 * scaleFactor * navScale;

              const iconContainer = document.createElement('div');
              Object.assign(iconContainer.style, {
                width: svgSize + 'px',
                height: svgSize + 'px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              });
              btn.appendChild(iconContainer);

              const root = createRoot(iconContainer);
              const iconKey = type === 'prev' ? 'left' : 'right';
              const styleId = settings.navStyle || 1;
              root.render(NavIconRenderer({ styleId, size: svgSize + 'px', color: navIconColor })[iconKey]);

              btn._reactRoot = root;
              btn.addEventListener('mouseleave', () => btn.style.transform = `translateY(-50%)`);
              btn.addEventListener('mousedown', e => { e.stopPropagation(); e.preventDefault(); });
              btn.addEventListener('click', e => {
                e.stopPropagation(); e.preventDefault();
                let next = type === 'prev' ? parseInt(el.getAttribute('data-active-index') || '0') - 1 : parseInt(el.getAttribute('data-active-index') || '0') + 1;
                if (next < 0) next = images.length - 1;
                if (next >= images.length) next = 0;
                el.setAttribute('data-active-index', next.toString());
                el._lastSlideTime = Date.now();

                const evt = new CustomEvent('force-slideshow-advance', { detail: { el, nextIndex: next } });
                window.dispatchEvent(evt);
              });
              overlay.appendChild(btn);
            });
          }

          if (showDots) {
            const dotScale = (settings.dotButtonSize || 100) / 100;
            let dotsWrap = overlay.querySelector('.editor-ss-dots-wrap');
            if (!dotsWrap) {
              dotsWrap = document.createElement('div');
              dotsWrap.className = 'editor-ss-dots-wrap';
              Object.assign(dotsWrap.style, {
                position: 'absolute',
                bottom: (8 * scaleFactor) + 'px',
                left: '50%',
                transform: `translateX(-50%) scale(${Math.max(0.3, scaleFactor * dotScale)})`,
                transformOrigin: 'bottom center',
                display: 'flex',
                gap: (5 * scaleFactor) + 'px',
                alignItems: 'center',
                pointerEvents: 'auto',
              });
              overlay.appendChild(dotsWrap);
            } else {
              dotsWrap.style.transform = `translateX(-50%) scale(${Math.max(0.3, scaleFactor * dotScale)})`;
            }

            if (!dotsWrap._reactRoot) {
              dotsWrap._reactRoot = createRoot(dotsWrap);
            }

            const dotStyleId = settings.dotStyle || 1;
            const dotsSig = `${dotStyleId}-${activeIndex}-${images.length}-${dotColor}-${scaleFactor.toFixed(2)}-${dotScale}`;

            if (dotsWrap._lastSig !== dotsSig) {
              dotsWrap._lastSig = dotsSig;
              dotsWrap._reactRoot.render(
                React.createElement(DotRenderer, {
                  styleId: dotStyleId,
                  size: `${Math.max(6, 8 * scaleFactor)}px`,
                  color: dotColor || '#000000',
                  activeIndex: activeIndex,
                  count: images.length,
                  onDotClick: (e, i) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const current = parseInt(el.getAttribute('data-active-index') || '0');
                    if (i === current) return;
                    el.setAttribute('data-active-index', i.toString());
                    el._lastSlideTime = Date.now();

                    const evt = new CustomEvent('force-slideshow-advance', { detail: { el, nextIndex: i } });
                    window.dispatchEvent(evt);
                  }
                })
              );
            }
          }
        }

        const isHovering = el._isHovering === true;
        overlay.querySelectorAll('.editor-ss-nav').forEach(btn => {
          btn.style.opacity = isHovering ? '1' : '0';
          btn.style.pointerEvents = isHovering ? 'auto' : 'none';
        });
      });

      document.querySelectorAll('.global-ss-overlay').forEach(overlay => {
        const found = Array.from(slideshows).some(el => el._globalSsOverlay === overlay);
        if (!found) {
          if (overlay._cleanupHover) overlay._cleanupHover();
          overlay.remove();
        }
      });
    };

    const interval = setInterval(renderOverlays, 200);

    const handleForceAdvance = (e) => {
      const { el, nextIndex } = e.detail;
      if (!el) return;
      try {
        const dataStr = el.getAttribute('data-slideshow');
        if (!dataStr) return;
        const data = JSON.parse(dataStr);
        const images = data.images || [];
        if (images.length === 0) return;

        const is3Frame = el.getAttribute('data-type') === 'slideshow' || el.querySelectorAll('rect:not([fill="transparent"]):not(.bbox-anchor):not(.slideshow-container-bg)').length >= 3;
        if (is3Frame) {
          update3FrameSlideshow(el, images, nextIndex, data.settings || {});
          window.dispatchEvent(new CustomEvent('slideshow-index-changed', { detail: { id: el.id, index: nextIndex } }));
          renderOverlays();
          return;
        }

        const url = images[nextIndex]?.url;
        if (!url) return;

        const _findImgInPattern = (node) => {
          const fill = node.getAttribute?.('fill') || '';
          if (fill?.startsWith('url(#')) {
            const patternId = fill.match(/url\(#([^)]+)\)/)?.[1];
            if (patternId) {
              const ownerSvg = node.closest('svg');
              const pattern = ownerSvg?.querySelector(`[id="${patternId}"]`);
              if (pattern) {
                const img = pattern.querySelector('image');
                if (img) return img;
                const useEl = pattern.querySelector('use');
                if (useEl) {
                  const refId = (useEl.getAttribute('href') || useEl.getAttribute('xlink:href'))?.replace('#', '');
                  if (refId) return ownerSvg?.querySelector(`[id="${refId}"]`) || null;
                }
              }
            }
          }
          return null;
        };
        let imgEl = null;
        const elTag = el.tagName?.toLowerCase();
        if (elTag === 'image' || elTag === 'img') imgEl = el;
        else {
          imgEl = _findImgInPattern(el) || el.querySelector('image') || el.querySelector('img');
          if (!imgEl) {
            const childrenWithPatterns = el.querySelectorAll('[fill^="url(#"]');
            for (const child of Array.from(childrenWithPatterns)) {
              const t = _findImgInPattern(child);
              if (t) { imgEl = t; break; }
            }
          }
          if (!imgEl) imgEl = el;
        }

        if (!imgEl) return;
        const imgTag2 = imgEl.tagName?.toLowerCase();
        if (imgTag2 === 'image') {
          imgEl.setAttribute('href', url);
          try { imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch (err) { }
        } else if (imgTag2 === 'img') {
          imgEl.src = url;
        } else {
          imgEl.style.backgroundImage = `url("${url}")`;
        }
        window.dispatchEvent(new CustomEvent('slideshow-index-changed', { detail: { id: el.id, index: nextIndex } }));
        renderOverlays();
      } catch (err) { }
    };

    window.addEventListener('force-slideshow-advance', handleForceAdvance);

    return () => {
      clearInterval(interval);
      window.removeEventListener('force-slideshow-advance', handleForceAdvance);
      document.querySelectorAll('.global-ss-overlay').forEach(overlay => {
        if (overlay._cleanupHover) overlay._cleanupHover();
        overlay.remove();
      });
    };
  }, [getVisualBBox]);

  // 2. Global Slideshow Runner: Auto Slide Mode does not run in Template Editor (only works in PreviewArea)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const activeOverlay = document.querySelector('.editor-ss-overlay');
      if (!activeOverlay) {
        document.querySelectorAll('[data-is-slideshow="true"]').forEach(el => {
          el._slideshowManual = false;
        });
      }
    }, 200);

    return () => clearInterval(cleanupInterval);
  }, []);

  // 3. Manual Click Handler: Advances unselected slideshows on click
  useEffect(() => {
    const findImgInPattern = (node) => {
      const fill = node.getAttribute?.('fill') || '';
      if (fill?.startsWith('url(#')) {
        const patternId = fill.match(/url\(#([^)]+)\)/)?.[1];
        if (patternId) {
          const ownerSvg = node.closest('svg');
          const pattern = ownerSvg?.querySelector(`[id="${patternId}"]`);
          if (pattern) {
            const img = pattern.querySelector('image');
            if (img) return img;
            const useEl = pattern.querySelector('use');
            if (useEl) {
              const refId = (useEl.getAttribute('href') || useEl.getAttribute('xlink:href'))?.replace('#', '');
              if (refId) return ownerSvg?.querySelector(`[id="${refId}"]`) || null;
            }
          }
        }
      }
      return null;
    };

    const resolveImgEl = (el) => {
      const tag = el.tagName?.toLowerCase();
      if (tag === 'image' || tag === 'img') return el;
      let img = findImgInPattern(el);
      if (!img) img = el.querySelector('image') || el.querySelector('img');
      if (!img) {
        const childrenWithPatterns = el.querySelectorAll('[fill^="url(#"]');
        for (const child of Array.from(childrenWithPatterns)) {
          const t = findImgInPattern(child);
          if (t) { img = t; break; }
        }
      }
      return img || el;
    };

    let mdX = 0, mdY = 0;

    const advanceSlideshow = (slideshowEl) => {
      try {
        const dataStr = slideshowEl.getAttribute('data-slideshow');
        if (!dataStr) return;
        const data = JSON.parse(dataStr);
        const images = data.images || [];
        if (images.length <= 1) return;

        const settings = data.settings || {};
        const infiniteLoop = settings.infiniteLoop !== false;

        let currentIndex = parseInt(slideshowEl.getAttribute('data-active-index') || '0');
        let nextIndex = currentIndex + 1;
        if (nextIndex >= images.length) nextIndex = infiniteLoop ? 0 : images.length - 1;
        if (nextIndex === currentIndex) return;

        const is3Frame = slideshowEl.getAttribute('data-type') === 'slideshow' || slideshowEl.querySelectorAll('rect:not([fill="transparent"]):not(.bbox-anchor):not(.slideshow-container-bg)').length >= 3;
        if (is3Frame) {
          update3FrameSlideshow(slideshowEl, images, nextIndex, settings);
          slideshowEl._lastSlideTime = Date.now();
          window.dispatchEvent(new CustomEvent('slideshow-index-changed', { detail: { id: slideshowEl.id, index: nextIndex } }));
          return;
        }

        const url = images[nextIndex]?.url;
        if (!url) return;

        const imgEl = resolveImgEl(slideshowEl);
        const imgTag = imgEl.tagName?.toLowerCase();
        if (imgTag === 'image') {
          imgEl.setAttribute('href', url);
          try { imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch (err) { }
        } else if (imgTag === 'img') {
          imgEl.src = url;
        } else {
          imgEl.style.backgroundImage = `url("${url}")`;
        }

        slideshowEl.setAttribute('data-active-index', nextIndex.toString());
        slideshowEl._lastSlideTime = Date.now();
        window.dispatchEvent(new CustomEvent('slideshow-index-changed', { detail: { id: slideshowEl.id, index: nextIndex } }));
      } catch (err) { }
    };

    const handleMouseDown = (e) => {
      mdX = e.clientX;
      mdY = e.clientY;
    };

    const handleMouseUp = (e) => {
      if (Math.abs(e.clientX - mdX) > 5 || Math.abs(e.clientY - mdY) > 5) return;

      let node = e.target;
      let slideshowEl = null;
      while (node && node.nodeType === 1) {
        if (node.getAttribute?.('data-is-slideshow') === 'true') {
          slideshowEl = node;
          break;
        }
        node = node.parentNode;
      }
      if (!slideshowEl) return;
      if (slideshowEl._slideshowManual) return;

      advanceSlideshow(slideshowEl);
    };

    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, []);
};

/**
 * Hook to register window event listeners that execute adding Elements into MainEditor,
 * and seamlessly attaches Slideshow managers.
 */
export const useElementsEditor = ({
  pages,
  activePageIndex,
  updatePageHtml,
  setSelectedLayerId,
  selectedLayerIdRef,
  setMultiSelectedIds,
  multiSelectedIdsRef,
  setSingleSelection,
  setActiveMainTool,
  drawOverlayHighlight,
  getVisualBBox
}) => {
  // Mount the global slideshow subsystem
  useSlideshowManager({ getVisualBBox });

  useEffect(() => {
    const onAddElement = (e) => {
      handleAddElementToSvg({
        svgContent: e.detail?.svgContent,
        pageIndex: e.detail?.pageIndex,
        dropPoint: e.detail?.dropPoint,
        pages,
        activePageIndex,
        updatePageHtml,
        setSelectedLayerId,
        selectedLayerIdRef,
        setMultiSelectedIds,
        multiSelectedIdsRef,
        setSingleSelection,
        setActiveMainTool,
        drawOverlayHighlight
      });
    };

    const onAddIcon = (e) => {
      handleAddIconToSvg({
        icon: e.detail?.icon,
        pageIndex: e.detail?.pageIndex,
        dropPoint: e.detail?.dropPoint,
        isShape: e.detail?.isShape,
        pages,
        activePageIndex,
        updatePageHtml,
        setSelectedLayerId,
        selectedLayerIdRef,
        setMultiSelectedIds,
        multiSelectedIdsRef,
        setSingleSelection,
        setActiveMainTool,
        drawOverlayHighlight
      });
    };

    window.addEventListener('add-element-to-editor', onAddElement);
    window.addEventListener('add-icon-to-editor', onAddIcon);

    return () => {
      window.removeEventListener('add-element-to-editor', onAddElement);
      window.removeEventListener('add-icon-to-editor', onAddIcon);
    };
  }, [
    pages,
    activePageIndex,
    updatePageHtml,
    setSelectedLayerId,
    selectedLayerIdRef,
    setMultiSelectedIds,
    multiSelectedIdsRef,
    setSingleSelection,
    setActiveMainTool,
    drawOverlayHighlight
  ]);
};

export default useElementsEditor;
