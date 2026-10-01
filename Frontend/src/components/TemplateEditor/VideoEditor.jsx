// VideoEditor.jsx - Context-sensitive video editing panel
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { resolveUploadsPath } from "../../utils/supabaseUtils";
import { Icon } from "@iconify/react";

import {
  Video as VideoIcon,
  Upload,
  RefreshCw,
  Trash2,
  Sliders,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Replace,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Video,
  X,
} from "lucide-react";
import ReplaceMediaModal from "./ReplaceMediaModal";
import Color from './Color';

import Adjustment from './Adjustment';
import Effect from './Effect';
import ColorPicker, { parseGradient } from "./ColorPicker";
import { generateGradientString } from "../CustomizedEditor/AppearanceShared";
import { syncGradient, getEmbedVideoUrl, detectMediaType } from './editorUtils';
import { createPortal } from "react-dom";

// Switch toggle component (matches SlideshowProperties style)
const Switch = ({ enabled, onChange, disabled }) => (
  <button
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled) {
        onChange(!enabled);
      }
    }}
    className={`relative block w-[1.8vw] h-[1vw] rounded-[1vw] transition-all duration-200 ease-in-out shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.3)] outline-none shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${enabled ? 'bg-[#4A3AFF]' : 'bg-[#bbbbbb]'}`}
  >
    <div
      className={`absolute top-[0.1vw] w-[0.8vw] h-[0.8vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.4)] ${enabled ? 'left-[0.9vw]' : 'left-[0.1vw]'}`}
    />
  </button>
);


