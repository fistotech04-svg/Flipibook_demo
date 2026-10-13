import React, { useState, useMemo } from 'react';
import { Search, Sparkles } from 'lucide-react';
import './Animated_Decorators.css';

/* =========================================================================
   1. CURATED MOTION EFFECTS & KEYFRAMES DEFINITIONS
   ========================================================================= */
export const MOTION_EFFECTS = [
  { id: 'anim-dash-flow', name: 'Running Dash Flow (Lines)' },
  { id: 'anim-dash-flow-fast', name: 'Fast Laser Dash Flow' },
  { id: 'anim-float', name: 'Gentle Floating & Sway' },
  { id: 'anim-pulse', name: 'Fast Pulse & Glowing Aura' },
  { id: 'anim-spin', name: 'Infinite Clockwise Spin' },
  { id: 'anim-bounce', name: 'Spring Bounce & Jump' },
  { id: 'anim-burst', name: 'Radial Particle Burst' },
  { id: 'anim-radar', name: 'Radar Ripple Wave Ping' },
  { id: 'anim-twinkle', name: 'Twinkle Star Sparkle' },
  { id: 'anim-arcs', name: 'Expanding Sonic Arcs' },
  { id: 'anim-chroma', name: 'Rainbow Chroma Shift' },
  { id: 'none', name: 'Static (No Motion)' }
];

export const COLOR_COMBINATIONS = [
  { name: 'Cyan & Purple', fill: '#00e5ff', stroke: '#818cf8', glow: '#00e5ff' },
  { name: 'Neon Sunset', fill: '#f59e0b', stroke: '#ef4444', glow: '#f97316' },
  { name: 'Emerald Spark', fill: '#10b981', stroke: '#06b6d4', glow: '#10b981' },
  { name: 'Synthwave', fill: '#ec4899', stroke: '#8b5cf6', glow: '#f472b6' },
  { name: 'Lime Volt', fill: '#84cc16', stroke: '#00f0ff', glow: '#84cc16' },
  { name: 'Berry Punch', fill: '#f43f5e', stroke: '#fbbf24', glow: '#f43f5e' },
  { name: 'Royal Gold', fill: '#fbbf24', stroke: '#1e293b', glow: '#fbbf24' },
  { name: 'OLED Blue', fill: '#0284c7', stroke: '#38bdf8', glow: '#38bdf8' }
];

/* =========================================================================
   2. EXTENSIVE ASSET PRESETS (From FlipHTML5 Animated Studio)
   ========================================================================= */
