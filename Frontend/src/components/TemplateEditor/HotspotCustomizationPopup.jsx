import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import ColorPicker, { parseGradient } from './ColorPicker';
import { presets as hotspotPresets } from './HotspotPresetPopup';

const ALL_ICON_ASSETS = import.meta.glob('../../assets/hotspot preset icon/**/*.svg', { as: 'url', eager: true });
const BUTTON_ICON_ASSETS = import.meta.glob('../../assets/hotspot preset icon/interactive_button/*.png', { as: 'url', eager: true });

const getCategoryKeywords = (actionId) => {
  const map = {
    'zoom': ['zoom'],
    'download': ['download'],
    'info': ['info'],
    'audio': ['audio']
  };
  return map[actionId] || [];
};

const getIconsForAction = (actionId) => {
  if (!actionId) return [];
  
  const folderMap = {
    'whatsapp': 'whatsapp',
    'open-link': 'open_link',
    'video': 'video',
    'instagram': 'instagram',
    'facebook': 'facebook',
    'linkedin': 'linkedin',
    'x': 'x',
    'youtube': 'youtube',
    'popup': 'popup',
    'slideshow': 'slideshow',
    '3d-viewer': '3d viewer',
    'email': 'email',
    'call': 'call',
    'location': 'location',
    'navigate-to': 'navigation page',
    'zoom': 'zoom',
    'info': 'info',
    'info-box': 'info',
    'download': 'download',
    'audio': 'audio'
  };

  const folder = folderMap[actionId];
  const matched = [];
  
  if (folder) {
    const prefix = `../../assets/hotspot preset icon/${folder}/`.toLowerCase();
    for (const [path, url] of Object.entries(ALL_ICON_ASSETS)) {
      if (path.toLowerCase().startsWith(prefix)) {
        matched.push({ id: path, src: url });
      }
    }
  } else {
    const keywords = getCategoryKeywords(actionId);
    if (keywords.length > 0) {
      for (const [path, url] of Object.entries(ALL_ICON_ASSETS)) {
        const lowerPath = path.toLowerCase();
        if (keywords.some(kw => lowerPath.includes(kw))) {
          matched.push({ id: path, src: url });
        }
      }
    }
  }
  
  return matched;
};

const generateSvgGradient = (colorStr, idPrefix) => {
  if (!colorStr || typeof colorStr !== 'string' || !colorStr.includes('gradient')) {
    return { fillValue: colorStr, defsString: '' };
  }
  const parsed = parseGradient(colorStr);
  if (!parsed || !parsed.stops || parsed.stops.length === 0) {
    return { fillValue: colorStr, defsString: '' };
  }
  const id = `${idPrefix}-${Math.random().toString(36).substr(2, 9)}`;
  let defsString = `<defs>`;
  if (parsed.type === 'Linear') {
    const angle = ((parsed.angle || 0) - 90) * (Math.PI / 180);
    const x1 = Math.round(50 + Math.cos(angle) * 50) + '%';
    const y1 = Math.round(50 + Math.sin(angle) * 50) + '%';
    const x2 = Math.round(50 - Math.cos(angle) * 50) + '%';
    const y2 = Math.round(50 - Math.sin(angle) * 50) + '%';
    defsString += `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">`;
    parsed.stops.forEach(stop => {
      defsString += `<stop offset="${stop.offset}%" stop-color="${stop.color}" stop-opacity="${stop.opacity / 100}" />`;
    });
    defsString += `</linearGradient>`;
  } else {
    defsString += `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">`;
    parsed.stops.forEach(stop => {
      defsString += `<stop offset="${stop.offset}%" stop-color="${stop.color}" stop-opacity="${stop.opacity / 100}" />`;
    });
    defsString += `</radialGradient>`;
  }
  defsString += `</defs>`;
  return { fillValue: `url(#${id})`, defsString };
};

const PRESETS = [
  { id: 'preset1', type: 'solid-circle' },
  { id: 'preset2', type: 'dashed-circle' },
  { id: 'preset3', type: 'double-circle' },
  { id: 'preset4', type: 'dotted-circle' },
  { id: 'preset5', type: 'thick-circle' },
  { id: 'preset6', type: 'thin-circle' },
];

