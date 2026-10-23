import React from 'react';

const buttonTemplates = [
  {
    id: 'solid-pill',
    name: 'Solid Pill',
    width: 140,
    height: 42,
    rx: 21,
    fill: '#1e1b4b',
    text: 'Shop Now',
    textColor: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
    iconName: 'ShoppingCart',
    iconColor: '#ffffff',
    hasIcon: true
  },
  {
    id: 'white-pill-badge',
    name: 'White Pill Badge',
    width: 146,
    height: 42,
    rx: 21,
    fill: '#ffffff',
    stroke: '#e2e8f0',
    strokeWidth: 1.5,
    badgeColor: '#1e1b4b',
    text: 'Shop Now',
    textColor: '#1e1b4b',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
    iconName: 'ShoppingCart',
    iconColor: '#ffffff',
    hasIcon: true
  },
  {
    id: 'rect-badge',
    name: 'Rect Badge',
    width: 146,
    height: 42,
    rx: 4,
    fill: '#ffffff',
    stroke: '#e2e8f0',
    strokeWidth: 1.5,
    badgeColor: '#1e1b4b',
    text: 'Shop Now',
    textColor: '#1e1b4b',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
    iconName: 'ShoppingCart',
    iconColor: '#ffffff',
    hasIcon: true
  },
  {
    id: 'app-icon',
    name: 'App Icon',
    width: 130,
    height: 42,
    rx: 14,
    fill: '#60a5fa',
    text: 'Globe',
    textColor: '#ffffff',
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    fontWeight: '500',
    iconName: 'Globe',
    iconColor: '#ffffff',
    hasIcon: true
  },
  {
    id: 'blue-primary',
    name: 'Blue Primary',
    width: 130,
    height: 42,
    rx: 6,
    fill: '#3b82f6',
    text: 'BUTTON',
    textColor: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.8px',
    hasIcon: false
  },
  {
    id: 'social-badge',
    name: 'Social Badge',
    width: 160,
    height: 42,
    rx: 21,
    fill: '#22c55e',
    badgeColor: '#ffffff',
    text: '@Yourusername',
    textColor: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: "'Inter', sans-serif",
    iconName: 'WhatsApp',
    iconColor: '#22c55e',
    hasIcon: true
  },
  {
    id: 'angled-slice',
    name: 'Angled Slice',
    width: 150,
    height: 42,
    rx: 21,
    fill: '#ffffff',
    stroke: '#e2e8f0',
    strokeWidth: 1.5,
    sliceColor: '#f472b6',
    text: 'Contact us',
    textColor: '#000000',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: "'Poppins', sans-serif",
    iconName: 'Phone',
    iconColor: '#ffffff',
    hasIcon: true
  },
  {
    id: 'slanted-border',
    name: 'Slanted Border',
    width: 148,
    height: 42,
    rx: 24,
    fill: '#ffffff',
    stroke: '#a855f7',
    strokeWidth: 2,
    text: 'SETTINGS',
    textColor: '#1e293b',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: "'Poppins', sans-serif",
    letterSpacing: '2px',
    hasIcon: false
  },
  {
    id: 'like-chevron',
    name: 'Like Chevron',
    width: 140,
    height: 42,
    rx: 0,
    fill: '#ffffff',
    stroke: '#ec4899',
    strokeWidth: 2,
    blockColor: '#ec4899',
    text: 'LIKE',
    textColor: '#1e293b',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: "'Poppins', sans-serif",
    letterSpacing: '0.5px',
    iconName: 'Heart',
    iconColor: '#ffffff',
    hasIcon: true
  },
  {
    id: 'upload-ribbon',
    name: 'Upload Ribbon',
    width: 146,
    height: 42,
    rx: 4,
    fill: '#ef4444',
    ribbonColor: '#93c5fd',
    text: 'UPLOAD',
    textColor: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: "'Poppins', sans-serif",
    letterSpacing: '0.8px',
    iconName: 'Upload',
    iconColor: '#ffffff',
    hasIcon: true
  }
];

const generateUniqueId = () => Date.now();

