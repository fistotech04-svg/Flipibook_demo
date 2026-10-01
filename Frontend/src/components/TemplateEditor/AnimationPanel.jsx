import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { Icon } from '@iconify/react';
import {
  Sparkles,
  ChevronDown,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  X,
  Replace,
  ScanEye
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                CONSTANTS                                   */
/* -------------------------------------------------------------------------- */

const ANIMATION_VARIANTS = {
  'none': {},
  'fade-in': { initial: { opacity: 0 }, animate: { opacity: 1 } },
  'fade-out': { initial: { opacity: 1 }, animate: { opacity: 0 } },
  'slide-up': { initial: { y: 100, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  'slide-down': { initial: { y: -100, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  'slide-left': { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 } },
  'slide-right': { initial: { x: -100, opacity: 0 }, animate: { x: 0, opacity: 1 } },
  'back-in-up': { initial: { y: 500, scale: 0.7, opacity: 0 }, animate: { y: 0, scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 100 } },
  'back-in-down': { initial: { y: -500, scale: 0.7, opacity: 0 }, animate: { y: 0, scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 100 } },
  'back-in-left': { initial: { x: -500, scale: 0.7, opacity: 0 }, animate: { x: 0, scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 100 } },
  'back-in-right': { initial: { x: 500, scale: 0.7, opacity: 0 }, animate: { x: 0, scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 100 } },
  'zoom-in': { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
  'zoom-in-up': { initial: { scale: 0.1, y: 100, opacity: 0 }, animate: { scale: 1, y: 0, opacity: 1 } },
  'zoom-in-down': { initial: { scale: 0.1, y: -100, opacity: 0 }, animate: { scale: 1, y: 0, opacity: 1 } },
  'zoom-out': { initial: { scale: 1, opacity: 1 }, animate: { scale: 0, opacity: 0 } },
  'rotate-in': { initial: { rotate: -200, opacity: 0, scale: 0 }, animate: { rotate: 0, opacity: 1, scale: 1 } },
  'rotate-in-down-left': { initial: { rotate: -45, transformOrigin: 'left bottom', opacity: 0 }, animate: { rotate: 0, opacity: 1 } },
  'rotate-in-up-right': { initial: { rotate: -90, transformOrigin: 'right bottom', opacity: 0 }, animate: { rotate: 0, opacity: 1 } },
  'bounce-in': { initial: { scale: 0.3, opacity: 0 }, animate: { scale: [0.3, 1.1, 0.9, 1.03, 0.97, 1], opacity: 1 }, transition: { duration: 0.75 } },
  'bounce-out': { initial: { scale: 1, opacity: 1 }, animate: { scale: [1, 0.97, 1.03, 0.9, 1.1, 0.3], opacity: 0 }, transition: { duration: 0.75 } },
  'flip-in': { initial: { rotateX: -90, opacity: 0 }, animate: { rotateX: 0, opacity: 1 }, transition: { duration: 0.4 } },
  'flip-in-y': { initial: { rotateY: -90, opacity: 0 }, animate: { rotateY: 0, opacity: 1 }, transition: { duration: 0.4 } },
  'roll-in': { initial: { x: -100, rotate: -120, opacity: 0 }, animate: { x: 0, rotate: 0, opacity: 1 } },
  'pulse': { animate: { scale: [1, 1.1, 1] }, transition: { repeat: Infinity, duration: 1 } },
  'tada': { animate: { scale: [1, 0.9, 0.9, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1], rotate: [0, -3, -3, 3, -3, 3, -3, 3, -3, 0] }, transition: { repeat: Infinity, duration: 1 } },
  'rubber-band': { animate: { scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1], scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1] }, transition: { repeat: Infinity, duration: 2 } },
  'jello': { animate: { skewX: [0, -12.5, 6.25, -3.125, 1.5625, -0.78125, 0.390625, -0.1953125, 0], skewY: [0, -12.5, 6.25, -3.125, 1.5625, -0.78125, 0.390625, -0.1953125, 0] }, transition: { repeat: Infinity, duration: 2 } },
  'heartbeat': { animate: { scale: [1, 1.3, 1, 1.3, 1] }, transition: { repeat: Infinity, duration: 1.3, ease: "easeInOut" } },
  'glitch': { animate: { x: [0, -2, 2, -2, 2, 0], y: [0, 1, -1, 1, -1, 0], filter: ["none", "hue-rotate(90deg)", "hue-rotate(-90deg)", "none"] }, transition: { repeat: Infinity, duration: 0.2 } },
  'blur-in': { initial: { filter: "blur(20px)", opacity: 0 }, animate: { filter: "blur(0px)", opacity: 1 } },
  'focus-in': { initial: { filter: "blur(12px)", opacity: 0, scale: 1.2 }, animate: { filter: "blur(0px)", opacity: 1, scale: 1 } },
  'neon-glow': { animate: { textShadow: ["0 0 4px #4f46e5", "0 0 15px #4f46e5", "0 0 4px #4f46e5"], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }, transition: { repeat: Infinity, duration: 1.5 } },
  'swing': { animate: { rotate: [0, 15, -10, 5, -5, 0] }, transition: { repeat: Infinity, duration: 2 } },
  'wobble': { animate: { x: [0, -25, 20, -15, 10, -5, 0], rotate: [0, -5, 3, -3, 2, -1, 0] }, transition: { repeat: Infinity, duration: 2 } },
  'float': { animate: { y: [0, -15, 0] }, transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
  'perspective-in': { initial: { rotateX: -60, opacity: 0, z: -500 }, animate: { rotateX: 0, opacity: 1, z: 0 }, transition: { duration: 1, type: "spring" } },
  'glass-reveal': { initial: { opacity: 0, backdropFilter: "blur(20px)" }, animate: { opacity: 1, backdropFilter: "blur(0px)" }, transition: { duration: 1.5 } },
};

/* -------------------------------------------------------------------------- */
/*                                WAAPI DEFINITIONS                           */
/* -------------------------------------------------------------------------- */

const WAAPI_ANIMATIONS = {
  'none': [],
  'fade-in': [{ opacity: 0 }, { opacity: 1 }],
  'fade-out': [{ opacity: 1 }, { opacity: 0 }],
  'blur-in': [{ filter: 'blur(20px)', opacity: 0 }, { filter: 'blur(0)', opacity: 1 }],
  'focus-in': [{ filter: 'blur(12px)', opacity: 0, scale: 1.2 }, { filter: 'blur(0)', opacity: 1, scale: 1 }],
  'glass-reveal': [{ opacity: 0, backdropFilter: 'blur(20px)' }, { opacity: 1, backdropFilter: 'blur(0px)' }],
  'perspective-in': [{ transform: 'perspective(400px) rotateX(-60deg) translateZ(-500px)', opacity: 0 }, { transform: 'perspective(400px) rotateX(0deg) translateZ(0)', opacity: 1 }],
  'slide-up': [{ translate: '0 100px', opacity: 0 }, { translate: '0 0', opacity: 1 }],
  'slide-down': [{ translate: '0 -100px', opacity: 0 }, { translate: '0 0', opacity: 1 }],
  'slide-left': [{ translate: '100px 0', opacity: 0 }, { translate: '0 0', opacity: 1 }],
  'slide-right': [{ translate: '-100px 0', opacity: 0 }, { translate: '0 0', opacity: 1 }],
  'back-in-up': [{ translate: '0 500px', scale: 0.7, opacity: 0 }, { translate: '0 0', scale: 0.7, opacity: 0.7, offset: 0.8 }, { translate: '0 0', scale: 1, opacity: 1 }],
  'back-in-down': [{ translate: '0 -500px', scale: 0.7, opacity: 0 }, { translate: '0 0', scale: 0.7, opacity: 0.7, offset: 0.8 }, { translate: '0 0', scale: 1, opacity: 1 }],
  'back-in-left': [{ translate: '-500px 0', scale: 0.7, opacity: 0 }, { translate: '0 0', scale: 0.7, opacity: 0.7, offset: 0.8 }, { translate: '0 0', scale: 1, opacity: 1 }],
  'back-in-right': [{ translate: '500px 0', scale: 0.7, opacity: 0 }, { translate: '0 0', scale: 0.7, opacity: 0.7, offset: 0.8 }, { translate: '0 0', scale: 1, opacity: 1 }],
  'zoom-in': [{ scale: 0, opacity: 0 }, { scale: 1, opacity: 1 }],
  'zoom-out': [{ scale: 1, opacity: 1 }, { scale: 0, opacity: 0 }],
  'zoom-in-up': [{ translate: '0 100px', scale: 0.1, opacity: 0 }, { translate: '0 0', scale: 1, opacity: 1 }],
  'zoom-in-down': [{ translate: '0 -100px', scale: 0.1, opacity: 0 }, { translate: '0 0', scale: 1, opacity: 1 }],
  'rotate-in': [{ rotate: '-200deg', scale: 0, opacity: 0 }, { rotate: '0deg', scale: 1, opacity: 1 }],
  'rotate-in-down-left': [{ rotate: '-45deg', transformOrigin: 'left bottom', opacity: 0 }, { rotate: '0deg', transformOrigin: 'left bottom', opacity: 1 }],
  'rotate-in-up-right': [{ rotate: '-90deg', transformOrigin: 'right bottom', opacity: 0 }, { rotate: '0deg', transformOrigin: 'right bottom', opacity: 1 }],
  'bounce-in': [{ scale: 0.3, opacity: 0 }, { scale: 1.1, opacity: 0.8, offset: 0.5 }, { scale: 0.9, opacity: 1, offset: 0.7 }, { scale: 1, opacity: 1 }],
  'bounce-out': [{ scale: 1, opacity: 1 }, { scale: 1.1, opacity: 0.8, offset: 0.2 }, { scale: 0.3, opacity: 0, offset: 1 }],
  'flip-in': [{ transform: 'perspective(400px) rotateX(90deg)', opacity: 0 }, { transform: 'perspective(400px) rotateX(0deg)', opacity: 1 }],
  'flip-in-y': [{ transform: 'perspective(400px) rotateY(90deg)', opacity: 0 }, { transform: 'perspective(400px) rotateY(0deg)', opacity: 1 }],
  'roll-in': [{ translate: '-100px 0', rotate: '-120deg', opacity: 0 }, { translate: '0 0', rotate: '0deg', opacity: 1 }],
  'pulse': [{ scale: 1 }, { scale: 1.1, offset: 0.5 }, { scale: 1 }],
  'heartbeat': [{ scale: 1 }, { scale: 1.3, offset: 0.14 }, { scale: 1, offset: 0.28 }, { scale: 1.3, offset: 0.42 }, { scale: 1, offset: 0.7 }],
  'float': [{ translate: '0 0' }, { translate: '0 -15px', offset: 0.5 }, { translate: '0 0' }],
  'neon-glow': [{ filter: 'brightness(1) drop-shadow(0 0 0px rgba(79, 70, 229, 0))' }, { filter: 'brightness(1.5) drop-shadow(0 0 10px rgba(79, 70, 229, 0.8))', offset: 0.5 }, { filter: 'brightness(1) drop-shadow(0 0 0px rgba(79, 70, 229, 0))' }],
  'tada': [{ scale: 1, rotate: '0deg' }, { scale: 0.9, rotate: '-3deg', offset: 0.1 }, { scale: 0.9, rotate: '-3deg', offset: 0.2 }, { scale: 1.1, rotate: '3deg', offset: 0.3 }, { scale: 1.1, rotate: '-3deg', offset: 0.4 }, { scale: 1.1, rotate: '3deg', offset: 0.5 }, { scale: 1.1, rotate: '-3deg', offset: 0.6 }, { scale: 1.1, rotate: '3deg', offset: 0.7 }, { scale: 1.1, rotate: '-3deg', offset: 0.8 }, { scale: 1.1, rotate: '3deg', offset: 0.9 }, { scale: 1, rotate: '0deg' }],
  'rubber-band': [{ scale: '1 1' }, { scale: '1.25 0.75', offset: 0.3 }, { scale: '0.75 1.25', offset: 0.4 }, { scale: '1.15 0.85', offset: 0.5 }, { scale: '0.95 1.05', offset: 0.65 }, { scale: '1.05 0.95', offset: 0.75 }, { scale: '1 1' }],
  'jello': [{ skew: '0,0' }, { skew: '-12.5deg, -12.5deg', offset: 0.22 }, { skew: '6.25deg, 6.25deg', offset: 0.33 }, { skew: '-3.125deg, -3.125deg', offset: 0.44 }, { skew: '1.5625deg, 1.5625deg', offset: 0.55 }, { skew: '-0.78deg, -0.78deg', offset: 0.66 }, { skew: '0.39deg, 0.39deg', offset: 0.77 }, { skew: '-0.2deg, -0.2deg', offset: 0.88 }, { skew: '0,0' }],
  'swing': [{ rotate: '0deg' }, { rotate: '15deg', offset: 0.2 }, { rotate: '-10deg', offset: 0.4 }, { rotate: '5deg', offset: 0.6 }, { rotate: '-5deg', offset: 0.8 }, { rotate: '0deg' }],
  'wobble': [{ translate: '0 0', rotate: '0deg' }, { translate: '-25% 0', rotate: '-5deg', offset: 0.15 }, { translate: '20% 0', rotate: '3deg', offset: 0.3 }, { translate: '-15% 0', rotate: '-3deg', offset: 0.45 }, { translate: '10% 0', rotate: '2deg', offset: 0.6 }, { translate: '-5% 0', rotate: '-1deg', offset: 0.75 }, { translate: '0 0', rotate: '0deg' }],
  'glitch': [{ translate: '0' }, { translate: '-2px 2px', offset: 0.2 }, { translate: '2px -2px', offset: 0.4 }, { translate: '-2px 2px', offset: 0.6 }, { translate: '2px -2px', offset: 0.8 }, { translate: '0' }],
};

const ANIMATION_GALLERY_ITEMS = [
  { id: 'none', label: 'None', icon: 'None' },
  { id: 'fade-in', label: 'Fade In', icon: 'Bars' },
  { id: 'fade-out', label: 'Fade Out', icon: 'Bars' },
  { id: 'zoom-in', label: 'Zoom In', icon: 'Circle' },
  { id: 'zoom-out', label: 'Zoom Out', icon: 'Circle' },
  { id: 'rotate-in', label: 'Rotate In', icon: 'Circle' },
  { id: 'blur-in', label: 'Blur In', icon: 'Bars' },
  { id: 'slide-up', label: 'Slide Up', icon: 'Bars' },
  { id: 'slide-down', label: 'Slide Down', icon: 'Bars' },
  { id: 'slide-left', label: 'Slide Left', icon: 'Bars' },
  { id: 'slide-right', label: 'Slide Right', icon: 'Bars' },
  { id: 'flip-in', label: 'Flip X', icon: 'Bars' },
  { id: 'flip-in-y', label: 'Flip Y', icon: 'Bars' },
  { id: 'bounce-in', label: 'Bounce In', icon: 'Circle' },
  { id: 'bounce-out', label: 'Bounce Out', icon: 'Circle' },
  { id: 'pulse', label: 'Pulse', icon: 'Circle' },
];

const EASING_OPTIONS = [
  'Linear',
  'Smooth',
  'Ease In',
  'Ease Out',
  'Ease In & Out',
  'Bounce'
];

/* -------------------------------------------------------------------------- */
/*                                SUB-COMPONENTS                              */
/* -------------------------------------------------------------------------- */

const SliderControl = React.memo(({ label, value, onChange, min = 0, max = 10, step = 0.1, unit = '' }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-[0.25vw] w-full">
      <span className="text-[0.7vw] font-medium text-gray-800">{label} :</span>
      <div className="flex items-center gap-[0.5vw] w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 cursor-pointer custom-range-slider"
          style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${percentage}%, #E2E8F0 ${percentage}%, #E2E8F0 100%)` }}
        />
        <span className="text-[0.7vw] font-medium text-gray-800 w-[1.5vw] text-right">{value}{unit}</span>
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                        SINGLE ELEMENT EDITOR                               */
/* -------------------------------------------------------------------------- */

const SingleAnimationEditor = ({ element, elements, onUpdate, onDelete, onOpenGallery, previewAnimation, ANIMATION_GALLERY_ITEMS, EASING_OPTIONS }) => {
  const [showEasingSelector, setShowEasingSelector] = React.useState(false);
  const [showRepeatSelector, setShowRepeatSelector] = React.useState(false);
  const [showTriggerSelector, setShowTriggerSelector] = React.useState(false);

  const primaryElement = element || (elements && elements[0]);
  const targetList = elements || (() => {
    if (!element) return [];
    const multiSelect = Array.from(document.querySelectorAll('.is-selected'));
    if (multiSelect.length > 1 && multiSelect.some(el => el.id === element.id || el.getAttribute('data-name') === (element.getAttribute('data-name') || element.id))) {
      return multiSelect;
    }
    return [element];
  })();

  const [trigger, setTrigger] = React.useState(primaryElement.getAttribute('data-animation-trigger') || 'While Opening');
  const [action, setAction] = React.useState(primaryElement.getAttribute('data-animation-action') || 'Click');
  const [showActionSelector, setShowActionSelector] = React.useState(false);

  const getPrefix = (t) => (t === 'While Opening' ? 'open' : 'interact');

  const [settings, setSettings] = React.useState({
    type: primaryElement.getAttribute(`data-animation-${getPrefix(trigger)}-type`) || 'none',
    delay: parseFloat(primaryElement.getAttribute(`data-animation-${getPrefix(trigger)}-delay`)) || 0,
    duration: parseFloat(primaryElement.getAttribute(`data-animation-${getPrefix(trigger)}-duration`)) || 1,
    easing: primaryElement.getAttribute(`data-animation-${getPrefix(trigger)}-easing`) || 'Linear',
    repeat: primaryElement.getAttribute(`data-animation-${getPrefix(trigger)}-repeat`) || 'None',
    everyVisit: primaryElement.getAttribute(`data-animation-${getPrefix(trigger)}-every-visit`) !== 'false'
  });

  React.useEffect(() => {
    const t = primaryElement.getAttribute('data-animation-trigger') || 'While Opening';
    const p = getPrefix(t);
    setTrigger(t);
    setAction(primaryElement.getAttribute('data-animation-action') || 'Click');
    setSettings({
      type: primaryElement.getAttribute(`data-animation-${p}-type`) || 'none',
      delay: parseFloat(primaryElement.getAttribute(`data-animation-${p}-delay`)) || 0,
      duration: parseFloat(primaryElement.getAttribute(`data-animation-${p}-duration`)) || 1,
      easing: primaryElement.getAttribute(`data-animation-${p}-easing`) || 'Linear',
      repeat: primaryElement.getAttribute(`data-animation-${p}-repeat`) || 'None',
      everyVisit: primaryElement.getAttribute(`data-animation-${p}-every-visit`) !== 'false'
    });
  }, [primaryElement]);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    const prefix = getPrefix(trigger);
    const attr = `data-animation-${prefix}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;

    targetList.forEach(el => {
      let target = el;
      if (target && !document.body.contains(target)) {
        const id = target.id || target.getAttribute('data-name');
        if (id) {
          const activePage = document.querySelector('.active-page-outline') || document.querySelector('.page-svg-container');
          const fresh = activePage?.querySelector(`[id="${id}"], [data-name="${id}"]`) || document.getElementById(id);
          if (fresh) target = fresh;
        }
      }
      target.setAttribute(attr, String(value));
      target.setAttribute('data-animation-trigger', trigger);
      if (trigger === 'On Page') {
        target.setAttribute('data-animation-action', action || 'Click');
        target.style.pointerEvents = 'auto';
        if ((action || 'Click') === 'Click') target.style.cursor = 'pointer';
      }
      target.setAttribute('data-animation-intent', 'true');
      if (onUpdate) {
        onUpdate(target.id || target.getAttribute('data-name'), attr, value);
        onUpdate(target.id || target.getAttribute('data-name'), 'data-animation-trigger', trigger);
        onUpdate(target.id || target.getAttribute('data-name'), 'data-animation-intent', 'true');
        if (trigger === 'On Page') {
          onUpdate(target.id || target.getAttribute('data-name'), 'data-animation-action', action || 'Click');
        }
      }
    });
  };

  const handleTriggerChange = (newTrigger) => {
    const oldPrefix = getPrefix(trigger);
    const newPrefix = getPrefix(newTrigger);
    setTrigger(newTrigger);

    // Refresh local settings to match the new prefix
    setSettings({
      type: primaryElement.getAttribute(`data-animation-${newPrefix}-type`) || 'none',
      delay: parseFloat(primaryElement.getAttribute(`data-animation-${newPrefix}-delay`)) || 0,
      duration: parseFloat(primaryElement.getAttribute(`data-animation-${newPrefix}-duration`)) || 1,
      easing: primaryElement.getAttribute(`data-animation-${newPrefix}-easing`) || 'Linear',
      repeat: primaryElement.getAttribute(`data-animation-${newPrefix}-repeat`) || 'None',
      everyVisit: primaryElement.getAttribute(`data-animation-${newPrefix}-every-visit`) !== 'false'
    });

    targetList.forEach(el => {
      let target = el;
      if (target && !document.body.contains(target)) {
        const id = target.id || target.getAttribute('data-name');
        const activePage = document.querySelector('.active-page-outline') || document.querySelector('.page-svg-container');
        const fresh = activePage?.querySelector(`[id="${id}"], [data-name="${id}"]`) || document.getElementById(id);
        if (fresh) target = fresh;
      }

      // Migrate settings if the new namespace is empty
      const currentNewType = target.getAttribute(`data-animation-${newPrefix}-type`);
      if (!currentNewType || currentNewType === 'none') {
        const oldType = target.getAttribute(`data-animation-${oldPrefix}-type`);
        if (oldType && oldType !== 'none') {
          ['type', 'delay', 'duration', 'easing', 'repeat', 'every-visit'].forEach(k => {
            const attrName = `data-animation-${newPrefix}-${k}`;
            const val = target.getAttribute(`data-animation-${oldPrefix}-${k}`);
            if (val) {
              target.setAttribute(attrName, val);
              if (onUpdate) onUpdate(target.id || target.getAttribute('data-name'), attrName, val);
            }
          });
        }
      }

      target.setAttribute('data-animation-trigger', newTrigger);
      if (newTrigger === 'On Page') {
        const currentAction = target.getAttribute('data-animation-action') || action || 'Click';
        target.setAttribute('data-animation-action', currentAction);
        target.style.pointerEvents = 'auto';
        if (currentAction === 'Click') target.style.cursor = 'pointer';
        if (onUpdate) onUpdate(target.id || target.getAttribute('data-name'), 'data-animation-action', currentAction);
      } else {
        target.style.pointerEvents = '';
        target.style.cursor = '';
      }
      target.setAttribute('data-animation-intent', 'true');
      if (onUpdate) {
        onUpdate(target.id || target.getAttribute('data-name'), 'data-animation-trigger', newTrigger);
        onUpdate(target.id || target.getAttribute('data-name'), 'data-animation-intent', 'true');
      }
    });
    setShowTriggerSelector(false);
  };

  const handleActionChange = (newAction) => {
    setAction(newAction);
    targetList.forEach(el => {
      let target = el;
      if (target && !document.body.contains(target)) {
        const id = target.id || target.getAttribute('data-name');
        const activePage = document.querySelector('.active-page-outline') || document.querySelector('.page-svg-container');
        const fresh = activePage?.querySelector(`[id="${id}"], [data-name="${id}"]`) || document.getElementById(id);
        if (fresh) target = fresh;
      }
      target.setAttribute('data-animation-action', newAction);
      target.setAttribute('data-animation-intent', 'true');

      // Ensure interactive elements are receptive to pointer events
      if (newAction === 'Click' || newAction === 'Hover') {
        target.style.pointerEvents = 'auto';
        if (newAction === 'Click') target.style.cursor = 'pointer';
      }

      if (onUpdate) {
        onUpdate(target.id || target.getAttribute('data-name'), 'data-animation-action', newAction);
        onUpdate(target.id || target.getAttribute('data-name'), 'data-animation-intent', 'true');
      }
    });
    setShowActionSelector(false);
  };

  const handleDelete = () => {
    targetList.forEach(el => {
      let target = el;
      if (target && !document.body.contains(target)) {
        const id = target.id || target.getAttribute('data-name');
        const activePage = document.querySelector('.active-page-outline') || document.querySelector('.page-svg-container');
        const fresh = activePage?.querySelector(`[id="${id}"], [data-name="${id}"]`) || document.getElementById(id);
        if (fresh) target = fresh;
      }
      const attrsToRemove = Array.from(target.attributes)
        .map(a => a.name)
        .filter(name => name.startsWith('data-animation-') && name !== 'data-animation-group');
      attrsToRemove.forEach(a => {
        target.removeAttribute(a);
        if (onUpdate) onUpdate(target.id || target.getAttribute('data-name'), a, null);
      });
      target.removeAttribute('data-animation-intent');
      if (onUpdate) onUpdate(target.id || target.getAttribute('data-name'), 'data-animation-intent', null);

      // Clear inline styles that might have been left over by WAAPI animations
      if (target.__currentAnimation) {
        try { target.__currentAnimation.cancel(); } catch(err) {}
        target.__currentAnimation = null;
      }
    });
    setSettings({ type: 'none', delay: 0, duration: 1, easing: 'Linear', repeat: 'None', everyVisit: true });
    if (onDelete) {
      onDelete(targetList);
    }
  };

  const galleryItem = ANIMATION_GALLERY_ITEMS.find(a => a.id === settings.type);

  return (
    <div className="flex flex-col gap-[0.75vw]">
      {/* Top Dropdowns & Preview */}
      <div className="flex gap-[0.75vw]">
        <div className="flex-1 relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowTriggerSelector(!showTriggerSelector); setShowActionSelector(false); }}
            className="w-full h-[2.5vw] flex items-center justify-between px-[0.75vw] bg-gray-100 border border-gray-100 rounded-[0.75vw] hover:bg-gray-100 transition-colors group"
          >
            <span className="text-[0.75vw] font-medium text-gray-600 truncate">{trigger}</span>
            <ArrowRightLeft size="0.75vw" className="text-gray-500 group-hover:rotate-180 transition-transform duration-500" />
          </button>
          {showTriggerSelector && (
            <div className="absolute top-full left-0 w-full mt-[0.5vw] bg-white border border-gray-200 rounded-[0.75vw] shadow-xl z-30 py-[0.25vw] overflow-hidden">
              {['While Opening', 'On Page'].map(t => (
                <button key={t} onClick={() => handleTriggerChange(t)} className="w-full text-center px-[1vw] py-[0.65vw] text-[0.75vw] font-medium text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors">
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {trigger === 'On Page' && (
          <div className="flex-1 relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowActionSelector(!showActionSelector); setShowTriggerSelector(false); }}
              className="w-full h-[2.5vw] flex items-center justify-between px-[0.75vw] bg-gray-100/50 border border-gray-100 rounded-[0.75vw] hover:bg-gray-100 transition-colors group"
            >
              <span className="text-[0.75vw] font-medium text-gray-600 truncate">{action}</span>
              <ArrowRightLeft size="0.75vw" className="text-gray-400 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            {showActionSelector && (
              <div className="absolute top-full left-0 w-full mt-[0.5vw] bg-white border border-gray-100 rounded-[0.75vw] shadow-xl z-30 py-[0.25vw] overflow-hidden">
                {['Click', 'Hover', 'Always'].map(a => (
                  <button key={a} onClick={() => handleActionChange(a)} className="w-full text-center px-[1vw] py-[0.65vw] text-[0.75vw] font-medium text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors">
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={(e) => {
            if (elements) {
              elements.forEach(target => {
                previewAnimation(e, settings.type, settings, target, true);
              });
            } else {
              previewAnimation(e, settings.type, settings, primaryElement);
            }
          }}
          className="w-[2.5vw] h-[2.5vw] flex items-center justify-center bg-indigo-50 border border-indigo-600 rounded-[0.75vw] text-indigo-600 shadow-sm hover:bg-indigo-200 transition-colors flex-shrink-0"
          title="Preview Animation"
        >
          <ScanEye size="1vw" />
        </button>
      </div>

      <div className="flex gap-[1vw] items-center">
        {/* Style Preview Card */}
        <div
          className="anim-panel-preview-card w-[5.8vw] h-[7vw] relative group rounded-[0.8vw] overflow-hidden border border-gray-200 bg-white shadow-[0_0.05vw_0.4vw_rgba(0,0,0,0.04)] hover:shadow-xs transition-all duration-300 flex-shrink-0 flex flex-col"
        >
          <div className="flex-1 relative w-full flex items-center justify-center">
            <div
              onClick={(e) => {
                e.stopPropagation();
                onOpenGallery(primaryElement, (newType) => {
                  updateSetting('type', newType);
                });
              }}
              className="anim-panel-replace-btn absolute top-[0.5vw] right-[0.5vw] w-[1.75vw] h-[1.75vw] rounded-[0.4vw] flex items-center justify-center cursor-pointer transition-all duration-200 z-20 group-hover:bg-white group-hover:shadow-sm"
              title="Replace Animation"
            >
              <Icon icon="ph:arrows-left-right" width="0.85vw" height="0.85vw" className="text-gray-400 group-hover:text-gray-900 transition-colors overlay:hidden" />
            </div>
            <div className="pt-[1.5vw] group-hover:opacity-40 transition-opacity duration-100 relative z-0">
              {galleryItem?.icon === 'None' ? (
                <Icon icon="radix-icons:shadow-none" width="2vw" height="2vw" className="text-gray-500" />
              ) : galleryItem?.icon === 'Circle' ? (
                <Icon icon="game-icons:glass-ball" width="2vw" height="2vw" className="text-gray-700" />
              ) : (
                <div className="anim-panel-bars flex items-end gap-[0.375vw]">
                  <div className="anim-panel-bar w-[0.625vw] h-[1.75vw] bg-gray-300 rounded-[0.05vw]" />
                  <div className="anim-panel-bar w-[0.625vw] h-[1.75vw] bg-gray-400 rounded-[0.05vw]" />
                  <div className="anim-panel-bar w-[0.625vw] h-[1.75vw] bg-gray-600 rounded-[0.05vw]" />
                </div>
              )}
            </div>
          </div>
          <div className="h-[0.05vw] w-full bg-gray-100 relative z-0" />
          <div className="h-[2.25vw] w-full flex items-center justify-center bg-white relative z-0">
            <span className="text-[0.6vw] font-medium text-gray-500 truncate px-[0.5vw]">{galleryItem?.label || 'None'}</span>
          </div>
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-300 transition-opacity duration-300 pointer-events-none z-10" />
        </div>

        {/* Sliders */}
        <div className="flex-1 space-y-[0.5vw]">
          <SliderControl label="Delay" value={settings.delay} onChange={(v) => updateSetting('delay', v)} unit="s" max={10} />
          <SliderControl label="Duration" value={settings.duration} onChange={(v) => updateSetting('duration', v)} unit="s" max={10} />
        </div>
      </div>

      {/* Easing Dropdown */}
      <div className="flex items-center justify-between ">
        <span className="text-[0.7vw] font-medium text-gray-800 ml-[0.3vw] leading-none">Easing Effects :</span>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowEasingSelector(!showEasingSelector); setShowRepeatSelector(false); }}
            className="flex items-center justify-between px-[0.75vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.5vw] hover:bg-gray-50 transition-colors group w-[8.5vw]"
          >
            <span className="text-[0.75vw] font-medium text-gray-600 truncate">{settings.easing}</span>
            <ChevronDown size="0.85vw" className={`text-gray-400 transition-transform duration-300 ${showEasingSelector ? 'rotate-180' : ''}`} />
          </button>
          {showEasingSelector && (
            <div className="absolute bottom-full left-0 w-full mb-[0.5vw] bg-white border border-gray-100 rounded-[0.75vw] shadow-xl z-30 py-[0.25vw] overflow-visible">
              {EASING_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => { updateSetting('easing', opt); setShowEasingSelector(false); }}
                  className="w-full text-center overflow-visible px-[1vw] py-[0.65vw] text-[0.75vw] font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Repeat Dropdown */}
      {trigger === 'On Page' && action !== 'Always' && (
        <div className="flex items-center justify-between">
          <span className="text-[0.7vw] font-medium text-gray-800 ml-[0.3vw] leading-none">Repeat :</span>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowRepeatSelector(!showRepeatSelector); setShowEasingSelector(false); }}
              className="flex items-center justify-between px-[0.75vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.5vw] hover:bg-gray-50 transition-colors group w-[8.5vw]"
            >
              <span className="text-[0.75vw] font-medium text-gray-600 truncate">
                {['None', 'Once', 'Twice', 'Thrice', 'Infinite'].includes(settings.repeat || 'None') ? (settings.repeat || 'None') : `${settings.repeat} times`}
              </span>
              <ChevronDown size="0.85vw" className={`text-gray-400 transition-transform duration-300 ${showRepeatSelector ? 'rotate-180' : ''}`} />
            </button>
            {showRepeatSelector && (
              <div className="absolute bottom-full left-0 w-full mb-[0.5vw] bg-white border border-gray-100 rounded-[0.75vw] shadow-xl z-30 py-[0.25vw] overflow-visible">
                {['None', 'Once', 'Twice', 'Thrice', 'Infinite'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => { updateSetting('repeat', opt); setShowRepeatSelector(false); }}
                    className="w-full text-center overflow-visible px-[1vw] py-[0.65vw] text-[0.75vw] font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                  >
                    {opt}
                  </button>
                ))}
                <div className="px-[1vw] py-[0.5vw] flex items-center justify-center gap-[0.5vw] border-t border-gray-100 mt-[0.25vw] pt-[0.5vw]" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    min="1"
                    placeholder="Custom"
                    className="w-[3.5vw] border border-gray-200 rounded-[0.3vw] px-[0.4vw] py-[0.2vw] text-[0.75vw] text-center text-gray-600 outline-none focus:border-indigo-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={!['None', 'Once', 'Twice', 'Thrice', 'Infinite'].includes(settings.repeat || 'None') ? (settings.repeat || '') : ''}
                    onChange={(e) => updateSetting('repeat', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setShowRepeatSelector(false); }}
                  />
                  <span className="text-[0.7vw] text-gray-500 font-medium">times</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex flex-col pt-[0.25vw] mt-[0.75vw] border-t border-gray-100 -mx-[1vw] px-[1vw] gap-[0.5vw]">
        {/* Animate in Every Visit Divider */}
        <div className="h-[1px] w-full bg-gray-200 mt-[0.25vw] mb-[0.25vw]"></div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-[0.5vw] ml-[0.3vw] cursor-pointer group">
            <div className={`w-[1vw] h-[1vw] rounded-[0.2vw] flex items-center justify-center transition-all ${settings.everyVisit ? 'bg-indigo-600 border-indigo-600' : 'border border-gray-300 bg-white'}`}>
              {settings.everyVisit && <Icon icon="lucide:check" width="0.7vw" height="0.7vw" className="text-white" />}
            </div>
            <input type="checkbox" className="hidden" checked={settings.everyVisit} onChange={() => updateSetting('everyVisit', !settings.everyVisit)} />
            <span className="text-[0.7vw] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Animate in Every Visit</span>
          </label>
          <button onClick={handleDelete} className="text-red-400 hover:text-red-500 transition-colors p-[0.25vw]">
            <Icon icon="lucide:trash-2" width="1vw" height="1vw" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                             MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

const AnimationPanel = ({ selectedElement, onUpdate }) => {
  const [animatableElements, setAnimatableElements] = React.useState([]);
  const [expandedElementId, setExpandedElementId] = React.useState(null);
  const [editingNameId, setEditingNameId] = React.useState(null);
  const [tempName, setTempName] = React.useState('');

  const scrollContainerRef = React.useRef(null);
  const itemRefs = React.useRef({});

  const [showGallery, setShowGallery] = React.useState(false);
  const [tempSelectedAnim, setTempSelectedAnim] = React.useState(null);
  const [editingElement, setEditingElement] = React.useState(null);
  const [galleryCallback, setGalleryCallback] = React.useState(null);

  const [forceIncludeIds, setForceIncludeIds] = React.useState(new Set());
  const previewCleanupRef = React.useRef([]);
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [previewMaxTime, setPreviewMaxTime] = React.useState(0);
  const [previewKey, setPreviewKey] = React.useState(0);

  // Stop and cancel all active WAAPI animations when the Animation panel is closed / unmounted
  React.useEffect(() => {
    return () => {
      // 1. Run all registered preview cleanup functions
      if (previewCleanupRef.current && previewCleanupRef.current.length > 0) {
        previewCleanupRef.current.forEach(cancel => {
          try { cancel(); } catch (_) { }
        });
        previewCleanupRef.current = [];
      }
      // 2. Also cancel any other active WAAPI animations inside the page SVG containers 
      //    to ensure the canvas is completely clean when leaving the Animation tab.
      document.querySelectorAll('.page-svg-container *').forEach(el => {
        try {
          const anims = el.getAnimations?.() || [];
          anims.forEach(anim => {
            try { anim.cancel(); } catch (_) { }
          });
          el.removeAttribute('data-is-animating');
          if (el.__currentAnimation) el.__currentAnimation = null;
          if (el.__shadowAnimation) el.__shadowAnimation = null;
        } catch (_) { }
      });
    };
  }, []);


  React.useEffect(() => {
    // Robust discovery of the SVG root for the active page
    let activePage = document.querySelector('.active-page-outline');
    let svgRoot = selectedElement?.closest ? selectedElement.closest('svg') : null;

    if (!svgRoot) {
      if (activePage) svgRoot = activePage.querySelector('svg');
      if (!svgRoot) svgRoot = document.querySelector('.flipbook-page-active svg') || document.querySelector('.page-svg-container svg') || document.querySelector('svg');
    }

    if (!svgRoot) return;

    const els = Array.from(svgRoot.querySelectorAll('[data-name], [id]')).filter(el => {
      const tag = el.tagName?.toLowerCase();
      return !['svg', 'defs', 'clippath', 'pattern', 'lineargradient', 'radialgradient', 'filter', 'style', 'script'].includes(tag);
    });

    const visibleEls = els.filter(el => !el.closest('defs') && !el.closest('clipPath'));

    let relevantEls = visibleEls.filter(el => {
      const id = el.id || el.getAttribute('data-name');
      const hasAnim = el.getAttribute('data-animation-open-type') && el.getAttribute('data-animation-open-type') !== 'none';
      const hasIntent = el.getAttribute('data-animation-intent') === 'true';
      const isForced = id && forceIncludeIds.has(id);
      return hasAnim || hasIntent || isForced;
    });

    if (selectedElement) {
      const id = selectedElement.id || selectedElement.getAttribute('data-name');
      const hasAnim = selectedElement.getAttribute('data-animation-open-type') && selectedElement.getAttribute('data-animation-open-type') !== 'none';
      const hasIntent = selectedElement.getAttribute('data-animation-intent') === 'true';
      const isForced = id && forceIncludeIds.has(id);

      if (hasAnim || hasIntent || isForced) {
        const isAlreadyInList = relevantEls.some(el => el === selectedElement || (id && (el.id === id || el.getAttribute('data-name') === id)));
        if (!isAlreadyInList) {
          relevantEls = [selectedElement, ...relevantEls];
        }
      }
    }

    const uniqueEls = [];
    const seenIds = new Set();
    relevantEls.forEach(el => {
      const id = el.id || el.getAttribute('data-name');
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        uniqueEls.push(el);
      } else if (!id && !uniqueEls.includes(el)) {
        uniqueEls.push(el);
      }
    });
    setAnimatableElements(uniqueEls);

    if (selectedElement) {
      const id = selectedElement.id || selectedElement.getAttribute('data-name');
      if (id) {
        const group = selectedElement.getAttribute('data-animation-group');
        const targetId = group || id;
        if (expandedElementId !== targetId) {
          setExpandedElementId(targetId);
        }
      }
    }
  }, [selectedElement, forceIncludeIds]);

  // Force re-render when DOM attributes change (sync with Canvas Tooltip)
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!selectedElement) return;
    const observer = new MutationObserver(() => setTick(t => t + 1));
    observer.observe(selectedElement, { attributes: true });
    return () => observer.disconnect();
  }, [selectedElement]);

  // Handle auto-scroll to center when an item is expanded
  React.useEffect(() => {
    if (expandedElementId && itemRefs.current[expandedElementId] && scrollContainerRef.current) {
      const element = itemRefs.current[expandedElementId];

      // Use setTimeout to allow the element's height to expand before calculating center
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [expandedElementId]);

  const previewAnimation = React.useCallback((e, type, settings, elementToAnimate, isGlobal = false) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!elementToAnimate) return;

    let target = elementToAnimate;
    if (target && !document.body.contains(target)) {
      const id = target.id || target.getAttribute('data-name');
      if (id) {
        const activePage = document.querySelector('.active-page-outline') || document.querySelector('.page-svg-container');
        const fresh = activePage?.querySelector(`[id="${id}"], [data-name="${id}"]`) || document.getElementById(id);
        if (fresh) target = fresh;
      }
    }

    if (!isGlobal && previewCleanupRef.current && previewCleanupRef.current.length > 0) {
      previewCleanupRef.current.forEach(cancel => cancel());
      previewCleanupRef.current = [];
    }

    const keyframes = WAAPI_ANIMATIONS[type];
    if (!type || !keyframes || keyframes.length === 0) return;

    // Helper: Map Easing
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

    const LOOP_ANIMATIONS = ['pulse', 'tada', 'rubber-band', 'jello', 'heartbeat', 'glitch', 'neon-glow', 'swing', 'wobble', 'float'];
    const action = target.getAttribute('data-animation-action');
    const isLoop = LOOP_ANIMATIONS.includes(type) || action === 'Always' || settings?.repeat === 'Infinite';
    const duration = (parseFloat(settings?.duration || 1)) * 1000;
    const delay = (parseFloat(settings?.delay || 0)) * 1000;
    const easing = getWaapiEase(settings?.easing || 'Linear');
    let cx = 0, cy = 0;
    let useMathOrigin = false;
    let cachedBBox = { x: 0, y: 0, width: 0, height: 0 };
    const isSVG = target.namespaceURI === 'http://www.w3.org/2000/svg' || target.ownerSVGElement !== undefined;
    if (isSVG) {
      try {
        cachedBBox = target.getBBox();
        cx = cachedBBox.x + cachedBBox.width / 2;
        cy = cachedBBox.y + cachedBBox.height / 2;
        useMathOrigin = true;
        target.style.transformOrigin = '0 0';
      } catch (e) {
        target.style.transformBox = 'fill-box';
        target.style.transformOrigin = 'center';
      }
    }

    try {
      // Cancel previous on this specific target
      if (target.__currentAnimation) {
        try { target.__currentAnimation.cancel(); } catch (err) { }
      }

      if (target.__originalTransform === undefined) {
        let baseTransform = window.getComputedStyle(target).transform;
        if (!baseTransform || baseTransform === 'none') {
          const transformAttr = target.getAttribute('transform');
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
            } catch (e) { }
          }
        }
        target.__originalTransform = (!baseTransform || baseTransform === 'none') ? '' : baseTransform;
      }

      const baseTransform = target.__originalTransform;

      const finalKeyframes = keyframes.map(kf => {
        const newKf = { ...kf };

        let transformParts = [];
        if (newKf.translate) {
          transformParts.push(`translate(${String(newKf.translate).split(' ').join(',')})`);
          delete newKf.translate;
        }
        if (newKf.rotate) {
          const r = String(newKf.rotate).trim();
          transformParts.push(`rotate(${r === '0' ? '0deg' : r})`);
          delete newKf.rotate;
        }
        if (newKf.scale !== undefined) {
          transformParts.push(`scale(${String(newKf.scale).split(' ').join(',')})`);
          delete newKf.scale;
        }
        if (newKf.skew) {
          const parts = String(newKf.skew).split(',').map(p => p.trim() === '0' ? '0deg' : p.trim());
          transformParts.push(`skew(${parts.join(',')})`);
          delete newKf.skew;
        }

        let combinedKfTransform = newKf.transform || '';
        if (transformParts.length > 0) {
          combinedKfTransform = `${combinedKfTransform} ${transformParts.join(' ')}`.trim();
        }

        if (baseTransform || useMathOrigin) {
          if (combinedKfTransform) {
            if (useMathOrigin) {
              let px = cx;
              let py = cy;
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

      // Force preview to play exactly once, ignoring repeat/loop settings
      let iterations = 1;

      target.setAttribute('data-is-animating', 'true');
      const anim = target.animate(finalKeyframes, {
        duration,
        delay,
        easing,
        fill: 'none',
        iterations
      });

      const cleanup = () => {
        target.removeAttribute('data-is-animating');
        try { anim.cancel(); } catch (err) { }
        target.style.translate = '';
        target.style.scale = '';
        target.style.rotate = '';
        target.style.opacity = '';
        target.style.transform = '';
        target.style.filter = '';
        target.style.transformBox = '';
        target.style.transformOrigin = '';
        if (target.__currentAnimation === anim) target.__currentAnimation = null;
      };
      anim.onfinish = cleanup;
      anim.oncancel = cleanup;

      target.__currentAnimation = anim;
      previewCleanupRef.current.push(cleanup);

      let previewTime;
      if (iterations === Infinity) {
        previewTime = Math.max(duration + delay + 500, 3000); // Let it loop for a bit
      } else {
        previewTime = (duration * iterations) + delay + 500; // Hold for 500ms after all repeats
      }
      const timer = setTimeout(cleanup, previewTime);

    } catch (err) {
      console.error("Preview error:", err);
    }
  }, []);

  const handleReset = React.useCallback((e) => {
    if (e) e.stopPropagation();
    if (!selectedElement) return;

    // 1. Remove ALL data-animation- attributes
    const attributes = selectedElement.attributes;
    const toRemove = [];
    for (let i = 0; i < attributes.length; i++) {
      const name = attributes[i].name;
      if (name.startsWith('data-animation-') && name !== 'data-animation-group') {
        toRemove.push(name);
      }
    }
    toRemove.forEach(attr => selectedElement.removeAttribute(attr));

    // 2. Clear element styles that might have been left by WAAPI fill:forwards
    selectedElement.style.opacity = '';
    selectedElement.style.transform = '';
    selectedElement.style.filter = '';
    selectedElement.style.backdropFilter = '';
    selectedElement.style.translate = '';
    selectedElement.style.scale = '';
    selectedElement.style.rotate = '';

    // 3. Reset local states to complete defaults
    const defaultSettings = {
      type: 'none', delay: 0, duration: 1, easing: 'Linear', repeat: 'None',
      everyVisit: true, fadeStart: true, fadeStartEnd: true, fadeEnd: true
    };

    setOpenSettings(defaultSettings);
    setCloseSettings(defaultSettings);
    setInteractSettings(defaultSettings);
    setMainType('While Opening');
    setActionType('Click');

    // 4. Notify parent of the change
    if (onUpdate) onUpdate();
  }, [selectedElement, onUpdate]);

  const handleDeleteAnimation = React.useCallback((targets) => {
    const ids = targets.map(t => t.id || t.getAttribute('data-name')).filter(Boolean);
    const groups = targets.map(t => t.getAttribute('data-animation-group')).filter(Boolean);

    setForceIncludeIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });

    setExpandedElementId(prev => {
      if (ids.includes(prev) || groups.includes(prev)) {
        return null;
      }
      return prev;
    });
  }, []);

  const handleOpenGallery = (el, callback) => {
    setEditingElement(el);
    const trigger = el.getAttribute('data-animation-trigger') || 'While Opening';
    const prefix = trigger === 'While Opening' ? 'open' : 'interact';
    setTempSelectedAnim(el.getAttribute(`data-animation-${prefix}-type`) || 'none');
    setGalleryCallback(() => callback);
    setShowGallery(true);
  };

  React.useEffect(() => {
    const handleForceAdd = (e) => {
      const id = e.detail;
      setForceIncludeIds(prev => new Set(prev).add(id));
      setExpandedElementId(id);

      const addEl = () => {
        const el = document.getElementById(id) || document.querySelector(`[data-name="${id}"]`);
        if (el) {
          setAnimatableElements(prev => {
            const alreadyIn = prev.some(existing => (existing.id === id || existing.getAttribute('data-name') === id));
            if (alreadyIn) return prev;
            return [el, ...prev];
          });

          // Play live animation preview on element immediately!
          const type = el.getAttribute('data-animation-open-type') || 'fade-in';
          if (typeof playAnimationOnTarget === 'function') {
            playAnimationOnTarget(el, type, {
              duration: el.getAttribute('data-animation-open-duration') || '1',
              delay: el.getAttribute('data-animation-open-delay') || '0',
              speed: '1',
              easing: 'Linear'
            });
          }
        }
      };
      addEl();
      requestAnimationFrame(addEl);
    };
    window.addEventListener('animation-force-add', handleForceAdd);
    return () => window.removeEventListener('animation-force-add', handleForceAdd);
  }, [onUpdate]);

  const handleGlobalPreview = () => {
    if (previewCleanupRef.current.length > 0) {
      previewCleanupRef.current.forEach(cancel => cancel());
      previewCleanupRef.current = [];
    }

    let maxT = 0;
    animatableElements.forEach(el => {
      const trigger = el.getAttribute('data-animation-trigger') || 'While Opening';
      const prefix = trigger === 'While Opening' ? 'open' : 'interact';
      const type = el.getAttribute(`data-animation-${prefix}-type`);

      if (type && type !== 'none') {
        const duration = parseFloat(el.getAttribute(`data-animation-${prefix}-duration`)) || 1;
        const delay = parseFloat(el.getAttribute(`data-animation-${prefix}-delay`)) || 0;
        const speed = 1;
        const total = (duration / speed) + delay;
        if (total > maxT) maxT = total;

        const settings = {
          delay,
          duration,
          speed,
          easing: el.getAttribute(`data-animation-${prefix}-easing`) || 'Linear'
        };
        previewAnimation(null, type, settings, el, true);
      }
    });

    if (maxT > 0) {
      setPreviewMaxTime(maxT);
      setIsPreviewing(true);
      setPreviewKey(prev => prev + 1);
    }
  };

  // removed null check to allow page-level rendering
  const currentTrigger = selectedElement?.getAttribute ? (selectedElement.getAttribute('data-animation-trigger') || 'While Opening') : 'While Opening';
  const currentPrefix = currentTrigger === 'While Opening' ? 'open' : 'interact';

  // Comprehensive check for ANY animation (sync with MainEditor)
  const hasAnimation = selectedElement?.getAttribute ? (
    (selectedElement.getAttribute('data-animation-open-type') && selectedElement.getAttribute('data-animation-open-type') !== 'none') ||
    (selectedElement.getAttribute('data-animation-interact-type') && selectedElement.getAttribute('data-animation-interact-type') !== 'none') ||
    selectedElement.getAttribute('data-animation-intent') === 'true'
  ) : false;

  return (
    <div className="relative flex flex-col w-full h-full">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0.25vw; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 0.5vw; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes anim-panel-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
        .custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
        .custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.4vw; cursor: pointer; transition: box-shadow 0.15s ease; position: relative; z-index: 2; }
        .custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
      `}</style>

      {/* Top Banner Button */}
      <div
        onClick={handleGlobalPreview}
        className="relative bg-gray-200/75 p-[0.75vw] rounded-[0.8vw] flex items-center gap-[0.75vw] border border-gray-200 cursor-pointer mb-[1.5vw] hover:bg-gray-200 transition-all overflow-hidden group shadow-[0_0.2vw_1vw_rgba(0,0,0,0.05)]"
      >
        {/* Progress Bar Overlay */}
        {isPreviewing && (
          <div
            key={previewKey}
            className="absolute inset-y-0 left-0 bg-white pointer-events-none z-0"
            style={{ animation: `anim-panel-progress ${previewMaxTime}s linear forwards` }}
            onAnimationEnd={() => setIsPreviewing(false)}
          />
        )}

        <div className="relative z-10  px-[0.4vw]">
          <Icon icon="tdesign:animation-1" width="1.5vw" height="1.5vw" className="text-yellow-400 fill-yellow-400" />
        </div>
        <span className="relative z-10 text-[0.75vw] text-gray-500 leading-tight">
          Click to preview<br />
          <span className="font-semibold text-gray-900">Animations</span>
        </span>
      </div>


      <div className="flex items-center gap-[0.5vw] mb-[1vw]">
        <h3 className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Animations in this Page</h3>
        <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
      </div>

      {/* Accordions List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-[0.5vw] pr-[0.25vw] relative"
        style={{ maxHeight: 'calc(100vh - 20vw)' }}
      >
        {(() => {
          const groups = {};
          const items = [];

          animatableElements.forEach(el => {
            const g = el.getAttribute('data-animation-group');
            if (g) {
              if (!groups[g]) groups[g] = [];
              groups[g].push(el);
            } else {
              items.push({ type: 'single', element: el });
            }
          });

          // Add groups to items
          Object.entries(groups).forEach(([name, elements]) => {
            items.push({ type: 'group', name, elements });
          });

          return items.map((item, idx) => {
            const isGroup = item.type === 'group';
            const el = isGroup ? item.elements[0] : item.element;
            const id = isGroup ? item.name : (el.id || el.getAttribute('data-name'));
            const name = isGroup ? item.name : (el.getAttribute('data-name') || el.id);
            const isExpanded = expandedElementId === id;
            const trigger = el.getAttribute('data-animation-trigger') || 'While Opening';
            const prefix = trigger === 'While Opening' ? 'open' : 'interact';
            const hasAnim = el.getAttribute(`data-animation-${prefix}-type`) && el.getAttribute(`data-animation-${prefix}-type`) !== 'none';

            return (
              <div
                key={id || idx}
                ref={el => itemRefs.current[id] = el}
                className={`border rounded-[0.8vw] bg-white transition-all duration-200 overflow-hidden ${isExpanded ? 'border-gray-300 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center justify-between p-[1vw] cursor-pointer bg-white" onClick={() => {
                  const nextId = isExpanded ? null : id;
                  setExpandedElementId(nextId);
                  if (nextId) {
                    const targetIds = isGroup ? item.elements.map(e => e.id || e.getAttribute('data-name')) : [el.id || el.getAttribute('data-name')];
                    window.dispatchEvent(new CustomEvent('select-layer', { detail: { ids: targetIds } }));
                  }
                }}>
                  <div className="flex items-center gap-[0.5vw] flex-1 min-w-0">
                    <Icon icon="tdesign:animation-1" className="text-gray-500" width="1.1vw" height="1.2vw" />
                    {editingNameId === id ? (
                      <input
                        className="text-[0.8vw] text-gray-700 font-medium bg-gray-50 border-b border-indigo-400 outline-none w-full px-[0.2vw]"
                        value={tempName}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          setTempName(newVal);
                          if (newVal.trim() && !isGroup) {
                            onUpdate(id, 'data-name', newVal);
                            // Refresh the list to reflect the name change in the accordion header
                            setTick(t => t + 1);
                          }
                        }}
                        onBlur={() => {
                          setEditingNameId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.target.blur();
                          if (e.key === 'Escape') {
                            // Revert if escape
                            if (!isGroup) onUpdate(id, 'data-name', name);
                            setEditingNameId(null);
                          }
                        }}
                      />
                    ) : (
                      <span
                        className="text-[0.8vw] text-gray-700 font-medium truncate max-w-[14vw] cursor-pointer hover:text-indigo-600"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (!isGroup) {
                            setEditingNameId(id);
                            setTempName(name);
                          }
                        }}
                      >
                        {name}
                      </span>
                    )}
                    {isGroup && <span className="text-[0.6vw] bg-gray-100 text-gray-400 px-[0.3vw] py-[0.1vw] rounded-full">{item.elements.length}</span>}
                  </div>
                  <div className="flex items-center gap-[0.5vw]">
                    {isExpanded && <Icon icon="lucide:rotate-cw" width="0.8vw" height="0.8vw" className="text-gray-400 hover:text-gray-600" onClick={(e) => {
                      e.stopPropagation();
                      if (isGroup) {
                        if (previewCleanupRef.current.length > 0) {
                          previewCleanupRef.current.forEach(cancel => cancel());
                          previewCleanupRef.current = [];
                        }
                        item.elements.forEach(target => {
                          const t = target.getAttribute('data-animation-trigger') || 'While Opening';
                          const p = t === 'While Opening' ? 'open' : 'interact';
                          previewAnimation(e, target.getAttribute(`data-animation-${p}-type`), { delay: parseFloat(target.getAttribute(`data-animation-${p}-delay`)) || 0, duration: parseFloat(target.getAttribute(`data-animation-${p}-duration`)) || 1, easing: target.getAttribute(`data-animation-${p}-easing`) || 'Linear', repeat: target.getAttribute(`data-animation-${p}-repeat`) || 'None' }, target, true);
                        });
                      } else {
                        const t = el.getAttribute('data-animation-trigger') || 'While Opening';
                        const p = t === 'While Opening' ? 'open' : 'interact';
                        previewAnimation(e, el.getAttribute(`data-animation-${p}-type`), { delay: parseFloat(el.getAttribute(`data-animation-${p}-delay`)) || 0, duration: parseFloat(el.getAttribute(`data-animation-${p}-duration`)) || 1, easing: el.getAttribute(`data-animation-${p}-easing`) || 'Linear', repeat: el.getAttribute(`data-animation-${p}-repeat`) || 'None' }, el);
                      }
                    }} />}
                    <Icon icon={isExpanded ? "lucide:chevron-up" : "lucide:chevron-down"} width="1vw" height="1vw" className="text-gray-400" />
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-[1vw] border-t border-gray-100 bg-[#FDFDFD]">
                    <SingleAnimationEditor
                      element={isGroup ? null : el}
                      elements={isGroup ? item.elements : null}
                      onUpdate={onUpdate}
                      onDelete={handleDeleteAnimation}
                      onOpenGallery={(target, cb) => {
                        if (isGroup) {
                          handleOpenGallery(target, (newType) => {
                            // 1. Close gallery immediately for better UX
                            setShowGallery(false);

                            // 2. Immediate DOM update for all
                            item.elements.forEach(member => {
                              const t = member.getAttribute('data-animation-trigger') || 'While Opening';
                              const p = t === 'While Opening' ? 'open' : 'interact';
                              member.setAttribute(`data-animation-${p}-type`, newType);
                            });

                            // 3. Staggered state updates to prevent UI hang
                            item.elements.forEach((member, i) => {
                              const t = member.getAttribute('data-animation-trigger') || 'While Opening';
                              const p = t === 'While Opening' ? 'open' : 'interact';
                              if (onUpdate) {
                                setTimeout(() => {
                                  onUpdate(member.id || member.getAttribute('data-name'), `data-animation-${p}-type`, newType);
                                }, i * 30);
                              }
                            });

                            // 4. Update the editor UI state
                            cb(newType);

                            // 5. Play preview for the whole group
                            setTimeout(() => {
                              item.elements.forEach(member => {
                                const t = member.getAttribute('data-animation-trigger') || 'While Opening';
                                const p = t === 'While Opening' ? 'open' : 'interact';
                                previewAnimation(null, newType, {
                                  delay: parseFloat(member.getAttribute(`data-animation-${p}-delay`)) || 0,
                                  duration: parseFloat(member.getAttribute(`data-animation-${p}-duration`)) || 1,
                                  easing: member.getAttribute(`data-animation-${p}-easing`) || 'Linear',
                                  repeat: member.getAttribute(`data-animation-${p}-repeat`) || 'None'
                                }, member, true);
                              });
                            }, 200);
                          });
                        } else {
                          handleOpenGallery(target, cb);
                        }
                      }}
                      previewAnimation={previewAnimation}
                      ANIMATION_GALLERY_ITEMS={ANIMATION_GALLERY_ITEMS}
                      EASING_OPTIONS={EASING_OPTIONS}
                    />
                  </div>
                )}
              </div>
            );
          });
        })()}

      </div>

      {/* Animation Gallery Modal */}
      {showGallery && (
        <>
          <div
            className="fixed inset-0 z-[40]"
            onClick={(e) => { e.stopPropagation(); setShowGallery(false); }}
          />
          <div className="anim-panel-gallery-modal fixed z-[50] bg-white rounded-[0.8vw] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ width: '20vw', height: '32vw', top: '55%', left: '80%', transform: 'translate(-50%, -50%)' }}>
            <div className="anim-panel-gallery-header flex items-center gap-[1vw] px-[1vw] py-[1vw] border-b border-gray-100 shadow-[0_4px_6px_1px_rgba(0,0,0,0.10)]">
              <h2 className="text-[1vw] font-semibold text-gray-900">Animation Gallery</h2>
              <div className="h-[0.1vw] flex-1 bg-gray-200 opacity-50"></div>
              <button onClick={() => setShowGallery(false)} className="anim-panel-close-btn w-[1.5vw] h-[1.5vw] flex items-center justify-center rounded-lg border border-red-500 hover:bg-red-50 transition-colors">
                <X size="1vw" className="text-red-500" strokeWidth={2} />
              </button>
            </div>

            <div className="anim-panel-gallery-content flex-1 px-[1vw] py-[1vw] overflow-y-auto no-scrollbar">
              <div className="anim-panel-gallery-grid grid grid-cols-4 gap-x-[0.5vw] gap-y-[0.5vw]">
                {ANIMATION_GALLERY_ITEMS.map((anim, idx) => (
                  <div key={idx} className="anim-panel-gallery-item group cursor-pointer flex flex-col items-center" onClick={(e) => {
                    setTempSelectedAnim(anim.id);
                    const t = editingElement?.getAttribute('data-animation-trigger') || 'While Opening';
                    const p = t === 'While Opening' ? 'open' : 'interact';
                    previewAnimation(e, anim.id, {
                      delay: parseFloat(editingElement?.getAttribute(`data-animation-${p}-delay`)) || 0,
                      duration: parseFloat(editingElement?.getAttribute(`data-animation-${p}-duration`)) || 1,
                      easing: editingElement?.getAttribute(`data-animation-${p}-easing`) || 'Linear',
                      repeat: editingElement?.getAttribute(`data-animation-${p}-repeat`) || 'None'
                    }, editingElement);
                  }}>
                    <div className={`anim-panel-item-card aspect-square w-full rounded-[0.2vw] border flex flex-col items-center justify-center transition-all bg-white shadow-sm overflow-hidden ${tempSelectedAnim === anim.id ? 'border-gray-700 border-[0.1vw]' : 'border-gray-100 hover:border-gray-300'
                      }`}>
                      <div className="anim-panel-item-icon flex-1 flex items-center justify-center p-[0.25vw]">
                        {anim.icon === 'None' ? (
                          <Icon icon="radix-icons:shadow-none" width="2.2vw" height="2.2vw" className="text-gray-500" />
                        ) : anim.icon === 'Circle' ? (
                          <motion.div
                            variants={ANIMATION_VARIANTS[anim.id]} initial="initial" animate="animate"
                            transition={ANIMATION_VARIANTS[anim.id]?.transition || { repeat: Infinity, duration: 2 }}
                            className="flex items-center justify-center"
                          >
                            <Icon icon="game-icons:glass-ball" width="2vw" height="2vw" className="text-gray-500" />
                          </motion.div>
                        ) : (
                          <div className="anim-panel-bars-icon flex items-end gap-[0.3vw] h-[1.8vw]">
                            <motion.div
                              variants={ANIMATION_VARIANTS[anim.id]} initial="initial" animate="animate"
                              transition={ANIMATION_VARIANTS[anim.id]?.transition || { repeat: Infinity, duration: 1.5 }} className="anim-panel-bar-1 w-[0.6vw] h-[1.8vw] bg-gray-200 rounded-[0.05vw]"
                            />
                            <motion.div
                              variants={ANIMATION_VARIANTS[anim.id]} initial="initial" animate="animate"
                              transition={ANIMATION_VARIANTS[anim.id]?.transition || { repeat: Infinity, duration: 1.5, delay: 0.1 }} className="anim-panel-bar-2 w-[0.6vw] h-[1.8vw] bg-gray-300 rounded-[0.05vw]"
                            />
                            <motion.div
                              variants={ANIMATION_VARIANTS[anim.id]} initial="initial" animate="animate"
                              transition={ANIMATION_VARIANTS[anim.id]?.transition || { repeat: Infinity, duration: 1.5, delay: 0.2 }} className="anim-panel-bar-3 w-[0.6vw] h-[1.8vw] bg-gray-400 rounded-[0.05vw]"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`anim-panel-item-label text-[0.6vw] mt-[0.6vw] font-medium text-center leading-tight transition-colors ${tempSelectedAnim === anim.id ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>{anim.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="anim-panel-gallery-footer p-[0.8vw] border-t border-gray-100 flex justify-end gap-[0.5vw] bg-white rounded-b-[0.5vw] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.10)] relative z-10">
              <button onClick={() => setShowGallery(false)} className="anim-panel-gallery-close cursor-pointer px-[1vw] h-[2vw] border border-black rounded-[0.3vw] text-[0.8vw] font-semibold flex items-center justify-center gap-[0.5vw] hover:bg-gray-50 transition-colors">
                <X size="1vw" /> Close
              </button>
              <button
                disabled={!tempSelectedAnim}
                onClick={() => {
                  if (tempSelectedAnim && editingElement) {
                    // Execute callback if present
                    if (typeof galleryCallback === 'function') {
                      try {
                        galleryCallback(tempSelectedAnim);
                      } catch (err) {
                        console.error('Gallery callback error:', err);
                      }
                    } else {
                      // Fallback for direct single element edit
                      editingElement.setAttribute('data-animation-open-type', tempSelectedAnim);
                      if (onUpdate) onUpdate(editingElement.id || editingElement.getAttribute('data-name'), 'data-animation-open-type', tempSelectedAnim);
                    }

                    // Always close and reset
                    setShowGallery(false);
                    setTempSelectedAnim(null);
                    setGalleryCallback(null);
                  }
                }}
                className="anim-panel-gallery-replace px-[1vw] cursor-pointer h-[2vw] bg-black text-white rounded-[0.3vw] text-[0.8vw] font-semibold flex items-center justify-center gap-[0.5vw] hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-lg"
              >
                <Icon icon="ph:arrows-clockwise-bold" width="1vw" height="1vw" className="text-white" /> Replace
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnimationPanel;
