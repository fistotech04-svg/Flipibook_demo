import React from 'react';
import { Icon } from '@iconify/react';

export const DEFAULT_MAP_DATA = {
  name: 'Fisto Tech Private Limited',
  address: 'Coimbatore , India',
  rating: '4.9',
  reviews: '1500',
  category: 'Animation Studio',
  phone: '',
  image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&auto=format&fit=crop&q=80',
  location: 'Coimbatore, Tamil Nadu',
  gallery: [
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=200&auto=format&fit=crop&q=80'
  ]
};

export const MAP_TEMPLATES = [
  {
    id: 'carousel',
    name: 'Location Carousel',
    description: 'Floating location card with next button & dots',
    badge: 'Popular'
  },
  {
    id: 'actions',
    name: 'Quick Actions',
    description: 'Bottom sheet with Directions, Call & Share buttons',
    badge: 'Action'
  },
  {
    id: 'callout',
    name: 'Pin Callout',
    description: 'Interactive map marker with floating speech bubble',
    badge: 'Clean'
  },
  {
    id: 'gallery',
    name: 'Photo Gallery',
    description: 'Bottom sheet with studio photos & View Details CTA',
    badge: 'Detailed'
  },
  {
    id: 'none',
    name: 'Map Only',
    description: 'Pure interactive map with no card overlay',
    badge: 'Minimal'
  }
];

export const escapeXml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export const getActiveCanvasDimensions = () => {
  let pw = 297, ph = 210;
  try {
    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const svgRoot = editorDoc.querySelector('.flipbook-page-container svg') || 
                    editorDoc.querySelector('.flipbook-page svg') || 
                    editorDoc.querySelector('.page-svg-container svg') || 
                    editorDoc.querySelector('svg[viewBox]');
    if (svgRoot && svgRoot.getAttribute('viewBox')) {
      const vb = svgRoot.getAttribute('viewBox').trim().split(/[\s,]+/).map(Number);
      if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) {
        pw = vb[2];
        ph = vb[3];
      }
    }
  } catch {
    // Canvas dimensions fallback
  }
  return { pw, ph };
};

export const getMapDimensions = (pw, ph) => {
  let targetW, targetH;
  if (pw > ph) {
    // Landscape canvas (e.g. 297 x 210)
    targetW = Math.round(pw * 0.55);
    targetH = Math.round(targetW * (230 / 240));
    if (targetH > ph * 0.82) {
      targetH = Math.round(ph * 0.80);
      targetW = Math.round(targetH * (240 / 230));
    }
  } else {
    // Portrait canvas (e.g. 210 x 297)
    targetW = Math.round(pw * 0.78);
    targetH = Math.round(targetW * (230 / 240));
    if (targetH > ph * 0.58) {
      targetH = Math.round(ph * 0.55);
      targetW = Math.round(targetH * (240 / 230));
    }
  }

  targetW = Math.max(180, Math.min(targetW, pw - (pw > 400 ? 40 : 16)));
  targetH = Math.max(180, Math.min(targetH, ph - (ph > 400 ? 40 : 16)));

  const posX = Math.round((pw - targetW) / 2);
  const posY = Math.round((ph - targetH) / 2);

  return { targetW, targetH, posX, posY };
};

