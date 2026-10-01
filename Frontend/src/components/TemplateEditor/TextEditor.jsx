import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ColorPicker, { parseGradient } from './ColorPicker';
import { generateGradientString } from "../CustomizedEditor/AppearanceShared";
import Color from './Color';
import Effect from './Effect';
import { applyStyleToActiveTextSelection } from './editorUtils';

import { Icon } from '@iconify/react';
import {
  ChevronDown, PencilLine, AlignLeft, Bold, Minus, List,
  ChevronUp, Settings2, ArrowsUpFromLine,
  AlignCenter, AlignRight, AlignJustify, Italic, Underline,
  Strikethrough, Type, ListOrdered, RotateCcw, X, Pipette,
  ChevronLeft, ChevronRight, Star, Zap, Eye,
  ArrowLeftRight, ArrowUpDown, SlidersHorizontal, Maximize,
  CaseUpper, CaseLower, Palette, Edit3
} from 'lucide-react';

const fontFamilies = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather',
  'Designer_Signature', 'Public Sans', 'Lora', 'Cabin',
  'Allura', 'Parisienne', 'Satisfy'
];

const fontWeights = [
  { name: 'Thin', value: '50' },
  { name: 'Extra Light', value: '100' },
  { name: 'Light', value: '200' },
  { name: 'Regular', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi Bold', value: '600' },
  { name: 'Bold', value: '800' }

];

// Color conversion helpers
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).toUpperCase();
};

const rgbToHsv = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }
    h /= 6;
  }
  return { h: h * 360, s, v };
};

const hsvToRgb = (h, s, v) => {
  h /= 360;
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
    default: break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};



const getStrokeColorWithOpacity = (color, opacityStr) => {
  if (color === 'none' || color === 'transparent' || !color) return 'transparent';
  if (color.startsWith('#')) {
    let c = color.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length === 6) {
      const num = parseInt(c, 16);
      if (!isNaN(num)) {
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        const op = parseFloat(opacityStr !== undefined && opacityStr !== null ? opacityStr : 1);
        return `rgba(${r}, ${g}, ${b}, ${isNaN(op) ? 1 : op})`;
      }
    }
  }
  return color;
};

// Shared mapping for CSS properties
const STYLE_MAP = {
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  fontStyle: 'fontStyle',
  textDecoration: 'textDecoration',
  textAlign: 'textAlign',
  letterSpacing: 'letterSpacing',
  lineHeight: 'lineHeight',
  textTransform: 'textTransform',
  listStyleType: 'listStyleType',
  fill: 'fill',
  stroke: 'stroke',
  'stroke-opacity': 'stroke-opacity',
  strokeWidth: 'strokeWidth',
  strokeDasharray: 'strokeDasharray',
  strokeLinecap: 'strokeLinecap',
  strokeLinejoin: 'strokeLinejoin',
  opacity: 'opacity'
};

// Maps React/camelCase property names to SVG presentation attribute names
const SVG_ATTR_MAP = {
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  fontStyle: 'font-style',
  textDecoration: 'text-decoration',
  textAlign: 'text-anchor',
  letterSpacing: 'letter-spacing',
  lineHeight: 'line-height',
  textTransform: 'text-transform',
  fill: 'fill',
  stroke: 'stroke',
  strokeWidth: 'stroke-width',
  strokeDasharray: 'stroke-dasharray',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin'
};

// Converts textAlign CSS values to SVG text-anchor values
const TEXT_ALIGN_TO_ANCHOR = {
  left: 'start',
  center: 'middle',
  right: 'end',
  start: 'start',
  middle: 'middle',
  end: 'end',
};

const syncGradient = (doc, element, baseAttr) => {
  const type = element.getAttribute(`${baseAttr}-type`);
  const currentValue = element.getAttribute(baseAttr);
  const isUrl = currentValue && currentValue.toLowerCase().startsWith('url(#');
  const gradType = element.getAttribute(`${baseAttr}-gradient-type`) || 'linear';
  const stopsJson = element.getAttribute(`${baseAttr}-stops`);

  console.log(`[syncGradient] id=${element.id}, type=${type}, isUrl=${isUrl}, attr=${baseAttr}`);

  if (type === 'solid' || type === 'none') return;

  // If it's a URL, we should at least propagate it to children even if we can't "sync" it from stops
  if (isUrl && !stopsJson) {
    console.log(`[syncGradient] Propagating global URL: ${currentValue}`);
    if (element.tagName.toLowerCase() === 'g' || element.tagName.toLowerCase() === 'text') {
      Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
        child.setAttribute(baseAttr, currentValue);
        if (child.style) child.style.setProperty(baseAttr, currentValue, 'important');
      });
    }
    return;
  }

  if (!type && !isUrl) return;
  if (!stopsJson) return;

  let stops = [];
  try { stops = JSON.parse(stopsJson); } catch (e) { return; }

  const svgRoot = doc.querySelector('svg') || (doc.tagName?.toLowerCase() === 'svg' ? doc : null);
  if (!svgRoot) return;

  const ownerDoc = doc.ownerDocument || doc;

  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  if (!element.id) {
    element.id = `${element.tagName}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cache-busting: Remove any existing gradients for this element to force a fresh render
  const gradIdPrefix = `grad-${element.id}-${baseAttr}`;
  Array.from(defs.querySelectorAll(`[id^="${gradIdPrefix}"]`)).forEach(oldGrad => oldGrad.remove());

  const gradId = `${gradIdPrefix}-${Math.random().toString(36).substr(2, 4)}`;
  let gradEl = null;

  const svgGradType = (gradType === 'angular' || gradType === 'diamond') ? (gradType === 'angular' ? 'linear' : 'radial') : gradType;

  if (gradEl && gradEl.tagName.toLowerCase() !== `${svgGradType}gradient`.toLowerCase()) {
    gradEl.remove();
    gradEl = null;
  }

  if (!gradEl) {
    gradEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", `${svgGradType}Gradient`);
    gradEl.id = gradId;
    // Calculate angle for linear gradients
    if (svgGradType === 'linear') {
      const angle = parseFloat(element.getAttribute(`${baseAttr}-angle`) || '0');
      // Convert angle to SVG coordinates (0 deg is horizontal left-to-right)
      const angleRad = (angle * Math.PI) / 180;
      const x1 = Math.round(50 - Math.cos(angleRad) * 50) + '%';
      const y1 = Math.round(50 - Math.sin(angleRad) * 50) + '%';
      const x2 = Math.round(50 + Math.cos(angleRad) * 50) + '%';
      const y2 = Math.round(50 + Math.sin(angleRad) * 50) + '%';

      gradEl.setAttribute('x1', x1);
      gradEl.setAttribute('y1', y1);
      gradEl.setAttribute('x2', x2);
      gradEl.setAttribute('y2', y2);
    } else {
      const radius = parseFloat(element.getAttribute(`${baseAttr}-radius`) || '50');
      gradEl.setAttribute('cx', '50%');
      gradEl.setAttribute('cy', '50%');
      gradEl.setAttribute('r', radius + '%');
    }
    defs.appendChild(gradEl);
  } else if (svgGradType === 'linear') {
    // Update existing linear gradient angle
    const angle = parseFloat(element.getAttribute(`${baseAttr}-angle`) || '0');
    const angleRad = (angle * Math.PI) / 180;
    gradEl.setAttribute('x1', Math.round(50 - Math.cos(angleRad) * 50) + '%');
    gradEl.setAttribute('y1', Math.round(50 - Math.sin(angleRad) * 50) + '%');
    gradEl.setAttribute('x2', Math.round(50 + Math.cos(angleRad) * 50) + '%');
    gradEl.setAttribute('y2', Math.round(50 + Math.sin(angleRad) * 50) + '%');
  } else {
    const radius = parseFloat(element.getAttribute(`${baseAttr}-radius`) || '50');
    gradEl.setAttribute('cx', '50%');
    gradEl.setAttribute('cy', '50%');
    gradEl.setAttribute('r', radius + '%');
  }

  while (gradEl.firstChild) gradEl.removeChild(gradEl.firstChild);
  stops.forEach(s => {
    const stop = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute('offset', `${s.offset}%`);
    stop.setAttribute('stop-color', s.color);
    stop.setAttribute('stop-opacity', (s.opacity !== undefined && s.opacity !== null) ? s.opacity : 1);
    gradEl.appendChild(stop);
  });

  const finalUrl = `url(#${gradId})`;
  element.setAttribute(baseAttr, finalUrl);
  if (element.style) {
    element.style.setProperty(baseAttr, finalUrl, 'important');
  }

  // Handle foreignObject css gradients
  if (element.tagName.toLowerCase() === 'foreignobject' && element.firstElementChild) {
    if (baseAttr === 'fill') {
      let cssGradStr = '';

      if (svgGradType === 'linear') {
        const angle = parseFloat(element.getAttribute(`${baseAttr}-angle`) || '0');
        cssGradStr = `linear-gradient(${angle}deg, ${stops.map(s => `${s.color} ${s.offset}%`).join(', ')})`;
      } else {
        const radius = parseFloat(element.getAttribute(`${baseAttr}-radius`) || '100');
        const scale = radius / 100;
        cssGradStr = `radial-gradient(circle at center, ${stops.map(s => `${s.color} ${s.offset * scale}%`).join(', ')})`;
      }

      const applyCssGradToElement = (el) => {
        el.style.setProperty('background-image', cssGradStr, 'important');
        el.style.setProperty('-webkit-background-clip', 'text', 'important');
        el.style.setProperty('background-clip', 'text', 'important');
        el.style.setProperty('color', 'transparent', 'important');
        el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
      };

      applyCssGradToElement(element.firstElementChild);
      Array.from(element.firstElementChild.querySelectorAll('*')).forEach(applyCssGradToElement);
    }
  }

  // Force inheritance for all nested children
  if (element.tagName.toLowerCase() === 'g' || element.tagName.toLowerCase() === 'text') {
    Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
      child.setAttribute(baseAttr, finalUrl);
      if (child.style) {
        child.style.setProperty(baseAttr, finalUrl, 'important');
      }
    });
  }
};

