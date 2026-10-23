import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Volume2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { resolveUploadsPath } from '../../../utils/supabaseUtils';
import sampleAudio from '../../../assets/Audios/bg music1.mp3';
import ColorPicker from '../ColorPicker';
import Effect from '../Effect';

// Helper to sync live SVG filters on the DOM element for Drop Shadow
const syncLiveFilters = (el) => {
  if (!el) return;
  const doc = el.ownerDocument || document;
  let svgRoot = el;
  while (svgRoot && svgRoot.tagName?.toLowerCase() !== 'svg') {
    svgRoot = svgRoot.parentElement;
  }
  if (!svgRoot) {
    const container = el.closest('.page-svg-container');
    if (container) {
      const canvasContent = container.querySelector('[id^="canvas-content-"]');
      svgRoot = canvasContent ? canvasContent.querySelector('svg') : container.querySelector('svg');
    }
  }
  if (!svgRoot) return;

  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  const baseFilterId = `filter-${el.id || 'audio'}`;
  Array.from(defs.querySelectorAll(`[id^="${baseFilterId}"]`)).forEach(old => old.remove());

  const hasDropShadow = el.getAttribute('data-effect-drop-shadow') === 'true';
  if (!hasDropShadow) {
    el.removeAttribute('filter');
    return;
  }

  const filterId = `${baseFilterId}-${Math.random().toString(36).substr(2, 4)}`;
  const filterEl = doc.createElementNS("http://www.w3.org/2000/svg", "filter");
  filterEl.id = filterId;
  filterEl.setAttribute('x', '-50%');
  filterEl.setAttribute('y', '-50%');
  filterEl.setAttribute('width', '200%');
  filterEl.setAttribute('height', '200%');
  defs.appendChild(filterEl);

  const getVal = (attr, def) => el.getAttribute(attr) || def;
  const color = getVal('data-effect-drop-shadow-color', '#000000');
  const opacity = parseFloat(getVal('data-effect-drop-shadow-opacity', '35')) / 100;
  const dx = getVal('data-effect-drop-shadow-x', '2');
  const dy = getVal('data-effect-drop-shadow-y', '2');
  const blur = parseFloat(getVal('data-effect-drop-shadow-blur', '4'));
  const spread = parseFloat(getVal('data-effect-drop-shadow-spread', '0'));

  let dsSource = 'SourceAlpha';
  if (spread !== 0) {
    const morph = doc.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
    morph.setAttribute('operator', spread >= 0 ? 'dilate' : 'erode');
    morph.setAttribute('radius', Math.abs(spread));
    morph.setAttribute('in', 'SourceAlpha');
    morph.setAttribute('result', 'ds_morph');
    filterEl.appendChild(morph);
    dsSource = 'ds_morph';
  }

  const gauss = doc.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
  gauss.setAttribute('stdDeviation', blur);
  gauss.setAttribute('in', dsSource);
  gauss.setAttribute('result', 'ds_blur');
  filterEl.appendChild(gauss);

  const offset = doc.createElementNS("http://www.w3.org/2000/svg", "feOffset");
  offset.setAttribute('dx', dx);
  offset.setAttribute('dy', dy);
  offset.setAttribute('in', 'ds_blur');
  offset.setAttribute('result', 'ds_offset');
  filterEl.appendChild(offset);

  const flood = doc.createElementNS("http://www.w3.org/2000/svg", "feFlood");
  flood.setAttribute('flood-color', color);
  flood.setAttribute('flood-opacity', opacity);
  flood.setAttribute('result', 'ds_flood');
  filterEl.appendChild(flood);

  const comp = doc.createElementNS("http://www.w3.org/2000/svg", "feComposite");
  comp.setAttribute('in', 'ds_flood');
  comp.setAttribute('in2', 'ds_offset');
  comp.setAttribute('operator', 'in');
  comp.setAttribute('result', 'ds_final');
  filterEl.appendChild(comp);

  const merge = doc.createElementNS("http://www.w3.org/2000/svg", "feMerge");
  const nodeShadow = doc.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
  nodeShadow.setAttribute('in', 'ds_final');
  const nodeInput = doc.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
  nodeInput.setAttribute('in', 'SourceGraphic');
  merge.appendChild(nodeShadow);
  merge.appendChild(nodeInput);
  filterEl.appendChild(merge);

  el.setAttribute('filter', `url(#${filterId})`);
};

// Section Header matching QRCodeProperties.jsx exact styling
const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.4vw] mt-[0.3vw]">
    <span className="text-[0.9vw] font-medium text-black whitespace-nowrap">{title}</span>
    <div className="h-[0.06vw] bg-gray-200 flex-1 ml-[0.3vw]" />
  </div>
);

// PropertyRow matching QRCodeProperties.jsx exact alignment (w-[5.6vw] pl-[0.5vw])
const PropertyRow = ({ label, children, className = '' }) => (
  <div className={`flex items-center gap-[0.5vw] ${className}`}>
    <div className="w-[5.6vw] shrink-0 flex items-center pl-[0.5vw] justify-between text-gray-700 font-medium">
      <span className={`${label.length > 12 ? 'text-[0.68vw]' : 'text-[0.78vw]'} tracking-tight whitespace-nowrap`}>
        {label}
      </span>
      <span className="text-gray-500 font-medium text-[0.8vw]">:</span>
    </div>
    <div className="flex-1 min-w-0">
      {children}
    </div>
  </div>
);

