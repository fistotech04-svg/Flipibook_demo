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
              {btn.isGradient && (
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