const syncTextEffect = (doc, element) => {
  if (!element) return;

  const isForeignObject = element.tagName.toLowerCase() === 'foreignobject';
  const getVal = (attr, defVal) => element.getAttribute(attr) || defVal;

  const hasDropShadow = element.getAttribute('data-effect-drop-shadow') === 'true';
  const hasInnerShadow = element.getAttribute('data-effect-inner-shadow') === 'true';
  const hasBlur = element.getAttribute('data-effect-blur') === 'true';
  const hasBackgroundBlur = element.getAttribute('data-effect-background-blur') === 'true';
  const hasClipContent = hasBlur && element.getAttribute('data-effect-blur-clip') === 'true';

  // --- HTML TEXT (ForeignObject) FIX ---
  // Apply simpler CSS filters for standard HTML text unless it specifically requires complex SVG filters (like Inner Shadow, or Clip Content which needs crisp stroke extraction)
  if (isForeignObject && !hasInnerShadow && !hasClipContent) {
    const inner = element.firstElementChild;
    if (inner) {
      if (!hasDropShadow && !hasBlur && !hasBackgroundBlur) {
        inner.style.removeProperty('filter');
        inner.style.removeProperty('backdrop-filter');
        inner.style.removeProperty('-webkit-backdrop-filter');
      } else {
        let innerCssFilter = '';
        let outerCssFilter = '';

        if (hasBlur) {
          const blurVal = getVal('data-effect-blur-value', '0.3');
          innerCssFilter += `blur(${blurVal}px) `;
        }
        if (hasDropShadow) {
          const color = getVal('data-effect-drop-shadow-color', '#000000');
          const dx = getVal('data-effect-drop-shadow-x', '2');
          const dy = getVal('data-effect-drop-shadow-y', '2');
          const blur = getVal('data-effect-drop-shadow-blur', '4');
          const opacity = parseFloat(getVal('data-effect-drop-shadow-opacity', '25')) / 100;

          const r = parseInt(color.slice(1, 3), 16) || 0;
          const g = parseInt(color.slice(3, 5), 16) || 0;
          const b = parseInt(color.slice(5, 7), 16) || 0;

          const dropShadowStr = `drop-shadow(${dx}px ${dy}px ${blur}px rgba(${r},${g},${b},${opacity})) `;
          if (hasClipContent) {
            // Apply drop-shadow to the foreignObject wrapper so it isn't clipped by inner's clip-path
            outerCssFilter += dropShadowStr;
          } else {
            innerCssFilter += dropShadowStr;
          }
        }

        if (innerCssFilter.trim()) {
          inner.style.setProperty('filter', innerCssFilter.trim(), 'important');
        } else {
          inner.style.removeProperty('filter');
        }
        if (outerCssFilter.trim()) {
          element.style.setProperty('filter', outerCssFilter.trim(), 'important');
        } else {
          element.style.removeProperty('filter');
        }

        if (hasClipContent) {
          const rx = element.getAttribute('rx') || '0';
          const roundStr = rx !== '0' && rx !== '0px' ? ` round ${parseFloat(rx)}px` : '';
          inner.style.setProperty('clip-path', `inset(0% 0% 0% 0%${roundStr})`, 'important');
        } else {
          inner.style.removeProperty('clip-path');
        }

        if (hasBackgroundBlur) {
          const bBlur = getVal('data-effect-background-blur-value', '10');
          inner.style.setProperty('backdrop-filter', `blur(${bBlur}px)`, 'important');
          inner.style.setProperty('-webkit-backdrop-filter', `blur(${bBlur}px)`, 'important');
        } else {
          inner.style.removeProperty('backdrop-filter');
          inner.style.removeProperty('-webkit-backdrop-filter');
        }
      }
    }

    // Clean up any stale SVG filter that caused the glitch
    element.removeAttribute('filter');
    const filterId = `filter-${element.id || element.getAttribute('data-name') || 'text-effect'}`;
    const svgRoot = element.ownerSVGElement || element.closest('svg') || (doc && doc.querySelector ? doc.querySelector('svg') : null);
    if (svgRoot) {
      const staleFilter = svgRoot.querySelector(`defs [id="${filterId}"]`);
      if (staleFilter) staleFilter.remove();
    }
    return;
  }

  // Clear any stale CSS filters
  element.style.removeProperty('filter');
  if (element.tagName.toLowerCase() === 'text' || element.tagName.toLowerCase() === 'g') {
    Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
      child.style.removeProperty('filter');
    });
  }

  const svgRoot = element.ownerSVGElement || element.closest('svg') || (doc && doc.querySelector ? doc.querySelector('svg') : null);
  if (!svgRoot) return;

  const d = element.ownerDocument || document;
  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = d.createElementNS("http://www.w3.org/2000/svg", "defs");
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  const baseFilterId = `filter-${element.id || element.getAttribute('data-name') || 'text-effect'}`;
  
  // Cache-busting: Remove any existing filters for this element to force a fresh render
  Array.from(defs.querySelectorAll(`[id^="${baseFilterId}"]`)).forEach(old => old.remove());

  const filterId = `${baseFilterId}-${Math.random().toString(36).substr(2, 4)}`;

  if (!hasDropShadow && !hasInnerShadow && !hasBlur) {
    element.removeAttribute('filter');
    element.style.backdropFilter = '';
    element.style.webkitBackdropFilter = '';
    return;
  }

  let filterEl = d.createElementNS("http://www.w3.org/2000/svg", "filter");
  filterEl.id = filterId;
  filterEl.setAttribute('x', '-50%');
  filterEl.setAttribute('y', '-50%');
  filterEl.setAttribute('width', '200%');
  filterEl.setAttribute('height', '200%');
  defs.appendChild(filterEl);

  let currentIn = "SourceGraphic";

  // 1. Layer Blur (Applied FIRST if Clip Content is ON)
  if (hasBlur && hasClipContent) {
    const blurVal = parseFloat(getVal('data-effect-blur-value', '0.3'));
    const spreadVal = parseFloat(getVal('data-effect-blur-spread', '0'));

    let blurSource = currentIn;

    if (spreadVal !== 0) {
      const morph = d.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
      morph.setAttribute('operator', spreadVal >= 0 ? 'dilate' : 'erode');
      morph.setAttribute('radius', Math.abs(spreadVal));
      morph.setAttribute('in', currentIn);
      morph.setAttribute('result', 'blur_morph_first');
      filterEl.appendChild(morph);
      blurSource = "blur_morph_first";
    }

    const blurNode = d.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    blurNode.setAttribute('stdDeviation', blurVal);
    blurNode.setAttribute('in', blurSource);
    blurNode.setAttribute('result', 'blur_out_first');
    filterEl.appendChild(blurNode);
    currentIn = "blur_out_first";
  }

  // 2. Clip Content (Clips the blurred SourceGraphic to the original Alpha, restoring crisp stroke if needed)
  if (hasClipContent) {
    const bgStrokeWidth = parseFloat(getVal('data-bg-stroke-width', '0'));
    const textStrokeWidth = parseFloat(getVal('stroke-width', '0'));
    const strokeErodeRadius = bgStrokeWidth > 0 ? bgStrokeWidth : textStrokeWidth;
    
    let insideMask = 'SourceAlpha';

    if (strokeErodeRadius > 0 && isForeignObject) {
      const borderMorph = d.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
      borderMorph.setAttribute('operator', 'erode');
      borderMorph.setAttribute('radius', strokeErodeRadius);
      borderMorph.setAttribute('in', 'SourceAlpha');
      borderMorph.setAttribute('result', 'clip_inside_mask');
      filterEl.appendChild(borderMorph);
      insideMask = 'clip_inside_mask';
    }

    const compClip = d.createElementNS("http://www.w3.org/2000/svg", "feComposite");
    compClip.setAttribute('operator', 'in');
    compClip.setAttribute('in', currentIn);
    compClip.setAttribute('in2', insideMask);
    compClip.setAttribute('result', 'clipped_blur');
    filterEl.appendChild(compClip);
    currentIn = 'clipped_blur';

    if (strokeErodeRadius > 0 && isForeignObject) {
      // Extract crisp stroke from original SourceGraphic
      const crispStroke = d.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      crispStroke.setAttribute('operator', 'out');
      crispStroke.setAttribute('in', 'SourceGraphic');
      crispStroke.setAttribute('in2', insideMask);
      crispStroke.setAttribute('result', 'crisp_stroke');
      filterEl.appendChild(crispStroke);
      
      // Composite crisp stroke over the blurred interior
      const restoreStroke = d.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      restoreStroke.setAttribute('operator', 'over');
      restoreStroke.setAttribute('in', 'crisp_stroke');
      restoreStroke.setAttribute('in2', currentIn);
      restoreStroke.setAttribute('result', 'restored_final');
      filterEl.appendChild(restoreStroke);
      currentIn = 'restored_final';
    }
  }

  // 3. Inner Shadow (Generated from crisp Alpha, drawn OVER the blurred/clipped content)
  if (hasInnerShadow) {
    const color = getVal('data-effect-inner-shadow-color', '#000000');
    const opacity = parseFloat(getVal('data-effect-inner-shadow-opacity', '25')) / 100;
    const dx = getVal('data-effect-inner-shadow-x', '2');
    const dy = getVal('data-effect-inner-shadow-y', '2');
    const blur = parseFloat(getVal('data-effect-inner-shadow-blur', '4'));
    const spread = parseFloat(getVal('data-effect-inner-shadow-spread', '0'));
    const bgStrokeWidth = parseFloat(getVal('data-bg-stroke-width', '0'));
    const textStrokeWidth = parseFloat(getVal('stroke-width', '0'));
    const strokeErodeRadius = bgStrokeWidth > 0 ? bgStrokeWidth : textStrokeWidth;

    let baseAlpha = 'SourceAlpha';
    if (strokeErodeRadius > 0 && isForeignObject) {
      const borderMorph = d.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
      borderMorph.setAttribute('operator', 'erode');
      borderMorph.setAttribute('radius', strokeErodeRadius);
      borderMorph.setAttribute('in', 'SourceAlpha');
      borderMorph.setAttribute('result', 'base_alpha');
      filterEl.appendChild(borderMorph);
      baseAlpha = 'base_alpha';
    }

    let isSource = baseAlpha;
    if (spread !== 0) {
      const morph = d.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
      morph.setAttribute('operator', spread >= 0 ? 'dilate' : 'erode');
      morph.setAttribute('radius', Math.abs(spread));
      morph.setAttribute('in', baseAlpha);
      morph.setAttribute('result', 'is_morph');
      filterEl.appendChild(morph);
      isSource = 'is_morph';
    }

    const gauss = d.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    gauss.setAttribute('stdDeviation', blur);
    gauss.setAttribute('in', isSource);
    gauss.setAttribute('result', 'is_blur');
    filterEl.appendChild(gauss);

    const offset = d.createElementNS("http://www.w3.org/2000/svg", "feOffset");
    offset.setAttribute('dx', dx);
    offset.setAttribute('dy', dy);
    offset.setAttribute('in', 'is_blur');
    offset.setAttribute('result', 'is_offset');
    filterEl.appendChild(offset);

    const compOut = d.createElementNS("http://www.w3.org/2000/svg", "feComposite");
    compOut.setAttribute('operator', 'out');
    compOut.setAttribute('in', baseAlpha);
    compOut.setAttribute('in2', 'is_offset');
    compOut.setAttribute('result', 'is_inverse');
    filterEl.appendChild(compOut);

    const flood = d.createElementNS("http://www.w3.org/2000/svg", "feFlood");
    flood.setAttribute('flood-color', color);
    flood.setAttribute('flood-opacity', opacity);
    flood.setAttribute('result', 'is_flood');
    filterEl.appendChild(flood);

    const compIn = d.createElementNS("http://www.w3.org/2000/svg", "feComposite");
    compIn.setAttribute('operator', 'in');
    compIn.setAttribute('in', 'is_flood');
    compIn.setAttribute('in2', 'is_inverse');
    compIn.setAttribute('result', 'is_final');
    filterEl.appendChild(compIn);

    const compOver = d.createElementNS("http://www.w3.org/2000/svg", "feComposite");
    compOver.setAttribute('operator', 'over');
    compOver.setAttribute('in', 'is_final');
    compOver.setAttribute('in2', currentIn);
    compOver.setAttribute('result', 'inner_shadow_merged');
    filterEl.appendChild(compOver);

    currentIn = "inner_shadow_merged";
  }

  // 4. Drop Shadow (Generated from crisp Alpha, merged UNDER the final result)
  if (hasDropShadow) {
    const color = getVal('data-effect-drop-shadow-color', '#000000');
    const opacity = parseFloat(getVal('data-effect-drop-shadow-opacity', '25')) / 100;
    const dx = getVal('data-effect-drop-shadow-x', '2');
    const dy = getVal('data-effect-drop-shadow-y', '2');
    const blur = parseFloat(getVal('data-effect-drop-shadow-blur', '4'));
    const spread = parseFloat(getVal('data-effect-drop-shadow-spread', '0'));

    let dsSource = 'SourceAlpha';
    if (spread !== 0) {
      const morph = d.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
      morph.setAttribute('operator', spread >= 0 ? 'dilate' : 'erode');
      morph.setAttribute('radius', Math.abs(spread));
      morph.setAttribute('in', 'SourceAlpha');
      morph.setAttribute('result', 'ds_morph');
      filterEl.appendChild(morph);
      dsSource = 'ds_morph';
    }

    const gauss = d.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    gauss.setAttribute('stdDeviation', blur);
    gauss.setAttribute('in', dsSource);
    gauss.setAttribute('result', 'ds_blur');
    filterEl.appendChild(gauss);

    const offset = d.createElementNS("http://www.w3.org/2000/svg", "feOffset");
    offset.setAttribute('dx', dx);
    offset.setAttribute('dy', dy);
    offset.setAttribute('in', 'ds_blur');
    offset.setAttribute('result', 'ds_offset');
    filterEl.appendChild(offset);

    const flood = d.createElementNS("http://www.w3.org/2000/svg", "feFlood");
    flood.setAttribute('flood-color', color);
    flood.setAttribute('flood-opacity', opacity);
    flood.setAttribute('result', 'ds_flood');
    filterEl.appendChild(flood);

    const comp = d.createElementNS("http://www.w3.org/2000/svg", "feComposite");
    comp.setAttribute('in', 'ds_flood');
    comp.setAttribute('in2', 'ds_offset');
    comp.setAttribute('operator', 'in');
    comp.setAttribute('result', 'ds_final');
    filterEl.appendChild(comp);

    const merge = d.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const nodeShadow = d.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    nodeShadow.setAttribute('in', 'ds_final');
    const nodeInput = d.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    nodeInput.setAttribute('in', currentIn); // Merge shadow behind the final blurred/clipped content
    merge.appendChild(nodeShadow);
    merge.appendChild(nodeInput);
    merge.setAttribute('result', 'drop_shadow_merged');
    filterEl.appendChild(merge);
    currentIn = "drop_shadow_merged";
  }

  // 5. Layer Blur (Applied LAST if Clip Content is OFF, so it blurs shadows and strokes too)
  if (hasBlur && !hasClipContent) {
    const blurVal = parseFloat(getVal('data-effect-blur-value', '0.3'));
    const spreadVal = parseFloat(getVal('data-effect-blur-spread', '0'));

    let blurSource = currentIn;

    if (spreadVal !== 0) {
      const morph = d.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
      morph.setAttribute('operator', spreadVal >= 0 ? 'dilate' : 'erode');
      morph.setAttribute('radius', Math.abs(spreadVal));
      morph.setAttribute('in', currentIn);
      morph.setAttribute('result', 'blur_morph_last');
      filterEl.appendChild(morph);
      blurSource = "blur_morph_last";
    }

    const blurNode = d.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    blurNode.setAttribute('stdDeviation', blurVal);
    blurNode.setAttribute('in', blurSource);
    blurNode.setAttribute('result', 'blur_out_last');
    filterEl.appendChild(blurNode);
    currentIn = "blur_out_last";
  }

  const finalFilterUrl = `url(#${filterId})`;
  if (isForeignObject) {
    const inner = element.firstElementChild;
    if (inner) {
      inner.style.removeProperty('clip-path');
      inner.style.setProperty('filter', finalFilterUrl, 'important');
      
      // Preserve backdrop-filter logic for SVG path
      if (hasBackgroundBlur) {
        const bBlur = getVal('data-effect-background-blur-value', '10');
        inner.style.setProperty('backdrop-filter', `blur(${bBlur}px)`, 'important');
        inner.style.setProperty('-webkit-backdrop-filter', `blur(${bBlur}px)`, 'important');
      } else {
        inner.style.removeProperty('backdrop-filter');
        inner.style.removeProperty('-webkit-backdrop-filter');
      }
    }
    element.style.removeProperty('filter'); // Make sure wrapper doesn't have it
    element.removeAttribute('filter'); 
  } else {
    element.setAttribute('filter', finalFilterUrl);
  }


};

