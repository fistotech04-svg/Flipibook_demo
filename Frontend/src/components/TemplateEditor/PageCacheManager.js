/**
 * PageCacheManager.js
 * 
 * High-performance Cache & Progressive Processing Manager for Template Editor.
 * 
 * Key capabilities:
 * 1. Vector Thumbnail Caching:
 *    - Converts heavy vector SVGs into lightweight, isolated SVG Blob URLs (`URL.createObjectURL`).
 *    - Renders in the sidebar via simple <img> tags, replacing 50,000+ live SVG DOM elements.
 *    - Automatic garbage collection & URL revocation on updates to prevent memory leaks.
 *    - Debounced updates during active canvas editing.
 * 
 * 2. Progressive / Idle Processing Queue:
 *    - Uses requestIdleCallback / time-slicing to prepare background pages without freezing the UI.
 *    - Prioritizes active page first, allowing the editor to load in < 300ms.
 * 
 * 3. Layer Structure Cache:
 *    - Caches parsed layer trees to prevent expensive repeated DOMParser & recursive traversals.
 */

class PageCacheManager {
  constructor() {
    // Map<pageId, { blobUrl: string, hash: string, timestamp: number }>
    this.thumbnailCache = new Map();

    // Map<pageId, { layers: Array, hash: string }>
    this.layerCache = new Map();

    // Map<pageId, number> (timer IDs for debounced thumbnail generation)
    this.debounceTimers = new Map();

    // Set of listener functions: (event: { type: string, pageId: string|number, data: any }) => void
    this.listeners = new Set();

    // Background processing queue
    this.queue = [];
    this.isProcessingQueue = false;
    this.idleHandle = null;

    // Cache size limit for raw parsed DOMs
    this.maxCachedThumbnails = 100;
  }

  /**
   * Subscribe to cache events (e.g. thumbnail-ready, page-processed)
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event) {
    this.listeners.forEach(fn => {
      try {
        fn(event);
      } catch (err) {
        console.error('[PageCacheManager] Listener error:', err);
      }
    });
  }

  /**
   * Fast signature/hash of HTML content to detect changes
   */
  getHtmlSignature(html) {
    if (!html) return 'empty';
    const len = html.length;
    // Sample a few slices to quickly generate a unique signature without hashing the entire multi-MB string
    const sample = len > 500
      ? `${html.slice(0, 100)}_${html.slice(Math.floor(len / 2), Math.floor(len / 2) + 100)}_${html.slice(-100)}`
      : html;
    
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
      hash = ((hash << 5) - hash) + sample.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return `${len}_${hash}`;
  }

