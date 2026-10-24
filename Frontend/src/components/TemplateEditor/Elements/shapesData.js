/**
 * shapesData.js
 * Pure code definitions for all 20 vector shapes.
 * 
 * Each shape is defined 100% in JavaScript code (vector path data, 
 * styling, dimensions, and editor attributes) without any external .svg files.
 */

/**
 * Generate full SVG string from a shape code definition with optional style overrides.
 * 
 * @param {Object} shape - Shape data object
 * @param {Object} [overrides={}] - Optional style overrides (fill, stroke, strokeWidth, inheritColors)
 * @returns {string} SVG markup string
 */
export const generateShapeSvg = (shape, overrides = {}) => {
  const fill = overrides.inheritColors 
    ? 'inherit' 
    : (overrides.fill !== undefined ? overrides.fill : shape.fill);
  const stroke = overrides.inheritColors 
    ? 'inherit' 
    : (overrides.stroke !== undefined ? overrides.stroke : shape.stroke);
  const strokeWidth = overrides.strokeWidth !== undefined ? overrides.strokeWidth : shape.strokeWidth;

  const joinAttr = shape.strokeLinejoin ? ` stroke-linejoin="${shape.strokeLinejoin}"` : '';
  const capAttr = shape.strokeLinecap ? ` stroke-linecap="${shape.strokeLinecap}"` : '';
  const miterAttr = shape.strokeMiterlimit ? ` stroke-miterlimit="${shape.strokeMiterlimit}"` : '';
  const fillRuleAttr = shape.fillRule ? ` fill-rule="${shape.fillRule}"` : '';

  let extraAttrs = ' data-is-element-shape="true"';
  if (shape.shapeType === 'star') {
    extraAttrs += ` data-shape-type="star" data-count="${shape.count || 5}" data-radius="${shape.radius || 0}" data-cx="${shape.cx || 50}" data-cy="${shape.cy || 50}" data-rx="${shape.rx || 50}" data-ratio="${shape.ratio || 40}"`;
  } else if (shape.shapeType === 'polygon') {
    extraAttrs += ` data-shape-type="polygon" data-count="${shape.count || 3}" data-radius="${shape.radius || 0}" data-cx="${shape.cx || 50}" data-cy="${shape.cy || 50}" data-rx="${shape.rx || 50}"`;
  } else if (shape.shapeType === 'rectangle') {
    const rx = shape.x !== undefined ? shape.x : 14;
    const ry = shape.y !== undefined ? shape.y : 14;
    const rw = shape.rectWidth !== undefined ? shape.rectWidth : ((shape.width || 100) - 28);
    const rh = shape.rectHeight !== undefined ? shape.rectHeight : ((shape.height || 100) - 28);
    extraAttrs += ` data-shape-type="rectangle" x="${rx}" y="${ry}" width="${rw}" height="${rh}"`;
  } else if (shape.shapeType === 'diamond') {
    const rx = shape.x !== undefined ? shape.x : 10;
    const ry = shape.y !== undefined ? shape.y : 10;
    const rw = shape.rectWidth !== undefined ? shape.rectWidth : ((shape.width || 100) - 20);
    const rh = shape.rectHeight !== undefined ? shape.rectHeight : ((shape.height || 100) - 20);
    const r = shape.radius !== undefined ? shape.radius : 17;
    extraAttrs += ` data-shape-type="diamond" data-shape-id="${shape.id || 'rounded-diamond'}" x="${rx}" y="${ry}" width="${rw}" height="${rh}" data-tl="${r}" data-tr="${r}" data-bl="${r}" data-br="${r}" rx="${r}" ry="${r}"`;
  } else if (shape.shapeType === 'ellipse') {
    extraAttrs += ' data-shape-type="ellipse"';
  } else {
    extraAttrs += ' data-shape-type="vector-path"';
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${shape.viewBox || '0 0 100 100'}" width="${shape.width || 100}" height="${shape.height || 100}">
  <path d="${shape.d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${joinAttr}${capAttr}${miterAttr}${fillRuleAttr}${extraAttrs} />
</svg>`;
};

/**
 * Array of all 20 Vector Shapes defined entirely as JavaScript code.
 */
export const SHAPES_DATA = [
  {
    id: 'true-circle',
    name: 'True Circle',
    shapeType: 'ellipse',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    cx: 50,
    cy: 50,
    rx: 50,
    d: 'M 50 10 A 40 40 0 1 0 50 90 A 40 40 0 1 0 50 10 Z',
    fill: '#d8e9feff',
    stroke: '#1E40AF',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: 'squircle-superellipse',
    name: 'Squircle (Superellipse)',
    shapeType: 'vector-path',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    cx: 50,
    cy: 50,
    rx: 50,
    d: 'M 50 10 C 78 10 90 22 90 50 C 90 78 78 90 50 90 C 22 90 10 78 10 50 C 10 22 22 10 50 10 Z',
    fill: '#DDD6FE',
    stroke: '#6D28D9',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: 'rounded-diamond',
    name: 'Rounded Diamond',
    shapeType: 'diamond',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    x: 10,
    y: 10,
    rectWidth: 80,
    rectHeight: 80,
    radius: 17,
    cx: 50,
    cy: 50,
    rx: 50,
    d: 'M 50 12 C 54 12 57 15 61 19 L 85 43 C 89 47 89 53 85 57 L 61 81 C 57 85 54 88 50 88 C 46 88 43 85 39 81 L 15 57 C 11 53 11 47 15 43 L 39 19 C 43 15 46 12 50 12 Z',
    fill: '#fdddefff',
    stroke: '#BE185D',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: 'sharp-hexagon',
    name: 'Sharp Hexagon',
    shapeType: 'polygon',
    count: 6,
    radius: 0,
    cx: 50,
    cy: 50,
    rx: 50,
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    d: 'M 90.0 50.0 L 70.0 84.6 L 30.0 84.6 L 10.0 50.0 L 30.0 15.4 L 70.0 15.4 Z',
    fill: '#e1f2fbff',
    stroke: '#0369A1',
    strokeWidth: '2.5',
    strokeLinejoin: 'miter',
    strokeLinecap: 'square',
    strokeMiterlimit: '4',
    fillRule: 'evenodd'
  },
  {
    id: 'sharp-triangle',
    name: 'Sharp Triangle',
    shapeType: 'polygon',
    count: 3,
    radius: 0,
    cx: 50,
    cy: 50,
    rx: 50,
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    d: 'M 50 12 L 85 78 L 15 78 Z',
    fill: '#f8f4d5ff',
    stroke: '#A16207',
    strokeWidth: '2.5',
    strokeLinejoin: 'miter',
    strokeLinecap: 'square',
    strokeMiterlimit: '4',
    fillRule: 'evenodd'
  },
  {
    id: 'chubby-5-point-star',
    name: 'Chubby 5-Point Star',
    shapeType: 'star',
    count: 5,
    ratio: 40,
    radius: 0,
    cx: 50,
    cy: 50,
    rx: 50,
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    d: 'M 50 10 C 51.5 10 53 11 53.8 13.2 L 60.5 30.5 C 61.5 33 63.8 34.7 66.5 35 L 85 36.8 C 88.5 37.1 89.8 41.2 87.2 43.5 L 73.2 55.8 C 71.1 57.6 70.2 60.5 70.8 63.2 L 75 81.5 C 75.8 84.8 72.2 87.4 69.2 85.6 L 53.5 76 C 51.3 74.7 48.7 74.7 46.5 76 L 30.8 85.6 C 27.8 87.4 24.2 84.8 25 81.5 L 29.2 63.2 C 29.8 60.5 28.9 57.6 26.8 55.8 L 12.8 43.5 C 10.2 41.2 11.5 37.1 15 36.8 L 33.5 35 C 36.2 34.7 38.5 33 39.5 30.5 L 46.2 13.2 C 47 11 48.5 10 50 10 Z',
    fill: '#f8e6d1ff',
    stroke: '#C2410C',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: '4-point-sparkle',
    name: '4-Point Sparkle',
    shapeType: 'star',
    count: 4,
    ratio: 40,
    radius: 0,
    cx: 50,
    cy: 50,
    rx: 50,
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    d: 'M 50 10 C 50 33 67 50 90 50 C 67 50 50 67 50 90 C 50 67 33 50 10 50 C 33 50 50 33 50 10 Z',
    fill: '#e1f8f3ff',
    stroke: '#0F766E',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: 'gemstone-jewel',
    name: 'Gemstone Jewel',
    shapeType: 'vector-path',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    cx: 50,
    cy: 50,
    rx: 50,
    d: 'M 25 15 L 75 15 L 94 38 L 50 89 L 6 38 Z',
    fill: '#e0e6fcff',
    stroke: '#3730A3',
    strokeWidth: '2.5',
    strokeLinejoin: 'miter',
    strokeLinecap: 'square',
    strokeMiterlimit: '4',
    fillRule: 'evenodd'
  },
  {
    id: '8-point-spiky-starburst',
    name: '8-Point Spiky Starburst',
    shapeType: 'star',
    count: 8,
    ratio: 40,
    radius: 0,
    cx: 50,
    cy: 50,
    rx: 50,
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    d: 'M 50.0 6.0 Q 58.8 28.8 81.1 18.9 Q 71.2 41.2 94.0 50.0 Q 71.2 58.8 81.1 81.1 Q 58.8 71.2 50.0 94.0 Q 41.2 71.2 18.9 81.1 Q 28.8 58.8 6.0 50.0 Q 28.8 41.2 18.9 18.9 Q 41.2 28.8 50.0 6.0 Z',
    fill: '#fbe1e4ff',
    stroke: '#9F1239',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: 'stadium-pill-capsule',
    name: 'Stadium Pill (Capsule)',
    shapeType: 'vector-path',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    cx: 50,
    cy: 50,
    rx: 50,
    d: 'M 32 32 A 18 18 0 0 1 68 32 L 68 68 A 18 18 0 0 1 32 68 Z',
    fill: '#e6fff3ff',
    stroke: '#065F46',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: 'arch-tombstone',
    name: 'Arch - Tombstone',
    shapeType: 'vector-path',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    cx: 50,
    cy: 50,
    rx: 50,
    d: 'M 20 88 L 20 46 A 30 30 0 0 1 80 46 L 80 88 Z',
    fill: '#f4ecfcff',
    stroke: '#7E22CE',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: 'diagonal-leaf',
    name: 'Diagonal Leaf',
    shapeType: 'vector-path',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    cx: 50,
    cy: 50,
    rx: 50,
    d: 'M 15 15 C 68 15 85 32 85 85 C 32 85 15 68 15 15 Z',
    fill: '#e8fbefff',
    stroke: '#166534',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: 'reverse-curved-petal',
    name: 'Reverse Curved Petal',
    shapeType: 'vector-path',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    cx: 50,
    cy: 50,
    rx: 50,
    d: 'M 85 15 C 85 68 68 85 15 85 C 15 32 32 15 85 15 Z',
    fill: '#e2fafdff',
    stroke: '#0E7490',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: '6-point-star',
    name: '6-Point Star',
    shapeType: 'star',
    count: 6,
    ratio: 40,
    radius: 0,
    cx: 50,
    cy: 50,
    rx: 50,
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    d: 'M 50.0 6.0 Q 62.5 28.3 88.1 28.0 Q 75.0 50.0 88.1 72.0 Q 62.5 71.7 50.0 94.0 Q 37.5 71.7 11.9 72.0 Q 25.0 50.0 11.9 28.0 Q 37.5 28.3 50.0 6.0 Z',
    fill: '#f7efd0ff',
    stroke: '#B45309',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: 'reuleaux-triangle',
    name: 'Reuleaux Triangle',
    shapeType: 'vector-path',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    cx: 50,
    cy: 50,
    rx: 50,
    d: 'M 50 10 A 78 78 0 0 1 88 76 A 78 78 0 0 1 12 76 A 78 78 0 0 1 50 10 Z',
    fill: '#ecf5ffff',
    stroke: '#334155',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: 'sharp-pentagon',
    name: 'Sharp Pentagon',
    shapeType: 'polygon',
    count: 5,
    radius: 0,
    cx: 50,
    cy: 50,
    rx: 50,
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    d: 'M 50.0 10.0 L 88.0 37.6 L 73.5 82.4 L 26.5 82.4 L 12.0 37.6 Z',
    fill: '#e8f3d3ff',
    stroke: '#4D7C0F',
    strokeWidth: '2.5',
    strokeLinejoin: 'miter',
    strokeLinecap: 'square',
    strokeMiterlimit: '4',
    fillRule: 'evenodd'
  },
  {
    id: 'sharp-octagon',
    name: 'Sharp Octagon',
    shapeType: 'polygon',
    count: 8,
    radius: 0,
    cx: 50,
    cy: 50,
    rx: 50,
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    d: 'M 65.3 13.0 L 87.0 34.7 L 87.0 65.3 L 65.3 87.0 L 34.7 87.0 L 13.0 65.3 L 13.0 34.7 L 34.7 13.0 Z',
    fill: '#fde1e1ff',
    stroke: '#B91C1C',
    strokeWidth: '2.5',
    strokeLinejoin: 'miter',
    strokeLinecap: 'square',
    strokeMiterlimit: '4',
    fillRule: 'evenodd'
  },
  {
    id: 'swallowtail-ribbon-banner',
    name: 'Swallowtail Ribbon Banner',
    shapeType: 'vector-path',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    cx: 50,
    cy: 50,
    rx: 50,
    d: 'M 10 24 H 90 L 80 50 L 90 76 H 10 L 20 50 Z',
    fill: '#d7e3f1ff',
    stroke: '#1D4ED8',
    strokeWidth: '2.5',
    strokeLinejoin: 'miter',
    strokeLinecap: 'square',
    strokeMiterlimit: '4',
    fillRule: 'evenodd'
  },
  {
    id: 'gingko-fan-leaf',
    name: 'Gingko Fan Leaf',
    shapeType: 'vector-path',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    cx: 50,
    cy: 50,
    rx: 50,
    d: 'M 50 92 C 48 68 30 46 12 36 C 26 12 74 12 88 36 C 70 46 52 68 50 92 Z',
    fill: '#f3fbe4ff',
    stroke: '#3F6212',
    strokeWidth: '2.5',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    fillRule: 'evenodd'
  },
  {
    id: 'sharp-square',
    name: 'Sharp Square',
    shapeType: 'rectangle',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    cx: 50,
    cy: 50,
    rx: 50,
    d: 'M 14 14 H 86 V 86 H 14 Z',
    fill: '#fae1edff',
    stroke: '#7e0e48ff',
    strokeWidth: '2.5',
    strokeLinejoin: 'miter',
    strokeLinecap: 'square',
    strokeMiterlimit: '4',
    fillRule: 'evenodd'
  }
].map(shape => ({
  ...shape,
  svgContent: generateShapeSvg(shape)
}));

/**
 * Get a shape by its ID or Name.
 * @param {string} idOrName - Shape ID or Name
 * @returns {Object|undefined}
 */
export const getShapeById = (idOrName) => {
  if (!idOrName) return undefined;
  const query = idOrName.toLowerCase().trim();
  return SHAPES_DATA.find(s => s.id === query || s.name.toLowerCase() === query);
};

export default SHAPES_DATA;
