export const KINETIC_ANIMATION_KEYFRAMES = {
  'slide-up': `
    @keyframes kinetic-anim {
      0%, 100% { transform: translateY(115%) skewX(var(--skew-angle, 0deg)); opacity: 0; }
      25%, 75% { transform: translateY(0%) skewX(var(--skew-angle, 0deg)); opacity: 1; }
    }
  `,
  'slide-down': `
    @keyframes kinetic-anim {
      0%, 100% { transform: translateY(-115%) skewX(var(--skew-angle, 0deg)); opacity: 0; }
      25%, 75% { transform: translateY(0%) skewX(var(--skew-angle, 0deg)); opacity: 1; }
    }
  `,
  'pop-bounce': `
    @keyframes kinetic-anim {
      0%, 100% { transform: scale(0.2) translateY(28px) skewX(var(--skew-angle, 0deg)); opacity: 0; }
      28% { transform: scale(1.15) translateY(-4px) skewX(var(--skew-angle, 0deg)); opacity: 1; }
      42%, 75% { transform: scale(1) translateY(0) skewX(var(--skew-angle, 0deg)); opacity: 1; }
    }
  `,
  'wave-float': `
    @keyframes kinetic-anim {
      0%, 100% { transform: translateY(0px) skewX(var(--skew-angle, 0deg)); }
      50% { transform: translateY(-14px) skewX(var(--skew-angle, 0deg)); }
    }
  `,
  'pulse-glow': `
    @keyframes kinetic-anim {
      0%, 100% { transform: scale(0.95) skewX(var(--skew-angle, 0deg)); filter: drop-shadow(var(--shadow-x, 0px) var(--shadow-y, 0px) 2px currentColor); opacity: 0.7; }
      50% { transform: scale(1.08) skewX(var(--skew-angle, 0deg)); filter: drop-shadow(var(--shadow-x, 0px) var(--shadow-y, 0px) 16px currentColor) drop-shadow(var(--shadow-x, 0px) var(--shadow-y, 0px) 28px currentColor); opacity: 1; }
    }
  `,
  'flip-3d': `
    @keyframes kinetic-anim {
      0%, 100% { transform: perspective(350px) rotateX(-90deg) skewX(var(--skew-angle, 0deg)); opacity: 0; }
      25%, 75% { transform: perspective(350px) rotateX(0deg) skewX(var(--skew-angle, 0deg)); opacity: 1; }
    }
  `
};

export const calculateKineticDimensions = (words = [], fontSize = 34, bgPadding = 12) => {
  const lineArray = Array.isArray(words) ? words : (typeof words === 'string' ? words.split('\n') : []);
  const lines = lineArray.map(l => (typeof l === 'string' ? l.trim() : '')).filter(Boolean);
  if (lines.length === 0) {
    return { width: 80, height: 40 };
  }
  const maxLen = Math.max(...lines.map(l => l.length), 1);
  const pad = typeof bgPadding === 'number' ? bgPadding : 12;
  // Snug character width in bold uppercase sans fonts is ~0.55 * fontSize
  const width = Math.round(maxLen * (fontSize * 0.55) + (pad * 2));
  // Snug height per line is ~1.08 * fontSize
  const height = Math.round(lines.length * (fontSize * 1.08) + (pad * 2));
  return {
    width: Math.max(30, width),
    height: Math.max(20, height)
  };
};

