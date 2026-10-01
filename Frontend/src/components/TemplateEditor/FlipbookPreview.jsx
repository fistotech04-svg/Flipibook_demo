import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PreviewArea from '../CustomizedEditor/PreviewArea';
import { LAYOUT_DEFAULT_COLORS } from '../CustomizedEditor/Layout';
import { Icon } from '@iconify/react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getFromDB } from '../../utils/dbUtils';
import useDeviceDetection from '../../hooks/useDeviceDetection';


const AttachedCurve = ({ position }) => {
  const isTop = position.includes('top');
  const isLeft = position.includes('left');

  const containerStyle = {
    position: 'absolute',
    width: '1vw',
    height: '1vw',
    pointerEvents: 'none',
    overflow: 'hidden',
    ...(isTop ? { top: '-1vw' } : { bottom: '-1vw' }),
    ...(isLeft ? { left: '0vw' } : { right: '0.25vw' }),
  };

  const circleStyle = {
    position: 'absolute',
    width: '2vw',
    height: '2vw',
    borderRadius: '50%',
    boxShadow: '0 0 0 2vw black',
    ...(isTop ? { top: '-1vw' } : { bottom: '-1vw' }),
    ...(isLeft ? { right: '-1vw' } : { left: '-1vw' }),
  };

  return (
    <div style={containerStyle}>
      <div style={circleStyle} />
    </div>
  );
};

import Interaction3DPreview from './Interaction3DPreview';

const parseInitialSettings = (inputSettings, v_id, isPublishedPreview) => {
  let cachedLogo = null;
  let cachedWatermark = null;
  let cachedProfile = null;
  let cachedPreloader = null;
  let cachedAppearance = null;

  // Only check local cache for non-published editor preview
  if (v_id && !isPublishedPreview) {
    try {
      const aSaved = localStorage.getItem(`customized_editor_appearance_${v_id}`);
      if (aSaved) {
        const parsed = JSON.parse(aSaved);
        cachedAppearance = parsed.appearance || parsed.bookAppearanceSettings || parsed;
      }
      const bSaved = localStorage.getItem(`customized_editor_branding_${v_id}`);
      if (bSaved) {
        const parsed = JSON.parse(bSaved);
        cachedLogo = parsed.logo || parsed.logoSettings || parsed.Branding?.logoSettings;
        cachedWatermark = parsed.watermark || parsed.watermarkSettings || parsed.Branding?.watermarkSettings;
        cachedProfile = parsed.profile || parsed.profileSettings || parsed.Branding?.profileSettings;
        cachedPreloader = parsed.preloader || parsed.preloaderSettings || parsed.Branding?.preloaderSettings;
      }
    } catch (e) { }
  }

  const bObj = inputSettings?.Branding || inputSettings?.Customized_Settings?.Branding || {};
  const appObj = inputSettings?.appearance || inputSettings?.bookAppearanceSettings || inputSettings?.BookAppearance || inputSettings?.Customized_Settings?.BookAppearance || inputSettings?.Customized_Settings?.Appearance || cachedAppearance || {};
  const otherObj = inputSettings?.othersetup || inputSettings?.otherSetupSettings || inputSettings?.otherSetup || inputSettings?.Customized_Settings?.otherSetup || {};

  return {
    ...(inputSettings || {}),
    logo: inputSettings?.logo || inputSettings?.logoSettings || bObj.logoSettings || cachedLogo,
    watermark: inputSettings?.watermark || inputSettings?.watermarkSettings || bObj.watermarkSettings || cachedWatermark,
    preloader: inputSettings?.preloader || inputSettings?.preloaderSettings || bObj.preloaderSettings || bObj.preloader || inputSettings?.Customized_Settings?.Branding?.preloaderSettings || cachedPreloader || null,
    profile: inputSettings?.profile || inputSettings?.profileSettings || bObj.profileSettings || cachedProfile,
    appearance: appObj,
    bookAppearanceSettings: appObj,
    BookAppearance: appObj,
    othersetup: otherObj,
    otherSetupSettings: otherObj,
    otherSetup: otherObj
  };
};