export const generateOverlayHtml = (style, data = {}) => {
  const name = escapeXml(data.name || DEFAULT_MAP_DATA.name);
  const address = escapeXml(data.address || DEFAULT_MAP_DATA.address);
  const rating = escapeXml(data.rating || DEFAULT_MAP_DATA.rating);
  const reviews = escapeXml(data.reviews || DEFAULT_MAP_DATA.reviews);
  const category = escapeXml(data.category || DEFAULT_MAP_DATA.category);
  const phone = escapeXml(data.phone || DEFAULT_MAP_DATA.phone);
  const image = escapeXml(data.image || DEFAULT_MAP_DATA.image);
  const location = data.location || DEFAULT_MAP_DATA.location;
  const gallery = data.gallery || DEFAULT_MAP_DATA.gallery;

  const isDark = String(data.theme || '').toLowerCase().includes('dark');
  const buttonColor = data.buttonColor || '#000000';

  const directionsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(location)}`;
  const shareUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location || name)}`;
  const shortName = name.split(' ')[0] || 'Location';

  const showOpenMapBtn = data.showOpenMapBtn !== false && data.showOpenMapBtn !== 'false';
  const openMapBg = buttonColor && buttonColor !== 'none' && buttonColor !== 'transparent'
    ? buttonColor
    : (isDark ? '#1e293b' : '#00828a');

  // Standard top-left Open in Maps overlay button connected to buttonColor
  const openMapsBtnHtml = showOpenMapBtn ? `
    <!-- Top-Left Open in Maps Button -->
    <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="map-open-maps-btn" title="Open in Google Maps" style="position: absolute; top: 6px; left: 6px; background: ${openMapBg}; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 8.5px; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 4px; pointer-events: auto !important; z-index: 15; cursor: pointer !important; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.22); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <span style="color: #ffffff; font-size: 8.5px; font-weight: 600; line-height: 1;">Open in Maps</span>
      <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important; color: #ffffff;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>
  ` : '';

  if (style === 'none' || style === 'plain') {
    return openMapsBtnHtml;
  }

  // Theme styling tokens
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const cardBorder = isDark ? 'border: 1px solid rgba(255,255,255,0.12);' : '';
  const textTitle = isDark ? '#f9fafb' : '#111827';
  const textSubtitle = isDark ? '#9ca3af' : '#4b5563';
  const textCategory = isDark ? '#9ca3af' : '#6b7280';
  const textReviews = isDark ? '#9ca3af' : '#6b7280';
  const badgeBg = isDark ? '#1e293b' : '#ffffff';
  const badgeBorder = isDark ? 'border: 1px solid rgba(255,255,255,0.15);' : '';
  const shadow = isDark ? 'box-shadow: 0 4px 16px rgba(0,0,0,0.45);' : 'box-shadow: 0 4px 14px rgba(0,0,0,0.15);';
  const dragPill = isDark ? '#475569' : '#d1d5db';
  const secBtnBg = isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';
  const secBtnText = isDark ? '#f9fafb' : buttonColor;

  if (style === 'actions') {
    return `
      ${openMapsBtnHtml}
      <!-- Top Pin Badge -->
      <div class="map-top-badge" style="position: absolute; top: 6px; left: 50%; transform: translateX(-50%); background: ${badgeBg}; ${badgeBorder} border-radius: 999px; padding: 2px 8px 2px 4px; display: flex; align-items: center; gap: 4px; ${shadow} font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; pointer-events: none; z-index: 5; white-space: nowrap !important; max-width: 90%;">
        <div class="map-badge-icon" style="width: 14px; height: 14px; border-radius: 999px; background: #fee2e2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="1" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#ffffff"/></svg>
        </div>
        <div style="display: flex; flex-direction: column; overflow: hidden; min-width: 0;">
          <span class="map-nowrap map-badge-title" data-nowrap="true" style="font-weight: 700; font-size: 9px; color: ${textTitle}; line-height: 1.1; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">${name}</span>
          <span class="map-nowrap map-badge-subtitle" data-nowrap="true" style="font-size: 7.5px; color: ${textSubtitle}; line-height: 1; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">${address}</span>
        </div>
      </div>

      <!-- Bottom Sheet with Actions -->
      <div class="map-card-overlay map-card-actions" style="position: absolute; bottom: 0; left: 0; right: 0; background: ${cardBg}; ${cardBorder} border-radius: 14px 14px 0 0; padding: 5px 8px 6px; ${shadow} font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; pointer-events: auto; z-index: 10; box-sizing: border-box; max-height: 52%; display: flex; flex-direction: column; justify-content: flex-end;">
        <div class="map-drag-pill" style="width: 24px; height: 2.5px; background: ${dragPill}; border-radius: 999px; margin: 0 auto 4px; flex-shrink: 0;"></div>
        <div class="map-biz-row" style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; min-width: 0;">
          <img class="map-biz-img" src="${image}" alt="${name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&amp;auto=format&amp;fit=crop&amp;q=80';" style="width: 32px; height: 32px; border-radius: 5px; object-fit: cover; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);" />
          <div class="map-biz-info" style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
            <div class="map-nowrap map-biz-name" data-nowrap="true" style="font-weight: 700; font-size: 10px; color: ${textTitle}; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; line-height: 1.15;">${name}</div>
            <div class="map-nowrap map-biz-addr" data-nowrap="true" style="font-size: 8px; color: ${textSubtitle}; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; line-height: 1.1;">${address}</div>
            <div class="map-biz-meta" style="display: flex; align-items: center; gap: 2px; margin-top: 1px; line-height: 1;">
              <span class="map-biz-star" style="color: #f59e0b; font-size: 8.5px; line-height: 1;">★</span>
              <span class="map-biz-rating" style="font-size: 8.5px; font-weight: 700; color: ${textTitle};">${rating}</span>
              <span class="map-biz-reviews" style="font-size: 7.5px; color: ${textReviews};">(${reviews})</span>
            </div>
            <div class="map-nowrap map-biz-category" data-nowrap="true" style="font-size: 7.5px; color: ${textCategory}; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${category}</div>
          </div>
        </div>
        <div class="map-actions-row" style="display: flex; gap: 4px; width: 100%; box-sizing: border-box;">
          <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="map-nowrap map-action-btn map-action-btn-primary" data-nowrap="true" style="flex: 1.15; display: flex; align-items: center; justify-content: center; gap: 3px; background: ${buttonColor || '#00828a'}; color: #ffffff; padding: 4px 5px; border-radius: 5px; font-size: 8.5px; font-weight: 600; text-decoration: none; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.25); white-space: nowrap !important; overflow: hidden; min-width: 0;">
            <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            <span class="map-nowrap map-btn-text" data-nowrap="true" style="white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">Directions</span>
          </a>
          <a href="tel:${phone}" class="map-nowrap map-action-btn map-action-btn-secondary" data-nowrap="true" style="flex: 0.9; display: flex; align-items: center; justify-content: center; gap: 3px; background: ${secBtnBg}; color: ${secBtnText}; padding: 4px 5px; border-radius: 5px; font-size: 8.5px; font-weight: 600; text-decoration: none; cursor: pointer; white-space: nowrap !important; overflow: hidden; min-width: 0;">
            <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span class="map-nowrap map-btn-text" data-nowrap="true" style="white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">Call</span>
          </a>
          <a href="${shareUrl}" target="_blank" rel="noopener noreferrer" class="map-nowrap map-action-btn map-action-btn-secondary" data-nowrap="true" style="flex: 0.9; display: flex; align-items: center; justify-content: center; gap: 3px; background: ${secBtnBg}; color: ${secBtnText}; padding: 4px 5px; border-radius: 5px; font-size: 8.5px; font-weight: 600; text-decoration: none; cursor: pointer; white-space: nowrap !important; overflow: hidden; min-width: 0;">
            <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span class="map-nowrap map-btn-text" data-nowrap="true" style="white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">Share</span>
          </a>
        </div>
      </div>
    `;
  }

  if (style === 'callout') {
    return `
      ${openMapsBtnHtml}
      <!-- Tooltip Speech Bubble -->
      <div class="map-card-overlay map-card-callout" style="position: absolute; top: 8%; left: 50%; transform: translateX(-50%); width: 85%; max-width: 220px; background: ${cardBg}; ${cardBorder} border-radius: 10px; padding: 5px 8px; ${shadow} font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; pointer-events: auto; z-index: 10; box-sizing: border-box;">
        <div class="map-biz-row" style="display: flex; align-items: center; gap: 6px;">
          <img class="map-biz-img" src="${image}" alt="${name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&amp;auto=format&amp;fit=crop&amp;q=80';" style="width: 32px; height: 32px; border-radius: 5px; object-fit: cover; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
          <div class="map-biz-info" style="flex: 1; min-width: 0;">
            <div class="map-nowrap map-biz-name" data-nowrap="true" style="font-weight: 700; font-size: 10px; color: ${textTitle}; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; line-height: 1.15;">${name}</div>
            <div class="map-nowrap map-biz-addr" data-nowrap="true" style="font-size: 8px; color: ${textSubtitle}; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${address}</div>
            <div class="map-biz-meta" style="display: flex; align-items: center; gap: 2px; margin-top: 1px;">
              <span class="map-biz-star" style="color: #f59e0b; font-size: 8.5px; line-height: 1;">★</span>
              <span class="map-biz-rating" style="font-size: 8.5px; font-weight: 700; color: ${textTitle};">${rating}</span>
              <span class="map-biz-reviews" style="font-size: 7.5px; color: ${textReviews};">(${reviews})</span>
            </div>
          </div>
          <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="map-action-btn-circle" title="Open in Google Maps" style="width: 20px; height: 20px; border-radius: 999px; border: 1.2px solid ${buttonColor || '#00828a'}; display: flex; align-items: center; justify-content: center; color: ${buttonColor || '#00828a'}; text-decoration: none; flex-shrink: 0; cursor: pointer !important; pointer-events: auto !important;">
            <svg class="svg-icon-override" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 10px !important; height: 10px !important; display: inline-block !important; flex-shrink: 0 !important;"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </div>
        <!-- Downward triangle arrow -->
        <div class="map-callout-arrow" style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 5px solid ${cardBg};"></div>
      </div>

      <!-- Center Pin Marker -->
      <div class="map-center-pin" style="position: absolute; top: 62%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 4px; background: ${badgeBg}; ${badgeBorder} border-radius: 999px; padding: 2px 7px 2px 4px; ${shadow} pointer-events: none; z-index: 5; white-space: nowrap !important; max-width: 80%;">
        <div class="map-badge-icon" style="width: 14px; height: 14px; border-radius: 999px; background: #fee2e2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#ffffff"/></svg>
        </div>
        <span class="map-nowrap map-biz-name" data-nowrap="true" style="font-size: 9px; font-weight: 700; color: ${textTitle}; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${shortName}</span>
      </div>
    `;
  }

  if (style === 'gallery') {
    const galleryItems = gallery && gallery.length ? gallery : DEFAULT_MAP_DATA.gallery;
    return `
      ${openMapsBtnHtml}
      <!-- Top Pin Badge -->
      <div class="map-top-badge" style="position: absolute; top: 6px; left: 50%; transform: translateX(-50%); background: ${badgeBg}; ${badgeBorder} border-radius: 999px; padding: 2px 8px 2px 4px; display: flex; align-items: center; gap: 4px; ${shadow} font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; pointer-events: none; z-index: 5; white-space: nowrap !important; max-width: 90%;">
        <div class="map-badge-icon" style="width: 14px; height: 14px; border-radius: 999px; background: #fee2e2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="1" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#ffffff"/></svg>
        </div>
        <div style="display: flex; flex-direction: column; overflow: hidden; min-width: 0;">
          <span class="map-nowrap map-badge-title" data-nowrap="true" style="font-weight: 700; font-size: 9px; color: ${textTitle}; line-height: 1.1; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">${name}</span>
          <span class="map-nowrap map-badge-subtitle" data-nowrap="true" style="font-size: 7.5px; color: ${textSubtitle}; line-height: 1; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">${address}</span>
        </div>
      </div>

      <!-- Bottom Sheet with Gallery & Action CTA -->
      <div class="map-card-overlay map-card-gallery" style="position: absolute; bottom: 0; left: 0; right: 0; background: ${cardBg}; ${cardBorder} border-radius: 14px 14px 0 0; padding: 5px 8px 6px; ${shadow} font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; pointer-events: auto; z-index: 10; box-sizing: border-box; max-height: 52%; display: flex; flex-direction: column; justify-content: flex-end;">
        <div class="map-drag-pill" style="width: 24px; height: 2.5px; background: ${dragPill}; border-radius: 999px; margin: 0 auto 4px; flex-shrink: 0;"></div>
        <div class="map-biz-row" style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; min-width: 0;">
          <img class="map-biz-img" src="${image}" alt="${name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&amp;auto=format&amp;fit=crop&amp;q=80';" style="width: 30px; height: 30px; border-radius: 5px; object-fit: cover; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);" />
          <div class="map-biz-info" style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
            <div class="map-nowrap map-biz-name" data-nowrap="true" style="font-weight: 700; font-size: 10px; color: ${textTitle}; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; line-height: 1.15;">${name}</div>
            <div class="map-nowrap map-biz-addr" data-nowrap="true" style="font-size: 8px; color: ${textSubtitle}; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${address}</div>
            <div class="map-biz-meta" style="display: flex; align-items: center; gap: 2px; margin-top: 1px;">
              <span class="map-biz-star" style="color: #f59e0b; font-size: 8.5px; line-height: 1;">★</span>
              <span class="map-biz-rating" style="font-size: 8.5px; font-weight: 700; color: ${textTitle};">${rating}</span>
              <span class="map-biz-reviews" style="font-size: 7.5px; color: ${textReviews};">(${reviews})</span>
            </div>
            <div class="map-nowrap map-biz-category" data-nowrap="true" style="font-size: 7.5px; color: ${textCategory}; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${category}</div>
          </div>
        </div>
        
        <!-- Gallery Strip -->
        <div class="map-gallery-strip" style="display: flex; gap: 3px; margin-bottom: 4px; width: 100%;">
          ${galleryItems.slice(0, 4).map((img, i) => `
            <img key="${i}" class="map-gallery-thumb" src="${img}" alt="Preview ${i+1}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&amp;auto=format&amp;fit=crop&amp;q=80';" style="flex: 1; height: 24px; border-radius: 3px; object-fit: cover; min-width: 0;" />
          `).join('')}
          <div class="map-gallery-thumb" style="position: relative; flex: 1; height: 24px; border-radius: 3px; overflow: hidden; min-width: 0;">
            <img src="${galleryItems[4] || galleryItems[0]}" alt="More" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&amp;auto=format&amp;fit=crop&amp;q=80';" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.52); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 700; font-size: 9px;">+</div>
          </div>
        </div>

        <!-- Full-Width CTA -->
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="map-nowrap map-action-btn map-action-btn-primary" data-nowrap="true" style="display: block; width: 100%; text-align: center; background: ${buttonColor || '#00828a'}; color: #ffffff; padding: 4px 0; border-radius: 5px; font-size: 8.5px; font-weight: 600; text-decoration: none; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.25); white-space: nowrap !important;">
          View Details
        </a>
      </div>
    `;
  }

  // Carousel layout (matches exact design from user screenshot)
  const dotActive = buttonColor || (isDark ? '#38bdf8' : '#00828a');
  const dotInactive = isDark ? 'rgba(255,255,255,0.3)' : '#99d5d8';
  const btnColor = buttonColor || (isDark ? '#38bdf8' : '#00828a');

  return `
    ${openMapsBtnHtml}
    <!-- Center Pin Marker -->
    <div class="map-center-pin" style="position: absolute; top: 32%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 4px; background: ${badgeBg}; ${badgeBorder} border-radius: 999px; padding: 2px 7px 2px 4px; ${shadow} pointer-events: none; z-index: 5; white-space: nowrap !important; max-width: 80%;">
      <div class="map-badge-icon" style="width: 14px; height: 14px; border-radius: 999px; background: #fee2e2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#ffffff"/></svg>
      </div>
      <span class="map-nowrap map-biz-name" data-nowrap="true" style="font-size: 9px; font-weight: 700; color: ${textTitle}; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${shortName}</span>
    </div>

    <!-- Floating Card -->
    <div class="map-card-overlay map-card-carousel" style="position: absolute; bottom: 14px; left: 6px; right: 6px; background: ${cardBg}; ${cardBorder} border-radius: 8px; padding: 5px 7px; ${shadow} font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; pointer-events: auto; z-index: 10; box-sizing: border-box; max-height: 50%;">
      <div class="map-biz-row" style="display: flex; align-items: center; gap: 6px;">
        <img class="map-biz-img" src="${image}" alt="${name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&amp;auto=format&amp;fit=crop&amp;q=80';" style="width: 32px; height: 32px; border-radius: 5px; object-fit: cover; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);" />
        <div class="map-biz-info" style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
          <div class="map-nowrap map-biz-name" data-nowrap="true" style="font-weight: 700; font-size: 9.5px; color: ${textTitle}; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; line-height: 1.15;">${name}</div>
          <div class="map-nowrap map-biz-addr" data-nowrap="true" style="font-size: 7.5px; color: ${textSubtitle}; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${address}</div>
          <div class="map-biz-meta" style="display: flex; align-items: center; gap: 2px; margin-top: 1px;">
            <span class="map-biz-star" style="color: #f59e0b; font-size: 8.5px; line-height: 1;">★</span>
            <span class="map-biz-rating" style="font-size: 8px; font-weight: 700; color: ${textTitle};">${rating}</span>
            <span class="map-biz-reviews" style="font-size: 7px; color: ${textReviews};">(${reviews})</span>
          </div>
          <div class="map-nowrap map-biz-category" data-nowrap="true" style="font-size: 7px; color: ${textCategory}; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${category}</div>
        </div>
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="map-action-btn-circle" title="Open in Google Maps" style="width: 20px; height: 20px; border-radius: 999px; border: 1.2px solid ${btnColor}; display: flex; align-items: center; justify-content: center; color: ${btnColor}; text-decoration: none; flex-shrink: 0; cursor: pointer !important; pointer-events: auto !important;">
          <svg class="svg-icon-override" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 10px !important; height: 10px !important; min-width: 10px !important; max-width: 10px !important; min-height: 10px !important; max-height: 10px !important; display: inline-block !important; flex-shrink: 0 !important;"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      </div>
    </div>

    <!-- Carousel Pagination Dots -->
    <div class="map-carousel-dots" style="position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); display: flex; gap: 3px; pointer-events: none; z-index: 10;">
      <div style="width: 3.5px; height: 3.5px; border-radius: 999px; background: ${dotActive};"></div>
      <div style="width: 3.5px; height: 3.5px; border-radius: 999px; background: ${dotInactive};"></div>
      <div style="width: 3.5px; height: 3.5px; border-radius: 999px; background: ${dotInactive};"></div>
      <div style="width: 3.5px; height: 3.5px; border-radius: 999px; background: ${dotInactive};"></div>
      <div style="width: 3.5px; height: 3.5px; border-radius: 999px; background: ${dotInactive};"></div>
    </div>
  `;
};