export const generateHotspotSVG = (preset, bgColor, iconColor, src, inlinedSvgInfo = null, idSuffix = '') => {
  const bgInfo = generateSvgGradient(bgColor, 'bg');
  const bgFill = bgInfo.fillValue;
  const fgInfo = generateSvgGradient(iconColor, 'fg');
  const fgFill = fgInfo.fillValue;
  let backgroundHTML = bgInfo.defsString + fgInfo.defsString;

  // Add invisible rect to stabilize SVG bounds and prevent jittering during resize
  backgroundHTML += `<rect x="0" y="0" width="48" height="48" fill="none" pointer-events="none" />`;
  
  if (preset === 'preset1') {
    // No extra rings, just the rich icon itself
  } else if (preset === 'preset2') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="24" fill="${bgFill}" opacity="0.3">
        <animate attributeName="r" values="20; 24; 20" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5; 0.1; 0.5" dur="2s" repeatCount="indefinite" />
      </circle>`;
  } else if (preset === 'preset3') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="22" fill="none" stroke="${bgFill}" stroke-width="2" stroke-dasharray="6 6">
        <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="8s" repeatCount="indefinite" />
      </circle>`;
  } else if (preset === 'preset4') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="22" fill="none" stroke="${bgFill}" stroke-width="2" stroke-dasharray="4 4">
        <animate attributeName="opacity" values="1; 0.3; 1" dur="2s" repeatCount="indefinite" />
      </circle>`;
  } else if (preset === 'preset5') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="22" fill="none" stroke="${bgFill}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="0 6">
        <animate attributeName="r" values="20; 24; 20" dur="2s" repeatCount="indefinite" />
      </circle>`;
  } else if (preset === 'preset6') {
    const filterId = idSuffix ? `hotspot-glow-${idSuffix}` : `hotspot-glow-${Math.random().toString(36).substr(2, 6)}`;
    backgroundHTML += `
      <defs>
        <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
        </filter>
      </defs>
      <circle cx="24" cy="24" r="20" fill="none" stroke="${bgFill}" stroke-width="4" filter="url(#${filterId})">
        <animate attributeName="opacity" values="1; 0; 1" dur="1.5s" repeatCount="indefinite" />
      </circle>`;
  }

  // Draw the original image or the recolored inline SVG
  if (inlinedSvgInfo) {
    let innerSvgAttrs = `x="4" y="4" width="40" height="40"`; // Scaled down to create a comfortable gap from outer preset circles
    let extraBg = '';
    let fillAttr = '';
    let strokeAttr = '';
    let extraSvgAttrs = '';
    
    if (inlinedSvgInfo.strokeWidth) extraSvgAttrs += ` stroke-width="${inlinedSvgInfo.strokeWidth}"`;
    if (inlinedSvgInfo.strokeLinecap) extraSvgAttrs += ` stroke-linecap="${inlinedSvgInfo.strokeLinecap}"`;
    if (inlinedSvgInfo.strokeLinejoin) extraSvgAttrs += ` stroke-linejoin="${inlinedSvgInfo.strokeLinejoin}"`;

    if (inlinedSvgInfo.isRawIcon) {
      // Scale down raw icon background circle to match non-raw icon size perfectly
      extraBg = `<circle cx="24" cy="24" r="16" fill="${bgFill}" />`;
      innerSvgAttrs = `x="14" y="14" width="20" height="20"`;
      
      const origFill = inlinedSvgInfo.svgTagFill;
      const origStroke = inlinedSvgInfo.svgTagStroke;
      const isStrokeBased = inlinedSvgInfo.isStrokeBased || 
        (origFill && origFill.toLowerCase() === 'none') || 
        (origStroke && origStroke.toLowerCase() !== 'none');
      
      if (isStrokeBased) {
        strokeAttr = `stroke="${fgFill}"`;
        fillAttr = (origFill && origFill.toLowerCase() !== 'none') ? `fill="${fgFill}"` : 'fill="none"';
      } else {
        fillAttr = (origFill && origFill.toLowerCase() === 'none') ? 'fill="none"' : `fill="${fgFill}"`;
        strokeAttr = (origStroke && origStroke.toLowerCase() !== 'none') ? `stroke="${fgFill}"` : 'stroke="none"';
      }
    } else {
      const origFill = inlinedSvgInfo.svgTagFill;
      const origStroke = inlinedSvgInfo.svgTagStroke;
      
      if (origStroke) {
        strokeAttr = `stroke="${origStroke}"`;
      }
      if (origFill) {
        fillAttr = `fill="${origFill}"`;
      }
    }

    let innerHTML = inlinedSvgInfo.innerHTML;

    if (inlinedSvgInfo.isRawIcon) {
      innerHTML = innerHTML.replace(/<path[^>]*d\s*=\s*["']\s*M\s*0\s+0h\d+v\d+H0z\s*["'][^>]*\/?>/gi, '');
      innerHTML = innerHTML.replace(/<rect[^>]*fill\s*=\s*["']none["'][^>]*stroke\s*=\s*["']none["'][^>]*\/?>/gi, '');
    }

    if (!inlinedSvgInfo.isRawIcon && preset !== 'preset1') {
      try {
        if (typeof DOMParser !== 'undefined') {
          const parser = new DOMParser();
          const doc = parser.parseFromString(`<svg>${innerHTML}</svg>`, 'image/svg+xml');
          const svg = doc.querySelector('svg');
          const outerCircles = svg.querySelectorAll('rect[width="52"], rect[rx="26"], rect[fill-opacity], circle[r="26"]');
          if (outerCircles.length > 0) {
             outerCircles.forEach(el => el.remove());
             innerHTML = svg.innerHTML;
          }
        }
      } catch (e) {
        console.error("Failed to remove static outer circle:", e);
      }
    }

    const [minX, minY, vbW, vbH] = (inlinedSvgInfo.viewBox || '0 0 52 52').trim().split(/[\s,]+/).map(parseFloat);
    const targetW = inlinedSvgInfo.isRawIcon ? 20 : 40;
    const targetH = inlinedSvgInfo.isRawIcon ? 20 : 40;
    const targetX = inlinedSvgInfo.isRawIcon ? 14 : 4;
    const targetY = inlinedSvgInfo.isRawIcon ? 14 : 4;
    const s = Math.min(targetW / (vbW || 1), targetH / (vbH || 1));
    const tx = targetX - (minX || 0) * s;
    const ty = targetY - (minY || 0) * s;

    return `
      ${backgroundHTML}
      ${extraBg}
      <g transform="translate(${tx.toFixed(4)}, ${ty.toFixed(4)}) scale(${s.toFixed(6)})" ${fillAttr} ${strokeAttr}${extraSvgAttrs}>
        ${innerHTML}
      </g>
    `;
  } else {
    return `
      ${backgroundHTML}
      <image href="${src}" x="0" y="0" width="48" height="48" preserveAspectRatio="xMidYMid meet" pointer-events="none" />
    `;
  }
};

export const generateButtonSVG = (label, bgCol, textCol, hasIcon, btnIconCol = textCol, btnIconPlacement = 'Front', w = 80, h = 32, rx = 4, fontSize = 14, iconSrc = null) => {
  const bgInfo = generateSvgGradient(bgCol, 'btnBg');
  let html = bgInfo.defsString + `<rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="${bgInfo.fillValue}" />`;
  const textY = h / 2 + (fontSize / 3);
  
  if (hasIcon) {
    const textWidth = label.length * (fontSize * 0.55);
    const contentWidth = 15 + 5 + textWidth; // icon 15px, gap 5px
    const startX = (w - contentWidth) / 2;
    
    let textX, iconTranslateX;
    if (btnIconPlacement === 'Front') {
      iconTranslateX = startX - 20;
      textX = startX + 20 + (textWidth / 2);
    } else {
      textX = startX + (textWidth / 2);
      iconTranslateX = startX + textWidth + 5 - 20;
    }

    if (iconSrc) {
      // The iconTranslateX assumes a 20px offset for the path.
      // If we render an image at x=20, it places exactly where the path was drawn (M20 16)
      html += `<image href="${iconSrc}" x="${iconTranslateX + 20}" y="${(h - 14) / 2}" width="14" height="14" preserveAspectRatio="xMidYMid meet" />`;
    } else {
      html += `<g transform="translate(${iconTranslateX}, 0)">`;
      html += `<path d="M20 16 L25 21 L35 11" fill="none" stroke="${btnIconCol}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
      html += `</g>`;
    }
    html += `<text x="${textX}" y="${textY}" fill="${textCol}" font-size="${fontSize}" font-family="sans-serif" font-weight="bold" text-anchor="middle" data-type="text">${label}</text>`;
  } else {
    html += `<text x="${w / 2}" y="${textY}" fill="${textCol}" font-size="${fontSize}" font-family="sans-serif" font-weight="bold" text-anchor="middle" data-type="text">${label}</text>`;
  }
  return html;
};

const HotspotCustomizationPopup = ({ isOpen, onClose, initialData, onSave }) => {
  const [customSrc, setCustomSrc] = useState(null);
  const [selectedIconStyle, setSelectedIconStyle] = useState(null);
  const [iconStyles, setIconStyles] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(initialData?.preset || PRESETS[2].id);
  const [iconColor, setIconColor] = useState(initialData?.iconColor ? (initialData.iconColor.length === 9 && initialData.iconColor.startsWith('#') ? initialData.iconColor.substring(0, 7) : initialData.iconColor) : '#FFFFFF');
  const [iconOpacity, setIconOpacity] = useState(initialData?.iconColor && initialData.iconColor.length === 9 && initialData.iconColor.startsWith('#') ? Math.round((parseInt(initialData.iconColor.substring(7, 9), 16) / 255) * 100) : 100);
  const [bgColor, setBgColor] = useState(initialData?.bgColor ? (initialData.bgColor.length === 9 && initialData.bgColor.startsWith('#') ? initialData.bgColor.substring(0, 7) : initialData.bgColor) : '#359CFD');
  const [bgOpacity, setBgOpacity] = useState(initialData?.bgColor && initialData.bgColor.length === 9 && initialData.bgColor.startsWith('#') ? Math.round((parseInt(initialData.bgColor.substring(7, 9), 16) / 255) * 100) : 100);
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'icon' or 'bg'

  const [fetchedSvgDoc, setFetchedSvgDoc] = useState(null);

  // Button Customization States
  const isButtonMode = initialData?.preset === 'interactive-button';
  const [btnLabel, setBtnLabel] = useState('Button');
  const [btnHasIcon, setBtnHasIcon] = useState(false);
  const [btnIconSrc, setBtnIconSrc] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [btnWidth, setBtnWidth] = useState(80);
  const [btnHeight, setBtnHeight] = useState(32);
  const [btnRx, setBtnRx] = useState(4);
  const [btnFontSize, setBtnFontSize] = useState(14);
  const [btnIconColor, setBtnIconColor] = useState('#FFFFFF');
  const [btnIconPlacement, setBtnIconPlacement] = useState('Front');
  
  const [bareDefaultSrc, setBareDefaultSrc] = useState(null);

  useEffect(() => {
    if (initialData?.src) {
      fetch(initialData.src)
        .then(res => res.text())
        .then(text => {
          if (text.includes('<svg')) {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(text, 'image/svg+xml');
            const svg = svgDoc.querySelector('svg');
            if (svg) {
              // Clone the document to create the bareDefaultSrc
              const thumbnailDoc = svgDoc.cloneNode(true);
              const thumbnailSvg = thumbnailDoc.querySelector('svg');
              
              const allElements = Array.from(thumbnailSvg.querySelectorAll('g, rect, circle, path, ellipse, polygon'));
              const hasNonWhiteColors = allElements.some(el => {
                const fill = el.getAttribute('fill') || el.style.fill;
                const stroke = el.getAttribute('stroke') || el.style.stroke;
                const isColor = (c) => c && c.toLowerCase() !== 'none' && c.toLowerCase() !== 'transparent' && c.toLowerCase() !== 'white' && c.toLowerCase() !== '#ffffff' && c.toLowerCase() !== '#fff' && !c.replace(/\s+/g,'').toLowerCase().includes('rgb(255,255,255)');
                return isColor(fill) || isColor(stroke);
              });

              if (!hasNonWhiteColors) {
                // If the icon is entirely white/transparent, turn white elements to black for visibility in the picker
                allElements.forEach(el => {
                  const fill = el.getAttribute('fill') || el.style.fill;
                  const stroke = el.getAttribute('stroke') || el.style.stroke;
                  const isWhite = (c) => c && (c.toLowerCase() === 'white' || c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#fff' || c.replace(/\s+/g,'').toLowerCase() === 'rgb(255,255,255)');
                  
                  if (isWhite(fill)) {
                    if (el.getAttribute('fill')) el.setAttribute('fill', '#000000');
                    if (el.style.fill) el.style.fill = '#000000';
                  }
                  if (isWhite(stroke)) {
                    if (el.getAttribute('stroke')) el.setAttribute('stroke', '#000000');
                    if (el.style.stroke) el.style.stroke = '#000000';
                  }
                });
              } else {
                // If it has other colors (like the YouTube red icon), we keep it as is, 
                // but we might want to strip the background shape if it's a solid colored circle.
                // However, doing so blindly breaks complex icons. The safest approach is to just use the original SVG for the thumbnail.
              }
              
              const svgString = new XMLSerializer().serializeToString(thumbnailSvg);
              const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
              setBareDefaultSrc(dataUrl);
            }
          }
        })
        .catch(() => {});
    }
  }, [initialData?.src]);
  
  const getCurrentIconSrc = () => {
    if (selectedIconStyle === 'custom') return customSrc;
    const style = iconStyles.find(s => s.id === selectedIconStyle);
    return style ? style.src : (iconStyles[0] ? iconStyles[0].src : null);
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    const src = getCurrentIconSrc();
    if (src) {
      fetch(src)
        .then(res => res.text())
        .then(text => {
          if (text.includes('<svg')) {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(text, 'image/svg+xml');
            setFetchedSvgDoc(svgDoc);

            // Extract dominant color from the SVG to update the color palette
            if (selectedIconStyle === 'default' && (isInitialMount.current || !initialData?.bgColor || initialData.bgColor === '#359CFD')) {
              const bgElements = Array.from(svgDoc.querySelectorAll('rect, circle, path, ellipse, polygon')).filter(el => {
                const f = el.getAttribute('fill');
                if (!f) return false;
                const fl = f.toLowerCase();
                return fl !== 'none' && fl !== 'white' && fl !== '#ffffff' && fl !== '#fff';
              });

              if (bgElements.length > 0) {
                let colorToSet = bgElements[0].getAttribute('fill');
                
                // If it's a gradient, convert it to a CSS gradient string
                if (colorToSet.startsWith('url(')) {
                  const match = colorToSet.match(/url\(#([^)]+)\)/);
                  if (match && match[1]) {
                    const gradientEl = svgDoc.getElementById(match[1]);
                    if (gradientEl) {
                      const stops = Array.from(gradientEl.querySelectorAll('stop'));
                      if (stops.length > 0) {
                        const hexToRgbStr = (hex) => {
                          if (!hex) return 'rgb(255, 255, 255)';
                          let c = hex.replace('#', '');
                          if (c.length === 3) c = c.split('').map(x => x + x).join('');
                          const r = parseInt(c.substring(0,2), 16) || 0;
                          const g = parseInt(c.substring(2,4), 16) || 0;
                          const b = parseInt(c.substring(4,6), 16) || 0;
                          return `rgb(${r}, ${g}, ${b})`;
                        };
                        const stopStrings = stops.map((stop, i) => {
                          const stopColor = stop.getAttribute('stop-color') || '#FFFFFF';
                          let offset = stop.getAttribute('offset');
                          if (offset === null) offset = i === 0 ? '0%' : '100%';
                          if (!offset.includes('%')) offset = Math.round(parseFloat(offset) * 100) + '%';
                          const rgbStr = hexToRgbStr(stopColor);
                          return `${rgbStr} ${offset}`;
                        });
                        const type = gradientEl.tagName.toLowerCase() === 'lineargradient' ? 'linear-gradient(90deg' : 'radial-gradient(circle at center';
                        colorToSet = `${type}, ${stopStrings.join(', ')})`;
                      }
                    }
                  }
                }
                
                // If it's a valid hex color, update the Bg Color palette
                if (colorToSet && colorToSet.startsWith('#')) {
                  // Only update if it's a valid hex (length 4, 7, or 9)
                  if (/^#([0-9A-F]{3}){1,2}$/i.test(colorToSet)) {
                    setBgColor(colorToSet.toUpperCase());
                  }
                }
              }
            }
            if (isInitialMount.current) {
              isInitialMount.current = false;
            }
          } else {
            setFetchedSvgDoc(null);
          }
        })
        .catch(() => setFetchedSvgDoc(null));
    }
  }, [selectedIconStyle, customSrc]);

  const getRecoloredSvg = (overrideBg = null, overrideFg = null) => {
    if (!fetchedSvgDoc) return null;
    const doc = fetchedSvgDoc.cloneNode(true);
    const svg = doc.querySelector('svg');
    if (!svg) return null;

    const bg = overrideBg || applyOpacity(bgColor, bgOpacity);
    const fg = overrideFg || applyOpacity(iconColor, iconOpacity);

    const bgInfo = generateSvgGradient(bg, 'svgBg');
    const fgInfo = generateSvgGradient(fg, 'svgFg');

    let isRawIcon = selectedIconStyle !== 'default';
    if (selectedIconStyle === 'default' && initialData?.src) {
      let originalPath = initialData.src;
      for (const [path, url] of Object.entries(ALL_ICON_ASSETS)) {
          if (url === initialData.src) {
              originalPath = path;
              break;
          }
      }
      // Base presets are strictly from the /icons/ folder
      const isBasePreset = originalPath.toLowerCase().includes('/icons/');
      isRawIcon = !isBasePreset;
    }

    const allShapes = Array.from(svg.querySelectorAll('g, rect, circle, path, ellipse, polygon, line, polyline'));
    const rootFill = svg.getAttribute('fill');
    const rootStroke = svg.getAttribute('stroke');
    const rootIsFillNone = rootFill && rootFill.toLowerCase() === 'none';
    const rootHasStroke = rootStroke && rootStroke.toLowerCase() !== 'none';
    const anyShapeHasStroke = allShapes.some(el => {
      const s = el.getAttribute('stroke') || el.style.stroke;
      return s && s.toLowerCase() !== 'none';
    });
    const isStrokeBased = rootIsFillNone || rootHasStroke || anyShapeHasStroke;

    if (isRawIcon) {
      const styleTags = svg.querySelectorAll('style');
      styleTags.forEach(styleTag => {
        let text = styleTag.textContent;
        text = text.replace(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g, (match) => {
            const m = match.toLowerCase();
            return (m === '#ffffff' || m === '#fff') ? 'none' : fgInfo.fillValue;
        });
        text = text.replace(/\bblack\b/gi, fgInfo.fillValue);
        styleTag.textContent = text;
      });

      allShapes.forEach(el => {
        const fill = el.getAttribute('fill') || el.style.fill;
        const stroke = el.getAttribute('stroke') || el.style.stroke;
        const d = el.getAttribute('d');
        const isWhite = (c) => c && (c.toLowerCase() === 'white' || c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#fff' || c.replace(/\s+/g,'').toLowerCase() === 'rgb(255,255,255)');

        // Remove transparent spacer bounding box paths (like M0 0h24v24H0z or transparent rect)
        const isSpacerBox = (d && /^M\s*0\s+0h\d+v\d+H0z/i.test(d.trim())) ||
          ((fill === 'none' || fill === 'transparent') && (!stroke || stroke === 'none') && (
            el.tagName.toLowerCase() === 'rect' ||
            (d && /^M\s*0\s+0/i.test(d.trim()) && d.toLowerCase().includes('h') && d.toLowerCase().includes('v') && d.toLowerCase().includes('z'))
          ));

        if (isSpacerBox) {
          el.remove();
          return;
        }

        // Any element that was explicitly fill="none" and had NO stroke must never inherit a stroke from parent <g>!
        if (fill && fill.toLowerCase() === 'none' && (!stroke || stroke.toLowerCase() === 'none')) {
          el.setAttribute('stroke', 'none');
          el.setAttribute('fill', 'none');
          return;
        }

        if (fill && fill.toLowerCase() !== 'none') {
           if (isWhite(fill)) {
             el.setAttribute('fill', 'none');
           } else {
             el.setAttribute('fill', fgInfo.fillValue);
           }
           el.style.fill = '';
        } else if (!fill && !stroke && (!el.hasAttribute('class') || styleTags.length === 0) && el.tagName.toLowerCase() !== 'g') {
           if (isStrokeBased) {
             el.setAttribute('fill', 'none');
           } else {
             el.setAttribute('fill', fgInfo.fillValue);
           }
        }
        
        if (stroke && stroke.toLowerCase() !== 'none') {
           if (isWhite(stroke)) {
             el.setAttribute('stroke', 'none');
           } else {
             el.setAttribute('stroke', fgInfo.fillValue);
           }
           el.style.stroke = '';
        }
      });
    } else {
      // Original logic for built-in preset SVGs
      const bgElements = allShapes.filter(el => {
        const fill = el.getAttribute('fill') || el.style.fill;
        if (!fill) return false;
        const f = fill.toLowerCase();
        return f !== 'none' && f !== 'transparent' && f !== 'white' && f !== '#ffffff' && f !== '#fff' && !f.includes('rgb(255, 255, 255)');
      });
      
      bgElements.forEach(el => {
        if (el.getAttribute('fill')) el.setAttribute('fill', bgInfo.fillValue);
        if (el.style.fill) el.style.fill = bgInfo.fillValue;
      });

      if (fg && fg.toLowerCase() !== '#ffffff' && fg !== 'white') {
        const fgElements = allShapes.filter(el => {
          const fill = el.getAttribute('fill') || el.style.fill;
          const stroke = el.getAttribute('stroke') || el.style.stroke;
          const isWhite = (c) => c && (c.toLowerCase() === 'white' || c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#fff' || c.replace(/\s+/g,'').toLowerCase() === 'rgb(255,255,255)');
          return isWhite(fill) || isWhite(stroke);
        });
        fgElements.forEach(el => {
          const fill = el.getAttribute('fill') || el.style.fill;
          const stroke = el.getAttribute('stroke') || el.style.stroke;
          const isWhite = (c) => c && (c.toLowerCase() === 'white' || c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#fff' || c.replace(/\s+/g,'').toLowerCase() === 'rgb(255,255,255)');
          if (isWhite(fill)) {
            if (el.getAttribute('fill')) el.setAttribute('fill', fgInfo.fillValue);
            if (el.style.fill) el.style.fill = fgInfo.fillValue;
          }
          if (isWhite(stroke)) {
            if (el.getAttribute('stroke')) el.setAttribute('stroke', fgInfo.fillValue);
            if (el.style.stroke) el.style.stroke = fgInfo.fillValue;
          }
        });
      }
    }

    return {
      innerHTML: bgInfo.defsString + fgInfo.defsString + svg.innerHTML,
      viewBox: svg.getAttribute('viewBox') || '0 0 52 52',
      isRawIcon,
      isStrokeBased,
      svgTagFill: rootFill,
      svgTagStroke: rootStroke,
      strokeWidth: svg.getAttribute('stroke-width'),
      strokeLinecap: svg.getAttribute('stroke-linecap'),
      strokeLinejoin: svg.getAttribute('stroke-linejoin')
    };
  };

  const handleScrubOpacity = (e, initialVal, setFn) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    let accumulatedDelta = 0;
    const sensitivity = 2;

    document.body.classList.add('is-scrubbing');

    const onMouseMove = (moveEvent) => {
      accumulatedDelta += moveEvent.movementX || 0;
      let newVal = initialVal + Math.round(accumulatedDelta / sensitivity);
      if (newVal < 0) newVal = 0;
      if (newVal > 100) newVal = 100;
      setFn(newVal);
    };

    const onMouseUp = () => {
      document.body.classList.remove('is-scrubbing');
      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('pointerup', onMouseUp);
    };

    window.addEventListener('pointermove', onMouseMove);
    window.addEventListener('pointerup', onMouseUp);
  };

  const extractOpacity = (colorStr) => {
    if (colorStr && typeof colorStr === 'string' && colorStr.length === 9 && colorStr.startsWith('#')) {
      return Math.round((parseInt(colorStr.substring(7, 9), 16) / 255) * 100);
    }
    return 100;
  };

  const stripOpacity = (colorStr) => {
    if (colorStr && typeof colorStr === 'string' && colorStr.length === 9 && colorStr.startsWith('#')) {
      return colorStr.substring(0, 7);
    }
    return colorStr;
  };

  const applyOpacity = (colorStr, op) => {
    if (!colorStr || typeof colorStr !== 'string' || !colorStr.startsWith('#') || colorStr.length !== 7) return colorStr;
    if (op === 100) return colorStr;
    const alphaHex = Math.round((op / 100) * 255).toString(16).padStart(2, '0');
    return `${colorStr}${alphaHex}`;
  };

  useEffect(() => {
    if (initialData && isOpen) {
      if (initialData.preset) setSelectedPreset(initialData.preset);
      
      let styles = [];
      if (initialData.src) {
        styles.push({ id: 'default', src: initialData.src });
      }
      
      let lookupKey = (initialData.preset && getIconsForAction(initialData.preset).length > 0) 
        ? initialData.preset 
        : initialData.actionId;

      // Smartly infer the folder from the current src so that if an 'Open Link' hotspot 
      // uses an 'Instagram' icon, we show Instagram styles instead of Link styles.
      if (initialData.src && typeof initialData.src === 'string') {
        const srcLower = initialData.src.toLowerCase();
        let originalPathLower = srcLower;
        
        // If the src is a data URI or hashed URL, reverse-lookup the original path in our assets
        for (const [path, url] of Object.entries(ALL_ICON_ASSETS)) {
            if (url === initialData.src) {
                originalPathLower = path.toLowerCase();
                break;
            }
        }

        const fileToActionMap = {
            'whatsapp': 'whatsapp',
            'video': 'video',
            'vedio': 'video',
            'instagram': 'instagram',
            'facebook': 'facebook',
            'linkedin': 'linkedin',
            'x.svg': 'x',
            '/x/': 'x',
            'youtube': 'youtube',
            'yotube': 'youtube',
            'popup': 'popup',
            'slideshow': 'slideshow',
            '3d.svg': '3d-viewer',
            '/3d viewer/': '3d-viewer',
            'email': 'email',
            'call': 'call',
            'location': 'location',
            'navigation': 'navigate-to',
            '/navigation page/': 'navigate-to',
            'openlink': 'open-link',
            '/open_link/': 'open-link',
            'zoom': 'zoom',
            'zoomicon': 'zoom',
            '/zoom/': 'zoom',
            'info': 'info',
            'infoicon': 'info',
            '/info/': 'info',
            'download': 'download',
            'downloadicon': 'download',
            '/download/': 'download',
            'audio': 'audio',
            'audioicon': 'audio',
            '/audio/': 'audio'
        };

        // Prioritize specific icons (like social media presets) so they don't fall back to generic interaction types
        let foundMatch = false;
        
        // 1. First, check for specific icon names in the URL or original path
        const specificIcons = ['instagram', 'facebook', 'linkedin', 'youtube', 'yotube', 'whatsapp', 'zoom', 'info', 'download', 'audio'];
        for (const icon of specificIcons) {
            if (originalPathLower.includes(icon)) {
                lookupKey = icon === 'yotube' ? 'youtube' : icon;
                foundMatch = true;
                break;
            }
        }

        // 2. Check for X (Twitter) specifically
        if (!foundMatch && (originalPathLower.includes('x.svg') || originalPathLower.includes('/x/'))) {
            lookupKey = 'x';
            foundMatch = true;
        }

        // 3. Fallback to the rest of the map (including open-link)
        if (!foundMatch) {
            for (const [key, action] of Object.entries(fileToActionMap)) {
                if (originalPathLower.includes(key)) {
                    lookupKey = action;
                    break;
                }
            }
        }
      }
        
      if (lookupKey) {
        const actionIcons = getIconsForAction(lookupKey);
        actionIcons.forEach(icon => {
          if (!styles.some(s => s.src === icon.src)) {
            styles.push(icon);
          }
        });
      }
      setIconStyles(styles);

      if (initialData.src) {
        const match = styles.find(s => s.src === initialData.src);
        if (match) {
          setSelectedIconStyle(match.id);
        } else {
          setCustomSrc(initialData.src);
          setSelectedIconStyle('custom');
        }
      } else if (initialData.iconStyle) {
        setSelectedIconStyle(initialData.iconStyle);
      }
      if (initialData.iconColor) {
        setIconColor(stripOpacity(initialData.iconColor));
        setIconOpacity(extractOpacity(initialData.iconColor));
      }
      if (initialData.bgColor) {
        setBgColor(stripOpacity(initialData.bgColor));
        setBgOpacity(extractOpacity(initialData.bgColor));
      }

      if (initialData.preset === 'interactive-button' && initialData.hotspotHtml) {
        const textMatch = initialData.hotspotHtml.match(/<text[^>]*>([\s\S]*?)<\/text>/);
        if (textMatch) setBtnLabel(textMatch[1]);
        
        const pathMatch = initialData.hotspotHtml.match(/<path/);
        const imgMatch = initialData.hotspotHtml.match(/<image[^>]*href="([^"]*)"/);
        
        if (imgMatch) {
          setBtnIconSrc(imgMatch[1]);
        } else {
          setBtnIconSrc(null);
        }
        
        setBtnHasIcon(!!pathMatch || !!imgMatch);

        const wMatch = initialData.hotspotHtml.match(/width="([\d.]+)"/);
        if (wMatch) setBtnWidth(parseFloat(wMatch[1]));

        const hMatch = initialData.hotspotHtml.match(/height="([\d.]+)"/);
        if (hMatch) setBtnHeight(parseFloat(hMatch[1]));

        const rxMatch = initialData.hotspotHtml.match(/rx="([\d.]+)"/);
        if (rxMatch) setBtnRx(parseFloat(rxMatch[1]));

        const fMatch = initialData.hotspotHtml.match(/font-size="([\d.]+)"/);
        if (fMatch) setBtnFontSize(parseFloat(fMatch[1]));

        const strokeMatch = initialData.hotspotHtml.match(/<path[^>]*stroke="([^"]*)"/);
        if (strokeMatch) setBtnIconColor(strokeMatch[1]);
      }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    let finalHtml = '';
    if (isButtonMode) {
      finalHtml = generateButtonSVG(btnLabel, applyOpacity(bgColor, bgOpacity), applyOpacity(iconColor, iconOpacity), btnHasIcon, btnIconColor, btnIconPlacement, btnWidth, btnHeight, btnRx, btnFontSize, btnIconSrc);
    } else {
      finalHtml = generateHotspotSVG(selectedPreset, applyOpacity(bgColor, bgOpacity), applyOpacity(iconColor, iconOpacity), getCurrentIconSrc(), getRecoloredSvg(), `final-${Math.random().toString(36).substr(2, 6)}`);
    }

    onSave({
      preset: selectedPreset,
      iconStyle: selectedIconStyle,
      src: isButtonMode ? btnIconSrc : getCurrentIconSrc(),
      iconColor: applyOpacity(iconColor, iconOpacity),
      bgColor: applyOpacity(bgColor, bgOpacity),
      customHtml: finalHtml
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/20 backdrop-blur-[1px]" onClick={onClose}>
      <div 
        className="bg-white rounded-[0.6vw] w-[38vw] h-auto p-[1.5vw] max-h-[85vh] flex flex-col overflow-visible shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pb-[1vh] flex items-center border-b border-gray-100">
          <h2 className="text-[1vw] font-semibold text-black">Hotspot Customization</h2>
          <div className="flex-1 border-t border-gray-200 ml-[1vw]"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex pt-[1.5vw] gap-[1.5vw]">
          {/* Left Preview */}
          <div className="flex flex-col w-[42%] h-full">
            {!isButtonMode && (
              <span className="text-[0.6vw] text-gray-400 font-medium uppercase tracking-wider mb-[1vh]">Preview</span>
            )}
            
            <div className={`flex-1 border border-gray-100 rounded-[0.5vw] flex flex-col ${isButtonMode ? 'overflow-hidden' : ''}`}>
              {isButtonMode && (
                <div className="px-[1vw] pt-[1vh]">
                  <span className="text-[0.7vw] text-gray-700 font-medium">Preview</span>
                </div>
              )}
              {/* Preview Area */}
              <div className="flex-1 flex items-center justify-center bg-white py-[1vh] px-[2vw]">
                <div className="relative w-[10vw] h-[10vw] flex items-center justify-center">
                  <svg 
                    viewBox={isButtonMode ? `0 0 ${btnWidth} ${btnHeight}` : "-12 -12 72 72"}
                    className={isButtonMode ? "w-full max-h-[8vw] transition-all duration-300 overflow-visible" : "w-[150%] h-[150%] max-w-none transition-all duration-300 overflow-visible"}
                    style={{ overflow: 'visible' }}
                    dangerouslySetInnerHTML={{ __html: isButtonMode ? generateButtonSVG(btnLabel, applyOpacity(bgColor, bgOpacity), applyOpacity(iconColor, iconOpacity), btnHasIcon, btnIconColor, btnIconPlacement, btnWidth, btnHeight, btnRx, btnFontSize, btnIconSrc) : generateHotspotSVG(selectedPreset, applyOpacity(bgColor, bgOpacity), applyOpacity(iconColor, iconOpacity), getCurrentIconSrc(), getRecoloredSvg(), 'preview') }}
                  />
                </div>
              </div>
              
              {isButtonMode && (
                <div className="bg-[#F8F9FA] border-t border-gray-100 p-[1.5vh] flex justify-center items-center">
                  <label className="flex items-center gap-[0.5vw] cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-[1vw] h-[1vw] accent-black cursor-pointer"
                      checked={btnHasIcon}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBtnHasIcon(checked);
                        const estTextWidth = btnLabel.length * (btnFontSize * 0.55);
                        const iconSpace = checked ? 20 : 0;
                        const neededW = Math.max(80, Math.ceil(estTextWidth + iconSpace + 24));
                        if (neededW > btnWidth) {
                          setBtnWidth(neededW);
                        }
                      }}
                    />
                    <span className="text-[0.7vw] font-medium text-gray-700 select-none">Add Icon to the Button</span>
                  </label>
                </div>
              )}

              {/* Presets Row */}
              {!isButtonMode && (
                <div className="border-t border-gray-100 p-[1vw] flex flex-col gap-[0.5vh]">
                  <span className="text-[0.6vw] text-gray-400 font-medium uppercase tracking-wider">Preset</span>
                  <div className="flex items-center justify-between mt-[0.5vh]">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPreset(p.id)}
                        className={`w-[2.5vw] h-[2.5vw] rounded-[0.4vw] flex items-center justify-center transition-all overflow-visible ${
                          selectedPreset === p.id 
                            ? 'border border-gray-300 shadow-sm' 
                            : 'border border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <svg 
                          viewBox="-12 -12 72 72" 
                          className="w-[150%] h-[150%] max-w-none overflow-visible pointer-events-none"
                          style={{ overflow: 'visible' }}
                          dangerouslySetInnerHTML={{ __html: generateHotspotSVG(p.id, applyOpacity(bgColor, bgOpacity), applyOpacity(iconColor, iconOpacity), null, getRecoloredSvg(), p.id) }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex-1 flex flex-col">
            <div className="flex flex-col gap-[2.5vh] mt-[1.5vh]">
              {isButtonMode ? (
                <>
                  {btnHasIcon && (
                    <>
                      {/* Icon Gallery */}
                      <div className="flex items-center relative z-50">
                        <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Icon Gallery:</span>
                        <div className="flex items-center gap-[0.5vw] flex-1 relative">
                          <div className="flex-1 h-[1.8vw] border border-gray-200 rounded-[0.3vw] flex items-center justify-center bg-white shadow-sm overflow-hidden">
                            {btnIconSrc ? (
                              <img src={btnIconSrc} className="w-[1vw] h-[1vw] object-contain" />
                            ) : (
                              <Icon icon="lucide:check" className="text-[1vw] text-gray-800" />
                            )}
                          </div>
                          <button 
                            className="h-[1.8vw] px-[0.8vw] bg-[#F3F4F6] text-gray-700 text-[0.7vw] font-medium rounded-[0.3vw] flex items-center gap-[0.3vw] hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"
                            onClick={() => setShowIconPicker(!showIconPicker)}
                          >
                            <Icon icon="lucide:arrow-left-right" className="text-[0.7vw]" />
                            Change
                          </button>

                          {/* Icon Picker Popup */}
                          {showIconPicker && (
                            <div className="absolute top-[2.2vw] right-0 bg-white border border-gray-200 rounded-[0.5vw] shadow-xl p-[0.8vw] w-[12vw] z-[999]">
                              <div className="fixed inset-0 z-[-1]" onClick={(e) => { e.stopPropagation(); setShowIconPicker(false); }} />
                              <div className="grid grid-cols-3 gap-[0.6vw]">
                                {/* Default Check */}
                                <button
                                  className={`aspect-square flex items-center justify-center rounded-[0.3vw] border transition-all ${!btnIconSrc ? 'border-gray-800 bg-gray-50 shadow-sm' : 'border-gray-100 hover:bg-gray-50 hover:border-gray-300'}`}
                                  onClick={() => { setBtnIconSrc(null); setShowIconPicker(false); }}
                                >
                                  <Icon icon="lucide:check" className="text-[1.2vw] text-gray-800" />
                                </button>
                                {/* PNG Assets */}
                                {Object.entries(BUTTON_ICON_ASSETS).map(([path, url]) => (
                                  <button
                                    key={path}
                                    className={`aspect-square flex items-center justify-center rounded-[0.3vw] border transition-all ${btnIconSrc === url ? 'border-gray-800 bg-gray-50 shadow-sm' : 'border-gray-100 hover:bg-gray-50 hover:border-gray-300'}`}
                                    onClick={() => { setBtnIconSrc(url); setShowIconPicker(false); }}
                                  >
                                    <img src={url} className="w-[1.2vw] h-[1.2vw] object-contain" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Placement */}
                      <div className="flex items-center">
                        <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Placement :</span>
                        <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center px-[0.5vw] relative shadow-sm">
                          <select 
                            className="text-[0.75vw] text-gray-600 font-medium bg-transparent outline-none w-full appearance-none cursor-pointer"
                            value={btnIconPlacement}
                            onChange={(e) => setBtnIconPlacement(e.target.value)}
                          >
                            <option value="Front">Front</option>
                            <option value="Back">Back</option>
                          </select>
                          <Icon icon="lucide:chevron-down" className="absolute right-[0.5vw] text-[0.8vw] text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Icon Color */}
                      <div className="flex items-center relative">
                        <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Icon Color :</span>
                        <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                          <div 
                            className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm flex-shrink-0"
                            style={{ background: btnIconColor }}
                            onClick={() => setActiveColorPicker(activeColorPicker === 'btnIcon' ? null : 'btnIcon')}
                          ></div>
                          <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw] min-w-0">
                            <input
                              type="text"
                              className="text-[0.65vw] text-gray-600 uppercase font-mono bg-transparent outline-none flex-1 min-w-0"
                              value={btnIconColor}
                              onChange={(e) => setBtnIconColor(e.target.value)}
                            />
                            <span className="text-[0.6vw] flex-shrink-0 ml-[0.5vw] text-gray-400 select-none">
                              100%
                            </span>
                          </div>
                        </div>
                        {activeColorPicker === 'btnIcon' && (
                          <div className="absolute top-[-11vw] left-[8vw] z-50">
                            <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setActiveColorPicker(null); }} />
                            <div className="relative">
                              <ColorPicker color={btnIconColor} onChange={setBtnIconColor} opacity={100} onOpacityChange={() => {}} onClose={() => setActiveColorPicker(null)} disableGradient={true} />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Label */}
                  <div className="flex items-center">
                    <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Text :</span>
                    <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center px-[0.5vw] shadow-sm">
                      <input
                        type="text"
                        className="text-[0.75vw] text-gray-600 font-medium bg-transparent outline-none flex-1 min-w-0"
                        value={btnLabel}
                        maxLength={30}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBtnLabel(val);
                          const estTextWidth = val.length * (btnFontSize * 0.55);
                          const iconSpace = btnHasIcon ? 20 : 0;
                          const neededW = Math.max(80, Math.ceil(estTextWidth + iconSpace + 24));
                          if (neededW > btnWidth) {
                            setBtnWidth(neededW);
                          }
                        }}
                      />
                      <span className="text-[0.6vw] text-gray-400 select-none">{btnLabel.length}/30</span>
                    </div>
                  </div>

                  {/* Text Color (using iconColor state) */}
                  <div className="flex items-center relative">
                    <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Text Color :</span>
                    <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                      <div 
                        className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm flex-shrink-0"
                        style={{ background: applyOpacity(iconColor, iconOpacity) }}
                        onClick={() => setActiveColorPicker(activeColorPicker === 'icon' ? null : 'icon')}
                      ></div>
                      <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw] min-w-0">
                        <input
                          type="text"
                          className="text-[0.65vw] text-gray-600 uppercase font-mono bg-transparent outline-none flex-1 min-w-0"
                          value={iconColor}
                          onChange={(e) => setIconColor(e.target.value)}
                        />
                        <span 
                          className="text-[0.6vw] flex-shrink-0 ml-[0.5vw] text-gray-400 cursor-ew-resize select-none"
                          onPointerDown={(e) => handleScrubOpacity(e, iconOpacity, setIconOpacity)}
                        >
                          {iconOpacity}%
                        </span>
                      </div>
                    </div>
                    {activeColorPicker === 'icon' && (
                      <div className="absolute top-[-11vw] left-[8vw] z-50">
                        <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setActiveColorPicker(null); }} />
                        <div className="relative">
                          <ColorPicker color={iconColor} onChange={setIconColor} opacity={iconOpacity} onOpacityChange={setIconOpacity} onClose={() => setActiveColorPicker(null)} disableGradient={true} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bg Color */}
                  <div className="flex items-center relative">
                    <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Bg Color :</span>
                    <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                      <div 
                        className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm flex-shrink-0"
                        style={{ background: applyOpacity(bgColor, bgOpacity) }}
                        onClick={() => setActiveColorPicker(activeColorPicker === 'bg' ? null : 'bg')}
                      ></div>
                      <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw] min-w-0">
                        <input
                          type="text"
                          className="text-[0.65vw] text-gray-600 uppercase font-mono bg-transparent outline-none flex-1 min-w-0"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                        />
                        <span 
                          className="text-[0.6vw] flex-shrink-0 ml-[0.5vw] text-gray-400 cursor-ew-resize select-none"
                          onPointerDown={(e) => handleScrubOpacity(e, bgOpacity, setBgOpacity)}
                        >
                          {bgOpacity}%
                        </span>
                      </div>
                    </div>
                    {activeColorPicker === 'bg' && (
                      <div className="absolute top-[-15vw] left-[8vw] z-50">
                        <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setActiveColorPicker(null); }} />
                        <div className="relative">
                          <ColorPicker color={bgColor} onChange={setBgColor} opacity={bgOpacity} onOpacityChange={setBgOpacity} onClose={() => setActiveColorPicker(null)} disableGradient={true} />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Icon Style */}
                  <div className="flex items-center">
                    <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Icon Style :</span>
                    <div className="flex items-center gap-[0.4vw] ml-[0.5vw] overflow-x-auto custom-scrollbar pb-1 max-w-[15vw]">
                      {customSrc && (
                        <button
                          className={`w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-[0.3vw] border transition-colors ${selectedIconStyle === 'custom' ? 'border-gray-800 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                          onClick={() => setSelectedIconStyle('custom')}
                        >
                          <img src={customSrc} className="w-[1.2vw] h-[1.2vw] object-contain" />
                        </button>
                      )}
                      {iconStyles.map(style => (
                        <button
                          key={style.id}
                          className={`w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-[0.3vw] border transition-colors ${selectedIconStyle === style.id ? 'border-gray-800 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                          onClick={() => setSelectedIconStyle(style.id)}
                        >
                          <img src={style.id === 'default' && bareDefaultSrc ? bareDefaultSrc : style.src} className="w-[1.4vw] h-[1.4vw] object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Color */}
                  <div className="flex items-center relative">
                    <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Icon Color :</span>
                    <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                      <div 
                        className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm flex-shrink-0"
                        style={{ background: applyOpacity(iconColor, iconOpacity) }}
                        onClick={() => setActiveColorPicker(activeColorPicker === 'icon' ? null : 'icon')}
                      ></div>
                      <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw] min-w-0">
                        <input
                          type="text"
                          className="text-[0.65vw] text-gray-600 uppercase font-mono bg-transparent outline-none flex-1 min-w-0"
                          value={iconColor}
                          onChange={(e) => setIconColor(e.target.value)}
                        />
                        <span 
                          className="text-[0.6vw] flex-shrink-0 ml-[0.5vw] text-gray-400 cursor-ew-resize select-none"
                          onPointerDown={(e) => handleScrubOpacity(e, iconOpacity, setIconOpacity)}
                        >
                          {iconOpacity}%
                        </span>
                      </div>
                    </div>
                    {activeColorPicker === 'icon' && (
                      <div className="absolute top-[-11vw] left-[8vw] z-50">
                        <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setActiveColorPicker(null); }} />
                        <div className="relative">
                          <ColorPicker color={iconColor} onChange={setIconColor} opacity={iconOpacity} onOpacityChange={setIconOpacity} onClose={() => setActiveColorPicker(null)} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bg Color */}
                  <div className="flex items-center relative">
                    <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Bg Color :</span>
                    <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                      <div 
                        className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm flex-shrink-0"
                        style={{ background: applyOpacity(bgColor, bgOpacity) }}
                        onClick={() => setActiveColorPicker(activeColorPicker === 'bg' ? null : 'bg')}
                      ></div>
                      <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw] min-w-0">
                        <input
                          type="text"
                          className="text-[0.65vw] text-gray-600 uppercase font-mono bg-transparent outline-none flex-1 min-w-0"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                        />
                        <span 
                          className="text-[0.6vw] flex-shrink-0 ml-[0.5vw] text-gray-400 cursor-ew-resize select-none"
                          onPointerDown={(e) => handleScrubOpacity(e, bgOpacity, setBgOpacity)}
                        >
                          {bgOpacity}%
                        </span>
                      </div>
                    </div>
                    {activeColorPicker === 'bg' && (
                      <div className="absolute top-[-15vw] left-[8vw] z-50">
                        <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setActiveColorPicker(null); }} />
                        <div className="relative">
                          <ColorPicker color={bgColor} onChange={setBgColor} opacity={bgOpacity} onOpacityChange={setBgOpacity} onClose={() => setActiveColorPicker(null)} />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {/* Action Buttons (Moved inside Right Controls with mt-auto for alignment) */}
            <div className="flex justify-end gap-[0.8vw] mt-auto pt-[2.5vh]">
              <button 
                className="px-[1.5vw] py-[0.8vh] text-[0.8vw] font-medium text-gray-700 bg-white border border-gray-200 rounded-[0.4vw] hover:bg-gray-50 flex items-center gap-[0.4vw] transition-colors"
                onClick={onClose}
              >
                <Icon icon="lucide:x" className="text-[0.9vw]" /> Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-[1.5vw] py-[0.8vh] bg-black text-white text-[0.8vw] font-medium rounded-[0.4vw] hover:bg-gray-800 transition-colors flex items-center gap-[0.4vw]"
              >
                <Icon icon="lucide:check" className="text-[0.9vw]" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        body.is-scrubbing, body.is-scrubbing * {
          cursor: ew-resize !important;
          user-select: none !important;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default HotspotCustomizationPopup;