  /**
   * Sanitize SVG string for standalone Blob rendering:
   * - Ensures xmlns and xmlns:xlink are present
   * - Hides editor-specific free-frames or custom controls
   * - Ensures 100% width/height so it scales cleanly in <img>
   */
  prepareSvgForBlob(svgHtml) {
    if (!svgHtml || typeof svgHtml !== 'string') return '';

    let cleaned = svgHtml;

    // Ensure xmlns is present on <svg
    if (!cleaned.includes('xmlns=')) {
      cleaned = cleaned.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (cleaned.includes('xlink:href') && !cleaned.includes('xmlns:xlink=')) {
      cleaned = cleaned.replace(/<svg\b/i, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    // Hide editor free-frame bounds and controls in thumbnail
    const hideStyles = `
      <style>
        [data-name="Free Frame"], .free-frame-rect, [id^="custom-ctrl-"] { display: none !important; }
        .internal-crop-rect, .internal-crop-pattern { display: none !important; }
      </style>
    `;

    // Inject styles right after opening <svg ...>
    cleaned = cleaned.replace(/<svg([^>]*)>/i, `<svg$1 width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${hideStyles}`);

    // Sanitize any bare ampersands not part of valid XML entities
    cleaned = cleaned.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');

    return cleaned;
  }

  /**
   * Get thumbnail Blob URL for a page immediately if cached.
   * If not cached or dirty, creates one synchronously or returns null if empty.
   */
  getThumbnail(pageId, html) {
    if (!pageId || !html) return null;

    const signature = this.getHtmlSignature(html);
    const cached = this.thumbnailCache.get(pageId);

    if (cached && cached.hash === signature) {
      return cached.blobUrl;
    }

    // Generate new blob URL
    return this.generateThumbnailSync(pageId, html, signature);
  }

  /**
   * Generates a Blob URL synchronously and caches it.
   */
  generateThumbnailSync(pageId, html, signature) {
    try {
      const sig = signature || this.getHtmlSignature(html);
      const preparedSvg = this.prepareSvgForBlob(html);
      
      const blob = new Blob([preparedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);

      // Revoke old URL if it exists to prevent memory leaks
      const old = this.thumbnailCache.get(pageId);
      if (old && old.blobUrl) {
        URL.revokeObjectURL(old.blobUrl);
      }

      this.thumbnailCache.set(pageId, {
        blobUrl,
        hash: sig,
        timestamp: Date.now()
      });

      this.notify({ type: 'thumbnail-ready', pageId, blobUrl });
      return blobUrl;
    } catch (err) {
      console.warn('[PageCacheManager] Failed to generate SVG Blob URL:', err);
      return null;
    }
  }

  /**
   * Debounced thumbnail generation for active editing:
   * Waits for the user to pause editing (default 350ms) before re-rasterizing the thumbnail.
   */
  updateThumbnailDebounced(pageId, html, delay = 350) {
    if (!pageId || !html) return;

    if (this.debounceTimers.has(pageId)) {
      clearTimeout(this.debounceTimers.get(pageId));
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(pageId);
      this.generateThumbnailSync(pageId, html);
    }, delay);

    this.debounceTimers.set(pageId, timer);
  }

  /**
   * Layer structure cache helpers
   */
  getCachedLayers(pageId, html) {
    if (!pageId || !html) return null;
    const sig = this.getHtmlSignature(html);
    const cached = this.layerCache.get(pageId);
    if (cached && cached.hash === sig) {
      return cached.layers;
    }
    return null;
  }

  setCachedLayers(pageId, html, layers) {
    if (!pageId || !layers) return;
    const sig = this.getHtmlSignature(html);
    this.layerCache.set(pageId, { layers, hash: sig });
  }

  /**
   * Progressive Queue: Schedule background preparation of non-active pages
   */
  queuePagesForProcessing(pages, activePageIndex = 0, processFn) {
    if (!pages || pages.length === 0) return;

    // Prioritize adjacent pages first, then the rest
    const order = [];
    const total = pages.length;

    // Active page is already done, queue active + 1, active - 1, etc.
    for (let offset = 1; offset < total; offset++) {
      const nextIdx = activePageIndex + offset;
      const prevIdx = activePageIndex - offset;
      if (nextIdx < total) order.push(nextIdx);
      if (prevIdx >= 0) order.push(prevIdx);
    }

    this.queue = order.map(idx => ({ page: pages[idx], index: idx, processFn }));
    this.startQueueProcessing();
  }

  /**
   * Priority jump: If user clicks or jumps to a specific page, process it immediately!
   */
  prioritizePage(pageIndex) {
    const itemIdx = this.queue.findIndex(item => item.index === pageIndex);
    if (itemIdx > -1) {
      const [item] = this.queue.splice(itemIdx, 1);
      // Run immediately
      try {
        item.processFn(item.page, item.index);
      } catch (e) {
        console.warn(`[PageCacheManager] Error prioritizing page ${pageIndex}:`, e);
      }
    }
  }

  startQueueProcessing() {
    if (this.isProcessingQueue || this.queue.length === 0) return;
    this.isProcessingQueue = true;

    const processNext = (deadline) => {
      // Process tasks while we have idle time or if deadline not provided
      while (this.queue.length > 0 && (!deadline || deadline.timeRemaining() > 5)) {
        const item = this.queue.shift();
        if (item && item.processFn) {
          try {
            item.processFn(item.page, item.index);
          } catch (err) {
            console.warn(`[PageCacheManager] Progressive process error on page ${item.index}:`, err);
          }
        }
      }

      if (this.queue.length > 0) {
        if ('requestIdleCallback' in window) {
          this.idleHandle = window.requestIdleCallback(processNext, { timeout: 1000 });
        } else {
          this.idleHandle = setTimeout(() => processNext({ timeRemaining: () => 15 }), 50);
        }
      } else {
        this.isProcessingQueue = false;
        this.idleHandle = null;
      }
    };

    if ('requestIdleCallback' in window) {
      this.idleHandle = window.requestIdleCallback(processNext, { timeout: 1000 });
    } else {
      this.idleHandle = setTimeout(() => processNext({ timeRemaining: () => 15 }), 50);
    }
  }

  /**
   * Free memory and revoke all object URLs on unmount / navigation
   */
  destroy() {
    if (this.idleHandle) {
      if ('cancelIdleCallback' in window) {
        window.cancelIdleCallback(this.idleHandle);
      } else {
        clearTimeout(this.idleHandle);
      }
      this.idleHandle = null;
    }

    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    this.thumbnailCache.forEach(item => {
      if (item && item.blobUrl) {
        try {
          URL.revokeObjectURL(item.blobUrl);
        } catch (e) {}
      }
    });

    this.thumbnailCache.clear();
    this.layerCache.clear();
    this.queue = [];
    this.isProcessingQueue = false;
    this.listeners.clear();
  }
}

// Export singleton instance
export const pageCacheManager = new PageCacheManager();
export default pageCacheManager;
