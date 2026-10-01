import opentype from 'opentype.js';

// Cache for loaded opentype font instances
const fontCache = new Map();

/**
 * Resolves local font URL based on fontFamily, weight, and style.
 */
export const getFontUrl = (fontFamily, fontWeight = 'normal', fontStyle = 'normal') => {
  const normFamily = (fontFamily || '').replace(/['"]/g, '').trim().toLowerCase();
  const isBold = fontWeight === 'bold' || parseInt(fontWeight, 10) >= 600;
  const isItalic = fontStyle === 'italic' || fontStyle === 'oblique';

  if (normFamily.includes('poppins')) {
    if (isBold && isItalic) return '/lib/Fonts/Poppins/Poppins-BoldItalic.ttf';
    if (isBold) return '/lib/Fonts/Poppins/Poppins-Bold.ttf';
    if (isItalic) return '/lib/Fonts/Poppins/Poppins-Italic.ttf';
    return '/lib/Fonts/Poppins/Poppins-Regular.ttf';
  }
  if (normFamily.includes('open sans') || normFamily.includes('opensans')) {
    return '/lib/Fonts/Open_Sans/OpenSans-VariableFont_wdth,wght.ttf';
  }
  if (normFamily.includes('lato')) return '/lib/Fonts/Lato/Lato-Regular.ttf';
  if (normFamily.includes('oswald')) return '/lib/Fonts/Oswald/Oswald-VariableFont_wght.ttf';
  if (normFamily.includes('merriweather')) return '/lib/Fonts/Merriweather/Merriweather-VariableFont_opsz,wdth,wght.ttf';
  if (normFamily.includes('allura')) return '/lib/Fonts/Allura/Allura-Regular.ttf';
  if (normFamily.includes('parisienne')) return '/lib/Fonts/Parisienne/Parisienne-Regular.ttf';
  if (normFamily.includes('satisfy')) return '/lib/Fonts/Satisfy/Satisfy-Regular.ttf';
  if (normFamily.includes('public sans') || normFamily.includes('publicsans')) {
    if (isItalic) return '/lib/Fonts/Public_Sans/PublicSans-Italic-VariableFont_wght.ttf';
    return '/lib/Fonts/Public_Sans/PublicSans-VariableFont_wght.ttf';
  }
  if (normFamily.includes('lora')) {
    if (isItalic) return '/lib/Fonts/Lora/Lora-Italic-VariableFont_wght.ttf';
    return '/lib/Fonts/Lora/Lora-VariableFont_wght.ttf';
  }
  if (normFamily.includes('cabin')) {
    if (isItalic) return '/lib/Fonts/Cabin/Cabin-Italic-VariableFont_wdth,wght.ttf';
    return '/lib/Fonts/Cabin/Cabin-VariableFont_wdth,wght.ttf';
  }
  if (normFamily.includes('designer_signature') || normFamily.includes('designer signature')) {
    return '/lib/Fonts/designer_signature/Designer_Signature.otf';
  }
  // Default project font fallback
  return '/lib/Fonts/Poppins/Poppins-Regular.ttf';
};

/**
 * Loads an opentype font with caching.
 */
export const loadOpentypeFont = async (fontUrl) => {
  if (!fontUrl) return null;
  if (fontCache.has(fontUrl)) return fontCache.get(fontUrl);

  try {
    const fullUrl = fontUrl.startsWith('http') ? fontUrl : `${window.location.origin}${fontUrl}`;
    const font = await new Promise((resolve, reject) => {
      opentype.load(fullUrl, (err, f) => {
        if (err) reject(err);
        else resolve(f);
      });
    });
    fontCache.set(fontUrl, font);
    return font;
  } catch (e) {
    console.warn(`[vectorTextConverter] Could not load font from ${fontUrl}:`, e.message);
    return null;
  }
};

/**
 * Converts text into a pure SVG <path> vector bezier outline.
 */
export const textToVectorPath = (font, text, x, y, fontSize, options = {}) => {
  if (!font || !text) return '';
  const path = font.getPath(text, x, y, fontSize, options);
  return path.toPathData(2);
};

/**
 * Pre-processes an SVG string:
 * 1. Finds all <foreignObject> elements containing text.
 * 2. Converts them to pure vector <path> bezier curves (using opentype.js if font matches)
 *    or clean native SVG <text> elements (so Inkscape --export-text-to-path can outline them).
 * 3. Removes editor-only attributes and elements.
 *
 * @param {string} svgString
 * @returns {Promise<string>}
 */
/**
 * Flattens all nested <svg> elements inside an SVG document into standard <g transform="..."> elements.
 * Prevents Inkscape CLI / Cairo from dropping parent transforms on nested <svg> viewports
 * (which causes nested icons/hotspots to jump to top-left (0,0) and scale up).
 */
export const flattenNestedSvgs = (doc) => {
  const rootSvg = doc.querySelector('svg');
  if (!rootSvg) return;

  const allSvgs = Array.from(doc.querySelectorAll('svg'));
  const nestedSvgs = allSvgs.filter((el) => el !== rootSvg);

  // Process from deepest to shallowest
  for (let i = nestedSvgs.length - 1; i >= 0; i--) {
    const subSvg = nestedSvgs[i];
    if (!subSvg.parentNode) continue;

    const x = parseFloat(subSvg.getAttribute('x') || '0');
    const y = parseFloat(subSvg.getAttribute('y') || '0');
    const w = parseFloat(subSvg.getAttribute('width') || '0');
    const h = parseFloat(subSvg.getAttribute('height') || '0');
    const vb = subSvg.getAttribute('viewBox') || subSvg.getAttribute('viewbox');
    const fill = subSvg.getAttribute('fill');
    const stroke = subSvg.getAttribute('stroke');
    const transform = subSvg.getAttribute('transform') || '';
    const style = subSvg.getAttribute('style') || '';
    const id = subSvg.getAttribute('id') || '';

    let transX = x;
    let transY = y;
    let scaleX = 1;
    let scaleY = 1;

    if (vb) {
      const parts = vb.trim().split(/[\s,]+/).map(parseFloat);
      if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
        const [minX, minY, vbW, vbH] = parts;
        const targetW = w > 0 ? w : vbW;
        const targetH = h > 0 ? h : vbH;
        const scale = Math.min(targetW / vbW, targetH / vbH);
        const dx = (targetW - vbW * scale) / 2;
        const dy = (targetH - vbH * scale) / 2;
        transX = x + dx - minX * scale;
        transY = y + dy - minY * scale;
        scaleX = scale;
        scaleY = scale;
      }
    }

    const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    if (id) g.setAttribute('id', id);
    if (fill && fill !== 'none') g.setAttribute('fill', fill);
    if (stroke && stroke !== 'none') g.setAttribute('stroke', stroke);
    if (style) g.setAttribute('style', style);

    let transStr = '';
    if (Math.abs(transX) > 0.0001 || Math.abs(transY) > 0.0001 || Math.abs(scaleX - 1) > 0.0001 || Math.abs(scaleY - 1) > 0.0001) {
      transStr = `translate(${transX.toFixed(4)}, ${transY.toFixed(4)}) scale(${scaleX.toFixed(6)}, ${scaleY.toFixed(6)})`;
    }
    if (transform) {
      transStr = transStr ? `${transStr} ${transform}` : transform;
    }
    if (transStr) {
      g.setAttribute('transform', transStr);
    }

    const children = Array.from(subSvg.childNodes);
    for (const child of children) {
      g.appendChild(child);
    }

    subSvg.replaceWith(g);
  }
};

/**
 * Inlines any <image href="data:image/svg+xml;base64,..."> elements into pure vector <g> elements.
 * This prevents Inkscape / Cairo from rasterizing embedded vector icons or dropping parent transforms.
 */
export const inlineSvgImageElements = (doc) => {
  const images = Array.from(doc.querySelectorAll('image'));
  for (const img of images) {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
    if (!href.startsWith('data:image/svg+xml')) continue;

    try {
      let svgText = '';
      if (href.includes(';base64,')) {
        const base64 = href.split(';base64,')[1];
        svgText = atob(base64);
      } else {
        svgText = decodeURIComponent(href.split(',')[1]);
      }

      const parser = new DOMParser();
      const innerDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const innerSvg = innerDoc.querySelector('svg');
      if (!innerSvg) continue;

      const x = parseFloat(img.getAttribute('x') || '0');
      const y = parseFloat(img.getAttribute('y') || '0');
      const w = parseFloat(img.getAttribute('width') || '0');
      const h = parseFloat(img.getAttribute('height') || '0');
      const transform = img.getAttribute('transform') || '';
      const id = img.getAttribute('id') || '';

      const vb = innerSvg.getAttribute('viewBox') || innerSvg.getAttribute('viewbox');
      const innerW = parseFloat(innerSvg.getAttribute('width') || '0') || w || 48;
      const innerH = parseFloat(innerSvg.getAttribute('height') || '0') || h || 48;

      let vbW = innerW;
      let vbH = innerH;
      let minX = 0;
      let minY = 0;

      if (vb) {
        const parts = vb.trim().split(/[\s,]+/).map(parseFloat);
        if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
          minX = parts[0];
          minY = parts[1];
          vbW = parts[2];
          vbH = parts[3];
        }
      }

      const targetW = w > 0 ? w : vbW;
      const targetH = h > 0 ? h : vbH;
      const scale = Math.min(targetW / vbW, targetH / vbH);
      const dx = (targetW - vbW * scale) / 2;
      const dy = (targetH - vbH * scale) / 2;
      const transX = x + dx - minX * scale;
      const transY = y + dy - minY * scale;

      const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (id) g.setAttribute('id', id);
      g.setAttribute('data-inlined-vector', 'true');

      let transStr = `translate(${transX.toFixed(4)}, ${transY.toFixed(4)}) scale(${scale.toFixed(6)}, ${scale.toFixed(6)})`;
      if (transform) {
        transStr = `${transStr} ${transform}`;
      }
      g.setAttribute('transform', transStr);

      const children = Array.from(innerSvg.childNodes);
      for (const child of children) {
        g.appendChild(doc.importNode(child, true));
      }

      img.replaceWith(g);
    } catch (err) {
      console.warn('Failed to convert SVG image element to vector group:', err);
    }
  }
};

