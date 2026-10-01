import React, { useState, useEffect, useRef } from 'react';

export const isElementCropped = (el) => {
  if (!el || typeof el.getAttribute !== 'function') return false;
  const type = el.getAttribute('data-type');
  const name = el.getAttribute('data-name');
  if (type === 'frame' || type === 'background' || name === 'Overlay') return false;

  const isUserGroup = (type === 'group' || (name || '').toLowerCase() === 'group' || (el.id || '').startsWith('group-')) && el.getAttribute('data-is-image-group') !== 'true' && el.getAttribute('data-is-video-group') !== 'true' && el.getAttribute('data-is-gif-group') !== 'true';
  if (isUserGroup) return false;

  const hasCropData = el.getAttribute('data-crop-data') && el.getAttribute('data-crop-data') !== 'null';
  const hasObjectFitCrop = el.getAttribute('data-object-fit') === 'Crop';
  const hasCropInset = el.hasAttribute('data-effect-crop-inset');
  const clipAttr = el.getAttribute('clip-path') || '';
  const hasCropClip = clipAttr.includes('crop-');

  if (hasCropData || hasObjectFitCrop || hasCropInset || hasCropClip) return true;

  if (typeof el.querySelector === 'function') {
    const croppedChild = el.querySelector('[data-crop-data]:not([data-crop-data="null"]), [data-object-fit="Crop"], [clip-path*="crop-"]');
    if (croppedChild) return true;
  }

  return false;
};