const TextEditorSubComponentAdapter = ({ selectedElementProps, activePageIndex, selectedLayerId, updateElementAttributeLocal, sizingMode, isScrollable }) => {
  const [openSubSection, setOpenSubSection] = useState(null);

  const [backgroundColor, setBackgroundColor] = useState({
    fill: selectedElementProps?.fill || '#000000',
    fillOpacity: parseFloat(selectedElementProps?.opacity || 1) * 100,
    fillType: selectedElementProps?.['fill-type'] || 'solid',
    fillGradientType: selectedElementProps?.['fill-gradient-type'] || 'linear',
    fillStops: selectedElementProps?.['fill-stops'],
    fillAngle: parseFloat(selectedElementProps?.['fill-angle'] || 0),
    fillRadius: parseFloat(selectedElementProps?.['fill-radius'] || 100),
    scrollBarColor: selectedElementProps?.['data-scrollbar-color'] || '#4B5563',
    bgFill: selectedElementProps?.['data-bg-fill'] || 'transparent',
    bgFillOpacity: parseFloat(selectedElementProps?.['data-bg-fill-opacity'] !== undefined ? selectedElementProps['data-bg-fill-opacity'] : 1) * 100,
    bgStroke: selectedElementProps?.['data-bg-stroke'] || 'none',
    bgStrokeOpacity: parseFloat(selectedElementProps?.['data-bg-stroke-opacity'] !== undefined ? selectedElementProps['data-bg-stroke-opacity'] : 1) * 100,
    bgStrokeWidth: parseFloat(selectedElementProps?.['data-bg-stroke-width'] !== undefined ? selectedElementProps['data-bg-stroke-width'] : 0),
    bgStrokePosition: selectedElementProps?.['data-bg-stroke-position'] || 'Center',
    scrollBarOpacity: 100,
    stroke: selectedElementProps?.stroke || 'none',
    strokeOpacity: parseFloat(selectedElementProps?.['stroke-opacity'] !== undefined ? selectedElementProps['stroke-opacity'] : 1) * 100,
    strokeDashStyle: selectedElementProps?.strokeDasharray && selectedElementProps?.strokeDasharray !== 'none' ? 'Dashed' : 'Solid',
    strokeWeight: parseFloat(selectedElementProps?.strokeWidth || 0),
    strokeType: selectedElementProps?.['stroke-type'] || 'solid',
    strokeGradientType: selectedElementProps?.['stroke-gradient-type'] || 'linear',
    strokeStops: selectedElementProps?.['stroke-stops'],
    strokeAngle: parseFloat(selectedElementProps?.['stroke-angle'] || 0),
    strokeRadius: parseFloat(selectedElementProps?.['stroke-radius'] || 100),
    strokeDasharrayValue: selectedElementProps?.strokeDasharray,
    strokeDashLength: parseInt((selectedElementProps?.strokeDasharray || '10,10').split(',')[0]) || 10,
    strokeDashGap: parseInt((selectedElementProps?.strokeDasharray || '10,10').split(',')[1] || (selectedElementProps?.strokeDasharray || '10,10').split(',')[0]) || 10,
  });

  const [filters, setFilters] = useState({ exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 });

  const [radius, setRadius] = useState({
    tl: parseFloat(selectedElementProps?.['data-tl'] || 0),
    tr: parseFloat(selectedElementProps?.['data-tr'] || 0),
    br: parseFloat(selectedElementProps?.['data-br'] || 0),
    bl: parseFloat(selectedElementProps?.['data-bl'] || 0),
  });
  const [isRadiusLinked, setIsRadiusLinked] = useState(selectedElementProps?.['data-corner-linked'] !== 'false');

  const [activeEffects, setActiveEffects] = useState(() => {
    const effs = [];
    if (selectedElementProps?.['data-effect-drop-shadow'] === 'true') effs.push('Drop Shadow');
    if (selectedElementProps?.['data-effect-inner-shadow'] === 'true') effs.push('Inner Shadow');
    if (selectedElementProps?.['data-effect-blur'] === 'true') effs.push('Blur');
    return effs;
  });

  const [effectSettings, setEffectSettings] = useState(() => {
    const p = selectedElementProps || {};
    return {
      'Drop Shadow': { color: p['data-effect-drop-shadow-color'] || '#000000', opacity: parseFloat(p['data-effect-drop-shadow-opacity'] || 35), x: parseFloat(p['data-effect-drop-shadow-x'] || 2), y: parseFloat(p['data-effect-drop-shadow-y'] || 2), blur: parseFloat(p['data-effect-drop-shadow-blur'] || 4), spread: 0 },
      'Inner Shadow': { color: p['data-effect-inner-shadow-color'] || '#FFFFFF', opacity: parseFloat(p['data-effect-inner-shadow-opacity'] || 100), x: parseFloat(p['data-effect-inner-shadow-x'] || 2), y: parseFloat(p['data-effect-inner-shadow-y'] || 2), blur: parseFloat(p['data-effect-inner-shadow-blur'] || 1), spread: 0 },
      'Blur': { blur: parseFloat(p['data-effect-blur-value'] || 0.3), spread: 0, clipContent: p['data-effect-blur-clip'] === 'true' }
    };
  });

  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);
  const [colorsOnPage, setColorsOnPage] = useState([]);

  // Debounce ref to prevent excessive calls to updateElementAttributeLocal
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    setBackgroundColor({
      fill: selectedElementProps?.fill || '#000000',
      fillOpacity: parseFloat(selectedElementProps?.opacity || 1) * 100,
      fillType: selectedElementProps?.['fill-type'] || 'solid',
      fillGradientType: selectedElementProps?.['fill-gradient-type'] || 'linear',
      fillStops: selectedElementProps?.['fill-stops'],
      fillAngle: parseFloat(selectedElementProps?.['fill-angle'] || 0),
      fillRadius: parseFloat(selectedElementProps?.['fill-radius'] || 100),
      scrollBarColor: selectedElementProps?.['data-scrollbar-color'] || '#4B5563',
      bgFill: selectedElementProps?.['data-bg-fill'] || 'transparent',
      bgFillOpacity: parseFloat(selectedElementProps?.['data-bg-fill-opacity'] !== undefined ? selectedElementProps['data-bg-fill-opacity'] : 1) * 100,
      bgStroke: selectedElementProps?.['data-bg-stroke'] || 'none',
      bgStrokeOpacity: parseFloat(selectedElementProps?.['data-bg-stroke-opacity'] !== undefined ? selectedElementProps['data-bg-stroke-opacity'] : 1) * 100,
      bgStrokeWidth: parseFloat(selectedElementProps?.['data-bg-stroke-width'] !== undefined ? selectedElementProps['data-bg-stroke-width'] : 0),
      bgStrokePosition: selectedElementProps?.['data-bg-stroke-position'] || 'Center',
      stroke: selectedElementProps?.stroke || 'none',
      strokeOpacity: parseFloat(selectedElementProps?.['stroke-opacity'] !== undefined ? selectedElementProps['stroke-opacity'] : 1) * 100,
      strokeDashStyle: selectedElementProps?.strokeDasharray && selectedElementProps?.strokeDasharray !== 'none' ? 'Dashed' : 'Solid',
      strokeWeight: parseFloat(selectedElementProps?.strokeWidth || 0),
      strokeType: selectedElementProps?.['stroke-type'] || 'solid',
      strokeGradientType: selectedElementProps?.['stroke-gradient-type'] || 'linear',
      strokeStops: selectedElementProps?.['stroke-stops'],
      strokeAngle: parseFloat(selectedElementProps?.['stroke-angle'] || 0),
      strokeRadius: parseFloat(selectedElementProps?.['stroke-radius'] || 100),
      strokeDasharrayValue: selectedElementProps?.strokeDasharray,
      strokeDashLength: parseInt((selectedElementProps?.strokeDasharray || '10,10').split(',')[0]) || 10,
      strokeDashGap: parseInt((selectedElementProps?.strokeDasharray || '10,10').split(',')[1] || (selectedElementProps?.strokeDasharray || '10,10').split(',')[0]) || 10,
    });
    setRadius({
      tl: parseFloat(selectedElementProps?.['data-tl'] || 0),
      tr: parseFloat(selectedElementProps?.['data-tr'] || 0),
      br: parseFloat(selectedElementProps?.['data-br'] || 0),
      bl: parseFloat(selectedElementProps?.['data-bl'] || 0),
    });
    setIsRadiusLinked(selectedElementProps?.['data-corner-linked'] !== 'false');

    const effs = [];
    if (selectedElementProps?.['data-effect-drop-shadow'] === 'true') effs.push('Drop Shadow');
    if (selectedElementProps?.['data-effect-inner-shadow'] === 'true') effs.push('Inner Shadow');
    if (selectedElementProps?.['data-effect-blur'] === 'true') effs.push('Blur');
    setActiveEffects(effs);

    setEffectSettings({
      'Drop Shadow': { color: selectedElementProps?.['data-effect-drop-shadow-color'] || '#000000', opacity: parseFloat(selectedElementProps?.['data-effect-drop-shadow-opacity'] || 35), x: parseFloat(selectedElementProps?.['data-effect-drop-shadow-x'] || 2), y: parseFloat(selectedElementProps?.['data-effect-drop-shadow-y'] || 2), blur: parseFloat(selectedElementProps?.['data-effect-drop-shadow-blur'] || 4), spread: 0 },
      'Inner Shadow': { color: selectedElementProps?.['data-effect-inner-shadow-color'] || '#FFFFFF', opacity: parseFloat(selectedElementProps?.['data-effect-inner-shadow-opacity'] || 100), x: parseFloat(selectedElementProps?.['data-effect-inner-shadow-x'] || 2), y: parseFloat(selectedElementProps?.['data-effect-inner-shadow-y'] || 2), blur: parseFloat(selectedElementProps?.['data-effect-inner-shadow-blur'] || 1), spread: 0 },
      'Blur': { blur: parseFloat(selectedElementProps?.['data-effect-blur-value'] || 0.3), spread: 0, clipContent: selectedElementProps?.['data-effect-blur-clip'] === 'true' }
    });
  }, [selectedLayerId, activePageIndex]);

  // Handle updates back to TextEditor
  useEffect(() => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'fill', backgroundColor.fill);
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'opacity', (backgroundColor.fillOpacity / 100).toString());
      if (backgroundColor.fillType) updateElementAttributeLocal(activePageIndex, selectedLayerId, 'fill-type', backgroundColor.fillType);
      if (backgroundColor.fillGradientType) updateElementAttributeLocal(activePageIndex, selectedLayerId, 'fill-gradient-type', backgroundColor.fillGradientType);
      if (backgroundColor.fillStops) updateElementAttributeLocal(activePageIndex, selectedLayerId, 'fill-stops', backgroundColor.fillStops);
      if (backgroundColor.fillAngle !== undefined) updateElementAttributeLocal(activePageIndex, selectedLayerId, 'fill-angle', backgroundColor.fillAngle.toString());
      if (backgroundColor.fillRadius !== undefined) updateElementAttributeLocal(activePageIndex, selectedLayerId, 'fill-radius', backgroundColor.fillRadius.toString());
      if (backgroundColor.fillRadius !== undefined) updateElementAttributeLocal(activePageIndex, selectedLayerId, 'fill-radius', backgroundColor.fillRadius.toString());

      if (backgroundColor.scrollBarColor !== undefined) updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-scrollbar-color', backgroundColor.scrollBarColor);

      if (backgroundColor.bgFill !== undefined) {
        if (backgroundColor.bgFill && backgroundColor.bgFill !== 'transparent' && backgroundColor.bgFill !== 'none' && backgroundColor.bgFill !== '#') {
          updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-bg-fill', backgroundColor.bgFill);
          if (backgroundColor.bgFillOpacity !== undefined) {
            updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-bg-fill-opacity', (backgroundColor.bgFillOpacity / 100).toString());
          }
        } else {
          updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-bg-fill', 'none');
        }
      }

      if (backgroundColor.bgStroke !== undefined) {
        if (backgroundColor.bgStroke && backgroundColor.bgStroke !== 'none' && backgroundColor.bgStroke !== 'transparent' && backgroundColor.bgStroke !== '#') {
          updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-bg-stroke', backgroundColor.bgStroke);
          if (backgroundColor.bgStrokeOpacity !== undefined) {
            updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-bg-stroke-opacity', (backgroundColor.bgStrokeOpacity / 100).toString());
          }
          if (backgroundColor.bgStrokeWidth !== undefined) {
            updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-bg-stroke-width', backgroundColor.bgStrokeWidth.toString());
          }
          if (backgroundColor.bgStrokePosition !== undefined) {
            updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-bg-stroke-position', backgroundColor.bgStrokePosition);
          }
        } else {
          updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-bg-stroke', 'none');
          updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-bg-stroke-width', '0');
        }
      }

      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'stroke', backgroundColor.stroke);
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'strokeWidth', backgroundColor.strokeWeight.toString());
      if (backgroundColor.strokeType === 'gradient' || backgroundColor.strokeStops) {
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'stroke-type', 'gradient');
        if (backgroundColor.strokeGradientType) updateElementAttributeLocal(activePageIndex, selectedLayerId, 'stroke-gradient-type', backgroundColor.strokeGradientType);
        if (backgroundColor.strokeStops) updateElementAttributeLocal(activePageIndex, selectedLayerId, 'stroke-stops', backgroundColor.strokeStops);
        if (backgroundColor.strokeAngle !== undefined) updateElementAttributeLocal(activePageIndex, selectedLayerId, 'stroke-angle', backgroundColor.strokeAngle.toString());
        if (backgroundColor.strokeRadius !== undefined) updateElementAttributeLocal(activePageIndex, selectedLayerId, 'stroke-radius', backgroundColor.strokeRadius.toString());
      } else if (backgroundColor.stroke !== 'none' && !backgroundColor.stroke.includes('url(#')) {
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'stroke-type', 'solid');
      }

      const dashVal = backgroundColor.strokeDashStyle === 'Dashed' ? (backgroundColor.strokeDasharrayValue || `${backgroundColor.strokeDashLength || 10},${backgroundColor.strokeDashGap || 10}`) : 'none';
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'strokeDasharray', dashVal);
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-stroke-position', backgroundColor.strokePosition || 'Center');

      const linecap = backgroundColor.strokeLinecap || 'butt';
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'strokeLinecap', linecap);
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'strokeLinejoin', linecap === 'round' ? 'round' : 'miter');

      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-tl', radius.tl.toString());
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-tr', radius.tr.toString());
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-bl', radius.bl.toString());
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-br', radius.br.toString());
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-corner-linked', isRadiusLinked.toString());

      const maxRadius = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'rx', maxRadius.toString());
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'ry', maxRadius.toString());

      const hasDS = activeEffects.includes('Drop Shadow');
      const hasIS = activeEffects.includes('Inner Shadow');
      const hasBlur = activeEffects.includes('Blur');

      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-drop-shadow', hasDS.toString());
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-inner-shadow', hasIS.toString());
      updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-blur', hasBlur.toString());

      if (hasDS) {
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-drop-shadow-color', effectSettings['Drop Shadow'].color);
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-drop-shadow-opacity', effectSettings['Drop Shadow'].opacity.toString());
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-drop-shadow-x', effectSettings['Drop Shadow'].x.toString());
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-drop-shadow-y', effectSettings['Drop Shadow'].y.toString());
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-drop-shadow-blur', effectSettings['Drop Shadow'].blur.toString());
      }
      if (hasIS) {
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-inner-shadow-color', effectSettings['Inner Shadow'].color);
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-inner-shadow-opacity', effectSettings['Inner Shadow'].opacity.toString());
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-inner-shadow-x', effectSettings['Inner Shadow'].x.toString());
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-inner-shadow-y', effectSettings['Inner Shadow'].y.toString());
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-inner-shadow-blur', effectSettings['Inner Shadow'].blur.toString());
      }
      if (hasBlur) {
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-blur-value', effectSettings['Blur'].blur.toString());
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-effect-blur-clip', effectSettings['Blur'].clipContent ? 'true' : 'false');
      }

      const element = document.getElementById(selectedLayerId);
      if (element) {
        syncTextEffect(document, element);
      }
    }, 50);
  }, [backgroundColor, radius, isRadiusLinked, activeEffects, effectSettings, activePageIndex, selectedLayerId]);

  return (
    <div className="flex flex-col gap-[0.4vw]">
      <Color
        openSubSection={openSubSection}
        setOpenSubSection={setOpenSubSection}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
        activeColorPicker={activeColorPicker}
        setActiveColorPicker={setActiveColorPicker}
        showStrokeSettings={showStrokeSettings}
        setShowStrokeSettings={setShowStrokeSettings}
        isStrokeStyleOpen={isStrokeStyleOpen}
        setIsStrokeStyleOpen={setIsStrokeStyleOpen}
        dropdownPos={dropdownPos}
        setDropdownPos={setDropdownPos}
        strokeSettingsPos={strokeSettingsPos}
        setStrokeSettingsPos={setStrokeSettingsPos}
        isDashPosOpen={isDashPosOpen}
        setIsDashPosOpen={setIsDashPosOpen}
        activePopup={activePopup}
        setActivePopup={setActivePopup}
        colorsOnPage={colorsOnPage}
        showDetailedPicker={showDetailedPicker}
        setShowDetailedPicker={setShowDetailedPicker}
        isText={true}
        sizingMode={sizingMode}
        isScrollable={isScrollable}
      />
      <Effect
        openSubSection={openSubSection}
        setOpenSubSection={setOpenSubSection}
        activeEffects={activeEffects}
        setActiveEffects={setActiveEffects}
        effectSettings={effectSettings}
        setEffectSettings={setEffectSettings}
        activeColorPicker={activeColorPicker}
        setActiveColorPicker={setActiveColorPicker}
        showDetailedPicker={showDetailedPicker}
        setShowDetailedPicker={setShowDetailedPicker}
      />
    </div>
  );
};


