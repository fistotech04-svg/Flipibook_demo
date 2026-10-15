import React from 'react';

const buttonTemplates = [
  {
    id: 'first-button',
    name: 'First Button',
    width: 130,
    height: 42,
    rx: 10,
    fill: '#ffffff',
    stroke: '#1e2538',
    strokeWidth: 1.8,
    text: 'First Button',
    textColor: '#1e2538',
    fontWeight: '500',
    fontSize: 15
  },
  {
    id: 'third-button',
    name: 'Third Button',
    width: 150,
    height: 42,
    fill: '#7e22ce',
    accentColor: '#a855f7',
    text: 'Third Button',
    textColor: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
    isRibbon: true
  },
  {
    id: 'ninth-button',
    name: 'Ninth Button',
    width: 140,
    height: 42,
    rx: 21,
    fill: '#ffffff',
    stroke: '#5b52f9',
    strokeWidth: 2,
    text: 'Ninth Button',
    textColor: '#5b52f9',
    fontWeight: '600',
    fontSize: 15
  },
  {
    id: 'linear-button',
    name: 'Linear Button',
    width: 140,
    height: 42,
    rx: 21,
    isGradient: true,
    gradientColors: ['#9B7CFF', '#F655C8'],
    stroke: 'none',
    strokeWidth: 0,
    text: 'LINEAR',
    textColor: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: '1px'
  },
  {
    id: 'parallelogram-button',
    name: 'Parallelogram Button',
    width: 150,
    height: 42,
    fill: '#00e676',
    text: 'Parallelogram',
    textColor: '#000000',
    fontWeight: '400',
    fontSize: 16,
    fontFamily: 'serif',
    isParallelogram: true
  },
  {
    id: 'diamond-button',
    name: 'Diamond Button',
    width: 150,
    height: 46,
    fill: '#b7007e',
    text: 'Diamond',
    textColor: '#000000',
    fontWeight: '400',
    fontSize: 18,
    fontFamily: 'serif',
    isDiamond: true
  },
  {
    id: 'arrow-button',
    name: 'Arrow Button',
    width: 160,
    height: 48,
    fill: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
    gradientColors: ['#00f2fe', '#4facfe'],
    text: 'arrow',
    textColor: '#000000',
    fontWeight: '400',
    fontSize: 18,
    fontFamily: 'serif',
    isArrow: true
  },
  {
    id: 'skew-button',
    name: 'Skew Button',
    width: 150,
    height: 48,
    fill: 'linear-gradient(90deg, #ff9800 0%, #ff2b00 100%)',
    gradientColors: ['#ff9800', '#ff2b00'],
    text: 'Skew',
    textColor: '#000000',
    fontWeight: '400',
    fontSize: 18,
    fontFamily: 'serif',
    isSkew: true
  },
  {
    id: 'outside-circle-button',
    name: 'Outside Circle Button',
    width: 170,
    height: 48,
    fill: '#e31a61',
    text: 'outside-circle',
    textColor: '#000000',
    fontWeight: '400',
    fontSize: 16,
    fontFamily: 'serif',
    isOutsideCircle: true
  },
  {
    id: 'inset-circle-button',
    name: 'Inset Circle Button',
    width: 160,
    height: 48,
    fill: '#1877f2',
    text: 'inset-circle',
    textColor: '#000000',
    fontWeight: '400',
    fontSize: 16,
    fontFamily: 'serif',
    isInsetCircle: true
  }
];