// Toggle Switch matching QRCodeProperties.jsx exact structure & style
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-[1.9vw] h-[1.1vw] flex items-center rounded-full p-[0.1vw] cursor-pointer transition-colors ${
      checked ? 'bg-[#E05638]' : 'bg-gray-300'
    }`}
  >
    <div
      className={`bg-white w-[0.9vw] h-[0.9vw] rounded-full shadow-md transform transition-transform ${
        checked ? 'translate-x-[0.8vw]' : 'translate-x-0'
      }`}
    />
  </button>
);

// Custom Dropdown matching QRCodeProperties.jsx CustomSelect (h-[2.5vw] rounded-[0.5vw])
const CustomDropdown = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[2.5vw] flex items-center justify-between bg-white border ${
          isOpen ? 'border-2 border-[#E05638] shadow-xs' : 'border border-gray-200 hover:border-gray-300'
        } rounded-[0.5vw] px-[0.6vw] text-[0.78vw] text-gray-800 transition-colors cursor-pointer shadow-2xs font-medium`}
      >
        <span className="truncate font-medium">{selectedOption?.label || value}</span>
        <ChevronDown
          className={`w-[0.9vw] h-[0.9vw] text-gray-500 transition-transform duration-200 flex-shrink-0 ml-[0.3vw] ${
            isOpen ? 'rotate-180 text-[#E05638]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-[0.35vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-2xl overflow-hidden z-[100] flex flex-col py-[0.3vw] max-h-[14vw] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-[0.9vw] py-[0.45vw] text-[0.78vw] font-medium transition-colors text-left flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'text-[#E05638] bg-[#E05638]/10 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-[#E05638]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// Color Swatch + Hex Input Box matching QRCodeProperties.jsx exact structure
const ColorInput = ({ color, onChange, opacity = 100, onOpenPicker, isActive = false }) => {
  const displayColor = color && color.startsWith('#') ? color.toUpperCase() : color || '#000000';

  return (
    <div className="flex items-center gap-[0.4vw] w-full">
      <div
        onClick={onOpenPicker}
        className={`color-box color-box-trigger w-[2vw] h-[2vw] rounded-[0.5vw] border flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 transition-all ${
          isActive ? 'border-[#E05638] ring-2 ring-[#E05638]/40 scale-105 shadow-xs' : 'border-gray-200 hover:border-gray-300'
        }`}
        style={{ backgroundColor: color || '#000000' }}
        title="Click to open color palette"
      />
      <div className="flex-1 h-[2.5vw] flex items-center justify-between border border-gray-200 rounded-[0.5vw] bg-white px-[0.6vw] text-[0.8vw] text-gray-800 focus-within:border-[#E05638] shadow-2xs">
        <input
          type="text"
          value={displayColor}
          onChange={(e) => {
            let val = e.target.value;
            if (!val.startsWith('#') && val.length > 0) val = '#' + val;
            onChange(val);
          }}
          className="w-[5.2vw] font-mono text-[0.8vw] text-gray-800 bg-transparent focus:outline-none uppercase font-medium"
          maxLength={7}
        />
        <span className="text-gray-400 text-[0.75vw] font-medium">{opacity}%</span>
      </div>
    </div>
  );
};

const SPEED_OPTIONS = [
  { value: '0.25', label: '0.25x' },
  { value: '0.5', label: '0.5x' },
  { value: '0.75', label: '0.75x' },
  { value: '1', label: '1x' },
  { value: '1.25', label: '1.25x' },
  { value: '1.5', label: '1.5x' },
  { value: '2', label: '2x' }
];

const BEHAVIOUR_OPTIONS = [
  { value: 'Auto Play on Page Open', label: 'Auto Play on Page Open' },
  { value: 'Play on Click', label: 'Play on Click' },
  { value: 'Play on Hover', label: 'Play on Hover' },
  { value: 'Loop on Page', label: 'Loop on Page' }
];

const PLAYER_STYLE_OPTIONS = [
  { value: 'glassmorphism', label: 'Clean Glassmorphism' },
  { value: 'forest-moss', label: 'Forest Moss (Solid)' },
  { value: 'cyber-blue', label: 'Cyber Neon Blue' },
  { value: 'silver-mono', label: 'Silver Mono Capsule' },
  { value: 'sunset-vibrant', label: 'Sunset Vibrant' },
  { value: 'cyberpunk-wide', label: 'Cyberpunk Neon (Wide Bar)' },
  { value: 'audio-icon', label: 'Audio Icon (Compact)' }
];

const SKIP_STEPS = [1, 2, 3, 5, 10, 15, 30, 60];

const AudioProperties = ({
  selectedElement,
  selectedLayerId,
  activePageIndex,
  updateElementAttribute,
  selectedElementProps,
  onUpdate
}) => {
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const { v_id: paramVId } = useParams();

  // Uploaded Audio Metadata State
  const [audioName, setAudioName] = useState('bg music1.mp3');
  const [audioDurationText, setAudioDurationText] = useState('00:39 Mins');
  const [audioSizeText, setAudioSizeText] = useState('614 kb');
  const [audioFormatText, setAudioFormatText] = useState('MP3');
  const [audioSrc, setAudioSrc] = useState(sampleAudio);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Audio Properties States
  const [playerStyle, setPlayerStyle] = useState('glassmorphism');
  const [playbackSpeed, setPlaybackSpeed] = useState('1');
  const [behaviour, setBehaviour] = useState('Auto Play on Page Open');
  const [defaultVolume, setDefaultVolume] = useState(80);

  // Audio Player Controls Sub-section States
  const [controlPlayPause, setControlPlayPause] = useState(true);
  const [controlSkip, setControlSkip] = useState(true);
  const [skipSeconds, setSkipSeconds] = useState(5);
  const [controlDuration, setControlDuration] = useState(true);
  const [controlVolume, setControlVolume] = useState(false);
  const [controlLoop, setControlLoop] = useState(true);
  const [controlMute, setControlMute] = useState(true);

  // Colors States (matching #000000, #FFFFFF, #900000)
  const [iconColor, setIconColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [strokeColor, setStrokeColor] = useState('#900000');

  // ColorPicker & Effects States
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [openSubSection, setOpenSubSection] = useState(null);
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);
  const [activeEffects, setActiveEffects] = useState(['Drop Shadow']);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': {
      x: 2,
      y: 2,
      blur: 4,
      spread: 0,
      color: '#000000',
      opacity: 35
    }
  });

  // Helper to persist attribute on element & editor state
  const updateAttribute = useCallback(
    (attr, value) => {
      if (selectedElement) {
        selectedElement.setAttribute(attr, value);
        if (updateElementAttribute && activePageIndex !== undefined && selectedLayerId) {
          updateElementAttribute(activePageIndex, selectedLayerId, attr, value);
        }
      }
    },
    [selectedElement, updateElementAttribute, activePageIndex, selectedLayerId]
  );

  // Format seconds to mm:ss
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return '0:00';
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const effectiveSrc = audioSrc || sampleAudio;

  // Helper to update play/pause icon on canvas
  const updatePlayPauseIconOnCanvas = useCallback((playing) => {
    if (!selectedElement) return;
    const iconContainer = selectedElement.querySelector('.play-pause-icon');
    if (!iconContainer) return;
    const isSquare = !selectedElement.querySelector('.play-pause-bg');

    if (playing) {
      if (isSquare) {
        iconContainer.innerHTML = `<rect x="18" y="16" width="4" height="16" fill="${iconColor}" rx="1" /><rect x="26" y="16" width="4" height="16" fill="${iconColor}" rx="1" />`;
      } else {
        iconContainer.innerHTML = `<rect x="6" y="4" width="4" height="14" fill="#ffffff" rx="1" /><rect x="14" y="4" width="4" height="14" fill="#ffffff" rx="1" />`;
      }
    } else {
      if (isSquare) {
        iconContainer.innerHTML = `<polygon points="20 16 32 24 20 32" fill="${iconColor}" stroke="${iconColor}" stroke-width="2" stroke-linejoin="round"></polygon>`;
      } else {
        iconContainer.innerHTML = `<polygon points="7 4 17 11 7 18 7 4" fill="#ffffff"></polygon>`;
      }
    }
  }, [selectedElement, iconColor]);

  // Helper to update mute/speaker icon on canvas
  const updateMuteIconOnCanvas = useCallback((muted) => {
    if (!selectedElement) return;
    const volIcon = selectedElement.querySelector('.volume-icon');
    if (!volIcon) return;
    if (muted) {
      volIcon.innerHTML = `
        <rect x="-4" y="-4" width="28" height="28" fill="transparent"></rect>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="${iconColor}"></polygon>
        <line x1="18" y1="8" x2="14" y2="16" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"></line>
        <line x1="14" y1="8" x2="18" y2="16" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"></line>
      `;
    } else {
      volIcon.innerHTML = `
        <rect x="-4" y="-4" width="28" height="28" fill="transparent"></rect>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="${iconColor}"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      `;
    }
  }, [selectedElement, iconColor]);

  // Helper to update loop icon opacity on canvas
  const updateLoopIconOnCanvas = useCallback((looping) => {
    if (!selectedElement) return;
    const loopIcon = selectedElement.querySelector('.loop-icon');
    if (loopIcon) {
      loopIcon.style.opacity = looping ? '1' : '0.5';
    }
  }, [selectedElement]);

  // Initialize state from selectedElement DOM attributes & auto-sanitize
  useEffect(() => {
    if (!selectedElement) return;

    // Auto-fix bounding box & hitboxes on canvas element
    const fillLayer = selectedElement.querySelector('.audio-fill-layer');
    if (fillLayer) {
      if (!fillLayer.getAttribute('width') || fillLayer.getAttribute('width') === '0') {
        fillLayer.setAttribute('width', '420');
      }
    }
    const oversizedHitbox = selectedElement.querySelector('.volume-group > rect[width="150"]');
    if (oversizedHitbox) {
      oversizedHitbox.setAttribute('width', '35');
    }
    const prevEl = selectedElement.querySelector('.prev-icon');
    if (prevEl) {
      prevEl.style.pointerEvents = 'all';
      prevEl.style.cursor = 'pointer';
      prevEl.style.opacity = '1';
    }
    const nextEl = selectedElement.querySelector('.next-icon');
    if (nextEl) {
      nextEl.style.pointerEvents = 'all';
      nextEl.style.cursor = 'pointer';
      nextEl.style.opacity = '1';
    }

    // File info
    const nameAttr = selectedElement.getAttribute('data-filename');
    if (nameAttr) setAudioName(nameAttr);

    const durText = selectedElement.getAttribute('data-audio-duration-text');
    if (durText) setAudioDurationText(durText);

    const sizeText = selectedElement.getAttribute('data-audio-size-text');
    if (sizeText) setAudioSizeText(sizeText);

    const formatText = selectedElement.getAttribute('data-audio-format-text');
    if (formatText) setAudioFormatText(formatText);

    const srcAttr = selectedElement.getAttribute('data-audio-src');
    if (srcAttr) {
      setAudioSrc(srcAttr);
    } else {
      setAudioSrc(sampleAudio);
      selectedElement.setAttribute('data-audio-src', sampleAudio);
      selectedElement.setAttribute('data-interaction', 'audio');
      selectedElement.setAttribute('data-interaction-value', sampleAudio);
    }

    // Audio properties
    const tplAttr = selectedElement.getAttribute('data-audio-template');
    if (tplAttr) setPlayerStyle(tplAttr);

    const speedAttr = selectedElement.getAttribute('data-audio-speed');
    if (speedAttr) setPlaybackSpeed(speedAttr);

    const behAttr = selectedElement.getAttribute('data-audio-behaviour');
    if (behAttr) setBehaviour(behAttr);

    const volAttr = selectedElement.getAttribute('data-audio-volume');
    if (volAttr !== null) setDefaultVolume(Math.round(parseFloat(volAttr) * 100));

    // Controls toggles
    const ppAttr = selectedElement.getAttribute('data-control-play-pause');
    if (ppAttr !== null) setControlPlayPause(ppAttr === 'true');

    const skipAttr = selectedElement.getAttribute('data-control-skip');
    if (skipAttr !== null) setControlSkip(skipAttr === 'true');

    const skipSecAttr = selectedElement.getAttribute('data-skip-seconds');
    if (skipSecAttr) setSkipSeconds(parseInt(skipSecAttr, 10) || 5);

    const durAttr = selectedElement.getAttribute('data-control-duration');
    if (durAttr !== null) setControlDuration(durAttr === 'true');

    const volCtrlAttr = selectedElement.getAttribute('data-control-volume');
    if (volCtrlAttr !== null) setControlVolume(volCtrlAttr === 'true');

    const loopAttr = selectedElement.getAttribute('data-control-loop') ?? selectedElement.getAttribute('data-audio-loop');
    if (loopAttr !== null) {
      setControlLoop(loopAttr === 'true');
      setIsLooping(loopAttr === 'true');
    }

    const muteAttr = selectedElement.getAttribute('data-control-mute');
    if (muteAttr !== null) setControlMute(muteAttr === 'true');

    const audioMutedAttr = selectedElement.getAttribute('data-audio-muted');
    if (audioMutedAttr !== null) setIsMuted(audioMutedAttr === 'true');

    // Colors
    const iconCol = selectedElement.getAttribute('data-icon-color');
    if (iconCol) setIconColor(iconCol);

    const fillCol = selectedElement.getAttribute('data-fill-color');
    if (fillCol) setBgColor(fillCol);

    const strokeCol = selectedElement.getAttribute('data-stroke-color');
    if (strokeCol) setStrokeColor(strokeCol);

    // Drop Shadow
    const hasDs = selectedElement.getAttribute('data-effect-drop-shadow') === 'true';
    setActiveEffects(hasDs ? ['Drop Shadow'] : []);
    if (hasDs) {
      setEffectSettings({
        'Drop Shadow': {
          x: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-x') || '2'),
          y: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-y') || '2'),
          blur: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-blur') || '4'),
          spread: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-spread') || '0'),
          color: selectedElement.getAttribute('data-effect-drop-shadow-color') || '#000000',
          opacity: parseFloat(selectedElement.getAttribute('data-effect-drop-shadow-opacity') || '35')
        }
      });
    }
  }, [selectedElement]);

  // Audio object initialization & live playback sync
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(effectiveSrc);
    } else {
      if (audioRef.current.src !== effectiveSrc) {
        audioRef.current.src = effectiveSrc;
      }
    }

    audioRef.current.loop = isLooping;
    audioRef.current.volume = defaultVolume / 100;
    audioRef.current.playbackRate = parseFloat(playbackSpeed) || 1;
    audioRef.current.muted = isMuted;

    audioRef.current.onended = () => {
      setIsPlaying(false);
      updatePlayPauseIconOnCanvas(false);
      if (!audioRef.current?.loop && selectedElement) {
        const curEl = selectedElement.querySelector('.audio-current-time');
        if (curEl) curEl.textContent = '0:00';
        const progressFill = selectedElement.querySelector('.progress-fill');
        const progressKnob = selectedElement.querySelector('.progress-knob');
        if (progressFill && progressKnob) {
          const progressBg = selectedElement.querySelector('.progress-bg');
          const bgX = progressBg ? parseFloat(progressBg.getAttribute('x') || '160') : 160;
          progressFill.setAttribute('width', '0');
          progressKnob.setAttribute('cx', bgX.toString());
        }
      }
    };

    audioRef.current.ontimeupdate = () => {
      if (!selectedElement || !audioRef.current) return;
      const curTime = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      const currentTimeStr = formatTime(curTime);

      const currentTimeEl = selectedElement.querySelector('.audio-current-time');
      if (currentTimeEl) currentTimeEl.textContent = currentTimeStr;

      const progressFill = selectedElement.querySelector('.progress-fill');
      const progressKnob = selectedElement.querySelector('.progress-knob');
      if (progressFill && progressKnob && dur) {
        const progressBg = selectedElement.querySelector('.progress-bg');
        const bgX = progressBg ? parseFloat(progressBg.getAttribute('x') || '160') : 160;
        const maxWidth = progressBg ? parseFloat(progressBg.getAttribute('width') || '125') : 125;
        const ratio = curTime / dur;
        const fillWidth = ratio * maxWidth;
        progressFill.setAttribute('width', fillWidth.toString());
        progressKnob.setAttribute('cx', (bgX + fillWidth).toString());
      }
    };

    audioRef.current.onloadedmetadata = () => {
      if (!selectedElement || !audioRef.current) return;
      const dur = audioRef.current.duration;
      const durationStr = formatTime(dur);
      const totalTimeEl = selectedElement.querySelector('.audio-total-time');
      if (totalTimeEl && durationStr !== '0:00' && durationStr !== 'NaN:NaN') {
        totalTimeEl.textContent = durationStr;
      }

      const mins = Math.floor(dur / 60);
      const secs = Math.floor(dur % 60);
      const formattedMinText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs} Mins`;
      setAudioDurationText(formattedMinText);
      updateAttribute('data-audio-duration-text', formattedMinText);
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [effectiveSrc]); // eslint-disable-line

  // Sync playback speed & volume to audioRef
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = parseFloat(playbackSpeed) || 1;
      audioRef.current.volume = defaultVolume / 100;
      audioRef.current.loop = isLooping;
      audioRef.current.muted = isMuted;
    }
  }, [playbackSpeed, defaultVolume, isLooping, isMuted]);

  // Sync colors to the live SVG element on canvas
  useEffect(() => {
    if (!selectedElement) return;

    // 1. Background fill
    const fillLayer = selectedElement.querySelector('.audio-fill-layer');
    if (fillLayer) {
      fillLayer.setAttribute('fill', bgColor);
      fillLayer.setAttribute('stroke', strokeColor);
      fillLayer.setAttribute('stroke-width', '1.5');
    }

    // 2. Icon color applied to inner SVG controls
    const iconElements = selectedElement.querySelectorAll(
      '.prev-icon polygon, .next-icon polygon, .audio-current-time, .audio-total-time, .progress-fill, .progress-knob, .volume-icon polygon, .volume-fill, .volume-knob, .play-pause-bg'
    );
    iconElements.forEach((el) => {
      el.setAttribute('fill', iconColor);
    });

    const strokeElements = selectedElement.querySelectorAll(
      '.volume-icon path, .loop-icon path'
    );
    strokeElements.forEach((el) => {
      el.setAttribute('stroke', iconColor);
    });

    // Play/Pause icon inside audio-icon square variant
    const squareIconPolygon = selectedElement.querySelectorAll('.play-pause-icon polygon');
    squareIconPolygon.forEach((el) => {
      if (!selectedElement.querySelector('.play-pause-bg')) {
        el.setAttribute('fill', iconColor);
        el.setAttribute('stroke', iconColor);
      }
    });

    // Sync attributes
    selectedElement.setAttribute('data-fill-color', bgColor);
    selectedElement.setAttribute('data-stroke-color', strokeColor);
    selectedElement.setAttribute('data-icon-color', iconColor);

    if (onUpdate) onUpdate();
  }, [iconColor, bgColor, strokeColor, selectedElement]); // eslint-disable-line

  // Sync control toggles visibility to SVG element on canvas
  useEffect(() => {
    if (!selectedElement) return;

    // Play/Pause button
    const ppBtn = selectedElement.querySelector('.play-pause-btn') || selectedElement.querySelector('.play-pause-icon');
    if (ppBtn) {
      ppBtn.style.display = controlPlayPause ? '' : 'none';
    }

    // Skip prev/next
    const prevIcon = selectedElement.querySelector('.prev-icon');
    const nextIcon = selectedElement.querySelector('.next-icon');
    if (prevIcon) prevIcon.style.display = controlSkip ? '' : 'none';
    if (nextIcon) nextIcon.style.display = controlSkip ? '' : 'none';

    // Duration (time texts and progress bar)
    const curTime = selectedElement.querySelector('.audio-current-time');
    const totTime = selectedElement.querySelector('.audio-total-time');
    const progGroup = selectedElement.querySelector('.progress-group');
    if (curTime) curTime.style.display = controlDuration ? '' : 'none';
    if (totTime) totTime.style.display = controlDuration ? '' : 'none';
    if (progGroup) progGroup.style.display = controlDuration ? '' : 'none';

    // Volume control slider
    const volSlider = selectedElement.querySelector('.volume-slider-part');
    if (volSlider) volSlider.style.display = controlVolume ? '' : 'none';

    // Loop button
    const loopBtn = selectedElement.querySelector('.loop-icon');
    if (loopBtn) loopBtn.style.display = controlLoop ? '' : 'none';

    // Mute / volume icon
    const volIcon = selectedElement.querySelector('.volume-icon');
    if (volIcon) volIcon.style.display = controlMute ? '' : 'none';

    // Persist attributes
    updateAttribute('data-control-play-pause', controlPlayPause.toString());
    updateAttribute('data-control-skip', controlSkip.toString());
    updateAttribute('data-skip-seconds', skipSeconds.toString());
    updateAttribute('data-control-duration', controlDuration.toString());
    updateAttribute('data-control-volume', controlVolume.toString());
    updateAttribute('data-control-loop', controlLoop.toString());
    updateAttribute('data-control-mute', controlMute.toString());

    if (onUpdate) onUpdate();
  }, [
    controlPlayPause,
    controlSkip,
    skipSeconds,
    controlDuration,
    controlVolume,
    controlLoop,
    controlMute,
    selectedElement
  ]); // eslint-disable-line

  // Handle Play / Pause click
  const togglePlayPause = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(effectiveSrc);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      updatePlayPauseIconOnCanvas(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          updatePlayPauseIconOnCanvas(true);
        })
        .catch((e) => console.warn('Playback error:', e));
    }
  };

  // Step selector for Skip Forward/Backward
  const handlePrevStep = () => {
    const currentIndex = SKIP_STEPS.indexOf(skipSeconds);
    if (currentIndex > 0) {
      const newSec = SKIP_STEPS[currentIndex - 1];
      setSkipSeconds(newSec);
      updateAttribute('data-skip-seconds', newSec.toString());
    }
  };

  const handleNextStep = () => {
    const currentIndex = SKIP_STEPS.indexOf(skipSeconds);
    if (currentIndex < SKIP_STEPS.length - 1) {
      const newSec = SKIP_STEPS[currentIndex + 1];
      setSkipSeconds(newSec);
      updateAttribute('data-skip-seconds', newSec.toString());
    }
  };

  // Skip actions
  const handlePrev = () => {
    if (audioRef.current) {
      const targetTime = Math.max(0, audioRef.current.currentTime - skipSeconds);
      audioRef.current.currentTime = targetTime;
      if (selectedElement) {
        const curEl = selectedElement.querySelector('.audio-current-time');
        if (curEl) curEl.textContent = formatTime(targetTime);
        const dur = audioRef.current.duration;
        if (dur) {
          const progressBg = selectedElement.querySelector('.progress-bg');
          const bgX = progressBg ? parseFloat(progressBg.getAttribute('x') || '160') : 160;
          const maxWidth = progressBg ? parseFloat(progressBg.getAttribute('width') || '125') : 125;
          const ratio = targetTime / dur;
          const progressFill = selectedElement.querySelector('.progress-fill');
          const progressKnob = selectedElement.querySelector('.progress-knob');
          if (progressFill && progressKnob) {
            const fillWidth = ratio * maxWidth;
            progressFill.setAttribute('width', fillWidth.toString());
            progressKnob.setAttribute('cx', (bgX + fillWidth).toString());
          }
        }
      }
    }
  };

  const handleNext = () => {
    if (audioRef.current && audioRef.current.duration) {
      const targetTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + skipSeconds);
      audioRef.current.currentTime = targetTime;
      if (selectedElement) {
        const curEl = selectedElement.querySelector('.audio-current-time');
        if (curEl) curEl.textContent = formatTime(targetTime);
        const dur = audioRef.current.duration;
        if (dur) {
          const progressBg = selectedElement.querySelector('.progress-bg');
          const bgX = progressBg ? parseFloat(progressBg.getAttribute('x') || '160') : 160;
          const maxWidth = progressBg ? parseFloat(progressBg.getAttribute('width') || '125') : 125;
          const ratio = targetTime / dur;
          const progressFill = selectedElement.querySelector('.progress-fill');
          const progressKnob = selectedElement.querySelector('.progress-knob');
          if (progressFill && progressKnob) {
            const fillWidth = ratio * maxWidth;
            progressFill.setAttribute('width', fillWidth.toString());
            progressKnob.setAttribute('cx', (bgX + fillWidth).toString());
          }
        }
      }
    }
  };

  // Seek on canvas progress bar
  const handleProgressClick = (e, progressGroup) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const bg = progressGroup.querySelector('.progress-bg') || progressGroup.querySelector('rect');
    if (!bg) return;
    const rect = bg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const bgWidth = parseFloat(bg.getAttribute('width') || rect.width.toString()) || 125;
    const bgX = parseFloat(bg.getAttribute('x') || '160') || 160;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    if (selectedElement) {
      const curEl = selectedElement.querySelector('.audio-current-time');
      if (curEl) curEl.textContent = formatTime(newTime);
      const progressFill = selectedElement.querySelector('.progress-fill');
      const progressKnob = selectedElement.querySelector('.progress-knob');
      if (progressFill && progressKnob) {
        const fillW = ratio * bgWidth;
        progressFill.setAttribute('width', fillW.toString());
        progressKnob.setAttribute('cx', (bgX + fillW).toString());
      }
    }
  };

  // Mute toggle on canvas
  const handleVolumeIconClick = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
    updateAttribute('data-audio-muted', nextMuted.toString());
    updateMuteIconOnCanvas(nextMuted);
    if (onUpdate) onUpdate();
  };

  // Loop toggle on canvas
  const handleLoopIconClick = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (audioRef.current) {
      audioRef.current.loop = nextLoop;
    }
    updateAttribute('data-audio-loop', nextLoop.toString());
    updateLoopIconOnCanvas(nextLoop);
    if (onUpdate) onUpdate();
  };

  const actionsRef = useRef({
    togglePlayPause,
    handlePrev,
    handleNext,
    handleProgressClick,
    handleVolumeIconClick,
    handleLoopIconClick
  });

  useEffect(() => {
    actionsRef.current = {
      togglePlayPause,
      handlePrev,
      handleNext,
      handleProgressClick,
      handleVolumeIconClick,
      handleLoopIconClick
    };
  });

  // Attach canvas click delegation on selectedElement
  useEffect(() => {
    if (!selectedElement) return;

    const handleCanvasClick = (e) => {
      const target = e.target;

      // Play/Pause button
      if (target.closest('.play-pause-btn') || target.closest('.play-pause-icon')) {
        e.stopPropagation();
        actionsRef.current.togglePlayPause();
        return;
      }

      // Prev icon (skip back)
      if (target.closest('.prev-icon')) {
        e.stopPropagation();
        actionsRef.current.handlePrev();
        return;
      }

      // Next icon (skip forward)
      if (target.closest('.next-icon')) {
        e.stopPropagation();
        actionsRef.current.handleNext();
        return;
      }

      // Progress bar (seek)
      const progGroup = target.closest('.progress-group');
      if (progGroup) {
        e.stopPropagation();
        actionsRef.current.handleProgressClick(e, progGroup);
        return;
      }

      // Volume / Mute icon
      if (target.closest('.volume-icon')) {
        e.stopPropagation();
        actionsRef.current.handleVolumeIconClick();
        return;
      }

      // Loop icon
      if (target.closest('.loop-icon')) {
        e.stopPropagation();
        actionsRef.current.handleLoopIconClick();
        return;
      }
    };

    selectedElement.addEventListener('click', handleCanvasClick);
    return () => {
      selectedElement.removeEventListener('click', handleCanvasClick);
    };
  }, [selectedElement]);

  // File Upload / Replacement Handler
  const handleReplaceAudioClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    setIsUploading(true);
    try {
      const fileName = file.name;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' mb';
      const ext = fileName.split('.').pop()?.toUpperCase() || 'MP3';

      setAudioName(fileName);
      setAudioSizeText(sizeMb);
      setAudioFormatText(ext);
      updateAttribute('data-filename', fileName);
      updateAttribute('data-audio-size-text', sizeMb);
      updateAttribute('data-audio-format-text', ext);

      // Temporary local URL for immediate metadata loading & playback
      const localUrl = URL.createObjectURL(file);
      setAudioSrc(localUrl);
      updateAttribute('data-audio-src', localUrl);
      updateAttribute('data-interaction', 'audio');
      updateAttribute('data-interaction-value', localUrl);

      // Upload to backend if logged in
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const formData = new FormData();
          formData.append('emailId', user.emailId);
          if (paramVId) formData.append('v_id', paramVId);
          formData.append('type', 'audio');
          formData.append('file', file);

          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
          if (res.data?.url) {
            const serverUrl = resolveUploadsPath(res.data.url);
            setAudioSrc(serverUrl);
            updateAttribute('data-audio-src', serverUrl);
            updateAttribute('data-interaction-value', serverUrl);
          }
        } catch (uploadErr) {
          console.warn('Backend upload failed, kept local URL:', uploadErr);
        }
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('File selection error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove audio track
  const handleRemoveAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setAudioName('Audio Name.mp3');
    setAudioDurationText('00:00 Mins');
    setAudioSizeText('0.00 mb');
    setAudioFormatText('MP3');
    setAudioSrc('');
    updateAttribute('data-filename', 'Audio Name.mp3');
    updateAttribute('data-audio-duration-text', '00:00 Mins');
    updateAttribute('data-audio-size-text', '0.00 mb');
    updateAttribute('data-audio-format-text', 'MP3');
    updateAttribute('data-audio-src', '');
    updatePlayPauseIconOnCanvas(false);
    if (selectedElement) {
      const curEl = selectedElement.querySelector('.audio-current-time');
      if (curEl) curEl.textContent = '0:00';
      const totEl = selectedElement.querySelector('.audio-total-time');
      if (totEl) totEl.textContent = '0:00';
      const progressFill = selectedElement.querySelector('.progress-fill');
      const progressKnob = selectedElement.querySelector('.progress-knob');
      if (progressFill && progressKnob) {
        const progressBg = selectedElement.querySelector('.progress-bg');
        const bgX = progressBg ? parseFloat(progressBg.getAttribute('x') || '160') : 160;
        progressFill.setAttribute('width', '0');
        progressKnob.setAttribute('cx', bgX.toString());
      }
    }
    if (onUpdate) onUpdate();
  };

  // Effect Handlers for Drop Shadow
  const handleSetActiveEffects = (updater) => {
    setActiveEffects((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const hasDropShadow = next.includes('Drop Shadow');

      if (selectedElement) {
        selectedElement.setAttribute('data-effect-drop-shadow', hasDropShadow ? 'true' : 'false');
        syncLiveFilters(selectedElement);
      }
      updateAttribute('data-effect-drop-shadow', hasDropShadow ? 'true' : 'false');
      if (onUpdate) onUpdate();
      return next;
    });
  };

  const handleSetEffectSettings = (updater) => {
    setEffectSettings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const ds = next['Drop Shadow'] || {};

      if (selectedElement) {
        selectedElement.setAttribute('data-effect-drop-shadow-x', (ds.x ?? 2).toString());
        selectedElement.setAttribute('data-effect-drop-shadow-y', (ds.y ?? 2).toString());
        selectedElement.setAttribute('data-effect-drop-shadow-blur', (ds.blur ?? 4).toString());
        selectedElement.setAttribute('data-effect-drop-shadow-spread', (ds.spread ?? 0).toString());
        selectedElement.setAttribute('data-effect-drop-shadow-color', ds.color || '#000000');
        selectedElement.setAttribute('data-effect-drop-shadow-opacity', (ds.opacity ?? 35).toString());
        syncLiveFilters(selectedElement);
      }

      updateAttribute('data-effect-drop-shadow-x', (ds.x ?? 2).toString());
      updateAttribute('data-effect-drop-shadow-y', (ds.y ?? 2).toString());
      updateAttribute('data-effect-drop-shadow-blur', (ds.blur ?? 4).toString());
      updateAttribute('data-effect-drop-shadow-spread', (ds.spread ?? 0).toString());
      updateAttribute('data-effect-drop-shadow-color', ds.color || '#000000');
      updateAttribute('data-effect-drop-shadow-opacity', (ds.opacity ?? 35).toString());

      if (onUpdate) onUpdate();
      return next;
    });
  };

  const COLOR_MAP = {
    iconColor: {
      value: iconColor,
      onChange: (val) => {
        setIconColor(val);
        updateAttribute('data-icon-color', val);
      }
    },
    bgColor: {
      value: bgColor,
      onChange: (val) => {
        setBgColor(val);
        updateAttribute('data-fill-color', val);
      }
    },
    strokeColor: {
      value: strokeColor,
      onChange: (val) => {
        setStrokeColor(val);
        updateAttribute('data-stroke-color', val);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-[0.6vw] font-sans text-gray-800 pt-[0.2vw] pr-[0.2vw] select-none">
      {/* ── 1. Upload Audio Section ── */}
      <SectionHeader title="Upload Audio" />

      <div className="flex items-center gap-[0.8vw] pl-[0.5vw] pr-[0.2vw] py-[0.2vw]">
        {/* Blue Squircle Music App Icon with subtle 3D shadow */}
        <div
          className="w-[3.8vw] h-[3.8vw] rounded-[0.8vw] bg-gradient-to-br from-[#29b6f6] to-[#0288d1] flex items-center justify-center relative overflow-hidden shadow-[0_4px_12px_rgba(2,136,209,0.25)] flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          onClick={togglePlayPause}
          title={isPlaying ? "Pause Audio" : "Play Audio"}
        >
          {isPlaying ? (
            <Pause className="w-[1.6vw] h-[1.6vw] text-white fill-white drop-shadow-md animate-pulse" />
          ) : (
            <svg viewBox="0 0 64 64" className="w-[2.3vw] h-[2.3vw]">
              <defs>
                <filter id="music-note-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="2" dy="2.5" stdDeviation="1.5" floodColor="#01579b" floodOpacity="0.45" />
                </filter>
              </defs>
              <path
                d="M26 18v22.5c-1.3-.9-3-.1.4-4.8 1.8-1.8 4.2-1.9 6.2-.8 2 1.2 2.6 3.6.8 5.4-1.8 1.8-4.2 1.9-6.2.8-.5-.3-1-.8-1.4-1.4V24.5l18-4.5v16c-1.3-.9-3-.1.4-4.8 1.8-1.8 4.2-1.9 6.2-.8 2 1.2 2.6 3.6.8 5.4-1.8 1.8-4.2 1.9-6.2.8-.5-.3-1-.8-1.4-1.4V14L26 18Z"
                fill="white"
                filter="url(#music-note-shadow)"
              />
            </svg>
          )}
        </div>

        {/* Audio Information & Action Buttons */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="text-[0.85vw] font-medium text-gray-800 truncate" title={audioName}>
            {audioName}
          </div>

          <div className="text-[0.7vw] text-gray-400 font-medium flex items-center gap-[0.35vw] mt-[0.1vw]">
            <span>{audioDurationText}</span>
            <span className="text-[0.6vw]">•</span>
            <span>{audioSizeText}</span>
            <span className="text-[0.6vw]">•</span>
            <span>{audioFormatText}</span>
          </div>

          <div className="flex items-center gap-[0.4vw] mt-[0.4vw]">
            <button
              type="button"
              onClick={handleReplaceAudioClick}
              disabled={isUploading}
              className="px-[0.75vw] py-[0.25vw] bg-white border border-gray-200 hover:border-gray-300 rounded-[0.4vw] text-[0.75vw] text-gray-700 font-medium shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {isUploading ? 'Uploading...' : 'Replace Audio'}
            </button>

            <button
              type="button"
              onClick={handleRemoveAudio}
              className="w-[1.8vw] h-[1.8vw] bg-white border border-gray-200 hover:border-red-300 rounded-[0.4vw] flex items-center justify-center text-gray-400 hover:text-red-500 shadow-2xs hover:bg-red-50 transition-colors cursor-pointer"
              title="Delete Audio"
            >
              <Trash2 size="0.85vw" />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*,video/*"
        className="hidden"
      />

      {/* ── 2. Audio Properties Section ── */}
      <SectionHeader title="Audio Properties" />

      {/* Player Style */}
      <PropertyRow label="Player Style">
        <CustomDropdown
          value={playerStyle}
          options={PLAYER_STYLE_OPTIONS}
          onChange={(val) => {
            setPlayerStyle(val);
            updateAttribute('data-audio-template', val);
            if (onUpdate) onUpdate();
          }}
        />
      </PropertyRow>

      {/* Playback Speed */}
      <PropertyRow label="Playback Speed">
        <CustomDropdown
          value={playbackSpeed}
          options={SPEED_OPTIONS}
          onChange={(val) => {
            setPlaybackSpeed(val);
            updateAttribute('data-audio-speed', val);
            if (audioRef.current) {
              audioRef.current.playbackRate = parseFloat(val) || 1;
            }
            if (onUpdate) onUpdate();
          }}
        />
      </PropertyRow>

      {/* Behaviour */}
      <PropertyRow label="Behaviour">
        <CustomDropdown
          value={behaviour}
          options={BEHAVIOUR_OPTIONS}
          onChange={(val) => {
            setBehaviour(val);
            updateAttribute('data-audio-behaviour', val);
            if (val === 'Loop on Page') {
              setIsLooping(true);
              if (audioRef.current) audioRef.current.loop = true;
              updateAttribute('data-audio-loop', 'true');
              updateLoopIconOnCanvas(true);
            }
            if (onUpdate) onUpdate();
          }}
        />
      </PropertyRow>

      {/* Default Volume */}
      <PropertyRow label="Default Volume">
        <div className="flex items-center gap-[0.5vw] w-full h-[2.5vw]">
          <Volume2 className="w-[1vw] h-[1vw] text-[#E05638] shrink-0" />
          <div className="flex-1 flex items-center relative">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={defaultVolume}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setDefaultVolume(val);
                updateAttribute('data-audio-volume', (val / 100).toString());
                if (audioRef.current) {
                  audioRef.current.volume = val / 100;
                  if (val > 0 && isMuted) {
                    setIsMuted(false);
                    audioRef.current.muted = false;
                    updateAttribute('data-audio-muted', 'false');
                    updateMuteIconOnCanvas(false);
                  }
                }
                if (selectedElement) {
                  const volFill = selectedElement.querySelector('.volume-fill');
                  const volKnob = selectedElement.querySelector('.volume-knob');
                  if (volFill && volKnob) {
                    const maxWidth = 75;
                    const fillW = (val / 100) * maxWidth;
                    volFill.setAttribute('width', fillW.toString());
                    volKnob.setAttribute('cx', (370 + fillW).toString());
                  }
                }
                if (onUpdate) onUpdate();
              }}
              className="audio-volume-slider w-full h-[0.25vw] rounded-full appearance-none cursor-pointer outline-none transition-all"
              style={{
                background: `linear-gradient(to right, #E05638 0%, #E05638 ${defaultVolume}%, #E5E7EB ${defaultVolume}%, #E5E7EB 100%)`
              }}
            />
          </div>
          <span className="text-[0.8vw] text-gray-800 font-medium w-[2.8vw] text-right shrink-0">
            {defaultVolume} %
          </span>
          <style>{`
            .audio-volume-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 0.85vw;
              height: 0.85vw;
              border-radius: 50%;
              background: #ffffff;
              border: 2px solid #E05638;
              cursor: pointer;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
              transition: transform 0.1s ease;
            }
            .audio-volume-slider::-webkit-slider-thumb:hover {
              transform: scale(1.15);
            }
            .audio-volume-slider::-moz-range-thumb {
              width: 0.85vw;
              height: 0.85vw;
              border-radius: 50%;
              background: #ffffff;
              border: 2px solid #E05638;
              cursor: pointer;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            }
          `}</style>
        </div>
      </PropertyRow>

      {/* ── 3. Audio Player Controls Sub-section ── */}
      <SectionHeader title="Audio Player Controls" />

      {/* Play/Pause Button */}
      <div className="flex items-center justify-between pl-[0.5vw] pr-[0.2vw] h-[2.2vw]">
        <span className="text-[0.78vw] text-gray-700 font-medium">Play/Pause Button</span>
        <Toggle checked={controlPlayPause} onChange={setControlPlayPause} />
      </div>

      {/* Skip Forward/Backward */}
      <div className="flex items-center justify-between pl-[0.5vw] pr-[0.2vw] h-[2.2vw]">
        <span className="text-[0.78vw] text-gray-700 font-medium">Skip Forward/Backward</span>
        <div className="flex items-center gap-[0.5vw]">
          {/* Stepper < 5 sec > */}
          <div className="h-[2vw] flex items-center border border-gray-200 rounded-[0.4vw] bg-white px-[0.35vw] shadow-2xs">
            <button
              type="button"
              onClick={handlePrevStep}
              className="text-gray-400 hover:text-gray-700 p-[0.1vw] transition-colors cursor-pointer"
              title="Decrease skip duration"
            >
              <ChevronLeft className="w-[0.75vw] h-[0.75vw]" />
            </button>
            <span className="text-[0.75vw] text-gray-800 font-medium px-[0.3vw] whitespace-nowrap">
              {skipSeconds} sec
            </span>
            <button
              type="button"
              onClick={handleNextStep}
              className="text-gray-400 hover:text-gray-700 p-[0.1vw] transition-colors cursor-pointer"
              title="Increase skip duration"
            >
              <ChevronRight className="w-[0.75vw] h-[0.75vw]" />
            </button>
          </div>
          <Toggle checked={controlSkip} onChange={setControlSkip} />
        </div>
      </div>

      {/* Duration */}
      <div className="flex items-center justify-between pl-[0.5vw] pr-[0.2vw] h-[2.2vw]">
        <span className="text-[0.78vw] text-gray-700 font-medium">Duration</span>
        <Toggle checked={controlDuration} onChange={setControlDuration} />
      </div>

      {/* Volume Control */}
      <div className="flex items-center justify-between pl-[0.5vw] pr-[0.2vw] h-[2.2vw]">
        <span className="text-[0.78vw] text-gray-700 font-medium">Volume Control</span>
        <Toggle checked={controlVolume} onChange={setControlVolume} />
      </div>

      {/* Loop Button */}
      <div className="flex items-center justify-between pl-[0.5vw] pr-[0.2vw] h-[2.2vw]">
        <span className="text-[0.78vw] text-gray-700 font-medium">Loop Button</span>
        <Toggle checked={controlLoop} onChange={setControlLoop} />
      </div>

      {/* Mute */}
      <div className="flex items-center justify-between pl-[0.5vw] pr-[0.2vw] h-[2.2vw]">
        <span className="text-[0.78vw] text-gray-700 font-medium">Mute</span>
        <Toggle checked={controlMute} onChange={setControlMute} />
      </div>

      {/* ── 4. Colors Section ── */}
      <SectionHeader title="Colors" />

      {/* Icon Color */}
      <PropertyRow label="Icon Color">
        <ColorInput
          color={iconColor}
          onChange={(val) => {
            setIconColor(val);
            updateAttribute('data-icon-color', val);
          }}
          opacity={100}
          onOpenPicker={() => setActiveColorPicker((prev) => (prev === 'iconColor' ? null : 'iconColor'))}
          isActive={activeColorPicker === 'iconColor'}
        />
      </PropertyRow>

      {/* Bg Color */}
      <PropertyRow label="Bg Color">
        <ColorInput
          color={bgColor}
          onChange={(val) => {
            setBgColor(val);
            updateAttribute('data-fill-color', val);
          }}
          opacity={100}
          onOpenPicker={() => setActiveColorPicker((prev) => (prev === 'bgColor' ? null : 'bgColor'))}
          isActive={activeColorPicker === 'bgColor'}
        />
      </PropertyRow>

      {/* Stroke Color */}
      <PropertyRow label="Stroke Color">
        <ColorInput
          color={strokeColor}
          onChange={(val) => {
            setStrokeColor(val);
            updateAttribute('data-stroke-color', val);
          }}
          opacity={100}
          onOpenPicker={() => setActiveColorPicker((prev) => (prev === 'strokeColor' ? null : 'strokeColor'))}
          isActive={activeColorPicker === 'strokeColor'}
        />
      </PropertyRow>

      {/* ── 5. Effects Section ── */}
      <SectionHeader title="Effects" />

      <Effect
        isShape={false}
        openSubSection={openSubSection}
        setOpenSubSection={setOpenSubSection}
        activeEffects={activeEffects}
        setActiveEffects={handleSetActiveEffects}
        effectSettings={effectSettings}
        setEffectSettings={handleSetEffectSettings}
        activeColorPicker={activeColorPicker}
        setActiveColorPicker={setActiveColorPicker}
        showDetailedPicker={showDetailedPicker}
        setShowDetailedPicker={setShowDetailedPicker}
        hideBlur={true}
        hideInnerShadow={true}
        hideHeader={true}
      />

      {/* ── ColorPicker Portal Popup ── */}
      {activeColorPicker && COLOR_MAP[activeColorPicker] && createPortal(
        <div
          className="fixed z-[5000]"
          style={{
            top: '50%',
            right: '19.5vw',
            transform: 'translateY(-50%)'
          }}
        >
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setActiveColorPicker(null)}
          />
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <ColorPicker
              color={COLOR_MAP[activeColorPicker].value}
              onChange={(newVal) => {
                if (COLOR_MAP[activeColorPicker]) {
                  COLOR_MAP[activeColorPicker].onChange(newVal);
                }
              }}
              opacity={100}
              onOpacityChange={() => {}}
              onClose={() => setActiveColorPicker(null)}
              disableGradient={true}
              colorsOnPage={[]}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AudioProperties;
