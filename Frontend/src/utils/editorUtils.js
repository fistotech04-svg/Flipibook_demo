// Utility functions for the template editor

export const getCleanHTML = (html) => {
  return html || '';
};


// Reset properties to default values
export const resetProperties = (setProperties) => {
  setProperties({
    fontSize: 16,
    fontFamily: "Arial",
    fontWeight: 400,
    color: "#000000",
    backgroundColor: "#ffffff",
    textAlign: "left",
    lineHeight: 1.5,
    letterSpacing: 0,
    textDecoration: "none",
    textTransform: "none",
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "#000000",
    borderStyle: "solid",
    boxShadow: "none",
    opacity: 1,
    width: 100,
    height: 50,
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 0,
    animation: "none",
    animationDuration: 0,
    animationDelay: 0,
    animationIterationCount: 1,
    animationDirection: "normal",
    animationFillMode: "none",
    animationTimingFunction: "ease",
    interaction: "none",
    link: "",
    tooltip: "",
    altText: "",
    src: "",
    videoSrc: "",
    autoplay: false,
    loop: false,
    muted: true,
    controls: true,
    poster: "",
  });
};

// Update properties from an object
export const updatePropertiesFromObject = (setProperties, obj) => {
  setProperties((prev) => ({ ...prev, ...obj }));
};

// Update a single property
export const updateProperty = (setProperties, key, value) => {
  setProperties((prev) => ({ ...prev, [key]: value }));
};

// History management functions
export const saveToHistory = (history, setHistory, currentState) => {
  setHistory([...history, currentState]);
};

export const undo = (history, setHistory, setCurrentState) => {
  if (history.length > 0) {
    const previousState = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrentState(previousState);
  }
};

export const redo = (redoStack, setRedoStack, setCurrentState) => {
  if (redoStack.length > 0) {
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setCurrentState(nextState);
  }
};

/**
 * Formats a raw SVG string from a template file into a valid Page SVG structure
 * matching TemplateEditor's expected format (viewBox, root frame <g>, Overlay rect, scoped IDs).
 */
