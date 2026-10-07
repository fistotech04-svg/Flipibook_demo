import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import interact from 'interactjs';
import { NavIconRenderer } from '../CustomizedEditor/popups/NavIconStylesPopup';
import { DotRenderer } from '../CustomizedEditor/popups/DotStylesPopup';
import { checkIsAnimatedWebp } from './editorUtils';
import FlipBookEngine from '../CustomizedEditor/FlipBookEngine';
import usePreventBrowserZoom from '../../hooks/usePreventBrowserZoom';

import paper from 'paper';
import {
  VectraPenSession, pathToD, pathToDCombo, makeNode, makePath,
  getPaperSegments, getPaperCurves, cleanPaperPathData, mergeMeetingNodes, applyHandleDrag, executeVectorPathAction, deleteSelectedNodeOrHandle, bakeTransformIntoPaperPath, processVectorPathAction,
  drawNodeEditOverlay as drawNodeEditOverlayExt, clearPenToolNodes as clearPenToolNodesExt, drawPenToolNodes as drawPenToolNodesExt, drawBendingNodes as drawBendingNodesExt, renderVectraOverlay as renderVectraOverlayExt, clearVectraOverlay as clearVectraOverlayExt, generatePathData,
  exitNodeEditModeHelper
} from './penToolEngine';

import HotspotPresetPopup from './HotspotPresetPopup';
import { generateHotspotSVG } from './HotspotCustomizationPopup';
import { CropController, isElementCropped } from './Crop';
import { useToast } from '../CustomToast';
import { checkSpellingAndGrammar, getSpellingSuggestions } from './spellGrammarChecker';

const PENCIL_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24'><g fill='none' fill-rule='evenodd'><path d='m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z' /><path fill='%23000' d='M20.131 3.16a3 3 0 0 0-4.242 0l-.707.708l4.95 4.95l.706-.707a3 3 0 0 0 0-4.243l-.707-.707Zm-1.414 7.072l-4.95-4.95l-9.09 9.091a1.5 1.5 0 0 0-.401.724l-1.029 4.455a1 1 0 0 0 1.2 1.2l4.456-1.028a1.5 1.5 0 0 0 .723-.401z' /></g></svg>") 1 16, crosshair`;
const PEN_CURSOR = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M4 4l7 2.5L8 14 4 4z' fill='white' stroke='black' stroke-width='1.1'/%3E%3Cpath d='M8 14l-1.5 5' stroke='white' stroke-width='2'/%3E%3Cpath d='M8 14l-1.5 5' stroke='black' stroke-width='.8'/%3E%3C/svg%3E") 4 4, crosshair`;
const CUR_PEN_CLOSE = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M4 4l7 2.5L8 14 4 4z' fill='white' stroke='black' stroke-width='1.1'/%3E%3Ccircle cx='17' cy='16' r='4' fill='none' stroke='black' stroke-width='3'/%3E%3Ccircle cx='17' cy='16' r='4' fill='none' stroke='white' stroke-width='1.6'/%3E%3C/svg%3E") 4 4, crosshair`;
const CUR_PEN_EXTEND = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M4 4l7 2.5L8 14 4 4z' fill='white' stroke='black' stroke-width='1.1'/%3E%3Cpath d='M13 19h8M17 15v8' stroke='black' stroke-width='3.2'/%3E%3Cpath d='M13 19h8M17 15v8' stroke='white' stroke-width='1.6'/%3E%3C/svg%3E") 4 4, crosshair`;
const CUR_SNAP = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M12 2v7M12 15v7M2 12h7M15 12h7' stroke='black' stroke-width='2.6'/%3E%3Cpath d='M12 2v7M12 15v7M2 12h7M15 12h7' stroke='white' stroke-width='1.2'/%3E%3Ccircle cx='12' cy='12' r='2.4' fill='none' stroke='black' stroke-width='2.2'/%3E%3Ccircle cx='12' cy='12' r='2.4' fill='none' stroke='%23FF5C87' stroke-width='1.2'/%3E%3C/svg%3E") 12 12, crosshair`;
const SHAPE_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M12 2V22M2 12H22' stroke='%236366F1' stroke-width='2' stroke-linecap='round'/></svg>") 12 12, crosshair`;
const TYPE_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 15 15'><path fill='%23000' d='M10.5 1a.5.5 0 0 1 0 1c-.922 0-1.54.23-1.92.563C8.206 2.89 8 3.366 8 4v3h1.25a.5.5 0 0 1 0 1H8v3c0 .634.207 1.11.58 1.437c.38.333.998.563 1.92.563a.5.5 0 0 1 0 1c-1.078 0-1.96-.27-2.58-.812a2.6 2.6 0 0 1-.42-.47q-.177.256-.42.47C6.46 13.73 5.577 14 4.5 14a.5.5 0 0 1 0-1c.922 0 1.54-.23 1.92-.563c.373-.326.58-.803.58-1.437V8H5.75a.5.5 0 0 1 0-1H7V4c0-.634-.207-1.11-.58-1.437C6.04 2.23 5.423 2 4.5 2a.5.5 0 0 1 0-1c1.078 0 1.96.27 2.58.812q.243.213.42.468q.177-.255.42-.468C8.54 1.27 9.423 1 10.5 1' /></svg>") 7 7, text`;
const DIRECT_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="-20 -20 300 300"><path d="M238.448 92.6028L0 0L90.103 241.348C90.7404 243.045 91.8924 244.501 93.3985 245.514C94.9045 246.526 96.6895 247.045 98.5048 246.997C100.32 246.949 102.075 246.337 103.525 245.246C104.976 244.156 106.049 242.641 106.596 240.913L130.069 164.711L209.652 242.219C211.287 243.841 213.498 244.751 215.804 244.751C218.109 244.751 220.321 243.841 221.956 242.219L242.462 221.753C244.088 220.122 245 217.914 245 215.614C245 213.313 244.088 211.106 242.462 209.474L163.141 132.315L238.448 109.062C240.163 108.47 241.65 107.359 242.703 105.884C243.755 104.409 244.321 102.643 244.321 100.833C244.321 99.0218 243.755 97.256 242.703 95.781C241.65 94.306 240.163 93.195 238.448 92.6028Z" fill="black" transform="rotate(18, 0, 0)"/></svg>') 1 1, auto`;


export const formatSmoothPathD = (pts) => {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  if (pts.length === 2) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)} ${pts[1].y.toFixed(2)}`;

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  const mid0x = (pts[0].x + pts[1].x) / 2;
  const mid0y = (pts[0].y + pts[1].y) / 2;
  d += ` L ${mid0x.toFixed(2)} ${mid0y.toFixed(2)}`;

  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}, ${xc.toFixed(2)} ${yc.toFixed(2)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
};


export const getVisualBBox = (el) => {
  if (!el || typeof el.getBBox !== 'function') return { x: 0, y: 0, width: 0, height: 0 };

  const isUserGroup = el.tagName?.toLowerCase() === 'g' && (
    el.getAttribute('data-type') === 'group' ||
    (el.getAttribute('data-name') || '').toLowerCase() === 'group' ||
    (el.id || '').startsWith('group-')
  ) && el.getAttribute('data-is-image-group') !== 'true' && el.getAttribute('data-is-video-group') !== 'true' && el.getAttribute('data-is-gif-group') !== 'true';

  const targetCropEl = !isUserGroup ? (
    (typeof el.closest === 'function' ? el.closest('[data-crop-data], [data-object-fit="Crop"], [clip-path*="crop-"], [clip-path*="clip-"]') : null) ||
    (typeof el.querySelector === 'function' ? el.querySelector('[data-crop-data], [data-object-fit="Crop"], [clip-path*="crop-"], [clip-path*="clip-"]') : null) ||
    (isElementCropped(el) ? el : null)
  ) : null;

  if (targetCropEl) {
    const cropStr = targetCropEl.getAttribute('data-crop-data') || el.getAttribute('data-crop-data');
    const svgRoot = targetCropEl.ownerSVGElement || targetCropEl.closest?.('svg') || el.ownerSVGElement || document;
    let clipId = null;
    const clipAttr = targetCropEl.getAttribute('clip-path') || el.getAttribute('clip-path') || targetCropEl.querySelector?.('[clip-path]')?.getAttribute('clip-path') || el.querySelector?.('[clip-path]')?.getAttribute('clip-path') || '';
    const clipMatch = clipAttr.match(/url\(['"']?#([^)'"]+)['"']?\)/);
    if (clipMatch) clipId = clipMatch[1];

    const clipEl = clipId ? (svgRoot?.querySelector ? svgRoot.querySelector(`[id="${clipId}"]`) : document.getElementById(clipId)) :
      svgRoot?.querySelector?.(`[id="crop-group-clip-${targetCropEl.id}"], [id="crop-clip-${targetCropEl.id}"], [id="crop-group-clip-${el.id}"], [id="crop-clip-${el.id}"], [id="clip-shape-${targetCropEl.id}"], [id="clip-shape-${el.id}"]`);

    if (clipEl && clipEl.firstElementChild) {
      try {
        const r = clipEl.firstElementChild;
        if (typeof r.getBBox === 'function') {
          const bb = r.getBBox();
          if (bb && (bb.width > 0 || bb.height > 0)) {
            return { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
          }
        }
        const rx = parseFloat(r.getAttribute('x') || '0');
        const ry = parseFloat(r.getAttribute('y') || '0');
        const rw = parseFloat(r.getAttribute('width') || '0');
        const rh = parseFloat(r.getAttribute('height') || '0');
        if (rw > 0 && rh > 0) {
          return { x: rx, y: ry, width: rw, height: rh };
        }
      } catch (e) { }
    }

    if (cropStr && cropStr !== 'null') {
      let bboxW = 0, bboxH = 0, bboxX = 0, bboxY = 0;
      const targetForOrig = targetCropEl || el;
      if (targetForOrig.hasAttribute('data-crop-orig-w')) {
        bboxW = parseFloat(targetForOrig.getAttribute('data-crop-orig-w') || '0');
        bboxH = parseFloat(targetForOrig.getAttribute('data-crop-orig-h') || '0');
        bboxX = parseFloat(targetForOrig.getAttribute('data-crop-orig-x') || '0');
        bboxY = parseFloat(targetForOrig.getAttribute('data-crop-orig-y') || '0');
      } else {
        try {
          const bbox = el.getBBox();
          bboxW = bbox.width; bboxH = bbox.height; bboxX = bbox.x; bboxY = bbox.y;
        } catch (e) { }
      }
      try {
        const crop = JSON.parse(cropStr);
        if (bboxW > 0 && bboxH > 0) {
          return {
            x: bboxX + (parseFloat(crop.left || 0) / 100) * bboxW,
            y: bboxY + (parseFloat(crop.top || 0) / 100) * bboxH,
            width: bboxW * (parseFloat(crop.width || 100) / 100),
            height: bboxH * (parseFloat(crop.height || 100) / 100)
          };
        }
      } catch (e) { }
    }
  }

  const clipAttr = el.getAttribute('clip-path') || el.style?.clipPath || '';
  if (clipAttr.includes('clip-') || clipAttr.includes('crop-')) {
    const clipMatch = clipAttr.match(/url\(['"']?#([^)'"]+)['"']?\)/);
    if (clipMatch && clipMatch[1]) {
      const clipEl = document.getElementById(clipMatch[1]);
      if (clipEl && clipEl.firstElementChild && typeof clipEl.firstElementChild.getBBox === 'function') {
        try {
          const bb = clipEl.firstElementChild.getBBox();
          if (bb && (bb.width > 0 || bb.height > 0)) return bb;
        } catch (e) { }
      }
    }
  }

  const isImgGrp = el.getAttribute('data-is-image-group') === 'true' || el.getAttribute('data-is-video-group') === 'true' || el.getAttribute('data-is-gif-group') === 'true';
  if (el.tagName.toLowerCase() === 'g' && (el.querySelector('[data-crop-data]') || isImgGrp)) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const children = Array.from(el.children);
    let hasValidChild = false;

    for (const child of children) {
      if (child.classList && (
        child.classList.contains('svg-image-stroke-overlay') ||
        child.classList.contains('svg-gif-stroke-overlay') ||
        child.classList.contains('svg-shape-stroke-overlay') ||
        child.classList.contains('svg-drop-shadow-caster')
      )) {
        continue;
      }
      if (typeof child.getBBox === 'function' && child.style.display !== 'none' && child.style.visibility !== 'hidden' && child.tagName.toLowerCase() !== 'defs') {
        const childBBox = getVisualBBox(child);
        let childMatrix = new DOMMatrix();
        try {
          const parentCTM = el.getCTM();
          const childCTM = child.getCTM();
          if (parentCTM && childCTM) {
            childMatrix = parentCTM.inverse().multiply(childCTM);
          }
        } catch (e) { }

        const pt1 = new DOMPoint(childBBox.x, childBBox.y).matrixTransform(childMatrix);
        const pt2 = new DOMPoint(childBBox.x + childBBox.width, childBBox.y).matrixTransform(childMatrix);
        const pt3 = new DOMPoint(childBBox.x + childBBox.width, childBBox.y + childBBox.height).matrixTransform(childMatrix);
        const pt4 = new DOMPoint(childBBox.x, childBBox.y + childBBox.height).matrixTransform(childMatrix);

        const pts = [pt1, pt2, pt3, pt4];
        for (const pt of pts) {
          if (pt.x < minX) minX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y > maxY) maxY = pt.y;
        }
        hasValidChild = true;
      }
    }

    if (hasValidChild) {
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
  }

  // For all other <g> groups (user-created groups, icon groups, vector groups, etc.),
  // iterate children to get a tight bounding box. This prevents the "full sheet" effect
  // when a group's getBBox() includes page-spanning background elements.
  const isNonFrameGroup = el.tagName.toLowerCase() === 'g' &&
    el.getAttribute('data-type') !== 'frame' &&
    el.getAttribute('data-type') !== 'background' &&
    el.getAttribute('data-name') !== 'Overlay';
  if (isNonFrameGroup) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const children = Array.from(el.children);
    let hasValidChild = false;

    for (const child of children) {
      if (child.classList && (
        child.classList.contains('svg-image-stroke-overlay') ||
        child.classList.contains('svg-gif-stroke-overlay') ||
        child.classList.contains('svg-shape-stroke-overlay') ||
        child.classList.contains('svg-drop-shadow-caster')
      )) {
        continue;
      }
      if (child.tagName.toLowerCase() === 'defs') continue;
      if (child.style.display === 'none' || child.style.visibility === 'hidden') continue;
      if (typeof child.getBBox !== 'function') continue;

      try {
        const childBBox = getVisualBBox(child);
        if (!childBBox || (childBBox.width === 0 && childBBox.height === 0)) continue;

        let childMatrix = new DOMMatrix();
        try {
          const parentCTM = el.getCTM();
          const childCTM = child.getCTM();
          if (parentCTM && childCTM) {
            childMatrix = parentCTM.inverse().multiply(childCTM);
          }
        } catch (e) { }

        const pt1 = new DOMPoint(childBBox.x, childBBox.y).matrixTransform(childMatrix);
        const pt2 = new DOMPoint(childBBox.x + childBBox.width, childBBox.y).matrixTransform(childMatrix);
        const pt3 = new DOMPoint(childBBox.x + childBBox.width, childBBox.y + childBBox.height).matrixTransform(childMatrix);
        const pt4 = new DOMPoint(childBBox.x, childBBox.y + childBBox.height).matrixTransform(childMatrix);

        const pts = [pt1, pt2, pt3, pt4];
        for (const pt of pts) {
          if (isFinite(pt.x) && isFinite(pt.y)) {
            if (pt.x < minX) minX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y > maxY) maxY = pt.y;
            hasValidChild = true;
          }
        }
      } catch (e) { }
    }

    if (hasValidChild && isFinite(minX) && isFinite(minY)) {
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
  }

  const tag = el.tagName?.toLowerCase();
  if (tag === 'image' || tag === 'rect' || tag === 'foreignobject') {
    const w = parseFloat(el.getAttribute('width') || '0');
    const h = parseFloat(el.getAttribute('height') || '0');
    if (w > 0 && h > 0) {
      const x = parseFloat(el.getAttribute('x') || '0');
      const y = parseFloat(el.getAttribute('y') || '0');
      return { x, y, width: w, height: h };
    }
  }

  return el.getBBox();
};

export const getCanvasBounds = (svgElement, baseWidth = 210, baseHeight = 297) => {
  const pW = baseWidth || 210;
  const pH = baseHeight || 297;

  let svgW = pW, svgH = pH;
  if (svgElement) {
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        svgW = parts[2];
        svgH = parts[3];
      }
    }
  }

  const scaleX = svgW / pW;
  const scaleY = svgH / pH;

  // Dynamically scale canvas width to match actual MainEditor container viewport aspect ratio exactly
  let aspect = 1.6;
  const containerEl = typeof document !== 'undefined' ? document.getElementById('main-zoom-container')?.parentElement : null;
  if (containerEl && containerEl.clientWidth > 0 && containerEl.clientHeight > 0) {
    aspect = Math.max(1.0, containerEl.clientWidth / containerEl.clientHeight);
  } else if (typeof window !== 'undefined' && window.innerWidth > 0 && window.innerHeight > 0) {
    const availW = window.innerWidth * 0.8;
    const availH = window.innerHeight * 0.78;
    if (availH > 0) aspect = Math.max(1.0, availW / availH);
  }

  const canvasHeightMM = 1000;
  const canvasWidthMM = Math.max(1000, Math.round(1000 * aspect));

  const extraLeftMM = Math.max(0, (canvasWidthMM - pW) / 2);
  const extraRightMM = Math.max(0, (canvasWidthMM - pW) / 2);
  const extraTopMM = Math.max(0, (canvasHeightMM - pH) / 2);
  const extraBottomMM = Math.max(0, (canvasHeightMM - pH) / 2);

  const minX = -extraLeftMM * scaleX;
  const maxX = svgW + extraRightMM * scaleX;
  const minY = -extraTopMM * scaleY;
  const maxY = svgH + extraBottomMM * scaleY;

  return { minX, maxX, minY, maxY, extraLeftMM, extraRightMM, extraTopMM, extraBottomMM, scaleX, scaleY, pW, pH, svgW, svgH, canvasWidthMM, canvasHeightMM };
};


// Global style to ensure injected SVGs always fill their container perfectly
const svgGlobalStyles = `
  .page-svg-container svg:not(.svg-icon-override) {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    shape-rendering: geometricPrecision !important;
    text-rendering: geometricPrecision !important;
  }

  .page-svg-container.trim-view-on,
  .page-svg-container.trim-view-on svg {
    overflow: hidden !important;
  }

  /* ============================================
     CONVERTED FLIPBOOK (PDF, DOC, PPT) PROTECTION
     ============================================ */
  .page-svg-container.is-pdf-project svg [data-name="PDF Background"],
  .page-svg-container.is-pdf-project svg [data-name="PDF Background"] *,
  .page-svg-container.is-pdf-project svg [data-type="pdf-vector-layer"],
  .page-svg-container.is-pdf-project svg [data-type="pdf-vector-layer"] *,
  .page-svg-container.is-pdf-project svg [data-name="Overlay"],
  .page-svg-container.is-pdf-project svg > g[data-type="frame"],
  .is-pdf-project svg [data-name="PDF Background"],
  .is-pdf-project svg [data-name="PDF Background"] *,
  .is-pdf-project svg [data-type="pdf-vector-layer"],
  .is-pdf-project svg [data-type="pdf-vector-layer"] *,
  .is-pdf-project svg [data-name="Overlay"],
  .is-pdf-project svg > g[data-type="frame"] {
    pointer-events: none !important;
  }

  .page-svg-container.is-pdf-project svg [data-name="Free Frame"],
  .page-svg-container.is-pdf-project svg [data-name="Free Frame"] *,
  .page-svg-container.is-pdf-project svg [data-is-hotspot="true"],
  .page-svg-container.is-pdf-project svg [data-is-hotspot="true"] *,
  .page-svg-container.is-pdf-project svg [data-type="hotspot"],
  .page-svg-container.is-pdf-project svg [data-type="hotspot"] *,
  .page-svg-container.is-pdf-project svg [data-type="shape"],
  .page-svg-container.is-pdf-project svg [data-type="shape"] *,
  .page-svg-container.is-pdf-project svg [data-type="icon"],
  .page-svg-container.is-pdf-project svg [data-type="icon"] *,
  .page-svg-container.is-pdf-project svg [data-name="Document Shield"],
  .page-svg-container.is-pdf-project svg [data-type="shield"],
  .is-pdf-project svg [data-name="Free Frame"],
  .is-pdf-project svg [data-name="Free Frame"] *,
  .is-pdf-project svg [data-is-hotspot="true"],
  .is-pdf-project svg [data-is-hotspot="true"] *,
  .is-pdf-project svg [data-type="hotspot"],
  .is-pdf-project svg [data-type="hotspot"] *,
  .is-pdf-project svg [data-type="shape"],
  .is-pdf-project svg [data-type="shape"] *,
  .is-pdf-project svg [data-type="icon"],
  .is-pdf-project svg [data-type="icon"] *,
  .is-pdf-project svg [data-name="Document Shield"],
  .is-pdf-project svg [data-type="shield"] {
    pointer-events: auto !important;
  }

  .page-svg-container.trim-view-off,
  .page-svg-container.trim-view-off svg {
    overflow: visible !important;
  }

  /* ============================================
     FIGMA-STYLE FRAME SELECTION SYSTEM
     ============================================ */

  /* Global SVG Interaction Prevention */
  .page-svg-container svg {
    user-select: none !important;
    -webkit-user-select: none !important;
  }

  /* Hide regular selection overlays when Crop Modal is open */
  body.crop-modal-active .overlay-type-selected,
  body.crop-modal-active .overlay-type-hover,
  body.crop-modal-active .overlay-type-child-hover,
  body.crop-modal-active .overlay-type-child-selected,
  body.crop-modal-active .selection-handle {
    display: none !important;
    pointer-events: none !important;
  }

  /* Hide ONLY the specific image that is actively being cropped to prevent ghosting */
  body.crop-modal-active .page-svg-container svg [data-cropping="true"] {
    opacity: 0 !important;
  }

  .page-svg-container svg text,
  .page-svg-container svg tspan {
    user-select: none !important;
    -webkit-user-select: none !important;
    pointer-events: auto !important;
  }

  .page-svg-container svg * {
    cursor: default;
  }

  .page-svg-container svg text,
  .page-svg-container svg tspan {
    user-select: none !important;
    -webkit-user-select: none !important;
    cursor: inherit;
  }

  /* Allow text selection when editing */
  .page-svg-container svg [contenteditable="true"],
  .page-svg-container svg foreignObject[data-editing="true"] {
    user-select: text !important;
    -webkit-user-select: text !important;
    cursor: ${TYPE_CURSOR} !important;
    outline: none;
  }

  div.text-edit-box {
    outline: none !important;
    background: transparent !important;
    background-clip: padding-box !important;
  }

  /* 1. HOVER state — blue outline on the topmost frame candidate */
  /* Replaced visually by exact overlaid SVG shapes */
  .page-svg-container svg [data-hovered="true"] {}

  /* 2. SELECTED frame — solid thick indigo outline + glow */
  .page-svg-container svg [data-selected="true"] {}

  /* 3. ENTERED FRAME indicator — when user has "entered" this frame,
        show it with a thin dashed blue border (like Figma's current frame) */
  .page-svg-container svg [data-frame-entered="true"] {}

  /* 4. CHILD HOVER inside an entered frame — dotted outline for child candidates */
  .page-svg-container svg [data-child-hovered="true"] {}

  /* 5. CHILD SELECTED inside an entered frame — same solid selection look */
  .page-svg-container svg [data-child-selected="true"] {}

  /* 7. Dragging State - Allowed Shadow */
  .page-svg-container svg [data-dragging="true"] {}

  /* 8. Direct Selection Tool Cursor */
  .page-svg-container.tool-direct svg * {
    cursor: ${DIRECT_CURSOR} !important;
  }

  /* 9. Fixed Overlay Prevention - changed to allow interaction */
  .page-svg-container svg [data-name="Overlay"] {
    pointer-events: auto !important;
    cursor: default;
  }

  /* 10. Pencil Tool Cursor */
  .page-svg-container.pencil-mode svg,
  .page-svg-container.pencil-mode svg *,
  .page-svg-container.pencil-mode svg [data-name="Overlay"] {
    cursor: ${PENCIL_CURSOR} !important;
  }

  /* 10a. Pen Tool Cursor & Variants ────────── */
  .page-svg-container.pen-mode svg,
  .page-svg-container.pen-mode svg *,
  .page-svg-container.pen-mode svg [data-name="Overlay"] {
    cursor: ${PEN_CURSOR} !important;
  }
  .page-svg-container.pen-mode.cur-pen-close svg,
  .page-svg-container.pen-mode.cur-pen-close svg *,
  .page-svg-container.pen-mode.cur-pen-close svg [data-name="Overlay"] {
    cursor: ${CUR_PEN_CLOSE} !important;
  }
  .page-svg-container.pen-mode.cur-pen-extend svg,
  .page-svg-container.pen-mode.cur-pen-extend svg *,
  .page-svg-container.pen-mode.cur-pen-extend svg [data-name="Overlay"] {
    cursor: ${CUR_PEN_EXTEND} !important;
  }
  .page-svg-container.pen-mode.cur-snap svg,
  .page-svg-container.pen-mode.cur-snap svg *,
  .page-svg-container.pen-mode.cur-snap svg [data-name="Overlay"] {
    cursor: ${CUR_SNAP} !important;
  }

  /* 10b. Shape Tool Cursor */
  .page-svg-container.shape-mode svg,
  .page-svg-container.shape-mode svg *,
  .page-svg-container.shape-mode svg [data-name="Overlay"] {
    cursor: ${SHAPE_CURSOR} !important;
  }

  /* 10c. Type Tool Cursor */
  .page-svg-container.type-mode svg,
  .page-svg-container.type-mode svg *,
  .page-svg-container.type-mode svg [data-name="Overlay"] {
    cursor: ${TYPE_CURSOR} !important;
  }

  /* 10d. Node Edit Mode Cursor (Direct Selection Arrow) */
  .page-svg-container.cur-node-edit,
  .page-svg-container.cur-node-edit svg,
  .page-svg-container.cur-node-edit svg *,
  .page-svg-container.cur-node-edit svg [data-name="Overlay"] {
    cursor: ${DIRECT_CURSOR} !important;
  }

  /* 11. Active Page Indicator - Glow/Shadow selection without solid border */
  .active-page-outline {
    outline: 2px solid #5145f6 !important;
    box-shadow: 0 0 10px rgba(16, 0, 188, 0.45) !important;
    z-index: 10 !important;
    transition: box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .pen-tool-node {
    pointer-events: none;
    filter: drop-shadow(0 0 1px rgba(0,0,0,0.2));
    transition: all 0.1s ease;
  }

  /* Video & Iframe Scaling Fixes */
  foreignObject video {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
    border: none !important;
    outline: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    pointer-events: auto !important;
  }
  foreignObject iframe {
    display: block !important;
    border: none !important;
    outline: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    pointer-events: auto !important;
    transform-origin: 0 0 !important;
  }
  foreignObject[data-type="video"] {
    overflow: hidden !important;
    pointer-events: auto !important;
  }
  foreignObject[data-type="video"] * {
    pointer-events: auto !important;
  }

  .hide-controls::-webkit-media-controls {
    display: none !important;
  }
  .hide-controls {
    pointer-events: none !important;
  }

  /* Global Resize Cursor Lock */
  body.resizing-active, 
  body.resizing-active * {
    cursor: var(--resizing-cursor, inherit) !important;
  }

  /* Free Frame rects must always catch pointer events for hover/selection, 
     even when fill and stroke are transparent (SVG default is visiblePainted which skips transparent elements) */
  .page-svg-container svg rect[data-name="Free Frame"] {
    pointer-events: all !important;
    transition: fill 0.2s ease, stroke 0.2s ease;
  }

  /* By default, hide Free Frame completely (transparent stroke and fill) unless drawing */
  .page-svg-container svg rect[data-name="Free Frame"]:not([data-drawing="true"]) {
    stroke: transparent !important;
    fill: transparent !important;
  }

  /* On Hover: show light indigo fill (but NOT when selected) */
  .page-svg-container svg rect[data-name="Free Frame"]:not([data-drawing="true"]):not([data-selected-frame="true"]):hover,
  .page-svg-container svg rect[data-name="Free Frame"]:not([data-drawing="true"]):not([data-selected-frame="true"])[data-hovered="true"],
  .page-svg-container svg rect[data-name="Free Frame"]:not([data-drawing="true"]):not([data-selected-frame="true"])[data-child-hovered="true"] {
    fill: rgba(99, 102, 241, 0.3) !important;
  }

  /* Hide Free Frames completely in non-interaction/animation mode, but keep visible while being drawn */
  .page-svg-container.hide-free-frames [data-name="Free Frame"]:not([data-drawing="true"]) {
    display: none !important;
  }
`;
import CanvasRuler from './CanvasRuler';
import GuidesOverlay from './GuidesOverlay';
import TopToolbar from './TopToolbar';

const SelectionTooltip = () => null;





const CurveIcon = ({ width, height, className }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} overflow-visible`}>
    <path d="M2.5 22.9995C4 17.5007 10.5 26.5 11.5 22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M15.6926 4.29545H7.30629M15.6926 4.29545L17.0904 1.5H5.90856L7.30629 4.29545M15.6926 4.29545L18.954 10.8182L11.4995 22L4.04492 10.8182L7.30629 4.29545" stroke="currentColor" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="round" />
    <path d="M11.5 21.9989V12.2148" stroke="currentColor" strokeWidth="1" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.897 10.8196L11.4993 9.42188L10.1016 10.8196L11.4993 12.2164L12.897 10.8196Z" stroke="currentColor" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="round" />
  </svg>
);

const syncDOM = (oldNode, newNode) => {
  if (!oldNode || !newNode) return;
  if (oldNode.nodeType !== newNode.nodeType || oldNode.nodeName !== newNode.nodeName) {
    oldNode.replaceWith(newNode.cloneNode(true));
    return;
  }
  if (oldNode.nodeType === Node.TEXT_NODE) {
    if (oldNode.nodeValue !== newNode.nodeValue) {
      oldNode.nodeValue = newNode.nodeValue;
    }
    return;
  }

  const oldAttrs = oldNode.attributes;
  const newAttrs = newNode.attributes;

  if (oldAttrs && newAttrs) {
    for (let i = oldAttrs.length - 1; i >= 0; i--) {
      const name = oldAttrs[i].name;
      if (!newNode.hasAttribute(name)) {
        oldNode.removeAttribute(name);
      }
    }
    for (let i = 0; i < newAttrs.length; i++) {
      const name = newAttrs[i].name;
      const val = newAttrs[i].value;
      if (oldNode.getAttribute(name) !== val) {
        oldNode.setAttribute(name, val);
      }
    }
  }

  const oldChildren = Array.from(oldNode.childNodes);
  const newChildren = Array.from(newNode.childNodes);
  const maxLength = Math.max(oldChildren.length, newChildren.length);
  for (let i = 0; i < maxLength; i++) {
    if (!oldChildren[i]) {
      oldNode.appendChild(newChildren[i].cloneNode(true));
    } else if (!newChildren[i]) {
      oldNode.removeChild(oldChildren[i]);
    } else {
      syncDOM(oldChildren[i], newChildren[i]);
    }
  }
};

const MainEditor = ({
  isPdfProject,
  isRulerEnabled = true,
  isTrimView = false,
  pages = [],
  activePageIndex,
  setActivePageIndex,
  insertPageAfter,
  duplicatePage,
  clearPage,
  deletePage,
  onOpenTemplateModal,
  onAddFile,
  selectedLayerId,
  setSelectedLayerId,
  updatePageHtml,
  multiSelectedIds = new Set(),
  setMultiSelectedIds,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  currentFrameId,
  setCurrentFrameId,
  activeMainTool,
  setActiveMainTool,
  activeTopTool,
  setActiveTopTool,
  updateElementAttribute,
  flipbookDimensions = null,
  isPopupEditor = false
}) => {
  usePreventBrowserZoom();
  const toast = useToast();
  const { width: baseWidth, height: baseHeight } = flipbookDimensions || { width: 210, height: 297 };
  const canvasAspectRatio = baseWidth && baseHeight ? `${baseWidth} / ${baseHeight}` : '210 / 297';

  const [showSelectOptions, setShowSelectOptions] = useState(false);
  const [showPenOptions, setShowPenOptions] = useState(false);
  const [showShapesOptions, setShowShapesOptions] = useState(false);
  const [localTrimView, setLocalTrimView] = useState(isTrimView);

  useEffect(() => {
    setLocalTrimView(isTrimView);
  }, [isTrimView]);

  useEffect(() => {
    const handleToggleTrim = (e) => {
      if (e.detail !== undefined) {
        setLocalTrimView(e.detail);
      } else {
        setLocalTrimView(prev => !prev);
      }
    };
    window.addEventListener('editor_toggleTrimView', handleToggleTrim);
    return () => window.removeEventListener('editor_toggleTrimView', handleToggleTrim);
  }, []);

  // Robustly ensure multi-selection dotted outlines are removed when selection is no longer multiple
  useEffect(() => {
    if (multiSelectedIds && multiSelectedIds.size <= 1) {
      document.querySelectorAll('.overlay-type-multi-child-selected').forEach(el => el.remove());
    }
  }, [multiSelectedIds]);
  // isEditingText is now managed via isEditingTextRef to prevent React re-renders from destroying the edit box

  const [selectedSelectTool, setSelectedSelectTool] = useState('select'); // 'select' or 'direct'
  const [selectedPenTool, setSelectedPenTool] = useState('pen'); // 'pen', 'curve', 'pencil'
  const [showHotspotPopup, setShowHotspotPopup] = useState(false);
  const [selectedShapeTool, setSelectedShapeTool] = useState('rectangle'); // 'rectangle', 'circle', 'polygon', 'line', 'star'
  const [zoom, setZoom] = useState(90);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null); // Track which page's menu is open
  const [rotation, setRotation] = useState(0);
  const [pageInputVal, setPageInputVal] = useState('');
  const [isEditingPage, setIsEditingPage] = useState(false);

  const isConvertedFlipbook = Boolean(isPdfProject || (pages && pages.some(p => p.html && (p.html.includes('PDF Background') || p.html.includes('pdf-vector-layer') || p.html.includes('Document Shield')))));

  const pdfDefaultsSetRef = useRef(false);
  useEffect(() => {
    if (isConvertedFlipbook) {
      if (!pdfDefaultsSetRef.current) {
        if (setActiveTopTool) setActiveTopTool('interaction');
        pdfDefaultsSetRef.current = true;
      }
      if (marqueeOverlayRef1.current) marqueeOverlayRef1.current.style.display = 'none';
      if (marqueeOverlayRef2.current) marqueeOverlayRef2.current.style.display = 'none';
      if (multiSelectedIds && multiSelectedIds.size > 0 && setMultiSelectedIds) {
        setMultiSelectedIds(new Set());
      }
      document.querySelectorAll('.overlay-type-multi-child-selected').forEach(el => el.remove());
      const boundsPoly = document.getElementById('overlay-poly-selected-multi-selection-bounds');
      if (boundsPoly) boundsPoly.remove();
    }
  }, [isConvertedFlipbook, setActiveTopTool]);

  // ── Refs ─────────────────────────────────────────────────────────────
  const isCtrlPressedRef = useRef(false);
  const paperScopeRef = useRef(null);
  const currentFrameIdRef = useRef(null);
  const marqueeRef = useRef(null);
  const marqueeOverlayRef1 = useRef(null);
  const marqueeOverlayRef2 = useRef(null);
  const marqueeCandidatesRef = useRef([]);
  const marqueeDataRef = useRef({ startX: 0, startY: 0, containerRect: null, scale: 1 });
  const multiSelectedIdsRef = useRef(new Set());
  const selectedLayerIdRef = useRef(null);
  const dragStateRef = useRef(null);
  const suppressClickRef = useRef(false);
  const lastWheelTimeRef = useRef(0);       // ← tracks last Ctrl+scroll time to suppress spurious clicks
  const wasRecentlyPanningRef = useRef(false); // ← tracks recent Space pan to suppress spurious clicks
  const isAltPressedRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0, target: null });
  const drawMeasurementOverlayRef = useRef(null);
  const activeMainToolRef = useRef(activeMainTool);
  const activeTopToolRef = useRef(activeTopTool);
  const selectedSelectToolRef = useRef(selectedSelectTool);
  const isSpaceDownRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef({ x: 0, y: 0 });
  const currentPanRef = useRef({ x: 0, y: 0 });
  const currentZoomRef = useRef(90);
  const wheelRafRef = useRef(null);
  const zoomContainerRef = useRef(null);
  const selectedPenToolRef = useRef(selectedPenTool);
  const vectraPenSessionRef = useRef(new VectraPenSession());
  const drawingPathRef = useRef(null);
  const drawingVectraPathIdRef = useRef(null); // tracks which vSession path id the current drawingPathRef SVG element represents
  const drawingPointsRef = useRef([]);
  const isFreehandDrawingRef = useRef(false);
  const drawingPageIndexRef = useRef(null);
  const drawingSvgRef = useRef(null);
  const drawingShapeRef = useRef(null);
  const shapeStartPointRef = useRef(null);
  const skipClearSelectionRef = useRef(false);
  const lastClickRef = useRef({ time: 0, target: null });
  const draggedNodeIndexRef = useRef({ pIdx: -1, ptIdx: -1 });
  const bendingStateRef = useRef(null);
  const drawingSubPathsRef = useRef([]);
  const drawingSubPathElsRef = useRef([]);
  const activeBendingSegmentRef = useRef(null);
  const handleDraggingStateRef = useRef(null);
  const clickTimerRef = useRef(null);
  const updatePageHtmlRef = useRef(updatePageHtml);
  const editorContainerRef = useRef(null);
  const isEditingTextRef = useRef(false);
  const lastRenderedHtmlRef = useRef({});
  // ── Node Edit Mode Refs ─────────────────────────────────────────────────────
  const nodeEditModeRef = useRef(false);          // true when in node edit mode
  const nodeEditPathRef = useRef(null);           // the <path> element being edited
  const nodeEditPageIndexRef = useRef(null);      // page index of node edit path
  const nodeEditPaperPathRef = useRef(null);      // paper.js Path for the element
  const nodeEditDragRef = useRef(null);           // { mode, segIdx, handleSide, startPt }
  const nodeEditSelectedSegIdxRef = useRef(null); // primary selected node index
  const nodeEditSelectedSegIndicesRef = useRef(new Set()); // set of multi-selected node indices
  const nodeEditSelectedHandleSideRef = useRef(null); // active selected handle side: 'in', 'out', 'point', or 'line'
  const nodeEditSelectedCurveIdxRef = useRef(null); // active selected curve segment index
  const nodeEditHoverCurveIdxRef = useRef(-1); // active hovered curve segment index
  const nodeEditSplitSegIdxRef = useRef(null); // active split point index (highlighted in RED)
  // Stores screen-space {x, y, segIdx, handleSide} for each visible node, updated on every drawNodeEditOverlay call
  const nodeEditScreenNodesRef = useRef([]);
  // Stores screen-space segment midpoints for segment hit testing: {curveIdx, mx, my, seg1Idx, seg2Idx}
  const nodeEditScreenSegmentsRef = useRef([]);
  // Stores active handle retract/delete state for RED highlight indicator: { segIdx, handleSide, isReadyToDelete }
  const nodeEditRetractHandleRef = useRef(null);

  const createPaperPath = (d) => {
    if (!paperScopeRef.current || !d) return null;
    paperScopeRef.current.activate();
    const mCount = (d.match(/M/gi) || []).length;
    if (mCount > 1) {
      return new paperScopeRef.current.CompoundPath(d);
    }
    return new paperScopeRef.current.Path(d);
  };

  const convertPaperSegmentToVectraNode = (seg) => {
    const node = makeNode(seg.point.x, seg.point.y);
    const hasIn = seg.handleIn && !seg.handleIn.isZero();
    const hasOut = seg.handleOut && !seg.handleOut.isZero();

    if (hasIn) {
      node.in = { x: seg.handleIn.x, y: seg.handleIn.y };
    }
    if (hasOut) {
      node.out = { x: seg.handleOut.y, y: seg.handleOut.y };
    }

    if (seg.nodeType) {
      node.type = seg.nodeType;
    } else if (hasIn && hasOut) {
      const normIn = seg.handleIn.normalize();
      const normOut = seg.handleOut.normalize();
      const dot = normIn.dot(normOut);
      if (dot < -0.90) {
        const diff = Math.abs(seg.handleIn.length - seg.handleOut.length);
        node.type = diff < 4.0 ? 'symmetric' : 'smooth';
      } else {
        node.type = 'cusp';
      }
    } else if (hasIn || hasOut) {
      node.type = 'cusp';
    } else {
      node.type = 'corner';
    }
    return node;
  };

  const parseSvgPathD = (d) => {
    if (!d || !d.trim()) return [];
    const tokens = d.match(/([a-df-zA-DF-Z])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/g);
    if (!tokens) return [];

    const subpaths = [];
    let currentSubpath = null;
    let cmd = '';
    let i = 0;
    let currX = 0, currY = 0;

    while (i < tokens.length) {
      let token = tokens[i];
      if (/^[a-zA-Z]$/.test(token)) {
        cmd = token;
        i++;
      }

      if (cmd === 'M' || cmd === 'm') {
        const isRel = cmd === 'm';
        let x = parseFloat(tokens[i++]);
        let y = parseFloat(tokens[i++]);
        if (isNaN(x) || isNaN(y)) break;
        if (isRel) { x += currX; y += currY; }
        currX = x; currY = y;

        currentSubpath = { nodes: [makeNode(x, y, 'corner')], closed: false };
        subpaths.push(currentSubpath);
        cmd = isRel ? 'l' : 'L';
      } else if (cmd === 'L' || cmd === 'l') {
        const isRel = cmd === 'l';
        let x = parseFloat(tokens[i++]);
        let y = parseFloat(tokens[i++]);
        if (isNaN(x) || isNaN(y)) break;
        if (isRel) { x += currX; y += currY; }
        currX = x; currY = y;
        if (currentSubpath) {
          currentSubpath.nodes.push(makeNode(x, y, 'corner'));
        }
      } else if (cmd === 'C' || cmd === 'c') {
        const isRel = cmd === 'c';
        let x1 = parseFloat(tokens[i++]), y1 = parseFloat(tokens[i++]);
        let x2 = parseFloat(tokens[i++]), y2 = parseFloat(tokens[i++]);
        let x = parseFloat(tokens[i++]), y = parseFloat(tokens[i++]);
        if (isNaN(x) || isNaN(y)) break;
        if (isRel) {
          x1 += currX; y1 += currY;
          x2 += currX; y2 += currY;
          x += currX; y += currY;
        }
        if (currentSubpath && currentSubpath.nodes.length > 0) {
          const prevNode = currentSubpath.nodes[currentSubpath.nodes.length - 1];
          prevNode.out = { x: x1 - prevNode.x, y: y1 - prevNode.y };
          prevNode.type = 'smooth';

          const newNode = makeNode(x, y, 'smooth');
          newNode.in = { x: x2 - x, y: y2 - y };
          currentSubpath.nodes.push(newNode);
        }
        currX = x; currY = y;
      } else if (cmd === 'Z' || cmd === 'z') {
        if (currentSubpath) {
          currentSubpath.closed = true;
        }
      } else {
        i++;
      }
    }
    return subpaths;
  };

  const loadDIntoVectraSession = (d, vSession, paperScope) => {
    vSession.reset();
    if (!d || !d.trim()) return;

    let parsedSubpaths = [];
    try {
      if (paperScope) {
        paperScope.activate();
        const mCount = (d.match(/M/gi) || []).length;
        const paperPath = mCount > 1
          ? new paperScope.CompoundPath(d)
          : new paperScope.Path(d);

        if (paperPath) {
          const contours = (paperPath.children && paperPath.children.length > 0)
            ? paperPath.children
            : [paperPath];

          contours.forEach(child => {
            if (!child.segments || child.segments.length === 0) return;
            const nodes = child.segments.map(seg => convertPaperSegmentToVectraNode(seg));
            parsedSubpaths.push({ nodes, closed: Boolean(child.closed) });
          });
        }
      }
    } catch (err) {
      console.warn('[loadDIntoVectraSession] Paper.js parse warning:', err);
    }

    if (parsedSubpaths.length === 0) {
      parsedSubpaths = parseSvgPathD(d);
    }

    parsedSubpaths.forEach(sub => {
      if (!sub.nodes || sub.nodes.length === 0) return;
      const vPath = makePath({ closed: sub.closed });
      vPath.nodes = sub.nodes;
      vSession.paths.set(vPath.id, vPath);
    });
  };

  const getLocalPoint = (svg, element, clientX, clientY) => {
    if (!svg || !element || typeof element.getScreenCTM !== 'function') {
      return { x: clientX, y: clientY };
    }
    try {
      const ctm = element.getScreenCTM();
      if (!ctm) return { x: clientX, y: clientY };
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const localPt = pt.matrixTransform(ctm.inverse());
      return { x: localPt.x, y: localPt.y };
    } catch (e) {
      return { x: clientX, y: clientY };
    }
  };

  const getHtmlToRender = (index, currentHtml) => {
    let clean = currentHtml || '';

    // Auto-fix for corrupted templates: strip out the pink XML parsererror and any baked-in custom controls
    if (clean.includes('parsererror') || clean.includes('id="custom-ctrl-')) {
      clean = clean.replace(/<parsererror[\s\S]*?<\/parsererror>/gi, '');
      clean = clean.replace(/<[^>]*id="custom-ctrl-[^>]*>.*?<\/[^>]*>/gi, '');
    }
    clean = clean.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');

    // Ensure invisible Document Shield exists above PDF Background in converted document pages
    if ((isConvertedFlipbook || clean.includes('PDF Background') || clean.includes('pdf-vector-layer')) && !clean.includes('data-name="Document Shield"')) {
      const bgStartMatch = clean.match(/<g\b[^>]*data-(?:name="PDF Background"|type="pdf-vector-layer")[^>]*>/i);
      if (bgStartMatch) {
        const startIndex = bgStartMatch.index;
        let depth = 0;
        let i = startIndex;
        let closeIndex = -1;
        while (i < clean.length) {
          if (clean.startsWith('<g', i) && (clean[i + 2] === ' ' || clean[i + 2] === '>')) {
            depth++;
            i += 2;
          } else if (clean.startsWith('</g>', i) || clean.startsWith('</svg:g>', i)) {
            depth--;
            const tagLen = clean.startsWith('</svg:g>', i) ? 8 : 4;
            if (depth === 0) {
              closeIndex = i + tagLen;
              break;
            }
            i += tagLen;
          } else {
            i++;
          }
        }
        if (closeIndex !== -1) {
          const vbMatch = clean.match(/viewBox=["']\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*["']/i);
          const wVal = vbMatch ? vbMatch[3] : '100%';
          const hVal = vbMatch ? vbMatch[4] : '100%';
          const shieldStr = `\n    <rect id="shield-page-${index}" data-name="Document Shield" data-type="shield" x="0" y="0" width="${wVal}" height="${hVal}" fill="none" opacity="0" pointer-events="all" style="pointer-events: all;" />`;
          clean = clean.slice(0, closeIndex) + shieldStr + clean.slice(closeIndex);
        }
      }
    }

    if (isEditingTextRef.current && lastRenderedHtmlRef.current[index]) {
      return lastRenderedHtmlRef.current[index];
    }
    lastRenderedHtmlRef.current[index] = clean;
    return clean;
  };

  useEffect(() => {
    activeTopToolRef.current = activeTopTool;
    if (activeTopTool === 'interaction' || activeTopTool === 'animation') {
      if (marqueeOverlayRef1.current) marqueeOverlayRef1.current.style.display = 'none';
      if (marqueeOverlayRef2.current) marqueeOverlayRef2.current.style.display = 'none';
      if (marqueeDataRef.current) marqueeDataRef.current = null;
      setMarquee(null);
      if (multiSelectedIds && multiSelectedIds.size > 1 && setMultiSelectedIds) {
        setMultiSelectedIds(new Set(selectedLayerId ? [selectedLayerId] : []));
      }
      document.querySelectorAll('.overlay-type-multi-child-selected').forEach(el => el.remove());
      const boundsPoly = document.getElementById('overlay-poly-selected-multi-selection-bounds');
      if (boundsPoly) boundsPoly.remove();
    }
  }, [activeTopTool, selectedLayerId, multiSelectedIds, setMultiSelectedIds]);

  useEffect(() => {
    paperScopeRef.current = new paper.PaperScope();
    paperScopeRef.current.setup(document.createElement('canvas'));

    const handleKeyDown = (e) => {
      // 1. Skip shortcuts if user is typing
      if (document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        isEditingTextRef.current ||
        document.activeElement.isContentEditable) return;

      const key = e.key.toLowerCase();

      // ── Restrict shortcuts in non-editor modes ─────────────────
      if (activeTopTool !== 'editor') {
        const isSelectionKey = key === 'v' || key === 'a' || key === ' ';
        if (!isSelectionKey) return;
      }

      // ── Spacebar Pan ─────────────
      if (key === ' ' && !isSpaceDownRef.current) {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || isEditingTextRef.current || document.activeElement.isContentEditable) return;
        e.preventDefault();
        // Blur any focused interactive element (buttons, etc.) so Space doesn't
        // re-trigger their click action on keyup.
        const active = document.activeElement;
        if (active && active !== document.body && typeof active.blur === 'function') {
          active.blur();
        }
        isSpaceDownRef.current = true;
        setIsSpaceDown(true);
      }

      // ── Tool Shortcuts ─────────────
      // V for selection
      if (key === 'v' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setActiveMainTool('select');
        setSelectedSelectTool('select');
        closeAllDropdowns();
      }

      // A for direct tool
      if (key === 'a' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setActiveMainTool('select');
        setSelectedSelectTool('direct');
        closeAllDropdowns();
      }

      // P or Shift+P for pen tool
      if (key === 'p' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setActiveMainTool('pen');
        if (e.shiftKey) {
          setSelectedPenTool('pencil');
        } else {
          setSelectedPenTool('pen');
        }
        closeAllDropdowns();
      }

      // ── Ctrl detection ──
      if (e.key === 'Control' && !isCtrlPressedRef.current) {
        isCtrlPressedRef.current = true;
      }

      if (e.key === 'Alt') {
        e.preventDefault();
        if (!isAltPressedRef.current) {
          isAltPressedRef.current = true;
          document.querySelectorAll('.overlay-type-hover, .overlay-type-child-hover').forEach(el => el.remove());
          if (lastMousePosRef.current && drawMeasurementOverlayRef.current) {
            let currentTarget = lastMousePosRef.current.target;
            // If the SVG re-rendered, the old target might be detached from the DOM.
            // Get the fresh element currently at the mouse coordinates.
            if (currentTarget && !document.contains(currentTarget)) {
              currentTarget = document.elementFromPoint(lastMousePosRef.current.x, lastMousePosRef.current.y) || currentTarget;
              lastMousePosRef.current.target = currentTarget;
            }
            drawMeasurementOverlayRef.current(currentTarget, lastMousePosRef.current.x, lastMousePosRef.current.y);
          }
        }
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === ' ') {
        isSpaceDownRef.current = false;
        setIsSpaceDown(false);
        isPanningRef.current = false;
      }
      if (e.key === 'Control') {
        isCtrlPressedRef.current = false;
      }
      if (e.key === 'Alt') {
        e.preventDefault();
        isAltPressedRef.current = false;
        document.querySelectorAll('.measurement-overlay-group').forEach(el => el.remove());
      }
    };

    const handleWindowBlur = () => {
      isAltPressedRef.current = false;
      document.querySelectorAll('.measurement-overlay-group').forEach(el => el.remove());
    };

    // Use capture phase so our Space handler fires BEFORE the focused button's
    // native Space-activates-button handler — ensuring preventDefault() works.
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    // Cleanup to prevent leaks
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [activeTopTool]);

  // ── Global Slideshow UI Manager ───────────────────────────────────────────
  // Maintains pagination dots and hover arrows for all slideshows even when not selected
  useEffect(() => {
    const renderOverlays = () => {
      const slideshows = document.querySelectorAll('[data-is-slideshow="true"]');
      slideshows.forEach(el => {
        // Skip if selected (SlideshowProperties handles it)
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
          const bbox = getVisualBBox(el);
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
            ['prev', 'next'].forEach(type => {
              const btn = document.createElement('button');
              btn.className = 'editor-ss-nav editor-ss-nav-' + type;
              const size = 48 * scaleFactor;
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
              const svgSize = 32 * scaleFactor;

              // We'll use a container inside the button for React to render into
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
              // Default to style 1 if navStyle is missing
              const styleId = settings.navStyle || 1;
              root.render(NavIconRenderer({ styleId, size: svgSize + 'px', color: navIconColor })[iconKey]);

              // Attach the root to the btn so we can clean it up later if needed
              btn._reactRoot = root;

              // btn.addEventListener('mouseenter', () => btn.style.transform = `translateY(-50%) scale(1.25)`);
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
            let dotsWrap = overlay.querySelector('.editor-ss-dots-wrap');
            if (!dotsWrap) {
              dotsWrap = document.createElement('div');
              dotsWrap.className = 'editor-ss-dots-wrap';
              Object.assign(dotsWrap.style, {
                position: 'absolute',
                bottom: (8 * scaleFactor) + 'px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: (5 * scaleFactor) + 'px',
                alignItems: 'center',
                pointerEvents: 'auto',
              });
              overlay.appendChild(dotsWrap);
            }

            if (!dotsWrap._reactRoot) {
              dotsWrap._reactRoot = createRoot(dotsWrap);
            }

            const dotStyleId = settings.dotStyle || 1;
            const dotsSig = `${dotStyleId}-${activeIndex}-${images.length}-${dotColor}-${scaleFactor.toFixed(2)}`;

            if (dotsWrap._lastSig !== dotsSig) {
              dotsWrap._lastSig = dotsSig;
              dotsWrap._reactRoot.render(
                <DotRenderer
                  styleId={dotStyleId}
                  size={`${Math.max(6, 8 * scaleFactor)}px`}
                  color={dotColor || '#000000'}
                  activeIndex={activeIndex}
                  count={images.length}
                  onDotClick={(e, i) => {
                    e.stopPropagation(); e.preventDefault();
                    const current = parseInt(el.getAttribute('data-active-index') || '0');
                    if (i === current) return;
                    el.setAttribute('data-active-index', i.toString());
                    el._lastSlideTime = Date.now();

                    const evt = new CustomEvent('force-slideshow-advance', { detail: { el, nextIndex: i } });
                    window.dispatchEvent(evt);
                  }}
                />
              );
            }
          }
        }

        // Sync state continuously
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
  }, []);

  // ── Global Slideshow Runner ───────────────────────────────────────────────
  // Ensures all slideshows on the template slide automatically even when not selected.
  // This logic runs independently for every element with [data-is-slideshow="true"].
  useEffect(() => {
    const globalSlideshowInterval = setInterval(() => {
      const slideshows = document.querySelectorAll('[data-is-slideshow="true"]');
      slideshows.forEach(el => {
        // Skip if manual control/overlay is active or if user is hovering (prevents conflicts)
        if (el._slideshowManual ||
          el._isHovering === true ||
          el.matches(':hover') ||
          (el._globalSsOverlay && el._globalSsOverlay.querySelector(':hover'))) return;

        try {
          const dataStr = el.getAttribute('data-slideshow');
          if (!dataStr) return;
          const data = JSON.parse(dataStr);
          const settings = data.settings || {};

          // Only auto-slide if enabled in settings
          if (!settings.autoPlay && !settings.autoSlide) return;

          const images = data.images || [];
          if (images.length <= 1) return;

          const speed = (settings.speed || 3) * 1000;
          const now = Date.now();
          const lastTime = el._lastSlideTime || 0;

          if (now - lastTime >= speed) {
            let currentIndex = parseInt(el.getAttribute('data-active-index') || '0');
            let nextIndex = (currentIndex + 1) % images.length;

            // If not infinite and reached end, stop
            if (nextIndex === 0 && settings.infiniteLoop === false && currentIndex !== 0) return;

            // Update DOM attributes
            el.setAttribute('data-active-index', nextIndex.toString());
            el._lastSlideTime = now;

            // ── Resolve the actual <image>/<img>, including SVG pattern fills ──
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
            if (elTag === 'image' || elTag === 'img') {
              imgEl = el;
            } else {
              // 1. Pattern fill on the element itself
              imgEl = _findImgInPattern(el);
              // 2. Direct child <image>/<img>
              if (!imgEl) imgEl = el.querySelector('image') || el.querySelector('img');
              // 3. Pattern fills on children
              if (!imgEl) {
                const childrenWithPatterns = el.querySelectorAll('[fill^="url(#"]');
                for (const child of Array.from(childrenWithPatterns)) {
                  const t = _findImgInPattern(child);
                  if (t) { imgEl = t; break; }
                }
              }
              // 4. Fallback to element itself
              if (!imgEl) imgEl = el;
            }

            const url = images[nextIndex]?.url;
            if (url && imgEl) {
              const imgTag = imgEl.tagName?.toLowerCase();
              if (imgTag === 'image') {
                imgEl.setAttribute('href', url);
                try { imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch (e) { }
              } else if (imgTag === 'img') {
                imgEl.src = url;
              } else {
                imgEl.style.backgroundImage = `url("${url}")`;
              }
            }
          }
        } catch (e) {
          // Silent catch for parse errors during rapid edits
        }
      });

      // ── Safety: clear stale data-slideshow-manual flags ──
      // If an overlay element is marked manual but no active editor overlay div exists,
      // the flag was left behind when the properties panel closed unexpectedly. Clear it.
      if (!document.querySelector('.editor-ss-overlay')) {
        document.querySelectorAll('[data-is-slideshow="true"]').forEach(el => {
          el._slideshowManual = false;
        });
      }
    }, 50); // Check every 50ms for accurate timing

    return () => clearInterval(globalSlideshowInterval);
  }, []);

  // ── Global Slideshow Manual Click Handler ─────────────────────────────────
  // Advances a slideshow to the next image on click (even when NOT selected).
  // Uses mousedown+mouseup in capture phase to avoid being blocked by
  // handleSvgClick's stopPropagation, and guards against drag-clicks.
  useEffect(() => {
    // Shared pattern-traversal helper (same logic as auto-runner above)
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

    // Track mouse-down position to distinguish clicks from drags
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
      } catch (err) {
        // Silent catch
      }
    };

    const handleMouseDown = (e) => {
      mdX = e.clientX;
      mdY = e.clientY;
    };

    const handleMouseUp = (e) => {
      // Ignore if mouse moved too much (drag, not click)
      if (Math.abs(e.clientX - mdX) > 5 || Math.abs(e.clientY - mdY) > 5) return;

      // Walk up using parentNode (works for SVG elements, unlike parentElement)
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

      // Defer to the live-runner overlay when the element is selected
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

  useEffect(() => {
    // Inject global styles for the progress bar thumb
    const thumbStyleId = 'global-custom-video-progress-style';
    if (!document.getElementById(thumbStyleId)) {
      const ts = document.createElement('style');
      ts.id = thumbStyleId;
      ts.textContent = `
        input.custom-video-progress {
          -webkit-appearance: none !important;
          appearance: none !important;
          accent-color: transparent !important;
        }
        input.custom-video-progress::-webkit-slider-thumb {
          -webkit-appearance: none !important;
          appearance: none !important;
          width: 6px !important;
          height: 6px !important;
          border-radius: 50% !important;
          background: #ffffff !important;
          cursor: pointer !important;
          box-shadow: none !important;
          border: none !important;
          margin-top: -2.5px !important;
        }
        input.custom-video-progress::-moz-range-thumb {
          width: 6px !important;
          height: 6px !important;
          border-radius: 50% !important;
          background: #ffffff !important;
          cursor: pointer !important;
          border: none !important;
          box-shadow: none !important;
        }
        input.custom-video-progress::-webkit-slider-runnable-track {
          height: 1px !important;
          background: rgba(255,255,255,0.4) !important;
          border-radius: 1px !important;
        }
        .custom-video-overlay {
          opacity: 0;
          background: transparent;
          transition: opacity 0.3s ease, background 0.3s ease !important;
        }
        .custom-video-overlay.is-paused,
        .custom-video-overlay.video-is-hovered,
        [id]:hover > .custom-video-overlay,
        [id]:hover > foreignObject > .custom-video-overlay,
        foreignObject:hover > .custom-video-overlay,
        .custom-video-overlay:hover {
          opacity: 1 !important;
          background: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.9) 100%) !important;
        }
      `;
      document.head.appendChild(ts);
    }

    let intervalId;
    const renderVideoControls = () => {
      // Disable native controls globally
      document.querySelectorAll('[data-page-index] video, foreignObject video').forEach(v => {
        if (!v.hasAttribute('data-custom-ctrl-active')) {
          v.controls = false;
          v.removeAttribute('controls');
        }
      });

      const videos = document.querySelectorAll('.page-svg-container video');
      videos.forEach(video => {
        const fo = video.closest('foreignObject');
        const liveEl = fo ? (fo.closest('[id]') || fo) : (video.closest('[id]') || video);
        const layerId = liveEl.id;
        if (!layerId) return;

        const showControls = video.getAttribute('data-show-controls') !== 'false';

        // APPLY CUSTOM VIDEO PROPERTIES
        const pbSpeedStr = video.getAttribute('data-playback-speed');
        if (pbSpeedStr) {
          const pbSpeed = parseFloat(pbSpeedStr.replace('x', ''));
          if (!isNaN(pbSpeed)) video.playbackRate = pbSpeed;
        }

        if (!video.hasAttribute('data-video-props-applied')) {
          video.setAttribute('data-video-props-applied', 'true');

          const defVolStr = video.getAttribute('data-default-volume');
          if (defVolStr) {
            video.volume = parseInt(defVolStr) / 100;
          }

          const startTimeAttr = video.getAttribute('data-start-time');
          let sTime = 0;
          if (startTimeAttr) {
            const parts = startTimeAttr.split(':').map(Number);
            if (parts.length === 3) sTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
            else if (parts.length === 2) sTime = parts[0] * 60 + parts[1];
          }
          const endTimeAttr = video.getAttribute('data-end-time');
          let eTime = Infinity;
          if (endTimeAttr) {
            const parts = endTimeAttr.split(':').map(Number);
            if (parts.length === 3) eTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
            else if (parts.length === 2) eTime = parts[0] * 60 + parts[1];
          }
          video._startTime = sTime;
          video._endTime = eTime;

          if (sTime > 0) {
            video.currentTime = sTime;
          }

          video.addEventListener('timeupdate', () => {
            if (video._startTime > 0 && video.currentTime < video._startTime - 0.5) {
              video.currentTime = video._startTime;
            }
            if (video._endTime < Infinity && video.currentTime >= video._endTime) {
              if (video.loop) {
                video.currentTime = video._startTime;
              } else {
                video.pause();
              }
            }
          });

          const resumeBehavior = video.getAttribute('data-resume-behavior');
          if (resumeBehavior === "Start from Beginning") {
            video.addEventListener('play', () => {
              if (video._wasPaused) {
                video.currentTime = video._startTime || 0;
              }
              video._wasPaused = false;
            });
            video.addEventListener('pause', () => {
              video._wasPaused = true;
            });
          }

          const playVideoWhile = video.getAttribute('data-play-video-while');
          if (video._prevPlayVideoWhile !== playVideoWhile) {
            video._prevPlayVideoWhile = playVideoWhile;
            if (playVideoWhile === "Auto Play While on Page" || playVideoWhile === "Auto Play on Page Open") {
              video.play().catch(() => { });
            } else if (playVideoWhile === "Click to Play" || playVideoWhile === "Manual (Click to Play)") {
              video.pause();
            }
          }
        }

        const ctrlId = `custom-ctrl-${layerId}`;
        let bar = document.getElementById(ctrlId);



        const mountPoint = video.parentElement || fo || liveEl;
        if (!mountPoint) return;

        // If bar exists but points to a different video, recreate it
        if (bar && bar._video !== video) {
          if (bar._cleanup) bar._cleanup();
          bar.remove();
          bar = null;
        }

        if (bar) {
          const repBtn = bar.querySelector('.custom-repeat-btn');
          if (repBtn) {
            repBtn.style.opacity = video.loop ? '1' : '0.5';
          }

          const topC = bar.querySelector('.custom-top-container');
          const centerC = bar.querySelector('.custom-center-container');
          const progC = bar.querySelector('.custom-prog-container');
          const timeW = bar.querySelector('.custom-time-wrapper');

          const volBtn = bar.querySelector('.custom-vol-btn');
          const rewindBtn = bar.querySelector('.custom-rewind-btn');
          const forwardBtn = bar.querySelector('.custom-forward-btn');
          const playBtn = bar.querySelector('.custom-play-btn');
          const fsBtn = bar.querySelector('.custom-fs-btn');
          const dlBtn = bar.querySelector('.custom-download-btn');

          const showPlayPause = video.getAttribute('data-show-play-pause') !== 'false';
          const showSkipButton = video.getAttribute('data-show-skip-button') !== 'false';
          const showProgressBar = video.getAttribute('data-show-progress-bar') !== 'false';
          const showLoopButton = video.getAttribute('data-show-loop-button') !== 'false';
          const showFullscreenButton = video.getAttribute('data-show-fullscreen-button') !== 'false';
          const showVolumeControl = video.getAttribute('data-show-volume-control') !== 'false';
          const showDownloadButton = video.getAttribute('data-show-download-button') !== 'false';

          if (volBtn) volBtn.style.display = showVolumeControl ? '' : 'none';
          if (rewindBtn) rewindBtn.style.display = showSkipButton ? 'flex' : 'none';
          if (forwardBtn) forwardBtn.style.display = showSkipButton ? 'flex' : 'none';
          if (playBtn) playBtn.style.display = showPlayPause ? '' : 'none';
          if (repBtn) repBtn.style.display = showLoopButton ? '' : 'none';
          if (fsBtn) fsBtn.style.display = showFullscreenButton ? '' : 'none';
          if (dlBtn) dlBtn.style.display = showDownloadButton ? '' : 'none';
          if (progC) progC.style.display = showProgressBar ? '' : 'none';

          const showControls = video.getAttribute('data-show-controls') !== 'false';
          bar.style.display = (showControls || showPlayPause || showFullscreenButton || showDownloadButton) ? 'flex' : 'none';
        }

        if (!bar) {

          video.controls = false;
          video.removeAttribute('controls');
          video.setAttribute('data-custom-ctrl-active', 'true');

          if (mountPoint.style) {
            mountPoint.style.position = 'relative';
            if (!mountPoint._prevPointerEvents) {
              mountPoint._prevPointerEvents = mountPoint.style.pointerEvents || '';
            }
            mountPoint.style.pointerEvents = 'none';
          }

          if (!window._videoHoverTrackerAdded) {
            window._videoHoverTrackerAdded = true;
            window.addEventListener('pointermove', (e) => {
              document.querySelectorAll('.custom-video-overlay').forEach(b => {
                const rect = b.getBoundingClientRect();
                const isInside = e.clientX >= rect.left && e.clientX <= rect.right &&
                  e.clientY >= rect.top && e.clientY <= rect.bottom;
                if (isInside) {
                  b.classList.add('video-is-hovered');
                } else {
                  b.classList.remove('video-is-hovered');
                }
              });
            });
          }

          bar = document.createElement('div');
          bar.id = ctrlId;
          bar._video = video;
          bar.className = 'custom-video-overlay' + (video.paused ? ' is-paused' : '');
          Object.assign(bar.style, {
            position: 'absolute',
            top: '0',
            bottom: '0',
            left: '0',
            right: '0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '2% 3%',
            boxSizing: 'border-box',
            zIndex: '9999',
            pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.8) 100%)',
          });

          // Establish a base font-size linked to width for proportional scaling
          const ro = new ResizeObserver(entries => {
            for (let entry of entries) {
              const w = entry.contentRect.width || entry.target.offsetWidth;
              if (w > 0) {
                bar.style.fontSize = (w * 0.01) + 'px'; // 1% of width = 1em
              }
            }
          });
          ro.observe(bar);

          // Top Right: Volume
          const topContainer = document.createElement('div');
          topContainer.className = 'custom-top-container';
          Object.assign(topContainer.style, {
            display: 'flex',
            justifyContent: 'flex-end',
            width: '100%',
            pointerEvents: 'none',
          });

          const volumeBtn = document.createElement('button');
          volumeBtn.className = 'custom-vol-btn';
          Object.assign(volumeBtn.style, {
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0',
            width: '7em',
            height: '7em',
            pointerEvents: 'auto',
            opacity: '0.8',
          });

          const VOL_ON_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
          const VOL_OFF_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

          const updateVolumeIcon = () => {
            volumeBtn.innerHTML = (video.muted || video.volume === 0) ? VOL_OFF_SVG : VOL_ON_SVG;
          };
          updateVolumeIcon();

          volumeBtn.onclick = (e) => {
            e.stopPropagation();
            const isMuted = !video.muted;
            video.muted = isMuted;
            if (isMuted) {
              video.setAttribute('muted', '');
            } else {
              video.removeAttribute('muted');
            }
            updateVolumeIcon();
            if (setSelectedLayerId) setSelectedLayerId(layerId);
          };
          video.addEventListener('volumechange', updateVolumeIcon);
          topContainer.appendChild(volumeBtn);

          // Center: Rewind 3s, Forward 3s
          const centerContainer = document.createElement('div');
          centerContainer.className = 'custom-center-container';
          Object.assign(centerContainer.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0 2%',
            flexGrow: '1',
            pointerEvents: 'none',
            boxSizing: 'border-box'
          });

          const REWIND_ICON = `<svg width="5em" height="5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>`;
          const FORWARD_ICON = `<svg width="5em" height="5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>`;

          const rewindBtn = document.createElement('button');
          rewindBtn.className = 'custom-rewind-btn';
          Object.assign(rewindBtn.style, {
            background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', pointerEvents: 'auto', opacity: '0.9', whiteSpace: 'nowrap', position: 'relative'
          });
          const rewindTextWrapper = document.createElement('div');
          Object.assign(rewindTextWrapper.style, { width: '2.5em', height: '5em', position: 'relative', flexShrink: '0', marginLeft: '0.5em' });
          const rewindText = document.createElement('div');
          rewindText.textContent = "3s";
          Object.assign(rewindText.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 'max-content',
            fontSize: '10em',
            transform: 'translate(-50%, -50%) scale(0.35)',
            transformOrigin: 'center center',
            fontFamily: 'Inter, sans-serif',
            color: 'white',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          });
          rewindTextWrapper.appendChild(rewindText);
          rewindBtn.innerHTML = REWIND_ICON;
          rewindBtn.appendChild(rewindTextWrapper);
          rewindBtn.onclick = (e) => { e.stopPropagation(); video.currentTime -= 3; if (setSelectedLayerId) setSelectedLayerId(layerId); };

          const forwardBtn = document.createElement('button');
          forwardBtn.className = 'custom-forward-btn';
          Object.assign(forwardBtn.style, {
            background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', pointerEvents: 'auto', opacity: '0.9', whiteSpace: 'nowrap', position: 'relative'
          });
          const forwardTextWrapper = document.createElement('div');
          Object.assign(forwardTextWrapper.style, { width: '2.5em', height: '5em', position: 'relative', flexShrink: '0', marginRight: '0.5em' });
          const forwardText = document.createElement('div');
          forwardText.textContent = "3s";
          Object.assign(forwardText.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 'max-content',
            fontSize: '10em',
            transform: 'translate(-50%, -50%) scale(0.35)',
            transformOrigin: 'center center',
            fontFamily: 'Inter, sans-serif',
            color: 'white',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          });
          forwardTextWrapper.appendChild(forwardText);
          forwardBtn.appendChild(forwardTextWrapper);
          forwardBtn.insertAdjacentHTML('beforeend', FORWARD_ICON);
          forwardBtn.onclick = (e) => { e.stopPropagation(); video.currentTime += 3; if (setSelectedLayerId) setSelectedLayerId(layerId); };

          centerContainer.appendChild(rewindBtn);
          centerContainer.appendChild(forwardBtn);

          // Bottom: Play, Progress, Time, Repeat, Fullscreen
          const bottomContainer = document.createElement('div');
          Object.assign(bottomContainer.style, {
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: '2em',
            pointerEvents: 'none',
            paddingBottom: '2%',
            paddingLeft: '2%',
            paddingRight: '2%',
            boxSizing: 'border-box'
          });

          const PLAY_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
          const PAUSE_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

          const playBtn = document.createElement('button');
          playBtn.className = 'custom-play-btn';
          Object.assign(playBtn.style, {
            background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: "8em", height: "8em", pointerEvents: 'auto', flexShrink: '0',
          });

          const onPlay = () => { playBtn.innerHTML = PAUSE_SVG; bar.classList.remove('is-paused'); };
          const onPause = () => { playBtn.innerHTML = PLAY_SVG; bar.classList.add('is-paused'); };
          playBtn.innerHTML = video.paused ? PLAY_SVG : PAUSE_SVG;

          video.addEventListener('play', onPlay);
          video.addEventListener('pause', onPause);

          playBtn.onclick = (e) => {
            e.stopPropagation();
            video.paused ? video.play() : video.pause();
            if (setSelectedLayerId) setSelectedLayerId(layerId);
          };

          const progContainer = document.createElement('div');
          progContainer.className = 'custom-prog-container';
          Object.assign(progContainer.style, {
            flexGrow: '1', height: '1.2em', background: 'rgba(255,255,255,0.3)', position: 'relative', cursor: 'pointer', pointerEvents: 'auto', borderRadius: '0.2em',
          });

          const timeWrapper = document.createElement('div');
          timeWrapper.className = 'custom-time-wrapper';
          Object.assign(timeWrapper.style, {
            position: 'relative',
            width: '23em',
            height: '8em',
            flexShrink: '0',
            marginLeft: '1em'
          });

          const timeDisplay = document.createElement('div');
          Object.assign(timeDisplay.style, {
            position: 'absolute',
            top: '50%',
            left: '0',
            width: 'max-content',
            fontSize: '10em',
            transform: 'translateY(-50%) scale(0.35)',
            transformOrigin: 'left center',
            fontFamily: 'Inter, sans-serif',
            color: 'white',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          });
          timeDisplay.textContent = "00:00 / 00:00";
          timeWrapper.appendChild(timeDisplay);

          const progFill = document.createElement('div');
          Object.assign(progFill.style, {
            position: 'absolute', top: '0', left: '0', bottom: '0', width: '0%', background: 'white', pointerEvents: 'none', borderRadius: '0.2em',
          });
          progContainer.appendChild(progFill);


          const formatTime = (sec) => {
            if (isNaN(sec)) return "00:00";
            const m = Math.floor(sec / 60).toString().padStart(2, '0');
            const s = Math.floor(sec % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
          };

          const onTimeUpdate = () => {
            if (video.duration) {
              const pct = (video.currentTime / video.duration) * 100;
              progFill.style.width = `${pct}%`;
              if (timeDisplay) timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
            }
          };
          video.addEventListener('timeupdate', onTimeUpdate);
          video.addEventListener('loadedmetadata', onTimeUpdate);
          onTimeUpdate();

          progContainer.onpointerdown = (e) => {
            e.stopPropagation();
            const rect = progContainer.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            if (video.duration) video.currentTime = pct * video.duration;

            const onMove = (me) => {
              const p = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
              if (video.duration) video.currentTime = p * video.duration;
            };
            const onUp = () => {
              document.removeEventListener('pointermove', onMove);
              document.removeEventListener('pointerup', onUp);
            };
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);

            if (setSelectedLayerId) setSelectedLayerId(layerId);
          };

          const REPEAT_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;
          const repeatBtn = document.createElement('button');
          repeatBtn.className = 'custom-repeat-btn';
          Object.assign(repeatBtn.style, {
            background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0', opacity: video.loop ? '1' : '0.5',
          });
          repeatBtn.innerHTML = REPEAT_SVG;
          repeatBtn.onclick = (e) => {
            e.stopPropagation();
            video.loop = !video.loop;
            if (video.loop) video.setAttribute('loop', ''); else video.removeAttribute('loop');
            repeatBtn.style.opacity = video.loop ? '1' : '0.5';
            if (setSelectedLayerId) setSelectedLayerId(layerId);
            if (typeof updateElementAttribute === 'function') {
              const pageContainer = video.closest('.page-svg-container');
              const pIdx = pageContainer ? parseInt(pageContainer.getAttribute('data-page-index')) : (typeof activePageIndex !== 'undefined' ? activePageIndex : 0);
              updateElementAttribute(pIdx, layerId, { loop: video.loop });
            }
          };

          const FS_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`;
          const EXIT_FS_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`;
          const DOWNLOAD_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

          const dlBtn = document.createElement('button');
          dlBtn.className = 'custom-download-btn';
          Object.assign(dlBtn.style, {
            background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0',
          });
          dlBtn.innerHTML = DOWNLOAD_SVG;
          dlBtn.onclick = async (e) => {
            e.stopPropagation();
            const sourceUrl = video.src || video.querySelector('source')?.src;
            if (sourceUrl) {
              try {
                dlBtn.style.opacity = '0.5';
                dlBtn.style.pointerEvents = 'none';
                const response = await fetch(sourceUrl);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = sourceUrl.split('/').pop() || 'video.mp4';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
              } catch (err) {
                console.error("Failed to download video, falling back to direct link", err);
                const a = document.createElement('a');
                a.href = sourceUrl;
                a.download = sourceUrl.split('/').pop() || 'video.mp4';
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              } finally {
                dlBtn.style.opacity = '1';
                dlBtn.style.pointerEvents = 'auto';
              }
            }
          };

          const fsBtn = document.createElement('button');
          fsBtn.className = 'custom-fs-btn';
          Object.assign(fsBtn.style, {
            background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0',
          });

          const updateFsIcon = () => {
            fsBtn.innerHTML = document.fullscreenElement ? EXIT_FS_SVG : FS_SVG;
          };
          updateFsIcon();
          document.addEventListener('fullscreenchange', updateFsIcon);

          const fsStyleId = 'custom-fs-style';
          if (!document.getElementById(fsStyleId)) {
            const style = document.createElement('style');
            style.id = fsStyleId;
            style.innerHTML = `
              foreignObject:fullscreen, foreignObject:-webkit-full-screen, foreignObject:-moz-full-screen {
                width: 100vw !important;
                height: 100vh !important;
                background: black !important;
                transform: none !important;
              }
              foreignObject:fullscreen video, foreignObject:-webkit-full-screen video, foreignObject:-moz-full-screen video {
                width: 100% !important;
                height: 100% !important;
                object-fit: contain !important;
                
              }
              #temp-fs-wrapper .custom-video-overlay {
                font-size: 0.3vw !important;
              }
              #temp-fs-wrapper .custom-video-overlay svg {
                stroke-width: 2.5 !important;
                
              }
              #temp-fs-wrapper .custom-video-overlay .time-display {
                margin-right: 0 !important;
              }
            `;
            document.head.appendChild(style);
          }

          fsBtn.onclick = (e) => {
            e.stopPropagation();
            if (!document.fullscreenElement) {
              const fsWrapper = document.createElement('div');
              fsWrapper.id = 'temp-fs-wrapper';
              Object.assign(fsWrapper.style, {
                position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
                background: 'black', zIndex: '999999', display: 'flex', alignItems: 'center', justifyContent: 'center'
              });

              const vPlaceholder = document.createComment('video-placeholder');
              const bPlaceholder = document.createComment('bar-placeholder');

              video.parentElement.insertBefore(vPlaceholder, video);
              bar.parentElement.insertBefore(bPlaceholder, bar);

              const wasPlaying = !video.paused;

              fsWrapper.appendChild(video);
              fsWrapper.appendChild(bar);
              document.body.appendChild(fsWrapper);

              fsWrapper._vPlaceholder = vPlaceholder;
              fsWrapper._bPlaceholder = bPlaceholder;

              const reqFs = fsWrapper.requestFullscreen || fsWrapper.webkitRequestFullscreen;
              if (reqFs) {
                reqFs.call(fsWrapper).then(() => {
                  if (wasPlaying) video.play().catch(() => { });
                }).catch(err => {
                  console.error(err);
                  if (vPlaceholder.parentNode) vPlaceholder.parentNode.insertBefore(video, vPlaceholder);
                  if (bPlaceholder.parentNode) bPlaceholder.parentNode.insertBefore(bar, bPlaceholder);
                  vPlaceholder.remove();
                  bPlaceholder.remove();
                  fsWrapper.remove();
                });
              }
            } else {
              if (document.exitFullscreen) document.exitFullscreen();
              else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
          };

          const handleFsChange = () => {
            const isFs = !!document.fullscreenElement;
            fsBtn.innerHTML = isFs ? EXIT_FS_SVG : FS_SVG;
            if (!isFs) {
              const fsWrapper = document.getElementById('temp-fs-wrapper');
              if (fsWrapper) {
                const wasPlaying = !video.paused;
                const vp = fsWrapper._vPlaceholder;
                const bp = fsWrapper._bPlaceholder;
                if (vp && vp.parentNode) {
                  vp.parentNode.insertBefore(video, vp);
                  vp.remove();
                }
                if (bp && bp.parentNode) {
                  bp.parentNode.insertBefore(bar, bp);
                  bp.remove();
                }
                fsWrapper.remove();
                if (wasPlaying) video.play().catch(() => { });
              }
            }
          };
          handleFsChange();
          document.addEventListener('fullscreenchange', handleFsChange);
          document.addEventListener('webkitfullscreenchange', handleFsChange);

          const disableFullScreen = video.getAttribute('data-disable-fullscreen') === 'true';

          bottomContainer.appendChild(playBtn);
          bottomContainer.appendChild(progContainer);
          bottomContainer.appendChild(timeWrapper);
          bottomContainer.appendChild(repeatBtn);
          bottomContainer.appendChild(dlBtn);
          if (!disableFullScreen) {
            bottomContainer.appendChild(fsBtn);
          }

          bar.appendChild(topContainer);
          bar.appendChild(centerContainer);
          bar.appendChild(bottomContainer);

          mountPoint.appendChild(bar);

          bar._cleanup = () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
            if (ro) ro.disconnect();
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('loadedmetadata', onTimeUpdate);
            video.removeEventListener('volumechange', updateVolumeIcon);
            video.removeAttribute('data-custom-ctrl-active');
            if (mountPoint.style && mountPoint._prevPointerEvents !== undefined) {
              mountPoint.style.pointerEvents = mountPoint._prevPointerEvents;
              delete mountPoint._prevPointerEvents;
            }
          };
        }

        const groupEl = video.closest('g') || video.closest('foreignObject');
        const cropStr = groupEl ? groupEl.getAttribute('data-crop-data') : null;
        const isCropped = video.getAttribute('data-object-fit') === 'Crop' || (groupEl && groupEl.getAttribute('data-object-fit') === 'Crop');
        if (isCropped && cropStr && cropStr !== 'null') {
          try {
            const crop = JSON.parse(cropStr);
            const t = parseFloat(crop.top) || 0;
            const l = parseFloat(crop.left) || 0;
            const w = parseFloat(crop.width) || 100;
            const h = parseFloat(crop.height) || 100;
            bar.style.top = t + '%';
            bar.style.bottom = Math.max(0, 100 - (t + h)) + '%';
            bar.style.left = l + '%';
            bar.style.right = Math.max(0, 100 - (l + w)) + '%';
            bar.style.width = 'auto';
            bar.style.height = 'auto';
          } catch (e) { }
        } else {
          bar.style.top = '0';
          bar.style.bottom = '0';
          bar.style.left = '0';
          bar.style.right = '0';
          bar.style.width = 'auto';
          bar.style.height = 'auto';
        }

        // Re-evaluate display visibility at the very end
        const shouldShowControls = video.getAttribute('data-show-controls') !== 'false';
        const sp = video.getAttribute('data-show-play-pause') !== 'false';
        const sf = video.getAttribute('data-show-fullscreen-button') !== 'false';
        const sd = video.getAttribute('data-show-download-button') !== 'false';
        bar.style.display = (shouldShowControls || sp || sf || sd) ? 'flex' : 'none';
      });

      // Cleanup orphan controls
      document.querySelectorAll('[id^="custom-ctrl-"]').forEach(bar => {
        const layerId = bar.id.replace('custom-ctrl-', '');
        // Escape ID properly or use a broad query
        try {
          const video = document.getElementById(layerId)?.querySelector('video') || document.querySelector(`[id="${layerId}"] video`);
          if (!video || !document.body.contains(video)) {
            if (bar._cleanup) bar._cleanup();
            bar.remove();
          }
        } catch (e) {
          if (bar._cleanup) bar._cleanup();
          bar.remove();
        }
      });
    };

    intervalId = setInterval(renderVideoControls, 500);
    return () => clearInterval(intervalId);
  }, [setSelectedLayerId]);

  // Global observer for dynamic styling to bypass WebKit pseudo-element bugs and ensure styles persist on load
  useEffect(() => {
    let animationFrameId;

    const hexToRgbaStr = (color, opacityVal) => {
      if (!color || color === 'transparent' || color === 'none' || color === '#') return 'transparent';
      if (color.startsWith('rgba') || color.startsWith('hsla') || color.includes('gradient')) return color;
      let c = color.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      if (isNaN(num)) return color;
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      const op = parseFloat(opacityVal);
      const clampedOp = isNaN(op) ? 1 : (op > 1 ? op / 100 : op);
      return `rgba(${r}, ${g}, ${b}, ${clampedOp})`;
    };

    const updateScrollbarStyles = () => {
      const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument;
      const elsDoc = Array.from(document.querySelectorAll('[data-scrollbar-color], [data-bg-fill], [data-bg-stroke]'));
      const elsIframe = editorDoc ? Array.from(editorDoc.querySelectorAll('[data-scrollbar-color], [data-bg-fill], [data-bg-stroke]')) : [];
      const els = [...elsDoc, ...elsIframe];

      let cssRules = '';
      els.forEach(el => {
        if (el.id) {
          if (el.hasAttribute('data-scrollbar-color')) {
            cssRules += `[id="${el.id}"] .flipbook-text-scrollbar::-webkit-scrollbar-thumb { background-color: ${el.getAttribute('data-scrollbar-color')} !important; border-radius: 20px !important; border: 3px solid transparent !important; background-clip: padding-box !important; }\n`;
          }
          if (el.hasAttribute('data-bg-fill')) {
            const bgFill = el.getAttribute('data-bg-fill');
            const bgFillOpacity = el.getAttribute('data-bg-fill-opacity') !== null ? el.getAttribute('data-bg-fill-opacity') : '1';
            if (bgFill && bgFill !== 'transparent' && bgFill !== 'none' && bgFill !== '#') {
              const finalBgFill = hexToRgbaStr(bgFill, bgFillOpacity);
              if (finalBgFill.includes('gradient')) {
                cssRules += `[id="${el.id}"] .flipbook-text-outer, [id="${el.id}"] > div { background-image: ${finalBgFill} !important; background-color: transparent !important; --bg-fill: ${finalBgFill} !important; }\n`;
              } else {
                cssRules += `[id="${el.id}"] .flipbook-text-outer, [id="${el.id}"] > div { background-color: ${finalBgFill} !important; background-image: none !important; --bg-fill: ${finalBgFill} !important; }\n`;
              }
            } else {
              cssRules += `[id="${el.id}"] .flipbook-text-outer, [id="${el.id}"] > div { background-color: transparent !important; background-image: none !important; --bg-fill: transparent !important; }\n`;
            }
          }
          if (el.hasAttribute('data-bg-stroke')) {
            const bgStroke = el.getAttribute('data-bg-stroke');
            const bgStrokeOpacity = el.getAttribute('data-bg-stroke-opacity') !== null ? el.getAttribute('data-bg-stroke-opacity') : '1';
            const sw = el.getAttribute('data-bg-stroke-width') !== null ? el.getAttribute('data-bg-stroke-width') : 0;
            const dash = el.getAttribute('data-bg-stroke-dasharray');
            const borderStyle = (dash && dash !== 'none') ? 'dashed' : 'solid';
            if (bgStroke && bgStroke !== 'none' && bgStroke !== 'transparent' && bgStroke !== '#' && Number(sw) > 0) {
              const finalBgStroke = hexToRgbaStr(bgStroke, bgStrokeOpacity);
              cssRules += `[id="${el.id}"] .flipbook-text-outer, [id="${el.id}"] > div { border: ${sw}px ${borderStyle} ${finalBgStroke} !important; --bg-stroke: ${finalBgStroke} !important; --bg-stroke-width: ${sw} !important; }\n`;
            } else {
              cssRules += `[id="${el.id}"] .flipbook-text-outer, [id="${el.id}"] > div { border: none !important; }\n`;
            }
          }
        }
      });
      let styleTag = document.getElementById('global-scrollbar-styles');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'global-scrollbar-styles';
        document.head.appendChild(styleTag);
      }
      if (styleTag.textContent !== cssRules) {
        styleTag.textContent = cssRules;
        setTimeout(() => {
          els.forEach(el => {
            const innerDiv = el.querySelector('.flipbook-text-scrollbar');
            if (innerDiv) {
              const currentOverflow = innerDiv.style.overflowY;
              innerDiv.style.overflowY = 'hidden';
              void innerDiv.offsetHeight;
              innerDiv.style.overflowY = currentOverflow || 'auto';
            }
          });
        }, 10);
      }
      if (editorDoc) {
        let iframeStyleTag = editorDoc.getElementById('global-scrollbar-styles');
        if (!iframeStyleTag) {
          iframeStyleTag = editorDoc.createElement('style');
          iframeStyleTag.id = 'global-scrollbar-styles';
          (editorDoc.head || editorDoc.documentElement).appendChild(iframeStyleTag);
        }
        if (iframeStyleTag.textContent !== cssRules) {
          iframeStyleTag.textContent = cssRules;
        }
      }
    };

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateScrollbarStyles);
    });

    updateScrollbarStyles();
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-scrollbar-color', 'data-bg-fill', 'data-bg-fill-opacity', 'data-bg-stroke', 'data-bg-stroke-opacity', 'data-bg-stroke-width', 'id'] });

    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument;
    if (editorDoc && editorDoc.body) {
      try {
        observer.observe(editorDoc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-scrollbar-color', 'data-bg-fill', 'data-bg-fill-opacity', 'data-bg-stroke', 'data-bg-stroke-opacity', 'data-bg-stroke-width', 'id'] });
      } catch (e) {}
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Global Stroke Overlay Sync
  useEffect(() => {
    const syncOverlays = () => {
      const container = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      if (!container) return;
      const svg = container.querySelector('svg');
      if (!svg) return;

      let defs = svg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.insertBefore(defs, svg.firstChild);
      }

      const shapes = svg.querySelectorAll('[data-stroke-position="Outside"], [data-stroke-position="Inside"]');
      shapes.forEach(el => {
        // Skip elements that manage their own stroke offsets (Images, Videos, and their dedicated overlays)
        if (
          el.tagName.toLowerCase() === 'image' ||
          el.tagName.toLowerCase() === 'foreignobject' ||
          el.tagName.toLowerCase() === 'g' ||
          el.classList.contains('svg-image-stroke-overlay') ||
          el.classList.contains('svg-video-stroke-overlay')
        ) {
          const existingOverlay = el.parentNode?.querySelector(`.svg-shape-stroke-overlay[data-target="${el.id}"]`);
          if (existingOverlay) existingOverlay.remove();
          return;
        }
        const pos = el.getAttribute('data-stroke-position');
        const sw = parseFloat(el.getAttribute('data-stroke-width') || '0');
        if (sw <= 0) {
          const existingOverlay = el.parentNode?.querySelector(`.svg-shape-stroke-overlay[data-target="${el.id}"]`);
          if (existingOverlay) existingOverlay.remove();
          return;
        }

        // Hide original stroke and capture its color
        const currentStroke = el.getAttribute('stroke');
        if (currentStroke && currentStroke !== 'none') {
          el.setAttribute('data-original-stroke', currentStroke);
          el.setAttribute('stroke', 'none');
        }
        if (el.hasAttribute('stroke-width')) {
          el.removeAttribute('stroke-width');
        }

        let overlay = el.parentNode?.querySelector(`.svg-shape-stroke-overlay[data-target="${el.id}"]`);
        if (!overlay) {
          overlay = document.createElementNS('http://www.w3.org/2000/svg', el.tagName);
          overlay.classList.add('svg-shape-stroke-overlay');
          overlay.setAttribute('data-target', el.id);
          overlay.style.pointerEvents = 'none';
          if (pos === 'Inside') {
            el.parentNode.insertBefore(overlay, el.nextSibling);
          } else {
            el.parentNode.insertBefore(overlay, el);
          }
        }

        if (pos === 'Inside') {
          const safeElId = (el.id || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
          let clip = defs.querySelector(`clipPath[id="clip-shape-${safeElId}"]`);
          if (!clip) {
            clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
            clip.id = `clip-shape-${safeElId}`;
            const clipShape = document.createElementNS('http://www.w3.org/2000/svg', el.tagName);
            clip.appendChild(clipShape);
            defs.appendChild(clip);
          }
          overlay.setAttribute('clip-path', `url(#clip-shape-${safeElId})`);
          overlay.removeAttribute('mask');
        } else {
          const safeElId = (el.id || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
          let mask = defs.querySelector(`mask[id="mask-shape-${safeElId}"]`);
          if (!mask) {
            mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
            mask.id = `mask-shape-${safeElId}`;
            const maskBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            maskBg.setAttribute('x', '-500%');
            maskBg.setAttribute('y', '-500%');
            maskBg.setAttribute('width', '1000%');
            maskBg.setAttribute('height', '1000%');
            maskBg.setAttribute('fill', 'white');
            const maskShape = document.createElementNS('http://www.w3.org/2000/svg', el.tagName);
            maskShape.setAttribute('fill', 'black');
            mask.appendChild(maskBg);
            mask.appendChild(maskShape);
            defs.appendChild(mask);
          }
          overlay.setAttribute('mask', `url(#mask-shape-${safeElId})`);
          overlay.removeAttribute('clip-path');
        }

        // Sync visual attributes
        overlay.setAttribute('stroke', el.getAttribute('data-original-stroke') || '#000');
        overlay.setAttribute('stroke-width', (sw * 2).toString());
        overlay.setAttribute('fill', 'none');
        overlay.setAttribute('stroke-opacity', el.getAttribute('data-stroke-opacity') || '1');

        const dashArray = el.getAttribute('data-stroke-dasharray') || el.getAttribute('stroke-dasharray');
        if (dashArray && dashArray !== 'none') overlay.setAttribute('stroke-dasharray', dashArray);
        else overlay.removeAttribute('stroke-dasharray');

        overlay.setAttribute('stroke-linecap', el.getAttribute('stroke-linecap') || 'butt');
        overlay.setAttribute('stroke-linejoin', (el.getAttribute('stroke-linecap') || 'butt') === 'round' ? 'round' : 'miter');

        // Sync geometry
        const attrsToSync = ['x', 'y', 'width', 'height', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'points'];
        const refShape = pos === 'Inside' ? defs.querySelector(`clipPath[id="clip-shape-${el.id}"]`)?.firstChild : defs.querySelector(`mask[id="mask-shape-${el.id}"]`)?.lastChild;

        attrsToSync.forEach(attr => {
          const val = el.getAttribute(attr);
          if (val !== null) {
            overlay.setAttribute(attr, val);
            if (refShape) refShape.setAttribute(attr, val);
          } else {
            overlay.removeAttribute(attr);
            if (refShape) refShape.removeAttribute(attr);
          }
        });

        // ONLY copy transform to the overlay, NOT to the clip/mask shapes (which use userSpaceOnUse coordinate system)
        const transformAttr = el.getAttribute('transform');
        if (transformAttr !== null) overlay.setAttribute('transform', transformAttr);
        else overlay.removeAttribute('transform');

        overlay.style.transform = el.style.transform;
        overlay.style.translate = el.style.translate;
        overlay.style.scale = el.style.scale;
        overlay.style.rotate = el.style.rotate;
        // Do NOT copy style.transform to refShape, because the mask/clip automatically operates
        // in the user coordinate space of the overlay. Applying it again causes double-transform bugs.
      });

      // Sync video / iframe elements inside foreignObjects
      svg.querySelectorAll('foreignObject iframe').forEach(iframe => {
        const fo = iframe.closest('foreignObject');
        if (fo) {
          const foW = parseFloat(fo.getAttribute('width') || '0');
          const foH = parseFloat(fo.getAttribute('height') || '0');
          const origW = parseFloat(iframe.getAttribute('data-original-width')) || 640;
          const origH = parseFloat(iframe.getAttribute('data-original-height')) || 360;
          iframe.setAttribute('data-original-width', origW.toString());
          iframe.setAttribute('data-original-height', origH.toString());
          iframe.setAttribute('width', origW.toString());
          iframe.setAttribute('height', origH.toString());
          iframe.style.setProperty('width', origW + 'px', 'important');
          iframe.style.setProperty('height', origH + 'px', 'important');
          iframe.style.setProperty('transform-origin', '0 0', 'important');
          
          const isInteractive = fo.getAttribute('data-video-interactive') === 'true';
          iframe.style.setProperty('pointer-events', isInteractive ? 'auto' : 'none', 'important');
          iframe.style.setProperty('border', 'none', 'important');
          iframe.style.setProperty('display', 'block', 'important');

          if (foW > 0 && foH > 0 && origW > 0 && origH > 0) {
            const scaleX = foW / origW;
            const scaleY = foH / origH;
            iframe.style.setProperty('transform', `scale(${scaleX}, ${scaleY})`, 'important');
          }
        }
      });
      svg.querySelectorAll('foreignObject video').forEach(video => {
        const fo = video.closest('foreignObject');
        const isInteractive = fo ? fo.getAttribute('data-video-interactive') === 'true' : true;
        video.style.setProperty('width', '100%', 'important');
        video.style.setProperty('height', '100%', 'important');
        video.style.setProperty('display', 'block', 'important');
        video.style.setProperty('pointer-events', isInteractive ? 'auto' : 'none', 'important');
      });

      // Sync Image Masks
      svg.querySelectorAll('[data-masked-image-url]').forEach(shapeEl => {
        const shapeId = shapeEl.id;
        if (!shapeId) return;
        const imgEl = svg.querySelector(`[id="masked-img-${shapeId}"]`);
        const clipPath = defs?.querySelector(`clipPath[id="clip-shape-${shapeId}"]`);
        if (imgEl && clipPath) {
          const clipShape = clipPath.firstElementChild;
          if (clipShape) {
            // Sync geometry attributes (NO transform)
            const attrsToSync = ['x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points'];
            attrsToSync.forEach(attr => {
              const val = shapeEl.getAttribute(attr);
              if (val !== null) clipShape.setAttribute(attr, val);
              else clipShape.removeAttribute(attr);
            });
          }
          
          // Sync Image properties
          const transform = shapeEl.getAttribute('transform');
          if (transform) imgEl.setAttribute('transform', transform);
          else imgEl.removeAttribute('transform');

          if (typeof shapeEl.getBBox === 'function') {
             try {
                const bbox = shapeEl.getBBox();
                if (bbox && bbox.width > 0 && bbox.height > 0) {
                   imgEl.setAttribute('x', bbox.x);
                   imgEl.setAttribute('y', bbox.y);
                   imgEl.setAttribute('width', bbox.width);
                   imgEl.setAttribute('height', bbox.height);
                }
             } catch(e) {}
          }
        }
      });

      // Cleanup orphan overlays
      svg.querySelectorAll('.svg-shape-stroke-overlay').forEach(overlay => {
        const targetId = overlay.getAttribute('data-target');
        const target = svg.querySelector(`[id="${targetId}"]`);
        if (!target || target.getAttribute('data-stroke-position') === 'Center') {
          overlay.remove();
          const mask = defs?.querySelector(`mask[id="mask-shape-${targetId}"]`);
          if (mask) mask.remove();
          const clip = defs?.querySelector(`clipPath[id="clip-shape-${targetId}"]`);
          if (clip) clip.remove();
        }
      });
    };

    const interval = setInterval(syncOverlays, 100);
    return () => clearInterval(interval);
  }, [activePageIndex]);

  // Handle external asset insertion events
  useEffect(() => {
    const handleAddIcon = (e) => {
      const { icon, pageIndex } = e.detail;
      const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;
      const page = pages[targetPageIndex];
      if (!page) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html || '', 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return;

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
      const centerX = e.detail.dropPoint ? e.detail.dropPoint.x : (svgW / 2);
      const centerY = e.detail.dropPoint ? e.detail.dropPoint.y : (svgH / 2);

      // Unique ID
      const newId = e.detail.isShape ? `shape-${Date.now()}` : `icon-${Date.now()}`;

      // Create element
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.id = newId;
      g.setAttribute('data-type', e.detail.isShape ? 'shape' : 'icon');
      if (e.detail.isShape) {
        g.setAttribute('data-shape-type', 'shape');
      }
      // Place centered. Icon path is 24x24. Scaled by 0.5 = 12x12. Offset by -6 to truly center.
      g.setAttribute('transform', `translate(${centerX - 6}, ${centerY - 6}) scale(0.5)`);
      g.setAttribute('fill', icon.fill !== undefined ? icon.fill : 'none');
      g.setAttribute('stroke', icon.stroke !== undefined ? icon.stroke : '#000000');
      g.setAttribute('stroke-width', icon.strokeWidth !== undefined ? icon.strokeWidth : '1');
      if (icon.Component) {
        // If it's a lucide icon component, we can't easily render it to a string here 
        // without react-dom/server or similar. 
        // But I'll try to find a way to get its SVG path.
        // For now, let's assume we use the data if available.
        if (icon.html) g.innerHTML = icon.html;
        else if (icon.d) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', icon.d);
          g.appendChild(path);
        }
      } else {
        if (icon.html) g.innerHTML = icon.html;
        else if (icon.d) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', icon.d);
          g.appendChild(path);
        }
      }

      if (icon.html) {
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
        selectedLayerIdRef.current = newId;
        if (setMultiSelectedIds) setMultiSelectedIds(new Set([newId]));
        multiSelectedIdsRef.current = new Set([newId]);
      }
      if (setActiveMainTool) setActiveMainTool('select');
      setTimeout(() => {
        const el = document.getElementById(newId);
        if (el && typeof drawOverlayHighlight === 'function') {
          drawOverlayHighlight(el, 'selected');
        }
      }, 50);
    };

    const handleAddHotspot = (e) => {
      const { icon, pageIndex } = e.detail;
      const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;
      const page = pages[targetPageIndex];
      if (!page) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html || '', 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return;

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
      const centerX = e.detail.dropPoint ? e.detail.dropPoint.x : (svgW / 2);
      const centerY = e.detail.dropPoint ? e.detail.dropPoint.y : (svgH / 2);

      // Unique ID
      const newId = `hotspot-${Date.now()}`;

      // Create element
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.id = newId;
      g.setAttribute('data-type', 'hotspot');
      // Place centered. Icon path is 24x24. Scaled by 0.5 = 12x12. Offset by -6 to truly center.
      g.setAttribute('transform', `translate(${centerX - 12}, ${centerY - 12}) scale(0.5)`);
      g.setAttribute('data-is-hotspot', 'true');
      g.setAttribute('data-show-highlight', 'false');

      const currentPresetId = e.detail.presetId || (icon && icon.presetId);
      if (currentPresetId) {
        g.setAttribute('data-preset-id', currentPresetId);

        const actionMap = {
          'youtube': 'open-link',
          'instagram': 'open-link',
          'x': 'open-link',
          'facebook': 'open-link',
          'linkedin': 'open-link',
          'open-link': 'open-link',
          'navigate-to': 'navigate-to',
          'whatsapp': 'whatsapp',
          'call': 'call',
          'email': 'email',
          'video': 'popup',
          'popup': 'popup',
          'slideshow': 'slideshow',
          'zoom': 'zoom',
          'download': 'download',
          'audio': 'audio',
          'info-box': 'info-box',
          'location': 'open-link',
          '3d-viewer': '3d-viewer',
          'interactive-button': 'open-link'
        };

        const actionType = actionMap[currentPresetId];
        if (actionType) {
          g.setAttribute('data-interaction', actionType);
        }
      }

      if (icon?.bgColor) g.setAttribute('data-bg-color', icon.bgColor);
      if (icon?.iconColor) g.setAttribute('data-icon-color', icon.iconColor);

      if (icon?.html) {
        g.innerHTML = icon.html;
      } else if (icon?.d) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', icon.d);
        g.appendChild(path);
      } else if (icon?.src) {
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', icon.src);
        image.setAttribute('width', '48');
        image.setAttribute('height', '48');
        image.setAttribute('x', '0');
        image.setAttribute('y', '0');
        image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        g.appendChild(image);
      }

      const targetContainer = svg.querySelector('[data-type="frame"]') || svg.querySelector('[data-name="Overlay"]') || svg;
      targetContainer.appendChild(g);

      updatePageHtml(targetPageIndex, svg.outerHTML);
      if (typeof setSingleSelection === 'function') {
        setSingleSelection(newId);
      } else {
        if (setSelectedLayerId) setSelectedLayerId(newId);
        selectedLayerIdRef.current = newId;
        if (setMultiSelectedIds) setMultiSelectedIds(new Set([newId]));
        multiSelectedIdsRef.current = new Set([newId]);
      }
      if (setActiveMainTool) setActiveMainTool('select');
      setTimeout(() => {
        const el = document.getElementById(newId);
        if (el && typeof drawOverlayHighlight === 'function') {
          drawOverlayHighlight(el, 'selected');
        }
      }, 50);

      if (e.detail.isHotspot && typeof setActiveTopTool === 'function') {
        setActiveTopTool('interaction');
      }
    };

    const handleUploadVideo = (e) => {
      const { videoUrl, originalUrl, pageIndex, file } = e.detail;
      const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;

      // 1. Find the SVG of the target page in the actual DOM for accurate centering
      const container = document.querySelector(`.page-svg-container[data-page-index="${targetPageIndex}"]`);
      const svg = container?.querySelector('svg');
      if (!svg) return;

      const rawUrl = originalUrl || videoUrl || '';
      const lowerRaw = rawUrl.toLowerCase();
      const isYouTube = lowerRaw.includes('youtube.com') || lowerRaw.includes('youtu.be') || (videoUrl && videoUrl.includes('youtube.com/embed'));
      const isVimeo = lowerRaw.includes('vimeo.com') || (videoUrl && videoUrl.includes('vimeo.com/video'));
      const isDailymotion = lowerRaw.includes('dailymotion') || lowerRaw.includes('dai.ly');
      const isLoom = lowerRaw.includes('loom.com');
      const isWistia = lowerRaw.includes('wistia.com');
      const isGoogleDrive = lowerRaw.includes('drive.google.com');

      const isIframe = isYouTube || isVimeo || isDailymotion || isLoom || isWistia || isGoogleDrive || (videoUrl && (videoUrl.includes('embed') || videoUrl.includes('player') || videoUrl.includes('preview')));

      let finalEmbedUrl = videoUrl;
      if (isYouTube) {
        let videoId = '';
        if (rawUrl.includes('youtu.be/')) videoId = rawUrl.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
        else if (rawUrl.includes('watch?v=')) videoId = rawUrl.split('v=')[1]?.split('&')[0];
        else if (rawUrl.includes('shorts/')) videoId = rawUrl.split('shorts/')[1]?.split('?')[0]?.split('&')[0];
        else if (rawUrl.includes('embed/')) videoId = rawUrl.split('embed/')[1]?.split('?')[0]?.split('&')[0];
        if (videoId) finalEmbedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
      } else if (isVimeo) {
        let videoId = rawUrl.split('vimeo.com/')[1]?.split('?')[0]?.split('/')[0];
        if (videoId && !isNaN(videoId)) finalEmbedUrl = `https://player.vimeo.com/video/${videoId}`;
      } else if (isDailymotion) {
        let videoId = '';
        if (rawUrl.includes('dai.ly/')) videoId = rawUrl.split('dai.ly/')[1]?.split('?')[0];
        else if (rawUrl.includes('video/')) videoId = rawUrl.split('video/')[1]?.split('?')[0];
        if (videoId) finalEmbedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
      } else if (isLoom) {
        let videoId = rawUrl.split('share/')[1]?.split('?')[0];
        if (videoId) finalEmbedUrl = `https://www.loom.com/embed/${videoId}`;
      } else if (isWistia) {
        let videoId = rawUrl.split('medias/')[1]?.split('?')[0];
        if (videoId) finalEmbedUrl = `https://fast.wistia.net/embed/iframe/${videoId}`;
      } else if (isGoogleDrive) {
        const match = rawUrl.match(/\/d\/([^\/]+)/);
        if (match && match[1]) finalEmbedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
      }

      const newId = `video-${Date.now()}`;

      const isPortrait = e.detail?.isPortrait ||
        rawUrl.toLowerCase().includes('shorts') ||
        rawUrl.toLowerCase().includes('reel') ||
        rawUrl.toLowerCase().includes('tiktok') ||
        rawUrl.toLowerCase().includes('portrait') ||
        rawUrl.toLowerCase().includes('vertical') ||
        (e.detail?.videoWidth && e.detail?.videoHeight && e.detail.videoHeight > e.detail.videoWidth);

      // Calculate dynamic view width and height relative to canvas page dimensions
      const svgW = (svg.getAttribute('width') && !svg.getAttribute('width').includes('%') ? parseFloat(svg.getAttribute('width')) : 0) || (svg.viewBox?.baseVal?.width ? svg.viewBox.baseVal.width : 0) || (typeof baseWidth === 'number' ? baseWidth : parseFloat(baseWidth || 794)) || 794;
      const svgH = (svg.getAttribute('height') && !svg.getAttribute('height').includes('%') ? parseFloat(svg.getAttribute('height')) : 0) || (svg.viewBox?.baseVal?.height ? svg.viewBox.baseVal.height : 0) || (typeof baseHeight === 'number' ? baseHeight : parseFloat(baseHeight || 1123)) || 1123;

      let displayWidth = Math.round(svgW * 0.5);
      let displayHeight = Math.round(displayWidth * (9 / 16));

      // We use foreignObject to host the video/iframe element in SVG
      const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      fo.id = newId;

      fo.setAttribute('width', displayWidth.toString());
      fo.setAttribute('height', displayHeight.toString());
      fo.setAttribute('data-type', 'video');
      fo.setAttribute('data-name', 'Video');
      fo.setAttribute('data-object-fit', 'Fill');
      if (file) {
        fo.setAttribute('data-filename', file.name);
        fo.setAttribute('data-filesize', file.size);
      }
      if (originalUrl) fo.setAttribute('data-original-url', originalUrl);

      if (isIframe) {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        iframe.src = finalEmbedUrl;

        const intrinsicW = 640;
        const intrinsicH = 360;

        iframe.setAttribute('width', intrinsicW.toString());
        iframe.setAttribute('height', intrinsicH.toString());
        iframe.setAttribute('data-original-width', intrinsicW.toString());
        iframe.setAttribute('data-original-height', intrinsicH.toString());

        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', 'true');

        iframe.style.setProperty('width', intrinsicW + 'px', 'important');
        iframe.style.setProperty('height', intrinsicH + 'px', 'important');
        iframe.style.setProperty('border', 'none', 'important');
        iframe.style.setProperty('display', 'block', 'important');
        iframe.style.setProperty('pointer-events', 'auto', 'important');
        iframe.style.setProperty('transform-origin', '0 0', 'important');

        const scaleX = displayWidth / intrinsicW;
        const scaleY = displayHeight / intrinsicH;
        iframe.style.setProperty('transform', `scale(${scaleX}, ${scaleY})`, 'important');

        if (originalUrl) iframe.setAttribute('data-original-url', originalUrl);
        fo.appendChild(iframe);
      } else {
        const video = document.createElement('video');
        video.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        video.src = videoUrl;
        video.setAttribute('width', '100%');
        video.setAttribute('height', '100%');
        video.setAttribute('controls', 'true');
        video.style.objectFit = 'contain';
        video.style.margin = '0';
        video.style.padding = '0';
        video.style.display = 'block';
        video.style.width = '100%';
        video.style.height = '100%';
        if (originalUrl) video.setAttribute('data-original-url', originalUrl);
        fo.appendChild(video);

        // Dynamically probe video file metadata to adjust frame to exact original aspect ratio
        if (!e.detail?.videoWidth || !e.detail?.videoHeight) {
          const tempVid = document.createElement('video');
          tempVid.onloadedmetadata = () => {
            if (tempVid.videoWidth && tempVid.videoHeight) {
              const aspect = tempVid.videoWidth / tempVid.videoHeight;
              let newW, newH;
              if (aspect < 1) { // Portrait
                newH = Math.round(svgH * 0.65);
                newW = Math.round(newH * aspect);
              } else { // Landscape
                newW = Math.round(svgW * 0.5);
                newH = Math.round(newW / aspect);
              }
              fo.setAttribute('width', newW.toString());
              fo.setAttribute('height', newH.toString());
              fo.setAttribute('data-video-width', tempVid.videoWidth);
              fo.setAttribute('data-video-height', tempVid.videoHeight);
              fo.setAttribute('data-video-duration', tempVid.duration);
              if (updatePageHtml) {
                saveModifiedPageHtml(targetPageIndex, svg);
              }
            }
          };
          tempVid.src = videoUrl;
        }
      }

      // 2. Append to root frame or page container and center it
      const topFrames = getTopLevelFrames(svg);
      let rootFrame = topFrames.find(f =>
        !f.getAttribute('data-is-image-group') &&
        !f.getAttribute('data-is-gif-group') &&
        !f.getAttribute('data-is-video-group') &&
        f.getAttribute('data-name') !== 'Overlay'
      ) || svg;

      if (rootFrame) {
        try {
          let cx = baseWidth / 2, cy = baseHeight / 2;

          try {
            const bbox = rootFrame.getBBox();
            if (bbox.width > 0 && bbox.height > 0) {
              cx = bbox.x + bbox.width / 2;
              cy = bbox.y + bbox.height / 2;
            }
          } catch (e) {
            const svgW = parseFloat(svg.getAttribute('width') || baseWidth.toString());
            const svgH = parseFloat(svg.getAttribute('height') || baseHeight.toString());
            cx = svgW / 2;
            cy = svgH / 2;
          }

          if (e.detail?.dropPoint && typeof e.detail.dropPoint.x === 'number') {
            cx = e.detail.dropPoint.x;
            cy = e.detail.dropPoint.y;
          }

          fo.setAttribute('x', (cx - displayWidth / 2).toString());
          fo.setAttribute('y', (cy - displayHeight / 2).toString());

          rootFrame.appendChild(fo);

          // 3. Synchronize changes
          if (updatePageHtml) {
            saveModifiedPageHtml(targetPageIndex, svg);
          }

          if (typeof setSingleSelection === 'function') {
            setSingleSelection(newId);
          } else {
            if (setSelectedLayerId) setSelectedLayerId(newId);
            selectedLayerIdRef.current = newId;
            if (setMultiSelectedIds) setMultiSelectedIds(new Set([newId]));
            multiSelectedIdsRef.current = new Set([newId]);
          }
          if (setActiveMainTool) setActiveMainTool('select');
          setTimeout(() => {
            const el = document.getElementById(newId);
            if (el && typeof drawOverlayHighlight === 'function') {
              drawOverlayHighlight(el, 'selected');
            }
          }, 50);

        } catch (err) {
          console.error("[MainEditor] Failed to insert video into SVG frame:", err);
        }
      }
    };

    const handleAddImage = (e) => {
      if (typeof setActiveMainTool === 'function') {
        setActiveMainTool('select');
      }
      const { url, gifUrl, pageIndex, dropPoint, type, targetShapeId } = e.detail || {};
      const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;
      const mediaUrl = gifUrl || url;
      if (!mediaUrl) return;
      const dataType = type || (gifUrl || mediaUrl.toLowerCase().endsWith('.gif') ? 'gif' : 'image');
      insertImageIntoPage(targetPageIndex, mediaUrl, dataType, dropPoint, targetShapeId);
    };

    window.addEventListener('add-icon-to-editor', handleAddIcon);
    window.addEventListener('add-hotspot-to-editor', handleAddHotspot);
    window.addEventListener('update-hotspot-style', (e) => {
      const { id, pageIndex, html, presetId, iconSrc, bgColor, iconColor } = e.detail;
      const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;
      const page = pages[targetPageIndex];
      if (!page) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html || '', 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return;

      const g = svg.getElementById(id);
      if (!g) return;

      if (html) {
        g.innerHTML = html;
      }
      if (presetId) g.setAttribute('data-preset-id', presetId);
      if (iconSrc) {
        g.setAttribute('data-hotspot-icon-src', iconSrc);
      } else {
        g.removeAttribute('data-hotspot-icon-src');
      }
      if (bgColor) g.setAttribute('data-bg-color', bgColor);
      if (iconColor) g.setAttribute('data-icon-color', iconColor);

      updatePageHtml(targetPageIndex, svg.outerHTML);
    });

    const handleAddElement = (e) => {
      console.log('handleAddElement triggered', e.detail);
      const { svgContent, pageIndex, dropPoint } = e.detail;
      const targetPageIndex = pageIndex !== undefined ? pageIndex : activePageIndex;
      const page = pages[targetPageIndex];
      if (!page) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html || '', 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return;

      const elementDoc = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`, 'image/svg+xml');
      const newElement = elementDoc.querySelector('g') || elementDoc.querySelector('svg').firstElementChild;
      if (!newElement) return;

      // Positioning logic if dropped
      if (dropPoint) {
        // Simple translation for the group if necessary, though it might already have one
        const currentTransform = newElement.getAttribute('transform') || '';
        newElement.setAttribute('transform', `translate(${dropPoint.x - 100}, ${dropPoint.y - 25}) ${currentTransform}`);
      }

      const targetContainer = svg.querySelector('[data-type="frame"]') || svg.querySelector('[data-name="Overlay"]') || svg;
      targetContainer.appendChild(newElement);

      updatePageHtml(targetPageIndex, svg.outerHTML);

      // Select the new element
      const newId = newElement.getAttribute('id');
      if (newId) {
        if (typeof setSingleSelection === 'function') {
          setSingleSelection(newId);
        } else {
          if (setSelectedLayerId) setSelectedLayerId(newId);
          selectedLayerIdRef.current = newId;
          if (setMultiSelectedIds) setMultiSelectedIds(new Set([newId]));
          multiSelectedIdsRef.current = new Set([newId]);
        }
        if (typeof setActiveMainTool === 'function') setActiveMainTool('select');
      }
    };

    window.addEventListener('add-element-to-editor', handleAddElement);
    window.addEventListener('add-image-to-editor', handleAddImage);
    window.addEventListener('upload-video-to-editor', handleUploadVideo);
    return () => {
      window.removeEventListener('add-element-to-editor', handleAddElement);
      window.removeEventListener('add-icon-to-editor', handleAddIcon);
      window.removeEventListener('add-hotspot-to-editor', handleAddHotspot);
      window.removeEventListener('add-image-to-editor', handleAddImage);
      window.removeEventListener('upload-video-to-editor', handleUploadVideo);
    };
  }, [activePageIndex, pages, updatePageHtml, setSelectedLayerId]);

  // ── Pre-load all images for instant view ──────────────────────────────────
  useEffect(() => {
    if (!pages || pages.length === 0) return;

    const loadedUrls = new Set();
    pages.forEach(page => {
      if (!page.html) return;

      // Extract data URLs, Blob URLs, and external URLs from href and src
      const regex = /(?:src|href)="([^"]+)"/g;
      let match;
      while ((match = regex.exec(page.html)) !== null) {
        const url = match[1];
        if (url && !loadedUrls.has(url)) {
          const img = new Image();
          img.src = url;
          // Force browser to decode the image into memory immediately
          if (img.decode) {
            img.decode().catch(() => { });
          }
          loadedUrls.add(url);
        }
      }

      // Also check for CSS background-images
      const styleRegex = /url\(["']?([^"']+)["']?\)/g;
      while ((match = styleRegex.exec(page.html)) !== null) {
        const url = match[1];
        if (url && !loadedUrls.has(url)) {
          const img = new Image();
          img.src = url;
          if (img.decode) {
            img.decode().catch(() => { });
          }
          loadedUrls.add(url);
        }
      }
    });
  }, [pages]);

  // ── Marquee Selection State ───────────────────────────────────────────────
  const [marquee, setMarquee] = useState(null); // { pageIndex }

  useEffect(() => { marqueeRef.current = marquee; }, [marquee]);

  const setsAreEqual = (a, b) => a.size === b.size && [...a].every(v => b.has(v));

  // ── Overlay Highlight Drawing Helpers ─────────────────────────────────────
  const getOverlayForElement = (el) => {
    const container = el.closest('.page-svg-container');
    if (!container) return null;
    const pageIdx = container.getAttribute('data-page-index');
    return document.getElementById(`highlight-overlay-${pageIdx}`);
  };

  const getHtmlOverlayForElement = (el) => {
    const container = el.closest('.page-svg-container');
    if (!container) return null;
    const pageIdx = container.getAttribute('data-page-index');
    return document.getElementById(`highlight-overlay-html-${pageIdx}`);
  };

  const getRotatingCursor = (dir, rotation) => {
    if (dir === 'linestart' || dir === 'lineend') return 'all-scroll';

    // Map base directions to their local angles (0 is East/Right)
    const baseAngles = { 'e': 0, 'se': 45, 's': 90, 'sw': 135, 'w': 180, 'nw': 225, 'n': 270, 'ne': 315 };
    const angle = (baseAngles[dir] + rotation + 360) % 180;

    if (angle >= 22.5 && angle < 67.5) return 'nwse-resize';
    if (angle >= 67.5 && angle < 112.5) return 'ns-resize';
    if (angle >= 112.5 && angle < 157.5) return 'nesw-resize';
    return 'ew-resize';
  };

  /**
   * syncMultiSelectionBox – live-syncs the overall bounding-box polygon and resize
   * handles for a multi-selection during drag/resize WITHOUT re-reading the DOM.
   *
   * @param {SVGElement} canvasSvg  – the canvas SVG element
   * @param {SVGElement} overlay    – the highlight-overlay SVG element
   * @param {Element|null} htmlOverlay – the HTML overlay div (for handles)
   * @param {{ x, y, width, height }} svgRootBBox – bounding box in SVG-root space
   */
  const syncMultiSelectionBox = (canvasSvg, overlay, htmlOverlay, svgRootBBox) => {
    if (!overlay || !canvasSvg || !svgRootBBox) return;
    try {
      const svgCTM = canvasSvg.getScreenCTM();
      const overlayCTM = overlay.getScreenCTM();
      if (!svgCTM || !overlayCTM) return;

      // Convert four SVG-root corners → overlay pixel coords
      const toOverlay = (rx, ry) => {
        const screen = new DOMPoint(rx, ry).matrixTransform(svgCTM);
        return new DOMPoint(screen.x, screen.y).matrixTransform(overlayCTM.inverse());
      };

      const tl = toOverlay(svgRootBBox.x, svgRootBBox.y);
      const tr = toOverlay(svgRootBBox.x + svgRootBBox.width, svgRootBBox.y);
      const br = toOverlay(svgRootBBox.x + svgRootBBox.width, svgRootBBox.y + svgRootBBox.height);
      const bl = toOverlay(svgRootBBox.x, svgRootBBox.y + svgRootBBox.height);

      // Axis-aligned bounding box in overlay space
      const minX = Math.min(tl.x, tr.x, br.x, bl.x);
      const maxX = Math.max(tl.x, tr.x, br.x, bl.x);
      const minY = Math.min(tl.y, tr.y, br.y, bl.y);
      const maxY = Math.max(tl.y, tr.y, br.y, bl.y);

      // Update the dummy rect position (used by the resize hit-test code)
      const dummyId = 'multi-selection-bounds';
      const dummy = overlay.querySelector(`[id="${dummyId}"]`);
      if (dummy) {
        dummy.setAttribute('x', minX);
        dummy.setAttribute('y', minY);
        dummy.setAttribute('width', maxX - minX);
        dummy.setAttribute('height', maxY - minY);
      }

      // Update (or create) the selection outline polygon
      const zoomScale = zoom / 100;
      const polyId = `overlay-poly-selected-${dummyId}`;
      let selPoly = overlay.querySelector(`[id="${polyId}"]`);
      if (!selPoly) {
        selPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        selPoly.id = polyId;
        selPoly.setAttribute('class', 'overlay-type-selected');
        selPoly.setAttribute('fill', 'none');
        selPoly.setAttribute('stroke', '#6366F1');
        selPoly.setAttribute('pointer-events', 'none');
        overlay.appendChild(selPoly);
      }
      selPoly.setAttribute('points', `${minX},${minY} ${maxX},${minY} ${maxX},${maxY} ${minX},${maxY}`);
      selPoly.setAttribute('stroke-width', String(1.5 / zoomScale));
      selPoly.removeAttribute('stroke-dasharray');

      // Update resize handles
      if (htmlOverlay) {
        const handleSize = 7.5;
        const handleNames = ['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'];
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const allPts = [
          { x: minX, y: minY }, { x: maxX, y: minY },
          { x: maxX, y: maxY }, { x: minX, y: maxY },
          { x: cx, y: minY }, { x: maxX, y: cy },
          { x: cx, y: maxY }, { x: minX, y: cy }
        ];
        allPts.forEach((p, i) => {
          const name = handleNames[i];
          const isSide = ['n', 'e', 's', 'w'].includes(name);
          const handleId = `resize-handle-${dummyId}-${name}`;
          let handle = htmlOverlay.querySelector(`[id="${handleId}"]`);
          if (!handle) {
            handle = document.createElement('div');
            handle.id = handleId;
            handle.className = `resize-handle overlay-type-selected absolute`;
            if (isSide) {
              handle.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
            } else {
              handle.style.backgroundColor = '#FFFFFF';
              handle.style.border = '1.5px solid #6366F1';
              handle.style.boxShadow = '0 1.5px 4px rgba(0,0,0,0.2)';
              handle.style.borderRadius = '0px';
            }
            handle.style.boxSizing = 'border-box';
            handle.style.pointerEvents = 'auto';
            handle.style.zIndex = isSide ? '999' : '1000';
            handle.style.position = 'absolute';
            htmlOverlay.appendChild(handle);
          }
          if (isSide) {
            const isHorizontal = (name === 'n' || name === 's');
            const dist = isHorizontal ? (maxX - minX) : (maxY - minY);
            const thickness = 8 / zoomScale;
            handle.style.width = isHorizontal ? `${dist}px` : `${thickness}px`;
            handle.style.height = isHorizontal ? `${thickness}px` : `${dist}px`;
          } else {
            handle.style.width = `${handleSize}px`;
            handle.style.height = `${handleSize}px`;
          }
          handle.style.left = `${p.x}px`;
          handle.style.top = `${p.y}px`;
          handle.style.transform = isSide
            ? `translate(-50%, -50%)`
            : `translate(-50%, -50%) scale(${1 / zoomScale})`;
          const cursorMap = { nw: 'nwse-resize', ne: 'nesw-resize', se: 'nwse-resize', sw: 'nesw-resize', n: 'ns-resize', e: 'ew-resize', s: 'ns-resize', w: 'ew-resize' };
          handle.style.cursor = cursorMap[name] || 'pointer';
        });
      }
    } catch (_e) { /* non-critical */ }
  };

  const drawMultiSelectionHighlight = (ids, type) => {
    document.querySelectorAll('.overlay-type-multi-child-selected').forEach(el => el.remove());
    const elementsByOverlay = new Map();

    ids.forEach(id => {
      document.querySelectorAll(`[id="${id}"]`).forEach(el => {
        if (el.style.visibility === 'hidden' || el.style.opacity === '0') return;
        const overlay = getOverlayForElement(el);
        if (!overlay) return;
        if (!elementsByOverlay.has(overlay)) elementsByOverlay.set(overlay, []);
        elementsByOverlay.get(overlay).push(el);
      });
    });

    elementsByOverlay.forEach((elements, overlay) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasValidBox = false;

      elements.forEach(el => {
        try {
          let bbox = getVisualBBox(el);
          const ctm = el.getScreenCTM();
          const overlayCtm = overlay.getScreenCTM();
          if (!ctm || !overlayCtm) return;

          const isFrame = el.getAttribute('data-type') === 'frame';
          if (isFrame || ((bbox.width < 5 || bbox.height < 5) && el.tagName.toLowerCase() !== 'line')) {
            const clientRect = el.getBoundingClientRect();
            const scale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) || 1;
            if (isFrame || clientRect.width / scale > 10 || clientRect.height / scale > 10 || el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'foreignobject') {
              if (clientRect.width > 0 && clientRect.height > 0) {
                const elInverse = ctm.inverse();
                const pt = overlay.createSVGPoint();
                pt.x = clientRect.left; pt.y = clientRect.top;
                const localTL = pt.matrixTransform(elInverse);
                pt.x = clientRect.right; pt.y = clientRect.bottom;
                const localBR = pt.matrixTransform(elInverse);
                bbox = {
                  x: Math.min(localTL.x, localBR.x),
                  y: Math.min(localTL.y, localBR.y),
                  width: Math.abs(localBR.x - localTL.x),
                  height: Math.abs(localBR.y - localTL.y)
                };
              }
            }
          }

          if (bbox.width === 0 && bbox.height === 0) return;

          const svgMatrix = overlayCtm.inverse().multiply(ctm);

          const pt1 = overlay.createSVGPoint(); pt1.x = bbox.x; pt1.y = bbox.y;
          const pt2 = overlay.createSVGPoint(); pt2.x = bbox.x + bbox.width; pt2.y = bbox.y;
          const pt3 = overlay.createSVGPoint(); pt3.x = bbox.x + bbox.width; pt3.y = bbox.y + bbox.height;
          const pt4 = overlay.createSVGPoint(); pt4.x = bbox.x; pt4.y = bbox.y + bbox.height;

          const pts = [pt1, pt2, pt3, pt4];

          pts.forEach(p => {
            const mapped = p.matrixTransform(svgMatrix);
            if (mapped.x < minX) minX = mapped.x;
            if (mapped.x > maxX) maxX = mapped.x;
            if (mapped.y < minY) minY = mapped.y;
            if (mapped.y > maxY) maxY = mapped.y;
          });
          hasValidBox = true;
        } catch (e) {
          console.error(e);
        }
      });

      if (!hasValidBox) return;

      const dummyId = 'multi-selection-bounds';
      let dummy = overlay.querySelector(`[id="${dummyId}"]`);
      if (!dummy) {
        dummy = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        dummy.id = dummyId;
        dummy.setAttribute('fill', 'none');
        dummy.setAttribute('pointer-events', 'none');
        overlay.appendChild(dummy);
      }

      dummy.setAttribute('x', minX);
      dummy.setAttribute('y', minY);
      dummy.setAttribute('width', maxX - minX);
      dummy.setAttribute('height', maxY - minY);

      // ── Draw selection outline directly for the multi-selection bounding box ──
      // NOTE: drawOverlayHighlight(dummy) cannot be used here because `dummy` lives inside
      // the overlay SVG itself (not under .page-svg-container), so getOverlayForElement
      // returns null and the function exits early without drawing anything.
      const zoomScale = zoom / 100;
      const polyId = `overlay-poly-selected-${dummyId}`;
      let selPoly = overlay.querySelector(`[id="${polyId}"]`);
      if (!selPoly) {
        selPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        selPoly.id = polyId;
        selPoly.setAttribute('class', 'overlay-type-selected');
        selPoly.setAttribute('fill', 'none');
        selPoly.setAttribute('stroke', '#6366F1');
        selPoly.setAttribute('pointer-events', 'none');
        overlay.appendChild(selPoly);
      }
      selPoly.setAttribute('points', `${minX},${minY} ${maxX},${minY} ${maxX},${maxY} ${minX},${maxY}`);
      selPoly.setAttribute('stroke-width', String(1.5 / zoomScale));
      selPoly.removeAttribute('stroke-dasharray');

      // ── Draw resize handles for the multi-selection bounding box ──
      // Find the HTML overlay container via the page-svg-container of the first element
      const firstEl = elements[0];
      const htmlOverlay = firstEl ? getHtmlOverlayForElement(firstEl) : null;
      if (htmlOverlay) {
        const handleSize = 7.5;
        const handleNames = ['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'];
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const corners = [
          { x: minX, y: minY }, { x: maxX, y: minY },
          { x: maxX, y: maxY }, { x: minX, y: maxY }
        ];
        const mids = [
          { x: cx, y: minY }, { x: maxX, y: cy },
          { x: cx, y: maxY }, { x: minX, y: cy }
        ];
        const allPts = [...corners, ...mids];
        allPts.forEach((p, i) => {
          const name = handleNames[i];
          const isSide = ['n', 'e', 's', 'w'].includes(name);
          const handleId = `resize-handle-${dummyId}-${name}`;
          let handle = htmlOverlay.querySelector(`[id="${handleId}"]`);
          if (!handle) {
            handle = document.createElement('div');
            handle.id = handleId;
            handle.className = `resize-handle overlay-type-selected absolute`;
            if (isSide) {
              handle.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
            } else {
              handle.style.backgroundColor = '#FFFFFF';
              handle.style.border = '1.5px solid #6366F1';
              handle.style.boxShadow = '0 1.5px 4px rgba(0,0,0,0.2)';
              handle.style.borderRadius = '0px';
            }
            handle.style.boxSizing = 'border-box';
            handle.style.pointerEvents = 'auto';
            handle.style.zIndex = isSide ? '999' : '1000';
            htmlOverlay.appendChild(handle);
          }
          if (isSide) {
            const isHorizontal = (name === 'n' || name === 's');
            const dist = isHorizontal ? (maxX - minX) : (maxY - minY);
            const thickness = 8 / zoomScale;
            handle.style.width = isHorizontal ? `${dist}px` : `${thickness}px`;
            handle.style.height = isHorizontal ? `${thickness}px` : `${dist}px`;
            handle.style.left = `${p.x}px`;
            handle.style.top = `${p.y}px`;
            handle.style.transform = `translate(-50%, -50%) rotate(0deg)`;
          } else {
            handle.style.width = `${handleSize}px`;
            handle.style.height = `${handleSize}px`;
            handle.style.left = `${p.x}px`;
            handle.style.top = `${p.y}px`;
            handle.style.transform = `translate(-50%, -50%) scale(${1 / zoomScale})`;
          }
          const cursorMap = { nw: 'nwse-resize', ne: 'nesw-resize', se: 'nwse-resize', sw: 'nesw-resize', n: 'ns-resize', e: 'ew-resize', s: 'ns-resize', w: 'ew-resize' };
          handle.style.cursor = cursorMap[name] || 'pointer';
        });
      }

      elements.forEach(el => {
        drawOverlayHighlight(el, 'multi-child-selected');
      });
    });
  };

  // ── IN-PLACE CROP PAN & ZOOM OVERLAY CONTROLLER ────────────────────────────
  /*
  const [activeCropId, setActiveCropId] = useState(null);
  const activeCropIdRef = useRef(null);
  activeCropIdRef.current = activeCropId;

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

  // Listen for mouse drag (pan) & wheel scroll (zoom) when activeCropId is active
  useEffect(() => {
    if (!activeCropId) return;

    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    if (!pageContainer) return;
    const svg = pageContainer.querySelector('svg');
    if (!svg) return;
    const cropEl = svg.querySelector(`[id="${activeCropId}"]`);
    if (!cropEl) return;
    const imgEl = cropEl.querySelector('image, video, img, foreignObject') || (cropEl.tagName?.toLowerCase() === 'image' ? cropEl : null);
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

      // Calculate crop cutout box bounds in overlay coordinates
      const targetCropEl = cropEl;
      const ctm = targetCropEl.getScreenCTM();
      const overlayCtm = overlay.getScreenCTM();
      if (!ctm || !overlayCtm) return;

      const svgMatrix = overlayCtm.inverse().multiply(ctm);
      const bbox = getVisualBBox(cropEl);

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

      // Calculate full uncropped transformed image bounds in overlay space
      const cd = getCropData();
      const origW = parseFloat(cropEl.getAttribute('data-crop-orig-w') || imgEl.getAttribute('width') || '100');
      const origH = parseFloat(cropEl.getAttribute('data-crop-orig-h') || imgEl.getAttribute('height') || '100');
      const origX = parseFloat(cropEl.getAttribute('data-crop-orig-x') || imgEl.getAttribute('x') || '0');
      const origY = parseFloat(cropEl.getAttribute('data-crop-orig-y') || imgEl.getAttribute('y') || '0');

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

      const imgSrc = imgEl.getAttribute('href') || imgEl.getAttribute('xlink:href') || imgEl.getAttribute('src') || '';
      const imgPreserve = imgEl.getAttribute('preserveAspectRatio') || 'xMidYMid slice';

      maskGroup.innerHTML = `
        <defs>
          <mask id="${maskId}">
            <!-- Full White Mask over Outer Image area -->
            <rect x="${gMinX}" y="${gMinY}" width="${gWidth}" height="${gHeight}" fill="white" />
            <!-- Cutout Hole over Crop Box area -->
            <rect x="${minX}" y="${minY}" width="${cWidth}" height="${cHeight}" fill="black" />
          </mask>
        </defs>

        <!-- Full Uncropped Ghost Image rendered under black transparent shade -->
        ${imgSrc ? `<image href="${imgSrc}" x="${gMinX}" y="${gMinY}" width="${gWidth}" height="${gHeight}" preserveAspectRatio="${imgPreserve}" style="pointer-events: none;" />` : ''}

        <!-- Black Transparent Shade ON OUTER UNCROPPED IMAGE ONLY -->
        <rect x="${gMinX}" y="${gMinY}" width="${gWidth}" height="${gHeight}" fill="rgba(0, 0, 0, 0.65)" mask="url(#${maskId})" pointer-events="none" />

        <!-- 3x3 Rule-of-Thirds Grid Lines Inside Crop Frame -->
        <line x1="${minX + cWidth / 3}" y1="${minY}" x2="${minX + cWidth / 3}" y2="${minY + cHeight}" stroke="rgba(255, 255, 255, 0.75)" stroke-width="1" pointer-events="none" />
        <line x1="${minX + (cWidth * 2) / 3}" y1="${minY}" x2="${minX + (cWidth * 2) / 3}" y2="${minY + cHeight}" stroke="rgba(255, 255, 255, 0.75)" stroke-width="1" pointer-events="none" />
        <line x1="${minX}" y1="${minY + cHeight / 3}" x2="${minX + cWidth}" y2="${minY + cHeight / 3}" stroke="rgba(255, 255, 255, 0.75)" stroke-width="1" pointer-events="none" />
        <line x1="${minX}" y1="${minY + (cHeight * 2) / 3}" x2="${minX + cWidth}" y2="${minY + (cHeight * 2) / 3}" stroke="rgba(255, 255, 255, 0.75)" stroke-width="1" pointer-events="none" />
      `;
    };

    renderMaskCutout();

    let isDragging = false;
    let startX = 0, startY = 0;
    let startOffX = 0, startOffY = 0;

    const updateTransform = (cd) => {
      const origW = parseFloat(cropEl.getAttribute('data-crop-orig-w') || imgEl.getAttribute('width') || '100');
      const origH = parseFloat(cropEl.getAttribute('data-crop-orig-h') || imgEl.getAttribute('height') || '100');
      const origX = parseFloat(cropEl.getAttribute('data-crop-orig-x') || imgEl.getAttribute('x') || '0');
      const origY = parseFloat(cropEl.getAttribute('data-crop-orig-y') || imgEl.getAttribute('y') || '0');

      const centerX = origX + (origW / 2);
      const centerY = origY + (origH / 2);
      const panX = (origW * (cd.offX || 0)) / 100;
      const panY = (origH * (cd.offY || 0)) / 100;
      const sc = parseFloat(cd.scale) || 1;

      imgEl.setAttribute('transform', `translate(${centerX + panX} ${centerY + panY}) scale(${sc}) translate(${-centerX} ${-centerY})`);
      cropEl.setAttribute('data-crop-data', JSON.stringify(cd));
      drawOverlayHighlight(cropEl, 'selected');
      renderMaskCutout();
    };

    const onPointerDown = (e) => {
      if (e.button !== 0) return;

      const clickX = e.clientX;
      const clickY = e.clientY;

      // Direct hit check on cropEl, imgEl, mask group or handles
      const isDirectHit = (
        cropEl.contains(e.target) ||
        (imgEl && imgEl.contains(e.target)) ||
        Boolean(e.target.closest('#crop-mode-mask-group')) ||
        Boolean(e.target.closest('.resize-handle')) ||
        Boolean(e.target.closest('[id^="overlay-poly-"]'))
      );

      // Geometric bounding box check of cropEl
      const targetBBox = cropEl.getBoundingClientRect();
      const isInsideBBox = (
        clickX >= targetBBox.left - 15 &&
        clickX <= targetBBox.right + 15 &&
        clickY >= targetBBox.top - 15 &&
        clickY <= targetBBox.bottom + 15
      );

      if (!isDirectHit && !isInsideBBox) {
        // User clicked outside image area -> exit Overlay mode
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

      const origW = parseFloat(cropEl.getAttribute('data-crop-orig-w') || imgEl.getAttribute('width') || '100');
      const origH = parseFloat(cropEl.getAttribute('data-crop-orig-h') || imgEl.getAttribute('height') || '100');

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
        saveModifiedPageHtml(activePageIndex, svg);
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
      saveModifiedPageHtml(activePageIndex, svg);
    };

    // Exit overlay mode on Enter or Escape key press
    const onKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setActiveCropId(null);
        activeCropIdRef.current = null;
      }
    };

    pageContainer.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    pageContainer.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      pageContainer.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      pageContainer.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);

      // Restore clip-paths when exiting crop edit mode
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
  */

  const clearMeasurementOverlay = () => {
    document.querySelectorAll('.measurement-overlay-group').forEach(el => el.remove());
  };

  const drawMeasurementOverlay = (targetEl, clientX, clientY, forceDraw = false) => {
    clearMeasurementOverlay();
    if (nodeEditModeRef.current) return;
    if (!forceDraw && (!isAltPressedRef.current || !selectedLayerIdRef.current)) return;

    let isMultiTarget = Array.isArray(targetEl);
    let firstTarget = isMultiTarget ? targetEl[0] : targetEl;

    let svg = null;
    if (firstTarget && firstTarget.ownerSVGElement) {
      svg = firstTarget.ownerSVGElement;
    } else {
      svg = document.querySelector('.page-svg-container svg');
    }
    if (!svg) return;

    const selectedEl = svg.querySelector(`[id="${selectedLayerIdRef.current}"]`);
    if (!selectedEl) return;

    const isSelectedBackgroundOrFrame = selectedEl.getAttribute('data-name') === 'Overlay' ||
      selectedEl.getAttribute('data-type') === 'background' ||
      selectedEl.getAttribute('data-type') === 'frame';
    if (isSelectedBackgroundOrFrame) return;

    if (firstTarget && selectedEl.contains(firstTarget)) return;

    if (firstTarget && multiSelectedIdsRef.current && multiSelectedIdsRef.current.size > 1) {
      if (multiSelectedIdsRef.current.has(firstTarget.id)) return;
      let isInsideSelection = false;
      multiSelectedIdsRef.current.forEach(id => {
        const el = svg.querySelector(`[id="${id}"]`);
        if (el && el.contains(firstTarget)) isInsideSelection = true;
      });
      if (isInsideSelection) return;
    }

    let measureTarget = null;
    let measureTargetArray = null;

    if (isMultiTarget) {
      measureTargetArray = targetEl;
      measureTarget = firstTarget;
    } else {
      let actualTarget = targetEl;
      if (actualTarget && actualTarget !== svg) {
        const layerEl = (typeof actualTarget.closest === 'function')
          ? actualTarget.closest('g[id], [data-type]:not([data-type="background"]):not([data-name="Overlay"]), [data-crop-data], [id]:not(svg):not(path):not(defs):not(clipPath)')
          : null;
        if (layerEl && layerEl !== svg) {
          actualTarget = layerEl;
        }
      }

      if (actualTarget && actualTarget !== svg && actualTarget !== selectedEl && !selectedEl.contains(actualTarget)) {
        const isOverlay = actualTarget.getAttribute('data-name') === 'Overlay' ||
          actualTarget.getAttribute('data-type') === 'background' ||
          (actualTarget.getAttribute('class') && actualTarget.getAttribute('class').includes('overlay'));
        if (!isOverlay) measureTarget = actualTarget;
      }

      if (!measureTarget) {
        measureTarget = (selectedEl.parentElement && selectedEl.parentElement.closest('[data-type="frame"]')) || svg.querySelector('[data-type="background"]');
      }
      if (!measureTarget || measureTarget === selectedEl || selectedEl.contains(measureTarget)) return;
    }

    const overlay = getOverlayForElement(selectedEl);
    if (!overlay) return;

    const getOverlayRect = (el) => {
      if (!el) return null;
      const isFrameOrBg = el.getAttribute('data-type') === 'frame' || el.getAttribute('data-type') === 'background' || el.getAttribute('data-name') === 'Overlay';
      if (isFrameOrBg) {
        const clientRect = el.getBoundingClientRect();
        const overlayInverse = overlay.getScreenCTM()?.inverse();
        if (overlayInverse && clientRect.width > 0) {
          const pt = overlay.createSVGPoint();
          pt.x = clientRect.left; pt.y = clientRect.top;
          const tl = pt.matrixTransform(overlayInverse);
          pt.x = clientRect.right; pt.y = clientRect.bottom;
          const br = pt.matrixTransform(overlayInverse);
          return {
            left: Math.min(tl.x, br.x),
            right: Math.max(tl.x, br.x),
            top: Math.min(tl.y, br.y),
            bottom: Math.max(tl.y, br.y),
            width: Math.abs(br.x - tl.x),
            height: Math.abs(br.y - tl.y)
          };
        }
      }

      let bbox = getVisualBBox(el);
      if (!bbox || (bbox.width === 0 && bbox.height === 0)) {
        try {
          const bb = el.getBBox();
          if (bb && (bb.width > 0 || bb.height > 0)) {
            bbox = { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
          }
        } catch (e) { }
      }
      if (!bbox || (bbox.width === 0 && bbox.height === 0)) return null;

      const ctmNode = el;
      const ctm = ctmNode.getScreenCTM();
      const overlayCtm = overlay.getScreenCTM();
      if (!ctm || !overlayCtm) return null;

      const svgMatrix = overlayCtm.inverse().multiply(ctm);
      const pts = [
        { x: bbox.x, y: bbox.y },
        { x: bbox.x + bbox.width, y: bbox.y },
        { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
        { x: bbox.x, y: bbox.y + bbox.height }
      ];

      const mapped = pts.map(p => {
        const pt = overlay.createSVGPoint();
        pt.x = p.x;
        pt.y = p.y;
        return pt.matrixTransform(svgMatrix);
      });

      const xs = mapped.map(p => p.x);
      const ys = mapped.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      return {
        left: minX,
        right: maxX,
        top: minY,
        bottom: maxY,
        width: maxX - minX,
        height: maxY - minY
      };
    };

    let rect1 = getOverlayRect(selectedEl);
    if (multiSelectedIdsRef.current && multiSelectedIdsRef.current.size > 1) {
      const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
      multiSelectedIdsRef.current.forEach(id => {
        const el = svg.querySelector(`[id="${id}"]`);
        if (el) {
          const r = getOverlayRect(el);
          if (r) {
            bounds.left = Math.min(bounds.left, r.left);
            bounds.top = Math.min(bounds.top, r.top);
            bounds.right = Math.max(bounds.right, r.right);
            bounds.bottom = Math.max(bounds.bottom, r.bottom);
          }
        }
      });
      if (bounds.left !== Infinity) {
        rect1 = { ...bounds, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top };
      }
    }

    let rect2 = null;
    if (measureTargetArray) {
      const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
      measureTargetArray.forEach(el => {
        if (!el) return;
        const r = getOverlayRect(el);
        if (r) {
          bounds.left = Math.min(bounds.left, r.left);
          bounds.top = Math.min(bounds.top, r.top);
          bounds.right = Math.max(bounds.right, r.right);
          bounds.bottom = Math.max(bounds.bottom, r.bottom);
        }
      });
      if (bounds.left !== Infinity) {
        rect2 = { ...bounds, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top };
      }
    } else {
      rect2 = getOverlayRect(measureTarget);
    }

    if (!rect1 || !rect2) return;

    // Map viewport pixels to mm using the actual base document dimensions
    const ptToMmScale = baseWidth / ((window.innerHeight * 0.78) * (baseWidth / baseHeight));
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'measurement-overlay-group');
    g.style.pointerEvents = 'none';

    const zoomScale = zoom / 100;
    const invScale = 1 / zoomScale;

    const drawLineAndLabel = (x1, y1, x2, y2, value) => {
      if (value < 0.5) return;
      const mm = (value * ptToMmScale).toFixed(1);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#00a58e');
      line.setAttribute('stroke-width', String(1 * invScale));
      g.appendChild(line);

      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;

      const tw = Math.max(24, mm.length * 6.5) * invScale;
      const th = 14 * invScale;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', cx - tw / 2);
      rect.setAttribute('y', cy - th / 2);
      rect.setAttribute('width', tw);
      rect.setAttribute('height', th);
      rect.setAttribute('rx', String(3.5 * invScale));
      rect.setAttribute('fill', '#00a58e');
      g.appendChild(rect);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', cx);
      text.setAttribute('y', cy + (3.5 * invScale));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#FFFFFF');
      text.setAttribute('font-size', `${9 * invScale}px`);
      text.setAttribute('font-family', 'sans-serif');
      text.setAttribute('font-weight', '500');
      text.textContent = mm;
      g.appendChild(text);
    };

    const isParent = measureTarget.contains(selectedEl) || measureTarget.getAttribute('data-type') === 'background';

    const cx1 = rect1.left + rect1.width / 2;
    const cy1 = rect1.top + rect1.height / 2;

    if (isParent) {
      drawLineAndLabel(cx1, rect1.top, cx1, rect2.top, rect1.top - rect2.top);
      drawLineAndLabel(cx1, rect1.bottom, cx1, rect2.bottom, rect2.bottom - rect1.bottom);
      drawLineAndLabel(rect1.left, cy1, rect2.left, cy1, rect1.left - rect2.left);
      drawLineAndLabel(rect1.right, cy1, rect2.right, cy1, rect2.right - rect1.right);
    } else {
      const cx2 = rect2.left + rect2.width / 2;
      const cy2 = rect2.top + rect2.height / 2;

      const drawY = cy2;
      const drawX = cx2;

      const drawSolidLine = (x1, y1, x2, y2) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', '#00a58e');
        line.setAttribute('stroke-width', String(1 * invScale));
        line.setAttribute('stroke-dasharray', `${4 * invScale} ${2 * invScale}`);
        g.appendChild(line);
      };

      // Horizontal measurement
      if (rect1.left >= rect2.right) {
        drawLineAndLabel(rect1.left, drawY, rect2.right, drawY, rect1.left - rect2.right);
        if (drawY < rect1.top) drawSolidLine(rect1.left, rect1.top, rect1.left, drawY);
        else if (drawY > rect1.bottom) drawSolidLine(rect1.left, rect1.bottom, rect1.left, drawY);
      } else if (rect1.right <= rect2.left) {
        drawLineAndLabel(rect1.right, drawY, rect2.left, drawY, rect2.left - rect1.right);
        if (drawY < rect1.top) drawSolidLine(rect1.right, rect1.top, rect1.right, drawY);
        else if (drawY > rect1.bottom) drawSolidLine(rect1.right, rect1.bottom, rect1.right, drawY);
      } else {
        const isCompletelyInsideX = rect1.left >= rect2.left && rect1.right <= rect2.right;

        if ((isCompletelyInsideX || rect1.left < rect2.left) && Math.abs(rect1.left - rect2.left) >= 0.5) {
          drawLineAndLabel(rect1.left, drawY, rect2.left, drawY, Math.abs(rect1.left - rect2.left));
          if (drawY < rect1.top) drawSolidLine(rect1.left, rect1.top, rect1.left, drawY);
          else if (drawY > rect1.bottom) drawSolidLine(rect1.left, rect1.bottom, rect1.left, drawY);
        }
        if ((isCompletelyInsideX || rect1.right > rect2.right) && Math.abs(rect1.right - rect2.right) >= 0.5) {
          drawLineAndLabel(rect1.right, drawY, rect2.right, drawY, Math.abs(rect1.right - rect2.right));
          if (drawY < rect1.top) drawSolidLine(rect1.right, rect1.top, rect1.right, drawY);
          else if (drawY > rect1.bottom) drawSolidLine(rect1.right, rect1.bottom, rect1.right, drawY);
        }
      }

      // Vertical measurement
      if (rect1.top >= rect2.bottom) {
        drawLineAndLabel(drawX, rect1.top, drawX, rect2.bottom, rect1.top - rect2.bottom);
        if (drawX < rect1.left) drawSolidLine(rect1.left, rect1.top, drawX, rect1.top);
        else if (drawX > rect1.right) drawSolidLine(rect1.right, rect1.top, drawX, rect1.top);
      } else if (rect1.bottom <= rect2.top) {
        drawLineAndLabel(drawX, rect1.bottom, drawX, rect2.top, rect2.top - rect1.bottom);
        if (drawX < rect1.left) drawSolidLine(rect1.left, rect1.bottom, drawX, rect1.bottom);
        else if (drawX > rect1.right) drawSolidLine(rect1.right, rect1.bottom, drawX, rect1.bottom);
      } else {
        const isCompletelyInsideY = rect1.top >= rect2.top && rect1.bottom <= rect2.bottom;

        if ((isCompletelyInsideY || rect1.top < rect2.top) && Math.abs(rect1.top - rect2.top) >= 0.5) {
          drawLineAndLabel(drawX, rect1.top, drawX, rect2.top, Math.abs(rect1.top - rect2.top));
          if (drawX < rect1.left) drawSolidLine(rect1.left, rect1.top, drawX, rect1.top);
          else if (drawX > rect1.right) drawSolidLine(rect1.right, rect1.top, drawX, rect1.top);
        }
        if ((isCompletelyInsideY || rect1.bottom > rect2.bottom) && Math.abs(rect1.bottom - rect2.bottom) >= 0.5) {
          drawLineAndLabel(drawX, rect1.bottom, drawX, rect2.bottom, Math.abs(rect1.bottom - rect2.bottom));
          if (drawX < rect1.left) drawSolidLine(rect1.left, rect1.bottom, drawX, rect1.bottom);
          else if (drawX > rect1.right) drawSolidLine(rect1.right, rect1.bottom, drawX, rect1.bottom);
        }
      }
    }

    const targetRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    targetRect.setAttribute('x', rect2.left);
    targetRect.setAttribute('y', rect2.top);
    targetRect.setAttribute('width', rect2.width);
    targetRect.setAttribute('height', rect2.height);
    targetRect.setAttribute('fill', 'none');
    targetRect.setAttribute('stroke', '#00a58e');
    targetRect.setAttribute('stroke-width', String(1 * invScale));
    g.appendChild(targetRect);

    overlay.appendChild(g);
  };
  drawMeasurementOverlayRef.current = drawMeasurementOverlay;

  const drawInteractionBadge = (el, mapped, htmlOverlay, zoomScale, bbox) => {
    const isInteraction = activeTopToolRef.current === 'interaction';
    const isAnimation = activeTopToolRef.current === 'animation';
    if (!isInteraction && !isAnimation) return;
    if (!htmlOverlay) return;
    if (isAnimation && el.getAttribute('data-name') === 'Free Frame') return;

    const badgeId = `interaction-badge-${el.id}`;
    let badge = htmlOverlay.querySelector(`[id="${badgeId}"]`);

    const currentTool = activeTopToolRef.current;
    if (badge && badge.getAttribute('data-tool') !== currentTool) {
      badge.remove();
      badge = null;
    }

    const hasInteract = (el.getAttribute('data-interaction') && el.getAttribute('data-interaction') !== 'none') || el.getAttribute('data-interaction-intent') === 'true';
    const animType = el.getAttribute('data-animation-open-type');
    const interactType = el.getAttribute('data-animation-interact-type');
    const hasAnim = (animType && animType !== 'none') || (interactType && interactType !== 'none') || el.getAttribute('data-animation-intent') === 'true';

    const isAssigned = isInteraction ? hasInteract : hasAnim;

    if (!badge) {
      badge = document.createElement('div');
      badge.id = badgeId;
      badge.setAttribute('data-tool', currentTool);
      badge.className = 'absolute z-[2000] cursor-pointer flex flex-col items-center group/badge pointer-events-auto';

      const mainBox = document.createElement('div');
      mainBox.setAttribute('data-badge-mainbox', 'true');
      mainBox.className = 'relative bg-[#3F3F46] rounded-[0.3vw] p-[0.2vw] shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border border-dashed border-black';
      mainBox.style.width = '1.6vw';
      mainBox.style.height = '1.6vw';

      if (isAnimation) {
        mainBox.innerHTML = `
          <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.85 8.62L22 9.24L16.54 13.97L18.18 21L12 17.27L5.82 21L7.46 13.97L2 9.24L9.15 8.62L12 2Z" fill="white"/>
          </svg>
        `;
      } else {
        mainBox.innerHTML = `
          <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 7.99791H6.176C4.679 7.99791 3.93 7.99791 3.466 7.55791C3 7.12091 3 6.41391 3 5.00091C3 3.58791 3 2.88091 3.465 2.44291C3.93 2.00391 4.679 2.00391 6.176 2.00391H17.823C19.321 2.00391 20.07 2.00391 20.535 2.44291C21 2.88191 21 3.58691 21 4.99991C21 6.41291 21 7.11991 20.535 7.55891C20.07 7.99791 19.321 7.99791 17.823 7.99791H16.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7.42375 17.5184L6.54475 16.3864L5.42475 14.9414C4.98275 14.3964 4.90275 13.7304 5.18275 13.1414C5.28206 12.9339 5.43587 12.7573 5.62775 12.6304C6.24475 12.2234 7.09575 12.1744 7.62775 12.7114L9.59875 14.3894V6.63744C9.59875 5.77444 10.4187 5.02344 11.3447 5.02344C12.2707 5.02344 13.0967 5.77444 13.0967 6.63744V10.7274C14.6217 10.6054 17.0677 11.1684 18.5117 12.2754C19.7727 13.2404 20.5777 13.7774 19.5257 16.9554C19.1997 17.9384 18.3847 19.2914 18.2527 19.6734C18.1217 20.0534 17.9817 20.2804 18.0317 21.9934M6.54475 16.3864C6.81275 16.7104 7.08375 17.0884 7.42375 17.5184M9.52975 21.9994V21.0534C9.60275 19.8904 8.54675 18.9574 7.42375 17.5184M7.42375 17.5184C7.34275 17.4144 7.49975 17.6154 7.42375 17.5184ZM7.42375 17.5184L8.53075 18.8724" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      }

      const plusBadge = document.createElement('div');
      plusBadge.setAttribute('data-badge-plus', 'true');
      plusBadge.className = 'absolute -top-1 -right-1 flex items-center justify-center';
      plusBadge.style.width = '0.75vw';
      plusBadge.style.height = '0.75vw';
      if (isAssigned) {
        plusBadge.innerHTML = `
          <svg width="0.75vw" height="0.75vw" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7.5" fill="#22C55E" stroke="white"/>
            <path d="M5 8L7 10L11 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      } else {
        plusBadge.innerHTML = `
          <svg width="0.75vw" height="0.75vw" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5Z" fill="white"/>
            <path d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5Z" stroke="#4A3AFF"/>
            <path d="M12.0007 8.66536H8.66732V11.9987C8.66732 12.3654 8.36732 12.6654 8.00065 12.6654C7.63398 12.6654 7.33398 12.3654 7.33398 11.9987V8.66536H4.00065C3.63398 8.66536 3.33398 8.36536 3.33398 7.9987C3.33398 7.63203 3.63398 7.33203 4.00065 7.33203H7.33398V3.9987C7.33398 3.63203 7.63398 3.33203 8.00065 3.33203C8.36732 3.33203 8.66732 3.63203 8.66732 3.9987V7.33203H12.0007C12.3673 7.33203 12.6673 7.63203 12.6673 7.9987C12.6673 8.36536 12.3673 8.66536 12.0007 8.66536Z" fill="#4A3AFF"/>
          </svg>
        `;
      }
      mainBox.appendChild(plusBadge);

      const label = document.createElement('div');
      label.setAttribute('data-badge-label', 'true');
      label.className = 'absolute top-1/2 -translate-y-1/2 bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs whitespace-nowrap flex items-center opacity-0 group-hover/badge:opacity-100 transition-opacity duration-150 pointer-events-none z-50';
      label.style.left = '100%';
      label.style.marginLeft = '0.5vw';

      const arrow = document.createElement('div');
      arrow.setAttribute('data-badge-arrow', 'true');
      arrow.className = 'absolute w-0 h-0 pointer-events-none';
      arrow.style.cssText = 'position:absolute; left:-0.22vw; top:50%; transform:translateY(-50%); width:0; height:0; border-top:0.25vw solid transparent; border-bottom:0.25vw solid transparent; border-right:0.3vw solid rgba(17, 24, 39, 0.9); border-left:none;';

      const textSpan = document.createElement('span');
      textSpan.setAttribute('data-badge-text', 'true');
      textSpan.textContent = isAnimation
        ? (isAssigned ? 'Animation Added' : 'Click To Add Animation')
        : (isAssigned ? 'Interaction Added' : 'Click To Add Interaction');

      label.appendChild(arrow);
      label.appendChild(textSpan);
      badge.appendChild(mainBox);
      badge.appendChild(label);

      htmlOverlay.appendChild(badge);
    }

    if (badge) {
      let clickProcessed = false;
      const handleBadgeAction = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (clickProcessed) return;
        clickProcessed = true;
        setTimeout(() => { clickProcessed = false; }, 200);

        const targetId = el.id || el.getAttribute('data-name');
        if (!targetId) return;

        if (isAnimation) {
          el.setAttribute('data-animation-open-type', el.getAttribute('data-animation-open-type') || 'fade-in');
          el.setAttribute('data-animation-open-duration', el.getAttribute('data-animation-open-duration') || '1');
          el.setAttribute('data-animation-open-delay', el.getAttribute('data-animation-open-delay') || '0');
          el.setAttribute('data-animation-open-easing', el.getAttribute('data-animation-open-easing') || 'ease');
          el.setAttribute('data-animation-intent', 'true');

          if (typeof updateElementAttribute === 'function') {
            updateElementAttribute(activePageIndex, targetId, {
              'data-animation-open-type': el.getAttribute('data-animation-open-type') || 'fade-in',
              'data-animation-open-duration': el.getAttribute('data-animation-open-duration') || '1',
              'data-animation-open-delay': el.getAttribute('data-animation-open-delay') || '0',
              'data-animation-open-easing': el.getAttribute('data-animation-open-easing') || 'ease',
              'data-animation-intent': 'true'
            });
          }

          const plusBox = badge.querySelector('[data-badge-plus]');
          if (plusBox) {
            plusBox.innerHTML = `
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="7.5" fill="#22C55E" stroke="white"/>
                <path d="M5 8L7 10L11 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `;
          }
          const textBox = badge.querySelector('[data-badge-text]');
          if (textBox) {
            textBox.textContent = 'Animation Added';
          }

          if (typeof setActiveTopTool === 'function') setActiveTopTool('animation');
          window.dispatchEvent(new CustomEvent('animation-force-add', { detail: targetId }));
        } else {
          const event = new CustomEvent('add-free-frame', {
            detail: {
              elementId: targetId,
              bbox: bbox
            }
          });
          window.dispatchEvent(event);
        }
      };

      badge.onpointerdown = handleBadgeAction;
      badge.onmousedown = handleBadgeAction;
      badge.onclick = handleBadgeAction;

      const plusBox = badge.querySelector('[data-badge-plus]');
      if (plusBox) {
        if (isAssigned) {
          plusBox.innerHTML = `
            <svg width="0.75vw" height="0.75vw" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="7.5" fill="#22C55E" stroke="white"/>
              <path d="M5 8L7 10L11 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
        } else {
          plusBox.innerHTML = `
            <svg width="0.75vw" height="0.75vw" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5Z" fill="white"/>
              <path d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5Z" stroke="#4A3AFF"/>
              <path d="M12.0007 8.66536H8.66732V11.9987C8.66732 12.3654 8.36732 12.6654 8.00065 12.6654C7.63398 12.6654 7.33398 12.3654 7.33398 11.9987V8.66536H4.00065C3.63398 8.66536 3.33398 8.36536 3.33398 7.9987C3.33398 7.63203 3.63398 7.33203 4.00065 7.33203H7.33398V3.9987C7.33398 3.63203 7.63398 3.33203 8.00065 3.33203C8.36732 3.33203 8.66732 3.63203 8.66732 3.9987V7.33203H12.0007C12.3673 7.33203 12.6673 7.63203 12.6673 7.9987C12.6673 8.36536 12.3673 8.66536 12.0007 8.66536Z" fill="#4A3AFF"/>
            </svg>
          `;
        }
      }

      const midN = { x: (mapped[0].x + mapped[1].x) / 2, y: (mapped[0].y + mapped[1].y) / 2 };
      const vwOffset = (window.innerWidth * 0.006) / zoomScale;
      badge.style.left = `${midN.x}px`;

      if (midN.y < 35 / zoomScale) {
        badge.style.top = `${midN.y + vwOffset}px`;
        badge.style.transformOrigin = 'top center';
        badge.style.transform = `translate(-50%, 0%) scale(${1 / zoomScale})`;
      } else {
        badge.style.top = `${midN.y - vwOffset}px`;
        badge.style.transformOrigin = 'bottom center';
        badge.style.transform = `translate(-50%, -100%) scale(${1 / zoomScale})`;
      }

      const containerWidth = htmlOverlay?.getBoundingClientRect?.()?.width || 9999;
      const labelEl = badge.querySelector('[data-badge-label]');
      const arrowEl = badge.querySelector('[data-badge-arrow]');
      const textEl = badge.querySelector('[data-badge-text]');
      if (textEl) {
        const textStr = isAnimation
          ? (isAssigned ? 'Animation Added' : 'Click To Add Animation')
          : (isAssigned ? 'Interaction Added' : 'Click To Add Interaction');
        textEl.textContent = textStr;
      }

      if (labelEl && arrowEl) {
        if (midN.x > containerWidth * 0.55) {
          labelEl.style.left = 'auto';
          labelEl.style.right = '100%';
          labelEl.style.marginLeft = '0';
          labelEl.style.marginRight = '0.5vw';
          arrowEl.style.cssText = 'position:absolute; right:-0.22vw; left:auto; top:50%; transform:translateY(-50%); width:0; height:0; border-top:0.25vw solid transparent; border-bottom:0.25vw solid transparent; border-left:0.3vw solid rgba(17, 24, 39, 0.9); border-right:none;';
        } else {
          labelEl.style.left = '100%';
          labelEl.style.right = 'auto';
          labelEl.style.marginLeft = '0.5vw';
          labelEl.style.marginRight = '0';
          arrowEl.style.cssText = 'position:absolute; left:-0.22vw; right:auto; top:50%; transform:translateY(-50%); width:0; height:0; border-top:0.25vw solid transparent; border-bottom:0.25vw solid transparent; border-right:0.3vw solid rgba(17, 24, 39, 0.9); border-left:none;';
        }
      }
    }
  };

  const drawOverlayHighlight = (el, type) => {
    if (!el || typeof el.getBBox !== 'function' || typeof el.getScreenCTM !== 'function') return;

    // Freeze selection box during animation preview
    if (el.getAttribute('data-is-animating') === 'true') return;

    // Suppress object selection box, hover highlights, and resize handles during Path Node Edit Mode
    if (nodeEditModeRef.current) {
      const overlay = getOverlayForElement(el);
      if (overlay) {
        overlay.querySelectorAll(`[id*="${el.id}"]`).forEach(node => {
          if (!node.id || !node.id.includes('node-edit')) node.remove();
        });
      }
      const htmlOverlay = getHtmlOverlayForElement(el);
      if (htmlOverlay) {
        htmlOverlay.querySelectorAll(`[id*="${el.id}"]`).forEach(h => h.remove());
      }
      return;
    }

    const overlay = getOverlayForElement(el);
    if (!overlay) return;

    // Purge stale or competing overlays for this element to prevent duplicate selection boxes
    if (type.includes('selected')) {
      overlay.querySelectorAll(`[id*="${el.id}"]`).forEach(node => {
        if (!node.id.includes(type)) {
          node.remove();
        }
      });
    }

    if (type === 'hover' || type === 'child-hover') {
      if (document.querySelector('[data-dragging="true"]')) return;
      if (isAltPressedRef.current && selectedLayerIdRef.current) {
        const selectedEl = document.getElementById(selectedLayerIdRef.current);
        if (selectedEl) {
          const isSelectedBackgroundOrFrame = selectedEl.getAttribute('data-name') === 'Overlay' ||
            selectedEl.getAttribute('data-type') === 'background' ||
            selectedEl.getAttribute('data-type') === 'frame';
          if (!isSelectedBackgroundOrFrame) return; // Suppress blue hover outline during Alt comparison
        }
      }
    }

    if (type === 'entered') {
      const isRealFrame = el.getAttribute('data-type') === 'frame';
      const isParentGroup = el.tagName.toLowerCase() === 'g' && el.id !== selectedLayerIdRef.current;
      if ((!isRealFrame && !isParentGroup) || document.querySelector('[data-dragging="true"]')) {
        const existingPoly = overlay.querySelector(`[id="overlay-poly-entered-${el.id}"]`);
        if (existingPoly) existingPoly.remove();
        return;
      }
    }
    // Skip if element is hidden or it's the base "Overlay" (background) / Base Page Frame
    const isOverlay = el.getAttribute('data-name') === 'Overlay' ||
      el.getAttribute('data-type') === 'background' ||
      el.getAttribute('data-type') === 'frame' ||
      el.getAttribute('data-locked') === 'true';


    // Skip if this text element is currently in text-edit mode (we still want to draw the polygon, but skip handles later)
    const isBeingEdited = isEditingTextRef.current && el.id === selectedLayerIdRef.current;

    if (el.style.visibility === 'hidden' || el.style.opacity === '0' || isOverlay) {
      const existingPoly = overlay.querySelector(`[id="overlay-poly-${type}-${el.id}"]`);
      if (existingPoly) existingPoly.remove();
      const htmlOverlay = getHtmlOverlayForElement(el);
      if (htmlOverlay) {
        const existingHandles = htmlOverlay.querySelectorAll(`[id^="resize-handle-${el.id}-"]`);
        existingHandles.forEach(h => h.remove());
      }
      return;
    }

    try {
      let bbox = getVisualBBox(el);
      const ctm = el.getScreenCTM();
      const overlayCtm = overlay.getScreenCTM();
      if (!ctm || !overlayCtm) return;

      const isFrame = el.getAttribute('data-type') === 'frame';
      const isFreeFrame = el.getAttribute('data-name') === 'Free Frame';
      if (activeTopToolRef.current === 'animation' && isFreeFrame) return;
      const tagLower = el.tagName.toLowerCase();
      const isLine = tagLower === 'line';
      const isCropModeEl = isElementCropped(el);
      const isHover = type === 'hover' || type === 'child-hover';
      const isSelected = type === 'selected' || type === 'child-selected' || type === 'multi-child-selected';

      // ── PIXEL-PERFECT PATH for non-frame, non-line elements ──
      // Use getBoundingClientRect() to get actual screen-space visual bounds, then
      // map 4 corners directly to overlay coordinates via a single matrix inverse.
      // getBoundingClientRect() also works correctly for cropped elements since the browser
      // already clips the visual bounds via clipPath — so we no longer exclude isCropModeEl.
      if (!isFrame && !isLine) {
        let localBBox = getVisualBBox(el);
        const isHotspot = el.getAttribute('data-is-hotspot') === 'true';
        const isInteractiveButton = (isHotspot || el.getAttribute('data-type') === 'button') && el.querySelector('rect') !== null && (el.querySelector('text') !== null || el.querySelector('[data-type="text"]') !== null);
        if (isInteractiveButton) {
          const rectChild = el.querySelector('rect');
          if (rectChild) {
            const w = parseFloat(rectChild.getAttribute('width')) || 0;
            const h = parseFloat(rectChild.getAttribute('height')) || 0;
            const x = parseFloat(rectChild.getAttribute('x') || '0');
            const y = parseFloat(rectChild.getAttribute('y') || '0');
            if (w > 0 && h > 0) {
              localBBox = { x, y, width: w, height: h };
            }
          }
          if (!localBBox || localBBox.width <= 0 || localBBox.height <= 0) {
            localBBox = { x: 0, y: 0, width: 80, height: 32 };
          }
        } else if (isHotspot && !isInteractiveButton) {
          const imgChild = el.querySelector('image, svg, rect');
          if (imgChild) {
            const w = parseFloat(imgChild.getAttribute('width') || imgChild.viewBox?.baseVal?.width) || 0;
            const h = parseFloat(imgChild.getAttribute('height') || imgChild.viewBox?.baseVal?.height) || 0;
            const x = parseFloat(imgChild.getAttribute('x') || '0');
            const y = parseFloat(imgChild.getAttribute('y') || '0');
            if (w > 0 && h > 0) {
              localBBox = { x, y, width: w, height: h };
            }
          }
          if (!localBBox || localBBox.width <= 0 || localBBox.height <= 0) {
            localBBox = { x: 0, y: 0, width: 48, height: 48 };
          }
        }
        const elScreenCtm = el.getScreenCTM();

        if (localBBox && localBBox.width > 0 && localBBox.height > 0 && elScreenCtm) {
          el.dataset.overlayRetries = '0';
          const zoomScale = zoom / 100;
          const isBeingEditedCheck = isEditingTextRef.current && el.id === selectedLayerIdRef.current;
          const isVectorPath = el.getAttribute('data-type') === 'vector-path' || el.getAttribute('data-is-vector') === 'true';

          const localToOverlay = overlayCtm.inverse().multiply(elScreenCtm);
          const pt1 = overlay.createSVGPoint(); pt1.x = localBBox.x; pt1.y = localBBox.y;
          const pt2 = overlay.createSVGPoint(); pt2.x = localBBox.x + localBBox.width; pt2.y = localBBox.y;
          const pt3 = overlay.createSVGPoint(); pt3.x = localBBox.x + localBBox.width; pt3.y = localBBox.y + localBBox.height;
          const pt4 = overlay.createSVGPoint(); pt4.x = localBBox.x; pt4.y = localBBox.y + localBBox.height;

          const mapped = [pt1, pt2, pt3, pt4].map(p => p.matrixTransform(localToOverlay));
          const pointsStr = mapped.map(p => `${p.x},${p.y}`).join(' ');

          // ── Exact Path Shape Overlay for Vector Paths (No Rectangular Box / Gap) ──
          let pathOverlayId = `overlay-path-${type}-${el.id}`;
          let pathOverlay = overlay.querySelector(`[id="${pathOverlayId}"]`);

          if (isVectorPath) {
            const d = el.getAttribute('d');
            if (d && isHover) {
              if (!pathOverlay) {
                pathOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathOverlay.id = pathOverlayId;
                pathOverlay.setAttribute('class', `overlay-type-${type}`);
                pathOverlay.setAttribute('pointer-events', 'none');
                overlay.appendChild(pathOverlay);
              }

              if (elScreenCtm) {
                pathOverlay.setAttribute('transform', `matrix(${localToOverlay.a} ${localToOverlay.b} ${localToOverlay.c} ${localToOverlay.d} ${localToOverlay.e} ${localToOverlay.f})`);
              }
              pathOverlay.setAttribute('d', d);

              const vectorColor = '#6366F1'; // Hover highlight color
              pathOverlay.setAttribute('stroke', vectorColor);
              pathOverlay.setAttribute('stroke-width', String(1.5 / zoomScale));
              pathOverlay.setAttribute('vector-effect', 'non-scaling-stroke');
              pathOverlay.setAttribute('stroke-linecap', el.getAttribute('stroke-linecap') || 'round');
              pathOverlay.setAttribute('stroke-linejoin', el.getAttribute('stroke-linejoin') || 'round');
              pathOverlay.setAttribute('fill', 'none');
              pathOverlay.removeAttribute('stroke-dasharray');
            } else if (pathOverlay) {
              pathOverlay.remove();
            }

            let polyId = `overlay-poly-${type}-${el.id}`;
            let polygon = overlay.querySelector(`[id="${polyId}"]`);

            if (isHover) {
              // Remove rectangular box polygon on hover so no gap box is shown
              if (polygon) polygon.remove();
            } else {
              // Draw selection box around selected vector path along with corner handles
              if (!polygon) {
                polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.id = polyId;
                polygon.setAttribute('class', `overlay-type-${type}`);
                polygon.setAttribute('fill', 'none');
                polygon.setAttribute('pointer-events', 'none');
                overlay.appendChild(polygon);
              }
              polygon.setAttribute('points', pointsStr);
              polygon.setAttribute('stroke', '#6366F1');
              polygon.setAttribute('stroke-width', String(1.2 / zoomScale));
              if (type === 'multi-child-selected') {
                polygon.setAttribute('stroke-dasharray', `${4 / zoomScale},${4 / zoomScale}`);
              } else {
                polygon.removeAttribute('stroke-dasharray');
              }
            }
          } else {
            if (pathOverlay) pathOverlay.remove();

            let polyId = `overlay-poly-${type}-${el.id}`;
            let polygon = overlay.querySelector(`[id="${polyId}"]`);
            if (!polygon) {
              polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
              polygon.id = polyId;
              polygon.setAttribute('class', `overlay-type-${type}`);
              polygon.setAttribute('pointer-events', 'none');
              overlay.appendChild(polygon);
            }
            if (el.getAttribute('data-name') === 'Free Frame') {
              polygon.setAttribute('stroke', isHover ? 'transparent' : '#000000');
              polygon.setAttribute('fill', 'none');
            } else if ((activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') && isSelected) {
              polygon.setAttribute('stroke', '#000000');
              polygon.setAttribute('fill', 'none');
            } else if (isHover) {
              polygon.setAttribute('stroke', '#6366F1');
              polygon.setAttribute('fill', 'none');
            } else if (isSelected || type === 'entered') {
              polygon.setAttribute('stroke', '#6366F1');
              polygon.setAttribute('fill', 'none');
            }
            polygon.setAttribute('points', pointsStr);

            if (el.getAttribute('data-name') === 'Free Frame') {
              polygon.setAttribute('stroke-width', String(1 / zoomScale));
              polygon.setAttribute('stroke-dasharray', `${4 / zoomScale},${4 / zoomScale}`);
            } else if ((activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') && isSelected) {
              polygon.setAttribute('stroke-width', String(1 / zoomScale));
              polygon.setAttribute('stroke-dasharray', `${4 / zoomScale},${4 / zoomScale}`);
            } else if (isHover) {
              polygon.setAttribute('stroke-width', String(1 / zoomScale));
              if (type === 'child-hover') polygon.setAttribute('stroke-dasharray', `${2 / zoomScale},${2 / zoomScale}`);
              else polygon.removeAttribute('stroke-dasharray');
            } else if (type === 'selected' || type === 'child-selected') {
              polygon.setAttribute('stroke-width', String((type === 'selected' ? 1.5 : 1.2) / zoomScale));
              polygon.removeAttribute('stroke-dasharray');
            } else if (type === 'multi-child-selected') {
              polygon.setAttribute('stroke-width', String(1.2 / zoomScale));
              polygon.setAttribute('stroke-dasharray', `${4 / zoomScale},${4 / zoomScale}`);
            } else if (type === 'entered') {
              polygon.setAttribute('stroke-width', String(1 / zoomScale));
              polygon.setAttribute('stroke-dasharray', `${4 / zoomScale},${4 / zoomScale}`);
            }
          }

          // Draw resize handles for selected groups
          const isMultiSelectionBox = el.id === 'multi' || el.id === 'multi-selection-bounds';
          const selectionCount = isMultiSelectionBox ? 1 : (multiSelectedIdsRef.current.size > 0 ? multiSelectedIdsRef.current.size : (selectedLayerIdRef.current ? 1 : 0));
          if (selectionCount === 1 && (type === 'selected' || type === 'child-selected') && !isBeingEditedCheck) {
            const htmlOverlay = getHtmlOverlayForElement(el);
            const isFreeFrame = el.getAttribute('data-name') === 'Free Frame';
            const isInteractiveResizable = isFreeFrame || el.getAttribute('data-is-hotspot') === 'true';
            const hideHandles = (activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') && !isInteractiveResizable;
            if (hideHandles && htmlOverlay) {
              const existingHandles = htmlOverlay.querySelectorAll(`[id^="resize-handle-${el.id}-"]`);
              existingHandles.forEach(h => h.remove());
            }

            if (!hideHandles && htmlOverlay) {
              const useLBrackets = !isLine && (activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation' || isInteractiveResizable);
              const handleSize = useLBrackets ? 14 : 7.5;
              const handleNames = (useLBrackets && !isInteractiveResizable) ? ['nw', 'ne', 'se', 'sw'] : ['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'];
              const midN = { x: (mapped[0].x + mapped[1].x) / 2, y: (mapped[0].y + mapped[1].y) / 2 };
              const midE = { x: (mapped[1].x + mapped[2].x) / 2, y: (mapped[1].y + mapped[2].y) / 2 };
              const midS = { x: (mapped[2].x + mapped[3].x) / 2, y: (mapped[2].y + mapped[3].y) / 2 };
              const midW = { x: (mapped[3].x + mapped[0].x) / 2, y: (mapped[3].y + mapped[0].y) / 2 };
              const allPts = (useLBrackets && !isInteractiveResizable) ? [...mapped] : [...mapped, midN, midE, midS, midW];
              const matrix = getElementMatrix(el);
              const rotation = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));

              allPts.forEach((p, i) => {
                const name = handleNames[i];
                const isSide = ['n', 'e', 's', 'w'].includes(name);
                const handleId = `resize-handle-${el.id}-${name}`;
                let handle = htmlOverlay.querySelector(`[id="${handleId}"]`);
                if (!handle) {
                  handle = document.createElement('div');
                  handle.id = handleId;
                  htmlOverlay.appendChild(handle);
                }

                handle.className = `resize-handle overlay-type-${type} absolute`;
                const barThickness = isInteractiveResizable ? 3.5 : 3;

                if (useLBrackets && !isSide) {
                  handle.style.backgroundColor = 'transparent';
                  handle.style.border = 'none';
                  handle.style.boxShadow = 'none';
                  if ((activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') && !isInteractiveResizable) {
                    handle.style.pointerEvents = 'none';
                  } else {
                    handle.style.pointerEvents = 'auto';
                  }

                  let hBar = handle.querySelector('.hbar');
                  let vBar = handle.querySelector('.vbar');
                  if (!hBar || !vBar) {
                    handle.innerHTML = '';
                    hBar = document.createElement('div');
                    vBar = document.createElement('div');
                    hBar.className = 'hbar';
                    vBar.className = 'vbar';
                    [hBar, vBar].forEach(bar => {
                      bar.style.position = 'absolute';
                      bar.style.backgroundColor = '#000000';
                      bar.style.border = 'none';
                      bar.style.boxSizing = 'border-box';
                      bar.style.pointerEvents = 'none';
                    });
                    handle.appendChild(hBar);
                    handle.appendChild(vBar);
                  }

                  hBar.style.width = '100%';
                  hBar.style.height = `${barThickness}px`;
                  vBar.style.width = `${barThickness}px`;
                  vBar.style.height = '100%';

                  if (name === 'nw') { hBar.style.top = '0'; hBar.style.left = '0'; vBar.style.top = '0'; vBar.style.left = '0'; }
                  if (name === 'ne') { hBar.style.top = '0'; hBar.style.right = '0'; vBar.style.top = '0'; vBar.style.right = '0'; }
                  if (name === 'se') { hBar.style.bottom = '0'; hBar.style.right = '0'; vBar.style.bottom = '0'; vBar.style.right = '0'; }
                  if (name === 'sw') { hBar.style.bottom = '0'; hBar.style.left = '0'; vBar.style.bottom = '0'; vBar.style.left = '0'; }
                } else if (isSide) {
                  handle.innerHTML = '';
                  handle.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
                  handle.style.border = 'none';
                  handle.style.boxShadow = 'none';
                  handle.style.pointerEvents = 'auto';
                } else {
                  handle.innerHTML = '';
                  handle.style.backgroundColor = '#FFFFFF';
                  handle.style.border = '1.5px solid #6366F1';
                  handle.style.boxShadow = '0 1.5px 4px rgba(0,0,0,0.2)';
                  handle.style.borderRadius = '0px';
                  handle.style.pointerEvents = 'auto';
                }

                handle.style.boxSizing = 'border-box';
                handle.style.zIndex = isSide ? '999' : '1000';

                if (isSide) {
                  const isHorizontal = (name === 'n' || name === 's');
                  const dist = isHorizontal
                    ? Math.hypot(mapped[1].x - mapped[0].x, mapped[1].y - mapped[0].y)
                    : Math.hypot(mapped[2].x - mapped[1].x, mapped[2].y - mapped[1].y);
                  const thickness = 8 / zoomScale;
                  handle.style.width = isHorizontal ? `${dist}px` : `${thickness}px`;
                  handle.style.height = isHorizontal ? `${thickness}px` : `${dist}px`;
                  handle.style.left = `${p.x}px`;
                  handle.style.top = `${p.y}px`;
                  handle.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
                } else {
                  handle.style.width = `${handleSize}px`;
                  handle.style.height = `${handleSize}px`;

                  let posX = p.x;
                  let posY = p.y;
                  if (useLBrackets) {
                    const inwardOffset = ((handleSize - barThickness) / 2) / zoomScale;
                    if (name === 'nw') { posX += inwardOffset; posY += inwardOffset; }
                    if (name === 'ne') { posX -= inwardOffset; posY += inwardOffset; }
                    if (name === 'se') { posX -= inwardOffset; posY -= inwardOffset; }
                    if (name === 'sw') { posX += inwardOffset; posY -= inwardOffset; }
                  }

                  handle.style.left = `${posX}px`;
                  handle.style.top = `${posY}px`;
                  handle.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${1 / zoomScale})`;
                }
                handle.style.cursor = getRotatingCursor(name, rotation);
              });
            }

            if (activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') {
              drawInteractionBadge(el, mapped, htmlOverlay, zoomScale, bbox);
            }
          }
          return; // ← Early return: group handled via pixel-perfect path
        }
      }

      // Fallback for elements where getBBox() returns 0 or suspiciously small dimensions (e.g. foreignObjects, nested SVGs, percentages)
      // ALSO fallback for frames, because getBBox() ignores percentage-sized children (like width="100%" backgrounds in popup templates)
      if (isFrame || ((bbox.width < 5 || bbox.height < 5) && el.tagName.toLowerCase() !== 'line')) {
        const clientRect = el.getBoundingClientRect();
        // Only apply if the screen size is actually significantly larger than the getBBox size or if it's a frame
        // (to prevent inflating bounding boxes of legitimately small elements)
        const scale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) || 1;
        if (isFrame || clientRect.width / scale > 10 || clientRect.height / scale > 10 || el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'foreignobject') {
          if (clientRect.width > 0 && clientRect.height > 0) {
            el.dataset.overlayRetries = '0'; // reset retries on success
            const elInverse = ctm.inverse();
            const pt = overlay.createSVGPoint();

            pt.x = clientRect.left; pt.y = clientRect.top;
            const localTL = pt.matrixTransform(elInverse);

            pt.x = clientRect.right; pt.y = clientRect.bottom;
            const localBR = pt.matrixTransform(elInverse);

            bbox = {
              x: Math.min(localTL.x, localBR.x),
              y: Math.min(localTL.y, localBR.y),
              width: Math.abs(localBR.x - localTL.x),
              height: Math.abs(localBR.y - localTL.y)
            };
          }
        }
      }

      if (bbox.width === 0 && bbox.height === 0) {
        // Element hasn't painted yet or is completely empty. Retry up to 5 times.
        const retries = parseInt(el.dataset.overlayRetries || '0');
        if (retries < 5) {
          el.dataset.overlayRetries = String(retries + 1);
          setTimeout(() => {
            // Ensure we query the DOM again in case the element was re-rendered by React
            const freshEl = document.getElementById(el.id);
            if (freshEl) drawOverlayHighlight(freshEl, type);
          }, 50);
        }
        return;
      }
      el.dataset.overlayRetries = '0'; // reset retries on success

      const svgMatrix = overlayCtm.inverse().multiply(ctm);

      const isMediaOrText = el.tagName.toLowerCase() === 'image' ||
        el.tagName.toLowerCase() === 'video' ||
        el.tagName.toLowerCase() === 'img' ||
        el.tagName.toLowerCase() === 'text' ||
        el.tagName.toLowerCase() === 'foreignobject';

      const scale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) || 1;
      const screenOffset = 0; // Use zero offset for tightest fitting selection
      const localOffset = screenOffset / scale;

      let pts;
      if (isLine) {
        const x1 = parseFloat(el.getAttribute('x1')) || 0;
        const y1 = parseFloat(el.getAttribute('y1')) || 0;
        const x2 = parseFloat(el.getAttribute('x2')) || 0;
        const y2 = parseFloat(el.getAttribute('y2')) || 0;
        const pt1 = overlay.createSVGPoint(); pt1.x = x1; pt1.y = y1;
        const pt2 = overlay.createSVGPoint(); pt2.x = x2; pt2.y = y2;
        pts = [pt1, pt2];
      } else {
        const pt1 = overlay.createSVGPoint(); pt1.x = bbox.x - localOffset; pt1.y = bbox.y - localOffset;
        const pt2 = overlay.createSVGPoint(); pt2.x = bbox.x + bbox.width + localOffset; pt2.y = bbox.y - localOffset;
        const pt3 = overlay.createSVGPoint(); pt3.x = bbox.x + bbox.width + localOffset; pt3.y = bbox.y + bbox.height + localOffset;
        const pt4 = overlay.createSVGPoint(); pt4.x = bbox.x - localOffset; pt4.y = bbox.y + bbox.height + localOffset;
        pts = [pt1, pt2, pt3, pt4];
      }

      const mapped = pts.map(p => p.matrixTransform(svgMatrix));
      const pointsStr = mapped.map(p => `${p.x},${p.y}`).join(' ');

      if (isVectorPath) {
        let polyId = `overlay-poly-${type}-${el.id}`;
        let polygon = overlay.querySelector(`[id="${polyId}"]`);
        if (polygon) polygon.remove();
      } else {
        let polyId = `overlay-poly-${type}-${el.id}`;
        let polygon = overlay.querySelector(`[id="${polyId}"]`);
        if (!polygon) {
          polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          polygon.id = polyId;
          polygon.setAttribute('class', `overlay-type-${type}`);
          polygon.setAttribute('pointer-events', 'none');
          overlay.appendChild(polygon);
        }
        if (isLine) {
          polygon.setAttribute('stroke', 'transparent');
          polygon.setAttribute('fill', 'none');
        } else if (el.getAttribute('data-name') === 'Free Frame') {
          polygon.setAttribute('stroke', isHover ? 'transparent' : '#000000');
          polygon.setAttribute('fill', 'none');
        } else if ((activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') && isSelected) {
          polygon.setAttribute('stroke', '#000000');
          polygon.setAttribute('fill', 'none');
        } else if (isHover) {
          polygon.setAttribute('stroke', '#6366F1');
          if (activeTopToolRef.current === 'interaction' && el.getAttribute('data-interaction') && el.getAttribute('data-interaction') !== 'none') {
            polygon.setAttribute('fill', 'rgba(99, 102, 241, 0.3)');
          } else {
            polygon.setAttribute('fill', 'none');
          }
        } else if (isSelected) {
          polygon.setAttribute('stroke', '#6366F1');
          polygon.setAttribute('fill', 'none');
        } else if (type === 'entered') {
          polygon.setAttribute('stroke', isMediaOrText ? 'transparent' : '#6366F1');
          polygon.setAttribute('fill', 'none');
        }
        polygon.setAttribute('points', pointsStr);

        const zoomScale = zoom / 100;
        if (el.getAttribute('data-name') === 'Free Frame') {
          polygon.setAttribute('stroke-width', String(1 / zoomScale));
          polygon.setAttribute('stroke-dasharray', `${4 / zoomScale},${4 / zoomScale}`);
        } else if ((activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') && isSelected) {
          polygon.setAttribute('stroke-width', String(1 / zoomScale));
          polygon.setAttribute('stroke-dasharray', `${4 / zoomScale},${4 / zoomScale}`);
        } else if (isHover) {
          polygon.setAttribute('stroke-width', String(1 / zoomScale));
          if (type === 'child-hover') polygon.setAttribute('stroke-dasharray', `${2 / zoomScale},${2 / zoomScale}`);
          else polygon.removeAttribute('stroke-dasharray');
        } else if (type === 'selected' || type === 'child-selected') {
          polygon.setAttribute('stroke-width', String((type === 'selected' ? 1.5 : 1.2) / zoomScale));
          polygon.removeAttribute('stroke-dasharray');
        } else if (type === 'multi-child-selected') {
          polygon.setAttribute('stroke-width', String(1.2 / zoomScale));
          polygon.setAttribute('stroke-dasharray', `${4 / zoomScale},${4 / zoomScale}`);
        } else if (type === 'entered') {
          polygon.setAttribute('stroke-width', String(1 / zoomScale));
          polygon.setAttribute('stroke-dasharray', `${4 / zoomScale},${4 / zoomScale}`);
        }
      }

      // ── RESIZE HANDLES (8 handles) ──
      // Only show handles if exactly ONE element is selected, or if this is the multi-selection bounding box itself
      const isMultiSelectionBox = el.id === 'multi' || el.id === 'multi-selection-bounds';
      const selectionCount = isMultiSelectionBox ? 1 : (multiSelectedIdsRef.current.size > 0 ? multiSelectedIdsRef.current.size : (selectedLayerIdRef.current ? 1 : 0));
      if (selectionCount === 1 && (type === 'selected' || type === 'child-selected') && !isBeingEdited) {
        const htmlOverlay = getHtmlOverlayForElement(el);
        const isFreeFrame = el.getAttribute('data-name') === 'Free Frame';
        const isHotspotEl = el.getAttribute('data-is-hotspot') === 'true';
        const isInteractiveResizableEl = isFreeFrame || isHotspotEl;
        const hideHandles = (activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') && !isInteractiveResizableEl;

        if (hideHandles) {
          if (htmlOverlay) {
            const existingHandles = htmlOverlay.querySelectorAll(`[id^="resize-handle-${el.id}-"]`);
            existingHandles.forEach(h => h.remove());
          }
        }

        if (!hideHandles) {
          const useLBrackets = !isLine && (activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation' || isInteractiveResizableEl);
          const handleSize = useLBrackets ? 14 : 7.5;

          let handleNames, allPts;

          if (isLine) {
            handleNames = ['linestart', 'lineend'];
            allPts = [...mapped];
          } else {
            handleNames = (useLBrackets && !isInteractiveResizableEl) ? ['nw', 'ne', 'se', 'sw'] : ['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'];

            // Define all points in world space
            const worldPts = [...mapped]; // Corners
            const midN = { x: (mapped[0].x + mapped[1].x) / 2, y: (mapped[0].y + mapped[1].y) / 2 };
            const midE = { x: (mapped[1].x + mapped[2].x) / 2, y: (mapped[1].y + mapped[2].y) / 2 };
            const midS = { x: (mapped[2].x + mapped[3].x) / 2, y: (mapped[2].y + mapped[3].y) / 2 };
            const midW = { x: (mapped[3].x + mapped[0].x) / 2, y: (mapped[3].y + mapped[0].y) / 2 };

            allPts = (useLBrackets && !isInteractiveResizableEl) ? [...worldPts] : [...worldPts, midN, midE, midS, midW];
          }

          // Detect current rotation for cursor mapping
          const matrix = getElementMatrix(el);
          const rotation = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));

          allPts.forEach((p, i) => {
            const name = handleNames[i];
            const isSide = ['n', 'e', 's', 'w'].includes(name);
            const handleId = `resize-handle-${el.id}-${name}`;
            let handle = htmlOverlay?.querySelector(`[id="${handleId}"]`);

            if (!handle && htmlOverlay) {
              handle = document.createElement('div');
              handle.id = handleId;
              htmlOverlay.appendChild(handle);
            }

            handle.className = `resize-handle overlay-type-${type} absolute`;
            const barThickness = isInteractiveResizableEl ? 3.5 : 3;

            if (useLBrackets && !isSide) {
              handle.style.backgroundColor = 'transparent';
              handle.style.border = 'none';
              handle.style.boxShadow = 'none';
              if ((activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') && !isInteractiveResizableEl) {
                handle.style.pointerEvents = 'none';
              } else {
                handle.style.pointerEvents = 'auto';
              }

              let hBar = handle.querySelector('.hbar');
              let vBar = handle.querySelector('.vbar');
              if (!hBar || !vBar) {
                handle.innerHTML = '';
                hBar = document.createElement('div');
                vBar = document.createElement('div');
                hBar.className = 'hbar';
                vBar.className = 'vbar';
                [hBar, vBar].forEach(bar => {
                  bar.style.position = 'absolute';
                  bar.style.backgroundColor = '#000000';
                  bar.style.border = 'none';
                  bar.style.boxSizing = 'border-box';
                  bar.style.pointerEvents = 'none';
                });
                handle.appendChild(hBar);
                handle.appendChild(vBar);
              }

              hBar.style.width = '100%';
              hBar.style.height = `${barThickness}px`;
              vBar.style.width = `${barThickness}px`;
              vBar.style.height = '100%';

              if (name === 'nw') { hBar.style.top = '0'; hBar.style.left = '0'; vBar.style.top = '0'; vBar.style.left = '0'; }
              if (name === 'ne') { hBar.style.top = '0'; hBar.style.right = '0'; vBar.style.top = '0'; vBar.style.right = '0'; }
              if (name === 'se') { hBar.style.bottom = '0'; hBar.style.right = '0'; vBar.style.bottom = '0'; vBar.style.right = '0'; }
              if (name === 'sw') { hBar.style.bottom = '0'; hBar.style.left = '0'; vBar.style.bottom = '0'; vBar.style.left = '0'; }
            } else if (isSide) {
              handle.innerHTML = '';
              handle.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
              handle.style.border = 'none';
              handle.style.boxShadow = 'none';
              handle.style.pointerEvents = 'auto';
            } else {
              handle.innerHTML = '';
              handle.style.backgroundColor = '#FFFFFF';
              handle.style.border = '1.5px solid #6366F1';
              handle.style.boxShadow = '0 1.5px 4px rgba(0,0,0,0.2)';
              handle.style.borderRadius = isLine ? '50%' : '0px';
              handle.style.pointerEvents = 'auto';
            }

            handle.style.boxSizing = 'border-box';
            handle.style.zIndex = isLine ? '2147483647' : (isSide ? '999' : '1000');

            if (isSide) {
              const zoomScale = zoom / 100;
              const isHorizontal = (name === 'n' || name === 's');
              const dist = isHorizontal
                ? Math.hypot(mapped[1].x - mapped[0].x, mapped[1].y - mapped[0].y)
                : Math.hypot(mapped[2].x - mapped[1].x, mapped[2].y - mapped[1].y);
              const length = dist;
              const thickness = 8 / zoomScale;

              handle.style.width = isHorizontal ? `${length}px` : `${thickness}px`;
              handle.style.height = isHorizontal ? `${thickness}px` : `${length}px`;
              handle.style.left = `${p.x}px`;
              handle.style.top = `${p.y}px`;
              handle.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
            } else {
              const zoomScale = zoom / 100;
              handle.style.width = `${handleSize}px`;
              handle.style.height = `${handleSize}px`;

              let posX = p.x;
              let posY = p.y;
              if (useLBrackets) {
                const inwardOffset = ((handleSize - barThickness) / 2) / zoomScale;
                if (name === 'nw') { posX += inwardOffset; posY += inwardOffset; }
                if (name === 'ne') { posX -= inwardOffset; posY += inwardOffset; }
                if (name === 'se') { posX -= inwardOffset; posY -= inwardOffset; }
                if (name === 'sw') { posX += inwardOffset; posY -= inwardOffset; }
              }

              handle.style.left = `${posX}px`;
              handle.style.top = `${posY}px`;
              handle.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${1 / zoomScale})`;
            }
            handle.style.cursor = getRotatingCursor(name, rotation);
          });
        } // Close if (!hideHandles)

        // ── VIDEO CONTROLS / MOVE TOGGLE BADGE ──
        const isVideoEl = el.getAttribute('data-type') === 'video' || !!el.querySelector('video, iframe');
        if (isVideoEl && (type === 'selected' || type === 'child-selected') && htmlOverlay) {
          const isInteractive = el.getAttribute('data-video-interactive') === 'true';
          const toggleId = `video-mode-toggle-${el.id}`;
          let toggleBtn = htmlOverlay.querySelector(`[id="${toggleId}"]`);
          if (!toggleBtn) {
            toggleBtn = document.createElement('div');
            toggleBtn.id = toggleId;
            htmlOverlay.appendChild(toggleBtn);
          }

          toggleBtn.className = `video-mode-toggle absolute flex items-center gap-1.5 px-3 py-1 rounded-full text-white shadow-lg text-xs font-semibold cursor-pointer select-none transition-all pointer-events-auto ${
            isInteractive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
          }`;
          toggleBtn.style.zIndex = '2147483647';
          toggleBtn.style.left = `${mapped[1].x}px`;
          toggleBtn.style.top = `${mapped[1].y - (28 / zoomScale)}px`;
          toggleBtn.style.transform = `translate(-100%, 0) scale(${1 / zoomScale})`;
          toggleBtn.style.transformOrigin = 'bottom right';

          if (isInteractive) {
            toggleBtn.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Controls Active (Click to Move/Scale)</span>
            `;
          } else {
            toggleBtn.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="5 9 2 12 5 15"></polyline>
                <polyline points="9 5 12 2 15 5"></polyline>
                <polyline points="15 19 12 22 9 19"></polyline>
                <polyline points="19 9 22 12 19 15"></polyline>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="12" y1="2" x2="22" y2="22"></line>
              </svg>
              <span>Move / Scale Mode (Click to Play Video)</span>
            `;
          }

          const handleToggleAction = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const newInteractive = el.getAttribute('data-video-interactive') !== 'true';
            el.setAttribute('data-video-interactive', newInteractive ? 'true' : 'false');

            const iframe = el.querySelector('iframe');
            if (iframe) {
              iframe.style.setProperty('pointer-events', newInteractive ? 'auto' : 'none', 'important');
            }
            const video = el.querySelector('video');
            if (video) {
              video.style.setProperty('pointer-events', newInteractive ? 'auto' : 'none', 'important');
            }
            drawOverlayHighlight(el, 'selected');
          };

          toggleBtn.onpointerdown = handleToggleAction;
          toggleBtn.onmousedown = handleToggleAction;
          toggleBtn.onclick = handleToggleAction;
        }

        // ── INTERACTION BADGE (Floating above the top-middle) ──
        if (activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') {
          drawInteractionBadge(el, mapped, htmlOverlay, zoomScale, bbox);
        }
      }
    } catch (e) { }
  };

  // ── Synchronize rotation with DOM selection ──────────────────────────────────
  useEffect(() => {
    const selId = selectedLayerId;
    if (selId) {
      const el = document.getElementById(selId);
      if (el) {
        const matrix = getElementMatrix(el);
        const angle = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
        setRotation(angle < 0 ? angle + 360 : angle);
      }
    } else {
      setRotation(0);
    }
  }, [selectedLayerId, multiSelectedIds]);

  const handleRotate = (newAngle) => {
    const ids = multiSelectedIds.size > 0 ? Array.from(multiSelectedIds) : (selectedLayerId ? [selectedLayerId] : []);
    if (ids.length === 0) return;

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      const matrix = getElementMatrix(el);
      let bbox = getVisualBBox(el);
      if (!bbox || (bbox.width === 0 && bbox.height === 0)) {
        try { bbox = el.getBBox(); } catch (e) { }
      }

      // Calculate local center
      const localCx = bbox.x + bbox.width / 2;
      const localCy = bbox.y + bbox.height / 2;

      // Transform local center by current matrix to get world center
      const worldCenter = new DOMPoint(localCx, localCy).matrixTransform(matrix);

      const currentAngle = (Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
      const diff = newAngle - currentAngle;

      // Create rotation around world center
      const rotateMatrix = new DOMMatrix()
        .translate(worldCenter.x, worldCenter.y)
        .rotate(diff)
        .translate(-worldCenter.x, -worldCenter.y);

      const nextMatrix = rotateMatrix.multiply(matrix);
      el.setAttribute('transform', matrixToTransform(nextMatrix));

      // Force-sync the highlight overlay immediately while dragging
      const highlightType = (currentFrameId && el.id !== currentFrameId) ? 'child-selected' : 'selected';
      drawOverlayHighlight(el, highlightType);
    });

    setRotation(newAngle);
    if (updatePageHtml) {
      // Find the SVG containing the selection
      const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      const svg = activeContainer?.querySelector('svg');
      if (svg) updatePageHtml(activePageIndex, svg.outerHTML);
    }
  };

  const handleFlip = (direction) => {
    const ids = multiSelectedIds.size > 0 ? Array.from(multiSelectedIds) : (selectedLayerId ? [selectedLayerId] : []);
    if (ids.length === 0) return;

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      const matrix = getElementMatrix(el);
      let bbox = getVisualBBox(el);
      if (!bbox || (bbox.width === 0 && bbox.height === 0)) {
        try { bbox = el.getBBox(); } catch (e) { }
      }

      // Calculate local center
      const localCx = bbox.x + bbox.width / 2;
      const localCy = bbox.y + bbox.height / 2;

      // Transform local center by current matrix to get world center
      const worldCenter = new DOMPoint(localCx, localCy).matrixTransform(matrix);

      const scaleX = direction === 'h' ? -1 : 1;
      const scaleY = direction === 'v' ? -1 : 1;

      // Create flip matrix centered at the current world position
      const flipMatrix = new DOMMatrix()
        .translate(worldCenter.x, worldCenter.y)
        .scale(scaleX, scaleY)
        .translate(-worldCenter.x, -worldCenter.y);

      const nextMatrix = flipMatrix.multiply(matrix);
      el.setAttribute('transform', matrixToTransform(nextMatrix));

      // Force-sync the highlight overlay immediately after flip
      const highlightType = (currentFrameId && el.id !== currentFrameId) ? 'child-selected' : 'selected';
      drawOverlayHighlight(el, highlightType);
    });

    if (updatePageHtml) {
      const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      const svg = activeContainer?.querySelector('svg');
      if (svg) updatePageHtml(activePageIndex, svg.outerHTML);
    }
  };

  // ── Interaction Contexts ──
  const handleSvgContextMenu = (pageIndex, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeTopTool === 'interaction' || activeTopTool === 'animation' || isConvertedFlipbook) {
      return;
    }

    const container = e.currentTarget.closest('.page-svg-container');
    const svg = container?.querySelector('svg');
    if (!svg) return;

    // Allow right click on overlay, but block pure svg background clicks if any
    if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'svg') {
      return;
    }

    const frameId = currentFrameIdRef.current;
    const selId = selectedLayerIdRef.current;
    let layerId = null;

    // 1. Identify which layer was right-clicked using drill-down priority
    if (frameId) {
      // ── Inside an entered frame: prioritized children mapping ──
      const frameEl = svg.querySelector(`[id="${frameId}"]`);
      if (frameEl && hitTest(frameEl, e.clientX, e.clientY)) {
        const children = getDirectChildFrames(frameEl);
        for (let i = children.length - 1; i >= 0; i--) {
          if (hitTest(children[i], e.clientX, e.clientY)) {
            layerId = children[i].id;
            break;
          }
        }
        // If hit frame gap, target the frame itself
        if (!layerId) layerId = frameId;
      }
    } else {
      // ── Top-level: select top-level frames ──
      const topLevelEls = getTopLevelFrames(svg);
      for (let i = topLevelEls.length - 1; i >= 0; i--) {
        if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
          layerId = topLevelEls[i].id;
          break;
        }
      }
    }

    // Fallback to original simple detection if hierarchy drill-down didn't catch it
    if (!layerId) {
      const target = e.target.closest('[id]');
      if (target && target.id && target.id !== 'main-svg-root') {
        layerId = target.id;
      }
    }

    if (!layerId) return;

    const layerEl = svg.querySelector(`[id="${layerId}"]`);
    const isOverlay = layerEl ? layerEl.getAttribute('data-name') === 'Overlay' : false;

    // 2. Select the layer if not already part of multi-selection
    if (!multiSelectedIds.has(layerId)) {
      setSelectedLayerId(layerId);
      setMultiSelectedIds(new Set([layerId]));
    }

    // 3. Dispatch event to trigger the Layer.jsx menu
    window.dispatchEvent(new CustomEvent('show-layer-context-menu', {
      detail: { e, layerId, pageIndex, isOverlay }
    }));
  };

  // ── Sync refs with props ──────────────────────────────────────────────────
  useEffect(() => { activeMainToolRef.current = activeMainTool; }, [activeMainTool]);
  useEffect(() => { selectedSelectToolRef.current = selectedSelectTool; }, [selectedSelectTool]);
  useEffect(() => { selectedPenToolRef.current = selectedPenTool; }, [selectedPenTool]);
  useEffect(() => { selectedLayerIdRef.current = selectedLayerId; }, [selectedLayerId]);
  useEffect(() => { multiSelectedIdsRef.current = multiSelectedIds; }, [multiSelectedIds]);
  useEffect(() => { updatePageHtmlRef.current = updatePageHtml; }, [updatePageHtml]);
  useEffect(() => { currentFrameIdRef.current = currentFrameId; }, [currentFrameId]);

  useEffect(() => {
    document.querySelectorAll('rect[data-name="Free Frame"][data-selected-frame="true"]').forEach(el => {
      el.removeAttribute('data-selected-frame');
    });
    multiSelectedIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.getAttribute('data-name') === 'Free Frame') {
        el.setAttribute('data-selected-frame', 'true');
      }
    });
  }, [multiSelectedIds]);

  // ── Listen for Figma-style Undo/Redo instant selection rebind ────────────
  useEffect(() => {
    const handleRebindSelection = (e) => {
      const { layerId } = e.detail || {};
      const targetId = layerId || selectedLayerId;
      if (!targetId) return;
      const el = document.getElementById(targetId);
      if (el && typeof drawOverlayHighlight === 'function') {
        drawOverlayHighlight(el, 'selected');
      }
    };
    window.addEventListener('rebind-selection-overlay', handleRebindSelection);
    return () => window.removeEventListener('rebind-selection-overlay', handleRebindSelection);
  }, [selectedLayerId]);

  // ── Automatically restore/redraw selection overlay on page/selection changes ──
  useEffect(() => {
    if (!selectedLayerId && (!multiSelectedIds || multiSelectedIds.size === 0)) return;

    const timer = setTimeout(() => {
      if (selectedLayerId) {
        const el = document.getElementById(selectedLayerId);
        if (el && typeof drawOverlayHighlight === 'function') {
          drawOverlayHighlight(el, 'selected');
        }
      }
      if (multiSelectedIds && multiSelectedIds.size > 1) {
        multiSelectedIds.forEach(id => {
          const el = document.getElementById(id);
          if (el && typeof drawOverlayHighlight === 'function') {
            drawOverlayHighlight(el, 'multi-child-selected');
          }
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pages, selectedLayerId, multiSelectedIds]);

  // ── Listen for interaction badge icon update events ───────────────────────
  useEffect(() => {
    const handleBadgeUpdate = (e) => {
      const { elementId, actionType } = e.detail || {};
      if (!elementId) return;

      const badge = document.getElementById(`interaction-badge-${elementId}`);
      if (!badge) return;

      const mainBox = badge.querySelector('[data-badge-mainbox]');
      if (!mainBox) return;

      if (!actionType) {
        // Revert to default "add interaction" state
        mainBox.innerHTML = `
          <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 7.99791H6.176C4.679 7.99791 3.93 7.99791 3.466 7.55791C3 7.12091 3 6.41391 3 5.00091C3 3.58791 3 2.88091 3.465 2.44291C3.93 2.00391 4.679 2.00391 6.176 2.00391H17.823C19.321 2.00391 20.07 2.00391 20.535 2.44291C21 2.88191 21 3.58691 21 4.99991C21 6.41291 21 7.11991 20.535 7.55891C20.07 7.99791 19.321 7.99791 17.823 7.99791H16.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7.42375 17.5184L6.54475 16.3864L5.42475 14.9414C4.98275 14.3964 4.90275 13.7304 5.18275 13.1414C5.28206 12.9339 5.43587 12.7573 5.62775 12.6304C6.24475 12.2234 7.09575 12.1744 7.62775 12.7114L9.59875 14.3894V6.63744C9.59875 5.77444 10.4187 5.02344 11.3447 5.02344C12.2707 5.02344 13.0967 5.77444 13.0967 6.63744V10.7274C14.6217 10.6054 17.0677 11.1684 18.5117 12.2754C19.7727 13.2404 20.5777 13.7774 19.5257 16.9554C19.1997 17.9384 18.3847 19.2914 18.2527 19.6734C18.1217 20.0534 17.9817 20.2804 18.0317 21.9934M6.54475 16.3864C6.81275 16.7104 7.08375 17.0884 7.42375 17.5184M9.52975 21.9994V21.0534C9.60275 19.8904 8.54675 18.9574 7.42375 17.5184M7.42375 17.5184C7.34275 17.4144 7.49975 17.6154 7.42375 17.5184ZM7.42375 17.5184L8.53075 18.8724" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
        const plusBadge = document.createElement('div');
        plusBadge.setAttribute('data-badge-plus', 'true');
        plusBadge.className = 'absolute -top-1 -right-1 flex items-center justify-center';
        plusBadge.style.width = '0.75vw';
        plusBadge.style.height = '0.75vw';
        plusBadge.innerHTML = `
          <svg width="0.75vw" height="0.75vw" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5Z" fill="white"/>
              <path d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5Z" stroke="#4A3AFF"/>
              <path d="M12.0007 8.66536H8.66732V11.9987C8.66732 12.3654 8.36732 12.6654 8.00065 12.6654C7.63398 12.6654 7.33398 12.3654 7.33398 11.9987V8.66536H4.00065C3.63398 8.66536 3.33398 8.36536 3.33398 7.9987C3.33398 7.63203 3.63398 7.33203 4.00065 7.33203H7.33398V3.9987C7.33398 3.63203 7.63398 3.33203 8.00065 3.33203C8.36732 3.33203 8.66732 3.63203 8.66732 3.9987V7.33203H12.0007C12.3673 7.33203 12.6673 7.63203 12.6673 7.9987C12.6673 8.36536 12.3673 8.66536 12.0007 8.66536Z" fill="#4A3AFF"/>
          </svg>
        `;
        mainBox.appendChild(plusBadge);
        badge.querySelectorAll('[data-badge-tick]').forEach(t => t.remove());
        return;
      }

      // Swap touch icon → selected action icon via Iconify CDN
      const [prefix, iconName] = actionType.icon.split(':');
      const iconUrl = `https://api.iconify.design/${prefix}/${iconName}.svg?color=white&width=16&height=16`;
      mainBox.innerHTML = `<img src="${iconUrl}" alt="${actionType.label}" style="width:1vw;height:1vw;min-width:12px;min-height:12px;display:block;" />`;
      mainBox.style.position = 'relative';
      mainBox.style.overflow = 'visible';

      // Remove old plus badge
      badge.querySelectorAll('[data-badge-plus]').forEach(p => p.remove());

      // Remove old tick if exists (re-create fresh each time so it re-renders correctly)
      badge.querySelectorAll('[data-badge-tick]').forEach(t => t.remove());

      // Create green tick — appended to mainBox, positioned absolutely at top-right corner
      const tick = document.createElement('div');
      tick.setAttribute('data-badge-tick', 'true');
      tick.style.cssText = [
        'position:absolute',
        'top:-6px',
        'right:-6px',
        'width:13px',
        'height:13px',
        'background:#22C55E',
        'border-radius:50%',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'z-index:20',
        'border:1.5px solid #ffffff',
        'box-shadow:0 1px 3px rgba(0,0,0,0.3)',
        'pointer-events:none'
      ].join(';');
      tick.innerHTML = `<svg viewBox="0 0 24 24" fill="none" style="width:7px;height:7px;"><polyline points="20 6 9 17 4 12" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      mainBox.appendChild(tick);
    };
    window.addEventListener('update-interaction-badge', handleBadgeUpdate);
    return () => window.removeEventListener('update-interaction-badge', handleBadgeUpdate);
  }, []);

  // ── Listen for force selection box update ─────────────────────────────
  useEffect(() => {
    const handleForceUpdateSelection = (e) => {
      const { elementId } = e.detail || {};
      if (!elementId) return;
      const el = document.getElementById(elementId);
      if (el) {
        // Use setTimeout to ensure SVG layout has fully recalculated before getting the new bounding box
        setTimeout(() => {
          drawOverlayHighlight(el, 'selected');

          // Also update hover box if it is currently visible
          const overlay = document.getElementById('highlight-overlay') || el.ownerSVGElement?.nextElementSibling;
          if (overlay) {
            const hoverPoly = overlay.querySelector(`[id="overlay-poly-hover-${el.id}"]`);
            if (hoverPoly) {
              drawOverlayHighlight(el, 'hover');
            }
            const childHoverPoly = overlay.querySelector(`[id="overlay-poly-child-hover-${el.id}"]`);
            if (childHoverPoly) {
              drawOverlayHighlight(el, 'child-hover');
            }
          }
        }, 10);
      }
    };
    window.addEventListener('force-update-selection-box', handleForceUpdateSelection);
    return () => window.removeEventListener('force-update-selection-box', handleForceUpdateSelection);
  }, []);

  // ── Listen for add-free-frame to start drawing ─────────────────────────────
  useEffect(() => {
    const handleAddFreeFrame = (e) => {
      // Differentiate from the badge click which passes elementId
      if (e.detail && e.detail.pageIndex !== undefined && !e.detail.elementId) {
        if (setActiveMainTool) setActiveMainTool('shapes');
        setSelectedShapeTool('free-frame');
      }
    };
    window.addEventListener('add-free-frame', handleAddFreeFrame);
    return () => window.removeEventListener('add-free-frame', handleAddFreeFrame);
  }, [setActiveMainTool, setSelectedShapeTool]);

  // Reset selectedShapeTool from 'free-frame' to default when leaving interaction mode
  useEffect(() => {
    if (activeTopTool !== 'interaction' && selectedShapeTool === 'free-frame') {
      setSelectedShapeTool('rectangle');
    }
  }, [activeTopTool, selectedShapeTool]);



  // ── Listen for vector path actions from ShapeProperties (Sharp, Smooth, Join, etc.) ──
  useEffect(() => {
    const handleVectorPathAction = (e) => {
      const { action } = e.detail || {};
      if (!action) return;

      let targetEl = nodeEditPathRef.current || (selectedLayerIdRef.current ? document.getElementById(selectedLayerIdRef.current) : null);
      if (!targetEl) {
        const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
        targetEl = activeContainer?.querySelector('path[data-type="vector-path"]') || activeContainer?.querySelector('path');
      }
      if (!targetEl) return;

      let pathEl = targetEl.tagName?.toLowerCase() === 'path' ? targetEl : targetEl.querySelector('path');
      if (!pathEl || !pathEl.getAttribute('d')) return;

      const pageIdx = nodeEditPageIndexRef.current !== null ? nodeEditPageIndexRef.current : activePageIndex;

      processVectorPathAction(action, {
        pathEl,
        pageIdx,
        paperScope: paperScopeRef.current,
        createPaperPath,
        bakeTransformIntoPaperPath,
        deleteSelectedNodeOrHandle,
        executeVectorPathAction,
        cleanPaperPathData,
        getPaperSegments,
        exitNodeEditMode,
        saveModifiedPageHtml,
        setSelectedLayerId,
        drawNodeEditOverlay,
        enterNodeEditMode,
        updatePageHtml,
        refs: {
          nodeEditPaperPathRef,
          nodeEditSelectedSegIndicesRef,
          nodeEditSelectedSegIdxRef,
          nodeEditSelectedHandleSideRef,
          nodeEditSelectedCurveIdxRef,
          nodeEditSplitSegIdxRef,
          nodeEditModeRef
        }
      });
    };

    window.addEventListener('vector-path-action', handleVectorPathAction);
    return () => window.removeEventListener('vector-path-action', handleVectorPathAction);
  }, [activePageIndex, updatePageHtml]);

  // ── Global mousemove listener for robust Node Edit dragging ──
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (nodeEditDragRef.current) {
        if (nodeEditSplitSegIdxRef.current !== null) {
          nodeEditSplitSegIdxRef.current = null;
        }
        const { mode, segIdx, handleSide, pathEl, paperPath, startPt, startPoints,
          curveIndex, startHandle1, startHandle2, pageIndex,
          seg1Idx, seg2Idx } = nodeEditDragRef.current;
        const svgEl = pathEl?.ownerSVGElement;
        if (!svgEl || !paperPath) return;

        const pt = getLocalPoint(svgEl, pathEl, e.clientX, e.clientY);
        paperScopeRef.current.activate();
        const mousePoint = new paperScopeRef.current.Point(pt.x, pt.y);
        const delta = mousePoint.subtract(new paperScopeRef.current.Point(startPt.x, startPt.y));

        const segments = getPaperSegments(paperPath);
        const curves = getPaperCurves(paperPath);

        let effectiveDelta = delta;

        if (mode === 'node' || mode === 'segment-translate') {
          if (startPoints && Object.keys(startPoints).length > 0) {
            const primaryIdx = segIdx !== undefined ? segIdx : parseInt(Object.keys(startPoints)[0]);
            const primaryStart = startPoints[primaryIdx] || Object.values(startPoints)[0];
            if (primaryStart) {
              const activePt = primaryStart.add(delta);

              const ctm = pathEl.getScreenCTM();
              const scale = ctm ? Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) : 1;
              const SNAP_RADIUS_PX = 6; // screen pixel snap radius
              let bestDist = SNAP_RADIUS_PX;
              let snapTargetPt = null;

              // Search for unselected nodes to magnetic snap/stick to
              segments.forEach((otherSeg, oIdx) => {
                if (!startPoints[oIdx]) {
                  const distPx = Math.hypot(activePt.x - otherSeg.point.x, activePt.y - otherSeg.point.y) * scale;
                  if (distPx < bestDist) {
                    bestDist = distPx;
                    snapTargetPt = otherSeg.point;
                  }
                }
              });

              if (snapTargetPt) {
                // Magnetically snap effectiveDelta so activePt lands EXACTLY on snapTargetPt
                effectiveDelta = snapTargetPt.subtract(primaryStart);
              }
            }

            Object.keys(startPoints).forEach(sIdxStr => {
              const sIdx = parseInt(sIdxStr);
              const seg = segments[sIdx];
              if (seg && startPoints[sIdx]) {
                seg.point = startPoints[sIdx].add(effectiveDelta);
              }
            });
          } else if (mode === 'node') {
            const seg = segments[segIdx];
            if (seg) seg.point = mousePoint;
          }
        } else if (mode === 'handle') {
          const seg = segments[segIdx];
          if (seg) {
            const ctm = pathEl.getScreenCTM();
            const scale = ctm ? Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) : 1;
            const distToCenterPx = Math.hypot(mousePoint.x - seg.point.x, mousePoint.y - seg.point.y) * scale;
            const SNAP_TO_CENTER_PX = 12;

            if (distToCenterPx < SNAP_TO_CENTER_PX) {
              nodeEditRetractHandleRef.current = { segIdx, handleSide, isReadyToDelete: true };
            } else {
              nodeEditRetractHandleRef.current = null;
            }
            applyHandleDrag(seg, handleSide, mousePoint, e.altKey);
          }
        } else if (mode === 'segment-bend') {
          const curve = curves[curveIndex];
          if (curve && startHandle1 && startHandle2) {
            curve.segment1.handleOut = startHandle1.add(delta.multiply(0.5));
            curve.segment2.handleIn = startHandle2.add(delta.multiply(0.5));
          }
        }

        const allSegments = getPaperSegments(paperPath);
        let allCollapsed = false;
        if (allSegments.length > 0) {
          const firstPt = allSegments[0].point;
          allCollapsed = allSegments.every(s => Math.hypot(s.point.x - firstPt.x, s.point.y - firstPt.y) < 2.0);
        }

        const dStr = cleanPaperPathData(paperPath);
        const totalSegments = allSegments.length;

        if (allCollapsed || !dStr || dStr.trim() === '' || totalSegments <= 1) {
          pathEl.setAttribute('d', '');
          const pageIdx = pageIndex !== undefined ? pageIndex : nodeEditPageIndexRef.current;
          const overlay = document.getElementById(`highlight-overlay-${pageIdx}`);
          if (overlay) {
            const nodeGroup = overlay.querySelector('#node-edit-overlay-group');
            if (nodeGroup) nodeGroup.innerHTML = '';
          }
        } else {
          pathEl.setAttribute('d', dStr);
          drawNodeEditOverlay(pathEl, paperPath, pageIndex !== undefined ? pageIndex : nodeEditPageIndexRef.current);
        }
        suppressClickRef.current = true;
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  // ── Global mouseup: end node edit drag and persist path ──
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      if (nodeEditDragRef.current) {
        const { pathEl, paperPath, pageIndex } = nodeEditDragRef.current;
        nodeEditDragRef.current = null;

        if (nodeEditRetractHandleRef.current && nodeEditRetractHandleRef.current.isReadyToDelete) {
          const { segIdx, handleSide } = nodeEditRetractHandleRef.current;
          if (paperPath) {
            const segments = getPaperSegments(paperPath);
            const seg = segments[segIdx];
            if (seg) {
              if (handleSide === 'in') {
                seg.handleIn = new paperScopeRef.current.Point(0, 0);
              } else if (handleSide === 'out') {
                seg.handleOut = new paperScopeRef.current.Point(0, 0);
              }
            }
          }
        }
        nodeEditRetractHandleRef.current = null;

        if (paperPath && pathEl) {
          // Merge & remove duplicate meeting nodes
          mergeMeetingNodes(paperPath);
          const dStr = cleanPaperPathData(paperPath);
          const allSegments = getPaperSegments(paperPath);
          let allCollapsed = false;
          if (allSegments.length > 0) {
            const firstPt = allSegments[0].point;
            allCollapsed = allSegments.every(s => Math.hypot(s.point.x - firstPt.x, s.point.y - firstPt.y) < 2.0);
          }

          // If no lines remain (collapsed to 1 point or 0 lines), remove the entire vector element from DOM and layer list
          if (allCollapsed || !dStr || dStr.trim() === '' || allSegments.length <= 1) {
            const svgEl = pathEl.ownerSVGElement;
            pathEl.remove();
            exitNodeEditMode();
            if (svgEl && updatePageHtml) {
              saveModifiedPageHtml(
                pageIndex !== undefined ? pageIndex : nodeEditPageIndexRef.current,
                svgEl
              );
            }
            if (typeof setSelectedLayerId === 'function') setSelectedLayerId(null);
            return;
          }

          if (pathEl.tagName?.toLowerCase() === 'g') {
            const firstChild = pathEl.querySelector('path');
            if (firstChild) firstChild.setAttribute('d', dStr);
          } else {
            pathEl.setAttribute('d', dStr);
          }
          drawNodeEditOverlay(pathEl, paperPath, pageIndex !== undefined ? pageIndex : nodeEditPageIndexRef.current);
        }

        // Save modified path data to page HTML
        if (pathEl && pathEl.ownerSVGElement && updatePageHtml) {
          saveModifiedPageHtml(
            pageIndex !== undefined ? pageIndex : nodeEditPageIndexRef.current,
            pathEl.ownerSVGElement
          );
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [updatePageHtml]);

  const commitAndExitPenDrawing = useCallback(() => {
    const vSession = vectraPenSessionRef.current;
    if (!vSession) return;

    const hasPaths = vSession.paths && (vSession.paths.size > 0 || vSession.paths.length > 0);
    if (vSession.isDrawing || hasPaths || drawingPathRef.current) {
      vSession.finishPath();
      const pathEl = drawingPathRef.current;
      const pageIdx = drawingPageIndexRef.current !== null ? drawingPageIndexRef.current : activePageIndex;

      if (pathEl) {
        const comboD = pathToDCombo(vSession.paths);
        if (comboD) {
          pathEl.setAttribute('d', comboD);
        } else if (!vSession.paths || vSession.paths.size === 0) {
          if (pathEl.parentNode) pathEl.parentNode.removeChild(pathEl);
        }
      }

      vSession.reset();
      drawingPathRef.current = null;
      exitNodeEditMode();
      clearVectraOverlay(pageIdx);
      document.querySelectorAll('[id^="highlight-overlay-"]').forEach(overlay => {
        const g = overlay.querySelector('#vectra-overlay-group');
        if (g) g.innerHTML = '';
        const nodeGroup = overlay.querySelector('#node-edit-overlay-group');
        if (nodeGroup) nodeGroup.remove();
      });

      if (pathEl && pathEl.ownerSVGElement && updatePageHtml) {
        updatePageHtml(pageIdx, pathEl.ownerSVGElement.outerHTML);
        if (pathEl.id && pathEl.parentNode) {
          const targetId = pathEl.id;
          skipClearSelectionRef.current = true;
          window.dispatchEvent(new CustomEvent('expand-layer-parent', { detail: { id: targetId } }));
          if (setSelectedLayerId) {
            setSelectedLayerId(targetId);
            selectedLayerIdRef.current = targetId;
          }
          if (setMultiSelectedIds) {
            setMultiSelectedIds(new Set([targetId]));
            multiSelectedIdsRef.current = new Set([targetId]);
          }
          setTimeout(() => {
            const freshEl = document.getElementById(targetId);
            if (freshEl) drawOverlayHighlight(freshEl, 'selected');
            else drawOverlayHighlight(pathEl, 'selected');
          }, 20);
        }
      }
    } else {
      vSession.reset();
      drawingPathRef.current = null;
      if (drawingPageIndexRef.current !== null) {
        clearVectraOverlay(drawingPageIndexRef.current);
      }
    }
  }, [activePageIndex, updatePageHtml, setSelectedLayerId, setMultiSelectedIds]);

  useEffect(() => {
    if (activeBendingSegmentRef.current) {
      clearPenToolNodes(activeBendingSegmentRef.current.pageIndex);
      activeBendingSegmentRef.current = null;
    }
    if (activeMainTool !== 'pen') {
      commitAndExitPenDrawing();
    }
  }, [activeMainTool, commitAndExitPenDrawing]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuIndex(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // ── Escape key: exit current frame context (go up one level) ──────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // ── Restrict shortcuts in non-editor modes ─────────────────
      if (activeTopTool !== 'editor') {
        const isSelectionKey = key === 'v' || key === 'a';
        if (!isSelectionKey) return;
      }

      // Ignore if typing in an input, textarea or contenteditable element
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) ||
        document.activeElement.contentEditable === 'true') {
        return;
      }

      if (e.key === 'Escape' || e.key === 'Enter') {
        if (activeMainTool === 'pen') {
          const vSession = vectraPenSessionRef.current;
          if (vSession) vSession.onKey(e);
          commitAndExitPenDrawing();
          if (typeof setActiveMainTool === 'function') {
            setActiveMainTool('select');
          }
          return;
        }

        // ── Exit Node Edit Mode on Escape/Enter if not in pen tool ──
        if (nodeEditModeRef.current) {
          const pathEl = nodeEditPathRef.current;
          const pIdx = nodeEditPageIndexRef.current;
          exitNodeEditMode();
          if (pathEl && pathEl.ownerSVGElement && updatePageHtml) {
            saveModifiedPageHtml(pIdx, pathEl.ownerSVGElement);
          }
          return;
        }
      } else if (e.key === 'Backspace') {
        if (activeMainTool === 'pen' && selectedPenTool === 'pen') {
          const vSession = vectraPenSessionRef.current;
          const activePath = vSession.getActivePath();
          if (activePath) {
            vSession.onKey(e);
            const pathEl = drawingPathRef.current;
            const updated = vSession.getActivePath();
            if (!updated) {
              if (pathEl && pathEl.parentNode) pathEl.parentNode.removeChild(pathEl);
              drawingPathRef.current = null;
              clearVectraOverlay(activePageIndex);
            } else if (pathEl) {
              pathEl.setAttribute('d', pathToD(updated));
              renderVectraOverlay(activePageIndex, pathEl.parentElement, vSession);
            }
            return;
          }
        }
      } else if (e.key === 'P' && e.shiftKey) {
        setActiveMainTool('pen');
        setSelectedPenTool('pencil');
      } else if (e.key.toLowerCase() === 'g' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();

        const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
        const svg = activeContainer?.querySelector('svg');
        if (!svg) return;

        const ids = multiSelectedIdsRef.current.size > 0
          ? Array.from(multiSelectedIdsRef.current)
          : (selectedLayerIdRef.current ? [selectedLayerIdRef.current] : []);

        const isUngroup = e.shiftKey;

        if (!isUngroup && ids.length > 0) {
          // GROUP
          const elements = ids.map(id => svg.querySelector(`[id="${id}"]`)).filter(Boolean);
          if (elements.length > 0) {
            const parent = elements[0].parentNode;
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.id = 'group-' + Date.now();
            group.setAttribute('data-name', 'Group');
            group.setAttribute('data-type', 'group');

            parent.insertBefore(group, elements[elements.length - 1].nextSibling);

            elements.forEach(el => {
              group.appendChild(el);
            });

            if (updatePageHtml) updatePageHtml(activePageIndex, svg.outerHTML);

            if (setSelectedLayerId) setSelectedLayerId(group.id);
            if (setMultiSelectedIds) setMultiSelectedIds(new Set([group.id]));
          }
        } else if (isUngroup && ids.length > 0) {
          // UNGROUP
          let hasChanges = false;
          const newSelectedIds = new Set();

          // Collect unique group elements to ungroup
          const groupsToUngroup = new Set();
          ids.forEach(id => {
            let el = svg.querySelector(`[id="${id}"]`);
            if (el && el.tagName.toLowerCase() !== 'g') {
              let parentG = el.closest('g');
              if (parentG) el = parentG;
            }
            if (el && el.tagName.toLowerCase() === 'g') {
              const elName = el.getAttribute('data-name') || '';
              const elType = el.getAttribute('data-type') || '';
              const isLocked = el.getAttribute('data-locked') === 'true';
              const isEmbedGroup = el.getAttribute('data-type') === 'embed-frame' || el.querySelector('[data-type="embed-frame"]') !== null;

              if (!isLocked && !isEmbedGroup && !elName.includes('PDF Background') && !elName.includes('Overlay') && elType !== 'frame' && elType !== 'background' && el.parentNode !== svg) {
                groupsToUngroup.add(el);
              }
            }
          });

          groupsToUngroup.forEach(el => {
            const parent = el.parentNode;
            const children = Array.from(el.childNodes);

            const groupTransform = el.getAttribute('transform') || '';
            const inheritableAttrs = ['fill', 'stroke', 'stroke-width', 'opacity', 'font-family', 'font-size', 'font-weight', 'color', 'letter-spacing', 'stroke-linecap', 'stroke-linejoin'];
            const inheritedStyles = {};
            inheritableAttrs.forEach(attr => {
              if (el.hasAttribute(attr)) inheritedStyles[attr] = el.getAttribute(attr);
            });

            children.forEach((child, idx) => {
              if (child.nodeType === 1) { // ELEMENT_NODE
                if (!child.id) {
                  child.id = `ungrouped-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
                }

                if (groupTransform) {
                  const childTransform = child.getAttribute('transform') || '';
                  child.setAttribute('transform', `${groupTransform} ${childTransform}`.trim());
                }

                // Apply inherited styles to child if it doesn't override them
                Object.entries(inheritedStyles).forEach(([attr, val]) => {
                  if (!child.hasAttribute(attr)) {
                    child.setAttribute(attr, val);
                  }
                });

                parent.insertBefore(child, el);
                if (child.id) newSelectedIds.add(child.id);
              }
            });

            parent.removeChild(el);
            hasChanges = true;
          });

          if (hasChanges) {
            if (updatePageHtml) updatePageHtml(activePageIndex, svg.outerHTML);
            const newIdsArr = Array.from(newSelectedIds);
            if (setSelectedLayerId) setSelectedLayerId(newIdsArr.length === 1 ? newIdsArr[0] : null);
            if (setMultiSelectedIds) setMultiSelectedIds(new Set(newIdsArr));
          }
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();

        // ── Node Edit Mode: Delete selected handle point, line segment, or center node point ──
        if (nodeEditModeRef.current && nodeEditPaperPathRef.current && nodeEditPathRef.current) {
          window.__nodeEditModeActive = true;
          let paperPath = nodeEditPaperPathRef.current;
          const pathEl = nodeEditPathRef.current;
          const pIdx = nodeEditPageIndexRef.current !== null ? nodeEditPageIndexRef.current : activePageIndex;
          const targetSegIndices = (nodeEditSelectedSegIndicesRef.current && nodeEditSelectedSegIndicesRef.current.size > 0)
            ? Array.from(nodeEditSelectedSegIndicesRef.current)
            : (nodeEditSelectedSegIdxRef.current !== null ? [nodeEditSelectedSegIdxRef.current] : []);

          const selectedHandleSide = nodeEditSelectedHandleSideRef.current;

          if (targetSegIndices.length > 0 || selectedHandleSide === 'line' || selectedHandleSide === 'segment') {
            paperScopeRef.current.activate();
            const { sideDeleted, paperPath: updatedPath } = deleteSelectedNodeOrHandle(paperPath, targetSegIndices, selectedHandleSide, paperScopeRef.current, nodeEditSelectedCurveIdxRef.current);
            if (updatedPath) {
              paperPath = updatedPath;
              nodeEditPaperPathRef.current = updatedPath;
            }
            if (sideDeleted === 'in' || sideDeleted === 'out') {
              nodeEditSelectedHandleSideRef.current = 'point';
            } else {
              nodeEditSelectedHandleSideRef.current = null;
              nodeEditSelectedCurveIdxRef.current = null;
              nodeEditSelectedSegIdxRef.current = null;
              nodeEditSelectedSegIndicesRef.current = new Set();
            }

            const dStr = cleanPaperPathData(paperPath);
            const remainingSegments = getPaperSegments(paperPath);
            const svgEl = pathEl.ownerSVGElement;

            let allCollapsed = false;
            if (remainingSegments.length > 0) {
              const firstPt = remainingSegments[0].point;
              allCollapsed = remainingSegments.every(s => Math.hypot(s.point.x - firstPt.x, s.point.y - firstPt.y) < 2.0);
            }
            if (remainingSegments.length <= 1 || allCollapsed || !dStr || dStr.trim() === '') {
              pathEl.remove();
              exitNodeEditMode();
              if (svgEl && updatePageHtml) {
                saveModifiedPageHtml(pIdx, svgEl);
              }
              if (typeof setSelectedLayerId === 'function') setSelectedLayerId(null);
            } else {
              pathEl.setAttribute('d', dStr);
              if (sideDeleted === 'point' || sideDeleted === 'line') {
                nodeEditSelectedSegIdxRef.current = null;
                nodeEditSelectedSegIndicesRef.current = new Set();
              }
              drawNodeEditOverlay(pathEl, paperPath, pIdx);
              if (svgEl && updatePageHtml) {
                saveModifiedPageHtml(pIdx, svgEl);
              }
            }
            return;
          }
        }

        // Core Logic: Delete selected element
        const ids = multiSelectedIdsRef.current.size > 0
          ? Array.from(multiSelectedIdsRef.current)
          : (selectedLayerIdRef.current ? [selectedLayerIdRef.current] : []);

        if (ids.length === 0) return;

        const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
        const svg = activeContainer?.querySelector('svg');
        if (!svg) return;

        let deleted = false;
        ids.forEach(id => {
          const el = svg.querySelector(`[id="${id}"]`);
          if (!el) return;

          const elName = el.getAttribute('data-name') || '';
          const elType = el.getAttribute('data-type') || '';
          const isLocked = el.getAttribute('data-locked') === 'true';

          if (!isLocked && !elName.includes('PDF Background') && !elName.includes('Overlay') && elType !== 'frame' && elType !== 'background') {
            el.remove();
            deleted = true;
          }
        });

        if (deleted && updatePageHtml) {
          updatePageHtml(activePageIndex, svg.outerHTML);
          const topFrames = getTopLevelFrames(svg);
          const rootId = (topFrames && topFrames.length > 0 ? topFrames[0].id : pages[activePageIndex]?.layers?.[0]?.id);
          if (rootId) {
            if (setSelectedLayerId) setSelectedLayerId(rootId);
            if (setMultiSelectedIds) setMultiSelectedIds(new Set([rootId]));
            if (setCurrentFrameId) setCurrentFrameId(rootId);
            currentFrameIdRef.current = rootId;
          } else {
            if (setSelectedLayerId) setSelectedLayerId(null);
            if (setMultiSelectedIds) setMultiSelectedIds(new Set());
            if (setCurrentFrameId) setCurrentFrameId(null);
            currentFrameIdRef.current = null;
          }
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Core Logic: Move selected element with arrow keys
        e.preventDefault();
        const step = e.shiftKey ? 1 : 0.1;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        else if (e.key === 'ArrowDown') dy = step;
        else if (e.key === 'ArrowLeft') dx = -step;
        else if (e.key === 'ArrowRight') dx = step;

        const ids = multiSelectedIdsRef.current.size > 0
          ? Array.from(multiSelectedIdsRef.current)
          : (selectedLayerIdRef.current ? [selectedLayerIdRef.current] : []);

        if (ids.length === 0) return;

        ids.forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;

          // Prevent moving locked elements, PDF backgrounds, or main frames via keyboard
          const elName = el.getAttribute('data-name') || '';
          const elType = el.getAttribute('data-type') || '';
          const isLocked = el.getAttribute('data-locked') === 'true';

          if (isLocked ||
            elName.includes('PDF Background') ||
            elName.includes('Overlay') ||
            elType === 'frame' ||
            elType === 'background') {
            return;
          }

          const matrix = getElementMatrix(el);
          const nextMatrix = new DOMMatrix().translate(dx, dy).multiply(matrix);
          el.setAttribute('transform', matrixToTransform(nextMatrix));
          // Update highlights
          const highlightType = (currentFrameIdRef.current && el.id !== currentFrameIdRef.current) ? 'child-selected' : 'selected';
          drawOverlayHighlight(el, highlightType);
        });

        if (multiSelectedIdsRef.current.size > 1) {
          // If we have a drawMultiSelectionHighlight function in scope, we should use it. 
          // However, it's defined inside the component so it's accessible!
          if (typeof drawMultiSelectionHighlight === 'function') {
            drawMultiSelectionHighlight(multiSelectedIdsRef.current, 'selected');
          }
        }

        if (updatePageHtml) {
          const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
          const svg = activeContainer?.querySelector('svg');
          if (svg) updatePageHtml(activePageIndex, svg.outerHTML);
        }

        if (!nodeEditModeRef.current && isAltPressedRef.current && drawMeasurementOverlayRef.current && lastMousePosRef.current && lastMousePosRef.current.target) {
          let currentTarget = lastMousePosRef.current.target;
          // If the SVG re-rendered, the old target might be detached from the DOM.
          // Get the fresh element currently at the mouse coordinates.
          if (currentTarget && !document.contains(currentTarget)) {
            currentTarget = document.elementFromPoint(lastMousePosRef.current.x, lastMousePosRef.current.y) || currentTarget;
            lastMousePosRef.current.target = currentTarget;
          }
          drawMeasurementOverlayRef.current(currentTarget, lastMousePosRef.current.x, lastMousePosRef.current.y, true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handleTriggerGroup = () => {
      handleKeyDown({ key: 'g', ctrlKey: true, preventDefault: () => { } });
    };
    const handleTriggerUngroup = () => {
      handleKeyDown({ key: 'G', ctrlKey: true, shiftKey: true, preventDefault: () => { } });
    };
    window.addEventListener('trigger-group', handleTriggerGroup);
    window.addEventListener('trigger-ungroup', handleTriggerUngroup);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('trigger-group', handleTriggerGroup);
      window.removeEventListener('trigger-ungroup', handleTriggerUngroup);
    };
  }, [setSelectedLayerId, setMultiSelectedIds, setCurrentFrameId, activePageIndex, updatePageHtml, setActiveMainTool, setSelectedSelectTool, activeTopTool]);

  useEffect(() => {
    return () => {
      dragStateRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.body.classList.remove('resizing-active');
    };
  }, []);

  // ── Clear selection on tool switch ──────────────────────────────────────────
  const prevActiveMainToolRef = useRef(activeMainTool);
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const prevTool = prevActiveMainToolRef.current;
    prevActiveMainToolRef.current = activeMainTool;

    if (skipClearSelectionRef.current) {
      skipClearSelectionRef.current = false;
      return;
    }

    // Do not clear selection if main tool has not changed (e.g. sub-tool toggle or re-render within 'select')
    if (prevTool === activeMainTool) {
      return;
    }

    // When switching to pen tool, check if an existing vector path is being edited or selected
    if (activeMainTool === 'pen') {
      // Clear node edit contour overlay so blue outline does not cover existing path stroke while drawing
      document.querySelectorAll('[id^="highlight-overlay-"]').forEach(overlay => {
        const nodeGroup = overlay.querySelector('#node-edit-overlay-group');
        if (nodeGroup) nodeGroup.remove();
      });

      let existingTarget = nodeEditModeRef.current ? nodeEditPathRef.current : null;

      if (existingTarget && existingTarget.getAttribute('d')) {
        drawingPathRef.current = existingTarget;
        nodeEditPathRef.current = existingTarget;
        nodeEditModeRef.current = true;
        drawingPageIndexRef.current = nodeEditPageIndexRef.current !== null ? nodeEditPageIndexRef.current : activePageIndex;
        const activeContainer = existingTarget.closest('.page-svg-container');
        if (activeContainer) {
          const svg = activeContainer.querySelector('svg');
          drawingSvgRef.current = svg;
        }

        if (existingTarget.id && setSelectedLayerId) {
          setSelectedLayerId(existingTarget.id);
          selectedLayerIdRef.current = existingTarget.id;
        }

        const vSession = vectraPenSessionRef.current;
        loadDIntoVectraSession(existingTarget.getAttribute('d'), vSession, paperScopeRef.current);
        if (existingTarget.parentElement) {
          renderVectraOverlay(drawingPageIndexRef.current, existingTarget.parentElement, vSession);
        }
        return;
      }
    }

    if (setSelectedLayerId) {
      setSelectedLayerId(null);
      if (setMultiSelectedIds) {
        setMultiSelectedIds(new Set());
        multiSelectedIdsRef.current = new Set();
      }
      setMarquee(null);
      // Force immediate visual cleanup of active selections
      clearOverlayType('selected');
      clearOverlayType('child-selected');
      // Clear pen tool nodes and Vectra overlay on tool switch
      document.querySelectorAll('.pen-tool-node').forEach(n => n.remove());
      if (activeMainTool !== 'pen' || selectedPenTool !== 'pen') {
        vectraPenSessionRef.current.reset();
        clearVectraOverlay(activePageIndex);
        document.querySelectorAll('[id^="highlight-overlay-"]').forEach(overlay => {
          const g = overlay.querySelector('#vectra-overlay-group');
          if (g) g.innerHTML = '';
        });
      }

      document.querySelectorAll('[data-selected="true"]').forEach(el => el.removeAttribute('data-selected'));
      document.querySelectorAll('[data-child-selected="true"]').forEach(el => el.removeAttribute('data-child-selected'));
    }
  }, [activeMainTool, selectedSelectTool, selectedPenTool, selectedShapeTool, setSelectedLayerId, setMultiSelectedIds]);

  // ── Sync multi-selection ref with prop ────────────────────────────────────────
  useEffect(() => {
    if (multiSelectedIds) {
      multiSelectedIdsRef.current = multiSelectedIds;
    }
  }, [multiSelectedIds]);

  const getMinZoomFor1000mm = useCallback(() => 10, []);

  const handleZoomIn = () => {
    const currentP = currentPanRef.current || pan || { x: 0, y: 0 };
    setZoom(prev => {
      const current = currentZoomRef.current || prev || 100;
      const nextZoom = Math.min(Math.round(current * 1.15), 500);
      currentZoomRef.current = nextZoom;
      if (zoomContainerRef.current) {
        zoomContainerRef.current.style.transition = 'transform 0.15s ease-out';
        zoomContainerRef.current.style.transform = `translate(${currentP.x}px, ${currentP.y}px) scale(${nextZoom / 100})`;
      }
      return nextZoom;
    });
  };

  const handleZoomOut = () => {
    const currentP = currentPanRef.current || pan || { x: 0, y: 0 };
    setZoom(prev => {
      const current = currentZoomRef.current || prev || 100;
      const nextZoom = Math.max(Math.round(current / 1.15), 10);
      currentZoomRef.current = nextZoom;
      if (zoomContainerRef.current) {
        zoomContainerRef.current.style.transition = 'transform 0.15s ease-out';
        zoomContainerRef.current.style.transform = `translate(${currentP.x}px, ${currentP.y}px) scale(${nextZoom / 100})`;
      }
      return nextZoom;
    });
  };

  const handleAutoFitZoom = useCallback(() => {
    if (!editorContainerRef.current) return;

    const container = editorContainerRef.current;
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();

    // If container layout is not fully rendered yet (e.g. during page load / loading transition)
    if (containerWidth < 300 || containerHeight < 200) {
      setTimeout(() => {
        if (editorContainerRef.current) {
          const rect = editorContainerRef.current.getBoundingClientRect();
          if (rect.width >= 300 && rect.height >= 200) {
            handleAutoFitZoom();
          }
        }
      }, 100);
      return;
    }

    // Account for padding (p-[1vw])
    const padding = window.innerWidth * 0.01;
    // Reserve space for left and right navigation arrows (approx 4vw each side)
    const arrowSpace = window.innerWidth * 0.08;

    const availWidth = Math.max(100, containerWidth - (padding * 2) - arrowSpace);
    const availHeight = Math.max(100, containerHeight - (padding * 2));

    // Total width and height of the flipbook pages at 100% zoom
    // Note: The canvas has height: 78vh in the CSS
    const baseVhHeight = window.innerHeight * 0.78;

    // Calculate effective aspect ratio
    let totalWidth = baseWidth || 210;
    let totalHeight = baseHeight || 297;

    const baseCanvasHeight = baseVhHeight;
    const baseCanvasWidth = baseCanvasHeight * (totalWidth / totalHeight);

    const scaleX = availWidth / baseCanvasWidth;
    const scaleY = availHeight / baseCanvasHeight;

    // Use a safety margin (90%) of the arrow-adjusted space
    let autoZoom = Math.min(scaleX, scaleY) * 90;

    // Ensure auto-scale has a comfortable minimum zoom on load (between 55% and 250%)
    autoZoom = Math.max(55, Math.min(250, Math.round(autoZoom)));

    setZoom(autoZoom);
  }, [baseWidth, baseHeight, activePageIndex, pages.length]);

  const handleResetZoom = () => {
    handleAutoFitZoom();
    setPan({ x: 0, y: 0 });
  };

  // ── Auto-Fit Zoom on Page/Spread/Dimension Change & Initial Load ────────────
  useEffect(() => {
    handleAutoFitZoom();
    const t1 = setTimeout(handleAutoFitZoom, 100);
    const t2 = setTimeout(handleAutoFitZoom, 350);
    const t3 = setTimeout(handleAutoFitZoom, 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activePageIndex, pages.length, baseWidth, baseHeight, handleAutoFitZoom]);

  // ── Sync Pan & Zoom Tracking Refs ──────────────────────────────────────────
  useEffect(() => {
    currentPanRef.current = pan;
  }, [pan]);

  useEffect(() => {
    currentZoomRef.current = zoom;
  }, [zoom]);

  // ── Maintain Fit on Window/Sidebar Resize ────────────────────────────────
  useEffect(() => {
    if (!editorContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      handleAutoFitZoom();
    });
    observer.observe(editorContainerRef.current);
    return () => observer.disconnect();
  }, [handleAutoFitZoom]);

  const insertImageIntoPage = (pageIdx, rawDataUrl, dataType = 'image', dropPoint = null, targetShapeId = null) => {
    if (!rawDataUrl) return;
    if (typeof setActiveMainTool === 'function') {
      setActiveMainTool('select');
    }

    // 0. Clean & sanitize URL (handle HTML snippets, newlines in text/uri-list, quotes)
    let dataUrl = typeof rawDataUrl === 'string' ? rawDataUrl.trim() : rawDataUrl;
    if (typeof dataUrl === 'string') {
      if (dataUrl.includes('\n') || dataUrl.includes('\r')) {
        const lines = dataUrl.split(/[\r\n]+/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        if (lines.length > 0) dataUrl = lines[0];
      }
      if (dataUrl.includes('<img') || dataUrl.includes('<a ')) {
        const match = dataUrl.match(/(?:src|href)=["']([^"']+)["']/i);
        if (match && match[1]) {
          dataUrl = match[1];
        }
      }
    }

    // 1. Find the SVG of the target page
    const container = document.querySelector(`.page-svg-container[data-page-index="${pageIdx}"]`);
    const svg = container?.querySelector('svg');
    if (!svg) {
      console.error(`[MainEditor] Could not find SVG container for page ${pageIdx}`);
      return;
    }

    // 2. Create SVG <g> for Image Group
    const groupId = `image-group-${Math.random().toString(36).substr(2, 9)}`;
    const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    newGroup.id = groupId;
    newGroup.setAttribute('data-type', dataType || 'image');
    if (dataType === 'gif') {
      newGroup.setAttribute('data-name', 'GIF Group');
      newGroup.setAttribute('data-is-gif-group', 'true');
    } else if (dataType === 'video') {
      newGroup.setAttribute('data-name', 'Video Group');
      newGroup.setAttribute('data-is-video-group', 'true');
    } else {
      newGroup.setAttribute('data-name', 'Image Group');
      newGroup.setAttribute('data-is-image-group', 'true');
    }

    // 3. Create SVG <image>
    const imgId = `image-${Math.random().toString(36).substr(2, 9)}`;
    const newImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    newImg.id = imgId;
    // Set both for maximum cross-browser/renderer compatibility
    newImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
    newImg.setAttribute('href', dataUrl);
    if (dataType === 'gif') {
      newImg.setAttribute('data-name', 'GIF');
    } else if (dataType === 'video') {
      newImg.setAttribute('data-name', 'Video');
    } else {
      newImg.setAttribute('data-name', 'Image');
    }
    newImg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    newGroup.appendChild(newImg);

    let inserted = false;
    const placeImageInFrame = (imgWidth = 100, imgHeight = 100) => {
      if (inserted) return;
      inserted = true;

      if (targetShapeId && dataType === 'image') {
        const shapeEl = svg.querySelector(`[id="${targetShapeId}"]`);
        if (shapeEl) {
          try {
            // Check if it already has a fill, to store it
            if (!shapeEl.hasAttribute('data-original-fill')) {
              shapeEl.setAttribute('data-original-fill', shapeEl.getAttribute('fill') || '#d0ccff');
            }
            shapeEl.setAttribute('data-masked-image-url', dataUrl);
            shapeEl.setAttribute('data-masked-image-type', dataType);

            let defs = svg.querySelector('defs');
            if (!defs) {
              defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
              svg.insertBefore(defs, svg.firstChild);
            }

            const safeShapeId = (targetShapeId || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
            const clipId = `clip-shape-${safeShapeId}`;
            let clip = defs.querySelector(`clipPath[id="${clipId}"]`);
            if (!clip) {
              clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
              clip.id = clipId;
              defs.appendChild(clip);
            } else {
              clip.innerHTML = '';
            }

            // Clone the shape for the clip path, removing visual attributes
            const clipShape = shapeEl.cloneNode(true);
            clipShape.removeAttribute('id');
            clipShape.removeAttribute('fill');
            clipShape.removeAttribute('stroke');
            clipShape.removeAttribute('stroke-width');
            clipShape.removeAttribute('data-masked-image-url');
            clipShape.removeAttribute('data-name');
            // Keep the transform on the clipShape so it matches the shape's exact geometry and position
            clip.appendChild(clipShape);

            const imageId = `masked-img-${safeShapeId}`;
            let imageEl = svg.querySelector(`image[id="${imageId}"]`);
            if (!imageEl) {
              imageEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');
              imageEl.id = imageId;
              // Insert the image immediately before the shape so it renders underneath the shape's stroke
              shapeEl.parentNode.insertBefore(imageEl, shapeEl);
            }

            // The image should cover the bounding box of the shape.
            // Since the clipShape already has the transform, if we apply the same transform to the image,
            // the clip path will be transformed TWICE.
            // Wait, clipPath contents are evaluated in the coordinate system of the referencing element!
            // If the referencing element (imageEl) has no transform, but the clipShape DOES have a transform,
            // the clip region will correctly match the shape's global position.
            // But we need the image to be large enough to cover the clip region.
            try {
              const bbox = shapeEl.getBBox();
              imageEl.setAttribute('x', bbox.x);
              imageEl.setAttribute('y', bbox.y);
              imageEl.setAttribute('width', bbox.width);
              imageEl.setAttribute('height', bbox.height);
              
              // We must also apply the shape's transform to the image, BUT if we do, the clipPath (which has the transform)
              // would be double-transformed. So we must NOT put the transform on the clipShape!
              
              // Actually, wait, let's reset the clip path content:
              clip.innerHTML = '';
              const cleanClipShape = shapeEl.cloneNode(true);
              cleanClipShape.removeAttribute('id');
              cleanClipShape.removeAttribute('fill');
              cleanClipShape.removeAttribute('stroke');
              cleanClipShape.removeAttribute('stroke-width');
              cleanClipShape.removeAttribute('transform'); // REMOVE transform from clip path
              clip.appendChild(cleanClipShape);
              
              // Apply the shape's transform to the image
              const transform = shapeEl.getAttribute('transform');
              if (transform) {
                imageEl.setAttribute('transform', transform);
              } else {
                imageEl.removeAttribute('transform');
              }
            } catch (e) {
              // Fallback if getBBox fails
              imageEl.setAttribute('x', '0');
              imageEl.setAttribute('y', '0');
              imageEl.setAttribute('width', '100%');
              imageEl.setAttribute('height', '100%');
            }

            imageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
            imageEl.setAttribute('href', dataUrl);
            imageEl.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            imageEl.setAttribute('clip-path', `url(#${clipId})`);
            imageEl.setAttribute('data-is-mask-image', 'true');
            imageEl.setAttribute('data-target-shape', safeShapeId);

            // Set shape fill to none so image shows through
            shapeEl.setAttribute('fill', 'none');

            // Find and clean up any old pattern to avoid clutter
            const patternId = `pattern-shape-${safeShapeId}`;
            const oldPattern = defs.querySelector(`pattern[id="${patternId}"]`);
            if (oldPattern) oldPattern.remove();

            if (updatePageHtml) {
              saveModifiedPageHtml(pageIdx, svg);
            }
            if (typeof setSingleSelection === 'function') {
              setSingleSelection(targetShapeId);
            } else {
              if (setSelectedLayerId) setSelectedLayerId(targetShapeId);
              selectedLayerIdRef.current = targetShapeId;
              if (setMultiSelectedIds) setMultiSelectedIds(new Set([targetShapeId]));
              multiSelectedIdsRef.current = new Set([targetShapeId]);
            }
            if (setActiveMainTool) setActiveMainTool('select');
            setTimeout(() => {
              const el = document.getElementById(targetShapeId);
              if (el && typeof drawOverlayHighlight === 'function') {
                drawOverlayHighlight(el, 'selected');
              }
            }, 50);
            return;
          } catch (err) {
            console.error('[MainEditor] Masking image failed:', err);
          }
        }
      }

      // Append to root frame
      const topFrames = getTopLevelFrames(svg);
      const targetFrame = currentFrameIdRef.current ? svg.querySelector(`[id="${currentFrameIdRef.current}"]`) : null;
      const rootFrame = targetFrame || topFrames[0] || svg.querySelector('g') || svg;

      if (rootFrame) {
        try {
          // Determine full page container bounds
          let pWidth = baseWidth || 210, pHeight = baseHeight || 297;
          let pX = 0, pY = 0;

          try {
            const viewBoxAttr = svg.getAttribute('viewBox');
            if (viewBoxAttr) {
              const vb = viewBoxAttr.split(/[\s,]+/).map(Number);
              if (vb.length === 4 && !isNaN(vb[2]) && !isNaN(vb[3]) && vb[2] > 0 && vb[3] > 0) {
                pX = vb[0];
                pY = vb[1];
                pWidth = vb[2];
                pHeight = vb[3];
              }
            }
            if (rootFrame.getBBox) {
              const bbox = rootFrame.getBBox();
              if (bbox.width > 0 && bbox.height > 0) {
                pWidth = bbox.width;
                pHeight = bbox.height;
                pX = bbox.x;
                pY = bbox.y;
              }
            }
          } catch (e) { }

          // Scale image to a clean initial size centered on the page (approx 35-40% of page width)
          const targetInitialSize = Math.min(pWidth * 0.4, 90);
          let displayWidth = targetInitialSize;
          let displayHeight = (imgHeight / imgWidth) * displayWidth;

          if (displayHeight > targetInitialSize) {
            displayHeight = targetInitialSize;
            displayWidth = (imgWidth / imgHeight) * displayHeight;
          }

          const cx = dropPoint && typeof dropPoint.x === 'number' ? dropPoint.x : (pX + pWidth / 2);
          const cy = dropPoint && typeof dropPoint.y === 'number' ? dropPoint.y : (pY + pHeight / 2);

          newGroup.setAttribute('data-object-fit', 'Fit');
          newImg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          newImg.setAttribute('x', (cx - displayWidth / 2).toString());
          newImg.setAttribute('y', (cy - displayHeight / 2).toString());
          newImg.setAttribute('width', displayWidth.toString());
          newImg.setAttribute('height', displayHeight.toString());

          rootFrame.appendChild(newGroup);

          // CRITICAL: Synchronize changes back to the state
          if (updatePageHtml) {
            saveModifiedPageHtml(pageIdx, svg);
          }

          // Select the newly added group while preserving root folder context
          if (typeof setSingleSelection === 'function') {
            setSingleSelection(groupId);
          } else {
            if (setSelectedLayerId) setSelectedLayerId(groupId);
            selectedLayerIdRef.current = groupId;
            if (setMultiSelectedIds) setMultiSelectedIds(new Set([groupId]));
            multiSelectedIdsRef.current = new Set([groupId]);
          }
          if (setActiveMainTool) setActiveMainTool('select');
          if (setCurrentFrameId && rootFrame.id) {
            setCurrentFrameId(rootFrame.id);
            currentFrameIdRef.current = rootFrame.id;
          }

          setTimeout(() => {
            const el = document.getElementById(groupId);
            if (el && typeof drawOverlayHighlight === 'function') {
              drawOverlayHighlight(el, 'selected');
            }
          }, 50);

          console.log(`[MainEditor] Image ${groupId} uploaded and inserted into page ${pageIdx}`);
        } catch (err) {
          console.error("[MainEditor] Failed to insert image into SVG frame:", err);
        }
      } else {
        console.error("[MainEditor] No root frame found to append image.");
      }
    };

    // Load image to get dimensions
    const i = new Image();
    i.referrerPolicy = 'no-referrer';
    i.onload = () => {
      placeImageInFrame(i.width || 100, i.height || 100);
    };
    i.onerror = (err) => {
      console.warn("[MainEditor] JS image preloader warning/error, inserting with default dimensions fallback:", err);
      // Fallback to inserting image element into SVG even if JS preloader triggered onerror (e.g. CORS/referrer restriction)
      placeImageInFrame(100, 100);
    };
    i.src = dataUrl;
  };

  useEffect(() => {
    const handleAddImageEvent = (e) => {
      const { pageIndex, dataUrl, dataType } = e.detail;
      insertImageIntoPage(pageIndex, dataUrl, dataType);
    };
    window.addEventListener('upload-image-to-editor', handleAddImageEvent);
    return () => window.removeEventListener('upload-image-to-editor', handleAddImageEvent);
  }, [activePageIndex]);

  const clearOverlayType = (typePattern) => {
    document.querySelectorAll('.selection-overlay-layer').forEach(overlay => {
      overlay.querySelectorAll(`.overlay-pattern-${typePattern}`).forEach(p => p.remove());
      overlay.querySelectorAll(`.overlay-type-${typePattern}`).forEach(p => p.remove());
      // Also clear resize handles if we are clearing selection
      if (typePattern.includes('selected')) {
        overlay.querySelectorAll('.resize-handle').forEach(h => h.remove());
      }
    });

    // Clean up HTML-based UI elements (resize handles)
    document.querySelectorAll('[id^="highlight-overlay-html-"]').forEach(htmlOverlay => {
      htmlOverlay.querySelectorAll(`.overlay-type-${typePattern}`).forEach(p => p.remove());
      if (typePattern.includes('selected')) {
        htmlOverlay.querySelectorAll('.resize-handle').forEach(h => h.remove());
      }
    });
  };

  const clearPenToolNodes = (pageIndex) => {
    clearPenToolNodesExt(pageIndex);
  };

  const drawBendingNodes = (pageIndex, pathEl, paperPath, activeCurveIndex) => {
    drawBendingNodesExt(pageIndex, pathEl, paperPath, activeCurveIndex, zoom, {
      drawingPathRef,
      drawingSubPathsRef,
    });
  };

  const drawPenToolNodes = (pageIndex, parentEl, nestedPoints, currentPoint = null) => {
    drawPenToolNodesExt(pageIndex, parentEl, nestedPoints, currentPoint, zoom);
  };

  const renderVectraOverlay = (pageIndex, parentEl, vectraSession) => {
    renderVectraOverlayExt(pageIndex, parentEl, vectraSession, zoom);
  };

  const clearVectraOverlay = (pageIndex) => {
    clearVectraOverlayExt(pageIndex);
  };

  // ── NODE EDIT MODE ─────────────────────────────────────────────────────────
  // Draws all anchor points and bezier handles for a path element on the overlay SVG.
  // Matching D:\SVG_Editor colors (#4E9EFF) and circular node styling.
  const drawNodeEditOverlay = (pathEl, paperPath, pageIndex) => {
    drawNodeEditOverlayExt(pathEl, paperPath, pageIndex, zoom, {
      nodeEditSelectedSegIdxRef,
      nodeEditSelectedSegIndicesRef,
      nodeEditSelectedHandleSideRef,
      nodeEditSelectedCurveIdxRef,
      nodeEditHoverCurveIdxRef,
      nodeEditSplitSegIdxRef,
      nodeEditDragRef,
      nodeEditScreenNodesRef,
      nodeEditScreenSegmentsRef,
      nodeEditRetractHandleRef,
    });
  };

  const exitNodeEditMode = () => {
    if (!nodeEditModeRef.current) return;

    // Remove node edit overlay from ALL page highlight containers
    document.querySelectorAll('[id^="highlight-overlay-"]').forEach(overlay => {
      const nodeGroup = overlay.querySelector('#node-edit-overlay-group');
      if (nodeGroup) nodeGroup.remove();
    });

    // Restore selection highlight
    const pathEl = nodeEditPathRef.current;
    nodeEditModeRef.current = false;
    nodeEditPathRef.current = null;
    drawingPathRef.current = null;
    nodeEditPageIndexRef.current = null;
    nodeEditDragRef.current = null;
    nodeEditSelectedSegIdxRef.current = null;
    nodeEditSelectedCurveIdxRef.current = null;
    nodeEditHoverCurveIdxRef.current = -1;
    nodeEditSelectedSegIndicesRef.current = new Set();
    nodeEditSplitSegIdxRef.current = null;
    if (vectraPenSessionRef.current) vectraPenSessionRef.current.reset();

    if (pathEl && pathEl.id && document.getElementById(pathEl.id)) {
      drawOverlayHighlight(pathEl, 'selected');
    }

    // Remove node-edit cursor class
    document.querySelectorAll('.page-svg-container').forEach(el => el.classList.remove('cur-node-edit'));
    window.dispatchEvent(new CustomEvent('node-edit-mode-changed', { detail: { active: false } }));
  };

  const [isNodeEditActive, setIsNodeEditActive] = useState(false);

  useEffect(() => {
    const handleNodeEditChange = (e) => {
      setIsNodeEditActive(Boolean(e.detail?.active));
    };
    window.addEventListener('node-edit-mode-changed', handleNodeEditChange);
    return () => window.removeEventListener('node-edit-mode-changed', handleNodeEditChange);
  }, []);

  // ── Auto-exit Node Edit Mode when switching pages or changing layer selection ──
  useEffect(() => {
    if (nodeEditModeRef.current) {
      if (activePageIndex !== nodeEditPageIndexRef.current || (selectedLayerId && selectedLayerId !== nodeEditPathRef.current?.id)) {
        exitNodeEditMode();
      }
    }
  }, [activePageIndex, selectedLayerId]);

  // Re-draw active node overlays on zoom change so pen points/dots retain constant visual size
  useEffect(() => {
    if (nodeEditModeRef.current && nodeEditPathRef.current && nodeEditPaperPathRef.current) {
      drawNodeEditOverlay(nodeEditPathRef.current, nodeEditPaperPathRef.current, nodeEditPageIndexRef.current);
    }
    if (drawingPathRef.current && drawingSubPathsRef.current) {
      drawPenToolNodes(activePageIndex, drawingPathRef.current, drawingSubPathsRef.current);
    }
    if (bendingStateRef.current) {
      const { pathEl, paperPath, curveIndex, pageIndex: activePageIdx } = bendingStateRef.current;
      drawBendingNodes(activePageIdx, pathEl, paperPath, curveIndex);
    }
  }, [zoom]);

  // ── Live sync PaperPath & Node Overlay when shape path changes (e.g. Sides, Ratio, Corner slider in ShapeProperties) ──
  useEffect(() => {
    if (nodeEditModeRef.current && nodeEditPathRef.current) {
      const pathEl = nodeEditPathRef.current;
      const freshEl = pathEl.id ? document.getElementById(pathEl.id) : pathEl;
      const targetPathEl = freshEl?.tagName?.toLowerCase() === 'path' ? freshEl : freshEl?.querySelector?.('path');
      if (targetPathEl && targetPathEl.getAttribute('d')) {
        const newD = targetPathEl.getAttribute('d');
        const pageIdx = nodeEditPageIndexRef.current !== null ? nodeEditPageIndexRef.current : activePageIndex;
        try {
          paperScopeRef.current.activate();
          const newPaperPath = createPaperPath(newD);
          if (newPaperPath) {
            bakeTransformIntoPaperPath(targetPathEl, newPaperPath, paperScopeRef.current);
            nodeEditPathRef.current = targetPathEl;
            nodeEditPaperPathRef.current = newPaperPath;
            drawNodeEditOverlay(targetPathEl, newPaperPath, pageIdx);
          }
        } catch (err) {
          console.warn('[NodeEditSync] Error syncing node edit paper path:', err);
        }
      }
    }
  }, [pages, activePageIndex]);

  const enterNodeEditMode = (targetEl, pageIndex) => {
    if (!targetEl) return;
    if (activeTopTool === 'interaction' || activeTopTool === 'animation' || activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') return;

    const pathEl = targetEl.tagName?.toLowerCase() === 'path' ? targetEl : targetEl.querySelector('path');
    if (!pathEl || !pathEl.getAttribute('d')) return;

    const d = pathEl.getAttribute('d');
    if (!d) return;

    // Exit any previous node edit mode first
    if (nodeEditModeRef.current) exitNodeEditMode();

    try {
      const paperPath = createPaperPath(d);
      if (!paperPath) return;

      // Bake any pending element/parent transform matrix into pathEl d attribute & paperPath
      bakeTransformIntoPaperPath(pathEl, paperPath, paperScopeRef.current);

      nodeEditModeRef.current = true;
      nodeEditPathRef.current = pathEl;
      nodeEditPageIndexRef.current = pageIndex;
      nodeEditPaperPathRef.current = paperPath;
      nodeEditDragRef.current = null;
      nodeEditSelectedSegIdxRef.current = 0;
      nodeEditSelectedSegIndicesRef.current = new Set([0]);
      nodeEditSplitSegIdxRef.current = null;

      if (pathEl.id) {
        selectedLayerIdRef.current = pathEl.id;
        if (typeof setSelectedLayerId === 'function') setSelectedLayerId(pathEl.id);
        if (typeof setMultiSelectedIds === 'function') {
          multiSelectedIdsRef.current = new Set([pathEl.id]);
          setMultiSelectedIds(new Set([pathEl.id]));
        }
      }

      // Add direct selection arrow cursor to container
      document.querySelectorAll('.page-svg-container').forEach(el => el.classList.add('cur-node-edit'));

      // Remove regular selection highlight & measurement guides (replace with node overlay)
      clearOverlayType('selected');
      clearMeasurementOverlay();
      const overlay = document.getElementById(`highlight-overlay-${pageIndex}`);
      if (overlay) {
        overlay.querySelectorAll(`[id*="${pathEl.id}"]`).forEach(n => n.remove());
      }

      drawNodeEditOverlay(pathEl, paperPath, pageIndex);

      // Add a banner/badge in the page container to indicate node edit mode
      const container = pathEl.closest('.page-svg-container');
      if (container) {
        container.setAttribute('data-node-edit-active', 'true');
      }

      window.dispatchEvent(new CustomEvent('node-edit-mode-changed', { detail: { active: true, pathId: pathEl.id } }));

      // Dispatch initial node-selected event so curve tool buttons reflect the correct type for segment 0
      try {
        const initSegs = getPaperSegments(paperPath);
        const initSeg = initSegs[0];
        if (initSeg) {
          let initNodeType = initSeg.nodeType;
          if (!initNodeType) {
            if (initSeg.handleIn.isZero() && initSeg.handleOut.isZero()) {
              initNodeType = 'sharp';
            } else if (!initSeg.handleIn.isZero() && !initSeg.handleOut.isZero()) {
              const dot = initSeg.handleIn.normalize().dot(initSeg.handleOut.normalize());
              if (dot < -0.90) {
                initNodeType = Math.abs(initSeg.handleIn.length - initSeg.handleOut.length) < 4.0 ? 'balanced' : 'smooth';
              } else {
                initNodeType = 'custom';
              }
            } else {
              initNodeType = 'custom';
            }
            initSeg.nodeType = initNodeType;
          }
          window.dispatchEvent(new CustomEvent('node-selected', { detail: { nodeType: initNodeType, segIdx: 0, selectedCount: 1, canJoin: false, isLineSelected: false } }));
        }
      } catch (_) { }
    } catch (err) {
      console.warn('[NodeEditMode] Failed to enter node edit mode:', err);
    }
  };

  // ── Sync refs and perform page-level DOM highlights ──────────────────────────
  useEffect(() => {
    if (activeTopTool === 'interaction' || activeTopTool === 'animation') {
      if (nodeEditModeRef.current) {
        exitNodeEditMode();
      }
    }

    // Force immediate visual cleanup of all overlays before redraw
    clearOverlayType('selected');
    clearOverlayType('entered');
    clearOverlayType('child-selected');

    // Clean up HTML-based UI elements (interaction badges)
    document.querySelectorAll('[id^="interaction-badge-"]').forEach(badge => {
      if (activeTopTool !== 'interaction') {
        badge.remove();
      } else {
        const id = badge.id.replace('interaction-badge-', '');
        const idsToHighlight = multiSelectedIds.size > 0
          ? multiSelectedIds
          : (selectedLayerId ? new Set([selectedLayerId]) : new Set());
        if (!idsToHighlight.has(id)) {
          badge.remove();
        }
      }
    });

    if (multiSelectedIds.size > 1) {
      drawMultiSelectionHighlight(multiSelectedIds, 'selected');
    } else {
      const idsToHighlight = multiSelectedIds.size > 0
        ? multiSelectedIds
        : (selectedLayerId ? new Set([selectedLayerId]) : new Set());

      idsToHighlight.forEach(id => {
        document.querySelectorAll(`[id="${id}"]`).forEach(el => {
          // Highlights across multiple pages are drawn in their respective containers
          const type = (currentFrameId && id !== currentFrameId) ? 'child-selected' : 'selected';
          el.setAttribute(`data-${type}`, 'true');
          drawOverlayHighlight(el, type);

          // If this selected element is inside a parent group, highlight the parent group with a dotted line!
          const parentGroup = el.parentElement?.closest('g');
          if (parentGroup && parentGroup.id && parentGroup.id !== id && parentGroup.getAttribute('data-type') !== 'frame' && parentGroup.getAttribute('data-name') !== 'Overlay') {
            drawOverlayHighlight(parentGroup, 'entered');
          }
        });
      });
    }

    if (currentFrameId) {
      document.querySelectorAll(`[id="${currentFrameId}"]`).forEach(el => {
        if (el.getAttribute('data-type') === 'frame') {
          el.setAttribute('data-frame-entered', 'true');
          drawOverlayHighlight(el, 'entered');
        }
      });
    }

    if (isEditingTextRef.current) {
      document.querySelectorAll('.selection-overlay-layer .resize-handle').forEach(h => h.remove());
      document.querySelectorAll('[id^="highlight-overlay-html-"] .resize-handle').forEach(h => h.remove());
    }
  }, [selectedLayerId, currentFrameId, multiSelectedIds, pages, activePageIndex, zoom, activeTopTool]);

  // Sync refs
  useEffect(() => {
    currentFrameIdRef.current = currentFrameId;
  }, [currentFrameId]);

  // Helper: get direct children of SVG root that have IDs (top-level frames)
  const getTopLevelFrames = (svg) => {
    return Array.from(svg.children).filter(el =>
      el.id &&
      el.tagName.toLowerCase() !== 'style' &&
      el.tagName.toLowerCase() !== 'defs' &&
      el.getAttribute('data-hidden') !== 'true' &&
      el.getAttribute('data-locked') !== 'true'
    );
  };

  // Helper: get direct children of a given element that have IDs
  const getDirectChildFrames = (el) => {
    // Only group-like elements can act as frames that contain selectable children
    const tag = el.tagName?.toLowerCase();
    if (tag !== 'g' && tag !== 'svg' && tag !== 'multi') {
      return [];
    }

    // If this element is an image/video/gif group, or a compound element (audio/embed/icon), it should act as a single layer (no children exposed)
    const dataType = el.getAttribute('data-type');
    if (el.getAttribute('data-is-image-group') || el.getAttribute('data-is-video-group') || el.getAttribute('data-is-gif-group') ||
        dataType === 'embed-frame' || dataType === 'audio-frame' || dataType === 'icon' || (el.querySelector && el.querySelector('[data-type="audio-frame"]'))) {
      return [];
    }

    return Array.from(el.children).filter(child =>
      child.id &&
      child.tagName.toLowerCase() !== 'style' &&
      child.tagName.toLowerCase() !== 'defs' &&
      child.getAttribute('data-hidden') !== 'true' &&
      child.getAttribute('data-locked') !== 'true' &&
      child.getAttribute('data-name') !== 'Overlay'
    );
  };

  // Helper: check if a point (clientX, clientY) hits an element's bounding box mathematically mapped
  const hitTest = (el, clientX, clientY, buffer = 0) => {
    if (!el) return false;

    const isCroppedEl = isElementCropped(el);

    // 1. Pixel-perfect fast check: native browser hit testing
    const hitElements = document.elementsFromPoint(clientX, clientY);
    const isHit = hitElements.includes(el) || (typeof el.contains === 'function' && hitElements.some(he => el.contains(he)));
    if (isHit) {
      if (!isCroppedEl) return true;
    }

    const isVectorPath = el.getAttribute('data-type') === 'vector-path' || (el.tagName && el.tagName.toLowerCase() === 'path');
    if (isVectorPath) {
      const isSelected = (selectedLayerIdRef.current && selectedLayerIdRef.current === el.id) ||
        (multiSelectedIdsRef.current && multiSelectedIdsRef.current.has(el.id));
      if (!isSelected) {
        // Unselected vector path: require pointer directly over stroke/fill (no gap hover)
        return false;
      }
      // Selected vector path: fall through to bounding box check below so dragging inside the gap works!
    }

    // 2. Extrapolated local Bounding Box hit testing using visual bounds (excludes cropped gaps)
    if (typeof el.getScreenCTM === 'function') {
      const svg = el.ownerSVGElement || (el.tagName && el.tagName.toLowerCase() === 'svg' ? el : null);
      if (svg && typeof svg.createSVGPoint === 'function') {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        try {
          const ctm = el.getScreenCTM();
          if (ctm) {
            const localPt = pt.matrixTransform(ctm.inverse());
            const scale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) || 1;

            if (el.tagName && el.tagName.toLowerCase() === 'line') {
              const x1 = parseFloat(el.getAttribute('x1')) || 0;
              const y1 = parseFloat(el.getAttribute('y1')) || 0;
              const x2 = parseFloat(el.getAttribute('x2')) || 0;
              const y2 = parseFloat(el.getAttribute('y2')) || 0;

              const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
              let t = 0;
              if (l2 > 0) {
                t = ((localPt.x - x1) * (x2 - x1) + (localPt.y - y1) * (y2 - y1)) / l2;
                t = Math.max(0, Math.min(1, t));
              }
              const projX = x1 + t * (x2 - x1);
              const projY = y1 + t * (y2 - y1);
              const dist = Math.sqrt((localPt.x - projX) * (localPt.x - projX) + (localPt.y - projY) * (localPt.y - projY));

              const lineBuffer = 6 / scale;
              const strokeWidth = parseFloat(el.getAttribute('stroke-width')) || 1;
              return dist <= (strokeWidth / 2) + lineBuffer;
            }

            const bbox = getVisualBBox(el);
            if (!bbox || (bbox.width === 0 && bbox.height === 0)) return false;

            const localBuffer = buffer / scale;

            return localPt.x >= (bbox.x - localBuffer) && localPt.x <= (bbox.x + bbox.width + localBuffer) &&
              localPt.y >= (bbox.y - localBuffer) && localPt.y <= (bbox.y + bbox.height + localBuffer);
          }
        } catch (e) { }
      }
    }

    // 3. Fallback check using visual bbox mapped to screen coordinates if getScreenCTM fails
    try {
      const bbox = getVisualBBox(el);
      const ctm = el.getScreenCTM ? el.getScreenCTM() : null;
      if (ctm && bbox && bbox.width > 0 && bbox.height > 0) {
        const pt1 = new DOMPoint(bbox.x, bbox.y).matrixTransform(ctm);
        const pt2 = new DOMPoint(bbox.x + bbox.width, bbox.y).matrixTransform(ctm);
        const pt3 = new DOMPoint(bbox.x + bbox.width, bbox.y + bbox.height).matrixTransform(ctm);
        const pt4 = new DOMPoint(bbox.x, bbox.y + bbox.height).matrixTransform(ctm);
        const minX = Math.min(pt1.x, pt2.x, pt3.x, pt4.x);
        const maxX = Math.max(pt1.x, pt2.x, pt3.x, pt4.x);
        const minY = Math.min(pt1.y, pt2.y, pt3.y, pt4.y);
        const maxY = Math.max(pt1.y, pt2.y, pt3.y, pt4.y);

        return clientX >= minX - buffer && clientX <= maxX + buffer &&
          clientY >= minY - buffer && clientY <= maxY + buffer;
      }
    } catch (e) { }

    const rect = el.getBoundingClientRect();
    return clientX >= rect.left - buffer && clientX <= rect.right + buffer &&
      clientY >= rect.top - buffer && clientY <= rect.bottom + buffer;
  };

  // Helper to get all valid SVG elements at a point (z-index ordered, top to bottom)
  const getElementsAtPoint = (x, y) => {
    return document.elementsFromPoint(x, y).filter(el => {
      const isSvgContent = el.closest('.page-svg-container') && el.id && el.tagName.toLowerCase() !== 'svg';
      const isVisible = el.getAttribute('data-hidden') !== 'true';
      return isSvgContent && isVisible;
    });
  };



  // Sync refs with props/state
  useEffect(() => { selectedLayerIdRef.current = selectedLayerId; }, [selectedLayerId]);
  useEffect(() => { activeMainToolRef.current = activeMainTool; }, [activeMainTool]);
  useEffect(() => { selectedSelectToolRef.current = selectedSelectTool; }, [selectedSelectTool]);
  useEffect(() => { multiSelectedIdsRef.current = multiSelectedIds; }, [multiSelectedIds]);
  useEffect(() => { selectedPenToolRef.current = selectedPenTool; }, [selectedPenTool]);

  const getSvgPoint = (svgElement, clientX, clientY) => {
    const ctm = svgElement?.getScreenCTM();
    if (!ctm) return null;

    const point = svgElement.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    return point.matrixTransform(ctm.inverse());
  };

  const matrixToTransform = (matrix) => {
    return `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`;
  };

  const getElementMatrix = (element) => {
    const baseTransform = element?.transform?.baseVal?.consolidate();

    if (!baseTransform?.matrix) {
      return new DOMMatrix();
    }

    const { a, b, c, d, e, f } = baseTransform.matrix;
    return new DOMMatrix([a, b, c, d, e, f]);
  };

  const getDraggableElement = (target, canvasRoot) => {
    let current = target;

    // If clicking on a tspan, promote to parent text element first
    if (current && current.tagName?.toLowerCase() === 'tspan') {
      current = current.parentElement || current.parentNode;
    }

    // Hotspots are single compound elements; if clicking anywhere inside a hotspot group, drag the whole hotspot!
    const hotspotGroup = current && typeof current.closest === 'function' ? current.closest('[data-is-hotspot="true"], [data-type="hotspot"]') : null;
    if (hotspotGroup) {
      if (!hotspotGroup.id) {
        hotspotGroup.id = `hotspot-${Date.now()}`;
      }
      return hotspotGroup;
    }

    // Buttons are single compound elements; drag the whole button!
    const buttonGroup = current && typeof current.closest === 'function' ? current.closest('[data-type="button"]') : null;
    if (buttonGroup) {
      if (!buttonGroup.id) {
        buttonGroup.id = `button-${Date.now()}`;
      }
      return buttonGroup;
    // Embed frames are single compound elements; drag the whole wrapper!
    const embedFrame = current && typeof current.closest === 'function' ? current.closest('[data-type="embed-frame"]') : null;
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

    // Audio frames are single compound elements; drag the whole wrapper!
    const audioFrame = current && typeof current.closest === 'function' ? current.closest('[data-type="audio-frame"]') : null;
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

    let deepestElementWithId = null;

    while (current && current !== canvasRoot && current.tagName) {
      const tagName = current.tagName.toLowerCase();

      if (tagName === 'svg') {
        return deepestElementWithId;
      }

      // Auto-assign an id to id-less elements from SVG templates so they
      // become selectable. This matches how the type tool creates new text.
      if (
        !current.id &&
        current.getAttribute('data-hidden') !== 'true' &&
        current.getAttribute('data-locked') !== 'true' &&
        current.getAttribute('data-name') !== 'Overlay' &&
        current.getAttribute('data-name') !== 'Document Shield' &&
        current.getAttribute('data-type') !== 'shield' &&
        current.parentNode?.getAttribute('data-type') !== 'button' &&
        current.parentNode?.parentNode?.getAttribute('data-type') !== 'button' &&
        !['svg', 'defs', 'clippath', 'lineargradient', 'radialgradient', 'pattern', 'filter', 'style', 'metadata'].includes(tagName)
      ) {
        current.id = `${tagName}-${Math.random().toString(36).substr(2, 9)}`;
        if (!deepestElementWithId) deepestElementWithId = current;
      }

      if (
        current.id &&
        current.getAttribute('data-hidden') !== 'true' &&
        current.getAttribute('data-locked') !== 'true' &&
        current.getAttribute('data-name') !== 'Overlay' &&
        current.getAttribute('data-name') !== 'Document Shield' &&
        current.getAttribute('data-type') !== 'shield' &&
        (!isConvertedFlipbook || (
          current.getAttribute('data-is-hotspot') === 'true' ||
          current.getAttribute('data-type') === 'hotspot' ||
          current.getAttribute('data-name') === 'Free Frame' ||
          current.getAttribute('data-type') === 'shape' ||
          current.getAttribute('data-type') === 'icon'
        ))
      ) {
        // Prevent targeting inner image of an image group directly, or inner elements of video/gif groups
        if (tagName === 'image' && current.parentNode?.getAttribute('data-is-image-group') === 'true') {
          // Skip the inner image and let it traverse to the parent group
        } else if ((tagName === 'foreignobject' || tagName === 'video' || tagName === 'iframe') && current.parentNode?.getAttribute('data-is-video-group') === 'true') {
          // Skip inner foreignobject/video/iframe and let it traverse to the parent video group
        } else if (current.parentNode?.getAttribute('data-is-gif-group') === 'true') {
          // Skip inner gif elements and let it traverse to parent gif group
        } else if (current.parentNode?.getAttribute('data-type') === 'button' || current.parentNode?.parentNode?.getAttribute('data-type') === 'button') {
          // Skip inner elements of a button and let it traverse to parent button group
        } else {
          if (!deepestElementWithId) deepestElementWithId = current;
        }
      }

      // Check if current is a User Group (<g data-type="group"> or <g data-name="Group"> or id starting with "group-")
      const isUserGroup = current.id && (
        current.getAttribute('data-type') === 'group' ||
        (current.getAttribute('data-name') || '').toLowerCase() === 'group' ||
        current.id.startsWith('group-')
      ) && current.getAttribute('data-is-image-group') !== 'true' && current.getAttribute('data-is-video-group') !== 'true' && current.getAttribute('data-is-gif-group') !== 'true';

      if (isUserGroup && selectedSelectToolRef.current !== 'direct') {
        const frameId = currentFrameIdRef.current;
        // If this group is not the currently entered frame/context, return the User Group!
        if (frameId !== current.id) {
          return current;
        }
      }

      current = current.parentNode;
    }

    return deepestElementWithId;
  };

  const safeRectChecker = (element) => {
    if (element && typeof element.getBoundingClientRect === 'function') {
      try {
        const rect = element.getBoundingClientRect();
        if (rect) {
          return {
            left: rect.left || 0,
            top: rect.top || 0,
            right: rect.right || 0,
            bottom: rect.bottom || 0,
            width: rect.width || 0,
            height: rect.height || 0,
            x: rect.x || rect.left || 0,
            y: rect.y || rect.top || 0,
          };
        }
      } catch (e) { }
    }
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
  };

  const safeStopInteraction = (interaction) => {
    if (!interaction) return;
    if (!interaction.rect) {
      interaction.rect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
    }
    try {
      interaction.stop();
    } catch (e) { }
    if (!interaction.rect) {
      interaction.rect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
    }
  };

  useEffect(() => {
    // Setup interactjs for elements within the SVG - targeting both elements and the background
    const interactable = interact('.page-svg-container svg, .page-svg-container svg *')
      .styleCursor(false) // Prevents interact.js from dynamically setting cursors on hover
      .rectChecker(safeRectChecker)
      .draggable({
        ignoreFrom: '.resize-handle, .text-edit-box, [data-editing="true"]',
        cursorChecker: () => null, // Second layer of prevention just in case
        inertia: false, // Disable inertia for perfect cursor sync
        autoScroll: true,
        listeners: {
          start(event) {
            let target = event.target;

            const container = target.closest('.page-svg-container');
            const canvasContent = container ? container.querySelector('[id^="canvas-content-"]') : null;
            const rootSvg = canvasContent ? canvasContent.querySelector('svg') : null;
            const svgElement = rootSvg || target.ownerSVGElement || (target.tagName.toLowerCase() === 'svg' ? target : null);
            if (!svgElement) return;

            const isEditing = target.closest('[data-editing="true"]') || (document.activeElement && document.activeElement.getAttribute('contenteditable') === 'true');
            // If Ctrl is held, not in selection mode, or node edit mode is active, stop interact.js drag
            if (!['select', 'upload', 'grid'].includes(activeMainToolRef.current) || isEditing || event.ctrlKey || nodeEditModeRef.current) {
              safeStopInteraction(event.interaction);
              return;
            }

            // Prevent drag if clicking on the scrollbar of a scrollable div inside a foreignObject
            if (target.tagName?.toLowerCase() === 'div' && target.closest('foreignObject')) {
              const style = window.getComputedStyle(target);
              const isScrollable = style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll';
              if (isScrollable) {
                const rect = target.getBoundingClientRect();
                const isScrollbarClick = event.clientX > rect.left + target.clientLeft + target.clientWidth ||
                  event.clientY > rect.top + target.clientTop + target.clientHeight;
                if (isScrollbarClick) {
                  safeStopInteraction(event.interaction);
                  return;
                }
              }
            }

            const startPoint = getSvgPoint(svgElement, event.clientX, event.clientY);
            if (!startPoint) {
              safeStopInteraction(event.interaction);
              return;
            }

            // Check if dragging via video-move-handle
            const moveHandle = event.target.closest?.('.video-move-handle');
            if (moveHandle) {
              const dragTargetId = moveHandle.getAttribute('data-drag-target-id');
              const targetEl = dragTargetId ? container?.querySelector(`[id="${dragTargetId}"]`) : null;
              if (targetEl) {
                target = targetEl;
              }
            }

            // 1. Handle "Selection Priority" - if clicking inside the current selection's box, drag it!
            // (Only for normal select mode, direct mode always targets whatever is hit)
            const selectedId = selectedLayerIdRef.current;
            if (selectedId && selectedSelectToolRef.current !== 'direct') {
              const selectedEl = container?.querySelector(`[id="${selectedId}"]`);
              if (selectedEl && selectedEl !== svgElement) {
                if (hitTest(selectedEl, event.clientX, event.clientY, 2)) {
                  target = selectedEl; // Redirect drag to the current selection!
                }
              }
            }

            // Also allow drag if clicking inside ANY multi-selected element (ignored in direct mode)
            if (selectedSelectToolRef.current !== 'direct' && (target === event.target || target.tagName?.toLowerCase() === 'svg')) {
              const multiIds = multiSelectedIdsRef.current;
              if (multiIds.size > 1) {
                let hitElement = false;
                for (const id of multiIds) {
                  const el = container?.querySelector(`[id="${id}"]`);
                  if (el && el !== svgElement) {
                    if (hitTest(el, event.clientX, event.clientY, 2)) {
                      target = el;
                      hitElement = true;
                      break;
                    }
                  }
                }

                if (!hitElement) {
                  const multiPoly = container?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi-selection-bounds') || container?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi');
                  if (multiPoly) {
                    const rect = multiPoly.getBoundingClientRect();
                    if (event.clientX >= rect.left && event.clientX <= rect.right &&
                      event.clientY >= rect.top && event.clientY <= rect.bottom) {
                      const firstEl = container?.querySelector(`[id="${Array.from(multiIds)[0]}"]`);
                      if (firstEl) target = firstEl;
                    }
                  }
                }
              }
            }

            // If background (SVG, Overlay, or Document Shield), stop drag completely
            if (
              target === svgElement ||
              target.getAttribute('data-name') === 'Overlay' ||
              target.getAttribute('data-name') === 'Document Shield' ||
              target.getAttribute('data-type') === 'shield'
            ) {
              safeStopInteraction(event.interaction);
              return;
            }

            let elementToDrag = null;

            if (isConvertedFlipbook) {
              // Converted flipbooks: ONLY allow dragging Free Frames, Hotspots, shapes, or icons
              let candidate = target;
              let validTarget = null;
              while (candidate && candidate !== svgElement) {
                if (candidate.getAttribute) {
                  const isHotspot = candidate.getAttribute('data-is-hotspot') === 'true' || candidate.getAttribute('data-type') === 'hotspot';
                  const isFreeFrame = candidate.getAttribute('data-name') === 'Free Frame';
                  const isShape = candidate.getAttribute('data-type') === 'shape';
                  const isIcon = candidate.getAttribute('data-type') === 'icon';
                  if (isHotspot || isFreeFrame || isShape || isIcon) {
                    validTarget = candidate;
                    break;
                  }
                }
                candidate = candidate.parentElement || candidate.parentNode;
              }

              if (!validTarget || !validTarget.id) {
                safeStopInteraction(event.interaction);
                return;
              }
              elementToDrag = validTarget;
            } else if (selectedSelectToolRef.current === 'direct') {
              const directTarget = getDraggableElement(event.target, svgElement);
              if (directTarget) elementToDrag = directTarget;
            } else {
              // 1. Check current selection first (Selection Priority)
              // Priority: if clicking inside any element already part of the multi-selection, 
              // let's assume the user wants to drag the group (including clicking gaps inside or descendants).
              const currentMultiIds = multiSelectedIdsRef.current;
              if (currentMultiIds.size > 0 && selectedSelectToolRef.current !== 'direct') {
                const entries = Array.from(currentMultiIds);
                for (const id of entries) {
                  const selEl = container?.querySelector(`[id="${id}"]`);
                  if (selEl && selEl !== svgElement) {
                    // Check if we hit the element's bounding box OR one of its descendants
                    let isHit = false;
                    const isMemberHit = target && selEl.contains(target);
                    if (!isMemberHit) {
                      // Only fallback to bbox hitTest if they clicked empty space (SVG/Overlay/BaseFrame),
                      // not another distinct, draggable element sitting on top.
                      const topFrames = getTopLevelFrames(svgElement);
                      const leaf = getDraggableElement(target, svgElement);
                      const isBase = leaf ? topFrames.some(f => f.id === leaf.id) : true;
                      if (isBase || target === svgElement || target.getAttribute('data-name') === 'Overlay') {
                        isHit = hitTest(selEl, event.clientX, event.clientY, 2);
                      }
                    }

                    if (isHit || isMemberHit) {
                      // Only allow dragging if it's NOT the root page-level frame
                      const topFrames = getTopLevelFrames(svgElement);
                      const isMainPageFrame = topFrames.length === 1 && selEl.id === topFrames[0].id;

                      if (!isMainPageFrame) {
                        elementToDrag = selEl;
                        break; // Found it!
                      }
                    }
                  }
                }
              }

              // 2. If nothing selected or selection not hit, find a new candidate
              // 2. Identify candidate from hit-test (Drill-down support)
              if (!elementToDrag) {
                const frameId = currentFrameIdRef.current;
                let context = frameId ? svgElement.querySelector(`[id="${frameId}"]`) : svgElement;

                // Auto-Enter logic for root frames (matching mousedown behavior)
                const topFrames = getTopLevelFrames(svgElement);
                if (!frameId) {
                  const hitFrame = topFrames.find(f => hitTest(f, event.clientX, event.clientY));
                  if (hitFrame) {
                    context = hitFrame;
                    if (setCurrentFrameId) {
                      setCurrentFrameId(hitFrame.id);
                      currentFrameIdRef.current = hitFrame.id;
                    }
                  }
                }

                // Find deepest hit leaf
                const leafTarget = getDraggableElement(event.target, svgElement);
                if (leafTarget) {
                  // Drill UP from leaf to find the child of our active context
                  let candidate = leafTarget;
                  while (candidate.parentNode && candidate.parentNode !== context && candidate.parentNode !== svgElement) {
                    candidate = candidate.parentNode;
                  }

                  // If candidate is an arbitrary group container (not a user-created group or hotspot), prefer leafTarget so user can select & edit individual elements!
                  const isUserGroupCandidate = candidate.tagName?.toLowerCase() === 'g' && (
                    candidate.getAttribute('data-type') === 'group' ||
                    (candidate.getAttribute('data-name') || '').toLowerCase() === 'group' ||
                    candidate.id.startsWith('group-') ||
                    candidate.getAttribute('data-is-hotspot') === 'true' ||
                    candidate.getAttribute('data-type') === 'hotspot'
                  ) && candidate.getAttribute('data-is-image-group') !== 'true' && candidate.getAttribute('data-is-video-group') !== 'true' && candidate.getAttribute('data-is-gif-group') !== 'true';

                  if (!isUserGroupCandidate && leafTarget && leafTarget.id && leafTarget.getAttribute('data-name') !== 'Overlay') {
                    candidate = leafTarget;
                  }

                  // Validate if candidate is draggable (not the base frame background)
                  const isBaseFrame = topFrames.some(f => f.id === candidate.id);
                  if (!isBaseFrame && candidate.id && candidate.getAttribute('data-name') !== 'Overlay') {
                    elementToDrag = candidate;
                  }
                }
              }
            }

            // Safety check for metadata-based 'locked' or 'hidden'
            if (!elementToDrag ||
              elementToDrag.getAttribute('data-hidden') === 'true' ||
              elementToDrag.getAttribute('data-locked') === 'true' ||
              elementToDrag.getAttribute('data-name') === 'Overlay') {
              safeStopInteraction(event.interaction);
              return;
            }

            let allowDrag = true;
            // Block dragging in Interaction/Animation mode UNLESS it's a Free Frame OR a Hotspot
            if ((activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') &&
              elementToDrag.getAttribute('data-name') !== 'Free Frame' &&
              elementToDrag.getAttribute('data-is-hotspot') !== 'true') {
              allowDrag = false;
              safeStopInteraction(event.interaction);
              // We STILL want to allow auto-select to run below, so we don't return here.
            }

            // 2. AUTO-SELECT if not already selected
            const isSelected = (selectedLayerIdRef.current === elementToDrag.id) ||
              (multiSelectedIdsRef.current && multiSelectedIdsRef.current.has(elementToDrag.id));

            if (!isSelected) {
              if (setSelectedLayerId) {
                setSelectedLayerId(elementToDrag.id);
                if (setMultiSelectedIds) setMultiSelectedIds(new Set([elementToDrag.id]));
                // Force update ref so it's visible to subsequent drag steps
                selectedLayerIdRef.current = elementToDrag.id;
                multiSelectedIdsRef.current = new Set([elementToDrag.id]);

                // Visualize selection immediately
                drawOverlayHighlight(elementToDrag, currentFrameIdRef.current && elementToDrag.id !== currentFrameIdRef.current ? 'child-selected' : 'selected');
              }
            }

            // ── Build multi-drag list: all multi-selected elements in the same SVG ──
            const multiIds = multiSelectedIdsRef.current;
            const multiDragItems = [];

            const getLocalPoint = (svgElement, targetNode, clientX, clientY) => {
              if (!svgElement || !targetNode) return null;
              const pt = svgElement.createSVGPoint();
              pt.x = clientX;
              pt.y = clientY;
              try {
                const ctm = targetNode.getScreenCTM();
                if (!ctm) return null;
                return pt.matrixTransform(ctm.inverse());
              } catch (e) {
                return null;
              }
            };

            if (allowDrag) {
              if (multiIds.size > 1) {
                for (const id of multiIds) {
                  const el = container?.querySelector(`[id="${id}"]`);
                  if (el && el !== svgElement &&
                    el.getAttribute('data-hidden') !== 'true' &&
                    el.getAttribute('data-locked') !== 'true') {
                    multiDragItems.push({
                      element: el,
                      initialMatrix: getElementMatrix(el),
                      startPointLocal: getLocalPoint(svgElement, el.parentNode, event.clientX, event.clientY)
                    });
                  }
                }
              }
            }

            event.interaction.dragState = {
              element: elementToDrag,
              startPoint: startPoint,
              startPointLocal: getLocalPoint(svgElement, elementToDrag.parentNode, event.clientX, event.clientY),
              initialMatrix: getElementMatrix(elementToDrag),
              svgElement: svgElement,
              pageIndex: activePageIndex,
              // Multi-drag support
              multiDragItems: multiDragItems.length > 0 ? multiDragItems : null,
              initialClientX: event.clientX,
              initialClientY: event.clientY,
              thresholdMet: false
            };
          },
          move(event) {
            const dragState = event.interaction.dragState;
            if (!dragState) return;

            // ── RE-SYNC: If React re-rendered and the original nodes were detached, ──
            // find the new live nodes in the DOM by their IDs to keep the drag alive.
            const liveSvg = document.querySelector(`.page-svg-container[data-page-index="${dragState.pageIndex}"] [id^="canvas-content-"] > svg`);
            if (dragState.svgElement && !dragState.svgElement.isConnected) {
              if (liveSvg) dragState.svgElement = liveSvg;
            }
            if (dragState.element && !dragState.element.isConnected) {
              const liveEl = liveSvg?.querySelector(`[id="${CSS.escape(dragState.element.id)}"]`) || document.getElementById(dragState.element.id);
              if (liveEl) dragState.element = liveEl;
            }
            if (dragState.multiDragItems) {
              for (const item of dragState.multiDragItems) {
                if (!item.element.isConnected) {
                  const liveEl = liveSvg?.querySelector(`[id="${CSS.escape(item.element.id)}"]`) || document.getElementById(item.element.id);
                  if (liveEl) item.element = liveEl;
                }
              }
            }

            const getLocalPoint = (svgElement, targetNode, clientX, clientY) => {
              if (!svgElement || !targetNode) return null;
              const pt = svgElement.createSVGPoint();
              pt.x = clientX;
              pt.y = clientY;
              try {
                const ctm = targetNode.getScreenCTM();
                if (!ctm) return null;
                return pt.matrixTransform(ctm.inverse());
              } catch (e) {
                return null;
              }
            };

            if (!dragState.thresholdMet) {
              const DRAG_THRESHOLD = 2;
              const dxClient = event.clientX - dragState.initialClientX;
              const dyClient = event.clientY - dragState.initialClientY;
              const distance = Math.sqrt(dxClient * dxClient + dyClient * dyClient);

              if (distance < DRAG_THRESHOLD) {
                return; // Do nothing until threshold is met
              }

              // Threshold crossed!
              dragState.thresholdMet = true;

              // Prevent jumping by resetting start points to current mouse pos
              dragState.startPointLocal = getLocalPoint(dragState.svgElement, dragState.element.parentNode, event.clientX, event.clientY);
              if (dragState.multiDragItems) {
                for (const item of dragState.multiDragItems) {
                  item.startPointLocal = getLocalPoint(dragState.svgElement, item.element.parentNode, event.clientX, event.clientY);
                  item.element.setAttribute('data-dragging', 'true');
                }
              } else {
                dragState.element.setAttribute('data-dragging', 'true');
              }
            }

            const isAltPressedCurrent = (event.altKey || (event.sourceEvent && event.sourceEvent.altKey)) && !nodeEditModeRef.current;
            if (isAltPressedCurrent && !dragState.hasDuplicated) {
              dragState.hasDuplicated = true;

              const newSelectedIds = new Set();
              const generateId = () => `dup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

              const cloneElement = (el) => {
                const clone = el.cloneNode(true);
                clone.id = generateId();
                clone.removeAttribute('data-dragging');
                const elementsWithId = clone.querySelectorAll('[id]');
                elementsWithId.forEach(child => {
                  child.id = generateId();
                });
                return clone;
              };

              if (dragState.multiDragItems) {
                for (const item of dragState.multiDragItems) {
                  item.originalElement = item.element;
                  // Reset original element to initial position
                  item.originalElement.setAttribute('transform', matrixToTransform(item.initialMatrix));
                  item.originalElement.removeAttribute('data-dragging');

                  const clone = cloneElement(item.element);
                  item.element.parentNode.insertBefore(clone, item.element.nextSibling);
                  item.element = clone;
                  item.element.setAttribute('data-dragging', 'true');
                  newSelectedIds.add(clone.id);
                }
                if (setMultiSelectedIds) setMultiSelectedIds(newSelectedIds);
                if (setSelectedLayerId) setSelectedLayerId(Array.from(newSelectedIds)[0]);
                multiSelectedIdsRef.current = newSelectedIds;
                selectedLayerIdRef.current = Array.from(newSelectedIds)[0];
              } else {
                dragState.originalElement = dragState.element;
                // Reset original element to initial position
                dragState.originalElement.setAttribute('transform', matrixToTransform(dragState.initialMatrix));
                dragState.originalElement.removeAttribute('data-dragging');

                const clone = cloneElement(dragState.element);
                dragState.element.parentNode.insertBefore(clone, dragState.element.nextSibling);
                dragState.element = clone;
                dragState.element.setAttribute('data-dragging', 'true');
                newSelectedIds.add(clone.id);
                if (setSelectedLayerId) setSelectedLayerId(clone.id);
                if (setMultiSelectedIds) setMultiSelectedIds(newSelectedIds);
                selectedLayerIdRef.current = clone.id;
                multiSelectedIdsRef.current = newSelectedIds;
              }
            }

            const viewBox = dragState.svgElement?.getAttribute('viewBox');
            const [vX, vY, baseWidth, baseHeight] = viewBox ? viewBox.split(' ').map(Number) : [0, 0, 210, 297];

            if (dragState.multiDragItems) {
              // Move ALL multi-selected elements freely across canvas
              for (const item of dragState.multiDragItems) {
                const currentPointLocal = getLocalPoint(dragState.svgElement, item.element.parentNode, event.clientX, event.clientY);
                if (!currentPointLocal || !item.startPointLocal) continue;

                let dx = currentPointLocal.x - item.startPointLocal.x;
                let dy = currentPointLocal.y - item.startPointLocal.y;

                const translation = new DOMMatrix().translate(dx, dy);
                const nextMatrix = translation.multiply(item.initialMatrix);
                item.element.setAttribute('transform', matrixToTransform(nextMatrix));
              }
              drawMultiSelectionHighlight(multiSelectedIdsRef.current, 'selected');
            } else {
              // Single element drag freely across canvas
              const target = dragState.element;
              const currentPointLocal = getLocalPoint(dragState.svgElement, target.parentNode, event.clientX, event.clientY);
              if (!currentPointLocal || !dragState.startPointLocal) return;

              let dx = currentPointLocal.x - dragState.startPointLocal.x;
              let dy = currentPointLocal.y - dragState.startPointLocal.y;

              const translation = new DOMMatrix().translate(dx, dy);
              const nextMatrix = translation.multiply(dragState.initialMatrix);
              target.setAttribute('transform', matrixToTransform(nextMatrix));
              // dynamically update the outline while dragging
              drawOverlayHighlight(target, currentFrameIdRef.current && target.id !== currentFrameIdRef.current ? 'child-selected' : 'selected');
            }

            if (isAltPressedCurrent && drawMeasurementOverlayRef.current) {
              let targetForMeasurement = null;
              if (dragState.originalElement && dragState.originalElement.id !== dragState.element.id) {
                targetForMeasurement = dragState.originalElement;
              } else if (dragState.multiDragItems && dragState.multiDragItems[0].originalElement && dragState.multiDragItems[0].originalElement.id !== dragState.multiDragItems[0].element.id) {
                targetForMeasurement = dragState.multiDragItems.map(item => item.originalElement);
              }
              if (!targetForMeasurement) {
                targetForMeasurement = (dragState.element.parentElement && dragState.element.parentElement.closest('[data-type="frame"]')) || dragState.svgElement.querySelector('[data-type="background"]');
              }
              drawMeasurementOverlayRef.current(targetForMeasurement, event.clientX, event.clientY, true);
            } else if (document.querySelector('.measurement-overlay-group')) {
              document.querySelectorAll('.measurement-overlay-group').forEach(el => el.remove());
            }

            suppressClickRef.current = true;
          },
          end(event) {
            const dragState = event.interaction.dragState;
            if (!dragState) return;

            if (!dragState.thresholdMet) {
              delete event.interaction.dragState;
              return;
            }

            const viewBox = dragState.svgElement.getAttribute('viewBox');
            const [vX, vY, baseWidth, baseHeight] = viewBox ? viewBox.split(' ').map(Number) : [0, 0, 210, 297];

            const finalizeEnd = () => {
              if (suppressClickRef.current && updatePageHtml) {
                const container = dragState.element.closest('.page-svg-container');
                const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : dragState.pageIndex;
                saveModifiedPageHtml(pageIdx, dragState.svgElement);
              }

              setTimeout(() => {
                suppressClickRef.current = false;
              }, 50);

              const svgEl = dragState.svgElement;
              const pageIndex = dragState.pageIndex;
              delete event.interaction.dragState;

              if (updatePageHtmlRef.current && svgEl) {
                updatePageHtmlRef.current(pageIndex, svgEl.outerHTML);
              }
            };

            const constrainElement = (el, onComplete) => {
              if (!el || typeof el.getBBox !== 'function') return false;

              let ctm, rootCtm, parentCtm;
              try {
                ctm = el.getScreenCTM();
                rootCtm = dragState.svgElement.getScreenCTM();
                parentCtm = el.parentNode.getScreenCTM();
              } catch (e) {
                return false;
              }
              if (!ctm || !rootCtm || !parentCtm) return false;
              const bbox = getVisualBBox(el);
              const localToRoot = rootCtm.inverse().multiply(ctm);

              const pt1 = new DOMPoint(bbox.x, bbox.y).matrixTransform(localToRoot);
              const pt2 = new DOMPoint(bbox.x + bbox.width, bbox.y).matrixTransform(localToRoot);
              const pt3 = new DOMPoint(bbox.x + bbox.width, bbox.y + bbox.height).matrixTransform(localToRoot);
              const pt4 = new DOMPoint(bbox.x, bbox.y + bbox.height).matrixTransform(localToRoot);

              const minX = Math.min(pt1.x, pt2.x, pt3.x, pt4.x);
              const maxX = Math.max(pt1.x, pt2.x, pt3.x, pt4.x);
              const minY = Math.min(pt1.y, pt2.y, pt3.y, pt4.y);
              const maxY = Math.max(pt1.y, pt2.y, pt3.y, pt4.y);

              const bounds = getCanvasBounds(dragState.svgElement, baseWidth, baseHeight);
              const MARGIN_MM = 10;

              let dx_root = 0;
              let dy_root = 0;

              if (minX < bounds.minX) dx_root = (bounds.minX + MARGIN_MM) - minX;
              else if (maxX > bounds.maxX) dx_root = (bounds.maxX - MARGIN_MM) - maxX;

              if (minY < bounds.minY) dy_root = (bounds.minY + MARGIN_MM) - minY;
              else if (maxY > bounds.maxY) dy_root = (bounds.maxY - MARGIN_MM) - maxY;

              if (dx_root !== 0 || dy_root !== 0) {
                const rootToParent = parentCtm.inverse().multiply(rootCtm);
                const p0 = new DOMPoint(0, 0).matrixTransform(rootToParent);
                const p1 = new DOMPoint(dx_root, dy_root).matrixTransform(rootToParent);

                const dx = p1.x - p0.x;
                const dy = p1.y - p0.y;

                const matrix = getElementMatrix(el);
                const startE = matrix.e;
                const startF = matrix.f;
                const translation = new DOMMatrix().translate(dx, dy);
                const endMatrix = translation.multiply(matrix);
                const endE = endMatrix.e;
                const endF = endMatrix.f;

                const duration = 200;
                const startTime = performance.now();
                const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

                const animate = (currentTime) => {
                  const elapsed = currentTime - startTime;
                  const progress = Math.min(elapsed / duration, 1);
                  const eased = easeOutQuart(progress);

                  matrix.e = startE + (endE - startE) * eased;
                  matrix.f = startF + (endF - startF) * eased;

                  el.setAttribute('transform', matrixToTransform(matrix));
                  drawOverlayHighlight(el, currentFrameIdRef.current && el.id !== currentFrameIdRef.current ? 'child-selected' : 'selected');

                  if (progress < 1) {
                    requestAnimationFrame(animate);
                  } else {
                    onComplete();
                  }
                };

                requestAnimationFrame(animate);
                return true;
              }
              return false;
            };

            if (dragState.multiDragItems) {
              let activeAnimations = 0;
              let hasAnimation = false;
              for (const item of dragState.multiDragItems) {
                item.element.removeAttribute('data-dragging');
                const isAnimating = constrainElement(item.element, () => {
                  activeAnimations--;
                  if (activeAnimations === 0) finalizeEnd();
                });
                if (isAnimating) {
                  activeAnimations++;
                  hasAnimation = true;
                }
              }
              if (!hasAnimation) finalizeEnd();
            } else {
              dragState.element.removeAttribute('data-dragging');
              const hasAnimation = constrainElement(dragState.element, finalizeEnd);
              if (!hasAnimation) finalizeEnd();
            }
          }
        }
      });

    return () => {
      interactable.unset();
    };
  }, [zoom, activePageIndex]); // No longer depends on frequently changing callbacks

  useEffect(() => {
    const interactable = interact('.resize-handle')
      .styleCursor(false)
      .rectChecker(safeRectChecker)
      .draggable({
        cursorChecker: () => null,
        listeners: {
          start(event) {
            suppressClickRef.current = true;
            const handle = event.target;
            const handleId = handle.id;
            const match = handleId.match(/resize-handle-(.+)-(nw|ne|se|sw|n|e|s|w|linestart|lineend)/);
            if (!match) return;

            const elId = match[1];
            const dir = match[2];

            // Resolve target element scoped to active page container and canvas SVG
            const pageContainer = handle.closest('.page-svg-container');
            const canvasContent = pageContainer?.querySelector('[id^="canvas-content-"]');
            const canvasSvg = canvasContent?.querySelector('svg') || pageContainer?.querySelector('svg:not([id^="highlight-overlay-"])');

            let el = null;
            if (canvasSvg) {
              try {
                el = canvasSvg.querySelector(`[id="${CSS.escape(elId)}"]`);
              } catch (_) {
                el = canvasSvg.querySelector(`[id="${elId}"]`);
              }
            }
            if (!el && pageContainer) {
              try {
                el = pageContainer.querySelector(`[id="${CSS.escape(elId)}"]`);
              } catch (_) {
                el = pageContainer.querySelector(`[id="${elId}"]`);
              }
            }
            if (!el) {
              el = document.getElementById(elId);
            }

            // If grabbing the multi-selection bounding box handles, force into multi path.
            // (The dummy <rect id="multi-selection-bounds"> lives in the overlay SVG, so
            //  getElementById() finds it — but we must NOT treat it as a real canvas element.)
            if (el && (elId === 'multi' || elId === 'multi-selection-bounds') && multiSelectedIdsRef.current.size > 1) {
              el = null;
            }

            let isMulti = false;
            let multiIds = [];
            let bbox = null;
            let matrix = new DOMMatrix();

            const resolveChild = (id) => {
              if (canvasSvg) {
                try {
                  const c = canvasSvg.querySelector(`[id="${CSS.escape(id)}"]`);
                  if (c) return c;
                } catch (_) {}
              }
              if (pageContainer) {
                try {
                  const c = pageContainer.querySelector(`[id="${CSS.escape(id)}"]`);
                  if (c) return c;
                } catch (_) {}
              }
              return document.getElementById(id);
            };

            if (!el) {
              if ((elId === 'multi' || elId === 'multi-selection-bounds') && multiSelectedIdsRef.current.size > 1) {
                isMulti = true;
                multiIds = Array.from(multiSelectedIdsRef.current);

                const childrenList = multiIds.map(resolveChild).filter(Boolean);
                if (childrenList.length === 0) return;

                const activeCanvasSvg = childrenList[0].ownerSVGElement || canvasSvg;
                if (!activeCanvasSvg) return;
                const svgRootCTM = activeCanvasSvg.getScreenCTM();
                if (!svgRootCTM) return;
                const svgRootInv = svgRootCTM.inverse();

                // Helper: convert a child's local bbox corner to SVG root space
                const childLocalToSvgRoot = (child, px, py) => {
                  const childCTM = child.getScreenCTM();
                  if (!childCTM) return { x: px, y: py };
                  // screen = childCTM * local, svgRoot = svgRootInv * screen
                  return new DOMPoint(px, py).matrixTransform(childCTM).matrixTransform(svgRootInv);
                };

                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                childrenList.forEach(child => {
                  const cb = getVisualBBox(child);
                  const p1 = childLocalToSvgRoot(child, cb.x, cb.y);
                  const p2 = childLocalToSvgRoot(child, cb.x + cb.width, cb.y);
                  const p3 = childLocalToSvgRoot(child, cb.x, cb.y + cb.height);
                  const p4 = childLocalToSvgRoot(child, cb.x + cb.width, cb.y + cb.height);
                  minX = Math.min(minX, p1.x, p2.x, p3.x, p4.x);
                  maxX = Math.max(maxX, p1.x, p2.x, p3.x, p4.x);
                  minY = Math.min(minY, p1.y, p2.y, p3.y, p4.y);
                  maxY = Math.max(maxY, p1.y, p2.y, p3.y, p4.y);
                });

                bbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
                matrix = new DOMMatrix();

                el = {
                  id: 'multi-selection-bounds',
                  tagName: 'multi',
                  getAttribute: () => null,
                  getScreenCTM: () => activeCanvasSvg.getScreenCTM(),
                  parentNode: activeCanvasSvg,
                  ownerSVGElement: activeCanvasSvg,
                  _svgRootInv: svgRootInv,
                  _childLocalToSvgRoot: childLocalToSvgRoot
                };
              } else {
                return;
              }
            } else {
              const parentCtm = el.parentNode ? el.parentNode.getScreenCTM() : null;
              const ctm = el.getScreenCTM();
              if (parentCtm && ctm) {
                matrix = parentCtm.inverse().multiply(ctm);
              } else {
                matrix = getElementMatrix(el);
              }
              bbox = getVisualBBox(el);
              if (el.getAttribute('data-is-hotspot') === 'true' && el.querySelector('rect') && (el.querySelector('text') || el.querySelector('[data-type="text"]'))) {
                const rc = el.querySelector('rect');
                const rw = parseFloat(rc.getAttribute('width')) || 0;
                const rh = parseFloat(rc.getAttribute('height')) || 0;
                const rx = parseFloat(rc.getAttribute('x') || '0');
                const ry = parseFloat(rc.getAttribute('y') || '0');
                if (rw > 0 && rh > 0) {
                  bbox = { x: rx, y: ry, width: rw, height: rh };
                }
              }
            }

            const svg = el.ownerSVGElement || canvasSvg;
            const parentCtmForStart = el.parentNode ? el.parentNode.getScreenCTM() : svg?.getScreenCTM();
            let startPoint = null;
            if (parentCtmForStart && svg) {
              const pt = svg.createSVGPoint();
              pt.x = event.clientX;
              pt.y = event.clientY;
              startPoint = pt.matrixTransform(parentCtmForStart.inverse());
            } else {
              startPoint = getSvgPoint(svg, event.clientX, event.clientY);
            }

            // ── CONVERT <text> TO <foreignObject> ON RESIZE START ──
            if (!isMulti && el.tagName.toLowerCase() === 'text') {
              const fo = convertTextToForeignObject(el);
              if (fo) {
                el.replaceWith(fo);
                el = fo;
              }
            }

            // Lock cursor globally while dragging to prevent flicker
            const currentCursor = window.getComputedStyle(handle).cursor;
            document.documentElement.style.setProperty('--resizing-cursor', currentCursor);
            document.body.style.cursor = currentCursor;
            document.body.classList.add('resizing-active');

            // Define anchor point in local space (opposite point)
            let localAnchor;
            if (dir === 'se') localAnchor = { x: bbox.x, y: bbox.y };
            else if (dir === 'sw') localAnchor = { x: bbox.x + bbox.width, y: bbox.y };
            else if (dir === 'ne') localAnchor = { x: bbox.x, y: bbox.y + bbox.height };
            else if (dir === 'nw') localAnchor = { x: bbox.x + bbox.width, y: bbox.y + bbox.height };
            else if (dir === 'n') localAnchor = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height };
            else if (dir === 's') localAnchor = { x: bbox.x + bbox.width / 2, y: bbox.y };
            else if (dir === 'e') localAnchor = { x: bbox.x, y: bbox.y + bbox.height / 2 };
            else if (dir === 'w') localAnchor = { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2 };
            else if (dir === 'linestart' || dir === 'lineend') localAnchor = { x: bbox.x, y: bbox.y };

            const worldAnchor = new DOMPoint(localAnchor.x, localAnchor.y).matrixTransform(matrix);

            const isImageOrGroup = !!(
              el.tagName?.toLowerCase() === 'image' ||
              el.getAttribute('data-type') === 'image' ||
              el.getAttribute('data-is-image-group') === 'true' ||
              (el.getAttribute('data-name') || '').toLowerCase().includes('image') ||
              (el.tagName?.toLowerCase() === 'g' && el.querySelector('image, video, img, foreignObject'))
            );



            let childrenData = null;
            const isGroupOrImageEl = isMulti || (el.tagName && (
              el.tagName.toLowerCase() === 'g' ||
              el.tagName.toLowerCase() === 'image' ||
              el.tagName.toLowerCase() === 'svg' ||
              el.getAttribute('data-type') === 'image' ||
              el.getAttribute('data-type') === 'video' ||
              el.getAttribute('data-type') === 'gif'
            ));
            if (isGroupOrImageEl) {
              const childrenList = isMulti ? multiIds.map(resolveChild).filter(Boolean) : (el.tagName.toLowerCase() === 'g' && el.children.length > 0 ? Array.from(el.children) : [el]);
              const childLocalToSvgRoot = el._childLocalToSvgRoot;
              childrenData = childrenList.map(child => {
                let cb = getVisualBBox(child);
                if ((child.tagName?.toLowerCase() === 'svg' || child.tagName?.toLowerCase() === 'image' || child.tagName?.toLowerCase() === 'rect') && el.getAttribute('data-is-hotspot') === 'true') {
                  cb = {
                    x: parseFloat(child.getAttribute('x') || '0'),
                    y: parseFloat(child.getAttribute('y') || '0'),
                    width: parseFloat(child.getAttribute('width') || child.viewBox?.baseVal?.width || '48'),
                    height: parseFloat(child.getAttribute('height') || child.viewBox?.baseVal?.height || '48')
                  };
                }
                const cMatrix = getElementMatrix(child);

                let minX, maxX, minY, maxY;
                if (isMulti && childLocalToSvgRoot) {
                  // For multi-selection: convert to SVG root space via getScreenCTM
                  const p1 = childLocalToSvgRoot(child, cb.x, cb.y);
                  const p2 = childLocalToSvgRoot(child, cb.x + cb.width, cb.y);
                  const p3 = childLocalToSvgRoot(child, cb.x, cb.y + cb.height);
                  const p4 = childLocalToSvgRoot(child, cb.x + cb.width, cb.y + cb.height);
                  minX = Math.min(p1.x, p2.x, p3.x, p4.x);
                  maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
                  minY = Math.min(p1.y, p2.y, p3.y, p4.y);
                  maxY = Math.max(p1.y, p2.y, p3.y, p4.y);
                } else {
                  // For single-element groups: use element's own matrix (parent-local space)
                  const p1 = new DOMPoint(cb.x, cb.y).matrixTransform(cMatrix);
                  const p2 = new DOMPoint(cb.x + cb.width, cb.y).matrixTransform(cMatrix);
                  const p3 = new DOMPoint(cb.x, cb.y + cb.height).matrixTransform(cMatrix);
                  const p4 = new DOMPoint(cb.x + cb.width, cb.y + cb.height).matrixTransform(cMatrix);
                  minX = Math.min(p1.x, p2.x, p3.x, p4.x);
                  maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
                  minY = Math.min(p1.y, p2.y, p3.y, p4.y);
                  maxY = Math.max(p1.y, p2.y, p3.y, p4.y);
                }
                const bound = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

                const fracX = (bbox.width - bound.width) <= 0.001 ? 0.5 : (bound.x - bbox.x) / (bbox.width - bound.width);
                const fracY = (bbox.height - bound.height) <= 0.001 ? 0.5 : (bound.y - bbox.y) / (bbox.height - bound.height);

                const childVb = child.getAttribute('viewBox');
                let vbX = 0, vbY = 0;
                if (childVb) {
                  const parts = childVb.split(/[\s,]+/).map(parseFloat);
                  if (parts.length === 4) { vbX = parts[0]; vbY = parts[1]; }
                }

                let initialFontSize = null;
                if (child.tagName?.toLowerCase() === 'text' || child.getAttribute('data-type') === 'text') {
                  initialFontSize = parseFloat(child.getAttribute('font-size') || child.style?.fontSize || '14');
                  child.setAttribute('data-base-font-size', initialFontSize);
                }
                let initialRect = null;
                if (child.tagName?.toLowerCase() === 'rect') {
                  initialRect = {
                    x: parseFloat(child.getAttribute('x') || '0'),
                    y: parseFloat(child.getAttribute('y') || '0'),
                    width: parseFloat(child.getAttribute('width') || '80'),
                    height: parseFloat(child.getAttribute('height') || '32'),
                    rx: parseFloat(child.getAttribute('rx') || '4')
                  };
                  child.setAttribute('data-base-rx', initialRect.rx);
                }

                return { child, initialMatrix: cMatrix, bound, fracX, fracY, initialVbX: vbX, initialVbY: vbY, initialFontSize, initialRect };
              });
            }

            // Store initial image child state for crop-on-resize
            const isImageGroupResize = (
              el.tagName?.toLowerCase() === 'g' ||
              el.tagName?.toLowerCase() === 'image' ||
              el.tagName?.toLowerCase() === 'svg' ||
              el.getAttribute('data-type') === 'image' ||
              el.getAttribute('data-type') === 'video' ||
              el.getAttribute('data-type') === 'gif'
            ) && ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].includes(dir);

            let initialImgState = null;
            if (isImageGroupResize) {
              const imgEl = el.querySelector('image, video, img, foreignObject') || (['image', 'video', 'svg'].includes(el.tagName?.toLowerCase()) ? el : null);
              let natW = 0, natH = 0;
              if (imgEl) {
                const href = imgEl.getAttribute('href') || imgEl.getAttribute('xlink:href') || imgEl.src;
                if (href) {
                  const temp = new Image();
                  temp.src = href;
                  natW = temp.naturalWidth;
                  natH = temp.naturalHeight;
                }
                initialImgState = {
                  x: parseFloat(imgEl.getAttribute('x') || '0'),
                  y: parseFloat(imgEl.getAttribute('y') || '0'),
                  w: parseFloat(imgEl.getAttribute('width') || '0'),
                  h: parseFloat(imgEl.getAttribute('height') || '0'),
                  natW,
                  natH
                };
              }
            }

            let initialCrop = {};
            try {
              const cropStr = el.getAttribute('data-crop-data');
              if (cropStr && cropStr !== 'null') {
                initialCrop = JSON.parse(cropStr);
              }
            } catch (e) { }

            const initialObjectFit = el.getAttribute('data-object-fit') || 'Fit';

            event.interaction.resizeState = {
              el,
              dir,
              matrix,
              bbox,
              worldAnchor,
              localAnchor,
              startPoint,
              svg,
              childrenData,
              isImageGroupResize,
              initialImgState,
              initialCrop,
              initialObjectFit,
              cropInitialized: false,
              cursor: currentCursor // Store for reinforcement
            };
          },
          move(event) {
            const state = event.interaction.resizeState;
            if (!state) return;

            // Reinforce cursor during move to prevent flicker from other handlers or React re-renders
            if (state.cursor && document.body.style.cursor !== state.cursor) {
              document.body.style.cursor = state.cursor;
              document.documentElement.style.setProperty('--resizing-cursor', state.cursor);
              if (!document.body.classList.contains('resizing-active')) {
                document.body.classList.add('resizing-active');
              }
            }

            const { el, bbox, worldAnchor, matrix, dir } = state;

            const parentCTM = el.parentNode ? el.parentNode.getScreenCTM() : state.svg.getScreenCTM();
            if (!parentCTM) return;
            const pt = state.svg.createSVGPoint();
            pt.x = event.clientX;
            pt.y = event.clientY;
            const currentPoint = pt.matrixTransform(parentCTM.inverse());

            if (dir === 'linestart' || dir === 'lineend') {
              const invMatrix = matrix.inverse();

              // Safely convert to DOMPoint before matrixTransform to avoid SVGPoint crash!
              const safePoint = new DOMPoint(currentPoint.x, currentPoint.y);
              const localPt = safePoint.matrixTransform(invMatrix);

              let finalLocalPt = localPt;

              if (event.shiftKey) {
                const anchorX = parseFloat(el.getAttribute(dir === 'linestart' ? 'x2' : 'x1')) || 0;
                const anchorY = parseFloat(el.getAttribute(dir === 'linestart' ? 'y2' : 'y1')) || 0;

                const dx = localPt.x - anchorX;
                const dy = localPt.y - anchorY;

                const angle = Math.atan2(dy, dx);
                const snapAngle = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);

                finalLocalPt = {
                  x: anchorX + dist * Math.cos(snapAngle),
                  y: anchorY + dist * Math.sin(snapAngle)
                };
              }

              if (dir === 'linestart') {
                el.style.removeProperty('x1');
                el.style.removeProperty('y1');
                el.setAttribute('x1', finalLocalPt.x);
                el.setAttribute('y1', finalLocalPt.y);
                if (el.x1) el.x1.baseVal.value = finalLocalPt.x;
                if (el.y1) el.y1.baseVal.value = finalLocalPt.y;
              } else {
                el.style.removeProperty('x2');
                el.style.removeProperty('y2');
                el.setAttribute('x2', finalLocalPt.x);
                el.setAttribute('y2', finalLocalPt.y);
                if (el.x2) el.x2.baseVal.value = finalLocalPt.x;
                if (el.y2) el.y2.baseVal.value = finalLocalPt.y;
              }

              if (typeof drawOverlayHighlight === 'function') {
                drawOverlayHighlight(el, 'selected');
              }
              return;
            }

            // Vector from anchor to current cursor position
            const vCurrent = { x: currentPoint.x - worldAnchor.x, y: currentPoint.y - worldAnchor.y };

            // Vector from anchor to original handle position in world space
            let localHandle;
            if (dir === 'se') localHandle = { x: bbox.x + bbox.width, y: bbox.y + bbox.height };
            else if (dir === 'sw') localHandle = { x: bbox.x, y: bbox.y + bbox.height };
            else if (dir === 'ne') localHandle = { x: bbox.x + bbox.width, y: bbox.y };
            else if (dir === 'nw') localHandle = { x: bbox.x, y: bbox.y };
            else if (dir === 'n') localHandle = { x: bbox.x + bbox.width / 2, y: bbox.y };
            else if (dir === 's') localHandle = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height };
            else if (dir === 'e') localHandle = { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2 };
            else if (dir === 'w') localHandle = { x: bbox.x, y: bbox.y + bbox.height / 2 };

            const worldHandle = new DOMPoint(localHandle.x, localHandle.y).matrixTransform(matrix);
            const vOriginal = { x: worldHandle.x - worldAnchor.x, y: worldHandle.y - worldAnchor.y };

            // Transform vectors to local space of the element (ignoring its translation component)
            const invMatrix = matrix.inverse();
            invMatrix.e = 0; invMatrix.f = 0;

            const vCurrentLocal = new DOMPoint(vCurrent.x, vCurrent.y).matrixTransform(invMatrix);
            const vOriginalLocal = new DOMPoint(vOriginal.x, vOriginal.y).matrixTransform(invMatrix);

            let scaleX = Math.abs(vOriginalLocal.x) < 0.1 ? 1 : vCurrentLocal.x / vOriginalLocal.x;
            let scaleY = Math.abs(vOriginalLocal.y) < 0.1 ? 1 : vCurrentLocal.y / vOriginalLocal.y;

            // Constrain scaling for side handles
            if (dir === 'n' || dir === 's') scaleX = 1;
            if (dir === 'e' || dir === 'w') scaleY = 1;

            // Maintain Aspect Ratio for images, text, or if Shift key is held (only for corners, but force for text on all handles to prevent distortion)
            const isUserGroupResize = (el.getAttribute('data-type') === 'group' || (el.getAttribute('data-name') || '').toLowerCase() === 'group' || (el.id || '').startsWith('group-')) && el.getAttribute('data-is-image-group') !== 'true' && el.getAttribute('data-is-gif-group') !== 'true' && el.getAttribute('data-is-video-group') !== 'true';
            const childImage = (!isUserGroupResize && el.tagName?.toLowerCase() === 'g') ? el.querySelector('image, img') : null;
            const src = el.getAttribute('href') || el.getAttribute('xlink:href') || el.getAttribute('src') || (childImage ? (childImage.getAttribute('href') || childImage.getAttribute('xlink:href') || childImage.getAttribute('src')) : '') || '';
            const isGif = el.getAttribute('data-type') === 'gif' || el.getAttribute('data-is-gif-group') === 'true' || el.dataset?.mediaType === 'gif' || src.split('?')[0].toLowerCase().endsWith('.gif') || src.toLowerCase().startsWith('data:image/gif') || (el.getAttribute('data-name') || '').toLowerCase().includes('gif') || (el.id || '').toLowerCase().includes('gif');
            const isImage = !isUserGroupResize && (el.getAttribute('data-type') === 'image' || el.tagName?.toLowerCase() === 'image' || el.getAttribute('data-type') === 'video' || el.getAttribute('data-type') === 'gif' || el.getAttribute('data-is-image-group') === 'true' || el.getAttribute('data-is-gif-group') === 'true' || isGif || (el.getAttribute('data-name') || '').toLowerCase().includes('image') || !!childImage);
            const isElementInCropMode = el.getAttribute?.('data-object-fit') === 'Crop' || el.hasAttribute?.('data-effect-crop-inset') || (el.getAttribute?.('data-crop-data') && el.getAttribute?.('data-crop-data') !== 'null');
            const isScaledImage = isImage && !isElementInCropMode;
            const isText = el.getAttribute('data-type') === 'text' || el.tagName?.toLowerCase() === 'text';
            const isForeignObject = el.tagName?.toLowerCase() === 'foreignobject';
            const isHotspotIconGroup = el.getAttribute('data-is-hotspot') === 'true' && (el.tagName?.toLowerCase() === 'g' || el.tagName?.toLowerCase() === 'svg');
            const isGroup = (el.tagName?.toLowerCase() === 'g' || el.tagName === 'multi') && el.getAttribute('data-is-hotspot') !== 'true';
            const isFreeFrame = (el.getAttribute('data-name') === 'Free Frame' && el.tagName?.toLowerCase() === 'rect') || isForeignObject;
            const isShape = (['path', 'polygon', 'circle', 'ellipse', 'rect', 'polyline', 'line'].includes(el.tagName?.toLowerCase()) || isGroup) && !isFreeFrame && !isForeignObject;
            const isCorner = ['nw', 'ne', 'se', 'sw'].includes(dir);
            const isCtrlPressedMove = event.ctrlKey || (event.sourceEvent && event.sourceEvent.ctrlKey) || isCtrlPressedRef.current;

            const isHotspot = el.getAttribute('data-is-hotspot') === 'true';
            const isInteractiveButton = (isHotspot || el.getAttribute('data-type') === 'button') && state.childrenData && state.childrenData.some(c => c.child.tagName.toLowerCase() === 'rect') && state.childrenData.some(c => c.child.tagName.toLowerCase() === 'text' || c.child.getAttribute('data-type') === 'text');
            const isHotspotPreset = isHotspot && !isInteractiveButton;

            const isInteractiveUniform = isInteractiveButton && (dir === 'n' || dir === 's');

            if (isInteractiveButton) {
              if (isCorner) {
                // Diagonal projection for smooth, natural scaling up and down
                const dot = vCurrentLocal.x * vOriginalLocal.x + vCurrentLocal.y * vOriginalLocal.y;
                const origLenSq = vOriginalLocal.x * vOriginalLocal.x + vOriginalLocal.y * vOriginalLocal.y;
                let s = origLenSq > 0 ? (dot / origLenSq) : ((scaleX + scaleY) / 2);
                const minS = bbox.height > 0 ? (12 / bbox.height) : 0.1;
                if (s < minS) s = minS;
                scaleX = s;
                scaleY = s;
              } else if (dir === 'e' || dir === 'w') {
                const minScaleX = bbox.width > 0 ? (20 / bbox.width) : 0.1;
                if (scaleX < minScaleX) scaleX = minScaleX;
                scaleY = 1;
              } else if (dir === 'n' || dir === 's') {
                const minScaleY = bbox.height > 0 ? (12 / bbox.height) : 0.1;
                if (scaleY < minScaleY) scaleY = minScaleY;
                scaleX = scaleY;
              }
            }

            if (event.shiftKey) {
              let targetRatio = null;
              if (el.hasAttribute('data-original-aspect-ratio') && !isElementInCropMode) {
                targetRatio = parseFloat(el.getAttribute('data-original-aspect-ratio'));
              } else {
                const shapeName = el.getAttribute('data-name') || '';
                if ((shapeName.toLowerCase().includes('circle') || shapeName.toLowerCase().includes('square')) && !isImage) {
                  targetRatio = 1;
                } else if (bbox.height > 0) {
                  targetRatio = bbox.width / bbox.height;
                } else {
                  targetRatio = 1;
                }
              }

              if (targetRatio && targetRatio > 0 && bbox.width > 0 && bbox.height > 0) {
                const startA = matrix.a || 1;
                const startD = matrix.d || 1;

                if (isCorner) {
                  const fw_x = bbox.width * Math.abs(startA * scaleX);
                  const fh_x = fw_x / targetRatio;

                  const fh_y = bbox.height * Math.abs(startD * scaleY);
                  const fw_y = fh_y * targetRatio;

                  if (fw_x > fw_y) {
                    scaleY = (fh_x / (bbox.height * Math.abs(startD))) * (Math.sign(scaleY) || 1);
                  } else {
                    scaleX = (fw_y / (bbox.width * Math.abs(startA))) * (Math.sign(scaleX) || 1);
                  }
                } else {
                  if (dir === 'n' || dir === 's') {
                    const fh = bbox.height * Math.abs(startD * scaleY);
                    const fw = fh * targetRatio;
                    scaleX = (fw / (bbox.width * Math.abs(startA))) * (Math.sign(scaleX) || 1);
                  } else {
                    const fw = bbox.width * Math.abs(startA * scaleX);
                    const fh = fw / targetRatio;
                    scaleY = (fh / (bbox.height * Math.abs(startD))) * (Math.sign(scaleY) || 1);
                  }
                }
              }
            } else if (!isInteractiveButton && ((isCorner && (isScaledImage || isShape || isHotspotPreset || (isText && !isForeignObject))) || (!isCorner && ((isText && !isForeignObject) || isHotspotPreset)))) {
              const s = Math.max(Math.abs(scaleX), Math.abs(scaleY)) * (Math.sign(scaleX) || 1);
              if (!isCorner && ((isText && !isForeignObject) || isHotspotPreset)) {
                const sSide = (dir === 'n' || dir === 's') ? scaleY : scaleX;
                scaleX = sSide;
                scaleY = sSide;
              } else {
                scaleX = s;
                scaleY = s * (Math.sign(scaleY) / Math.sign(scaleX) || 1);
              }
            }


            if (isFreeFrame || isGroup || isHotspotIconGroup || isShape) {
              const newLocalX = state.localAnchor.x + (bbox.x - state.localAnchor.x) * scaleX;
              const newLocalY = state.localAnchor.y + (bbox.y - state.localAnchor.y) * scaleY;
              const newLocalRight = state.localAnchor.x + ((bbox.x + bbox.width) - state.localAnchor.x) * scaleX;
              const newLocalBottom = state.localAnchor.y + ((bbox.y + bbox.height) - state.localAnchor.y) * scaleY;

              const finalX = Math.min(newLocalX, newLocalRight);
              const finalY = Math.min(newLocalY, newLocalBottom);
              const finalWidth = Math.max(0, Math.abs(newLocalRight - newLocalX));
              const finalHeight = Math.max(0, Math.abs(newLocalBottom - newLocalY));

              if (isFreeFrame && !isHotspotIconGroup) {
                let adjustedHeight = finalHeight;
                let adjustedWidth = finalWidth;
                let adjustedX = finalX;
                let adjustedY = finalY;

                const isVideoFo = el.getAttribute('data-type') === 'video' || !!el.querySelector('video, iframe');

                if (el.tagName?.toLowerCase() === 'foreignobject' && !isVideoFo && el.firstElementChild) {
                  const isScrollable = el.getAttribute('data-scrollable') === 'true';
                  const div = el.firstElementChild;

                  // Enable reflow when resizing any handle manually
                  if (dir) {
                    el.setAttribute('data-resized', 'true');
                    div.style.whiteSpace = 'pre-wrap';
                  }

                  // Update the sizing mode to reflect manual user overrides so TextEditor respects them
                  if (el.getAttribute('data-type') === 'text') {
                    const currentMode = el.getAttribute('data-sizing-mode');
                    if (currentMode === 'fixed') {
                      if (!isScrollable) {
                        div.style.setProperty('overflow', 'visible', 'important');
                      }
                      div.style.setProperty('width', '100%', 'important');
                      div.style.setProperty('height', '100%', 'important');
                    } else {
                      if (dir === 'e' || dir === 'w' || dir === 'n' || dir === 's') {
                        el.setAttribute('data-sizing-mode', 'auto-height');
                        el.setAttribute('data-auto-wrap', 'true');
                        // Scrolling is only allowed in 'fixed' mode, so disable it when switching to auto-height
                        if (isScrollable) {
                          el.setAttribute('data-scrollable', 'false');
                          div.classList.remove('flipbook-text-scrollbar');
                          div.style.setProperty('overflow', 'visible', 'important');
                        }
                      } else if (['nw', 'ne', 'sw', 'se'].includes(dir)) {
                        el.setAttribute('data-sizing-mode', 'fixed');
                        el.setAttribute('data-auto-wrap', 'true');
                        if (!isScrollable) {
                          div.style.setProperty('overflow', 'visible', 'important');
                        }
                        div.style.setProperty('width', '100%', 'important');
                        div.style.setProperty('height', '100%', 'important');
                      }
                    }
                  }

                  const oldHeight = div.style.height;
                  const oldMinHeight = div.style.minHeight;

                  // Temporarily allow height to shrink to measure true text height
                  div.style.setProperty('height', 'auto', 'important');
                  div.style.setProperty('min-height', '0px', 'important');

                  if (!isScrollable) {
                    if (dir === 'e' || dir === 'w') {
                      // Resize width -> Auto height (Can shrink)
                      adjustedHeight = Math.max(10, div.scrollHeight + 4);
                    } else if ((dir === 'n' || dir === 's') && el.getAttribute('data-sizing-mode') !== 'fixed') {
                      // Resize height -> adjust width to match new height, keeping text inside
                      let minW = 10;
                      let maxW = 3000;
                      let bestW = finalWidth;

                      for (let i = 0; i < 12; i++) {
                        let midW = (minW + maxW) / 2;
                        el.setAttribute('width', midW);
                        if (div.scrollHeight + 4 <= finalHeight) {
                          bestW = midW;
                          maxW = midW - 1; // Try to find a tighter fit
                        } else {
                          minW = midW + 1; // Need more width
                        }
                      }
                      adjustedWidth = bestW;
                      el.setAttribute('width', adjustedWidth);
                      adjustedHeight = div.scrollHeight + 4;
                    } else {
                      // Corners or fixed mode -> Fixed size, respect final height exactly so clipping/scrolling works
                      adjustedHeight = finalHeight;
                    }
                  } else {
                    // Scrollable text boxes CAN hide content. We respect the user's manual sizing exactly.
                    // No auto-height adjustments here.
                  }

                  div.style.setProperty('height', oldHeight || '100%', 'important');
                  div.style.setProperty('min-height', oldMinHeight || '100%', 'important');

                  // Adjust coordinates to respect the handle anchor
                  if (dir === 'w' || dir === 'nw' || dir === 'sw') {
                    adjustedX = (finalX + finalWidth) - adjustedWidth;
                  } else if (dir === 'n' || dir === 's') {
                    const widthDiff = adjustedWidth - finalWidth;
                    const align = window.getComputedStyle(div).textAlign;
                    if (align === 'center') adjustedX = finalX - (widthDiff / 2);
                    else if (align === 'right' || align === 'end') adjustedX = finalX - widthDiff;
                  }

                  if (dir === 'n' || dir === 'nw' || dir === 'ne') {
                    adjustedY = (finalY + finalHeight) - adjustedHeight;
                  }
                }

                el.setAttribute('x', adjustedX);
                el.setAttribute('y', adjustedY);
                el.setAttribute('width', adjustedWidth);
                el.setAttribute('height', adjustedHeight);

                if (el.tagName.toLowerCase() === 'foreignobject') {
                  const iframe = el.querySelector('iframe');
                  if (iframe) {
                    const origW = parseFloat(iframe.getAttribute('data-original-width')) || 640;
                    const origH = parseFloat(iframe.getAttribute('data-original-height')) || 360;
                    iframe.setAttribute('data-original-width', origW.toString());
                    iframe.setAttribute('data-original-height', origH.toString());
                    iframe.setAttribute('width', origW.toString());
                    iframe.setAttribute('height', origH.toString());
                    iframe.style.setProperty('width', origW + 'px', 'important');
                    iframe.style.setProperty('height', origH + 'px', 'important');
                    iframe.style.setProperty('transform-origin', '0 0', 'important');
                    iframe.style.setProperty('pointer-events', 'auto', 'important');

                    if (origW > 0 && origH > 0 && adjustedWidth > 0 && adjustedHeight > 0) {
                      const scaleX = adjustedWidth / origW;
                      const scaleY = adjustedHeight / origH;
                      iframe.style.setProperty('transform', `scale(${scaleX}, ${scaleY})`, 'important');
                    }
                  }
                  const video = el.querySelector('video');
                  if (video) {
                    video.style.setProperty('width', '100%', 'important');
                    video.style.setProperty('height', '100%', 'important');
                  }
                }
              } else if (isShape && !isGroup && !isHotspotIconGroup) {
                const isRectPath = el.tagName?.toLowerCase() === 'path' && el.getAttribute('data-shape-type') === 'rectangle';
                if (el.tagName?.toLowerCase() === 'rect' || isRectPath || el.tagName?.toLowerCase() === 'image') {
                  el.setAttribute('x', finalX);
                  el.setAttribute('y', finalY);
                  el.setAttribute('width', finalWidth);
                  el.setAttribute('height', finalHeight);
                  if (isRectPath) {
                    const defR = parseFloat(el.getAttribute('rx') || 0);
                    const maxR = Math.max(0, Math.min(finalWidth / 2, finalHeight / 2));
                    const parseR = (v, d) => (v !== null && v !== '') ? (isNaN(parseFloat(v)) ? 0 : parseFloat(v)) : d;
                    const tl = Math.min(parseR(el.getAttribute('data-tl'), defR), maxR);
                    const tr = Math.min(parseR(el.getAttribute('data-tr'), defR), maxR);
                    const bl = Math.min(parseR(el.getAttribute('data-bl'), defR), maxR);
                    const br = Math.min(parseR(el.getAttribute('data-br'), defR), maxR);
                    const d = `M ${finalX + tl},${finalY} L ${finalX + finalWidth - tr},${finalY} A ${tr},${tr} 0 0 1 ${finalX + finalWidth},${finalY + tr} L ${finalX + finalWidth},${finalY + finalHeight - br} A ${br},${br} 0 0 1 ${finalX + finalWidth - br},${finalY + finalHeight} L ${finalX + bl},${finalY + finalHeight} A ${bl},${bl} 0 0 1 ${finalX},${finalY + finalHeight - bl} L ${finalX},${finalY + tl} A ${tl},${tl} 0 0 1 ${finalX + tl},${finalY} Z`.replace(/\s+/g, ' ').trim();
                    el.setAttribute('d', d);
                  }
                } else if (el.tagName?.toLowerCase() === 'ellipse' || el.tagName?.toLowerCase() === 'circle') {
                  el.setAttribute('cx', finalX + finalWidth / 2);
                  el.setAttribute('cy', finalY + finalHeight / 2);
                  if (el.tagName?.toLowerCase() === 'circle') {
                    el.setAttribute('r', Math.min(finalWidth, finalHeight) / 2);
                  } else {
                    el.setAttribute('rx', finalWidth / 2);
                    el.setAttribute('ry', finalHeight / 2);
                  }
                } else {
                  const scaleMatrix = new DOMMatrix()
                    .translate(worldAnchor.x, worldAnchor.y)
                    .scale(scaleX, scaleY)
                    .translate(-worldAnchor.x, -worldAnchor.y);
                  const nextMatrix = scaleMatrix.multiply(matrix);
                  el.setAttribute('transform', matrixToTransform(nextMatrix));
                }
              } else if ((isGroup || isHotspotIconGroup) && state.childrenData) {
                const isMultiSel = el.tagName === 'multi';

                if (isMultiSel) {
                  // ── MULTI-SELECTION PATH ──────────────────────────────────────────
                  // bound is in SVG root space (computed via getScreenCTM in start).
                  // worldAnchor is also in SVG root space (localAnchor * identity matrix).
                  // svgCoordsToParent converts SVG root → child's parent local coords.

                  const svgCoordsToParent = (child, svgX, svgY, svgW, svgH) => {
                    const parentEl = child.parentNode;
                    const canvasSVGEl = child.ownerSVGElement;
                    const parentCTMLocal = parentEl?.getScreenCTM?.();
                    const svgCTM = canvasSVGEl?.getScreenCTM?.();
                    if (!parentCTMLocal || !svgCTM) return { x: svgX, y: svgY, width: svgW, height: svgH };
                    const parentInv = parentCTMLocal.inverse();
                    const ptTL = new DOMPoint(svgX, svgY).matrixTransform(svgCTM).matrixTransform(parentInv);
                    const ptBR = new DOMPoint(svgX + svgW, svgY + svgH).matrixTransform(svgCTM).matrixTransform(parentInv);
                    return {
                      x: Math.min(ptTL.x, ptBR.x),
                      y: Math.min(ptTL.y, ptBR.y),
                      width: Math.abs(ptBR.x - ptTL.x),
                      height: Math.abs(ptBR.y - ptTL.y)
                    };
                  };

                  const getSmInParentSpace = (child, sm) => {
                    const parentEl = child.parentNode;
                    const canvasSVGEl = child.ownerSVGElement;
                    if (!parentEl || !canvasSVGEl || parentEl === canvasSVGEl) return sm;
                    try {
                      const parentCTM = parentEl.getScreenCTM();
                      const svgCTM = canvasSVGEl.getScreenCTM();
                      if (!parentCTM || !svgCTM) return sm;
                      const rootToParent = parentCTM.inverse().multiply(svgCTM);
                      const parentToRoot = svgCTM.inverse().multiply(parentCTM);
                      return rootToParent.multiply(sm).multiply(parentToRoot);
                    } catch (e) {
                      return sm;
                    }
                  };

                  state.childrenData.forEach(cData => {
                    const { child, initialMatrix, bound } = cData;

                    const isStrokeOverlay = child.classList && (
                      child.classList.contains('svg-shape-stroke-overlay') ||
                      child.classList.contains('svg-image-stroke-overlay') ||
                      child.classList.contains('svg-gif-stroke-overlay') ||
                      child.classList.contains('svg-video-stroke-overlay') ||
                      child.classList.contains('svg-drop-shadow-caster')
                    );

                    if (isStrokeOverlay) {
                      return; // Skip completely. Let syncOverlay handle it dynamically.
                    }

                    const tag = child.tagName?.toLowerCase();
                    const isChildText = tag === 'text' || child.getAttribute('data-type') === 'text';

                    const newMinX = worldAnchor.x + (bound.x - worldAnchor.x) * scaleX;
                    const newMinY = worldAnchor.y + (bound.y - worldAnchor.y) * scaleY;
                    const newMaxX = worldAnchor.x + (bound.x + bound.width - worldAnchor.x) * scaleX;
                    const newMaxY = worldAnchor.y + (bound.y + bound.height - worldAnchor.y) * scaleY;
                    const newSvgX = Math.min(newMinX, newMaxX);
                    const newSvgY = Math.min(newMinY, newMaxY);
                    const newSvgW = Math.abs(newMaxX - newMinX);
                    const newSvgH = Math.abs(newMaxY - newMinY);

                    if (isChildText) {
                      const localNew = svgCoordsToParent(child, newSvgX, newSvgY, newSvgW, newSvgH);
                      const localOld = svgCoordsToParent(child, bound.x, bound.y, bound.width, bound.height);
                      const dx = localNew.x - localOld.x;
                      const dy = localNew.y - localOld.y;
                      child.setAttribute('transform', matrixToTransform(new DOMMatrix().translate(dx, dy).multiply(initialMatrix)));
                    } else if (tag === 'rect' || (tag === 'path' && child.getAttribute('data-shape-type') === 'rectangle') || tag === 'foreignobject' || tag === 'image' || tag === 'video' || tag === 'svg') {
                      const isRectPath = tag === 'path' && child.getAttribute('data-shape-type') === 'rectangle';
                      const hasTransform = child.getAttribute('transform');
                      const forceNative = (tag === 'rect' || isRectPath || tag === 'image' || tag === 'video' || tag === 'svg');
                      if (forceNative || !hasTransform || hasTransform === 'matrix(1 0 0 1 0 0)') {
                        if (forceNative && hasTransform && hasTransform !== 'matrix(1 0 0 1 0 0)') {
                          child.removeAttribute('transform');
                        }
                        const local = svgCoordsToParent(child, newSvgX, newSvgY, newSvgW, newSvgH);
                        child.setAttribute('x', local.x);
                        child.setAttribute('y', local.y);
                        child.setAttribute('width', local.width);
                        child.setAttribute('height', local.height);

                        if (isRectPath) {
                          const defR = parseFloat(child.getAttribute('rx') || 0);
                          const maxR = Math.max(0, Math.min(local.width / 2, local.height / 2));
                          const parseR = (v, d) => (v !== null && v !== '') ? (isNaN(parseFloat(v)) ? 0 : parseFloat(v)) : d;
                          const tl = Math.min(parseR(child.getAttribute('data-tl'), defR), maxR);
                          const tr = Math.min(parseR(child.getAttribute('data-tr'), defR), maxR);
                          const bl = Math.min(parseR(child.getAttribute('data-bl'), defR), maxR);
                          const br = Math.min(parseR(child.getAttribute('data-br'), defR), maxR);
                          const d = `M ${local.x + tl},${local.y} L ${local.x + local.width - tr},${local.y} A ${tr},${tr} 0 0 1 ${local.x + local.width},${local.y + tr} L ${local.x + local.width},${local.y + local.height - br} A ${br},${br} 0 0 1 ${local.x + local.width - br},${local.y + local.height} L ${local.x + bl},${local.y + local.height} A ${bl},${bl} 0 0 1 ${local.x},${local.y + local.height - bl} L ${local.x},${local.y + tl} A ${tl},${tl} 0 0 1 ${local.x + tl},${local.y} Z`.replace(/\s+/g, ' ').trim();
                          child.setAttribute('d', d);
                        }

                        if ((tag === 'image' || tag === 'video') && el.tagName === 'g') {
                          const svg = child.ownerSVGElement;
                          const clip = svg?.querySelector(`clipPath[id="clip-shape-${el.id}"]`);
                          const refShape = clip ? clip.firstChild : null;
                          if (refShape) {
                            refShape.setAttribute('x', local.x);
                            refShape.setAttribute('y', local.y);
                            refShape.setAttribute('width', local.width);
                            refShape.setAttribute('height', local.height);
                          }
                        }
                      } else {
                        const sm = new DOMMatrix().translate(worldAnchor.x, worldAnchor.y).scale(scaleX, scaleY).translate(-worldAnchor.x, -worldAnchor.y);
                        const smLocal = getSmInParentSpace(child, sm);
                        child.setAttribute('transform', matrixToTransform(smLocal.multiply(initialMatrix)));
                      }
                    } else if (tag === 'circle' || tag === 'ellipse') {
                      const hasTransform = child.getAttribute('transform');
                      if (!hasTransform || hasTransform === 'matrix(1 0 0 1 0 0)') {
                        const local = svgCoordsToParent(child, newSvgX, newSvgY, newSvgW, newSvgH);
                        if (tag === 'circle') {
                          child.setAttribute('cx', local.x + local.width / 2);
                          child.setAttribute('cy', local.y + local.height / 2);
                          child.setAttribute('r', Math.min(local.width, local.height) / 2);
                        } else {
                          child.setAttribute('cx', local.x + local.width / 2);
                          child.setAttribute('cy', local.y + local.height / 2);
                          child.setAttribute('rx', local.width / 2);
                          child.setAttribute('ry', local.height / 2);
                        }
                      } else {
                        const sm = new DOMMatrix().translate(worldAnchor.x, worldAnchor.y).scale(scaleX, scaleY).translate(-worldAnchor.x, -worldAnchor.y);
                        const smLocal = getSmInParentSpace(child, sm);
                        child.setAttribute('transform', matrixToTransform(smLocal.multiply(initialMatrix)));
                      }
                    } else {
                      const sm = new DOMMatrix().translate(worldAnchor.x, worldAnchor.y).scale(scaleX, scaleY).translate(-worldAnchor.x, -worldAnchor.y);
                      const smLocal = getSmInParentSpace(child, sm);
                      child.setAttribute('transform', matrixToTransform(smLocal.multiply(initialMatrix)));
                    }
                  });

                } else {
                  // ── REAL <g> GROUP PATH ───────────────────────────────────────────
                  // bound is in <g>'s LOCAL coordinate space (same as child attribute space).
                  // localAnchor is also in <g>'s local space.
                  // No CTM conversion needed — just compute new position in <g> local space.

                  const la = state.localAnchor; // anchor in <g> local space
                  const isHotspot = el.getAttribute('data-is-hotspot') === 'true';
                  const isInteractiveButton = (isHotspot || el.getAttribute('data-type') === 'button') && state.childrenData.some(c => c.child.tagName.toLowerCase() === 'rect') && state.childrenData.some(c => c.child.tagName.toLowerCase() === 'text' || c.child.getAttribute('data-type') === 'text');
                  const isAudioGroup = el.getAttribute('data-type') === 'audio-frame' || el.getAttribute('data-type') === 'audio';
                  const isInteractiveButton = isHotspot && state.childrenData.some(c => c.child.tagName.toLowerCase() === 'rect') && state.childrenData.some(c => c.child.tagName.toLowerCase() === 'text' || c.child.getAttribute('data-type') === 'text');

                  // ── HOTSPOT ICON GROUP: update outer transform, NOT children ───────
                  // Hotspot preset icon groups have transform="translate(tx,ty) scale(s)"
                  // with 48×48 inner content. Resizing must update this outer transform so
                  // the group's position and size in the page change correctly.
                  // Modifying children would only scale inside the 48×48 local space while
                  // the group's outer translate+scale stays the same → no visible resize effect.
                  if ((isHotspot && !isInteractiveButton) || isAudioGroup) {
                    try {
                      // finalX/Y/W/H are in the group's LOCAL coordinate space (0–48 range).
                      // Convert them to parent-local space using matrix (local→parent mapping).
                      const ptOrigin = new DOMPoint(finalX, finalY).matrixTransform(matrix);
                      const ptCorner = new DOMPoint(finalX + finalWidth, finalY + finalHeight).matrixTransform(matrix);
                      const newTx = Math.min(ptOrigin.x, ptCorner.x);
                      const newTy = Math.min(ptOrigin.y, ptCorner.y);
                      const newW  = Math.abs(ptCorner.x - ptOrigin.x);
                      const newH  = Math.abs(ptCorner.y - ptOrigin.y);
                      // Derive scale from inner content size
                      const innerWidth = (state.bbox && state.bbox.width > 0) ? state.bbox.width : 48;
                      const innerHeight = (state.bbox && state.bbox.height > 0) ? state.bbox.height : 48;
                      const newSx = newW / innerWidth;
                      const newSy = newH / innerHeight;
                      el.setAttribute('transform', `translate(${newTx}, ${newTy}) scale(${newSx}, ${newSy})`);
                    } catch (e) { /* fallback: do nothing if matrix ops fail */ }
                    // Update overlay handles to follow the new position during drag
                    if (typeof drawOverlayHighlight === 'function') {
                      const highlightType = (currentFrameIdRef.current && el.id !== currentFrameIdRef.current) ? 'child-selected' : 'selected';
                      drawOverlayHighlight(el, highlightType);
                    }
                    return; // skip children modification
                  }

                  state.childrenData.forEach(cData => {
                    const { child, initialMatrix, bound } = cData;

                    const isStrokeOverlay = child.classList && (
                      child.classList.contains('svg-shape-stroke-overlay') ||
                      child.classList.contains('svg-image-stroke-overlay') ||
                      child.classList.contains('svg-gif-stroke-overlay') ||
                      child.classList.contains('svg-video-stroke-overlay') ||
                      child.classList.contains('svg-drop-shadow-caster')
                    );

                    if (isStrokeOverlay) {
                      return; // Skip completely. Let syncOverlay handle it dynamically.
                    }

                    const tag = child.tagName?.toLowerCase();
                    const isChildText = tag === 'text' || child.getAttribute('data-type') === 'text';

                    if (isInteractiveButton && (isChildText || tag === 'image' || tag === 'g' || tag === 'path')) {
                      return; // Text and icons are positioned/scaled in the dedicated interactive button block below
                    }

                    let myScaleX = scaleX;
                    let myScaleY = scaleY;
                    let myAnchorX = la.x;
                    let myAnchorY = la.y;

                    // Scale bound in <g> local space from localAnchor
                    const newMinX = myAnchorX + (bound.x - myAnchorX) * myScaleX;
                    const newMinY = myAnchorY + (bound.y - myAnchorY) * myScaleY;
                    const newMaxX = myAnchorX + (bound.x + bound.width - myAnchorX) * myScaleX;
                    const newMaxY = myAnchorY + (bound.y + bound.height - myAnchorY) * myScaleY;
                    const newLocX = Math.min(newMinX, newMaxX);
                    const newLocY = Math.min(newMinY, newMaxY);
                    const newLocW = Math.abs(newMaxX - newMinX);
                    const newLocH = Math.abs(newMaxY - newMinY);

                    if (isChildText) {
                      // Text: translate only
                      const dx = newLocX - bound.x;
                      const dy = newLocY - bound.y;
                      child.setAttribute('transform', matrixToTransform(new DOMMatrix().translate(dx, dy).multiply(initialMatrix)));
                    } else if (tag === 'rect' || (tag === 'path' && child.getAttribute('data-shape-type') === 'rectangle') || tag === 'foreignobject' || tag === 'image' || tag === 'video' || tag === 'svg' || child.classList?.contains('gif-inner-content')) {
                      const isRectPath = tag === 'path' && child.getAttribute('data-shape-type') === 'rectangle';
                      const hasTransform = child.getAttribute('transform');
                      const forceNative = (tag === 'rect' || isRectPath || tag === 'image' || tag === 'video' || tag === 'svg' || child.classList?.contains('gif-inner-content'));

                      if (forceNative || !hasTransform || hasTransform === 'matrix(1 0 0 1 0 0)') {
                        if (forceNative && hasTransform && hasTransform !== 'matrix(1 0 0 1 0 0)') {
                          child.removeAttribute('transform');
                        }
                        // Attributes are already in <g> local space — set directly
                        let imgX = newLocX;
                        let imgY = newLocY;
                        let imgW = newLocW;
                        let imgH = newLocH;

                        const isCropModeThisEl = el.getAttribute?.('data-object-fit') === 'Crop' || el.hasAttribute?.('data-effect-crop-inset') || (el.getAttribute?.('data-crop-data') && el.getAttribute?.('data-crop-data') !== 'null');
                        const isSideHandleDrag = ['n', 's', 'e', 'w'].includes(dir) && !event.shiftKey;

                        let cOffX = 0, cOffY = 0, cScale = 1;
                        if (isCropModeThisEl && (tag === 'image' || tag === 'video' || child.classList?.contains('gif-inner-content'))) {
                          let origX = parseFloat(el.getAttribute('data-crop-orig-x') || child.getAttribute('data-crop-orig-x') || child.getAttribute('x') || '0');
                          let origY = parseFloat(el.getAttribute('data-crop-orig-y') || child.getAttribute('data-crop-orig-y') || child.getAttribute('y') || '0');
                          let origW = parseFloat(el.getAttribute('data-crop-orig-w') || child.getAttribute('data-crop-orig-w') || child.getAttribute('width') || '100');
                          let origH = parseFloat(el.getAttribute('data-crop-orig-h') || child.getAttribute('data-crop-orig-h') || child.getAttribute('height') || '100');

                          if (!el.hasAttribute('data-crop-orig-w') || parseFloat(el.getAttribute('data-crop-orig-w')) <= 0) {
                            el.setAttribute('data-crop-orig-x', origX);
                            el.setAttribute('data-crop-orig-y', origY);
                            el.setAttribute('data-crop-orig-w', origW);
                            el.setAttribute('data-crop-orig-h', origH);
                          }

                          const cropDataStr = el.getAttribute('data-crop-data') || el.getAttribute('data-saved-crop-data');
                          let cLeft = 0, cTop = 0, cWidth = 100, cHeight = 100;
                          if (cropDataStr && cropDataStr !== 'null') {
                            try {
                              const cd = JSON.parse(cropDataStr);
                              cLeft = parseFloat(cd.left) || 0;
                              cTop = parseFloat(cd.top) || 0;
                              cWidth = parseFloat(cd.width) || 100;
                              cHeight = parseFloat(cd.height) || 100;
                              cOffX = parseFloat(cd.offX) || 0;
                              cOffY = parseFloat(cd.offY) || 0;
                              cScale = parseFloat(cd.scale) || 1;
                            } catch (e) { }
                          }

                          if (isSideHandleDrag) {
                            imgX = origX;
                            imgY = origY;
                            imgW = origW;
                            imgH = origH;
                            if (imgW > 0 && imgH > 0) {
                              cLeft = ((newLocX - imgX) / imgW) * 100;
                              cTop = ((newLocY - imgY) / imgH) * 100;
                              cWidth = (newLocW / imgW) * 100;
                              cHeight = (newLocH / imgH) * 100;
                              let cd = {};
                              try { if (cropDataStr && cropDataStr !== 'null') cd = JSON.parse(cropDataStr); } catch (e) { }
                              cd.left = cLeft;
                              cd.top = cTop;
                              cd.width = cWidth;
                              cd.height = cHeight;
                              el.setAttribute('data-crop-data', JSON.stringify(cd));
                            }
                          } else {
                            const newOrigW = cWidth > 0 ? (newLocW / (cWidth / 100)) : newLocW;
                            const newOrigH = cHeight > 0 ? (newLocH / (cHeight / 100)) : newLocH;
                            const newOrigX = newLocX - (newOrigW * (cLeft / 100));
                            const newOrigY = newLocY - (newOrigH * (cTop / 100));

                            el.setAttribute('data-crop-orig-x', newOrigX);
                            el.setAttribute('data-crop-orig-y', newOrigY);
                            el.setAttribute('data-crop-orig-w', newOrigW);
                            el.setAttribute('data-crop-orig-h', newOrigH);

                            imgX = newOrigX;
                            imgY = newOrigY;
                            imgW = newOrigW;
                            imgH = newOrigH;
                          }
                        }

                        child.setAttribute('x', imgX);
                        child.setAttribute('y', imgY);
                        child.setAttribute('width', imgW);
                        child.setAttribute('height', imgH);

                        if (isRectPath) {
                          const defR = parseFloat(child.getAttribute('rx') || 0);
                          const maxR = Math.max(0, Math.min(imgW / 2, imgH / 2));
                          const parseR = (v, d) => (v !== null && v !== '') ? (isNaN(parseFloat(v)) ? 0 : parseFloat(v)) : d;
                          const tl = Math.min(parseR(child.getAttribute('data-tl'), defR), maxR);
                          const tr = Math.min(parseR(child.getAttribute('data-tr'), defR), maxR);
                          const bl = Math.min(parseR(child.getAttribute('data-bl'), defR), maxR);
                          const br = Math.min(parseR(child.getAttribute('data-br'), defR), maxR);
                          const d = `M ${imgX + tl},${imgY} L ${imgX + imgW - tr},${imgY} A ${tr},${tr} 0 0 1 ${imgX + imgW},${imgY + tr} L ${imgX + imgW},${imgY + imgH - br} A ${br},${br} 0 0 1 ${imgX + imgW - br},${imgY + imgH} L ${imgX + bl},${imgY + imgH} A ${bl},${bl} 0 0 1 ${imgX},${imgY + imgH - bl} L ${imgX},${imgY + tl} A ${tl},${tl} 0 0 1 ${imgX + tl},${imgY} Z`.replace(/\s+/g, ' ').trim();
                          child.setAttribute('d', d);
                        }

                        if (child.classList?.contains('gif-inner-content')) {
                          const innerImg = child.querySelector('image, foreignObject');
                          if (innerImg) {
                            innerImg.setAttribute('x', imgX);
                            innerImg.setAttribute('y', imgY);
                            innerImg.setAttribute('width', imgW);
                            innerImg.setAttribute('height', imgH);
                          }
                        }

                        if (tag === 'foreignobject') {
                          const iframe = child.querySelector('iframe');
                          if (iframe) {
                            const origW = parseFloat(iframe.getAttribute('data-original-width')) || 640;
                            const origH = parseFloat(iframe.getAttribute('data-original-height')) || 360;
                            iframe.setAttribute('data-original-width', origW.toString());
                            iframe.setAttribute('data-original-height', origH.toString());
                            iframe.setAttribute('width', origW.toString());
                            iframe.setAttribute('height', origH.toString());
                            iframe.style.setProperty('width', origW + 'px', 'important');
                            iframe.style.setProperty('height', origH + 'px', 'important');
                            iframe.style.setProperty('transform-origin', '0 0', 'important');
                            iframe.style.setProperty('pointer-events', 'auto', 'important');

                            if (origW > 0 && origH > 0 && imgW > 0 && imgH > 0) {
                              const scaleX = imgW / origW;
                              const scaleY = imgH / origH;
                              iframe.style.setProperty('transform', `scale(${scaleX}, ${scaleY})`, 'important');
                            }
                          }
                          const video = child.querySelector('video');
                          if (video) {
                            video.style.setProperty('width', '100%', 'important');
                            video.style.setProperty('height', '100%', 'important');
                          }
                        }

                        if (isCropModeThisEl && (tag === 'image' || tag === 'video' || child.classList?.contains('gif-inner-content'))) {
                          const centerX = imgX + (imgW / 2);
                          const centerY = imgY + (imgH / 2);
                          const panX = (imgW * cOffX) / 100;
                          const panY = (imgH * cOffY) / 100;
                          child.setAttribute('transform', `translate(${centerX + panX} ${centerY + panY}) scale(${cScale}) translate(${-centerX} ${-centerY})`);
                        }

                        if (tag === 'image' || tag === 'video' || child.classList?.contains('gif-inner-content')) {
                          const svg = child.ownerSVGElement;
                          const clip = svg?.querySelector(`clipPath[id="clip-shape-${el.id}"]`);
                          const refShape = clip ? clip.firstChild : null;
                          if (refShape) {
                            refShape.setAttribute('x', newLocX);
                            refShape.setAttribute('y', newLocY);
                            refShape.setAttribute('width', newLocW);
                            refShape.setAttribute('height', newLocH);
                          }
                          const gifClip = svg?.querySelector(`clipPath[id="clip-content-${el.id}"]`);
                          const gifRef = gifClip ? gifClip.firstChild : null;
                          if (gifRef) {
                            gifRef.setAttribute('x', newLocX);
                            gifRef.setAttribute('y', newLocY);
                            gifRef.setAttribute('width', newLocW);
                            gifRef.setAttribute('height', newLocH);
                          }
                          const mask = svg?.querySelector(`mask[id="mask-shape-${el.id}"]`);
                          const maskShape = mask ? mask.lastChild : null;
                          if (maskShape) {
                            maskShape.setAttribute('x', newLocX);
                            maskShape.setAttribute('y', newLocY);
                            maskShape.setAttribute('width', newLocW);
                            maskShape.setAttribute('height', newLocH);
                          }
                        }
                      } else {
                        // Has transform: use local scale matrix
                        const sm = new DOMMatrix().translate(la.x, la.y).scale(scaleX, scaleY).translate(-la.x, -la.y);
                        child.setAttribute('transform', matrixToTransform(sm.multiply(initialMatrix)));
                      }
                    } else if (tag === 'circle' || tag === 'ellipse') {
                      const hasTransform = child.getAttribute('transform');
                      const forceMatrix = isHotspot && !isInteractiveButton && (myScaleX !== myScaleY);
                      if (!forceMatrix && (!hasTransform || hasTransform === 'matrix(1 0 0 1 0 0)')) {
                        if (tag === 'circle') {
                          child.setAttribute('cx', newLocX + newLocW / 2);
                          child.setAttribute('cy', newLocY + newLocH / 2);
                          child.setAttribute('r', Math.min(newLocW, newLocH) / 2);
                        } else {
                          child.setAttribute('cx', newLocX + newLocW / 2);
                          child.setAttribute('cy', newLocY + newLocH / 2);
                          child.setAttribute('rx', newLocW / 2);
                          child.setAttribute('ry', newLocH / 2);
                        }
                      } else {
                        const sm = new DOMMatrix().translate(la.x, la.y).scale(myScaleX, myScaleY).translate(-la.x, -la.y);
                        child.setAttribute('transform', matrixToTransform(sm.multiply(initialMatrix)));
                      }
                    } else {
                      // g, path, polygon, etc — scale via matrix in <g> local space
                      const isImageInnerContent = child.classList && (child.classList.contains('image-inner-content') || child.classList.contains('gif-inner-content'));
                      if (isImageInnerContent) {
                        const innerImg = child.querySelector('image, video, img, foreignObject');
                        if (innerImg) {
                          // Clear any transform on the wrapper — use direct attributes on <image>
                          child.removeAttribute('transform');
                          let imgX = newLocX;
                          let imgY = newLocY;
                          let imgW = newLocW;
                          let imgH = newLocH;

                          const isCropModeThisEl = el.getAttribute?.('data-object-fit') === 'Crop' || el.hasAttribute?.('data-effect-crop-inset') || (el.getAttribute?.('data-crop-data') && el.getAttribute?.('data-crop-data') !== 'null');
                          const isSideHandleDrag = ['n', 's', 'e', 'w'].includes(dir) && !event.shiftKey;

                          let cOffX = 0, cOffY = 0, cScale = 1;
                          if (isCropModeThisEl) {
                            let origX = parseFloat(el.getAttribute('data-crop-orig-x') || innerImg.getAttribute('data-crop-orig-x') || innerImg.getAttribute('x') || '0');
                            let origY = parseFloat(el.getAttribute('data-crop-orig-y') || innerImg.getAttribute('data-crop-orig-y') || innerImg.getAttribute('y') || '0');
                            let origW = parseFloat(el.getAttribute('data-crop-orig-w') || innerImg.getAttribute('data-crop-orig-w') || innerImg.getAttribute('width') || '100');
                            let origH = parseFloat(el.getAttribute('data-crop-orig-h') || innerImg.getAttribute('data-crop-orig-h') || innerImg.getAttribute('height') || '100');

                            if (!el.hasAttribute('data-crop-orig-w') || parseFloat(el.getAttribute('data-crop-orig-w')) <= 0) {
                              el.setAttribute('data-crop-orig-x', origX);
                              el.setAttribute('data-crop-orig-y', origY);
                              el.setAttribute('data-crop-orig-w', origW);
                              el.setAttribute('data-crop-orig-h', origH);
                            }

                            const cropDataStr = el.getAttribute('data-crop-data');
                            let cLeft = 0, cTop = 0, cWidth = 100, cHeight = 100;
                            if (cropDataStr && cropDataStr !== 'null') {
                              try {
                                const cd = JSON.parse(cropDataStr);
                                cLeft = parseFloat(cd.left) || 0;
                                cTop = parseFloat(cd.top) || 0;
                                cWidth = parseFloat(cd.width) || 100;
                                cHeight = parseFloat(cd.height) || 100;
                                cOffX = parseFloat(cd.offX) || 0;
                                cOffY = parseFloat(cd.offY) || 0;
                                cScale = parseFloat(cd.scale) || 1;
                              } catch (e) { }
                            }

                            const scaledCropX = la.x + (bbox.x - la.x) * scaleX;
                            const scaledCropY = la.y + (bbox.y - la.y) * scaleY;
                            const scaledCropW = bbox.width * scaleX;
                            const scaledCropH = bbox.height * Math.abs(scaleY);

                            if (isSideHandleDrag) {
                              imgX = origX;
                              imgY = origY;
                              imgW = origW;
                              imgH = origH;
                              if (imgW > 0 && imgH > 0) {
                                cLeft = ((scaledCropX - imgX) / imgW) * 100;
                                cTop = ((scaledCropY - imgY) / imgH) * 100;
                                cWidth = (scaledCropW / imgW) * 100;
                                cHeight = (scaledCropH / imgH) * 100;
                                let cd = {};
                                try { if (cropDataStr && cropDataStr !== 'null') cd = JSON.parse(cropDataStr); } catch (e) { }
                                cd.left = cLeft;

                                cd.top = cTop;
                                cd.width = cWidth;
                                cd.height = cHeight;
                                el.setAttribute('data-crop-data', JSON.stringify(cd));
                              }
                            } else {
                              const newOrigW = cWidth > 0 ? (scaledCropW / (cWidth / 100)) : scaledCropW;
                              const newOrigH = cHeight > 0 ? (scaledCropH / (cHeight / 100)) : scaledCropH;
                              const newOrigX = scaledCropX - (newOrigW * (cLeft / 100));
                              const newOrigY = scaledCropY - (newOrigH * (cTop / 100));

                              el.setAttribute('data-crop-orig-x', newOrigX);
                              el.setAttribute('data-crop-orig-y', newOrigY);
                              el.setAttribute('data-crop-orig-w', newOrigW);
                              el.setAttribute('data-crop-orig-h', newOrigH);

                              imgX = newOrigX;
                              imgY = newOrigY;
                              imgW = newOrigW;
                              imgH = newOrigH;
                            }
                          }

                          innerImg.setAttribute('x', imgX);
                          innerImg.setAttribute('y', imgY);
                          innerImg.setAttribute('width', imgW);
                          innerImg.setAttribute('height', imgH);

                          const svg = child.ownerSVGElement;
                          const gifClip = svg?.querySelector(`clipPath[id="clip-content-${el.id}"]`);
                          const gifRef = gifClip ? gifClip.firstChild : null;
                          if (gifRef) {
                            gifRef.setAttribute('x', newLocX);
                            gifRef.setAttribute('y', newLocY);
                            gifRef.setAttribute('width', newLocW);
                            gifRef.setAttribute('height', newLocH);
                          }

                          if (isCropModeThisEl) {
                            const centerX = imgX + (imgW / 2);
                            const centerY = imgY + (imgH / 2);
                            const panX = (imgW * cOffX) / 100;
                            const panY = (imgH * cOffY) / 100;
                            innerImg.setAttribute('transform', `translate(${centerX + panX} ${centerY + panY}) scale(${cScale}) translate(${-centerX} ${-centerY})`);
                          }
                        } else {
                          const sm = new DOMMatrix().translate(la.x, la.y).scale(myScaleX, myScaleY).translate(-la.x, -la.y);
                          child.setAttribute('transform', matrixToTransform(sm.multiply(initialMatrix)));
                        }
                      } else {
                        const sm = new DOMMatrix().translate(la.x, la.y).scale(myScaleX, myScaleY).translate(-la.x, -la.y);
                        child.setAttribute('transform', matrixToTransform(sm.multiply(initialMatrix)));
                      }
                    }
                  });

                  if (isInteractiveButton) {
                    const rectData = state.childrenData.find(c => c.child.tagName.toLowerCase() === 'rect');
                    const textData = state.childrenData.find(c => c.child.tagName.toLowerCase() === 'text' || c.child.getAttribute('data-type') === 'text');

                    if (rectData && textData) {
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

                      // Check if button has an icon
                      const iconImg = el.querySelector('image');
                      const iconG = el.querySelector('g:not(defs g)');
                      const iconPath = el.querySelector('path');
                      const hasIcon = !!(iconImg || iconG || iconPath);

                      const label = textEl.textContent || '';
                      // Prevent font size from overflowing button width if narrowed
                      if (label.length > 0 && rectW > 0) {
                        const availableWidth = Math.max(8, rectW - (hasIcon ? 18 * scaleRatio : 6));
                        const maxFontForWidth = availableWidth / (label.length * 0.6);
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
                      } else {
                        // No icon: center text directly in rect
                        textEl.setAttribute('x', rectX + rectW / 2);
                        textEl.setAttribute('y', rectY + rectH / 2);
                        textEl.setAttribute('dominant-baseline', 'central');
                        textEl.setAttribute('text-anchor', 'middle');
                      }
                    }
                  }
                }
              }
            } else {
              const scaleMatrix = new DOMMatrix()
                .translate(worldAnchor.x, worldAnchor.y)
                .scale(scaleX, scaleY)
                .translate(-worldAnchor.x, -worldAnchor.y);

              const nextMatrix = scaleMatrix.multiply(matrix);
              el.setAttribute('transform', matrixToTransform(nextMatrix));
            }

            // ── LIVE CROP CLIP SYNC DURING RESIZE DRAG ─────────────────────────────
            // For cropped image groups, update the SVG clipPath rects in real-time
            // so the crop boundary stays in sync with the element while dragging.
            const isCropModeSync = el && typeof el.getAttribute === 'function' && (
              el.getAttribute('data-object-fit') === 'Crop' ||
              el.hasAttribute('data-effect-crop-inset') ||
              (el.getAttribute('data-crop-data') && el.getAttribute('data-crop-data') !== 'null')
            );
            if (isCropModeSync && state.childrenData) {
              try {
                const imgElLive = el.querySelector('image, video, img, foreignObject') || (el.tagName?.toLowerCase() === 'image' ? el : null);
                if (imgElLive) {
                  const targetCData = state.childrenData.find(c => c.child === imgElLive || c.child.contains?.(imgElLive)) || state.childrenData[0];
                  if (targetCData) {
                    const la = state.localAnchor;
                    const bound = bbox || targetCData.bound;
                    const newMinX = la.x + (bound.x - la.x) * scaleX;
                    const newMinY = la.y + (bound.y - la.y) * scaleY;
                    const newMaxX = la.x + (bound.x + bound.width - la.x) * scaleX;
                    const newMaxY = la.y + (bound.y + bound.height - la.y) * scaleY;
                    const cropLocX = Math.min(newMinX, newMaxX);
                    const cropLocY = Math.min(newMinY, newMaxY);
                    const cropLocW = Math.abs(newMaxX - newMinX);
                    const cropLocH = Math.abs(newMaxY - newMinY);

                    const origX = parseFloat(el.getAttribute('data-crop-orig-x') || imgElLive.getAttribute('x') || '0');
                    const origY = parseFloat(el.getAttribute('data-crop-orig-y') || imgElLive.getAttribute('y') || '0');
                    const origW = parseFloat(el.getAttribute('data-crop-orig-w') || imgElLive.getAttribute('width') || '100');
                    const origH = parseFloat(el.getAttribute('data-crop-orig-h') || imgElLive.getAttribute('height') || '100');

                    if (origW > 0 && origH > 0) {
                      const svgRootLive = el.ownerSVGElement || imgElLive.ownerSVGElement;
                      if (svgRootLive) {
                        let defs = svgRootLive.querySelector('defs');
                        if (!defs) {
                          defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                          svgRootLive.insertBefore(defs, svgRootLive.firstChild);
                        }

                        const groupClipId = `crop-group-clip-${el.id}`;
                        let grpClipPath = defs.querySelector(`[id="${groupClipId}"]`);
                        if (!grpClipPath) {
                          grpClipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                          grpClipPath.id = groupClipId;
                          grpClipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
                          const groupRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                          grpClipPath.appendChild(groupRect);
                          defs.appendChild(grpClipPath);
                        }

                        const gr = grpClipPath.querySelector('rect');
                        if (gr) {
                          gr.setAttribute('x', cropLocX);
                          gr.setAttribute('y', cropLocY);
                          gr.setAttribute('width', Math.max(0, cropLocW));
                          gr.setAttribute('height', Math.max(0, cropLocH));
                        }
                        el.setAttribute('clip-path', `url(#${groupClipId})`);

                        const imgClipPath = svgRootLive.querySelector(`[id="crop-clip-${el.id}"]`);
                        if (imgClipPath) {
                          const r = imgClipPath.querySelector('rect');
                          if (r) {
                            r.setAttribute('x', cropLocX);
                            r.setAttribute('y', cropLocY);
                            r.setAttribute('width', Math.max(0, cropLocW));
                            r.setAttribute('height', Math.max(0, cropLocH));
                          }
                        }

                        const isSideHandleSync = ['n', 's', 'e', 'w'].includes(dir) && !event.shiftKey;
                        if (isSideHandleSync) {
                          const cLeft = ((cropLocX - origX) / origW) * 100;
                          const cTop = ((cropLocY - origY) / origH) * 100;
                          const cWidth = (cropLocW / origW) * 100;
                          const cHeight = (cropLocH / origH) * 100;

                          const cropDataStr = el.getAttribute('data-crop-data');
                          let cd = {};
                          try { if (cropDataStr && cropDataStr !== 'null') cd = JSON.parse(cropDataStr); } catch (e) { }

                          cd.left = cLeft;
                          cd.top = cTop;
                          cd.width = Math.max(0, cWidth);
                          cd.height = Math.max(0, cHeight);

                          el.setAttribute('data-crop-data', JSON.stringify(cd));
                        }
                      }
                    }
                  }
                }
              } catch (_e) { /* non-critical */ }
            }

            // Sync shape stroke overlays dynamically
            const syncOverlay = (targetEl) => {
              const overlay = targetEl.parentNode?.querySelector(`.svg-shape-stroke-overlay[data-target="${targetEl.id}"]`);
              if (overlay) {
                const attrsToSync = ['x', 'y', 'width', 'height', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'transform', 'points'];
                const svg = targetEl.ownerSVGElement;
                const clip = svg?.querySelector(`clipPath[id="clip-shape-${targetEl.id}"]`);
                const mask = svg?.querySelector(`mask[id="mask-shape-${targetEl.id}"]`);
                const refShape = clip ? clip.firstChild : (mask ? mask.lastChild : null);

                attrsToSync.forEach(attr => {
                  const val = targetEl.getAttribute(attr);
                  if (val !== null) {
                    overlay.setAttribute(attr, val);
                    if (refShape) refShape.setAttribute(attr, val);
                  } else {
                    overlay.removeAttribute(attr);
                    if (refShape) refShape.removeAttribute(attr);
                  }
                });
                overlay.style.transform = targetEl.style.transform;
                overlay.style.translate = targetEl.style.translate;
                overlay.style.scale = targetEl.style.scale;
                overlay.style.rotate = targetEl.style.rotate;
                if (refShape) {
                  refShape.style.transform = targetEl.style.transform;
                  refShape.style.translate = targetEl.style.translate;
                  refShape.style.scale = targetEl.style.scale;
                  refShape.style.rotate = targetEl.style.rotate;
                }
              }
            };

            if (el.tagName === 'multi') {
              if (state.childrenData) {
                state.childrenData.forEach(c => {
                  syncOverlay(c.child);
                  drawOverlayHighlight(c.child, 'multi-child-selected');
                });
              }

              // ── Live sync of the overall bounding box using pre-computed coordinates ──
              // This avoids DOM-reflow lag from getBBox() / getBoundingClientRect() that
              // drawMultiSelectionHighlight() would trigger after attribute mutations.
              const newOverallMinX = worldAnchor.x + (bbox.x - worldAnchor.x) * scaleX;
              const newOverallMinY = worldAnchor.y + (bbox.y - worldAnchor.y) * scaleY;
              const newOverallMaxX = worldAnchor.x + (bbox.x + bbox.width - worldAnchor.x) * scaleX;
              const newOverallMaxY = worldAnchor.y + (bbox.y + bbox.height - worldAnchor.y) * scaleY;
              const newOverallBBox = {
                x: Math.min(newOverallMinX, newOverallMaxX),
                y: Math.min(newOverallMinY, newOverallMaxY),
                width: Math.abs(newOverallMaxX - newOverallMinX),
                height: Math.abs(newOverallMaxY - newOverallMinY)
              };

              // Resolve overlay elements from the first selected child
              const firstChildEl = state.childrenData?.[0]?.child;
              if (firstChildEl) {
                const pageContainer = firstChildEl.closest?.('.page-svg-container');
                const pageIdx = pageContainer?.getAttribute('data-page-index');
                const selOverlay = pageIdx != null ? document.getElementById(`highlight-overlay-${pageIdx}`) : null;
                const selHtmlOverlay = pageIdx != null ? document.getElementById(`highlight-overlay-html-${pageIdx}`) : null;
                syncMultiSelectionBox(firstChildEl.ownerSVGElement, selOverlay, selHtmlOverlay, newOverallBBox);
              }
            } else {
              syncOverlay(el);
              const highlightType = (currentFrameIdRef.current && el.id !== currentFrameIdRef.current) ? 'child-selected' : 'selected';
              drawOverlayHighlight(el, highlightType);
            }
          },
          end(event) {
            // Unlock cursor back to default
            document.body.style.cursor = '';
            document.body.classList.remove('resizing-active');
            document.documentElement.style.removeProperty('--resizing-cursor');

            const state = event.interaction.resizeState;
            if (state) {
              if (state.childrenData) {
                const textChild = state.childrenData.find(c => c.child.tagName?.toLowerCase() === 'text' || c.child.getAttribute('data-type') === 'text');
                if (textChild) {
                  const curFs = textChild.child.getAttribute('font-size');
                  if (curFs) textChild.child.setAttribute('data-base-font-size', curFs);
                }
                const rectChild = state.childrenData.find(c => c.child.tagName?.toLowerCase() === 'rect');
                if (rectChild) {
                  const curRx = rectChild.child.getAttribute('rx');
                  if (curRx) rectChild.child.setAttribute('data-base-rx', curRx);
                }
              }
              if (updatePageHtmlRef.current) {
                // state.el may be a fake object for multi-selection, use state.svg's container
                const container = state.svg?.closest?.('.page-svg-container') ||
                  (state.el?.closest ? state.el.closest('.page-svg-container') : null);
                const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : activePageIndex;
                const targetSvg = state.svg || container?.querySelector('svg:not([id^="highlight-overlay-"])');
                if (targetSvg) {
                  saveModifiedPageHtml(pageIdx, targetSvg);
                }
              }
            }
            delete event.interaction.resizeState;
            setTimeout(() => {
              suppressClickRef.current = false;
            }, 50);
          }
        }
      });

    return () => {
      interactable.unset();
    };
  }, [activePageIndex, zoom]);

  const saveModifiedPageHtml = (targetPageIndex, targetSvg) => {
    if (!updatePageHtmlRef.current) return;
    window.__skipCanvasUpdateForPage = targetPageIndex;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = targetSvg.outerHTML;
    tempDiv.querySelectorAll('.slideshow-transition-clone').forEach(el => el.remove());
    let finalHtml = tempDiv.innerHTML;
    finalHtml = finalHtml
      .replace(/<\s*br[^>]*>(?:<\/\s*br\s*>)?/gi, '<br/>')
      .replace(/<\/\s*br\s*>/gi, '');
    if (updatePageHtmlRef.current) {
      updatePageHtmlRef.current(targetPageIndex, finalHtml);
    } else if (typeof updatePageHtml === 'function') {
      updatePageHtml(targetPageIndex, finalHtml);
    }
  };

  const resolveTargetParentForCreation = (svg, clientX, clientY) => {
    let activeId = currentFrameIdRef.current;
    const topFrames = getTopLevelFrames(svg);
    const hitRoot = topFrames.find(f => hitTest(f, clientX, clientY));

    if (activeId) {
      const activeEl = svg.querySelector(`[id="${activeId}"]`);
      if (activeEl && !hitTest(activeEl, clientX, clientY) && hitRoot) {
        activeId = hitRoot.id;
        setCurrentFrameId(hitRoot.id);
        currentFrameIdRef.current = hitRoot.id;
      }
    } else if (hitRoot) {
      activeId = hitRoot.id;
    }
    return activeId ? svg.querySelector(`[id="${activeId}"]`) : (hitRoot || svg.querySelector('g[data-type="frame"]') || svg.querySelector('g'));
  };

  const handleSvgMouseDown = (pageIndex, e) => {
    if (e.button !== 0 || e.target.closest('.resize-handle')) return;

    // Allow native text selection/interaction inside actively edited text boxes
    if (e.target.closest('[contenteditable="true"]')) {
      e.stopPropagation();
      return;
    }

    const container = e.currentTarget;
    const svg = container.querySelector('svg');
    if (!svg) return;

    const getDistinctNodes = (paperPath, selSet) => {
      if (!paperPath || !selSet) return [];
      const segments = getPaperSegments(paperPath);
      const selSegs = Array.from(selSet).map(idx => segments[idx]).filter(Boolean);
      const distinct = [];
      selSegs.forEach(seg => {
        if (!distinct.some(s => Math.hypot(s.point.x - seg.point.x, s.point.y - seg.point.y) < 3.0)) {
          distinct.push(seg);
        }
      });
      return distinct;
    };

    const checkCanJoinNodes = (paperPath, selSet) => {
      if (!paperPath || !selSet) return false;
      try {
        const distinct = getDistinctNodes(paperPath, selSet);
        if (distinct.length !== 2) return false;

        const segments = getPaperSegments(paperPath);
        const curves = getPaperCurves(paperPath);

        const pt1 = distinct[0].point;
        const pt2 = distinct[1].point;

        const segs1 = segments.filter(s => Math.hypot(s.point.x - pt1.x, s.point.y - pt1.y) < 3.0);
        const segs2 = segments.filter(s => Math.hypot(s.point.x - pt2.x, s.point.y - pt2.y) < 3.0);

        const isConnected = curves.some(c =>
          (segs1.includes(c.segment1) && segs2.includes(c.segment2)) ||
          (segs1.includes(c.segment2) && segs2.includes(c.segment1))
        );
        return !isConnected;
      } catch (_) {
        return false;
      }
    };

    // ── NODE EDIT MODE: Handle node, handle, and line segment dragging ──────────
    if (nodeEditModeRef.current && nodeEditPathRef.current && activeMainTool !== 'pen') {
      const pathEl = nodeEditPathRef.current;
      const paperPath = nodeEditPaperPathRef.current;
      if (!paperPath || !pathEl) return;

      skipClearSelectionRef.current = true;
      if (pathEl && pathEl.id) {
        selectedLayerIdRef.current = pathEl.id;
        if (typeof setSelectedLayerId === 'function') setSelectedLayerId(pathEl.id);
        if (typeof setMultiSelectedIds === 'function') {
          multiSelectedIdsRef.current = new Set([pathEl.id]);
          setMultiSelectedIds(new Set([pathEl.id]));
        }
      }
      window.dispatchEvent(new CustomEvent('node-edit-mode-changed', { detail: { active: true, pathId: pathEl.id } }));

      // Screen-space hit testing using stored node positions from drawNodeEditOverlay.
      // These positions are in actual screen pixels (from pathEl.getScreenCTM()),
      // so they correctly match e.clientX/e.clientY regardless of zoom/scroll/transforms.
      let hitSegIdx = -1;
      let hitHandleSide = null; // 'point', 'in', 'out'
      const HIT_RADIUS_PX = 12; // screen pixel radius

      const screenNodes = nodeEditScreenNodesRef.current;
      let minDist = HIT_RADIUS_PX;
      for (const node of screenNodes) {
        const dist = Math.hypot(e.clientX - node.x, e.clientY - node.y);
        if (dist < minDist) {
          minDist = dist;
          hitSegIdx = node.segIdx;
          hitHandleSide = node.handleSide;
        }
      }

      paperScopeRef.current.activate();
      const svgEl = pathEl.ownerSVGElement;
      const pt = getLocalPoint(svgEl, pathEl, e.clientX, e.clientY);
      const mousePt = new paperScopeRef.current.Point(pt.x, pt.y);

      if (hitSegIdx !== -1 && !isNaN(hitSegIdx)) {
        if (hitHandleSide === 'point') {
          // Deleting an anchor point is ONLY performed if the Pen Subtract tool is active
          if (selectedPenToolRef.current === 'subtract') {
            const segments = getPaperSegments(paperPath);
            if (segments[hitSegIdx]) {
              segments[hitSegIdx].remove();
            }
            mergeMeetingNodes(paperPath);
            const dStr = cleanPaperPathData(paperPath);
            const remainingSegments = getPaperSegments(paperPath);
            if (remainingSegments.length <= 1 || !dStr || dStr.trim() === '') {
              pathEl.remove();
              exitNodeEditMode();
              if (svgEl && updatePageHtml) {
                saveModifiedPageHtml(pageIndex, svgEl);
              }
              if (typeof setSelectedLayerId === 'function') setSelectedLayerId(null);
            } else {
              pathEl.setAttribute('d', dStr);
              nodeEditSelectedSegIdxRef.current = null;
              nodeEditSelectedSegIndicesRef.current = new Set();
              drawNodeEditOverlay(pathEl, paperPath, pageIndex);
            }
            suppressClickRef.current = true;
            e.stopPropagation();
            return;
          }

          let selSet = nodeEditSelectedSegIndicesRef.current || new Set();
          if (e.shiftKey) {
            if (selSet.has(hitSegIdx)) selSet.delete(hitSegIdx);
            else selSet.add(hitSegIdx);
          } else {
            // Select only the clicked node point (plus any co-located merged nodes) and unselect other nodes
            selSet = new Set([hitSegIdx]);
          }
          const isSplitNode = (nodeEditSplitSegIdxRef.current !== null);
          const segments = getPaperSegments(paperPath);
          const primarySeg = segments[hitSegIdx];
          if (primarySeg) {
            // Snap all co-located/merged nodes ONLY if it is not a split node action
            if (!isSplitNode && !e.shiftKey) {
              segments.forEach((s, sIdx) => {
                if (Math.hypot(s.point.x - primarySeg.point.x, s.point.y - primarySeg.point.y) < 1.5) {
                  selSet.add(sIdx);
                  s.point.x = primarySeg.point.x;
                  s.point.y = primarySeg.point.y;
                }
              });
            }

            let currentNodeType = primarySeg.nodeType;
            if (!currentNodeType) {
              if (primarySeg.handleIn.isZero() && primarySeg.handleOut.isZero()) {
                currentNodeType = 'sharp';
              } else if (!primarySeg.handleIn.isZero() && !primarySeg.handleOut.isZero()) {
                const dot = primarySeg.handleIn.normalize().dot(primarySeg.handleOut.normalize());
                if (dot < -0.90) {
                  currentNodeType = Math.abs(primarySeg.handleIn.length - primarySeg.handleOut.length) < 4.0 ? 'balanced' : 'smooth';
                } else {
                  currentNodeType = 'custom';
                }
              } else {
                currentNodeType = 'custom';
              }
              primarySeg.nodeType = currentNodeType;
            }
            const distinctCount = getDistinctNodes(paperPath, selSet).length;
            const canJoin = checkCanJoinNodes(paperPath, selSet);
            window.dispatchEvent(new CustomEvent('node-selected', { detail: { nodeType: currentNodeType, segIdx: hitSegIdx, selectedCount: distinctCount, canJoin, isLineSelected: false } }));
          }

          nodeEditSelectedHandleSideRef.current = 'point';
          nodeEditSelectedCurveIdxRef.current = null;
          nodeEditSelectedSegIndicesRef.current = selSet;
          nodeEditSelectedSegIdxRef.current = hitSegIdx;
          if (nodeEditSplitSegIdxRef.current !== hitSegIdx) {
            nodeEditSplitSegIdxRef.current = null;
          }
          drawNodeEditOverlay(pathEl, paperPath, pageIndex);

          // Store initial local positions of all selected nodes for multi-node translation
          const startPoints = {};
          selSet.forEach(idx => {
            if (segments[idx]) {
              startPoints[idx] = segments[idx].point.clone();
            }
          });

          nodeEditDragRef.current = {
            mode: 'node',
            segIdx: hitSegIdx,
            handleSide: hitHandleSide,
            startPt: pt,
            startPoints,
            pathEl,
            paperPath,
            pageIndex
          };
        } else {
          // Double-click (e.detail === 2), Alt+Click, or Subtract tool on a top/bottom control handle retracts/deletes that handle point
          if (e.detail === 2 || e.altKey || selectedPenToolRef.current === 'subtract') {
            deleteSelectedNodeOrHandle(paperPath, [hitSegIdx], hitHandleSide, paperScopeRef.current);
            nodeEditSelectedHandleSideRef.current = 'point';
            nodeEditSelectedSegIdxRef.current = hitSegIdx;
            nodeEditSelectedSegIndicesRef.current = new Set([hitSegIdx]);
            const dStr = cleanPaperPathData(paperPath);
            pathEl.setAttribute('d', dStr);
            drawNodeEditOverlay(pathEl, paperPath, pageIndex);
            if (svgEl && updatePageHtml) {
              saveModifiedPageHtml(pageIndex, svgEl);
            }
            suppressClickRef.current = true;
            e.stopPropagation();
            return;
          }

          nodeEditSelectedHandleSideRef.current = hitHandleSide;
          nodeEditSelectedSegIndicesRef.current = new Set([hitSegIdx]);
          nodeEditSelectedSegIdxRef.current = hitSegIdx;
          drawNodeEditOverlay(pathEl, paperPath, pageIndex);
          // Dispatch the actual nodeType of the segment (not always 'custom') to keep the correct button highlighted
          // NOTE: 'segments' is only declared in the 'point' branch above, so we re-fetch here
          const handleSegs = getPaperSegments(paperPath);
          const hitSeg = handleSegs[hitSegIdx];
          let hitNodeType = 'custom';
          if (hitSeg) {
            if (hitSeg.nodeType) {
              hitNodeType = hitSeg.nodeType;
            } else if (!hitSeg.handleIn.isZero() && !hitSeg.handleOut.isZero()) {
              const dot = hitSeg.handleIn.normalize().dot(hitSeg.handleOut.normalize());
              hitNodeType = (dot < -0.90)
                ? (Math.abs(hitSeg.handleIn.length - hitSeg.handleOut.length) < 4.0 ? 'balanced' : 'smooth')
                : 'custom';
            } else if (hitSeg.handleIn.isZero() && hitSeg.handleOut.isZero()) {
              hitNodeType = 'sharp';
            }
          }
          window.dispatchEvent(new CustomEvent('node-selected', { detail: { nodeType: hitNodeType, selectedCount: 1, canJoin: false, isLineSelected: false } }));

          nodeEditDragRef.current = {
            mode: 'handle',
            segIdx: hitSegIdx,
            handleSide: hitHandleSide,
            startPt: pt,
            pathEl,
            paperPath,
            pageIndex
          };
        }

        suppressClickRef.current = true;
        e.stopPropagation();
        return;
      }

      // Path-line proximity: Check if clicking near path curve segment
      // Use stored screen-space segment midpoints for reliable detection
      const SEG_HIT_RADIUS_PX = 25;
      let hitCurveIdx = -1;
      let hitSeg1Idx = -1;
      let hitSeg2Idx = -1;
      let segMinDist = SEG_HIT_RADIUS_PX;

      for (const seg of nodeEditScreenSegmentsRef.current) {
        // Also compute distance to nearest point along segment by sampling screen positions
        const dist = Math.hypot(e.clientX - seg.mx, e.clientY - seg.my);
        if (dist < segMinDist) {
          segMinDist = dist;
          hitCurveIdx = seg.curveIdx;
          hitSeg1Idx = seg.seg1Idx;
          hitSeg2Idx = seg.seg2Idx;
        }
      }

      // Fallback: use paper.js local distance if screen midpoints didn't find anything
      if (hitCurveIdx === -1) {
        try {
          const nearestLoc = paperPath.getNearestLocation(mousePt);
          if (nearestLoc && nearestLoc.curve) {
            const ctm = pathEl.getScreenCTM();
            const scale = ctm ? Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) : 1;
            const screenDist = nearestLoc.distance * scale;
            if (screenDist <= SEG_HIT_RADIUS_PX) {
              const curves = getPaperCurves(paperPath);
              const segments = getPaperSegments(paperPath);
              hitCurveIdx = curves.indexOf(nearestLoc.curve);
              hitSeg1Idx = segments.indexOf(nearestLoc.curve.segment1);
              hitSeg2Idx = segments.indexOf(nearestLoc.curve.segment2);
            }
          }
        } catch (_) { }
      }

      if (hitCurveIdx !== -1 && hitSeg1Idx !== -1 && hitSeg2Idx !== -1) {
        const curves = getPaperCurves(paperPath);
        const segments = getPaperSegments(paperPath);
        const curve = curves[hitCurveIdx];
        if (curve) {
          if (e.ctrlKey) {
            // Ctrl + drag on segment in Node Edit Mode: Bend the line into a curve!
            nodeEditDragRef.current = {
              mode: 'segment-bend',
              curveIndex: hitCurveIdx,
              startPt: pt,
              startHandle1: curve.segment1.handleOut.clone(),
              startHandle2: curve.segment2.handleIn.clone(),
              pathEl,
              paperPath,
              pageIndex
            };
          } else {
            // Regular click: select both endpoint nodes (plus co-located nodes) and allow moving the segment
            const selSet = new Set([hitSeg1Idx, hitSeg2Idx]);
            [hitSeg1Idx, hitSeg2Idx].forEach(idx => {
              if (segments[idx]) {
                const p = segments[idx].point;
                segments.forEach((s, sIdx) => {
                  if (Math.hypot(s.point.x - p.x, s.point.y - p.y) < 3.0) {
                    selSet.add(sIdx);
                    s.point.x = p.x;
                    s.point.y = p.y;
                  }
                });
              }
            });

            nodeEditSelectedHandleSideRef.current = 'line';
            nodeEditSelectedCurveIdxRef.current = hitCurveIdx;
            nodeEditSelectedSegIndicesRef.current = selSet;
            nodeEditSelectedSegIdxRef.current = hitSeg1Idx;
            drawNodeEditOverlay(pathEl, paperPath, pageIndex);
            const distinctCount = getDistinctNodes(paperPath, selSet).length;
            const canJoin = checkCanJoinNodes(paperPath, selSet);
            // Detect actual curve type from segment handles instead of always dispatching 'custom'
            const curveSeg1 = segments[hitSeg1Idx];
            let curveNodeType = 'custom';
            if (curveSeg1) {
              if (curveSeg1.nodeType) {
                curveNodeType = curveSeg1.nodeType;
              } else if (!curveSeg1.handleIn.isZero() && !curveSeg1.handleOut.isZero()) {
                const dot = curveSeg1.handleIn.normalize().dot(curveSeg1.handleOut.normalize());
                curveNodeType = (dot < -0.90)
                  ? (Math.abs(curveSeg1.handleIn.length - curveSeg1.handleOut.length) < 4.0 ? 'balanced' : 'smooth')
                  : 'custom';
              } else if (curveSeg1.handleIn.isZero() && curveSeg1.handleOut.isZero()) {
                curveNodeType = 'sharp';
              }
            }
            window.dispatchEvent(new CustomEvent('node-selected', { detail: { nodeType: curveNodeType, selectedCount: distinctCount, canJoin, isLineSelected: true } }));

            // Store initial positions of all segment endpoint nodes (and co-located nodes)
            const startPoints = {};
            selSet.forEach(idx => {
              if (segments[idx]) {
                startPoints[idx] = segments[idx].point.clone();
              }
            });

            nodeEditDragRef.current = {
              mode: 'segment-translate',
              curveIndex: hitCurveIdx,
              seg1Idx: hitSeg1Idx,
              seg2Idx: hitSeg2Idx,
              startPt: pt,
              startPoints,
              pathEl,
              paperPath,
              pageIndex
            };
          }
        }

        suppressClickRef.current = true;
        e.stopPropagation();
        return;
      }

      // Clicked outside all nodes and path → exit Node Edit Mode
      const pIdx = nodeEditPageIndexRef.current;
      exitNodeEditMode();
      if (pathEl && pathEl.ownerSVGElement && updatePageHtml) {
        saveModifiedPageHtml(pIdx, pathEl.ownerSVGElement);
      }
      return;
    }



    // ── Creation Tool: Text (Type) Tool ─────────────────────────────────────────
    if (activeMainTool === 'type') {
      let parentEl = resolveTargetParentForCreation(svg, e.clientX, e.clientY);
      if (!parentEl) return;

      const pt = getLocalPoint(svg, parentEl, e.clientX, e.clientY);

      if (parentEl) {
        const id = `text-${Math.random().toString(36).substr(2, 9)}`;
        const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        const ptToMmScale = 0.2645833333333333;
        fo.setAttribute('id', id);
        // Scale the local x,y,width,height inversely so it renders at the mouse cursor
        fo.setAttribute('x', pt.x / ptToMmScale);
        fo.setAttribute('y', pt.y / ptToMmScale);
        fo.setAttribute('width', '170');
        fo.setAttribute('height', '30');
        fo.setAttribute('transform', `matrix(${ptToMmScale} 0 0 ${ptToMmScale} 0 0)`);
        fo.setAttribute('fill', '#000000');
        fo.setAttribute('stroke', 'none');
        fo.setAttribute('stroke-width', '0');
        fo.setAttribute('font-family', "'Outfit', sans-serif");
        fo.setAttribute('font-size', '24');
        fo.setAttribute('letter-spacing', '0');
        fo.setAttribute('data-auto-wrap', 'false');
        fo.setAttribute('data-sizing-mode', 'auto-width');
        fo.setAttribute('data-type', 'text');

        const div = document.createElement('div');
        div.style.width = 'max-content'; // Allows scrollWidth to perfectly match text
        div.style.minHeight = '100%';
        div.style.color = '#000000';
        div.style.fontFamily = "'Outfit', sans-serif";
        div.style.fontSize = '24px';
        div.style.fontWeight = 'normal';
        div.style.fontStyle = 'normal';
        div.style.textDecoration = 'none';
        div.style.textAlign = 'left';
        div.style.lineHeight = '1.2';
        div.style.letterSpacing = '0px';
        div.style.wordBreak = 'normal';
        div.style.overflowWrap = 'anywhere';
        div.style.whiteSpace = 'nowrap'; // Auto-width defaults to no wrapping
        div.style.padding = '0px';
        div.style.margin = '0';
        div.style.boxSizing = 'border-box';
        div.style.outline = 'none';
        div.style.background = 'transparent';
        div.style.userSelect = 'none';
        div.style.pointerEvents = 'none';

        div.innerText = 'Type your text';
        fo.appendChild(div);

        parentEl.appendChild(fo);

        if (updatePageHtml) {
          saveModifiedPageHtml(pageIndex, svg);
          window.dispatchEvent(new CustomEvent('expand-layer-parent', { detail: { id: id } }));
          if (setActiveMainTool) setActiveMainTool('select');
          window.dispatchEvent(new CustomEvent('select-layer', { detail: { layerId: id } }));
        }

        skipClearSelectionRef.current = true;

        setTimeout(() => {
          if (setActiveMainTool) setActiveMainTool('select');

          if (setSelectedLayerId) {
            setSelectedLayerId(id);
            selectedLayerIdRef.current = id;
          }
          if (setMultiSelectedIds) {
            setMultiSelectedIds(new Set([id]));
            multiSelectedIdsRef.current = new Set([id]);
          }

          // Highlight it instantly
          const mountedText = container.querySelector(`[id="${id}"]`);
          if (mountedText) {
            drawOverlayHighlight(mountedText, 'selected');
            // Enter edit mode immediately for newly created text and fully select it
            enterTextEditMode(mountedText, null, null, true);
          }

          suppressClickRef.current = false;
        }, 100);

        suppressClickRef.current = true;
      }
      return;
    }

    // ── Pen/Pencil Tool Drawing (Only on Active Page) ─────────────────────────────
    if (activeMainTool === 'pen' && pageIndex === activePageIndex) {
      if (selectedPenTool === 'pencil') {
        const parentEl = resolveTargetParentForCreation(svg, e.clientX, e.clientY);
        if (!parentEl) return;
        const pt = getLocalPoint(svg, parentEl, e.clientX, e.clientY);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const id = `pencil-${Math.random().toString(36).substr(2, 9)}`;
        path.setAttribute('id', id);
        path.setAttribute('data-type', 'vector-path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#000000');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('shape-rendering', 'geometricPrecision');
        path.setAttribute('d', `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`);

        parentEl.appendChild(path);
        drawingPathRef.current = path;
        drawingPointsRef.current = [{ x: pt.x, y: pt.y }];
        drawingPageIndexRef.current = pageIndex;
        drawingSvgRef.current = svg;
        isFreehandDrawingRef.current = true;
        suppressClickRef.current = true;
        return;
      }

      // Vectra Pen Tool
      const parentEl = resolveTargetParentForCreation(svg, e.clientX, e.clientY);
      if (!parentEl) return;
      const pt = getLocalPoint(svg, parentEl, e.clientX, e.clientY);

      const vSession = vectraPenSessionRef.current;

      // Create or reuse an existing SVG <path> element for the Pen session
      let pathEl = drawingPathRef.current;
      if (!pathEl || !pathEl.parentElement || !pathEl.ownerSVGElement) {
        let existingTarget = nodeEditModeRef.current ? nodeEditPathRef.current : null;

        if (existingTarget && existingTarget.getAttribute('d')) {
          pathEl = existingTarget;
          drawingPathRef.current = pathEl;
          drawingPageIndexRef.current = pageIndex;
          drawingSvgRef.current = svg;

          if (vSession.paths.size === 0) {
            loadDIntoVectraSession(pathEl.getAttribute('d'), vSession, paperScopeRef.current);
          }
        } else {
          const id = `vpath-${Math.random().toString(36).substr(2, 9)}`;
          pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          pathEl.setAttribute('id', id);
          pathEl.setAttribute('data-type', 'vector-path');
          pathEl.setAttribute('data-name', 'Vector Path');
          pathEl.setAttribute('fill', 'none');
          pathEl.setAttribute('stroke', '#000000');
          pathEl.setAttribute('stroke-width', '2');
          pathEl.setAttribute('stroke-linecap', 'round');
          pathEl.setAttribute('stroke-linejoin', 'round');
          pathEl.setAttribute('shape-rendering', 'geometricPrecision');
          parentEl.appendChild(pathEl);
          drawingPathRef.current = pathEl;
          drawingPageIndexRef.current = pageIndex;
          drawingSvgRef.current = svg;
        }
      }

      vSession.onDown(e, pt);

      // Update single <path> element's d attribute with ALL paths in vSession
      const comboD = pathToDCombo(vSession.paths);
      if (comboD) {
        pathEl.setAttribute('d', comboD);
      }

      // Render overlay showing ALL nodes for ALL paths currently in vSession
      renderVectraOverlay(pageIndex, pathEl.parentElement || parentEl, vSession);
      suppressClickRef.current = true;
      return;
    }

    // ── Shapes Tool Drawing (Only on Active Page) ──────────────────────────────
    if (activeMainTool === 'shapes' && pageIndex === activePageIndex) {
      let parentEl = resolveTargetParentForCreation(svg, e.clientX, e.clientY);
      if (!parentEl) return;
      const pt = getLocalPoint(svg, parentEl, e.clientX, e.clientY);

      if (parentEl) {
        let shape;
        const id = `shape-${Math.random().toString(36).substr(2, 9)}`;

        switch (selectedShapeTool) {
          case 'rectangle':
          case 'free-frame':
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', pt.x);
            shape.setAttribute('y', pt.y);
            shape.setAttribute('width', '0');
            shape.setAttribute('height', '0');
            break;
          case 'circle':
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            shape.setAttribute('cx', pt.x);
            shape.setAttribute('cy', pt.y);
            shape.setAttribute('rx', '0');
            shape.setAttribute('ry', '0');
            break;
          case 'line':
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            shape.setAttribute('x1', pt.x);
            shape.setAttribute('y1', pt.y);
            shape.setAttribute('x2', pt.x);
            shape.setAttribute('y2', pt.y);
            break;
          case 'polygon':
          case 'star':
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            shape.setAttribute('d', `M ${pt.x} ${pt.y}`);
            shape.setAttribute('data-cx', pt.x);
            shape.setAttribute('data-cy', pt.y);
            shape.setAttribute('data-count', selectedShapeTool === 'polygon' ? '3' : '5');
            shape.setAttribute('data-ratio', '40');
            shape.setAttribute('data-shape-type', selectedShapeTool);
            break;
        }

        if (shape) {
          shape.setAttribute('id', id);
          if (selectedShapeTool === 'line') {
            shape.setAttribute('fill', 'none');
            shape.setAttribute('stroke', '#000000');
            shape.setAttribute('stroke-width', '1');
          } else if (selectedShapeTool === 'free-frame') {
            const zoomScale = zoom / 100;
            shape.setAttribute('fill', 'transparent');
            shape.setAttribute('stroke', '#000000');
            shape.setAttribute('stroke-width', String(1 / zoomScale));
            shape.setAttribute('stroke-dasharray', `${4 / zoomScale},${4 / zoomScale}`);
            shape.setAttribute('data-interaction', 'open-link');
            shape.setAttribute('data-interaction-value', '');
            shape.setAttribute('data-drawing', 'true');
          } else {
            shape.setAttribute('fill', '#d0ccff');
            shape.setAttribute('stroke', 'none');
            shape.setAttribute('stroke-width', '0');
          }
          shape.setAttribute('data-name', selectedShapeTool === 'free-frame' ? 'Free Frame' : `${selectedShapeTool} ${id.substr(0, 4)}`);
          shape.setAttribute('data-type', 'shape');

          parentEl.appendChild(shape);
          drawingShapeRef.current = shape;
          shapeStartPointRef.current = pt;
          drawingPageIndexRef.current = pageIndex;
          drawingSvgRef.current = svg;
          suppressClickRef.current = true;
        }
      }
      return;
    }

    if (!['select', 'upload', 'grid', 'element'].includes(activeMainTool)) return;

    // Automatically close panels when interacting with the canvas
    if ((activeMainTool === 'grid' || activeMainTool === 'element') && typeof setActiveMainTool === 'function') {
      setActiveMainTool('select');
    }

    // ── Update Active Page on MouseDown ─────────────────────────────────────
    if (setActivePageIndex && activePageIndex !== pageIndex) {
      setActivePageIndex(pageIndex);
    }


    // 1. Identify level candidates and check if click hit any (including gaps)
    let candidates = [];
    let effectiveFrameId = currentFrameIdRef.current;

    if (effectiveFrameId) {
      const frameEl = svg.querySelector(`[id="${effectiveFrameId}"]`);
      candidates = frameEl ? getDirectChildFrames(frameEl) : [];
    } else {
      candidates = getTopLevelFrames(svg);
    }

    let hitCandidate = null;
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (hitTest(candidates[i], e.clientX, e.clientY, 2)) {
        hitCandidate = candidates[i];
        break;
      }
    }

    const topFrames = getTopLevelFrames(svg);
    if (!hitCandidate || topFrames.some(f => f.id === hitCandidate.id)) {
      const leafTarget = getDraggableElement(e.target, svg);
      if (leafTarget) {
        const leafIsBase = topFrames.some(f => f.id === leafTarget.id);
        if (!leafIsBase && leafTarget.getAttribute('data-name') !== 'Overlay') {
          hitCandidate = leafTarget;
        }
      }
    }

    // ── NEW: Check if we hit ANY already-selected element's bounding box ──────────
    let hitAnySelected = false;
    const currentMultiIds = multiSelectedIdsRef.current;
    if (currentMultiIds.size > 0) {
      for (const id of currentMultiIds) {
        const el = svg.querySelector(`[id="${id}"]`);
        if (el && hitTest(el, e.clientX, e.clientY, 2)) {
          hitAnySelected = true;
          break;
        }
      }
    }

    let hitMultiSelectionGap = false;
    if (currentMultiIds.size > 1 && !hitAnySelected) {
      const pageContainer = e.currentTarget.closest('.page-svg-container');
      const multiPoly = pageContainer?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi-selection-bounds') || pageContainer?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi');
      if (multiPoly) {
        const polyRect = multiPoly.getBoundingClientRect();
        if (e.clientX >= polyRect.left && e.clientX <= polyRect.right &&
          e.clientY >= polyRect.top && e.clientY <= polyRect.bottom) {
          hitMultiSelectionGap = true;
        }
      }
    }

    const hitBaseFrame = hitCandidate && topFrames.some(f => f.id === hitCandidate.id);

    // 2. Selection/Drag Priority
    // If we hit any valid child candidate OR any already-selected element OR the multi-selection gap, 
    // don't start a marquee. Return early to allow interactjs to handle dragging.
    if ((hitCandidate && !hitBaseFrame || hitAnySelected || hitMultiSelectionGap) && !e.ctrlKey && selectedSelectToolRef.current !== 'direct') {
      return;
    }

    // 3. Marquee Start Detection
    let hitSelectedImage = false;
    if (hitAnySelected && currentMultiIds.size === 1) {
      const id = Array.from(currentMultiIds)[0];
      const el = svg.querySelector(`[id="${id}"]`);
      if (el && (el.getAttribute('data-type') === 'image' || el.tagName.toLowerCase() === 'image')) {
        hitSelectedImage = true;
      }
    }

    // Start marquee if user holds Ctrl (unless clicking a selected image) OR if they clicked on the background/base frame
    // (Also start if Shift is held so Shift+Drag can draw marquee over elements without Ctrl)
    // Converted flipbooks / Interaction & Animation modules: NEVER start marquee drag-selection
    const isModuleWithoutMarquee = activeTopTool === 'interaction' || activeTopTool === 'animation' || activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation';
    const shouldStartMarquee = !isModuleWithoutMarquee && !isConvertedFlipbook && (((e.ctrlKey || e.shiftKey) && !hitSelectedImage) || ((!hitCandidate || hitBaseFrame) && selectedSelectToolRef.current !== 'direct' && !isEditingTextRef.current));

    if (shouldStartMarquee) {
      const rect = container.getBoundingClientRect();
      const scale = zoom / 100;
      const startX = (e.clientX - rect.left) / scale;
      const startY = (e.clientY - rect.top) / scale;

      marqueeDataRef.current = { startX, startY, containerRect: rect, scale };

      // Cache candidates and their bounding boxes for the marquee operation
      let marqueeCandidates = candidates.filter(el => {
        const isOverlay = el.getAttribute('data-name') === 'Overlay';
        const isBasePage = topFrames.some(f => f.id === el.id);
        const isPdfBg = el.getAttribute('data-name')?.includes('PDF Background') || el.getAttribute('data-type') === 'pdf-vector-layer';
        const isShield = el.getAttribute('data-name') === 'Document Shield' || el.getAttribute('data-type') === 'shield';
        if (isConvertedFlipbook) {
          const isHotspot = el.getAttribute('data-is-hotspot') === 'true' || el.getAttribute('data-type') === 'hotspot';
          const isFreeFrame = el.getAttribute('data-name') === 'Free Frame';
          const isShape = el.getAttribute('data-type') === 'shape';
          const isIcon = el.getAttribute('data-type') === 'icon';
          return isHotspot || isFreeFrame || isShape || isIcon;
        }
        return !isOverlay && !isBasePage && !isPdfBg && !isShield;
      });

      marqueeCandidatesRef.current = marqueeCandidates.map(el => ({
        id: el.id,
        rect: el.getBoundingClientRect()
      }));

      setMarquee({ pageIndex });

      const activeRef = marqueeOverlayRef1; // Single page is always container 1
      if (activeRef.current) {
        Object.assign(activeRef.current.style, {
          display: 'none',  // Keep hidden until hasDragged is confirmed in mousemove
          left: `${startX}px`,
          top: `${startY}px`,
          width: '0px',
          height: '0px'
        });
      }
      return;
    }
  };

  // ── FIGMA-STYLE MOUSE MOVE: hover highlight & Marquee update ─────────────────
  const handleSvgMouseMove = (pageIndex, e) => {
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, target: e.target };
    if (isAltPressedRef.current && selectedLayerIdRef.current) {
      if (drawMeasurementOverlayRef.current && !document.querySelector('[data-dragging="true"]')) {
        drawMeasurementOverlayRef.current(e.target, e.clientX, e.clientY);
      }
    }

    // ── NODE EDIT MODE: Drag node(s), handle, or line segment ─────────────────
    if (nodeEditDragRef.current) {
      const { mode, segIdx, handleSide, pathEl, paperPath, startPt, startPoints, curveIndex, startHandle1, startHandle2 } = nodeEditDragRef.current;
      const svgEl = pathEl.ownerSVGElement;
      if (!svgEl) return;
      const pt = getLocalPoint(svgEl, pathEl, e.clientX, e.clientY);
      paperScopeRef.current.activate();
      const mousePoint = new paperScopeRef.current.Point(pt.x, pt.y);
      const delta = mousePoint.subtract(new paperScopeRef.current.Point(startPt.x, startPt.y));

      if (mode === 'node') {
        if (startPoints && Object.keys(startPoints).length > 0) {
          Object.keys(startPoints).forEach(sIdxStr => {
            const sIdx = parseInt(sIdxStr);
            const seg = paperPath?.segments?.[sIdx];
            if (seg && startPoints[sIdx]) {
              seg.point = startPoints[sIdx].add(delta);
            }
          });
        } else {
          const seg = paperPath?.segments?.[segIdx];
          if (seg) seg.point = mousePoint;
        }
      } else if (mode === 'handle') {
        const seg = paperPath?.segments?.[segIdx];
        if (seg) {
          applyHandleDrag(seg, handleSide, mousePoint, e.altKey);
        }
      } else if (mode === 'segment-bend') {
        const curve = paperPath?.curves?.[curveIndex];
        if (curve && startHandle1 && startHandle2) {
          curve.segment1.handleOut = startHandle1.add(delta.multiply(0.5));
          curve.segment2.handleIn = startHandle2.add(delta.multiply(-0.5));
        }
      }

      if (paperPath?.pathData) {
        pathEl.setAttribute('d', paperPath.pathData);
        drawNodeEditOverlay(pathEl, paperPath, nodeEditPageIndexRef.current);
      }
      suppressClickRef.current = true;
      return;
    }

    // ── NODE EDIT MODE: Hover Segment Highlight ────────────────
    if (nodeEditModeRef.current && nodeEditPathRef.current && nodeEditPaperPathRef.current && !nodeEditDragRef.current && activeMainTool !== 'pen') {
      const SEG_HIT_RADIUS_PX = 22;
      let hoverCurveIdx = -1;
      let minSegDist = SEG_HIT_RADIUS_PX;

      for (const seg of nodeEditScreenSegmentsRef.current) {
        const dist = Math.hypot(e.clientX - seg.mx, e.clientY - seg.my);
        if (dist < minSegDist) {
          minSegDist = dist;
          hoverCurveIdx = seg.curveIdx;
        }
      }

      if (hoverCurveIdx !== nodeEditHoverCurveIdxRef.current) {
        nodeEditHoverCurveIdxRef.current = hoverCurveIdx;
        drawNodeEditOverlay(nodeEditPathRef.current, nodeEditPaperPathRef.current, nodeEditPageIndexRef.current);
      }
    }

    // ── Ctrl + Click Bending Update ──
    if (bendingStateRef.current) {
      const { pathEl, paperPath, curveIndex, pageIndex: activePageIdx } = bendingStateRef.current;
      const svg = pathEl.ownerSVGElement;
      const pt = getLocalPoint(svg, pathEl, e.clientX, e.clientY);

      paperScopeRef.current.activate();
      const curve = paperPath?.curves?.[curveIndex];
      if (curve) {
        const mousePoint = new paperScopeRef.current.Point(pt.x, pt.y);

        // Symmetrical bending logic: point handles towards mouse
        const p1 = curve.segment1.point;
        const p2 = curve.segment2.point;

        // Factor of 0.45 creates a natural-looking bow that passes near the cursor
        curve.segment1.handleOut = mousePoint.subtract(p1).multiply(0.45);
        curve.segment2.handleIn = mousePoint.subtract(p2).multiply(0.45);

        pathEl.setAttribute('d', paperPath.pathData);
      }
      drawBendingNodes(activePageIdx, pathEl, paperPath, curveIndex);

      // ── SYNC WITH PEN TOOL STATE ──
      // If this path is part of an active drawing session, we must update the handles in drawingSubPathsRef
      // otherwise finalize/redraw (like pressing Enter) will recalculate automated curves and lose the bend.
      const subPathIdx = drawingSubPathElsRef.current.indexOf(pathEl);
      if (subPathIdx !== -1) {
        const subPath = drawingSubPathsRef.current[subPathIdx];
        const p1Ref = subPath[curveIndex];
        const p2Ref = subPath[(curveIndex + 1) % subPath.length];

        p1Ref.handleOut = { x: curve.segment1.handleOut.x, y: curve.segment1.handleOut.y };
        p2Ref.handleIn = { x: curve.segment2.handleIn.x, y: curve.segment2.handleIn.y };
      }

      suppressClickRef.current = true;
      return;
    }

    // ── Handle Dragging Logic ───────────────────────────────────────────────
    if (handleDraggingStateRef.current) {
      const { pathEl, paperPath, curveIndex, handleSide, pageIndex: activePageIdx } = handleDraggingStateRef.current;
      const svg = pathEl.ownerSVGElement;
      const pt = getLocalPoint(svg, pathEl, e.clientX, e.clientY);

      paperScopeRef.current.activate();
      const curve = paperPath.curves[curveIndex];
      const mousePoint = new paperScopeRef.current.Point(pt.x, pt.y);

      if (handleSide === 'out') {
        curve.segment1.handleOut = mousePoint.subtract(curve.segment1.point);
      } else {
        curve.segment2.handleIn = mousePoint.subtract(curve.segment2.point);
      }

      pathEl.setAttribute('d', paperPath.pathData);
      drawBendingNodes(activePageIdx, pathEl, paperPath, curveIndex);

      // Sync with Pen session points
      const subPathIdx = drawingSubPathElsRef.current.indexOf(pathEl);
      if (subPathIdx !== -1) {
        const subPath = drawingSubPathsRef.current[subPathIdx];
        if (handleSide === 'out') {
          subPath[curveIndex].handleOut = { x: curve.segment1.handleOut.x, y: curve.segment1.handleOut.y };
        } else {
          subPath[(curveIndex + 1) % subPath.length].handleIn = { x: curve.segment2.handleIn.x, y: curve.segment2.handleIn.y };
        }
      }

      suppressClickRef.current = true;
      return;
    }

    // ── Freehand Pencil Update (During Drag) ──────────
    if (isFreehandDrawingRef.current && drawingPathRef.current) {
      const svg = drawingSvgRef.current || (e.currentTarget.closest('.page-svg-container')?.querySelector('svg'));
      if (!svg) return;
      const pt = getLocalPoint(svg, drawingPathRef.current.parentElement, e.clientX, e.clientY);

      const lastPt = drawingPointsRef.current[drawingPointsRef.current.length - 1];
      if (lastPt && Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) < 1.5) return;

      drawingPointsRef.current.push(pt);
      const d = formatSmoothPathD(drawingPointsRef.current);
      drawingPathRef.current.setAttribute('d', d);
      suppressClickRef.current = true;
      return;
    }

    // ── Vectra Pen Tool Update & Hover Preview ──────────
    if (activeMainTool === 'pen' && selectedPenTool === 'pen') {
      const pageContainer = e.currentTarget.closest('.page-svg-container');
      const svg = drawingSvgRef.current || (pageContainer?.querySelector('svg'));
      if (svg) {
        const parentEl = drawingPathRef.current?.parentElement || resolveTargetParentForCreation(svg, e.clientX, e.clientY);
        if (parentEl) {
          const pt = getLocalPoint(svg, parentEl, e.clientX, e.clientY);
          const vSession = vectraPenSessionRef.current;
          vSession.scale = zoom / 100;

          if (e.buttons & 1) {
            vSession.onDrag(e, pt);
          } else {
            vSession.onHover(e, pt);
          }

          const pathEl = drawingPathRef.current;
          if (pathEl) {
            const comboD = pathToDCombo(vSession.paths);
            if (comboD) pathEl.setAttribute('d', comboD);
          }

          if (pageContainer) {
            pageContainer.classList.remove('cur-pen-close', 'cur-pen-extend', 'cur-snap');
            if (vSession.cursor && vSession.cursor !== 'cur-pen') {
              pageContainer.classList.add(vSession.cursor);
            }
          }

          renderVectraOverlay(pageIndex, parentEl, vSession);
        }
      }
      suppressClickRef.current = true;
      return;
    }

    // ── Shapes Drawing Update ────────────────────────────────────────────────
    if (drawingShapeRef.current) {
      const svg = drawingSvgRef.current;
      const pt = getSvgPoint(svg, e.clientX, e.clientY);
      const start = shapeStartPointRef.current;

      if (pt && start) {
        const shape = drawingShapeRef.current;
        const dx = pt.x - start.x;
        const dy = pt.y - start.y;

        switch (selectedShapeTool) {
          case 'rectangle':
          case 'free-frame': {
            let width = Math.abs(dx);
            let height = Math.abs(dy);
            if (e.shiftKey) {
              const maxDim = Math.max(width, height);
              width = maxDim;
              height = maxDim;
            }
            shape.setAttribute('x', dx < 0 ? start.x - width : start.x);
            shape.setAttribute('y', dy < 0 ? start.y - height : start.y);
            shape.setAttribute('width', width);
            shape.setAttribute('height', height);
            break;
          }
          case 'circle': {
            let rx = Math.abs(dx);
            let ry = Math.abs(dy);
            if (e.shiftKey) {
              const maxR = Math.max(rx, ry);
              rx = maxR;
              ry = maxR;
            }
            shape.setAttribute('rx', rx);
            shape.setAttribute('ry', ry);
            break;
          }
          case 'line': {
            if (e.shiftKey) {
              const absDx = Math.abs(dx);
              const absDy = Math.abs(dy);

              let newDx = 0, newDy = 0;
              if (absDx >= absDy) {
                newDx = dx;
                newDy = 0;
              } else {
                newDx = 0;
                newDy = dy;
              }
              shape.setAttribute('x2', start.x + newDx);
              shape.setAttribute('y2', start.y + newDy);
            } else {
              shape.setAttribute('x2', pt.x);
              shape.setAttribute('y2', pt.y);
            }
            break;
          }
          case 'polygon': {
            const radius = Math.sqrt(dx * dx + dy * dy);
            const sides = parseInt(shape.getAttribute('data-count') || 3);
            const points = [];
            for (let i = 0; i < sides; i++) {
              const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
              points.push(`${start.x + radius * Math.cos(angle)},${start.y + radius * Math.sin(angle)}`);
            }
            shape.setAttribute('d', `M ${points.join(' L ')} Z`);
            shape.setAttribute('data-rx', radius);
            shape.setAttribute('data-ry', radius);
            break;
          }
          case 'star': {
            const rOuter = Math.sqrt(dx * dx + dy * dy);
            const ratio = parseFloat(shape.getAttribute('data-ratio') || 40) / 100;
            const rInner = rOuter * ratio;
            const count = parseInt(shape.getAttribute('data-count') || 5);
            const sides = count * 2;
            const points = [];
            for (let i = 0; i < sides; i++) {
              const r = (i % 2 === 0) ? rOuter : rInner;
              const angle = (Math.PI / count) * i - Math.PI / 2;
              points.push(`${start.x + r * Math.cos(angle)},${start.y + r * Math.sin(angle)}`);
            }
            shape.setAttribute('d', `M ${points.join(' L ')} Z`);
            shape.setAttribute('data-rx', rOuter);
            shape.setAttribute('data-ry', rOuter);
            break;
          }
        }
        suppressClickRef.current = true;
      }
      return;
    }

    const isPenToolActive = activeMainTool === 'pen';
    const isShapes = activeMainTool === 'shapes';
    const isSelectionTool = ['select', 'upload', 'grid'].includes(activeMainTool);
    const allowSelection = isSelectionTool || ((isPenToolActive || isShapes) && pageIndex !== activePageIndex);

    if (!allowSelection) return;
    if (document.querySelector('[data-dragging="true"]')) return;

    const container = e.currentTarget;

    // ── MARQUEE UPDATE ──
    const isModuleWithoutMarquee = activeTopTool === 'interaction' || activeTopTool === 'animation' || activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation';
    if (marqueeRef.current && !isConvertedFlipbook && !isModuleWithoutMarquee) {
      const { startX, startY, containerRect, scale } = marqueeDataRef.current;
      const curX = (e.clientX - containerRect.left) / scale;
      const curY = (e.clientY - containerRect.top) / scale;

      if (!marqueeDataRef.current.hasDragged) {
        const dx = curX - startX;
        const dy = curY - startY;
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
          return;
        }
        marqueeDataRef.current.hasDragged = true;
        // Only make the overlay visible once we've confirmed a real drag gesture
        const revealRef = marqueeOverlayRef1;
        if (revealRef.current) {
          revealRef.current.style.display = 'block';
        }
      }

      const x = Math.min(curX, startX);
      const y = Math.min(curY, startY);
      const width = Math.abs(curX - startX);
      const height = Math.abs(curY - startY);

      // Direct DOM update for marquee box - avoids React re-render lag
      const activeRef = marqueeOverlayRef1;
      if (activeRef.current) {
        activeRef.current.style.left = `${x}px`;
        activeRef.current.style.top = `${y}px`;
        activeRef.current.style.width = `${width}px`;
        activeRef.current.style.height = `${height}px`;
      }

      updateMarqueeSelection(x, y, width, height, containerRect, scale);
      return;
    }

    const svg = container.querySelector('svg');
    if (!svg) return;

    // Clear all hover states
    svg.querySelectorAll('[data-hovered="true"]').forEach(el => el.removeAttribute('data-hovered'));
    svg.querySelectorAll('[data-child-hovered="true"]').forEach(el => el.removeAttribute('data-child-hovered'));
    clearOverlayType('hover');
    clearOverlayType('child-hover');

    // ── Converted Flipbook Mode (PDF, DOC, PPT): Only hover user-added Frames or Hotspots ──
    if (isConvertedFlipbook) {
      let hoverTarget = null;
      let curr = e.target;
      while (curr && curr !== svg) {
        if (curr.getAttribute) {
          const isHotspot = curr.getAttribute('data-is-hotspot') === 'true' || curr.getAttribute('data-type') === 'hotspot';
          const isFreeFrame = curr.getAttribute('data-name') === 'Free Frame';
          const isShape = curr.getAttribute('data-type') === 'shape';
          const isIcon = curr.getAttribute('data-type') === 'icon';
          const isShield = curr.getAttribute('data-name') === 'Document Shield' || curr.getAttribute('data-type') === 'shield';
          if (isShield) {
            hoverTarget = null;
            break;
          }
          if (isHotspot || isFreeFrame || isShape || isIcon) {
            hoverTarget = curr;
            break;
          }
        }
        curr = curr.parentElement || curr.parentNode;
      }

      if (hoverTarget && hoverTarget.id && selectedLayerIdRef.current !== hoverTarget.id) {
        hoverTarget.setAttribute('data-hovered', 'true');
        drawOverlayHighlight(hoverTarget, 'hover');
      }
      return;
    }

    // ── Direct selection mode: hover the deepest element with an ID ──────────
    if (selectedSelectTool === 'direct') {
      const target = getDraggableElement(e.target, svg);
      if (target && target.id && target.tagName.toLowerCase() !== 'svg') {
        if (!multiSelectedIdsRef.current.has(target.id) && selectedLayerIdRef.current !== target.id) {
          target.setAttribute('data-hovered', 'true');
          drawOverlayHighlight(target, 'child-hover');
        }
        return;
      }
    }

    const effectiveFrameId = currentFrameIdRef.current;

    if (effectiveFrameId) {
      // ── Inside a frame: hover its direct children ──
      const frameEl = svg.querySelector(`[id="${effectiveFrameId}"]`);
      if (frameEl) {
        const children = getDirectChildFrames(frameEl);
        for (let i = children.length - 1; i >= 0; i--) {
          if (hitTest(children[i], e.clientX, e.clientY)) {
            // Only hover if not already selected
            if (!multiSelectedIdsRef.current.has(children[i].id) && selectedLayerIdRef.current !== children[i].id) {
              children[i].setAttribute('data-child-hovered', 'true');
              drawOverlayHighlight(children[i], 'child-hover');
            }
            return;
          }
        }

        // Falling outside current frame context: highlight top-level elements
        if (!hitTest(frameEl, e.clientX, e.clientY)) {
          const topLevelEls = getTopLevelFrames(svg);
          for (let i = topLevelEls.length - 1; i >= 0; i--) {
            if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
              // Only hover if not already selected
              if (!multiSelectedIdsRef.current.has(topLevelEls[i].id) && selectedLayerIdRef.current !== topLevelEls[i].id) {
                topLevelEls[i].setAttribute('data-hovered', 'true');
                drawOverlayHighlight(topLevelEls[i], 'hover');
              }
              return;
            }
          }
        }
      }
    } else {
      // ── Top-level: hover top-level frames ──
      const topLevelEls = getTopLevelFrames(svg);
      for (let i = topLevelEls.length - 1; i >= 0; i--) {
        if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
          // Only hover if not already selected
          if (!multiSelectedIdsRef.current.has(topLevelEls[i].id) && selectedLayerIdRef.current !== topLevelEls[i].id) {
            topLevelEls[i].setAttribute('data-hovered', 'true');
            drawOverlayHighlight(topLevelEls[i], 'hover');
          }
          return;
        }
      }
    }
  };

  // ── MARQUEE SELECTION LOGIC (Optimized) ──
  const updateMarqueeSelection = (mx, my, mw, mh, containerRect, scale) => {
    const newSelectedIds = new Set();

    marqueeCandidatesRef.current.forEach(item => {
      const { id, rect: elRect } = item;

      const relElRect = {
        left: (elRect.left - containerRect.left) / scale,
        top: (elRect.top - containerRect.top) / scale,
        right: (elRect.right - containerRect.left) / scale,
        bottom: (elRect.bottom - containerRect.top) / scale
      };

      const intersects = !(
        mx > relElRect.right ||
        mx + mw < relElRect.left ||
        my > relElRect.bottom ||
        my + mh < relElRect.top
      );

      if (intersects) {
        newSelectedIds.add(id);
      }
    });

    // Avoid state updates if selection is identical
    if (!setsAreEqual(newSelectedIds, multiSelectedIdsRef.current)) {
      multiSelectedIdsRef.current = newSelectedIds;
      setMultiSelectedIds(newSelectedIds);
      const primary = Array.from(newSelectedIds)[newSelectedIds.size - 1];
      selectedLayerIdRef.current = primary || null;
      setSelectedLayerId(primary || null);
    }
  };

  // ── FIGMA-STYLE GLOBAL MOUSE UP (Handles end of marquee) ─────────────────────
  // ── FIGMA-STYLE GLOBAL MOUSE UP (Handles end of marquee or tool drawing) ────────────────
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      // ── Node Edit Mode: Finalize node drag ──
      if (nodeEditDragRef.current) {
        const { pathEl, pageIndex: nePageIndex } = nodeEditDragRef.current;
        nodeEditDragRef.current = null;
        if (pathEl && pathEl.ownerSVGElement && updatePageHtml) {
          saveModifiedPageHtml(nePageIndex, pathEl.ownerSVGElement);
        }
        setTimeout(() => { suppressClickRef.current = false; }, 50);
        return;
      }

      // ── Bending/Handle Dragging Finalization ──
      const activeState = (bendingStateRef.current || handleDraggingStateRef.current);
      if (activeState) {
        const { pathEl, paperPath, curveIndex, pageIndex } = activeState;
        const svgEl = pathEl.ownerSVGElement;
        if (svgEl && updatePageHtml) {
          saveModifiedPageHtml(pageIndex, svgEl);
        }
        activeBendingSegmentRef.current = { pathEl, paperPath, curveIndex, pageIndex };
        bendingStateRef.current = null;
        handleDraggingStateRef.current = null;
        return;
      }

      if (activeMainTool === 'pen' && selectedPenTool === 'pen') {
        const vSession = vectraPenSessionRef.current;
        vSession.onUp();
        if (drawingPathRef.current) {
          const comboD = pathToDCombo(vSession.paths);
          if (comboD) drawingPathRef.current.setAttribute('d', comboD);
          if (drawingPathRef.current.parentElement) {
            renderVectraOverlay(activePageIndex, drawingPathRef.current.parentElement, vSession);
          }
        }
      }

      // Termination for drag-based pen tools (Pencil)
      if (drawingPathRef.current) {
        const points = drawingPointsRef.current;
        const tool = selectedPenTool;

        draggedNodeIndexRef.current = { pIdx: -1, ptIdx: -1 };

        if (tool === 'pencil') {
          const path = drawingPathRef.current;
          const pageIdx = drawingPageIndexRef.current;
          const svgEl = path?.ownerSVGElement;

          if (points.length <= 1 && path) {
            const pt = points[0] || { x: 0, y: 0 };
            path.setAttribute('d', `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)} L ${(pt.x + 0.1).toFixed(2)} ${pt.y.toFixed(2)}`);
          } else if (points.length > 1 && path) {
            const simplified = points.filter((_, i) => i % 2 === 0 || i === points.length - 1);
            const ptsToUse = simplified.length > 2 ? simplified : points;
            const pathData = formatSmoothPathD(ptsToUse);
            path.setAttribute('d', pathData);
          }
          path?.setAttribute('shape-rendering', 'geometricPrecision');

          if (svgEl && updatePageHtml) {
            updatePageHtml(pageIdx, svgEl.outerHTML);
            if (path && path.id) {
              window.dispatchEvent(new CustomEvent('expand-layer-parent', { detail: { id: path.id } }));

              // Auto-select newly created path
              if (setSelectedLayerId) {
                setSelectedLayerId(path.id);
                selectedLayerIdRef.current = path.id;
              }
              if (setMultiSelectedIds) {
                setMultiSelectedIds(new Set([path.id]));
                multiSelectedIdsRef.current = new Set([path.id]);
              }
              if (path) drawOverlayHighlight(path, 'selected');
            }
          }

          // Switch back to selection tool
          skipClearSelectionRef.current = true;
          setTimeout(() => {
            if (setActiveMainTool) setActiveMainTool('select');
            suppressClickRef.current = false;
          }, 100);

          drawingPathRef.current = null;
          drawingPointsRef.current = [];
          drawingPageIndexRef.current = null;
          drawingSvgRef.current = null;
          isFreehandDrawingRef.current = false;
          clearPenToolNodes(pageIdx);
        }

        return;
      }

      // Termination for Shape tools
      if (drawingShapeRef.current) {
        const shape = drawingShapeRef.current;
        const pageIdx = drawingPageIndexRef.current;
        const svgEl = shape?.ownerSVGElement;

        if (shape.getAttribute('data-name') === 'Free Frame') {
          shape.removeAttribute('data-drawing');
        }

        const start = shapeStartPointRef.current;
        if (start && svgEl && e) {
          const pt = getSvgPoint(svgEl, e.clientX, e.clientY);
          if (pt && Math.hypot(pt.x - start.x, pt.y - start.y) < 2) {
            const type = shape.getAttribute('data-shape-type') || shape.tagName.toLowerCase();

            if (type === 'rect' || type === 'free-frame' || shape.tagName.toLowerCase() === 'rect') {
              shape.setAttribute('x', start.x - 15);
              shape.setAttribute('y', start.y - 15);
              shape.setAttribute('width', 30);
              shape.setAttribute('height', 30);
            } else if (type === 'circle' || type === 'ellipse' || shape.tagName.toLowerCase() === 'ellipse') {
              shape.setAttribute('cx', start.x);
              shape.setAttribute('cy', start.y);
              shape.setAttribute('rx', 15);
              shape.setAttribute('ry', 15);
            } else if (type === 'line' || shape.tagName.toLowerCase() === 'line') {
              shape.setAttribute('x1', start.x - 15);
              shape.setAttribute('y1', start.y - 15);
              shape.setAttribute('x2', start.x + 15);
              shape.setAttribute('y2', start.y + 15);
            } else if (type === 'polygon' || type === 'star') {
              const radius = 15;
              const isStar = type === 'star';
              const count = isStar ? parseInt(shape.getAttribute('data-count') || 5) : parseInt(shape.getAttribute('data-count') || 3);
              const sides = isStar ? count * 2 : count;
              const points = [];
              for (let i = 0; i < sides; i++) {
                let r = radius;
                if (isStar && i % 2 !== 0) {
                  const ratio = parseFloat(shape.getAttribute('data-ratio') || 40) / 100;
                  r = radius * ratio;
                }
                const angle = (isStar ? (Math.PI / count) : (2 * Math.PI / count)) * i - Math.PI / 2;
                points.push(`${start.x + r * Math.cos(angle)},${start.y + r * Math.sin(angle)}`);
              }
              shape.setAttribute('d', `M ${points.join(' L ')} Z`);
              shape.setAttribute('data-rx', radius);
              shape.setAttribute('data-ry', radius);
            }
          }
        }

        // Store original aspect ratio
        try {
          if (shape && typeof shape.getBBox === 'function') {
            const bbox = shape.getBBox();
            if (bbox.width > 0 && bbox.height > 0) {
              shape.setAttribute('data-original-aspect-ratio', (bbox.width / bbox.height).toString());
            } else {
              shape.setAttribute('data-original-aspect-ratio', '1');
            }
          }
        } catch (e) {
          // ignore error if getBBox fails
        }

        drawingShapeRef.current = null;
        shapeStartPointRef.current = null;
        drawingPageIndexRef.current = null;
        drawingSvgRef.current = null;

        if (svgEl && updatePageHtml) {
          updatePageHtml(pageIdx, svgEl.outerHTML);
          if (shape && shape.id) {
            window.dispatchEvent(new CustomEvent('expand-layer-parent', { detail: { id: shape.id } }));
            if (setSelectedLayerId) {
              setSelectedLayerId(shape.id);
              selectedLayerIdRef.current = shape.id;
            }
            if (setMultiSelectedIds) {
              setMultiSelectedIds(new Set([shape.id]));
              multiSelectedIdsRef.current = new Set([shape.id]);
            }
          }
          skipClearSelectionRef.current = true;
          setTimeout(() => {
            if (setActiveMainTool) setActiveMainTool('select');
            suppressClickRef.current = false;
          }, 100);
        } else {
          setTimeout(() => {
            suppressClickRef.current = false;
          }, 100);
        }
        return;
      }

      // Termination for Marquee Selection
      if (marqueeDataRef.current) {
        setMarquee(null);
        if (marqueeOverlayRef1.current) marqueeOverlayRef1.current.style.display = 'none';
        if (marqueeOverlayRef2.current) marqueeOverlayRef2.current.style.display = 'none';

        if (marqueeDataRef.current.hasDragged) {
          suppressClickRef.current = true;
          setTimeout(() => {
            suppressClickRef.current = false;
          }, 100);
        }
        marqueeDataRef.current = null;
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [selectedPenTool, activeMainTool, updatePageHtml, setActiveMainTool, setSelectedLayerId]);

  // ── FIGMA-STYLE MOUSE LEAVE: clear all hovers ─────────────────────────────────
  const handleSvgMouseLeave = (e) => {
    const container = e.currentTarget.closest('.page-svg-container') || e.currentTarget;
    const svg = container.querySelector('svg');
    if (svg) {
      svg.querySelectorAll('[data-hovered="true"]').forEach(el => el.removeAttribute('data-hovered'));
      svg.querySelectorAll('[data-child-hovered="true"]').forEach(el => el.removeAttribute('data-child-hovered'));
      clearOverlayType('hover');
      clearOverlayType('child-hover');
    }
  };

  // ── Helper: convert SVG <text> element to <foreignObject> for Figma-style editing ──
  const convertTextToForeignObject = (el) => {
    if (!el || el.tagName.toLowerCase() !== 'text') return null;

    const bbox = el.getBBox();
    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.id = el.id;

    // Copy all attributes except positional/size/clip ones (we'll set those from bbox, and clip-path causes issues on resize)
    Array.from(el.attributes).forEach(attr => {
      if (!['x', 'y', 'width', 'height', 'clip-path'].includes(attr.name)) {
        fo.setAttribute(attr.name, attr.value);
      }
    });

    fo.setAttribute('data-auto-wrap', 'true');
    fo.setAttribute('data-type', 'text');
    fo.setAttribute('x', bbox.x);
    fo.setAttribute('y', bbox.y);
    fo.setAttribute('width', Math.max(bbox.width, 10) + 0.1); // 2px micro-buffer to prevent Chrome zoom wrap bugs without altering layout
    fo.setAttribute('height', Math.max(bbox.height, 10));
    fo.setAttribute('overflow', 'visible');
    // Preserve transform if any
    const transform = el.getAttribute('transform');
    if (transform) fo.setAttribute('transform', transform);

    const div = document.createElement('div');
    const isScrollable = el.getAttribute('data-scrollable') === 'true';
    div.style.width = '100%';
    div.style.minHeight = '100%';
    if (isScrollable) {
      div.style.overflowY = 'auto';
      div.style.overflowX = 'hidden';
    }
    div.style.color = el.getAttribute('fill') || '#000000';
    div.style.fontFamily = el.getAttribute('font-family') || 'Inter, sans-serif';
    div.style.fontSize = (el.getAttribute('font-size') || '10') + 'px';
    div.style.fontWeight = el.style.fontWeight || el.getAttribute('font-weight') || 'normal';
    div.style.fontStyle = el.style.fontStyle || el.getAttribute('font-style') || 'normal';
    div.style.textDecoration = el.style.textDecoration || el.getAttribute('text-decoration') || 'none';
    const textAnchor = el.style.textAlign || el.getAttribute('text-anchor') || 'start';
    div.style.textAlign = textAnchor === 'middle' ? 'center' : (textAnchor === 'end' ? 'right' : 'left');
    div.style.lineHeight = el.getAttribute('data-line-height') || '1';
    div.style.letterSpacing = el.style.letterSpacing || el.getAttribute('letter-spacing') || '';
    div.style.wordSpacing = el.style.wordSpacing || el.getAttribute('word-spacing') || '';
    div.style.wordBreak = 'normal';
    div.style.overflowWrap = 'anywhere';
    const sizingMode = el.getAttribute('data-sizing-mode') || 'auto-height';
    // Use pre-wrap to allow paragraphs to reflow correctly (unless auto-width)
    div.style.whiteSpace = sizingMode === 'auto-width' ? 'nowrap' : 'pre-wrap';
    div.style.padding = '0px'; // Push down 1.5px and right 1px to match SVG baseline
    div.style.margin = '0';
    div.style.boxSizing = 'border-box';
    div.style.outline = 'none';
    div.style.background = 'transparent';
    div.style.userSelect = 'none';
    div.style.pointerEvents = 'none';

    if (!isScrollable) {
      if (sizingMode === 'fixed') {
        div.style.display = 'block';
      } else {
        // Vertically center the text to match SVG bbox placement and prevent upward shift
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.justifyContent = 'center';
      }
    }

    // Smart tspan-to-lines conversion: group tspans by Y coordinate change
    const tspans = Array.from(el.querySelectorAll('tspan'));
    if (tspans.length > 0) {
      let linesData = [];
      let currentLineTspans = [];
      let lastY = null;
      let lineHeights = [];

      const fontSizeStr = el.getAttribute('font-size') || el.style.fontSize;
      const fontSize = parseFloat(fontSizeStr) || 10;

      tspans.forEach((t, i) => {
        const y = t.getAttribute('y');
        const dy = t.getAttribute('dy');
        const isNewLine = i > 0 && (dy || (y !== null && lastY !== null && Math.abs(parseFloat(y) - parseFloat(lastY)) > 2));

        if (isNewLine) {
          let deltaY = null;
          if (dy) {
            if (dy.endsWith('em')) deltaY = parseFloat(dy) * fontSize;
            else deltaY = parseFloat(dy);
          } else if (y !== null && lastY !== null) {
            deltaY = Math.abs(parseFloat(y) - parseFloat(lastY));
          }
          if (deltaY !== null && !isNaN(deltaY) && deltaY > 0) {
            // Ignore massive jumps (e.g. paragraph gaps) so they don't inflate the average line-height
            if (deltaY < fontSize * 3) {
              lineHeights.push(deltaY);
            }
          }
        }

        if (isNewLine) {
          linesData.push(currentLineTspans);
          currentLineTspans = [];
        }
        currentLineTspans.push(t);
        if (y !== null) lastY = y;
      });
      if (currentLineTspans.length > 0) {
        linesData.push(currentLineTspans);
      }

      // Apply dynamic line height if multiple tspans exist and data-line-height is absent
      if (!el.hasAttribute('data-line-height') && lineHeights.length > 0) {
        // Use the minimum deltaY instead of the average to prevent paragraph breaks from inflating the line-height
        const minPx = Math.min(...lineHeights);
        div.style.lineHeight = (minPx / fontSize).toFixed(2);
      }

      let linesBounds = linesData.map(lineTspans => {
        let minX = Infinity;
        let maxX = -Infinity;
        let textContent = '';
        lineTspans.forEach(t => {
          try {
            const x = parseFloat(t.getAttribute('x'));
            if (!isNaN(x)) {
              const w = t.getComputedTextLength ? t.getComputedTextLength() : t.textContent.length * (fontSize * 0.5);
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x + w);
            } else {
              const b = t.getBBox();
              minX = Math.min(minX, b.x);
              maxX = Math.max(maxX, b.x + b.width);
            }
          } catch (e) { }
          textContent += t.textContent;
        });
        return { minX, maxX, textContent };
      });

      const validBounds = linesBounds.filter(l => l.minX !== Infinity && l.maxX !== -Infinity);
      const globalMinX = validBounds.length > 0 ? Math.min(...validBounds.map(l => l.minX)) : 0;
      const globalMaxX = validBounds.length > 0 ? Math.max(...validBounds.map(l => l.maxX)) : 0;

      // Chrome's getBBox() often incorrectly includes trailing whitespace or newlines, inflating the width.
      // We override it here with the exact calculated mathematical bounds of the ink to ensure perfect wrapping.
      if (validBounds.length > 0) {
        const trueWidth = globalMaxX - globalMinX;
        fo.setAttribute('x', globalMinX);
        fo.setAttribute('width', Math.max(trueWidth, 10) + 0.5);
      }

      let detectedAlign = 'left';
      if (validBounds.length > 1) {
        let leftMatchCount = 0;
        let rightMatchCount = 0;
        let centerMatchCount = 0;
        const tolerance = fontSize * 0.8;

        validBounds.forEach(l => {
          if (Math.abs(l.minX - globalMinX) < tolerance) leftMatchCount++;
          if (Math.abs(globalMaxX - l.maxX) < tolerance) rightMatchCount++;
          const mid = (l.minX + l.maxX) / 2;
          const gMid = (globalMinX + globalMaxX) / 2;
          if (Math.abs(mid - gMid) < tolerance) centerMatchCount++;
        });

        const thresh = Math.max(1, validBounds.length * 0.8);

        if (centerMatchCount >= thresh) {
          detectedAlign = 'center';
        } else if (rightMatchCount >= thresh && leftMatchCount < thresh) {
          detectedAlign = 'right';
        } else if (leftMatchCount >= thresh && validBounds.length > 1) {
          // Strict justify detection: All "full lines" must perfectly hit the right edge
          let fullLineCount = 0;
          let justifiedFullLineCount = 0;
          const strictTolerance = 3; // 3 pixels max deviation for a true justified edge

          validBounds.forEach((l, idx) => {
            const isLastInParagraph = (idx === validBounds.length - 1) || (l.maxX < globalMaxX - (fontSize * 2.0));
            if (!isLastInParagraph) {
              fullLineCount++;
              if (Math.abs(globalMaxX - l.maxX) <= strictTolerance) {
                justifiedFullLineCount++;
              }
            }
          });

          if (fullLineCount > 0 && justifiedFullLineCount >= fullLineCount * 0.9) {
            detectedAlign = 'justify';
          } else {
            detectedAlign = 'left';
          }
        } else {
          detectedAlign = 'left';
        }
      }

      // Paragraph reconstruction
      let htmlContent = '';
      for (let i = 0; i < linesBounds.length; i++) {
        const l = linesBounds[i];
        let text = l.textContent.replace(/[\r\n]+/g, ' '); // Strip literal newlines because pre-wrap will render them, causing double newlines
        let isHardBreak = true;

        if (i < linesBounds.length - 1 && l.minX !== Infinity) {
          const lineWidth = l.maxX - l.minX;
          const globalWidth = globalMaxX - globalMinX;
          if (lineWidth > globalWidth - (fontSize * 2.5)) {
            isHardBreak = false;
          }
        }

        htmlContent += text;
        if (i < linesBounds.length - 1) {
          if (isHardBreak) {
            htmlContent = htmlContent.replace(/\s+$/, '') + '<br/>';
          } else {
            if (!text.endsWith(' ') && !text.endsWith('-')) {
              htmlContent += ' ';
            }
          }
        }
      }
      div.innerHTML = htmlContent;

      const textAnchor = el.getAttribute('text-anchor');
      const textAlignStyle = el.style.textAlign;

      // Use visual detection as primary truth for paragraphs, since exporters 
      // often just use text-anchor="start" and manually position lines.
      let finalAlign = detectedAlign;

      if (textAlignStyle && ['left', 'center', 'right', 'justify'].includes(textAlignStyle)) {
        finalAlign = textAlignStyle;
      } else if (textAnchor === 'middle') {
        finalAlign = 'center';
      } else if (textAnchor === 'end') {
        finalAlign = 'right';
      }

      div.style.textAlign = finalAlign;

    } else {
      div.textContent = el.textContent || '';
      const textAnchor = el.style.textAlign || el.getAttribute('text-anchor') || 'start';
      const finalAlign = textAnchor === 'middle' ? 'center' : (textAnchor === 'end' ? 'right' : 'left');
      div.style.textAlign = finalAlign;
    }

    fo.appendChild(div);
    return fo;
  };

  // ── Helper: set single selection and clear multi-selection ───────────────────
  const setSingleSelection = (id) => {
    if (setSelectedLayerId) {
      setSelectedLayerId(id);
      selectedLayerIdRef.current = id;
    }

    const newSet = id ? new Set([id]) : new Set();
    multiSelectedIdsRef.current = newSet;
    setMultiSelectedIds(newSet);

    if (newSet.size <= 1) {
      document.querySelectorAll('.overlay-type-multi-child-selected').forEach(el => el.remove());
    }

    // ── Figma-style: auto-convert <text> to <foreignObject> on first selection ──
    // This ensures resize handles, click-to-edit, and style panel all work correctly
    if (id) {
      const el = document.getElementById(id);
      if (el && el.tagName.toLowerCase() === 'text') {
        const fo = convertTextToForeignObject(el);
        if (fo) {
          el.replaceWith(fo);

          // Auto-snap height to perfectly fit the HTML text
          requestAnimationFrame(() => {
            const div = fo.firstElementChild;
            if (div) {
              const ch = div.scrollHeight;
              const currentH = parseFloat(fo.getAttribute('height')) || 0;

              if (ch > 0 && Math.abs(ch - currentH) > 2) {
                fo.setAttribute('height', ch);
              }

              // Force interact.js/overlays to redraw bounds
              const event = new Event('resize');
              window.dispatchEvent(event);

              // Explicitly redraw the highlight now that the FO has painted
              drawOverlayHighlight(fo, 'selected');
            }
          });

          // Save the conversion so it persists
          const svg = fo.ownerSVGElement;
          const container = fo.closest('.page-svg-container');
          if (container && svg) {
            const pageIdx = parseInt(container.getAttribute('data-page-index'));
            // Use a microtask so React state settles before saving
            requestAnimationFrame(() => saveModifiedPageHtml(pageIdx, svg));
          }
        }
      }
    }
  };


  const enterTextEditMode = (target, clientX = null, clientY = null, selectAll = false) => {
    if (!target || !target.id) return;
    if (activeTopTool === 'interaction' || activeTopTool === 'animation') return;
    if (target.closest('[data-type="button"]')) return;

    let foTarget = target;

    // If the target is a raw <text> element, convert it to foreignObject first
    if (target.tagName.toLowerCase() === 'text' || target.tagName.toLowerCase() === 'tspan') {
      const textEl = target.tagName.toLowerCase() === 'tspan' ? target.closest('text') : target;
      if (!textEl) return;
      const fo = convertTextToForeignObject(textEl);
      if (!fo) return;
      textEl.replaceWith(fo);
      foTarget = fo;

      // Explicitly redraw the highlight now that the FO is in the DOM
      requestAnimationFrame(() => {
        const highlightType = document.querySelector(`[id="overlay-poly-child-selected-${foTarget.id}"]`) ? 'child-selected' : 'selected';
        drawOverlayHighlight(foTarget, highlightType);
      });

      // Update selection to reflect new FO id (same as original text id)
      if (setSelectedLayerId) setSelectedLayerId(fo.id);
      selectedLayerIdRef.current = fo.id;
      if (setMultiSelectedIds) {
        setMultiSelectedIds(new Set([fo.id]));
        multiSelectedIdsRef.current = new Set([fo.id]);
      }
    }

    if (foTarget.tagName.toLowerCase() !== 'foreignobject') return;

    let div = foTarget.firstElementChild;
    if (!div) return;
    if (div.classList.contains('flipbook-text-outer')) {
      const scrollbarDiv = div.querySelector('.flipbook-text-scrollbar');
      if (scrollbarDiv) div = scrollbarDiv;
    }

    isEditingTextRef.current = true;
    const svgRoot = foTarget.ownerSVGElement;

    // Set cursor for the wrapper container
    const svgContainer = foTarget.closest('.page-svg-container');
    if (svgContainer) {
      const divWrapper = svgContainer.querySelector('div');
      if (divWrapper) divWrapper.style.cursor = 'text';
    }

    // Keep the main selection overlay but remove the corner dots
    document.querySelectorAll('.selection-overlay-layer .resize-handle').forEach(h => h.remove());
    document.querySelectorAll('[id^="highlight-overlay-html-"] .resize-handle').forEach(h => h.remove());

    clearOverlayType('hover');
    clearOverlayType('child-hover');

    // Mark as editing
    foTarget.setAttribute('data-editing', 'true');
    div.setAttribute('contenteditable', 'true');
    div.style.outline = 'none';
    div.style.userSelect = 'text';
    div.style.pointerEvents = 'auto';
    div.style.cursor = 'text';

    const stopScrollPropagation = (e) => {
      e.stopPropagation();
    };
    div.addEventListener('mousedown', stopScrollPropagation);
    div.addEventListener('pointerdown', stopScrollPropagation);
    div.addEventListener('touchstart', stopScrollPropagation);
    div.addEventListener('wheel', stopScrollPropagation);

    const handleInput = () => {
      const isAutoWrap = foTarget.getAttribute('data-auto-wrap') !== 'false';
      const sizingMode = foTarget.getAttribute('data-sizing-mode') || 'auto-height';
      const isScrollable = foTarget.getAttribute('data-scrollable') === 'true';

      if (!isScrollable) {
        const oldHeight = div.style.height;
        const oldMinHeight = div.style.minHeight;
        const oldWidth = div.style.width;

        // Temporarily allow height to shrink to measure true text height
        div.style.setProperty('height', 'auto', 'important');
        div.style.setProperty('min-height', '0px', 'important');

        if (sizingMode === 'auto-width') {
          div.style.setProperty('width', 'max-content', 'important');
        }

        const contentH = div.scrollHeight;
        const contentW = div.scrollWidth;

        div.style.setProperty('height', oldHeight || '100%', 'important');
        div.style.setProperty('min-height', oldMinHeight || '100%', 'important');
        if (sizingMode === 'auto-width') {
          div.style.setProperty('width', oldWidth || '100%', 'important');
        }

        const foH = parseFloat(foTarget.getAttribute('height')) || 0;
        const foW = parseFloat(foTarget.getAttribute('width')) || 0;
        const currentX = parseFloat(foTarget.getAttribute('x')) || 0;

        let changed = false;

        if (sizingMode === 'auto-width' && Math.abs(contentW - foW) > 2) {
          const widthDiff = contentW - foW;
          const align = window.getComputedStyle(div).textAlign;
          foTarget.setAttribute('width', Math.max(contentW + 4, 10));
          if (align === 'center') {
            foTarget.setAttribute('x', currentX - (widthDiff / 2));
          } else if (align === 'right' || align === 'end') {
            foTarget.setAttribute('x', currentX - widthDiff);
          }
          changed = true;
        }

        if (sizingMode !== 'fixed' && Math.abs(contentH - foH) > 2) {
          foTarget.setAttribute('height', contentH + 4);
          changed = true;
        }

        // Always ensure the selection overlay highlight precisely encloses the current element
        const highlightType = document.querySelector(`[id="overlay-poly-child-selected-${foTarget.id}"]`) ? 'child-selected' : 'selected';
        const container = foTarget.closest('.page-svg-container');
        if (container) {
          const pageIdx = container.getAttribute('data-page-index');
          const overlay = document.getElementById(`highlight-overlay-${pageIdx}`);
          if (overlay) {
            const oldSel = overlay.querySelector(`[id="overlay-poly-selected-${foTarget.id}"]`);
            if (oldSel) oldSel.remove();
            const oldChildSel = overlay.querySelector(`[id="overlay-poly-child-selected-${foTarget.id}"]`);
            if (oldChildSel) oldChildSel.remove();
          }
        }
        drawOverlayHighlight(foTarget, highlightType);
        clearOverlayType('hover');
        clearOverlayType('child-hover');

        // Also redraw parent group's entered overlay to prevent the dashed line from sticking in the middle
        const parentGroup = foTarget.closest('g');
        if (parentGroup && parentGroup.getAttribute('data-name') === 'Group') {
          const overlayNode = document.querySelector(`[id="overlay-poly-entered-${parentGroup.id}"]`);
          if (overlayNode) {
            overlayNode.remove();
            drawOverlayHighlight(parentGroup, 'entered');
          }
        }
      }
    };
    div.addEventListener('input', handleInput);
    div.focus();

    // Immediately trigger a resize so it precisely shrink-wraps the initial text
    handleInput();

    // Place cursor at the clicked position using caretRangeFromPoint if coords are available
    // Otherwise fall back to end of text
    const placeCaretAtClick = (cx, cy) => {
      let placed = false;
      if (selectAll) {
        const range = document.createRange();
        range.selectNodeContents(div);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        placed = true;
      } else if (cx !== null && cy !== null) {
        // Standard (Chrome/Edge/Safari)
        if (document.caretRangeFromPoint) {
          const clickRange = document.caretRangeFromPoint(cx, cy);
          if (clickRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(clickRange);
            placed = true;
          }
          // Firefox
        } else if (document.caretPositionFromPoint) {
          const pos = document.caretPositionFromPoint(cx, cy);
          if (pos) {
            const range = document.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            placed = true;
          }
        }
      }
      if (!placed) {
        // Fallback: move to end
        const range = document.createRange();
        range.selectNodeContents(div);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    };

    // Use a tiny timeout so the browser has fully rendered the contenteditable before we place the caret
    setTimeout(() => placeCaretAtClick(clientX, clientY), 0);

    // ── Google Docs-Style Spell & Grammar Checker & Suggestion Popup ──
    div.setAttribute('spellcheck', 'true');

    let grammarCheckTimer = null;
    let activeSuggestionPopup = null;

    const closeSuggestionPopup = () => {
      if (activeSuggestionPopup) {
        activeSuggestionPopup.remove();
        activeSuggestionPopup = null;
      }
    };

    const runSpellGrammarCheck = () => {
      if (!isEditingTextRef.current) return;
      if (foTarget.getAttribute('data-grammar-check') === 'false') {
        div.querySelectorAll('mark.grammar-issue-word').forEach(m => {
          m.replaceWith(document.createTextNode(m.textContent || ''));
        });
        return;
      }
      const text = div.innerText || div.textContent || '';
      if (!text || text.trim().length === 0) return;

      const issues = checkSpellingAndGrammar(text);

      // Save cursor position
      let selOffset = 0;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const preRange = range.cloneRange();
        preRange.selectNodeContents(div);
        preRange.setEnd(range.startContainer, range.startOffset);
        selOffset = preRange.toString().length;
      }

      // 1. Unwrap existing mark tags in-place while keeping text intact
      const existingMarks = Array.from(div.querySelectorAll('mark.grammar-issue-word'));
      existingMarks.forEach(m => {
        const parent = m.parentNode;
        while (m.firstChild) {
          parent.insertBefore(m.firstChild, m);
        }
        m.remove();
        parent.normalize();
      });

      if (issues.length === 0) {
        handleInput();
        return;
      }

      // 2. Wrap matching incorrect words in-place without altering any line breaks or DOM tree
      const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT, null, false);
      const textNodes = [];
      let n;
      while ((n = walker.nextNode())) {
        if (n.nodeValue && n.nodeValue.length > 0) {
          textNodes.push(n);
        }
      }

      // Track global text offset across text nodes
      let runningOffset = 0;
      for (const textNode of textNodes) {
        const nodeText = textNode.nodeValue;
        const nodeStart = runningOffset;
        const nodeEnd = runningOffset + nodeText.length;

        // Find issues that fall strictly within this text node
        const nodeIssues = issues.filter(iss => iss.startIndex >= nodeStart && iss.endIndex <= nodeEnd)
          .sort((a, b) => b.startIndex - a.startIndex); // Process backwards so offsets remain valid

        for (const iss of nodeIssues) {
          const relStart = iss.startIndex - nodeStart;
          const relEnd = iss.endIndex - nodeStart;

          const word = nodeText.substring(relStart, relEnd);
          const cls = iss.type === 'spelling' ? 'grammar-issue-word issue-spelling' : 'grammar-issue-word issue-grammar';
          const suggData = encodeURIComponent(JSON.stringify(iss.suggestions || []));
          const msg = encodeURIComponent(iss.message || '');

          try {
            const range = document.createRange();
            range.setStart(textNode, relStart);
            range.setEnd(textNode, relEnd);

            const mark = document.createElement('mark');
            mark.className = cls;
            mark.setAttribute('data-word', word);
            mark.setAttribute('data-suggestions', suggData);
            mark.setAttribute('data-message', msg);
            range.surroundContents(mark);
          } catch (e) {}
        }

        runningOffset = nodeEnd;
      }

      // Restore caret position
      restoreCaretPosition(div, selOffset);

      // Re-measure content to ensure text frame and selection boundary precisely enclose all wrapped lines
      handleInput();
    };

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function restoreCaretPosition(container, targetOffset) {
      try {
        let currentOffset = 0;
        let targetNode = null;
        let nodeOffset = 0;

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
          const len = node.nodeValue.length;
          if (currentOffset + len >= targetOffset) {
            targetNode = node;
            nodeOffset = targetOffset - currentOffset;
            break;
          }
          currentOffset += len;
        }

        if (targetNode) {
          const newRange = document.createRange();
          newRange.setStart(targetNode, Math.min(nodeOffset, targetNode.nodeValue.length));
          newRange.collapse(true);
          const s = window.getSelection();
          if (s) {
            s.removeAllRanges();
            s.addRange(newRange);
          }
        }
      } catch (err) {}
    }

    const showSuggestionPopup = (markEl, clientX, clientY) => {
      closeSuggestionPopup();

      const word = markEl.getAttribute('data-word') || markEl.textContent;
      let suggestions = [];
      try {
        suggestions = JSON.parse(decodeURIComponent(markEl.getAttribute('data-suggestions') || '[]'));
      } catch (e) {}

      if (suggestions.length === 0) {
        suggestions = getSpellingSuggestions(word);
      }

      let message = '';
      try {
        message = decodeURIComponent(markEl.getAttribute('data-message') || '');
      } catch (e) {}

      const rect = markEl.getBoundingClientRect();
      const popup = document.createElement('div');
      popup.className = 'grammar-suggestion-popup';
      popup.style.top = `${rect.bottom + 6}px`;
      popup.style.left = `${Math.max(10, Math.min(window.innerWidth - 220, rect.left))}px`;

      let headerText = markEl.classList.contains('issue-grammar') ? 'Grammar' : 'Spelling';
      let html = `<div class="grammar-suggestion-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${markEl.classList.contains('issue-grammar') ? '#1a73e8' : '#ea4335'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <span>${headerText}</span>
      </div>`;

      if (suggestions.length > 0) {
        suggestions.forEach((sugg, idx) => {
          html += `<div class="grammar-suggestion-item" data-suggestion="${sugg}">
            <span>${sugg}</span>
            <span class="suggestion-action-label">${idx === 0 ? 'Accept' : ''}</span>
          </div>`;
        });
      } else {
        html += `<div style="padding: 8px 12px; font-size: 12px; color: #5f6368;">No suggestions available</div>`;
      }

      html += `<div class="grammar-suggestion-footer">
        <button class="grammar-suggestion-ignore" id="docs-btn-ignore">Ignore</button>
        <span style="font-size: 11px; color: #80868b;">${word}</span>
      </div>`;

      popup.innerHTML = html;
      document.body.appendChild(popup);
      activeSuggestionPopup = popup;

      // Handle suggestion clicks
      popup.querySelectorAll('.grammar-suggestion-item').forEach(item => {
        item.addEventListener('mousedown', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const chosen = item.getAttribute('data-suggestion');
          if (chosen === '(Delete word)') {
            markEl.remove();
          } else {
            markEl.replaceWith(document.createTextNode(chosen));
          }
          closeSuggestionPopup();
          handleInput();
        });
      });

      // Handle ignore
      const ignoreBtn = popup.querySelector('#docs-btn-ignore');
      if (ignoreBtn) {
        ignoreBtn.addEventListener('mousedown', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          markEl.replaceWith(document.createTextNode(word));
          closeSuggestionPopup();
        });
      }
    };

    const handleTextClick = (e) => {
      const mark = e.target.closest('mark.grammar-issue-word');
      if (mark) {
        e.stopPropagation();
        showSuggestionPopup(mark, e.clientX, e.clientY);
      } else {
        closeSuggestionPopup();
      }
    };
    div.addEventListener('click', handleTextClick);

    const debounceCheck = () => {
      clearTimeout(grammarCheckTimer);
      grammarCheckTimer = setTimeout(() => {
        runSpellGrammarCheck();
      }, 700);
    };

    div.addEventListener('keyup', (e) => {
      // Don't trigger on arrow navigation keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Backspace' || e.key === '.') {
        debounceCheck();
      }
    });

    // Run initial spell & grammar check after initial text paints
    setTimeout(runSpellGrammarCheck, 350);

    const cleanup = () => {
      isEditingTextRef.current = false;
      closeSuggestionPopup();
      clearTimeout(grammarCheckTimer);

      // Strip all mark highlight wrappers to ensure completely clean SVG serialization
      div.querySelectorAll('mark.grammar-issue-word').forEach(m => {
        m.replaceWith(document.createTextNode(m.textContent || ''));
      });

      foTarget.removeAttribute('data-editing');
      div.removeAttribute('contenteditable');
      div.style.outline = 'none';
      div.style.boxShadow = '';
      div.style.userSelect = 'none';
      div.style.pointerEvents = 'none';
      div.style.cursor = '';
      div.classList.remove('text-edit-box');
      div.removeEventListener('blur', handleBlur);
      div.removeEventListener('keydown', handleKeyDown);
      div.removeEventListener('click', handleTextClick);
      div.removeEventListener('mousedown', stopScrollPropagation);
      div.removeEventListener('pointerdown', stopScrollPropagation);
      div.removeEventListener('touchstart', stopScrollPropagation);
      div.removeEventListener('wheel', stopScrollPropagation);
      const s = window.getSelection();
      if (s) s.removeAllRanges();

      // Restore cursor for wrapper
      if (svgContainer) {
        const divWrapper = svgContainer.querySelector('div');
        if (divWrapper) {
          const isPencilActive = activeMainToolRef.current === 'pen' && selectedPenToolRef.current === 'pencil';
          const isPenToolActive = activeMainToolRef.current === 'pen';
          const isShapeActive = activeMainToolRef.current === 'shapes';
          const isTypeActive = activeMainToolRef.current === 'type';
          divWrapper.style.cursor = isPencilActive ? PENCIL_CURSOR : (isPenToolActive ? PEN_CURSOR : (isShapeActive ? SHAPE_CURSOR : (isTypeActive ? TYPE_CURSOR : 'default')));
        }
      }
    };

    const handleBlur = (e) => {
      const activeEl = document.activeElement;
      const isSidebarTarget = activeEl && (
        activeEl.closest('.right-sidebar') ||
        activeEl.closest('#right-sidebar') ||
        activeEl.closest('[data-panel]') ||
        activeEl.closest('.z-50') ||
        activeEl.closest('.text-editor-panel') ||
        activeEl.closest('.color-picker') ||
        activeEl.closest('.grammar-suggestion-popup')
      );

      if (window.__isInteractingWithSidebar || isSidebarTarget) {
        return;
      }

      suppressClickRef.current = true;
      setTimeout(() => { suppressClickRef.current = false; }, 200);

      // Strip grammar marks before saving and sizing
      div.querySelectorAll('mark.grammar-issue-word').forEach(m => {
        m.replaceWith(document.createTextNode(m.textContent || ''));
      });

      const finalContent = div.innerText || '';

      if (finalContent.trim().length === 0) {
        const container = foTarget.closest('.page-svg-container');
        foTarget.remove();
        cleanup();
        const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : activePageIndex;
        const topFrames = svgRoot ? getTopLevelFrames(svgRoot) : [];
        const rootId = (topFrames && topFrames.length > 0 ? topFrames[0].id : pages[pageIdx]?.layers?.[0]?.id);

        if (rootId) {
          if (setSelectedLayerId) setSelectedLayerId(rootId);
          selectedLayerIdRef.current = rootId;
          if (setMultiSelectedIds) {
            setMultiSelectedIds(new Set([rootId]));
            multiSelectedIdsRef.current = new Set([rootId]);
          }
          if (setCurrentFrameId) setCurrentFrameId(rootId);
          currentFrameIdRef.current = rootId;
        } else {
          if (setSelectedLayerId) setSelectedLayerId(null);
          selectedLayerIdRef.current = null;
          if (setMultiSelectedIds) {
            setMultiSelectedIds(new Set());
            multiSelectedIdsRef.current = new Set();
          }
        }
        if (container) saveModifiedPageHtml(pageIdx, svgRoot);
        return;
      }

      // Auto-grow height and width to fit content
      const isAutoWrap = foTarget.getAttribute('data-auto-wrap') !== 'false';
      const sizingMode = foTarget.getAttribute('data-sizing-mode') || 'auto-height';
      const isScrollable = foTarget.getAttribute('data-scrollable') === 'true';

      if (!isScrollable) {
        const oldWidth = div.style.width;
        const oldHeight = div.style.height;
        const oldMinHeight = div.style.minHeight;

        if (sizingMode === 'auto-width') {
          div.style.width = 'max-content';
        }

        // Temporarily allow height to shrink to measure true text height
        div.style.setProperty('height', 'auto', 'important');
        div.style.setProperty('min-height', '0px', 'important');

        const contentW = div.scrollWidth;
        const contentH = div.scrollHeight;

        div.style.width = oldWidth;
        div.style.setProperty('height', oldHeight || '100%', 'important');
        div.style.setProperty('min-height', oldMinHeight || '100%', 'important');

        const currentW = parseFloat(foTarget.getAttribute('width')) || 0;
        const currentH = parseFloat(foTarget.getAttribute('height')) || 0;
        const currentX = parseFloat(foTarget.getAttribute('x')) || 0;

        if (sizingMode === 'auto-width' && Math.abs(contentW - currentW) > 2) {
          const widthDiff = contentW - currentW;
          const align = window.getComputedStyle(div).textAlign;
          foTarget.setAttribute('width', Math.max(contentW + 4, 10));
          if (align === 'center') {
            foTarget.setAttribute('x', currentX - (widthDiff / 2));
          } else if (align === 'right' || align === 'end') {
            foTarget.setAttribute('x', currentX - widthDiff);
          }
        }

        if (sizingMode !== 'fixed' && Math.abs(contentH - currentH) > 2) {
          foTarget.setAttribute('height', contentH + 4);
        }
      }

      cleanup();

      // Re-select the element and redraw handles
      if (foTarget.id) {
        if (setSelectedLayerId) setSelectedLayerId(foTarget.id);
        selectedLayerIdRef.current = foTarget.id;
        if (setMultiSelectedIds) {
          setMultiSelectedIds(new Set([foTarget.id]));
          multiSelectedIdsRef.current = new Set([foTarget.id]);
        }
        drawOverlayHighlight(foTarget, 'selected');
      }

      const container = foTarget.closest('.page-svg-container');
      if (container) saveModifiedPageHtml(parseInt(container.getAttribute('data-page-index')), svgRoot);
    };

    const handleKeyDown = (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSuggestionPopup();
        div.blur();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const node = range.startContainer;

          let lineText = '';
          let walker = document.createTreeWalker(div, NodeFilter.SHOW_ALL, null, false);
          walker.currentNode = node;

          if (node.nodeType === Node.TEXT_NODE) {
            lineText = node.textContent.substring(0, range.startOffset);
          }

          let prev = walker.previousNode();
          while (prev) {
            if (prev.nodeName === 'BR' || prev.nodeName === 'DIV' || prev.nodeName === 'P') break;
            if (prev.nodeType === Node.TEXT_NODE) lineText = prev.textContent + lineText;
            prev = walker.previousNode();
          }

          const bulletMatch = lineText.match(/^\s*(•|-)\s+/);
          const numberMatch = lineText.match(/^\s*(\d+)\.\s+/);

          if (bulletMatch || numberMatch) {
            e.preventDefault();
            let prefix = '';
            let isEmpty = false;

            if (bulletMatch) {
              if (lineText.trim() === bulletMatch[0].trim()) isEmpty = true;
              else prefix = bulletMatch[0].trim() + ' ';
            } else if (numberMatch) {
              if (lineText.trim() === numberMatch[0].trim()) isEmpty = true;
              else {
                const nextNum = parseInt(numberMatch[1], 10) + 1;
                prefix = nextNum + '. ';
              }
            }

            if (isEmpty) {
              const deleteRange = document.createRange();
              deleteRange.setEnd(range.startContainer, range.startOffset);
              let startNode = node;
              let startOffset = 0;
              walker.currentNode = node;
              let p = walker.previousNode();
              while (p) {
                if (p.nodeName === 'BR' || p.nodeName === 'DIV' || p.nodeName === 'P') break;
                if (p.nodeType === Node.TEXT_NODE) {
                  startNode = p;
                  startOffset = 0;
                }
                p = walker.previousNode();
              }
              deleteRange.setStart(startNode, startOffset);
              sel.removeAllRanges();
              sel.addRange(deleteRange);
              document.execCommand('delete', false);
            } else {
              document.execCommand('insertHTML', false, '<br>' + prefix);
            }
          }
        }
      }
    };

    div.addEventListener('blur', handleBlur);
    div.addEventListener('keydown', handleKeyDown);
  };


  // ── FIGMA-STYLE CLICK: hierarchical frame drill-down selection ─────────────────
  const handleSvgClick = (e) => {
    if (e.target.closest('.resize-handle')) return;

    // Allow native text selection/interaction inside actively edited text boxes
    if (e.target.closest('[contenteditable="true"]')) {
      e.stopPropagation();
      return;
    }

    e.stopPropagation();
    e.preventDefault(); // Prevent default browser actions (like following <a> links or downloading) on the canvas

    const now = Date.now();
    const timeSinceLast = now - (lastClickRef.current.time || 0);
    const dx = e.clientX - (lastClickRef.current.x || 0);
    const dy = e.clientY - (lastClickRef.current.y || 0);
    const distance = Math.hypot(dx, dy);

    // A double click must happen within 500ms AND the mouse must not have moved more than 10 pixels
    const isDoubleClick = timeSinceLast > 0 && timeSinceLast < 500 && distance < 10;

    lastClickRef.current = { time: now, target: e.target, x: e.clientX, y: e.clientY };

    if (isDoubleClick) {
      if (activeMainTool === 'pen' && (drawingPathRef.current || vectraPenSessionRef.current?.paths?.size > 0)) {
        const vSession = vectraPenSessionRef.current;
        if (vSession) vSession.finishPath();
        commitAndExitPenDrawing();
        if (typeof setActiveMainTool === 'function') {
          setActiveMainTool('select');
        }
        suppressClickRef.current = false;
        return;
      }
      handleSvgDoubleClick(e);
      return;
    }

    // ── Update Active Page on Click ─────────────────────────────────────────
    const container = e.currentTarget.closest('.page-svg-container');
    if (container) {
      const pageIdx = parseInt(container.getAttribute('data-page-index'));
      if (!isNaN(pageIdx) && setActivePageIndex && activePageIndex !== pageIdx) {
        setActivePageIndex(pageIdx);
      }
    }


    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    const svg = container.querySelector('svg');
    if (!svg) return;

    // Clear hover states immediately on click to prevent overlapping outlines
    svg.querySelectorAll('[data-hovered="true"]').forEach(el => el.removeAttribute('data-hovered'));
    svg.querySelectorAll('[data-child-hovered="true"]').forEach(el => el.removeAttribute('data-child-hovered'));
    clearOverlayType('hover');
    clearOverlayType('child-hover');

    // ── Converted Flipbook Mode (PDF, DOC, PPT): Avoid clicking any path or full page! Only select Frames or Hotspots ──
    if (isConvertedFlipbook) {
      let interactiveTarget = null;

      // Check if clicking an overlay polygon for a selected element
      if (e.target.tagName?.toLowerCase() === 'polygon' && e.target.id?.includes('overlay-poly-')) {
        const polyId = e.target.id.replace(/^overlay-poly-(selected|child-selected|hover|child-hover|entered|multi-child-selected)-/, '');
        const underEl = svg.querySelector(`[id="${polyId}"]`);
        if (underEl) {
          const isHotspot = underEl.getAttribute('data-is-hotspot') === 'true' || underEl.getAttribute('data-type') === 'hotspot';
          const isFreeFrame = underEl.getAttribute('data-name') === 'Free Frame';
          const isShape = underEl.getAttribute('data-type') === 'shape';
          const isIcon = underEl.getAttribute('data-type') === 'icon';
          if (isHotspot || isFreeFrame || isShape || isIcon) {
            interactiveTarget = underEl;
          }
        }
      }

      if (!interactiveTarget) {
        let curr = e.target;
        while (curr && curr !== svg) {
          if (curr.getAttribute) {
            const isHotspot = curr.getAttribute('data-is-hotspot') === 'true' || curr.getAttribute('data-type') === 'hotspot';
            const isFreeFrame = curr.getAttribute('data-name') === 'Free Frame';
            const isShape = curr.getAttribute('data-type') === 'shape';
            const isIcon = curr.getAttribute('data-type') === 'icon';
            const isShield = curr.getAttribute('data-name') === 'Document Shield' || curr.getAttribute('data-type') === 'shield';
            if (isShield) {
              interactiveTarget = null;
              break;
            }
            if (isHotspot || isFreeFrame || isShape || isIcon) {
              interactiveTarget = curr;
              break;
            }
          }
          curr = curr.parentElement || curr.parentNode;
        }
      }

      if (interactiveTarget && interactiveTarget.id) {
        setSingleSelection(interactiveTarget.id);
      } else {
        // Clear selection: avoid clicking any path or full page!
        setSingleSelection(null);
        setCurrentFrameId(null);
        currentFrameIdRef.current = null;
      }
      return;
    }

    // ── Pre-empt polygon clicks (hit area padding) ─────────────────────────────
    let hitMultiSelectionGap = false;
    const currentMultiIds = multiSelectedIdsRef.current;
    if (currentMultiIds.size > 1) {
      const multiPoly = container?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi-selection-bounds') || container?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi');
      if (multiPoly) {
        const polyRect = multiPoly.getBoundingClientRect();
        if (e.clientX >= polyRect.left && e.clientX <= polyRect.right &&
          e.clientY >= polyRect.top && e.clientY <= polyRect.bottom) {
          hitMultiSelectionGap = true;
        }
      }
    }

    if (e.target.tagName.toLowerCase() === 'polygon' && e.target.id?.includes('overlay-poly-')) {
      const polySelectionId = e.target.id.replace(/^overlay-poly-(selected|child-selected|hover|child-hover|entered|multi-child-selected)-/, '');

      if (polySelectionId === 'multi') {
        return;
      }

      if (polySelectionId) {
        if (e.shiftKey && !e.ctrlKey) {
          const currentSet = new Set(multiSelectedIdsRef.current);
          const primaryId = selectedLayerIdRef.current;
          if (primaryId) currentSet.add(primaryId);
          if (currentSet.has(polySelectionId)) {
            currentSet.delete(polySelectionId);
            if (primaryId === polySelectionId) {
              const remaining = [...currentSet];
              const newPrimary = remaining.length > 0 ? remaining[remaining.length - 1] : null;
              if (setSelectedLayerId) {
                setSelectedLayerId(newPrimary);
                selectedLayerIdRef.current = newPrimary;
              }
            }
          } else {
            currentSet.add(polySelectionId);
            if (setSelectedLayerId) {
              setSelectedLayerId(polySelectionId);
              selectedLayerIdRef.current = polySelectionId;
            }
          }
          multiSelectedIdsRef.current = currentSet;
          setMultiSelectedIds(currentSet);
          return;
        }

        // Normal click on polygon
        if (selectedLayerIdRef.current === polySelectionId && multiSelectedIdsRef.current.size <= 1) {
          // Already uniquely selected. Enter text edit mode if text!
          console.log('[handleSvgClick] Polygon clicked for already selected item:', polySelectionId);
          const underlyingEl = svg.querySelector(`[id="${polySelectionId}"]`);
          if (underlyingEl) {
            const tag = underlyingEl.tagName.toLowerCase();
            const isButton = underlyingEl.getAttribute('data-type') === 'button';
            
            if (tag === 'text' || tag === 'tspan' || tag === 'foreignobject') {
              console.log('[handleSvgClick] Entering text edit mode for', underlyingEl);
              enterTextEditMode(underlyingEl, e.clientX, e.clientY);
            } else if (isButton) {
              const textNode = underlyingEl.querySelector('text') || underlyingEl.querySelector('foreignobject');
              if (textNode) {
                console.log('[handleSvgClick] Entering text edit mode for button text', textNode);
                enterTextEditMode(textNode, e.clientX, e.clientY);
              }
            }
          }
          return;
        }

        // Otherwise, select it
        setSingleSelection(polySelectionId);

        // Enter frame context if the element is inside a frame
        const underlyingEl = svg.querySelector(`[id="${polySelectionId}"]`);
        if (underlyingEl) {
          const topFrames = getTopLevelFrames(svg);
          const frameParent = topFrames.find(f => f.contains(underlyingEl));
          if (frameParent) {
            setCurrentFrameId(frameParent.id);
            currentFrameIdRef.current = frameParent.id;
          }
        }
        return;
      }
    }

    // ── Creation Tool: Text (Type) Tool logic removed (moved to mousedown) ──────


    // ── CLICK-OUTSIDE-PREVENTION (if in tools like pen/shapes but not typing) ───
    const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : activePageIndex;
    const isDrawingTool = activeMainTool === 'pen' || activeMainTool === 'shapes';
    const isSelectionTool = ['select', 'upload', 'type', 'grid'].includes(activeMainTool);
    const allowClick = isSelectionTool || (isDrawingTool && pageIdx !== activePageIndex);

    if (!allowClick && !getDraggableElement(e.target, e.currentTarget)) {
      return;
    }

    // ── Ctrl + Shift + Click OR Direct selection tool: deep selection ────────
    if ((e.ctrlKey && e.shiftKey) || selectedSelectTool === 'direct') {
      const target = getDraggableElement(e.target, svg);
      if (target && target.id && target.tagName.toLowerCase() !== 'svg') {
        if (e.shiftKey && selectedSelectTool === 'direct') {
          // Multi-toggle in direct mode
          const currentSet = new Set(multiSelectedIdsRef.current);
          if (currentSet.has(target.id)) {
            currentSet.delete(target.id);
            if (selectedLayerIdRef.current === target.id) {
              const remaining = [...currentSet];
              const newPrimary = remaining.length > 0 ? remaining[remaining.length - 1] : null;
              if (setSelectedLayerId) {
                setSelectedLayerId(newPrimary);
                selectedLayerIdRef.current = newPrimary;
              }
            }
          } else {
            currentSet.add(target.id);
            if (setSelectedLayerId) {
              setSelectedLayerId(target.id);
              selectedLayerIdRef.current = target.id;
            }
          }
          multiSelectedIdsRef.current = currentSet;
          setMultiSelectedIds(currentSet);
          return;
        }

        setSingleSelection(target.id);
        return;
      }
    }

    // ── Shift + Click (no Ctrl): Multi-select toggle ───────────────────────────
    // Works at top-level OR inside an entered frame, but does NOT enter frames.
    if (e.shiftKey && !e.ctrlKey) {
      const frameId = currentFrameIdRef.current;

      // Determine candidate element pool (same as current navigation level)
      let candidates;
      if (frameId) {
        const frameEl = svg.querySelector(`[id="${frameId}"]`);
        candidates = frameEl ? getDirectChildFrames(frameEl) : [];
      } else {
        candidates = getTopLevelFrames(svg);
      }

      // Find the topmost candidate hit at this point
      let hitEl = null;
      for (let i = candidates.length - 1; i >= 0; i--) {
        if (hitTest(candidates[i], e.clientX, e.clientY)) {
          hitEl = candidates[i];
          break;
        }
      }

      if (hitEl) {
        // Toggle this element in/out of the multi-selection
        const currentSet = new Set(multiSelectedIdsRef.current);

        // Always keep the primary selectedLayerId in the set (if it exists)
        const primaryId = selectedLayerIdRef.current;
        if (primaryId) currentSet.add(primaryId);

        if (currentSet.has(hitEl.id)) {
          currentSet.delete(hitEl.id);
          // If we removed the primary, promote another
          if (primaryId === hitEl.id) {
            const remaining = [...currentSet];
            const newPrimary = remaining.length > 0 ? remaining[remaining.length - 1] : null;
            if (setSelectedLayerId) {
              setSelectedLayerId(newPrimary);
              selectedLayerIdRef.current = newPrimary;
            }
          }
        } else {
          currentSet.add(hitEl.id);
          // The most recently shift-clicked element becomes primary
          if (setSelectedLayerId) {
            setSelectedLayerId(hitEl.id);
            selectedLayerIdRef.current = hitEl.id;
          }
        }

        multiSelectedIdsRef.current = currentSet;
        setMultiSelectedIds(currentSet);
      }
      // Shift+Click on empty space does nothing (don't clear multi-selection)
      return;
    }

    // ── Non-shift plain click: always clears multi-selection ─────────────────
    // Reset multi-selection on normal click (will rebuild from single selected)
    const frameId = currentFrameIdRef.current;
    const selId = selectedLayerIdRef.current;

    const effectiveFrameId = frameId;

    // ── Case 1: We are INSIDE an entered frame — INFINITE RECURSIVE DRILL-DOWN ─
    if (effectiveFrameId) {
      const frameEl = svg.querySelector(`[id="${effectiveFrameId}"]`);

      if (frameEl && hitTest(frameEl, e.clientX, e.clientY)) {
        // ── Clicked INSIDE the currently entered frame ──
        const children = getDirectChildFrames(frameEl);
        let clickedChild = null;
        for (let i = children.length - 1; i >= 0; i--) {
          if (hitTest(children[i], e.clientX, e.clientY)) {
            clickedChild = children[i];
            break;
          }
        }

        if (clickedChild) {
          if (selId === clickedChild.id) {
            // ── Already selected this child → try to ENTER it (go deeper)
            const grandchildren = getDirectChildFrames(clickedChild);
            if (grandchildren.length > 0) {
              setCurrentFrameId(clickedChild.id);
              currentFrameIdRef.current = clickedChild.id;
              // Immediately select whichever grandchild was actually hit
              for (let i = grandchildren.length - 1; i >= 0; i--) {
                if (hitTest(grandchildren[i], e.clientX, e.clientY)) {
                  setSingleSelection(grandchildren[i].id);
                  return;
                }
              }
              // Hit the gap inside the child → entered, keep child selected
              return;
            }
            // Child has no sub-frames → stay selected, nothing deeper to enter
            return;
          } else {
            // ── Different child → SELECT it 
            setSingleSelection(clickedChild.id);
          }
        } else {
          // Check if we hit a non-frame element (text, shape, path) inside this entered frame
          let target = getDraggableElement(e.target, e.currentTarget);

          if (e.target.tagName.toLowerCase() === 'polygon' && e.target.id?.includes('overlay-poly-')) {
            const polySelectionId = e.target.id.replace(/^overlay-poly-(selected|child-selected|hover|child-hover|entered|multi-child-selected)-/, '');
            const underlyingEl = svg.querySelector(`[id="${polySelectionId}"]`);
            if (underlyingEl) target = underlyingEl;
          }

          if (target && target !== frameEl && frameEl.contains(target)) {
            setSingleSelection(target.id);
            // Persist auto-assigned ids (e.g. template text with no id) immediately
            if (target.tagName?.toLowerCase() === 'text') {
              saveModifiedPageHtml(pageIdx, svg);
            }
            return;
          }

          // 1. STICKY SELECTION PRIORITY: If clicking near the already-selected element, keep it selected!
          const activeSel = selectedLayerIdRef.current ? svg.querySelector(`[id="${selectedLayerIdRef.current}"]`) : null;
          if (activeSel && frameEl.contains(activeSel) && hitTest(activeSel, e.clientX, e.clientY, 15)) {
            setSingleSelection(activeSel.id);
            return;
          }

          // 2. Fallback: hit testing to catch clicks between text letters or transparent shape bounds
          const normalElements = Array.from(frameEl.children).filter(el =>
            el.id && el.getAttribute('data-type') !== 'frame' &&
            el.getAttribute('data-name') !== 'Overlay' &&
            el.getAttribute('data-hidden') !== 'true' &&
            el.getAttribute('data-locked') !== 'true'
          );
          for (let i = normalElements.length - 1; i >= 0; i--) {
            if (hitTest(normalElements[i], e.clientX, e.clientY, 5)) {
              setSingleSelection(normalElements[i].id);
              return;
            }
          }

          // ── Clicked the entered frame's empty gap → behavior depends on level
          const topFrames = getTopLevelFrames(svg);
          const isRootFolder = topFrames.some(f => f.id === frameId);

          if (isRootFolder) {
            // ── Root Folder Gap (Canvas Background): Keep page root folder selected
            if (hitMultiSelectionGap) return; // Keep multi-selection intact!
            const rootId = (topFrames && topFrames.length > 0 ? topFrames[0].id : frameId);
            setSingleSelection(rootId);
            setCurrentFrameId(rootId);
            currentFrameIdRef.current = rootId;
          } else {
            // ── Deeper Frame Gap: exit one level (select frame, keep entered)
            if (hitMultiSelectionGap) return; // Keep multi-selection intact!
            setSingleSelection(frameId);
            // Don't null currentFrameId here to keep context
          }
        }
        return;

      } else {
        // ── Clicked completely OUTSIDE the entered frame
        // Exit current context and select whatever is at this point
        const topLevelEls = getTopLevelFrames(svg);
        let hitTopFrame = null;
        let targetEl = getDraggableElement(e.target, e.currentTarget);

        let currEl = targetEl;
        while (currEl && currEl !== svg) {
          if (topLevelEls.includes(currEl)) {
            hitTopFrame = currEl;
            break;
          }
          currEl = currEl.parentElement;
        }

        if (!hitTopFrame) {
          for (let i = topLevelEls.length - 1; i >= 0; i--) {
            if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
              hitTopFrame = topLevelEls[i];
              break;
            }
          }
        }

        setCurrentFrameId(null);
        currentFrameIdRef.current = null;

        if (hitTopFrame) {
          setSingleSelection(hitTopFrame.id);
          // Always enter the top level frame immediately upon click (handles both single and double page spreads cleanly)
          setCurrentFrameId(hitTopFrame.id);
          currentFrameIdRef.current = hitTopFrame.id;
        } else {
          // Hit nothing? Keep page root folder selected
          if (hitMultiSelectionGap) return; // Keep multi-selection intact!
          const rootId = (topLevelEls && topLevelEls.length > 0 ? topLevelEls[0].id : pages[activePageIndex]?.layers?.[0]?.id);
          if (rootId) {
            setSingleSelection(rootId);
            setCurrentFrameId(rootId);
            currentFrameIdRef.current = rootId;
          } else {
            setSingleSelection(null);
            setCurrentFrameId(null);
            currentFrameIdRef.current = null;
          }
        }
        return;
      }
    }

    // ── Case 2: No frame entered — top-level selection ────────────────────────
    const topLevelEls = getTopLevelFrames(svg);

    // 1. Identify which top-level frame was hit (topmost in z-order)
    let hitFrame = null;
    let target = getDraggableElement(e.target, e.currentTarget);

    // First, try to find the frame directly from the clicked target's DOM ancestry
    // This is robust against coordinate-based hitTest failing due to UI overlays (like the Upload panel)
    let currentEl = target;
    while (currentEl && currentEl !== svg) {
      if (topLevelEls.includes(currentEl)) {
        hitFrame = currentEl;
        break;
      }
      currentEl = currentEl.parentElement;
    }

    // Fallback to hitTest if DOM ancestry didn't find a top-level frame
    if (!hitFrame) {
      for (let i = topLevelEls.length - 1; i >= 0; i--) {
        if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
          hitFrame = topLevelEls[i];
          break;
        }
      }
    }

    if (hitFrame) {
      // Check if we hit an element inside this frame directly (lifted out of selId check to capture any hit!)
      let target = getDraggableElement(e.target, e.currentTarget);

      if (e.target.tagName.toLowerCase() === 'polygon' && e.target.id?.includes('overlay-poly-')) {
        const polySelectionId = e.target.id.replace('overlay-poly-selected-', '').replace('overlay-poly-child-selected-', '').replace('overlay-poly-hover-', '');
        const underlyingEl = svg.querySelector(`[id="${polySelectionId}"]`);
        if (underlyingEl) target = underlyingEl;
      }

      if (target && target !== hitFrame && hitFrame.contains(target)) {
        setCurrentFrameId(hitFrame.id);
        currentFrameIdRef.current = hitFrame.id;
        setSingleSelection(target.id);
        // Persist auto-assigned ids (e.g. template text with no id) immediately
        if (target.tagName?.toLowerCase() === 'text') {
          saveModifiedPageHtml(pageIdx, svg);
        }
        return;
      }

      // STICKY SELECTION PRIORITY (Case 2)
      const activeSel = selectedLayerIdRef.current ? svg.querySelector(`[id="${selectedLayerIdRef.current}"]`) : null;
      if (activeSel && hitFrame.contains(activeSel) && hitTest(activeSel, e.clientX, e.clientY, 15)) {
        setCurrentFrameId(hitFrame.id);
        currentFrameIdRef.current = hitFrame.id;
        setSingleSelection(activeSel.id);
        return;
      }

      // Hit testing fallback for elements within hitFrame (text gaps)
      const normalEls = Array.from(hitFrame.children).filter(el =>
        el.id && el.getAttribute('data-type') !== 'frame' &&
        el.getAttribute('data-name') !== 'Overlay' &&
        el.getAttribute('data-hidden') !== 'true' &&
        el.getAttribute('data-locked') !== 'true'
      );
      for (let i = normalEls.length - 1; i >= 0; i--) {
        if (hitTest(normalEls[i], e.clientX, e.clientY, 5)) {
          setCurrentFrameId(hitFrame.id);
          currentFrameIdRef.current = hitFrame.id;
          setSingleSelection(normalEls[i].id);
          return;
        }
      }

      if (selId === hitFrame.id) {
        // User clicked the ALREADY-SELECTED frame -> try to ENTER it (drill-down)
        const hasChildren = getDirectChildFrames(hitFrame).length > 0;
        if (hasChildren) {
          setCurrentFrameId(selId);
          currentFrameIdRef.current = selId;

          // Immediately check if a child is hit and select it
          const children = getDirectChildFrames(hitFrame);
          for (let i = children.length - 1; i >= 0; i--) {
            if (hitTest(children[i], e.clientX, e.clientY)) {
              setSingleSelection(children[i].id);
              return;
            }
          }
          // Clicked in the gap area of the frame — keep primary frame selected, just mark as entered
          return;
        }
        // Frame has no children — stay selected
        return;
      } else {
        // User clicked a DIFFERENT top-level frame -> SELECT it (unselects old)
        setSingleSelection(hitFrame.id);
        setCurrentFrameId(null);
        currentFrameIdRef.current = null;
        return;
      }
    } else {
      // 2. Clicked canvas background — deselect everything

      // ── STICKY SELECTION PRIORITY (Case 3) ──
      // If we are about to clear the selection, check if the click was VERY close to the active selection!
      // This protects against accidental deselection when trying to double-click text!
      const activeSel = selectedLayerIdRef.current ? svg.querySelector(`[id="${selectedLayerIdRef.current}"]`) : null;
      if (activeSel && hitTest(activeSel, e.clientX, e.clientY, 15)) {
        return; // Keep selection intact!
      }

      // ── MULTI-SELECTION GAP CLICK CHECK ──
      if (multiSelectedIdsRef.current.size > 1) {
        const multiPoly = container?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi-selection-bounds') || container?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi');
        if (multiPoly) {
          const rect = multiPoly.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
            return; // Keep multi-selection intact!
          }
        }
      }

      if (topLevelEls && topLevelEls.length > 0) {
        const rootId = topLevelEls[0].id;
        setSingleSelection(rootId);
        setCurrentFrameId(rootId);
        currentFrameIdRef.current = rootId;
      } else {
        setSingleSelection(null);
        setCurrentFrameId(null);
        currentFrameIdRef.current = null;
      }
    }
  };

  // ── FIGMA-STYLE DOUBLE CLICK: enter frame / edit text ─────────────────────────
  const handleSvgDoubleClick = (e) => {
    e.stopPropagation();
    // Intentionally ignore suppressClickRef here so that micro-jitters during double-clicks don't abort text editing!

    const container = e.currentTarget;
    const svg = container.querySelector('svg');
    if (!svg) return;

    if (isConvertedFlipbook) {
      return;
    }

    // ── NODE EDIT MODE: Double-click on already-active node edit path ──────────────
    if (nodeEditModeRef.current) {
      // Already in node edit mode – do nothing on double click (single click to drag handles)
      return;
    }

    // Text editing on double-click
    // 1. First check if we directly hit text
    let target = getDraggableElement(e.target, e.currentTarget);

    // 2. Proactively check if we are double-clicking while a text is selected
    const selIdContext = selectedLayerIdRef.current;
    if (selIdContext && (!target || !['text', 'tspan', 'foreignobject'].includes(target.tagName?.toLowerCase()))) {
      let activeSelEls = svg.querySelectorAll(`[id="${selIdContext}"]`);
      // If there are duplicates due to temporary template saving leaks, find the visible one
      const activeSelEl = Array.from(activeSelEls).find(el => el.getBoundingClientRect().width > 0) || activeSelEls[0];

      if (activeSelEl && ['text', 'tspan', 'foreignobject'].includes(activeSelEl.tagName.toLowerCase()) && activeSelEl.getAttribute('data-locked') !== 'true') {
        // Bypass strict hitTest if the target was the overlay polygon (meaning they clicked inside the blue box exactly)
        const clickedPolygon = e.target.tagName.toLowerCase() === 'polygon';
        if (clickedPolygon || hitTest(activeSelEl, e.clientX, e.clientY, 15)) {
          target = activeSelEl;
        }
      }
    }

    // ── NODE EDIT MODE: Check if double-clicking a vector/path/shape element ───
    const isModuleWithoutPenEdit = activeTopTool === 'interaction' || activeTopTool === 'animation' || activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation';
    if (!isModuleWithoutPenEdit && target && !['text', 'tspan', 'foreignobject'].includes(target.tagName?.toLowerCase())) {
      const tag = target.tagName?.toLowerCase();
      const dataType = target.getAttribute('data-type') || '';
      const isVectorOrPath = (
        tag === 'path' ||
        dataType === 'vector-path' ||
        dataType === 'shape' ||
        (tag === 'ellipse' || tag === 'circle' || tag === 'rect' || tag === 'line' || tag === 'polyline' || tag === 'polygon')
      ) && target.getAttribute('data-locked') !== 'true' &&
        target.getAttribute('data-name') !== 'Overlay' &&
        target.getAttribute('data-type') !== 'frame' &&
        target.getAttribute('data-type') !== 'background';

      if (isVectorOrPath && target.id) {
        // For non-path shapes (rect/ellipse/etc.), convert to path first or skip
        if (tag === 'path' || dataType === 'vector-path') {
          const container = target.closest('.page-svg-container');
          const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : activePageIndex;
          enterNodeEditMode(target, pageIdx);
          return;
        }
      }
    }

    if (!target) {
      return;
    }

    let isText = (['text', 'tspan'].includes(target.tagName.toLowerCase()) || target.tagName.toLowerCase() === 'foreignobject') && target.getAttribute('data-type') !== 'video' && !target.querySelector('video, iframe');
    let textTarget = target;

    // Allow double clicking text inside grouped elements (like buttons) to edit the text directly
    if (!isText && target.getAttribute('data-type') === 'button') {
      const clickedTag = e.target.tagName?.toLowerCase();
      if (['text', 'tspan', 'foreignobject'].includes(clickedTag)) {
        isText = true;
        textTarget = clickedTag === 'tspan' ? e.target.closest('text') : (clickedTag === 'foreignobject' ? e.target : e.target.closest('text') || e.target);
        if (textTarget && !textTarget.id) {
          textTarget.id = `button-text-${Date.now()}`;
        }
      }
    }

    if (isText && textTarget && textTarget.id) {
      if (activeTopTool !== 'interaction' && activeTopTool !== 'animation') {
        enterTextEditMode(textTarget, e.clientX, e.clientY);
      }
      return;
    }

    const isCropModeMedia = target && !target.closest?.('[data-is-gif-group="true"]') && (
      (target.getAttribute('data-object-fit') === 'Crop') ||
      (target.closest?.('[data-object-fit="Crop"]'))
    );

    if (isCropModeMedia) {
      const cropLayer = target.closest?.('[data-object-fit="Crop"]') || target;
      if (cropLayer && cropLayer.id) {
        if (setSelectedLayerId) {
          setSelectedLayerId(cropLayer.id);
          selectedLayerIdRef.current = cropLayer.id;
        }

        const evt = new CustomEvent('enter-crop-mode', { detail: { elementId: cropLayer.id } });
        window.dispatchEvent(evt);
        return;
      }
    }

    // On double-click a frame: enter it immediately
    const frameId = currentFrameIdRef.current;
    const selId = selectedLayerIdRef.current;

    if (!frameId && selId) {
      // Enter the currently selected frame
      const selEl = svg.querySelector(`[id="${selId}"]`);
      if (selEl && hitTest(selEl, e.clientX, e.clientY)) {
        const hasChildren = getDirectChildFrames(selEl).length > 0;
        if (hasChildren) {
          setCurrentFrameId(selId);
          currentFrameIdRef.current = selId;
          // Select the child at this point as well
          const children = getDirectChildFrames(selEl);
          for (let i = children.length - 1; i >= 0; i--) {
            if (hitTest(children[i], e.clientX, e.clientY)) {
              if (setSelectedLayerId) {
                setSelectedLayerId(children[i].id);
                selectedLayerIdRef.current = children[i].id;
              }
              return;
            }
          }
          return;
        }
      }
    }

    // Fallback: select the target element directly
    if (target.id && target.tagName.toLowerCase() !== 'svg') {
      const isMediaGroupChild = target.closest('[data-is-image-group="true"]') ||
        target.closest('[data-is-video-group="true"]') ||
        target.closest('[data-is-gif-group="true"]');

      // If the target is a child of a media group, do not drill down on double click
      if (isMediaGroupChild && isMediaGroupChild !== target) {
        return;
      }

      if (setSelectedLayerId) {
        setSelectedLayerId(target.id);
        selectedLayerIdRef.current = target.id;
      }
    }
  };

  const handlePrevPage = () => {
    setActivePageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    if (activePageIndex + 1 < pages.length) {
      setActivePageIndex(prev => prev + 1);
    }
  };

  const closeAllDropdowns = () => {
    setShowSelectOptions(false);
    setShowPenOptions(false);
    setShowShapesOptions(false);
    if (setOpenMenuIndex) setOpenMenuIndex(null);
  };

  const isPageEmpty = !pages[activePageIndex]?.html;

  useEffect(() => {
    const el = editorContainerRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      if (e.target.closest('.editor-ss-overlay') || e.target.closest('input')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault();
        e.stopPropagation();

        lastWheelTimeRef.current = Date.now();
        suppressClickRef.current = true;
        setTimeout(() => { suppressClickRef.current = false; }, 200);

        const containerEl = zoomContainerRef.current;
        if (!containerEl) return;

        const currentZoom = currentZoomRef.current || zoom || 100;
        const currentPan = currentPanRef.current || pan || { x: 0, y: 0 };
        const minZ = 10;
        const maxZ = 500;

        // Snappy, responsive zoom speed:
        // Discrete mouse wheel steps (|deltaY| >= 40) vs continuous trackpad gestures (|deltaY| < 40)
        let factor;
        if (Math.abs(e.deltaY) >= 40) {
          // Fast ~15% zoom step per wheel notch
          factor = e.deltaY < 0 ? 1.15 : (1 / 1.15);
        } else {
          // Smooth continuous trackpad scaling
          factor = Math.exp(-e.deltaY * 0.005);
        }

        let newZoom = Math.round(currentZoom * factor * 10) / 10;
        newZoom = Math.min(Math.max(newZoom, minZ), maxZ);

        if (Math.abs(newZoom - currentZoom) < 0.01) return;

        const currentScale = currentZoom / 100;
        const newScale = newZoom / 100;

        // Invariant center calculation: use the static editorContainer viewport bounds.
        // This avoids layout reflows and DOM jitter from calling getBoundingClientRect() on an element in mid-transform.
        const editorRect = el.getBoundingClientRect();
        const centerScreenX = editorRect.left + editorRect.width / 2 + currentPan.x;
        const centerScreenY = editorRect.top + editorRect.height / 2 + currentPan.y;

        // Vector from visual center of canvas to mouse cursor
        const mouseOffsetX = e.clientX - centerScreenX;
        const mouseOffsetY = e.clientY - centerScreenY;

        // Mathematical cursor anchor: point under cursor has 0 displacement on screen
        const scaleRatio = newScale / currentScale;
        const newPanX = currentPan.x + mouseOffsetX * (1 - scaleRatio);
        const newPanY = currentPan.y + mouseOffsetY * (1 - scaleRatio);

        const newPan = { x: newPanX, y: newPanY };

        // Synchronous ref update for 0-latency tracking
        currentZoomRef.current = newZoom;
        currentPanRef.current = newPan;

        // Instant transform update (0ms latency, buttery smooth 60 FPS)
        containerEl.style.transition = 'none';
        containerEl.style.transform = `translate(${newPanX}px, ${newPanY}px) scale(${newScale})`;

        // Batch React state update with requestAnimationFrame to prevent layout thrashing and mid-render glitches
        if (wheelRafRef.current) {
          cancelAnimationFrame(wheelRafRef.current);
        }
        wheelRafRef.current = requestAnimationFrame(() => {
          setZoom(newZoom);
          setPan(newPan);
        });

        window.dispatchEvent(new CustomEvent('editor-pan-update', { detail: newPan }));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      el.removeEventListener('wheel', handleWheel, { capture: true });
      if (wheelRafRef.current) {
        cancelAnimationFrame(wheelRafRef.current);
      }
    };
  }, []);

  const handleAlign = (type) => {
    const ids = multiSelectedIds.size > 0 ? Array.from(multiSelectedIds) : (selectedLayerId ? [selectedLayerId] : []);
    if (ids.length === 0) return;

    const svg = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"] svg`);
    if (!svg) return;

    const elements = ids.map(id => svg.querySelector(`[id="${id}"]`)).filter(Boolean);
    if (elements.length === 0) return;

    const getElBBox = (el) => {
      try {
        const vBox = getVisualBBox(el);
        const ctm = el.getScreenCTM();
        const svgCTMInv = svg.getScreenCTM()?.inverse();
        if (!ctm || !svgCTMInv) return null;

        const toSvgMatrix = svgCTMInv.multiply(ctm);
        const p1 = new DOMPoint(vBox.x, vBox.y).matrixTransform(toSvgMatrix);
        const p2 = new DOMPoint(vBox.x + vBox.width, vBox.y).matrixTransform(toSvgMatrix);
        const p3 = new DOMPoint(vBox.x + vBox.width, vBox.y + vBox.height).matrixTransform(toSvgMatrix);
        const p4 = new DOMPoint(vBox.x, vBox.y + vBox.height).matrixTransform(toSvgMatrix);

        const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
        const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
        const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
        const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

        return {
          minX, maxX, minY, maxY,
          width: maxX - minX,
          height: maxY - minY,
          midX: (minX + maxX) / 2,
          midY: (minY + maxY) / 2
        };
      } catch (e) {
        return null;
      }
    };

    const elBBoxes = elements.map(el => ({ el, bbox: getElBBox(el) })).filter(item => item.bbox);
    if (elBBoxes.length === 0) return;

    let targetBBox;
    if (elements.length === 1) {
      const el = elements[0];
      const parent = el.parentNode;
      let parentBBox = null;

      if (parent && parent.tagName && parent.tagName.toLowerCase() === 'g' && parent !== svg) {
        parentBBox = getElBBox(parent);
      }

      if (parentBBox) {
        targetBBox = parentBBox;
      } else {
        const viewBox = svg.getAttribute('viewBox');
        const [vx, vy, vw, vh] = viewBox ? viewBox.split(' ').map(Number) : [0, 0, 595, 842];
        targetBBox = { minX: vx, minY: vy, maxX: vx + vw, maxY: vy + vh, midX: vx + vw / 2, midY: vy + vh / 2 };
      }
    } else {
      targetBBox = {
        minX: Math.min(...elBBoxes.map(e => e.bbox.minX)),
        maxX: Math.max(...elBBoxes.map(e => e.bbox.maxX)),
        minY: Math.min(...elBBoxes.map(e => e.bbox.minY)),
        maxY: Math.max(...elBBoxes.map(e => e.bbox.maxY)),
      };
      targetBBox.midX = (targetBBox.minX + targetBBox.maxX) / 2;
      targetBBox.midY = (targetBBox.minY + targetBBox.maxY) / 2;
    }

    const applyTranslation = (el, dx, dy) => {
      if (dx === 0 && dy === 0) return;
      try {
        const svgEl = el.ownerSVGElement || el.closest('svg');
        const svgCTMInv = svgEl.getScreenCTM().inverse();
        const parentScreenCTM = el.parentNode.getScreenCTM();
        const parentToUserCTM = svgCTMInv.multiply(parentScreenCTM);
        const invParentCTM = parentToUserCTM.inverse();

        const p0 = new DOMPoint(0, 0).matrixTransform(invParentCTM);
        const p1 = new DOMPoint(dx, dy).matrixTransform(invParentCTM);
        const localDx = p1.x - p0.x;
        const localDy = p1.y - p0.y;

        const tag = el.tagName.toLowerCase();
        const isText = tag === 'text' || el.getAttribute('data-type') === 'text';
        const isCropped = isElementCropped(el) || el.getAttribute('data-is-image-group') === 'true' || el.hasAttribute('data-crop-data');
        const hasTransform = el.getAttribute('transform');

        if (isText || isCropped || (hasTransform && hasTransform !== 'matrix(1 0 0 1 0 0)')) {
          const matrix = typeof getElementMatrix === 'function' ? getElementMatrix(el) : new DOMMatrix(el.getAttribute('transform') || '');
          const nextMatrix = new DOMMatrix().translate(localDx, localDy).multiply(matrix);
          if (typeof matrixToTransform === 'function') el.setAttribute('transform', matrixToTransform(nextMatrix));
        } else {
          if (tag === 'rect' || tag === 'foreignobject' || tag === 'image') {
            const currentX = parseFloat(el.getAttribute('x')) || 0;
            const currentY = parseFloat(el.getAttribute('y')) || 0;
            el.setAttribute('x', currentX + localDx);
            el.setAttribute('y', currentY + localDy);
          } else if (tag === 'circle' || tag === 'ellipse') {
            const currentCx = parseFloat(el.getAttribute('cx')) || 0;
            const currentCy = parseFloat(el.getAttribute('cy')) || 0;
            el.setAttribute('cx', currentCx + localDx);
            el.setAttribute('cy', currentCy + localDy);
          } else {
            const matrix = typeof getElementMatrix === 'function' ? getElementMatrix(el) : new DOMMatrix(el.getAttribute('transform') || '');
            const nextMatrix = new DOMMatrix().translate(localDx, localDy).multiply(matrix);
            if (typeof matrixToTransform === 'function') el.setAttribute('transform', matrixToTransform(nextMatrix));
          }
        }
      } catch (e) { }
    };

    if (type === 'distribute-h' && elBBoxes.length > 2) {
      elBBoxes.sort((a, b) => a.bbox.minX - b.bbox.minX);
      const first = elBBoxes[0];
      const last = elBBoxes[elBBoxes.length - 1];

      const totalWidth = last.bbox.maxX - first.bbox.minX;
      const sumOfWidths = elBBoxes.reduce((sum, item) => sum + item.bbox.width, 0);
      const gap = (totalWidth - sumOfWidths) / (elBBoxes.length - 1);

      let currentX = first.bbox.minX + first.bbox.width + gap;
      for (let i = 1; i < elBBoxes.length - 1; i++) {
        const item = elBBoxes[i];
        const dx = currentX - item.bbox.minX;
        applyTranslation(item.el, dx, 0);
        currentX += item.bbox.width + gap;
      }
    } else if (type === 'distribute-v' && elBBoxes.length > 2) {
      elBBoxes.sort((a, b) => a.bbox.minY - b.bbox.minY);
      const first = elBBoxes[0];
      const last = elBBoxes[elBBoxes.length - 1];

      const totalHeight = last.bbox.maxY - first.bbox.minY;
      const sumOfHeights = elBBoxes.reduce((sum, item) => sum + item.bbox.height, 0);
      const gap = (totalHeight - sumOfHeights) / (elBBoxes.length - 1);

      let currentY = first.bbox.minY + first.bbox.height + gap;
      for (let i = 1; i < elBBoxes.length - 1; i++) {
        const item = elBBoxes[i];
        const dy = currentY - item.bbox.minY;
        applyTranslation(item.el, 0, dy);
        currentY += item.bbox.height + gap;
      }
    } else {
      elBBoxes.forEach(({ el, bbox }) => {
        let dx = 0, dy = 0;
        switch (type) {
          case 'left': dx = targetBBox.minX - bbox.minX; break;
          case 'center': dx = targetBBox.midX - bbox.midX; break;
          case 'right': dx = targetBBox.maxX - bbox.maxX; break;
          case 'top': dy = targetBBox.minY - bbox.minY; break;
          case 'middle': dy = targetBBox.midY - bbox.midY; break;
          case 'bottom': dy = targetBBox.maxY - bbox.maxY; break;
        }
        applyTranslation(el, dx, dy);
      });
    }

    if (updatePageHtml) updatePageHtml(activePageIndex, svg.outerHTML);

    // Update selection highlight after aligning elements so the blue box immediately snaps to the new positions
    if (multiSelectedIdsRef.current && multiSelectedIdsRef.current.size > 1) {
      drawMultiSelectionHighlight(multiSelectedIdsRef.current, 'selected');
    } else if (selectedLayerId) {
      const el = document.getElementById(selectedLayerId);
      if (el) drawOverlayHighlight(el, 'selected');
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden h-[92vh] ${isPopupEditor ? 'bg-[#E5E7EB]' : 'bg-white'}`}
      onClick={closeAllDropdowns}
      onContextMenu={(e) => e.preventDefault()}
    >
      <CropController
        activePageIndex={activePageIndex}
        zoom={zoom}
        saveModifiedPageHtml={saveModifiedPageHtml}
        drawOverlayHighlight={drawOverlayHighlight}
        getVisualBBox={getVisualBBox}
      />
      <TopToolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetZoom}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        rotation={rotation}
        onRotate={handleRotate}
        onFlipH={() => handleFlip('h')}
        onFlipV={() => handleFlip('v')}
        onAlign={handleAlign}
        hideTools={isPdfProject}

        hasSelection={(() => {
          const ids = multiSelectedIds.size > 0 ? Array.from(multiSelectedIds) : (selectedLayerId ? [selectedLayerId] : []);
          if (ids.length === 0) return false;

          // Collect all "Base" (Root Frame or Background Overlay) IDs across all visible containers
          // (Handles both single and double-page spread selections)
          const baseIds = new Set();
          document.querySelectorAll('.page-svg-container svg').forEach(svg => {
            const topLevelFrames = getTopLevelFrames(svg);
            topLevelFrames.forEach(frame => {
              baseIds.add(frame.id);
              const overlay = frame.querySelector('[data-name="Overlay"]');
              if (overlay) baseIds.add(overlay.id);
            });
          });

          // Enable tools ONLY if at least one selected ID is NOT a base/root frame
          return ids.some(id => id && !baseIds.has(id));
        })()}
      />
      <div
        ref={editorContainerRef}
        className={`flex-1 relative flex items-center justify-center  overflow-hidden ${isPopupEditor ? 'bg-transparent' : 'bg-[#FBFBFB]'}`}
        style={{ cursor: isSpaceDown ? (isPanningRef.current ? 'grabbing' : 'grab') : 'default' }}
        onContextMenu={(e) => {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('show-layer-context-menu', {
            detail: { e, layerId: 'outside-background', pageIndex: activePageIndex, isOverlay: true }
          }));
        }}
        onMouseDown={(e) => {
          if (isSpaceDownRef.current || e.button === 1 || activeMainTool === 'hand') {
            e.preventDefault();
            e.stopPropagation();
            isPanningRef.current = true;
            lastPanPointRef.current = { x: e.clientX, y: e.clientY };
            setIsSpaceDown(true);
            if (zoomContainerRef.current) {
              zoomContainerRef.current.style.transition = 'none';
            }
            return;
          }
        }}
        onMouseMove={(e) => {
          if (isPanningRef.current) {
            e.preventDefault();
            e.stopPropagation();
            const dx = e.clientX - lastPanPointRef.current.x;
            const dy = e.clientY - lastPanPointRef.current.y;
            lastPanPointRef.current = { x: e.clientX, y: e.clientY };

            const prev = currentPanRef.current;
            const newX = prev.x + dx;
            const newY = prev.y + dy;

            if (!editorContainerRef.current) return;

            const containerWidth = editorContainerRef.current.clientWidth;
            const containerHeight = editorContainerRef.current.clientHeight;

            const baseVhHeight = window.innerHeight * 0.78;
            const totalWidth = baseWidth || 210;
            const baseCanvasHeight = baseVhHeight;
            const baseCanvasWidth = baseCanvasHeight * (totalWidth / baseHeight);
            const currentScale = zoom / 100;
            const scaledWidth = baseCanvasWidth * currentScale;
            const scaledHeight = baseCanvasHeight * currentScale;

            const bounds = getCanvasBounds(null, baseWidth, baseHeight);
            const canvasWidthMM = bounds.canvasWidthMM || 1600;

            const scaledCanvasW = (baseVhHeight * (canvasWidthMM / baseHeight)) * currentScale;
            const scaledCanvasH = (baseVhHeight * (1000 / baseHeight)) * currentScale;

            const maxPanX = Math.max(containerWidth * 1.5, scaledCanvasW);
            const maxPanY = Math.max(containerHeight * 1.5, scaledCanvasH);

            const boundedX = Math.min(Math.max(newX, -maxPanX), maxPanX);
            const boundedY = Math.min(Math.max(newY, -maxPanY), maxPanY);

            currentPanRef.current = { x: boundedX, y: boundedY };

            if (zoomContainerRef.current) {
              zoomContainerRef.current.style.transition = 'none';
              zoomContainerRef.current.style.transform = `translate(${boundedX}px, ${boundedY}px) scale(${currentScale})`;
            }
            window.dispatchEvent(new CustomEvent('editor-pan-update', { detail: { x: boundedX, y: boundedY } }));
          }
        }}
        onMouseUp={(e) => {
          if (isPanningRef.current) {
            isPanningRef.current = false;
            // Mark that we just finished panning so the immediately-following
            // onClick does not accidentally select/deselect canvas elements.
            wasRecentlyPanningRef.current = true;
            setTimeout(() => { wasRecentlyPanningRef.current = false; }, 150);
            setIsSpaceDown(isSpaceDownRef.current);
            setPan(currentPanRef.current);
          }
        }}
        onMouseLeave={(e) => {
          if (isPanningRef.current) {
            isPanningRef.current = false;
            wasRecentlyPanningRef.current = true;
            setTimeout(() => { wasRecentlyPanningRef.current = false; }, 150);
            setIsSpaceDown(isSpaceDownRef.current);
            setPan(currentPanRef.current);
          }
        }}
        onClick={(e) => {
          // Suppress clicks that happen right after Ctrl+scroll zoom or Space panning
          if (isPanningRef.current || isSpaceDownRef.current || suppressClickRef.current || wasRecentlyPanningRef.current) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          // ── Background Click: Select active page root folder instead of clearing selection ─────────────────
          const container = e.target.closest('.page-svg-container');
          const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : activePageIndex;

          if (setActivePageIndex && activePageIndex !== pageIdx) {
            setActivePageIndex(pageIdx);
          }

          // ── Background Click: In converted flipbooks, clear selection instead of selecting full page root ─────
          if (isConvertedFlipbook) {
            if (setSelectedLayerId) setSelectedLayerId(null);
            if (setMultiSelectedIds) setMultiSelectedIds(new Set());
            if (setCurrentFrameId) setCurrentFrameId(null);
            currentFrameIdRef.current = null;
            return;
          }

          const pageSvg = container?.querySelector('svg') || document.querySelector(`.page-svg-container[data-page-index="${pageIdx}"] svg`);
          const topFrames = pageSvg ? getTopLevelFrames(pageSvg) : [];
          const rootId = (topFrames && topFrames.length > 0 ? topFrames[0].id : pages[pageIdx]?.layers?.[0]?.id);

          if (rootId) {
            if (setSelectedLayerId) setSelectedLayerId(rootId);
            if (setMultiSelectedIds) setMultiSelectedIds(new Set([rootId]));
            if (setCurrentFrameId) setCurrentFrameId(rootId);
            currentFrameIdRef.current = rootId;
          } else if (setSelectedLayerId) {
            setSelectedLayerId(null);
            setMultiSelectedIds(new Set());
            setCurrentFrameId(null);
            currentFrameIdRef.current = null;
          }
        }}

      >
        {/* Invisible Overlay for Panning */}
        {isSpaceDown && (
          <div className="absolute inset-0 z-[9999]" style={{ cursor: isPanningRef.current ? 'grabbing' : 'grab' }} />
        )}

        {/* Canvas Ruler */}
        {isRulerEnabled && (
          <CanvasRuler
            zoom={zoom}
            pan={currentPanRef.current}
            baseLogicalWidth={baseWidth}
            baseLogicalHeight={baseHeight}
            baseCanvasWidth={window.innerHeight * 0.78 * (baseWidth / baseHeight)}
            baseCanvasHeight={window.innerHeight * 0.78}
          />
        )}

        {/* Guides Overlay */}
        {isRulerEnabled && (
          <GuidesOverlay
            zoom={zoom}
            pan={currentPanRef.current}
            baseCanvasWidth={window.innerHeight * 0.78 * (baseWidth / baseHeight)}
            baseCanvasHeight={window.innerHeight * 0.78}
          />
        )}

        {/* Top Group: Selection & Primary Tools - Independent Position */}
        {/* Top Group: Selection & Primary Tools - Independent Position */}
        {!isPdfProject && !isPopupEditor && (
          <div className={`absolute right-[1.05vw] top-[6vh] z-50 ${pages[activePageIndex]?.isHidden ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-[#F1F3F4] rounded-[0.5vw] border border-gray-300 p-[0.3vw] flex flex-col items-center w-[2.7vw] gap-[0.7vh] shadow-sm">
              {/* Black Edit Icon Button */}
              <div className="relative group/tool flex items-center">
                <button
                  onClick={() => setActiveTopTool('editor')}
                  className={`w-[2.1vw] h-[2.1vw] cursor-pointer rounded-[0.4vw] flex items-center justify-center transition-all my-[0.1vh] ${activeTopTool === 'editor' ? 'bg-[#000000]' : 'hover:bg-white text-[#9EA1A7] hover:text-[#111827]'}`}
                >
                  <Icon icon="tabler:edit" width="1.1vw" height="1.1vw" className={activeTopTool === 'editor' ? 'text-white' : ''} />
                </button>
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Edit Mode
                </div>
              </div>

              {/* Hand / Touch Interaction Tool */}
              <div className="relative group/tool flex items-center">
                <button
                  onClick={() => setActiveTopTool('interaction')}
                  className={`w-[2.1vw] h-[2.1vw] cursor-pointer rounded-[0.4vw] flex items-center justify-center transition-all ${activeTopTool === 'interaction' ? 'bg-[#000000] text-white' : 'hover:bg-white text-[#9EA1A7] hover:text-[#111827]'}`}
                >
                  <Icon icon="hugeicons:touch-interaction-01" width="1.2vw" height="1.2vw" />
                </button>
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Touch Interaction
                </div>
              </div>

              {/* Star / Animation Tool */}
              <div className="relative group/tool flex items-center">
                <button
                  onClick={() => setActiveTopTool('animation')}
                  className={`w-[2.1vw] h-[2.1vw] cursor-pointer rounded-[0.4vw] flex items-center justify-center transition-all ${activeTopTool === 'animation' ? 'bg-[#000000] text-white' : 'hover:bg-white text-[#9EA1A7] hover:text-[#111827]'}`}
                >
                  <Icon icon="tdesign:animation-1" width="1.2vw" height="1.2vw" />
                </button>
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Animation & Effects
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Floating Menu Button (Top Right Edge for Popup Editor) */}
        {!isPdfProject && isPopupEditor && activeTopTool !== 'animation' && activeTopTool !== 'interaction' && (
          <div className={`absolute right-0 top-[6.5vh] z-50 ${pages[activePageIndex]?.isHidden ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-[#F1F3F4] rounded-l-[0.8vw] border-y border-l border-gray-300 p-[0.3vw] flex flex-col shadow-sm relative">
              {/* Perfect Inverted Corner Top */}
              <div className="absolute -top-[0.8vw] right-0 w-[0.8vw] h-[0.8vw] border-gray-300 pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 100 V0 C100 55.2285 55.2285 100 0 100 H100Z" fill="#F1F3F4" />
                  <path d="M0 100 C55.2285 100 100 55.2285 100 0" stroke="#acb0b6ff" strokeWidth="3" />
                </svg>
              </div>

              {/* Perfect Inverted Corner Bottom */}
              <div className="absolute -bottom-[0.8vw] right-0 w-[0.8vw] h-[0.8vw] pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 0 V100 C100 44.7715 55.2285 0 0 0 H100Z" fill="#F1F3F4" />
                  <path d="M0 0 C55.2285 0 100 44.7715 100 100" stroke="#acb0b6ff" strokeWidth="3" />
                </svg>
              </div>

              <div className="flex items-center justify-start group">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const displayIdx = activePageIndex;
                    setOpenMenuIndex(openMenuIndex === displayIdx ? null : displayIdx);
                  }}
                  className="w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer bg-white shadow-sm hover:bg-gray-50"
                >
                  <Icon icon="ci:hamburger-md" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                </button>
              </div>

              <AnimatePresence>
                {openMenuIndex === activePageIndex && (
                  <motion.div
                    initial={{ opacity: 0, x: 10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.95 }}
                    className="absolute top-0 right-[3.5vw] w-[12vw] bg-white rounded-[0.8vw] shadow-xl border border-gray-100 p-[0.5vw] z-[9999] flex flex-col gap-[0.2vw]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MenuOption
                      icon={<TemplateIcon />}
                      label="Change Template"
                      onClick={() => {
                        onOpenTemplateModal(activePageIndex);
                        setOpenMenuIndex(null);
                      }}
                    />
                    <MenuOption
                      icon={<ClearIcon />}
                      label="Clear"
                      onClick={() => { clearPage(activePageIndex); setOpenMenuIndex(null); }}
                    />
                    <MenuOption
                      icon={<DeleteIcon />}
                      label="Delete"
                      color="text-red-500"
                      hoverColor="hover:bg-red-50"
                      onClick={() => { deletePage(activePageIndex); setOpenMenuIndex(null); }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Interaction Group: Sub Tools */}
        {activeTopTool === 'interaction' && (
          <div className={`absolute right-0 top-[25vh] z-50 ${pages[activePageIndex]?.isHidden ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-[#F1F3F4] rounded-l-[0.8vw] border-y border-l border-gray-300 p-[0.3vw] flex flex-col shadow-sm relative">

              {/* Cover Top Border */}
              <div className="absolute top-0 right-0 w-[0.8vw] h-[1.5px] bg-[#F1F3F4] z-10" />
              {/* Perfect Inverted Corner Top */}
              <div className="absolute right-0 w-[0.8vw] h-[0.8vw] pointer-events-none z-20" style={{ top: 'calc(-0.8vw + 0.5px)' }}>
                <svg className="overflow-visible" width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 100 V0 C100 55.2285 55.2285 100 0 100 H100Z" fill="#F1F3F4" />
                  <path d="M0 100 C55.2285 100 100 55.2285 100 0" stroke="#D1D5DB" strokeWidth="6" />
                </svg>
              </div>

              {/* Cover Bottom Border */}
              <div className="absolute bottom-0 right-0 w-[0.8vw] h-[1.5px] bg-[#F1F3F4] z-10" />
              {/* Perfect Inverted Corner Bottom */}
              <div className="absolute right-0 w-[0.8vw] h-[0.8vw] pointer-events-none z-20" style={{ bottom: 'calc(-0.8vw + 0.5px)' }}>
                <svg className="overflow-visible" width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 0 V100 C100 44.7715 55.2285 0 0 0 H100Z" fill="#F1F3F4" />
                  <path d="M0 0 C55.2285 0 100 44.7715 100 100" stroke="#D1D5DB" strokeWidth="6" />
                </svg>
              </div>

              {/* Select Tool */}
              <div className="pt-[0.1vh] mb-[0.8vh] flex items-center justify-start group gap-[0.3vw] relative group/tool">
                <button
                  onClick={() => {
                    if (setActiveMainTool) setActiveMainTool('select');
                  }}
                  className={`w-[2.1vw] h-[2.1vw] rounded-[0.4vw] flex items-center justify-center transition-all cursor-pointer ${activeMainTool === 'select' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <Icon icon="clarity:cursor-arrow-line" width="1.2vw" height="1.2vw" className={activeMainTool === 'select' ? 'text-[#111827]' : 'text-[#4B5563]'} />
                </button>
                <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Select Tool
                </div>
              </div>

              {/* Frame Tool */}
              <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] relative group/tool">
                <button
                  onClick={() => {
                    if (setActiveMainTool) setActiveMainTool('shapes');
                    setSelectedShapeTool('free-frame');
                  }}
                  className={`w-[2.1vw] h-[2.1vw] rounded-[0.4vw] flex items-center justify-center transition-all cursor-pointer ${activeMainTool === 'shapes' && selectedShapeTool === 'free-frame' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <Icon icon="iconoir:frame-alt" width="1.2vw" height="1.2vw" className={activeMainTool === 'shapes' && selectedShapeTool === 'free-frame' ? 'text-[#111827]' : 'text-[#4B5563]'} />
                </button>
                <div className="w-[0.7vw]"></div>
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Frame Tool
                </div>
              </div>

              {/* Hotspot Tool (Icon Only) */}
              <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] relative group/tool" id="hotspot-trigger-container">
                <button
                  onClick={() => setShowHotspotPopup(!showHotspotPopup)}
                  className={`w-[2.1vw] h-[2.1vw] rounded-[0.4vw] flex items-center justify-center transition-all cursor-pointer ${showHotspotPopup ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <Icon icon="material-symbols:ads-click-rounded" width="1.2vw" height="1.2vw" className={showHotspotPopup ? 'text-[#111827]' : 'text-[#4B5563]'} />
                </button>
                <div className="w-[0.7vw]"></div>
                {!showHotspotPopup && (
                  <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                    Hotspot Tool
                  </div>
                )}
                {showHotspotPopup && (
                  <HotspotPresetPopup
                    onClose={() => setShowHotspotPopup(false)}
                    onSelectPreset={() => { }} // No functionality for now as requested
                  />
                )}
              </div>

            </div>
          </div>
        )}

        {/* Bottom Group: Creation & Widgets - HIDDEN for PDF projects */}
        {!isPdfProject && activeTopTool === 'editor' && (
          <div className={`absolute right-0 top-[25vh] z-50 ${pages[activePageIndex]?.isHidden ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-[#F1F3F4] rounded-l-[0.8vw] border-y border-l border-gray-300 p-[0.3vw] flex flex-col shadow-sm relative">

              {/* Perfect Inverted Corner Top */}
              <div className="absolute -top-[0.8vw] right-0 w-[0.8vw] h-[0.8vw] border-gray-300 pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 100 V0 C100 55.2285 55.2285 100 0 100 H100Z" fill="#F1F3F4" />
                  <path d="M0 100 C55.2285 100 100 55.2285 100 0" stroke="#acb0b6ff" strokeWidth="3" />
                </svg>
              </div>

              {/* Perfect Inverted Corner Bottom */}
              <div className="absolute -bottom-[0.8vw] right-0 w-[0.8vw] h-[0.8vw] pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 0 V100 C100 44.7715 55.2285 0 0 0 H100Z" fill="#F1F3F4" />
                  <path d="M0 0 C55.2285 0 100 44.7715 100 100" stroke="#acb0b6ff" strokeWidth="3" />
                </svg>
              </div>

              {/* White Upload Button - matching top group size */}
              <div className="pt-[0.1vh] mb-[0.8vh] flex items-center justify-start gap-[0.3vw] relative group/tool">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMainTool('upload');
                    closeAllDropdowns();
                  }}
                  className={`w-[2.1vw] h-[2.1vw] rounded-[0.4vw] flex items-center justify-center transition-all cursor-pointer ${activeMainTool === 'upload' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <Icon icon="prime:upload" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                </button>
                <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Upload File
                </div>
              </div>

              {/* Select Tool Row */}
              <div className="flex items-center justify-start gap-[0.3vw] mb-[0.8vh] cursor-pointer relative group/tool">
                {/* Select Tool Options Dropdown */}
                {showSelectOptions && (
                  <div className="absolute right-[4.2vw] top-[-1.5vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[0.5vh] shadow-lg z-50 w-[2.7vw]">
                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedSelectTool === 'select' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSelectTool('select');
                          setActiveMainTool('select');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="clarity:cursor-arrow-line" width="1.1vw" height="1.1vw" className={`${selectedSelectTool === 'select' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Select
                      </div>
                    </div>

                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedSelectTool === 'direct' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSelectTool('direct');
                          setActiveMainTool('select');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="clarity:cursor-arrow-solid" width="1.1vw" height="1.1vw" className={`${selectedSelectTool === 'direct' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Direct Select
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMainTool('select');
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSelectOptions(!showSelectOptions);
                    setShowPenOptions(false);
                    setShowShapesOptions(false);
                    setActiveMainTool('select');
                  }}
                  className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'select' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <Icon
                    icon={selectedSelectTool === 'select' ? 'clarity:cursor-arrow-line' : 'clarity:cursor-arrow-solid'}
                    width="1.2vw"
                    height="1.2vw"
                    className="text-[#111827]"
                  />
                </button>
                <div
                  className="w-[0.7vw] flex justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSelectOptions(!showSelectOptions);
                    setShowPenOptions(false);
                    setShowShapesOptions(false);
                    setActiveMainTool('select');
                  }}
                >
                  <Icon icon="lucide:chevron-down" className={`w-[0.7vw] h-[0.7vw] text-[#4B5563] transition-all ${showSelectOptions ? 'opacity-100 rotate-180' : 'opacity-50 group-hover:opacity-100'}`} />
                </div>
                {!showSelectOptions && (
                  <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                    {selectedSelectTool === 'direct' ? 'Direct Select Tool' : 'Select Tool'}
                  </div>
                )}
              </div>

              {/* Pen Tool Row */}
              <div className="flex items-center justify-start gap-[0.3vw] mb-[0.8vh] cursor-pointer relative group/tool">
                {/* Pen Tool Options Dropdown */}
                {showPenOptions && (
                  <div className="absolute right-[4.2vw] top-[-5vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[0.5vh] shadow-lg z-50 w-[2.7vw]">
                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'pen' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPenTool('pen');
                          setActiveMainTool('pen');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="streamline-cyber:pen-tool" width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'pen' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Pen
                      </div>
                    </div>

                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'pencil' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPenTool('pencil');
                          setActiveMainTool('pen');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="mingcute:pencil-fill" width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'pencil' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Pencil
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMainTool('pen');
                    closeAllDropdowns();
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPenOptions(!showPenOptions);
                    setShowSelectOptions(false);
                    setShowShapesOptions(false);
                    setActiveMainTool('pen');
                  }}
                  className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'pen' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
                >
                  {selectedPenTool === 'pencil' ? (
                    <Icon icon="mingcute:pencil-fill" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                  ) : (
                    <Icon icon="streamline-cyber:pen-tool" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                  )}
                </button>
                <div
                  className="w-[0.7vw] flex justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPenOptions(!showPenOptions);
                    setShowSelectOptions(false);
                    setShowShapesOptions(false);
                    setActiveMainTool('pen');
                  }}
                >
                  <Icon icon="lucide:chevron-down" className={`w-[0.7vw] h-[0.7vw] text-[#4B5563] transition-all ${showPenOptions ? 'opacity-100 rotate-180' : 'opacity-50 group-hover:opacity-100'}`} />
                </div>
                {!showPenOptions && (
                  <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                    {selectedPenTool === 'pencil' ? 'Pencil Tool' : 'Pen Tool'}
                  </div>
                )}
              </div>

              {/* Type Tool Row */}
              <div className="flex items-center justify-start gap-[0.3vw] mb-[0.8vh] cursor-pointer relative group/tool">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMainTool('type');
                    closeAllDropdowns();
                  }}
                  className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'type' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <Icon icon="mi:text" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                </button>
                <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Text Tool
                </div>
              </div>

              {/* Shapes Tool Row */}
              <div className="flex items-center justify-start gap-[0.3vw] mb-[0.8vh] cursor-pointer relative group/tool">
                {/* Shapes Tool Options Dropdown */}
                {showShapesOptions && (
                  <div className="absolute right-[4.2vw] top-[-12vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[0.5vh] shadow-lg z-50 w-[2.7vw]">
                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'rectangle' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShapeTool('rectangle');
                          setActiveMainTool('shapes');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="lucide:square" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'rectangle' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Rectangle
                      </div>
                    </div>

                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'circle' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShapeTool('circle');
                          setActiveMainTool('shapes');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="lucide:circle" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'circle' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Circle
                      </div>
                    </div>

                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'polygon' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShapeTool('polygon');
                          setActiveMainTool('shapes');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="lucide:triangle" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'polygon' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Polygon
                      </div>
                    </div>

                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'line' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShapeTool('line');
                          setActiveMainTool('shapes');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="tabler:line" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'line' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827] rotate-[-45deg]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Line
                      </div>
                    </div>

                    <div className="relative group/subtool flex items-center">
                      <button
                        className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'star' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShapeTool('star');
                          setActiveMainTool('shapes');
                          closeAllDropdowns();
                        }}
                      >
                        <Icon icon="lucide:star" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'star' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                      </button>
                      <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/subtool:opacity-100 transition-opacity duration-150 pointer-events-none z-[9999]">
                        Star
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMainTool('shapes');
                    closeAllDropdowns();
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowShapesOptions(!showShapesOptions);
                    setShowSelectOptions(false);
                    setShowPenOptions(false);
                    setActiveMainTool('shapes');
                  }}
                  className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'shapes' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <Icon
                    icon={
                      selectedShapeTool === 'rectangle' ? 'lucide:square' :
                        selectedShapeTool === 'circle' ? 'lucide:circle' :
                          selectedShapeTool === 'polygon' ? 'lucide:triangle' :
                            selectedShapeTool === 'line' ? 'tabler:line' : 'lucide:star'
                    }
                    width="1.2vw"
                    height="1.2vw"
                    className={`text-[#111827] ${selectedShapeTool === 'line' ? 'rotate-[-45deg]' : ''}`}
                  />
                </button>
                <div
                  className="w-[0.7vw] flex justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShapesOptions(!showShapesOptions);
                    setShowSelectOptions(false);
                    setShowPenOptions(false);
                    setActiveMainTool('shapes');
                  }}
                >
                  <Icon icon="lucide:chevron-down" className={`w-[0.7vw] h-[0.7vw] text-[#4B5563] transition-all ${showShapesOptions ? 'opacity-100 rotate-180' : 'opacity-50 group-hover:opacity-100'}`} />
                </div>
                {!showShapesOptions && (
                  <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                    Shapes Tool
                  </div>
                )}
              </div>

              {/* Icons Tool Row */}
              <div className="flex items-center justify-start gap-[0.3vw] mb-[0.8vh] cursor-pointer relative group/tool">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMainTool('grid');
                    closeAllDropdowns();
                  }}
                  className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'grid' ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-white/50 text-[#111827]'}`}
                >
                  <Icon icon="tabler:icons" width="1.2vw" height="1.2vw" />
                </button>
                <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Icons
                </div>
              </div>
              {/* Element Tool Row */}
              <div className="flex items-center justify-start gap-[0.3vw] mb-[0.8vh] cursor-pointer relative group/tool">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMainTool('element');
                    closeAllDropdowns();
                  }}
                  className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'element' ? 'bg-[#111827] text-white shadow-sm' : 'hover:bg-white/50 text-[#111827]'}`}
                >
                  <Icon icon="mynaui:component" width="1.2vw" height="1.2vw" />
                </button>
                <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
                <div className="absolute right-[calc(100%+0.6vw)] top-1/2 -translate-y-1/2 px-[0.6vw] py-[0.3vh] bg-gray-900/90 text-white text-[0.7vw] font-medium rounded-[0.4vw] shadow-md whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Elements
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Area container */}
        <div
          ref={editorContainerRef}
          className={`w-full h-full flex items-center justify-center relative ${isPopupEditor ? 'bg-transparent overflow-visible' : 'overflow-hidden bg-white'}`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && activeMainTool === 'grid' && typeof setActiveMainTool === 'function') {
              setActiveMainTool('select');
            }
          }}
        >
          {/* Zoomable Canvas Container */}
          <div
            id="main-zoom-container"
            ref={zoomContainerRef}
            className="flex items-center justify-center origin-center relative"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
            }}
          >
            {/* Pages Container Centered */}
            <div className="flex items-center justify-center gap-[0] relative z-10 shadow-[0_0_15px_rgba(0,0,0,0.20)] rounded-sm">
              {/* Single A4 Canvas Page */}
              {pages.length > 0 && pages[activePageIndex] && (
                <div className="relative group/page">
                  {/* A4 Canvas Page Inner */}
                  <div
                    className={`relative z-0 flex flex-col bg-white group/inner transition-shadow duration-300 ${localTrimView ? 'overflow-hidden' : 'overflow-visible'}`}
                    style={isPopupEditor ? {
                      width: `min(55vw, 72vh * (${canvasAspectRatio}))`,
                      height: `min(72vh, 55vw / (${canvasAspectRatio}))`,
                      borderRadius: '1.2vw',
                      backgroundColor: '#ffffff'
                    } : {
                      height: '78vh',
                      aspectRatio: canvasAspectRatio,
                      minHeight: '400px',
                    }}
                  >
                    {/* Page Content */}
                    <div
                      className={`flex-1 w-full relative page-svg-container ${isConvertedFlipbook ? 'is-pdf-project' : ''} ${localTrimView ? 'trim-view-on overflow-hidden' : 'trim-view-off overflow-visible'} tool-${selectedSelectTool} ${(activeTopTool !== 'interaction') ? 'hide-free-frames' : ''} ${(activeMainTool === 'pen' && selectedPenTool === 'pencil') ? 'pencil-mode' : ''} ${(activeMainTool === 'pen' && selectedPenTool === 'pen') ? 'pen-mode' : ''} ${(activeMainTool === 'shapes') ? 'shape-mode' : ''} ${(activeMainTool === 'type') ? 'type-mode' : ''}`}
                      data-page-index={activePageIndex}
                    >
                      <style>{svgGlobalStyles}</style>
                      {(() => {
                        const displayIndex = activePageIndex;
                        const isShapeActive = activeMainTool === 'shapes';
                        const isPencilActive = activeMainTool === 'pen' && selectedPenTool === 'pencil';
                        const isPenToolActive = activeMainTool === 'pen';
                        const isTypeActive = activeMainTool === 'type';

                        const pageHtml = pages[displayIndex]?.html;
                        const isPageEmpty = !pages[displayIndex]?.isHidden && (!pageHtml || (pages[displayIndex]?.layers?.length === 0) || (pages[displayIndex]?.layers?.length === 1 && (!pages[displayIndex].layers[0].children || pages[displayIndex].layers[0].children.length === 0) && !pages[displayIndex].layers[0].id?.includes('shape') && !pages[displayIndex].layers[0].id?.includes('video') && !pages[displayIndex].layers[0].id?.includes('image') && !pages[displayIndex].layers[0].id?.includes('embed')));

                        return (
                          <div
                            className={`absolute inset-0 w-full h-full overflow-visible flex items-center justify-center ${isPopupEditor ? 'bg-transparent' : 'bg-white'}`}
                            style={{ cursor: (isPencilActive ? PENCIL_CURSOR : (isPenToolActive ? PEN_CURSOR : (isShapeActive ? SHAPE_CURSOR : (isTypeActive ? TYPE_CURSOR : 'default')))) }}
                          >
                            {pageHtml && (
                              <div
                                key={`canvas-content-${displayIndex}`}
                                id={`canvas-content-${displayIndex}`}
                                className="w-full h-full flex items-center justify-center"
                                ref={(el) => {
                                  if (el) {
                                    const newHtml = getHtmlToRender(displayIndex, pages[displayIndex]?.html);
                                    if (window.__skipCanvasUpdateForPage === displayIndex) {
                                      window.__skipCanvasUpdateForPage = -1;
                                      el.__lastHtml = newHtml;
                                      el.__lastPageIndex = displayIndex;
                                    } else if (el.__lastHtml !== newHtml) {
                                      // Fast path: When switching between different pages, direct innerHTML swap is 100x faster than recursive syncDOM!
                                      if (el.__lastPageIndex !== displayIndex) {
                                        el.innerHTML = newHtml;
                                        el.__lastPageIndex = displayIndex;
                                        el.__lastHtml = newHtml;
                                      } else {
                                        const parser = new DOMParser();
                                        const doc = parser.parseFromString(newHtml, 'text/html');
                                        const newChildren = Array.from(doc.body.childNodes);

                                        const oldChildren = Array.from(el.childNodes);
                                        const maxLength = Math.max(oldChildren.length, newChildren.length);

                                        for (let i = 0; i < maxLength; i++) {
                                          if (!oldChildren[i]) {
                                            el.appendChild(newChildren[i].cloneNode(true));
                                          } else if (!newChildren[i]) {
                                            el.removeChild(oldChildren[i]);
                                          } else {
                                            syncDOM(oldChildren[i], newChildren[i]);
                                          }
                                        }

                                        el.__lastHtml = newHtml;
                                        el.__lastPageIndex = displayIndex;
                                      }
                                    }
                                  }
                                }}
                                onMouseDown={(e) => handleSvgMouseDown(displayIndex, e)}
                                onMouseMove={(e) => handleSvgMouseMove(displayIndex, e)}
                                onMouseLeave={handleSvgMouseLeave}
                                onClick={handleSvgClick}
                                onDragOver={(e) => {
                                  e.preventDefault(); // Necessary to allow dropping external assets
                                  e.dataTransfer.dropEffect = 'copy';
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (typeof setActiveMainTool === 'function') {
                                    setActiveMainTool('select');
                                  }
                                  try {
                                    const svg = e.currentTarget.querySelector('svg');
                                    if (!svg) return;

                                    // Convert screen coordinates to SVG coordinates
                                    const pt = svg.createSVGPoint();
                                    pt.x = e.clientX;
                                    pt.y = e.clientY;
                                    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
                                    const dropPoint = { x: svgP.x, y: svgP.y };

                                    let targetShapeId = undefined;
                                    if (e.target) {
                                      const leaf = e.target.closest('[data-type="shape"], [data-type="vector-path"], [data-shape-type]');
                                      if (leaf && leaf.id && !leaf.id.includes('mask') && !leaf.id.includes('clip')) {
                                        targetShapeId = leaf.id;
                                      }
                                    }

                                    let data = null;
                                    console.log('Drop Event Fired! Types:', e.dataTransfer.types);
                                    
                                    // 1. Try reading JSON data
                                    const rawJson = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('application/x-flipbook-element');
                                    if (rawJson) {
                                      try { data = JSON.parse(rawJson); } catch (_) { }
                                    }

                                    // 2. Try reading URL or text from external window/tab (e.g. Canva assets, web pages)
                                    if (!data) {
                                      const rawHtml = e.dataTransfer.getData('text/html');
                                      const rawUri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
                                      let extractedUrl = null;

                                      if (rawHtml) {
                                        const match = rawHtml.match(/(?:src|href)=["']([^"']+)["']/i);
                                        if (match && match[1]) {
                                          extractedUrl = match[1];
                                        }
                                      }

                                      if (!extractedUrl && rawUri && rawUri.trim()) {
                                        const lines = rawUri.trim().split(/[\r\n]+/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
                                        if (lines.length > 0) {
                                          extractedUrl = lines[0];
                                        }
                                      }

                                      if (extractedUrl) {
                                        const trimmed = extractedUrl.trim();
                                        if (trimmed.startsWith('http') || trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('/')) {
                                          const lower = trimmed.toLowerCase();
                                          if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo')) {
                                            data = { type: 'video', url: trimmed };
                                          } else if (lower.endsWith('.gif')) {
                                            data = { type: 'gif', url: trimmed };
                                          } else {
                                            data = { type: 'image', url: trimmed };
                                          }
                                        }
                                      }
                                    }

                                    // 3. Try reading external files dropped directly from Desktop / File Explorer
                                    if (!data && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                      const files = Array.from(e.dataTransfer.files);
                                      let hasUnsupported = false;
                                      files.forEach(async (file, idx) => {
                                        const fileUrl = URL.createObjectURL(file);
                                        const offsetPoint = { x: dropPoint.x + idx * 20, y: dropPoint.y + idx * 20 };

                                        if (file.type.startsWith('image/')) {
                                          let isGif = file.type === 'image/gif';
                                          if (!isGif && file.type.includes('webp')) {
                                            isGif = await checkIsAnimatedWebp(file);
                                          }
                                          window.dispatchEvent(new CustomEvent('add-image-to-editor', {
                                            detail: {
                                              pageIndex: displayIndex,
                                              url: fileUrl,
                                              gifUrl: isGif ? fileUrl : undefined,
                                              name: file.name,
                                              type: isGif ? 'gif' : 'image',
                                              dropPoint: offsetPoint,
                                              targetShapeId
                                            }
                                          }));
                                        } else if (file.type.startsWith('video/')) {
                                          window.dispatchEvent(new CustomEvent('upload-video-to-editor', {
                                            detail: {
                                              pageIndex: displayIndex,
                                              videoUrl: fileUrl,
                                              file,
                                              originalUrl: fileUrl,
                                              dropPoint: offsetPoint
                                            }
                                          }));
                                        } else {
                                          hasUnsupported = true;
                                        }
                                      });
                                      if (hasUnsupported) {
                                        toast.error('Only Image, Video, and GIF formats are allowed.');
                                      }
                                      return;
                                    }

                                    if (!data) return;

                                    if (data.type === 'hotspot') {
                                      window.dispatchEvent(new CustomEvent('add-hotspot-to-editor', {
                                        detail: {
                                          pageIndex: displayIndex,
                                          icon: data.icon,
                                          dropPoint,
                                          presetId: data.icon?.presetId
                                        }
                                      }));
                                      setShowHotspotPopup(false);
                                    } else if (data.type === 'icon' || data.type === 'shape') {
                                      window.dispatchEvent(new CustomEvent('add-icon-to-editor', {
                                        detail: {
                                          pageIndex: displayIndex,
                                          icon: data.icon,
                                          dropPoint,
                                          isShape: data.type === 'shape'
                                        }
                                      }));
                                    } else if (data.type === 'button') {
                                      console.log('Button Dropped:', data);
                                      window.dispatchEvent(new CustomEvent('add-element-to-editor', {
                                        detail: {
                                          pageIndex: displayIndex,
                                          svgContent: data.svgContent,
                                          dropPoint
                                        }
                                      }));
                                    } else if (data.type === 'image' || data.type === 'upload' || data.url) {
                                      window.dispatchEvent(new CustomEvent('add-image-to-editor', {
                                        detail: {
                                          pageIndex: displayIndex,
                                          url: data.url || data.src,
                                          name: data.name || 'Image',
                                          type: 'image',
                                          dropPoint,
                                          targetShapeId
                                        }
                                      }));
                                    } else if (data.type === 'gif') {
                                      window.dispatchEvent(new CustomEvent('add-image-to-editor', {
                                        detail: {
                                          pageIndex: displayIndex,
                                          url: data.url || data.src,
                                          gifUrl: data.url || data.src,
                                          name: data.name || 'GIF',
                                          type: 'gif',
                                          dropPoint,
                                          targetShapeId
                                        }
                                      }));

                                    } else if (data.type === 'video') {
                                      window.dispatchEvent(new CustomEvent('upload-video-to-editor', {
                                        detail: {
                                          pageIndex: displayIndex,
                                          videoUrl: data.url || data.src,
                                          file: data.file,
                                          originalUrl: data.url || data.src,
                                          dropPoint
                                        }
                                      }));
                                    }
                                  } catch (err) {
                                    console.error('[MainEditor] Drop error:', err);
                                  }
                                }}
                                onContextMenu={(e) => handleSvgContextMenu(displayIndex, e)}
                              />
                            )}
                            {pages[displayIndex]?.isHidden && (
                              <div key={`hidden-placeholder-${displayIndex}`} className="w-full h-full flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] z-20 absolute inset-0 pointer-events-auto">
                                <Icon icon="ant-design:eye-invisible-outlined" width="3vw" height="3vw" style={{ strokeWidth: 0.2 }} className="text-gray-500 mb-[1vw] svg-icon-override" />
                                <span className="text-gray-700 font-semibold text-[1.2vw]">This page is hidden</span>
                                <span className="text-gray-500 text-[0.85vw] mt-[0.5vw]">It will not be shown in the flipbook.</span>
                              </div>
                            )}
                            
                            {!pages[displayIndex]?.isHidden && (
                              <>
                                {/* Selection Overlay (Overlay rotated element perfectly) */}
                                <svg
                                  id={`highlight-overlay-${displayIndex}`}
                                  className={`absolute inset-0 w-full h-full selection-overlay-layer transition-opacity duration-200 ${isSpaceDown ? 'opacity-0' : 'opacity-100'}`}
                                  style={{ overflow: 'visible', pointerEvents: 'none' }}
                                />

                                {/* HTML Overlay for Resize Handles (Clickable) */}
                                <div
                                  id={`highlight-overlay-html-${displayIndex}`}
                                  className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${isSpaceDown ? 'opacity-0' : 'opacity-100'}`}
                                  style={{ overflow: 'visible', pointerEvents: 'none' }}
                                />
                                <AnimatePresence>
                                  {selectedLayerId && !isEditingTextRef.current && multiSelectedIds.size <= 1 && (activeTopTool === 'animation') && (
                                    <SelectionTooltip
                                      selectedId={selectedLayerId}
                                      multiSelectedIds={multiSelectedIds}
                                      zoom={zoom}
                                      setActiveTopTool={setActiveTopTool}
                                      pageIndex={displayIndex}
                                      activePageIndex={activePageIndex}
                                      updateElementAttribute={updateElementAttribute}
                                      activeTopTool={activeTopTool}
                                    />
                                  )}
                                </AnimatePresence>
                              </>
                            )}

                            {/* Marquee Selection Box */}
                            {!isConvertedFlipbook && (
                              <div
                                ref={marqueeOverlayRef1}
                                style={{
                                  position: 'absolute',
                                  border: '1px solid #6366F1',
                                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                  pointerEvents: 'none',
                                  zIndex: 1000,
                                  display: 'none'
                                }}
                              />
                            )}

                            {isPageEmpty && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none bg-transparent opacity-60">
                                <div className="text-center text-[#B0B5C1] text-[0.85vw] font-normal leading-snug mb-[0.8vw]">
                                  Ready-made templates<br />are available for a quicker start
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenTemplateModal(displayIndex);
                                  }}
                                  className="text-[#5145F6] hover:text-[#3B2DD6] text-[0.85vw] font-medium mb-[0.8vw] pointer-events-auto cursor-pointer underline underline-offset-4 decoration-1"
                                >
                                  Add Templates
                                </button>
                                <div className="text-[#B0B5C1] text-[0.85vw] mb-[0.8vw] font-normal">
                                  (or)
                                </div>
                                <div className="text-[#D1D5DB] text-[0.85vw] font-normal">
                                  Create your own Design
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Page Navigation Controls Widget */}
          {pages.length > 0 && (
            <div className="absolute bottom-[1vw] right-[1vw] z-40 select-none">
              {/* Single Common Container for Left Arrow, Page Number, and Right Arrow */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-full px-[1.1vw] py-[0.5vw] flex items-center gap-[0.8vw]">
                {/* Left Arrow Button */}
                <button
                  disabled={activePageIndex === 0}
                  onClick={handlePrevPage}
                  className={`flex items-center justify-center transition-all duration-200 group ${activePageIndex === 0
                    ? 'opacity-25 cursor-not-allowed'
                    : 'cursor-pointer hover:scale-110 active:scale-95'
                    }`}
                  title="Previous Page"
                >
                  <Icon icon="ion:caret-up" width="1.4vw" height="1.4vw" className="text-[#6B7280] group-hover:text-[#111827] rotate-[-90deg]" />
                </button>

                {/* Center Page Number Input & Total */}
                <div className="flex items-center text-[#4B5563] text-[0.85vw] font-medium tracking-wide">
                  <input
                    type="text"
                    className="text-center bg-transparent border-b border-transparent hover:border-gray-300 outline-none text-[#111827] font-semibold text-[0.85vw] p-0 transition-all cursor-text select-all"
                    style={{
                      width: `${Math.max(1.1, String(isEditingPage ? pageInputVal : (activePageIndex + 1)).length * 0.62)}vw`
                    }}
                    value={isEditingPage ? pageInputVal : (activePageIndex + 1)}
                    onFocus={(e) => {
                      setIsEditingPage(true);
                      setPageInputVal((activePageIndex + 1).toString());
                      e.target.select();
                    }}
                    onBlur={() => {
                      setIsEditingPage(false);
                      const parsed = parseInt(pageInputVal, 10);
                      if (!isNaN(parsed) && parsed >= 1 && parsed <= pages.length) {
                        const targetIdx = parsed - 1;
                        if (targetIdx !== activePageIndex && typeof setActivePageIndex === 'function') {
                          setActivePageIndex(targetIdx);
                        }
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPageInputVal(val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.target.blur();
                      } else if (e.key === 'Escape') {
                        setIsEditingPage(false);
                      }
                    }}
                  />
                  <span className="text-[#6B7280] font-normal mx-[0.25vw]">/</span>
                  <span className="text-[#4B5563] font-medium">{pages.length}</span>
                </div>

                {/* Right Arrow Button */}
                <button
                  disabled={activePageIndex + 1 >= pages.length}
                  onClick={handleNextPage}
                  className={`flex items-center justify-center transition-all duration-200 group ${activePageIndex + 1 >= pages.length ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                  title="Next Page"
                >
                  <Icon icon="ion:caret-up" width="1.4vw" height="1.4vw" className="text-[#6B7280] group-hover:text-[#111827] rotate-[90deg]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pages rendered on demand via PageCacheManager */}
    </div>
  );
};


const PlusIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const FilePlusIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const DuplicateIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const TemplateIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

const ClearIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>
);

const DeleteIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const MenuOption = ({ icon, label, onClick, color = "text-gray-700", hoverColor = "hover:bg-gray-50" }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium transition-colors rounded-[0.4vw] text-left cursor-pointer ${color} ${hoverColor}`}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

export default MainEditor;
