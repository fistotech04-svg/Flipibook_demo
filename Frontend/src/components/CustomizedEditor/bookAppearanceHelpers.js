export const processBookAppearanceSettings = (settings) => {
  if (!settings) return {};

  const hexToRgba = (hex, opacity = 100) => {
    if (!hex) return '#6B6868';
    let c = hex.substring(1).split('');
    if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    const val = parseInt(c.join(''), 16);
    return `rgba(${(val >> 16) & 255}, ${(val >> 8) & 255}, ${val & 255}, ${opacity / 100})`;
  };

  const shadow = settings.dropShadow || {};

  const positionMap = {
    'Top Left': { x: -15, y: -15 },
    'Top Right': { x: 15, y: -15 },
    'Bottom Left': { x: -15, y: 15 },
    'Bottom Right': { x: 15, y: 15 }
  };

  const pos = positionMap[shadow.position] || { x: 15, y: 15 };
  const strength = shadow.strength ?? 35;
  const softness = shadow.softness ?? 35;
  const shadowColor = `rgba(0, 0, 0, ${strength / 100})`;

  const shadowStyle = shadow.active !== false
    ? `${pos.x}px ${pos.y}px ${softness}px 0px ${shadowColor}`
    : 'none';

  const shadowFilter = shadow.active !== false
    ? `drop-shadow(${pos.x}px ${pos.y}px ${softness}px ${shadowColor})`
    : 'none';

  const cornerMap = { 'Sharp': '0px', 'Soft': '5px', 'Round': '10px' };
  const cornerRadius = cornerMap[settings.corner] || '0px';

  // Base Flip Time Maps
  const speedMap = { 'Slow': 1700, 'Medium': 1200, 'Fast': 800 };
  let flipTime = speedMap[settings.flipSpeed] || 1000;

  // Add flip style alterations to flip time / stiffness where possible
  const styleMapTimeModifiers = {
    'Fast Flip': 0.6,
    'Smooth Flip': 1.0,
    'Classic Flip': 1.4
  };
  
  if (settings.flipStyle && styleMapTimeModifiers[settings.flipStyle]) {
      flipTime = Math.max(300, flipTime * styleMapTimeModifiers[settings.flipStyle]);
  }

  // Paper textures and warmth removed

  return {
    shadowStyle,
    shadowFilter,
    cornerRadius,
    pageOpacity: typeof settings.opacity !== 'undefined' ? settings.opacity / 100 : 1, // Modified to carry layout visual opacity rather than strictly 1
    flipTime,
    flipStyle: settings.flipStyle || 'Classic Flip',
    hardCover: !!settings.hardCover,
    shadowActive: shadow.active !== false
  };
};


export const getShadowWidth = (currentIndex, totalPages, singlePageWidth) => {
  // Cover (Page 0)
  if (currentIndex === 0) return singlePageWidth;
  
  // Last Page
  if (totalPages > 0 && currentIndex >= totalPages - 1) {
      return singlePageWidth;
  }
  
  // Inner Spreads
  return singlePageWidth * 2;
};

export const getShadowOffset = (currentIndex, totalPages) => {
  // Front Cover (Right side)
  if (currentIndex === 0) return '75%';

  // Last Page
  if (totalPages > 0 && currentIndex >= totalPages - 1) {
      // If index is Even, it's on Right. If Odd, on Left.
      return (currentIndex % 2 === 0) ? '75%' : '25%';
  }

  // Inner Spreads (Centered)
  return '50%';
};
