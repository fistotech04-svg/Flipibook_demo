import React from 'react';
import { Icon } from '@iconify/react';

export const DEFAULT_MAP_DATA = {
  name: 'Google Maps Location',
  address: 'Location Details',
  rating: '4.8',
  reviews: '500+',
  category: 'Location',
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
    id: 'actions',
    name: 'Quick Actions',
    description: 'Bottom sheet with Directions, Call & Share buttons',
    badge: 'Popular'
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
    id: 'carousel',
    name: 'Location Carousel',
    description: 'Floating location card with next button & dots',
    badge: 'Compact'
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
  } catch (e) {}
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
  if (style === 'none' || style === 'plain') {
    return '';
  }

  const name = escapeXml(data.name || DEFAULT_MAP_DATA.name);
  const address = escapeXml(data.address || DEFAULT_MAP_DATA.address);
  const rating = escapeXml(data.rating || DEFAULT_MAP_DATA.rating);
  const reviews = escapeXml(data.reviews || DEFAULT_MAP_DATA.reviews);
  const category = escapeXml(data.category || DEFAULT_MAP_DATA.category);
  const phone = escapeXml(data.phone || DEFAULT_MAP_DATA.phone);
  const image = escapeXml(data.image || DEFAULT_MAP_DATA.image);
  const location = data.location || DEFAULT_MAP_DATA.location;
  const gallery = data.gallery || DEFAULT_MAP_DATA.gallery;

  const directionsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(location)}`;
  const shareUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}`;
  const shortName = name.split(' ')[0] || 'Location';

  if (style === 'actions') {
    return `
      <!-- Top Pin Badge -->
      <div class="map-top-badge" style="position: absolute; top: 6px; left: 50%; transform: translateX(-50%); background: #ffffff; border-radius: 999px; padding: 2px 8px 2px 4px; display: flex; align-items: center; gap: 4px; box-shadow: 0 3px 10px rgba(0,0,0,0.18); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; pointer-events: none; z-index: 5; white-space: nowrap !important; max-width: 90%;">
        <div class="map-badge-icon" style="width: 14px; height: 14px; border-radius: 999px; background: #fee2e2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="1" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#ffffff"/></svg>
        </div>
        <div style="display: flex; flex-direction: column; overflow: hidden; min-width: 0;">
          <span class="map-nowrap map-badge-title" data-nowrap="true" style="font-weight: 700; font-size: 9px; color: #111827; line-height: 1.1; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">${name}</span>
          <span class="map-nowrap map-badge-subtitle" data-nowrap="true" style="font-size: 7.5px; color: #6b7280; line-height: 1; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">${address}</span>
        </div>
      </div>

      <!-- Bottom Sheet with Actions -->
      <div class="map-card-overlay map-card-actions" style="position: absolute; bottom: 0; left: 0; right: 0; background: #ffffff; border-radius: 14px 14px 0 0; padding: 5px 8px 6px; box-shadow: 0 -4px 16px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; pointer-events: auto; z-index: 10; box-sizing: border-box; max-height: 52%; display: flex; flex-direction: column; justify-content: flex-end;">
        <div class="map-drag-pill" style="width: 24px; height: 2.5px; background: #d1d5db; border-radius: 999px; margin: 0 auto 4px; flex-shrink: 0;"></div>
        <div class="map-biz-row" style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; min-width: 0;">
          <img class="map-biz-img" src="${image}" alt="${name}" style="width: 32px; height: 32px; border-radius: 5px; object-fit: cover; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);" />
          <div class="map-biz-info" style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
            <div class="map-nowrap map-biz-name" data-nowrap="true" style="font-weight: 700; font-size: 10px; color: #111827; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; line-height: 1.15;">${name}</div>
            <div class="map-nowrap map-biz-addr" data-nowrap="true" style="font-size: 8px; color: #4b5563; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; line-height: 1.1;">${address}</div>
            <div class="map-biz-meta" style="display: flex; align-items: center; gap: 2px; margin-top: 1px; line-height: 1;">
              <span class="map-biz-star" style="color: #f59e0b; font-size: 8.5px; line-height: 1;">★</span>
              <span class="map-biz-rating" style="font-size: 8.5px; font-weight: 700; color: #111827;">${rating}</span>
              <span class="map-biz-reviews" style="font-size: 7.5px; color: #6b7280;">(${reviews})</span>
            </div>
            <div class="map-nowrap map-biz-category" data-nowrap="true" style="font-size: 7.5px; color: #6b7280; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${category}</div>
          </div>
        </div>
        <div class="map-actions-row" style="display: flex; gap: 4px; width: 100%; box-sizing: border-box;">
          <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="map-nowrap map-action-btn map-action-btn-primary" data-nowrap="true" style="flex: 1.15; display: flex; align-items: center; justify-content: center; gap: 3px; background: #00828a; color: #ffffff; padding: 4px 5px; border-radius: 5px; font-size: 8.5px; font-weight: 600; text-decoration: none; cursor: pointer; box-shadow: 0 2px 6px rgba(0,130,138,0.25); white-space: nowrap !important; overflow: hidden; min-width: 0;">
            <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            <span class="map-nowrap map-btn-text" data-nowrap="true" style="white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">Directions</span>
          </a>
          <a href="tel:${phone}" class="map-nowrap map-action-btn map-action-btn-secondary" data-nowrap="true" style="flex: 0.9; display: flex; align-items: center; justify-content: center; gap: 3px; background: #e0f4f5; color: #00828a; padding: 4px 5px; border-radius: 5px; font-size: 8.5px; font-weight: 600; text-decoration: none; cursor: pointer; white-space: nowrap !important; overflow: hidden; min-width: 0;">
            <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span class="map-nowrap map-btn-text" data-nowrap="true" style="white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">Call</span>
          </a>
          <a href="${shareUrl}" target="_blank" rel="noopener noreferrer" class="map-nowrap map-action-btn map-action-btn-secondary" data-nowrap="true" style="flex: 0.9; display: flex; align-items: center; justify-content: center; gap: 3px; background: #e0f4f5; color: #00828a; padding: 4px 5px; border-radius: 5px; font-size: 8.5px; font-weight: 600; text-decoration: none; cursor: pointer; white-space: nowrap !important; overflow: hidden; min-width: 0;">
            <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span class="map-nowrap map-btn-text" data-nowrap="true" style="white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">Share</span>
          </a>
        </div>
      </div>
    `;
  }

  if (style === 'callout') {
    return `
      <!-- Tooltip Speech Bubble -->
      <div class="map-card-overlay map-card-callout" style="position: absolute; top: 8%; left: 50%; transform: translateX(-50%); width: 85%; max-width: 220px; background: #ffffff; border-radius: 10px; padding: 5px 8px; box-shadow: 0 6px 16px rgba(0,0,0,0.18); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; pointer-events: auto; z-index: 10; box-sizing: border-box;">
        <div class="map-biz-row" style="display: flex; align-items: center; gap: 6px;">
          <img class="map-biz-img" src="${image}" alt="${name}" style="width: 32px; height: 32px; border-radius: 5px; object-fit: cover; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
          <div class="map-biz-info" style="flex: 1; min-width: 0;">
            <div class="map-nowrap map-biz-name" data-nowrap="true" style="font-weight: 700; font-size: 10px; color: #111827; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; line-height: 1.15;">${name}</div>
            <div class="map-nowrap map-biz-addr" data-nowrap="true" style="font-size: 8px; color: #4b5563; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${address}</div>
            <div class="map-biz-meta" style="display: flex; align-items: center; gap: 2px; margin-top: 1px;">
              <span class="map-biz-star" style="color: #f59e0b; font-size: 8.5px; line-height: 1;">★</span>
              <span class="map-biz-rating" style="font-size: 8.5px; font-weight: 700; color: #111827;">${rating}</span>
              <span class="map-biz-reviews" style="font-size: 7.5px; color: #6b7280;">(${reviews})</span>
            </div>
          </div>
        </div>
        <!-- Downward triangle arrow -->
        <div class="map-callout-arrow" style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 5px solid #ffffff;"></div>
      </div>

      <!-- Center Pin Marker -->
      <div class="map-center-pin" style="position: absolute; top: 62%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 4px; background: #ffffff; border-radius: 999px; padding: 2px 7px 2px 4px; box-shadow: 0 3px 8px rgba(0,0,0,0.25); pointer-events: none; z-index: 5; white-space: nowrap !important; max-width: 80%;">
        <div class="map-badge-icon" style="width: 14px; height: 14px; border-radius: 999px; background: #fee2e2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#ffffff"/></svg>
        </div>
        <span class="map-nowrap map-biz-name" data-nowrap="true" style="font-size: 9px; font-weight: 700; color: #111827; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${shortName}</span>
      </div>
    `;
  }

  if (style === 'gallery') {
    const galleryItems = gallery && gallery.length ? gallery : DEFAULT_MAP_DATA.gallery;
    return `
      <!-- Top Pin Badge -->
      <div class="map-top-badge" style="position: absolute; top: 6px; left: 50%; transform: translateX(-50%); background: #ffffff; border-radius: 999px; padding: 2px 8px 2px 4px; display: flex; align-items: center; gap: 4px; box-shadow: 0 3px 10px rgba(0,0,0,0.18); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; pointer-events: none; z-index: 5; white-space: nowrap !important; max-width: 90%;">
        <div class="map-badge-icon" style="width: 14px; height: 14px; border-radius: 999px; background: #fee2e2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="1" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#ffffff"/></svg>
        </div>
        <div style="display: flex; flex-direction: column; overflow: hidden; min-width: 0;">
          <span class="map-nowrap map-badge-title" data-nowrap="true" style="font-weight: 700; font-size: 9px; color: #111827; line-height: 1.1; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">${name}</span>
          <span class="map-nowrap map-badge-subtitle" data-nowrap="true" style="font-size: 7.5px; color: #6b7280; line-height: 1; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">${address}</span>
        </div>
      </div>

      <!-- Bottom Sheet with Gallery & Action CTA -->
      <div class="map-card-overlay map-card-gallery" style="position: absolute; bottom: 0; left: 0; right: 0; background: #ffffff; border-radius: 14px 14px 0 0; padding: 5px 8px 6px; box-shadow: 0 -4px 16px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; pointer-events: auto; z-index: 10; box-sizing: border-box; max-height: 52%; display: flex; flex-direction: column; justify-content: flex-end;">
        <div class="map-drag-pill" style="width: 24px; height: 2.5px; background: #d1d5db; border-radius: 999px; margin: 0 auto 4px; flex-shrink: 0;"></div>
        <div class="map-biz-row" style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; min-width: 0;">
          <img class="map-biz-img" src="${image}" alt="${name}" style="width: 30px; height: 30px; border-radius: 5px; object-fit: cover; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);" />
          <div class="map-biz-info" style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
            <div class="map-nowrap map-biz-name" data-nowrap="true" style="font-weight: 700; font-size: 10px; color: #111827; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; line-height: 1.15;">${name}</div>
            <div class="map-nowrap map-biz-addr" data-nowrap="true" style="font-size: 8px; color: #4b5563; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${address}</div>
            <div class="map-biz-meta" style="display: flex; align-items: center; gap: 2px; margin-top: 1px;">
              <span class="map-biz-star" style="color: #f59e0b; font-size: 8.5px; line-height: 1;">★</span>
              <span class="map-biz-rating" style="font-size: 8.5px; font-weight: 700; color: #111827;">${rating}</span>
              <span class="map-biz-reviews" style="font-size: 7.5px; color: #6b7280;">(${reviews})</span>
            </div>
            <div class="map-nowrap map-biz-category" data-nowrap="true" style="font-size: 7.5px; color: #6b7280; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${category}</div>
          </div>
        </div>
        
        <!-- Gallery Strip -->
        <div class="map-gallery-strip" style="display: flex; gap: 3px; margin-bottom: 4px; width: 100%;">
          ${galleryItems.slice(0, 4).map((img, i) => `
            <img key="${i}" class="map-gallery-thumb" src="${img}" alt="Preview ${i+1}" style="flex: 1; height: 24px; border-radius: 3px; object-fit: cover; min-width: 0;" />
          `).join('')}
          <div class="map-gallery-thumb" style="position: relative; flex: 1; height: 24px; border-radius: 3px; overflow: hidden; min-width: 0;">
            <img src="${galleryItems[4] || galleryItems[0]}" alt="More" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.52); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 700; font-size: 9px;">+</div>
          </div>
        </div>

        <!-- Full-Width CTA -->
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="map-nowrap map-action-btn map-action-btn-primary" data-nowrap="true" style="display: block; width: 100%; text-align: center; background: #00828a; color: #ffffff; padding: 4px 0; border-radius: 5px; font-size: 8.5px; font-weight: 600; text-decoration: none; cursor: pointer; box-shadow: 0 2px 6px rgba(0,130,138,0.25); white-space: nowrap !important;">
          View Details
        </a>
      </div>
    `;
  }

  // Carousel layout
  return `
    <!-- Center Pin Marker -->
    <div class="map-center-pin" style="position: absolute; top: 32%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 4px; background: #ffffff; border-radius: 999px; padding: 2px 7px 2px 4px; box-shadow: 0 3px 8px rgba(0,0,0,0.25); pointer-events: none; z-index: 5; white-space: nowrap !important; max-width: 80%;">
      <div class="map-badge-icon" style="width: 14px; height: 14px; border-radius: 999px; background: #fee2e2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <svg class="svg-icon-override" width="9" height="9" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" style="width: 9px !important; height: 9px !important; min-width: 9px !important; max-width: 9px !important; min-height: 9px !important; max-height: 9px !important; display: inline-block !important; flex-shrink: 0 !important;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#ffffff"/></svg>
      </div>
      <span class="map-nowrap map-biz-name" data-nowrap="true" style="font-size: 9px; font-weight: 700; color: #111827; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${shortName}</span>
    </div>

    <!-- Floating Card -->
    <div class="map-card-overlay map-card-carousel" style="position: absolute; bottom: 14px; left: 6px; right: 6px; background: #ffffff; border-radius: 8px; padding: 5px 7px; box-shadow: 0 4px 14px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; pointer-events: auto; z-index: 10; box-sizing: border-box; max-height: 50%;">
      <div class="map-biz-row" style="display: flex; align-items: center; gap: 6px;">
        <img class="map-biz-img" src="${image}" alt="${name}" style="width: 32px; height: 32px; border-radius: 5px; object-fit: cover; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);" />
        <div class="map-biz-info" style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
          <div class="map-nowrap map-biz-name" data-nowrap="true" style="font-weight: 700; font-size: 9.5px; color: #111827; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; line-height: 1.15;">${name}</div>
          <div class="map-nowrap map-biz-addr" data-nowrap="true" style="font-size: 7.5px; color: #4b5563; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${address}</div>
          <div class="map-biz-meta" style="display: flex; align-items: center; gap: 2px; margin-top: 1px;">
            <span class="map-biz-star" style="color: #f59e0b; font-size: 8.5px; line-height: 1;">★</span>
            <span class="map-biz-rating" style="font-size: 8px; font-weight: 700; color: #111827;">${rating}</span>
            <span class="map-biz-reviews" style="font-size: 7px; color: #6b7280;">(${reviews})</span>
          </div>
          <div class="map-nowrap map-biz-category" data-nowrap="true" style="font-size: 7px; color: #6b7280; margin-top: 1px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;">${category}</div>
        </div>
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="width: 20px; height: 20px; border-radius: 999px; border: 1.2px solid #00828a; display: flex; align-items: center; justify-content: center; color: #00828a; text-decoration: none; flex-shrink: 0; cursor: pointer;">
          <svg class="svg-icon-override" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 10px !important; height: 10px !important; min-width: 10px !important; max-width: 10px !important; min-height: 10px !important; max-height: 10px !important; display: inline-block !important; flex-shrink: 0 !important;"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      </div>
    </div>

    <!-- Carousel Pagination Dots -->
    <div class="map-carousel-dots" style="position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); display: flex; gap: 3px; pointer-events: none; z-index: 10;">
      <div style="width: 3.5px; height: 3.5px; border-radius: 999px; background: #00828a;"></div>
      <div style="width: 3.5px; height: 3.5px; border-radius: 999px; background: #99d5d8;"></div>
      <div style="width: 3.5px; height: 3.5px; border-radius: 999px; background: #99d5d8;"></div>
      <div style="width: 3.5px; height: 3.5px; border-radius: 999px; background: #99d5d8;"></div>
    </div>
  `;
};