const debounce = (fn, delay = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

const CustomSelect = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 custom-select-container" ref={dropdownRef}>
      <div
        className="flex items-center justify-between w-full h-[2vw] px-[0.6vw] border border-gray-200 rounded-[0.4vw] cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-[0.75vw] text-gray-600">{value}</span>
        <Icon icon={isOpen ? "lucide:chevron-up" : "lucide:chevron-down"} className="w-[0.9vw] h-[0.9vw] text-gray-500 pointer-events-none" />
      </div>
      {isOpen && (
        <div className="absolute top-[100%] left-0 mt-[0.2vw] w-full bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-50 py-[0.3vw]">
          {options.map((opt) => (
            <div
              key={opt}
              className="px-[0.6vw] py-[0.4vw] text-[0.75vw] text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const VideoEditor = ({
  selectedElement,
  selectedLayerId,
  activePageIndex,
  onUpdate,
  onDeleteLayer,
  onPopupPreviewUpdate,
  currentPageVId,
  flipbookVId,
  folderName,
  flipbookName,
  activePopupElement,
  onPopupUpdate,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  showInteraction = true,
  pages
}) => {
  const { v_id: paramVId } = useParams();
  const activeVId = flipbookVId || paramVId;

  const fileInputRef = useRef(null);
  const [openGallery, setOpenGallery] = useState(false);
  const [tab, setTab] = useState("gallery");
  const coverInputRef = useRef(null);

  const [previewSrc, setPreviewSrc] = useState(null);
  const [posterSrc, setPosterSrc] = useState(null);
  const [videoType, setVideoType] = useState("Fit");
  const [showVideoTypeDropdown, setShowVideoTypeDropdown] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [loop, setLoop] = useState(false);
  const [controls, setControls] = useState(true);
  const [controlsSize, setControlsSize] = useState(100);
  const [muted, setMuted] = useState(false);

  const [startTime, setStartTime] = useState("00:00:00");
  const [endTime, setEndTime] = useState("08:52:21");
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0x");
  const [resumeBehavior, setResumeBehavior] = useState("Resume from Last Position");
  const [playVideoWhile, setPlayVideoWhile] = useState("Auto Play on Page Open");
  const [defaultVolume, setDefaultVolume] = useState(80);
  const [disableFullScreen, setDisableFullScreen] = useState(false);

  // Video Player Controls toggles
  const [playPauseButton, setPlayPauseButton] = useState(true);
  const [skipButton, setSkipButton] = useState(true);
  const [progressBar, setProgressBar] = useState(true);
  const [loopButtonControl, setLoopButtonControl] = useState(true);
  const [fullscreenButtonControl, setFullscreenButtonControl] = useState(true);
  const [playbackSpeedMenu, setPlaybackSpeedMenu] = useState(true);
  const [volumeControl, setVolumeControl] = useState(true);
  const [downloadButton, setDownloadButton] = useState(true);

  const [opacity, setOpacity] = useState(100);
  const [coverOption, setCoverOption] = useState("auto"); // "upload" or "auto"
  const [activeSection, setActiveSection] = useState('main');
  const [showGallery, setShowGallery] = useState(false);

  const [backgroundColor, setBackgroundColor] = useState({
    fill: '#000000', fillOpacity: 100, stroke: 'transparent', strokeOpacity: 100, strokeType: 'Solid', strokeWeight: 0
  });
  const [filters, setFilters] = useState({ exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 });
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);

  const [radius, setRadius] = useState({ tl: 0, tr: 0, br: 0, bl: 0 });
  const [isRadiusLinked, setIsRadiusLinked] = useState(true);
  const [activeEffects, setActiveEffects] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': { color: '#000000', opacity: 35, x: 2, y: 2, blur: 1, spread: 0 },
    'Inner Shadow': { color: '#000000', opacity: 35, x: 2, y: 2, blur: 1, spread: 0 },
    'Blur': { blur: 0.5, spread: 0 }
  });
  const [openSubSection, setOpenSubSection] = useState(null);
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'fill' | 'stroke' | null

  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);

  const [inputUrl, setInputUrl] = useState("");
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [urlAddProgress, setUrlAddProgress] = useState(0);
  const [isUrlAdded, setIsUrlAdded] = useState(false);

  const isUpdatingDOM = useRef(false);
  const isUpdatingDOMTimeoutRef = useRef(null);
  const isHydrating = useRef(true);
  const onUpdateTimerRef = useRef(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const [videoResolution, setVideoResolution] = useState('');
  const [videoFileSize, setVideoFileSize] = useState('');
  const [videoDurationState, setVideoDurationState] = useState('');

  useEffect(() => {
    if (!previewSrc) {
      setVideoResolution('');
      setVideoFileSize('');
      setVideoDurationState('');
      return;
    }

    const formatBytes = (bytes, decimals = 2) => {
      if (!+bytes) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    if (previewSrc.includes("youtube.com") || previewSrc.includes("youtu.be")) {
      setVideoResolution('');
      setVideoFileSize('URL');
      return;
    }

    const video = document.createElement('video');
    video.src = previewSrc;
    video.onloadedmetadata = () => {
      setVideoResolution(`${video.videoWidth} x ${video.videoHeight}`);
      if (video.duration && video.duration !== Infinity) {
        setVideoDurationState(video.duration);
      }
    };

    if (previewSrc.startsWith('data:')) {
      const base64str = previewSrc.split(',')[1];
      if (base64str) {
        const bytes = Math.round(base64str.length * (3 / 4));
        setVideoFileSize(formatBytes(bytes, 1));
      }
    } else if (previewSrc.startsWith('blob:')) {
      fetch(previewSrc)
        .then(res => res.blob())
        .then(blob => {
          setVideoFileSize(formatBytes(blob.size, 1));
        })
        .catch(() => {
          setVideoFileSize('Unknown Size');
        });
    } else {
      fetch(previewSrc, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            const contentLength = res.headers.get('content-length');
            if (contentLength) {
              setVideoFileSize(formatBytes(parseInt(contentLength, 10), 1));
            } else {
              setVideoFileSize('Unknown Size');
            }
          } else {
            setVideoFileSize('Unknown Size');
          }
        })
        .catch(() => {
          setVideoFileSize('Unknown Size');
        });
    }
  }, [previewSrc]);

  // Helper to get colors used on the current page
  const colorsOnPage = useMemo(() => {
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const elements = doc.querySelectorAll('[data-fill-color], [data-stroke-color]');
    const colors = new Set();
    elements.forEach(el => {
      const fill = el.getAttribute('data-fill-color');
      const stroke = el.getAttribute('data-stroke-color');
      if (fill && fill !== 'none' && fill !== '#' && !fill.includes('gradient')) colors.add(fill.toUpperCase());
      if (stroke && stroke !== 'none' && stroke !== '#' && !stroke.includes('gradient')) colors.add(stroke.toUpperCase());
    });
    // Add default white and black if not present
    colors.add('#FFFFFF');
    colors.add('#000000');
    return Array.from(colors).slice(0, 12);
  }, [selectedElement, pages]);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const debouncedUpdate = useMemo(
    () => debounce((...args) => onUpdateRef.current?.(...args), 800),
    [],
  );

  const galleryPreviews = useMemo(
    () => [
      "https://www.abcconsultants.in/wp-content/uploads/2023/07/Industrial.jpg",
      "https://www.shutterstock.com/image-photo/engineers-discussing-project-outdoors-industrial-260nw-2624485537.jpg",
      "https://thumbs.dreamstime.com/b/professional-people-workers-working-modern-technology-robotic-industry-automation-manufacturing-engineer-robot-arm-assembly-413769130.jpg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjnXGV5m5a_3qpSA5aZOiTI2cxP12fiECP7A&s",
    ],
    [],
  );

  const lastElementRef = useRef(null);

  const syncStateFromDOM = useCallback((force = false) => {
    // Re-resolve the live element from the active page container
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;

    if (!liveElement) return;

    // Only skip if it's the SAME element and we are currently updating the DOM.
    if (isUpdatingDOM.current && !force && liveElement === lastElementRef.current) return;
    lastElementRef.current = liveElement;

    const container = liveElement.tagName === "FOREIGNOBJECT" ? liveElement : (liveElement.querySelector("foreignObject") || liveElement.closest("foreignObject"));
    const target = container ? container.querySelector("video, iframe") : (liveElement.tagName === "VIDEO" || liveElement.tagName === "IFRAME" ? liveElement : liveElement.querySelector("video, iframe"));

    if (!target) return;
    const visualTarget = container || target;

    // Dimensions state removed to allow interact.js to manage it naturally without reversions

    // 2. Opacity
    const op = parseFloat(target.getAttribute('data-opacity') || target.style.opacity || target.getAttribute('opacity') || visualTarget.getAttribute('data-opacity') || visualTarget.style.opacity || visualTarget.getAttribute('opacity') || "1");
    setOpacity(Math.round(op * 100));

    // 3. Colors & Stroke
    let fill = liveElement.getAttribute('data-fill-color');
    if (!fill) {
      fill = visualTarget.getAttribute('data-bg-color') || visualTarget.style.backgroundColor || visualTarget.getAttribute('fill');
    }
    fill = fill || 'transparent';

    const stColor = liveElement.getAttribute('data-stroke-color') || visualTarget.getAttribute('data-stroke-color') || visualTarget.style.borderColor || visualTarget.getAttribute('stroke') || "transparent";
    const stWeight = parseFloat(liveElement.getAttribute('data-stroke-width') || visualTarget.getAttribute('data-stroke-width') || visualTarget.style.borderWidth || visualTarget.getAttribute('stroke-width') || "0");
    const dashData = liveElement.getAttribute('stroke-dasharray') || visualTarget.getAttribute('stroke-dasharray') || 'none';
    const isDashed = dashData !== 'none' && dashData !== '';

    let dashLen = 10, dashGap = 10;
    if (isDashed) {
      const parts = dashData.split(',');
      const parsedLen = parseInt(parts[0]);
      dashLen = isNaN(parsedLen) ? 10 : parsedLen;
      const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
      dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
    }
    const dashPos = visualTarget.getAttribute('data-stroke-position') || 'Center';
    const dashCap = visualTarget.getAttribute('stroke-linecap') || 'butt';

    const existingStrokeType = visualTarget.getAttribute('data-stroke-type') || liveElement.getAttribute('data-stroke-type');
    const actualStrokeType = existingStrokeType && existingStrokeType !== 'Dashed' ? existingStrokeType : 'Solid';

    setBackgroundColor(prev => {
      const next = {
        fill: fill === 'none' ? 'transparent' : fill,
        fillOpacity: 100,
        stroke: stColor === 'none' ? 'transparent' : stColor,
        strokeOpacity: 100,
        strokeType: actualStrokeType,
        strokeDashStyle: isDashed ? 'Dashed' : 'Solid',
        strokeGradientType: visualTarget.getAttribute('data-stroke-gradient-type') || 'linear',
        strokeStops: visualTarget.getAttribute('data-stroke-stops'),
        strokeAngle: parseFloat(visualTarget.getAttribute('data-stroke-angle') || '0'),
        strokeRadius: parseFloat(visualTarget.getAttribute('data-stroke-radius') || '100'),
        strokeWeight: stWeight,
        strokeDashLength: dashLen,
        strokeDashGap: dashGap,
        strokePosition: dashPos,
        strokeLinecap: dashCap
      };
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });

    // Filters
    setFilters(prev => {
      const next = {
        exposure: parseFloat(visualTarget.getAttribute('data-effect-exposure') || '0'),
        contrast: parseFloat(visualTarget.getAttribute('data-effect-contrast') || '0'),
        saturation: parseFloat(visualTarget.getAttribute('data-effect-saturation') || '0'),
        temperature: parseFloat(visualTarget.getAttribute('data-effect-temperature') || '0'),
        tint: parseFloat(visualTarget.getAttribute('data-effect-tint') || '0'),
        highlights: parseFloat(visualTarget.getAttribute('data-effect-highlights') || '0'),
        shadows: parseFloat(visualTarget.getAttribute('data-effect-shadows') || '0'),
      };
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });

    // 4. Radius
    const brData = visualTarget.getAttribute('data-radius');
    if (brData) {
      try {
        const parsed = JSON.parse(brData);
        setRadius(prev => JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed);
      } catch (e) { }
    } else {
      const br = visualTarget.style.borderRadius || "";
      if (br) {
        const parts = br.split(' ').map(p => parseInt(p) || 0);
        let nextRadius = null;
        if (parts.length === 1) nextRadius = { tl: parts[0], tr: parts[0], br: parts[0], bl: parts[0] };
        else if (parts.length === 4) nextRadius = { tl: parts[0], tr: parts[1], br: parts[2], bl: parts[3] };
        if (nextRadius) {
          setRadius(prev => JSON.stringify(prev) === JSON.stringify(nextRadius) ? prev : nextRadius);
        }
      }
    }

    // 5. Effects
    const effectsData = visualTarget.getAttribute('data-effects');
    if (effectsData) {
      try {
        const parsed = JSON.parse(effectsData);
        if (parsed.activeEffects) {
          setActiveEffects(prev => JSON.stringify(prev) === JSON.stringify(parsed.activeEffects) ? prev : parsed.activeEffects);
        }
        if (parsed.effectSettings) {
          setEffectSettings(prev => {
            const next = { ...prev, ...parsed.effectSettings };
            return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
          });
        }
      } catch (e) { }
    }

    // 6. Media Specific
    if (target.tagName === "VIDEO") {
      const src = target.currentSrc || target.src || target.querySelector("source")?.src || null;
      setPreviewSrc(src);

      const origUrl = target.getAttribute('data-original-url') || liveElement.getAttribute('data-original-url') || "";
      const isFocused = document.activeElement && document.activeElement.id === 'video-url-input';
      if (!isFocused) {
        setInputUrl(origUrl);
        setIsUrlAdded(!!origUrl);
      }

      const poster = target.getAttribute('poster') || target.poster || null;
      setPosterSrc(poster || null);

      const posterType = target.getAttribute('data-poster-type');
      if (posterType === 'auto' || posterType === 'upload') {
        setCoverOption(posterType);
      } else {
        // Fallback for older elements without the attribute
        setCoverOption(poster ? 'upload' : 'auto');
      }
      setAutoplay(target.autoplay || target.hasAttribute('autoplay'));
      setLoop(target.loop || target.hasAttribute('loop'));
      setControls(target.controls || !target.classList.contains('hide-controls'));
      setMuted(target.muted || target.hasAttribute('muted'));

      setStartTime(target.getAttribute('data-start-time') || '');
      setEndTime(target.getAttribute('data-end-time') || '');
      setPlayVideoWhile(target.getAttribute('data-play-video-while') || 'Auto Play on Page Open');
      const pSpeed = target.getAttribute('data-playback-speed');
      if (pSpeed) {
        setPlaybackSpeed(pSpeed);
      } else if (target.playbackRate) {
        setPlaybackSpeed(target.playbackRate % 1 === 0 ? `${target.playbackRate}.0x` : `${target.playbackRate}x`);
      } else {
        setPlaybackSpeed('1.0x');
      }
      setResumeBehavior(target.getAttribute('data-resume-behavior') || 'Resume from Last Position');
      const dVol = target.getAttribute('data-default-volume');
      setDefaultVolume(dVol ? parseInt(dVol) : (target.volume !== undefined ? Math.round(target.volume * 100) : 100));
      setDisableFullScreen(target.getAttribute('data-disable-fullscreen') === 'true');

      // Video Player Controls
      setPlayPauseButton(target.getAttribute('data-show-play-pause') !== 'false');
      setSkipButton(target.getAttribute('data-show-skip-button') !== 'false');
      setProgressBar(target.getAttribute('data-show-progress-bar') !== 'false');
      setLoopButtonControl(target.getAttribute('data-show-loop-button') !== 'false');
      setFullscreenButtonControl(target.getAttribute('data-show-fullscreen-button') !== 'false');
      setPlaybackSpeedMenu(target.getAttribute('data-show-playback-speed-menu') !== 'false');
      setVolumeControl(target.getAttribute('data-show-volume-control') !== 'false');
      setDownloadButton(target.getAttribute('data-show-download-button') !== 'false');

      const rawCtrlSize = target.getAttribute('data-controls-size');
      const ctrlSize = rawCtrlSize ? parseInt(rawCtrlSize) : 100;
      setControlsSize(isNaN(ctrlSize) ? 100 : Math.max(0, Math.min(100, ctrlSize)));
      const rawFit = target.getAttribute('data-object-fit') || target.style.objectFit || 'contain';
      const reverseMap = { 'contain': 'Fit', 'cover': 'Fill', 'fill': 'Stretch' };
      setVideoType(reverseMap[rawFit] || (rawFit.charAt(0).toUpperCase() + rawFit.slice(1)) || 'Fit');
    } else if (target.tagName === "IFRAME") {
      setPreviewSrc(target.src || null);

      if (target.src && (target.src.includes("youtube.com") || target.src.includes("youtu.be"))) {
        try {
          const urlObj = new URL(target.src);
          setAutoplay(urlObj.searchParams.get("autoplay") === "1");
          const urlControls = urlObj.searchParams.get("controls");
          const dataControls = target.getAttribute('data-show-controls') || liveElement.getAttribute('data-show-controls');
          if (dataControls !== null && dataControls !== undefined) {
            setControls(dataControls !== "false");
          } else {
            setControls(urlControls !== "0"); // Default is true unless explicitly 0
          }
          setLoop(urlObj.searchParams.get("loop") === "1");
          setMuted(urlObj.searchParams.get("mute") === "1");
        } catch (e) {}
      }

      const origUrl = target.getAttribute('data-original-url') || liveElement.getAttribute('data-original-url') || "";
      const isFocused = document.activeElement && document.activeElement.id === 'video-url-input';
      if (!isFocused) {
        setInputUrl(origUrl);
        setIsUrlAdded(!!origUrl);
      }

      setPosterSrc(null);
      setCoverOption('auto');
    }

    setTimeout(() => {
      isHydrating.current = false;
      setUpdateTrigger(prev => prev + 1);
    }, 200);
  }, [selectedElement]);

  useEffect(() => {
    if (!selectedElement) return;
    const observer = new MutationObserver((mutations) => {
      if (isUpdatingDOM.current) return;
      const relevantMutation = mutations.some(m => m.type === 'attributes');
      if (relevantMutation) syncStateFromDOM();

      const needsVisuals = mutations.some(m => m.attributeName === 'data-crop-data' || m.attributeName === 'data-object-fit' || m.attributeName === 'data-width' || m.attributeName === 'data-height');
      if (needsVisuals) {
        setUpdateTrigger(prev => prev + 1);
      }
    });
    observer.observe(selectedElement, { attributes: true, subtree: true });
    isHydrating.current = true;
    syncStateFromDOM(true);
    return () => {
      observer.disconnect();
      isUpdatingDOM.current = false;
    };
  }, [selectedElement, selectedLayerId, activePageIndex, syncStateFromDOM]);

  // Close pickers/popups on click-outside or Escape (matches ShapeProperties)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeColorPicker || showDetailedPicker || showStrokeSettings) {
          setActiveColorPicker(null);
          setShowDetailedPicker(false);
          setShowStrokeSettings(false);
          setIsStrokeStyleOpen(false);
        }
      }
    };
    const handleClickOutside = (e) => {
      if (activeColorPicker || showStrokeSettings) {
        const isSelector = e.target.closest('#main-color-selector');
        const isPicker = e.target.closest('#deep-color-picker');
        const isTrigger = e.target.closest('.color-field-trigger');
        const isStrokePopup = e.target.closest('#stroke-settings-popup');
        if (!isSelector && !isPicker && !isTrigger && !isStrokePopup) {
          setActiveColorPicker(null);
          setShowDetailedPicker(false);
          setShowStrokeSettings(false);
          setIsStrokeStyleOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeColorPicker, showDetailedPicker, showStrokeSettings]);

  const getPathD = (x, y, w, h, tlv, trv, brv, blv) => {
    tlv = Math.max(0, tlv);
    trv = Math.max(0, trv);
    brv = Math.max(0, brv);
    blv = Math.max(0, blv);
    const scale = Math.min(
      1,
      w / (tlv + trv || 1),
      h / (trv + brv || 1),
      w / (brv + blv || 1),
      h / (blv + tlv || 1)
    );
    const tl = tlv * scale;
    const tr = trv * scale;
    const br = brv * scale;
    const bl = blv * scale;

    return `M ${x + tl},${y} ` +
      `L ${x + w - tr},${y} ` +
      (tr > 0 ? `A ${tr} ${tr} 0 0 1 ${x + w},${y + tr} ` : '') +
      `L ${x + w},${y + h - br} ` +
      (br > 0 ? `A ${br} ${br} 0 0 1 ${x + w - br},${y + h} ` : '') +
      `L ${x + bl},${y + h} ` +
      (bl > 0 ? `A ${bl} ${bl} 0 0 1 ${x},${y + h - bl} ` : '') +
      `L ${x},${y + tl} ` +
      (tl > 0 ? `A ${tl} ${tl} 0 0 1 ${x + tl},${y} ` : '') +
      `Z`;
  };

  const applyVisuals = useCallback(() => {
    if (isHydrating.current) return;

    // Re-resolve the live element from the active page container to ensure we are 
    // mutating the node that is actually visible in the DOM, skipping stale references.
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    let liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;

    if (!liveElement) return;

    const container = liveElement.tagName === "FOREIGNOBJECT" ? liveElement : (liveElement.querySelector("foreignObject") || liveElement.closest("foreignObject"));
    const target = container ? container.querySelector("video, iframe") : (liveElement.tagName === "VIDEO" || liveElement.tagName === "IFRAME" ? liveElement : liveElement.querySelector("video, iframe"));

    if (!target) return;
    if (!target) return;
    const visualTarget = container || target;

    let tagLower = liveElement.tagName?.toLowerCase();
    const isSvgEl = liveElement.namespaceURI === "http://www.w3.org/2000/svg";

    // --- FORCE VIDEO GROUP STRUCTURE FOR VIDEOS ---
    if (isSvgEl && liveElement.getAttribute('data-is-video-group') !== 'true') {
      if (tagLower === 'foreignobject' || tagLower === 'video' || tagLower === 'iframe') {
        const parent = liveElement.parentNode;
        const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        newGroup.id = liveElement.id; // Keep selection intact
        newGroup.setAttribute('data-type', liveElement.getAttribute('data-type') || 'video');
        newGroup.setAttribute('data-name', 'Video Group');
        newGroup.setAttribute('data-is-video-group', 'true');

        liveElement.removeAttribute('id');
        liveElement.setAttribute('data-name', 'Video');

        if (liveElement.hasAttribute('transform')) {
          newGroup.setAttribute('transform', liveElement.getAttribute('transform'));
          liveElement.removeAttribute('transform');
        }

        if (parent) parent.insertBefore(newGroup, liveElement);
        newGroup.appendChild(liveElement);

        liveElement = newGroup;
        tagLower = 'g';
      } else {
        liveElement.setAttribute('data-is-video-group', 'true');
        liveElement.setAttribute('data-name', 'Video Group');
        if (target) target.setAttribute('data-name', 'Video');
      }
    }

    isUpdatingDOM.current = true;
    try {
      // Dimensions are managed natively by the editor drag-resize logic
      if (container && target.tagName !== "IFRAME") {
        target.setAttribute('width', '100%');
        target.setAttribute('height', '100%');
        target.style.width = '100%';
        target.style.height = '100%';
      }

      // Opacity
      const opVal = opacity / 100;
      target.style.opacity = opVal;
      target.setAttribute('opacity', opVal);
      target.setAttribute('data-opacity', opVal);

      if (visualTarget !== target) {
        visualTarget.style.opacity = '';
        visualTarget.removeAttribute('opacity');
        visualTarget.removeAttribute('data-opacity');
      }
      if (liveElement !== target) {
        liveElement.style.opacity = '';
        liveElement.removeAttribute('opacity');
        liveElement.removeAttribute('data-opacity');
      }

      // Styling
      let fillLayer = liveElement.querySelector('.video-fill-layer');
      if (backgroundColor.fill !== 'transparent' && backgroundColor.fill !== 'none') {
        if (!fillLayer) {
          fillLayer = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          fillLayer.classList.add('video-fill-layer');
          fillLayer.setAttribute('data-name', 'Fill Color');
          fillLayer.style.pointerEvents = 'none';
          liveElement.insertBefore(fillLayer, liveElement.firstChild);

          const syncFillOverlay = () => {
            if (!fillLayer.isConnected) return;
            fillLayer.setAttribute('x', visualTarget.getAttribute('x') || '0');
            fillLayer.setAttribute('y', visualTarget.getAttribute('y') || '0');
            fillLayer.setAttribute('width', visualTarget.getAttribute('width') || '100%');
            fillLayer.setAttribute('height', visualTarget.getAttribute('height') || '100%');
            fillLayer.setAttribute('transform', visualTarget.getAttribute('transform') || '');
            fillLayer.style.transform = visualTarget.style.transform;
            fillLayer.style.translate = visualTarget.style.translate;
            fillLayer.style.scale = visualTarget.style.scale;
            fillLayer.style.rotate = visualTarget.style.rotate;
            fillLayer.style.transformOrigin = visualTarget.style.transformOrigin;
          };
          const obsFill = new MutationObserver(syncFillOverlay);
          obsFill.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
          if (visualTarget !== liveElement) {
            obsFill.observe(visualTarget, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
          }
        }

        fillLayer.setAttribute('x', visualTarget.getAttribute('x') || '0');
        fillLayer.setAttribute('y', visualTarget.getAttribute('y') || '0');
        fillLayer.setAttribute('width', visualTarget.getAttribute('width') || '100%');
        fillLayer.setAttribute('height', visualTarget.getAttribute('height') || '100%');
        fillLayer.setAttribute('transform', visualTarget.getAttribute('transform') || '');
        fillLayer.style.transform = visualTarget.style.transform;
        fillLayer.style.translate = visualTarget.style.translate;
        fillLayer.style.scale = visualTarget.style.scale;
        fillLayer.style.rotate = visualTarget.style.rotate;
        fillLayer.style.transformOrigin = visualTarget.style.transformOrigin;

        let parsedFill = null;
        if (backgroundColor.fill && backgroundColor.fill.toLowerCase().includes('gradient')) {
          parsedFill = parseGradient(backgroundColor.fill);
        }

        if (parsedFill && parsedFill.stops) {
          const fillAngleVal = (parsedFill.angle !== undefined && parsedFill.angle !== null) ? parsedFill.angle : 0;
          const fillRadiusVal = (parsedFill.radius !== undefined && parsedFill.radius !== null) ? parsedFill.radius : 100;
          fillLayer.setAttribute('data-fill-type', 'gradient');
          fillLayer.setAttribute('data-fill-stops', JSON.stringify(parsedFill.stops));
          fillLayer.setAttribute('data-fill-gradient-type', parsedFill.type.toLowerCase() || 'linear');
          fillLayer.setAttribute('data-fill-angle', fillAngleVal);
          fillLayer.setAttribute('data-fill-radius', fillRadiusVal);

          fillLayer.setAttribute('fill-type', 'gradient');
          fillLayer.setAttribute('fill-stops', JSON.stringify(parsedFill.stops));
          fillLayer.setAttribute('fill-gradient-type', parsedFill.type.toLowerCase() || 'linear');
          fillLayer.setAttribute('fill-angle', fillAngleVal);
          fillLayer.setAttribute('fill-radius', fillRadiusVal);

          syncGradient(liveElement.ownerDocument || document, fillLayer, 'fill');
          liveElement.setAttribute('data-fill-type', 'gradient');
          liveElement.setAttribute('data-fill-stops', JSON.stringify(parsedFill.stops));
          liveElement.setAttribute('data-fill-gradient-type', parsedFill.type.toLowerCase() || 'linear');
          liveElement.setAttribute('data-fill-angle', fillAngleVal);
          liveElement.setAttribute('data-fill-radius', fillRadiusVal);
        } else {
          fillLayer.setAttribute('fill', backgroundColor.fill);
          if (fillLayer.style) fillLayer.style.removeProperty('fill');
          fillLayer.removeAttribute('data-fill-type');
          fillLayer.removeAttribute('data-fill-stops');
          fillLayer.removeAttribute('data-fill-gradient-type');
          fillLayer.removeAttribute('data-fill-angle');
          fillLayer.removeAttribute('data-fill-radius');

          fillLayer.removeAttribute('fill-type');
          fillLayer.removeAttribute('fill-stops');
          fillLayer.removeAttribute('fill-gradient-type');
          fillLayer.removeAttribute('fill-angle');
          fillLayer.removeAttribute('fill-radius');

          liveElement.removeAttribute('data-fill-type');
          liveElement.removeAttribute('data-fill-stops');
          liveElement.removeAttribute('data-fill-gradient-type');
          liveElement.removeAttribute('data-fill-angle');
          liveElement.removeAttribute('data-fill-radius');
        }
        fillLayer.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());

        const maxRFill = Math.max(radius.tl || 0, radius.tr || 0, radius.br || 0, radius.bl || 0);
        if (maxRFill > 0) {
          fillLayer.setAttribute('rx', maxRFill.toString());
        } else {
          fillLayer.removeAttribute('rx');
        }

        visualTarget.style.backgroundColor = 'transparent'; // clear foreignObject background
        visualTarget.setAttribute('data-bg-color', backgroundColor.fill);
        liveElement.setAttribute('data-fill-color', backgroundColor.fill);
      } else {
        if (fillLayer) fillLayer.remove();
        visualTarget.style.backgroundColor = 'transparent';
        visualTarget.removeAttribute('data-bg-color');
        liveElement.removeAttribute('data-fill-color');
        liveElement.removeAttribute('data-fill-type');
      }

      // Helper to convert hex to rgba for CSS border
      const hexToRgba = (hex, alpha) => {
        if (!hex || hex === 'transparent' || hex === 'none') return 'transparent';
        if (hex.startsWith('rgba')) return hex;
        if (hex.startsWith('#')) {
          let c = hex.substring(1).split('');
          if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
          c = '0x' + c.join('');
          return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
        }
        return hex;
      };

      const pos = backgroundColor.strokePosition || 'Center';
      const color = hexToRgba(backgroundColor.stroke, backgroundColor.strokeOpacity / 100);
      const weight = backgroundColor.strokeWeight;
      const style = backgroundColor.strokeDashStyle === 'Dashed' ? 'dashed' : 'solid';

      visualTarget.setAttribute('data-stroke-color', backgroundColor.stroke);
      liveElement.setAttribute('data-stroke-color', backgroundColor.stroke);

      // Strip stroke from the <g> group so it doesn't cascade down to fillLayer and cause solid border leaks
      liveElement.removeAttribute('stroke');
      liveElement.removeAttribute('stroke-width');
      liveElement.removeAttribute('stroke-dasharray');

      visualTarget.setAttribute('stroke-width', weight);
      visualTarget.setAttribute('data-stroke-width', weight); // Keep for legacy

      if (backgroundColor.strokeDashStyle === 'Dashed') {
        const dashArray = backgroundColor.strokeDasharrayValue || `${backgroundColor.strokeDashLength || 10},${backgroundColor.strokeDashGap || 10}`;
        visualTarget.setAttribute('stroke-dasharray', dashArray);
      } else {
        visualTarget.setAttribute('stroke-dasharray', 'none');
      }

      // Dashed Stroke Attributes
      visualTarget.setAttribute('data-stroke-position', backgroundColor.strokePosition || 'Center');
      visualTarget.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
      visualTarget.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

      // Dynamic Stroke Overlay for SVG Video
      if (isSvgEl && weight > 0) {
        let strokeOverlay = liveElement.querySelector('.svg-video-stroke-overlay');
        if (!strokeOverlay) {
          strokeOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          strokeOverlay.classList.add('svg-video-stroke-overlay');
          strokeOverlay.style.pointerEvents = 'none';
          liveElement.appendChild(strokeOverlay);

          const syncOverlay = () => {
            if (!strokeOverlay.isConnected) return;
            strokeOverlay.setAttribute('transform', visualTarget.getAttribute('transform') || '');
            strokeOverlay.style.transform = visualTarget.style.transform;
            strokeOverlay.style.translate = visualTarget.style.translate;
            strokeOverlay.style.scale = visualTarget.style.scale;
            strokeOverlay.style.rotate = visualTarget.style.rotate;
            strokeOverlay.style.transformOrigin = visualTarget.style.transformOrigin;

            let bBox = { x: 0, y: 0, width: 100, height: 100 };
            try { bBox = visualTarget.getBBox(); } catch (e) { }

            let bxStr = visualTarget.getAttribute('x') || '0';
            let byStr = visualTarget.getAttribute('y') || '0';
            let bwStr = visualTarget.getAttribute('width') || '100%';
            let bhStr = visualTarget.getAttribute('height') || '100%';

            let bx = bxStr.includes('%') ? bBox.x : parseFloat(bxStr) || 0;
            let by = byStr.includes('%') ? bBox.y : parseFloat(byStr) || 0;
            let bw = bwStr.includes('%') ? bBox.width : parseFloat(bwStr) || 100;
            let bh = bhStr.includes('%') ? bBox.height : parseFloat(bhStr) || 100;

            let scaleX = 1; let scaleY = 1;
            try {
              const ctm = visualTarget.getScreenCTM();
              if (ctm) { scaleX = Math.abs(ctm.a) || 1; scaleY = Math.abs(ctm.d) || 1; }
            } catch (e) { }

            const offsetX = (weight / 2) / scaleX;
            const offsetY = (weight / 2) / scaleY;

            let ox = bx, oy = by, ow = bw, oh = bh;
            if (pos === 'Inside') {
              ox += offsetX; oy += offsetY; ow -= offsetX * 2; oh -= offsetY * 2;
            } else if (pos === 'Outside') {
              ox -= offsetX; oy -= offsetY; ow += offsetX * 2; oh += offsetY * 2;
            }

            strokeOverlay.style.setProperty('x', `${ox}px`, 'important');
            strokeOverlay.style.setProperty('y', `${oy}px`, 'important');
            strokeOverlay.style.setProperty('width', `${Math.max(0, ow)}px`, 'important');
            strokeOverlay.style.setProperty('height', `${Math.max(0, oh)}px`, 'important');

            const maxR = Math.max(radius.tl || 0, radius.tr || 0, radius.br || 0, radius.bl || 0);
            let adjR = maxR;
            if (pos === 'Inside') {
              adjR = Math.max(0, maxR - offsetX);
            } else if (pos === 'Outside') {
              adjR = maxR > 0 ? maxR + offsetX : 0;
            }
            if (adjR > 0) strokeOverlay.setAttribute('rx', adjR.toString());
            else strokeOverlay.removeAttribute('rx');
          };
          const obs = new MutationObserver(syncOverlay);
          obs.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
          if (visualTarget !== liveElement) {
            obs.observe(visualTarget, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
          }
        }

        let bBox = { x: 0, y: 0, width: 100, height: 100 };
        try { bBox = visualTarget.getBBox(); } catch (e) { }

        let bxStr = visualTarget.getAttribute('x') || '0';
        let byStr = visualTarget.getAttribute('y') || '0';
        let bwStr = visualTarget.getAttribute('width') || '100%';
        let bhStr = visualTarget.getAttribute('height') || '100%';

        let bx = bxStr.includes('%') ? bBox.x : parseFloat(bxStr) || 0;
        let by = byStr.includes('%') ? bBox.y : parseFloat(byStr) || 0;
        let bw = bwStr.includes('%') ? bBox.width : parseFloat(bwStr) || 100;
        let bh = bhStr.includes('%') ? bBox.height : parseFloat(bhStr) || 100;

        let scaleX = 1;
        let scaleY = 1;
        try {
          const ctm = visualTarget.getScreenCTM();
          if (ctm) {
            scaleX = Math.abs(ctm.a) || 1;
            scaleY = Math.abs(ctm.d) || 1;
          }
        } catch (e) { }

        const offsetX = (weight / 2) / scaleX;
        const offsetY = (weight / 2) / scaleY;

        let ox = bx, oy = by, ow = bw, oh = bh;
        if (pos === 'Inside') {
          ox += offsetX; oy += offsetY; ow -= offsetX * 2; oh -= offsetY * 2;
        } else if (pos === 'Outside') {
          ox -= offsetX; oy -= offsetY; ow += offsetX * 2; oh += offsetY * 2;
        }

        strokeOverlay.style.setProperty('x', `${ox}px`, 'important');
        strokeOverlay.style.setProperty('y', `${oy}px`, 'important');
        strokeOverlay.style.setProperty('width', `${Math.max(0, ow)}px`, 'important');
        strokeOverlay.style.setProperty('height', `${Math.max(0, oh)}px`, 'important');
        strokeOverlay.setAttribute('transform', visualTarget.getAttribute('transform') || '');
        strokeOverlay.style.transform = visualTarget.style.transform;
        strokeOverlay.style.translate = visualTarget.style.translate;
        strokeOverlay.style.scale = visualTarget.style.scale;
        strokeOverlay.style.rotate = visualTarget.style.rotate;
        strokeOverlay.style.transformOrigin = visualTarget.style.transformOrigin;

        strokeOverlay.setAttribute('fill', 'none');

        liveElement.setAttribute('data-stroke-type', backgroundColor.strokeType);

        if (backgroundColor.strokeType === 'gradient' && backgroundColor.strokeStops) {
          liveElement.setAttribute('data-stroke-gradient-type', backgroundColor.strokeGradientType || 'linear');
          liveElement.setAttribute('data-stroke-stops', backgroundColor.strokeStops || '');
          liveElement.setAttribute('data-stroke-angle', backgroundColor.strokeAngle || '0');
          liveElement.setAttribute('data-stroke-radius', backgroundColor.strokeRadius || '100');

          strokeOverlay.setAttribute('stroke-type', 'gradient');
          strokeOverlay.setAttribute('stroke-gradient-type', backgroundColor.strokeGradientType || 'linear');
          strokeOverlay.setAttribute('stroke-stops', backgroundColor.strokeStops || '');
          strokeOverlay.setAttribute('stroke-angle', backgroundColor.strokeAngle || '0');
          strokeOverlay.setAttribute('stroke-radius', backgroundColor.strokeRadius || '100');
          syncGradient(liveElement.ownerDocument || document, strokeOverlay, 'stroke');
        } else {
          liveElement.removeAttribute('data-stroke-gradient-type');
          liveElement.removeAttribute('data-stroke-stops');
          liveElement.removeAttribute('data-stroke-angle');
          liveElement.removeAttribute('data-stroke-radius');

          strokeOverlay.removeAttribute('stroke-type');
          strokeOverlay.removeAttribute('stroke-gradient-type');
          strokeOverlay.removeAttribute('stroke-stops');
          strokeOverlay.removeAttribute('stroke-angle');
          strokeOverlay.removeAttribute('stroke-radius');

          strokeOverlay.setAttribute('stroke', backgroundColor.stroke);
          if (strokeOverlay.style) strokeOverlay.style.removeProperty('stroke');
        }
        strokeOverlay.setAttribute('stroke-width', weight.toString());
        if (backgroundColor.strokeDashStyle === 'Dashed') {
          const dashArray = backgroundColor.strokeDasharrayValue || `${backgroundColor.strokeDashLength || 10},${backgroundColor.strokeDashGap || 10}`;
          strokeOverlay.setAttribute('stroke-dasharray', dashArray);
        } else {
          strokeOverlay.setAttribute('stroke-dasharray', 'none');
        }
        strokeOverlay.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
        strokeOverlay.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

        const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
        let adjR = maxR;
        if (pos === 'Inside') {
          adjR = Math.max(0, maxR - offsetX);
        } else if (pos === 'Outside') {
          adjR = maxR > 0 ? maxR + offsetX : 0;
        }

        if (adjR > 0) strokeOverlay.setAttribute('rx', adjR.toString());
        else strokeOverlay.removeAttribute('rx');

        strokeOverlay.style.outline = 'none';
        strokeOverlay.style.removeProperty('border-width');
        visualTarget.style.outline = 'none';
        visualTarget.style.borderWidth = '0px';
        strokeOverlay.style.display = 'block';
      } else {
        liveElement.querySelector('.svg-video-stroke-overlay')?.remove();

        // HTML styling fallback
        if (pos === 'Inside') {
          visualTarget.style.borderWidth = `${weight}px`;
          visualTarget.style.borderStyle = style;
          visualTarget.style.borderColor = color;
          visualTarget.style.outline = 'none';
        } else if (pos === 'Outside') {
          visualTarget.style.borderWidth = `0px`;
          visualTarget.style.outline = `${weight}px ${style} ${color}`;
          visualTarget.style.outlineOffset = `0px`;
        } else {
          // Center
          visualTarget.style.borderWidth = `0px`;
          visualTarget.style.outline = `${weight}px ${style} ${color}`;
          visualTarget.style.outlineOffset = `-${weight / 2}px`;
        }
      }

      // Radius
      const anyR = radius.tl || radius.tr || radius.br || radius.bl;
      const forceClip = activeEffects.includes('Blur') && effectSettings['Blur']?.clipContent;
      const radiusStr = `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`;

      target.style.borderRadius = radiusStr;
      target.setAttribute('data-radius', JSON.stringify(radius));
      target.style.overflow = 'hidden';

      if (visualTarget !== target) {
        visualTarget.style.borderRadius = '';
        visualTarget.removeAttribute('data-radius');
        visualTarget.style.overflow = '';
      }

      if (isSvgEl) {
        if (anyR || forceClip) {
          let targetElForShadow = container || liveElement;
          let bb = { x: 0, y: 0, width: 100, height: 100 };
          try { bb = targetElForShadow.getBBox(); } catch (e) { }
          let cxStr = targetElForShadow.getAttribute('x');
          let cyStr = targetElForShadow.getAttribute('y');
          let cwStr = targetElForShadow.getAttribute('width');
          let chStr = targetElForShadow.getAttribute('height');

          let cx = cxStr ? (cxStr.includes('%') ? bb.x : parseFloat(cxStr)) : bb.x;
          let cy = cyStr ? (cyStr.includes('%') ? bb.y : parseFloat(cyStr)) : bb.y;
          let cw = cwStr ? (cwStr.includes('%') ? bb.width : parseFloat(cwStr)) : bb.width;
          let ch = chStr ? (chStr.includes('%') ? bb.height : parseFloat(chStr)) : bb.height;

          let clipId = `clip-content-${liveElement.id || 'video'}`;
          let defs = liveElement.ownerSVGElement?.querySelector('defs');
          if (!defs && liveElement.ownerSVGElement) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            liveElement.ownerSVGElement.prepend(defs);
          }
          if (defs) {
            let clipNode = defs.querySelector(`#${clipId}`);
            if (!clipNode) {
              clipNode = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
              clipNode.id = clipId;
              const clipPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              clipNode.appendChild(clipPathEl);
              defs.appendChild(clipNode);
            }
            let clipPathEl = clipNode.firstChild;
            if (clipPathEl.tagName.toLowerCase() !== 'path') {
              clipPathEl.remove();
              clipPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              clipNode.appendChild(clipPathEl);
            }
            const maxR = Math.min(cw, ch) / 2;
            const c_tl = Math.max(0, Math.min(radius.tl || 0, maxR));
            const c_tr = Math.max(0, Math.min(radius.tr || 0, maxR));
            const c_br = Math.max(0, Math.min(radius.br || 0, maxR));
            const c_bl = Math.max(0, Math.min(radius.bl || 0, maxR));
            clipPathEl.setAttribute('d', getPathD(cx, cy, Math.max(0, cw), Math.max(0, ch), c_tl, c_tr, c_br, c_bl));
            clipPathEl.setAttribute('transform', targetElForShadow.getAttribute('transform') || '');

            if (container && container !== liveElement) {
              // Apply directly to the video element to prevent breaking native controls in Chrome
              container.style.removeProperty('clip-path');
              container.style.removeProperty('-webkit-clip-path');
              liveElement.style.removeProperty('clip-path');
              liveElement.style.removeProperty('-webkit-clip-path');
              target.style.setProperty('clip-path', `inset(0% 0% 0% 0% round ${radiusStr})`, 'important');
              target.style.setProperty('-webkit-clip-path', `inset(0% 0% 0% 0% round ${radiusStr})`, 'important');
            } else {
              liveElement.style.setProperty('clip-path', `url(#${clipId})`, 'important');
              liveElement.style.setProperty('-webkit-clip-path', `url(#${clipId})`, 'important');
              target.style.removeProperty('clip-path');
              target.style.removeProperty('-webkit-clip-path');
            }
          }
        } else {
          liveElement.style.removeProperty('clip-path');
          liveElement.style.removeProperty('-webkit-clip-path');
          target.style.removeProperty('clip-path');
          target.style.removeProperty('-webkit-clip-path');
          if (container) {
            container.style.removeProperty('clip-path');
            container.style.removeProperty('-webkit-clip-path');
          }
          if (liveElement.ownerSVGElement) {
            const clipId = `clip-content-${liveElement.id || 'video'}`;
            const existingClip = liveElement.ownerSVGElement.querySelector(`#${clipId}`);
            if (existingClip) existingClip.remove();
          }
        }
      } else {
        if (anyR || forceClip) {
          target.style.setProperty('clip-path', `inset(0% 0% 0% 0% round ${radiusStr})`, 'important');
          target.style.setProperty('-webkit-clip-path', `inset(0% 0% 0% 0% round ${radiusStr})`, 'important');

          visualTarget.style.removeProperty('clip-path');
          visualTarget.style.removeProperty('-webkit-clip-path');
          liveElement.style.removeProperty('clip-path');
          liveElement.style.removeProperty('-webkit-clip-path');
          const foreignObj = liveElement.querySelector('foreignObject');
          if (foreignObj) {
            foreignObj.style.removeProperty('clip-path');
            foreignObj.style.removeProperty('-webkit-clip-path');
          }
        } else {
          target.style.removeProperty('clip-path');
          target.style.removeProperty('-webkit-clip-path');
          visualTarget.style.removeProperty('clip-path');
          liveElement.style.removeProperty('clip-path');
          liveElement.style.removeProperty('-webkit-clip-path');
          const foreignObj = liveElement.querySelector('foreignObject');
          if (foreignObj) {
            foreignObj.style.removeProperty('clip-path');
            foreignObj.style.removeProperty('-webkit-clip-path');
          }
        }
      }


      // Metadata & Effects
      const f = filters;
      const exposure = f.exposure || 0;
      const contrast = f.contrast || 0;
      const saturation = f.saturation || 0;
      const temperature = f.temperature || 0;
      const tint = f.tint || 0;
      const h = f.highlights || 0;
      const s = f.shadows || 0;

      let filterStr = "";
      filterStr += `brightness(${100 + exposure + (h / 5)}%) `;
      filterStr += `contrast(${100 + contrast + (s / 5)}%) `;
      filterStr += `saturate(${100 + saturation}%) `;
      if (tint !== 0) filterStr += `hue-rotate(${tint}deg) `;
      if (temperature > 0) filterStr += `sepia(${temperature / 2}%) `;
      else if (temperature < 0) filterStr += `hue-rotate(180deg) sepia(${Math.abs(temperature) / 2}%) hue-rotate(-180deg) `;

      let boxShadowStr = '';
      let blurStr = '';
      activeEffects.forEach(eff => {
        const effSet = effectSettings[eff];
        if (!effSet) return;
        if (eff === 'Blur') blurStr = `blur(${effSet.blur}px) `;
      });

      // 2. Drop Shadow Caster
      let shadowCaster = liveElement.querySelector('.svg-drop-shadow-caster');
      let hasDropShadow = activeEffects.includes('Drop Shadow');

      if (hasDropShadow && isSvgEl) {
        const effSet = effectSettings['Drop Shadow'];
        if (!shadowCaster) {
          shadowCaster = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          shadowCaster.classList.add('svg-drop-shadow-caster');
          shadowCaster.style.pointerEvents = 'none';
          liveElement.insertBefore(shadowCaster, liveElement.firstChild);
        }
        if (shadowCaster) {
          if (shadowCaster !== liveElement.firstChild) {
            liveElement.insertBefore(shadowCaster, liveElement.firstChild);
          }
          shadowCaster.setAttribute('x', visualTarget.getAttribute('x') || '0');
          shadowCaster.setAttribute('y', visualTarget.getAttribute('y') || '0');
          shadowCaster.setAttribute('width', visualTarget.getAttribute('width') || '100%');
          shadowCaster.setAttribute('height', visualTarget.getAttribute('height') || '100%');
          shadowCaster.setAttribute('transform', visualTarget.getAttribute('transform') || '');

          shadowCaster.setAttribute('fill', 'black');
          shadowCaster.setAttribute('fill-opacity', opacity / 100);

          const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
          if (maxR > 0) shadowCaster.setAttribute('rx', maxR.toString());
          else shadowCaster.removeAttribute('rx');

          const alpha = Math.round((effSet.opacity / 100) * 255).toString(16).padStart(2, '0');
          const shadowOnlyFilter = `drop-shadow(${effSet.x}px ${effSet.y}px ${effSet.blur}px ${effSet.color}${alpha})`;

          const totalBlur = effSet.blur / 2;

          let shadowFilterId = `ds-only-${liveElement.id || 'vid'}`;
          let defs = liveElement.ownerSVGElement?.querySelector('defs');
          if (!defs && liveElement.ownerSVGElement) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            liveElement.ownerSVGElement.prepend(defs);
          }
          if (defs) {
            let svgFilt = defs.querySelector(`#${shadowFilterId}`);
            if (!svgFilt) {
              svgFilt = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
              svgFilt.id = shadowFilterId;
              svgFilt.setAttribute('x', '-50%');
              svgFilt.setAttribute('y', '-50%');
              svgFilt.setAttribute('width', '200%');
              svgFilt.setAttribute('height', '200%');
              defs.appendChild(svgFilt);
            }
            svgFilt.innerHTML = `
              <feGaussianBlur in="SourceAlpha" stdDeviation="${totalBlur}" result="blur"/>
              <feOffset dx="${effSet.x}" dy="${effSet.y}" result="offsetBlur"/>
              <feFlood flood-color="${effSet.color}" flood-opacity="${effSet.opacity / 100}"/>
              <feComposite in2="offsetBlur" operator="in" result="shadow"/>
              <feComposite in="shadow" in2="SourceAlpha" operator="out"/>
            `;
            shadowCaster.style.setProperty('filter', `url(#${shadowFilterId})`, 'important');
          } else {
            shadowCaster.style.setProperty('filter', shadowOnlyFilter, 'important');
          }

          shadowCaster.style.setProperty('display', 'block', 'important');
        }
      } else if (shadowCaster) {
        shadowCaster.style.setProperty('display', 'none', 'important');
      }

      // Inner Shadow
      let innerShadowString = '';
      if (activeEffects.includes('Inner Shadow')) {
        const ds = effectSettings['Inner Shadow'];
        const alpha = (ds.opacity !== undefined ? ds.opacity : 35) / 100;
        const color = ds.color || '#000000';
        let r = 0, g = 0, b = 0;
        if (color.startsWith('#')) {
          const hex = color.replace('#', '');
          if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16); g = parseInt(hex[1] + hex[1], 16); b = parseInt(hex[2] + hex[2], 16);
          } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16); g = parseInt(hex.substring(2, 4), 16); b = parseInt(hex.substring(4, 6), 16);
          }
        }
        const rgbaStr = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        innerShadowString = `inset ${ds.x || 0}px ${ds.y || 0}px ${ds.blur || 0}px ${ds.spread || 0}px ${rgbaStr}`;
      }

      if (isSvgEl) {
        let overlay = liveElement.querySelector('.svg-video-inner-shadow-rect');
        let oldOverlay = liveElement.querySelector('.svg-video-inner-shadow');
        if (oldOverlay) oldOverlay.remove();

        let filterId = liveElement.getAttribute('data-inner-shadow-filter-id');

        if (activeEffects.includes('Inner Shadow')) {
          const ds = effectSettings['Inner Shadow'];
          const alpha = (ds.opacity !== undefined ? ds.opacity : 35) / 100;
          const color = ds.color || '#000000';

          if (!filterId) {
            filterId = 'inner-shadow-' + Math.random().toString(36).substr(2, 9);
            liveElement.setAttribute('data-inner-shadow-filter-id', filterId);
          }

          let svgDefs = liveElement.ownerSVGElement?.querySelector('defs');
          if (!svgDefs && liveElement.ownerSVGElement) {
            svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            liveElement.ownerSVGElement.prepend(svgDefs);
          }

          if (svgDefs) {
            let filterEl = svgDefs.querySelector(`#${filterId}`);
            if (!filterEl) {
              filterEl = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
              filterEl.id = filterId;
              filterEl.setAttribute('x', '-50%');
              filterEl.setAttribute('y', '-50%');
              filterEl.setAttribute('width', '200%');
              filterEl.setAttribute('height', '200%');
              svgDefs.appendChild(filterEl);
            }

            while (filterEl.firstChild) filterEl.removeChild(filterEl.firstChild);

            const feOffset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset');
            feOffset.setAttribute('dx', ds.x || 0);
            feOffset.setAttribute('dy', ds.y || 0);

            const feBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
            feBlur.setAttribute('stdDeviation', (ds.blur || 0) / 2);
            feBlur.setAttribute('result', 'offset-blur');

            const feComp1 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
            feComp1.setAttribute('operator', 'out');
            feComp1.setAttribute('in', 'SourceAlpha');
            feComp1.setAttribute('in2', 'offset-blur');
            feComp1.setAttribute('result', 'inverse');

            const feFlood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
            feFlood.setAttribute('flood-color', color);
            feFlood.setAttribute('flood-opacity', alpha);
            feFlood.setAttribute('result', 'color');

            const feComp2 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
            feComp2.setAttribute('operator', 'in');
            feComp2.setAttribute('in', 'color');
            feComp2.setAttribute('in2', 'inverse');
            feComp2.setAttribute('result', 'shadow');

            filterEl.appendChild(feOffset);
            filterEl.appendChild(feBlur);
            filterEl.appendChild(feComp1);
            filterEl.appendChild(feFlood);
            filterEl.appendChild(feComp2);
          }

          if (!overlay) {
            overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            overlay.classList.add('svg-video-inner-shadow-rect');
            overlay.style.pointerEvents = 'none';
            overlay.setAttribute('fill', 'white');
            liveElement.appendChild(overlay);
          }

          const targetEl = visualTarget;
          let box = { x: 0, y: 0, width: 100, height: 100 };
          try { box = targetEl.getBBox(); } catch (e) {
            box.x = parseFloat(targetEl.getAttribute('x') || 0);
            box.y = parseFloat(targetEl.getAttribute('y') || 0);
            box.width = parseFloat(targetEl.getAttribute('width') || 100);
            box.height = parseFloat(targetEl.getAttribute('height') || 100);
          }

          overlay.setAttribute('x', box.x);
          overlay.setAttribute('y', box.y);
          overlay.setAttribute('width', Math.max(1, box.width));
          overlay.setAttribute('height', Math.max(1, box.height));
          overlay.setAttribute('transform', targetEl.getAttribute('transform') || '');

          const anyR = radius.tl > 0 || radius.tr > 0 || radius.br > 0 || radius.bl > 0;
          if (anyR) overlay.setAttribute('rx', Math.max(radius.tl, radius.tr, radius.br, radius.bl));
          else overlay.removeAttribute('rx');

          overlay.setAttribute('filter', `url(#${filterId})`);
        } else {
          if (overlay) overlay.remove();
          if (filterId && liveElement.ownerSVGElement) {
            const f = liveElement.ownerSVGElement.querySelector(`#${filterId}`);
            if (f) f.remove();
          }
        }
      } else {
        // Fallback for non-SVG video targets
        activeEffects.forEach(eff => {
          const effSet = effectSettings[eff];
          if (!effSet) return;
          if (eff === 'Drop Shadow') {
            const alpha = Math.round((effSet.opacity / 100) * 255).toString(16).padStart(2, '0');
            boxShadowStr += `${effSet.x}px ${effSet.y}px ${effSet.blur}px ${effSet.spread}px ${effSet.color}${alpha}, `;
          }
        });

        let overlay = liveElement.querySelector('.inner-shadow-overlay') || liveElement.parentElement?.querySelector('.inner-shadow-overlay');
        if (innerShadowString) {
          const targetParent = (['IMG', 'VIDEO', 'IFRAME'].includes(liveElement.tagName)) ? liveElement.parentElement : liveElement;
          if (!overlay && targetParent) {
            overlay = document.createElement('div');
            overlay.className = 'inner-shadow-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '99999'; // High z-index to stay above video
            overlay.style.boxSizing = 'border-box';
            if (window.getComputedStyle(targetParent).position === 'static') {
              targetParent.style.position = 'relative';
            }
            targetParent.appendChild(overlay);
          }
          if (overlay) {
            overlay.style.boxShadow = innerShadowString;
            const anyR = radius.tl > 0 || radius.tr > 0 || radius.br > 0 || radius.bl > 0;
            overlay.style.borderRadius = anyR ? `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px` : '0px';
          }
        } else if (overlay) {
          overlay.remove();
        }
      }

      // Always apply filters directly to the target (video element) instead of liveElement.
      // Applying filter to liveElement (the SVG group) blurs the custom controls overlay
      // which is dynamically injected as a sibling of the video.
      target.style.filter = (filterStr + " " + blurStr).trim() || 'none';
      if (visualTarget !== target) {
        visualTarget.style.filter = 'none';
      }
      liveElement.style.removeProperty('filter');

      // Since we no longer blur the liveElement group, we must manually blur the stroke overlay
      // if Clip Content is off, to maintain the original visual behavior for the stroke.
      const strokeOverlayEl = liveElement.querySelector('.svg-video-stroke-overlay');
      if (strokeOverlayEl) {
        if (activeEffects.includes('Blur') && !forceClip) {
          strokeOverlayEl.style.filter = blurStr.trim() || 'none';
        } else {
          strokeOverlayEl.style.removeProperty('filter');
        }
      }
      visualTarget.style.boxShadow = boxShadowStr.trim().replace(/,$/, '');
      visualTarget.setAttribute('data-effects', JSON.stringify({ activeEffects, effectSettings }));
      liveElement.setAttribute('data-active-effects', activeEffects.join(','));

      liveElement.setAttribute('data-effect-blur', activeEffects.includes('Blur') ? 'true' : 'false');
      if (effectSettings['Blur']) {
        liveElement.setAttribute('data-effect-blur-value', effectSettings['Blur'].blur.toString());
        liveElement.setAttribute('data-effect-blur-clip', effectSettings['Blur'].clipContent ? 'true' : 'false');
      }

      liveElement.setAttribute('data-effect-drop-shadow', activeEffects.includes('Drop Shadow') ? 'true' : 'false');
      if (effectSettings['Drop Shadow']) {
        liveElement.setAttribute('data-effect-drop-shadow-color', effectSettings['Drop Shadow'].color);
        liveElement.setAttribute('data-effect-drop-shadow-opacity', effectSettings['Drop Shadow'].opacity.toString());
        liveElement.setAttribute('data-effect-drop-shadow-x', effectSettings['Drop Shadow'].x.toString());
        liveElement.setAttribute('data-effect-drop-shadow-y', effectSettings['Drop Shadow'].y.toString());
        liveElement.setAttribute('data-effect-drop-shadow-blur', effectSettings['Drop Shadow'].blur.toString());
      }

      liveElement.setAttribute('data-effect-inner-shadow', activeEffects.includes('Inner Shadow') ? 'true' : 'false');
      if (effectSettings['Inner Shadow']) {
        liveElement.setAttribute('data-effect-inner-shadow-color', effectSettings['Inner Shadow'].color);
        liveElement.setAttribute('data-effect-inner-shadow-opacity', effectSettings['Inner Shadow'].opacity.toString());
        liveElement.setAttribute('data-effect-inner-shadow-x', effectSettings['Inner Shadow'].x.toString());
        liveElement.setAttribute('data-effect-inner-shadow-y', effectSettings['Inner Shadow'].y.toString());
        liveElement.setAttribute('data-effect-inner-shadow-blur', effectSettings['Inner Shadow'].blur.toString());
      }

      visualTarget.setAttribute('data-effect-exposure', exposure.toString());
      visualTarget.setAttribute('data-effect-contrast', contrast.toString());
      visualTarget.setAttribute('data-effect-saturation', saturation.toString());
      visualTarget.setAttribute('data-effect-temperature', temperature.toString());
      visualTarget.setAttribute('data-effect-tint', tint.toString());
      visualTarget.setAttribute('data-effect-highlights', h.toString());
      visualTarget.setAttribute('data-effect-shadows', s.toString());

      // Media State (preserving attributes)
      if (target.tagName === "VIDEO") {
        if (autoplay) {
          target.setAttribute('autoplay', '');
          target.autoplay = true;
          target.play().catch(e => console.warn("Video autoplay failed:", e));
        } else {
          target.removeAttribute('autoplay');
          target.autoplay = false;
        }

        if (muted) {
          target.muted = true;
          target.setAttribute('muted', '');
        } else {
          target.muted = false;
          target.removeAttribute('muted');
        }

        if (loop) {
          target.setAttribute('loop', '');
          target.loop = true;
        } else {
          target.removeAttribute('loop');
          target.loop = false;
        }

        target.setAttribute('data-start-time', startTime);
        target.setAttribute('data-end-time', endTime);
        target.setAttribute('data-play-video-while', playVideoWhile);
        target.setAttribute('data-playback-speed', playbackSpeed);
        target.playbackRate = parseFloat(playbackSpeed.replace('x', ''));
        target.setAttribute('data-resume-behavior', resumeBehavior);
        target.setAttribute('data-default-volume', defaultVolume);
        target.volume = defaultVolume / 100;
        target.setAttribute('data-disable-fullscreen', disableFullScreen ? 'true' : 'false');

        // Always keep native controls OFF — custom controls bar handles the UI.
        // Use a data attribute so the custom controls useEffect knows the user preference.
        target.controls = false;
        target.removeAttribute('controls');
        target.setAttribute('data-show-controls', controls ? 'true' : 'false');
        target.setAttribute('data-show-play-pause', playPauseButton ? 'true' : 'false');
        target.setAttribute('data-show-skip-button', (controls && skipButton) ? 'true' : 'false');
        target.setAttribute('data-show-progress-bar', (controls && progressBar) ? 'true' : 'false');
        target.setAttribute('data-show-loop-button', (controls && loopButtonControl) ? 'true' : 'false');
        target.setAttribute('data-show-fullscreen-button', fullscreenButtonControl ? 'true' : 'false');
        target.setAttribute('data-show-playback-speed-menu', (controls && playbackSpeedMenu) ? 'true' : 'false');
        target.setAttribute('data-show-volume-control', (controls && volumeControl) ? 'true' : 'false');
        target.setAttribute('data-show-download-button', downloadButton ? 'true' : 'false');

        if (controls) {
          target.classList.remove('hide-controls');
        } else {
          target.classList.add('hide-controls');
        }
        // Controls Size
        target.setAttribute('data-controls-size', controlsSize);
      } else if (target.tagName === "IFRAME") {
        target.setAttribute('data-show-controls', controls ? 'true' : 'false');
        if (container) {
          container.setAttribute('data-show-controls', controls ? 'true' : 'false');
        }
        liveElement.setAttribute('data-show-controls', controls ? 'true' : 'false');

        try {
          let urlObj = new URL(target.src);
          let changed = false;

          if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
            const currentAutoplay = urlObj.searchParams.get("autoplay") === "1";
            const currentControls = urlObj.searchParams.get("controls") !== "0"; // default is 1
            const currentLoop = urlObj.searchParams.get("loop") === "1";
            const currentMute = urlObj.searchParams.get("mute") === "1";

            if (autoplay && !currentAutoplay) { urlObj.searchParams.set("autoplay", "1"); changed = true; }
            if (!autoplay && currentAutoplay) { urlObj.searchParams.delete("autoplay"); changed = true; }

            if (muted && !currentMute) { urlObj.searchParams.set("mute", "1"); changed = true; }
            if (!muted && currentMute) { urlObj.searchParams.delete("mute"); changed = true; }

            if (controls && !currentControls) { urlObj.searchParams.delete("controls"); changed = true; }
            if (!controls && currentControls) { urlObj.searchParams.set("controls", "0"); changed = true; }

            if (loop && !currentLoop) {
              urlObj.searchParams.set("loop", "1");
              const videoId = urlObj.pathname.split("/").pop();
              if (videoId) urlObj.searchParams.set("playlist", videoId);
              changed = true;
            }
            if (!loop && currentLoop) { urlObj.searchParams.delete("loop"); urlObj.searchParams.delete("playlist"); changed = true; }
          }

          if (changed) {
            target.src = urlObj.toString();
            target.setAttribute('src', urlObj.toString());
          }
        } catch (e) {
          // Ignore invalid URLs
        }
      }

      // --- STRICT LAYER REORDERING FOR VIDEO GROUPS ---
      if (liveElement.getAttribute('data-is-video-group') === 'true') {
        const dropShadow = liveElement.querySelector('.svg-drop-shadow-caster');
        const fillLayer = liveElement.querySelector('.svg-fill-layer');
        const innerShadows = Array.from(liveElement.querySelectorAll('.svg-inner-shadow-caster'));
        const strokeLayer = liveElement.querySelector('.svg-stroke-layer');
        const videoNode = liveElement.querySelector('foreignObject') || liveElement.querySelector('video') || liveElement.querySelector('iframe');

        // We only move the specific layers to avoid detaching the videoNode itself
        if (dropShadow && videoNode) {
          dropShadow.setAttribute('data-name', 'Drop Shadow');
          if (dropShadow.nextElementSibling !== videoNode) {
            liveElement.insertBefore(dropShadow, videoNode);
          }
        }
        if (fillLayer && videoNode) {
          fillLayer.setAttribute('data-name', 'Fill Color');
          if (fillLayer.nextElementSibling !== videoNode) {
            liveElement.insertBefore(fillLayer, videoNode);
          }
        }
        // Inner shadows and stroke layer must be placed AFTER videoNode.
        innerShadows.forEach(inner => {
          inner.setAttribute('data-name', 'Inner Shadow');
          if (liveElement.lastElementChild !== inner) {
            liveElement.appendChild(inner);
          }
        });
        if (strokeLayer) {
          strokeLayer.setAttribute('data-name', 'Stroke');
          if (liveElement.lastElementChild !== strokeLayer) {
            liveElement.appendChild(strokeLayer);
          }
        }
      }

      const innerGroup = liveElement.querySelector('.video-inner-content');
      if (innerGroup) {
        innerGroup.style.removeProperty('width');
        innerGroup.style.removeProperty('height');
        innerGroup.style.removeProperty('left');
        innerGroup.style.removeProperty('top');
        innerGroup.style.removeProperty('position');
        innerGroup.style.removeProperty('overflow');
      }

      const isIframe = target.tagName === "IFRAME";
      if (!isIframe) {
        target.style.removeProperty('width');
        target.style.removeProperty('height');
        target.style.removeProperty('max-width');
        target.style.removeProperty('max-height');

        target.style.removeProperty('transform');
        target.style.removeProperty('transform-origin');
        target.removeAttribute('transform');
      } else {
        // Ensure iframe stays scaled to match its foreignObject container dimensions
        const foW = parseFloat(container?.getAttribute('width') || liveElement.getAttribute('width') || 0);
        const foH = parseFloat(container?.getAttribute('height') || liveElement.getAttribute('height') || 0);
        const origW = parseFloat(target.getAttribute('data-original-width') || target.getAttribute('width') || 640);
        const origH = parseFloat(target.getAttribute('data-original-height') || target.getAttribute('height') || 360);
        if (foW > 0 && foH > 0 && origW > 0 && origH > 0) {
          const scaleX = foW / origW;
          const scaleY = foH / origH;
          target.style.setProperty('width', origW + 'px', 'important');
          target.style.setProperty('height', origH + 'px', 'important');
          target.style.setProperty('transform-origin', '0 0', 'important');
          target.style.setProperty('transform', `scale(${scaleX}, ${scaleY})`, 'important');
        }
      }
      liveElement.removeAttribute('clip-path');
      liveElement.removeAttribute('data-crop-orig-w');
      liveElement.removeAttribute('data-crop-orig-h');
      liveElement.removeAttribute('data-crop-orig-x');
      liveElement.removeAttribute('data-crop-orig-y');

      // Restore default fitting
      const fitCssMap = { 'Fit': 'contain', 'Fill': 'cover', 'Stretch': 'fill' };
      target.style.objectFit = fitCssMap[videoType] || 'contain';
      target.setAttribute('data-object-fit', videoType);

      // Trigger parent update
      window.__skipCanvasUpdateForPage = activePageIndex;
      debouncedUpdate();
    } catch (e) {
      console.error("Error applying video visuals:", e);
    }
  }, [selectedElement, selectedLayerId, activePageIndex, opacity, backgroundColor, filters, radius, videoType, activeEffects, effectSettings, autoplay, loop, controls, controlsSize, muted, startTime, endTime, playVideoWhile, playbackSpeed, resumeBehavior, defaultVolume, disableFullScreen, playPauseButton, skipButton, progressBar, loopButtonControl, fullscreenButtonControl, playbackSpeedMenu, volumeControl, downloadButton, debouncedUpdate, updateTrigger]);

  useEffect(() => {
    applyVisuals();
  }, [applyVisuals]);

  // Removed global disableNativeControls and custom-video-progress-style injection (moved to MainEditor.jsx)

  // Inject scoped CSS to scale native video controls anchored at bottom
  useEffect(() => {
    if (!selectedLayerId) return;
    const styleId = `vctrl-${selectedLayerId}`;
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    // Only hide native controls completely, no custom styling
    styleEl.textContent = `
      [id="${selectedLayerId}"] video::-webkit-media-controls,
      video[id="${selectedLayerId}"]::-webkit-media-controls {
        display: none !important;
      }
      [id="${selectedLayerId}"] video::-webkit-media-controls-enclosure,
      video[id="${selectedLayerId}"]::-webkit-media-controls-enclosure {
        display: none !important;
      }
      [id="${selectedLayerId}"] video::-webkit-media-controls-panel,
      video[id="${selectedLayerId}"]::-webkit-media-controls-panel {
        display: none !important;
      }
    `;
  }, [selectedLayerId]);

  // Removed custom inline controls bar injection (moved to MainEditor.jsx)

  const updateElementAttribute = (attr, value) => {
    // These update the local state which then triggers applyVisuals
    if (attr === 'opacity') setOpacity(value);
    else if (attr === 'backgroundColor') setBackgroundColor(value);
    else if (attr === 'stroke') setBackgroundColor(prev => ({ ...prev, stroke: value }));
    else if (attr === 'strokeWeight') setBackgroundColor(prev => ({ ...prev, strokeWeight: value }));
    else if (attr === 'strokeType') setBackgroundColor(prev => ({ ...prev, strokeType: value }));
    else if (attr === 'strokeDashLength') setBackgroundColor(prev => ({ ...prev, strokeDashLength: value }));
    else if (attr === 'strokeDashGap') setBackgroundColor(prev => ({ ...prev, strokeDashGap: value }));
    else if (attr === 'strokeDashPosition') setBackgroundColor(prev => ({ ...prev, strokePosition: value }));
    else if (attr === 'strokeLinecap') setBackgroundColor(prev => ({ ...prev, strokeLinecap: value }));
    else if (attr === 'radius') setRadius(value);
    else if (attr === 'videoType') setVideoType(value);
    else if (attr === 'autoplay') setAutoplay(value);
    else if (attr === 'loop') setLoop(value);
    else if (attr === 'controls') setControls(value);
    else if (attr === 'controlsSize') setControlsSize(value);
    else if (attr === 'muted') setMuted(value);
    else if (attr === 'playPauseButton') setPlayPauseButton(value);
    else if (attr === 'skipButton') setSkipButton(value);
    else if (attr === 'progressBar') setProgressBar(value);
    else if (attr === 'loopButtonControl') setLoopButtonControl(value);
    else if (attr === 'fullscreenButtonControl') setFullscreenButtonControl(value);
    else if (attr === 'playbackSpeedMenu') setPlaybackSpeedMenu(value);
    else if (attr === 'volumeControl') setVolumeControl(value);
    else if (attr === 'downloadButton') setDownloadButton(value);
  };


  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLayerId) return;

    // Resolve the live element from the DOM to ensure we don't mutate a stale React reference
    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const liveElement = editorDoc.getElementById(selectedLayerId) || selectedElement;

    if (!liveElement) {
      console.error("Could not resolve live element for upload");
      return;
    }

    let target = null;
    if (liveElement.tagName === "VIDEO" || liveElement.tagName === "IFRAME") {
      target = liveElement;
    } else {
      target = liveElement.querySelector("video, iframe");
    }

    if (!target) {
      console.error("No video/iframe target found for upload");
      return;
    }

    const wasIframe = target.tagName === "IFRAME";

    if (wasIframe) {
      // Replace iframe with a video element
      const newVideo = document.createElement("video");
      newVideo.id = target.id || selectedLayerId;
      newVideo.style.cssText = target.style.cssText;

      // Preserve existing structural attributes
      Array.from(target.attributes).forEach(attr => {
        if (!["src", "id", "style", "allow", "allowfullscreen"].includes(attr.name)) {
          newVideo.setAttribute(attr.name, attr.value);
        }
      });

      newVideo.controls = true;
      target.replaceWith(newVideo);
      target = newVideo;
    }

    if (!target) {
      console.error("No video target found for upload");
      return;
    }

    const videoURL = URL.createObjectURL(file);

    const tempVideo = document.createElement('video');
    tempVideo.onloadedmetadata = async () => {
      // Dynamically calculate size based on the SVG canvas
      const svg = target.closest('svg');
      const svgW = svg ? ((svg.getAttribute('width') && !svg.getAttribute('width').includes('%') ? parseFloat(svg.getAttribute('width')) : 0) || (svg.viewBox?.baseVal?.width ? svg.viewBox.baseVal.width : 0) || 794) : 794;

      const newW = Math.round(svgW * 0.5);
      const newH = (tempVideo.videoHeight / tempVideo.videoWidth) * newW || Math.round(newW * (9 / 16));

      target.setAttribute("width", "100%");
      target.setAttribute("height", "100%");
      target.setAttribute("data-video-width", tempVideo.videoWidth);
      target.setAttribute("data-video-height", tempVideo.videoHeight);
      target.setAttribute("data-video-duration", tempVideo.duration);
      target.style.width = "100%";
      target.style.height = "100%";
      target.style.objectFit = "contain";

      if (liveElement) {
        const resizeAndCenter = (el, targetW, targetH) => {
          const oldW = parseFloat(el.getAttribute("width") || "0");
          const oldH = parseFloat(el.getAttribute("height") || "0");
          if (oldW > 0 && oldH > 0) {
            const oldX = parseFloat(el.getAttribute("x") || "0");
            const oldY = parseFloat(el.getAttribute("y") || "0");
            el.setAttribute("x", oldX + oldW / 2 - targetW / 2);
            el.setAttribute("y", oldY + oldH / 2 - targetH / 2);
          }
          el.setAttribute("width", targetW);
          el.setAttribute("height", targetH);
        };

        const fo = liveElement.tagName.toLowerCase() === "foreignobject" ? liveElement : (liveElement.querySelector("foreignObject") || liveElement.querySelector("foreignobject"));
        if (fo) {
          resizeAndCenter(fo, newW, newH);
          fo.style.width = newW + "px";
          fo.style.height = newH + "px";
        }

        if (liveElement.tagName.toLowerCase() === "g") {
          liveElement.setAttribute("data-width", newW);
          liveElement.setAttribute("data-height", newH);
          liveElement.querySelectorAll("rect").forEach(rect => {
            if (rect.hasAttribute("width")) resizeAndCenter(rect, newW, newH);
          });
        }
      }

      target.src = videoURL;
      target.setAttribute("src", videoURL);
      target.setAttribute('data-filename', file.name);
      target.setAttribute('data-filesize', file.size);
      target.removeAttribute('data-original-url');
      if (liveElement && liveElement !== target) {
        liveElement.setAttribute('data-filename', file.name);
        liveElement.setAttribute('data-filesize', file.size);
        liveElement.setAttribute('data-video-duration', tempVideo.duration);
      }
      target.autoplay = false;
      target.removeAttribute("autoplay");
      setAutoplay(false);
      setUpdateTrigger(prev => prev + 1);
      const source = target.querySelector("source");
      if (source) {
        source.src = videoURL;
        source.setAttribute("src", videoURL);
      }
      if (target.tagName === "VIDEO") target.load();

      setPreviewSrc(videoURL);
      onUpdateRef.current?.({ newElement: wasIframe ? target : undefined });

      const storedUser = localStorage.getItem('user');
      if (storedUser && (activeVId || (folderName && flipbookName))) {
        const user = JSON.parse(storedUser);
        const formData = new FormData();
        formData.append('emailId', user.emailId);
        if (activeVId) formData.append('v_id', activeVId);
        if (folderName) formData.append('folderName', folderName);
        if (flipbookName) formData.append('flipbookName', flipbookName);
        formData.append('type', 'video');
        formData.append('page_v_id', currentPageVId || 'global');
        formData.append('file', file);

        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
          if (res.data.url) {
            const serverUrl = resolveUploadsPath(res.data.url);
            target.src = serverUrl;
            if (source) source.src = serverUrl;
            debouncedUpdate();
          }
        } catch (err) {
          console.error("Upload error:", err);
        }
      }
    };
    tempVideo.src = videoURL;
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLayerId) return;
    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file (JPG, PNG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      // Resolve the live element from the DOM
      const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;

      if (!liveElement) return;

      // Find the video: check if it's a foreignObject containing a video, or the video itself
      let target = null;
      if (liveElement.tagName === "VIDEO") {
        target = liveElement;
      } else if (liveElement.tagName === "FOREIGNOBJECT") {
        target = liveElement.querySelector("video");
      } else {
        const fo = liveElement.querySelector("foreignObject") || liveElement.closest("foreignObject");
        target = fo ? fo.querySelector("video") : liveElement.querySelector("video");
      }

      if (target) {
        target.poster = result;
        target.setAttribute("poster", result);
        target.setAttribute("data-poster-type", "upload");

        // Force the poster to show by replacing the video element with a clone
        const clone = target.cloneNode(true);
        clone.removeAttribute('data-custom-ctrl-active');
        target.parentNode.replaceChild(clone, target);

        setPosterSrc(result);
        debouncedUpdate({ poster: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAutoPickThumbnail = useCallback(() => {
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;

    let target = null;
    if (liveElement?.tagName === "VIDEO") {
      target = liveElement;
    } else if (liveElement?.tagName === "FOREIGNOBJECT") {
      target = liveElement.querySelector("video");
    } else {
      const fo = liveElement?.querySelector("foreignObject") || liveElement?.closest("foreignObject");
      target = fo ? fo.querySelector("video") : liveElement?.querySelector("video");
    }
    if (!target) return;

    // Clear any previously uploaded poster so the video natively shows its first frame
    target.poster = '';
    target.removeAttribute('poster');
    target.setAttribute('data-poster-type', 'auto');
    setPosterSrc(null);

    // Force the video to reload without a poster
    const clone = target.cloneNode(true);
    clone.removeAttribute('data-custom-ctrl-active');
    target.parentNode.replaceChild(clone, target);

    debouncedUpdate({ poster: '' });
  }, [selectedElement, selectedLayerId, activePageIndex, debouncedUpdate]);

  const replaceTemplateWithUrl = (url) => {
    if (!url) return;

    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    const liveElement = pageContainer?.querySelector(`[id="${selectedLayerId}"]`) || document.getElementById(selectedLayerId) || selectedElement;

    if (!liveElement) return;

    // Find the actual target (video or iframe)
    let target = null;
    if (liveElement.tagName === "VIDEO" || liveElement.tagName === "IFRAME") {
      target = liveElement;
    } else {
      target = liveElement.querySelector("video, iframe");
    }

    if (!target) return;

    const finalUrl = getEmbedVideoUrl(url);
    const urlLower = url.toLowerCase();

    // Check if it's an iframe-based embed
    const isIframeTarget = urlLower.includes('youtube') || urlLower.includes('youtu.be') ||
      urlLower.includes('vimeo') || urlLower.includes('dailymotion') ||
      urlLower.includes('dai.ly') || urlLower.includes('loom.com') ||
      urlLower.includes('wistia') || urlLower.includes('drive.google.com') ||
      urlLower.includes('embed') || urlLower.includes('player');

    // Dynamically calculate size based on the SVG canvas
    const svg = target.closest('svg');
    const svgW = svg ? ((svg.getAttribute('width') && !svg.getAttribute('width').includes('%') ? parseFloat(svg.getAttribute('width')) : 0) || (svg.viewBox?.baseVal?.width ? svg.viewBox.baseVal.width : 0) || 794) : 794;

    const newW = Math.round(svgW * 0.5);
    const newH = Math.round(newW * (9 / 16)); // Standard 16:9 for URLs

    const ytIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    const ytId = ytIdMatch ? ytIdMatch[1] : null;



    // If the target is already the correct type, just update its src
    if ((isIframeTarget && target.tagName === "IFRAME") || (!isIframeTarget && target.tagName === "VIDEO")) {
      target.src = finalUrl;
      target.setAttribute("src", finalUrl);
      target.setAttribute("data-original-url", url);

      if (isIframeTarget) {
        const intrinsicW = 640;
        const intrinsicH = 360;
        target.setAttribute("width", intrinsicW.toString());
        target.setAttribute("height", intrinsicH.toString());
        target.setAttribute("data-original-width", intrinsicW.toString());
        target.setAttribute("data-original-height", intrinsicH.toString());
        target.style.width = intrinsicW + "px";
        target.style.height = intrinsicH + "px";
        target.style.transformOrigin = "0 0";

        const scaleX = newW / intrinsicW;
        const scaleY = newH / intrinsicH;
        target.style.transform = `scale(${scaleX}, ${scaleY})`;
      } else {
        target.setAttribute("width", "100%");
        target.setAttribute("height", "100%");
        target.style.width = "100%";
        target.style.height = "100%";
        target.style.transform = "none";
        target.style.objectFit = "contain";
      }

      if (liveElement) {
        const resizeAndCenter = (el, targetW, targetH) => {
          const oldW = parseFloat(el.getAttribute("width") || "0");
          const oldH = parseFloat(el.getAttribute("height") || "0");
          if (oldW > 0 && oldH > 0) {
            const oldX = parseFloat(el.getAttribute("x") || "0");
            const oldY = parseFloat(el.getAttribute("y") || "0");
            el.setAttribute("x", oldX + oldW / 2 - targetW / 2);
            el.setAttribute("y", oldY + oldH / 2 - targetH / 2);
          }
          el.setAttribute("width", targetW);
          el.setAttribute("height", targetH);
        };

        const fo = liveElement.tagName.toLowerCase() === "foreignobject" ? liveElement : (liveElement.querySelector("foreignObject") || liveElement.querySelector("foreignobject"));
        if (fo) {
          resizeAndCenter(fo, newW, newH);
          fo.style.width = newW + "px";
          fo.style.height = newH + "px";
        }

        if (liveElement.tagName.toLowerCase() === "g") {
          liveElement.setAttribute("data-width", newW);
          liveElement.setAttribute("data-height", newH);
          liveElement.querySelectorAll("rect").forEach(rect => {
            if (rect.hasAttribute("width")) resizeAndCenter(rect, newW, newH);
          });
        }
      }


      if (!isIframeTarget) {

        target.muted = true;
        target.setAttribute("muted", "");
      }
      setPreviewSrc(finalUrl);

      target.setAttribute("data-filename", isIframeTarget ? "YouTube Video" : "Video URL");
      target.setAttribute("data-filesize", "URL");
      if (liveElement && liveElement !== target) {
        liveElement.setAttribute('data-filename', isIframeTarget ? "YouTube Video" : "Video URL");
        liveElement.setAttribute('data-filesize', "URL");
      }
      setUpdateTrigger(prev => prev + 1);

      onUpdateRef.current?.();
      return;
    }

    // Otherwise, create a new element of the correct type and swap it
    let newElement;
    if (isIframeTarget) {
      newElement = document.createElement("iframe");
      newElement.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      newElement.src = finalUrl;
      newElement.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      newElement.allowFullscreen = true;

    } else {
      newElement = document.createElement("video");
      newElement.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      newElement.src = finalUrl;
      newElement.controls = true;
      newElement.muted = true;
      newElement.setAttribute("muted", "");
    }

    if (target.id) {
      newElement.id = target.id;
    }
    newElement.setAttribute("data-original-url", url);
    newElement.style.cssText = target.style.cssText;

    if (isIframeTarget) {
      const intrinsicW = 640;
      const intrinsicH = 360;
      newElement.setAttribute("width", intrinsicW.toString());
      newElement.setAttribute("height", intrinsicH.toString());
      newElement.setAttribute("data-original-width", intrinsicW.toString());
      newElement.setAttribute("data-original-height", intrinsicH.toString());
      newElement.style.width = intrinsicW + "px";
      newElement.style.height = intrinsicH + "px";
      newElement.style.transformOrigin = "0 0";

      const scaleX = newW / intrinsicW;
      const scaleY = newH / intrinsicH;
      newElement.style.transform = `scale(${scaleX}, ${scaleY})`;
    } else {
      newElement.setAttribute("width", "100%");
      newElement.setAttribute("height", "100%");
      newElement.style.width = "100%";
      newElement.style.height = "100%";
      newElement.style.transform = "none";
      newElement.style.objectFit = "contain";
    }

    if (liveElement) {
      const resizeAndCenter = (el, targetW, targetH) => {
        const oldW = parseFloat(el.getAttribute("width") || "0");
        const oldH = parseFloat(el.getAttribute("height") || "0");
        if (oldW > 0 && oldH > 0) {
          const oldX = parseFloat(el.getAttribute("x") || "0");
          const oldY = parseFloat(el.getAttribute("y") || "0");
          el.setAttribute("x", oldX + oldW / 2 - targetW / 2);
          el.setAttribute("y", oldY + oldH / 2 - targetH / 2);
        }
        el.setAttribute("width", targetW);
        el.setAttribute("height", targetH);
      };

      const fo = liveElement.tagName.toLowerCase() === "foreignobject"
        ? liveElement
        : (liveElement.closest("foreignObject") || liveElement.querySelector("foreignObject") || liveElement.querySelector("foreignobject"));

      if (fo) {
        resizeAndCenter(fo, newW, newH);
        fo.style.width = newW + "px";
        fo.style.height = newH + "px";
      }

      if (liveElement.tagName === "G") {
        liveElement.setAttribute("data-width", newW);
        liveElement.setAttribute("data-height", newH);
        liveElement.querySelectorAll("rect").forEach(rect => {
          if (rect.hasAttribute("width")) resizeAndCenter(rect, newW, newH);
        });
      }
    }


    // Preserve layout and data attributes
    Array.from(target.attributes).forEach(attr => {
      if (!["src", "id", "style", "allow", "allowfullscreen", "controls"].includes(attr.name)) {
        newElement.setAttribute(attr.name, attr.value);
      }
    });

    target.replaceWith(newElement);

    newElement.setAttribute("data-filename", isIframeTarget ? "YouTube Video" : "Video URL");
    newElement.setAttribute("data-filesize", "URL");
    if (liveElement && liveElement !== newElement) {
      liveElement.setAttribute('data-filename', isIframeTarget ? "YouTube Video" : "Video URL");
      liveElement.setAttribute('data-filesize', "URL");
    }
    setUpdateTrigger(prev => prev + 1);

    setPreviewSrc(finalUrl);
    onUpdateRef.current?.();
  };

  const handleAddUrl = () => {
    if (!inputUrl) return;

    const type = detectMediaType(inputUrl);
    if (type !== 'video') {
      alert("Please provide a valid video URL.");
      return;
    }

    setIsAddingUrl(true);
    setUrlAddProgress(0);
    setIsUrlAdded(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUrlAddProgress(100);
        replaceTemplateWithUrl(inputUrl);
        setTimeout(() => {
          setIsAddingUrl(false);
          setIsUrlAdded(true);
        }, 500);
      } else {
        setUrlAddProgress(progress);
      }
    }, 200);
  };

  if (!selectedElement) {
    return (
      <div className="border border-gray-200 rounded-[0.5vw] overflow-hidden bg-white shadow-sm p-[1vw] text-center text-gray-400 text-[0.75vw]">
        <VideoIcon className="mx-auto mb-[0.5vw]" size="0.9vw" />
        <p className="text-[0.75vw]">Click on a video to edit</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full font-sans text-gray-700 gap-[0.4vw]">
      <style>{`
        .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
        .custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
        .custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.4vw; cursor: pointer; transition: box-shadow 0.15s ease; position: relative; z-index: 2; }
        .custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
        body.is-scrubbing { overflow: hidden !important; }
      `}</style>

      {/* Video Property Section */}
      <div className="space-y-[1.2vw]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Video Property</span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
        </div>        {/* Video fix type */}
        <div className="flex items-center justify-between relative z-20">
          <div className="flex items-center gap-[0.5vw] flex-1">
            <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Image fix type</span>
            <div className="h-[0px] flex-1 border-t border-dashed border-gray-300 mx-[0.25vw]" />
          </div>
          <div className="relative">
            <div className="flex gap-[0.25vw] items-center">
              <button
                onClick={() => setShowVideoTypeDropdown(!showVideoTypeDropdown)}
                className="flex items-center justify-between w-[6.5vw] py-[0.35vw] px-[0.75vw] bg-white border border-gray-200 rounded-[0.45vw] shadow-xs hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <span className="text-[0.85vw] font-normal text-gray-700">{videoType}</span>
                <ChevronDown size="0.9vw" className={`text-gray-400 transition-transform ${showVideoTypeDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {showVideoTypeDropdown && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setShowVideoTypeDropdown(false)} />
                <div className="absolute right-0 top-full mt-[0.5vw] w-[6.5vw] bg-white border border-gray-100 rounded-[0.5vw] shadow-2xl overflow-hidden z-[100] flex flex-col py-[0.25vw] animate-in fade-in zoom-in-95 duration-150">
                  {['Fit', 'Fill', 'Stretch'].map((type) => (
                    <button
                      key={type}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowVideoTypeDropdown(false);

                        isHydrating.current = false;

                        const fitCssMap = { 'Fit': 'contain', 'Fill': 'cover', 'Stretch': 'fill' };
                        const cssVal = fitCssMap[type] || 'contain';

                        const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
                        const liveEl = (selectedLayerId && pageContainer)
                          ? pageContainer.querySelector(`[id="${selectedLayerId}"]`)
                          : selectedElement;

                        if (liveEl) {
                          liveEl.setAttribute('data-object-fit', type);
                          const videoEl = liveEl.querySelector('video, iframe');
                          if (videoEl) {
                            videoEl.style.setProperty('object-fit', cssVal, 'important');
                            videoEl.setAttribute('data-object-fit', type);
                          }
                        }
                        setVideoType(type);
                        applyVisuals();
                      }}
                      className="px-[1vw] py-[0.5vw] text-[0.8vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-[#4D47FF] transition-colors text-left"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Video Info Row */}
        <div className="flex items-center gap-[1vw] mt-[-1vw]">
          <div className="relative w-[8.5vw] h-[6vw] rounded-[0.4vw] overflow-hidden bg-gray-100 flex-shrink-0">
            {previewSrc ? (
              previewSrc.includes("youtube.com") || previewSrc.includes("youtu.be") ? (
                (() => {
                  const match = previewSrc.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
                  const vidId = match ? match[1] : null;
                  return vidId ? (
                    <div className="relative w-full h-full rounded-[0.4vw] overflow-hidden group">
                      <img src={`https://img.youtube.com/vi/${vidId}/hqdefault.jpg`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                    </div>
                  ) : (
                    <iframe src={previewSrc} className="w-full h-full object-cover pointer-events-none" frameBorder="0" allowFullScreen />
                  );
                })()
              ) : (
                <video src={previewSrc} className="w-full h-full object-cover" muted />
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <VideoIcon size="1.2vw" className="text-gray-300" />
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1 gap-[0.4vw] py-[0.2vw] mb-[1.1vw]">
            <div className="flex flex-col gap-[0.1vw] mt-[0.6vw]">
              <span className="text-[0.9vw] font-medium text-gray-700 truncate w-[10vw] mt-[0.8vw]" title={selectedElement?.getAttribute('data-filename') || selectedElement?.getAttribute('data-name') || 'Video'}>
                {selectedElement?.getAttribute('data-filename') || selectedElement?.getAttribute('data-name') || 'Video'}
              </span>
              <div className="text-[0.75vw] text-gray-400 flex items-center gap-[0.3vw] flex-nowrap whitespace-nowrap mt-[0.3vw]">
                {(videoDurationState || selectedElement?.getAttribute('data-video-duration')) && (
                  <>
                    <span>
                      {(() => {
                        const d = parseFloat(videoDurationState || selectedElement.getAttribute('data-video-duration'));
                        const m = Math.floor(d / 60).toString().padStart(2, '0');
                        const s = Math.floor(d % 60).toString().padStart(2, '0');
                        return (
                          <>
                            {m}:{s} <span className="text-[0.75vw] opacity-80">Mins</span>
                          </>
                        );
                      })()}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span>
                  {videoResolution ? `${videoResolution} • ` : ''}{videoFileSize || 'Unknown Size'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-[0.5vw] mt-[0.3vw]">
              <button
                onClick={() => setShowReplaceModal(true)}
                className="px-[0.65vw] py-[0.35vw] bg-gray-100 hover:bg-gray-200 text-gray-600 text-[0.75vw] font-medium rounded-[0.3vw] cursor-pointer transition-colors border border-gray-200"
              >
                Replace video
              </button>
              <button
                onClick={() => onDeleteLayer && onDeleteLayer()}
                className="p-[0.4vw] bg-gray-100 text-gray-500 rounded-[0.3vw] border border-gray-200 cursor-pointer transition-none"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[0.9vw] h-[0.9vw]">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>


        </div>


      </div>

      {/* Opacity Section */}
      <div className="flex items-center gap-[1vw] py-[0.5vw] mt-[-1vw]">
        <span className="text-[0.85vw] font-semibold text-black whitespace-nowrap">Opacity :</span>
        <div className="flex-1 flex items-center h-[1.5vw] rounded-full outline-none">
          <input
            type="range"
            min="0" max="100"
            value={opacity}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setOpacity(val);
              // Directly manipulate DOM for zero-flicker feedback
              const container = selectedElement.tagName === "FOREIGNOBJECT" ? selectedElement : (selectedElement.querySelector("foreignObject") || selectedElement.closest("foreignObject"));
              const target = container ? container.querySelector("video, iframe") : (selectedElement.tagName === "VIDEO" || selectedElement.tagName === "IFRAME" ? selectedElement : selectedElement.querySelector("video, iframe"));
              const visualTarget = container || target;
              if (visualTarget) {
                visualTarget.style.opacity = val / 100;
                visualTarget.setAttribute('opacity', val / 100);
              }
            }}
            onMouseUp={() => debouncedUpdate()}
            className="w-full cursor-pointer custom-range-slider"
            style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${opacity}%, #E2E8F0 ${opacity}%, #E2E8F0 100%)` }}
          />
        </div>
        <div className="min-w-[3.5vw] h-[2vw] border-[0.1vw] border-gray-200 rounded-[0.3vw] flex items-center justify-center text-[0.8vw] font-medium text-black bg-white shadow-sm px-[0.5vw]">
          {opacity} %
        </div>
      </div>

      {/* Cover Image Upload Options */}
      <div className="space-y-[1.2vw]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Cover Image Upload Options</span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
        </div>

        <div className="flex items-center justify-between px-[0.5vw]">
          <div className="flex flex-col gap-[1.2vw]">
            <label className="flex items-center gap-[0.8vw] cursor-pointer group">
              <div
                className={`w-[1.2vw] h-[1.2vw] rounded-full border-[0.1vw] flex items-center justify-center transition-all ${coverOption === 'upload' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-300'}`}
                onClick={() => { setCoverOption('upload'); coverInputRef.current?.click(); }}
              >
                {coverOption === 'upload' && <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-indigo-600" />}
              </div>
              <span className={`text-[0.75vw] font-medium transition-colors ${coverOption === 'upload' ? 'text-gray-900' : 'text-gray-800'}`}>Upload from your File</span>
            </label>
            <label className="flex items-center gap-[0.8vw] cursor-pointer group">
              <div
                className={`w-[1.2vw] h-[1.2vw] rounded-full border-[0.1vw] flex items-center justify-center transition-all ${coverOption === 'auto' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-300'}`}
                onClick={() => { setCoverOption('auto'); handleAutoPickThumbnail(); }}
              >
                {coverOption === 'auto' && <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-indigo-600" />}
              </div>
              <span className={`text-[0.75vw] font-medium transition-colors ${coverOption === 'auto' ? 'text-gray-900' : 'text-gray-800'}`}>Auto Pick from video</span>
            </label>
          </div>

          <div
            onClick={() => {
              if (coverOption === 'upload') coverInputRef.current?.click();
            }}
            className={`w-[8vw] h-[5vw] rounded-[0.8vw] flex flex-col items-center justify-center overflow-hidden transition-all ${coverOption === 'upload'
              ? 'border-2 border-dashed border-gray-200 bg-gray-50/30 hover:border-indigo-400 hover:bg-white cursor-pointer'
              : 'border border-gray-200 bg-gray-50'
              }`}
          >
            {posterSrc && coverOption === 'upload' ? (
              <img src={posterSrc} className="w-full h-full object-cover" />
            ) : coverOption === 'upload' ? (
              <>
                <Upload size="1vw" className="text-gray-300 mb-[0.2vw]" />
                <div className="text-[0.6vw] text-gray-400 text-center px-[0.5vw]">File Format : JPG, PNG</div>
              </>
            ) : (
              previewSrc ? (
                previewSrc.includes("youtube.com") || previewSrc.includes("youtu.be") ? (
                  (() => {
                    const match = previewSrc.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
                    const vidId = match ? match[1] : null;
                    return vidId ? (
                      <div className="relative w-full h-full rounded-[0.8vw] overflow-hidden group">
                        <img src={`https://img.youtube.com/vi/${vidId}/hqdefault.jpg`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                      </div>
                    ) : (
                      <iframe src={previewSrc} className="w-full h-full object-cover pointer-events-none" frameBorder="0" />
                    );
                  })()
                ) : (
                  <video src={previewSrc} className="w-full h-full object-cover pointer-events-none" muted />
                )
              ) : (
                <div className="flex flex-col items-center justify-center opacity-50">
                  <Icon icon="material-symbols:smart-display-outline" className="w-[1.2vw] h-[1.2vw] text-gray-400 mb-[0.2vw]" />
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Default Playback Settings / Settings */}
      <div className="space-y-[1.2vw]">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap mt-[0.5vw]">
            {previewSrc && (previewSrc.includes("youtube.com") || previewSrc.includes("youtu.be")) ? "Settings" : "Default Playback Settings"}
          </span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
        </div>

        <div className="space-y-[0.8vw] px-[0.5vw]">
          {!(previewSrc && (previewSrc.includes("youtube.com") || previewSrc.includes("youtu.be"))) && (
            <>
              {/* Play Video While */}
              <div className="flex items-center justify-between">
                <span className="text-[0.75vw] font-medium text-gray-800 w-[6.5vw] ">Play Video While</span>
                <span className="text-[0.75vw] font-medium text-gray-800 mr-[0.5vw]">:</span>
                <CustomSelect
                  value={playVideoWhile}
                  options={["Auto Play on Page Open", "Manual (Click to Play)"]}
                  onChange={(v) => {
                    setPlayVideoWhile(v);
                    if (v === "Manual (Click to Play)") {
                      updateElementAttribute('playPauseButton', true);
                    }
                  }}
                />
              </div>

              {/* Playback Speed */}
              <div className="flex items-center justify-between">
                <span className="text-[0.75vw] font-medium text-gray-800 w-[6.5vw]">Playback Speed</span>
                <span className="text-[0.75vw] font-medium text-gray-800 mr-[0.5vw]">:</span>
                <CustomSelect
                  value={playbackSpeed}
                  options={["0.5x", "1.0x", "1.5x", "2.0x"]}
                  onChange={setPlaybackSpeed}
                />
              </div>

              {/* Default Volume */}
              <div className="flex items-center justify-between mt-[1vw] mb-[0.5vw]">
                <span className="text-[0.75vw] font-medium text-gray-800 w-[6.5vw]">Default Volume</span>
                <span className="text-[0.75vw] font-medium text-gray-800 mr-[0.5vw]">:</span>
                <div className="flex items-center gap-[0.5vw] flex-1 w-full justify-between">
                  <button onClick={() => setMuted(!muted)}>
                    <Icon icon={muted || defaultVolume === 0 ? "lucide:volume-x" : "lucide:volume-2"} className="w-[1vw] h-[1vw] text-indigo-600" />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={muted ? 0 : defaultVolume}
                    onChange={(e) => {
                      if (muted) setMuted(false);
                      setDefaultVolume(parseInt(e.target.value));
                    }}
                    className="flex-1 w-[8.2vw] h-[0.3vw] bg-gray-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[0.8vw] [&::-webkit-slider-thumb]:h-[0.8vw] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #4f46e5 ${muted ? 0 : defaultVolume}%, #e5e7eb ${muted ? 0 : defaultVolume}%)`
                    }}
                  />
                  <span className="text-[0.65vw] font-medium text-gray-600 min-w-[1.5vw]">{muted ? 0 : defaultVolume} %</span>
                </div>
              </div>

              {/* Loop Video */}
              <div className="flex items-center justify-between pt-[0.4vw]">
                <span className="text-[0.75vw] font-medium text-gray-800">Loop Video</span>
                <Switch enabled={loop} onChange={setLoop} />
              </div>
            </>
          )}

          {previewSrc && (previewSrc.includes("youtube.com") || previewSrc.includes("youtu.be")) && (
            <div className="flex items-center justify-between pt-[0.4vw]">
              <span className="text-[0.75vw] font-medium text-gray-800">Autoplay</span>
              <Switch enabled={autoplay} onChange={setAutoplay} />
            </div>
          )}

          {/* Video Player Controls (Main Toggle) */}
          <div className="flex items-center justify-between pt-[0.4vw]">
            <span className="text-[0.75vw] font-medium text-gray-800">Video Player Controls</span>
            <Switch enabled={controls} onChange={setControls} />
          </div>
        </div>
      </div>

      {!(previewSrc && (previewSrc.includes("youtube.com") || previewSrc.includes("youtu.be"))) && (
        <div className="space-y-[1.2vw]">
          <div className="flex items-center gap-[0.5vw]">
            <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap mt-[1vw]">Video Player Controls</span>
            <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
          </div>

          <div className="space-y-[0.8vw] px-[0.5vw]">
            {[
              { label: "Play/Pause Button", value: playPauseButton, onChange: (v) => updateElementAttribute('playPauseButton', v), disabled: playVideoWhile === "Manual (Click to Play)" },
              { label: "Skip Forward/Backward (3 sec)", value: controls && skipButton, onChange: (v) => updateElementAttribute('skipButton', v), disabled: !controls },
              { label: "Progress Bar", value: controls && progressBar, onChange: (v) => updateElementAttribute('progressBar', v), disabled: !controls },
              { label: "Loop Button", value: controls && loopButtonControl, onChange: (v) => updateElementAttribute('loopButtonControl', v), disabled: !controls },
              { label: "Fullscreen Button", value: fullscreenButtonControl, onChange: (v) => updateElementAttribute('fullscreenButtonControl', v), disabled: false },
              { label: "Playback Speed Menu", value: controls && playbackSpeedMenu, onChange: (v) => updateElementAttribute('playbackSpeedMenu', v), disabled: !controls },
              { label: "Volume Control", value: controls && volumeControl, onChange: (v) => updateElementAttribute('volumeControl', v), disabled: !controls },
              { label: "Download Button", value: downloadButton, onChange: (v) => updateElementAttribute('downloadButton', v), disabled: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-[0.3vw]">
                <span className="text-[0.75vw] font-medium text-gray-800">{item.label}</span>
                <Switch enabled={item.value} onChange={item.onChange} disabled={item.disabled} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-[0.60vw] px-[0.3vw]">
        <Color
          openSubSection={openSubSection}
          setOpenSubSection={setOpenSubSection}
          backgroundColor={backgroundColor}
          setBackgroundColor={setBackgroundColor}
          activeColorPicker={activeColorPicker}
          setActiveColorPicker={setActiveColorPicker}
          showStrokeSettings={showStrokeSettings}
          setShowStrokeSettings={setShowStrokeSettings}
          isStrokeStyleOpen={isStrokeStyleOpen}
          setIsStrokeStyleOpen={setIsStrokeStyleOpen}
          dropdownPos={dropdownPos}
          setDropdownPos={setDropdownPos}
          strokeSettingsPos={strokeSettingsPos}
          setStrokeSettingsPos={setStrokeSettingsPos}
          isDashPosOpen={isDashPosOpen}
          setIsDashPosOpen={setIsDashPosOpen}
          activePopup={activePopup}
          setActivePopup={setActivePopup}
          colorsOnPage={colorsOnPage}
          showDetailedPicker={showDetailedPicker}
          setShowDetailedPicker={setShowDetailedPicker}
        />

        <Adjustment
          openSubSection={openSubSection}
          setOpenSubSection={setOpenSubSection}
          filters={filters}
          setFilters={setFilters}
          tagName={selectedElement?.tagName?.toLowerCase() || 'video'}
        />
        <Effect
          openSubSection={openSubSection}
          setOpenSubSection={setOpenSubSection}
          activeEffects={activeEffects}
          setActiveEffects={setActiveEffects}
          effectSettings={effectSettings}
          setEffectSettings={setEffectSettings}
          activeColorPicker={activeColorPicker}
          setActiveColorPicker={setActiveColorPicker}
          showDetailedPicker={showDetailedPicker}
          setShowDetailedPicker={setShowDetailedPicker}
        />
      </div>

      {/* Hidden Inputs */}
      <input ref={fileInputRef} type="file" accept="video/mp4" className="hidden" onChange={handleVideoUpload} />
      <input ref={coverInputRef} type="file" accept="image/jpeg, image/png" className="hidden" onChange={handleCoverUpload} />



      {/* Replace Media Modal Popup */}
      <ReplaceMediaModal
        show={showReplaceModal}
        mediaType="video"
        onClose={() => setShowReplaceModal(false)}
        onReplace={(file) => {
          if (file.isUrl) {
            replaceTemplateWithUrl(file.url);
          } else {
            handleVideoUpload({ target: { files: [file] } });
          }
        }}
      />
    </div>
  );
};

export default VideoEditor;
