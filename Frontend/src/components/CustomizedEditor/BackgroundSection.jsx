import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { ArrowLeftRight, Minus, RefreshCw, ChevronDown, X, Check, Upload, Image as ImageIcon, ChevronRight, Link } from 'lucide-react';
import backgroundComponents from './Backgrounds';
import animationComponents from './Animations';
import PremiumDropdown from './PremiumDropdown';
import {
  solidPalette,
  hexToRgb,
  generateGradientString,
  getColorAtOffset,
  CustomColorPicker,
  AdjustmentSlider,
  SectionLabel,
  DraggableSpan,
  ImageCropOverlay
} from './AppearanceShared';
import ReplaceMediaModal from '../TemplateEditor/ReplaceMediaModal';

const themeStaticCache = {};

const ThemePreview = React.memo(({ name, isLive }) => {
  const [isCached, setIsCached] = React.useState(isLive);

  useEffect(() => {
    if (isLive) {
      setIsCached(true);
    }
  }, [isLive]);

  const BackgroundComponent = backgroundComponents[name];

  if (!themeStaticCache[name]) {
    switch (name) {
      case 'Antigravity': themeStaticCache[name] = <Icon icon="lucide:orbit" className="w-5 h-5 text-pink-400" />; break;
      case 'ColorBlends': themeStaticCache[name] = <Icon icon="lucide:palette" className="w-5 h-5 text-purple-400" />; break;
      case 'DarkVeil': themeStaticCache[name] = <Icon icon="lucide:eye-off" className="w-5 h-5 text-slate-400" />; break;
      case 'DotGrid': themeStaticCache[name] = <Icon icon="lucide:grid-3x3" className="w-5 h-5 text-indigo-300" />; break;
      case 'FloatingLines': themeStaticCache[name] = <Icon icon="lucide:rows-3" className="w-5 h-5 text-sky-400" />; break;
      case 'Galaxy': themeStaticCache[name] = <Icon icon="lucide:sparkles" className="w-5 h-5 text-amber-300" />; break;
      case 'GridScan': themeStaticCache[name] = <Icon icon="lucide:scan" className="w-5 h-5 text-cyan-400" />; break;
      case 'Hyperspeed': themeStaticCache[name] = <Icon icon="lucide:zap" className="w-5 h-5 text-yellow-400" />; break;
      case 'Iridescence': themeStaticCache[name] = <Icon icon="lucide:sun-medium" className="w-5 h-5 text-emerald-300" />; break;
      case 'LightPillar': themeStaticCache[name] = <Icon icon="lucide:columns-2" className="w-5 h-5 text-slate-200" />; break;
      case 'LightRays': themeStaticCache[name] = <Icon icon="lucide:sun-dim" className="w-5 h-5 text-amber-200" />; break;
      case 'LiquidEther': themeStaticCache[name] = <Icon icon="lucide:droplet" className="w-5 h-5 text-blue-400" />; break;
      case 'Orb': themeStaticCache[name] = <Icon icon="lucide:disc-3" className="w-5 h-5 text-indigo-400" />; break;
      case 'Particles': themeStaticCache[name] = <Icon icon="lucide:loader" className="w-5 h-5 text-blue-300" />; break;
      case 'PixelSnow': themeStaticCache[name] = <Icon icon="lucide:snowflake" className="w-5 h-5 text-blue-200" />; break;
      case 'Prism': themeStaticCache[name] = <Icon icon="lucide:box" className="w-5 h-5 text-violet-300" />; break;
      case 'PrismaticBurst': themeStaticCache[name] = <Icon icon="lucide:sun-snow" className="w-5 h-5 text-rose-300" />; break;
      case 'Silk': themeStaticCache[name] = <Icon icon="lucide:waves" className="w-5 h-5 text-teal-300" />; break;
      case 'SplashCursor': themeStaticCache[name] = <Icon icon="lucide:mouse-pointer-click" className="w-5 h-5 text-green-400" />; break;
      case 'Threads': themeStaticCache[name] = <Icon icon="lucide:git-commit-horizontal" className="w-5 h-5 text-purple-300" />; break;
      case 'Waves': themeStaticCache[name] = <Icon icon="lucide:activity" className="w-5 h-5 text-cyan-300" />; break;
      default: themeStaticCache[name] = <Icon icon="lucide:sparkles" className="w-5 h-5 text-gray-400" />; break;
    }
  }

  return (
    <>
      <div
        className="absolute inset-0 pb-5 flex items-center justify-center transition-opacity duration-300 pointer-events-none"
        style={{ opacity: isLive ? 0 : 1 }}
      >
        {themeStaticCache[name]}
      </div>
      {isCached && BackgroundComponent && (
        <div
          className="scale-[0.2] origin-center w-[500%] h-[500%] absolute pointer-events-none transition-opacity duration-300"
          style={{ opacity: isLive ? 1 : 0 }}
        >
          <BackgroundComponent />
        </div>
      )}
    </>
  );
});

const AnimatedThemeItem = React.memo(({ name, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <div
      onClick={() => onSelect(name)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col gap-2"
    >
      <div className={`aspect-[6/5] w-full rounded-lg bg-black border-2 relative overflow-hidden transition-all ${isSelected ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.09]' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm hover:scale-[1.05]'}`}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <ThemePreview name={name} isLive={isSelected || isHovered} />
        </div>
        <div className={`absolute inset-x-0 transition-all duration-300 z-10 pointer-events-none ${isSelected ? 'top-1/2 -translate-y-1/2 py-2 bg-white/90 backdrop-blur-md flex items-center justify-center' : 'bottom-0 py-1.5 bg-black/60 backdrop-blur-sm text-center opacity-100 group-hover:opacity-0'}`}>
          <span className={`text-[0.7vw] font-semibold transition-colors duration-300 ${isSelected ? 'text-black' : 'text-white'}`}>{name}</span>
        </div>
      </div>
    </div>
  );
});

const AssetSkeleton = React.memo(({ isVideo = false }) => (
  <div className="absolute inset-0 bg-slate-200/90 rounded-lg overflow-hidden z-10 flex flex-col items-center justify-center border border-slate-300/40">
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        animation: 'shimmer 1.5s infinite',
        backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)'
      }}
    />
    <div className="w-[2vw] h-[2vw] rounded-full bg-slate-300/80 flex items-center justify-center mb-[0.4vw] shadow-xs">
      <Icon icon={isVideo ? "lucide:film" : "lucide:image"} className="w-[1.1vw] h-[1.1vw] text-slate-400" />
    </div>
    <div className="w-[50%] h-[0.4vw] bg-slate-300/80 rounded-full animate-pulse" />
    <style>{`
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
));

const VideoThemeItem = React.memo(({ vdo, i, isSelected, onSelect }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const divRef = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    
    if (divRef.current) observer.observe(divRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={divRef}
      onClick={() => onSelect(vdo)}
      className={`aspect-[6/5] w-full rounded-lg bg-slate-100 border-2 relative overflow-hidden transition-all cursor-pointer ${isSelected ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.09]' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm hover:scale-[1.05]'}`}
    >
      {!isLoaded && <AssetSkeleton isVideo={true} />}
      {isVisible && (
        <video
          src={vdo}
          className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          muted
          loop
          preload="metadata"
          onLoadedData={() => setIsLoaded(true)}
          onCanPlay={() => setIsLoaded(true)}
          onMouseEnter={(e) => e.target.play().catch(() => {})}
          onMouseLeave={(e) => e.target.pause()}
        />
      )}
      <div className={`absolute inset-x-0 transition-all duration-300 z-20 pointer-events-none ${isSelected ? 'top-1/2 -translate-y-1/2 py-2 bg-white/80 flex items-center justify-center' : 'bottom-0 py-1 bg-black/40 backdrop-blur-sm text-center opacity-100 group-hover:opacity-0'}`}>
        <span className={`text-[0.7vw] font-semibold transition-colors duration-300 ${isSelected ? 'text-black' : 'text-white'}`}>Video {i + 1}</span>
      </div>
    </div>
  );
});

const ImageThemeItem = React.memo(({ img, i, isSelected, onSelect }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const divRef = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    
    if (divRef.current) observer.observe(divRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={divRef}
      onClick={() => onSelect(img)}
      className={`aspect-[6/5] w-full rounded-lg bg-slate-100 border-2 relative overflow-hidden transition-all cursor-pointer group ${isSelected ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.09]' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm hover:scale-[1.05]'}`}
    >
      {!isLoaded && <AssetSkeleton isVideo={false} />}
      {isVisible && (
        <img 
          src={img} 
          alt={`Theme ${i}`} 
          className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />
      )}
      <div className={`absolute inset-x-0 transition-all duration-300 z-20 pointer-events-none ${isSelected ? 'top-1/2 -translate-y-1/2 py-2 bg-white/80 flex items-center justify-center' : 'bottom-0 py-1 bg-black/40 backdrop-blur-sm text-center opacity-100 group-hover:opacity-0'}`}>
        <span className={`text-[0.7vw] font-semibold transition-colors duration-300 ${isSelected ? 'text-black' : 'text-white'}`}>Theme {i}</span>
      </div>
    </div>
  );
});

const animationStaticCache = {};

const AnimationPreview = React.memo(({ name, isLive }) => {
  const [isCached, setIsCached] = React.useState(isLive);

  useEffect(() => {
    if (isLive) {
      setIsCached(true);
    }
  }, [isLive]);

  const AnimationComponent = animationComponents[name];

  if (!animationStaticCache[name]) {
    switch (name) {
      case 'FallingLeaves': animationStaticCache[name] = <Icon icon="lucide:leaf" className="w-4 h-4 text-amber-500" />; break;
      case 'Snow': animationStaticCache[name] = <Icon icon="lucide:snowflake" className="w-4 h-4 text-sky-200" />; break;
      case 'Bubbles': animationStaticCache[name] = <Icon icon="lucide:circle-dot" className="w-4 h-4 text-blue-300" />; break;
      case 'Confetti': animationStaticCache[name] = <Icon icon="lucide:party-popper" className="w-4 h-4 text-pink-400" />; break;
      case 'Rain': animationStaticCache[name] = <Icon icon="lucide:cloud-rain" className="w-4 h-4 text-cyan-400" />; break;
      case 'Fireflies': animationStaticCache[name] = <Icon icon="lucide:sparkle" className="w-4 h-4 text-yellow-300" />; break;
      case 'Matrix': animationStaticCache[name] = <Icon icon="lucide:code-2" className="w-4 h-4 text-emerald-400" />; break;
      case 'Hearts': animationStaticCache[name] = <Icon icon="lucide:heart" className="w-4 h-4 text-rose-500" />; break;
      case 'TwinklingStars': animationStaticCache[name] = <Icon icon="lucide:star" className="w-4 h-4 text-yellow-200" />; break;
      case 'Petals': animationStaticCache[name] = <Icon icon="lucide:flower-2" className="w-4 h-4 text-pink-300" />; break;
      case 'BinaryRain': animationStaticCache[name] = <Icon icon="lucide:terminal" className="w-4 h-4 text-emerald-500" />; break;
      case 'Balloons': animationStaticCache[name] = <Icon icon="lucide:circle" className="w-4 h-4 text-purple-400" />; break;
      case 'Lightning': animationStaticCache[name] = <Icon icon="lucide:zap" className="w-4 h-4 text-yellow-300" />; break;
      case 'Orbs': animationStaticCache[name] = <Icon icon="lucide:disc" className="w-4 h-4 text-indigo-400" />; break;
      case 'Scanlines': animationStaticCache[name] = <Icon icon="lucide:rows-2" className="w-4 h-4 text-slate-400" />; break;
      case 'Fireworks': animationStaticCache[name] = <Icon icon="lucide:sparkles" className="w-4 h-4 text-orange-400" />; break;
      case 'Glitch': animationStaticCache[name] = <Icon icon="lucide:cpu" className="w-4 h-4 text-cyan-400" />; break;
      case 'Butterflies': animationStaticCache[name] = <Icon icon="lucide:feather" className="w-4 h-4 text-purple-300" />; break;
      case 'Clouds': animationStaticCache[name] = <Icon icon="lucide:cloud" className="w-4 h-4 text-slate-200" />; break;
      case 'SpaceWarp': animationStaticCache[name] = <Icon icon="lucide:rocket" className="w-4 h-4 text-violet-300" />; break;
      case 'Jellyfish': animationStaticCache[name] = <Icon icon="lucide:lightbulb" className="w-4 h-4 text-cyan-300" />; break;
      case 'PaperPlanes': animationStaticCache[name] = <Icon icon="lucide:send" className="w-4 h-4 text-slate-300" />; break;
      case 'MusicalNotes': animationStaticCache[name] = <Icon icon="lucide:music" className="w-4 h-4 text-violet-300" />; break;
      case 'AutumnMix': animationStaticCache[name] = <Icon icon="lucide:tree-deciduous" className="w-4 h-4 text-amber-600" />; break;
      case 'FloatingGeo': animationStaticCache[name] = <Icon icon="lucide:hexagon" className="w-4 h-4 text-slate-300" />; break;
      case 'DustMotes': animationStaticCache[name] = <Icon icon="lucide:dot" className="w-4 h-4 text-amber-100" />; break;
      case 'Nebula': animationStaticCache[name] = <Icon icon="lucide:atom" className="w-4 h-4 text-purple-400" />; break;
      case 'Birds': animationStaticCache[name] = <Icon icon="lucide:bird" className="w-4 h-4 text-slate-400" />; break;
      case 'Plankton': animationStaticCache[name] = <Icon icon="lucide:sparkles" className="w-4 h-4 text-teal-300" />; break;
      case 'FireEmbers': animationStaticCache[name] = <Icon icon="lucide:flame" className="w-4 h-4 text-orange-500" />; break;
      case 'WaterDrops': animationStaticCache[name] = <Icon icon="lucide:droplets" className="w-4 h-4 text-blue-400" />; break;
      case 'Mist': animationStaticCache[name] = <Icon icon="lucide:cloud-fog" className="w-4 h-4 text-slate-300" />; break;
      case 'Disco': animationStaticCache[name] = <Icon icon="lucide:sun" className="w-4 h-4 text-pink-400" />; break;
      case 'Meteors': animationStaticCache[name] = <Icon icon="lucide:sparkles" className="w-4 h-4 text-amber-300" />; break;
      case 'Sparkles': animationStaticCache[name] = <Icon icon="lucide:sparkles" className="w-4 h-4 text-yellow-300" />; break;
      default: animationStaticCache[name] = <Icon icon="lucide:sparkles" className="w-4 h-4 text-gray-400" />; break;
    }
  }

  return (
    <>
      <div
        className="absolute inset-0 pb-5 flex items-center justify-center transition-opacity duration-300 pointer-events-none"
        style={{ opacity: isLive ? 0 : 1 }}
      >
        {animationStaticCache[name]}
      </div>
      {isCached && AnimationComponent && (
        <div
          className="scale-[0.2] origin-center w-[500%] h-[500%] absolute pointer-events-none transition-opacity duration-300"
          style={{ opacity: isLive ? 1 : 0 }}
        >
          <AnimationComponent />
        </div>
      )}
    </>
  );
});

const AnimationThemeItem = React.memo(({ name, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <div
      onClick={() => onSelect(name)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col gap-2"
    >
      <div className={`aspect-[6/5] w-full rounded-lg bg-black border-2 relative overflow-hidden transition-all ${isSelected ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.09]' : 'border-gray-100 hover:border-gray-200'}`}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/10">
          <AnimationPreview name={name} isLive={isSelected || isHovered} />
        </div>
        <div className={`absolute inset-x-0 transition-all duration-300 z-10 pointer-events-none ${isSelected ? 'top-1/2 -translate-y-1/2 py-2 bg-white/90 backdrop-blur-md flex items-center justify-center' : 'bottom-0 py-1.5 bg-black/60 backdrop-blur-sm text-center opacity-100 group-hover:opacity-0'}`}>
          <span className={`text-[0.7vw] font-semibold transition-colors duration-300 ${isSelected ? 'text-black' : 'text-white'}`}>{name}</span>
        </div>
      </div>
    </div>
  );
});