export function formatTemplateSvgToPageSvg(svgContent, targetW = 210, targetH = 297, pageName = 'Page 1') {
  if (!svgContent || typeof svgContent !== 'string') return '';

  try {
    const parser = new DOMParser();

    // 0. Detect and dynamically load any new fonts used in the template
    try {
      const fontsToLoad = new Set();
      const cssRegex = /font-family\s*:\s*(?:['"]([^'"]+)['"]|([^;}'"\s]+))/g;
      let match;
      while ((match = cssRegex.exec(svgContent)) !== null) {
        let f = match[1] || match[2];
        f = f.split(',')[0].replace(/['"]/g, '').trim();
        if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
      }
      const attrRegex = /font-family\s*=\s*['"]([^'"]+)['"]/g;
      while ((match = attrRegex.exec(svgContent)) !== null) {
        let f = match[1].split(',')[0].replace(/['"]/g, '').trim();
        if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
      }

      fontsToLoad.forEach(font => {
        const fontId = `dynamic-font-${font.replace(/\s+/g, '-')}`;
        if (typeof document !== 'undefined' && !document.getElementById(fontId)) {
          const link = document.createElement('link');
          link.id = fontId;
          link.href = `https://fonts.googleapis.com/css?family=${font.replace(/\s+/g, '+')}:300,400,500,600,700,800,900&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      });
    } catch (fontErr) {
      console.warn('Dynamic font load notice:', fontErr);
    }

    const templateDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const templateSvg = templateDoc.querySelector('svg');
    if (!templateSvg) return '';

    // Calculate dimensions, viewBox, scaling
    let templateWidth = parseFloat(templateSvg.getAttribute('width'));
    let templateHeight = parseFloat(templateSvg.getAttribute('height'));
    const viewBoxStr = templateSvg.getAttribute('viewBox');
    let viewBoxX = 0;
    let viewBoxY = 0;

    if (viewBoxStr) {
      const parts = viewBoxStr.trim().split(/[ ,]+/).map(parseFloat);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        viewBoxX = parts[0];
        viewBoxY = parts[1];
        templateWidth = parts[2];
        templateHeight = parts[3];
      }
    }

    if (!templateWidth || isNaN(templateWidth)) templateWidth = targetW;
    if (!templateHeight || isNaN(templateHeight)) templateHeight = targetH;

    const scale = Math.min(targetW / templateWidth, targetH / templateHeight);
    const offsetX = (targetW - templateWidth * scale) / 2;
    const offsetY = (targetH - templateHeight * scale) / 2;

    // 1. Scope all IDs and classes in template to avoid collisions
    const tplPrefix = `tpl-${Math.random().toString(36).substr(2, 4)}`;
    const allTplElements = Array.from(templateSvg.querySelectorAll('*'));
    const idRefRegex = /url\(['"]?#([^)'"]+)['"]?\)/g;
    const XLINK_NS = 'http://www.w3.org/1999/xlink';

    const idMap = new Map();
    // Identify all elements with existing IDs and create sanitized prefixed IDs
    allTplElements.forEach(el => {
      const oldId = el.getAttribute('id');
      if (oldId && oldId.trim() !== '') {
        const trimmedOld = oldId.trim();
        const safeOld = trimmedOld.replace(/[^a-zA-Z0-9_-]/g, '_');
        const newId = `${tplPrefix}-${safeOld}`;
        idMap.set(trimmedOld, newId);
        idMap.set(safeOld, newId);
        el.setAttribute('id', newId);
        el.setAttribute('data-original-id', trimmedOld.replace(/&/g, 'and'));
      }
    });

    // Replace all url(#id) and href="#id" references
    allTplElements.forEach(el => {
      const classVal = el.getAttribute('class');
      if (classVal) {
        const prefixedClasses = classVal.split(/\s+/).map(c => c ? `${tplPrefix}-${c}` : c).join(' ');
        el.setAttribute('class', prefixedClasses);
      }

      const refAttrs = ['fill', 'stroke', 'filter', 'mask', 'clip-path', 'marker-start', 'marker-mid', 'marker-end'];
      refAttrs.forEach(attr => {
        const val = el.getAttribute(attr);
        if (val) {
          const newVal = val.replace(idRefRegex, (m, oldRef) => {
            const mapped = idMap.get(oldRef) || idMap.get(oldRef.replace(/[^a-zA-Z0-9_-]/g, '_'));
            return `url(#${mapped || `${tplPrefix}-${oldRef.replace(/[^a-zA-Z0-9_-]/g, '_')}`})`;
          });
          if (newVal !== val) el.setAttribute(attr, newVal);
        }
      });

      const styleText = el.getAttribute('style');
      if (styleText && styleText.includes('url(#')) {
        el.setAttribute('style', styleText.replace(idRefRegex, (m, oldRef) => {
          const mapped = idMap.get(oldRef) || idMap.get(oldRef.replace(/[^a-zA-Z0-9_-]/g, '_'));
          return `url(#${mapped || `${tplPrefix}-${oldRef.replace(/[^a-zA-Z0-9_-]/g, '_')}`})`;
        }));
      }

      // Handle href / xlink:href properly with namespaces
      const hrefVal = el.getAttributeNS(XLINK_NS, 'href') || el.getAttribute('href') || el.getAttribute('xlink:href');
      if (hrefVal && hrefVal.startsWith('#')) {
        const oldRef = hrefVal.substring(1);
        const mapped = idMap.get(oldRef) || idMap.get(oldRef.replace(/[^a-zA-Z0-9_-]/g, '_')) || `${tplPrefix}-${oldRef.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        const newRef = `#${mapped}`;
        el.setAttribute('href', newRef);
        el.setAttribute('xlink:href', newRef);
        try {
          el.setAttributeNS(XLINK_NS, 'xlink:href', newRef);
        } catch (nsErr) {}
      }
    });

    const tplStyles = templateSvg.querySelectorAll('style');
    tplStyles.forEach(style => {
      if (style.textContent) {
        let css = style.textContent.replace(idRefRegex, (m, oldRef) => {
          const mapped = idMap.get(oldRef) || idMap.get(oldRef.replace(/[^a-zA-Z0-9_-]/g, '_'));
          return `url(#${mapped || `${tplPrefix}-${oldRef.replace(/[^a-zA-Z0-9_-]/g, '_')}`})`;
        });
        css = css.replace(/\.([a-zA-Z0-9_-]+)(?=[^{}]*\{)/g, `.${tplPrefix}-$1`);
        style.textContent = css;
      }
    });

    // Create target Page SVG document
    const rootId = `g-${Math.random().toString(36).substr(2, 9)}`;
    const overlayId = `rect-${Math.random().toString(36).substr(2, 9)}`;
    const defaultHtml = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${targetW} ${targetH}" width="100%" height="100%" style="overflow: visible">
  <g id="${rootId}" data-name="${pageName}" data-type="frame">
    <rect id="${overlayId}" x="0" y="0" width="${targetW}" height="${targetH}" fill="#ffffff" data-name="Overlay" data-type="background" data-locked="true" shape-rendering="crispEdges" />
  </g>
</svg>`;

    const pageDoc = parser.parseFromString(defaultHtml, 'image/svg+xml');
    const pageSvg = pageDoc.querySelector('svg');
    const rootFolder = pageSvg.querySelector('g[data-type="frame"]') || pageSvg.querySelector('g');

    // 2. Resource tags (<defs>) extraction and merging
    let targetDefs = pageSvg.querySelector('defs');
    if (!targetDefs) {
      targetDefs = pageDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
      pageSvg.insertBefore(targetDefs, pageSvg.firstChild);
    }

    const addedDefIds = new Set();
    const importToTargetDefs = (node) => {
      const id = node.getAttribute('id');
      if (id && addedDefIds.has(id)) return;
      if (id) addedDefIds.add(id);
      targetDefs.appendChild(pageDoc.importNode(node, true));
    };

    // A. Import all children of existing <defs> in template
    const templateDefsList = templateSvg.querySelectorAll('defs');
    templateDefsList.forEach(tDefs => {
      Array.from(tDefs.children).forEach(child => {
        importToTargetDefs(child);
      });
      tDefs.parentNode?.removeChild(tDefs);
    });

    // B. Import any resource tags defined outside of <defs>
    const RESOURCE_SELECTORS = [
      'mask', 'clipPath', 'clippath', 'linearGradient', 'lineargradient',
      'radialGradient', 'radialgradient', 'pattern', 'filter', 'symbol', 'marker'
    ];
    templateSvg.querySelectorAll(RESOURCE_SELECTORS.join(',')).forEach(res => {
      if (res.parentNode) {
        importToTargetDefs(res);
        res.parentNode.removeChild(res);
      }
    });

    // C. Import styles
    if (tplStyles.length > 0) {
      let targetStyle = pageSvg.querySelector('style');
      if (!targetStyle) {
        targetStyle = pageDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
        pageSvg.insertBefore(targetStyle, pageSvg.firstChild);
      }
      tplStyles.forEach(s => {
        targetStyle.textContent += (s.textContent || '') + '\n';
        s.parentNode?.removeChild(s);
      });
    }

    // 3. Clean up empty groups
    Array.from(templateSvg.querySelectorAll('g')).forEach(g => {
      if (g.children.length === 0 && !g.textContent?.trim()) {
        g.parentNode?.removeChild(g);
      }
    });

    // 4. Handle outermost dummy artboard/parent groups
    // Templates exported from Figma/Illustrator wrap the entire artboard in a parent <g> (e.g. <g id="2 - Table of content" clip-path="...">)
    // We unwrap these top-level container groups so all child elements are placed directly in the Root Page Folder.
    const unwrapOuterGroup = (group) => {
      // 1. Inherit visual styling attributes to children so elements preserve their appearance
      const attrsToInherit = [
        'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
        'opacity', 'visibility', 'filter', 'color', 'clip-path', 'mask',
        'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'letter-spacing', 'word-spacing'
      ];
      attrsToInherit.forEach(attr => {
        const val = group.getAttribute(attr);
        if (val) {
          Array.from(group.children).forEach(child => {
            if (!child.hasAttribute(attr)) child.setAttribute(attr, val);
          });
        }
      });

      // 2. Inherit styles
      const groupStyle = group.getAttribute('style');
      if (groupStyle) {
        Array.from(group.children).forEach(child => {
          const childStyle = child.getAttribute('style');
          child.setAttribute('style', childStyle ? `${groupStyle}; ${childStyle}` : groupStyle);
        });
      }

      // 3. Inherit CSS classes
      const groupClass = group.getAttribute('class');
      if (groupClass) {
        Array.from(group.children).forEach(child => {
          const childClass = child.getAttribute('class');
          child.setAttribute('class', childClass ? `${groupClass} ${childClass}` : groupClass);
        });
      }

      // 4. Inherit transforms (accumulate parent transform before child transform)
      const groupTransform = group.getAttribute('transform') || '';
      if (groupTransform) {
        Array.from(group.children).forEach(child => {
          const childTransform = child.getAttribute('transform') || '';
          child.setAttribute('transform', `${groupTransform} ${childTransform}`.trim());
        });
      }

      // 5. Move all children out before the group, then remove the group
      const children = Array.from(group.children);
      children.forEach(c => group.parentNode.insertBefore(c, group));
      group.parentNode.removeChild(group);
    };

    const getDirectContentChildren = () => Array.from(templateSvg.children).filter(c =>
      !['defs', 'metadata', 'style', 'title', 'desc'].includes(c.tagName.toLowerCase())
    );

    // Repeatedly unwrap wrapper groups as long as all page content is wrapped in a container
    let directContent = getDirectContentChildren();
    let unwrapped = true;
    while (unwrapped) {
      unwrapped = false;
      directContent = getDirectContentChildren();

      // Case A: Exactly 1 child, and it is a <g> (single wrapper artboard group)
      if (directContent.length === 1 && directContent[0].tagName.toLowerCase() === 'g') {
        unwrapOuterGroup(directContent[0]);
        unwrapped = true;
        continue;
      }

      // Case B: Exactly 2 children: one is an artboard background <rect> and the other is a wrapper <g>
      if (directContent.length === 2) {
        const groupEl = directContent.find(c => c.tagName.toLowerCase() === 'g');
        const rectEl = directContent.find(c => c.tagName.toLowerCase() === 'rect');
        if (groupEl && rectEl) {
          const rW = parseFloat(rectEl.getAttribute('width')) || 0;
          const rH = parseFloat(rectEl.getAttribute('height')) || 0;
          if ((rW === 0 || rW >= templateWidth * 0.8) && (rH === 0 || rH >= templateHeight * 0.8)) {
            unwrapOuterGroup(groupEl);
            unwrapped = true;
            continue;
          }
        }
      }
    }

    // 5. Gather page infant elements
    let infants = Array.from(templateSvg.children).filter(child =>
      !['defs', 'metadata', 'style', 'title', 'desc'].includes(child.tagName.toLowerCase())
    );

    const targetParent = rootFolder || pageSvg;
    const overlayChild = Array.from(targetParent.children).find(el => el.getAttribute('data-name') === 'Overlay');

    // 6. Background rectangle detection
    if (infants.length > 0 && infants[0].tagName.toLowerCase() === 'rect') {
      const firstRect = infants[0];
      const rW = parseFloat(firstRect.getAttribute('width')) || 0;
      const rH = parseFloat(firstRect.getAttribute('height')) || 0;
      const rX = parseFloat(firstRect.getAttribute('x')) || 0;
      const rY = parseFloat(firstRect.getAttribute('y')) || 0;

      const isFullBg = (rX === 0 || isNaN(rX)) && (rY === 0 || isNaN(rY)) &&
        (rW >= templateWidth * 0.9) && (rH >= templateHeight * 0.9);

      if (isFullBg) {
        const bgFill = firstRect.getAttribute('fill') || '';
        // Only transfer if solid color (patterns and gradients are kept as elements so their coordinates scale properly)
        if (overlayChild && bgFill && !bgFill.startsWith('url(#') && bgFill !== 'none') {
          overlayChild.setAttribute('fill', bgFill);
          const bgOpacity = firstRect.getAttribute('fill-opacity') || firstRect.getAttribute('opacity');
          if (bgOpacity) overlayChild.setAttribute('fill-opacity', bgOpacity);
          firstRect.parentNode?.removeChild(firstRect);
          infants = infants.slice(1);
        }
      }
    }

    // 7. Assign IDs and semantic data-type / data-name recursively
    let elemCounter = 1;
    const assignMetadata = (node) => {
      const tag = node.tagName.toLowerCase();

      // Ensure every element has a unique ID
      if (!node.id || node.id.trim() === '') {
        node.id = `${tag}-${tplPrefix}-${elemCounter++}`;
      }

      const origId = node.getAttribute('data-original-id') || '';
      const cleanOrigName = origId ? origId.replace(/^tpl-[a-z0-9]+-/, '').replace(/_/g, ' ') : '';

      if (tag === 'text') {
        node.setAttribute('data-type', 'text');
        const textStr = (node.textContent || '').trim().replace(/\s+/g, ' ');
        node.setAttribute('data-name', cleanOrigName || (textStr ? `Text - ${textStr.slice(0, 24)}` : 'Text'));
      } else if (tag === 'image') {
        node.setAttribute('data-type', 'image');
        node.setAttribute('data-name', cleanOrigName || 'Image');
      } else if (tag === 'rect') {
        const fill = node.getAttribute('fill') || '';
        if (fill.startsWith('url(#')) {
          node.setAttribute('data-type', 'image');
          node.setAttribute('data-name', cleanOrigName || 'Image');
        } else {
          node.setAttribute('data-type', 'shape');
          node.setAttribute('data-name', cleanOrigName || 'Rectangle');
        }
      } else if (tag === 'circle') {
        node.setAttribute('data-type', 'shape');
        node.setAttribute('data-name', cleanOrigName || 'Circle');
      } else if (tag === 'ellipse') {
        node.setAttribute('data-type', 'shape');
        node.setAttribute('data-name', cleanOrigName || 'Ellipse');
      } else if (tag === 'line') {
        node.setAttribute('data-type', 'shape');
        node.setAttribute('data-name', cleanOrigName || 'Line');
      } else if (tag === 'path') {
        const fill = node.getAttribute('fill') || '';
        if (fill.startsWith('url(#')) {
          node.setAttribute('data-type', 'image');
          node.setAttribute('data-name', cleanOrigName || 'Image');
        } else {
          node.setAttribute('data-type', 'shape');
          node.setAttribute('data-name', cleanOrigName || 'Shape');
        }
      } else if (tag === 'polygon' || tag === 'polyline') {
        node.setAttribute('data-type', 'shape');
        node.setAttribute('data-name', cleanOrigName || 'Polygon');
      } else if (tag === 'g') {
        node.setAttribute('data-type', 'group');
        node.setAttribute('data-name', cleanOrigName || 'Group');
        Array.from(node.children).forEach(child => assignMetadata(child));
      }
    };

    infants.forEach(child => assignMetadata(child));

    // 8. Apply fitting transform and append to page frame
    const svgAttrs = [
      'fill', 'stroke', 'stroke-width', 'opacity', 'visibility', 'filter', 'color',
      'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'letter-spacing', 'word-spacing'
    ];

    const fittingTransform = `translate(${offsetX}, ${offsetY}) scale(${scale}) translate(${-viewBoxX}, ${-viewBoxY})`;

    infants.forEach(child => {
      const imported = pageDoc.importNode(child, true);
      svgAttrs.forEach(attr => {
        const val = templateSvg.getAttribute(attr);
        if (val && !imported.hasAttribute(attr)) imported.setAttribute(attr, val);
      });
      const svgStyle = templateSvg.getAttribute('style');
      if (svgStyle) {
        const importedStyle = imported.getAttribute('style');
        imported.setAttribute('style', importedStyle ? `${svgStyle}; ${importedStyle}` : svgStyle);
      }
      const svgClass = templateSvg.getAttribute('class');
      if (svgClass) {
        const importedClass = imported.getAttribute('class');
        imported.setAttribute('class', importedClass ? `${svgClass} ${importedClass}` : svgClass);
      }

      const currentTransform = imported.getAttribute('transform') || '';
      imported.setAttribute('transform', `${fittingTransform} ${currentTransform}`.trim());

      targetParent.appendChild(imported);
    });

    let serialized = new XMLSerializer().serializeToString(pageSvg);
    serialized = serialized.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
    return serialized;
  } catch (err) {
    console.error('Error formatting template SVG to page SVG:', err);
    return '';
  }
}