export const getMapSvgCode = (templateId = 'carousel', isClick = false, customData = {}) => {
  const uniqueId = Date.now();
  const data = { ...DEFAULT_MAP_DATA, ...customData };
  const loc = data.location || 'Coimbatore, Tamil Nadu';
  const defaultUrl = `https://maps.google.com/maps?q=${encodeURIComponent(loc)}&t=&z=13&ie=UTF8&iwloc=near&output=embed`;
  const theme = data.theme || 'Light Theme';
  const buttonColor = data.buttonColor || '#000000';
  const isDark = String(theme).toLowerCase().includes('dark');

  const { pw, ph } = getActiveCanvasDimensions();
  const { targetW, targetH, posX, posY } = getMapDimensions(pw, ph);

  const transformAttr = isClick ? ` transform="translate(${posX}, ${posY})"` : '';
  const showOpenMapBtn = data.showOpenMapBtn !== false;
  const overlayHtml = generateOverlayHtml(templateId, { ...data, theme, buttonColor, showOpenMapBtn });

  const galleryJson = escapeXml(JSON.stringify(data.gallery || DEFAULT_MAP_DATA.gallery));

  const baseW = 320;
  const scale = targetW < baseW ? (targetW / baseW) : 1;
  const innerW = targetW < baseW ? baseW : targetW;
  const innerH = Math.round(targetH / scale);

  return `
    <g id="map-${uniqueId}" 
       data-type="map" 
       data-map-style="${templateId}"
       data-theme="${escapeXml(theme)}"
       data-button-color="${escapeXml(buttonColor)}"
       data-show-open-map-btn="${showOpenMapBtn ? 'true' : 'false'}"
       data-business-name="${escapeXml(data.name)}"
       data-business-address="${escapeXml(data.address)}"
       data-business-rating="${escapeXml(data.rating)}"
       data-business-reviews="${escapeXml(data.reviews)}"
       data-business-category="${escapeXml(data.category)}"
       data-business-phone="${escapeXml(data.phone)}"
       data-business-image="${escapeXml(data.image)}"
       data-business-gallery="${galleryJson}"
       data-location="${escapeXml(loc)}"
       data-source-type="Location"
       data-url="${defaultUrl.replace(/&/g, '&amp;')}"
       cursor="pointer"${transformAttr}>
      <foreignObject x="0" y="0" width="${targetW}" height="${targetH}" style="overflow: hidden; border-radius: 0px;">
        <div xmlns="http://www.w3.org/1999/xhtml" class="map-root-container" style="position: relative; width: 100%; height: 100%; overflow: hidden; margin: 0; padding: 0; border-radius: 0px; box-shadow: 0 4px 20px rgba(0,0,0,0.12);">
          <div class="map-stage" style="position: absolute; top: 0; left: 0; width: ${innerW}px; height: ${innerH}px; transform: scale(${scale}); transform-origin: 0 0; overflow: hidden;">
            <iframe src="${defaultUrl.replace(/&/g, '&amp;')}" width="${innerW}" height="${innerH + 56}" style="position: absolute; top: -56px; left: 0; width: ${innerW}px; height: ${innerH + 56}px; border: 0; pointer-events: none; margin: 0; padding: 0; display: block; ${isDark ? 'filter: invert(90%) hue-rotate(180deg) contrast(95%);' : ''}" allowfullscreen="" loading="lazy"></iframe>
            <div class="map-overlay-wrapper" style="position: absolute; inset: 0; pointer-events: none;">
              ${overlayHtml}
            </div>
          </div>
        </div>
      </foreignObject>
      <rect x="0" y="0" width="${targetW}" height="${targetH}" rx="0" fill="transparent" pointer-events="all" />
    </g>
  `;
};

