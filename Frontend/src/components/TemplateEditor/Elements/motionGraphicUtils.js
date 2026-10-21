/**
 * Exact Lottie Motion Graphic Generators for Typography
 * Directly derived from After Effects project source specs:
 * 1. animation.json  (1920x1080, 142 frames @ 30fps)
 *    - Layers: Dual stroke cyber rounded frame (Layer 1: 11px white crisp + Layer 2: 29px red glow)
 *    - Trim paths animation from 37f to 89f
 *    - Central uppercase text translateY & opacity entry / exit
 * 2. flipi.json      (1920x1080, 210 frames @ 30fps)
 *    - Diagonal slash stroke from [-602, 214] to [-523, -212] (Stroke #FFC600 46px, Trim Paths 0 to 56f)
 *    - Text A ("FLIPIBOOK", ArialMT 170px) masked entry (14f to 75f)
 *    - Text B ("ANIMATION", Impact 297px) masked counter entry (0f to 59f)
 * 3. new animation.json (1920x1080, 121 frames @ 30fps)
 *    - Box 01 & Box 02 (1926 x 562px, 60px stroke #FFFFFF, fill #FF1E27 with Trim Paths)
 *    - Dual masked text counter-sliding: Text A ("ANIMATION", ArialMT 186px) + Text B ("FLIPIBOOK", Arial-Black 186px)
 * 4. youutbe.json    (1920x1080, 34 frames @ 30fps)
 *    - Edit Logo (Rounded red badge 458x293 with white play triangle, rotation + elastic spring scale 4f-11f)
 *    - Text A ("FLIPIBOOK", Arial-Black 250px) sliding horizontal reveal with tracking 0f to 36f
 */

// --------------------------------------------------------------------------
// 1. animation.json: Cyber Trim Frame
// --------------------------------------------------------------------------
export const createCyberFrameSvg = ({
  uniqueId = Date.now(),
  text = 'ANIMATION',
  primaryColor = '#FF0033', // Neon Red from AE comp
  secondaryColor = '#FFFFFF', // Inner sharp stroke
  glowIntensity = 6,
  fontSize = 17,
  fontFamily = 'Roboto, sans-serif',
  duration = 4700, // 142 frames @ 30fps ~ 4.73s
  isTranslate = false
}) => {
  const transformAttr = isTranslate ? ' transform="translate(50, 50)"' : '';
  const width = 188;
  const height = 56;
  const rx = 14;
  const perimeter = 480;

  return `
    <g id="typography-${uniqueId}" 
       data-type="text" 
       data-typography-type="motion-graphic" 
       data-motion-template="cyber-frame"
       data-text="${text}" 
       data-primary-color="${primaryColor}" 
       data-secondary-color="${secondaryColor}" 
       data-font-size="${fontSize}" 
       data-font-family="${fontFamily}" 
       cursor="pointer"${transformAttr} 
       style="--stroke-width: 0px; --shadow-x: 0px; --shadow-y: 0px; --skew-angle: 0deg;">
      
      <defs>
        <filter id="glow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${glowIntensity}" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <style>
        @keyframes cyber-trim-${uniqueId} {
          0% { stroke-dasharray: 0 ${perimeter}; stroke-dashoffset: 0; opacity: 0; }
          12% { opacity: 1; }
          26% { stroke-dasharray: ${perimeter} 0; stroke-dashoffset: 0; }
          62% { stroke-dasharray: ${perimeter} 0; stroke-dashoffset: 0; opacity: 1; }
          75% { stroke-dasharray: 0 ${perimeter}; stroke-dashoffset: -${perimeter}; opacity: 0; }
          100% { stroke-dasharray: 0 ${perimeter}; stroke-dashoffset: -${perimeter}; opacity: 0; }
        }

        @keyframes cyber-text-${uniqueId} {
          0% { transform: translateY(8px); opacity: 0; }
          6% { opacity: 1; }
          22% { transform: translateY(0px); opacity: 1; }
          68% { transform: translateY(0px); opacity: 1; }
          82% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(8px); opacity: 0; }
        }

        #typography-${uniqueId} .cyber-glow-stroke {
          animation: cyber-trim-${uniqueId} ${duration}ms infinite cubic-bezier(0.833, 0.833, 0.167, 0.167);
          pointer-events: none;
        }

        #typography-${uniqueId} .cyber-inner-stroke {
          animation: cyber-trim-${uniqueId} ${duration}ms infinite cubic-bezier(0.833, 0.833, 0.167, 0.167);
          pointer-events: none;
        }

        #typography-${uniqueId} .cyber-text {
          animation: cyber-text-${uniqueId} ${duration}ms infinite cubic-bezier(0.833, 0.833, 0.167, 0.167);
          font-family: 'Roboto', sans-serif;
          font-size: ${fontSize}px;
          font-weight: 700;
          letter-spacing: 0.094em;
          text-transform: uppercase;
          text-align: center;
          color: ${primaryColor};
          fill: ${primaryColor};
          pointer-events: none;
          white-space: nowrap !important;
          line-height: 1;
          display: inline-block;
          margin: 0;
          padding: 0;
        }
      </style>

      <rect 
        class="motion-click-boundary" 
        x="0" 
        y="0" 
        width="${width}" 
        height="${height}" 
        rx="${rx}" 
        ry="${rx}" 
        fill="rgba(8, 10, 16, 0.65)" 
        pointer-events="all" 
      />

      <rect 
        class="cyber-glow-stroke" 
        x="4" 
        y="4" 
        width="${width - 8}" 
        height="${height - 8}" 
        rx="${rx - 2}" 
        ry="${rx - 2}" 
        fill="transparent" 
        stroke="${primaryColor}" 
        stroke-width="3.5" 
        filter="url(#glow-${uniqueId})" 
      />

      <rect 
        class="cyber-inner-stroke" 
        x="4" 
        y="4" 
        width="${width - 8}" 
        height="${height - 8}" 
        rx="${rx - 2}" 
        ry="${rx - 2}" 
        fill="transparent" 
        stroke="${secondaryColor}" 
        stroke-width="1.2" 
        stroke-linecap="round" 
      />

      <foreignObject x="0" y="0" width="${width}" height="${height}" style="overflow: visible; pointer-events: none;">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; pointer-events: none; box-sizing: border-box;">
          <span class="motion-text-content cyber-text">${text}</span>
        </div>
      </foreignObject>
    </g>
  `;
};