export const ANIMATED_SHAPES_PRESETS = [
  // 1. DIAGONAL TRIPLE SPEED DASH LINES
  {
    id: 'diagonal-stripe-wave',
    name: 'Diagonal Triple Dash Flow',
    category: 'line',
    width: 110,
    height: 80,
    anim: 'none',
    duration: '1.6s',
    color1: '#00e5ff',
    color2: '#818cf8',
    glow: '#00e5ff',
    fill: 'none',
    strokeWidth: 3,
    svg: `<line class="anim-dash-flow" x1="12" y1="20" x2="98" y2="64" stroke="COLOR_1" stroke-width="3" stroke-linecap="round" stroke-dasharray="10 8"/>
<line class="anim-dash-flow-fast" x1="18" y1="28" x2="104" y2="72" stroke="COLOR_2" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="14 10"/>
<line class="anim-dash-flow" x1="6" y1="36" x2="92" y2="80" stroke="COLOR_1" stroke-width="3" stroke-linecap="round" stroke-dasharray="8 8"/>`
  },

  // 2. RUNNING NEON LASER
  {
    id: 'running-neon-line',
    name: 'Laser Dash March',
    category: 'line',
    width: 100,
    height: 40,
    anim: 'none',
    duration: '1.4s',
    color1: '#00f0ff',
    color2: '#0284c7',
    glow: '#00f0ff',
    fill: 'none',
    strokeWidth: 4.5,
    svg: `<line class="anim-dash-flow-fast" x1="8" y1="20" x2="92" y2="20" stroke="COLOR_1" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="12 8"/>`
  },

  // 3. SINE AUDIO WAVE
  {
    id: 'sine-audio-wave',
    name: 'Audio Sine Wave Flow',
    category: 'line',
    width: 100,
    height: 50,
    anim: 'anim-float',
    duration: '2s',
    color1: '#00f0ff',
    color2: '#10b981',
    glow: '#00f0ff',
    fill: 'none',
    strokeWidth: 4,
    svg: `<path class="anim-dash-flow" d="M 8 25 Q 30 5 50 25 T 92 25" fill="none" stroke="COLOR_1" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 6"/>`
  },

  // 4. EXPANDING ARROW MARKER
  {
    id: 'double-head-arrow',
    name: 'Expanding Arrow Marker',
    category: 'line',
    width: 100,
    height: 40,
    anim: 'anim-pulse',
    duration: '1.6s',
    color1: '#f59e0b',
    color2: '#ef4444',
    glow: '#fbbf24',
    fill: 'none',
    strokeWidth: 3.5,
    svg: `<path class="anim-dash-flow" d="M 16 20 L 84 20" fill="none" stroke="COLOR_1" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="8 6"/>
<path d="M 72 10 L 84 20 L 72 30" fill="none" stroke="COLOR_2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M 28 10 L 16 20 L 28 30" fill="none" stroke="COLOR_2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
  },

  // 5. SONIC CURVED ARCS
  {
    id: 'arc-sonic-waves',
    name: 'Expanding Sonic Arcs',
    category: 'line',
    width: 90,
    height: 90,
    anim: 'anim-arcs',
    duration: '2s',
    color1: '#00e5ff',
    color2: '#10b981',
    glow: '#00e5ff',
    fill: 'none',
    strokeWidth: 3,
    svg: `<path d="M 20 70 A 35 35 0 0 1 20 20" fill="none" stroke="COLOR_1" stroke-width="3" stroke-linecap="round"/>
<path d="M 32 62 A 25 25 0 0 1 32 28" fill="none" stroke="COLOR_2" stroke-width="2.5" stroke-linecap="round"/>
<path d="M 70 70 A 35 35 0 0 0 70 20" fill="none" stroke="COLOR_1" stroke-width="3" stroke-linecap="round"/>
<path d="M 58 62 A 25 25 0 0 0 58 28" fill="none" stroke="COLOR_2" stroke-width="2.5" stroke-linecap="round"/>`
  },

  // 6. CHEVRON PURPLE BURST
  {
    id: 'chevron-burst-purple',
    name: 'Flying Purple Chevrons',
    category: 'particle',
    width: 90,
    height: 90,
    anim: 'none',
    duration: '2.2s',
    color1: '#a855f7',
    color2: '#10b981',
    glow: '#c084fc',
    fill: 'none',
    strokeWidth: 3,
    svg: `<path class="part-p1" d="M 22 20 L 28 25 L 22 30" fill="none" stroke="COLOR_1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path class="part-p2" d="M 62 26 L 68 31 L 62 36" fill="none" stroke="COLOR_2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path class="part-p3" d="M 40 60 L 46 65 L 40 70" fill="none" stroke="COLOR_1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
<path class="part-p4" d="M 24 64 L 30 69 L 24 74" fill="none" stroke="COLOR_2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
  },

  // 7. DYNAMIC DUO CHEVRONS
  {
    id: 'chevron-giant-pair',
    name: 'Dynamic Duo Chevrons',
    category: 'particle',
    width: 90,
    height: 90,
    anim: 'none',
    duration: '2s',
    color1: '#8b5cf6',
    color2: '#10b981',
    glow: '#a78bfa',
    fill: '#8b5cf6',
    strokeWidth: 0,
    svg: `<polygon class="part-p1" points="30,30 52,45 30,60" fill="COLOR_1"/>
<polygon class="part-p2" points="56,48 70,58 56,68" fill="COLOR_2"/>`
  },

  // 8. RED ARROWHEAD SCATTER
  {
    id: 'chevron-red-burst',
    name: 'Red Dynamic Arrowheads',
    category: 'scatter',
    width: 90,
    height: 90,
    anim: 'none',
    duration: '1.9s',
    color1: '#ef4444',
    color2: '#10b981',
    glow: '#f87171',
    fill: '#ef4444',
    strokeWidth: 0,
    svg: `<polygon class="part-p1" points="40,32 58,45 40,58" fill="COLOR_1"/>
<polygon class="part-p2" points="20,24 28,30 20,36" fill="COLOR_1" opacity="0.8"/>
<polygon class="part-p3" points="66,60 74,66 66,72" fill="COLOR_2"/>
<polygon class="part-p4" points="26,68 32,73 26,78" fill="COLOR_1"/>`
  },

  // 9. GOLD STAR DUST
  {
    id: 'particle-gold-dust',
    name: 'Gold Star Dust Scatter',
    category: 'particle',
    width: 90,
    height: 90,
    anim: 'anim-twinkle',
    duration: '2s',
    color1: '#fbbf24',
    color2: '#f59e0b',
    glow: '#f59e0b',
    fill: '#fbbf24',
    strokeWidth: 0,
    svg: `<polygon class="part-p1" points="25,20 27,25 32,25 28,28 30,33 25,30 20,33 22,28 18,25 23,25" fill="COLOR_1"/>
<polygon class="part-p2" points="65,22 66,25 70,25 67,27 68,31 65,29 62,31 63,27 60,25 64,25" fill="COLOR_2"/>
<polygon class="part-p3" points="45,60 47,65 52,65 48,68 50,73 45,70 40,73 42,68 38,65 43,65" fill="COLOR_1"/>
<circle class="part-p4" cx="70" cy="65" r="2.5" fill="COLOR_2"/>
<circle class="part-p1" cx="20" cy="60" r="2" fill="COLOR_1"/>`
  },

  // 10. FIREWORK BLAST
  {
    id: 'firework-radial-blast',
    name: 'Firework Particle Blast',
    category: 'firework',
    width: 90,
    height: 90,
    anim: 'anim-burst',
    duration: '2s',
    color1: '#f43f5e',
    color2: '#00f0ff',
    glow: '#f43f5e',
    fill: '#f43f5e',
    strokeWidth: 2,
    svg: `<circle cx="45" cy="45" r="3" fill="COLOR_1"/>
<circle class="part-p1" cx="25" cy="25" r="2.5" fill="COLOR_2"/>
<circle class="part-p2" cx="65" cy="25" r="2.5" fill="COLOR_1"/>
<circle class="part-p3" cx="65" cy="65" r="2.5" fill="COLOR_2"/>
<circle class="part-p4" cx="25" cy="65" r="2.5" fill="COLOR_1"/>
<line x1="45" y1="20" x2="45" y2="12" stroke="COLOR_1" stroke-width="2" stroke-linecap="round"/>
<line x1="70" y1="45" x2="78" y2="45" stroke="COLOR_2" stroke-width="2" stroke-linecap="round"/>
<line x1="45" y1="70" x2="45" y2="78" stroke="COLOR_1" stroke-width="2" stroke-linecap="round"/>
<line x1="20" y1="45" x2="12" y2="45" stroke="COLOR_2" stroke-width="2" stroke-linecap="round"/>`
  },

  // 11. GLOWING NEON CIRCLE
  {
    id: 'neon-circle-glow',
    name: 'Glowing Neon Circle',
    category: 'mix',
    width: 90,
    height: 90,
    anim: 'anim-pulse',
    duration: '2s',
    color1: '#00b0ff',
    color2: '#0081cb',
    glow: '#00b0ff',
    fill: '#00b0ff',
    strokeWidth: 3,
    svg: `<circle cx="45" cy="45" r="28" fill="COLOR_1" stroke="COLOR_2" stroke-width="3"/>`
  },

  // 12. PULSING BADGE HEXAGON
  {
    id: 'pulsing-badge-hex',
    name: 'Pulsing Badge Hexagon',
    category: 'mix',
    width: 90,
    height: 90,
    anim: 'anim-pulse',
    duration: '1.8s',
    color1: '#a855f7',
    color2: '#7e22ce',
    glow: '#c084fc',
    fill: '#a855f7',
    strokeWidth: 3,
    svg: `<polygon points="45,15 72,30 72,60 45,75 18,60 18,30" fill="COLOR_1" stroke="COLOR_2" stroke-width="3"/>`
  },

  // 13. ROTATING STAR FLOWER
  {
    id: 'rotating-star-flower',
    name: 'Rotating Star Flower',
    category: 'mix',
    width: 90,
    height: 90,
    anim: 'anim-spin',
    duration: '3.6s',
    color1: '#f59e0b',
    color2: '#d97706',
    glow: '#fbbf24',
    fill: '#f59e0b',
    strokeWidth: 2,
    svg: `<polygon points="45,12 53,32 75,32 58,46 64,68 45,54 26,68 32,46 15,32 37,32" fill="COLOR_1" stroke="COLOR_2" stroke-width="2"/>`
  },

  // 14. BOUNCING DIAMOND CARD
  {
    id: 'bouncing-diamond-card',
    name: 'Bouncing Diamond Card',
    category: 'mix',
    width: 90,
    height: 90,
    anim: 'anim-bounce',
    duration: '1.6s',
    color1: '#ec4899',
    color2: '#db2777',
    glow: '#f472b6',
    fill: '#ec4899',
    strokeWidth: 3,
    svg: `<rect x="25" y="25" width="40" height="40" rx="8" transform="rotate(45 45 45)" fill="COLOR_1" stroke="COLOR_2" stroke-width="3"/>`
  },

  // 15. RIPPLE RADAR TARGET
  {
    id: 'ripple-radar-target',
    name: 'Ripple Radar Target',
    category: 'mix',
    width: 90,
    height: 90,
    anim: 'anim-radar',
    duration: '2.2s',
    color1: '#10b981',
    color2: '#059669',
    glow: '#34d399',
    fill: '#10b981',
    strokeWidth: 2.5,
    svg: `<circle cx="45" cy="45" r="9" fill="COLOR_1"/>
<circle class="anim-dash-flow" cx="45" cy="45" r="22" fill="none" stroke="COLOR_1" stroke-width="2.5" stroke-dasharray="6 4"/>
<circle cx="45" cy="45" r="34" fill="none" stroke="COLOR_1" stroke-width="1.5" opacity="0.6"/>`
  },

  // 16. COSMIC RINGS ORBIT (Background)
  {
    id: 'cosmic-orbit-bg',
    name: 'Cosmic Rings Orbit',
    category: 'background',
    width: 100,
    height: 100,
    anim: 'anim-spin',
    duration: '6s',
    color1: '#6366f1',
    color2: '#06b6d4',
    glow: '#6366f1',
    fill: 'none',
    strokeWidth: 2,
    svg: `<ellipse cx="50" cy="50" rx="42" ry="18" fill="none" stroke="COLOR_1" stroke-width="2" stroke-dasharray="8 6" class="anim-dash-flow"/>
<ellipse cx="50" cy="50" rx="18" ry="42" fill="none" stroke="COLOR_2" stroke-width="2" stroke-dasharray="8 6" class="anim-dash-flow-fast"/>
<circle cx="50" cy="50" r="10" fill="COLOR_1" opacity="0.8"/>`
  },

  // 17. CHEVRON FLOW TRANSITION (Transition)
  {
    id: 'wave-chevron-transition',
    name: 'Chevron Flow Transition',
    category: 'transition',
    width: 120,
    height: 40,
    anim: 'none',
    duration: '1.8s',
    color1: '#00f0ff',
    color2: '#a855f7',
    glow: '#00f0ff',
    fill: 'none',
    strokeWidth: 3,
    svg: `<path class="part-p1" d="M 20 8 L 36 20 L 20 32" fill="none" stroke="COLOR_1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path class="part-p2" d="M 52 8 L 68 20 L 52 32" fill="none" stroke="COLOR_2" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
<path class="part-p3" d="M 84 8 L 100 20 L 84 32" fill="none" stroke="COLOR_1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
  },

  // 18. ZIGZAG LIGHTNING LINE
  {
    id: 'zigzag-lightning-line',
    name: 'Zigzag Lightning Flow',
    category: 'line',
    width: 110,
    height: 45,
    anim: 'anim-pulse',
    duration: '1.5s',
    color1: '#eab308',
    color2: '#f97316',
    glow: '#eab308',
    fill: 'none',
    strokeWidth: 3.5,
    svg: `<path class="anim-dash-flow-fast" d="M 10 22 L 32 8 L 52 36 L 74 12 L 100 24" fill="none" stroke="COLOR_1" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="10 6"/>`
  },

  // 19. SPARKLE CROSS CONSTELLATION
  {
    id: 'sparkle-cross-scatter',
    name: 'Sparkle Cross Stars',
    category: 'scatter',
    width: 90,
    height: 90,
    anim: 'anim-twinkle',
    duration: '2s',
    color1: '#38bdf8',
    color2: '#f472b6',
    glow: '#38bdf8',
    fill: 'none',
    strokeWidth: 2.5,
    svg: `<path class="part-p1" d="M 25 15 L 25 35 M 15 25 L 35 25" stroke="COLOR_1" stroke-width="2.5" stroke-linecap="round"/>
<path class="part-p2" d="M 68 20 L 68 36 M 60 28 L 76 28" stroke="COLOR_2" stroke-width="2.5" stroke-linecap="round"/>
<path class="part-p3" d="M 45 55 L 45 75 M 35 65 L 55 65" stroke="COLOR_1" stroke-width="3" stroke-linecap="round"/>
<circle class="part-p4" cx="72" cy="65" r="3" fill="COLOR_2"/>`
  },

  // 20. HYPNOTIC SPIRAL VORTEX
  {
    id: 'hypnotic-spiral-vortex',
    name: 'Hypnotic Spiral Vortex',
    category: 'mix',
    width: 90,
    height: 90,
    anim: 'anim-spin',
    duration: '4s',
    color1: '#ec4899',
    color2: '#8b5cf6',
    glow: '#ec4899',
    fill: 'none',
    strokeWidth: 2.5,
    svg: `<circle class="anim-dash-flow" cx="45" cy="45" r="36" fill="none" stroke="COLOR_1" stroke-width="3" stroke-dasharray="16 8"/>
<circle class="anim-dash-flow-rev" cx="45" cy="45" r="24" fill="none" stroke="COLOR_2" stroke-width="2.5" stroke-dasharray="12 6"/>
<circle class="anim-dash-flow" cx="45" cy="45" r="12" fill="none" stroke="COLOR_1" stroke-width="2" stroke-dasharray="8 4"/>`
  }
];

/* =========================================================================
   3. LEGACY STARBURST PRESETS (Backward Compatibility)
   ========================================================================= */
export const STARBURST_PRESETS = [
  {
    id: 'starburst-1',
    name: 'Starburst 1 (Pink/Red Spin)',
    shapeType: 'starburst1',
    category: 'starburst',
    layers: 1,
    defaultColor: '#ff47ab',
    hoverColor: '#ff0000',
    defaultTextColor: '#ffffff',
    hoverTextColor: '#ffffff',
    text: 'NEW\nCSS3\nStarbursts!',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    width: 96,
    height: 96,
    rotation: -22.5,
    hoverRotation: -45,
    borderRadius: 0,
    hoverBorderRadius: 0,
    textShadow: '0 0 3em #f00, 0 0 4px #88004a',
    hoverTextShadow: '0 0 20px #fff, 0 0 8px #fff',
  },
  {
    id: 'starburst-2',
    name: 'Starburst 2 (Yellow/Orange Spin)',
    shapeType: 'starburst2',
    category: 'starburst',
    layers: 2,
    defaultColor: '#ffee00',
    hoverColor: '#ffaa00',
    defaultTextColor: '#000000',
    hoverTextColor: '#ffffff',
    text: 'NEW\nCSS3\nStarbursts!',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    width: 96,
    height: 96,
    rotation: -45,
    hoverRotation: 315,
    borderRadius: 0,
    hoverBorderRadius: 0,
    textShadow: '0 0 3em #f00, 0 0 4px #f30',
    hoverTextShadow: '0 0 20px #fff, 0 0 8px #fff',
  },
  {
    id: 'starburst-3',
    name: 'Starburst 3 (Cyan/Green Badge)',
    shapeType: 'starburst3',
    category: 'starburst',
    layers: 8,
    defaultColor: '#00f4b2',
    hoverColor: '#00e530',
    defaultTextColor: '#000000',
    hoverTextColor: '#000000',
    text: 'NEW\nCSS3\nStarbursts!',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    width: 96,
    height: 96,
    rotation: -67.5,
    hoverRotation: -67.5,
    borderRadius: 0,
    hoverBorderRadius: 0,
    textShadow: '0 0 3em #04b3df, 0 0 4px #0077e5',
    hoverTextShadow: '0 0 3em #04b3df, 0 0 4px #0077e5',
  },
  {
    id: 'starburst-4',
    name: 'Starburst 4 (Morphing Blue Flower)',
    shapeType: 'starburst4',
    category: 'starburst',
    layers: 4,
    defaultColor: '#78d7ff',
    hoverColor: '#0088ff',
    defaultTextColor: '#000000',
    hoverTextColor: '#ffffff',
    text: 'NEW\nCSS3\nStarbursts!',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    width: 96,
    height: 96,
    rotation: -67.5,
    hoverRotation: -67.5,
    borderRadius: 40,
    hoverBorderRadius: 0,
    textShadow: '-1px -1px 1px #fff, 1px 1px 1px #00f',
    hoverTextShadow: '0 0 20px #fff, 0 0 8px #fff',
  },
  {
    id: 'starburst-5',
    name: 'Starburst 5 (Purple Cosmic Twister)',
    shapeType: 'starburst5',
    category: 'starburst',
    layers: 7,
    defaultColor: '#7e00df',
    hoverColor: '#9333ea',
    defaultTextColor: '#ffffff',
    hoverTextColor: '#ffffff',
    text: 'NEW\nCSS3\nStarbursts!',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    width: 96,
    height: 96,
    rotation: -56.5,
    hoverRotation: 11.25,
    borderRadius: 0,
    hoverBorderRadius: 0,
    textShadow: '0 0 3em #04b3df, 0 0 4px #ff0',
    hoverTextShadow: '0 0 3em #04b3df, 0 0 4px #ff0',
  }
];

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'line', label: 'Line' },
  { id: 'particle', label: 'Particle' },
  { id: 'scatter', label: 'Scatter' },
  { id: 'firework', label: 'Firework' },
  { id: 'mix', label: 'Mix' },
  { id: 'background', label: 'Background' },
  { id: 'transition', label: 'Transition' },
  { id: 'starburst', label: 'Starburst' }
];

/* =========================================================================
   4. SVG GENERATORS FOR EDITOR CANVAS INSERTION
   ========================================================================= */

// Legacy Starburst Generator
export const generateStarburstSvg = (preset, uniqueId = Date.now(), withTransform = false) => {
  const transformAttr = withTransform ? ' transform="translate(60, 60)"' : '';
  const foWidth = preset.width;
  const foHeight = preset.height;

  const buildNestedSpans = (count, textContent) => {
    const formattedText = textContent.replace(/\n/g, '<br/>');
    let inner = formattedText;
    for (let i = 0; i < count; i++) {
      inner = `<span>${inner}</span>`;
    }
    return inner;
  };

  const nestedHtml = buildNestedSpans(preset.layers, preset.text);

  const scopedCss = `
    #decorator-${uniqueId} .sb-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      box-sizing: border-box;
    }
    #decorator-${uniqueId} a.${preset.shapeType} {
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${preset.width}px;
      height: ${preset.height}px;
      background: var(--sb-color, ${preset.defaultColor});
      text-align: center;
      text-decoration: none;
      color: var(--sb-text-color, ${preset.defaultTextColor});
      font-weight: ${preset.fontWeight};
      font-family: '${preset.fontFamily}', Arial, sans-serif;
      font-size: ${preset.fontSize}px;
      line-height: 1.2em;
      position: relative;
      cursor: pointer;
      box-sizing: border-box;
      text-shadow: ${preset.textShadow};
      border-radius: var(--sb-radius, ${preset.borderRadius}px);
      transition: all 0.4s ease;
      transform: rotate(var(--sb-rot, ${preset.rotation}deg));
    }
    #decorator-${uniqueId} a.${preset.shapeType} span {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: var(--sb-color, ${preset.defaultColor});
      color: inherit;
      border-radius: var(--sb-radius, ${preset.borderRadius}px);
      transition: all 0.4s ease;
      box-sizing: border-box;
    }
    ${preset.shapeType === 'starburst1' ? `
      #decorator-${uniqueId} a.starburst1 span { transform: rotate(45deg); }
      #decorator-${uniqueId}:hover a.starburst1, #decorator-${uniqueId}.is-hovered a.starburst1 {
        background: var(--sb-hover-color, ${preset.hoverColor});
        color: var(--sb-hover-text-color, ${preset.hoverTextColor});
        transform: rotate(var(--sb-hover-rot, ${preset.hoverRotation}deg));
        text-shadow: ${preset.hoverTextShadow};
      }
      #decorator-${uniqueId}:hover a.starburst1 span, #decorator-${uniqueId}.is-hovered a.starburst1 span {
        background: var(--sb-hover-color, ${preset.hoverColor});
        color: var(--sb-hover-text-color, ${preset.hoverTextColor});
        text-shadow: ${preset.hoverTextShadow};
      }
    ` : ''}
    ${preset.shapeType === 'starburst2' ? `
      #decorator-${uniqueId} a.starburst2 span { transform: rotate(22.5deg); }
      #decorator-${uniqueId}:hover a.starburst2, #decorator-${uniqueId}.is-hovered a.starburst2 {
        background: var(--sb-hover-color, ${preset.hoverColor});
        color: var(--sb-hover-text-color, ${preset.hoverTextColor});
        transform: rotate(var(--sb-hover-rot, ${preset.hoverRotation}deg));
        text-shadow: ${preset.hoverTextShadow};
      }
      #decorator-${uniqueId}:hover a.starburst2 span, #decorator-${uniqueId}.is-hovered a.starburst2 span {
        background: var(--sb-hover-color, ${preset.hoverColor});
        color: var(--sb-hover-text-color, ${preset.hoverTextColor});
        text-shadow: ${preset.hoverTextShadow};
      }
    ` : ''}
    ${preset.shapeType === 'starburst3' ? `
      #decorator-${uniqueId} a.starburst3 span { transform: rotate(11.25deg); }
      #decorator-${uniqueId}:hover a.starburst3, #decorator-${uniqueId}.is-hovered a.starburst3 {
        background: var(--sb-hover-color, ${preset.hoverColor});
        color: var(--sb-hover-text-color, ${preset.hoverTextColor});
        transform: rotate(var(--sb-hover-rot, ${preset.hoverRotation}deg)) scale(1.05);
        text-shadow: ${preset.hoverTextShadow};
      }
      #decorator-${uniqueId}:hover a.starburst3 span, #decorator-${uniqueId}.is-hovered a.starburst3 span {
        background: var(--sb-hover-color, ${preset.hoverColor});
        color: var(--sb-hover-text-color, ${preset.hoverTextColor});
        text-shadow: ${preset.hoverTextShadow};
      }
    ` : ''}
    ${preset.shapeType === 'starburst4' ? `
      #decorator-${uniqueId} a.starburst4 span { transform: rotate(22.5deg); }
      #decorator-${uniqueId}:hover a.starburst4, #decorator-${uniqueId}.is-hovered a.starburst4 { background: transparent; }
      #decorator-${uniqueId}:hover a.starburst4 span, #decorator-${uniqueId}.is-hovered a.starburst4 span {
        background: var(--sb-hover-color, ${preset.hoverColor});
        color: var(--sb-hover-text-color, ${preset.hoverTextColor});
        border-radius: var(--sb-hover-radius, ${preset.hoverBorderRadius}px);
        text-shadow: ${preset.hoverTextShadow};
      }
    ` : ''}
    ${preset.shapeType === 'starburst5' ? `
      #decorator-${uniqueId} a.starburst5 span { transform: rotate(-45deg); }
      #decorator-${uniqueId}:hover a.starburst5, #decorator-${uniqueId}.is-hovered a.starburst5 {
        background: var(--sb-hover-color, ${preset.hoverColor});
      }
      #decorator-${uniqueId}:hover a.starburst5 span, #decorator-${uniqueId}.is-hovered a.starburst5 span {
        transform: rotate(var(--sb-hover-rot, ${preset.hoverRotation}deg));
      }
    ` : ''}
  `;

  return `
    <g id="decorator-${uniqueId}" data-type="decorator" data-decorator-preset="${preset.id}" data-shape-type="${preset.shapeType}" data-layers="${preset.layers}" data-color="${preset.defaultColor}" data-hover-color="${preset.hoverColor}" data-text-color="${preset.defaultTextColor}" data-hover-text-color="${preset.hoverTextColor}" data-font-family="${preset.fontFamily}" data-font-size="${preset.fontSize}" data-font-weight="${preset.fontWeight}" data-text="${encodeURIComponent(preset.text)}" data-radius="${preset.borderRadius}" data-hover-radius="${preset.hoverBorderRadius}" data-rotation="${preset.rotation}" data-hover-rotation="${preset.hoverRotation}" cursor="pointer"${transformAttr}>
      <style>
        ${scopedCss}
      </style>
      <foreignObject x="0" y="0" width="${foWidth}" height="${foHeight}">
        <div xmlns="http://www.w3.org/1999/xhtml" class="sb-container">
          <a href="javascript:void(0)" class="${preset.shapeType}">
            ${nestedHtml}
          </a>
        </div>
      </foreignObject>
      <rect x="0" y="0" width="${foWidth}" height="${foHeight}" fill="transparent" pointer-events="all" />
    </g>
  `;
};

// Universal Animated Decorator Generator (Shapes, Lines, Particles & Starbursts)
export const generateDecoratorSvg = (preset, uniqueId = Date.now(), withTransform = false) => {
  if (preset.shapeType && preset.shapeType.startsWith('starburst')) {
    return generateStarburstSvg(preset, uniqueId, withTransform);
  }

  const transformAttr = withTransform ? ' transform="translate(60, 60)"' : '';
  const foWidth = preset.width || 100;
  const foHeight = preset.height || 100;
  const col1 = preset.color1 || preset.fill || '#00e5ff';
  const col2 = preset.color2 || '#818cf8';
  const glowCol = preset.glow || col1;
  const animClass = preset.anim && preset.anim !== 'none' ? preset.anim : '';
  const duration = preset.duration || '2s';
  const fillVal = preset.fill || 'none';
  const strokeW = preset.strokeWidth !== undefined ? preset.strokeWidth : 3;

  let rawSvg = preset.svg
    .replace(/COLOR_1/g, col1)
    .replace(/COLOR_2/g, col2);

  const scopedCss = `
    @keyframes kf-dash-flow { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -120; } }
    @keyframes kf-dash-flow-rev { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 120; } }
    @keyframes kf-dash-flow-fast { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -180; } }
    @keyframes kf-float-sway { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-12px) rotate(3deg); } }
    @keyframes kf-pulse-glow { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px var(--glow-c, ${glowCol})); } 50% { transform: scale(1.14); filter: drop-shadow(0 0 16px var(--glow-c, ${glowCol})); } }
    @keyframes kf-infinite-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes kf-spring-bounce { 0%, 100% { transform: translateY(0); } 35% { transform: translateY(-22px); } 60% { transform: translateY(3px); } }
    @keyframes kf-radar-ping { 0% { transform: scale(0.6); opacity: 1; } 80%, 100% { transform: scale(1.4); opacity: 0; } }
    @keyframes kf-chevron-burst-1 { 0%, 100% { transform: translate(0, 0) scale(0.9); opacity: 0.7; } 50% { transform: translate(14px, -18px) scale(1.15); opacity: 1; } }
    @keyframes kf-chevron-burst-2 { 0%, 100% { transform: translate(0, 0) scale(0.85); opacity: 0.6; } 50% { transform: translate(-16px, 16px) scale(1.1); opacity: 1; } }
    @keyframes kf-chevron-burst-3 { 0%, 100% { transform: translate(0, 0) scale(0.9); opacity: 0.7; } 50% { transform: translate(-14px, -14px) scale(1.2); opacity: 1; } }
    @keyframes kf-chevron-burst-4 { 0%, 100% { transform: translate(0, 0) scale(0.95); opacity: 0.7; } 50% { transform: translate(16px, 14px) scale(1.25); opacity: 1; } }
    @keyframes kf-scatter-twinkle { 0%, 100% { transform: scale(0.7) rotate(0deg); opacity: 0.35; } 50% { transform: scale(1.2) rotate(180deg); opacity: 1; } }
    @keyframes kf-firework-burst { 0% { transform: scale(0.2); opacity: 0; } 40% { opacity: 1; } 80%, 100% { transform: scale(1.35); opacity: 0; } }
    @keyframes kf-arcs-expand { 0%, 100% { transform: scale(0.88); opacity: 0.6; } 50% { transform: scale(1.22); opacity: 1; } }
    @keyframes kf-color-cycle { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }

    #decorator-${uniqueId} .anim-dash-flow { animation: kf-dash-flow 1.8s infinite linear !important; }
    #decorator-${uniqueId} .anim-dash-flow-fast { animation: kf-dash-flow-fast 1.3s infinite linear !important; }
    #decorator-${uniqueId} .anim-dash-flow-rev { animation: kf-dash-flow-rev 1.8s infinite linear !important; }
    #decorator-${uniqueId} .anim-float { animation: kf-float-sway ${duration} infinite ease-in-out; transform-origin: center; transform-box: fill-box; }
    #decorator-${uniqueId} .anim-pulse { animation: kf-pulse-glow ${duration} infinite ease-in-out; transform-origin: center; transform-box: fill-box; }
    #decorator-${uniqueId} .anim-spin { animation: kf-infinite-spin ${duration} infinite linear; transform-origin: center; transform-box: fill-box; }
    #decorator-${uniqueId} .anim-bounce { animation: kf-spring-bounce ${duration} infinite cubic-bezier(0.28, 0.84, 0.42, 1); transform-origin: center; transform-box: fill-box; }
    #decorator-${uniqueId} .anim-radar { animation: kf-radar-ping ${duration} infinite cubic-bezier(0.215, 0.61, 0.355, 1); transform-origin: center; transform-box: fill-box; }
    #decorator-${uniqueId} .anim-twinkle { animation: kf-scatter-twinkle ${duration} infinite ease-in-out; transform-origin: center; transform-box: fill-box; }
    #decorator-${uniqueId} .anim-burst { animation: kf-firework-burst ${duration} infinite cubic-bezier(0.165, 0.84, 0.44, 1); transform-origin: center; transform-box: fill-box; }
    #decorator-${uniqueId} .anim-arcs { animation: kf-arcs-expand ${duration} infinite ease-in-out; transform-origin: center; transform-box: fill-box; }
    #decorator-${uniqueId} .anim-chroma { animation: kf-color-cycle ${duration} infinite linear; }

    #decorator-${uniqueId} .part-p1 { animation: kf-chevron-burst-1 2s infinite ease-in-out; transform-origin: center; transform-box: fill-box; }
    #decorator-${uniqueId} .part-p2 { animation: kf-chevron-burst-2 2.2s infinite ease-in-out 0.2s; transform-origin: center; transform-box: fill-box; }
    #decorator-${uniqueId} .part-p3 { animation: kf-chevron-burst-3 2.4s infinite ease-in-out 0.4s; transform-origin: center; transform-box: fill-box; }
    #decorator-${uniqueId} .part-p4 { animation: kf-chevron-burst-4 2.1s infinite ease-in-out 0.1s; transform-origin: center; transform-box: fill-box; }
  `;

  return `
    <g id="decorator-${uniqueId}" data-type="decorator" data-decorator-preset="${preset.id}" data-category="${preset.category || 'line'}" data-color1="${col1}" data-color2="${col2}" data-fill="${fillVal}" data-stroke="${col2}" data-stroke-width="${strokeW}" data-dash="preserve" data-glow-blur="8" data-glow-color="${glowCol}" data-anim="${preset.anim || 'none'}" data-duration="${parseFloat(duration) || 2}" data-delay="0" data-direction="normal" data-loop="infinite" data-title="${preset.name}" data-vw="${foWidth}" data-vh="${foHeight}" cursor="pointer"${transformAttr}>
      <style>
        ${scopedCss}
      </style>
      <g class="motion-content ${animClass}" style="--glow-c: ${glowCol}; animation-duration: ${duration};">
        ${rawSvg}
      </g>
      <rect x="0" y="0" width="${foWidth}" height="${foHeight}" fill="transparent" pointer-events="all" />
    </g>
  `;
};

/* =========================================================================
   5. ANIMATED DECORATORS COMPONENT (Sidebar Palette View)
   ========================================================================= */
const AnimatedDecorators = ({ isFullView }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combined library containing both new Animated Shapes/Lines and Starbursts
  const allLibrary = useMemo(() => {
    return [...ANIMATED_SHAPES_PRESETS, ...STARBURST_PRESETS];
  }, []);

  // Filtered presets based on search query and category
  const filteredPresets = useMemo(() => {
    return allLibrary.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [allLibrary, activeCategory, searchQuery]);

  // Mixed category presets curated for the 2-row collapsed preview (2 columns x 2 rows = 4 items)
  const overviewMixedPresets = useMemo(() => {
    const pickLine = ANIMATED_SHAPES_PRESETS.find((p) => p.id === 'running-neon-line');
    const pickParticle = ANIMATED_SHAPES_PRESETS.find((p) => p.id === 'chevron-burst-purple');
    const pickFirework = ANIMATED_SHAPES_PRESETS.find((p) => p.id === 'firework-radial-blast');
    const pickMix = ANIMATED_SHAPES_PRESETS.find((p) => p.id === 'ripple-radar-target');
    return [pickLine, pickParticle, pickFirework, pickMix].filter(Boolean);
  }, []);

  const displayPresets = isFullView ? filteredPresets : overviewMixedPresets;

  const handleDragStart = (e, preset) => {
    const uniqueId = Date.now();
    const svgCode = generateDecoratorSvg(preset, uniqueId, false);

    e.dataTransfer.setData(
      'application/x-flipbook-element',
      JSON.stringify({
        type: 'decorator',
        svgContent: svgCode
      })
    );
    e.dataTransfer.setData('text/plain', 'decorator');
  };

  const handleClick = (preset) => {
    const uniqueId = Date.now();
    const svgCode = generateDecoratorSvg(preset, uniqueId, true);

    window.dispatchEvent(
      new CustomEvent('add-element-to-editor', {
        detail: { svgContent: svgCode }
      })
    );
  };

  return (
    <div className="w-full flex flex-col gap-[0.8vw]">
      {/* Full View Search & Category Controls */}
      {isFullView && (
        <div className="flex flex-col gap-[0.6vw] mb-[0.2vw]">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 w-[0.85vw] h-[0.85vw]" />
            <input
              type="text"
              placeholder="Search animated shapes & lines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-[2vw] pr-[0.8vw] py-[0.45vw] text-[0.75vw] bg-gray-50 border border-gray-200 rounded-[0.4vw] outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-[0.35vw] flex-wrap">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-[0.6vw] py-[0.25vw] text-[0.68vw] font-medium rounded-[0.35vw] transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preset Grid */}
      <div className={`w-full grid ${isFullView ? 'grid-cols-3 gap-[0.7vw]' : 'grid-cols-2 gap-[0.6vw]'}`}>
        {displayPresets.map((preset) => {
          const isStarburst = preset.shapeType && preset.shapeType.startsWith('starburst');
          const pWidth = preset.width || 90;
          const pHeight = preset.height || 90;

          return (
            <div
              key={preset.id}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, preset)}
              onClick={() => handleClick(preset)}
              className="group relative flex flex-col items-center justify-between p-[0.4vw] bg-white border border-gray-200 rounded-[0.5vw] hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer select-none overflow-hidden"
              title={`Click or Drag to add ${preset.name}`}
            >
              {/* Checkered Transparency Tile with Live Micro Animation */}
              <div className="w-full aspect-square checker-pattern rounded-[0.35vw] flex items-center justify-center p-[0.3vw] overflow-hidden relative border border-gray-100">
                {isStarburst ? (
                  // Starburst Badge Preview
                  <div
                    className="transform scale-[0.6] origin-center transition-transform group-hover:scale-[0.68]"
                    style={{
                      '--sb-color': preset.defaultColor,
                      '--sb-hover-color': preset.hoverColor,
                      '--sb-text-color': preset.defaultTextColor,
                      '--sb-hover-text-color': preset.hoverTextColor
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: `
                          <style>
                            .thumb-${preset.id} a.${preset.shapeType} {
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              width: ${preset.width}px;
                              height: ${preset.height}px;
                              background: ${preset.defaultColor};
                              text-align: center;
                              color: ${preset.defaultTextColor};
                              font-weight: bold;
                              font-family: Arial, sans-serif;
                              font-size: ${preset.fontSize}px;
                              line-height: 1.2em;
                              position: relative;
                              transform: rotate(${preset.rotation}deg);
                              border-radius: ${preset.borderRadius}px;
                              box-shadow: 0 4px 10px rgba(0,0,0,0.12);
                            }
                            .thumb-${preset.id} a.${preset.shapeType} span {
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              width: 100%;
                              height: 100%;
                              background: ${preset.defaultColor};
                              border-radius: ${preset.borderRadius}px;
                              ${preset.shapeType === 'starburst1' ? 'transform: rotate(45deg);' : ''}
                              ${preset.shapeType === 'starburst2' ? 'transform: rotate(22.5deg);' : ''}
                              ${preset.shapeType === 'starburst3' ? 'transform: rotate(11.25deg);' : ''}
                              ${preset.shapeType === 'starburst4' ? 'transform: rotate(22.5deg); border-radius: 40px;' : ''}
                              ${preset.shapeType === 'starburst5' ? 'transform: rotate(-45deg);' : ''}
                            }
                          </style>
                          <div class="thumb-${preset.id}">
                            <a class="${preset.shapeType}">
                              ${(() => {
                                let str = (preset.text || '').replace(/\n/g, '<br/>');
                                for (let i = 0; i < (preset.layers || 1); i++) str = `<span>${str}</span>`;
                                return str;
                              })()}
                            </a>
                          </div>
                        `
                      }}
                    />
                  </div>
                ) : (
                  // Live Animated SVG Shape / Line Preview
                  <div className="w-full h-full flex items-center justify-center pointer-events-none transform transition-transform duration-300 group-hover:scale-110">
                    <svg
                      viewBox={`0 0 ${pWidth} ${pHeight}`}
                      className={`w-full h-full ${preset.anim && preset.anim !== 'none' ? preset.anim : ''}`}
                      style={{
                        animationDuration: preset.duration || '2s',
                        '--glow-c': preset.glow || preset.color1
                      }}
                      dangerouslySetInnerHTML={{
                        __html: preset.svg
                          .replace(/COLOR_1/g, preset.color1)
                          .replace(/COLOR_2/g, preset.color2)
                      }}
                    />
                  </div>
                )}

              </div>

              {/* Card Label and Category */}
              <div className="w-full mt-[0.3vw] px-[0.2vw] flex items-center justify-between">
                <span className="text-[0.68vw] font-medium text-gray-700 group-hover:text-indigo-600 truncate max-w-[80%]">
                  {preset.name.replace(/ \(.*\)/, '')}
                </span>
                <span className="text-[0.55vw] text-indigo-500 font-semibold uppercase bg-indigo-50 px-[0.25vw] py-[0.05vw] rounded">
                  {preset.category || 'fx'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {displayPresets.length === 0 && (
        <div className="w-full py-[2vw] text-center text-gray-400 text-[0.8vw]">
          No animated presets found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default AnimatedDecorators;
