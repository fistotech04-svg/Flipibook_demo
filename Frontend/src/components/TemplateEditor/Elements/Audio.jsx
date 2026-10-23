import React from 'react';

// Audio Player UI Templates based on audio_player_ui_showcase reference designs
const audioTemplates = [
  {
    id: 'glassmorphism',
    name: 'Clean Glassmorphism',
    subtitle: 'Frosted Glass & Sleek Timeline',
    badge: 'Glassmorphism',
    width: 360,
    height: 152,
    getSvg: (uniqueId) => `
<g id="audio-${uniqueId}" data-type="audio-frame" data-audio-template="glassmorphism" data-fill-color="#ffffff" data-stroke-color="#e2e8f0" data-icon-color="#334155" data-filename="Dynamic Track.mp3" data-audio-duration-text="03:45 Mins" data-audio-size-text="3.15 mb" data-audio-format-text="MP3" data-audio-speed="1" data-audio-behaviour="Auto Play on Page Open" data-audio-volume="0.8" data-skip-seconds="5" data-audio-controls="true" data-control-play-pause="true" data-control-skip="true" data-control-duration="true" data-control-volume="true" data-control-loop="true" data-control-mute="true" data-fill-opacity="0.9" cursor="pointer">
  <defs>
    <filter id="glass-shadow-${uniqueId}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.10" />
    </filter>
  </defs>
  <rect class="audio-fill-layer" width="360" height="152" rx="24" fill="#ffffff" fill-opacity="0.92" stroke="#e2e8f0" stroke-width="1.5" filter="url(#glass-shadow-${uniqueId})" />
  <g class="audio-content-group">
    <!-- Album Icon & Track Info -->
    <g class="audio-header-group" transform="translate(20, 18)">
      <rect x="0" y="0" width="42" height="42" rx="12" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1" />
      <path d="M18 13v12.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V17h4v-4h-6z" fill="#475569" />
      <text class="audio-title" x="52" y="19" font-family="'Inter', sans-serif" font-size="14" font-weight="700" fill="#0f172a">Dynamic Track</text>
      <text class="audio-artist" x="52" y="35" font-family="'Inter', sans-serif" font-size="11" font-weight="500" fill="#64748b">Artist Name</text>
    </g>

    <!-- Duration Timeline -->
    <text class="audio-current-time" x="22" y="82" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="500" fill="#64748b">1:20</text>
    <text class="audio-total-time" x="338" y="82" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="500" fill="#64748b">3:45</text>
    <g class="progress-group" pointer-events="all" cursor="pointer">
      <rect x="22" y="84" width="316" height="20" fill="transparent" />
      <rect class="progress-bg" x="22" y="90" width="316" height="4" rx="2" fill="#e2e8f0" pointer-events="none" />
      <rect class="progress-fill" x="22" y="90" width="112" height="4" rx="2" fill="#334155" pointer-events="none" />
      <circle class="progress-knob" cx="134" cy="92" r="6.5" fill="#334155" stroke="#ffffff" stroke-width="2" pointer-events="none" />
    </g>

    <!-- Controls Row -->
    <g class="loop-icon" transform="translate(22, 116)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="24" height="24" fill="transparent" />
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" fill="#475569" />
    </g>
    <g class="prev-icon" transform="translate(68, 116)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="24" height="24" fill="transparent" />
      <polygon points="11 18 2.5 12 11 6 11 18" fill="#475569" />
      <polygon points="19.5 18 11 12 19.5 6 19.5 18" fill="#475569" />
    </g>
    <g class="play-pause-btn" pointer-events="all" cursor="pointer">
      <circle class="play-pause-bg" cx="140" cy="124" r="17" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1" />
      <g class="play-pause-icon" transform="translate(131, 115)">
        <polygon points="7 4 17 11 7 18 7 4" fill="#1e293b" />
      </g>
    </g>
    <g class="next-icon" transform="translate(182, 116)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="24" height="24" fill="transparent" />
      <polygon points="4 6 12.5 12 4 18 4 6" fill="#475569" />
      <polygon points="12.5 6 21 12 12.5 18 12.5 6" fill="#475569" />
    </g>
    <g class="volume-group" pointer-events="all">
      <g class="volume-slider-part" pointer-events="all" transform="translate(230, 122)">
        <rect x="0" y="-8" width="60" height="20" fill="transparent" />
        <rect class="volume-bg" x="0" y="0" width="60" height="4" rx="2" fill="#e2e8f0" />
        <rect class="volume-fill" x="0" y="0" width="48" height="4" rx="2" fill="#334155" />
        <circle class="volume-knob" cx="48" cy="2" r="5" fill="#334155" stroke="#ffffff" stroke-width="1.5" />
      </g>
      <g class="volume-icon" transform="translate(308, 114)" pointer-events="all" cursor="pointer">
        <rect x="-4" y="-4" width="24" height="24" fill="transparent" />
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#475569" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </g>
  </g>
</g>`
  },

  {
    id: 'forest-moss',
    name: 'Forest Moss (Solid)',
    subtitle: 'Deep Forest Green & Equalizer Bars',
    badge: 'Equalizer Theme',
    width: 440,
    height: 124,
    getSvg: (uniqueId) => `
<g id="audio-${uniqueId}" data-type="audio-frame" data-audio-template="forest-moss" data-fill-color="#16291a" data-stroke-color="#23422a" data-icon-color="#c9e4b7" data-filename="Forest Melody.mp3" data-audio-duration-text="03:45 Mins" data-audio-size-text="3.8 mb" data-audio-format-text="MP3" data-audio-speed="1" data-audio-behaviour="Auto Play on Page Open" data-audio-volume="0.8" data-skip-seconds="5" data-audio-controls="true" data-control-play-pause="true" data-control-skip="true" data-control-duration="true" data-control-volume="true" data-control-loop="true" data-control-mute="true" cursor="pointer">
  <defs>
    <filter id="moss-shadow-${uniqueId}" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>
  <rect class="audio-fill-layer" width="440" height="124" rx="24" fill="#16291a" stroke="#23422a" stroke-width="1.5" filter="url(#moss-shadow-${uniqueId})" />
  <g class="audio-content-group">
    <!-- Album Art Frame on Left -->
    <g transform="translate(18, 18)">
      <rect x="0" y="0" width="88" height="88" rx="16" fill="#193520" fill-opacity="0.6" stroke="#52845c" stroke-width="2" />
      <g transform="translate(28, 28)">
        <rect x="0" y="0" width="32" height="32" rx="4" fill="none" stroke="#52845c" stroke-width="2" />
        <circle cx="10" cy="10" r="3" fill="#52845c" />
        <polyline points="4 26 12 18 20 24 28 14 32 18" fill="none" stroke="#52845c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </g>

    <!-- Header Title + Singer + Equalizer Bars -->
    <text class="audio-title" x="122" y="38" font-family="'Inter', sans-serif" font-size="14" font-weight="700" fill="#e0f7d0">Song title</text>
    <text class="audio-artist" x="122" y="52" font-family="'Inter', sans-serif" font-size="11" font-weight="500" fill="#8aa982">Singer name</text>
    
    <!-- Equalizer Visualizer Bars -->
    <g class="wave-equalizer" transform="translate(378, 28)">
      <rect x="0" y="4" width="3.5" height="16" rx="1.75" fill="#c9e4b7" opacity="0.9" />
      <rect x="6" y="8" width="3.5" height="12" rx="1.75" fill="#c9e4b7" opacity="0.9" />
      <rect x="12" y="2" width="3.5" height="18" rx="1.75" fill="#c9e4b7" opacity="0.9" />
      <rect x="18" y="10" width="3.5" height="10" rx="1.75" fill="#c9e4b7" opacity="0.9" />
      <rect x="24" y="6" width="3.5" height="14" rx="1.75" fill="#c9e4b7" opacity="0.9" />
    </g>

    <!-- Duration Timeline -->
    <text class="audio-current-time" x="122" y="70" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="500" fill="#8aa982">1:20</text>
    <text class="audio-total-time" x="418" y="70" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="500" fill="#8aa982">3:45</text>
    <g class="progress-group" pointer-events="all" cursor="pointer">
      <rect x="122" y="72" width="296" height="18" fill="transparent" />
      <rect class="progress-bg" x="122" y="77" width="296" height="3" rx="1.5" fill="#27462c" pointer-events="none" />
      <rect class="progress-fill" x="122" y="77" width="105" height="3" rx="1.5" fill="#c9e4b7" pointer-events="none" />
      <circle class="progress-knob" cx="227" cy="78.5" r="5.5" fill="#c9e4b7" pointer-events="none" />
    </g>

    <!-- Controls Row -->
    <g class="loop-icon" transform="translate(122, 94)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" fill="#c9e4b7" />
    </g>
    <g class="prev-icon" transform="translate(164, 94)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
      <polygon points="10 16 3 11 10 6 10 16" fill="#c9e4b7" />
      <polygon points="17 16 10 11 17 6 17 16" fill="#c9e4b7" />
    </g>
    <g class="play-pause-btn" pointer-events="all" cursor="pointer">
      <circle class="play-pause-bg" cx="222" cy="101" r="13" fill="none" stroke="#c9e4b7" stroke-width="1.5" />
      <g class="play-pause-icon" transform="translate(216, 94)">
        <polygon points="5 3 13 8 5 13 5 3" fill="#c9e4b7" />
      </g>
    </g>
    <g class="next-icon" transform="translate(254, 94)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
      <polygon points="3 6 10 11 3 16 3 6" fill="#c9e4b7" />
      <polygon points="10 6 17 11 10 16 10 6" fill="#c9e4b7" />
    </g>
    <g class="volume-group" pointer-events="all">
      <g class="volume-slider-part" pointer-events="all" transform="translate(294, 99)">
        <rect x="0" y="-8" width="60" height="20" fill="transparent" />
        <rect class="volume-bg" x="0" y="0" width="60" height="3" rx="1.5" fill="#27462c" />
        <rect class="volume-fill" x="0" y="0" width="48" height="3" rx="1.5" fill="#c9e4b7" />
        <circle class="volume-knob" cx="48" cy="1.5" r="5" fill="#c9e4b7" />
      </g>
      <g class="volume-icon" transform="translate(390, 92)" pointer-events="all" cursor="pointer">
        <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#c9e4b7" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="#c9e4b7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </g>
  </g>
</g>`
  },

  {
    id: 'cyber-blue',
    name: 'Cyber Neon Blue',
    subtitle: 'Futuristic Dark & Glowing Cyan Accents',
    badge: 'Neon Glow',
    width: 360,
    height: 114,
    getSvg: (uniqueId) => `
<g id="audio-${uniqueId}" data-type="audio-frame" data-audio-template="cyber-blue" data-fill-color="#0c1421" data-stroke-color="#182840" data-icon-color="#00f2fe" data-filename="Cyber Synth.mp3" data-audio-duration-text="04:30 Mins" data-audio-size-text="4.2 mb" data-audio-format-text="MP3" data-audio-speed="1" data-audio-behaviour="Auto Play on Page Open" data-audio-volume="0.8" data-skip-seconds="5" data-audio-controls="true" data-control-play-pause="true" data-control-skip="true" data-control-duration="true" data-control-volume="true" data-control-loop="true" data-control-mute="true" cursor="pointer">
  <defs>
    <filter id="cyan-glow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3.5" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect class="audio-fill-layer" width="360" height="114" rx="20" fill="#0c1421" stroke="#182840" stroke-width="1.5" />
  <g class="audio-content-group">
    <!-- Top Row Controls with Cyan Glow -->
    <g class="loop-icon" transform="translate(24, 24)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="24" height="24" fill="transparent" />
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" fill="#00f2fe" filter="url(#cyan-glow-${uniqueId})" />
    </g>
    <g class="prev-icon" transform="translate(74, 24)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="24" height="24" fill="transparent" />
      <polygon points="11 18 2.5 12 11 6 11 18" fill="#00f2fe" filter="url(#cyan-glow-${uniqueId})" />
      <polygon points="19.5 18 11 12 19.5 6 19.5 18" fill="#00f2fe" filter="url(#cyan-glow-${uniqueId})" />
    </g>
    <g class="play-pause-btn" pointer-events="all" cursor="pointer">
      <circle class="play-pause-bg" cx="140" cy="32" r="16" fill="#00f2fe" fill-opacity="0.1" stroke="#00f2fe" stroke-width="1.5" filter="url(#cyan-glow-${uniqueId})" />
      <g class="play-pause-icon" transform="translate(132, 23)">
        <polygon points="7 4 17 11 7 18 7 4" fill="#00f2fe" filter="url(#cyan-glow-${uniqueId})" />
      </g>
    </g>
    <g class="next-icon" transform="translate(190, 24)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="24" height="24" fill="transparent" />
      <polygon points="4 6 12.5 12 4 18 4 6" fill="#00f2fe" filter="url(#cyan-glow-${uniqueId})" />
      <polygon points="12.5 6 21 12 12.5 18 12.5 6" fill="#00f2fe" filter="url(#cyan-glow-${uniqueId})" />
    </g>
    <g class="volume-group" pointer-events="all">
      <g class="volume-slider-part" pointer-events="all" transform="translate(236, 30)">
        <rect x="0" y="-8" width="55" height="20" fill="transparent" />
        <rect class="volume-bg" x="0" y="0" width="55" height="3" rx="1.5" fill="#16273c" />
        <rect class="volume-fill" x="0" y="0" width="44" height="3" rx="1.5" fill="#00f2fe" filter="url(#cyan-glow-${uniqueId})" />
        <circle class="volume-knob" cx="44" cy="1.5" r="5" fill="#00f2fe" stroke="#0c1421" stroke-width="1.5" filter="url(#cyan-glow-${uniqueId})" />
      </g>
      <g class="volume-icon" transform="translate(312, 22)" pointer-events="all" cursor="pointer">
        <rect x="-4" y="-4" width="24" height="24" fill="transparent" />
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#00f2fe" filter="url(#cyan-glow-${uniqueId})" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="#00f2fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#cyan-glow-${uniqueId})" />
      </g>
    </g>

    <!-- Bottom Row Timeline -->
    <text class="audio-current-time" x="24" y="86" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#00f2fe">0:10</text>
    <g class="progress-group" pointer-events="all" cursor="pointer">
      <rect x="64" y="72" width="230" height="22" fill="transparent" />
      <rect class="progress-bg" x="64" y="81" width="230" height="4" rx="2" fill="#16273c" pointer-events="none" />
      <rect class="progress-fill" x="64" y="81" width="30" height="4" rx="2" fill="#00f2fe" pointer-events="none" filter="url(#cyan-glow-${uniqueId})" />
      <circle class="progress-knob" cx="94" cy="83" r="7" fill="#00f2fe" stroke="#0c1421" stroke-width="2" pointer-events="none" filter="url(#cyan-glow-${uniqueId})" />
    </g>
    <text class="audio-total-time" x="336" y="86" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="500" fill="#67e8f9">4:30</text>
  </g>
</g>`
  },

  {
    id: 'silver-mono',
    name: 'Silver Mono Capsule',
    subtitle: 'Brushed Metallic Capsule Pill',
    badge: 'Metallic Finish',
    width: 450,
    height: 52,
    getSvg: (uniqueId) => `
<g id="audio-${uniqueId}" data-type="audio-frame" data-audio-template="silver-mono" data-fill-color="#8c8c8c" data-stroke-color="#ffffff" data-icon-color="#1e293b" data-filename="Acoustic Instrumental.mp3" data-audio-duration-text="03:45 Mins" data-audio-size-text="3.2 mb" data-audio-format-text="MP3" data-audio-speed="1" data-audio-behaviour="Auto Play on Page Open" data-audio-volume="0.8" data-skip-seconds="5" data-audio-controls="true" data-control-play-pause="true" data-control-skip="true" data-control-duration="true" data-control-volume="true" data-control-loop="true" data-control-mute="true" cursor="pointer">
  <defs>
    <linearGradient id="silver-grad-${uniqueId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#b8b8b8" />
      <stop offset="50%" stop-color="#8c8c8c" />
      <stop offset="100%" stop-color="#747474" />
    </linearGradient>
    <filter id="silver-shadow-${uniqueId}" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.25" />
    </filter>
  </defs>
  <rect class="audio-fill-layer" width="450" height="52" rx="26" fill="url(#silver-grad-${uniqueId})" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.45" filter="url(#silver-shadow-${uniqueId})" />
  <g class="audio-content-group">
    <g class="loop-icon" transform="translate(20, 18)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" fill="#1e293b" />
    </g>
    <g class="prev-icon" transform="translate(54, 18)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
      <polygon points="10 16 3 11 10 6 10 16" fill="#1e293b" />
      <polygon points="17 16 10 11 17 6 17 16" fill="#1e293b" />
    </g>
    <g class="play-pause-btn" pointer-events="all" cursor="pointer">
      <circle class="play-pause-bg" cx="98" cy="26" r="13" fill="none" stroke="#1e293b" stroke-width="1.5" />
      <g class="play-pause-icon" transform="translate(92, 19)">
        <polygon points="5 3 13 8 5 13 5 3" fill="#1e293b" />
      </g>
    </g>
    <g class="next-icon" transform="translate(126, 18)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
      <polygon points="3 6 10 11 3 16 3 6" fill="#1e293b" />
      <polygon points="10 6 17 11 10 16 10 6" fill="#1e293b" />
    </g>

    <!-- Duration Timeline Inlined -->
    <text class="audio-current-time" x="162" y="30" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" fill="#0f172a">1:20</text>
    <g class="progress-group" pointer-events="all" cursor="pointer">
      <rect x="194" y="16" width="90" height="20" fill="transparent" />
      <rect class="progress-bg" x="194" y="24" width="90" height="4" rx="2" fill="rgba(0,0,0,0.25)" pointer-events="none" />
      <rect class="progress-fill" x="194" y="24" width="32" height="4" rx="2" fill="#1e293b" pointer-events="none" />
      <circle class="progress-knob" cx="226" cy="26" r="5" fill="#1e293b" pointer-events="none" />
    </g>
    <text class="audio-total-time" x="294" y="30" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" fill="#0f172a">3:45</text>

    <!-- Volume -->
    <g class="volume-group" pointer-events="all">
      <g class="volume-slider-part" pointer-events="all" transform="translate(336, 24)">
        <rect x="0" y="-8" width="55" height="20" fill="transparent" />
        <rect class="volume-bg" x="0" y="0" width="55" height="4" rx="2" fill="rgba(0,0,0,0.25)" />
        <rect class="volume-fill" x="0" y="0" width="44" height="4" rx="2" fill="#1e293b" />
        <circle class="volume-knob" cx="44" cy="2" r="5" fill="#1e293b" />
      </g>
      <g class="volume-icon" transform="translate(410, 18)" pointer-events="all" cursor="pointer">
        <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#1e293b" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </g>
  </g>
</g>`
  },

  {
    id: 'sunset-vibrant',
    name: 'Sunset Vibrant',
    subtitle: 'Coral to Magenta Gradient with Neon Glow',
    badge: 'Vibrant Glow',
    width: 460,
    height: 54,
    getSvg: (uniqueId) => `
<g id="audio-${uniqueId}" data-type="audio-frame" data-audio-template="sunset-vibrant" data-fill-color="#ff2a55" data-stroke-color="none" data-icon-color="#ffffff" data-filename="Sunset Vibe.mp3" data-audio-duration-text="02:59 Mins" data-audio-size-text="2.75 mb" data-audio-format-text="MP3" data-audio-speed="1" data-audio-behaviour="Auto Play on Page Open" data-audio-volume="0.8" data-skip-seconds="5" data-audio-controls="true" data-control-play-pause="true" data-control-skip="true" data-control-duration="true" data-control-volume="true" data-control-loop="true" data-control-mute="true" cursor="pointer">
  <defs>
    <linearGradient id="sunset-grad-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff4328" />
      <stop offset="35%" stop-color="#ff2a55" />
      <stop offset="70%" stop-color="#e61972" />
      <stop offset="100%" stop-color="#c4188b" />
    </linearGradient>
    <filter id="sunset-glow-${uniqueId}" x="-10%" y="-15%" width="120%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#e61972" flood-opacity="0.45" />
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#ff4328" flood-opacity="0.30" />
    </filter>
  </defs>
  <rect class="audio-fill-layer" width="460" height="54" rx="27" fill="url(#sunset-grad-${uniqueId})" filter="url(#sunset-glow-${uniqueId})" />
  <g class="audio-content-group">
    <g class="loop-icon" transform="translate(18, 18)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" fill="#ffffff" fill-opacity="0.85" />
    </g>
    <g class="prev-icon" transform="translate(50, 18)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
      <polygon points="10 16 3 11 10 6 10 16" fill="#ffffff" />
      <polygon points="17 16 10 11 17 6 17 16" fill="#ffffff" />
    </g>
    <g class="play-pause-btn" pointer-events="all" cursor="pointer">
      <g class="play-pause-icon" transform="translate(84, 18)">
        <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
        <polygon points="5 3 14 9 5 15 5 3" fill="#ffffff" />
      </g>
    </g>
    <g class="next-icon" transform="translate(116, 18)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
      <polygon points="3 6 10 11 3 16 3 6" fill="#ffffff" />
      <polygon points="10 6 17 11 10 16 10 6" fill="#ffffff" />
    </g>

    <!-- Combined Inline Time -->
    <text class="audio-current-time" x="150" y="31" font-family="'Inter', sans-serif" font-size="11" font-weight="600" fill="#ffffff">1:20</text>
    <text x="178" y="31" font-family="'Inter', sans-serif" font-size="11" fill="rgba(255,255,255,0.7)">/</text>
    <text class="audio-total-time" x="186" y="31" font-family="'Inter', sans-serif" font-size="11" font-weight="500" fill="rgba(255,255,255,0.9)">2:59</text>

    <!-- Progress Bar -->
    <g class="progress-group" pointer-events="all" cursor="pointer">
      <rect x="222" y="16" width="118" height="20" fill="transparent" />
      <rect class="progress-bg" x="222" y="25" width="118" height="3" rx="1.5" fill="rgba(255,255,255,0.38)" pointer-events="none" />
      <rect class="progress-fill" x="222" y="25" width="46" height="3" rx="1.5" fill="#ffffff" pointer-events="none" />
      <circle class="progress-knob" cx="268" cy="26.5" r="5.5" fill="#ffffff" pointer-events="none" />
    </g>

    <!-- Volume Slider -->
    <g class="volume-group" pointer-events="all">
      <g class="volume-slider-part" pointer-events="all" transform="translate(356, 25)">
        <rect x="0" y="-8" width="50" height="20" fill="transparent" />
        <rect class="volume-bg" x="0" y="0" width="50" height="3" rx="1.5" fill="rgba(255,255,255,0.38)" />
        <rect class="volume-fill" x="0" y="0" width="40" height="3" rx="1.5" fill="#ffffff" />
        <circle class="volume-knob" cx="40" cy="1.5" r="5" fill="#ffffff" />
      </g>
      <g class="volume-icon" transform="translate(424, 18)" pointer-events="all" cursor="pointer">
        <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#ffffff" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </g>
  </g>
</g>`
  },

  {
    id: 'cyberpunk-wide',
    name: 'Cyberpunk Neon (Wide Bar)',
    subtitle: 'Pro Console Deck with Top Glow Bar',
    badge: 'Console Bar',
    width: 460,
    height: 74,
    getSvg: (uniqueId) => `
<g id="audio-${uniqueId}" data-type="audio-frame" data-audio-template="cyberpunk-wide" data-fill-color="#080d15" data-stroke-color="#162133" data-icon-color="#00f2fe" data-filename="Neon Skyline.mp3" data-audio-duration-text="03:45 Mins" data-audio-size-text="3.5 mb" data-audio-format-text="MP3" data-audio-speed="1" data-audio-behaviour="Auto Play on Page Open" data-audio-volume="0.8" data-skip-seconds="5" data-audio-controls="true" data-control-play-pause="true" data-control-skip="true" data-control-duration="true" data-control-volume="true" data-control-loop="true" data-control-mute="true" cursor="pointer">
  <defs>
    <filter id="wide-cyan-glow-${uniqueId}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect class="audio-fill-layer" width="460" height="74" rx="12" fill="#080d15" stroke="#162133" stroke-width="1.5" />
  <g class="audio-content-group">
    <!-- Top Progress Line -->
    <g class="progress-group" pointer-events="all" cursor="pointer">
      <rect x="16" y="8" width="428" height="18" fill="transparent" />
      <rect class="progress-bg" x="16" y="16" width="428" height="3" rx="1.5" fill="#0f1926" stroke="#16273c" stroke-width="0.5" pointer-events="none" />
      <rect class="progress-fill" x="16" y="16" width="145" height="3" rx="1.5" fill="#00f2fe" filter="url(#wide-cyan-glow-${uniqueId})" pointer-events="none" />
      <circle class="progress-knob" cx="161" cy="17.5" r="5.5" fill="#00f2fe" filter="url(#wide-cyan-glow-${uniqueId})" pointer-events="none" />
    </g>

    <!-- Bottom Controls: Cyan play, Purple navigation -->
    <g class="play-pause-btn" pointer-events="all" cursor="pointer">
      <g class="play-pause-icon" transform="translate(18, 38)">
        <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
        <polygon points="5 3 14 9 5 15 5 3" fill="#00f2fe" filter="url(#wide-cyan-glow-${uniqueId})" />
      </g>
    </g>
    <g class="prev-icon" transform="translate(52, 38)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
      <polygon points="10 15 3 10.5 10 6 10 15" fill="#c084fc" />
      <polygon points="17 15 10 10.5 17 6 17 15" fill="#c084fc" />
    </g>
    <g class="next-icon" transform="translate(86, 38)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
      <polygon points="3 6 10 10.5 3 15 3 6" fill="#c084fc" />
      <polygon points="10 6 17 10.5 10 15 10 6" fill="#c084fc" />
    </g>
    <g class="loop-icon" transform="translate(120, 38)" pointer-events="all" cursor="pointer">
      <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" fill="#c084fc" />
    </g>

    <!-- Right Controls: Numbers + Volume + Mute -->
    <text class="audio-current-time" x="250" y="51" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#00f2fe">1:20</text>
    <text x="280" y="51" font-family="'JetBrains Mono', monospace" font-size="11" fill="#64748b">/</text>
    <text class="audio-total-time" x="290" y="51" font-family="'JetBrains Mono', monospace" font-size="11" fill="#94a3b8">3:45</text>
    <g class="volume-group" pointer-events="all">
      <g class="volume-slider-part" pointer-events="all" transform="translate(340, 45)">
        <rect x="0" y="-8" width="60" height="20" fill="transparent" />
        <rect class="volume-bg" x="0" y="0" width="60" height="3" rx="1.5" fill="#16273c" />
        <rect class="volume-fill" x="0" y="0" width="48" height="3" rx="1.5" fill="#00f2fe" filter="url(#wide-cyan-glow-${uniqueId})" />
        <circle class="volume-knob" cx="48" cy="1.5" r="5" fill="#00f2fe" filter="url(#wide-cyan-glow-${uniqueId})" />
      </g>
      <g class="volume-icon" transform="translate(420, 38)" pointer-events="all" cursor="pointer">
        <rect x="-4" y="-4" width="20" height="20" fill="transparent" />
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#c084fc" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="#c084fc" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </g>
  </g>
</g>`
  },

  {
    id: 'audio-icon',
    name: 'Audio Icon (Compact)',
    subtitle: 'Classic Minimalist Audio Badge',
    badge: 'Compact',
    width: 96,
    height: 48,
    getSvg: (uniqueId) => `
<g id="audio-${uniqueId}" data-type="audio-frame" data-audio-template="audio-icon" data-fill-color="#ffffff" data-stroke-color="#900000" data-icon-color="#000000" data-filename="Audio Name.mp3" data-audio-duration-text="04:00 Mins" data-audio-size-text="3.15 mb" data-audio-format-text="MP3" data-audio-speed="1" data-audio-behaviour="Auto Play on Page Open" data-audio-volume="0.8" data-skip-seconds="5" data-audio-controls="true" data-control-play-pause="true" data-control-skip="true" data-control-duration="true" data-control-volume="true" data-control-loop="true" data-control-mute="true" data-fill-opacity="1" cursor="pointer">
  <rect class="audio-fill-layer" width="96" height="48" rx="12" fill="#ffffff" stroke="#900000" stroke-width="1.5" opacity="1" pointer-events="none"></rect>
  <rect class="svg-image-stroke-overlay" width="96" height="48" rx="12" fill="transparent" pointer-events="all" />
  <g class="audio-content-group" pointer-events="none">
    <g class="prev-icon" transform="translate(11, 0)" style="opacity: 0.5; pointer-events: none;">
      <polygon points="15 24 21 18 21 30" fill="#000000"></polygon>
      <polygon points="9 24 15 18 15 30" fill="#000000"></polygon>
    </g>
    <g class="play-pause-icon" transform="translate(24, 0)">
      <polygon points="20 16 32 24 20 32" fill="#000000" stroke="#000000" stroke-width="2" stroke-linejoin="round"></polygon>
    </g>
    <g class="next-icon" transform="translate(37, 0)" style="opacity: 0.5; pointer-events: none;">
      <polygon points="33 24 27 18 27 30" fill="#000000"></polygon>
      <polygon points="39 24 33 18 33 30" fill="#000000"></polygon>
    </g>
  </g>
</g>`
  }
];