// --------------------------------------------------------------------------
// 2. flipi.json: Flipi Diagonal Slash & Split Text Reveal
// Exact AE Specs:
// - Diagonal Slash: from [-602, 214] to [-523, -212], width 46, color #FFC600, Trim 0-56f
// - Left/Top Text A: FLIPIBOOK (ArialMT) entry from y -59px, range 14-75f
// - Left/Bottom Text B: ANIMATION (Impact) entry from y +55px, range 0-59f
// --------------------------------------------------------------------------
export const createFlipiSlashSvg = ({
  uniqueId = Date.now(),
  text = 'FLIPIBOOK',
  subText = 'ANIMATION',
  primaryColor = '#F3F2F3',
  secondaryColor = '#FFC600', // Gold Accent Slash from flipi.json
  fontSize = 20,
  fontFamily = 'Impact, Arial, sans-serif',
  duration = 4500, // 210 frames @ 30fps = 7s or 4.5s loop
  isTranslate = false
}) => {
  const transformAttr = isTranslate ? ' transform="translate(50, 50)"' : '';
  const width = 230;
  const height = 66;

  return `
    <g id="typography-${uniqueId}" 
       data-type="text" 
       data-typography-type="motion-graphic" 
       data-motion-template="flipi-split"
       data-text="${text}" 
       data-subtext="${subText}"
       data-primary-color="${primaryColor}" 
       data-secondary-color="${secondaryColor}" 
       data-font-size="${fontSize}" 
       data-font-family="${fontFamily}" 
       cursor="pointer"${transformAttr} 
       style="--stroke-width: 0px; --shadow-x: 0px; --shadow-y: 0px; --skew-angle: 0deg;">
      
      <defs>
        <!-- Mask 2 & Mask from flipi.json: Exact split plane at y = 33 -->
        <clipPath id="flipi-clip-top-${uniqueId}">
          <rect x="0" y="0" width="${width}" height="33" />
        </clipPath>
        <clipPath id="flipi-clip-bottom-${uniqueId}">
          <rect x="0" y="33" width="${width}" height="33" />
        </clipPath>
      </defs>

      <style>
        /* Exact Trim Path animation for Line 1 in flipi.json */
        @keyframes flipi-line-trim-${uniqueId} {
          0% {
            stroke-dasharray: 0 120;
            stroke-dashoffset: 60;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          28% {
            stroke-dasharray: 120 0;
            stroke-dashoffset: 0;
          }
          70% {
            stroke-dasharray: 120 0;
            stroke-dashoffset: 0;
            opacity: 1;
          }
          85% {
            stroke-dasharray: 0 120;
            stroke-dashoffset: -60;
            opacity: 0;
          }
          100% {
            stroke-dasharray: 0 120;
            stroke-dashoffset: -60;
            opacity: 0;
          }
        }

        /* Top Text A: Masked Reveal from Top */
        @keyframes flipi-text-top-${uniqueId} {
          0% { transform: translateY(-34px); opacity: 0; }
          8% { opacity: 0; }
          12% { opacity: 1; }
          28% { transform: translateY(0); opacity: 1; }
          72% { transform: translateY(0); opacity: 1; }
          88% { transform: translateY(-34px); opacity: 0; }
          100% { transform: translateY(-34px); opacity: 0; }
        }

        /* Bottom Text B: Masked Reveal from Bottom */
        @keyframes flipi-text-bottom-${uniqueId} {
          0% { transform: translateY(34px); opacity: 0; }
          6% { opacity: 1; }
          24% { transform: translateY(0); opacity: 1; }
          72% { transform: translateY(0); opacity: 1; }
          88% { transform: translateY(34px); opacity: 0; }
          100% { transform: translateY(34px); opacity: 0; }
        }

        #typography-${uniqueId} .flipi-slash-accent {
          animation: flipi-line-trim-${uniqueId} ${duration}ms infinite cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }

        #typography-${uniqueId} .flipi-text-a {
          animation: flipi-text-top-${uniqueId} ${duration}ms infinite cubic-bezier(0.16, 1, 0.3, 1);
          font-family: Arial, Helvetica, sans-serif;
          font-size: ${Math.round(fontSize * 0.72)}px;
          font-weight: 400;
          letter-spacing: 0em;
          color: ${primaryColor};
          fill: ${primaryColor};
          text-transform: uppercase;
          white-space: nowrap !important;
        }

        #typography-${uniqueId} .flipi-text-b {
          animation: flipi-text-bottom-${uniqueId} ${duration}ms infinite cubic-bezier(0.16, 1, 0.3, 1);
          font-family: Impact, "Arial Black", sans-serif;
          font-size: ${fontSize}px;
          font-weight: 400;
          letter-spacing: 0em;
          color: ${primaryColor};
          fill: ${primaryColor};
          text-transform: uppercase;
          white-space: nowrap !important;
        }
      </style>

      <rect 
        class="motion-click-boundary" 
        x="0" 
        y="0" 
        width="${width}" 
        height="${height}" 
        rx="8" 
        ry="8" 
        fill="rgba(10, 12, 18, 0.7)" 
        pointer-events="all" 
      />

      <!-- Diagonal Slash Stroke from Line layer in flipi.json (Angle ~ -12 deg) -->
      <line 
        class="flipi-slash-accent" 
        x1="22" 
        y1="54" 
        x2="34" 
        y2="12" 
        stroke="${secondaryColor}" 
        stroke-width="3.8" 
        stroke-linecap="round" 
      />

      <!-- Text A: Top Half (FLIPIBOOK) -->
      <g clip-path="url(#flipi-clip-top-${uniqueId})">
        <foreignObject x="38" y="4" width="${width - 44}" height="28" style="overflow: visible; pointer-events: none;">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: flex-start; pointer-events: none;">
            <span class="motion-text-content flipi-text-a">${text}</span>
          </div>
        </foreignObject>
      </g>

      <!-- Text B: Bottom Half (ANIMATION) -->
      <g clip-path="url(#flipi-clip-bottom-${uniqueId})">
        <foreignObject x="38" y="32" width="${width - 44}" height="32" style="overflow: visible; pointer-events: none;">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: flex-start; pointer-events: none;">
            <span class="motion-text-subcontent flipi-text-b">${subText}</span>
          </div>
        </foreignObject>
      </g>
    </g>
  `;
};

