export const initAnimationRunner = function(doc) {
  // Re-initialization is allowed as doc.write wipes the body but doc object might persist
  doc.__animationRunnerInitialized = true;  const WAAPI_ANIMATIONS = {
    'none': [],
    'fade-in': [{ opacity: 0 }, { opacity: 1 }],
    'fade-out': [{ opacity: 1 }, { opacity: 0 }],
    'blur-in': [{ filter: 'blur(20px)', opacity: 0 }, { filter: 'blur(0)', opacity: 1 }],
    'focus-in': [{ filter: 'blur(12px)', opacity: 0, scale: '1.2' }, { filter: 'blur(0)', opacity: 1, scale: '1' }],
    'glass-reveal': [{ opacity: 0, backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)' }, { opacity: 1, backdropFilter: 'blur(0px)', webkitBackdropFilter: 'blur(0px)' }],
    'perspective-in': [{ transform: 'perspective(400px) rotateX(-60deg) translateZ(-500px)', opacity: 0 }, { transform: 'perspective(400px) rotateX(0deg) translateZ(0)', opacity: 1 }],
    'slide-up': [{ translate: '0 100px', opacity: 0 }, { translate: '0 0', opacity: 1 }],
    'slide-down': [{ translate: '0 -100px', opacity: 0 }, { translate: '0 0', opacity: 1 }],
    'slide-left': [{ translate: '100px 0', opacity: 0 }, { translate: '0 0', opacity: 1 }],
    'slide-right': [{ translate: '-100px 0', opacity: 0 }, { translate: '0 0', opacity: 1 }],
    'back-in-up': [{ translate: '0 500px', scale: '0.7', opacity: 0 }, { translate: '0 0', scale: '0.7', opacity: 0.7, offset: 0.8 }, { translate: '0 0', scale: '1', opacity: 1 }],
    'back-in-down': [{ translate: '0 -500px', scale: '0.7', opacity: 0 }, { translate: '0 0', scale: '0.7', opacity: 0.7, offset: 0.8 }, { translate: '0 0', scale: '1', opacity: 1 }],
    'back-in-left': [{ translate: '-500px 0', scale: '0.7', opacity: 0 }, { translate: '0 0', scale: '0.7', opacity: 0.7, offset: 0.8 }, { translate: '0 0', scale: '1', opacity: 1 }],
    'back-in-right': [{ translate: '500px 0', scale: '0.7', opacity: 0 }, { translate: '0 0', scale: '0.7', opacity: 0.7, offset: 0.8 }, { translate: '0 0', scale: '1', opacity: 1 }],
    'zoom-in': [{ scale: '0', opacity: 0 }, { scale: '1', opacity: 1 }],
    'zoom-out': [{ scale: '1', opacity: 1 }, { scale: '0', opacity: 0 }],
    'zoom-in-up': [{ scale: '0.1', translate: '0 100px', opacity: 0 }, { scale: '1', translate: '0 0', opacity: 1 }],
    'zoom-in-down': [{ scale: '0.1', translate: '0 -100px', opacity: 0 }, { scale: '1', translate: '0 0', opacity: 1 }],
    'rotate-in': [{ rotate: '-200deg', scale: '0', opacity: 0 }, { rotate: '0deg', scale: '1', opacity: 1 }],
    'rotate-in-down-left': [{ rotate: '-45deg', transformOrigin: 'left bottom', opacity: 0 }, { rotate: '0deg', transformOrigin: 'left bottom', opacity: 1 }],
    'rotate-in-up-right': [{ rotate: '-90deg', transformOrigin: 'right bottom', opacity: 0 }, { rotate: '0deg', transformOrigin: 'right bottom', opacity: 1 }],
    'bounce-in': [{ scale: '0.3', opacity: 0 }, { scale: '1.1', opacity: 0.8, offset: 0.5 }, { scale: '0.9', opacity: 1, offset: 0.7 }, { scale: '1', opacity: 1 }],
    'bounce-out': [{ scale: '1', opacity: 1 }, { scale: '1.1', opacity: 0.8, offset: 0.2 }, { scale: '0.3', opacity: 0, offset: 1 }],
    'flip-in': [{ transform: 'perspective(400px) rotateX(90deg)', opacity: 0 }, { transform: 'perspective(400px) rotateX(0deg)', opacity: 1 }],
    'flip-in-y': [{ transform: 'perspective(400px) rotateY(90deg)', opacity: 0 }, { transform: 'perspective(400px) rotateY(0deg)', opacity: 1 }],
    'roll-in': [{ translate: '-100px 0', rotate: '-120deg', opacity: 0 }, { translate: '0 0', rotate: '0deg', opacity: 1 }],
    'pulse': [{ scale: '1' }, { scale: '1.1', offset: 0.5 }, { scale: '1' }],
    'heartbeat': [{ scale: '1' }, { scale: '1.3', offset: 0.14 }, { scale: '1', offset: 0.28 }, { scale: '1.3', offset: 0.42 }, { scale: '1', offset: 0.7 }],
    'float': [{ translate: '0 0' }, { translate: '0 -15px', offset: 0.5 }, { translate: '0 0' }],
    'neon-glow': [{ filter: 'brightness(1) drop-shadow(0 0 0px rgba(79, 70, 229, 0))' }, { filter: 'brightness(1.5) drop-shadow(0 0 10px rgba(79, 70, 229, 0.8))', offset: 0.5 }, { filter: 'brightness(1) drop-shadow(0 0 0px rgba(79, 70, 229, 0))' }],
    'tada': [{ scale: '1', rotate: '0deg' }, { scale: '0.9', rotate: '-3deg', offset: 0.1 }, { scale: '0.9', rotate: '-3deg', offset: 0.2 }, { scale: '1.1', rotate: '3deg', offset: 0.3 }, { scale: '1.1', rotate: '-3deg', offset: 0.4 }, { scale: '1.1', rotate: '3deg', offset: 0.5 }, { scale: '1.1', rotate: '-3deg', offset: 0.6 }, { scale: '1.1', rotate: '3deg', offset: 0.7 }, { scale: '1.1', rotate: '-3deg', offset: 0.8 }, { scale: '1.1', rotate: '3deg', offset: 0.9 }, { scale: '1', rotate: '0deg' }],
    'rubber-band': [{ scale: '1 1' }, { scale: '1.25 0.75', offset: 0.3 }, { scale: '0.75 1.25', offset: 0.4 }, { scale: '1.15 0.85', offset: 0.5 }, { scale: '0.95 1.05', offset: 0.65 }, { scale: '1.05 0.95', offset: 0.75 }, { scale: '1 1' }],
    'jello': [{ transform: 'skew(0,0)' }, { transform: 'skew(-12.5deg, -12.5deg)', offset: 0.22 }, { transform: 'skew(6.25deg, 6.25deg)', offset: 0.33 }, { transform: 'skew(-3.125deg, -3.125deg)', offset: 0.44 }, { transform: 'skew(1.5625deg, 1.5625deg)', offset: 0.55 }, { transform: 'skew(-0.78deg, -0.78deg)', offset: 0.66 }, { transform: 'skew(0.39deg, 0.39deg)', offset: 0.77 }, { transform: 'skew(-0.2deg, -0.2deg)', offset: 0.88 }, { transform: 'skew(0,0)' }],
    'swing': [{ rotate: '0deg' }, { rotate: '15deg', offset: 0.2 }, { rotate: '-10deg', offset: 0.4 }, { rotate: '5deg', offset: 0.6 }, { rotate: '-5deg', offset: 0.8 }, { rotate: '0deg' }],
    'wobble': [{ translate: '0 0', rotate: '0deg' }, { translate: '-25% 0', rotate: '-5deg', offset: 0.15 }, { translate: '20% 0', rotate: '3deg', offset: 0.3 }, { translate: '-15% 0', rotate: '-3deg', offset: 0.45 }, { translate: '10% 0', rotate: '2deg', offset: 0.6 }, { translate: '-5% 0', rotate: '-1deg', offset: 0.75 }, { translate: '0 0', rotate: '0deg' }],
    'glitch': [{ translate: '0' }, { translate: '-2px 2px', offset: 0.2 }, { translate: '2px -2px', offset: 0.4 }, { translate: '-2px 2px', offset: 0.6 }, { translate: '2px -2px', offset: 0.8 }, { translate: '0' }],
  };

  const LOOP_ANIMATIONS = ['pulse', 'tada', 'rubber-band', 'jello', 'heartbeat', 'glitch', 'neon-glow', 'swing', 'wobble', 'float'];

  const getWaapiEase = (name) => {
    const map = {
      'Linear': 'linear',
      'Smooth': 'ease-in-out',
      'Ease In': 'ease-in',
      'Ease Out': 'ease-out',
      'Ease In & Out': 'ease-in-out',
      'Bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    };
    return map[name] || 'linear';
  };

  const runAnim = (el, type, settings) => {
    if (!type || !WAAPI_ANIMATIONS[type] || type === 'none') {
        if (el.__currentAnimation) {
            el.__currentAnimation.cancel();
            el.__currentAnimation = null;
        }
        return;
    }
    
    if (el.__currentAnimation) {
      el.__currentAnimation.cancel();
    }

    const duration = ((parseFloat(settings?.duration || 1)) / (parseFloat(settings?.speed || 1))) * 1000;
    const delay = (parseFloat(settings?.delay || 0)) * 1000;
    const easing = getWaapiEase(settings?.easing || 'Linear');
    let iterations = 1;
    let isLoop = LOOP_ANIMATIONS.includes(type) || settings?.isAlways;

    if (isLoop) {
        iterations = Infinity;
    } else if (settings?.repeat) {
        if (settings.repeat === 'Infinite') {
            iterations = Infinity;
            isLoop = true;
        }
        else if (settings.repeat === 'Once') iterations = 1;
        else if (settings.repeat === 'Twice') iterations = 2;
        else if (settings.repeat === 'Thrice') iterations = 3;
        else if (settings.repeat === 'None') iterations = 1;
        else {
            const parsed = parseInt(settings.repeat);
            if (!isNaN(parsed) && parsed > 0) iterations = parsed;
        }
    }

    try {
      let cx = 0, cy = 0;
      let useMathOrigin = false;
      let cachedBBox = { x: 0, y: 0, width: 0, height: 0 };
      const isSVG = el.namespaceURI === 'http://www.w3.org/2000/svg' || el.ownerSVGElement !== undefined;
      if (isSVG) {
          try {
              cachedBBox = el.getBBox();
              cx = cachedBBox.x + cachedBBox.width / 2;
              cy = cachedBBox.y + cachedBBox.height / 2;
              useMathOrigin = true;
              el.style.transformOrigin = '0 0';
          } catch(e) {
              el.style.transformBox = 'fill-box';
              el.style.transformOrigin = 'center';
          }
      }
      if (el.__originalTransform === undefined) {
          let baseTransform = window.getComputedStyle(el).transform;
          if (!baseTransform || baseTransform === 'none') {
              const transformAttr = el.getAttribute('transform');
              if (transformAttr) {
                  try {
                      const dummy = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                      dummy.setAttribute('transform', transformAttr);
                      if (dummy.transform.baseVal) {
                          dummy.transform.baseVal.consolidate();
                          if (dummy.transform.baseVal.numberOfItems > 0) {
                              const m = dummy.transform.baseVal.getItem(0).matrix;
                              baseTransform = `matrix(${m.a}, ${m.b}, ${m.c}, ${m.d}, ${m.e}, ${m.f})`;
                          }
                      }
                  } catch(e) {}
              }
          }
          el.__originalTransform = (!baseTransform || baseTransform === 'none') ? '' : baseTransform;
      }

      const baseTransform = el.__originalTransform;
      const shadowCaster = el.previousElementSibling?.classList?.contains('svg-drop-shadow-caster') ? el.previousElementSibling : null;

      const finalKeyframes = WAAPI_ANIMATIONS[type].map(kf => {
          const newKf = { ...kf };
          let transformParts = [];
          if (newKf.translate) { transformParts.push(`translate(${String(newKf.translate).split(' ').join(',')})`); delete newKf.translate; }
          if (newKf.rotate) { const r = String(newKf.rotate).trim(); transformParts.push(`rotate(${r === '0' ? '0deg' : r})`); delete newKf.rotate; }
          if (newKf.scale !== undefined) { transformParts.push(`scale(${String(newKf.scale).split(' ').join(',')})`); delete newKf.scale; }
          if (newKf.skew) { const parts = String(newKf.skew).split(',').map(p => p.trim() === '0' ? '0deg' : p.trim()); transformParts.push(`skew(${parts.join(',')})`); delete newKf.skew; }
          
          let combinedKfTransform = newKf.transform || '';
          if (transformParts.length > 0) { combinedKfTransform = `${combinedKfTransform} ${transformParts.join(' ')}`.trim(); }
          
          if (baseTransform || useMathOrigin) {
              if (combinedKfTransform) {
                  if (useMathOrigin) {
                      let px = cx; let py = cy;
                      if (newKf.transformOrigin) {
                          const origin = newKf.transformOrigin;
                          if (origin.includes('left')) px = cachedBBox.x;
                          if (origin.includes('right')) px = cachedBBox.x + cachedBBox.width;
                          if (origin.includes('top')) py = cachedBBox.y;
                          if (origin.includes('bottom')) py = cachedBBox.y + cachedBBox.height;
                          delete newKf.transformOrigin;
                      }
                      newKf.transform = `${baseTransform} translate(${px}px, ${py}px) ${combinedKfTransform} translate(-${px}px, -${py}px)`;
                  } else {
                      newKf.transform = `${baseTransform} ${combinedKfTransform}`;
                  }
              } else {
                  newKf.transform = baseTransform;
              }
          } else if (combinedKfTransform) {
              newKf.transform = combinedKfTransform;
          }
          return newKf;
      });

      el.setAttribute('data-is-animating', 'true');
      const animSettings = { duration, delay, easing, fill: isLoop ? 'none' : 'forwards', iterations };
      const anim = el.animate(finalKeyframes, animSettings);

      let shadowAnim = null;
      if (shadowCaster) {
          if (shadowCaster.__currentAnimation) {
              try { shadowCaster.__currentAnimation.cancel(); } catch(err) {}
          }
          shadowCaster.setAttribute('data-is-animating', 'true');
          shadowAnim = shadowCaster.animate(finalKeyframes, animSettings);
      }

      const cleanup = () => {
        el.removeAttribute('data-is-animating');
        if (shadowCaster) shadowCaster.removeAttribute('data-is-animating');
        if (el.__currentAnimation === anim) el.__currentAnimation = null;
        if (shadowCaster && shadowCaster.__currentAnimation === shadowAnim) shadowCaster.__currentAnimation = null;
      };
      anim.onfinish = cleanup;
      anim.oncancel = cleanup;

      el.__currentAnimation = anim;
      if (shadowCaster) shadowCaster.__currentAnimation = shadowAnim;
    } catch (e) {
      console.error("Animation error", e);
    }
  };

  const handleTrigger = () => {
    doc.querySelectorAll('[data-animation-intent="true"]').forEach(el => {
        const trigger = el.getAttribute('data-animation-trigger');
        
        // 1. While Opening
        if (trigger === 'While Opening') {
            const type = el.getAttribute('data-animation-open-type');
            if (type && type !== 'none') {
                const everyVisit = el.getAttribute('data-animation-open-every-visit') !== 'false';
                
                if (!everyVisit) {
                    const runKey = `anim_run_${el.id || el.getAttribute('data-name')}`;
                    if (sessionStorage.getItem(runKey)) return;
                    sessionStorage.setItem(runKey, 'true');
                }

                const settingsStr = JSON.stringify({
                   type,
                   duration: el.getAttribute('data-animation-open-duration'),
                   speed: el.getAttribute('data-animation-open-speed'),
                   delay: el.getAttribute('data-animation-open-delay'),
                   easing: el.getAttribute('data-animation-open-easing'),
                   repeat: el.getAttribute('data-animation-open-repeat')
                });

                const hasChanged = el.__lastOpenSettings !== settingsStr;
                if (!everyVisit && el.__animOpened && !hasChanged) return;
                
                runAnim(el, type, {
                  duration: el.getAttribute('data-animation-open-duration'),
                  speed: el.getAttribute('data-animation-open-speed'),
                  delay: el.getAttribute('data-animation-open-delay'),
                  easing: el.getAttribute('data-animation-open-easing'),
                  repeat: el.getAttribute('data-animation-open-repeat')
                });
                
                el.__animOpened = true;
                el.__lastOpenSettings = settingsStr;
            } else {
                runAnim(el, 'none'); // Cleanup
            }
        }
        
        // 2. On Page - Always
        else if (trigger === 'On Page' && el.getAttribute('data-animation-action') === 'Always') {
            const type = el.getAttribute('data-animation-interact-type');
            if (type && type !== 'none') {
                const settingsStr = JSON.stringify({
                  type,
                  duration: el.getAttribute('data-animation-interact-duration'),
                  speed: el.getAttribute('data-animation-interact-speed'),
                  delay: el.getAttribute('data-animation-interact-delay'),
                  easing: el.getAttribute('data-animation-interact-easing'),
                  repeat: el.getAttribute('data-animation-interact-repeat')
                });

                if (el.__lastAlwaysSettings === settingsStr) return;

                runAnim(el, type, {
                  duration: el.getAttribute('data-animation-interact-duration'),
                  speed: el.getAttribute('data-animation-interact-speed'),
                  delay: el.getAttribute('data-animation-interact-delay'),
                  easing: el.getAttribute('data-animation-interact-easing'),
                  repeat: el.getAttribute('data-animation-interact-repeat'),
                  isAlways: true
                });
                el.__lastAlwaysSettings = settingsStr;
            } else {
                runAnim(el, 'none');
                el.__lastAlwaysSettings = null;
            }
        }

        // 3. On Page - Click/Hover
        else if (trigger === 'On Page') {
            const action = el.getAttribute('data-animation-action');
            if (action === 'Click') {
                if (!el.__clickBound) {
                    el.__clickBound = true;
                    el.style.cursor = 'pointer';
                    el.addEventListener('click', (e) => {
                        if (el.getAttribute('data-animation-trigger') !== 'On Page' || el.getAttribute('data-animation-action') !== 'Click') return;
                        if (el.__currentAnimation && el.__currentAnimation.playState === 'running') return;
                        e.stopPropagation();
                        const type = el.getAttribute('data-animation-interact-type');
                        runAnim(el, type, {
                            duration: el.getAttribute('data-animation-interact-duration'),
                            speed: el.getAttribute('data-animation-interact-speed'),
                            delay: el.getAttribute('data-animation-interact-delay'),
                            easing: el.getAttribute('data-animation-interact-easing'),
                            repeat: el.getAttribute('data-animation-interact-repeat')
                        });
                    });
                }
            } else if (action === 'Hover') {
                if (!el.__hoverBound) {
                    el.__hoverBound = true;
                    el.addEventListener('mouseenter', () => {
                        if (el.getAttribute('data-animation-trigger') !== 'On Page' || el.getAttribute('data-animation-action') !== 'Hover') return;
                        if (el.__currentAnimation && el.__currentAnimation.playState === 'running') return;
                        const type = el.getAttribute('data-animation-interact-type');
                        runAnim(el, type, {
                            duration: el.getAttribute('data-animation-interact-duration'),
                            speed: el.getAttribute('data-animation-interact-speed'),
                            delay: el.getAttribute('data-animation-interact-delay'),
                            easing: el.getAttribute('data-animation-interact-easing'),
                            repeat: el.getAttribute('data-animation-interact-repeat')
                        });
                    });
                }
            }
            // If it was "Always" but now it's "Click", Always loop should stop
            if (el.__lastAlwaysSettings) {
                runAnim(el, 'none');
                el.__lastAlwaysSettings = null;
            }
        }
        
        // 4. Default if trigger is unknown or none
        else {
            runAnim(el, 'none');
            el.__lastAlwaysSettings = null;
        }
    });
  };

  const observer = new MutationObserver((mutations) => {
    let shouldTrigger = false;
    mutations.forEach(m => {
      if (m.type === 'attributes' && m.attributeName.startsWith('data-animation-')) {
        shouldTrigger = true;
      }
      if (m.type === 'childList' && m.addedNodes.length > 0) {
        shouldTrigger = true;
      }
    });
    if (shouldTrigger) handleTrigger();
  });

  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    attributes: true
  });

  // Listen for re-trigger messages (for flipbook flips)
  window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'RETRIGGER_ANIMATIONS') {
          // Only reset entrance state if everyVisit is enabled
          doc.querySelectorAll('[data-animation-trigger="While Opening"]').forEach(el => {
              const everyVisit = el.getAttribute('data-animation-open-every-visit') !== 'false';
              if (everyVisit) {
                  el.__animOpened = false;
                  el.__lastOpenSettings = null;
              }
          });
          handleTrigger();
      }
  });

  handleTrigger();
};