export const CropController = ({
  activePageIndex,
  zoom,
  saveModifiedPageHtml,
  drawOverlayHighlight,
  getVisualBBox
}) => {
  const [activeCropId, setActiveCropId] = useState(null);
  const activeCropIdRef = useRef(null);
  activeCropIdRef.current = activeCropId;

  // Store callbacks in ref to avoid re-triggering useEffect
  const callbacks = useRef({ saveModifiedPageHtml, drawOverlayHighlight, getVisualBBox });
  callbacks.current = { saveModifiedPageHtml, drawOverlayHighlight, getVisualBBox };

  useEffect(() => {
    const handleEnterCropMode = (e) => {
      const { elementId } = e.detail || {};
      if (elementId) {
        setActiveCropId(elementId);
        activeCropIdRef.current = elementId;
      }
    };
    window.addEventListener('enter-crop-mode', handleEnterCropMode);
    return () => window.removeEventListener('enter-crop-mode', handleEnterCropMode);
  }, []);

  useEffect(() => {
    if (!activeCropId) return;

    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    if (!pageContainer) return;
    const svg = pageContainer.querySelector('svg');
    if (!svg) return;
    const cropEl = svg.querySelector(`[id="${activeCropId}"]`);
    if (!cropEl) return;
    const imgEl = cropEl.querySelector('image, video') || (cropEl.tagName?.toLowerCase() === 'image' ? cropEl : null);
    if (!imgEl) return;

    // Temporarily unclip group AND all inner child elements so full uncropped image shows
    const unclipElements = [];
    const clipNodes = [cropEl, ...cropEl.querySelectorAll('[clip-path]')];
    clipNodes.forEach(node => {
      const c = node.getAttribute('clip-path');
      if (c) {
        node.setAttribute('data-saved-clip-path', c);
        node.removeAttribute('clip-path');
        unclipElements.push(node);
      }
    });

    const overlay = pageContainer.querySelector(`#highlight-overlay-${activePageIndex}`);

    const getCropData = () => {
      try {
        return JSON.parse(cropEl.getAttribute('data-crop-data') || '{}');
      } catch (e) {
        return { left: 0, top: 0, width: 100, height: 100, offX: 0, offY: 0, scale: 1 };
      }
    };

    const renderMaskCutout = () => {
      if (!overlay) return;
      let maskGroup = overlay.querySelector('#crop-mode-mask-group');
      if (!maskGroup) {
        maskGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        maskGroup.id = 'crop-mode-mask-group';
        maskGroup.setAttribute('pointer-events', 'none');
        overlay.appendChild(maskGroup);
      }

      const targetCropEl = cropEl;
      const ctm = targetCropEl.getScreenCTM();
      const overlayCtm = overlay.getScreenCTM();
      if (!ctm || !overlayCtm) return;

      const svgMatrix = overlayCtm.inverse().multiply(ctm);
      const bbox = callbacks.current.getVisualBBox(cropEl);

      const pts = [
        { x: bbox.x, y: bbox.y },
        { x: bbox.x + bbox.width, y: bbox.y },
        { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
        { x: bbox.x, y: bbox.y + bbox.height }
      ];

      const mapped = pts.map(p => {
        const pt = overlay.createSVGPoint();
        pt.x = p.x; pt.y = p.y;
        return pt.matrixTransform(svgMatrix);
      });

      const xs = mapped.map(p => p.x);
      const ys = mapped.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const cWidth = maxX - minX;
      const cHeight = maxY - minY;

      const maskId = `crop-edit-mask-${activePageIndex}`;

      const cd = getCropData();
      const foEl = null;
      const fallbackW = imgEl?.getAttribute('width') || '100';
      const fallbackH = imgEl?.getAttribute('height') || '100';
      const fallbackX = imgEl?.getAttribute('x') || '0';
      const fallbackY = imgEl?.getAttribute('y') || '0';

      const origW = parseFloat(cropEl.getAttribute('data-crop-orig-w') || fallbackW);
      const origH = parseFloat(cropEl.getAttribute('data-crop-orig-h') || fallbackH);
      const origX = parseFloat(cropEl.getAttribute('data-crop-orig-x') || fallbackX);
      const origY = parseFloat(cropEl.getAttribute('data-crop-orig-y') || fallbackY);

      const centerX = origX + (origW / 2);
      const centerY = origY + (origH / 2);
      const panX = (origW * (cd.offX || 0)) / 100;
      const panY = (origH * (cd.offY || 0)) / 100;
      const sc = parseFloat(cd.scale) || 1;

      const fullImgX = centerX + panX - (origW * sc / 2);
      const fullImgY = centerY + panY - (origH * sc / 2);
      const fullImgW = origW * sc;
      const fullImgH = origH * sc;

      const ghostPts = [
        { x: fullImgX, y: fullImgY },
        { x: fullImgX + fullImgW, y: fullImgY },
        { x: fullImgX + fullImgW, y: fullImgY + fullImgH },
        { x: fullImgX, y: fullImgY + fullImgH }
      ];
      const ghostMapped = ghostPts.map(p => {
        const pt = overlay.createSVGPoint();
        pt.x = p.x; pt.y = p.y;
        return pt.matrixTransform(svgMatrix);
      });
      const gXs = ghostMapped.map(p => p.x);
      const gYs = ghostMapped.map(p => p.y);
      const gMinX = Math.min(...gXs);
      const gMaxX = Math.max(...gXs);
      const gMinY = Math.min(...gYs);
      const gMaxY = Math.max(...gYs);
      const gWidth = Math.max(0, gMaxX - gMinX);
      const gHeight = Math.max(0, gMaxY - gMinY);

      const isGif = cropEl.getAttribute('data-is-gif-group') === 'true' || (cropEl.closest && cropEl.closest('[data-is-gif-group="true"]'));
      if (isGif) {
        maskGroup.innerHTML = '';
        return;
      }

      const imgSrc = imgEl.getAttribute('href') || imgEl.getAttribute('xlink:href') || imgEl.getAttribute('src') || '';
      const imgPreserve = imgEl.getAttribute('preserveAspectRatio') || 'xMidYMid slice';

      if (!maskGroup.hasChildNodes()) {
        maskGroup.innerHTML = `
          <defs>
            <mask id="${maskId}">
              <!-- Full White Mask over Outer Image area -->
              <rect class="crop-mask-white" x="${gMinX}" y="${gMinY}" width="${gWidth}" height="${gHeight}" fill="white" />
              <!-- Cutout Hole over Crop Box area -->
              <rect class="crop-mask-black" x="${minX}" y="${minY}" width="${cWidth}" height="${cHeight}" fill="black" />
            </mask>
          </defs>

          <!-- Full Uncropped Ghost Image rendered under black transparent shade -->
          ${imgSrc ? `<image class="crop-ghost-img" href="${imgSrc}" x="${gMinX}" y="${gMinY}" width="${gWidth}" height="${gHeight}" preserveAspectRatio="${imgPreserve}" style="pointer-events: none;" />` : ''}

          <!-- Black Transparent Shade ON OUTER UNCROPPED IMAGE ONLY -->
          <rect class="crop-shade" x="${gMinX}" y="${gMinY}" width="${gWidth}" height="${gHeight}" fill="rgba(0, 0, 0, 0.65)" mask="url(#${maskId})" pointer-events="none" />

          <!-- 3x3 Rule-of-Thirds Grid Lines Inside Crop Frame -->
          <line class="crop-l1" x1="${minX + cWidth / 3}" y1="${minY}" x2="${minX + cWidth / 3}" y2="${minY + cHeight}" stroke="rgba(255, 255, 255, 0.75)" stroke-width="1" pointer-events="none" />
          <line class="crop-l2" x1="${minX + (cWidth * 2) / 3}" y1="${minY}" x2="${minX + (cWidth * 2) / 3}" y2="${minY + cHeight}" stroke="rgba(255, 255, 255, 0.75)" stroke-width="1" pointer-events="none" />
          <line class="crop-l3" x1="${minX}" y1="${minY + cHeight / 3}" x2="${minX + cWidth}" y2="${minY + cHeight / 3}" stroke="rgba(255, 255, 255, 0.75)" stroke-width="1" pointer-events="none" />
          <line class="crop-l4" x1="${minX}" y1="${minY + (cHeight * 2) / 3}" x2="${minX + cWidth}" y2="${minY + (cHeight * 2) / 3}" stroke="rgba(255, 255, 255, 0.75)" stroke-width="1" pointer-events="none" />
        `;
      } else {
        const whiteMask = maskGroup.querySelector('.crop-mask-white');
        if (whiteMask) { whiteMask.setAttribute('x', gMinX); whiteMask.setAttribute('y', gMinY); whiteMask.setAttribute('width', gWidth); whiteMask.setAttribute('height', gHeight); }
        
        const blackMask = maskGroup.querySelector('.crop-mask-black');
        if (blackMask) { blackMask.setAttribute('x', minX); blackMask.setAttribute('y', minY); blackMask.setAttribute('width', cWidth); blackMask.setAttribute('height', cHeight); }
        
        const ghostImg = maskGroup.querySelector('.crop-ghost-img');
        if (ghostImg) { ghostImg.setAttribute('x', gMinX); ghostImg.setAttribute('y', gMinY); ghostImg.setAttribute('width', gWidth); ghostImg.setAttribute('height', gHeight); }
        
        const shade = maskGroup.querySelector('.crop-shade');
        if (shade) { shade.setAttribute('x', gMinX); shade.setAttribute('y', gMinY); shade.setAttribute('width', gWidth); shade.setAttribute('height', gHeight); }
        
        const l1 = maskGroup.querySelector('.crop-l1');
        if (l1) { l1.setAttribute('x1', minX + cWidth / 3); l1.setAttribute('y1', minY); l1.setAttribute('x2', minX + cWidth / 3); l1.setAttribute('y2', minY + cHeight); }
        
        const l2 = maskGroup.querySelector('.crop-l2');
        if (l2) { l2.setAttribute('x1', minX + (cWidth * 2) / 3); l2.setAttribute('y1', minY); l2.setAttribute('x2', minX + (cWidth * 2) / 3); l2.setAttribute('y2', minY + cHeight); }
        
        const l3 = maskGroup.querySelector('.crop-l3');
        if (l3) { l3.setAttribute('x1', minX); l3.setAttribute('y1', minY + cHeight / 3); l3.setAttribute('x2', minX + cWidth); l3.setAttribute('y2', minY + cHeight / 3); }
        
        const l4 = maskGroup.querySelector('.crop-l4');
        if (l4) { l4.setAttribute('x1', minX); l4.setAttribute('y1', minY + (cHeight * 2) / 3); l4.setAttribute('x2', minX + cWidth); l4.setAttribute('y2', minY + (cHeight * 2) / 3); }
      }
    };

    let animationFrameId;
    const loop = () => {
      renderMaskCutout();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    let isDragging = false;
    let startX = 0, startY = 0;
    let startOffX = 0, startOffY = 0;

    const updateTransform = (cd) => {
      const foEl = null;
      const fallbackW = imgEl?.getAttribute('width') || '100';
      const fallbackH = imgEl?.getAttribute('height') || '100';
      const fallbackX = imgEl?.getAttribute('x') || '0';
      const fallbackY = imgEl?.getAttribute('y') || '0';

      const origW = parseFloat(cropEl.getAttribute('data-crop-orig-w') || fallbackW);
      const origH = parseFloat(cropEl.getAttribute('data-crop-orig-h') || fallbackH);
      const origX = parseFloat(cropEl.getAttribute('data-crop-orig-x') || fallbackX);
      const origY = parseFloat(cropEl.getAttribute('data-crop-orig-y') || fallbackY);

      const centerX = origX + (origW / 2);
      const centerY = origY + (origH / 2);
      const panX = (origW * (cd.offX || 0)) / 100;
      const panY = (origH * (cd.offY || 0)) / 100;
      const sc = parseFloat(cd.scale) || 1;

      imgEl.setAttribute('transform', `translate(${centerX + panX} ${centerY + panY}) scale(${sc}) translate(${-centerX} ${-centerY})`);
      
      cropEl.setAttribute('data-crop-data', JSON.stringify(cd));
      callbacks.current.drawOverlayHighlight(cropEl, 'selected');
      renderMaskCutout();
    };

    const onPointerDown = (e) => {
      if (e.button !== 0) return;

      const clickX = e.clientX;
      const clickY = e.clientY;

      const isDirectHit = (
        cropEl.contains(e.target) ||
        (imgEl && imgEl.contains(e.target)) ||
        Boolean(e.target.closest('#crop-mode-mask-group')) ||
        Boolean(e.target.closest('.resize-handle')) ||
        Boolean(e.target.closest('[id^="overlay-poly-"]'))
      );

      const targetBBox = cropEl.getBoundingClientRect();
      const isInsideBBox = (
        clickX >= targetBBox.left - 15 &&
        clickX <= targetBBox.right + 15 &&
        clickY >= targetBBox.top - 15 &&
        clickY <= targetBBox.bottom + 15
      );

      if (!isDirectHit && !isInsideBBox) {
        setActiveCropId(null);
        activeCropIdRef.current = null;
        return;
      }

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const cd = getCropData();
      startOffX = parseFloat(cd.offX) || 0;
      startOffY = parseFloat(cd.offY) || 0;
      pageContainer.style.cursor = 'grabbing';
      e.stopPropagation();
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      e.stopPropagation();
      const zoomScale = (zoom || 100) / 100;
      const dxScreen = (e.clientX - startX) / zoomScale;
      const dyScreen = (e.clientY - startY) / zoomScale;

      const foEl = null;
      const fallbackW = imgEl?.getAttribute('width') || '100';
      const fallbackH = imgEl?.getAttribute('height') || '100';

      const origW = parseFloat(cropEl.getAttribute('data-crop-orig-w') || fallbackW);
      const origH = parseFloat(cropEl.getAttribute('data-crop-orig-h') || fallbackH);

      if (origW > 0 && origH > 0) {
        const dOffX = (dxScreen / origW) * 100;
        const dOffY = (dyScreen / origH) * 100;

        const cd = getCropData();
        cd.offX = startOffX + dOffX;
        cd.offY = startOffY + dOffY;
        updateTransform(cd);
      }
    };

    const onPointerUp = () => {
      if (isDragging) {
        isDragging = false;
        pageContainer.style.cursor = '';
        callbacks.current.saveModifiedPageHtml(activePageIndex, svg);
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const cd = getCropData();
      const currentScale = parseFloat(cd.scale) || 1;
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      const newScale = Math.min(Math.max(1.0, currentScale + delta), 5.0);
      cd.scale = Math.round(newScale * 100) / 100;
      updateTransform(cd);
      callbacks.current.saveModifiedPageHtml(activePageIndex, svg);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setActiveCropId(null);
        activeCropIdRef.current = null;
      }
    };

    window.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    pageContainer.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    document.body.classList.add('crop-modal-active');
    cropEl.setAttribute('data-cropping', 'true');

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      pageContainer.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      
      document.body.classList.remove('crop-modal-active');
      cropEl.removeAttribute('data-cropping');

      unclipElements.forEach(node => {
        const saved = node.getAttribute('data-saved-clip-path');
        if (saved) {
          node.setAttribute('clip-path', saved);
          node.removeAttribute('data-saved-clip-path');
        }
      });
      if (overlay) {
        const maskGroup = overlay.querySelector('#crop-mode-mask-group');
        if (maskGroup) maskGroup.remove();
      }
    };
  }, [activeCropId, activePageIndex, zoom]);

  if (!activeCropId) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <div className="absolute top-[17vh] left-1/2 -translate-x-1/2 pointer-events-auto bg-[#181825] text-white px-[1.2vw] py-[0.6vh] rounded-[0.5vw] shadow-2xl flex items-center gap-[1vw] border border-white/20 animate-in fade-in duration-200">
        <div className="flex items-center gap-[0.6vw] text-[0.75vw] font-medium">
          <span className="bg-green-500/30 text-green-300 px-[0.6vw] py-[0.2vh] rounded-full text-[0.65vw] font-bold uppercase tracking-wider border border-green-400/30">
            Crop Mode
          </span>
          <span className="text-gray-200 text-[0.75vw]">Drag image to move • Scroll mouse wheel to zoom</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveCropId(null);
            activeCropIdRef.current = null;
          }}
          className="bg-green-600 hover:bg-green-500 text-white text-[0.75vw] px-[0.9vw] py-[0.4vh] rounded-full font-semibold transition-all active:scale-95 shadow-md flex items-center gap-[0.35vw] cursor-pointer"
        >
          <span>Done</span>
          {/* <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.75vw', height: '0.75vw' }}>
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg> */}
        </button>
      </div>
    </div>
  );
};