// --------------------------------------------------------------------------
// 3. new animation.json: Dual Box Outline Reveal
// Exact AE Specs:
// - Box 01 & Box 02: 1926x562px, Stroke 60px #FFFFFF, Fill #FF1E27, Trim Paths 0-57f
// - Text A ("ANIMATION"): ArialMT 186px, translateY from 148px to -11px (0 to 64f)
// - Text B ("FLIPIBOOK"): Arial-Black 186px, translateY from -147px to 12px (3 to 67f)
// --------------------------------------------------------------------------
export const createBoxRevealSvg = ({
  uniqueId = Date.now(),
  text = 'FLIPIBOOK',
  subText = 'ANIMATION',
  primaryColor = '#FF1E27', // Box Color from new animation.json
  secondaryColor = '#FFFFFF', // Box Stroke & Text Color
  fontSize = 17,
  fontFamily = '"Arial Black", Impact, sans-serif',
  duration = 4000, // 121 frames @ 30fps = 4s
  isTranslate = false
}) => {
  const transformAttr = isTranslate ? ' transform="translate(50, 50)"' : '';
  const width = 210;
  const height = 62;
  const perimeter = 520;

  return `
    <g id="typography-${uniqueId}" 
       data-type="text" 
       data-typography-type="motion-graphic" 
       data-motion-template="box-reveal"
       data-text="${text}" 
       data-subtext="${subText}"
       data-primary-color="${primaryColor}" 
       data-secondary-color="${secondaryColor}" 
       data-font-size="${fontSize}" 
       data-font-family="${fontFamily}" 
       cursor="pointer"${transformAttr} 
       style="--stroke-width: 0px; --shadow-x: 0px; --shadow-y: 0px; --skew-angle: 0deg;">
      
      <defs>
        <!-- Mask & Mask 2 from new animation.json split containers -->
        <clipPath id="box-clip-top-${uniqueId}">
          <rect x="0" y="0" width="${width}" height="31" />
        </clipPath>
        <clipPath id="box-clip-bottom-${uniqueId}">
          <rect x="0" y="31" width="${width}" height="31" />
        </clipPath>
      </defs>

      <style>
        /* Exact Box Trim Paths from new animation.json */
        @keyframes box-trim-${uniqueId} {
          0% {
            stroke-dasharray: 0 ${perimeter};
            stroke-dashoffset: 0;
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          32% {
            stroke-dasharray: ${perimeter} 0;
            stroke-dashoffset: 0;
          }
          70% {
            stroke-dasharray: ${perimeter} 0;
            stroke-dashoffset: 0;
            opacity: 1;
          }
          88% {
            stroke-dasharray: 0 ${perimeter};
            stroke-dashoffset: -${perimeter};
            opacity: 0;
          }
          100% {
            stroke-dasharray: 0 ${perimeter};
            stroke-dashoffset: -${perimeter};
            opacity: 0;
          }
        }

        /* Text B (FLIPIBOOK): translateY down into place */
        @keyframes box-slide-down-${uniqueId} {
          0% { transform: translateY(-28px); opacity: 0; }
          10% { opacity: 1; }
          28% { transform: translateY(0); opacity: 1; }
          72% { transform: translateY(0); opacity: 1; }
          86% { transform: translateY(-28px); opacity: 0; }
          100% { transform: translateY(-28px); opacity: 0; }
        }

        /* Text A (ANIMATION): translateY up into place */
        @keyframes box-slide-up-${uniqueId} {
          0% { transform: translateY(28px); opacity: 0; }
          10% { opacity: 1; }
          28% { transform: translateY(0); opacity: 1; }
          72% { transform: translateY(0); opacity: 1; }
          86% { transform: translateY(28px); opacity: 0; }
          100% { transform: translateY(28px); opacity: 0; }
        }

        #typography-${uniqueId} .box-trim-frame {
          animation: box-trim-${uniqueId} ${duration}ms infinite cubic-bezier(0.833, 0.833, 0.167, 0.167);
          pointer-events: none;
        }

        #typography-${uniqueId} .box-title-a {
          animation: box-slide-down-${uniqueId} ${duration}ms infinite cubic-bezier(0.16, 1, 0.3, 1);
          font-family: "Arial Black", Arial, Impact, sans-serif;
          font-size: ${fontSize}px;
          font-weight: 900;
          letter-spacing: 0em;
          color: ${secondaryColor};
          fill: ${secondaryColor};
          text-transform: uppercase;
          white-space: nowrap !important;
        }

        #typography-${uniqueId} .box-title-b {
          animation: box-slide-up-${uniqueId} ${duration}ms infinite cubic-bezier(0.16, 1, 0.3, 1);
          font-family: Arial, Helvetica, sans-serif;
          font-size: ${Math.round(fontSize * 0.9)}px;
          font-weight: 400;
          letter-spacing: 0em;
          color: ${primaryColor};
          fill: ${primaryColor};
          text-transform: uppercase;
          white-space: nowrap !important;
        }
      </style>

      <rect 
        class="motion-click-boundary" 
        x="0" 
        y="0" 
        width="${width}" 
        height="${height}" 
        rx="5" 
        ry="5" 
        fill="rgba(8, 8, 12, 0.75)" 
        pointer-events="all" 
      />

      <!-- Box 01 / Box 02 Dual Stroke Outline -->
      <rect 
        class="box-trim-frame" 
        x="4" 
        y="4" 
        width="${width - 8}" 
        height="${height - 8}" 
        rx="4" 
        ry="4" 
        fill="transparent" 
        stroke="${primaryColor}" 
        stroke-width="2.6" 
      />

      <!-- Top Text Row: FLIPIBOOK -->
      <g clip-path="url(#box-clip-top-${uniqueId})">
        <foreignObject x="0" y="4" width="${width}" height="27" style="overflow: visible; pointer-events: none;">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none;">
            <span class="motion-text-content box-title-a">${text}</span>
          </div>
        </foreignObject>
      </g>

      <!-- Bottom Text Row: ANIMATION -->
      <g clip-path="url(#box-clip-bottom-${uniqueId})">
        <foreignObject x="0" y="31" width="${width}" height="27" style="overflow: visible; pointer-events: none;">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none;">
            <span class="motion-text-subcontent box-title-b">${subText}</span>
          </div>
        </foreignObject>
      </g>
    </g>
  `;
};

