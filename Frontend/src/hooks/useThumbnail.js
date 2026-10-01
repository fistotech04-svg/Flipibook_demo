// useThumbnail.js - Custom hook for thumbnail generation from HTML content
import { useState, useCallback, useRef, useEffect } from 'react';

const useThumbnail = () => {
  const [thumbnails, setThumbnails] = useState(new Map());
  const [isGenerating, setIsGenerating] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Simple hash function to detect content changes (even when length doesn't change)
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };

  // Generate thumbnail from HTML content
  const generateThumbnail = useCallback(async (htmlContent, pageId, debounceMs = 1000) => {
    if (!htmlContent) return null;

    // Use hash instead of length to detect style changes (e.g., icon color changes)
    const cacheKey = `${pageId}_${hashString(htmlContent)}`;
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey);
    }

    // Clear previous debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    return new Promise((resolve) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          setIsGenerating(true);

          // Dynamic import of html2canvas
          const html2canvas = (await import('html2canvas')).default;

          // Create temporary iframe to render HTML
          const iframe = document.createElement('iframe');
          iframe.style.position = 'absolute';
          iframe.style.left = '-9999px';
          iframe.style.width = '595px';
          iframe.style.height = '842px';
          iframe.style.border = 'none';
          document.body.appendChild(iframe);

          const doc = iframe.contentDocument || iframe.contentWindow.document;
          doc.open();
          doc.write(htmlContent);
          doc.close();

          // Wait for content to load
          await new Promise(r => setTimeout(r, 100));

          // Find A4 page or use body
          const targetElement = doc.querySelector('.a4-page') || doc.body;

          // Generate canvas
          const canvas = await html2canvas(targetElement, {
            scale: 0.45, // Improved scale for better clarity
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false
          });

          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png');

          // Clean up with a small delay to allow dynamic resource fetches to settle
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 500);

          // Cache the result
          cacheRef.current.set(cacheKey, dataUrl);

          // Update thumbnails map
          setThumbnails(prev => {
            const updated = new Map(prev);
            updated.set(pageId, dataUrl);
            return updated;
          });

          setIsGenerating(false);
          resolve(dataUrl);
        } catch (error) {
          console.error('Thumbnail generation failed:', error);
          setIsGenerating(false);
          resolve(null);
        }
      }, debounceMs);
    });
  }, []);

  // Get thumbnail for a specific page
  const getThumbnail = useCallback((pageId) => {
    return thumbnails.get(pageId) || null;
  }, [thumbnails]);

  // Clear thumbnail cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setThumbnails(new Map());
  }, []);

  // Clear specific thumbnail
  const clearThumbnail = useCallback((pageId) => {
    setThumbnails(prev => {
      const updated = new Map(prev);
      updated.delete(pageId);
      return updated;
    });
    
    // Clear from cache
    Array.from(cacheRef.current.keys()).forEach(key => {
      if (key.startsWith(`${pageId}_`)) {
        cacheRef.current.delete(key);
      }
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    generateThumbnail,
    getThumbnail,
    clearCache,
    clearThumbnail,
    isGenerating,
    thumbnails
  };
};

export default useThumbnail;