const getWebPDuration = (arrayBuffer) => {
  const data = new DataView(arrayBuffer);
  if (data.byteLength < 12) return 0;
  const riff = String.fromCharCode(data.getUint8(0), data.getUint8(1), data.getUint8(2), data.getUint8(3));
  const webp = String.fromCharCode(data.getUint8(8), data.getUint8(9), data.getUint8(10), data.getUint8(11));
  if (riff !== 'RIFF' || webp !== 'WEBP') return 0;

  let offset = 12;
  let totalDuration = 0;
  while (offset < data.byteLength) {
    if (offset + 8 > data.byteLength) break;
    const chunkId = String.fromCharCode(data.getUint8(offset), data.getUint8(offset+1), data.getUint8(offset+2), data.getUint8(offset+3));
    const chunkSize = data.getUint32(offset + 4, true);
    
    if (chunkId === 'ANMF') {
      if (offset + 8 + 15 <= data.byteLength) {
        const durationBytes = [data.getUint8(offset + 8 + 12), data.getUint8(offset + 8 + 13), data.getUint8(offset + 8 + 14)];
        const duration = durationBytes[0] | (durationBytes[1] << 8) | (durationBytes[2] << 16);
        totalDuration += duration;
      }
    }
    offset += 8 + chunkSize + (chunkSize % 2 !== 0 ? 1 : 0);
  }
  return totalDuration;
};