export const cleanKeyframesFromCss = (cssStr) => {
  if (!cssStr) return '';
  let result = cssStr;
  let safety = 0;
  while (safety < 20) {
    safety++;
    const match = result.match(/@keyframes\s+kinetic-anim[^{]*\{/);
    if (!match) break;
    const startIdx = match.index;
    let depth = 0;
    let endIdx = -1;
    for (let i = startIdx; i < result.length; i++) {
      if (result[i] === '{') depth++;
      else if (result[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx !== -1) {
      result = result.slice(0, startIdx).trim() + '\n' + result.slice(endIdx + 1).trim();
    } else {
      break;
    }
  }
  // Clean any orphaned frame percentage rules left behind by prior regex operations
  result = result.replace(/\b(?:0%|25%|28%|42%|50%|75%|100%)[^{]*\{[^}]*\}(?:\s*\})?/g, '');
  return result.trim();
};

export const createKineticSvg = ({
  uniqueId = 0,
  words = ['CODING', 'KINETIC', 'TYPE'],
  animType = 'slide-up',
  duration = 3800,
  stagger = 50,
  baseDelay = 100,
  fontFamily = 'Inter',
  fontSize = 36,
  fontWeight = '800',
  textColor = '#FFFFFF',
  bgColor = 'transparent',
  isTranslate = false
}) => {
  const transformAttr = isTranslate ? ' transform="translate(50, 50)"' : '';
  const fontImport = fontFamily === 'Inter'
    ? `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&amp;display=swap');`
    : `@import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@700;800&amp;display=swap');`;

  let currentDelay = baseDelay;
  const wordsMarkup = words.map((word) => {
    const charsMarkup = word.split('').map((char) => {
      const charDelay = currentDelay;
      currentDelay += stagger;
      return `<span class="slide char" style="--delay: ${charDelay}ms; color: ${textColor}; -webkit-text-fill-color: ${textColor};">${char === ' ' ? '&nbsp;' : char}</span>`;
    }).join('');
    return `<div class="word">${charsMarkup}</div>`;
  }).join('');

  const animKeyframe = KINETIC_ANIMATION_KEYFRAMES[animType] || KINETIC_ANIMATION_KEYFRAMES['slide-up'];
  const scopedKeyframes = animKeyframe.replace(/@keyframes kinetic-anim/g, `@keyframes kinetic-anim-${uniqueId}`);

  const { width: estWidth, height: estHeight } = calculateKineticDimensions(words, fontSize, 12);
  const wordsText = words.join('\n');

  return `
    <g id="typography-${uniqueId}" data-type="text" data-typography-type="kinetic" data-animation-style="${animType}" data-animation-duration="${duration}" data-animation-stagger="${stagger}" data-bg-color="${bgColor}" data-bg-radius="8" data-bg-padding="12" data-text-color="${textColor}" data-font-family="${fontFamily}" data-font-size="${fontSize}" data-font-weight="${fontWeight}" data-kinetic-text="${wordsText}" cursor="pointer"${transformAttr} style="--stroke-width: 0px; --stroke-color: #000000; --shadow-x: 0px; --shadow-y: 0px; --skew-angle: 0deg;">
      <style>
        ${fontImport}
        #typography-${uniqueId} .kinetic-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          width: 100%;
          height: 100%;
          user-select: none;
          box-sizing: border-box;
          padding: 12px;
          border-radius: 8px;
        }
        #typography-${uniqueId} .word {
          overflow: hidden;
          display: flex;
          line-height: 1.08;
          margin: 0;
          padding: 0;
        }
        #typography-${uniqueId} span.slide,
        #typography-${uniqueId} span.char {
          display: inline-block;
          margin: 0px;
          font-family: '${fontFamily}', sans-serif;
          font-size: ${fontSize}px;
          font-weight: ${fontWeight};
          text-transform: uppercase;
          color: ${textColor};
          -webkit-text-fill-color: ${textColor};
          stroke-width: var(--stroke-width, 0px);
          -webkit-text-stroke-width: var(--stroke-width, 0px);
          -webkit-text-stroke-color: var(--stroke-color, #000000);
          paint-order: stroke fill;
          animation: kinetic-anim-${uniqueId} ${duration}ms infinite cubic-bezier(0.77, 0, 0.175, 1);
          animation-delay: var(--delay, 0ms);
          transform: skewX(var(--skew-angle, 0deg));
          filter: drop-shadow(var(--shadow-x, 0px) var(--shadow-y, 0px) 0px rgba(0,0,0,0.5));
          will-change: transform, opacity;
        }
        ${scopedKeyframes}
      </style>
      <foreignObject width="${estWidth}" height="${estHeight}" x="0" y="0" style="overflow: visible;">
        <div xmlns="http://www.w3.org/1999/xhtml" class="kinetic-container" style="color: ${textColor}; font-family: '${fontFamily}', sans-serif; font-size: ${fontSize}px; font-weight: ${fontWeight}; background-color: ${bgColor}; border-radius: 8px; padding: 12px;">
          ${wordsMarkup}
        </div>
      </foreignObject>
    </g>
  `;
};
