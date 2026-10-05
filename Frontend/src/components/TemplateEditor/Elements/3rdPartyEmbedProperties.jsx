import React, { useState } from 'react';
import { Replace, Heart, Info } from 'lucide-react';
import Color from '../Color';
import Effect from '../Effect';

const PropertySlider = ({ label, value, onChange, min = 0, max = 100, disabled = false }) => {
  return (
    <div className={`flex items-center justify-between mr-[0.2vw] ml-[0.2vw] ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <span className="text-[0.8vw] font-semibold text-gray-700 w-[5vw]">{label} :</span>
      <div className="flex-grow flex items-center gap-[1vw]">
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={value || 0}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="flex-grow h-[0.25vw] appearance-none cursor-pointer bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[0.9vw] [&::-webkit-slider-thumb]:h-[0.9vw] [&::-webkit-slider-thumb]:bg-[#544af4] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(84,74,244,0.6)]"
          style={{
            background: `linear-gradient(to right, #544af4 0%, #544af4 ${((value || 0) - min) / (max - min) * 100}%, #e5e7eb ${((value || 0) - min) / (max - min) * 100}%, #e5e7eb 100%)`,
          }}
        />
        <div className="w-[3.5vw] h-[1.8vw] flex items-center justify-center bg-white border border-gray-200 rounded-[0.4vw] shadow-sm">
          <input
            type="text"
            value={`${value || 0} %`}
            readOnly
            disabled={disabled}
            className="w-full text-center text-[0.8vw] text-gray-700 font-medium outline-none bg-transparent cursor-default"
          />
        </div>
      </div>
    </div>
  );
};