export const MapTemplateThumbnail = ({ templateId, theme = 'Light Theme', buttonColor = '#000000' }) => {
  const isDark = String(theme).toLowerCase().includes('dark');
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textTitle = isDark ? '#f9fafb' : '#111827';
  const textSubtitle = isDark ? '#9ca3af' : '#4b5563';
  const badgeBg = isDark ? '#1e293b' : '#ffffff';

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden flex flex-col select-none">
      {/* Map Background Simulation */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter contrast-[1.05] brightness-[1.02]"
        style={{
          backgroundImage: `url('${DEFAULT_MAP_DATA.image}')`,
          backgroundSize: 'cover',
          filter: isDark ? 'invert(90%) hue-rotate(180deg) contrast(95%)' : 'none'
        }}
      />
      {/* Light Map overlay tint */}
      <div className={`absolute inset-0 ${isDark ? 'bg-black/20' : 'bg-sky-50/20'} backdrop-blur-[0.5px]`} />

      {/* PREVIEW 1: Actions */}
      {templateId === 'actions' && (
        <>
          <div className="absolute top-[8%] left-1/2 -translate-x-1/2 rounded-full py-[0.15vw] px-[0.45vw] flex items-center gap-[0.25vw] shadow-sm border" style={{ backgroundColor: badgeBg, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }}>
            <div className="w-[0.9vw] h-[0.9vw] rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:map-marker" className="text-red-500 text-[0.6vw]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[0.48vw] font-bold" style={{ color: textTitle }}>Fisto Tech</span>
              <span className="text-[0.38vw]" style={{ color: textSubtitle }}>Coimbatore</span>
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 rounded-t-xl p-[0.45vw] shadow-lg flex flex-col gap-[0.2vw] border-t" style={{ backgroundColor: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }}>
            <div className="w-[1.2vw] h-[0.12vw] rounded-full mx-auto mb-[0.1vw]" style={{ backgroundColor: isDark ? '#475569' : '#d1d5db' }} />
            <div className="flex items-center gap-[0.35vw]">
              <img 
                src={DEFAULT_MAP_DATA.image} 
                alt="" 
                className="w-[1.8vw] h-[1.8vw] rounded-md object-cover flex-shrink-0" 
              />
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-[0.52vw] font-bold truncate leading-tight" style={{ color: textTitle }}>Fisto Tech Private Limited</span>
                <span className="text-[0.42vw] truncate" style={{ color: textSubtitle }}>Coimbatore , India</span>
                <div className="flex items-center gap-[0.15vw] mt-[0.05vw]">
                  <span className="text-amber-500 text-[0.45vw]">★</span>
                  <span className="text-[0.42vw] font-bold" style={{ color: textTitle }}>4.9</span>
                  <span className="text-[0.38vw]" style={{ color: textSubtitle }}>(1500)</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-[0.2vw] mt-[0.1vw]">
              <div className="text-white rounded text-[0.4vw] font-medium py-[0.2vw] flex items-center justify-center gap-[0.1vw]" style={{ backgroundColor: buttonColor || '#000000' }}>
                <Icon icon="mdi:directions" className="text-[0.45vw]" />
                <span>Directions</span>
              </div>
              <div className="rounded text-[0.4vw] font-medium py-[0.2vw] flex items-center justify-center gap-[0.1vw]" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6', color: isDark ? '#f9fafb' : '#1f2937' }}>
                <Icon icon="mdi:phone" className="text-[0.45vw]" />
                <span>Call</span>
              </div>
              <div className="rounded text-[0.4vw] font-medium py-[0.2vw] flex items-center justify-center gap-[0.1vw]" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6', color: isDark ? '#f9fafb' : '#1f2937' }}>
                <Icon icon="mdi:share-variant" className="text-[0.45vw]" />
                <span>Share</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PREVIEW 2: Callout */}
      {templateId === 'callout' && (
        <>
          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[86%] rounded-lg p-[0.35vw] shadow-md border flex items-center gap-[0.3vw]" style={{ backgroundColor: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }}>
            <img 
              src={DEFAULT_MAP_DATA.image} 
              alt="" 
              className="w-[1.6vw] h-[1.6vw] rounded object-cover flex-shrink-0" 
            />
            <div className="flex-1 min-w-0 flex flex-col leading-tight">
              <span className="text-[0.5vw] font-bold truncate" style={{ color: textTitle }}>Fisto Tech Private Limited</span>
              <span className="text-[0.4vw] truncate" style={{ color: textSubtitle }}>Coimbatore , India</span>
              <div className="flex items-center gap-[0.15vw] mt-[0.05vw]">
                <span className="text-amber-500 text-[0.4vw]">★</span>
                <span className="text-[0.4vw] font-bold" style={{ color: textTitle }}>4.9</span>
                <span className="text-[0.36vw]" style={{ color: textSubtitle }}>(1500)</span>
              </div>
            </div>
            <div className="absolute -bottom-[0.3vw] left-1/2 -translate-x-1/2 w-0 h-0 border-x-[0.25vw] border-x-transparent border-t-[0.3vw]" style={{ borderTopColor: cardBg }} />
          </div>

          <div className="absolute top-[52%] left-1/2 -translate-x-1/2 rounded-full py-[0.1vw] px-[0.35vw] flex items-center gap-[0.2vw] shadow-sm border" style={{ backgroundColor: badgeBg, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
            <Icon icon="mdi:map-marker" className="text-red-500 text-[0.6vw]" />
            <span className="text-[0.45vw] font-bold" style={{ color: textTitle }}>Fisto Tech</span>
          </div>
        </>
      )}

      {/* PREVIEW 3: Gallery */}
      {templateId === 'gallery' && (
        <>
          <div className="absolute top-[6%] left-1/2 -translate-x-1/2 rounded-full py-[0.1vw] px-[0.4vw] flex items-center gap-[0.2vw] shadow-sm border" style={{ backgroundColor: badgeBg, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
            <Icon icon="mdi:map-marker" className="text-red-500 text-[0.55vw]" />
            <span className="text-[0.45vw] font-bold" style={{ color: textTitle }}>Fisto Tech</span>
          </div>

          <div className="absolute bottom-0 inset-x-0 rounded-t-xl p-[0.4vw] shadow-lg flex flex-col gap-[0.2vw] border-t" style={{ backgroundColor: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }}>
            <div className="w-[1.2vw] h-[0.12vw] rounded-full mx-auto" style={{ backgroundColor: isDark ? '#475569' : '#d1d5db' }} />
            <div className="flex items-center gap-[0.3vw]">
              <img 
                src={DEFAULT_MAP_DATA.image} 
                alt="" 
                className="w-[1.6vw] h-[1.6vw] rounded object-cover flex-shrink-0" 
              />
              <div className="flex-1 min-w-0 flex flex-col leading-tight">
                <span className="text-[0.48vw] font-bold truncate" style={{ color: textTitle }}>Fisto Tech Private Limited</span>
                <span className="text-[0.38vw] truncate" style={{ color: textSubtitle }}>Coimbatore , India</span>
                <div className="flex items-center gap-[0.1vw]">
                  <span className="text-amber-500 text-[0.4vw]">★</span>
                  <span className="text-[0.38vw] font-bold" style={{ color: textTitle }}>4.9</span>
                  <span className="text-[0.34vw]" style={{ color: textSubtitle }}>(1500)</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-[0.15vw]">
              {DEFAULT_MAP_DATA.gallery.slice(0, 4).map((img, i) => (
                <img key={i} src={img} alt="" className="w-full h-[0.9vw] rounded-[2px] object-cover" />
              ))}
              <div className="relative w-full h-[0.9vw] rounded-[2px] overflow-hidden bg-black/60 flex items-center justify-center text-white text-[0.4vw] font-bold">
                +
              </div>
            </div>
            <div className="w-full text-white rounded text-[0.4vw] font-semibold py-[0.2vw] text-center" style={{ backgroundColor: buttonColor || '#000000' }}>
              View Details
            </div>
          </div>
        </>
      )}

      {/* PREVIEW 4: Carousel */}
      {templateId === 'carousel' && (
        <>
          <div className="absolute top-[32%] left-1/2 -translate-x-1/2 rounded-full py-[0.1vw] px-[0.35vw] flex items-center gap-[0.2vw] shadow-sm border" style={{ backgroundColor: badgeBg, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
            <Icon icon="mdi:map-marker" className="text-red-500 text-[0.55vw]" />
            <span className="text-[0.45vw] font-bold" style={{ color: textTitle }}>Fisto Tech</span>
          </div>

          <div className="absolute bottom-[0.8vw] inset-x-[0.3vw] rounded-lg p-[0.3vw] shadow-md flex items-center gap-[0.3vw] border" style={{ backgroundColor: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }}>
            <img 
              src={DEFAULT_MAP_DATA.image} 
              alt="" 
              className="w-[1.6vw] h-[1.6vw] rounded object-cover flex-shrink-0" 
            />
            <div className="flex-1 min-w-0 flex flex-col leading-tight">
              <span className="text-[0.48vw] font-bold truncate" style={{ color: textTitle }}>Fisto Tech Private L...</span>
              <span className="text-[0.38vw] truncate" style={{ color: textSubtitle }}>Coimbatore , India</span>
              <div className="flex items-center gap-[0.1vw]">
                <span className="text-amber-500 text-[0.4vw]">★</span>
                <span className="text-[0.38vw] font-bold" style={{ color: textTitle }}>4.9</span>
                <span className="text-[0.34vw]" style={{ color: textSubtitle }}>(1500)</span>
              </div>
            </div>
            <div className="w-[0.9vw] h-[0.9vw] rounded-full border flex items-center justify-center flex-shrink-0" style={{ borderColor: buttonColor || '#000000', color: buttonColor || '#000000' }}>
              <Icon icon="mdi:chevron-right" className="text-[0.55vw]" />
            </div>
          </div>

          <div className="absolute bottom-[0.2vw] left-1/2 -translate-x-1/2 flex items-center gap-[0.15vw]">
            <div className="w-[0.15vw] h-[0.15vw] rounded-full" style={{ backgroundColor: buttonColor || '#000000' }} />
            <div className="w-[0.15vw] h-[0.15vw] rounded-full bg-cyan-200" />
            <div className="w-[0.15vw] h-[0.15vw] rounded-full bg-cyan-200" />
            <div className="w-[0.15vw] h-[0.15vw] rounded-full bg-cyan-200" />
          </div>
        </>
      )}

      {/* PREVIEW 5: Map Only */}
      {templateId === 'none' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2">
          <div className="w-[1.8vw] h-[1.8vw] rounded-full bg-white/90 shadow-md flex items-center justify-center text-[#ef4444]">
            <Icon icon="mdi:map-marker" className="text-[1.1vw]" />
          </div>
          <span className="text-[0.45vw] font-semibold text-gray-700 bg-white/80 px-[0.4vw] py-[0.1vw] rounded mt-[0.3vw] shadow-xs">
            Clean Map Only
          </span>
        </div>
      )}
    </div>
  );
};

const MapStyle = ({ isFullView }) => {
  const handleDragStart = (e, templateId) => {
    const svgCode = getMapSvgCode(templateId, false);
    e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
      type: 'map',
      svgContent: svgCode
    }));
    e.dataTransfer.setData('text/plain', 'map');
  };

  const handleClick = (templateId) => {
    const svgCode = getMapSvgCode(templateId, true);
    window.dispatchEvent(new CustomEvent('add-element-to-editor', {
      detail: { svgContent: svgCode }
    }));
  };

  const displayTemplates = isFullView ? MAP_TEMPLATES : MAP_TEMPLATES.slice(0, 4);

  return (
    <div className={`w-full grid grid-cols-2 gap-[0.75vw] ${isFullView ? 'p-[0.5vw]' : ''}`}>
      {displayTemplates.map((tmpl) => (
        <div
          key={tmpl.id}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, tmpl.id)}
          onClick={() => handleClick(tmpl.id)}
          className="group relative flex flex-col bg-white border border-gray-200 hover:border-[#00828a] hover:shadow-md rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
          title={`Add ${tmpl.name} Map element`}
        >
          {/* Card Preview Area */}
          <div className="relative w-full aspect-[4/3.8] bg-slate-100 overflow-hidden flex flex-col select-none">
            <MapTemplateThumbnail templateId={tmpl.id} />
          </div>

          {/* Footer Info */}
          <div className="p-[0.5vw] flex items-center justify-between bg-white border-t border-gray-100">
            <span className="text-[0.7vw] font-medium text-gray-800 group-hover:text-[#00828a] transition-colors">
              {tmpl.name}
            </span>
            <span className="text-[0.58vw] font-semibold px-[0.35vw] py-[0.1vw] rounded bg-teal-50 text-[#00828a] border border-teal-100">
              {tmpl.badge}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MapStyle;