const FlipbookPreview = ({ pages, pageName, bookName, onClose, isMobile: isMobileProp, isDoublePage, settings, targetPage, v_id: propVId, isPublishedPreview, isLoadingParent = false, currentBook }) => {
  const params = useParams();
  const v_id = propVId || params.v_id || params.shareId || settings?.shareId || settings?.v_id;
  const [localSettings, setLocalSettings] = useState(() => parseInitialSettings(settings, v_id, isPublishedPreview));
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setLocalSettings(parseInitialSettings(settings, v_id, isPublishedPreview));
    }
  }, [settings, v_id, isPublishedPreview]);

  useEffect(() => {
    let progressInterval;
    if (isLoading) {
      progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            if (settingsLoaded) {
              setTimeout(() => setIsLoading(false), 300);
            }
            return 100;
          }
          const increment = prev < 80 ? 5 : (settingsLoaded ? 10 : 1);
          return Math.min(prev + increment, 100);
        });
      }, 50);
    }
    return () => clearInterval(progressInterval);
  }, [isLoading, settingsLoaded]);

  useEffect(() => {
    if (Object.keys(localSettings).length > 0 && !isLoadingParent) {
      setSettingsLoaded(true);
    }
  }, [localSettings, isLoadingParent]);
  // 3D model states moved to PreviewArea

  useEffect(() => {
    // Clear any previously played animations in this session so they replay when preview is opened
    try {
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('fisto_anim_played_')) {
                sessionStorage.removeItem(key);
            }
        });
    } catch (err) {}

    return () => {
      try {
        if (window._activePreviewAudio) {
          window._activePreviewAudio.pause();
          window._activePreviewAudio = null;
          window._activePreviewAudioEl = null;
        }
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        let finalSettings = { ...(settings || {}) };

        // Ensure logo/watermark/preloader/menuBar/background/appearance are extracted if passed via exact Customized_Settings schema objects
        const bObj = finalSettings.Customized_Settings?.Branding || finalSettings.Branding || {};
        if (bObj.logoSettings) finalSettings.logo = bObj.logoSettings;
        if (bObj.watermarkSettings) finalSettings.watermark = bObj.watermarkSettings;
        if (bObj.preloaderSettings) finalSettings.preloader = bObj.preloaderSettings;

        const bgObj = finalSettings.Customized_Settings?.Background || finalSettings.Background;
        if (bgObj) finalSettings.background = bgObj;

        const appObj = finalSettings.Customized_Settings?.BookAppearance || finalSettings.BookAppearance;
        if (appObj) finalSettings.appearance = appObj;

        const mObj = finalSettings.Customized_Settings?.MenuBar || finalSettings.MenuBar || {};
        if (mObj && Object.keys(mObj).length > 0) {
          finalSettings.menubar = mObj;
          finalSettings.menuBar = mObj;
          finalSettings.menuBarSettings = mObj;
        }

        const lObj = finalSettings.Customized_Settings?.Layouts || finalSettings.Layouts || {};
        if (lObj.layoutStyle !== undefined) finalSettings.layout = lObj.layoutStyle;
        if (lObj.layoutColors) finalSettings.layoutColors = lObj.layoutColors;

        const oSetup = finalSettings.Customized_Settings?.otherSetup || finalSettings.otherSetup;
        if (oSetup) {
          finalSettings.otherSetup = oSetup;
          finalSettings.othersetup = oSetup;
        }

        const lfObj = finalSettings.Customized_Settings?.leadForm || finalSettings.leadForm;
        if (lfObj) {
          finalSettings.leadForm = lfObj;
          finalSettings.leadform = lfObj;
        }

        // Try getting local unsaved state ONLY if NOT in published preview mode
        if (!isPublishedPreview) {
          try {
            const appearance = await getFromDB(`customized_editor_appearance_${v_id || 'default'}`);
            if (appearance) {
              if (appearance.background) finalSettings.background = appearance.background;
              if (appearance.appearance) finalSettings.appearance = appearance.appearance;
              if (appearance.layout) finalSettings.layout = appearance.layout;
              if (appearance.layoutColors) finalSettings.layoutColors = appearance.layoutColors;
            }
            const branding = await getFromDB(`customized_editor_branding_${v_id || 'default'}`);
            if (branding) {
              if (branding.logoSettings) finalSettings.logo = branding.logoSettings;
              if (branding.watermarkSettings) finalSettings.watermark = branding.watermarkSettings;
              if (branding.preloaderSettings) finalSettings.preloader = branding.preloaderSettings;
            }
            const setup = await getFromDB(`customized_editor_setup_${v_id || 'default'}`);
            if (setup) {
              const localMB = setup.MenuBar || setup.menuBar;
              if (localMB) {
                finalSettings.menubar = localMB;
                finalSettings.menuBar = localMB;
                finalSettings.menuBarSettings = localMB;
              }
              if (setup.otherSetup) finalSettings.othersetup = setup.otherSetup;
              if (setup.leadForm) finalSettings.leadform = setup.leadForm;
              if (setup.visibility) finalSettings.visibility = setup.visibility;
            }
          } catch (e) {
            console.error("Failed to load local DB settings", e);
          }
        }

        // If we didn't get them from local DB, fallback to backend if v_id exists
        if ((!finalSettings.appearance || !finalSettings.logo || !finalSettings.preloader) && v_id) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

            const res = await axios.get(`${backendUrl}/api/flipbook/get`, {
              params: { emailId: user.emailId, v_id, metadataOnly: true }
            });

            if (res.data) {
              const backendBranding = res.data.Customized_Settings?.Branding || res.data.settings?.Branding || {};
              finalSettings = {
                ...finalSettings,
                ...(res.data.meta || {}),
                ...(res.data.settings || {}),
                logo: finalSettings.logo || backendBranding.logoSettings || res.data.settings?.logo || res.data.settings?.logoSettings,
                watermark: finalSettings.watermark || backendBranding.watermarkSettings || res.data.settings?.watermark || res.data.settings?.watermarkSettings,
                preloader: finalSettings.preloader || backendBranding.preloaderSettings || res.data.Customized_Settings?.Branding?.preloaderSettings || res.data.settings?.preloader || res.data.settings?.preloaderSettings,
                profile: finalSettings.profile || backendBranding.profileSettings || res.data.settings?.profile || res.data.settings?.profileSettings
              };
            }
          }
        }

        if (Object.keys(finalSettings).length > 0) {
          setLocalSettings(finalSettings);
        }
      } catch (err) {
        console.error('Failed to fetch settings for preview', err);
      }
    };

    fetchSettings();
  }, [settings, v_id]);

  const { isMobile: deviceIsMobile, isTablet: deviceIsTablet } = useDeviceDetection();

  const [activeDevice, setActiveDevice] = useState(() => {
    // In Editor mode (onClose exists), respect their saved setting
    if (onClose) {
      return localStorage.getItem('previewDevice') || (isMobileProp ? 'Mobile' : 'Desktop');
    }
    // In Public Shared mode, adapt dynamically to their real physical screen
    if (deviceIsMobile) return 'Mobile';
    if (deviceIsTablet) return 'Tablet';
    return 'Desktop';
  });

  useEffect(() => {
    if (!onClose) {
      if (deviceIsMobile) setActiveDevice('Mobile');
      else if (deviceIsTablet) setActiveDevice('Tablet');
      else setActiveDevice('Desktop');
    }
  }, [deviceIsMobile, deviceIsTablet, onClose]);

  useEffect(() => {
    const handleGlobalDeviceChange = (e) => {
      setActiveDevice(e.detail);
    };
    window.addEventListener('previewDeviceChange', handleGlobalDeviceChange);
    return () => window.removeEventListener('previewDeviceChange', handleGlobalDeviceChange);
  }, []);

  // 3D viewer is handled natively by PreviewArea now.

  const handleDeviceChange = (device) => {
    setActiveDevice(device);
    localStorage.setItem('previewDevice', device);
    window.dispatchEvent(new CustomEvent('previewDeviceChange', { detail: device }));
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef();

  const [isDraggerExpanded, setIsDraggerExpanded] = useState(false);
  const [draggerTabTop, setDraggerTabTop] = useState(150);
  const [draggerTabLeft, setDraggerTabLeft] = useState(-1);
  const [isDraggerDragging, setIsDraggerDragging] = useState(false);
  const draggerHasMovedRef = useRef(false);
  const draggerOffsetRef = useRef({ x: 0, y: 0 });

  // Initialize position relative to container once available
  useEffect(() => {
    if (containerRef.current && draggerTabLeft === -1) {
      const draggerWidth = (window.innerWidth * 4) / 100;
      setDraggerTabLeft(window.innerWidth - draggerWidth);
    }
  }, [draggerTabLeft]);

  const handleDraggerMouseDown = (e) => {
    e.preventDefault();
    setIsDraggerDragging(true);
    draggerHasMovedRef.current = false;

    const draggerWidth = (window.innerWidth * 4) / 100;
    let currentLeft = draggerTabLeft;
    if (draggerTabLeft < 5) currentLeft = 0;
    else if (draggerTabLeft >= 10) currentLeft = window.innerWidth - draggerWidth;

    setDraggerTabLeft(currentLeft);

    const rect = e.currentTarget.getBoundingClientRect();
    draggerOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggerDragging || !containerRef.current) return;
      draggerHasMovedRef.current = true;
      const rect = containerRef.current.getBoundingClientRect();
      const newTop = e.clientY - rect.top - draggerOffsetRef.current.y;
      const newLeft = e.clientX - rect.left - draggerOffsetRef.current.x;
      const draggerWidth = (window.innerWidth * 4) / 100;
      const draggerHeight = isDraggerExpanded ? (window.innerWidth * 14) / 100 : draggerWidth;
      setDraggerTabTop(Math.max(0, Math.min(newTop, rect.height - draggerHeight)));
      setDraggerTabLeft(Math.max(0, Math.min(newLeft, window.innerWidth - draggerWidth)));
    };

    const handleMouseUp = () => {
      if (isDraggerDragging && containerRef.current) {
        setIsDraggerDragging(false);
        if (!draggerHasMovedRef.current) {
          setIsDraggerExpanded(prev => !prev);
        } else {
          const draggerWidth = (window.innerWidth * 4) / 100;
          const midpoint = window.innerWidth / 2;
          if (draggerTabLeft + draggerWidth / 2 < midpoint) {
            setDraggerTabLeft(0);
          } else {
            setDraggerTabLeft(window.innerWidth - draggerWidth);
          }
        }
      }
    };

    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDraggerTabLeft(prev => {
        const draggerWidth = (window.innerWidth * 4) / 100;
        if (prev > window.innerWidth / 2) return window.innerWidth - draggerWidth;
        return 0;
      });
    };

    if (isDraggerDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDraggerDragging, isDraggerExpanded, draggerTabLeft]);

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);



  // Build CSS variables for active layout colors to match CustomizedEditor exactly
  const layoutColorVars = React.useMemo(() => {
    const activeIdx = localSettings?.layout || 1;
    const defaults = LAYOUT_DEFAULT_COLORS[activeIdx] || [];
    const saved = localSettings?.layoutColors?.[activeIdx] || [];

    const mergedColors = defaults.map((c) => {
      const savedItem = saved.find(s => s && s.id === c.id);
      return {
        ...c,
        ...(savedItem ? savedItem : {})
      };
    });

    const vars = mergedColors.map((c, i) => {
      const hex = c.hex || '#ffffff';
      const op = (c.opacity ?? 100) / 100;
      const r = parseInt(hex.slice(1, 3), 16) || 0;
      const g = parseInt(hex.slice(3, 5), 16) || 0;
      const b = parseInt(hex.slice(5, 7), 16) || 0;

      const varName = c.id || `layout-color-${i}`;
      return `--${varName}: ${hex}; --${varName}-opacity: ${op}; --${varName}-rgb: ${r},${g},${b};`;
    }).join(' ');

    const hasExplicitIcon = mergedColors.some(c => c.id === 'dropdown-icon');
    const textColor = mergedColors.find(c => c.id === 'dropdown-text');
    if (!hasExplicitIcon && textColor) {
      const hex = textColor.hex || '#ffffff';
      const r = parseInt(hex.slice(1, 3), 16) || 0;
      const g = parseInt(hex.slice(3, 5), 16) || 0;
      const b = parseInt(hex.slice(5, 7), 16) || 0;
      return vars + ` --dropdown-icon: ${hex}; --dropdown-icon-opacity: 0.7; --dropdown-icon-rgb: ${r},${g},${b};`;
    }

    return vars;
  }, [localSettings?.layout, localSettings?.layoutColors]);

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-[1000] flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: '#ffffff',
        ...(layoutColorVars ? Object.fromEntries(layoutColorVars.split(';').filter(Boolean).map(v => v.split(':').map(s => s.trim()))) : {})
      }}
    >
      <style>{`:root { ${layoutColorVars} }`}</style>
      {/* Draggable Device Settings - Desktop only: inside screen */}
      {(() => {
        if (!onClose || activeDevice !== 'Desktop') return null;
        const settingsContent = (
          <>
            {/* Persistent vertical line on the stuck edge */}
            {!isDraggerDragging && containerRef.current && (
              <div
                className="fixed top-0 w-[0.25vw] h-full bg-black z-[1999] pointer-events-none transition-all duration-500 ease-in-out"
                style={{
                  left: draggerTabLeft < 5 ? '0' : 'auto',
                  right: draggerTabLeft >= 10 ? '0' : 'auto',
                  opacity: (draggerTabLeft < 5 || draggerTabLeft >= 10) ? 1 : 0
                }}
              />
            )}

            <div
              className={`fixed z-[2000] bg-black text-white py-[0.5vw] px-[0.5vw] flex flex-col items-center justify-between pointer-events-auto cursor-grab active:cursor-grabbing ${isDraggerDragging ? 'rounded-[0.8vw] shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'transition-all duration-500 ease-in-out ' + (draggerTabLeft < 10 ? 'rounded-r-[0.8vw] rounded-l-none shadow-none' : 'rounded-l-[0.8vw] rounded-r-none shadow-none')
                }`}
              style={{
                top: `${draggerTabTop}px`,
                left: isDraggerDragging ? `${draggerTabLeft}px` : (draggerTabLeft < 5 ? '0' : 'auto'),
                right: isDraggerDragging ? 'auto' : (draggerTabLeft < 5 ? 'auto' : '0'),
                width: '4vw'
              }}
              onMouseDown={handleDraggerMouseDown}
              onClick={(e) => e.stopPropagation()}
            >
              {!isDraggerDragging && draggerTabLeft < 10 && (
                <>
                  <AttachedCurve position="top-left" />
                  <AttachedCurve position="bottom-left" />
                </>
              )}
              {!isDraggerDragging && draggerTabLeft >= 10 && (
                <>
                  <AttachedCurve position="top-right" />
                  <AttachedCurve position="bottom-right" />
                </>
              )}

              <div className="flex flex-col gap-[0.2vw] w-full items-center">
                <div className="flex flex-col items-center justify-center w-full">
                  <div
                    className={`flex flex-col items-center transition-all duration-300 overflow-hidden ${isDraggerExpanded ? 'bg-[#2A2A2A] rounded-[0.4vw] py-[0.5vw] h-[7vw] w-[2.3vw]' : 'bg-transparent group cursor-pointer'} w-[1.8vw]`}
                    onMouseDown={(e) => { if (!isDraggerExpanded) e.stopPropagation(); }}
                    onClick={(e) => {
                      if (!isDraggerExpanded) {
                        e.stopPropagation();
                        setIsDraggerExpanded(true);
                      }
                    }}
                  >
                    {!isDraggerExpanded ? (
                      <>
                        <div className="w-full h-[1.5vw] flex items-center justify-center flex-shrink-0">
                          <Icon icon={activeDevice === 'Desktop' ? 'mynaui:desktop' : activeDevice === 'Tablet' ? 'proicons:tablet' : 'mynaui:mobile'} className="w-[1.8vw] h-[1.8vw] text-white" />
                        </div>
                        <div className="mt-[0.2vw]">
                          <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw] text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col w-full h-full justify-between items-center">
                        {['Desktop', 'Tablet', 'Mobile'].map((device) => (
                          <div
                            key={device}
                            className="w-full flex items-center justify-center cursor-pointer py-[0.2vw]"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeviceChange(device);
                              setIsDraggerExpanded(false);
                            }}
                          >
                            <Icon icon={device === 'Desktop' ? 'mynaui:desktop' : device === 'Tablet' ? 'proicons:tablet' : 'mynaui:mobile'} className={`w-[1.5vw] h-[1.5vw] ${activeDevice === device ? 'text-white' : 'text-gray-400 hover:text-white'}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="flex flex-col items-center gap-[0.2vw] py-[0.2vw] px-[0.4vw] rounded-xl group transition-all cursor-pointer w-full text-[#ff3333]"
                  title="Exit Preview"
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Icon icon="lucide:log-out" className="w-[1.2vw] h-[1.2vw] transition-transform group-hover:scale-110" />
                </button>
              </div>
            </div>
          </>
        );
        if (isFullscreen && document.fullscreenElement) {
          return createPortal(settingsContent, document.fullscreenElement);
        }
        return settingsContent;
      })()}

      <PreviewArea
        bookName={pageName || bookName}
        pages={pages}
        targetPage={targetPage}
        logoSettings={localSettings?.logo || localSettings?.logoSettings || localSettings?.Branding?.logoSettings}
        watermarkSettings={localSettings?.watermark || localSettings?.watermarkSettings || localSettings?.Branding?.watermarkSettings}
        backgroundSettings={localSettings?.background}
        bookAppearanceSettings={localSettings?.appearance || localSettings?.bookAppearanceSettings || settings?.appearance || settings?.bookAppearanceSettings}
        menuBarSettings={localSettings?.menuBarSettings || localSettings?.menuBar || localSettings?.menubar || localSettings?.MenuBar || localSettings?.Customized_Settings?.MenuBar || settings?.menuBarSettings || settings?.menuBar || settings?.menubar || settings?.MenuBar}
        leadFormSettings={localSettings?.leadForm || localSettings?.leadform || localSettings?.Customized_Settings?.leadForm || localSettings?.settings?.leadForm || settings?.leadForm || settings?.leadform}
        profileSettings={localSettings?.profile || localSettings?.profileSettings || localSettings?.Branding?.profileSettings}
        otherSetupSettings={localSettings?.othersetup}
        activeLayout={localSettings?.layout || 1}
        layoutColors={localSettings?.layoutColors}
        settings={localSettings}
        hideHeader={false}
        onClose={onClose}
        activeDevice={activeDevice}
        isDoublePage={isDoublePage}
        useNativeFullscreen={true}
        disableAutoGallery={true}
        isPublishedPreview={true}
        currentBook={currentBook || settings}
        v_id={v_id}
        shareId={propVId || v_id || params?.shareId || settings?.shareId}
      />

      {/* Draggable Device Settings - Tablet/Mobile: outside device frame */}
      {(() => {
        if (!onClose || (activeDevice !== 'Tablet' && activeDevice !== 'Mobile')) return null;
        const settingsContent = (
          <>
            {!isDraggerDragging && containerRef.current && (
              <div
                className="fixed top-0 w-[0.25vw] h-full bg-black z-[1999] pointer-events-none transition-all duration-500 ease-in-out"
                style={{
                  left: draggerTabLeft < 5 ? '0' : 'auto',
                  right: draggerTabLeft >= 10 ? '0' : 'auto',
                  opacity: (draggerTabLeft < 5 || draggerTabLeft >= 10) ? 1 : 0
                }}
              />
            )}

            <div
              className={`fixed z-[2000] bg-black text-white py-[0.5vw] px-[0.5vw] flex flex-col items-center justify-between pointer-events-auto cursor-grab active:cursor-grabbing ${isDraggerDragging ? 'rounded-[0.8vw] shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'transition-all duration-500 ease-in-out ' + (draggerTabLeft < 10 ? 'rounded-r-[0.8vw] rounded-l-none shadow-none' : 'rounded-l-[0.8vw] rounded-r-none shadow-none')
                }`}
              style={{
                top: `${draggerTabTop}px`,
                left: isDraggerDragging ? `${draggerTabLeft}px` : (draggerTabLeft < 5 ? '0' : 'auto'),
                right: isDraggerDragging ? 'auto' : (draggerTabLeft < 5 ? 'auto' : '0'),
                width: '4vw'
              }}
              onMouseDown={handleDraggerMouseDown}
              onClick={(e) => e.stopPropagation()}
            >
              {!isDraggerDragging && draggerTabLeft < 10 && (
                <>
                  <AttachedCurve position="top-left" />
                  <AttachedCurve position="bottom-left" />
                </>
              )}
              {!isDraggerDragging && draggerTabLeft >= 10 && (
                <>
                  <AttachedCurve position="top-right" />
                  <AttachedCurve position="bottom-right" />
                </>
              )}

              <div className="flex flex-col gap-[0.2vw] w-full items-center">
                <div className="flex flex-col items-center justify-center w-full">
                  <div
                    className={`flex flex-col items-center transition-all duration-300 overflow-hidden ${isDraggerExpanded ? 'bg-[#2A2A2A] rounded-[0.4vw] py-[0.5vw] h-[7vw] w-[2.3vw]' : 'bg-transparent group cursor-pointer'} w-[1.8vw]`}
                    onMouseDown={(e) => { if (!isDraggerExpanded) e.stopPropagation(); }}
                    onClick={(e) => {
                      if (!isDraggerExpanded) {
                        e.stopPropagation();
                        setIsDraggerExpanded(true);
                      }
                    }}
                  >
                    {!isDraggerExpanded ? (
                      <>
                        <div className="w-full h-[1.5vw] flex items-center justify-center flex-shrink-0">
                          <Icon icon={activeDevice === 'Desktop' ? 'mynaui:desktop' : activeDevice === 'Tablet' ? 'proicons:tablet' : 'mynaui:mobile'} className="w-[1.8vw] h-[1.8vw] text-white" />
                        </div>
                        <div className="mt-[0.2vw]">
                          <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw] text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col w-full h-full justify-between items-center">
                        {['Desktop', 'Tablet', 'Mobile'].map((device) => (
                          <div
                            key={device}
                            className="w-full flex items-center justify-center cursor-pointer py-[0.2vw]"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeviceChange(device);
                              setIsDraggerExpanded(false);
                            }}
                          >
                            <Icon icon={device === 'Desktop' ? 'mynaui:desktop' : device === 'Tablet' ? 'proicons:tablet' : 'mynaui:mobile'} className={`w-[1.5vw] h-[1.5vw] ${activeDevice === device ? 'text-white' : 'text-gray-400 hover:text-white'}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="flex flex-col items-center gap-[0.2vw] py-[0.2vw] px-[0.4vw] rounded-xl group transition-all cursor-pointer w-full text-[#ff3333]"
                  title="Exit Preview"
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Icon icon="lucide:log-out" className="w-[1.2vw] h-[1.2vw] transition-transform group-hover:scale-110" />
                </button>
              </div>
            </div>
          </>
        );
        if (isFullscreen && document.fullscreenElement) {
          return createPortal(settingsContent, document.fullscreenElement);
        }
        return settingsContent;
      })()}

      {/* 3D viewer rendering is handled natively by PreviewArea */}

      {(() => {
        const preloader = localSettings?.preloader || localSettings?.preloaderSettings || settings?.preloader || settings?.preloaderSettings || settings?.Branding?.preloaderSettings || {
          text: 'Loading Modal Please Wait....',
          bgColor: '#2D2F33',
          textColor: '#ffffff',
          spinnerColor: '#3B3C8A',
          showPercentage: true,
          layout: 'spinner'
        };

        if (!isLoading) return null;

        return (
          <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-300"
            style={{
              backgroundColor: preloader.bgColor || '#2D2F33',
              color: preloader.textColor || '#ffffff',
              opacity: loadingProgress === 100 ? 0 : 1,
              pointerEvents: 'none'
            }}
          >
            <div className="flex flex-col items-center gap-6">
              {preloader?.layout !== 'spinner' && preloader?.logo && (
                <img src={preloader.logo} alt="Preloader Logo" className="h-[60px] object-contain" />
              )}
              {preloader.layout === 'bar' ? (
                <div className="flex flex-col items-center gap-3 w-[250px]">
                  <div className="w-full bg-gray-600/40 h-[6px] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-75"
                      style={{
                        width: `${loadingProgress}%`,
                        backgroundColor: preloader.spinnerColor || '#3B3C8A'
                      }}
                    ></div>
                  </div>
                  {preloader.showPercentage && (
                    <span className="text-sm font-semibold">{loadingProgress}%</span>
                  )}
                </div>
              ) : preloader.layout === 'dots' ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: preloader.spinnerColor || '#3B3C8A' }}></div>
                    <div className="w-3 h-3 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: preloader.spinnerColor || '#3B3C8A' }}></div>
                    <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: preloader.spinnerColor || '#3B3C8A' }}></div>
                  </div>
                  {preloader.showPercentage && (
                    <span className="text-sm font-semibold">{loadingProgress}%</span>
                  )}
                </div>
              ) : (
                // circular spinner
                <div className="relative flex flex-col items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`${preloader?.logo ? 'w-[80px] h-[80px]' : 'w-12 h-12'} border-4 border-t-transparent rounded-full animate-spin`}
                      style={{
                        borderColor: `${preloader.spinnerColor || '#3B3C8A'} ${preloader.spinnerColor || '#3B3C8A'} ${preloader.spinnerColor || '#3B3C8A'} transparent`
                      }}
                    ></div>
                    {preloader?.logo && (
                      <img src={preloader.logo} alt="Preloader Logo" className="absolute h-[45px] max-w-[60px] object-contain" />
                    )}
                    {preloader.showPercentage && !preloader?.logo && (
                      <span className="absolute text-[11px] font-bold">{loadingProgress}%</span>
                    )}
                  </div>
                  {preloader.showPercentage && preloader?.logo && (
                    <span className="text-[11px] font-bold mt-2">{loadingProgress}%</span>
                  )}
                </div>
              )}
              <p
                className="text-base font-semibold text-center max-w-[300px] truncate"
                style={{ fontFamily: preloader.font || 'Poppins' }}
              >
                {preloader.text || 'Loading Modal Please Wait....'}
              </p>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default FlipbookPreview;
