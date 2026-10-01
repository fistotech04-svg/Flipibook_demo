/**
 * FlipBookEngine.jsx
 * ─────────────────────────────────────────────────────────────
External dependencies (served from /public/lib/ — no CDN needed):
 *   /lib/jquery.min.js
 *   /lib/turn.min.js
 */

import React, {
    useRef,
    useEffect,
    useCallback,
    useState,
    forwardRef,
    useImperativeHandle,
    useMemo,
} from 'react';
import HTMLFlipBook from 'react-pageflip';
import { initGifRunner } from '../TemplateEditor/AnimationRunner';

/* ─────────────────────────────── helpers ─────────────────────────────── */

const cleanStaticHtml = (html) => {
    if (!html) return '';
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // Remove foreignObjects containing video/iframe from static background so they don't load twice or flash
        doc.querySelectorAll('foreignObject[data-type="video"], foreignObject video, foreignObject iframe').forEach(el => {
            const fo = el.tagName?.toLowerCase() === 'foreignobject' ? el : el.closest('foreignObject');
            if (fo) fo.remove();
            else el.remove();
        });
        return doc.body.innerHTML || html;
    } catch (e) {
        return html;
    }
};

const sanitizePageHtmlForPreview = (html) => {
    if (!html) return '';
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        doc.querySelectorAll('iframe').forEach(iframe => {
            const fo = iframe.closest('foreignObject');
            const hideControls = (fo && fo.getAttribute('data-show-controls') === 'false') || iframe.getAttribute('data-show-controls') === 'false';

            const currentStyle = iframe.getAttribute('style') || '';
            if (currentStyle) {
                const cleanedStyle = currentStyle.replace(/pointer-events\s*:\s*none\s*(?:!important)?\s*;?/gi, '');
                iframe.setAttribute('style', cleanedStyle + (cleanedStyle.endsWith(';') || !cleanedStyle ? '' : ';') + ' pointer-events: auto !important;');
            }

            const src = iframe.getAttribute('src') || '';
            if (hideControls && (src.includes('youtube.com') || src.includes('youtu.be'))) {
                try {
                    const url = new URL(src);
                    url.searchParams.set('controls', '0');
                    iframe.setAttribute('src', url.toString());
                } catch (e) {
                    iframe.setAttribute('src', src.includes('controls=') ? src.replace(/controls=[^&"']+/i, 'controls=0') : `${src}${src.includes('?') ? '&' : '?'}controls=0`);
                }
            }

            iframe.setAttribute('allowfullscreen', 'true');
            const allow = iframe.getAttribute('allow') || '';
            if (!allow) {
                iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
            } else if (!allow.includes('fullscreen')) {
                iframe.setAttribute('allow', `${allow}; fullscreen`);
            }
        });

        return doc.body.innerHTML || html;
    } catch (e) {
        return html;
    }
};

const buildPageDoc = (rawHtml) => `<!DOCTYPE html>
<html>
<head>
<style>
  html, body {
    margin:0; padding:0; overflow:hidden; background:transparent; width:100%; height:100%;
    backface-visibility: hidden !important;
    -webkit-backface-visibility: hidden !important;
  }
  * { box-sizing: border-box; outline: none !important; }

  /* Ensure text inside contentEditable boxes and scrollable features wrap correctly */
  .text-edit-box,
  [contenteditable="true"],
  [data-scrollable="true"],
  foreignObject div {
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
    word-break: normal !important;
    overflow-wrap: anywhere !important;
  }

  foreignObject {
    overflow: visible !important;
    clip-path: none !important;
  }

  foreignObject * {
    clip-path: none !important;
  }

  foreignObject video {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
    border: none !important;
    outline: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    pointer-events: auto !important;
  }
  foreignObject iframe {
    display: block !important;
    border: none !important;
    outline: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    pointer-events: auto !important;
    transform-origin: 0 0 !important;
  }

  foreignObject[data-type="video"] {
    overflow: hidden !important;
    pointer-events: auto !important;
  }

  foreignObject[data-type="video"] * {
    pointer-events: auto !important;
  }

  .flipbook-text-scrollbar::-webkit-scrollbar,
  [data-scrollable="true"]::-webkit-scrollbar,
  [data-scrollable="true"] *::-webkit-scrollbar {
    width: 6px !important;
    height: 6px !important;
    background: transparent !important;
    display: block !important;
    -webkit-appearance: none !important;
  }

  .flipbook-text-scrollbar::-webkit-scrollbar-track,
  [data-scrollable="true"]::-webkit-scrollbar-track,
  [data-scrollable="true"] *::-webkit-scrollbar-track {
    background: #E5E7EB !important;
    border-radius: 10px !important;
  }

  .flipbook-text-scrollbar::-webkit-scrollbar-thumb,
  [data-scrollable="true"]::-webkit-scrollbar-thumb,
  [data-scrollable="true"] *::-webkit-scrollbar-thumb {
    background: #4B5563 !important;
    border-radius: 10px !important;
    border: none !important;
  }

  .flipbook-text-scrollbar::-webkit-scrollbar-thumb:hover,
  [data-scrollable="true"]::-webkit-scrollbar-thumb:hover,
  [data-scrollable="true"] *::-webkit-scrollbar-thumb:hover {
    background: #374151 !important;
  }

  .flipbook-text-scrollbar::-webkit-scrollbar-thumb:active,
  [data-scrollable="true"]::-webkit-scrollbar-thumb:active,
  [data-scrollable="true"] *::-webkit-scrollbar-thumb:active {
    background: #1F2937 !important;
  }

  foreignObject:not([data-scrollable="true"]):not([data-editing="true"])>div {
    width: 100% !important;
    height: auto !important;
  }

  foreignObject[data-sizing-mode="fixed"]>div {
    display: block !important;
  }

  foreignObject[data-scrollable="true"]>div {
    width: 100% !important;
    height: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    box-sizing: border-box !important;
    pointer-events: auto !important;
    -webkit-user-select: text !important;
    user-select: text !important;
  }

  foreignObject[data-scrollable="true"] * {
    -webkit-user-select: text !important;
    user-select: text !important;
    pointer-events: auto !important;
  }

  svg *:not([data-type="pdf-vector-layer"] *):not([data-type="pdf-vector-layer"]) {
    vector-effect: non-scaling-stroke !important;
  }
  [data-type="pdf-vector-layer"],
  [data-type="pdf-vector-layer"] * {
    vector-effect: none !important;
  }
</style>
</head>
<body>${sanitizePageHtmlForPreview(rawHtml || '')}</body>
</html>`;

const scriptPromises = {};

const loadScript = (src) => {
    if (scriptPromises[src]) {
        return scriptPromises[src];
    }

    scriptPromises[src] = new Promise((resolve, reject) => {
        // If another script tag exists somehow, we might need to wait for it, 
        // but since we manage it here, we'll just create it.
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = resolve;
        s.onerror = () => {
            delete scriptPromises[src];
            reject(new Error(`Failed to load ${src}`));
        };
        document.head.appendChild(s);
    });

    return scriptPromises[src];
};

/* ─────────────────────────────── component ─────────────────────────────── */

const FlipBookEngine = forwardRef(function FlipBookEngine(
    {
        pages = [],
        width = 400,
        height = 500,
        flipTime = 5,
        hardCovers = false,
        startPage = 0,
        onFlip,
        onTurning,
        autoplay = false,
        autoplayDuration = 3000,
        useMouseEvents = true,
        cornerEnable = true,
        makeFirstLastPageHard = false,
        selectCustomHardPages = false,
        customHardPages = [],
        cornerRadius = '0px',
        style = {},
        className = '',
        buildPageDoc: externalBuildPageDoc = (html, pageNum) => buildPageDoc(html, pageNum),
        activeLayout,
        flipStyle,
        textureStyle,
        pageOpacity,
        singlePage = false,
        hardCoverZoom,
    },
    ref
) {
    const bookEl = useRef(null);   // DOM node for turn.js
    const reactFlipRef = useRef(null);   // ref for react-pageflip
    const onFlipRef = useRef(onFlip); // always-current onFlip — avoids stale closure in turn.js
    const onTurningRef = useRef(onTurning);
    const [ready, setReady] = useState(false);
    const [currentPage, setCurrentPage] = useState(startPage);
    const [cloneUnderlay, setCloneUnderlay] = useState({ left: null, right: null });

    const [mobileShadowSide, setMobileShadowSide] = useState('left');
    const prevPageRef = useRef(currentPage);

    useEffect(() => {
        if (!pages || pages.length === 0) return;
        
        const getNextSolidPage = (startIndex, direction) => {
            let idx = startIndex;
            while(idx >= 0 && idx < pages.length) {
                if (!pages[idx].isTransparentSheet && !pages[idx].isPad) {
                    return { page: pages[idx], index: idx };
                }
                idx += direction;
            }
            return null;
        };

        let leftInfo = null;
        let rightInfo = null;
        
        let leftIdx = singlePage ? null : (currentPage % 2 !== 0 ? currentPage : currentPage - 1);
        let rightIdx = singlePage ? currentPage : (currentPage % 2 === 0 ? currentPage : currentPage + 1);
        
        if (leftIdx !== null && leftIdx >= 0 && pages[leftIdx]?.isTransparentSheet) {
            leftInfo = getNextSolidPage(leftIdx - 1, -1);
            if (leftInfo) {
                const blurPercent = pages[leftIdx].sheetData?.blur ?? 100;
                leftInfo.blurPx = (blurPercent / 100) * 20;
            }
        }
        if (rightIdx !== null && rightIdx < pages.length && pages[rightIdx]?.isTransparentSheet) {
            rightInfo = getNextSolidPage(rightIdx + 1, 1);
            if (rightInfo) {
                const blurPercent = pages[rightIdx].sheetData?.blur ?? 100;
                rightInfo.blurPx = (blurPercent / 100) * 20;
            }
        }
        
        setCloneUnderlay({ left: leftInfo, right: rightInfo });
    }, [currentPage, pages, singlePage]);

    useEffect(() => {
        if (!singlePage) return;

        const lastPageLogical = pages.length - (pages[pages.length - 1]?.isPad ? 2 : 1);
        const prev = prevPageRef.current;
        const current = currentPage;

        setMobileShadowSide(currentSide => {
            if (current === 0) return 'left';
            if (current >= lastPageLogical) return 'right';
            if (current > prev) return 'left';
            if (current < prev) return currentSide;
            return currentSide;
        });

        prevPageRef.current = current;
    }, [currentPage, singlePage, pages]);

    // Keep the ref in sync every render so turn.js always calls the latest onFlip
    useEffect(() => { onFlipRef.current = onFlip; }, [onFlip]);
    useEffect(() => { onTurningRef.current = onTurning; }, [onTurning]);

    const isProgrammaticRef = useRef(false);

    // Helper to focus the active iframe after a page turn, preventing the "first click is swallowed" bug
    const refocusActiveIframe = useCallback((logicalPage) => {
        try {
            if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
            const wrapper = document.querySelector('.fbe-wrapper');
            if (!wrapper) return;
            
            // Focus the active pages based on the logical page index
            const p1 = logicalPage + 1;
            const p2 = logicalPage + 2;
            const iframes = wrapper.querySelectorAll(`iframe[title="Page ${p1}"], iframe[title="Page ${p2}"]`);
            
            for (let i = 0; i < iframes.length; i++) {
                const iframe = iframes[i];
                iframe.focus();
                if (iframe.contentWindow) iframe.contentWindow.focus();
            }
        } catch (err) {}
    }, []);

    // The broken IFRAME_MOUSEMOVE listener was removed because it was blasting turn.js with invalid coordinates.

    /* ── Engine-selection logic ── */
    // useFullTurnJs = true → soft-cover mode (turn.js handles every page)
    // useFullTurnJs = false → hard-cover mode (react-pageflip handles every page)
    const useFullTurnJs = !hardCovers;

    const showingTurnJs = ready && useFullTurnJs;
    const showingReactFlip = ready && !useFullTurnJs;

    const augmentedPages = useMemo(() => {
        const arr = [...pages];
        return arr;
    }, [pages]);

    /* ── Memoize pages for react-pageflip to prevent iframe reloads ── */
    const memoizedReactPages = useMemo(() => augmentedPages.map((page, i) => {
        let isHardPage = false;

        if (makeFirstLastPageHard) {
            if (i === 0) isHardPage = true;
            if (!singlePage && i === 1) isHardPage = true;
            if (augmentedPages.length % 2 === 0) {
                if (i === augmentedPages.length - 1) isHardPage = true;
                if (!singlePage && i === augmentedPages.length - 2) isHardPage = true;
            }
        }

        if (selectCustomHardPages) {
            if ((customHardPages || []).includes(i)) isHardPage = true;
            // Pad after a custom hard page
            if (page.isPad && i > 0 && (customHardPages || []).includes(i - 1)) isHardPage = true;
        }

        if (!makeFirstLastPageHard && !selectCustomHardPages && hardCovers) {
            if (i === 0) isHardPage = true;
            if (!singlePage && i === 1) isHardPage = true;
            if (augmentedPages.length % 2 === 0) {
                if (i === augmentedPages.length - 1) isHardPage = true;
                if (!singlePage && i === augmentedPages.length - 2) isHardPage = true;
            }
        }

        let startX = 0;
        let startY = 0;
        
        const isLastPage = (i === augmentedPages.length - 1 || (i === augmentedPages.length - 2 && augmentedPages[i + 1]?.isPad));
        const directionClass = i % 2 === 0 ? 'right' : 'left';

        let sheetStyles = {};
        if (page.isTransparentSheet) {
             sheetStyles = {
                 backgroundColor: 'rgba(236, 236, 236, 0.4)',
                 transform: 'translateZ(0)'
             };
        } else {
             sheetStyles = {
                 backgroundColor: page.isPad ? 'transparent' : '#fff',
                 opacity: pageOpacity
             };
        }

        return (
            <div
                key={i}
                data-density={isHardPage ? 'hard' : 'soft'}
                className={`fbe-react-page fbe-react-page--${directionClass} ${i === 0 ? 'fbe-page--first' : ''} ${isLastPage ? 'fbe-page--last' : ''}`}
                style={{
                    ...sheetStyles
                }}
                onMouseDown={(e) => {
                    startX = e.clientX;
                    startY = e.clientY;
                }}
                onMouseUp={(e) => {
                    if (e.target.closest('.fbe-drag-overlay')) return;
                    const diffX = Math.abs(e.clientX - startX);
                    const diffY = Math.abs(e.clientY - startY);
                    if (diffX < 10 && diffY < 10) {
                        e.stopPropagation();
                    }
                }}
                onClick={(e) => {
                    if (e.target.closest('.fbe-drag-overlay')) return;
                    e.stopPropagation();
                }}
            >
                {!page.isPad && (
                    <>
                        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 'inherit' }}>
                            <div
                                className="fbe-static-bg"
                                style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: page.isTransparentSheet ? 'transparent' : '#fff', borderRadius: 'inherit', pointerEvents: 'none' }}
                                dangerouslySetInnerHTML={{ __html: `<style>[data-name="Free Frame"] { stroke: transparent !important; } .fbe-static-bg svg * { vector-effect: non-scaling-stroke !important; }</style>` + cleanStaticHtml(page.html || page.content || '') }}
                            />
                            <iframe
                                title={`Page ${i + 1}`}
                                srcDoc={(externalBuildPageDoc || buildPageDoc)(page.html || page.content || '', i + 1)}
                                onLoad={(e) => { 
                                    e.target.style.opacity = 1; 
                                    try {
                                        if (e.target.contentDocument) {
                                            initGifRunner(e.target.contentDocument);
                                        }
                                    } catch(err) { console.error("Error init gif runner", err); }
                                }}
                                frameBorder="0"
                                allowFullScreen={true}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                style={{ position: 'absolute', inset: 0, border: 'none', outline: 'none', width: '100%', height: '100%', pointerEvents: 'auto', borderRadius: 'inherit', opacity: 0.01, transition: 'opacity 0.3s ease', display: page.isTransparentSheet ? 'none' : 'block' }}
                            />
                        </div>
                        {(!page.isTransparentSheet && textureStyle && (textureStyle.backgroundImage !== 'none' || textureStyle.backgroundColor)) && (
                            <div
                                className="absolute inset-0 z-10 pointer-events-none"
                                style={{
                                    ...textureStyle,
                                    borderRadius: 'inherit'
                                }}
                            />
                        )}
                        {singlePage ? (
                            <>
                                <div className="fbe-drag-overlay" style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '10px', zIndex: 20, cursor: 'grab', pointerEvents: 'auto' }} />
                                <div className="fbe-drag-overlay" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '10px', zIndex: 20, cursor: 'grab', pointerEvents: 'auto' }} />
                            </>
                        ) : (
                            <div
                                className="fbe-drag-overlay"
                                style={{ position: 'absolute', top: 0, bottom: 0, [directionClass]: 0, width: '10px', zIndex: 20, cursor: 'grab', pointerEvents: 'auto' }}
                            />
                        )}
                    </>
                )}
            </div>
        );
    }), [augmentedPages, makeFirstLastPageHard, selectCustomHardPages, customHardPages, hardCovers, externalBuildPageDoc, cornerRadius, textureStyle]);

    /* ── Load Scripts from local /public/lib/ (no CDN) ── */
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                if (!window.jQuery) await loadScript('/lib/jquery.min.js');
                if (!window.jQuery?.fn?.turn) await loadScript('/lib/turn.min.js?v=3');
                if (alive) setReady(true);
            } catch (err) {
                console.error('[FlipBookEngine] Script load failed:', err);
            }
        })();

        // Global mouseup to cancel drag state
        const handleGlobalMouseUp = () => {
            document.querySelectorAll('.fbe-is-dragging').forEach(el => el.classList.remove('fbe-is-dragging'));
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchend', handleGlobalMouseUp);

        return () => {
            alive = false;
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, []);

    /* ── Preload Google Fonts into Parent Document for Static Background ── */
    useEffect(() => {
        const fontsToLoad = new Set();
        augmentedPages.forEach(page => {
            const html = page.html || page.content || '';
            const cssRegex = /font-family\s*:\s*(?:['"]([^'"]+)['"]|([^;}'"\s]+))/g;
            const attrRegex = /font-family\s*=\s*['"]([^'"]+)['"]/g;
            let match;
            while ((match = cssRegex.exec(html)) !== null) {
                let f = match[1] || match[2];
                if (f) f = f.split(',')[0].replace(/['"]/g, '').trim();
                if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
            }
            while ((match = attrRegex.exec(html)) !== null) {
                let f = match[1].split(',')[0].replace(/['"]/g, '').trim();
                if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
            }
        });

        if (fontsToLoad.size > 0) {
            const fontList = Array.from(fontsToLoad).map(f => f.replace(/\s+/g, '+')).join('|');
            const href = `https://fonts.googleapis.com/css?family=${fontList}:300,400,500,600,700,800,900&display=swap`;

            if (!document.querySelector(`link[href="${href}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
            }
        }
    }, [augmentedPages]);

    /* ── Turn.js — "sheet" paper-curl for COVER PAGES only ── */
    const pagesHash = React.useMemo(() => pages.map(p => (p.html || p.content || '') + (p.sheetData ? JSON.stringify(p.sheetData) : '')).join('|'), [pages]);

    useEffect(() => {
        if (!ready || !bookEl.current || !pages.length || !window.jQuery?.fn?.turn || !useFullTurnJs) return;

        const $ = window.jQuery;
        const $book = $(bookEl.current);

        // ── Teardown: destroy old instance AND flush jQuery data ──────────
        // Without removeData(), stale $.data('turn.turn') causes widgetInterface
        // to treat the options object as a method name → TypeError on .apply().
        try {
            const oldData = $book.data();
            if (oldData && oldData.pages) {
                // Wipe the pages from the old instance to neutralize leaked document closures in turn.js v3
                for (let k in oldData.pages) delete oldData.pages[k];
            }
            $book.turn('destroy');
        } catch (_) { /* noop */ }
        $book.off();          // unbind leaked $book listeners
        $book.removeData();   // wipe 'turn.turn' key so next init is always fresh
        $book.empty();

        // turn.js requires an even page count in double-display mode
        const augmented = augmentedPages;

        // Build page DOM elements
        augmented.forEach((page, i) => {
            const pageDiv = document.createElement('div');

            // Determine if this specific page should be hard
            let isPageHard = false;

            // 1. First & Last (Covers)
            if (makeFirstLastPageHard) {
                if (i === 0) isPageHard = true;
                if (!singlePage && i === 1) isPageHard = true;
                if (augmented.length % 2 === 0) {
                    if (i === augmented.length - 1) isPageHard = true;
                    if (!singlePage && i === augmented.length - 2) isPageHard = true;
                }
            }

            // 2. Custom selected pages
            if (selectCustomHardPages) {
                if ((customHardPages || []).some(hp => Number(hp) === i)) isPageHard = true;
                if (page.isPad && i > 0 && (customHardPages || []).some(hp => Number(hp) === i - 1)) {
                    isPageHard = true;
                }
            }

            // 3. Fallback for master toggle
            if (!makeFirstLastPageHard && !selectCustomHardPages && hardCovers) {
                if (i === 0) isPageHard = true;
                if (!singlePage && i === 1) isPageHard = true;
                if (augmented.length % 2 === 0) {
                    if (i === augmented.length - 1) isPageHard = true;
                    if (!singlePage && i === augmented.length - 2) isPageHard = true;
                }
            }

            // [LOG] Debug hard page detection
            if (isPageHard) console.log(`[FlipBookEngine] Page ${i + 1} is HARD`);

            // In turn.js, the "hard" class creates a rigid, non-curling fold. 
            // We use both 'hard' and 'cover' for maximum compatibility with custom patches.
            const isFirst = i === 0;
            const isLast = i === augmented.length - 1 || (i === augmented.length - 2 && augmented[i + 1]?.isPad);
            const positionClass = `${isFirst ? 'fbe-page--first' : ''} ${isLast ? 'fbe-page--last' : ''}`.trim();
            const directionClass = i % 2 === 0 ? 'right' : 'left';

            if (isPageHard) {
                pageDiv.className = `hard cover fbe-page fbe-page--${directionClass} ${positionClass}`;
                pageDiv.setAttribute('data-density', 'hard');
                pageDiv.style.backgroundColor = page.isTransparentSheet ? 'transparent' : '#ffffff';
                pageDiv.style.borderRadius = directionClass === 'right' ? `0 ${cornerRadius} ${cornerRadius} 0` : `${cornerRadius} 0 0 ${cornerRadius}`;
                pageDiv.style.transition = 'border-radius 0.5s ease';
            } else {
                pageDiv.className = `fbe-page fbe-page--soft fbe-page--${directionClass} ${positionClass}`;
                pageDiv.style.backgroundColor = page.isTransparentSheet ? 'transparent' : '';
                pageDiv.style.borderRadius = directionClass === 'right' ? `0 ${cornerRadius} ${cornerRadius} 0` : `${cornerRadius} 0 0 ${cornerRadius}`;
                pageDiv.style.transition = 'border-radius 0.5s ease';
            }

            if (page.isTransparentSheet) {
                pageDiv.style.backgroundColor = 'rgba(236, 236, 236, 0.4)';
                pageDiv.style.transform = 'translateZ(0)';
            }

            if (!page.isPad) {
                const inner = document.createElement('div');
                inner.className = 'fbe-inner';
                inner.style.backgroundColor = page.isTransparentSheet ? 'transparent' : '';
                inner.style.position = 'relative';

                const staticBg = document.createElement('div');
                staticBg.className = 'fbe-static-bg';
                const bgStyleColor = page.isTransparentSheet ? 'transparent' : '#fff';
                staticBg.style.cssText = `position:absolute;inset:0;overflow:hidden;background:${bgStyleColor};pointer-events:none;border-radius:inherit;`;
                staticBg.innerHTML = `<style>[data-name="Free Frame"] { stroke: transparent !important; } .fbe-static-bg svg *:not([data-type="pdf-vector-layer"] *):not([data-type="pdf-vector-layer"]) { vector-effect: non-scaling-stroke !important; } .fbe-static-bg [data-type="pdf-vector-layer"], .fbe-static-bg [data-type="pdf-vector-layer"] * { vector-effect: none !important; }</style>` + cleanStaticHtml(page.html || page.content || '');
                inner.appendChild(staticBg);

                const iframe = document.createElement('iframe');
                iframe.setAttribute('frameBorder', '0');
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
                iframe.srcdoc = (externalBuildPageDoc || buildPageDoc)(page.html || page.content || '', i + 1);
                // Start visible immediately — static background is already showing the page content
                // so there's no blank flash. Images load lazily inside the iframe.
                iframe.style.cssText = 'position:absolute;inset:0;border:none;outline:none;width:100%;height:100%;pointer-events:auto;opacity:1;border-radius:inherit;';
                iframe.onload = () => {
                    try {
                        if (iframe.contentDocument) {
                            initGifRunner(iframe.contentDocument);
                        }
                    } catch(err) { console.error("Error init gif runner", err); }
                };
                inner.appendChild(iframe);

                // Add texture overlay
                if (!page.isTransparentSheet && textureStyle && (textureStyle.backgroundImage !== 'none' || textureStyle.backgroundColor)) {
                    const textureOverlay = document.createElement('div');
                    textureOverlay.className = 'fbe-texture-overlay';
                    Object.assign(textureOverlay.style, {
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10,
                        pointerEvents: 'none',
                        borderRadius: 'inherit',
                        ...textureStyle
                    });
                    inner.appendChild(textureOverlay);
                }

                pageDiv.appendChild(inner);

                // Removed custom click-blocking logic to allow native turn.js behavior
            } else {
                // Invisible pad page
                pageDiv.style.cssText = 'opacity:0;pointer-events:none;background:transparent;';
            }

            $book.append(pageDiv);
        });

        // ── Initialize turn.js ──────────────────────────────────────────
        const totalPages = augmented.length;

        const initPage = Math.max(1, currentPage + 1);

        $book.turn({
            width: singlePage ? width : width * 2,
            height,
            display: singlePage ? 'single' : 'double',
            duration: flipTime,
            acceleration: flipStyle === 'Smooth Flip' || flipStyle === '3D Flip',
            gradients: true,
            cornerSize: Math.max(100, width / 2),
            elevation: flipStyle === '3D Flip' ? 80 : 10,
            pages: totalPages,
            page: initPage,
            autoCenter: false,
            when: {
                start: (e, pageObject, corner) => {
                    // Only apply dragging overlay if it's a manual drag (corner is provided)
                    if (bookEl.current && corner) bookEl.current.classList.add('fbe-is-dragging');
                    // Prevent peel animation for the last page of an odd-numbered flipbook
                    if (!singlePage && augmented.length % 2 !== 0) {
                        // pageObject.page is the 1-based page being dragged.
                        // If it's the last page, and we pull from the right corners, block it.
                        if (pageObject.page === augmented.length && (corner === 'r' || corner === 'tr' || corner === 'br')) {
                            e.preventDefault();
                        }
                    }
                },
                end: (e, pageObject, turned) => {
                    if (bookEl.current) bookEl.current.classList.remove('fbe-is-dragging');
                },
                turning: (e, turnPage) => {
                    // Prevent turning past the last page in odd-numbered flipbooks
                    if (!singlePage && augmented.length % 2 !== 0 && turnPage > augmented.length) {
                        e.preventDefault();
                        return false;
                    }
                    const logical = turnPage - 1;
                    if (onTurningRef.current) onTurningRef.current({ data: logical });
                },
                turned: (_e, turnPage) => {
                    const logical = turnPage - 1;
                    setCurrentPage(logical);
                    // Use the ref so we always call the latest onFlip from PreviewArea
                    if (onFlipRef.current) onFlipRef.current({ data: logical });
                    
                    // Remove dragging class to restore iframe pointer events after programmatic flip
                    if (bookEl.current) bookEl.current.classList.remove('fbe-is-dragging');
                    document.querySelectorAll('.fbe-is-dragging').forEach(el => el.classList.remove('fbe-is-dragging'));
                    
                    refocusActiveIframe(logical);
                },
            },
        });



        if (!useMouseEvents) $book.turn('disable', true);

        return () => {
            try { $book.turn('destroy'); } catch (_) { /* noop */ }
        };
        // onFlip intentionally excluded — it's captured in the closure correctly
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, pagesHash, flipTime, flipStyle, useFullTurnJs, useMouseEvents, externalBuildPageDoc, makeFirstLastPageHard, selectCustomHardPages, customHardPages, cornerRadius, textureStyle]);

    /* ── Handle Window / Container Resize dynamically ── */
    useEffect(() => {
        if (ready && bookEl.current && window.jQuery?.fn?.turn && useFullTurnJs) {
            try {
                window.jQuery(bookEl.current).turn('size', singlePage ? width : width * 2, height);
            } catch (e) { /* ignore */ }
        }
    }, [width, height, singlePage, ready, useFullTurnJs]);

    /* ── Imperative API (exposed via ref) ── */
    const flipNextFn = useCallback(() => {
        // Force blur the navigation button so the iframe can receive interactions natively
        if (document.activeElement) document.activeElement.blur();
        
        // Block auto-turning past the last page if the pages count is odd
        if (!singlePage && pages.length % 2 !== 0 && currentPage >= pages.length - 2) {
            return;
        }

        isProgrammaticRef.current = true;
        if (showingTurnJs && bookEl.current && window.jQuery) {
            window.jQuery(bookEl.current).turn('next');
        } else if (showingReactFlip && reactFlipRef.current) {
            reactFlipRef.current.pageFlip().flipNext();
        }
        setTimeout(() => isProgrammaticRef.current = false, 50);
    }, [showingTurnJs, showingReactFlip, pages.length, singlePage, currentPage]);

    const flipPrevFn = useCallback(() => {
        if (document.activeElement) document.activeElement.blur();

        isProgrammaticRef.current = true;
        if (showingTurnJs && bookEl.current && window.jQuery) {
            window.jQuery(bookEl.current).turn('previous');
        } else if (showingReactFlip && reactFlipRef.current) {
            reactFlipRef.current.pageFlip().flipPrev();
        }
        setTimeout(() => isProgrammaticRef.current = false, 50);
    }, [showingTurnJs, showingReactFlip]);

    const flipToPageFn = useCallback((idx) => {
        isProgrammaticRef.current = true;
        if (showingTurnJs && bookEl.current && window.jQuery) {
            window.jQuery(bookEl.current).turn('page', idx + 1);
        } else if (reactFlipRef.current) {
            reactFlipRef.current.pageFlip().turnToPage(idx);
        }
        setTimeout(() => isProgrammaticRef.current = false, 50);
    }, [showingTurnJs]);

    useImperativeHandle(ref, () => ({
        flipNext: flipNextFn,
        flipPrev: flipPrevFn,
        flipToPage: flipToPageFn,
        getCurrentPageIndex: () => currentPage,
        pageFlip: () => ({
            flipNext: flipNextFn,
            flipPrev: flipPrevFn,
            turnToPage: flipToPageFn,
            getCurrentPageIndex: () => currentPage + 1,
        }),
    }), [flipNextFn, flipPrevFn, flipToPageFn, currentPage]);

    /* ── Sync turn.js when currentPage changes externally ── */
    useEffect(() => {
        if (!showingTurnJs || !bookEl.current || !window.jQuery) return;
        const $book = window.jQuery(bookEl.current);
        if ($book.data('turn')) {
            const wantedPage = currentPage + 1;
            if ($book.turn('page') !== wantedPage) {
                $book.turn('page', wantedPage);
            }
        }
    }, [currentPage, showingTurnJs]);

    /* ── Sync turn.js size when width/height change dynamically ── */
    useEffect(() => {
        if (!showingTurnJs || !bookEl.current || !window.jQuery) return;
        const $book = window.jQuery(bookEl.current);
        if ($book.data('turn')) {
            $book.turn('size', singlePage ? width : width * 2, height);
        }
    }, [width, height, singlePage, showingTurnJs]);

    /* ── Sync react-pageflip size when width/height change dynamically ── */
    useEffect(() => {
        if (!showingReactFlip || !reactFlipRef.current) return;
        const pageFlip = reactFlipRef.current.pageFlip();
        if (pageFlip && typeof pageFlip.update === 'function') {
            // In 'stretch' mode, calling update() forces it to read the new container size
            pageFlip.update();
        }
    }, [width, height, showingReactFlip]);

    /* ── Autoplay ── */
    useEffect(() => {
        if (!autoplay || !ready) return;
        const timer = setInterval(flipNextFn, autoplayDuration);
        return () => clearInterval(timer);
    }, [autoplay, autoplayDuration, ready, flipNextFn]);

    /* ── Sync current page when startPage changes externally ── */
    useEffect(() => {
        if (pages.length > 0 && currentPage !== startPage) {
            setCurrentPage(startPage);
            if (showingTurnJs && bookEl.current && window.jQuery) {
                const $book = window.jQuery(bookEl.current);
                if ($book.data('turn')) {
                    $book.turn('page', startPage + 1);
                }
            }
        }
    }, [startPage, pages.length, showingTurnJs]);

    /* ── Pass-through IFRAME Dragging ── */
    useEffect(() => {
        const handleMessage = (e) => {
            if (!e.data || !showingTurnJs || !window.jQuery) return;

            const $ = window.jQuery;

            const createJqEvent = (type, data) => {
                let clientX = data.originalClientX || 0;
                let clientY = data.originalClientY || 0;

                // Lookup the specific iframe using pageNumber to get its exact position in the parent window
                if (data.pageNumber && bookEl.current) {
                    const iframe = bookEl.current.querySelector(`.p${data.pageNumber} iframe`);
                    if (iframe) {
                        const rect = iframe.getBoundingClientRect();
                        clientX += rect.left;
                        clientY += rect.top;
                    }
                }

                const ev = $.Event(type);
                ev.clientX = clientX;
                ev.clientY = clientY;
                ev.pageX = clientX + window.scrollX;
                ev.pageY = clientY + window.scrollY;
                ev.originalEvent = {
                    touches: [{ pageX: ev.pageX, pageY: ev.pageY, clientX: ev.clientX, clientY: ev.clientY }],
                    preventDefault: () => { },
                    stopPropagation: () => { }
                };
                return ev;
            };

            if (e.data.type === 'IFRAME_MOUSEDOWN') {
                if (bookEl.current) {
                    bookEl.current.classList.add('fbe-is-dragging');

                    let cx = e.data.originalClientX || 0;
                    let cy = e.data.originalClientY || 0;
                    if (e.data.pageNumber && bookEl.current) {
                        const iframe = bookEl.current.querySelector(`.p${e.data.pageNumber} iframe`);
                        if (iframe) {
                            const rect = iframe.getBoundingClientRect();
                            cx += rect.left;
                            cy += rect.top;
                        }
                    }
                    window._fbeDragOffset = {
                        x: (e.data.screenX || 0) - cx,
                        y: (e.data.screenY || 0) - cy
                    };

                    $(bookEl.current).trigger(createJqEvent('mousedown', { originalClientX: cx, originalClientY: cy }));
                    $(bookEl.current).trigger(createJqEvent('touchstart', { originalClientX: cx, originalClientY: cy }));
                }
            } else if (e.data.type === 'IFRAME_MOUSEMOVE') {
                if (bookEl.current && bookEl.current.classList.contains('fbe-is-dragging')) {
                    const offset = window._fbeDragOffset || { x: 0, y: 0 };
                    const cx = (e.data.screenX || 0) - offset.x;
                    const cy = (e.data.screenY || 0) - offset.y;
                    
                    $(document).trigger(createJqEvent('mousemove', { originalClientX: cx, originalClientY: cy }));
                    $(document).trigger(createJqEvent('touchmove', { originalClientX: cx, originalClientY: cy }));
                }
            } else if (e.data.type === 'IFRAME_MOUSEUP') {
                if (bookEl.current && bookEl.current.classList.contains('fbe-is-dragging')) {
                    bookEl.current.classList.remove('fbe-is-dragging');
                    const offset = window._fbeDragOffset || { x: 0, y: 0 };
                    const cx = (e.data.screenX || 0) - offset.x;
                    const cy = (e.data.screenY || 0) - offset.y;
                    
                    $(document).trigger(createJqEvent('mouseup', { originalClientX: cx, originalClientY: cy }));
                    $(document).trigger(createJqEvent('touchend', { originalClientX: cx, originalClientY: cy }));
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [showingTurnJs]);

    const bookTransition = `transform ${flipTime}ms ease`;

    /* ── Render ── */
    return (
        <div
            className={`fbe-wrapper ${className}`}
            data-single-page={singlePage}
            data-mobile-shadow={mobileShadowSide}
            style={{
                width: singlePage ? width : width * 2, height, position: 'relative',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...style,
                opacity: pageOpacity ?? 1,
            }}
        >
            <style>{`
                .fbe-is-dragging iframe {
                    pointer-events: none !important;
                }
            `}</style>
            
            {/* Loading indicator */}
            {!ready && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7', color: '#999', fontSize: '13px', zIndex: 10 }}>
                    Loading FlipBook…
                </div>
            )}

            {/* ── CLONE UNDERLAY for Transparent Sheets ── */}
            <div className="fbe-clone-underlay" style={{
                position: 'absolute', zIndex: showingTurnJs ? 2 : 90, 
                display: 'flex', pointerEvents: 'none',
                width: singlePage ? width : width * 2, height,
                visibility: (showingTurnJs || showingReactFlip) ? 'visible' : 'hidden',
                background: 'transparent',
                transform: (showingReactFlip && hardCoverZoom) ? `scale(${hardCoverZoom.scale})` : 'none',
                transformOrigin: '0 0'
            }}>
                <div style={{flex: 1, position: 'relative', overflow: 'hidden'}}>
                    {cloneUnderlay.left && (
                        <iframe 
                            title={`Clone Left`}
                            frameBorder="0"
                            srcDoc={(externalBuildPageDoc || buildPageDoc)(cloneUnderlay.left.page.html || cloneUnderlay.left.page.content || '', cloneUnderlay.left.index + 1)}
                            style={{position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: '#fff', filter: `blur(${cloneUnderlay.left.blurPx}px)`}} 
                        />
                    )}
                </div>
                {!singlePage && (
                    <div style={{flex: 1, position: 'relative', overflow: 'hidden'}}>
                        {cloneUnderlay.right && (
                            <iframe 
                                title={`Clone Right`}
                                frameBorder="0"
                                srcDoc={(externalBuildPageDoc || buildPageDoc)(cloneUnderlay.right.page.html || cloneUnderlay.right.page.content || '', cloneUnderlay.right.index + 1)}
                                style={{position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: '#fff', filter: `blur(${cloneUnderlay.right.blurPx}px)`}} 
                            />
                        )}
                    </div>
                )}
            </div>

            {/* ── TURN.JS ENGINE — centering wrapper ── */}
            <div
                style={{
                    width: singlePage ? width : width * 2,
                    height,
                    position: 'relative',
                    transition: bookTransition,
                    visibility: showingTurnJs ? 'visible' : 'hidden',
                    pointerEvents: showingTurnJs ? 'auto' : 'none',
                    zIndex: showingTurnJs ? 5 : 1,
                }}
                onPointerDownCapture={(e) => {
                    if (!singlePage && pages.length % 2 !== 0 && currentPage >= pages.length - 2) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        if (clickX > rect.width / 2) {
                            e.stopPropagation();
                        }
                    }
                }}
                onMouseDownCapture={(e) => {
                    if (!singlePage && pages.length % 2 !== 0 && currentPage >= pages.length - 2) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        if (clickX > rect.width / 2) {
                            e.stopPropagation();
                        }
                    }
                }}
                onTouchStartCapture={(e) => {
                    if (!singlePage && pages.length % 2 !== 0 && currentPage >= pages.length - 2 && e.touches.length > 0) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.touches[0].clientX - rect.left;
                        if (clickX > rect.width / 2) {
                            e.stopPropagation();
                        }
                    }
                }}
            >
                {/* turn.js mounts pages directly inside this div — keep styles minimal */}
                <div
                    ref={bookEl}
                    className="fbe-book"
                    style={{
                        width: singlePage ? width : width * 2,
                        height,
                        position: 'relative',
                        background: 'transparent',
                    }}
                />
            </div>

            {/* ── REACT-PAGEFLIP ENGINE — handles hard-cover mode ── */}
            {showingReactFlip && ( // wrapper for possible hard cover zoom
                <div style={hardCoverZoom ? { transform: `scale(${hardCoverZoom.scale})`, transformOrigin: '0 0' } : {}} className="fbe-react-wrapper">
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 100,
                        background: 'transparent',
                        transition: bookTransition,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <HTMLFlipBook
                            key={'react-flip'}
                            ref={reactFlipRef}
                            width={width} height={height} size={'stretch'}
                            minWidth={100} maxWidth={4000}
                            minHeight={100} maxHeight={4000}
                            drawShadow={flipStyle !== 'Fast Flip'}
                            useMouseEvents={useMouseEvents}
                            flippingTime={flipTime}
                            startPage={Number(activeLayout) === 1 ? currentPage : startPage}
                            showCover={true}
                            usePortrait={singlePage}
                            autoCenter={false}
                            clickEventForward={false} // Disable flipping on single click
                            onChangeState={(e) => {
                                const wrapper = document.querySelector('.fbe-react-wrapper');
                                if (wrapper) {
                                    if (e.data !== 'read' && !isProgrammaticRef.current) wrapper.classList.add('fbe-is-dragging');
                                    else wrapper.classList.remove('fbe-is-dragging');
                                }
                            }}
                            style={{ background: 'transparent', width: '100%', height: '100%' }}
                            onFlip={(e) => {
                                const logical = e.data;
                                setCurrentPage(logical);
                                if (onFlipRef.current) onFlipRef.current({ data: logical });
                                
                                // Remove dragging class to restore iframe pointer events
                                const wrapper = document.querySelector('.fbe-react-wrapper');
                                if (wrapper) wrapper.classList.remove('fbe-is-dragging');
                                document.querySelectorAll('.fbe-is-dragging').forEach(el => el.classList.remove('fbe-is-dragging'));
                                
                                refocusActiveIframe(logical);
                            }}
                        >
                            {memoizedReactPages}
                        </HTMLFlipBook>
                    </div>
                </div>
            )}


            {/* Page styles */}
            <style>{`
                .fbe-wrapper, .fbe-wrapper * {
                    outline: none !important;
                    user-select: none !important;
                    -webkit-user-select: none !important;
                    -webkit-user-drag: none !important;
                }

                .fbe-page {
                    background: #fff;
                    overflow: hidden;
                    margin: 0;
                    padding: 0;
                    -webkit-transform: translate3d(0,0,0);
                    box-shadow: none !important;
                    border: none !important;
                    outline: none !important;
                }

                .fbe-inner {
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    background: #fff;
                    margin: 0;
                    padding: 0;
                    box-shadow: none !important;
                    border: none !important;
                }

                .turn-page {
                    box-shadow: none !important;
                    border: none !important;
                    outline: none !important;
                }

                /* React-pageflip specific classes */
                .fbe-react-page {
                    width: 100%;
                    height: 100%;
                    overflow: hidden !important;
                    transition: border-radius 0.5s ease;
                    -webkit-transform: translateZ(0);
                }

                .fbe-react-page--left, .fbe-page--left {
                    border-radius: ${cornerRadius} 0 0 ${cornerRadius} !important;
                }

                .fbe-react-page--right, .fbe-page--right {
                    border-radius: 0 ${cornerRadius} ${cornerRadius} 0 !important;
                }

                .fbe-react-page--left::after, .fbe-page--left::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 80px;
                    background: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.02) 20%, rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.4) 100%);
                    pointer-events: none;
                    z-index: 20;
                }

                .fbe-react-page--right::after, .fbe-page--right::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    width: 40px;
                    background: linear-gradient(to left, transparent 0%, rgba(0,0,0,0.02) 20%, rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.4) 100%);
                    pointer-events: none;
                    z-index: 20;
                }

                .fbe-wrapper[data-single-page="true"][data-mobile-shadow="left"] .fbe-react-page,
                .fbe-wrapper[data-single-page="true"][data-mobile-shadow="left"] .fbe-page {
                    border-radius: 0 ${cornerRadius} ${cornerRadius} 0 !important;
                }
                .fbe-wrapper[data-single-page="true"][data-mobile-shadow="left"] .fbe-react-page::after,
                .fbe-wrapper[data-single-page="true"][data-mobile-shadow="left"] .fbe-page::after {
                    left: 0 !important;
                    right: auto !important;
                    background: linear-gradient(to left, transparent 0%, rgba(0,0,0,0.02) 20%, rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.4) 100%) !important;
                }

                .fbe-wrapper[data-single-page="true"][data-mobile-shadow="right"] .fbe-react-page,
                .fbe-wrapper[data-single-page="true"][data-mobile-shadow="right"] .fbe-page {
                    border-radius: ${cornerRadius} 0 0 ${cornerRadius} !important;
                }
                .fbe-wrapper[data-single-page="true"][data-mobile-shadow="right"] .fbe-react-page::after,
                .fbe-wrapper[data-single-page="true"][data-mobile-shadow="right"] .fbe-page::after {
                    right: 0 !important;
                    left: auto !important;
                    background: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.02) 20%, rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.4) 100%) !important;
                }

                .fbe-page--first::after, .fbe-page--last::after {
                    width: 40px !important;
                }

                /* Force turn.js hard pages to remain rigid and hide internal peel gradients */
                .hard,
                .turn-page.hard,
                .cover {
                    background-color: #fff !important;
                    box-shadow: none !important;
                    -webkit-transform-style: preserve-3d !important;
                    transform-style: preserve-3d !important;
                }

                .hard .fbe-inner,
                .cover .fbe-inner {
                    backface-visibility: hidden !important;
                    -webkit-backface-visibility: hidden !important;
                }

                /* Remove any shadow/peel effects for hard pages only */
                .hard .p-shadow,
                .hard .p-gradient,
                .cover .p-shadow,
                .cover .p-gradient {
                    display: none !important;
                }
                
                /* Reset global cursor pointer applied by flipbook engines and their descendants */
                .stf__wrapper, .stf__block {
                    background: transparent !important;
                }
                .stf__wrapper, .stf__wrapper *, 
                .stf__block, .stf__block *, 
                .turn-page-wrapper, .turn-page-wrapper *, 
                .turn-page, .turn-page *, 
                .fbe-wrapper, .fbe-wrapper *, 
                .fbe-react-page, .fbe-react-page *,
                .fbe-book, .fbe-book * {
                    cursor: default;
                }
                
                /* Hand cursor for turn.js pages and drag overlays */
                .fbe-drag-overlay {
                    cursor: grab !important;
                    pointer-events: auto !important;
                }
                .fbe-drag-overlay:active {
                    cursor: grabbing !important;
                }
                .turn-page-wrapper, .turn-page {
                    cursor: grab;
                }
                .turn-page-wrapper:active, .turn-page:active {
                    cursor: grabbing;
                }
                
                /* When dragging, disable iframe pointer events so they don't swallow mouse movements */
                .fbe-is-dragging iframe,
                .fbe-wrapper.fbe-is-dragging iframe {
                    pointer-events: none !important;
                }

                /* Add a global invisible shield over the entire wrapper during a drag to guarantee mousemove tracking */
                .fbe-wrapper.fbe-is-dragging::after {
                    content: '';
                    position: absolute;
                    top: -100px;
                    left: -100px;
                    right: -100px;
                    bottom: -100px;
                    z-index: 9999;
                    cursor: grabbing !important;
                }
            `}</style>
        </div>
    );
});

const MemoizedFlipBookEngine = React.memo(FlipBookEngine);

export default MemoizedFlipBookEngine;

