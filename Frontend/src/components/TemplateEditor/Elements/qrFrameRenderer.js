/**
 * QR Code Frame Renderer
 * Generates composite QR Code images with custom frames matching the template designs.
 */

// Dynamically load Google fonts for frames
if (typeof document !== 'undefined') {
  if (!document.getElementById('font-caveat-qr')) {
    const link = document.createElement('link');
    link.id = 'font-caveat-qr';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap';
    document.head.appendChild(link);
  }
  if (!document.getElementById('font-poppins-qr')) {
    const link = document.createElement('link');
    link.id = 'font-poppins-qr';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }
  if (!document.getElementById('font-extra-qr')) {
    const link = document.createElement('link');
    link.id = 'font-extra-qr';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap';
    document.head.appendChild(link);
  }
}

export const FONT_WEIGHT_MAP = {
  'Regular': '400',
  'Normal': '400',
  'normal': '400',
  '400': '400',
  'Medium': '500',
  'medium': '500',
  '500': '500',
  'Semi Bold': '600',
  'SemiBold': '600',
  'semibold': '600',
  '600': '600',
  'Bold': '700',
  'bold': '700',
  '700': '700',
  'Extra Bold': '800',
  '800': '800'
};

import QRCodeStyling from 'qr-code-styling';
import qrcodeGenerator from 'qrcode-generator';
const qrcode = typeof qrcodeGenerator === 'function' ? qrcodeGenerator : (qrcodeGenerator?.default || qrcodeGenerator);

export const QR_FRAMES = [
  {
    id: 'frame-bottom-bar',
    name: '1. Bottom Banner',
    shortName: 'Bottom Banner',
    defaultText: 'SCAN ME',
    description: 'Thick border box with solid black bottom banner',
    ratio: 334 / 278
  },
  {
    id: 'frame-top-bubble',
    name: '2. Top Speech Bubble',
    shortName: 'Top Bubble',
    defaultText: 'SCAN ME',
    description: 'Border box with top speech bubble pointer',
    ratio: 315 / 270
  },
  {
    id: 'frame-curved-arrow',
    name: '3. Curved Arrow',
    shortName: 'Curved Arrow',
    defaultText: 'Scan me',
    description: 'Clean QR with curved arrow and script lettering',
    ratio: 320 / 280
  },
  {
    id: 'frame-phone',
    name: '4. Smartphone',
    shortName: 'Smartphone',
    defaultText: 'SCAN ME',
    description: 'Smartphone silhouette mockup with screen & speaker',
    ratio: 360 / 260
  },
  {
    id: 'frame-bottom-pointer',
    name: '5. Bottom Pointer',
    shortName: 'Bottom Pointer',
    defaultText: 'SCAN ME',
    description: 'Border box with black banner and upward pointer',
    ratio: 317 / 270
  },
  {
    id: 'frame-simple-text',
    name: '6. Minimalist Text',
    shortName: 'Minimalist Text',
    defaultText: 'SCAN ME',
    description: 'Border box with clean text below',
    ratio: 312 / 270
  },
  {
    id: 'frame-top-header',
    name: '7. Top Header Card',
    shortName: 'Top Header',
    defaultText: 'SCAN ME',
    description: 'Card with solid black header band across top',
    ratio: 334 / 278
  },
  {
    id: 'frame-none',
    name: '8. Clean (No Frame)',
    shortName: 'No Frame',
    defaultText: '',
    description: 'Clean QR Code with no surrounding frame',
    ratio: 1
  }
];