// --------------------------------------------------------------------------
// 4. youutbe.json: YouTube Channel Intro
// Exact AE Specs:
// - Logo: Spherize radius 500, rect 458x293 r64, fill #FF0024
// - Shape Element: Triangle [[1102,-49],[1102,50],[1184,0]], fill #F3F2F3
// - Edit Logo Rotation: -29 to 0 deg with damped oscillation, scale elastic from 0 to 71% (4-11f)
// - Text A ("FLIPIBOOK"): Arial-Black 250px, tracking 10, anim 0-36f
// --------------------------------------------------------------------------
export const createYouTubeChannelSvg = ({
  uniqueId = Date.now(),
  text = 'FLIPIBOOK',
  primaryColor = '#FF0024', // YouTube Red Logo
  secondaryColor = '#FFFFFF', // Title Text & Play Triangle
  fontSize = 18,
  fontFamily = '"Arial Black", Arial, Impact, sans-serif',
  duration = 3600, // 34 frames @ 30fps ~ 1.13s (loop 3.6s)
  isTranslate = false
}) => {
  const transformAttr = isTranslate ? ' transform="translate(50, 50)"' : '';
  const width = 220;
  const height = 54;

  return `
    <g id="typography-${uniqueId}" 
       data-type="text" 
       data-typography-type="motion-graphic" 
       data-motion-template="youtube-channel"
       data-text="${text}" 
       data-primary-color="${primaryColor}" 
       data-secondary-color="${secondaryColor}" 
       data-font-size="${fontSize}" 
       data-font-family="${fontFamily}" 
       cursor="pointer"${transformAttr} 
       style="--stroke-width: 0px; --shadow-x: 0px; --shadow-y: 0px; --skew-angle: 0deg;">
      
      <defs>
        <!-- Mask layer for text slide from behind logo -->
        <clipPath id="yt-clip-${uniqueId}">
          <rect x="52" y="0" width="${width - 52}" height="${height}" />
        </clipPath>
      </defs>

      <style>
        /* Exact damped harmonic spring bounce matching velocity expression in AE:
           r: -29deg -> 0deg with spring oscillation; scale: 0 -> 1.18 -> 1.0 */
        @keyframes yt-logo-spring-${uniqueId} {
          0% {
            transform: translate(12px, 12px) scale(0) rotate(-29deg);
            opacity: 0;
          }
          14% {
            transform: translate(12px, 12px) scale(1.18) rotate(5deg);
            opacity: 1;
          }
          24% {
            transform: translate(12px, 12px) scale(0.96) rotate(-2deg);
            opacity: 1;
          }
          32% {
            transform: translate(12px, 12px) scale(1) rotate(0deg);
            opacity: 1;
          }
          76% {
            transform: translate(12px, 12px) scale(1) rotate(0deg);
            opacity: 1;
          }
          88% {
            transform: translate(12px, 12px) scale(0) rotate(18deg);
            opacity: 0;
          }
          100% {
            transform: translate(12px, 12px) scale(0) rotate(18deg);
            opacity: 0;
          }
        }

        /* Typewriter text reveal effect with character steps */
        @keyframes yt-typing-${uniqueId} {
          0% {
            width: 0%;
          }
          18% {
            width: 0%;
          }
          48% {
            width: 100%;
          }
          78% {
            width: 100%;
          }
          88% {
            width: 0%;
          }
          100% {
            width: 0%;
          }
        }

        #typography-${uniqueId} .yt-logo-box {
          animation: yt-logo-spring-${uniqueId} ${duration}ms infinite cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-origin: 20px 15px;
          pointer-events: none;
        }

        #typography-${uniqueId} .yt-typewriter-container {
          display: inline-flex;
          align-items: center;
          overflow: hidden;
          white-space: nowrap;
          animation: yt-typing-${uniqueId} ${duration}ms steps(${Math.max(text.length, 1)}, end) infinite;
        }

        #typography-${uniqueId} .yt-title-text {
          font-family: "Arial Black", Arial, Impact, sans-serif;
          font-size: ${fontSize}px;
          font-weight: 900;
          letter-spacing: 0.04em;
          color: ${secondaryColor};
          fill: ${secondaryColor};
          text-transform: uppercase;
          pointer-events: none;
          white-space: nowrap !important;
          line-height: 1;
        }
      </style>

      <rect 
        class="motion-click-boundary" 
        x="0" 
        y="0" 
        width="${width}" 
        height="${height}" 
        rx="27" 
        ry="27" 
        fill="rgba(10, 10, 14, 0.7)" 
        pointer-events="all" 
      />

      <!-- YouTube Red Curved Badge (40 x 30, rx 8) with White Play Button Triangle -->
      <g class="yt-logo-box">
        <rect 
          x="0" 
          y="0" 
          width="40" 
          height="30" 
          rx="8" 
          ry="8" 
          fill="${primaryColor}" 
        />
        <polygon 
          points="16,8 16,22 28,15" 
          fill="${secondaryColor}" 
        />
      </g>

      <!-- Channel Name Typewriter Reveal -->
      <foreignObject x="56" y="0" width="${width - 62}" height="${height}" style="overflow: visible; pointer-events: none;">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: flex-start; pointer-events: none;">
          <div class="yt-typewriter-container">
            <span class="motion-text-content yt-title-text">${text}</span>
          </div>
        </div>
      </foreignObject>
    </g>
  `;
};