const patchAnimationLoops = (base64Data, maxLoops) => {
  if (base64Data.startsWith('data:image/webp;base64,')) {
    const b64 = base64Data.split(',')[1];
    const binStr = atob(b64);
    const uint8 = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) uint8[i] = binStr.charCodeAt(i);
    
    const data = new DataView(uint8.buffer);
    if (data.byteLength < 12) return base64Data;
    const riff = String.fromCharCode(uint8[0], uint8[1], uint8[2], uint8[3]);
    const webp = String.fromCharCode(uint8[8], uint8[9], uint8[10], uint8[11]);
    if (riff !== 'RIFF' || webp !== 'WEBP') return base64Data;
  
    let offset = 12;
    while (offset < uint8.length) {
      if (offset + 8 > uint8.length) break;
      const chunkId = String.fromCharCode(uint8[offset], uint8[offset+1], uint8[offset+2], uint8[offset+3]);
      const chunkSize = data.getUint32(offset + 4, true);
      
      if (chunkId === 'ANIM' && chunkSize >= 6) {
        const repeats = maxLoops === Infinity ? 0 : Math.max(0, maxLoops);
        uint8[offset + 12] = repeats & 0xFF;
        uint8[offset + 13] = (repeats >> 8) & 0xFF;
        
        let binary = '';
        for (let k = 0; k < uint8.length; k++) binary += String.fromCharCode(uint8[k]);
        return 'data:image/webp;base64,' + btoa(binary);
      }
      offset += 8 + chunkSize + (chunkSize % 2 !== 0 ? 1 : 0);
    }
    return base64Data;
  }

  if (!base64Data.startsWith('data:image/gif;base64,')) return base64Data;
  const b64 = base64Data.split(',')[1];
  const binStr = atob(b64);
  const uint8 = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) uint8[i] = binStr.charCodeAt(i);
  
  const netscape = [0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30]; // "NETSCAPE2.0"
  for (let i = 0; i < uint8.length - 19; i++) {
    let match = true;
    for (let j = 0; j < netscape.length; j++) {
      if (uint8[i + j] !== netscape[j]) { match = false; break; }
    }
    if (match && uint8[i-3] === 0x21 && (uint8[i-2] === 0xFF || uint8[i-2] === 0xFE) && uint8[i-1] === 0x0B) {
      if (uint8[i+11] === 0x03 && uint8[i+12] === 0x01) {
        if (maxLoops === 1) {
          uint8[i-2] = 0xFE; // Convert Application Extension to Comment Extension (browser will ignore loop instruction)
        } else {
          uint8[i-2] = 0xFF; // Restore Application Extension if it was previously patched
          const repeats = maxLoops === Infinity ? 0 : Math.max(0, maxLoops - 1);
          uint8[i+13] = repeats & 0xFF; // LSB
          uint8[i+14] = (repeats >> 8) & 0xFF; // MSB
        }
        
        let binary = '';
        for (let k = 0; k < uint8.byteLength; k++) binary += String.fromCharCode(uint8[k]);
        return 'data:image/gif;base64,' + btoa(binary);
      }
    }
  }
  return base64Data;
};