export const getMapSvgCode = (templateId = 'actions', isClick = false, customData = {}) => {
  const uniqueId = Date.now();
  const data = { ...DEFAULT_MAP_DATA, ...customData };
  const loc = data.location || 'Coimbatore, Tamil Nadu';
  const defaultUrl = `https://maps.google.com/maps?q=${encodeURIComponent(loc)}&t=&z=13&ie=UTF8&iwloc=near&output=embed`;

  const { pw, ph } = getActiveCanvasDimensions();
  const { targetW, targetH, posX, posY } = getMapDimensions(pw, ph);

  const transformAttr = isClick ? ` transform="translate(${posX}, ${posY})"` : '';
  const overlayHtml = generateOverlayHtml(templateId, data);

  const galleryJson = escapeXml(JSON.stringify(data.gallery || DEFAULT_MAP_DATA.gallery));

  const baseW = 320;
  const scale = targetW < baseW ? (targetW / baseW) : 1;
  const innerW = targetW < baseW ? baseW : targetW;
  const innerH = Math.round(targetH / scale);

  return `
    <g id="map-${uniqueId}" 
       data-type="map" 
       data-map-style="${templateId}"
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
            <iframe src="${defaultUrl.replace(/&/g, '&amp;')}" width="${innerW}" height="${innerH}" style="position: absolute; top: 0; left: 0; width: ${innerW}px; height: ${innerH}px; border: 0; pointer-events: none; margin: 0; padding: 0; display: block;" allowfullscreen="" loading="lazy"></iframe>
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

  return (
    <div className={`w-full grid grid-cols-2 gap-[0.75vw] ${isFullView ? 'p-[0.5vw]' : ''}`}>
      {MAP_TEMPLATES.map((tmpl) => (
        <div
          key={tmpl.id}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, tmpl.id)}
          onClick={() => handleClick(tmpl.id)}
          className="group relative flex flex-col bg-white border border-gray-200 hover:border-[#00828a] hover:shadow-md rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
          title={`Add ${tmpl.name} Map element`}
        >
          {/* Card Preview Area (recreating the design from the uploaded image) */}
          <div className="relative w-full aspect-[4/3.8] bg-slate-100 overflow-hidden flex flex-col select-none">
            {/* Map Background Simulation */}
            <div 
              className="absolute inset-0 bg-cover bg-center filter contrast-[1.05] brightness-[1.02]"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500&auto=format&fit=crop&q=80')`,
                backgroundSize: 'cover'
              }}
            />
            {/* Light Map overlay tint */}
            <div className="absolute inset-0 bg-sky-50/20 backdrop-blur-[0.5px]" />

            {/* PREVIEW 1: Actions */}
            {tmpl.id === 'actions' && (
              <>
                {/* Top Pin Badge */}
                <div className="absolute top-[8%] left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full py-[0.15vw] px-[0.45vw] flex items-center gap-[0.25vw] shadow-sm border border-gray-100">
                  <div className="w-[0.9vw] h-[0.9vw] rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Icon icon="mdi:map-marker" className="text-red-500 text-[0.6vw]" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[0.48vw] font-bold text-gray-900">Fisto Tech</span>
                    <span className="text-[0.38vw] text-gray-500">Coimbatore</span>
                  </div>
                </div>

                {/* Bottom Sheet Card */}
                <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-xl p-[0.45vw] shadow-lg flex flex-col gap-[0.2vw] border-t border-gray-100">
                  <div className="w-[1.2vw] h-[0.12vw] bg-gray-300 rounded-full mx-auto mb-[0.1vw]" />
                  <div className="flex items-center gap-[0.35vw]">
                    <img 
                      src={DEFAULT_MAP_DATA.image} 
                      alt="" 
                      className="w-[1.8vw] h-[1.8vw] rounded-md object-cover flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className="text-[0.52vw] font-bold text-gray-900 truncate leading-tight">Fisto Tech Private Limited</span>
                      <span className="text-[0.42vw] text-gray-600 truncate">Coimbatore , India</span>
                      <div className="flex items-center gap-[0.15vw] mt-[0.05vw]">
                        <span className="text-amber-500 text-[0.45vw]">★</span>
                        <span className="text-[0.42vw] font-bold text-gray-900">4.9</span>
                        <span className="text-[0.38vw] text-gray-500">(1500)</span>
                      </div>
                    </div>
                  </div>
                  {/* Buttons */}
                  <div className="grid grid-cols-3 gap-[0.2vw] mt-[0.1vw]">
                    <div className="bg-[#00828a] text-white rounded text-[0.4vw] font-medium py-[0.2vw] flex items-center justify-center gap-[0.1vw]">
                      <Icon icon="mdi:directions" className="text-[0.45vw]" />
                      <span>Directions</span>
                    </div>
                    <div className="bg-[#e0f4f5] text-[#00828a] rounded text-[0.4vw] font-medium py-[0.2vw] flex items-center justify-center gap-[0.1vw]">
                      <Icon icon="mdi:phone" className="text-[0.45vw]" />
                      <span>Call</span>
                    </div>
                    <div className="bg-[#e0f4f5] text-[#00828a] rounded text-[0.4vw] font-medium py-[0.2vw] flex items-center justify-center gap-[0.1vw]">
                      <Icon icon="mdi:share-variant" className="text-[0.45vw]" />
                      <span>Share</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* PREVIEW 2: Callout */}
            {tmpl.id === 'callout' && (
              <>
                {/* Speech Bubble */}
                <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[86%] bg-white rounded-lg p-[0.35vw] shadow-md border border-gray-100 flex items-center gap-[0.3vw]">
                  <img 
                    src={DEFAULT_MAP_DATA.image} 
                    alt="" 
                    className="w-[1.6vw] h-[1.6vw] rounded object-cover flex-shrink-0" 
                  />
                  <div className="flex-1 min-w-0 flex flex-col leading-tight">
                    <span className="text-[0.5vw] font-bold text-gray-900 truncate">Fisto Tech Private Limited</span>
                    <span className="text-[0.4vw] text-gray-600 truncate">Coimbatore , India</span>
                    <div className="flex items-center gap-[0.15vw] mt-[0.05vw]">
                      <span className="text-amber-500 text-[0.45vw]">★</span>
                      <span className="text-[0.4vw] font-bold text-gray-900">4.9</span>
                      <span className="text-[0.36vw] text-gray-500">(1500)</span>
                    </div>
                  </div>
                  {/* Arrow pointing down */}
                  <div className="absolute -bottom-[0.3vw] left-1/2 -translate-x-1/2 w-0 h-0 border-x-[0.25vw] border-x-transparent border-t-[0.3vw] border-t-white" />
                </div>

                {/* Center Pin */}
                <div className="absolute top-[52%] left-1/2 -translate-x-1/2 bg-white/95 rounded-full py-[0.1vw] px-[0.35vw] flex items-center gap-[0.2vw] shadow-sm">
                  <Icon icon="mdi:map-marker" className="text-red-500 text-[0.6vw]" />
                  <span className="text-[0.45vw] font-bold text-gray-900">Fisto Tech</span>
                </div>
              </>
            )}

            {/* PREVIEW 3: Gallery */}
            {tmpl.id === 'gallery' && (
              <>
                {/* Top Pin Badge */}
                <div className="absolute top-[6%] left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full py-[0.1vw] px-[0.4vw] flex items-center gap-[0.2vw] shadow-sm">
                  <Icon icon="mdi:map-marker" className="text-red-500 text-[0.55vw]" />
                  <span className="text-[0.45vw] font-bold text-gray-900">Fisto Tech</span>
                </div>

                {/* Bottom Sheet Card */}
                <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-xl p-[0.4vw] shadow-lg flex flex-col gap-[0.2vw]">
                  <div className="w-[1.2vw] h-[0.12vw] bg-gray-300 rounded-full mx-auto" />
                  <div className="flex items-center gap-[0.3vw]">
                    <img 
                      src={DEFAULT_MAP_DATA.image} 
                      alt="" 
                      className="w-[1.6vw] h-[1.6vw] rounded object-cover flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0 flex flex-col leading-tight">
                      <span className="text-[0.48vw] font-bold text-gray-900 truncate">Fisto Tech Private Limited</span>
                      <span className="text-[0.38vw] text-gray-600 truncate">Coimbatore , India</span>
                      <div className="flex items-center gap-[0.1vw]">
                        <span className="text-amber-500 text-[0.4vw]">★</span>
                        <span className="text-[0.38vw] font-bold text-gray-900">4.9</span>
                        <span className="text-[0.34vw] text-gray-500">(1500)</span>
                      </div>
                    </div>
                  </div>
                  {/* Gallery Row */}
                  <div className="grid grid-cols-5 gap-[0.15vw]">
                    {DEFAULT_MAP_DATA.gallery.slice(0, 4).map((img, i) => (
                      <img key={i} src={img} alt="" className="w-full h-[0.9vw] rounded-[2px] object-cover" />
                    ))}
                    <div className="relative w-full h-[0.9vw] rounded-[2px] overflow-hidden bg-black/60 flex items-center justify-center text-white text-[0.4vw] font-bold">
                      +
                    </div>
                  </div>
                  {/* View Details CTA */}
                  <div className="w-full bg-[#00828a] text-white rounded text-[0.4vw] font-semibold py-[0.2vw] text-center">
                    View Details
                  </div>
                </div>
              </>
            )}

            {/* PREVIEW 4: Carousel */}
            {tmpl.id === 'carousel' && (
              <>
                {/* Center Pin */}
                <div className="absolute top-[32%] left-1/2 -translate-x-1/2 bg-white/95 rounded-full py-[0.1vw] px-[0.35vw] flex items-center gap-[0.2vw] shadow-sm">
                  <Icon icon="mdi:map-marker" className="text-red-500 text-[0.55vw]" />
                  <span className="text-[0.45vw] font-bold text-gray-900">Fisto Tech</span>
                </div>

                {/* Floating Card */}
                <div className="absolute bottom-[0.8vw] inset-x-[0.3vw] bg-white rounded-lg p-[0.3vw] shadow-md flex items-center gap-[0.3vw]">
                  <img 
                    src={DEFAULT_MAP_DATA.image} 
                    alt="" 
                    className="w-[1.6vw] h-[1.6vw] rounded object-cover flex-shrink-0" 
                  />
                  <div className="flex-1 min-w-0 flex flex-col leading-tight">
                    <span className="text-[0.48vw] font-bold text-gray-900 truncate">Fisto Tech Private L...</span>
                    <span className="text-[0.38vw] text-gray-600 truncate">Coimbatore , India</span>
                    <div className="flex items-center gap-[0.1vw]">
                      <span className="text-amber-500 text-[0.4vw]">★</span>
                      <span className="text-[0.38vw] font-bold text-gray-900">4.9</span>
                      <span className="text-[0.34vw] text-gray-500">(1500)</span>
                    </div>
                  </div>
                  <div className="w-[0.9vw] h-[0.9vw] rounded-full border border-[#00828a] flex items-center justify-center text-[#00828a] flex-shrink-0">
                    <Icon icon="mdi:chevron-right" className="text-[0.55vw]" />
                  </div>
                </div>

                {/* Dots indicator */}
                <div className="absolute bottom-[0.2vw] left-1/2 -translate-x-1/2 flex items-center gap-[0.15vw]">
                  <div className="w-[0.15vw] h-[0.15vw] rounded-full bg-[#00828a]" />
                  <div className="w-[0.15vw] h-[0.15vw] rounded-full bg-cyan-200" />
                  <div className="w-[0.15vw] h-[0.15vw] rounded-full bg-cyan-200" />
                  <div className="w-[0.15vw] h-[0.15vw] rounded-full bg-cyan-200" />
                </div>
              </>
            )}

            {/* PREVIEW 5: Map Only */}
            {tmpl.id === 'none' && (
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