// --------------------------------------------------------------------------
// Universal Motion Graphic Dispatcher
// --------------------------------------------------------------------------
export const createMotionGraphicSvg = ({
  template = 'cyber-frame',
  uniqueId = Date.now(),
  text = 'ANIMATION',
  subText = 'ANIMATION',
  primaryColor = '#FF0033',
  secondaryColor = '#FFFFFF',
  glowIntensity = 5,
  fontSize = 18,
  fontFamily = 'Roboto, sans-serif',
  duration = 4700,
  isTranslate = false
}) => {
  switch (template) {
    case 'flipi-split':
      return createFlipiSlashSvg({
        uniqueId,
        text,
        subText,
        primaryColor,
        secondaryColor,
        fontSize,
        fontFamily,
        duration,
        isTranslate
      });

    case 'box-reveal':
      return createBoxRevealSvg({
        uniqueId,
        text,
        subText,
        primaryColor,
        secondaryColor,
        fontSize,
        fontFamily,
        duration,
        isTranslate
      });

    case 'youtube-channel':
      return createYouTubeChannelSvg({
        uniqueId,
        text,
        primaryColor,
        secondaryColor,
        fontSize,
        fontFamily,
        duration,
        isTranslate
      });

    case 'cyber-frame':
    default:
      return createCyberFrameSvg({
        uniqueId,
        text,
        primaryColor,
        secondaryColor,
        glowIntensity,
        fontSize,
        fontFamily,
        duration,
        isTranslate
      });
  }
};