const ButtonStyle = ({ isFullView }) => {
  const getButtonSvgCode = (template, uniqueId, withTransform = false) => {
    const transformAttr = withTransform ? ' transform="translate(60, 100)"' : '';
    const w = template.width;
    const h = template.height;

    if (template.id === 'solid-pill') {
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-template="solid-pill" data-has-icon="true" data-icon-name="ShoppingCart" data-icon-color="#ffffff" data-icon-placement="Left" data-padding-w="0" data-padding-h="0" data-tl="21" data-tr="21" data-bl="21" data-br="21" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="${template.rx}" fill="${template.fill}" stroke="none" />
          <g class="btn-icon" data-icon-name="ShoppingCart" transform="translate(18, 13)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1" fill="#ffffff" stroke="none" />
              <circle cx="20" cy="21" r="1" fill="#ffffff" stroke="none" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </g>
          <text x="82" y="${h / 2 + 1}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily};" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.id === 'white-pill-badge') {
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-template="white-pill-badge" data-has-icon="true" data-icon-name="ShoppingCart" data-icon-color="#ffffff" data-icon-bg-color="${template.badgeColor}" data-icon-placement="Left" data-padding-w="0" data-padding-h="0" data-tl="21" data-tr="21" data-bl="21" data-br="21" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="${template.rx}" fill="${template.fill}" stroke="${template.stroke}" stroke-width="${template.strokeWidth}" />
          <circle class="btn-badge-circle" cx="21" cy="${h / 2}" r="14" fill="${template.badgeColor}" stroke="none" />
          <g class="btn-icon" data-icon-name="ShoppingCart" transform="translate(13, 13)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1" fill="#ffffff" stroke="none" />
              <circle cx="20" cy="21" r="1" fill="#ffffff" stroke="none" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </g>
          <text x="86" y="${h / 2 + 1}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily};" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.id === 'rect-badge') {
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-template="rect-badge" data-has-icon="true" data-icon-name="ShoppingCart" data-icon-color="#ffffff" data-icon-bg-color="${template.badgeColor}" data-icon-placement="Left" data-padding-w="0" data-padding-h="0" data-tl="4" data-tr="4" data-bl="4" data-br="4" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="${template.rx}" fill="${template.fill}" stroke="${template.stroke}" stroke-width="${template.strokeWidth}" />
          <path class="btn-badge-block" d="M 0,${template.rx} A ${template.rx},${template.rx} 0 0 1 ${template.rx},0 L 38,0 L 38,${h} L ${template.rx},${h} A ${template.rx},${template.rx} 0 0 1 0,${h - template.rx} Z" fill="${template.badgeColor}" stroke="none" />
          <g class="btn-icon" data-icon-name="ShoppingCart" transform="translate(11, 13)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1" fill="#ffffff" stroke="none" />
              <circle cx="20" cy="21" r="1" fill="#ffffff" stroke="none" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </g>
          <text x="92" y="${h / 2 + 1}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily};" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.id === 'app-icon') {
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-template="app-icon" data-has-icon="true" data-icon-name="Globe" data-icon-color="#ffffff" data-icon-placement="Left" data-padding-w="0" data-padding-h="0" data-tl="14" data-tr="14" data-bl="14" data-br="14" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="${template.rx}" fill="${template.fill}" stroke="none" />
          <g class="btn-icon" data-icon-name="Globe" transform="translate(18, 13)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </g>
          <text x="76" y="${h / 2 + 1}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily};" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.id === 'blue-primary') {
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-template="blue-primary" data-has-icon="false" data-padding-w="0" data-padding-h="0" data-tl="6" data-tr="6" data-bl="6" data-br="6" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="${template.rx}" fill="${template.fill}" stroke="none" />
          <text x="${w / 2}" y="${h / 2 + 1}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily}" font-weight="${template.fontWeight}" letter-spacing="0.8px" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily}; letter-spacing: 0.8px;" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.id === 'social-badge') {
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-template="social-badge" data-has-icon="true" data-icon-name="WhatsApp" data-icon-color="#22c55e" data-icon-bg-color="${template.badgeColor}" data-icon-placement="Left" data-padding-w="0" data-padding-h="0" data-tl="21" data-tr="21" data-bl="21" data-br="21" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="${template.rx}" fill="${template.fill}" stroke="none" />
          <circle class="btn-badge-circle" cx="21" cy="${h / 2}" r="14" fill="${template.badgeColor}" stroke="none" />
          <g class="btn-icon" data-icon-name="WhatsApp" transform="translate(13, 13)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#22c55e">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          </g>
          <text x="94" y="${h / 2 + 1}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily};" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.id === 'angled-slice') {
      const clipId = `clip-t7-${uniqueId}`;
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-template="angled-slice" data-has-icon="true" data-icon-name="Phone" data-icon-color="#ffffff" data-icon-placement="Left" data-padding-w="0" data-padding-h="0" data-tl="21" data-tr="21" data-bl="21" data-br="21" cursor="pointer"${transformAttr}>
          <defs>
            <clipPath id="${clipId}">
              <rect x="0" y="0" width="${w}" height="${h}" rx="${template.rx}" />
            </clipPath>
          </defs>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="${template.rx}" fill="${template.fill}" stroke="${template.stroke}" stroke-width="${template.strokeWidth}" />
          <g clip-path="url(#${clipId})">
            <polygon points="-5,-5 42,-5 26,${h + 5} -5,${h + 5}" fill="${template.sliceColor}" stroke="none" />
          </g>
          <g class="btn-icon" data-icon-name="Phone" transform="translate(10, 13)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </g>
          <text x="94" y="${h / 2 + 1}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily};" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.id === 'slanted-border') {
      const d = `M 24,0 L ${w - 6},0 A 6,6 0 0 1 ${w},6 L ${w},${h - 24} A 24,24 0 0 1 ${w - 24},${h} L 6,${h} A 6,6 0 0 1 0,${h - 6} L 0,24 A 24,24 0 0 1 24,0 Z`;
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-template="slanted-border" data-has-icon="false" data-padding-w="0" data-padding-h="0" data-tl="24" data-tr="0" data-bl="0" data-br="24" data-corner-linked="false" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="24" fill="none" stroke="none" opacity="0" pointer-events="none" />
          <path class="btn-main-poly" d="${d}" fill="${template.fill}" stroke="${template.stroke}" stroke-width="${template.strokeWidth}" />
          <text x="${w / 2}" y="${h / 2 + 1}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily}" font-weight="${template.fontWeight}" letter-spacing="2px" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily}; letter-spacing: 2px;" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.id === 'like-chevron') {
      const points = `0,0 ${w - 12},0 ${w},${h / 2} ${w - 12},${h} 0,${h}`;
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-template="like-chevron" data-has-icon="true" data-icon-name="Heart" data-icon-color="#ffffff" data-icon-placement="Left" data-padding-w="0" data-padding-h="0" data-tl="0" data-tr="0" data-bl="0" data-br="0" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="0" fill="none" stroke="none" opacity="0" pointer-events="none" />
          <polygon class="btn-main-poly" points="${points}" fill="${template.fill}" stroke="${template.stroke}" stroke-width="${template.strokeWidth}" />
          <polygon points="0,0 36,0 36,${h} 0,${h}" fill="${template.blockColor}" stroke="none" />
          <g class="btn-icon" data-icon-name="Heart" transform="translate(10, 13)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </g>
          <text x="86" y="${h / 2 + 1}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily}" font-weight="${template.fontWeight}" letter-spacing="0.5px" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily}; letter-spacing: 0.5px;" data-type="text">${template.text}</text>
        </g>
      `;
    }

    if (template.id === 'upload-ribbon') {
      return `
        <g id="button-${uniqueId}" data-type="button" data-button-template="upload-ribbon" data-has-icon="true" data-icon-name="Upload" data-icon-color="#ffffff" data-icon-placement="Left" data-padding-w="0" data-padding-h="0" data-tl="4" data-tr="4" data-bl="4" data-br="4" cursor="pointer"${transformAttr}>
          <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="${template.rx}" fill="${template.fill}" stroke="none" />
          <polygon points="0,0 34,0 42,${h / 2} 34,${h} 0,${h}" fill="${template.ribbonColor}" stroke="none" />
          <g class="btn-icon" data-icon-name="Upload" transform="translate(10, 13)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </g>
          <text x="92" y="${h / 2 + 1}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily}" font-weight="${template.fontWeight}" letter-spacing="0.8px" text-anchor="middle" dominant-baseline="middle" style="text-anchor: middle; dominant-baseline: middle; font-family: ${template.fontFamily}; letter-spacing: 0.8px;" data-type="text">${template.text}</text>
        </g>
      `;
    }

    return `
      <g id="button-${uniqueId}" data-type="button" data-padding-w="0" data-padding-h="0" cursor="pointer"${transformAttr}>
        <rect class="btn-bg" x="0" y="0" width="${w}" height="${h}" rx="${template.rx || 6}" fill="${template.fill}" stroke="${template.stroke || 'none'}" stroke-width="${template.strokeWidth || 0}" />
        <text x="${w / 2}" y="${h / 2 + 1}" fill="${template.textColor}" font-size="${template.fontSize}" font-family="${template.fontFamily || '-apple-system'}" font-weight="${template.fontWeight}" text-anchor="middle" dominant-baseline="middle" data-type="text">${template.text}</text>
      </g>
    `;
  };

  const handleDragStart = (e, template) => {
    const uniqueId = generateUniqueId();
    const svgCode = getButtonSvgCode(template, uniqueId, false);
    
    e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
      type: 'button',
      svgContent: svgCode
    }));
    e.dataTransfer.setData('text/plain', 'button');
  };

  const handleClick = (template) => {
    const uniqueId = generateUniqueId();
    const svgCode = getButtonSvgCode(template, uniqueId, true);
    
    window.dispatchEvent(new CustomEvent('add-element-to-editor', {
      detail: { svgContent: svgCode }
    }));
  };

  const displayButtons = isFullView ? buttonTemplates : buttonTemplates.slice(0, 4);

  return (
    <div className={`w-full grid grid-cols-2 gap-[0.6vw] ${isFullView ? 'p-[0.5vw]' : ''}`}>
      {displayButtons.map((btn) => (
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
              {btn.id === 'solid-pill' && (
                <>
                  <rect x="0" y="0" width={btn.width} height={btn.height} rx={btn.rx} fill={btn.fill} />
                  <g transform="translate(18, 13)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1" fill="#ffffff" stroke="none" />
                      <circle cx="20" cy="21" r="1" fill="#ffffff" stroke="none" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </g>
                  <text
                    x="82"
                    y={btn.height / 2 + 1}
                    fill={btn.textColor}
                    fontSize={btn.fontSize}
                    fontFamily={btn.fontFamily}
                    fontWeight={btn.fontWeight}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {btn.text}
                  </text>
                </>
              )}

              {btn.id === 'white-pill-badge' && (
                <>
                  <rect x="1" y="1" width={btn.width - 2} height={btn.height - 2} rx={btn.rx} fill={btn.fill} stroke={btn.stroke} strokeWidth={btn.strokeWidth} />
                  <circle cx="21" cy={btn.height / 2} r="14" fill={btn.badgeColor} />
                  <g transform="translate(13, 13)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1" fill="#ffffff" stroke="none" />
                      <circle cx="20" cy="21" r="1" fill="#ffffff" stroke="none" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </g>
                  <text
                    x="86"
                    y={btn.height / 2 + 1}
                    fill={btn.textColor}
                    fontSize={btn.fontSize}
                    fontFamily={btn.fontFamily}
                    fontWeight={btn.fontWeight}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {btn.text}
                  </text>
                </>
              )}

              {btn.id === 'rect-badge' && (
                <>
                  <rect x="1" y="1" width={btn.width - 2} height={btn.height - 2} rx={btn.rx} fill={btn.fill} stroke={btn.stroke} strokeWidth={btn.strokeWidth} />
                  <path d={`M 0,${btn.rx} A ${btn.rx},${btn.rx} 0 0 1 ${btn.rx},0 L 38,0 L 38,${btn.height} L ${btn.rx},${btn.height} A ${btn.rx},${btn.rx} 0 0 1 0,${btn.height - btn.rx} Z`} fill={btn.badgeColor} />
                  <g transform="translate(11, 13)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1" fill="#ffffff" stroke="none" />
                      <circle cx="20" cy="21" r="1" fill="#ffffff" stroke="none" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </g>
                  <text
                    x="92"
                    y={btn.height / 2 + 1}
                    fill={btn.textColor}
                    fontSize={btn.fontSize}
                    fontFamily={btn.fontFamily}
                    fontWeight={btn.fontWeight}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {btn.text}
                  </text>
                </>
              )}

              {btn.id === 'app-icon' && (
                <>
                  <rect x="0" y="0" width={btn.width} height={btn.height} rx={btn.rx} fill={btn.fill} />
                  <g transform="translate(18, 13)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </g>
                  <text
                    x="76"
                    y={btn.height / 2 + 1}
                    fill={btn.textColor}
                    fontSize={btn.fontSize}
                    fontFamily={btn.fontFamily}
                    fontWeight={btn.fontWeight}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {btn.text}
                  </text>
                </>
              )}

              {btn.id === 'blue-primary' && (
                <>
                  <rect x="0" y="0" width={btn.width} height={btn.height} rx={btn.rx} fill={btn.fill} />
                  <text
                    x={btn.width / 2}
                    y={btn.height / 2 + 1}
                    fill={btn.textColor}
                    fontSize={btn.fontSize}
                    fontFamily={btn.fontFamily}
                    fontWeight={btn.fontWeight}
                    letterSpacing={btn.letterSpacing}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ letterSpacing: btn.letterSpacing }}
                  >
                    {btn.text}
                  </text>
                </>
              )}

              {btn.id === 'social-badge' && (
                <>
                  <rect x="0" y="0" width={btn.width} height={btn.height} rx={btn.rx} fill={btn.fill} />
                  <circle cx="21" cy={btn.height / 2} r="14" fill={btn.badgeColor} />
                  <g transform="translate(13, 13)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#22c55e">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                  </g>
                  <text
                    x="94"
                    y={btn.height / 2 + 1}
                    fill={btn.textColor}
                    fontSize={btn.fontSize}
                    fontFamily={btn.fontFamily}
                    fontWeight={btn.fontWeight}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {btn.text}
                  </text>
                </>
              )}

              {btn.id === 'angled-slice' && (
                <>
                  <defs>
                    <clipPath id="preview-clip-t7">
                      <rect x="0" y="0" width={btn.width} height={btn.height} rx={btn.rx} />
                    </clipPath>
                  </defs>
                  <rect x="1" y="1" width={btn.width - 2} height={btn.height - 2} rx={btn.rx} fill={btn.fill} stroke={btn.stroke} strokeWidth={btn.strokeWidth} />
                  <g clipPath="url(#preview-clip-t7)">
                    <polygon points={`-5,-5 42,-5 26,${btn.height + 5} -5,${btn.height + 5}`} fill={btn.sliceColor} />
                  </g>
                  <g transform="translate(10, 13)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </g>
                  <text
                    x="94"
                    y={btn.height / 2 + 1}
                    fill={btn.textColor}
                    fontSize={btn.fontSize}
                    fontFamily={btn.fontFamily}
                    fontWeight={btn.fontWeight}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {btn.text}
                  </text>
                </>
              )}

              {btn.id === 'slanted-border' && (
                <>
                  <path
                    d={`M 24,0 L ${btn.width - 6},0 A 6,6 0 0 1 ${btn.width},6 L ${btn.width},${btn.height - 24} A 24,24 0 0 1 ${btn.width - 24},${btn.height} L 6,${btn.height} A 6,6 0 0 1 0,${btn.height - 6} L 0,24 A 24,24 0 0 1 24,0 Z`}
                    fill={btn.fill}
                    stroke={btn.stroke}
                    strokeWidth={btn.strokeWidth}
                  />
                  <text
                    x={btn.width / 2}
                    y={btn.height / 2 + 1}
                    fill={btn.textColor}
                    fontSize={btn.fontSize}
                    fontFamily={btn.fontFamily}
                    fontWeight={btn.fontWeight}
                    letterSpacing={btn.letterSpacing}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ letterSpacing: btn.letterSpacing }}
                  >
                    {btn.text}
                  </text>
                </>
              )}

              {btn.id === 'like-chevron' && (
                <>
                  <polygon
                    points={`0,0 ${btn.width - 12},0 ${btn.width},${btn.height / 2} ${btn.width - 12},${btn.height} 0,${btn.height}`}
                    fill={btn.fill}
                    stroke={btn.stroke}
                    strokeWidth={btn.strokeWidth}
                  />
                  <polygon points={`0,0 36,0 36,${btn.height} 0,${btn.height}`} fill={btn.blockColor} stroke="none" />
                  <g transform="translate(10, 13)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </g>
                  <text
                    x="86"
                    y={btn.height / 2 + 1}
                    fill={btn.textColor}
                    fontSize={btn.fontSize}
                    fontFamily={btn.fontFamily}
                    fontWeight={btn.fontWeight}
                    letterSpacing={btn.letterSpacing}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ letterSpacing: btn.letterSpacing }}
                  >
                    {btn.text}
                  </text>
                </>
              )}

              {btn.id === 'upload-ribbon' && (
                <>
                  <rect x="0" y="0" width={btn.width} height={btn.height} rx={btn.rx} fill={btn.fill} />
                  <polygon points={`0,0 34,0 42,${btn.height / 2} 34,${btn.height} 0,${btn.height}`} fill={btn.ribbonColor} />
                  <g transform="translate(10, 13)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </g>
                  <text
                    x="92"
                    y={btn.height / 2 + 1}
                    fill={btn.textColor}
                    fontSize={btn.fontSize}
                    fontFamily={btn.fontFamily}
                    fontWeight={btn.fontWeight}
                    letterSpacing={btn.letterSpacing}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ letterSpacing: btn.letterSpacing }}
                  >
                    {btn.text}
                  </text>
                </>
              )}
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ButtonStyle;