const ButtonStyle = ({ isFullView }) => {
  const getButtonSvgCode = (template, uniqueId, withTransform = false) => {
    const transformAttr = withTransform ? ' transform="translate(60, 100)"' : '';
    const centerX = template.width / 2;
    const centerY = template.height / 2;

    if (template.isRibbon) {
      const w = template.width;
      const h = template.height;
      const slantDx = Math.round(h * 0.22);
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-shape="ribbon" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="0" fill="none" stroke="none" opacity="0" pointer-events="none" />
          <polygon class="btn-accent-left" points="0,${h} ${slantDx},${h} ${slantDx / 2},${h / 2}" fill="${template.accentColor}" stroke="none" />
          <polygon class="btn-accent-right" points="${w - slantDx},0 ${w},0 ${w - slantDx / 2},${h / 2}" fill="${template.accentColor}" stroke="none" />
          <polygon class="btn-main-poly" points="0,0 ${w - slantDx},0 ${w},${h} ${slantDx},${h}" fill="${template.fill}" stroke="none" />
          <text x="${centerX}" y="${centerY}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle;" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.isParallelogram) {
      const w = template.width;
      const h = template.height;
      const slant = Math.round(h * 0.35); // 15px slant
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-shape="parallelogram" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="0" fill="none" stroke="none" opacity="0" pointer-events="none" />
          <polygon class="btn-main-poly" points="${slant},0 ${w},0 ${w - slant},${h} 0,${h}" fill="${template.fill}" stroke="none" />
          <text x="${centerX}" y="${centerY}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily || '-apple-system'}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily || 'inherit'};" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.isDiamond) {
      const w = template.width;
      const h = template.height;
      const pointDx = Math.round(h * 0.45); // 21px pointed ends
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-shape="diamond" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="0" fill="none" stroke="none" opacity="0" pointer-events="none" />
          <polygon class="btn-main-poly" points="${pointDx},0 ${w - pointDx},0 ${w},${h / 2} ${w - pointDx},${h} ${pointDx},${h} 0,${h / 2}" fill="${template.fill}" stroke="none" />
          <text x="${centerX}" y="${centerY}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily || '-apple-system'}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily || 'inherit'};" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.isArrow) {
      const w = template.width;
      const h = template.height;
      const arrowDx = Math.round(h * 0.45);
      const gradId = `btn-grad-${uniqueId}`;
      const color1 = template.gradientColors?.[0] || '#00f2fe';
      const color2 = template.gradientColors?.[1] || '#4facfe';
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-shape="arrow" cursor="pointer"${transformAttr}>
          <defs>
            <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="${color1}" />
              <stop offset="100%" stop-color="${color2}" />
            </linearGradient>
          </defs>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="0" fill="none" stroke="none" opacity="0" pointer-events="none" />
          <polygon class="btn-main-poly" points="0,0 ${w - arrowDx},0 ${w},${h / 2} ${w - arrowDx},${h} 0,${h} ${arrowDx},${h / 2}" fill="url(#${gradId})" data-fill-color="linear-gradient(90deg, ${color1} 0%, ${color2} 100%)" stroke="none" />
          <text x="${centerX}" y="${centerY}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily || '-apple-system'}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily || 'inherit'};" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.isSkew) {
      const w = template.width;
      const h = template.height;
      const r = 12;
      const s = Math.round(h * 0.25);
      const gradId = `btn-grad-${uniqueId}`;
      const color1 = template.gradientColors?.[0] || '#ff9800';
      const color2 = template.gradientColors?.[1] || '#ff2b00';
      const d = `M ${r},0 L ${w - s - r},0 Q ${w - s},0 ${w - s + 3},${r * 0.6} L ${w - 3},${h - r * 0.6} Q ${w},${h} ${w - r},${h} L ${r},${h} A ${r},${r} 0 0 1 0,${h - r} L 0,${r} A ${r},${r} 0 0 1 ${r},0 Z`;
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-shape="skew" cursor="pointer"${transformAttr}>
          <defs>
            <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="${color1}" />
              <stop offset="100%" stop-color="${color2}" />
            </linearGradient>
          </defs>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="0" fill="none" stroke="none" opacity="0" pointer-events="none" />
          <path class="btn-main-poly" d="${d}" fill="url(#${gradId})" data-fill-color="linear-gradient(90deg, ${color1} 0%, ${color2} 100%)" stroke="none" />
          <text x="${centerX}" y="${centerY}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily || '-apple-system'}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily || 'inherit'};" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.isOutsideCircle) {
      const w = template.width;
      const h = template.height;
      const rTop = 14;
      const rBot = 16;
      const d = `M 0,${h} Q ${rBot * 0.7},${h} ${rBot},${h - rBot} L ${rBot},${rTop} A ${rTop},${rTop} 0 0 1 ${rBot + rTop},0 L ${w - rBot - rTop},0 A ${rTop},${rTop} 0 0 1 ${w - rBot},${rTop} L ${w - rBot},${h - rBot} Q ${w - rBot * 0.7},${h} ${w},${h} Z`;
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-shape="outside-circle" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="0" fill="none" stroke="none" opacity="0" pointer-events="none" />
          <path class="btn-main-poly" d="${d}" fill="${template.fill}" stroke="none" />
          <text x="${centerX}" y="${centerY}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily || '-apple-system'}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily || 'inherit'};" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.isInsetCircle) {
      const w = template.width;
      const h = template.height;
      const r = 12;
      const d = `M 0,${r} A ${r},${r} 0 0 0 ${r},0 L ${w - r},0 A ${r},${r} 0 0 0 ${w},${r} L ${w},${h - r} A ${r},${r} 0 0 0 ${w - r},${h} L ${r},${h} A ${r},${r} 0 0 0 0,${h - r} Z`;
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-shape="inset-circle" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="0" fill="none" stroke="none" opacity="0" pointer-events="none" />
          <path class="btn-main-poly" d="${d}" fill="${template.fill}" stroke="none" />
          <text x="${centerX}" y="${centerY}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily || '-apple-system'}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily || 'inherit'};" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.isGradient) {
      const gradId = `btn-grad-${uniqueId}`;
      const color1 = template.gradientColors?.[0] || '#9B7CFF';
      const color2 = template.gradientColors?.[1] || '#F655C8';
      const letterSpacingAttr = template.letterSpacing ? ` letter-spacing="${template.letterSpacing}"` : '';
      const letterSpacingStyle = template.letterSpacing ? ` letter-spacing: ${template.letterSpacing};` : '';
      return `
        <g id="button-${uniqueId}" data-type="button" cursor="pointer"${transformAttr}>
          <defs>
            <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="${color1}" />
              <stop offset="100%" stop-color="${color2}" />
            </linearGradient>
          </defs>
          <rect class="btn-bg" x="0" y="0" width="${template.width}" height="${template.height}" rx="${template.rx}" fill="url(#${gradId})" data-fill-color="linear-gradient(90deg, ${color1} 0%, ${color2} 100%)" stroke="${template.stroke || 'none'}" stroke-width="${template.strokeWidth || 0}" />
          <text x="${centerX}" y="${centerY}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle"${letterSpacingAttr} style="text-anchor: middle; dominant-baseline: middle;${letterSpacingStyle}" data-type="text">${template.text}</text>
        </g>
      `;
    }

    return `
      <g id="button-${uniqueId}" data-type="button" cursor="pointer"${transformAttr}>
        <rect x="0" y="0" width="${template.width}" height="${template.height}" rx="${template.rx}" fill="${template.fill}" stroke="${template.stroke}" stroke-width="${template.strokeWidth}" />
        <text x="${centerX}" y="${centerY}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle;" data-type="text">${template.text}</text>
      </g>
    `;
  };

  const handleDragStart = (e, template) => {
    const uniqueId = Date.now();
    const svgCode = getButtonSvgCode(template, uniqueId, false);
    
    e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
      type: 'button',
      svgContent: svgCode
    }));
    e.dataTransfer.setData('text/plain', 'button');
  };

  const handleClick = (template) => {
    const uniqueId = Date.now();
    const svgCode = getButtonSvgCode(template, uniqueId, true);
    
    window.dispatchEvent(new CustomEvent('add-element-to-editor', {
      detail: { svgContent: svgCode }
    }));
  };

  return (
    <div className={`w-full grid grid-cols-2 gap-[0.6vw] ${isFullView ? 'p-[0.5vw]' : ''}`}>
      {buttonTemplates.map((btn) => (
        <button
          key={btn.id}
          type="button"
          draggable="true"
          onDragStart={(e) => handleDragStart(e, btn)}
          onClick={() => handleClick(btn)}
          className="w-full flex flex-col items-center justify-center p-[0.6vw] bg-white border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50/20 transition-all group cursor-pointer shadow-sm"
          title={`Add ${btn.name}`}
        >
          <div className="w-full py-[0.2vw] flex items-center justify-center">
            <svg viewBox={`0 0 ${btn.width} ${btn.height}`} className="w-full h-auto pointer-events-none select-none max-h-[2.5vw]">
              {(btn.isGradient || btn.isArrow || btn.isSkew) && (
                <defs>
                  <linearGradient id={`preview-grad-${btn.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={btn.gradientColors?.[0] || '#9B7CFF'} />
                    <stop offset="100%" stopColor={btn.gradientColors?.[1] || '#F655C8'} />
                  </linearGradient>
                </defs>
              )}
              {btn.isRibbon ? (
                (() => {
                  const slantDx = Math.round(btn.height * 0.22);
                  return (
                    <>
                      <polygon points={`0,${btn.height} ${slantDx},${btn.height} ${slantDx / 2},${btn.height / 2}`} fill={btn.accentColor} stroke="none" />
                      <polygon points={`${btn.width - slantDx},0 ${btn.width},0 ${btn.width - slantDx / 2},${btn.height / 2}`} fill={btn.accentColor} stroke="none" />
                      <polygon points={`0,0 ${btn.width - slantDx},0 ${btn.width},${btn.height} ${slantDx},${btn.height}`} fill={btn.fill} stroke="none" />
                    </>
                  );
                })()
              ) : btn.isParallelogram ? (
                (() => {
                  const slant = Math.round(btn.height * 0.35);
                  return (
                    <polygon points={`${slant},0 ${btn.width},0 ${btn.width - slant},${btn.height} 0,${btn.height}`} fill={btn.fill} stroke="none" />
                  );
                })()
              ) : btn.isDiamond ? (
                (() => {
                  const pointDx = Math.round(btn.height * 0.45);
                  return (
                    <polygon points={`${pointDx},0 ${btn.width - pointDx},0 ${btn.width},${btn.height / 2} ${btn.width - pointDx},${btn.height} ${pointDx},${btn.height} 0,${btn.height / 2}`} fill={btn.fill} stroke="none" />
                  );
                })()
              ) : btn.isArrow ? (
                (() => {
                  const arrowDx = Math.round(btn.height * 0.45);
                  return (
                    <polygon points={`0,0 ${btn.width - arrowDx},0 ${btn.width},${btn.height / 2} ${btn.width - arrowDx},${btn.height} 0,${btn.height} ${arrowDx},${btn.height / 2}`} fill={`url(#preview-grad-${btn.id})`} stroke="none" />
                  );
                })()
              ) : btn.isSkew ? (
                (() => {
                  const r = 12;
                  const s = Math.round(btn.height * 0.25);
                  const d = `M ${r},0 L ${btn.width - s - r},0 Q ${btn.width - s},0 ${btn.width - s + 3},${r * 0.6} L ${btn.width - 3},${btn.height - r * 0.6} Q ${btn.width},${btn.height} ${btn.width - r},${btn.height} L ${r},${btn.height} A ${r},${r} 0 0 1 0,${btn.height - r} L 0,${r} A ${r},${r} 0 0 1 ${r},0 Z`;
                  return (
                    <path d={d} fill={`url(#preview-grad-${btn.id})`} stroke="none" />
                  );
                })()
              ) : btn.isOutsideCircle ? (
                (() => {
                  const rTop = 14;
                  const rBot = 16;
                  const d = `M 0,${btn.height} Q ${rBot * 0.7},${btn.height} ${rBot},${btn.height - rBot} L ${rBot},${rTop} A ${rTop},${rTop} 0 0 1 ${rBot + rTop},0 L ${btn.width - rBot - rTop},0 A ${rTop},${rTop} 0 0 1 ${btn.width - rBot},${rTop} L ${btn.width - rBot},${btn.height - rBot} Q ${btn.width - rBot * 0.7},${btn.height} ${btn.width},${btn.height} Z`;
                  return (
                    <path d={d} fill={btn.fill} stroke="none" />
                  );
                })()
              ) : btn.isInsetCircle ? (
                (() => {
                  const r = 12;
                  const d = `M 0,${r} A ${r},${r} 0 0 0 ${r},0 L ${btn.width - r},0 A ${r},${r} 0 0 0 ${btn.width},${r} L ${btn.width},${btn.height - r} A ${r},${r} 0 0 0 ${btn.width - r},${btn.height} L ${r},${btn.height} A ${r},${r} 0 0 0 0,${btn.height - r} Z`;
                  return (
                    <path d={d} fill={btn.fill} stroke="none" />
                  );
                })()
              ) : (
                <rect
                  x={btn.strokeWidth ? 1 : 0}
                  y={btn.strokeWidth ? 1 : 0}
                  width={btn.strokeWidth ? btn.width - 2 : btn.width}
                  height={btn.strokeWidth ? btn.height - 2 : btn.height}
                  rx={btn.rx}
                  fill={btn.isGradient ? `url(#preview-grad-${btn.id})` : btn.fill}
                  stroke={btn.stroke || 'none'}
                  strokeWidth={btn.strokeWidth || 0}
                />
              )}
              <text
                x={btn.width / 2}
                y={btn.height / 2}
                fill={btn.textColor}
                fontSize={btn.fontSize}
                fontWeight={btn.fontWeight}
                letterSpacing={btn.letterSpacing || undefined}
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                textAnchor="middle"
                dominantBaseline="middle"
                style={btn.letterSpacing ? { letterSpacing: btn.letterSpacing } : undefined}
              >
                {btn.text}
              </text>
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ButtonStyle;