const TextEditor = ({
  selectedElement,
  selectedElementType,
  onUpdate,
  onPopupPreviewUpdate,
  closePanelsSignal,
  pages,
  setPages,
  activePopupElement,
  onPopupUpdate,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  showInteraction = true,
  activePageIndex
}) => {
  // Accordian State: 'main' or 'interaction' or null
  const [activeSection, setActiveSection] = useState('main');
  const isTextOpen = activeSection === 'main';
  const isInteractionOpen = activeSection === 'interaction';
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTextareaEditable, setIsTextareaEditable] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [sizingMode, setSizingMode] = useState('auto-height'); // 'auto-width' | 'auto-height' | 'fixed'






  // Guard ref to track current syncing status
  const lastSelectedElementRef = useRef(null);
  const isSyncingRef = useRef(false);

  // Typing debounce refs — prevents canvas re-render on every keystroke
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef(null);

  // Refs
  const [activePanel, setActivePanel] = useState(null);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showWeightDropdown, setShowWeightDropdown] = useState(false);
  const [showBorderStyleDropdown, setShowBorderStyleDropdown] = useState(false);
  const [showStrokePositionDropdown, setShowStrokePositionDropdown] = useState(false);

  const [textContent, setTextContent] = useState('SIPPER GLASS');
  const [fontFamily, setFontFamily] = useState('Poppins');
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState('600');
  const [textAlign, setTextAlign] = useState('left');
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [fontStyle, setFontStyle] = useState('normal');
  const [textDecoration, setTextDecoration] = useState('none');
  const [textTransform, setTextTransform] = useState('none');
  const [listStyleType, setListStyleType] = useState('none');
  const textareaRef = useRef(null);
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });

  const strokePositionRef = useRef(null);
  const dropdownRef = useRef(null);
  const weightRef = useRef(null);
  const dashedRef = useRef(null);
  const borderStyleRef = useRef(null);
  const fontSizeRef = useRef(null);
  const alignmentRef = useRef(null);
  const styleRef = useRef(null);
  const caseRef = useRef(null);
  const listRef = useRef(null);

  // --- HELPER FUNCTIONS ---

  const escapeSvg = (str) => {
    return str.replace(/[&<>"']/g, (m) => {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&apos;';
        default: return m;
      }
    });
  };

  const applyDesign = useCallback((shouldNotify = true) => {
    // Logic removed - UI only
  }, []);

  const selectedLayerId = useMemo(() => {
    if (!selectedElement) return null;
    const elWithId = selectedElement.id ? selectedElement : selectedElement.closest('[id]');
    return elWithId?.id;
  }, [selectedElement]);

  // Sync scrollable state from element
  useEffect(() => {
    if (selectedElement) {
      const el = document.getElementById(selectedLayerId);
      if (el) {
        setIsScrollable(el.getAttribute('data-scrollable') === 'true');
      }
    }
  }, [selectedElement, selectedLayerId]);

  const selectedElementProps = useMemo(() => {
    if (!selectedLayerId || !pages[activePageIndex]) return null;

    // Find the element in the actual DOM to get computed values if needed
    const el = document.getElementById(selectedLayerId);
    if (!el) return null;

    let fillStyle = el.getAttribute('fill') || '#000000';
    let strokeStyle = el.getAttribute('stroke') || 'none';
    let strokeWidthStr = el.getAttribute('stroke-width') || el.getAttribute('strokeWidth') || el.getAttribute('strokewidth') || '0';

    if (el.tagName.toLowerCase() === 'foreignobject' && el.firstElementChild) {
      const comp = window.getComputedStyle(el.firstElementChild);
      if (!el.hasAttribute('fill')) fillStyle = comp.color || fillStyle;
      if (!el.hasAttribute('stroke') && comp.webkitTextStrokeColor) strokeStyle = comp.webkitTextStrokeColor;
      if (!el.hasAttribute('stroke-width') && !el.hasAttribute('strokeWidth') && comp.webkitTextStrokeWidth) {
        strokeWidthStr = parseFloat(comp.webkitTextStrokeWidth).toString();
      }
      if (parseFloat(strokeWidthStr) === 0 || isNaN(parseFloat(strokeWidthStr)) || strokeStyle === 'transparent' || strokeStyle === 'rgba(0, 0, 0, 0)') {
        strokeStyle = 'none';
      }
    }

    const props = {
      id: selectedLayerId,
      tagName: el.tagName.toLowerCase(),
      fill: fillStyle,
      stroke: strokeStyle,
      strokeWidth: strokeWidthStr,
      strokeDasharray: el.getAttribute('stroke-dasharray') || 'none',
      opacity: el.getAttribute('opacity') || '1',
      rx: el.getAttribute('rx') || '0',
      ry: el.getAttribute('ry') || '0',
      'data-tl': el.getAttribute('data-tl') || '0',
      'data-tr': el.getAttribute('data-tr') || '0',
      'data-bl': el.getAttribute('data-bl') || '0',
      'data-br': el.getAttribute('data-br') || '0',
      'data-corner-linked': el.getAttribute('data-corner-linked') || 'true'
    };

    // Extract all data- attributes and fill/stroke extras
    Array.from(el.attributes).forEach(attr => {
      if ((attr.name.startsWith('data-') || attr.name.includes('fill-') || attr.name.includes('stroke-')) && attr.name !== 'data-shape-type') {
        props[attr.name] = attr.value;
      }
    });

    return props;
  }, [selectedLayerId, pages, activePageIndex]);

  const updateElementAttributeLocal = (pageIdx, elId, attribute, value, skipLiveUpdate = false) => {
    // Immediate Live Feedback for DOM and Overlay
    const liveEl = document.getElementById(elId);
    const styleProp = STYLE_MAP[attribute];
    const finalVal = (attribute === 'fontSize' || attribute === 'letterSpacing') && !value?.toString().includes('px') && !value?.toString().includes('em') ? `${value}px` : value;

    if (liveEl) {
      const liveTag = liveEl.tagName.toLowerCase();
      console.log(`[TextEditor] Live update: tag=${liveTag}, id=${elId}, attr=${attribute}, val=${value}`);

      if (attribute && (attribute.startsWith('data-bg-') || attribute === 'data-scrollbar-color')) {
        liveEl.setAttribute(attribute, value);
        if (attribute.startsWith('data-bg-')) {
          const cssVar = '--' + attribute.substring(5);
          liveEl.style.setProperty(cssVar, value);
          const outerDiv = liveEl.querySelector('.flipbook-text-outer') || liveEl.firstElementChild;
          if (outerDiv && outerDiv.style) {
            outerDiv.style.setProperty(cssVar, value, 'important');
            const bgFill = liveEl.getAttribute('data-bg-fill');
            const bgFillOpacity = liveEl.getAttribute('data-bg-fill-opacity') !== null ? liveEl.getAttribute('data-bg-fill-opacity') : '1';
            if (bgFill && bgFill !== 'none' && bgFill !== 'transparent') {
              let c = bgFill.replace('#', '');
              if (c.length === 3) c = c.split('').map(x => x + x).join('');
              const num = parseInt(c, 16);
              if (!isNaN(num)) {
                const r = (num >> 16) & 255;
                const g = (num >> 8) & 255;
                const b = num & 255;
                const op = parseFloat(bgFillOpacity);
                const clampedOp = isNaN(op) ? 1 : (op > 1 ? op / 100 : op);
                outerDiv.style.setProperty('background-color', `rgba(${r}, ${g}, ${b}, ${clampedOp})`, 'important');
              }
            }
            const bgStroke = liveEl.getAttribute('data-bg-stroke');
            const bgStrokeWidth = liveEl.getAttribute('data-bg-stroke-width') || '0';
            const bgStrokeDash = liveEl.getAttribute('data-bg-stroke-dasharray');
            const borderStyle = (bgStrokeDash && bgStrokeDash !== 'none') ? 'dashed' : 'solid';
            if (bgStroke && bgStroke !== 'none' && bgStroke !== 'transparent' && Number(bgStrokeWidth) > 0) {
              outerDiv.style.setProperty('border', `${bgStrokeWidth}px ${borderStyle} ${bgStroke}`, 'important');
            } else if (attribute === 'data-bg-stroke' && (value === 'none' || value === 'transparent')) {
              outerDiv.style.setProperty('border', 'none', 'important');
            }
          }
        }
        if (attribute === 'rx') {
          liveEl.style.setProperty('--bg-rx', value + 'px');
        }
      }

      if (styleProp || attribute === 'data-stroke-position') {
        if (liveTag === 'foreignobject') {
          if (liveEl.firstElementChild && styleProp) {
            let applyVal = finalVal;
            if (styleProp === 'fontFamily' && typeof applyVal === 'string' && !applyVal.includes("'") && !applyVal.includes('"')) {
              applyVal = `'${applyVal}'`;
            }
            const isCharacterProp = ['fill', 'color', 'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'textDecoration', 'textTransform'].includes(attribute);
            let selectionApplied = false;
            if (isCharacterProp) {
              selectionApplied = applyStyleToActiveTextSelection(elId, attribute, value);
            }

            if (!selectionApplied) {
              if (styleProp === 'stroke' || styleProp === 'stroke-opacity') {
                const s = styleProp === 'stroke' ? finalVal : (liveEl.getAttribute('stroke') || 'none');
                const op = styleProp === 'stroke-opacity' ? finalVal : (liveEl.getAttribute('stroke-opacity') || '1');
                const applyColor = getStrokeColorWithOpacity(s, op);
                liveEl.firstElementChild.style.setProperty('-webkit-text-stroke-color', applyColor, 'important');
                Array.from(liveEl.firstElementChild.querySelectorAll('*')).forEach(child => child.style.setProperty('-webkit-text-stroke-color', applyColor, 'important'));
                if (styleProp === 'stroke') liveEl.setAttribute('stroke', finalVal);
                else liveEl.setAttribute('stroke-opacity', finalVal);
              } else if (styleProp === 'strokeWidth') {
                liveEl.firstElementChild.style.setProperty('-webkit-text-stroke-width', `${finalVal}px`, 'important');
                Array.from(liveEl.firstElementChild.querySelectorAll('*')).forEach(child => child.style.setProperty('-webkit-text-stroke-width', `${finalVal}px`, 'important'));
                liveEl.setAttribute('stroke-width', finalVal);
              } else {
                const liveProp = styleProp === 'fill' ? 'color' : styleProp;
                const cssPropName = liveProp.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
                liveEl.firstElementChild.style.setProperty(cssPropName, applyVal, 'important');

                // Clear inline style from children to prevent overrides
                Array.from(liveEl.firstElementChild.querySelectorAll('*')).forEach(child => {
                  if (child.style) {
                    child.style.removeProperty(cssPropName);
                    const camelProp = cssPropName.replace(/-([a-z])/g, g => g[1].toUpperCase());
                    child.style.removeProperty(camelProp);
                  }
                });

                const scrollTarget = liveEl.querySelector('.flipbook-text-scrollbar');
                if (scrollTarget) {
                  scrollTarget.style.setProperty(cssPropName, applyVal, 'important');
                }
              }
            }

            // General Auto-resize for layout-affecting properties
            const layoutProps = ['fontSize', 'lineHeight', 'letterSpacing', 'fontFamily', 'fontWeight', 'textAlign', 'textTransform'];
            if (layoutProps.includes(attribute) && liveEl.getAttribute('data-scrollable') !== 'true') {
              const div = liveEl.firstElementChild;
              const mode = liveEl.getAttribute('data-sizing-mode');

              if (mode === 'auto-width') {
                div.style.setProperty('width', 'max-content', 'important');
                const contentW = div.scrollWidth;
                const foW = parseFloat(liveEl.getAttribute('width')) || 0;
                if (Math.abs(contentW - foW) > 2) {
                  liveEl.setAttribute('width', contentW + 4);
                }
                div.style.setProperty('width', '100%', 'important');
              }

              div.style.setProperty('height', 'auto', 'important');
              div.style.setProperty('min-height', '0px', 'important');

              const contentH = div.scrollHeight;
              const foH = parseFloat(liveEl.getAttribute('height')) || 0;

              if (Math.abs(contentH - foH) > 2 || (mode === 'auto-width' && Math.abs(div.scrollWidth - parseFloat(liveEl.getAttribute('width') || 0)) > 2)) {
                liveEl.setAttribute('height', contentH + 4);
                window.dispatchEvent(new CustomEvent('force-update-selection-box', { detail: { elementId: liveEl.id } }));
              }
            }
          }
          if (attribute === 'stroke' || attribute === 'strokeWidth' || attribute === 'data-stroke-position') {
            const pos = attribute === 'data-stroke-position' ? value : (liveEl.getAttribute('data-stroke-position') || 'Center');
            const paintOrder = pos === 'Outside' ? 'stroke fill' : 'normal';
            liveEl.firstElementChild.style.setProperty('paint-order', paintOrder, 'important');
            Array.from(liveEl.firstElementChild.querySelectorAll('*')).forEach(child => child.style.setProperty('paint-order', paintOrder, 'important'));
          }
        } else {
          if (styleProp) {
            let applyVal = finalVal;
            if (styleProp === 'fontFamily' && typeof applyVal === 'string' && !applyVal.includes("'") && !applyVal.includes('"')) {
              applyVal = `'${applyVal}'`;
            }
            if (styleProp === 'strokeWidth') {
              liveEl.setAttribute('stroke-width', value);
              liveEl.style.setProperty('stroke-width', `${value}px`, 'important');
            } else if (styleProp === 'strokeDasharray') {
              liveEl.setAttribute('stroke-dasharray', value);
              liveEl.style.setProperty('stroke-dasharray', value, 'important');
            } else if (styleProp === 'strokeLinecap' || styleProp === 'strokeLinejoin') {
              const attrName = styleProp === 'strokeLinecap' ? 'stroke-linecap' : 'stroke-linejoin';
              liveEl.setAttribute(attrName, value);
              liveEl.style.setProperty(attrName, value, 'important');
            } else {
              const cssPropName = styleProp.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
              liveEl.style.setProperty(cssPropName, applyVal, 'important');
            }
          }
          if (attribute === 'rx') {
            liveEl.style.setProperty('--bg-rx', value + 'px');
          }
          if (attribute === 'fill' || attribute === 'stroke' || attribute === 'opacity' || attribute === 'stroke-opacity') {
            liveEl.setAttribute(attribute, value);
          }
          if (attribute === 'stroke' || attribute === 'strokeWidth' || attribute === 'data-stroke-position' || attribute === 'stroke-opacity') {
            const pos = attribute === 'data-stroke-position' ? value : (liveEl.getAttribute('data-stroke-position') || 'Center');
            const paintOrder = pos === 'Outside' ? 'stroke fill' : 'normal';
            liveEl.setAttribute('paint-order', paintOrder);
            liveEl.style.setProperty('paint-order', paintOrder, 'important');
          }
          if (liveTag === 'text' || liveTag === 'g') {
            Array.from(liveEl.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
              if (styleProp) {
                if (styleProp === 'strokeWidth') {
                  child.setAttribute('stroke-width', value);
                  child.style.setProperty('stroke-width', `${value}px`, 'important');
                } else if (styleProp === 'strokeDasharray') {
                  child.setAttribute('stroke-dasharray', value);
                  child.style.setProperty('stroke-dasharray', value, 'important');
                } else if (styleProp === 'strokeLinecap' || styleProp === 'strokeLinejoin') {
                  const attrName = styleProp === 'strokeLinecap' ? 'stroke-linecap' : 'stroke-linejoin';
                  child.setAttribute(attrName, value);
                  child.style.setProperty(attrName, value, 'important');
                } else {
                  const cssPropName = styleProp.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
                  child.style.setProperty(cssPropName, finalVal, 'important');
                  child.setAttribute(attribute, value);
                }
              }
              if (attribute === 'stroke' || attribute === 'strokeWidth' || attribute === 'data-stroke-position') {
                const pos = attribute === 'data-stroke-position' ? value : (liveEl.getAttribute('data-stroke-position') || 'Center');
                const paintOrder = pos === 'Outside' ? 'stroke fill' : 'normal';
                child.setAttribute('paint-order', paintOrder);
                child.style.setProperty('paint-order', paintOrder, 'important');
              }
            });
          }
        }
      }

      // Update active editing overlay
      if (styleProp) {
        const svgRoot = liveEl.ownerSVGElement || liveEl.closest('svg');
        const overlay = svgRoot?.querySelector('foreignObject[data-editing="true"] [contenteditable]');
        if (overlay) {
          let overlayVal = finalVal;
          if (styleProp === 'fontFamily' && typeof overlayVal === 'string' && !overlayVal.includes("'") && !overlayVal.includes('"')) {
            overlayVal = `'${overlayVal}'`;
          }
          const overlayProp = styleProp === 'fill' ? 'color' : styleProp;
          overlay.style.setProperty(overlayProp, overlayVal, 'important');
        }
      }

      // --- CUSTOM SCROLLABLE & CORNER RADIUS HANDLING ---
      if (liveTag === 'foreignobject' && liveEl.firstElementChild) {
        const isCurrentlyScrollable = liveEl.getAttribute('data-scrollable') === 'true' || attribute === 'data-scrollable' && value === 'true';

        if (attribute === 'data-scrollable') {
          liveEl.setAttribute('data-scrollable', value);
          if (value === 'true') {
            liveEl.firstElementChild.style.overflowY = 'auto';
            liveEl.firstElementChild.classList.add('flipbook-text-scrollbar');
            liveEl.firstElementChild.style.height = '100%';
            liveEl.firstElementChild.style.overflowX = 'hidden';
            liveEl.firstElementChild.style.removeProperty('box-sizing');
            liveEl.firstElementChild.style.removeProperty('margin');
            // liveEl.firstElementChild.style.removeProperty('padding');
            // liveEl.firstElementChild.style.border = 'none'; // Border is on the SVG element, not the div
            const rx = liveEl.getAttribute('rx') || '0';
            liveEl.firstElementChild.style.borderRadius = `${rx}px`;
          } else {
            const currentSizingMode = liveEl.getAttribute('data-sizing-mode') || 'auto-height';
            liveEl.firstElementChild.classList.remove('flipbook-text-scrollbar');
            liveEl.firstElementChild.style.borderRadius = '0';
            // liveEl.firstElementChild.style.border = 'none';
            // liveEl.firstElementChild.style.removeProperty('padding');
            liveEl.firstElementChild.style.removeProperty('margin');
            liveEl.firstElementChild.style.removeProperty('box-sizing');

            if (currentSizingMode === 'fixed') {
              // Fixed size: keep foreignObject dimensions unchanged.
              // Let text overflow visually outside the box — do NOT auto-resize.
              liveEl.firstElementChild.style.setProperty('overflow', 'visible', 'important');
              liveEl.firstElementChild.style.overflowX = 'visible';
              liveEl.firstElementChild.style.overflowY = 'visible';
              liveEl.firstElementChild.style.height = '100%';
              liveEl.firstElementChild.style.width = '100%';
              liveEl.firstElementChild.style.display = 'block';
              // Dispatch to update handles/overlays only — not to resize
              window.dispatchEvent(new CustomEvent('force-update-selection-box', { detail: { elementId: liveEl.id } }));
            } else {
              // Auto-height / auto-width: expand the foreignObject to fit the text
              liveEl.firstElementChild.style.overflowY = 'visible';
              liveEl.firstElementChild.style.height = 'auto';
              // Recalculate and expand the height since the scrollable constraint is removed
              const contentH = liveEl.firstElementChild.scrollHeight;
              const foH = parseFloat(liveEl.getAttribute('height')) || 0;
              if (Math.abs(contentH - foH) > 2) {
                liveEl.setAttribute('height', contentH + 4);
                window.dispatchEvent(new CustomEvent('force-update-selection-box', { detail: { elementId: liveEl.id } }));
              }
            }
          }
        }

        if ((attribute === 'rx' || attribute === 'ry') && isCurrentlyScrollable) {
          liveEl.firstElementChild.style.borderRadius = `${value}px`;
        }

        if (attribute === 'stroke' || attribute === 'strokeWidth' || attribute === 'stroke-width' || attribute === 'stroke-opacity') {
          const isScrollable = liveEl.tagName.toLowerCase() === 'foreignobject' || isCurrentlyScrollable;
          if (isScrollable && liveEl.firstElementChild) {
            const s = attribute === 'stroke' ? value : (liveEl.getAttribute('stroke') || 'none');
            const op = attribute === 'stroke-opacity' ? value : (liveEl.getAttribute('stroke-opacity') || '1');
            const sw = (attribute === 'strokeWidth' || attribute === 'stroke-width') ? value : (liveEl.getAttribute('strokeWidth') || liveEl.getAttribute('stroke-width') || '0');
            const applyColor = getStrokeColorWithOpacity(s, op);
            liveEl.firstElementChild.style.setProperty('-webkit-text-stroke-color', applyColor, 'important');
            liveEl.firstElementChild.style.setProperty('-webkit-text-stroke-width', `${sw}px`, 'important');
            // Remove border just in case it was applied before
            // liveEl.firstElementChild.style.border = 'none';
          }
        }
      }
    }

    // Functional State Update (State of Truth)
    setPages(prevPages => {
      const newPages = [...prevPages];
      const page = { ...newPages[pageIdx] };
      if (!page || !page.html) return prevPages;

      const parser = new DOMParser();
      // Replace any variation of <br> (with or without attributes/slashes) and any closing </br> with a clean <br/>
      // and replace invalid XML entity &nbsp; with &#160;
      const cleanHtml = page.html
        .replace(/<\s*br[^>]*>(?:<\/\s*br\s*>)?/gi, '<br/>')
        .replace(/<\/\s*br\s*>/gi, '')
        .replace(/&nbsp;/gi, '&#160;');
      let doc = parser.parseFromString(cleanHtml, 'image/svg+xml');

      // Auto-recover if the React state was permanently corrupted by a previous crash
      // (meaning the cleanHtml string literally contains the error document itself)
      if (cleanHtml.includes('parsererror') && doc.documentElement.tagName.toLowerCase() === 'html') {
        const svgEl = doc.querySelector('svg');
        if (svgEl) {
          // Extract the valid SVG portion and re-parse it to cure the state
          doc = parser.parseFromString(svgEl.outerHTML, 'image/svg+xml');
        }
      }

      if (doc.querySelector('parsererror')) {
        const errorText = doc.querySelector('parsererror').textContent;
        console.error('XML parsing failed, aborting update to prevent state corruption.', errorText);
        console.error('Corrupted HTML:', cleanHtml);

        // Display a giant red error on screen so the user can easily screenshot the exact reason
        if (!document.getElementById('xml-debug-error')) {
          const errDiv = document.createElement('div');
          errDiv.id = 'xml-debug-error';
          errDiv.style.position = 'fixed';
          errDiv.style.top = '10px';
          errDiv.style.left = '10px';
          errDiv.style.zIndex = '999999';
          errDiv.style.background = '#fff0f0';
          errDiv.style.color = '#d32f2f';
          errDiv.style.padding = '20px';
          errDiv.style.border = '2px solid #d32f2f';
          errDiv.style.maxWidth = '80vw';
          errDiv.style.wordWrap = 'break-word';
          errDiv.style.fontFamily = 'monospace';
          errDiv.innerText = 'XML PARSE ERROR: ' + errorText + '\n\nHTML:\n' + cleanHtml;
          document.body.appendChild(errDiv);
        }

        return prevPages;
      }

      const element = doc.getElementById(elId);

      if (element) {
        // Sync text from DOM first
        if (liveEl) {
          const latestContent = getDeepContent(liveEl);
          const tag = element.tagName.toLowerCase();
          if (tag === 'text') {
            // Preserve original tspan x/y so text doesn't drift
            const origFirstTspan = element.querySelector('tspan');
            const origTspanX = origFirstTspan ? origFirstTspan.getAttribute('x') : null;
            const origTspanY = origFirstTspan ? origFirstTspan.getAttribute('y') : null;
            const origTspanDy = origFirstTspan ? origFirstTspan.getAttribute('dy') : null;
            element.innerHTML = '';
            const lines = latestContent.split('\n');
            const x = origTspanX !== null ? origTspanX : (element.getAttribute('x') || '0');
            const lh = element.getAttribute('data-line-height') || '1.2';
            lines.forEach((line, i) => {
              const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
              tspan.textContent = line.replace(/ +$/, match => '\u00A0'.repeat(match.length)) || '\u00A0';
              tspan.setAttribute('x', x);
              if (i === 0) {
                if (origTspanY !== null) tspan.setAttribute('y', origTspanY);
                if (origTspanDy !== null) tspan.setAttribute('dy', origTspanDy);
              } else {
                tspan.setAttribute('dy', `${parseFloat(lh).toFixed(2)}em`);
              }
              element.appendChild(tspan);
            });
          } else if (tag === 'foreignobject' && element.firstElementChild) {
            // Safely parse the live HTML using an HTML parser, then import nodes to the XML Virtual DOM
            const liveTarget = liveEl.querySelector('.flipbook-text-scrollbar') || liveEl.firstElementChild;
            const elemTarget = element.querySelector('.flipbook-text-scrollbar') || element.firstElementChild;
            const tempDoc = new DOMParser().parseFromString(`<div>${liveTarget.innerHTML}</div>`, 'text/html');
            elemTarget.innerHTML = '';
            Array.from(tempDoc.body.firstChild.childNodes).forEach(child => {
              elemTarget.appendChild(doc.importNode(child, true));
            });
          }
        }

        const tag = element.tagName.toLowerCase();
        if (attribute === 'innerText' || attribute === 'innerHTML') {
          // --- LIVE DOM UPDATE ---
          if (liveEl) {
            const liveTag = liveEl.tagName.toLowerCase();
            if (liveTag === 'foreignobject' && liveEl.firstElementChild) {
              const liveTarget = liveEl.querySelector('.flipbook-text-scrollbar') || liveEl.firstElementChild;

              if (!skipLiveUpdate) {
                const tempDoc = new DOMParser().parseFromString(`<div>${value.replace(/\n/g, '<br/>')}</div>`, 'text/html');
                liveTarget.innerHTML = '';
                Array.from(tempDoc.body.firstChild.childNodes).forEach(child => {
                  liveTarget.appendChild(liveEl.ownerDocument.importNode(child, true));
                });
              }

              // Auto-grow live DOM element
              if (liveEl.getAttribute('data-scrollable') !== 'true') {
                const mode = liveEl.getAttribute('data-sizing-mode');
                if (mode === 'auto-width') {
                  liveEl.firstElementChild.style.setProperty('width', 'max-content', 'important');
                  const contentW = liveEl.firstElementChild.scrollWidth;
                  const foW = parseFloat(liveEl.getAttribute('width')) || 0;
                  if (Math.abs(contentW - foW) > 2) {
                    liveEl.setAttribute('width', contentW + 4);
                  }
                  liveEl.firstElementChild.style.setProperty('width', '100%', 'important');
                }

                liveEl.firstElementChild.style.setProperty('height', 'auto', 'important');
                liveEl.firstElementChild.style.setProperty('min-height', '0px', 'important');

                const contentH = liveEl.firstElementChild.scrollHeight;
                const foH = parseFloat(liveEl.getAttribute('height')) || 0;

                if (Math.abs(contentH - foH) > 2 || mode === 'auto-width') {
                  liveEl.setAttribute('height', contentH + 4);
                  window.dispatchEvent(new CustomEvent('force-update-selection-box', { detail: { elementId: liveEl.id } }));
                }
              }
            } else if (liveTag === 'text') {
              if (!skipLiveUpdate) {
                const origFirstTspan3 = liveEl.querySelector('tspan');
                const origTspanX3 = origFirstTspan3 ? origFirstTspan3.getAttribute('x') : null;
                const origTspanY3 = origFirstTspan3 ? origFirstTspan3.getAttribute('y') : null;
                const origTspanDy3 = origFirstTspan3 ? origFirstTspan3.getAttribute('dy') : null;
                liveEl.innerHTML = '';
                const lines = value.split('\n');
                const xValLive = origTspanX3 !== null ? origTspanX3 : (liveEl.getAttribute('x') || '0');
                const lhLive = liveEl.getAttribute('data-line-height') || '1.2';
                lines.forEach((line, i) => {
                  const tspan = liveEl.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                  tspan.textContent = line.replace(/ +$/, match => '\u00A0'.repeat(match.length)) || '\u00A0';
                  tspan.setAttribute('x', xValLive);
                  if (i === 0) {
                    if (origTspanY3 !== null) tspan.setAttribute('y', origTspanY3);
                    if (origTspanDy3 !== null) tspan.setAttribute('dy', origTspanDy3);
                  } else {
                    tspan.setAttribute('dy', `${parseFloat(lhLive).toFixed(2)}em`);
                  }
                  liveEl.appendChild(tspan);
                });
              }
            }
          }

          // --- VIRTUAL DOM UPDATE ---
          if (tag === 'foreignobject' && element.firstElementChild) {
            const elemTarget = element.querySelector('.flipbook-text-scrollbar') || element.firstElementChild;
            const tempDoc = new DOMParser().parseFromString(`<div>${value.replace(/\n/g, '<br/>')}</div>`, 'text/html');
            elemTarget.innerHTML = '';
            Array.from(tempDoc.body.firstChild.childNodes).forEach(child => {
              elemTarget.appendChild(doc.importNode(child, true));
            });

            // Mirror live DOM dimensions to Virtual DOM
            if (liveEl && liveEl.getAttribute('data-scrollable') !== 'true' && liveEl.getAttribute('data-auto-wrap') !== 'false') {
              element.setAttribute('width', liveEl.getAttribute('width'));
              element.setAttribute('height', liveEl.getAttribute('height'));
            }
          } else if (tag === 'text') {
            // Preserve original tspan x/y so text doesn't drift
            const origFirstTspan2 = element.querySelector('tspan');
            const origTspanX2 = origFirstTspan2 ? origFirstTspan2.getAttribute('x') : null;
            const origTspanY2 = origFirstTspan2 ? origFirstTspan2.getAttribute('y') : null;
            const origTspanDy2 = origFirstTspan2 ? origFirstTspan2.getAttribute('dy') : null;
            element.innerHTML = '';
            const lines = value.split('\n');
            const xVal = origTspanX2 !== null ? origTspanX2 : (element.getAttribute('x') || '0');
            const lh = element.getAttribute('data-line-height') || '1.2';
            lines.forEach((line, i) => {
              const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
              tspan.textContent = line.replace(/ +$/, match => '\u00A0'.repeat(match.length)) || '\u00A0';
              tspan.setAttribute('x', xVal);
              if (i === 0) {
                if (origTspanY2 !== null) tspan.setAttribute('y', origTspanY2);
                if (origTspanDy2 !== null) tspan.setAttribute('dy', origTspanDy2);
              } else {
                tspan.setAttribute('dy', `${parseFloat(lh).toFixed(2)}em`);
              }
              element.appendChild(tspan);
            });
          }
        } else if ((attribute === 'data-scrollable' || attribute === 'data-auto-wrap') && value === 'true' && tag === 'text') {
          const bbox = liveEl?.getBBox() || { x: 0, y: 0, width: 100, height: 50 };
          let scaleX = 1;
          let scaleY = 1;
          let newTransform = element.getAttribute('transform');
          let newX = parseFloat(element.getAttribute('x') || bbox.x);
          let newY = parseFloat(element.getAttribute('y') || bbox.y);
          let newW = bbox.width || 100;
          let newH = bbox.height || 50;

          if (newTransform && newTransform.includes('matrix')) {
            const match = newTransform.match(/matrix\(([^)]+)\)/);
            if (match) {
              const vals = match[1].split(/[ ,]+/).map(parseFloat);
              if (vals.length === 6) {
                const [A, B, C, D, E, F] = vals;
                scaleX = Math.sqrt(A * A + B * B);
                scaleY = Math.sqrt(C * C + D * D);
                if (scaleX > 0 && scaleY > 0) {
                  const newA = A / scaleX;
                  const newB = B / scaleX;
                  const newC = C / scaleY;
                  const newD = D / scaleY;
                  const origX = bbox.x * A + bbox.y * C + E;
                  const origY = bbox.x * B + bbox.y * D + F;
                  newX = 0;
                  newY = 0;
                  newTransform = `matrix(${newA}, ${newB}, ${newC}, ${newD}, ${origX}, ${origY})`;
                }
              }
            }
          }

          const svgEl = liveEl?.ownerSVGElement || liveEl?.closest('svg');
          let maxW = 9999;
          if (svgEl) {
            const svgWidth = svgEl.viewBox?.baseVal?.width || svgEl.clientWidth || 1000;
            maxW = Math.max(50, svgWidth - (newX * scaleX) - 10);
          }

          newW = Math.min(newW * scaleX, maxW) / scaleX;
          newH = newH; // The innerDiv height is auto, so initial height doesn't matter much

          const newFo = doc.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
          newFo.id = element.id;
          newFo.setAttribute('x', newX);
          newFo.setAttribute('y', newY);
          newFo.setAttribute('width', newW);
          newFo.setAttribute('height', newH);
          if (newTransform) newFo.setAttribute('transform', newTransform);

          // Copy attributes
          Array.from(element.attributes).forEach(attr => {
            if (attr.name !== 'x' && attr.name !== 'y' && attr.name !== 'id' && attr.name !== 'transform' && attr.name !== 'width' && attr.name !== 'height') {
              newFo.setAttribute(attr.name, attr.value);
              if (attr.name.startsWith('data-bg-')) {
                newFo.style.setProperty('--' + attr.name.substring(5), attr.value);
              }
              if (attr.name === 'data-scrollbar-color') {
                newFo.style.setProperty('--scrollbar-color', attr.value);
              }
              if (attr.name === 'rx') {
                newFo.style.setProperty('--bg-rx', attr.value + 'px');
              }
            }
          });
          newFo.setAttribute('data-scrollable', attribute === 'data-scrollable' ? 'true' : 'false');
          newFo.setAttribute('overflow', attribute === 'data-scrollable' ? 'hidden' : 'visible');

          const outerDiv = doc.createElementNS('http://www.w3.org/1999/xhtml', 'div');
          let innerDiv;
          if (attribute === 'data-scrollable') {
            outerDiv.className = 'flipbook-text-outer';
            const viewportDiv = doc.createElementNS('http://www.w3.org/1999/xhtml', 'div');
            viewportDiv.className = 'flipbook-text-viewport';
            innerDiv = doc.createElementNS('http://www.w3.org/1999/xhtml', 'div');
            innerDiv.className = 'flipbook-text-scrollbar';
            viewportDiv.appendChild(innerDiv);
            outerDiv.appendChild(viewportDiv);
          } else {
            innerDiv = outerDiv;
            innerDiv.style.height = 'auto';
            innerDiv.style.overflowY = 'visible';
          }
          innerDiv.style.width = '100%';
          innerDiv.style.overflowX = 'hidden';
          innerDiv.style.wordBreak = 'normal';

          if (element.hasAttribute('data-scrollbar-color')) {
            // MainEditor observer handles the style automatically based on this attribute
          }
          innerDiv.style.overflowWrap = 'anywhere';
          innerDiv.style.whiteSpace = 'pre-wrap';
          innerDiv.style.color = element.getAttribute('fill') || '#000000';
          innerDiv.style.background = 'transparent';
          innerDiv.style.backgroundColor = 'transparent';
          innerDiv.style.outline = 'none';

          // Bake font-size into innerDiv to prevent inheritance scaling issues
          const fsStr = element.style.fontSize || element.getAttribute('font-size') || '16px';
          const fsVal = parseFloat(fsStr) || 16;
          innerDiv.style.fontSize = `${fsVal * scaleY}px`;
          innerDiv.innerHTML = '';
          const tempDoc = new DOMParser().parseFromString(`<div>${getDeepContent(liveEl).replace(/\n/g, '<br/>')}</div>`, 'text/html');
          Array.from(tempDoc.body.firstChild.childNodes).forEach(child => {
            innerDiv.appendChild(doc.importNode(child, true));
          });

          const rx = element.getAttribute('rx') || '0';
          if (rx !== '0') outerDiv.style.borderRadius = `${rx}px`;

          newFo.appendChild(outerDiv);
          element.replaceWith(newFo);
        } else if (attribute === 'data-scrollable' && tag === 'foreignobject') {
          element.setAttribute('data-scrollable', value);
          element.setAttribute('overflow', value === 'true' ? 'hidden' : 'visible');
          if (liveEl) {
            liveEl.setAttribute('data-scrollable', value);
            liveEl.setAttribute('overflow', value === 'true' ? 'hidden' : 'visible');
          }
          const mode = element.getAttribute('data-sizing-mode');

          const updateDiv = (div, parentFo) => {
            if (!div) return;
            if (value === 'true') {
              if (div.classList.contains('flipbook-text-outer')) return;

              const outer = parentFo.ownerDocument.createElementNS('http://www.w3.org/1999/xhtml', 'div');
              outer.className = 'flipbook-text-outer';
              const viewport = parentFo.ownerDocument.createElementNS('http://www.w3.org/1999/xhtml', 'div');
              viewport.className = 'flipbook-text-viewport';

              div.style.setProperty('overflow-y', 'auto', 'important');
              div.style.setProperty('overflow-x', 'hidden', 'important');
              div.classList.add('flipbook-text-scrollbar');
              div.style.setProperty('height', '100%', 'important');
              div.style.setProperty('width', '100%', 'important');
              div.style.display = 'block';
              div.style.removeProperty('box-sizing');
              div.style.removeProperty('margin');

              parentFo.replaceChild(outer, div);
              outer.appendChild(viewport);
              viewport.appendChild(div);
            } else {
              let targetDiv = div;
              if (div.classList.contains('flipbook-text-outer')) {
                const scrollbarDiv = div.querySelector('.flipbook-text-scrollbar');
                if (scrollbarDiv) {
                  targetDiv = scrollbarDiv;
                  parentFo.replaceChild(targetDiv, div);
                }
              }

              targetDiv.style.setProperty('overflow-y', 'visible', 'important');
              targetDiv.classList.remove('flipbook-text-scrollbar');
              targetDiv.style.setProperty('height', mode === 'fixed' ? '100%' : 'auto', 'important');
              targetDiv.style.setProperty('width', mode === 'fixed' ? '100%' : 'calc(100% + 4px)', 'important');
              targetDiv.style.setProperty('overflow-x', 'visible', 'important');
              if (mode !== 'fixed') {
                targetDiv.style.display = 'flex';
                targetDiv.style.flexDirection = 'column';
                targetDiv.style.justifyContent = 'center';
              } else {
                targetDiv.style.setProperty('display', 'block', 'important');
                targetDiv.style.removeProperty('flex-direction');
                targetDiv.style.removeProperty('justify-content');
                targetDiv.style.setProperty('white-space', 'pre-wrap', 'important');
              }
              targetDiv.style.removeProperty('margin');
              targetDiv.style.removeProperty('box-sizing');
            }
          };

          updateDiv(element.firstElementChild, element);
          if (liveEl) updateDiv(liveEl.firstElementChild, liveEl);

        } else if (styleProp) {
          let finalProp = (tag === 'foreignobject' && styleProp === 'fill') ? 'color' : styleProp;
          if (tag === 'foreignobject') {
            // --- SCROLLABLE PERSISTENCE ---
            const isScrollable = element.getAttribute('data-scrollable') === 'true';
            const mode = element.getAttribute('data-sizing-mode');

            const applyScrollStyles = (div) => {
              if (!div) return;
              let targetDiv = div;
              if (isScrollable && div.classList.contains('flipbook-text-outer')) {
                const scrollbarDiv = div.querySelector('.flipbook-text-scrollbar');
                if (scrollbarDiv) targetDiv = scrollbarDiv;
              }

              if (isScrollable) {
                targetDiv.style.setProperty('overflow-y', 'auto', 'important');
                targetDiv.style.setProperty('overflow-x', 'hidden', 'important');
                targetDiv.classList.add('flipbook-text-scrollbar');
                targetDiv.style.setProperty('height', '100%', 'important');
                targetDiv.style.setProperty('width', '100%', 'important');
                targetDiv.style.display = 'block';
                const rx = element.getAttribute('rx') || '0';
                if (div.classList.contains('flipbook-text-outer')) {
                  div.style.borderRadius = `${rx}px`;
                } else {
                  targetDiv.style.borderRadius = `${rx}px`;
                }
                targetDiv.style.removeProperty('box-sizing');
                targetDiv.style.removeProperty('margin');
              } else {
                targetDiv.style.setProperty('overflow-y', 'visible', 'important');
                targetDiv.style.setProperty('overflow-x', 'visible', 'important');
                targetDiv.classList.remove('flipbook-text-scrollbar');
                targetDiv.style.setProperty('height', mode === 'fixed' ? '100%' : 'auto', 'important');
                targetDiv.style.setProperty('width', mode === 'fixed' ? '100%' : 'calc(100% + 4px)', 'important');
                if (mode !== 'fixed') {
                  targetDiv.style.display = 'flex';
                  targetDiv.style.flexDirection = 'column';
                  targetDiv.style.justifyContent = 'center';
                } else {
                  targetDiv.style.setProperty('display', 'block', 'important');
                  targetDiv.style.removeProperty('flex-direction');
                  targetDiv.style.removeProperty('justify-content');
                  targetDiv.style.setProperty('white-space', 'pre-wrap', 'important');
                }
                targetDiv.style.removeProperty('margin');
                targetDiv.style.removeProperty('box-sizing');
              }
            };

            if (element.firstElementChild) {
              if (styleProp === 'stroke' || styleProp === 'stroke-opacity') {
                const s = styleProp === 'stroke' ? value : (element.getAttribute('stroke') || 'none');
                const op = styleProp === 'stroke-opacity' ? value : (element.getAttribute('stroke-opacity') || '1');
                element.firstElementChild.style.setProperty('-webkit-text-stroke-color', getStrokeColorWithOpacity(s, op), 'important');
              } else if (styleProp === 'strokeWidth') {
                element.firstElementChild.style.setProperty('-webkit-text-stroke-width', `${value}px`, 'important');
              } else {
                const cssPropName = finalProp.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
                element.firstElementChild.style.setProperty(cssPropName, value, 'important');

                Array.from(element.firstElementChild.querySelectorAll('*')).forEach(child => {
                  if (child.style) {
                    child.style.removeProperty(cssPropName);
                    const camelProp = cssPropName.replace(/-([a-z])/g, g => g[1].toUpperCase());
                    child.style.removeProperty(camelProp);
                  }
                });

                const scrollTarget = element.querySelector('.flipbook-text-scrollbar');
                if (scrollTarget) {
                  scrollTarget.style.setProperty(cssPropName, value, 'important');
                }
              }
              applyScrollStyles(element.firstElementChild);
            }
            const attrName = SVG_ATTR_MAP[attribute] || attribute;
            element.setAttribute(attrName, value);

            if (liveEl) {
              if (liveEl.firstElementChild) {
                if (styleProp === 'stroke' || styleProp === 'stroke-opacity') {
                  const s = styleProp === 'stroke' ? value : (liveEl.getAttribute('stroke') || 'none');
                  const op = styleProp === 'stroke-opacity' ? value : (liveEl.getAttribute('stroke-opacity') || '1');
                  liveEl.firstElementChild.style.setProperty('-webkit-text-stroke-color', getStrokeColorWithOpacity(s, op), 'important');
                } else if (styleProp === 'strokeWidth') {
                  liveEl.firstElementChild.style.setProperty('-webkit-text-stroke-width', `${value}px`, 'important');
                } else {
                  const cssPropName = finalProp.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
                  liveEl.firstElementChild.style.setProperty(cssPropName, value, 'important');

                  Array.from(liveEl.firstElementChild.querySelectorAll('*')).forEach(child => {
                    if (child.style) {
                      child.style.removeProperty(cssPropName);
                      const camelProp = cssPropName.replace(/-([a-z])/g, g => g[1].toUpperCase());
                      child.style.removeProperty(camelProp);
                    }
                  });

                  const scrollTarget = liveEl.querySelector('.flipbook-text-scrollbar');
                  if (scrollTarget) {
                    scrollTarget.style.setProperty(cssPropName, value, 'important');
                  }
                }
                applyScrollStyles(liveEl.firstElementChild);
              }
              const attrName = SVG_ATTR_MAP[attribute] || attribute;
              liveEl.setAttribute(attrName, value);
            }
          } else {
            // For SVG elements (text, g, etc.) set both CSS style and SVG presentation attribute
            if (styleProp === 'strokeWidth') {
              element.setAttribute('stroke-width', value);
              element.style.setProperty('stroke-width', `${value}px`, 'important');
            } else if (styleProp === 'strokeDasharray') {
              element.setAttribute('stroke-dasharray', value);
              element.style.setProperty('stroke-dasharray', value, 'important');
            } else if (styleProp === 'strokeLinecap' || styleProp === 'strokeLinejoin') {
              const attrName = styleProp === 'strokeLinecap' ? 'stroke-linecap' : 'stroke-linejoin';
              element.setAttribute(attrName, value);
              element.style.setProperty(attrName, value, 'important');
            } else {
              element.style.setProperty(styleProp, finalVal, 'important');
            }
            // Use SVG attribute name (e.g., font-size, font-family, text-anchor)
            const svgAttrName = SVG_ATTR_MAP[attribute] || attribute;
            let svgAttrVal = finalVal;
            // Convert textAlign CSS values to SVG text-anchor values
            if (attribute === 'textAlign') {
              svgAttrVal = TEXT_ALIGN_TO_ANCHOR[value] || 'start';
              element.setAttribute('text-anchor', svgAttrVal);
            } else {
              element.setAttribute(svgAttrName, finalVal);
            }
            if (attribute === 'fill' || attribute === 'stroke') {
              element.setAttribute(attribute, value);
            }
            if (attribute === 'stroke' || attribute === 'strokeWidth' || attribute === 'data-stroke-position') {
              const pos = attribute === 'data-stroke-position' ? value : (element.getAttribute('data-stroke-position') || 'Center');
              const paintOrder = pos === 'Outside' ? 'stroke fill' : 'normal';
              element.setAttribute('paint-order', paintOrder);
              element.style.setProperty('paint-order', paintOrder, 'important');
            }
            // Propagate to tspan children so they inherit the style
            if (tag === 'text' || tag === 'g') {
              Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
                if (styleProp === 'strokeWidth') {
                  child.setAttribute('stroke-width', value);
                  child.style.setProperty('stroke-width', `${value}px`, 'important');
                } else if (styleProp === 'strokeDasharray') {
                  child.setAttribute('stroke-dasharray', value);
                  child.style.setProperty('stroke-dasharray', value, 'important');
                } else if (styleProp === 'strokeLinecap' || styleProp === 'strokeLinejoin') {
                  const attrName = styleProp === 'strokeLinecap' ? 'stroke-linecap' : 'stroke-linejoin';
                  child.setAttribute(attrName, value);
                  child.style.setProperty(attrName, value, 'important');
                } else {
                  child.style.setProperty(styleProp, finalVal, 'important');
                  if (attribute === 'textAlign') {
                    child.setAttribute('text-anchor', svgAttrVal);
                  } else {
                    child.setAttribute(svgAttrName, finalVal);
                  }
                }
                if (attribute === 'stroke' || attribute === 'strokeWidth' || attribute === 'data-stroke-position') {
                  const pos = attribute === 'data-stroke-position' ? value : (element.getAttribute('data-stroke-position') || 'Center');
                  const paintOrder = pos === 'Outside' ? 'stroke fill' : 'normal';
                  child.setAttribute('paint-order', paintOrder);
                  child.style.setProperty('paint-order', paintOrder, 'important');
                }
              });
            }
          }
        } else {
          element.setAttribute(attribute, value);
          if (attribute && attribute.startsWith('data-bg-')) {
            if (element.firstElementChild) {
              element.firstElementChild.style.setProperty('--' + attribute.substring(5), value, 'important');
            }
          }
          if (attribute === 'data-scrollbar-color') {
            // Virtual DOM only needs the attribute; MainEditor observer handles the style
          }
          if (liveEl) {
            liveEl.setAttribute(attribute, value);
          }

          // Handle scrollable updates for virtual doc
          if (tag === 'foreignobject' && element.firstElementChild) {
            const isScrollable = element.getAttribute('data-scrollable') === 'true';
            const mode = element.getAttribute('data-sizing-mode');
            if (isScrollable) {
              let targetDiv = element.firstElementChild;
              if (targetDiv.classList.contains('flipbook-text-outer')) {
                const scrollbarDiv = targetDiv.querySelector('.flipbook-text-scrollbar');
                if (scrollbarDiv) targetDiv = scrollbarDiv;
              }
              targetDiv.style.setProperty('overflow-y', 'auto', 'important');
              targetDiv.classList.add('flipbook-text-scrollbar');
              targetDiv.style.setProperty('height', '100%', 'important');
              targetDiv.style.setProperty('overflow-x', 'hidden', 'important');
              const rx = element.getAttribute('rx') || '0';
              if (element.firstElementChild.classList.contains('flipbook-text-outer')) {
                element.firstElementChild.style.borderRadius = `${rx}px`;
              } else {
                targetDiv.style.borderRadius = `${rx}px`;
              }
            } else {
              element.firstElementChild.style.setProperty('overflow-y', 'visible', 'important');
              element.firstElementChild.classList.remove('flipbook-text-scrollbar');
              element.firstElementChild.style.setProperty('height', mode === 'fixed' ? '100%' : 'auto', 'important');
              element.firstElementChild.style.setProperty('overflow-x', 'visible', 'important');
            }
          }
        }

        // --- GRADIENT SYNC (Virtual Doc) ---
        const isGradientRelated = attribute.includes('-stops') || attribute.includes('-gradient-type') || attribute.includes('-type');
        if (attribute.startsWith('fill') || attribute.startsWith('stroke') || isGradientRelated || attribute.includes('stroke-')) {
          const base = (attribute.startsWith('fill') || attribute.includes('fill-')) ? 'fill' : 'stroke';
          syncGradient(doc, element, base);

          // Apply synced gradient to live DOM too
          if (liveEl) {
            const liveSvg = liveEl.ownerSVGElement || liveEl.closest('svg');
            if (liveSvg) {
              syncGradient(liveSvg, liveEl, base);
            }
          }
        }

        // --- EFFECT SYNC ---
        const isEffectRelated = attribute.startsWith('data-effect-');
        if (isEffectRelated) {
          syncTextEffect(doc, element);

          // Apply to live DOM too
          if (liveEl) {
            const liveSvg = liveEl.ownerSVGElement || liveEl.closest('svg');
            if (liveSvg) syncTextEffect(liveSvg, liveEl);
            else syncTextEffect(null, liveEl);
          }
        }

        // --- SYNC LIVE DIMENSIONS ---
        // If the live DOM auto-resized itself (e.g. text wrap expanded the height),
        // we must sync those dimensions to the virtual DOM before saving!
        if (liveEl && liveEl.tagName.toLowerCase() === 'foreignobject') {
          element.setAttribute('width', liveEl.getAttribute('width'));
          element.setAttribute('height', liveEl.getAttribute('height'));
          element.setAttribute('x', liveEl.getAttribute('x'));
          element.setAttribute('y', liveEl.getAttribute('y'));
        }

        const newHtml = new XMLSerializer().serializeToString(doc.documentElement);
        page.html = newHtml;
        newPages[pageIdx] = page;

        // Notify parent of the update
        onUpdate(newHtml);
      }
      return newPages;
    });
  };

  const updateStyle = useCallback((property, value) => {
    if (property === 'fontFamily') setFontFamily(value.replace(/['\"]/g, '').split(',')[0]);
    if (property === 'fontSize') setFontSize(parseInt(value));
    if (property === 'fontWeight') setFontWeight(value.toString());
    if (property === 'fontStyle') setFontStyle(value);
    if (property === 'textDecorationLine' || property === 'textDecoration') setTextDecoration(value);
    if (property === 'textAlign') setTextAlign(value);
    if (property === 'letterSpacing') {
      const numVal = value === 'Auto' || value === '' ? 0 : parseFloat(value);
      setLetterSpacing(numVal);
    }
    if (property === 'lineHeight') {
      const numVal = value === 'Auto' || value === '' ? 1.5 : parseFloat(value);
      setLineHeight(numVal);

      // SVG text: line-height is applied via dy attributes on tspan children
      if (selectedLayerId) {
        const el = document.getElementById(selectedLayerId);
        if (el && el.tagName.toLowerCase() === 'text') {
          el.setAttribute('data-line-height', numVal.toString());
          const tspans = Array.from(el.querySelectorAll('tspan'));
          tspans.forEach((tspan, i) => {
            if (i > 0) tspan.setAttribute('dy', `${numVal.toFixed(2)}em`);
          });
          // Persist to pages state
          updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-line-height', numVal.toString());
          // Also re-serialize tspan dy values into page HTML via a DOM sync
          const svgRoot = el.ownerSVGElement || el.closest('svg');
          if (svgRoot) {
            const container = svgRoot.closest('[data-page-index]');
            if (container) {
              const pageIdx2 = parseInt(container.getAttribute('data-page-index'));
              setPages(prev => {
                const next = [...prev];
                const page = { ...next[pageIdx2] };
                if (!page.html) return prev;
                const parser = new DOMParser();
                const cleanHtml = page.html
                  .replace(/<\s*br[^>]*>(?:<\/\s*br\s*>)?/gi, '<br/>')
                  .replace(/<\/\s*br\s*>/gi, '')
                  .replace(/&nbsp;/gi, '&#160;');
                const doc = parser.parseFromString(cleanHtml, 'image/svg+xml');

                if (doc.querySelector('parsererror')) {
                  console.error('XML parsing failed in line height update, aborting.');
                  return prev;
                }

                const docEl = doc.getElementById(selectedLayerId);
                if (docEl) {
                  docEl.setAttribute('data-line-height', numVal.toString());
                  const docTspans = Array.from(docEl.querySelectorAll('tspan'));
                  docTspans.forEach((ts, i) => {
                    if (i > 0) ts.setAttribute('dy', `${numVal.toFixed(2)}em`);
                  });
                  page.html = new XMLSerializer().serializeToString(doc.documentElement);
                  next[pageIdx2] = page;
                  onUpdate(page.html);
                }
                return next;
              });
            }
          }
        } else if (el) {
          // For foreignObject / div elements, CSS line-height works fine
          updateElementAttributeLocal(activePageIndex, selectedLayerId, 'lineHeight', numVal.toString());
        }
      }
      return;
    }
    if (property === 'textTransform') {
      setTextTransform(value);
      if (value === 'capitalize') {
        const newText = textContent.toLowerCase();
        if (newText !== textContent) {
          setTextContent(newText);
          const el = document.getElementById(selectedLayerId);
          if (el) {
            if (el.tagName.toLowerCase() === 'foreignobject' && el.firstElementChild) {
              const targetDiv = el.querySelector('.flipbook-text-scrollbar') || el.firstElementChild;
              targetDiv.innerHTML = newText.replace(/\n/g, '<br/>');
            } else if (el.tagName.toLowerCase() === 'text') {
              updateElementAttributeLocal(activePageIndex, selectedLayerId, 'innerText', newText);
            }
          }
          if (selectedLayerId && el?.tagName.toLowerCase() !== 'text') {
            updateElementAttributeLocal(activePageIndex, selectedLayerId, 'innerText', newText);
          }
        }
      }
    }

    if (property === 'listStyleType') {
      setListStyleType(value);

      let latestText = textContent;
      const el = document.getElementById(selectedLayerId);
      if (el) {
        const svgRoot = el.ownerSVGElement || el.closest('svg');
        const overlay = svgRoot?.querySelector('foreignObject[data-editing="true"] [contenteditable]');
        if (overlay) {
          latestText = overlay.innerText || overlay.textContent || latestText;
        } else if (el.tagName.toLowerCase() === 'foreignobject' && el.firstElementChild) {
          const targetDiv = el.querySelector('.flipbook-text-scrollbar') || el.firstElementChild;
          latestText = targetDiv.innerText || targetDiv.textContent || latestText;
        } else if (el.tagName.toLowerCase() === 'text') {
          const tspans = Array.from(el.querySelectorAll('tspan'));
          if (tspans.length > 0) {
            let res = '';
            let lastY = null;
            tspans.forEach((t, i) => {
              const y = t.getAttribute('y');
              const dy = t.getAttribute('dy');
              if (i > 0 && (dy || (y !== null && lastY !== null && Math.abs(parseFloat(y) - parseFloat(lastY)) > 2))) {
                res += '\n';
              }
              if (y !== null) lastY = y;
              res += t.textContent;
            });
            latestText = res || latestText;
          } else {
            latestText = el.textContent || latestText;
          }
        }
      }

      // Transform text content to list
      let lines = latestText.split('\n').map(l => l.trim());
      if (value === 'disc') {
        lines = lines.map(line => {
          if (line.startsWith('• ')) return line;
          if (line.match(/^\d+\. /)) return line.replace(/^\d+\. /, '• ');
          return '• ' + line;
        });
      } else if (value === 'decimal') {
        lines = lines.map((line, i) => {
          const prefix = `${i + 1}. `;
          if (line.startsWith('• ')) return line.replace('• ', prefix);
          if (line.match(/^\d+\. /)) return line.replace(/^\d+\. /, prefix);
          return prefix + line;
        });
      } else if (value === 'none') {
        lines = lines.map(line => line.replace(/^(• |\d+\. )/, ''));
      }
      const newText = lines.join('\n');
      setTextContent(newText);

      // Live DOM Update for instant feedback
      if (el) {
        if (el.tagName.toLowerCase() === 'foreignobject' && el.firstElementChild) {
          const targetDiv = el.querySelector('.flipbook-text-scrollbar') || el.firstElementChild;
          targetDiv.innerHTML = newText.replace(/\n/g, '<br/>');
        } else if (el.tagName.toLowerCase() === 'text') {
          // Triggering a local update will rebuild tspans
          updateElementAttributeLocal(activePageIndex, selectedLayerId, 'innerText', newText);
        }
      }

      if (selectedLayerId && el?.tagName.toLowerCase() !== 'text') {
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'innerText', newText);
      }

      if (el) {
        window.dispatchEvent(new CustomEvent('force-update-selection-box', { detail: { elementId: el.id } }));
      }
      return;
    }

    if (selectedLayerId) {
      // Direct DOM manipulation for instant feedback during editing
      const el = document.getElementById(selectedLayerId);
      let adjustedValue = value;

      if (el && property === 'fontSize' && el.tagName.toLowerCase() !== 'foreignobject') {
        const transform = el.getAttribute('transform');
        if (transform && transform.includes('matrix')) {
          const match = transform.match(/matrix\(([^)]+)\)/);
          if (match) {
            const vals = match[1].split(/[ ,]+/).map(parseFloat);
            if (vals.length >= 4) {
              const scaleY = Math.sqrt(vals[2] * vals[2] + vals[3] * vals[3]);
              if (scaleY > 0) {
                adjustedValue = (parseFloat(value) / scaleY).toFixed(2);
              }
            }
          }
        }
      }

      const isCharacterProp = ['fill', 'color', 'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'textDecoration', 'textTransform'].includes(property);
      let selectionApplied = false;

      if (isCharacterProp) {
        selectionApplied = applyStyleToActiveTextSelection(selectedLayerId, property, value);
      }

      if (selectionApplied) {
        if (el) {
          const liveTarget = el.querySelector('.flipbook-text-scrollbar') || el.firstElementChild;
          if (liveTarget) {
            updateElementAttributeLocal(activePageIndex, selectedLayerId, 'innerHTML', liveTarget.innerHTML, true);
          }
          window.dispatchEvent(new CustomEvent('force-update-selection-box', { detail: { elementId: el.id } }));
        }
      } else {
        if (el) {
          const styleProp = STYLE_MAP[property];
          if (styleProp) {
            const finalVal = (property === 'fontSize' || property === 'letterSpacing') && !adjustedValue.toString().includes('px') && !adjustedValue.toString().includes('em') ? `${adjustedValue}px` : adjustedValue;

            if (el.tagName.toLowerCase() === 'foreignobject') {
              if (el.firstElementChild) {
                const div = el.firstElementChild;
                div.style[styleProp] = finalVal;
              }
            } else {
              // SVG text element — set both CSS style and SVG presentation attribute
              el.style[styleProp] = finalVal;
              const svgAttrName = SVG_ATTR_MAP[property] || property;
              if (property === 'textAlign') {
                const anchorVal = TEXT_ALIGN_TO_ANCHOR[value] || 'start';
                el.setAttribute('text-anchor', anchorVal);
              } else {
                el.setAttribute(svgAttrName, finalVal);
              }
              // Propagate to tspan children
              const elTag = el.tagName.toLowerCase();
              if (elTag === 'text' || elTag === 'g') {
                Array.from(el.querySelectorAll('tspan')).forEach(child => {
                  child.style[styleProp] = finalVal;
                  if (property === 'textAlign') {
                    child.setAttribute('text-anchor', TEXT_ALIGN_TO_ANCHOR[value] || 'start');
                  } else {
                    child.setAttribute(svgAttrName, finalVal);
                  }
                });
              }
            }

            // Also update the editing overlay if it exists!
            const svgRoot = el.ownerSVGElement || el.closest('svg');
            const overlay = svgRoot?.querySelector('foreignObject[data-editing="true"] [contenteditable]');
            if (overlay) {
              overlay.style[styleProp] = finalVal;
            }

            window.dispatchEvent(new CustomEvent('force-update-selection-box', { detail: { elementId: el.id } }));
          }
        }

        updateElementAttributeLocal(activePageIndex, selectedLayerId, property, adjustedValue);
      }
    }
  }, [selectedLayerId, activePageIndex, updateElementAttributeLocal, selectionRange, textContent, onUpdate]);

  const handleScrub = useCallback((property, startValue, step = 1) => (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const initialVal = property === 'lineHeight' ? (parseFloat(startValue) || 1.2) : (parseFloat(startValue) || 0);

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaValue = (deltaX / 10) * step;
      let newValue = initialVal + deltaValue;

      if (property === 'lineHeight') {
        newValue = Math.max(0.1, parseFloat(newValue.toFixed(2)));
      } else {
        newValue = Math.round(newValue);
      }

      updateStyle(property, newValue);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'ew-resize';
  }, [updateStyle]);

  const togglePanel = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  // --- TEXT SIZING MODE ---
  const applyTextSizingMode = useCallback((mode) => {
    if (!selectedLayerId) return;
    setSizingMode(mode);

    const liveEl = document.getElementById(selectedLayerId);
    if (!liveEl) return;

    // Store on element
    liveEl.setAttribute('data-sizing-mode', mode);

    const tag = liveEl.tagName.toLowerCase();

    if (tag === 'foreignobject') {
      const div = liveEl.firstElementChild;
      if (!div) return;

      if (mode !== 'fixed' && liveEl.getAttribute('data-scrollable') === 'true') {
        setIsScrollable(false);
        liveEl.setAttribute('data-scrollable', 'false');
        updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-scrollable', 'false');
        div.classList.remove('flipbook-text-scrollbar');
        div.style.borderRadius = '0';
      }

      if (mode === 'auto-width') {
        // Single line, no wrap — grow width to fit content
        div.style.setProperty('white-space', 'nowrap', 'important');
        div.style.setProperty('overflow', 'visible', 'important');
        div.style.setProperty('height', 'auto', 'important');
        div.style.setProperty('min-height', '0px', 'important');
        div.style.setProperty('width', 'max-content', 'important');
        // Measure and apply
        const newW = div.scrollWidth + 4;
        const newH = div.scrollHeight + 4;
        liveEl.setAttribute('width', newW);
        liveEl.setAttribute('height', newH);
        // Fix div back to 100%
        div.style.setProperty('width', '100%', 'important');

      } else if (mode === 'auto-height') {
        // Wrap text, grow height
        div.style.setProperty('white-space', 'pre-wrap', 'important');
        div.style.setProperty('overflow', 'visible', 'important');
        div.style.setProperty('height', 'auto', 'important');
        div.style.setProperty('min-height', '0px', 'important');
        div.style.setProperty('width', '100%', 'important');
        const newH = div.scrollHeight + 4;
        liveEl.setAttribute('height', newH);

      } else if (mode === 'fixed') {
        // Both dimensions fixed, overflow visible unless scrollable is enabled
        div.style.setProperty('white-space', 'pre-wrap', 'important');
        div.style.setProperty('overflow', 'visible', 'important');
        div.style.setProperty('height', '100%', 'important');
        div.style.setProperty('width', '100%', 'important');
        div.style.setProperty('display', 'block', 'important');
      }

      window.dispatchEvent(new CustomEvent('force-update-selection-box', { detail: { elementId: liveEl.id } }));
    }

    // Persist to pages state
    updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-sizing-mode', mode);
  }, [selectedLayerId, activePageIndex, updateElementAttributeLocal]);

  const getCurrentStyle = (prop) => {
    if (!selectedElement) return '';
    return window.getComputedStyle(selectedElement)[prop] || '';
  };

  const getDeepStyle = useCallback((el, prop) => {
    if (!el) return '';
    const targetEl = el.tagName.toLowerCase() === 'foreignobject' && el.firstElementChild ? el.firstElementChild : el;
    const style = window.getComputedStyle(targetEl);
    let val = style[prop];

    // If the container style seems default/inherited, search children for a more specific style
    if (val === 'normal' || val === '400' || val.includes('sans-serif') || val === '0px' || val === '16px') {
      const cssPropName = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
      const styledChild = targetEl.querySelector(`span[style*="${cssPropName}"], [style*="${prop}"]`);
      if (styledChild) {
        return window.getComputedStyle(styledChild)[prop];
      }
    }
    return val;
  }, []);

  const calculateLineHeightMultiplier = () => {
    const el = document.getElementById(selectedLayerId);
    if (!el) return 1.5;

    const inlineLH = el.getAttribute('data-line-height');
    if (inlineLH && /^[0-9.]+$/.test(inlineLH)) {
      return parseFloat(inlineLH);
    }

    if (el.tagName.toLowerCase() === 'text') {
      const tspans = el.querySelectorAll('tspan');
      if (tspans.length > 1) {
        const dy = tspans[1].getAttribute('dy');
        if (dy && dy.endsWith('em')) {
          return parseFloat(dy);
        }

        // Calculate from consecutive y coordinates (Figma logic)
        const y1 = parseFloat(tspans[0].getAttribute('y'));
        let y2 = NaN;
        for (let i = 1; i < tspans.length; i++) {
          const currentY = parseFloat(tspans[i].getAttribute('y'));
          if (!isNaN(currentY) && currentY !== y1) {
            y2 = currentY;
            break;
          }
        }
        if (!isNaN(y1) && !isNaN(y2)) {
          const dyPx = Math.abs(y2 - y1);
          const fontSizeStr = el.getAttribute('font-size') || el.style.fontSize;
          const fontSize = parseFloat(fontSizeStr) || 16;
          return parseFloat((dyPx / fontSize).toFixed(2));
        }
      } else if (tspans.length === 1) {
        return 1.5;
      }
    }

    const targetEl = el.tagName.toLowerCase() === 'foreignobject' && el.firstElementChild ? el.firstElementChild : el;

    const computed = window.getComputedStyle(targetEl);
    const fontSize = parseFloat(computed.fontSize);
    const lh = computed.lineHeight;

    if (lh === 'normal') return 1.5;
    const val = parseFloat(lh);

    // If computed is in px (most likely), convert to multiplier
    if (fontSize && lh.includes('px')) {
      return parseFloat((val / fontSize).toFixed(2));
    }
    if (!isNaN(val)) return val;
    return 1.5;
  };

  // --- EFFECTS ---

  useEffect(() => {
    if (selectedElement !== lastSelectedElementRef.current) {
      isSyncingRef.current = true;
      setIsSyncing(true);
      lastSelectedElementRef.current = selectedElement;
    }
  }, [selectedElement]);

  const getDeepContent = useCallback((el) => {
    if (!el) return '';

    const tag = el.tagName.toLowerCase();

    // 1. If the element is a foreignObject being edited, read from the editable div
    if (tag === 'foreignobject') {
      const div = el.querySelector('.flipbook-text-scrollbar') || el.firstElementChild;
      if (!div) return '';
      // innerText respects <br> elements and converts them to \n
      return div.innerText || div.textContent || '';
    }

    // 2. Check if there is an active editing overlay for a text element
    const svgRoot = el.ownerSVGElement || el.closest('svg');
    if (svgRoot) {
      const editingOverlay = svgRoot.querySelector('foreignObject[data-editing="true"] [contenteditable]');
      if (editingOverlay) {
        return editingOverlay.innerText || editingOverlay.textContent || '';
      }
    }

    // 3. Handle SVG <text> with <tspan> children (legacy - before conversion)
    if (tag === 'text') {
      const tspans = Array.from(el.querySelectorAll('tspan'));
      if (tspans.length > 0) {
        let result = '';
        let lastY = null;
        tspans.forEach((t, i) => {
          const y = t.getAttribute('y');
          const dy = t.getAttribute('dy');
          let isNewLine = false;

          if (i > 0) {
            if (dy) {
              isNewLine = true;
            } else if (y !== null && lastY !== null && Math.abs(parseFloat(y) - parseFloat(lastY)) > 2) {
              isNewLine = true;
            }
          }

          if (y !== null) lastY = y;

          if (isNewLine) {
            result += '\n' + t.textContent;
          } else {
            result += t.textContent;
          }
        });
        return result;
      }
      return el.textContent;
    }

    // 4. Fallback
    return el.innerText || el.textContent || '';
  }, []);


  // --- CONSOLIDATED SYNCHRONIZATION EFFECT ---
  // This effect handles both the initial load of properties and real-time sync from canvas
  useEffect(() => {
    if (!selectedLayerId) return;

    const syncFromCanvas = () => {
      const el = document.getElementById(selectedLayerId);
      if (!el) return;

      // Update text content
      const content = getDeepContent(el);
      setTextContent(content);

      // Update styles
      const ff = getDeepStyle(el, 'fontFamily');
      const fs = getDeepStyle(el, 'fontSize');
      const targetEl = el.tagName.toLowerCase() === 'foreignobject' && el.firstElementChild ? el.firstElementChild : el;
      const style = window.getComputedStyle(targetEl);

      if (ff) setFontFamily(ff.replace(/['"]/g, '').split(',')[0]);
      if (fs) {
        let fontSizeVal = parseInt(fs);
        const transform = el.getAttribute('transform');
        if (transform && transform.includes('matrix') && el.tagName.toLowerCase() !== 'foreignobject') {
          const match = transform.match(/matrix\(([^)]+)\)/);
          if (match) {
            const vals = match[1].split(/[ ,]+/).map(parseFloat);
            if (vals.length >= 4) {
              const scaleY = Math.sqrt(vals[2] * vals[2] + vals[3] * vals[3]);
              if (scaleY > 0) fontSizeVal = Math.round(fontSizeVal * scaleY);
            }
          }
        }
        setFontSize(fontSizeVal);
      }

      const weight = style.fontWeight || el.getAttribute('font-weight');
      const normalizedWeight = weight === 'bold' ? '700' : (weight === 'normal' ? '400' : weight);
      if (normalizedWeight) setFontWeight(normalizedWeight.toString());

      const fontStyleVal = style.fontStyle || el.getAttribute('font-style');
      if (fontStyleVal && fontStyleVal !== 'normal') setFontStyle(fontStyleVal);
      else setFontStyle('normal');

      const textDeco = style.textDecorationLine && style.textDecorationLine !== 'none' ? style.textDecorationLine : (style.textDecoration && !style.textDecoration.includes('none') ? style.textDecoration : el.getAttribute('text-decoration'));
      if (textDeco && !textDeco.includes('none')) setTextDecoration(textDeco);
      else setTextDecoration('none');

      let alignVal = style.textAlign;
      if (el.tagName.toLowerCase() === 'text' || el.tagName.toLowerCase() === 'tspan') {
        const anchor = el.getAttribute('text-anchor');
        if (anchor === 'middle') alignVal = 'center';
        else if (anchor === 'end') alignVal = 'right';
        else if (anchor === 'start') alignVal = 'left';
      } else {
        if (alignVal === 'start') alignVal = 'left';
        if (alignVal === 'end') alignVal = 'right';
      }
      if (alignVal) setTextAlign(alignVal);

      const textTransformVal = style.textTransform || el.getAttribute('text-transform');
      if (textTransformVal) setTextTransform(textTransformVal);
      else setTextTransform('none');

      // Sync Letter Spacing
      let ls = style.letterSpacing;
      if (el.tagName.toLowerCase() === 'text' || el.tagName.toLowerCase() === 'tspan') {
        ls = el.getAttribute('letter-spacing') || ls;
      }
      if (ls && ls !== 'normal') {
        setLetterSpacing(parseFloat(ls));
      } else {
        setLetterSpacing(0);
      }

      // Sync Line Height
      const lh = calculateLineHeightMultiplier();
      setLineHeight(lh);

      // Sync sizing mode
      const storedMode = el.getAttribute('data-sizing-mode');
      if (storedMode) setSizingMode(storedMode);
      else setSizingMode('auto-height');

      // Sync Effects
      syncTextEffect(null, el);
    };

    // Initial sync
    syncFromCanvas();

    // 2. Observer for DOM changes (like when MainEditor finishes editing and swaps fo for text)
    const el = document.getElementById(selectedLayerId);
    let observer = null;
    if (el) {
      observer = new MutationObserver((mutations) => {
        if (el.getAttribute('data-editing') === 'true') return;
        // Optimization: only sync if relevant nodes changed
        syncFromCanvas();
      });

      // Observe the element itself and its parent (for sibling overlays)
      observer.observe(el, {
        attributes: true,
        attributeFilter: ['data-sizing-mode'],
        characterData: true,
        childList: true,
        subtree: true
      });
      if (el.parentNode) {
        observer.observe(el.parentNode, { childList: true, subtree: true });
      }
    }

    return () => {
      observer?.disconnect();
    };
  }, [selectedLayerId, selectedElement, getDeepContent, getDeepStyle]);

  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current || !selectedElement) return;
    const { selectionStart, selectionEnd } = textareaRef.current;
    setSelectionRange({ start: selectionStart, end: selectionEnd });

    // Detection logic: Find the node at selectionStart and fetch its style
    let currentPos = 0;
    const findStyleAtPos = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const nextPos = currentPos + node.length;
        if (selectionStart >= currentPos && selectionStart < nextPos) {
          const style = window.getComputedStyle(node.parentElement);
          if (style.fontFamily) setFontFamily(style.fontFamily.replace(/['\"]/g, '').split(',')[0]);
          if (style.fontSize) setFontSize(parseInt(style.fontSize));
          return true;
        }
        currentPos = nextPos;
      } else {
        for (const child of node.childNodes) {
          if (findStyleAtPos(child)) return true;
        }
      }
      return false;
    };

    findStyleAtPos(selectedElement);
  }, [selectedElement]);



  // Reset panels when selectedElement or closePanelsSignal changes
  useEffect(() => {
    setShowStrokePositionDropdown(false);
  }, [selectedElement, closePanelsSignal]);


  // Design update logic removed
  useEffect(() => {
    // UI only - no canvas updates
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowFontDropdown(false);
      if (fontSizeRef.current && !fontSizeRef.current.contains(event.target)) setShowFontSizeDropdown(false);
      if (weightRef.current && !weightRef.current.contains(event.target)) setShowWeightDropdown(false);
      if (borderStyleRef.current && !borderStyleRef.current.contains(event.target)) setShowBorderStyleDropdown(false);
      if (strokePositionRef.current && !strokePositionRef.current.contains(event.target)) setShowStrokePositionDropdown(false);

      // Close panels if clicked outside
      if (activePanel) {
        if (activePanel === 'alignment' && alignmentRef.current && !alignmentRef.current.contains(event.target) && !event.target.closest('.alignment-trigger')) setActivePanel(null);
        if (activePanel === 'style' && styleRef.current && !styleRef.current.contains(event.target) && !event.target.closest('.style-trigger')) setActivePanel(null);
        if (activePanel === 'case' && caseRef.current && !caseRef.current.contains(event.target) && !event.target.closest('.case-trigger')) setActivePanel(null);
        if (activePanel === 'list' && listRef.current && !listRef.current.contains(event.target) && !event.target.closest('.list-trigger')) setActivePanel(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePanel, showFontDropdown, showFontSizeDropdown, showWeightDropdown, showBorderStyleDropdown, showStrokePositionDropdown]);

  if (!selectedElement) return null;

  return (
    <div
      className="w-full flex flex-col gap-[0.4vw] font-sans text-gray-800"
      onMouseDown={(e) => {
        if (e.target.tagName !== 'INPUT') {
          e.preventDefault();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-[0.75vw] mb-[0.5vw]">
        <h2 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Text Property</h2>
        <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
      </div>



      {/* Font Selectors Row 1 */}
      <div className="flex gap-[0.65vw] mb-[0.5vw]">
        <div className="relative flex-[1.5]" ref={dropdownRef}>
          <button
            onClick={() => setShowFontDropdown(!showFontDropdown)}
            className="w-full h-[2.5vw] px-[0.75vw] flex items-center justify-between border border-gray-400 rounded-[0.75vw] bg-white"
          >
            <span className="text-[0.85vw] truncate" style={{ fontFamily: `'${fontFamily}'` }}>{fontFamily === 'Designer_Signature' ? 'Designer Signature' : fontFamily}</span>
            <ChevronDown size="1vw" className="text-gray-500" />
          </button>
          {showFontDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-[0.75vw] shadow-lg max-h-[12vw] overflow-y-auto">
              {fontFamilies.map(font => (
                <div key={font} onClick={() => { updateStyle('fontFamily', font); setShowFontDropdown(false); }} className="px-[0.75vw] py-[0.4vw] hover:bg-gray-100 cursor-pointer text-[0.85vw]" style={{ fontFamily: `'${font}'` }}>{font === 'Designer_Signature' ? 'Designer Signature' : font}</div>
              ))}
            </div>
          )}
        </div>
        <div className="relative flex-1" ref={fontSizeRef}>
          <div className="w-full h-[2.5vw] px-[0.75vw] flex items-center justify-between border border-gray-400 rounded-[0.75vw] bg-white focus-within:border-indigo-500 transition-colors">
            <input
              type="text"
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    updateStyle('fontSize', val);
                    setShowFontSizeDropdown(false);
                  }
                  e.target.blur();
                }
              }}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  updateStyle('fontSize', val);
                }
              }}
              onFocus={() => setShowFontSizeDropdown(true)}
              className="w-full bg-transparent outline-none text-[0.85vw] text-gray-700"
            />
            <ChevronDown
              size="1vw"
              className="text-gray-500 cursor-pointer flex-shrink-0"
              onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
            />
          </div>
          {showFontSizeDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-[0.75vw] shadow-lg max-h-[12vw] overflow-y-auto">
              {[2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 128].map(size => (
                <div key={size} onClick={() => { updateStyle('fontSize', size); setShowFontSizeDropdown(false); }} className="px-[0.75vw] py-[0.4vw] hover:bg-gray-100 cursor-pointer text-[0.85vw] text-center">{size}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Font Selectors Row 2 */}
      <div className="flex gap-[0.65vw] mb-[0.5vw]">
        <div className="relative flex-1" ref={weightRef}>
          <button
            onClick={() => setShowWeightDropdown(!showWeightDropdown)}
            className="w-full h-[2.5vw] px-[0.75vw] flex items-center justify-between border border-gray-400 rounded-[0.75vw] bg-white"
          >
            <span className="text-[0.85vw] truncate">{fontWeights.find(w => w.value === fontWeight.toString())?.name || 'Regular'}</span>
            <ChevronDown size="1vw" className="text-gray-500" />
          </button>
          {showWeightDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-[0.75vw] shadow-lg max-h-[12vw] overflow-y-auto">
              {fontWeights.map(w => (
                <div key={w.value} onClick={() => { updateStyle('fontWeight', w.value); setShowWeightDropdown(false); }} className="px-[0.75vw] py-[0.4vw] hover:bg-gray-100 cursor-pointer text-[0.85vw]">{w.name}</div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-between border border-gray-400 rounded-[0.75vw] px-[0.6vw] h-[2.5vw] bg-white focus-within:border-indigo-500 transition-colors">
          <input
            type="text"
            value={letterSpacing}
            onChange={(e) => {
              setLetterSpacing(e.target.value);
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) updateStyle('letterSpacing', val);
            }}
            className="w-full bg-transparent outline-none text-[0.75vw] text-gray-700 font-medium"
          />
          <div
            className="flex items-center border-l border-gray-300 pl-[0.4vw] ml-[0.4vw] cursor-ew-resize active:text-indigo-600"
            onMouseDown={handleScrub('letterSpacing', letterSpacing, 1)}
          >
            <Icon icon="solar:paragraph-spacing-bold" className="w-[1.2vw] h-[1.2vw] text-gray-600 rotate-90 pointer-events-none" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-between border border-gray-400 rounded-[0.75vw] px-[0.6vw] h-[2.5vw] bg-white focus-within:border-indigo-500 transition-colors">
          <input
            type="text"
            value={lineHeight}
            onChange={(e) => {
              setLineHeight(e.target.value);
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) updateStyle('lineHeight', val);
            }}
            className="w-full bg-transparent outline-none text-[0.75vw] text-gray-700 font-medium"
          />
          <div
            className="flex items-center border-l border-gray-300 pl-[0.4vw] ml-[0.4vw] cursor-ew-resize active:text-indigo-600"
            onMouseDown={handleScrub('lineHeight', lineHeight, 0.1)}
          >
            <Icon icon="solar:paragraph-spacing-bold" className="w-[1.2vw] h-[1.2vw] text-gray-600 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Toolbar Buttons */}
      <div className="flex gap-[0.8vw] relative">
        {/* Alignment */}
        <div className="relative" ref={alignmentRef}>
          <button
            onClick={() => togglePanel('alignment')}
            className={`w-[3vw] h-[3vw] rounded-[0.8vw] flex items-center justify-center transition-all duration-200 ${activePanel === 'alignment'
              ? 'bg-indigo-600 text-white shadow-lg scale-95'
              : 'bg-[#F1F3F5] text-[#343A40] hover:bg-[#E9ECEF] hover:shadow-sm'
              }`}
          >
            {textAlign === 'center' ? <AlignCenter size="1.3vw" strokeWidth={2.5} /> :
              textAlign === 'right' ? <AlignRight size="1.3vw" strokeWidth={2.5} /> :
                textAlign === 'justify' ? <AlignJustify size="1.3vw" strokeWidth={2.5} /> :
                  <AlignLeft size="1.3vw" strokeWidth={2.5} />}
          </button>
          {activePanel === 'alignment' && (
            <div className="absolute top-[3.5vw] left-0 z-50 p-[0.5vw] bg-white border border-gray-100 rounded-[1vw] flex gap-[0.4vw] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-200">
              <button onClick={() => { updateStyle('textAlign', 'left'); togglePanel(null); }} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textAlign === 'left' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}><AlignLeft size="1.2vw" /></button>
              <button onClick={() => { updateStyle('textAlign', 'center'); togglePanel(null); }} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textAlign === 'center' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}><AlignCenter size="1.2vw" /></button>
              <button onClick={() => { updateStyle('textAlign', 'right'); togglePanel(null); }} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textAlign === 'right' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}><AlignRight size="1.2vw" /></button>
              <button onClick={() => { updateStyle('textAlign', 'justify'); togglePanel(null); }} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textAlign === 'justify' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}><AlignJustify size="1.2vw" /></button>
            </div>
          )}
        </div>

        {/* Style (Bold/Italic/etc) */}
        <div className="relative" ref={styleRef}>
          <button
            onClick={() => togglePanel('style')}
            className={`w-[3vw] h-[3vw] rounded-[0.8vw] flex items-center justify-center transition-all duration-200 ${activePanel === 'style'
              ? 'bg-indigo-600 text-white shadow-lg scale-95'
              : 'bg-[#F1F3F5] text-[#343A40] hover:bg-[#E9ECEF] hover:shadow-sm'
              }`}
          >
            <Bold size="1.3vw" strokeWidth={2.5} />
          </button>
          {activePanel === 'style' && (
            <div className="absolute top-[3.5vw] left-0 z-50 p-[0.5vw] bg-white border border-gray-100 rounded-[1vw] flex gap-[0.4vw] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-200">
              <button onClick={() => updateStyle('fontWeight', fontWeight === '700' ? '400' : '700')} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center font-semibold transition-all ${fontWeight === '700' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}>B</button>
              <button onClick={() => updateStyle('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic')} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center italic transition-all ${fontStyle === 'italic' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}>I</button>
              <button onClick={() => updateStyle('textDecoration', textDecoration === 'underline' ? 'none' : 'underline')} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center underline transition-all ${textDecoration === 'underline' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}>U</button>
              <button onClick={() => updateStyle('textDecoration', textDecoration === 'line-through' ? 'none' : 'line-through')} className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${textDecoration === 'line-through' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}><span className="line-through">S</span></button>
            </div>
          )}
        </div>

        {/* Case */}
        <div className="relative" ref={caseRef}>
          <button
            onClick={() => togglePanel('case')}
            className={`w-[3vw] h-[3vw] rounded-[0.8vw] flex items-center justify-center transition-all duration-200 ${activePanel === 'case'
              ? 'bg-indigo-600 text-white shadow-lg scale-95'
              : 'bg-[#F1F3F5] text-[#343A40] hover:bg-[#E9ECEF] hover:shadow-sm'
              }`}
          >
            <span className="font-semibold text-[0.9vw] tracking-tight">
              {textTransform === 'capitalize' ? 'Aa' : textTransform === 'uppercase' ? 'AA' : textTransform === 'lowercase' ? 'aa' : 'aA'}
            </span>
          </button>
          {activePanel === 'case' && (
            <div className="absolute top-[3.5vw] left-0 z-50 p-[0.5vw] bg-white border border-gray-100 rounded-[1vw] flex gap-[0.4vw] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-200">
              {/* Default */}
              <div className="relative group/btn flex items-center justify-center">
                <button
                  onClick={() => { updateStyle('textTransform', 'none'); togglePanel(null); }}
                  className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center font-semibold text-[0.85vw] tracking-tight transition-all ${textTransform === 'none' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}
                >
                  aA
                </button>
                <div className="absolute bottom-full mb-[0.4vw] hidden group-hover/btn:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-gray-900 text-white text-[0.65vw] px-[0.5vw] py-[0.25vw] rounded-[0.4vw] shadow-lg font-medium">
                    Default
                  </div>
                  <div className="w-0 h-0 border-x-[0.25vw] border-x-transparent border-t-[0.3vw] border-t-gray-900"></div>
                </div>
              </div>

              {/* Capitalize */}
              <div className="relative group/btn flex items-center justify-center">
                <button
                  onClick={() => { updateStyle('textTransform', 'capitalize'); togglePanel(null); }}
                  className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center font-semibold text-[0.85vw] tracking-tight transition-all ${textTransform === 'capitalize' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}
                >
                  Aa
                </button>
                <div className="absolute bottom-full mb-[0.4vw] hidden group-hover/btn:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-gray-900 text-white text-[0.65vw] px-[0.5vw] py-[0.25vw] rounded-[0.4vw] shadow-lg font-medium">
                    Capitalize
                  </div>
                  <div className="w-0 h-0 border-x-[0.25vw] border-x-transparent border-t-[0.3vw] border-t-gray-900"></div>
                </div>
              </div>

              {/* Uppercase */}
              <div className="relative group/btn flex items-center justify-center">
                <button
                  onClick={() => { updateStyle('textTransform', 'uppercase'); togglePanel(null); }}
                  className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center font-semibold text-[0.85vw] tracking-tight transition-all ${textTransform === 'uppercase' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}
                >
                  AA
                </button>
                <div className="absolute bottom-full mb-[0.4vw] hidden group-hover/btn:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-gray-900 text-white text-[0.65vw] px-[0.5vw] py-[0.25vw] rounded-[0.4vw] shadow-lg font-medium">
                    Uppercase
                  </div>
                  <div className="w-0 h-0 border-x-[0.25vw] border-x-transparent border-t-[0.3vw] border-t-gray-900"></div>
                </div>
              </div>

              {/* Lowercase */}
              <div className="relative group/btn flex items-center justify-center">
                <button
                  onClick={() => { updateStyle('textTransform', 'lowercase'); togglePanel(null); }}
                  className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center font-semibold text-[0.85vw] tracking-tight transition-all ${textTransform === 'lowercase' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}
                >
                  aa
                </button>
                <div className="absolute bottom-full mb-[0.4vw] hidden group-hover/btn:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-gray-900 text-white text-[0.65vw] px-[0.5vw] py-[0.25vw] rounded-[0.4vw] shadow-lg font-medium">
                    Lowercase
                  </div>
                  <div className="w-0 h-0 border-x-[0.25vw] border-x-transparent border-t-[0.3vw] border-t-gray-900"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="relative" ref={listRef}>
          <button
            onClick={() => togglePanel('list')}
            className={`w-[3vw] h-[3vw] rounded-[0.8vw] flex items-center justify-center transition-all duration-200 ${activePanel === 'list'
              ? 'bg-indigo-600 text-white shadow-lg scale-95'
              : 'bg-[#F1F3F5] text-[#343A40] hover:bg-[#E9ECEF] hover:shadow-sm'
              }`}
          >
            {listStyleType === 'decimal' ? <ListOrdered size="1.3vw" strokeWidth={2.5} /> : <List size="1.3vw" strokeWidth={2.5} />}
          </button>
          {activePanel === 'list' && (
            <div className="absolute top-[3.5vw] right-0 z-50 p-[0.5vw] bg-white border border-gray-100 rounded-[1vw] flex gap-[0.4vw] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => { updateStyle('listStyleType', listStyleType === 'disc' ? 'none' : 'disc'); togglePanel(null); }}
                className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${listStyleType === 'disc' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}
              >
                <List size="1.2vw" />
              </button>
              <button
                onClick={() => { updateStyle('listStyleType', listStyleType === 'decimal' ? 'none' : 'decimal'); togglePanel(null); }}
                className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${listStyleType === 'decimal' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}
              >
                <ListOrdered size="1.2vw" />
              </button>
              <button
                onClick={() => { updateStyle('listStyleType', 'none'); togglePanel(null); }}
                className={`w-[2.6vw] h-[2.6vw] rounded-[0.7vw] flex items-center justify-center transition-all ${listStyleType === 'none' ? 'bg-indigo-50/80 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'}`}
              >
                <Minus size="1.2vw" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Text Sizing Mode (Auto Width / Auto Height) */}
      <div className="flex flex-col gap-[1vw] pt-[1vw] mb-[1vw] border-t border-gray-100">
        <div className="flex items-center gap-[0.5vw] transition-opacity duration-200 opacity-100">
          <span className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap">Resize</span>
          <div className="flex gap-[0.35vw] p-[0.2vw] bg-gray-100 rounded-[0.6vw] flex-1">
            {/* Auto Width */}
            <button
              title="Auto Width — text grows horizontally on one line"
              onClick={() => applyTextSizingMode('auto-width')}
              className={`flex-1 h-[2vw] rounded-[0.45vw] flex items-center justify-center gap-[0.25vw] text-[0.7vw] font-medium transition-all duration-150 ${isScrollable ? 'opacity-40 pointer-events-none' : ''
                } ${sizingMode === 'auto-width'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <ArrowLeftRight size="0.9vw" className="flex-shrink-0" strokeWidth={2.5} />
              <span>Auto W</span>
            </button>
            {/* Auto Height */}
            <button
              title="Auto Height — width fixed, height grows with content"
              onClick={() => applyTextSizingMode('auto-height')}
              className={`flex-1 h-[2vw] rounded-[0.45vw] flex items-center justify-center gap-[0.25vw] text-[0.7vw] font-medium transition-all duration-150 ${isScrollable ? 'opacity-40 pointer-events-none' : ''
                } ${sizingMode === 'auto-height'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <ArrowUpDown size="0.9vw" className="flex-shrink-0" strokeWidth={2.5} />
              <span>Auto H</span>
            </button>
            {/* Fixed Size */}
            <button
              title="Fixed Size — width and height are fixed, text wraps and overflows or scrolls"
              onClick={() => applyTextSizingMode('fixed')}
              className={`flex-1 h-[2vw] rounded-[0.45vw] flex items-center justify-center gap-[0.25vw] text-[0.7vw] font-medium transition-all duration-150 ${sizingMode === 'fixed'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Maximize size="0.9vw" className="flex-shrink-0" strokeWidth={2.5} />
              <span>Fixed</span>
            </button>
          </div>
        </div>

        {/* Scrollable Toggle */}
        <div className={`flex items-center justify-between  ${sizingMode !== 'fixed' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
          <span className="text-[0.8vw] font-semibold text-gray-900">Scrollable Text Box Feature</span>
          <div className="flex-1 mx-[1vw] border-b border-dashed border-gray-300"></div>
          <button
            onClick={() => {
              const nextValue = !isScrollable;
              setIsScrollable(nextValue);
              if (selectedLayerId) {
                updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-scrollable', nextValue.toString());
              }
            }}
            className={`w-[2.3vw] h-[1.2vw] rounded-full p-[0.15vw] transition-colors duration-200 ${isScrollable ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <div className={`w-[0.9vw] h-[0.9vw] bg-white rounded-full transition-transform duration-200 ${isScrollable ? 'translate-x-[1.1vw]' : 'translate-x-0'}`}></div>
          </button>
        </div>

        {/* Grammar & Spell Check Feature */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.4vw]">
            <span className="text-[0.8vw] font-semibold text-gray-900">Grammar & Spell Check</span>
            <span className="text-[0.6vw] px-[0.35vw] py-[0.1vw] bg-indigo-50 text-indigo-600 rounded font-medium">Auto</span>
          </div>
          <div className="flex-1 mx-[1vw] border-b border-dashed border-gray-300"></div>
          <button
            onClick={() => {
              const target = selectedElement?.tagName?.toLowerCase() === 'foreignobject' ? selectedElement : selectedElement?.closest('foreignObject');
              const current = target?.getAttribute('data-grammar-check') !== 'false';
              const nextVal = !current;
              if (selectedLayerId) {
                updateElementAttributeLocal(activePageIndex, selectedLayerId, 'data-grammar-check', nextVal.toString());
              }
              if (target) {
                target.setAttribute('data-grammar-check', nextVal.toString());
              }
            }}
            className={`w-[2.3vw] h-[1.2vw] rounded-full p-[0.15vw] transition-colors duration-200 ${selectedElement?.getAttribute('data-grammar-check') !== 'false' ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <div className={`w-[0.9vw] h-[0.9vw] bg-white rounded-full transition-transform duration-200 ${selectedElement?.getAttribute('data-grammar-check') !== 'false' ? 'translate-x-[1.1vw]' : 'translate-x-0'}`}></div>
          </button>
        </div>
      </div>

      {/* Accordions */}
      <div className="flex flex-col gap-[0.4vw]">
        {/* Accordions from ShapeProperties */}
        <div className="shape-properties-container">
          <TextEditorSubComponentAdapter
            selectedElementProps={selectedElementProps || {
              fill: '#000000',
              opacity: '1',
              stroke: 'none',
              strokeWidth: '0',
              tagName: 'text'
            }}
            activePageIndex={activePageIndex}
            selectedLayerId={selectedLayerId}
            updateElementAttributeLocal={updateElementAttributeLocal}
            sizingMode={sizingMode}
            isScrollable={isScrollable}
          />
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