/**
 * Pre-processes an SVG string:
 * 1. Finds all <foreignObject> elements containing text and outlines them.
 * 2. Inlines any SVG image data-urls into pure vector <g> elements.
 * 3. Flattens nested <svg> elements into <g transform="..."> elements.
 *
 * @param {string} svgString
 * @returns {Promise<string>}
 */
export const convertSvgTextToOutlines = async (svgString) => {
  if (!svgString || typeof svgString !== 'string') return svgString;

  const hasForeignObject = svgString.includes('<foreignObject') || svgString.includes('<foreignobject');
  const hasNestedSvg = (svgString.match(/<svg\b/gi) || []).length > 1;
  const hasSvgImage = svgString.includes('data:image/svg+xml');

  // Quick check: if SVG doesn't have foreignObject, nested SVG, or SVG image, return as-is
  if (!hasForeignObject && !hasNestedSvg && !hasSvgImage) {
    return svgString;
  }

  // Pre-clean XML entities and void tags so DOMParser does not produce a fatal parsererror
  let cleanSvg = svgString.replace(/&nbsp;/gi, '&#160;');
  cleanSvg = cleanSvg.replace(/&(?!(?:[a-zA-Z]+|#\d+|#[xX][0-9a-fA-F]+);)/g, '&amp;');
  cleanSvg = cleanSvg.replace(/<br(?!\s*\/)([^>]*)>/gi, '<br$1/>');
  cleanSvg = cleanSvg.replace(/<hr(?!\s*\/)([^>]*)>/gi, '<hr$1/>');
  cleanSvg = cleanSvg.replace(/<img(?!\s*\/)([^>]*)>/gi, '<img$1/>');
  cleanSvg = cleanSvg.replace(/<input(?!\s*\/)([^>]*)>/gi, '<input$1/>');
  cleanSvg = cleanSvg.replace(/<meta(?!\s*\/)([^>]*)>/gi, '<meta$1/>');
  cleanSvg = cleanSvg.replace(/<link(?!\s*\/)([^>]*)>/gi, '<link$1/>');

  const parser = new DOMParser();
  let doc = parser.parseFromString(cleanSvg, 'image/svg+xml');
  let svgEl = doc.documentElement;

  if (!svgEl || svgEl.tagName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) {
    doc.querySelectorAll('parsererror').forEach((pe) => pe.remove());
    const innerSvg = doc.querySelector('svg');
    if (innerSvg && !innerSvg.querySelector('parsererror')) {
      svgEl = innerSvg;
    } else {
      const htmlDoc = parser.parseFromString(cleanSvg, 'text/html');
      svgEl = htmlDoc.querySelector('svg');
      if (!svgEl) return svgString;
      doc = htmlDoc;
    }
  }

  const serializeSvg = (el) => {
    if (!el.getAttribute('xmlns')) {
      el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    const serializer = new XMLSerializer();
    let str = serializer.serializeToString(el);
    const startIdx = str.indexOf('<svg');
    const endIdx = str.lastIndexOf('</svg>');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      str = str.substring(startIdx, endIdx + 6);
    }
    // CRITICAL: Restore camelCase SVG attributes that the browser HTML parser lowercases!
    str = str.replace(/\bviewbox\s*=/gi, 'viewBox=');
    str = str.replace(/\bpreserveaspectratio\s*=/gi, 'preserveAspectRatio=');
    str = str.replace(/\bclippathunits\s*=/gi, 'clipPathUnits=');
    str = str.replace(/\bgradientunits\s*=/gi, 'gradientUnits=');
    str = str.replace(/\bpatternunits\s*=/gi, 'patternUnits=');
    str = str.replace(/\bpatterncontentunits\s*=/gi, 'patternContentUnits=');
    str = str.replace(/\btextlength\s*=/gi, 'textLength=');
    str = str.replace(/\blengthadjust\s*=/gi, 'lengthAdjust=');
    return str;
  };

  // 1. Inlines any embedded SVG data-url images into vector <g> elements
  inlineSvgImageElements(doc);

  // 2. Flattens any nested <svg> elements into standard <g transform="..."> elements
  flattenNestedSvgs(doc);

  const foreignObjects = Array.from(svgEl.querySelectorAll('foreignObject, foreignobject'));
  if (foreignObjects.length === 0) {
    return serializeSvg(svgEl);
  }

  // Pre-load necessary fonts for all foreignObjects
  const fontLoadPromises = foreignObjects.map(async (fo) => {
    const innerDiv = fo.querySelector('div') || fo.firstElementChild;
    const fontFamily = innerDiv?.style?.fontFamily || fo.getAttribute('font-family') || 'Poppins';
    const fontWeight = innerDiv?.style?.fontWeight || fo.getAttribute('font-weight') || 'normal';
    const fontStyle = innerDiv?.style?.fontStyle || fo.getAttribute('font-style') || 'normal';
    const fontUrl = getFontUrl(fontFamily, fontWeight, fontStyle);
    if (fontUrl) {
      await loadOpentypeFont(fontUrl);
    }
  });

  await Promise.all(fontLoadPromises);

  // Process each foreignObject
  for (const fo of foreignObjects) {
    const x = parseFloat(fo.getAttribute('x') || '0');
    const y = parseFloat(fo.getAttribute('y') || '0');
    const w = parseFloat(fo.getAttribute('width') || '100');
    const h = parseFloat(fo.getAttribute('height') || '50');
    const transform = fo.getAttribute('transform') || '';
    const foId = fo.getAttribute('id') || '';

    const innerDiv = fo.querySelector('div') || fo.firstElementChild;
    if (!innerDiv) continue;

    // Extract text and styles
    const fontFamily = innerDiv.style.fontFamily || fo.getAttribute('font-family') || 'Poppins';
    const fontSize = parseFloat(innerDiv.style.fontSize || fo.getAttribute('font-size') || '16');
    const fontWeight = innerDiv.style.fontWeight || fo.getAttribute('font-weight') || 'normal';
    const fontStyle = innerDiv.style.fontStyle || fo.getAttribute('font-style') || 'normal';
    const rawFill = innerDiv.style.color || fo.getAttribute('fill') || '#000000';
    const fill = (rawFill === 'transparent' || rawFill === 'rgba(0, 0, 0, 0)') ? 'none' : rawFill;
    const rawTextAlign = innerDiv.style.textAlign || fo.getAttribute('text-anchor') || 'left';
    const textAlign = rawTextAlign === 'middle' ? 'center' : (rawTextAlign === 'end' ? 'right' : rawTextAlign);
    const lineHeightRatio = parseFloat(innerDiv.style.lineHeight || fo.getAttribute('data-line-height') || '1.2') || 1.2;

    // Extract text lines
    // Replace <br> tags with newline markers
    const clone = innerDiv.cloneNode(true);
    clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    clone.querySelectorAll('p, div').forEach((p) => {
      p.prepend(doc.createTextNode('\n'));
    });
    const rawText = clone.textContent || '';
    const rawLines = rawText.split('\n').map((l) => l.replace(/\r/g, ''));
    
    // Filter out leading/trailing empty lines while keeping intentional inner blank lines
    let firstNonEmpty = 0;
    while (firstNonEmpty < rawLines.length && rawLines[firstNonEmpty].trim() === '') firstNonEmpty++;
    let lastNonEmpty = rawLines.length - 1;
    while (lastNonEmpty >= 0 && rawLines[lastNonEmpty].trim() === '') lastNonEmpty--;

    const lines = (firstNonEmpty <= lastNonEmpty) ? rawLines.slice(firstNonEmpty, lastNonEmpty + 1) : [''];

    // Check if we have an opentype font loaded
    const fontUrl = getFontUrl(fontFamily, fontWeight, fontStyle);
    const font = fontCache.get(fontUrl);

    if (font) {
      // ── Method A: True Vector Outlines via opentype.js ───────────────────
      // Converts all text glyphs into pure <path d="..." fill="..." /> bezier curves.
      // Zero font dependency in Adobe Illustrator!
      const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (foId) g.setAttribute('id', foId);
      if (transform) g.setAttribute('transform', transform);
      g.setAttribute('data-type', 'vector-text');

      const ascenderRatio = (font.ascender && font.unitsPerEm) ? (font.ascender / font.unitsPerEm) : 0.82;
      const lineStep = fontSize * lineHeightRatio;

      let combinedPathData = '';

      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        if (!lineText || !lineText.trim()) continue;

        const baselineY = y + (ascenderRatio * fontSize) + (i * lineStep);
        let lineX = x;

        if (textAlign === 'center') {
          const textW = font.getAdvanceWidth(lineText, fontSize);
          lineX = x + Math.max(0, (w - textW) / 2);
        } else if (textAlign === 'right') {
          const textW = font.getAdvanceWidth(lineText, fontSize);
          lineX = x + Math.max(0, w - textW);
        }

        const pathData = font.getPath(lineText, lineX, baselineY, fontSize).toPathData(2);
        if (pathData) {
          combinedPathData += (combinedPathData ? ' ' : '') + pathData;
        }
      }

      if (combinedPathData) {
        const pathEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', combinedPathData);
        pathEl.setAttribute('fill', fill);
        g.appendChild(pathEl);
        fo.replaceWith(g);
      } else {
        fo.remove();
      }
    } else {
      // ── Method B: Native SVG <text> fallback for Inkscape --export-text-to-path ──
      const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (foId) g.setAttribute('id', foId);
      if (transform) g.setAttribute('transform', transform);

      const textEl = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      const textAnchor = textAlign === 'center' ? 'middle' : (textAlign === 'right' ? 'end' : 'start');
      const anchorX = textAlign === 'center' ? (x + w / 2) : (textAlign === 'right' ? (x + w) : x);
      const lineStep = fontSize * lineHeightRatio;
      const baselineOffset = fontSize * 0.85;

      textEl.setAttribute('x', anchorX.toFixed(2));
      textEl.setAttribute('y', (y + baselineOffset).toFixed(2));
      textEl.setAttribute('font-family', fontFamily);
      textEl.setAttribute('font-size', fontSize.toString());
      textEl.setAttribute('font-weight', fontWeight);
      textEl.setAttribute('font-style', fontStyle);
      textEl.setAttribute('fill', fill);
      textEl.setAttribute('text-anchor', textAnchor);

      lines.forEach((lineText, idx) => {
        const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', anchorX.toFixed(2));
        tspan.setAttribute('y', (y + baselineOffset + idx * lineStep).toFixed(2));
        tspan.textContent = lineText;
        textEl.appendChild(tspan);
      });

      g.appendChild(textEl);
      fo.replaceWith(g);
    }
  }

  return serializeSvg(svgEl);
};
