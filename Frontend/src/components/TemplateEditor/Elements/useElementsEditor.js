import { useEffect } from 'react';

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
  setActiveMainTool
}) => {
  const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;
  const page = pages?.[targetPageIndex];
  if (!page) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(page.html || '', 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return null;

  const elementDoc = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`, 'image/svg+xml');
  const newElement = elementDoc.querySelector('g') || elementDoc.querySelector('svg')?.firstElementChild;
  if (!newElement) return null;

  // Positioning logic if dropped
  if (dropPoint) {
    const currentTransform = newElement.getAttribute('transform') || '';
    newElement.setAttribute('transform', `translate(${dropPoint.x - 100}, ${dropPoint.y - 25}) ${currentTransform}`);
  }

  const targetContainer = svg.querySelector('[data-type="frame"]') || svg.querySelector('[data-name="Overlay"]') || svg;
  targetContainer.appendChild(newElement);

  updatePageHtml(targetPageIndex, svg.outerHTML);

  // Auto-select the newly added element
  const newId = newElement.getAttribute('id');
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
  if (['button', 'image-frame', 'map', 'qrcode'].includes(data.type)) {
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
 * Identifies if an element is an Audio element.
 */
export const isAudioGroup = (el) => {
  if (!el || typeof el.getAttribute !== 'function') return false;
  const dt = el.getAttribute('data-type');
  return dt === 'audio-frame' || dt === 'audio';
};

/**
 * Hook to register window event listeners that execute adding Elements into MainEditor.
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
  drawOverlayHighlight
}) => {
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
        setActiveMainTool
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