// Helper to draw rounded rectangles with custom per-corner radii
export function drawRoundRect(ctx, x, y, w, h, radius) {
  let r = typeof radius === 'number'
    ? { tl: radius, tr: radius, br: radius, bl: radius }
    : { tl: 0, tr: 0, br: 0, bl: 0, ...radius };

  const maxR = Math.min(w / 2, h / 2);
  r.tl = Math.max(0, Math.min(r.tl, maxR));
  r.tr = Math.max(0, Math.min(r.tr, maxR));
  r.br = Math.max(0, Math.min(r.br, maxR));
  r.bl = Math.max(0, Math.min(r.bl, maxR));

  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
  ctx.lineTo(x + r.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
}

export const loadImg = (src) => new Promise((resolve) => {
  if (!src) return resolve(null);
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

// Cache to store pre-rendered data URLs
const qrImageCache = new Map();

/**
 * Pre-generate default frames for instant drag-and-drop
 */
export async function preloadDefaultFrames() {
  for (const f of QR_FRAMES) {
    try {
      await renderQRWithFrame({
        url: 'https://example.com',
        frame: f.id,
        text: f.defaultText,
        textColor: '#FFFFFF',
        frameBgColor: '#FFFFFF',
        arrowColor: '#000000',
        fontFamily: 'Poppins',
        fontSize: 24,
        fontWeight: 'Semi Bold'
      });
    } catch (e) {
      console.warn('Preload failed for frame', f.id, e);
    }
  }
}

/**
 * Get synchronously cached image or fallback
 */
export function getCachedFrame(frameId, url = 'https://example.com') {
  const frameObj = QR_FRAMES.find(f => f.id === frameId) || QR_FRAMES[0];
  for (const [k, v] of qrImageCache.entries()) {
    try {
      const parsed = JSON.parse(k);
      if (parsed.frame === frameId) {
        return v;
      }
    } catch (_) {}
  }
  // Return dimensions based on ratio
  const width = 50;
  const height = Math.round(width * (frameObj.ratio || 1));
  const defaultApi = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=240x240`;
  return {
    dataUrl: defaultApi,
    totalWidth: width,
    totalHeight: height
  };
}

// Helper: Draw 8 Pattern Styles
function drawModulePattern(ctx, x, y, size, style, color) {
  const S = size;
  const cx = x + S / 2;
  const cy = y + S / 2;
  ctx.fillStyle = color;

  switch (style) {
    case 'rounded-square':
      drawRoundRect(ctx, x + 0.3, y + 0.3, S - 0.6, S - 0.6, S * 0.26);
      ctx.fill();
      break;
    case 'circular-dots':
      ctx.beginPath();
      ctx.arc(cx, cy, S * 0.44, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'extra-rounded':
      drawRoundRect(ctx, x + 0.2, y + 0.2, S - 0.4, S - 0.4, S * 0.46);
      ctx.fill();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(cx, y + 0.3);
      ctx.lineTo(x + S - 0.3, cy);
      ctx.lineTo(cx, y + S - 0.3);
      ctx.lineTo(x + 0.3, cy);
      ctx.closePath();
      ctx.fill();
      break;
    case 'horizontal-bars':
      drawRoundRect(ctx, x, y + S * 0.16, S, S * 0.68, S * 0.22);
      ctx.fill();
      break;
    case 'vertical-bars':
      drawRoundRect(ctx, x + S * 0.16, y, S * 0.68, S, S * 0.22);
      ctx.fill();
      break;
    case 'tiny-pixel':
      ctx.fillRect(x + S * 0.22, y + S * 0.22, S * 0.56, S * 0.56);
      break;
    case 'classic-square':
    default:
      ctx.fillRect(x, y, S + 0.05, S + 0.05);
      break;
  }
}

// Helper: Draw 8 Eye Frame Styles
function drawEyeFrame(ctx, x, y, size, thickness, style, color, backdrop) {
  const S = size;
  const T = thickness;
  ctx.save();

  switch (style) {
    case 'circular-frame': {
      const cx = x + S / 2;
      const cy = y + S / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, S / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = backdrop;
      ctx.beginPath();
      ctx.arc(cx, cy, S / 2 - T, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'rounded-square': {
      const R = S * 0.24;
      drawRoundRect(ctx, x, y, S, S, R);
      ctx.fillStyle = color;
      ctx.fill();

      drawRoundRect(ctx, x + T, y + T, S - 2 * T, S - 2 * T, Math.max(0, R - T));
      ctx.fillStyle = backdrop;
      ctx.fill();
      break;
    }
    case 'octagon': {
      const C = T * 1.8;
      ctx.beginPath();
      ctx.moveTo(x + C, y);
      ctx.lineTo(x + S - C, y);
      ctx.lineTo(x + S, y + C);
      ctx.lineTo(x + S, y + S - C);
      ctx.lineTo(x + S - C, y + S);
      ctx.lineTo(x + C, y + S);
      ctx.lineTo(x, y + S - C);
      ctx.lineTo(x, y + C);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      const c = Math.max(2, C - T * 0.7);
      ctx.beginPath();
      ctx.moveTo(x + T + c, y + T);
      ctx.lineTo(x + S - T - c, y + T);
      ctx.lineTo(x + S - T, y + T + c);
      ctx.lineTo(x + S - T, y + S - T - c);
      ctx.lineTo(x + S - T - c, y + S - T);
      ctx.lineTo(x + T + c, y + S - T);
      ctx.lineTo(x + T, y + S - T - c);
      ctx.lineTo(x + T, y + T + c);
      ctx.closePath();
      ctx.fillStyle = backdrop;
      ctx.fill();
      break;
    }
    case 'squircle': {
      const R = S * 0.38;
      drawRoundRect(ctx, x, y, S, S, R);
      ctx.fillStyle = color;
      ctx.fill();

      drawRoundRect(ctx, x + T, y + T, S - 2 * T, S - 2 * T, Math.max(0, R - T));
      ctx.fillStyle = backdrop;
      ctx.fill();
      break;
    }
    case 'cut-corners': {
      const R = S * 0.44;
      drawRoundRect(ctx, x, y, S, S, { tl: R, tr: 0, br: R, bl: 0 });
      ctx.fillStyle = color;
      ctx.fill();

      drawRoundRect(ctx, x + T, y + T, S - 2 * T, S - 2 * T, {
        tl: Math.max(0, R - T),
        tr: 0,
        br: Math.max(0, R - T),
        bl: 0
      });
      ctx.fillStyle = backdrop;
      ctx.fill();
      break;
    }
    case 'double-border': {
      const b1 = T * 0.42;
      const gap = T * 0.35;
      const b2 = T * 0.42;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, S, S);
      ctx.fillStyle = backdrop;
      ctx.fillRect(x + b1, y + b1, S - 2 * b1, S - 2 * b1);

      const x2 = x + b1 + gap;
      const y2 = y + b1 + gap;
      const S2 = S - 2 * (b1 + gap);
      ctx.fillStyle = color;
      ctx.fillRect(x2, y2, S2, S2);
      ctx.fillStyle = backdrop;
      ctx.fillRect(x2 + b2, y2 + b2, S2 - 2 * b2, S2 - 2 * b2);
      break;
    }
    case 'soft-corners': {
      const R = S * 0.32;
      drawRoundRect(ctx, x, y, S, S, R);
      ctx.fillStyle = color;
      ctx.fill();

      drawRoundRect(ctx, x + T, y + T, S - 2 * T, S - 2 * T, Math.max(0, R - T));
      ctx.fillStyle = backdrop;
      ctx.fill();
      break;
    }
    case 'classic-square':
    default: {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, S, S);
      ctx.fillStyle = backdrop;
      ctx.fillRect(x + T, y + T, S - 2 * T, S - 2 * T);
      break;
    }
  }

  ctx.restore();
}

// Helper: Draw 8 Eye Ball Styles
function drawEyeBall(ctx, cx, cy, size, style, color, backdrop) {
  const B = size;
  const bx = cx - B / 2;
  const by = cy - B / 2;
  ctx.save();
  ctx.fillStyle = color;

  switch (style) {
    case 'circle': {
      ctx.beginPath();
      ctx.arc(cx, cy, B / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'rounded-square': {
      drawRoundRect(ctx, bx, by, B, B, B * 0.28);
      ctx.fill();
      break;
    }
    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(cx, by);
      ctx.lineTo(bx + B, cy);
      ctx.lineTo(cx, by + B);
      ctx.lineTo(bx, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'small-dot': {
      ctx.beginPath();
      ctx.arc(cx, cy, B * 0.32, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'cross': {
      const barW = B * 0.38;
      ctx.fillRect(bx, cy - barW / 2, B, barW);
      ctx.fillRect(cx - barW / 2, by, barW, B);
      break;
    }
    case 'star': {
      const rOuter = B / 2;
      const rInner = B * 0.24;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? rOuter : rInner;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'ring': {
      ctx.beginPath();
      ctx.arc(cx, cy, B / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = backdrop;
      ctx.beginPath();
      ctx.arc(cx, cy, B * 0.28, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'square':
    default: {
      ctx.fillRect(bx, by, B, B);
      break;
    }
  }

  ctx.restore();
}

/**
 * Generates styled base QR code image using qrcode-generator
 * Supports 8 Pattern Styles, 8 Eye Frame Styles, and 8 Eye Ball Styles
 */
export async function generateStyledQRImage({
  url = 'https://example.com',
  qrColor = '#000000',
  backdrop = '#FFFFFF',
  patternStyle = 'classic-square',
  eyeFrame = 'classic-square',
  eyeBall = 'square',
  size = 280
}) {
  try {
    const qr = qrcode(0, 'H');
    qr.addData(url || 'https://example.com');
    qr.make();

    const count = qr.getModuleCount();
    const margin = 2; // 2 modules quiet zone
    const totalModules = count + margin * 2;
    const modSize = size / totalModules;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fill backdrop
    ctx.fillStyle = backdrop || '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Normalize legacy style names
    let normPattern = patternStyle || 'classic-square';
    if (normPattern === 'square') normPattern = 'classic-square';
    if (normPattern === 'dots') normPattern = 'circular-dots';
    if (normPattern === 'rounded') normPattern = 'rounded-square';

    let normEyeFrame = eyeFrame || 'classic-square';
    if (normEyeFrame === 'square') normEyeFrame = 'classic-square';
    if (normEyeFrame === 'rounded') normEyeFrame = 'rounded-square';
    if (normEyeFrame === 'circle') normEyeFrame = 'circular-frame';

    let normEyeBall = eyeBall || 'square';
    if (normEyeBall === 'rounded') normEyeBall = 'rounded-square';

    // Helper: is cell in any of the 3 eyes (including 7x7 and 1-mod quiet zone)
    const isEyeModule = (r, c) => {
      if (r <= 7 && c <= 7) return true; // Top-left
      if (r <= 7 && c >= count - 8) return true; // Top-right
      if (r >= count - 8 && c <= 7) return true; // Bottom-left
      return false;
    };

    // 1. Draw data pattern modules
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (isEyeModule(r, c)) continue;
        if (qr.isDark(r, c)) {
          const x = (c + margin) * modSize;
          const y = (r + margin) * modSize;
          drawModulePattern(ctx, x, y, modSize, normPattern, qrColor);
        }
      }
    }

    // 2. Draw the 3 Eye Frames & Eye Balls
    const eyeSize = 7 * modSize;
    const eyeThickness = modSize;
    const eyeBallSize = 3 * modSize;

    const eyePositions = [
      { x: margin * modSize, y: margin * modSize }, // Top-left
      { x: (count - 7 + margin) * modSize, y: margin * modSize }, // Top-right
      { x: margin * modSize, y: (count - 7 + margin) * modSize } // Bottom-left
    ];

    eyePositions.forEach((pos) => {
      // Clear eye area with backdrop
      ctx.fillStyle = backdrop || '#FFFFFF';
      ctx.fillRect(pos.x, pos.y, eyeSize, eyeSize);

      // Draw Eye Frame
      drawEyeFrame(ctx, pos.x, pos.y, eyeSize, eyeThickness, normEyeFrame, qrColor, backdrop);

      // Draw Eye Ball
      const centerEyeX = pos.x + eyeSize / 2;
      const centerEyeY = pos.y + eyeSize / 2;
      drawEyeBall(ctx, centerEyeX, centerEyeY, eyeBallSize, normEyeBall, qrColor, backdrop);
    });

    const dataUrl = canvas.toDataURL('image/png');
    return await loadImg(dataUrl);
  } catch (err) {
    console.warn('Custom QR generator error, falling back to api.qrserver:', err);
    const hexQr = (qrColor || '#000000').replace('#', '');
    const hexBg = (backdrop || '#FFFFFF').replace('#', '');
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url || 'https://example.com')}&size=${size}x${size}&ecc=H&color=${hexQr}&bgcolor=${hexBg}`;
    return await loadImg(fallbackUrl);
  }
}

/**
 * Renders a framed QR code onto a canvas and returns { dataUrl, totalWidth, totalHeight }
 */
export async function renderQRWithFrame({
  url = 'https://example.com',
  frame = 'frame-bottom-bar',
  text = 'SCAN ME',
  logoSrc = null,
  logoSize = 22,
  logoRadius = 80,
  logoBg = true,
  logoBgColor = '#FFFFFF',
  qrColor = '#000000',
  backdrop = '#FFFFFF',
  patternStyle = 'square',
  eyeFrame = 'square',
  eyeBall = 'square',
  fontFamily = 'Poppins',
  fontSize = 24,
  fontWeight = 'Semi Bold',
  textColor = '#FFFFFF',
  frameBgColor = '#FFFFFF',
  arrowColor = '#000000',
  dropShadow = false,
  scale = 2
}) {
  const cacheKey = JSON.stringify({
    url, frame, text, logoSrc, logoSize, logoRadius, logoBg, logoBgColor,
    qrColor, backdrop, patternStyle, eyeFrame, eyeBall,
    fontFamily, fontSize, fontWeight, textColor, frameBgColor, arrowColor, dropShadow
  });
  if (qrImageCache.has(cacheKey)) {
    return qrImageCache.get(cacheKey);
  }

  // Alias legacy frame names if needed
  let effectiveFrame = frame;
  if (frame === 'frame-badge') effectiveFrame = 'frame-bottom-bar';
  else if (frame === 'frame-bubble') effectiveFrame = 'frame-top-bubble';
  else if (frame === 'frame-polaroid') effectiveFrame = 'frame-simple-text';
  else if (frame === 'frame-elegant') effectiveFrame = 'frame-top-header';

  const baseQRSize = 240;
  const qrImg = await generateStyledQRImage({
    url,
    qrColor,
    backdrop,
    patternStyle,
    eyeFrame,
    eyeBall,
    size: baseQRSize
  });

  if (!qrImg) {
    throw new Error('Failed to load base QR code image');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let totalW = 278;
  let totalH = 334;
  let qrX = 0;
  let qrY = 0;
  let qrRenderSize = 220;

  const labelText = (text !== undefined && text !== null)
    ? text
    : (effectiveFrame === 'frame-curved-arrow' ? 'Scan me' : 'SCAN ME');

  // Layout calculations per frame style
  if (effectiveFrame === 'frame-none') {
    totalW = 240;
    totalH = 240;
    qrRenderSize = 240;
    qrX = 0;
    qrY = 0;
  } else if (effectiveFrame === 'frame-bottom-bar') {
    const bw = 7;
    const padX = 22;
    const padTop = 22;
    const bannerH = 46;
    const gap = 12;
    qrRenderSize = 220;
    const innerW = qrRenderSize + padX * 2;
    totalW = innerW + bw * 2;
    totalH = bw * 2 + padTop + qrRenderSize + gap + bannerH;
    qrX = bw + padX;
    qrY = bw + padTop;
  } else if (effectiveFrame === 'frame-top-bubble') {
    const bw = 7;
    const pad = 18;
    const bubbleH = 34;
    const pointerH = 8;
    qrRenderSize = 220;
    const boxW = qrRenderSize + pad * 2;
    const boxH = qrRenderSize + pad * 2;
    totalW = boxW + bw * 2;
    const boxY = bubbleH + pointerH + 2;
    totalH = boxY + boxH + bw * 2;
    qrX = bw + pad;
    qrY = boxY + bw + pad;
  } else if (effectiveFrame === 'frame-curved-arrow') {
    totalW = 280;
    totalH = 320;
    qrRenderSize = 195;
    qrX = 70;
    qrY = 20;
  } else if (effectiveFrame === 'frame-phone') {
    totalW = 260;
    totalH = 360;
    qrRenderSize = 205;
    const screenX = 14;
    const screenY = 28;
    const screenW = totalW - 28;
    const screenH = 270;
    qrX = screenX + (screenW - qrRenderSize) / 2;
    qrY = screenY + (screenH - qrRenderSize) / 2;
  } else if (effectiveFrame === 'frame-bottom-pointer') {
    const bw = 7;
    const pad = 18;
    const bannerH = 34;
    const pointerH = 8;
    const gap = 5;
    qrRenderSize = 220;
    const boxW = qrRenderSize + pad * 2;
    const boxH = qrRenderSize + pad * 2;
    totalW = boxW + bw * 2;
    totalH = bw * 2 + boxH + gap + pointerH + bannerH;
    qrX = bw + pad;
    qrY = bw + pad;
  } else if (effectiveFrame === 'frame-simple-text') {
    const bw = 7;
    const pad = 18;
    qrRenderSize = 220;
    const boxW = qrRenderSize + pad * 2;
    const boxH = qrRenderSize + pad * 2;
    totalW = boxW + bw * 2;
    totalH = bw * 2 + boxH + 42;
    qrX = bw + pad;
    qrY = bw + pad;
  } else if (effectiveFrame === 'frame-top-header') {
    const bw = 7;
    const padX = 22;
    const headerH = 46;
    const gap = 12;
    const padBottom = 22;
    qrRenderSize = 220;
    const innerW = qrRenderSize + padX * 2;
    totalW = innerW + bw * 2;
    totalH = bw * 2 + headerH + gap + qrRenderSize + padBottom;
    qrX = bw + padX;
    qrY = bw + headerH + gap;
  }

  canvas.width = Math.round(totalW * scale);
  canvas.height = Math.round(totalH * scale);
  ctx.scale(scale, scale);

  // Apply optional drop shadow
  if (dropShadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.shadowOffsetX = 0;
  }

  const safeFontFamily = fontFamily || 'Poppins';
  const safeFontWeight = FONT_WEIGHT_MAP[fontWeight] || (typeof fontWeight === 'number' ? fontWeight : '600');
  const safeFontSize = parseInt(fontSize) || 24;

  // Background and frame decoration render
  if (effectiveFrame === 'frame-none') {
    ctx.fillStyle = frameBgColor || backdrop || '#ffffff';
    ctx.fillRect(0, 0, totalW, totalH);
  } else if (effectiveFrame === 'frame-bottom-bar') {
    const bw = 7;
    const radius = 14;
    const bannerH = 46;

    // Card background
    drawRoundRect(ctx, bw / 2, bw / 2, totalW - bw, totalH - bw, radius);
    ctx.fillStyle = frameBgColor || '#ffffff';
    ctx.fill();

    // Solid bottom banner inside frame
    drawRoundRect(ctx, bw, totalH - bw - bannerH, totalW - bw * 2, bannerH, {
      tl: 0,
      tr: 0,
      br: radius - bw / 2,
      bl: radius - bw / 2
    });
    ctx.fillStyle = arrowColor || '#000000';
    ctx.fill();

    // Banner Text
    ctx.fillStyle = textColor || '#ffffff';
    ctx.font = `${safeFontWeight} ${Math.round(safeFontSize * 0.75)}px "${safeFontFamily}", -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, totalW / 2, totalH - bw - bannerH / 2);

    // Outer thick border
    drawRoundRect(ctx, bw / 2, bw / 2, totalW - bw, totalH - bw, radius);
    ctx.strokeStyle = arrowColor || '#000000';
    ctx.lineWidth = bw;
    ctx.stroke();

  } else if (effectiveFrame === 'frame-top-bubble') {
    const bw = 7;
    const radius = 14;
    const bubbleH = 34;
    const pointerH = 8;
    const bubbleW = 145;
    const boxY = bubbleH + pointerH + 2;
    const boxH = qrRenderSize + 18 * 2;

    // Main QR Box
    drawRoundRect(ctx, bw / 2, boxY + bw / 2, totalW - bw, boxH + bw, radius);
    ctx.fillStyle = frameBgColor || '#ffffff';
    ctx.fill();
    ctx.strokeStyle = arrowColor || '#000000';
    ctx.lineWidth = bw;
    ctx.stroke();

    // Top speech bubble
    const bubbleX = totalW / 2 - bubbleW / 2;
    const bubbleY = 2;
    drawRoundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 7);
    ctx.fillStyle = arrowColor || '#000000';
    ctx.fill();

    // Downward triangle pointer
    ctx.beginPath();
    ctx.moveTo(totalW / 2 - 8, bubbleY + bubbleH);
    ctx.lineTo(totalW / 2, bubbleY + bubbleH + pointerH);
    ctx.lineTo(totalW / 2 + 8, bubbleY + bubbleH);
    ctx.closePath();
    ctx.fill();

    // Speech bubble text
    ctx.fillStyle = textColor || '#ffffff';
    ctx.font = `${safeFontWeight} ${Math.round(safeFontSize * 0.65)}px "${safeFontFamily}", -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, totalW / 2, bubbleY + bubbleH / 2);

  } else if (effectiveFrame === 'frame-curved-arrow') {
    // Card background
    ctx.fillStyle = frameBgColor || '#ffffff';
    ctx.fillRect(0, 0, totalW, totalH);

    // Curved Arrow
    ctx.strokeStyle = arrowColor || '#000000';
    ctx.fillStyle = arrowColor || '#000000';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(52, 250);
    ctx.bezierCurveTo(20, 215, 18, 140, 56, 92);
    ctx.stroke();

    // Arrowhead tip pointing to QR code
    const tipX = 66, tipY = 88;
    const angle = Math.atan2(88 - 98, 66 - 54);
    const headLen = 14;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - headLen * Math.cos(angle - Math.PI / 7),
      tipY - headLen * Math.sin(angle - Math.PI / 7)
    );
    ctx.lineTo(
      tipX - (headLen * 0.6) * Math.cos(angle),
      tipY - (headLen * 0.6) * Math.sin(angle)
    );
    ctx.lineTo(
      tipX - headLen * Math.cos(angle + Math.PI / 7),
      tipY - headLen * Math.sin(angle + Math.PI / 7)
    );
    ctx.closePath();
    ctx.fill();

    // Script text
    ctx.fillStyle = textColor || '#000000';
    ctx.font = `${safeFontWeight} ${safeFontSize}px "${safeFontFamily}", "Caveat", cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, 88, 280);

  } else if (effectiveFrame === 'frame-phone') {
    // Phone body silhouette
    drawRoundRect(ctx, 4, 4, totalW - 8, totalH - 8, 24);
    ctx.fillStyle = arrowColor || '#000000';
    ctx.fill();

    // Speaker slot at top
    drawRoundRect(ctx, totalW / 2 - 16, 14, 32, 4, 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();

    // Small camera dot
    ctx.beginPath();
    ctx.arc(totalW / 2 - 28, 16, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#475569';
    ctx.fill();

    // Phone screen area
    const screenX = 14;
    const screenY = 28;
    const screenW = totalW - 28;
    const screenH = 270;
    drawRoundRect(ctx, screenX, screenY, screenW, screenH, 10);
    ctx.fillStyle = frameBgColor || '#ffffff';
    ctx.fill();

    // Bottom banner text
    ctx.fillStyle = textColor || '#ffffff';
    ctx.font = `${safeFontWeight} ${Math.round(safeFontSize * 0.68)}px "${safeFontFamily}", -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, totalW / 2, 328);

  } else if (effectiveFrame === 'frame-bottom-pointer') {
    const bw = 7;
    const radius = 14;
    const bannerH = 34;
    const pointerH = 8;
    const bannerW = 150;
    const gap = 5;
    const boxH = qrRenderSize + 18 * 2;

    // Main QR Box
    drawRoundRect(ctx, bw / 2, bw / 2, totalW - bw, boxH + bw, radius);
    ctx.fillStyle = frameBgColor || '#ffffff';
    ctx.fill();
    ctx.strokeStyle = arrowColor || '#000000';
    ctx.lineWidth = bw;
    ctx.stroke();

    // Bottom banner with upward pointer
    const bannerY = bw * 2 + boxH + gap + pointerH;
    const pointerTopY = bw * 2 + boxH + gap;

    // Upward pointing triangle
    ctx.beginPath();
    ctx.moveTo(totalW / 2, pointerTopY);
    ctx.lineTo(totalW / 2 - 8, pointerTopY + pointerH + 1);
    ctx.lineTo(totalW / 2 + 8, pointerTopY + pointerH + 1);
    ctx.closePath();
    ctx.fillStyle = arrowColor || '#000000';
    ctx.fill();

    // Banner Pill
    drawRoundRect(ctx, totalW / 2 - bannerW / 2, bannerY, bannerW, bannerH, 6);
    ctx.fill();

    // Banner text
    ctx.fillStyle = textColor || '#ffffff';
    ctx.font = `${safeFontWeight} ${Math.round(safeFontSize * 0.65)}px "${safeFontFamily}", -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, totalW / 2, bannerY + bannerH / 2);

  } else if (effectiveFrame === 'frame-simple-text') {
    const bw = 7;
    const radius = 14;
    const boxH = qrRenderSize + 18 * 2;

    // White backdrop
    ctx.fillStyle = frameBgColor || '#ffffff';
    ctx.fillRect(0, 0, totalW, totalH);

    // Main Box
    drawRoundRect(ctx, bw / 2, bw / 2, totalW - bw, boxH + bw, radius);
    ctx.fillStyle = frameBgColor || '#ffffff';
    ctx.fill();
    ctx.strokeStyle = arrowColor || '#000000';
    ctx.lineWidth = bw;
    ctx.stroke();

    // Clean text underneath
    ctx.fillStyle = textColor || '#000000';
    ctx.font = `${safeFontWeight} ${Math.round(safeFontSize * 0.75)}px "${safeFontFamily}", -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, totalW / 2, boxH + bw * 2 + 20);

  } else if (effectiveFrame === 'frame-top-header') {
    const bw = 7;
    const radius = 16;
    const headerH = 46;

    // White background
    drawRoundRect(ctx, bw / 2, bw / 2, totalW - bw, totalH - bw, radius);
    ctx.fillStyle = frameBgColor || '#ffffff';
    ctx.fill();

    // Top header banner
    drawRoundRect(ctx, bw, bw, totalW - bw * 2, headerH, {
      tl: radius - bw / 2,
      tr: radius - bw / 2,
      br: 0,
      bl: 0
    });
    ctx.fillStyle = arrowColor || '#000000';
    ctx.fill();

    // Header Text
    ctx.fillStyle = textColor || '#ffffff';
    ctx.font = `${safeFontWeight} ${Math.round(safeFontSize * 0.75)}px "${safeFontFamily}", -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, totalW / 2, bw + headerH / 2);

    // Outer thick border
    drawRoundRect(ctx, bw / 2, bw / 2, totalW - bw, totalH - bw, radius);
    ctx.strokeStyle = arrowColor || '#000000';
    ctx.lineWidth = bw;
    ctx.stroke();
  }

  // Turn off shadow before drawing QR code matrix and logo
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw the QR Code image
  ctx.drawImage(qrImg, qrX, qrY, qrRenderSize, qrRenderSize);

  // Draw center logo if present
  if (logoSrc) {
    const logoImg = await loadImg(logoSrc);
    if (logoImg) {
      const logoDim = Math.round((qrRenderSize * logoSize) / 100);
      const logoX = qrX + (qrRenderSize - logoDim) / 2;
      const logoY = qrY + (qrRenderSize - logoDim) / 2;
      const radiusPx = Math.round((logoDim / 2) * ((logoRadius ?? 80) / 100));

      if (logoBg) {
        const pad = 4;
        ctx.save();
        drawRoundRect(ctx, logoX - pad, logoY - pad, logoDim + pad * 2, logoDim + pad * 2, radiusPx + pad);
        ctx.fillStyle = logoBgColor || '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      drawRoundRect(ctx, logoX, logoY, logoDim, logoDim, radiusPx);
      ctx.clip();
      ctx.drawImage(logoImg, logoX, logoY, logoDim, logoDim);
      ctx.restore();
    }
  }

  const dataUrl = canvas.toDataURL('image/png');
  const result = {
    dataUrl,
    totalWidth: totalW,
    totalHeight: totalH
  };
  qrImageCache.set(cacheKey, result);
  return result;
}

// Start preload automatically in browser environments
if (typeof window !== 'undefined') {
  setTimeout(() => {
    preloadDefaultFrames();
  }, 100);
}