export const initGifRunner = function(doc) {
  const images = doc.querySelectorAll('image, img');
  const gifElements = doc.querySelectorAll('[data-loop-count]');
  // console.log("[initGifRunner] Checking document:", doc.location?.href);
  // console.log("[initGifRunner] Total images found:", images.length);
  // console.log("[initGifRunner] Found GIF elements with data-loop-count:", gifElements.length);
  
  if (gifElements.length === 0 && images.length > 0) {
      // console.log("[initGifRunner] Images found, but none have data-loop-count. First image HTML:", images[0].outerHTML);
  }
  
  gifElements.forEach(el => {
    const playWhile = el.getAttribute('data-play-gif-while');
    const loopCount = el.getAttribute('data-loop-count');
    const customLoop = parseInt(el.getAttribute('data-custom-loop-count')) || 1;
    // console.log("[initGifRunner] Checking GIF element:", { loopCount, customLoop, playWhile });

    // Find the actual image element
    const img = el.tagName.toLowerCase() === 'image' || el.tagName.toLowerCase() === 'img' ? el : el.querySelector('image, img');
    if (!img) {
      // console.log("[initGifRunner] No img/image tag found inside element");
      return;
    }

    const originalSrc = img.getAttribute('data-original-src') || img.getAttribute('href') || img.src || img.getAttribute('xlink:href');
    if (!originalSrc || (!originalSrc.toLowerCase().includes('.gif') && !originalSrc.toLowerCase().startsWith('data:image/gif') && !originalSrc.toLowerCase().includes('.webp') && !originalSrc.toLowerCase().startsWith('data:image/webp'))) {
      // console.log("[initGifRunner] Src is not a GIF/WebP or is empty:", originalSrc);
      return;
    }

    // Save the original src so we can restart it later
    if (!img.hasAttribute('data-original-src')) {
      img.setAttribute('data-original-src', originalSrc);
    }

    // Handle precise loop counts
    let maxLoops = Infinity;
    if (loopCount === 'Once') maxLoops = 1;
    else if (loopCount === 'Twice') maxLoops = 2;
    else if (loopCount === 'Thrice') maxLoops = 3;
    else if (loopCount === 'Custom') maxLoops = customLoop;

    const freezeGif = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const tempImg = new Image();
      tempImg.crossOrigin = "anonymous";
      tempImg.onload = () => {
        canvas.width = tempImg.naturalWidth || tempImg.width || 100;
        canvas.height = tempImg.naturalHeight || tempImg.height || 100;
        ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
        try {
          const staticSrc = canvas.toDataURL('image/png');
          if (img.tagName.toLowerCase() === 'image') {
            img.setAttribute('href', staticSrc);
            try { img.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", staticSrc); } catch(e){}
          } else {
            img.src = staticSrc;
          }
        } catch(e) {
          // If CORS prevents canvas read, we can't easily freeze it natively without a proxy
          console.warn("Could not freeze GIF due to CORS", e);
        }
      };
      if (originalSrc.startsWith('data:')) {
        tempImg.src = originalSrc;
      } else {
        const separator = originalSrc.includes('?') ? '&' : '?';
        tempImg.src = `${originalSrc}${separator}cb=${Date.now()}`;
      }
    };

    const playGif = () => {
      // Reload gif to restart animation from frame 1
      let freshSrc = originalSrc;
      if (originalSrc.startsWith('data:')) {
        // Natively patch the GIF/WebP binary so the browser perfectly controls the loop!
        freshSrc = patchAnimationLoops(originalSrc, maxLoops);
      } else {
        const separator = originalSrc.includes('?') ? '&' : '?';
        freshSrc = `${originalSrc}${separator}t=${Date.now()}`;
      }
      
      if (img.tagName.toLowerCase() === 'image') {
        if (originalSrc.startsWith('data:')) {
           img.setAttribute('href', '');
           void img.offsetWidth; // force reflow
        }
        img.setAttribute('href', freshSrc);
        try { img.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", freshSrc); } catch(e){}
      } else {
        if (originalSrc.startsWith('data:')) {
           img.src = '';
           void img.offsetWidth; // force reflow
        }
        img.src = freshSrc;
      }
    };

    const currentLoopSetting = `${loopCount}-${customLoop}-${playWhile}`;
    const isNewSetting = el.__lastLoopSetting !== currentLoopSetting;
    
    if (playWhile === 'Manual (Click to play)') {
      if (!el.__gifBound) {
        freezeGif();
        el.__isPlaying = false;
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (el.__isPlaying) {
            freezeGif();
            el.__isPlaying = false;
          } else {
            playGif();
            el.__isPlaying = true;
            el.__gifStartTime = Date.now();
          }
        });
        el.__gifBound = true;
      } else if (isNewSetting) {
        // If switched to manual from autoplay, freeze it
        freezeGif();
        el.__isPlaying = false;
        if (el.__gifTimeout) clearTimeout(el.__gifTimeout);
      }
    } else {
      // Autoplay while on page
      if (!el.__gifBound || isNewSetting) {
        if (maxLoops === Infinity || maxLoops === 0 || originalSrc.startsWith('data:')) {
            playGif();
            el.__gifStartTime = Date.now();
        }
        el.__isPlaying = true;
        el.__gifBound = true;
      }
    }

    el.__lastLoopSetting = currentLoopSetting;

    if (maxLoops !== Infinity && maxLoops > 0) {
      if (originalSrc.startsWith('data:')) {
          // Base64 GIFs are now handled natively by the browser via binary patching in playGif.
          // No need for gifuct-js parsing or manual timeouts!
          return;
      }
      if (isNewSetting || !el.__hasGifTimeoutSetup) {
        let fetchUrl = originalSrc;
        if (!originalSrc.startsWith('data:')) {
          const separator = originalSrc.includes('?') ? '&' : '?';
          fetchUrl = `${originalSrc}${separator}cb=${Date.now()}`;
        }
        fetch(fetchUrl)
          .then(resp => resp.arrayBuffer())
          .then(buff => {
            const dataView = new DataView(buff);
            let isWebp = false;
            if (dataView.byteLength >= 12) {
              const riff = String.fromCharCode(dataView.getUint8(0), dataView.getUint8(1), dataView.getUint8(2), dataView.getUint8(3));
              const webp = String.fromCharCode(dataView.getUint8(8), dataView.getUint8(9), dataView.getUint8(10), dataView.getUint8(11));
              if (riff === 'RIFF' && webp === 'WEBP') isWebp = true;
            }
            
            const finishSetup = (totalDuration, lastFrameDelay) => {
              // DEBUG OVERLAY: Show the gif count on screen
              let overlay = el.parentNode ? el.parentNode.querySelector('.debug-gif-overlay') : null;
              if (el.parentNode && !overlay) {
                  overlay = document.createElement('div');
                  overlay.className = 'debug-gif-overlay';
                  overlay.style.position = 'absolute';
                  overlay.style.top = '0px';
                  overlay.style.left = '0px';
                  overlay.style.background = 'rgba(255, 0, 0, 0.8)';
                  overlay.style.color = 'white';
                  overlay.style.padding = '4px 8px';
                  overlay.style.zIndex = '9999';
                  overlay.style.fontSize = '12px';
                  overlay.style.fontWeight = 'bold';
                  overlay.style.pointerEvents = 'none';
                  overlay.style.borderRadius = '0 0 5px 0';
                  el.parentNode.appendChild(overlay);
              }
              if (overlay) {
                  overlay.innerText = `Target Loops: ${maxLoops} | Time: ${totalDuration * maxLoops}ms`;
              }

              // Sync start time by re-triggering the GIF exactly now
              if (playWhile !== 'Manual (Click to play)') {
                 playGif();
                 el.__gifStartTime = Date.now();
                 el.__isPlaying = true;
                 
                 if (el.__gifTimeout) clearTimeout(el.__gifTimeout);
                 
                 // Target the exact midpoint of the last frame's display time
                 const freezeTime = (totalDuration * maxLoops) - (lastFrameDelay / 2);
                 const elapsed = el.__gifStartTime ? (Date.now() - el.__gifStartTime) : 0;
                 const remainingTime = Math.max(0, freezeTime - elapsed);
                 
                 el.__gifTimeout = setTimeout(() => {
                   if (el.__isPlaying !== false) {
                      freezeGif();
                      el.__isPlaying = false;
                      if (overlay) overlay.innerText += " (FROZEN)";
                   }
                 }, remainingTime);
                 el.__hasGifTimeoutSetup = true;
              }
            };

            if (isWebp) {
              const totalDuration = getWebPDuration(buff);
              if (totalDuration > 0) {
                 // For WebP, assume last frame delay is around 100ms for midpoint calculation
                 finishSetup(totalDuration, 100);
              }
            } else {
              import('gifuct-js').then(({ parseGIF, decompressFrames }) => {
                const gif = parseGIF(buff);
                const frames = decompressFrames(gif, true);
                const totalDuration = frames.reduce((sum, frame) => {
                  const delay = (!frame.delay || frame.delay <= 20) ? 100 : frame.delay;
                  return sum + delay;
                }, 0);
                const lastFrame = frames[frames.length - 1];
                const lastFrameDelay = (!lastFrame.delay || lastFrame.delay <= 20) ? 100 : lastFrame.delay;
                finishSetup(totalDuration, lastFrameDelay);
              }).catch(err => {
                console.warn("gifuct-js not installed. Run 'npm install gifuct-js' for exact loop counts.", err);
              });
            }
          })
          .catch(err => console.error("Error parsing Animation for loop count", err));
      }
    } else {
       if (playWhile !== 'Manual (Click to play)') {
          if (el.__gifTimeout) {
            clearTimeout(el.__gifTimeout);
            el.__gifTimeout = null;
          }
          el.__hasGifTimeoutSetup = false;
       }
    }
  });

  // Listen for PAGE_TURNED to restart GIFs when the page becomes visible
  if (doc.defaultView && !doc.__gifPageTurnBound) {
    doc.__gifPageTurnBound = true;
    doc.defaultView.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'PAGE_TURNED') {
        const visiblePages = e.data.visiblePages || [];
        // Only restart if the page is now visible. We can check if any GIF is in the viewport,
        // or just re-init everything and let the logic handle it.
        // The safest approach is to re-run initGifRunner so that the GIFs play again.
        // We will clear __lastLoopSetting so it thinks it's a new setting and restarts.
        const gifs = doc.querySelectorAll('[data-loop-count]');
        let shouldRestart = false;
        
        // Find if this iframe corresponds to a visible page
        // Usually the page number is injected as window._pageNumber by PreviewArea script
        const pageNum = doc.defaultView._pageNumber;
        if (pageNum !== undefined && visiblePages.includes(pageNum)) {
           shouldRestart = true;
        } else if (pageNum === undefined) {
           // Fallback if _pageNumber is not available
           shouldRestart = true;
        }

        if (shouldRestart) {
           gifs.forEach(el => {
              el.__lastLoopSetting = null; // force restart
           });
           initGifRunner(doc);
        }
      }
    });
  }
};
