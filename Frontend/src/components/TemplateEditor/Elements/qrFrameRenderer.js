/**
 * QR Code Frame Renderer
 * Generates composite QR Code images with custom frames matching the template designs.
 */

// Dynamically load handwriting font for cursive frames if needed
if (typeof document !== 'undefined' && !document.getElementById('font-caveat-qr')) {
  const link = document.createElement('link');
  link.id = 'font-caveat-qr';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap';
  document.head.appendChild(link);
}

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
        logoSrc: null,
        logoSize: 22,
        logoBg: true
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
  const cacheKey = JSON.stringify({
    url,
    frame: frameId,
    text: frameObj.defaultText,
    logoSrc: null,
    logoSize: 22,
    logoBg: true
  });
  if (qrImageCache.has(cacheKey)) {
    return qrImageCache.get(cacheKey);
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

/**
 * Renders a framed QR code onto a canvas and returns { dataUrl, totalWidth, totalHeight }
 */
export async function renderQRWithFrame({
  url = 'https://example.com',
  frame = 'frame-bottom-bar',
  text = 'SCAN ME',
  logoSrc = null,
  logoSize = 22,
  logoBg = true,
  scale = 2
}) {
  const cacheKey = JSON.stringify({ url, frame, text, logoSrc, logoSize, logoBg });
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
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url || 'https://example.com')}&size=${baseQRSize}x${baseQRSize}&ecc=H`;
  const qrImg = await loadImg(qrApiUrl);

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

  const labelText = (effectiveFrame === 'frame-curved-arrow')
    ? (text || 'Scan me')
    : (text || 'SCAN ME').toUpperCase();

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

  // Background and frame decoration render
  if (effectiveFrame === 'frame-none') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalW, totalH);
  } else if (effectiveFrame === 'frame-bottom-bar') {
    const bw = 7;
    const radius = 14;
    const bannerH = 46;

    // Card white background
    drawRoundRect(ctx, bw / 2, bw / 2, totalW - bw, totalH - bw, radius);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Solid black bottom banner inside frame
    drawRoundRect(ctx, bw, totalH - bw - bannerH, totalW - bw * 2, bannerH, {
      tl: 0,
      tr: 0,
      br: radius - bw / 2,
      bl: radius - bw / 2
    });
    ctx.fillStyle = '#000000';
    ctx.fill();

    // Banner Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, totalW / 2, totalH - bw - bannerH / 2);

    // Outer thick black border
    drawRoundRect(ctx, bw / 2, bw / 2, totalW - bw, totalH - bw, radius);
    ctx.strokeStyle = '#000000';
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
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = bw;
    ctx.stroke();

    // Top speech bubble
    const bubbleX = totalW / 2 - bubbleW / 2;
    const bubbleY = 2;
    drawRoundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 7);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // Downward triangle pointer
    ctx.beginPath();
    ctx.moveTo(totalW / 2 - 8, bubbleY + bubbleH);
    ctx.lineTo(totalW / 2, bubbleY + bubbleH + pointerH);
    ctx.lineTo(totalW / 2 + 8, bubbleY + bubbleH);
    ctx.closePath();
    ctx.fill();

    // Speech bubble text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, totalW / 2, bubbleY + bubbleH / 2);

  } else if (effectiveFrame === 'frame-curved-arrow') {
    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalW, totalH);

    // Curved Arrow
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
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

    // Cursive script text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 32px "Caveat", "Segoe Script", "Brush Script MT", "Dancing Script", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, 88, 280);

  } else if (effectiveFrame === 'frame-phone') {
    // Phone body silhouette
    drawRoundRect(ctx, 4, 4, totalW - 8, totalH - 8, 24);
    ctx.fillStyle = '#000000';
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
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Bottom banner text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
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
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = bw;
    ctx.stroke();

    // Bottom black banner with upward pointer
    const bannerY = bw * 2 + boxH + gap + pointerH;
    const pointerTopY = bw * 2 + boxH + gap;

    // Upward pointing triangle
    ctx.beginPath();
    ctx.moveTo(totalW / 2, pointerTopY);
    ctx.lineTo(totalW / 2 - 8, pointerTopY + pointerH + 1);
    ctx.lineTo(totalW / 2 + 8, pointerTopY + pointerH + 1);
    ctx.closePath();
    ctx.fillStyle = '#000000';
    ctx.fill();

    // Banner Pill
    drawRoundRect(ctx, totalW / 2 - bannerW / 2, bannerY, bannerW, bannerH, 6);
    ctx.fill();

    // Banner text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, totalW / 2, bannerY + bannerH / 2);

  } else if (effectiveFrame === 'frame-simple-text') {
    const bw = 7;
    const radius = 14;
    const boxH = qrRenderSize + 18 * 2;

    // White backdrop
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalW, totalH);

    // Main Box
    drawRoundRect(ctx, bw / 2, bw / 2, totalW - bw, boxH + bw, radius);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = bw;
    ctx.stroke();

    // Clean text underneath
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, totalW / 2, boxH + bw * 2 + 20);

  } else if (effectiveFrame === 'frame-top-header') {
    const bw = 7;
    const radius = 16;
    const headerH = 46;

    // White background
    drawRoundRect(ctx, bw / 2, bw / 2, totalW - bw, totalH - bw, radius);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Top black header banner
    drawRoundRect(ctx, bw, bw, totalW - bw * 2, headerH, {
      tl: radius - bw / 2,
      tr: radius - bw / 2,
      br: 0,
      bl: 0
    });
    ctx.fillStyle = '#000000';
    ctx.fill();

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, totalW / 2, bw + headerH / 2);

    // Outer thick black border
    drawRoundRect(ctx, bw / 2, bw / 2, totalW - bw, totalH - bw, radius);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = bw;
    ctx.stroke();
  }

  // Draw the QR Code image
  ctx.drawImage(qrImg, qrX, qrY, qrRenderSize, qrRenderSize);

  // Draw center logo if present
  if (logoSrc) {
    const logoImg = await loadImg(logoSrc);
    if (logoImg) {
      const logoDim = Math.round((qrRenderSize * logoSize) / 100);
      const logoX = qrX + (qrRenderSize - logoDim) / 2;
      const logoY = qrY + (qrRenderSize - logoDim) / 2;

      if (logoBg) {
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(logoX - 3, logoY - 3, logoDim + 6, logoDim + 6);
      }
      ctx.drawImage(logoImg, logoX, logoY, logoDim, logoDim);
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