const BackgroundSection = ({
  backgroundSettings,
  onUpdateBackground,
  folder,
  flipbookName,
  v_id
}) => {
  const [activeTab, setActiveTab] = useState('Background');
  const [deferredTab, setDeferredTab] = useState('Background');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Defer rendering of heavy tab content to keep the UI responsive
  useEffect(() => {
    if (activeTab !== deferredTab) {
      setIsTransitioning(true);
      // Increased delay to ensure the UI paints the loader/active button state first
      const timer = setTimeout(() => {
        setDeferredTab(activeTab);
        setIsTransitioning(false);
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [activeTab, deferredTab]);

  const [themeType, setThemeType] = useState('Animated Themes');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const [showGallery, setShowGallery] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [localGallerySelected, setLocalGallerySelected] = useState(null);
  const [showBgCropOverlay, setShowBgCropOverlay] = useState(false);
  const [videoThemes, setVideoThemes] = useState([]);
  const [backgroundImageUrls, setBackgroundImageUrls] = useState([]);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const galleryInputRef = useRef(null);

  // Dynamically fetch preset background images and videos from backend
  useEffect(() => {
    try {
      sessionStorage.removeItem('fisto_bg_assets_cache');
    } catch (e) {}

    const fetchAssets = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const res = await axios.get(`${backendUrl}/api/flipbook/background-assets`);
        if (res.data && res.data.success) {
          const vdos = Array.isArray(res.data.videos) ? res.data.videos : [];
          const imgs = Array.isArray(res.data.images) ? res.data.images : [];

          setVideoThemes(vdos);
          setBackgroundImageUrls(imgs);
        }
      } catch (err) {
        console.warn("Could not fetch background assets from backend", err);
      }
    };
    fetchAssets();
  }, []);

  const handleEyeDropper = async () => {
    if (!window.EyeDropper) return;
    const eyeDropper = new window.EyeDropper();
    try {
      const result = await eyeDropper.open();
      const colorStr = (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color;
      let newOpacity = 100;
      if (colorStr && colorStr.length === 9) {
        newOpacity = Math.round((parseInt(colorStr.slice(7, 9), 16) / 255) * 100);
      }
      let alphaHex = '';
      if (newOpacity < 100) {
        alphaHex = Math.round((newOpacity / 100) * 255).toString(16).padStart(2, '0').toUpperCase();
      }
      onUpdateBackground({ ...backgroundSettings, style: 'Solid', color: result.sRGBHex.toUpperCase() + alphaHex });
    } catch (e) {
      console.log('EyeDropper cancelled or failed', e);
    }
  };

  // Load gallery images from localStorage on mount
  useEffect(() => {
    const savedImages = localStorage.getItem('customized_editor_gallery');
    if (savedImages) {
      try {
        setUploadedImages(JSON.parse(savedImages));
      } catch (e) {
        console.error("Failed to load gallery images", e);
      }
    }
  }, []);

  // Save gallery images to localStorage when updated
  useEffect(() => {
    if (uploadedImages.length > 0) {
      try {
        localStorage.setItem('customized_editor_gallery', JSON.stringify(uploadedImages));
      } catch (e) {
        console.warn("localStorage quota exceeded for gallery images", e);
      }
    }
  }, [uploadedImages]);

  // Removed aggressive preloading to fix slow network loading times
  useEffect(() => {
    // Media will load naturally with lazy loading
  }, []);

  const uploadCustomizedAsset = async (file, assetType = 'image') => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && file) {
        const user = JSON.parse(storedUser);
        const userEmail = user?.emailId || user?.email;
        if (!userEmail) return null;

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const formData = new FormData();
        formData.append('action', 'upload');
        formData.append('file', file);
        formData.append('emailId', userEmail);
        formData.append('assetType', assetType);
        formData.append('folderName', folder || 'My_Flipbooks');
        formData.append('flipbookName', flipbookName || v_id || 'Untitled Document');
        if (v_id) formData.append('v_id', v_id);
        if (backgroundSettings?.image) formData.append('oldSrc', backgroundSettings.image);

        const res = await axios.post(`${backendUrl}/api/flipbook/branding`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data?.url) {
          return res.data.url;
        }
      }
    } catch (err) {
      console.warn(`[BackgroundSection] ${assetType} upload warning:`, err);
    }
    return null;
  };

  const handleImageReplace = async (file) => {
    if (!file) return;

    const uploadedUrl = await uploadCustomizedAsset(file, 'Image');
    if (uploadedUrl) {
      const newImageData = { id: Date.now(), url: uploadedUrl };
      setUploadedImages((prev) => [newImageData, ...prev]);
      setLocalGallerySelected(newImageData);
      const newBgSettings = {
        ...backgroundSettings,
        style: 'Image',
        image: uploadedUrl,
        fit: backgroundSettings.fit || 'Cover',
        reactBitType: null
      };
      onUpdateBackground(newBgSettings);

      if (v_id) {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            const userEmail = user?.emailId || user?.email;
            if (userEmail) {
              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
              axios.post(`${backendUrl}/api/flipbook/background`, {
                action: 'save',
                emailId: userEmail,
                v_id: v_id,
                folderName: folder || 'My_Flipbooks',
                bookName: flipbookName || v_id || 'Untitled Document',
                backgroundSettings: newBgSettings
              }).catch(err => console.warn('[BackgroundSection] Immediate bg save warning:', err));

              axios.post(`${backendUrl}/api/flipbook/update-settings`, {
                emailId: userEmail,
                v_id: v_id,
                folderName: folder || 'My_Flipbooks',
                bookName: flipbookName || v_id || 'Untitled Document',
                Background: newBgSettings,
                settings: { background: newBgSettings }
              }).catch(err => console.warn('[BackgroundSection] Immediate update-settings warning:', err));
            }
          }
        } catch (e) {
          console.error('[BackgroundSection] Error auto-saving to DB:', e);
        }
      }

      return uploadedUrl;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const newImageData = { id: Date.now(), url: event.target.result };
      setUploadedImages((prev) => [newImageData, ...prev]);
      setLocalGallerySelected(newImageData);
      onUpdateBackground({
        ...backgroundSettings,
        style: 'Image',
        image: event.target.result,
        fit: backgroundSettings.fit || 'Cover',
        reactBitType: null
      });
    };
    reader.readAsDataURL(file);
  };

  const handleModalFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await handleImageReplace(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (backgroundSettings?.style === 'ReactBits' && backgroundSettings.reactBitType) {
      setSelectedTheme(backgroundSettings.reactBitType);
    } else {
      setSelectedTheme(null);
    }
  }, [backgroundSettings.style, backgroundSettings.reactBitType]);

  useEffect(() => {
    if (backgroundSettings?.reactBitType) {
      setSelectedTheme(backgroundSettings.reactBitType);
    } else {
      setSelectedTheme(null);
    }
  }, [backgroundSettings.reactBitType]);

  const [editingGradientStopIndex, setEditingGradientStopIndex] = useState(null);
  const [pendingNewStopOffset, setPendingNewStopOffset] = useState(null);

  // Optimization: Keep a ref of backgroundSettings to allow stable callbacks
  const settingsRef = React.useRef(backgroundSettings);
  React.useEffect(() => {
    settingsRef.current = backgroundSettings;
  }, [backgroundSettings]);

  const [mediaSubTab, setMediaSubTab] = useState(() => {
    return backgroundSettings?.style === 'Video' ? 'Video' : 'Image';
  });

  useEffect(() => {
    if (backgroundSettings?.style === 'Video') {
      setMediaSubTab('Video');
    } else if (backgroundSettings?.style === 'Image') {
      setMediaSubTab('Image');
    }
  }, [backgroundSettings?.style]);

  const handleVideoReplace = async (file) => {
    if (!file) return;

    const uploadedUrl = await uploadCustomizedAsset(file, 'Video');
    if (uploadedUrl) {
      const newBgSettings = {
        ...backgroundSettings,
        style: 'Video',
        video: uploadedUrl,
        fit: backgroundSettings.fit || 'Fill',
        reactBitType: null
      };
      onUpdateBackground(newBgSettings);

      if (v_id) {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            const userEmail = user?.emailId || user?.email;
            if (userEmail) {
              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
              axios.post(`${backendUrl}/api/flipbook/background`, {
                action: 'save',
                emailId: userEmail,
                v_id: v_id,
                folderName: folder || 'My_Flipbooks',
                bookName: flipbookName || v_id || 'Untitled Document',
                backgroundSettings: newBgSettings
              }).catch(err => console.warn('[BackgroundSection] Immediate bg video save warning:', err));

              axios.post(`${backendUrl}/api/flipbook/update-settings`, {
                emailId: userEmail,
                v_id: v_id,
                folderName: folder || 'My_Flipbooks',
                bookName: flipbookName || v_id || 'Untitled Document',
                Background: newBgSettings,
                settings: { background: newBgSettings }
              }).catch(err => console.warn('[BackgroundSection] Immediate update-settings warning:', err));
            }
          }
        } catch (e) {
          console.error('[BackgroundSection] Error auto-saving video to DB:', e);
        }
      }
      return uploadedUrl;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdateBackground({
        ...backgroundSettings,
        style: 'Video',
        video: event.target.result,
        fit: backgroundSettings.fit || 'Fill',
        reactBitType: null
      });
    };
    reader.readAsDataURL(file);
  };

  const saveBackgroundToDB = useCallback(async (newBgSettings) => {
    if (!v_id || !newBgSettings) return;
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userEmail = user?.emailId || user?.email;
        if (userEmail) {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          axios.post(`${backendUrl}/api/flipbook/background`, {
            action: 'save',
            emailId: userEmail,
            v_id: v_id,
            folderName: folder || 'My_Flipbooks',
            bookName: flipbookName || v_id || 'Untitled Document',
            backgroundSettings: newBgSettings
          }).catch(err => console.warn('[BackgroundSection] Immediate bg save warning:', err));

          axios.post(`${backendUrl}/api/flipbook/update-settings`, {
            emailId: userEmail,
            v_id: v_id,
            folderName: folder || 'My_Flipbooks',
            bookName: flipbookName || v_id || 'Untitled Document',
            Background: newBgSettings,
            settings: { background: newBgSettings }
          }).catch(err => console.warn('[BackgroundSection] Immediate update-settings warning:', err));
        }
      }
    } catch (e) {
      console.error('[BackgroundSection] Error auto-saving to DB:', e);
    }
  }, [v_id, folder, flipbookName]);

  const lastSavedSettingsRef = useRef(null);

  useEffect(() => {
    if (!v_id || !backgroundSettings) return;
    const settingsStr = JSON.stringify(backgroundSettings);
    if (lastSavedSettingsRef.current === settingsStr) return;

    const timer = setTimeout(() => {
      lastSavedSettingsRef.current = settingsStr;
      saveBackgroundToDB(backgroundSettings);
    }, 400);

    return () => clearTimeout(timer);
  }, [backgroundSettings, v_id, saveBackgroundToDB]);

  const handleStyleChange = (styleLabel) => {
    let targetStyle = styleLabel;
    if (styleLabel === 'Media') {
      targetStyle = mediaSubTab === 'Video' ? 'Video' : 'Image';
    }
    const newSettings = {
      ...backgroundSettings,
      style: targetStyle
    };
    onUpdateBackground(newSettings);
    saveBackgroundToDB(newSettings);
  };

  const handleSubTabChange = (newSubTab) => {
    setMediaSubTab(newSubTab);
    const targetStyle = newSubTab === 'Video' ? 'Video' : 'Image';
    if (backgroundSettings.style !== targetStyle) {
      const newSettings = {
        ...backgroundSettings,
        style: targetStyle
      };
      onUpdateBackground(newSettings);
      saveBackgroundToDB(newSettings);
    }
  };

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const rawStyle = (backgroundSettings?.style === 'ReactBits' || !backgroundSettings?.style) ? 'Solid' : backgroundSettings.style;
  const isMediaStyle = rawStyle === 'Image' || rawStyle === 'Video' || rawStyle === 'Media';
  const bgStyle = isMediaStyle ? 'Media' : rawStyle;

  useEffect(() => {
    if (bgStyle === 'Gradient' && backgroundSettings.gradientStops && !backgroundSettings.gradient) {
      const gradient = generateGradientString(
        backgroundSettings.gradientType || 'Linear',
        backgroundSettings.gradientStops,
        backgroundSettings.gradientAngle || 0,
        backgroundSettings.gradientRadius || 100
      );
      onUpdateBackground({ ...backgroundSettings, gradient });
    }
  }, [bgStyle, backgroundSettings.gradientStops, backgroundSettings.gradient, onUpdateBackground]);

  useEffect(() => {
    if (bgStyle === 'Gradient' && (!backgroundSettings.gradientStops || backgroundSettings.gradientStops.length === 0)) {
      const stops = [
        { color: '#FFFFFF', offset: 0, opacity: 100 },
        { color: '#D1D5DB', offset: 100, opacity: 100 }
      ];
      onUpdateBackground({
        ...backgroundSettings,
        gradientType: 'Linear',
        gradientStops: stops,
        gradientRadius: 100,
        gradientAngle: 0,
        gradient: generateGradientString('Linear', stops, 0, 100)
      });
    }
  }, [bgStyle, backgroundSettings.gradientStops, onUpdateBackground]);

  useEffect(() => {
    if (pendingNewStopOffset !== null && backgroundSettings.gradientStops) {
      const index = backgroundSettings.gradientStops.findIndex(s => s.offset === pendingNewStopOffset);
      if (index !== -1) {
        openGradientStopPicker(index);
        setPendingNewStopOffset(null);
      }
    }
  }, [backgroundSettings.gradientStops, pendingNewStopOffset]);

  const updateGradientStop = (index, updates) => {
    const newStops = [...(backgroundSettings.gradientStops || [])];
    newStops[index] = { ...newStops[index], ...updates };
    const gradient = generateGradientString(
      backgroundSettings.gradientType || 'Linear',
      newStops,
      backgroundSettings.gradientAngle || 0,
      backgroundSettings.gradientRadius || 100
    );
    onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
  };

  const removeGradientStop = (index) => {
    if (backgroundSettings.gradientStops.length <= 2) return;
    const newStops = backgroundSettings.gradientStops.filter((_, i) => i !== index);
    const gradient = generateGradientString(
      backgroundSettings.gradientType || 'Linear',
      newStops,
      backgroundSettings.gradientAngle || 0,
      backgroundSettings.gradientRadius || 100
    );
    onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
  };

  const addGradientStop = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const offset = Math.min(100, Math.max(0, Math.round((x / rect.width) * 100)));
    const color = getColorAtOffset(offset, backgroundSettings.gradientStops || []);
    const newStop = { color: color, offset, opacity: 100 };
    const newStops = [...(backgroundSettings.gradientStops || []), newStop].sort((a, b) => a.offset - b.offset);
    const gradient = generateGradientString(
      backgroundSettings.gradientType || 'Linear',
      newStops,
      backgroundSettings.gradientAngle || 0,
      backgroundSettings.gradientRadius || 100
    );

    setPickerPos({ x: e.clientX - 100, y: rect.top - 100 });
    setPendingNewStopOffset(offset);

    onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
  };

  const reverseGradient = () => {
    const newStops = [...(backgroundSettings.gradientStops || [])].map(s => ({ ...s, offset: 100 - s.offset })).sort((a, b) => a.offset - b.offset);
    const gradient = generateGradientString(
      backgroundSettings.gradientType || 'Linear',
      newStops,
      backgroundSettings.gradientAngle || 0,
      backgroundSettings.gradientRadius || 100
    );
    onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
  };

  const resetGradient = () => {
    const newStops = [
      { color: '#FFFFFF', offset: 0, opacity: 100 },
      { color: '#D1D5DB', offset: 100, opacity: 100 }
    ];
    const gradient = generateGradientString('Linear', newStops, 0, 100);
    onUpdateBackground({
      ...backgroundSettings,
      gradientType: 'Linear',
      gradientStops: newStops,
      gradientAngle: 0,
      gradientRadius: 100,
      gradient
    });
  };

  const openGradientStopPicker = (index) => {
    setEditingGradientStopIndex(index);
  };

  const setBgStyle = (style) => {
    if (style === 'Gradient' && backgroundSettings.gradientStops) {
      const gradient = generateGradientString(
        backgroundSettings.gradientType || 'Linear',
        backgroundSettings.gradientStops,
        backgroundSettings.gradientAngle || 0,
        backgroundSettings.gradientRadius || 100
      );
      onUpdateBackground({ ...backgroundSettings, style, gradient });
    } else if (style === 'Solid' && backgroundSettings.savedSolidColor) {
      onUpdateBackground({ ...backgroundSettings, style, color: backgroundSettings.savedSolidColor });
    } else if (style === 'Media') {
      const targetStyle = mediaSubTab === 'Video' ? 'Video' : 'Image';
      onUpdateBackground({ ...backgroundSettings, style: targetStyle });
    } else {
      onUpdateBackground({ ...backgroundSettings, style });
    }
  };

  const handleColorSelect = (color) => {
    onUpdateBackground({ ...backgroundSettings, style: 'Solid', color });
  };

  const handleAdjustmentChange = (key, value) => {
    onUpdateBackground({
      ...backgroundSettings,
      adjustments: {
        ...(backgroundSettings?.adjustments || {}),
        [key]: value
      }
    });
  };

  const handleAnimatedThemeSelect = React.useCallback((name) => {
    setSelectedTheme(name);
    const updates = {
      ...settingsRef.current,
      style: 'ReactBits',
      reactBitType: name,
      color: '#000000'
    };
    if (settingsRef.current.style !== 'ReactBits') {
      updates.savedNonThemeSettings = {
        style: settingsRef.current.style,
        color: settingsRef.current.color,
        gradient: settingsRef.current.gradient,
        gradientType: settingsRef.current.gradientType,
        gradientStops: settingsRef.current.gradientStops,
        gradientAngle: settingsRef.current.gradientAngle,
        gradientRadius: settingsRef.current.gradientRadius,
        image: settingsRef.current.image,
        fit: settingsRef.current.fit,
        adjustments: settingsRef.current.adjustments,
        cropData: settingsRef.current.cropData,
        opacity: settingsRef.current.opacity
      };

      if (settingsRef.current.style === 'Solid' || settingsRef.current.color) {
        updates.savedSolidColor = settingsRef.current.color;
      }
    } else if (settingsRef.current.savedNonThemeSettings) {
      updates.savedNonThemeSettings = settingsRef.current.savedNonThemeSettings;
      updates.savedSolidColor = settingsRef.current.savedSolidColor;
    }
    onUpdateBackground(updates);
  }, [onUpdateBackground]);

  const handleVideoThemeSelect = React.useCallback(async (vdo) => {
    setSelectedTheme(null);
    let finalVideoUrl = vdo;

    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && vdo) {
        const user = JSON.parse(storedUser);
        const userEmail = user?.emailId || user?.email;
        if (userEmail) {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const res = await axios.post(`${backendUrl}/api/flipbook/copy-theme-asset`, {
            emailId: userEmail,
            v_id: v_id,
            folderName: folder || 'My_Flipbooks',
            flipbookName: flipbookName || v_id || 'Untitled Document',
            imageUrl: vdo
          });

          if (res.data?.url) {
            finalVideoUrl = res.data.url;
          }
        }
      }
    } catch (err) {
      console.warn("[BackgroundSection] Failed to copy theme video to Supabase:", err);
    }

    const newBgSettings = {
      ...settingsRef.current,
      style: 'Video',
      video: finalVideoUrl,
      fit: 'Fill',
      color: '#000000'
    };
    onUpdateBackground(newBgSettings);
    saveBackgroundToDB(newBgSettings);
  }, [onUpdateBackground, saveBackgroundToDB, v_id, folder, flipbookName]);

  const handleImageThemeSelect = React.useCallback(async (img) => {
    setSelectedTheme(null);

    let finalImageUrl = img;

    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && img) {
        const user = JSON.parse(storedUser);
        const userEmail = user?.emailId || user?.email;
        if (userEmail) {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const res = await axios.post(`${backendUrl}/api/flipbook/copy-theme-asset`, {
            emailId: userEmail,
            v_id: v_id,
            folderName: folder || 'My_Flipbooks',
            flipbookName: flipbookName || v_id || 'Untitled Document',
            imageUrl: img
          });

          if (res.data?.url) {
            finalImageUrl = res.data.url;
          }
        }
      }
    } catch (err) {
      console.warn("[BackgroundSection] Failed to copy theme image to Supabase:", err);
    }

    const newBgSettings = {
      ...settingsRef.current,
      style: 'Image',
      image: finalImageUrl,
      fit: 'Fill'
    };

    onUpdateBackground(newBgSettings);

    if (v_id) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const userEmail = user?.emailId || user?.email;
          if (userEmail) {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            axios.post(`${backendUrl}/api/flipbook/background`, {
              action: 'save',
              emailId: userEmail,
              v_id: v_id,
              folderName: folder || 'My_Flipbooks',
              bookName: flipbookName || v_id || 'Untitled Document',
              backgroundSettings: newBgSettings
            }).catch(err => console.warn('[BackgroundSection] Immediate bg save warning:', err));

            axios.post(`${backendUrl}/api/flipbook/update-settings`, {
              emailId: userEmail,
              v_id: v_id,
              folderName: folder || 'My_Flipbooks',
              bookName: flipbookName || v_id || 'Untitled Document',
              Background: newBgSettings,
              settings: { background: newBgSettings }
            }).catch(err => console.warn('[BackgroundSection] Immediate update-settings warning:', err));
          }
        }
      } catch (e) {
        console.error('[BackgroundSection] Error auto-saving to DB:', e);
      }
    }
  }, [onUpdateBackground, folder, flipbookName, v_id]);

  const handleAnimationSelect = React.useCallback((n) => {
    const current = settingsRef.current;
    const updates = { ...current, animation: n };
    if (current.style !== 'ReactBits' && (!current.animation || current.animation === 'None')) {
      updates.savedNonThemeSettings = {
        style: current.style,
        color: current.color,
        gradient: current.gradient,
        gradientType: current.gradientType,
        gradientStops: current.gradientStops,
        gradientAngle: current.gradientAngle,
        gradientRadius: current.gradientRadius,
        image: current.image,
        fit: current.fit,
        adjustments: current.adjustments,
        cropData: current.cropData,
        opacity: current.opacity,
        savedSolidColor: current.savedSolidColor
      };
    }
    onUpdateBackground(updates);
  }, [onUpdateBackground]);

  // Top-level Memoized Grids to avoid "Rendered more hooks" errors and improve performance
  const animatedThemesList = React.useMemo(() => {
    if (deferredTab !== 'Themes') return null;
    return Object.keys(backgroundComponents).sort().map((name) => (
      <AnimatedThemeItem
        key={name}
        name={name}
        isSelected={selectedTheme === name}
        onSelect={handleAnimatedThemeSelect}
      />
    ));
  }, [selectedTheme, handleAnimatedThemeSelect, deferredTab]);

  const videoThemesList = React.useMemo(() => {
    if (deferredTab !== 'Themes') return null;
    return videoThemes.map((vdo, i) => (
      <VideoThemeItem
        key={vdo}
        vdo={vdo}
        i={i}
        isSelected={backgroundSettings.video === vdo || backgroundSettings.image === vdo}
        onSelect={handleVideoThemeSelect}
      />
    ));
  }, [backgroundSettings.video, backgroundSettings.image, handleVideoThemeSelect, deferredTab, videoThemes]);

  const backgroundThemesList = React.useMemo(() => {
    if (deferredTab !== 'Themes') return null;
    return backgroundImageUrls.map((imgUrl, index) => {
      return (
        <ImageThemeItem
          key={imgUrl}
          img={imgUrl}
          i={index + 1}
          isSelected={backgroundSettings.image === imgUrl}
          onSelect={handleImageThemeSelect}
        />
      );
    });
  }, [backgroundSettings.image, handleImageThemeSelect, deferredTab, themeType, backgroundImageUrls]);

  const animationsList = React.useMemo(() => {
    if (deferredTab !== 'Animations') return null;
    return Object.keys(animationComponents).sort().map((name) => (
      <AnimationThemeItem
        key={name}
        name={name}
        isSelected={backgroundSettings.animation === name}
        onSelect={handleAnimationSelect}
      />
    ));
  }, [backgroundSettings.animation, handleAnimationSelect, deferredTab]);

  const resetAllAdjustments = () => {
    onUpdateBackground({
      ...backgroundSettings,
      adjustments: {
        exposure: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        tint: 0,
        highlights: 0,
        shadows: 0
      }
    });
  };

  return (
    <div className="px-[1vw] flex flex-col relative">
      <div className="sticky top-0 z-[50] bg-white mb-[0.5vw] -mx-[1vw] px-[1.5vw] border-b-[0.15vw] border-gray-200">
        <div className="flex items-center justify-center">
          {['Background', 'Themes', 'Animations'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                const prevTab = activeTab;
                setActiveTab(tab);
                
                if (prevTab === tab) return;

                const updates = { ...settingsRef.current };

                // 1. Save state of the tab we are leaving
                if (prevTab === 'Background') {
                  updates.savedBackgroundTabSettings = {
                    style: updates.style,
                    color: updates.color,
                    gradient: updates.gradient,
                    gradientType: updates.gradientType,
                    gradientStops: updates.gradientStops,
                    gradientAngle: updates.gradientAngle,
                    gradientRadius: updates.gradientRadius,
                    image: updates.image,
                    fit: updates.fit,
                    adjustments: updates.adjustments,
                    cropData: updates.cropData,
                    opacity: updates.opacity,
                    video: updates.video,
                    savedSolidColor: updates.savedSolidColor,
                    savedNonThemeSettings: updates.savedNonThemeSettings
                  };
                } else if (prevTab === 'Themes') {
                  updates.savedThemesTabSettings = {
                    style: updates.style,
                    color: updates.color,
                    gradient: updates.gradient,
                    reactBitType: updates.reactBitType,
                    image: updates.image,
                    video: updates.video,
                    fit: updates.fit
                  };
                } else if (prevTab === 'Animations') {
                  updates.savedAnimation = updates.animation;
                }

                // 2. Restore state of the tab we are entering
                if (tab === 'Themes') {
                  updates.animation = 'None'; // Hide animation
                  if (updates.savedThemesTabSettings) {
                    Object.assign(updates, updates.savedThemesTabSettings);
                  } else {
                    if (selectedTheme) {
                      updates.style = 'ReactBits';
                      updates.reactBitType = selectedTheme;
                      updates.color = '#000000';
                      updates.gradient = '';
                    } else {
                      updates.style = 'Solid';
                      updates.color = 'transparent';
                      updates.reactBitType = null;
                      updates.gradient = '';
                    }
                  }
                } else if (tab === 'Background') {
                  updates.animation = 'None'; // Hide animation
                  if (updates.savedBackgroundTabSettings) {
                    Object.assign(updates, updates.savedBackgroundTabSettings);
                  } else if (updates.savedNonThemeSettings) {
                    Object.assign(updates, updates.savedNonThemeSettings);
                  } else if (updates.savedSolidColor) {
                    updates.style = 'Solid';
                    updates.color = updates.savedSolidColor;
                  }
                } else if (tab === 'Animations') {
                  // Hide base background and themes, show only the animation overlay
                  updates.style = 'Solid';
                  updates.color = 'transparent';
                  updates.reactBitType = null;
                  updates.gradient = '';
                  updates.image = '';
                  updates.video = '';
                  updates.animation = updates.savedAnimation || 'None';
                }

                onUpdateBackground(updates);
              }}
              className={`pb-[1vw] pt-[0.5vw] mb-[-0.15vw] mt-[0.5vw] text-[0.85vw] font-medium transition-all border-b-[0.15vw] flex-1 ${activeTab === tab
                  ? 'text-gray-900 border-[#EC5137]'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Background' && (
        <div className="flex flex-col gap-[0.5vw] mt-[0.5vw]">
          {/* Style Tabs (Solid, Gradient, Media) */}
          <div className="flex items-center justify-between gap-[0.5vw] w-full">
            {['Solid Color', 'Gradient', 'Image'].map((styleLabel) => {
              const mappedStyle = styleLabel === 'Solid Color' ? 'Solid' : styleLabel === 'Image' ? 'Media' : styleLabel;
              const isSelected = mappedStyle === 'Media'
                ? bgStyle === 'Media'
                : bgStyle === mappedStyle;
              return (
                <button
                  key={styleLabel}
                  onClick={() => handleStyleChange(mappedStyle)}
                  className={`flex-1 py-[0.45vw] text-[0.88vw] font-semibold rounded-[0.5vw] transition-all border border-transparent ${isSelected
                      ? 'bg-white text-[#EC5137] shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)]'
                      : 'bg-white text-gray-400 shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'
                    }`}
                >
                  {styleLabel}
                </button>
              );
            })}
          </div>


          {bgStyle === 'Solid' && (
            <div className="flex flex-col gap-[1.5vw]">
              <div className="mb-[0.5vw]">
                <div className="flex items-center gap-[1vw] mb-[1.25vw] mt-[1vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Pick Colors From Pallet</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                </div>

                <div className="flex items-center justify-between gap-[1vw]">
                  <span className="text-[0.75vw] font-semibold text-gray-700">Fill :</span>
                  <div className="flex-1 flex gap-[0.5vw] items-center color-picker-trigger">
                    <div
                      className="w-[2vw] h-[2vw] border border-gray-200 rounded-[0.5vw] shadow-[0_2px_4px_rgba(0,0,0,0.06)] cursor-pointer hover:border-indigo-400 transition-colors"
                      style={{ backgroundColor: (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPickerPos({ x: rect.left - 0, y: rect.top - 0 });
                        setShowColorPicker(true);
                      }}
                    />
                    <div className="flex-1 h-[2vw] border border-gray-200 rounded-[0.5vw] flex items-center px-[0.75vw] justify-between bg-white hover:border-indigo-400 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
                      <input
                        type="text"
                        value={(() => {
                          const colorStr = (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color;
                          if (!colorStr) return '#000000';
                          if (colorStr.length === 9) return colorStr.slice(0, 7).toUpperCase();
                          return colorStr.toUpperCase();
                        })()}
                        onChange={(e) => {
                          let newHex = e.target.value;
                          if (!newHex.startsWith('#')) newHex = '#' + newHex;
                          const validHex = newHex.slice(0, 7);
                          const colorStr = (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color;
                          let newOpacity = 100;
                          if (colorStr && colorStr.length === 9) {
                            newOpacity = Math.round((parseInt(colorStr.slice(7, 9), 16) / 255) * 100);
                          }
                          let alphaHex = '';
                          if (newOpacity < 100) {
                            alphaHex = Math.round((newOpacity / 100) * 255).toString(16).padStart(2, '0').toUpperCase();
                          }
                          onUpdateBackground({ ...backgroundSettings, style: 'Solid', color: validHex + alphaHex });
                        }}
                        className="text-[0.85vw] font-medium text-gray-700 font-mono bg-transparent w-[5vw] outline-none"
                      />
                      <DraggableSpan
                        label={`${(() => {
                          const colorStr = (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color;
                          if (!colorStr || colorStr.length !== 9) return 100;
                          return Math.round((parseInt(colorStr.slice(7, 9), 16) / 255) * 100);
                        })()}%`}
                        value={(() => {
                          const colorStr = (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color;
                          if (!colorStr || colorStr.length !== 9) return 100;
                          return Math.round((parseInt(colorStr.slice(7, 9), 16) / 255) * 100);
                        })()}
                        onChange={(newOpacity) => {
                          const colorStr = (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color;
                          const hex = (colorStr && colorStr.length === 9) ? colorStr.slice(0, 7) : (colorStr || '#000000');
                          let alphaHex = '';
                          if (newOpacity < 100) {
                            alphaHex = Math.round((newOpacity / 100) * 255).toString(16).padStart(2, '0').toUpperCase();
                          }
                          onUpdateBackground({ ...backgroundSettings, style: 'Solid', color: hex + alphaHex });
                        }}
                        min={0}
                        max={100}
                        className="text-[0.85vw] font-medium text-gray-400 font-mono"
                      />
                    </div>
                    {window.EyeDropper && (
                      <button
                        onClick={handleEyeDropper}
                        className="w-[2vw] h-[2vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center bg-white shadow-sm hover:border-indigo-400 hover:bg-gray-50 transition-all cursor-pointer"
                        title="Eye Dropper"
                      >
                        <Icon icon="lucide:pipette" className="w-[1vw] h-[1vw] text-gray-500 hover:text-gray-800" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-[0.5vw]">
                <div className="flex items-center gap-[1vw] mb-[1.25vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Solid Colors</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                </div>

                <div className="grid grid-cols-6 gap-[0.725vw] px-[0.25vw]">
                  {solidPalette.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => handleColorSelect(color)}
                      className={`aspect-square rounded-[0.5vw] border shadow-sm transition-all hover:scale-110 ${backgroundSettings.color.toLowerCase() === color.toLowerCase() ? 'border-[#3E4491] border-[0.125vw] ring-[0.125vw] ring-indigo-100 scale-105' : 'border-gray-200 hover:border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {bgStyle === 'Gradient' && (
            <div className="space-y-[0.5vw]">

              <div>
                <div className="flex items-center gap-[0.75vw] mb-[1vw] mt-[1vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 pb-[0.5vw]">Customize your Color</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                  <div className="flex gap-[0.5vw]">
                    <button onClick={resetGradient} className="w-[2vw] h-[2vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.5vw] shadow-[0_0.2vw_0.4vw_rgba(0,0,0,0.08)] hover:bg-gray-50 transition-colors" title="Reset Gradient">
                      <Icon icon="ix:reset" className="w-[1.2vw] h-[1.2vw] text-gray-600" />
                    </button>
                    <button onClick={reverseGradient} className="w-[2vw] h-[2vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.5vw] shadow-[0_0.2vw_0.4vw_rgba(0,0,0,0.08)] hover:bg-gray-50 transition-colors" title="Swap Directions">
                      <ArrowLeftRight size="1.2vw" className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-start w-full mb-[1vw] mt-[-0.5vw]">
                  <PremiumDropdown
                    options={['Linear', 'Radial', 'Angular', 'Diamond']}
                    value={backgroundSettings.gradientType || 'Linear'}
                    onChange={(type) => {
                      const newAngle = type === 'Radial' ? 0 : (backgroundSettings.gradientAngle || 0);
                      const gradient = generateGradientString(
                        type,
                        backgroundSettings.gradientStops || [],
                        newAngle,
                        backgroundSettings.gradientRadius || 100
                      );
                      onUpdateBackground({
                        ...backgroundSettings,
                        gradientType: type,
                        gradientAngle: newAngle,
                        gradient
                      });
                    }}
                    width="6vw"
                    align="right"
                  />
                </div>

                <div className="space-y-[0.75vw] mb-[1.5vw]">
                  {(() => {
                    const gType = backgroundSettings.gradientType || 'Linear';
                    const gStops = backgroundSettings.gradientStops || [];
                    const gAngle = backgroundSettings.gradientAngle || 0;
                    const stopsStr = [...gStops].sort((a, b) => a.offset - b.offset).map(s => {
                      const rgb = hexToRgb(s.color);
                      const op = (s.opacity || 100) / 100;
                      return `rgba(${rgb.r},${rgb.g},${rgb.b},${op}) ${s.offset}%`;
                    }).join(', ');

                    let previewBg = '';
                    let previewStyle = {};

                    if (gType === 'Angular') {
                      previewBg = generateGradientString('Angular', gStops, gAngle, backgroundSettings.gradientRadius || 100);
                      previewStyle = { backgroundImage: previewBg, borderRadius: '0.4vw' };
                    } else if (gType === 'Diamond') {
                      previewBg = generateGradientString('Diamond', gStops, gAngle, backgroundSettings.gradientRadius || 100);
                      previewStyle = { backgroundImage: previewBg, borderRadius: '0.4vw' };
                    } else if (gType === 'Radial') {
                      previewBg = generateGradientString('Radial', gStops, gAngle, backgroundSettings.gradientRadius || 100);
                      previewStyle = { backgroundImage: previewBg, borderRadius: '50%' };
                    } else {
                      previewBg = `linear-gradient(${gAngle}deg, ${stopsStr})`;
                      previewStyle = { backgroundImage: previewBg, borderRadius: '0.4vw' };
                    }

                    return (
                      <div className="flex items-center gap-[1vw]">
                        <div className="relative flex-shrink-0 shadow-md border border-gray-100" style={{ width: '4vw', height: '4vw', ...previewStyle }} />
                        <div className="flex-1 flex flex-col gap-[0.375vw]">
                          <span className="text-[0.625vw] font-semibold text-gray-500 uppercase tracking-wide">{gType} Gradient</span>
                          {(gType === 'Linear' || gType === 'Angular') && (
                            <div className="flex items-center gap-[0.5vw]">
                              <span className="text-[0.75vw] font-semibold text-gray-700">Angle</span>
                              <input
                                type="range"
                                min="0"
                                max="360"
                                value={backgroundSettings.gradientAngle || 0}
                                onChange={(e) => {
                                  const a = parseInt(e.target.value);
                                  const gradient = generateGradientString(gType, gStops, a, backgroundSettings.gradientRadius || 100);
                                  onUpdateBackground({ ...backgroundSettings, gradientAngle: a, gradient });
                                }}
                                className="flex-1 h-[0.3vw] rounded-full  cursor-pointer"
                                style={{ accentColor: '#3b3c8aff' }}
                              />
                              <span className="text-[0.6vw] font-semibold text-gray-600 w-[2vw] text-right">{backgroundSettings.gradientAngle || 0}°</span>
                            </div>
                          )}
                          {(gType === 'Radial' || gType === 'Diamond') && (
                            <div className="flex items-center gap-[0.5vw]">
                              <span className="text-[0.75vw] font-semibold text-gray-700">Radius</span>
                              <input
                                type="range"
                                min="10"
                                max="200"
                                value={backgroundSettings.gradientRadius || 100}
                                onChange={(e) => {
                                  const r = parseInt(e.target.value);
                                  const gradient = generateGradientString(gType, gStops, gAngle, r);
                                  onUpdateBackground({ ...backgroundSettings, gradientRadius: r, gradient });
                                }}
                                className="flex-1 h-[0.3vw] rounded-full cursor-pointer"
                                style={{ accentColor: '#3b3c8aff' }}
                              />
                              <span className="text-[0.6vw] font-semibold text-gray-600 w-[2vw] text-right">{backgroundSettings.gradientRadius || 100}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="relative pt-[1.5vw] pb-[0.5vw] px-[0.25vw]">
                    <div className="absolute top-0 left-0 w-full h-[2vw] flex items-center pointer-events-none px-[0.25vw]">
                      {(backgroundSettings.gradientStops || []).map((stop, idx) => (
                        <div
                          key={idx}
                          className="absolute -translate-x-1/2 flex flex-col items-center group pointer-events-auto cursor-grab active:cursor-grabbing color-picker-trigger"
                          style={{ left: `${stop.offset}%`, bottom: '0.5vw' }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startOffset = stop.offset;
                            let hasDragged = false;
                            const rect = e.currentTarget.parentElement.parentElement.getBoundingClientRect();
                            const currentTargetElement = e.currentTarget;

                            const handleMouseMove = (moveEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              if (Math.abs(deltaX) > 3) {
                                hasDragged = true;
                                const deltaPercent = (deltaX / rect.width) * 100;
                                const newOffset = Math.min(100, Math.max(0, startOffset + deltaPercent));
                                updateGradientStop(idx, { offset: Math.round(newOffset) });
                              }
                            };
                            const handleMouseUp = () => {
                              window.removeEventListener('mousemove', handleMouseMove);
                              window.removeEventListener('mouseup', handleMouseUp);
                              if (!hasDragged) {
                                const pickRect = currentTargetElement.getBoundingClientRect();
                                setPickerPos({ x: pickRect.left - 120, y: pickRect.top - 100 });
                                openGradientStopPicker(idx);
                              }
                            };
                            window.addEventListener('mousemove', handleMouseMove);
                            window.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          <div
                            className="border-2 border-white shadow-md relative hover:scale-110 transition-transform"
                            style={{
                              width: '1.5vw', height: '1.5vw',
                              backgroundColor: stop.color,
                              borderRadius: (backgroundSettings.gradientType === 'Diamond') ? '0.15vw' : '0.4vw'
                            }}
                          >
                            <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[0.3vw] border-l-transparent border-r-[0.3vw] border-r-transparent border-t-[0.4vw] border-t-white"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className="w-full h-[1.5vw] rounded-[0.4vw] shadow-inner border border-gray-100 cursor-copy"
                      onClick={addGradientStop}
                      style={{
                        backgroundImage: `linear-gradient(to right, ${(backgroundSettings.gradientStops || []).map(s => {
                          const rgb = hexToRgb(s.color);
                          const opacity = (s.opacity || 100) / 100;
                          return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity}) ${s.offset}%`;
                        }).join(', ')})`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-[0.75vw]">
                  {(backgroundSettings.gradientStops || []).map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-[0.75vw] color-picker-trigger">
                      <div
                        className="w-[2.25vw] h-[2.25vw] rounded-[0.5vw] border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-400 transition-colors"
                        style={{ backgroundColor: stop.color }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPickerPos({ x: rect.right - 0, y: rect.top - 0 });
                          openGradientStopPicker(idx);
                        }}
                      />
                      <div
                        className="flex-1 h-[2.25vw] border border-gray-600 rounded-[0.5vw] flex items-center px-[0.75vw] justify-start bg-white hover:border-indigo-400 transition-colors"
                      >
                        <input
                          type="text"
                          value={stop.color.toUpperCase()}
                          onChange={(e) => {
                            let newHex = e.target.value;
                            if (!newHex.startsWith('#')) newHex = '#' + newHex;
                            const validHex = newHex.slice(0, 9);
                            updateGradientStop(idx, { color: validHex });
                          }}
                          className="text-[0.85vw] font-medium text-gray-700 font-mono bg-transparent outline-none w-full"
                        />
                      </div>
                      <button onClick={() => removeGradientStop(idx)} className="w-[2.25vw] h-[2.25vw] flex items-center justify-center border border-red-500 rounded-[0.5vw] text-red-500 hover:bg-red-50 transition-colors">
                        <Minus size="1.2vw" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-[1vw] mb-[1.5vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Gradient Colors</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                </div>
                <div className="grid grid-cols-6 gap-[0.625vw] px-[0.25vw]">
                  {[
                    ['#FFE2BB', '#FFBBC1'], ['#4DBA55', '#A2D357'], ['#FF0581', '#FFB5DC'],
                    ['#7F073D', '#F967C8'], ['#ff3969', '#faccc5'], ['#FDBB2D', '#22C1C3'],
                    ['#FFB0DC', '#DFCBFF'], ['#82ABFF', '#43D3DA'], ['#A5B4FC', '#E0E7FF'],
                    ['#fa709a', '#D5A7FF'], ['#30cfd0', '#713EAE'], ['#a18cd1', '#fbc2eb'],
                    ['#6FF067', '#8131FF'], ['#FEA8BF', '#76F9FE'], ['#3873A7', '#208D6B'],
                    ['#FEF0A5', '#97006F'], ['#57047D', '#EEBEBE'], ['#7CC38F', '#FF76D9'],
                  ].map((colors, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const newStops = colors.map((c, idx) => ({
                          color: c,
                          offset: Math.round((idx / (colors.length - 1)) * 100),
                          opacity: 100
                        }));
                        const gradient = generateGradientString(
                          backgroundSettings.gradientType || 'Linear',
                          newStops,
                          backgroundSettings.gradientAngle || 0,
                          backgroundSettings.gradientRadius || 100
                        );
                        onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
                      }}
                      className="aspect-square rounded-[0.5vw] border border-gray-200 shadow-sm transition-all hover:scale-110"
                      style={{ backgroundImage: `linear-gradient(to bottom right, ${colors.join(', ')})` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {bgStyle === 'Media' && (
            <div className="flex flex-col gap-[0.75vw]">
              {/* Media Sub Tabs (Image & Video) */}
              <div className="flex items-center gap-[0.4vw] p-[0.2vw] bg-gray-100/90 rounded-[0.5vw] mt-[0.5vw] border border-gray-200/50">
                <button
                  onClick={() => handleSubTabChange('Image')}
                  className={`flex-1 py-[0.4vw] text-[0.78vw] font-semibold rounded-[0.4vw] transition-all flex items-center justify-center gap-[0.35vw] ${
                    mediaSubTab === 'Image'
                      ? 'bg-white text-gray-900 shadow-xs border border-gray-200/70 font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon icon="lucide:image" className="w-[0.9vw] h-[0.9vw]" />
                  Image
                </button>
                <button
                  onClick={() => handleSubTabChange('Video')}
                  className={`flex-1 py-[0.4vw] text-[0.78vw] font-semibold rounded-[0.4vw] transition-all flex items-center justify-center gap-[0.35vw] ${
                    mediaSubTab === 'Video'
                      ? 'bg-white text-gray-900 shadow-xs border border-gray-200/70 font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon icon="lucide:film" className="w-[0.9vw] h-[0.9vw]" />
                  Video
                </button>
              </div>

              {/* Sub Tab: Image */}
              {mediaSubTab === 'Image' && (
                <div className="flex flex-col gap-[1vw]">
                  <div className="mb-[0.5vw]">
                    <div className="flex items-center gap-[0.5vw] mt-[0.5vw]">
                      <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Upload Image</span>
                      <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
                      {backgroundSettings.image && (
                        <PremiumDropdown
                          options={['Fit', 'Fill', 'Stretch', 'Crop']}
                          value={backgroundSettings.fit}
                          onChange={(fill) => {
                            if (fill === 'Crop') {
                              setShowBgCropOverlay(true);
                            } else {
                              onUpdateBackground({ ...backgroundSettings, fit: fill });
                            }
                          }}
                          width="5vw"
                          align="right"
                        />
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleImageReplace(file);
                        }
                        e.target.value = '';
                      }}
                    />

                    {backgroundSettings.style === 'Image' && backgroundSettings.image ? (
                      <div
                        className="flex items-center gap-[1vw]"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            const file = e.dataTransfer.files[0];
                            if (file.type.startsWith('image/')) {
                              handleImageReplace(file);
                            }
                          }
                        }}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-[8.5vw] h-[6vw] rounded-[0.4vw] overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={backgroundSettings.image}
                            alt="Thumbnail"
                            className={`w-full h-full ${backgroundSettings?.cropData ? 'object-cover' : 'object-fill'}`}
                            style={(() => {
                              const cd = backgroundSettings?.cropData;
                              return cd && cd.inset ? {
                                clipPath: cd.inset,
                                WebkitClipPath: cd.inset,
                                transform: `translate(${cd.offX}%, ${cd.offY}%) scale(${cd.scale})`,
                                transformOrigin: 'center center'
                              } : {};
                            })()}
                          />
                        </div>

                        {/* Info & Actions */}
                        <div className="flex flex-col flex-1 gap-[0.4vw] py-[0.2vw] mb-[1.1vw]">
                          <div className="flex flex-col gap-[0.1vw] mt-[0.6vw]">
                            <span className="text-[0.9vw] font-medium text-gray-700 truncate w-[10vw] mt-[0.8vw]" title="Image">
                              Image
                            </span>
                            <span className="text-[0.75vw] text-gray-400 mt-[0.3vw]">
                              Unknown Size
                            </span>
                          </div>

                          <div className="flex items-center gap-[0.5vw] mt-[0.3vw]">
                            <button
                              onClick={() => setReplaceTarget('image')}
                              className="px-[0.65vw] py-[0.35vw] bg-gray-100 hover:bg-gray-200 text-gray-600 text-[0.75vw] font-medium rounded-[0.3vw] cursor-pointer transition-colors border border-gray-200"
                            >
                              Replace image
                            </button>
                            <button
                              onClick={async () => {
                                const currentImage = backgroundSettings.image;
                                const newBgSettings = { ...backgroundSettings, image: null };
                                onUpdateBackground(newBgSettings);

                                if (currentImage) {
                                  try {
                                    const storedUser = localStorage.getItem('user');
                                    if (storedUser) {
                                      const user = JSON.parse(storedUser);
                                      const userEmail = user?.emailId || user?.email;
                                      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

                                      await axios.post(`${backendUrl}/api/flipbook/branding`, {
                                        action: 'delete',
                                        emailId: userEmail,
                                        v_id: v_id,
                                        assetType: 'image',
                                        src: currentImage,
                                        folderName: folder || 'My_Flipbooks',
                                        flipbookName: flipbookName || v_id || 'Untitled Document'
                                      });

                                      if (v_id) {
                                        await axios.post(`${backendUrl}/api/flipbook/background`, {
                                          action: 'save',
                                          emailId: userEmail,
                                          v_id: v_id,
                                          folderName: folder || 'My_Flipbooks',
                                          bookName: flipbookName || v_id || 'Untitled Document',
                                          backgroundSettings: newBgSettings
                                        });

                                        await axios.post(`${backendUrl}/api/flipbook/update-settings`, {
                                          emailId: userEmail,
                                          v_id: v_id,
                                          folderName: folder || 'My_Flipbooks',
                                          bookName: flipbookName || v_id || 'Untitled Document',
                                          Background: newBgSettings,
                                          settings: { background: newBgSettings }
                                        });
                                      }
                                    }
                                  } catch (err) {
                                    console.warn('[BackgroundSection] Image delete asset warning:', err);
                                  }
                                }
                              }}
                              className="p-[0.4vw] bg-gray-100 text-gray-500 rounded-[0.3vw] border border-gray-200 cursor-pointer hover:text-red-600 transition-colors"
                            >
                              <Icon icon="lucide:trash-2" className="w-[0.9vw] h-[0.9vw]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-[0.75vw] mb-[1vw]">
                        {/* Drag & Drop Box */}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) {
                              handleImageReplace(file);
                            }
                          }}
                          className="w-full h-[7vw] mt-[0.5vw] border-2 border-dashed border-slate-300 rounded-[1vw] bg-white flex items-center justify-center text-center cursor-pointer transition-all hover:border-slate-400 group shadow-2xs"
                        >
                          <div className="flex items-center gap-[0.5vw]">
                            <Icon icon="lucide:image" className="w-[1.2vw] h-[1.2vw] text-slate-500 group-hover:text-slate-700" />
                            <span className="text-slate-600 text-[0.85vw] font-medium group-hover:text-slate-800">+ Add Image</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub Tab: Video */}
              {mediaSubTab === 'Video' && (
                <div className="flex flex-col gap-[1vw]">
                  <div className="mb-[0.5vw]">
                    <div className="flex items-center gap-[0.5vw] mt-[0.5vw]">
                      <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Upload Video</span>
                      <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
                      {backgroundSettings.video && (
                        <PremiumDropdown
                          options={['Fit', 'Fill', 'Stretch']}
                          value={backgroundSettings.fit || 'Fill'}
                          onChange={(fill) => {
                            onUpdateBackground({ ...backgroundSettings, fit: fill });
                          }}
                          width="5vw"
                          align="right"
                        />
                      )}
                    </div>

                    <input
                      type="file"
                      ref={videoInputRef}
                      className="hidden"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleVideoReplace(file);
                        }
                        e.target.value = '';
                      }}
                    />

                    {backgroundSettings.style === 'Video' && backgroundSettings.video ? (
                      <div className="flex items-center gap-[1vw]">
                        {/* Video Thumbnail Preview */}
                        <div className="relative w-[8.5vw] h-[6vw] rounded-[0.4vw] overflow-hidden bg-black flex-shrink-0 border border-gray-200">
                          <video
                            src={backgroundSettings.video}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            autoPlay
                            playsInline
                          />
                        </div>

                        {/* Info & Actions */}
                        <div className="flex flex-col flex-1 gap-[0.4vw] py-[0.2vw] mb-[1.1vw]">
                          <div className="flex flex-col gap-[0.1vw] mt-[0.6vw]">
                            <span className="text-[0.9vw] font-medium text-gray-700 truncate w-[10vw] mt-[0.8vw]" title="Video">
                              Video
                            </span>
                            <span className="text-[0.75vw] text-gray-400 mt-[0.3vw]">
                              Background Video
                            </span>
                          </div>

                          <div className="flex items-center gap-[0.5vw] mt-[0.3vw]">
                            <button
                              onClick={() => setReplaceTarget('video')}
                              className="px-[0.65vw] py-[0.35vw] bg-gray-100 hover:bg-gray-200 text-gray-600 text-[0.75vw] font-medium rounded-[0.3vw] cursor-pointer transition-colors border border-gray-200"
                            >
                              Replace video
                            </button>
                            <button
                              onClick={async () => {
                                const currentVideo = backgroundSettings.video;
                                const newBgSettings = { ...backgroundSettings, video: null, style: 'Solid' };
                                onUpdateBackground(newBgSettings);

                                if (currentVideo) {
                                  try {
                                    const storedUser = localStorage.getItem('user');
                                    if (storedUser) {
                                      const user = JSON.parse(storedUser);
                                      const userEmail = user?.emailId || user?.email;
                                      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

                                      await axios.post(`${backendUrl}/api/flipbook/branding`, {
                                        action: 'delete',
                                        emailId: userEmail,
                                        v_id: v_id,
                                        assetType: 'video',
                                        src: currentVideo,
                                        folderName: folder || 'My_Flipbooks',
                                        flipbookName: flipbookName || v_id || 'Untitled Document'
                                      });
                                    }
                                  } catch (err) {
                                    console.warn('[BackgroundSection] Video delete asset warning:', err);
                                  }
                                }
                              }}
                              className="p-[0.4vw] bg-gray-100 text-gray-500 rounded-[0.3vw] border border-gray-200 cursor-pointer hover:text-red-600 transition-colors"
                            >
                              <Icon icon="lucide:trash-2" className="w-[0.9vw] h-[0.9vw]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-[0.75vw] mb-[1vw]">
                        {/* Drag & Drop Box */}
                        <div
                          onClick={() => videoInputRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('video/')) {
                              handleVideoReplace(file);
                            }
                          }}
                          className="w-full h-[7vw] mt-[0.5vw] border-2 border-dashed border-slate-300 rounded-[1vw] bg-white flex items-center justify-center text-center cursor-pointer transition-all hover:border-slate-400 group shadow-2xs"
                        >
                          <div className="flex items-center gap-[0.5vw]">
                            <Icon icon="lucide:film" className="w-[1.2vw] h-[1.2vw] text-slate-500 group-hover:text-slate-700" />
                            <span className="text-slate-600 text-[0.85vw] font-medium group-hover:text-slate-800">+ Add Video</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Opacity Slider and Adjustments - Show only if active media sub-tab has data */}
          {bgStyle === 'Media' && (mediaSubTab === 'Image' ? !!backgroundSettings.image : !!backgroundSettings.video) ? (
            <>
              <style>{`
                .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
                .custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
                .custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
                .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.55vw; cursor: pointer; transition: box-shadow 0.15s ease; position: relative; z-index: 2; }
                .custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
              `}</style>
              <div className="flex items-center gap-[1vw] py-[0.5vw] mt-[-0.5vw]">
                <span className="text-[0.75vw] font-semibold text-gray-700 whitespace-nowrap">Opacity :</span>
                <div className="flex-1 flex items-center h-[1.5vw] rounded-full outline-none">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={backgroundSettings.opacity ?? 100}
                    onChange={(e) => onUpdateBackground({ ...backgroundSettings, opacity: parseInt(e.target.value) })}
                    className="w-full cursor-pointer custom-range-slider"
                    style={{
                      backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${backgroundSettings.opacity ?? 100}%, #E2E8F0 ${backgroundSettings.opacity ?? 100}%, #E2E8F0 100%)`
                    }}
                  />
                </div>
                <div className="px-[0.6vw] py-[0.3vw] bg-white border border-gray-200 rounded-[0.4vw] text-[0.75vw] font-semibold text-gray-700 min-w-[3vw] text-center shadow-sm">
                  {backgroundSettings.opacity ?? 100}%
                </div>
              </div>

              {/* Dynamic Color Toggle */}
              <div className="flex items-center justify-between gap-[1vw] py-[0.5vw] mt-[0.2vw] mb-[0.2vw]">
                <span className="text-[0.75vw] text-gray-600 font-normal leading-snug">
                  Automatically match layout colors to the selected theme.
                </span>
                <div className="flex-shrink-0 flex justify-end">
                  <div
                    onClick={() => {
                      const currentVal = backgroundSettings.applyDynamicColor ?? true;
                      onUpdateBackground({ ...backgroundSettings, applyDynamicColor: !currentVal });
                    }}
                    className={`w-[2.2vw] h-[1.2vw] flex items-center rounded-full p-[0.1vw] cursor-pointer transition-colors duration-300 ${
                      (backgroundSettings.applyDynamicColor ?? true) ? 'bg-[#4D47FF]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-[1vw] h-[1vw] rounded-full shadow-md transform transition-transform duration-300 ${
                        (backgroundSettings.applyDynamicColor ?? true) ? 'translate-x-[1vw]' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Collapsible Adjustment Section */}
              <div className="flex flex-col mt-[0.5vw]">
                <div
                  onClick={() => setShowAdjustments(!showAdjustments)}
                  className={`w-full flex items-center justify-between px-[1vw] py-[1vw] bg-white border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors ${showAdjustments ? 'rounded-t-[0.75vw] border-b-0' : 'rounded-[0.75vw]'}`}
                >
                  <span className="text-[0.75vw] font-semibold text-gray-700">Adjustments</span>
                  <ChevronDown
                    size="0.95vw"
                    className={`text-gray-500 transition-transform duration-200 ${showAdjustments ? 'rotate-180' : ''}`}
                  />
                </div>

                {showAdjustments && (
                  <div className="space-y-[0.1vw] border border-gray-200 rounded-b-[0.75vw] bg-white p-[0.5vw]">
                    <AdjustmentSlider
                      label="Exposure"
                      value={backgroundSettings?.adjustments?.exposure || 0}
                      onChange={(val) => handleAdjustmentChange('exposure', val)}
                      onReset={() => handleAdjustmentChange('exposure', 0)}
                    />
                    <AdjustmentSlider
                      label="Contrast"
                      value={backgroundSettings?.adjustments?.contrast || 0}
                      onChange={(val) => handleAdjustmentChange('contrast', val)}
                      onReset={() => handleAdjustmentChange('contrast', 0)}
                    />
                    <AdjustmentSlider
                      label="Saturation"
                      value={backgroundSettings?.adjustments?.saturation || 0}
                      onChange={(val) => handleAdjustmentChange('saturation', val)}
                      onReset={() => handleAdjustmentChange('saturation', 0)}
                    />
                    <AdjustmentSlider
                      label="Temperature"
                      value={backgroundSettings?.adjustments?.temperature || 0}
                      onChange={(val) => handleAdjustmentChange('temperature', val)}
                      onReset={() => handleAdjustmentChange('temperature', 0)}
                    />
                    <AdjustmentSlider
                      label="Tint"
                      value={backgroundSettings?.adjustments?.tint || 0}
                      onChange={(val) => handleAdjustmentChange('tint', val)}
                      onReset={() => handleAdjustmentChange('tint', 0)}
                    />
                    <AdjustmentSlider
                      label="Highlights"
                      value={backgroundSettings?.adjustments?.highlights || 0}
                      onChange={(val) => handleAdjustmentChange('highlights', val)}
                      onReset={() => handleAdjustmentChange('highlights', 0)}
                    />
                    <AdjustmentSlider
                      label="Shadows"
                      value={backgroundSettings?.adjustments?.shadows || 0}
                      onChange={(val) => handleAdjustmentChange('shadows', val)}
                      onReset={() => handleAdjustmentChange('shadows', 0)}
                    />
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'Themes' && (
        <div className={`flex flex-col relative ${isTransitioning ? 'opacity-50 pointer-events-none' : ''}`}>
          {isTransitioning && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-[2vw]">
                <Icon icon="svg-spinners:ring-resize" className="w-8 h-8 text-[#3B3C8A]" />
                <span className="text-[0.7vw] font-semibold text-gray-500">Optimizing...</span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-[0.5vw] ">
            <div className="sticky top-0 z-[50] flex items-center justify-between gap-[0.5vw] w-full mb-[0.5vw] bg-white py-[0.5vw]">
              {['Static', 'Dynamic'].map((tabLabel) => {
                const tabValue = tabLabel === 'Static' ? 'Background Themes' : 'Animated Themes';
                return (
                  <button
                    key={tabValue}
                    onClick={() => setThemeType(tabValue)}
                    className={`flex-1 py-[0.59vw] text-[0.80vw] font-semibold rounded-[0.5vw] transition-all border border-transparent ${themeType === tabValue
                        ? 'bg-white text-gray-900 shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)]'
                        : 'bg-white text-gray-400 shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'
                      }`}
                  >
                    {tabLabel}
                  </button>
                )
              })}
            </div>

            {/* Dynamic Color Toggle in Themes tab */}
            <div className="flex items-center justify-between gap-[1vw] py-[0.2vw] mb-[0.6vw] px-1">
              <span className="text-[0.75vw] text-gray-600 font-normal leading-snug">
                Automatically match layout colors to the selected theme.
              </span>
              <div className="flex-shrink-0 flex justify-end">
                <div
                  onClick={() => {
                    const currentVal = backgroundSettings.applyDynamicColor ?? true;
                    onUpdateBackground({ ...backgroundSettings, applyDynamicColor: !currentVal });
                  }}
                  className={`w-[2.2vw] h-[1.2vw] flex items-center rounded-full p-[0.1vw] cursor-pointer transition-colors duration-300 ${
                    (backgroundSettings.applyDynamicColor ?? true) ? 'bg-[#4D47FF]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-[1vw] h-[1vw] rounded-full shadow-md transform transition-transform duration-300 ${
                      (backgroundSettings.applyDynamicColor ?? true) ? 'translate-x-[1vw]' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className={`flex flex-col gap-[1vw] px-1 pb-2 ${themeType !== 'Animated Themes' ? 'hidden' : ''}`}>
              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={() => {
                    setSelectedTheme(null);
                    onUpdateBackground({
                      ...backgroundSettings,
                      style: 'Solid',
                      reactBitType: null,
                      color: 'transparent'
                    });
                  }}
                  className="group cursor-pointer flex flex-col gap-[1vw]"
                >
                  <div className={`aspect-[6/5] w-full rounded-lg bg-gray-50 border-2 relative overflow-hidden transition-all flex items-center justify-center ${!selectedTheme ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}>
                    <Icon icon="lucide:ban" className="w-6 h-6 text-gray-300" />
                    <div className={`absolute inset-x-0 transition-all duration-300 ${!selectedTheme ? 'top-1/2 -translate-y-1/2 py-2 bg-black/40 flex items-center justify-center scale-[1.02]' : 'bottom-0 py-1 bg-gray/40 backdrop-blur-md text-center'}`}>
                      <span className={`text-[0.75vw] font-semibold transition-colors duration-300 ${!selectedTheme ? 'text-white' : 'text-gray-800'}`}>None</span>
                    </div>
                  </div>
                </div>

                {animatedThemesList}
              </div>

              <div className="flex flex-col gap-[0.5vw]">
                <div className="flex items-center gap-[1vw] mb-[0.5vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Video Themes</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {videoThemesList}
                </div>
              </div>
            </div>

            <div className={`flex flex-col gap-[1vw] px-1 pb-2 ${themeType !== 'Background Themes' ? 'hidden' : ''}`}>


              <div className="grid grid-cols-3 gap-2">
                {backgroundThemesList}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Animations' && (
        <div className="grid grid-cols-3 gap-[0.5vw] px-[0.5vw] pb-[1vw] pt-[1vw]">
          {/* None Option */}
          <div
            onClick={() => {
              onUpdateBackground({ ...backgroundSettings, animation: 'None' });
            }}
            className="group cursor-pointer flex flex-col gap-2"
          >
            <div className={`aspect-[6/5] w-full rounded-lg bg-gray-50 border-2 relative overflow-hidden transition-all flex items-center justify-center ${backgroundSettings.animation === 'None' || !backgroundSettings.animation ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}>
              <Icon icon="lucide:ban" className="w-6 h-6 text-gray-300" />
              <div className={`absolute inset-x-0 transition-all duration-300 ${(backgroundSettings.animation === 'None' || !backgroundSettings.animation)
                  ? 'top-1/2 -translate-y-1/2 py-2 bg-black/40 flex items-center justify-center'
                  : 'bottom-0 py-1 bg-gray/40 backdrop-blur-md text-center'
                }`}>
                <span className={`text-[0.7vw] font-semibold transition-colors duration-300 ${(backgroundSettings.animation === 'None' || !backgroundSettings.animation) ? 'text-white' : 'text-gray-800'
                  }`}>None</span>
              </div>
            </div>
          </div>

          {animationsList}
        </div>
      )}

      {/* Solid Color Picker */}
      {showColorPicker && (
        <CustomColorPicker
          color={backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor ? backgroundSettings.savedSolidColor : backgroundSettings.color}
          onChange={(color) => {
            handleColorSelect(color);
          }}
          onClose={() => setShowColorPicker(false)}
          position={pickerPos}
        />
      )}

      {/* Gradient Stop Color Picker */}
      {editingGradientStopIndex !== null && backgroundSettings.gradientStops && (
        <CustomColorPicker
          color={backgroundSettings.gradientStops[editingGradientStopIndex].color}
          opacity={backgroundSettings.gradientStops[editingGradientStopIndex].opacity || 100}
          onChange={(color) => {
            updateGradientStop(editingGradientStopIndex, { color });
          }}
          onOpacityChange={(opacity) => {
            updateGradientStop(editingGradientStopIndex, { opacity });
          }}
          onClose={() => setEditingGradientStopIndex(null)}
          position={pickerPos}
        />
      )}

      {/* Image Gallery Pop-up */}
      {showGallery && (
        <div className="fixed z-[1000] bg-white border border-gray-100 rounded-[0.8vw] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ width: '320px', height: '540px', top: '50%', left: '24vw', transform: 'translate(-50%, -50%)' }}>
          <div className="flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-100">
            <h2 className="text-[1vw] font-semibold text-gray-900">Image Gallery</h2>
            <button onClick={() => setShowGallery(false)} className="w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-[1.2vw] h-[1.2vw] text-gray-400" />
            </button>
          </div>

          <div className="px-[1vw] py-[0.5vw]">
            <h3 className="text-[0.85vw] font-semibold text-gray-900 mb-[0.2vw]">Upload your Image</h3>
            <p className="text-[0.7vw] text-gray-400 mb-[1vw]">
              <span>You Can Reuse The File Which Is Uploaded In Gallery</span>
              <span className="text-red-500">*</span>
            </p>
            <div
              onClick={() => galleryInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  handleModalFileUpload({ target: { files: [file] } });
                }
              }}
              className="w-full h-[12vh] rounded-2xl flex flex-col items-center justify-center bg-white hover:bg-indigo-50  transition-all cursor-pointer group "
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
            >
              <p className="text-[0.9vw] text-gray-600 font-semibold mb-[0.5vw]">Drag & Drop or <span className="text-[#4F46E5] font-semibold">Upload</span></p>
              <Icon icon="lucide:upload" className="w-[1.2vw] h-[1.2vw] text-gray-400 mb-2" />
              <div className="flex flex-col items-center">
                <span className="text-[0.7vw] font-semibold text-gray-500">Supported File</span>
                <span className="text-[0.7vw] font-semibold text-gray-500">Image, Video, Audio, GIF, SVG</span>
              </div>
            </div>
            <input type="file" ref={galleryInputRef} onChange={handleModalFileUpload} accept="image/*" className="hidden" />
          </div>

          <div className="custom-scrollbar overflow-y-auto px-[1vw] py-[0.5vw] flex-1">
            <h3 className="text-[0.85vw] font-semibold text-gray-900 mb-[0.5vw]">Uploaded Images</h3>
            {uploadedImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-[0.5vw]">
                {uploadedImages.map((img, index) => (
                  <div key={img.id || index} className="group cursor-pointer flex flex-col items-center" onClick={() => setLocalGallerySelected(img)}>
                    <div className={`aspect-square w-full rounded-[0.5vw] overflow-hidden border-[0.15vw] transition-all ${localGallerySelected?.id === img.id ? 'border-indigo-600 shadow-md scale-[1.02]' : 'hover:border-indigo-400 border-gray-100'}`}>
                      <img src={img.url} className="w-full h-full object-cover" alt="" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-[2vw] text-gray-400">
                <p className="text-[0.8vw]">No uploaded images yet</p>
              </div>
            )}
          </div>

          <div className="p-[0.75vw] border-t flex justify-end gap-[0.5vw] bg-white mt-auto">
            <button
              onClick={() => { setShowGallery(false); setLocalGallerySelected(null); }}
              className="flex-1 h-[2vw] border border-gray-300 rounded-[0.5vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.3vw] hover:bg-gray-50"
            >
              <X size="0.9vw" /> Close
            </button>
            <button
              onClick={() => {
                if (localGallerySelected) {
                  onUpdateBackground({
                    ...backgroundSettings,
                    style: 'Image',
                    image: localGallerySelected.url,
                    fit: backgroundSettings.fit || 'Cover',
                    reactBitType: null
                  });
                  setShowGallery(false);
                }
              }}
              disabled={!localGallerySelected}
              className={`flex-1 h-[2vw] rounded-[0.5vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.3vw] transition-all ${localGallerySelected ? 'bg-black text-white hover:bg-zinc-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <Check size="0.9vw" /> Place
            </button>
          </div>
        </div>
      )}
      {/* Background Crop Overlay */}
      {showBgCropOverlay && backgroundSettings.image && (
        <ImageCropOverlay
          imageSrc={backgroundSettings.image}
          element={null}
          onSave={(cropData) => {
            onUpdateBackground({ ...backgroundSettings, cropData });
            setShowBgCropOverlay(false);
          }}
          onCancel={() => setShowBgCropOverlay(false)}
        />
      )}
      
      {replaceTarget && (
        <ReplaceMediaModal
          show={!!replaceTarget}
          onClose={() => setReplaceTarget(null)}
          onReplace={(file) => {
            if (replaceTarget === 'image') {
              handleImageReplace(file);
            } else if (replaceTarget === 'video') {
              handleVideoReplace(file);
            }
          }}
          mediaType={replaceTarget === 'image' ? 'image' : 'video'}
        />
      )}
    </div>
  );
};

export default BackgroundSection;