const Audio = ({ isFullView }) => {
  const handleDragStart = (e, template) => {
    const uniqueId = Date.now();
    const svgCode = template.getSvg(uniqueId);

    const payload = {
      type: 'icon',
      icon: {
        html: svgCode,
        name: template.name,
        fill: '#ffffff',
        stroke: 'none',
        strokeWidth: '0',
        isShape: true
      }
    };

    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
      type: 'audio',
      svgContent: svgCode
    }));
    e.dataTransfer.setData('text/plain', template.name);
  };

  const handleClick = (template) => {
    const uniqueId = Date.now();
    const svgCode = template.getSvg(uniqueId);

    window.dispatchEvent(
      new CustomEvent('add-icon-to-editor', {
        detail: {
          icon: {
            html: svgCode,
            name: template.name,
            fill: '#ffffff',
            stroke: 'none',
            strokeWidth: '0',
            isShape: true
          },
          isShape: true
        }
      })
    );
  };

  const displayList = isFullView ? audioTemplates : audioTemplates.slice(0, 4);

  return (
    <div className={`w-full ${isFullView ? 'grid grid-cols-2 gap-[0.8vw] p-[0.5vw]' : 'grid grid-cols-2 gap-[0.5vw]'}`}>
      {displayList.map((tpl) => (
        <div
          key={tpl.id}
          draggable
          onDragStart={(e) => handleDragStart(e, tpl)}
          onClick={() => handleClick(tpl)}
          className={`group relative flex flex-col justify-between bg-white rounded-[0.6vw] border border-gray-200/90 hover:border-orange-500 hover:shadow-md transition-all cursor-pointer p-[0.6vw] overflow-hidden ${
            isFullView ? 'h-[7.5vw]' : 'h-[5vw]'
          }`}
          title={`Click or drag to add ${tpl.name}`}
        >
          {/* Header row with badge */}
          <div className="flex items-center justify-between w-full mb-[0.2vw]">
            <span className="text-[0.68vw] font-bold text-gray-800 truncate pr-1 group-hover:text-orange-600 transition-colors">
              {tpl.name}
            </span>
            <span className="text-[0.5vw] font-semibold px-[0.35vw] py-[0.1vw] rounded-full bg-orange-50 text-orange-600 border border-orange-200/60 shrink-0">
              {tpl.badge}
            </span>
          </div>

          {/* Miniature Player Preview Card */}
          <div className="flex-1 w-full rounded-[0.4vw] flex items-center justify-center p-[0.3vw] overflow-hidden select-none">
            {tpl.id === 'glassmorphism' && (
              <div className="w-full h-full bg-slate-100/90 rounded-[0.4vw] border border-white shadow-2xs p-[0.3vw] flex flex-col justify-between">
                <div className="flex items-center gap-[0.3vw]">
                  <div className="w-[1vw] h-[1vw] rounded bg-slate-200 flex items-center justify-center text-[0.5vw] text-slate-700">♪</div>
                  <div className="leading-tight">
                    <div className="text-[0.48vw] font-bold text-slate-900 truncate">Dynamic Track</div>
                    <div className="text-[0.4vw] text-slate-400">Artist Name</div>
                  </div>
                </div>
                <div className="w-full h-[2px] bg-slate-200 rounded-full relative">
                  <div className="w-[35%] h-full bg-slate-700 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between text-[0.4vw] text-slate-600">
                  <span>🔁</span>
                  <div className="w-[0.9vw] h-[0.9vw] rounded-full bg-slate-200 flex items-center justify-center text-[0.45vw]">▶</div>
                  <span>🔊</span>
                </div>
              </div>
            )}

            {tpl.id === 'forest-moss' && (
              <div className="w-full h-full bg-[#16291a] text-[#c9e4b7] rounded-[0.4vw] border border-[#23422a] p-[0.3vw] flex items-center gap-[0.4vw]">
                <div className="w-[1.8vw] h-[1.8vw] rounded border border-[#52845c] bg-[#193520] flex items-center justify-center text-[0.5vw] shrink-0">
                  🖼️
                </div>
                <div className="flex-1 flex flex-col justify-between h-full py-[0.1vw]">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.48vw] font-semibold text-[#e0f7d0] truncate">Song title</span>
                    <div className="flex gap-[1px] items-end h-[0.6vw]">
                      <span className="w-[1.5px] h-[60%] bg-[#c9e4b7] rounded"></span>
                      <span className="w-[1.5px] h-[100%] bg-[#c9e4b7] rounded"></span>
                      <span className="w-[1.5px] h-[40%] bg-[#c9e4b7] rounded"></span>
                    </div>
                  </div>
                  <div className="w-full h-[2px] bg-[#27462c] rounded-full">
                    <div className="w-[45%] h-full bg-[#c9e4b7] rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between text-[0.4vw]">
                    <span>🔁</span>
                    <div className="w-[0.8vw] h-[0.8vw] rounded-full border border-[#c9e4b7] flex items-center justify-center text-[0.4vw]">▶</div>
                    <span>🔊</span>
                  </div>
                </div>
              </div>
            )}

            {tpl.id === 'cyber-blue' && (
              <div className="w-full h-full bg-[#0c1421] text-[#00f2fe] rounded-[0.4vw] border border-[#182840] p-[0.3vw] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[0.42vw]">
                  <span>🔁</span>
                  <span>⏮</span>
                  <div className="w-[0.9vw] h-[0.9vw] rounded-full bg-[#00f2fe]/10 border border-[#00f2fe] flex items-center justify-center text-[0.45vw] shadow-[0_0_6px_#00f2fe]">▶</div>
                  <span>⏭</span>
                  <span>🔊</span>
                </div>
                <div className="flex items-center gap-[0.3vw] text-[0.4vw] font-mono">
                  <span>0:10</span>
                  <div className="flex-1 h-[2px] bg-[#16273c] rounded-full">
                    <div className="w-[20%] h-full bg-[#00f2fe] rounded-full shadow-[0_0_4px_#00f2fe]"></div>
                  </div>
                  <span className="text-cyan-200">4:30</span>
                </div>
              </div>
            )}

            {tpl.id === 'silver-mono' && (
              <div
                style={{ background: 'linear-gradient(180deg, #b8b8b8, #8c8c8c 50%, #747474)' }}
                className="w-full h-[1.8vw] rounded-full px-[0.5vw] flex items-center justify-between text-slate-900 shadow-sm border border-white/40"
              >
                <span className="text-[0.4vw]">🔁</span>
                <span className="text-[0.4vw]">⏮</span>
                <div className="w-[0.9vw] h-[0.9vw] rounded-full border border-slate-900 flex items-center justify-center text-[0.4vw]">▶</div>
                <span className="text-[0.4vw]">⏭</span>
                <span className="text-[0.4vw] font-mono">1:20</span>
                <div className="w-[2vw] h-[2px] bg-black/25 rounded-full">
                  <div className="w-[30%] h-full bg-slate-900 rounded-full"></div>
                </div>
                <span className="text-[0.4vw] font-mono">3:45</span>
                <span className="text-[0.4vw]">🔊</span>
              </div>
            )}

            {tpl.id === 'sunset-vibrant' && (
              <div
                style={{
                  background: 'linear-gradient(90deg, #ff4328 0%, #ff2a55 35%, #e61972 70%, #c4188b 100%)',
                  boxShadow: '0 4px 12px -2px rgba(230, 25, 114, 0.45)'
                }}
                className="w-full h-[1.8vw] rounded-full px-[0.5vw] flex items-center justify-between text-white shadow-sm"
              >
                <span className="text-[0.4vw]">🔁</span>
                <span className="text-[0.4vw]">⏮</span>
                <span className="text-[0.45vw] font-bold">▶</span>
                <span className="text-[0.4vw]">⏭</span>
                <span className="text-[0.38vw] font-medium whitespace-nowrap">1:20/2:59</span>
                <div className="flex-1 max-w-[2.5vw] h-[2px] bg-white/35 rounded-full mx-[0.2vw]">
                  <div className="w-[45%] h-full bg-white rounded-full"></div>
                </div>
                <span className="text-[0.4vw]">🔊</span>
              </div>
            )}

            {tpl.id === 'cyberpunk-wide' && (
              <div className="w-full h-full bg-[#080d15] text-[#c084fc] rounded-[0.4vw] border border-[#162133] p-[0.3vw] flex flex-col justify-between">
                <div className="w-full h-[2px] bg-[#0e1a2b] rounded-full shadow-[0_0_4px_#00f2fe88]">
                  <div className="w-[35%] h-full bg-[#00f2fe] rounded-full"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[0.3vw]">
                    <span className="text-[#00f2fe] text-[0.45vw]">▶</span>
                    <span className="text-[0.38vw]">⏮</span>
                    <span className="text-[0.38vw]">⏭</span>
                    <span className="text-[0.38vw]">🔁</span>
                  </div>
                  <div className="flex items-center gap-[0.2vw] text-[0.38vw] font-mono">
                    <span className="text-[#00f2fe]">1:20</span>
                    <span className="text-gray-500">/</span>
                    <span className="text-gray-400">3:45</span>
                    <span>🔊</span>
                  </div>
                </div>
              </div>
            )}

            {tpl.id === 'audio-icon' && (
              <div className="w-[2.4vw] h-[1.5vw] bg-white rounded-[0.3vw] border border-red-900/60 flex items-center justify-center gap-[0.2vw] shadow-2xs">
                <span className="text-[0.4vw] text-gray-400">⏮</span>
                <span className="text-[0.55vw] text-black">▶</span>
                <span className="text-[0.4vw] text-gray-400">⏭</span>
              </div>
            )}
          </div>

          {/* Subtitle text */}
          <div className="text-[0.45vw] text-gray-400 truncate mt-[0.1vw]">
            {tpl.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Audio;