const ThirdPartyEmbedProperties = ({
  selectedElementProps,
  activePageIndex,
  selectedLayerId,
  updateElementAttribute,
  selectedElement
}) => {
  const [embedType, setEmbedType] = useState('web-link');
  const [customCode, setCustomCode] = useState('');
  const [webCodeType, setWebCodeType] = useState('Website');
  const [embedSrc, setEmbedSrc] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [embedWidth, setEmbedWidth] = useState('650');
  const [embedHeight, setEmbedHeight] = useState('400');
  const [opacity, setOpacity] = useState(100);
  const [pageZoom, setPageZoom] = useState(100);
  const [multiPageSync, setMultiPageSync] = useState(false);
  const [url, setUrl] = useState('');

  React.useEffect(() => {
    if (embedType === 'embed-code') {
      let code = '';
      let finalSrc = embedSrc.trim();
      let error = '';

      if (!finalSrc) {
        setErrorMessage('');
        setCustomCode(`<div style="display:flex; justify-content:center; align-items:center; width:100%; height:100%; background:#f3f4f6; color:#9ca3af; font-family:sans-serif; font-size:24px;">Enter ${webCodeType} URL</div>`);
        return;
      }

      if (finalSrc) {
        const isImage = /\.(jpeg|jpg|gif|png|svg|webp|bmp|ico)([\?#].*)?$/i.test(finalSrc);
        const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)([\?#].*)?$/i.test(finalSrc) || /(?:youtube\.com|youtu\.be)/i.test(finalSrc) || /vimeo\.com/i.test(finalSrc);
        
        if (webCodeType === 'Image' && !isImage) {
          error = 'Please enter a direct image URL (ending in .jpg, .png, etc.)';
        } else if (webCodeType === 'Video' && !isVideo) {
          error = 'Please enter a direct video URL (ending in .mp4, or YouTube/Vimeo link)';
        } else if (webCodeType === 'Website' && (isImage || isVideo)) {
          error = 'Please enter a website URL.';
        }
      }

      setErrorMessage(error);

      if (error) {
        setCustomCode(`<div style="display:flex; justify-content:center; align-items:center; width:100%; height:100%; background:#fee2e2; color:#ef4444; font-family:sans-serif; font-size:24px; text-align:center;">Invalid ${webCodeType} URL</div>`);
        return;
      }

      if (!finalSrc.startsWith('http://') && !finalSrc.startsWith('https://')) {
        finalSrc = 'https://' + finalSrc;
      }

      const ytMatch = finalSrc.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (ytMatch && ytMatch[1]) {
        finalSrc = `https://www.youtube.com/embed/${ytMatch[1]}`;
      }

      if (webCodeType === 'Image') {
        code = `<img src="${finalSrc}" width="100%" height="100%" alt="embed" style="object-fit: cover;" />`;
      } else if (webCodeType === 'Video') {
        if (finalSrc.includes('youtube.com/embed/')) {
          code = `<iframe src="${finalSrc}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else {
          code = `<video src="${finalSrc}" width="100%" height="100%" controls autoplay muted style="object-fit: contain;"></video>`;
        }
      } else if (webCodeType === 'Website') {
        code = `<iframe src="${finalSrc}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
      }
      setCustomCode(code);
    }
  }, [embedType, webCodeType, embedSrc, embedWidth, embedHeight]);

  React.useEffect(() => {
    if (selectedElementProps) {
      if (selectedElementProps['data-iframe-opacity'] !== undefined) {
        setOpacity(Math.round(parseFloat(selectedElementProps['data-iframe-opacity']) * 100));
      } else if (selectedElementProps.opacity !== undefined) {
        setOpacity(Math.round(parseFloat(selectedElementProps.opacity) * 100));
      } else {
        setOpacity(100);
      }
    }
  }, [selectedElementProps?.opacity, selectedElementProps?.['data-iframe-opacity']]);

  React.useEffect(() => {
    if (selectedElementProps) {
      if (selectedElementProps.width !== undefined) {
        setEmbedWidth(Math.round(parseFloat(selectedElementProps.width)).toString());
      }
      if (selectedElementProps.height !== undefined) {
        setEmbedHeight(Math.round(parseFloat(selectedElementProps.height)).toString());
      }
    }
  }, [selectedElementProps?.width, selectedElementProps?.height]);

  // --- UI states for Color ---
  const [openSubSection, setOpenSubSection] = useState('color');
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);

  // --- DERIVED STATE ---
  const backgroundColor = selectedElementProps ? {
    fill: selectedElementProps['data-fill-color'] || 'transparent',
    fillOpacity: selectedElementProps['data-fill-opacity'] ? parseFloat(selectedElementProps['data-fill-opacity']) * 100 : 100,
    stroke: selectedElementProps.stroke || 'none',
    strokeOpacity: selectedElementProps['stroke-opacity'] ? parseFloat(selectedElementProps['stroke-opacity']) * 100 : 100,
    fillType: selectedElementProps['fill-type'] || 'solid',
    fillGradientType: selectedElementProps['fill-gradient-type'] || 'linear',
    fillStops: selectedElementProps['fill-stops'],
    fillAngle: parseFloat(selectedElementProps['fill-angle'] || 0),
    fillRadius: parseFloat(selectedElementProps['fill-radius'] || 100),
    strokeType: selectedElementProps['stroke-type'] || 'solid',
    strokeGradientType: selectedElementProps['stroke-gradient-type'] || 'linear',
    strokeStops: selectedElementProps['stroke-stops'],
    strokeAngle: parseFloat(selectedElementProps['stroke-angle'] || 0),
    strokeRadius: parseFloat(selectedElementProps['stroke-radius'] || 100),
    strokeWeight: parseFloat(selectedElementProps['stroke-width'] || 0),
    strokeDashStyle: ((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) && (selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) !== 'none') ? 'Dashed' : 'Solid',
    strokeDasharrayValue: selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray,
    strokeDashLength: parseInt(((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) === 'none' ? '10,10' : ((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) || '10,10')).split(',')[0]) || 10,
    strokeDashGap: parseInt((((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) === 'none' ? '10,10' : ((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) || '10,10')).split(',')[1] || ((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) === 'none' ? '10,10' : ((selectedElementProps['stroke-dasharray'] || selectedElementProps['data-stroke-dasharray'] || selectedElementProps.strokeDasharray) || '10,10')).split(',')[0])) || 10,
    strokeLinecap: selectedElementProps['stroke-linecap'] || 'butt',
    strokePosition: selectedElementProps['data-stroke-position'] || 'Center',
  } : {};

  const handleSetBackgroundColor = (updater) => {
    const next = typeof updater === 'function' ? updater(backgroundColor) : updater;
    const updates = {};
    if (backgroundColor.fill !== next.fill) updates['data-fill-color'] = next.fill;
    if (backgroundColor.fillOpacity !== next.fillOpacity) updates['data-fill-opacity'] = (next.fillOpacity / 100).toString();
    if (backgroundColor.stroke !== next.stroke) updates['stroke'] = next.stroke;
    if (backgroundColor.strokeOpacity !== next.strokeOpacity) updates['stroke-opacity'] = (next.strokeOpacity / 100).toString();
    if (backgroundColor.strokeWeight !== next.strokeWeight) {
      updates['stroke-width'] = next.strokeWeight.toString();
      updates['strokeWidth'] = next.strokeWeight.toString();
      updates['data-stroke-width'] = next.strokeWeight.toString();
    }
    if (backgroundColor.strokeDashStyle !== next.strokeDashStyle || backgroundColor.strokeDashLength !== next.strokeDashLength || backgroundColor.strokeDashGap !== next.strokeDashGap || backgroundColor.strokeDasharrayValue !== next.strokeDasharrayValue) {
      if (next.strokeDashStyle === 'none' || next.strokeDashStyle === 'Solid') {
        updates['stroke-dasharray'] = 'none';
      } else {
        updates['stroke-dasharray'] = next.strokeDasharrayValue || `${next.strokeDashLength || 10},${next.strokeDashGap || 10}`;
      }
    }
    if (backgroundColor.strokePosition !== next.strokePosition) updates['data-stroke-position'] = next.strokePosition;
    if (backgroundColor.strokeLinecap !== next.strokeLinecap) {
      updates['stroke-linecap'] = next.strokeLinecap;
      updates['stroke-linejoin'] = next.strokeLinecap === 'round' ? 'round' : 'miter';
    }
    if (backgroundColor.fillType !== next.fillType) updates['fill-type'] = next.fillType;
    if (backgroundColor.fillGradientType !== next.fillGradientType) updates['fill-gradient-type'] = next.fillGradientType;
    if (backgroundColor.fillStops !== next.fillStops) updates['fill-stops'] = next.fillStops;
    if (backgroundColor.fillAngle !== next.fillAngle) updates['fill-angle'] = next.fillAngle;
    if (backgroundColor.fillRadius !== next.fillRadius) updates['fill-radius'] = next.fillRadius;

    if (backgroundColor.strokeType !== next.strokeType) updates['stroke-type'] = next.strokeType;
    if (backgroundColor.strokeGradientType !== next.strokeGradientType) updates['stroke-gradient-type'] = next.strokeGradientType;
    if (backgroundColor.strokeStops !== next.strokeStops) updates['stroke-stops'] = next.strokeStops;
    if (backgroundColor.strokeAngle !== next.strokeAngle) updates['stroke-angle'] = next.strokeAngle;
    if (backgroundColor.strokeRadius !== next.strokeRadius) updates['stroke-radius'] = next.strokeRadius;

    if (Object.keys(updates).length > 0) {
      updateElementAttribute(activePageIndex, selectedLayerId, updates);
    }
  };

  const colorsOnPage = React.useMemo(() => {
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const elements = doc.querySelectorAll('[data-fill-color], [data-stroke-color]');
    const colors = new Set();
    elements.forEach(el => {
      const fill = el.getAttribute('data-fill-color');
      const stroke = el.getAttribute('data-stroke-color');
      if (fill && fill !== 'none' && fill !== '#' && !fill.includes('gradient')) colors.add(fill.toUpperCase());
      if (stroke && stroke !== 'none' && stroke !== '#' && !stroke.includes('gradient')) colors.add(stroke.toUpperCase());
    });
    colors.add('#FFFFFF');
    colors.add('#000000');
    return Array.from(colors).slice(0, 12);
  }, [selectedElementProps, activePageIndex]);

  // --- Effects State ---
  const activeEffects = [];
  if (selectedElementProps && selectedElementProps['data-effect-drop-shadow'] === 'true') activeEffects.push('Drop Shadow');
  if (selectedElementProps && selectedElementProps['data-effect-inner-shadow'] === 'true') activeEffects.push('Inner Shadow');
  if (selectedElementProps && selectedElementProps['data-effect-blur'] === 'true') activeEffects.push('Blur');

  const handleSetActiveEffects = (updater) => {
    const currentActive = [];
    if (selectedElementProps['data-effect-drop-shadow'] === 'true') currentActive.push('Drop Shadow');
    if (selectedElementProps['data-effect-inner-shadow'] === 'true') currentActive.push('Inner Shadow');
    if (selectedElementProps['data-effect-blur'] === 'true') currentActive.push('Blur');

    const next = typeof updater === 'function' ? updater(currentActive) : updater;
    const updates = {};
    const hasDropShadow = next.includes('Drop Shadow');
    const hasInnerShadow = next.includes('Inner Shadow');
    const hasBlur = next.includes('Blur');

    if ((selectedElementProps['data-effect-drop-shadow'] === 'true') !== hasDropShadow) updates['data-effect-drop-shadow'] = hasDropShadow ? 'true' : 'false';
    if ((selectedElementProps['data-effect-inner-shadow'] === 'true') !== hasInnerShadow) updates['data-effect-inner-shadow'] = hasInnerShadow ? 'true' : 'false';
    if ((selectedElementProps['data-effect-blur'] === 'true') !== hasBlur) updates['data-effect-blur'] = hasBlur ? 'true' : 'false';

    if (Object.keys(updates).length > 0) updateElementAttribute(activePageIndex, selectedLayerId, updates);
  };

  const effectSettings = selectedElementProps ? {
    'Drop Shadow': {
      x: parseInt(selectedElementProps['data-effect-drop-shadow-x'] || 2),
      y: parseInt(selectedElementProps['data-effect-drop-shadow-y'] || 2),
      blur: parseInt(selectedElementProps['data-effect-drop-shadow-blur'] || 0),
      spread: parseInt(selectedElementProps['data-effect-drop-shadow-spread'] || 0),
      color: selectedElementProps['data-effect-drop-shadow-color'] || '#000000',
      opacity: parseInt(selectedElementProps['data-effect-drop-shadow-opacity'] || 35),
    },
    'Inner Shadow': {
      x: parseInt(selectedElementProps['data-effect-inner-shadow-x'] || 2),
      y: parseInt(selectedElementProps['data-effect-inner-shadow-y'] || 2),
      blur: parseInt(selectedElementProps['data-effect-inner-shadow-blur'] || 0),
      spread: parseInt(selectedElementProps['data-effect-inner-shadow-spread'] || 0),
      color: selectedElementProps['data-effect-inner-shadow-color'] || '#000000',
      opacity: parseInt(selectedElementProps['data-effect-inner-shadow-opacity'] || 35),
    },
    'Blur': {
      blur: parseFloat(selectedElementProps['data-effect-blur-value'] !== undefined ? selectedElementProps['data-effect-blur-value'] : (selectedElementProps['data-effect-blur-blur'] || 0.3)),
      spread: parseInt(selectedElementProps['data-effect-blur-spread'] || 0),
      clipContent: selectedElementProps['data-effect-blur-clip'] === 'true'
    }
  } : {};

  const handleSetEffectSettings = (updater) => {
    const next = typeof updater === 'function' ? updater(effectSettings) : updater;
    const updates = {};
    ['Drop Shadow', 'Inner Shadow'].forEach(type => {
      const prefix = type === 'Drop Shadow' ? 'drop-shadow' : 'inner-shadow';
      if (effectSettings[type].x !== next[type].x) updates[`data-effect-${prefix}-x`] = next[type].x.toString();
      if (effectSettings[type].y !== next[type].y) updates[`data-effect-${prefix}-y`] = next[type].y.toString();
      if (effectSettings[type].blur !== next[type].blur) updates[`data-effect-${prefix}-blur`] = next[type].blur.toString();
      if (effectSettings[type].spread !== next[type].spread) updates[`data-effect-${prefix}-spread`] = next[type].spread.toString();
      if (effectSettings[type].color !== next[type].color) updates[`data-effect-${prefix}-color`] = next[type].color;
      if (effectSettings[type].opacity !== next[type].opacity) updates[`data-effect-${prefix}-opacity`] = next[type].opacity.toString();
    });

    if (effectSettings['Blur'].blur !== next['Blur'].blur) updates[`data-effect-blur-value`] = next['Blur'].blur.toString();
    if (effectSettings['Blur'].spread !== next['Blur'].spread) updates[`data-effect-blur-spread`] = next['Blur'].spread.toString();
    if (effectSettings['Blur'].clipContent !== next['Blur'].clipContent) updates[`data-effect-blur-clip`] = next['Blur'].clipContent ? 'true' : 'false';

    if (Object.keys(updates).length > 0) updateElementAttribute(activePageIndex, selectedLayerId, updates);
  };


  if (!selectedElementProps) return null;

  // 1. Sync URL from DOM to State when selectedElement changes
  React.useEffect(() => {
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (frameGroup) {
      const currentUrl = frameGroup.getAttribute('data-url') || '';
      setUrl(currentUrl);
      
      const currentCode = frameGroup.getAttribute('data-custom-code') || '';
      setCustomCode(currentCode);
      
      let currentW = '650';
      let currentH = '400';
      const rect = frameGroup.querySelector('rect[pointer-events="all"]') || frameGroup.querySelector('rect.svg-image-stroke-overlay');
      if (rect) {
        currentW = Math.round(parseFloat(rect.getAttribute('width')) || 650).toString();
        currentH = Math.round(parseFloat(rect.getAttribute('height')) || 400).toString();
      }

      const srcMatch = currentCode.match(/src="([^"]*)"/);
      
      if (srcMatch) setEmbedSrc(srcMatch[1]);
      setEmbedWidth(currentW);
      setEmbedHeight(currentH);
      
      if (currentCode.includes('<img')) setWebCodeType('Image');
      else if (currentCode.includes('<video')) setWebCodeType('Video');
      else if (currentCode.includes('<iframe')) setWebCodeType('Website');
      
      const currentType = frameGroup.getAttribute('data-embed-type') || (currentCode ? 'embed-code' : 'web-link');
      setEmbedType(currentType);
      
      // Force pointer-events fix on existing frames
      const pointerRect = frameGroup.querySelector('rect[pointer-events="all"]');
      if (pointerRect && (currentUrl.trim() !== '' || currentCode.trim() !== '')) {
        pointerRect.setAttribute('pointer-events', 'none');
      }
    }
  }, [selectedElement]);

  // 2. Sync State to DOM when URL changes
  React.useEffect(() => {
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (!frameGroup) return;

    const currentUrl = frameGroup.getAttribute('data-url') || '';
    const currentCode = frameGroup.getAttribute('data-custom-code') || '';
    const currentType = frameGroup.getAttribute('data-embed-type') || 'web-link';

    let currentW = 400, currentH = 300;
    const domRect = frameGroup.querySelector('rect[pointer-events="all"]') || frameGroup.querySelector('rect.svg-image-stroke-overlay');
    if (domRect) {
      currentW = parseFloat(domRect.getAttribute('width')) || 400;
      currentH = parseFloat(domRect.getAttribute('height')) || 300;
    }

    const inputW = parseFloat(embedWidth) || currentW;
    const inputH = parseFloat(embedHeight) || currentH;

    if (url === currentUrl && customCode === currentCode && embedType === currentType && inputW === currentW && inputH === currentH) return;

    const timeoutId = setTimeout(() => {
      frameGroup.setAttribute('data-url', url);
      frameGroup.setAttribute('data-custom-code', customCode);
      frameGroup.setAttribute('data-embed-type', embedType);

      let w = inputW, h = inputH;

      const strokeColor = frameGroup.getAttribute('data-stroke-color') || 'transparent';
      const strokeWidth = frameGroup.getAttribute('data-stroke-width') || '0';
      const strokeDash = frameGroup.getAttribute('data-stroke-dasharray') || 'none';
      const strokeOpacity = frameGroup.getAttribute('data-stroke-opacity') || '1';
      const strokeAttrs = `stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" ${strokeDash !== 'none' ? `stroke-dasharray="${strokeDash}"` : ''}`;

      const fillColor = frameGroup.getAttribute('data-fill-color') || 'transparent';
      const fillOpacity = frameGroup.getAttribute('data-fill-opacity') || '1';
      const iframeOpacity = frameGroup.getAttribute('data-iframe-opacity') ?? frameGroup.getAttribute('opacity') ?? '1';

      if (embedType === 'web-link' && url.trim() !== '') {
        let fullUrl = url.trim();
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
          fullUrl = 'https://' + fullUrl;
        }

        frameGroup.innerHTML = `
          <rect class="embed-fill-layer" x="0" y="0" width="${w}" height="${h}" fill="${fillColor}" opacity="${fillOpacity}" pointer-events="none" />
          <g class="embed-content-group" opacity="${iframeOpacity}" pointer-events="none">
            <foreignObject x="0" y="0" width="${w}" height="${h}" pointer-events="all">
              <iframe src="${fullUrl}" width="100%" height="100%" style="border:none; background:transparent;" scrolling="auto" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowtransparency="true"></iframe>
            </foreignObject>
          </g>
          <rect class="svg-image-stroke-overlay" x="0" y="0" width="${w}" height="${h}" fill="transparent" pointer-events="none" ${strokeAttrs} />
        `;
      } else if (embedType === 'embed-code' && customCode.trim() !== '') {
        const escapeHtml = (unsafe) => {
          return unsafe
               .replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
        };
        const srcdocHtml = escapeHtml(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;width:100vw;height:100vh;overflow:hidden;} video::-webkit-media-controls { zoom: 1.5; } video, iframe, img { width: 100%; height: 100%; border: none; display: block; }</style></head><body>${customCode}</body></html>`);

        frameGroup.innerHTML = `
          <rect class="embed-fill-layer" x="0" y="0" width="${w}" height="${h}" fill="${fillColor}" opacity="${fillOpacity}" pointer-events="none" />
          <g class="embed-content-group" opacity="${iframeOpacity}" pointer-events="none">
            <foreignObject x="0" y="0" width="${w}" height="${h}" pointer-events="all">
              <iframe srcdoc="${srcdocHtml}" width="100%" height="100%" style="border:none; background:transparent;" scrolling="auto" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowtransparency="true"></iframe>
            </foreignObject>
          </g>
          <rect class="svg-image-stroke-overlay" x="0" y="0" width="${w}" height="${h}" fill="transparent" pointer-events="none" ${strokeAttrs} />
        `;
      } else {
        const cx = (w - 300) / 2;
        const cy = (h - 200) / 2;
        frameGroup.innerHTML = `
          <rect class="embed-fill-layer" x="0" y="0" width="${w}" height="${h}" fill="${fillColor}" opacity="${fillOpacity}" pointer-events="none" />
          <g class="embed-content-group" opacity="${iframeOpacity}" pointer-events="none">
            <rect width="${w}" height="${h}" fill="transparent" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,6" rx="8" />
            <g transform="translate(${cx}, ${cy})">
              <rect x="0" y="0" width="300" height="200" fill="#e5e7eb" rx="12" />
              <path d="M 0 12 Q 0 0 12 0 L 288 0 Q 300 0 300 12 L 300 30 L 0 30 Z" fill="#d1d5db" />
              <circle cx="20" cy="15" r="4" fill="#ffffff" opacity="0.8" />
              <circle cx="35" cy="15" r="4" fill="#ffffff" opacity="0.8" />
              <circle cx="50" cy="15" r="4" fill="#ffffff" opacity="0.8" />
              <g transform="translate(110, 60) scale(3.5)" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.7">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </g>
            </g>
          </g>
          <rect class="svg-image-stroke-overlay" width="${w}" height="${h}" fill="transparent" pointer-events="all" ${strokeAttrs} />
        `;
      }

      if (updateElementAttribute) {
        let node = selectedElement;
        let lastSvg = null;
        while (node) {
          if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
          node = node.parentElement;
        }
        if (lastSvg) {
          const serializer = new XMLSerializer();
          const html = serializer.serializeToString(lastSvg);
          updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [url, customCode, embedType, embedWidth, embedHeight, selectedElement, activePageIndex, selectedLayerId, updateElementAttribute]);

  // 3. Sync fill color to DOM in real-time
  React.useEffect(() => {
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (!frameGroup) return;

    const fillRect = frameGroup.querySelector('.embed-fill-layer');
    if (fillRect) {
      fillRect.setAttribute('fill', backgroundColor.fill);
      fillRect.setAttribute('opacity', (backgroundColor.fillOpacity / 100).toString());
    }
    
    // Clean up legacy fill applied to the group which obscures the iframe
    if (frameGroup.hasAttribute('fill')) {
      frameGroup.removeAttribute('fill');
    }
  }, [backgroundColor.fill, backgroundColor.fillOpacity, selectedElement]);

  // 4. Debounced __dom_sync__ update for color changes
  React.useEffect(() => {
    if (!selectedElement) return;
    const timeoutId = setTimeout(() => {
      if (updateElementAttribute) {
        let node = selectedElement;
        let lastSvg = null;
        while (node) {
          if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
          node = node.parentElement;
        }
        if (lastSvg) {
          const serializer = new XMLSerializer();
          const html = serializer.serializeToString(lastSvg);
          updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
        }
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [backgroundColor.fill, backgroundColor.fillOpacity, backgroundColor.stroke, backgroundColor.strokeOpacity, backgroundColor.strokeWeight, backgroundColor.strokeDashStyle, opacity, selectedElement, activePageIndex, selectedLayerId, updateElementAttribute]);

  // 5. Sync iframe opacity to DOM in real-time
  React.useEffect(() => {
    if (!selectedElement) return;
    const frameGroup = selectedElement.querySelector('[data-type="embed-frame"]') || (selectedElement.getAttribute('data-type') === 'embed-frame' ? selectedElement : null);
    if (!frameGroup) return;

    const innerG = frameGroup.querySelector('g.embed-content-group');
    if (innerG) {
      innerG.setAttribute('opacity', (opacity / 100).toString());
    }
  }, [opacity, selectedElement]);

  return (
    <div className="flex flex-col font-sans h-full">
     

      {/* Web Settings */}
      <div className="flex items-center gap-[0.5vw]">
        <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">3rd Party Embed Properties</span>
        <div className="h-[0.0925vw] bg-gray-200 flex-1" > </div>
      </div>
      
        <div className="flex flex-col gap-[0.8vw] mt-[2vw]">
          <label className="flex items-center gap-[0.4vw] cursor-pointer">
            <input 
              type="radio" 
              name="embed-type" 
              checked={embedType === 'web-link'}
              onChange={() => setEmbedType('web-link')}
              className="w-[0.9vw] h-[0.9vw] text-blue-500 border-gray-300 focus:ring-blue-500"
            />
            <span className={`text-[0.8vw] ${embedType === 'web-link' ? 'text-blue-500' : 'text-gray-600'}`}>Web Link</span>
          </label>
          
          {embedType === 'web-link' && (
            <div className="flex border border-gray-200 rounded-[0.4vw] overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-shadow bg-white ml-[1.3vw]">
              <select className="bg-gray-50 border-r border-gray-200 text-gray-600 text-[0.8vw] px-[0.5vw] py-[0.4vw] outline-none appearance-none cursor-pointer">
                <option>https://</option>
                <option>http://</option>
              </select>
              <input 
                type="text" 
                placeholder="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-[0.6vw] py-[0.4vw] text-[0.8vw] outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
          )}
          
          <label className="flex items-center gap-[0.4vw] cursor-pointer mt-[0.2vw]">
            <input 
              type="radio" 
              name="embed-type" 
              checked={embedType === 'embed-code'}
              onChange={() => setEmbedType('embed-code')}
              className="w-[0.9vw] h-[0.9vw] text-blue-500 border-gray-300 focus:ring-blue-500"
            />
            <span className={`text-[0.8vw] ${embedType === 'embed-code' ? 'text-blue-500' : 'text-gray-600'}`}>Embed Web Code</span>
          </label>
          
          {embedType === 'embed-code' && (
            <div className="flex flex-col ml-[1.3vw]" style={{ width: 'calc(100% - 1.3vw)' }}>
              <div className="flex items-center gap-[1vw] mb-[0.6vw]">
                {['Image', 'Video', 'Website'].map((type) => (
                  <label key={type} className="flex items-center gap-[0.3vw] cursor-pointer">
                    <input 
                      type="radio" 
                      name="web-code-type" 
                      checked={webCodeType === type}
                      onChange={() => setWebCodeType(type)}
                      className="w-[0.8vw] h-[0.8vw] text-blue-500 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-[0.75vw] text-gray-600">{type}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-[0.6vw]">
                <div className="flex flex-col gap-[0.2vw]">
                  <span className="text-[0.7vw] text-gray-500">Source URL</span>
                  <div className={`flex border ${errorMessage ? 'border-red-500' : 'border-gray-200'} rounded-[0.4vw] overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-shadow bg-white`}>
                    {webCodeType === 'Website' && (
                      <select className="bg-gray-50 border-r border-gray-200 text-gray-600 text-[0.8vw] px-[0.5vw] py-[0.4vw] outline-none appearance-none cursor-pointer">
                        <option>https://</option>
                        <option>http://</option>
                      </select>
                    )}
                    <input
                      type="text"
                      placeholder={webCodeType === 'Website' ? "url" : "e.g. https://..."}
                      value={embedSrc}
                      onChange={(e) => setEmbedSrc(e.target.value)}
                      className="flex-1 px-[0.6vw] py-[0.4vw] text-[0.8vw] outline-none text-gray-800 placeholder-gray-400"
                    />
                  </div>
                  {errorMessage && <span className="text-red-500 text-[0.65vw] mt-[0.1vw]">{errorMessage}</span>}
                </div>
                <div className="flex gap-[0.5vw]">
                  <div className="w-1/2 flex flex-col gap-[0.2vw]">
                    <span className="text-[0.7vw] text-gray-500">Width</span>
                    <input
                      type="text"
                      placeholder="e.g. 650"
                      value={embedWidth}
                      onChange={(e) => setEmbedWidth(e.target.value)}
                      className="w-full border border-gray-200 rounded-[0.4vw] p-[0.4vw] text-[0.8vw] outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div className="w-1/2 flex flex-col gap-[0.2vw]">
                    <span className="text-[0.7vw] text-gray-500">Height</span>
                    <input
                      type="text"
                      placeholder="e.g. 400"
                      value={embedHeight}
                      onChange={(e) => setEmbedHeight(e.target.value)}
                      className="w-full border border-gray-200 rounded-[0.4vw] p-[0.4vw] text-[0.8vw] outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-[0.6vw]">
                <span className="text-[0.7vw] text-gray-500 mb-[0.2vw] block">Code Preview:</span>
                <div className="w-full h-[5vw] border border-gray-200 rounded-[0.4vw] p-[0.6vw] text-[0.7vw] bg-gray-50 text-gray-500 overflow-auto whitespace-pre-wrap font-mono select-all">
                  {customCode || 'Select a type and enter a source URL'}
                </div>
              </div>
            </div>
          )}
      </div>

      <div className="border-t border-gray-100 mt-[1vw]"></div>

      
      {/* Opacity */}
      <PropertySlider 
        label="Opacity"
        value={opacity}
        onChange={(val) => {
          setOpacity(val);
          updateElementAttribute(activePageIndex, selectedLayerId, { 
            'data-iframe-opacity': (val / 100).toString(),
            'opacity': '1' 
          });
        }}
        min={0}
        max={100}
      />
      
      <div className="border-t border-gray-100 mt-[1vw]"></div>

      <div className="flex flex-col gap-[1vw]">
        <Color
          openSubSection={openSubSection}
          setOpenSubSection={setOpenSubSection}
          backgroundColor={backgroundColor}
          setBackgroundColor={handleSetBackgroundColor}
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
          hideFill={true}
          hideStrokeAlignment={true}
        />

        <Effect
          openSubSection={openSubSection}
          setOpenSubSection={setOpenSubSection}
          activeEffects={activeEffects}
          setActiveEffects={handleSetActiveEffects}
          effectSettings={effectSettings}
          setEffectSettings={handleSetEffectSettings}
          hideBlur={true}
          hideInnerShadow={true}
        />
      </div>
    </div>
  );
};

export default ThirdPartyEmbedProperties;
